const assert=require('node:assert/strict'),reader=require('../dist/color-recognition.js');
for(const [face,rgb] of Object.entries(reader.defaults))for(const scale of [.35,.6,1])assert.equal(reader.classify(rgb.map(c=>c*scale)),face);
const references={F:[105,149,128],R:[238,153,81],B:[98,140,171],L:[217,99,78],U:[239,198,80],D:[248,245,231]};
for(const [face,rgb] of Object.entries(references))assert.equal(reader.referenceIsUsable(face,rgb),true);
for(const scale of [.35,.6,1])for(const [face,rgb] of Object.entries(references))assert.equal(reader.classify(rgb.map(c=>c*scale),references),face,'calibration and shadows: '+face);
const samples=Object.fromEntries(Object.keys(references).map(face=>[face,Array.from({length:9},(_,i)=>i===4?[0,0,0]:references[face])]));
const assigned=reader.assign(samples,references);for(const [face,colors] of Object.entries(assigned))assert.deepEqual(colors,Array(9).fill(face));
assert.equal(reader.referenceIsUsable('F',[0,0,0]),false);
console.log('Six calibrated colors remain distinct under shadows; center logos never change their assigned face.');
