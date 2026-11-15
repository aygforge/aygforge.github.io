// TAYFA ve HAYVAN eventleri — imza sahneleri. Yeni tayfa adayları sandal/sal/rıhtımdan gelir;
// hayvan eventleri doğrudan güvertedeki gerçek hayvanlarla oynanır.
import {
  S, par, wait, def, rail, shipEntity, alongside, besides, cap, crewSay, only, lookout, say, slow, stop, go, cam,
  react, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, weather, call, driftAll, offAll, oi, landing,
} from '../kit.js';

const T = (n) => wait(n);
/** Gemiye çıkan aday tayfa: yeni tayfa güvertede onun durduğu yerde belirir */
const becomeCrew = (id) => call((d) => { const t = d.world.deck.temp.find((q) => q.id === id); if (t) { d.world.deck.spawnAt = { x: t.x, y: t.y }; d.world.deck.temp = d.world.deck.temp.filter((q) => q !== t); } });

export const CREW_PET_SCENES = {
  // ───────── KAZAZEDE ─────────
  EVT_CREW_01: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'raft', x: besides(c, 34), y: -280 })],
    approach: (c) => [par(move('enc', { y: -10 }, 4.5), slow(5), cam({ x: side * 40, y: -10 }, 0.25)), par(stop(), react('fortune', side), lookout('Salda biri var! El sallıyor!', { dur: 2.2 })), say('enc', 'Su… su…', 2, 0.6)],
    intro: () => [T(0.4)],
    opts: [
      (c) => [par(work(['CREW_GROOT', 'CREW_BJORN'], rail(side), 'Kazazedeyi güverteye çekiyor', 4), S('throw', { from: { rail: side }, to: 'enc', kind: 'rope', arc: 18 })), T(0.6), board('cast', 'castaway', rail(side), 'center', { say: 'Tanrı sizi korusun…', endState: 'sit' }), par(work(['CREW_PITA', 'CREW_VARGAS'], 'center', 'Kazazedeye su veriyor', 4), deckProp('cup', 'bucket', 'center', { dx: 8 })), S('say', { actor: 'cast', text: 'Bana bir iş verin, kaptan. Pişman olmazsınız.', dur: 2.8, hold: 0.6 }), S('npcState', { id: 'cast', state: 'idle' })],
      (c) => [cap('Su, erzak ve bir pusula. En yakın ada kuzeyde.', 2.6, 0.6), S('throw', { from: 'ship', to: 'enc', kind: 'crate', good: 'GOOD_BISCUIT_CRATE', arc: 20 }), say('enc', 'Minnettarım!', 2, 0.6), move('enc', { y: 240, x: besides(c, 80) }, 3)],
    ],
    outcome: (c, info) => [],
    exit: (c) => [remove('cup'), offAll(rail(side)), ...driftAll()],
  })),

  // ───────── YÜZEN MEYHANE ─────────
  EVT_CREW_02: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [spawn({ id: 'enc', kind: 'tavern', x: side * (c.beam / 2 + 60), y: -320 }), spawn({ id: 'ff', kind: 'sparkles', x: side * (c.beam / 2 + 60), y: -330, layer: 2, opts: { r: 50, col: '#ffd060', n: 18 } })],
    approach: (c) => [par(move('enc', { y: -20 }, 4.5), move('ff', { y: -30 }, 4.5, { wait: false }), slow(4), cam({ x: side * 60, y: -20 }, 0.3), sfx('cheer')), par(stop(), react('fortune', side), crewSay(['CREW_DIEGO', 'CREW_BJORN'], 'Yüzen meyhane! Şarkılar, zarlar!', { dur: 2.6 }))],
    intro: () => [say('enc', '♪ Yo ho, bir şişe rom! ♪', 2.4, 0.8)],
    opts: [
      (c) => [board('r1', 'sailor', rail(side), rail(side), { dy: -16, endState: 'idle' }), board('r2', 'pirate', rail(side), rail(side), { dy: 6, wait: false, endState: 'idle' }), board('r3', 'deserter', rail(side), rail(side), { dy: 26, endState: 'idle' }), cap('Romlar benden! Kim gemime gelir?', 2.4, 0.6), sfx('cheer')],
      (c, info) => [par(deckProp('dice', 'dice', rail(side), { dx: -side * 12 }), work(['CAPTAIN'], rail(side), 'Zar atıyor', 4), sfx('dice')), T(1.4), sfx('dice'), info.success ? par(cap('Altılı! Hahaha!', 2, 0.4), sfx('cheer')) : par(cap('Yine mi bir-iki…', 2, 0.4), say('enc', 'Hahaha! Kesene teşekkürler!', 2.2, 0.4))],
      () => [cap('Bu gece değil.', 1.8, 0.6), go(24), T(1)],
    ],
    from: () => 'enc',
    exit: () => [remove('dice'), offAll(rail(side)), remove('ff'), ...driftAll(), weather({ restore: true })],
  })),

  // ───────── FENER ADASI ─────────
  EVT_CREW_03: def((ev, side) => ({
    weather: () => [weather({ dark: 0.14 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'island', x: side * (c.beam / 2 + 110), y: -330, opts: { r: 50, lighthouse: true, palms: 1, ground: '#6a6a62' } }), spawn({ id: 'beam', kind: 'lightBeam', x: side * (c.beam / 2 + 120), y: -338, layer: 2, opts: { len: 200 } }), spawn({ id: 'keeper', kind: 'npc', npc: 'keeper', x: side * (c.beam / 2 + 70), y: -320, layer: 1, dir: side < 0 ? 'right' : 'left' })],
    approach: (c) => [par(move('enc', { y: -30 }, 4.5), move('beam', { y: -38 }, 4.5, { wait: false }), move('keeper', { y: -20 }, 4.5, { wait: false }), slow(4), cam({ x: side * 80, y: -30 }, 0.3)), par(stop(), react('fortune', side)), say('keeper', 'Hey, gemi! Buraya!', 2.2, 0.6)],
    intro: () => [say('keeper', 'Fenerime bir çırak buldum. Artık denize açılmak istiyorum!', 3, 1)],
    opts: [
      (c) => landing(c, side, ['sailor'], [remove('keeper'), S('opts', { id: 'boat', opts: { npcs: ['sailor', 'keeper'] } }), T(0.4)], [], 60).concat([board('kp', 'keeper', rail(side), 'bow', { say: 'Adım Tobias. Fenerim artık senin gözün!' }), becomeCrew('kp'), sfx('cheer')]),
      () => [S('throw', { from: 'ship', to: 'keeper', kind: 'crate', good: 'GOOD_OLIVE_OIL', arc: 30 }), say('keeper', 'Sağ ol! Önünde iki tehlike var, dikkat et!', 2.8, 0.8), deckProp('tip', 'sparkles', 'center', { opts: { r: 22, col: '#ffe080' } })],
    ],
    from: () => null,
    exit: () => [remove('tip'), remove('keeper'), ...driftAll(), weather({ restore: true })],
  })),

  // ───────── KAÇAK ASKERLER ─────────
  EVT_CREW_04: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 24), y: -260, opts: { npcs: ['deserter', 'deserter'], dir: 'up' } }), shipEntity(c, 'adm', 'warship', 4, { x: -side * 210, y: -420, scale: 0.7, rot: Math.PI })],
    approach: (c) => [par(move('enc', { y: -10 }, 4.5), move('adm', { y: -360 }, 4.5, { wait: false }), slow(4), cam({ x: side * 30, y: -40 }, 0.3)), par(stop(), react('danger', side), lookout('Ufukta amiralin yelkenleri!', { dur: 2.2 }))],
    intro: () => [say('enc', 'Zalim amiralden kaçtık! Sığınak verin, ne olur!', 2.8, 1)],
    opts: [
      () => [board('d1', 'deserter', rail(side), 'cargo', { wait: false }), board('d2', 'deserter', rail(side), 'cargo'), cap('Ambara! Ses çıkarmayın.', 2, 0.4), unboard('d1', 'cargo'), unboard('d2', 'cargo', { wait: false }), par(move('adm', { y: -460 }, 3), crewSay([], 'Amiral bizi görmedi…', { dur: 2.2 }))],
      (c) => [par(S('throw', { from: { rail: 0, dy: -20 }, to: 'adm', kind: 'flare', arc: 60, burst: 'spark' }), sfx('cannon')), move('adm', { x: -alongside(c, 0.8, 4, 30), y: -60 }, 3), say('enc', 'Hain! Bizi sattın!', 2.4, 0.6), par(move('enc', { x: -alongside(c, 0.8, 4, 30) + side * 10, y: -40 }, 2), S('coins', { from: 'adm', to: 'ship', n: 10 }))],
      (c) => [S('throw', { from: 'ship', to: 'enc', kind: 'crate', good: 'GOOD_BISCUIT_CRATE', arc: 20 }), say('enc', 'Unutmayacağız, kaptan!', 2.2, 0.6), move('enc', { y: 260, x: besides(c, 90) }, 3)],
    ],
    from: () => 'adm',
    skip: (info) => (oi(info) === 1 ? ['gold'] : []),
    exit: () => [offAll('cargo'), par(move('adm', { y: -480 }, 3), move('enc', { y: 300 }, 3, { wait: false })), remove('adm'), go(30)],
  })),

  // ───────── ADA KABİLESİNİN SINAVI ─────────
  EVT_CREW_05: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'island', x: side * (c.beam / 2 + 120), y: -330, opts: { r: 62, huts: true, villagers: true, palms: 6 } }), spawn({ id: 'chief', kind: 'npc', npc: 'chief', x: side * (c.beam / 2 + 74), y: -320, layer: 1, dir: side < 0 ? 'right' : 'left' })],
    approach: (c) => [par(move('enc', { y: -40 }, 4.5), move('chief', { y: -30 }, 4.5, { wait: false }), slow(4), cam({ x: side * 80, y: -30 }, 0.3), sfx('drum')), par(stop(), react('fortune', side), sfx('drum'))],
    intro: () => [say('chief', 'En cesur savaşçımı ancak sınavı geçene veririm!', 3, 1)],
    opts: [
      (c, info) => [
        spawn({ id: 'canoe1', kind: 'rowboat', x: besides(c, 20), y: 20, opts: { npcs: ['sailor'], dir: 'up' } }), spawn({ id: 'canoe2', kind: 'rowboat', x: besides(c, 50), y: 20, opts: { npcs: ['villager'], dir: 'up' } }),
        par(sfx('drum'), say('chief', 'Kano yarışı! Başla!', 2, 0.4)),
        par(move('canoe1', { y: -260 }, info.success ? 3 : 3.6), move('canoe2', { y: -260 }, info.success ? 3.6 : 3, { wait: false })),
        par(sfx(info.success ? 'cheer' : 'drum'), say('chief', info.success ? 'Hahaha! Kazandınız! Savaşçım sizin!' : 'Kaybettiniz… ama misafirimizsiniz.', 2.8, 0.8)),
        ...(info.success ? [board('w1', 'chief', rail(side), rail(side), { dy: -10, endState: 'idle' })] : []),
      ],
      () => [S('throw', { from: 'ship', to: 'chief', kind: 'chest', arc: 30, burst: 'gold', sfx: 'coin' }), say('chief', 'Cömert kaptan! Şifacım ve rehberim seninle gelsin.', 3, 0.8), board('w1', 'villager', rail(side), rail(side), { dy: -10, endState: 'idle' }), board('w2', 'villagerF', rail(side), rail(side), { dy: 14, endState: 'idle', wait: false })],
      () => [cap('Sağ olun. Yolumuz uzun.', 2, 0.6), sfx('drum'), go(24)],
    ],
    from: () => null,
    exit: () => [remove('canoe1'), remove('canoe2'), offAll(rail(side)), remove('chief'), ...driftAll()],
  })),

  // ───────── CÜCE KAPTAN İŞ BAŞINDA ─────────
  EVT_PET_MONKEY: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: () => [par(slow(14), cam({ x: 0, y: -20 }, 0.3, 1.05)), pet('PET_CUCE', { at: 'mast', pose: 'climb', dur: 20 }), crewSay(['CREW_HAMID'], 'Tespihim nerede?!', { dur: 2 }), crewSay(['CREW_BJORN', 'CREW_PITA'], 'Benim kepçem de yok!', { dur: 2 }), par(lookout('Direğin tepesinde… kaptan şapkalı biri!', { dur: 2.4 }), deckProp('stash', 'chestOpen', 'mast', { dx: 8, layer: 2 }))],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [gather('mast', 'Maymunu kovalıyor', { n: 3, run: true, dur: 4 }), pet('PET_CUCE', { at: info.success ? 'center' : 'bow', pose: 'hold', dur: 4 }), T(1.2), info.success ? par(crewSay([], 'Yakaladım!', { dur: 1.8 }), fx('gold', 'ship', 12)) : par(crewSay([], 'Ayağım halata takıldı!', { dur: 2 }), S('shake', { amount: 4 }), sfx('creak'))],
      () => [par(work(['CAPTAIN'], 'mast', 'Bisküvi uzatıyor', 4), cap('Gel bakalım küçük kaptan… bisküvi!', 2.4, 0.6)), pet('PET_CUCE', { at: 'mast', pose: 'hold', dur: 4 }), par(remove('stash'), crewSay([], 'Eşyalarımız geri geldi!', { dur: 2 }), sfx('cheer'))],
      () => [cap('Bırakın. O da tayfadan biri.', 2.2, 0.6), crewSay([], 'Hmph…', { dur: 1.6 }), pet('PET_CUCE', { at: 'mast', pose: 'climb', dur: 6 })],
    ],
    exit: () => [remove('stash'), go(30)],
  })),

  // ───────── PAPAĞAN ÇIĞLIĞI ─────────
  EVT_PET_PARROT: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 2, { x: side * 220, y: -260, rot: Math.PI, crewNpc: ['merchant', 'sailor', 'sailor'] })],
    approach: (c) => [par(move('enc', { x: side * 170, y: -60 }, 4), S('speed', { v: 14 }), cam({ x: side * 70, y: -40 }, 0.3)), pet('PET_KIRMIZI', { at: 'mast', dur: 8 }), par(S('say', { prefer: ['PET_KIRMIZI'], text: '"Yelkenleri gerin, tembeller!"', dur: 2.6 }), sfx('squawk')), say('enc', 'Hahahaha!', 2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      () => [par(S('say', { prefer: ['PET_KIRMIZI'], text: '"Rom nerede?! ROM NEREDE?!"', dur: 2.6 }), sfx('squawk')), say('enc', 'Hahaha! Al şu keseyi, kuş için!', 2.4, 0.6), S('throw', { from: 'enc', to: 'ship', kind: 'chest', arc: 40, burst: 'gold', sfx: 'coin' })],
      () => [pet('PET_KIRMIZI', { at: 'bow', dur: 6 }), par(S('say', { prefer: ['PET_KIRMIZI'], text: 'Kara yelken! KARA YELKEN!', dur: 2.6 }), sfx('squawk')), lookout('Kuş önümüzdekileri görüyor!', { dur: 2.2 })],
    ],
    skip: (info) => (oi(info) === 0 ? ['gold'] : []),
    exit: () => [move('enc', { y: 300 }, 3), go(30)],
  })),

  // ───────── AY TAŞI ─────────
  EVT_PET_MIDNIGHT: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ night: true })],
    setup: () => [spawn({ id: 'moon', kind: 'moon', x: side * 60, y: -40 }), spawn({ id: 'stars', kind: 'stars', x: 0, y: 0, screen: true, layer: 3, opts: { n: 50, H: 200 } })],
    approach: () => [par(slow(10), cam({ x: 0, y: -40 }, 0.3)), pet('PET_GECEYARISI', { at: 'bow', dur: 10, fluff: 4 }), par(S('say', { prefer: ['PET_GECEYARISI'], text: 'Kraaa… kraaa…', dur: 2.4 }), sfx('squawk')), par(deckProp('stone', 'moonStone', 'bow', { dy: 8 }), sfx('magic'), crewSay([], 'Kanadının altında bir taş parlıyor!', { dur: 2.4 }))],
    intro: () => [T(0.3)],
    opts: [
      () => [work(['CAPTAIN'], 'bow', 'Taşı alıyor', 3, 1.2), cap('Avucumda ısınıyor…', 2.2, 0.6), remove('stone'), S('icon', { icon: 'gift', from: { x: 0, y: -60 }, to: { x: 0, y: -100 } })],
      () => [...[0, 1, 2].map(() => [S('say', { prefer: ['PET_GECEYARISI'], text: 'KRAAA!', dur: 0.8 }), sfx('squawk'), fx('spark', { x: 0, y: -80 }, 8), T(0.6)]), cap('Üç gölge… önümüzde.', 2.2, 0.6)],
    ],
    exit: () => [remove('stone'), remove('moon'), remove('stars'), weather({ restore: true }), go(30)],
  })),

  // ───────── TARÇIN'IN BURNU ─────────
  EVT_PET_TARCIN_NOSE: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: () => [par(slow(14), cam({ x: 0, y: 10 }, 0.3, 1.06)), pet('PET_TARCIN', { at: 'cargo', pose: 'wag', dur: 8, run: false, task: 'Ambarın köşesini kokluyor' }), T(1.4), crewSay([], 'Tarçın bir şey buldu!', { dur: 2 })],
    intro: () => [pet('PET_TARCIN', { at: 'cargo', pose: 'bark', dur: 3, say: 'Hav! Hav!', sfx: 'bark' }), T(0.6)],
    opts: [() => [gather('cargo', 'Tarçın\'ın bulduğuna bakıyor', { n: 3, run: true }), par(deckProp('find', 'chestOpen', 'cargo', { dx: 8 }), sfx('chest'), fx('gold', 'ship', 10)), cap('Aferin oğlum!', 2, 0.6), pet('PET_TARCIN', { pose: 'wag', dur: 4 })]],
    exit: () => [remove('find'), go(30)],
  })),
};
