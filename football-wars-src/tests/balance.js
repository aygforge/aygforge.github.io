// Node harness: determinism + duration + win-rate checks for the engine.
const E = require('../src/engine.js');
const db = require('../data/football_wars_master_2026_27.json');
const cfg = require('../data/battle_engine_config.json');
const all = [...db.clubs, ...db.national_teams];
const byId = id => all.find(t => t.id === id);
const N = +(process.argv[2] || 20), dur = process.argv[3] || 'standard';
function run(a, b, seed) { return E.summary(E.simulate({ seed, teamA: byId(a), teamB: byId(b), cfg, duration: dur })); }
const t0 = Date.now();
// determinism
const s1 = run('TUR_GALATASARAY', 'TUR_FENERBAHCE', 123456), s2 = run('TUR_GALATASARAY', 'TUR_FENERBAHCE', 123456), s3 = run('TUR_GALATASARAY', 'TUR_FENERBAHCE', 654321);
console.log('determinism same-seed equal:', JSON.stringify(s1) === JSON.stringify(s2), 'diff-seed differs:', s1.hash !== s3.hash);
console.log('sample', s1);
const pairs = [['TUR_GALATASARAY','TUR_FENERBAHCE'],['ESP_REAL_MADRID','ESP_FC_BARCELONA'],['NAT_TURKIYE','NAT_GERMANY'],['NAT_SPAIN','NAT_SAN_MARINO'],['ENG_MANCHESTER_CITY','SCO_PREM_X']];
const strongWeak = [];
// pick strong vs weak club pairs
const clubs = db.clubs.slice().sort((a,b)=>b.battle_profile.power_index-a.battle_profile.power_index);
pairs[4] = [clubs[0].id, clubs[clubs.length-1].id];
pairs.push([clubs[0].id, clubs[20].id], [clubs[10].id, clubs[60].id], [clubs[50].id, clubs[51].id]);
for (const [a,b] of pairs) {
  let wa=0, durs=[], rules={}, surv=[];
  for (let i=0;i<N;i++){ const s=run(a,b,1000+i*7919); if(s.winner===0)wa++; durs.push(s.battleSeconds); surv.push(s.survivors); s.rules.forEach(r=>rules[r]=(rules[r]||0)+1); }
  durs.sort((x,y)=>x-y);
  console.log(`${a}(${byId(a).battle_profile.power_index}) vs ${b}(${byId(b).battle_profile.power_index}): A wins ${wa}/${N}  battle s min ${durs[0]} med ${durs[N>>1]} max ${durs[N-1]}  surv avg ${(surv.reduce((x,y)=>x+y,0)/N).toFixed(1)} rules ${JSON.stringify(rules)}`);
}
console.log('elapsed ms', Date.now()-t0);
