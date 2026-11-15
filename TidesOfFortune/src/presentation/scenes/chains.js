// ZİNCİR eventleri — çok adımlı hikâyelerin imza sahneleri. Rıhtım adımları (nextAt: 'arrival')
// liman sahnesinde oynar: iskele gemimizin sancak tarafındadır (pierX).
import {
  S, par, wait, def, rail, shipEntity, alongside, besides, cap, crewSay, only, lookout, say, slow, stop, go, cam,
  react, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, weather, call, driftAll, offAll, oi,
  landing, dive, pierX,
} from '../kit.js';

const T = (n) => wait(n);
const rock = (amt = 0.06) => [par(S('heel', { rot: amt }), S('shake', { amount: 6 }), sfx('creak')), T(0.35), S('heel', { rot: -amt }), T(0.35), S('heel', { rot: 0 })];
const hooks = (side, plank = true, ys = [0]) => call((d) => { const e = d.world.get('enc'); const L = d.world.layout(); if (e) e.hooks = ys.map((dy) => ({ x0: e.x - side * 16, y0: e.y + dy, x1: d.world.ship.x + side * (L.beam / 2 - 6), y1: d.world.ship.y + dy, plank })); d.hooks.sfx?.(plank ? 'creak' : 'hook'); });
const unhook = () => call((d) => { const e = d.world.get('enc'); if (e) e.hooks = null; });
/** Rıhtımda duran figür */
const pierNpc = (c, id, npc, y, o = {}) => spawn({ id, kind: 'npc', npc, x: pierX(c, o.dx || 0), y, layer: 1, dir: o.dir || 'left', ...o });
/** Arkadan gelen kovalayıcı korsan */
const chaser = (c, side, o = {}) => shipEntity(c, 'enc', 'pirate', 3, { x: side * 60, y: 340, rot: 0, scale: 0.85, ...o });
const chaseIn = (c, side) => [par(move('enc', { y: c.len / 2 + 110 }, 4), cam({ x: side * 20, y: 60 }, 0.3), lookout('Kıç tarafında yelken! Peşimizdeler!', { dur: 2.4 })), react('danger', side)];

export const CHAIN_SCENES = {
  // ════════ KORSANIN TEKLİFİ ════════
  CH_PIRATE_OFFER_1: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'pir', 'pirate', 3, { x: side * 200, y: -360, scale: 0.85 }), spawn({ id: 'enc', kind: 'rowboat', x: side * 150, y: -300, alpha: 0, opts: { npcs: ['pirateCaptain', 'pirate'], dir: 'down' } })],
    approach: (c) => [
      par(move('pir', { y: -170, rot: Math.PI * 0.9, sails: 'furled' }, 3.5), slow(5), cam({ x: side * 80, y: -100 }, 0.3)),
      par(react('danger', side), lookout('Korsan gemisi… ama topları susuyor.', { dur: 2.4 }), stop()),
      par(move('enc', { alpha: 1, x: besides(c, 18), y: -16 }, 3.4)),
    ],
    intro: () => [say('enc', 'Şapkamı çıkarıyorum, tüccar. Sana bir iş teklifim var.', 3, 1.2)],
    opts: [
      () => [par(work(['CAPTAIN'], rail(side), 'Korsan kaptanı dinliyor', 6), cap('Anlat bakalım. Ama kısa.', 2.2, 0.8)), say('enc', 'Bir sandık… bir liman… ve çok altın.', 2.8, 1)],
      (c) => [cap('Korsanlarla iş yapmam.', 2.2, 0.8), say('enc', 'Pişman olacaksın…', 2.4, 0.6), par(move('enc', { x: side * 160, y: -150, alpha: 0.4 }, 2.6), S('set', { id: 'pir', props: { sails: 'full' } }))],
      (c, info) => [par(go(80), sfx('depart'), cap('Tüm yelkenler! Şimdi!', 2, 0.4)), ...(info.success ? [move('pir', { y: -380 }, 2.6)] : [S('fire', { from: 'pir', to: 'ship', n: 3, hit: true })])],
    ],
    from: () => 'pir',
    exit: () => [par(move('enc', { y: -300, alpha: 0 }, 2.4), move('pir', { y: -400, rot: Math.PI }, 3)), remove('pir'), go(30)],
  })),

  CH_PIRATE_OFFER_2A: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'pir', 'pirate', 3, { x: side * 210, y: -170, rot: Math.PI * 0.9, sails: 'furled', scale: 0.85 }), spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 18), y: -16, opts: { npcs: ['pirateCaptain', 'pirate'], dir: 'down', cargo: ['GOOD_PIRATE_CHEST'] } })],
    approach: () => [stop(), T(0.6)],
    intro: () => [say('enc', 'Bunu bir sonraki limana ulaştır. 300 altın. Soru yok.', 3, 0.8), par(sfx('chest'), crewSay([], 'İçinden metal sesleri geliyor…', { dur: 2.2 }))],
    opts: [
      () => [board('pc', 'pirate', rail(side), 'cargo', { carry: 'GOOD_PIRATE_CHEST', say: 'Dikkat! Ağır!' }), par(S('npcState', { id: 'pc', carry: null }), sfx('chest')), say('enc', 'Limanda adamlarım seni bulur.', 2.4, 0.8)],
      (c) => [cap('Bu sandığı taşımam.', 2, 0.8), say('enc', 'Yazık… çok yazık.', 2.2, 0.4), move('enc', { x: besides(c, 90), alpha: 0.6 }, 2), S('fire', { from: 'pir', to: 'ship', n: 1, hit: true })],
      () => [par(say('enc', 'Bir saniye… şuna bak!', 2, 0.4), work(['CREW_REZA', 'CAPTAIN'], rail(side), 'Kilidi gizlice açıyor', 4, 1.6)), par(sfx('chest'), fx('spark', 'enc', 12)), S('icon', { icon: 'oldmap', from: 'enc', to: 'ship' }), crewSay(['CREW_REZA'], 'Hiçbir şey görmedin, kaptan.', { dur: 2 })],
    ],
    skip: () => ['gained'],
    from: () => 'pir',
    exit: () => [unboard('pc', rail(side)), par(move('enc', { y: -200, alpha: 0 }, 2.4), move('pir', { y: -420 }, 3)), remove('pir'), go(30)],
  })),

  CH_PIRATE_OFFER_2B: def((ev, side) => ({
    setup: (c) => [chaser(c, side)],
    approach: (c) => [par(S('speed', { v: 30 }), ...chaseIn(c, side))],
    intro: () => [say('enc', 'Hahaha! Teklifimi reddeden kimse uzağa gidemez!', 3, 1)],
    opts: [
      (c, info) => [par(go(80), sfx('depart'), cap('Bütün yelkenler!', 1.8, 0.4)), ...(info.success ? [move('enc', { y: 380 }, 3)] : [move('enc', { y: c.len / 2 + 60 }, 2), S('fire', { from: 'enc', to: 'ship', n: 3, hit: true })])],
      (c, info) => [par(work(['CREW_BJORN', 'CREW_OKSANA'], 'stern', 'Kıç topunu çeviriyor', 5), cam('enc', 0.3, 1.04)), S('fire', { from: { rail: 0, dy: c.len / 2 - 10 }, to: 'enc', n: 3, hit: info.success ? true : 'some', burn: info.success }), ...(info.success ? [par(S('set', { id: 'enc', props: { flagWhite: true } }), say('enc', 'Tamam! Tamam! Al şu keseyi!', 2.4, 0.6))] : [S('fire', { from: 'enc', to: 'ship', n: 2, hit: true })])],
      (c) => [stop(), cap('Demiri atın. Bırakın geçsin.', 2.2, 0.6), move('enc', { x: alongside(c, 0.85, 3, 60), y: -300 }, 4), say('enc', 'Korkak!', 1.6, 0.4)],
    ],
    exit: () => [move('enc', { y: 420, alpha: 0 }, 2.4), go(30)],
  })),

  CH_PIRATE_OFFER_3A: def((ev, side) => ({
    side: 1,
    weather: () => [],
    setup: (c) => [pierNpc(c, 'enc', 'pirateCaptain', -40), pierNpc(c, 'p2', 'pirate', -10, { dx: 6 }), pierNpc(c, 'p3', 'pirate', -70, { dx: -4 })],
    dockApproach: (c) => [par(move('enc', { y: -10 }, 2), cam({ x: pierX(c), y: -20 }, 0.3)), react('danger', 1)],
    intro: () => [say('enc', 'O sandık… rakibimin hazinesi! Bana getirdin, değil mi?', 3, 1)],
    opts: [
      (c) => [board('cr', 'sailor', 'cargo', 'railR', { carry: 'GOOD_PIRATE_CHEST' }), unboard('cr', 'railR'), par(say('enc', 'Hahaha! İşte 500 altın… ve bir hediye.', 2.6, 0.6), sfx('chest'))],
      (c) => [cap('Söz sözdür. Sandık sahibine gidecek.', 2.4, 0.8), pierNpc(c, 'p4', 'pirate', -160), move('p4', { y: -30 }, 2), say('p4', 'İlk kaptanın selamı var. 300 altın!', 2.4, 0.6)],
      () => [cap('Sandık… kayboldu.', 2, 0.8), say('enc', 'KAYBOLDU MU?! Çocuklar!', 2.2, 0.4), par(S('throw', { from: 'p2', to: 'ship', kind: 'ball', arc: 20, burst: 'splinter' }), S('throw', { from: 'p3', to: 'ship', kind: 'ball', arc: 20, burst: 'splinter' }), S('shake', { amount: 7 }))],
    ],
    skip: (info) => (info.lost.length ? ['lost'] : []),
    from: (info) => (oi(info) === 1 ? 'p4' : 'enc'),
    exit: () => [],
  })),

  CH_PIRATE_OFFER_3B: def((ev, side) => ({
    mainId: null,
    setup: () => [deckProp('map', 'mapTable', 'center')],
    approach: () => [par(slow(14), work(['CAPTAIN'], 'center', 'Mühürlü haritayı açıyor', 6)), T(1)],
    intro: () => [par(deckProp('seal', 'glowRing', 'center', { opts: { col: '#ff5a40' } }), sfx('magic')), cap('Bir korsan amiralinin mührü…', 2.4, 0.8)],
    opts: [() => [crewSay(['CREW_COMPASS', 'CREW_FINN'], 'Bu yol hiçbir haritada yok!', { dur: 2.4 }), par(S('icon', { icon: 'oldmap', from: 'ship', to: { x: 0, y: -50 } }), remove('map'), remove('seal')), lookout('…Mührün sahibi bunu arıyor olabilir.', { dur: 2.4 })]],
    exit: () => [remove('map'), remove('seal'), go(30)],
  })),

  EVT_CH_PURSUIT: def((ev, side) => ({
    setup: (c) => [chaser(c, side, { level: 4 })],
    approach: (c) => [par(S('speed', { v: 30 }), ...chaseIn(c, side))],
    intro: () => [say('enc', 'Mührümü geri ver, hırsız!', 2.6, 1)],
    opts: [
      (c, info) => [par(go(80), sfx('depart')), ...(info.success ? [move('enc', { y: 400 }, 3)] : [move('enc', { y: c.len / 2 + 50, x: side * 40 }, 2), S('fire', { from: 'enc', to: 'ship', n: 3, hit: true })])],
      (c, info) => [par(work(['CREW_BJORN', 'CREW_OKSANA'], 'stern', 'Kıç topunu ateşliyor', 5), cam('enc', 0.3, 1.04)), S('fire', { from: { rail: 0, dy: c.len / 2 - 10 }, to: 'enc', n: 3, hit: info.success ? true : 'some', burn: info.success }), ...(info.success ? [say('enc', 'Pes ediyorum!', 2, 0.6)] : [S('fire', { from: 'enc', to: 'ship', n: 2, hit: true })])],
      () => [cap('Al haritanı ve defol!', 2.2, 0.4), S('icon', { icon: 'oldmap', from: 'ship', to: 'enc' }), say('enc', 'Heh. Akıllı tüccar.', 2.2, 0.6)],
    ],
    exit: () => [move('enc', { y: 420, alpha: 0 }, 2.4), go(30)],
  })),

  // ════════ YARI BATMIŞ GEMİ ════════
  CH_HALF_SUNK_1: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 3, { x: side * 200, y: -330, rot: Math.PI * 0.75, sails: 'furled', damage: 'sinking', scale: 0.85, alpha: 0.85, crewNpc: [] }), spawn({ id: 'waver', kind: 'npc', npc: 'cartographer', x: side * 196, y: -336, layer: 1 })],
    approach: (c) => [par(move('enc', { y: -40 }, 4.5), move('waver', { y: -46 }, 4.5, { wait: false }), slow(5), cam({ x: side * 80, y: -40 }, 0.3)), par(stop(), react('fortune', side), lookout('Enkazda biri kımıldıyor! El sallıyor!', { dur: 2.4 })), say('waver', 'Yardım edin! Burada!', 2.2, 0.6)],
    intro: () => [T(0.4)],
    opts: [
      (c) => [par(work(['CREW_GROOT', 'CREW_BJORN'], rail(side), 'Halat atıyor', 4), S('throw', { from: { rail: side }, to: 'waver', kind: 'rope', arc: 20 })), move('waver', { x: besides(c, 8), y: -10 }, 2.6), remove('waver'), board('carto', 'cartographer', rail(side), 'center', { endState: 'sit', say: 'Hayatımı… size borçluyum…' })],
      (c) => landing(c, side, ['sailor', 'sailor'], [par(fx('splinter', 'enc', 14), sfx('chest')), S('opts', { id: 'boat', opts: { npcs: ['sailor', 'sailor'], cargo: ['GOOD_ANTIQUE', 'GOOD_SILK'] } }), T(0.6)], [cap('Önce ambar. Hayatta kalan… sonra.', 2.4, 0.4)], 90),
      () => [go(28), cap('Arkanıza bakmayın.', 2, 0.6), say('waver', 'Hayır! Gitmeyin!', 2, 0.6)],
    ],
    exit: () => [remove('waver'), ...driftAll(), T(1)],
  })),

  CH_HALF_SUNK_2A: def((ev, side) => ({
    mainId: null,
    setup: () => [board('carto', 'cartographer', 'center', 'center', { endState: 'sit', wait: false })],
    approach: () => [par(slow(10), cam({ x: 0, y: 0 }, 0.3, 1.04)), gather('center', 'Kartografı kuruluyor', { n: 2 })],
    intro: () => [S('say', { actor: 'carto', text: 'Bu çanta… haritalarım… her şeyim bu.', dur: 2.6, hold: 1 })],
    opts: [
      () => [S('npcState', { id: 'carto', state: 'idle' }), S('say', { actor: 'carto', text: 'Bunu al. Seni hiç unutmayacağım.', dur: 2.6, hold: 0.6 }), S('icon', { icon: 'gift', from: 'ship', to: { x: 0, y: -50 } })],
      () => [cap('Gemimde bir kartografa yer var.', 2.2, 0.6), S('say', { actor: 'carto', text: 'Adım Compass Rose. Haritalarım artık senin!', dur: 2.8, hold: 0.8 }), call((d) => { const t = d.world.deck.temp.find((q) => q.id === 'carto'); if (t) { d.world.deck.spawnAt = { x: t.x, y: t.y }; d.world.deck.temp = d.world.deck.temp.filter((q) => q !== t); } d.hooks.sfx?.('cheer'); }), fx('spark', 'ship', 16)],
    ],
    exit: () => [offAll('railR'), go(30)],
  })),

  CH_HALF_SUNK_2B: def((ev, side) => ({
    setup: (c) => [deckProp('loot', 'chestOpen', 'cargo'), spawn({ id: 'enc', kind: 'rowboat', x: -side * 170, y: -200, opts: { npcs: ['villager'], dir: 'right' } })],
    approach: (c) => [par(slow(8), gather('cargo', 'Ganimeti sayıyor', { n: 3 })), par(move('enc', { y: -150 }, 3), lookout('Uzakta bir balıkçı… bizi izliyor.', { dur: 2.4 }))],
    intro: () => [T(0.4)],
    opts: [
      () => [par(fx('gold', 'ship', 20), sfx('coin')), cap('Ganimet bizim. Kimse bir şey kanıtlayamaz.', 2.4, 0.6), move('enc', { x: -side * 260, y: -260 }, 2.4)],
      (c) => [move('enc', { x: -besides(c, 22), y: -20 }, 3), S('coins', { from: 'ship', to: 'enc', n: 8 }), say('enc', 'Ben… hiçbir şey görmedim, kaptan.', 2.4, 0.6), move('enc', { x: -side * 260 }, 2.4)],
    ],
    skip: () => ['gold'],
    from: () => null,
    exit: () => [remove('loot'), remove('enc'), go(30)],
  })),

  // ════════ FIRTINA ════════
  CH_STORM_1: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'dark', dark: 0.06 })],
    setup: () => [spawn({ id: 'cloud', kind: 'cloudShadow', x: 0, y: -260, layer: 2, opts: { a: 0.25 } })],
    approach: () => [par(S('speed', { v: 10 }), S('sails', { state: 'furled' }), move('cloud', { y: -40 }, 5), weather({ dark: 0.18 })), par(crewSay(['CREW_FINN', 'CREW_SURGE'], 'Martılar sustu… rüzgâr öldü. Kötü işaret.', { dur: 2.8 }), react('danger', side))],
    intro: () => [T(0.4)],
    opts: [
      () => [par(go(60), cap('Ne kadar hızlı olursak!', 2, 0.4), sfx('depart')), par(S('flash', {}), weather({ fx: ['rain'], dark: 0.24 })), crewSay([], 'Fırtına bizden hızlı!', { dur: 2 })],
      (c) => [par(spawn({ id: 'cove', kind: 'island', x: side * (c.beam / 2 + 140), y: -260, opts: { r: 70, palms: 6 } }), cap('En yakın koya! Dümen kır!', 2.2, 0.4), S('heel', { rot: side * 0.15 }), S('shipTo', { x: side * 40 })), move('cove', { y: -40 }, 3), S('heel', { rot: 0 })],
      () => [par(cap('Pruvayı fırtınaya çevirin. Kaçmayacağız.', 2.6, 0.4), S('flash', {}), sfx('thunder')), weather({ dark: 0.28, fx: ['rain', 'lightning'] })],
    ],
    exit: () => [remove('cloud'), ...driftAll(), T(0.6)],
  })),

  CH_STORM_2A: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'storm', fx: ['rain', 'lightning'], dark: 0.24 })],
    setup: () => [spawn({ id: 'wv', kind: 'wave', x: 0, y: -260, layer: 1 })],
    approach: (c) => [par(S('speed', { v: 8 }), S('sails', { state: 'furled' }), S('flash', {}), sfx('thunder')), ...rock(0.08), gather('mast', 'Direğe tutunuyor', { n: 4, run: true, dur: 8 })],
    intro: () => [cap('Dayanın! Bırakmayın!', 2, 0.6)],
    opts: [(c) => [move('wv', { y: c.len / 2 + 200 }, 2.4, { ease: 'linear' }), par(fx('splash', 'ship', 70), S('shake', { amount: 12 }), sfx('splash')), ...rock(0.1), par(S('flash', {}), sfx('thunder')), ...rock(0.07)]],
    exit: () => [remove('wv'), weather({ restore: true }), T(0.6)],
  })),

  CH_STORM_3A: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', dark: 0.06 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'wreck', x: side * 30, y: -360, opts: { w: 220, h: 120, n: 12, barrels: 3 } }), spawn({ id: 'tim', kind: 'timber', x: besides(c, 36), y: -300, opts: { n: 6 } })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 20 }, 4.5), move('tim', { y: -20 }, 4.5, { wait: false }), slow(5), cam({ x: side * 20, y: -60 }, 0.3)), lookout('Fırtınanın parçaladığı bir gemi…', { dur: 2.4 })],
    intro: () => [T(0.4)],
    opts: [
      (c, info) => [gather(rail(side), 'Enkazdan fıçı çekiyor', { n: 3, run: true, dur: 5 }), spawn({ id: 'br', kind: 'barrel', x: besides(c, 26), y: -10 }), S('pickup', { id: 'br', prefer: ['CREW_GROOT'], task: 'Fıçıyı çekiyor' }), ...(info.success ? [] : [par(sfx('creak'), fx('splinter', { rail: side }, 22), S('shake', { amount: 8 }))])],
      () => [S('pickup', { id: 'tim', prefer: ['CREW_GROOT'], task: 'Keresteleri topluyor' }), work(['CREW_GROOT', 'CREW_LENA'], rail(side), 'Gövdeye çakıyor', 3, 1)],
    ],
    exit: () => [...driftAll(), weather({ restore: true }), T(1)],
  })),

  CH_STORM_2B: def((ev, side) => ({
    weather: () => [weather({ preset: 'dark', fx: ['rain'] })],
    setup: (c) => [spawn({ id: 'cove', kind: 'island', x: -side * (c.beam / 2 + 130), y: -40, opts: { r: 80, palms: 7 } }), shipEntity(c, 'enc', 'merchant', 2, { x: side * 190, y: -20, rot: 0, sails: 'furled' })],
    approach: (c) => [par(stop(), cam({ x: side * 40, y: -20 }, 0.3)), move('enc', { x: alongside(c, 1, 2, 30) }, 2.4), say('enc', 'Fırtına geçene kadar bir takas?', 2.4, 0.6)],
    intro: () => [T(0.4)],
    opts: [
      () => [hooks(side), board('mer', 'merchant', rail(side), 'cargo', { endState: 'work', say: 'Kuru mallarım var!' }), gather('cargo', 'Takas ediyor', { n: 2 })],
      () => [gather('center', 'Fırtınada dinleniyor', { n: 4, dur: 8 }), par(work(['CREW_GROOT'], rail(side), 'Gövdeyi yamıyor', 4), sfx('repair'), fx('spark', { rail: side }, 14)), T(1)],
    ],
    skip: () => ['hull'],
    exit: () => [unboard('mer', rail(side)), unhook()],
  })),

  CH_STORM_3B: def((ev, side) => ({
    weather: () => [weather({ preset: 'calm', fx: [], dark: 0 })],
    setup: (c) => [spawn({ id: 'cove', kind: 'island', x: -side * (c.beam / 2 + 130), y: -40, opts: { r: 80, palms: 7 } }), shipEntity(c, 'enc', 'merchant', 2, { x: alongside(c, 1, 2, 30), y: -20, rot: 0, sails: 'furled' }), spawn({ id: 'rb', kind: 'rainbow', x: 320, y: 170, screen: true, layer: 3, alpha: 0, opts: { r: 240, a: 0.3 } })],
    approach: () => [par(move('rb', { alpha: 1 }, 3), cam({ x: 0, y: -40 }, 0.2)), par(sfx('gull'), crewSay([], 'Sabah oldu… fırtına dindi!', { dur: 2.4 }))],
    intro: () => [T(0.4)],
    opts: [() => [par(sfx('horn'), say('enc', 'Rüzgârın bol olsun!', 2, 0.4)), cap('Seninki de dostum!', 2, 0.6), par(go(30), move('enc', { y: -380, sails: 'full' }, 4)), sfx('cheer')]],
    exit: () => [move('rb', { alpha: 0 }, 1.5), ...driftAll(), remove('rb')],
  })),

  CH_STORM_2C: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', fx: ['rain', 'lightning'], dark: 0.2 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'island', x: 0, y: -380, opts: { r: 70, palms: 2, ground: '#3f5a3a', ruins: true } }), spawn({ id: 'eye', kind: 'glowRing', x: 0, y: -380, opts: { col: '#c8d8ff' } })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 90 }, 5), move('eye', { y: -c.len / 2 - 90 }, 5, { wait: false }), S('flash', {}), slow(6)), par(lookout('Haritada olmayan bir ada! Fırtınanın gözünde!', { dur: 2.6 }), sfx('thunder'))],
    intro: () => [T(0.4)],
    opts: [(c) => [par(go(16), cap('Kıyıya! Yanaşıyoruz!', 2, 0.4)), move('enc', { y: -c.len / 2 - 50 }, 2), par(S('speed', { v: 0 }), S('shake', { amount: 10 }), sfx('creak'), fx('splinter', { rail: 0, dy: -c.len / 2 }, 24))]],
    exit: () => [...driftAll(), T(1)],
  })),

  CH_STORM_3C: def((ev, side) => ({
    weather: () => [weather({ preset: 'eerie', fx: [] })],
    setup: (c) => [spawn({ id: 'enc', kind: 'temple', x: side * (c.beam / 2 + 110), y: -40, opts: { r: 64, glow: true } })],
    approach: (c) => [par(cam({ x: side * 80, y: -30 }, 0.3), stop(), sfx('magic')), crewSay([], 'Bir tapınak… sunakta bir şeyler parlıyor.', { dur: 2.6 })],
    intro: () => [T(0.4)],
    opts: [(c, info) => landing(c, side, ['sailor', 'sailor'], info.success ? [par(fx('spark', 'enc', 30), sfx('magic')), T(1)] : [par(S('set', { id: 'enc', props: { opts: { r: 64, glow: false } } }), fx('smoke', 'enc', 30), S('shake', { amount: 8 }), sfx('roar')), T(1)], [], 90)],
    exit: () => [...driftAll(), weather({ restore: true }), T(1)],
  })),

  // ════════ GİZEMLİ YOLCU ════════
  CH_PASSENGER_1: def((ev, side) => ({
    weather: () => [weather({ fog: 0.6, dark: 0.1 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 24), y: -260, opts: { npcs: ['stranger', 'sailor'], dir: 'up' } })],
    approach: (c) => [par(move('enc', { y: -10 }, 4.5), slow(4), cam({ x: side * 40, y: -10 }, 0.3)), par(stop(), react('fortune', side))],
    intro: (c) => [say('enc', '…', 1.6, 0.6), S('coins', { from: 'enc', to: { x: besides(c, 8), y: -10 }, n: 4 }), crewSay([], 'Yüzünü göstermiyor… ama kese dolu.', { dur: 2.4 })],
    opts: [
      () => [board('pass', 'stranger', rail(side), 'stern', { say: '…', wait: true }), unboard('pass', 'stern'), crewSay([], 'Tek kelime etmeden kamaraya girdi.', { dur: 2.4 })],
      () => [cap('Gemimde yer yok.', 2, 0.6), par(move('enc', { y: -200, alpha: 0 }, 3), weather({ fog: 1 }))],
    ],
    from: () => 'enc',
    exit: () => [remove('enc'), weather({ restore: true }), go(30)],
  })),

  CH_PASSENGER_2: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [board('pass', 'stranger', 'stern', 'stern', { endState: 'idle', face: 'down', wait: false }), deckProp('lamp', 'lantern', 'stern', { dy: 6 }), shipEntity(c, 'far', 'merchant', 2, { x: -side * 160, y: 260, scale: 0.6, alpha: 0.5, rot: 0, sails: 'furled', crewNpc: ['stranger'] })],
    approach: (c) => [par(slow(10), cam({ x: 0, y: 60 }, 0.3)), ...[0, 1, 2].map(() => [S('opts', { id: 'lamp', opts: {} }), S('set', { id: 'lamp', props: { alpha: 0.2 } }), T(0.35), S('set', { id: 'lamp', props: { alpha: 1 } }), T(0.35)]), crewSay([], 'Kaptan… yolcu birine fenerle işaret veriyor!', { dur: 2.6 })],
    intro: () => [T(0.4)],
    opts: [
      (c, info) => [work(['CAPTAIN'], 'stern', 'Yolcuyla yüzleşiyor', 5, 1.4), cap('Kime işaret veriyorsun?!', 2, 0.6), ...(info.success ? [S('say', { actor: 'pass', text: 'Peşimdekileri yanlış yöne gönderiyordum.', dur: 2.8, hold: 0.8 }), remove('lamp')] : [par(S('npcState', { id: 'pass', state: 'react' }), fx('spark', 'ship', 12, { dy: 60 }), sfx('impact')), S('say', { actor: 'pass', text: '…Özür dilerim. Korktum.', dur: 2.4, hold: 0.6 })])],
      () => [cap('…Bekleyeceğim.', 2, 1.6), par(move('far', { alpha: 0 }, 3)), remove('lamp')],
      () => [cap('Onu kamarasına kilitleyin.', 2.2, 0.4), gather('stern', 'Yolcuyu kamaraya götürüyor', { n: 2, run: true }), T(1), remove('lamp'), unboard('pass', 'stern'), sfx('creak')],
    ],
    exit: () => [remove('far'), remove('lamp'), offAll('stern'), weather({ restore: true }), go(30)],
  })),

  CH_PASSENGER_3: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'calm', dark: 0 })],
    setup: () => [board('pass', 'stranger', 'stern', 'center', { endState: 'idle', face: 'up', wait: false })],
    approach: () => [par(slow(12), cam({ x: 0, y: 0 }, 0.3, 1.05)), gather('center', 'Yolcuya bakıyor', { n: 4, state: 'react' })],
    intro: () => [S('say', { actor: 'pass', text: 'Artık saklanmama gerek yok.', dur: 2.4, hold: 1 })],
    opts: [() => [par(deckProp('cloak', 'cloak', 'center'), sfx('magic'), fx('spark', 'ship', 30)), call((d) => { const t = d.world.deck.temp.find((q) => q.id === 'pass'); if (t) { d.world.deck.spawnAt = { x: t.x, y: t.y }; d.world.deck.temp = d.world.deck.temp.filter((q) => q !== t); } }), crewSay([], 'O… O BU MU?!', { dur: 2.2 }), remove('cloak'), sfx('cheer')]],
    exit: () => [remove('cloak'), go(30)],
  })),

  // ════════ HAZİNE ════════
  CH_TREASURE_1: def((ev, side) => ({
    mainId: null,
    setup: () => [deckProp('map', 'mapTable', 'center')],
    approach: () => [par(slow(14), work(['CAPTAIN'], 'center', 'Hazine haritasının ilk parçasını inceliyor', 6)), T(1)],
    intro: () => [cap('"Ay\'ın Gözü"… dört parçanın ilki.', 2.6, 0.8)],
    opts: [
      () => [par(sfx('page'), cap('Kamarama asın. Ay\'ın Gözü\'nü bulacağız!', 2.6, 0.6)), gather('center', 'Haritaya bakıyor', { n: 3 }), sfx('cheer')],
      () => [cap('Çekmeceye kaldırın. Hazineler başkalarının olsun.', 2.6, 0.6), remove('map')],
    ],
    exit: () => [remove('map'), go(30)],
  })),

  CH_TREASURE_2: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'cave', x: side * (c.beam / 2 + 110), y: -330, opts: { r: 60, glint: false } })],
    approach: (c) => [par(move('enc', { y: -40 }, 4.5), slow(5), cam({ x: side * 80, y: -40 }, 0.3)), par(stop(), lookout('İşte! Kayalıkta yuvarlak bir mağara… Ay\'ın Gözü!', { dur: 2.8 }))],
    intro: () => [T(0.4)],
    opts: [
      (c, info) => landing(c, side, ['sailor', 'sailor'], [S('set', { id: 'enc', props: { opts: { r: 60, glint: true } } }), sfx('magic'), T(0.8), ...(info.success ? [fx('spark', 'enc', 20)] : [par(fx('smoke', 'enc', 30), S('shake', { amount: 8 }), sfx('roar'))]), S('icon', { icon: 'oldmap', from: 'enc', to: 'boat' })], [], 90),
      () => [cap('Hazine başkasının olsun.', 2, 0.6), ...driftAll()],
    ],
    exit: () => [...driftAll(), T(1)],
  })),

  CH_TREASURE_3: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ night: true })],
    setup: () => [deckProp('map', 'mapTable', 'center'), deckProp('lamp', 'lantern', 'center', { dx: 10 })],
    approach: () => [par(slow(12), work(['CAPTAIN'], 'center', 'Parçaları birleştiriyor', 6)), cap('Parçalar birleşti… ama yazılar eski bir dilde.', 2.6, 0.8)],
    intro: () => [T(0.4)],
    opts: [
      () => [par(deckProp('runes', 'sparkles', 'center', { opts: { r: 22, n: 30, col: '#f2c14e' } }), sfx('magic')), cap('Antik Harita\'nın sembolleri… anahtar bu!', 2.6, 0.6)],
      () => [par(work(['CREW_COMPASS'], 'center', 'Bütün gece şifre çözüyor', 6, 1.4), only('CREW_COMPASS', 'Sabaha kadar uyumayacağım.', { dur: 2.2 })), par(deckProp('runes', 'sparkles', 'center', { opts: { r: 22, n: 30, col: '#f2c14e' } }), sfx('magic'))],
      (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 24), y: 200, opts: { npcs: ['cartographer'], dir: 'up' } }), move('enc', { y: 0 }, 3), board('carto', 'cartographer', rail(side), 'center', { say: 'Hmm… kolay bir şifre.' }), S('coins', { from: 'ship', to: { x: 0, y: 0 }, n: 6 })],
      (c, info) => [par(work(['CAPTAIN'], 'center', 'Saatlerce şifreyle uğraşıyor', 6, 2)), cap(info.success ? 'Çözdüm! Çözdüm!' : 'Sanırım… bu doğru… galiba.', 2.4, 0.8)],
    ],
    from: () => null,
    exit: () => [remove('map'), remove('lamp'), remove('runes'), unboard('carto', rail(side)), move('enc', { y: 300 }, 2.4, { wait: false }), weather({ restore: true }), go(30)],
  })),

  CH_TREASURE_4: def((ev, side) => ({
    weather: () => [weather({ dark: 0.06 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'treasureIsle', x: side * (c.beam / 2 + 110), y: -330, opts: { r: 64 } }), ...[-1, 1].map((k) => spawn({ id: 'sk' + k, kind: 'skull', x: side * (c.beam / 2 + 110) + k * 22, y: -320, layer: 1 }))],
    approach: (c) => [par(move('enc', { y: -40 }, 4.5), move('sk-1', { y: -30 }, 4.5, { wait: false }), move('sk1', { y: -30 }, 4.5, { wait: false }), slow(5), cam({ x: side * 80, y: -40 }, 0.3)), par(stop(), react('fortune', side), lookout('Kumda bir sandığın kenarı! …ve kafatasları.', { dur: 2.6 }))],
    intro: () => [T(0.4)],
    opts: [
      (c, info) => landing(c, side, ['sailor', 'sailor'], [par(fx('splinter', 'enc', 16), sfx('repair')), T(0.6), ...(info.success ? [par(S('set', { id: 'enc', props: { opts: { r: 64, dug: true, chest: true } } }), fx('gold', 'enc', 40), sfx('chest'), sfx('cheer'))] : [par(fx('fire', 'enc', 30), fx('smoke', 'enc', 30), S('shake', { amount: 10 }), sfx('cannon')), S('set', { id: 'enc', props: { opts: { r: 64, dug: true, chest: true } } })]), T(1)], [], 90),
      () => [cap('Tuzaklara güvenmem. Gidiyoruz.', 2.2, 0.6)],
    ],
    exit: () => [...driftAll(), T(1)],
  })),

  // ════════ KAÇAKÇI AĞI ════════
  CH_SMUGGLER_1: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 24), y: -260, opts: { npcs: ['smuggler', 'smuggler'], dir: 'up', cargo: ['GOOD_CHARM_DUST', 'GOOD_CHARM_DUST'] } })],
    approach: (c) => [par(move('enc', { y: -6 }, 4.5), slow(3), cam({ x: side * 40, y: -10 }, 0.3)), par(stop(), react('danger', side), lookout('Fenersiz bir kayık…', { dur: 2 }))],
    intro: () => [say('enc', 'Birkaç sandık tılsım tozu. Teslimatta cömert ödeme.', 2.8, 1)],
    opts: [
      () => [board('s1', 'smuggler', rail(side), 'cargo', { carry: 'GOOD_CHARM_DUST' }), S('npcState', { id: 's1', carry: null }), say('enc', 'Limanda adamlarımız seni bulur.', 2.4, 0.6)],
      () => [board('s1', 'smuggler', rail(side), 'cargo', { carry: 'GOOD_CHARM_DUST' }), par(S('npcState', { id: 's1', carry: null, state: 'react' }), sfx('creak'), work(['CREW_REZA'], 'cargo', 'Gizli bölmeyi açıyor', 3)), S('say', { actor: 's1', text: 'Gizli bölme! Sen bizdensin, kaptan.', dur: 2.6, hold: 0.8 })],
      () => [cap('Kaçak mal taşımam.', 2, 0.6), move('enc', { y: -240, alpha: 0 }, 3)],
    ],
    skip: () => ['gained'],
    exit: () => [unboard('s1', rail(side)), move('enc', { y: 260, alpha: 0 }, 2.4), weather({ restore: true }), go(30)],
  })),

  CH_SMUGGLER_2: def((ev, side) => ({
    thieves: true, thiefNpc: 'soldier', plank: true,
    weather: () => [weather({ preset: 'calm', dark: 0.04 })],
    setup: (c) => [shipEntity(c, 'enc', 'warship', 3, { scale: 0.9 })],
    approach: (c) => [par(move('enc', { x: side * 170, y: -160 }, 3), cam({ x: side * 80, y: -80 }, 0.3), sfx('horn')), par(react('danger', side), lookout('Devriye! Doğrudan bize geliyor!', { dur: 2.2 })), move('enc', { x: side * 190, y: -20, rot: 0, sails: 'furled' }, 2.2), par(move('enc', { x: alongside(c, 0.9, 3, 4), y: -6 }, 1.4), stop())],
    intro: () => [say('enc', 'Kraliyet devriyesi! Ambar denetimi!', 2.4, 0.8)],
    auto: (c, info, k) => (k === 0
      ? [pet('PET_CUCE', { at: rail(side), pose: 'hold', dur: 3 }), say('enc', 'Şapkam! Maymun şapkamı kaptı!', 2.4, 0.4), par(fx('splash', { rail: side }, 20), sfx('splash')), work(['CREW_REZA'], 'cargo', 'Sandıkları gizliyor', 3, 1), crewSay([], 'Hahaha!', { dur: 1.6 })]
      : [work(['CREW_ISADORA'], rail(side), 'Kraliyet yüzüğünü gösteriyor', 4, 1.2), only('CREW_ISADORA', 'Bu yüzüğü tanırsın, kaptan.', { dur: 2.4 }), say('enc', 'Majesteleri! Yolunuz açık olsun!', 2.4, 0.6)]),
    opts: [
      (c, info) => [gather('cargo', 'Sandıkları gizliyor', { n: 2, run: true, dur: 3 }), hooks(side), board('off', 'officer', rail(side), 'cargo', { say: 'Bakalım ne saklıyorsun…', endState: 'work' }), T(1), S('say', { actor: 'off', text: info.success ? 'Temiz. Gidebilirsin.' : 'Kaçak tılsım tozu! El konuldu!', dur: 2.6, hold: 0.8 })],
      (c, info) => [par(go(80), sfx('depart'), S('shipTo', { x: -side * 40 })), ...(info.success ? [move('enc', { y: 300 }, 3)] : [S('fire', { from: 'enc', to: 'ship', n: 2, hit: true }), move('enc', { x: alongside(c, 0.9, 3, 4), y: -6 }, 1.6), hooks(side)])],
      () => [cap('Sandıkları denize! Çabuk!', 2.2, 0.4), gather('cargo', 'Sandık fırlatıyor', { n: 3, run: true })],
    ],
    from: () => 'enc',
    exit: () => [unboard('off', rail(side)), unhook(), sfx('horn'), move('enc', { y: -380, x: side * 230, rot: Math.PI * 0.85, sails: 'full' }, 3)],
  })),

  CH_SMUGGLER_3: def((ev, side) => ({
    side: 1,
    weather: () => [weather({ night: true })],
    setup: (c) => [pierNpc(c, 'enc', 'smuggler', -30), pierNpc(c, 's2', 'smuggler', 0, { dx: 6 }), spawn({ id: 'lamp', kind: 'lantern', x: pierX(c, -6), y: -40, layer: 1 })],
    dockApproach: (c) => [cam({ x: pierX(c), y: -10 }, 0.3), say('enc', 'Kaptan. Sandıklar?', 2, 0.6)],
    intro: () => [T(0.3)],
    opts: [
      () => [board('cr', 'sailor', 'cargo', 'railR', { carry: 'GOOD_CHARM_DUST' }), unboard('cr', 'railR'), say('enc', 'Söz verdiğimiz gibi. 300 altın.', 2.4, 0.6)],
      () => [cap('Mallar bende kalıyor.', 2, 0.6), say('enc', 'Bunu limanda herkes duyacak…', 2.4, 0.8), par(move('enc', { y: -200 }, 2.4), move('s2', { y: -220 }, 2.4, { wait: false }))],
      () => [cap('Elim boş… devriye her şeyi aldı.', 2.4, 0.6), say('enc', 'O zaman cebinden ödersin!', 2.2, 0.6)],
    ],
    skip: (info) => (info.lost.length ? ['lost'] : []),
    from: () => 'enc',
    exit: () => [],
  })),

  // ════════ LANET ════════
  CH_CURSE_1: def((ev, side) => ({
    weather: () => [weather({ dark: 0.06 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'shrine', x: side * (c.beam / 2 + 90), y: -330 }), spawn({ id: 'idol', kind: 'idol', x: side * (c.beam / 2 + 90), y: -334, layer: 1 })],
    approach: (c) => [par(move('enc', { y: -30 }, 4.5), move('idol', { y: -34 }, 4.5, { wait: false }), slow(4), cam({ x: side * 70, y: -30 }, 0.3)), par(stop(), react('fortune', side), lookout('Kabuklarla süslü bir sunak… altın bir put!', { dur: 2.6 }))],
    intro: () => [T(0.4)],
    opts: [
      () => [S('coins', { from: 'ship', to: 'enc', n: 8 }), par(spawn({ id: 'blessing', kind: 'glowRing', x: 0, y: 0, opts: { col: '#7affc8' } }), sfx('magic')), crewSay([], 'Deniz… teşekkür etti sanki.', { dur: 2.4 })],
      (c) => landing(c, side, ['sailor'], [remove('idol'), sfx('chest'), par(S('flash', {}), sfx('thunder'), weather({ dark: 0.22 }))], [], 70).concat([deckProp('idolD', 'idolDeck', 'cargo')]),
      () => [cap('Ona dokunmayın.', 2, 0.6), go(26)],
    ],
    exit: () => [remove('blessing'), remove('idolD'), ...driftAll(), weather({ restore: true }), T(1)],
  })),

  CH_CURSE_2: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'storm', fx: ['rain', 'lightning'], night: true, dark: 0.1 })],
    setup: (c) => [deckProp('idolD', 'idolDeck', 'cargo'), shipEntity(c, 'ghost', 'ghost', 3, { x: -side * 200, y: -200, alpha: 0.3, rot: Math.PI, sails: 'furled' })],
    approach: () => [par(slow(8), sfx('ghost')), par(crewSay([], 'Ambardan inlemeler geliyor…', { dur: 2.4 }), S('flash', {})), crewSay(['CREW_COMPASS', 'CREW_FINN'], 'Pusula durmadan dönüyor!', { dur: 2.4 })],
    intro: () => [T(0.4)],
    opts: [
      () => [...rock(0.08), par(fx('splinter', 'ship', 20), sfx('creak')), crewSay([], 'Mallar küfleniyor!', { dur: 2 })],
      () => [par(work(['CREW_MAGDA'], 'cargo', 'Tütsü yakıyor', 6, 1), deckProp('incense', 'smoke', 'cargo', { opts: { n: 10, h: 40, drift: 8 } })), only('CREW_MAGDA', 'Lanet bizi girdaba çağırıyor. Hazırlıklıyız.', { dur: 2.8 })],
      (c) => [cap('Putu denize bırakın!', 2, 0.4), remove('idolD'), S('throw', { from: 'ship', to: { x: besides(c, 40), y: -10 }, kind: 'chest', arc: 26, burst: 'splash', sfx: 'splash' }), par(S('flash', {}), sfx('thunder'), move('ghost', { alpha: 0 }, 2))],
    ],
    exit: () => [remove('idolD'), remove('incense'), remove('ghost'), weather({ restore: true }), go(30)],
  })),

  CH_CURSE_3: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', fx: ['lightning'], dark: 0.14 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'whirlpool', x: side * 30, y: -320 })],
    approach: (c) => [par(move('enc', { y: -c.len / 2 - 90 }, 4.5), slow(4), cam({ x: side * 20, y: -110 }, 0.3)), par(S('heel', { rot: side * 0.06 }), react('disaster', side), sfx('roar')), say('enc', 'BORCUNU… ÖDE…', 2.6, 1)],
    intro: () => [T(0.4)],
    opts: [
      () => [S('throw', { from: 'ship', to: 'enc', kind: 'flare', arc: 40, burst: 'spark', n: 30, sfx: 'magic' }), par(move('enc', { alpha: 0, scale: 0.4 }, 2.4), S('heel', { rot: 0 })), S('icon', { icon: 'gift', from: 'enc', to: 'ship' })],
      () => [par(work(['CREW_MAGDA'], 'bow', 'Girdaba eski bir yemin okuyor', 6, 1), only('CREW_MAGDA', 'Bağışlanan borç, bağlanan lanet!', { dur: 2.8 })), par(move('enc', { alpha: 0, scale: 0.4 }, 2.4), sfx('magic'), S('heel', { rot: 0 })), S('icon', { icon: 'gift', from: 'enc', to: 'ship' })],
      () => [cap('Her şeyi sunun! Altın, mal… ne varsa!', 2.4, 0.4), S('chest', { from: 'ship', to: 'enc' }), T(0.6)],
      (c, info) => [par(go(60), cap('Girdabın kıyısından!', 2, 0.4), S('shipTo', { x: -side * 40 })), ...(info.success ? [S('heel', { rot: 0 })] : [...rock(0.18), ...rock(0.14), S('shake', { amount: 12 })])],
    ],
    outcome: (c, info) => (oi(info) === 2 ? [S('cargoOverboard', { goods: info.lost, to: 'enc', arc: 20 })] : []),
    skip: (info) => (oi(info) === 2 ? ['lost', 'gold'] : []),
    exit: () => [S('heel', { rot: 0 }), ...driftAll(), weather({ restore: true }), T(1)],
  })),

  // ════════ İKİ LİMAN ARASINDA SAVAŞ ════════
  CH_WAR_1: def((ev, side) => ({
    weather: () => [weather({ dark: 0.08 })],
    setup: (c) => [
      shipEntity(c, 'crown', 'warship', 3, { x: -230, y: -250, rot: Math.PI / 2, scale: 0.75, sails: 'furled' }),
      shipEntity(c, 'reb', 'pirate', 3, { x: 230, y: -240, rot: -Math.PI / 2, scale: 0.75, sails: 'furled', crewNpc: ['deserter', 'sailor', 'deserter'] }),
      spawn({ id: 'e1', kind: 'rowboat', x: -200, y: -200, opts: { npcs: ['officer', 'soldier'], dir: 'right' } }),
      spawn({ id: 'e2', kind: 'rowboat', x: 200, y: -190, opts: { npcs: ['deserter', 'sailor'], dir: 'left' } }),
    ],
    approach: (c) => [par(move('crown', { y: -60 }, 4.5), move('reb', { y: -50 }, 4.5, { wait: false }), move('e1', { x: -besides(c, 22, 1), y: -10 }, 4.5, { wait: false }), move('e2', { x: besides(c, 22, 1), y: 0 }, 4.5, { wait: false }), slow(5), cam({ x: 0, y: -50 }, 0.3, 0.95)), par(stop(), react('danger', side))],
    intro: () => [say('e1', 'Kraliyet desteğini bekler!', 2.4, 0.4), say('e2', 'Asiler özgür denizler için savaşıyor!', 2.6, 0.8)],
    opts: [
      () => [cap('Kraliyet yanındayım.', 2, 0.6), say('e1', 'Avansın. Erzak ve barut taşıyacaksın.', 2.4, 0.4), S('coins', { from: 'e1', to: 'ship', n: 8 }), say('e2', 'Hainler!', 1.6, 0.4)],
      () => [cap('Asilerle birlikteyim.', 2, 0.6), S('throw', { from: 'e2', to: 'ship', kind: 'chest', arc: 30, burst: 'gold', sfx: 'coin' }), say('e2', 'Kazanırsak unutmayız!', 2.2, 0.6)],
      () => [par(work(['CREW_MEHMED'], 'center', 'İki amirali aynı masaya oturtuyor', 6, 0.6), deckProp('table', 'mapTable', 'center')), board('o1', 'officer', 'railL', 'center', { dx: -10, face: 'right', wait: false }), board('o2', 'deserter', 'railR', 'center', { dx: 10, face: 'left' }), only('CREW_MEHMED', 'Barış, savaştan daha kârlıdır beyler.', { dur: 2.8 }), par(sfx('cheer'), fx('spark', 'ship', 20))],
      () => [cap('Bu savaş bizim değil.', 2.2, 0.6), par(go(28), S('shipTo', { x: -side * 40 }))],
    ],
    from: (info) => (oi(info) === 0 ? 'e1' : 'e2'),
    skip: (info) => (oi(info) <= 1 ? ['gold'] : []),
    exit: () => [remove('table'), offAll(), par(move('e1', { x: -200, y: -120 }, 2.4), move('e2', { x: 200, y: -120 }, 2.4, { wait: false })), par(move('crown', { y: 260 }, 3), move('reb', { y: 260 }, 3, { wait: false }), go(30)), remove('crown'), remove('reb'), remove('e1'), remove('e2')],
  })),

  CH_WAR_2: def((ev, side) => ({
    side: 1,
    weather: () => [],
    setup: (c) => [pierNpc(c, 'enc', 'villager', -40), pierNpc(c, 'v2', 'villagerF', -10, { dx: 4 }), pierNpc(c, 'v3', 'merchant', -70, { dx: -4 }), pierNpc(c, 'v4', 'soldier', 20)],
    dockApproach: (c) => [cam({ x: pierX(c), y: -20 }, 0.3), say('v3', 'Duydun mu? Savaş bitti!', 2.4, 0.6)],
    intro: () => [say('enc', 'Herkes aynı şeyi konuşuyor…', 2.2, 0.6)],
    opts: [(c, info) => [cap('Kim kazandı?', 1.8, 0.6), ...(info.success ? [par(say('enc', 'Senin taraf! Kahraman geldi!', 2.4, 0.4), sfx('cheer'), fx('spark', { x: pierX(c), y: -30 }, 30))] : [par(say('enc', 'Senin taraf yenildi… ', 2.4, 0.4), say('v4', 'Bu gemiye göz kulak olun.', 2.4, 0.8))])]],
    from: () => 'enc',
    exit: () => [],
  })),

  // ════════ KAYIP MÜRETTEBAT ════════
  CH_LOST_CREW_1: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ night: true, fx: ['rain'], preset: 'dark' })],
    setup: () => [],
    approach: () => [par(slow(8), cam({ x: 0, y: 0 }, 0.3, 1.04)), gather('center', 'Yoklamada', { n: 5, captain: true, dur: 8 }), cap('Yoklama! …Can? CAN NEREDE?!', 2.6, 0.8), crewSay([], 'Gece dalga güverteyi süpürdü…', { dur: 2.4 })],
    intro: () => [T(0.4)],
    opts: [
      () => [par(cap('Dümeni kırın! Geri dönüyoruz!', 2.2, 0.4), S('heel', { rot: -side * 0.2 }), S('speed', { v: 14 })), T(1.6), S('heel', { rot: 0 }), lookout('CAN! CAAAN!', { dur: 2 })],
      (c) => [gather(rail(side), 'Filikayı indiriyor', { n: 2, run: true, dur: 3 }), spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16), y: 0, opts: { npcs: ['sailor', 'sailor'], dir: 'down' } }), par(move('boat', { y: 240, alpha: 0.3 }, 4), crewSay([], 'Onu bulacağız, kaptan!', { dur: 2.2 }))],
      () => [cap('…Devam ediyoruz.', 2, 1.6), gather('center', 'Sessizce yas tutuyor', { n: 4, dur: 6 }), T(1.4)],
    ],
    exit: () => [remove('boat'), weather({ restore: true }), go(30)],
  })),

  CH_LOST_CREW_2: def((ev, side) => ({
    weather: () => [weather({ fog: 1, dark: 0.08 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'rocks', x: side * 60, y: -340, alpha: 0.4 })],
    approach: (c) => [par(slow(5), move('enc', { y: -c.len / 2 - 90 }, 4.5)), sfx('whistle'), T(0.8), par(sfx('whistle'), crewSay([], 'Islık! Kayalıklardan geliyor!', { dur: 2.2 }))],
    intro: () => [T(0.4)],
    opts: [(c, info) => [par(S('speed', { v: 6 }), S('shipTo', { x: side * 24 }), move('enc', { y: -c.len / 2 - 40, alpha: 0.8 }, 3)), sfx('whistle'), ...(info.success ? [lookout('Ses netleşiyor!', { dur: 2 })] : [par(sfx('creak'), fx('splinter', { rail: side }, 20), S('shake', { amount: 7 })), lookout('Kayalara sürtündük… ama devam!', { dur: 2.2 })])]],
    exit: () => [...driftAll(), weather({ restore: true }), T(1)],
  })),

  CH_LOST_CREW_3: def((ev, side) => ({
    weather: () => [weather({ preset: 'calm', dark: 0 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'rocks', x: side * (c.beam / 2 + 70), y: -320 }), spawn({ id: 'barrel', kind: 'barrel', x: side * (c.beam / 2 + 40), y: -300 }), spawn({ id: 'can', kind: 'npc', npc: 'castaway', x: side * (c.beam / 2 + 46), y: -306, layer: 1, state: 'sit' })],
    approach: (c) => [par(move('enc', { y: -30 }, 4.5), move('barrel', { y: -10 }, 4.5, { wait: false }), move('can', { y: -16 }, 4.5, { wait: false }), slow(4), cam({ x: side * 60, y: -20 }, 0.3)), par(stop(), lookout('ORADA! Fıçıya sarılmış!', { dur: 2.2 })), say('can', 'Kaptan…!', 2, 0.6)],
    intro: () => [T(0.4)],
    opts: [(c) => [par(work(['CREW_GROOT', 'CREW_BJORN'], rail(side), 'Halat atıyor', 4), S('throw', { from: { rail: side }, to: 'can', kind: 'rope', arc: 20 })), move('can', { x: besides(c, 8), y: -6 }, 2.4), remove('can'), board('canD', 'castaway', rail(side), 'center', { say: 'Beni bırakmadınız!' }), work(['CAPTAIN'], 'center', 'Can\'a sarılıyor', 4, 1), par(sfx('cheer'), crewSay([], 'Hoş geldin evlat!', { dur: 2 }))]],
    from: () => 'barrel',
    exit: () => [unboard('canD', 'cargo'), ...driftAll(), T(1)],
  })),

  // ════════ TİCARET SAVAŞI ════════
  CH_TRADE_WAR_1: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 3, { scale: 0.9, crewNpc: ['guild', 'sailor', 'guild'] }), spawn({ id: 'pen', kind: 'sparkles', x: side * 190, y: -340, layer: 1, opts: { r: 24, col: '#e04040', n: 12 } })],
    approach: (c) => [par(move('enc', { x: side * 180, y: -150 }, 2.6), move('pen', { x: side * 180, y: -160 }, 2.6, { wait: false }), cam({ x: side * 80, y: -70 }, 0.3)), remove('pen'), move('enc', { x: side * 190, y: -20, rot: 0, sails: 'furled' }, 2), par(move('enc', { x: alongside(c, 0.9, 3, 4), y: -6 }, 1.4), stop()), hooks(side), board('rep', 'guild', rail(side), 'center', { say: 'Lonca adına konuşuyorum.', face: 'up' })],
    intro: () => [S('say', { actor: 'rep', text: 'Fiyat birliğine katıl… yoksa limanda malını kimse almaz.', dur: 3, hold: 1 })],
    opts: [
      () => [cap('Aidatı ödeyeceğim.', 2, 0.4), S('coins', { from: 'ship', to: { x: 0, y: 0 }, n: 8 }), S('say', { actor: 'rep', text: 'Akıllıca. Lonca seni korur.', dur: 2.2, hold: 0.6 })],
      () => [work(['CREW_HAMID'], 'center', 'Temsilciyi sohbete boğuyor', 6, 1), only('CREW_HAMID', 'Kardeşim, otur bir çay iç… şimdi şu aidat meselesi…', { dur: 3, hold: 1.2 }), S('say', { actor: 'rep', text: '…Peki, peki! Aidat yok!', dur: 2.2, hold: 0.6 })],
      () => [par(work(['CREW_TARIK'], 'center', 'Loncanın defterlerine göz atıyor', 5, 1.2), deckProp('book', 'mapTable', 'center', { dx: 10 })), only('CREW_TARIK', 'İlginç rakamlar… çok ilginç.', { dur: 2.4 }), remove('book')],
      () => [cap('Gemimden in!', 1.8, 0.4), S('say', { actor: 'rep', text: 'Lonca bunu unutmayacak!', dur: 2.2, hold: 0.4 })],
    ],
    exit: () => [remove('book'), unboard('rep', rail(side)), unhook(), move('enc', { y: -380, x: side * 230, rot: Math.PI * 0.85, sails: 'full' }, 3)],
  })),

  CH_TRADE_WAR_2: def((ev, side) => ({
    side: 1,
    weather: () => [],
    setup: (c) => [pierNpc(c, 'enc', 'guild', -30), pierNpc(c, 'g2', 'guild', 0, { dx: 6 }), pierNpc(c, 'g3', 'soldier', -60)],
    dockApproach: (c) => [cam({ x: pierX(c), y: -20 }, 0.3), say('enc', 'Pazar bugün… biraz durgun, kaptan.', 2.4, 0.6)],
    intro: () => [T(0.3)],
    opts: [(c) => [cap('Göreceğiz.', 1.8, 0.6), board('cr', 'sailor', 'cargo', 'railR', { carry: 'GOOD_SPICE' }), say('g2', 'Lonca fiyatı! Yüzde yirmi aşağı!', 2.4, 0.6), unboard('cr', 'cargo')]],
    from: () => 'enc',
    exit: () => [],
  })),

  // ════════ HAYALET KAPTAN ════════
  CH_GHOST_2: def((ev, side) => ({
    weather: () => [weather({ night: true, fog: 0.8, preset: 'dark' })],
    setup: (c) => [shipEntity(c, 'enc', 'ghost', 3, { alpha: 0, x: side * 160, y: -200, rot: Math.PI * 0.1, crewNpc: ['ghost', 'ghost'] }), spawn({ id: 'bell', kind: 'bell', x: side * 160, y: -210, layer: 1, alpha: 0 })],
    approach: (c) => [par(slow(5), sfx('bell'), cam({ x: side * 70, y: -60 }, 0.3)), par(move('enc', { alpha: 0.7, x: alongside(c, 1, 3, 30), y: -30 }, 4.5), move('bell', { alpha: 1, x: alongside(c, 1, 3, 30), y: -40 }, 4.5, { wait: false }), sfx('ghost')), par(react('danger', side), sfx('bell'))],
    intro: () => [say('enc', '…Yaklaş, yaşayan… bir dileğim var…', 3, 1)],
    opts: [
      (c, info) => [hooks(side), work(['CAPTAIN'], rail(side), 'Hayalet gemiye uzanıyor', 4, 1.4), ...(info.success ? [say('enc', 'Bu madalyonu sevdiğime ulaştır… bir sonraki limanda bekliyor.', 3, 0.8), S('icon', { icon: 'amulet', from: 'enc', to: 'ship' })] : [par(fx('spark', 'ship', 30), S('shake', { amount: 10 }), sfx('ghost'), weather({ dark: 0.2 })), cap('Buz gibi bir rüzgâr…!', 2, 0.6)])],
      () => [gather(rail(side), 'Uzaktan dua ediyor', { n: 4, dur: 6 }), crewSay(['CREW_MAGDA'], 'Huzur bul, yorgun ruh.', { dur: 2.4 }), par(move('enc', { alpha: 0 }, 3), move('bell', { alpha: 0 }, 3, { wait: false }))],
    ],
    exit: () => [unhook(), par(move('enc', { alpha: 0 }, 2), move('bell', { alpha: 0 }, 2)), remove('bell'), weather({ restore: true }), go(30)],
  })),

  CH_GHOST_3: def((ev, side) => ({
    side: 1,
    weather: () => [weather({ dark: 0.1 })],
    setup: (c) => [pierNpc(c, 'enc', 'servant', -90, { dir: 'up' }), spawn({ id: 'lamp', kind: 'lantern', x: pierX(c, 6), y: -100, layer: 1 })],
    dockApproach: (c) => [cam({ x: pierX(c), y: -60 }, 0.32), S('opts', { id: 'enc', opts: {} }), T(0.6)],
    intro: () => [say('enc', 'O madalyon… onun madalyonu!', 2.6, 0.8)],
    opts: [
      (c) => [cap('Size bir emanet getirdim.', 2.2, 0.6), S('icon', { icon: 'amulet', from: 'ship', to: 'enc' }), say('enc', 'Sonunda… eve döndün.', 2.6, 0.6), par(spawn({ id: 'glow', kind: 'glowRing', x: pierX(c), y: -90, layer: 1, opts: { col: '#7affc8' } }), spawn({ id: 'sp', kind: 'sparkles', x: pierX(c), y: -110, layer: 2, opts: { r: 50, col: '#7affc8' } }), sfx('magic')), T(1.6)],
      (c) => [cap('Bu madalyon iyi para eder…', 2.2, 0.6), say('enc', 'Hayır…', 1.8, 0.6), par(deckProp('cold', 'mist', 'center', { opts: { col: '#bfe3ff', a: 0.2, r: 60 } }), sfx('ghost')), crewSay([], 'Kamarada buz gibi bir soğuk…', { dur: 2.2 })],
    ],
    from: () => 'enc',
    exit: () => [],
  })),

  // ════════ PRENSES ════════
  CH_PRINCESS_1: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 2, { x: side * 200, y: -240, rot: Math.PI * 0.9, sails: 'furled' }), spawn({ id: 'boat', kind: 'rowboat', x: side * 170, y: -200, alpha: 0, opts: { npcs: ['servant', 'sailor'], dir: 'left' } })],
    approach: (c) => [par(move('enc', { y: -60 }, 3), slow(3), cam({ x: side * 70, y: -40 }, 0.3)), par(stop(), move('boat', { alpha: 1, x: besides(c, 18), y: -10 }, 3)), board('serv', 'servant', rail(side), rail(side), { dy: -10, endState: 'sit', say: 'Prensesim…!' }), work(['CREW_ISADORA'], 'center', 'Yüzünü pelerinine saklıyor', 6)],
    intro: () => [S('say', { actor: 'serv', text: 'Sizi yıllardır arıyoruz, Prensesim.', dur: 2.6, hold: 1 })],
    opts: [
      () => [cap('İsadora… doğru mu bu?', 2, 1.2), only('CREW_ISADORA', '…Henüz değil.', { dur: 2.2, hold: 1.2 })],
      () => [S('say', { actor: 'serv', text: 'Titan Çarşısı\'nın tahtından kaçırılan bir prenses… hikâye uzun.', dur: 3, hold: 1.2 }), par(deckProp('tale', 'sparkles', 'center', { opts: { r: 24, col: '#e8d0ff' } }), sfx('magic'))],
    ],
    exit: () => [remove('tale'), unboard('serv', rail(side)), par(move('boat', { x: side * 170, y: -80, alpha: 0 }, 2.4), move('enc', { y: -380 }, 3, { wait: false })), go(30), remove('boat')],
  })),

  CH_PRINCESS_2: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'pirate', 3, { crewNpc: ['hunter', 'hunter', 'hunter'], scale: 0.9 })],
    approach: (c) => [par(move('enc', { x: side * 170, y: -150 }, 2.6), cam({ x: side * 80, y: -80 }, 0.3)), par(react('danger', side), lookout('Kara armalı gemi! Ödül avcıları!', { dur: 2.4 })), move('enc', { x: side * 190, y: -20, rot: 0, sails: 'furled' }, 2), par(move('enc', { x: alongside(c, 0.9, 3, 10), y: -6 }, 1.4), slow(2))],
    intro: () => [say('enc', 'İsadora\'yı teslim et. 400 altın. Pazarlık yok.', 2.8, 1), only('CREW_ISADORA', '…', { dur: 1.6 })],
    opts: [
      (c, info) => [par(go(80), sfx('depart'), S('shipTo', { x: -side * 40 })), ...(info.success ? [move('enc', { y: 300 }, 3), only('CREW_ISADORA', 'Teşekkür ederim, kaptan.', { dur: 2.2 })] : [S('fire', { from: 'enc', to: 'ship', n: 3, hit: true }), move('enc', { y: 300 }, 3)])],
      (c, info) => [par(work(['CREW_BJORN', 'CREW_OKSANA'], 'cannon', 'Avcılara nişan alıyor', 5), cam('enc', 0.3, 1.05)), S('fire', { from: 'ship', to: 'enc', n: 3, hit: info.success ? true : 'some', burn: info.success }), ...(info.success ? [say('enc', 'Geri çekilin!', 2, 0.4), move('enc', { y: -380, x: side * 260 }, 3)] : [S('fire', { from: 'enc', to: 'ship', n: 3, hit: true })])],
      (c) => [hooks(side), board('isa', 'princess', 'center', rail(side), { say: '…', sayDur: 2 }), board('hun', 'hunter', rail(side), rail(side), { dy: 14, wait: false }), unboard('isa', rail(side)), unboard('hun', rail(side), { wait: false }), crewSay([], '…', { dur: 2 }), S('coins', { from: 'enc', to: 'ship', n: 16 })],
    ],
    skip: (info) => (oi(info) === 2 ? ['gold'] : []),
    exit: () => [unhook(), move('enc', { y: -380, x: side * 230, rot: Math.PI * 0.85, sails: 'full' }, 3), go(30)],
  })),

  CH_PRINCESS_3: def((ev, side) => ({
    weather: () => [weather({ preset: 'calm', dark: 0 })],
    setup: (c) => [shipEntity(c, 'enc', 'warship', 4, { scale: 0.85, crewNpc: ['officer', 'soldier', 'soldier', 'soldier'] }), spawn({ id: 'sp', kind: 'sparkles', x: side * 190, y: -330, layer: 1, opts: { r: 40, col: '#f2e080' } })],
    approach: (c) => [par(move('enc', { x: side * 180, y: -150 }, 3), move('sp', { x: side * 180, y: -150 }, 3, { wait: false }), sfx('horn'), cam({ x: side * 70, y: -70 }, 0.3)), move('enc', { x: side * 190, y: -20, rot: 0, sails: 'furled' }, 2), par(move('enc', { x: alongside(c, 0.85, 4, 6), y: -6 }, 1.4), move('sp', { x: alongside(c, 0.85, 4, 6), y: -10 }, 1.4, { wait: false }), stop()), hooks(side), board('adm', 'officer', rail(side), 'center', { say: 'Kraliçe Elena\'nın kızına selam olsun!' })],
    intro: () => [only('CREW_ISADORA', 'Evet. Ben Kraliçe Elena\'nın kızıyım.', { dur: 2.8, hold: 1 }), gather('center', 'Nefesi kesilmiş bakıyor', { n: 4, state: 'react' })],
    opts: [() => [S('npcState', { id: 'adm', state: 'sit' }), S('say', { actor: 'adm', text: 'Kraliyet mührü artık bu geminin.', dur: 2.6, hold: 0.6 }), S('icon', { icon: 'crown', from: { x: 0, y: -10 }, to: { x: 0, y: -60 } }), par(sfx('cheer'), fx('gold', 'ship', 40), fx('spark', 'ship', 30))]],
    from: () => 'enc',
    exit: () => [unboard('adm', rail(side)), unhook(), remove('sp'), sfx('horn'), move('enc', { y: -380, x: side * 230, rot: Math.PI * 0.85, sails: 'full' }, 3)],
  })),
};
