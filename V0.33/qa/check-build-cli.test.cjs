'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mahalino-build-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'templates'));
  fs.cpSync(path.join(__dirname, '../build'), path.join(root, 'build'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, '../build_v033.js'), path.join(root, 'build_v033.js'));
  fs.writeFileSync(path.join(root, 'build-manifest.json'), JSON.stringify({
    version: '0.33', output: 'Mahalino+V0.33.html', entry: 'templates/app.html', slots: {}
  }));
  const template = path.join(root, 'templates/app.html');
  const output = path.join(root, 'Mahalino+V0.33.html');
  const html = '<script>const version = 32;</script>';
  fs.writeFileSync(template, html);
  const run = (...args) => spawnSync(process.execPath, [path.join(root, 'build_v033.js'), ...args], { encoding: 'utf8' });
  return { root, template, output, html, run };
}

test('build publishes complete output, cleans staging and check never repairs stale output', t => {
  const f = fixture(t);
  fs.writeFileSync(f.output, 'previous artifact');
  assert.equal(f.run().status, 0);
  assert.equal(fs.readFileSync(f.output, 'utf8'), f.html);
  assert.equal(f.run('--check').status, 0);
  fs.writeFileSync(f.output, 'stale artifact');
  const result = f.run('--check');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Generated HTML is stale/);
  assert.equal(fs.readFileSync(f.output, 'utf8'), 'stale artifact');
  assert.deepEqual(fs.readdirSync(f.root).filter(name => name.startsWith('.v032-build-')), []);
});

test('invalid JavaScript leaves last known-good output untouched', t => {
  const f = fixture(t);
  fs.writeFileSync(f.output, 'last known-good artifact');
  fs.writeFileSync(f.template, '<script>const broken = ;</script>');
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SyntaxError/);
  assert.equal(fs.readFileSync(f.output, 'utf8'), 'last known-good artifact');
});

test('failed publication cleans staging and preserves existing destination', t => {
  const f = fixture(t);
  fs.mkdirSync(f.output);
  fs.writeFileSync(path.join(f.output, 'sentinel'), 'preserved');
  assert.notEqual(f.run().status, 0);
  assert.equal(fs.readFileSync(path.join(f.output, 'sentinel'), 'utf8'), 'preserved');
  assert.deepEqual(fs.readdirSync(f.root).filter(name => name.startsWith('.v032-build-')), []);
});
