'use strict';
// The frozen V0.31 -> V0.32 parity contract applies to the archived V0.32
// artifact, not to V0.33's deliberate UX changes. Exercise the original
// reviewed fixtures against that exact version without altering provenance.
const path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
cp.execFileSync(process.execPath,[path.join(root,'..','V0.32','qa','check-refactor-parity.cjs')],{stdio:'inherit'});
cp.execFileSync(process.execPath,[path.join(root,'build_v033.js'),'--check'],{stdio:'inherit'});
cp.execFileSync(process.execPath,[path.join(__dirname,'check-release-identity.cjs')],{stdio:'inherit'});
