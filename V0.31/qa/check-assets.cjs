/* Release-time manifest verification; a missing font/map/image must be fatal. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'Mahalino+V0.31.html'),'utf8');
const required=new Set([
  'assets/leaflet/leaflet.js','assets/leaflet/leaflet.css',
  'assets/leaflet/images/marker-icon.png','assets/leaflet/images/marker-icon-2x.png',
  'assets/leaflet/images/marker-shadow.png',
  'assets/img/emptying-before.jpg','assets/img/emptying-after.jpg',
  'IRANSansX-Regular.woff2','IRANSansX-Bold.woff2'
]);
for(const weight of ['Thin','Light','Regular','SemiBold','Bold','ExtraBold','Black','ExtraBlack']){
  required.add(`assets/fonts/yekan-bakh/YekanBakhFaNum-${weight}.woff2`);
}
for(const match of html.matchAll(/\bassets\/[A-Za-z0-9._/-]+\.(?:woff2?|svg|png|jpe?g|css|js)\b/g)){
  required.add(match[0]);
}
const failures=[];
for(const ref of [...required].sort()){
  const absolute=path.resolve(root,ref);
  if(!absolute.startsWith(root+path.sep)){failures.push({ref,error:'unsafe relative asset path'});continue}
  try{
    const stat=fs.statSync(absolute);
    if(!stat.isFile()||stat.size===0)failures.push({ref,error:'missing/nonfile/zero-byte'});
  }catch(e){failures.push({ref,error:'missing'})}
}
const info={checked:required.size,failed:failures.length,failures};
console.log(JSON.stringify(info,null,2));
process.exitCode=failures.length?1:0;
