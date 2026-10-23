// Ana menü arka planı: alacakaranlıkta vadiyi gösteren procedural pixel manzara.
import { PB, hash, mix } from './pixel.js';

export function drawMenuScene(t = 0) {
  const W = 320, H = 180;
  const pb = new PB(W, H);
  // gökyüzü
  for (let y = 0; y < H; y++) {
    const k = y / H;
    const c = k < 0.5 ? mix('#1a1838', '#5a3a6a', k / 0.5) : mix('#5a3a6a', '#e08a5a', (k - 0.5) / 0.5);
    pb.hline(0, W - 1, y, c);
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(hash(i, 1) * W), y = Math.floor(hash(1, i) * 70);
    const tw = Math.sin(t * 2 + i) > 0.6;
    pb.set(x, y, tw ? '#ffffff' : '#b8b0d8');
  }
  pb.disc(250, 38, 12, '#f4ecd0'); pb.disc(245, 35, 10, '#fff8e8'); pb.disc(254, 42, 3, '#e4dcc0');
  // dağ katmanları
  const ridge = (base, amp, freq, seed, col, snow) => {
    for (let x = 0; x < W; x++) {
      const h = base - (Math.sin(x * freq + seed) * amp + Math.sin(x * freq * 2.7 + seed * 3) * amp * 0.4 + hash(x, seed) * 2);
      pb.vline(x, Math.round(h), H - 1, col);
      if (snow && h < base - amp * 0.9) pb.set(x, Math.round(h), '#e8e0f0');
    }
  };
  ridge(105, 26, 0.025, 1.3, '#3a3058', true);
  ridge(120, 18, 0.04, 4.1, '#2c2a48', false);
  ridge(140, 10, 0.06, 7.7, '#21283a', false);
  // orman siluetleri
  for (let x = 0; x < W; x += 3) {
    const h = 148 + Math.sin(x * 0.11) * 4 + hash(x, 9) * 6;
    pb.poly([[x - 3, h + 10], [x + 1, h - 8 - hash(x, 3) * 6], [x + 5, h + 10]], '#16202a');
  }
  pb.rect(0, 158, W, 22, '#121a20');
  // köy
  const houses = [[130, 150], [146, 148], [162, 151], [178, 147], [196, 152]];
  for (const [x, y] of houses) {
    pb.rect(x, y, 12, 9, '#1a1a22'); pb.poly([[x - 2, y], [x + 6, y - 7], [x + 14, y]], '#22222e');
    const on = Math.sin(t * 1.5 + x) > -0.6;
    pb.rect(x + 3, y + 3, 2, 2, on ? '#f0c060' : '#5a4a30'); pb.rect(x + 8, y + 3, 2, 2, '#f0c060');
  }
  // dumanlar
  for (let i = 0; i < 8; i++) {
    const y = 140 - i * 4 - (t * 6) % 4;
    pb.disc(152 + Math.sin(i + t) * 2, y, 1.5 + i * 0.2, '#6a6478', 120 - i * 12);
  }
  // nehir
  for (let y = 160; y < H; y++) {
    const cx = 160 + Math.sin(y * 0.15) * 20, w = (y - 155) * 1.6;
    pb.hline(cx - w, cx + w, y, '#2a3a5a');
    if ((y + Math.floor(t * 4)) % 5 === 0) pb.hline(cx - w / 3, cx + w / 4, y, '#6a7aa8');
  }
  return pb;
}
