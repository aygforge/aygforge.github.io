// FELAKET ve TAMİR eventleri — imza sahneleri.
import {
  S, par, wait, def, rail, shipEntity, alongside, besides, cap, crewSay, only, lookout, say, slow, stop, go, cam,
  react, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, weather, call, driftAll, offAll, oi,
} from '../kit.js';

const T = (n) => wait(n);
/** Gemi sarsıntısı: yalpalama + sarsıntı */
const rock = (amt = 0.06) => [par(S('heel', { rot: amt }), S('shake', { amount: 6 }), sfx('creak')), T(0.35), S('heel', { rot: -amt }), T(0.35), S('heel', { rot: 0 })];
const rain = (c, n) => [...Array(n).keys()].map((i) => [S('throw', { from: { x: (i % 2 ? -1 : 1) * (60 + i * 17) % 160, y: -200 }, to: { x: ((i * 53) % 200) - 100, y: -60 + ((i * 37) % 140) }, kind: 'flare', arc: 50, dur: 0.9, burst: 'fire', n: 10, sfx: 'splash' }), T(0.3)]);

export const DISASTER_SCENES = {
  // ───────── DEV MÜREKKEP BALIĞI ─────────
  EVT_DIS_01: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', fx: ['rain'], dark: 0.12 })],
    setup: (c, instant) => [spawn({ id: 'enc', kind: 'tentacles', x: 0, y: 0, layer: 1, alpha: instant ? 1 : 0, scale: instant ? 1 : 0.5 }), spawn({ id: 'shadow', kind: 'shadow', x: 0, y: -10, alpha: 0, opts: { s: 2.2, a: 0.5 } })],
    approach: () => [
      par(move('shadow', { alpha: 1 }, 2.5), S('speed', { v: 20 }), lookout('Altımızda bir şey var…', { dur: 2 })),
      par(S('speed', { v: 0 }), S('sails', { state: 'furled' }), S('shake', { amount: 12 }), sfx('roar'), react('disaster', side)),
      par(move('enc', { alpha: 1, scale: 1 }, 1.4), fx('splash', 'ship', 60), sfx('splash')),
      ...rock(0.07),
      cap('Dokunaçlar! Gövdeyi sarıyorlar!', 2.4, 0.6),
    ],
    intro: () => [...rock(0.05)],
    opts: [
      (c, info) => [
        par(work(['CREW_BJORN', 'CREW_OKSANA', 'CREW_BARAKA'], 'cannon', 'Topu dokunaçlara çeviriyor', 4), cam({ x: side * 40, y: -20 }, 0.3, 1.05)),
        S('fire', { from: 'ship', to: { x: side * 46, y: -30 }, n: 3, hit: info.success ? true : 'some' }),
        ...(info.success
          ? [par(sfx('roar'), move('enc', { alpha: 0, scale: 0.6 }, 1.6), spawn({ id: 'ink', kind: 'mist', x: 0, y: 20, layer: 2, opts: { col: '#141420', a: 0.35, r: 110 } }), fx('splash', 'ship', 40)), S('coins', { from: { x: side * 46, y: 10 }, to: 'ship', n: 18 })]
          : [par(sfx('roar'), S('shake', { amount: 14 })), ...rock(0.1)]),
      ],
      () => [
        par(work(['CREW_KALANI'], rail(side), 'Denize eğilip ninni mırıldanıyor', 6, 1.4), only('CREW_KALANI', '♪ Uyu derin, uyu karanlık… ♪', { dur: 3 })),
        par(spawn({ id: 'song', kind: 'sparkles', x: 0, y: 0, layer: 2, opts: { r: 70, col: '#a0ffd0' } }), sfx('magic')),
        move('enc', { alpha: 0, scale: 0.7 }, 3), remove('song'),
      ],
      (c, info) => [
        par(deckProp('amu', 'glowRing', 'center', { opts: { col: '#ff9a40' } }), fx('fire', 'ship', 20), sfx('magic')),
        info.success ? par(move('enc', { alpha: 0, scale: 0.6 }, 1.4), sfx('roar')) : par(T(0.5), S('shake', { amount: 12 }), sfx('roar'), fx('splinter', { rail: side }, 24)),
        remove('amu'),
      ],
      (c, info) => [
        par(go(60), sfx('depart'), cap('Tüm yelkenler! Kurtulmalıyız!', 2.2, 0.4)),
        ...rock(0.08),
        info.success ? par(move('enc', { y: 160, alpha: 0 }, 2), move('shadow', { y: 160, alpha: 0 }, 2, { wait: false })) : par(S('shake', { amount: 16 }), sfx('roar'), fx('splinter', 'ship', 40)),
      ],
    ],
    exit: () => [par(move('enc', { alpha: 0 }, 1.4), move('shadow', { alpha: 0 }, 1.4), remove('ink')), weather({ restore: true }), remove('enc'), remove('shadow')],
  })),

  // ───────── TSUNAMİ ─────────
  EVT_DIS_02: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', fx: ['rain', 'lightning'], dark: 0.16 })],
    setup: () => [spawn({ id: 'enc', kind: 'tsunami', x: 0, y: -380, layer: 1 })],
    approach: (c) => [
      par(S('speed', { v: 2 }), S('sails', { state: 'furled' }), cam({ x: 0, y: -120 }, 0.3), lookout('Deniz… geri çekiliyor?!', { dur: 2.2 })),
      par(move('enc', { y: -c.len / 2 - 50 }, 5, { ease: 'in' }), S('flash', {}), react('disaster', side), sfx('roar')),
      cap('Göğe uzanan bir dalga! Herkes tutunsun!', 2.6, 0.6),
    ],
    intro: () => [S('flash', {}), T(0.4)],
    opts: [
      (c) => [par(stop(), gather('mast', 'Kendini direğe bağlıyor', { n: 4, run: true, dur: 5 }), cap('Demirleri at! Her şeyi bağlayın!', 2.4, 0.6)), wave(c, 9)],
      (c) => [par(work(['CREW_SURGE'], 'helm', 'Gemiyi dalganın omzuna sürüyor', 5, 0.6), only('CREW_SURGE', 'Dalganın omzuna! Şimdi!', { dur: 2 })), par(S('shipTo', { x: side * 60 }), S('heel', { rot: side * 0.15 })), wave(c, 4), S('heel', { rot: 0 })],
      (c) => [deckProp('map', 'mapTable', 'center'), par(work(['CAPTAIN'], 'center', 'Derin kanalı arıyor', 3, 1), cap('Haritada derin kanal… şuradan!', 2.2, 0.4)), remove('map'), par(S('shipTo', { x: -side * 70 }), go(40)), wave(c, 3)],
      (c, info) => [
        par(go(60), cap('Dalganın üstüne! Hepsini aç!', 2.2, 0.4)),
        ...(info.success
          ? [par(S('shipTo', { y: -40 }), S('heel', { rot: 0.1 })), move('enc', { y: c.len / 2 + 220 }, 2, { ease: 'linear' }), par(S('shipTo', { y: 20 }), S('heel', { rot: -0.08 })), T(0.6), par(S('shipTo', { y: 0 }), S('heel', { rot: 0 }), crewSay([], 'İnanılmaz! Tepeden aştık!', { dur: 2.2 }))]
          : [move('enc', { y: c.len / 2 + 220 }, 2.2, { ease: 'linear' }), par(S('flash', {}), weather({ dark: 0.4 }), fx('splash', 'ship', 80), S('shake', { amount: 16 }), sfx('splash')), T(1), weather({ dark: 0.16 })]),
      ],
    ],
    exit: () => [remove('enc'), weather({ restore: true }), T(0.8)],
  })),

  // ───────── KORSAN FİLOSU ─────────
  EVT_DIS_03: def((ev, side) => ({
    thieves: true,
    weather: () => [weather({ dark: 0.12, fx: [] })],
    setup: (c) => [
      shipEntity(c, 'enc', 'pirate', 4, { x: 0, y: -460, scale: 0.85 }),
      ...[-2, -1, 1, 2].map((k) => shipEntity(c, 'f' + k, 'pirate', 2, { x: k * 120, y: -420 + Math.abs(k) * 30, scale: 0.75 })),
      spawn({ id: 'smk', kind: 'smoke', x: 0, y: -400, layer: 1, opts: { n: 12, h: 60 } }),
    ],
    approach: (c) => [
      par(move('enc', { y: -c.len / 2 - 140 }, 4.5), ...[-2, -1, 1, 2].map((k) => move('f' + k, { x: k * 120 + (Math.abs(k) === 2 ? Math.sign(k) * 10 : 0), y: Math.abs(k) === 2 ? 10 : -c.len / 2 - 70, rot: Math.PI + k * 0.4 }, 4.5, { wait: false })), move('smk', { y: -c.len / 2 - 150 }, 4.5, { wait: false }), slow(5), cam({ x: 0, y: -120 }, 0.32, 0.96)),
      par(react('disaster', side), sfx('drum'), lookout('Ufuk siyah yelkenlerle doldu…', { dur: 2.4 })),
      cap('Kuşatıldık.', 2, 0.8),
    ],
    intro: () => [say('enc', 'Teslim ol ya da hepiniz balıklara yem olun!', 3, 1.2)],
    opts: [
      (c, info) => [
        par(S('flag', { up: true }), sfx('flag'), work(['CREW_DIEGO'], 'bow', 'Eski parolayı haykırıyor', 5, 0.8)),
        only('CREW_DIEGO', 'KARA DENİZİN ÇOCUKLARI, YOL VERİN!', { dur: 2.8, hold: 1.2 }),
        info.success ? par(say('enc', 'Parola doğru! Açılın!', 2.4, 0.6), move('f-1', { x: -220 }, 2.6, { wait: false }), move('f1', { x: 220 }, 2.6)) : par(say('enc', 'O parola eskidi, ihtiyar!', 2.4, 0.6), S('fire', { from: 'f1', to: 'ship', n: 2, hit: true })),
      ],
      (c, info) => [
        par(work(['CREW_BJORN', 'CREW_OKSANA'], 'cannon', 'Amiral gemisine nişan alıyor', 6), cam('enc', 0.3, 1.04)),
        S('fire', { from: { rail: 0, dy: -c.len / 2 }, to: 'enc', n: 4, hit: info.success ? true : 'some', burn: info.success }),
        ...(info.success
          ? [par(S('fire', { from: 'f1', to: 'ship', n: 1, hit: false }), fx('fire', 'enc', 30)), par(move('enc', { alpha: 0.2, scale: 0.7 }, 3), sfx('roar'), say('enc', 'Batıyoruz!', 2, 0.4)), par(...[-2, -1, 1, 2].map((k) => move('f' + k, { x: k * 260, y: -300 }, 3, { wait: false })), T(2.6))]
          : [par(S('fire', { from: 'f-1', to: 'ship', n: 2, hit: true }), S('fire', { from: 'f1', to: 'ship', n: 2, hit: true })), par(S('fire', { from: 'f-2', to: 'ship', n: 2, hit: true }), S('fire', { from: 'f2', to: 'ship', n: 2, hit: true }))]),
      ],
      (c) => [
        par(S('flag', { up: true, color: '#f4f4f0' }), sfx('flag'), cap('Beyaz bayrak… hayatta kalmak her şeyden önemli.', 2.6, 0.6)),
        move('enc', { x: side * 220, y: -20, rot: 0 }, 2.4), move('enc', { x: alongside(c, 0.85, 4, 2), y: -6 }, 1.4),
        say('enc', 'Akıllıca. Şimdi ambarı boşaltın!', 2.4, 0.6),
      ],
      (c, info) => [
        par(go(80), sfx('depart'), cap('Şu boşluk! Tüm yelkenler!', 2, 0.4), S('shipTo', { x: side * 50 })),
        info.success ? par(move('f1', { y: 200 }, 2), move('f2', { y: 220 }, 2, { wait: false }), move('enc', { y: 160 }, 2, { wait: false })) : par(S('fire', { from: 'f' + (side > 0 ? 2 : -2), to: 'ship', n: 3, hit: true }), S('fire', { from: 'enc', to: 'ship', n: 2, hit: true })),
      ],
    ],
    from: () => 'enc',
    exit: (c) => [par(go(30), move('enc', { y: -460, rot: Math.PI }, 3), ...[-2, -1, 1, 2].map((k) => move('f' + k, { y: -480 }, 3, { wait: false })), move('smk', { y: -480 }, 3, { wait: false })), ...[-2, -1, 1, 2].map((k) => remove('f' + k)), remove('smk')],
  })),

  // ───────── VEBA GEMİSİ ─────────
  EVT_DIS_04: def((ev, side) => ({
    weather: () => [weather({ preset: 'dark', dark: 0.1 })],
    setup: (c) => [shipEntity(c, 'enc', 'plague', 2, { x: side * 200, y: -320, rot: Math.PI * 0.8, sails: 'furled', damage: 'damaged' }), spawn({ id: 'miasma', kind: 'mist', x: side * 200, y: -320, layer: 1, opts: { col: '#c8d080', a: 0.18, r: 70 } })],
    approach: (c) => [
      par(move('enc', { x: side * 170, y: -60, rot: Math.PI * 0.9 }, 5), move('miasma', { x: side * 170, y: -60 }, 5, { wait: false }), slow(5), cam({ x: side * 70, y: -40 }, 0.3)),
      par(say('enc', 'Öhö… öhö… yardım edin…', 2.6, 0.4), react('danger', side)),
      crewSay(['CREW_VARGAS'], 'Sarı bayrak. Veba var. Yaklaşmayın!', { dur: 2.6 }),
    ],
    intro: () => [say('enc', 'Su… lütfen…', 2.2, 0.8)],
    opts: [
      () => [par(cap('Rüzgârın tersine dönün. Uzaklaşıyoruz.', 2.4, 0.4), S('heel', { rot: -side * 0.14 }), S('shipTo', { x: -side * 50 }), go(28)), move('enc', { y: 200 }, 3), S('heel', { rot: 0 })],
      (c) => [
        par(work(['CREW_VARGAS'], rail(side), 'Maskesini takıp hastalara gidiyor', 6, 1), only('CREW_VARGAS', 'Maskemi verin. Ben geçerim.', { dur: 2.2 })),
        move('enc', { x: alongside(c, 1, 2, 30), y: -10 }, 2),
        par(fx('spark', 'enc', 20), sfx('magic')), T(1.4),
        par(move('miasma', { alpha: 0.2 }, 2), say('enc', 'Doktor… hayatımı kurtardın. Al, bu senin.', 2.8, 1)),
      ],
      (c, info) => [
        move('enc', { x: alongside(c, 1, 2, 30), y: -10 }, 2.4),
        ...(info.success ? [S('chest', { from: 'enc', to: 'ship' }), say('enc', 'Hazinemiz sizde emanet…', 2.4, 0.8)] : [par(move('miasma', { x: 0, y: 0, alpha: 1 }, 3), board('sick', 'sick', rail(side), 'center', { endState: 'sit', wait: false })), crewSay([], 'Öhö… öhö…', { dur: 2.2 })]),
      ],
    ],
    from: () => 'enc',
    exit: () => [par(move('enc', { y: 300 }, 3), move('miasma', { alpha: 0 }, 2)), remove('miasma'), offAll('cargo')],
  })),

  // ───────── DEPREM SONRASI LİMAN ─────────
  EVT_DIS_05: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'ash', fx: ['ash'] })],
    setup: () => [
      call((d) => { d.world.coast = { type: 'trade', y: -160 }; }),
      ...[-120, -40, 60, 150].map((x, i) => spawn({ id: 'sm' + i, kind: 'smoke', x, y: -170 + (i % 2) * 10, layer: 1, opts: { n: 12, h: 80, drift: 20 } })),
      spawn({ id: 'deb', kind: 'wreck', x: side * 50, y: -150, opts: { n: 10, w: 220, h: 60 } }),
    ],
    approach: () => [par(slow(6), cam({ x: 0, y: -120 }, 0.35)), par(react('danger', side), lookout('Limandan dumanlar yükseliyor… rıhtımlar yıkılmış!', { dur: 2.8 })), sfx('bell')],
    intro: () => [crewSay([], 'Deprem… insanlar yardım bekliyor.', { dur: 2.4 })],
    opts: [
      () => [par(go(14), cap('Yanaşalım. Ne bulursak.', 2.2, 0.8)), T(1.4)],
      (c) => [
        par(cap('Erzak ve kereste! Sandalları indirin!', 2.4, 0.4), gather('cargo', 'Erzak indiriyor', { n: 3, run: true, dur: 5 })),
        spawn({ id: 'b1', kind: 'rowboat', x: besides(c, 16), y: -20, opts: { npcs: ['sailor', 'sailor'], cargo: ['GOOD_GRAIN', 'GOOD_TIMBER'], dir: 'up' } }),
        move('b1', { y: -150, x: side * 30 }, 3),
        par(sfx('cheer'), fx('spark', { x: side * 30, y: -160 }, 20), float('Liman halkı minnettar!', '#9ae0a0', { x: side * 30, y: -160 })), T(1),
      ],
      () => [par(cap('Burada yapabileceğimiz bir şey yok. Rota değişsin.', 2.6, 0.6), S('heel', { rot: -side * 0.15 }), S('shipTo', { x: -side * 60 }), go(28)), T(1.6), S('heel', { rot: 0 })],
    ],
    exit: () => [call((d) => { d.world.coast = null; }), ...[0, 1, 2, 3].map((i) => remove('sm' + i)), remove('b1'), remove('deb'), weather({ restore: true }), go(30)],
  })),

  // ───────── SAVAŞ ALANI ─────────
  EVT_DIS_06: def((ev, side) => ({
    weather: () => [weather({ dark: 0.1, fx: ['embers'] })],
    setup: (c) => [
      shipEntity(c, 'enc', 'warship', 3, { x: -200, y: -260, rot: Math.PI / 2, scale: 0.8, sails: 'furled' }),
      shipEntity(c, 'pir', 'pirate', 3, { x: 200, y: -240, rot: -Math.PI / 2, scale: 0.8, sails: 'furled' }),
      spawn({ id: 'smk', kind: 'smoke', x: 0, y: -250, layer: 1, opts: { n: 16, h: 70, drift: 40 } }),
    ],
    approach: (c) => [
      par(move('enc', { y: -40 }, 4.5), move('pir', { y: -30 }, 4.5, { wait: false }), move('smk', { y: -60 }, 4.5, { wait: false }), slow(8), cam({ x: 0, y: -40 }, 0.3, 0.96)),
      par(S('fire', { from: 'enc', to: 'pir', n: 2, hit: 'some' }), react('danger', side)),
      par(S('fire', { from: 'pir', to: 'enc', n: 2, hit: 'some' }), lookout('Çatışmanın tam ortasındayız!', { dur: 2.2 })),
    ],
    intro: () => [S('fire', { from: 'enc', to: 'pir', n: 1, hit: false }), T(0.3)],
    opts: [
      () => [
        par(S('flag', { up: true, color: '#f4f4f0' }), work(['CREW_MEHMED'], 'bow', 'Her iki tarafa sesleniyor', 5, 0.6)),
        only('CREW_MEHMED', 'Durun! Bu gemi tarafsızdır, Allah\'ın selamı üzerinize!', { dur: 3, hold: 1.4 }),
        par(say('enc', '…Ateşi kesin.', 2, 0.4), say('pir', 'Hmph. Geç.', 2, 0.6)), go(26), T(1.2),
      ],
      (c, info) => [
        par(S('throw', { from: { rail: 0, dy: -20 }, to: { x: 0, y: -200 }, kind: 'flare', arc: 80, dur: 1.4, burst: 'spark', n: 30 }), sfx('cannon')),
        info.success ? par(move('enc', { x: -alongside(c, 0.8, 3, 20), y: -10, rot: 0 }, 3), say('enc', 'Tüccarı koruyun!', 2, 0.6)) : par(S('fire', { from: 'pir', to: 'ship', n: 2, hit: true })),
        go(24),
      ],
      (c, info) => [par(go(80), sfx('depart')), par(S('fire', { from: 'enc', to: 'pir', n: 2, hit: 'some' }), S('fire', { from: 'pir', to: info.success ? 'enc' : 'ship', n: 2, hit: info.success ? 'some' : true }))],
      () => [par(cap('Komutanlara haber gönderin. Bir taraf seçeceğiz.', 2.6, 0.6), S('throw', { from: 'ship', to: 'enc', kind: 'arrow', arc: 30 }), S('throw', { from: 'ship', to: 'pir', kind: 'arrow', arc: 30 })), T(1.2)],
    ],
    from: () => null,
    exit: () => [par(go(30), move('enc', { y: 260 }, 3), move('pir', { y: 260 }, 3, { wait: false }), move('smk', { y: 260 }, 3, { wait: false })), weather({ restore: true }), remove('pir'), remove('smk')],
  })),

  // ───────── KUTUP BUZULLARI ─────────
  EVT_DIS_07: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'ice', fx: ['snow'] })],
    setup: () => [spawn({ id: 'ice', kind: 'iceFloes', x: 0, y: -300, opts: { n: 26, w: 460, h: 300 } }), spawn({ id: 'berg', kind: 'iceberg', x: -side * 140, y: -320 })],
    approach: (c) => [
      par(move('ice', { y: -40 }, 5), move('berg', { y: -60 }, 5, { wait: false }), slow(4), cam({ x: 0, y: -60 }, 0.3)),
      par(S('speed', { v: 0 }), sfx('creak'), S('shake', { amount: 5 }), react('disaster', side), crewSay([], 'Buz bizi sıkıştırıyor!', { dur: 2.2 })),
    ],
    intro: () => [sfx('creak'), T(0.6)],
    opts: [
      () => [par(go(26), cap('Buz Kıran Pruva! İleri!', 2, 0.4)), ...[0, 1, 2].map(() => [fx('spark', { rail: 0, dy: -90 }, 16), fx('splash', { rail: 0, dy: -90 }, 10), sfx('impact'), T(0.6)]), move('ice', { y: 260 }, 3)],
      (c, info) => [
        par(work(['CREW_SURGE'], 'bow', 'Buzların arasındaki kanalı okuyor', 5, 0.8), only('CREW_SURGE', 'Rüzgâr şu kanalı açıyor… iskeleye!', { dur: 2.4 })),
        par(S('shipTo', { x: -side * 20 }), S('speed', { v: 10 })), T(1), par(S('shipTo', { x: side * 10 }), move('ice', { y: 200 }, 4)),
        info.success ? T(0.2) : par(sfx('creak'), S('shake', { amount: 10 }), fx('splinter', { rail: side }, 30)),
      ],
      () => [par(cap('Geri! Etrafından dolanacağız.', 2.2, 0.6), S('heel', { rot: -side * 0.16 })), par(move('ice', { y: -300 }, 4), move('berg', { y: -340 }, 4, { wait: false })), S('heel', { rot: 0 })],
      (c, info) => [par(go(40), cap('Zorlayın!', 1.6, 0.4)), ...[0, 1].map(() => [S('shake', { amount: 8 }), sfx('creak'), fx('spark', { rail: 0, dy: -90 }, 14), T(0.6)]), info.success ? move('ice', { y: 240 }, 3) : par(S('shake', { amount: 14 }), fx('splinter', 'ship', 40), sfx('impact'))],
    ],
    exit: () => [...driftAll(), weather({ restore: true }), T(1)],
  })),

  // ───────── VOLKANİK PATLAMA ─────────
  EVT_DIS_08: def((ev, side) => ({
    weather: () => [weather({ preset: 'ash', fx: ['ash', 'embers'], dark: 0.1 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'volcano', x: side * (c.beam / 2 + 150), y: -320, opts: { r: 70 } }), spawn({ id: 'lava', kind: 'lava', x: side * 100, y: -280, opts: { n: 8, w: 160, h: 120 } })],
    approach: (c) => [
      par(move('enc', { y: -100 }, 4.5), move('lava', { y: -60 }, 4.5, { wait: false }), slow(8), cam({ x: side * 80, y: -80 }, 0.3)),
      par(S('shake', { amount: 10 }), sfx('roar'), S('flash', {}), react('disaster', side)),
      ...rain(c, 3),
      lookout('Dağ patladı! Yanan taşlar yağıyor!', { dur: 2.4 }),
    ],
    intro: () => [...rain(null, 2)],
    opts: [
      () => [par(deckProp('shield', 'glowRing', 'center', { opts: { col: '#ff9a40' } }), sfx('magic'), cap('Isı Kalkanı! Altına girin!', 2, 0.4)), ...rain(null, 4), remove('shield')],
      (c, info) => [par(go(70), sfx('depart'), S('shipTo', { x: -side * 40 })), ...rain(null, info.success ? 2 : 4), info.success ? T(0.2) : par(S('deckFire', { on: true }), S('shake', { amount: 12 }), fx('fire', 'ship', 30))],
      (c, info) => [
        par(work(['CREW_MAGDA'], 'bow', 'Ateş dağına şarkı söylüyor', 6, 1), only('CREW_MAGDA', '♪ Dur, ateşin anası… dön yatağına ♪', { dur: 3 })),
        info.success ? par(move('lava', { x: side * 220, y: -160 }, 3), spawn({ id: 'song', kind: 'sparkles', x: side * 60, y: -80, layer: 2, opts: { r: 50, col: '#ffb070' } })) : par(...rain(null, 2)),
      ],
    ],
    from: () => null,
    exit: () => [S('deckFire', { on: false }), remove('song'), ...driftAll(), weather({ restore: true }), T(1)],
  })),

  // ───────── BALIKÇI KÖYÜ YARDIMI (tamir) ─────────
  EVT_REPAIR_02: def((ev, side) => ({
    weather: () => [weather({ dark: 0.08 })],
    setup: (c) => [
      spawn({ id: 'enc', kind: 'island', x: side * (c.beam / 2 + 120), y: -330, opts: { r: 58, huts: true, palms: 3 } }),
      spawn({ id: 'k1', kind: 'rowboat', x: side * (c.beam / 2 + 70), y: -300, opts: { npcs: ['villager', 'villager'], dir: 'down', cargo: ['GOOD_TIMBER'] } }),
      spawn({ id: 'k2', kind: 'rowboat', x: side * (c.beam / 2 + 100), y: -340, opts: { npcs: ['villagerF'], dir: 'down' } }),
    ],
    approach: (c) => [par(move('enc', { y: -40 }, 4.5), move('k1', { y: -20 }, 4.5, { wait: false }), move('k2', { y: -60 }, 4.5, { wait: false }), slow(4), cam({ x: side * 80, y: -30 }, 0.3)), par(stop(), react('fortune', side)), par(move('k1', { x: besides(c, 18), y: -20 }, 2), move('k2', { x: besides(c, 20), y: 30 }, 2, { wait: false }))],
    intro: () => [say('k1', 'Geminiz yaralı! Yardım edelim mi?', 2.6, 1)],
    opts: [
      () => [S('coins', { from: 'ship', to: 'k1', n: 8 }), ...repairCrew(side)],
      (c, info) => (info.success ? [cap('Karşılığında verecek çok şeyimiz yok…', 2.4, 0.6), say('k1', 'Deniz bize de cömert değildi. Ama yardım ederiz!', 2.6, 0.6), ...repairCrew(side)] : [cap('Karşılığında verecek çok şeyimiz yok…', 2.4, 0.6), say('k1', 'Kusura bakma kaptan, bizim de zor günlerimiz…', 2.8, 0.8)]),
      () => [cap('Sağ olun, yolumuza devam edeceğiz.', 2.4, 0.6), say('k2', 'Rüzgârınız bol olsun!', 2, 0.4)],
    ],
    skip: () => ['hull'],
    outcome: (c, info) => (info.hullDelta > 0 ? [par(fx('spark', 'ship', 24), sfx('repair'))] : []),
    exit: (c) => [offAll(rail(side)), T(0.6), par(move('k1', { x: side * (c.beam / 2 + 80), y: -40 }, 2.4), move('k2', { x: side * (c.beam / 2 + 90) }, 2.4, { wait: false })), ...driftAll()],
  })),

  // ───────── ESKİ TERSANE ADASI (tamir) ─────────
  EVT_REPAIR_03: def((ev, side) => ({
    weather: () => [weather({ dark: 0.05 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'island', x: side * (c.beam / 2 + 110), y: -330, opts: { r: 60, shipyard: true, palms: 2, ground: '#6a7a52' } })],
    approach: (c) => [par(move('enc', { y: -30 }, 4.5), slow(5), cam({ x: side * 80, y: -30 }, 0.3)), par(stop(), react('fortune', side), lookout('Terk edilmiş bir tersane! Kızaklarda kereste var.', { dur: 2.6 }))],
    intro: () => [crewSay(['CREW_GROOT'], 'O keresteler bize lazım.', { dur: 2.2 })],
    opts: [
      (c) => [...yardTrip(c, side, ['GOOD_TIMBER', 'GOOD_TIMBER']), ...repairCrew(side, true)],
      (c) => [gather(rail(side), 'Kıyıdaki kalasları alıyor', { n: 2, run: true, dur: 3 }), spawn({ id: 'pl', kind: 'timber', x: besides(c, 30), y: -10, opts: { n: 3 } }), S('pickup', { id: 'pl', prefer: ['CREW_GROOT'], task: 'Kalasları çekiyor' }), work(['CREW_GROOT'], rail(side), 'Yamıyor', 3, 0.8)],
      (c) => [deckProp('map', 'mapTable', 'center'), par(work(['CREW_COMPASS'], 'center', 'Tersanenin eski planını hatırlıyor', 4, 1.2), only('CREW_COMPASS', 'Zift ambarı kuzey kızağın altında!', { dur: 2.4 })), remove('map'), ...yardTrip(c, side, ['GOOD_TIMBER', 'GOOD_TIMBER']), ...repairCrew(side, true)],
    ],
    skip: () => ['hull'],
    outcome: (c, info) => (info.hullDelta > 0 ? [par(fx('spark', 'ship', 24), sfx('repair'))] : []),
    exit: () => [remove('boat'), ...driftAll(), T(1)],
  })),
};

function wave(c, shakeAmt) {
  return [
    move('enc', { y: c.len / 2 + 220 }, 2.6, { ease: 'linear' }),
    par(fx('splash', 'ship', 60), S('shake', { amount: shakeAmt }), sfx('splash'), S('heel', { rot: 0.06 })),
    T(0.5), S('heel', { rot: 0 }),
  ];
}

function repairCrew(side, own = false) {
  return own
    ? [par(work(['CREW_GROOT', 'CREW_LENA'], rail(side), 'Gövdeyi yamıyor', 4), work([], rail(-side), 'Çivi çakıyor', 4)), par(sfx('repair'), fx('spark', { rail: side }, 16)), T(1.2)]
    : [
      board('v1', 'villager', rail(side), rail(side), { dy: -24, endState: 'work', carry: 'GOOD_TIMBER', say: 'Reçine ve kalas!' }),
      board('v2', 'villagerF', rail(side), rail(-side), { endState: 'work', wait: false }),
      par(S('npcState', { id: 'v1', carry: null }), sfx('repair'), fx('spark', { rail: side }, 16)), T(0.8), par(sfx('repair'), fx('spark', { rail: -side }, 16)), T(0.8),
    ];
}

function yardTrip(c, side, cargo) {
  return [
    gather(rail(side), 'Sandalı indiriyor', { n: 2, run: true, dur: 3 }),
    spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16), y: 0, opts: { npcs: ['sailor', 'sailor'], dir: side < 0 ? 'left' : 'right' } }),
    move('boat', { x: side * (c.beam / 2 + 76), y: -26 }, 2.4),
    par(sfx('repair'), fx('splinter', 'enc', 10)), T(1),
    S('opts', { id: 'boat', opts: { npcs: ['sailor', 'sailor'], cargo, dir: side < 0 ? 'right' : 'left' } }),
    move('boat', { x: besides(c, 16), y: 0 }, 2.2),
    remove('boat'),
  ];
}
