import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function vaultSyncMiddlewarePlugin() {
  const getVaultDir = () => {
    const appdata = process.env.APPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Roaming') : path.join(os.homedir(), '.tabsed'));
    return path.join(appdata, 'Tabsed', 'vault');
  };

  return {
    name: 'tabsed-vault-sync-api',
    configureServer(server: any) {
      server.middlewares.use('/api/vault', (req: any, res: any) => {
        const vaultDir = getVaultDir();
        const itemsFile = path.join(vaultDir, 'items.json');
        const syncFile = path.join(vaultDir, 'sync_event.json');

        if (req.url === '/items' && req.method === 'GET') {
          if (fs.existsSync(itemsFile)) {
            try {
              const data = fs.readFileSync(itemsFile, 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
              return;
            } catch {}
          }
          res.setHeader('Content-Type', 'application/json');
          res.end('[]');
          return;
        }

        if (req.url === '/items' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
              fs.writeFileSync(itemsFile, body, 'utf8');
              const now = Date.now();
              fs.writeFileSync(syncFile, JSON.stringify({ type: 'vault_updated', timestamp: now }), 'utf8');
              let mtime = now;
              try { mtime = Math.max(mtime, fs.statSync(itemsFile).mtimeMs, fs.statSync(syncFile).mtimeMs); } catch {}
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, mtime }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/poll')) {
          let mtime = 0;
          if (fs.existsSync(itemsFile)) {
            try { mtime = Math.max(mtime, fs.statSync(itemsFile).mtimeMs); } catch {}
          }
          if (fs.existsSync(syncFile)) {
            try { mtime = Math.max(mtime, fs.statSync(syncFile).mtimeMs); } catch {}
          }
          const urlObj = new URL(req.url, 'http://localhost');
          const since = parseFloat(urlObj.searchParams.get('since') || '0');
          if (mtime > since && fs.existsSync(itemsFile)) {
            try {
              const items = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ changed: true, mtime, items }));
              return;
            } catch {}
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ changed: false, mtime }));
          return;
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), vaultSyncMiddlewarePlugin()],
  server: {
    port: 3000,
    open: false
  },
  build: {
    emptyOutDir: false
  }
});
