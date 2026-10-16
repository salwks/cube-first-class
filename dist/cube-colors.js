/* Standard color scheme: yellow up, white down, green front, orange right. */
const CubePalette={
 FACES:['U','R','F','D','L','B'],
 COLORS:{U:'#FFD500',R:'#FF8000',F:'#00B83F',D:'#FFFFFF',L:'#E60012',B:'#0055FF'},
 NAMES:{U:'노랑',R:'주황',F:'초록',D:'흰색',L:'빨강',B:'파랑'},
 FACE_NAMES:{U:'윗면',R:'오른쪽 면',F:'앞면',D:'아랫면',L:'왼쪽 면',B:'뒷면'}
};
if(typeof module!=='undefined')module.exports=CubePalette;
