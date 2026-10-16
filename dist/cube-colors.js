/* Standard color scheme: yellow up, white down, green front, orange right. */
const CubePalette={
 FACES:['U','R','F','D','L','B'],
 COLORS:{U:'#efc650',R:'#ee9951',F:'#699580',D:'#f8f5e7',L:'#d9634e',B:'#628cab'},
 NAMES:{U:'노랑',R:'주황',F:'초록',D:'흰색',L:'빨강',B:'파랑'},
 FACE_NAMES:{U:'윗면',R:'오른쪽 면',F:'앞면',D:'아랫면',L:'왼쪽 면',B:'뒷면'}
};
if(typeof module!=='undefined')module.exports=CubePalette;
