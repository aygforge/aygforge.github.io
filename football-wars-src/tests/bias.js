const E = require('../src/engine.js');
const db = require('../data/football_wars_master_2026_27.json');
const cfg = require('../data/battle_engine_config.json');
const all = [...db.clubs, ...db.national_teams];
const byId = id => all.find(t => t.id === id);
const N=+(process.argv[2]||20);
function tally(a,b){ let wa=0, d=[]; for(let i=0;i<N;i++){ const w=E.simulate({seed:5000+i*104729, teamA:byId(a), teamB:byId(b), cfg, duration:process.argv[3]||'standard'}); if(w.winner===0)wa++; d.push(w.endT-2.2);} d.sort((x,y)=>x-y); return `${a} vs ${b}: A ${wa}/${N} med ${d[N>>1].toFixed(1)} min ${d[0].toFixed(1)} max ${d[N-1].toFixed(1)}`; }
for (const id of (process.argv[4]||'TUR_GALATASARAY,NAT_GERMANY,ESP_REAL_MADRID,GRE_OLYMPIACOS').split(',')) console.log(tally(id,id));
console.log(tally('NAT_GERMANY','NAT_TURKIYE')); console.log(tally('NAT_TURKIYE','NAT_GERMANY'));
