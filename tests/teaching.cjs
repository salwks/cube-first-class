const assert=require('node:assert/strict'),Cube=require('../dist/vendor/cube.js');global.Cube=Cube;const B=require('../dist/planner.js'),T=require('../dist/teaching.js');
let instructions=0,patterns=0;
for(let trial=0;trial<100;trial++){
 const cube=Cube.random(),plan=B.plan(cube.asString());
 for(let n=0;n<8;n++)for(const segment of plan[n].segments){
  const seq=plan[n].moves.slice(segment.start,segment.end);let model=Cube.fromString(segment.initial),cursor=segment.start;const before=model.clone();
  for(const pattern of segment.patterns){assert.equal(pattern.start,cursor);assert.equal(pattern.moves.length,pattern.end-pattern.start);cursor=pattern.end;patterns++;}assert.equal(cursor,segment.end);
  const flowers=n===0?[4,5,6,7].filter(p=>{const i=model.ep.indexOf(p);return i<4&&model.eo[i]===0;}):[];
  for(let i=0;i<seq.length;i++){
   const info=T.instruction(model,n,segment,seq,i);assert.equal(info.move,seq[i]);assert.equal(info.step,i+1);assert.ok(info.action&&info.reason&&info.check&&info.observe&&info.pattern);assert.ok(!/undefined|null|NaN/.test(Object.values(info).filter(v=>typeof v==='string').join(' ')));assert.ok(info.patternStep<=info.patternLength);assert.ok(info.action.includes(require('../dist/cube-colors.js').NAMES[info.face]));
   if(n===4)assert.ok(info.observe.includes([1,3,5,7].filter(j=>model.asString()[j]==='U').length+'개'));if(n===5)assert.ok(info.observe.includes([0,2,6,8].filter(j=>model.asString()[j]==='U').length+'개'));model.move(seq[i]);if(n===2&&segment.patterns.some(p=>p.end===segment.start+i+1)){assert.equal(B.ec(model),4);assert.ok([4,5,6,7].filter(k=>before.cp[k]===k&&before.co[k]===0).every(k=>model.cp[k]===k&&model.co[k]===0));}if(n===3&&segment.patterns.some(p=>p.end===segment.start+i+1)){assert.equal(B.ec(model),4);assert.equal(B.cc(model),4);assert.ok([8,9,10,11].filter(k=>before.ep[k]===k&&before.eo[k]===0).every(k=>model.ep[k]===k&&model.eo[k]===0));}if(n>=4&&segment.patterns.some(p=>p.end===segment.start+i+1)){assert.equal(B.ec(model),4);assert.equal(B.cc(model),4);assert.equal(B.mc(model),4);if(n>=5)assert.ok([1,3,5,7].every(j=>model.asString()[j]==='U'));if(n>=6)assert.ok([...model.asString().slice(0,9)].every(c=>c==='U'));if(n===7)assert.ok(model.cp.every((c,j)=>c===j));}if(n===0)assert.ok(flowers.every(p=>{const j=model.ep.indexOf(p);return j<4&&model.eo[j]===0;}));
   if(n===1){const side=['R','F','L','B'][segment.piece-4];if(seq[i][0]!=='U'){assert.equal(seq[i],side+'2');assert.ok(info.reason.includes('반 바퀴'));}}instructions++;
  }assert.equal(model.asString(),segment.final);
 }
}
console.log(`PASS: ${instructions} model-derived instructions and ${patterns} pattern boundaries on 100 cubes, with every intermediate flower petal preserved.`);
