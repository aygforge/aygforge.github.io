// YAŞAYAN DENİZLER (X1) — 25 bağımsız event, 14 zincir aşaması, hafıza takipleri, yankılar ve
// sözleşme sunumları için imza sahneleri. Hepsi mevcut sahne kitiyle (EncounterDirector ilkelleri) kurulur.
import {
  S, par, wait, def, rail, shipEntity, alongside, besides, cap, crewSay, only, lookout, say, slow, stop, go, cam,
  react, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, weather, call, driftAll, offAll, oi,
  landing, dive, pierX,
} from '../kit.js';
import { CONTRACTS, FACTIONS } from '../../systems/X1System.js';

const T = (n) => wait(n);
const rock = (a = 0.06) => [par(S('heel', { rot: a }), S('shake', { amount: 6 }), sfx('creak')), T(0.35), S('heel', { rot: -a }), T(0.35), S('heel', { rot: 0 })];
const pull = (c, id, level = 2, scale = 1, gap = 14) => [move(id, { x: c.side * 190, y: -20, rot: 0, sails: 'furled' }, 2.2), move(id, { x: alongside(c, scale, level, gap), y: -6 }, 1.5)];
const plank = (side) => call((d) => { const e = d.world.get('enc'); const L = d.world.layout(); if (e) e.hooks = [{ x0: e.x - side * 16, y0: e.y, x1: d.world.ship.x + side * (L.beam / 2 - 6), y1: d.world.ship.y, plank: true }]; d.hooks.sfx?.('creak'); });
const unplank = () => call((d) => { const e = d.world.get('enc'); if (e) e.hooks = null; });
const sailAway = (c, id = 'enc') => move(id, { y: -380, x: c.side * 230, rot: Math.PI * 0.85, sails: 'full' }, 3);
/** Aktif sözleşme (karşılaşmayı tetikleyen kuyruk kaydından) */
function contractOf(c) {
  const host = c.run.phase === 'arrival' ? c.run.arrival : c.run.voyage;
  const entry = host?.queue?.[host.pos - 1];
  return c.run.x1?.contracts?.find((q) => q.id === entry?.contract) || c.run.x1?.contracts?.[0] || null;
}
const facStyle = (f) => (f === 'guild' ? 'guild' : f === 'crown' ? 'warship' : f === 'red' ? 'red' : 'merchant');
const facNpc = (f) => (f === 'guild' ? 'guild' : f === 'crown' ? 'officer' : f === 'red' ? 'smuggler' : 'merchant');

export const X1_SCENES = {
  // ════════ A. DENİZ TEHLİKELERİ ════════
  EVT_X1_D01: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'crab', x: besides(c, 30), y: -220, opts: { water: true, dir: -side } })],
    approach: (c) => [
      par(move('enc', { y: -10 }, 3.5), slow(6), cam({ x: side * 30, y: -10 }, 0.3, 1.05)),
      par(react('danger', side), sfx('splash'), fx('splash', { rail: side }, 30)),
      par(move('enc', { x: side * (c.beam / 2 - 16), y: 0 }, 1.6), S('set', { id: 'enc', props: { layer: 2, opts: { dir: -side } } }), sfx('creak'), S('shake', { amount: 5 })),
      par(gather(rail(-side), 'Yengeçten geri çekiliyor', { n: 4, run: true, dur: 6 }), crewSay([], 'Kıskaçlarına dikkat!', { dur: 2.2 })),
    ],
    intro: () => [sfx('roar'), T(0.4)],
    opts: [
      (c) => [cap('Ona balık atın!', 1.8, 0.4), S('cargoOverboard', { goods: [], side }), S('throw', { from: 'ship', to: { x: besides(c, 60), y: 30 }, kind: 'crate', good: 'GOOD_FISH', arc: 24, burst: 'splash', sfx: 'splash' }), par(move('enc', { x: besides(c, 64), y: 40 }, 1.6), fx('splash', { rail: side }, 24), sfx('splash')), move('enc', { alpha: 0 }, 1.2)],
      (c) => [par(work(['CREW_BJORN'], rail(side), 'Yengeçle dövüşüyor', 5, 0.8), only('CREW_BJORN', 'HAAA! Gel bakalım!', { dur: 2 })), ...[0, 1, 2].map(() => [fx('spark', 'enc', 14), sfx('impact'), S('shake', { amount: 3 }), T(0.45)]), par(move('enc', { x: besides(c, 60), y: 30, alpha: 0.3 }, 1.4), fx('splash', { rail: side }, 30), sfx('splash')), S('coins', { from: { x: side * 20, y: 0 }, to: 'ship', n: 10 })],
      (c, info) => [gather(rail(side), 'Halatla yengeci itiyor', { n: 4, run: true, dur: 4 }), S('throw', { from: 'ship', to: 'enc', kind: 'rope', arc: 10 }), T(0.8), ...(info.success ? [par(move('enc', { x: besides(c, 60), y: 20 }, 1.2), fx('splash', { rail: side }, 30), sfx('splash')), move('enc', { alpha: 0 }, 1)] : [par(fx('splinter', 'ship', 30), S('shake', { amount: 10 }), sfx('impact')), deckProp('dmg', 'scorch', 'center', { opts: { r: 10 } }), par(move('enc', { x: besides(c, 60), y: 20, alpha: 0 }, 1.6), sfx('splash'))])],
    ],
    skip: () => ['lost'],
    outcome: (c, info) => (info.lost.length ? [] : []),
    exit: () => [remove('enc'), remove('dmg'), T(0.6)],
  })),

  EVT_X1_D02: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [spawn({ id: 'd1', kind: 'diver', x: besides(c, 40), y: -40, alpha: 0 }), spawn({ id: 'd2', kind: 'diver', x: besides(c, 56), y: 10, alpha: 0 }), spawn({ id: 'bub', kind: 'bubbles', x: besides(c, 46), y: -10, opts: { n: 14, w: 30, h: 50 } })],
    approach: (c) => [
      par(slow(8), cam({ x: side * 30, y: 0 }, 0.3, 1.05)),
      par(move('d1', { alpha: 1, x: besides(c, 14) }, 2.4), move('d2', { alpha: 1, x: besides(c, 18) }, 2.4, { wait: false })),
      par(remove('d1'), remove('d2'), board('t1', 'diver', rail(side), 'cargo', { dx: -6, wait: false }), board('t2', 'diver', rail(side), 'cargo', { dx: 6 })),
      lookout('Ambarda biri var! Dalgıçlar!', { dur: 2.2 }),
    ],
    intro: () => [react('danger', side), T(0.4)],
    opts: [
      (c, info) => [par(sfx('bell'), gather('cargo', 'Hırsızları kovalıyor', { n: 4, run: true, dur: 5 }), cap('Alarm! Herkes güverteye!', 2, 0.4)), ...(info.success ? [par(unboard('t1', rail(side)), unboard('t2', rail(side), { wait: false })), par(fx('splash', { rail: side }, 30), sfx('splash'))] : [par(unboard('t1', rail(side), { carry: 'GOOD_SPICE' }), unboard('t2', rail(side), { wait: false, carry: 'GOOD_WINE' })), par(fx('splash', { rail: side }, 30), sfx('splash'))])],
      (c) => [par(work(['CREW_YARA'], rail(side), 'Karanlığa nişan alıyor', 4, 1), only('CREW_YARA', 'Gördüm seni.', { dur: 1.8 })), S('throw', { from: { rail: side }, to: { x: besides(c, 20), y: -10 }, kind: 'arrow', arc: 6, dur: 0.5, burst: 'spark' }), par(unboard('t1', rail(side)), unboard('t2', rail(side), { wait: false })), par(fx('splash', { rail: side }, 30), sfx('splash'))],
      (c, info) => [work([], rail(side), 'Tırmanma halatlarını kesiyor', 3, 1), par(sfx('hook'), fx('spark', { rail: side }, 10)), ...(info.success ? [par(unboard('t1', rail(side)), unboard('t2', rail(side), { wait: false })), par(fx('splash', { rail: side }, 30), sfx('splash'))] : [par(fx('splinter', { rail: side }, 20), S('shake', { amount: 6 })), par(unboard('t1', rail(side)), unboard('t2', rail(side), { wait: false }))])],
    ],
    outcome: (c, info) => (info.lost.length ? [S('cargoOverboard', { goods: info.lost, to: { x: besides(c, 50), y: 30 }, arc: 18 })] : [float('Hırsızlar kaçtı!', '#9ae0a0')]),
    skip: () => ['lost'],
    exit: () => [remove('bub'), weather({ restore: true }), T(0.6)],
  })),

  EVT_X1_D03: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', fx: ['rain'], dark: 0.12 })],
    setup: () => [],
    approach: (c) => [
      par(S('speed', { v: 30 }), sfx('creak')), ...rock(0.08),
      par(sfx('impact'), S('shake', { amount: 12 }), deckProp('mast', 'fallenMast', 'mast', { dx: side * 6, opts: { len: 70 } }), S('sails', { state: 'furled' }), S('speed', { v: 6 })),
      par(react('danger', side), gather(rail(-side), 'Devrilen direkten kaçıyor', { n: 4, run: true, dur: 5 }), crewSay([], 'Direk gidiyor! Kaçın!', { dur: 2 })),
    ],
    intro: () => [cap('Ana direk kırıldı…', 2.2, 0.8)],
    opts: [
      () => [par(work(['CREW_GROOT'], 'mast', 'Direği omzuyla kaldırıyor', 6, 1), only('CREW_GROOT', 'Halatları gerin! Kaldırıyorum!', { dur: 2.2 })), gather('mast', 'Halatı geriyor', { n: 3, dur: 5 }), ...[0, 1, 2].map(() => [sfx('repair'), fx('spark', 'ship', 10), T(0.5)]), par(remove('mast'), S('sails', { state: 'full' }), sfx('cheer'))],
      (c) => [spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 20), y: 180, opts: { npcs: ['villager', 'villager'], dir: 'up' } }), move('boat', { y: 10 }, 2.4), S('coins', { from: 'ship', to: 'boat', n: 8 }), board('m1', 'villager', rail(side), 'mast', { endState: 'work' }), board('m2', 'villager', rail(side), 'mast', { dy: 10, endState: 'work', wait: false }), ...[0, 1].map(() => [sfx('repair'), fx('spark', 'ship', 10), T(0.6)]), remove('mast'), unboard('m1', rail(side)), unboard('m2', rail(side), { wait: false })],
      () => [par(cap('Yamalı direkle devam edeceğiz.', 2.2, 0.4), work(['CREW_GROOT', 'CREW_LENA'], 'mast', 'Direği geçici olarak bağlıyor', 4)), par(S('sails', { state: 'furled' }), S('speed', { v: 14 })), ...rock(0.05)],
    ],
    skip: () => ['gold'],
    exit: () => [remove('mast'), remove('boat'), offAll(rail(side)), weather({ restore: true }), T(0.6)],
  })),

  EVT_X1_D04: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'bigNet', x: 0, y: -260, opts: { r: 34, fish: 12 } })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 14 }, 3.6), S('speed', { v: 20 }), cam({ x: 0, y: -80 }, 0.3)), par(S('speed', { v: 0 }), S('sails', { state: 'furled' }), S('shake', { amount: 6 }), sfx('creak'), react('danger', side)), lookout('Pruvaya dev bir ağ dolandı!', { dur: 2.2 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [work([], 'bow', 'Ağı kesiyor', 3, 1.4), par(sfx('hook'), fx('spark', { rail: 0, dy: -c.len / 2 }, 12)), par(S('set', { id: 'enc', props: { drift: true } }), go(26))],
      (c, info) => [gather('bow', 'Ağı çekiyor', { n: 4, run: true, dur: 5, hold: 1 }), crewSay([], 'Hep birlikte… ÇEK!', { dur: 1.8 }), ...(info.success ? [par(move('enc', { y: -c.len / 2 + 20 }, 1.6), sfx('splash')), spawn({ id: 'box', kind: 'chest', x: 0, y: -c.len / 2 - 4 }), S('pickup', { id: 'box', prefer: ['CREW_GROOT'], task: 'Sandığı çekiyor' }), remove('enc')] : [par(sfx('impact'), S('shake', { amount: 9 }), fx('splinter', { rail: 0, dy: -c.len / 2 + 6 }, 26)), S('set', { id: 'enc', props: { drift: true } })])],
      (c) => [par(work(['CREW_MIRA'], 'bow', 'Ağın altına dalıyor', 3, 1), only('CREW_MIRA', 'Düğümleri tek tek çözerim.', { dur: 2 })), par(fx('splash', { rail: 0, dy: -c.len / 2 }, 24), sfx('splash'), spawn({ id: 'bub', kind: 'bubbles', x: 0, y: -c.len / 2 - 20, opts: { n: 16, w: 30, h: 30 } })), T(1.8), par(S('set', { id: 'enc', props: { drift: true } }), remove('bub'), S('coins', { from: { x: 0, y: -c.len / 2 - 20 }, to: 'ship', n: 6 }))],
    ],
    skip: () => ['gold'],
    exit: () => [...driftAll(), T(0.8)],
  })),

  EVT_X1_D05: def((ev, side) => ({
    thieves: true,
    setup: (c) => [shipEntity(c, 'pir', 'pirate', 3, { x: side * 220, y: -300, scale: 0.85 }), spawn({ id: 'enc', kind: 'rowboat', x: side * 170, y: -240, alpha: 0, opts: { npcs: ['pirate', 'pirate'], dir: 'down' } }), spawn({ id: 'wf', kind: 'bidFlag', x: side * 170, y: -250, alpha: 0, layer: 1, opts: { col: '#f4f4f0' } })],
    approach: (c) => [
      par(move('pir', { y: -200, rot: Math.PI * 0.9, sails: 'furled' }, 3), slow(5), cam({ x: side * 70, y: -80 }, 0.3)),
      par(move('enc', { alpha: 1, x: besides(c, 18), y: -16 }, 3), move('wf', { alpha: 1, x: besides(c, 22), y: -26 }, 3, { wait: false })),
      board('envoy', 'pirate', rail(side), 'center', { say: 'Ateşkes, kaptan. Sadece ticaret.', face: side < 0 ? 'left' : 'right' }),
    ],
    intro: () => [react('danger', side), T(0.4)],
    opts: [
      (c, info) => (info.success
        ? [S('say', { actor: 'envoy', text: 'Anlaştık. Kızıl Kaptan selam söyledi.', dur: 2.6, hold: 0.6 }), S('coins', { from: { x: 0, y: 0 }, to: 'ship', n: 8 }), unboard('envoy', rail(side))]
        : [S('say', { actor: 'envoy', text: 'Şimdi! Saldırın!', dur: 1.8, hold: 0.4 }), par(board('p1', 'pirate', rail(side), 'cargo', { wait: false }), board('p2', 'pirate', rail(side), 'cargo', { dx: 8 })), par(sfx('impact'), fx('spark', 'ship', 16), S('shake', { amount: 6 }), react('danger', side))]),
      () => [par(work(['CREW_DIEGO'], 'center', 'Bayrağın düğümünü inceliyor', 4, 1.2), only('CREW_DIEGO', 'Bu ateşkes değil, av işareti!', { dur: 2.4 })), S('say', { actor: 'envoy', text: 'Tch! Kızıl Kaptan duyacak bunu…', dur: 2.4, hold: 0.6 }), unboard('envoy', rail(side))],
      (c, info) => [unboard('envoy', rail(side), { wait: false }), S('fire', { from: 'ship', to: 'enc', n: 1, hit: false }), ...(info.success ? [par(move('enc', { y: -300, alpha: 0 }, 2.4), move('wf', { alpha: 0 }, 1)), move('pir', { y: -420 }, 3)] : [S('fire', { from: 'pir', to: 'ship', n: 3, hit: true })])],
    ],
    from: () => 'enc',
    exit: (c) => [offAll(rail(side)), par(move('enc', { y: -300, alpha: 0 }, 2.4), move('wf', { alpha: 0 }, 1), move('pir', { y: -440 }, 3)), remove('pir'), remove('wf'), go(30)],
  })),

  EVT_X1_D06: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: () => [spawn({ id: 'enc', kind: 'jellies', x: 0, y: -320, alpha: 0, opts: { n: 50 } })],
    approach: (c) => [par(move('enc', { y: -60, alpha: 1 }, 4.5), slow(8), cam({ x: 0, y: -40 }, 0.25), sfx('magic')), par(react('fortune', side), gather(rail(side), 'Işıklara bakıyor', { n: 3, dur: 8 }), lookout('Deniz… parlıyor!', { dur: 2.2 }))],
    intro: () => [T(0.3)],
    opts: [
      () => [stop(), cap('Bekleyeceğiz. Bırakın geçsinler.', 2.2, 0.6), move('enc', { y: 300 }, 5, { ease: 'linear' })],
      (c, info) => [par(work([], rail(side), 'Ağı suya indiriyor', 4, 1), S('throw', { from: { rail: side }, to: { x: besides(c, 30), y: 0 }, kind: 'rope', arc: 16 })), spawn({ id: 'net', kind: 'net', x: besides(c, 30), y: 0, opts: { r: 14, fish: 0 } }), T(1), ...(info.success ? [S('pickup', { id: 'net', prefer: [], task: 'Ağı çekiyor' }), par(fx('spark', 'ship', 20), sfx('magic'))] : [par(remove('net'), fx('spark', { rail: side }, 30), sfx('damage'), S('shake', { amount: 6 }), crewSay([], 'Ahh! Yakıyorlar!', { dur: 1.8 }))])],
      (c, info) => [par(S('speed', { v: 8 }), S('shipTo', { x: -side * 14 }), cam({ x: 0, y: 0 }, 0.3, 1.04)), move('enc', { y: 140 }, 4, { ease: 'linear' }), ...(info.success ? [] : [par(fx('spark', 'ship', 30), sfx('damage'), S('shake', { amount: 5 }))])],
    ],
    exit: () => [...driftAll(), weather({ restore: true }), T(0.8)],
  })),

  // ════════ B. TİCARET VE FIRSATLAR ════════
  EVT_X1_F01: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'a1', 'merchant', 3, { x: -150, y: -420, scale: 0.75 }), shipEntity(c, 'a2', 'guild', 3, { x: 0, y: -460, scale: 0.75 }), shipEntity(c, 'a3', 'merchant', 2, { x: 150, y: -420, scale: 0.75 }), spawn({ id: 'enc', kind: 'rowboat', x: 0, y: -340, opts: { npcs: ['merchant'], dir: 'down', cargo: ['GOOD_SILK'] } })],
    approach: (c) => [par(move('a1', { y: -130, rot: Math.PI * 0.6 }, 4), move('a2', { y: -c.len / 2 - 100 }, 4, { wait: false }), move('a3', { y: -130, rot: Math.PI * 1.4 }, 4, { wait: false }), move('enc', { y: -c.len / 2 - 40 }, 4, { wait: false }), slow(4), cam({ x: 0, y: -60 }, 0.32, 0.92)), par(stop(), react('fortune', side)), say('enc', 'Açık deniz müzayedesi! Teklifler bayrakla!', 2.6, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [spawn({ id: 'f0', kind: 'bidFlag', x: side * 10, y: -c.len / 2 + 10, layer: 2, opts: { col: '#24508a' } }), sfx('flag'), par(spawn({ id: 'f1', kind: 'bidFlag', x: -150, y: -150, layer: 2, opts: { col: '#c8423b' } }), say('a1', 'Seksen beş!', 1.6, 0.4)), info.success ? par(say('enc', 'Satıldı! Mavi bayrağa!', 2, 0.4), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_SILK', arc: 24 }), S('coins', { from: 'ship', to: 'enc', n: 6 })) : par(say('enc', 'Satıldı! Kırmızı bayrağa!', 2, 0.6), crewSay([], 'Hay aksi…', { dur: 1.6 }))],
      (c, info) => [spawn({ id: 'f0', kind: 'bidFlag', x: side * 10, y: -c.len / 2 + 10, layer: 2, opts: { col: '#24508a' } }), sfx('flag'), par(spawn({ id: 'f2', kind: 'bidFlag', x: 0, y: -c.len / 2 - 90, layer: 2, opts: { col: '#e0b040' } }), say('a2', 'İki yüz!', 1.6, 0.4)), T(0.6), info.success ? par(say('enc', 'Değerli lot mavi bayrakta! Ne mühür ama…', 2.4, 0.6), S('chest', { from: 'enc', to: 'ship' }), S('coins', { from: 'ship', to: 'enc', n: 10 })) : say('enc', 'Lot altın bayrağa gitti!', 2, 0.6)],
      () => [work(['CAPTAIN'], 'bow', 'Müzayedeyi izliyor', 5, 1.4), par(spawn({ id: 'f1', kind: 'bidFlag', x: -150, y: -150, layer: 2, opts: { col: '#c8423b' } }), spawn({ id: 'f2', kind: 'bidFlag', x: 0, y: -c0len(), layer: 2, opts: { col: '#e0b040' } }), sfx('flag')), cap('Kim kime göz kırpıyor… ilginç.', 2.4, 0.6)],
    ],
    skip: () => ['gold', 'gained', 'items'],
    exit: () => [...['f0', 'f1', 'f2'].map(remove), par(move('a1', { y: 300 }, 3), move('a2', { y: -460 }, 3, { wait: false }), move('a3', { y: 300 }, 3, { wait: false }), move('enc', { y: -380 }, 3, { wait: false })), ...['a1', 'a2', 'a3', 'enc'].map(remove), go(30)],
  })),

  EVT_X1_F02: def((ev, side) => ({
    setup: (c) => ['#c8423b', '#3b6ea5', '#e0b040', '#5cb85c'].map((col, i) => spawn({ id: 'tb' + i, kind: 'tentBoat', x: besides(c, 30 + (i % 2) * 34), y: -320 + i * 26, opts: { col, npc: i % 2 ? 'villagerF' : 'merchant', dir: side < 0 ? 'right' : 'left', cargo: [['GOOD_SPICE', 'GOOD_SILK', 'GOOD_WINE', 'GOOD_GRAIN'][i]] } })),
    approach: (c) => [par(...[0, 1, 2, 3].map((i) => move('tb' + i, { y: -60 + i * 26 }, 4, { wait: i === 0 })), slow(4), cam({ x: side * 60, y: -10 }, 0.3)), par(stop(), react('fortune', side), sfx('cheer')), say('tb0', 'Taze baharat! İpek! Şarap!', 2.4, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c) => [board('mer', 'merchant', rail(side), 'cargo', { say: 'Göster bakalım malını…', endState: 'work' }), T(1), par(S('cargoUse', { goods: [], at: 'cargo' }), S('throw', { from: 'ship', to: 'tb1', kind: 'crate', good: 'GOOD_GRAIN', arc: 18 }), S('throw', { from: 'tb1', to: 'ship', kind: 'crate', good: 'GOOD_SILK', arc: 24 })), S('say', { actor: 'mer', text: 'Takas tamam!', dur: 2, hold: 0.4 }), unboard('mer', rail(side))],
      () => [S('coins', { from: 'ship', to: 'tb2', n: 6 }), say('tb2', 'Al bakalım, bez altında ne var!', 2.4, 0.4), S('icon', { icon: 'gift', from: 'tb2', to: 'ship' })],
      () => [cap('Bugün değil.', 1.6, 0.6), go(22)],
    ],
    skip: () => ['gold', 'items', 'lost', 'gained'],
    exit: () => [offAll(rail(side)), ...driftAll(), T(0.8)],
  })),

  EVT_X1_F03: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 3, { x: side * 220, y: -300, rot: Math.PI * 0.75, sails: 'furled', damage: 'sinking', scale: 0.85, crewNpc: ['merchant', 'sailor'] })],
    approach: (c) => [par(move('enc', { y: -40 }, 4.5), slow(5), cam({ x: side * 80, y: -40 }, 0.3)), move('enc', { x: alongside(c, 0.85, 3, 30), rot: Math.PI * 0.95 }, 2), par(stop(), react('fortune', side)), say('enc', 'Mallarımı yarı fiyatına alın! Yeter ki dibe gitmesin!', 2.8, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      () => [plank(side), board('mer', 'merchant', rail(side), 'cargo', { carry: 'GOOD_PORCELAIN', say: 'Dikkat, porselen!' }), par(S('npcState', { id: 'mer', carry: null }), sfx('pickup')), S('coins', { from: 'ship', to: 'enc', n: 6 }), unboard('mer', rail(side))],
      () => [plank(side), gather(rail(side), 'Karşı gemiye geçmeye hazırlanıyor', { n: 2, run: true, dur: 3 }), S('coins', { from: 'ship', to: 'enc', n: 4 }), ...[0, 1, 2].map(() => [sfx('repair'), fx('spark', 'enc', 10), T(0.5)]), say('enc', 'Sağ olun! Lonca bunu duyacak!', 2.4, 0.6)],
      (c, info) => [plank(side), gather(rail(side), 'Sandık kurtarıyor', { n: 3, run: true, dur: 4 }), ...(info.success ? [S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_WINE', arc: 20 }), T(0.4), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_WINE', arc: 20 })] : [par(sfx('creak'), fx('splinter', 'enc', 30), S('shake', { amount: 8 }), S('heel', { rot: side * 0.06 })), crewSay([], 'Güverte çöküyor! Geri!', { dur: 1.8 }), S('heel', { rot: 0 })])],
    ],
    skip: () => ['gained', 'gold'],
    from: () => 'enc',
    exit: (c) => [unplank(), offAll(rail(side)), par(move('enc', { y: 280, alpha: 0.6 }, 3), go(28)), remove('enc')],
  })),

  EVT_X1_F04: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 24), y: -260, opts: { npcs: ['customs', 'sailor'], dir: 'up', cargo: ['GOOD_ANTIQUE'] } })],
    approach: (c) => [par(move('enc', { y: -8 }, 4), slow(4), cam({ x: side * 40, y: -10 }, 0.3)), stop(), board('clerk', 'customs', rail(side), 'cargo', { carry: 'GOOD_ANTIQUE', say: 'İşte sandığınız, efendim! İmza burada.' }), S('npcState', { id: 'clerk', carry: null }), deckProp('box', 'chestOpen', 'cargo', { dx: 8 })],
    intro: () => [unboard('clerk', rail(side)), T(0.3)],
    opts: [
      (c) => [cap('Hey! Bu sandık bizim değil!', 2.2, 0.4), board('clerk', 'customs', rail(side), 'cargo', { say: 'Aman Tanrım… başka tüccar!' }), par(remove('box'), S('npcState', { id: 'clerk', carry: 'GOOD_ANTIQUE' })), unboard('clerk', rail(side)), say('enc', 'Dürüstlüğünüzü unutmayacağım!', 2.4, 0.6)],
      () => [gather('cargo', 'Sandığı ambara indiriyor', { n: 2, dur: 3 }), par(remove('box'), sfx('creak')), crewSay([], 'Kimse görmedi…', { dur: 1.8 }), move('enc', { y: 260 }, 2.6)],
      () => [par(work(['CAPTAIN'], 'cargo', 'Mührü inceliyor', 4, 1.4), deckProp('seal', 'glowRing', 'cargo', { opts: { col: '#e0b040' } })), cap('Lonca evinin mührü… ve bir fiyat listesi.', 2.6, 0.6), remove('seal'), board('clerk', 'customs', rail(side), 'cargo'), par(remove('box'), S('npcState', { id: 'clerk', carry: 'GOOD_ANTIQUE' })), unboard('clerk', rail(side))],
    ],
    skip: () => ['gained'],
    from: () => 'enc',
    exit: () => [remove('box'), remove('seal'), offAll(rail(side)), move('enc', { y: 260 }, 2.4), go(30)],
  })),

  EVT_X1_F05: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'floatingYard', x: side * (c.beam / 2 + 70), y: -320 })],
    approach: (c) => [par(move('enc', { y: -10 }, 4.5), slow(4), cam({ x: side * 60, y: -10 }, 0.3)), par(stop(), react('fortune', side), sfx('repair')), call((d) => { const e = d.world.get('enc'); const L = d.world.layout(); if (e) e.hooks = [{ x0: e.x - side * 44, y0: e.y, x1: d.world.ship.x + side * (L.beam / 2 - 6), y1: d.world.ship.y, plank: true }]; }), lookout('Yüzer bir tersane! Köprü kuruyorlar.', { dur: 2.2 })],
    intro: () => [T(0.3)],
    opts: [
      () => [S('coins', { from: 'ship', to: 'enc', n: 6 }), board('u1', 'villager', rail(side), rail(side), { dy: -24, endState: 'work' }), board('u2', 'villager', rail(side), rail(-side), { endState: 'work', wait: false }), ...[0, 1, 2].map(() => [sfx('repair'), fx('spark', { rail: side }, 12), fx('spark', { rail: -side }, 12), T(0.5)])],
      () => [S('coins', { from: 'ship', to: 'enc', n: 8 }), board('u1', 'villager', rail(side), rail(side), { endState: 'work' }), par(deckProp('plate', 'patch', rail(side), { dx: side * 4 }), sfx('repair'), fx('spark', { rail: side }, 16)), T(0.8)],
      () => [S('coins', { from: 'ship', to: 'enc', n: 5 }), board('u1', 'villager', rail(side), 'mast', { endState: 'work' }), board('u2', 'villager', rail(side), 'mast', { dy: 10, endState: 'work', wait: false }), ...[0, 1].map(() => [sfx('repair'), fx('spark', 'ship', 10), T(0.6)]), par(S('sails', { state: 'full' }), sfx('cheer'))],
      () => [cap('İyi işler, ustalar.', 1.8, 0.6), go(24)],
    ],
    skip: () => ['gold', 'hull'],
    outcome: (c, info) => (info.hullDelta > 0 ? [par(fx('spark', 'ship', 24), sfx('repair'))] : []),
    exit: () => [remove('plate'), offAll(rail(side)), call((d) => { const e = d.world.get('enc'); if (e) e.hooks = null; }), ...driftAll()],
  })),

  EVT_X1_F06: def((ev, side) => ({
    setup: (c) => [0, 1, 2].map((i) => shipEntity(c, i ? 'cv' + i : 'enc', i === 1 ? 'guild' : 'merchant', 2, { x: side * (180 + i * 60), y: -360 - i * 50, scale: 0.75 })),
    approach: (c) => [par(move('enc', { x: alongside(c, 0.75, 2, 20), y: -10, rot: 0, sails: 'full' }, 4), move('cv1', { x: side * 230, y: -140, rot: 0 }, 4, { wait: false }), move('cv2', { x: side * 230, y: 110, rot: 0 }, 4, { wait: false }), S('speed', { v: 20 }), cam({ x: side * 70, y: -10 }, 0.3, 0.95)), par(react('fortune', side), say('enc', 'Gümrüksüz pazar! Paralel seyre geçin!', 2.4, 0.6))],
    intro: () => [T(0.3)],
    opts: [
      () => [plank(side), S('coins', { from: 'ship', to: 'enc', n: 6 }), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_SPICE', arc: 20 }), T(0.3), S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_SPICE', arc: 20 })],
      () => [plank(side), gather('cargo', 'Satılacak sandığı taşıyor', { n: 2, dur: 3 }), S('cargoUse', { goods: [], at: rail(side) }), S('coins', { from: 'enc', to: 'ship', n: 10 })],
      () => [cap('Bize uymaz. Bol kazanç!', 2, 0.6), par(go(30), move('enc', { y: 280 }, 3), move('cv1', { y: 260 }, 3, { wait: false }), move('cv2', { y: 330 }, 3, { wait: false }))],
    ],
    skip: () => ['gained', 'lost', 'gold'],
    outcome: (c, info) => (info.lost.length ? [S('cargoOverboard', { goods: info.lost, to: 'enc', arc: 20 })] : []),
    exit: () => [unplank(), par(move('enc', { y: 280 }, 3), move('cv1', { y: 260 }, 3, { wait: false }), move('cv2', { y: 330 }, 3, { wait: false })), remove('cv1'), remove('cv2'), go(30)],
  })),

  // ════════ C. GİZEM ════════
  EVT_X1_M01: def((ev, side) => ({
    weather: () => [weather({ preset: 'eerie' })],
    setup: (c) => [shipEntity(c, 'enc', 'ghost', c.world.ship.level, { x: 0, y: 0, rot: Math.PI, alpha: 0, sails: 'full', crewNpc: [] })],
    approach: () => [par(S('speed', { v: 0 }), S('sails', { state: 'furled' }), cam({ x: 0, y: 0 }, 0.3, 1.04)), par(move('enc', { alpha: 0.35 }, 2), sfx('magic')), move('enc', { rot: Math.PI * 0.82, x: side * 16 }, 3), crewSay([], 'Yansımamız… bize bakmıyor.', { dur: 2.4 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work(['CAPTAIN'], rail(side), 'Yansımaya uzanıyor', 4, 1.4), ...(info.success ? [par(move('enc', { alpha: 0 }, 1), fx('spark', { rail: side }, 30), sfx('magic')), spawn({ id: 'orb', kind: 'lightOrb', x: besides(c, 20), y: 0 }), S('icon', { icon: 'gift', from: 'orb', to: 'ship' }), remove('orb')] : [par(move('enc', { alpha: 0, rot: Math.PI * 1.2 }, 0.8), S('shake', { amount: 12 }), fx('splash', 'ship', 40), sfx('impact'))])],
      () => [gather(rail(side), 'Yansımayı izliyor', { n: 3, dur: 5 }), par(move('enc', { alpha: 0 }, 3), sfx('ghost')), work(['CAPTAIN'], 'helm', 'Seyir defterine yazıyor', 3, 0.8)],
      (c) => [work(['CAPTAIN'], rail(side), 'Suya gümüş bırakıyor', 3, 1), S('throw', { from: { rail: side }, to: { x: besides(c, 10), y: 0 }, kind: 'ball', arc: 8, burst: 'spark', n: 14 }), par(move('enc', { rot: Math.PI, x: 0 }, 1.6), sfx('magic')), move('enc', { alpha: 0 }, 2)],
    ],
    exit: () => [remove('enc'), remove('orb'), weather({ restore: true }), go(30)],
  })),

  EVT_X1_M02: def((ev, side) => ({
    weather: () => [weather({ fog: 1, dark: 0.08 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'lighthouseIsle', x: side * (c.beam / 2 + 110), y: -340, opts: { r: 44, len: 220 } })],
    approach: (c) => [par(move('enc', { y: -60 }, 5), slow(5), cam({ x: side * 70, y: -50 }, 0.3)), par(react('fortune', side), lookout('Haritada olmayan bir fener!', { dur: 2.2 }))],
    intro: () => [T(0.3)],
    opts: [
      () => [par(work(['CAPTAIN'], 'helm', 'Fener ışığını takip ediyor', 4), S('heel', { rot: side * 0.08 }), S('shipTo', { x: side * 20 })), deckProp('route', 'sparkles', 'helm', { opts: { r: 20, col: '#fff0a0' } }), T(1), S('heel', { rot: 0 })],
      (c) => landing(c, side, ['sailor', 'sailor'], [par(fx('spark', 'enc', 12), sfx('creak')), T(0.8), S('icon', { icon: 'lantern', from: 'enc', to: 'boat' })], [], 90),
      () => [go(26), cap('Sisin içinde olmaz.', 1.8, 0.6), S('opts', { id: 'enc', opts: { r: 44, lit: false } })],
    ],
    exit: () => [remove('route'), ...driftAll(), weather({ restore: true }), T(0.8)],
  })),

  EVT_X1_M03: def((ev, side) => ({
    weather: () => [weather({ preset: 'tropical', fx: [] })],
    setup: () => [spawn({ id: 'enc', kind: 'kelpForest', x: 0, y: -330, opts: { w: 320, a: 0.55 } })],
    approach: () => [par(move('enc', { y: 0 }, 5), slow(4), cam({ x: 0, y: -10 }, 0.25)), par(stop(), react('fortune', side), lookout('Suyun altında parlayan ağaçlar!', { dur: 2.4 })), gather(rail(side), 'Su altına bakıyor', { n: 3, dur: 8 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => dive(c, side, ['CREW_MIRA'], 'Işıklı ormana dalıyor', [only('CREW_MIRA', 'Köklerin arasında bir şey var!', { dur: 2 }), S('icon', { icon: 'gift', from: { x: 0, y: -20 }, to: 'ship' })]),
      (c, info) => dive(c, side, [], 'Halatla dalıyor', info.success ? [S('icon', { icon: 'gift', from: { x: 0, y: -20 }, to: 'ship' })] : [par(S('shake', { amount: 10 }), fx('splash', 'ship', 40), sfx('creak')), ...[0].map(() => S('heel', { rot: side * 0.1 })), T(0.6), S('heel', { rot: 0 })]),
      (c) => [deckProp('notes', 'mapTable', 'center'), work(['CAPTAIN'], 'center', 'Derin deniz notlarını okuyor', 3, 1), ...dive(c, side, ['CREW_MIRA', 'CREW_NAKAMURA'], 'Ormanın kalbine dalıyor', [S('icon', { icon: 'gift', from: { x: 0, y: -20 }, to: 'ship' })]), remove('notes')],
      () => [work(['CAPTAIN', 'CREW_COMPASS'], rail(side), 'Işıklı ormanı çiziyor', 5, 1.4), sfx('page'), S('icon', { icon: 'book', from: { x: 0, y: -20 }, to: 'ship' })],
    ],
    exit: () => [remove('notes'), ...driftAll(), weather({ restore: true }), T(0.8)],
  })),

  EVT_X1_M04: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: () => [spawn({ id: 'stars', kind: 'stars', x: 0, y: 0, screen: true, layer: 3, opts: { n: 70, H: 220 } })],
    approach: (c) => [
      par(slow(14), cam({ x: 0, y: -80 }, 0.3)),
      spawn({ id: 'met', kind: 'meteor', x: -260, y: -420, layer: 3 }),
      par(move('met', { x: side * 40, y: -c.len / 2 - 90 }, 1.6, { ease: 'in' }), sfx('roar')),
      par(remove('met'), S('flash', {}), fx('splash', { x: side * 40, y: -c.len / 2 - 90 }, 70), fx('fire', { x: side * 40, y: -c.len / 2 - 90 }, 20), S('shake', { amount: 12 }), sfx('cannon'), react('danger', side)),
      spawn({ id: 'enc', kind: 'meteorField', x: side * 40, y: -c.len / 2 - 90 }),
      lookout('Gökten bir yıldız düştü!', { dur: 2.2 }),
    ],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(S('speed', { v: 6 }), move('enc', { y: -c.len / 2 - 40 }, 2)), gather('bow', 'Ağla parça topluyor', { n: 3, run: true, dur: 5 }), S('throw', { from: { rail: 0, dy: -c.len / 2 }, to: 'enc', kind: 'rope', arc: 14 }), ...(info.success ? [par(fx('gold', 'enc', 20), sfx('coin')), S('coins', { from: 'enc', to: 'ship', n: 14 })] : [par(fx('fire', 'enc', 30), fx('splash', 'enc', 40), S('shake', { amount: 9 }), sfx('impact'))])],
      () => [gather('bow', 'Işıkları izliyor', { n: 4, dur: 6 }), par(move('enc', { alpha: 0.3 }, 4), sfx('magic'))],
      () => [par(cap('Dümen kır, uzaklaşıyoruz.', 2, 0.6), S('heel', { rot: -side * 0.12 }), go(28)), T(1), S('heel', { rot: 0 })],
    ],
    exit: () => [remove('stars'), ...driftAll(), weather({ restore: true }), T(0.6)],
  })),

  EVT_X1_M05: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark', dark: 0.08 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'seaEye', x: side * 46, y: -c.len / 2 - 44, alpha: 0, opts: { open: 0 } })],
    approach: (c) => [
      par(S('speed', { v: 4 }), S('sails', { state: 'furled' }), cam({ x: side * 10, y: -c.len / 2 - 30 }, 0.3)),
      par(move('enc', { alpha: 1 }, 2), sfx('roar')),
      ...[0.2, 0.5, 0.8, 1].map((o) => [S('opts', { id: 'enc', opts: { open: o } }), T(0.3)]),
      par(react('danger', side), gather(rail(side), 'Dev göze bakıyor', { n: 3, dur: 8, state: 'react' }), crewSay([], 'Bize bakıyor…', { dur: 2.2 })),
    ],
    intro: () => [S('opts', { id: 'enc', opts: { open: 1, lookX: side * 8 } }), T(0.4)],
    opts: [
      (c, info) => [par(work(['CREW_MAGDA', 'CAPTAIN'], rail(side), 'Gözle konuşmaya çalışıyor', 5, 1.4), crewSay(['CREW_MAGDA'], 'Derinlerin bekçisi… dinle bizi.', { dur: 2.6 })), ...(info.success ? [par(S('opts', { id: 'enc', opts: { open: 0.2 } }), spawn({ id: 'trail', kind: 'sparkles', x: side * 30, y: -60, layer: 2, opts: { r: 60, col: '#7affd8' } }), sfx('magic')), move('enc', { alpha: 0 }, 2)] : [par(S('opts', { id: 'enc', opts: { open: 0 } }), S('shake', { amount: 12 }), fx('splash', 'ship', 60), sfx('roar')), ...[0].map(() => S('heel', { rot: side * 0.12 })), T(0.6), S('heel', { rot: 0 })])],
      (c, info) => [cap('Bir sandık… sunun ona.', 2, 0.4), S('throw', { from: 'ship', to: 'enc', kind: 'crate', good: 'GOOD_SPICE', arc: 16, burst: 'splash', sfx: 'splash' }), T(1), ...(info.success ? [par(spawn({ id: 'gift', kind: 'lightOrb', x: side * 20, y: 0 }), sfx('magic')), S('icon', { icon: 'gift', from: 'gift', to: 'ship' }), remove('gift')] : [par(S('opts', { id: 'enc', opts: { open: 0 } }), sfx('ghost'))])],
      () => [par(S('speed', { v: 8 }), cap('Sessizce… çok sessizce.', 2.2, 0.6)), par(move('enc', { alpha: 0, y: 160 }, 4))],
    ],
    skip: (info) => (info.lost.length ? ['lost'] : []),
    exit: () => [par(move('enc', { alpha: 0 }, 1.5), remove('trail')), remove('enc'), weather({ restore: true }), go(30)],
  })),

  // ════════ D. FELAKETLER ════════
  EVT_X1_DIS01: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', dark: 0.08 })],
    setup: (c) => [spawn({ id: 'cur', kind: 'reverseCurrent', x: 0, y: 0, layer: 1 }), spawn({ id: 'rk', kind: 'rocks', x: side * 50, y: c.len / 2 + 200 })],
    approach: (c) => [par(S('speed', { v: -10 }), S('shipTo', { y: 30 }), cam({ x: 0, y: 60 }, 0.3)), par(move('rk', { y: c.len / 2 + 60 }, 3), react('disaster', side), crewSay([], 'Akıntı ters döndü! Geri sürükleniyoruz!', { dur: 2.4 })), gather('mast', 'Halatları geriyor', { n: 4, run: true, dur: 8 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [par(go(70), sfx('depart'), cap('Tüm kollar! Akıntıyı yeneceğiz!', 2.2, 0.4)), ...rock(0.06), ...(info.success ? [par(S('shipTo', { y: 0 }), move('rk', { y: 340 }, 3))] : [par(S('shipTo', { y: 50 }), move('rk', { y: c.len / 2 + 20 }, 1.6)), par(sfx('creak'), fx('splinter', { rail: side, dy: 60 }, 30), S('shake', { amount: 10 }))])],
      () => [par(work(['CAPTAIN'], 'helm', 'Sekstantla akıntının zayıf kolunu buluyor', 4, 1.2), cap('Şurada! İskeleye üç kulaç!', 2.2, 0.4)), par(S('shipTo', { x: -side * 40, y: 0 }), go(30), move('rk', { y: 340 }, 3))],
      () => [stop(), cap('Demir atın. Akıntı dönene kadar bekleyeceğiz.', 2.4, 0.6), T(2), par(S('shipTo', { y: 0 }), move('rk', { y: 360 }, 3))],
    ],
    exit: () => [remove('cur'), ...driftAll(), weather({ restore: true }), T(0.6)],
  })),

  EVT_X1_DIS02: def((ev, side) => ({
    weather: () => [weather({ preset: 'dark', dark: 0.06 })],
    setup: () => [spawn({ id: 'enc', kind: 'gasField', x: 0, y: -300, opts: { n: 20, w: 300, h: 220 } })],
    approach: (c) => [par(move('enc', { y: 0 }, 4.5), slow(6), cam({ x: 0, y: -20 }, 0.3)), ...rock(0.07), par(react('disaster', side), gather('mast', 'Direğe tutunuyor', { n: 4, run: true, dur: 8 }), crewSay([], 'Deniz kaynıyor! Bu koku…', { dur: 2.2 }))],
    intro: () => [T(0.3)],
    opts: [
      () => [par(cap('Bütün ateşleri söndürün! Fener, ocak, pipo!', 2.6, 0.4), weather({ dark: 0.25 })), work(['CREW_PITA'], 'galley', 'Ocağı söndürüyor', 3, 1), fx('smoke', 'ship', 20), stop(), T(2), move('enc', { y: 300 }, 4, { ease: 'linear' })],
      (c, info) => [par(go(70), sfx('depart')), ...(info.success ? [move('enc', { y: 300 }, 2.4)] : [par(S('opts', { id: 'enc', opts: { flare: true } }), S('flash', {}), fx('fire', 'ship', 40), S('shake', { amount: 14 }), sfx('cannon')), S('opts', { id: 'enc', opts: { flare: false } })])],
      () => [par(work(['CREW_SURGE'], 'bow', 'Köpüğün sakin şeridini okuyor', 5, 0.8), only('CREW_SURGE', 'Şu şerit sakin. Oradan!', { dur: 2 })), par(S('shipTo', { x: side * 30 }), S('speed', { v: 12 }), move('enc', { y: 280 }, 4))],
    ],
    exit: () => [...driftAll(), weather({ restore: true }), T(0.6)],
  })),

  EVT_X1_DIS03: def((ev, side) => ({
    weather: () => [weather({ preset: 'ash', dark: 0.18 })],
    setup: () => [spawn({ id: 'rain', kind: 'blackRain', x: 0, y: 0, screen: true, layer: 3, alpha: 0 })],
    approach: () => [par(move('rain', { alpha: 1 }, 2), slow(10), sfx('thunder')), par(deckProp('tar', 'tarStains', 'center'), react('disaster', side), crewSay([], 'Bu ne?! Yapışkan… simsiyah!', { dur: 2.4 }))],
    intro: () => [T(0.3)],
    opts: [
      () => [gather('cargo', 'Sandıkları brandayla örtüyor', { n: 4, run: true, dur: 5 }), deckProp('cover', 'bedroll', 'cargo'), cap('Hepsini örtün!', 1.8, 1)],
      (c, info) => [par(go(70), sfx('depart')), ...(info.success ? [par(move('rain', { alpha: 0 }, 2), remove('tar'))] : [T(1.4), par(fx('smoke', 'ship', 20), crewSay([], 'Çuvallar karardı…', { dur: 1.8 }))])],
      (c, info) => [cap('Devam ediyoruz.', 1.6, 1.2), ...(info.success ? [move('rain', { alpha: 0 }, 2)] : [par(fx('smoke', 'ship', 30), S('shake', { amount: 6 }))])],
    ],
    exit: () => [move('rain', { alpha: 0 }, 1.2), remove('rain'), remove('tar'), remove('cover'), weather({ restore: true })],
  })),

  EVT_X1_DIS04: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [shipEntity(c, 'enc', 'warship', 4, { x: side * 60, y: -460, rot: Math.PI * 0.9, sails: 'furled', damage: 'critical', scale: 0.85, crewNpc: ['officer'] }), call((d) => { const e = d.world.get('enc'); if (e) e.fire = { dx: 0, dy: -10 }; })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 140 }, 4.5), slow(6), cam({ x: side * 20, y: -120 }, 0.32)), par(react('disaster', side), fx('fire', 'enc', 30)), say('enc', 'Yardım edin!', 2, 0.6)],
    intro: () => [fx('fire', 'enc', 20), T(0.3)],
    opts: [
      (c, info) => [par(work(['CREW_BJORN', 'CREW_OKSANA'], 'bow', 'Topu enkaza çeviriyor', 4), cam('enc', 0.3, 1.04)), S('fire', { from: { rail: 0, dy: -c.len / 2 }, to: 'enc', n: 3, hit: true }), ...(info.success ? [par(move('enc', { x: side * 200, rot: Math.PI * 0.6 }, 2.6), fx('splinter', 'enc', 40))] : [move('enc', { y: -c.len / 2 - 40 }, 1.6), par(fx('fire', 'ship', 30), S('deckFire', { on: true }), S('shake', { amount: 10 }), sfx('impact'))])],
      (c, info) => [par(cap('Dümen kır! ŞİMDİ!', 1.8, 0.2), S('heel', { rot: -side * 0.2 }), S('shipTo', { x: -side * 50 }), go(50)), move('enc', { y: c.len / 2 + 120, x: side * (info.success ? 90 : 30) }, 2.6, { ease: 'linear' }), S('heel', { rot: 0 }), ...(info.success ? [] : [par(S('deckFire', { on: true }), fx('fire', 'ship', 30), S('shake', { amount: 14 }), sfx('impact'))])],
      (c, info) => [move('enc', { y: -40, x: alongside(c, 0.85, 4, 20) }, 2.4), S('throw', { from: { rail: side }, to: 'enc', kind: 'rope', arc: 10 }), work([], rail(side), 'Halatla karşı gemiye geçiyor', 4, 1.6), board('surv', 'officer', rail(side), 'center', { say: 'Beni… kurtardınız…', endState: 'sit' }), ...(info.success ? [S('icon', { icon: 'gift', from: { x: 0, y: 0 }, to: { x: 0, y: -60 } })] : [par(S('deckFire', { on: true }), fx('fire', 'ship', 30), S('shake', { amount: 9 }))])],
    ],
    exit: (c) => [S('deckFire', { on: false }), offAll('cargo'), par(move('enc', { y: 340 }, 3), go(30)), remove('enc'), weather({ restore: true })],
  })),

  // ════════ E. TAMİR ════════
  EVT_X1_REPAIR01: def((ev, side) => ({
    setup: (c) => [0, 1, 2].map((i) => spawn({ id: 'br' + i, kind: 'barrel', x: besides(c, 30 + i * 14), y: -280 + i * 20 })),
    approach: (c) => [par(move('br0', { y: -20 }, 4), move('br1', { y: 0 }, 4, { wait: false }), move('br2', { y: 20 }, 4, { wait: false }), slow(4), cam({ x: side * 40, y: 0 }, 0.25)), par(stop(), react('fortune', side), lookout('Katran fıçıları! Bir tersane kaybetmiş.', { dur: 2.2 }))],
    intro: () => [T(0.3)],
    opts: [
      () => [S('pickup', { id: 'br0', prefer: [], task: 'Fıçıyı çekiyor' }), S('pickup', { id: 'br1', prefer: [], task: 'Fıçıyı çekiyor' }), par(deckProp('pot', 'cauldron', 'galley'), work([], rail(side), 'Gövdeyi katranlıyor', 4)), ...[0, 1].map(() => [sfx('repair'), fx('smoke', { rail: side }, 8), T(0.6)])],
      () => [S('pickup', { id: 'br0', prefer: ['CREW_GROOT'], task: 'Fıçıyı çekiyor' }), par(deckProp('pot', 'cauldron', 'galley'), work(['CREW_GROOT'], rail(side), 'Gövdeyi baştan kalafatlıyor', 5, 0.6), only('CREW_GROOT', 'İyi katran, iyi gemi!', { dur: 2 })), ...[0, 1, 2].map(() => [sfx('repair'), fx('smoke', { rail: side }, 8), fx('smoke', { rail: -side }, 8), T(0.5)])],
      () => [S('pickup', { id: 'br0', prefer: [], task: 'Fıçıyı çekiyor' }), par(deckProp('tar', 'tarStains', 'center'), gather('center', 'Siyah lekeleri kazıyor', { n: 3, dur: 5 })), ...[0, 1, 2].map(() => [sfx('repair'), T(0.5)]), remove('tar')],
      () => [S('pickup', { id: 'br0', prefer: [], task: 'Fıçıyı çekiyor' }), S('pickup', { id: 'br1', prefer: [], task: 'Fıçıyı çekiyor' }), cap('Bunlar limanda iyi para eder.', 2, 0.6)],
    ],
    skip: () => ['hull'],
    outcome: (c, info) => (info.hullDelta > 0 ? [par(fx('spark', 'ship', 20), S('displayHull'), float(`+${info.hullDelta} Gövde`, '#6fd36a'), sfx('repair'))] : []),
    exit: () => [remove('pot'), remove('tar'), ...driftAll(), T(0.6)],
  })),

  EVT_X1_REPAIR02: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 3, { scale: 0.85, crewNpc: ['villager', 'villager', 'sailor'] }), spawn({ id: 'pen', kind: 'bidFlag', x: side * 190, y: -340, layer: 1, opts: { col: '#3b6ea5' } })],
    approach: (c) => [par(move('enc', { x: side * 170, y: -150 }, 2.6), move('pen', { x: side * 176, y: -168 }, 2.6, { wait: false }), cam({ x: side * 70, y: -70 }, 0.3)), remove('pen'), ...pull(c, 'enc', 3, 0.85), plank(side), say('enc', 'Kardeşlik selam söyler! Yardım lazım mı?', 2.4, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      () => [S('coins', { from: 'ship', to: 'enc', n: 6 }), board('u1', 'villager', rail(side), rail(side), { dy: -24, endState: 'work', carry: 'GOOD_TIMBER' }), board('u2', 'villager', rail(side), rail(-side), { endState: 'work', wait: false }), ...[0, 1, 2].map(() => [sfx('repair'), fx('spark', { rail: side }, 12), fx('spark', { rail: -side }, 12), T(0.5)])],
      () => [gather('cargo', 'Keresteyi taşıyor', { n: 2, dur: 3 }), S('cargoUse', { goods: [], at: rail(side) }), board('u1', 'villager', rail(side), rail(side), { dy: -20, endState: 'work' }), ...[0, 1].map(() => [sfx('repair'), fx('spark', { rail: side }, 14), T(0.5)])],
      () => [gather(rail(side), 'Karşı gemiye geçiyor', { n: 3, run: true, dur: 5 }), ...[0, 1, 2].map(() => [sfx('repair'), fx('spark', 'enc', 12), T(0.5)]), say('enc', 'Bunu unutmayacağız!', 2.2, 0.6)],
    ],
    skip: () => ['hull', 'lost'],
    outcome: (c, info) => [...(info.lost.length ? [S('cargoOverboard', { goods: info.lost, to: 'enc', arc: 18 })] : []), ...(info.hullDelta > 0 ? [par(fx('spark', 'ship', 20), S('displayHull'), float(`+${info.hullDelta} Gövde`, '#6fd36a'), sfx('repair'))] : [])],
    exit: (c) => [unplank(), offAll(rail(side)), sailAway(c)],
  })),

  // ════════ F. MÜRETTEBAT VE HAYVANLAR ════════
  EVT_X1_CREW01: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ dark: 0.08 })],
    setup: () => [deckProp('lamp', 'lantern', 'center', { dx: 10 })],
    approach: () => [par(slow(10), cam({ x: 0, y: 0 }, 0.3, 1.06)), gather('center', 'Kutlama için toplanıyor', { n: 5, dur: 10 }), crewSay([], 'Kaptan! Bu yolculuğu kutlayalım mı?', { dur: 2.4 })],
    intro: () => [T(0.3)],
    opts: [
      () => [par(deckProp('pot', 'cauldron', 'galley'), work(['CREW_PITA'], 'galley', 'Kutlama yemeği pişiriyor', 6, 0.8), only('CREW_PITA', 'Bu gece ziyafet var!', { dur: 2 })), par(pet('PET_TARCIN', { at: 'galley', pose: 'wag', dur: 6 }), pet('PET_ZIPIR', { at: 'center', pose: 'sit', dur: 6, run: false })), par(sfx('cheer'), crewSay([], '♪ Yo ho, dolu kadeh! ♪', { dur: 2.6 }), deckProp('notes', 'sparkles', 'center', { opts: { r: 22, col: '#ffe080' } })), crewSay(['CREW_BJORN', 'CREW_DIEGO'], 'Kaptanın şerefine!', { dur: 2 }), T(0.8)],
      () => [par(sfx('cheer'), crewSay([], 'Bir şarkı, bir hikâye!', { dur: 2.2 })), pet('PET_TARCIN', { at: 'center', pose: 'wag', dur: 4 }), T(1)],
      () => [cap('Limanda kutlarız.', 1.8, 0.6), crewSay([], 'Hmph…', { dur: 1.6 }), call((d) => d.world.deck.release())],
    ],
    exit: () => [remove('lamp'), remove('pot'), remove('notes'), weather({ restore: true }), T(0.4)],
  })),

  EVT_X1_PET01: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'dark', dark: 0.06 })],
    setup: (c) => [spawn({ id: 'shadow', kind: 'shadow', x: side * 20, y: -260, alpha: 0, opts: { s: 1.6, a: 0.45 } })],
    approach: () => [par(slow(12), cam({ x: 0, y: 0 }, 0.3, 1.06)), pet('PET_ZIPIR', { at: 'center', pose: 'sit', dur: 20, run: false, task: 'Gözlerini açtı, suya bakıyor' }), T(1.4), pet('PET_TARCIN', { at: 'center', dx: 8, pose: 'sit', dur: 20, task: "Zıpır'ın yanına oturdu" }), par(move('shadow', { alpha: 1, y: -60 }, 3)), crewSay([], 'Zıpır gözlerini açtı… bu iyiye işaret değil.', { dur: 2.6 })],
    intro: () => [T(0.3)],
    opts: [
      () => [par(cap('Zıpır\'a güveniyorum. Rotayı değiştirin!', 2.4, 0.4), S('heel', { rot: -side * 0.15 }), S('shipTo', { x: -side * 40 })), par(spawn({ id: 'wp', kind: 'whirlpool', x: side * 30, y: -c0len() }), move('shadow', { alpha: 0 }, 2)), T(1.4), S('heel', { rot: 0 }), pet('PET_ZIPIR', { pose: 'sleep', dur: 6 })],
      (c, info) => [gather(rail(side), 'Geminin altına bakıyor', { n: 4, run: true, dur: 5 }), ...dive(c, side, ['CREW_MIRA'], 'Gölgeye dalıyor', info.success ? [spawn({ id: 'box', kind: 'chest', x: besides(c, 24), y: 0 }), S('pickup', { id: 'box', prefer: [], task: 'Sandığı çekiyor' })] : [par(S('shake', { amount: 10 }), fx('splash', 'ship', 40), sfx('roar'), move('shadow', { alpha: 0 }, 1))])],
      () => [cap('Kedi işte. Devam.', 1.6, 1.2), par(move('shadow', { y: 20 }, 1.6), S('shake', { amount: 9 }), sfx('impact'), fx('splinter', 'ship', 20))],
    ],
    exit: () => [remove('wp'), remove('shadow'), remove('box'), weather({ restore: true }), go(30)],
  })),

  // ════════ Dünya Hafızası takipleri ════════
  EVT_X1_F04_THANKS: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 24), y: -260, opts: { npcs: ['customs', 'sailor'], dir: 'up' } })],
    approach: (c) => [par(move('enc', { y: -8 }, 4), slow(4), cam({ x: side * 40, y: -10 }, 0.3)), stop(), say('enc', 'Kaptan! Hatırladınız mı beni? Sandık!', 2.6, 0.6)],
    intro: () => [T(0.3)],
    opts: [() => [board('clerk', 'customs', rail(side), 'center', { say: 'Dürüst tüccar az bulunur. Bu sizin.', face: 'up' }), S('coins', { from: { x: 0, y: 0 }, to: 'ship', n: 10 }), unboard('clerk', rail(side))]],
    skip: () => ['gold'],
    exit: () => [offAll(rail(side)), move('enc', { y: 260 }, 2.4), go(30)],
  })),
  EVT_X1_F04_GUARDS: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'guild', 3, { scale: 0.85, crewNpc: ['guard', 'guard', 'guild'] })],
    approach: (c) => [par(move('enc', { x: side * 170, y: -150 }, 2.6), cam({ x: side * 70, y: -70 }, 0.3), sfx('horn')), react('danger', side), ...pull(c, 'enc', 3, 0.85), say('enc', 'Lonca muhafızları! Yanlış teslim edilen bir sandık arıyoruz.', 2.8, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      () => [plank(side), board('g1', 'guard', rail(side), 'cargo', { endState: 'work' }), S('chest', { from: 'ship', to: 'enc' }), S('say', { actor: 'g1', text: 'Kayıtlara "iade" yazıldı.', dur: 2.2, hold: 0.6 }), unboard('g1', rail(side))],
      (c, info) => [par(go(80), sfx('depart'), S('shipTo', { x: -side * 40 })), ...(info.success ? [move('enc', { y: 300 }, 3)] : [S('fire', { from: 'enc', to: 'ship', n: 2, hit: true })])],
    ],
    from: () => 'enc',
    exit: (c) => [unplank(), offAll(rail(side)), sailAway(c)],
  })),
  EVT_X1_REPAIR02_RETURN: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 3, { scale: 0.85, crewNpc: ['villager', 'villager', 'sailor'] }), spawn({ id: 'pen', kind: 'bidFlag', x: side * 190, y: -340, layer: 1, opts: { col: '#3b6ea5' } })],
    approach: (c) => [par(move('enc', { x: side * 170, y: -150 }, 2.6), move('pen', { x: side * 176, y: -168 }, 2.6, { wait: false }), cam({ x: side * 70, y: -70 }, 0.3), sfx('horn')), remove('pen'), ...pull(c, 'enc', 3, 0.85), say('enc', 'Omurgamızı sen yamadın! Şimdi sıra bizde.', 2.6, 0.6)],
    intro: () => [T(0.3)],
    opts: [() => [plank(side), board('u1', 'villager', rail(side), rail(side), { dy: -24, endState: 'work', carry: 'GOOD_TIMBER' }), board('u2', 'villager', rail(side), rail(-side), { endState: 'work', wait: false }), ...[0, 1, 2].map(() => [sfx('repair'), fx('spark', { rail: side }, 12), fx('spark', { rail: -side }, 12), T(0.5)]), sfx('cheer')]],
    skip: () => ['hull'],
    outcome: (c, info) => (info.hullDelta > 0 ? [par(fx('spark', 'ship', 20), S('displayHull'), float(`+${info.hullDelta} Gövde`, '#6fd36a'))] : []),
    exit: (c) => [unplank(), offAll(rail(side)), sailAway(c)],
  })),

  // ════════ Hikâye Yankıları ════════
  EVT_X1_ECHO_RED_CAPTAIN: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'red', 3, { x: side * 240, y: -320, scale: 0.75, crewNpc: ['pirate', 'pirate'] })],
    approach: (c) => [par(move('enc', { x: side * 200, y: -60, rot: Math.PI * 0.9 }, 4), slow(14), cam({ x: side * 60, y: -40 }, 0.3)), lookout('Kırmızı yelkenler… Kızıl Kaptan\'ın amblemi!', { dur: 2.6 })],
    intro: () => [par(S('set', { id: 'enc', props: { sails: 'furled' } }), sfx('flag')), say('enc', 'Kaptan selam söyler!', 2.2, 0.6)],
    opts: [() => [par(S('flag', { up: true }), sfx('flag'), work(['CAPTAIN'], rail(side), 'Selam veriyor', 3)), T(1.2), S('flag', { up: false })]],
    exit: (c) => [par(move('enc', { y: -420, sails: 'full' }, 3), go(30)), remove('enc')],
  })),
  EVT_X1_ECHO_GUILD_SEAL: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'guild', 2, { x: side * 220, y: -320, scale: 0.8 })],
    approach: (c) => [par(move('enc', { x: alongside(c, 0.8, 2, 40), y: -20, rot: 0, sails: 'furled' }, 4), slow(10), cam({ x: side * 60, y: -20 }, 0.3))],
    intro: () => [say('enc', 'Sen o mühür işini çözen tüccar değil misin?!', 2.6, 0.8)],
    opts: [() => [work(['CAPTAIN'], rail(side), 'Hikâyeyi dinliyor', 5), say('enc', 'Loncalar hâlâ seni anlatıyor, hem de abartarak!', 2.8, 0.8), sfx('cheer')]],
    exit: (c) => [sailAway(c), go(30)],
  })),
  EVT_X1_ECHO_LIGHTKEEPER: def((ev, side) => ({
    weather: () => [weather({ fog: 0.8 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 26), y: -260, opts: { npcs: ['keeper'], dir: 'up' } }), spawn({ id: 'lh', kind: 'lighthouseIsle', x: -side * 200, y: -360, opts: { r: 30, len: 140 } })],
    approach: (c) => [par(move('enc', { y: -8 }, 4), move('lh', { y: -220 }, 4, { wait: false }), slow(6), cam({ x: side * 30, y: -40 }, 0.3))],
    intro: () => [say('enc', 'Bir zamanlar sönmüş bir feneri yeniden yakan bir kaptan vardı…', 3, 1)],
    opts: [() => [gather(rail(side), 'Yaşlı denizciyi dinliyor', { n: 3, dur: 5 }), par(weather({ fog: 0.3 }), sfx('magic')), crewSay([], 'Bak! Uzakta bir fener göz kırpıyor.', { dur: 2.4 })]],
    exit: () => [...driftAll(), weather({ restore: true }), T(0.6)],
  })),
  EVT_X1_ECHO_GROOT_LEGACY: def((ev, side) => ({
    mainId: null,
    setup: (c) => [spawn({ id: 'plank', kind: 'timber', x: besides(c, 26), y: -240, opts: { n: 1 } })],
    approach: (c) => [par(move('plank', { y: -10 }, 4), slow(10))],
    intro: () => [S('pickup', { id: 'plank', prefer: ['CREW_GROOT'], task: 'Oyulmuş tahtayı çekiyor' })],
    opts: [() => [par(work(['CREW_GROOT', 'CAPTAIN'], 'helm', 'Hatırayı dümenin yanına çakıyor', 4, 1.4), deckProp('mem', 'patch', 'helm', { dx: 8 })), only('CREW_GROOT', 'Ustamın işareti… yolumuza eşlik etsin.', { dur: 2.6 }), sfx('repair')]],
    exit: () => [remove('mem'), go(30)],
  })),

  // ════════ Sözleşme sunumları ════════
  CT_X1_DELIVER: def((ev, side) => ({
    side: 1,
    weather: () => [],
    setup: (c) => { const ct = contractOf(c); const f = ct ? CONTRACTS[ct.type].faction : null; return [spawn({ id: 'enc', kind: 'npc', npc: facNpc(f), x: pierX(c), y: -40, layer: 1, dir: 'left' }), spawn({ id: 'g2', kind: 'npc', npc: f === 'crown' ? 'soldier' : f === 'red' ? 'pirate' : 'guard', x: pierX(c, 6), y: -10, layer: 1, dir: 'left' })]; },
    dockApproach: (c) => [cam({ x: pierX(c), y: -20 }, 0.3), say('enc', 'Sözleşmenin teslimatı için buradayım.', 2.4, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c) => { const ct = contractOf(c); const def0 = ct ? CONTRACTS[ct.type] : null; return [def0?.cargo ? board('cr', 'sailor', 'cargo', 'railR', { carry: ct.cargo }) : work(['CAPTAIN'], 'railR', 'Mektubu uzatıyor', 3, 1), def0?.cargo ? unboard('cr', 'railR') : S('icon', { icon: 'scroll', from: 'ship', to: 'enc' }), say('enc', def0?.letter ? 'Mektup ulaştı. Şu fiyat söylentisini de bil.' : 'Mühür sağlam, teslimat kayda geçti.', 2.4, 0.4), S('coins', { from: 'enc', to: 'ship', n: 10 })]; },
      (c) => [par(work(['CREW_VARGAS'], 'railR', 'Yardım sandığını açıyor', 5, 1), only('CREW_VARGAS', 'Önce çocuklar ve yaşlılar.', { dur: 2.4 })), board('cr', 'sailor', 'cargo', 'railR', { carry: 'GOOD_X1_RELIEF' }), unboard('cr', 'railR'), par(fx('spark', { x: pierX(c), y: -30 }, 20), sfx('magic')), S('coins', { from: 'enc', to: 'ship', n: 8 })],
    ],
    skip: () => ['gold'],
    from: () => 'enc',
    exit: () => [],
  })),
  CT_X1_RENDEZVOUS: def((ev, side) => ({
    setup: (c) => { const ct = contractOf(c); const f = ct ? CONTRACTS[ct.type].faction : null; return [shipEntity(c, 'enc', facStyle(f), 2, { scale: 0.85, crewNpc: [facNpc(f), 'sailor'] })]; },
    approach: (c) => [par(move('enc', { x: side * 170, y: -150 }, 2.6), cam({ x: side * 70, y: -70 }, 0.3), sfx('horn')), ...pull(c, 'enc', 2, 0.85), say('enc', 'Buluşma noktası burası. Yükü aktaralım mı?', 2.6, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      (c) => { const ct = contractOf(c); return [plank(side), ct?.cargo ? board('cr', 'sailor', 'cargo', rail(side), { carry: ct.cargo }) : work(['CAPTAIN'], rail(side), 'Belgeyi uzatıyor', 3, 1), ct?.cargo ? unboard('cr', rail(side)) : T(0.4), S('coins', { from: 'enc', to: 'ship', n: 7 })]; },
      () => [cap('Limana yetişeceğiz.', 1.8, 0.6), go(26)],
    ],
    skip: () => ['gold'],
    from: () => 'enc',
    exit: (c) => [unplank(), offAll(rail(side)), sailAway(c)],
  })),
  CT_X1_SALVAGE: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'wreck', x: side * 30, y: -320, opts: { w: 140, h: 80, n: 8 } }), spawn({ id: 'sh', kind: 'shadow', x: side * 30, y: -320, opts: { s: 1.2, a: 0.4 } })],
    approach: (c) => [par(move('enc', { y: -20 }, 4.5), move('sh', { y: -20 }, 4.5, { wait: false }), slow(4), cam({ x: side * 20, y: -20 }, 0.3)), par(stop(), lookout('Lonca haritasındaki işaret burası! Batık aşağıda.', { dur: 2.6 }))],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => dive(c, side, ['CREW_MIRA', 'CREW_NAKAMURA'], 'Batığın kamarasına dalıyor', info.success ? [spawn({ id: 'box', kind: 'chest', x: besides(c, 24), y: 0 }), S('pickup', { id: 'box', prefer: ['CREW_GROOT'], task: 'Kayıt sandığını çekiyor' })] : [par(S('shake', { amount: 8 }), fx('splash', 'ship', 40), sfx('creak'))]),
      (c, info) => [work([], rail(side), 'Kancayı batığa sarkıtıyor', 4, 1.2), S('throw', { from: { rail: side }, to: 'enc', kind: 'rope', arc: 10 }), T(1), ...(info.success ? [spawn({ id: 'box', kind: 'chest', x: side * 30, y: -20 }), S('pickup', { id: 'box', prefer: [], task: 'Sandığı çekiyor' })] : [par(sfx('hook'), crewSay([], 'Halat koptu!', { dur: 1.6 }))])],
      () => [cap('Bu batık bizi de yutar. Vazgeçiyoruz.', 2.4, 0.6), go(26)],
    ],
    exit: () => [remove('box'), ...driftAll(), T(0.6)],
  })),
  CT_X1_ESCORT_DONE: def((ev, side) => ({
    side: 1,
    weather: () => [],
    setup: (c) => [spawn({ id: 'enc', kind: 'npc', npc: 'officer', x: pierX(c), y: -40, layer: 1, dir: 'left' }), shipEntity(c, 'conv', 'merchant', 1, { x: -(c.beam / 2 + 60), y: 260, rot: 0, scale: 0.75, sails: 'full', crewNpc: ['sailor', 'soldier'] })],
    dockApproach: (c) => [cam({ x: 0, y: 20 }, 0.3), move('conv', { y: 40 }, 2.4), par(S('set', { id: 'conv', props: { sails: 'furled' } }), sfx('flag'))],
    intro: () => [say('enc', 'Konvoy limana güvenle girdi. Muhafızlar adına teşekkürler.', 2.6, 0.6)],
    opts: [() => [S('coins', { from: 'enc', to: 'ship', n: 10 }), par(sfx('cheer'), S('flag', { up: true, color: '#24426b' })), T(1), S('flag', { up: false })]],
    skip: () => ['gold'],
    from: () => 'enc',
    exit: () => [par(S('set', { id: 'conv', props: { sails: 'full' } }), move('conv', { y: 420 }, 3)), remove('conv')],
  })),
};

/** Bazı sahnelerde ctx olmadan öndeki konum (gemi boyuna yakın) */
function c0len() { return 150; }
void FACTIONS;

// ════════ Yaşayan Denizler zincirleri (14 aşama, her finalin kendi görüntüsü) ════════
const redShip = (c, extra = {}) => shipEntity(c, 'enc', 'red', 4, { x: c.side * 240, y: -340, rot: Math.PI * 0.9, scale: 0.9, crewNpc: ['redCaptain', 'pirate', 'pirate'], ...extra });
const redIn = (c, side) => [par(move('enc', { x: side * 190, y: -120 }, 3.2), slow(5), cam({ x: side * 70, y: -60 }, 0.32), sfx('horn')), react('danger', side)];
const fogIsle = (c, side, lit = true, y = -340) => spawn({ id: 'lh', kind: 'lighthouseIsle', x: side * (c.beam / 2 + 110), y, opts: { r: 44, len: 200, lit } });

Object.assign(X1_SCENES, {
  // ── Kızıl Kaptan'ın Borcu ──
  CH_X1_RED_1: def((ev, side) => ({
    setup: (c) => [redShip(c)],
    approach: (c) => [...redIn(c, side), say('enc', 'Bana bir borcun var, tüccar!', 2.4, 0.6)],
    intro: () => [crewSay([], 'Hangi borç?!', { dur: 1.6 })],
    opts: [
      (c, info) => [par(gather(rail(side), 'Topları dolduruyor', { n: 4, run: true, dur: 4 }), cam({ x: side * 60, y: -50 }, 0.3, 0.95)), S('fire', { from: 'ship', to: 'enc', n: 3, hit: info.success }), ...(info.success ? [par(fx('splinter', 'enc', 30), say('enc', 'Bu bitmedi!', 1.8, 0.4))] : [S('fire', { from: 'enc', to: 'ship', n: 3, hit: true })])],
      (c) => landing(c, side, ['sailor', 'sailor'], [say('enc', 'Senin değil… önceki kaptanın borcu, demek.', 2.6, 0.8)], [], 150),
      (c, info) => [par(go(70), sfx('depart'), S('shipTo', { x: -side * 40 })), ...(info.success ? [move('enc', { y: -440 }, 3)] : [S('fire', { from: 'enc', to: 'ship', n: 2, hit: true })])],
    ],
    from: () => 'enc',
    exit: (c) => [sailAway(c), go(30)],
  })),
  CH_X1_RED_2: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: -c.beam / 2 - 40, y: -280, opts: { npcs: ['pirate', 'pirate'], dir: 'up' } }), spawn({ id: 'b2', kind: 'rowboat', x: c.beam / 2 + 40, y: -300, opts: { npcs: ['pirate', 'pirate'], dir: 'up' } })],
    approach: (c) => [par(move('enc', { y: -10 }, 3.6), move('b2', { y: 10 }, 3.6, { wait: false }), slow(5), cam({ x: 0, y: -10 }, 0.3, 0.95)), react('danger', side), lookout('İki yanımızda kırmızı bantlı tekneler!', { dur: 2.2 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => { const fl = c.run.chainFlags?.CH_X1_RED_CAPTAIN || c.run.chains?.CH_X1_RED_CAPTAIN?.flags || {}; return fl.hostile
        ? [par(board('p1', 'pirate', 'railL', 'cargo', { wait: false }), board('p2', 'pirate', 'railR', 'cargo', { dx: 8 })), par(sfx('impact'), S('shake', { amount: 6 })), par(unboard('p1', 'railL', { carry: 'GOOD_SPICE' }), unboard('p2', 'railR', { wait: false, carry: 'GOOD_WINE' }))]
        : [S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_GOLD_BAR', arc: 20 }), say('enc', 'Kaptan seni Korsan Koyu\'nda bekliyor.', 2.4, 0.6)]; },
      (c, info) => [par(go(70), sfx('depart')), ...(info.success ? [S('throw', { from: 'enc', to: 'ship', kind: 'bottle', arc: 26 })] : [par(S('shake', { amount: 9 }), fx('splinter', 'ship', 20), sfx('impact'))])],
    ],
    skip: () => ['lost'],
    exit: () => [offAll(), ...driftAll()],
  })),
  CH_X1_RED_3: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk' })],
    setup: (c) => [spawn({ id: 'isle', kind: 'island', x: side * (c.beam / 2 + 120), y: -300, opts: { r: 64, palms: 4 } }), redShip(c, { x: side * (c.beam / 2 + 70), y: -340, rot: 0, sails: 'furled', scale: 0.8 })],
    approach: (c) => [par(move('isle', { y: -80 }, 4.5), move('enc', { y: -150 }, 4.5, { wait: false }), slow(4), cam({ x: side * 80, y: -80 }, 0.3, 0.95)), stop()],
    intro: () => [say('enc', 'Koyuma hoş geldin. Hesap zamanı.', 2.4, 0.6)],
    opts: [
      (c) => [deckProp('book', 'mapTable', 'center'), work(['CAPTAIN'], 'center', 'Eski seyir defterlerini okuyor', 5, 1.4), cap('Bu gemiyi batıran… benim geminin eski kaptanıymış.', 2.6, 0.6), remove('book')],
      (c, info) => landing(c, side, ['sailor', 'sailor'], info.success ? [S('icon', { icon: 'scroll', from: 'isle', to: 'boat' })] : [par(S('fire', { from: 'enc', to: 'boat', n: 2, hit: false }), fx('splash', 'boat', 20))], [], 120),
      (c, info) => [S('fire', { from: 'ship', to: 'enc', n: 3, hit: info.success }), ...(info.success ? [fx('splinter', 'enc', 30)] : [S('fire', { from: 'enc', to: 'ship', n: 3, hit: true })])],
    ],
    from: () => 'enc',
    exit: () => [...driftAll(), weather({ restore: true })],
  })),
  CH_X1_RED_4: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk' })],
    setup: (c) => [redShip(c)],
    approach: (c) => [...redIn(c, side), ...pull(c, 'enc', 4, 0.9, 44), say('enc', 'Ya borç kapanır, ya biz.', 2.4, 0.8)],
    intro: () => [T(0.3)],
    opts: [
      // FİNAL: yenilgi — direk devrilir, kızıl bayrak iner
      (c, info) => [S('fire', { from: 'ship', to: 'enc', n: 4, hit: true }), S('fire', { from: 'enc', to: 'ship', n: 2, hit: !info.success }), ...(info.success ? [par(S('set', { id: 'enc', props: { sails: 'furled', damage: 'critical' } }), fx('splinter', 'enc', 50), sfx('creak')), say('enc', 'Teslim… oluyorum.', 2, 0.6), S('chest', { from: 'enc', to: 'ship' }), S('coins', { from: 'enc', to: 'ship', n: 16 })] : [par(fx('smoke', 'enc', 30), move('enc', { y: -420 }, 3))])],
      // FİNAL: barış — altın kesesi karşıya, iki kaptan tokalaşır
      (c) => [plank(side), S('coins', { from: 'ship', to: 'enc', n: 14 }), board('rc', 'redCaptain', rail(side), 'center', { say: 'Borç kapandı. Kardeşlik seni tanıyor.', endState: 'idle' }), par(work(['CAPTAIN'], 'center', 'Kızıl Kaptanla tokalaşıyor', 3, 1), fx('spark', { x: 0, y: 0 }, 16), sfx('cheer')), unboard('rc', rail(side))],
      // FİNAL: ittifak — hediye sandık, kızıl gemi yan yana seyre geçer
      (c) => [plank(side), S('cargoUse', { goods: [], at: rail(side) }), S('throw', { from: 'ship', to: 'enc', kind: 'crate', good: 'GOOD_SILK', arc: 20 }), say('enc', 'Bir kez seni ben korurum!', 2.2, 0.4), unplank(), par(move('enc', { x: -side * 150, y: -60, sails: 'full' }, 3), go(40), S('flag', { up: true, color: '#b3261e' }), sfx('horn')), T(1.4)],
    ],
    skip: () => ['gold', 'items'],
    from: () => 'enc',
    exit: (c) => [unplank(), offAll(rail(side)), sailAway(c), remove('enc'), weather({ restore: true })],
  })),

  // ── Yitik Tacirin Mührü ──
  CH_X1_SEAL_1: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'chest', x: besides(c, 26), y: -260, opts: { glow: true } })],
    approach: (c) => [par(move('enc', { y: -10 }, 4), slow(6), cam({ x: side * 30, y: -10 }, 0.3, 1.04)), S('pickup', { id: 'enc', prefer: [], task: 'Sandığı güverteye çekiyor' }), deckProp('box', 'chestOpen', 'cargo'), crewSay([], 'Boş… sadece bir mühür var.', { dur: 2.2 })],
    intro: () => [deckProp('seal', 'glowRing', 'cargo', { opts: { col: '#e0b040' } })],
    opts: [
      () => [work(['CAPTAIN'], 'cargo', 'Mührü kamaraya götürüyor', 3), remove('seal')],
      () => [par(deckProp('book', 'mapTable', 'center'), work(['CAPTAIN', 'CREW_HAMID'], 'center', 'Mührün altını kazıyor', 5, 1.2)), sfx('page'), cap('Bir defter numarası…', 2, 0.6), remove('book')],
      (c) => [spawn({ id: 'buyer', kind: 'rowboat', x: besides(c, 20), y: -220, opts: { npcs: ['merchant'], dir: 'up' } }), move('buyer', { y: -10 }, 2.4), S('icon', { icon: 'seal', from: 'ship', to: 'buyer' }), S('coins', { from: 'buyer', to: 'ship', n: 8 }), say('buyer', 'Adınızı deftere yazıyorum, kaptan.', 2.2, 0.6), move('buyer', { y: 260 }, 2.4)],
    ],
    exit: () => [remove('box'), remove('seal'), remove('buyer'), go(30)],
  })),
  CH_X1_SEAL_2: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'guild', 2, { scale: 0.8, crewNpc: ['guild', 'customs'] })],
    approach: (c) => [par(move('enc', { x: side * 170, y: -150 }, 2.6), cam({ x: side * 70, y: -70 }, 0.3)), ...pull(c, 'enc', 2, 0.8), plank(side), board('clerk', 'customs', rail(side), 'center', { say: 'Lütfen… bu kayıtları benden alın.', carry: 'GOOD_X1_LETTER' })],
    intro: () => [T(0.3)],
    opts: [
      () => [S('npcState', { id: 'clerk', carry: null }), work(['CAPTAIN'], 'center', 'Sahte kayıtları inceliyor', 3, 1), sfx('page')],
      (c) => [S('npcState', { id: 'clerk', carry: null }), shipEntity(c, 'gd', 'warship', 3, { x: -side * 240, y: -300, scale: 0.75, crewNpc: ['officer'] }), move('gd', { x: -side * 170, y: -80 }, 2.6), S('icon', { icon: 'scroll', from: 'ship', to: 'gd' }), say('gd', 'Mühürledik. Gözünüz açık olsun.', 2.2, 0.6), move('gd', { y: -440 }, 2.6), remove('gd')],
      () => [S('npcState', { id: 'clerk', carry: null }), gather('cargo', 'Belgeleri ambarın dibine saklıyor', { n: 2, dur: 3 }), sfx('creak')],
    ],
    from: () => 'enc',
    exit: (c) => [unplank(), offAll(rail(side)), sailAway(c)],
  })),
  CH_X1_SEAL_3: def((ev, side) => ({
    setup: (c) => [0, 1, 2].map((i) => shipEntity(c, i ? 'cv' + i : 'enc', i ? 'merchant' : 'guild', 2, { x: side * (190 + i * 40), y: -360 - i * 60, scale: 0.72 })),
    approach: (c) => [par(move('enc', { x: alongside(c, 0.72, 2, 20), y: -10, rot: 0 }, 4), move('cv1', { x: side * 230, y: -140, rot: 0 }, 4, { wait: false }), move('cv2', { x: side * 230, y: 110, rot: 0 }, 4, { wait: false }), S('speed', { v: 16 }), cam({ x: side * 70, y: 0 }, 0.3, 0.92)), say('enc', 'Belgeler bizde kalsın, kese sizde. Anlaştık mı?', 2.6, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      () => [plank(side), S('icon', { icon: 'scroll', from: 'ship', to: 'enc' }), S('coins', { from: 'enc', to: 'ship', n: 10 })],
      () => [cap('Mühür satılık değil.', 2, 0.6), par(move('enc', { y: 280 }, 3), move('cv1', { y: 240 }, 3, { wait: false }), move('cv2', { y: 330 }, 3, { wait: false }))],
      (c, info) => [work(['CREW_YARA', 'CAPTAIN'], rail(side), 'Gizlice konvoyu gözlüyor', 4, 1), ...(info.success ? [S('icon', { icon: 'book', from: 'cv1', to: 'ship' }), sfx('page')] : [say('enc', 'Casus! Uzak durun!', 2, 0.4), S('fire', { from: 'enc', to: 'ship', n: 1, hit: true })])],
    ],
    exit: () => [unplank(), par(move('enc', { y: 280 }, 3), move('cv1', { y: 240 }, 3, { wait: false }), move('cv2', { y: 330 }, 3, { wait: false })), remove('cv1'), remove('cv2'), go(30)],
  })),
  CH_X1_SEAL_4: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 24), y: -260, opts: { npcs: ['merchant', 'servant'], dir: 'up' } })],
    approach: (c) => [par(move('enc', { y: -8 }, 4), slow(5), cam({ x: side * 40, y: -10 }, 0.3)), stop(), board('tac', 'merchant', rail(side), 'center', { say: 'O mühür benim. Yıllardır onu arıyorum.' })],
    intro: () => [deckProp('seal', 'glowRing', 'center', { dx: -10, opts: { col: '#e0b040' } })],
    opts: [
      // FİNAL: ifşa — muhafız gemisi gelir, zincirler, mühür sahibine döner
      (c) => [shipEntity(c, 'gd', 'warship', 4, { x: -side * 260, y: -320, scale: 0.85, crewNpc: ['officer', 'soldier'] }), par(move('gd', { x: -side * 170, y: -60 }, 2.6), sfx('horn')), say('gd', 'Sahte kayıt tutanlar tutuklandı!', 2.4, 0.6), par(remove('seal'), S('say', { actor: 'tac', text: 'Mührüm… sonunda!', dur: 2, hold: 0.4 }), fx('spark', 'ship', 20), sfx('cheer')), move('gd', { y: -440 }, 2.6), remove('gd')],
      // FİNAL: satış — gölgeli tekne, ağır keseler, tacir başını eğer
      (c) => [unboard('tac', rail(side)), spawn({ id: 'shady', kind: 'rowboat', x: besides(c, 24, -side), y: 200, opts: { npcs: ['smuggler', 'smuggler'], dir: 'up' } }), move('shady', { y: 0 }, 2.4), par(remove('seal'), S('icon', { icon: 'scroll', from: 'ship', to: 'shady' })), S('coins', { from: 'shady', to: 'ship', n: 18 }), move('shady', { y: 280 }, 2.4), remove('shady')],
      // FİNAL: lonca — altın bayraklı lonca gemisi selam verir
      (c) => [shipEntity(c, 'gs', 'guild', 3, { x: -side * 250, y: -320, scale: 0.8, crewNpc: ['guild'] }), move('gs', { x: -side * 170, y: -60 }, 2.6), par(remove('seal'), S('icon', { icon: 'scroll', from: 'ship', to: 'gs' }), S('flag', { up: true, color: '#e0b040' }), sfx('flag')), say('gs', 'Lonca dostlarını unutmaz.', 2.2, 0.6), move('gs', { y: -440 }, 2.6), remove('gs')],
    ],
    skip: () => ['gold'],
    exit: () => [remove('seal'), offAll(rail(side)), move('enc', { y: 260 }, 2.4), go(30)],
  })),

  // ── Fenerin Son Bekçisi ──
  CH_X1_LIGHT_1: def((ev, side) => ({
    weather: () => [weather({ fog: 1, dark: 0.1 })],
    setup: (c) => [fogIsle(c, side, false)],
    approach: (c) => [par(move('lh', { y: -120 }, 4.5), slow(6), cam({ x: side * 70, y: -80 }, 0.3)), ...[0, 1, 2].map(() => [S('opts', { id: 'lh', opts: { r: 44, len: 200, lit: true, speed: 0 } }), T(0.3), S('opts', { id: 'lh', opts: { r: 44, lit: false } }), T(0.3)]), lookout('Üç kısa ışık… bir çağrı!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      () => [par(deckProp('lamp', 'lantern', 'bow'), work(['CAPTAIN'], 'bow', 'Fenerle üç kez cevap veriyor', 3, 1)), ...[0, 1, 2].map(() => [fx('spark', { rail: 0, dy: -60 }, 8), T(0.4)]), S('opts', { id: 'lh', opts: { r: 44, len: 200, lit: true, speed: 0.4 } }), remove('lamp')],
      () => [work(['CREW_TOBIAS', 'CAPTAIN'], 'bow', 'Dürbünle fenere bakıyor', 4, 1), cap('Camı kırık… kapısı açık.', 2, 0.6)],
      () => [par(go(28), S('heel', { rot: -side * 0.08 })), T(1), S('heel', { rot: 0 })],
    ],
    exit: () => [...driftAll(), weather({ restore: true })],
  })),
  CH_X1_LIGHT_2: def((ev, side) => ({
    weather: () => [weather({ fog: 1, dark: 0.12 })],
    setup: (c) => [fogIsle(c, side, false), spawn({ id: 'pier', kind: 'timber', x: side * (c.beam / 2 + 50), y: -300, opts: { n: 5 } })],
    approach: (c) => [par(move('lh', { y: -60 }, 4.5), move('pier', { y: -20 }, 4.5, { wait: false }), slow(4), cam({ x: side * 70, y: -40 }, 0.3)), stop(), crewSay([], 'İçeriden öksürük sesi geliyor…', { dur: 2.2 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => landing(c, side, ['sailor', 'sailor'], info.success ? [S('icon', { icon: 'lantern', from: 'lh', to: 'boat' })] : [par(fx('splinter', 'pier', 30), sfx('creak'), S('shake', { amount: 6 }))], [], 100),
      () => [stop(), weather({ night: true }), work(['CAPTAIN'], 'bow', 'Sabaha kadar nöbet tutuyor', 5, 1), weather({ night: false })],
      () => [par(go(26), cap('Bu sisle olmaz. Geri dönüyoruz.', 2, 0.6))],
    ],
    exit: () => [...driftAll(), weather({ restore: true })],
  })),
  CH_X1_LIGHT_3: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [fogIsle(c, side, false), spawn({ id: 'enc', kind: 'npc', npc: 'keeper', x: side * (c.beam / 2 + 90), y: -320, layer: 1 })],
    approach: (c) => [par(move('lh', { y: -40 }, 4.5), move('enc', { y: -20 }, 4.5, { wait: false }), slow(4), cam({ x: side * 80, y: -30 }, 0.3)), stop(), say('enc', 'Son yağ şişesi… son nöbet.', 2.4, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      // FİNAL: kurtar — bekçi sandalla gemiye, sönük fener geride
      (c) => [remove('enc'), ...landing(c, side, ['sailor', 'keeper'], [T(0.6)], [], 90), board('kp', 'keeper', rail(side), 'center', { endState: 'sit', say: 'Sen olmasaydın…' }), par(sfx('cheer'), fx('spark', 'ship', 14))],
      // FİNAL: yeniden yak — ışık döner, sis dağılır, yol aydınlanır
      (c) => [...landing(c, side, ['sailor', 'sailor'], [S('icon', { icon: 'lantern', from: 'boat', to: 'lh' }), par(S('opts', { id: 'lh', opts: { r: 44, len: 260, lit: true, speed: 0.8 } }), S('flash', {}), sfx('magic')), weather({ night: false, fog: 0 })], [], 90), spawn({ id: 'path', kind: 'sparkles', x: 0, y: -120, layer: 2, opts: { r: 70, col: '#fff0a0' } }), crewSay([], 'Fener yanıyor! Yol apaçık!', { dur: 2.2 })],
      // FİNAL: terk — erzak sandığı kıyıya, fener karanlıkta kalır
      (c) => [S('throw', { from: { rail: side }, to: 'enc', kind: 'crate', good: 'GOOD_GRAIN', arc: 30 }), say('enc', 'Yolunuz açık olsun…', 2, 0.6), par(go(26), weather({ dark: 0.3 })), move('lh', { alpha: 0.4 }, 3)],
    ],
    exit: () => [remove('path'), offAll('cargo'), ...driftAll(), weather({ restore: true })],
  })),

  // ── Groot'un Yarım Kalan Gemisi ──
  CH_X1_GROOT_1: def((ev, side) => ({
    mainId: null,
    setup: (c) => [spawn({ id: 'plank', kind: 'timber', x: besides(c, 26), y: -240, opts: { n: 1 } })],
    approach: (c) => [par(move('plank', { y: -10 }, 4), slow(6), cam({ x: side * 20, y: 0 }, 0.3, 1.05)), S('pickup', { id: 'plank', prefer: ['CREW_GROOT'], task: 'Kereste parçasını çekiyor' })],
    intro: () => [deckProp('mark', 'patch', 'center')],
    opts: [
      () => [par(work(['CREW_GROOT'], 'center', 'Usta işaretine dokunuyor', 5, 1.6), only('CREW_GROOT', 'Bu ustamın işareti… yarım kalan son gemisi.', { dur: 2.8 })), work(['CAPTAIN'], 'center', 'Groot\'u dinliyor', 3)],
      () => [work([], 'cargo', 'Tahtayı bir köşeye kaldırıyor', 3), remove('mark')],
    ],
    exit: () => [remove('mark'), go(30)],
  })),
  CH_X1_GROOT_2: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'workshopIsle', x: side * (c.beam / 2 + 120), y: -340, opts: { r: 62 } })],
    approach: (c) => [par(move('enc', { y: -60 }, 4.5), slow(4), cam({ x: side * 80, y: -40 }, 0.3)), stop(), only('CREW_GROOT', 'Atölye… hâlâ ayakta.', { dur: 2.2 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => landing(c, side, ['villager', 'sailor'], [par(fx('spark', 'enc', 10), sfx('repair')), S('icon', { icon: 'hammer', from: 'enc', to: 'boat' })], [], 110),
      (c) => landing(c, side, ['sailor', 'sailor'], [S('icon', { icon: 'crate', from: 'enc', to: 'boat' })], [], 110),
      (c) => [weather({ night: true }), landing(c, side, ['villager'], [T(2)], [], 110), weather({ night: false }), only('CREW_GROOT', 'Teşekkürler, kaptan.', { dur: 2 })],
      () => [par(work(['CAPTAIN'], rail(side), 'Atölyeyi selamlıyor', 3), go(24))],
    ],
    exit: () => [...driftAll()],
  })),
  CH_X1_GROOT_3: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'workshopIsle', x: side * (c.beam / 2 + 120), y: -340, opts: { r: 62 } })],
    approach: (c) => [par(move('enc', { y: -60 }, 4.5), slow(4), cam({ x: side * 80, y: -40 }, 0.3)), stop()],
    intro: () => [only('CREW_GROOT', 'Son çivi… benim elimden çakılmalı.', { dur: 2.4 })],
    opts: [
      // FİNAL: onar — kızaktan küçük bir gemi suya iner ve yelken açar
      (c) => [...landing(c, side, ['villager', 'sailor'], [...[0, 1, 2].map(() => [sfx('repair'), fx('spark', 'enc', 12), T(0.4)]), S('opts', { id: 'enc', opts: { r: 62, done: true } })], [], 110), shipEntity(c, 'built', 'merchant', 1, { x: side * (c.beam / 2 + 100), y: -60, rot: 0, scale: 0.6, alpha: 0, crewNpc: [] }), par(move('built', { alpha: 1 }, 1), fx('splash', { x: side * (c.beam / 2 + 100), y: -60 }, 30), sfx('splash'), sfx('cheer')), move('built', { y: -440, sails: 'full' }, 4)],
      // FİNAL: kurtar — keresteler ve usta aletleri güverteye
      (c) => [...landing(c, side, ['sailor', 'sailor'], [S('icon', { icon: 'crate', from: 'enc', to: 'boat' })], [], 110), deckProp('tools', 'crate', 'cargo', { dx: 6 }), par(fx('spark', 'ship', 16), sfx('repair'))],
      // FİNAL: anı — sessiz tören, fener ışığı ve şapkalar
      (c) => [weather({ dark: 0.15 }), gather(rail(side), 'Sessiz tören', { n: 5, dur: 6 }), par(spawn({ id: 'cand', kind: 'sparkles', x: side * (c.beam / 2 + 110), y: -60, layer: 2, opts: { r: 30, col: '#ffd890' } }), sfx('magic')), only('CREW_GROOT', 'Huzur içinde, usta.', { dur: 2.4 }), remove('cand'), weather({ dark: 0 })],
      () => [cap('Groot olmadan olmaz. Kapıyı kapatıyoruz.', 2.4, 0.6), go(24)],
    ],
    exit: () => [remove('tools'), remove('built'), ...driftAll(), weather({ restore: true })],
  })),
});
