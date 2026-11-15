// Hayvanlara özel GEMİ İÇİ olay sahneleri. Hepsi güvertede geçer; her hayvan kendi karakteriyle oynar.
import { S, par, wait, def, rail, besides, cap, crewSay, only, say, slow, go, cam, sfx, spawn, move, remove, fx, float, work, gather, pet, board, unboard, deckProp, call, weather, lookout } from '../kit.js';

const T = (n) => wait(n);
const hidePet = (id, on = true) => call((d) => { const a = d.world.deck.actors.get(id); if (a) a.hidden = on; });
const deckCalm = (z = 1.08, y = 0) => par(slow(14), cam({ x: 0, y }, 0.3, z));

export const PET2_SCENES = {
  // ───────── Tarçın denize düşüyor ─────────
  EVT_PET2_TARCIN_OVERBOARD: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: (c) => [
      deckCalm(1.05),
      spawn({ id: 'gull', kind: 'gull', x: side * (c.beam / 2 - 4), y: -20, layer: 3, opts: {} }),
      pet('PET_TARCIN', { at: rail(side), pose: 'bark', dur: 3, say: 'Hav! Hav!', sfx: 'bark', task: 'Martıyı kovalıyor' }),
      T(1.6),
      par(move('gull', { x: side * 160, y: -120 }, 1.6), hidePet('PET_TARCIN'), spawn({ id: 'swim', kind: 'swimPet', x: besides(c, 18), y: 0, opts: { id: 'PET_TARCIN' } }), fx('splash', { rail: side }, 30), sfx('splash')),
      par(move('swim', { y: 70 }, 3, { ease: 'linear' }), crewSay([], 'Tarçın denize düştü!', { dur: 2 }), gather(rail(side), 'Köpeği izliyor', { n: 4, run: true, dur: 8 })),
    ],
    intro: () => [remove('gull'), T(0.2)],
    opts: [
      (c, info) => [work([], rail(side), 'Halat fırlatıyor', 3, 1), S('throw', { from: { rail: side }, to: 'swim', kind: 'rope', arc: 12 }), ...(info.success
        ? [move('swim', { x: besides(c, 6), y: 10 }, 1.8), par(remove('swim'), hidePet('PET_TARCIN', false), fx('splash', { rail: side }, 16)), pet('PET_TARCIN', { at: 'center', pose: 'wag', dur: 5, say: 'Hav!' }), crewSay([], 'Silkelendi… hepimiz ıslandık!', { dur: 2 })]
        : [S('throw', { from: { rail: side }, to: 'swim', kind: 'rope', arc: 12 }), par(S('shake', { amount: 4 }), sfx('creak'), crewSay([], 'Sandık devrildi!', { dur: 1.8 })), move('swim', { x: besides(c, 6), y: 10 }, 2), par(remove('swim'), hidePet('PET_TARCIN', false)), pet('PET_TARCIN', { at: 'center', pose: 'sit', dur: 4 })])],
      (c) => [par(work(['CREW_MIRA'], rail(side), 'Suya atlıyor', 2, 0.6), only('CREW_MIRA', 'Geliyorum küçük!', { dur: 1.8 })), par(fx('splash', 'swim', 26), sfx('splash')), T(1.2), move('swim', { x: besides(c, 6), y: 10 }, 1.6), par(remove('swim'), hidePet('PET_TARCIN', false), fx('splash', { rail: side }, 14)), pet('PET_TARCIN', { at: rail(side), pose: 'wag', dur: 6, say: 'Hav hav!' })],
      (c) => [gather(rail(side), 'Sandalı indiriyor', { n: 2, run: true, dur: 3 }), spawn({ id: 'boat', kind: 'rowboat', x: besides(c, 16), y: 0, opts: { npcs: ['sailor'], dir: 'down' } }), move('boat', { y: 60 }, 1.8), par(remove('swim')), S('opts', { id: 'boat', opts: { npcs: ['sailor'], dir: 'up' } }), move('boat', { y: 0 }, 1.8), par(remove('boat'), hidePet('PET_TARCIN', false)), pet('PET_TARCIN', { at: 'center', pose: 'wag', dur: 5 }), sfx('cheer')],
    ],
    exit: () => [remove('swim'), remove('gull'), hidePet('PET_TARCIN', false), go(30)],
  })),

  // ───────── Ambardaki kaçak ─────────
  EVT_PET2_TARCIN_STOWAWAY: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: () => [deckCalm(1.08, 10), pet('PET_TARCIN', { at: 'cargo', pose: 'bark', dur: 6, say: 'Hav! Hav! Hav!', sfx: 'bark', task: 'Ambar kapağına havlıyor' }), T(1.2), gather('cargo', 'Ambara bakıyor', { n: 3, dur: 6 }), board('kid', 'villager', 'cargo', 'cargo', { dx: 8, say: 'Lütfen… beni atmayın!' })],
    intro: () => [T(0.3)],
    opts: [
      () => [S('say', { actor: 'kid', text: 'Mutfağa yardım ederim!', dur: 2, hold: 0.4 }), unboard('kid', 'galley', { wait: true }), board('kid2', 'villager', 'galley', 'galley', { endState: 'work' }), pet('PET_TARCIN', { at: 'galley', pose: 'wag', dur: 6 }), crewSay([], 'Hoş geldin miço!', { dur: 1.8 }), sfx('cheer')],
      () => [cap('Limanda ailesine teslim ederiz.', 2.2, 0.6), S('say', { actor: 'kid', text: 'Annem çok kızacak…', dur: 2, hold: 0.4 }), float('Ödül sözü', '#ffd76a')],
      () => [pet('PET_TARCIN', { at: 'center', pose: 'wag', dur: 6, task: 'Çocukla oynuyor' }), S('say', { actor: 'kid', text: 'Hahaha! Yakala!', dur: 2, hold: 0.4 }), pet('PET_TARCIN', { at: 'bow', pose: 'wag', dur: 4 }), T(1)],
    ],
    exit: () => [S('cargoUse', { goods: [], at: 'cargo' }), go(30)],
  })),

  // ───────── Zıpır: ambarda fareler ─────────
  EVT_PET2_ZIPIR_RATS: def((ev, side) => ({
    mainId: null,
    setup: () => [deckProp('m1', 'mouse', 'cargo', { dx: -8 }), deckProp('m2', 'mouse', 'cargo', { dx: 10, dy: 6 })],
    approach: () => [deckCalm(1.1, 10), crewSay([], 'Çuvallar kemirilmiş!', { dur: 2 }), pet('PET_ZIPIR', { at: 'cargo', pose: 'sit', dur: 8, run: false, task: 'Kulaklarını dikti' })],
    intro: () => [T(0.3)],
    opts: [
      () => [pet('PET_ZIPIR', { at: 'cargo', dx: -8, pose: 'sit', dur: 3, task: 'Sinsice yaklaşıyor' }), T(1.4), par(remove('m1'), sfx('squawk')), pet('PET_ZIPIR', { at: 'cargo', dx: 10, pose: 'sit', dur: 3 }), T(1), par(remove('m2'), fx('spark', 'ship', 8)), pet('PET_ZIPIR', { at: 'center', pose: 'sleep', dur: 8 }), crewSay([], 'Ambar temiz!', { dur: 1.8 })],
      () => [par(work(['CREW_PITA'], 'cargo', 'Peynirli tuzak kuruyor', 4, 1), only('CREW_PITA', 'Gelin bakalım küçükler…', { dur: 2 })), T(0.6), par(remove('m1'), remove('m2'), sfx('hook')), S('coins', { from: 'ship', to: { x: 0, y: 20 }, n: 4 })],
      () => [pet('PET_ZIPIR', { at: 'center', pose: 'sleep', dur: 8 }), T(1.4), crewSay([], 'Bir sandık daha kemirilmiş…', { dur: 2 })],
    ],
    exit: () => [remove('m1'), remove('m2'), go(30)],
  })),

  // ───────── Zıpır: gözcü yerinde ─────────
  EVT_PET2_ZIPIR_NEST: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ preset: 'storm', dark: 0.06 })],
    setup: () => [],
    approach: () => [deckCalm(1.06, -10), pet('PET_ZIPIR', { at: 'mast', pose: 'climb', dur: 20, task: 'Gözcü sepetine kuruldu' }), T(1.2), par(S('heel', { rot: 0.05 }), sfx('creak')), lookout('Zıpır gözcü sepetinde! Direk sallanıyor!', { dur: 2.2 }), S('heel', { rot: 0 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [work(['CREW_TOBIAS'], 'mast', 'Direğe tırmanıyor', 4, 1), ...(info.success ? [pet('PET_ZIPIR', { at: 'mast', pose: 'sit', dur: 4 }), crewSay(['CREW_TOBIAS'], 'Yakaladım! Uzakta bir şey var…', { dur: 2.2 })] : [par(S('shake', { amount: 6 }), sfx('creak'), fx('splinter', 'ship', 14), crewSay([], 'Kasnak kırıldı!', { dur: 1.8 })), pet('PET_ZIPIR', { at: 'center', pose: 'sit', dur: 5 })])],
      () => [gather('cargo', 'Balık getiriyor', { n: 1, dur: 2 }), deckProp('fish', 'fishPlate', 'mast', { dx: 6 }), T(0.6), pet('PET_ZIPIR', { at: 'mast', dx: 6, pose: 'sit', dur: 6, task: 'Balığa kondu' }), remove('fish')],
      () => [T(2), par(weather({ dark: 0 }), cap('Fırtına dindi… ve Zıpır iniyor.', 2.2, 0.6)), pet('PET_ZIPIR', { at: 'center', pose: 'sleep', dur: 8 })],
    ],
    exit: () => [remove('fish'), weather({ restore: true }), go(30)],
  })),

  // ───────── Eski Dostlar: kovalamaca ─────────
  EVT_PET2_OLD_FRIENDS_PLAY: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: () => [deckCalm(1.08), pet('PET_TARCIN', { at: 'bow', pose: 'wag', dur: 2, task: 'İpi kaptı' }), pet('PET_ZIPIR', { at: 'bow', dx: 10, pose: 'sit', dur: 2, task: 'Peşine düştü' }), T(1), pet('PET_TARCIN', { at: 'cargo', pose: 'wag', dur: 2 }), pet('PET_ZIPIR', { at: 'cargo', dx: -8, pose: 'sit', dur: 2 }), gather('center', 'Kovalamacayı izliyor', { n: 4, dur: 8 }), crewSay([], 'Hadi Zıpır, yakala onu!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [pet('PET_TARCIN', { at: 'stern', pose: 'wag', dur: 2 }), pet('PET_ZIPIR', { at: 'stern', dx: 8, pose: 'sit', dur: 2 }), T(1.2), par(S('shake', { amount: 3 }), sfx('creak'), deckProp('bar', 'barrel', 'cargo', { dx: 10 })), info.text?.includes('kese') ? par(fx('gold', 'ship', 12), sfx('coin')) : T(0.4), pet('PET_TARCIN', { at: 'center', pose: 'sleep', dur: 10 }), pet('PET_ZIPIR', { at: 'center', dx: 7, pose: 'sleep', dur: 10 }), par(sfx('cheer'), crewSay([], 'Bu ikisi ayrılmaz.', { dur: 2.2 }))],
      () => [cap('Hadi millet, işe!', 1.8, 0.6), pet('PET_TARCIN', { at: 'center', pose: 'sit', dur: 4 }), pet('PET_ZIPIR', { at: 'center', dx: 7, pose: 'sit', dur: 4 })],
    ],
    exit: () => [remove('bar'), go(30)],
  })),

  // ───────── Kırmızı: kaptanın şapkası ─────────
  EVT_PET2_KIRMIZI_HAT: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: () => [deckCalm(1.06, -10), pet('PET_KIRMIZI', { at: 'helm', dur: 2 }), T(1.2), pet('PET_KIRMIZI', { at: 'mast', dur: 8, say: 'Kaptan benim! Kaptan benim!', sfx: 'squawk' }), cap('Şapkam!', 1.6, 0.4)],
    intro: () => [T(0.3)],
    opts: [
      () => [work(['CAPTAIN'], 'mast', 'Fıstık uzatıyor', 3, 1), pet('PET_KIRMIZI', { at: 'helm', dur: 5, say: 'Fıstık! Fıstık!' }), sfx('cheer')],
      () => [par(work(['CAPTAIN'], 'center', 'Şarkı söylüyor', 4), gather('center', 'Şarkıya eşlik ediyor', { n: 4, dur: 6 })), par(S('say', { prefer: ['PET_KIRMIZI'], text: '♪ Yo-ho! Yo-ho! ♪', dur: 2.6 }), sfx('squawk'), deckProp('notes', 'sparkles', 'center', { opts: { r: 22, col: '#ffe080' } })), crewSay([], '♪ Yelkenler rüzgâra! ♪', { dur: 2.4 }), remove('notes')],
      (c, info) => [work(['CAPTAIN'], 'mast', 'Halatlara tırmanıyor', 3, 1), ...(info.success ? [cap('Aldım!', 1.4, 0.4), pet('PET_KIRMIZI', { at: 'bow', dur: 5, say: 'Hmph!' })] : [par(S('throw', { from: 'ship', to: { x: side * 120, y: -20 }, kind: 'bottle', arc: 18, burst: 'splash' }), pet('PET_KIRMIZI', { at: 'mast', dur: 5, say: 'Hahaha!', sfx: 'squawk' })), cap('Şapkam denizde…', 1.8, 0.6)])],
    ],
    exit: () => [remove('notes'), go(30)],
  })),

  // ───────── Gece Yarısı: kabaran tüyler ─────────
  EVT_PET2_GECEYARISI_OMEN: def((ev, side) => ({
    mainId: null,
    weather: () => [weather({ night: true, preset: 'dark' })],
    setup: () => [],
    approach: () => [deckCalm(1.08, -10), pet('PET_GECEYARISI', { at: 'helm', dur: 8, fluff: 8, say: 'Kraaa…', sfx: 'squawk' }), T(1), crewSay([], 'Tüyleri diken diken… iyi değil bu.', { dur: 2.4 })],
    intro: () => [T(0.3)],
    opts: [
      () => [par(cap('Yelkenleri toplayın, halatları iki kat bağlayın!', 2.4, 0.4), S('sails', { state: 'furled' })), gather('mast', 'Halatları bağlıyor', { n: 4, run: true, dur: 5 }), sfx('rope'), pet('PET_GECEYARISI', { at: 'mast', dur: 4 })],
      () => [work(['CAPTAIN'], 'helm', 'Kafesin üstünü örtüyor', 3, 1), deckProp('cloth', 'bedroll', 'helm', { dx: 6 }), crewSay([], '…', { dur: 1.4 })],
    ],
    exit: () => [remove('cloth'), weather({ restore: true }), go(30)],
  })),

  // ───────── Cüce Kaptan: pusula hırsızı ─────────
  EVT_PET2_CUCE_COMPASS: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: () => [deckCalm(1.06, -10), cap('Pusula nerede?!', 1.6, 0.4), pet('PET_CUCE', { at: 'mast', pose: 'hold', dur: 10, task: 'Pusulanın iğnesini izliyor' }), T(1), lookout('Direğin tepesinde! Cüce Kaptan!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [gather('mast', 'Maymunu kovalıyor', { n: 3, run: true, dur: 4 }), pet('PET_CUCE', { at: 'bow', pose: 'hold', dur: 3 }), pet('PET_CUCE', { at: 'stern', pose: 'hold', dur: 3 }), ...(info.success ? [cap('Yakaladım! Pusula geri geldi.', 2, 0.4)] : [par(S('heel', { rot: side * 0.06 }), S('shipTo', { x: side * 18 })), crewSay([], 'Rotadan çıktık!', { dur: 1.8 }), S('heel', { rot: 0 })])],
      () => [work(['CAPTAIN'], 'mast', 'Muz uzatıyor', 3, 1), pet('PET_CUCE', { at: 'center', pose: 'sit', dur: 6, task: 'Muz yiyor' }), sfx('pickup')],
      () => [work(['CAPTAIN'], 'helm', 'Yedek pusulayla dümen tutuyor', 4)],
    ],
    exit: () => [go(30)],
  })),

  // ───────── Kaşif: martının hediyesi ─────────
  EVT_PET2_MARTI_GIFT: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: (c) => [deckCalm(1.06), pet('PET_MARTI', { at: { x: c.world.layout().cx + side * 60, y: c.world.layout().center.y - 30 }, dur: 2 }), T(1.2), par(fx('splash', { x: side * 60, y: -30 }, 18), sfx('splash')), pet('PET_MARTI', { at: 'center', dur: 8, say: 'Kyaa!' }), deckProp('shiny', 'sparkles', 'center', { opts: { r: 6, col: '#ffe080' } }), crewSay([], 'Gagasında bir şey parlıyor!', { dur: 2 })],
    intro: () => [T(0.3)],
    opts: [
      () => [gather('cargo', 'Balık getiriyor', { n: 1, dur: 2 }), deckProp('fish', 'fishPlate', 'center', { dx: 8 }), T(0.8), par(remove('fish'), remove('shiny'), S('icon', { icon: 'gift', from: { x: 0, y: 0 }, to: 'ship' }), sfx('coin')), pet('PET_MARTI', { at: 'mast', dur: 6 })],
      (c, info) => [work(['CAPTAIN'], 'center', 'Martının başını okşuyor', 3, 1), ...(info.text?.includes('bozukluk') ? [par(remove('shiny'), fx('gold', 'ship', 8), sfx('coin'))] : [par(remove('shiny')), pet('PET_MARTI', { at: { x: c.world.layout().cx + side * 120, y: c.world.layout().center.y - 80 }, dur: 3, say: 'Kyaa!' })])],
    ],
    exit: () => [remove('shiny'), remove('fish'), go(30)],
  })),

  // ───────── Bilge: kabuktaki çizikler ─────────
  EVT_PET2_KAPLUMBAGA_SHELL: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: () => [deckCalm(1.12, 10), pet('PET_KAPLUMBAGA', { at: 'center', pose: 'sit', dur: 12, run: false, task: 'Güneşleniyor' }), T(1.6), deckProp('glint', 'glowRing', 'center', { opts: { col: '#c8e0a0' } }), crewSay([], 'Kabuğunda… bir harita mı var?', { dur: 2.2 })],
    intro: () => [T(0.3)],
    opts: [
      () => [par(deckProp('table', 'mapTable', 'center', { dx: 14 }), work(['CAPTAIN', 'CREW_COMPASS'], 'center', 'Çizikleri kopyalıyor', 5, 1.2)), sfx('page'), cap('Akıntılar… ve bir sığlık. Önümüzde!', 2.4, 0.6), remove('table')],
      () => [work([], 'center', 'Kabuğu bezle siliyor', 4, 1), pet('PET_KAPLUMBAGA', { pose: 'sleep', dur: 10, task: 'Keyifle uzandı' }), par(fx('spark', 'ship', 10), sfx('magic'))],
    ],
    exit: () => [remove('glint'), remove('table'), go(30)],
  })),

  // ───────── Fındık: kayıp gelincik ─────────
  EVT_PET2_GELINCIK_TUNNEL: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: () => [deckCalm(1.1, 10), pet('PET_GELINCIK', { at: 'cargo', pose: 'walk0', dur: 2, task: 'Sandıkların arasına daldı' }), T(1), hidePet('PET_GELINCIK'), par(S('shake', { amount: 2 }), sfx('creak')), crewSay([], 'Fındık nerede? Ambarın dibinden ses geliyor…', { dur: 2.4 })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [gather('cargo', 'Sandıkları kaldırıyor', { n: 3, run: true, dur: 5 }), deckProp('box', 'chestOpen', 'cargo', { dx: 8 }), hidePet('PET_GELINCIK', false), pet('PET_GELINCIK', { at: 'cargo', pose: 'hold', dur: 4, task: 'Ganimetini gösteriyor' }), info.text?.includes('kese') ? par(fx('gold', 'ship', 12), sfx('chest')) : info.text?.includes('fare') ? par(deckProp('m1', 'mouse', 'cargo', { dx: -6 }), crewSay([], 'Fare yuvası!', { dur: 1.6 })) : crewSay(['CREW_HAMID', 'CREW_PITA'], 'Tespihim! Kaşığım!', { dur: 2 })],
      () => [T(2), hidePet('PET_GELINCIK', false), pet('PET_GELINCIK', { at: 'center', pose: 'hold', dur: 3 }), par(fx('gold', 'ship', 6), sfx('coin')), pet('PET_GELINCIK', { pose: 'sleep', dur: 8 })],
    ],
    exit: () => [remove('box'), remove('m1'), hidePet('PET_GELINCIK', false), go(30)],
  })),

  // ───────── Mürekkep: kepçe hırsızı ─────────
  EVT_PET2_AHTAPOT_LADLE: def((ev, side) => ({
    mainId: null,
    setup: () => [],
    approach: () => [deckCalm(1.08, 10), pet('PET_AHTAPOT', { at: 'galley', pose: 'wag0', dur: 2, task: 'Kepçeyi kaptı' }), crewSay(['CREW_PITA'], 'Kepçem! Geri ver onu!', { dur: 2 }), pet('PET_AHTAPOT', { at: 'center', pose: 'wag1', dur: 8, run: false, task: 'Sekiz kolla kaçıyor' }), deckProp('ink1', 'inkCloud', 'galley', { opts: { r: 8 } })],
    intro: () => [T(0.3)],
    opts: [
      (c, info) => [gather('center', 'Ahtapotu yakalamaya çalışıyor', { n: 3, run: true, dur: 4 }), ...(info.success ? [pet('PET_AHTAPOT', { at: 'galley', pose: 'sit', dur: 6, task: 'Küs bekliyor' }), crewSay([], 'Kepçe bizde!', { dur: 1.6 })] : [par(pet('PET_AHTAPOT', { pose: 'bark', dur: 3 }), deckProp('ink2', 'inkCloud', 'cargo', { opts: { r: 16 } }), sfx('splash')), crewSay([], 'Her yer mürekkep!', { dur: 1.8 })])],
      () => [gather('cargo', 'Balık getiriyor', { n: 1, dur: 2 }), deckProp('fish', 'fishPlate', 'galley'), T(0.6), pet('PET_AHTAPOT', { at: 'galley', pose: 'wag0', dur: 6 }), par(remove('fish'), sfx('cheer'))],
      () => [pet('PET_AHTAPOT', { at: 'galley', pose: 'wag1', dur: 3, task: 'Fıçıda dibe dalıyor' }), T(1.4), par(fx('splash', 'ship', 10), fx('gold', 'ship', 8), sfx('coin')), crewSay([], 'Sikke! Fıçının dibinde sikke!', { dur: 2 })],
    ],
    exit: () => [remove('ink1'), remove('ink2'), remove('fish'), go(30)],
  })),
};
