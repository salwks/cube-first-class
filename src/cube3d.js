import * as THREE from 'three';

import {faces,normals,axes,position} from './cube-geometry.mjs';
const instances=new Set(), remembered=new Map();
function cssRotation(element){
 const value=getComputedStyle(element).transform;
 const values=new DOMMatrix(value==='none'?undefined:value).toFloat32Array();
 for(let i=0;i<16;i++)if((i%4===1)!==(Math.floor(i/4)===1))values[i]*=-1;
 return new THREE.Matrix4().fromArray(values);
}
class CubeView{
 constructor(host,world,scan){
  this.host=host;this.world=world;this.scan=scan;this.key=world.id;this.disposed=false;this.animating=false;this.dirty=true;this.signature='';this.orbit={x:0,y:0};
  this.proxies=[...world.querySelectorAll(scan?'.scan-guide-face>button':'.sticker')];
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(34,1,.1,100);this.camera.position.z=8.5;
  this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setClearColor(0,0);this.renderer.toneMapping=THREE.NoToneMapping;
  this.container=document.createElement('div');this.container.className='webgl-viewport';this.container.setAttribute('aria-label','손으로 돌려 보는 3D 큐브');this.container.append(this.renderer.domElement);
  this.overlay=document.createElement('div');this.overlay.className='webgl-hit-layer';this.container.append(this.overlay);host.append(this.container);host.classList.add('webgl-mounted');
  this.root=new THREE.Group();this.pose=new THREE.Group();this.root.add(this.pose);this.scene.add(this.root);
  this.scene.add(new THREE.HemisphereLight(0xffffff,0x424850,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-3,5,6);this.scene.add(light);
  this.parts=[];this.tiles=[];this.box=new THREE.BoxGeometry(.98,.98,.98);this.plane=new THREE.PlaneGeometry(.86,.86);this.borderPlane=new THREE.PlaneGeometry(.94,.94);this.bodyMaterial=new THREE.MeshStandardMaterial({color:0x15191e,roughness:.55,metalness:.05});
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){if(!x&&!y&&!z)continue;const body=new THREE.Mesh(this.box,this.bodyMaterial);body.position.set(x,y,z);body.userData.p=[x,y,z];this.pose.add(body);this.parts.push(body);}
  this.proxies.forEach((proxy,index)=>{
   const face=faces[Math.floor(index/9)],p=position(face,Math.floor(index%9/3),index%3),n=new THREE.Vector3(...normals[face]);
   const group=new THREE.Group();group.position.set(...p).addScaledVector(n,.5);group.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);group.userData.p=p;
   // The face's local up must agree with cube.js facelet row order, including U/D/B.
   const top=position(face,0,1),bottom=position(face,2,1),up=new THREE.Vector3(...top).sub(new THREE.Vector3(...bottom)).normalize();
   const right=new THREE.Vector3().crossVectors(up,n).normalize();group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,n));
   const border=new THREE.Mesh(this.borderPlane,new THREE.MeshBasicMaterial({color:0x15191e}));const tile=new THREE.Mesh(this.plane,new THREE.MeshBasicMaterial({color:0xffffff}));tile.position.z=.008;group.add(border,tile);this.pose.add(group);this.parts.push(group);
   const button=document.createElement('button');button.type='button';button.className='webgl-hit';button.dataset.stickerIndex=String(index);button.dataset.cubeFace=face;button.tabIndex=-1;this.overlay.append(button);
   button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(e.detail===0&&!this.dragged&&!this.animating&&!proxy.disabled)proxy.click();});
   button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!proxy.disabled)proxy.click();}});
   this.tiles.push({proxy,group,tile,border,button,index});
  });
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();
  this.container.addEventListener('pointerdown',e=>{if(e.target.closest('.webgl-controls'))return;this.dragged=false;this.down={x:e.clientX,y:e.clientY,ox:this.orbit.x,oy:this.orbit.y,id:e.pointerId,target:e.target};this.container.setPointerCapture(e.pointerId);});
  this.container.addEventListener('pointermove',e=>{if(!this.down)return;const dx=e.clientX-this.down.x,dy=e.clientY-this.down.y;if(Math.hypot(dx,dy)>5)this.dragged=true;if(this.dragged){this.orbit.x=this.down.ox+dy*.008;this.orbit.y=this.down.oy+dx*.008;this.dirty=true;}});
  this.container.addEventListener('pointerup',e=>{if(!this.down)return;const wasDragged=this.dragged,original=this.down.target;this.down=null;try{this.container.releasePointerCapture(e.pointerId);}catch{}if(wasDragged){e.preventDefault();e.stopPropagation();return;}if(!this.animating){const box=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.tiles.map(t=>t.tile))[0];const originalIndex=original.closest?.('.webgl-hit')?.dataset.stickerIndex;const found=originalIndex!==undefined?this.tiles[+originalIndex]:this.tiles.find(t=>t.tile===hit?.object);if(found&&!found.proxy.disabled)found.proxy.click();}});
  this.container.addEventListener('pointercancel',()=>{this.down=null;});
  this.container.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();this.camera.position.z=THREE.MathUtils.clamp(this.camera.position.z+e.deltaY*.006,6.5,12);this.dirty=true;},{passive:false});
  if(this.key){const controls=document.createElement('div');controls.className='webgl-controls';controls.innerHTML='<button aria-label="큐브 왼쪽으로 둘러보기">↶</button><button aria-label="큐브 위쪽으로 둘러보기">↥</button><button aria-label="큐브 기준 시점으로">기준</button><button aria-label="큐브 오른쪽으로 둘러보기">↷</button>';[...controls.children].forEach((button,i)=>button.onclick=e=>{e.stopPropagation();if(i===0)this.orbit.y-=Math.PI/6;if(i===1)this.orbit.x-=Math.PI/6;if(i===2)this.orbit={x:0,y:0};if(i===3)this.orbit.y+=Math.PI/6;this.dirty=true;});this.container.append(controls);}
  this.width=host.clientWidth||240;this.height=host.clientHeight||240;this.renderer.setSize(this.width,this.height,false);this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();
  this.resize=new ResizeObserver(()=>{const w=host.clientWidth||240,h=host.clientHeight||240;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.width=w;this.height=h;this.dirty=true;});this.resize.observe(host);
  const saved=remembered.get(this.key);if(saved&&saved.pose===world.style.transform&&(!scan||saved.face===host.dataset.scanCurrent))this.orbit={...saved.orbit};
 }
 sync(){
  const signature=this.proxies.map(p=>p.style.background+p.className+p.innerHTML+p.getAttribute('aria-label')).join('|');
  if(signature===this.signature)return;this.signature=signature;this.dirty=true;
  this.tiles.forEach(({proxy,tile,border,button})=>{
   const color=proxy.style.backgroundColor||getComputedStyle(proxy).backgroundColor||'#b7bdc5';tile.material.color.set(color==='rgba(0, 0, 0, 0)'?'#b7bdc5':color);
   const target=proxy.matches('.first-target,.cross-center,.scan-overcount,.scan-picked'),destination=proxy.classList.contains('flow-destination');border.material.color.set(destination?'#00e5ff':target?'#ffffff':'#15191e');
   button.innerHTML=proxy.innerHTML;button.setAttribute('aria-label',proxy.getAttribute('aria-label')||`3D 큐브 ${button.dataset.cubeFace} ${+button.dataset.stickerIndex%9+1}번 칸`);button.dataset.color=color;
   button.classList.toggle('webgl-count-mismatch',proxy.classList.contains('scan-count-mismatch'));button.classList.toggle('webgl-target',target);button.classList.toggle('webgl-destination',destination);button.disabled=false;button.setAttribute('aria-disabled',String(!!proxy.disabled));button.tabIndex=proxy.disabled?-1:0;
   const rgb=tile.material.color.clone().convertLinearToSRGB();button.style.color=rgb.r*.3+rgb.g*.59+rgb.b*.11>.55?'#101820':'#ffffff';
  });
  this.updateArrow();
 }
 updateArrow(){
  if(this.arrow){this.pose.remove(this.arrow);this.arrow.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.arrow=null;}
  const source=this.world.querySelector('.face-rotation');if(!source)return;const move=source.dataset.move;if(!move)return;const n=new THREE.Vector3(...normals[move[0]]),g=new THREE.Group();g.position.copy(n).multiplyScalar(1.63);g.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);if(!move.includes("'"))g.scale.y=-1;
  const material=new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false});const arc=new THREE.Mesh(new THREE.TorusGeometry(1.1,.035,8,64,Math.PI*1.5),material);arc.renderOrder=20;g.add(arc);const head=new THREE.Mesh(new THREE.ConeGeometry(.13,.3,16),material.clone());head.position.set(0,-1.1,0);head.rotation.z=-Math.PI/2;head.renderOrder=21;g.add(head);this.pose.add(g);this.arrow=g;
 }
 update(now){
  if(this.disposed||!this.host.isConnected)return;
  this.sync();const matrix=cssRotation(this.world);if(this.scan)matrix.premultiply(cssRotation(this.world.parentElement));const poseValues=matrix.elements.join(',');
  if(poseValues!==this.poseValues){this.poseValues=poseValues;this.pose.quaternion.setFromRotationMatrix(matrix);this.dirty=true;}
  const orbitValues=this.orbit.x+','+this.orbit.y;if(orbitValues!==this.orbitValues){this.orbitValues=orbitValues;this.root.rotation.set(this.orbit.x,this.orbit.y,0,'YXZ');this.dirty=true;this.host.dataset.viewRotation=orbitValues;}
  if(this.animation){const a=this.animation,t=Math.min(1,(now-a.start)/a.duration),ease=t*t*(3-2*t);a.pivot.rotation[a.axis]=a.angle*ease;this.dirty=true;if(t===1){this.animation=null;a.resolve();}}
  if(!this.dirty)return;this.dirty=false;this.scene.updateMatrixWorld(true);this.renderer.render(this.scene,this.camera);this.projectButtons();
 }
 projectButtons(){
  const v=new THREE.Vector3(),n=new THREE.Vector3(),q=new THREE.Quaternion(),corners=[[-.43,.43],[.43,.43],[.43,-.43],[-.43,-.43]];
  this.tiles.forEach(({tile,button})=>{
   n.set(0,0,1).applyQuaternion(tile.getWorldQuaternion(q));const visible=n.dot(new THREE.Vector3(0,0,1))>.03;
   button.hidden=!visible;if(!visible)return;
   const points=corners.map(([x,y])=>{v.set(x,y,0);tile.localToWorld(v);v.project(this.camera);return [(v.x+1)*this.width/2,(1-v.y)*this.height/2];});
   const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
   Object.assign(button.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px',clipPath:'polygon('+points.map(([x,y])=>`${(x-left)/width*100}% ${(y-top)/height*100}%`).join(',')+')',fontSize:Math.max(8,Math.min(14,width*.22))+'px'});
  });
 }
 async turn(move,duration){
  if(this.animating)return;this.animating=true;const [axis,sign,direction]=axes[move[0]],component={x:0,y:1,z:2}[axis],pivot=new THREE.Group();this.pose.add(pivot);this.parts.filter(p=>p.userData.p[component]===sign).forEach(p=>pivot.attach(p));
  await new Promise(resolve=>{this.animation={pivot,axis,angle:direction*Math.PI/2*(move.includes('2')?2:move.includes("'")?-1:1),duration,start:performance.now(),resolve};});
 }
 finishTurn(){
  for(const part of this.parts){this.pose.attach(part);const p=part.userData.p;if(part.geometry===this.box){part.position.set(...p);part.quaternion.identity();}else{const index=this.tiles.findIndex(t=>t.group===part),face=faces[Math.floor(index/9)],n=new THREE.Vector3(...normals[face]);part.position.set(...p).addScaledVector(n,.5);const up=new THREE.Vector3(...position(face,0,1)).sub(new THREE.Vector3(...position(face,2,1))).normalize(),right=new THREE.Vector3().crossVectors(up,n).normalize();part.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,n));}}
  for(const child of [...this.pose.children])if(child.type==='Group'&&!this.parts.includes(child)&&child!==this.arrow)this.pose.remove(child);this.animating=false;this.signature='';this.dirty=true;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.resize.disconnect();if(this.key)remembered.set(this.key,{orbit:{...this.orbit},pose:this.world.style.transform,face:this.host.dataset.scanCurrent});this.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});this.renderer.dispose();this.renderer.forceContextLoss();this.container.remove();instances.delete(this);
 }
}
function mountAll(scope=document){
 for(const instance of [...instances])if(!instance.host.isConnected)instance.dispose();
 for(const host of scope.querySelectorAll('.scene,.scan-guide-scene')){if(host.classList.contains('webgl-mounted'))continue;const world=host.querySelector('.cube-world,.scan-guide-cube');if(!world)continue;try{const instance=new CubeView(host,world,host.classList.contains('scan-guide-scene'));instances.add(instance);}catch(error){host.dataset.rendererError='3D 화면을 시작하지 못했어요';console.error('3D cube renderer',error);}}
}
function frame(now){for(const instance of instances)instance.update(now);requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.Cube3D={mountAll,async turn(id,move,duration=900){const instance=[...instances].find(v=>v.key===id);if(!instance)return false;await instance.turn(move,duration);return true;},finishTurn(id){[...instances].find(v=>v.key===id)?.finishTurn();},clearViewMemory(){remembered.clear();},geometry:{position,axes,normals}};
