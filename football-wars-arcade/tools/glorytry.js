global.window=globalThis;require('../src/v4_data.js');const E=require('../src/engine.js');
const c=FW_MASTER_DB.clubs, L=E.PW.LIST, cnt={}, n0={}; let t0=Date.now(), games=0, dur=0;
for (let g=0; g<L.length/2; g++) for (let rep=0; rep<3; rep++) {
  const pick=(k)=>[0,1,2,3].map(i=>({id:L[(k*4+i+rep*5)%24],rank:1,fav:i<2}));
  const stars=[{id:'s',name:'S',role:'striker',ovr:60,rarity:'epic',ability:'counter_burst',tier:3}];
  const o={seed:500+g*7+rep,teamA:c[3],teamB:c[4],cfg:FW_ENGINE_CONFIG,ruleset:'fusion',duration:'standard',goalAdv:false,headless:true,
    arcade:{advCap:0.35,advScale:18,stars:[stars,stars],mech:'glory',cmdModes:['off','off'],powers:[pick(g),pick(g+3)]}};
  const w=E.createWorld(o); while(w.phase!=='ended'&&w.t<90) E.step(w); games++; dur+=w.endT-2.2;
  for (const u of w.pow.used) { cnt[u.id]=(cnt[u.id]||0)+1; n0[u.id]=(n0[u.id]||0)+u.n; }
}
console.log('games',games,'avg dur',(dur/games).toFixed(1),'ms/game',((Date.now()-t0)/games)|0);
for (const id of L) console.log(id.padEnd(18), (cnt[id]||0), 'avg affected', cnt[id]?(n0[id]/cnt[id]).toFixed(1):'-');
