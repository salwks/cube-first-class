const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('dist/app.js','utf8');
const order=['F','R','B','L','U','D'];
let stops=0,renders=0;
const element={scrollIntoView(){}};
const context=vm.createContext({scanFace:'F',paint:'F',scanned:Object.fromEntries(order.map(f=>[f,null])),scanError:'',NAMES:require('../dist/cube-colors.js').NAMES,render(){renders++;},stopMedia(){stops++;},toast(){},$:()=>element,document:{querySelector:()=>element}});
vm.runInContext(source.slice(source.indexOf('function classify('),source.indexOf('function bindPractice(')),context);
const pixels={F:[105,149,128],R:[238,153,81],B:[98,140,171],L:[217,99,78],U:[239,198,80],D:[248,245,231]};
function capture(face,logo){let cell=0;const canvas={width:300,height:300,getContext:()=>({getImageData:()=>({data:[...(cell++===4?logo:pixels[face]),255]})})};context.readColors(canvas,270);}
// Logos on any of the six centers must not block automatic capture.
// Only the center is assigned; the other eight photographed colors stay intact.
for(let i=0;i<order.length;i++){
 capture(order[i],i%2?[0,0,0]:pixels[order[(i+1)%6]]);
 assert.equal(context.scanned[order[i]].length,9);
 assert.equal(context.scanned[order[i]][4],order[i]);
 context.scanned[order[i]].forEach((color,cell)=>{if(cell!==4)assert.equal(color,order[i]);});
 assert.equal(context.scanError,'');
 assert.equal(context.scanFace,order[Math.min(i+1,5)]);
 assert.equal(stops,i===5?1:0);
}
assert.equal(Object.values(context.scanned).filter(Boolean).length,6);
assert.equal(renders,6);
console.log('Logos on all six centers allow automatic capture; centers are assigned and all eight surrounding colors are preserved.');
