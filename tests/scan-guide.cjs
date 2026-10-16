const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const guide=vm.runInNewContext(fs.readFileSync('dist/scan-guide.js','utf8')+';ScanGuide',{NAMES:require('../dist/cube-colors.js').NAMES});
const palette=require('../dist/cube-colors.js');
// Opposite pairs alone do not catch a mirror image. Check the complete handed scheme.
assert.deepEqual(palette.NAMES,{U:'노랑',R:'주황',F:'초록',D:'흰색',L:'빨강',B:'파랑'});
assert.deepEqual(['F','R','B','L'].map(f=>palette.NAMES[f]),['초록','주황','파랑','빨강']);
assert.equal(palette.COLORS.R,'#ee9951');
assert.equal(palette.COLORS.L,'#d9634e');
const normals={F:[0,0,1],R:[1,0,0],B:[0,0,-1],L:[-1,0,0],U:[0,-1,0],D:[0,1,0]};
function rotate(v,pose){const [a,b]=pose.map(n=>n*Math.PI/180),[x,y,z]=v,xx=x*Math.cos(b)+z*Math.sin(b),zz=-x*Math.sin(b)+z*Math.cos(b);return [xx,y*Math.cos(a)-zz*Math.sin(a),y*Math.sin(a)+zz*Math.cos(a)].map(n=>Math.round(n)||0);}
// The camera's front, upper edge and right edge must agree with photo indexing.
for(const f of Object.keys(normals)){
 const [top,right]=guide.refs[f];
 assert.deepEqual(rotate(normals[f],guide.poses[f]),[0,0,1],f+' front');
 assert.deepEqual(rotate(normals[top],guide.poses[f]),[0,-1,0],f+' upper neighbor');
 assert.deepEqual(rotate(normals[right],guide.poses[f]),[1,0,0],f+' right neighbor');
 for(const from of Object.keys(normals)){
  const end=guide.path(from,f).at(-1).pose;
  for(const n of Object.values(normals))assert.deepEqual(rotate(n,end),rotate(n,guide.poses[f]),from+' → '+f);
 }
}
console.log('6 camera poses and all 36 whole-cube transitions preserve photo orientation.');
