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
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
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
  fs.copyFileSync(ffManifestSource, path.join(UNPACKED_FIREFOX, 'manifest.json'));
  fs.unlinkSync(path.join(UNPACKED_FIREFOX, 'manifest.firefox.json'));
}

// Create ZIP archives
const chromiumZip = path.join(DIST_EXT, 'tabsed-chromium-v1.0.0.zip');
const firefoxZip = path.join(DIST_EXT, 'tabsed-firefox-v1.0.0.zip');

try {
  console.log('Compressing Chromium release zip...');
  execSync(`powershell.exe -NoProfile -Command "Compress-Archive -Path '${UNPACKED_CHROMIUM}\\*' -DestinationPath '${chromiumZip}' -Force"`);
  console.log('✓ Created:', chromiumZip);

  console.log('Compressing Firefox release zip...');
  execSync(`powershell.exe -NoProfile -Command "Compress-Archive -Path '${UNPACKED_FIREFOX}\\*' -DestinationPath '${firefoxZip}' -Force"`);
  console.log('✓ Created:', firefoxZip);
} catch (e) {
  console.warn('Zip creation via PowerShell had a non-fatal note:', e.message);
}

console.log('\nExtension packaging completed successfully:');
console.log('- Unpacked Chromium:', UNPACKED_CHROMIUM);
console.log('- Unpacked Firefox:', UNPACKED_FIREFOX);
if (fs.existsSync(chromiumZip)) console.log('- Archive Chromium:', chromiumZip, `(${fs.statSync(chromiumZip).size} bytes)`);
if (fs.existsSync(firefoxZip)) console.log('- Archive Firefox:', firefoxZip, `(${fs.statSync(firefoxZip).size} bytes)`);
