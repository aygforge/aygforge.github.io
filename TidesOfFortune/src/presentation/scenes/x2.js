// GENİŞLEME PAKETİ 2 — KAPTANLARIN HİKÂYELERİ: 25 bağımsız olay, 14 zincir aşaması ve 4 yankı için imza sahneleri.
// Akış: YAKLAŞMA → GİRİŞ → KARAR → EYLEM (seçeneğe özel) → BAŞARI/BAŞARISIZLIK GÖRÜNTÜSÜ → AYRILIŞ.
// Paket 2 koreografi kütüphanesi (yeniden kullanılabilir yardımcılar) dosyanın başında.
import {
  S, par, wait, def, rail, shipEntity, alongside, besides, cap, crewSay, only, lookout, say, slow, stop, go, cam,
  react, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, weather, call, driftAll, offAll,
  landing, dive,
} from '../kit.js';

const T = (n) => wait(n);

// ───────── Koreografi kütüphanesi ─────────
/** Gemiyi yan tarafa yanaştırır (yaklaşma + paralel konum) */
const approachShip = (c, id, level = 2, scale = 0.85, gap = 16) => [move(id, { x: c.side * 190, y: -30, rot: 0, sails: 'furled' }, 2.2), move(id, { x: alongside(c, scale, level, gap), y: -6 }, 1.4)];
/** İki gemi arasına kalas/halat köprüsü */
const boardViaPlank = (side, id = 'enc') => call((d) => { const e = d.world.get(id); const L = d.world.layout(); if (e) e.hooks = [{ x0: e.x - side * 16, y0: e.y, x1: d.world.ship.x + side * (L.beam / 2 - 6), y1: d.world.ship.y, plank: true }]; d.hooks.sfx?.('creak'); });
const dropPlank = (id = 'enc') => call((d) => { const e = d.world.get(id); if (e) e.hooks = null; });
/** Halatla küçük tekneyi çekme: halat bağlanır, tekne dümen suyuna geçer */
const attachRope = (side, id) => call((d) => { const e = d.world.get(id); const L = d.world.layout(); if (e) e.hooks = [{ x0: e.x, y0: e.y, x1: d.world.ship.x, y1: d.world.ship.y + L.len / 2 - 4 }]; d.hooks.sfx?.('hook'); });
const ropeSnap = (id) => par(call((d) => { const e = d.world.get(id); if (e) e.hooks = null; }), sfx('hook'), S('shake', { amount: 5 }));
const towSmallBoat = (c, id) => [move(id, { x: 0, y: c.len / 2 + 40 }, 2.4), move(id, { y: c.len / 2 + 28 }, 1.2)];
/** Yan yana seyir (eskort/yarış) */
const escortParallel = (id, x, y = 0, dur = 2.4) => move(id, { x, y, rot: 0, sails: 'full' }, dur);
const overtakeShip = (id, x, dy) => move(id, { x, y: dy }, 2.2);
const sailAwayUp = (c, id = 'enc') => move(id, { y: -420, x: c.side * 200, sails: 'full' }, 3);
const sailAwayBack = (id = 'enc') => move(id, { y: 420, sails: 'full' }, 3);
const signalFlags = (at, cols) => deckProp('flags', 'signalFlags', at, { opts: { cols } });
const transferDocuments = (from, to) => S('icon', { icon: 'scroll', from, to });
const beaconLight = (id, on = true) => S('opts', { id, opts: { lit: on } });
const birdTakeoff = (id) => par(move(id, { y: -260, x: 80, alpha: 0 }, 2.2), sfx('splash'));
const cookingSmoke = (at = 'galley') => par(fx('smoke', at, 14), deckProp('pot', 'cauldron', at));
const crewEatTogether = () => [gather('center', 'Birlikte yemek yiyor', { n: 5, dur: 7 }), crewSay([], 'Ellerine sağlık, Pita!', { dur: 2 })];
const diverSurface = (side) => par(fx('splash', { rail: side }, 16), sfx('splash'), remove('bub'));
const salvageWithCrane = (c, id, side) => [work([], rail(side), 'Vinci çalıştırıyor', 3, 0.8), S('throw', { from: { rail: side }, to: id, kind: 'rope', arc: 10 }), T(0.8)];
const medicalHelp = (who, at = 'center') => [deckProp('herbs', 'herbBowl', at, { dx: 8 }), work(who, at, 'Hastayı tedavi ediyor', 5, 1.2)];

export const X2_SCENES = {
  // ═══════════ TEHLİKELER ═══════════
  EVT_X2_D01: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'pirate', 2, { x: side * 240, y: -320, rot: Math.PI * 0.9, scale: 0.8, crewNpc: ['pirate', 'pirate'] })],
    approach: (c) => [par(slow(5), cam({ x: side * 60, y: -40 }, 0.3)), ...approachShip(c, 'enc', 2, 0.8), boardViaPlank(side), par(board('t1', 'pirate', rail(side), 'center', { dx: -6, wait: false }), board('t2', 'pirate', rail(side), 'center', { dx: 8, say: 'Borçlu biri sizin gemide!' })), react('danger', side)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(work(['CAPTAIN'], 'center', 'Belgeleri inceliyor', 4, 1), deckProp('doc', 'mapScroll', 'center', { dx: -2 })), ...(info.success ? [S('say', { actor: 't1', text: 'Hı… isim yanlış yazılmış. Özür dileriz.', dur: 2.2, hold: 0.4 }), remove('doc'), par(unboard('t1', rail(side)), unboard('t2', rail(side), { wait: false }))] : [S('say', { actor: 't2', text: 'Yeter bu sorgu!', dur: 1.6, hold: 0.2 }), par(sfx('impact'), fx('spark', 'ship', 16), S('shake', { amount: 7 })), remove('doc'), par(unboard('t1', rail(side)), unboard('t2', rail(side), { wait: false }))])],
      () => [S('coins', { from: 'ship', to: 't1', n: 8 }), S('say', { actor: 't1', text: 'Hesap kapandı.', dur: 1.8, hold: 0.4 }), par(unboard('t1', rail(side)), unboard('t2', rail(side), { wait: false }))],
      (c, info) => [par(gather(rail(side), 'Kılıç çekiyor', { n: 4, run: true, dur: 4 }), crewSay([], 'Gemimizden defolun!', { dur: 1.6 })), par(unboard('t1', rail(side)), unboard('t2', rail(side), { wait: false })), dropPlank(), S('fire', { from: 'ship', to: 'enc', n: 2, hit: info.success }), ...(info.success ? [par(fx('splinter', 'enc', 24), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_GOLD_BAR', arc: 20 }))] : [S('fire', { from: 'enc', to: 'ship', n: 3, hit: true })])],
    ],
    from: () => 'enc',
    exit: (c) => [dropPlank(), offAll(rail(side)), sailAwayUp(c), remove('enc'), go(30)],
  })),

  EVT_X2_D02: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'pirate', 3, { x: side * 240, y: -300, rot: Math.PI * 0.9, scale: 0.85, crewNpc: ['pirateCaptain', 'pirate', 'pirate'] })],
    approach: (c) => [par(slow(5), cam({ x: side * 70, y: -20 }, 0.3, 1.05)), ...approachShip(c, 'enc', 3, 0.85, 54), spawn({ id: 'plankD', kind: 'duelPlank', x: side * (c.beam / 2 + 26), y: -6, layer: 2, opts: { w: 52 } }), sfx('creak'), say('enc', 'Kalasa çık, kaptan!', 2.2, 0.6)],
    intro: () => [react('danger', side)],
    opts: [
      (c, info) => [board('me', 'captain', rail(side), rail(side), { dx: side * 14, endState: 'work' }), board('rv', 'pirateCaptain', rail(side), rail(side), { dx: side * 30, endState: 'work', wait: false }), ...[0, 1, 2].map(() => [par(sfx('sword'), fx('spark', { rail: side, dx: side * 22 }, 8)), T(0.45)]), ...(info.success ? [par(unboard('rv', rail(side)), fx('splash', { rail: side, dx: side * 30 }, 20), sfx('splash')), par(S('flag', { up: true }), sfx('cheer')), S('coins', { from: 'enc', to: 'ship', n: 10 })] : [par(S('shake', { amount: 8 }), sfx('impact')), say('enc', 'Hah! Bir dahaki sefere.', 2, 0.4)]), unboard('me', 'helm')],
      (c, info) => [par(work(['CREW_DIEGO'], rail(side), 'Kalasa çıkıyor', 3, 0.6), only('CREW_DIEGO', 'Şapkamı tutun.', { dur: 1.6 })), ...[0, 1, 2, 3].map(() => [par(sfx('sword'), fx('spark', { rail: side, dx: side * 22 }, 8)), T(0.35)]), ...(info.success ? [par(fx('splash', { rail: side, dx: side * 34 }, 20), sfx('splash')), par(S('flag', { up: true }), sfx('cheer')), S('coins', { from: 'enc', to: 'ship', n: 10 })] : [par(S('shake', { amount: 6 }), sfx('impact'))])],
      () => [S('coins', { from: 'ship', to: 'enc', n: 4 }), say('enc', 'Akıllı kaptan. Geç bakalım.', 2, 0.4)],
    ],
    skip: () => ['gold'],
    from: () => 'enc',
    exit: (c) => [remove('plankD'), offAll(rail(side)), S('flag', { up: false }), sailAwayUp(c), remove('enc'), go(30)],
  })),

  EVT_X2_D03: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'chainBar', x: 0, y: -260, opts: { w: 170 } })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 8 }, 2.6), S('speed', { v: 26 }), cam({ x: 0, y: -60 }, 0.3)), par(S('speed', { v: 0 }), S('sails', { state: 'furled' }), S('shake', { amount: 10 }), sfx('impact'), S('opts', { id: 'enc', opts: { w: 170, taut: true } })), react('danger', side), lookout('Pruvaya zincir takıldı!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [gather('bow', 'Zinciri halka halka kesiyor', { n: 4, run: true, dur: 5 }), ...[0, 1, 2].map(() => [par(sfx('hook'), fx('spark', { rail: 0, dy: -c.len / 2 }, 8)), T(0.6)]), par(S('opts', { id: 'enc', opts: { w: 170, broken: true } }), sfx('creak')), go(16)],
      (c, info) => [...salvageWithCrane(c, 'enc', side), gather('bow', 'Halatı çekiyor', { n: 4, run: true, dur: 4 }), ...(info.success ? [spawn({ id: 'gear', kind: 'crate', x: 0, y: -c.len / 2 - 10 }), S('pickup', { id: 'gear', prefer: ['CREW_GROOT'], task: 'Demir dişliyi güverteye alıyor' }), S('opts', { id: 'enc', opts: { w: 170, broken: true } })] : [ropeSnap('enc'), par(fx('splinter', { rail: 0, dy: -c.len / 2 + 8 }, 24), S('shake', { amount: 9 }), sfx('impact'))])],
      (c, info) => [par(go(60), sfx('depart'), S('heel', { rot: side * 0.05 })), ...(info.success ? [par(S('opts', { id: 'enc', opts: { w: 170, broken: true } }), sfx('creak'), fx('splash', { rail: 0, dy: -c.len / 2 }, 20))] : [par(S('shake', { amount: 12 }), fx('splinter', 'ship', 26), sfx('impact')), S('opts', { id: 'enc', opts: { w: 170, broken: true } })]), S('heel', { rot: 0 })],
    ],
    exit: () => [remove('gear'), ...driftAll()],
  })),

  EVT_X2_D04: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'fL', kind: 'fort', x: -c.beam / 2 - 110, y: -300, opts: { side: -1 } }), spawn({ id: 'enc', kind: 'fort', x: c.beam / 2 + 110, y: -300, opts: { side: 1 } })],
    approach: (c) => [par(move('fL', { y: -90 }, 3.6), move('enc', { y: -90 }, 3.6, { wait: false }), slow(6), cam({ x: 0, y: -50 }, 0.3, 0.9)), par(S('opts', { id: 'enc', opts: { side: 1, fire: true } }), sfx('cannon'), fx('splash', { x: 30, y: -c.len / 2 - 30 }, 30)), S('opts', { id: 'enc', opts: { side: 1 } }), par(react('danger', side), crewSay([], 'İki yandan top!', { dur: 1.8 }))],
    intro: () => [T(0.3)],
    opts: [
      (c) => [spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, 1), y: 0, opts: { npcs: ['sailor'], dir: 'right' } }), S('coins', { from: 'ship', to: 'boat', n: 6 }), move('boat', { x: c.beam / 2 + 90, y: -80 }, 2.2), remove('boat'), go(20)],
      (c, info) => [par(go(60), sfx('depart')), par(S('heel', { rot: -0.12 }), S('shipTo', { x: -24 })), par(S('opts', { id: 'fL', opts: { side: -1, fire: true } }), sfx('cannon')), T(0.5), par(S('heel', { rot: 0.12 }), S('shipTo', { x: 24 })), ...(info.success ? [fx('splash', { x: -40, y: -20 }, 30), fx('splash', { x: 50, y: 10 }, 30)] : [par(fx('splinter', 'ship', 30), S('shake', { amount: 14 }), sfx('impact'))]), S('heel', { rot: 0 })],
      (c, info) => [work(['CREW_LENA', 'CREW_BJORN'], rail(1), 'Topu mevziye çeviriyor', 3, 0.6), S('fire', { from: { rail: 1 }, to: 'enc', n: 2, hit: info.success }), ...(info.success ? [par(S('opts', { id: 'enc', opts: { side: 1, smoke: true } }), fx('fire', 'enc', 16), sfx('cannon')), go(40)] : [par(S('opts', { id: 'enc', opts: { side: 1, fire: true } }), fx('splinter', 'ship', 22), S('shake', { amount: 9 }))])],
    ],
    exit: () => [...driftAll(), T(0.6)],
  })),

  EVT_X2_D05: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [shipEntity(c, 'enc', 'pirate', 1, { x: side * 60, y: 380, rot: 0, scale: 0.7, sails: 'full' }), ...(c.run.x1?.endless?.on && (c.run.x1.endless.extra || 0) >= 9 ? [shipEntity(c, 'enc2', 'pirate', 1, { x: -side * 80, y: 400, rot: 0, scale: 0.65, sails: 'full' })] : [])],
    approach: (c) => [par(cam({ x: 0, y: 80 }, 0.3, 0.9), move('enc', { y: 240 }, 2.4), move('enc2', { y: 260 }, 2.4, { wait: false })), lookout('Arkamızda ışıksız bir yelken!', { dur: 2 }), move('enc', { y: 300, x: -side * 30 }, 1.6), move('enc', { y: 200, x: side * 40 }, 1.8), react('danger', side)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(go(80), sfx('depart'), S('sails', { state: 'full' })), ...(info.success ? [par(move('enc', { y: 460 }, 3), move('enc2', { y: 480 }, 3, { wait: false }))] : [move('enc', { y: c.len / 2 + 40, x: side * 50 }, 1.8), S('fire', { from: 'enc', to: 'ship', n: 2, hit: true })])],
      (c) => [gather('cargo', 'Sandığı denize bırakıyor', { n: 2, dur: 3 }), S('cargoOverboard', { goods: [], to: { x: -side * 20, y: c.len / 2 + 30 }, arc: 14 }), spawn({ id: 'decoy', kind: 'crate', x: -side * 20, y: c.len / 2 + 30 }), par(go(60), move('enc', { x: -side * 20, y: c.len / 2 + 40 }, 2.4)), remove('decoy'), par(say('enc', 'Sandık bizim!', 1.4, 0.2)), move('enc', { y: 460 }, 2.6)],
      (c, info) => [stop(), move('enc', { x: alongside(c, 0.7, 1, 20), y: 0 }, 2.6), ...(info.text?.includes('haberci') ? [board('msg', 'sailor', rail(side), rail(side), { say: 'Önünüzdeki sulara dikkat edin!' }), transferDocuments({ rail: side }, 'ship'), unboard('msg', rail(side))] : [par(board('p1', 'pirate', rail(side), 'cargo', { wait: false }), board('p2', 'pirate', rail(side), 'cargo', { dx: 8 })), par(sfx('impact'), S('shake', { amount: 8 }), fx('spark', 'ship', 16)), par(unboard('p1', rail(side), { carry: 'GOOD_SPICE' }), unboard('p2', rail(side), { wait: false }))])],
    ],
    skip: () => ['lost'],
    exit: () => [offAll(), remove('decoy'), par(move('enc', { y: 480 }, 2.6), move('enc2', { y: 480 }, 2.6, { wait: false })), remove('enc'), remove('enc2'), weather({ restore: true }), go(30)],
  })),

  // ═══════════ TİCARET / FIRSAT ═══════════
  EVT_X2_F01: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'r1', 'liora', 1, { x: -c.beam / 2 - 60, y: 260, rot: 0, scale: 0.6, sails: 'full' }), shipEntity(c, 'r2', 'merchant', 1, { x: c.beam / 2 + 60, y: 280, rot: 0, scale: 0.6, sails: 'full' }), spawn({ id: 'buoy', kind: 'raceBuoy', x: 0, y: -420, opts: { col: '#e0c040' } })],
    approach: (c) => [par(escortParallel('r1', -c.beam / 2 - 60, 20, 3), escortParallel('r2', c.beam / 2 + 60, 30, 3), slow(10), cam({ x: 0, y: -10 }, 0.3, 0.92)), say('r1', 'Şamandıraya kadar! Hazır mısın?', 2.2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(go(70), S('sails', { state: 'full' }), move('buoy', { y: -c.len / 2 - 60 }, 3), overtakeShip('r1', -c.beam / 2 - 60, info.success ? 60 : -60), overtakeShip('r2', c.beam / 2 + 60, info.success ? 80 : -40)), ...(info.success ? [par(S('flag', { up: true }), sfx('cheer'), float('Birinci!', '#ffd76a')), S('coins', { from: 'r1', to: 'ship', n: 8 })] : [par(say('r2', 'Hah! Bir burun önde!', 2, 0.4), sfx('horn'))])],
      () => [par(work(['CAPTAIN'], rail(side), 'Yarışçıları selamlıyor', 3), overtakeShip('r1', -160, -260), overtakeShip('r2', 160, -280))],
      (c) => [S('coins', { from: 'ship', to: 'r1', n: 4 }), say('r1', 'Önündeki sularda bir sığlık var, kuzeyden dolan!', 2.6, 0.6), transferDocuments('r1', 'ship')],
    ],
    skip: () => ['gold'],
    exit: (c) => [S('flag', { up: false }), par(move('r1', { y: -440 }, 3), move('r2', { y: -440 }, 3, { wait: false })), remove('r1'), remove('r2'), remove('buoy'), go(30)],
  })),

  EVT_X2_F02: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'tentBoat', x: besides(c, 34), y: -260, opts: { col: '#e0b040', npc: 'merchant', dir: side < 0 ? 'right' : 'left', cargo: ['GOOD_SPICE'] } })],
    approach: (c) => [par(move('enc', { y: -6 }, 3.4), slow(4), cam({ x: side * 40, y: 0 }, 0.3, 1.06)), stop(), board('mer', 'merchant', rail(side), 'cargo', { say: 'Piyasanın altında! Tartıya bakın!', endState: 'work' }), deckProp('sc', 'scales', 'cargo', { dx: side * -10, opts: { tilt: 0.3, cheat: false } })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_SPICE', arc: 20 }), S('coins', { from: 'ship', to: 'mer', n: 6 })), ...(info.text?.includes('eksik') ? [par(crewSay([], 'Bu çuval yarı boş!', { dur: 1.8 }), S('opts', { id: 'sc', opts: { tilt: -0.8, cheat: true } }))] : [S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_SPICE', arc: 20 })]), unboard('mer', rail(side))],
      (c, info) => [work(['CAPTAIN', 'CREW_HAMID'], 'cargo', 'Kefenin altını yokluyor', 4, 1), ...(info.success ? [par(S('opts', { id: 'sc', opts: { tilt: 0.8, cheat: true } }), float('Gizli ağırlık!', '#ffd76a')), S('say', { actor: 'mer', text: 'Pekâlâ… dürüst tartıyla.', dur: 2, hold: 0.4 }), S('opts', { id: 'sc', opts: { tilt: 0 } }), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_SPICE', arc: 20 }), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_SPICE', arc: 20 })] : [S('say', { actor: 'mer', text: 'Bana hırsız mı diyorsunuz?! Teklif iptal.', dur: 2.2, hold: 0.4 })]), unboard('mer', rail(side))],
      () => [par(work(['CAPTAIN'], 'cargo', 'Sakin sakin pazarlık ediyor', 3, 0.6), S('say', { actor: 'mer', text: 'Peki peki, biraz indiririm.', dur: 2, hold: 0.4 })), S('opts', { id: 'sc', opts: { tilt: 0 } }), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_SPICE', arc: 20 }), unboard('mer', rail(side))],
    ],
    skip: () => ['gained', 'gold'],
    exit: () => [remove('sc'), offAll(rail(side)), ...driftAll()],
  })),

  EVT_X2_F03: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'theatreStage', x: besides(c, 50), y: -260, opts: { open: 0 } })],
    approach: (c) => [par(move('enc', { y: -10 }, 3.4), slow(4), cam({ x: side * 50, y: 0 }, 0.3, 1.02)), stop(), say('enc', 'Deniz kadar eski bir hikâye!', 2.2, 0.6), gather(rail(side), 'Sahneyi izliyor', { n: 4, dur: 10 })],
    intro: () => [pet('PET_TARCIN', { at: rail(side), pose: 'wag', dur: 6 }), pet('PET_ZIPIR', { at: rail(side), dx: 8, pose: 'sit', dur: 6, run: false })],
    opts: [
      () => [S('coins', { from: 'ship', to: 'enc', n: 4 }), ...[0.3, 0.6, 1].map((o) => [S('opts', { id: 'enc', opts: { open: o } }), T(0.3)]), par(sfx('cheer'), crewSay([], '♪ Bravo! ♪', { dur: 2 }), deckProp('notes', 'sparkles', rail(side), { opts: { r: 22, col: '#ffe080' } })), T(2), pet('PET_TARCIN', { pose: 'wag', dur: 4, say: 'Hav!' })],
      (c) => [gather('cargo', 'Kereste ve erzak taşıyor', { n: 2, dur: 3 }), S('throw', { from: 'ship', to: 'enc', kind: 'crate', good: 'GOOD_TIMBER', arc: 18 }), ...[0.4, 1].map((o) => [S('opts', { id: 'enc', opts: { open: o } }), T(0.4)]), par(sfx('cheer'), say('enc', 'Bu oyun senin için, kaptan!', 2.4, 0.6))],
      () => [cap('Teşekkürler, yolumuz uzun.', 1.8, 0.6), go(24)],
    ],
    skip: () => ['lost'],
    exit: () => [remove('notes'), offAll(), ...driftAll()],
  })),

  EVT_X2_F04: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 40), y: -260, opts: { npcs: ['villager', 'sailor'], dir: 'down' } })],
    approach: (c) => [par(move('enc', { y: -30 }, 3.4), slow(5), cam({ x: side * 40, y: 0 }, 0.3, 1.04)), say('enc', 'Yelkenimiz yırtıldı! Bizi çekin!', 2.2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work([], rail(side), 'Halat fırlatıyor', 2, 0.6), S('throw', { from: { rail: side }, to: 'enc', kind: 'rope', arc: 12 }), attachRope(side, 'enc'), ...towSmallBoat(c, 'enc'), par(go(26)), T(1.4), ...(info.success ? [say('enc', 'Kıyı göründü! Teşekkürler!', 2, 0.4), S('coins', { from: 'enc', to: 'ship', n: 8 })] : [ropeSnap('enc'), par(fx('splinter', { rail: 0, dy: c.len / 2 - 4 }, 14), S('shake', { amount: 5 })), move('enc', { y: c.len / 2 + 120 }, 2)])],
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 3 }), board('h1', 'sailor', rail(side), rail(side), { carry: 'GOOD_TIMBER' }), unboard('h1', rail(side)), par(S('opts', { id: 'enc', opts: { npcs: ['villager', 'sailor'], dir: 'up', sail: true } }), sfx('cheer')), move('enc', { y: -300 }, 2.8)],
      () => [go(26)],
    ],
    exit: () => [call((d) => { const e = d.world.get('enc'); if (e) e.hooks = null; }), offAll(), ...driftAll()],
  })),

  EVT_X2_F05: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'kitchen', 2, { x: side * 240, y: -300, rot: Math.PI * 0.9, scale: 0.8, crewNpc: ['merchant', 'villagerF'] })],
    approach: (c) => [par(slow(5), cam({ x: side * 60, y: -20 }, 0.3)), ...approachShip(c, 'enc', 2, 0.8), boardViaPlank(side), par(fx('smoke', 'enc', 10), say('enc', 'Yeni lezzet getirene altın!', 2.2, 0.6)), deckProp('table', 'mapTable', 'center')],
    intro: () => [T(0.3)],
    opts: [
      () => [gather('cargo', 'Çuvalı taşıyor', { n: 2, dur: 3 }), S('cargoUse', { goods: [], at: rail(side) }), S('throw', { from: 'ship', to: 'enc', kind: 'crate', good: 'GOOD_SPICE', arc: 18 }), par(fx('smoke', 'enc', 12), say('enc', 'Muhteşem! Ödül senin!', 2, 0.4)), S('coins', { from: 'enc', to: 'ship', n: 10 })],
      () => [par(cookingSmoke('galley'), work(['CREW_PITA'], 'galley', 'Tadım için özel yemek yapıyor', 6, 1)), only('CREW_PITA', 'Bir tutam tuz, bir avuç sabır…', { dur: 2.2 }), board('taster', 'merchant', rail(side), 'galley', { say: 'Bu tarif… inanılmaz!' }), transferDocuments('galley', 'ship'), unboard('taster', rail(side))],
      () => [board('cook', 'villagerF', rail(side), 'center', { say: 'Buyurun, tadına bakın.' }), gather('center', 'Tadıma katılıyor', { n: 3, dur: 4 }), unboard('cook', rail(side))],
    ],
    skip: () => ['gold', 'lost'],
    exit: (c) => [remove('table'), remove('pot'), dropPlank(), offAll(rail(side)), sailAwayUp(c), remove('enc')],
  })),

  // ═══════════ GİZEM ═══════════
  EVT_X2_M01: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.08 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'footprints', x: side * 140, y: -200, opts: { n: 0, dx: -side * 8, dy: 14 } })],
    approach: (c) => [par(slow(10), cam({ x: side * 40, y: -60 }, 0.3)), ...[2, 4, 6, 8, 10].map((n) => [S('opts', { id: 'enc', opts: { n, dx: -side * 8, dy: 14, ghost: true } }), sfx('splash'), T(0.5)]), par(react('fortune', side), gather(rail(side), 'Ayak izlerine bakıyor', { n: 3, dur: 8, state: 'react' }), crewSay([], 'Suyun üstünde… biri yürüyor!', { dur: 2.2 }))],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(S('speed', { v: 10 }), S('shipTo', { x: side * 20 })), ...(info.success ? [spawn({ id: 'box', kind: 'chest', x: side * 60, y: -40 }), S('pickup', { id: 'box', prefer: [], task: 'Sandığı sudan çıkarıyor' })] : [par(S('shake', { amount: 9 }), fx('splinter', 'ship', 20), sfx('impact')), spawn({ id: 'rk', kind: 'rocksOnly', x: side * 40, y: -c.len / 2 - 10 })])],
      () => [work(['CAPTAIN'], 'helm', 'İzleri deftere çiziyor', 4, 1), S('opts', { id: 'enc', opts: { n: 14, dx: side * 8, dy: -6 } }), sfx('page')],
      () => [par(work(['CREW_MAGDA'], rail(side), 'İzleri yorumluyor', 4, 1), only('CREW_MAGDA', 'Bir kaptanın ruhu… yol gösteriyor.', { dur: 2.4 })), spawn({ id: 'orb', kind: 'lightOrb', x: side * 60, y: -40 }), S('icon', { icon: 'compass', from: 'orb', to: 'ship' }), remove('orb')],
      () => [deckProp('atlas', 'mapTable', 'center'), work(['CAPTAIN'], 'center', 'Sembolleri atlasla eşliyor', 4, 1), sfx('page'), remove('atlas')],
    ],
    exit: () => [remove('box'), remove('rk'), remove('orb'), ...driftAll(), weather({ restore: true })],
  })),

  EVT_X2_M02: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: () => [spawn({ id: 'stars', kind: 'stars', x: 0, y: 0, screen: true, layer: 3, opts: { n: 60, H: 220 } }), deckProp('cmp', 'glowRing', 'helm', { opts: { col: '#7ad8ff' } })],
    approach: () => [par(slow(12), cam({ x: 0, y: 20 }, 0.3, 1.08)), work(['CAPTAIN'], 'helm', 'Pusulaya bakıyor', 4, 1), par(sfx('magic'), crewSay([], 'İbre ikiye bölündü!', { dur: 2 })), par(S('heel', { rot: 0.05 }), T(0.4)), S('heel', { rot: -0.05 }), S('heel', { rot: 0 })],
    intro: () => [T(0.3)],
    opts: [
      () => [par(cap('Bildiğimiz kuzey.', 1.6, 0.4), S('sails', { state: 'full' })), remove('cmp')],
      (c, info) => [par(S('heel', { rot: side * 0.1 }), S('shipTo', { x: side * 30 }), go(30)), ...(info.success ? [par(spawn({ id: 'ring', kind: 'glowPatch', x: side * 40, y: -c.len / 2 - 40, opts: { n: 3, w: 60, h: 40 } }), sfx('magic')), spawn({ id: 'box', kind: 'chest', x: side * 40, y: -c.len / 2 - 40 }), S('pickup', { id: 'box', prefer: [], task: 'Işıklı halkadan sandığı çekiyor' })] : [par(S('heel', { rot: -side * 0.1 }), crewSay([], 'Hiçbir şey… pusula şaştı.', { dur: 2 }))]), S('heel', { rot: 0 })],
      () => [par(work(['CREW_COMPASS'], 'helm', 'İki ibreyi yıldızlarla kıyaslıyor', 5, 1), only('CREW_COMPASS', 'İkinci kuzey bir akıntının izi.', { dur: 2.4 })), remove('cmp')],
      () => [deckProp('atlas', 'mapTable', 'center'), work(['CAPTAIN'], 'center', 'Titreşimi sembolle eşliyor', 4, 1), sfx('page'), remove('atlas')],
    ],
    exit: () => [remove('stars'), remove('cmp'), remove('ring'), remove('box'), remove('atlas'), weather({ restore: true }), go(30)],
  })),

  EVT_X2_M03: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'stoneFish', x: side * 40, y: -260, opts: { frozen: 0 } })],
    approach: (c) => [par(move('enc', { y: -20 }, 3.4), slow(6), cam({ x: side * 30, y: -10 }, 0.3, 1.05)), ...[0.2, 0.4, 0.6].map((f) => [S('opts', { id: 'enc', opts: { frozen: f } }), T(0.5)]), par(react('fortune', side), gather(rail(side), 'Taşlaşan balıklara bakıyor', { n: 3, dur: 8 }), crewSay([], 'Balıklar taşa dönüyor!', { dur: 2 }))],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work([], rail(side), 'Ağı indiriyor', 3, 1), S('throw', { from: { rail: side }, to: 'enc', kind: 'rope', arc: 14 }), spawn({ id: 'net', kind: 'net', x: side * 40, y: -20, opts: { r: 14, fish: 3 } }), T(0.8), ...(info.success ? [S('pickup', { id: 'net', prefer: [], task: 'Taş numuneyi çekiyor' }), par(fx('spark', 'ship', 14), sfx('magic'))] : [par(remove('net'), S('shake', { amount: 8 }), fx('splinter', { rail: side }, 18), sfx('impact'))])],
      () => [work(['CAPTAIN'], rail(side), 'Saatlerce gözlemliyor', 5, 1), S('opts', { id: 'enc', opts: { frozen: 0.8 } }), sfx('page')],
      () => [go(26)],
    ],
    exit: () => [remove('net'), ...driftAll()],
  })),

  EVT_X2_M04: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [spawn({ id: 'enc', kind: 'soundRings', x: side * 30, y: -c.len / 2 - 30, alpha: 0 })],
    approach: () => [par(slow(10), cam({ x: 0, y: -40 }, 0.3)), par(move('enc', { alpha: 1 }, 2), sfx('magic')), ...[0, 1].map(() => [par(S('shake', { amount: 3 }), sfx('creak')), T(0.5)]), par(react('fortune', side), deckProp('lamp', 'lantern', 'mast'), crewSay([], 'Tahtalar şarkıyla titriyor…', { dur: 2.2 }))],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(S('speed', { v: 12 }), move('enc', { y: -c.len / 2 - 10 }, 2.4)), ...(info.success ? [spawn({ id: 'alt', kind: 'shrine', x: side * 30, y: -c.len / 2 - 50 }), par(fx('gold', 'alt', 14), sfx('coin')), S('coins', { from: 'alt', to: 'ship', n: 8 })] : [par(S('shake', { amount: 12 }), fx('splinter', 'ship', 24), sfx('roar'))])],
      () => [work(['CAPTAIN'], 'helm', 'Notaları deftere geçiriyor', 4, 1), sfx('page')],
      () => [par(work(['CREW_KALANI', 'CREW_MAGDA'], 'bow', 'Eski bir ilahiyle karşılık veriyor', 5, 1), crewSay(['CREW_KALANI', 'CREW_MAGDA'], '♪ Derinlerin bekçisi, uyu… ♪', { dur: 2.6 })), par(S('opts', { id: 'enc', opts: { col: '255,230,160' } }), sfx('magic')), move('enc', { alpha: 0.2 }, 2)],
      () => [work(['CAPTAIN'], rail(side), 'Yankı takımını suya indiriyor', 4, 1), S('throw', { from: { rail: side }, to: 'enc', kind: 'rope', arc: 8 }), S('coins', { from: 'enc', to: 'ship', n: 4 })],
      (c) => [par(deckProp('lamp2', 'lantern', 'bow'), work(['CAPTAIN'], 'bow', 'Fenerle şarkının ritmini tekrarlıyor', 4, 1)), ...[0, 1, 2].map(() => [par(S('flash', {}), sfx('magic')), T(0.5)]), spawn({ id: 'gift', kind: 'lightOrb', x: side * 30, y: -c.len / 2 - 20 }), S('icon', { icon: 'gift', from: 'gift', to: 'ship' }), remove('gift')],
    ],
    exit: () => [remove('lamp'), remove('lamp2'), remove('alt'), move('enc', { alpha: 0 }, 1), remove('enc'), weather({ restore: true }), go(30)],
  })),

  // ═══════════ FELAKETLER ═══════════
  EVT_X2_DIS01: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', fx: ['rain'], dark: 0.14 })],
    setup: (c) => [spawn({ id: 'sL', kind: 'stormFront', x: -c.beam / 2 - 180, y: -60, layer: 3, opts: { side: -1 } }), spawn({ id: 'enc', kind: 'stormFront', x: c.beam / 2 + 180, y: -60, layer: 3, opts: { side: 1 } })],
    approach: (c) => [par(move('sL', { x: -c.beam / 2 - 80 }, 3.4), move('enc', { x: c.beam / 2 + 80 }, 3.4, { wait: false }), slow(8), cam({ x: 0, y: -10 }, 0.3, 0.9), sfx('thunder')), par(react('disaster', side), gather('mast', 'Halatlara koşuyor', { n: 4, run: true, dur: 6 }))],
    intro: () => [sfx('thunder')],
    opts: [
      (c, info) => [par(work(['CAPTAIN'], 'helm', 'Koridoru hedefliyor', 4), go(40)), ...(info.success ? [par(move('sL', { x: -c.beam / 2 - 200 }, 2.6), move('enc', { x: c.beam / 2 + 200 }, 2.6, { wait: false }))] : [par(move('sL', { x: -c.beam / 2 - 30 }, 1.6), move('enc', { x: c.beam / 2 + 30 }, 1.6, { wait: false })), par(S('heel', { rot: side * 0.18 }), S('shake', { amount: 14 }), fx('splash', 'ship', 50), sfx('impact')), S('heel', { rot: 0 })])],
      () => [stop(), S('sails', { state: 'furled' }), cap('Demir atın! Bekleyeceğiz.', 2, 0.6), par(move('sL', { x: -40, alpha: 0.4 }, 4), move('enc', { x: 40, alpha: 0.4 }, 4, { wait: false })), T(1), par(move('sL', { alpha: 0 }, 2), move('enc', { alpha: 0 }, 2, { wait: false }))],
      (c, info) => [par(go(90), sfx('depart'), S('sails', { state: 'full' })), ...(info.success ? [par(move('sL', { y: 300 }, 2.4), move('enc', { y: 300 }, 2.4, { wait: false }))] : [par(fx('splash', 'ship', 70), S('shake', { amount: 16 }), sfx('impact'), S('heel', { rot: -side * 0.2 })), S('heel', { rot: 0 })])],
      (c, info) => [par(work(['CAPTAIN', 'CREW_TOBIAS'], 'helm', 'Bulutların arasındaki yolu okuyor', 4, 1), spawn({ id: 'path', kind: 'sparkles', x: 0, y: -100, layer: 2, opts: { r: 40, col: '#bfe3ff' } })), go(40), ...(info.success ? [] : [par(S('shake', { amount: 8 }), fx('splash', 'ship', 30))])],
    ],
    exit: () => [remove('path'), par(move('sL', { alpha: 0 }, 1.2), move('enc', { alpha: 0 }, 1.2, { wait: false })), remove('sL'), remove('enc'), weather({ restore: true })],
  })),

  EVT_X2_DIS02: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', dark: 0.1 })],
    setup: () => [spawn({ id: 'enc', kind: 'waterWall', x: 0, y: 0, alpha: 0, opts: { r: 150 } })],
    approach: () => [par(S('speed', { v: 6 }), cam({ x: 0, y: 0 }, 0.3, 0.92)), par(move('enc', { alpha: 1 }, 2), sfx('roar')), ...[0, 1].map(() => [par(S('heel', { rot: 0.06 }), sfx('creak')), T(0.5), S('heel', { rot: -0.06 }), T(0.5)]), par(S('heel', { rot: 0 }), react('disaster', side), crewSay([], 'Etrafımızda bir su duvarı dönüyor!', { dur: 2.2 }))],
    intro: () => [T(0.3)],
    opts: [
      () => [stop(), work(['CAPTAIN'], 'helm', 'Duvarın dönüşünü sayıyor', 4, 1), S('opts', { id: 'enc', opts: { r: 150, gap: -Math.PI / 2 } }), go(20), T(1.2)],
      (c, info) => [par(go(90), sfx('depart')), ...(info.success ? [par(fx('splash', { rail: 0, dy: -c.len / 2 }, 40), sfx('splash'), S('opts', { id: 'enc', opts: { r: 150, gap: -Math.PI / 2 } }))] : [par(S('heel', { rot: 0.2 }), S('shake', { amount: 16 }), fx('splash', 'ship', 70), sfx('impact')), S('heel', { rot: 0 })])],
      (c, info) => [par(work(['CREW_SURGE', 'CREW_COMPASS'], 'bow', 'Duvarın en ince yerini okuyor', 4, 1), only('CREW_SURGE', 'Şurası! İskeleye tam dümen!', { dur: 2 })), par(S('heel', { rot: -0.12 }), S('shipTo', { x: -40 }), S('opts', { id: 'enc', opts: { r: 150, gap: Math.PI } })), go(30), ...(info.success ? [] : [S('shake', { amount: 8 })]), S('heel', { rot: 0 })],
      () => [par(work(['CAPTAIN'], 'helm', 'Ters akıntı noktasını hedefliyor', 3, 0.6), S('opts', { id: 'enc', opts: { r: 150, gap: 0 } })), par(S('shipTo', { x: 50 }), S('heel', { rot: 0.1 }), go(30)), T(1), S('heel', { rot: 0 })],
    ],
    exit: () => [move('enc', { alpha: 0 }, 1.6), remove('enc'), weather({ restore: true })],
  })),

  EVT_X2_DIS03: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', dark: 0.08 })],
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 3, { x: side * 200, y: -300, rot: Math.PI * 0.7, scale: 0.8, damage: 'sinking', crewNpc: ['sailor', 'merchant'] }), shipEntity(c, 'cv1', 'merchant', 2, { x: -side * 200, y: -360, rot: Math.PI * 1.2, scale: 0.7 }), shipEntity(c, 'cv2', 'guild', 2, { x: 0, y: -440, rot: Math.PI, scale: 0.7 })],
    approach: (c) => [par(move('enc', { y: -60 }, 3.6), move('cv1', { y: -120, x: -side * 230 }, 3.6, { wait: false }), move('cv2', { y: -260, x: side * 40 }, 3.6, { wait: false }), slow(5), cam({ x: side * 40, y: -80 }, 0.3, 0.92)), par(S('heel', { rot: 0 }), react('disaster', side)), ...[0, 1, 2].map((i) => S('throw', { from: 'enc', to: { x: side * (140 + i * 20), y: -10 + i * 20 }, kind: 'crate', good: 'GOOD_SILK', arc: 14, burst: 'splash' })), say('enc', 'İmdat! Gemi yan yatıyor!', 2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [gather(rail(side), 'Sandalı indiriyor', { n: 2, run: true, dur: 3 }), spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16), y: 0, opts: { npcs: ['sailor', 'sailor'], dir: 'up' } }), move('boat', { x: side * 160, y: -50 }, 2.2), T(0.6), S('opts', { id: 'boat', opts: { npcs: ['sailor', 'sailor', 'merchant', 'villager'], dir: 'down' } }), move('boat', { x: besides(c, 16), y: 0 }, 2.2), remove('boat'), board('sv1', 'merchant', rail(side), 'center', { endState: 'sit', wait: false }), board('sv2', 'villager', rail(side), 'center', { dx: 10, endState: 'sit' }), ...(info.text?.includes('darbe') ? [par(S('shake', { amount: 10 }), fx('splinter', { rail: side }, 22), sfx('impact'))] : [sfx('cheer')])],
      (c, info) => [work([], rail(side), 'Kancalarla sandık topluyor', 4, 1), ...(info.success ? [spawn({ id: 'c1', kind: 'crate', x: side * 140, y: -10 }), S('pickup', { id: 'c1', prefer: [], task: 'Sandığı çekiyor' }), spawn({ id: 'c2', kind: 'crate', x: side * 150, y: 20 }), S('pickup', { id: 'c2', prefer: [], task: 'Sandığı çekiyor' })] : [move('enc', { x: alongside(c, 0.8, 3, 4) }, 1.4), par(S('shake', { amount: 12 }), fx('splinter', { rail: side }, 28), sfx('impact'))])],
      () => [par(go(40), S('shipTo', { x: -side * 40 }))],
    ],
    skip: () => ['gained'],
    exit: (c) => [offAll('cargo'), par(move('enc', { y: 360, alpha: 0.5 }, 3), move('cv1', { y: 360 }, 3, { wait: false }), move('cv2', { y: 360 }, 3, { wait: false })), remove('enc'), remove('cv1'), remove('cv2'), weather({ restore: true })],
  })),

  // ═══════════ MÜRETTEBAT ═══════════
  EVT_X2_CREW01: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 2, { x: side * 240, y: -320, rot: Math.PI * 0.85, scale: 0.75 }), spawn({ id: 'flg', kind: 'bidFlag', x: side * 246, y: -340, layer: 2, opts: { col: '#c8423b' } })],
    approach: (c) => [par(move('enc', { y: -120, x: side * 190 }, 3.2), move('flg', { y: -140, x: side * 196 }, 3.2, { wait: false }), slow(6), cam({ x: side * 70, y: -60 }, 0.3)), par(work(['CREW_YARA'], 'mast', 'Gözcü direğinden bakıyor', 6, 1), only('CREW_YARA', 'Tehlike bayrağı ters çekilmiş!', { dur: 2.2 }))],
    intro: () => [T(0.3)],
    opts: [
      (c) => [par(work(['CREW_YARA'], 'mast', 'Sinyal bayraklarını çekiyor', 4, 0.6), signalFlags('mast', ['#e0c040', '#3b6ea5', '#e0c040'])), T(0.8), par(S('opts', { id: 'flg', opts: { col: '#3b6ea5' } }), sfx('flag')), say('enc', 'Dümenimiz arızalı! Teşekkürler!', 2.2, 0.4), transferDocuments('enc', 'ship')],
      (c, info) => [...approachShip(c, 'enc', 2, 0.75), ...(info.success ? [say('enc', 'Sağ olun! Al şu keseyi.', 2, 0.4), S('coins', { from: 'enc', to: 'ship', n: 6 })] : [S('fire', { from: 'enc', to: 'ship', n: 2, hit: true }), crewSay(['CREW_YARA'], 'Tuzakmış!', { dur: 1.4 })])],
      () => [par(go(30), S('shipTo', { x: -side * 40 }))],
    ],
    exit: (c) => [remove('flags'), par(move('enc', { y: -440 }, 3), move('flg', { alpha: 0 }, 1)), remove('enc'), remove('flg'), go(30)],
  })),

  EVT_X2_CREW02: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 1, { x: side * 230, y: -300, rot: Math.PI * 0.9, scale: 0.7, crewNpc: ['sailor', 'sailor'] })],
    approach: (c) => [par(slow(5), cam({ x: side * 40, y: 0 }, 0.3, 1.06)), ...approachShip(c, 'enc', 1, 0.7), par(deckProp('pot', 'cauldron', 'galley'), work(['CREW_PITA'], 'galley', 'Kazanı ocağa koyuyor', 4)), par(fx('smoke', 'galley', 20), sfx('damage')), only('CREW_PITA', 'Ocak söndü! Tam da şimdi!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      () => [S('coins', { from: 'ship', to: 'galley', n: 3 }), work(['CREW_GROOT', 'CREW_PITA'], 'galley', 'Ocağı onarıyor', 4, 0.8), par(fx('fire', 'galley', 10), sfx('repair')), board('nb', 'sailor', rail(side), 'galley', { say: 'Kokusu buraya geliyor!' }), unboard('nb', rail(side), { carry: 'GOOD_FISH' })],
      (c, info) => [work(['CREW_PITA'], 'galley', 'Ateşsiz tarif hazırlıyor', 5, 1), ...(info.success ? [board('nb', 'sailor', rail(side), 'galley', { say: 'Ateşsiz bu kadar lezzet mi?!' }), unboard('nb', rail(side), { carry: 'GOOD_FISH' }), sfx('cheer')] : [only('CREW_PITA', 'Hmm… biraz sulu oldu.', { dur: 1.8 })])],
      () => [only('CREW_PITA', 'Başka zaman…', { dur: 1.6 })],
    ],
    exit: (c) => [remove('pot'), offAll(rail(side)), sailAwayUp(c), remove('enc')],
  })),

  EVT_X2_CREW03: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'wreck', x: side * 40, y: -300, opts: { w: 110, h: 60, n: 6 } })],
    approach: (c) => [par(move('enc', { y: -20 }, 3.6), slow(4), cam({ x: side * 30, y: -10 }, 0.3, 1.04)), stop(), only('CREW_MIRA', 'Bu benim eski dalış başlığımın parçası!', { dur: 2.4 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => dive(c, side, ['CREW_MIRA'], 'Enkaza dalıyor', info.success ? [spawn({ id: 'box', kind: 'chest', x: besides(c, 20), y: 0 }), S('pickup', { id: 'box', prefer: ['CREW_MIRA'], task: 'Parçayı ve kutuyu çıkarıyor' }), deckProp('helmet', 'glowRing', 'center', { opts: { col: '#c8a040' } })] : [par(S('shake', { amount: 6 }), sfx('creak'), only('CREW_MIRA', 'Enkaz kaydı, halat koptu!', { dur: 1.8 }))]),
      () => [S('coins', { from: 'ship', to: 'center', n: 4 }), par(work(['CREW_GROOT', 'CREW_MIRA'], 'center', 'Başlığı yeniden yapıyor', 5, 1), deckProp('helmet', 'glowRing', 'center', { opts: { col: '#c8a040' } })), ...[0, 1].map(() => [sfx('repair'), fx('spark', 'ship', 8), T(0.5)])],
      () => [only('CREW_MIRA', 'Hoşça kal, eski dost.', { dur: 1.8 }), go(24)],
    ],
    exit: () => [remove('helmet'), remove('box'), ...driftAll()],
  })),

  EVT_X2_CREW04: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'guild', 2, { x: side * 230, y: -300, rot: Math.PI * 0.9, scale: 0.75, crewNpc: ['pirateCaptain'] })],
    approach: (c) => [par(slow(5), cam({ x: side * 30, y: 0 }, 0.3, 1.06)), ...approachShip(c, 'enc', 2, 0.75), boardViaPlank(side), board('rv', 'pirateCaptain', rail(side), 'center', { dx: side * 10, say: 'Diego! Eski hesap!', endState: 'sit' }), deckProp('tbl', 'strategyTable', 'center')],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(work(['CREW_DIEGO'], 'center', 'Taşları yerleştiriyor', 5, 1), only('CREW_DIEGO', 'Üç hamlede bitiririm.', { dur: 2 })), T(1), ...(info.success ? [S('say', { actor: 'rv', text: 'Yine mi sen?! Al keseyi.', dur: 2, hold: 0.4 }), S('coins', { from: 'rv', to: 'ship', n: 10 })] : [S('say', { actor: 'rv', text: 'Ha! Bu sefer ben!', dur: 1.8, hold: 0.4 }), only('CREW_DIEGO', 'Rövanşı unutmam.', { dur: 1.6 })])],
      (c, info) => [work(['CAPTAIN'], 'center', 'Strateji masasını yönetiyor', 5, 1), T(1), ...(info.success ? [S('coins', { from: 'rv', to: 'ship', n: 10 }), sfx('cheer')] : [S('say', { actor: 'rv', text: 'Tuzağa düştün, kaptan!', dur: 1.8, hold: 0.4 })])],
      () => [par(work(['CREW_DIEGO'], 'center', 'Eski rakibiyle el sıkışıyor', 3, 1), S('say', { actor: 'rv', text: 'Beraberlik. Bu da güzel.', dur: 2, hold: 0.4 }))],
    ],
    skip: () => ['gold'],
    exit: (c) => [remove('tbl'), unboard('rv', rail(side)), dropPlank(), offAll(rail(side)), say('enc', 'Selam olsun!', 1.6, 0.2), sailAwayUp(c), remove('enc')],
  })),

  EVT_X2_CREW05: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 2, { x: side * 230, y: -300, rot: Math.PI * 0.9, scale: 0.75, crewNpc: ['sailor'] })],
    approach: (c) => [par(slow(5), cam({ x: side * 30, y: 0 }, 0.3, 1.06)), ...approachShip(c, 'enc', 2, 0.75), boardViaPlank(side), board('sick', 'sick', rail(side), 'center', { endState: 'sit', say: 'Ateşler içindeyim…' })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [...medicalHelp(['CREW_MAGDA']), only('CREW_MAGDA', 'Bu otlar ateşi söndürür.', { dur: 2 }), ...(info.success ? [S('say', { actor: 'sick', text: 'Ateşim… düştü!', dur: 2, hold: 0.4 }), S('coins', { from: 'enc', to: 'ship', n: 8 })] : [only('CREW_MAGDA', 'Gemisinde dinlenmeli.', { dur: 1.6 })])],
      () => [deckProp('herbs', 'herbBowl', 'center', { dx: 8 }), par(work(['CREW_MAGDA'], 'center', 'Ateşi indiriyor', 5, 1), work(['CREW_VARGAS'], 'center', 'Yarayı temizliyor', 5, 1)), crewSay(['CREW_VARGAS'], 'Sargıyı ben tutarım, Magda.', { dur: 2 }), S('say', { actor: 'sick', text: 'Ayağa kalkabiliyorum!', dur: 2, hold: 0.4 }), S('coins', { from: 'enc', to: 'ship', n: 5 })],
      () => [cap('Üzgünüm, yardım edemeyiz.', 1.8, 0.4)],
    ],
    skip: () => ['gold'],
    exit: (c) => [remove('herbs'), unboard('sick', rail(side)), dropPlank(), offAll(rail(side)), sailAwayUp(c), remove('enc')],
  })),

  // ═══════════ HAYVANLAR + TAMİR ═══════════
  EVT_X2_PET01: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: (c) => [par(slow(12), cam({ x: 0, y: 0 }, 0.3, 1.1)), spawn({ id: 'gull', kind: 'gull', x: side * 80, y: -140, layer: 3 }), move('gull', { x: side * (c.beam / 2 - 8), y: -8 }, 1.6), remove('gull'), deckProp('tg', 'tangledGull', rail(side), { dx: -side * 6 }), pet('PET_TARCIN', { at: rail(side), pose: 'bark', dur: 4, say: 'Hav! Hav!', sfx: 'bark', task: 'Martıyı gösteriyor' })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work(['CAPTAIN'], rail(side), 'İpi dikkatle çözüyor', 4, 1), S('opts', { id: 'tg', opts: { free: true } }), T(0.4), remove('tg'), spawn({ id: 'gull', kind: 'gull', x: side * (c.beam / 2 - 8), y: -8, layer: 3 }), birdTakeoff('gull'), pet('PET_TARCIN', { pose: 'wag', dur: 5 }), ...(info.text?.includes('balık sürüsü') ? [spawn({ id: 'fs', kind: 'fishSchool', x: -side * 60, y: -c.len / 2 - 60, opts: { n: 14 } }), crewSay([], 'Martı bize yol gösteriyor!', { dur: 2 })] : [])],
      (c) => [gather(rail(side), 'Martıyı sarıyor', { n: 2, dur: 3 }), remove('tg'), spawn({ id: 'gull', kind: 'gull', x: side * (c.beam / 2 - 8), y: -8, layer: 3 }), birdTakeoff('gull'), pet('PET_TARCIN', { pose: 'sit', dur: 4 })],
      (c) => [T(1.4), remove('tg'), spawn({ id: 'gull', kind: 'gull', x: side * (c.beam / 2 - 8), y: -8, layer: 3 }), birdTakeoff('gull'), pet('PET_TARCIN', { pose: 'sit', dur: 4, say: 'Hıh.' })],
    ],
    exit: () => [remove('tg'), remove('gull'), remove('fs'), go(30)],
  })),

  EVT_X2_PET02: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 24), y: -240, opts: { npcs: ['sailor'], dir: 'up' } })],
    approach: (c) => [par(move('enc', { y: -6 }, 3), slow(6), cam({ x: side * 20, y: 0 }, 0.3, 1.08)), S('throw', { from: 'enc', to: { rail: side }, kind: 'bottle', arc: 14 }), deckProp('pk', 'parcel', rail(side), { dx: -side * 8 }), move('enc', { y: 200 }, 2), pet('PET_ZIPIR', { at: rail(side), dx: -side * 8, pose: 'sit', dur: 2, task: 'Paketi kaptı' }), remove('pk'), pet('PET_ZIPIR', { at: 'cargo', pose: 'sit', dur: 10, run: false, task: 'Paketin üstüne oturdu' }), deckProp('pk2', 'parcel', 'cargo', { dx: 6 }), gather('cargo', 'Zıpır\'ın yanına koşuyor', { n: 3, run: true, dur: 6 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work(['CAPTAIN'], 'cargo', 'Paketi açıyor', 3, 1), S('opts', { id: 'pk2', opts: { open: true } }), ...(info.text?.includes('mürekkep') ? [par(deckProp('ink', 'inkCloud', 'cargo', { opts: { r: 8 } }), pet('PET_ZIPIR', { pose: 'sit', dur: 3, say: 'Hapşu!' }))] : [S('icon', { icon: 'scroll', from: 'cargo', to: 'ship' }), sfx('page')])],
      (c) => [move('enc', { y: -6 }, 2), work(['CAPTAIN'], rail(side), 'Paketi haberciye uzatıyor', 3, 0.6), remove('pk2'), S('icon', { icon: 'gift', from: 'ship', to: 'enc' }), say('enc', 'Çok teşekkürler kaptan!', 1.8, 0.4)],
      () => [work(['CAPTAIN'], 'cargo', 'Mührü büyüteçle inceliyor', 4, 1), deckProp('seal', 'glowRing', 'cargo', { opts: { col: '#e0c040' } }), cap('Sarı şeritli siyah… eski bir filonun mührü.', 2.4, 0.4), remove('seal')],
    ],
    exit: () => [remove('pk2'), remove('ink'), remove('seal'), move('enc', { y: 280 }, 2), remove('enc'), go(30)],
  })),

  EVT_X2_REPAIR01: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.12 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'buoyLight', x: side * (c.beam / 2 + 80), y: -280 }), shipEntity(c, 'far', 'merchant', 1, { x: -side * 260, y: -420, scale: 0.55, rot: Math.PI })],
    approach: (c) => [par(move('enc', { y: -40 }, 3.4), slow(5), cam({ x: side * 50, y: -20 }, 0.3)), lookout('Şamandıranın ışığı sönmüş!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 3 }), ...landing(c, side, ['sailor', 'sailor'], [...[0, 1].map(() => [sfx('repair'), fx('spark', 'enc', 8), T(0.5)]), par(S('flash', {}), sfx('magic'), fx('spark', 'enc', 16))], [], 80), move('far', { y: -220 }, 2), par(S('flash', {}), sfx('horn'), say('far', 'Işık için teşekkürler!', 2, 0.4))],
      (c) => [par(work(['CREW_GROOT'], rail(side), 'Şamandıraya tırmanıyor', 4, 1), only('CREW_GROOT', 'Işık, denizin dostudur.', { dur: 2.2 })), ...[0, 1, 2].map(() => [sfx('repair'), fx('spark', 'enc', 10), T(0.4)]), par(S('flash', {}), sfx('magic')), move('far', { y: -220 }, 2), say('far', 'Teşekkürler!', 1.6, 0.4)],
      () => [go(26)],
    ],
    exit: () => [remove('far'), ...driftAll(), weather({ restore: true })],
  })),
};

// ═══════════ ZİNCİRLER: YARA ═══════════
const yaraShip = (c, y = -340) => shipEntity(c, 'enc', 'varo', 3, { x: c.side * 240, y, rot: Math.PI * 0.9, scale: 0.85, crewNpc: ['pirateCaptain', 'soldier'] });
const closeYara = (c, side) => [cap('Yara olmadan bu hikâye yarım kalacak.', 2.2, 0.6), go(24)];
Object.assign(X2_SCENES, {
  CH_X2_YARA_1: def((ev, side) => ({
    weather: () => [weather({ fog: 1, dark: 0.08 })],
    setup: (c) => [yaraShip(c), spawn({ id: 'flg', kind: 'bidFlag', x: side * 246, y: -360, layer: 2, opts: { col: '#e0c040' } })],
    approach: (c) => [par(move('enc', { y: -140, x: side * 200 }, 3.6), move('flg', { y: -160, x: side * 206 }, 3.6, { wait: false }), slow(6), cam({ x: side * 60, y: -60 }, 0.3)), par(work(['CREW_YARA'], 'mast', 'Dürbünle bayrağı tanıyor', 6, 1), only('CREW_YARA', 'Benim eski filomun bayrağı…', { dur: 2.2 }))],
    intro: () => [T(0.3)],
    opts: [
      () => [par(escortParallel('enc', 0 + side * 200, -60, 3), go(40)), only('CREW_YARA', 'Arkasından ayrılmayın.', { dur: 1.8 })],
      (c, info) => [work(['CAPTAIN', 'CREW_YARA'], 'mast', 'Bayrak dizisini kopyalıyor', 4, 1), ...(info.success ? [signalFlags('mast', ['#e0c040', '#1a1a1a', '#e0c040']), only('CREW_YARA', 'Bir buluşma işareti!', { dur: 1.8 })] : [move('enc', { y: -440 }, 2.4)])],
      (c, info) => [par(go(70), S('shipTo', { x: side * 30 })), move('enc', { y: -c.len / 2 - 90, x: side * 40 }, 2), ...(info.success ? [S('throw', { from: 'enc', to: 'ship', kind: 'bottle', arc: 18 }), transferDocuments('enc', 'ship')] : [S('fire', { from: 'enc', to: 'ship', n: 2, hit: true })])],
      (c) => closeYara(c, side),
    ],
    exit: (c) => [remove('flags'), par(move('enc', { y: -460 }, 3), move('flg', { alpha: 0 }, 1)), remove('enc'), remove('flg'), weather({ restore: true }), go(30)],
  })),
  CH_X2_YARA_2: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'ghost', 2, { x: side * (c.beam / 2 + 110), y: -300, rot: Math.PI * 0.6, scale: 0.75, damage: 'critical', crewNpc: [] })],
    approach: (c) => [par(move('enc', { y: -50 }, 3.6), slow(4), cam({ x: side * 60, y: -30 }, 0.3)), stop()],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => landing(c, side, ['sailor'], [work(['CREW_YARA'], rail(side), 'Kamaraya süzülüyor', 3, 0.6), ...(info.success ? [S('icon', { icon: 'book', from: 'enc', to: 'boat' }), only('CREW_YARA', 'VARO… her sayfada.', { dur: 2 })] : [par(S('flash', {}), sfx('horn')), crewSay([], 'Fener! Saklanın!', { dur: 1.6 })])], [], 110),
      (c) => [spawn({ id: 'old', kind: 'rowboat', x: besides(c, 20), y: -200, opts: { npcs: ['oldSailor'], dir: 'up' } }), move('old', { y: -6 }, 2.2), S('coins', { from: 'ship', to: 'old', n: 5 }), S('icon', { icon: 'book', from: 'old', to: 'ship' }), move('old', { y: 240 }, 2)],
      (c, info) => [board('wit', 'oldSailor', rail(side), 'center', { endState: 'sit' }), work(['CAPTAIN'], 'center', 'Denizciyi sorguluyor', 4, 1), info.success ? S('say', { actor: 'wit', text: 'Varo filoyu batırdı, suçu başkasına attı!', dur: 2.6, hold: 0.4 }) : S('say', { actor: 'wit', text: '…', dur: 1.4, hold: 0.4 }), unboard('wit', rail(side))],
      (c) => closeYara(c, side),
    ],
    exit: () => [remove('old'), ...driftAll()],
  })),
  CH_X2_YARA_3: def((ev, side) => ({
    setup: (c) => [yaraShip(c, -320), spawn({ id: 'raft', kind: 'raft', x: -side * 140, y: -260, opts: { npcs: ['castaway', 'castaway'] } })],
    approach: (c) => [par(move('enc', { x: side * 190, y: -100 }, 3.4), move('raft', { y: -30 }, 3.4, { wait: false }), slow(5), cam({ x: 0, y: -40 }, 0.3, 0.92)), crewSay(['CREW_YARA'], 'Varo bir yanda, kazazedeler öbür yanda.', { dur: 2.4 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [move('raft', { x: -(c.beam / 2 + 30), y: 0 }, 2), board('cw1', 'castaway', rail(-side), 'center', { endState: 'sit', wait: false }), board('cw2', 'castaway', rail(-side), 'center', { dx: 10, endState: 'sit' }), ...(info.text?.includes('Pita') ? [par(deckProp('pot', 'cauldron', 'galley'), work(['CREW_PITA'], 'galley', 'Kazazedelere çorba dağıtıyor', 4))] : []), S('say', { actor: 'cw1', text: 'Varo bizi ölüme terk etti!', dur: 2.2, hold: 0.4 })],
      (c, info) => [...approachShip(c, 'enc', 3, 0.85, 20), ...(info.success ? [work(['CREW_YARA'], rail(side), 'Belge çantasını kapıyor', 2, 0.6), transferDocuments('enc', 'ship')] : [S('fire', { from: 'enc', to: 'ship', n: 3, hit: true })])],
      () => [par(work(['CREW_YARA'], 'mast', 'Eski filonun gizli işaretini çekiyor', 4, 0.6), signalFlags('mast', ['#1a1a1a', '#e0c040', '#1a1a1a'])), spawn({ id: 'msg', kind: 'rowboat', x: side * 150, y: -60, opts: { npcs: ['soldier'], dir: 'left' } }), move('msg', { x: besides(c0(), 16), y: 0 }, 2), transferDocuments('msg', 'ship'), move('msg', { x: side * 200, y: -100 }, 2)],
      (c) => closeYara(c, side),
    ],
    exit: (c) => [remove('flags'), remove('pot'), remove('msg'), offAll('cargo'), par(move('enc', { y: -440 }, 3), move('raft', { y: 300 }, 3, { wait: false })), remove('enc'), remove('raft'), go(30)],
  })),
  CH_X2_YARA_4: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk' })],
    setup: (c) => [yaraShip(c)],
    approach: (c) => [par(move('enc', { x: side * 190, y: -110 }, 3.2), slow(5), cam({ x: side * 70, y: -60 }, 0.32), sfx('horn')), ...approachShip(c, 'enc', 3, 0.85, 40), par(work(['CREW_YARA'], rail(side), 'Yayını geriyor', 6), react('danger', side))],
    intro: () => [say('enc', 'Eski bayrak senin olsun mu istiyorsun, kız?', 2.4, 0.6)],
    opts: [
      (c, info) => [S('throw', { from: { rail: side }, to: 'enc', kind: 'arrow', arc: 4, dur: 0.5, burst: 'spark' }), S('fire', { from: 'ship', to: 'enc', n: 3, hit: info.success }), ...(info.success ? [par(S('set', { id: 'enc', props: { sails: 'furled', damage: 'critical' } }), fx('splinter', 'enc', 40), sfx('creak')), say('enc', 'Teslim… oluyorum.', 2, 0.6), S('chest', { from: 'enc', to: 'ship' })] : [S('fire', { from: 'enc', to: 'ship', n: 3, hit: true }), move('enc', { y: -420 }, 3)])],
      () => [par(work(['CREW_YARA'], rail(side), 'Yayını indiriyor', 3, 1), only('CREW_YARA', 'Artık o bayrağı taşımıyorum.', { dur: 2.2 })), par(S('set', { id: 'enc', props: { sails: 'furled' } }), sfx('flag')), say('enc', 'Bayrağımı indiriyorum.', 2, 0.4), par(move('enc', { y: -440, x: side * 260 }, 3), S('shipTo', { x: -side * 30 }))],
      (c) => [shipEntity(c, 'crown', 'warship', 4, { x: -side * 260, y: -320, scale: 0.85, crewNpc: ['officer', 'soldier'] }), par(move('crown', { x: -side * 170, y: -60 }, 2.6), sfx('horn')), transferDocuments('ship', 'crown'), say('crown', 'Varo, kraliyet adına tutuklusun!', 2.4, 0.6), par(move('enc', { x: -side * 120, y: -200 }, 2.4), sfx('cheer')), only('CREW_YARA', 'Kaptanımın adı temizlendi.', { dur: 2.2 })],
      (c) => closeYara(c, side),
    ],
    skip: () => ['gold', 'items'],
    from: () => 'enc',
    exit: (c) => [offAll(), par(move('enc', { y: -460 }, 3), move('crown', { y: -460 }, 3, { wait: false })), remove('enc'), remove('crown'), weather({ restore: true }), go(30)],
  })),
});
function c0() { return { side: 1, beam: 74 }; }

// ═══════════ ZİNCİRLER: PITA ═══════════
Object.assign(X2_SCENES, {
  CH_X2_PITA_1: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'kitchen', 2, { x: side * 240, y: -320, rot: Math.PI * 0.9, scale: 0.8, damage: 'damaged', crewNpc: ['sick', 'sailor'] })],
    approach: (c) => [par(slow(5), cam({ x: side * 50, y: -20 }, 0.3)), ...approachShip(c, 'enc', 2, 0.8), boardViaPlank(side), only('CREW_PITA', 'Bu bayrak… eski mutfak gemimiz!', { dur: 2.4 }), par(board('h1', 'sick', rail(side), 'center', { endState: 'sit', wait: false }), board('h2', 'sailor', rail(side), 'center', { dx: 10, endState: 'sit' }))],
    intro: () => [T(0.3)],
    opts: [
      () => [S('cargoUse', { goods: [], at: 'galley' }), ...[cookingSmoke('galley'), work(['CREW_PITA'], 'galley', 'Erzaktan yemek yapıyor', 6, 1)], ...crewEatTogether(), S('say', { actor: 'h1', text: 'Yıllardır böyle yemek yemedik…', dur: 2.2, hold: 0.4 })],
      () => [spawn({ id: 'fb', kind: 'rowboat', x: -side * 140, y: -100, opts: { npcs: ['villager'], dir: 'right', cargo: ['GOOD_FISH'] } }), move('fb', { x: -(74 / 2 + 30), y: 0 }, 2), S('coins', { from: 'ship', to: 'fb', n: 4 }), S('throw', { from: 'fb', to: 'ship', kind: 'crate', good: 'GOOD_FISH', arc: 16 }), move('fb', { y: 240 }, 2), cookingSmoke('galley'), work(['CREW_PITA'], 'galley', 'Yemeği yetiştiriyor', 4)],
      (c, info) => [cookingSmoke('galley'), work(['CREW_PITA'], 'galley', 'Kalan malzemeyle mucize çorba', 5, 1), info.success ? par(sfx('cheer'), S('say', { actor: 'h2', text: 'Bu çorba bir mucize!', dur: 2, hold: 0.4 })) : only('CREW_PITA', 'Biraz sulu oldu…', { dur: 1.6 })],
      () => [only('CREW_PITA', 'Peki, kaptan…', { dur: 1.6 }), par(unboard('h1', rail(side)), unboard('h2', rail(side), { wait: false }))],
      () => [cap('Pita olmadan bu hikâye yarım kalacak.', 2, 0.6)],
    ],
    skip: () => ['lost'],
    exit: (c) => [remove('pot'), remove('fb'), dropPlank(), offAll(rail(side)), sailAwayUp(c), remove('enc')],
  })),
  CH_X2_PITA_2: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'kitchen', 2, { x: side * (c.beam / 2 + 100), y: -300, rot: Math.PI * 0.4, scale: 0.8, damage: 'critical', sails: 'furled', crewNpc: [] })],
    approach: (c) => [par(move('enc', { y: -40 }, 3.6), slow(4), cam({ x: side * 60, y: -20 }, 0.3)), stop(), only('CREW_PITA', 'Kazanlar hâlâ yerinde…', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => landing(c, side, ['villager'], [work(['CREW_PITA'], rail(side), 'Defterleri açıyor', 3, 0.6), S('icon', { icon: 'book', from: 'enc', to: 'boat' }), sfx('page')], [], 100),
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 4 }), ...landing(c, side, ['sailor', 'villager'], [...[0, 1, 2].map(() => [sfx('repair'), fx('spark', 'enc', 10), T(0.4)]), fx('smoke', 'enc', 16)], [], 100)],
      (c) => landing(c, side, ['sailor', 'sailor'], [S('throw', { from: 'enc', to: 'boat', kind: 'crate', good: 'GOOD_GRAIN', arc: 12 })], [], 100),
      () => [cap('Pita olmadan bu hikâye yarım kalacak.', 2, 0.6)],
    ],
    exit: () => [...driftAll()],
  })),
  CH_X2_PITA_3: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk' })],
    setup: (c) => [shipEntity(c, 'enc', 'kitchen', 3, { x: side * 240, y: -320, rot: Math.PI * 0.9, scale: 0.85, crewNpc: ['villagerF', 'merchant', 'sailor'] })],
    approach: (c) => [par(slow(5), cam({ x: side * 50, y: -10 }, 0.3, 1.02)), ...approachShip(c, 'enc', 3, 0.85), boardViaPlank(side), fx('smoke', 'enc', 12), only('CREW_PITA', 'Kaptan, sofraya sen karar ver.', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      () => [S('cargoUse', { goods: [], at: 'galley' }), cookingSmoke('galley'), deckProp('tbl', 'mapTable', 'center'), par(board('c1', 'villagerF', rail(side), 'center', { dx: -8, endState: 'sit', wait: false }), board('c2', 'merchant', rail(side), 'center', { dx: 10, endState: 'sit' })), work(['CREW_PITA'], 'center', 'Herkese yemek dağıtıyor', 5, 1), pet('PET_TARCIN', { at: 'center', pose: 'beg', dur: 5 }), pet('PET_ZIPIR', { at: 'galley', pose: 'sit', dur: 5, run: false }), ...crewEatTogether(), sfx('cheer')],
      () => [S('coins', { from: 'ship', to: 'enc', n: 4 }), cookingSmoke('galley'), deckProp('tbl', 'mapTable', 'center'), par(board('c1', 'villagerF', rail(side), 'center', { dx: -8, endState: 'sit' })), work(['CREW_PITA'], 'center', 'Herkese yemek dağıtıyor', 5, 1), pet('PET_TARCIN', { at: 'center', pose: 'beg', dur: 5 }), ...crewEatTogether()],
      (c) => [...[0, 1, 2].map(() => [sfx('repair'), fx('spark', 'enc', 10), T(0.4)]), par(fx('smoke', 'enc', 24), S('set', { id: 'enc', props: { sails: 'full', damage: 'healthy' } }), sfx('horn')), say('enc', 'Gezgin aşevi yeniden denizde!', 2.2, 0.4), S('coins', { from: 'enc', to: 'ship', n: 10 })],
      () => [work(['CREW_PITA'], 'center', 'Kayıp tarif kitaplarını kurtarıyor', 4, 1), board('c2', 'merchant', rail(side), 'center', { say: 'Ustamızın kasası senin.' }), S('chest', { from: 'enc', to: 'ship' }), unboard('c2', rail(side))],
      () => [cap('Pita olmadan bu hikâye yarım kalacak.', 2, 0.6)],
    ],
    skip: () => ['lost', 'gold', 'items'],
    exit: (c) => [remove('tbl'), remove('pot'), dropPlank(), offAll(rail(side)), sailAwayUp(c), remove('enc'), weather({ restore: true })],
  })),
});

// ═══════════ ZİNCİRLER: MIRA ═══════════
Object.assign(X2_SCENES, {
  CH_X2_MIRA_1: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'coralLine', x: side * 30, y: -280, opts: { heal: 0 } })],
    approach: (c) => [par(move('enc', { y: -20 }, 3.6), slow(4), cam({ x: side * 20, y: -10 }, 0.3, 1.04)), stop(), only('CREW_MIRA', 'Canlı ve ölü mercan… bir çizgiyle ayrılmış.', { dur: 2.4 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => dive(c, side, ['CREW_MIRA'], 'Halatla resife dalıyor', [deckProp('map', 'mapTable', 'center'), sfx('page'), only('CREW_MIRA', 'Sınırı haritaladım.', { dur: 1.6 })]),
      (c, info) => [work([], rail(side), 'Ağla örnek topluyor', 3, 1), spawn({ id: 'net', kind: 'net', x: side * 40, y: -10, opts: { r: 10, fish: 0 } }), info.success ? S('pickup', { id: 'net', prefer: ['CREW_MIRA'], task: 'Mercan örneğini inceliyor' }) : par(remove('net'), crewSay([], 'Örnek ufalandı.', { dur: 1.4 }))],
      () => [work(['CAPTAIN'], rail(side), 'Resifin şeklini çiziyor', 4, 1), sfx('page')],
      () => [cap('Mira olmadan bu araştırma yarım kalacak.', 2, 0.6)],
    ],
    exit: () => [remove('map'), remove('net'), ...driftAll()],
  })),
  CH_X2_MIRA_2: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'cave', x: side * (c.beam / 2 + 100), y: -300, opts: { r: 50 } })],
    approach: (c) => [par(move('enc', { y: -40 }, 3.6), slow(4), cam({ x: side * 50, y: -20 }, 0.3)), stop()],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [call((d) => { const e = d.world.get('enc'); if (e) e.hooks = [{ x0: e.x, y0: e.y, x1: d.world.ship.x + c.side * 30, y1: d.world.ship.y }]; }), ...dive(c, side, ['CREW_MIRA'], 'Güvenlik halatıyla mağaraya dalıyor', info.success ? [par(S('flash', {}), fx('spark', 'enc', 14)), only('CREW_MIRA', 'Duvarlarda ölçümler var!', { dur: 1.8 })] : [par(S('shake', { amount: 8 }), sfx('creak')), gather(rail(side), 'Mira\'yı halatla geri çekiyor', { n: 4, run: true, dur: 4 }), fx('splinter', { rail: side }, 14)])],
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 3 }), deckProp('gear', 'lantern', rail(side)), ...dive(c, side, ['CREW_MIRA'], 'Yeni fenerle mağarayı haritalıyor', [par(S('flash', {}), fx('spark', 'enc', 14))])],
      () => [work(['CAPTAIN', 'CREW_MIRA'], rail(side), 'Girişi uzaktan inceliyor', 4, 1), sfx('page')],
      () => [work(['CAPTAIN'], rail(side), 'Yankı takımını indiriyor', 3, 1), spawn({ id: 'sr', kind: 'soundRings', x: side * (74 / 2 + 80), y: -40 }), T(1.6), remove('sr')],
      () => [cap('Mira olmadan bu araştırma yarım kalacak.', 2, 0.6)],
    ],
    exit: () => [call((d) => { const e = d.world.get('enc'); if (e) e.hooks = null; }), remove('gear'), remove('sr'), ...driftAll()],
  })),
  CH_X2_MIRA_3: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'mechanism', x: side * 40, y: -260 })],
    approach: (c) => [par(move('enc', { y: -20 }, 3.6), slow(4), cam({ x: side * 20, y: -10 }, 0.3, 1.04)), stop(), only('CREW_MIRA', 'Eski bir araştırma istasyonu… hâlâ çalışıyor.', { dur: 2.4 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => dive(c, side, ['CREW_MIRA'], 'Kayıt sandıklarını çıkarıyor', [spawn({ id: 'box', kind: 'chest', x: besides(c, 20), y: 0 }), S('pickup', { id: 'box', prefer: [], task: 'Kayıt sandığını çekiyor' })]),
      (c, info) => dive(c, side, ['CREW_MIRA'], 'Mekanizmayı durdurmaya çalışıyor', info.success ? [S('opts', { id: 'enc', opts: { slow: true } }), only('CREW_MIRA', 'Akım yavaşladı!', { dur: 1.6 })] : [par(S('shake', { amount: 12 }), fx('splash', 'ship', 40), sfx('impact'))]),
      (c) => dive(c, side, ['CREW_MIRA'], 'Parçaları inceliyor', [S('icon', { icon: 'gear', from: 'enc', to: 'ship' })]),
      () => [cap('Mira olmadan bu araştırma yarım kalacak.', 2, 0.6)],
    ],
    exit: () => [remove('box'), ...driftAll()],
  })),
  CH_X2_MIRA_4: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'reef', kind: 'coralLine', x: -side * 40, y: -300, opts: { heal: 0 } }), spawn({ id: 'enc', kind: 'mechanism', x: side * 40, y: -280 })],
    approach: (c) => [par(move('reef', { y: -40 }, 3.6), move('enc', { y: -20 }, 3.6, { wait: false }), slow(4), cam({ x: 0, y: -20 }, 0.3, 1)), stop(), only('CREW_MIRA', 'Kaptan… kararını ver.', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 4 }), ...dive(c, side, ['CREW_MIRA'], 'Mekanizmayı kapatıyor', [S('opts', { id: 'enc', opts: { closed: true } }), ...[0.3, 0.6, 1].map((h) => [S('opts', { id: 'reef', opts: { heal: h } }), T(0.4)]), spawn({ id: 'fs', kind: 'fishSchool', x: -side * 40, y: -40, opts: { n: 20 } }), sfx('magic')])],
      (c) => dive(c, side, ['CREW_MIRA'], 'Kapatma dizisini uyguluyor', [S('opts', { id: 'enc', opts: { closed: true } }), ...[0.3, 0.6, 1].map((h) => [S('opts', { id: 'reef', opts: { heal: h } }), T(0.4)]), spawn({ id: 'fs', kind: 'fishSchool', x: -side * 40, y: -40, opts: { n: 20 } }), sfx('magic')]),
      (c, info) => [...salvageWithCrane(c, 'enc', side), gather(rail(side), 'Vinç halatını çekiyor', { n: 4, run: true, dur: 4 }), ...(info.success ? [move('enc', { x: besides(c, 24), y: 0, alpha: 0.6 }, 2), remove('enc'), deckProp('dev', 'crate', 'cargo'), sfx('cheer')] : [ropeSnap('enc'), par(S('shake', { amount: 10 }), fx('splash', 'enc', 40), sfx('impact'))])],
      (c) => [...dive(c, side, ['CREW_MIRA'], 'Mekanizmayı ayarlıyor', [S('opts', { id: 'enc', opts: { slow: true } })]), spawn({ id: 'path', kind: 'reverseCurrent', x: 0, y: -60, layer: 1 }), par(go(40), sfx('magic')), only('CREW_MIRA', 'Yeni bir yol açıldı!', { dur: 1.8 })],
      () => [cap('Mira olmadan bu araştırma yarım kalacak.', 2, 0.6)],
    ],
    skip: () => ['gold', 'items'],
    exit: () => [remove('dev'), remove('path'), remove('fs'), ...driftAll()],
  })),
});

// ═══════════ ZİNCİRLER: ÜÇ KAPTANIN YARIŞI ═══════════
const raceSet = (c) => [shipEntity(c, 'li', 'liora', 2, { x: -c.beam / 2 - 70, y: 300, rot: 0, scale: 0.7, sails: 'full', crewNpc: ['captain'] }), shipEntity(c, 'enc', 'boran', 3, { x: c.beam / 2 + 76, y: 320, rot: 0, scale: 0.72, sails: 'full', crewNpc: ['pirateCaptain'] })];
Object.assign(X2_SCENES, {
  CH_X2_RACE_1: def((ev, side) => ({
    setup: (c) => [...raceSet(c), spawn({ id: 'b1', kind: 'raceBuoy', x: -40, y: -420, opts: { col: '#58d0c8' } }), spawn({ id: 'b2', kind: 'raceBuoy', x: 40, y: -420, opts: { col: '#8a1f2a' } })],
    approach: (c) => [par(escortParallel('li', -c.beam / 2 - 70, 0, 3), escortParallel('enc', c.beam / 2 + 76, 10, 3), slow(8), cam({ x: 0, y: -10 }, 0.3, 0.92)), say('li', 'Liora! Turkuaz yelkenin sahibi.', 2, 0.4), say('enc', 'Boran. Ağırım ama durdurulamam.', 2.2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c) => [par(S('flag', { up: true }), sfx('horn')), par(go(80), move('b1', { y: -c.len / 2 - 40 }, 3), move('b2', { y: -c.len / 2 - 40 }, 3, { wait: false }), overtakeShip('li', -c.beam / 2 - 70, -30), overtakeShip('enc', c.beam / 2 + 76, 20))],
      (c) => [spawn({ id: 'msg', kind: 'rowboat', x: besides(c, 16, 1), y: -160, opts: { npcs: ['sailor'], dir: 'up' } }), move('msg', { y: -6 }, 2), S('coins', { from: 'ship', to: 'msg', n: 3 }), transferDocuments('msg', 'ship'), move('msg', { y: 240 }, 2)],
      () => [gather('mast', 'Halatları yeniliyor', { n: 4, run: true, dur: 5 }), work(['CREW_GROOT'], 'mast', 'Yelkeni yokluyor', 4)],
      () => [par(work(['CREW_YARA'], 'mast', 'Rakip yelkenleri süzüyor', 4, 1), only('CREW_YARA', "Boran'ın dikişi zayıf, Liora rüzgâra karşı yavaş.", { dur: 2.6 }))],
      (c) => [par(say('li', 'Peki o zaman.', 1.6, 0.2), move('li', { y: -440 }, 3), move('enc', { y: -440 }, 3, { wait: false }))],
    ],
    exit: () => [S('flag', { up: false }), par(move('li', { y: -460 }, 3), move('enc', { y: -460 }, 3, { wait: false })), remove('li'), remove('enc'), remove('b1'), remove('b2'), remove('msg'), go(30)],
  })),
  CH_X2_RACE_2: def((ev, side) => ({
    setup: (c) => [...raceSet(c)],
    approach: (c) => [par(escortParallel('li', -c.beam / 2 - 70, -40, 3), escortParallel('enc', c.beam / 2 + 76, 30, 3), go(50), cam({ x: 0, y: -20 }, 0.3, 0.92)), par(move('li', { x: -200, y: -120 }, 2.4), move('enc', { x: 200, y: -60 }, 2.4, { wait: false })), crewSay([], 'Rüzgâr döndü!', { dur: 1.6 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(S('heel', { rot: -0.08 }), S('shipTo', { x: -30 }), go(60)), info.success ? par(move('li', { y: -10 }, 2), float('Liora\'nın arkasındayız!', '#9ae0a0')) : par(move('li', { y: -260 }, 2), move('enc', { y: -200 }, 2, { wait: false })), S('heel', { rot: 0 })],
      (c, info) => [par(S('heel', { rot: 0.12 }), S('shipTo', { x: 30 }), go(90), sfx('depart')), ...(info.success ? [par(move('li', { y: 120 }, 2), move('enc', { y: 160 }, 2, { wait: false })), float('İki rakip de geride!', '#ffd76a')] : [par(S('shake', { amount: 10 }), fx('splinter', 'ship', 20), sfx('creak'))]), S('heel', { rot: 0 })],
      () => [par(work(['CREW_COMPASS', 'CREW_SURGE'], 'helm', 'Akıntıyı okuyor', 4, 1), go(60)), par(move('li', { y: 40 }, 2), move('enc', { y: 60 }, 2, { wait: false }))],
      () => [work(['CAPTAIN'], 'bow', 'Rakiplerin hatalarını izliyor', 4), par(move('li', { y: -200 }, 2), move('enc', { y: -140 }, 2, { wait: false }))],
    ],
    exit: () => [S('heel', { rot: 0 }), par(move('li', { y: -460 }, 3), move('enc', { y: -460 }, 3, { wait: false })), remove('li'), remove('enc'), go(30)],
  })),
  CH_X2_RACE_3: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk' })],
    setup: (c) => [...raceSet(c), spawn({ id: 'fin', kind: 'raceBuoy', x: 0, y: -440, opts: { col: '#e0c040' } }), spawn({ id: 'rk1', kind: 'rocksOnly', x: -24, y: -480 }), spawn({ id: 'rk2', kind: 'rocksOnly', x: 52, y: -470 })],
    approach: (c) => [par(escortParallel('li', -c.beam / 2 - 70, -60, 3), escortParallel('enc', c.beam / 2 + 76, -10, 3), move('fin', { y: -c.len / 2 - 120 }, 3), move('rk1', { y: -c.len / 2 - 140 }, 3, { wait: false }), move('rk2', { y: -c.len / 2 - 130 }, 3, { wait: false }), go(50), cam({ x: 0, y: -60 }, 0.3, 0.92)), par(S('set', { id: 'enc', props: { sails: 'furled', damage: 'damaged' } }), sfx('creak'), say('enc', 'Yelkenim koptu!', 1.8, 0.4)), say('li', 'Görüşürüz şamandırada!', 1.8, 0.4)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(go(100), sfx('depart'), S('sails', { state: 'full' })), par(move('li', { y: info.success ? -c.len / 2 - 60 : -c.len / 2 - 160 }, 2.4), move('fin', { y: -c.len / 2 - 20 }, 2.4, { wait: false })), ...(info.success ? [par(S('flag', { up: true }), sfx('cheer'), float('Şampiyon!', '#ffd76a')), S('coins', { from: 'fin', to: 'ship', n: 14 })] : [say('li', 'Bir burun farkla!', 1.8, 0.4), S('coins', { from: 'li', to: 'ship', n: 4 })])],
      (c) => [stop(), work([], rail(1), 'Boran\'a halat atıyor', 3, 0.6), S('throw', { from: { rail: 1 }, to: 'enc', kind: 'rope', arc: 12 }), attachRope(1, 'enc'), ...[0, 1, 2].map(() => [sfx('repair'), fx('spark', 'enc', 10), T(0.4)]), par(S('set', { id: 'enc', props: { sails: 'full', damage: 'healthy' } }), ropeSnap('enc')), par(move('li', { y: -c.len / 2 - 200 }, 2.4)), say('li', 'Onurlu kaptan! Selam sana!', 2, 0.4), say('enc', 'Ödülü paylaşıyoruz, dostum.', 2, 0.4), S('coins', { from: 'enc', to: 'ship', n: 8 })],
      (c, info) => [par(S('heel', { rot: 0.08 }), S('shipTo', { x: 14 }), go(100), sfx('depart')), par(move('rk1', { y: 0 }, 1.6), move('rk2', { y: 10 }, 1.6, { wait: false })), ...(info.success ? [par(S('heel', { rot: 0 }), S('shipTo', { x: 0 })), par(move('li', { y: 60 }, 1.6), move('fin', { y: -c.len / 2 - 20 }, 1.6, { wait: false })), par(S('flag', { up: true }), sfx('cheer'), float('Kestirme işe yaradı!', '#ffd76a')), S('coins', { from: 'fin', to: 'ship', n: 16 })] : [par(S('shake', { amount: 16 }), fx('splinter', 'ship', 34), sfx('impact')), S('heel', { rot: 0 }), S('shipTo', { x: 0 })])],
    ],
    skip: () => ['gold'],
    exit: () => [S('flag', { up: false }), call((d) => { const e = d.world.get('enc'); if (e) e.hooks = null; }), par(move('li', { y: -460 }, 3), move('enc', { y: -460 }, 3, { wait: false })), remove('li'), remove('enc'), remove('fin'), remove('rk1'), remove('rk2'), weather({ restore: true }), go(30)],
  })),
});

// ═══════════ YANKILAR ═══════════
const echo = (style, line, npc = 'sailor') => def((ev, side) => ({
  setup: (c) => [shipEntity(c, 'enc', style, 2, { x: side * 240, y: -320, rot: Math.PI * 0.9, scale: 0.7, crewNpc: [npc] })],
  approach: (c) => [par(move('enc', { x: side * 180, y: -60 }, 3.4), slow(12), cam({ x: side * 50, y: -30 }, 0.3)), say('enc', line, 2.6, 0.6)],
  intro: () => [T(0.3)],
  opts: [() => [par(S('flag', { up: true }), sfx('flag'), work(['CAPTAIN'], rail(side), 'Selam veriyor', 3)), T(1), S('flag', { up: false })]],
  exit: (c) => [par(move('enc', { y: -440 }, 3), go(30)), remove('enc')],
}));
Object.assign(X2_SCENES, {
  EVT_X2_ECHO_YARA: echo('varo', 'Yara\'nın kaptanının adını temizleyen sen misin?', 'soldier'),
  EVT_X2_ECHO_PITA: echo('kitchen', 'Gezgin mutfaktan selam! Çorba ister misin?', 'villagerF'),
  EVT_X2_ECHO_MIRA: echo('guild', 'Sessiz Resif\'in hikâyesini anlatır mısın?', 'cartographer'),
  EVT_X2_ECHO_RACE: echo('liora', 'Bir dahaki yarışa hazır mısın?', 'captain'),
});
