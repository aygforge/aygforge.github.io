// Veri odaklı karşılaşma sahneleri. Her sahne aynı ilkel aksiyonlardan (spawn, move, fire, impact, coins,
// cargoOverboard, boardSteal, pickup, say, react, camera, weather ...) oluşan adım listeleri üretir.
// sceneFor(event) → { side, mainId, setup, approach, intro, action, outcome, exit }
import { GOOD_BY_ID } from '../data/goods.js';
import { ITEM_BY_ID } from '../data/items.js';
import { CREW_BY_ID } from '../data/crew.js';
import { PET_BY_ID } from '../data/pets.js';

const S = (type, o = {}) => ({ type, ...o });
const par = (...a) => a; // eşzamanlı adım

// ───────── Ortak yardımcılar ─────────
function shipEntity(c, id, style, level = 2, extra = {}) {
  return S('spawn', { e: { id, kind: 'ship', style, level, x: c.side * 190, y: -330, rot: Math.PI, sails: 'full', encounter: true, drift: false, crewNpc: style === 'pirate' ? ['pirateCaptain', 'pirate', 'pirate', 'pirate'] : style === 'warship' ? ['sailor', 'sailor', 'sailor'] : style === 'ghost' ? ['ghost', 'ghost'] : ['sailor', 'sailor'], ...extra } });
}
import { topShip } from '../rendering/td/TopShip.js';
const alongside = (c, scale = 1, level = 2, gap = 16) => c.side * (c.beam / 2 + (topShip(level).beam / 2) * scale + gap);

function genericOutcome(c, info, sc) {
  const steps = [];
  const enc = sc.mainId && c.world.get(sc.mainId) ? sc.mainId : null;
  const encPos = enc || { x: c.side * 120, y: -40 };
  if (info.hullDelta < 0) steps.push(par(S('impact', { target: 'ship', amount: Math.min(10, 3 - info.hullDelta / 8) }), S('displayHull'), S('float', { at: 'ship', text: `${info.hullDelta} Gövde`, color: '#ff6b5e' })));
  if (info.lost.length) {
    if (sc.thieves && enc) steps.push(S('boardSteal', { id: enc, goods: info.lost }));
    else steps.push(S('cargoOverboard', { goods: info.lost, side: c.side }));
    steps.push(S('float', { at: 'ship', text: `${info.lost.length} sandık kaybedildi`, color: '#ffb07a' }));
  }
  if (info.goldDelta < 0) {
    steps.push(enc ? S('chest', { from: 'ship', to: enc }) : S('coins', { from: 'ship', to: { x: c.side * 140, y: 30 }, n: 8 }));
    steps.push(par(S('displayGold'), S('float', { at: 'ship', text: `${info.goldDelta} altın`, color: '#f2c14e' })));
  }
  if (info.goldDelta > 0) steps.push(par(S('coins', { from: encPos, to: 'ship', n: Math.min(24, 6 + Math.round(info.goldDelta / 15)) }), S('float', { at: 'ship', text: `+${info.goldDelta} altın`, color: '#f2c14e' })), S('displayGold'));
  if (info.gained.length) steps.push(S('call', { fn: (d) => info.gained.forEach((g, i) => setTimeout(() => { const w = d.world; const from = typeof encPos === 'string' ? (w.get(encPos) || { x: 100, y: -20 }) : encPos; w.projectile({ x: from.x, y: from.y }, { x: w.ship.x, y: w.ship.y }, { dur: 0.9, arc: 18, kind: 'crate' }); w.fx[w.fx.length - 1].good = g; }, i * 250)), dur: 1.2 + info.gained.length * 0.25 }), S('float', { at: 'ship', text: `+${info.gained.length} mal`, color: '#9ae0a0' }));
  for (const it of info.itemsGained) steps.push(par(S('icon', { icon: ITEM_BY_ID[it]?.icon || 'gift', from: encPos, to: 'ship' }), S('float', { at: 'ship', text: ITEM_BY_ID[it]?.name || 'İtem', color: '#c8a0ff' })));
  if (info.hullDelta > 0) steps.push(S('crewWork', { prefer: ['CREW_GROOT'], at: c.side < 0 ? 'railL' : 'railR', task: 'Gövdeyi onarıyor', dur: 3 }), par(S('particles', { kind: 'spark', at: 'ship', n: 18 }), S('sound', { name: 'repair' }), S('displayHull'), S('float', { at: 'ship', text: `+${info.hullDelta} Gövde`, color: '#6fd36a' })), S('wait', { dur: 0.8 }));
  for (const id of info.crewJoined) steps.push(S('float', { at: 'ship', text: `${CREW_BY_ID[id].name} katıldı!`, color: '#8ad0ff' }), S('wait', { dur: 0.6 }));
  for (const id of info.petsJoined) steps.push(S('float', { at: 'ship', text: `${PET_BY_ID[id].name} gemide!`, color: '#ffd76a' }), S('wait', { dur: 0.6 }));
  for (const id of info.crewLeft) steps.push(S('float', { at: 'ship', text: `${CREW_BY_ID[id].name} ayrıldı`, color: '#ffb07a' }));
  const xp = info.lines.find((l) => l.kind === 'xp');
  if (xp) steps.push(S('float', { at: { x: 0, y: -40 }, text: xp.text.replace(/^.*?(\+?-?\d+ XP).*$/, '$1'), color: '#f2e080' }));
  if (!steps.length) steps.push(S('wait', { dur: 0.6 }));
  steps.push(S('wait', { dur: 0.6 }));
  return steps;
}

function optKind(c, info) {
  const ev = c.ev;
  const opt = ev.options.find((o, i) => `o${i}` === info.key) || {};
  const tags = opt.tags || [];
  const label = (info.label || '').toLowerCase();
  if (info.key === '__tarcin') return 'tarcin';
  if (tags.includes('combat') || /savaş|top|saldır/.test(label)) return 'combat';
  if (tags.includes('escape') || /kaç|hızlan|uzaklaş/.test(label)) return 'escape';
  if (tags.includes('surrender') || /teslim/.test(label)) return 'surrender';
  if (/kara bayrak/.test(label)) return 'flag';
  if (opt.cost?.gold || tags.includes('negotiate') || /rüşvet|öde/.test(label)) return 'pay';
  if (tags.includes('pass') || /geç|bırak|reddet|uzak dur/.test(label)) return 'pass';
  if (/dal|mira/.test(label)) return 'dive';
  if (/aç|topla|al|çek|uzan/.test(label)) return 'take';
  return 'other';
}

// ───────── Genel sahne fabrikası ─────────
function generic(ev, side) {
  const art = ev.art || {};
  const objs = art.obj || [];
  const has = (k) => objs.includes(k);
  const sc = { side, mainId: null, thieves: false };
  const shipStyle = has('pirateShip') || has('pirateFleet') ? 'pirate' : has('ghostShip') ? 'ghost' : has('warship') ? 'warship' : has('plagueShip') ? 'plague' : has('merchantShip') ? 'merchant' : has('halfSunk') ? 'merchant' : null;
  const floating = ['chest', 'barrels', 'bottle', 'timber', 'mapScroll', 'raft', 'boat', 'crate', 'catBoat', 'passenger'].find(has);
  const obstacle = ['rocks', 'mine', 'iceberg'].find(has);
  const island = ['island', 'ruins', 'lighthouse', 'shipyard', 'shrine', 'villagers', 'volcano', 'dock'].find(has);
  const creature = has('seaSerpent') ? 'serpent' : has('tentacles') ? 'tentacles' : null;
  const wave = has('wave') || has('tsunami');
  const onDeck = has('deckView') || has('fire');
  const near = ['fishSchool', 'flyingFish', 'turtle', 'lightOrb', 'whirlpool', 'bell', 'sunkenCity'].find(has);
  const danger = ev.cat === 'danger' || ev.cat === 'disaster';
  const weather = () => {
    const out = [];
    if (art.sky === 'storm') out.push(S('weather', { preset: 'storm', fx: ['rain', 'lightning'], dark: 0.15 }));
    else if (art.sky === 'fog' || (art.fx || []).includes('fog')) out.push(S('weather', { fog: 1 }));
    else if (art.sky === 'night' || art.sky === 'aurora') out.push(S('weather', { night: true }));
    else if (art.sky === 'ash') out.push(S('weather', { preset: 'ash', fx: ['ash', 'embers'] }));
    else if (art.sky === 'eerie') out.push(S('weather', { preset: 'eerie' }));
    if ((art.fx || []).includes('snow') || art.sea === 'ice') out.push(S('weather', { preset: 'ice', fx: ['snow'] }));
    if ((art.fx || []).includes('rain') && art.sky !== 'storm') out.push(S('weather', { fx: ['rain'] }));
    return out;
  };

  sc.setup = (c, instant) => {
    const out = [...weather()];
    if (shipStyle) {
      sc.mainId = 'enc';
      sc.thieves = shipStyle === 'pirate';
      out.push(shipEntity(c, 'enc', shipStyle, has('pirateFleet') ? 3 : 2, { damage: has('halfSunk') ? 'sinking' : 'healthy', alpha: shipStyle === 'ghost' ? 0.65 : 1, sails: has('halfSunk') ? 'furled' : 'full', scale: has('halfSunk') ? 0.9 : 1 }));
      if (has('pirateFleet')) {
        out.push(shipEntity(c, 'enc2', 'pirate', 2, { x: -c.side * 170, y: -360 }));
        out.push(shipEntity(c, 'enc3', 'pirate', 2, { x: c.side * 40, y: -420 }));
      }
    } else if (creature) {
      sc.mainId = 'enc';
      out.push(S('spawn', { e: { id: 'shadow', kind: 'shadow', x: c.side * 60, y: -200, drift: false, encounter: true, opts: { s: 1.2, a: 0.4 } } }));
      out.push(S('spawn', { e: { id: 'enc', kind: creature, x: creature === 'tentacles' ? 0 : c.side * 90, y: creature === 'tentacles' ? 0 : -20, alpha: instant ? 1 : 0, drift: false, encounter: true, layer: creature === 'tentacles' ? 1 : 0 } }));
    } else if (floating) {
      sc.mainId = 'enc';
      const kind = { barrels: 'barrel', crate: 'crate' }[floating] || floating;
      out.push(S('spawn', { e: { id: 'enc', kind, x: c.side * (c.beam / 2 + 34), y: -260, drift: false, encounter: true, opts: kind === 'boat' ? { npc: has('oldSailor') ? 'sailor' : 'sailor' } : {} } }));
    } else if (obstacle) {
      sc.mainId = 'enc';
      out.push(S('spawn', { e: { id: 'enc', kind: obstacle, x: 0, y: -300, drift: false, encounter: true } }));
    } else if (island) {
      sc.mainId = 'enc';
      out.push(S('spawn', { e: { id: 'enc', kind: 'island', x: c.side * (c.beam / 2 + 90), y: -320, drift: false, encounter: true, opts: { r: 46, ruins: has('ruins'), huts: has('dock') || has('villagers'), villagers: has('villagers'), lighthouse: has('lighthouse'), shipyard: has('shipyard'), shrine: has('shrine'), ground: has('volcano') ? '#3a3032' : undefined, palms: has('volcano') ? 0 : 4 } } }));
      if (has('volcano')) out.push(S('spawn', { e: { id: 'volc', kind: 'fire', x: c.side * (c.beam / 2 + 90), y: -320, drift: false, encounter: true, opts: { n: 20, w: 26, h: 20 } } }));
    } else if (wave) {
      sc.mainId = 'enc';
      out.push(S('spawn', { e: { id: 'enc', kind: 'wave', x: 0, y: -260, drift: false, encounter: true, layer: 1 } }));
    } else if (near) {
      sc.mainId = 'enc';
      out.push(S('spawn', { e: { id: 'enc', kind: near === 'sunkenCity' ? 'shadow' : near, x: c.side * (c.beam / 2 + 40), y: -200, drift: false, encounter: true, opts: near === 'sunkenCity' ? { s: 1.6, a: 0.3 } : { n: 40 } } }));
    }
    if (onDeck && has('fire')) out.push(S('deckFire', { on: true }));
    if (has('monkey') || has('parrot')) { /* güvertedeki hayvan sahnesi */ }
    return out;
  };

  sc.approach = (c) => {
    const out = [];
    if (!sc.mainId) return [par(S('speed', { v: 8 }), S('sails', { state: 'furled' }), S('react', { kind: danger ? 'danger' : 'fortune', side })), S('wait', { dur: 1.5 })];
    const e = c.world.get('enc');
    if (shipStyle) {
      out.push(par(S('move', { id: 'enc', to: { x: c.side * 170, y: -150 }, dur: 2.4 }), S('camera', { focus: { x: c.side * 80, y: -80 }, k: 0.3 })));
      out.push(par(S('react', { kind: danger ? 'danger' : 'fortune', side }), S('speed', { v: 6 }), S('sails', { state: 'furled' })));
      out.push(par(S('move', { id: 'enc', to: { x: alongside(c, 1, has('pirateFleet') ? 3 : 2), y: -10, rot: 0, sails: 'furled' }, dur: 2.8 }), has('pirateFleet') ? S('move', { id: 'enc2', to: { x: -alongside(c), y: 20, rot: 0 }, dur: 2.8, wait: false }) : null, has('pirateFleet') ? S('move', { id: 'enc3', to: { x: 0, y: -c.len / 2 - 70, rot: Math.PI }, dur: 2.8, wait: false }) : null).filter(Boolean));
    } else if (creature) {
      out.push(par(S('move', { id: 'shadow', to: { x: c.side * 60, y: -30 }, dur: 3 }), S('speed', { v: 4 }), S('sails', { state: 'furled' }), S('weather', { dark: 0.12 })));
      out.push(par(S('react', { kind: 'danger', side }), S('move', { id: 'enc', to: { alpha: 1 }, dur: 1 }), S('particles', { kind: 'splash', at: { x: c.side * 90, y: -20 }, n: 30 }), S('shake', { amount: 6 }), S('sound', { name: 'splash' })));
      out.push(S('remove', { id: 'shadow' }));
    } else if (floating || near) {
      out.push(par(S('move', { id: 'enc', to: { y: -40 }, dur: 3.5 }), S('speed', { v: 8 }), S('camera', { focus: { x: c.side * 60, y: -40 }, k: 0.25 })));
      out.push(par(S('sails', { state: 'furled' }), S('speed', { v: 2 }), S('react', { kind: danger ? 'danger' : 'fortune', side })));
    } else if (obstacle) {
      out.push(par(S('move', { id: 'enc', to: { y: -c.len / 2 - 60 }, dur: 3.5 }), S('speed', { v: 6 }), S('sails', { state: 'furled' })));
      out.push(S('react', { kind: 'danger', side }));
    } else if (island) {
      out.push(par(S('move', { id: 'enc', to: { y: -30 }, dur: 4 }), S('speed', { v: 6 }), S('camera', { focus: { x: c.side * 90, y: -20 }, k: 0.3 })));
      if (c.world.get('volc')) out.push(S('move', { id: 'volc', to: { y: -30 }, dur: 0.1 }));
      out.push(par(S('sails', { state: 'furled' }), S('speed', { v: 0 }), S('react', { kind: danger ? 'danger' : 'fortune', side })));
    } else if (wave) {
      out.push(par(S('weather', { dark: 0.18, fx: ['rain'] }), S('move', { id: 'enc', to: { y: -c.len / 2 - 40 }, dur: 4, ease: 'in' }), S('react', { kind: 'danger', side }), S('speed', { v: 4 })));
    }
    void e;
    return out;
  };

  sc.intro = (c) => {
    const out = [];
    if (shipStyle === 'pirate') out.push(S('say', { id: 'enc', text: 'Ambarını boşalt, yoksa batarsın!', dur: 3, hold: 1.4 }));
    else if (shipStyle === 'merchant') out.push(S('say', { id: 'enc', text: 'Selam tüccar!', dur: 2.5, hold: 0.8 }));
    else if (shipStyle === 'warship') out.push(S('say', { id: 'enc', text: 'Kraliyet adına, dur!', dur: 2.5, hold: 0.8 }));
    else if (shipStyle === 'ghost') out.push(S('say', { id: 'enc', text: '…', dur: 2, hold: 0.8 }));
    else out.push(S('wait', { dur: 0.6 }));
    return out;
  };

  sc.action = (c, info) => {
    const k = optKind(c, info);
    const out = [];
    const enc = sc.mainId && c.world.get('enc') ? 'enc' : null;
    if (info.auto) return [S('wait', { dur: 0.6 })];
    if (k === 'combat' && enc) {
      out.push(S('camera', { focus: enc, k: 0.3, zoom: 1.06 }));
      out.push(S('fire', { from: 'ship', to: enc, n: 3, hit: info.success ? true : 'some', burn: info.success }));
      if (!info.success && (shipStyle || creature)) out.push(shipStyle ? S('fire', { from: enc, to: 'ship', n: 2, hit: true }) : S('shake', { amount: 9 }));
    } else if (k === 'escape') {
      out.push(par(S('sails', { state: 'full' }), S('speed', { v: 70 }), S('sound', { name: 'depart' })));
      if (enc && shipStyle) out.push(S('move', { id: enc, to: info.success ? { y: 260 } : { y: -10, x: alongside(c, 1, c.world.get(enc)?.level || 2) }, dur: 3 }));
      else if (enc) out.push(S('move', { id: enc, to: { y: info.success ? 300 : 40 }, dur: 2.5 }));
      else out.push(S('wait', { dur: 2 }));
      out.push(S('speed', { v: info.success ? 30 : 4 }));
    } else if (k === 'surrender' && enc) {
      const lvl = c.world.get(enc)?.level || 2;
      const sc0 = c.world.get(enc)?.scale || 1;
      out.push(par(S('flag', { up: true, color: '#f4f4f0' }), S('move', { id: enc, to: { x: alongside(c, sc0, lvl, 2) }, dur: 1.5 }), S('say', { id: enc, text: 'Akıllıca bir seçim…', dur: 2.5, hold: 0.2 })));
    } else if (k === 'flag') {
      out.push(par(S('flag', { up: true }), S('sound', { name: 'flag' })), S('wait', { dur: 0.8 }));
      if (enc) out.push(S('say', { id: enc, text: info.success ? 'Kardeşlik! Geç bakalım.' : 'Bu paçavra da ne?', dur: 2.6, hold: 1.2 }));
    } else if (k === 'pay') {
      if (enc) out.push(S('say', { id: enc, text: info.success ? 'Anlaştık.' : 'Az!', dur: 2.2, hold: 0.8 }));
    } else if (k === 'tarcin') {
      out.push(par(S('say', { actor: 'PET_TARCIN', text: 'Hav! Hav! Hav!', dur: 2.5 }), S('sound', { name: 'bark' })), S('wait', { dur: 1 }));
    } else if (k === 'take' && enc && (floating || near)) {
      out.push(S('pickup', { id: enc, prefer: ['CREW_GROOT', 'CREW_NAKAMURA', 'CREW_MIRA'], task: 'Halatla çekiyor', remove: !!floating }));
    } else if (k === 'dive') {
      out.push(S('crewWork', { prefer: ['CREW_MIRA'], at: c.side < 0 ? 'railL' : 'railR', task: 'Suya dalıyor', dur: 3, hold: 1 }), par(S('particles', { kind: 'splash', at: { x: c.side * (c.beam / 2 + 8), y: 0 }, n: 20 }), S('sound', { name: 'splash' })), S('wait', { dur: 1.5 }));
    } else if (k === 'pass') {
      out.push(par(S('sails', { state: 'full' }), S('speed', { v: 26 })), S('wait', { dur: 1.5 }));
    } else if (wave && enc) {
      out.push(S('move', { id: enc, to: { y: c.len / 2 + 180 }, dur: 2.6, ease: 'linear' }));
      out.push(par(S('shake', { amount: info.success ? 4 : 10 }), S('particles', { kind: 'splash', at: 'ship', n: 40 }), S('sound', { name: 'splash' })));
    } else if (obstacle) {
      out.push(par(S('move', { id: 'enc', to: { y: c.len / 2 + 140 }, dur: 3.2 }), S('speed', { v: 10 })));
    } else {
      out.push(S('crewWork', { prefer: [], at: 'center', task: 'Emri uyguluyor', dur: 2 }), S('wait', { dur: 1 }));
    }
    if (onDeck && has('fire')) out.push(S('crewWork', { prefer: ['CREW_GROOT', 'CREW_LENA'], at: 'center', task: 'Yangınla mücadele ediyor', dur: 3, hold: 2 }));
    return out;
  };

  sc.outcome = (c, info) => {
    const out = [];
    const enc = sc.mainId && c.world.get('enc') ? 'enc' : null;
    if (enc && optKind(c, info) === 'combat' && info.success && shipStyle) out.push(par(S('say', { id: enc, text: 'Geri çekilin!', dur: 2, hold: 0.2 })));
    if (onDeck && has('fire')) out.push(info.success ? par(S('deckFire', { on: false }), S('particles', { kind: 'smoke', at: 'ship', n: 20 })) : S('particles', { kind: 'fire', at: 'ship', n: 30 }));
    out.push(...genericOutcome(c, info, sc));
    if (onDeck && has('fire')) out.push(S('deckFire', { on: false }));
    return out;
  };

  sc.exit = (c, info) => {
    const out = [];
    const w = c.world;
    if (w.get('enc')) {
      if (shipStyle) out.push(par(S('move', { id: 'enc', to: { y: -360, x: c.side * 220, rot: Math.PI * 0.85, sails: 'full' }, dur: 3 }), w.get('enc2') ? S('move', { id: 'enc2', to: { y: -380, x: -c.side * 240 }, dur: 3, wait: false }) : null, w.get('enc3') ? S('move', { id: 'enc3', to: { y: -420 }, dur: 3, wait: false }) : null).filter(Boolean));
      else if (creature) out.push(par(S('move', { id: 'enc', to: { alpha: 0 }, dur: 1.5 }), S('particles', { kind: 'splash', at: 'enc', n: 24 })));
      else if (wave || obstacle || island || floating || near) out.push(par(S('sails', { state: 'full' }), S('speed', { v: 30 }), S('call', { fn: (d) => { const e = d.world.get('enc'); if (e) e.drift = true; const v = d.world.get('volc'); if (v) v.drift = true; } })));
    }
    out.push(S('wait', { dur: 1.2 }));
    out.push(S('call', { fn: (d) => { d.world.remove('enc2'); d.world.remove('enc3'); d.world.remove('deckfire'); } }));
    void info;
    return out;
  };
  return sc;
}

// ───────── Özel sahneler (önemli eventler) ─────────
export const SCENES = {
  // KORSAN BASKINI — tam görsel senaryo
  EVT_D_01: (ev, side) => {
    const sc = generic(ev, side);
    sc.mainId = 'enc';
    sc.thieves = true;
    sc.setup = (c) => { sc.mainId = 'enc'; sc.thieves = true; return [shipEntity(c, 'enc', 'pirate', 3, { scale: 0.9 })]; };
    sc.approach = (c) => [
      par(S('speed', { v: 26 }), S('camera', { focus: { x: c.side * 140, y: -240 }, k: 0.25 })),
      S('move', { id: 'enc', to: { x: c.side * 160, y: -200 }, dur: 2.2 }),
      par(S('react', { kind: 'danger', side }), S('say', { actor: 'CAPTAIN', text: 'Kara bayrak! Herkes yerine!', dur: 2.6, hold: 0.4 })),
      par(S('speed', { v: 6 }), S('sails', { state: 'furled' }), S('move', { id: 'enc', to: { x: alongside(c, 0.9, 3), y: -6, rot: 0, sails: 'furled' }, dur: 3.2 }), S('camera', { focus: { x: c.side * 70, y: 0 }, k: 0.35 })),
    ];
    sc.intro = () => [S('say', { id: 'enc', text: 'Ambarını boşalt, yoksa seni balıklara yem ederim!', dur: 3.5, hold: 1.6 }), S('call', { fn: (d) => { const e = d.world.get('enc'); if (e) e.agitated = true; } })];
    return sc;
  },
  EVT_D_15: (ev, side) => SCENES.EVT_D_01(ev, side),
  // DEV DALGA
  EVT_D_02: (ev, side) => {
    const sc = generic(ev, side);
    sc.setup = () => [S('weather', { preset: 'storm', dark: 0.08 }), S('spawn', { e: { id: 'enc', kind: 'wave', x: 0, y: -300, drift: false, encounter: true, layer: 1 } })];
    sc.approach = (c) => [
      par(S('weather', { fx: ['rain'], dark: 0.2 }), S('move', { id: 'enc', to: { y: -c.len / 2 - 90 }, dur: 3.5 }), S('camera', { focus: { x: 0, y: -100 }, k: 0.3 })),
      par(S('react', { kind: 'danger', side }), S('speed', { v: 4 }), S('say', { actor: 'CAPTAIN', text: 'Dalga geliyor! Tutunun!', dur: 2.4, hold: 0.6 })),
    ];
    sc.action = (c, info) => {
      const k = /demir/i.test(info.label) ? 'anchor' : /hafiflet/i.test(info.label) ? 'lighten' : 'brave';
      const out = [];
      if (k === 'anchor') out.push(par(S('sails', { state: 'furled' }), S('speed', { v: 0 }), S('sound', { name: 'anchor' }), S('say', { actor: 'CAPTAIN', text: 'Demiri at!', dur: 1.8 })), S('wait', { dur: 0.8 }));
      if (k === 'lighten') out.push(S('cargoOverboard', { goods: info.lost, side }), S('wait', { dur: 0.4 }));
      if (k === 'brave') out.push(par(S('sails', { state: 'full' }), S('speed', { v: 20 })));
      out.push(par(S('move', { id: 'enc', to: { y: c.len / 2 + 200 }, dur: 2.4, ease: 'linear' }), S('call', { fn: (d) => { d.world.extraRot = 0.06; setTimeout(() => (d.world.extraRot = -0.04), 700); setTimeout(() => (d.world.extraRot = 0), 1500); }, dur: 0 })));
      out.push(par(S('shake', { amount: info.success || k !== 'brave' ? 5 : 11 }), S('particles', { kind: 'splash', at: 'ship', n: 50 }), S('sound', { name: 'splash' })));
      return out;
    };
    sc.outcome = (c, info) => genericOutcome(c, { ...info, lost: /hafiflet/i.test(info.label) ? [] : info.lost }, { ...sc, mainId: null });
    sc.exit = () => [par(S('weather', { restore: true }), S('remove', { id: 'enc' })), S('wait', { dur: 1 })];
    return sc;
  },
  // YÜZEN SANDIK
  EVT_F_01: (ev, side) => {
    const sc = generic(ev, side);
    sc.setup = (c) => [S('spawn', { e: { id: 'enc', kind: 'chest', x: side * (c.beam / 2 + 30), y: -280, drift: false, encounter: true } })];
    sc.approach = (c) => [
      par(S('move', { id: 'enc', to: { y: -50 }, dur: 4 }), S('camera', { focus: { x: side * 60, y: -60 }, k: 0.25 })),
      par(S('speed', { v: 2 }), S('sails', { state: 'furled' }), S('react', { kind: 'fortune', side }), S('say', { actor: 'CAPTAIN', text: 'Sancak tarafında sandık var!', dur: 2.2 })),
    ];
    sc.action = (c, info) => {
      if (/bırak/i.test(info.label)) return [par(S('sails', { state: 'full' }), S('speed', { v: 26 })), S('wait', { dur: 1.2 })];
      return [S('pickup', { id: 'enc', prefer: ['CREW_GROOT', 'CREW_NAKAMURA'], task: 'Sandığı halatla çekiyor' }), par(S('crewWork', { prefer: ['CREW_HAMID', 'CREW_DONNA'], at: 'cargo', task: 'Sandığı açıyor', dur: 2 }), S('particles', { kind: 'gold', at: 'ship', n: 20 }), S('sound', { name: 'chest' })), S('wait', { dur: 0.8 })];
    };
    sc.outcome = (c, info) => genericOutcome(c, info, { ...sc, mainId: null });
    return sc;
  },
  // YÜZEN KERESTE
  EVT_REPAIR_01: (ev, side) => {
    const sc = generic(ev, side);
    sc.setup = (c) => [S('spawn', { e: { id: 'enc', kind: 'timber', x: side * (c.beam / 2 + 34), y: -280, drift: false, encounter: true, opts: { n: 6 } } })];
    sc.approach = SCENES.EVT_F_01(ev, side).approach;
    sc.action = (c, info) => (/geç/i.test(info.label)
      ? [par(S('sails', { state: 'full' }), S('speed', { v: 26 })), S('wait', { dur: 1.2 })]
      : [S('pickup', { id: 'enc', prefer: ['CREW_GROOT'], task: 'Keresteleri topluyor' }), S('crewWork', { prefer: ['CREW_GROOT'], at: side < 0 ? 'railL' : 'railR', task: 'Gövdeyi yamıyor', dur: 3, hold: 1.5 })]);
    sc.outcome = (c, info) => genericOutcome(c, info, { ...sc, mainId: null });
    return sc;
  },
  // HAYALET GEMİ
  EVT_M_01: (ev, side) => {
    const sc = generic(ev, side);
    sc.setup = (c) => [S('weather', { night: true, fog: 1 }), shipEntity(c, 'enc', 'ghost', 3, { alpha: 0, damage: 'critical', x: side * 150, y: -160, rot: Math.PI * 0.1 })];
    sc.approach = (c) => [
      par(S('speed', { v: 10 }), S('camera', { focus: { x: side * 100, y: -100 }, k: 0.3 })),
      par(S('move', { id: 'enc', to: { alpha: 0.6, y: -60, x: side * (c.beam / 2 + 56) }, dur: 4.5 }), S('react', { kind: 'danger', side }), S('sound', { name: 'ghost' })),
      par(S('speed', { v: 2 }), S('sails', { state: 'furled' }), S('say', { actor: 'CAPTAIN', text: 'Güvertesinde… kimse yok.', dur: 2.6 })),
    ];
    sc.action = (c, info) => {
      if (/uzaklaş/i.test(info.label)) return [par(S('move', { id: 'enc', to: { alpha: 0 }, dur: 2.5 }), S('sails', { state: 'full' }), S('speed', { v: 24 }))];
      const out = [S('move', { id: 'enc', to: { x: side * (c.beam / 2 + 38) }, dur: 1.5 })];
      if (/magda/i.test(info.label)) out.push(par(S('crewWork', { prefer: ['CREW_MAGDA'], at: side < 0 ? 'railL' : 'railR', task: 'Hayaletlere fısıldıyor', dur: 3 }), S('particles', { kind: 'spark', at: 'enc', n: 30 })));
      else out.push(S('crewWork', { prefer: [], at: side < 0 ? 'railL' : 'railR', task: 'Hayalet gemiye uzanıyor', dur: 2.5, hold: 1.5 }));
      return out;
    };
    sc.outcome = (c, info) => [...(info.success ? [S('particles', { kind: 'spark', at: 'enc', n: 30 })] : [par(S('particles', { kind: 'splash', at: 'ship', n: 30 }), S('weather', { dark: 0.2 }))]), ...genericOutcome(c, info, sc), S('move', { id: 'enc', to: { alpha: 0 }, dur: 2 })];
    sc.exit = () => [S('weather', { restore: true }), S('remove', { id: 'enc' }), S('wait', { dur: 1 })];
    return sc;
  },
  // GİZLİ KOY
  EVT_F_11: (ev, side) => {
    const sc = generic(ev, side);
    sc.setup = (c) => [S('spawn', { e: { id: 'enc', kind: 'island', x: side * (c.beam / 2 + 80), y: -320, drift: false, encounter: true, opts: { r: 60, palms: 7 } } })];
    sc.approach = (c) => [
      par(S('move', { id: 'enc', to: { y: -20 }, dur: 4.2 }), S('speed', { v: 10 }), S('camera', { focus: { x: side * 80, y: 0 }, k: 0.35 })),
      par(S('call', { fn: (d) => { d.world.shipTargetX = side * 22; } }), S('sails', { state: 'furled' }), S('speed', { v: 0 }), S('sound', { name: 'anchor' }), S('say', { actor: 'CAPTAIN', text: 'Demir atın, burada dinleneceğiz.', dur: 2.6, hold: 1 })),
    ];
    sc.action = (c, info) => (/keşfet/i.test(info.label)
      ? [S('crewWork', { prefer: [], at: side < 0 ? 'railL' : 'railR', task: 'Koyu keşfe çıkıyor', dur: 3, hold: 2.5 })]
      : [S('crewWork', { prefer: ['CREW_GROOT'], at: side < 0 ? 'railL' : 'railR', task: 'Gövdeyi yamıyor', dur: 3, hold: 1.5 })]);
    sc.exit = () => [par(S('call', { fn: (d) => { d.world.shipTargetX = 0; const e = d.world.get('enc'); if (e) e.drift = true; } }), S('sails', { state: 'full' }), S('speed', { v: 30 })), S('wait', { dur: 1 })];
    return sc;
  },
  // YANGIN
  EVT_D_07: (ev, side) => {
    const sc = generic(ev, side);
    sc.setup = () => [S('deckFire', { on: true, dx: 6, dy: 14 })];
    sc.approach = () => [par(S('speed', { v: 10 }), S('react', { kind: 'danger', side }), S('say', { actor: 'CAPTAIN', text: 'Yangın var! Kovaları getirin!', dur: 2.6 })), S('wait', { dur: 1.4 })];
    sc.action = (c, info) => {
      const who = /groot/i.test(info.label) ? ['CREW_GROOT'] : ['CREW_GROOT', 'CREW_LENA', 'CREW_PITA'];
      const L = c.L;
      return [S('crewWork', { prefer: who, at: { x: L.cx + 10, y: L.center.y + 14 }, task: 'Yangını söndürüyor', dur: 3, hold: 1.5 }), par(S('particles', { kind: 'splash', at: 'ship', n: 20, dy: 14 }), S('sound', { name: 'splash' })), S('wait', { dur: 0.8 })];
    };
    sc.outcome = (c, info) => [info.success ? par(S('deckFire', { on: false }), S('particles', { kind: 'smoke', at: 'ship', n: 24, dy: 14 })) : par(S('particles', { kind: 'fire', at: 'ship', n: 30, dy: 10 }), S('shake', { amount: 6 })), ...genericOutcome(c, info, { ...sc, mainId: null }), S('deckFire', { on: false })];
    sc.exit = () => [S('deckFire', { on: false }), S('wait', { dur: 0.6 })];
    return sc;
  },
  // DENİZ CANAVARI
  EVT_D_13: (ev, side) => {
    const sc = generic(ev, side);
    const base = sc.action;
    sc.action = (c, info) => {
      if (/kalani/i.test(info.label)) return [S('crewWork', { prefer: ['CREW_KALANI'], at: 'bow', task: 'Canavara eski bir şarkı söylüyor', dur: 3, hold: 2 }), S('particles', { kind: 'spark', at: 'enc', n: 30 })];
      if (/muska/i.test(info.label)) return [S('particles', { kind: 'spark', at: 'ship', n: 40 }), S('wait', { dur: 1 })];
      return base(c, info);
    };
    return sc;
  },
  // ZIPIR & TARÇIN: rıhtımda (limana varışta)
  EVT_SPECIAL_ZIPIR_TARCIN: (ev, side) => {
    const sc = generic(ev, 1);
    sc.mainId = 'enc';
    sc.setup = (c) => [S('weather', { fog: 0.6 }), S('spawn', { e: { id: 'enc', kind: 'dockPets', x: c.beam / 2 + 22, y: 4, drift: false, encounter: true, layer: 1, opts: {} } })];
    sc.approach = () => [S('wait', { dur: 0.5 })];
    sc.intro = () => [S('say', { actor: 'CAPTAIN', text: 'Rıhtımda… bir köpekle bir kedi?', dur: 2.8, hold: 1.2 })];
    sc.action = (c, info) => {
      if (/geç/i.test(info.label)) return [S('wait', { dur: 1.6 })];
      return [S('call', { fn: (d) => { const L = d.world.layout(); const st = L.stations.find((s) => s.type === 'railR'); d.world.deck.spawnAt = st; d.hooks.sfx?.(/tarçın/i.test(info.label) ? 'bark' : 'meow'); } }), S('wait', { dur: 0.3 })];
    };
    sc.outcome = (c, info) => {
      const taken = info.petsJoined;
      return [S('call', { fn: (d) => { const e = d.world.get('enc'); if (e) e.kind = taken.includes('PET_TARCIN') ? 'dockCat' : taken.includes('PET_ZIPIR') ? 'dockDog' : 'dockPets'; } }), ...genericOutcome(c, info, { ...sc, mainId: null }), S('wait', { dur: 1.2 })];
    };
    sc.exit = () => [S('weather', { restore: true })];
    return sc;
  },
  EVT_SPECIAL_ZIPIR_ALONE: (ev, side) => {
    const sc = generic(ev, side);
    sc.setup = (c) => [S('weather', { night: true }), S('spawn', { e: { id: 'enc', kind: 'catBoat', x: side * (c.beam / 2 + 30), y: -260, drift: false, encounter: true } })];
    sc.approach = (c) => [
      par(S('move', { id: 'enc', to: { y: -30 }, dur: 4.5 }), S('speed', { v: 6 }), S('camera', { focus: { x: side * 60, y: -40 }, k: 0.3 })),
      par(S('say', { actor: 'PET_TARCIN', text: 'Hav! Hav!', dur: 2.5 }), S('sound', { name: 'bark' }), S('sails', { state: 'furled' }), S('speed', { v: 0 })),
    ];
    sc.action = (c, info) => (/geç/i.test(info.label)
      ? [par(S('move', { id: 'enc', to: { y: 260, alpha: 0.4 }, dur: 4 }), S('say', { actor: 'PET_TARCIN', text: '…', dur: 2 }))]
      : [S('call', { fn: (d) => { const L = d.world.layout(); d.world.deck.spawnAt = L.stations.find((s) => s.type === (side < 0 ? 'railL' : 'railR')); } }), S('pickup', { id: 'enc', prefer: ['CAPTAIN'], task: 'Sandala uzanıyor' }), S('sound', { name: 'meow' })]);
    sc.outcome = (c, info) => genericOutcome(c, info, { ...sc, mainId: null });
    sc.exit = () => [S('weather', { restore: true }), S('remove', { id: 'enc' })];
    return sc;
  },
  EVT_SPECIAL_TARCIN_ALONE: (ev, side) => {
    const sc = generic(ev, side);
    sc.setup = (c) => [S('weather', { fog: 1 }), S('spawn', { e: { id: 'enc', kind: 'dogRock', x: side * (c.beam / 2 + 40), y: -280, drift: false, encounter: true } })];
    sc.approach = (c) => [
      par(S('move', { id: 'enc', to: { y: -20 }, dur: 4.5 }), S('speed', { v: 6 }), S('camera', { focus: { x: side * 70, y: -20 }, k: 0.3 })),
      par(S('sails', { state: 'furled' }), S('speed', { v: 0 })),
    ];
    sc.action = (c, info) => (/geç/i.test(info.label)
      ? [par(S('call', { fn: (d) => { const e = d.world.get('enc'); if (e) e.drift = true; } }), S('sails', { state: 'full' }), S('speed', { v: 12 })), S('wait', { dur: 2.5 })]
      : [S('call', { fn: (d) => { const L = d.world.layout(); d.world.deck.spawnAt = L.stations.find((s) => s.type === (side < 0 ? 'railL' : 'railR')); d.world.get('enc').kind = 'rocksOnly'; d.world.burst(d.world.get('enc').x, d.world.get('enc').y, 'splash', 24); d.hooks.sfx?.('bark'); }, dur: 1.2 })]);
    sc.outcome = (c, info) => genericOutcome(c, info, { ...sc, mainId: null });
    sc.exit = () => [S('weather', { restore: true }), S('call', { fn: (d) => { const e = d.world.get('enc'); if (e) e.drift = true; } })];
    return sc;
  },
};
// Korsan zincirleri ve filolar korsan sahnesini kullanır
for (const id of ['CH_PIRATE_OFFER_1', 'CH_PIRATE_OFFER_2A', 'CH_PIRATE_OFFER_2B', 'EVT_CH_PURSUIT']) SCENES[id] = (ev, side) => { const sc = SCENES.EVT_D_01(ev, side); sc.intro = () => [S('say', { id: 'enc', text: id.endsWith('_1') ? 'Seninle bir iş konuşmak istiyorum, tüccar.' : id.endsWith('2A') ? 'Bu sandığı taşı, zengin ol.' : 'Kaçabileceğini mi sandın?', dur: 3, hold: 1.4 })]; return sc; };

/** Liman varış eventleri (rıhtım sahnesi, gemi demirli) için yaklaşmasız kurulum */
export function sceneFor(ev, side) {
  if (SCENES[ev.id]) return { side, ...SCENES[ev.id](ev, side), side };
  const sc = generic(ev, side);
  return sc;
}

// rıhtım hayvan varyantları
import { DRAW } from '../rendering/td/Props.js';
import { petSprite } from '../rendering/td/TopChars.js';
DRAW.dockCat = (c, x, y, t) => c.drawImage(petSprite('PET_ZIPIR', 'down', 'sit'), Math.round(x - 2), Math.round(y - 11));
DRAW.dockDog = (c, x, y, t) => c.drawImage(petSprite('PET_TARCIN', 'down', Math.sin(t * 5) > 0 ? 'wag1' : 'wag0'), Math.round(x - 20), Math.round(y - 11));
DRAW.rocksOnly = (c, x, y) => { c.fillStyle = '#5a5a62'; c.beginPath(); c.arc(x, y, 12, 0, 7); c.fill(); };
void GOOD_BY_ID;
