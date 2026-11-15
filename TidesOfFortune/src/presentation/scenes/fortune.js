// ŞANS eventleri — imza sahneleri.
import {
  S, par, wait, def, rail, shipEntity, alongside, besides, cap, crewSay, only, lookout, say, slow, stop, go, cam,
  react, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, weather, call, driftAll, offAll, oi,
} from '../kit.js';

const T = (n) => wait(n);
/** Yanaşma: dönerken bize sürtünmesin diye önce açıkta döner, sonra yana kayar */
const pullAlongside = (c, id, level = 2, scale = 1, gap = 14) => [
  move(id, { x: c.side * 190, y: -20, rot: 0, sails: 'furled' }, 2.4),
  move(id, { x: alongside(c, scale, level, gap), y: -6 }, 1.6),
];

export const FORTUNE_SCENES = {
  // ───────── DOSTANE TÜCCAR ─────────
  EVT_F_02: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 3, { crewNpc: ['merchant', 'sailor', 'sailor'], scale: 0.9 }), spawn({ id: 'flags', kind: 'sparkles', x: side * 190, y: -330, layer: 1, opts: { r: 30, col: '#ff8a5a', n: 14 } })],
    approach: (c) => [
      par(move('enc', { x: side * 170, y: -160 }, 2.4), move('flags', { x: side * 170, y: -170 }, 2.4, { wait: false }), cam({ x: side * 80, y: -80 }, 0.3), sfx('horn')),
      par(react('fortune', side), slow(6), lookout('Rengârenk flamalar! Dost bir tüccar.', { dur: 2.4 })),
      remove('flags'), ...pullAlongside(c, 'enc', 3, 0.9),
    ],
    intro: () => [say('enc', 'Selam dostum! Ambarım dolu, fiyatlarım tatlı. Takas?', 3, 1.2)],
    opts: [
      () => [
        call((d) => { const e = d.world.get('enc'); const L = d.world.layout(); if (e) e.hooks = [{ x0: e.x - side * 16, y0: e.y, x1: d.world.ship.x + side * (L.beam / 2 - 6), y1: d.world.ship.y, plank: true }]; d.hooks.sfx?.('creak'); }),
        board('mer', 'merchant', rail(side), 'cargo', { say: 'Bakalım neler var… ooh, güzel mallar!', face: 'down', endState: 'work' }),
        work(['CREW_HAMID', 'CREW_TARIK', 'CREW_MEILIN'], 'cargo', 'Takas pazarlığı yapıyor', 4, 0.6),
      ],
      () => [
        par(work(['CAPTAIN'], rail(side), 'Tüccarla sohbet ediyor', 5), cap('Hangi limandan geliyorsun, dostum?', 2.4, 0.8)),
        say('enc', 'Güneyden! Al şu keseyi, dostluğumuza!', 2.6, 0.8),
      ],
      () => [cap('Rüzgârın bol olsun!', 2, 0.6), say('enc', 'Seninki de!', 1.8, 0.4), go(28)],
    ],
    exit: (c) => [unboard('mer', rail(side)), call((d) => { const e = d.world.get('enc'); if (e) e.hooks = null; }), par(go(30), move('enc', { y: 300 }, 3))],
  })),

  // ───────── BALIK SÜRÜSÜ ─────────
  EVT_F_03: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'shoal', x: besides(c, 56), y: -260, opts: { n: 60, w: 80, h: 70 } }), spawn({ id: 'fish2', kind: 'shoal', x: -besides(c, 46), y: -300, opts: { n: 34, w: 60, h: 50 } }), spawn({ id: 'gulls', kind: 'birds', x: side * 60, y: -280, layer: 2, opts: { n: 9 } })],
    approach: (c) => [
      par(move('enc', { y: -10 }, 4), move('fish2', { y: -40 }, 4, { wait: false }), move('gulls', { y: -40 }, 4, { wait: false }), slow(6), cam({ x: side * 40, y: -20 }, 0.25), sfx('gull')),
      par(react('fortune', side), slow(1), lookout('Su gümüş gibi! Binlerce balık!', { dur: 2.4 }), sfx('gull')),
    ],
    intro: () => [pet('PET_ZIPIR', { at: rail(side), pose: 'sit', dur: 6, run: false }), crewSay(['CREW_NAKAMURA', 'CREW_PITA'], 'Bu akşam ziyafet var!', { dur: 2.2 })],
    opts: [
      (c) => [
        par(gather(rail(side), 'Ağı atıyor', { n: 2, run: true, dur: 4 }), S('throw', { from: { rail: side }, to: { x: besides(c, 40), y: 0 }, kind: 'rope', arc: 22 }), sfx('splash')),
        spawn({ id: 'net', kind: 'net', x: besides(c, 40), y: 0, opts: { fish: 18, r: 20 } }), T(1.2),
        par(gather(rail(side), 'Ağı çekiyor', { n: 4, run: true, dur: 4 }), crewSay([], 'Hep birlikte… ÇEK!', { dur: 2 })),
        S('pickup', { id: 'net', prefer: ['CREW_GROOT', 'CREW_BJORN'], task: 'Dolu ağı çekiyor' }),
        par(deckProp('fishD', 'fishPile', 'cargo', { dx: -side * 8, opts: { n: 18 } }), sfx('cheer')),
      ],
      (c) => [
        gather(rail(side), 'Olta sallıyor', { n: 3, dur: 6, hold: 1.2 }),
        ...[0, 1, 2, 3].map((i) => [S('throw', { from: { x: besides(c, 24), y: -20 + i * 14 }, to: { rail: 0, dy: 10 }, kind: 'ball', arc: 22, dur: 0.6, burst: 'splash', n: 4 }), sfx('splash'), T(0.5)]),
        deckProp('fishD', 'fishPile', 'galley', { opts: { n: 8 } }),
      ],
      (c) => [
        par(work(['CREW_NAKAMURA'], 'bow', 'Balıkların dilinden konuşuyor', 6, 1), only('CREW_NAKAMURA', 'Gelin küçükler… gelin.', { dur: 2.4 })),
        ...[0, 1, 2, 3, 4, 5].map((i) => [S('throw', { from: { x: besides(c, 30) * (i % 2 ? -1 : 1), y: -30 + i * 10 }, to: { rail: 0, dy: -10 + i * 6 }, kind: 'ball', arc: 30, dur: 0.6, burst: 'splash', n: 3 }), T(0.35)]),
        par(deckProp('fishD', 'fishPile', 'center', { opts: { n: 24 } }), sfx('cheer'), crewSay([], 'Güverte balık doldu!', { dur: 2 })),
      ],
    ],
    outcome: (c, info) => (info.petsJoined.includes('PET_KIRMIZI') ? [par(sfx('squawk'), float('Bir papağan ağın üstüne kondu!', '#ffd76a'))] : []),
    exit: () => [remove('fishD'), remove('net'), ...driftAll(), remove('gulls'), T(1)],
  })),

  // ───────── RÜZGAR LÜTFU ─────────
  EVT_F_04: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'open' })],
    setup: () => [spawn({ id: 'wind', kind: 'spray', x: 0, y: 40, layer: 2, opts: { w: 360, h: 300, n: 60 } }), spawn({ id: 'gulls', kind: 'birds', x: -60, y: -120, layer: 2, opts: { n: 6 } })],
    approach: () => [par(S('speed', { v: 44 }), sfx('gull'), cam({ x: 0, y: -60 }, 0.25)), par(react('fortune', side), crewSay(['CREW_SURGE', 'CREW_FINN'], 'Arkadan ılık bir rüzgâr! Hissediyor musunuz?', { dur: 2.6 }))],
    intro: () => [T(0.4)],
    opts: [
      () => [par(go(110), sfx('depart'), cap('Bütün yelkenler! Uçuyoruz!', 2.2, 0.4), move('gulls', { y: 260 }, 3)), fx('splash', { rail: 0, dy: -90 }, 30), T(1.6)],
      () => [
        par(go(46), cap('Bırakın rüzgâr çalışsın. Dinlenin!', 2.4, 0.4)),
        gather('center', 'Şarkı söylüyor', { n: 4, dur: 6, hold: 1 }),
        par(crewSay([], '♪ Yo ho, rüzgâr bizden yana! ♪', { dur: 3 }), sfx('cheer'), deckProp('notes', 'sparkles', 'center', { opts: { r: 18, col: '#ffe080', n: 12 } })),
        T(1.4),
      ],
    ],
    exit: () => [remove('wind'), remove('notes'), remove('gulls'), T(0.6)],
  })),

  // ───────── ADA KÖYLÜLERİ ─────────
  EVT_F_05: def((ev, side) => ({
    setup: (c) => [
      spawn({ id: 'enc', kind: 'island', x: side * (c.beam / 2 + 110), y: -330, opts: { r: 56, huts: true, villagers: true, palms: 6 } }),
      spawn({ id: 'canoe', kind: 'rowboat', x: side * (c.beam / 2 + 60), y: -300, opts: { npcs: ['villager', 'villagerF'], dir: 'down', cargo: ['GOOD_GRAIN'] } }),
    ],
    approach: (c) => [
      par(move('enc', { y: -40 }, 4.5), move('canoe', { y: -20 }, 4.5, { wait: false }), slow(6), cam({ x: side * 90, y: -40 }, 0.3)),
      par(stop(), react('fortune', side), lookout('Kanolar! El sallıyorlar!', { dur: 2.2 })),
      move('canoe', { x: besides(c, 18), y: 0 }, 2),
    ],
    intro: () => [say('canoe', 'Hoş geldiniz, denizin çocukları!', 2.6, 1)],
    opts: [
      (c) => [
        board('vil', 'villager', rail(side), 'cargo', { carry: 'GOOD_GRAIN', say: 'Meyve, tahıl… hepsi sizin!', face: 'down' }),
        par(S('npcState', { id: 'vil', carry: null }), sfx('pickup'), gather('cargo', 'Hediyeleri karşılıyor', { n: 2 })),
        crewSay([], 'Ne cömert insanlar!', { dur: 2 }),
      ],
      () => [
        board('chief', 'chief', rail(side), 'center', { say: 'Otur kaptan. Sana denizleri anlatayım.', face: 'up', endState: 'sit' }),
        par(work(['CAPTAIN'], 'center', 'Yaşlı bilgeyi dinliyor', 6), deckProp('tale', 'sparkles', 'center', { opts: { r: 24, col: '#c8a0ff' } }), sfx('magic')),
        S('say', { actor: 'chief', text: 'Önünde fırtına var… ve ışıklar…', dur: 3, hold: 1.4 }),
      ],
      () => [
        board('vil', 'villager', rail(side), rail(side), { dy: -24, endState: 'work', say: 'Reçine çatlakları kapatır.' }),
        board('vil2', 'villagerF', rail(side), rail(side), { dy: 20, endState: 'work', wait: false }),
        par(sfx('repair'), fx('spark', { rail: side }, 18)), T(1.4),
      ],
    ],
    skip: (info) => (oi(info) === 2 ? ['hull'] : []),
    from: () => 'canoe',
    exit: (c) => [remove('tale'), offAll(rail(side)), T(0.8), par(move('canoe', { x: side * (c.beam / 2 + 70) }, 2), go(26)), ...driftAll()],
  })),

  // ───────── DENİZ TANRISI'NIN LÜTFU ─────────
  EVT_F_06: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'tropical', fx: [] })],
    setup: () => [spawn({ id: 'orb', kind: 'lightOrb', x: 0, y: -40, alpha: 0 }), spawn({ id: 'ring', kind: 'glowRing', x: 0, y: 0, alpha: 0, opts: { col: '#ffe080' } })],
    approach: () => [
      par(slow(0), cam({ x: 0, y: 0 }, 0.3, 1.04)),
      par(move('orb', { alpha: 1, y: 0 }, 3), sfx('magic'), react('fortune', side)),
      par(move('ring', { alpha: 1 }, 1.5), crewSay([], 'Deniz… ayna gibi oldu.', { dur: 2.4 })),
    ],
    intro: () => [fx('spark', 'ship', 30), crewSay(['CREW_MAGDA'], 'Deniz Tanrısı bize bakıyor…', { dur: 2.6 })],
    opts: [
      () => [par(deckProp('glow', 'sparkles', 'center', { opts: { r: 60, n: 40, col: '#ffe080' } }), sfx('magic'), fx('spark', 'ship', 40)), T(1.2), par(fx('gold', { rail: -1 }, 20), fx('gold', { rail: 1 }, 20), sfx('repair')), T(1)],
      () => [
        par(work(['CREW_MAGDA'], 'bow', 'Deniz Tanrısına dua ediyor', 6, 1), only('CREW_MAGDA', 'Ey derinlerin efendisi…', { dur: 2.6 })),
        par(deckProp('glow', 'sparkles', 'center', { opts: { r: 70, n: 60, col: '#ffe080' } }), move('ring', { scale: 1.6 }, 2), sfx('magic')),
        par(fx('gold', 'ship', 40), sfx('repair')), T(1),
      ],
    ],
    skip: () => ['hull'],
    outcome: (c, info) => [par(float('Gemi ilk günkü gibi!', '#ffe080'), fx('spark', 'ship', 30))],
    exit: () => [par(move('orb', { alpha: 0 }, 1.5), move('ring', { alpha: 0 }, 1.5)), remove('glow'), weather({ restore: true }), T(0.6)],
  })),

  // ───────── ESKİ ARKADAŞ ─────────
  EVT_F_07: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 2, { x: side * 240, y: -300 }), spawn({ id: 'boat', kind: 'rowboat', x: side * 200, y: -260, alpha: 0, opts: { npcs: ['oldSailor', 'sailor'], dir: 'left' } })],
    approach: (c) => [
      par(move('enc', { x: side * 220, y: -100, rot: Math.PI * 0.9 }, 3), cam({ x: side * 80, y: -60 }, 0.3), slow(4)),
      par(say('enc', 'KAPTAAAN! Sen misin?!', 2.4, 0.4), react('fortune', side), stop()),
      par(move('boat', { alpha: 1, x: besides(c, 20), y: -10 }, 3)),
      board('friend', 'oldSailor', rail(side), rail(side), { dy: -14, say: 'Yıllar oldu, eski dost!', endState: 'idle' }),
      work(['CAPTAIN'], rail(side), 'Eski dostuna sarılıyor', 4, 1),
    ],
    intro: () => [cap('Seni görmek ne güzel!', 2.2, 0.8)],
    opts: [
      () => [S('say', { actor: 'friend', text: 'Sana iyi birkaç denizci getirdim. Seç bakalım!', dur: 2.8, hold: 1 }), board('rec', 'sailor', rail(side), rail(side), { dy: 16, endState: 'idle' })],
      () => [cap('Hani şu yıllar önceki borç…', 2.4, 0.8), S('say', { actor: 'friend', text: 'Hahaha! Unutmadın demek. Faiziyle!', dur: 2.6, hold: 0.8 })],
    ],
    from: () => 'boat',
    exit: (c) => [unboard('friend', rail(side)), unboard('rec', rail(side), { wait: false }), par(move('boat', { x: side * 200, y: -100, alpha: 0 }, 2.4), move('enc', { y: -360 }, 3, { wait: false })), say('enc', 'Rüzgârın bol olsun!', 2, 0.4), go(30), remove('boat')],
  })),

  // ───────── GÖKKUŞAĞI ─────────
  EVT_F_08: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'calm', fx: [], dark: 0 })],
    setup: () => [spawn({ id: 'bow7', kind: 'rainbow', x: 320, y: 170, screen: true, layer: 3, alpha: 0, opts: { r: 260, a: 0.4 } }), spawn({ id: 'bow8', kind: 'rainbow', x: 320, y: 190, screen: true, layer: 3, alpha: 0, opts: { r: 300, a: 0.2 } })],
    approach: () => [par(slow(14), cam({ x: 0, y: -40 }, 0.2)), par(move('bow7', { alpha: 1 }, 3), move('bow8', { alpha: 1 }, 4, { wait: false })), par(react('fortune', side), lookout('Çift gökkuşağı! Uğur bu!', { dur: 2.4 }))],
    intro: () => [T(0.6)],
    opts: [() => [gather('bow', 'Gökkuşağına bakıyor', { n: 4, dur: 6, hold: 1 }), par(sfx('cheer'), crewSay([], 'Şans bizden yana!', { dur: 2.2 }), fx('spark', 'ship', 30)), pet('PET_TARCIN', { pose: 'wag', dur: 4 }), T(1)]],
    exit: () => [par(move('bow7', { alpha: 0 }, 2), move('bow8', { alpha: 0 }, 2)), go(30), remove('bow7'), remove('bow8')],
  })),

  // ───────── KAYIP HARİTA ─────────
  EVT_F_09: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'bottle', x: besides(c, 30), y: -280 })],
    approach: (c) => [par(move('enc', { y: -20 }, 4), slow(6), cam({ x: side * 50, y: -30 }, 0.25)), par(slow(1), react('fortune', side), lookout('Mühürlü bir tüp! Ağlara takıldı.', { dur: 2.2 }))],
    intro: () => [S('pickup', { id: 'enc', prefer: ['CREW_NAKAMURA', 'CREW_GROOT'], task: 'Tüpü çekiyor' }), par(deckProp('map', 'mapTable', 'center'), work(['CAPTAIN'], 'center', 'Haritayı açıyor', 4)), cap('Sararmış… ama okunuyor. Antik bir harita!', 2.6, 0.8)],
    opts: [
      () => [par(work(['CREW_COMPASS', 'CAPTAIN'], 'center', 'Haritayı katlıyor', 3), sfx('page')), remove('map'), T(0.4)],
      () => [crewSay(['CREW_HAMID', 'CREW_TARIK'], 'Koleksiyoncular buna servet öder!', { dur: 2.4 }), remove('map'), S('icon', { icon: 'oldmap', from: 'ship', to: { slot: 0 } })],
    ],
    from: () => null,
    exit: () => [remove('map'), go(30), T(0.6)],
  })),

  // ───────── KÖLE GEMİSİ KURTARMA ─────────
  EVT_F_10: def((ev, side) => ({
    weather: () => [weather({ night: true, dark: 0.08 })],
    setup: (c) => [shipEntity(c, 'enc', 'plague', 3, { crewNpc: ['hunter', 'pirate', 'hunter'], scale: 0.9, x: side * 220, y: -320 })],
    approach: (c) => [
      par(move('enc', { x: side * 180, y: -120 }, 3.5), cam({ x: side * 80, y: -60 }, 0.3), slow(6)),
      par(react('danger', side), sfx('drum'), crewSay(['CREW_BARAKA', 'CREW_BJORN'], 'Zincir sesleri… içeride insanlar var.', { dur: 2.8 })),
      move('enc', { y: -40, rot: Math.PI * 0.98 }, 2.4),
    ],
    intro: () => [say('enc', 'Uzak dur tüccar! Burası seni ilgilendirmez.', 2.8, 1)],
    opts: [
      (c, info) => [
        par(cap('Fenerleri söndürün. Sessizce.', 2.2, 0.6), weather({ dark: 0.2 })),
        spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 20), y: 0, opts: { npcs: ['sailor', 'sailor'], dir: 'right' } }),
        move('boat', { x: side * 140, y: -30 }, 2.6),
        par(sfx('hook'), fx('spark', 'enc', 10)), T(0.8),
        ...(info.success
          ? [par(S('opts', { id: 'boat', opts: { npcs: ['castaway', 'castaway'] } }), move('boat', { x: besides(c, 20), y: 0 }, 2.6)), board('freed', 'castaway', rail(side), rail(side), { dy: -10, say: 'Özgürüz! Sağ olun!', endState: 'idle' })]
          : [par(say('enc', 'Hırsızlar! Ateş!', 2, 0.2), S('fire', { from: 'enc', to: 'ship', n: 2, hit: true })), par(S('opts', { id: 'boat', opts: { npcs: ['castaway', 'sailor'] } }), move('boat', { x: besides(c, 20), y: 0 }, 2))]),
      ],
      (c, info) => [
        par(move('enc', { x: alongside(c, 0.9, 3, 4), y: -6, rot: Math.PI }, 2.4), cap('Rampa!', 1.6, 0.4)),
        call((d) => { const e = d.world.get('enc'); const L = d.world.layout(); if (e) e.hooks = [-20, 20].map((dy) => ({ x0: e.x - side * 20, y0: e.y + dy, x1: d.world.ship.x + side * (L.beam / 2 - 6), y1: d.world.ship.y + dy, plank: true })); d.hooks.sfx?.('hook'); }),
        par(gather(rail(side), 'Rampaya hazırlanıyor', { n: 3, run: true, prefer: ['CREW_BJORN', 'CREW_BARAKA'], dur: 5 }), crewSay(['CREW_BARAKA', 'CREW_BJORN'], 'ZİNCİRLERİ KIRIN!', { dur: 2 })),
        par(fx('spark', 'enc', 30), sfx('impact'), S('shake', { amount: 6 })), T(0.6), par(fx('spark', 'enc', 30), sfx('impact')),
        par(fx('splash', { x: side * 230, y: 0 }, 24), sfx('splash'), say('enc', 'Denize atlayın!', 2, 0.6), S('set', { id: 'enc', props: { crewNpc: ['castaway', 'castaway', 'castaway'] } })),
        par(sfx('cheer'), crewSay([], 'Herkes kurtuldu!', { dur: 2 })),
      ],
      () => [go(30), gather('center', 'Sessizce bakıyor', { n: 3, dur: 6 }), T(1.6), crewSay([], '…', { dur: 2 })],
    ],
    skip: (info) => (oi(info) === 1 ? [] : []),
    exit: (c) => [unboard('freed', rail(side)), call((d) => { const e = d.world.get('enc'); if (e) e.hooks = null; }), par(move('boat', { y: 300 }, 2.4, { wait: false }), move('enc', { y: 320 }, 3), go(30)), weather({ restore: true }), remove('boat')],
  })),

  // ───────── DENİZ KAPLUMBAĞASI ─────────
  EVT_F_12: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'turtle', x: besides(c, 28), y: -260 })],
    approach: (c) => [par(move('enc', { y: -10 }, 5), slow(6), cam({ x: side * 40, y: -10 }, 0.25)), par(slow(3), react('fortune', side), lookout('Dev bir kaplumbağa! Yanımızda yüzüyor.', { dur: 2.4 }))],
    intro: () => [pet('PET_TARCIN', { at: rail(side), pose: 'wag', dur: 5 }), crewSay(['CREW_FINN', 'CREW_KALANI'], 'Eski denizciler onu görmenin şans getirdiğini söyler.', { dur: 2.8 })],
    opts: [(c) => [
      par(work(['CAPTAIN'], rail(side), 'Kaplumbağayı selamlıyor', 4), cap('Selam, yaşlı dost.', 2, 1)),
      par(move('enc', { alpha: 0, y: 30 }, 2.4), spawn({ id: 'bub', kind: 'bubbles', x: besides(c, 28), y: 20, opts: { n: 12, w: 14, h: 30 } }), deckProp('luck', 'sparkles', 'center', { opts: { r: 40, col: '#a0ffd0' } }), sfx('magic')),
      T(1),
    ]],
    exit: () => [remove('luck'), remove('bub'), go(30), T(0.6)],
  })),

  // ───────── SEYYAR TÜCCAR ─────────
  EVT_F_13: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'merchantBoat', x: besides(c, 30), y: -280, opts: { npc: 'oldSailor', goods: ['GOOD_CHARM_DUST', 'GOOD_SILK', 'GOOD_ANTIQUE'] } })],
    approach: (c) => [par(move('enc', { y: 0 }, 4.2), slow(5), cam({ x: side * 50, y: -10 }, 0.25)), par(stop(), react('fortune', side))],
    intro: () => [say('enc', 'Limanlarda bulamayacağın şeyler var bende, kaptan!', 2.8, 1)],
    opts: [
      () => [board('pedd', 'oldSailor', rail(side), 'center', { carry: 'GOOD_ANTIQUE', say: 'Bak, bak… her biri bir hikâye!', face: 'up', endState: 'work' }), gather('center', 'Tezgâha bakıyor', { n: 3 })],
      () => [cap('İyi satışlar, ihtiyar.', 2, 0.8), say('enc', 'Kısmet başka bahara!', 2, 0.4)],
    ],
    exit: (c) => [unboard('pedd', rail(side)), par(go(28), move('enc', { y: 280 }, 3))],
  })),

  // ───────── ŞANSLI RÜZGAR ─────────
  EVT_F_14: def((ev, side) => ({
    mainId: null,
    setup: () => [spawn({ id: 'wind', kind: 'spray', x: 0, y: 0, layer: 2, opts: { w: 300, h: 260, n: 40 } })],
    approach: () => [par(slow(14), sfx('gull')), par(react('fortune', side), crewSay([], 'Kuru, tuzlu bir rüzgâr… ambarı havalandıralım!', { dur: 2.6 }))],
    intro: () => [T(0.4)],
    opts: [() => [
      par(gather('cargo', 'Ambar kapaklarını açıyor', { n: 3, run: true, dur: 5 }), sfx('creak')),
      par(deckProp('dry', 'sparkles', 'cargo', { opts: { r: 30, n: 30, col: '#fff6c0' } }), sfx('magic')),
      T(1.4), call((d) => { if (d.world.cargoOverride) d.world.cargoOverride = d.world.cargoOverride.map((u) => (u ? { ...u, spoiled: false } : u)); }), fx('spark', 'ship', 20), T(0.8),
    ]],
    exit: () => [remove('wind'), remove('dry'), T(0.6)],
  })),

  // ───────── ESKİ HARİTA PARÇASI ─────────
  EVT_F_15: def((ev, side) => ({
    mainId: null,
    setup: () => [spawn({ id: 'gull', kind: 'birds', x: -side * 200, y: -160, layer: 2, opts: { n: 1 } }), spawn({ id: 'scroll', kind: 'mapScroll', x: -side * 200, y: -150, layer: 2, alpha: 0 })],
    approach: () => [
      par(move('gull', { x: 0, y: -30 }, 3), move('scroll', { x: 0, y: -26, alpha: 1 }, 3, { wait: false }), sfx('gull'), slow(12)),
      par(move('scroll', { y: 10 }, 0.8), move('gull', { x: side * 220, y: -200 }, 3, { wait: false })),
      par(remove('scroll'), deckProp('map', 'mapScroll', 'center'), react('fortune', side), crewSay([], 'Martı bir parşömen düşürdü!', { dur: 2.2 })),
    ],
    intro: () => [T(0.4)],
    opts: [() => [par(work(['CAPTAIN', 'CREW_COMPASS'], 'center', 'Parşömeni inceliyor', 4, 1.2), sfx('page')), cap('Hiç duymadığım bir liman… not alın!', 2.6, 0.8), par(S('icon', { icon: 'book', from: 'ship', to: { x: 0, y: -60 } }), remove('map'))]],
    exit: () => [remove('gull'), remove('map'), go(30), T(0.4)],
  })),
};

