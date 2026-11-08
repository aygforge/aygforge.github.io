// Boot (data load + validation + atlases), app lifecycle, 30 Hz fixed-step loop with render interpolation,
// input routing, visibility pause + checkpoint, fullscreen/orientation, export/import, test hooks (?test=1).
import { loadContent, ContentError } from './data/ContentRegistry.js';
import { Game, newGameState, SIM_HZ } from './core/Game.js';
import { SpriteAtlas } from './render/SpriteAtlas.js';
import { WorldRenderer } from './render/WorldRenderer.js';
import { UIMenus } from './ui/UIMenus.js';
import { TouchController } from './ui/TouchController.js';
import { AudioMixer } from './audio/AudioMixer.js';
import { IndexedDBRepository } from './persistence/IndexedDBRepository.js';
import { PersistenceManager } from './persistence/PersistenceManager.js';
import { migrate, validateState } from './persistence/SaveMigration.js';
import { TILE } from './world/TerrainSystem.js';
import { RngStreams } from './core/RngStreams.js';

const params = new URLSearchParams(location.search);
const DATA = 'data/';
const fetchJson = async (p) => { const r = await fetch(DATA + p); if (!r.ok) throw new Error(`HTTP ${r.status} ${p}`); return r.json(); };

class App {
  constructor() {
    this.settings = { musicVolume: 0.6, sfxVolume: 0.8, ambienceVolume: 0.7, muted: false, graphicsQuality: 'HIGH', fpsTarget: 60, vibration: true, reducedMotion: false };
    try { Object.assign(this.settings, JSON.parse(localStorage.getItem('ku_settings') || '{}')); } catch { /* storage blocked */ }
    this.repo = new IndexedDBRepository(); this.game = null; this.inMenu = true; this.uiPause = false; this.acc = 0; this.last = 0;
  }

  async boot() {
    const bar = document.querySelector('#boot .fill'); const msg = document.querySelector('#boot .msg');
    try {
      msg.textContent = 'Ada verileri yükleniyor…';
      this.content = await loadContent(fetchJson);
      bar.style.width = '35%'; msg.textContent = 'Pixel art atlasları açılıyor…';
      const index = await fetchJson('../assets/atlas_index.json').catch(() => { throw new ContentError('ATLAS_INDEX_MISSING', 'assets/atlas_index.json'); });
      this.anchors = await fetchJson('../assets/avatar_anchors.json');
      this.atlas = new SpriteAtlas(index, '');
      await this.atlas.load((f) => { bar.style.width = `${35 + f * 60}%`; });
      msg.textContent = 'Hazır';
    } catch (e) {
      console.error(e);
      document.getElementById('boot').innerHTML = `<div class="fatal"><h2>Veri hatası</h2><p>Oyun güvenli şekilde başlatılamadı; eksik ya da bozuk içerikle oynanabilir dünya açılmadı.</p><code>${String(e.code || '')} ${String(e.message || e)}</code><button onclick="location.reload()">Yeniden dene</button></div>`;
      window.__KU_BOOT = { ok: false, error: String(e.message || e), code: e.code || null };
      return;
    }
    this.canvas = document.getElementById('world');
    this.audio = new AudioMixer(this.content.art.audio.catalog, () => this.settings);
    this.ui = new UIMenus(this);
    this.ui.buildHud();
    this.input = new TouchController(document.getElementById('hud'), this.canvas);
    this.bindInput();
    document.getElementById('boot').classList.add('hidden');
    document.addEventListener('visibilitychange', () => this.onVisibility());
    window.addEventListener('pagehide', () => this.persistence?.checkpoint('pagehide'));
    window.addEventListener('resize', () => this.checkOrientation()); this.checkOrientation();
    document.addEventListener('pointerdown', () => { this.audio.start(); this.audio.applyVolumes(); }, { once: false, capture: true });
    window.__KU_BOOT = { ok: true, counts: this.content.counts() };
    if (params.get('test') === '1') this.installTestHooks();
    await this.ui.showMainMenu();
    this.audio.update({ menu: true });
    requestAnimationFrame((t) => this.frame(t));
  }

  // ---------- game lifecycle ----------
  async newGame(slot, name, appearance) {
    const seed = params.get('seed') ? +params.get('seed') >>> 0 : (crypto.getRandomValues(new Uint32Array(1))[0] >>> 0);
    const st = newGameState(this.content, { slotId: slot, seed, name, appearance });
    const lease = await this.repo.acquireLease(slot, true);
    void lease;
    await this.repo.deleteSlot(slot).catch(() => {});
    this.start(st);
    this.game.exploration.readStory('STORY_01');
    await this.persistence.checkpoint('new_game');
    this.ui.toast('Kıyıda uyandın. Önce barınak, su ve ateş…');
  }
  async loadSlot(slot) {
    const lease = await this.repo.acquireLease(slot);
    if (!lease.ok && !confirm('Bu kayıt başka bir sekmede açık. Salt okunur açılsın mı? (Kaydetme kapalı olur)')) return;
    const r = await this.repo.load(slot);
    if (!r.ok) { alert('Kayıt okunamadı: ' + r.code); return; }
    const { state, report } = migrate(r.state, this.content);
    const errs = validateState(state, this.content);
    if (errs.length) { alert('Kayıt doğrulanamadı: ' + errs.slice(0, 3).join(', ')); return; }
    this.start(state);
    if (!lease.ok) { this.persistence.readOnly = true; this.ui.toast('Salt okunur mod: bu kayıt başka bir sekmede açık', 'warn'); }
    if (r.recovered) this.ui.toast('Son kayıt bozuktu — önceki sağlam yedek yüklendi', 'warn');
    if (report.quarantined.length) this.ui.toast(`${report.quarantined.length} bilinmeyen kayıt öğesi karantinaya alındı`, 'warn');
  }
  start(state) {
    if (this.game) { this.game.bus.handlers.clear(); }
    this.game = new Game(this.content, state);
    this.game.ui = this.ui; this.game.audio = this.audio;
    this.persistence = new PersistenceManager(this.game, this.repo); this.game.persistence = this.persistence;
    this.renderer = new WorldRenderer(this.canvas, this.game, this.atlas); this.renderer.setAnchors(this.anchors);
    this.audio.attach(this.game);
    this.wireEvents();
    this.applySettings();
    this.inMenu = false; this.ui.hideScreen(); document.getElementById('hud').classList.remove('hidden');
    this.prevPos = [...this.game.state.player.positionPx];
  }
  async toMenu() {
    await this.persistence?.checkpoint('menu'); await this.persistence?.flush();
    await this.repo.releaseLease().catch(() => {});
    this.game = null; this.persistence = null; this.inMenu = true;
    document.getElementById('hud').classList.add('hidden');
    this.ui.showMainMenu(); this.audio.update({ menu: true });
  }

  wireEvents() {
    const b = this.game.bus; const ui = this.ui;
    b.on('ui.error', (e) => ui.toast(e.text, 'err'));
    b.on('ui.toast', (e) => { const now = Date.now(); if (e.key && this.lastKey?.[e.key] > now - 4000) return; (this.lastKey ||= {})[e.key] = now; ui.toast(e.text); });
    b.on('poi.discovered', (e) => ui.toast(`Keşif: ${e.name}`, 'good'));
    b.on('region.discovered', (e) => ui.toast(`Yeni bölge: ${e.name}`, 'good'));
    b.on('blueprint.learned', (e) => ui.toast(`Özel plan öğrenildi: ${e.name}`, 'good'));
    b.on('special.found', (e) => ui.toast(`Önemli parça: ${e.name}`, 'good'));
    b.on('story.read', (e) => ui.toast(`Günlüğe eklendi: ${e.title}`, 'good'));
    b.on('skill.levelup', (e) => ui.toast(`${this.content.skills.get(e.skillId).name}: ${e.name}`, 'good'));
    b.on('build.completed', (e) => ui.toast(`Tamamlandı: ${this.content.itemName(e.buildId)}`, 'good'));
    b.on('craft.claimed', (e) => ui.toast(`+${e.quantity} ${this.content.itemName(e.outputId)}`));
    b.on('node.harvested', (e) => { ui.toast(`+${e.qty} ${this.content.itemName(e.itemId)}`); const n = this.game.world.nodeById.get(e.nodeId); this.game.world.spawnFx(e.kind === 'TREE' ? 'fx/wood_chips' : e.kind === 'ORE' || e.kind === 'STONE' ? 'fx/pickaxe_impact' : 'fx/sand_dust', (n.tile[0] + 0.5) * TILE, (n.tile[1] + 0.8) * TILE); });
    b.on('action.hit', (e) => { const p = this.game.state.player; const fv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.facing]; if (e.data?.anim === 'chop') this.game.world.spawnFx('fx/axe_impact', p.positionPx[0] + fv[0] * 24, p.positionPx[1] + fv[1] * 20); if (e.data?.anim === 'mine') this.game.world.spawnFx('fx/pickaxe_impact', p.positionPx[0] + fv[0] * 24, p.positionPx[1] + fv[1] * 20); this.ui.vibrate(12); });
    b.on('fish.landed', (e) => { ui.toast(e.released ? `${this.content.species.get(e.fishId).name} (${e.cm} cm) — serbest bırakıldı, günlüğe eklendi` : `${this.content.species.get(e.fishId).name} yakalandı! ${e.cm} cm`, 'good'); const p = this.game.state.player.positionPx; this.game.world.spawnFx('fx/fish_splash', p[0], p[1] + 30); });
    b.on('fish.lost', (e) => ui.toast(e.text));
    b.on('fish.bite', () => { this.ui.vibrate(80); const p = this.game.state.player.positionPx; this.game.world.spawnFx('fx/fish_bite', p[0], p[1] + 34); });
    b.on('player.damaged', () => { this.ui.vibrate(40); });
    b.on('player.died', () => ui.toast('Bayıldın… Son yatağında uyandın. Eşyaların düştüğün yerdeki çantada.', 'err'));
    b.on('sleep.end', (e) => ui.toast(`Gün ${e.day} — dinlendin`));
    b.on('day.started', (e) => { if (e.reason !== 'sleep') ui.toast(`Gün ${e.day}`); });
    b.on('weather.changed', (e) => ui.toast(`Hava: ${this.content.db.WeatherDB.states[e.weather].name}`));
    b.on('pet.alert', (e) => ui.toast(e.text, 'good'));
    b.on('sos.sent', (e) => ui.toast(e.text, 'good'));
    b.on('rescue.ready', (e) => ui.toast(e.text, 'good'));
    b.on('cave.entered', (e) => ui.toast(`${e.name} — çıkış her zaman açık`));
    b.on('save.readonly', () => ui.toast('Bu kayıt başka sekmede yazılıyor: salt okunur', 'warn'));
    b.on('save.failed', (e) => ui.toast('Kayıt başarısız: ' + e.error + ' — JSON yedeği al', 'err'));
    b.on('ending', (e) => setTimeout(() => this.ui.showEnding(e.routeId, e.stats), 2500));
    b.on('finale.failed', () => {});
    b.on('shortcut.opened', (e) => { ui.toast(`Kestirme açıldı (${e.gateId})`, 'good'); this.renderer.invalidate(); });
    b.on('world.buildings', () => this.renderer.decor.clear());
    b.on('state.restored', () => { this.renderer.invalidate(); this.prevPos = [...this.game.state.player.positionPx]; });
    b.on('scene.changed', () => { this.prevPos = [...this.game.state.player.positionPx]; });
  }

  // ---------- input ----------
  bindInput() {
    const tc = this.input;
    tc.on('interact', () => { if (this.game?.fishing.session) { this.fishingPress(true); return; } this.doInteract(); });
    tc.on('reel_up', () => this.fishingPress(false));
    tc.on('attack', () => this.doAttack());
    for (const k of ['inventory', 'craft', 'build', 'map', 'journal', 'pets', 'escape']) tc.on(k, () => { if (this.game && !this.inMenu) this.ui.openByKey(k); });
    for (let i = 0; i < 6; i++) tc.on('slot' + (i + 1), () => this.game && this.ui.useQuick(i));
    // tap on world: approach/interact, or move placement ghost
    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.game || this.inMenu || this.ui.openId) return;
      this.audio.start();
      const tile = this.renderer.screenToTile(e.clientX, e.clientY);
      if (this.ui.placement) { this.ui.movePlacement(tile); return; }
      const g = this.game; const targets = g.world.interactables(30);
      const hit = targets.find((t) => Math.abs(t.tile[0] - tile[0]) <= 1 && Math.abs(t.tile[1] + (t.kind === 'poi' ? 0 : 0) - tile[1]) <= 1);
      if (hit) {
        if (hit.d <= 1.9 || (hit.kind === 'poi' && hit.d <= 2.6)) { g.interact(hit); return; }
        if (this.settings.autoWalk !== false) g.world.approach(hit.tile, () => { const again = g.world.interactables().find((t) => t.kind === hit.kind && t.id === hit.id); if (again) g.interact(again); });
      } else g.world.approach(tile);
    });
  }
  doInteract() {
    const g = this.game; if (!g || this.inMenu) return;
    if (g.finale.active) return;
    const t = g.world.interactables()[0];
    if (t) { g.interact(t); return; }
    if (g.fishing.waterInFront() && g.inventory.bestTool('rod')) return this.castRod();
    const p = g.state.player;
    if (p.mode === 'SWIM') return g.interact({ kind: 'dive' });
  }
  castRod() { const r = this.game.fishing.cast(); if (r.ok) this.ui.closePanel(true); return r; }
  fishingPress(down) {
    const f = this.game?.fishing; if (!f?.session) return;
    if (down && f.session.phase === 'BITE') { f.hook(); return; }
    f.input(down);
  }
  doAttack() { if (!this.game || this.inMenu || this.ui.openId) return; this.game.wildlife.attack(); }

  dropSelected(uid) {
    const g = this.game; const inv = g.inventory; const loc = inv.locate(uid); if (!loc) return;
    const [tx, ty] = g.world.playerTile(); const id = `drop_${g.store.nextUid('bag')}`;
    g.store.transaction(null, (tx) => { const c = inv.createContainer(tx, `c_${id}`, 12, {}); inv.moveSlot(tx, loc[0], loc[1], c.id); tx.set(g.state.world.dropBags, id, { id, sceneId: g.world.sceneId, tile: [tx, ty], containerId: c.id }); });
  }
  /** Tool repair: stone tools with 1 stone + 1 branch; metal tools with repair kit (−20) + matching ingot. Atomic. */
  repairTool(uid) {
    const g = this.game; const inv = g.inventory; const a = inv.item(uid); if (!a || a.durability == null) return;
    const near = Object.values(g.state.buildingState.byId).some((b) => b.buildId === 'BUILD_WORKBENCH' && b.stage === 'complete' && g.world.playerDistToRect(b) <= 3);
    if (!near) { this.ui.toast('Onarım için çalışma tezgâhına yaklaş', 'err'); return; }
    const metal = /COPPER|IRON|MACHETE|CROWBAR|SHOVEL/.test(a.itemId) ? (/COPPER/.test(a.itemId) ? 'CMP_COPPER_INGOT' : 'CMP_IRON_INGOT') : null;
    const kit = inv.bestTool('TOOL_REPAIR_KIT');
    const r = g.store.transaction(`REPAIR:${uid}:${a.durability}:${g.state.clock.gameElapsedSeconds | 0}`, (tx) => {
      if (metal) { if (!kit || kit.durability < 20) tx.fail('NEED_KIT', 'Onarım kiti gerekli'); inv.remove(tx, ['inv_player'], metal, 1); inv.wear(tx, kit, 20); tx.set(a, 'durability', Math.min(a.maxDurability, a.durability + Math.round(a.maxDurability * 0.65))); }
      else { inv.remove(tx, ['inv_player'], 'MAT_STONE', 1); inv.remove(tx, ['inv_player'], 'MAT_BRANCH', 1); tx.set(a, 'durability', a.maxDurability); }
      tx.emit('tool.repaired', { itemId: a.itemId });
    });
    this.ui.toast(r.ok ? 'Onarıldı' : (r.detail || 'Malzeme eksik'), r.ok ? 'good' : 'err');
  }

  setUIPause(on) { this.uiPause = on; if (this.game) this.game.clock.paused = on; }
  onVisibility() {
    if (!this.game) return;
    if (document.hidden) { this.game.clock.hiddenPaused = true; this.persistence?.checkpoint('hidden'); }
    else { this.game.clock.hiddenPaused = false; this.last = performance.now(); this.acc = 0; }
  }
  checkOrientation() { document.getElementById('rotate').classList.toggle('show', window.innerHeight > window.innerWidth && window.innerWidth < 900); }
  toggleFullscreen() {
    const el = document.documentElement;
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => this.ui.toast('Tam ekran bu tarayıcıda engellendi', 'warn'));
      else this.ui.toast('Tam ekran desteklenmiyor — tarayıcı menüsünden "Ana ekrana ekle" deneyebilirsin', 'warn');
    } catch { this.ui.toast('Tam ekran desteklenmiyor', 'warn'); }
  }
  applySettings() {
    try { localStorage.setItem('ku_settings', JSON.stringify(this.settings)); } catch { /* storage blocked */ }
    this.audio.applyVolumes();
    if (this.renderer) this.renderer.quality = this.settings.graphicsQuality;
    document.body.classList.toggle('reduced-motion', !!this.settings.reducedMotion);
  }
  download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  exportCurrent() { this.download(`kayip-ufuk-${this.game.state.saveSlotId}.json`, this.repo.exportJSON(this.game.snapshot())); }
  async exportSlot(slot) { const r = await this.repo.load(slot); if (r.ok) this.download(`kayip-ufuk-${slot}.json`, this.repo.exportJSON(r.state)); }
  importInto(slot) {
    return new Promise((res) => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
      inp.onchange = async () => { const text = await inp.files[0].text(); const r = await this.importText(slot, text); alert(r.ok ? 'Kayıt içe aktarıldı' : 'İçe aktarma başarısız: ' + r.code); res(r); };
      inp.click();
    });
  }
  async importText(slot, text) {
    const p = IndexedDBRepository.parseImport(text); if (!p.ok) return p;
    const { state } = migrate(p.state, this.content); state.saveSlotId = slot;
    const errs = validateState(state, this.content); if (errs.length) return { ok: false, code: 'INVALID:' + errs[0] };
    await this.repo.save(state, 'import', { requireLease: false });
    return { ok: true };
  }

  // ---------- main loop ----------
  frame(t) {
    requestAnimationFrame((tt) => this.frame(tt));
    const dt = Math.min(0.25, (t - (this.last || t)) / 1000); this.last = t;
    if (this.settings.fpsTarget === 30) { this.skip = !this.skip; if (this.skip) return; }
    const g = this.game;
    if (!g || this.inMenu) return;
    const step = 1 / SIM_HZ;
    if (g.clock.running || g.finale.active) {
      this.acc += dt; let n = 0;
      while (this.acc >= step && n < 5) {
        this.prevPos = [...g.state.player.positionPx];
        const input = this.ui.openId ? { x: 0, y: 0, sprint: false } : this.input.sample();
        g.tick(step, input); this.acc -= step; n++;
      }
      if (n === 5) this.acc = 0;
    }
    const a = Math.min(1, this.acc / step); const p = g.state.player.positionPx;
    const interp = Math.hypot(p[0] - this.prevPos[0], p[1] - this.prevPos[1]) < 64 ? [this.prevPos[0] + (p[0] - this.prevPos[0]) * a, this.prevPos[1] + (p[1] - this.prevPos[1]) * a] : p;
    this.renderer.render(a, interp);
    this.ui.updateHud(dt);
    this.audioT = (this.audioT || 0) + dt;
    if (this.audioT > 1) {
      this.audioT = 0;
      const sc = g.world.sceneId; const [tx, ty] = g.world.playerTile();
      const nearFire = Object.values(g.state.buildingState.byId).some((b) => b.buildId === 'BUILD_CAMPFIRE' && b.stage === 'complete' && Math.hypot(b.tile[0] - tx, b.tile[1] - ty) < 6);
      this.audio.update({ region: g.world.regionId(), cave: sc.startsWith('CAVE') ? sc : null, diving: g.state.player.mode === 'DIVE', raining: g.climate.isRaining(), weather: g.climate.weather(), night: g.clock.isNight(), dusk: g.clock.phase() === 'EVENING', sea: g.state.player.mode === 'RAFT', exploring: !nearFire, nearFire, ending: g.finale.active?.done ? (g.finale.active.kind === 'SEA' ? 'ESCAPE_SAIL' : 'ESCAPE_RADIO') : null });
    }
    if (g.world.moving && g.state.player.mode === 'WALK') { this.stepT = (this.stepT || 0) + dt; if (this.stepT > (g.world.sprintingNow ? 0.28 : 0.4)) { this.stepT = 0; const code = g.world.grid.tileAt(...g.world.playerTile()); this.audio.footstep(g.world.grid.isCave || code === 7 || code === 8 ? 'stone' : code === 2 || code === 16 ? 'sand' : g.world.grid.deck?.[g.world.grid.i(...g.world.playerTile())] ? 'wood' : 'grass'); } }
  }

  // ---------- test hooks (only with ?test=1) ----------
  installTestHooks() {
    window.__KU = {
      app: this, get game() { return window.__KU.app.game; }, RngStreams,
      newGame: (slot = 'slot-1', seed = 42, name = 'Test') => { params.set('seed', String(seed)); return this.newGame(slot, name, { body: 'body_a', skin: 1, hair: 2, hairColor: 3, outfit: 1 }); },
      tick: (sec, input = { x: 0, y: 0, sprint: false }) => { const g = this.game; const n = Math.round(sec * SIM_HZ); for (let i = 0; i < n; i++) g.tick(1 / SIM_HZ, input); },
      save: (reason = 'test') => this.persistence.checkpoint(reason),
      load: (slot) => this.loadSlot(slot),
      repo: this.repo,
    };
  }
}

const app = new App();
window.__KU_APP = app;
app.boot();
