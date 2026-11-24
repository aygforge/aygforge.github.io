const A=require('./load.js');const E=FWEngine,B=A.Battle;
const s=A.Save.fresh('ENG_ARSENAL',99);
const ids=A.Stars.defs.filter(d=>d.rarity==='legendary').slice(0,5).map(d=>d.id);
for(const id of ids){s.stars[id]={id,ovr:70,contract:10,rarity:'legendary'};} s.active=ids.filter(id=>!A.Stars.canEquip(s,id)&&A.Stars.equip(s,id)||true).filter(id=>s.active.includes(id));
const snap=B.snapshot(s,'league');
const hs=[];
for(const o of [{headless:true},{headless:false,fxLevel:0},{headless:false,fxLevel:2}]){
  const w=E.createWorld(B.worldOpts(snap,Object.assign({inputs:[{tick:900,q:'tap'},{tick:1500,q:'tap'},{tick:2300,q:'auto'}]},o)));
  while(w.phase!=='ended'&&w.t<90)E.step(w); hs.push(w.hash.toString(16)+' w'+w.winner+' m'+JSON.stringify(E.arcSummary(w).momentum.filter(m=>m.side===0).map(m=>m.tick+m.q)));
}
console.log(hs.join('\n'));
// resume test: run live with taps decided at runtime, save log at tick 1200, rebuild & replay
const w1=E.createWorld(B.worldOpts(snap,{fxLevel:1}));
let pressed=0;while(w1.phase!=='ended'&&w1.t<90){ if(w1.arc.mom[0].ready && (w1.tick%7===3)) E.arcInput(w1,'tap'); E.step(w1); if(w1.tick===1200){ var saved={inputs:w1.arc.log.slice(),lastTick:w1.tick}; } }
const w2=E.createWorld(B.worldOpts(snap,{fxLevel:1,inputs:saved.inputs}));
while(w2.tick<saved.lastTick)E.step(w2);
// continue with same live policy
while(w2.phase!=='ended'&&w2.t<90){ if(w2.arc.mom[0].ready && (w2.tick%7===3)) E.arcInput(w2,'tap'); E.step(w2);}
console.log('live',w1.hash.toString(16),'resumed',w2.hash.toString(16), w1.hash===w2.hash?'MATCH':'DIFF', 'stars on field', w1.units.filter(u=>u.star).length);
