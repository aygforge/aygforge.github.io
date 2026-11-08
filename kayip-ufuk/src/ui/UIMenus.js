// All menus/overlays (Turkish): main menu, 3 save slots, character creator, landscape HUD with 6-slot quickbar,
// inventory, crafting, build/upgrade placement, map, journal (story/skills/blueprints/collection/escape),
// pets, settings (audio/quality/fps/fullscreen/export/import), storage, puzzles, fishing, traps, plots,
// water, boat project, ending stats, pause. UI only sends commands; systems validate them.
import { PLAYER_INV, WATER_VESSELS } from '../systems/InventorySystem.js';
import { SPECIAL_INV } from '../systems/ExplorationSystem.js';
import { SKIN_TONES, HAIR_COLORS, OUTFITS } from '../render/SpriteAtlas.js';
import { TILE } from '../world/TerrainSystem.js';
import { HOUSES } from '../systems/BuildSystem.js';
import { WEATHERS } from '../systems/ClimateSystem.js';

const PAUSING = new Set(['UI_SAVE_SELECT', 'UI_SETTINGS', 'UI_INVENTORY', 'UI_CRAFT', 'UI_BUILD', 'UI_MAP', 'UI_JOURNAL', 'UI_CHARACTER', 'UI_PETS', 'UI_COLLECTION', 'UI_PAUSE', 'UI_PUZZLE', 'UI_STORAGE', 'UI_ENDING_STATS', 'UI_TRAP']);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WNAME = { CLEAR: 'Açık', LIGHT_RAIN: 'Hafif yağmur', RAIN: 'Yağmur', HEAVY_RAIN: 'Şiddetli yağmur', STORM: 'Tropik fırtına' };
const SKILL_ICON = { SKILL_FORESTRY: 'icon/TOOL_STONE_AXE', SKILL_MINING: 'icon/TOOL_STONE_PICK', SKILL_FISHING: 'icon/TOOL_FISH_ROD', SKILL_HUNTING: 'icon/TOOL_BOW', SKILL_FARMING: 'icon/SEED_ROOT', SKILL_CRAFTING: 'icon/CMP_ROPE', SKILL_COOKING: 'icon/FOOD_COOKED_FISH', SKILL_EXPLORATION: 'icon/TOOL_COMPASS' };

export class UIMenus {
  constructor(app) {
    this.app = app; this.atlas = app.atlas; this.content = app.content;
    this.root = document.getElementById('app');
    this.panelEl = document.getElementById('panel'); this.screenEl = document.getElementById('screen');
    this.hudEl = document.getElementById('hud'); this.toastEl = document.getElementById('toasts');
    this.openId = null; this.placement = null; this.currentTarget = null; this.hudT = 0; this.selected = null;
  }
  get g() { return this.app.game; }
  ico(id, size = 32, extra = '') { return `<span class="ico ${extra}" style="width:${size}px;height:${size}px;${this.atlas.css(id, size)}"></span>`; }
  itemIco(itemId, size = 32) { return this.ico(`icon/${itemId}`, size); }
  name(id) { return this.content.itemName(id); }

  // ================= screens =================
  showScreen(html) { this.screenEl.innerHTML = html; this.screenEl.classList.remove('hidden'); this.hudEl.classList.add('hidden'); }
  hideScreen() { this.screenEl.classList.add('hidden'); this.screenEl.innerHTML = ''; }

  async showMainMenu() {
    this.app.inMenu = true; this.closePanel(true);
    const slots = await this.app.repo.listSlots().catch(() => []);
    const any = slots.some((s) => !s.empty);
    this.showScreen(`
      <div class="menu-bg">${this.ico('scene/intro_shipwreck/backdrop', 0, 'bgart')}</div>
      <div class="menu">
        <h1 class="logo">Kayıp Ufuk</h1>
        <p class="tag">Tropik ada hayatta kalma · keşif · üretim</p>
        <button class="big" data-a="continue" ${any ? '' : 'disabled'}>Devam Et</button>
        <button class="big" data-a="new">Yeni Oyun</button>
        <button data-a="settings">Ayarlar</button>
        <button data-a="fullscreen">${this.ico('ui/fullscreen', 24)} Tam ekran</button>
        <p class="small">Sürüm 2.0 · Tek oyunculu · Kayıtlar bu tarayıcıda (IndexedDB) saklanır.</p>
      </div>`);
    const bg = this.screenEl.querySelector('.bgart'); if (bg) bg.removeAttribute('style'), bg.setAttribute('style', `${this.atlas.css('scene/intro_shipwreck/backdrop', 1536)}`);
    this.screenEl.onclick = (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      this.app.audio.start(); this.sfx('snd_ui_confirm');
      if (a === 'continue') this.showSlots('load');
      if (a === 'new') this.showSlots('new');
      if (a === 'settings') this.openSettings(true);
      if (a === 'fullscreen') this.app.toggleFullscreen();
    };
  }

  async showSlots(mode) {
    const slots = await this.app.repo.listSlots();
    this.showScreen(`<div class="menu wide"><h2>${mode === 'new' ? 'Yeni oyun için kayıt yuvası' : 'Kayıt yükle'}</h2>
      <div class="slots">${slots.map((s) => `<div class="slot-card ${s.empty ? 'empty' : ''}">
        <h3>${s.saveSlotId.replace('slot-', 'Yuva ')}</h3>
        ${s.empty ? '<p>Boş</p>' : `<p><b>${esc(s.slotDisplayName)}</b></p><p>Gün ${s.day} · ${s.scene?.startsWith('CAVE') ? 'Mağara' : 'Ada'}</p><p class="small">${new Date(s.lastSavedUtc).toLocaleString('tr-TR')}</p>${s.endings?.length ? `<p class="small">${s.endings.map((e) => this.ico(e === 'ESCAPE_SAIL' ? 'icon/CMP_SAIL' : 'icon/CMP_ANTENNA', 20)).join('')} ${s.endings.length}/2 final</p>` : ''}`}
        ${mode === 'new' ? `<button data-a="new" data-s="${s.saveSlotId}">${s.empty ? 'Burada başla' : 'Üzerine yaz'}</button>` : s.empty ? '' : `<button data-a="load" data-s="${s.saveSlotId}">Yükle</button>`}
        ${!s.empty ? `<button class="ghost" data-a="export" data-s="${s.saveSlotId}">Dışa aktar</button><button class="ghost danger" data-a="del" data-s="${s.saveSlotId}">Sil</button>` : `<button class="ghost" data-a="import" data-s="${s.saveSlotId}">İçe aktar</button>`}
      </div>`).join('')}</div>
      <button data-a="back">Geri</button></div>`);
    this.screenEl.onclick = async (e) => {
      const el = e.target.closest('[data-a]'); if (!el) return; const a = el.dataset.a, slot = el.dataset.s;
      this.sfx('snd_ui_confirm');
      if (a === 'back') return this.showMainMenu();
      if (a === 'new') { if (!slots.find((x) => x.saveSlotId === slot).empty && !confirm('Bu yuvadaki kayıt silinecek. Emin misin?')) return; this.showCreator(slot); }
      if (a === 'load') this.app.loadSlot(slot);
      if (a === 'del') { if (confirm('Kayıt kalıcı olarak silinsin mi?')) { await this.app.repo.deleteSlot(slot); this.showSlots(mode); } }
      if (a === 'export') this.app.exportSlot(slot);
      if (a === 'import') this.app.importInto(slot).then(() => this.showSlots(mode));
    };
  }

  showCreator(slot) {
    const app = { body: 'body_a', skin: 0, hair: 0, hairColor: 1, outfit: 0 };
    let name = 'Deniz';
    const render = () => {
      this.showScreen(`<div class="menu wide creator"><h2>Kazazede</h2>
        <div class="creator-row"><canvas id="cc-preview" width="96" height="144"></canvas>
        <div class="opts">
          <label>Ad <input id="cc-name" maxlength="16" value="${esc(name)}"></label>
          ${this.optRow('Vücut', 'body', ['body_a', 'body_b'], app.body, (v) => (v === 'body_a' ? 'İnce' : 'Geniş'))}
          ${this.optRow('Ten', 'skin', [0, 1, 2, 3], app.skin, (v) => `<i class="sw" style="background:${SKIN_TONES[v][0]}"></i>`)}
          ${this.optRow('Saç', 'hair', [0, 1, 2, 3, 4, 5], app.hair, (v) => ['Kısa', 'Uzun', 'Diken', 'Topuz', 'Kıvırcık', 'At kuyruğu'][v])}
          ${this.optRow('Saç rengi', 'hairColor', [0, 1, 2, 3, 4], app.hairColor, (v) => `<i class="sw" style="background:${HAIR_COLORS[v]}"></i>`)}
          ${this.optRow('Kıyafet', 'outfit', [0, 1, 2], app.outfit, (v) => `<i class="sw" style="background:${OUTFITS[v][0]}"></i>`)}
        </div></div>
        <div class="row"><button data-a="back">Geri</button><button class="big" data-a="go">Adaya uyan</button></div></div>`);
      const cv = this.screenEl.querySelector('#cc-preview'); const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
      let t = 0; const draw = () => { if (!cv.isConnected) return; t++; c.clearRect(0, 0, 96, 144); const dir = ['down', 'right', 'up', 'left'][Math.floor(t / 90) % 4]; const f = Math.floor(t / 8) % 6; const b = this.atlas.avatarFrame(app, 'walk', dir, f); c.drawImage(b, 0, 0, 96, 144); const h = this.atlas.hairFrame(app, dir); const an = this.app.anchors.anchors[`${app.body}/walk/${dir}/${f}`]; c.drawImage(h, (an.head[0] - 16) * 3, (an.head[1] - 12) * 3, 96, 66); requestAnimationFrame(draw); };
      draw();
    };
    render();
    this.screenEl.onclick = (e) => {
      const el = e.target.closest('[data-a],[data-k]'); if (!el) return;
      name = this.screenEl.querySelector('#cc-name')?.value || name;
      if (el.dataset.k) { const v = el.dataset.v; app[el.dataset.k] = isNaN(+v) ? v : +v; this.sfx('snd_ui_confirm'); render(); return; }
      if (el.dataset.a === 'back') return this.showSlots('new');
      if (el.dataset.a === 'go') { name = name.trim().slice(0, 16) || 'Kazazede'; this.app.newGame(slot, name, { ...app }); }
    };
  }
  optRow(label, key, vals, cur, fmt) { return `<div class="opt"><span>${label}</span>${vals.map((v) => `<button class="chip ${v === cur ? 'on' : ''}" data-k="${key}" data-v="${v}">${fmt(v)}</button>`).join('')}</div>`; }

  // ================= HUD =================
  buildHud() {
    const btn = (a, icon, label) => `<button class="hbtn" data-h="${a}" title="${label}" aria-label="${label}">${this.ico(icon, 30)}</button>`;
    this.hudEl.innerHTML = `
      <div id="stats">
        ${['health', 'hunger', 'thirst', 'rest', 'stamina', 'oxygen'].map((k) => `<div class="bar b-${k}" data-bar="${k}"><span class="lbl">${{ health: 'Can', hunger: 'Açlık', thirst: 'Su', rest: 'Dinç', stamina: 'Enerji', oxygen: 'Nefes' }[k]}</span><i></i></div>`).join('')}
        <div id="clock"></div>
      </div>
      <div id="menu-btns">${btn('inventory', 'ui/backpack', 'Envanter')}${btn('craft', 'ui/craft', 'Üretim')}${btn('build', 'ui/build', 'İnşa')}${btn('map', 'ui/map', 'Harita')}${btn('journal', 'ui/journal', 'Ada Günlüğü')}${btn('pets', 'ui/pets', 'Hayvan dostları')}${btn('settings', 'ui/settings', 'Ayarlar')}${btn('pause', 'ui/pause', 'Duraklat')}</div>
      <div id="joy-zone"><div id="joy">${this.ico('ui/joystick', 120)}<div id="joy-knob"></div></div></div>
      <div id="quickbar">${[0, 1, 2, 3, 4, 5].map((i) => `<button class="qslot" data-q="${i}"><span class="qi"></span><b>${i + 1}</b><em></em></button>`).join('')}</div>
      <div id="actions">
        <button id="btn-attack" class="act" aria-label="Saldır">${this.ico('ui/attack', 40)}</button>
        <button id="btn-sprint" class="act" aria-label="Koş">${this.ico('ui/sprint', 40)}</button>
        <button id="btn-interact" class="act big" aria-label="Eylem">${this.ico('ui/interact', 56)}<span id="act-label"></span></button>
      </div>
      <div id="action-bar" class="hidden"><i></i><span></span></div>
      <div id="save-ind"></div>`;
    this.hudEl.onclick = (e) => {
      const h = e.target.closest('[data-h]')?.dataset.h; if (h) { this.sfx('snd_ui_confirm'); this.openByKey(h); return; }
      const q = e.target.closest('[data-q]'); if (q) this.useQuick(+q.dataset.q);
    };
    const act = this.hudEl.querySelector('#btn-interact');
    act.addEventListener('pointerdown', (e) => { e.preventDefault(); this.app.audio.start(); if (this.g.fishing.session) { this.app.fishingPress(true); return; } this.app.doInteract(); });
    act.addEventListener('pointerup', () => this.app.fishingPress(false));
    this.hudEl.querySelector('#btn-attack').addEventListener('pointerdown', (e) => { e.preventDefault(); this.app.doAttack(); });
    const sp = this.hudEl.querySelector('#btn-sprint');
    sp.addEventListener('pointerdown', (e) => { e.preventDefault(); const tc = this.app.input; tc.sprintHeld = !tc.sprintHeld; sp.classList.toggle('on', tc.sprintHeld); this.vibrate(10); });
  }
  openByKey(k) {
    if (this.openId) { const was = this.openId; this.closePanel(); if ({ inventory: 'UI_INVENTORY', craft: 'UI_CRAFT', build: 'UI_BUILD', map: 'UI_MAP', journal: 'UI_JOURNAL', pets: 'UI_PETS', settings: 'UI_SETTINGS', pause: 'UI_PAUSE' }[k] === was) return; }
    ({ inventory: () => this.openInventory(), craft: () => this.openCraft('HAND'), build: () => this.openBuild(), map: () => this.openMap(), journal: () => this.openJournal(), pets: () => this.openPets(), settings: () => this.openSettings(), pause: () => this.openPause(), escape: () => this.openPause() }[k] || (() => {}))();
  }

  updateHud(dt) {
    this.hudT += dt; if (this.hudT < 0.1) return; this.hudT = 0;
    const g = this.g; if (!g) return; const p = g.state.player;
    for (const k of ['health', 'hunger', 'thirst', 'rest', 'stamina', 'oxygen']) {
      const el = this.hudEl.querySelector(`[data-bar="${k}"]`); if (!el) continue;
      el.querySelector('i').style.width = `${p[k]}%`; el.classList.toggle('low', p[k] < 20);
      if (k === 'oxygen') el.classList.toggle('hidden', p.mode !== 'DIVE' && p.oxygen >= 99);
    }
    const w = g.climate.weather(); const tide = g.climate.isLowTide();
    const fc = g.climate.forecast();
    this.hudEl.querySelector('#clock').innerHTML = `${this.ico('ui/weather', 18)} Gün ${g.clock.day} · ${g.clock.clockText()} · ${WNAME[w]}${g.climate.isRaining() ? '' : ''} ${this.ico('ui/tide', 18)} ${tide ? 'Cezir' : 'Med'}${fc ? ` · Yarın: ${WNAME[fc]}` : ''}<br><span class="reg">${esc(this.regionName())}</span>`;
    // quickbar
    const inv = g.inventory;
    this.hudEl.querySelectorAll('.qslot').forEach((el, i) => {
      const ref = p.quickbar[i]; let it = ref?.uid ? inv.item(ref.uid) : null;
      if (ref && (!it || !inv.locate(ref.uid))) { const found = inv.cont(PLAYER_INV).slots.find((u) => u && inv.item(u).itemId === ref.itemId); it = found ? inv.item(found) : null; if (it) ref.uid = it.uid; }
      const sig = it ? `${it.itemId}:${inv.count([PLAYER_INV], it.itemId)}:${it.durability}` : ref ? `${ref.itemId}:0` : '';
      if (el.dataset.sig === sig) return; el.dataset.sig = sig;
      el.querySelector('.qi').innerHTML = ref ? this.itemIco(ref.itemId, 34) : '';
      el.querySelector('em').textContent = it ? (it.durability != null ? `${Math.round((it.durability / it.maxDurability) * 100)}%` : inv.count([PLAYER_INV], it.itemId)) : ref ? '0' : '';
      el.classList.toggle('dim', ref && !it);
    });
    // context action
    const lab = this.hudEl.querySelector('#act-label');
    const targets = g.world.interactables(); this.currentTarget = targets[0] || null;
    lab.textContent = g.fishing.session ? (g.fishing.session.phase === 'BITE' ? 'Çek!' : g.fishing.session.phase === 'FIGHT' ? 'Basılı tut: Sar' : 'Bekle…') : this.currentTarget ? this.currentTarget.label : (g.fishing.waterInFront() && inv.bestTool('rod') ? 'Olta at' : '');
    const bar = this.hudEl.querySelector('#action-bar');
    if (p.action) { bar.classList.remove('hidden'); bar.querySelector('i').style.width = `${(p.action.t / p.action.total) * 100}%`; bar.querySelector('span').textContent = p.action.label; } else bar.classList.add('hidden');
    const si = this.hudEl.querySelector('#save-ind'); const pm = this.app.persistence;
    si.textContent = pm?.readOnly ? 'Salt okunur (başka sekme)' : pm?.lastStatus === 'saving' ? 'Kaydediliyor…' : pm?.lastSavedAt && Date.now() - pm.lastSavedAt < 2500 ? 'Kaydedildi' : '';
    this.updateFishingUI();
  }
  regionName() { const r = this.g.world.regionId(); const cave = this.g.world.sceneId.startsWith('CAVE') ? this.content.caves.get(this.g.world.sceneId).name : null; return cave || (r ? this.content.regions.get(r).name : this.g.state.player.mode === 'RAFT' ? 'Açık deniz' : 'Kıyı suları'); }

  useQuick(i) {
    const g = this.g; const ref = g.state.player.quickbar[i]; if (!ref) { this.toast('Envanterden bir eşyayı bu slota ata'); return; }
    const inv = g.inventory; let uid = ref.uid && inv.locate(ref.uid) ? ref.uid : inv.cont(PLAYER_INV).slots.find((u) => u && inv.item(u).itemId === ref.itemId);
    if (!uid) { this.toast(`${this.name(ref.itemId)} kalmadı`); return; }
    this.useItem(uid);
  }
  useItem(uid) {
    const g = this.g; const it = g.inventory.item(uid); const def = this.content.items.get(it.itemId);
    if (def.restore || ['CON_BANDAGE', 'CON_ADV_BANDAGE', 'CON_ANTIDOTE', 'FOOD_MUSHROOM'].includes(it.itemId)) { const r = g.survival.consume(uid); if (r.ok) g.state.player.eatT = 0.8; return r; }
    if (def.equipmentSlot) { const eq = g.state.player.equipment; const r = g.store.transaction(null, (tx) => (eq[def.equipmentSlot] === uid ? g.inventory.unequip(tx, def.equipmentSlot) : g.inventory.equip(tx, uid))); if (!r.ok) this.toast(r.detail || 'Kuşanılamadı'); if (it.itemId === 'TOOL_CLIMB_KIT') g.exploration.syncGates(); return r; }
    if (it.itemId.startsWith('SEED_')) { const plot = this.nearestPlot(); if (plot) return g.farm.plant(plot, it.itemId); this.toast('Yakında boş ekim yatağı yok'); return { ok: false }; }
    if (it.itemId === 'TOOL_FISH_ROD' || it.itemId === 'TOOL_FISH_ROD_ADV') return this.app.castRod();
    this.toast(def.name); return { ok: false };
  }
  nearestPlot() {
    const g = this.g; let best = null, bd = 3;
    for (const b of Object.values(g.state.buildingState.byId)) if (b.buildId === 'BUILD_PLANTER' && b.stage === 'complete' && !g.farm.plot(b.uid)?.cropId) { const d = g.world.playerDistToRect(b); if (d < bd) { bd = d; best = b.uid; } }
    return best;
  }

  // ================= panels =================
  openPanel(id, title, html, onClick, { wide = false } = {}) {
    this.openId = id;
    this.panelEl.className = `panel ${wide ? 'wide' : ''}`;
    this.panelEl.innerHTML = `<div class="ph"><h2>${title}</h2><button class="x" data-p="close" aria-label="Kapat">✕</button></div><div class="pb">${html}</div>`;
    this.panelEl.onclick = (e) => { if (e.target.closest('[data-p="close"]')) { this.sfx('snd_ui_cancel'); this.closePanel(); return; } onClick?.(e); };
    this.app.setUIPause(PAUSING.has(id));
  }
  refresh() { if (this.reopen) this.reopen(); }
  closePanel(silent = false) {
    if (!this.openId && silent) return;
    this.openId = null; this.reopen = null; this.panelEl.className = 'panel hidden'; this.panelEl.innerHTML = '';
    if (this.placement && !this.placementActive) this.placement = null;
    this.app.setUIPause(false);
  }

  // ---------- inventory ----------
  openInventory() {
    const g = this.g; const inv = g.inventory; const p = g.state.player;
    const draw = () => {
      const cont = inv.cont(PLAYER_INV); const sel = this.selected && inv.item(this.selected) ? this.selected : null;
      const slot = (u, i, cid) => { const a = u ? inv.item(u) : null; const eq = a && Object.values(p.equipment).includes(u); return `<button class="islot ${u === sel ? 'sel' : ''} ${eq ? 'eq' : ''}" data-u="${u || ''}" data-c="${cid}" data-i="${i}">${a ? this.itemIco(a.itemId, 34) + `<em>${a.durability != null ? Math.round((a.durability / a.maxDurability) * 100) + '%' : a.quantity}</em>` : ''}</button>`; };
      const eqHtml = Object.entries(p.equipment).map(([k, u]) => `<div class="eqs"><span>${{ main_hand: 'El', head: 'Baş', body: 'Gövde', feet: 'Ayak', backpack: 'Çanta', accessory: 'Aksesuar' }[k]}</span>${u ? this.itemIco(inv.item(u).itemId, 28) : '<i class="empty"></i>'}</div>`).join('');
      const keys = inv.cont(SPECIAL_INV).slots.filter(Boolean).map((u) => `<span class="key" title="${esc(this.name(inv.item(u).itemId))}">${this.itemIco(inv.item(u).itemId, 30)}</span>`).join('') || '<span class="small">Henüz özel parça yok</span>';
      let info = '<p class="small">Bir eşyaya dokun.</p>';
      if (sel) {
        const a = inv.item(sel); const d = this.content.items.get(a.itemId);
        const r = d.restore ? Object.entries(d.restore).map(([k, v]) => `+${v} ${{ hunger: 'açlık', thirst: 'su', health: 'can' }[k]}`).join(', ') : '';
        const usable = d.restore || d.equipmentSlot || a.itemId.startsWith('CON_') || a.itemId.startsWith('SEED_') || a.itemId === 'FOOD_MUSHROOM';
        info = `<div class="iinfo">${this.itemIco(a.itemId, 48)}<div><b>${esc(d.name)}</b><br><span class="small">${d.category}${a.durability != null ? ` · Dayanıklılık ${a.durability}/${a.maxDurability}` : ''}${a.perishAtGameSeconds ? ` · Bozulma: ${Math.max(0, ((a.perishAtGameSeconds - g.state.clock.gameElapsedSeconds) / 1080)).toFixed(1)} gün` : ''}${r ? ' · ' + r : ''}${WATER_VESSELS[a.itemId] ? ` · Su kabı (${WATER_VESSELS[a.itemId]})` : ''}</span></div></div>
          <div class="row wrap">${usable ? `<button data-x="use">${d.equipmentSlot ? (Object.values(p.equipment).includes(sel) ? 'Çıkar' : 'Kuşan') : d.restore ? (d.restore.hunger ? 'Ye' : 'İç') : 'Kullan'}</button>` : ''}
          ${a.durability != null && a.durability < a.maxDurability ? '<button data-x="repair">Onar</button>' : ''}
          <button data-x="split" ${a.quantity > 1 ? '' : 'disabled'}>Böl</button>
          ${a.itemId === 'SAL_ROPE' ? '<button data-x="dismantle">Sök (2 lif)</button>' : ''}
          ${d.category !== 'special' ? '<button class="ghost" data-x="drop">Bırak</button>' : ''}
          <span class="small">Hızlı slot:</span>${[0, 1, 2, 3, 4, 5].map((i) => `<button class="chip" data-qs="${i}">${i + 1}</button>`).join('')}</div>`;
      }
      this.panelEl.querySelector('.pb').innerHTML = `<div class="invgrid">${cont.slots.map((u, i) => slot(u, i, PLAYER_INV)).join('')}</div>
        <div class="side"><h3>Ekipman</h3><div class="eqgrid">${eqHtml}</div><h3>Özel parçalar</h3><div class="keys">${keys}</div>
        <p class="small">Su: ${inv.waterCarried()}/${inv.waterCapacity()} porsiyon · Çanta ${cont.slots.filter(Boolean).length}/${cont.capacity}</p>${info}</div>`;
    };
    this.openPanel('UI_INVENTORY', 'Envanter', '', (e) => {
      const s = e.target.closest('.islot'); const x = e.target.closest('[data-x]')?.dataset.x; const qs = e.target.closest('[data-qs]');
      if (s) { const u = s.dataset.u; if (this.selected && !u && this.selected !== u) { const loc = inv.locate(this.selected); if (loc) g.store.transaction(null, (tx) => inv.moveSlot(tx, loc[0], loc[1], PLAYER_INV, null, +s.dataset.i)); this.selected = null; } else this.selected = u || null; draw(); return; }
      if (qs && this.selected) { const a = inv.item(this.selected); p.quickbar[+qs.dataset.qs] = { uid: a.uid, itemId: a.itemId }; this.toast(`${this.name(a.itemId)} → slot ${+qs.dataset.qs + 1}`); this.hudEl.querySelectorAll('.qslot').forEach((q) => { q.dataset.sig = ''; }); return; }
      if (!x || !this.selected) return;
      if (x === 'use') this.useItem(this.selected);
      if (x === 'split') { const loc = inv.locate(this.selected); g.store.transaction(null, (tx) => inv.splitStack(tx, loc[0], loc[1])); }
      if (x === 'drop') this.app.dropSelected(this.selected);
      if (x === 'repair') this.app.repairTool(this.selected);
      if (x === 'dismantle') g.dismantle(this.selected);
      if (!inv.item(this.selected)) this.selected = null;
      draw();
    }, { wide: true });
    this.reopen = draw; draw();
  }

  // ---------- crafting ----------
  openCraft(stationUid = 'HAND') {
    const g = this.g; const st = stationUid !== 'HAND' ? g.state.buildingState.byId[stationUid] : null;
    const stationId = st ? st.buildId : 'HAND';
    let filter = 'all';
    const draw = () => {
      const recipes = g.craft.recipesFor(stationId).slice().sort((a, b) => (g.knowledge.unlocked(b) - g.knowledge.unlocked(a)) || a.id.localeCompare(b.id));
      const q = g.state.productionState.queuesByStation[stationUid];
      const queue = q?.entries?.length ? `<div class="queue">${q.entries.map((e) => { const r = this.content.recipes.get(e.recipeId); return `<div class="qe">${this.itemIco(r.outputId, 28)}<span>${esc(this.name(r.outputId))} ×${r.outputAmount * e.quantity}</span><div class="pbar"><i style="width:${(e.progressSeconds / e.totalSeconds) * 100}%"></i></div>${e.completed ? `<button data-claim="${e.uid}">Al</button>` : `<button class="ghost" data-cancel="${e.uid}">İptal</button>`}</div>`; }).join('')}</div>` : '';
      const conts = g.craft.nearbyContainers(stationUid);
      const rows = recipes.filter((r) => filter === 'all' || g.knowledge.unlocked(r)).map((r) => {
        const un = g.knowledge.unlocked(r); const reasons = un ? g.craft.check(r.id, stationUid, 1) : [];
        const ins = Object.entries(r.inputs).map(([id, n]) => { const have = g.inventory.count(conts, id); return `<span class="in ${have >= n ? 'ok' : 'no'}">${this.itemIco(id, 22)}${have}/${n}</span>`; }).join('');
        return `<div class="recipe ${un ? '' : 'locked'}">${this.itemIco(r.outputId, 36)}<div class="rt"><b>${esc(this.name(r.outputId))}${r.outputAmount > 1 ? ' ×' + r.outputAmount : ''}</b><div class="ins">${un ? ins : `<span class="small">${esc(g.knowledge.unlockText(r))}</span>`}</div>${un && reasons.length ? `<span class="why">${esc(reasons[0])}</span>` : ''}</div>
          ${un ? `<button data-craft="${r.id}" ${reasons.length ? 'disabled' : ''}>Üret</button><button class="ghost" data-craft5="${r.id}" ${g.craft.check(r.id, stationUid, 5).length ? 'disabled' : ''}>×5</button>` : ''}</div>`;
      }).join('');
      this.panelEl.querySelector('.pb').innerHTML = `${queue}<div class="row"><button class="chip ${filter === 'all' ? 'on' : ''}" data-f="all">Tümü</button><button class="chip ${filter === 'open' ? 'on' : ''}" data-f="open">Açık olanlar</button><span class="small">${st ? 'Yakındaki sandıklar (10 karo) kullanılır.' : 'El üretimi (yalnız çanta).'}</span></div><div class="recipes">${rows || '<p>Bu istasyonda tarif yok.</p>'}</div>`;
    };
    this.openPanel('UI_CRAFT', st ? this.content.builds.get(st.buildId).name : 'El ile üretim', '', (e) => {
      const t = e.target.closest('[data-craft],[data-craft5],[data-claim],[data-cancel],[data-f]'); if (!t) return;
      if (t.dataset.f) filter = t.dataset.f;
      if (t.dataset.craft) g.craft.start(t.dataset.craft, stationUid, 1);
      if (t.dataset.craft5) g.craft.start(t.dataset.craft5, stationUid, 5);
      if (t.dataset.claim) { const r = g.craft.claim(stationUid, t.dataset.claim); if (!r.ok) this.toast('Çanta dolu — ürün istasyonda bekliyor'); }
      if (t.dataset.cancel) g.craft.cancel(stationUid, t.dataset.cancel);
      draw();
    }, { wide: true });
    this.reopen = draw; draw();
    this.craftTimer = setInterval(() => { if (this.openId === 'UI_CRAFT') { g.craft.tick(0); draw(); } else clearInterval(this.craftTimer); }, 500);
  }

  // ---------- build ----------
  openBuild() {
    const g = this.g;
    const draw = () => {
      const recs = [...this.content.recipes.values()].filter((r) => r.outputType === 'build');
      const ups = [...this.content.recipes.values()].filter((r) => r.outputType === 'upgrade');
      const card = (r) => {
        const un = g.knowledge.unlocked(r); const st = r.station === 'HAND' || g.state.knowledge.stations[r.station]; const b = this.content.builds.get(r.outputId);
        const cost = Object.entries(r.inputs).map(([id, n]) => `<span class="in ${g.inventory.count([PLAYER_INV], id) >= n ? 'ok' : ''}">${this.itemIco(id, 20)}${n}</span>`).join('');
        return `<div class="recipe ${un && st ? '' : 'locked'}">${this.ico(`build/${r.outputId}/complete`, 44)}<div class="rt"><b>${esc(b.name)}${r.powerVariant ? ` (${r.powerVariant === 'solar' ? 'güneş' : 'jeneratör'})` : ''}</b><span class="small">${esc(b.ability)} · ${b.footprintTiles.join('×')}</span><div class="ins">${un ? cost : esc(g.knowledge.unlockText(r))}</div>${un && !st ? `<span class="why">Önce kur: ${esc(this.name(r.station))}</span>` : ''}</div>${un && st ? `<button data-place="${r.id}">Yerleştir</button>` : ''}</div>`;
      };
      const upCard = (r) => {
        const un = g.knowledge.unlocked(r); const target = this.nearestBuild(r.targetBuildId, 4);
        const cost = Object.entries(r.inputs).map(([id, n]) => `<span class="in">${this.itemIco(id, 20)}${n}</span>`).join('');
        return `<div class="recipe ${un ? '' : 'locked'}">${this.ico(`build/${r.targetBuildId}/complete`, 40)}<div class="rt"><b>Yükselt: ${esc(this.name(r.targetBuildId))}</b><span class="small">${esc(r.effect || '')}</span><div class="ins">${un ? cost : esc(g.knowledge.unlockText(r))}</div>${un && !target ? '<span class="why">Hedef yapıya yaklaş (4 karo)</span>' : ''}${target?.upgrades.includes(r.id) ? '<span class="why">Takılı</span>' : ''}</div>${un && target && !target.upgrades.includes(r.id) ? `<button data-up="${r.id}" data-t="${target.uid}">Uygula</button>` : ''}</div>`;
      };
      const sites = Object.values(g.state.buildingState.byId).filter((b) => b.stage === 'site');
      this.panelEl.querySelector('.pb').innerHTML = `<p class="small">Hazır ev modelleri ve serbest yerleştirilen eşyalar. Malzemeler inşaat alanına aşama aşama teslim edilir (emanet).</p>
        ${sites.length ? `<h3>Süren inşaatlar</h3>${sites.map((b) => `<div class="recipe">${this.ico(`build/${b.buildId}/ghost`, 40)}<div class="rt"><b>${esc(this.name(b.buildId))}</b><span class="small">Aşama ${Math.min(b.stageIndex + 1, b.stages.length)}/${b.stages.length}: ${esc(b.stages[b.stageIndex]?.label || 'Tamamla')}</span><div class="ins">${Object.entries(g.build.stageRemaining(b)).map(([id, n]) => `<span class="in">${this.itemIco(id, 20)}${n}</span>`).join('')}</div></div><button class="ghost" data-cancelsite="${b.uid}">İptal</button></div>`).join('')}` : ''}
        <h3>Yapılar</h3><div class="recipes">${recs.map(card).join('')}</div><h3>Yükseltmeler (aynı yapıyı korur)</h3><div class="recipes">${ups.map(upCard).join('')}</div>`;
    };
    this.openPanel('UI_BUILD', 'İnşa', '', (e) => {
      const t = e.target.closest('[data-place],[data-up],[data-cancelsite]'); if (!t) return;
      if (t.dataset.place) { this.startPlacement(t.dataset.place); return; }
      if (t.dataset.up) { const r = g.build.applyUpgrade(t.dataset.up, t.dataset.t); if (r.ok) this.toast('Yükseltme uygulandı'); else if (r.code === 'MISSING_ITEMS') this.toast('Malzeme eksik'); }
      if (t.dataset.cancelsite) g.build.cancelSite(t.dataset.cancelsite);
      draw();
    }, { wide: true });
    this.reopen = draw; draw();
  }
  nearestBuild(buildId, range) {
    let best = null, bd = range; for (const b of Object.values(this.g.state.buildingState.byId)) if (b.buildId === buildId && b.stage === 'complete') { const d = this.g.world.playerDistToRect(b); if (d <= bd) { bd = d; best = b; } } return best;
  }
  startPlacement(recipeId) {
    const g = this.g; const r = this.content.recipes.get(recipeId);
    this.closePanel();
    const [px, py] = g.world.playerTile(); const [w, h] = g.build.footprint(r.outputId);
    const fv = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[g.state.player.facing];
    this.placement = { recipeId, buildId: r.outputId, tile: [px + fv[0] * (w + 1) - Math.floor(w / 2), py + fv[1] * (h + 1) - (fv[1] < 0 ? h - 1 : 0)], valid: false };
    this.placementActive = true; this.validatePlacement();
    const bar = document.getElementById('placebar');
    bar.innerHTML = `<span id="place-why"></span><button data-pl="ok">Onayla</button><button class="ghost" data-pl="cancel">İptal</button><span class="small">Haritada dokunarak taşı</span>`;
    bar.classList.remove('hidden');
    bar.onclick = (e) => {
      const a = e.target.closest('[data-pl]')?.dataset.pl; if (!a) return;
      if (a === 'ok') { const res = g.build.place(this.placement.buildId, this.placement.tile, { recipeId }); if (res.ok) { this.toast('İnşaat alanı hazır — malzemeleri teslim et'); this.endPlacement(); } else this.validatePlacement(); }
      if (a === 'cancel') this.endPlacement();
    };
  }
  movePlacement(tile) { if (!this.placement) return; const [w, h] = this.g.build.footprint(this.placement.buildId); this.placement.tile = [tile[0] - Math.floor(w / 2), tile[1] - h + 1]; this.validatePlacement(); }
  validatePlacement() { const pl = this.placement; const reasons = this.g.build.validatePlacement(pl.buildId, pl.tile, pl.recipeId); pl.valid = !reasons.length; const el = document.getElementById('place-why'); if (el) el.textContent = reasons[0] || 'Uygun konum'; }
  endPlacement() { this.placement = null; this.placementActive = false; document.getElementById('placebar').classList.add('hidden'); }

  // ---------- map ----------
  openMap() {
    const g = this.g; const terr = this.content.terrain;
    this.openPanel('UI_MAP', 'Harita', '<canvas id="mapcv"></canvas><div class="legend small">● Keşfedilen noktalar · ▲ Sen · ■ Kamplar (kırmızı) · Kesik çizgiler: sal rotaları</div>', null, { wide: true });
    const cv = this.panelEl.querySelector('#mapcv'); const grid = g.world.grid;
    const cave = grid.isCave; const W = grid.w, H = grid.h;
    cv.width = W; cv.height = H; const c = cv.getContext('2d'); const img = c.createImageData(W, H);
    const ex = g.state.world.exploredCells; const scene = g.world.sceneId; const mapTable = Object.values(g.state.buildingState.byId).some((b) => b.buildId === 'BUILD_MAP_TABLE' && b.stage === 'complete');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; const code = grid.tiles[grid.i(x, y)];
      const seen = ex[`${scene}:${Math.floor(x / 16)}:${Math.floor(y / 16)}`] || (mapTable && !cave && grid.island[grid.i(x, y)] === 1);
      const col = cave ? (code === 0 ? '#1d2126' : this.content.caveTiles[code].color) : terr[code].colorHex;
      const v = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
      const k = seen ? 1 : 0.18; img.data[i] = v[0] * k + (seen ? 0 : 20); img.data[i + 1] = v[1] * k + (seen ? 0 : 30); img.data[i + 2] = v[2] * k + (seen ? 0 : 45); img.data[i + 3] = 255;
      if (seen && grid.road[grid.i(x, y)]) { img.data[i] = 216; img.data[i + 1] = 187; img.data[i + 2] = 139; }
    }
    c.putImageData(img, 0, 0);
    if (!cave) {
      c.setLineDash([3, 3]); c.strokeStyle = 'rgba(255,255,255,0.5)';
      for (const r of this.content.db.NavigationDB.seaRoutes) { c.beginPath(); r.raftPathAtlas.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
      c.setLineDash([]);
      for (const p of g.exploration.list) { const st = g.state.story.poiStates[p.id]; if (!st?.discovered) continue; c.fillStyle = st.rewardClaimed ? '#5cdc7a' : '#f2d054'; c.fillRect(p.ax - 2, p.ay - 2, 5, 5); }
      for (const b of Object.values(g.state.buildingState.byId)) { c.fillStyle = b.buildId === 'BUILD_CAMP_MARKER' ? '#e84a3a' : '#ffffff'; c.fillRect(b.tile[0], b.tile[1], 2, 2); }
      if (g.escape.rescueAvailable()) { const [rx, ry] = g.escape.rescueTile(); c.fillStyle = '#ff4040'; c.fillRect(rx - 3, ry - 3, 7, 7); }
    }
    const [tx, ty] = g.world.playerTile(); c.fillStyle = '#ff5050'; c.beginPath(); c.moveTo(tx, ty - 5); c.lineTo(tx + 4, ty + 4); c.lineTo(tx - 4, ty + 4); c.fill();
  }

  // ---------- journal ----------
  openJournal(tab = 'story') {
    const g = this.g; const s = g.state;
    const draw = () => {
      let body = '';
      if (tab === 'story') {
        const recs = [...this.content.stories.values()];
        body = recs.map((r) => s.story.storyRecordsRead.includes(r.id) ? `<details class="story"><summary><b>${esc(r.title)}</b> <span class="small">${esc(this.content.pois.get(r.sourcePoiId)?.name || 'Kendi notların')}</span></summary><p>${esc(r.body)}</p><p class="small">${esc(r.hintRole)}</p></details>` : `<div class="story locked"><b>??? </b><span class="small">Henüz bulunmadı</span></div>`).join('');
      } else if (tab === 'skills') {
        body = [...this.content.skills.values()].map((sk) => { const st = s.skills[sk.id]; const lv = g.skills.level(sk.id); const th = sk.levelThresholdsTotalXp; const next = th[lv] ?? th[th.length - 1]; const prev = th[lv - 1]; const pct = lv >= 5 ? 100 : ((st.xp - prev) / (next - prev)) * 100;
          return `<div class="skill">${this.ico(SKILL_ICON[sk.id], 30)}<div><b>${esc(sk.name)}</b> · ${esc(sk.levels[lv - 1])} (${lv}/5)<div class="pbar"><i style="width:${pct}%"></i></div><span class="small">${st.xp} XP · ${sk.perks.filter((p) => p.level <= lv).map((p) => Object.entries(p).filter(([k]) => k !== 'level').map(([k, v]) => `${k}: ${v}`).join(', ')).join(' | ') || 'Henüz yetenek yok'}</span></div></div>`; }).join('');
      } else if (tab === 'plans') {
        body = [...this.content.blueprints.entries()].map(([id, name]) => `<div class="bp ${s.story.learnedBlueprints.includes(id) ? '' : 'locked'}">${s.story.learnedBlueprints.includes(id) ? '✓' : '·'} <b>${esc(name)}</b> <span class="small">${s.story.learnedBlueprints.includes(id) ? esc(this.content.db.RecipeDB.blueprintSources[id]) : 'Sabit bir keşif noktasında'}</span></div>`).join('') + '<p class="small">Planlar isteğe bağlıdır; iki kaçış yolu için zorunlu değildir.</p>';
      } else if (tab === 'collection') {
        body = '<div class="codex">' + [...this.content.species.values()].map((sp) => { const seen = s.ecosystem.natureJournal.includes(sp.id); const fj = s.ecosystem.fishJournal[sp.id]; return `<div class="cx ${seen ? '' : 'locked'}">${seen ? this.ico(`codex/${sp.id}`, 40) : '<i class="q">?</i>'}<span>${seen ? esc(sp.name) : '???'}</span>${fj ? `<span class="small">${fj.caughtCount} av · en iyi ${fj.bestWeight} cm</span>` : ''}</div>`; }).join('') + '</div>';
      } else if (tab === 'escape') {
        const k = g.knowledge; const nav = g.escape.navSources();
        const has = (id) => s.story.specialItemsGranted.includes(id) ? '✓' : '·';
        const boat = g.escape.boat(); const st = g.escape.station();
        body = `<div class="esc"><h3>${this.ico('icon/CMP_SAIL', 24)} Kendi yelkenlinle</h3><p>${nav >= 2 ? '✓' : '·'} Seyir kayıtları: ${nav}/2 (Balıkçı kulübesi, Gözlem tepesi, Kaptan kamarası — herhangi ikisi)</p><p>${boat ? (boat.stage === 'complete' ? '✓ Yelkenli tamamlandı' : `· Yelkenli: aşama ${boat.stageIndex}/${boat.stages.length}`) : '· Yelkenli projesi başlamadı (Denizcilik masası + iki seyir kaydı)'}</p><p>· Uygun hava: açık veya hafif yağmur</p>${s.story.endingAchievements.includes('ESCAPE_SAIL') ? '<p class="done">FİNAL TAMAMLANDI</p>' : ''}
          <h3>${this.ico('icon/CMP_ANTENNA', 24)} Acil yardım sinyali</h3><p>${has('SPC_TX_MODULE')} Verici modülü (Radyo Atölyesi)</p><p>${has('SPC_RADIO_NOTE')} Frekans notu (Dağ Röle Sığınağı)</p><p>${has('SPC_SOLAR_CORE')} Güneş çekirdeği (Fener İstasyonu) <b>veya</b> ${has('SPC_GEN_CORE')} Jeneratör çekirdeği (Araştırma Meydanı)</p><p>${st ? (st.stage === 'complete' ? '✓ Haberleşme istasyonu kuruldu' : '· İstasyon inşa ediliyor') : '· Fener yanında haberleşme istasyonu'}</p><p>${s.world.worldFlags.SIGNAL_TUNED ? '✓' : '·'} Frekans ayarı</p><p>${s.world.sos?.sent ? `✓ SOS gönderildi (gün ${s.world.sos.signalDay}) — kurtarma gün ${s.world.sos.rescueDueDay}` : '· Otomatik SOS'}</p>${s.story.endingAchievements.includes('ESCAPE_RADIO') ? '<p class="done">FİNAL TAMAMLANDI</p>' : ''}
          <p class="small">Adada başka insan yok; telsizde kimseyle konuşulmaz — yalnızca otomatik sinyal ve onay.</p><p class="small">${k.storyFlag('TWO_NAV_SOURCES') ? 'Tekne rotası tanındı. ' : ''}${k.storyFlag('RADIO_STATION_DISCOVERED') ? 'Telsiz rotası tanındı.' : ''}</p></div>`;
      } else {
        const st = g.escape.endingStats(s);
        body = `<table class="stats">${Object.entries({ 'Hayatta kalınan gün': st.daysSurvived, 'Keşfedilen nokta': `${st.poisDiscovered}/38`, 'Usta ustalık': `${st.skillsMastered}/8`, 'Öğrenilen malzeme': st.craftsLearned, 'Gözlenen tür': `${st.animalSpeciesObserved}/25`, 'Kurulan yapı': st.buildsPlaced, 'Okunan kayıt': `${s.story.storyRecordsRead.length}/15`, 'Öğrenilen plan': `${s.story.learnedBlueprints.length}/20`, 'Çözülen bulmaca': `${Object.values(s.story.puzzlesById).filter((p) => p.solved).length}/12`, 'Finaller': st.endings.length }).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
      }
      const tabs = { story: 'Kayıtlar', skills: 'Ustalık', plans: 'Planlar', collection: 'Koleksiyon', escape: 'Kurtuluş', stats: 'İstatistik' };
      this.panelEl.querySelector('.pb').innerHTML = `<div class="tabs">${Object.entries(tabs).map(([k, v]) => `<button class="chip ${k === tab ? 'on' : ''}" data-tab="${k}">${v}</button>`).join('')}</div><div class="tabbody">${body}</div>`;
    };
    this.openPanel('UI_JOURNAL', 'Ada Günlüğü', '', (e) => { const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; draw(); } }, { wide: true });
    this.reopen = draw; draw();
  }

  // ---------- pets ----------
  openPets(focus = null) {
    const g = this.g;
    const draw = () => {
      const fr = Object.values(g.state.ecosystem.tamedFriends);
      this.panelEl.querySelector('.pb').innerHTML = fr.length ? fr.map((f) => `<div class="pet">${this.ico(`codex/${f.speciesId}`, 44)}<div><b>${esc(f.name)}</b> (${f.kind === 'parrot' ? 'Papağan' : 'Maymun'}) · ${g.wildlife.trustTier(f.trust)} ${Math.round(f.trust)}/100<div class="pbar"><i style="width:${f.trust}%"></i></div>
        <span class="small">${f.activeFollower ? 'Seni takip ediyor' : f.mode === 'HOME' ? 'Kampta' : 'Bekliyor'} · ${f.daily?.fed ? 'Bugün tok' : 'Aç — yardımlar kapalı'} · ${f.kind === 'parrot' ? 'Gizli ganimeti işaretler (günde 2)' : 'Günde bir meyve getirir'}</span></div>
        <div class="col"><button data-pet="${f.id}" data-c="feed">Besle</button><button data-pet="${f.id}" data-c="FOLLOW">Takip</button><button data-pet="${f.id}" data-c="STAY">Bekle</button><button data-pet="${f.id}" data-c="RETURN_TO_CAMP">Kampa dön</button></div></div>`).join('') + '<p class="small">Dostlar ölmez ve kaybolmaz; aynı anda yalnızca biri takip eder.</p>'
        : '<p>Henüz bir hayvan dostun yok. Koruluk ve ormanda papağan (orman kuşu) ya da maymunla karşılaşınca meyve ile yaklaş.</p>';
    };
    this.openPanel('UI_PETS', 'Hayvan dostları', '', (e) => { const t = e.target.closest('[data-pet]'); if (!t) return; g.wildlife.petInteract(t.dataset.pet, t.dataset.c); draw(); });
    this.reopen = draw; draw(); void focus;
  }

  // ---------- settings / pause ----------
  openSettings(fromMenu = false) {
    const st = this.app.settings;
    const draw = () => {
      const sl = (k, l) => `<label class="sl">${l}<input type="range" min="0" max="1" step="0.05" value="${st[k]}" data-set="${k}"></label>`;
      this.panelEl.querySelector('.pb').innerHTML = `${sl('musicVolume', 'Müzik')}${sl('sfxVolume', 'Efektler')}${sl('ambienceVolume', 'Ortam sesi')}
        <div class="opt"><span>Ses</span><button class="chip ${st.muted ? 'on' : ''}" data-tog="muted">${st.muted ? 'Kapalı' : 'Açık'}</button>${this.app.audio.unsupported ? '<span class="why">Tarayıcı Web Audio desteklemiyor — ses kapalı</span>' : ''}</div>
        <div class="opt"><span>Görüntü kalitesi</span>${['LOW', 'MID', 'HIGH'].map((q) => `<button class="chip ${st.graphicsQuality === q ? 'on' : ''}" data-q="${q}">${{ LOW: 'Düşük', MID: 'Orta', HIGH: 'Yüksek' }[q]}</button>`).join('')}</div>
        <div class="opt"><span>FPS hedefi</span>${[30, 60].map((f) => `<button class="chip ${st.fpsTarget === f ? 'on' : ''}" data-fps="${f}">${f}</button>`).join('')}</div>
        <div class="opt"><span>Titreşim</span><button class="chip ${st.vibration ? 'on' : ''}" data-tog="vibration">${st.vibration ? 'Açık' : 'Kapalı'}</button><span>Hareket azalt</span><button class="chip ${st.reducedMotion ? 'on' : ''}" data-tog="reducedMotion">${st.reducedMotion ? 'Açık' : 'Kapalı'}</button></div>
        <div class="row wrap"><button data-s="fullscreen">${this.ico('ui/fullscreen', 22)} Tam ekran</button>${fromMenu ? '' : `<button data-s="save">${this.ico('ui/save', 22)} Kaydet</button><button data-s="export">Dışa aktar (JSON)</button><button data-s="menu">Ana menü</button>`}</div>
        <p class="small">Tarayıcı depolaması temizlenebilir; düzenli olarak JSON yedeği al.</p>`;
    };
    const onClick = (e) => {
      const t = e.target.closest('[data-tog],[data-q],[data-fps],[data-s]'); if (!t) return;
      if (t.dataset.tog) st[t.dataset.tog] = !st[t.dataset.tog];
      if (t.dataset.q) { st.graphicsQuality = t.dataset.q; }
      if (t.dataset.fps) st.fpsTarget = +t.dataset.fps;
      if (t.dataset.s === 'fullscreen') this.app.toggleFullscreen();
      if (t.dataset.s === 'save') this.app.persistence.checkpoint('manual').then(() => this.toast('Kaydedildi'));
      if (t.dataset.s === 'export') this.app.exportCurrent();
      if (t.dataset.s === 'menu') { this.closePanel(); this.app.toMenu(); return; }
      this.app.applySettings(); draw();
    };
    this.openPanel('UI_SETTINGS', 'Ayarlar', '', onClick);
    this.panelEl.addEventListener('input', (e) => { const k = e.target.dataset.set; if (k) { st[k] = +e.target.value; this.app.applySettings(); } });
    this.reopen = draw; draw();
  }
  openPause() {
    this.openPanel('UI_PAUSE', 'Duraklatıldı', `<div class="col"><button data-pp="resume" class="big">Devam</button><button data-pp="save">Kaydet</button><button data-pp="settings">Ayarlar</button><button data-pp="menu">Ana menü</button></div>`, (e) => {
      const a = e.target.closest('[data-pp]')?.dataset.pp; if (!a) return;
      if (a === 'resume') this.closePanel();
      if (a === 'save') this.app.persistence.checkpoint('manual').then(() => this.toast('Kaydedildi'));
      if (a === 'settings') { this.closePanel(); this.openSettings(); }
      if (a === 'menu') { this.closePanel(); this.app.toMenu(); }
    });
  }

  // ---------- storage ----------
  openStorage(containerId, title, ownerUid) {
    const g = this.g; const inv = g.inventory;
    const draw = () => {
      const cont = inv.cont(containerId); const me = inv.cont(PLAYER_INV);
      const grid = (c) => c.slots.map((u, i) => { const a = u ? inv.item(u) : null; return `<button class="islot" data-c="${c.id}" data-i="${i}">${a ? this.itemIco(a.itemId, 32) + `<em>${a.durability != null ? Math.round((a.durability / a.maxDurability) * 100) + '%' : a.quantity}</em>` : ''}</button>`; }).join('');
      this.panelEl.querySelector('.pb').innerHTML = `<div class="two"><div><h3>${esc(title)} ${cont.unitCap ? `(${inv.unitCount(cont)}/${cont.unitCap})` : ''}</h3><div class="invgrid">${grid(cont)}</div><button data-all="take">Hepsini al</button></div><div><h3>Çanta</h3><div class="invgrid">${grid(me)}</div><button data-all="put">Hepsini koy</button></div></div><p class="small">Dokun: diğer tarafa taşı.${cont.filter ? ' Bu depo yalnız uygun eşyaları kabul eder.' : ''}</p>`;
    };
    this.openPanel('UI_STORAGE', title, '', (e) => {
      const s = e.target.closest('.islot'); const all = e.target.closest('[data-all]');
      if (s && inv.cont(s.dataset.c).slots[+s.dataset.i]) {
        const from = s.dataset.c, to = from === PLAYER_INV ? containerId : PLAYER_INV;
        const r = g.store.transaction(null, (tx) => inv.moveSlot(tx, from, +s.dataset.i, to)); if (!r.ok) this.toast({ INVENTORY_FULL: 'Yer yok', FILTER_REJECTS: 'Bu depo bu eşyayı almaz', NON_DROPPABLE: 'Özel parça bırakılamaz', NO_WATER_VESSEL: 'Su kabı yok' }[r.code] || r.code);
      }
      if (all) { const from = all.dataset.all === 'take' ? containerId : PLAYER_INV, to = from === PLAYER_INV ? containerId : PLAYER_INV; inv.cont(from).slots.forEach((u, i) => { if (u) g.store.transaction(null, (tx) => inv.moveSlot(tx, from, i, to)); }); }
      if (ownerUid && g.state.world.dropBags[ownerUid] && inv.cont(containerId).slots.every((u) => !u)) { delete g.state.world.dropBags[ownerUid]; delete g.state.containers.byId[containerId]; this.closePanel(); return; }
      draw();
    }, { wide: true });
    this.reopen = draw; draw();
  }

  // ---------- puzzles ----------
  openPuzzle(pid) {
    const g = this.g; const def = this.content.puzzles.get(pid); let hint = 0;
    const draw = () => {
      const st = g.puzzles.stateOf(pid); const u = st.uiState; const w = def.uiWidget;
      const reasons = g.puzzles.canStart(pid);
      let ctrl = '';
      const names = { valves: ['A', 'B', 'C'], pins: ['1', '2', '3'], gears: ['1', '2', '3'], directions: ['Fener', 'Kaya', 'Ada'], channels: ['1', '2', '3'], contacts: ['1', '2', '3', '4'], dials: ['1', '2', '3'] };
      const dirName = (v) => ['K', 'D', 'G', 'B'][v];
      if (w === 'THREE_TOGGLE') ctrl = u.valves.map((v, i) => `<button class="pz ${v ? 'on' : ''}" data-act="${def.allowedActions[i]}">${['Sol', 'Orta', 'Sağ'][i]} vana<br><b>${v ? 'AÇIK' : 'KAPALI'}</b></button>`).join('');
      else if (w === 'TWO_ROTATORS') ctrl = u.wheelAngles.map((v, i) => `<div class="pzc"><div class="dial" style="transform:rotate(${v * 90}deg)">➤</div><button data-act="ROTATE_LEFT" data-arg="${i}">⟲</button><button data-act="ROTATE_RIGHT" data-arg="${i}">⟳</button></div>`).join('');
      else if (w === 'THREE_PINS') ctrl = u.pins.map((v, i) => `<button class="pz" data-act="CYCLE_PIN_${i + 1}">Pim ${i + 1}<br><b>${'▮'.repeat(v) || '—'}</b></button>`).join('');
      else if (w === 'THREE_ROTATORS') { const key = Object.keys(u)[0]; ctrl = u[key].map((v, i) => `<button class="pz" data-act="${def.allowedActions[i]}">${names[key]?.[i] || i + 1}<div class="dial" style="transform:rotate(${v * 90}deg)">➤</div>${key === 'directions' ? dirName(v) : v}</button>`).join(''); }
      else if (w === 'FOUR_CONNECTORS') ctrl = u.contacts.map((v, i) => `<button class="pz" data-act="CYCLE_CONTACT_${i + 1}">Uç ${i + 1}<br><b>${['—', 'Giriş', 'Güvenlik', 'Çıkış'][v]}</b></button>`).join('');
      else if (w === 'THREE_DIALS') ctrl = u.dials.map((v, i) => `<button class="pz" data-act="CYCLE_DIAL_${i + 1}">Kadran ${i + 1}<br><b>${v}</b></button>`).join('');
      else if (w === 'THREE_STEP_SEQUENCE') ctrl = def.allowedActions.map((a) => `<button class="pz" data-act="${a}">${{ LATCH: 'Mandal', WIRE_RING: 'Kablo halkası', TEST_LEVER: 'Test kolu', RESET: 'Sıfırla' }[a]}</button>`).join('') + `<p>Sıra: ${u.completedSteps.join(' → ') || '—'}</p>`;
      else if (w === 'THREE_SEQUENCE') ctrl = def.allowedActions.map((a) => `<button class="pz" data-act="${a}">${a === 'RESET' ? 'Sıfırla' : this.itemIco({ SELECT_SHELL: 'MAT_SEASHELL', SELECT_WAVE: 'MAT_SEAWEED', SELECT_ARROW: 'TOOL_COMPASS' }[a], 34)}</button>`).join('') + `<p>Sıra: ${u.sequence.length}/3</p>`;
      const clue = def.clueStoryId && g.state.story.storyRecordsRead.includes(def.clueStoryId) ? `<details><summary>İlgili kayıt</summary><p>${esc(this.content.stories.get(def.clueStoryId).body)}</p></details>` : '';
      this.panelEl.querySelector('.pb').innerHTML = `<p class="clue">“${esc(def.clueTextShownAtPoi)}”</p>${clue}${reasons.length ? `<p class="why">${esc(reasons[0])}</p>` : ''}<div class="pzrow">${ctrl}</div>${st.solved ? '<p class="done">ÇÖZÜLDÜ</p>' : ''}
        <div class="row"><button class="ghost" data-hint>İpucu (${hint}/3)</button><span class="small">${hint ? esc(g.puzzles.hint(pid, hint)) : 'Yanlış denemeler hiçbir malzemeyi tüketmez.'}</span></div>`;
    };
    this.openPanel('UI_PUZZLE', def.name, '', (e) => {
      if (e.target.closest('[data-hint]')) { hint = Math.min(3, hint + 1); draw(); return; }
      const t = e.target.closest('[data-act]'); if (!t) return;
      const r = g.puzzles.action(pid, t.dataset.act, t.dataset.arg != null ? +t.dataset.arg : null); this.vibrate(8);
      draw(); if (r.solved) setTimeout(() => { if (this.openId === 'UI_PUZZLE') this.closePanel(); }, 900);
    });
    this.reopen = draw; draw();
  }

  // ---------- fishing ----------
  updateFishingUI() {
    const el = document.getElementById('fishing'); const s = this.g.fishing.session;
    if (!s) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const lo = s.lo ?? 25, hi = s.hi ?? 75;
    el.innerHTML = `<div class="fh">${s.phase === 'WAIT' ? 'Şamandırayı izle…' : s.phase === 'BITE' ? '<b class="blink">VURUŞ! Eylem’e dokun</b>' : 'Gerilimi yeşil alanda tut — Eylem basılı: sar'}</div>
      <div class="tension"><div class="safe" style="left:${lo}%;width:${hi - lo}%"></div><i style="left:${s.tension}%"></i></div>
      <div class="pbar"><i style="width:${(s.progress || 0) * 100}%"></i></div><button data-fish="cancel" class="ghost">Oltayı topla</button>`;
    el.onclick = (e) => { if (e.target.closest('[data-fish]')) this.g.fishing.cancel(); };
  }

  // ---------- traps / plots / water / boat ----------
  openTrap(uid) {
    const g = this.g; const t = g.state.productionState.trapsById[uid]; const def = this.content.traps.get(t.buildId);
    const draw = () => {
      this.panelEl.querySelector('.pb').innerHTML = `<p>${esc(def.name)} · Kapasite ${t.upgraded ? def.upgradedCapacity : def.capacity} · Günlük ${t.upgraded ? 2 : 1} deneme</p><p>Av: ${t.storedCatch.length ? t.storedCatch.map((c) => esc(this.content.species.get(c.id).name)).join(', ') : 'yok'}</p><p>Yem: ${t.bait ? esc(this.name(t.bait)) : 'yok'}</p>
        <div class="row wrap">${def.validBaitItemIds.map((b) => `<button data-bait="${b}" ${g.inventory.hasItem(b) && !t.bait ? '' : 'disabled'}>${this.itemIco(b, 22)} Yem koy</button>`).join('')}<button data-claim ${t.storedCatch.length ? '' : 'disabled'}>Avı al</button></div><p class="small">Yem yalnızca günlük deneme yapıldığında tükenir. En fazla 6 aktif tuzak.</p>`;
    };
    this.openPanel('UI_TRAP', 'Tuzak', '', (e) => { const b = e.target.closest('[data-bait]'); if (b) g.traps.setBait(uid, b.dataset.bait); if (e.target.closest('[data-claim]')) g.traps.claim(uid); draw(); });
    this.reopen = draw; draw();
  }
  openPlot(uid) {
    const g = this.g;
    const draw = () => {
      const p = g.farm.plot(uid); const crop = p.cropId ? this.content.crops.get(p.cropId) : null;
      const seeds = [...this.content.cropBySeed.keys()].filter((s) => g.inventory.hasItem(s));
      this.panelEl.querySelector('.pb').innerHTML = crop ? `<div class="row">${this.ico(`crop/${crop.id}/${g.farm.stage(p)}`, 64)}<div><b>${esc(crop.name)}</b><br>Gelişim ${p.growthDays}/${crop.growGameDays} gün ${p.ready ? '· <b>HASAT HAZIR</b>' : ''}<br><span class="small">${g.climate.state().plantRainWatered ? 'Bugün yağmur suluyor' : p.wateredDay === g.state.clock.dayIndex ? 'Bugün sulandı' : 'Susuz — gelişme duraklar (bitki ölmez)'}${p.fertilized ? ' · Gübreli' : ''}</span></div></div>
        <div class="row wrap"><button data-x="water" ${p.ready ? 'disabled' : ''}>Sula</button><button data-x="fert" ${g.inventory.hasItem('CMP_COMPOST') && !p.fertilized ? '' : 'disabled'}>Kompost ver</button><button data-x="harvest" ${p.ready ? '' : 'disabled'}>Hasat et</button></div>`
        : `<p>Boş ekim yatağı. Tohum seç:</p><div class="row wrap">${seeds.map((s) => `<button data-seed="${s}">${this.itemIco(s, 26)} ${esc(this.name(s))}</button>`).join('') || '<span class="small">Çantada tohum yok</span>'}</div>`;
    };
    this.openPanel('UI_INVENTORY', 'Ekim yatağı', '', (e) => {
      const s = e.target.closest('[data-seed]'); const x = e.target.closest('[data-x]')?.dataset.x;
      if (s) g.farm.plant(uid, s.dataset.seed); if (x === 'water') g.farm.water(uid); if (x === 'fert') g.farm.fertilize(uid); if (x === 'harvest') g.farm.harvest(uid);
      draw();
    });
    this.reopen = draw; draw();
  }
  openWater(uid) {
    const g = this.g; const b = g.state.buildingState.byId[uid];
    const draw = () => {
      const w = g.state.waterInfrastructure.byBuildUid[uid];
      if (!w) { this.panelEl.querySelector('.pb').innerHTML = `<p>${esc(this.name(b.buildId))}: kirli suyu süzmek için Üretim'i kullan.</p><button data-x="craft">Filtreyi kullan</button>`; return; }
      const tank = w.type === 'BUILD_WATER_TANK';
      this.panelEl.querySelector('.pb').innerHTML = `<p>${esc(this.name(b.buildId))}: ${(w.volumeCenti / 100).toFixed(2)}/${w.capacityCenti / 100} porsiyon · ${w.mode === 'CLEAN' ? 'Temiz su' : w.mode === 'RAW' ? 'Ham su (sulama)' : 'Boş'}</p>
        <div class="row wrap">${w.mode === 'CLEAN' ? '<button data-x="drink">Doğrudan iç</button>' : ''}<button data-x="take" ${w.volumeCenti >= 100 ? '' : 'disabled'}>Kaba doldur</button>${tank ? `<button data-x="pourd" ${g.inventory.hasItem('WATER_DIRTY') ? '' : 'disabled'}>Ham su dök</button><button data-x="pourc" ${g.inventory.hasItem('WATER_CLEAN') ? '' : 'disabled'}>Temiz su dök</button>` : ''}</div>
        <p class="small">${tank ? 'Depo ilk dolum türünü korur; temiz ve ham su karışmaz. Sulama ünitesi yalnız ham su kullanır.' : 'Yağmur toplayıcı her yağışta temiz su biriktirir (kapasite sınırlı).'}</p>`;
    };
    this.openPanel('UI_STORAGE', 'Su', '', (e) => {
      const x = e.target.closest('[data-x]')?.dataset.x; if (!x) return;
      if (x === 'drink') g.survival.drinkFromBuild(uid); if (x === 'take') g.climate.takeFromBuild(uid, 2);
      if (x === 'pourd') g.climate.fillTank(uid, 'WATER_DIRTY', 99); if (x === 'pourc') g.climate.fillTank(uid, 'WATER_CLEAN', 99);
      if (x === 'craft') { this.closePanel(); this.openCraft(uid); return; }
      draw();
    });
    this.reopen = draw; draw();
  }
  openBoat(uid) {
    const g = this.g;
    const draw = () => {
      const b = g.state.buildingState.byId[uid]; const reasons = g.escape.departureCheck();
      const ups = (this.content.upgradesByTarget.get('BUILD_ESCAPE_BOAT') || []).map((r) => `<span class="${b.upgrades.includes(r.id) ? 'ok' : ''}">${b.upgrades.includes(r.id) ? '✓' : '·'} ${esc(r.effect)}</span>`).join('<br>');
      this.panelEl.querySelector('.pb').innerHTML = `${this.ico('build/BUILD_ESCAPE_BOAT/complete', 160)}<p>Seyir kayıtları: ${g.escape.navSources()}/3 (en az 2) · Hava: ${WNAME[g.climate.weather()]}${g.climate.forecast() ? ` · Yarın: ${WNAME[g.climate.forecast()]}` : ''}</p><p class="small">${ups}</p>${reasons.length ? `<p class="why">${esc(reasons[0])}</p>` : '<p class="done">Yola çıkmaya hazır</p>'}<button class="big" data-x="go" ${reasons.length ? 'disabled' : ''}>Yola çık (final)</button><p class="small">Başarısızlıkta tekne ve hikâye parçaları kaybolmaz; güvenli kıyıya dönersin.</p>`;
    };
    this.openPanel('UI_ENDING_STATS', 'Kaçış yelkenlisi', '', (e) => { if (e.target.closest('[data-x="go"]')) { this.closePanel(); g.escape.castOff(); } });
    this.reopen = draw; draw();
  }

  showEnding(routeId, stats) {
    const g = this.g;
    const html = `<div class="ending">${this.ico(routeId === 'ESCAPE_SAIL' ? 'scene/sea_success/foreground' : 'scene/radio_rescue/foreground', 0, 'endart')}<h2>${routeId === 'ESCAPE_SAIL' ? 'Ufka yelken açtın' : 'Kurtarma teknesi seni aldı'}</h2>
      <p>${routeId === 'ESCAPE_SAIL' ? 'Resifleri geçip açık denize ulaştın. Kendi yaptığın yelkenliyle evine dönüyorsun.' : 'Otomatik SOS sinyali iki gün sonra karşılık buldu. Kimseyle konuşmadan, sessizce tekneye bindin.'}</p>
      <table class="stats">${Object.entries({ 'Gün': stats.daysSurvived, 'Keşif': `${stats.poisDiscovered}/38`, 'Usta ustalık': stats.skillsMastered, 'Öğrenilen malzeme': stats.craftsLearned, 'Gözlenen tür': stats.animalSpeciesObserved, 'Kurulan yapı': stats.buildsPlaced, 'Tamamlanan finaller': stats.endings.length + '/2' }).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
      <button class="big" data-end="continue">Adaya dön ve devam et</button></div>`;
    this.openPanel('UI_ENDING_STATS', 'Kurtuluş', html, (e) => { if (e.target.closest('[data-end]')) { g.finale.close(); this.closePanel(); this.toast('Ada hayatına devam — tüm yapılar, dostlar ve başarılar yerinde.'); } }, { wide: true });
    const art = this.panelEl.querySelector('.endart'); if (art) art.setAttribute('style', this.atlas.css(routeId === 'ESCAPE_SAIL' ? 'scene/sea_success/foreground' : 'scene/radio_rescue/foreground', 512));
  }

  // ================= feedback =================
  toast(text, kind = '') {
    (this.toastLog ||= []).push(text); if (this.toastLog.length > 100) this.toastLog.shift();
    const d = document.createElement('div'); d.className = `toast ${kind}`; d.textContent = text;
    this.toastEl.appendChild(d); while (this.toastEl.children.length > 4) this.toastEl.firstChild.remove();
    setTimeout(() => d.classList.add('out'), 2600); setTimeout(() => d.remove(), 3200);
  }
  sfx(id) { this.app.audio.play(id); }
  vibrate(ms) { if (this.app.settings.vibration && navigator.vibrate) try { navigator.vibrate(ms); } catch { /* unsupported */ } }
}
export { TILE, HOUSES, WEATHERS };
