/* Six cube colors only. Samples and lighting references stay on this device. */
const CubeColorReader=(()=>{
 const faces=['U','R','F','D','L','B'];
 const defaults={U:[255,213,0],R:[255,128,0],F:[0,184,63],D:[255,255,255],L:[230,0,18],B:[0,85,255]};
 const median=a=>{a.sort((x,y)=>x-y);return a[Math.floor(a.length/2)];};
 function lab(rgb,white){
  let balanced=rgb.map((v,i)=>v*(white?Math.max(...white)/Math.max(white[i],30):1));
  const peak=Math.max(...balanced,1);balanced=balanced.map(v=>Math.min(255,v/peak*220)/255).map(v=>v>.04045?((v+.055)/1.055)**2.4:v/12.92);
  const [r,g,b]=balanced,f=v=>v>.008856?Math.cbrt(v):7.787*v+16/116;
  const x=f((.4124564*r+.3575761*g+.1804375*b)/.95047),y=f(.2126729*r+.7151522*g+.072175*b),z=f((.0193339*r+.119192*g+.9503041*b)/1.08883);
  return [116*y-16,500*(x-y),200*(y-z)];
 }
 function hsv(rgb){const [r,g,b]=rgb,max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;let h=0;if(delta){if(max===r)h=((g-b)/delta+6)%6;else if(max===g)h=(b-r)/delta+2;else h=(r-g)/delta+4;}return {h:h*60,s:max?delta/max:0,v:max};}
 function referenceIsUsable(face,rgb){const {h,s,v}=hsv(rgb);if(v<40)return false;if(face==='D')return s<.4;if(s<.12)return false;return {F:h>75&&h<185,B:h>165&&h<285,R:h>9&&h<48,L:h<26||h>325,U:h>34&&h<90}[face];}
 function classify(rgb,references={}){
  const white=references.D,point=lab(rgb,white),balanced=rgb.map((v,i)=>v*(white?Math.max(...white)/Math.max(white[i],30):1)),hue=hsv(balanced);let chosen='D',distance=Infinity;
  for(const face of faces){if(face==='D'&&hue.s>.22)continue;const ref=references[face]||defaults[face],target=lab(ref,white),targetHue=hsv(ref.map((v,i)=>v*(white?Math.max(...white)/Math.max(white[i],30):1))),hueDifference=Math.min(Math.abs(hue.h-targetHue.h),360-Math.abs(hue.h-targetHue.h)),cost=(face==='D'?0:5*hueDifference**2*Math.max(hue.s,.3))+(point[1]-target[1])**2+(point[2]-target[2])**2+.15*(point[0]-target[0])**2;if(cost<distance){distance=cost;chosen=face;}}
  return chosen;
 }
 function patch(ctx,x,y,radius){
  const data=ctx.getImageData(Math.max(0,Math.round(x-radius)),Math.max(0,Math.round(y-radius)),radius*2,radius*2).data,channels=[[],[],[]];
  for(let i=0;i<data.length;i+=4){channels[0].push(data[i]);channels[1].push(data[i+1]);channels[2].push(data[i+2]);}return channels.map(median);
 }
 function sample(canvas,size){
  const ctx=canvas.getContext('2d',{willReadFrequently:true}),x0=(canvas.width-size)/2,y0=(canvas.height-size)/2,cell=size/3,radius=Math.max(1,Math.round(size/90));
  const samples=[];
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
   const points=[[.35,.35],[.65,.35],[.5,.5],[.35,.65],[.65,.65]].map(([x,y])=>patch(ctx,x0+(col+x)*cell,y0+(row+y)*cell,radius));
   samples.push([0,1,2].map(channel=>median(points.map(p=>p[channel]))));
  }
  // Read the center sticker's corners to avoid a logo covering its middle.
  const ring=[[.2,.2],[.8,.2],[.2,.8],[.8,.8]].map(([x,y])=>patch(ctx,x0+(1+x)*cell,y0+(1+y)*cell,radius));
  return {samples,reference:[0,1,2].map(channel=>median(ring.map(p=>p[channel])))};
 }
 function assign(samples,references){return Object.fromEntries(faces.filter(face=>samples[face]).map(face=>[face,samples[face].map((rgb,i)=>i===4?face:classify(rgb,references))]));}
 return {classify,sample,assign,defaults,referenceIsUsable};
})();
if(typeof module!=='undefined')module.exports=CubeColorReader;
