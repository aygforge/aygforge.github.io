// Dokunmatik regresyon testi: telefon benzeri görünüm (1000×462 CSS, 2× DPR, hasTouch).
// 1) Hareket eden siluete dokunmak doğru hedefi hemen seçer  2) Hazinede DOKUN düğmesi algılanır
// 3) Not Defteri / Defter / Envanter / Ayarlar içeriği panelden taşmaz ve son öğeye kadar kaydırılabilir.
// Kullanım: node tests/e2e-touch.js [ekran görüntüsü klasörü]
'use strict';
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.log('Playwright yok; atlandı.'); process.exit(0); }
(async()=>{
 const out=(process.argv[2]||path.join(__dirname,'screens'))+'/'; require('fs').mkdirSync(out,{recursive:true}); let fail=0;
 const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1000,height:462},deviceScaleFactor:2,hasTouch:true,isMobile:true}); const p=await ctx.newPage();
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file://'+path.join(__dirname,'..','index.html')); await p.waitForTimeout(800);
 await p.evaluate(()=>{localStorage.clear(); DUMEN.Game.newGame(777); DUMEN.SM.go('town');}); await p.waitForTimeout(600);
 const ev=(f,a)=>p.evaluate(f,a);
 // stage logical -> client
 const toClient=async(x,y)=>ev(([x,y])=>{const v=DUMEN.UI.view; return [v.offX+x*v.scale, v.offY+y*v.scale];},[x,y]);
 let silOk=0, silTries=0, treasureOk=0, treasureSeen=0;
 await ev(()=>{DUMEN.Game.act('beginTrip',{regionCode:'EL'}); DUMEN.SM.go('fishing',{region:'EL'});}); await p.waitForTimeout(600);
 for(let k=0;k<14;k++){
   await ev(()=>{ const c=DUMEN.SM.cur; c.state='READY'; DUMEN.UI.closeAll(); c.build(); c.cast(); });
   await p.waitForFunction(()=>DUMEN.SM.cur.state==='SELECT',null,{timeout:12000});
   await p.waitForTimeout(300+Math.random()*700);
   // her seferinde FARKLI bir hedefe, çizildiği andaki konumuna dokun
   const info=await ev(()=>{const c=DUMEN.SM.cur; const n=c.enc.candidates.length; const i=Math.floor(Math.random()*n); const [x,y]=c.silPos(i,c.t+0.03); return {i,x,y,type:c.enc.candidates[i].type,n};});
   const [cx,cy]=await toClient(info.x,info.y);
   silTries++;
   await p.touchscreen.tap(cx,cy); await p.waitForTimeout(120);
   const st=await ev(()=>({s:DUMEN.SM.cur.state, picked:DUMEN.SM.cur.pickIdx}));
   if(st.picked===info.i && st.s!=='SELECT') silOk++; else console.log('miss', JSON.stringify(info), JSON.stringify(st));
   if(st.s==='TREASURE'){
     treasureSeen++;
     if (treasureSeen===1) await p.screenshot({path:out+'touch_treasure.png'});
     await p.waitForTimeout(400);
     const r=await p.locator('button:has-text("DOKUN")').boundingBox();
     await p.touchscreen.tap(r.x+r.width/2, r.y+r.height/2); await p.waitForTimeout(80);
     if(await ev(()=>!!(DUMEN.SM.cur.bar && DUMEN.SM.cur.bar.done))) treasureOk++;
   }
   await p.waitForTimeout(700);
 }
 // treasure zorla: düğmeye dokunma testi
 for(let k=0;k<3;k++){
   await ev(()=>{ const c=DUMEN.SM.cur; DUMEN.UI.closeAll(); c.state='READY'; c.build(); c.cast(); });
   await p.waitForFunction(()=>DUMEN.SM.cur.state==='SELECT',null,{timeout:12000});
   await ev(()=>{const c=DUMEN.SM.cur; DUMEN.Game.state.pendingCast.candidates[0]={type:'chest',chestId:'CHEST_01',lane:.5,speed:1,phase:0}; c.enc.candidates=DUMEN.Game.state.pendingCast.candidates; c.pick(0);});
   await p.waitForTimeout(500); treasureSeen++;
   const r=await p.locator('button:has-text("DOKUN")').boundingBox();
   await p.touchscreen.tap(r.x+r.width/2, r.y+r.height/2); await p.waitForTimeout(80);
   if(await ev(()=>!!(DUMEN.SM.cur.bar && DUMEN.SM.cur.bar.done))) treasureOk++;
   await p.waitForTimeout(600);
 }
 console.log('silhouette', silOk+'/'+silTries, 'treasure', treasureOk+'/'+treasureSeen); if(silOk!==silTries||treasureOk!==treasureSeen) fail++;
 // not defteri / defter / envanter yerleşim: içerik panel içinde mi, kaydırılabilir mi
 await ev(()=>{DUMEN.UI.closeAll(); DUMEN.SM.go('town');}); await p.waitForTimeout(600);
 const check=async(open,name)=>{ await ev(open); await p.waitForTimeout(500);
   const r=await ev(()=>{const pan=document.querySelector('.modal .panel').getBoundingClientRect(); const sc=[...document.querySelectorAll('.modal .scroll')].map(e=>({h:e.clientHeight,sh:e.scrollHeight,b:e.getBoundingClientRect().bottom})); return {panB:pan.bottom, vh:innerHeight, sc};});
   const inside = r.panB<=r.vh+1 && r.sc.every(s=>s.b<=r.panB+1);
   const scrollable = r.sc.some(s=>s.sh>s.h);
   console.log(name, 'panel içinde:', inside, 'kaydırılabilir:', scrollable, JSON.stringify(r.sc));
   // en alta kaydır ve son kartın görünür olduğunu kontrol et
   const lastVisible = await ev(()=>{const sc=[...document.querySelectorAll('.modal .scroll')].sort((a,b)=>b.scrollHeight-a.scrollHeight)[0]; sc.scrollTop=sc.scrollHeight; const cards=sc.querySelectorAll('.card'); const last=cards[cards.length-1]; if(!last) return true; const lr=last.getBoundingClientRect(), sr=sc.getBoundingClientRect(); return lr.bottom<=sr.bottom+2 && lr.top>=sr.top-2;});
   console.log('  son kart kaydırınca görünür:', lastVisible); if(!inside||!lastVisible) fail++;
   await p.screenshot({path:out+'touch_'+name+'.png'}); await ev(()=>DUMEN.UI.closeAll()); await p.waitForTimeout(300); };
 await check(()=>DUMEN.Scenes.openJournal('main'),'journal_main');
 await check(()=>DUMEN.Scenes.openJournal('story'),'journal_story');
 await check(()=>DUMEN.Scenes.openJournal('board'),'journal_board');
 await check(()=>DUMEN.Scenes.openFishpedia('BG'),'fishpedia');
 await check(()=>DUMEN.Scenes.openInventory('material'),'inventory');
 await check(()=>DUMEN.Scenes.openSettings(),'settings');
 console.log('errors', errs); if(errs.length) fail++;
 await b.close();
 console.log(fail? 'BAŞARISIZ ('+fail+')' : 'TÜMÜ GEÇTİ'); process.exit(fail?1:0);
})();
