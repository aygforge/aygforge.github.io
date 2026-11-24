global.window=globalThis;require('../src/v4_data.js');const E=require('../src/engine.js');
const cfg=FW_ENGINE_CONFIG,c=FW_MASTER_DB.clubs;let t0=Date.now();
for(let i=0;i<8;i++){
 const o={seed:900+i,teamA:c[3],teamB:c[4],cfg,ruleset:'fusion',duration:'standard',goalAdv:false,headless:true,arcade:{advCap:0.35,advScale:18,stars:[[],[]],mech:'mayhem',cmdModes:['ai','ai']}};
 const w=E.createWorld(o);let zoneMax=0;while(w.phase!=='ended'&&w.t<90){E.step(w);}
 const s=E.summaryV4(w),m=E.maySummary(w);
 console.log(s.winner,s.battleSeconds,'goals',s.football.goals.join('-'),'tb',s.tiebreak,'zone',w.zone.active,w.storm,'rules',s.rules.join(','),
  '| cmds',m.sides.map(x=>x.kick+'/'+x.rush+'/'+x.iron+' rej'+x.rejected+' pk'+x.pkGoals+'g/'+x.pkShots+' sv'+x.pkSaved+' rh'+x.rushHits+' is'+x.ironStops+' ch'+x.chains+' rp'+x.rampages+' re'+x.entered+'/'+x.earned).join(' || '),'alerts',m.alerts);
}
console.log('ms',(Date.now()-t0)/8);
