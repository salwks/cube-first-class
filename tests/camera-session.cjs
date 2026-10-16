const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),palette=require('../dist/cube-colors.js'),Cube=require('../dist/vendor/cube.js');
const source=fs.readFileSync('dist/app.js','utf8');
(async()=>{
 let requests=0,stops=0,plays=0;const button={disabled:false,textContent:''},video={play:async()=>plays++},track={addEventListener(){},stop(){stops++;}},camera={active:true,getTracks:()=>[track],getVideoTracks:()=>[track]};
 const ctx=vm.createContext({...palette,Cube,stream:null,route:'scan',scanError:'',scanFace:'D',selectedScanCell:null,scanned:Object.fromEntries(palette.FACES.map(f=>[f,Array(9).fill('F')])),navigator:{mediaDevices:{getUserMedia:async()=>{requests++;return camera;}}},$:s=>s==='#open-camera'?button:s==='#camera'?video:{scrollIntoView(){},focus(){}},render(){if(ctx.stream)video.srcObject=ctx.stream;},toast(){},saveScanDraft(){},analyze(){throw Error('invalid scan must not navigate');},stopMedia(){ctx.stream?.getTracks().forEach(t=>t.stop());ctx.stream=null;}});
 vm.runInContext(source.slice(source.indexOf("const open=$('#open-camera')"),source.indexOf("$('#capture').onclick")),ctx);
 await button.onclick();await button.onclick();assert.equal(requests,1);assert.equal(stops,0);assert.equal(ctx.stream,camera);assert.equal(video.srcObject,camera);assert.ok(plays>=1);
 vm.runInContext(source.slice(source.indexOf('function valid('),source.indexOf('function analyze(')),ctx);
 vm.runInContext(source.slice(source.indexOf('function startCapturedLesson('),source.indexOf('function bindScan(')),ctx);
 assert.equal(ctx.startCapturedLesson(),false);assert.equal(ctx.stream,camera);assert.equal(stops,0,'color correction must not stop the camera');
 ctx.heading=()=>'';ctx.ScanGuide={html:()=>'<div>3D cube</div>'};ctx.selectedScanCell=null;
 vm.runInContext(source.slice(source.indexOf('function scanPage('),source.indexOf('function orientation(')),ctx);
 const connected=ctx.scanPage();assert.ok(connected.includes('카메라 켜짐'));assert.ok(!connected.includes('id="open-camera"'),'an active camera must not ask to be opened again');
 console.log('Camera is requested once, reuses its live stream, and stays on after a color validation error.');
})().catch(e=>{console.error(e);process.exitCode=1;});
