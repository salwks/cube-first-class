/* Whole-cube poses preserve the photographed face's row/column convention. */
const ScanGuide=(()=>{
 const poses={F:[0,0],R:[0,-90],B:[0,-180],L:[0,-270],U:[-90,0],D:[90,0]};
 const refs={F:['U','R'],R:['U','B'],B:['U','L'],L:['U','F'],U:['B','R'],D:['F','R']};
 const turns={F:'',R:'rotateY(90deg)',B:'rotateY(180deg)',L:'rotateY(-90deg)',U:'rotateX(90deg)',D:'rotateX(-90deg)'};
 let previous=null,lastFrom='R',run=0;
 function html(f,faces={},selected=null){const [top,right]=refs[f];return `<div class="scan-guide" aria-label="내 큐브 촬영과 색상 수정"><div class="scan-guide-head"><span class="kicker">${NAMES[f]} 면 · ${faces[f]?'촬영한 색 확인':f==='U'?'윗면을 기울여 촬영':f==='D'?'아랫면을 기울여 촬영':'같은 방향으로 촬영'}</span><button class="text-btn" id="replay-scan">↻ 회전 다시 보기</button></div><div class="scan-guide-stage"><div class="scan-guide-tip" role="status" aria-live="polite" id="scan-motion-tip">${NAMES[f]} 중심이 정면, ${NAMES[top]} 중심이 위쪽이에요.</div><div class="scan-guide-scene" role="group" aria-label="정면 ${NAMES[f]}, 위 ${NAMES[top]}, 오른쪽 ${NAMES[right]} 중심의 내 큐브"><div class="scan-guide-view"><div class="scan-guide-cube" id="scan-guide-cube">${FACES.map(face=>`<div class="scan-guide-face" data-guide-face="${face}" style="transform:${turns[face]} translateZ(96px)">${Array.from({length:9},(_,i)=>{const color=i===4?face:faces[face]?.[i],picked=selected?.face===face&&selected.index===i;return `<button type="button" class="${i===4?'scan-center':''} ${picked?'scan-picked':''}" ${i===4?'disabled':`data-scan-face="${face}" data-scan-cell="${i}" aria-pressed="${picked}"`} ${color?`style="background:${COLORS[color]}"`:''} aria-label="${NAMES[face]} 면 ${i+1}번 칸 ${color?NAMES[color]:'미촬영'}${i===4?' 중심 고정':' 색 수정'}">${i===4?NAMES[face]:''}</button>`;}).join('')}</div>`).join('')}</div></div></div>${selected?`<div class="scan-inline-palette" aria-label="선택한 큐브 칸의 색 수정"><div><span>${NAMES[selected.face]} 면 ${selected.index+1}번 칸</span><button class="text-btn" id="close-scan-palette" aria-label="색 선택 닫기">×</button></div><div class="palette">${FACES.map(color=>`<button data-paint="${color}" style="background:${COLORS[color]}" aria-label="${NAMES[color]}으로 수정"></button>`).join('')}</div></div>`:''}</div><p class="scan-center-note" role="status">가운데가 ${NAMES[f]}인지 확인해주세요. 로고가 있을 수 있어 중심색은 ${NAMES[f]}으로 임의 인식됩니다.</p><p class="scan-tile-hint">찍은 색은 이 큐브에 바로 채워져요. 틀린 칸은 눌러서 고쳐주세요.</p></div>`;}
 const transform=([x,y])=>`rotateX(${x}deg) rotateY(${y}deg)`;
 function path(from,to){
  if(from===to)return [{pose:poses[to],text:`${NAMES[to]} 중심을 카메라로 보여주세요. 위쪽 이웃은 ${NAMES[refs[to][0]]}이에요.`}];
  if(['F','R','B','L'].includes(from)&&['F','R','B','L'].includes(to)){
   let y=poses[to][1];while(y-poses[from][1]>180)y-=360;while(y-poses[from][1]<-180)y+=360;
   return [{pose:[0,y],text:`노랑은 계속 위로! 큐브 전체를 돌려 ${NAMES[to]} 중심을 정면으로 가져오세요.`}];
  }
  return [{pose:[0,from==='L'?-360:0],text:'먼저 노랑을 위로, 초록 중심을 정면으로 잡아요.'},{pose:[poses[to][0],from==='L'?-360:poses[to][1]],text:to==='U'?'큐브 전체를 기울여 노란 중심을 정면으로! 초록 중심은 아래쪽이에요.':to==='D'?'큐브 전체를 기울여 흰 중심을 정면으로! 초록 중심은 위쪽이에요.':`${NAMES[to]} 중심이 정면으로 오도록 큐브 전체를 돌려요.`}];
 }
 function bind(f){const el=document.querySelector('#scan-guide-cube'),tip=document.querySelector('#scan-motion-tip');if(!el)return;const changed=previous!==null&&previous!==f;if(previous!==f)lastFrom=previous||'R';const from=lastFrom;previous=f;let motion=false;
  async function play(){motion=true;const ticket=++run;const replay=document.querySelector('#replay-scan');replay.disabled=true;el.style.transition='none';el.style.transform=transform(poses[from]);
   const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));await wait(80);
   const steps=path(from,f),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   for(const step of steps){if(ticket!==run||!el.isConnected)return;tip.textContent=step.text;el.style.transition=reduced?'none':'transform 1.6s cubic-bezier(.35,0,.25,1)';el.style.transform=transform(step.pose);await wait(reduced?0:1900);}
   if(ticket!==run||!el.isConnected)return;tip.textContent=`화면의 중심색과 같은 방향으로 잡고, ${NAMES[f]} 중심면을 반듯하게 찍어주세요.`;replay.disabled=false;motion=false;
  }
  el.addEventListener('click',e=>{if(motion)e.stopImmediatePropagation();},true);document.querySelector('#replay-scan').onclick=play;if(changed)play();else el.style.transform=transform(poses[f]);
 }
 return {html,bind,poses,refs,path};
})();
