// Genişleme 2–3 sahne objelerinin 3/4 bakış yeniden çizimi (Fable sanat geçişi; ccr-539f38e6 dalındaki
// tof-art-src/expansion3/x3props.js kaynağından taşındı). Props4/Props5'teki aynı adlı çizimlerin yerine geçer
// (bu modül sonra yüklenir). Ayrıca fırlatılan şişe/can simidi, çan ikonu ve kaptan gemilerinin yelken armaları.
import { rect, px, hline, vline, line, disc, ellipse, hash2, shade } from '../pixel.js';
import { DRAW, rock, wLine, Za, palm, hut, tower, boatHull, boatSeat, cargoSprite } from './Props.js';
import { npcSprite, petSprite, dS } from './TopChars.js';
import { _t2, deckBarrel, cannonDraw, SHIP_HOOKS } from './TopShip.js';

  // ===== Genişleme 2-3: yeni sahne objeleri, fırlatma nesneleri, çan ikonu, yelken armaları (3/4 bakış) =====
export const X3FX = {};
  (function (b, m, Q, Te, ce, H, ve, ee, _t, _t2, dS, ha, pa, Ca, rock, wLine, Za, palm, hut, tower, boatHull, boatSeat, deckBarrel, cannonDraw, N) {
    let R = Math.round,
      sh = (t, x, y, w, h = 3, al = 0.26) => ve(t, x, y, w, h, `rgba(10,22,34,${al})`),
      // piksel elips halkası
      ring = (t, x, y, rx, ry, c, step = 0.09) => {
        for (let q = 0; q < 6.283; q += step) m(t, x + Math.cos(q) * rx, y + Math.sin(q) * ry, c);
      },
      // taş blok yüzey (ön yüz): derzli
      stone = (t, x, y, w, h, c) => {
        b(t, x, y, w, h, c), Te(t, x, y, y + h - 1, _t(c, 0.14)), Te(t, x + w - 1, y, y + h - 1, _t(c, -0.24));
        for (let j = 3; j < h; j += 4) {
          Q(t, x, x + w - 1, y + j, _t(c, -0.2));
          for (let i = (Math.floor(j / 4) % 2) * 4 + 2; i < w - 1; i += 8) Te(t, x + i, y + j - 3, y + j - 1, _t(c, -0.16));
        }
      },
      raftDeck = (t, x, y, w, h, r) => {
        // üstten görünen kütük güverte + bize bakan kütük uçları
        for (let i = 0; i < w; i += 4) b(t, x + i, y, 4, h, (i / 4) % 2 ? "#8a5a2b" : "#7a4a24"), Te(t, x + i, y, y + h - 1, "#a87a4a");
        Q(t, x, x + w - 1, y + 2, "#c8a070"), Q(t, x, x + w - 1, y + h - 3, "#c8a070"), Q(t, x, x + w - 1, y + h - 2, "#3a2412");
        for (let i = 0; i < w; i += 4) b(t, x + i, y + h, 4, 3, (i / 4) % 2 ? "#5c3a1e" : "#4a2e18"), H(t, x + i + 2, y + h + 1, 1, "#c89a62");
        wLine(t, x + w / 2, y + h + 3, w / 2 + 1, r);
      };
    N.fort = (t, e, a, r, n = {}) => {
      let i = n.side || 1,
        S = "#8a8478";
      sh(t, e, a + 7, 46, 13, 0.28);
      rock(t, R(e - 28), R(a + 3), 17, "#5a5a62"), rock(t, R(e + 24), R(a + 5), 15, "#62626c"), rock(t, R(e - 2), R(a + 2), 24, "#6a6a72"), rock(t, R(e + 8), R(a + 7), 11, "#56565e");
      // arka siper dişleri + üst yürüyüş yolu + ön duvar
      for (let s = 0; s < 5; s++) b(t, e - 20 + s * 9, a - 43, 5, 4, _t(S, 0.05)), Q(t, e - 20 + s * 9, e - 16 + s * 9, a - 43, _t(S, 0.3));
      b(t, e - 21, a - 39, 42, 9, _t(S, 0.2)), Q(t, e - 21, e + 20, a - 39, _t(S, 0.34));
      for (let s = 0; s < 40; s += 7) m(t, e - 19 + s, a - 35 + (s % 2), _t(S, -0.06));
      stone(t, e - 21, a - 30, 42, 22, S);
      for (let s = 0; s < 6; s++) b(t, e - 21 + s * 8, a - 34, 5, 5, _t(S, 0.1)), Q(t, e - 21 + s * 8, e - 17 + s * 8, a - 34, _t(S, 0.34)), Te(t, e - 17 + s * 8, a - 33, a - 30, _t(S, -0.2));
      // kapı + mazgallar
      b(t, e - 4, a - 18, 8, 10, "#2a1a14"), Q(t, e - 3, e + 2, a - 19, "#2a1a14"), b(t, e - 3, a - 17, 6, 9, "#5a3a20"), Te(t, e, a - 17, a - 9, "#3a2412"), m(t, e + 1, a - 13, "#e0b040");
      for (let s of [-13, 13]) b(t, e + s - 1, a - 24, 2, 5, "#1e1a1e");
      // köşe kulesi + bayrak
      let tx = e + i * 14;
      b(t, tx - 6, a - 50, 12, 20, _t(S, 0.06)), Te(t, tx - 6, a - 50, a - 31, _t(S, 0.24)), Te(t, tx + 5, a - 50, a - 31, _t(S, -0.22)), Q(t, tx - 5, tx + 4, a - 44, _t(S, -0.12)), Q(t, tx - 5, tx + 4, a - 38, _t(S, -0.12)), m(t, tx - 2, a - 47, _t(S, -0.12)), m(t, tx + 2, a - 41, _t(S, -0.12)), m(t, tx - 3, a - 35, _t(S, -0.12)), b(t, tx - 7, a - 53, 14, 4, _t(S, 0.16)), Q(t, tx - 7, tx + 6, a - 53, _t(S, 0.36));
      for (let s = 0; s < 3; s++) b(t, tx - 7 + s * 5, a - 56, 3, 3, _t(S, 0.1));
      b(t, tx - 1, a - 46, 2, 4, "#1e1a1e"), Te(t, tx, a - 68, a - 56, "#3a2a1a"), b(t, tx + 1, a - 68, 7, 4, "#c8423b"), m(t, tx + 8, a - 67 + (Math.sin(r * 5) > 0 ? 1 : 0), "#c8423b"), Q(t, tx + 1, tx + 6, a - 65, "#8a2a26");
      // top (gemiye dönük)
      cannonDraw(t, R(e - i * 8), R(a - 33), -i, 0);
      n.fire && (H(t, e - i * 19, a - 37, 5, "#ffd060"), H(t, e - i * 23, a - 37, 3, "#fff6c0"), m(t, e - i * 27, a - 38, "#ffffff"));
      if (n.smoke) for (let s = 0; s < 5; s++) H(t, e - i * 4 + Math.sin(r * 2 + s) * 4, a - 40 - s * 6 - ((r * 10) % 6), 4 + s, `rgba(60,56,52,${0.5 - s * 0.08})`);
      for (let s = 0; s < 14; s++) m(t, e - 20 + ee(s, 801) * 40, a - 12 + ee(s, 802) * 4, "#4a7a44");
      wLine(t, e, a + 9, 42, r);
    };
    N.chainBar = (t, e, a, r, n = {}) => {
      let w = n.w || 140,
        cnt = Math.floor(w / 6),
        sag = n.taut ? 2 : 7;
      for (let o of [-1, 1]) {
        let x = R(e + o * (w / 2 + 3));
        sh(t, x + 1, a + 5, 6, 2), b(t, x - 3, a - 13, 6, 18, "#5a4a3a"), Te(t, x - 3, a - 13, a + 4, "#7a6a52"), Te(t, x + 2, a - 12, a + 4, "#3a2e22"), b(t, x - 3, a - 15, 6, 2, "#8a7a62"), Q(t, x - 3, x + 2, a - 9, "#2a2a30"), b(t, x - o * 3 - 1, a - 8, 3, 3, "#3a3a44"), wLine(t, x, a + 5, 5, r);
      }
      for (let o = 0; o <= cnt; o++) {
        let q = o / cnt;
        if (n.broken && Math.abs(q - 0.5) < 0.09) continue;
        let x = R(e - w / 2 + q * w),
          drop = n.broken ? Math.min(1, Math.abs(q - 0.5) < 0.2 ? 1.6 : 1) : 1,
          y = R(a - 7 + Math.sin(q * Math.PI) * sag * drop + Math.sin(r * 2 + o) * 0.5),
          wet = y >= a - 1;
        o % 2 ? (b(t, x - 2, y, 4, 3, wet ? "rgba(60,56,64,0.6)" : "#3a3a44"), m(t, x - 1, y + 1, wet ? "rgba(30,60,90,0.5)" : "#1a1a22"), m(t, x, y + 1, wet ? "rgba(30,60,90,0.5)" : "#1a1a22"), wet || m(t, x - 2, y, "#7a7a86")) : (b(t, x - 1, y + 1, 3, 1, wet ? "rgba(90,86,94,0.6)" : "#5a5a66"), wet || m(t, x - 1, y + 1, "#9a9aa6"));
        wet && o % 3 === 0 && m(t, x, y - 1, "rgba(235,248,252,0.85)");
      }
      n.broken && (m(t, e - 6, a + 3, "#ffffff"), m(t, e + 6, a + 2, "#ffffff"), Za(t, e, a + 2, 8, r, 0.6));
    };
    N.footprints = (t, e, a, r, n = {}) => {
      let cnt = n.n != null ? n.n : 8,
        dx = n.dx != null ? n.dx : 6,
        dy = n.dy != null ? n.dy : 10;
      for (let f = 0; f < cnt; f++) {
        let s = f % 2 ? 1 : -1,
          x = R(e + f * dx + s * 4),
          y = R(a + f * dy),
          al = Math.max(0.15, 0.9 - (cnt - f) * 0.07),
          c = `rgba(215,245,255,${al})`,
          rr = 5 + ((r * 8 + f * 3) % 9);
        ring(t, x, y, rr, rr * 0.5, `rgba(230,250,255,${Math.max(0, 0.5 - rr / 22)})`, 0.2);
        b(t, x - 1, y - 2, 3, 4, c), b(t, x - 1 + (s > 0 ? 0 : 0), y + 2, 2, 2, c), m(t, x - 2 * s, y - 4, c), m(t, x, y - 4, c), m(t, x + 1 * s, y - 3, c), m(t, x, y - 1, `rgba(255,255,255,${al})`);
      }
      if (n.ghost) {
        let x = e + cnt * dx,
          y = a + cnt * dy;
        for (let f = 0; f < 9; f++) m(t, x + Math.sin(r * 3 + f) * (3 - f * 0.2), y - 6 - f * 2.2, `rgba(200,235,255,${0.5 - f * 0.05})`), f < 5 && m(t, x + 1 + Math.sin(r * 3 + f) * 3, y - 6 - f * 2, `rgba(200,235,255,${0.3 - f * 0.05})`);
      }
    };
    N.stoneFish = (t, e, a, r, n = {}) => {
      let cnt = n.n || 22,
        fz = n.frozen != null ? n.frozen : 0.5;
      ve(t, e, a, 48, 22, "rgba(10,40,60,0.18)");
      for (let l = 0; l < cnt; l++) {
        let st = ee(l, 301) < fz,
          k = st ? l * 0.6 : r * 1.4 + l * 0.6,
          x = R(e + Math.cos(k * 0.7 + l) * (8 + (l % 5) * 7)),
          y = R(a + Math.sin(k + l * 1.7) * (5 + (l % 4) * 3) + (st ? 2 : 0)),
          d = -Math.sin(k * 0.7 + l) > 0 ? 1 : -1;
        if (st) {
          m(t, x + 1, y + 2, "rgba(10,30,50,0.35)"), b(t, x - 3, y - 1, 6, 3, "#8a8478"), Q(t, x - 2, x + 1, y - 2, "#8a8478"), Q(t, x - 2, x + 1, y - 2, "#b8b2a8"), Q(t, x - 3, x + 2, y + 1, "#5e5a52"), b(t, x + d * 3 + (d > 0 ? 0 : -1), y - 2, 2, 5, "#77726a"), m(t, x - d * 2, y - 1, "#3a3834"), m(t, x, y, "#5e5a52");
          Math.sin(r * 2 + l) > 0.8 && m(t, x, y - 4 - ((r * 6) % 4), "#d8f0f8");
        } else m(t, x + 1, y + 1, "rgba(10,30,50,0.3)"), Q(t, x - 2, x + 1, y, Math.sin(r * 6 + l) > 0.2 ? "#bfe3ef" : "#8ab4d0"), Q(t, x - 1, x + 1, y - 1, "#4a7a98"), m(t, x - d * 3, y - 1, "#4a7a98"), m(t, x - d * 3, y + 1, "#4a7a98"), m(t, x - d * 2, y, "#4a7a98"), m(t, x + d * 2, y, "#1a2a34");
      }
    };
    N.soundRings = (t, e, a, r, n = {}) => {
      let c = n.col || "120,220,255";
      for (let s = 0; s < 4; s++) {
        let o = 6 + ((r * 18 + s * 14) % 56),
          al = Math.max(0, 0.7 - o / 62);
        ring(t, e, a, o, o * 0.5, `rgba(${c},${al})`, 0.5 / Math.sqrt(o)), ring(t, e, a, o - 1, (o - 1) * 0.5, `rgba(${c},${al * 0.4})`, 0.9 / Math.sqrt(o));
      }
      let p = 3 + Math.sin(r * 4) * 1.5;
      ve(t, e, a, p + 2, (p + 2) * 0.6, `rgba(${c},0.3)`), ve(t, e, a, p, p * 0.6, `rgba(${c},0.6)`), m(t, e, a, "#ffffff");
    };
    N.waterWall = (t, e, a, r, n = {}) => {
      let i = n.r || 120;
      ve(t, e, a, i * 0.92, i * 0.55, "rgba(20,60,90,0.12)");
      // önce arka yarı, sonra ön yarı (ön taraf daha yüksek ve opak)
      for (let pass = 0; pass < 2; pass++)
        for (let s = 0; s < Math.PI * 2; s += 0.035) {
          let o = s + r * 0.5,
            sn = Math.sin(o);
          if (pass === 0 ? sn > 0 : sn <= 0) continue;
          if (n.gap != null && Math.abs(((o - n.gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.35) continue;
          let x = R(e + Math.cos(o) * i),
            y = R(a + sn * i * 0.62),
            h = R((pass ? 15 : 8) + Math.sin(s * 9 + r * 4) * 2.5 + Math.sin(s * 23 - r * 2) * 1.5);
          for (let k = 0; k <= h; k++) {
            let q = k / h;
            m(t, x, y - k, pass ? (q > 0.85 ? "#e8f6fb" : q > 0.6 ? "rgba(140,200,225,0.9)" : q > 0.25 ? "rgba(74,150,188,0.85)" : "rgba(47,120,166,0.85)") : q > 0.8 ? "rgba(232,246,251,0.8)" : "rgba(90,150,190,0.55)");
          }
          (R(s * 30) + R(r * 6)) % 5 === 0 && m(t, x, y - h - 2, "#ffffff"), pass && R(s * 40) % 3 === 0 && m(t, x, y + 1, "rgba(235,248,252,0.85)");
        }
    };
    N.stormFront = (t, e, a, r, n = {}) => {
      let i = n.side || 1;
      // deniz üzerindeki gölge
      for (let s = 0; s < 6; s++) ve(t, e + (ee(s, 311) - 0.5) * 110, a + 34 + (ee(s, 312) - 0.5) * 30, 26, 10, "rgba(10,14,26,0.16)");
      t.fillStyle = "rgba(190,210,235,0.5)";
      for (let s = 0; s < 46; s++) {
        let x = e + (ee(s, 315) - 0.5) * 130 + ((r * 40 * i) % 10),
          y = a + 14 + ((r * 120 + s * 13) % 74);
        t.fillRect(R(x - (y - a) * 0.12 * i), R(y), 1, 4);
      }
      let L = [];
      for (let s = 0; s < 14; s++) L.push({ x: e + (ee(s, 311) - 0.5) * 130 + Math.sin(r * 0.6 + s) * 3, y: a + (ee(s, 312) - 0.5) * 40, u: 12 + ee(s, 313) * 12, s });
      L.sort((p, q) => p.y - q.y);
      for (let c of L) {
        ve(t, c.x, c.y + 4, c.u, c.u * 0.5, "#1c1e2c"), ve(t, c.x, c.y, c.u, c.u * 0.58, c.s % 3 ? "#34384c" : "#2a2e40"), ve(t, c.x - c.u * 0.18, c.y - c.u * 0.2, c.u * 0.68, c.u * 0.32, "#4a5068"), ve(t, c.x - c.u * 0.3, c.y - c.u * 0.32, c.u * 0.34, c.u * 0.14, "#6a7090");
      }
      if (Math.sin(r * 3 + (i > 0 ? 1 : 2)) > 0.94) {
        let x = e - 8 * i;
        ce(t, x, a + 4, x + 5, a + 22, "#fff6c0"), ce(t, x + 5, a + 22, x - 3, a + 30, "#fff6c0"), ce(t, x - 3, a + 30, x + 3, a + 52, "#fff6c0"), ce(t, x + 1, a + 4, x + 6, a + 22, "#ffffff"), H(t, x + 3, a + 52, 4, "rgba(255,246,192,0.4)"), ve(t, e, a, 60, 22, "rgba(220,230,255,0.12)");
      }
    };
    N.theatreStage = (t, e, a, r, n = {}) => {
      let y = R(a + Math.sin(r * 1.1)),
        op = n.open != null ? n.open : 1,
        cw = R(26 * (1 - op)) + 4;
      Za(t, e, y + 12, 40, r * 0.5, 0.5), raftDeck(t, e - 34, y - 4, 68, 14, r);
      // arka dekor
      b(t, e - 28, y - 32, 56, 28, "#3b6ea5"), b(t, e - 28, y - 12, 56, 8, "#2f78a6"), H(t, e + 12, y - 22, 5, "#f2c14e"), Q(t, e - 26, e - 10, y - 20, "#f4ead5"), Q(t, e - 22, e - 14, y - 22, "#f4ead5"), Q(t, e - 28, e + 27, y - 4, "#5c3a1e");
      // oyuncular
      if (op > 0.3) {
        let l = Math.sin(r * 6) * 1.5;
        dS(t, ha("villager", "down", Math.sin(r * 3) > 0 ? "react" : "idle", 0), e - 9, y + 4 + l), dS(t, ha("merchant", "down", "work", Math.floor(r * 4) % 4), e + 9, y + 4 - l);
      }
      // perdeler
      for (let s of [-1, 1]) {
        let x0 = s < 0 ? e - 28 : e + 28 - cw;
        b(t, x0, y - 32, cw, 28, "#a02a34");
        for (let k = 1; k < cw; k += 3) Te(t, x0 + k, y - 32, y - 5, "#7e1e28");
        Te(t, s < 0 ? x0 + cw - 1 : x0, y - 32, y - 5, "#c8424c"), Q(t, x0, x0 + cw - 1, y - 5, "#e0b040");
      }
      // çerçeve: direkler + üst saçak
      for (let s of [-1, 1]) b(t, e + s * 30 - 2, y - 36, 4, 36, "#5a4020"), Te(t, e + s * 30 - 2, y - 36, y - 1, "#8a6a34"), b(t, e + s * 30 - 3, y - 2, 6, 2, "#3a2412");
      b(t, e - 33, y - 41, 66, 6, "#8a1f2a"), Q(t, e - 33, e + 32, y - 41, "#c8424c");
      for (let k = 0; k < 11; k++) b(t, e - 33 + k * 6, y - 35, 6, 3, k % 2 ? "#a02a34" : "#e0b040"), m(t, e - 31 + k * 6, y - 32, k % 2 ? "#a02a34" : "#e0b040");
      b(t, e - 5, y - 46, 10, 5, "#e0b040"), m(t, e - 2, y - 44, "#3a2412"), m(t, e + 1, y - 44, "#3a2412"), Q(t, e - 2, e + 1, y - 43, "#3a2412");
      // sahne ışıkları
      for (let l = 0; l < 6; l++) {
        let on = Math.sin(r * 5 + l) > 0;
        b(t, e - 26 + l * 10, y + 7, 3, 2, "#3a2a1a"), m(t, e - 25 + l * 10, y + 6, on ? "#fff0a0" : "#c8a040"), on && H(t, e - 25 + l * 10, y + 5, 3, "rgba(255,230,140,0.16)");
      }
    };
    N.scales = (t, e, a, r, n = {}) => {
      let i = R((n.tilt != null ? n.tilt : Math.sin(r * 2) * 0.3) * 5);
      sh(t, e, a + 2, 11, 3), b(t, e - 6, a - 1, 12, 3, "#8a6a20"), Q(t, e - 6, e + 5, a - 1, "#e0b040"), b(t, e - 3, a - 3, 6, 2, "#b8862b"), b(t, e - 1, a - 18, 2, 15, "#c89030"), Te(t, e - 1, a - 18, a - 4, "#f2c14e"), H(t, e, a - 19, 2, "#b8862b"), m(t, e, a - 20, "#fff6c0");
      ce(t, e - 12, a - 17 + i, e + 12, a - 17 - i, "#e0b040"), ce(t, e - 12, a - 16 + i, e + 12, a - 16 - i, "#b8862b");
      for (let [o, l, k] of [
        [-12, i, 0],
        [12, -i, 1],
      ]) {
        let y = a - 8 + l;
        ce(t, e + o, a - 17 + l, e + o - 4, y, "#a08040"), ce(t, e + o, a - 17 + l, e + o + 4, y, "#a08040"), b(t, e + o - 5, y, 11, 2, "#e0b040"), Q(t, e + o - 4, e + o + 4, y + 2, "#b8862b"), Q(t, e + o - 5, e + o + 5, y, "#ffe08a");
        k ? (b(t, e + o - 2, y - 4, 5, 4, "#a87a4a"), Q(t, e + o - 2, e + o + 2, y - 4, "#c89a62"), m(t, e + o, y - 2, "#e07b39")) : (b(t, e + o - 2, y - 2, 2, 2, "#f2c14e"), b(t, e + o + 1, y - 3, 2, 3, "#f2c14e"), m(t, e + o - 1, y - 3, "#fff6c0"));
      }
      n.cheat && (b(t, e - 15, a - 5 + i, 4, 3, "#5a5a62"), Q(t, e - 15, e - 12, a - 5 + i, "#8a8a92"), m(t, e - 13, a - 7 + i, Math.sin(r * 6) > 0 ? "#ffffff" : "#c8c8d0"));
    };
    N.mechanism = (t, e, a, r, n = {}) => {
      let sp = n.closed ? 0 : n.slow ? 0.3 : 1.6;
      ve(t, e, a, 54, 28, "rgba(10,30,50,0.3)"), ve(t, e, a, 44, 21, "rgba(20,50,70,0.25)");
      for (let [dx, dy, rr, dir, c] of [
        [-18, -2, 15, 1, "170,140,90"],
        [9, -7, 11, -1, "150,150,130"],
        [22, 8, 9, 1, "180,120,80"],
      ]) {
        let x = e + dx,
          y = a + dy,
          an = r * sp * dir,
          teeth = Math.round(rr * 1.1);
        ring(t, x, y, rr - 2, (rr - 2) * 0.6, `rgba(${c},0.7)`, 0.5 / Math.sqrt(rr)), ring(t, x, y, rr - 3, (rr - 3) * 0.6, `rgba(${c},0.45)`, 0.7 / Math.sqrt(rr));
        for (let f = 0; f < teeth; f++) {
          let q = an + (f / teeth) * 6.283;
          b(t, x + Math.cos(q) * rr - 1, y + Math.sin(q) * rr * 0.6 - 1, 2, 2, `rgba(${c},0.85)`);
        }
        for (let f = 0; f < 4; f++) {
          let q = an + (f / 4) * 3.1416;
          ce(t, x - Math.cos(q) * (rr - 3), y - Math.sin(q) * (rr - 3) * 0.6, x + Math.cos(q) * (rr - 3), y + Math.sin(q) * (rr - 3) * 0.6, `rgba(${c},0.4)`);
        }
        ve(t, x, y, 2, 1, `rgba(60,50,40,0.85)`), m(t, x, y, n.closed ? "#ffe080" : "#8ad8ff");
      }
      if (n.closed) for (let s = 0; s < 7; s++) m(t, e - 24 + s * 8, a - 16 - Math.sin(r * 2 + s) * 2, "rgba(255,240,180,0.8)");
      else for (let s = 0; s < 8; s++) m(t, e - 30 + ((r * 30 * sp + s * 12) % 60), a + 14 + Math.sin(r * 3 + s) * 2, "rgba(200,240,255,0.7)"), s % 2 && m(t, e - 20 + ee(s, 5) * 40, a - 8 - ((r * 8 + s * 5) % 14), "rgba(220,245,255,0.6)");
    };
    N.raceBuoy = (t, e, a, r, n = {}) => {
      let y = R(a + Math.sin(r * 1.6)),
        c = n.col || "#c8423b",
        w = Math.sin(r * 6) > 0 ? 1 : 0;
      Za(t, e, a + 3, 9, r), b(t, e - 5, y - 5, 10, 7, "#e8e0c8"), Q(t, e - 4, e + 3, y - 6, "#f8f0d8"), b(t, e - 5, y - 3, 10, 3, c), Q(t, e - 5, e + 4, y - 1, _t2(c, -0.3)), Te(t, e + 4, y - 5, y + 1, "#c0b8a0"), Q(t, e - 4, e + 3, y + 2, "#8a8470");
      b(t, e - 1, y - 9, 2, 3, "#3a3a44"), Te(t, e, y - 24, y - 6, "#3a2a1a"), m(t, e, y - 25, "#e0b040");
      b(t, e + 1, y - 24, 5, 6, c), b(t, e + 6, y - 24 + w, 4, 5, c), m(t, e + 10, y - 22 + w, c), Q(t, e + 1, e + 5, y - 19, _t2(c, -0.3)), b(t, e + 3, y - 23, 2, 2, "#ffffff"), wLine(t, e, y + 3, 6, r);
    };
    N.coralLine = (t, e, a, r, n = {}) => {
      let cnt = n.n || 18,
        heal = n.heal || 0,
        L = [];
      ve(t, e, a, 84, 31, "rgba(60,170,180,0.16)"), ve(t, e, a, 70, 24, "rgba(120,210,210,0.14)");
      for (let o = 0; o < cnt; o++) L.push({ o, x: R(e + (ee(o, 321) - 0.5) * 150), y: R(a + (ee(o, 322) - 0.5) * 46) });
      L.sort((p, q) => p.y - q.y);
      for (let k of L) {
        let o = k.o,
          x = k.x,
          y = k.y,
          live = x < e || ee(o, 323) < heal,
          c = live ? ["#e0607a", "#f0a050", "#58d0c8", "#c070e0"][o % 4] : "#9a948a",
          d = _t(c, -0.3),
          l = _t(c, 0.3),
          h = 4 + R(ee(o, 324) * 5),
          kind = o % 3;
        m(t, x, y + 1, "rgba(10,40,50,0.35)"), m(t, x + 1, y + 1, "rgba(10,40,50,0.35)");
        if (kind === 0) {
          // dallı mercan
          Te(t, x, y - h, y, c), ce(t, x, y - R(h * 0.4), x - 3, y - h + 1, c), ce(t, x, y - R(h * 0.6), x + 3, y - h, c), m(t, x - 3, y - h, l), m(t, x + 3, y - h - 1, l), m(t, x, y - h - 1, l), m(t, x + 1, y - 1, d);
        } else if (kind === 1) {
          // beyin mercanı
          ve(t, x, y - 2, 4, 3, c), Q(t, x - 3, x + 3, y, d), Q(t, x - 2, x + 1, y - 4, l), m(t, x - 1, y - 2, d), m(t, x + 2, y - 3, d), m(t, x + 1, y - 1, d);
        } else {
          // yelpaze
          for (let q = -3; q <= 3; q++) ce(t, x, y, x + q, y - h + Math.abs(q), q % 2 ? c : d);
          Q(t, x - 2, x + 2, y - h + 1, l);
        }
        live && Math.sin(r * 2 + o) > 0.7 && m(t, x, y - h - 2, "#ffffff");
      }
      if (heal > 0.5)
        for (let o = 0; o < 6; o++) {
          let x = e + Math.cos(r + o) * 34,
            y = a + Math.sin(r * 1.3 + o) * 12;
          Q(t, x - 1, x + 1, y, ["#7ad8ff", "#ffd060", "#ff8a70"][o % 3]), m(t, x + (Math.sin(r + o) > 0 ? -2 : 2), y, "#f4fbff");
        }
    };
    N.tangledGull = (t, e, a, r, n = {}) => {
      if (n.free) {
        (t.fillStyle = "rgba(0,0,0,0.16)"), t.fillRect(R(e - 3), R(a + 1), 7, 2), dS(t, pa("PET_MARTI", "down", Math.sin(r * 9) > 0 ? "fly0" : "fly1"), e, a - 8 - Math.abs(Math.sin(r * 2)) * 4);
        return;
      }
      let w = Math.sin(r * 7) > 0.5 ? 1 : 0;
      sh(t, e, a + 1, 8, 2), dS(t, pa("PET_MARTI", "down", w ? "fluff" : "idle"), e + w, a + 2);
      // dolaşmış ağ ve ipler
      for (let k = -2; k <= 2; k++) ce(t, e - 7, a - 9 + k * 3, e + 7, a - 5 + k * 3, "rgba(200,176,128,0.9)");
      for (let k = -1; k <= 1; k++) ce(t, e + k * 4 - 2, a - 13, e + k * 4 + 2, a + 1, "rgba(168,140,96,0.9)");
      ce(t, e + 6, a - 2, e + 13, a + 2, "#c8b080"), b(t, e + 12, a, 3, 3, "#c8423b"), m(t, e + 12, a, "#f08070"), w && (m(t, e - 9, a - 12, "#ffffff"), m(t, e + 9, a - 14, "#ffffff"));
    };
    N.parcel = (t, e, a, r, n = {}) => {
      sh(t, e, a + 1, 7, 2), b(t, e - 6, a - 6, 12, 7, "#b8905a"), b(t, e - 6, a - 9, 12, 3, "#d8b07a"), Q(t, e - 6, e + 5, a - 9, "#e8c890"), Q(t, e - 6, e + 5, a, "#8a6a40"), Te(t, e + 5, a - 6, a, "#9a7848");
      if (n.open) b(t, e - 5, a - 12, 10, 3, "#8a6a40"), Q(t, e - 5, e + 4, a - 12, "#d8b07a"), b(t, e - 3, a - 11, 6, 3, "#f4ead5"), m(t, e - 1, a - 10, "#c8423b"), Math.sin(r * 4) > 0 && m(t, e + 3, a - 14, "#fff6c0");
      else Te(t, e, a - 9, a, "#7a5030"), Q(t, e - 6, e + 5, a - 4, "#7a5030"), Q(t, e - 6, e + 5, a - 8, "#7a5030"), b(t, e - 1, a - 5, 3, 3, "#b8282c"), m(t, e, a - 4, "#f08070"), m(t, e - 2, a - 10, "#7a5030"), m(t, e + 2, a - 10, "#7a5030");
    };
    N.strategyTable = (t, e, a, r) => {
      sh(t, e, a + 4, 15, 3), b(t, e - 13, a - 1, 26, 3, "#5c3a1e"), b(t, e - 12, a + 2, 2, 3, "#3a2412"), b(t, e + 10, a + 2, 2, 3, "#3a2412"), b(t, e - 13, a - 11, 26, 10, "#8a5a2b"), Q(t, e - 13, e + 12, a - 11, "#b07a42");
      // oyun tahtası + taşlar
      b(t, e - 10, a - 10, 20, 8, "#e8d8a8");
      for (let i = 0; i < 5; i++) for (let s = 0; s < 2; s++) b(t, e - 10 + i * 4, a - 10 + s * 4, 4, 4, (i + s) % 2 ? "#e8d8a8" : "#6a4a2a");
      let st = Math.floor(r * 1.5) % 4;
      for (let k = 0; k < 3; k++) b(t, e - 9 + ((k * 2 + st) % 5) * 4, a - 12 + (k % 2) * 4, 2, 3, "#c8423b"), m(t, e - 9 + ((k * 2 + st) % 5) * 4, a - 12 + (k % 2) * 4, "#f08070");
      for (let k = 0; k < 3; k++) b(t, e + 7 - ((k * 2 + st) % 5) * 4, a - 9 - (k % 2) * 3, 2, 3, "#3b6ea5"), m(t, e + 7 - ((k * 2 + st) % 5) * 4, a - 9 - (k % 2) * 3, "#7ab0e0");
      b(t, e + 11, a - 13, 2, 4, "#c8a040"), m(t, e + 11, a - 14, "#ffe08a");
    };
    N.herbBowl = (t, e, a, r) => {
      sh(t, e, a + 1, 8, 2);
      for (let i = 0; i < 5; i++) Q(t, e - 6 + Math.max(0, i - 2), e + 5 - Math.max(0, i - 2), a - 4 + i, i < 2 ? "#a87a4a" : "#8a6a44");
      Q(t, e - 6, e + 5, a - 5, "#c89a62"), Q(t, e - 5, e + 4, a - 5, "#5a8a4a"), m(t, e - 3, a - 6, "#8ac86a"), m(t, e - 1, a - 7, "#5a9e4b"), m(t, e + 1, a - 6, "#8ac86a"), m(t, e + 3, a - 6, "#3f7a46"), m(t, e, a - 6, "#c8a0e8");
      ce(t, e + 2, a - 7, e + 6, a - 12, "#d8d0c0"), m(t, e + 7, a - 13, "#f4ead5"), b(t, e - 11, a - 2, 3, 3, "#6a9a4a"), m(t, e - 10, a - 4, "#c8a060");
      for (let k = 0; k < 3; k++) m(t, e - 2 + k * 2 + Math.sin(r * 3 + k), a - 9 - ((r * 6 + k * 2) % 7), "rgba(220,240,220,0.65)");
    };
    N.signalFlags = (t, e, a, r, n = {}) => {
      let cols = n.cols || ["#e0c040", "#1a1a1a", "#e0c040", "#c8423b"];
      for (let s of [-1, 1]) Te(t, e + s * 22, a - 22, a, "#3a2412"), Te(t, e + s * 22 + 1, a - 21, a, "#6a4424"), m(t, e + s * 22, a - 23, "#e0b040"), (t.fillStyle = "rgba(20,10,4,0.25)"), t.fillRect(e + s * 22 - 1, a, 4, 1);
      for (let x = -22; x <= 22; x++) m(t, e + x, a - 20 + R(Math.sin(((x + 22) / 44) * Math.PI) * 4), "#c8a070");
      cols.forEach((c, o) => {
        let x = e - 17 + o * (34 / Math.max(1, cols.length - 1)) - 3,
          y = a - 19 + R(Math.sin(((x - e + 25) / 44) * Math.PI) * 4),
          w = Math.sin(r * 6 + o) > 0 ? 1 : 0;
        b(t, R(x), y, 7, 6 + w, c), Q(t, R(x), R(x) + 6, y, _t2(c, 0.25)), Te(t, R(x) + 6, y, y + 5 + w, _t2(c, -0.25));
        c === "#1a1a1a" ? Q(t, R(x), R(x) + 6, y + 3, "#e0c040") : o % 2 ? b(t, R(x) + 2, y + 2, 3, 2, "#f4ead5") : ce(t, R(x), y, R(x) + 6, y + 5, _t2(c, -0.35));
      });
    };
    N.duelPlank = (t, e, a, r, n = {}) => {
      let w = n.w || 60,
        x0 = R(e - w / 2);
      (t.fillStyle = "rgba(10,22,34,0.22)"), t.fillRect(x0 + 2, a + 7, w - 2, 3);
      b(t, x0, a - 3, w, 5, "#a8865a"), Q(t, x0, x0 + w - 1, a - 3, "#c8a878"), b(t, x0, a + 2, w, 2, "#6a4a28"), Q(t, x0, x0 + w - 1, a + 3, "#4a3018");
      for (let s = 7; s < w; s += 9) Te(t, x0 + s, a - 3, a + 1, "#7a5a36"), m(t, x0 + s - 2, a - 1, "#5a4020");
      for (let s of [0, w - 4]) b(t, x0 + s, a - 4, 4, 7, "#c8a070"), Te(t, x0 + s + 1, a - 4, a + 2, "#8a6a40");
      for (let x = 4; x < w - 3; x += 5) Math.sin(x + r * 3) > 0.2 && m(t, x0 + x, a + 8, "rgba(235,248,252,0.7)");
    };
    N.armadaLantern = (t, e, a, r, n = {}) => {
      // direğe asılı buz feneri
      Te(t, e, a - 16, a - 12, "#5a6a78"), m(t, e - 1, a - 16, "#5a6a78"), m(t, e + 1, a - 16, "#5a6a78");
      if (n.off) {
        b(t, e - 3, a - 12, 7, 10, "#2e3640"), b(t, e - 2, a - 10, 5, 6, "#3a4450"), Q(t, e - 3, e + 3, a - 12, "#55626e"), m(t, e - 1, a - 1, "#8aa4b8"), m(t, e + 1, a, "#8aa4b8");
        return;
      }
      let p = n.sync ? 1 : 0.55 + 0.45 * Math.sin(r * (2 + (n.ph || 0)) + (n.ph || 0) * 3),
        rad = n.blind ? 26 : 9 + p * 5;
      H(t, e, a - 7, R(rad), `rgba(200,240,255,${(n.blind ? 0.3 : 0.12) * (0.6 + p * 0.4)})`), H(t, e, a - 7, R(rad * 0.55), `rgba(220,248,255,${0.14 + p * 0.14})`);
      b(t, e - 4, a - 13, 9, 2, "#55626e"), Q(t, e - 3, e + 3, a - 14, "#8aa4b8"), b(t, e - 3, a - 11, 7, 8, "#3a4a58"), b(t, e - 2, a - 10, 5, 6, n.sync ? "#ffffff" : p > 0.7 ? "#e8fbff" : "#b8ecff"), Te(t, e, a - 10, a - 5, "#3a4a58"), b(t, e - 4, a - 3, 9, 2, "#55626e");
      m(t, e - 1, a - 9, "#ffffff"), m(t, e - 3, a - 1, "#d8f0ff"), m(t, e - 3, a, "#d8f0ff"), m(t, e, a - 1, "#d8f0ff"), m(t, e + 3, a - 1, "#d8f0ff"), m(t, e + 3, a, "#b8e0f8"), m(t, e + 3, a + 1, "#b8e0f8");
      if (n.sync)
        for (let o = 0; o < 8; o++) {
          let q = o * 0.785 + r;
          m(t, e + Math.cos(q) * 12, a - 7 + Math.sin(q) * 8, "#ffffff"), o % 2 && m(t, e + Math.cos(q) * 13, a - 7 + Math.sin(q) * 9, "rgba(220,248,255,0.7)");
        }
    };
    N.frost = (t, e, a, r, n = {}) => {
      let w = n.w || 60,
        h = n.h || 90;
      for (let o = 0; o < (n.n || 22); o++) {
        let x = R(e + (ee(o, 51) - 0.5) * w + Math.sin(r + o) * 2),
          y = R(a + (ee(o, 52) - 0.5) * h - ((r * 4 + o * 7) % 12)),
          tw = Math.sin(r * 3 + o);
        if (tw < 0.1) continue;
        m(t, x, y, "#ffffff");
        if (o % 3 === 0 && tw > 0.5) Q(t, x - 2, x + 2, y, "rgba(210,240,255,0.8)"), Te(t, x, y - 2, y + 2, "rgba(210,240,255,0.8)"), m(t, x - 1, y - 1, "rgba(210,240,255,0.5)"), m(t, x + 1, y + 1, "rgba(210,240,255,0.5)"), m(t, x + 1, y - 1, "rgba(210,240,255,0.5)"), m(t, x - 1, y + 1, "rgba(210,240,255,0.5)");
        else m(t, x + 1, y, "rgba(200,236,255,0.6)"), m(t, x, y - 1, "rgba(200,236,255,0.6)");
      }
    };
    N.stonePillar = (t, e, a, r, n = {}) => {
      let hf = n.h != null ? n.h : 1,
        i = R(hf * (n.H || 46)),
        s = n.w || 12;
      e = R(e);
      a = R(a);
      sh(t, e, a + 2, s + 7, 5, 0.3);
      if (i <= 0) {
        Za(t, e, a, s, r), Za(t, e, a, s * 0.5, -r * 1.3, 0.5);
        for (let u = 0; u < 4; u++) m(t, e - s + 2 + u * 6, a - ((r * 14 + u * 5) % 6), "#d8f0f8");
        return;
      }
      for (let u = 0; u <= i; u++) {
        let k = u / Math.max(1, i),
          course = (u + e) % 8 === 0;
        for (let h = -s; h <= s; h++) {
          let q = (h + s) / (2 * s),
            c = q < 0.14 ? "#a4a29a" : q < 0.34 ? "#8c8a82" : q < 0.7 ? "#72706a" : q < 0.88 ? "#5c5a55" : "#4a4844";
          k < 0.14 && (c = _t2(c, -0.25));
          course ? (c = "#4a4844") : (h + (Math.floor((u + e) / 8) % 2) * 5 + 40) % 10 === 0 && (c = "#514f4b");
          m(t, e + h, a - u, c);
        }
        k < 0.22 && ee(u, e) > 0.5 && m(t, e - s + R(ee(u, 7) * 2 * s), a - u, "#3e7a4a"), k < 0.1 && ee(u, e + 3) > 0.6 && m(t, e - s + R(ee(u, 9) * 2 * s), a - u, "#2a5a3a");
      }
      // üst yüzey (üstten görünür)
      ve(t, e, a - i, s, 4, "#8a8880"), ve(t, e, a - i - 1, s, 4, "#aeaca4"), ve(t, e - 2, a - i - 2, s - 4, 2, "#c4c2ba");
      if (n.top) b(t, e - s - 3, a - i - 4, s * 2 + 7, 5, "#8a8880"), Q(t, e - s - 3, e + s + 3, a - i - 5, "#c4c2ba"), Q(t, e - s - 3, e + s + 3, a - i - 4, "#b4b2aa"), Q(t, e - s - 3, e + s + 3, a - i, "#55534e"), Te(t, e + s + 3, a - i - 4, a - i, "#6a6862");
      if (n.glyph && i > 14) {
        let al = 0.55 + (0.5 + 0.5 * Math.sin(r * 3 + e * 0.1)) * 0.45,
          c = `rgba(120,240,220,${al})`,
          f = a - R(i * 0.55);
        H(t, e, f - 1, 7, `rgba(120,240,220,${al * 0.14})`), ce(t, e - 5, f - 4, e, f + 3, c), ce(t, e, f + 3, e + 5, f - 4, c), Q(t, e - 4, e + 4, f - 6, c), m(t, e, f - 8, c), m(t, e, f, "#ffffff");
      }
      if (hf < 1) for (let u = 0; u < 5; u++) m(t, e - s + 2 + u * 5, a - i + 3 + ((r * 20 + u * 5) % 8), "#d8f0f8"), m(t, e - s - 2 + u * 7, a + 1 - ((r * 12 + u * 3) % 4), "#ffffff");
      wLine(t, e, a, s + 2, r);
    };
    N.causeway = (t, e, a, r, n = {}) => {
      let cnt = n.n || 5,
        gap = n.gap || 38,
        hs = [];
      for (let l = 0; l < cnt; l++) hs.push(Math.max(0, Math.min(1, (n.h != null ? n.h : 1) * 1.3 - l * 0.07)));
      // sütunlar arası taş döşeme (iki komşu da tam yükselmişse)
      for (let l = 0; l < cnt - 1; l++)
        if (hs[l] >= 1 && hs[l + 1] >= 1) {
          let x0 = R(e + (l - (cnt - 1) / 2) * gap) + 12,
            x1 = R(e + (l + 1 - (cnt - 1) / 2) * gap) - 12,
            y0 = a + (l % 2) * 6 - 33,
            y1 = a + ((l + 1) % 2) * 6 - 33;
          for (let x = x0; x <= x1; x++) {
            let y = R(y0 + ((y1 - y0) * (x - x0)) / Math.max(1, x1 - x0));
            Te(t, x, y - 2, y, "#a09e96"), m(t, x, y - 3, "#c4c2ba"), Te(t, x, y + 1, y + 2, "#5c5a55"), (x - x0) % 6 === 0 && Te(t, x, y - 2, y + 1, "#6a6862");
          }
        }
      let L = [];
      for (let l = 0; l < cnt; l++) L.push({ l, y: a + (l % 2) * 6 });
      L.sort((p, q) => p.y - q.y);
      for (let k of L) N.stonePillar(t, e + (k.l - (cnt - 1) / 2) * gap, k.y, r, { h: hs[k.l], glyph: n.glyph, top: !0, H: 30, w: 10 });
    };
    N.livingIsland = (t, e, a, r, n = {}) => {
      let bob = Math.sin(r * 0.9) * 2.5,
        s = n.r || 78,
        o = R(s * 0.42),
        yb = a - bob;
      ve(t, e, a + 10, s + 30, o + 16, "rgba(10,30,40,0.26)"), ve(t, e, a + 8, s + 18, o + 10, "rgba(40,70,80,0.32)");
      // yüzgeçler (su altında)
      for (let [dx, dy, w] of [
        [-s * 0.55, o + 6, 16],
        [s * 0.6, o + 5, 14],
        [s * 0.75, -o * 0.4, 12],
      ])
        ve(t, e + dx + Math.sin(r * 1.2 + dx) * 3, a + dy, w, 5, "rgba(46,74,64,0.75)");
      if (n.fin) {
        let fx = e + s + 14,
          fy = a + 4 + Math.sin(r * 2) * 3;
        for (let k = 0; k < 12; k++) Q(t, fx + k, fx + 22 - k * 0.3, fy - k, k > 8 ? "#5a7a7c" : "#3a5a5e");
        ve(t, fx + 12, fy + 1, 13, 3, "rgba(235,248,252,0.6)");
      }
      // kabuk: koyu kenar + pullu sırt + ada
      ve(t, e, yb + 1, s + 2, o + 2, "#243c34"), ve(t, e, yb - 2, s, o, "#3e5e4a"), ve(t, e, yb - 5, s - 6, o - 5, "#4f7354");
      for (let q = 0; q < 6.283; q += 0.37) {
        let x = e + Math.cos(q) * (s - 5),
          y = yb - 2 + Math.sin(q) * (o - 3);
        ve(t, x, y, 5, 2, "#2e4a40"), Math.sin(q) > 0 && Q(t, x - 3, x + 3, y + 2, "#1e3028");
      }
      ve(t, e, yb - 7, s - 16, o - 11, "#5e8456"), ve(t, e - 4, yb - 9, s - 26, o - 16, "#6a9460");
      for (let k = 0; k < 44; k++) {
        let q = ee(k, 61) * 6.28,
          c = Math.sqrt(ee(k, 62)),
          x = e + Math.cos(q) * c * (s - 18),
          y = yb - 8 + Math.sin(q) * c * (o - 13);
        m(t, x, y, ee(k, 63) > 0.5 ? "#86b06a" : "#3e6046"), n.night && ee(k, 64) > 0.6 && (m(t, x, y - 1, `rgba(120,220,255,${0.5 + 0.5 * Math.sin(r * 2 + k)})`), m(t, x, y - 2, `rgba(120,220,255,${0.2 + 0.2 * Math.sin(r * 2 + k)})`));
      }
      ve(t, e - 14, yb - 9, 27, 9, "#d8c68c"), ve(t, e - 14, yb - 10, 24, 7, "#eedfae"), ve(t, e - 18, yb - 11, 12, 3, "#f8ecc4");
      rock(t, R(e + 40), R(yb - 5), 8, "#6a6a62"), palm(t, R(e - 24), R(yb - 11), r, 1.3), hut(t, R(e - 12), R(yb - 7), 11, 6, "#a87a4a", "#c8a050", { seed: 2 }), palm(t, R(e + 4), R(yb - 12), r + 1, 1.1), palm(t, R(e + 26), R(yb - 9), r + 2, 0.9);
      // baş
      let hx = e - s - 6 + (n.turn ? -10 : 0),
        hy = a + 8 - bob * 0.5;
      ve(t, hx + 8, hy + 5, 34, 11, "rgba(10,30,40,0.3)"), ve(t, hx + 16, hy, 16, 9, "#3e5e4a"), ve(t, hx, hy, 28, 14, "#2e4a40"), ve(t, hx, hy - 2, 27, 12, "#4a6c5a"), ve(t, hx - 4, hy - 5, 20, 7, "#5e8466"), ve(t, hx - 8, hy - 7, 10, 3, "#74987a");
      for (let k = 0; k < 6; k++) ve(t, hx + 6 + k * 3, hy - 6 + (k % 2) * 3, 2, 1, "#3e6046");
      Q(t, hx - 26, hx - 8, hy + 4, "#1e3028"), Q(t, hx - 24, hx - 12, hy + 5, "#16241e"), m(t, hx - 24, hy - 1, "#1e3028"), m(t, hx - 21, hy - 2, "#1e3028");
      let k = n.eye != null ? n.eye : 0;
      if (k > 0.05) {
        k > 0.6 && H(t, hx - 9, hy - 5, 12, `rgba(255,240,160,${0.16 * k})`);
        ve(t, hx - 9, hy - 5, 7, Math.max(1, R(5 * k)), "#1e3028"), ve(t, hx - 9, hy - 5, 6, Math.max(1, R(4 * k)), "#f4eaa8"), ve(t, hx - 9, hy - 5, 2, Math.max(1, R(4 * k)), "#2a2410"), k > 0.5 && m(t, hx - 11, hy - 7, "#ffffff");
      } else Q(t, hx - 15, hx - 3, hy - 5, "#1e3028"), Q(t, hx - 14, hx - 4, hy - 4, "#3a5a4a");
      // nefes fıskiyesi
      let f = (r * 0.35) % 1;
      if (f < 0.25)
        for (let q = 0; q < 7; q++) {
          let u = f * 4;
          H(t, hx + 4 + (q - 3) * 2 * u, hy - 18 - u * 22 + Math.abs(q - 3) * 2, 2, `rgba(225,248,255,${0.8 - u * 0.6})`);
        }
      for (let q = 0; q < 6.28; q += 0.12) Math.sin(q * 6 + r * 1.4) > 0.2 && m(t, e + Math.cos(q) * (s + 6), a + 4 + Math.sin(q) * (o + 6), "rgba(240,250,255,0.85)");
    };
    N.cannonRaft = (t, e, a, r, n = {}) => {
      let y = R(a + Math.sin(r * 1.4) * 1.5),
        s = Math.sign(Math.sin(r * 0.6)) || 1;
      Za(t, e, a + 6, 22, r), raftDeck(t, e - 18, y - 9, 36, 16, r);
      n.broken && (ce(t, e - 3, y - 9, e + 2, y + 9, "#2a6a8a"), ce(t, e - 2, y - 9, e + 3, y + 9, "#1f5a82"), m(t, e, y - 10, "#ffffff"));
      dS(t, deckBarrel("#3a3a44"), e, y - 5), m(t, e, y - 17, "#c8423b");
      cannonDraw(t, R(e - 9), R(y + 1), s, 0), cannonDraw(t, R(e + 9), R(y + 5), -s, 0);
      b(t, e - 16, y - 8, 4, 3, "#1e1e24"), m(t, e - 15, y - 9, "#4a4a56"), b(t, e + 12, y - 7, 3, 3, "#1e1e24");
      if (n.lit) for (let o of [-9, 9]) Math.sin(r * 9 + o) > 0 && (m(t, e + o, y - 7 + (o > 0 ? 4 : 0), "#ffd060"), m(t, e + o + 1, y - 8 + (o > 0 ? 4 : 0), "#fff0a0"), m(t, e + o - 1, y - 9 + (o > 0 ? 4 : 0), "#ff8040"));
      n.boom && (H(t, e + 20 * s, y - 3, 6, "#ffd060"), H(t, e + 24 * s, y - 3, 4, "#fff6c0"), H(t, e + 14 * s, y - 8, 5, "rgba(90,86,90,0.5)"), H(t, e + 10 * s, y - 14, 4, "rgba(90,86,90,0.35)"));
    };
    N.heavyAnchor = (t, e, a, r, n = {}) => {
      let y = R(a + (n.held ? 0 : Math.sin(r * 1.2))),
        S = "#5a5a66",
        L = "#8a8a98",
        D = "#34343e";
      n.held || Za(t, e, a + 7, 16, r);
      // zincir
      for (let s = 0; s < (n.chain || 6); s++) {
        let x = e + 3 + s * 5,
          yy = y - 30 - s * 2 - (s % 2);
        s % 2 ? (b(t, x, yy, 4, 3, D), m(t, x + 1, yy + 1, "#14141a"), m(t, x + 2, yy + 1, "#14141a")) : b(t, x, yy + 1, 3, 1, S);
      }
      // halka + gövde + çapraz kol
      H(t, e, y - 27, 3, D), H(t, e, y - 27, 2, S), m(t, e, y - 27, "#14202c"), b(t, e - 1, y - 24, 3, 28, S), Te(t, e - 1, y - 24, y + 3, L), Te(t, e + 1, y - 24, y + 3, D);
      b(t, e - 9, y - 19, 19, 3, S), Q(t, e - 9, e + 9, y - 19, L), Q(t, e - 9, e + 9, y - 17, D), b(t, e - 10, y - 20, 2, 5, D), b(t, e + 9, y - 20, 2, 5, D);
      // kollar ve tırnaklar
      for (let s of [-1, 1]) {
        for (let k = 0; k < 12; k++) {
          let x = e + s * k,
            yy = y + 5 - R((k * k) / 16);
          b(t, x - (s < 0 ? 1 : 0), yy - 1, 2, 3, k % 5 === 4 ? D : S), m(t, x, yy - 1, L);
        }
        let fx = e + s * 12;
        for (let k = 0; k < 6; k++) Q(t, fx - (s < 0 ? k : 0) - (s > 0 ? 0 : 0), fx + (s > 0 ? k : 0), y - 8 + k, k === 0 ? L : S);
        m(t, fx + s * 5, y - 3, D), m(t, fx, y - 9, L);
      }
      b(t, e - 2, y + 3, 5, 3, D), m(t, e, y + 6, D);
      n.held || wLine(t, e, y + 8, 14, r);
    };
    N.seaGlyphs = (t, e, a, r, n = {}) => {
      let cnt = n.n || 9,
        fade = n.fade != null ? n.fade : 1;
      for (let l = 0; l < cnt; l++) {
        let u = n.decoded ? (l - (cnt - 1) / 2) * 14 : (ee(l, 71) - 0.5) * 120 + Math.sin(r * 0.8 + l) * 6,
          k = n.decoded ? Math.sin(r * 2 + l) * 1.5 : (ee(l, 72) - 0.5) * 50 + Math.cos(r * 0.7 + l) * 4,
          x = R(e + u),
          y = R(a + k),
          al = fade * (0.55 + 0.45 * Math.sin(r * 3 + l * 1.7)),
          c = `rgba(170,250,240,${al})`,
          g = l % 5;
        ve(t, x, y + 1, 8, 4, `rgba(90,220,210,${al * 0.14})`), ve(t, x, y + 1, 5, 2, `rgba(120,240,225,${al * 0.14})`);
        g === 0
          ? (Te(t, x, y - 3, y + 3, c), Q(t, x - 3, x + 3, y - 3, c), m(t, x - 3, y - 2, c), m(t, x + 3, y - 2, c))
          : g === 1
            ? (ce(t, x - 4, y + 3, x, y - 3, c), ce(t, x, y - 3, x + 4, y + 3, c), Q(t, x - 2, x + 2, y + 1, c))
            : g === 2
              ? (ring(t, x, y, 4, 3, c, 0.35), m(t, x, y, c), m(t, x, y - 1, "rgba(255,255,255," + al + ")"))
              : g === 3
                ? (ce(t, x - 4, y - 3, x + 4, y + 3, c), ce(t, x + 4, y - 3, x - 4, y + 3, c), m(t, x, y - 3, c), m(t, x, y + 3, c))
                : (Q(t, x - 4, x + 4, y, c), ce(t, x - 4, y, x - 1, y - 3, c), ce(t, x + 4, y, x + 1, y + 3, c), m(t, x, y - 3, c));
        n.decoded && l < cnt - 1 && Q(t, x + 6, x + 8, y, `rgba(170,250,240,${al * 0.5})`);
      }
    };
    N.calmCorridor = (t, e, a, r, n = {}) => {
      let w = R((n.w || 70) * (1 - (n.close || 0) * 0.8)),
        len = n.len || 420,
        y0 = R(a - len / 2);
      e = R(e);
      // cam gibi durgun şerit (kenarları titrek)
      for (let o = 0; o < len; o += 2) {
        let j = R(Math.sin(o * 0.09 + r) * 2);
        (t.fillStyle = "rgba(190,235,245,0.24)"), t.fillRect(e - w / 2 + 3 + j, y0 + o, w - 6 - j * 2, 2), (t.fillStyle = "rgba(210,244,250,0.12)"), t.fillRect(e - w / 2 + 9 + j, y0 + o, w - 18 - j * 2, 2);
      }
      for (let o = 0; o < len; o += 9) Q(t, e - w / 2 + 8 + ((o * 7) % Math.max(4, w - 24)), e - w / 2 + 12 + ((o * 7) % Math.max(4, w - 24)), y0 + o + R(Math.sin(r + o) * 1), "rgba(255,255,255,0.5)");
      // iki yanda dikilen dalga duvarları
      for (let s of [-1, 1]) {
        let x = e + s * R(w / 2);
        for (let u = 0; u < len; u += 2) {
          let h = R(7 + Math.sin(u * 0.12 + r * 3) * 3 + Math.sin(u * 0.31 - r * 2) * 2),
            y = y0 + u;
          for (let k = 0; k < 5; k++) Te(t, x + s * k, y - R(h * (1 - k * 0.16)), y, k < 2 ? "#3a86ac" : k < 4 ? "#2f78a6" : "#26668f");
          m(t, x, y - h, "#f4fbff"), m(t, x + s, y - h + 1, "#e8f6fb"), u % 6 === 0 && m(t, x - s * 2, y - h - 1, "rgba(255,255,255,0.8)"), u % 4 === 0 && m(t, x + s * 5, y - 1, "rgba(235,248,252,0.7)");
        }
      }
    };
    N.stoneStatue = (t, e, a, r, n = {}) => {
      let S = "#8e8a80",
        L = "#aaa69c",
        D = "#6a665e";
      e = R(e);
      a = R(a);
      sh(t, e, a + 6, 34, 11, 0.28), rock(t, e - 16, a + 4, 14, "#5e5e66"), rock(t, e + 14, a + 6, 12, "#686870"), rock(t, e, a + 2, 18, "#62626a");
      // kaide (üst yüz + ön yüz)
      b(t, e - 13, a - 14, 26, 4, L), Q(t, e - 13, e + 12, a - 14, "#c0bcb2"), b(t, e - 13, a - 10, 26, 10, S), Te(t, e + 12, a - 10, a - 1, D), Q(t, e - 13, e + 12, a - 1, D), Q(t, e - 11, e + 10, a - 6, D);
      if (n.clean) {
        let al = 0.6 + 0.4 * Math.sin(r * 3);
        H(t, e, a - 6, 6, `rgba(255,220,120,${al * 0.2})`), ve(t, e, a - 6, 4, 3, `rgba(255,220,120,${al})`), m(t, e, a - 6, "#fff0b0");
      } else for (let i = 0; i < 20; i++) m(t, e - 12 + ee(i, 81) * 24, a - 13 + ee(i, 82) * 12, ee(i, 83) > 0.5 ? "#4a7a44" : "#3a6238");
      // cübbeli figür: etek, gövde, omuzlar, baş, kaldırılmış fener kolu
      for (let k = 0; k < 20; k++) {
        let w = k < 14 ? 6 + R((14 - k) * 0.2) : 7 - (k - 14);
        Q(t, e - w, e + w - 1, a - 14 - 20 + k, S), m(t, e - w, a - 34 + k, L), m(t, e + w - 1, a - 34 + k, D);
      }
      Te(t, e - 2, a - 30, a - 15, D), Te(t, e + 2, a - 28, a - 15, _t(S, -0.1)), b(t, e - 8, a - 34, 16, 4, S), Q(t, e - 8, e + 7, a - 34, L), b(t, e - 9, a - 31, 3, 11, S), Te(t, e - 9, a - 31, a - 21, L), b(t, e - 9, a - 20, 3, 2, D);
      b(t, e + 6, a - 43, 3, 12, S), Te(t, e + 8, a - 43, a - 32, D), b(t, e + 5, a - 49, 5, 6, D), b(t, e + 6, a - 48, 3, 4, n.clean ? (Math.sin(r * 4) > 0 ? "#fff0a0" : "#f2c14e") : "#77726a"), n.clean && H(t, e + 7, a - 46, 6, "rgba(255,230,140,0.18)");
      H(t, e, a - 40, 5, S), H(t, e - 1, a - 41, 4, L), Q(t, e - 3, e + 2, a - 38, D), m(t, e - 2, a - 41, D), m(t, e + 1, a - 41, D), Q(t, e - 4, e + 3, a - 45, D), Q(t, e - 3, e + 2, a - 46, S);
      if (!n.clean) for (let i = 0; i < 9; i++) m(t, e - 6 + ee(i, 84) * 12, a - 46 + ee(i, 85) * 30, "#4a7a44");
      if (n.coins)
        for (let i = 0; i < 6; i++) {
          let x = e - 14 + i * 5,
            y = a - 16 + ((r * 12 + i * 3) % 8);
          b(t, x, y, 2, 2, "#f0c040"), m(t, x, y, "#fff0a0");
        }
      wLine(t, e, a + 8, 30, r);
    };
    N.lightNet = (t, e, a, r, n = {}) => {
      let pull = n.pull || 0,
        s = R((n.r || 70) * (1 - pull * 0.6)),
        P = [];
      for (let o = 0; o < 14; o++) {
        let q = (o / 14) * 6.283;
        P.push({ x: R(e + Math.cos(q) * s), y: R(a + Math.sin(q) * s * 0.5 + Math.sin(r * 2 + o) * 0.7) });
      }
      // ağ gözleri (çapraz halatlar) + çevre halatı
      for (let o = 0; o < 14; o++) {
        let p = P[o],
          q = P[(o + 1) % 14],
          u = P[(o + 5) % 14];
        ce(t, p.x, p.y, u.x, u.y, "rgba(200,180,140,0.22)"), ce(t, p.x, p.y, q.x, q.y, "rgba(200,180,140,0.75)");
      }
      if (n.fish)
        for (let o = 0; o < 16; o++) {
          let x = e + (ee(o, 91) - 0.5) * s * 1.3,
            y = a + (ee(o, 92) - 0.5) * s * 0.55 + Math.sin(r * 6 + o);
          Q(t, x - 2, x + 1, y, "#c8d8e0"), m(t, x + 2, y - 1, "#7aa0b4"), m(t, x + 2, y + 1, "#7aa0b4"), m(t, x - 2, y, "#3a3a42"), m(t, x - 1, y - 1, "#f4fbff");
        }
      // fener şamandıraları
      P.sort((p, q) => p.y - q.y);
      P.forEach((p, o) => {
        let h = 0.6 + 0.4 * Math.sin(r * 3 + o * 1.3);
        H(t, p.x, p.y - 5, 7, `rgba(255,220,120,${0.13 * h})`), b(t, p.x - 2, p.y - 1, 5, 3, "#8a5a2b"), Q(t, p.x - 2, p.x + 2, p.y - 1, "#b07a42"), b(t, p.x - 1, p.y - 7, 3, 6, "#3a2a1a"), b(t, p.x, p.y - 6, 1, 4, h > 0.8 ? "#fff6c0" : "#ffd060"), m(t, p.x, p.y - 8, "#5a4a3a"), m(t, p.x - 2, p.y + 2, "rgba(235,248,252,0.8)"), m(t, p.x + 2, p.y + 2, "rgba(235,248,252,0.8)");
      });
    };
    N.sandbar = (t, e, a, r, n = {}) => {
      let mg = n.merge != null ? n.merge : 1,
        w = n.w || 200;
      for (let l of [-1, 1]) {
        let x = e + l * (w / 2 - (w / 4) * mg),
          rx = w / 2;
        ve(t, x, a + 2, rx + 14, 18, "rgba(130,215,220,0.3)"), ve(t, x, a + 1, rx + 8, 15, "rgba(170,230,225,0.45)"), ve(t, x, a + 1, rx + 1, 12, "#c8b47c"), ve(t, x, a, rx, 11, "#d8c68c"), ve(t, x, a - 1, rx - 5, 8, "#eedfae"), ve(t, x - rx * 0.2, a - 3, rx * 0.45, 3, "#f8ecc4");
        for (let k = 0; k < 26; k++) {
          let px = x + (ee(k, 101 + l) - 0.5) * w * 0.8,
            py = a - 1 + (ee(k, 102) - 0.5) * 12;
          m(t, px, py, k % 5 === 0 ? "#f4ead5" : "#c8b47c"), k % 9 === 0 && (m(t, px + 1, py, "#e8a0a8"), m(t, px, py - 1, "#f4ead5"));
        }
        for (let k = 0; k < 3; k++) {
          let gx = R(x + (ee(k, 105 + l) - 0.5) * w * 0.5),
            gy = R(a - 2 + (ee(k, 106) - 0.5) * 6);
          Te(t, gx, gy - 4, gy, "#5a8a4a"), m(t, gx - 1, gy - 3, "#7aa860"), m(t, gx + 1, gy - 4, "#7aa860"), m(t, gx + 1, gy - 2, "#3f7a46");
        }
      }
      if (n.channel) {
        for (let k = -11; k <= 11; k++) {
          let hw = 12 + R(Math.sin(k * 0.5) * 2);
          Q(t, e - hw, e + hw, a + k, Math.abs(k) > 9 ? "rgba(170,230,225,0.8)" : "#2f78a6");
        }
        for (let l = 0; l < 4; l++) Q(t, e - 8 + ((r * 10 + l * 7) % 12), e - 4 + ((r * 10 + l * 7) % 12), a - 8 + l * 5, "rgba(200,240,255,0.6)");
      }
      for (let l = 0; l < 6.28; l += 0.14) Math.sin(l * 5 + r * 1.6) > 0.3 && m(t, e + Math.cos(l) * (w / 2 + 14 + (w / 4) * (1 - mg)), a + 1 + Math.sin(l) * 15, "rgba(240,250,255,0.85)");
    };
    N.glassWave = (t, e, a, r, n = {}) => {
      let w = n.w || 120,
        s = n.shatter || 0,
        x0 = R(e - w / 2);
      (t.fillStyle = "rgba(10,30,50,0.2)"), t.fillRect(x0 + 3, a + 1, w, 3);
      if (s < 1)
        for (let o = 0; o < w; o++) {
          let q = o / w,
            env = Math.sin(q * Math.PI),
            h = R((10 + Math.sin(o * 0.08 + 1) * 4 + Math.sin(o * 0.23) * 2) * (0.45 + 0.55 * env) + 6 * env),
            facet = Math.floor(o / 7) % 2;
          for (let k = 0; k <= h; k++) {
            let u = k / h,
              c = u > 0.86 ? "#f0fcff" : (o + k) % 7 === 0 ? "#c8f0fa" : u > 0.5 ? (facet ? "rgba(138,216,236,0.92)" : "rgba(110,196,222,0.92)") : facet ? "rgba(90,180,208,0.92)" : "rgba(70,160,196,0.92)";
            s > 0 && ee(o, k) < s * 0.5 || m(t, x0 + o, a - k, c);
          }
          // kıvrılan tepe
          env > 0.5 && o % 2 === 0 && (m(t, x0 + o - 2, a - h - 1, "#e8fbff"), m(t, x0 + o - 4, a - h, "rgba(232,251,255,0.7)"));
          o % 11 === 3 && Te(t, x0 + o, a - h + 2, a - 2, "rgba(255,255,255,0.35)");
        }
      if (s > 0)
        for (let o = 0; o < 22; o++) {
          let q = ee(o, 111) * 3.14 + 3.14,
            u = s * (20 + ee(o, 112) * 40),
            x = R(e + (ee(o, 113) - 0.5) * w + Math.cos(q) * u),
            y = R(a - 14 + Math.sin(q) * u * 0.6 + s * s * 20);
          ce(t, x, y, x + 2, y - 3, "rgba(230,252,255,0.95)"), ce(t, x + 1, y, x + 3, y - 2, "rgba(140,216,236,0.9)"), m(t, x + 1, y - 1, "#ffffff");
        }
      for (let o = 0; o < w; o += 4) Math.sin(o + r * 2) > 0.3 && m(t, x0 + o, a + 1, "rgba(235,248,252,0.8)");
    };
    N.birdSwarm = (t, e, a, r, n = {}) => {
      let cnt = n.n || 90,
        s = n.r || 150,
        part = n.part || 0;
      for (let l = 0; l < cnt; l++) {
        let q = ee(l, 121) * 6.283 + r * (0.3 + ee(l, 122) * 0.4),
          k = Math.sqrt(ee(l, 123)) * s,
          x = e + Math.cos(q) * k,
          y = a + Math.sin(q) * k * 0.6;
        part && Math.abs(x - e) < 50 * part && (x += Math.sign(x - e || 1) * 50 * part);
        let up = Math.sin(r * 12 + l) > 0,
          d = -Math.sin(q) > 0 ? 1 : -1,
          big = l % 4 === 0;
        l % 3 === 0 && ((t.fillStyle = "rgba(0,0,0,0.10)"), t.fillRect(R(x - 1), R(y + 16), 3, 1));
        Q(t, x - 1, x + 1, y, "#1e1e24"), m(t, x + d * 2, y, "#4a4a56");
        up ? (m(t, x - 2, y - 1, "#2a2a32"), m(t, x + 2, y - 1, "#2a2a32"), big && (m(t, x - 3, y - 2, "#2a2a32"), m(t, x + 3, y - 2, "#2a2a32"))) : (m(t, x - 2, y + 1, "#2a2a32"), m(t, x + 2, y + 1, "#2a2a32"), big && (m(t, x - 3, y + 1, "#2a2a32"), m(t, x + 3, y + 1, "#2a2a32")));
      }
    };
    N.bigClock = (t, e, a, r, n = {}) => {
      // sudan yükselen saat kulesi
      let S = "#8a8478",
        cy = a - 30;
      e = R(e);
      a = R(a);
      sh(t, e, a + 3, 16, 5, 0.28);
      for (let k = 0; k < 44; k++) {
        let c = (k + 2) % 6 === 0 ? _t(S, -0.25) : S;
        Q(t, e - 10, e + 10, a - k, c), m(t, e - 10, a - k, _t(S, 0.2)), m(t, e - 9, a - k, _t(S, 0.1)), m(t, e + 10, a - k, _t(S, -0.3)), m(t, e + 9, a - k, _t(S, -0.15));
        (k + 2) % 6 !== 0 && m(t, e - 6 + ((Math.floor(k / 6) % 2) * 5 + 3) % 14, a - k, _t(S, -0.18));
      }
      for (let i = 0; i < 12; i++) m(t, e - 9 + ee(i, 91) * 18, a - ee(i, 92) * 9, "#3e7a4a");
      b(t, e - 12, a - 47, 24, 4, _t(S, 0.16)), Q(t, e - 12, e + 11, a - 47, _t(S, 0.36)), Q(t, e - 12, e + 11, a - 44, _t(S, -0.25));
      for (let k = 0; k < 11; k++) Q(t, e - 11 + k, e + 10 - k, a - 48 - k, k % 3 === 2 ? "#6a2a26" : k < 3 ? "#a8322c" : "#8a2a26"), m(t, e - 11 + k, a - 48 - k, "#c8423b");
      Te(t, e, a - 64, a - 59, "#3a3a44"), m(t, e, a - 65, "#e0b040"), b(t, e - 2, a - 13, 5, 8, "#2a1a14"), Q(t, e - 1, e + 1, a - 14, "#2a1a14");
      // kadran
      H(t, e, cy, 8, "#5a4028"), H(t, e, cy, 7, "#e8e0c8"), H(t, e, cy, 6, "#f8f0d8");
      for (let o = 0; o < 12; o++) {
        let q = o * 0.5236;
        m(t, e + Math.cos(q) * 5.2, cy + Math.sin(q) * 5.2, o % 3 ? "#8a7a5a" : "#3a2412");
      }
      let h1 = n.sync ? -1.5708 : r * 2,
        h2 = n.sync ? -1.5708 : r * 0.2;
      ce(t, e, cy, R(e + Math.cos(h1) * 5), R(cy + Math.sin(h1) * 5), "#1a1410"), ce(t, e, cy, R(e + Math.cos(h2) * 3), R(cy + Math.sin(h2) * 3), "#c83a2a"), m(t, e, cy, "#e0b040");
      // sarkaç penceresi
      b(t, e - 4, a - 20, 9, 6, "#2a1a14");
      let px = R(e + Math.sin(r * 4) * 3);
      Te(t, e, a - 20, a - 18, "#c8a040"), b(t, px - 1, a - 18, 3, 3, "#e0b040"), m(t, px - 1, a - 18, "#fff0a0");
      if (n.ring) for (let o = 0; o < 3; o++) ring(t, e, cy, 12 + o * 6 + ((r * 20) % 6), 7 + o * 3.5 + ((r * 20) % 6) * 0.5, `rgba(255,240,200,${0.5 - o * 0.14})`, 0.12);
      wLine(t, e, a + 2, 12, r);
    };
    N.pressBoat = (t, e, a, r, n = {}) => {
      let y = R(a + Math.sin(r * 1.6)),
        s = n.press ? R(Math.abs(Math.sin(r * 4)) * 4) : 0;
      e = R(e);
      Za(t, e, a + 7, 26, r);
      // geniş mavna: iç taban + küpeşte + bize bakan yan yüz
      ve(t, e, y + 6, 27, 9, "#3a2412"), ve(t, e, y + 4, 27, 9, "#5c3a1e"), ve(t, e, y, 27, 10, "#5c3a1e"), ve(t, e, y, 25, 8, "#8a5a2b"), ve(t, e, y, 23, 7, "#c8a070");
      for (let k = -20; k <= 20; k += 5) Te(t, e + k, y - 5, y + 5, "#b08a5a");
      for (let k = -24; k <= 24; k += 6) Te(t, e + k, y + 6, y + 10, "#4a2e18");
      // kâğıt desteleri
      for (let o = 0; o < 5; o++) b(t, e + 9, y - 2 - o * 2, 9, 2, o % 2 ? "#f4ecd8" : "#e0d4b8"), m(t, e + 9, y - 2 - o * 2, "#ffffff");
      b(t, e - 22, y - 3, 5, 5, "#1e1e24"), Q(t, e - 22, e - 18, y - 3, "#4a4a56");
      // baskı makinesi: ayaklar, tabla, vida, baskı plakası, kol
      b(t, e - 9, y - 22, 2, 22, "#5c3a1e"), b(t, e + 6, y - 22, 2, 22, "#5c3a1e"), Te(t, e - 9, y - 22, y - 1, "#8a5a2b"), Te(t, e + 6, y - 22, y - 1, "#8a5a2b"), b(t, e - 10, y - 24, 19, 3, "#6a4424"), Q(t, e - 10, e + 8, y - 24, "#a87a4a");
      b(t, e - 8, y - 6, 15, 5, "#3a3a44"), Q(t, e - 8, e + 6, y - 6, "#6a6a76"), b(t, e - 6, y - 7, 11, 1, "#f4ecd8");
      b(t, e - 1, y - 21, 2, 6 + s, "#9aa1a8"), Te(t, e - 1, y - 21, y - 16 + s, "#d6dce2"), b(t, e - 6, y - 15 + s, 11, 3, "#5d6470"), Q(t, e - 6, e + 4, y - 15 + s, "#9aa1a8");
      ce(t, e, y - 22, e + 11, y - 27 + (n.press ? R(Math.sin(r * 4) * 2) : 0), "#8a6a40"), H(t, e + 11, y - 27 + (n.press ? R(Math.sin(r * 4) * 2) : 0), 2, "#c8a040");
      n.press && s > 3 && (m(t, e - 8, y - 9, "#fff6c0"), m(t, e + 7, y - 10, "#fff6c0"));
      n.npc !== null && dS(t, ha(n.npc || "cartographer", "right", n.press ? "work" : "idle", R(r * 4) % 2), e - 15, y + 4);
      Q(t, e - 24, e + 24, y + 6, "#8a5a2b"), wLine(t, e, y + 12, 25, r);
    };
    N.clothBolts = (t, e, a, r, n = {}) => {
      let cols = n.cols || ["#c8423b", "#3b6ea5", "#e8c45a", "#2f8a6a", "#8b5bb5"];
      e = R(e);
      a = R(a);
      if (n.sheet) {
        // ipe asılı, dalgalanan kumaş
        let s = Math.sin(r * 2) * 2;
        Te(t, e - 27, a - 34, a - 2, "#3a2412"), Te(t, e + 27, a - 34, a - 2, "#3a2412"), Q(t, e - 27, e + 27, a - 32, "#c8a070");
        for (let x = -24; x <= 24; x++) {
          let top = a - 31,
            len = 17 + R(Math.sin(x * 0.25 + r * 2) * 1.5 + s * 0.5),
            fold = Math.sin(x * 0.7 + r * 1.5);
          Te(t, e + x, top, top + len, fold > 0.5 ? "#ffffff" : fold < -0.5 ? "#d8ccb0" : "#f4ecd8"), m(t, e + x, top + len, "#c8b890");
        }
        for (let x = -22; x <= 22; x += 11) b(t, e + x, a - 33, 2, 3, "#8a5a2b");
      }
      // üst üste dizili kumaş topları (uçları bize bakar)
      sh(t, e, a + 1, 26, 3);
      let bolt = (x, y, c) => {
        b(t, x, y - 6, 10, 6, c), Q(t, x + 1, x + 8, y - 7, _t(c, 0.3)), Q(t, x, x + 9, y - 1, _t(c, -0.32)), Te(t, x + 9, y - 6, y - 1, _t(c, -0.2)), H(t, x + 2, y - 3, 2, "#f4ead5"), m(t, x + 2, y - 3, _t(c, -0.2)), Q(t, x + 5, x + 8, y - 4, _t(c, 0.2));
      };
      cols.slice(0, 5).forEach((c, o) => o < 3 && bolt(e - 16 + o * 11, a, c));
      cols.slice(3, 5).forEach((c, o) => bolt(e - 10 + o * 11, a - 7, c));
    };
    // --- fırlatılan nesneler ---
    X3FX.proj = (t, kind, x, y, time) => {
      x = R(x);
      y = R(y);
      if (kind === "bottle") {
        let f = Math.floor(time * 10) % 4;
        f % 2 ? (b(t, x - 3, y - 4, 6, 3, "#4aa070"), Q(t, x - 3, x + 2, y - 4, "#8ad0a0"), b(t, f === 1 ? x + 3 : x - 5, y - 3, 2, 1, "#2a6a48"), m(t, f === 1 ? x + 5 : x - 6, y - 3, "#c8a060"), m(t, x, y - 3, "#f4ead5")) : (b(t, x - 2, y - 6, 3, 6, "#4aa070"), Te(t, x - 2, y - 6, y - 1, "#8ad0a0"), b(t, x - 1, f ? y : y - 8, 1, 2, "#2a6a48"), m(t, x - 1, f ? y + 2 : y - 9, "#c8a060"), m(t, x - 1, y - 3, "#f4ead5"));
        return !0;
      }
      if (kind === "buoy") {
        // can simidi: dönerek uçar
        let f = Math.floor(time * 8) % 2,
          rx = f ? 5 : 4,
          ry = f ? 3 : 4;
        for (let q = 0; q < 12; q++) {
          let an = (q / 12) * 6.283 + (f ? 0.3 : 0);
          b(t, x + R(Math.cos(an) * rx) - 1, y - 5 + R(Math.sin(an) * ry) - 1, 2, 2, q % 3 === 0 ? "#c8423b" : "#f4ead5");
        }
        m(t, x - rx, y - 5 - ry + 1, "#ffffff");
        return !0;
      }
      return !1;
    };
    // --- çan ikonu ---
    X3FX.icBell = (t) => {
      let g = "#f2c14e",
        gL = "#ffe08a",
        gD = "#b8862b";
      b(t, 6, 1, 4, 2, "#8b5a2b"), Q(t, 6, 9, 1, "#b07a42");
      for (let [y, x0, x1] of [
        [3, 6, 9],
        [4, 5, 10],
        [5, 4, 11],
        [6, 4, 11],
        [7, 4, 11],
        [8, 3, 12],
        [9, 3, 12],
        [10, 2, 13],
        [11, 1, 14],
      ])
        Q(t, x0, x1, y, g);
      Q(t, 1, 14, 12, gD), Te(t, 5, 4, 10, gL), Te(t, 6, 3, 9, "#fff6c0"), Te(t, 10, 5, 11, gD), Te(t, 11, 6, 11, gD), Q(t, 3, 12, 9, gD), b(t, 7, 13, 2, 2, "#5c3a1e"), m(t, 7, 13, "#8b5a2b");
    };
    // --- yelken armaları (yeni kaptan gemileri) ---
    X3FX.emblem = (t, st, x, y) => {
      let k = st.emblem;
      if (!k) return;
      x = R(x);
      y = R(y);
      let W = "#f4f0e0",
        D = "rgba(20,14,20,0.85)";
      if (k === "swallow") {
        // kırlangıç
        ce(t, x - 9, y - 4, x - 2, y, W), ce(t, x + 9, y - 4, x + 2, y, W), ce(t, x - 8, y - 3, x - 2, y + 1, W), ce(t, x + 8, y - 3, x + 2, y + 1, W), b(t, x - 2, y - 1, 5, 4, W), b(t, x - 1, y - 3, 3, 2, W), ce(t, x - 1, y + 3, x - 4, y + 8, W), ce(t, x + 1, y + 3, x + 4, y + 8, W), m(t, x, y - 2, D);
      } else if (k === "anvil") {
        // örs
        let A = "#f0d8a0";
        b(t, x - 8, y - 5, 16, 4, D), b(t, x - 10, y - 5, 3, 3, D), b(t, x - 4, y - 1, 8, 3, D), b(t, x - 7, y + 2, 14, 4, D);
        b(t, x - 7, y - 4, 14, 2, A), b(t, x - 9, y - 4, 2, 1, A), b(t, x - 3, y - 2, 6, 3, A), b(t, x - 6, y + 3, 12, 2, A), Q(t, x - 7, x + 6, y - 4, "#fff0c8");
      } else if (k === "compass") {
        // pusula gülü
        H(t, x, y, 9, "#f4e4c4");
        for (let q = 0; q < 6.283; q += 0.16) m(t, x + Math.cos(q) * 9, y + Math.sin(q) * 9, D);
        ce(t, x, y - 7, x, y + 7, D), ce(t, x - 7, y, x + 7, y, D), ce(t, x - 1, y - 6, x - 1, y, "#c87a3c"), ce(t, x + 1, y - 6, x + 1, y, "#c87a3c"), m(t, x, y - 8, "#c87a3c"), ce(t, x - 4, y - 4, x + 4, y + 4, D), ce(t, x + 4, y - 4, x - 4, y + 4, D), b(t, x - 1, y - 1, 3, 3, "#f4f0e0");
      } else if (k === "pot") {
        // kazan + kaşık
        b(t, x - 6, y - 2, 12, 6, D), Q(t, x - 7, x + 6, y - 3, D), Q(t, x - 5, x + 4, y + 4, D), b(t, x - 9, y - 1, 2, 2, D), b(t, x + 7, y - 1, 2, 2, D), ce(t, x + 2, y - 4, x + 7, y - 10, "#e07a3a"), m(t, x - 3, y - 6, D), m(t, x - 2, y - 8, D), m(t, x, y - 6, D), Q(t, x - 4, x + 3, y - 1, "#e07a3a");
      } else if (k === "snow") {
        // kar tanesi
        let c = "#4a6e8c";
        ce(t, x, y - 8, x, y + 8, c), ce(t, x - 7, y - 4, x + 7, y + 4, c), ce(t, x + 7, y - 4, x - 7, y + 4, c), m(t, x - 2, y - 7, c), m(t, x + 2, y - 7, c), m(t, x - 2, y + 7, c), m(t, x + 2, y + 7, c), m(t, x - 6, y - 1, c), m(t, x + 6, y - 1, c), m(t, x - 6, y + 1, c), m(t, x + 6, y + 1, c), b(t, x - 1, y - 1, 3, 3, "#24465e");
      } else if (k === "sword") {
        // çapraz kılıçlar
        ce(t, x - 7, y + 6, x + 6, y - 7, D), ce(t, x + 7, y + 6, x - 6, y - 7, D), ce(t, x - 6, y + 6, x + 7, y - 7, "#e0b84a"), ce(t, x + 6, y + 6, x - 7, y - 7, "#e0b84a"), b(t, x - 7, y + 3, 4, 2, D), b(t, x + 4, y + 3, 4, 2, D);
      }
    };
  })(rect, px, hline, vline, line, disc, ellipse, hash2, shade, _t2, dS, npcSprite, petSprite, cargoSprite, rock, wLine, Za, palm, hut, tower, boatHull, boatSeat, deckBarrel, cannonDraw, DRAW);

// Gemi yelken arması kancası (TopShip döngüsel içe aktarmadan kaçınır)
SHIP_HOOKS.emblem = X3FX.emblem;
