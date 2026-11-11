/* Prepare read-only copies of the supplied V0.30 QA scripts for Linux CI. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const [repository, runtime] = process.argv.slice(2);
if (!repository || !runtime) {
  console.error('Usage: node prepare-v030-audit.cjs REPO_ROOT QA_RUNTIME');
  process.exit(2);
}

const sourceDir = path.resolve(repository, 'V0.30', 'qa');
const targetDir = path.resolve(runtime);
const suite = ['smoke-v030.js', 'e2e-functional.js', 'e2e-conversational.js'];

fs.mkdirSync(targetDir, { recursive: true });
for (const filename of suite) {
  const original = fs.readFileSync(path.join(sourceDir, filename), 'utf8');
  let script = original.replace(
    /require\('C:\/Users\/Sedreh\/zqa\/node_modules\/playwright'\)/g,
    "require('playwright')"
  );
  script = script.replace(
    /executablePath:\s*'C:\/Users\/Sedreh\/AppData\/Local\/ms-playwright\/chromium-1254\/chrome-win64\/chrome\.exe',?/g,
    ''
  );
  if (script === original || script.includes("require('C:/Users/Sedreh") || script.includes("executablePath:'C:/Users/Sedreh")) {
    throw new Error(`Could not safely make ${filename} portable; review its changed paths`);
  }
  fs.writeFileSync(path.join(targetDir, filename), script, 'utf8');
  console.log(`Prepared ${filename} (original source unchanged)`);
}
