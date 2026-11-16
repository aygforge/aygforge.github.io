// Event imza sahneleri. Ortak dil kit.js'te; kategori dosyaları kendi sahnelerini SCENES'e ekler.
// sceneFor(event) → { side, mainId, setup, approach, intro, action, outcome, exit }
import { S, par, shipEntity, alongside, genericOutcome, generic } from './kit.js';
import { DANGER_SCENES } from './scenes/danger.js';
import { FORTUNE_SCENES } from './scenes/fortune.js';
import { MYSTERY_SCENES } from './scenes/mystery.js';
import { DISASTER_SCENES } from './scenes/disaster.js';
import { CHAIN_SCENES } from './scenes/chains.js';
import { CREW_PET_SCENES } from './scenes/crewpet.js';
import { X1_SCENES } from './scenes/x1.js';
import { PET2_SCENES } from './scenes/pets2.js';
import { X2_SCENES } from './scenes/x2.js';
import { X3_SCENES } from './scenes/x3.js';

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

Object.assign(SCENES, DANGER_SCENES, FORTUNE_SCENES, MYSTERY_SCENES, DISASTER_SCENES, CHAIN_SCENES, CREW_PET_SCENES, X1_SCENES, PET2_SCENES, X2_SCENES, X3_SCENES);

/** Liman varış eventleri (rıhtım sahnesi, gemi demirli) için yaklaşmasız kurulum */
export function sceneFor(ev, side) {
  if (SCENES[ev.id]) return { side, ...SCENES[ev.id](ev, side), side };
  const sc = generic(ev, side);
  return sc;
}

// rıhtım hayvan varyantları
import { DRAW, rock } from '../rendering/td/Props.js';
import { petSprite, dS } from '../rendering/td/TopChars.js';
DRAW.dockCat = (t, e, a, r) => dS(t, petSprite('PET_ZIPIR', 'left', Math.sin(r * 1.3) > 0.8 ? 'wag1' : 'sit'), e + 8, a + 3);
DRAW.dockDog = (t, e, a, r) => dS(t, petSprite('PET_TARCIN', 'left', Math.sin(r * 5) > 0 ? 'wag1' : 'wag0'), e - 9, a + 2);
DRAW.rocksOnly = (t, e, a) => { rock(t, Math.round(e), Math.round(a + 2), 12, '#62626c'); };
