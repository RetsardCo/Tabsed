#!/usr/bin/env node
const os = require('os');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// 1. Ensure Cargo & Rust toolchain are on PATH
const cargoBin = path.join(os.homedir(), '.cargo', 'bin');
if (fs.existsSync(cargoBin)) {
  const currentPath = process.env.PATH || '';
  if (!currentPath.toLowerCase().includes(cargoBin.toLowerCase())) {
    process.env.PATH = `${cargoBin}${path.delimiter}${currentPath}`;
  }
}

// 2. Ensure MSVC C++ toolchain & Windows SDK headers/libs are configured on Windows
if (process.platform === 'win32') {
  const scopeVcBase = 'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\SDK\\ScopeCppSDK\\vc15';
  if (fs.existsSync(path.join(scopeVcBase, 'VC', 'bin', 'link.exe'))) {
    const vcBin = path.join(scopeVcBase, 'VC', 'bin');
    const sdkBin = path.join(scopeVcBase, 'SDK', 'bin');
    const vcLib = path.join(scopeVcBase, 'VC', 'lib');
    const sdkLib = path.join(scopeVcBase, 'SDK', 'lib');

    const includes = [
      path.join(scopeVcBase, 'VC', 'include'),
      path.join(scopeVcBase, 'SDK', 'include', 'um'),
      path.join(scopeVcBase, 'SDK', 'include', 'shared'),
      path.join(scopeVcBase, 'SDK', 'include', 'ucrt'),
    ].join(';');

    const libs = [vcLib, sdkLib].join(';');

    const currentPath = process.env.PATH || '';
    if (!currentPath.toLowerCase().includes(vcBin.toLowerCase())) {
      process.env.PATH = `${vcBin}${path.delimiter}${sdkBin}${path.delimiter}${currentPath}`;
    }
    if (!process.env.INCLUDE) {
      process.env.INCLUDE = includes;
    }
    if (!process.env.LIB) {
      process.env.LIB = libs;
    }
  }
}

// 3. Locate Tauri CLI entry point
const cliPkgPath = require.resolve('@tauri-apps/cli/package.json');
const cliPkg = JSON.parse(fs.readFileSync(cliPkgPath, 'utf8'));
const cliBinRel = typeof cliPkg.bin === 'string' ? cliPkg.bin : (cliPkg.bin?.tauri || 'tauri.js');
const cliBinPath = path.resolve(path.dirname(cliPkgPath), cliBinRel);

// 4. Pass arguments to Tauri CLI
let args = process.argv.slice(2);
if (args.length >= 2 && args[0] === args[1] && ['build', 'dev', 'init', 'bundle'].includes(args[0])) {
  args = args.slice(1);
}
const result = spawnSync(process.execPath, [cliBinPath, ...args], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error('[tauri-runner] Failed to run tauri CLI:', result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
