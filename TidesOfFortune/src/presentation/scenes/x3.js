// GENİŞLEME PAKETİ 3 — EFSANEVİ DENİZLER VE RAKİP KAPTANLAR: 25 bağımsız olay, 15 zincir aşaması, 4 yankı,
// rakip takibi ve epilog için imza sahneleri.
// Akış: YAKLAŞMA → GİRİŞ → KARAR → EYLEM (seçeneğe özel) → BAŞARI/BAŞARISIZLIK GÖRÜNTÜSÜ → AYRILIŞ.
// Üç efsane (Sönmeyen Armada, Taş Yol, Uyuyan Ada) çok aşamalıdır; her seçeneğin fiziksel sonucu farklıdır.
import {
  S, par, wait, def, rail, shipEntity, alongside, besides, cap, crewSay, only, lookout, say, slow, stop, go, cam,
  react, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, weather, call, driftAll, offAll,
  landing, dive,
  INJ_HOOKS,
} from '../kit.js';
import { CAPTAINS } from '../../systems/X3System.js';
import * as X1 from '../../systems/X1System.js';

const T = (n) => wait(n);

// ───────── Paket 3 koreografi kütüphanesi ─────────
/** Rakip kaptan gemisi (stil + kaptan figürü) */
const capShip = (c, id, cap, o = {}) => shipEntity(c, id, CAPTAINS[cap].style, o.level || (cap === 'boran' ? 3 : 2), { x: o.x ?? c.side * 240, y: o.y ?? -320, rot: o.rot ?? Math.PI * 0.9, scale: o.scale || 0.78, sails: 'full', crewNpc: [cap, 'sailor'], ...o.extra });
const approachShip = (c, id, level = 2, scale = 0.8, gap = 18) => [move(id, { x: c.side * 190, y: -30, rot: 0, sails: 'furled' }, 2.2), move(id, { x: alongside(c, scale, level, gap), y: -6 }, 1.4)];
const sailAwayUp = (c, id = 'enc', dx = 200) => move(id, { y: -440, x: c.side * dx, sails: 'full' }, 3);
const sailAwayBack = (id = 'enc') => move(id, { y: 440, sails: 'full' }, 3);
const plank = (side, id = 'enc') => call((d) => { const e = d.world.get(id); const L = d.world.layout(); if (e) e.hooks = [{ x0: e.x - side * 16, y0: e.y, x1: d.world.ship.x + side * (L.beam / 2 - 6), y1: d.world.ship.y, plank: true }]; d.hooks.sfx?.('creak'); });
const rope = (id, toStern = false) => call((d) => { const e = d.world.get(id); const L = d.world.layout(); if (e) e.hooks = [{ x0: e.x, y0: e.y, x1: d.world.ship.x, y1: d.world.ship.y + (toStern ? L.len / 2 - 4 : 0) }]; d.hooks.sfx?.('hook'); });
const unhook = (id = 'enc') => call((d) => { const e = d.world.get(id); if (e) e.hooks = null; });
const snap = (id) => par(unhook(id), sfx('hook'), S('shake', { amount: 5 }));
const scrape = (side, n = 22) => par(S('shake', { amount: 10 }), fx('splinter', { rail: side }, n), sfx('impact'));
const pets = (tarcin, zipir) => [pet('PET_TARCIN', { at: 'bow', pose: 'wag', dur: 5, say: tarcin }), pet('PET_ZIPIR', { at: 'bow', dx: 10, pose: 'alert', dur: 5, say: zipir, run: false })];
const glowLight = (id, x, y, col = '#ffe080', r = 30) => spawn({ id, kind: 'sparkles', x, y, layer: 2, opts: { r, col } });
const swapCrew = (id, crewNpc) => S('set', { id, props: { crewNpc } });
const dS = (c) => (X1.endlessOn(c.run) ? X1.depthOf(c.run) : 0);

// Kaptan karşılaşmasının dostluk/işbirliği enjekte seçenekleri için kısa vuruş
const capBeat = (id, line) => [par(S('flag', { up: true }), sfx('flag')), say(id, line, 2.2, 0.6), S('flag', { up: false })];

export const X3_SCENES = {
  // ═══════════ TEHLİKE ═══════════
  EVT_X3_D01: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'pirate', 2, { x: side * 250, y: -330, rot: Math.PI, scale: 0.8 }), spawn({ id: 'sand', kind: 'rowboat', x: side * 250, y: -250, opts: { npcs: ['castaway', 'sailor'], dir: 'down' } })],
    approach: (c) => [par(slow(5), cam({ x: side * 50, y: -40 }, 0.6, 0.96), move('enc', { x: side * 210, y: -150 }, 2.6), move('sand', { x: side * 210, y: -70 }, 2.6, { wait: false })), rope('enc'), say('enc', 'Fidyesini ödeyen alır!', 2.2, 0.6), react('danger', side)],
    intro: () => [T(0.3)],
    opts: [
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 8 }), unhook('enc'), move('sand', { x: besides(c, 26, side), y: 0 }, 2), board('h1', 'castaway', rail(side), 'center', { say: 'Kurtulduk!' }), crewSay([], 'Hoş geldiniz.', { dur: 1.6 })],
      (c, info) => [par(go(14), S('shipTo', { x: side * 30 })), work(['CREW_BJORN', 'CAPTAIN'], rail(side), 'Halatı kesip atıyor', 3, 0.6), S('throw', { from: { rail: side }, to: 'sand', kind: 'rope', arc: 12 }), ...(info.success ? [unhook('enc'), rope('sand', true), move('sand', { x: 0, y: c.len / 2 + 34 }, 2.4), par(sfx('cheer'), float('Kurtarıldı!', '#9ae0a0'))] : [S('fire', { from: 'enc', to: 'ship', n: 2, hit: true }), unhook('enc'), move('sand', { x: besides(c, 24, side), y: 10 }, 2), fx('splash', { rail: side }, 18)])],
      (c) => [cap('Mesafeyi koruyun.', 1.8, 0.4), par(sailAwayUp(c, 'enc'), move('sand', { y: -440 }, 3, { wait: false }))],
    ],
    from: () => 'sand',
    exit: (c) => [unhook('enc'), unhook('sand'), offAll(), par(sailAwayUp(c, 'enc'), move('sand', { y: 440 }, 3, { wait: false })), remove('enc'), remove('sand'), go(30)],
  })),

  EVT_X3_D02: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'cannonRaft', x: side * 70, y: -320, opts: { lit: true } })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 50, x: side * 60 }, 3.4), slow(5), cam({ x: side * 30, y: -50 }, 0.6, 1.02)), lookout('Fitili yanan bir top salı!', { dur: 2 }), par(S('opts', { id: 'enc', opts: { lit: true, boom: true } }), sfx('cannon'), fx('splash', { x: -side * 40, y: -c.len / 2 - 10 }, 24)), S('opts', { id: 'enc', opts: { lit: true, boom: false } }), react('danger', side)],
    intro: () => [T(0.3)],
    opts: [
      (c) => [par(go(40), S('heel', { rot: -side * 0.1 }), S('shipTo', { x: -side * 50 })), par(S('opts', { id: 'enc', opts: { lit: true, boom: true } }), sfx('cannon'), fx('splash', { x: side * 10, y: -40 }, 24)), S('opts', { id: 'enc', opts: { lit: false } }), S('heel', { rot: 0 })],
      (c, info) => [stop(), spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor', 'sailor'], dir: 'up' } }), move('boat', { x: side * 60, y: -c.len / 2 - 30 }, 2.2), ...(info.success ? [par(S('opts', { id: 'enc', opts: { lit: false } }), fx('smoke', 'enc', 10), sfx('splash')), rope('enc', false), move('enc', { x: besides(c, 30, side), y: 10 }, 2.2), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_GOLD_BAR', arc: 16 })] : [par(S('opts', { id: 'enc', opts: { lit: true, boom: true } }), sfx('cannon')), scrape(side), S('opts', { id: 'enc', opts: { lit: false } })]), move('boat', { x: besides(c, 16, side), y: 0 }, 1.8), remove('boat'), unhook('enc')],
      (c, info) => [work(['CREW_LENA', 'CREW_BJORN'], rail(side), 'Topu sala çeviriyor', 3, 0.6), S('fire', { from: { rail: side }, to: 'enc', n: 1, hit: info.success }), ...(info.success ? [par(S('opts', { id: 'enc', opts: { lit: false, broken: true } }), fx('splinter', 'enc', 26), sfx('splash')), move('enc', { alpha: 0.2, y: -c.len / 2 - 80 }, 2)] : [par(S('opts', { id: 'enc', opts: { lit: true, boom: true } }), sfx('cannon')), scrape(side, 14), S('opts', { id: 'enc', opts: { lit: false } })])],
    ],
    skip: () => ['gold'],
    exit: () => [remove('boat'), unhook('enc'), ...driftAll()],
  })),

  EVT_X3_D03: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'heavyAnchor', x: side * 18, y: 120, opts: { chain: 7 } })],
    approach: (c) => [par(move('enc', { y: c.len / 2 + 22 }, 2.2), S('speed', { v: 22 }), cam({ x: 0, y: 60 }, 0.6, 1.02)), par(S('speed', { v: 0 }), S('heel', { rot: side * 0.08 }), S('shake', { amount: 9 }), sfx('creak')), rope('enc', true), react('danger', side), crewSay(['CREW_GROOT', 'CREW_BJORN'], 'Kıçtan bir şey bizi çekiyor!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(go(50), S('heel', { rot: -side * 0.14 }), S('shipTo', { x: -side * 30 })), ...(info.success ? [unhook('enc'), par(move('enc', { y: c.len / 2 + 70, alpha: 0 }, 1.6), fx('splash', { x: side * 18, y: c.len / 2 + 30 }, 24), sfx('splash'))] : [scrape(0, 24), unhook('enc'), move('enc', { y: c.len / 2 + 70, alpha: 0 }, 1.4)]), S('heel', { rot: 0 })],
      (c) => [gather('helm', 'Kıç halatlarını kesiyor', { n: 3, run: true, dur: 4 }), ...[0, 1].map(() => [par(sfx('hook'), fx('spark', { x: 0, y: c.len / 2 - 6 }, 8)), T(0.5)]), unhook('enc'), par(move('enc', { y: c.len / 2 + 70, alpha: 0 }, 1.6), sfx('splash')), S('heel', { rot: 0 })],
      (c, info) => [work([], 'helm', 'Palangayı kuruyor', 3, 0.6), gather('helm', 'Zinciri çekiyor', { n: 4, run: true, dur: 4 }), ...(info.success ? [unhook('enc'), S('pickup', { id: 'enc', prefer: ['CREW_GROOT', 'CREW_BJORN'], task: 'Çapayı güverteye yatırıyor' })] : [snap('enc'), scrape(0, 26), move('enc', { y: c.len / 2 + 70, alpha: 0 }, 1.2)]), S('heel', { rot: 0 })],
    ],
    exit: () => [unhook('enc'), remove('enc'), go(30)],
  })),

  EVT_X3_D04: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'warship', 3, { x: side * 240, y: -330, rot: Math.PI * 0.9, scale: 0.85 }), spawn({ id: 'smk', kind: 'smoke', x: side * 240, y: -380, layer: 2 })],
    approach: (c) => [par(slow(5), cam({ x: side * 40, y: -20 }, 0.3, 1)), par(...approachShip(c, 'enc', 3, 0.85, 20)), call((d) => { const e = d.world.get('smk'); const s = d.world.get('enc'); if (e && s) { e.x = s.x; e.y = s.y - 40; } }), par(sfx('horn'), say('enc', 'Ambar denetimi! Yelkenleri indir!', 2.4, 0.6)), react('danger', side)],
    intro: () => [T(0.3)],
    opts: [
      (c) => [stop(), plank(side), board('o1', 'officer', rail(side), 'cargo', { endState: 'work' }), board('s1', 'soldier', rail(side), 'cargo', { dx: 10, wait: false }), work(['CAPTAIN'], 'cargo', 'Denetimi izliyor', 4, 0.8), S('say', { actor: 'o1', text: 'Kurallar neyse o.', dur: 2, hold: 0.4 }), par(unboard('o1', rail(side)), unboard('s1', rail(side), { wait: false }))],
      () => [par(S('flag', { up: true, color: '#3b6ea5' }), sfx('flag')), work(['CAPTAIN'], rail(side), 'Mührü gösteriyor', 3, 0.8), say('enc', 'Tanınmış bir kaptan. Geçebilirsin.', 2.2, 0.6), S('flag', { up: false })],
      (c, info) => [par(go(70), sfx('depart'), S('heel', { rot: -side * 0.12 }), S('shipTo', { x: -side * 40 })), ...(info.success ? [par(fx('smoke', 'enc', 20), move('enc', { y: 200 }, 2.4))] : [S('fire', { from: 'enc', to: 'ship', n: 3, hit: true })]), S('heel', { rot: 0 })],
    ],
    exit: (c) => [unhook('enc'), offAll(rail(side)), par(sailAwayUp(c), move('smk', { alpha: 0 }, 2, { wait: false })), remove('enc'), remove('smk'), go(30)],
  })),

  EVT_X3_D05: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.08 })],
    setup: (c) => [spawn({ id: 'wr', kind: 'wreck', x: side * (c.beam / 2 + 70), y: -300, opts: { w: 90, h: 50, n: 5 } }), capShip(c, 'enc', 'neris', { x: side * (c.beam / 2 + 260), y: -300 }), ...(dS(c) >= 3 ? [capShip(c, 'li', 'liora', { x: side * 300, y: -420, scale: 0.6 })] : [])],
    approach: (c) => [par(slow(5), cam({ x: 0, y: -60 }, 0.6, 0.94), move('wr', { y: -50 }, 3), move('enc', { x: side * (c.beam / 2 + 170), y: -20, rot: 0, sails: 'furled' }, 3, { wait: false }), move('li', { x: -side * (c.beam / 2 + 150), y: -60 }, 3, { wait: false })), stop(), say('enc', 'Bu enkaz kimin, kaptan?', 2.2, 0.6), react('surprise', side)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(work([], 'bow', 'Halatları hazırlıyor', 3), call((d) => { const e = d.world.get('enc'); const w = d.world.get('wr'); if (e && w) e.hooks = [{ x0: e.x + side * 20, y0: e.y - 16, x1: w.x, y1: w.y }]; })), S('throw', { from: 'bow', to: 'wr', kind: 'rope', arc: 10 }), ...(info.success ? [spawn({ id: 'cr1', kind: 'crate', x: side * (c.beam / 2 + 30), y: -30 }), S('throw', { from: 'wr', to: 'enc', kind: 'crate', good: 'GOOD_ANTIQUE', arc: 14 }), S('pickup', { id: 'cr1', prefer: [], task: 'Payını alıyor' }), say('enc', 'Adil paylaşım. Bunu hatırlayacağım.', 2.2, 0.6)] : [say('enc', 'Bu paylaşım bana uymaz!', 2, 0.4), unhook('enc')])],
      (c, info) => [par(go(40), S('shipTo', { x: side * 10 })), ...(info.success ? [S('throw', { from: 'wr', to: 'ship', kind: 'crate', good: 'GOOD_GOLD_BAR', arc: 14 }), say('enc', 'Hızlıymışsın…', 1.8, 0.4)] : [move('enc', { x: side * (c.beam / 2 + 120) }, 1.2), scrape(side), say('enc', 'Dikkat et!', 1.6, 0.4), move('enc', { x: side * (c.beam / 2 + 170) }, 1.2)])],
      () => [par(S('flag', { up: true }), sfx('flag')), cap('Enkaz senin, Neris.', 1.8, 0.4), say('enc', 'Bunu unutmam.', 2, 0.6), S('flag', { up: false })],
    ],
    from: () => 'wr',
    exit: (c) => [unhook('enc'), remove('cr1'), par(sailAwayUp(c, 'enc', -200), move('li', { y: -480 }, 3, { wait: false }), move('wr', { y: 420, alpha: 0 }, 3, { wait: false })), remove('enc'), remove('li'), remove('wr'), weather({ restore: true }), go(30)],
  })),

  EVT_X3_CREW01: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', dark: 0.08 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: side * 150, y: -260, opts: { npcs: ['sailor', 'castaway'], dir: 'down' } })],
    approach: (c) => [par(move('enc', { y: -20 }, 3), slow(4), cam({ x: side * 40, y: 0 }, 0.3, 1.04)), par(fx('splash', 'enc', 30), S('shake', { amount: 6 }), sfx('splash')), S('opts', { id: 'enc', opts: { capsized: true } }), only('CREW_BJORN', 'Kaptan, izin ver!', { dur: 1.8 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [work(['CREW_BJORN'], rail(side), 'Kalın halatı fırlatıyor', 3, 0.6), S('throw', { from: { rail: side }, to: 'enc', kind: 'rope', arc: 14 }), rope('enc'), move('enc', { x: besides(c, 26, side), y: 0 }, 2), board('b1', 'sailor', rail(side), 'center', { say: 'Bjorn! Sağ ol!' }), only('CREW_BJORN', 'Hah! Kolaydı.', { dur: 1.6 })],
      (c, info) => [gather(rail(side), 'Halatı birlikte çekiyor', { n: 4, run: true, dur: 4 }), S('throw', { from: { rail: side }, to: 'enc', kind: 'rope', arc: 14 }), rope('enc'), ...(info.success ? [move('enc', { x: besides(c, 26, side), y: 0 }, 2), board('b1', 'sailor', rail(side), 'center', { say: 'Teşekkürler!' })] : [snap('enc'), scrape(side, 12), move('enc', { x: besides(c, 30, side), y: 10 }, 1.6)])],
      () => [S('throw', { from: { rail: side }, to: 'enc', kind: 'buoy', arc: 16 }), T(0.6), crewSay([], 'Tutunun!', { dur: 1.4 })],
    ],
    exit: () => [unhook('enc'), offAll(rail(side)), move('enc', { y: 420, alpha: 0 }, 2.6), remove('enc'), weather({ restore: true }), go(30)],
  })),

  // ═══════════ ŞANS ═══════════
  EVT_X3_F01: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'pressBoat', x: besides(c, 44), y: -280, opts: {} })],
    approach: (c) => [par(move('enc', { y: -10 }, 3.2), slow(4), cam({ x: side * 40, y: 0 }, 0.3, 1.06)), stop(), say('enc', 'Taze haritalar! Ya da takas!', 2.2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      () => [S('coins', { from: 'ship', to: 'enc', n: 5 }), S('opts', { id: 'enc', opts: { press: true } }), T(1.4), S('opts', { id: 'enc', opts: { press: false } }), S('icon', { icon: 'map', from: 'enc', to: 'ship' })],
      () => [board('pr', 'sailor', rail(side), rail(side), { dx: side * 6 }), par(S('opts', { id: 'enc', opts: { press: true } }), work([], rail(side), 'Makinenin kolunu çeviriyor', 4, 0.8)), S('opts', { id: 'enc', opts: { press: false } }), S('icon', { icon: 'scroll', from: 'enc', to: 'ship' }), unboard('pr', rail(side))],
      () => [work(['CAPTAIN'], rail(side), 'Eski haritayı uzatıyor', 3, 0.6), S('icon', { icon: 'oldmap', from: 'ship', to: 'enc' }), say('enc', 'Bunun aslı kayıptı!', 2, 0.4)],
    ],
    exit: () => [offAll(rail(side)), ...driftAll()],
  })),

  EVT_X3_F02: def((ev, side) => ({
    setup: (c) => [0, 1, 2].map((i) => spawn({ id: `m${i}`, kind: 'rowboat', x: side * (120 + i * 40), y: -300 - i * 30, opts: { npcs: ['sailor'], dir: 'down', flag: ['#e0c040', '#3b6ea5', '#c8423b'][i] } })),
    approach: (c) => [par(slow(5), cam({ x: side * 50, y: -20 }, 0.3, 0.98), move('m0', { x: besides(c, 24), y: -10 }, 3), move('m1', { x: side * 160, y: -60 }, 3, { wait: false }), move('m2', { x: side * 200, y: -100 }, 3, { wait: false })), stop(), say('m0', 'Bir sonraki limana mektup?', 2.2, 0.6), deckProp('flags', 'signalFlags', rail(side), { opts: { cols: ['#e0c040', '#3b6ea5'] } })],
    intro: () => [T(0.3)],
    opts: [
      () => [S('icon', { icon: 'scroll', from: 'm0', to: 'ship' }), work(['CAPTAIN'], 'helm', 'Mektubu kamaraya koyuyor', 3, 0.4)],
      (c) => [work(['CAPTAIN'], rail(side), 'Doğru rotayı gösteriyor', 3, 0.6), par(move('m2', { x: side * 260, y: -320 }, 2.6), S('heel', { rot: 0 })), say('m1', 'Teşekkürler!', 1.6, 0.4)],
      () => [S('coins', { from: 'ship', to: 'm0', n: 3 }), say('m0', 'Kuzey limanlarında fiyatlar yükseliyor…', 2.6, 0.6), S('icon', { icon: 'scroll', from: 'm0', to: 'ship' })],
    ],
    from: () => 'm0',
    exit: () => [remove('flags'), par(move('m0', { y: 420 }, 2.6), move('m1', { y: 420 }, 2.6, { wait: false }), move('m2', { y: 420 }, 2.6, { wait: false })), remove('m0'), remove('m1'), remove('m2'), go(30)],
  })),

  EVT_X3_F03: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 2, { x: side * 240, y: -330, rot: Math.PI * 0.9, scale: 0.78, crewNpc: ['villagerF', 'merchant'] }), spawn({ id: 'cloth', kind: 'clothBolts', x: side * 240, y: -330, layer: 2, opts: { sheet: false } })],
    approach: (c) => [par(slow(5), cam({ x: side * 40, y: 0 }, 0.3, 1.02)), ...approachShip(c, 'enc', 2, 0.78), call((d) => { const e = d.world.get('cloth'); const s = d.world.get('enc'); if (e && s) { e.x = s.x; e.y = s.y + 10; } }), say('enc', 'Yelkenlerin yorgun görünüyor!', 2.2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      () => [S('coins', { from: 'ship', to: 'enc', n: 5 }), plank(side), board('w1', 'villagerF', rail(side), 'center', { endState: 'work' }), par(work([], 'center', 'Yelkeni yıkıyor', 4, 0.6), fx('splash', 'ship', 12), S('sails', { state: 'furled' })), T(0.6), S('sails', { state: 'full' }), unboard('w1', rail(side))],
      () => [gather('cargo', 'İpek topunu taşıyor', { n: 2, dur: 3 }), S('throw', { from: 'ship', to: 'enc', kind: 'crate', good: 'GOOD_SILK', arc: 16 }), S('coins', { from: 'enc', to: 'ship', n: 6 })],
      () => [S('opts', { id: 'cloth', opts: { sheet: true } }), plank(side), board('w2', 'sailor', rail(side), rail(side), { dx: side * 10 }), work([], rail(side), 'Tezgâhta dokuyor', 5, 0.6), unboard('w2', rail(side))],
    ],
    skip: () => ['gold'],
    exit: (c) => [unhook('enc'), offAll(rail(side)), par(sailAwayUp(c), move('cloth', { alpha: 0 }, 1.5, { wait: false })), remove('enc'), remove('cloth'), go(30)],
  })),

  EVT_X3_F04: def((ev, side) => ({
    setup: (c) => [capShip(c, 'li', 'liora', { x: -c.beam / 2 - 250, y: -300, level: 2 }), capShip(c, 'enc', 'boran', { x: c.beam / 2 + 250, y: -320, level: 3 }), ...(dS(c) >= 3 ? [capShip(c, 'ne', 'neris', { x: side * (c.beam / 2 + 200), y: -420, scale: 0.5, rot: Math.PI })] : [])],
    approach: (c) => [par(slow(5), cam({ x: 0, y: -10 }, 0.3, 0.92), move('li', { x: -c.beam / 2 - 64, y: -10, rot: 0, sails: 'furled' }, 3), move('enc', { x: c.beam / 2 + 76, y: 0, rot: 0, sails: 'furled' }, 3, { wait: false }), move('ne', { y: -90 }, 3, { wait: false })), stop(), say('li', 'Hızlı bir anlaşma, kaptan?', 2, 0.4), say('enc', 'Sağlam bir anlaşma daha iyi!', 2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c) => [S('throw', { from: 'ship', to: 'li', kind: 'crate', good: 'GOOD_SPICE', arc: 14 }), say('li', 'Sonraki limanda adını duyururum!', 2.2, 0.4), par(move('li', { y: -440, x: -c.beam / 2 - 80, sails: 'full' }, 2.6), sfx('depart'))],
      () => [S('coins', { from: 'ship', to: 'enc', n: 6 }), plank(1, 'enc'), board('bc', 'boran', 'railR', 'railR', { dx: 8, endState: 'work' }), par(work(['CREW_GROOT'], 'railR', 'Meşe yamalarını çakıyor', 4, 0.8), sfx('repair'), fx('spark', { rail: 1 }, 10)), unboard('bc', 'railR'), unhook('enc')],
      (c, info) => [work(['CAPTAIN'], 'center', 'İki kaptanın arasında pazarlık ediyor', 4, 0.8), ...(info.success ? [par(say('li', 'Adil!', 1.6, 0.2), say('enc', 'Kabul!', 1.6, 0.2)), par(sfx('cheer'), S('flag', { up: true }))] : [par(say('li', 'Bana daha az düştü!', 1.8, 0.2), say('enc', 'Asıl bana!', 1.8, 0.2))])],
    ],
    from: () => 'enc',
    exit: (c) => [unhook('enc'), S('flag', { up: false }), offAll(), par(move('li', { y: -460 }, 3), move('enc', { y: -460 }, 3, { wait: false }), move('ne', { y: -520 }, 3, { wait: false })), remove('li'), remove('enc'), remove('ne'), go(30)],
  })),

  EVT_X3_F05: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [spawn({ id: 'net', kind: 'lightNet', x: side * (c.beam / 2 + 90), y: -320, opts: { r: 70 } }), spawn({ id: 'enc', kind: 'rowboat', x: side * (c.beam / 2 + 190), y: -320, opts: { npcs: ['villager', 'sailor'], dir: 'down' } })],
    approach: (c) => [par(slow(4), cam({ x: side * 20, y: -60 }, 0.6, 0.96), move('net', { y: -20 }, 3.4), move('enc', { y: -40 }, 3.4, { wait: false })), stop(), say('enc', 'Bir el daha lazım!', 2, 0.6), ...pets('Hav?', 'Mrr…')],
    intro: () => [T(0.3)],
    opts: [
      (c) => [gather('bow', 'Ağı çekiyor', { n: 4, run: true, dur: 5 }), ...[0.3, 0.6, 0.85].map((p) => [S('opts', { id: 'net', opts: { pull: p, fish: true } }), T(0.5)]), S('throw', { from: 'net', to: 'ship', kind: 'crate', good: 'GOOD_FISH', arc: 16 })],
      () => [S('coins', { from: 'ship', to: 'enc', n: 4 }), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_FISH', arc: 16 }), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_FISH', arc: 16 })],
      () => [work(['CAPTAIN'], 'bow', 'Fenerlerin dizilişini izliyor', 4, 0.6), S('opts', { id: 'net', opts: { pull: 0.2 } }), float('Akıntı batıya', '#ffe080', 'net')],
    ],
    skip: () => ['gained'],
    exit: () => [par(move('net', { y: 420, alpha: 0 }, 2.6), move('enc', { y: 420 }, 2.6, { wait: false })), remove('net'), remove('enc'), weather({ restore: true }), go(30)],
  })),

  EVT_X3_CREW02: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'wind', kind: 'sparkles', x: 0, y: -60, layer: 2, opts: { r: 50, col: '#e8f4ff' } })],
    approach: () => [par(slow(8), cam({ x: 0, y: -20 }, 0.3, 1.06)), only('CREW_KALANI', 'Rüzgârı dinle, kaptan.', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      () => [work(['CREW_KALANI', 'CAPTAIN'], 'bow', 'Tüyün dönüşünü izliyor', 5, 0.6), S('heel', { rot: 0.06 }), T(0.6), S('heel', { rot: -0.06 }), T(0.6), S('heel', { rot: 0 }), only('CREW_KALANI', 'İşte! Şimdi duydun.', { dur: 1.8 })],
      (c) => [capShip(c, 'li', 'liora', { x: side * 260, y: -300 }), move('li', { x: alongside(c, 0.78, 2, 30), y: -20, rot: 0, sails: 'furled' }, 3), work(['CREW_KALANI'], rail(side), 'Dersi Liora\'ya anlatıyor', 4, 0.6), say('li', 'Bunu bana kimse öğretmemişti.', 2.2, 0.6), sailAwayUp(c, 'li')],
      () => [only('CREW_KALANI', 'Rüzgâr bekler.', { dur: 1.6 })],
    ],
    exit: () => [remove('wind'), remove('li'), go(30)],
  })),

  EVT_X3_CREW03: def((ev, side) => ({
    setup: () => [],
    mainId: null,
    approach: () => [par(slow(8), cam({ x: 0, y: 0 }, 0.3, 1.08)), deckProp('cmp', 'medallion', 'helm', { opts: { col: '#c8a040' } }), only('CREW_COMPASS', '…', { dur: 1.4 })],
    intro: () => [T(0.3)],
    opts: [
      () => [work(['CREW_COMPASS'], 'helm', 'Tehlikeleri haritaya işliyor', 4, 0.6), deckProp('mp', 'mapScroll', 'helm', { dx: 10 }), only('CREW_COMPASS', 'Şurası, şurası ve şurası.', { dur: 2 })],
      (c, info) => [work(['CAPTAIN'], 'helm', 'Kodu çözmeye çalışıyor', 4, 0.8), ...(info.success ? [spawn({ id: 'ks', kind: 'chest', x: 0, y: -10 }), S('pickup', { id: 'ks', prefer: ['CAPTAIN'], task: 'Gizli keseyi alıyor' })] : [only('CREW_COMPASS', 'Bir daha… yavaşça.', { dur: 1.6 })])],
      () => [only('CREW_COMPASS', 'Peki.', { dur: 1.2 })],
    ],
    exit: () => [remove('cmp'), remove('mp'), remove('ks'), go(30)],
  })),

  EVT_X3_PET01: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [glowLight('far', side * (c.beam / 2 + 170), -70, '#c87a3c', 14)],
    mainId: null,
    approach: () => [par(slow(6), cam({ x: 0, y: -60 }, 0.6, 0.98)), pet('PET_TARCIN', { at: 'bow', pose: 'alert', dir: 'up', dur: 6, say: 'Hrrr…' }), pet('PET_ZIPIR', { at: 'bow', dx: 10, pose: 'alert', dur: 6, say: 'Fşşş!', run: false })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [pet('PET_TARCIN', { at: rail(side), pose: 'wag', dur: 5 }), pet('PET_ZIPIR', { at: rail(side), dx: 8, pose: 'sit', dur: 5, run: false }), work(['CAPTAIN'], rail(side), 'Dürbünle bakıyor', 3, 0.6), capShip(c, 'ne', 'neris', { x: side * (c.beam / 2 + 190), y: -40, scale: 0.5, rot: 0 }), move('ne', { y: -110 }, 3), float('Bakır çizgili yelken', '#ffc080', 'ne')],
      (c, info) => [par(S('sound', { name: 'bell' }), gather('bow', 'Yerini alıyor', { n: 4, run: true, dur: 4 })), ...(info.success ? [spawn({ id: 'rk', kind: 'rocks', x: -side * 30, y: -c.len / 2 - 80 }), par(S('heel', { rot: side * 0.1 }), S('shipTo', { x: side * 30 }))] : [scrape(0, 12)]), S('heel', { rot: 0 })],
      () => [pet('PET_TARCIN', { at: 'center', pose: 'sit', dur: 6 }), pet('PET_ZIPIR', { at: 'center', dx: 8, pose: 'sit', dur: 6, run: false }), cap('Uyuyun bakalım, nöbetçiler.', 2, 0.6)],
    ],
    exit: () => [remove('far'), remove('ne'), remove('rk'), weather({ restore: true }), go(30)],
  })),

  // ═══════════ GİZEM ═══════════
  EVT_X3_M01: def((ev, side) => ({
    weather: () => [weather({ preset: 'fog', fx: ['fog'], dark: 0.06 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'bottle', x: side * 30, y: -260, opts: {} })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 20 }, 3), slow(4), cam({ x: 0, y: -40 }, 0.6, 1.04)), stop(), S('pickup', { id: 'enc', prefer: [], task: 'Günlüğü sudan alıyor' }), deckProp('log', 'mapScroll', 'center')],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work(['CAPTAIN'], 'center', 'Son sayfayı okuyor', 4, 0.8), ...(info.success ? [par(glowLight('pg', 0, 0, '#c8e8ff', 22), sfx('magic')), float('Sayfa kendiliğinden doldu', '#c8e8ff')] : [par(S('heel', { rot: side * 0.1 }), S('shipTo', { x: side * 20 })), scrape(side, 10), S('heel', { rot: 0 })])],
      () => [work(['CAPTAIN'], 'center', 'Sayfaları kopyalıyor', 4, 0.8), S('icon', { icon: 'book', from: 'ship', to: { x: 0, y: -60 } })],
      (c) => [capShip(c, 'ne', 'neris', { x: side * 220, y: -320, rot: Math.PI }), move('ne', { x: alongside(c, 0.78, 2, 24), y: -10, rot: 0, sails: 'furled' }, 3), S('icon', { icon: 'book', from: 'ship', to: 'ne' }), say('ne', 'Bunu kaybettiğim günü hatırlamıyorum…', 2.6, 0.8), sailAwayUp(c, 'ne')],
    ],
    exit: () => [remove('log'), remove('pg'), remove('ne'), weather({ restore: true }), go(30)],
  })),

  EVT_X3_M02: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'seaGlyphs', x: 0, y: -300, opts: { fade: 0.2 } })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 20 }, 3), slow(4), cam({ x: 0, y: -60 }, 0.6, 1)), ...[0.5, 1].map((f) => [S('opts', { id: 'enc', opts: { fade: f } }), T(0.5)]), stop(), lookout('Suyun üstünde harfler!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work(['CAPTAIN'], 'bow', 'Harfleri deftere geçiriyor', 4, 0.8), ...(info.success ? [S('opts', { id: 'enc', opts: { decoded: true } }), par(sfx('magic'), float('Bir adres!', '#aaf8f0', 'enc'))] : [S('opts', { id: 'enc', opts: { fade: 0.3 } })])],
      () => [deckProp('atlas', 'mapScroll', 'bow'), work(['CAPTAIN'], 'bow', 'Atlas\'la karşılaştırıyor', 3, 0.6), S('opts', { id: 'enc', opts: { decoded: true } }), par(sfx('magic'), fx('spark', 'enc', 18))],
      () => [S('opts', { id: 'enc', opts: { fade: 0.3 } }), go(24)],
    ],
    exit: () => [remove('atlas'), S('opts', { id: 'enc', opts: { fade: 0 } }), remove('enc'), go(30)],
  })),

  EVT_X3_M03: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'calmCorridor', x: 0, y: -360, opts: { w: c.beam + 50, len: 420 } })],
    approach: (c) => [par(move('enc', { y: -200 }, 3), slow(5), cam({ x: 0, y: -60 }, 0.6, 0.94)), stop(), lookout('Dalgasız bir koridor!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(go(30), move('enc', { y: 60 }, 3)), ...(info.success ? (info.text?.includes('batığa') ? [spawn({ id: 'cb', kind: 'chest', x: side * 10, y: -c.len / 2 - 20 }), S('pickup', { id: 'cb', prefer: [], task: 'Kasayı alıyor' })] : [par(sfx('magic'), crewSay([], 'İnanılmaz…', { dur: 1.6 }))]) : [S('opts', { id: 'enc', opts: { close: 1 } }), par(fx('splash', 'ship', 36), S('shake', { amount: 12 }), sfx('impact'))])],
      (c) => [work(['CAPTAIN'], rail(side), 'Kenardaki dalgaları ölçüyor', 4, 0.8), S('throw', { from: { rail: side }, to: { x: side * (c.beam / 2 + 30), y: -80 }, kind: 'rope', arc: 8 })],
      (c, info) => [work(['CREW_COMPASS', 'CREW_SURGE', 'CREW_FINN', 'CREW_TOBIAS'], 'bow', 'Akıntının ritmini sayıyor', 5, 0.8), ...(info.success ? [S('opts', { id: 'enc', opts: { close: 0.4 } }), T(0.6), S('opts', { id: 'enc', opts: { close: 0 } }), float('Her saat başı', '#aaf8f0')] : [])],
    ],
    exit: () => [remove('cb'), move('enc', { alpha: 0 }, 1.2), remove('enc'), go(30)],
  })),

  EVT_X3_M04: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.06 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'stoneStatue', x: side * (c.beam / 2 + 90), y: -300, opts: {} })],
    approach: (c) => [par(move('enc', { y: -30 }, 3.4), slow(4), cam({ x: side * 50, y: -20 }, 0.3, 1.02)), stop(), react('surprise', side)],
    intro: () => [T(0.3)],
    opts: [
      (c) => landing(c, side, ['cartographer'], [work(['CAPTAIN'], rail(side), 'Sandaldakilere işaret ediyor', 3), S('opts', { id: 'enc', opts: { clean: true } }), float('Konseyin işareti', '#ffe080', 'enc')], [], 60),
      (c, info) => landing(c, side, ['sailor', 'sailor'], info.success ? [S('opts', { id: 'enc', opts: { clean: true, coins: true } }), T(1), S('coins', { from: 'enc', to: 'boat', n: 8 })] : [par(S('opts', { id: 'boat', opts: { dir: 'down' } }), fx('splash', 'boat', 20), sfx('impact')), scrape(side, 10)], [], 60),
      () => [par(S('flag', { up: true }), sfx('flag')), gather(rail(side), 'Başını eğiyor', { n: 4, dur: 4 }), S('flag', { up: false })],
    ],
    skip: () => ['gold'],
    exit: () => [remove('boat'), ...driftAll(), weather({ restore: true })],
  })),

  // ── EFSANE: SÖNMEYEN ARMADA ──
  EVT_X3_L01: def((ev, side) => {
    // üç donmuş gemi: iki yanımızda ve önümüzde (çakışmasız), fenerleri ve buz tozu ile
    const POS = (c) => [{ x: -(c.beam / 2 + 92), y: -20, s: 0.66, l: 3 }, { x: c.beam / 2 + 215, y: -60, s: 0.56, l: 3 }, { x: c.beam / 2 + 92, y: -10, s: 0.66, l: 3 }];
    const lanY = (p) => p.y - 46;
    return {
      weather: () => [weather({ night: true, preset: 'dark' })],
      setup: (c) => POS(c).flatMap((p, i) => [
        shipEntity(c, `a${i}`, 'armada', p.l, { x: p.x, y: p.y - 380, rot: 0, scale: p.s, sails: 'full', crewNpc: ['frozen', 'frozen', 'frozen'], alpha: 0.85 }),
        spawn({ id: `lan${i}`, kind: 'armadaLantern', x: p.x, y: lanY(p) - 380, layer: 3, opts: { ph: i } }),
        spawn({ id: `fr${i}`, kind: 'frost', x: p.x, y: p.y - 380, layer: 3, opts: { w: 60, h: 100 } }),
      ]),
      mainId: 'a1',
      approach: (c) => [
        par(slow(6), cam({ x: 0, y: -120 }, 0.6, 0.94)),
        par(...POS(c).flatMap((p, i) => [move(`a${i}`, { y: p.y }, 4, i ? { wait: false } : {}), move(`lan${i}`, { y: lanY(p) }, 4, { wait: false }), move(`fr${i}`, { y: p.y }, 4, { wait: false })])),
        stop(),
        lookout('Yelkenleri dolu… ama kıpırdamıyorlar!', { dur: 2.4 }),
        ...pets('Hav… hav?', 'Mrrr?'),
        crewSay([], 'Tayfaları… donmuş gibi.', { dur: 2 }),
      ],
      intro: () => [T(0.4)],
      opts: [
        // 1) Üç feneri eşzamanla: fenerler sırayla senkronlanır; başarı → donmuş tayfa bir nefeslik çözülür ve belge uzatır,
        //    sonra yeniden donar; başarısızlık → kör edici parlama ve donmuş gövdeye sürtünme.
        (c, info) => [
          deckProp('x3lamp', 'lantern', 'bow'), work(['CAPTAIN'], 'bow', 'Feneri ritimle açıp kapatıyor', 5, 0.6),
          ...[0, 1, 2].map((i) => [par(S('flash', {}), sfx('bell'), S('opts', { id: `lan${i}`, opts: info.success || i < 2 ? { sync: true } : { blind: true } })), T(0.6)]),
          ...(info.success
            ? [remove('fr1'), swapCrew('a1', ['sailor', 'oldSailor', 'sailor']), say('a1', 'Teşekkürler, yolcu… kaptanın belgesi senin.', 2.6, 0.6), S('icon', { icon: 'scroll', from: 'a1', to: 'ship' }), swapCrew('a1', ['frozen', 'frozen', 'frozen']), spawn({ id: 'fr1', kind: 'frost', x: c.beam / 2 + 215, y: -60, layer: 3, opts: { w: 60, h: 100 } }), ...[0, 1, 2].map((i) => S('opts', { id: `lan${i}`, opts: { sync: false } }))]
            : [par(S('flash', {}), S('flash', {})), par(S('heel', { rot: -0.12 }), move('a0', { x: -(c.beam / 2 + 60) }, 1)), scrape(-1, 26), par(S('heel', { rot: 0 }), move('a0', { x: -(c.beam / 2 + 92) }, 1.2)), ...[0, 1, 2].map((i) => S('opts', { id: `lan${i}`, opts: { sync: false, blind: false } }))]),
          remove('x3lamp'),
        ],
        // 2) İlk gemiye çık: iskele kurulur, kaptan donmuş güverteye geçer; başarı → sandık ve defter, donmuş denizci başını çevirir;
        //    başarısızlık → iskele kırılır, gemiler birbirine sürtünür.
        (c, info) => [
          move('a0', { x: -(c.beam / 2 + 62) }, 1.6), plank(-1, 'a0'),
          board('cpx', 'captain', 'railL', 'railL', { dx: -22, endState: 'work' }),
          ...(info.success
            ? [S('throw', { from: 'a0', to: 'ship', kind: 'crate', good: 'GOOD_GOLD_BAR', arc: 16 }), S('icon', { icon: 'book', from: 'a0', to: 'ship' }), swapCrew('a0', ['frozen', 'oldSailor', 'frozen']), say('a0', '…', 1.4, 0.4), swapCrew('a0', ['frozen', 'frozen', 'frozen']), unboard('cpx', 'railL'), unhook('a0')]
            : [par(unhook('a0'), sfx('creak'), fx('splinter', { rail: -1 }, 18)), unboard('cpx', 'railL'), par(move('a0', { x: -(c.beam / 2 + 50) }, 0.6), S('heel', { rot: 0.1 })), scrape(-1, 28), S('heel', { rot: 0 })]),
          move('a0', { x: -(c.beam / 2 + 92) }, 1.4),
        ],
        // 3) Uzaktan kaydet: kaptan defterle kayıt tutar; armada sise karışıp silikleşir.
        () => [
          deckProp('rec', 'mapScroll', 'bow'), work(['CAPTAIN'], 'bow', 'Gemilerin adlarını ve fener ritmini yazıyor', 5, 0.8),
          par(...[0, 1, 2].map((i) => move(`a${i}`, { alpha: 0.4 }, 2.4, i ? { wait: false } : {}))),
          float('Armada kaydı', '#d8f0ff', 'a1'), remove('rec'),
        ],
      ],
      from: () => 'a1',
      // Ayrılış: fenerler söner, donmuş filo yerinde gecenin içinde çözülüp kaybolur (gemimizin içinden geçmez)
      exit: (c) => [
        unhook('a0'),
        par(...[0, 1, 2].map((i) => S('opts', { id: `lan${i}`, opts: { off: true } }))),
        par(...[0, 1, 2].flatMap((i) => [move(`a${i}`, { alpha: 0 }, 2.6, i ? { wait: false } : {}), move(`fr${i}`, { alpha: 0 }, 2, { wait: false }), move(`lan${i}`, { alpha: 0 }, 2, { wait: false })])),
        ...[0, 1, 2].flatMap((i) => [remove(`a${i}`), remove(`lan${i}`), remove(`fr${i}`)]), weather({ restore: true }), go(30),
      ],
    };
  }),

  // ── EFSANE: UYUYAN ADA ──
  EVT_X3_L03: def((ev, side) => {
    const IY = () => -40;
    const IX = (c) => side * (c.beam / 2 + 165);
    const night = (c) => dS(c) >= 5;
    return {
      weather: (c) => [night(c) ? weather({ night: true, preset: 'dark' }) : weather({ preset: 'calm' })],
      setup: (c) => [spawn({ id: 'enc', kind: 'livingIsland', x: IX(c), y: IY(c) - 330, opts: { r: 86, night: night(c) } }), spawn({ id: 'fish', kind: 'fishSchool', x: IX(c) - side * 40, y: IY(c) - 260, layer: 1, opts: {} }), spawn({ id: 'brd', kind: 'birds', x: IX(c), y: IY(c) - 380, layer: 3, opts: { n: 6 } })],
      approach: (c) => [
        par(slow(6), cam({ x: side * 60, y: -40 }, 0.6, 0.92), move('enc', { y: IY(c) }, 4), move('fish', { y: IY(c) + 70 }, 4, { wait: false }), move('brd', { y: IY(c) - 30 }, 4, { wait: false })),
        stop(), lookout('Ada… nefes alıyor!', { dur: 2.2 }),
        pet('PET_TARCIN', { at: 'bow', pose: 'sit', dir: 'up', dur: 6, say: 'Hav?' }), pet('PET_ZIPIR', { at: 'center', pose: 'sit', dur: 6, say: 'Mrr.', run: false }),
        S('opts', { id: 'enc', opts: { eye: 0.4 } }), T(0.7), S('opts', { id: 'enc', opts: { eye: 0 } }),
      ],
      intro: () => [T(0.3)],
      opts: [
        // 1) Gözlemle: göz yavaşça açılır, kuşlar sırta konar, balıklar döner; sonra göz kapanır (ada yerinde kalır)
        (c) => [work(['CAPTAIN'], 'bow', 'Sessizce izliyor', 5, 0.6), ...[0.4, 0.8, 1].map((e) => [S('opts', { id: 'enc', opts: { eye: e } }), T(0.5)]), par(move('brd', { y: IY(c) - 10, x: IX(c) + side * 20 }, 2.4), move('fish', { x: -side * 60 }, 2.4, { wait: false })), crewSay([], 'Bunu torunlarıma anlatacağım…', { dur: 2.2 }), ...[0.5, 0].map((e) => [S('opts', { id: 'enc', opts: { eye: e } }), T(0.5)])],
        // 2) Eski izi incele: sandal adanın sırtına yanaşır; başarı → hazine/nadir alet; başarısızlık → ada döner, dalga gemiyi geri iter
        (c, info) => [
          gather(rail(side), 'Sandalı indiriyor', { n: 2, run: true, dur: 3 }),
          spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor', 'diver'], dir: 'up' } }),
          move('boat', { x: IX(c) - side * 70, y: IY(c) + 30 }, 2.6),
          ...(info.success
            ? [work([], 'bow', 'Sırttaki eski kalıntıyı izliyor', 3), S('icon', { icon: info.text?.includes('alet') ? 'compass' : 'chest', from: 'enc', to: 'boat' })]
            : [par(S('opts', { id: 'enc', opts: { turn: true, fin: true, eye: 1 } }), sfx('creak')), par(fx('splash', 'boat', 30), S('shake', { amount: 12 }), S('shipTo', { y: 36 })), S('opts', { id: 'enc', opts: { turn: false, fin: false, eye: 0 } })]),
          S('opts', { id: 'boat', opts: { dir: 'down' } }), move('boat', { x: besides(c, 16, side), y: 0 }, 2.2), remove('boat'),
        ],
        // 3) Yol ver: gemi kenara çekilir, ada yüzgeciyle yanımızdan geçip derine süzülür; uzakta bir kaptan gemisi selam verir
        (c) => [par(go(16), S('heel', { rot: -side * 0.12 }), S('shipTo', { x: -side * 30 })), T(1), stop(), S('heel', { rot: 0 }),
          par(S('opts', { id: 'enc', opts: { fin: true, eye: 1 } }), move('enc', { y: 260 }, 7), move('brd', { y: 220 }, 7, { wait: false }), move('fish', { y: 280 }, 7, { wait: false })),
          par(sfx('cheer'), crewSay([], 'Selam sana, koca dost!', { dur: 2 })),
          capShip(c, 'helper', 'liora', { x: -side * (c.beam / 2 + 190), y: -10, scale: 0.5, rot: 0 }), par(S('flag', { up: true }), sfx('horn')), move('helper', { y: -110 }, 2.6), S('flag', { up: false })],
      ],
      skip: () => ['gained', 'items'],
      exit: () => [par(move('enc', { alpha: 0 }, 3), move('fish', { alpha: 0 }, 2, { wait: false }), move('brd', { alpha: 0 }, 2.4, { wait: false }), move('helper', { alpha: 0 }, 2, { wait: false })), remove('enc'), remove('fish'), remove('brd'), remove('helper'), remove('boat'), S('shipTo', { x: 0, y: 0 }), weather({ restore: true }), go(30)],
    };
  }),

  // ═══════════ FELAKET ═══════════
  EVT_X3_DIS01: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'sandbar', x: 0, y: -320, opts: { merge: 0, w: 220 } })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 50 }, 3.2), slow(5), cam({ x: 0, y: -60 }, 0.6, 0.96)), ...[0.4, 0.8, 1].map((m) => [S('opts', { id: 'enc', opts: { merge: m, w: 220 } }), T(0.4)]), stop(), lookout('Sığlıklar birleşiyor!', { dur: 2 }), react('danger', side)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work(['CREW_FINN', 'CREW_COMPASS', 'CAPTAIN'], 'bow', 'İskandil ipini atıyor', 4, 0.6), ...[0, 1].map(() => [S('throw', { from: 'bow', to: { x: 0, y: -c.len / 2 - 40 }, kind: 'rope', arc: 6 }), T(0.4)]), ...(info.success ? [S('opts', { id: 'enc', opts: { merge: 1, w: 220, channel: true } }), par(go(16), move('enc', { y: 200 }, 3))] : [par(go(16), move('enc', { y: -c.len / 2 + 10 }, 1.4)), scrape(0, 22), S('opts', { id: 'enc', opts: { merge: 1, w: 220, channel: true } }), move('enc', { y: 200 }, 2)])],
      (c) => [par(go(24), S('heel', { rot: side * 0.12 }), S('shipTo', { x: side * 60 })), move('enc', { y: 200, x: -side * 40 }, 3), S('heel', { rot: 0 })],
      (c, info) => [par(go(60), sfx('depart')), ...(info.success ? [par(move('enc', { y: 200 }, 1.6), fx('splash', 'ship', 26))] : [move('enc', { y: -c.len / 2 + 30 }, 1), par(S('shake', { amount: 16 }), fx('splinter', 'ship', 34), sfx('impact')), S('speed', { v: 0 }), T(0.6), move('enc', { y: 220 }, 2)])],
    ],
    exit: () => [S('heel', { rot: 0 }), ...driftAll()],
  })),

  EVT_X3_DIS02: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.1 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'glassWave', x: 0, y: -300, opts: { w: 200 } }), spawn({ id: 'gw2', kind: 'glassWave', x: side * 60, y: -420, opts: { w: 160 } })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 40 }, 3), move('gw2', { y: -70, x: side * (c.beam / 2 + 100) }, 3, { wait: false }), slow(5), cam({ x: 0, y: -60 }, 0.6, 0.94)), par(S('opts', { id: 'enc', opts: { w: 200, shatter: 0.6 } }), sfx('bell')), S('opts', { id: 'enc', opts: { w: 200, shatter: 0 } }), react('danger', side)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(go(20), S('heel', { rot: side * 0.08 }), S('shipTo', { x: side * 26 })), ...(info.success ? [par(move('enc', { y: 220 }, 3), move('gw2', { y: 200 }, 3, { wait: false }), S('opts', { id: 'enc', opts: { w: 200, shatter: 0.4 } }))] : [par(S('opts', { id: 'enc', opts: { w: 200, shatter: 1 } }), S('shake', { amount: 14 }), fx('spark', 'ship', 30), sfx('impact'))]), S('heel', { rot: 0 })],
      () => [stop(), gather('center', 'Bekliyor', { n: 4, dur: 4 }), ...[0.5, 1].map((s) => [S('opts', { id: 'enc', opts: { w: 200, shatter: s } }), T(0.6)]), move('enc', { alpha: 0 }, 1.4)],
      (c, info) => [work([], 'bow', 'Kepçeyle parçaya uzanıyor', 4, 0.8), ...(info.success ? [par(S('opts', { id: 'enc', opts: { w: 200, shatter: 0.8 } }), sfx('bell')), deckProp('shard', 'glowRing', 'bow', { opts: { col: '#c8f4ff' } })] : [par(S('opts', { id: 'enc', opts: { w: 200, shatter: 1 } }), S('shake', { amount: 16 }), fx('splinter', 'ship', 34), sfx('impact'))])],
    ],
    exit: () => [remove('shard'), move('enc', { alpha: 0 }, 1), remove('enc'), remove('gw2'), weather({ restore: true }), go(30)],
  })),

  EVT_X3_DIS03: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'birdSwarm', x: 0, y: -420, layer: 3, opts: { n: 110, r: 170 } })],
    approach: (c) => [par(move('enc', { y: -60 }, 3.4), slow(5), cam({ x: 0, y: -20 }, 0.3, 0.94)), weather({ preset: 'storm', dark: 0.25 }), lookout('Gökyüzü karardı… kuşlar!', { dur: 2 }), react('danger', side)],
    intro: () => [T(0.3)],
    opts: [
      () => [stop(), gather('center', 'Yelkenleri indirip bekliyor', { n: 4, dur: 5 }), move('enc', { y: 300 }, 4), fx('spark', 'ship', 10)],
      (c, info) => [par(go(30), move('enc', { y: 280 }, 4)), ...(info.success ? [crewSay([], 'Yıldızsız seyir!', { dur: 1.6 })] : [scrape(side, 14)])],
      () => [deckProp('x3l', 'lantern', 'bow'), par(S('flash', {}), sfx('magic')), ...[0.4, 0.8, 1].map((p) => [S('opts', { id: 'enc', opts: { n: 110, r: 170, part: p } }), T(0.4)]), par(go(30), move('enc', { y: 300 }, 3)), remove('x3l')],
    ],
    exit: () => [move('enc', { alpha: 0 }, 1.2), remove('enc'), weather({ restore: true }), go(30)],
  })),

  // ── EFSANE: DENİZİN ÜZERİNDEKİ TAŞ YOL ──
  EVT_X3_L02: def((ev, side) => {
    const P = (c) => { const x = c.beam / 2 + 46, y0 = -(c.len / 2 + 40); return [[-x, y0], [x, y0 - 12], [-x, -8], [x, 4], [-x, c.len / 2 + 10], [x, c.len / 2 + 22]]; };
    const rise = (c, h) => P(c).map((_, i) => S('opts', { id: `p${i}`, opts: { h: Math.max(0, Math.min(1, h - i * 0.06)), glyph: h > 0.5, H: 52, w: 12 } }));
    return {
      weather: () => [weather({ preset: 'dusk', dark: 0.08 })],
      setup: (c) => P(c).map(([x, y], i) => spawn({ id: `p${i}`, kind: 'stonePillar', x, y, opts: { h: 0, H: 52, w: 12 } })),
      mainId: 'p0',
      approach: (c) => [
        par(slow(5), cam({ x: 0, y: -60 }, 0.4, 0.94)),
        par(S('shake', { amount: 6 }), sfx('creak')), lookout('Dipten taş yükseliyor!', { dur: 2 }),
        ...[0.35, 0.7, 1.05, 1.3].map((h) => [par(...rise(c, h), S('shake', { amount: 3 }), sfx('creak')), T(0.5)]),
        stop(), crewSay([], 'Taşların üstünde ışıyan çizimler var…', { dur: 2.2 }),
        ...pets('Hav!', 'Mrrraaav!'),
      ],
      intro: () => [T(0.3)],
      opts: [
        // 1) Yavaşça geç: sütunların arasından süzülür; başarısızlıkta önde yeni bir sütun yükselip omurgayı sıyırır
        (c, info) => [par(go(10), ...P(c).map(([x, y], i) => move(`p${i}`, { y: y + 520 }, 6, i ? { wait: false } : {}))),
          ...(info.success ? [T(0.4), crewSay([], 'Yavaş… yavaş… geçtik!', { dur: 1.8 })]
            : [spawn({ id: 'pX', kind: 'stonePillar', x: side * 22, y: -c.len / 2 - 20, opts: { h: 0, H: 40, w: 10, glyph: true } }), ...[0.4, 0.8].map((h) => [S('opts', { id: 'pX', opts: { h, H: 40, w: 10, glyph: true } }), T(0.3)]), scrape(side, 28), S('opts', { id: 'pX', opts: { h: 0, H: 40, w: 10 } })])],
        // 2) Kadim işaretleri oku: çizimler parlar, iskele tarafı sütunları alçalıp güvenli geçit açar
        (c) => [deckProp('atlas', 'mapScroll', 'bow'), work(['CAPTAIN'], 'bow', 'Çizimleri atlasla eşleştiriyor', 4, 0.8), par(sfx('magic'), glowLight('gl', 0, -260, '#78f0dc', 80)),
          ...P(c).filter((_, i) => i % 2 === 0).map((_, k) => S('opts', { id: `p${k * 2}`, opts: { h: 0.3, glyph: true, H: 52, w: 12, top: true } })),
          par(go(14), S('shipTo', { x: -side * 10 }), ...P(c).map(([x, y], i) => move(`p${i}`, { y: y + 520 }, 6, i ? { wait: false } : {}))), remove('atlas')],
        // 3) İşaretleri incele: sandalla bir sütuna yanaşılır; başarıda çizim kopyalanır, başarısızlıkta yol sarsılır
        (c, info) => landing(c, -1, ['cartographer'], info.success
          ? [work(['CAPTAIN'], 'railL', 'Sandaldakilere işaret ediyor', 3), float('Çizim kopyalandı', '#78f0dc', 'p0')]
          : [par(...rise(c, 0.7), S('shake', { amount: 10 }), sfx('impact')), scrape(-1, 16)], [], 40),
        // 4) Derin suya dön: gemi geri döner, sütunlar denize gömülür
        (c) => [par(S('heel', { rot: side * 0.14 }), S('shipTo', { x: side * 30, y: 40 })), ...[0.8, 0.4, 0].map((h) => [par(...rise(c, h), sfx('splash')), T(0.5)]), S('heel', { rot: 0 })],
      ],
      exit: (c) => [remove('pX'), remove('gl'), remove('boat'), ...[0.6, 0].map((h) => [par(...rise(c, h)), T(0.4)]), ...P(c).map((_, i) => remove(`p${i}`)), S('shipTo', { x: 0, y: 0 }), weather({ restore: true }), go(30)],
    };
  }),

  // ═══════════ TAMİR ═══════════
  EVT_X3_REPAIR01: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 40), y: -260, opts: { npcs: ['diver'], dir: side < 0 ? 'right' : 'left' } })],
    approach: (c) => [par(move('enc', { y: 0, x: besides(c, 20) }, 3), slow(4), cam({ x: side * 30, y: 0 }, 0.3, 1.06)), stop(), say('enc', 'Tahtaların altını kimse yoklamamış!', 2.2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 6 }), ...dive(c, side, ['CAPTAIN'], 'Ustaya halat tutuyor', [par(sfx('repair'), fx('spark', { rail: side }, 14))])],
      () => [S('coins', { from: 'ship', to: 'enc', n: 3 }), work(['CAPTAIN'], rail(side), 'Zayıf noktaları işaretliyor', 3, 0.6), float('Bir sonraki darbeye hazır', '#9ae0a0')],
      (c) => [work([], rail(side), 'Aletleri uzatıyor', 4, 0.8), ...dive(c, side, ['CREW_GROOT'], 'Ustayla birlikte dalıyor', [sfx('repair')])],
    ],
    skip: () => ['gold'],
    exit: () => [...driftAll()],
  })),
};

// ═══════════ ZİNCİRLER ═══════════
const council = (c) => [capShip(c, 'li', 'liora', { x: -c.beam / 2 - 210, y: -330, rot: 0 }), capShip(c, 'enc', 'boran', { x: c.beam / 2 + 210, y: -330, rot: 0, level: 3 }), capShip(c, 'ne', 'neris', { x: c.side * (c.beam / 2 + 330), y: -400, rot: Math.PI, scale: 0.62 })];
const councilIn = (c) => [par(slow(5), cam({ x: 0, y: -100 }, 0.6, 0.92), move('li', { x: -c.beam / 2 - 70, y: -60, sails: 'furled' }, 3), move('enc', { x: c.beam / 2 + 82, y: -60, sails: 'furled' }, 3, { wait: false }), move('ne', { x: c.side * (c.beam / 2 + 210), y: -70, rot: 0, sails: 'furled' }, 3, { wait: false })), stop()];
const councilOut = (c) => [unhook('enc'), unhook('li'), unhook('ne'), offAll(), S('flag', { up: false }), par(move('li', { y: -460 }, 3), move('enc', { y: -460 }, 3, { wait: false }), move('ne', { y: -520 }, 3, { wait: false })), remove('li'), remove('enc'), remove('ne'), go(30)];
const armada = (c, n = 1) => [shipEntity(c, 'enc', 'armada', 4, { x: c.side * (c.beam / 2 + 110), y: -360, rot: 0, scale: 0.75, crewNpc: ['frozen', 'frozen', 'frozen'] }), spawn({ id: 'lan', kind: 'armadaLantern', x: c.side * (c.beam / 2 + 110), y: -405, layer: 3, opts: {} }), spawn({ id: 'fr', kind: 'frost', x: c.side * (c.beam / 2 + 110), y: -360, layer: 3, opts: {} }), ...(n > 1 ? [shipEntity(c, 'a2', 'armada', 3, { x: -c.side * (c.beam / 2 + 120), y: -420, rot: 0, scale: 0.65, crewNpc: ['frozen', 'frozen'] }), spawn({ id: 'lan2', kind: 'armadaLantern', x: -c.side * (c.beam / 2 + 120), y: -470, layer: 3, opts: { ph: 2 } })] : [])];
const armadaIn = (c) => [par(slow(5), cam({ x: c.side * 30, y: -60 }, 0.6, 0.94), move('enc', { y: -60 }, 3.4), move('lan', { y: -105 }, 3.4, { wait: false }), move('fr', { y: -60 }, 3.4, { wait: false }), move('a2', { y: -60 }, 3.4, { wait: false }), move('lan2', { y: -110 }, 3.4, { wait: false })), stop()];
const armadaOut = () => [unhook('enc'), offAll(), par(go(18), move('enc', { y: 460, alpha: 0.2 }, 4), move('lan', { alpha: 0 }, 2, { wait: false }), move('fr', { alpha: 0 }, 2, { wait: false }), move('a2', { y: 460, alpha: 0.2 }, 4, { wait: false }), move('lan2', { alpha: 0 }, 2, { wait: false })), T(3.4), remove('enc'), remove('lan'), remove('fr'), remove('a2'), remove('lan2'), remove('clk'), weather({ restore: true }), go(30)];
const nightW = () => [weather({ night: true, preset: 'dark' })];
const factions = (c) => [spawn({ id: 'b1', kind: 'rowboat', x: -c.beam / 2 - 160, y: -300, opts: { npcs: ['officer'], dir: 'down' } }), spawn({ id: 'enc', kind: 'rowboat', x: c.beam / 2 + 160, y: -300, opts: { npcs: ['guild'], dir: 'down' } }), spawn({ id: 'b3', kind: 'rowboat', x: c.side * 40, y: -420, opts: { npcs: ['redCaptain'], dir: 'down' } })];
const factionsIn = (c) => [par(slow(5), cam({ x: 0, y: -40 }, 0.6, 0.96), move('b1', { x: -c.beam / 2 - 30, y: -10 }, 3), move('enc', { x: c.beam / 2 + 30, y: -10 }, 3, { wait: false }), move('b3', { y: -c.len / 2 - 40 }, 3, { wait: false })), stop()];
const factionsOut = () => [offAll(), par(move('b1', { y: 420 }, 2.6), move('enc', { y: 420 }, 2.6, { wait: false }), move('b3', { y: 420 }, 2.6, { wait: false })), remove('b1'), remove('enc'), remove('b3'), remove('tbl'), go(30)];

Object.assign(X3_SCENES, {
  CH_X3_COUNCIL_1: def((ev, side) => ({
    setup: (c) => council(c),
    approach: (c) => [...councilIn(c), say('ne', 'Kaptanlar Konseyi seni bekliyor.', 2.4, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      () => [par(S('flag', { up: true }), sfx('cheer')), say('li', 'Hoş geldin!', 1.6, 0.2), say('enc', 'Kadehler kalksın!', 1.6, 0.4)],
      () => [work(['CAPTAIN'], 'bow', 'Şartları soruyor', 4, 0.8), say('ne', 'Bu suların kuralını birlikte yazacağız.', 2.4, 0.6)],
      () => [cap('Konsey bensiz toplansın.', 1.8, 0.4), go(20)],
    ],
    exit: (c) => councilOut(c),
  })),
  CH_X3_COUNCIL_2: def((ev, side) => ({
    setup: (c) => council(c),
    approach: (c) => [...councilIn(c), deckProp('tbl', 'mapTable', 'center'), say('enc', 'Hangisini seçeceksin?', 2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(go(50), move('li', { y: -200 }, 2.4)), ...(info.success ? [say('li', 'Rüzgâr arkamızda!', 1.8, 0.4)] : [scrape(-1, 16)])],
      () => [par(go(16), move('enc', { y: -120 }, 3)), say('enc', 'Ağır gemi, sağlam rota.', 2, 0.4)],
      (c, info) => [call((d) => { const e = d.world.get('ne'); if (e) e.hooks = [{ x0: e.x, y0: e.y + 20, x1: e.x + 30, y1: e.y + 60 }]; }), spawn({ id: 'wr', kind: 'wreck', x: 30, y: -c.len / 2 - 70, opts: { w: 80, h: 40, n: 4 } }), ...(info.success ? [S('throw', { from: 'wr', to: 'ship', kind: 'crate', good: 'GOOD_ANTIQUE', arc: 14 }), say('ne', 'Payın, adil.', 1.8, 0.4)] : [par(fx('splinter', 'wr', 20), scrape(0, 22))]), unhook('ne'), remove('wr')],
    ],
    exit: (c) => [remove('tbl'), ...councilOut(c)],
  })),
  CH_X3_COUNCIL_3: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.08 })],
    setup: (c) => [capShip(c, 'enc', 'boran', { x: side * (c.beam / 2 + 100), y: -360, rot: 0, level: 3, scale: 0.7 }), spawn({ id: 'rk', kind: 'rocks', x: side * (c.beam / 2 + 190), y: -420 }), capShip(c, 'li', 'liora', { x: -side * (c.beam / 2 + 110), y: -300, rot: 0, scale: 0.6 }), shipEntity(c, 'pr', 'pirate', 1, { x: side * (c.beam / 2 + 190), y: -500, rot: Math.PI, scale: 0.5 })],
    approach: (c) => [par(slow(5), cam({ x: side * 50, y: -80 }, 0.6, 0.92), move('enc', { y: -40 }, 3), move('rk', { y: -90, x: side * (c.beam / 2 + 190) }, 3, { wait: false }), move('li', { y: -40 }, 3, { wait: false }), move('pr', { y: -90 }, 3, { wait: false })), par(S('flash', {}), fx('spark', 'pr', 14), sfx('cannon')), say('enc', 'Sahte işaret! Kayalıklara çekiliyorum!', 2.4, 0.6), stop()],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work(['CREW_YARA', 'CREW_COMPASS', 'CAPTAIN'], 'bow', 'Fişeklerin kaynağını izliyor', 4, 0.8), ...(info.success ? [float('Kanıt: sahte fişekçi', '#ffe080', 'pr'), par(move('pr', { y: -520 }, 2.4), sfx('depart'))] : [float('Kaynak kayboldu', '#c8c8c8', 'pr')])],
      (c, info) => [par(go(30), S('shipTo', { x: side * 40 })), work(['CREW_BJORN'], rail(side), 'Halatı atıyor', 3, 0.6), S('throw', { from: { rail: side }, to: 'enc', kind: 'rope', arc: 14 }), rope('enc'), ...(info.success ? [move('enc', { x: side * (c.beam / 2 + 80), y: 0 }, 2.4), par(say('enc', 'Kurtardın bizi!', 1.8, 0.2), sfx('cheer'))] : [scrape(side, 20)]), unhook('enc')],
      () => [cap('Riske giremeyiz.', 1.8, 0.4), say('li', '…', 1.2, 0.4)],
    ],
    exit: (c) => [unhook('enc'), par(move('enc', { y: -460 }, 3), move('li', { y: -460 }, 3, { wait: false }), move('pr', { y: -520 }, 2, { wait: false }), move('rk', { y: 300 }, 3, { wait: false })), remove('enc'), remove('li'), remove('pr'), remove('rk'), S('shipTo', { x: 0 }), weather({ restore: true }), go(30)],
  })),
  CH_X3_COUNCIL_4: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.06 })],
    setup: (c) => [...council(c), spawn({ id: 'buoy', kind: 'raceBuoy', x: 0, y: -520, opts: { col: '#e0c040' } })],
    approach: (c) => [...councilIn(c), say('li', 'Bu suların kuralını kim yazacak?', 2.4, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      () => [deckProp('tbl', 'mapTable', 'center'), work(['CAPTAIN'], 'center', 'Ortak haritaya imza atıyor', 4, 0.8), par(S('flag', { up: true }), sfx('cheer'), say('li', 'İttifak!', 1.6, 0.2), say('enc', 'İttifak!', 1.6, 0.2), say('ne', 'İttifak.', 1.6, 0.2)), remove('tbl')],
      (c, info) => [par(go(70), S('sails', { state: 'full' }), move('buoy', { y: -c.len / 2 - 60 }, 3), move('li', { y: info.success ? 40 : -120, sails: 'full' }, 3, { wait: false }), move('enc', { y: info.success ? 60 : -80, sails: 'full' }, 3, { wait: false }), move('ne', { y: info.success ? -60 : -200 }, 3, { wait: false })), ...(info.success ? [par(S('flag', { up: true }), sfx('cheer'), float('Birinci!', '#ffd76a'))] : [par(move('enc', { x: c.beam / 2 + 50 }, 1)), scrape(1, 20)])],
      () => [par(S('flag', { up: true, color: '#24426b' }), sfx('flag')), cap('Kimsenin kuralına bağlı değilim.', 2.2, 0.6), say('enc', 'Saygı duyarız.', 1.8, 0.4)],
    ],
    exit: (c) => [remove('buoy'), ...councilOut(c)],
  })),

  CH_X3_ARMADA_1: def((ev, side) => ({
    weather: nightW,
    setup: (c) => armada(c),
    approach: (c) => [...armadaIn(c), lookout('Yelkenler dolu, ama yerinden kıpırdamıyor.', { dur: 2.2 })],
    intro: () => [T(0.3)],
    opts: [
      () => [deckProp('x3lamp', 'lantern', 'bow'), work(['CAPTAIN'], 'bow', 'Fenerle yanıt veriyor', 4, 0.6), ...[0, 1, 2].map(() => [par(S('flash', {}), sfx('bell')), T(0.4)]), S('opts', { id: 'lan', opts: { sync: true } }), float('Bir ışık daha yandı', '#d8f0ff', 'enc'), remove('x3lamp')],
      (c, info) => [par(go(10), S('shipTo', { x: side * 30 })), T(1), stop(), ...(info.success ? [say('enc', '…', 1.2, 0.4), float('Huzurlu bir bekleyiş', '#d8f0ff', 'enc')] : [scrape(side, 18)])],
      () => [deckProp('rec', 'mapScroll', 'bow'), work(['CAPTAIN'], 'bow', 'Saatlerce izliyor', 4, 0.6), remove('rec')],
    ],
    exit: () => armadaOut(),
  })),
  CH_X3_ARMADA_2: def((ev, side) => ({
    weather: nightW,
    setup: (c) => [...armada(c), spawn({ id: 'clk', kind: 'bigClock', x: c.side * (c.beam / 2 + 110), y: -340, layer: 3, opts: {} })],
    approach: (c) => [...armadaIn(c), move('clk', { y: -40 }, 0.1), sfx('bell'), crewSay([], 'Her şey donmuş… saat dışında.', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [plank(side), board('cpx', 'captain', rail(side), rail(side), { dx: side * 24, endState: 'work' }), ...(info.success ? [S('opts', { id: 'clk', opts: { sync: true, ring: true } }), remove('fr'), swapCrew('enc', ['sailor', 'oldSailor', 'sailor']), say('enc', 'Teşekkürler…', 1.8, 0.4), swapCrew('enc', ['frozen', 'frozen', 'frozen'])] : [S('opts', { id: 'clk', opts: { ring: true } }), float('Ritim kaçtı', '#c8c8c8', 'clk')]), unboard('cpx', rail(side)), unhook('enc')],
      () => [plank(side), board('cpx', 'sailor', rail(side), rail(side), { dx: side * 24, endState: 'work' }), work([], rail(side), 'Fenerlere yağ koyuyor', 4, 0.6), unboard('cpx', rail(side)), unhook('enc')],
      (c, info) => [plank(side), board('cpx', 'sailor', rail(side), rail(side), { dx: side * 24 }), ...(info.success ? [S('coins', { from: 'enc', to: 'ship', n: 8 })] : [par(S('opts', { id: 'clk', opts: { ring: true } }), S('shake', { amount: 10 }), sfx('impact'))]), unboard('cpx', rail(side)), unhook('enc')],
    ],
    skip: () => ['gold'],
    exit: () => armadaOut(),
  })),
  CH_X3_ARMADA_3: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.12 })],
    setup: (c) => [...armada(c), spawn({ id: 'mech', kind: 'mechanism', x: c.side * (c.beam / 2 + 110), y: -340, layer: 3, opts: {} })],
    approach: (c) => [...armadaIn(c), move('mech', { y: -40 }, 0.1), plank(side), board('cpx', 'captain', rail(side), rail(side), { dx: side * 24, endState: 'work' })],
    intro: () => [T(0.3)],
    opts: [
      () => [deckProp('book', 'mapScroll', rail(side)), work(['CAPTAIN'], rail(side), 'Defteri kopyalıyor', 4, 0.8), S('icon', { icon: 'book', from: 'enc', to: 'ship' })],
      (c, info) => [work(['CREW_GROOT', 'CAPTAIN'], rail(side), 'Dişlileri sıraya diziyor', 4, 0.8), ...(info.success ? [par(S('opts', { id: 'mech', opts: { on: true } }), S('opts', { id: 'lan', opts: { sync: true } }), sfx('magic'))] : [par(sfx('creak'), fx('spark', 'mech', 10))])],
      (c, info) => [...(info.success ? [S('throw', { from: 'mech', to: 'ship', kind: 'crate', good: 'GOOD_GOLD_BAR', arc: 14 })] : [par(fx('spark', 'mech', 26), S('shake', { amount: 10 }), sfx('impact'))])],
    ],
    exit: () => [unboard('cpx', rail(side)), remove('book'), remove('mech'), ...armadaOut()],
  })),
  CH_X3_ARMADA_4: def((ev, side) => ({
    weather: nightW,
    setup: (c) => armada(c, 2),
    approach: (c) => [...armadaIn(c), crewSay([], 'Filonun kaderi bizim elimizde.', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      // serbest bırak (kanıtla): fenerler söner, tayfa çözülür, gemiler normal renge döner ve ufka açılır
      (c) => [work(['CAPTAIN'], 'bow', 'Kanıtı fenerlere tutuyor', 3, 0.6), par(S('opts', { id: 'lan', opts: { off: true } }), S('opts', { id: 'lan2', opts: { off: true } }), sfx('magic')), remove('fr'), par(S('set', { id: 'enc', props: { style: 'merchant', crewNpc: ['sailor', 'oldSailor', 'sailor'] } }), S('set', { id: 'a2', props: { style: 'merchant', crewNpc: ['sailor', 'sailor'] } })), say('enc', 'Elveda, yolcu!', 2, 0.4), par(move('enc', { y: -460, sails: 'full' }, 3.4), move('a2', { y: -500, sails: 'full' }, 3.4, { wait: false }))],
      (c) => [S('coins', { from: 'ship', to: 'lan', n: 5 }), work(['CAPTAIN'], 'bow', 'Fenerlere yağ koyuyor', 3, 0.6), par(S('opts', { id: 'lan', opts: { off: true } }), S('opts', { id: 'lan2', opts: { off: true } }), sfx('magic')), remove('fr'), par(S('set', { id: 'enc', props: { style: 'merchant', crewNpc: ['sailor', 'oldSailor', 'sailor'] } }), S('set', { id: 'a2', props: { style: 'merchant', crewNpc: ['sailor', 'sailor'] } })), par(move('enc', { y: -460, sails: 'full' }, 3.4), move('a2', { y: -500, sails: 'full' }, 3.4, { wait: false }))],
      // koru: fenerler sabit yanar, kaptan başını eğer; gemi bekçi olarak bir süre yanında kalır
      () => [par(S('flag', { up: true, color: '#6a8aa0' }), sfx('flag')), work(['CAPTAIN'], 'bow', 'Bekçilik sözü veriyor', 3, 0.6), par(S('opts', { id: 'lan', opts: { sync: true } }), S('opts', { id: 'lan2', opts: { sync: true } })), say('enc', '…', 1.4, 0.6), S('flag', { up: false })],
      // kurtar: vinçle hazine; başarısızlık → fenerler parlar, donmuş gemiler sarsılır
      (c, info) => [plank(side), work([], rail(side), 'Vinci çalıştırıyor', 3, 0.8), ...(info.success ? [S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_GOLD_BAR', arc: 16 }), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_ANTIQUE', arc: 16 }), S('opts', { id: 'lan', opts: { off: true } })] : [par(S('opts', { id: 'lan', opts: { blind: true } }), S('flash', {})), scrape(side, 30)]), unhook('enc')],
    ],
    skip: () => ['gold', 'gained'],
    exit: () => armadaOut(),
  })),

  CH_X3_ATLAS_1: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'seaGlyphs', x: 0, y: -300, opts: { fade: 0.6 } })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 70 }, 3), slow(4), cam({ x: 0, y: -60 }, 0.6, 1)), stop(), lookout('Su bir adres yazıyor!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      () => [deckProp('rec', 'mapScroll', 'bow'), work(['CAPTAIN'], 'bow', 'Adresi deftere geçiriyor', 4, 0.8), S('opts', { id: 'enc', opts: { decoded: true } })],
      (c, info) => [work(['CREW_FINN', 'CAPTAIN'], 'bow', 'İskandil ipini atıyor', 4, 0.6), S('throw', { from: 'bow', to: 'enc', kind: 'rope', arc: 6 }), ...(info.success ? [float('Dipte taş levha', '#aaf8f0', 'enc')] : [])],
      () => [S('opts', { id: 'enc', opts: { fade: 0.2 } }), go(24)],
    ],
    exit: () => [remove('rec'), remove('enc'), go(30)],
  })),
  CH_X3_ATLAS_2: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.04 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'island', x: side * (c.beam / 2 + 110), y: -380, opts: { r: 40 } }), spawn({ id: 'mir', kind: 'island', x: -side * (c.beam / 2 + 110), y: -380, layer: 0, opts: { r: 40 } }), spawn({ id: 'sun', kind: 'lightBeam', x: side * (c.beam / 2 + 110), y: -460, layer: 3, opts: {} })],
    approach: (c) => [par(slow(5), cam({ x: 0, y: -80 }, 0.6, 0.92), move('enc', { y: -50 }, 3), move('mir', { y: -50, alpha: 0.55 }, 3, { wait: false }), move('sun', { y: -100 }, 3, { wait: false })), stop(), lookout('İki ufuk var!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work(['CAPTAIN'], 'bow', 'Güneşin çizgisini ölçüyor', 4, 0.8), ...(info.success ? [move('mir', { alpha: 0 }, 1.6), float('Gerçek ufuk', '#ffe080', 'enc')] : [T(0.6)])],
      (c, info) => [par(go(30), S('shipTo', { x: -side * 40 })), ...(info.success ? [spawn({ id: 'ch', kind: 'chest', x: -side * 30, y: -c.len / 2 - 20 }), S('pickup', { id: 'ch', prefer: [], task: 'Haritacı sandığını alıyor' })] : [move('mir', { alpha: 0 }, 1), scrape(-side, 22)])],
      (c) => [par(go(24), S('heel', { rot: side * 0.1 })), move('mir', { alpha: 0 }, 2), S('heel', { rot: 0 })],
    ],
    exit: () => [remove('ch'), S('shipTo', { x: 0 }), ...driftAll(), remove('mir'), remove('sun'), weather({ restore: true })],
  })),
  CH_X3_ATLAS_3: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'workshopIsle', x: side * (c.beam / 2 + 110), y: -360, opts: {} })],
    approach: (c) => [par(move('enc', { y: -40 }, 3.4), slow(4), cam({ x: side * 50, y: -20 }, 0.3, 1)), stop()],
    intro: () => [T(0.3)],
    opts: [
      (c) => landing(c, side, ['cartographer'], [work(['CAPTAIN'], rail(side), 'Gördüklerini anlatıyor', 3), S('icon', { icon: 'map', from: 'enc', to: 'boat' })], [], 70),
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 5 }), S('icon', { icon: 'scroll', from: 'enc', to: 'ship' })],
      (c, info) => [deckProp('tbl', 'mapTable', 'center'), work(['CAPTAIN'], 'center', 'Kendi rotasını çiziyor', 5, 0.8), ...(info.success ? [par(sfx('cheer'), float('Haritacılar hayran', '#ffe080', 'enc'))] : []), remove('tbl')],
    ],
    exit: () => [remove('boat'), ...driftAll()],
  })),
  CH_X3_ATLAS_4: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.06 })],
    setup: () => [],
    mainId: null,
    approach: () => [par(slow(6), cam({ x: 0, y: 0 }, 0.3, 1.08)), deckProp('tbl', 'mapTable', 'center'), crewSay([], 'Atlas tamam, kaptan.', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      () => [work(['CAPTAIN'], 'center', 'Sayfaları mühürlüyor', 4, 0.8), spawn({ id: 'bt', kind: 'boat', x: 160, y: 0, opts: { npc: 'cartographer' } }), S('icon', { icon: 'book', from: 'ship', to: 'bt' }), move('bt', { x: 260, y: -360 }, 3), remove('bt'), par(sfx('cheer'), float('Atlas yayımlandı', '#ffe080'))],
      () => [work(['CAPTAIN'], 'center', 'Atlas\'ı kasaya kilitliyor', 4, 0.8), S('icon', { icon: 'lock', from: 'center', to: 'ship' })],
      (c) => [work(['CAPTAIN'], rail(side), 'Sayfaları dalgalara bırakıyor', 4, 0.8), ...[0, 1, 2].map(() => [S('throw', { from: { rail: side }, to: { x: side * (c.beam / 2 + 50), y: 20 }, kind: 'crate', arc: 8 }), T(0.3)]), spawn({ id: 'gl', kind: 'seaGlyphs', x: side * (c.beam / 2 + 60), y: 20, opts: { fade: 0.8 } }), ...[0.5, 0.1].map((f) => [S('opts', { id: 'gl', opts: { fade: f } }), T(0.5)]), remove('gl')],
    ],
    exit: () => [remove('tbl'), remove('bt'), remove('gl'), weather({ restore: true }), go(30)],
  })),

  CH_X3_FLAGS_1: def((ev, side) => ({
    setup: (c) => factions(c),
    approach: (c) => [...factionsIn(c), say('b1', 'Sahte bayrak onların işi!', 2, 0.2), say('enc', 'Hayır, onların!', 1.8, 0.2), say('b3', 'Hah!', 1.4, 0.4)],
    intro: () => [T(0.3)],
    opts: [
      () => [work(['CAPTAIN'], 'center', 'Üç haberciyi dinliyor', 5, 0.8)],
      () => [S('icon', { icon: 'crown', from: 'b1', to: 'ship' }), say('b1', 'Minnettarız.', 1.6, 0.4)],
      () => [S('icon', { icon: 'scroll', from: 'enc', to: 'ship' }), say('enc', 'Lonca unutmaz.', 1.6, 0.4)],
      () => [cap('Bunu sonra konuşalım.', 1.8, 0.4)],
    ],
    exit: () => factionsOut(),
  })),
  CH_X3_FLAGS_2: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'guild', 2, { x: side * 240, y: -320, rot: Math.PI * 0.9, scale: 0.75, crewNpc: ['guild', 'customs'] })],
    approach: (c) => [par(slow(5), cam({ x: side * 30, y: 0 }, 0.3, 1.04)), ...approachShip(c, 'enc', 2, 0.75), plank(side), deckProp('tbl', 'mapTable', 'center')],
    intro: () => [T(0.3)],
    opts: [
      () => [board('g1', 'guild', rail(side), 'center', { endState: 'work' }), work(['CAPTAIN'], 'center', 'Defterleri karşılaştırıyor', 4, 0.8), float('İki ad, tek gemi', '#ffe080'), unboard('g1', rail(side))],
      () => [S('coins', { from: 'ship', to: 'enc', n: 4 }), board('o1', 'customs', rail(side), 'center', { endState: 'work' }), S('icon', { icon: 'scroll', from: 'o1', to: 'ship' }), unboard('o1', rail(side))],
      (c, info) => [spawn({ id: 'wb', kind: 'rowboat', x: -side * 160, y: -200, opts: { npcs: ['smuggler'], dir: 'down' } }), move('wb', { x: besides(c, 20, -side), y: 0 }, 2.4), ...(info.success ? [say('wb', 'O bayrağı diken adamı gördüm.', 2.2, 0.4)] : [say('wb', '…', 1.2, 0.4)]), move('wb', { y: 420 }, 2.4), remove('wb')],
    ],
    exit: (c) => [remove('tbl'), unhook('enc'), offAll(rail(side)), sailAwayUp(c), remove('enc'), go(30)],
  })),
  CH_X3_FLAGS_3: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.05 })],
    setup: (c) => factions(c),
    approach: (c) => [...factionsIn(c), deckProp('tbl', 'strategyTable', 'center'), board('t1', 'officer', 'railL', 'center', { dx: -12, endState: 'sit', wait: false }), board('t2', 'guild', 'railR', 'center', { dx: 12, endState: 'sit', wait: false }), board('t3', 'redCaptain', 'bow', 'center', { dy: -10, endState: 'sit' })],
    intro: () => [T(0.3)],
    opts: [
      () => [work(['CAPTAIN'], 'center', 'Kanıtları masaya koyuyor', 4, 0.8), par(sfx('cheer'), S('flag', { up: true }), S('say', { actor: 't1', text: 'Barış.', dur: 1.4 }), S('say', { actor: 't2', text: 'Barış.', dur: 1.4 }), S('say', { actor: 't3', text: 'Hmph. Barış.', dur: 1.6 }))],
      () => [S('coins', { from: 'ship', to: 'center', n: 6 }), deckProp('wine', 'barrel', 'center', { dx: 14 }), par(sfx('cheer'), S('flag', { up: true }))],
      () => [work(['CAPTAIN'], 'center', 'Suçluyu açıklıyor', 4, 0.8), par(S('shake', { amount: 3 }), S('say', { actor: 't3', text: 'Bu bir iftira!', dur: 1.6 }))],
      () => [S('coins', { from: 'center', to: 'ship', n: 10 }), cap('Sessizliğin bir bedeli var.', 2, 0.4)],
    ],
    skip: () => ['gold'],
    exit: () => [remove('wine'), S('flag', { up: false }), ...factionsOut()],
  })),
});

// ═══════════ YANKILAR, TAKİP, EPİLOG ═══════════
const echo = (style, line, npc, setupExtra = []) => def((ev, side) => ({
  setup: (c) => [shipEntity(c, 'enc', style, 2, { x: side * 240, y: -340, rot: Math.PI, scale: 0.7, crewNpc: [npc, 'sailor'] }), ...setupExtra],
  approach: (c) => [par(slow(10), cam({ x: side * 30, y: -30 }, 0.3, 0.96), move('enc', { x: side * 170, y: -60 }, 3)), say('enc', line, 2.4, 0.6)],
  intro: () => [T(0.2)],
  opts: [() => [par(S('flag', { up: true }), sfx('flag')), T(1), S('flag', { up: false })]],
  exit: () => [move('enc', { y: 440 }, 3), remove('enc'), go(30)],
}));

Object.assign(X3_SCENES, {
  EVT_X3_ECHO_COUNCIL: echo('liora', 'Konsey seni hatırlıyor, kaptan!', 'liora'),
  EVT_X3_ECHO_ARMADA: def((ev, side) => ({
    weather: nightW,
    setup: (c) => [0, 1, 2].map((i) => spawn({ id: `l${i}`, kind: 'armadaLantern', x: c.side * (c.beam / 2 + 60 + i * 60), y: -40 - i * 20, layer: 3, opts: { ph: i } })),
    mainId: 'l1',
    approach: () => [par(slow(10), cam({ x: 0, y: -80 }, 0.6, 0.94)), ...[0, 1, 2].map((i) => [S('opts', { id: `l${i}`, opts: { sync: true } }), T(0.4)])],
    intro: () => [T(0.2)],
    opts: [() => [deckProp('x3lamp', 'lantern', 'bow'), par(S('flash', {}), sfx('bell')), remove('x3lamp'), ...[0, 1, 2].map((i) => S('opts', { id: `l${i}`, opts: { off: true } }))]],
    exit: () => [...[0, 1, 2].map((i) => remove(`l${i}`)), weather({ restore: true }), go(30)],
  })),
  EVT_X3_ECHO_ATLAS: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'boat', x: side * 200, y: -300, opts: { npc: 'cartographer' } })],
    approach: (c) => [par(slow(8), move('enc', { x: besides(c, 30), y: -10 }, 3)), say('enc', 'Haritacılardan bir mektup!', 2, 0.4)],
    intro: () => [T(0.2)],
    opts: [() => [S('icon', { icon: 'scroll', from: 'enc', to: 'ship' }), work(['CAPTAIN'], 'center', 'Mektubu okuyor', 3, 0.4)]],
    exit: () => [move('enc', { y: 420 }, 2.6), remove('enc'), go(30)],
  })),
  EVT_X3_ECHO_FLAGS: echo('warship', 'Üç bayrağın selamı!', 'officer'),

  // Rakip takibi: takipçi kaptanın kendi gemisi (−2 ilişki)
  EVT_X3_PURSUIT: def((ev, side) => ({
    setup: (c) => { const k = c.run?.x3?.pursuit || 'boran'; return [capShip(c, 'enc', k, { x: side * 80, y: 380, rot: 0, level: k === 'boran' ? 3 : 2 })]; },
    approach: (c) => [par(cam({ x: 0, y: 80 }, 0.6, 0.92), move('enc', { y: 220 }, 2.6)), lookout('Arkamızda tanıdık bir yelken!', { dur: 2 }), move('enc', { y: 160, x: side * 90 }, 1.8), say('enc', 'Hesabımız kapanmadı!', 2, 0.6), react('danger', side)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(go(80), sfx('depart'), S('sails', { state: 'full' })), ...(info.success ? [move('enc', { y: 460 }, 3)] : [move('enc', { y: c.len / 2 + 30, x: side * 60 }, 1.6), scrape(side, 18)])],
      (c) => [stop(), move('enc', { x: alongside(c, 0.78, 2, 22), y: 0 }, 2.4), S('coins', { from: 'ship', to: 'enc', n: 8 }), say('enc', 'Peki… bu seferlik.', 2, 0.6)],
      (c, info) => [S('fire', { from: 'ship', to: 'enc', n: 2, hit: info.success }), ...(info.success ? [par(fx('splinter', 'enc', 20), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_GOLD_BAR', arc: 18 })), move('enc', { y: 460 }, 3)] : [S('fire', { from: 'enc', to: 'ship', n: 3, hit: true })])],
    ],
    skip: () => ['gold'],
    exit: () => [move('enc', { y: 480 }, 2.6), remove('enc'), go(30)],
  })),

  // Denizcilerin Mirası: limanda üç kaptan gemisi, fenerler ve kutlama (ek XP yok)
  EVT_X3_EPILOGUE: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.06 })],
    setup: (c) => [capShip(c, 'li', 'liora', { x: -c.beam / 2 - 90, y: -170, rot: 0, scale: 0.6 }), capShip(c, 'enc', 'boran', { x: c.beam / 2 + 100, y: -170, rot: 0, scale: 0.6, level: 3 }), capShip(c, 'ne', 'neris', { x: c.beam / 2 + 210, y: -40, rot: 0, scale: 0.5 })],
    mainId: 'ne',
    approach: () => [par(cam({ x: 0, y: -100 }, 0.6, 0.92), sfx('cheer')), say('ne', 'Hikâyen senden önce geldi, kaptan.', 2.4, 0.6)],
    intro: () => [T(0.3)],
    opts: [() => [par(S('flag', { up: true }), sfx('cheer'), glowLight('fw', 0, -200, '#ffe080', 90)), gather('center', 'Şarkı söylüyor', { n: 5, dur: 6 }), ...pets('Hav! Hav!', 'Mrraav!'), T(1)]],
    exit: () => [remove('fw'), remove('li'), remove('enc'), remove('ne'), S('flag', { up: false }), weather({ restore: true })],
  })),
});

// Paket 3 enjekte seçenekleri (kaptan dostluğu/işbirliği, Konsey ittifakı, İşaret Prizması) için ortak vuruşlar
export function x3Injected(c, info, encId) {
  const k = info.key || '';
  const enc = encId && c.world.get(encId) ? encId : null;
  if (/^__x3ally_/.test(k)) return [...(enc ? capBeat(enc, 'Birlikte yapalım, dostum!') : []), par(S('flash', {}), sfx('cheer')), wait(0.6)];
  if (/^__x3talk_/.test(k)) return [S('crewWork', { prefer: ['CAPTAIN'], at: rail(c.side), task: 'Eski günleri anıyor', dur: 3, hold: 0.6 }), enc ? S('say', { id: enc, text: info.success ? 'Hah! O günleri unutmadım.' : 'Bugün sırası değil.', dur: 2, hold: 0.6 }) : wait(0.6)];
  if (k === '__x3help') {
    const sd = c.side;
    return [
      ...['liora', 'boran', 'neris'].map((cap, i) => S('spawn', { e: { id: `x3h${i}`, kind: 'ship', style: CAPTAINS[cap].style, level: 2, x: -sd * (240 + i * 50), y: -340 - i * 40, rot: 0, scale: 0.6, sails: 'full', crewNpc: [cap], drift: false, encounter: true } })),
      par(...[0, 1, 2].map((i) => S('move', { id: `x3h${i}`, to: { x: -sd * (130 + i * 40), y: -120 - i * 30 }, dur: 2.6 })), S('sound', { name: 'horn' })),
      enc ? S('move', { id: enc, to: { y: -460, x: sd * 260, alpha: 0.4 }, dur: 3 }) : wait(0.8),
      par(...[0, 1, 2].map((i) => S('move', { id: `x3h${i}`, to: { y: -480 }, dur: 2.6 }))),
      ...[0, 1, 2].map((i) => S('remove', { id: `x3h${i}` })),
    ];
  }
  if (k === '__prism') return [S('deckProp', { id: 'x3prism', kind: 'glowRing', at: 'bow', opts: { col: '#b8f0ff' } }), S('crewWork', { prefer: ['CAPTAIN'], at: 'bow', task: 'Prizmayı ışığa tutuyor', dur: 3, hold: 0.6 }), ...[0, 1].map(() => [par(S('flash', {}), S('sound', { name: 'magic' })), wait(0.4)]), S('spawn', { e: { id: 'x3beam', kind: 'sparkles', x: 0, y: -160, layer: 2, opts: { r: 80, col: '#b8f0ff' }, drift: false, encounter: true } }), wait(1), S('remove', { id: 'x3beam' }), S('remove', { id: 'x3prism' })];
  return null;
}

INJ_HOOKS.push(x3Injected);
