const assert=require('node:assert/strict'),Cube=require('../dist/vendor/cube.js');
(async()=>{
 const THREE=await import('three');const {faces,normals,axes,position}=await import('../src/cube-geometry.mjs');
 const slots=faces.flatMap(f=>Array.from({length:9},(_,i)=>({f,p:position(f,Math.floor(i/3),i%3),n:normals[f]})));
 for(let run=0;run<10;run++)for(const f of faces)for(const suffix of ['',"'",'2']){
  const input=Cube.random(),str=input.asString(),output=Array(54),[axis,sign,direction]=axes[f],component={x:0,y:1,z:2}[axis],angle=direction*Math.PI/2*(suffix==='2'?2:suffix==="'"?-1:1),quaternion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0),angle);
  let moving=0;
  slots.forEach((slot,i)=>{let p=[...slot.p],n=[...slot.n];if(p[component]===sign){moving++;p=new THREE.Vector3(...p).applyQuaternion(quaternion).toArray().map(Math.round);n=new THREE.Vector3(...n).applyQuaternion(quaternion).toArray().map(Math.round);}const dest=slots.findIndex(s=>s.p.every((v,k)=>v===p[k])&&s.n.every((v,k)=>v===n[k]));assert.notEqual(dest,-1);output[dest]=str[i];});
  assert.equal(moving,21);assert.equal(output.join(''),input.clone().move(f+suffix).asString(),f+suffix+' rendered layer must match cube.js');
 }
 console.log('All 18 real 3D layer rotations agree with cube.js on 10 randomized cubes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
