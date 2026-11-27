// V1.0 içerik adaptörü: data/v1/v1_compact_content.json (L31–L120, chapter 4–12) -> motorun stage biçimi.
// L1–L30 bu dosyada ÜRETİLMEZ (stages.js'teki 0.4C/0.5A verisi aynen kalır).
// - w: [a,b,c] = chapter e[] sırasıyla düşman ADETLERİ (şerit değil).
// - Normal HP = round(e.hp * h) BİR KEZ; final/boss HP, kalkan ve kabuk ölçeklenmez.
// - trait -> gerçek mekanik bayrakları (EnemyDirector / CombatResolver uygular).
import data from './v1_compact_content.json' with { type: 'json' };
import { ENEMIES } from '../content.js';

export const V1 = data;
export const RUN_COST = data.energy; // 5

export const INGREDIENT_LABELS = {
  spiral: 'Spiral', garlic: 'Sarımsak', broccoli: 'Brokoli', dough: 'Hamur', olive: 'Zeytin', cheese: 'Peynir',
  noodle: 'Noodle', chili: 'Acı Biber', soy: 'Soya', carrot: 'Havuç', eggplant: 'Patlıcan', leek: 'Pırasa',
  pastry: 'Yufka', spinach: 'Ispanak', sesame: 'Susam', wrap: 'Lavaş', pickle: 'Turşu', sauce: 'Sos',
  rice: 'Pirinç', turmeric: 'Zerdeçal', spice: 'Baharat',
};
const ENEMY_NAMES = {
  spiral: 'Spiral Makarna', garlic: 'Sarımsak', broccoli: 'Brokoli Kalkan', dough: 'Hamur Topu', olive: 'Kaçak Zeytin',
  cheese: 'Peynir Dilimi', noodle: 'Koşucu Noodle', chili: 'Acı Biber', soy: 'Soya Şişesi', carrot: 'Havuç',
  eggplant: 'Zırhlı Patlıcan', leek: 'Pırasa', glazed_tomato: 'Sırlı Domates', pastry: 'Kat Yufka', spinach: 'Ispanak',
  sesame: 'Susam', wrap: 'Lavaş', pickle: 'Turşu', sauce: 'Sos Şişesi', rice: 'Pirinç', turmeric: 'Zerdeçal',
  spice: 'Baharat Kavanozu', royal_tomato: 'Kraliyet Domatesi', royal_mushroom: 'Kraliyet Mantarı', royal_noodle: 'Kraliyet Noodle',
};
export const CHAPTER_THEME = {
  4: 0xffe0b0, 5: 0xffd0a8, 6: 0xffb0a0, 7: 0xd8e8b0, 8: 0xe0d0ff, 9: 0xfff0c0, 10: 0xf0d8b8, 11: 0xffe08a, 12: 0xffd8f0,
};

const moveOf = (m) => {
  const s = JSON.stringify(m || [1]);
  if (s === '[1]') return 'one';
  if (s === '[1,0]') return 'odd';
  return [...m];
};

// trait -> mechanic flags (values from the V1 master prompt §2.2)
function traitFlags(e) {
  switch (e.trait) {
    case 'split_once_on_death': return { split: { count: e.limit || 2, hp: 2 } };
    case 'buff_ally_step_every3_max2':
    case 'ally_speed_buff_every3_max2': return { stepPulse: { every: 3, max: 2 } };
    case 'ally_forward_plus1_once': return { stepPulse: { every: 3, max: 1 } };
    case 'guard':
    case 'ally_shield_every3_max2': return { guardPulse: true };
    case 'shield_refresh_once': return { shieldRefresh: 2 };
    case 'layered_shell_three_hits': return { shellLayer: 2 }; // 6 shell = 3 layers, one layer per hit
    case 'heavy_armor': return { shell: e.shell ?? 4 }; // no shell number in the data: 4-point plate (documented)
    case 'ally_heal_1_every3_max2': return { healPulse: { every: 3, max: 2, amount: 1 } };
    case 'first_hit_guard_once': return { firstHitGuard: true };
    case 'target_priority_taunt': return { taunt: true };
    case 'every3rd_hit_reduced_by1_min0': return { thirdHitReduce: true };
    case 'shell_slow': return { crackSpeed: false };
    default: return {}; // sprinter / wave_runner / swarm: their move[] pattern IS the mechanic
  }
}

// Boss phases (exact mapping, §2.2 "Boss fazları için kesin eşleme"). Each threshold fires once.
const BOSS_PHASES = {
  spaghetti_king: [{ at: 0.6, kind: 'summon', type: 'spiral', count: 2 }, { at: 0.3, kind: 'shield', amount: 3 }],
  dough_golem: [{ at: 0.5, kind: 'shell', amount: 4 }, { at: 0.25, kind: 'speed' }],
  spicy_noodle_dragon: [{ at: 0.5, kind: 'summon', type: 'noodle', count: 2 }],
  stew_golem: [{ at: 0.65, kind: 'breakShieldSpeed' }, { at: 0.35, kind: 'summon', type: 'carrot', count: 1 }],
  pan_guardian: [{ at: 0.66, kind: 'shield', amount: 3 }, { at: 0.33, kind: 'summon', type: 'glazed_tomato', count: 2 }],
  layered_borek: [{ at: 0.35, kind: 'summon', type: 'sesame', count: 2 }],
  giant_wrap: [{ at: 0.5, kind: 'summon', type: 'pickle', count: 2 }, { at: 0.25, kind: 'speed' }],
  curry_sultan: [{ at: 0.6, kind: 'buffAllies', amount: 2 }, { at: 0.3, kind: 'freezeCap' }],
  feast_lord: [{ at: 0.66, kind: 'summon', type: 'royal_noodle', count: 2 }, { at: 0.33, kind: 'shield', amount: 4, speed: true }],
};

// Register chapter enemies / bosses / minis once (existing ids such as mushroom_guard / armored_potato are reused).
for (const ch of data.ch) {
  for (const e of ch.e) {
    if (e.trait === 'existing_guard' || e.trait === 'existing_armor') continue;
    ENEMIES[e.id] = {
      id: e.id, name: ENEMY_NAMES[e.id] || e.id, hp: e.hp, shield: e.shield || 0, shell: e.shell || 0,
      move: moveOf(e.move), recipe: e.ingredient, speed: 1, contactDamage: e.contact || 1, trait: e.trait, chapter: ch.i,
      ...traitFlags(e),
    };
    if (e.trait === 'split_once_on_death') {
      ENEMIES[`${e.id}_mini`] = { id: `${e.id}_mini`, name: `Küçük ${ENEMY_NAMES[e.id]}`, hp: 2, shield: 0, move: 'one', recipe: null, speed: 1, contactDamage: 1, sprite: e.id, scale: 0.7, splitChild: true };
    }
  }
  const b = ch.b;
  ENEMIES[b.id] = {
    id: b.id, name: b.name, hp: b.hp, shield: b.shield || 0, shell: b.shell || 0, move: b.id === 'spicy_noodle_dragon' ? 'telegraph3' : 'one',
    recipe: null, speed: 1, boss: true, chapterBoss: true, contactDamage: b.contact || 2, retreatX: 0.62, chapter: ch.i,
    phases: BOSS_PHASES[b.id] || [], telegraph: b.id === 'spicy_noodle_dragon', crackSpeed: b.id === 'layered_borek',
    freezeEvery: b.id === 'curry_sultan' ? 1 : undefined,
  };
  ENEMIES[ch.m.id] = {
    id: ch.m.id, name: ch.m.name, hp: ch.m.hp, shield: ch.m.shield || 0, shell: ch.m.shell || 0, move: 'one', recipe: null, speed: 1,
    boss: true, miniBoss: true, elite: true, contactDamage: 2, retreatX: 0.62, sprite: b.id, scale: 0.85, tint: 0xffc0c0, chapter: ch.i,
  };
}

const STAGE_TYPE = { B: 'chapter_boss', M: 'mini_boss', D: 'dual_elite', T: 'triple_elite', E: 'elite' };
const HARDWALL = new Set([20, 40, 60, 80, 100, 120]);

function finals(st, ch) {
  const [tip, list] = st.f;
  if (tip === 'B' || tip === 'M') {
    const id = tip === 'B' ? ch.b.id : ch.m.id;
    const [, hp, shield] = list[0];
    return { types: [id], names: [ENEMIES[id].name], bossHp: hp, bossShield: shield };
  }
  const types = list.map(([idx, hp, shield], k) => {
    const base = ENEMIES[ch.e[idx].id];
    const type = `final_L${st.l}_${k + 1}`;
    const { name, boss, recipe, ...rest } = base; // keeps move / trait flags / shell (a mushroom_guard elite still shields)
    ENEMIES[type] = {
      ...rest, id: type, name: `Elit ${base.name}`, hp, shield, boss: true, elite: true, recipe: base.recipe,
      sprite: base.sprite || base.id, retreatX: 0.62, tint: list.length > 1 ? [0xffd0a0, 0xa0d8ff, 0xc8ffb0][k] : 0xffe9a0,
    };
    return type;
  });
  return { types, names: types.map((t) => ENEMIES[t].name), bossHp: null, bossShield: null };
}

export function buildV1Stages() {
  return data.st.map((st) => {
    const ch = data.ch.find((c) => c.i === st.c);
    const ids = ch.e.map((e) => e.id);
    const hp = Object.fromEntries(ch.e.map((e) => [e.id, Math.max(1, Math.round(e.hp * st.h))]));
    for (const e of ch.e) if (ENEMIES[`${e.id}_mini`]) hp[`${e.id}_mini`] = 2;
    const fin = finals(st, ch);
    const recipe = {};
    ch.ingredients.forEach((k, i) => { if (st.r[i] > 0) recipe[k] = st.r[i]; });
    const near = st.s === 'near';
    const tags = [...new Set([...ids, ...ch.ingredients])];
    const isEnd = st.l % 10 === 0;
    return {
      id: `L${st.l}`, isStage: true, level: st.l, index: ch.i, chapterId: ch.id, chapterName: ch.n, withinChapter: ((st.l - 1) % 10) + 1,
      stageType: STAGE_TYPE[st.f[0]], name: st.n, encounter: st.i,
      identity: { format: st.i, spawnStyle: st.s === 'varied' ? 'staggered' : near ? 'near' : 'normal', label: '', subtitle: `${ch.n} · ${st.n}` },
      customer: ch.n, tags, recipe, boss: fin.types[0], finals: fin.types, finalName: fin.names.join(' + '),
      baseTip: st.g, firstClearBonus: Math.round(st.g * 0.5), starMultipliers: { 1: 1, 2: 1.15, 3: 1.3 },
      firstClearEnergyRefund: 0, unlocksOnFirstClear: [], recommendedChefPower: st.p,
      powerWall: HARDWALL.has(st.l) ? 'hardwall' : isEnd ? 'softwall' : null, energyCost: RUN_COST,
      bigOilRate: +(0.08 * (st.o || 1)).toFixed(4), dish: `dish_${ch.id}`, theme: CHAPTER_THEME[ch.i],
      skillWaves: st.w.map((_, i) => i + 1),
      balance: { hp, bossHp: fin.bossHp, bossShield: fin.bossShield, spawnXMin: near ? 0.55 : 0.6, spawnXMax: near ? 0.62 : 0.67, bossX: 0.72 },
      waves: st.w.map((trip) => Object.fromEntries(trip.map((n, i) => [ids[i], n]).filter(([, n]) => n > 0))),
    };
  });
}

export const V1_CHAPTERS = [
  { i: 1, id: 'menemen', n: 'Menemen', boss: 'giant_tomato' },
  { i: 2, id: 'fries', n: 'Patates Kızartması', boss: 'potato_king' },
  { i: 3, id: 'omelet', n: 'Mantarlı Omlet', boss: 'giant_mushroom' },
  ...data.ch.map((c) => ({ i: c.i, id: c.id, n: c.n, boss: c.b.id, enemies: c.e.map((e) => (e.trait?.startsWith('existing') ? e.id : e.id)) })),
];
