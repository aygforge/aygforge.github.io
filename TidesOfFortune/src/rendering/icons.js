// 10×10 pixel art ikonlar. DOM'da CSS arka planı olarak kullanılır (ui/IconStyles.js).
// 3/4 (üst-karşı) bakış çizimleri — tof-art-src/art kaynaklarından kaynak koda taşındı.
import { disc, ellipse, hline, line, makeCanvas, px, rect, shade, vline } from './pixel.js';
import { npcSprite, petSprite, wc } from './td/TopChars.js';
import { X3FX } from './td/Props6.js';

  // ===== İkonlar: 16x16, kodla çizilir, otomatik koyu dış çizgi =====
  var IK = {
      ink: "#1a1423",
      g: "#f2c14e",
      gL: "#ffe08a",
      gD: "#b8862b",
      w: "#8b5a2b",
      wL: "#b07a42",
      wD: "#5c3a1e",
      s: "#9aa1a8",
      sL: "#d6dce2",
      sD: "#5d6470",
      r: "#c8423b",
      rL: "#f08070",
      rD: "#8a2a26",
      b: "#3b6ea5",
      bL: "#7ab0e0",
      bD: "#24426b",
      gr: "#5a9e4b",
      grL: "#8ac86a",
      grD: "#2f5e35",
      wh: "#f4ead5",
      whD: "#d0c4a4",
      pa: "#e8d8a8",
      paD: "#c8b080",
      p: "#8b5bb5",
      pL: "#c8a0e8",
      pD: "#563275",
      sk: "#d9b48f",
      skD: "#a8805c",
      c: "#5fb8c9",
      cL: "#bfe3ef",
      cD: "#2f7f93",
      o: "#e07b39",
      oD: "#a8521f",
      dk: "#2a2230",
    },
    icCache = new Map(),
    // yatay satır listesiyle şekil: [y, x0, x1, renk]
    icRows = (t, rows, c) => {
      for (let [y, a, d, cc] of rows) hline(t, a, d, y, cc || c);
    },
    icSprite = (t, img, sx, sy) => (t.drawImage(img, sx, sy, 16, 16, 0, 0, 16, 16), !0);
  export var ICONS = {
    coin: (t) => {
      let k = IK;
      disc(t, 7, 7, 6, k.gD), disc(t, 7, 7, 5, k.g), disc(t, 7, 7, 3, "#e0a93a"), rect(t, 7, 5, 1, 5, k.gL), rect(t, 6, 5, 3, 1, k.gL), rect(t, 6, 9, 3, 1, k.gL), px(t, 4, 3, "#fff6c0"), px(t, 3, 4, "#fff6c0"), px(t, 3, 5, k.gL), px(t, 11, 11, k.gD), px(t, 10, 12, k.gD);
    },
    hull: (t) => {
      let k = IK;
      for (let i = 0; i < 4; i++) hline(t, 2 + i, 13 - i, 10 + i, i === 0 ? k.wL : i === 3 ? k.wD : k.w);
      vline(t, 7, 1, 9, k.wD);
      for (let i = 0; i < 7; i++) hline(t, 8, 8 + Math.min(5, Math.floor(i * 0.9)), 2 + i, i > 4 ? k.whD : k.wh);
      for (let i = 0; i < 5; i++) hline(t, 6 - Math.floor(i * 0.8), 6, 4 + i, k.whD);
      px(t, 4, 11, k.g), px(t, 7, 11, k.g), px(t, 10, 11, k.g);
    },
    crate: (t) => {
      let k = IK;
      rect(t, 2, 4, 12, 10, k.w), rect(t, 2, 2, 12, 2, k.wL), hline(t, 2, 13, 4, k.wD), hline(t, 2, 13, 13, k.wD), vline(t, 2, 4, 13, k.wD), vline(t, 13, 4, 13, k.wD), line(t, 3, 5, 12, 12, k.wD), line(t, 12, 5, 3, 12, k.wD), vline(t, 6, 2, 3, k.w), vline(t, 10, 2, 3, k.w), hline(t, 3, 12, 5, k.wL);
    },
    star: (t) => {
      let k = IK;
      icRows(
        t,
        [
          [1, 7, 8],
          [2, 7, 8],
          [3, 6, 9],
          [4, 6, 9],
          [5, 1, 14],
          [6, 2, 13],
          [7, 3, 12],
          [8, 4, 11],
          [9, 4, 11],
          [10, 3, 12],
          [11, 3, 6],
          [11, 9, 12],
          [12, 2, 5],
          [12, 10, 13],
          [13, 2, 3],
          [13, 12, 13],
        ],
        k.g,
      );
      vline(t, 7, 2, 6, k.gL), hline(t, 3, 7, 6, k.gL), px(t, 2, 5, k.gL), hline(t, 9, 11, 10, k.gD), hline(t, 10, 13, 12, k.gD), hline(t, 12, 13, 13, k.gD), hline(t, 8, 10, 9, k.gD), px(t, 6, 8, "#fff6c0");
    },
    crew: (t) => icSprite(t, npcSprite("sailor", "down", "idle"), 5, 4),
    paw: (t) => {
      let k = IK;
      ellipse(t, 8, 10, 4, 3, k.wL), hline(t, 5, 10, 13, k.wL), rect(t, 2, 5, 3, 3, k.wL), rect(t, 5, 2, 3, 3, k.wL), rect(t, 9, 2, 3, 3, k.wL), rect(t, 12, 5, 2, 3, k.wL), hline(t, 6, 9, 9, k.sk), hline(t, 6, 10, 10, k.sk), px(t, 3, 6, k.sk), px(t, 6, 3, k.sk), px(t, 10, 3, k.sk), px(t, 12, 6, k.sk), hline(t, 6, 10, 13, k.w);
    },
    anchor: (t) => {
      let k = IK;
      rect(t, 6, 1, 4, 1, k.s), rect(t, 5, 2, 1, 2, k.s), rect(t, 10, 2, 1, 2, k.s), rect(t, 6, 4, 4, 1, k.s), rect(t, 7, 4, 2, 10, k.s), vline(t, 7, 5, 13, k.sL), rect(t, 4, 6, 8, 1, k.sD);
      icRows(
        t,
        [
          [9, 1, 1],
          [9, 14, 14],
          [10, 1, 2],
          [10, 13, 14],
          [11, 1, 3],
          [11, 12, 14],
          [12, 2, 5],
          [12, 10, 13],
          [13, 4, 11],
        ],
        k.s,
      );
      px(t, 2, 12, k.sL), px(t, 1, 10, k.sL), hline(t, 10, 12, 13, k.sD), px(t, 13, 12, k.sD);
    },
    sail: (t) => {
      let k = IK;
      rect(t, 7, 0, 2, 11, k.wD), rect(t, 9, 0, 3, 2, k.r), hline(t, 3, 12, 2, k.w);
      icRows(t, [[3, 4, 11], [4, 3, 12], [5, 3, 12], [6, 3, 12], [7, 3, 12], [8, 3, 12], [9, 4, 11]], k.wh);
      hline(t, 4, 11, 9, k.whD), vline(t, 12, 4, 8, k.whD), vline(t, 6, 3, 8, k.whD), vline(t, 9, 3, 8, k.whD), vline(t, 3, 4, 8, "#ffffff");
      icRows(t, [[11, 1, 14], [12, 2, 13], [13, 3, 12]], k.w), hline(t, 1, 14, 11, k.wL), hline(t, 3, 12, 13, k.wD), px(t, 4, 12, k.g), px(t, 8, 12, k.g), px(t, 11, 12, k.g);
    },
    cannon: (t) => {
      let k = IK;
      rect(t, 2, 5, 11, 5, k.dk), hline(t, 2, 12, 5, k.sD), hline(t, 3, 11, 6, "#4a4656"), rect(t, 13, 4, 2, 7, k.dk), vline(t, 13, 5, 9, k.sD), rect(t, 1, 6, 1, 3, k.sD), rect(t, 3, 10, 8, 2, k.w), hline(t, 3, 10, 10, k.wL), disc(t, 4, 12, 2, k.wD), disc(t, 10, 12, 2, k.wD), px(t, 4, 12, k.g), px(t, 10, 12, k.g);
    },
    compass: (t) => {
      let k = IK;
      disc(t, 7, 8, 6, k.gD), disc(t, 7, 8, 5, k.g), disc(t, 7, 8, 4, k.wh), rect(t, 6, 1, 3, 2, k.g), px(t, 7, 1, k.gL), vline(t, 7, 4, 8, k.r), px(t, 6, 6, k.r), px(t, 8, 6, k.r), vline(t, 7, 9, 12, k.sD), px(t, 7, 8, k.ink), px(t, 4, 8, k.sD), px(t, 10, 8, k.sD), px(t, 4, 4, "#fff6c0"), px(t, 3, 5, k.gL);
    },
    map: (t) => {
      let k = IK;
      rect(t, 1, 2, 14, 12, k.pa), vline(t, 5, 2, 13, k.paD), vline(t, 10, 2, 13, k.paD), rect(t, 2, 4, 3, 4, k.gr), rect(t, 3, 3, 2, 1, k.gr), rect(t, 11, 8, 3, 4, k.gr), px(t, 12, 7, k.gr), hline(t, 6, 9, 6, k.b), hline(t, 6, 8, 10, k.b), px(t, 7, 8, k.r), px(t, 9, 10, k.r), px(t, 8, 9, k.r), px(t, 7, 10, k.r), px(t, 9, 8, k.r), hline(t, 1, 14, 13, k.paD);
    },
    flag: (t) => {
      let k = IK;
      rect(t, 2, 1, 2, 14, k.wD), vline(t, 2, 1, 14, k.w), rect(t, 4, 2, 10, 8, "#1e1a26"), hline(t, 4, 13, 9, "#0e0c14"), rect(t, 7, 3, 4, 3, k.wh), rect(t, 8, 6, 2, 1, k.wh), px(t, 8, 4, k.ink), px(t, 10, 4, k.ink), px(t, 6, 7, k.wh), px(t, 11, 7, k.wh), px(t, 7, 8, k.wh), px(t, 10, 8, k.wh), px(t, 14, 3, "#1e1a26"), px(t, 14, 7, "#1e1a26"), px(t, 2, 0, k.g);
    },
    flagWhite: (t) => {
      let k = IK;
      rect(t, 2, 1, 2, 14, k.wD), vline(t, 2, 1, 14, k.w), rect(t, 4, 2, 10, 7, k.wh), hline(t, 4, 13, 8, k.whD), hline(t, 5, 12, 3, "#ffffff"), px(t, 14, 3, k.wh), px(t, 14, 6, k.wh), vline(t, 8, 3, 7, k.whD), px(t, 2, 0, k.g);
    },
    skull: (t) => {
      let k = IK;
      rect(t, 2, 3, 12, 7, k.wh), rect(t, 3, 2, 10, 1, k.wh), rect(t, 4, 1, 8, 1, k.wh), rect(t, 4, 10, 8, 3, k.wh), hline(t, 5, 10, 13, k.whD), rect(t, 4, 5, 3, 3, k.ink), rect(t, 9, 5, 3, 3, k.ink), rect(t, 7, 8, 2, 2, k.ink), vline(t, 6, 11, 12, k.ink), vline(t, 9, 11, 12, k.ink), hline(t, 5, 9, 1, "#ffffff"), vline(t, 13, 4, 9, k.whD), px(t, 5, 5, "#5a4a5e");
    },
    fish: (t) => {
      let k = IK;
      ellipse(t, 6, 8, 5, 3, k.c), hline(t, 3, 9, 5, k.cD), hline(t, 4, 8, 4, k.cD), hline(t, 3, 9, 10, k.cL), hline(t, 4, 8, 11, k.cL), icRows(t, [[6, 12, 14], [7, 11, 13], [8, 11, 12], [9, 11, 13], [10, 12, 14]], k.cD), px(t, 3, 7, k.ink), px(t, 3, 6, "#ffffff"), vline(t, 6, 7, 9, k.cD), px(t, 8, 7, k.cL), px(t, 9, 8, k.cL), px(t, 1, 8, k.cD);
    },
    shield: (t) => {
      let k = IK;
      icRows(t, [[1, 2, 13], [2, 2, 13], [3, 2, 13], [4, 2, 13], [5, 2, 13], [6, 2, 13], [7, 2, 13], [8, 3, 12], [9, 3, 12], [10, 4, 11], [11, 5, 10], [12, 6, 9], [13, 7, 8]], k.s);
      icRows(t, [[3, 4, 11], [4, 4, 11], [5, 4, 11], [6, 4, 11], [7, 4, 11], [8, 5, 10], [9, 5, 10], [10, 6, 9], [11, 7, 8]], k.b);
      vline(t, 7, 3, 11, k.g), vline(t, 8, 3, 11, k.gD), hline(t, 4, 11, 6, k.g), hline(t, 2, 13, 1, k.sL), vline(t, 2, 2, 7, k.sL), vline(t, 13, 2, 7, k.sD), px(t, 5, 4, k.bL);
    },
    fog: (t) => {
      let k = IK;
      rect(t, 1, 3, 9, 3, k.wh), hline(t, 2, 8, 2, k.wh), rect(t, 5, 7, 10, 3, k.sL), hline(t, 6, 13, 6, k.sL), rect(t, 2, 11, 9, 3, k.wh), hline(t, 3, 9, 10, k.wh), hline(t, 1, 9, 5, k.whD), hline(t, 5, 14, 9, k.s), hline(t, 2, 10, 13, k.whD), hline(t, 3, 6, 3, "#ffffff");
    },
    eye: (t) => {
      let k = IK;
      ellipse(t, 7, 8, 6, 4, k.wh), hline(t, 4, 11, 4, k.dk), hline(t, 2, 3, 5, k.dk), hline(t, 12, 13, 5, k.dk), disc(t, 7, 8, 3, k.p), disc(t, 7, 8, 2, k.pD), disc(t, 7, 8, 1, k.ink), px(t, 6, 7, "#ffffff"), hline(t, 4, 10, 12, k.whD), px(t, 3, 2, k.dk), px(t, 7, 1, k.dk), px(t, 11, 2, k.dk);
    },
    volcano: (t) => {
      let k = IK;
      for (let i = 0; i < 9; i++) hline(t, 6 - Math.round(i * 0.6), 9 + Math.round(i * 0.6), 5 + i, i < 2 ? "#5a4a48" : "#3a3032");
      hline(t, 6, 9, 5, k.o), hline(t, 7, 8, 4, k.g), vline(t, 7, 6, 9, k.o), px(t, 6, 10, k.r), px(t, 9, 7, k.o), px(t, 10, 9, k.r), px(t, 5, 12, k.r), vline(t, 3, 9, 13, "#5a4a48"), rect(t, 9, 1, 3, 2, k.s), rect(t, 5, 0, 2, 2, k.sD), px(t, 11, 0, k.sD), px(t, 8, 2, k.s);
    },
    snow: (t) => {
      let k = IK;
      vline(t, 7, 1, 14, k.cL), vline(t, 8, 1, 14, k.cL), hline(t, 1, 14, 7, k.cL), hline(t, 1, 14, 8, k.cL), line(t, 3, 3, 12, 12, k.cL), line(t, 12, 3, 3, 12, k.cL), rect(t, 6, 6, 4, 4, "#ffffff"), px(t, 6, 2, k.cL), px(t, 9, 2, k.cL), px(t, 6, 13, k.cL), px(t, 9, 13, k.cL), px(t, 2, 6, k.cL), px(t, 2, 9, k.cL), px(t, 13, 6, k.cL), px(t, 13, 9, k.cL);
    },
    scroll: (t) => {
      let k = IK;
      rect(t, 3, 2, 10, 12, k.pa), rect(t, 1, 1, 14, 3, k.paD), hline(t, 1, 14, 1, k.pa), rect(t, 1, 12, 14, 3, k.paD), hline(t, 1, 14, 12, k.pa), hline(t, 5, 10, 5, k.wD), hline(t, 5, 11, 7, k.wD), hline(t, 5, 9, 9, k.wD), px(t, 2, 2, k.wD), px(t, 13, 2, k.wD), px(t, 2, 13, k.wD), px(t, 13, 13, k.wD), rect(t, 10, 9, 2, 2, k.r);
    },
    hand: (t) => {
      let k = IK;
      rect(t, 3, 3, 2, 6, k.sk), rect(t, 6, 1, 2, 8, k.sk), rect(t, 9, 2, 2, 7, k.sk), rect(t, 12, 4, 2, 5, k.sk), rect(t, 3, 8, 11, 6, k.sk), rect(t, 0, 8, 3, 2, k.sk), rect(t, 1, 10, 2, 2, k.sk), hline(t, 4, 12, 14, k.sk);
      hline(t, 4, 12, 14, k.skD), vline(t, 13, 9, 13, k.skD), hline(t, 5, 10, 10, k.skD), px(t, 6, 1, "#f0d4b4"), px(t, 3, 3, "#f0d4b4"), px(t, 9, 2, "#f0d4b4"), px(t, 12, 4, "#f0d4b4"), px(t, 7, 5, k.skD), px(t, 10, 5, k.skD), px(t, 4, 6, k.skD);
    },
    dice: (t) => {
      let k = IK;
      rect(t, 2, 5, 10, 9, k.wh), icRows(t, [[1, 5, 14], [2, 4, 13], [3, 3, 12], [4, 2, 11]], "#ffffff"), icRows(t, [[2, 14, 14], [3, 13, 14], [4, 12, 14]], k.whD), rect(t, 12, 5, 3, 7, k.whD), vline(t, 13, 12, 12, k.whD), px(t, 12, 12, k.whD), vline(t, 12, 5, 13, k.s);
      px(t, 4, 7, k.r), px(t, 9, 7, k.ink), px(t, 4, 11, k.ink), px(t, 9, 11, k.ink), rect(t, 6, 9, 2, 1, k.ink), px(t, 7, 2, k.ink), px(t, 10, 3, k.ink), px(t, 13, 7, k.ink), px(t, 13, 10, k.ink);
    },
    no: (t) => {
      let k = IK;
      for (let i = 0; i < 12; i++) rect(t, 2 + i, 2 + i, 2, 2, k.r), rect(t, 12 - i, 2 + i, 2, 2, k.r);
      for (let i = 0; i < 12; i++) px(t, 2 + i, 2 + i, k.rL), px(t, 13 - i, 3 + i, k.rD);
    },
    back: (t) => {
      let k = IK;
      icRows(t, [[2, 5, 5], [3, 4, 5], [4, 3, 12], [5, 2, 13], [6, 3, 14], [7, 4, 5], [8, 5, 5], [7, 12, 14], [8, 12, 14], [9, 12, 14], [10, 11, 14], [11, 6, 13], [12, 6, 12]], k.wh);
      hline(t, 5, 12, 4, "#ffffff"), hline(t, 6, 12, 12, k.whD), vline(t, 14, 7, 10, k.whD);
    },
    kit: (t) => {
      let k = IK;
      rect(t, 1, 4, 14, 10, k.wh), rect(t, 5, 1, 6, 3, k.wD), t.clearRect(6, 2, 4, 2), rect(t, 6, 6, 4, 7, k.r), rect(t, 4, 8, 8, 3, k.r), hline(t, 1, 14, 13, k.whD), vline(t, 14, 4, 13, k.whD), hline(t, 1, 14, 4, "#ffffff"), px(t, 6, 6, k.rL), px(t, 4, 8, k.rL);
    },
    bucket: (t) => {
      let k = IK;
      icRows(t, [[6, 2, 13], [7, 2, 13], [8, 3, 12], [9, 3, 12], [10, 3, 12], [11, 4, 11], [12, 4, 11], [13, 5, 10]], k.w);
      rect(t, 2, 4, 12, 2, k.c), hline(t, 3, 8, 4, k.cL), hline(t, 3, 12, 9, k.wD), hline(t, 4, 11, 12, k.wD), vline(t, 4, 6, 11, k.wL), line(t, 2, 4, 7, 1, k.sD), line(t, 13, 4, 8, 1, k.sD), vline(t, 11, 7, 12, k.wD);
    },
    hammer: (t) => {
      let k = IK;
      line(t, 5, 13, 11, 5, k.w), line(t, 4, 13, 10, 5, k.w), line(t, 5, 14, 12, 5, k.wD), rect(t, 7, 1, 7, 5, k.s), rect(t, 5, 2, 2, 3, k.sD), hline(t, 7, 13, 1, k.sL), hline(t, 7, 13, 5, k.sD), vline(t, 13, 1, 5, k.sD), px(t, 4, 13, k.wD);
    },
    dive: (t) => {
      let k = IK;
      rect(t, 2, 5, 12, 6, k.dk), rect(t, 3, 6, 4, 4, k.c), rect(t, 9, 6, 4, 4, k.c), px(t, 3, 6, k.cL), px(t, 4, 6, k.cL), px(t, 9, 6, k.cL), px(t, 10, 6, k.cL), rect(t, 1, 7, 1, 2, k.sD), rect(t, 14, 7, 1, 2, k.sD), rect(t, 7, 9, 2, 3, k.dk), vline(t, 13, 1, 5, k.o), px(t, 12, 1, k.o), px(t, 3, 13, k.cL), px(t, 6, 14, k.cL), px(t, 5, 12, k.cL), px(t, 10, 13, k.cL), px(t, 3, 2, k.cL), px(t, 6, 1, k.cL);
    },
    talk: (t) => {
      let k = IK;
      rect(t, 1, 2, 14, 9, k.wh), rect(t, 2, 1, 12, 1, k.wh), rect(t, 2, 11, 12, 1, k.wh), icRows(t, [[12, 3, 6], [13, 3, 5], [14, 3, 3]], k.wh), rect(t, 4, 5, 2, 2, k.dk), rect(t, 7, 5, 2, 2, k.dk), rect(t, 10, 5, 2, 2, k.dk), hline(t, 2, 13, 11, k.whD), vline(t, 14, 3, 10, k.whD), hline(t, 2, 12, 1, "#ffffff");
    },
    sword: (t) => {
      let k = IK;
      for (let i = 0; i < 9; i++) rect(t, 12 - i, 1 + i, 2, 2, k.s), px(t, 12 - i, 1 + i, k.sL), px(t, 13 - i, 2 + i, k.sD);
      px(t, 14, 1, k.sL), line(t, 2, 8, 7, 13, k.g), line(t, 2, 9, 6, 13, k.gD), line(t, 2, 13, 4, 11, k.w), line(t, 1, 13, 4, 10, k.wD), px(t, 1, 14, k.g), px(t, 2, 14, k.gD);
    },
    pot: (t) => {
      let k = IK;
      icRows(t, [[6, 1, 14], [7, 2, 13], [8, 2, 13], [9, 2, 13], [10, 2, 13], [11, 3, 12], [12, 4, 11], [13, 5, 10]], k.sD);
      hline(t, 1, 14, 5, k.s), hline(t, 2, 13, 6, k.dk), vline(t, 3, 7, 11, k.s), vline(t, 4, 7, 10, k.sL), rect(t, 0, 7, 2, 2, k.s), rect(t, 14, 7, 2, 2, k.s), hline(t, 4, 11, 6, k.o), px(t, 6, 6, k.g), px(t, 9, 6, k.gr);
      px(t, 4, 3, k.wh), px(t, 5, 2, k.wh), px(t, 4, 1, k.wh), px(t, 8, 3, k.wh), px(t, 9, 2, k.wh), px(t, 8, 1, k.wh), px(t, 11, 3, k.wh), px(t, 12, 2, k.wh);
    },
    bow: (t) => {
      let k = IK;
      icRows(t, [[1, 3, 5], [2, 5, 7], [3, 7, 8], [4, 8, 9], [5, 9, 10], [6, 9, 10], [7, 10, 11], [8, 10, 11], [9, 9, 10], [10, 9, 10], [11, 8, 9], [12, 7, 8], [13, 5, 7], [14, 3, 5]], k.w);
      vline(t, 3, 1, 14, k.whD), hline(t, 1, 13, 7, k.wL), hline(t, 1, 13, 8, k.wD), px(t, 14, 7, k.s), px(t, 14, 8, k.sD), px(t, 13, 6, k.s), px(t, 13, 9, k.sD), px(t, 1, 6, k.r), px(t, 1, 9, k.r), px(t, 10, 7, k.wL), px(t, 9, 5, k.wL);
    },
    net: (t) => {
      let k = IK;
      for (let i = 0; i < 4; i++) line(t, 1 + i * 4, 2, 13, 14 - i * 4, k.whD), line(t, 2 + i * 4, 2, 2, 2 + i * 4, k.whD), line(t, 2, 6 + i * 4, 14 - (i + 1) * 4 + 2, 14, k.whD), line(t, 14, 2 + i * 4, 2 + i * 4, 14, k.whD);
      hline(t, 1, 14, 1, k.w), hline(t, 1, 14, 2, k.wD);
      for (let x = 2; x < 15; x += 4) rect(t, x, 0, 2, 2, k.r);
      px(t, 5, 9, k.cL), px(t, 6, 9, k.c), px(t, 10, 7, k.cL), px(t, 11, 7, k.c);
    },
    lock: (t) => {
      let k = IK;
      rect(t, 4, 2, 2, 6, k.s), rect(t, 10, 2, 2, 6, k.s), rect(t, 5, 1, 6, 2, k.s), hline(t, 6, 9, 1, k.sL), vline(t, 4, 3, 6, k.sL), rect(t, 2, 7, 12, 8, k.g), hline(t, 2, 13, 7, k.gL), hline(t, 2, 13, 14, k.gD), vline(t, 13, 8, 14, k.gD), rect(t, 7, 9, 2, 2, k.ink), rect(t, 7, 11, 2, 2, k.dk), px(t, 3, 8, "#fff6c0");
    },
    heart: (t) => {
      let k = IK;
      icRows(t, [[2, 2, 5], [2, 9, 12], [3, 1, 6], [3, 8, 13], [4, 1, 13], [5, 1, 13], [6, 1, 13], [7, 2, 12], [8, 3, 11], [9, 4, 10], [10, 5, 9], [11, 6, 8], [12, 7, 7]], k.r);
      hline(t, 2, 3, 3, k.rL), px(t, 2, 4, k.rL), px(t, 3, 2, "#ffffff"), icRows(t, [[6, 11, 13], [7, 10, 12], [8, 9, 11], [9, 8, 10], [10, 7, 9]], k.rD);
    },
    amulet: (t) => {
      let k = IK;
      line(t, 2, 1, 6, 7, k.g), line(t, 13, 1, 9, 7, k.g), px(t, 2, 0, k.gD), px(t, 13, 0, k.gD), disc(t, 7, 10, 4, k.gD), disc(t, 7, 10, 3, k.g), disc(t, 7, 10, 2, k.c), px(t, 6, 9, k.cL), px(t, 8, 11, k.cD), px(t, 5, 7, k.gL), rect(t, 7, 6, 2, 1, k.g);
    },
    staff: (t) => {
      let k = IK;
      rect(t, 7, 5, 2, 10, k.w), vline(t, 7, 5, 14, k.wL), vline(t, 8, 6, 14, k.wD), disc(t, 7, 3, 3, k.gD), disc(t, 7, 3, 2, k.g), px(t, 6, 2, "#fff6c0"), px(t, 7, 3, k.gL), hline(t, 6, 9, 6, k.gD), px(t, 2, 2, k.gL), px(t, 12, 1, k.gL), px(t, 12, 5, k.gL), px(t, 3, 6, k.gL);
    },
    // Pusula eşyası (iç kimliği ITEM_SEXTANT, eski adı sekstant): ahşap kutulu cep pusulası; genel "compass" simgesinden ayırt edilir
    pocketCompass: (t) => {
      let k = IK;
      rect(t, 1, 2, 13, 13, k.wD), rect(t, 2, 3, 11, 11, k.w), hline(t, 2, 12, 3, k.wL), vline(t, 2, 3, 13, k.wL), rect(t, 5, 1, 5, 1, k.gD), px(t, 7, 1, k.gL),
        disc(t, 7, 8, 5, k.gD), disc(t, 7, 8, 4, k.pa), px(t, 5, 5, "#fff6c0"),
        vline(t, 7, 4, 12, k.paD), hline(t, 3, 11, 8, k.paD), px(t, 5, 10, k.paD), px(t, 9, 6, k.paD), px(t, 9, 10, k.paD), px(t, 5, 6, k.paD),
        vline(t, 7, 4, 7, k.r), px(t, 6, 6, k.rD), px(t, 8, 6, k.r), px(t, 6, 7, k.rD), px(t, 8, 7, k.r),
        vline(t, 7, 9, 12, k.ink), px(t, 6, 9, k.ink), px(t, 8, 9, k.ink), px(t, 6, 10, k.sD), px(t, 8, 10, k.sD),
        px(t, 7, 8, k.gL);
    },
    sextant: (t) => {
      let k = IK;
      line(t, 7, 1, 2, 11, k.g), line(t, 8, 1, 13, 11, k.g), line(t, 8, 1, 3, 11, k.gD), icRows(t, [[11, 2, 13], [12, 3, 12], [13, 5, 10]], k.g), hline(t, 3, 12, 12, k.gD), line(t, 7, 2, 9, 12, k.sD), disc(t, 7, 2, 1, k.gL), px(t, 4, 11, k.ink), px(t, 7, 11, k.ink), px(t, 10, 11, k.ink), rect(t, 10, 4, 3, 2, k.s), px(t, 13, 4, k.cL);
    },
    seal: (t) => {
      let k = IK;
      rect(t, 4, 9, 3, 6, k.rD), rect(t, 9, 9, 3, 6, k.rD), t.clearRect(5, 14, 1, 1), t.clearRect(10, 14, 1, 1), disc(t, 7, 6, 5, k.rD), disc(t, 7, 6, 4, k.r), rect(t, 7, 3, 1, 6, k.g), rect(t, 5, 5, 5, 1, k.g), px(t, 6, 7, k.g), px(t, 8, 7, k.g), px(t, 5, 3, k.rL), px(t, 4, 4, k.rL);
    },
    safe: (t) => {
      let k = IK;
      rect(t, 1, 1, 14, 12, k.sD), rect(t, 2, 2, 12, 10, k.s), rect(t, 3, 3, 10, 8, k.sD), rect(t, 4, 4, 8, 6, k.s), disc(t, 8, 7, 2, k.dk), disc(t, 8, 7, 1, k.g), rect(t, 4, 6, 1, 2, k.dk), hline(t, 2, 13, 2, k.sL), rect(t, 2, 13, 3, 2, k.dk), rect(t, 11, 13, 3, 2, k.dk), px(t, 12, 4, k.sL);
    },
    qseal: (t) => {
      let k = IK;
      rect(t, 3, 8, 4, 7, k.b), rect(t, 9, 8, 4, 7, k.b), t.clearRect(4, 14, 2, 1), t.clearRect(10, 14, 2, 1), vline(t, 3, 9, 14, k.bL), vline(t, 12, 9, 14, k.bD), disc(t, 7, 6, 5, k.gD), disc(t, 7, 6, 4, k.g), disc(t, 7, 6, 2, k.gL), px(t, 7, 6, "#fff6c0"), px(t, 4, 3, "#fff6c0"), px(t, 3, 4, k.gL), px(t, 7, 4, k.g), px(t, 7, 8, k.g), px(t, 5, 6, k.g), px(t, 9, 6, k.g);
    },
    hold: (t) => {
      let k = IK;
      icRows(t, [[1, 4, 11], [2, 3, 12], [3, 2, 13], [4, 2, 13], [5, 1, 14], [6, 1, 14], [7, 1, 14], [8, 1, 14], [9, 1, 14], [10, 2, 13], [11, 2, 13], [12, 3, 12], [13, 4, 11]], k.w);
      hline(t, 2, 13, 3, k.dk), hline(t, 2, 13, 11, k.dk), hline(t, 4, 11, 1, k.wL), vline(t, 4, 2, 12, k.wL), vline(t, 7, 2, 12, k.wD), vline(t, 10, 2, 12, k.wD), vline(t, 13, 5, 9, k.wD), rect(t, 7, 6, 2, 2, k.dk);
    },
    oldmap: (t) => {
      let k = IK;
      rect(t, 1, 2, 14, 12, k.sk), hline(t, 1, 14, 2, k.pa), hline(t, 1, 14, 13, k.skD), vline(t, 14, 2, 13, k.skD), t.clearRect(1, 6, 1, 1), t.clearRect(14, 10, 1, 1), t.clearRect(6, 13, 2, 1), px(t, 3, 11, k.wD), px(t, 5, 10, k.wD), px(t, 7, 9, k.wD), px(t, 8, 7, k.wD), px(t, 10, 6, k.wD), rect(t, 11, 3, 3, 3, k.r), t.clearRect(12, 3, 1, 1), t.clearRect(12, 5, 1, 1), t.clearRect(11, 4, 1, 1), t.clearRect(13, 4, 1, 1), px(t, 12, 4, k.r), px(t, 11, 4, k.sk), px(t, 13, 4, k.sk), px(t, 12, 3, k.sk), px(t, 12, 5, k.sk), rect(t, 3, 4, 3, 2, k.grD), px(t, 4, 6, k.grD);
    },
    flare: (t) => {
      let k = IK;
      rect(t, 6, 7, 3, 8, k.r), vline(t, 6, 7, 14, k.rL), vline(t, 8, 8, 14, k.rD), rect(t, 6, 12, 3, 1, k.wh), rect(t, 6, 6, 3, 1, k.dk), disc(t, 7, 4, 2, k.g), px(t, 7, 4, "#ffffff"), px(t, 7, 1, k.g), px(t, 4, 2, k.o), px(t, 10, 2, k.o), px(t, 3, 5, k.g), px(t, 11, 5, k.g), px(t, 5, 0, k.gL), px(t, 9, 0, k.gL);
    },
    icebreaker: (t) => {
      let k = IK;
      icRows(t, [[5, 1, 9], [6, 1, 11], [7, 2, 12], [8, 3, 13], [9, 4, 12], [10, 5, 11]], k.w), hline(t, 1, 9, 5, k.wL), icRows(t, [[5, 10, 11], [6, 12, 13], [7, 13, 14], [8, 14, 14], [9, 13, 13], [10, 12, 12]], k.s), px(t, 11, 5, k.sL), px(t, 13, 6, k.sL);
      hline(t, 0, 15, 11, k.c), hline(t, 0, 15, 12, k.cD), rect(t, 12, 1, 3, 3, k.cL), px(t, 13, 1, "#ffffff"), rect(t, 9, 2, 2, 2, k.cL), px(t, 14, 9, k.cL), px(t, 15, 4, k.cL), rect(t, 1, 12, 3, 2, k.cL), rect(t, 8, 12, 4, 2, "#ffffff");
    },
    heatshield: (t) => {
      let k = IK;
      icRows(t, [[1, 2, 13], [2, 2, 13], [3, 2, 13], [4, 2, 13], [5, 2, 13], [6, 2, 13], [7, 2, 13], [8, 3, 12], [9, 3, 12], [10, 4, 11], [11, 5, 10], [12, 6, 9], [13, 7, 8]], k.oD);
      icRows(t, [[2, 3, 12], [3, 3, 12], [4, 3, 12], [5, 3, 12], [6, 3, 12], [7, 3, 12], [8, 4, 11], [9, 4, 11], [10, 5, 10], [11, 6, 9]], k.o);
      icRows(t, [[3, 7, 8], [4, 7, 8], [5, 6, 9], [6, 5, 9], [7, 5, 10], [8, 5, 10], [9, 6, 9]], k.g), icRows(t, [[6, 7, 8], [7, 7, 8], [8, 6, 8]], "#fff6c0"), px(t, 5, 3, k.g), px(t, 10, 5, k.g), vline(t, 2, 1, 7, "#f0a060");
    },
    lockpick: (t) => {
      let k = IK;
      disc(t, 4, 4, 3, k.gD), disc(t, 4, 4, 2, k.g), t.clearRect(3, 4, 3, 1), t.clearRect(4, 3, 1, 3), line(t, 6, 6, 13, 13, k.s), line(t, 7, 6, 14, 13, k.sD), px(t, 12, 14, k.s), px(t, 14, 12, k.s), px(t, 10, 12, k.s), px(t, 3, 2, k.gL), line(t, 8, 2, 13, 7, k.sL), px(t, 13, 8, k.sL), px(t, 14, 6, k.sL);
    },
    rope: (t) => {
      let k = IK;
      ellipse(t, 7, 9, 6, 4, k.skD), ellipse(t, 7, 8, 6, 4, k.sk), ellipse(t, 7, 8, 4, 2, k.skD), ellipse(t, 7, 7, 4, 2, k.sk), ellipse(t, 7, 7, 2, 1, k.wD), line(t, 12, 5, 14, 1, k.sk), px(t, 14, 0, k.skD);
      for (let a = 0; a < 6.28; a += 0.7) px(t, 7 + Math.cos(a) * 5, 8 + Math.sin(a) * 3, k.skD);
    },
    chart: (t) => {
      let k = IK;
      rect(t, 1, 2, 14, 12, k.b), hline(t, 1, 14, 2, k.bL), vline(t, 5, 3, 13, k.bD), vline(t, 10, 3, 13, k.bD), hline(t, 2, 13, 7, k.bD), rect(t, 2, 4, 3, 2, k.gr), px(t, 3, 6, k.gr), rect(t, 11, 9, 3, 3, k.gr), px(t, 12, 8, k.grL), px(t, 3, 4, k.grL), px(t, 7, 10, k.g), px(t, 8, 5, k.wh), px(t, 7, 4, k.wh), px(t, 9, 6, k.wh), px(t, 6, 11, k.wh), px(t, 8, 9, k.wh);
    },
    chest: (t) => {
      let k = IK;
      rect(t, 1, 7, 14, 7, k.w), rect(t, 1, 3, 14, 4, k.wL), hline(t, 2, 13, 2, k.wL), hline(t, 3, 12, 2, "#c89a62"), hline(t, 1, 14, 7, k.g), hline(t, 1, 14, 13, k.wD), vline(t, 1, 3, 13, k.g), vline(t, 14, 3, 13, k.gD), vline(t, 4, 3, 6, k.w), vline(t, 11, 3, 6, k.w), rect(t, 7, 6, 2, 4, k.g), px(t, 7, 8, k.ink), px(t, 8, 8, k.ink), vline(t, 5, 8, 12, k.wD), vline(t, 10, 8, 12, k.wD), px(t, 1, 3, k.gL);
    },
    gift: (t) => {
      let k = IK;
      rect(t, 1, 5, 14, 9, k.b), rect(t, 1, 5, 14, 3, k.bL), hline(t, 1, 14, 8, k.bD), rect(t, 7, 5, 2, 9, k.r), hline(t, 1, 14, 6, k.r), icRows(t, [[2, 4, 6], [2, 9, 11], [3, 3, 7], [3, 8, 12], [4, 5, 10]], k.r), px(t, 4, 3, k.rL), px(t, 9, 3, k.rL), vline(t, 14, 9, 13, k.bD), px(t, 7, 5, k.rL);
    },
    sun: (t) => {
      let k = IK;
      disc(t, 7, 7, 4, k.g), disc(t, 7, 7, 3, k.gL), px(t, 6, 6, "#fff6c0"), rect(t, 7, 0, 1, 2, k.g), rect(t, 7, 13, 1, 2, k.g), rect(t, 0, 7, 2, 1, k.g), rect(t, 13, 7, 2, 1, k.g), px(t, 2, 2, k.g), px(t, 12, 2, k.g), px(t, 2, 12, k.g), px(t, 12, 12, k.g), px(t, 3, 3, k.g), px(t, 11, 3, k.g), px(t, 3, 11, k.g), px(t, 11, 11, k.g), hline(t, 6, 9, 10, k.o);
    },
    spell: (t) => {
      let k = IK,
        st = (x, y, r, c) => (vline(t, x, y - r, y + r, c), hline(t, x - r, x + r, y, c), px(t, x, y, "#ffffff"));
      st(5, 5, 3, k.p), st(11, 10, 2, k.pL), st(11, 3, 1, k.pL), st(3, 12, 1, k.p), px(t, 8, 13, k.pL), px(t, 14, 6, k.p), px(t, 1, 8, k.pL), px(t, 8, 1, k.p), px(t, 4, 4, k.pL), px(t, 6, 6, k.pL), px(t, 4, 6, k.pL), px(t, 6, 4, k.pL);
    },
    crown: (t) => {
      let k = IK;
      rect(t, 1, 9, 14, 4, k.g), icRows(t, [[3, 1, 1], [3, 7, 8], [3, 14, 14], [4, 1, 2], [4, 6, 9], [4, 13, 14], [5, 1, 3], [5, 6, 9], [5, 12, 14], [6, 1, 4], [6, 5, 10], [6, 11, 14], [7, 1, 14], [8, 1, 14]], k.g);
      hline(t, 1, 14, 12, k.gD), hline(t, 1, 14, 13, k.gD), rect(t, 7, 9, 2, 2, k.r), px(t, 3, 10, k.b), px(t, 12, 10, k.b), px(t, 1, 2, k.r), px(t, 14, 2, k.r), rect(t, 7, 2, 2, 1, k.r), vline(t, 1, 4, 11, k.gL), px(t, 6, 5, k.gL), px(t, 7, 9, k.rL);
    },
    beads: (t) => {
      let k = IK;
      for (let a = 0; a < 6.28; a += 0.52) {
        let x = Math.round(7 + Math.cos(a) * 5),
          y = Math.round(6 + Math.sin(a) * 4.5);
        rect(t, x, y, 2, 2, k.r), px(t, x, y, k.rL);
      }
      rect(t, 7, 11, 2, 2, k.g), vline(t, 7, 13, 14, k.gD), vline(t, 8, 13, 14, k.g), px(t, 6, 14, k.gD), px(t, 9, 14, k.gD);
    },
    abacus: (t) => {
      let k = IK;
      rect(t, 1, 2, 14, 12, k.w), rect(t, 2, 3, 12, 10, k.pa), hline(t, 1, 14, 2, k.wL), hline(t, 1, 14, 13, k.wD);
      for (let i = 0; i < 3; i++) {
        let y = 4 + i * 3;
        hline(t, 2, 13, y + 1, k.sD);
        for (let j = 0; j < 4; j++) {
          let x = 2 + ((j * 3 + i * 2) % 11);
          rect(t, x, y, 2, 3, [k.r, k.g, k.b][i]), px(t, x, y, [k.rL, k.gL, k.bL][i]);
        }
      }
    },
    hood: (t) => {
      let k = IK;
      icRows(t, [[1, 5, 10], [2, 4, 11], [3, 3, 12], [4, 3, 12], [5, 2, 13], [6, 2, 13], [7, 2, 13], [8, 2, 13], [9, 2, 13], [10, 1, 14], [11, 1, 14], [12, 1, 14], [13, 1, 14], [14, 1, 14]], k.grD);
      icRows(t, [[4, 5, 10], [5, 4, 11], [6, 4, 11], [7, 4, 11], [8, 5, 10]], k.ink), icRows(t, [[5, 6, 9], [6, 5, 10], [7, 5, 10], [8, 6, 9]], k.skD), px(t, 6, 6, k.ink), px(t, 9, 6, k.ink), hline(t, 5, 9, 1, "#3f7a46"), vline(t, 3, 3, 8, "#3f7a46"), vline(t, 7, 10, 14, "#24493a"), vline(t, 8, 10, 14, "#24493a"), px(t, 7, 10, k.g), px(t, 8, 10, k.g);
    },
    lantern: (t) => {
      let k = IK;
      rect(t, 6, 0, 4, 1, k.sD), rect(t, 5, 1, 1, 2, k.sD), rect(t, 10, 1, 1, 2, k.sD), rect(t, 4, 3, 8, 2, k.dk), rect(t, 3, 5, 10, 7, k.g), rect(t, 4, 6, 8, 5, k.gL), rect(t, 6, 7, 4, 3, "#fff6c0"), vline(t, 3, 5, 11, k.dk), vline(t, 12, 5, 11, k.dk), vline(t, 7, 5, 11, k.gD), rect(t, 4, 12, 8, 2, k.dk), hline(t, 5, 10, 14, k.sD), px(t, 7, 8, k.o);
    },
    idol: (t) => {
      let k = IK;
      rect(t, 4, 1, 8, 6, k.g), rect(t, 5, 7, 6, 5, k.g), rect(t, 3, 12, 10, 3, k.gD), hline(t, 3, 12, 12, k.g), hline(t, 5, 10, 1, k.gL), vline(t, 4, 2, 6, k.gL), vline(t, 11, 2, 11, k.gD), rect(t, 5, 3, 2, 2, k.ink), rect(t, 9, 3, 2, 2, k.ink), hline(t, 6, 9, 6, k.gD), rect(t, 7, 8, 2, 2, k.r), rect(t, 2, 8, 3, 2, k.g), rect(t, 11, 8, 3, 2, k.g), px(t, 7, 8, k.rL);
    },
    fist: (t) => {
      let k = IK;
      rect(t, 3, 3, 10, 7, k.sk), rect(t, 2, 5, 1, 4, k.sk), vline(t, 5, 3, 6, k.skD), vline(t, 8, 3, 6, k.skD), vline(t, 11, 3, 6, k.skD), hline(t, 3, 12, 7, k.skD), rect(t, 9, 7, 5, 3, k.sk), hline(t, 9, 13, 10, k.skD), hline(t, 3, 12, 3, "#f0d4b4"), rect(t, 4, 10, 8, 2, k.wh), rect(t, 4, 12, 8, 3, k.b), vline(t, 11, 12, 14, k.bD), hline(t, 4, 11, 12, k.bL);
    },
    wave: (t) => {
      let k = IK;
      icRows(t, [[3, 6, 10], [4, 4, 12], [5, 3, 7], [5, 11, 13], [6, 2, 6], [6, 12, 13], [7, 2, 6], [8, 1, 7], [9, 1, 9], [10, 1, 14], [11, 1, 14], [12, 1, 14], [13, 1, 14]], k.c);
      icRows(t, [[2, 7, 9], [3, 5, 6], [3, 10, 11], [4, 12, 13], [5, 13, 14], [6, 13, 14], [7, 12, 13]], "#ffffff"), hline(t, 1, 14, 12, k.cD), hline(t, 1, 14, 13, k.cD), hline(t, 3, 5, 8, k.cL), hline(t, 2, 4, 10, k.cL), hline(t, 8, 12, 11, k.cL), px(t, 10, 8, k.cL), px(t, 12, 9, "#ffffff"), px(t, 14, 9, "#ffffff");
    },
    boat: (t) => {
      let k = IK;
      icRows(t, [[9, 1, 14], [10, 2, 13], [11, 3, 12]], k.w), hline(t, 1, 14, 9, k.wL), hline(t, 3, 12, 11, k.wD), vline(t, 6, 1, 8, k.wD);
      for (let i = 0; i < 6; i++) hline(t, 7, 7 + i, 2 + i, i > 3 ? k.whD : k.wh);
      rect(t, 7, 1, 3, 1, k.r), hline(t, 0, 15, 12, k.c), hline(t, 0, 15, 13, k.cD), px(t, 2, 12, k.cL), px(t, 3, 12, k.cL), px(t, 9, 12, k.cL), px(t, 13, 12, k.cL), line(t, 10, 8, 14, 13, k.wL);
    },
    scale: (t) => {
      let k = IK;
      rect(t, 7, 2, 2, 11, k.g), vline(t, 8, 3, 12, k.gD), rect(t, 4, 13, 8, 2, k.gD), hline(t, 5, 10, 13, k.g), hline(t, 1, 14, 3, k.g), disc(t, 7, 2, 1, k.gL), vline(t, 2, 4, 8, k.sD), vline(t, 13, 4, 6, k.sD), icRows(t, [[8, 0, 4], [9, 1, 3]], k.g), icRows(t, [[6, 11, 15], [7, 12, 14]], k.g), px(t, 0, 8, k.gL), px(t, 11, 6, k.gL), rect(t, 1, 7, 3, 1, k.o);
    },
    dog: (t) => icSprite(t, petSprite("PET_TARCIN", "down", "wag1"), 5, 1),
    cat: (t) => icSprite(t, petSprite("PET_ZIPIR", "down", "sit"), 5, 3),
    parrot: (t) => icSprite(t, petSprite("PET_KIRMIZI", "right", "perch"), 4, 4),
    book: (t) => {
      let k = IK;
      rect(t, 2, 1, 12, 14, k.w), rect(t, 2, 1, 2, 14, k.wD), rect(t, 4, 12, 10, 2, k.wh), hline(t, 4, 13, 14, k.wD), hline(t, 4, 13, 1, k.wL), vline(t, 13, 2, 11, k.wD), rect(t, 6, 4, 6, 5, k.g), rect(t, 7, 5, 4, 3, k.gD), px(t, 8, 6, k.gL), px(t, 9, 6, k.gL), hline(t, 5, 12, 13, k.whD), rect(t, 10, 12, 2, 3, k.r);
    },
    gear: (t) => {
      let k = IK;
      disc(t, 7, 7, 5, k.s), rect(t, 6, 0, 3, 15, k.s), rect(t, 0, 6, 15, 3, k.s), rect(t, 2, 2, 3, 3, k.s), rect(t, 10, 2, 3, 3, k.s), rect(t, 2, 10, 3, 3, k.s), rect(t, 10, 10, 3, 3, k.s), disc(t, 7, 7, 2, k.sD), t.clearRect(6, 6, 3, 3), t.clearRect(7, 5, 1, 5), t.clearRect(5, 7, 5, 1);
      hline(t, 6, 8, 0, k.sL), vline(t, 0, 6, 8, k.sL), px(t, 2, 2, k.sL), px(t, 3, 2, k.sL), px(t, 2, 3, k.sL), hline(t, 6, 8, 14, k.sD), vline(t, 14, 6, 8, k.sD), rect(t, 11, 11, 2, 2, k.sD), px(t, 4, 4, k.sL), px(t, 5, 3, k.sL);
    },
    upgrade: (t) => {
      let k = IK;
      icRows(t, [[1, 7, 8], [2, 6, 9], [3, 5, 10], [4, 4, 11], [5, 3, 12], [6, 2, 13], [7, 1, 14]], k.gr), rect(t, 5, 8, 6, 7, k.gr), vline(t, 5, 8, 14, k.grL), vline(t, 10, 8, 14, k.grD), vline(t, 9, 8, 14, k.grD);
      for (let i = 0; i < 7; i++) px(t, 7 - i, 1 + i, k.grL), px(t, 8 + i, 1 + i, k.grD);
      hline(t, 11, 14, 7, k.grD), px(t, 7, 3, "#c8f0a8");
    },
    home: (t) => {
      let k = IK;
      icRows(t, [[1, 7, 8], [2, 6, 9], [3, 5, 10], [4, 4, 11], [5, 3, 12], [6, 2, 13], [7, 1, 14]], k.r), hline(t, 1, 14, 7, k.rD), rect(t, 3, 8, 10, 7, k.wh), vline(t, 12, 8, 14, k.whD), rect(t, 7, 10, 3, 5, k.w), px(t, 9, 12, k.g), rect(t, 4, 9, 2, 2, k.bL), rect(t, 11, 2, 2, 3, k.wD);
      for (let i = 0; i < 6; i++) px(t, 7 - i, 1 + i, k.rL);
    },
    fullscreen: (t) => {
      let k = IK;
      for (let [x, y, dx, dy] of [
        [1, 1, 1, 1],
        [14, 1, -1, 1],
        [1, 14, 1, -1],
        [14, 14, -1, -1],
      ])
        for (let i = 0; i < 5; i++) rect(t, Math.min(x, x + dx * i), y - (dy < 0 ? 1 : 0), 1, 2, k.wh), rect(t, x - (dx < 0 ? 1 : 0), Math.min(y, y + dy * i), 2, 1, k.wh), px(t, x + dx * i, y, k.wh), px(t, x, y + dy * i, k.wh);
    },
    sound: (t) => {
      let k = IK;
      rect(t, 1, 6, 3, 4, k.wh), vline(t, 4, 5, 10, k.wh), vline(t, 5, 4, 11, k.wh), vline(t, 6, 3, 12, k.wh), vline(t, 7, 2, 13, k.whD), hline(t, 1, 3, 9, k.whD);
      px(t, 9, 6, k.wh), px(t, 10, 7, k.wh), px(t, 10, 8, k.wh), px(t, 9, 9, k.wh), px(t, 11, 3, k.wh), px(t, 12, 4, k.wh), px(t, 13, 5, k.wh), vline(t, 14, 6, 9, k.wh), px(t, 13, 10, k.wh), px(t, 12, 11, k.wh), px(t, 11, 12, k.wh);
    },
    wheel: (t) => {
      let k = IK;
      for (let a = 0; a < 6.28; a += 0.1) px(t, 7.5 + Math.cos(a) * 5, 7.5 + Math.sin(a) * 5, k.w), px(t, 7.5 + Math.cos(a) * 4.2, 7.5 + Math.sin(a) * 4.2, k.wD);
      for (let i = 0; i < 8; i++) {
        let a = (i * Math.PI) / 4;
        line(t, 7.5, 7.5, 7.5 + Math.cos(a) * 4, 7.5 + Math.sin(a) * 4, k.wL), rect(t, Math.round(7 + Math.cos(a) * 6.6), Math.round(7 + Math.sin(a) * 6.6), 2, 2, k.wL);
      }
      rect(t, 6, 6, 3, 3, k.wD), px(t, 7, 7, k.g);
    },
    biscuit: (t) => {
      let k = IK;
      rect(t, 2, 3, 12, 10, k.sk), rect(t, 3, 2, 10, 12, k.sk), hline(t, 3, 12, 2, "#f0d4b4"), vline(t, 2, 3, 11, "#f0d4b4"), hline(t, 3, 12, 13, k.skD), vline(t, 13, 4, 12, k.skD);
      for (let x = 5; x < 12; x += 3) for (let y = 5; y < 12; y += 3) px(t, x, y, k.wD);
      px(t, 1, 5, k.sk), px(t, 1, 9, k.sk), px(t, 14, 6, k.skD), px(t, 14, 10, k.skD);
    },
    info: (t) => {
      let k = IK;
      disc(t, 7, 7, 6, k.bD), disc(t, 7, 7, 5, k.b), rect(t, 7, 3, 2, 2, k.wh), rect(t, 7, 6, 2, 6, k.wh), px(t, 6, 6, k.wh), px(t, 6, 11, k.wh), px(t, 9, 11, k.wh), px(t, 4, 3, k.bL), px(t, 3, 4, k.bL), px(t, 3, 5, k.bL);
    },
    warn: (t) => {
      let k = IK;
      for (let i = 0; i < 12; i++) hline(t, 7 - Math.floor(i * 0.55), 8 + Math.floor(i * 0.55), 2 + i, k.g);
      hline(t, 1, 14, 13, k.gD), rect(t, 7, 5, 2, 5, k.ink), rect(t, 7, 11, 2, 2, k.ink), px(t, 7, 2, k.gL), px(t, 6, 4, k.gL), px(t, 5, 6, k.gL), px(t, 4, 8, k.gL);
    },
    chain: (t) => {
      let k = IK,
        ln2 = (x, y) => (rect(t, x, y, 6, 4, k.s), t.clearRect(x + 2, y + 1, 2, 2), hline(t, x + 1, x + 4, y, k.sL), hline(t, x + 1, x + 4, y + 3, k.sD));
      ln2(1, 2), ln2(9, 10), rect(t, 6, 5, 4, 6, k.s), t.clearRect(7, 7, 2, 2), vline(t, 6, 6, 9, k.sL), vline(t, 9, 6, 9, k.sD), px(t, 5, 5, k.s), px(t, 10, 10, k.s);
    },
    clock: (t) => {
      let k = IK;
      disc(t, 7, 7, 6, k.wD), disc(t, 7, 7, 5, k.wh), vline(t, 7, 3, 7, k.ink), hline(t, 7, 10, 7, k.ink), px(t, 7, 2, k.r), px(t, 12, 7, k.sD), px(t, 7, 12, k.sD), px(t, 2, 7, k.sD), px(t, 4, 4, "#ffffff"), px(t, 10, 10, k.whD), px(t, 9, 11, k.whD);
    },
    bell: (t) => X3FX.icBell(t),
    bone: (t) => {
      let k = IK;
      line(t, 4, 11, 11, 4, k.wh), line(t, 4, 10, 10, 4, k.wh), line(t, 5, 11, 11, 5, k.whD), rect(t, 1, 10, 3, 3, k.wh), rect(t, 3, 12, 3, 2, k.wh), rect(t, 2, 12, 2, 2, k.wh), rect(t, 10, 1, 3, 3, k.wh), rect(t, 12, 3, 2, 3, k.wh), rect(t, 11, 2, 3, 2, k.wh), px(t, 1, 10, "#ffffff"), px(t, 10, 1, "#ffffff"), px(t, 5, 13, k.whD), px(t, 13, 5, k.whD);
    },
  };
  function icScale(o, e) {
    if (e === 1) return o;
    let c = makeCanvas(o.width * e, o.height * e),
      x = c.getContext("2d");
    return (x.imageSmoothingEnabled = !1), x.drawImage(o, 0, 0, c.width, c.height), c;
  }
  function icMake(key, fn, e) {
    let k = key + "|" + e;
    if (icCache.has(k)) return icCache.get(k);
    let c = makeCanvas(16, 16),
      raw = fn(c.getContext("2d")),
      o = icScale(raw === !0 ? c : wc(c, IK.ink), e);
    return icCache.set(k, o), o;
  }
  export function iconCanvas(t, e = 1) {
    return icMake("i:" + (ICONS[t] ? t : "info"), ICONS[t] || ICONS.info, e);
  }
  // Ticaret malları
  export var GOOD_ICONS = {
    GOOD_GRAIN: (t) => {
      let k = IK;
      rect(t, 3, 6, 10, 8, "#d8b878"), rect(t, 2, 8, 12, 5, "#d8b878"), hline(t, 4, 11, 14, "#a88a50"), vline(t, 12, 8, 13, "#b89a60"), hline(t, 4, 8, 7, "#f0d8a0"), rect(t, 5, 4, 6, 2, "#c8a868"), hline(t, 5, 10, 5, k.wD);
      for (let [x, y] of [
        [4, 1],
        [7, 0],
        [10, 1],
      ])
        vline(t, x + 1, y + 1, 4, k.gD), px(t, x, y, k.g), px(t, x + 2, y, k.g), px(t, x + 1, y, k.gL), px(t, x, y + 2, k.g), px(t, x + 2, y + 2, k.g);
      px(t, 7, 10, k.gD), px(t, 8, 9, k.gD), px(t, 6, 11, k.gD), px(t, 9, 11, k.gD);
    },
    GOOD_SALT: (t) => {
      let k = IK;
      icRows(t, [[3, 7, 8], [4, 6, 9], [5, 5, 10], [6, 4, 11], [7, 3, 12], [8, 3, 12], [9, 2, 13]], "#f8f6f0"), rect(t, 1, 10, 14, 4, k.w), hline(t, 1, 14, 10, k.wL), hline(t, 2, 13, 13, k.wD), hline(t, 2, 13, 14, k.wD), px(t, 6, 5, "#ffffff"), px(t, 5, 7, k.cL), px(t, 9, 6, k.cL), px(t, 10, 8, k.sL), px(t, 7, 8, k.sL), px(t, 4, 9, k.cL), icRows(t, [[6, 10, 11], [7, 11, 12], [8, 11, 12], [9, 12, 13]], "#d8dce4");
    },
    GOOD_FISH: (t) => {
      let k = IK;
      ellipse(t, 6, 8, 5, 4, "#7ab0c8"), hline(t, 3, 9, 4, "#4a7a98"), hline(t, 2, 10, 5, "#4a7a98"), hline(t, 3, 9, 11, "#d8eef6"), hline(t, 2, 10, 10, "#d8eef6"), icRows(t, [[5, 12, 14], [6, 11, 14], [7, 11, 13], [8, 11, 12], [9, 11, 13], [10, 11, 14], [11, 12, 14]], "#4a7a98"), px(t, 3, 7, k.ink), px(t, 3, 6, "#ffffff"), vline(t, 6, 6, 9, "#4a7a98"), px(t, 8, 7, "#bfe3ef"), px(t, 9, 8, "#bfe3ef"), px(t, 8, 9, "#bfe3ef"), hline(t, 6, 8, 3, "#4a7a98"), px(t, 1, 9, k.r);
    },
    GOOD_TIMBER: (t) => {
      let k = IK;
      for (let [x, y] of [
        [1, 9],
        [8, 9],
        [4, 3],
      ])
        rect(t, x, y, 7, 5, k.w), hline(t, x, x + 6, y, k.wL), hline(t, x, x + 6, y + 4, k.wD), disc(t, x + 5, y + 2, 2, "#d8b080"), disc(t, x + 5, y + 2, 1, "#b8905a"), px(t, x + 5, y + 2, k.wD), px(t, x + 1, y + 2, k.wD), px(t, x + 2, y + 1, k.wD);
    },
    GOOD_SANDSTONE: (t) => {
      let c = "#d4b48a";
      rect(t, 1, 8, 7, 6, c), rect(t, 8, 8, 7, 6, shade(c, -0.1)), rect(t, 4, 2, 8, 6, shade(c, 0.08)), hline(t, 1, 7, 8, shade(c, 0.3)), hline(t, 8, 14, 8, shade(c, 0.2)), hline(t, 4, 11, 2, shade(c, 0.4)), hline(t, 1, 14, 13, shade(c, -0.3)), vline(t, 7, 9, 13, shade(c, -0.3)), vline(t, 14, 9, 13, shade(c, -0.35)), vline(t, 11, 3, 7, shade(c, -0.25));
      px(t, 3, 10, shade(c, -0.2)), px(t, 10, 11, shade(c, -0.3)), px(t, 6, 4, shade(c, -0.2)), px(t, 8, 6, shade(c, -0.2)), px(t, 4, 12, shade(c, 0.2));
    },
    GOOD_SPICE: (t) => {
      let k = IK;
      icRows(t, [[8, 1, 14], [9, 1, 14], [10, 2, 13], [11, 3, 12], [12, 4, 11], [13, 5, 10]], k.w), hline(t, 1, 14, 8, k.wL), hline(t, 5, 10, 13, k.wD), icRows(t, [[4, 6, 9], [5, 4, 11], [6, 3, 12], [7, 2, 13]], k.o), icRows(t, [[4, 7, 8], [5, 5, 7], [6, 4, 6]], "#f0a060"), px(t, 9, 6, k.r), px(t, 11, 7, k.r), px(t, 6, 7, k.g), px(t, 8, 5, k.g), px(t, 12, 2, k.o), px(t, 3, 3, k.r), vline(t, 13, 9, 11, k.wD);
    },
    GOOD_SILK: (t) => {
      let k = IK;
      rect(t, 2, 3, 12, 4, k.p), rect(t, 2, 7, 12, 4, k.pL), rect(t, 2, 11, 12, 3, k.p), hline(t, 2, 13, 3, k.pL), hline(t, 2, 13, 6, k.pD), hline(t, 2, 13, 10, k.p), hline(t, 2, 13, 13, k.pD), disc(t, 3, 5, 1, k.wh), disc(t, 3, 9, 1, k.wh), px(t, 3, 12, k.wh), vline(t, 13, 3, 13, k.pD), line(t, 9, 7, 14, 12, k.pL), line(t, 10, 7, 15, 12, k.p), px(t, 6, 4, "#e8d0ff"), px(t, 8, 8, "#ffffff");
    },
    GOOD_OLIVE_OIL: (t) => {
      let k = IK;
      rect(t, 6, 1, 4, 2, k.wL), rect(t, 7, 3, 2, 2, "#6a9a4a"), icRows(t, [[5, 6, 9], [6, 5, 10], [7, 4, 11], [8, 4, 11], [9, 4, 11], [10, 4, 11], [11, 4, 11], [12, 4, 11], [13, 5, 10]], "#6a9a4a"), vline(t, 5, 7, 12, "#a8d078"), vline(t, 10, 6, 12, "#3e6a2a"), rect(t, 6, 8, 4, 3, k.pa), px(t, 7, 9, "#3e6a2a"), px(t, 8, 9, "#3e6a2a"), hline(t, 5, 10, 14, "#3e6a2a"), px(t, 12, 3, "#3e6a2a"), px(t, 13, 4, "#6a9a4a"), px(t, 13, 2, "#6a9a4a");
    },
    GOOD_WINE: (t) => {
      let k = IK;
      rect(t, 7, 0, 2, 1, k.wL), rect(t, 7, 1, 2, 4, "#3a1a22"), icRows(t, [[5, 6, 9], [6, 5, 10], [7, 5, 10], [8, 5, 10], [9, 5, 10], [10, 5, 10], [11, 5, 10], [12, 5, 10], [13, 5, 10], [14, 6, 9]], "#5a1a26"), vline(t, 6, 6, 13, "#8e2a3a"), vline(t, 10, 6, 13, "#3a1018"), rect(t, 6, 8, 4, 4, k.pa), rect(t, 7, 9, 2, 2, k.r), hline(t, 7, 8, 2, k.g), px(t, 12, 12, "#8e2a3a"), rect(t, 12, 10, 2, 2, "#8e2a3a"), vline(t, 13, 12, 14, k.sL), hline(t, 12, 14, 14, k.sL);
    },
    GOOD_PORCELAIN: (t) => {
      let k = IK;
      icRows(t, [[1, 6, 9], [2, 7, 8], [3, 6, 9], [4, 5, 10], [5, 4, 11], [6, 3, 12], [7, 3, 12], [8, 3, 12], [9, 3, 12], [10, 4, 11], [11, 5, 10], [12, 6, 9], [13, 5, 10]], "#f4f6fa");
      hline(t, 6, 9, 1, k.b), hline(t, 5, 10, 13, k.b), hline(t, 4, 11, 5, k.b), hline(t, 4, 11, 10, k.b), px(t, 6, 7, k.b), px(t, 7, 8, k.b), px(t, 8, 7, k.b), px(t, 9, 8, k.b), px(t, 5, 8, k.bL), px(t, 10, 7, k.bL), vline(t, 12, 6, 9, "#c8d0dc"), vline(t, 11, 10, 10, "#c8d0dc"), px(t, 4, 6, "#ffffff");
    },
    GOOD_GOLD_BAR: (t) => {
      let k = IK,
        bar = (x, y, w) => (hline(t, x + 1, x + w - 2, y, k.gL), hline(t, x, x + w - 1, y + 1, k.g), hline(t, x, x + w - 1, y + 2, k.g), hline(t, x, x + w - 1, y + 3, k.gD), px(t, x + 2, y, "#fff6c0"), px(t, x + w - 1, y + 2, k.gD));
      bar(4, 3, 7), bar(1, 9, 6), bar(8, 9, 6), px(t, 13, 2, "#fff6c0"), px(t, 13, 4, k.gL), px(t, 12, 3, k.gL), px(t, 14, 3, k.gL);
    },
    GOOD_ANTIQUE: (t) => {
      let c = "#a8805c";
      icRows(t, [[1, 5, 10], [2, 6, 9], [3, 6, 9], [4, 5, 10], [5, 4, 11], [6, 3, 12], [7, 3, 12], [8, 3, 12], [9, 4, 11], [10, 5, 10], [11, 6, 9], [12, 6, 9], [13, 4, 11]], c);
      hline(t, 5, 10, 1, shade(c, 0.25)), hline(t, 4, 11, 13, shade(c, -0.3)), hline(t, 3, 12, 6, "#3a2a20"), hline(t, 3, 12, 8, "#3a2a20"), px(t, 5, 7, "#3a2a20"), px(t, 7, 7, "#3a2a20"), px(t, 9, 7, "#3a2a20"), px(t, 11, 7, "#3a2a20"), vline(t, 4, 5, 8, shade(c, 0.25)), vline(t, 11, 5, 9, shade(c, -0.25));
      rect(t, 1, 4, 2, 1, c), vline(t, 1, 4, 7, c), px(t, 2, 7, c), rect(t, 13, 4, 2, 1, c), vline(t, 14, 4, 7, c), px(t, 13, 7, c), px(t, 8, 10, "#3a2a20"), px(t, 6, 3, "#5a8a6a");
    },
    GOOD_EXOTIC_ANIMAL: (t) => {
      let k = IK;
      rect(t, 1, 3, 14, 2, k.wD), hline(t, 2, 13, 2, k.wL), rect(t, 1, 12, 14, 3, k.wD), hline(t, 1, 14, 12, k.w), rect(t, 2, 5, 12, 7, "#2a1a14"), rect(t, 5, 6, 6, 6, k.r), rect(t, 6, 5, 4, 2, k.r), px(t, 7, 7, "#ffffff"), px(t, 8, 7, k.ink), rect(t, 9, 8, 2, 1, k.g), vline(t, 5, 8, 11, k.b), hline(t, 6, 8, 11, k.g);
      for (let x = 2; x < 14; x += 3) vline(t, x, 5, 11, k.sL);
      rect(t, 7, 0, 2, 2, k.s);
    },
    GOOD_CHARM_DUST: (t) => {
      let k = IK;
      icRows(t, [[5, 6, 9], [6, 5, 10], [7, 4, 11], [8, 3, 12], [9, 3, 12], [10, 3, 12], [11, 3, 12], [12, 4, 11], [13, 5, 10]], k.p), hline(t, 6, 9, 4, k.g), rect(t, 5, 2, 6, 2, k.pL), hline(t, 5, 10, 1, k.pL), vline(t, 4, 8, 11, k.pL), vline(t, 11, 8, 12, k.pD), hline(t, 5, 10, 13, k.pD);
      vline(t, 7, 8, 10, "#fff6c0"), hline(t, 6, 8, 9, "#fff6c0"), px(t, 13, 2, "#e8d0ff"), px(t, 1, 5, "#e8d0ff"), px(t, 14, 6, k.pL), px(t, 2, 1, k.pL), px(t, 12, 0, k.pL), px(t, 9, 11, k.pL);
    },
    GOOD_BISCUIT_CRATE: (t) => {
      let k = IK;
      rect(t, 1, 7, 14, 7, k.w), hline(t, 1, 14, 7, k.wL), hline(t, 1, 14, 13, k.wD), vline(t, 1, 7, 13, k.wD), vline(t, 14, 7, 13, k.wD), vline(t, 5, 8, 12, k.wD), vline(t, 10, 8, 12, k.wD);
      for (let [x, y] of [
        [2, 3],
        [6, 2],
        [10, 3],
      ])
        rect(t, x, y, 4, 4, k.sk), hline(t, x, x + 3, y, "#f0d4b4"), hline(t, x, x + 3, y + 3, k.skD), px(t, x + 1, y + 1, k.wD), px(t, x + 2, y + 2, k.wD);
    },
    GOOD_PIRATE_CHEST: (t) => {
      let k = IK;
      rect(t, 1, 7, 14, 7, "#3a2a30"), rect(t, 1, 3, 14, 4, "#4a3a40"), hline(t, 2, 13, 2, "#4a3a40"), hline(t, 3, 12, 2, "#6a5a60"), hline(t, 1, 14, 7, k.s), hline(t, 1, 14, 13, "#1e1418"), vline(t, 1, 3, 13, k.s), vline(t, 14, 3, 13, k.sD), rect(t, 6, 8, 4, 3, k.wh), rect(t, 7, 11, 2, 1, k.wh), px(t, 6, 9, k.ink), px(t, 9, 9, k.ink), px(t, 7, 4, k.s), px(t, 8, 4, k.s), vline(t, 4, 3, 6, "#2a1a20"), vline(t, 11, 3, 6, "#2a1a20");
    },
  };
  export function goodIconCanvas(t, e = 1) {
    return icMake("g:" + (GOOD_ICONS[t] ? t : "crate"), GOOD_ICONS[t] || ICONS.crate, e);
  }

