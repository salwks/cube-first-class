importScripts('vendor/cube.js','planner.js');
onmessage=e=>{try{postMessage({type:'result',stages:Beginner.plan(typeof e.data==='string'?e.data:e.data.facelets,s=>postMessage({type:'progress',title:s}),typeof e.data==='string'?0:e.data.startStage||0)});}catch(err){postMessage({type:'error',message:err.message});}};
