/**
 * Tabsed Browser Extension Packaging Script
 * Generates unpacked directories and .zip release packages for:
 * 1. Chromium browsers (Google Chrome, Microsoft Edge, Brave)
 * 2. Mozilla Firefox
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const EXT_SRC = path.join(ROOT_DIR, 'extension');
const DIST_EXT = path.join(ROOT_DIR, 'dist', 'extensions');
const UNPACKED_CHROMIUM = path.join(DIST_EXT, 'unpacked-chromium');
const UNPACKED_FIREFOX = path.join(DIST_EXT, 'unpacked-firefox');

console.log('--- Tabsed Extension Packaging ---');

// Clean and create target folders
if (fs.existsSync(DIST_EXT)) {
  fs.rmSync(DIST_EXT, { recursive: true, force: true });
}
fs.mkdirSync(UNPACKED_CHROMIUM, { recursive: true });
fs.mkdirSync(UNPACKED_FIREFOX, { recursive: true });

function copyRecursive(src, dest) {
  const baseName = path.basename(src);
  if (baseName === '.DS_Store' || baseName === 'Thumbs.db' || baseName.endsWith('.tmp')) {
    return;
  }
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
    fs.utimesSync(dest, stat.atime, stat.mtime);
  } else {
    fs.copyFileSync(src, dest);
    fs.utimesSync(dest, stat.atime, stat.mtime);
  }
}

// 1. Package Chromium
console.log('Staging Chromium extension...');
copyRecursive(EXT_SRC, UNPACKED_CHROMIUM);
// Use chromium manifest
if (fs.existsSync(path.join(UNPACKED_CHROMIUM, 'manifest.firefox.json'))) {
  fs.unlinkSync(path.join(UNPACKED_CHROMIUM, 'manifest.firefox.json'));
}

// 2. Package Firefox
console.log('Staging Firefox extension...');
copyRecursive(EXT_SRC, UNPACKED_FIREFOX);
// Replace manifest.json with manifest.firefox.json
const ffManifestSource = path.join(EXT_SRC, 'manifest.firefox.json');
if (fs.existsSync(ffManifestSource)) {
  const ffStat = fs.statSync(ffManifestSource);
  fs.copyFileSync(ffManifestSource, path.join(UNPACKED_FIREFOX, 'manifest.json'));
  fs.utimesSync(path.join(UNPACKED_FIREFOX, 'manifest.json'), ffStat.atime, ffStat.mtime);
  fs.unlinkSync(path.join(UNPACKED_FIREFOX, 'manifest.firefox.json'));
}

// 3. Stage Store Release (Strip 'key' property required by Microsoft Partner Center & Chrome Web Store)
console.log('Staging Store Release package (stripping development key)...');
const STAGING_STORE = path.join(DIST_EXT, 'staging-store-chromium');
if (fs.existsSync(STAGING_STORE)) {
  fs.rmSync(STAGING_STORE, { recursive: true, force: true });
}
fs.mkdirSync(STAGING_STORE, { recursive: true });
copyRecursive(UNPACKED_CHROMIUM, STAGING_STORE);

const storeManifestPath = path.join(STAGING_STORE, 'manifest.json');
if (fs.existsSync(storeManifestPath)) {
  const srcManifestStat = fs.statSync(path.join(EXT_SRC, 'manifest.json'));
  const storeManifest = JSON.parse(fs.readFileSync(storeManifestPath, 'utf8'));
  // Microsoft Partner Center & Chrome Web Store reject any package containing a 'key' field
  delete storeManifest.key;
  fs.writeFileSync(storeManifestPath, JSON.stringify(storeManifest, null, 2) + '\n', 'utf8');
  fs.utimesSync(storeManifestPath, srcManifestStat.atime, srcManifestStat.mtime);
}

// Create ZIP archives
const chromiumZip = path.join(DIST_EXT, 'tabsed-chromium-v1.0.0.zip');
const edgeZip = path.join(DIST_EXT, 'tabsed-edge-v1.0.0.zip');
const firefoxZip = path.join(DIST_EXT, 'tabsed-firefox-v1.0.0.zip');

try {
  console.log('Compressing Chromium store release zip...');
  execSync(`powershell.exe -NoProfile -Command "Compress-Archive -Path '${STAGING_STORE}\\*' -DestinationPath '${chromiumZip}' -Force"`);
  console.log('✓ Created:', chromiumZip);

  console.log('Compressing Microsoft Edge store release zip...');
  execSync(`powershell.exe -NoProfile -Command "Compress-Archive -Path '${STAGING_STORE}\\*' -DestinationPath '${edgeZip}' -Force"`);
  console.log('✓ Created:', edgeZip);

  console.log('Compressing Firefox release zip...');
  execSync(`powershell.exe -NoProfile -Command "Compress-Archive -Path '${UNPACKED_FIREFOX}\\*' -DestinationPath '${firefoxZip}' -Force"`);
  console.log('✓ Created:', firefoxZip);
} catch (e) {
  console.error('Failed to create extension zip archives:', e.message);
  process.exit(1);
} finally {
  // Clean up temporary store staging directory
  if (fs.existsSync(STAGING_STORE)) {
    fs.rmSync(STAGING_STORE, { recursive: true, force: true });
  }
}

console.log('\nExtension packaging completed successfully:');
console.log('- Unpacked Chromium (local dev):', UNPACKED_CHROMIUM);
console.log('- Unpacked Firefox (local dev):', UNPACKED_FIREFOX);
if (fs.existsSync(chromiumZip)) console.log('- Archive Chromium (Store):', chromiumZip, `(${fs.statSync(chromiumZip).size} bytes)`);
if (fs.existsSync(edgeZip)) console.log('- Archive Microsoft Edge (Store):', edgeZip, `(${fs.statSync(edgeZip).size} bytes)`);
if (fs.existsSync(firefoxZip)) console.log('- Archive Firefox:', firefoxZip, `(${fs.statSync(firefoxZip).size} bytes)`);
