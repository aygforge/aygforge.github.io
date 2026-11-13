// DOM tabanlı HUD ve panel sistemi. Bir panel açıkken oyun simülasyonu duraklar (WorldScene.update).
import { PANELS } from './panels.js';
import { SEASON_NAMES, WEATHER_NAMES, REPUTATION_TITLES } from '../data/supplement.js';
import { fmtTime, dayOfSeason, yearOf } from '../systems/calendar.js';
import { nextTrain } from '../systems/trains.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class UI {
  constructor(app) {
    this.app = app; this.root = document.getElementById('ui'); this.panel = null; this.args = null; this.frames = null; this.hudT = 0; this.state = {}; this.highlightTables = null;
    this.root.innerHTML = `<div id="hud" style="display:none"><div id="hud-tl" class="hudbox"></div><div id="hud-tc" class="hudbox"></div><div id="hud-tr" class="hudbox"></div><div id="hud-quest" class="hudbox"></div><div id="hud-orders" class="hudbox"></div><div id="hint" class="hudbox" style="display:none"></div><div id="hotbar"></div><div id="placebar" class="frame"></div></div><div id="toasts"></div><div id="modal"></div><div id="fade"></div>`;
    this.$ = (id) => this.root.querySelector('#' + id); this.modal = this.$('modal');
    this.modal.addEventListener('click', (e) => this.onClick(e)); this.modal.addEventListener('input', (e) => this.onInput(e));
    this.modal.addEventListener('dragstart', (e) => { const t = e.target.closest('[data-drag]'); if (t) e.dataTransfer.setData('text/plain', t.dataset.drag); });
    this.modal.addEventListener('dragover', (e) => { if (e.target.closest('[data-drop]')) e.preventDefault(); });
    this.modal.addEventListener('drop', (e) => { const t = e.target.closest('[data-drop]'); if (!t) return; e.preventDefault(); const [fk, fi] = e.dataTransfer.getData('text/plain').split(':'), [tk, ti] = t.dataset.drop.split(':'); this.app.sim.inv.moveSlot(this.app.sim, fk, +fi, tk, +ti); this.refresh(); });
    this.$('hotbar').addEventListener('click', (e) => { const t = e.target.closest('[data-i]'); if (t && this.app.sim) { this.app.sim.s.player.sel = +t.dataset.i; this.hudT = 0; } });
    this.$('placebar').addEventListener('click', (e) => { const t = e.target.closest('[data-i]'); if (t) { const w = this.app.world; w.placeSel = w.placeSel === +t.dataset.i ? -1 : +t.dataset.i; this.refresh(); } });
    window.addEventListener('keydown', (e) => { if (!this.app.sim && e.key === 'Escape' && this.panel && this.panel !== 'menu') this.open('menu'); });
  }
  setAtlas(frames) { this.frames = frames; const css = (n) => { const f = frames[n].frame; const cv = document.createElement('canvas'); cv.width = f.w; cv.height = f.h; const img = this.app.game.textures.get('atlas').getSourceImage(); cv.getContext('2d').drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h); return `url(${cv.toDataURL()})`; };
    const st = this.root.style; st.setProperty('--panel', css('ui/panel')); st.setProperty('--slot', css('ui/slot')); st.setProperty('--slotsel', css('ui/slot_sel')); st.setProperty('--btn', css('ui/btn')); st.setProperty('--btndown', css('ui/btn_down')); st.setProperty('--hud', css('ui/hud')); st.setProperty('--fs', this.app.settings.textSize + 'px');
    this.atlasUrl = './assets/atlas.png'; }
  ic(id, prefix = 'i/') { const f = this.frames?.[prefix + id]; if (!f) return `<span class="ic" title="eksik asset: ${esc(id)}" style="background:#f0f"></span>`; return `<span class="ic" style="background-image:url(${this.atlasUrl});background-position:-${f.frame.x}px -${f.frame.y}px;width:${Math.min(32, f.frame.w)}px;height:${Math.min(32, f.frame.h)}px"></span>`; }
  slot(sl, attrs = '', cls = '') { const it = sl && this.app.C.items[sl.id]; return `<div class="slot ${cls}" ${attrs} title="${it ? esc(it.name + (it.desc ? ' — ' + it.desc : '') + (it.price ? ` · ${it.price} G/porsiyon` : '')) : ''}">${sl ? this.ic(sl.id) + (sl.qty > 1 ? `<b>${sl.qty}</b>` : '') : ''}</div>`; }
  mats(m) { const sim = this.app.sim; return Object.entries(m || {}).map(([id, q]) => `<span class="${sim.inv.count(sim, id) >= q ? 'good' : 'bad'}" title="${esc(this.app.C.items[id].name)}">${this.ic(id)}${sim.inv.count(sim, id)}/${q}</span>`).join(' ') || '—'; }
  blocking() { return !!this.panel; }
  showHud(on) { this.$('hud').style.display = on ? '' : 'none'; }
  fade(on) { this.$('fade').classList.toggle('on', on); }
  open(name, args = {}) { if (!PANELS[name]) { console.warn('panel yok', name); return; } this.panel = name; this.args = args; this.state = {}; this.hotkey = PANELS[name].hotkey; this.modal.classList.add('on'); this.modal.classList.toggle('menu', !this.app.sim); PANELS[name].open?.(this, args); this.refresh(); this.app.audio.sfx('open'); }
  close(silent) { const p = PANELS[this.panel]; this.panel = null; this.highlightTables = null; this.modal.classList.remove('on'); this.modal.innerHTML = ''; p?.close?.(this); if (!silent) this.app.audio.sfx('ui'); this.hudT = 0; }
  refresh() {
    if (this.app.world?.placing) this.renderPlacebar();
    if (!this.panel) return; const p = PANELS[this.panel]; const sc = this.modal.querySelector('.body')?.scrollTop || 0;
    const title = typeof p.title === 'function' ? p.title(this, this.args) : p.title;
    this.modal.innerHTML = `<div class="panel frame" style="${p.width ? `width:${p.width}px` : ''}"><h2><span>${esc(title)}</span>${p.noClose ? '' : '<button class="btn x" data-a="_close">✕</button>'}</h2><div class="body">${p.render(this, this.args)}</div></div>`;
    const b = this.modal.querySelector('.body'); if (b) b.scrollTop = sc; p.after?.(this, this.args);
  }
  onClick(e) {
    const t = e.target.closest('[data-a]'); if (!t) return; const a = t.dataset.a; if (t.classList.contains('off')) { this.app.audio.sfx('error'); return; }
    if (a === '_close') return this.close(); const p = PANELS[this.panel]; const fn = p.actions?.[a]; if (!fn) return;
    this.app.audio.sfx('ui'); const keep = this.panel; fn(this, t.dataset.v, e, t); if (this.panel === keep) this.refresh();
  }
  onInput(e) { const t = e.target.closest('[data-in]'); if (!t) return; PANELS[this.panel].inputs?.[t.dataset.in]?.(this, t.value, t); }
  key(k, e) { PANELS[this.panel]?.key?.(this, k, e); }
  toast(text, kind = 'info') { const box = this.$('toasts'); if ([...box.children].some((c) => c.textContent === text)) return; const d = document.createElement('div'); d.className = 'toast ' + kind; d.textContent = text; box.appendChild(d); while (box.children.length > 5) box.firstChild.remove(); setTimeout(() => d.remove(), kind === 'error' ? 4200 : 5200); }
  setHint(label) { if (label === this._hint) return; this._hint = label; const h = this.$('hint'); h.style.display = label ? '' : 'none'; if (label) h.innerHTML = `<kbd>E</kbd>${esc(label)}`; }
  setPlacing(on) { this.$('placebar').style.display = on ? 'block' : 'none'; this.$('hotbar').style.display = on ? 'none' : ''; if (on) this.renderPlacebar(); }
  setPlaceMsg(m) { const el = this.root.querySelector('#placemsg'); if (el && el.textContent !== m) el.textContent = m; }
  renderPlacebar() { const sim = this.app.sim, w = this.app.world; const items = sim.s.player.inv.map((sl, i) => ({ sl, i })).filter((x) => x.sl && sim.C.placeables[x.sl.id]); this.$('placebar').innerHTML = `<div><b>Yerleştirme modu</b> — saat durdu. <span id="placemsg" class="muted"></span></div><div class="grid">${items.map((x) => this.slot(x.sl, `data-i="${x.i}"`, w.placeSel === x.i ? 'sel' : '')).join('') || '<span class="muted" style="grid-column:1/-1">Çantanda yerleştirilecek eşya yok. Dünyadaki bir eşyaya tıklayarak taşıyabilirsin.</span>'}</div>`; }
  tick(dt) {
    if (PANELS[this.panel]?.tick) PANELS[this.panel].tick(this, dt);
    this.hudT -= dt; if (this.hudT > 0 || !this.app.sim) return; this.hudT = 0.25;
    const sim = this.app.sim, s = sim.s, C = sim.C; const se = sim.season();
    this.$('hud-tl').innerHTML = `${yearOf(C, s.day)}. Yıl · ${SEASON_NAMES[se]} ${dayOfSeason(C, s.day)} <span class="muted" style="color:#c9ad7c">(Gün ${s.day})</span><br><span style="font-size:1.5em">${fmtTime(s.minute)}</span> ${WEATHER_NAMES[s.weather]}${s.hold ? ' ⏸' : ''}${s.closing.active ? ' · KAPANIŞ' : ''}`;
    const nt = nextTrain(sim); const ev = s.event ? `<br><span style="color:#f0cf5a">${esc(s.event.name)} · ${fmtTime(s.event.time)}</span>` : s.festival ? `<br><span style="color:#f0cf5a">${esc(C.festivals.find((f) => f.id === s.festival).name)}</span>` : '';
    this.$('hud-tc').innerHTML = (nt ? (nt.eta > 0 ? `Sıradaki tren ${fmtTime(nt.time)} · ${Math.ceil(nt.eta)} dk` : `Tren peronda (${fmtTime(nt.time)})`) : 'Bugünün seferleri bitti') + ev;
    const title = REPUTATION_TITLES.find(([min]) => s.reputation >= min)[1];
    this.$('hud-tr').innerHTML = `${this.ic('coin', 'fx/')} <span style="font-size:1.3em">${s.gold} G</span><br>İtibar ${Math.floor(s.reputation)} · ${esc(title)}<br><span style="color:${s.open ? '#9be07f' : '#ff9d8f'}">${s.open ? 'AÇIK' : 'KAPALI'}</span> · ${esc(C.stageLabels[s.stage])}`;
    const tr = sim.quests.tracker(sim).slice(0, 4); this.$('hud-quest').innerHTML = tr.length ? tr.map((q) => `<h4>${esc(q.title)}</h4>` + q.lines.filter((l, i, arr) => !l.done || arr.length <= 3).slice(0, 5).map((l) => `<div class="${l.done ? 'done' : ''}">${l.done ? '✔' : '▸'} ${esc(l.text)} ${l.prog ? `<span style="color:#f0cf5a">${l.prog}</span>` : ''}</div>`).join('')).join('') : '<span class="muted" style="color:#c9ad7c">Aktif görev yok — serbest oyun</span>';
    const names = { ENTRY_QUEUE: 'kapıda bekliyor', WALK_TO_SEAT: 'masaya gidiyor', ORDER_READY: 'sipariş verecek', WAITING_FOR_SERVE: 'servis bekliyor', WAIT_PAYMENT: 'hesap istiyor' };
    const act = s.groups.filter((g) => names[g.state]); const ho = this.$('hud-orders'); ho.style.display = act.length || s.player.carry.length ? '' : 'none';
    ho.innerHTML = `<h4>Servis</h4>` + act.map((g) => { const o = s.orders.find((x) => x.id === g.order); const items = o ? o.lines.filter((l) => l.status !== 'cancelled').map((l) => `<span style="opacity:${l.status === 'served' ? 0.4 : 1}">${this.ic(l.item)}</span>`).join('') : ''; return `<div>${g.members.length} kişi · ${names[g.state]} <span style="color:${g.pat / g.patMax > 0.4 ? '#9be07f' : '#ff9d8f'}">${Math.ceil(g.pat)} dk</span><br>${items}</div>`; }).join('') + (s.player.carry.length ? `<div>Elinde: ${s.player.carry.map((c) => this.ic(c.item)).join('')}</div>` : '');
    this.$('hotbar').innerHTML = s.player.inv.slice(0, 8).map((sl, i) => this.slot(sl, `data-i="${i}"`, i === s.player.sel ? 'sel' : '').replace('</div>', `<i>${i + 1}</i></div>`)).join('');
  }
}
