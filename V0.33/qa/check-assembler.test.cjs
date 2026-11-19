'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { assemble } = require('../build/assemble.cjs');
const marker = id => '/* @mahalino:' + id + ' */';
const manifest = {entry:'templates/app.html', slots:{one:'src/one.js', two:'src/two.js'}};
const run = (files, m = manifest) => assemble(m, name => {
  if (!(name in files)) throw new Error('Missing source: ' + name);
  return files[name];
});
test('literal nested assembly preserves order, whitespace and replacement tokens', () => {
  const literal = "$' $& $" + '`' + " $$";
  const files = {'templates/app.html':'<script>\n'+marker('one')+'</script>', 'src/one.js':'one\n'+marker('two'), 'src/two.js':literal};
  assert.equal(run(files), '<script>\none\n'+literal+'</script>');
  assert.equal(run(files), run(files));
});
test('missing, unknown, duplicated, cyclic, unused and malformed includes fail closed', () => {
  const valid = {'templates/app.html':marker('one'), 'src/one.js':marker('two'), 'src/two.js':'ok'};
  for (const [files, pattern] of [
    [{...valid, 'src/two.js':''}, /Empty source/],
    [{'templates/app.html':marker('one')}, /Missing source/],
    [{...valid, 'src/one.js':marker('unknown')}, /Unknown include/],
    [{...valid, 'src/one.js':marker('two')+marker('two')}, /Duplicate include/],
    [{...valid, 'src/two.js':marker('one')}, /Cyclic include/],
    [{...valid, 'src/one.js':'ok'}, /Unused includes/],
    [{...valid, 'src/two.js':'/* @mahalino:BAD */'}, /Unresolved include/]
  ]) assert.throws(() => run(files), pattern);
});
test('source paths cannot escape the standalone release directory', () => {
  for (const relative of ['../V0.31/file.js','src/../secret.js','/tmp/file.js','src//file.js','src/./file.js']) {
    assert.throws(() => run({'templates/app.html':marker('one')}, {entry:'templates/app.html', slots:{one:relative}}), /Invalid source path/);
  }
});
