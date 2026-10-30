// Checks that every stored/generated text exists in English without Turkish leftovers.
const { load } = require('./load');
const AD = load();
const TR = /[çğıöşüÇĞİÖŞÜ]|\b(ve|bir|için|hafta|sezon|kulüp|gladyatör|maç|oldu|kazandı)\b/i;
(async () => {
  AD.WorldGenerator.generate(31337);
  const pc = AD.WorldGenerator.createNewLudus('valeria', 'Ludus Probus', { sh: 0, sy: 0, c1: '#900', c2: '#fd0' });
  AD.WorldGenerator.setPlayer(pc.id, true); pc.autoManage = true;
  for (let s = 0; s < 2; s++) for (let w = 0; w <= 30; w++) await AD.Game.processWeek();
  const S = AD.S; const bad = new Set();
  const turkishOk = t => /[çğıöşüÇĞİÖŞÜ]/.test(t) ? t.replace(/\b[A-ZÇĞİÖŞÜ][\wçğıöşüÇĞİÖŞÜ'-]*/g, '') : t; // ignore capitalised proper nouns (club/city/person names)
  const check = (v, where) => { if (v && typeof v === 'object') { if (!v.en) bad.add(where + ': missing en'); else if (TR.test(turkishOk(v.en))) bad.add(where + ': ' + v.en); } else if (typeof v === 'string') bad.add(where + ' plain: ' + v); };
  for (const n of S.news) check(n.t, 'news');
  for (const id in S.glads) for (const a of S.glads[id].aw) check(a.t, 'award');
  for (const c of S.clubs) for (const t of c.trophies) check(t.t, 'trophy');
  for (const h of S.hist.seasons) { check(h.player.cup, 'hist.cup'); }
  // English UI strings from logic
  AD.I18N.lang = 'en'; AD.GameState.applyLang();
  const en = [];
  for (let t = 1; t <= 6; t++) en.push(AD.TIERS[t].n, AD.TIERS[t].s);
  for (const c of AD.CLASS_IDS) { const C = AD.CLASSES[c]; en.push(C.role, C.gear, C.sp.name, C.sp.desc); }
  for (const r of AD.REGIONS) en.push(r.desc);
  for (const k in AD.ITEM_TYPES) en.push(AD.ITEM_TYPES[k].n, AD.ITEM_TYPES[k].desc);
  for (const q of AD.QUALITIES) en.push(q.n);
  en.push(AD.Calendar.windowLabel(), AD.Cups.nameOf('imp'), AD.Cups.nameOf('r_valeria'));
  for (const c of S.clubs) en.push(c.n);
  for (const e of en) if (TR.test(turkishOk(e))) bad.add('ui: ' + e);
  console.log('club name sample:', S.clubs.slice(0, 6).map(c => c.n).join(' | '));
  console.log('news sample (en):', S.news.slice(0, 4).map(n => AD.txt(n.t)).join(' || '));
  console.log(bad.size ? 'PROBLEMS:\n' + [...bad].slice(0, 30).join('\n') : 'I18N OK');
})();
