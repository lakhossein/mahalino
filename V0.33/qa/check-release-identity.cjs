/* V0.33 identity, independent state and non-destructive predecessor. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),child=require('node:child_process');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'Mahalino+V0.33.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json'),'utf8'));
const checks={
 title:html.includes('<title>محلینو+ — V0.33</title>'),
 engine:html.includes("VER:'0.33'"),
 independentState:html.includes("var LSKEY='mahalino_v33';"),
 importPreviousState:html.includes("var PREVIOUS_LS='mahalino_v32';")&&html.includes("LSCHAIN=[LSKEY,PREVIOUS_LS,'mahalino_v31',OLD_LS,"),
 manifestIdentity:manifest.version==='0.33'&&manifest.output==='Mahalino+V0.33.html',
 noSupersededOutput:!fs.existsSync(path.join(root,'Mahalino+V0.32.html')),
 guidedBudget:html.includes('e30-budget-card'),
 fullLibrary:html.includes('e30-library-fullscreen'),
 standaloneTemplate:fs.existsSync(path.join(root,manifest.entry)),
 noLegacyBase:!fs.existsSync(path.join(root,'base')),
 noPreviousRuntimeAssetDependency:!/(?:src|href)\s*=\s*["'](?:\.\.\/)+V0\.(?:29|30|31|32)\//i.test(html)
};
const repo=path.resolve(root,'..');
if(fs.existsSync(path.join(repo,'.git'))){
 let sha='';
 try{sha=child.execFileSync('git',['-C',repo,'rev-parse','HEAD:V0.32'],{encoding:'utf8'}).trim()}catch(e){}
 checks.untouchedV032=sha==='f19f2fb55fb28032abca900f560f302e060f77fe';
}
const failed=Object.keys(checks).filter(k=>!checks[k]);
console.log(JSON.stringify({version:'0.33',checks,failed,pass:failed.length===0},null,2));
if(failed.length)process.exitCode=1;
