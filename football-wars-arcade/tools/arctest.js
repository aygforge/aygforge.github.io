global.window=globalThis;require('../src/v4_data.js');const E=require('../src/engine.js');
const cfg=FW_ENGINE_CONFIG,c=FW_MASTER_DB.clubs;
const st=[{id:'s1',name:'Star A',role:'striker',ovr:60,rarity:'epic',ability:'counter_burst',tier:3},{id:'s2',name:'Star B',role:'defender',ovr:60,rarity:'rare',ability:'iron_wall',tier:2},{id:'s3',name:'S3',role:'support',ovr:70,ability:'last_line_save',tier:4}];
let t0=Date.now();const out=[];
for(let i=0;i<8;i++){
 const o={seed:500+i,teamA:c[3],teamB:c[4],cfg,ruleset:'fusion',duration:'standard',headless:true,arcade:{advCap:0.35,advScale:18,stars:[st,[]],momentum:['auto','normal']}};
 const w=E.simulate(o,90);const s=E.summaryV4(w);const a=E.arcSummary(w);
 out.push([s.winner,s.battleSeconds,s.football.goals.join('-'),a.momentum.map(m=>m.side+':'+m.t+':'+m.mode).join(' '),'star',a.starUses.join('/'),a.momGain.join('/')].join(' | '));
 // determinism
 const w2=E.simulate(o,90); if(w2.hash!==w.hash) console.log('NONDET');
}
console.log('ms',(Date.now()-t0)/16);console.log(out.join('\n'));
