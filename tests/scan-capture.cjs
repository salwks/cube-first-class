const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('dist/app.js','utf8');
const order=['F','R','B','L','U','D'];
let stops=0,renders=0;
const element={scrollIntoView(){}};
const context=vm.createContext({scanFace:'F',paint:'F',scanned:Object.fromEntries(order.map(f=>[f,null])),scanError:'',NAMES:require('../dist/cube-colors.js').NAMES,render(){renders++;},stopMedia(){stops++;},toast(){},$:()=>element,document:{querySelector:()=>element}});
vm.runInContext(source.slice(source.indexOf('function classify('),source.indexOf('function bindPractice(')),context);
const pixels={F:[105,149,128],R:[238,153,81],B:[98,140,171],L:[217,99,78],U:[239,198,80],D:[248,245,231]};
function capture(face){const canvas={width:300,height:300,getContext:()=>({getImageData:()=>({data:[...pixels[face],255]})})};context.readColors(canvas,270);}
// A different face must not be silently saved under the expected center color.
capture('R');assert.equal(context.scanFace,'F');assert.equal(context.scanned.F,null);assert.ok(context.scanError);assert.equal(stops,0);
// Six captures advance without any confirmation clicks; the camera stays on until the last.
for(let i=0;i<order.length;i++){
 capture(order[i]);
 assert.equal(context.scanned[order[i]].length,9);
 assert.equal(context.scanError,'');
 assert.equal(context.scanFace,order[Math.min(i+1,5)]);
 assert.equal(stops,i===5?1:0);
}
assert.equal(Object.values(context.scanned).filter(Boolean).length,6);
assert.equal(renders,7);
console.log('Six captures advance automatically, keep the camera running, and reject a mismatched center.');
