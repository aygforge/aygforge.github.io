const E = require('../src/engine.js');
const db = require('../data/football_wars_master_2026_27.json');
const cfg = require('../data/battle_engine_config.json');
const all = [...db.clubs, ...db.national_teams];
const N=+(process.argv[2]||30);
// random pairs bucketed by power gap; alternate sides
const r = new E.Rng(99); const buckets={};
let durs=[], totals=[], rules={};
for(let i=0;i<N;i++){
  const a=all[r.int(all.length)], b=all[r.int(all.length)]; if(a===b){i--;continue;}
  const gap=Math.abs(a.battle_profile.power_index-b.battle_profile.power_index); const k=gap<5?'0-4':gap<12?'5-11':gap<25?'12-24':'25+';
  const w=E.simulate({seed:r.int(2**31), teamA:a, teamB:b, cfg});
  const strongIs = a.battle_profile.power_index>=b.battle_profile.power_index?0:1;
  buckets[k]=buckets[k]||{n:0,strong:0}; buckets[k].n++; if(w.winner===strongIs)buckets[k].strong++;
  durs.push(w.endT-2.2); totals.push(w.endT+w.outroLen); w.rules.forEach(x=>rules[x]=(rules[x]||0)+1);
}
durs.sort((x,y)=>x-y); totals.sort((x,y)=>x-y);
for(const k of ['0-4','5-11','12-24','25+']) if(buckets[k]) console.log('gap',k,'stronger wins',buckets[k].strong+'/'+buckets[k].n, (100*buckets[k].strong/buckets[k].n).toFixed(0)+'%');
console.log('battle s: min',durs[0].toFixed(1),'p10',durs[Math.floor(N*.1)].toFixed(1),'med',durs[N>>1].toFixed(1),'p90',durs[Math.floor(N*.9)].toFixed(1),'max',durs[N-1].toFixed(1));
console.log('video total s: min',totals[0].toFixed(1),'med',totals[N>>1].toFixed(1),'max',totals[N-1].toFixed(1), 'rules', JSON.stringify(rules));
