// GİZEM eventleri — imza sahneleri.
import {
  S, par, wait, def, rail, shipEntity, alongside, besides, cap, crewSay, only, lookout, say, slow, stop, go, cam,
  react, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, weather, call, driftAll, offAll, oi, landing, dive,
} from '../kit.js';

const T = (n) => wait(n);
const sky = (o = {}) => ({ x: 0, y: 0, screen: true, layer: 3, ...o });

export const MYSTERY_SCENES = {
  // ───────── DENİZDEKİ IŞIK ─────────
  EVT_M_02: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: (c) => [spawn({ id: 'enc', kind: 'lightOrb', x: besides(c, 34), y: -240, alpha: 0.7 }), spawn({ id: 'pulse', kind: 'glowRing', x: besides(c, 34), y: -240, opts: { col: '#7affc8' } })],
    approach: (c) => [
      par(move('enc', { y: 0 }, 4.5), move('pulse', { y: 0 }, 4.5, { wait: false }), slow(4), cam({ x: side * 40, y: 0 }, 0.3)),
      par(stop(), react('fortune', side), sfx('magic'), lookout('Derinlerde yeşil bir ışık… yanıp sönüyor.', { dur: 2.6 })),
    ],
    intro: () => [gather(rail(side), 'Işığa bakıyor', { n: 3, dur: 8 }), crewSay([], 'Sanki bizi çağırıyor…', { dur: 2.4 })],
    opts: [
      (c) => [
        par(work(['CREW_MIRA'], rail(side), 'Işığa dalıyor', 3, 1), only('CREW_MIRA', 'Nefesimi tutarım. Bekleyin.', { dur: 2.2 })),
        par(fx('splash', { rail: side }, 22), sfx('splash'), spawn({ id: 'bub', kind: 'bubbles', x: besides(c, 34), y: 0, opts: { n: 20, w: 14, h: 40 } })),
        T(2.2), par(move('enc', { alpha: 0.2 }, 1.2), fx('splash', { x: besides(c, 20), y: 0 }, 20), sfx('splash')),
        S('icon', { icon: 'amulet', from: 'enc', to: 'ship' }), only('CREW_MIRA', 'Avucumda parlıyor!', { dur: 2 }),
      ],
      (c, info) => [
        par(work(['CAPTAIN'], rail(side), 'Suya dalmaya hazırlanıyor', 3, 1), cap('Ben dalıyorum. Halatı sıkı tutun.', 2.4)),
        par(fx('splash', { rail: side }, 26), sfx('splash'), spawn({ id: 'bub', kind: 'bubbles', x: besides(c, 34), y: 0, opts: { n: 22, w: 16, h: 40 } })),
        T(2),
        ...(info.success
          ? [spawn({ id: 'box', kind: 'chest', x: besides(c, 34), y: 4 }), S('pickup', { id: 'box', prefer: ['CREW_GROOT', 'CREW_BJORN'], task: 'Sandığı ve kaptanı çekiyor' })]
          : [par(fx('splash', { x: besides(c, 34), y: 0 }, 50), S('shake', { amount: 8 }), sfx('roar'), crewSay([], 'Kaptanı bir şey çekiyor! Halata!', { dur: 2.2 })), gather(rail(side), 'Halatı çekiyor', { n: 4, run: true, dur: 3, hold: 1.6 })]),
      ],
      () => [gather(rail(side), 'Işığı saatlerce izliyor', { n: 4, dur: 6 }), par(move('enc', { alpha: 0 }, 4), move('pulse', { alpha: 0 }, 4, { wait: false })), work(['CAPTAIN'], 'helm', 'Seyir defterine not alıyor', 3, 0.6)],
    ],
    exit: () => [remove('bub'), remove('box'), ...driftAll(), weather({ restore: true }), T(0.8)],
  })),

  // ───────── ŞİŞEDE MESAJ ─────────
  EVT_M_03: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'bottle', x: besides(c, 24), y: -260 })],
    approach: (c) => [par(move('enc', { y: -10 }, 4.5), slow(6), cam({ x: side * 30, y: -10 }, 0.25)), par(slow(1), react('fortune', side), lookout('Mantar tıpalı bir şişe!', { dur: 2 }))],
    intro: () => [S('pickup', { id: 'enc', prefer: ['CREW_NAKAMURA', 'CREW_MIRA'], task: 'Şişeyi yakalıyor' }), deckProp('note', 'mapScroll', 'center')],
    opts: [() => [par(work(['CAPTAIN'], 'center', 'Mektubu okuyor', 4, 1.2), sfx('page'), gather('center', 'Merakla dinliyor', { n: 3 })), cap('"Bunu bulan kişi…"', 2.6, 1.2), remove('note')]],
    from: () => null,
    exit: () => [remove('note'), go(30), T(0.6)],
  })),

  // ───────── SİSTE SES ─────────
  EVT_M_04: def((ev, side) => ({
    weather: () => [weather({ fog: 1, dark: 0.08 })],
    setup: (c) => [spawn({ id: 'voice', kind: 'fog', x: side * 90, y: -160, layer: 1, alpha: 0.9, opts: { r: 50, a: 0.3 } })],
    approach: () => [
      par(slow(5), cam({ x: side * 40, y: -80 }, 0.3)),
      say('voice', '…Kaptan…', 2.4, 1.4), say('voice', '…Kaptaaan…', 2.4, 1),
      par(react('danger', side), crewSay([], 'Bu ses… adını biliyor!', { dur: 2.2 })),
    ],
    intro: () => [T(0.4)],
    opts: [
      (c, info) => [
        par(S('speed', { v: 6 }), S('shipTo', { x: side * 26 }), cap('Sese doğru. Yavaş.', 2, 0.6)),
        ...(info.success
          ? [spawn({ id: 'enc', kind: 'rowboat', x: side * 120, y: -150, alpha: 0, opts: { npcs: ['merchant', 'sailor'], dir: 'down' } }), par(move('enc', { alpha: 1, y: -30, x: besides(c, 20) }, 3)), say('enc', 'Kurtuldum! Sisin içinde günlerdir kayıptım!', 2.8, 1)]
          : [par(weather({ dark: 0.25, fog: 1 }), move('voice', { alpha: 0 }, 2)), par(react('danger', side), crewSay([], 'Ses kayboldu… burası neresi?', { dur: 2.4 }))]),
      ],
      () => [cap('Kimse kıpırdamasın. Bekleyeceğiz.', 2.4, 1.2), par(move('voice', { alpha: 0 }, 3), weather({ fog: 0.4 })), T(1)],
      () => [
        par(deckProp('amu', 'glowRing', 'center', { opts: { col: '#7ac8ff' } }), sfx('magic'), weather({ fog: 0.35 })),
        say('voice', 'Buraya… hazine…', 2.4, 1),
        par(spawn({ id: 'glint', kind: 'sparkles', x: side * 90, y: -140, opts: { r: 20, col: '#f2c14e' } }), move('voice', { alpha: 0 }, 2)),
      ],
    ],
    from: (info) => (oi(info) === 0 ? 'enc' : 'glint'),
    exit: () => [remove('amu'), remove('voice'), remove('glint'), ...driftAll(), weather({ restore: true }), T(0.6)],
  })),

  // ───────── UÇAN BALIKLAR ─────────
  EVT_M_05: def((ev, side) => ({
    mainId: null,
    setup: () => [spawn({ id: 'ff', kind: 'flyingFish', x: 0, y: -40, layer: 2, alpha: 0 })],
    approach: () => [
      par(slow(16), move('ff', { alpha: 1 }, 1), sfx('splash')),
      par(react('fortune', side), lookout('Balıklar uçuyor! Yelkenlerin üstünden!', { dur: 2.4 })),
      ...[0, 1, 2].map((i) => [S('throw', { from: { x: -side * 90, y: -20 + i * 20 }, to: { rail: 0, dy: -20 + i * 18 }, kind: 'ball', arc: 40, dur: 0.7, burst: 'splash', n: 4 }), T(0.4)]),
      par(deckProp('fishD', 'fishPile', 'center', { opts: { n: 5 } }), crewSay([], 'Hahaha! Biri kafama düştü!', { dur: 2.2 }), pet('PET_ZIPIR', { at: 'center', pose: 'sit', dur: 5, run: false })),
    ],
    intro: () => [T(0.4)],
    opts: [() => [par(work(['CAPTAIN', 'CREW_COMPASS'], 'helm', 'Codex\'e çiziyor', 4, 1.2), sfx('page')), cap('Bunu kimse inanmaz… çizmeliyim.', 2.4, 0.8), S('icon', { icon: 'book', from: 'ship', to: { x: 0, y: -60 } })]],
    exit: () => [move('ff', { alpha: 0 }, 1), remove('fishD'), go(30), remove('ff')],
  })),

  // ───────── TERK EDİLMİŞ ADA ─────────
  EVT_M_06: def((ev, side) => ({
    weather: () => [weather({ dark: 0.06 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'island', x: side * (c.beam / 2 + 110), y: -340, opts: { r: 60, ruins: true, huts: true, palms: 4, ground: '#5a7a48' } }), spawn({ id: 'smk', kind: 'smoke', x: side * (c.beam / 2 + 100), y: -350, opts: { n: 8, h: 40 } })],
    approach: (c) => [
      par(move('enc', { y: -40 }, 4.5), move('smk', { y: -50 }, 4.5, { wait: false }), slow(6), cam({ x: side * 90, y: -40 }, 0.3)),
      par(stop(), react('fortune', side), lookout('Yıkık kulübeler… ama ocaklardan duman tütüyor.', { dur: 2.8 })),
    ],
    intro: () => [cap('Küller hâlâ sıcak. Birileri vardı… ya da hâlâ var.', 2.8, 0.8)],
    opts: [
      (c, info) => landing(c, side, ['sailor', 'sailor'], info.success
        ? [S('opts', { id: 'enc', opts: { r: 60, ruins: true, huts: true, palms: 4, ground: '#5a7a48' } }), fx('gold', 'enc', 16), T(0.8)]
        : [spawn({ id: 'b1', kind: 'npc', npc: 'pirate', x: side * (c.beam / 2 + 96), y: -60 }), spawn({ id: 'b2', kind: 'npc', npc: 'pirate', x: side * (c.beam / 2 + 120), y: -30 }), say('b1', 'Yağma bizim!', 2, 0.6), par(fx('spark', { x: side * (c.beam / 2 + 100), y: -40 }, 30), sfx('impact'), S('shake', { amount: 5 })), T(0.6)]),
      (c) => landing(c, side, ['sailor', 'sailor'], [S('set', { id: 'enc', props: { kind: 'treasureIsle', opts: { r: 60, dug: true, chest: true } } }), par(fx('gold', 'enc', 30), sfx('chest')), T(1)], [deckProp('map', 'mapTable', 'center'), work(['CAPTAIN'], 'center', 'Antik haritaya bakıyor', 3, 1), cap('Çarpı işareti adanın tam ortasında!', 2.4, 0.6), remove('map')]),
      (c) => landing(c, side, ['cartographer', 'sailor'], [S('set', { id: 'enc', props: { kind: 'cave', opts: { r: 56, glint: true } } }), par(fx('gold', 'enc', 24), sfx('chest')), T(1)], [deckProp('map', 'mapTable', 'center'), par(work(['CREW_COMPASS'], 'center', 'Adanın haritasını çıkarıyor', 4, 1.4), only('CREW_COMPASS', 'Kayaların arasında bir mağara… zula orada!', { dur: 2.6 })), remove('map')]),
      () => [cap('Adanın sırrı adada kalsın.', 2.2, 0.6), ...driftAll()],
    ],
    from: () => 'enc',
    exit: () => [remove('boat'), remove('b1'), remove('b2'), ...driftAll(), T(1)],
  })),

  // ───────── ESKİ DENİZCİ ─────────
  EVT_M_07: def((ev, side) => ({
    weather: () => [weather({ dark: 0.1 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 26), y: -260, opts: { npcs: ['oldSailor'], dir: 'up' } }), spawn({ id: 'pipe', kind: 'smoke', x: besides(c, 26), y: -266, layer: 1, opts: { n: 6, h: 20, drift: 6 } })],
    approach: (c) => [par(move('enc', { y: -4 }, 4.2), move('pipe', { y: -10 }, 4.2, { wait: false }), slow(4), cam({ x: side * 40, y: -10 }, 0.25)), par(stop(), react('fortune', side))],
    intro: () => [say('enc', 'Bu sularda her şeyi gördüm, evlat.', 2.6, 0.6), board('old', 'oldSailor', rail(side), 'center', { face: 'up', endState: 'sit', say: 'Bir yudum rom varsa, anlatacak çok şeyim var.' })],
    opts: [
      (c) => [S('say', { actor: 'old', text: 'Tanıdığım iyi bir denizci var. Hey, Tomas!', dur: 2.6, hold: 0.6 }), sfx('whistle'), spawn({ id: 'b2', kind: 'rowboat', x: besides(c, 30), y: 200, opts: { npcs: ['sailor'], dir: 'up' } }), move('b2', { y: 30 }, 2.6)],
      () => [par(work(['CAPTAIN'], 'center', 'Yaşlı denizciyi dinliyor', 5), deckProp('tale', 'sparkles', 'center', { opts: { r: 20, col: '#c8a0ff' } }), sfx('magic')), S('say', { actor: 'old', text: 'Önce fırtına… sonra bir tüccar… sonra ışıklar.', dur: 3, hold: 1.4 })],
      () => [par(weather({ night: true }), deckProp('lamp', 'lantern', 'center', { dx: 8 }), gather('center', 'Hikâye dinliyor', { n: 4, dur: 8 })), S('say', { actor: 'old', text: 'Ve o gece, deniz ikiye yarıldı…', dur: 3, hold: 1.4 }), sfx('drum')],
    ],
    from: () => 'enc',
    exit: (c) => [remove('tale'), remove('lamp'), unboard('old', rail(side)), par(move('enc', { y: 260 }, 3), move('pipe', { y: 254 }, 3, { wait: false }), move('b2', { y: 300 }, 3, { wait: false })), weather({ restore: true }), go(30)],
  })),

  // ───────── RENK DEĞİŞTİREN DENİZ ─────────
  EVT_M_08: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'eerie' })],
    setup: () => [spawn({ id: 'glow', kind: 'glowPatch', x: 0, y: -60, alpha: 0, opts: { n: 12, w: 340, h: 300 } }), spawn({ id: 'runes', kind: 'sparkles', x: 0, y: -40, alpha: 0, opts: { r: 140, n: 40, col: '#c8a0ff' } })],
    approach: () => [par(slow(5), move('glow', { alpha: 1 }, 3), cam({ x: 0, y: -40 }, 0.25), sfx('magic')), par(move('runes', { alpha: 1 }, 2), react('fortune', side), crewSay([], 'Deniz… mor oldu. Şimdi altın!', { dur: 2.4 }))],
    intro: () => [crewSay(['CREW_MAGDA', 'CREW_KALANI'], 'Suyun üstünde semboller beliriyor…', { dur: 2.6 })],
    opts: [
      () => [par(deckProp('amu', 'glowRing', 'center', { opts: { col: '#c8a0ff' } }), sfx('magic')), cap('Muska ısınıyor… sembolleri okuyabiliyorum!', 2.6, 0.8), par(fx('gold', { x: 0, y: -60 }, 30), sfx('coin'))],
      () => [par(work(['CREW_MAGDA'], 'bow', 'Sembolleri yorumluyor', 5, 1), only('CREW_MAGDA', 'Deniz konuşuyor… önümüzü gösteriyor.', { dur: 2.8 })), par(spawn({ id: 'vision', kind: 'sparkles', x: 0, y: -120, layer: 2, opts: { r: 50, n: 30, col: '#e8d0ff' } }), sfx('magic')), T(1)],
      (c, info) => [
        par(work(['CAPTAIN'], rail(side), 'Suya dokunuyor', 4, 1.4), cap('Bakalım…', 1.6, 1)),
        info.success ? par(fx('spark', { rail: side }, 30), sfx('magic'), cap('Ellerim parlıyor!', 2, 0.6)) : par(fx('fire', { rail: side }, 20), sfx('damage'), cap('Ah! Yakıyor!', 2, 0.4), S('heel', { rot: side * 0.12 }), S('shipTo', { x: side * 30 })),
      ],
      () => [go(20), crewSay([], 'Sessizce geçelim…', { dur: 2 }), T(1.4)],
    ],
    from: () => null,
    exit: () => [par(move('glow', { alpha: 0 }, 2), move('runes', { alpha: 0 }, 2)), remove('amu'), remove('vision'), weather({ restore: true }), remove('glow'), remove('runes')],
  })),

  // ───────── KUZEY IŞIKLARI ─────────
  EVT_M_09: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'ice', fx: ['snow'], night: true })],
    setup: () => [spawn(sky({ id: 'aur', kind: 'aurora', y: 20, alpha: 0 })), spawn(sky({ id: 'stars', kind: 'stars', alpha: 0, opts: { n: 60, H: 200 } })), spawn({ id: 'floes', kind: 'iceFloes', x: 0, y: -260, opts: { n: 10, w: 420, h: 200 } })],
    approach: () => [par(slow(8), move('floes', { y: 40 }, 6, { wait: false }), move('stars', { alpha: 1 }, 2)), par(move('aur', { alpha: 1 }, 4), react('fortune', side), lookout('Gökyüzü… dans ediyor.', { dur: 2.6 })), gather('bow', 'Işıkları izliyor', { n: 4, dur: 10, hold: 1 })],
    intro: () => [crewSay([], '…', { dur: 2 })],
    opts: [
      () => [par(cap('Bu geceyi kimse unutmayacak.', 2.6, 1.6), sfx('magic')), T(2), fx('spark', 'ship', 20)],
      () => [
        par(work(['CREW_KALANI'], 'bow', 'Atalarına şarkı söylüyor', 6, 1), only('CREW_KALANI', '♪ Atalarım, ışığınızla yolu gösterin ♪', { dur: 3 })),
        par(S('set', { id: 'aur', props: { alpha: 1, scale: 1 } }), spawn({ id: 'gift', kind: 'sparkles', x: 0, y: -60, layer: 2, opts: { r: 40, n: 40, col: '#7affc8' } }), sfx('magic')),
        S('icon', { icon: 'gift', from: { x: 0, y: -160 }, to: 'ship' }),
      ],
    ],
    from: () => null,
    exit: () => [par(move('aur', { alpha: 0 }, 2), move('stars', { alpha: 0 }, 2)), remove('gift'), weather({ restore: true }), ...driftAll(), remove('aur'), remove('stars')],
  })),

  // ───────── BATIK ŞEHİR ─────────
  EVT_M_10: def((ev, side) => ({
    weather: () => [weather({ preset: 'tropical', fx: [] })],
    setup: () => [spawn({ id: 'enc', kind: 'sunkenCity', x: 0, y: -330, opts: { w: 300, a: 0.4 } })],
    approach: (c) => [par(move('enc', { y: 0 }, 5), slow(5), cam({ x: 0, y: -20 }, 0.25)), par(stop(), react('fortune', side), lookout('Aşağı bakın! Bütün bir şehir!', { dur: 2.4 })), gather(rail(side), 'Batık şehre bakıyor', { n: 3, dur: 8 })],
    intro: () => [crewSay([], 'Sütunlar… kubbeler… sokaklarında balıklar yüzüyor.', { dur: 2.8 })],
    opts: [
      (c) => dive(c, side, ['CREW_MIRA'], 'Tapınağın hazine odasına dalıyor', [S('icon', { icon: 'gift', from: { x: 0, y: -40 }, to: 'ship' }), only('CREW_MIRA', 'Tapınağın kalbinden!', { dur: 2 })]),
      (c, info) => dive(c, side, ['CAPTAIN'], 'Dalıyor', info.success ? [S('icon', { icon: 'gift', from: { x: 0, y: -40 }, to: 'ship' })] : [par(fx('splash', { x: 0, y: -40 }, 50), S('shake', { amount: 8 }), sfx('roar')), par(S('shipTo', { x: -side * 40 }), S('heel', { rot: -side * 0.1 }), crewSay([], 'Akıntı bizi sürüklüyor!', { dur: 2.2 }))]),
      (c) => [deckProp('map', 'mapTable', 'center'), work(['CAPTAIN'], 'center', 'Haritayı şehre çeviriyor', 3, 1), cap('İşaret… tam şu kubbenin altında!', 2.4, 0.4), remove('map'), ...dive(c, side, ['CREW_MIRA', 'CREW_NAKAMURA'], 'Hazineye dalıyor', [par(fx('gold', { x: 0, y: -30 }, 30), sfx('chest'))])],
      () => [par(work(['CAPTAIN', 'CREW_COMPASS'], rail(side), 'Şehri çiziyor', 5, 1.4), sfx('page')), cap('Sokaklarını tek tek çiziyorum…', 2.4, 0.6), S('icon', { icon: 'book', from: { x: 0, y: -20 }, to: 'ship' })],
    ],
    from: () => null,
    exit: () => [weather({ restore: true }), ...driftAll(), T(1)],
  })),

  // ───────── YANKILANAN ÇAN ─────────
  EVT_M_11: def((ev, side) => ({
    weather: () => [weather({ fog: 1, preset: 'dark' })],
    setup: (c) => [spawn({ id: 'enc', kind: 'bell', x: side * 120, y: -300, alpha: 0.5 })],
    approach: () => [par(slow(5), sfx('bell'), cam({ x: side * 50, y: -100 }, 0.3)), T(1.4), par(react('danger', side), sfx('bell'), crewSay([], 'Çan… ama ne şamandıra var ne gemi.', { dur: 2.6 }))],
    intro: () => [sfx('bell'), T(0.6)],
    opts: [
      (c) => [par(work(['CAPTAIN'], 'helm', 'Dümeni çan sesine çeviriyor', 4), cap('Sesi takip edin.', 2, 0.6)), par(S('heel', { rot: side * 0.12 }), S('shipTo', { x: side * 40 }), move('enc', { y: -120, alpha: 1 }, 3), sfx('bell')), S('heel', { rot: 0 })],
      () => [par(go(30), cap('Uzaklaşın buradan.', 2, 0.6), move('enc', { y: -380, alpha: 0 }, 4)), sfx('bell')],
    ],
    from: () => null,
    exit: () => [...driftAll(), T(1)],
  })),

  // ───────── YILDIZ HARİTASI ─────────
  EVT_M_12: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ night: true, preset: 'dark', fx: [] })],
    setup: () => [spawn(sky({ id: 'stars', kind: 'stars', alpha: 0, opts: { n: 110, H: 360 } })), spawn({ id: 'moon', kind: 'moon', x: 80, y: -20 })],
    approach: () => [par(slow(10), move('stars', { alpha: 1 }, 3)), par(react('fortune', side), lookout('Yıldızlar o kadar parlak ki… sanki bir harita.', { dur: 2.6 }))],
    intro: () => [T(0.4)],
    opts: [
      () => [par(work(['CAPTAIN'], 'helm', 'Sekstantla yıldızları okuyor', 5, 1.2), cap('Kutup yıldızı… şuradan bir çizgi…', 2.6, 0.6)), par(spawn(sky({ id: 'cons', kind: 'stars', x: 260, y: 60, opts: { n: 0, lines: [[0, 0], [30, 14], [62, 6], [90, 30], [120, 22]] } })), sfx('magic')), cap('Kısa bir yol var!', 2, 0.8)],
      () => [par(deckProp('map', 'mapTable', 'center'), work(['CREW_COMPASS'], 'center', 'Yıldızları haritaya döküyor', 5, 1.4)), only('CREW_COMPASS', 'Şu takımyıldız bize en kısa rotayı söylüyor.', { dur: 2.8 }), par(spawn(sky({ id: 'cons', kind: 'stars', x: 220, y: 50, opts: { n: 0, lines: [[0, 0], [30, 14], [62, 6], [90, 30], [120, 22], [150, 40]] } })), sfx('magic')), remove('map')],
    ],
    exit: () => [par(move('stars', { alpha: 0 }, 1.5), move('cons', { alpha: 0 }, 1.5)), weather({ restore: true }), remove('moon'), remove('stars'), remove('cons'), go(30)],
  })),
};
