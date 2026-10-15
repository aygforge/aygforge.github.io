// usage: node render.js startFrame endFrame out.mp4
const E=require('./engine'); const {renderFrame,DUR}=require('./scenes'); const {spawn}=require('child_process');
const [a,b,out]=[+process.argv[2],+process.argv[3],process.argv[4]];
const c=E.createCanvas(E.W,E.H), x=c.getContext('2d');
const ff=spawn('ffmpeg',['-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',`${E.W}x${E.H}`,'-r','30','-i','-','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',out],{stdio:['pipe','inherit','inherit']});
(async()=>{ for(let f=a; f<b; f++){ renderFrame(x,f/30); const buf=c.data(); if(!ff.stdin.write(Buffer.from(buf))) await new Promise(r=>ff.stdin.once('drain',r)); if(f%60===0) console.error(out,f); } ff.stdin.end(); })();
ff.on('close',code=>console.error('done',out,code));
