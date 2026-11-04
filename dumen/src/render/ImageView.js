// Görsel tabanlı sahneler (kasaba, liman sokağı, harita) için ortak yerleşim.
// Dokunma alanları görselin piksel koordinatlarında tanımlanır ve ekrana aynı dönüşümle taşınır.
// Geniş ekran: yükseklik en fazla %12 kırpılır, yanlar kenar uzatmasıyla dolar.
// Dar/yüksek ekran: genişlik en fazla %5 kırpılır, alt kısım son şeridin uzatmasıyla (deniz) dolar.
(function (D) {
  'use strict';
  D.ImageView = (IW, IH) => {
    const V = {
      IW, IH,
      fit(W, H) {
        const kW = W / IW, kH = H / IH;
        const k = kW > kH ? Math.min(kW, kH * 1.12) : Math.min(kH, kW * 1.05);
        const ox = (W - IW * k) / 2, hh = IH * k;
        const oy = hh >= H ? (H - hh) / 2 : 0;
        return { k, ox, oy };
      },
      rect(r) {
        const v = D.UI.view, f = V.fit(v.W, v.H);
        const o = { left: f.ox + r[0] * f.k, top: f.oy + r[1] * f.k, width: r[2] * f.k, height: r[3] * f.k };
        if (o.left < 0) { o.width += o.left; o.left = 0; }
        if (o.left + o.width > v.W) o.width = v.W - o.left;
        if (o.top < 0) { o.height += o.top; o.top = 0; }
        return o;
      },
      pt(x, y) { const v = D.UI.view, f = V.fit(v.W, v.H); return [f.ox + x * f.k, f.oy + y * f.k]; },
      toImg(lx, ly) { const v = D.UI.view, f = V.fit(v.W, v.H); return [(lx - f.ox) / f.k, (ly - f.oy) / f.k]; },
      drawStatic(c, W, H, img) {
        const { k, ox, oy } = V.fit(W, H);
        const w = IW * k, hh = IH * k;
        c.fillStyle = '#4f8fb4'; c.fillRect(0, 0, W, H);
        if (oy + hh < H) c.drawImage(img, 0, IH - 50, IW, 50, Math.min(0, ox), oy + hh - 1, Math.max(W, w), H - (oy + hh) + 1);
        if (ox > 0) {
          c.drawImage(img, 0, 0, 18, IH, 0, oy, ox + 1, hh);
          c.drawImage(img, IW - 18, 0, 18, IH, ox + w - 1, oy, ox + 1, hh);
          c.fillStyle = 'rgba(20,30,40,0.18)'; c.fillRect(0, 0, ox, H); c.fillRect(ox + w, 0, ox + 1, H);
        }
        c.drawImage(img, ox, oy, w, hh);
      },
      // Sahne içinde görsel koordinatlarıyla çizim için (c.save/restore çağıran yapar)
      apply(c, W, H) { const { k, ox, oy } = V.fit(W, H); c.translate(ox, oy); c.scale(k, k); }
    };
    return V;
  };
})(globalThis.DUMEN);
