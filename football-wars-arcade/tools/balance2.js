const A=require('./load.js');const B=A.Battle;
const s=A.Save.fresh('TUR_GALATASARAY',12345);
function run(levels, div, n, starsN, rar){
  for(const k of A.Upgrades.KEYS) s.upgrades[k]=levels;
  s.stars={};s.active=[];
  if(starsN){const pool=A.Stars.defs.filter(d=>d.rarity===(rar||'epic')&&d.role!=='captain');const pick=[];for(const d of pool){if(pick.length<starsN&&!pick.some(p=>p.role===d.role))pick.push(d);}for(const d of pick){const r=A.Draft.ovrRange(div,d.rarity);s.stars[d.id]={id:d.id,ovr:Math.round((r[0]+r[1])/2),contract:99,rarity:d.rarity};s.active.push(d.id);}}
  const ids=s.divisions[div-1].filter(x=>x!==s.club);
  let wins=0, surv=0, rs=0, dur=0;
  for(let i=0;i<n;i++){
    const opp=ids[i%ids.length];
    const sn=B.snapshot(s,'challenge',{div,kind:'last'});
    const r=A.League.rating(s,opp,div,'x'); rs+=r;
    sn.teamB=Object.assign({},sn.teamB); 
    const ct=A.club(opp).src.battle_profile; sn.teamB=JSON.parse(JSON.stringify(sn.teamB)); sn.teamB.id=opp; sn.teamB.battle_profile=Object.assign({},ct,{power_index:r});sn.teamB.visual=A.club(opp).src.visual;
    sn.seed=1000+i*7919;
    const w=B.simulate(B.worldOpts(sn,{headless:true,auto:true})); const res=B.result(w); dur+=res.battleSeconds; if(res.won){wins++;surv+=res.survivors;}
  }
  return {lv:levels,div,stars:starsN||0,power:A.Upgrades.power(s), oppAvg:(rs/n).toFixed(1), wr:(wins/n).toFixed(2), avgSurv:(wins?surv/wins:0).toFixed(1), dur:(dur/n).toFixed(1)};
}
const a=process.argv.slice(2);
console.log(JSON.stringify(run(+a[0],+a[1],+(a[2]||20),+(a[3]||0),a[4])));
