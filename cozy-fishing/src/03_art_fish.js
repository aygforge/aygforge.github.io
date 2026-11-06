/* =====================================================================
   03_art_fish.js : 42 türün her biri için özgün anatomik piksel sprite tanımları
   (gövde profili, yüzgeç/kuyruk tipi, renk, desen ve özel organlar)
   ===================================================================== */
const FISH_DEF = {
  L: 32, D: 0.2, mx: 0.38, nose: 0.8, n0: 0.12, ped: 0.3, tp: 1.6, topR: 0.52, tl: 0.2, tail: 'fork', tailH: 1.0, lowerLobe: 1,
  dorsal: [], anal: [], pelvic: { u: 0.38, w: 0.08, h: 0.18 }, pect: { u: 0.24, v: 0.25, len: 0.13, h: 0.18 },
  back: '#456677', side: '#9ab0bb', belly: '#eef2f4', fin: null, tailC: null, eye: { u: 0.1, v: 0.3 }, ring: '#d8d4c0',
  pat: [], backTo: -0.25, bellyFrom: 0.35, gill: 0.22, mouthLen: 0.06, hump: 0, humpU: 0.2
};
const FISH_ART = {
  sardalya: { L: 30, D: .2, mx: .36, nose: .75, ped: .28, tailH: 1.15, dorsal: [[.4, .56, .42, 'tri']], anal: [[.74, .88, .16, 'low']], back: '#2d5d88', side: '#8fb2c8', belly: '#eef3f7', fin: '#a9bccb', backTo: -.3, bellyFrom: .25, pat: [{ t: 'dotsrow', n: 5, u0: .24, u1: .62, v: -.2, r: .8, c: '#1d3550' }, { t: 'hs', v: .02, w: 1, c: '#d6e6f0', u0: .2, u1: .95 }] },
  gumus_baligi: { L: 26, D: .15, mx: .4, nose: .85, ped: .32, tailH: 1.25, dorsal: [[.36, .46, .32, 'tri'], [.58, .68, .28, 'tri']], anal: [[.58, .74, .2, 'low']], back: '#86ab95', side: '#cfe2d8', belly: '#f6faf7', fin: '#c6d8cc', eye: { u: .11, v: .3, big: 1.3 }, pat: [{ t: 'hs', v: .05, w: 2, c: '#ffffff', u0: .15, u1: .97 }, { t: 'hs', v: -.22, w: 1, c: '#557a68', u0: .2, u1: .95 }] },
  istavrit: { L: 32, D: .2, mx: .34, nose: .75, ped: .16, tailH: 1.3, dorsal: [[.3, .44, .36, 'spiny'], [.47, .86, .2, 'low']], anal: [[.56, .86, .16, 'low']], back: '#3b6d7c', side: '#b4cbd0', belly: '#eef2ef', fin: '#9fb6bb', eye: { u: .1, v: .28, big: 1.4 }, pat: [{ t: 'scutes', c: '#2f4a52', c2: '#d8e4e6', u0: .25, u1: .98, fn: u => u < .5 ? -.38 + (u - .25) * 1.3 : -.06 }, { t: 'blotch', u: .21, v: -.35, ru: 1.2, rv: 1.2, c: '#1f2f36' }] },
  izmarit: { L: 30, D: .22, mx: .4, nose: .85, ped: .3, tailH: 1.1, dorsal: [[.3, .76, .26, 'low']], anal: [[.6, .82, .16, 'low']], back: '#5b6c84', side: '#adb7c6', belly: '#e8eaef', fin: '#9aa4b4', pat: [{ t: 'hs', v: -.5, w: 1, c: '#7d98c4', u0: .2, u1: .9 }, { t: 'hs', v: -.18, w: 1, c: '#7d98c4', u0: .25, u1: .9 }, { t: 'blotch', u: .46, v: -.05, ru: 2, rv: 3, c: '#262e3c' }] },
  kefal: { L: 40, D: .2, mx: .32, nose: .5, n0: .3, ped: .34, tail: 'emarg', tailH: 1.15, dorsal: [[.36, .46, .32, 'spiny'], [.58, .68, .26, 'tri']], anal: [[.62, .74, .18, 'tri']], back: '#4c5960', side: '#a6b0b5', belly: '#e3e6e5', fin: '#7d888e', eye: { u: .08, v: .25 }, ring: '#c8c08a', pat: [{ t: 'hs', v: -.62, w: 1, c: '#3a454b', u0: .15, u1: .95 }, { t: 'hs', v: -.35, w: 1, c: '#6a757b', u0: .15, u1: .95 }, { t: 'hs', v: -.06, w: 1, c: '#7f8a90', u0: .18, u1: .95 }, { t: 'hs', v: .22, w: 1, c: '#98a2a7', u0: .2, u1: .9 }] },
  zargana: { L: 48, D: .07, mx: .5, nose: 1, n0: .35, ped: .55, tp: 1, tl: .11, tailH: 2.2, bill: 12, beak: true, billC: '#3d7f79', dorsal: [[.74, .88, .7, 'tri']], anal: [[.72, .87, .7, 'tri']], pelvic: { u: .55, w: .06, h: .5 }, pect: { u: .12, v: .2, len: .06, h: .5 }, back: '#2d6e6a', side: '#9fcdc8', belly: '#f0f6f2', fin: '#6aa8a0', eye: { u: .045, v: .2 }, backTo: -.15, bellyFrom: .3, pat: [{ t: 'hs', v: .1, w: 1, c: '#e6f4f0', u0: .05, u1: .95 }], gill: .08 },
  isparoz: { L: 28, D: .4, mx: .42, nose: .6, ped: .2, dorsal: [[.24, .76, .24, 'spiny']], anal: [[.62, .82, .22, 'tri']], pelvic: { u: .36, w: .08, h: .2, c: '#e8c64a' }, back: '#9a9e74', side: '#d8d5b6', belly: '#f3f0de', fin: '#c8c49a', eye: { u: .12, v: .32, big: 1.2 }, pat: [{ t: 'vbars', n: 5, u0: .25, u1: .7, w: 2, c: '#c2c29c', v0: -1, v1: .4 }, { t: 'vbars', n: 1, u0: .93, u1: .93, w: 3, c: '#2a2a24', v0: -1, v1: 1 }] },
  melanur: { L: 32, D: .3, mx: .4, nose: .75, ped: .26, tailH: 1.15, dorsal: [[.28, .78, .2, 'spiny']], anal: [[.62, .82, .17, 'low']], back: '#6c7c8a', side: '#c0c9d0', belly: '#edf0f2', fin: '#a2adb6', eye: { u: .11, v: .28, big: 1.5 }, pat: [{ t: 'lat', c: '#8a97a2', v: -.35, curve: .2, u0: .2, u1: .9 }, { t: 'blotch', u: .93, v: 0, ru: 2.6, rv: 6, c: '#f8f8f2' }, { t: 'blotch', u: .93, v: 0, ru: 1.8, rv: 5, c: '#111316' }] },
  karagoz: { L: 32, D: .38, mx: .42, nose: .6, ped: .22, dorsal: [[.24, .76, .24, 'spiny']], anal: [[.62, .82, .2, 'tri']], back: '#8b8c84', side: '#d2d1c6', belly: '#f0efe6', fin: '#aaa99c', eye: { u: .12, v: .3, big: 1.2 }, pat: [{ t: 'hs', v: -.5, w: 1, c: '#c4b47c', u0: .25, u1: .85 }, { t: 'hs', v: -.1, w: 1, c: '#c4b47c', u0: .25, u1: .85 }, { t: 'hs', v: .25, w: 1, c: '#c8bc8c', u0: .25, u1: .8 }, { t: 'vbars', n: 1, u0: .21, u1: .21, w: 3, c: '#24221e', v0: -1, v1: .55 }, { t: 'vbars', n: 1, u0: .9, u1: .9, w: 3, c: '#24221e', v0: -1, v1: 1 }] },
  cipura: { L: 36, D: .42, mx: .38, nose: .5, n0: .2, ped: .2, tailH: 1.2, dorsal: [[.24, .76, .22, 'spiny']], anal: [[.62, .82, .2, 'tri']], back: '#7a8894', side: '#c6cdd3', belly: '#eef0f2', fin: '#8e98a2', tailC: '#6e7a86', tailEdge: '#3e4650', eye: { u: .13, v: .3 }, pat: [{ t: 'hs', v: -.45, w: 1, c: '#a7b1b9', u0: .25, u1: .9 }, { t: 'hs', v: -.1, w: 1, c: '#a7b1b9', u0: .25, u1: .9 }, { t: 'hs', v: .25, w: 1, c: '#b6bec5', u0: .3, u1: .85 }, { t: 'band', u: .1, w: 2, c: '#eab52c', v0: -1, v1: -.42 }, { t: 'blotch', u: .22, v: -.42, ru: 1.5, rv: 1.5, c: '#3b4048' }] },
  sargoz: { L: 34, D: .37, mx: .42, nose: .6, ped: .22, dorsal: [[.24, .76, .24, 'spiny']], anal: [[.62, .82, .2, 'tri']], back: '#999a92', side: '#dbdbd3', belly: '#f4f4ef', fin: '#b0b0a6', tailEdge: '#2a2c2e', eye: { u: .12, v: .3, big: 1.2 }, pat: [{ t: 'vbars', n: 9, u0: .18, u1: .8, w: 1.3, c: '#44474a', c2: '#7b7e80', v0: -1, v1: .45 }, { t: 'vbars', n: 1, u0: .92, u1: .92, w: 3, c: '#18191b', v0: -.8, v1: .8 }] },
  levrek: { L: 42, D: .22, mx: .38, nose: .85, ped: .3, tail: 'emarg', tailH: 1.1, dorsal: [[.3, .45, .34, 'spiny'], [.52, .7, .24, 'tri']], anal: [[.62, .76, .2, 'tri']], back: '#4e6170', side: '#b2bec6', belly: '#eef1f3', fin: '#8a98a3', eye: { u: .1, v: .3 }, ring: '#d6dce0', mouthLen: .1, pat: [{ t: 'lat', c: '#6f7f8b', v: -.2, curve: .15, u0: .24, u1: .96 }, { t: 'blotch', u: .22, v: -.35, ru: 1.4, rv: 1.4, c: '#26323b' }] },
  tekir: { L: 30, D: .22, mx: .34, nose: .45, n0: .25, ped: .3, tailH: 1.1, dorsal: [[.3, .42, .38, 'spiny', '#e98e72', 'stripe'], [.55, .68, .24, 'tri']], anal: [[.6, .72, .16, 'tri']], back: '#c44f48', side: '#e48c76', belly: '#f6e2d6', fin: '#eaa78e', barbels: true, eye: { u: .13, v: .4 }, ring: '#e8c050', pat: [{ t: 'hs', v: -.25, w: 1, c: '#f2c94c', u0: .18, u1: .9 }, { t: 'hs', v: .05, w: 1, c: '#f2c94c', u0: .18, u1: .9 }, { t: 'hs', v: .35, w: 1, c: '#f0d070', u0: .2, u1: .85 }] },
  barbun: { L: 32, D: .22, mx: .32, nose: .35, n0: .3, ped: .3, dorsal: [[.3, .42, .34, 'spiny'], [.55, .68, .24, 'tri']], anal: [[.6, .72, .16, 'tri']], back: '#cf6764', side: '#eb9f95', belly: '#fae7e2', fin: '#f0b4aa', barbels: true, eye: { u: .13, v: .42 }, ring: '#e8b090', pat: [{ t: 'lat', c: '#d47d76', v: -.15, curve: .1, u0: .2, u1: .95 }] },
  eskina: { L: 38, D: .3, mx: .34, nose: .6, ped: .32, topR: .6, hump: .12, humpU: .3, tail: 'trunc', dorsal: [[.24, .44, .3, 'spiny'], [.46, .82, .2, 'low']], anal: [[.66, .77, .28, 'tri', '#1e1610']], pelvic: { u: .34, w: .08, h: .3, c: '#1e1610' }, back: '#4a3a2b', side: '#876848', belly: '#c6a680', fin: '#3a2c20', eye: { u: .11, v: .3 }, ring: '#c8a050', pat: [{ t: 'dots', c: '#b08a52', d: .12, v0: -.8, v1: .3, u0: .1, u1: .9, seed: 5 }] },
  mercan: { L: 36, D: .28, mx: .38, nose: .72, ped: .25, tailH: 1.1, dorsal: [[.26, .76, .2, 'spiny']], anal: [[.62, .82, .17, 'tri']], back: '#d6707a', side: '#efa5a6', belly: '#fbe5e2', fin: '#f2b3b0', eye: { u: .12, v: .3 }, ring: '#f0d0c0', pat: [{ t: 'dots', c: '#7fb6e8', d: .09, v0: -.95, v1: .1, u0: .15, u1: .85, seed: 11 }] },
  fangri: { L: 40, D: .34, mx: .38, nose: .55, n0: .18, ped: .22, tailH: 1.25, dorsal: [[.24, .76, .24, 'spiny']], anal: [[.62, .82, .2, 'tri']], back: '#c45b56', side: '#e69e88', belly: '#f6e2d6', fin: '#e08a7a', tailTip: '#f4e8e0', eye: { u: .12, v: .32 }, pat: [{ t: 'dots', c: '#8cc0e8', d: .05, v0: -.9, v1: -.3, u0: .15, u1: .7, seed: 3 }, { t: 'hs', v: .15, w: 2, c: '#f0c8a8', u0: .25, u1: .8 }] },
  sinarit: { L: 46, D: .3, mx: .35, nose: .5, n0: .2, ped: .24, hump: .1, humpU: .15, tailH: 1.15, dorsal: [[.24, .75, .22, 'spiny']], anal: [[.62, .8, .2, 'tri']], back: '#5d6d88', side: '#b2b8c4', belly: '#e8e8ec', fin: '#c2a2a8', teeth: true, mouthLen: .1, eye: { u: .13, v: .3 }, pat: [{ t: 'dots', c: '#36405a', d: .08, v0: -.9, v1: 0, u0: .15, u1: .85, seed: 7 }] },
  kolyoz: { L: 38, D: .17, mx: .4, nose: .85, ped: .2, tailH: 1.3, dorsal: [[.24, .38, .28, 'spiny'], [.55, .64, .22, 'tri']], anal: [[.57, .66, .2, 'tri']], finlets: 4, finletC: '#6a9a8a', back: '#3e7878', side: '#b6cec6', belly: '#eef3ef', fin: '#7fa69c', backTo: -.15, pat: [{ t: 'wavy', c: '#23434a', v0: -1, v1: -.2, per: 4, amp: 1.2, w: 1 }, { t: 'dots', c: '#8a9ea2', d: .18, v0: .1, v1: .45, u0: .2, u1: .8, seed: 9 }] },
  uskumru: { L: 40, D: .16, mx: .42, nose: .85, ped: .18, tailH: 1.35, dorsal: [[.22, .36, .28, 'spiny'], [.55, .64, .22, 'tri']], anal: [[.57, .66, .2, 'tri']], finlets: 5, finletC: '#3a6a7a', back: '#2c6c90', side: '#c6dade', belly: '#f6f8f8', fin: '#5e8aa0', backTo: -.1, bellyFrom: .2, pat: [{ t: 'wavy', c: '#0f1e2a', v0: -1, v1: -.1, per: 4, amp: 1.6, w: 2 }] },
  lufer: { L: 44, D: .22, mx: .4, nose: .8, ped: .25, tailH: 1.2, dorsal: [[.3, .42, .2, 'spiny'], [.46, .76, .24, 'tri']], anal: [[.52, .76, .2, 'tri']], back: '#3b6e84', side: '#a6c2cb', belly: '#eef3f3', fin: '#7ea0ae', teeth: true, mouthLen: .11, eye: { u: .1, v: .3 }, ring: '#e8c84a', pat: [{ t: 'blotch', u: .27, v: .15, ru: 1.5, rv: 2, c: '#1d2f38' }] },
  palamut: { L: 46, D: .2, mx: .42, nose: .88, ped: .14, tail: 'lunate', tailH: 1.45, dorsal: [[.22, .46, .2, 'spiny'], [.52, .6, .2, 'sickle']], anal: [[.56, .64, .18, 'sickle']], finlets: 7, finletC: '#4a6a8a', back: '#2b4e78', side: '#b2c2d2', belly: '#f0f2f4', fin: '#5a7a9a', backTo: -.1, pat: [{ t: 'oblique', c: '#16294a', v0: -1, v1: -.12, per: 4, slope: 1.4, w: 1 }] },
  yazili_orkinos: { L: 48, D: .22, mx: .4, nose: .85, ped: .12, tail: 'lunate', tailH: 1.4, dorsal: [[.22, .42, .26, 'spiny'], [.5, .58, .18, 'sickle']], anal: [[.55, .62, .16, 'sickle']], finlets: 7, finletC: '#3a5a7a', back: '#284c6c', side: '#b6c4ce', belly: '#f2f4f6', fin: '#4a6a8a', backTo: -.1, pat: [{ t: 'worm', c: '#142c46', v1: -.12, u0: .4 }, { t: 'dotsrow', n: 4, u0: .26, u1: .36, v: .25, r: .9, c: '#24323e' }] },
  akya: { L: 52, D: .26, mx: .42, nose: .75, ped: .14, tail: 'dfork', tailH: 1.35, dorsal: [[.28, .4, .12, 'spiny'], [.45, .72, .32, 'sickle']], anal: [[.55, .72, .28, 'sickle']], back: '#56666a', side: '#c3cac6', belly: '#f0f2ee', fin: '#7a8a8c', tailEdge: '#2a3236', eye: { u: .1, v: .3 }, pat: [{ t: 'lat', c: '#2f393c', fn: u => u < .4 ? -.6 + u * 1.7 : .08 + Math.sin(u * 30) * .05, u0: .18, u1: .97 }] },
  ringa: { L: 34, D: .2, mx: .42, nose: .9, ped: .25, tailH: 1.2, dorsal: [[.42, .56, .32, 'tri']], anal: [[.76, .88, .12, 'low']], back: '#2e5c7a', side: '#c3d3dc', belly: '#f3f6f8', fin: '#9cb2c0', backTo: -.35, pat: [{ t: 'hs', v: -.1, w: 1, c: '#e4ecf2', u0: .15, u1: .95 }, { t: 'hs', v: -.32, w: 1, c: '#a9a3c6', u0: .2, u1: .9 }] },
  mezgit: { L: 38, D: .18, mx: .34, nose: .8, ped: .2, tail: 'trunc', dorsal: [[.32, .42, .24, 'round'], [.46, .6, .2, 'round'], [.65, .8, .18, 'round']], anal: [[.4, .6, .15, 'round'], [.64, .8, .14, 'round']], back: '#a29578', side: '#d8d2c2', belly: '#f2efe8', fin: '#b8ac92', pat: [{ t: 'lat', c: '#8a7a5a', v: -.25, curve: .15, u0: .22, u1: .97 }, { t: 'blotch', u: .25, v: .18, ru: 1, rv: 1, c: '#3a3428' }] },
  pisi_baligi: { L: 36, D: .5, mx: .45, nose: .6, n0: .25, ped: .18, tail: 'round', tl: .15, tailH: .9, flat: true, dorsal: [[.08, .9, .12, 'fringe']], anal: [[.24, .9, .12, 'fringe']], pelvic: null, pect: { u: .22, v: -.1, len: .1, h: .12 }, back: '#7a6a49', side: '#857552', belly: '#8f7f5a', fin: '#6a5c40', backTo: -2, bellyFrom: 2, gill: 0, pat: [{ t: 'mottle', c: '#6a5c3e', scale: 3, th: .65, seed: 4 }, { t: 'spots', n: 11, c: '#e8742a', r: 1.3, u0: .15, u1: .85, v0: -.75, v1: .75, seed: 21 }] },
  morina: { L: 48, D: .24, mx: .34, nose: .6, n0: .2, ped: .22, tail: 'trunc', tailH: 1.05, dorsal: [[.3, .42, .26, 'round'], [.45, .62, .22, 'round'], [.66, .82, .2, 'round']], anal: [[.42, .62, .18, 'round'], [.66, .82, .16, 'round']], chinBarbel: true, back: '#6c6844', side: '#a69e70', belly: '#e8e2c8', fin: '#8a845a', pat: [{ t: 'mottle', c: '#4f4a2e', scale: 2.2, th: .62, v1: .3, seed: 8 }, { t: 'lat', c: '#ece4c4', v: -.2, curve: .25, u0: .22, u1: .97 }] },
  komur_baligi: { L: 46, D: .2, mx: .38, nose: .8, ped: .2, tail: 'emarg', tailH: 1.15, dorsal: [[.3, .42, .24, 'round'], [.45, .62, .2, 'round'], [.66, .82, .18, 'round']], anal: [[.42, .62, .16, 'round'], [.66, .82, .15, 'round']], back: '#2b3137', side: '#7a838b', belly: '#d2d6da', fin: '#4a5258', pat: [{ t: 'lat', c: '#c6cbd0', v: -.15, curve: 0, u0: .2, u1: .97 }] },
  halibut: { L: 56, D: .38, mx: .42, nose: .6, n0: .2, ped: .18, tail: 'emarg', tl: .14, tailH: 1.4, flat: true, dorsal: [[.08, .88, .1, 'fringe']], anal: [[.26, .88, .1, 'fringe']], pelvic: null, pect: { u: .22, v: -.05, len: .09, h: .12 }, back: '#4a4a31', side: '#55553a', belly: '#5e5e40', fin: '#3e3e28', backTo: -2, bellyFrom: 2, mouthLen: .1, gill: 0, pat: [{ t: 'mottle', c: '#707048', scale: 2.5, th: .66, seed: 2 }, { t: 'mottle', c: '#34341f', scale: 3.5, th: .7, seed: 13 }] },
  ucan_balik: { L: 34, D: .16, mx: .35, nose: .8, ped: .25, tailH: 1.25, lowerLobe: 1.45, wing: { c: '#86aedc', ray: '#4f78a8' }, dorsal: [[.62, .76, .22, 'tri']], anal: [[.64, .76, .2, 'tri']], pelvic: { u: .5, w: .12, h: .35, c: '#86aedc' }, pect: null, back: '#1e4e8e', side: '#9ec3e8', belly: '#f0f6fa', fin: '#7fa6d0', eye: { u: .1, v: .3, big: 1.3 } },
  sari_kuyruklu_fusilier: { L: 32, D: .27, mx: .38, nose: .75, ped: .2, tail: 'dfork', tailH: 1.25, tailC: '#f2d02a', dorsal: [[.28, .8, .18, 'low', '#e8d070']], anal: [[.62, .82, .16, 'low', '#e8a8b8']], pelvic: { u: .36, w: .08, h: .2, c: '#f0b8c8' }, back: '#3e6ec6', side: '#9ec0ec', belly: '#eaf1fa', fin: '#d8c0d0', pat: [{ t: 'region', c: '#f2d02a', fn: (u, v) => u > .42 && v < -.1 + (u - .42) * .9 }] },
  mavi_yuzgecli_trevally: { L: 42, D: .34, mx: .38, nose: .6, n0: .15, ped: .1, tail: 'dfork', tailH: 1.35, tailC: '#2f8fe8', dorsal: [[.3, .4, .14, 'spiny', '#2f8fe8'], [.45, .78, .26, 'sickle', '#2f8fe8']], anal: [[.55, .78, .24, 'sickle', '#2f8fe8']], pect: { u: .25, v: .1, len: .2, h: .12, c: '#3f9ae8' }, back: '#477d8d', side: '#a6c2c6', belly: '#e2ece8', fin: '#2f8fe8', eye: { u: .11, v: .32 }, pat: [{ t: 'dots', c: '#1c2e38', d: .05, v0: -.8, v1: .3, u0: .25, u1: .8, seed: 17 }, { t: 'scutes', c: '#33505a', c2: '#c8d8da', u0: .72, u1: .99, fn: () => .02 }] },
  kirmizi_snapper: { L: 44, D: .35, mx: .38, nose: .5, n0: .15, ped: .24, tail: 'emarg', tailH: 1.15, dorsal: [[.24, .78, .24, 'spiny']], anal: [[.62, .8, .24, 'round']], back: '#c43638', side: '#e66e68', belly: '#f6c6ba', fin: '#d64842', eye: { u: .13, v: .36 }, ring: '#e83a30' },
  lambuka: { L: 52, D: .3, mx: .2, nose: .3, n0: .55, ped: .12, tp: 1.2, hump: .15, humpU: .08, tail: 'dfork', tailH: 1.3, tailC: '#d8d050', dorsal: [[.06, .86, .22, 'low', '#2f6ac8']], anal: [[.5, .86, .18, 'low', '#d8c040']], back: '#1e8e7a', side: '#e6c64a', belly: '#f4e8a0', fin: '#d8c040', backTo: -.3, bellyFrom: .4, eye: { u: .09, v: .15 }, pat: [{ t: 'region', c: '#2f9a8c', fn: (u, v) => v < -.58 + u * .2 }, { t: 'dots', c: '#2f7fd8', d: .08, v0: -.3, v1: .5, u0: .15, u1: .85, seed: 23 }] },
  barrakuda: { L: 56, D: .1, mx: .45, nose: 1, n0: .18, ped: .35, tp: 1.2, tailH: 1.4, dorsal: [[.36, .44, .5, 'spiny'], [.66, .74, .45, 'tri']], anal: [[.66, .74, .4, 'tri']], pelvic: { u: .4, w: .06, h: .3 }, back: '#485866', side: '#b6c2ca', belly: '#eef2f4', fin: '#6a7a86', teeth: true, underbite: true, mouthLen: .12, eye: { u: .08, v: .3 }, pat: [{ t: 'vbars', n: 16, u0: .15, u1: .9, w: 1, c: '#5c6a74', v0: -1, v1: -.2 }, { t: 'dots', c: '#1e2830', d: .06, v0: 0, v1: .7, u0: .6, u1: .95, seed: 31 }] },
  albakor: { L: 54, D: .24, mx: .42, nose: .8, ped: .1, tail: 'lunate', tailH: 1.35, tailEdge: '#f0f0f0', dorsal: [[.24, .42, .26, 'spiny'], [.5, .58, .22, 'sickle']], anal: [[.55, .62, .2, 'sickle']], finlets: 7, finletC: '#2a3a5a', pect: { u: .25, v: -.05, len: .42, h: .1, c: '#2a3a62' }, back: '#1d2e58', side: '#98a6be', belly: '#eef0f4', fin: '#2a3a62', backTo: -.15, pat: [{ t: 'hs', v: -.12, w: 1, c: '#5a7ab8', u0: .2, u1: .9 }] },
  sari_yuzgecli_orkinos: { L: 60, D: .24, mx: .44, nose: .82, ped: .1, tail: 'lunate', tailH: 1.4, tailC: '#3a4a6a', dorsal: [[.24, .4, .22, 'spiny', '#3a4a6a'], [.46, .6, .62, 'sickle', '#f2cc2a']], anal: [[.5, .64, .56, 'sickle', '#f2cc2a']], finlets: 8, finletC: '#f2d02a', pect: { u: .25, v: -.05, len: .2, h: .12, c: '#2a3a5a' }, back: '#19295a', side: '#b2bcce', belly: '#f2f2f2', fin: '#3a4a6a', backTo: -.2, pat: [{ t: 'hs', v: -.12, w: 2, c: '#e8bc2c', u0: .15, u1: .92 }, { t: 'vbars', n: 12, u0: .35, u1: .85, w: 1, c: '#d6dbe4', v0: .35, v1: 1 }] },
  wahoo: { L: 62, D: .1, mx: .5, nose: 1, n0: .1, ped: .32, tp: 1.1, tail: 'lunate', tl: .12, tailH: 1.7, dorsal: [[.18, .62, .24, 'low', '#1e3a64'], [.7, .76, .25, 'tri']], anal: [[.68, .76, .25, 'tri']], finlets: 8, finletC: '#2a4a7a', back: '#1d3d68', side: '#8eb0c8', belly: '#e8eef2', fin: '#2a4a7a', mouthLen: .1, eye: { u: .08, v: .25 }, pat: [{ t: 'vbars', n: 20, u0: .15, u1: .92, w: 1.2, c: '#2a5c98', v0: -.7, v1: .55 }] },
  buyuk_gozlu_orkinos: { L: 58, D: .29, mx: .45, nose: .7, n0: .15, ped: .1, tail: 'lunate', tailH: 1.35, dorsal: [[.24, .4, .24, 'spiny'], [.47, .58, .32, 'sickle', '#c8b040']], anal: [[.51, .62, .3, 'sickle', '#c8b040']], finlets: 8, finletC: '#f0d040', pect: { u: .25, v: -.05, len: .3, h: .12, c: '#1a2448' }, back: '#15214a', side: '#8e9ab6', belly: '#eaecf0', fin: '#1f2c56', backTo: -.2, eye: { u: .13, v: .25, big: 1.8 }, pat: [{ t: 'hs', v: -.18, w: 2, c: '#3b5aae', u0: .15, u1: .9 }] },
  kilic_baligi: { L: 60, D: .2, mx: .3, nose: .9, n0: .25, ped: .12, tail: 'lunate', tailH: 1.75, bill: 28, billC: '#4a4252', dorsal: [[.1, .24, .75, 'sickle'], [.88, .92, .14, 'tri']], anal: [[.6, .68, .28, 'sickle'], [.88, .92, .12, 'tri']], pelvic: null, pect: { u: .18, v: .3, len: .18, h: .15 }, back: '#3a2e49', side: '#7c6e86', belly: '#cec7d3', fin: '#4a3e58', eye: { u: .06, v: .25, big: 1.4 }, backTo: -.1, gill: .12 },
  yelken_baligi: { L: 60, D: .16, mx: .35, nose: .9, n0: .2, ped: .14, tail: 'lunate', tailH: 1.6, bill: 16, spear: true, billC: '#2a3654', dorsal: [[.08, .72, 1.5, 'sail', '#1e3a8a', 'spots']], anal: [[.6, .7, .3, 'sickle']], pelvic: { u: .3, w: .04, h: .9, c: '#1e3a8a' }, back: '#19295a', side: '#7c9ac8', belly: '#eef0f4', fin: '#2a3a7a', backTo: -.15, pat: [{ t: 'vbarsdots', n: 12, u0: .2, u1: .85, c: '#a8d8f6', v0: -.6, v1: .4 }] }
};

function finProf(p, s) {
  switch (p) {
    case 'tri': return s < 0.3 ? s / 0.3 : 1 - (s - 0.3) / 0.7 * 0.85;
    case 'spiny': return (s < 0.15 ? s / 0.15 : 1 - (s - 0.15) * 0.75);
    case 'round': return Math.pow(Math.sin(Math.PI * s), 0.6);
    case 'low': return Math.min(1, s * 6, (1 - s) * 6);
    case 'sickle': return s < 0.2 ? s / 0.2 : Math.pow(Math.max(0.04, 1 - (s - 0.2) / 0.8), 2.2);
    case 'sail': return s < 0.08 ? s / 0.08 : 1 - 0.55 * Math.pow((s - 0.08) / 0.92, 1.5);
    case 'fringe': return Math.min(1, s * 10, (1 - s) * 10) * (0.8 + 0.2 * Math.sin(s * 50));
  }
  return Math.sin(Math.PI * s);
}

function fishPB(id) {
  const s = Object.assign({}, FISH_DEF, FISH_ART[id] || {});
  const L = s.L, tl = Math.max(3, Math.round(L * s.tl)), bl = L - tl;
  const maxH = Math.max(3, s.D * L), topH = maxH * s.topR, botH = maxH - topH;
  const bill = s.bill || 0;
  const S2 = s.tailH * maxH / 2;
  const fins = (s.dorsal || []).map(f => f[2] * maxH);
  const finTop = Math.max(0, ...fins, s.wing ? L * 0.3 - topH + 1 : 0, s.hump ? topH * s.hump : 0);
  const finBot = Math.max(0, ...(s.anal || []).map(f => f[2] * maxH), s.pelvic ? s.pelvic.h * maxH : 0, s.barbels ? 4 : 0, s.chinBarbel ? 3 : 0);
  const mTop = Math.ceil(Math.max(finTop, S2 - topH, 0)) + 2;
  const mBot = Math.ceil(Math.max(finBot, S2 * s.lowerLobe - botH, 0)) + 2;
  const W = bill + L + 3, H = Math.ceil(mTop + maxH + mBot) + 1;
  const pb = new PB(W, H);
  const x0 = 1 + bill, cy = mTop + topH;
  const pr = (u) => {
    let f;
    if (u <= s.mx) f = s.n0 + (1 - s.n0) * Math.pow(Math.sin((u / s.mx) * Math.PI / 2), s.nose);
    else { const g = (u - s.mx) / (1 - s.mx); f = 1 - (1 - s.ped) * Math.pow(g, s.tp); }
    return f;
  };
  const topF = u => topH * pr(u) * (1 + (s.hump ? s.hump * Math.exp(-Math.pow((u - s.humpU) / 0.13, 2)) : 0));
  const botF = u => botH * pr(u);
  const finC = s.fin || mix(s.side, s.back, 0.5);
  const tailC = s.tailC || finC;
  const yT = u => Math.round(cy - topF(u)), yB = u => Math.round(cy + botF(u)) - 1;
  const uOf = x => (x - x0 + 0.5) / bl;
  /* --- desen ön hesapları --- */
  const spotPts = [];
  for (const p of s.pat) {
    if (p.t === 'spots') { const r = mulberry(p.seed || 1); for (let i = 0; i < p.n; i++) { const u = lerp(p.u0, p.u1, r()), v = lerp(p.v0, p.v1, r()); spotPts.push({ p, x: x0 + u * bl, y: cy + (v < 0 ? v * topF(u) : v * botF(u)) }); } }
    if (p.t === 'dotsrow') { for (let i = 0; i < p.n; i++) { const u = lerp(p.u0, p.u1, p.n > 1 ? i / (p.n - 1) : 0); spotPts.push({ p, x: x0 + u * bl, y: cy + (p.v < 0 ? p.v * topF(u) : p.v * botF(u)) }); } }
  }
  const patColor = (u, v, x, y) => {
    let out = null;
    const X = u * bl, yt = topF(u), yb = botF(u);
    for (const p of s.pat) {
      const u0 = p.u0 != null ? p.u0 : 0, u1 = p.u1 != null ? p.u1 : 1;
      switch (p.t) {
        case 'hs': { if (u < u0 || u > u1) break; const yc = cy + (p.v < 0 ? p.v * yt : p.v * yb); if (Math.abs(y + 0.5 - yc) <= p.w / 2) out = p.c; break; }
        case 'vbars': case 'vbarsdots': {
          const v0 = p.v0 != null ? p.v0 : -1, v1 = p.v1 != null ? p.v1 : 1; if (v < v0 || v > v1) break;
          for (let i = 0; i < p.n; i++) { const ui = p.n > 1 ? lerp(p.u0, p.u1, i / (p.n - 1)) : p.u0; if (Math.abs(X - ui * bl) < (p.w || 1) / 2 + 0.01) { if (p.t === 'vbarsdots' && (y & 1)) break; out = (p.c2 && (i & 1)) ? p.c2 : p.c; } }
          break;
        }
        case 'blotch': { const bx = x0 + p.u * bl, byc = cy + (p.v < 0 ? p.v * topF(p.u) : p.v * botF(p.u)); const dx = (x + 0.5 - bx) / p.ru, dy = (y + 0.5 - byc) / p.rv; if (dx * dx + dy * dy <= 1) out = p.c; break; }
        case 'band': { if (Math.abs(X - p.u * bl) <= p.w / 2 && v >= p.v0 && v <= p.v1) out = p.c; break; }
        case 'lat': { if (u < u0 || u > u1) break; const lv = p.fn ? p.fn(u) : p.v + (p.curve || 0) * (Math.pow(u - 0.5, 2) * 4 - 0.6); const yc = cy + (lv < 0 ? lv * yt : lv * yb); if (Math.abs(y + 0.5 - yc) <= 0.5) out = p.c; break; }
        case 'scutes': { if (u < u0 || u > u1) break; const lv = p.fn(u); const yc = cy + (lv < 0 ? lv * yt : lv * yb); if (Math.abs(y + 0.5 - yc) <= 0.5) out = (x & 1) ? p.c : p.c2; else if (Math.abs(y + 0.5 - yc) <= 1.5 && (x & 1)) out = p.c; break; }
        case 'wavy': { if (v < p.v0 || v > p.v1) break; const ph = (X + p.amp * Math.sin(y * 0.9 + X * 0.35)) % p.per; if (ph < p.w && u > 0.15 && u < 0.97) out = p.c; break; }
        case 'oblique': { if (v < p.v0 || v > p.v1 || u < 0.15 || u > 0.95) break; const ph = ((X + p.slope * (y - cy)) % p.per + p.per) % p.per; if (ph < p.w) out = p.c; break; }
        case 'worm': { if (v > p.v1 || u < p.u0 || u > 0.96) break; const f = Math.sin(X * 0.6 + Math.sin(y * 0.9) * 2.4 + Math.sin(X * 0.21) * 1.5); if (f > 0.5) out = p.c; break; }
        case 'dots': { if (u < u0 || u > u1 || v < p.v0 || v > p.v1) break; if (ihash(x, y, p.seed) < p.d) out = p.c; break; }
        case 'mottle': { if (p.v1 != null && v > p.v1) break; if (vnoise2(x / p.scale, y / p.scale, p.seed) > p.th) out = p.c; break; }
        case 'region': { if (p.fn(u, v)) out = p.c; break; }
      }
    }
    for (const sp of spotPts) { const dx = x + 0.5 - sp.x, dy = y + 0.5 - sp.y; if (dx * dx + dy * dy <= sp.p.r * sp.p.r + 0.2) out = sp.p.c; }
    return out;
  };
  /* --- yüzgeç sütunları --- */
  const drawFin = (f, side, layer) => {
    const [a, b, h, p, fc, fp] = f; const c = fc || finC; const xa = Math.round(x0 + a * bl), xb = Math.round(x0 + b * bl);
    for (let x = xa; x <= xb; x++) {
      const sN = (x - xa) / Math.max(1, xb - xa); let hh = h * maxH * finProf(p, sN);
      if (p === 'spiny' && (x & 1)) hh *= 0.78;
      const u = clamp(uOf(x), 0, 1); const base = side < 0 ? yT(u) : yB(u);
      const n = Math.round(hh);
      for (let k = 1; k <= n; k++) {
        const y = base + side * k; let col = ((x - xa) & 1) ? c : dark(c, 0.16);
        if (fp === 'stripe') col = (k & 1) ? c : '#f2cc52';
        if (fp === 'spots' && ihash(x, y, 9) < 0.14) col = '#0e1a3a';
        if (k === n && n > 2) col = light(c, 0.2);
        if (!layer.has(x, y)) layer.set(x, y, col);
      }
    }
  };
  for (const f of (s.dorsal || [])) drawFin(f, -1, pb);
  for (const f of (s.anal || [])) drawFin(f, 1, pb);
  if (s.pelvic) drawFin([s.pelvic.u, s.pelvic.u + s.pelvic.w, s.pelvic.h, 'tri', s.pelvic.c], 1, pb);
  /* --- kuyruk --- */
  const xt = x0 + bl, pedH = Math.max(1, s.ped * maxH / 2), pc = cy + (botF(1) - topF(1)) / 2;
  for (let x = xt - 1; x < xt + tl; x++) {
    const sN = clamp((x - xt + 0.5) / tl, 0, 1); let outer, notch = 0;
    switch (s.tail) {
      case 'fork': outer = pedH + (S2 - pedH) * Math.pow(sN, 0.9); notch = sN > 0.42 ? S2 * 0.85 * Math.pow((sN - 0.42) / 0.58, 1.1) : 0; break;
      case 'dfork': outer = pedH + (S2 - pedH) * Math.pow(sN, 0.8); notch = sN > 0.3 ? S2 * 0.95 * Math.pow((sN - 0.3) / 0.7, 0.9) : 0; break;
      case 'lunate': outer = pedH * 0.8 + (S2 - pedH * 0.8) * Math.pow(sN, 0.55); notch = sN > 0.22 ? S2 * 0.93 * Math.pow((sN - 0.22) / 0.78, 0.7) : 0; break;
      case 'round': outer = sN < 0.55 ? pedH + (S2 - pedH) * Math.pow(sN / 0.55, 0.7) : S2 * Math.sqrt(Math.max(0, 1 - Math.pow((sN - 0.55) / 0.47, 2))); break;
      case 'trunc': outer = pedH + (S2 - pedH) * Math.pow(sN, 0.8); break;
      default: outer = pedH + (S2 - pedH) * Math.pow(sN, 0.8); notch = sN > 0.72 ? S2 * 0.6 * (sN - 0.72) / 0.28 : 0;
    }
    for (let y = Math.floor(pc - outer - 1); y <= Math.ceil(pc + outer * s.lowerLobe + 1); y++) {
      const dy = y + 0.5 - pc; const lim = dy > 0 ? outer * s.lowerLobe : outer; const nl = dy > 0 ? notch * s.lowerLobe : notch;
      if (Math.abs(dy) <= lim && Math.abs(dy) >= nl) {
        let col = (Math.round(Math.abs(dy)) & 1) ? tailC : dark(tailC, 0.15);
        if (s.tailEdge && sN > 0.82) col = s.tailEdge;
        if (s.tailTip && sN > 0.75 && Math.abs(dy) > lim - 2) col = s.tailTip;
        pb.set(x, y, col);
      }
    }
  }
  /* --- gövde --- */
  for (let x = x0; x < xt; x++) {
    const u = uOf(x); const t = yT(u), b = Math.max(yT(u), yB(u));
    for (let y = t; y <= b; y++) {
      const v = y + 0.5 < cy ? (y + 0.5 - cy) / Math.max(0.5, topF(u)) : (y + 0.5 - cy) / Math.max(0.5, botF(u));
      let c;
      const bt = s.backTo, bf = s.bellyFrom;
      if (v < bt - 0.12) c = s.back; else if (v < bt + 0.12) c = dith(x, y, (v - bt + 0.12) / 0.24) ? s.side : s.back;
      else if (v < bf - 0.12) c = s.side; else if (v < bf + 0.12) c = dith(x, y, (v - bf + 0.12) / 0.24) ? s.belly : s.side; else c = s.belly;
      const pcol = patColor(u, v, x, y); if (pcol) c = pcol;
      if (y === t + 1 && u > 0.1 && u < 0.72 && !s.flat) c = light(c, 0.28);
      if (y === b && b - t > 3) c = dark(c, 0.12);
      pb.set(x, y, c);
    }
  }
  /* --- kanat (uçan balık) --- */
  if (s.wing) {
    const xp = x0 + 0.24 * bl, yp = cy + 1, wh = L * 0.3;
    const pts = [[xp, yp], [xp + 0.5 * bl, cy - wh], [xp + 0.8 * bl, cy - wh * 0.85], [xp + 0.72 * bl, cy - 1], [xp + 2, yp + 1]];
    pb.poly(pts, s.wing.c, (x, y) => ((x + y) % 3 === 0) ? s.wing.ray : (ihash(x, y, 3) < 0.15 ? light(s.wing.c, 0.3) : s.wing.c));
    for (let k = 0; k < 4; k++) pb.line(xp, yp, lerp(pts[1][0], pts[2][0], k / 3), lerp(pts[1][1], pts[2][1], k / 3), s.wing.ray);
  }
  /* --- göğüs yüzgeci --- */
  if (s.pect) {
    const pp = s.pect, xp = x0 + pp.u * bl, yp = cy + (pp.v < 0 ? pp.v * topH : pp.v * botH), len = pp.len * L, hh = Math.max(1.5, pp.h * maxH);
    const c = pp.c || dark(finC, 0.05);
    pb.poly([[xp, yp], [xp + len, yp + hh * 0.35], [xp + len * 0.75, yp + hh], [xp + 1, yp + hh * 0.7]], c, (x, y) => ((x - Math.round(xp)) & 1) ? c : light(c, 0.15));
  }
  /* --- yüzgeççikler --- */
  if (s.finlets) for (let i = 0; i < s.finlets; i++) {
    const x = Math.round(xt - 2 - i * 2.2); const u = clamp(uOf(x), 0, 1);
    pb.set(x, yT(u) - 1, s.finletC); pb.set(x, yB(u) + 1, s.finletC); if (i % 2 === 0) { pb.set(x, yT(u) - 2, s.finletC); pb.set(x, yB(u) + 2, s.finletC); }
  }
  /* --- solungaç --- */
  if (s.gill) {
    const gu = s.gill, gx = x0 + gu * bl;
    for (let y = yT(gu) + 1; y < yB(gu); y++) { const v = (y + 0.5 - cy) / (y < cy ? topF(gu) : botF(gu)); const x = Math.round(gx + (1 - v * v) * 1.6); if (pb.has(x, y) && Math.abs(v) < 0.85) pb.set(x, y, dark(u32hex(pb.get(x, y)), 0.28)); }
  }
  /* --- ağız --- */
  const my = Math.round(cy + Math.min(1.5, botH * 0.25)); const ml = Math.max(1, Math.round(s.mouthLen * bl));
  for (let i = 0; i < ml; i++) if (pb.has(x0 + i, my)) pb.set(x0 + i, my, dark(s.side, 0.5));
  if (s.teeth) for (let i = 1; i < ml; i += 2) { pb.set(x0 + i, my - 1, '#fbfbf2'); if (s.underbite) pb.set(x0 + i, my + 1, '#fbfbf2'); }
  if (s.underbite) pb.set(x0 - 1, my + 1, s.belly);
  /* --- bıyıklar --- */
  if (s.barbels) { const bx = x0 + 2, by = yB(0.07) + 1; for (let k = 0; k < 4; k++) { pb.set(bx + (k >> 1), by + k, '#f2e2a8'); pb.set(bx + 2 + (k >> 1), by + k, '#e8d08a'); } }
  if (s.chinBarbel) { const bx = x0 + 3, by = yB(0.08) + 1; pb.set(bx, by, '#d8cc9a'); pb.set(bx + 1, by + 1, '#d8cc9a'); pb.set(bx + 1, by + 2, '#d8cc9a'); }
  /* --- gaga / kılıç --- */
  if (bill) {
    const c = s.billC || dark(s.back, 0.1);
    for (let x = 1; x < x0 + 1; x++) {
      const t = (x - 1) / Math.max(1, x0 - 1);
      if (s.beak) { if (x > bill * 0.18) pb.set(x, Math.round(cy - 0.5), c); pb.set(x, Math.round(cy + 0.5), light(c, 0.25)); }
      else if (s.spear) { pb.set(x, Math.round(cy - 1), c); if (t > 0.6) pb.set(x, Math.round(cy), dark(c, 0.2)); }
      else { const th = Math.round(lerp(1, 3, Math.pow(t, 0.8))); for (let k = 0; k < th; k++) pb.set(x, Math.round(cy - 1 - th / 2 + k), k === 0 ? light(c, 0.3) : c); }
    }
  }
  /* --- göz(ler) --- */
  const eyes = s.flat ? [{ u: 0.1, v: 0.6 }, { u: 0.17, v: 0.22 }] : [s.eye];
  for (const e of eyes) {
    const ex = Math.round(x0 + e.u * bl), ey = Math.round(cy - topF(e.u) * e.v);
    const r = s.flat ? (maxH > 20 ? 2 : 1) : Math.max(1, Math.round(maxH * 0.1 * (e.big || 1)));
    if (r <= 1) { pb.set(ex, ey, '#14101a'); pb.set(ex + 1, ey, s.ring); pb.set(ex, ey - 1, s.ring); pb.set(ex - 1, ey, s.ring); pb.set(ex, ey + 1, s.ring); }
    else { pb.ellipse(ex, ey, r + 0.5, r + 0.5, s.ring); pb.ellipse(ex, ey, r - 0.2, r - 0.2, '#14101a'); pb.set(ex - Math.max(1, r - 1), ey - Math.max(1, r - 1), '#ffffff'); }
  }
  pb.outline(null, 0.55);
  return pb;
}
const fishSprite = id => Atlas.get('fish:' + id, () => fishPB(id));
const fishSil = id => Atlas.get('fishsil:' + id, () => fishPB(id).silhouette('#1d2a3e'));
const fishSprR = id => Atlas.get('fishR:' + id, () => fishPB(id).flipX());
const fishSilR = id => Atlas.get('fishsilR:' + id, () => fishPB(id).flipX().silhouette('#14253a'));
const fishUrl = (id, sc) => Atlas.url('fish:' + id, () => fishPB(id), sc || 2);
const fishSilUrl = (id, sc) => Atlas.url('fishsil:' + id, () => fishPB(id).silhouette('#3a4658'), sc || 2);
