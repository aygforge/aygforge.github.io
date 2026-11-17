// GİZLİ DENİZ HİKÂYELERİ — 23 olayın imza sahneleri (mevcut sahne motoru ve 3/4 ilkelleriyle).
// Her olay: fiziksel giriş → şaka/gizem → karar → KARARA ÖZGÜ fiziksel çözüm → temiz çıkış.
// Şanslı seçeneklerde info.success ile ayrı başarı/başarısızlık koreografisi oynar (zar yeniden atılmaz).
// Gemide olmayan tayfa konuşturulmaz: tayfaya özgü vuruşlar has()/only() ile korunur.
import {
  S, par, wait, def, rail, shipEntity, alongside, besides, cap, crewSay, only, lookout, say, slow, stop, go, cam,
  react, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, weather, call, driftAll, offAll,
  dive,
} from '../kit.js';

const T = (n) => wait(n);
const hasCrew = (c, id) => (c.run?.crew || []).includes(id);
const hasPet = (c, id) => (c.run?.pets || []).includes(id);
const plank = (side, id = 'enc') => call((d) => { const e = d.world.get(id); const L = d.world.layout(); if (e) e.hooks = [{ x0: e.x - side * 16, y0: e.y, x1: d.world.ship.x + side * (L.beam / 2 - 6), y1: d.world.ship.y, plank: true }]; d.hooks.sfx?.('creak'); });
const rope = (id, toStern = false) => call((d) => { const e = d.world.get(id); const L = d.world.layout(); if (e) e.hooks = [{ x0: e.x, y0: e.y, x1: d.world.ship.x, y1: d.world.ship.y + (toStern ? L.len / 2 - 4 : 0) }]; d.hooks.sfx?.('hook'); });
const unhook = (id = 'enc') => call((d) => { const e = d.world.get(id); if (e) e.hooks = null; });
const scrape = (side, n = 18) => par(S('shake', { amount: 8 }), fx('splinter', { rail: side }, n), sfx('impact'));
const fade = (...ids) => par(...ids.map((id, i) => move(id, { alpha: 0 }, 1.4, i ? { wait: false } : {})));
const rm = (...ids) => ids.map((id) => remove(id));
const X = (c, k = 80, side = c.side) => side * (c.beam / 2 + k);
const lowDark = () => weather({ night: true, preset: 'dark' });

export const EGG_SCENES = {
  // #01 Siyah Yelkenli Kaptan
  EVT_EGG_001: def((ev, side) => ({
    weather: () => [weather({ preset: 'fog', fog: 0.18 })],
    setup: (c) => [shipEntity(c, 'enc', 'blackSail', 3, { x: X(c, 260), y: -300, rot: 0, scale: 0.78, sails: 'full', crewNpc: ['dandy', 'pirate', 'pirate'] })],
    approach: (c) => [
      par(slow(5), cam({ x: side * 60, y: -20 }, 0.5, 0.96), move('enc', { x: X(c, 120), y: -20, sails: 'furled' }, 3)), stop(),
      // kaptan direğe tırmanır, halat gösterisi, kayar; şapka havada kalır, su sıçrar
      spawn({ id: 'cpt', kind: 'figure', x: X(c, 120), y: -64, layer: 3, opts: { npc: 'dandy', state: 'work' } }),
      say('enc', 'Kaptanlığın sanatını izleyin!', 1.8, 0.2),
      move('cpt', { y: -84 }, 0.8), move('cpt', { x: X(c, 100), y: -90 }, 0.5), move('cpt', { x: X(c, 130), y: -86 }, 0.5),
      par(spawn({ id: 'hat', kind: 'hatSpin', x: X(c, 120), y: -96, layer: 3 }), move('cpt', { x: X(c, 60), y: -30 }, 0.7)),
      par(remove('cpt'), spawn({ id: 'sw', kind: 'swimmer', x: X(c, 60), y: -10, opts: { npc: 'dandy', splash: true } }), fx('splash', { x: X(c, 60), y: -10 }, 24), sfx('splash'), move('hat', { x: X(c, 64), y: -58 }, 1.2)),
      crewSay([], 'Kaptanınız düştü!', { dur: 1.6 }), say('enc', '…', 1.2, 0.4),
    ],
    intro: (c) => [hasCrew(c, 'CREW_DIEGO') ? only('CREW_DIEGO', 'Bu hikâyenin yarısı doğru bile değil.', { dur: 2 }) : T(0.3)],
    opts: [
      (c) => [work(['CREW_BJORN', 'CAPTAIN'], rail(side), 'Halat atıyor', 2, 0.4), S('throw', { from: { rail: side }, to: 'sw', kind: 'rope', arc: 10 }), rope('sw'),
        move('sw', { x: besides(c, 14, side), y: 4 }, 1.6), unhook('sw'), remove('sw'), board('dk', 'dandy', rail(side), 'center', { say: 'Teşekkürler, dostum!' }),
        par(move('hat', { x: besides(c, 10, side), y: -6 }, 0.8), S('opts', { id: 'hat', opts: { wet: true, spin: 0 } })), S('coins', { from: 'dk', to: 'ship', n: 5 }), unboard('dk', rail(side))],
      (c) => [move('sw', { x: X(c, 100), y: -20 }, 1.4), remove('sw'),
        spawn({ id: 'cpt', kind: 'figure', x: X(c, 120), y: -64, layer: 3, opts: { npc: 'dandy', state: 'work' } }), move('cpt', { y: -88 }, 0.8),
        say('enc', 'Şimdi asıl gösteri!', 1.4, 0.2), move('cpt', { x: X(c, 90), y: -84 }, 0.5), par(move('cpt', { x: X(c, 82), y: -70 }, 0.4), sfx('creak')),
        float('Son anda tutundu!', '#ffe080', 'enc'), par(sfx('cheer'), say('enc', 'Kesinlikle planlıydı.', 1.8, 0.4)), remove('cpt')],
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 5 }), move('sw', { x: besides(c, 20, side), y: 0 }, 1.6),
        par(move('hat', { x: besides(c, 6, side), y: -4 }, 1), S('opts', { id: 'hat', opts: { wet: true, spin: 0 } })), T(0.5),
        S('icon', { icon: 'coin', from: 'hat', to: 'ship' }), float('Şapkada gizli kese!', '#f2c14e'), say('enc', 'Orada olduğunu bilmiyordum!', 1.8, 0.4)],
    ],
    skip: () => ['gold'],
    exit: (c) => [unhook('sw'), offAll(rail(side)), ...rm('hat', 'sw', 'cpt'), par(move('enc', { y: -440, sails: 'full' }, 3)), remove('enc'), weather({ restore: true }), go(30)],
  })),

  // #03 Dokunaçlı Tahsildar
  EVT_EGG_003: def((ev, side) => ({
    weather: () => [weather({ preset: 'fog', dark: 0.08 })],
    setup: (c) => [shipEntity(c, 'enc', 'mossy', 2, { x: alongside(c, 0.8, 2, 22), y: -10, rot: 0, scale: 0.8, sails: 'furled', alpha: 0, crewNpc: ['clerk', 'sailor'] })],
    approach: (c) => [
      par(slow(4), cam({ x: side * 50, y: 0 }, 0.5, 1)), stop(),
      par(fx('splash', { x: alongside(c, 0.8, 2, 22), y: -10 }, 30), sfx('splash'), S('shake', { amount: 4 })),
      move('enc', { alpha: 1 }, 2.2),
      plank(side), board('cl', 'clerk', rail(side), 'center', { endState: 'work' }),
      deckProp('book', 'ledger', 'center', { dx: side * 12, opts: { open: true, flip: true } }), deckProp('beard', 'tentacleBeard', 'center', { dy: -14 }),
      S('say', { actor: 'cl', text: 'Denize borcu olmayan denizci yoktur!', dur: 2.2, hold: 0.4 }),
    ],
    intro: () => [S('opts', { id: 'book', opts: { open: true, flip: false } }), S('say', { actor: 'cl', text: '…hm. Adınız… yok.', dur: 1.8, hold: 0.3 })],
    opts: [
      () => [S('opts', { id: 'book', opts: { open: true, flip: true } }), work(['CAPTAIN'], 'center', 'Defteri birlikte inceliyor', 3, 0.5), S('opts', { id: 'book', opts: { open: true, flip: false } }),
        S('say', { actor: 'cl', text: 'Yanlış gemi. Çok yanlış gemi.', dur: 2, hold: 0.4 }), S('opts', { id: 'book', opts: { open: false } })],
      (c) => [hasCrew(c, 'CREW_PITA') ? work(['CREW_PITA'], 'galley', 'Çay demliyor', 2.5, 0.4) : work([], 'galley', 'Çay getiriyor', 2.5, 0.4),
        deckProp('cup', 'teaCup', 'center', { dx: -side * 8 }), T(1), par(S('opts', { id: 'cup', opts: { spill: true } }), sfx('splash')),
        S('say', { actor: 'cl', text: 'Ah! Dokunaçlarım… affedin!', dur: 1.8, hold: 0.3 }), S('coins', { from: 'cl', to: 'ship', n: 4 })],
      (c) => [S('say', { actor: 'cl', text: 'Pekâlâ…', dur: 1.2, hold: 0.2 }), unboard('cl', rail(side)), unhook('enc'), par(go(24), S('shipTo', { x: -side * 30 })),
        par(move('enc', { alpha: 0 }, 2.4), fx('splash', 'enc', 24), sfx('splash'))],
    ],
    skip: () => ['gold'],
    exit: () => [...rm('book', 'beard', 'cup'), unhook('enc'), offAll(rail(side)), par(move('enc', { alpha: 0 }, 2), fx('splash', 'enc', 20)), remove('enc'), S('shipTo', { x: 0 }), weather({ restore: true }), go(30)],
  })),

  // #08 Batmayan Gemi
  EVT_EGG_008: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'liner', 5, { x: X(c, 150), y: -360, rot: 0, scale: 0.72, sails: 'full', crewNpc: ['officer', 'servant', 'sailor'] }), spawn({ id: 'lights', kind: 'lightString', x: X(c, 150), y: -360, layer: 3, opts: { len: 120, w: 24 } }), spawn({ id: 'ice', kind: 'iceBit', x: X(c, 60), y: -300, opts: {} })],
    approach: (c) => [
      par(slow(5), cam({ x: side * 70, y: -30 }, 0.5, 0.94), move('enc', { y: -40 }, 3.4), move('lights', { y: -40 }, 3.4, { wait: false }), move('ice', { y: -90 }, 3.4, { wait: false })),
      stop(), par(sfx('horn'), say('enc', 'Dünyanın en güvenli gemisi!', 2.2, 0.4)), lookout('Pruvasında… minicik bir buz!', { dur: 1.8 }),
      par(S('set', { id: 'enc', props: { rot: side * 0.12 } }), sfx('creak')), say('enc', 'Dümen! Dümen!', 1.4, 0.4),
    ],
    intro: () => [T(0.3)],
    opts: [
      (c) => [deckProp('x3lamp', 'lantern', 'bow'), work(['CAPTAIN'], 'bow', 'Fenerle işaret veriyor', 2.5, 0.4), ...[0, 1, 2].map(() => [par(S('flash', {}), sfx('bell')), T(0.35)]),
        par(S('set', { id: 'enc', props: { rot: -side * 0.1 } }), move('enc', { x: X(c, 190) }, 1.8), move('lights', { x: X(c, 190) }, 1.8, { wait: false })), say('enc', 'Teşekkürler!', 1.4, 0.4), remove('x3lamp')],
      (c, info) => [work(['CREW_BJORN', 'CAPTAIN'], rail(side), 'Halatı buza atıyor', 2.5, 0.4), S('throw', { from: { rail: side }, to: 'ice', kind: 'rope', arc: 10 }), rope('ice'),
        ...(info.success ? [move('ice', { x: besides(c, 30, side), y: 20 }, 2), unhook('ice'), par(move('enc', { y: -230, x: X(c, 160) }, 3), move('lights', { y: -230, x: X(c, 160) }, 3, { wait: false })), S('throw', { from: 'enc', to: 'ship', kind: 'chest', arc: 18 })]
          : [move('ice', { x: besides(c, 6, side), y: 0 }, 1.2), unhook('ice'), scrape(side, 12), par(move('enc', { y: -230 }, 3), move('lights', { y: -230 }, 3, { wait: false }))])],
      (c) => [par(move('enc', { y: -150, x: X(c, 140) }, 2.6), move('lights', { y: -150, x: X(c, 140) }, 2.6, { wait: false })), par(fx('spark', 'ice', 10), sfx('creak'), float('Hafif sürtünme', '#c8e8ff', 'ice')),
        par(S('flag', { up: true }), say('enc', '…selam.', 1.4, 0.2)), cap('…selam.', 1.4, 0.4), S('flag', { up: false })],
    ],
    skip: () => ['gold'],
    exit: () => [unhook('ice'), par(move('enc', { y: -460 }, 3), move('lights', { y: -460 }, 3, { wait: false }), move('ice', { y: 300, alpha: 0 }, 3, { wait: false })), ...rm('enc', 'lights', 'ice'), go(30)],
  })),

  // #09 Yalnız Kazazede ve Hindistan Cevizi
  EVT_EGG_009: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'isl', kind: 'island', x: X(c, 120), y: -360, opts: { r: 42 } }), spawn({ id: 'enc', kind: 'figure', x: X(c, 110), y: -370, layer: 2, opts: { npc: 'castaway', state: 'idle' } }), spawn({ id: 'coco', kind: 'coconut', x: X(c, 130), y: -372, layer: 2, opts: { nod: true } })],
    approach: (c) => [par(slow(5), cam({ x: side * 60, y: -20 }, 0.5, 1), move('isl', { y: -50 }, 3.2), move('enc', { y: -60 }, 3.2, { wait: false }), move('coco', { y: -62 }, 3.2, { wait: false })), stop(),
      cap('Sizi kurtaralım mı?', 1.6, 0.3), say('enc', 'Bir dakika… arkadaşıma soralım.', 2, 0.3), S('opts', { id: 'enc', opts: { npc: 'castaway', state: 'react', dir: side < 0 ? 'right' : 'left' } }), T(1), float('…', '#ffffff', 'coco')],
    intro: () => [T(0.3)],
    opts: [
      (c) => [spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor'], dir: side < 0 ? 'left' : 'right' } }), move('boat', { x: X(c, 70), y: -40 }, 2), remove('enc'),
        S('opts', { id: 'boat', opts: { npcs: ['sailor', 'castaway'], dir: side < 0 ? 'right' : 'left' } }), remove('coco'), move('boat', { x: besides(c, 16, side), y: 0 }, 2), remove('boat'),
        board('cw', 'castaway', rail(side), 'center', { say: 'Arkadaşım gemicileri sever!' }), deckProp('coco2', 'coconut', 'center', { dx: 8 }), T(1.2), remove('coco2'), unboard('cw', rail(side))],
      (c) => [S('coins', { from: 'ship', to: 'isl', n: 3 }), S('throw', { from: { rail: side }, to: 'isl', kind: 'crate', good: 'GOOD_BISCUIT_CRATE', arc: 18 }), T(0.4),
        deckProp('x', 'lantern', rail(side)), ...[0, 1, 2].map(() => [par(S('flash', {}), sfx('bell')), T(0.3)]), float('Işıklı teşekkür', '#ffe080', 'isl'), remove('x')],
      (c) => [spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor'], dir: side < 0 ? 'left' : 'right' } }), move('boat', { x: X(c, 70), y: -40 }, 2), remove('coco'), move('boat', { x: besides(c, 16, side), y: 0 }, 2), remove('boat'),
        deckProp('chair', 'coconut', 'helm', { opts: { chair: true } }), gather('helm', 'Selam duruyor', { n: 4, dur: 3 }), par(sfx('cheer'), crewSay([], 'Kaptan Ceviz!', { dur: 1.6 })),
        pet('PET_TARCIN', { at: 'helm', pose: 'wag', dur: 4, say: 'Snif snif…' }), T(1), remove('chair'), S('icon', { icon: 'crown', from: 'ship', to: 'enc' })],
    ],
    skip: () => ['gold'],
    exit: () => [...rm('boat', 'chair', 'coco2', 'x'), offAll(rail(side)), ...driftAll()],
  })),

  // #10 Kaplanlı Filika
  EVT_EGG_010: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'tigerBoat', x: X(c, 90), y: -300, opts: {} })],
    approach: (c) => [par(move('enc', { y: -20 }, 3.4), slow(4), cam({ x: side * 40, y: 0 }, 0.5, 1.04)), stop(), react('surprise', side), crewSay([], 'K-kaplan!', { dur: 1.4 }), say('enc', 'Merak etmeyin, o çok uslu.', 2, 0.4)],
    intro: (c) => [hasPet(c, 'PET_TARCIN') ? pet('PET_TARCIN', { at: rail(side), pose: 'sit', dur: 4 }) : T(0.3)],
    opts: [
      (c) => [work([], rail(side), 'Balık fırlatıyor', 1.8, 0.2), ...[0.3, 0.6, 1].map((k) => [S('opts', { id: 'enc', opts: { eat: k, stand: k > 0.5 } }), T(0.25)]), S('opts', { id: 'enc', opts: { eat: 0, stand: false } }),
        float('Mmm!', '#ffd76a', 'enc'), hasCrew(c, 'CREW_PITA') ? only('CREW_PITA', 'Balıkların en iyisi kaplana gitti…', { dur: 2 }) : T(0.4)],
      (c, info) => [work(['CREW_BJORN', 'CAPTAIN'], rail(side), 'Halatı filikaya atıyor', 2, 0.4), S('throw', { from: { rail: side }, to: 'enc', kind: 'rope', arc: 10 }), rope('enc', true),
        ...(info.success ? [move('enc', { x: 0, y: 130 }, 2.6), move('enc', { x: -side * 30, y: 160 }, 1.4), unhook('enc'), S('coins', { from: 'enc', to: 'ship', n: 5 })]
          : [S('opts', { id: 'enc', opts: { stand: true } }), par(unhook('enc'), sfx('hook'), S('shake', { amount: 5 })), scrape(side, 10), S('opts', { id: 'enc', opts: { stand: false } }), float('Herkes güvende', '#9ae0a0', 'enc')])],
      (c) => [deckProp('x', 'lantern', rail(side)), work(['CAPTAIN'], rail(side), 'Kıyıyı işaret ediyor', 2.6, 0.4), S('flash', {}), say('enc', 'Teşekkürler!', 1.4, 0.4), move('enc', { y: -200, x: X(c, 160) }, 2.6), remove('x')],
    ],
    skip: () => ['gold'],
    exit: () => [unhook('enc'), remove('x'), move('enc', { alpha: 0 }, 1.6), remove('enc'), go(30)],
  })),

  // #13 Kayıp Turuncu Balık
  EVT_EGG_013: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'reef', kind: 'reef', x: X(c, 140), y: -320, opts: {} }), spawn({ id: 'enc', kind: 'tinyFish', x: besides(c, 20, side), y: -60, layer: 2, opts: { n: 1 } })],
    approach: (c) => [par(slow(5), cam({ x: side * 50, y: -10 }, 0.5, 1.02), move('reef', { y: -60 }, 3)),
      move('enc', { x: X(c, 100), y: -50 }, 1.2), move('enc', { x: besides(c, 16, side), y: -30 }, 1.2), move('enc', { x: X(c, 100), y: -56 }, 1.2), move('enc', { x: besides(c, 18, side), y: -20 }, 1), stop(),
      crewSay([], 'Bu minik bizden yardım istiyor!', { dur: 1.8 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [par(go(10), S('shipTo', { x: side * 30 }), move('enc', { x: X(c, 130), y: -60 }, 2.4)), stop(), spawn({ id: 'fam', kind: 'tinyFish', x: X(c, 150), y: -70, layer: 2, opts: { n: 2 } }),
        ...[0.4, 0.8, 1].map((g) => [S('opts', { id: 'enc', opts: { n: 1, gather: g, tx: 20, ty: -12 } }), T(0.4)]), par(sfx('cheer'), float('Aile buluştu!', '#ffd76a', 'reef'))],
      (c) => [...dive(c, side, ['CREW_MIRA'], 'Resife dalıyor', [move('enc', { x: X(c, 140), y: -64 }, 1.6), spawn({ id: 'fam', kind: 'tinyFish', x: X(c, 150), y: -70, layer: 2, opts: { n: 2 } }), T(0.8), S('opts', { id: 'enc', opts: { n: 1, gather: 1, tx: 10, ty: -6 } })]),
        only('CREW_MIRA', 'Geçidi buldum; akıntı da kuzeye dönüyor.', { dur: 2 })],
      (c) => [cap('Kendi yolunu bulur.', 1.4, 0.4), move('enc', { x: X(c, 120), y: -50 }, 1.6), move('enc', { x: X(c, 140), y: -66 }, 1.4), float('Resife ulaştı', '#ffd76a', 'reef')],
    ],
    exit: () => [...rm('fam', 'enc'), S('shipTo', { x: 0 }), ...driftAll()],
  })),

  // #19 Deniz Dibindeki Ananas
  EVT_EGG_019: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'bub', kind: 'bubbles', x: side * 20, y: -40, opts: { n: 24, w: 40, h: 40 } })],
    approach: (c) => [par(slow(4), cam({ x: side * 40, y: -10 }, 0.5, 1.04)), stop(), lookout('Geminin altından kabarcıklar!', { dur: 1.6 }),
      spawn({ id: 'enc', kind: 'pineHouse', x: X(c, 60), y: 10, layer: 0, opts: { wave: true } }), par(remove('bub'), sfx('magic')), crewSay([], 'Dipte… bir ev mi var?', { dur: 1.8 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => (hasCrew(c, 'CREW_MIRA') ? dive(c, side, ['CREW_MIRA'], 'Uzaktan bakmak için dalıyor', [S('opts', { id: 'enc', opts: { wave: true, smile: true } }), T(1.6)]) : [work(['CAPTAIN'], rail(side), 'Suya eğilip bakıyor', 2.4, 0.4), S('opts', { id: 'enc', opts: { wave: true, smile: true } }), T(1.6)]),
      (c) => [work(['CAPTAIN'], rail(side), 'Çanı ipe bağlayıp indiriyor', 2.4, 0.4), deckProp('bl', 'bell', rail(side)), ...[0, 1].map(() => [sfx('bell'), T(0.4)]), S('opts', { id: 'enc', opts: { wave: false, knock: true } }), T(1.6), remove('bl')],
      () => [gather(rail(side), 'El sallıyor', { n: 4, dur: 3 }), S('opts', { id: 'enc', opts: { wave: true } }), crewSay([], 'Selam, komşu!', { dur: 1.4 })],
    ],
    exit: () => [...rm('bl', 'bub'), move('enc', { alpha: 0 }, 1.6), remove('enc'), go(30)],
  })),

  // #25 X İşaretli Hazine
  EVT_EGG_025: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'isl', kind: 'island', x: X(c, 140), y: -360, opts: { r: 52 } }), spawn({ id: 'x', kind: 'xMark', x: X(c, 136), y: -366, layer: 2, opts: {} }), shipEntity(c, 'enc', 'pirate', 2, { x: X(c, 300), y: -300, rot: 0, scale: 0.6, sails: 'full' })],
    approach: (c) => [par(slow(5), cam({ x: side * 70, y: -20 }, 0.5, 0.94), move('isl', { y: -40 }, 3), move('x', { y: -46 }, 3, { wait: false }), move('enc', { y: -90, x: X(c, 240), sails: 'furled' }, 3, { wait: false })), stop(),
      spawn({ id: 'us', kind: 'figure', x: X(c, 120), y: -40, layer: 2, opts: { npc: 'sailor', state: 'work' } }), spawn({ id: 'th', kind: 'figure', x: X(c, 152), y: -44, layer: 2, opts: { npc: 'pirate', state: 'react' } }),
      S('opts', { id: 'x', opts: { dug: 0.3 } }), say('enc', 'O harita bizim!', 1.6, 0.2), cap('Hayır, bizim!', 1.4, 0.4)],
    intro: (c) => [hasCrew(c, 'CREW_DIEGO') ? only('CREW_DIEGO', 'Kaptan… onlar haritayı ters tutuyor.', { dur: 2 }) : T(0.3)],
    opts: [
      (c) => [...[0.5, 0.8, 1].map((d) => [par(S('opts', { id: 'x', opts: { dug: d } }), S('opts', { id: d > 0.6 ? 'th' : 'us', opts: { state: 'work' } }), sfx('creak')), T(0.5)]),
        S('opts', { id: 'x', opts: { dug: 1, chest: 'gold' } }), par(S('coins', { from: 'x', to: 'enc', n: 5 }), S('coins', { from: 'x', to: 'ship', n: 5 })), float('Yarı yarıya', '#f2c14e', 'x')],
      (c, info) => [...[0.6, 1].map((d) => [S('opts', { id: 'x', opts: { dug: d } }), sfx('creak'), T(0.35)]), S('opts', { id: 'x', opts: { dug: 1, chest: 'gold' } }),
        ...(info.success ? [move('us', { x: besides(c, 20, side), y: -10 }, 1.4), S('opts', { id: 'x', opts: { dug: 1 } }), S('throw', { from: 'us', to: 'ship', kind: 'chest', arc: 16 }), par(move('enc', { y: -460 }, 3), say('enc', 'Grr!', 1, 0.2))]
          : [move('th', { x: X(c, 220), y: -80 }, 1.2), S('opts', { id: 'x', opts: { dug: 1 } }), par(S('shake', { amount: 6 }), sfx('impact'), fx('splinter', { rail: side }, 10)), par(move('enc', { y: -460, sails: 'full' }, 3), say('enc', 'Hahaha!', 1.4, 0.2))])],
      (c) => [move('us', { x: X(c, 100), y: -30 }, 1), ...[0.5, 0.8, 1].map((d) => [par(S('opts', { id: 'x', opts: { dug: d } }), sfx('creak')), T(0.5)]), S('opts', { id: 'x', opts: { dug: 1, chest: 'boots' } }),
        S('throw', { from: 'x', to: 'th', kind: 'crate', arc: 10 }), par(sfx('cheer'), crewSay([], 'Çizmeler! Hahaha!', { dur: 1.8 }))],
    ],
    skip: () => ['gold'],
    exit: (c) => [...rm('us', 'th'), par(move('enc', { y: -460 }, 2.6)), remove('enc'), ...driftAll()],
  })),

  // #26 Gece Gelen Garip Balık
  EVT_EGG_026: def((ev, side) => ({
    weather: () => [lowDark()],
    setup: () => [],
    mainId: 'crt',
    approach: (c) => [par(slow(6), cam({ x: 0, y: 0 }, 0.5, 1.08)), gather('cargo', 'Ağı çekiyor', { n: 3, dur: 3 }), deckProp('crt', 'eyeCrate', 'cargo', { opts: { eyes: 0.1 } }),
      weather({ dark: 0.28 }), ...[0.4, 0.8, 1].map((e) => [S('opts', { id: 'crt', opts: { eyes: e, shake: e > 0.7 } }), T(0.5)]), sfx('creak'), crewSay([], 'Bu balığın… kaç gözü var?', { dur: 1.8 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [deckProp('lm', 'lantern', 'cargo', { dx: 10 }), work(hasCrew(c, 'CREW_MIRA') ? ['CREW_MIRA'] : ['CAPTAIN'], 'cargo', 'Mesafeli inceliyor', 3, 0.4), weather({ dark: 0.12 }),
        ...[0.6, 0.3, 0].map((e) => [S('opts', { id: 'crt', opts: { eyes: e } }), T(0.4)]), hasCrew(c, 'CREW_MIRA') ? only('CREW_MIRA', 'Bilinmeyen bir tür. Not ettim.', { dur: 1.8 }) : T(0.4), remove('lm')],
      (c) => [work([], 'cargo', 'Balığı küpeşteden atıyor', 2, 0.3), remove('crt'), par(fx('splash', { rail: side }, 18), sfx('splash')),
        spawn({ id: 'eyes', kind: 'deepEyes', x: X(c, 60), y: 0, layer: 0, opts: { n: 22 } }), T(1.4), ...[0.6, 0.2].map((f) => [S('opts', { id: 'eyes', opts: { n: 22, fade: f } }), T(0.5)]), remove('eyes')],
      () => [S('opts', { id: 'crt', opts: { eyes: 1, shake: true } }), T(0.8), par(weather({ night: false, dark: 0 }), sfx('dock')), S('opts', { id: 'crt', opts: { eyes: 0, shake: false, glyph: true } }), float('Tahtada bir sembol…', '#c8f0e0')],
    ],
    exit: () => [...rm('crt', 'lm', 'eyes'), weather({ restore: true }), go(30)],
  })),

  // #31 Balık Yakalama Küresi
  EVT_EGG_031: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'boat', x: X(c, 90), y: -300, opts: { npc: 'fisherKid' } })],
    approach: (c) => [par(move('enc', { y: -20 }, 3), slow(4), cam({ x: side * 40, y: 0 }, 0.5, 1.04)), stop(),
      spawn({ id: 'sp', kind: 'mechSphere', x: X(c, 90), y: -30, layer: 3, opts: {} }), move('sp', { x: X(c, 140), y: -40 }, 0.8), par(S('opts', { id: 'sp', opts: { open: 1, glow: true } }), sfx('magic')), T(0.6),
      par(S('opts', { id: 'sp', opts: { open: 0, glow: false, fish: true } }), sfx('pickup')), crewSay([], 'İri balık mı?! …Yoo, minicik.', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [S('icon', { icon: 'gift', from: 'enc', to: 'ship' }), work(['CAPTAIN'], rail(side), 'Küreyi fırlatıyor', 1.6, 0.2), spawn({ id: 'sp2', kind: 'mechSphere', x: besides(c, 10, side), y: -10, layer: 3, opts: {} }), move('sp2', { x: X(c, 50), y: -20 }, 0.8),
        par(S('opts', { id: 'sp2', opts: { open: 1, glow: true } }), sfx('magic')), T(0.6), S('opts', { id: 'sp2', opts: { open: 0, glow: false, fish: true } }), float('Minicik!', '#ffd76a', 'sp2'), move('sp2', { x: X(c, 90), y: -30 }, 0.8), remove('sp2')],
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 3 }), ...[0, 1, 2].map((i) => [spawn({ id: `s${i}`, kind: 'mechSphere', x: besides(c, 10, side), y: -10 + i * 10, layer: 3, opts: {} }), move(`s${i}`, { x: X(c, 50 + i * 20), y: -20 + i * 12 }, 0.6), par(S('opts', { id: `s${i}`, opts: { open: 0, fish: true } }), sfx('pickup')), T(0.3)]),
        float('Üçünde de aynı minik!', '#ffd76a'), ...[0, 1, 2].map((i) => remove(`s${i}`))],
      (c) => [say('enc', 'Peki… haklısınız.', 1.4, 0.2), par(S('opts', { id: 'sp', opts: { open: 1, fish: false } }), sfx('splash')), spawn({ id: 'jf', kind: 'jumpFish', x: X(c, 140), y: -36, opts: {} }), spawn({ id: 'jf2', kind: 'jumpFish', x: X(c, 110), y: -20, opts: {} }), T(1.6), ...rm('jf', 'jf2'), float('Özgür!', '#9ae0a0', 'sp')],
    ],
    skip: () => ['gained'],
    exit: () => [...rm('sp', 'sp2', 'jf', 'jf2', 's0', 's1', 's2'), ...driftAll()],
  })),

  // #33 Dalgıçla Gece Restoranı
  EVT_EGG_033: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.1 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'stallBoat', x: X(c, 60), y: -300, opts: {} })],
    approach: (c) => [par(move('enc', { y: -10 }, 3.2), slow(4), cam({ x: side * 40, y: 0 }, 0.5, 1.04)), stop(),
      spawn({ id: 'dv', kind: 'swimmer', x: X(c, 110), y: 10, opts: { npc: 'diver', splash: true } }), par(fx('splash', { x: X(c, 110), y: 10 }, 18), sfx('splash')), T(0.8), remove('dv'),
      board('dvr', 'diver', rail(side), rail(side), { dx: side * 6, say: 'Gündüz balık, akşam yemek!' }), par(S('opts', { id: 'enc', opts: { lit: true } }), sfx('bell'))],
    intro: () => [T(0.3)],
    opts: [
      () => [S('coins', { from: 'ship', to: 'enc', n: 4 }), S('opts', { id: 'enc', opts: { lit: true, cook: true, dishes: true } }), gather(rail(side), 'Tezgâhta yemek yiyor', { n: 4, dur: 4 }), crewSay([], 'Enfes!', { dur: 1.4 })],
      () => [work(['CREW_PITA'], rail(side), 'Dalgıçla birlikte pişiriyor', 4, 0.4), par(S('opts', { id: 'enc', opts: { lit: true, cook: true } }), sfx('repair')), ...[0, 1, 2].map(() => [S('icon', { icon: 'pot', from: 'ship', to: 'enc' }), T(0.25)]), S('opts', { id: 'enc', opts: { lit: true, cook: true, dishes: true } }), only('CREW_PITA', 'Bir tabak daha!', { dur: 1.4 })],
      (c, info) => [deckProp('nt', 'net', rail(side)), work([], rail(side), 'Ağı atıyor', 2.4, 0.4),
        ...(info.success ? [spawn({ id: 'jf', kind: 'jumpFish', x: X(c, 30), y: 20, opts: { big: true } }), T(1.2), remove('jf'), S('coins', { from: 'enc', to: 'ship', n: 5 }), float('Akşamlık balık!', '#9ae0a0')]
          : [spawn({ id: 'cr', kind: 'crab', x: besides(c, 10, side), y: -6, layer: 3, opts: { water: true } }), unboard('dvr', rail(side)), spawn({ id: 'dv2', kind: 'swimmer', x: X(c, 30), y: 10, opts: { npc: 'diver', splash: true } }), par(fx('splash', { x: X(c, 30), y: 10 }, 20), sfx('splash')), T(1), crewSay([], 'Hahaha! İyi misin?', { dur: 1.6 }), remove('dv2'), remove('cr')]), remove('nt')],
    ],
    skip: () => ['gold', 'gained'],
    exit: () => [...rm('nt', 'cr', 'dv', 'dv2', 'jf'), offAll(rail(side)), ...driftAll(), weather({ restore: true })],
  })),

  // #35 Yağmurlu Gün Balıkçısı (yerel yağmur katmanı; küresel hava değişmez)
  EVT_EGG_035: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'pierEnd', x: X(c, 110), y: -340, opts: {} }), spawn({ id: 'rain', kind: 'rainPatch', x: X(c, 70), y: -360, layer: 4, opts: { w: 280, h: 220 } })],
    approach: (c) => [par(slow(4), cam({ x: side * 50, y: 0 }, 0.5, 1), move('enc', { y: -30 }, 3.2), move('rain', { y: -30 }, 3.2, { wait: false })), stop(),
      say('enc', 'Yalnız yağmurda çıkar o balık…', 2.4, 0.6), crewSay([], 'Ne huzurlu bir yer.', { dur: 1.6 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [work(['CAPTAIN'], rail(side), 'İkinci oltayı atıyor', 2, 0.3), S('opts', { id: 'enc', opts: { bite: true } }), T(0.8), spawn({ id: 'big', kind: 'jumpFish', x: X(c, 60), y: 0, opts: { big: true } }), T(1.4), remove('big'),
        S('opts', { id: 'enc', opts: { bite: false } }), par(say('enc', 'Kaçtı! Hahaha!', 1.6, 0.2), crewSay([], 'Kocamandı!', { dur: 1.4 }))],
      (c) => [deckProp('nt', 'net', rail(side)), work([], rail(side), 'Balık Ağı\'nı atıyor', 2.4, 0.4), spawn({ id: 'sch', kind: 'fishSchool', x: X(c, 50), y: 0, layer: 1, opts: {} }), T(1), float('Bir sürü küçük balık', '#9ae0a0'), remove('sch'), say('enc', 'Küçükler de güzel.', 1.6, 0.4), remove('nt')],
      (c) => [spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['captain'], dir: side < 0 ? 'left' : 'right' } }), move('boat', { x: X(c, 82), y: -20 }, 2), remove('boat'),
        spawn({ id: 'me', kind: 'figure', x: X(c, 96), y: -38, layer: 2, opts: { npc: 'captain', state: 'sit' } }), T(1.4), S('opts', { id: 'enc', opts: { bite: true } }), T(0.6), spawn({ id: 'sf', kind: 'jumpFish', x: X(c, 128), y: -6, opts: {} }), T(1), S('opts', { id: 'enc', opts: { bite: false } }), remove('sf'), float('Küçük bir balık', '#9ae0a0', 'enc'), remove('me')],
    ],
    skip: () => ['gained'],
    exit: () => [...rm('nt', 'big', 'sch', 'me', 'sf', 'boat'), par(move('rain', { alpha: 0 }, 1.4)), remove('rain'), move('enc', { alpha: 0 }, 1.2), remove('enc'), go(30)],
  })),

  // #43 Gece Gelen Yarasa
  EVT_EGG_043: def((ev, side) => ({
    weather: () => [lowDark()],
    setup: (c) => [shipEntity(c, 'enc', 'merchant', 2, { x: X(c, 150), y: -320, rot: 0, scale: 0.7, sails: 'furled', crewNpc: ['merchant', 'sailor'] }), spawn({ id: 'p1', kind: 'rowboat', x: X(c, 70), y: -300, opts: { npcs: ['pirate', 'pirate'], dir: 'up' } }), spawn({ id: 'p2', kind: 'rowboat', x: X(c, 230), y: -280, opts: { npcs: ['pirate'], dir: 'up' } }), spawn({ id: 'cf', kind: 'cloakFigure', x: X(c, 150), y: -400, layer: 4, opts: {} })],
    approach: (c) => [par(slow(5), cam({ x: side * 70, y: -20 }, 0.5, 0.94), move('enc', { y: -50 }, 3), move('p1', { y: -20, x: X(c, 90) }, 3, { wait: false }), move('p2', { y: -20, x: X(c, 210) }, 3, { wait: false }), move('cf', { y: -130 }, 3, { wait: false })), stop(),
      say('enc', 'İmdat! Korsanlar!', 1.6, 0.2), lookout('Direğin tepesinde biri var…', { dur: 1.8 }), par(S('flash', {}), move('cf', { alpha: 0 }, 0.3))],
    intro: () => [T(0.3)],
    opts: [
      (c) => [par(go(14), S('shipTo', { x: side * 30 })), T(0.8), stop(), spawn({ id: 'cf2', kind: 'cloakFigure', x: X(c, 150), y: -70, layer: 4, opts: { cape: true } }), move('cf2', { x: X(c, 90), y: -30 }, 0.5), S('throw', { from: 'cf2', to: 'p1', kind: 'rope', arc: 8 }),
        move('cf2', { x: X(c, 210), y: -30 }, 0.5), S('throw', { from: 'cf2', to: 'p2', kind: 'rope', arc: 8 }), par(float('Bağlandılar!', '#ffe080', 'p1'), sfx('hook')), move('cf2', { alpha: 0, y: -120 }, 0.6), S('coins', { from: 'enc', to: 'ship', n: 5 })],
      (c) => [spawn({ id: 'cf2', kind: 'cloakFigure', x: X(c, 150), y: -110, layer: 4, opts: { cape: true } }), move('cf2', { x: X(c, 60), y: -80 }, 0.7), T(0.3), move('cf2', { x: -side * (c.beam / 2 + 120), y: -90 }, 0.9), T(0.3), par(move('cf2', { alpha: 0 }, 0.6), S('flash', {})),
        deckProp('fth', 'feather', 'center'), crewSay([], 'Bir tüy bıraktı…', { dur: 1.6 })],
      (c) => [cap('Bekleyelim.', 1.2, 0.6), T(1), S('opts', { id: 'p1', opts: { npcs: ['pirate', 'pirate'], dir: 'up' } }), float('Çoktan bağlanmışlar!', '#ffe080', 'p1'), crewSay([], 'Ne zaman oldu bu?!', { dur: 1.6 })],
    ],
    skip: () => ['gold'],
    exit: () => [...rm('cf', 'cf2', 'fth'), S('shipTo', { x: 0 }), par(move('enc', { y: -440 }, 3), move('p1', { y: 400 }, 3, { wait: false }), move('p2', { y: 400 }, 3, { wait: false })), ...rm('enc', 'p1', 'p2'), weather({ restore: true }), go(30)],
  })),

  // #46 Mesajcı Baykuş
  EVT_EGG_046: def((ev, side) => ({
    weather: () => [weather({ preset: 'dusk', dark: 0.06 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'owl', x: X(c, 220), y: -160, layer: 4, opts: { fly: true, letter: true } })],
    approach: (c) => [par(slow(6), cam({ x: 0, y: 0 }, 0.5, 1.06)), par(move('enc', { x: besides(c, 4, side), y: -20 }, 2.4), sfx('hoot')), S('opts', { id: 'enc', opts: { fly: false, letter: true } }),
      crewSay([], 'Bir baykuş! Gagasında mektup var.', { dur: 1.8 }), S('icon', { icon: 'scroll', from: 'enc', to: 'ship' })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [work(['CAPTAIN'], rail(side), 'Mektubu imzalıyor', 2, 0.3), par(S('opts', { id: 'enc', opts: { fly: true, letter: false } }), sfx('hoot')), spawn({ id: 'sf', kind: 'sparkFeathers', x: besides(c, 4, side), y: -40, layer: 4 }),
        move('enc', { x: X(c, 200), y: -170 }, 2), T(0.6), remove('sf')],
      (c) => [cap('Yanlış kişiye gelmiş olmalı.', 1.6, 0.2), S('opts', { id: 'enc', opts: { fly: true, letter: true } }), move('enc', { x: -side * (c.beam / 2 - 6), y: 0 }, 1.2), S('opts', { id: 'enc', opts: { fly: false, letter: true } }),
        crewSay([], 'Ben mi?!', { dur: 1.4 }), S('opts', { id: 'enc', opts: { fly: true, letter: false } }), move('enc', { x: -side * 220, y: -170 }, 1.8)],
      (c) => [work(['CREW_COMPASS'], 'helm', 'Mühürdeki yıldızları sayıyor', 3, 0.4), deckProp('mp', 'mapScroll', 'helm', { dx: 10 }), par(sfx('magic'), float('Bir rota koordinatı!', '#ffe080')), S('opts', { id: 'enc', opts: { fly: true } }), move('enc', { x: X(c, 200), y: -170 }, 1.8), remove('mp')],
    ],
    exit: () => [...rm('sf', 'mp'), move('enc', { alpha: 0 }, 1), remove('enc'), weather({ restore: true }), go(30)],
  })),

  // #51 Beyaz Saçlı Canavar Avcısı
  EVT_EGG_051: def((ev, side) => ({
    weather: () => [weather({ preset: 'fog', fog: 0.22 })],
    setup: (c) => [spawn({ id: 'isl', kind: 'island', x: X(c, 150), y: -360, opts: { r: 46 } }), spawn({ id: 'seal', kind: 'seal', x: X(c, 170), y: -360, layer: 2, opts: {} }), spawn({ id: 'enc', kind: 'rowboat', x: X(c, 70), y: -260, opts: { npcs: ['whiteHunter'], dir: 'down' } })],
    approach: (c) => [par(slow(5), cam({ x: side * 60, y: 0 }, 0.5, 0.98), move('isl', { y: -40 }, 3), move('seal', { y: -46 }, 3, { wait: false }), move('enc', { y: 0 }, 3, { wait: false })), stop(),
      say('enc', 'Adada korkunç bir canavar var.', 2, 0.4), lookout('O… bir fok mu?', { dur: 1.6 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [spawn({ id: 'b2', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor', 'whiteHunter'], dir: side < 0 ? 'left' : 'right' } }), remove('enc'), move('b2', { x: X(c, 110), y: -30 }, 2), T(0.4),
        par(S('opts', { id: 'seal', opts: { sneeze: true } }), sfx('splash'), S('shake', { amount: 3 })), float('HAPŞU!', '#ffffff', 'seal'), crewSay([], 'Aaah!', { dur: 1 }), T(0.6), S('opts', { id: 'seal', opts: { sneeze: false } }), move('b2', { x: besides(c, 16, side), y: 0 }, 2), remove('b2')],
      () => [S('coins', { from: 'ship', to: 'enc', n: 4 }), say('enc', 'Bakalım…', 1.2, 0.4), move('enc', { y: -30 }, 1.2), T(0.6), S('opts', { id: 'seal', opts: { sneeze: true } }), T(0.6), S('opts', { id: 'seal', opts: { sneeze: false } }), move('enc', { y: 0 }, 1.2), say('enc', 'Hak etmediğim parayı almam.', 2, 0.4), S('coins', { from: 'enc', to: 'ship', n: 4 })],
      () => [cap('Hayvana dokunmayalım.', 1.6, 0.4), say('enc', 'Doğru karar.', 1.4, 0.4), move('enc', { y: -250, alpha: 0.2 }, 3)],
    ],
    skip: () => ['gold'],
    exit: () => [...rm('b2'), par(move('enc', { alpha: 0 }, 1.4), move('seal', { alpha: 0 }, 1.4, { wait: false })), ...rm('enc', 'seal'), ...driftAll(), weather({ restore: true })],
  })),

  // #55 Piri Reis'in Eksik Haritası
  EVT_EGG_055: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'chest', x: X(c, 40), y: -260, opts: { closed: true } })],
    approach: (c) => [par(move('enc', { y: -10 }, 3), slow(4), cam({ x: side * 20, y: 0 }, 0.5, 1.06)), stop(), S('pickup', { id: 'enc', prefer: [], task: 'Su geçirmez sandığı güverteye alıyor' }),
      deckProp('tbl', 'mapTable', 'center'), deckProp('map', 'oldMap', 'center', { dy: -6, opts: { ship: true } }), sfx('page'), crewSay([], 'Ne kadar ayrıntılı bir harita…', { dur: 1.8 })],
    intro: () => [T(0.3)],
    opts: [
      () => [work(['CREW_COMPASS'], 'center', 'Sembolleri çözüyor', 3.4, 0.4), par(S('opts', { id: 'map', opts: { ship: true, marks: true, glow: true } }), sfx('magic')), only('CREW_COMPASS', 'İşte rotamız.', { dur: 1.6 })],
      () => [work(['CAPTAIN'], 'center', 'Haritayı yağlı beze sarıyor', 3, 0.4), remove('map'), S('icon', { icon: 'book', from: 'center', to: 'ship' }), float('Codex\'e not düşüldü', '#c8a0ff')],
      (c, info) => [S('opts', { id: 'map', opts: { ship: true, marks: true } }), par(go(18), S('shipTo', { x: side * 30 })), T(1), stop(),
        ...(info.success ? [spawn({ id: 'ld', kind: 'chest', x: X(c, 30), y: -40, opts: {} }), S('pickup', { id: 'ld', prefer: [], task: 'Saklı yükü alıyor' })] : [spawn({ id: 'sb', kind: 'shoal', x: side * 20, y: -60, opts: {} }), scrape(side, 16), remove('sb')]), S('shipTo', { x: 0 })],
    ],
    skip: () => ['gold'],
    exit: () => [...rm('tbl', 'map', 'ld', 'sb'), go(30)],
  })),

  // #60 Üç Köşeli Deniz
  EVT_EGG_060: def((ev, side) => ({
    weather: () => [weather({ night: true, preset: 'dark', dark: 0.1 })],
    setup: (c) => [spawn({ id: 'enc', kind: 'triBeacons', x: 0, y: -20, layer: 0, opts: { r: 190, tri: 0 } }), spawn({ id: 'gh', kind: 'shipGhost', x: 0, y: 30, layer: 0, opts: { len: c.len, beam: c.beam, a: 0 } })],
    approach: (c) => [par(slow(6), cam({ x: 0, y: 0 }, 0.5, 0.92)), deckProp('cmp', 'compassBig', 'helm', { opts: { spin: 12 } }), lookout('Pusula dönüyor!', { dur: 1.6 }),
      ...[0.4, 0.8, 1].map((k) => [S('opts', { id: 'enc', opts: { r: 190, tri: k } }), T(0.4)]), weather({ dark: 0.25 }), ...[0.15, 0.3].map((a) => [S('opts', { id: 'gh', opts: { len: c.len, beam: c.beam, a } }), T(0.4)]), crewSay([], 'Kendi izimizi mi takip ediyoruz?!', { dur: 1.8 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work(['CAPTAIN'], 'helm', 'Pusulaya güveniyor', 2, 0.3),
        ...(info.success ? [S('opts', { id: 'cmp', opts: { still: true } }), par(go(30), S('heel', { rot: side * 0.06 })), S('opts', { id: 'enc', opts: { r: 190, tri: 0.3 } }), float('Üçgenin dışındayız!', '#9ae0a0')]
          : [par(go(30), S('heel', { rot: -side * 0.08 })), spawn({ id: 'rk', kind: 'rocks', x: -side * 70, y: -40 }), scrape(-side, 14), remove('rk')]), S('heel', { rot: 0 })],
      () => [work(['CREW_COMPASS'], 'bow', 'Sabit yıldızı arıyor', 3, 0.4), spawn({ id: 'st', kind: 'stars', x: 0, y: -100, layer: 4, opts: {} }), S('opts', { id: 'cmp', opts: { still: true } }), par(go(24), float('Güvenli çıkış', '#9ae0a0')), remove('st')],
      (c) => [cap('Dümeni bırakın.', 1.4, 0.4), par(go(14), S('heel', { rot: side * 0.04 })), T(1.2), ...[0.6, 0.2, 0].map((k) => [S('opts', { id: 'enc', opts: { r: 190, tri: k } }), S('opts', { id: 'gh', opts: { len: c.len, beam: c.beam, a: k * 0.3 } }), T(0.4)]), S('opts', { id: 'cmp', opts: { still: true } }), S('heel', { rot: 0 })],
    ],
    exit: () => [...rm('cmp', 'st', 'rk'), fade('enc', 'gh'), ...rm('enc', 'gh'), weather({ restore: true }), go(30)],
  })),

  // #75 Dört Tahtalık Krallık
  EVT_EGG_075: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'raftTower', x: X(c, 70), y: -300, opts: { floors: 0 } })],
    approach: (c) => [par(move('enc', { y: -20 }, 3), slow(4), cam({ x: side * 40, y: -10 }, 0.5, 1.06)), stop(), crewSay([], 'Dört tahtalık bir sal…', { dur: 1.6 }),
      ...[1, 2].map((f) => [S('opts', { id: 'enc', opts: { floors: f } }), sfx('creak'), T(0.6)]), crewSay([], '…iki katlı mı?!', { dur: 1.6 }), spawn({ id: 'own', kind: 'figure', x: X(c, 64), y: -52, layer: 3, opts: { npc: 'castaway', state: 'react' } })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor', 'sailor'], dir: side < 0 ? 'left' : 'right' } }), move('boat', { x: X(c, 36), y: -6 }, 1.6), move('own', { y: -40 }, 0.6), move('own', { y: -52 }, 0.6),
        crewSay([], 'Bir de bahçesi var!', { dur: 1.4 }), move('boat', { x: besides(c, 16, side), y: 0 }, 1.6), remove('boat')],
      (c) => [S('coins', { from: 'ship', to: 'enc', n: 3 }), S('throw', { from: { rail: side }, to: 'enc', kind: 'crate', good: 'GOOD_TIMBER', arc: 14 }), S('opts', { id: 'enc', opts: { floors: 2, hammer: true } }), ...[0, 1].map(() => [sfx('repair'), T(0.4)]), S('opts', { id: 'enc', opts: { floors: 3, hammer: false } }), float('Üçüncü kat!', '#ffe080', 'enc')],
      () => [work(['CREW_GROOT'], rail(side), 'Salı inceliyor', 4, 1), only('CREW_GROOT', '…', { dur: 1.2 }), T(0.6), only('CREW_GROOT', 'Bence sormayalım.', { dur: 1.8 })],
    ],
    exit: () => [...rm('own', 'boat'), ...driftAll()],
  })),

  // #86 Kayıp Dev Yumurta
  EVT_EGG_086: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'eggNest', x: X(c, 170), y: -360, opts: {} })],
    approach: (c) => [par(slow(5), cam({ x: side * 80, y: -10 }, 0.5, 0.92), move('enc', { y: -40 }, 3.2)), stop(), lookout('Kocaman bir yumurta… ve izler!', { dur: 1.8 }),
      par(S('opts', { id: 'enc', opts: { shake: true } }), S('shake', { amount: 3 }), sfx('roar')), T(0.6), S('opts', { id: 'enc', opts: { shake: false, shadow: 0.5 } }), T(0.4), S('opts', { id: 'enc', opts: { shadow: 0 } })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor', 'cartographer'], dir: side < 0 ? 'left' : 'right' } }), move('boat', { x: X(c, 90), y: -30 }, 2),
        ...(info.success ? [work([], rail(side), 'Desenleri kopyalıyor', 2, 0.3), float('Desenler kaydedildi', '#c8a0ff', 'enc'), move('boat', { x: besides(c, 16, side), y: 0 }, 2)]
          : [par(S('opts', { id: 'enc', opts: { tail: 0.4, shake: true } }), sfx('roar')), S('opts', { id: 'enc', opts: { tail: 1 } }), move('boat', { x: besides(c, 8, side), y: 0 }, 0.6), scrape(side, 14), S('opts', { id: 'enc', opts: { tail: 0, shake: false } }), float('Herkes güvende', '#9ae0a0', 'enc')]), remove('boat')],
      () => [par(go(12), S('shipTo', { x: -side * 20 })), T(0.6), ...[0.4, 0.8, 1].map((k) => [S('opts', { id: 'enc', opts: { shadow: k } }), T(0.4)]), sfx('roar'), T(0.6), S('opts', { id: 'enc', opts: { shadow: 0.6 } })],
      () => [stop(), ...[0.3, 0.7, 1].map((k) => [S('opts', { id: 'enc', opts: { crack: k } }), sfx('creak'), T(0.5)]), S('opts', { id: 'enc', opts: { hatch: true, walk: 0 } }), par(sfx('cheer'), crewSay([], 'Bir yavru!', { dur: 1.4 })),
        S('opts', { id: 'enc', opts: { hatch: true, shadow: 0.7 } }), ...[0.2, 0.5, 0.8].map((w) => [S('opts', { id: 'enc', opts: { hatch: true, walk: w, shadow: 0.7 } }), T(0.4)])],
    ],
    exit: () => [remove('boat'), S('shipTo', { x: 0 }), move('enc', { alpha: 0 }, 1.6), remove('enc'), go(30)],
  })),

  // #93 Adanın Altındaki Kapak (ara sahne odası; karar süresi YOK)
  EVT_EGG_093: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'hatchIsle', x: X(c, 150), y: -360, opts: {} })],
    approach: (c) => [par(slow(5), cam({ x: side * 70, y: -10 }, 0.5, 0.94), move('enc', { y: -40 }, 3)), stop(),
      spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor', 'sailor'], dir: side < 0 ? 'left' : 'right' } }), move('boat', { x: X(c, 96), y: -30 }, 2),
      ...[0.4, 0.8, 1].map((k) => [S('opts', { id: 'enc', opts: { open: k } }), sfx('creak'), T(0.35)]),
      spawn({ id: 'room', kind: 'hatchRoom', x: 0, y: -40, layer: 5, opts: { count: 108 } }), sfx('tick'), crewSay([], 'Bir sayaç… geri sayıyor.', { dur: 1.8 })],
    intro: () => [T(0.3)],
    opts: [
      () => [...[42, 8, 3, 1].map((n) => [S('opts', { id: 'room', opts: { count: n } }), sfx('tick'), T(0.4)]), work(['CAPTAIN'], 'center', 'Düğmeye basıyor', 1.4, 0.2), par(S('opts', { id: 'room', opts: { count: 108 } }), sfx('hook'), S('shake', { amount: 3 })), float('Sıfırlandı', '#e8e0c8')],
      () => [...[30, 10, 2, 0].map((n) => [S('opts', { id: 'room', opts: { count: n } }), sfx('tick'), T(0.4)]), par(S('opts', { id: 'room', opts: { count: 0, dark: true } }), S('opts', { id: 'enc', opts: { open: 1, lights: false } })), T(0.8), par(S('opts', { id: 'room', opts: { count: 0, dark: false } }), S('opts', { id: 'enc', opts: { open: 1, lights: true } })), crewSay([], '…hiçbir şey olmadı?', { dur: 1.6 })],
      () => [S('opts', { id: 'room', opts: { count: 77, marks: true } }), work(['CREW_MIRA', 'CREW_COMPASS'], 'center', 'Duvardaki sembolleri kopyalıyor', 3, 0.4), float('Semboller kaydedildi', '#c8a0ff')],
    ],
    exit: (c) => [remove('room'), ...[0.6, 0].map((k) => [S('opts', { id: 'enc', opts: { open: k } }), T(0.3)]), move('boat', { x: besides(c, 16, side), y: 0 }, 2), remove('boat'), move('enc', { alpha: 0 }, 1.4), remove('enc'), go(30)],
  })),

  // #95 Kış Geliyor
  EVT_EGG_095: def((ev, side) => ({
    setup: (c) => [shipEntity(c, 'enc', 'winter', 3, { x: X(c, 260), y: -300, rot: 0, scale: 0.78, sails: 'full', crewNpc: ['furCaptain', 'furCaptain'] }), spawn({ id: 'snow', kind: 'snowFall', x: X(c, 260), y: -320, layer: 4, opts: { w: 90, h: 120 } }), spawn({ id: 'fr', kind: 'frost', x: X(c, 260), y: -300, layer: 3, opts: { w: 60, h: 100 } })],
    approach: (c) => [par(slow(5), cam({ x: side * 50, y: 0 }, 0.5, 0.98), move('enc', { x: alongside(c, 0.78, 3, 28), y: -10, sails: 'furled' }, 3.2), move('snow', { x: alongside(c, 0.78, 3, 28), y: -30 }, 3.2, { wait: false }), move('fr', { x: alongside(c, 0.78, 3, 28), y: -10 }, 3.2, { wait: false })), stop(),
      say('enc', 'Büyük bir kış yaklaşıyor.', 2.2, 0.4), crewSay([], 'Kaptan… çok sıcak.', { dur: 1.6 }), deckProp('sw', 'steam', rail(side), { opts: { n: 3 } })],
    intro: () => [T(0.3)],
    opts: [
      () => [deckProp('th', 'thermo', rail(side), { dx: side * -6, opts: { level: 1 } }), work(['CAPTAIN'], rail(side), 'Termometreyi gösteriyor', 2.4, 0.4), say('enc', 'Yine de… kış geliyor.', 2, 0.4), remove('th')],
      (c) => [hasCrew(c, 'CREW_PITA') ? work(['CREW_PITA'], 'galley', 'Koca tencereyi taşıyor', 2.4, 0.3) : work([], 'galley', 'Sıcak yemek hazırlıyor', 2.4, 0.3), deckProp('pot', 'cauldron', rail(side)), deckProp('st', 'steam', rail(side), { dy: -10, opts: { n: 6 } }),
        S('icon', { icon: 'pot', from: 'ship', to: 'enc' }), say('enc', '…teşekkürler.', 1.4, 0.4), float('Buharın içinde bir gülümseme', '#ffe080', 'enc'), ...rm('pot', 'st')],
      (c, info) => [par(go(30), move('enc', { y: -200, sails: 'full' }, 3), move('snow', { y: -220 }, 3, { wait: false }), move('fr', { y: -200 }, 3, { wait: false })),
        ...(info.success ? [spawn({ id: 'cur', kind: 'reverseCurrent', x: 0, y: -40, layer: 0, opts: {} }), float('Soğuk akıntı!', '#c8e8ff'), T(1), remove('cur')] : [spawn({ id: 'ib', kind: 'iceBit', x: side * 20, y: -60 }), scrape(side, 12), remove('ib')])],
    ],
    exit: () => [...rm('sw', 'th', 'pot', 'st', 'cur', 'ib'), par(move('enc', { y: -440 }, 3), move('snow', { alpha: 0 }, 2, { wait: false }), move('fr', { alpha: 0 }, 2, { wait: false })), ...rm('enc', 'snow', 'fr'), go(30)],
  })),

  // #116 Kopuzun Rüzgârı (özgün prosedürel ezgi: 'kopuz' sesi)
  EVT_EGG_116: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'enc', kind: 'bardBoat', x: X(c, 60), y: -300, opts: {} })],
    approach: (c) => [par(move('enc', { y: -10 }, 3), slow(4), cam({ x: side * 30, y: 0 }, 0.5, 1.04)), stop(), say('enc', 'Dinleyin, denizciler…', 1.8, 0.4),
      par(S('opts', { id: 'enc', opts: { play: true } }), sfx('kopuz'), spawn({ id: 'wnd', kind: 'windStreaks', x: 0, y: -20, layer: 4, opts: {} }), S('sails', { state: 'full' })), T(1.6), S('opts', { id: 'enc', opts: { play: false } })],
    intro: () => [T(0.3)],
    opts: [
      () => [gather(rail(side), 'Ozanı dinliyor', { n: 5, dur: 4 }), par(S('opts', { id: 'enc', opts: { play: true } }), sfx('kopuz'), S('sails', { state: 'full' }), S('heel', { rot: side * 0.04 })), T(1.8), S('heel', { rot: 0 }), float('Yelkenler ezgiyle doldu', '#ffe080')],
      (c) => [say('enc', 'Eski gemiler vardı bir zaman…', 2, 0.4), par(S('opts', { id: 'enc', opts: { play: true } }), sfx('kopuz')), spawn({ id: 'mem', kind: 'memoryShips', x: -side * 120, y: -80, layer: 4, opts: { a: 0.7 } }), T(2), ...[0.4, 0.1].map((a) => [S('opts', { id: 'mem', opts: { a } }), T(0.4)]), remove('mem')],
      (c) => [board('bd', 'bard', rail(side), rail(side), { dx: side * 6 }), work([], rail(side), 'Kopuzu deniyor', 2, 0.3), par(sfx('kopuzBad'), S('opts', { id: 'wnd', opts: { rev: true } }), S('sails', { state: 'furled' }), S('heel', { rot: -side * 0.05 })), T(0.8), S('heel', { rot: 0 }), S('sails', { state: 'full' }), S('opts', { id: 'wnd', opts: { rev: false } }), S('say', { actor: 'bd', text: 'Hahaha!', dur: 1.4, hold: 0.4 }), unboard('bd', rail(side))],
    ],
    exit: () => [...rm('wnd', 'mem'), offAll(rail(side)), ...driftAll()],
  })),

  // #117 Uçan Denizci
  EVT_EGG_117: def((ev, side) => ({
    setup: (c) => [spawn({ id: 'cl', kind: 'cliff', x: X(c, 190), y: -360, opts: { inventor: true } })],
    approach: (c) => [par(slow(5), cam({ x: side * 70, y: -20 }, 0.5, 0.94), move('cl', { y: -10 }, 3)), stop(), lookout('Kayalığın tepesinde biri… kanatlı!', { dur: 1.8 }),
      S('opts', { id: 'cl', opts: { inventor: false } }), spawn({ id: 'enc', kind: 'glider', x: X(c, 186), y: -10, layer: 4, opts: { alt: 64, wings: 1 } }), sfx('whistle'),
      move('enc', { x: X(c, 120), y: 0 }, 1.6), crewSay([], 'Uçuyor!', { dur: 1.2 })],
    intro: () => [T(0.3)],
    opts: [
      (c) => [move('enc', { x: X(c, 60), y: 10 }, 1.6), S('opts', { id: 'enc', opts: { alt: 30, wings: 1 } }), move('enc', { x: X(c, 40), y: 20 }, 1), par(S('opts', { id: 'enc', opts: { alt: 2, wings: 0.4, dip: true } }), fx('splash', 'enc', 22), sfx('splash')),
        spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor'], dir: side < 0 ? 'left' : 'right' } }), move('boat', { x: X(c, 30), y: 16 }, 1.4), remove('enc'), S('opts', { id: 'boat', opts: { npcs: ['sailor', 'inventor'], dir: side < 0 ? 'right' : 'left' } }), move('boat', { x: besides(c, 16, side), y: 0 }, 1.4), remove('boat'), float('Kurtarıldı!', '#9ae0a0')],
      (c, info) => [par(S('sails', { state: 'full' }), spawn({ id: 'wnd', kind: 'windStreaks', x: 0, y: -40, layer: 4, opts: {} }), sfx('depart')),
        ...(info.success ? [S('opts', { id: 'enc', opts: { alt: 70, wings: 1 } }), move('enc', { x: 0, y: -20 }, 1.6), move('enc', { x: -side * (c.beam / 2 + 90), y: 0 }, 1.6), par(sfx('cheer'), crewSay([], 'Geminin üstünden geçti!', { dur: 1.6 })), S('opts', { id: 'enc', opts: { alt: 4, wings: 0.4, dip: true } }), fx('splash', 'enc', 18)]
          : [S('opts', { id: 'enc', opts: { alt: 20, wings: 0.7 } }), move('enc', { x: X(c, 70), y: 10 }, 1), par(S('opts', { id: 'enc', opts: { alt: 2, wings: 0.3, dip: true } }), fx('splash', 'enc', 22), sfx('splash'))]),
        spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor'], dir: side < 0 ? 'left' : 'right' } }), remove('enc'), move('boat', { x: besides(c, 26, side), y: 10 }, 1), remove('boat'), remove('wnd')],
      (c) => [spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16, side), y: 0, opts: { npcs: ['sailor', 'sailor'], dir: side < 0 ? 'left' : 'right' } }), move('boat', { x: X(c, 60), y: 20 }, 1.6),
        move('enc', { x: X(c, 64), y: 18 }, 1.6), par(S('opts', { id: 'enc', opts: { alt: 2, wings: 0.4 } }), sfx('pickup')), remove('enc'), S('opts', { id: 'boat', opts: { npcs: ['sailor', 'inventor'], dir: side < 0 ? 'right' : 'left' } }), say('boat', 'Bir dahaki sefere daha uzun!', 1.8, 0.2), move('boat', { x: besides(c, 16, side), y: 0 }, 1.6), remove('boat')],
    ],
    exit: () => [...rm('enc', 'boat', 'wnd'), move('cl', { alpha: 0 }, 1.4), remove('cl'), go(30)],
  })),
};
