/* =====================================================================
   10_v3_scenes.js : sahne entegrasyonu
   gün ışığı (sabah/gündüz/akşamüstü) gökyüzü-su-ışık katmanları · deniz canlısı animasyonları
   misafir NPC · çok duraklı deniz haritası · sefer bitişi ve raporu · filo tekne animasyonları
   ===================================================================== */
/* ---------- gün ışığı: mevcut çizimler korunur, ek palet + ışık katmanı ---------- */
{
  const _sky = drawSky, _water = drawWater, _surf = drawSurface, _tint = drawUnderTint, _wfx = drawWeatherFx;
  drawSky = function (g, key, pal, wx, h, cam) {
    const dp = Dayparts.scene(); if (dp === 'day') return _sky(g, key, pal, wx, h, cam);
    const sk = DP_SKY[dp].map((c, i) => mix(c, pal[i], 0.2));
    g.drawImage(skyCanvas(key + ':' + dp, sk, wx, h), 0, 0);
    if (wx !== 'rain' && wx !== 'fog') { const s = dpSun(dp); g.drawImage(s, Math.round((dp === 'morning' ? 96 : 500) - cam * 0.02), h - 40); }
    const n = wx === 'sunny' ? 3 : wx === 'wind' ? 5 : 7;
    for (let i = 0; i < n; i++) { const c = CLOUDS[i]; const sp = dpCloud(c.v, wx, dp); const W = 640 + 120; const x = ((c.x + Game.t * c.s * (wx === 'wind' ? 3 : 1) - cam * 0.06) % W + W) % W - 80; g.drawImage(sp, Math.round(x), c.y + (wx === 'rain' ? 0 : 6)); }
  };
  drawWater = function (g, key, pal, wx, surf, cam) {
    const dp = Dayparts.scene(); if (dp === 'day') return _water(g, key, pal, wx, surf, cam);
    _water(g, key + ':' + dp, dpPal(pal, dp), wx, surf, cam);
    if (wx !== 'rain' && wx !== 'fog') { const sx = (dp === 'morning' ? 113 : 517); g.fillStyle = dp === 'morning' ? '#ffe8b0' : '#ffb070'; for (let i = 0; i < 26; i++) { const y = surf + 2 + i * 2; const w = Math.max(2, 22 - i * 0.6); const ox = Math.sin(Game.t * 2 + i * 1.7) * 5; if ((i + Math.floor(Game.t * 4)) % 3) g.fillRect(Math.round(sx + ox - w / 2), y, Math.round(w), 1); } }
  };
  drawSurface = function (g, key, pal, surf, cam) { const dp = Dayparts.scene(); return dp === 'day' ? _surf(g, key, pal, surf, cam) : _surf(g, key + ':' + dp, dpPal(pal, dp), surf, cam); };
  drawUnderTint = function (g, pal, surf) {
    if (Wildlife.active && ['PierFishing', 'BoatFishing'].includes(Game.sceneName)) try { Wildlife.render(g, surf); } catch (e) { console.error(e); Wildlife.active = null; }
    const dp = Dayparts.scene(); return _tint(g, dp === 'day' ? pal : dpPal(pal, dp), surf);
  };
  drawWeatherFx = function (g, wx, surf, dt) {
    _wfx(g, wx, surf, dt);
    const dp = Dayparts.scene();
    if (Game.sceneName === 'PierFishing' && Game.scene.idx === 2 && Projects.done('lighthouse') && (dp === 'evening' || wx === 'fog')) {
      const lx = 80, ly = PIER_SURF - 25 - 5 - 62 - 5; const a = Game.t * 0.9;
      for (const off of [0, Math.PI]) { const an = a + off; if (Math.cos(an) < -0.1) continue; const L = 380; const w = 0.12;
        g.globalAlpha = 0.1 + 0.18 * Math.max(0, Math.cos(an)); g.fillStyle = '#fff4c0'; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + Math.cos(an - w) * L, ly + Math.sin(an - w) * L * 0.25); g.lineTo(lx + Math.cos(an + w) * L, ly + Math.sin(an + w) * L * 0.25); g.closePath(); g.fill(); }
      g.globalAlpha = 0.35 + Math.sin(Game.t * 4) * 0.1; g.fillStyle = '#fff8c0'; g.fillRect(lx - 6, ly - 4, 12, 8); g.globalAlpha = 1;
    }
    if (dp !== 'day') { g.fillStyle = DP_GRADE[dp]; g.fillRect(0, 0, LW, LH); if (dp === 'evening') { g.fillStyle = 'rgba(60,40,110,0.10)'; g.fillRect(0, 0, LW, 70); } }
  };
}
/* ---------- deniz canlısı animasyonları (ekran koordinatında, balık tutmayı durdurmaz) ---------- */
Wildlife.render = function (g, surf) {
  const a = this.active; if (!a) return; const w = WILD[a.id]; if (!w) return; const t = a.t, dir = a.dir; const f = Math.floor(Game.t * 5) % 2;
  const spr = (ff) => dir > 0 ? wildSprite(a.id, ff) : wildSpriteR(a.id, ff);
  const fade = clamp(Math.min(t / 0.4, (6 - t) / 0.6), 0, 1); g.globalAlpha = fade;
  const above = fn => { g.save(); g.beginPath(); g.rect(0, 0, LW, surf + 1); g.clip(); fn(); g.restore(); };
  switch (w.kind) {
    case 'sky': { const sp = spr(f); const x = dir > 0 ? -30 + t * 115 : 670 - t * 115; g.drawImage(sp, Math.round(x), Math.round(46 + Math.sin(t * 2) * 6)); if (a.id === 'puffin' || a.id === 'gumus_marti') { const sp2 = spr(1 - f); g.drawImage(sp2, Math.round(x - dir * 22), Math.round(58 + Math.sin(t * 2 + 1) * 5)); } break; }
    case 'dive': { const sp = spr(f); if (t < 2.6) { const x = dir > 0 ? -30 + t * 150 : 670 - t * 150; g.drawImage(sp, Math.round(x), 52); a.dx = x; } else if (t < 3.1) { const k = (t - 2.6) / 0.5; g.drawImage(spr(0), Math.round(a.dx + dir * k * 20), Math.round(lerp(52, surf - 4, k))); } else if (t < 4.2) { const k = (t - 3.1) / 1.1; g.fillStyle = '#ffffff'; for (let i = 0; i < 8; i++) g.fillRect(Math.round(a.dx + dir * 20 + Math.cos(i) * k * 14), Math.round(surf - 2 - Math.sin(i * 1.3) * (1 - k) * 12), 1, 1); } else { const sp2 = spr(1); above(() => g.drawImage(sp2, Math.round(a.dx + dir * 40), Math.round(surf - 6))); } break; }
    case 'crab': { const sp = spr(Math.floor(t * 6) % 2); const x = dir > 0 ? 20 + t * 14 : 600 - t * 14; g.drawImage(sp, Math.round(x), LH - 14); break; }
    case 'wade': { const sp = spr(Math.floor(t * 0.8) % 2); g.fillStyle = '#7a7268'; g.fillRect(14, surf - 4, 26, 6); g.fillStyle = '#9a948a'; g.fillRect(16, surf - 5, 20, 2); g.drawImage(sp, 20, surf - 27); break; }
    case 'surface': { const x = dir > 0 ? 400 : 230; const up = t > 0.6 && t < 5.2; if (up) { const sp = spr(Math.floor(t * 1.2) % 2); above(() => g.drawImage(sp, Math.round(x - sp.width / 2), Math.round(surf - sp.height * 0.55 + Math.sin(t * 2) * 1))); } g.globalAlpha = fade * 0.7; pxEllipse(g, x, surf + 1, 6 + (t * 6) % 10, 2, '#e8f8ff'); break; }
    case 'under': { const sp = spr(Math.floor(t * 1.5) % 2); const x = dir > 0 ? 120 + t * 22 : 520 - t * 22; g.globalAlpha = fade * 0.9; g.drawImage(sp, Math.round(x), Math.round(surf + 34 + Math.sin(t * 1.4) * 6)); break; }
    case 'bed': { const sp = spr(f); g.drawImage(sp, Math.round(dir > 0 ? 360 + t * 3 : 300 - t * 3), LH - 18); break; }
    case 'leap': { for (let j = 0; j < 2; j++) { const tt = t - j * 0.45; if (tt < 0) continue; const ph = (tt % 1.7) / 1.7; const x = dir > 0 ? 120 + tt * 70 + j * 18 : 560 - tt * 70 - j * 18; const y = surf + 2 - Math.sin(ph * Math.PI) * 26; const sp = spr(ph > 0.5 ? 1 : 0); above(() => g.drawImage(sp, Math.round(x), Math.round(y - sp.height / 2))); if (ph > 0.92 || ph < 0.06) { g.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) g.fillRect(Math.round(x + i * 3), surf - 1 - (i % 2), 1, 1); } } break; }
    case 'fin': { const sp = spr(f); const x = dir > 0 ? -40 + t * 90 : 660 - t * 90; above(() => g.drawImage(sp, Math.round(x), Math.round(surf - sp.height * 0.55))); g.fillStyle = '#e8f8ff'; g.fillRect(Math.round(x + (dir > 0 ? 0 : sp.width)), surf, 6, 1); break; }
    case 'spout': { const sp = wildSprite(a.id, Math.floor(t * 0.9) % 2); g.globalAlpha = fade * 0.85; above(() => g.drawImage(sp, dir > 0 ? 470 : 140, surf - 14)); break; }
    case 'skim': { for (let j = 0; j < 5; j++) { const x = dir > 0 ? -20 + t * 130 + j * 14 : 660 - t * 130 - j * 14; const y = surf - 6 - Math.abs(Math.sin(t * 3 + j)) * 6 - j % 2 * 3; g.drawImage(spr((j + f) % 2), Math.round(x), Math.round(y)); } break; }
  }
  g.globalAlpha = 1;
};
/* ---------- misafir konuşma balonu (teknede) ---------- */
function v3BoatOverlay(g, px, py) {
  const b = Guests.bubble; if (!b || !S.trip || !S.trip.guest) return;
  const words = b.text.split(' '); const lines = []; let cur = ''; for (const w of words) { if ((cur + ' ' + w).length > 30) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } lines.push(cur);
  const W = Math.max(...lines.map(l => textWidth(l))) + 10, H = lines.length * 8 + 6; const x = clamp(Math.round(px - 15 - W / 2), 4, LW - W - 4), y = Math.max(70, py - 44 - H);
  g.globalAlpha = clamp(Math.min(b.t / 0.3, (b.life - b.t) / 0.4), 0, 1);
  g.fillStyle = '#3a2414'; g.fillRect(x - 1, y - 1, W + 2, H + 2); g.fillStyle = '#fff8e8'; g.fillRect(x, y, W, H); g.fillStyle = '#fff8e8'; g.fillRect(Math.round(px - 16), y + H, 3, 3);
  lines.forEach((l, i) => drawText(g, l, x + 5, y + 4 + i * 8, '#3a2414')); g.globalAlpha = 1;
}
/* ---------- av sahneleri ---------- */
{
  const PF = Game.scenes.PierFishing, BF = Game.scenes.BoatFishing;
  const _pu = PF.update.bind(PF); PF.update = function (dt) { Wildlife.update(dt); _pu(dt); };
  const _pe = PF.enter.bind(PF); PF.enter = function (p) { Wildlife.active = null; _pe(p); };
  const _be = BF.enter.bind(BF);
  BF.enter = function (p) {
    Wildlife.active = null; Guests.bubble = null; _be(p); if (Game.sceneName !== 'BoatFishing') return;
    if (S.trip) Trips.onSpot(S.spotId);
    this.guestT = 0; this.guestSaid = {};
    if (p.arrive && S.trip) { Wildlife.trigger(this.rid, 'arr:' + S.trip.id + ':' + this.rid, 0.3); if (S.trip.guest) { Guests.say(S.trip.stops.length === 1 ? 'greet' : 'region', this.rid); this.guestSaid.greet = true; } }
  };
  const _bu = BF.update.bind(BF);
  BF.update = function (dt) {
    Wildlife.update(dt); Guests.update(dt); _bu(dt);
    if (S.trip && S.trip.guest) { this.guestT = (this.guestT || 0) + dt; const sd = this.guestSaid || (this.guestSaid = {});
      if (!sd.region && this.guestT > 9 && !Guests.bubble) { sd.region = true; Guests.say('region', this.rid); }
      else if (!sd.weather && this.guestT > 26 && !Guests.bubble) { sd.weather = true; Guests.say('weather', S.world.weather[this.rid]); } }
  };
}
{ const _vs = visitSpot; visitSpot = function (id) { _vs(id); if (S && S.trip && Game.sceneName === 'BoatFishing') Trips.onSpot(id); }; }

/* ---------- deniz haritası: ilk çıkış + seferde ikinci durak ---------- */
{
  const SM = Game.scenes.SeaMap;
  const _enter = SM.enter.bind(SM);
  SM.enter = function (p) {
    this.leg = !!S.trip; this.from = this.leg ? Trips.cur() : 'sakin_liman';
    _enter(p);
    if (this.leg) { const cand = REGIONS.find(r => r.id !== this.from && !S.trip.stops.includes(r.id) && Boats.reach(r.id, S.trip.boat).ok); this.sel = cand ? cand.id : this.from; UI.mapPanel(this); }
  };
  SM.depart = function () {
    if (this.travel) return; const rid = this.sel;
    if (this.leg) { const r = Trips.addStop(rid); if (!r.ok) { UI.toastNow(r.msg, 'warn'); return; } Sound.sfx('horn'); this.travel = { t: 0, rid, from: this.from }; UI.mapPanel(this); return; }
    const R = REGION[rid]; const bid = S.boats.active;
    if (Fleet.onMission(bid)) { UI.toastNow('Aktif tekne filo görevinde.', 'warn'); return; }
    const re = Boats.reach(rid, bid); if (!re.ok) { UI.toastNow('Bu bölge için eksik: ' + re.miss.join(', '), 'warn'); return; }
    const r = Tx.run('trip', () => {
      if (S.cash < R.trip_fuel_cost) return { ok: false, msg: 'Yakıt için paran yetmiyor (' + R.trip_fuel_cost + ').' };
      if (R.trip_fuel_cost) spend(R.trip_fuel_cost, 'fuel'); S.stats.fuelSpent += R.trip_fuel_cost; S.stats.trips++;
      S.regionId = rid; S.spotId = R.spot_ids[0]; S.scene = 'BoatFishing'; S.stats.regionsVisited[rid] = true;
      Trips.begin(rid, R.trip_fuel_cost); return { ok: true };
    });
    if (!r.ok) { UI.toastNow(r.msg, 'warn'); return; }
    Sound.sfx('horn'); this.travel = { t: 0, rid, from: 'sakin_liman' }; UI.mapPanel(this);
  };
  SM.render = function (g) {
    g.drawImage(mapArt(), 0, 0);
    const home = MAP_POS.sakin_liman;
    for (const r of REGIONS) {
      if (r.id === 'sakin_liman') continue; const [x, y] = MAP_POS[r.id]; const un = S.world.unlocked[r.id];
      g.fillStyle = un ? '#5a3a1e' : 'rgba(90,58,30,0.35)'; const n = Math.ceil(Math.hypot(x - home[0], y - home[1]) / 6);
      for (let i = 1; i < n; i += 2) { const t = i / n; g.fillRect(Math.round(lerp(home[0], x, t)), Math.round(lerp(home[1], y, t) - Math.sin(t * Math.PI) * 14), 2, 2); }
    }
    const pts = [home].concat((S.trip ? S.trip.stops : []).map(r => MAP_POS[r])); if (!this.travel && this.sel && this.sel !== (pts.length > 1 ? (S.trip.stops[S.trip.stops.length - 1]) : 'sakin_liman')) pts.push(MAP_POS[this.sel]);
    for (let s = 1; s < pts.length; s++) { const [ax, ay] = pts[s - 1], [bx2, by2] = pts[s]; const n = Math.ceil(Math.hypot(bx2 - ax, by2 - ay) / 4); for (let i = 0; i < n; i++) { if ((i + Math.floor(Game.t * 8)) % 3 === 0) continue; const t = i / n; g.fillStyle = s === pts.length - 1 && !(S.trip && s <= S.trip.stops.length) ? '#e8483a' : '#c4473f'; g.fillRect(Math.round(lerp(ax, bx2, t)), Math.round(lerp(ay, by2, t) - Math.sin(t * Math.PI) * 10), 2, 2); } }
    for (const r of REGIONS) {
      const [x, y] = MAP_POS[r.id]; const un = S.world.unlocked[r.id]; const sel = this.sel === r.id; const visited = S.trip && S.trip.stops.includes(r.id);
      g.fillStyle = '#3a2414'; g.fillRect(x - 9, y - 9, 18, 18); g.fillStyle = sel ? '#ffe08a' : visited ? '#c8ffb0' : (un ? '#f6ecd2' : '#b8a888'); g.fillRect(x - 8, y - 8, 16, 16);
      g.drawImage(iconCanvas(un ? (r.id === 'sakin_liman' ? 'home' : 'anchor') : 'lock'), x - 8, y - 8);
      g.drawImage(iconCanvas(S.world.weather[r.id]), x + 8, y - 22);
      const nm = r.name; g.fillStyle = 'rgba(246,236,210,0.85)'; g.fillRect(x - textWidth(nm) / 2 - 2, y + 11, textWidth(nm) + 4, 8); drawText(g, nm, Math.round(x - textWidth(nm) / 2), y + 12, '#3a2414');
      if (sel) { const k = Math.floor(Game.t * 4) % 2; g.fillStyle = '#c4473f'; g.fillRect(x - 12 - k, y - 12 - k, 4, 1); g.fillRect(x - 12 - k, y - 12 - k, 1, 4); g.fillRect(x + 9 + k, y - 12 - k, 4, 1); g.fillRect(x + 12 + k, y - 12 - k, 1, 4); g.fillRect(x - 12 - k, y + 12 + k, 4, 1); g.fillRect(x - 12 - k, y + 9 + k, 1, 4); g.fillRect(x + 9 + k, y + 12 + k, 4, 1); g.fillRect(x + 12 + k, y + 9 + k, 1, 4); }
    }
    const from = MAP_POS[this.travel ? this.travel.from || 'sakin_liman' : (this.leg ? this.from : 'sakin_liman')]; let bx = from[0], by = from[1] + 14;
    if (this.travel) { const [x, y] = MAP_POS[this.travel.rid]; const t = clamp(this.travel.t / 1.5, 0, 1); bx = lerp(from[0], x, t); by = lerp(from[1], y, t) - Math.sin(t * Math.PI) * 14; for (let i = 0; i < 6; i++) { const tt = Math.max(0, t - i * 0.03); g.fillStyle = 'rgba(255,255,255,' + (0.6 - i * 0.1) + ')'; g.fillRect(Math.round(lerp(from[0], x, tt)) - 1, Math.round(lerp(from[1], y, tt) - Math.sin(tt * Math.PI) * 14) + 4, 2, 1); } }
    g.drawImage(iconCanvas('boat'), Math.round(bx - 8), Math.round(by - 10 + Math.sin(Game.t * 3)));
    if (this.leg) drawText(g, 'SEFER: ' + S.trip.stops.map(r => REGION[r].name).join(' > ') + ' > ?', 8, 340, '#3a2414');
  };
}

/* ---------- sahne geçişi: limana dönüşte sefer biter ve rapor gösterilir ---------- */
{
  const _go = go;
  go = function (name, params) {
    let rep = null;
    if (S && S.trip && !['BoatFishing', 'SeaMap', 'MainMenu'].includes(name)) rep = Trips.end();
    _go(name, params);
    if (rep && !QA.silent) { UI.showTripReport(rep); if (rep.guest) UI.toastNow(NPCS[rep.guest].name + ': “' + V3.guestLines.farewell + '”', 'info', 'guest'); }
  };
}

/* ---------- kasaba: proje açılışı, filo tekneleri, dönüş bildirimi, seyir terası ---------- */
{
  const T = Game.scenes.Town;
  const _te = T.enter.bind(T);
  T.enter = function (p) {
    _te(p);
    for (const m of S.fleet.missions) if (m.status === 'back' && !m.arrAnim) { m.arrAnim = true; Fleet.anim = { bid: m.boat, kind: 'arrive', t: Game.t }; }
    if (!QA.silent) setTimeout(() => { if (Game.sceneName === 'Town' && !UI.modal) UI.showFleetReturns(); }, 400);
  };
  const _tr = T.render.bind(T);
  T.render = function (g, dt) { _tr(g, dt); drawProjectFx(g); };
}
Object.assign(Fleet, {
  boatOx(bid) { const a = this.anim; if (!a || a.bid !== bid || a.kind !== 'arrive') return 0; const k = (Game.t - a.t) / 3; if (k >= 1 || k < 0) { return 0; } return Math.round((1 - k) * (1 - k) * 360); },
  renderLeave(g, cam, mx) {
    const a = this.anim; if (!a || a.kind !== 'leave' || !Boats.owned(a.bid)) return; const k = (Game.t - a.t) / 3.2; if (k >= 1 || k < 0) { if (k >= 1) this.anim = null; return; }
    const bs = boatSprite(a.bid); const bx = Math.round(mx - cam + k * k * 420), by = Math.round(300 - bs.water + 6 + Math.sin(Game.t * 2) * 1.2);
    g.drawImage(bs.back, bx, by); g.drawImage(bs.front, bx, by); g.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 6; i++) g.fillRect(bx + bs.motor[0] - i * 6, 305 + (i % 2), 4, 1);
  }
});
/* seyir terası tamamlandığında bazı günler bir kasabalı oradan manzarayı izler (dükkânlar etkilenmez) */
V2.slots.terrace = 2872;
{
  const _place = Routine.place.bind(Routine);
  Routine.place = function (npc) {
    const p = _place(npc);
    if (Projects.done('terrace') && !World.festival() && ['elif', 'mert', 'ali'].includes(npc)) { const who = ['elif', 'mert', 'ali'][S.day % 3]; if (who === npc && hrand('terr', S.day) < 0.45) return 'terrace'; }
    return p;
  };
  const _where = Routine.where.bind(Routine);
  Routine.where = function (npc) { return this.place(npc) === 'terrace' ? 'Seyir terasında' : _where(npc); };
}
