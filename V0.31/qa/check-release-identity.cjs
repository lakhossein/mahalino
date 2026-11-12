/* V0.31 provenance, version identity, independence and non-destructive rollback. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),child=require('node:child_process');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'Mahalino+V0.31.html'),'utf8');
const builder=fs.readFileSync(path.join(root,'build_v031.js'),'utf8');
const checks={
 title:html.includes('<title>محلینو+ — V0.31</title>'),
 engine:html.includes("VER:'0.31'"),
 independentState:html.includes("var LSKEY='mahalino_v31';"),
 importPreviousState:html.includes("var OLD_LS=['mahal','ino_','v30'].join('');"),
 guidedBudget:html.includes('e30-budget-card'),
 fullLibrary:html.includes('e30-library-fullscreen'),
 bundledBase:fs.existsSync(path.join(root,'base','Mahalino+V0.29.html')),
 noExternalBuildBase:builder.includes('const SRC=BUNDLED_BASE;')&&!builder.includes('REPO_BASE'),
 noV030RuntimeAssetDependency:!/(?:src|href)\s*=\s*["'](?:\.\.\/)+V0\.30\//i.test(html)
};
const repo=path.resolve(root,'..'),expectedOldTree='95cba5f115d7823614db3d435a269e4fae600940';
if(fs.existsSync(path.join(repo,'.git'))){
 let sha='';
 try{sha=child.execFileSync('git',['-C',repo,'rev-parse','HEAD:V0.30'],{encoding:'utf8'}).trim()}catch(e){}
 checks.untouchedV030=sha===expectedOldTree;
}
const failed=Object.keys(checks).filter(k=>!checks[k]);
const out={version:'0.31',checks,failed,pass:failed.length===0};
console.log(JSON.stringify(out,null,2));
if(failed.length)process.exitCode=1;
