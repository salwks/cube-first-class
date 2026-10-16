/* Original Korean teaching copy. Instructions are derived from the real cube model. */
(function(root){
const names={U:'노랑',R:'주황',F:'초록',D:'흰색',L:'빨강',B:'파랑'};
const edgeColors=['UR','UF','UL','UB','DR','DF','DL','DB','FR','FL','BL','BR'];
const cornerColors=['URF','UFL','ULB','UBR','DFR','DLF','DBL','DRB'];
const edgeTiles=[[5,10],[7,19],[3,37],[1,46],[32,16],[28,25],[30,43],[34,52],[23,12],[21,41],[50,39],[48,14]];
const cornerTiles=[[8,9,20],[6,18,38],[0,36,47],[2,45,11],[29,26,15],[27,44,24],[33,53,42],[35,17,51]];
const faces=['U','R','F','D','L','B'];
const courses=[
 {id:'flower',title:'흰 꽃',goal:'노란 중심 옆에 흰 꽃잎 네 개',principle:'변 조각의 두 색은 한 몸이에요. 노란 중심 주위에 흰색을 모은 뒤, 옆 색은 다음 십자에서 맞춰요.',protect:'먼저 올린 흰 꽃잎',success:'노란 중심 옆에 흰색 네 칸이 모였어요. 옆 색은 아직 달라도 괜찮아요.'},
 {id:'cross',title:'흰 십자',goal:'흰 십자와 네 옆 색까지 중심에 연결',principle:'윗면에서 옆 색을 같은 색 중심에 맞추고 그 면을 반 바퀴 내려요. 한 조각의 두 색이 각각 자기 중심으로 갑니다.',protect:'맞춘 십자와 위에 남은 꽃잎',success:'아래 흰 중심의 십자와 네 옆면 색이 모두 연결됐어요.'},
 {id:'corners',title:'첫 층 코너',goal:'흰 코너의 세 색을 중심 사이에 맞추기',principle:'꼭짓점 조각은 세 색이에요. 세 중심 사이의 집 위로 가져오고, 짧은 넣기 패턴으로 첫 층을 복구해요.',protect:'흰 십자와 넣어 둔 코너',success:'흰 면뿐 아니라 옆면의 첫 줄까지 맞았어요.'},
 {id:'middle',title:'가운데 층',goal:'노랑 없는 변 조각으로 아래 두 층 완성',principle:'윗층에서 노랑 없는 변을 골라 중심에 정렬해요. 넣을 쪽의 반대로 피하고, 코너를 꺼냈다 함께 넣어 첫 층을 복구합니다.',protect:'첫 층과 이미 맞춘 가운데 변',success:'아래 두 층이 맞았어요. 이제 남은 노란 조각의 방향과 자리를 나눠 볼 거예요.'},
 {id:'yellowCross',title:'노란 십자',goal:'위 네 변의 노랑이 위를 향하기',principle:'점·ㄱ·일자는 변 조각의 방향이 다른 상태예요. 같은 짧은 패턴을 반복해 노란색을 위로 향하게 합니다.',protect:'아래 두 층',success:'노란 십자가 생겼어요. 옆 색의 자리는 아직 달라도 괜찮아요.'},
 {id:'yellowFace',title:'노란 면',goal:'노란 코너도 위를 향하기',principle:'노랑이 위를 향하는 것과 옆 색의 자리가 맞는 것은 달라요. 지금은 코너의 방향부터 바꿉니다.',protect:'아래 두 층과 노란 십자',success:'윗면은 모두 노랑이에요. 다음에는 코너의 옆 색이 자기 중심에 맞는지 봐요.'},
 {id:'cornerPlace',title:'마지막 코너 자리',goal:'위 코너의 세 색이 자기 중심과 만나기',principle:'방향이 맞아도 조각의 집이 다를 수 있어요. 코너 자리를 바꾸고, 남은 윗층 변의 자리는 마지막에 정리해요.',protect:'아래 두 층과 노란색의 방향',success:'코너의 옆 색까지 맞았어요. 마지막 변 조각만 순환시키면 됩니다.'},
 {id:'edgePlace',title:'마지막 변 자리',goal:'남은 변을 순환시켜 여섯 면 완성',principle:'필요한 윗층 변의 자리만 순환시키는 패턴이에요. 코너와 아래 두 층은 묶음이 끝나면 그대로 유지돼요.',protect:'모든 코너와 아래 두 층',success:'여섯 면이 모두 맞았어요. 중심색으로 각 조각의 집을 찾으며 완성했습니다.'}
];
function turnText(move){const f=move[0],suffix=move.slice(1);return `${names[f]} 중심면을 ${suffix==='2'?'반 바퀴 (180°)':suffix==="'"?'반시계로 90°':'시계 방향으로 90°'} 돌려요`;}
function targetName(segment){return segment.piece==null?'노란 조각들':(segment.kind==='corner'?cornerColors:edgeColors)[segment.piece].split('').map(f=>names[f]).join('·')+' '+(segment.kind==='corner'?'꼭짓점 조각':'변 조각');}
function focus(cube,stage,segment){if(segment.piece!=null)return{piece:segment.piece,kind:segment.kind};if(stage===6){const pos=cube.cp.slice(0,4).findIndex((p,i)=>p!==i);if(pos>=0)return{piece:cube.cp[pos],kind:'corner'};}if(stage===7){const pos=cube.ep.slice(0,4).findIndex((p,i)=>p!==i);if(pos>=0)return{piece:cube.ep[pos],kind:'edge'};}return{piece:null,kind:[5,6].includes(stage)?'corner':'edge'};}
function patterns(segment,sequence,stage){return segment.patterns?.length?segment.patterns:[{start:segment.start,end:segment.end,moves:sequence,kind:courses[stage].id,label:stage<2?'조각 옮기기':courses[stage].title+' 패턴'}];}
function instruction(cube,stage,segment,sequence,cursor){
 const move=sequence[cursor];if(!move)return null;
 const initial=cube.constructor.fromString(segment.initial),next=cube.clone().move(move),d={...segment,...focus(initial,stage,segment)},corner=d.kind==='corner',pieces=corner?cube.cp:cube.ep,nextPieces=corner?next.cp:next.ep,pos=d.piece==null?null:pieces.indexOf(d.piece),to=d.piece==null?null:nextPieces.indexOf(d.piece);
 const pattern=patterns(d,sequence,stage).find(p=>p.start<=d.start+cursor&&p.end>d.start+cursor)||{start:d.start,end:d.end,label:'동작 묶음'};
 const local=d.start+cursor-pattern.start,whiteFace=x=>{if(d.piece==null)return null;const i=(corner?cornerTiles:edgeTiles)[(corner?x.cp:x.ep).indexOf(d.piece)].find(i=>x.asString()[i]==='D');return i==null?null:faces[Math.floor(i/9)];};
 let observe=targetName(d),reason='',check='';
 if(stage===0){const layer=pos<4?'윗층':pos<8?'아랫층':'가운데 층';observe+=`이 ${layer}에 있어요.`;const wf=whiteFace(cube),after=whiteFace(next);
  if(move[0]==='U'&&pos>=4)reason='먼저 올린 꽃잎을 위에 남긴 채 빈자리를 준비해요. 새 꽃잎을 올릴 자리가 필요합니다.';
  else if(move[0]==='D'&&pos>=4&&pos<8)reason='아랫층의 조각을 올릴 면 쪽으로 옮기는 준비예요. 두 색이 붙은 한 조각을 따라가세요.';
  else if(after==='U')reason=`${names[wf]} 쪽을 향하던 흰색을 위로 올려요. 두 색은 떨어지지 않고 함께 움직입니다.`;
  else reason='먼저 흰색을 위로 올릴 수 있는 방향으로 조각을 옮겨요. 흰색 한 칸만 따로 회전하는 것은 아니에요.';
  check=after==='U'?'흰색이 노란 중심 옆으로 왔는지, 먼저 올린 꽃잎도 남아 있는지 보세요.':`돌린 뒤 흰색이 ${names[after]} 중심면 쪽을 향해요. 다음 동작에서 꽃잎으로 이어갑니다.`;
 }else if(stage===1){const side=edgeColors[d.piece].replace('D',''),aligned=pos===d.piece-4&&cube.eo[pos]===0;
  observe=aligned?`${targetName(d)}의 옆 색이 ${names[side]} 중심 위에 맞았어요.`:`${targetName(d)}의 옆 색과 ${names[side]} 중심을 연결할 거예요.`;
  reason=move[0]==='U'?`흰색을 위에 둔 채 옆 색을 ${names[side]} 중심에 정렬하는 동작이에요.`:'반 바퀴를 돌리면 흰색은 아래 흰 중심으로, 옆 색은 자기 중심 옆으로 함께 갑니다.';
  check=move[0]==='U'?`돌린 뒤 옆 색이 ${names[side]} 중심 바로 위에 맞는지 보세요.`:'아래 흰색과 옆 색이 모두 맞았는지 보세요. 남은 꽃잎은 위에 있어야 해요.';
 }else{
  const course=courses[stage];observe+=stage===4?` · 현재 노란 변 ${[1,3,5,7].filter(i=>cube.asString()[i]==='U').length}개가 위를 향해요.`:stage===5?` · 노란 코너 ${[0,2,6,8].filter(i=>cube.asString()[i]==='U').length}개가 위를 향해요.`:'을 중심색과 비교해요.';
  reason=pattern.kind==='setup'?'윗층에서 조각과 패턴의 시작 방향을 맞추는 준비예요.':stage===2?'조각을 옮겼다가 옆면을 되돌리는 넣기 패턴이에요. 묶음 끝에는 흰 십자가 돌아옵니다.':stage===3?'넣을 자리를 피하고 코너와 변을 함께 넣는 패턴이에요. 첫 층은 묶음 끝에 복구해요.':stage===4?'앞면을 열었다 닫는 사이에 노란 변의 방향을 바꿔요. 옆 색의 자리는 아직 달라도 됩니다.':stage===5?'코너의 노랑이 위를 향하게 바꾸는 패턴이에요. 옆 색의 자리와 방향을 구별해요.':stage===6?(local<4?'먼저 배운 옆면·윗면 동작으로 교환할 코너를 준비해요. 뒤의 동작까지 이어서 복구합니다.':'다른 조각을 옮겼다 되돌려 코너의 집을 바꿔요. 윗층 변의 자리는 마지막에 정리합니다.'):'윗층의 변 자리를 순환시켜요. 코너와 아래 두 층은 묶음 끝에 돌아옵니다.';
  check=local===pattern.end-pattern.start-1?`묶음 끝이에요. ${course.protect}이 복구됐는지 확인하세요.`:`중간에는 잠시 흐트러질 수 있어요. ${course.protect}은 묶음 끝에서 확인합니다.`;
 }
 return{move,face:move[0],action:turnText(move),observe,reason,check,target:targetName(d),pattern:pattern.label,patternStep:local+1,patternLength:pattern.end-pattern.start,step:cursor+1,total:sequence.length,position:pos,nextPosition:to,direction:move.endsWith('2')?'half':move.endsWith("'")?'counterclockwise':'clockwise',protect:courses[stage].protect};
}
root.CubeTeacher={courses,turnText,targetName,focus,patterns,instruction};if(typeof module!=='undefined')module.exports=root.CubeTeacher;
})(typeof self!=='undefined'?self:globalThis);
