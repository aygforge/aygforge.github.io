// SAHNE KİTİ: event imza sahnelerinin ortak dili.
// Her sahne { setup, approach, intro, action, outcome, exit } adım listeleri üretir; adımlar
// EncounterDirector.exec ilkelleridir. Kurallar EventSystem'de kalır — burada yalnızca görsel anlatı var.
import { GOOD_BY_ID } from '../data/goods.js';
import { ITEM_BY_ID } from '../data/items.js';
import { CREW_BY_ID } from '../data/crew.js';
import { PET_BY_ID } from '../data/pets.js';
import { topShip } from '../rendering/td/TopShip.js';

export const S = (type, o = {}) => ({ type, ...o });
export const par = (...a) => a.filter(Boolean); // eşzamanlı adım
export const wait = (dur) => S('wait', { dur });

// ───────── Yardımcılar ─────────
export const rail = (side) => (side < 0 ? 'railL' : 'railR');
export const oi = (info) => (info.key && /^o\d+$/.test(info.key) ? Number(info.key.slice(1)) : -1);
export const has = (c, id) => c.world.deck.actors.has(id);

export function shipEntity(c, id, style, level = 2, extra = {}) {
  return S('spawn', { e: { id, kind: 'ship', style, level, x: c.side * 190, y: -330, rot: Math.PI, sails: 'full', encounter: true, drift: false, crewNpc: style === 'pirate' ? ['pirateCaptain', 'pirate', 'pirate', 'pirate'] : style === 'warship' ? ['officer', 'soldier', 'soldier'] : style === 'ghost' ? ['ghost', 'ghost'] : style === 'plague' ? ['plague', 'plague'] : ['merchant', 'sailor'], ...extra } });
}
export const alongside = (c, scale = 1, level = 2, gap = 16) => c.side * (c.beam / 2 + (topShip(level).beam / 2) * scale + gap);
/** Bizim küpeştemizin hemen dışı (sandal/nesne için) */
export const besides = (c, gap = 22, side = c.side) => side * (c.beam / 2 + gap);

/** Ortak "sonuç" anlatısı: diff'ten hasar, kargo, altın, item, tayfa animasyonları.
 *  skip: ['lost','gold','hull','gained'] — sahne bunları kendi anlattıysa tekrarlanmaz. */
export function genericOutcome(c, info, sc, skip = []) {
  const steps = [];
  const enc = sc.mainId && c.world.get(sc.mainId) ? sc.mainId : null;
  const encPos = enc || { x: c.side * 120, y: -40 };
  const no = (k) => skip.includes(k);
  if (info.hullDelta < 0) steps.push(no('hull') ? S('displayHull') : par(S('impact', { target: 'ship', amount: Math.min(10, 3 - info.hullDelta / 8) }), S('displayHull'), S('float', { at: 'ship', text: `${info.hullDelta} Gövde`, color: '#ff6b5e' })));
  if (info.lost.length && !no('lost')) {
    const encE = enc ? c.world.get(enc) : null;
    if (sc.thieves && encE && encE.kind === 'ship') steps.push(S('boardSteal', { id: enc, goods: info.lost, npc: sc.thiefNpc, plank: sc.plank }));
    else if (sc.thieves && encE) steps.push(S('cargoOverboard', { goods: info.lost, to: enc, arc: 22, dur: 1 }));
    else steps.push(S('cargoOverboard', { goods: info.lost, side: c.side }));
    steps.push(S('float', { at: 'ship', text: `${info.lost.length} sandık kaybedildi`, color: '#ffb07a' }));
  }
  if (info.goldDelta < 0) {
    if (!no('gold')) steps.push(enc ? S('chest', { from: 'ship', to: enc }) : S('coins', { from: 'ship', to: { x: c.side * 140, y: 30 }, n: 8 }));
    steps.push(par(S('displayGold'), S('float', { at: 'ship', text: `${info.goldDelta} altın`, color: '#f2c14e' })));
  }
  if (info.goldDelta > 0) steps.push(par(no('gold') ? null : S('coins', { from: encPos, to: 'ship', n: Math.min(24, 6 + Math.round(info.goldDelta / 15)) }), S('float', { at: 'ship', text: `+${info.goldDelta} altın`, color: '#f2c14e' })), S('displayGold'));
  if (info.gained.length && !no('gained')) steps.push(S('call', { fn: (d) => info.gained.forEach((g, i) => setTimeout(() => { const w = d.world; const from = typeof encPos === 'string' ? (w.get(encPos) || { x: 100, y: -20 }) : encPos; w.projectile({ x: from.x, y: from.y }, { x: w.ship.x, y: w.ship.y }, { dur: 0.9, arc: 18, kind: 'crate' }); w.fx[w.fx.length - 1].good = g; }, i * 250)), dur: 1.2 + info.gained.length * 0.25 }), S('float', { at: 'ship', text: `+${info.gained.length} mal`, color: '#9ae0a0' }));
  for (const it of info.itemsGained) if (!no('items')) steps.push(par(S('icon', { icon: ITEM_BY_ID[it]?.icon || 'gift', from: encPos, to: 'ship' }), S('float', { at: 'ship', text: ITEM_BY_ID[it]?.name || 'İtem', color: '#c8a0ff' })));
  for (const it of info.itemsLost || []) steps.push(S('float', { at: 'ship', text: `${ITEM_BY_ID[it]?.name || 'İtem'} kullanıldı`, color: '#c8b0e0' }));
  if (info.hullDelta > 0) steps.push(no('hull') ? null : S('crewWork', { prefer: ['CREW_GROOT'], at: c.side < 0 ? 'railL' : 'railR', task: 'Gövdeyi onarıyor', dur: 3 }), par(S('particles', { kind: 'spark', at: 'ship', n: 18 }), S('sound', { name: 'repair' }), S('displayHull'), S('float', { at: 'ship', text: `+${info.hullDelta} Gövde`, color: '#6fd36a' })), S('wait', { dur: 0.8 }));
  for (const id of info.crewJoined) steps.push(S('float', { at: 'ship', text: `${CREW_BY_ID[id].name} katıldı!`, color: '#8ad0ff' }), S('wait', { dur: 0.6 }));
  for (const id of info.petsJoined) steps.push(S('float', { at: 'ship', text: `${PET_BY_ID[id].name} gemide!`, color: '#ffd76a' }), S('wait', { dur: 0.6 }));
  for (const id of info.crewLeft) steps.push(S('float', { at: 'ship', text: `${CREW_BY_ID[id].name} ayrıldı`, color: '#ffb07a' }));
  const xp = info.lines.find((l) => l.kind === 'xp');
  if (xp) steps.push(S('float', { at: { x: 0, y: -40 }, text: xp.text.replace(/^.*?(\+?-?\d+ XP).*$/, '$1'), color: '#f2e080' }));
  if (!steps.length) steps.push(S('wait', { dur: 0.6 }));
  steps.push(S('wait', { dur: 0.6 }));
  return steps.filter(Boolean);
}

export function optKind(c, info) {
  const ev = c.ev;
  const opt = ev.options.find((o, i) => `o${i}` === info.key) || {};
  const tags = opt.tags || [];
  const label = (info.label || '').toLowerCase();
  if (info.key === '__tarcin') return 'tarcin';
  if (info.key === '__parrot') return 'parrot';
  if (info.key === '__midnight') return 'midnight';
  if (info.key === '__hamid') return 'hamid';
  if (/^__(crown|redTalk|redSafe|redAlly|guild|eye|zipir)$/.test(info.key || '')) return info.key.slice(2);
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

/** Enjekte seçenekler (Tarçın, papağanlar, Hamid) her sahnede aynı imza animasyonu oynar */
export function injectedAction(c, info, encId) {
  const k = optKind(c, info);
  const enc = encId && c.world.get(encId) ? encId : null;
  if (k === 'tarcin') return [par(S('pet', { id: 'PET_TARCIN', at: 'bow', pose: 'bark', dir: 'up', dur: 4, say: 'Hav! Hav! Hav!', sfx: 'bark' }), S('say', { actor: 'CAPTAIN', text: 'Tarçın bir şey sezdi, hazır olun!', dur: 2.2 })), wait(2)];
  if (k === 'parrot') return [S('pet', { id: 'PET_KIRMIZI', at: rail(c.side), dur: 5 }), wait(1), par(S('say', { prefer: ['PET_KIRMIZI'], text: info.success ? 'Gizli fiyat! Gizli fiyat!' : 'Rum iç! Rum iç!', dur: 2.6 }), S('sound', { name: 'squawk' })), enc ? S('say', { id: enc, text: info.success ? 'Bu kuş… nereden biliyor?!' : 'Hahaha!', dur: 2.2, hold: 0.8 }) : wait(0.8)];
  if (k === 'midnight') return [S('pet', { id: 'PET_GECEYARISI', at: 'bow', dur: 5, fluff: 3 }), wait(1), par(S('say', { prefer: ['PET_GECEYARISI'], text: 'Kraaa… bu yoldan…', dur: 2.6 }), S('particles', { kind: 'spark', at: 'ship', n: 20, dy: -40 }), S('sound', { name: 'magic' })), wait(1)];
  if (k === 'hamid') return [S('crewWork', { prefer: ['CREW_HAMID'], at: rail(c.side), task: 'Tespihini çevirip pazarlık ediyor', dur: 4, hold: 1.4 }), S('say', { prefer: ['CREW_HAMID'], text: 'Bir dakika, kardeşim… bir hesap yapalım.', dur: 2.6, hold: 1.2 }), enc ? S('say', { id: enc, text: info.success ? 'Peki, peki… anlaştık.' : 'Hayır!', dur: 2, hold: 0.8 }) : wait(0.6)];
  // Yaşayan Denizler: fraksiyon / hafıza seçenekleri
  const sd = c.side;
  const ally = (style, npc, line) => [
    S('spawn', { e: { id: 'x1ally', kind: 'ship', style, level: 3, x: -sd * 260, y: -320, rot: Math.PI * 0.9, scale: 0.85, sails: 'full', crewNpc: [npc, 'sailor'], drift: false, encounter: true } }),
    par(S('move', { id: 'x1ally', to: { x: -sd * 150, y: -60, rot: 0 }, dur: 2.6 }), S('sound', { name: 'horn' })),
    S('say', { id: 'x1ally', text: line, dur: 2.4, hold: 0.6 }),
  ];
  const flee = enc ? [par(S('move', { id: enc, to: { y: -440, x: sd * 260, alpha: 0.4 }, dur: 3 }), S('sound', { name: 'depart' }))] : [wait(0.6)];
  const allyOut = [S('move', { id: 'x1ally', to: { y: -440 }, dur: 2.6 }), S('remove', { id: 'x1ally' })];
  if (k === 'crown') return [...ally('warship', 'officer', 'Kraliyet Muhafızları! Geri çekilin!'), S('fire', { from: 'x1ally', to: enc || { x: sd * 120, y: -120 }, n: 2, hit: false }), ...flee, ...allyOut];
  if (k === 'redAlly') return [...ally('red', 'redCaptain', 'Kızıl Kaptan dostlarını korur!'), enc ? S('say', { id: enc, text: 'Kızıl yelkenler mi?! Çekilin!', dur: 2, hold: 0.4 }) : wait(0.4), ...flee, par(S('move', { id: 'x1ally', to: { x: -sd * 120, y: 20 }, dur: 2 }), S('flag', { up: true, color: '#b3261e' })), wait(1), ...allyOut];
  if (k === 'redSafe' || k === 'redTalk') {
    const ok = k === 'redSafe' || info.success;
    return [par(S('flag', { up: true, color: '#b3261e' }), S('sound', { name: 'flag' }), S('say', { actor: 'CAPTAIN', text: 'Kardeşliğin işaretini görüyor musunuz?', dur: 2.4 })), wait(0.8), enc ? S('say', { id: enc, text: ok ? 'Kardeşlikten misiniz? Geçin, dostum.' : 'O bayrak burada para etmez!', dur: 2.4, hold: 0.8 }) : wait(0.8), ...(ok ? flee : []), S('flag', { up: false })];
  }
  if (k === 'guild') return [par(S('flag', { up: true, color: '#e0b040' }), S('sound', { name: 'flag' })), S('crewWork', { prefer: ['CAPTAIN'], at: rail(sd), task: 'Lonca mührünü gösteriyor', dur: 3, hold: 1 }), enc ? S('say', { id: enc, text: 'Loncanın dostu! O zaman size özel fiyat.', dur: 2.4, hold: 0.8 }) : wait(0.6), S('coins', { from: enc || { x: sd * 100, y: -40 }, to: 'ship', n: 8 }), S('flag', { up: false })];
  if (k === 'eye') return [S('spawn', { e: { id: 'x1trail', kind: 'sparkles', x: sd * 30, y: -80, layer: 2, opts: { r: 60, col: '#7affd8' }, drift: false, encounter: true } }), par(S('sound', { name: 'magic' }), S('say', { actor: 'CAPTAIN', text: 'Gözün bıraktığı iz… şuradan!', dur: 2.4 })), par(S('heel', { rot: sd * 0.08 }), S('shipTo', { x: sd * 24 })), wait(1.2), S('heel', { rot: 0 }), S('remove', { id: 'x1trail' })];
  if (k === 'zipir') return [S('pet', { id: 'PET_ZIPIR', at: 'bow', pose: 'alert', dur: 5, say: 'Mrrraaav!', sfx: 'meow' }), wait(0.8), S('say', { actor: 'CAPTAIN', text: 'Zıpır yine gördü. Rotayı kır!', dur: 2.2 }), par(S('heel', { rot: -sd * 0.14 }), S('shipTo', { x: -sd * 36 })), wait(1.2), S('heel', { rot: 0 })];
  return null;
}

// ───────── Genel sahne fabrikası (veri güdümlü yedek) ─────────
export function generic(ev, side) {
  const art = ev.art || {};
  const objs = art.obj || [];
  const hasObj = (k) => objs.includes(k);
  const sc = { side, mainId: null, thieves: false };
  const shipStyle = hasObj('pirateShip') || hasObj('pirateFleet') ? 'pirate' : hasObj('ghostShip') ? 'ghost' : hasObj('warship') ? 'warship' : hasObj('plagueShip') ? 'plague' : hasObj('merchantShip') ? 'merchant' : hasObj('halfSunk') ? 'merchant' : null;
  const floating = ['chest', 'barrels', 'bottle', 'timber', 'mapScroll', 'raft', 'boat', 'crate', 'catBoat', 'passenger'].find(hasObj);
  const obstacle = ['rocks', 'mine', 'iceberg'].find(hasObj);
  const island = ['island', 'ruins', 'lighthouse', 'shipyard', 'shrine', 'villagers', 'volcano', 'dock'].find(hasObj);
  const creature = hasObj('seaSerpent') ? 'serpent' : hasObj('tentacles') ? 'tentacles' : null;
  const wave = hasObj('wave') || hasObj('tsunami');
  const onDeck = hasObj('deckView') || hasObj('fire');
  const near = ['fishSchool', 'flyingFish', 'turtle', 'lightOrb', 'whirlpool', 'bell', 'sunkenCity'].find(hasObj);
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
  sc.weather = weather;

  sc.setup = (c, instant) => {
    const out = [...weather()];
    if (shipStyle) {
      sc.mainId = 'enc';
      sc.thieves = shipStyle === 'pirate';
      out.push(shipEntity(c, 'enc', shipStyle, hasObj('pirateFleet') ? 3 : 2, { damage: hasObj('halfSunk') ? 'sinking' : 'healthy', alpha: shipStyle === 'ghost' ? 0.65 : 1, sails: hasObj('halfSunk') ? 'furled' : 'full', scale: hasObj('halfSunk') ? 0.9 : 1 }));
      if (hasObj('pirateFleet')) {
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
      out.push(S('spawn', { e: { id: 'enc', kind, x: c.side * (c.beam / 2 + 34), y: -260, drift: false, encounter: true, opts: kind === 'boat' ? { npc: 'sailor' } : {} } }));
    } else if (obstacle) {
      sc.mainId = 'enc';
      out.push(S('spawn', { e: { id: 'enc', kind: obstacle, x: 0, y: -300, drift: false, encounter: true } }));
    } else if (island) {
      sc.mainId = 'enc';
      out.push(S('spawn', { e: { id: 'enc', kind: 'island', x: c.side * (c.beam / 2 + 90), y: -320, drift: false, encounter: true, opts: { r: 46, ruins: hasObj('ruins'), huts: hasObj('dock') || hasObj('villagers'), villagers: hasObj('villagers'), lighthouse: hasObj('lighthouse'), shipyard: hasObj('shipyard'), shrine: hasObj('shrine'), ground: hasObj('volcano') ? '#3a3032' : undefined, palms: hasObj('volcano') ? 0 : 4 } } }));
    } else if (wave) {
      sc.mainId = 'enc';
      out.push(S('spawn', { e: { id: 'enc', kind: 'wave', x: 0, y: -260, drift: false, encounter: true, layer: 1 } }));
    } else if (near) {
      sc.mainId = 'enc';
      out.push(S('spawn', { e: { id: 'enc', kind: near === 'sunkenCity' ? 'shadow' : near, x: c.side * (c.beam / 2 + 40), y: -200, drift: false, encounter: true, opts: near === 'sunkenCity' ? { s: 1.6, a: 0.3 } : { n: 40 } } }));
    }
    if (onDeck && hasObj('fire')) out.push(S('deckFire', { on: true }));
    return out;
  };

  sc.approach = (c) => {
    const out = [];
    if (!sc.mainId) return [par(S('speed', { v: 8 }), S('sails', { state: 'furled' }), S('react', { kind: danger ? 'danger' : 'fortune', side })), S('wait', { dur: 1.5 })];
    if (shipStyle) {
      out.push(par(S('move', { id: 'enc', to: { x: c.side * 170, y: -150 }, dur: 2.4 }), S('camera', { focus: { x: c.side * 80, y: -80 }, k: 0.3 })));
      out.push(par(S('react', { kind: danger ? 'danger' : 'fortune', side }), S('speed', { v: 6 }), S('sails', { state: 'furled' })));
      out.push(par(S('move', { id: 'enc', to: { x: alongside(c, 1, hasObj('pirateFleet') ? 3 : 2), y: -10, rot: 0, sails: 'furled' }, dur: 2.8 }), hasObj('pirateFleet') ? S('move', { id: 'enc2', to: { x: -alongside(c), y: 20, rot: 0 }, dur: 2.8, wait: false }) : null, hasObj('pirateFleet') ? S('move', { id: 'enc3', to: { x: 0, y: -c.len / 2 - 70, rot: Math.PI }, dur: 2.8, wait: false }) : null));
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
      out.push(par(S('sails', { state: 'furled' }), S('speed', { v: 0 }), S('react', { kind: danger ? 'danger' : 'fortune', side })));
    } else if (wave) {
      out.push(par(S('weather', { dark: 0.18, fx: ['rain'] }), S('move', { id: 'enc', to: { y: -c.len / 2 - 40 }, dur: 4, ease: 'in' }), S('react', { kind: 'danger', side }), S('speed', { v: 4 })));
    }
    return out;
  };

  sc.intro = () => {
    if (shipStyle === 'pirate') return [S('say', { id: 'enc', text: 'Ambarını boşalt, yoksa batarsın!', dur: 3, hold: 1.4 })];
    if (shipStyle === 'merchant') return [S('say', { id: 'enc', text: 'Selam tüccar!', dur: 2.5, hold: 0.8 })];
    if (shipStyle === 'warship') return [S('say', { id: 'enc', text: 'Kraliyet adına, dur!', dur: 2.5, hold: 0.8 })];
    if (shipStyle === 'ghost') return [S('say', { id: 'enc', text: '…', dur: 2, hold: 0.8 })];
    return [S('wait', { dur: 0.6 })];
  };

  sc.action = (c, info) => {
    const k = optKind(c, info);
    const out = [];
    const enc = sc.mainId && c.world.get('enc') ? 'enc' : null;
    if (info.auto) return [S('wait', { dur: 0.6 })];
    const inj = injectedAction(c, info, enc);
    if (inj) return inj;
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
    if (onDeck && hasObj('fire')) out.push(S('crewWork', { prefer: ['CREW_GROOT', 'CREW_LENA'], at: 'center', task: 'Yangınla mücadele ediyor', dur: 3, hold: 2 }));
    return out;
  };

  sc.outcome = (c, info) => {
    const out = [];
    const enc = sc.mainId && c.world.get('enc') ? 'enc' : null;
    if (enc && optKind(c, info) === 'combat' && info.success && shipStyle) out.push(S('say', { id: enc, text: 'Geri çekilin!', dur: 2, hold: 0.2 }));
    if (onDeck && hasObj('fire')) out.push(info.success ? par(S('deckFire', { on: false }), S('particles', { kind: 'smoke', at: 'ship', n: 20 })) : S('particles', { kind: 'fire', at: 'ship', n: 30 }));
    out.push(...genericOutcome(c, info, sc));
    if (onDeck && hasObj('fire')) out.push(S('deckFire', { on: false }));
    return out;
  };

  sc.exit = (c) => {
    const out = [];
    const w = c.world;
    if (w.get('enc')) {
      if (shipStyle) out.push(par(S('move', { id: 'enc', to: { y: -360, x: c.side * 220, rot: Math.PI * 0.85, sails: 'full' }, dur: 3 }), w.get('enc2') ? S('move', { id: 'enc2', to: { y: -380, x: -c.side * 240 }, dur: 3, wait: false }) : null, w.get('enc3') ? S('move', { id: 'enc3', to: { y: -420 }, dur: 3, wait: false }) : null));
      else if (creature) out.push(par(S('move', { id: 'enc', to: { alpha: 0 }, dur: 1.5 }), S('particles', { kind: 'splash', at: 'enc', n: 24 })));
      else out.push(...driftAll());
    }
    out.push(S('wait', { dur: 1.2 }));
    out.push(S('call', { fn: (d) => { d.world.remove('enc2'); d.world.remove('enc3'); d.world.remove('deckfire'); } }));
    return out;
  };
  return sc;
}

// ───────── Ritim parçaları (beats) ─────────
export const cap = (text, dur = 2.6, hold = 0.6) => S('say', { actor: 'CAPTAIN', text, dur, hold });
/** Tercih edilen tayfa konuşur; hiçbiri yoksa (fallback) kaptan */
export const crewSay = (prefer, text, o = {}) => S('say', { prefer: [].concat(prefer), text, dur: o.dur || 2.6, hold: o.hold ?? 0.8, any: o.any !== false, fallback: o.fallback ?? 'CAPTAIN' });
/** Yalnızca o kişi gemideyse konuşur */
export const only = (id, text, o = {}) => S('say', { prefer: [id], text, dur: o.dur || 2.6, hold: o.hold ?? 0.8, only: true, any: false, fallback: null });
export const lookout = (text, o = {}) => crewSay(['CREW_TOBIAS', 'CREW_FINN', 'CREW_COMPASS', 'CREW_YARA'], text, o);
export const say = (id, text, dur = 2.6, hold = 1) => S('say', { id, text, dur, hold });
export const slow = (v = 4) => par(S('speed', { v }), S('sails', { state: 'furled' }));
export const stop = () => par(S('speed', { v: 0 }), S('sails', { state: 'furled' }), S('sound', { name: 'anchor' }));
export const go = (v = 30) => par(S('sails', { state: 'full' }), S('speed', { v }));
export const cam = (focus, k = 0.3, zoom = 1) => S('camera', { focus, k, zoom });
export const camReset = () => S('camera', {});
export const react = (kind, side) => S('react', { kind, side });
export const sfx = (name) => S('sound', { name });
export const spawn = (e) => S('spawn', { e: { drift: false, encounter: true, ...e } });
export const move = (id, to, dur = 2, o = {}) => S('move', { id, to, dur, ...o });
export const remove = (id) => S('remove', { id });
export const fx = (kind, at, n = 14, o = {}) => S('particles', { kind, at, n, ...o });
export const float = (text, color = '#ffffff', at = 'ship') => S('float', { at, text, color });
export const work = (prefer, at, task, dur = 3, hold = 0) => S('crewWork', { prefer: [].concat(prefer), at, task, dur, hold });
export const gather = (at, task, o = {}) => S('gather', { at, task, ...o });
export const pet = (id, o) => S('pet', { id, ...o });
export const board = (id, npc, from, to, o = {}) => S('board', { id, npc, from, to, ...o });
export const unboard = (id, to, o = {}) => S('unboard', { id, to, ...o });
export const deckProp = (id, kind, at, o = {}) => S('deckProp', { id, kind, at, ...o });
export const weather = (o) => S('weather', o);
export const call = (fn, dur = 0) => S('call', { fn, dur });
export const drift = (...ids) => call((d) => { for (const id of ids) { const e = d.world.get(id); if (e) e.drift = true; } });
/** Tüm sahne nesnelerini akışa bırak (gemi ilerledikçe geride kalırlar) */
export function driftAll() {
  return [call((d) => { for (const e of d.world.entities) if (e.encounter && !e.local && e.kind !== 'ship' && !e.screen && (e.layer || 0) < 3) { e.drift = true; e.tween = null; } }), go(30)];
}
/** Gemideki geçici NPC'leri küpeşteye yürütüp indir */
export const offAll = (to) => call((d) => { const L = d.world.layout(); for (const t of d.world.deck.temp) d.unboard({ id: t.id, to: to || (t.x < L.cx ? 'railL' : 'railR'), wait: false }, false); }, 1.6);

/** Spesifikasyondan sahne üretir. spec: { setup, approach, intro, opts:[fn...], auto, outcome, skip, post, exit, mainId, thieves }
 *  opts[i](c, info) → seçenek i'nin AKSİYON adımları; outcome(c, info) genel sonuçtan önce; post sonra. */
export function def(specFn) {
  return (ev, side) => {
    const sc = generic(ev, side);
    const spec = typeof specFn === 'function' ? specFn(ev, side) : specFn;
    const base = { setup: sc.setup, approach: sc.approach, intro: sc.intro, action: sc.action, outcome: sc.outcome, exit: sc.exit };
    if (spec.side != null) sc.side = spec.side;
    sc.thiefNpc = spec.thiefNpc;
    sc.plank = spec.plank;
    if (spec.setup) sc.setup = (c, instant) => { sc.mainId = spec.mainId === undefined ? 'enc' : spec.mainId; sc.thieves = !!spec.thieves; return [...(spec.weather === false ? [] : spec.weather ? spec.weather(c) : sc.weather()), ...spec.setup(c, instant)]; };
    if (spec.approach) sc.approach = spec.approach;
    if (spec.dockApproach) sc.dockApproach = spec.dockApproach;
    if (spec.intro) sc.intro = spec.intro;
    sc.action = (c, info) => {
      if (info.auto) return spec.auto ? spec.auto(c, info, autoIndex(ev, info)) : [wait(0.6)];
      const inj = injectedAction(c, info, sc.mainId);
      if (inj) return [...(spec.preInjected ? spec.preInjected(c, info) : []), ...inj];
      const f = spec.opts?.[oi(info)];
      if (f) return f(c, info);
      return spec.action ? spec.action(c, info) : base.action(c, info);
    };
    sc.outcome = (c, info) => {
      if (spec.fullOutcome) return spec.fullOutcome(c, info);
      const pre = spec.outcome ? spec.outcome(c, info) : [];
      const skip = spec.skip ? spec.skip(info) : [];
      const from = spec.from ? spec.from(info) : sc.mainId;
      const post = spec.post ? spec.post(c, info) : [];
      return [...pre, ...genericOutcome(c, info, { ...sc, mainId: from }, skip), ...post];
    };
    const reset = () => par(S('shipTo', { x: 0, y: 0 }), S('heel', { rot: 0 }), S('flag', { up: false }));
    if (spec.exit) sc.exit = (c, info) => [reset(), ...spec.exit(c, info), offAll()];
    else sc.exit = (c, info) => [reset(), offAll(), ...base.exit(c, info)];
    return sc;
  };
}

/** Sandalla kıyıya çıkış: sandal kıyıya gider, (sahne), geri döner */
export function landing(c, side, npcs, onIsland, pre = [], dist = 70) {
  const ix = side * (c.beam / 2 + dist);
  return [
    ...pre,
    gather(rail(side), 'Sandalı indiriyor', { n: 2, run: true, dur: 3 }),
    spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs, dir: side < 0 ? 'left' : 'right' } }),
    move('boat', { x: ix, y: -36 }, 2.4),
    ...onIsland,
    S('opts', { id: 'boat', opts: { dir: side < 0 ? 'right' : 'left' } }),
    move('boat', { x: besides(c, 16, side), y: 0 }, 2.2),
    remove('boat'),
  ];
}

/** Dalış: tayfa küpeşteden dalar, kabarcıklar, sonra yüzeye çıkar */
export function dive(c, side, who, task, found) {
  return [
    work(who, rail(side), task, 3, 1),
    par(fx('splash', { rail: side }, 22), sfx('splash'), spawn({ id: 'bub', kind: 'bubbles', x: side * 20, y: -30, opts: { n: 24, w: 30, h: 40 } })),
    wait(2.2),
    ...found,
    par(remove('bub'), fx('splash', { rail: side }, 14)),
  ];
}

/** Rıhtım (liman varışı) koordinatları: iskele gemimizin sancak tarafında */
export const pierX = (c, k = 0) => c.beam / 2 + 18 + k;

/** Otomatik çözümde hangi 'auto' kuralının çalıştığını metinden bul */
export function autoIndex(ev, info) {
  return (ev.auto || []).findIndex((a) => a.text === info.text);
}

export { GOOD_BY_ID, ITEM_BY_ID, CREW_BY_ID, PET_BY_ID };
