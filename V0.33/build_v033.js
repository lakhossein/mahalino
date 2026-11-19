#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { assemble } = require('./build/assemble.cjs');
const root = __dirname;
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'build-manifest.json'), 'utf8'));
if (manifest.version !== '0.33' || manifest.output !== 'Mahalino+V0.33.html') {
  throw new Error('Unexpected release identity or output path');
}
const html = assemble(manifest, relative => fs.readFileSync(path.join(root, relative), 'utf8'));
// Validate all inline scripts before touching the last known-good artifact.
for (const [index, match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()) {
  if (match[1].trim()) new vm.Script(match[1], { filename: 'generated-script-' + index + '.js' });
}
const output = path.join(root, manifest.output);
if (process.argv.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== html) throw new Error('Generated HTML is stale; run node build_v033.js');
  console.log('PASS V0.33 reproducible build');
} else {
  // Stage beside the artifact so rename is atomic on the same filesystem.
  const staging = fs.mkdtempSync(path.join(root, '.v033-build-'));
  try {
    const stagedOutput = path.join(staging, manifest.output);
    fs.writeFileSync(stagedOutput, html, 'utf8');
    fs.renameSync(stagedOutput, output);
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
  console.log('Built V0.33: ' + Object.keys(manifest.slots).length + ' explicit modules -> ' + output);
}
