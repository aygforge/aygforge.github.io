/* =====================================================================
   10_scenes.js : 8 ana sahne — MainMenu, CharacterCreator, Town, PierFishing, SeaMap, BoatFishing, Home, EndDay
   ===================================================================== */
const Game = { scene: null, sceneName: '', t: 0, paused: false, scenes: {}, fade: 0, fadeTo: null };
function go(name, params) {
  if (Game.scene && Game.scene.exit) Game.scene.exit();
  Fishing.detach(); Sound.setEngine(false);
  Game.sceneName = name; Game.scene = Game.scenes[name]; Game.fade = 1;
  if (S && ['Town', 'PierFishing', 'BoatFishing', 'Home'].includes(name)) S.scene = name;
  UI.onScene(name);
  Game.scene.enter(params || {});
  if (S && ['Town', 'PierFishing', 'BoatFishing', 'Home'].includes(name)) Save.soon();
}
/* ---- ortak çizim ---- */
const CLOUDS = Array.from({ length: 7 }, (_, i) => ({ v: i % 3, x: i * 110 + (i * 37) % 50, y: 14 + (i * 23) % 70, s: 3 + (i % 3) * 2 }));
const RAIN = Array.from({ length: 110 }, () => ({ x: Math.random() * 680, y: Math.random() * 360, s: 220 + Math.random() * 120 }));
function drawSky(g, key, pal, wx, h, cam) {
  g.drawImage(skyCanvas(key, pal, wx, h), 0, 0);
  if (wx === 'sunny' || wx === 'wind') { const s = sunSprite(); g.drawImage(s, 520 - Math.round(cam * 0.02), 22); }
  const n = wx === 'sunny' ? 3 : wx === 'wind' ? 5 : 7;
  for (let i = 0; i < n; i++) { const c = CLOUDS[i]; const sp = cloudSprite(c.v, wx); const W = 640 + 120; const x = ((c.x + Game.t * c.s * (wx === 'wind' ? 3 : 1) - cam * 0.06) % W + W) % W - 80; g.drawImage(sp, Math.round(x), c.y + (wx === 'rain' ? 0 : 6)); }
}
function drawWater(g, key, pal, wx, surf, cam) {
  g.drawImage(underwaterCanvas(key, pal.sea, wx, LH - surf), 0, surf);
  if (wx === 'sunny' || wx === 'cloudy' || wx === 'wind') { g.globalAlpha = wx === 'sunny' ? 0.08 : 0.04; g.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { const x = ((i * 150 - cam * 0.6 + Math.sin(Game.t * 0.3 + i) * 20) % 760 + 760) % 760 - 60; g.beginPath(); g.moveTo(x, surf); g.lineTo(x + 26, surf); g.lineTo(x + 70, LH); g.lineTo(x + 30, LH); g.fill(); } g.globalAlpha = 1; }
}
function drawSurface(g, key, pal, surf, cam) {
  const f = Math.floor(Game.t * 6) % 8; const wf = waveFrame(key, pal.sea, f); const off = Math.floor(cam) % 128;
  for (let x = -off; x < LW; x += 128) g.drawImage(wf, x, surf - 4);
}
function drawUnderTint(g, pal, surf) { g.globalAlpha = 0.32; g.fillStyle = pal.sea[1]; g.fillRect(0, surf + 2, LW, LH - surf); g.globalAlpha = 1; }
function drawWeatherFx(g, wx, surf, dt) {
  if (SETTINGS.reduced && wx !== 'fog') return;
  if (wx === 'rain') { g.fillStyle = 'rgba(200,220,255,0.55)'; for (const d of RAIN) { d.y += d.s * dt; d.x -= d.s * 0.18 * dt; if (d.y > LH) { d.y = -10; d.x = Math.random() * 700; } g.fillRect(Math.round(d.x), Math.round(d.y), 1, 5); } }
  if (wx === 'fog') { for (let i = 0; i < 4; i++) { g.globalAlpha = 0.16; g.fillStyle = '#e8eef2'; const y = 120 + i * 40 + Math.sin(Game.t * 0.2 + i) * 6; const x = ((Game.t * (6 + i * 3)) % 200) - 200; for (let k = 0; k < 6; k++) g.fillRect(Math.round(x + k * 200), Math.round(y), 160, 26); } g.globalAlpha = 0.12; g.fillStyle = '#dfe6ea'; g.fillRect(0, 0, LW, LH); g.globalAlpha = 1; }
  if (wx === 'wind') { g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 12; i++) { const x = ((Game.t * 260 + i * 97) % 760) - 60, y = 30 + (i * 53) % (surf - 40); g.fillRect(Math.round(x), y, 14 + (i % 3) * 6, 1); } }
}

/* bölgesel ambiyans canlıları ve mevsim efektleri */
const dolphinPB = () => { const p = new PB(18, 8); p.ellipse(9, 4.5, 7.5, 2.6, '#5a6a80', (x, y) => y > 4 ? '#c8d0dc' : '#5a6a80'); p.poly([[8, 2], [11, -1], [11, 2]], '#4a5a70'); p.poly([[1, 4], [-1, 1], [3, 3]], '#4a5a70'); p.poly([[1, 5], [-1, 7], [3, 5]], '#4a5a70'); p.set(14, 4, '#1a1426'); p.rect(16, 5, 2, 1, '#5a6a80'); p.outline(null, 0.5); return p; };
const SNOW = Array.from({ length: 70 }, (_, i) => ({ x: (i * 97) % 680, y: (i * 61) % 360, s: 14 + (i % 5) * 6, w: i % 3 }));
function seasonFx(g, season, dt, top) {
  if (SETTINGS.reduced) return;
  const col = season === 'winter' ? '#ffffff' : season === 'autumn' ? '#d8843a' : season === 'spring' ? '#f8b8d0' : null; if (!col) return;
  const n = season === 'winter' ? 70 : 14;
  for (let i = 0; i < n; i++) { const d = SNOW[i]; d.y += d.s * dt * (season === 'winter' ? 1 : 0.8); d.x += Math.sin(Game.t + i) * 8 * dt - (season === 'winter' ? 2 : 10) * dt; if (d.y > top) { d.y = -4; d.x = Math.random() * 680; } if (d.x < -10) d.x = 650; g.fillStyle = col; g.fillRect(Math.round(d.x), Math.round(d.y), d.w ? 2 : 1, d.w === 2 ? 2 : 1); }
}
function regionAmbient(g, rid, cam, surf) {
  const n = rid === 'derin_mavi' ? 1 : 2;
  for (let i = 0; i < n; i++) { const f = Math.floor(Game.t * 5 + i) % 3; const gx = ((Game.t * (26 + i * 9) + i * 380) % (LW + 220)) - 110; g.drawImage(Atlas.get('gull' + f, () => gullPB(f)), Math.round(gx), 34 + i * 26 + Math.round(Math.sin(Game.t * 0.9 + i) * 5)); }
  if (rid === 'gunes_adalari' || rid === 'kayalik_adalar') { for (let i = 0; i < 2; i++) { const ph = (Game.t + i * 3.1) % 7; if (ph < 1.1) { const k = ph / 1.1; const fid = rid === 'gunes_adalari' ? 'ucan_balik' : 'zargana'; const sp = fishSprR(fid); const x = 330 + i * 150 + k * 70, y = surf - Math.sin(k * Math.PI) * 22 - 4; g.drawImage(sp, Math.round(x), Math.round(y), Math.round(sp.width / 2), Math.round(sp.height / 2)); if (k > 0.9) Fishing.splash(x + cam, surf, 1); } } }
  if (rid === 'derin_mavi' || rid === 'serin_akintilar') { const ph = (Game.t + 2) % 11; if (ph < 1.4) { const k = ph / 1.4; const sp = Atlas.get('dolphin', dolphinPB); const x = 420 + k * 90, y = surf - Math.sin(k * Math.PI) * 16 + 2; g.save(); g.beginPath(); g.rect(0, 0, LW, surf + 1); g.clip(); g.drawImage(sp, Math.round(x), Math.round(y)); g.restore(); } }
  if (rid === 'derin_mavi') { const ph = Game.t % 13; if (ph < 1.6) { const x = 560 - cam * 0.15 % 200; for (let i = 0; i < 10; i++) { const h = Math.sin(ph / 1.6 * Math.PI) * 14; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(Math.round(x + Math.sin(i * 1.7) * 4), Math.round(surf - 4 - h * (i / 10)), 1, 1); } g.fillStyle = '#4a5a70'; g.fillRect(Math.round(x - 6), surf - 2, 14, 2); } }
}
function drawPerson(g, look, pose, x, footY, flip) { const sp = personSprite(look, pose, flip); g.drawImage(sp, Math.round(x - CH_W / 2), Math.round(footY - 30)); return sp; }
function handPt(look, pose, x, footY, flip) { const sp = personSprite(look, pose, flip); return [Math.round(x - CH_W / 2) + sp._hand[0], Math.round(footY - 30) + sp._hand[1]]; }
function fishingPose(ph, t) {
  if (ph === 'CHARGING') return 'charge';
  if (ph === 'CAST_FLYING') return t < 0.18 ? 'cast' : 'hold';
  if (ph === 'REELING' || ph === 'QUICK_PULL') return Math.floor(t * 8) % 2 ? 'reel0' : 'reel1';
  if (ph === 'CATCH_RESULT' || ph === 'STORAGE_DECISION') return 'catch';
  if (ph === 'OUTCOME' && ['LINE_BREAK', 'FISH_ESCAPED', 'MISSED_BITE'].includes(Fishing.lastOutcome)) return 'sad';
  return 'hold';
}
function visitSpot(spotId) {
  const rid = SPOTS[spotId].region_id; let ch = false;
  if (!S.stats.spotsVisited[spotId]) { S.stats.spotsVisited[spotId] = true; ch = true; }
  if (!S.stats.regionsVisited[rid]) { S.stats.regionsVisited[rid] = true; ch = true; }
  S.spotId = spotId; S.regionId = rid; if (ch) { Ach.check(); Cosmetics.check(); } Save.soon();
}

/* ================= MainMenu ================= */
Game.scenes.MainMenu = {
  enter() { Sound.setScene('menu', 'sunny'); },
  update() { },
  render(g) {
    const pal = REGION_PAL.sakin_liman; const cam = (Game.t * 14) % (RW - 640); const art = regionArt('sakin_liman', 'spring');
    drawSky(g, 'sakin_liman', pal.sky, 'sunny', SURF, cam);
    g.drawImage(art.far, -Math.round(cam * 0.15), 0); g.drawImage(art.mid, -Math.round(cam * 0.45), 0);
    drawWater(g, 'sakin_liman', pal, 'sunny', SURF, cam);
    const bs = boatSprite('coastal_skiff', { color: 'coral', name: '', motor: 1, hull: 1, nav: 0, storage: 6 }); const by = Math.round(SURF - bs.water + Math.sin(Game.t * 1.3) * 1.5);
    g.drawImage(bs.back, 120, by); drawPerson(g, { skin: 1, hair: 0, hairColor: 1, body: 0, outfit: 'tisort', hat: 'klasik' }, 'hold', 120 + bs.stand[0], by + bs.stand[1]); g.drawImage(bs.front, 120, by);
    drawUnderTint(g, pal, SURF); drawSurface(g, 'sakin_liman', pal, SURF, cam);
    for (let i = 0; i < 3; i++) { const gx = ((Game.t * (24 + i * 7) + i * 200) % 760) - 60; g.drawImage(Atlas.get('gull' + (Math.floor(Game.t * 4 + i) % 3), () => gullPB(Math.floor(Game.t * 4 + i) % 3)), Math.round(gx), 40 + i * 18 + Math.round(Math.sin(Game.t + i) * 4)); }
    const title = 'COZY FISHING'; const sc = 5; const tw = textWidth(title, sc); const tx = Math.round(320 - tw / 2), ty = 34;
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 3], [2, 3], [-2, 3]]) drawText(g, title, tx + dx, ty + dy, '#2a1a3a', sc);
    drawText(g, title, tx, ty, '#ffe08a', sc); drawText(g, title, tx, ty, '#ffe08a', sc);
    g.globalAlpha = 0.55; g.fillStyle = '#ffffff'; for (let x = tx; x < tx + tw; x += 1) if (((x + Math.floor(Game.t * 40)) % 90) < 4) g.fillRect(x, ty, 1, 25); g.globalAlpha = 1;
    drawText(g, 'SAKİN BİR BALIKÇILIK HİKÂYESİ', 320 - textWidth('SAKİN BİR BALIKÇILIK HİKÂYESİ') / 2, ty + 34, '#ffffff', 1, '#2a1a3a');
  }
};
/* ================= CharacterCreator ================= */
Game.scenes.CharacterCreator = {
  look: null, enter(p) { this.look = Object.assign({ name: 'Deniz', body: 0, skin: 1, hair: 0, hairColor: 1, outfit: 'tisort', hat: 'klasik' }, p.look || {}); Sound.setScene('home'); UI.charCreator(this); },
  update() { },
  render(g) {
    g.drawImage(homeArt('spring'), 0, 0); g.fillStyle = 'rgba(20,14,26,0.35)'; g.fillRect(0, 0, LW, LH);
    const poses = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'hold', 'catch']; const pose = poses[Math.floor(Game.t * 2.5) % poses.length];
    const sp = personSprite(this.look, pose); g.imageSmoothingEnabled = false; g.drawImage(sp, 50, 70, sp.width * 7, sp.height * 7);
    const pt = portraitPB(this.look); g.drawImage(Atlas.get('pp:' + lookKey(this.look), () => pt), 178, 24, 80, 80);
  }
};
/* ================= Town ================= */
const TOWN_NPC = { zeynep: 372, nihat: 640, bora: 930, bahar: 1268 };
const VILLAGERS = [
  { look: { skin: 4, hair: 7, hairColor: 0, body: 0, outfit: { shirt: '#d87a4a', shirt2: '#a85a32', pants: '#3a4a5a', shoes: '#3a2a22', pat: 'plain' }, hat: 'none' }, x: 520, a: 420, b: 1150, v: 18 },
  { look: { skin: 1, hair: 3, hairColor: 4, body: 0, outfit: { shirt: '#8a6ac8', shirt2: '#6a4aa8', pants: '#4a3a3a', shoes: '#2a2226', pat: 'flower' }, hat: 'hasir' }, x: 900, a: 240, b: 1240, v: -14 }
];
Game.scenes.Town = {
  p: null, cam: 0, target: null, onArrive: null, efeX: 1590, efeDir: 1, cat: { x: 210, t: 0 }, near: null,
  enter(prm) {
    const at = prm.at ? TOWN_DOORS.find(d => d.id === prm.at) : null;
    this.p = { x: at ? at.x : (S.townX || 330), dir: 1, walkT: 0, moving: false }; this.target = null; this.onArrive = null;
    Sound.setScene('town', S.world.weather.sakin_liman); this.near = null; UI.townBar(this);
  },
  exit() { S.townX = Math.round(this.p.x); },
  walkTo(x, cb) { this.target = clamp(x, 20, TOWN_W - 40); this.onArrive = cb || null; },
  input(dir) { this.move = dir; if (dir) { this.target = null; this.onArrive = null; } },
  update(dt) {
    const p = this.p; let v = 0;
    if (this.move) v = this.move * 96;
    else if (this.target != null) { const d = this.target - p.x; if (Math.abs(d) < 3) { this.target = null; const cb = this.onArrive; this.onArrive = null; p.x = Math.round(p.x); if (cb) cb(); } else v = Math.sign(d) * 110; }
    if (UI.modalOpen()) v = 0;
    p.moving = v !== 0; if (v) { p.dir = Math.sign(v); p.x = clamp(p.x + v * dt, 20, TOWN_W - 40); p.walkT += dt; if (Math.floor(p.walkT * 8) !== Math.floor((p.walkT - dt) * 8) && Math.floor(p.walkT * 8) % 2 === 0) Sound.sfx('step'); }
    this.cam = clamp(Math.round(p.x - 300), 0, TOWN_W - LW);
    this.efeX += this.efeDir * 10 * dt; if (this.efeX > 1640) this.efeDir = -1; if (this.efeX < 1560) this.efeDir = 1;
    let near = null; for (const d of TOWN_DOORS) { const dx = d.id === 'efe' ? this.efeX : d.x; if (Math.abs(p.x - dx) < 34) near = d; }
    if (near !== this.near) { this.near = near; UI.townBar(this); }
  },
  interact(d) {
    d = d || this.near; if (!d) return; Sound.sfx('door');
    switch (d.id) {
      case 'home': go('Home', {}); break;
      case 'shop': UI.openPanel('TackleShop'); break;
      case 'market': UI.openPanel('FishMarket'); break;
      case 'yard': S.flags.sawBoatyard = true; UI.openPanel('Boatyard'); break;
      case 'board': UI.openPanel('Orders'); break;
      case 'harbor': if (!S.boats.owned.length) { UI.toastNow('Henüz bir teknen yok. Bora\'nın atölyesinden Kıyı Kayığı (2.200) alabilirsin. İskelede ücretsiz balık tutabilirsin!', 'warn'); } else go('SeaMap', {}); break;
      case 'efe': UI.openPanel('Dialog', { npc: 'efe' }); break;
      case 'pier': go('PierFishing', { spot: 1 }); break;
    }
  },
  tap(wx, wy) {
    let best = null, bd = 1e9; for (const d of TOWN_DOORS) { const dx = d.id === 'efe' ? this.efeX : d.x; const dist = Math.abs(wx - dx); const range = d.id === 'efe' ? 24 : 70; if (dist < range && dist < bd) { bd = dist; best = d; } }
    if (best) { const dx = best.id === 'efe' ? this.efeX : best.x; this.walkTo(dx, () => this.interact(best)); }
    else this.walkTo(wx);
  },
  render(g, dt) {
    const season = World.season(), wx = S.world.weather.sakin_liman, pal = REGION_PAL.sakin_liman; const art = townArt(season); const cam = this.cam;
    drawSky(g, 'town', pal.sky, wx, 300, cam);
    g.drawImage(art.far, -Math.round(cam * 0.15), 300 - 260 - 40); g.drawImage(art.mid, -Math.round(cam * 0.45), 300 - 280 + 8);
    // liman suyu
    const sx = TOWN_WATER_X - 60 - cam; const clipW = (fn) => { if (sx >= LW) return; g.save(); g.beginPath(); g.rect(Math.max(0, sx), 0, LW, LH); g.clip(); fn(); g.restore(); };
    clipW(() => drawWater(g, 'town', pal, wx, 300, cam));
    g.drawImage(art.main, -cam, 0);
    // tekneler (iskelenin önünde bağlı)
    let mx = 1352; S.boats.owned.forEach((id, i) => { const bs = boatSprite(id); const bx = mx - cam; mx += Math.round(bs.w * 0.8); const by = Math.round(300 - bs.water + 6 + Math.sin(Game.t * 1.2 + i) * 1.2); if (bx > -200 && bx < LW + 20) { g.drawImage(bs.back, Math.round(bx), by); g.drawImage(bs.front, Math.round(bx), by); if (id === S.boats.active) drawText(g, 'AKTİF', Math.round(bx + bs.w / 2 - 10), by + bs.deck - 36, '#ffe08a', 1, '#1a1426'); } });
    clipW(() => { drawUnderTint(g, pal, 306); drawSurface(g, 'town', pal, 306, cam); });
    // panodaki ilanlar
    const nOrd = Orders.active().length; for (let i = 0; i < nOrd; i++) { const px = 1198 + (i % 3) * 16 - cam, py = TOWN_GROUND - 78 + Math.floor(i / 3) * 18; g.fillStyle = ['#f6eed8', '#f2e2c0', '#fffaf0'][i % 3]; g.fillRect(px, py, 12, 14); g.fillStyle = '#c4473f'; g.fillRect(px + 5, py, 2, 2); g.fillStyle = '#a89878'; g.fillRect(px + 2, py + 5, 8, 1); g.fillRect(px + 2, py + 8, 6, 1); }
    // baca dumanı
    for (let i = 0; i < 5; i++) { const k = ((Game.t * 0.35 + i / 5) % 1); g.globalAlpha = 0.5 * (1 - k); g.fillStyle = '#e8e8f0'; const r = 2 + k * 5; g.fillRect(Math.round(58 + 106 - cam + Math.sin(k * 6 + i) * 4 - r / 2), Math.round(TOWN_GROUND - 130 - k * 40), Math.round(r), Math.round(r)); } g.globalAlpha = 1;
    // NPC'ler
    for (const id in TOWN_NPC) drawPerson(g, NPCS[id].look, Math.floor(Game.t * 1.5 + id.length) % 2 ? 'idle0' : 'idle1', TOWN_NPC[id] - cam, TOWN_GROUND + 2, this.p.x < TOWN_NPC[id]);
    const ef = Math.floor(Game.t * 4) % 4; drawPerson(g, NPCS.efe.look, 'walk' + ef, this.efeX - cam, TOWN_GROUND - 2, this.efeDir < 0);
    for (const v of VILLAGERS) { if (dt) { v.x += v.v * dt; if (v.x > v.b) v.v = -Math.abs(v.v); if (v.x < v.a) v.v = Math.abs(v.v); } const sx = v.x - cam; if (sx > -20 && sx < LW + 20) drawPerson(g, v.look, 'walk' + (Math.floor(Game.t * 5 + v.a) % 4), sx, TOWN_GROUND + 6, v.v < 0); }
    // kedi ve martılar
    const cf = Math.floor(Game.t * 3) % 2; g.drawImage(Atlas.get('cat' + cf, () => catPB(cf)), Math.round(this.cat.x + Math.sin(Game.t * 0.3) * 30 - cam), TOWN_GROUND + 12);
    g.drawImage(Atlas.get('gullS', gullStandPB), 1388 - cam, TOWN_GROUND - 20); g.drawImage(Atlas.get('gullS', gullStandPB), 1508 - cam, TOWN_GROUND - 20);
    for (let i = 0; i < 2; i++) { const f = Math.floor(Game.t * 5 + i) % 3; const gx = ((Game.t * (30 + i * 9) + i * 400) % 2000) - 100 - cam * 0.5; g.drawImage(Atlas.get('gull' + f, () => gullPB(f)), Math.round(gx), 60 + i * 30 + Math.round(Math.sin(Game.t + i) * 5)); }
    // oyuncu
    const p = this.p; const pose = p.moving ? 'walk' + (Math.floor(p.walkT * 8) % 4) : (Math.floor(Game.t * 1.2) % 2 ? 'idle0' : 'idle1');
    drawPerson(g, S.player, pose, p.x - cam, p.x > TOWN_WATER_X - 40 ? TOWN_GROUND - 2 : TOWN_GROUND + 2, p.dir < 0);
    if (this.near) { const dx = (this.near.id === 'efe' ? this.efeX : this.near.x) - cam; const bob = Math.round(Math.sin(Game.t * 5) * 2); g.drawImage(iconCanvas(this.near.icon), Math.round(dx - 8), TOWN_GROUND - 100 + bob); }
    drawWeatherFx(g, wx, 300, dt); seasonFx(g, season, dt, LH);
  }
};
/* ================= PierFishing ================= */
Game.scenes.PierFishing = {
  idx: 1, trans: 0, transDir: 0, tipPt: [0, 0],
  enter(p) {
    this.idx = p.spot != null ? p.spot : Math.max(0, PIER_SPOTS.indexOf(S.spotId)); if (this.idx < 0) this.idx = 1; this.trans = 0;
    visitSpot(PIER_SPOTS[this.idx]); Sound.setScene('pier', S.world.weather.sakin_liman);
    const self = this;
    Fishing.attach({ mode: 'pier', surf: PIER_SURF, minCast: 40, maxCast: 320, spotId: () => PIER_SPOTS[self.idx], tip: () => self.tipPt, moving: () => self.trans > 0 });
    UI.fishBar(this);
  },
  exit() { },
  switchSpot(dir) { if (Fishing.phase !== 'READY' || this.trans > 0) return; const n = this.idx + dir; if (n < 0 || n > 2) return; this.trans = 1; this.transDir = dir; },
  update(dt) {
    if (this.trans > 0) { this.trans += dt; if (this.trans > 1.4 && this.trans - dt <= 1.4) { this.idx += this.transDir; visitSpot(PIER_SPOTS[this.idx]); UI.fishBar(this); } if (this.trans > 2.2) this.trans = 0; }
    Fishing.update(dt);
  },
  render(g, dt) {
    const wx = S.world.weather.sakin_liman, pal = REGION_PAL.sakin_liman, season = World.season(); const art = regionArt('sakin_liman', season);
    const cam = SPOT_X[this.idx] - 180;
    drawSky(g, 'pier', pal.sky, wx, PIER_SURF, cam);
    g.drawImage(art.far, -Math.round(cam * 0.15), PIER_SURF - SURF); g.drawImage(art.mid, -Math.round(cam * 0.45), PIER_SURF - SURF);
    drawWater(g, 'pier', pal, wx, PIER_SURF, cam); g.drawImage(art.bed, -cam, PIER_SURF + 10);
    g.drawImage(pierArt(this.idx, season), 0, 0);
    drawUnderTint(g, pal, PIER_SURF); drawSurface(g, 'pier', pal, PIER_SURF, cam);
    let [sx, sy] = PIER_STAND[this.idx];
    if (this.trans > 0) { const k = this.trans < 1.4 ? this.trans / 1.4 : 0; sx += this.transDir * k * 300; }
    const pose = this.trans > 0 ? 'walk' + (Math.floor(Game.t * 8) % 4) : fishingPose(Fishing.phase, Fishing.t);
    drawPerson(g, S.player, pose, sx, sy, this.trans > 0 && this.transDir < 0);
    if (this.trans === 0) { const h = handPt(S.player, pose, sx, sy); this.tipPt = drawRod(g, h[0], h[1], pose, Fishing.phase === 'REELING' ? Fishing.tension : (Fishing.phase === 'QUICK_PULL' ? 40 : 0), S.gear.rod); }
    Fishing.render(g, 0);
    drawWeatherFx(g, wx, PIER_SURF, dt); seasonFx(g, season, dt, LH);
    if (this.trans > 0) { const a = this.trans < 1.4 ? clamp((this.trans - 0.9) / 0.5, 0, 1) : clamp(1 - (this.trans - 1.4) / 0.8, 0, 1); g.globalAlpha = a; g.fillStyle = '#100c18'; g.fillRect(0, 0, LW, LH); g.globalAlpha = 1; }
    drawText(g, 'SAKİN LİMAN · ' + SPOTS[PIER_SPOTS[this.idx]].name, 8, 56, '#fff6e0', 1, '#1a1426');
    Fishing.renderHUD(g);
  }
};
/* ================= SeaMap ================= */
Game.scenes.SeaMap = {
  sel: null, travel: null,
  enter() { this.sel = S.regionId && S.regionId !== 'sakin_liman' ? S.regionId : 'yesil_koy'; this.travel = null; Sound.setScene('town', S.world.weather.sakin_liman); UI.mapPanel(this); },
  pick(rid) { if (this.travel) return; this.sel = rid; Sound.sfx('click'); UI.mapPanel(this); },
  depart() {
    if (this.travel) return; const rid = this.sel; const R = REGION[rid]; const bid = S.boats.active;
    const re = Boats.reach(rid, bid); if (!re.ok) { UI.toastNow('Bu bölge için eksik: ' + re.miss.join(', '), 'warn'); return; }
    const r = Tx.run('trip', () => {
      if (S.cash < R.trip_fuel_cost) return { ok: false, msg: 'Yakıt için paran yetmiyor (' + R.trip_fuel_cost + ').' };
      if (R.trip_fuel_cost) spend(R.trip_fuel_cost, 'fuel'); S.stats.fuelSpent += R.trip_fuel_cost; S.stats.trips++;
      S.regionId = rid; S.spotId = R.spot_ids[0]; S.scene = 'BoatFishing'; S.stats.regionsVisited[rid] = true; return { ok: true };
    });
    if (!r.ok) { UI.toastNow(r.msg, 'warn'); return; }
    Sound.sfx('horn'); this.travel = { t: 0, rid }; UI.mapPanel(this);
  },
  skip() { if (this.travel) this.travel.t = 9; },
  update(dt) { if (this.travel) { this.travel.t += dt; if (this.travel.t > 1.6) { const rid = this.travel.rid; this.travel = null; go('BoatFishing', { rid, arrive: true }); } } },
  tap(x, y) { let best = null, bd = 30; for (const r of REGIONS) { const [mx, my] = MAP_POS[r.id]; const d = Math.hypot(mx - x, my - y); if (d < bd) { bd = d; best = r.id; } } if (best) this.pick(best); },
  render(g) {
    g.drawImage(mapArt(), 0, 0);
    const home = MAP_POS.sakin_liman;
    for (const r of REGIONS) {
      if (r.id === 'sakin_liman') continue; const [x, y] = MAP_POS[r.id]; const un = S.world.unlocked[r.id];
      g.fillStyle = un ? '#5a3a1e' : 'rgba(90,58,30,0.35)'; const n = Math.ceil(Math.hypot(x - home[0], y - home[1]) / 6);
      for (let i = 1; i < n; i += 2) { const t = i / n; g.fillRect(Math.round(lerp(home[0], x, t)), Math.round(lerp(home[1], y, t) - Math.sin(t * Math.PI) * 14), 2, 2); }
    }
    for (const r of REGIONS) {
      const [x, y] = MAP_POS[r.id]; const un = S.world.unlocked[r.id]; const sel = this.sel === r.id;
      g.fillStyle = '#3a2414'; g.fillRect(x - 9, y - 9, 18, 18); g.fillStyle = sel ? '#ffe08a' : (un ? '#f6ecd2' : '#b8a888'); g.fillRect(x - 8, y - 8, 16, 16);
      g.drawImage(iconCanvas(un ? (r.id === 'sakin_liman' ? 'home' : 'anchor') : 'lock'), x - 8, y - 8);
      g.drawImage(iconCanvas(S.world.weather[r.id]), x + 8, y - 22);
      const nm = r.name; g.fillStyle = 'rgba(246,236,210,0.85)'; g.fillRect(x - textWidth(nm) / 2 - 2, y + 11, textWidth(nm) + 4, 8); drawText(g, nm, Math.round(x - textWidth(nm) / 2), y + 12, '#3a2414');
      if (sel) { const k = Math.floor(Game.t * 4) % 2; g.fillStyle = '#c4473f'; g.fillRect(x - 12 - k, y - 12 - k, 4, 1); g.fillRect(x - 12 - k, y - 12 - k, 1, 4); g.fillRect(x + 9 + k, y - 12 - k, 4, 1); g.fillRect(x + 12 + k, y - 12 - k, 1, 4); g.fillRect(x - 12 - k, y + 12 + k, 4, 1); g.fillRect(x - 12 - k, y + 9 + k, 1, 4); g.fillRect(x + 9 + k, y + 12 + k, 4, 1); g.fillRect(x + 12 + k, y + 9 + k, 1, 4); }
    }
    let bx = home[0], by = home[1] + 14;
    if (this.travel) { const [x, y] = MAP_POS[this.travel.rid]; const t = clamp(this.travel.t / 1.5, 0, 1); bx = lerp(home[0], x, t); by = lerp(home[1], y, t) - Math.sin(t * Math.PI) * 14; for (let i = 0; i < 6; i++) { const tt = Math.max(0, t - i * 0.03); g.fillStyle = 'rgba(255,255,255,' + (0.6 - i * 0.1) + ')'; g.fillRect(Math.round(lerp(home[0], x, tt)) - 1, Math.round(lerp(home[1], y, tt) - Math.sin(tt * Math.PI) * 14) + 4, 2, 1); } }
    g.drawImage(iconCanvas('boat'), Math.round(bx - 8), Math.round(by - 10 + Math.sin(Game.t * 3)));
  }
};
/* ================= BoatFishing ================= */
Game.scenes.BoatFishing = {
  rid: 'yesil_koy', x: 260, v: 0, move: 0, target: null, cam: 0, tipPt: [0, 0], arrive: 0, dev: {}, lastSpot: null,
  enter(p) {
    this.rid = p.rid || S.regionId || 'yesil_koy'; if (!REGION[this.rid]) this.rid = 'yesil_koy';
    const si = Math.max(0, REGION[this.rid].spot_ids.indexOf(S.spotId)); this.x = SPOT_X[si]; this.v = 0; this.move = 0; this.target = null; this.arrive = p.arrive ? 1.3 : 0; this.dev = {};
    if (!S.boats.active) { go('Town', { at: 'harbor' }); return; }
    S.regionId = this.rid; visitSpot(REGION[this.rid].spot_ids[si]); this.lastSpot = S.spotId;
    Sound.setScene('sea', S.world.weather[this.rid]);
    const self = this;
    Fishing.attach({ mode: 'boat', surf: SURF, minCast: 50, maxCast: 300, spotId: () => self.spotId(), tip: () => self.tipPt, moving: () => Math.abs(self.v) > 4 || self.arrive > 0, atSpot: () => self.atSpot(), onAuto: e => self.autoAnim(e) });
    UI.fishBar(this);
  },
  exit() { Sound.setEngine(false); },
  spotIdx() { let bi = 0, bd = 1e9; SPOT_X.forEach((sx, i) => { const d = Math.abs(sx - this.x); if (d < bd) { bd = d; bi = i; } }); return bi; },
  spotId() { return REGION[this.rid].spot_ids[this.spotIdx()]; },
  atSpot() { return Math.abs(SPOT_X[this.spotIdx()] - this.x) < 70; },
  input(dir) { if (Fishing.locked()) { if (dir) Fishing.say('Önce oltayı topla / avı bitir.', 1.4); this.move = 0; return; } this.move = dir; if (dir) this.target = null; },
  goSpot(i) { if (Fishing.locked()) return; this.target = SPOT_X[i]; },
  tap(x, y) { if (Fishing.locked() || this.arrive > 0) return; for (let i = 0; i < 3; i++) { const bx = SPOT_X[i] + 150 - this.cam; if (Math.abs(x - bx) < 34 && y > SURF - 50 && y < SURF + 40) { this.goSpot(i); return; } } if (y > 90 && y < 300) this.target = clamp(x + this.cam - 150, 120, RW - 140); },
  autoAnim(e) { this.dev[e.dev] = { type: e.type, t: 0, fid: e.fid }; },
  update(dt) {
    if (this.arrive > 0) { this.arrive -= dt; }
    const st = Boats.stats(S.boats.active); const vmax = 46 + st.motor * 16;
    let want = 0; if (this.move) want = this.move * vmax; else if (this.target != null) { const d = this.target - this.x; if (Math.abs(d) < 4 && Math.abs(this.v) < 10) { this.target = null; } else want = clamp(d * 1.6, -vmax, vmax); }
    if (UI.modalOpen()) want = 0;
    this.v += (want - this.v) * Math.min(1, dt * 2.2); if (Math.abs(this.v) < 0.5 && !want) this.v = 0;
    this.x = clamp(this.x + this.v * dt, 120, RW - 140);
    Sound.setEngine(Math.abs(this.v) > 6, st.motor);
    if (Math.abs(this.v) > 8 && Math.random() < dt * 30) Fishing.fx.push({ x: this.x - 50 + Math.random() * 10, y: SURF, vx: -this.v * 0.3 - Math.random() * 20, vy: -20 - Math.random() * 30, t: 0, life: 0.6, c: '#ffffff' });
    this.cam = clamp(Math.round(this.x - 200), 0, RW - LW);
    const sid = this.spotId(); if (sid !== this.lastSpot && this.atSpot()) { this.lastSpot = sid; visitSpot(sid); UI.fishBar(this); UI.toastNow(SPOTS[sid].name + ' (' + BAND_TR[SPOTS[sid].cast_band] + ' atış önerilir)', 'info'); }
    for (const k in this.dev) { this.dev[k].t += dt; if (this.dev[k].t > 2.2) delete this.dev[k]; }
    Fishing.update(dt);
  },
  render(g, dt) {
    const rid = this.rid, pal = REGION_PAL[rid], wx = S.world.weather[rid], season = World.season(); const art = regionArt(rid, season); const cam = this.cam;
    drawSky(g, rid, pal.sky, wx, SURF, cam);
    g.drawImage(art.far, -Math.round(cam * 0.15), 0); g.drawImage(art.mid, -Math.round(cam * 0.45), 0);
    drawWater(g, rid, pal, wx, SURF, cam); g.drawImage(art.bed, -cam, SURF);
    // ortam balıkları
    for (let i = 0; i < 6; i++) { const fid = REGION[rid].fish_ids[i % 6]; const sil = fishSil(fid); const sp = 10 + i * 3; const W = RW + 200; const fx = ((i * 260 + Game.t * sp * (i % 2 ? 1 : -1)) % W + W) % W - 100; const fy = SURF + 40 + (i * 23) % 80 + Math.sin(Game.t * 0.8 + i) * 3; g.globalAlpha = 0.22; g.drawImage(i % 2 ? fishSilR(fid) : sil, Math.round(fx - cam), Math.round(fy), Math.round(sil.width * 0.6), Math.round(sil.height * 0.6)); } g.globalAlpha = 1;
    g.drawImage(art.near, -cam, 0);
    regionAmbient(g, rid, cam, SURF);
    // av noktası şamandıraları
    SPOT_X.forEach((sx, i) => { const x = sx + 150 - cam; if (x < -20 || x > LW + 20) return; const by = SURF - 10 + Math.round(Math.sin(Game.t * 2 + i) * 1.5); g.fillStyle = '#3a3a42'; g.fillRect(x, by - 12, 1, 12); g.fillStyle = ['#e8483a', '#f2c230', '#4f86c6'][i]; g.fillRect(x + 1, by - 12, 7, 5); g.fillStyle = '#f4f0e4'; g.fillRect(x - 3, by, 7, 4); g.fillStyle = ['#e8483a', '#f2c230', '#4f86c6'][i]; g.fillRect(x - 3, by + 2, 7, 2); });
    // tekne
    const bid = S.boats.active; const bs = boatSprite(bid); const st = Boats.stats(bid);
    const sway = (wx === 'wind' ? 2.4 : 1.4) * (1 - st.hull * 0.2);
    let ox = 0; if (this.arrive > 0) ox = -this.arrive * 160;
    const bx = Math.round(this.x - cam - bs.stand[0] + ox), by = Math.round(SURF - bs.water + Math.sin(Game.t * 1.4) * sway);
    g.drawImage(bs.back, bx, by);
    // otomatik oltalar
    const mounted = Auto.mountedOn(bid);
    mounted.forEach((dv, i) => {
      const [mx, my] = bs.mounts[i] || bs.mounts[0]; const x0 = bx + mx, y0 = by + my; const an = this.dev[dv]; const d = S.auto.devices[dv];
      let bend = 0, fishUp = null; if (an) { if (an.type === 'catch' || an.type === 'miss') bend = an.t < 1.2 ? (0.5 + Math.sin(an.t * 20) * 0.3) : 0; if (an.type === 'catch' && an.t > 1.0) fishUp = clamp((an.t - 1.0) / 0.8, 0, 1); }
      g.fillStyle = '#5a6470'; g.fillRect(x0 - 2, y0 - 2, 4, 5); g.fillStyle = '#e8b830'; g.fillRect(x0 - 1, y0 - 1, 2, 1);
      const tx = x0 - 18 + bend * 4, ty = y0 - 22 + bend * 10; pxLine(g, x0, y0 - 2, tx, ty, '#a8743e'); pxLine(g, x0 + 1, y0 - 2, tx + 1, ty, '#7a5228');
      const lx = x0 - 34 - i * 6, ly = SURF + (bend ? 2 : 0); pxLine(g, tx, ty, lx, ly, 'rgba(240,248,255,0.7)'); g.fillStyle = '#e8483a'; g.fillRect(lx - 1, ly - 2 + (bend ? 2 : 0), 3, 2);
      if (an && an.type === 'miss' && an.t > 1.0 && an.t < 1.3) Fishing.splash(lx + cam, SURF, 2);
      if (fishUp != null && an.fid) { const sp = fishSprite(an.fid); const fx = lerp(lx, x0 + 10, fishUp), fy = lerp(SURF + 4, y0 - 6, fishUp) - Math.sin(fishUp * Math.PI) * 24; g.drawImage(sp, Math.round(fx - sp.width / 4), Math.round(fy - sp.height / 4), Math.round(sp.width / 2), Math.round(sp.height / 2)); }
      const every = Auto.every(); for (let k = 0; k < every; k++) { g.fillStyle = k < d.counter ? '#5fc46a' : '#3a3048'; g.fillRect(x0 - 6 + k * 4, y0 - 30, 3, 3); }
      if (d.paused) { g.fillStyle = '#f2c230'; g.fillRect(x0 + 6, y0 - 32, 3, 5); g.fillRect(x0 + 6, y0 - 26, 3, 2); }
    });
    const pose = fishingPose(Fishing.phase, Fishing.t);
    const px = bx + bs.stand[0], py = by + bs.stand[1];
    drawPerson(g, S.player, pose, px, py);
    const h = handPt(S.player, pose, px, py);
    g.drawImage(bs.front, bx, by);
    this.tipPt = drawRod(g, h[0], h[1], pose, Fishing.phase === 'REELING' ? Fishing.tension : (Fishing.phase === 'QUICK_PULL' ? 40 : 0), S.gear.rod); this.tipPt = [this.tipPt[0] + cam, this.tipPt[1]];
    drawUnderTint(g, pal, SURF); drawSurface(g, rid, pal, SURF, cam);
    if (Math.abs(this.v) > 6) { g.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 8; i++) g.fillRect(bx + bs.motor[0] - i * 6 - Math.round(Game.t * 30) % 6, SURF - 1 + (i % 2), 4, 1); }
    Fishing.render(g, cam);
    drawWeatherFx(g, wx, SURF, dt); if (rid === 'sisli_kuzey' || season === 'winter') seasonFx(g, rid === 'sisli_kuzey' && season !== 'summer' ? 'winter' : season, dt, LH);
    drawText(g, REGION[rid].name + ' · ' + SPOTS[this.spotId()].name + (this.atSpot() ? '' : ' (yaklaşıyor)'), 8, 56, '#fff6e0', 1, '#1a1426');
    Fishing.renderHUD(g);
    if (this.arrive > 0) { g.globalAlpha = clamp(this.arrive - 0.5, 0, 1); g.fillStyle = '#100c18'; g.fillRect(0, 0, LW, LH); g.globalAlpha = 1; }
  }
};
/* ================= Home ================= */
Game.scenes.Home = {
  p: null, target: null, onArrive: null, near: null,
  enter(prm) { this.p = { x: prm.morning ? 470 : 242, dir: -1, walkT: 0, moving: false }; this.target = null; Sound.setScene('home'); this.near = null; UI.homeBar(this); if (prm.morning) UI.morning(); },
  input(dir) { this.move = dir; if (dir) { this.target = null; this.onArrive = null; } },
  walkTo(x, cb) { this.target = clamp(x, 30, 600); this.onArrive = cb; },
  act(id) {
    Sound.sfx('click');
    switch (id) {
      case 'bed': UI.confirmSleep(); break;
      case 'wardrobe': UI.openPanel('Wardrobe'); break;
      case 'chest': UI.openPanel('Inventory', { right: 'chest' }); break;
      case 'door': go('Town', { at: 'home' }); break;
      case 'trophy': UI.openPanel('Achievements'); break;
      case 'desk': UI.openPanel('Statistics'); break;
      case 'decor': UI.openPanel('Decor'); break;
    }
  },
  tap(x, y) {
    for (const k in DECOR_POS) { const [dx, dy] = DECOR_POS[k]; if (Math.abs(x - dx - 16) < 20 && Math.abs(y - dy - 16) < 20) { this.walkTo(dx + 16, () => this.act('decor')); return; } }
    for (const id in HOME_SPOTS) { const s = HOME_SPOTS[id]; if (Math.abs(x - s.x) < s.w / 2 + 6 && y > 90) { this.walkTo(s.x, () => this.act(id)); return; } }
    this.walkTo(x);
  },
  update(dt) {
    const p = this.p; let v = 0;
    if (this.move) v = this.move * 90; else if (this.target != null) { const d = this.target - p.x; if (Math.abs(d) < 3) { this.target = null; const cb = this.onArrive; this.onArrive = null; if (cb) cb(); } else v = Math.sign(d) * 100; }
    if (UI.modalOpen()) v = 0;
    p.moving = v !== 0; if (v) { p.dir = Math.sign(v); p.x = clamp(p.x + v * dt, 30, 610); p.walkT += dt; }
    let near = null; for (const id in HOME_SPOTS) if (Math.abs(p.x - HOME_SPOTS[id].x) < HOME_SPOTS[id].w / 2 + 10) near = id;
    if (near !== this.near) { this.near = near; UI.homeBar(this); }
  },
  render(g) {
    g.drawImage(homeArt(World.season()), 0, 0);
    g.globalAlpha = 0.12; g.fillStyle = '#fff2c0'; g.beginPath(); g.moveTo(444, 94); g.lineTo(516, 94); g.lineTo(420, 280); g.lineTo(300, 280); g.fill(); g.globalAlpha = 1;
    for (const k in DECOR_POS) { const id = S.home.decor[k]; const [x, y] = DECOR_POS[k]; if (id) g.drawImage(iconCanvas('decor_' + id), x, y, 32, 32); else { g.globalAlpha = 0.35 + Math.sin(Game.t * 3) * 0.1; g.strokeStyle = '#fff6e0'; g.setLineDash([2, 2]); g.strokeRect(x + 0.5, y + 0.5, 31, 31); g.setLineDash([]); g.globalAlpha = 1; } }
    const nAch = Object.keys(S.ach).length; for (let i = 0; i < Math.min(12, nAch); i++) g.drawImage(iconCanvas('trophy'), 306 + (i % 6) * 10, i < 6 ? 220 : 256 - 0, 10, 12);
    const p = this.p; const pose = p.moving ? 'walk' + (Math.floor(p.walkT * 8) % 4) : (Math.floor(Game.t * 1.2) % 2 ? 'idle0' : 'idle1');
    const sp = personSprite(S.player, pose, p.dir < 0); g.drawImage(sp, Math.round(p.x - CH_W), 272 - 60, CH_W * 2, CH_H * 2);
    if (this.near) { const s = HOME_SPOTS[this.near]; g.drawImage(iconCanvas(s.icon), s.x - 8, 120 + Math.round(Math.sin(Game.t * 5) * 2)); }
  }
};
/* ================= EndDay ================= */
const STARS = Array.from({ length: 90 }, (_, i) => [(i * 97) % 640, (i * 53) % 230, i % 3]);
Game.scenes.EndDay = {
  rep: null, enter(p) { this.rep = p.rep; Sound.setScene('home'); Sound.sfx('sleep'); UI.endDay(this.rep); },
  update() { },
  render(g) {
    const pb = Atlas.get('nightsky', () => { const p = new PB(LW, LH); bandGradient(p, 0, 0, LW, LH, [[0, '#0e0c24'], [0.6, '#2a2450'], [1, '#4a3a6a']]); return p; }); g.drawImage(pb, 0, 0);
    for (const [x, y, s] of STARS) { const tw = (Math.sin(Game.t * 2 + x) + 1) / 2; g.fillStyle = tw > 0.5 ? '#ffffff' : '#b8b8e8'; g.fillRect(x, y, s === 0 ? 2 : 1, s === 0 ? 2 : 1); }
    g.fillStyle = '#f6eec8'; g.beginPath(); g.arc(560, 60, 18, 0, Math.PI * 2); g.fill(); g.fillStyle = '#0e0c24'; g.beginPath(); g.arc(552, 54, 16, 0, Math.PI * 2); g.fill();
    const t = townArt(World.season()); g.globalAlpha = 0.55; g.drawImage(t.main, -20, 0); g.globalAlpha = 1; g.fillStyle = 'rgba(14,12,36,0.55)'; g.fillRect(0, 0, LW, LH);
    for (let i = 0; i < 3; i++) { g.fillStyle = '#f6d890'; g.fillRect(74 + i * 82, 238, 22, 18); }
  }
};
