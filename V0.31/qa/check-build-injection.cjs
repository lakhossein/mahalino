/* Build replacement text is literal JavaScript, never String.replace tokens. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mahalino-build-literal-'));
try{
 for(const name of ['base','src'])fs.cpSync(path.join(root,name),path.join(tmp,name),{recursive:true});
 fs.copyFileSync(path.join(root,'build_v031.js'),path.join(tmp,'build_v031.js'));
 const build=()=>{execFileSync(process.execPath,[path.join(tmp,'build_v031.js')]);return fs.readFileSync(path.join(tmp,'Mahalino+V0.31.html'),'utf8')};
 const clean=build();assert.equal(clean,fs.readFileSync(path.join(root,'Mahalino+V0.31.html'),'utf8'),'clean build changed the runtime artifact');
 const sentinel="/* BUILD_LITERAL_SENTINEL: $' $& $` $$ */";
 fs.appendFileSync(path.join(tmp,'src','v31-guidance.js'),'\n'+sentinel+'\n');
 const html=build();assert.equal(html.split(sentinel).length,2,'replacement tokens corrupted injected JavaScript');
 for(const [i,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())if(match[1].trim())new vm.Script(match[1],{filename:'generated-script-'+i+'.js'});
 console.log('PASS literal injection, generated JavaScript syntax, standalone build and unchanged clean artifact');
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
