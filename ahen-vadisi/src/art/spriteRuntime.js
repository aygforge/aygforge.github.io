// Hazır sprite paketlerinin (public/sprites) yüklenmesi, animasyonları ve arayüz önizlemeleri.
// Bir paket yüklenemezse (ör. dosya eksik) oyun procedural çizime geri döner.
import { SPRITE_PACKS, FX_PACKS } from './spritePacks.js';

let game = null;
// Ayarlar → "Kahraman görünümü: Ekipman görünür": hazır kahraman sprite'ı yerine giyilen
// silah/zırhı gösteren piksel kahraman çizimi kullanılır (yaratık paketleri etkilenmez).
let heroGear = false;
export function setHeroGear(v) { heroGear = !!v; }
export function heroGearMode() { return heroGear; }

export function preloadSpritePacks(scene) {
  for (const [id, p] of Object.entries(SPRITE_PACKS)) {
    for (const a of Object.keys(p.anims)) scene.load.spritesheet(`${id}:${a}`, `sprites/${id}/${a}.png`, { frameWidth: p.w, frameHeight: p.h });
  }
  // V4: paket efektleri (ok, ruh mermisi) aynı anahtarla (fx_<ad>) yüklenir; procedural üretim var olan dokuyu atlar
  for (const [name, f] of Object.entries(FX_PACKS)) scene.load.spritesheet('fx_' + name, `sprites/fx/${name}.png`, { frameWidth: f.w, frameHeight: f.h });
}

export function registerSpritePacks(scene) {
  game = scene.game;
  for (const [id, p] of Object.entries(SPRITE_PACKS)) {
    for (const [a, an] of Object.entries(p.anims)) {
      const tex = `${id}:${a}`;
      if (!scene.textures.exists(tex) || scene.anims.exists(`${id}_${a}`)) continue;
      scene.anims.create({ key: `${id}_${a}`, frames: scene.anims.generateFrameNumbers(tex, { start: 0, end: an.frames - 1 }), frameRate: an.fps, repeat: an.repeat });
    }
  }
  for (const [name, f] of Object.entries(FX_PACKS)) {
    const tex = 'fx_' + name;
    if (!scene.textures.exists(tex) || scene.anims.exists(tex + '_a') || f.frames < 2) continue;
    scene.anims.create({ key: tex + '_a', frames: scene.anims.generateFrameNumbers(tex, { start: 0, end: f.frames - 1 }), frameRate: f.fps, repeat: f.repeat });
  }
}

// Paket efekti yüklendi mi (ör. Ölü Çağıran'ın ruh mermisi patlaması)
export function fxPackLoaded(name) {
  return !!FX_PACKS[name] && !!game?.textures.exists('fx_' + name);
}

// Paket kullanılabilir mi (bekleme animasyonu yüklendi mi)
export function spritePack(id) {
  const p = SPRITE_PACKS[id];
  if (heroGear && id.startsWith('hero_')) return null;
  return p && game?.textures.exists(`${id}:idle`) ? { id, ...p } : null;
}

export function animDuration(id, anim) {
  const a = SPRITE_PACKS[id]?.anims[anim];
  return a ? a.frames / a.fps : 0;
}

// Arayüz için ilk bekleme karesi (kırpılmış, ayak noktası altta) — canvas
// portrait: yalnız üst gövde (HUD portresi için)
export function packPreviewCanvas(id, height = 64, portrait = false) {
  const p = spritePack(id);
  if (!p) return null;
  const img = game.textures.get(`${id}:idle`).getSourceImage();
  // dolu alanı bul
  const tmp = document.createElement('canvas');
  tmp.width = p.w; tmp.height = p.h;
  const tc = tmp.getContext('2d');
  tc.drawImage(img, 0, 0, p.w, p.h, 0, 0, p.w, p.h);
  const d = tc.getImageData(0, 0, p.w, p.h).data;
  let x0 = p.w, y0 = p.h, x1 = 0, y1 = 0;
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (d[(y * p.w + x) * 4 + 3] > 10) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (portrait) y1 = y0 + Math.round((y1 - y0) * 0.5);
  const w = x1 - x0 + 1, h = y1 - y0 + 1, k = height / h;
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = height;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, x0, y0, w, h, 0, 0, c.width, c.height);
  return c;
}
