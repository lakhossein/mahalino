'use strict';
const assert=require('node:assert/strict'),runtime=require('./guide-runtime.cjs');
const r=runtime('rent'),g=r.c.E30.guide;
assert.equal(g.canSuggest('rent-area'),false,'unsupported adjacency advertised as a service');
const before=JSON.stringify(r.c.E30.discAPI.ctx().fields);
g.route(g.actions['rent-area'].prompt);
assert(r.messages.at(-1).includes('e31-geo-unavailable'));
assert(!r.messages.at(-1).includes('e31-price-row'),'unsupported geography substituted arbitrary rows');
g.route(g.actions.compare.prompt);
const output=r.messages.at(-1),hoods=Array.from(r.c.HOODS).slice(0,3);
assert.equal((output.match(/class="e31-price-row"/g)||[]).length,hoods.length);
for(const h of hoods){assert(output.includes(h.n));assert(output.includes(r.c.rial(h.buyBase)))}
assert.equal(JSON.stringify(r.c.E30.discAPI.ctx().fields),before,'comparison modified search constraints');
assert.equal(r.c.S.tokens,500);
console.log('PASS neighborhood comparisons: actual labeled sample values, no invented adjacency or constraint mutation');
