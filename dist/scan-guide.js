/* Whole-cube poses preserve the photographed face's row/column convention. */
const ScanGuide=(()=>{
 const poses={F:[0,0],R:[0,-90],B:[0,-180],L:[0,-270],U:[-90,0],D:[90,0]};
 const refs={F:['U','R'],R:['U','B'],B:['U','L'],L:['U','F'],U:['B','R'],D:['F','R']};
 const turns={F:'',R:'rotateY(90deg)',B:'rotateY(180deg)',L:'rotateY(-90deg)',U:'rotateX(90deg)',D:'rotateX(-90deg)'};
 let previous=null,lastFrom='R',run=0;
 function html(f){const [top,right]=refs[f];return `<section class="scan-guide" aria-label="촬영 방향 3D 가이드"><div class="scan-guide-head"><span class="kicker">${['F','R','B','L','U','D'].indexOf(f)+1}/6 · ${f==='U'?'윗면을 기울여 촬영':f==='D'?'아랫면을 기울여 촬영':'옆면 촬영'}</span><button class="text-btn" id="replay-scan">↻ 회전 다시 보기</button></div><div class="scan-guide-stage"><div class="scan-guide-tip" role="status" aria-live="polite" id="scan-motion-tip">${NAMES[f]} 중심이 정면, ${NAMES[top]} 중심이 위쪽이에요.</div><div class="scan-guide-scene" role="img" aria-label="정면 ${NAMES[f]}, 위 ${NAMES[top]}, 오른쪽 ${NAMES[right]} 중심의 입체 큐브"><div class="scan-guide-view"><div class="scan-guide-cube" id="scan-guide-cube">${FACES.map(face=>`<div class="scan-guide-face" data-guide-face="${face}" style="transform:${turns[face]} translateZ(66px)">${Array.from({length:9},(_,i)=>`<span class="${i===4?'scan-center':''}" ${i===4?`style="background:${COLORS[face]}"`:''}>${i===4?NAMES[face]:''}</span>`).join('')}</div>`).join('')}</div></div></div></div></section>`;}
 const transform=([x,y])=>`rotateX(${x}deg) rotateY(${y}deg)`;
 function path(from,to){
  if(from===to)return [{pose:poses[to],text:`${NAMES[to]} 중심을 카메라로 보여주세요. 위쪽 이웃은 ${NAMES[refs[to][0]]}이에요.`}];
  if(['F','R','B','L'].includes(from)&&['F','R','B','L'].includes(to)){
   let y=poses[to][1];while(y-poses[from][1]>180)y-=360;while(y-poses[from][1]<-180)y+=360;
   return [{pose:[0,y],text:`노랑은 계속 위로! 큐브 전체를 돌려 ${NAMES[to]} 중심을 정면으로 가져오세요.`}];
  }
  return [{pose:[0,from==='L'?-360:0],text:'먼저 노랑을 위로, 초록 중심을 정면으로 잡아요.'},{pose:[poses[to][0],from==='L'?-360:poses[to][1]],text:to==='U'?'큐브 전체를 기울여 노란 중심을 정면으로! 초록 중심은 아래쪽이에요.':to==='D'?'큐브 전체를 기울여 흰 중심을 정면으로! 초록 중심은 위쪽이에요.':`${NAMES[to]} 중심이 정면으로 오도록 큐브 전체를 돌려요.`}];
 }
 function bind(f){const el=document.querySelector('#scan-guide-cube'),tip=document.querySelector('#scan-motion-tip');if(!el)return;const changed=previous!==f;if(changed)lastFrom=previous||'R';const from=lastFrom;previous=f;
  async function play(){const ticket=++run;const replay=document.querySelector('#replay-scan');replay.disabled=true;el.style.transition='none';el.style.transform=transform(poses[from]);
   const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));await wait(80);
   const steps=path(from,f),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   for(const step of steps){if(ticket!==run||!el.isConnected)return;tip.textContent=step.text;el.style.transition=reduced?'none':'transform 1.6s cubic-bezier(.35,0,.25,1)';el.style.transform=transform(step.pose);await wait(reduced?0:1900);}
   if(ticket!==run||!el.isConnected)return;tip.textContent=`화면의 중심색과 같은 방향으로 잡고, ${NAMES[f]} 중심면을 반듯하게 찍어주세요.`;replay.disabled=false;
  }
  document.querySelector('#replay-scan').onclick=play;if(changed)play();else el.style.transform=transform(poses[f]);
 }
 return {html,bind,poses,refs,path};
})();
