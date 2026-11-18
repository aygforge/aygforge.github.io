// TEHLİKE eventleri — imza sahneleri.
import {
  S, par, wait, def, rail, has, shipEntity, alongside, besides, cap, crewSay, only, lookout, say, slow, stop, go, cam, camReset,
  react, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, weather, call, drift, driftAll, offAll,
} from '../kit.js';

const T = (n) => wait(n);

export const DANGER_SCENES = {
  // ───────── SİS TUZAĞI ─────────
  EVT_D_03: def((ev, side) => ({
    weather: () => [weather({ fog: 1, dark: 0.1 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'rocks', x: side * 46, y: -330, alpha: 0.15 }), spawn({ id: 'fogA', kind: 'fog', x: 0, y: -120, layer: 1, opts: { r: 140, a: 0.3 } })],
    approach: (c) => [
      par(slow(8), move('enc', { y: -c.len / 2 - 80, alpha: 0.45 }, 4.5), cam({ x: side * 30, y: -120 }, 0.3)),
      par(react('danger', side), sfx('splash'), lookout('Kayalara çarpan dalga sesi… ama nereden?', { dur: 3 })),
    ],
    intro: () => [cap('Herkes sussun. Dinleyin…', 2.4, 1)],
    auto: (c) => [
      par(work(['CREW_TOBIAS'], 'bow', 'Feneriyle sisin içini gösteriyor', 6, 1.2), deckProp('lamp', 'lantern', 'bow', { dy: -6 })),
      par(only('CREW_TOBIAS', 'Sancakta kaya! İskelede bir tane daha!', { dur: 3 }), spawn({ id: 'glow', kind: 'glowRing', x: side * 46, y: -c.len / 2 - 80, opts: { col: '#ffd060' } }), move('enc', { alpha: 1 }, 1)),
      par(S('shipTo', { x: -side * 26 }), move('enc', { y: c.len / 2 + 160 }, 5, { ease: 'linear' }), remove('glow')),
      cap('Sağ ol Tobias. Fenerin altın değerinde.', 2.4, 0.6),
    ],
    opts: [
      (c, info) => [ // Yavaşla
        par(work(['CREW_FINN', 'CREW_COMPASS', 'CREW_NAKAMURA'], 'bow', 'İskandil atıyor', 6), S('speed', { v: 4 })),
        crewSay(['CREW_FINN', 'CREW_COMPASS', 'CREW_NAKAMURA'], 'İskandil! Beş kulaç… dört… dört buçuk…', { dur: 3, hold: 1.2 }),
        par(S('shipTo', { x: -side * (info.success ? 26 : 8) }), move('enc', { y: info.success ? c.len / 2 + 160 : 0, alpha: 0.8 }, info.success ? 5 : 3.2, { ease: 'linear' })),
        info.success ? cap('Temiz geçtik. Nefes alın.', 2.2) : par(S('heel', { rot: side * 0.05 }), sfx('creak'), fx('splinter', { rail: side, dy: -10 }, 18)),
      ],
      (c) => [ // Işık yak (fişek)
        work([], 'bow', 'Sinyal fişeğini ateşliyor', 3, 0.8),
        par(S('throw', { from: { rail: 0, dy: -c.len / 2 + 10 }, to: 'enc', kind: 'flare', arc: 70, dur: 1.4, burst: 'spark', n: 26 }), sfx('cannon')),
        par(spawn({ id: 'glow', kind: 'glowRing', x: side * 46, y: -c.len / 2 - 80, opts: { col: '#ff6040' } }), move('enc', { alpha: 1 }, 0.8), weather({ fog: 0.45 })),
        cap('İşte orada! Dümen iskeleye!', 2.2, 0.4),
        par(S('shipTo', { x: -side * 28 }), move('enc', { y: c.len / 2 + 160 }, 4.5, { ease: 'linear' })),
      ],
      (c, info) => [ // Hızlan
        par(go(70), sfx('depart'), cap('Tüm yelkenler! Sisi yararak geçiyoruz!', 2.4, 0.4)),
        info.success
          ? par(move('enc', { y: c.len / 2 + 200, x: side * 90 }, 1.8, { ease: 'linear' }), weather({ fog: 0.2 }))
          : par(S('shipTo', { x: side * 24 }), S('heel', { rot: side * 0.08 }), move('enc', { y: 10 }, 1.6, { ease: 'linear' }), sfx('creak')),
      ],
    ],
    outcome: (c, info) => (info.success ? [] : [fx('splash', { rail: side }, 30)]),
    exit: (c) => [weather({ restore: true }), remove('lamp'), ...driftAll(), remove('fogA'), T(1.2)],
  })),

  // ───────── KAYALIK GEÇİT ─────────
  EVT_D_04: def((ev, side) => ({
    setup: (c) => [
      spawn({ id: 'enc', kind: 'rocks', x: -(c.beam / 2 + 60), y: -340 }),
      spawn({ id: 'rockR', kind: 'rocks', x: c.beam / 2 + 60, y: -380 }),
      spawn({ id: 'cur', kind: 'spray', x: side * 40, y: -300, opts: { w: 160, h: 60, n: 40 } }),
    ],
    approach: (c) => [
      par(slow(10), move('enc', { y: -40 }, 4.5), move('rockR', { y: -80 }, 4.5, { wait: false }), move('cur', { y: -20 }, 4.5, { wait: false }), cam({ x: 0, y: -80 }, 0.3)),
      par(react('danger', side), S('heel', { rot: side * 0.05 }), S('shipTo', { x: side * 14 }), lookout('Akıntı bizi kayalara çekiyor!', { dur: 2.6 })),
    ],
    intro: () => [cap('Dar bir boğaz… dikkat edin.', 2.2, 0.8)],
    opts: [
      (c, info) => [ // Dikkatli geç
        par(work(['CAPTAIN'], 'helm', 'Dümeni sıkı tutuyor', 7), cap('Dümen iskeleye… şimdi sancağa!', 2.6, 0.8)),
        par(S('shipTo', { x: -side * 10 }), S('heel', { rot: -side * 0.03 }), move('enc', { y: 60 }, 2.2, { ease: 'linear' }), move('rockR', { y: 20 }, 2.2, { wait: false, ease: 'linear' })),
        par(S('shipTo', { x: side * (info.success ? 4 : 18) }), S('heel', { rot: 0 }), move('enc', { y: c.len / 2 + 180 }, 3, { ease: 'linear' }), move('rockR', { y: c.len / 2 + 140 }, 3, { wait: false, ease: 'linear' })),
      ],
      (c, info) => [ // Hızlı geç
        par(go(80), sfx('depart'), cap('Yelkenleri açın! Akıntıyı arkamıza alıyoruz!', 2.4, 0.4)),
        par(S('shipTo', { x: info.success ? 0 : side * 30 }), S('heel', { rot: info.success ? 0 : side * 0.1 }), move('enc', { y: c.len / 2 + 220 }, 1.6, { ease: 'linear' }), move('rockR', { y: c.len / 2 + 180 }, 1.6, { wait: false, ease: 'linear' }), move('cur', { y: 300 }, 1.6, { wait: false })),
        info.success ? lookout('Ok gibi çıktık! Ha ha!', { dur: 2 }) : par(sfx('creak'), fx('splinter', { rail: side }, 24), S('shake', { amount: 10 })),
      ],
      (c) => [ // Geri dön
        par(cap('Dümeni kırın! Uzun yoldan dolanacağız.', 2.4, 0.6), S('heel', { rot: -side * 0.18 }), S('speed', { v: 6 })),
        par(move('enc', { y: -380, x: -(c.beam / 2 + 130) }, 3.5), move('rockR', { y: -420, x: c.beam / 2 + 130 }, 3.5, { wait: false }), move('cur', { y: -400 }, 3.5, { wait: false })),
        S('heel', { rot: 0 }),
      ],
    ],
    exit: () => [...driftAll(), T(1)],
  })),

  // ───────── ASKERÎ DENETİM ─────────
  EVT_D_05: def((ev, side) => ({
    thieves: true, thiefNpc: 'soldier', plank: true,
    setup: (c) => [shipEntity(c, 'enc', 'warship', 3, { scale: 0.92 })],
    approach: (c) => [
      par(move('enc', { x: side * 150, y: -180 }, 2.6), cam({ x: side * 90, y: -90 }, 0.3), S('sound', { name: 'horn' })),
      par(react('danger', side), lookout('Kraliyet bayrağı! Savaş gemisi yanaşıyor.', { dur: 2.6 }), slow(4)),
      move('enc', { x: side * 190, y: -20, rot: 0, sails: 'furled' }, 2.2),
      par(move('enc', { x: alongside(c, 0.92, 3, 4), y: -6 }, 1.6), S('speed', { v: 0 })),
      call((d) => { const e = d.world.get('enc'); const L = d.world.layout(); if (e) e.hooks = [{ x0: e.x - side * 16, y0: e.y - 10, x1: d.world.ship.x + side * (L.beam / 2 - 6), y1: d.world.ship.y - 10, plank: true }]; d.hooks.sfx?.('creak'); }),
      board('officer', 'officer', rail(side), 'cargo', { say: 'Kraliyet denetimi! Ambarı açın.', face: 'down' }),
      board('soldier1', 'soldier', rail(side), rail(side), { dy: 16, wait: false, endState: 'idle' }),
    ],
    intro: () => [say('enc', 'Kaçak mal bulunursa el konacak!', 2.6, 0.8)],
    auto: (c) => [
      pet('PET_CUCE', { at: 'cargo', pose: 'hold', dur: 3 }), T(1),
      par(S('say', { actor: 'officer', text: 'Şapkam! Seni küçük…!', dur: 2.4 }), sfx('squawk')),
      par(pet('PET_CUCE', { at: 'mast', pose: 'climb', dur: 6 }), S('npcState', { id: 'officer', state: 'react' })),
      par(work(['CREW_REZA'], 'cargo', 'Kaçak malları gizliyor', 3), gather('mast', 'Maymunu kovalıyor', { n: 3, run: true })),
      T(1.6), S('say', { actor: 'officer', text: 'Hmph… ambar temiz. Gidiyoruz!', dur: 2.4 }),
    ],
    opts: [
      () => [S('npcState', { id: 'officer', state: 'work' }), S('say', { actor: 'officer', text: 'Hmm… bu mühürsüz sandıklar ne?', dur: 2.6 }), T(2)],
      () => [ // İsadora
        work(['CREW_ISADORA'], 'cargo', 'Mühürlü mektubu uzatıyor', 4, 1.4),
        only('CREW_ISADORA', 'Bu mührü tanırsınız, sanırım.', { dur: 2.4 }),
        par(S('npcState', { id: 'officer', state: 'react' }), S('say', { actor: 'officer', text: 'M-majesteleri! Affedin!', dur: 2.4, hold: 1.2 })),
      ],
      (c, info) => [ // Reza gizlesin
        work(['CREW_REZA'], 'cargo', 'Sandıkları sahte bölmeye kaydırıyor', 4, 1.2),
        S('npcState', { id: 'officer', state: 'work' }), T(1.4),
        S('say', { actor: 'officer', text: info.success ? 'Temiz… şimdilik.' : 'Bu bölme de ne?! Askerler!', dur: 2.6, hold: 1 }),
      ],
      () => [ // Rüşvet
        par(cap('Belki şu kese işleri hızlandırır, subay?', 2.4, 0.8)),
        S('coins', { from: 'ship', to: { x: 0, y: 0 }, n: 6 }),
        S('say', { actor: 'officer', text: 'Denetim… tamamlandı sayılır.', dur: 2.4, hold: 1 }),
      ],
    ],
    from: () => 'enc',
    exit: (c) => [unboard('officer', rail(side)), unboard('soldier1', rail(side), { wait: false }), call((d) => { const e = d.world.get('enc'); if (e) e.hooks = null; }), S('sound', { name: 'horn' }), move('enc', { y: -380, x: side * 230, rot: Math.PI * 0.85, sails: 'full' }, 3), T(0.6)],
  })),

  // ───────── SALGIN HASTALIK ─────────
  EVT_D_06: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ dark: 0.08 })],
    setup: (c, instant) => [spawn({ id: 'mistD', kind: 'mist', x: 0, y: 0, layer: 2, alpha: 0.8, opts: { r: 90, col: '#a8c890', a: 0.14 } }), board('sick1', 'sick', 'cargo', 'center', { endState: 'sit', wait: false })],
    approach: (c) => [
      par(slow(10), cam({ x: 0, y: 0 }, 0.3, 1.04)),
      par(S('say', { actor: 'sick1', text: 'Öhö… öhö… su…', dur: 2.6 }), sfx('fail')),
      par(react('danger', side), crewSay([], 'Yanına yaklaşmayın! Ateşi var!', { dur: 2.4 })),
      board('sick2', 'sick', 'cargo', 'galley', { endState: 'sit' }),
      S('say', { actor: 'sick2', text: 'Öhö… ben de…', dur: 2 }),
    ],
    intro: () => [cap('Salgın gemide yayılırsa hepimiz biteriz.', 2.6, 0.8)],
    auto: () => [
      par(work(['CREW_VARGAS'], 'center', 'Hastaları iyileştiriyor', 5, 1.6), only('CREW_VARGAS', 'Çantamı getirin! Erken yakaladık.', { dur: 2.4 })),
      par(fx('spark', 'ship', 18), sfx('magic')), S('npcState', { id: 'sick1', state: 'idle' }), S('say', { actor: 'sick1', text: 'Ateşim düştü!', dur: 2 }), remove('mistD'),
    ],
    opts: [
      () => [ // Karantina
        cap('Hastaları ambara indirin. Kimse yaklaşmasın.', 2.4, 0.6),
        par(unboard('sick1', 'cargo'), unboard('sick2', 'cargo', { wait: false }), gather('cargo', 'Ambar kapağını kapatıyor', { n: 2 })),
        par(sfx('creak'), move('mistD', { alpha: 0.3 }, 1.5)),
      ],
      () => [ // Doc Vargas
        par(work(['CREW_VARGAS'], 'center', 'Hastaları tek tek iyileştiriyor', 6, 1.6), only('CREW_VARGAS', 'Kaynamış su, sirke ve sabır!', { dur: 2.4 })),
        par(fx('spark', 'ship', 20), sfx('magic')),
        par(S('npcState', { id: 'sick1', state: 'idle' }), S('npcState', { id: 'sick2', state: 'idle' }), S('say', { actor: 'sick2', text: 'Doktor, sen bir mucizesin!', dur: 2.2 }), move('mistD', { alpha: 0 }, 2)),
      ],
      (c, info) => [ // Görmezden gel
        cap('İşinize dönün. Birkaç günde geçer.', 2.4, 1.2),
        info.success
          ? par(S('npcState', { id: 'sick1', state: 'idle' }), S('say', { actor: 'sick1', text: 'Geçti galiba… şanslıyız.', dur: 2.2 }), move('mistD', { alpha: 0 }, 2))
          : par(board('sick3', 'sick', 'cargo', rail(side), { endState: 'sit' }), move('mistD', { alpha: 1, scale: 1.4 }, 2), S('speed', { v: 4 }), crewSay([], 'Yarımız yatıyor… gemiyi kim yürütecek?', { dur: 2.6 })),
      ],
    ],
    exit: () => [remove('mistD'), offAll('cargo'), T(1)],
  })),

  // ───────── DEPO SIZINTISI ─────────
  EVT_D_08: def((ev, side) => ({
    mainId: null,
    setup: (c) => [deckProp('leak', 'puddle', 'cargo', { dx: side * 6, opts: { r: 7, jet: true } })],
    approach: (c) => [
      par(slow(10), sfx('splash'), cam({ x: 0, y: 10 }, 0.3, 1.05)),
      par(react('danger', side), S('opts', { id: 'leak', opts: { r: 11 } }), crewSay([], 'Ambara su doluyor!', { dur: 2.4 })),
      S('heel', { rot: side * 0.03 }),
    ],
    intro: () => [cap('Derz açılmış! Çabuk olun!', 2.2, 0.6)],
    opts: [
      () => [ // Onarım takımı
        work(['CREW_GROOT', 'CREW_LENA'], 'cargo', 'Ziftle deliği tıkıyor', 4, 1.4),
        par(sfx('repair'), fx('spark', 'ship', 14)), S('opts', { id: 'leak', opts: { r: 5, jet: false } }), T(0.6), remove('leak'), S('heel', { rot: 0 }),
      ],
      (c) => [ // Mira dalsın
        par(work(['CREW_MIRA'], rail(side), 'Suya dalıyor', 3, 1), only('CREW_MIRA', 'Dışarıdan yamarım!', { dur: 2 })),
        par(fx('splash', { rail: side }, 22), sfx('splash'), spawn({ id: 'bub', kind: 'bubbles', x: besides(c, 6), y: 10, opts: { n: 16, w: 10, h: 40 } })),
        T(2), par(S('opts', { id: 'leak', opts: { jet: false, r: 4 } }), remove('bub'), fx('splash', { rail: side }, 12)), remove('leak'), S('heel', { rot: 0 }),
      ],
      () => [ // Yükü hafiflet
        cap('Islanan sandıkları denize atın!', 2.2, 0.4), gather('cargo', 'Sandık taşıyor', { n: 3, run: true, hold: 1 }),
      ],
      (c, info) => [ // Kovalar
        par(gather('cargo', 'Kovayla su boşaltıyor', { n: 4, run: true, dur: 6 }), deckProp('b1', 'bucket', 'cargo', { dx: -8 }), deckProp('b2', 'bucket', 'cargo', { dx: 8 })),
        ...[0, 1, 2].map(() => [fx('splash', { rail: side }, 10), fx('splash', { rail: -side }, 10), sfx('splash'), T(0.7)]),
        info.success ? par(S('opts', { id: 'leak', opts: { r: 4, jet: false } }), crewSay([], 'Durdu! Sızıntı durdu!', { dur: 2 })) : par(S('opts', { id: 'leak', opts: { r: 16 } }), crewSay([], 'Yetişemiyoruz!', { dur: 2 })),
      ],
    ],
    exit: () => [remove('leak'), remove('b1'), remove('b2'), remove('bub'), T(0.8)],
  })),

  // ───────── RAKİP TÜCCAR ─────────
  EVT_D_09: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 3, { crewNpc: ['merchant', 'sailor', 'sailor'], scale: 0.9 })],
    approach: (c) => [
      par(move('enc', { x: side * 150, y: -160 }, 2.4), cam({ x: side * 80, y: -80 }, 0.3)),
      par(react('fortune', side), slow(6), lookout('Altın varaklı bir tüccar gemisi. Bize sokuluyor.', { dur: 2.6 })),
      move('enc', { x: alongside(c, 0.9, 3), y: -4, rot: 0, sails: 'furled' }, 2.6),
    ],
    intro: () => [say('enc', 'Kazancından payımı ver, yoksa limanda fiyatlar senin aleyhine döner!', 3.2, 1.6)],
    opts: [
      () => [cap('Tehditlerini başka limana sakla.', 2.4, 1), say('enc', 'Göreceksin! Limanda herkes adını bilecek!', 2.8, 1.2)],
      () => [ // Tarık
        work(['CREW_TARIK'], rail(side), 'Rakibin hesaplarını kontrol ediyor', 4, 1.2),
        only('CREW_TARIK', 'Hesabın yanlış dostum. Bak, şuradaki fiyat söylentisini ben başlattım.', { dur: 3.2, hold: 1.4 }),
        say('enc', 'Ne?! Hemen limana dönüyoruz!', 2.4, 0.8),
      ],
      (c, info) => [ // Mühür
        S('icon', { icon: 'seal', from: 'ship', to: 'enc' }),
        cap('Lonca mührü. Bana dokunursan loncaya dokunursun.', 2.6, 0.8),
        say('enc', info.success ? '…Peki. Bu sefer.' : 'Lonca mı? Hah! Limanda görüşürüz.', 2.4, 1),
      ],
      (c) => [ // Başka limana
        par(work(['CAPTAIN'], 'helm', 'Rotayı değiştiriyor', 4), cap('Rotayı değiştirin! Bizi bulamayacak.', 2.4, 0.6)),
        par(S('heel', { rot: -side * 0.15 }), S('shipTo', { x: -side * 40 }), go(32), move('enc', { y: 160 }, 3)),
        S('heel', { rot: 0 }),
      ],
    ],
    exit: (c) => [par(go(30), move('enc', { y: -380, x: side * 230, rot: Math.PI * 0.85, sails: 'full' }, 3)), T(0.8)],
  })),

  // ───────── SAHTE LİMAN REHBERİ ─────────
  EVT_D_10: def((ev, side) => ({
    weather: () => [weather({ dark: 0.12 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 30), y: -280, opts: { npcs: ['stranger'], dir: 'up' } })],
    approach: (c) => [
      par(move('enc', { y: -20 }, 4), slow(8), cam({ x: side * 60, y: -40 }, 0.3)),
      par(slow(2), react('fortune', side)),
    ],
    intro: () => [say('enc', 'Kaptan! Kestirme bir yol bilirim, limana yarı sürede varırsın!', 3.2, 1.6)],
    auto: (c, info, k) => [
      k === 1 ? pet('PET_TARCIN', { at: rail(side), pose: 'bark', dir: side < 0 ? 'left' : 'right', dur: 4, say: 'Grrrr…', sfx: 'bark' }) : work(['CREW_SELENE'], rail(side), 'Adamı tanıyor', 4, 1),
      T(1),
      k === 1 ? say('enc', 'O… o köpek… ben gideyim!', 2.2, 0.8) : only('CREW_SELENE', 'Seni tanıyorum. Limanlarda aranan muhbirsin!', { dur: 2.8 }),
      par(move('enc', { y: 280, x: besides(c, 80) }, 3), sfx('splash')),
    ],
    opts: [
      (c, info) => [ // Güven
        par(say('enc', 'Peşimden gelin!', 2, 0.4), move('enc', { y: -c.len / 2 - 70, x: side * 10 }, 3), go(26)),
        info.success
          ? par(go(60), move('enc', { y: -320 }, 2.5), lookout('Gerçekten kestirmeymiş!', { dur: 2.2 }))
          : par(spawn({ id: 'reef', kind: 'reef', x: 0, y: -260 }), move('reef', { y: 30 }, 3, { ease: 'linear' }), move('enc', { y: -380, alpha: 0 }, 3, { wait: false }), lookout('Sığlık! Adam kaçtı!', { dur: 2.2 })),
      ],
      (c) => [cap('Kestirmeni başkasına sat.', 2.2, 0.8), move('enc', { y: 240 }, 2.5)],
      (c) => [ // Sekstant
        work(['CAPTAIN'], 'helm', 'Sekstantla ölçüyor', 4, 1.5),
        cap('Yıldızlar başka bir yol söylüyor. Yalancı!', 2.6, 0.8),
        par(say('enc', 'Eh… ben… hoşça kal!', 2, 0.4), move('enc', { y: 260, x: besides(c, 90) }, 2.6)),
      ],
      (c) => [ // Selene
        work(['CREW_SELENE'], rail(side), 'Adamı sorguluyor', 4, 1.2),
        only('CREW_SELENE', 'Bu yüzü üç limanın duvarında gördüm.', { dur: 2.6, hold: 1 }),
        par(say('enc', 'Yanlış adam! Yanlış adam!', 2, 0.4), move('enc', { y: 260, x: besides(c, 90) }, 2.4)),
      ],
    ],
    outcome: (c, info) => (oiOf(info) === 0 && !info.success ? [S('shake', { amount: 6 }), fx('splinter', { rail: 0, dy: -c.len / 2 + 10 }, 16)] : []),
    exit: () => [remove('reef'), ...driftAll(), T(1)],
  })),

  // ───────── AÇLIK ─────────
  EVT_D_11: def((ev, side) => ({
    mainId: null,
    setup: (c) => [deckProp('barrel', 'sackOpen', 'galley', { dx: 6 })],
    approach: (c) => [
      par(slow(14), cam({ x: 0, y: 10 }, 0.3, 1.04)),
      par(gather('galley', 'Kurtlu fıçıya bakıyor', { n: 4, state: 'react' }), crewSay(['CREW_PITA', 'CREW_BJORN'], 'Erzak… kurtçuk dolu!', { dur: 2.4 })),
      crewSay([], 'Midem guruldamaya başladı bile…', { dur: 2.2 }),
    ],
    intro: () => [cap('Bir çözüm bulmalıyız, yoksa mürettebat dağılır.', 2.6, 0.6)],
    auto: (c) => [
      par(work(['CREW_PITA'], 'galley', 'Gizli rezervinden çorba pişiriyor', 6, 1), only('CREW_PITA', 'Kenara çekilin! Pita\'nın gizli kilerine bakın!', { dur: 2.6 })),
      par(S('throw', { from: 'ship', to: { x: besides(c, 40), y: 20 }, kind: 'crate', good: 'GOOD_GRAIN', burst: 'splash', sfx: 'splash' }), remove('barrel')),
      par(deckProp('pot', 'cauldron', 'galley'), gather('galley', 'Çorba kuyruğunda', { n: 4 }), S('sound', { name: 'cheer' })),
    ],
    opts: [
      (c) => [ // Ağ
        work([], rail(side), 'Ağı atıyor', 4, 0.8),
        par(S('throw', { from: { rail: side }, to: { x: besides(c, 34), y: 0 }, kind: 'rope', arc: 20 }), sfx('splash')),
        spawn({ id: 'net', kind: 'net', x: besides(c, 34), y: 0, opts: { fish: 9, r: 16 } }), T(1.2),
        S('pickup', { id: 'net', prefer: ['CREW_GROOT', 'CREW_BJORN'], task: 'Ağı çekiyor' }),
        par(deckProp('fish', 'fishPile', 'galley', { dx: -8, opts: { n: 12 } }), S('sound', { name: 'cheer' })),
      ],
      (c) => [ // Nakamura
        par(work(['CREW_NAKAMURA'], rail(side), 'Olta sallıyor', 6, 1.4), only('CREW_NAKAMURA', 'Sabır… balık sabrı sever.', { dur: 2.4 })),
        ...[0, 1, 2].map(() => [S('throw', { from: { x: besides(c, 20), y: 0 }, to: 'ship', kind: 'ball', arc: 24, dur: 0.6, burst: 'splash', n: 4 }), T(0.5)]),
        par(deckProp('fish', 'fishPile', 'galley', { dx: -8, opts: { n: 10 } }), gather('galley', 'Balık temizliyor', { n: 3 })),
      ],
      (c, info) => [ // Kargodan ye
        cap('Bir sandık aç. Önce mürettebat doymalı.', 2.4, 0.6),
        S('cargoUse', { goods: info.lost, at: 'galley' }),
        par(deckProp('pot', 'cauldron', 'galley'), gather('galley', 'Yemek yiyor', { n: 4 })),
      ],
      () => [cap('Kemerleri sıkın. Limana az kaldı.', 2.4, 0.8), gather('center', 'Aç ve yorgun', { n: 3 }), crewSay([], 'Bu gidişle küpeşteyi kemireceğiz…', { dur: 2.4 })],
    ],
    skip: (info) => (oiOf(info) === 2 ? ['lost'] : []),
    exit: () => [remove('barrel'), remove('pot'), remove('fish'), T(0.6)],
  })),

  // ───────── İSYAN TEHLİKESİ ─────────
  EVT_D_12: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ dark: 0.1 })],
    setup: (c) => [board('mut1', 'deserter', 'cargo', 'center', { dx: -8, wait: false, face: 'up' }), board('mut2', 'sailor', 'cargo', 'center', { dx: 8, wait: false, face: 'up' })],
    approach: (c) => [
      par(slow(10), cam({ x: 0, y: 0 }, 0.3, 1.05)),
      gather('center', 'Kollarını kavuşturmuş bekliyor', { n: 3, dur: 9 }),
      par(S('say', { actor: 'mut1', text: 'Kaptan! Bu böyle gitmez!', dur: 2.6 }), sfx('drum')),
    ],
    intro: () => [S('say', { actor: 'mut2', text: 'Payımızı istiyoruz. Hemen!', dur: 2.4, hold: 1 })],
    opts: [
      (c, info) => [ // Konuş
        par(work(['CAPTAIN'], 'center', 'Mürettebatla konuşuyor', 5), cap('Limanda altın, yeni gemi, hepimize pay! Benimle kalın!', 3, 1.4)),
        info.success
          ? par(S('say', { actor: 'mut1', text: '…Tamam kaptan. Bir şans daha.', dur: 2.4 }), S('sound', { name: 'cheer' }))
          : par(S('say', { actor: 'mut1', text: 'Laf! Sandala!', dur: 2 }), spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 24), y: 30, opts: { npcs: ['deserter', 'sailor'], dir: 'down' } }), unboard('mut1', rail(side), { carry: 'GOOD_SPICE' }), unboard('mut2', rail(side), { wait: false })),
      ],
      () => [ // Kenji
        work(['CREW_KENJI'], 'center', 'Sessizce aralarına yürüyor', 5, 2.2),
        S('say', { actor: 'mut1', text: '…', dur: 1.6 }), only('CREW_KENJI', '…', { dur: 1.4 }),
        S('say', { actor: 'mut2', text: 'Ta-tamam, işimize dönüyoruz.', dur: 2.2 }),
      ],
      () => [ // Pita
        par(work(['CREW_PITA'], 'galley', 'Baharatlı yahni pişiriyor', 5, 1), deckProp('pot', 'cauldron', 'galley')),
        only('CREW_PITA', 'Kim aç? Yahni hazır!', { dur: 2.2 }),
        par(unboard('mut1', 'galley'), unboard('mut2', 'galley', { wait: false }), gather('galley', 'Yahni kuyruğunda', { n: 4, run: true })),
        S('sound', { name: 'cheer' }),
      ],
      () => [ // İkramiye
        cap('Herkese birer kese! Hak ettiniz.', 2.4, 0.4),
        S('coins', { from: 'ship', to: { x: -10, y: 4 }, n: 10 }), S('sound', { name: 'cheer' }),
        S('say', { actor: 'mut1', text: 'Yaşa kaptan!', dur: 2 }),
      ],
    ],
    from: (info) => (oiOf(info) === 0 && !info.success ? 'boat' : null),
    thieves: true,
    exit: (c) => [remove('pot'), move('boat', { y: 300, x: besides(c, 80) }, 2.5, { wait: false }), offAll('cargo'), T(0.8)],
  })),

  // ───────── DENİZ CANAVARI ─────────
  EVT_D_13: def((ev, side) => ({
    weather: () => [weather({ preset: 'dark', dark: 0.08 })],
    setup: (c, instant) => [spawn({ id: 'shadow', kind: 'shadow', x: side * 70, y: -220, opts: { s: 1.4, a: 0.45 } }), spawn({ id: 'enc', kind: 'serpent', x: side * (c.beam / 2 + 40), y: -30, alpha: instant ? 1 : 0 })],
    approach: (c) => [
      par(move('shadow', { y: -30 }, 3.5), slow(6), cam({ x: side * 60, y: -30 }, 0.3)),
      par(lookout('Suyun altında bir şey var… KOCAMAN bir şey!', { dur: 2.4 }), react('danger', side)),
      par(move('enc', { alpha: 1 }, 0.8), fx('splash', { x: side * (c.beam / 2 + 40), y: -30 }, 40), S('shake', { amount: 8 }), sfx('roar'), remove('shadow'), S('speed', { v: 2 })),
      S('opts', { id: 'enc', opts: { roar: true } }),
    ],
    intro: () => [cap('Kimse kıpırdamasın…', 2.2, 1)],
    opts: [
      (c, info) => [ // Top
        par(work(['CREW_BJORN', 'CREW_OKSANA', 'CREW_BARAKA'], 'cannon', 'Topu ateşliyor', 4), cam('enc', 0.3, 1.06)),
        S('fire', { from: 'ship', to: 'enc', n: 3, hit: info.success ? true : 'some' }),
        info.success ? par(sfx('roar'), move('enc', { alpha: 0, y: -60 }, 1.6), fx('splash', 'enc', 40)) : par(sfx('roar'), S('shake', { amount: 12 }), fx('splash', 'ship', 50)),
      ],
      (c, info) => [ // Kaç
        par(go(70), sfx('depart'), cap('Tüm yelkenler!', 2, 0.4)),
        info.success ? par(move('enc', { y: 260, alpha: 0 }, 3)) : par(move('enc', { y: c.len / 2 + 10, x: side * (c.beam / 2 + 20) }, 1.8), T(1.6), S('shake', { amount: 12 }), sfx('roar'), S('speed', { v: 10 })),
      ],
      () => [ // Kalani
        par(work(['CREW_KALANI'], 'bow', 'Canavara eski bir şarkı söylüyor', 6, 1.6), sfx('magic')),
        par(only('CREW_KALANI', '♪ Derinlerin çocuğu, uyu… ♪', { dur: 3 }), spawn({ id: 'song', kind: 'sparkles', x: side * 40, y: -40, layer: 2, opts: { r: 50, col: '#a0ffd0' } })),
        par(move('enc', { y: 10, alpha: 0.7 }, 2), S('opts', { id: 'enc', opts: { roar: false } })), T(1),
        par(move('enc', { alpha: 0 }, 2), fx('splash', 'enc', 20), remove('song')),
      ],
      (c, info) => [ // Muska
        deckProp('amu', 'glowRing', 'center', { layer: 2, opts: { col: '#7ac8ff' } }), par(sfx('magic'), fx('spark', 'ship', 40)), T(1.2),
        info.success ? par(move('enc', { alpha: 0, x: side * (c.beam / 2 + 120) }, 1.6), sfx('roar')) : par(T(0.6), S('shake', { amount: 9 }), sfx('roar')),
        remove('amu'),
      ],
    ],
    exit: () => [par(move('enc', { alpha: 0 }, 1.2), remove('song')), T(1)],
  })),

  // ───────── TORPİDO ENKAZI ─────────
  EVT_D_14: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'mine', x: side * 10, y: -330 }), spawn({ id: 'wr', kind: 'wreck', x: -side * 110, y: -360, opts: { n: 7 } })],
    approach: (c) => [
      par(move('enc', { y: -c.len / 2 - 60 }, 4), move('wr', { y: -100 }, 4, { wait: false }), slow(6), cam({ x: 0, y: -90 }, 0.3)),
      par(react('danger', side), lookout('Mayın! Paslı ama hâlâ canlı!', { dur: 2.4 })),
    ],
    intro: () => [cap('Tek bir yanlış hareket…', 2.2, 0.8)],
    opts: [
      (c, info) => [
        par(cap('Yavaş… çok yavaş.', 2, 0.6), S('speed', { v: 3 }), work([], 'bow', 'Mayınları gözlüyor', 6)),
        par(S('shipTo', { x: -side * 18 }), move('enc', { y: info.success ? c.len / 2 + 120 : 0 }, 5, { ease: 'linear' })),
        info.success ? lookout('Geçtik…', { dur: 1.8 }) : par(fx('fire', { rail: side, dy: -6 }, 30), fx('splash', { rail: side }, 40), sfx('cannon'), S('shake', { amount: 12 })),
      ],
      (c, info) => [
        par(go(70), sfx('depart')),
        par(move('enc', { y: c.len / 2 + 200 }, 1.8, { ease: 'linear' }), move('wr', { y: 300 }, 1.8, { wait: false })),
        info.success ? lookout('Şans bizden yana!', { dur: 1.8 }) : par(fx('fire', { rail: side }, 30), sfx('cannon'), S('shake', { amount: 12 }), T(0.5), fx('fire', { rail: -side, dy: 30 }, 30), sfx('cannon')),
      ],
      (c) => [ // Mira
        par(work(['CREW_MIRA'], rail(side), 'Dalıyor', 3, 1), only('CREW_MIRA', 'İplerini keseceğim, kıpırdamayın.', { dur: 2.4 })),
        par(fx('splash', { rail: side }, 20), sfx('splash'), spawn({ id: 'bub', kind: 'bubbles', x: side * 20, y: -c.len / 2 - 60, opts: { n: 20, w: 60, h: 30 } })),
        par(move('enc', { x: side * 160, alpha: 0.5 }, 3), T(1)),
        spawn({ id: 'box', kind: 'chest', x: besides(c, 30), y: -20 }), remove('bub'),
        S('pickup', { id: 'box', prefer: ['CREW_MIRA', 'CREW_GROOT'], task: 'Mühürlü sandığı çekiyor' }),
      ],
    ],
    exit: () => [...driftAll(), T(1)],
  })),

  // ───────── KORSAN ABLUKASI ─────────
  // Üç gemi: amiral gemisi (enc) bordamızda, ikinci gemi (enc2) öbür bordamızda, üçüncüsü (enc3) pruvamızın önünde boğazı kesiyor.
  // Hepsi görünür alanda kalır (üst arayüzün altına girmez); kamera hafif yukarı bakar.
  EVT_D_15: def((ev, side) => ({
    thieves: true,
    weather: () => [weather({ dark: 0.1 })],
    setup: (c) => [
      shipEntity(c, 'enc3', 'pirate', 2, { x: 0, y: -440, scale: 0.85 }),
      shipEntity(c, 'enc', 'pirate', 3, { x: side * 200, y: -360, scale: 0.9 }),
      shipEntity(c, 'enc2', 'pirate', 2, { x: -side * 200, y: -380, scale: 0.85 }),
    ],
    approach: (c) => [
      par(S('speed', { v: 24 }), cam({ x: 0, y: -95 }, 0.25), move('enc3', { x: -40, y: -c.len / 2 - 48, rot: Math.PI / 2 }, 3.2)),
      par(react('danger', side), lookout('Üç gemi… boğazı kapatmışlar!', { dur: 2.4, hold: 0.4 })),
      par(slow(5),
        move('enc', { x: alongside(c, 0.9, 3), y: -10, rot: 0, sails: 'furled' }, 3),
        move('enc2', { x: -alongside(c, 0.85, 2), y: 16, rot: 0, sails: 'furled' }, 3, { wait: false }),
        move('enc3', { sails: 'furled' }, 1, { wait: false })),
      par(stop(), say('CAPTAIN', 'Kuşatıldık! Herkes yerine!', 2.2, 0.4)),
      call((d) => { for (const id of ['enc', 'enc2', 'enc3']) { const e = d.world.get(id); if (e) e.agitated = true; } }),
    ],
    intro: () => [say('enc', 'Bu sular bizim. Geçiş ücreti ya da dipteki yerin!', 3.2, 1.4)],
    opts: [
      (c, info) => [ // Savaş
        par(work(['CREW_BJORN', 'CREW_OKSANA'], 'cannon', 'Topları ateşliyor', 5), cam('enc', 0.3, 1.05)),
        S('fire', { from: { rail: side }, to: 'enc', n: 4, hit: info.success ? true : 'some', burn: info.success }),
        info.success
          ? par(say('enc', 'Dağılın! Dağılın!', 2, 0.4), move('enc2', { x: -side * 340, y: 120, rot: Math.PI * 0.85 }, 2.8, { wait: false }), move('enc3', { x: side * 320, y: -c.len / 2 - 120, rot: Math.PI * 0.75 }, 2.8, { wait: false }))
          : par(S('fire', { from: 'enc2', to: 'ship', n: 2, hit: true }), S('fire', { from: 'enc3', to: 'ship', n: 2, hit: true }), S('shake', { amount: 8 })),
        cam({ x: 0, y: -95 }, 0.3),
      ],
      (c) => [ // Rüşvet
        cap('Ne kadar istiyorsunuz?', 2, 0.6),
        spawn({ id: 'boat', kind: 'rowboat', x: side * 40, y: -c.len / 2 - 40, opts: { npcs: ['pirate', 'pirate'], dir: 'down' } }),
        move('boat', { x: besides(c, 24), y: -c.len / 2 + 30 }, 1.6),
        S('chest', { from: 'ship', to: 'boat' }),
        par(move('boat', { x: side * 60, y: -c.len / 2 - 40, alpha: 0 }, 1.8), say('enc3', 'Yol açık, tüccar.', 2, 0.3), move('enc3', { x: -side * 260, rot: Math.PI * 1.4 }, 3, { wait: false })),
      ],
      (c, info) => [ // Diego
        par(work(['CREW_DIEGO'], rail(side), 'Eski dostlarına sesleniyor', 5, 1), only('CREW_DIEGO', 'Hey, Kanlı Jack! Benim, Diego!', { dur: 2.6 })),
        say('enc', info.success ? 'DIEGO! Seni yaşlı kurt! Geç bakalım!' : 'Diego… bana hâlâ borçlusun.', 2.8, 1),
        info.success ? par(S('throw', { from: 'enc', to: 'ship', kind: 'crate', good: 'GOOD_WINE', arc: 30 }), S('sound', { name: 'cheer' })) : T(0.4),
        par(move('enc3', { x: -side * 260, rot: Math.PI * 1.4 }, 3), T(1)),
      ],
      (c, info) => [ // Kara Bayrak
        par(S('flag', { up: true }), sfx('flag'), cap('Bayrağı çekin!', 1.8, 0.6)),
        say('enc', info.success ? 'Kardeş gemi! Açılın!' : 'Hahaha! Bu paçavra mı? …Peki, ama bedeli var.', 2.8, 1),
        par(move('enc3', { x: -side * 260, rot: Math.PI * 1.4 }, 3), T(1)),
      ],
      (c) => [ // Başka liman
        par(cap('Dönüyoruz. Bu limana değmez.', 2.2, 0.6), say('enc', 'Kaç bakalım, tüccar!', 2, 0.3)),
        // yandaki gemiler önce açılır, sonra küçük bir dümen kırımıyla geri çekiliriz (gövdeler üst üste binmez)
        par(move('enc', { x: alongside(c, 0.9, 3) + side * 60, y: 150 }, 3), move('enc2', { x: -alongside(c, 0.85, 2) - side * 60, y: 170 }, 3, { wait: false }), move('enc3', { y: -c.len / 2 - 140 }, 3, { wait: false }), S('heel', { rot: -side * 0.08 }), go(18)),
      ],
    ],
    from: (info) => (oiOf(info) === 1 ? 'boat' : 'enc'),
    exit: (c) => [
      par(go(30), S('heel', { rot: 0 }), camReset(),
        move('enc', { y: c.len / 2 + 260, alpha: 0 }, 3.2),
        move('enc2', { y: c.len / 2 + 280, alpha: 0 }, 3.2, { wait: false }),
        move('enc3', { y: c.len / 2 + 240, alpha: 0 }, 3.6, { wait: false }),
        move('boat', { alpha: 0 }, 1, { wait: false })),
      remove('enc2'), remove('enc3'), remove('boat'),
    ],
  })),

  // ───────── SAHTE YARDIM SİNYALİ ─────────
  EVT_D_16: def((ev, side) => ({
    thieves: true,
    weather: () => [weather({ night: true, dark: 0.1 })],
    setup: (c) => [
      spawn({ id: 'enc', kind: 'raft', x: side * 30, y: -320 }),
      spawn({ id: 'light', kind: 'lantern', x: side * 30, y: -326, layer: 1 }),
      shipEntity(c, 'pir', 'pirate', 2, { x: side * 90, y: -460, alpha: 0, rot: 0, sails: 'furled' }),
    ],
    approach: (c) => [
      par(move('enc', { y: -c.len / 2 - 70 }, 4.5), move('light', { y: -c.len / 2 - 76 }, 4.5, { wait: false }), move('pir', { y: -c.len / 2 - 190 }, 4.5, { wait: false }), slow(6), cam({ x: side * 30, y: -120 }, 0.3)),
      par(say('enc', 'Yardım edin! Yardım!', 2.4, 0.4), react('fortune', side)),
      say('enc', 'Yardım edin! Yardım!', 2.4, 0.6),
      lookout('Ses… fazla düzenli, kaptan.', { dur: 2.2 }),
    ],
    intro: () => [T(0.4)],
    auto: (c, info, k) => [
      k === 0 ? par(pet('PET_TARCIN', { at: 'bow', pose: 'bark', dir: 'up', dur: 5, say: 'HAV! HAV! HAV!', sfx: 'bark' })) : work(['CREW_SELENE'], 'helm', 'Rotayı değiştiriyor', 4, 1),
      k === 0 ? T(1.2) : only('CREW_SELENE', 'Korsan tuzağı. Bu numarayı bilirim.', { dur: 2.6 }),
      par(move('pir', { alpha: 0.6 }, 1.2), lookout('Arkada bir gemi gizleniyor!', { dur: 2 })),
      par(S('heel', { rot: -side * 0.15 }), S('shipTo', { x: -side * 50 }), go(30)),
    ],
    opts: [
      (c, info) => [ // Yaklaş
        par(S('speed', { v: 4 }), move('enc', { y: -c.len / 2 - 24, x: besides(c, 20) }, 2.5), move('light', { y: -c.len / 2 - 30, x: besides(c, 20) }, 2.5, { wait: false })),
        ...(info.success
          ? [board('cast', 'castaway', rail(side), rail(side), { dy: -20, say: 'Tanrı sizi korusun!', endState: 'idle' }), S('say', { actor: 'cast', text: 'Al, bu keseyi sakladım!', dur: 2.2, hold: 1 })]
          : [par(move('pir', { alpha: 1, x: alongside(c, 1, 2, 4), y: -10, rot: 0 }, 2.4), sfx('horn'), react('danger', side)), say('pir', 'Ha! Kim kurtarıyor kimi şimdi?', 2.4, 0.8), S('fire', { from: 'pir', to: 'ship', n: 2, hit: true })]),
      ],
      (c) => [ // Yara
        par(work(['CREW_YARA'], 'bow', 'Karanlığa ok gönderiyor', 4, 1), only('CREW_YARA', 'Arkada biri var.', { dur: 2 })),
        S('throw', { from: { rail: 0, dy: -c.len / 2 }, to: 'pir', kind: 'arrow', arc: 10, dur: 0.7, burst: 'spark' }),
        par(move('pir', { alpha: 0.9 }, 0.6), say('pir', 'Fark ettiler! Kaçın!', 2, 0.4)),
        par(move('pir', { y: -460, alpha: 0 }, 2.6), move('enc', { y: -380 }, 2.6, { wait: false }), move('light', { y: -386 }, 2.6, { wait: false })),
      ],
      (c, info) => [ // Gözlemle
        work(['CAPTAIN'], 'helm', 'Dürbünle bakıyor', 4, 1.4),
        par(move('pir', { alpha: 0.5 }, 1), cap('Salın arkasında bir gemi var. Dönüyoruz!', 2.4, 0.6)),
        par(S('heel', { rot: -side * 0.15 }), S('shipTo', { x: -side * 50 }), go(30)),
        info.success ? T(0.4) : S('fire', { from: 'pir', to: 'ship', n: 2, hit: 'some' }),
      ],
      () => [go(30), cap('Göremedik, duymadık.', 2, 0.6), T(1)],
    ],
    from: (info) => (info.goldDelta < 0 ? 'pir' : 'enc'),
    exit: (c) => [unboard('cast', rail(side)), par(move('pir', { y: -460, alpha: 0 }, 2.4), go(30)), remove('pir'), ...driftAll(), T(0.8)],
  })),

  // ───────── GÜMRÜK RÜŞVETİ ─────────
  EVT_D_17: def((ev, side) => ({
    thieves: true,
    setup: (c) => [spawn({ id: 'enc', kind: 'rowboat', x: besides(c, 28), y: -280, opts: { npcs: ['customs', 'soldier'], dir: 'up' } }), shipEntity(c, 'far', 'warship', 2, { x: side * 230, y: -380, scale: 0.7, sails: 'furled', rot: 0 })],
    approach: (c) => [
      par(move('enc', { y: 0 }, 4), move('far', { y: -220 }, 4, { wait: false }), slow(4), cam({ x: side * 50, y: -20 }, 0.3)),
      par(stop(), react('fortune', side)),
      board('cust', 'customs', rail(side), 'center', { say: 'Gümrük! Defterler… ve ambar.', face: 'up' }),
    ],
    intro: () => [S('say', { actor: 'cust', text: 'Tabii… küçük bir hediye denetimi kısaltabilir.', dur: 3, hold: 1.2 })],
    auto: (c, info, k) => [
      k === 0 ? pet('PET_CUCE', { at: 'center', pose: 'hold', dur: 3 }) : work(['CREW_ISADORA'], 'center', 'Memura adıyla sesleniyor', 4, 1.2),
      k === 0 ? S('say', { actor: 'cust', text: 'Kalemim! Maymun kalemimi aldı!', dur: 2.4, hold: 1 }) : only('CREW_ISADORA', 'Memur Halil, değil mi? Babam sizi hatırlar.', { dur: 2.6 }),
      k === 0 ? only('CREW_REZA', 'Buyurun efendim, kaleminiz… ve bir de şu.', { dur: 2.4 }) : S('say', { actor: 'cust', text: 'E-efendim! Affedersiniz!', dur: 2.2, hold: 0.8 }),
    ],
    opts: [
      () => [S('coins', { from: 'ship', to: { x: 0, y: 0 }, n: 6 }), S('say', { actor: 'cust', text: 'İyi yolculuklar, kaptan!', dur: 2.2, hold: 0.8 })],
      (c, info) => [cap('Hediye yok. Denetle istersen.', 2.2, 0.8), S('say', { actor: 'cust', text: info.success ? 'Hmph! Vaktim yok.' : 'Peki! Askerler, ambar!', dur: 2.4, hold: 1 }), info.success ? T(0.2) : board('sol', 'soldier', rail(side), 'cargo', { endState: 'work' })],
      () => [work(['CREW_MEHMED'], 'center', 'Fermanı gösteriyor', 4, 1.2), only('CREW_MEHMED', 'Padişah fermanı. Okumayı bilirsin, umarım.', { dur: 2.6 }), S('say', { actor: 'cust', text: 'Ba-başüstüne! Hediyeye ne hacet…', dur: 2.4, hold: 0.8 })],
    ],
    exit: (c) => [unboard('cust', rail(side)), unboard('sol', rail(side), { wait: false }), par(move('enc', { y: 260 }, 3), move('far', { y: 300 }, 3, { wait: false })), remove('far')],
  })),

  // ───────── FIRTINA SONRASI ENKAZ ALANI ─────────
  EVT_D_18: def((ev, side) => ({
    weather: () => [weather({ preset: 'storm', dark: 0.06 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'wreck', x: side * 30, y: -360, opts: { w: 200, h: 120, n: 12, barrels: 2 } }), spawn({ id: 'tim', kind: 'timber', x: besides(c, 36), y: -300, opts: { n: 6 } })],
    approach: (c) => [
      par(move('enc', { y: -c.len / 2 - 30 }, 4.5), move('tim', { y: -30 }, 4.5, { wait: false }), slow(6), cam({ x: side * 20, y: -80 }, 0.3)),
      par(react('fortune', side), lookout('Kırık direkler, fıçılar… bir gemi parçalanmış.', { dur: 2.6 })),
    ],
    intro: () => [cap('Fırtına kimseyi affetmemiş.', 2.2, 0.8)],
    opts: [
      (c, info) => [
        par(cap('Dikkatle süzülün.', 2, 0.4), S('shipTo', { x: -side * 20 }), S('speed', { v: 6 })),
        move('enc', { y: info.success ? c.len / 2 + 120 : 10 }, 4.5, { ease: 'linear' }),
        info.success ? T(0.2) : par(sfx('creak'), S('heel', { rot: side * 0.06 }), fx('splinter', { rail: side }, 20)),
      ],
      (c, info) => [ // Yağmala
        par(cap('Fıçıları toplayın! Kim ne bulursa!', 2.4, 0.4), gather(rail(side), 'Enkazdan fıçı topluyor', { n: 3, run: true, dur: 6 })),
        spawn({ id: 'br1', kind: 'barrel', x: besides(c, 26), y: -20 }), spawn({ id: 'br2', kind: 'crate', x: besides(c, 40), y: 20 }),
        S('pickup', { id: 'br1', prefer: ['CREW_GROOT', 'CREW_BJORN'], task: 'Fıçıyı çekiyor' }),
        S('pickup', { id: 'br2', prefer: ['CREW_NAKAMURA'], task: 'Sandığı çekiyor' }),
        info.success ? T(0.2) : par(move('enc', { y: 0 }, 1.4), T(1.2), sfx('creak'), fx('splinter', { rail: side }, 24)),
      ],
      () => [
        par(work(['CREW_GROOT'], rail(side), 'Sağlam keresteleri ayıklıyor', 6, 1), only('CREW_GROOT', 'Bu meşe, şu çam… bunlar işe yarar.', { dur: 2.6 })),
        S('pickup', { id: 'tim', prefer: ['CREW_GROOT'], task: 'Keresteyi çekiyor' }),
        work(['CREW_GROOT'], rail(side), 'Gövdeyi yamıyor', 3, 1),
      ],
    ],
    exit: () => [weather({ restore: true }), ...driftAll(), T(1)],
  })),
};

function oiOf(info) { return info.key && /^o\d+$/.test(info.key) ? Number(info.key.slice(1)) : -1; }
