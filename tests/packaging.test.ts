import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Cross-Cutting Packaging & Native Messaging Suite (PRD Section 15 & Epic 0.3)', () => {
  const rootDir = path.resolve(__dirname, '..');
  const extDir = path.join(rootDir, 'extension');
  const packagingDir = path.join(rootDir, 'packaging', 'native-host');
  const scriptsDir = path.join(rootDir, 'scripts');

  describe('Chromium Browser Extension Manifest (Chrome & Edge)', () => {
    it('contains valid Manifest V3 structure, deterministic public key, and permissions', () => {
      const manifestPath = path.join(extDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toContain('Tabsed');
      expect(manifest.version).toBe('1.0.0');

      // Deterministic extension public key for stable extension ID across all installations
      expect(manifest.key).toBeDefined();
      expect(typeof manifest.key).toBe('string');
      expect(manifest.key.length).toBeGreaterThan(100);

      // Permissions
      expect(manifest.permissions).toContain('tabs');
      expect(manifest.permissions).toContain('activeTab');
      expect(manifest.permissions).toContain('storage');
      expect(manifest.permissions).toContain('nativeMessaging');
      expect(manifest.host_permissions).toContain('<all_urls>');

      // Background worker
      expect(manifest.background.service_worker).toBe('background.js');
      expect(fs.existsSync(path.join(extDir, manifest.background.service_worker))).toBe(true);

      // Popup
      expect(manifest.action.default_popup).toBe('popup.html');
      expect(fs.existsSync(path.join(extDir, manifest.action.default_popup))).toBe(true);
      expect(fs.existsSync(path.join(extDir, 'popup.js'))).toBe(true);
      expect(fs.existsSync(path.join(extDir, 'styles.css'))).toBe(true);
    });

    it('verifies all extension icon files exist', () => {
      const manifest = JSON.parse(fs.readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
      for (const size of ['16', '48', '128']) {
        const iconPath = manifest.icons[size];
        expect(iconPath).toBeDefined();
        expect(fs.existsSync(path.join(extDir, iconPath))).toBe(true);
      }
    });
  });

  describe('Mozilla Firefox Extension Manifest', () => {
    it('contains valid gecko extension settings and background script config', () => {
      const ffManifestPath = path.join(extDir, 'manifest.firefox.json');
      expect(fs.existsSync(ffManifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(ffManifestPath, 'utf8'));
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.browser_specific_settings?.gecko?.id).toBe('tabsed@tabsed.com');
      expect(manifest.permissions).toContain('nativeMessaging');
      expect(manifest.background.scripts).toContain('background.js');
    });
  });

  describe('Windows Native Messaging Manifests & Scripts', () => {
    it('validates Chromium host manifest (com.tabsed.app.json) strictly: valid origins and no wildcards', () => {
      const manifestPath = path.join(packagingDir, 'com.tabsed.app.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.name).toBe('com.tabsed.app');
      expect(manifest.type).toBe('stdio');
      expect(manifest.allowed_origins).toBeDefined();
      expect(manifest.allowed_origins.length).toBeGreaterThan(0);

      // Verify each origin is a valid chrome-extension URI format without illegal wildcards
      for (const origin of manifest.allowed_origins) {
        expect(origin).not.toContain('*');
        expect(origin).toMatch(/^chrome-extension:\/\/[a-z0-9]+\/$/);
      }

      // Must contain deterministic extension ID derived from extension/manifest.json key
      expect(manifest.allowed_origins).toContain('chrome-extension://jmghbppchdmgjiaikmngccdddfmbghgj/');
    });

    it('validates Firefox host manifest (com.tabsed.app-firefox.json)', () => {
      const manifestPath = path.join(packagingDir, 'com.tabsed.app-firefox.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.name).toBe('com.tabsed.app');
      expect(manifest.type).toBe('stdio');
      expect(manifest.allowed_extensions).toContain('tabsed@tabsed.com');
    });

    it('validates Windows registration scripts exist and reference registry targets', () => {
      const batInstaller = path.join(packagingDir, 'install_host.bat');
      const psInstaller = path.join(packagingDir, 'install_host.ps1');
      const hostBat = path.join(packagingDir, 'host.bat');
      const hostCjs = path.join(packagingDir, 'host.cjs');

      expect(fs.existsSync(batInstaller)).toBe(true);
      expect(fs.existsSync(psInstaller)).toBe(true);
      expect(fs.existsSync(hostBat)).toBe(true);
      expect(fs.existsSync(hostCjs)).toBe(true);

      const batContent = fs.readFileSync(batInstaller, 'utf8');
      expect(batContent).toContain('HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.tabsed.app');
      expect(batContent).toContain('HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\com.tabsed.app');
      expect(batContent).toContain('HKCU\\Software\\Mozilla\\NativeMessagingHosts\\com.tabsed.app');

      const psContent = fs.readFileSync(psInstaller, 'utf8');
      expect(psContent).toContain('HKCU:\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.tabsed.app');
      expect(psContent).toContain('HKCU:\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\com.tabsed.app');
    });
  });

  describe('Packaging Script Execution & Release Outputs', () => {
    it('verifies package-extensions.cjs script creates unpacked & zip archives', () => {
      const scriptPath = path.join(scriptsDir, 'package-extensions.cjs');
      expect(fs.existsSync(scriptPath)).toBe(true);

      // Run packaging script to generate fresh release artifacts
      execSync(`node "${scriptPath}"`, { cwd: rootDir, stdio: 'pipe' });

      const distExt = path.join(rootDir, 'dist', 'extensions');
      const unpackedChromium = path.join(distExt, 'unpacked-chromium');
      const unpackedFirefox = path.join(distExt, 'unpacked-firefox');
      const chromiumZip = path.join(distExt, 'tabsed-chromium-v1.0.0.zip');
      const firefoxZip = path.join(distExt, 'tabsed-firefox-v1.0.0.zip');

      expect(fs.existsSync(unpackedChromium)).toBe(true);
      expect(fs.existsSync(unpackedFirefox)).toBe(true);
      expect(fs.existsSync(chromiumZip)).toBe(true);
      expect(fs.existsSync(firefoxZip)).toBe(true);

      // Verify manifest in unpacked chromium
      const chromManifest = JSON.parse(fs.readFileSync(path.join(unpackedChromium, 'manifest.json'), 'utf8'));
      expect(chromManifest.manifest_version).toBe(3);
      expect(chromManifest.key).toBeDefined();

      // Verify manifest in unpacked firefox
      const ffManifest = JSON.parse(fs.readFileSync(path.join(unpackedFirefox, 'manifest.json'), 'utf8'));
      expect(ffManifest.browser_specific_settings.gecko.id).toBe('tabsed@tabsed.com');
    });
  });
});
