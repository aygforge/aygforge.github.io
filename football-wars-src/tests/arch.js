const E = require('../src/engine.js');
const db = require('../data/football_wars_master_2026_27.json');
const cfg = require('../data/battle_engine_config.json');
const all = [...db.clubs, ...db.national_teams];
const N=+(process.argv[2]||16);
// representative team per archetype (closest to power 82), normalized to identical attributes & power so only tactics differ
const archs=['high_press','possession','counter','defensive_block','wing_attack','physical'];
const rep={}; for(const a of archs){ rep[a]=all.filter(t=>t.battle_profile.archetype===a).sort((x,y)=>Math.abs(x.battle_profile.power_index-82)-Math.abs(y.battle_profile.power_index-82))[0]; }
const base=rep.high_press.battle_profile.attributes;
function norm(t){ const c=JSON.parse(JSON.stringify(t)); c.battle_profile.attributes={...base}; c.battle_profile.power_index=82; return c; }
const res={};
for(const a of archs){ let row=[]; for(const b of archs){ if(a===b){row.push('  -  ');continue;} let wa=0,d=0; for(let i=0;i<N;i++){ const A=norm(rep[a]),B=norm(rep[b]); const s=i%2; const w=E.simulate({seed:777+i*31337, teamA:s?B:A, teamB:s?A:B, cfg}); const aw = s? w.winner===1 : w.winner===0; if(aw)wa++; d+=w.endT-2.2;} row.push(String(wa).padStart(2)+'/'+N+' '); } console.log(a.padEnd(16), row.join(' '), rep[a].id, JSON.stringify(rep[a].battle_profile.roles_per_100)); }
console.log(['NAT_TURKIYE','NAT_GERMANY','GRE_OLYMPIACOS','ESP_REAL_SOCIEDAD','TUR_GALATASARAY','TUR_FENERBAHCE'].map(id=>{const t=all.find(x=>x.id===id);return id+':'+t.battle_profile.archetype+':'+t.battle_profile.power_index}).join('  '));
