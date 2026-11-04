// BoatDB görsel bileşenlerinden tekne çizimi (her seviye ≥3 bileşen değişir). Yerel: su hattı (0,0), burun sağda.
(function (D) {
  'use strict';
  const A = D.Art, OL = A.OL;
  const fs = (c, f, lw) => A.fs(c, f, lw == null ? 4 : lw);
  const BoatArt = {
    draw(c, level, x, y, scale, t, opts) {
      opts = opts || {};
      const L = D.boatLevel(level); const v = L.visual;
      const paint = opts.paint && D.CosmeticDB[opts.paint] ? D.CosmeticDB[opts.paint].value.color : v.color;
      const len = v.len, half = len / 2;
      c.save(); c.translate(x, y); c.scale(scale, scale);
      const rock = opts.still ? 0 : Math.sin(t * 1.3) * 0.035; c.rotate(rock);
      // direk + yelken
      if (v.mast) {
        A.rr(c, -half * 0.15, -230, 10, 230, 4); fs(c, '#8a5a3a');
        if (v.sail) { c.beginPath(); c.moveTo(-half * 0.15 + 8, -224); c.quadraticCurveTo(half * 0.5 + Math.sin(t) * 8, -140, -half * 0.15 + 8, -70); c.closePath(); fs(c, v.hull === 'absurd' ? '#fff3c0' : '#f5efe0'); }
        const flag = opts.flag && D.CosmeticDB[opts.flag] ? D.CosmeticDB[opts.flag].value : null;
        if (flag || v.hull !== 'dinghy') {
          const fc = flag ? flag.color : '#e0453d';
          c.beginPath(); c.moveTo(-half * 0.15 + 8, -228); c.quadraticCurveTo(-half * 0.15 + 40, -238 + Math.sin(t * 6) * 5, -half * 0.15 + 70, -224 + Math.sin(t * 6 + 1) * 6); c.lineTo(-half * 0.15 + 70, -200 + Math.sin(t * 6 + 1) * 6); c.quadraticCurveTo(-half * 0.15 + 40, -212 + Math.sin(t * 6) * 5, -half * 0.15 + 8, -204); c.closePath(); fs(c, fc, 3);
          if (flag) A.signText(c, { gull: '〰', skull: '☠', paw: '❀', star: '★', wheel: '☸' }[flag.mark] || '', -half * 0.15 + 38, -216, 16, flag.color === '#ffffff' ? '#3d8fe0' : '#fff');
        }
      }
      // kabin
      if (v.cabin) {
        const cw = v.cabin === 'small' ? 110 : v.cabin === 'big' ? 150 : 190, ch = v.cabin === 'small' ? 70 : v.cabin === 'big' ? 90 : 110;
        const cx = v.cabin === 'bridge' ? 10 : 20;
        A.rr(c, cx, -ch - 30, cw, ch, 10); fs(c, v.hull === 'absurd' ? '#fff8e0' : '#f5efe0');
        A.rr(c, cx - 10, -ch - 44, cw + 20, 18, 6); fs(c, A.shade(paint, -0.2));
        for (let i = 0; i < (v.cabin === 'bridge' ? 3 : 2); i++) A.window(c, cx + 14 + i * (cw / (v.cabin === 'bridge' ? 3.3 : 2.4)), -ch - 16, 30, 28, opts.night);
        if (v.radar) { A.rr(c, cx + cw - 20, -ch - 70, 6, 30, 2); fs(c, '#5a5f66', 3); c.save(); c.translate(cx + cw - 17, -ch - 72); c.rotate(t * 2); A.rr(c, -22, -4, 44, 8, 3); fs(c, '#d9dde6', 3); c.restore(); }
        if (v.antenna) { c.beginPath(); c.moveTo(cx + 20, -ch - 44); c.lineTo(cx + 14, -ch - 110); c.lineWidth = 4; c.strokeStyle = OL; c.stroke(); A.circle(c, cx + 14, -ch - 112, 6); fs(c, Math.sin(t * 5) > 0 ? '#e0453d' : '#5a1a1a', 2.5); }
        if (v.disco) { c.save(); c.translate(cx + cw / 2, -ch - 64); c.rotate(t); A.circle(c, 0, 0, 16); fs(c, '#d9dde6', 3); c.fillStyle = '#b07cff'; for (let i = 0; i < 6; i++) { c.fillRect(-12 + (i % 3) * 8, -8 + Math.floor(i / 3) * 8, 6, 6); } c.restore(); }
      }
      if (v.lamp) { A.rr(c, half - 40, -76, 8, 40, 2); fs(c, '#5a5f66', 3); A.circle(c, half - 36, -82, 10); fs(c, '#ffe08a', 3); if (opts.night) { c.fillStyle = A.rg(c, half - 36, -82, 4, 60, ['rgba(255,230,140,0.5)', 'rgba(255,230,140,0)']); A.circle(c, half - 36, -82, 60); c.fill(); } }
      if (v.heater) { A.rr(c, -half + 60, -66, 26, 36, 4); fs(c, '#5a5f66', 3); if (!opts.still) for (let i = 0; i < 3; i++) { const k = (t * 0.7 + i / 3) % 1; A.circle(c, -half + 73 + Math.sin(k * 6) * 4, -76 - k * 50, 6 + k * 8); c.fillStyle = `rgba(230,230,230,${0.6 * (1 - k)})`; c.fill(); } }
      // gövde
      c.beginPath();
      const deck = v.hull === 'dinghy' ? -40 : v.hull === 'fishing' ? -48 : -58;
      c.moveTo(-half, deck); c.lineTo(half + 30, deck - 10);
      c.quadraticCurveTo(half, 30, half * 0.6, 38); c.lineTo(-half * 0.8, 38); c.quadraticCurveTo(-half - 6, 20, -half, deck); c.closePath();
      fs(c, A.lg(c, 0, deck, 0, 40, [A.shade(paint, 0.15), paint, A.shade(paint, -0.25)]), 5);
      c.save(); c.clip();
      c.fillStyle = A.shade(paint, -0.35); c.fillRect(-half - 10, 10, len + 60, 40);
      c.fillStyle = v.hull === 'absurd' || v.goldtrim ? '#f0c040' : '#f5efe0'; c.fillRect(-half - 10, deck + 4, len + 60, 9);
      c.strokeStyle = A.shade(paint, -0.3); c.lineWidth = 2.5; for (let y = deck + 22; y < 10; y += 14) { c.beginPath(); c.moveTo(-half, y); c.lineTo(half + 20, y - 4); c.stroke(); }
      for (let i = 0; i < (v.patches || 0); i++) { const px = -half * 0.6 + i * half * 0.45, py = deck + 26; A.rr(c, px, py, 34, 22, 3); fs(c, ['#c9a04a', '#8a6a4a', '#6a8a5a'][i], 3); c.strokeStyle = OL; c.lineWidth = 2; for (const [dx, dy] of [[4, 4], [28, 4], [4, 18], [28, 18]]) { A.circle(c, px + dx, py + dy, 1.5); c.stroke(); } }
      if (v.iceplate) { c.fillStyle = 'rgba(200,240,255,0.7)'; c.fillRect(half * 0.3, deck + 14, half, 40); }
      if (v.heatshield) { c.fillStyle = '#c94a2a'; for (let x = -half; x < half; x += 30) c.fillRect(x, 16, 20, 6); }
      c.restore();
      if (v.oars) { c.beginPath(); c.moveTo(-20, deck - 4); c.lineTo(-90, 36); c.lineWidth = 7; c.strokeStyle = OL; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#c9a04a'; c.stroke(); A.ellipse(c, -96, 40, 16, 6, 0.7); fs(c, '#c9a04a', 3); }
      if (v.bench) { A.rr(c, -40, deck - 14, 70, 12, 3); fs(c, '#8a5a3a', 3); }
      if (v.motor) { for (let i = 0; i < v.motor; i++) { A.rr(c, -half - 34, deck - 30 + i * 4 - i * 30, 40, 46, 8); fs(c, i % 2 ? '#3a3a3a' : '#5a5f66'); A.rr(c, -half - 22, deck + 14 - i * 26, 10, 46, 3); fs(c, '#3a3a3a', 3); } }
      if (v.sonar) { c.strokeStyle = 'rgba(95,245,224,0.6)'; c.lineWidth = 2.5; for (let i = 0; i < 3; i++) { const r = ((t * 30 + i * 20) % 60) + 10; c.beginPath(); c.arc(0, 40, r, 0.3, Math.PI - 0.3); c.stroke(); } }
      if (v.figurehead) { c.save(); c.translate(half + 34, deck - 18); c.scale(0.55, 0.55); D.NPCArt.draw(c, 'marti', 0, 0, 1, t * 0.3); c.restore(); A.circle(c, half + 22, deck + 2, 10); fs(c, '#f0c040', 3); }
      if (opts.player) {
        c.save(); c.translate(v.cabin ? -half * 0.45 : 10, deck); c.scale(0.9, 0.9); D.NPCArt.draw(c, 'player', 0, 0, 1, t, { reel: opts.reel, hat: opts.hat }); c.restore();
      }
      c.restore();
      return { deck, half, len };
    },
    // Oltanın ucu (dünya koordinatı) — çizgi buradan suya iner
    rodTip(level, x, y, scale) { const v = D.boatLevel(level).visual; const half = v.len / 2; const ox = (v.cabin ? -half * 0.45 : 10) + 40; return [x + (ox + 120) * scale, y - 190 * scale]; },
    // ---- Kullanıcının çizdiği bölge kayıkları (assets/boats/<KOD>.webp, 720×~272, aynalı: burun solda, kıç direği sağda) ----
    // Oyuncu karakteri çizilmez; olta kayıktaki ahşap tutucudan çıkar ve gerilimle bükülür. (x,y) = kayık merkezi / su hattı.
    hasRegion(code) { return !!D.Assets.get('boat_' + code); },
    drawRegion(c, code, x, y, scale, t, bend, opts) {
      opts = opts || {};
      const img = D.Assets.get('boat_' + code);
      const IW = 720, WL = 178;            // görselde su hattı (gövde altı ~212)
      const bob = Math.sin(t * 1.6) * 3, rock = Math.sin(t * 1.3) * 0.02;
      let tip;
      c.save(); c.translate(x, y + bob); c.rotate(rock); c.scale(scale, scale);
      c.drawImage(img, -IW / 2, -WL, IW, img.height * IW / img.width);
      // kıç direğinde bayrak (kozmetik takılıysa)
      const flag = opts.flag && D.CosmeticDB[opts.flag] ? D.CosmeticDB[opts.flag].value : null;
      if (flag) {
        const px = IW / 2 - 18, py = -WL + 4;
        c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 110); c.lineWidth = 9; c.strokeStyle = OL; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#8a5a3a'; c.stroke();
        c.beginPath(); c.moveTo(px, py - 108); c.quadraticCurveTo(px - 40, py - 118 + Math.sin(t * 6) * 5, px - 80, py - 104 + Math.sin(t * 6 + 1) * 6); c.lineTo(px - 80, py - 74 + Math.sin(t * 6 + 1) * 6); c.quadraticCurveTo(px - 40, py - 86 + Math.sin(t * 6) * 5, px, py - 76); c.closePath(); fs(c, flag.color, 4);
        A.signText(c, { gull: '〰', skull: '☠', paw: '❀', star: '★', wheel: '☸' }[flag.mark] || '', px - 40, py - 92, 22, flag.color === '#ffffff' ? '#3d8fe0' : '#fff');
      }
      // olta: tutucudan (görselde ~453,55) yukarı, uç misinanın yönüne doğru bükülür
      const bx = 453 - IW / 2, by = 55 - WL, b = D.clamp(bend || 0, 0, 1);
      const tx = bx + 120 + b * 70, ty = by - 250 + b * 70;
      const mx = bx + 70 + b * 50, my = by - 150 - b * 10;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(mx, my, tx, ty);
      c.lineWidth = 13; c.strokeStyle = OL; c.stroke(); c.lineWidth = 7; c.strokeStyle = '#a8743a'; c.stroke();
      c.beginPath(); c.moveTo(bx + 2, by - 20); c.quadraticCurveTo(mx, my, tx, ty); c.lineWidth = 3; c.strokeStyle = 'rgba(255,230,180,0.55)'; c.stroke();
      // makara
      A.circle(c, bx - 6, by - 20, 15); fs(c, '#6a6f78', 6); A.circle(c, bx - 6, by - 20, 5); fs(c, '#c9ccd0', 3);
      // uç halkası
      A.circle(c, tx, ty, 6); fs(c, '#d8b47a', 4);
      c.restore();
      // su hattında köpük/halka: kayık suya oturur
      c.save(); c.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const q = (t * 0.35 + k / 3) % 1, rw = IW * scale * (0.5 + q * 0.25);
        c.strokeStyle = `rgba(255,255,255,${0.45 * (1 - q)})`; c.lineWidth = 3;
        c.beginPath(); c.ellipse(x - IW * scale * 0.04, y + bob + 4 + q * 6, rw, 10 + q * 8, 0, 0.1, Math.PI - 0.1); c.stroke();
      }
      c.restore();
      const cs = Math.cos(rock), sn = Math.sin(rock);
      tip = [x + (tx * cs - ty * sn) * scale, y + bob + (tx * sn + ty * cs) * scale];
      return tip;
    },
    drawRod(c, level, x, y, scale, t, bend) {
      const v = D.boatLevel(level).visual; const half = v.len / 2; const deck = v.hull === 'dinghy' ? -40 : v.hull === 'fishing' ? -48 : -58;
      const bx = x + ((v.cabin ? -half * 0.45 : 10) + 30) * scale, by = y + (deck - 70) * scale;
      const [tx, ty] = BoatArt.rodTip(level, x, y, scale);
      c.save(); c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo((bx + tx) / 2, (by + ty) / 2 - 10 * scale + (bend || 0) * 40 * scale, tx, ty + (bend || 0) * 30 * scale);
      c.lineWidth = 7 * scale; c.strokeStyle = OL; c.lineCap = 'round'; c.stroke(); c.lineWidth = 4 * scale; c.strokeStyle = '#a8743a'; c.stroke(); c.restore();
      return [tx, ty + (bend || 0) * 30 * scale];
    }
  };
  D.BoatArt = BoatArt;
})(globalThis.DUMEN);
