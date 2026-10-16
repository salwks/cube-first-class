const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const palette=require('../dist/cube-colors.js');
const guide=vm.runInNewContext(fs.readFileSync('dist/scan-guide.js','utf8')+';ScanGuide',palette);
// Every captured sticker must appear on its original face at the same index.
const scanned=Object.fromEntries(palette.FACES.map((f,face)=>[f,Array.from({length:9},(_,i)=>i===4?f:palette.FACES[(face+i)%6])]));
const html=guide.html('F',scanned,{face:'F',index:0});
for(const f of palette.FACES)for(let i=0;i<9;i++)if(i!==4){
 const tile=html.match(new RegExp('<button[^>]*data-scan-face="'+f+'" data-scan-cell="'+i+'"[^>]*>'))?.[0];
 assert.ok(tile,f+' '+i);
 assert.ok(tile.includes('background:'+palette.COLORS[scanned[f][i]]),f+' '+i+' photographed color');
}
assert.ok(html.includes('선택한 큐브 칸의 색 수정'));
const source=fs.readFileSync('dist/app.js','utf8');
const page=source.slice(source.indexOf('function scanPage('),source.indexOf('function orientation('));
assert.ok(!page.includes('grid-face'));
assert.ok(!page.includes('face-preview'));
assert.ok(!page.includes('02 /'));
// Reset only this app's saved data and prevent pagehide from restoring the old draft.
const memory=new Map([['cube-scan-draft-v2','draft'],['cube-scan-draft-v1','legacy'],['cube-consistent-v2-camera','progress'],['cube-consistent-v1-sample','old-progress'],['cube-class-record','record'],['unrelated-setting','keep']]);
let stopped=0,cleared=0,reloaded=0;
const context=vm.createContext({resetting:false,stopMedia(){stopped++;},LessonFlow:{clear(){cleared++;}},localStorage:{get length(){return memory.size;},key:i=>[...memory.keys()][i],removeItem:k=>memory.delete(k)},location:{hash:'#scan',reload(){reloaded++;}}});
vm.runInContext(source.slice(source.indexOf('function resetAllProgress('),source.indexOf("$('#reset-app').onclick"))+';resetAllProgress();',context);
assert.deepEqual([...memory],[['unrelated-setting','keep']]);
assert.equal(context.resetting,true);assert.equal(context.location.hash,'#home');
assert.equal(stopped,1);assert.equal(cleared,1);assert.equal(reloaded,1);
assert.ok(source.includes('if(!resetting)saveScanDraft()'));
console.log('One cube displays all 54 captured colors; reset clears only cube data and cannot restore the old draft on reload.');
