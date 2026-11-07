/* =====================================================================
   10_v4_scenes.js : Kıyı Keşfi sahnesi (Kumluk Sahil / Kayalık Kıyı / Gelgit Havuzları),
   Dürbünle Gözlem (teknede), kasaba girişleri (Birlik panosu, Sahil Patikası), olta süsü, nokta ziyaretleri
   ===================================================================== */
TOWN_DOORS.push({ id: 'guild', x: 1626, name: 'Balıkçı Birliği Panosu', icon: 'guild' }, { id: 'beach', x: 2372, name: 'Sahil Patikası · Kıyı Keşfi', icon: 'shore' });
{
  const T = Game.scenes.Town; const _int = T.interact.bind(T);
  T.interact = function (d) {
    d = d || this.near; if (!d) return;
    if (d.id === 'guild') { Sound.sfx('door'); if (!Guild.open()) { UI.toastNow('Balıkçı Birliği 3. oyun gününde açılır.', 'info', 'guild'); return; } UI.openPanel('Guild'); return; }
    if (d.id === 'beach') { Sound.sfx('door'); UI.A.beachOpen.call(UI); return; }
    return _int(d);
  };
}
/* nokta ziyaretleri: Birlik B01 (bir seferde/iskele gününde 2 farklı nokta) ve Bora'nın hikâyesi */
{
  const _vs = visitSpot;
  visitSpot = function (id) {
    _vs(id); if (!S || !S.v4) return;
    const key = S.trip ? 't' + S.trip.id : 'p' + S.day; const gs = S.v4.spotSess && S.v4.spotSess.key === key ? S.v4.spotSess : (S.v4.spotSess = { key, spots: [] });
    if (!gs.spots.includes(id)) gs.spots.push(id); Guild.ev('spots2', { n: gs.spots.length }); Stories.onSpot(id); Save.soon();
  };
}
/* olta süsü (Sinarit trofesi) */
{
  const _dr = drawRod;
  drawRod = function (g, hx, hy, pose, tension, rodId, flip) {
    const tip = _dr(g, hx, hy, pose, tension, rodId, flip);
    if (!flip && S && S.cosmetics && S.cosmetics.charm) { const x = Math.round(hx) + 2, y = Math.round(hy) + 6 + Math.round(Math.sin(Game.t * 4)); g.fillStyle = '#c8a040'; g.fillRect(x, y - 2, 1, 2); g.fillStyle = '#e8643a'; g.fillRect(x - 1, y, 3, 2); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y, 1, 1); }
    return tip;
  };
}

/* ================= Kıyı Keşfi ================= */
Game.scenes.Shore = {
  env: 'sand', t: 0, anims: [], lift: {},
  enter() { const s = Shore.session(); if (!s) { go('Town', { at: 'beach' }); return; } this.env = s.env; this.t = 0; this.anims = []; this.lift = {}; Sound.setScene('pier', S.world.weather.sakin_liman); UI.shoreBar(this); },
  update(dt) { this.t += dt; this.anims = this.anims.filter(a => (a.t += dt) < a.life); for (const k in this.lift) this.lift[k] = Math.min(1, this.lift[k] + dt * 3); },
  /* gelgit: su ~7 saniyede bir çekilir; görünme penceresi yaklaşık 3 saniye (dar zamanlama yok) */
  level() { return 0.5 + 0.5 * Math.sin(this.t * 2 * Math.PI / 7); },
  low() { return this.level() < 0.45; },
  spotAt(x, y) { let best = -1, bd = 34; SHORE_POS[this.env].forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = i; } }); return best; },
  tap(x, y) {
    const s = Shore.session(); if (!s || s.done) return; const i = this.spotAt(x, y); if (i < 0) return; const sp = s.spots[i];
    if (sp.tapped) { UI.toastNow('Burayı zaten inceledin.', 'info', 'inspect'); return; }
    if (this.env === 'tide' && !this.low()) { UI.toastNow('Su yüksek; havuz çekilince nesneler görünür. Acele yok, su yine çekilecek.', 'info', 'shore'); return; }
    const r = Shore.pick(i); if (!r.ok) return; Sound.sfx(this.env === 'rocks' ? 'door' : 'splash'); this.lift[i] = 0;
    const [px, py] = SHORE_POS[this.env][i];
    if (r.item) { this.anims.push({ kind: 'found', id: r.item, x: px, y: py, t: 0, life: 2.2 }); Sound.sfx('coin'); UI.toastNow('Buldun: ' + SHORE[r.item].name + (S.shore.items[r.item] && S.shore.items[r.item].n === 1 && s.done ? ' (yeni!)' : ''), 'good', 'shore'); }
    else { this.anims.push({ kind: 'empty', x: px, y: py, t: 0, life: 1.2 }); UI.toastNow(this.env === 'rocks' ? 'Kayanın altından küçük bir yengeç kaçtı; burada bir şey yok.' : this.env === 'tide' ? 'Bu yalnızca sıradan bir çakıl.' : 'Burada yalnızca kum var. Başka bir ipucuna bak!', 'info', 'inspect'); }
    if (r.done) setTimeout(() => { if (Game.sceneName === 'Shore') UI.shoreResult(); }, 900);
    UI.shoreBar(this);
  },
  render(g, dt) {
    const s = Shore.session() || S.shore.session; const env = this.env; g.drawImage(shoreArt(env, World.season()), 0, 0);
    for (let i = 0; i < 3; i++) { const x = ((Game.t * (18 + i * 6) + i * 230) % 760) - 60; g.drawImage(Atlas.get('gull' + (Math.floor(Game.t * 4 + i) % 3), () => gullPB(Math.floor(Game.t * 4 + i) % 3)), Math.round(x), 50 + i * 16); }
    const P = SHORE_POS[env]; const hints = s ? s.hints : 0; const t = this.t;
    if (!s) return;
    s.spots.forEach((sp, i) => {
      const [x, y] = P[i]; const strong = sp.item ? (hints >= 1 ? 1 : 0.6) : sp.decoy ? 0.35 : 0;
      if (env === 'sand') {
        if (sp.tapped) { g.fillStyle = '#c8a868'; g.beginPath(); g.ellipse(x, y, 12, 5, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#a88848'; g.beginPath(); g.ellipse(x, y + 1, 8, 3, 0, 0, Math.PI * 2); g.fill(); return; }
        g.fillStyle = 'rgba(150,110,50,0.35)'; g.beginPath(); g.ellipse(x, y + 3, 11, 4, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e4c888'; g.beginPath(); g.ellipse(x, y + 1, 8, 3, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff0c8'; g.fillRect(x - 3, y - 1, 4, 1);
        if (strong) { g.globalAlpha = Math.min(1, strong + 0.25); const c = sp.clue;
          if (c === 'color') { g.fillStyle = '#c89a58'; g.beginPath(); g.ellipse(x, y + 1, 12, 5, 0, 0, Math.PI * 2); g.fill(); }
          if (c === 'glint' && Math.floor(t * 3 + i) % 3 !== 2) { g.fillStyle = '#ffffff'; g.fillRect(x + 2, y - 4, 1, 7); g.fillRect(x - 1, y - 1, 7, 1); }
          if (c === 'wave') { g.fillStyle = '#a89060'; for (let k = -12; k <= 12; k++) g.fillRect(x + k, Math.round(y + 4 + Math.sin(k * 0.5) * 1.5), 1, 1); }
          if (c === 'stones') { g.fillStyle = '#6a645a'; for (let k = 0; k < 3; k++) g.fillRect(x - 7 + k * 6, y - 4 + k, 3, 2); }
          g.globalAlpha = 1; }
      } else if (env === 'rocks') {
        const lk = sp.tapped ? (this.lift[i] != null ? this.lift[i] : 1) : 0; const rk = Atlas.get('shrock' + (i % 4), () => rockPB(i % 4));
        if (sp.tapped) { g.fillStyle = '#7a7266'; g.beginPath(); g.ellipse(x, y + 4, 16, 5, 0, 0, Math.PI * 2); g.fill(); }
        g.globalAlpha = 1 - lk * 0.6; g.drawImage(rk, Math.round(x - 21), Math.round(y - 13 - lk * 22)); g.globalAlpha = 1;
        if (!sp.tapped && strong) { for (let k = 0; k < 4; k++) { const ph = (t * (0.7 + k * 0.1) + k * 0.3 + i) % 1.4; if (ph > 1 * strong + 0.2) continue; g.fillStyle = '#e8f8ff'; g.fillRect(Math.round(x + 18 + Math.sin(k + t) * 2), Math.round(y + 4 - ph * 16), 1, 1); } if (sp.item) { g.fillStyle = '#7a7266'; for (let k = 0; k < 4; k++) g.fillRect(x - 30 - k * 7, y + 8 + (k % 2), 2, 1); } }
      } else {
        const low = this.low(); g.fillStyle = '#5fa8b8'; g.beginPath(); g.ellipse(x, y, 30, 12, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#8ac8d8'; g.beginPath(); g.ellipse(x, y - 2, 26, 8, 0, 0, Math.PI * 2); g.fill();
        if (low && !sp.tapped) { if (sp.item) { const sh = shoreSprite(sp.item); g.globalAlpha = 0.6 + 0.4 * strong; g.drawImage(sh, x - 6, y - 7); g.globalAlpha = 1; if (Math.floor(t * 4 + i) % 3 === 0) { g.fillStyle = '#ffffff'; g.fillRect(x + 5, y - 7, 1, 1); } } else g.drawImage(shoreSprite('cakil'), x - 6, y - 6); }
      }
      if (hints >= 2 && sp.item && !sp.tapped) { const by = y - 30 + Math.sin(t * 5) * 3; g.fillStyle = '#ffe070'; g.fillRect(x - 1, by - 6, 3, 6); g.beginPath(); g.moveTo(x - 4, by); g.lineTo(x + 5, by); g.lineTo(x + 0.5, by + 5); g.fill(); }
    });
    if (env === 'tide') { const lv = this.level(); g.globalAlpha = 0.18 + lv * 0.5; g.fillStyle = '#3aa4bc'; const top = 182 + Math.round((1 - lv) * 140); g.fillRect(0, top, LW, LH - top); g.globalAlpha = 1; g.fillStyle = '#ffffff'; for (let x = 0; x < LW; x += 3) g.fillRect(x, top + Math.round(Math.sin(x * 0.08 + Game.t * 2) * 1.5), 2, 1); }
    for (const a of this.anims) { const k = a.t / a.life; if (a.kind === 'found') { const sh = shoreSprite(a.id); const yy = a.y - 10 - Math.min(1, k * 3) * 28; g.drawImage(sh, a.x - 12, yy - 12, 24, 24); if (k < 0.6) { g.fillStyle = '#ffe070'; for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; g.fillRect(Math.round(a.x + Math.cos(an) * (8 + k * 30)), Math.round(yy + Math.sin(an) * (8 + k * 30)), 2, 2); } } } else { g.fillStyle = '#e8d8b0'; for (let i = 0; i < 6; i++) g.fillRect(Math.round(a.x - 8 + i * 3), Math.round(a.y - 4 - Math.sin(k * Math.PI) * (6 + i % 3 * 3)), 2, 2); } }
    drawText(g, upTR(V4.shoreEnv[env].name) + ' · BULUNAN ' + s.found.length + '/' + s.spots.filter(x => x.item).length + (env === 'tide' ? (this.low() ? ' · SU ÇEKİLDİ' : ' · SU YÜKSEK') : ''), 8, 56, '#fff6e0', 1, '#1a1426');
  }
};

/* ================= Dürbünle Gözlem (teknede) ================= */
const binocMask = () => Atlas.get('binocmask', () => { const [c, x] = mkCanvas(LW, LH); x.fillStyle = '#0e0c18'; x.fillRect(0, 0, LW, LH); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(252, 172, 120, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(388, 172, 120, 0, Math.PI * 2); x.fill(); x.globalCompositeOperation = 'source-over'; x.strokeStyle = '#2a2a34'; x.lineWidth = 6; x.beginPath(); x.arc(252, 172, 121, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(388, 172, 121, 0, Math.PI * 2); x.stroke(); return c; });
{
  const BF = Game.scenes.BoatFishing;
  const _en = BF.enter.bind(BF);
  BF.enter = function (p) { this.bin = null; _en(p); if (S.trip && S.trip.binoc && S.trip.binoc.state === 'on') Binoc.finish(null); };
  const _ex = BF.exit.bind(BF); BF.exit = function () { if (this.bin) { Binoc.finish(null); this.bin = null; } _ex(); };
  BF.startBinoc = function () { const r = Binoc.start(); if (!r.ok) { UI.toastNow(r.msg, 'warn', 'binoc'); return; } this.bin = { pan: 0, t: 0, focus: 0, found: null, ft: 0 }; this.move = 0; this.target = null; Sound.sfx('click'); UI.fishBar(this); };
  BF.endBinoc = function (id) { const b = this.bin; if (!b || b.ending) return; b.ending = true; const res = Binoc.finish(id); b.res = res; if (id) { b.found = id; b.ft = 0; } else { this.bin = null; UI.fishBar(this); UI.toastNow('Dürbün indirildi. Bu seferde ufuk sakindi; ' + (res ? 'etkinlik tamamlandı.' : ''), 'info', 'binoc'); } };
  const _in = BF.input.bind(BF);
  BF.input = function (dir) { if (this.bin) { this.binMove = dir; return; } return _in(dir); };
  const _tap = BF.tap.bind(BF);
  BF.tap = function (x, y) { if (this.bin) { this.bin.pan = clamp(this.bin.pan + (x - 320) / 320 * 0.35, -1, 1); return; } return _tap(x, y); };
  const _up = BF.update.bind(BF);
  BF.update = function (dt) {
    const b = this.bin; if (b) { this.move = 0; this.target = null; }
    _up(dt);
    if (!b) return;
    if (b.found) { b.ft += dt; if (b.ft > 2.6) { const res = b.res; this.bin = null; UI.fishBar(this); if (res) UI.toastNow(res.capped ? WILD[res.id].name + ' gözlendi; bugünkü gözlem sınırı (4) dolduğu için deftere yeni kayıt eklenmedi.' : (res.isNew ? 'Yeni gözlem: ' : 'Gözlem: ') + WILD[res.id].name + ' (' + Wildlife.count() + '/' + V3.wildlife.length + ')', res.isNew ? 'good' : 'info', 'binoc'); } return; }
    b.t += dt; b.pan = clamp(b.pan + (this.binMove || 0) * 0.55 * dt, -1, 1);
    const tg = this.binTarget(); if (tg) { const sx = 320 + (tg.x - b.pan) * 600; if (Math.abs(sx - 320) < 60) b.focus += dt; else b.focus = Math.max(0, b.focus - dt * 0.5); if (b.focus >= Binoc.FOCUS) this.endBinoc(tg.id); } else b.focus = Math.max(0, b.focus - dt);
    if (b.t >= Binoc.DUR && !b.ending) this.endBinoc(null);
  };
  BF.binTarget = function () { const b = this.bin; const bt = S.trip && S.trip.binoc; if (!b || !bt || !bt.targets) return null; return bt.targets.find(x => b.t >= x.t0 && b.t < x.t0 + x.life) || null; };
  const _rn = BF.render.bind(BF);
  BF.render = function (g, dt) {
    _rn(g, dt); const b = this.bin; if (!b) return;
    const rid = this.rid, pal = REGION_PAL[rid], wx = S.world.weather[rid]; const art = regionArt(rid, World.season());
    g.save(); g.beginPath(); g.arc(252, 172, 120, 0, Math.PI * 2); g.arc(388, 172, 120, 0, Math.PI * 2); g.clip();
    g.drawImage(skyCanvas(rid, pal.sky, wx, 230), 0, 0); const off = (b.pan + 1) * 0.5 * Math.max(0, art.far.width - 320);
    g.drawImage(art.far, Math.round(off), 70, 320, 150, 0, 40, 640, 300);
    g.fillStyle = tint(pal.sea[0], wx); g.fillRect(0, 226, LW, LH - 226); g.fillStyle = '#e8f8ff'; for (let x = 0; x < LW; x += 9) g.fillRect(x + Math.round(Math.sin(Game.t + x) * 3), 230 + (x * 7) % 90, 5, 1);
    const tg = b.found ? (S.trip.binoc.targets.find(x => x.id === b.found) || null) : this.binTarget();
    if (tg) { const w = WILD[tg.id]; const sx = 320 + (tg.x - b.pan) * 600; const lt = b.found ? b.ft + 2 : b.t - tg.t0; const f = Math.floor(Game.t * 4) % 2; const sp = wildSprite(tg.id, f); const sc = 2;
      let y = 228 - sp.height * sc * 0.6; if (w.kind === 'sky' || w.kind === 'dive') y = 120 + Math.sin(lt * 2) * 10; if (w.kind === 'leap') y = 230 - Math.abs(Math.sin(lt * 1.6)) * 40 - sp.height; if (w.kind === 'under' || w.kind === 'bed') y = 236; if (w.kind === 'crab' || w.kind === 'wade') y = 200;
      const fade = clamp(Math.min(lt / 0.6, (tg.life - lt) / 0.6), 0.25, 1); g.globalAlpha = b.found ? 1 : fade; g.drawImage(sp, Math.round(sx - sp.width * sc / 2), Math.round(y), sp.width * sc, sp.height * sc); g.globalAlpha = 1; }
    g.restore();
    g.drawImage(binocMask(), 0, 0);
    g.strokeStyle = 'rgba(232,248,255,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(320, 132); g.lineTo(320, 212); g.moveTo(280, 172); g.lineTo(360, 172); g.stroke();
    if (b.focus > 0 && !b.found) { g.strokeStyle = '#ffe070'; g.lineWidth = 2; g.beginPath(); g.arc(320, 172, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, b.focus / Binoc.FOCUS)); g.stroke(); }
    const msg = b.found ? 'ODAKLANDI: ' + upTR(WILD[b.found].name) + '!' : 'DÜRBÜN · ◀ ▶ İLE TARA · İŞARETİ ORTAYA AL · ' + Math.max(0, Math.ceil(Binoc.DUR - b.t)) + ' SN';
    g.fillStyle = 'rgba(20,14,26,0.8)'; g.fillRect(320 - textWidth(msg) / 2 - 6, 318, textWidth(msg) + 12, 12); drawText(g, msg, Math.round(320 - textWidth(msg) / 2), 321, b.found ? '#ffe070' : '#e8f4ff');
    if (tg && !b.found) { const sx = 320 + (tg.x - b.pan) * 600; if (sx < 140 || sx > 500) { g.fillStyle = '#ffe070'; const ax = sx < 140 ? 136 : 498; g.fillRect(ax, 170, 6, 4); drawText(g, sx < 140 ? '<' : '>', ax + (sx < 140 ? -8 : 8), 169, '#ffe070'); } }
  };
  const _cc = Fishing.canCast.bind(Fishing);
  Fishing.canCast = function (atRelease) { if (Game.sceneName === 'BoatFishing' && Game.scene.bin) return { ok: false, msg: 'Önce dürbünü indir.' }; return _cc(atRelease); };
}
