const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),Cube=require('../dist/vendor/cube.js');
const palette=require('../dist/cube-colors.js'),source=fs.readFileSync('dist/app.js','utf8');
let routed=[],saved=0,focused=0;
const message={scrollIntoView(){},focus(){focused++;}};
const ctx=vm.createContext({...palette,Cube,scanFace:'D',selectedScanCell:null,scanError:'',lessonOrigin:'sample',stopMedia(){},saveScanDraft(){saved++;},render(){},toast(){},$:()=>message,analyze:str=>routed.push(str)});
vm.runInContext(source.slice(source.indexOf('function valid('),source.indexOf('function analyze(')),ctx);
vm.runInContext(source.slice(source.indexOf('function startCapturedLesson('),source.indexOf('function bindScan(')),ctx);
const input=new Cube().move("R U R' U' F2 L D R2 B U2").asString();
const load=str=>ctx.scanned=Object.fromEntries(palette.FACES.map((face,i)=>[face,[...str.slice(i*9,i*9+9)]]));
load(input);assert.equal(ctx.startCapturedLesson(),true);assert.deepEqual(routed,[input]);assert.equal(ctx.lessonOrigin,'camera');
// Misread colors are preserved for correction, with useful counts and a visible error.
routed=[];let wrong=[...input];const replacement=palette.FACES.find(c=>c!==wrong[0]);wrong[0]=replacement;load(wrong.join(''));const before=JSON.stringify(ctx.scanned);
assert.equal(ctx.startCapturedLesson(),false);assert.equal(routed.length,0);assert.equal(JSON.stringify(ctx.scanned),before);assert.ok(ctx.scanError.includes('8칸'));assert.ok(ctx.scanError.includes('10칸'));assert.ok(focused>0);
// Nine stickers per color is insufficient: an impossible edge flip still stays in correction.
const flipped=[...new Cube().asString()];[flipped[5],flipped[10]]=[flipped[10],flipped[5]];load(flipped.join(''));assert.equal(ctx.startCapturedLesson(),false);assert.equal(routed.length,0);
// Correcting a saved scan can be retried without recapturing or substituting an example.
load(input);assert.equal(ctx.startCapturedLesson(),true);assert.deepEqual(routed,[input]);assert.equal(ctx.scanError,'');assert.equal(saved,4);
console.log('Valid scans start the learner’s exact cube; miscounts and impossible states stay saved with a focused correction message.');
