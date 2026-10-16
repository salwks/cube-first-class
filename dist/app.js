if('scrollRestoration' in history)history.scrollRestoration='manual';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const {FACES,COLORS,NAMES,FACE_NAMES}=CubePalette;
let selectedScanCell=null,resetting=false,scanSamples={},scanReferences={};
let route='scan',stream=null,busy=false,scanned=Object.fromEntries(FACES.map(f=>[f,null])),scanFace='F',paint='F',scanError='',lessonOrigin='camera';
function saveScanDraft(){try{localStorage.setItem('cube-scan-draft-v2',JSON.stringify({scanned,scanFace,paint,samples:scanSamples,references:scanReferences}));}catch{}}
try{const draft=JSON.parse(localStorage.getItem('cube-scan-draft-v2')||'null');if(draft&&FACES.every(f=>draft.scanned?.[f]===null||(Array.isArray(draft.scanned?.[f])&&draft.scanned[f].length===9&&draft.scanned[f].every(c=>FACES.includes(c))))){scanned=draft.scanned;scanSamples=draft.samples||{};scanReferences=draft.references||{};scanFace=FACES.includes(draft.scanFace)?draft.scanFace:'F';paint=FACES.includes(draft.paint)?draft.paint:'F';}}catch{}
try{const legacy=JSON.parse(localStorage.getItem('cube-scan-draft-v1')||'null');if(legacy&&Object.values(legacy.scanned||{}).some(Boolean)&&!Object.values(scanned).some(Boolean))scanError='중심색 배치의 좌우 오류를 수정했어요. 이전 촬영은 보관되어 있지만 수정된 기준으로 6면을 다시 찍어주세요.';}catch{}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3300);}
function modal(html){$('#modal-content').innerHTML=html;$('#modal').showModal();Cube3D.mountAll($('#modal-content'));}
function point(f,r,c){switch(f){case'U':return[c-1,1,r-1];case'D':return[c-1,-1,1-r];case'F':return[c-1,1-r,1];case'B':return[1-c,1-r,-1];case'R':return[1,1-r,1-c];case'L':return[-1,1-r,c-1];}}
function tileTransform(f,p){let a={F:'',B:'rotateY(180deg)',R:'rotateY(90deg)',L:'rotateY(-90deg)',U:'rotateX(90deg)',D:'rotateX(-90deg)'}[f];return`translate3d(${p[0]*50}px,${-p[1]*50}px,${p[2]*50}px) ${a} translateZ(25px)`;}
function cubeHTML(str,id=''){let html=`<div class="scene"><div class="cube-world" ${id?`id="${id}"`:''}>`;FACES.forEach((f,fi)=>{for(let i=0;i<9;i++){let p=point(f,Math.floor(i/3),i%3),color=COLORS[str[fi*9+i]];html+=`<div class="sticker" data-f="${f}" data-p="${p}" style="background:${color};transform:${tileTransform(f,p)}"></div>`;}});return html+'</div></div>';}
function drawCube(el,c){if(!el)return;[...el.querySelectorAll('.sticker')].forEach((tile,i)=>{tile.style.background=COLORS[c.asString()[i]];});Cube3D.finishTurn(el.id);}
async function turn(c,move,id){if(busy)return false;busy=true;try{await Cube3D.turn(id,move,id==='flow-cube'?1150:650);c.move(move);drawCube(document.getElementById(id),c);return true;}finally{busy=false;}}
function stopMedia(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}}
function heading(k,h,p){return`<div class="page-heading"><div><div class="eyebrow">${k}</div><h1>${h}</h1><p>${p}</p></div><span class="date-chip">처음이어도 괜찮아요 ✳</span></div>`;}
function scanPage(){const count=Object.values(scanned).filter(Boolean).length;return`<section class="panel scan-studio"><div class="scan-toolbar"><b>내 큐브 촬영 <span>${count}/6면</span></b><button class="primary orange" id="analyze" ${count<6?'hidden':''}>수업 시작 →</button></div>${scanError?`<div class="error scan-error" id="scan-error" role="alert" tabindex="-1">${scanError}</div>`:''}<div class="face-tabs">${['F','R','B','L','U','D'].map(f=>`<button class="${scanFace===f?'active ':''}${scanned[f]?'done':''}" data-face="${f}" aria-label="${NAMES[f]} 면 ${scanned[f]?'촬영 완료':'미촬영'} 보기"><i style="background:${COLORS[f]}"></i>${NAMES[f]}</button>`).join('')}</div><div class="scan-workspace">${ScanGuide.html(scanFace,scanned,selectedScanCell)}<div class="scan-camera-area"><div class="scan-window"><video id="camera" playsinline muted autoplay></video><div class="scan-target">${'<i></i>'.repeat(9)}</div><span class="scan-overlay-label">${NAMES[scanFace]} 중심을 정면으로</span></div><div class="button-row scan-camera-buttons">${stream?'<span class="camera-active"><i></i>카메라 켜짐</span>':'<button class="primary orange" id="open-camera">카메라 켜기</button>'}<button class="primary orange" id="capture" ${!stream?'hidden':''}>${scanned[scanFace]?'다시 촬영':'촬영하기'}</button><details class="scan-options"><summary aria-label="촬영 추가 도구">⋯</summary><div><label class="secondary" style="cursor:pointer">사진 올리기<input id="photo" type="file" accept="image/*" capture="environment" hidden></label><button class="text-btn" id="scan-new">현재 배치 새로 촬영</button><button class="text-btn" id="rotate-face" ${!scanned[scanFace]?'disabled':''}>↻ 사진 방향 90°</button><p>사진은 기기 안에서 처리됩니다. 한 면을 사진 중앙에 꽉 차게 찍어주세요.</p></div></details></div>${selectedScanCell?'<button class="secondary scan-manual-done" id="confirm-face">직접 입력한 면 완료 →</button>':''}</div></div></section>`;}
function orientation(f){if(['F','R','B','L'].includes(f))return`<b>촬영 방향 가이드</b><br>노란 중심이 계속 위쪽을 향하게 잡고 ${NAMES[f]} 중심을 카메라로 보여주세요. 앞 → 오른쪽 → 뒤 → 왼쪽 순서로 큐브 전체를 돌려요.`;if(f==='U')return'<b>윗면 방향</b><br>노란 면을 카메라로 향하게 기울이세요. 초록 면과 맞닿은 변이 사진의 아래쪽이어야 해요.';return'<b>아랫면 방향</b><br>흰 면을 카메라로 향하게 기울이세요. 초록 면과 맞닿은 변이 사진의 위쪽이어야 해요.';}
function render(){if(busy)return;if(stream&&!stream.active)stream=null;const scanning=route==='scan',y=scanning?window.scrollY:0,x=scanning?window.scrollX:0,video=scanning?$('#camera'):null,keepCaptureFocus=scanning&&document.activeElement?.id==='capture',lessonFocus=!scanning&&['teacher-next','teacher-prev'].includes(document.activeElement?.id)?document.activeElement.id:null;if(scanning)saveScanDraft();$('#app').innerHTML={home,scan:scanPage,learn:learnPage,practice:practicePage}[route]();if(video&&$('#camera'))$('#camera').replaceWith(video);bind();Cube3D.mountAll();if(scanning){if(keepCaptureFocus)$('#capture')?.focus({preventScroll:true});window.scrollTo({top:y,left:x,behavior:'instant'});}else if(lessonFocus)$('#'+lessonFocus)?.focus({preventScroll:true});}

$('.modal-close').onclick=()=>$('#modal').close();$('#modal').onclick=e=>{if(e.target===$('#modal'))$('#modal').close();};
function resetAllProgress(){resetting=true;stopMedia();LessonFlow.clear();try{const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i));keys.filter(k=>/^(cube-scan-draft-|cube-consistent-|cube-class-)/.test(k)).forEach(k=>localStorage.removeItem(k));}catch{}location.hash='#home';location.reload();}
$('#reset-app').onclick=resetAllProgress;
$('#help').onclick=()=>modal('<h2>내 큐브로 원리를 배우며 맞춰요.</h2><ol><li>여섯 면을 촬영하고 읽은 색을 확인해요.</li><li>돌릴 색의 중심면을 정면에서 볼 때의 방향으로 실물을 돌려요.</li><li>따라했어요 · 다음을 누르면 화면도 같은 상태로 이동하고 다음 동작의 이유를 알려줘요.</li><li>이전 동작은 실물도 반대로 되돌려야 해요. 화면과 다르면 현재 큐브를 다시 촬영할 수 있어요.</li></ol><p>노랑 위·흰색 아래가 기준이에요. 꽃 → 흰 십자 → 첫 층 → 가운데 층 → 노란 십자 → 노란 면 → 마지막 자리 순서로 배웁니다. 시범과 가상 연습은 실물 진도에 반영하지 않아요. 사진은 기기 안에서 처리합니다.</p>');
function navigate(){stopMedia();const nextRoute=(location.hash.slice(1)||'scan').split('/')[0];if(route==='practice'&&nextRoute!=='practice')LessonFlow.leaveLab(false);route=['scan','learn','practice'].includes(nextRoute)?nextRoute:'scan';$$('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===route));$('#breadcrumb').textContent={scan:'내 큐브 촬영',learn:'초보자 순서로 따라 맞추기',practice:'내 촬영 큐브로 가상 연습'}[route];render();if(route==='learn')LessonFlow.position();else window.scrollTo(0,0);}
window.addEventListener('hashchange',navigate);
function home(){return scanPage();}
function valid(str){if(str.length!==54||FACES.some(f=>[...str].filter(c=>c===f).length!==9))throw Error('각 색은 정확히 9칸이어야 해요. 6면의 색을 다시 확인해주세요.');const c=Cube.fromString(str);if(c.asString()!==str||new Set(c.cp).size!==8||new Set(c.ep).size!==12||c.co.reduce((a,b)=>a+b,0)%3||c.eo.reduce((a,b)=>a+b,0)%2)throw Error('조각의 색 조합이나 방향이 맞지 않아요. 특히 윗면·아랫면 촬영 방향과 빨강·주황을 확인해주세요.');const parity=a=>a.reduce((n,v,i)=>n+a.slice(i+1).filter(x=>x<v).length,0)%2;if(parity(c.cp)!==parity(c.ep))throw Error('실제 회전으로 만들 수 없는 배치예요. 촬영 방향과 색을 다시 확인해주세요.');return c;}
function analyze(str){LessonFlow.openCaptured(str);}
function learnPage(){return LessonFlow.page();}
function practicePage(){return LessonFlow.practicePage();}
function bind(){if(route==='scan')bindScan();else LessonFlow.bind();}
function beginRescan(){if(busy)return;saveScanDraft();try{localStorage.setItem('cube-scan-draft-previous',localStorage.getItem('cube-scan-draft-v2'));}catch{}scanned=Object.fromEntries(FACES.map(f=>[f,null]));scanSamples={};scanReferences={};scanFace='F';paint='F';scanError='';selectedScanCell=null;saveScanDraft();if(location.hash==='#scan')render();else location.hash='#scan';}
window.addEventListener('pagehide',()=>{stopMedia();if(!resetting)saveScanDraft();});

function startCapturedLesson(){
 saveScanDraft();
 if(FACES.some(f=>!scanned[f])){scanError='6면을 모두 촬영하거나 큐브의 칸을 눌러 색을 입력해주세요.';render();return false;}
 const str=FACES.map(f=>scanned[f].join('')).join('');
 try{valid(str);}catch(e){const differences=FACES.map(f=>({f,n:[...str].filter(c=>c===f).length})).filter(x=>x.n!==9);const excess=differences.filter(x=>x.n>9).map(x=>x.f);if(excess.length){const ranked=FACES.map(f=>({f,n:scanned[f].filter((c,i)=>i!==4&&excess.includes(c)).length})).sort((a,b)=>b.n-a.n);scanFace=ranked[0].f;selectedScanCell=null;}scanError='6면은 모두 저장됐지만 색상 확인이 필요해요. '+e.message+(differences.length?' '+differences.map(x=>`${NAMES[x.f]} ${x.n}칸`).join(' · ')+' (각 색은 9칸이어야 해요). 흰 테두리로 표시한 칸을 실제 큐브와 비교하고, 다른 색으로 읽힌 칸을 눌러 수정해주세요.':' 큐브의 실제 색과 비교하고, 윗면·아랫면 사진 방향도 확인해주세요.');render();const message=$('#scan-error');if(message){message.focus({preventScroll:true});}toast('촬영은 저장됐어요. 화면 위의 색상 확인 안내를 봐주세요.');return false;}
 scanError='';stopMedia();lessonOrigin='camera';analyze(str);return true;
}
function bindScan(){
ScanGuide.bind(scanFace);
$('#scan-new').onclick=beginRescan;
if(stream){const video=$('#camera');video.srcObject=stream;video.play().catch(()=>{});}
$$('[data-face]').forEach(b=>b.onclick=()=>{scanFace=b.dataset.face;paint=scanFace;selectedScanCell=null;scanError='';render();});
$$('[data-scan-cell]').forEach(b=>b.onclick=()=>{selectedScanCell={face:b.dataset.scanFace,index:+b.dataset.scanCell};render();});
$$('[data-paint]').forEach(b=>b.onclick=()=>{if(!selectedScanCell)return;const {face,index}=selectedScanCell;if(index===4)return;if(!scanned[face])scanned[face]=Array(9).fill(face);scanned[face][index]=b.dataset.paint;delete scanSamples[face];paint=b.dataset.paint;scanError='';render();});
const close=$('#close-scan-palette');if(close)close.onclick=()=>{selectedScanCell=null;render();};
$('#rotate-face').onclick=()=>{let a=scanned[scanFace];if(!a)return;scanned[scanFace]=[a[6],a[3],a[0],a[7],a[4],a[1],a[8],a[5],a[2]];if(scanSamples[scanFace]){const samples=scanSamples[scanFace];scanSamples[scanFace]=[samples[6],samples[3],samples[0],samples[7],samples[4],samples[1],samples[8],samples[5],samples[2]];}selectedScanCell=null;render();};
const confirm=$('#confirm-face');if(confirm)confirm.onclick=()=>{const face=selectedScanCell?.face||scanFace;if(!scanned[face])scanned[face]=Array(9).fill(face);scanned[face][4]=face;const next=['F','R','B','L','U','D'].find(f=>!scanned[f]);if(next){scanFace=next;paint=next;}selectedScanCell=null;render();if(!next)startCapturedLesson();};
const open=$('#open-camera');if(open)open.onclick=async()=>{if(stream?.active){render();return;}open.disabled=true;open.textContent='카메라 연결 중…';try{if(!navigator.mediaDevices?.getUserMedia)throw Error();stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:960}},audio:false});if(route!=='scan'){stopMedia();return;}stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(route==='scan'){stream=null;render();toast('카메라 연결이 끊겼어요. 카메라를 다시 켜주세요.');}}));render();await $('#camera').play();toast('카메라는 계속 켜져 있어요. 큐브 방향만 바꿔 한 면씩 촬영하세요.');}catch{stream=null;render();toast('카메라를 열 수 없어요. 사진 올리기 또는 큐브에서 색 직접 입력을 이용해주세요.');}};
$('#capture').onclick=()=>{let video=$('#camera');if(!stream||!video.videoWidth)return toast('먼저 카메라를 켜주세요.');const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;const ctx=c.getContext('2d');ctx.drawImage(video,0,0);const box=$('.scan-window').getBoundingClientRect(),scale=Math.max(box.width/c.width,box.height/c.height),size=$('.scan-target').getBoundingClientRect().width/scale;readColors(c,size);};
$('#photo').onchange=async e=>{let file=e.target.files[0];if(!file)return;const url=URL.createObjectURL(file);try{let image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');let ratio=Math.min(1,1400/Math.max(image.width,image.height));canvas.width=image.width*ratio;canvas.height=image.height*ratio;canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);readColors(canvas,Math.min(canvas.width,canvas.height)*.9);}catch{toast('사진을 읽지 못했어요. JPG 또는 PNG 사진을 사용해주세요.');}finally{URL.revokeObjectURL(url);}};
$('#analyze').onclick=startCapturedLesson;
}

function classify(r,g,b){return CubeColorReader.classify([r,g,b],scanReferences);}
function readColors(canvas,size){
 const captured=scanFace,measured=CubeColorReader.sample(canvas,size);scanSamples[captured]=measured.samples;
 if(CubeColorReader.referenceIsUsable(captured,measured.reference))scanReferences[captured]=measured.reference;
 const assigned=CubeColorReader.assign(scanSamples,scanReferences);Object.entries(assigned).forEach(([face,colors])=>scanned[face]=colors);
 selectedScanCell=null;scanError='';const next=['F','R','B','L','U','D'].find(f=>!scanned[f]);if(next){scanFace=next;paint=next;}render();
 if(next){toast(`${NAMES[captured]} 면 저장 완료. 중심색은 임의로 ${NAMES[captured]}으로 인식됩니다. 다음은 ${NAMES[next]} 면이에요.${stream?' 카메라는 계속 켜져 있어요.':''}`);}
 else if(startCapturedLesson())toast(`6면 촬영 완료! 중심색은 ${NAMES[captured]}으로 임의 인식됐어요. 내 큐브 수업을 시작합니다.`);
}

function bindPractice(){LessonFlow.bind();}
navigate();
