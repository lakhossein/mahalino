/* V0.32 identity, independent state and non-destructive predecessor. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),child=require('node:child_process');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'Mahalino+V0.32.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'),'utf8'));
const checks={
 title:html.includes('<title>محلینو+ — V0.32</title>'),
 engine:html.includes("VER:'0.32'"),
 independentState:html.includes("var LSKEY='mahalino_v32';"),
 importPreviousState:html.includes("var PREVIOUS_LS='mahalino_v31';")&&html.includes('LSCHAIN=[LSKEY,PREVIOUS_LS,OLD_LS,'),
 guidedBudget:html.includes('e30-budget-card'),
 fullLibrary:html.includes('e30-library-fullscreen'),
 standaloneTemplate:fs.existsSync(path.join(root,manifest.entry)),
 noLegacyBase:!fs.existsSync(path.join(root,'base')),
 noPreviousRuntimeAssetDependency:!/(?:src|href)\s*=\s*["'](?:\.\.\/)+V0\.(?:29|30|31)\//i.test(html)
};
const repo=path.resolve(root,'..');
if(fs.existsSync(path.join(repo,'.git'))){
 let sha='';
 try{sha=child.execFileSync('git',['-C',repo,'rev-parse','HEAD:V0.31'],{encoding:'utf8'}).trim()}catch(e){}
 checks.untouchedV031=sha==='ef7c5b9b44808550dcda7050bb795acde8e3e074';
}
const failed=Object.keys(checks).filter(k=>!checks[k]);
console.log(JSON.stringify({version:'0.32',checks,failed,pass:failed.length===0},null,2));
if(failed.length)process.exitCode=1;
