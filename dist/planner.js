/* Beginner layer-by-layer planner. No two-phase/shortest-solution solver is used. */
(function(root){
const yaw=(s,n)=>s.replace(/[FRBL]/g,c=>'FRBL'[('FRBL'.indexOf(c)+n)%4]);
const variants=s=>[0,1,2,3].map(n=>yaw(s,n));
const inverse=s=>Cube.inverse(s);
const allMoves='U R F D L B'.split(' ').flatMap(f=>[f,f+"'",f+'2']);
const setup=['U',"U'",'U2'];
const sexy=variants("R U R' U'");
const insert=variants("U R U' R' U' F' U F");
const crossAlg=variants("F R U R' U' F'");
const sune=variants("R U R' U R U2 R'");
const tperm=variants("R U R' U' R' F R2 U' R' U' R U R' F'");
const uperm=variants("R U' R U R U R U' R' U' R2");
const ec=c=>[4,5,6,7].filter(i=>c.ep[i]===i&&c.eo[i]===0).length;
const cc=c=>[4,5,6,7].filter(i=>c.cp[i]===i&&c.co[i]===0).length;
const mc=c=>[8,9,10,11].filter(i=>c.ep[i]===i&&c.eo[i]===0).length;
const petals=c=>[0,1,2,3].filter(i=>c.ep[i]>=4&&c.ep[i]<=7&&c.eo[i]===0).length;
function key(c,kind){let out='';const pieces=kind==='corner'?[4,5,6,7]:kind==='middle'?[8,9,10,11]:[4,5,6,7];if(['corner','middle','flower'].includes(kind)){const a=kind==='corner'?c.cp:c.ep,b=kind==='corner'?c.co:c.eo;for(const p of pieces){let i=a.indexOf(p);out+=String.fromCharCode(65+i*3+b[i]);}return out;}if(kind==='orient')return c.eo.slice(0,4).join('')+c.co.slice(0,4).join('');return c.cp.join(',')+'/'+c.co.join('')+'/'+c.ep.join(',')+'/'+c.eo.join('');}
function find(start,goal,algs,kind,max=6){if(goal(start))return [];const transforms=algs.map(a=>new Cube().move(a));let queue=[{c:start.clone(),p:[],last:-1}],seen=new Set([key(start,kind)]),head=0;while(head<queue.length){const n=queue[head++];if(n.p.length>=max)continue;for(let i=0;i<algs.length;i++){const c=n.c.clone().multiply(transforms[i]);const k=key(c,kind);if(seen.has(k))continue;const p=[...n.p,algs[i]];if(goal(c))return p;seen.add(k);queue.push({c,p,last:i});if(queue.length>240000)throw Error('이 배치를 분석하는 데 시간이 오래 걸려요. 촬영한 면의 방향과 색을 다시 확인해주세요.');}}throw Error('초보자 경로를 찾지 못했어요. 입력한 색과 면의 방향을 확인해주세요.');}
function plan(facelets,progress=()=>{},startStage=0){
let c=Cube.fromString(facelets),stages=[];
const stage=(id,title,principle)=>{const s={id,title,principle,initial:c.asString(),segments:[],moves:[],final:null};stages.push(s);progress(title);return s;};
function add(s,algs,why,target){const moves=algs.join(' ').trim().split(/\s+/).filter(Boolean);if(!moves.length)return;const start=s.moves.length,before=c.clone();c.move(moves.join(' '));let piece=null,kind='edge';if(s.id==='flower'){for(let i=0;i<4;i++)if(c.ep[i]>=4&&c.ep[i]<=7&&c.eo[i]===0){let j=before.ep.indexOf(c.ep[i]);if(j>3||before.eo[j]!==0){piece=c.ep[i];break;}}}else if(s.id==='cross'){for(let i=4;i<8;i++)if(c.ep[i]===i&&c.eo[i]===0&&(before.ep[i]!==i||before.eo[i]!==0)){piece=i;break;}}else if(s.id==='corners'){kind='corner';for(let i=4;i<8;i++)if(c.cp[i]===i&&c.co[i]===0&&(before.cp[i]!==i||before.co[i]!==0)){piece=i;break;}}else if(s.id==='middle'){for(let i=8;i<12;i++)if(c.ep[i]===i&&c.eo[i]===0&&(before.ep[i]!==i||before.eo[i]!==0)){piece=i;break;}}s.segments.push({start,end:start+moves.length,why,target,piece,kind,initial:before.asString(),final:c.asString()});s.moves.push(...moves);}
function finish(s){s.final=c.asString();}
let s=stage('flower','노란 중심에 흰 꽃 만들기','흰색이 들어간 엣지 조각 4개를 노란 중심 주위로 모아요. 중심은 움직이지 않고, 엣지는 두 색이 함께 움직여요.');
if(startStage<=0)for(const piece of [6,5,4,7]){const isPetal=(x,p)=>{const i=x.ep.indexOf(p);return i<4&&x.eo[i]===0;};if(isPetal(c,piece))continue;const fixed=[4,5,6,7].filter(p=>isPetal(c,p));add(s,find(c,x=>isPetal(x,piece)&&fixed.every(p=>isPetal(x,p)),allMoves,'flower',6),'흰 엣지가 들어 있는 층을 돌려 노란 중심 옆의 꽃잎 자리로 올려요. 이미 올린 흰 꽃잎도 위에 남겨요.','흰 엣지 하나를 꽃잎으로');s.segments.at(-1).piece=piece;}finish(s);
s=stage('cross','옆 색까지 맞는 흰 십자 만들기','꽃잎의 옆 색과 같은 중심을 먼저 나란히 맞춰요. 그 면을 180° 돌리면 흰색은 아래로, 옆 색은 제자리로 함께 이동해요.');
if(startStage<=1)while(ec(c)<4){let piece=[6,5,4,7].find(p=>c.ep[p]!==p||c.eo[p]!==0),pos=c.ep.indexOf(piece);if(pos>3||c.eo[pos]!==0)throw Error('남은 흰 엣지가 위의 꽃잎 상태여야 십자를 이어갈 수 있어요. 마지막 동작을 되돌려 다른 꽃잎도 위에 남겨주세요.');let face=['R','F','L','B'][piece-4],algs=[],temp=c.clone();for(let k=0;temp.ep[piece-4]!==piece&&k<4;k++){algs.push('U');temp.move('U');}algs.push(face+'2');add(s,algs,'윗면을 돌려 꽃잎의 옆 색을 같은 중심에 맞춘 뒤, 그 옆면을 반 바퀴 돌려 흰 엣지를 아래로 내려요.','흰 엣지와 옆면 중심 정렬');}finish(s);
s=stage('corners','흰 코너를 넣어 1층 완성하기','코너는 세 색이 한 몸이에요. 들어갈 자리 위로 가져온 다음, 오른쪽 올리기 → 윗면 이동 → 오른쪽 내리기 → 윗면 되돌리기를 반복해요. 동작 묶음이 끝나면 흰 십자는 복구돼요.');
if(startStage<=2)while(cc(c)<4){let before=cc(c),fixed=[4,5,6,7].filter(i=>c.cp[i]===i&&c.co[i]===0);add(s,find(c,x=>cc(x)>before&&fixed.every(i=>x.cp[i]===i&&x.co[i]===0),[...setup,...sexy,...sexy.map(inverse)],'corner',7),'윗면으로 코너 위치를 맞추고, 넣기 동작으로 흰 코너를 제자리에 보내요. 묶음 동작 후 아래 흰 십자가 다시 유지되는지 확인하세요.',`${before+1}번째 흰 코너`);}finish(s);
s=stage('middle','노란색 없는 엣지로 2층 완성하기','윗층에서 노란색이 없는 엣지를 찾아요. 앞 색을 중심과 맞춘 후, 반대쪽으로 피하고 코너를 꺼냈다 함께 넣어 1층을 복구해요.');
if(startStage<=3)while(mc(c)<4){let before=mc(c),fixed=[8,9,10,11].filter(i=>c.ep[i]===i&&c.eo[i]===0);add(s,find(c,x=>mc(x)>before&&fixed.every(i=>x.ep[i]===i&&x.eo[i]===0),[...setup,...insert,...insert.map(inverse)],'middle',6),'노란색 없는 엣지를 준비한 뒤 오른쪽 또는 왼쪽 넣기를 실행해요. 이미 맞춘 1층은 동작 묶음 끝에 제자리로 돌아와요.',`${before+1}번째 2층 엣지`);}finish(s);
s=stage('yellowCross','노란 점 → ㄱ → 일자 → 십자','이 단계는 노란 엣지의 방향만 맞춰요. 옆면 색이 아직 다르더라도 괜찮아요. 앞면을 열고, 오른쪽과 윗면을 움직인 뒤 앞면을 닫으면 아래 두 층이 복구돼요.');if(startStage<=4)add(s,find(c,x=>x.eo.slice(0,4).every(v=>v===0),[...setup,...crossAlg],'orient',6),'노란 엣지의 방향을 바꾸는 동작이에요. 점, ㄱ, 일자 중 현재 모양을 관찰하고 묶음이 끝난 뒤 십자가 됐는지 확인하세요.','노란 엣지 4개의 방향');finish(s);
s=stage('yellowFace','노란 코너 방향을 맞춰 윗면 완성하기','위치를 맞추기 전에 방향을 먼저 맞춰요. 오른쪽 올리기와 윗면 회전으로 코너 방향을 바꾸되, 아래 두 층과 노란 십자는 묶음 끝에 복구돼요.');if(startStage<=5)add(s,find(c,x=>x.co.slice(0,4).every(v=>v===0),[...setup,...sune,...sune.map(inverse)],'orient',6),'코너의 노란색이 위를 향하도록 방향을 바꿔요. 노란 면이 완성돼도 옆 색의 자리는 다음 단계에서 맞춥니다.','노란 코너의 방향');finish(s);
s=stage('cornerPlace','세 색을 보고 마지막 코너 자리 맞추기','방향이 맞는 조각도 자리는 다를 수 있어요. 코너의 세 색을 중심색과 비교하고, 윗면 조각의 자리를 교환해요.');if(startStage<=6)add(s,find(c,x=>x.cp.every((v,i)=>v===i),[...setup,...tperm],'full',6),'노란 면의 방향을 유지하면서 코너 자리를 교환해요. 동작 중 흐트러져 보여도 묶음 끝까지 따라가면 아래 두 층과 노란 면이 복구돼요.','코너 세 색과 중심색 일치');finish(s);
s=stage('edgePlace','마지막 엣지를 순환시켜 완성하기','남은 윗층 엣지 세 개의 자리를 돌려 바꿔요. 코너와 아래 두 층은 그대로 보존돼요. 조각의 방향과 위치를 구분하면 모든 면의 완성을 이해할 수 있어요.');if(startStage<=7)add(s,find(c,x=>x.isSolved(),[...uperm,...uperm.map(inverse)],'full',5),'맞는 면을 기준으로 윗층 엣지의 자리만 순환시켜요. 묶음 끝에 여섯 면을 확인하세요.','6면 완성');finish(s);
if(!c.isSolved())throw Error('경로 검증에 실패했어요. 다시 분석해주세요.');return stages;
}
root.Beginner={plan,petals,ec,cc,mc};if(typeof module!=='undefined')module.exports=root.Beginner;
})(typeof self!=='undefined'?self:globalThis);

