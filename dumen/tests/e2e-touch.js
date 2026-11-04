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
 // Kasaba illüstrasyonu: her binaya dokunmak doğru yere götürür
 await ev(()=>{DUMEN.UI.closeAll(); DUMEN.SM.go('town');}); await p.waitForTimeout(700);
 const targets=[['Liman Sokağı','street'],['Evim','home'],['Market','market'],['Hurdacı Hasan','hasan'],['Belediye','belediye'],['Komplo Teorisyeni\'nin Evi','komplo'],['Balık Pazarı','rustem'],['Tekne — Balığa Çık','map']];
 for (const [label, scene] of targets) {
   const bx = await p.locator('.hot[aria-label="'+label+'"]').first().boundingBox();
   // görünür alanın, diğer alanlarla çakışmayan alt-orta noktası (etiket bölgesi)
   await p.touchscreen.tap(bx.x + Math.min(bx.width/2, Math.max(8, bx.width/2)), bx.y + bx.height - 10); await p.waitForTimeout(450);
   const got = await ev(()=>DUMEN.SM.name);
   console.log('kasaba →', label, got===scene ? 'OK' : 'HATA ('+got+')'); if(got!==scene) fail++;
   await ev(()=>{DUMEN.UI.closeAll(); DUMEN.SM.go('town');}); await p.waitForTimeout(500);
 }
 // Liman sokağı: her giriş doğru yere götürür
 for (const [label, scene] of [['Geri Dönüşüm Fabrikası','factory'],['Zıpırleone\'nin Mekanı','zip'],['Tekne Atölyesi','boatyard'],['Kasabaya dön','town']]) {
   await ev(()=>{DUMEN.UI.closeAll(); DUMEN.SM.go('street');}); await p.waitForTimeout(500);
   const bx = await p.locator('.hot[aria-label="'+label+'"]').first().boundingBox();
   await p.touchscreen.tap(bx.x + bx.width/2, bx.y + bx.height - 10); await p.waitForTimeout(450);
   const got = await ev(()=>DUMEN.SM.name);
   console.log('liman sokağı →', label, got===scene ? 'OK' : 'HATA ('+got+')'); if(got!==scene) fail++;
 }
 // Café kapalı bilgi penceresi açar; sokakta Balığa Çık yok
 await ev(()=>{DUMEN.UI.closeAll(); DUMEN.SM.go('street');}); await p.waitForTimeout(500);
 { const cb = await p.locator('.hot[aria-label="Café"]').boundingBox(); await p.touchscreen.tap(cb.x+cb.width/2, cb.y+cb.height-10); await p.waitForTimeout(400);
   const okc = await ev(()=>DUMEN.UI.modalOpen() && /Café/.test(document.querySelector('.modal h2').textContent) && DUMEN.SM.name==='street');
   const noFish = await ev(()=>!document.querySelector('.scene-root button.green.big') && ![...document.querySelectorAll('.hot')].some(b=>/Balığa/.test(b.getAttribute('aria-label'))));
   console.log('liman sokağı → Café kapalı', okc?'OK':'HATA', '· sokakta balığa çıkış yok', noFish?'OK':'HATA'); if(!okc||!noFish) fail++; await ev(()=>DUMEN.UI.closeAll()); }
 // İç mekân görselleri: evdeki ilan panosu; Belediye'de panel yok, Başkan'a dokununca konuşur
 for (const [scene, label, check] of [['home','İlan Panosu','board'],['belediye','Belediye Başkanı','baskan']]) {
   await ev((sc)=>{DUMEN.UI.closeAll(); DUMEN.SM.go(sc);}, scene); await p.waitForTimeout(600);
   const hb = await p.locator('.hot[aria-label="'+label+'"]').boundingBox(); await p.touchscreen.tap(hb.x+hb.width/2, hb.y+hb.height/2); await p.waitForTimeout(500);
   const t = await ev(()=>document.querySelector('.modal h2') ? document.querySelector('.modal h2').textContent : (document.querySelector('.dlg .name') ? document.querySelector('.dlg .name').textContent : ''));
   const okh = check==='board' ? /İlan Panosu/.test(t) : /Belediye Başkanı/.test(t) && await ev(()=>!document.querySelector('.shop-layout'));
   console.log('iç mekân →', label, okh?'OK':'HATA ('+t+')'); if(!okh) fail++;
   await p.screenshot({path:out+'touch_'+scene+'.png'}); await ev(()=>DUMEN.UI.closeAll());
 }
 // Harita: kilitli bölgeye dokunmak seçer ama girmez; açık bölgeden yola çıkılır
 await ev(()=>{DUMEN.UI.closeAll(); DUMEN.SM.go('map');}); await p.waitForTimeout(500);
 for (const [label, code] of [['Bermuda Girdabı','BG'],['Kaynar Kazan Deltası','KKD'],['Batık Korsan Mezarlığı','BKM'],['Yakamoz Koyu','YK'],['Tembel Sazlıklar','TS'],['Paslı Sanayi Kanalı','PSK'],['Titrek Buzullar','TB'],['Eski Liman','EL']]) {
   // oyuncu gibi: bölgenin görünen etiketine dokun
   let lb = await p.locator('.map-lbl', { hasText: label }).first().boundingBox();
   const card = await p.locator('.map-card').first().boundingBox().catch(()=>null);
   if (card && lb.x+lb.width/2 > card.x && lb.x+lb.width/2 < card.x+card.width && lb.y+lb.height/2 > card.y && lb.y+lb.height/2 < card.y+card.height) {
     const xb = await p.locator('.map-card button[aria-label="Kartı gizle"]').boundingBox(); await p.touchscreen.tap(xb.x+xb.width/2, xb.y+xb.height/2); await p.waitForTimeout(300);
     lb = await p.locator('.map-lbl', { hasText: label }).first().boundingBox();
   }
   await p.touchscreen.tap(lb.x + lb.width/2, lb.y + lb.height/2); await p.waitForTimeout(350);
   const r = await ev(()=>({sel:DUMEN.SM.cur.sel, dis:document.querySelector('.map-card .btn.green').disabled}));
   const okSel = r.sel===code && r.dis === (code!=='EL');
   console.log('harita →', label, okSel?'OK':'HATA '+JSON.stringify(r)); if(!okSel) fail++;
 }
 await p.screenshot({path:out+'touch_map.png'});
 await ev(()=>{DUMEN.UI.closeAll(); DUMEN.SM.go('town');}); await p.waitForTimeout(500);
 const rb = await p.locator('.hot[aria-label="Restoran"]').boundingBox();
 await p.touchscreen.tap(rb.x+rb.width/2, rb.y+rb.height-10); await p.waitForTimeout(400);
 const restOk = await ev(()=>DUMEN.UI.modalOpen() && /Restoran/.test(document.querySelector('.modal h2').textContent) && DUMEN.SM.name==='town');
 console.log('kasaba → Restoran (kapalı bilgi penceresi)', restOk?'OK':'HATA'); if(!restOk) fail++;
 await ev(()=>DUMEN.UI.closeAll()); await p.waitForTimeout(300);
 await p.screenshot({path:out+'touch_town.png'});
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
