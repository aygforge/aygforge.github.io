global.window=globalThis;
require('../src/v4_data.js');const E=require(process.argv[2]||'../src/v4_engine.js');
const db=FW_MASTER_DB, cfg=FW_ENGINE_CONFIG;const c=db.clubs;
let t0=Date.now(),res=[];
for(let i=0;i<6;i++){const w=E.simulate({seed:1000+i,teamA:c[i],teamB:c[i+20],cfg,ruleset:'fusion',duration:'standard'},80);res.push(E.summaryV4(w));}
console.log('ms/battle',(Date.now()-t0)/6);console.log(res.map(s=>s.hash+' '+s.winner+' '+s.battleSeconds+' '+s.football.goals.join('-')).join('\n'));
