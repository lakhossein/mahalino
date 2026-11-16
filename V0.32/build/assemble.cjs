'use strict';

/**
 * Pure, deterministic assembly. Includes are literal, appear exactly once and
 * preserve the original script scope, declaration order and whitespace.
 * load(relativePath) is supplied by the CLI or tests; no implicit predecessor.
 */
function assemble(manifest, load) {
  const marker = /\/\* @mahalino:([a-z0-9-]+) \*\//g;
  const slots = manifest.slots;
  if (!slots || typeof slots !== 'object' || Array.isArray(slots)) {
    throw new Error('Build manifest must declare slots');
  }
  const seen = new Set();
  function read(relative) {
    if (typeof relative !== 'string' || !/^(src|templates)\/[a-zA-Z0-9_./+-]+$/.test(relative) ||
        relative.split('/').some(part => part === '..' || part === '.' || !part)) {
      throw new Error('Invalid source path: ' + relative);
    }
    const source = load(relative);
    if (typeof source !== 'string' || !source.length) throw new Error('Empty source: ' + relative);
    return source;
  }
  function expand(source, stack) {
    return source.replace(marker, (match, id) => {
      if (!Object.prototype.hasOwnProperty.call(slots, id)) throw new Error('Unknown include: ' + id);
      if (stack.includes(id)) throw new Error('Cyclic include: ' + stack.concat(id).join(' -> '));
      if (seen.has(id)) throw new Error('Duplicate include: ' + id);
      seen.add(id);
      return expand(read(slots[id]), stack.concat(id));
    });
  }
  const html = expand(read(manifest.entry), []);
  const unused = Object.keys(slots).filter(id => !seen.has(id));
  if (unused.length) throw new Error('Unused includes: ' + unused.join(', '));
  if (html.includes('@mahalino:')) throw new Error('Unresolved include marker');
  return html;
}
module.exports = { assemble };
