// UI yöneticisi: oyun fazına göre ekran seçer, modallar, bildirimler, sinematikler, ses/sahne senkronu.
import { h, icon, clear } from './dom.js';
import { T } from '../data/strings.js';
import { ACHIEVEMENT_BY_ID } from '../data/achievements.js';
import { EVENT_BY_ID } from '../data/events.js';
import { itemDetail, crewDetail, petDetail, goodDetail, harborDetail } from './components.js';
import { petPortraitURL } from '../rendering/Characters.js';
import { PH } from '../presentation/EncounterDirector.js';
import { HARBOR_BY_ID } from '../data/harbors.js';
import { hashString } from '../core/SeededRNG.js';
import { PX } from '../rendering/Renderer.js';
import * as Ship from '../systems/ShipSystem.js';
import * as Events from '../systems/EventSystem.js';
import { renderMenu } from './screens/menu.js';
import { renderMap, renderArrival } from './screens/map.js';
import { renderHarbor } from './screens/harbor.js';
import { renderVoyage } from './screens/voyage.js';
import { renderSummary } from './screens/summary.js';
import { renderUpgrades, renderCodex, renderSettings } from './screens/meta.js';
import { Tutorial } from './tutorial.js';

const CAT_ORDER = { healthy: 0, damaged: 1, critical: 2, sinking: 3, sunk: 4 };

export class UI {
  constructor({ root, overlay, bubbles, core, renderer, audio, stage }) {
    this.root = root;
    this.overlay = overlay;
    this.bubbleLayer = bubbles;
    this.core = core;
    this.renderer = renderer;
    this.audio = audio;
    this.stage = stage;
    this.view = 'menu';
    this.sub = { harborTab: 'trade', codexTab: 'harbors', mapOpen: false };
    this.modals = [];
    this.lastCat = null;
    this.lastGold = null;
    this.sailing = null;
    this.fast = false;
    core.on((kind, data) => this.onChange(data));
    renderer.onOverlays = (list) => this.drawBubbles(list);
    this.director = renderer.director;
    this.world = renderer.world;
    this.director.hooks = {
      sfx: (n) => this.audio.play(n),
      onPhase: () => this.render(),
      onFastOff: () => { this.fast = false; },
      onDisplay: () => this.render(),
      onCoast: (hb) => this.toast(`Kıyı göründü! ${hb.final ? 'Büyük Liman’ın kuleleri ufukta.' : ''}`, 'good', 2600),
    };
    this.sceneKey = null;
    stage.el.querySelector('#scene').addEventListener('click', (e) => this.onCanvasTap(e));
    this.tutorial = new Tutorial(this, stage);
  }

  /** Dünya sahnesini oyun fazına göre kur (yalnızca faz değişince) */
  syncWorld() {
    const run = this.core.run;
    const w = this.world;
    const d = this.director;
    if (!run || this.view !== 'game') {
      const key = 'menu';
      if (this.sceneKey !== key) {
        this.sceneKey = key;
        w.mode = 'menu'; w.harbor = null; w.coast = null; w.clearEncounter();
        w.ship.level = Math.min(5, 1 + Math.floor(this.core.meta.stats.completed / 2)); w.ship.crew = []; w.ship.pets = []; w.ship.cargo = []; w.ship.damage = 'healthy';
        w.targetSpeed = 26; w.sails = 'full'; w.ocean.preset = 'calm'; w.ocean.night = false; w.ocean.fog = 0; w.weatherFx = []; w.cam.tx = 0; w.cam.ty = 0; w.cam.tzoom = 1; w.ship.alpha = 1; w.ship.sink = 0;
        d.reset();
        d.phase = PH.IDLE;
      }
      this.renderer.setScene('world');
      return;
    }
    w.syncFromRun(run, Ship.hullCategory(this.G));
    w.cosmetics = this.core.meta.x1?.cosmetics || null;
    const harborId = run.route[run.idx]?.harborId;
    const key = run.ended ? 'end' : `${run.phase}|${run.idx}|${run.voyage ? run.voyage.toIdx : ''}`;
    if (this.sceneKey === key) { this.renderer.setScene(this.sub.mapOpen ? 'map' : 'world'); return; }
    const prev = this.sceneKey;
    this.sceneKey = key;
    if (run.ended) {
      w.mode = 'summary'; w.sunk = run.result !== 'complete'; w.clearEncounter(); w.targetSpeed = 0;
      if (!w.sunk) d.enterHarbor('final', hashString(harborId));
      w.mode = 'summary';
    } else if (run.phase === 'voyage') {
      d.enterVoyage();
    } else {
      const hb = HARBOR_BY_ID[harborId];
      const fromDock = prev && prev.startsWith('voyage');
      d.enterHarbor(hb.final ? 'final' : hb.type, hashString(hb.id));
      if (fromDock) { w.cam.x = 0; w.cam.tx = 0; }
    }
    this.renderer.setScene(this.sub.mapOpen ? 'map' : 'world');
  }

  onCanvasTap(e) {
    if (this.renderer.scene !== 'world') return;
    const p = this.stage.toLogical(e.clientX, e.clientY);
    const bx = p.x / PX, by = p.y / PX;
    const w = this.world;
    const wp = w.fromScreen(bx, by, this.renderer.W, this.renderer.H);
    const lp = w.worldToShip(wp.x, wp.y);
    const a = w.deck.actorAt(lp.x, lp.y);
    if (!a) return;
    const inf = w.deck.info(a);
    this.audio.play(a.kind === 'dog' ? 'bark' : a.kind === 'cat' ? 'meow' : 'click');
    this.showActorInfo(inf, p);
  }

  showActorInfo(inf, p) {
    this.overlay.querySelector('.actorInfo')?.remove();
    const el = h('div.actorInfo.panel', { style: { left: Math.min(p.x + 16, this.stage.W - 380) + 'px', top: Math.max(80, p.y - 120) + 'px' }, onTap: () => el.remove() },
      h('b', {}, inf.name), h('small', {}, inf.title),
      h('div.aiRow', {}, h('span', {}, 'Görev: '), inf.task),
      h('div.aiRow.dim', {}, inf.ability),
    );
    this.overlay.appendChild(el);
    clearTimeout(this._aiT);
    this._aiT = setTimeout(() => el.remove(), 4500);
  }

  get G() {
    return this.core.G;
  }

  onChange(data) {
    const run = this.core.run;
    if (data?.res && data.res.ok === false && data.res.reason) {
      this.toast(data.res.reason, 'warn');
      this.audio.play('error');
    }
    if (run && !run.ended) {
      const cat = Ship.hullCategory(this.G);
      if (this.lastCat && cat !== this.lastCat) {
        const worse = CAT_ORDER[cat] > CAT_ORDER[this.lastCat];
        this.renderer.flash(worse ? '#ff2020' : '#40ff60');
        this.toast(`Gemi durumu: ${Ship.HULL_CATEGORY_NAMES[cat]}`, worse ? 'bad' : 'good');
      }
      if (this.lastGold != null && run.gold > this.lastGold && data?.action !== 'sellLot') this.audio.play('coin');
      this.lastCat = cat;
      this.lastGold = run.gold;
    } else {
      this.lastCat = null;
      this.lastGold = null;
    }
    for (const t of this.core.takeToasts()) {
      if (t.kind === 'achievement') {
        const a = ACHIEVEMENT_BY_ID[t.id];
        if (t.id === 'ACH_OLD_FRIENDS') continue;
        this.toast(h('span', {}, icon('star'), ` Başarım: ${a.name}`), 'ach', 3200);
        this.audio.play('achievement');
      }
      if (t.kind === 'oldFriends') this.oldFriendsCinematic();
    }
    this.render();
  }

  go(view) {
    this.view = view;
    this.render();
  }

  /** Aktif ekranı yeniden oluşturur; kaydırma konumlarını korur. */
  render() {
    if (this._rendering) { this._again = true; return; }
    this._rendering = true;
    try { this._render(); } finally { this._rendering = false; }
    if (this._again) { this._again = false; this.render(); }
  }

  _render() {
    const scrolls = {};
    this.root.querySelectorAll('[data-scroll]').forEach((el) => (scrolls[el.dataset.scroll] = el.scrollTop));
    clear(this.root);
    let el;
    const run = this.core.run;
    this.syncWorld();
    if (this.view === 'upgrades') el = renderUpgrades(this);
    else if (this.view === 'codex') el = renderCodex(this);
    else if (this.view === 'settings') el = renderSettings(this);
    else if (this.view === 'menu' || !run) {
      this.view = 'menu';
      el = renderMenu(this);
      this.music('menu', 'sea');
    } else el = this.renderGame();
    // Limana varış: seyirden liman/varış ekranına geçen ilk karede arayüz yumuşakça belirir (ani boyama sıçraması hissedilmez)
    const ph = this.view === 'game' && run ? run.phase : null;
    if (this._lastRunPh === 'voyage' && (ph === 'arrival' || ph === 'harbor') && el?.classList) el.classList.add('dockIn');
    this._lastRunPh = ph;
    this.root.appendChild(el);
    this.root.querySelectorAll('[data-scroll]').forEach((s) => {
      if (scrolls[s.dataset.scroll] != null) s.scrollTop = scrolls[s.dataset.scroll];
    });
  }

  renderGame() {
    const run = this.core.run;
    if (run.ended) {
      this.music('summary', run.result === 'complete' ? 'harbor' : 'sea');
      return renderSummary(this);
    }
    if (this.sub.mapOpen) return renderMap(this, {});
    if (run.phase === 'arrival') {
      this.music(run.arrival.current ? 'oldfriends' : 'harbor', 'harbor');
      return renderArrival(this);
    }
    if (run.phase === 'harbor') {
      this.music('harbor', 'harbor');
      return renderHarbor(this);
    }
    if (run.phase === 'voyage') {
      const d = this.director;
      const enc = [PH.APPROACH, PH.INTRO, PH.DECISION, PH.ACTION, PH.OUTCOME].includes(d.phase);
      const ev = d.eventId ? EVENT_BY_ID[d.eventId] : null;
      const danger = ev && (ev.cat === 'danger' || ev.cat === 'disaster');
      this.music(enc ? (danger ? 'danger' : ev?.cat === 'mystery' || ev?.cat === 'chain' ? 'mystery' : ev?.cat === 'special' ? 'oldfriends' : 'voyage') : 'voyage', (this.world.weatherFx || []).includes('rain') ? 'storm' : 'sea');
      return renderVoyage(this);
    }
    return h('div', {}, 'Bilinmeyen durum');
  }

  music(mode, amb) {
    this.audio.setMusic(mode);
    this.audio.setAmbient(amb);
  }

  act(res) {
    return res;
  }

  // ───────── Modallar ─────────

  sheet(content, { title = null, actions = [], wide = false, onClose = null } = {}) {
    const close = () => {
      wrap.remove();
      this.modals = this.modals.filter((m) => m !== wrap);
      if (onClose) onClose();
    };
    const wrap = h('div.modal', { onTap: (e) => { if (e.target === wrap) close(); } },
      h(`div.sheet${wide ? '.wide' : ''}`, {},
        title ? h('h2.sheetTitle', {}, title) : null,
        h('div.sheetBody', { 'data-scroll': 'sheet' }, content),
        h('div.sheetActions', {},
          ...actions.map((a) => h(`button.btn${a.primary ? '.primary' : ''}${a.danger ? '.danger' : ''}${a.disabled ? '.locked' : ''}`, {
            onTap: () => {
              if (a.disabled) { this.toast(a.disabled, 'warn'); return; }
              const keep = a.onTap && a.onTap();
              if (keep !== true) close();
            },
          }, a.label)),
          h('button.btn.ghost', { onTap: close }, actions.length ? T.cancel : T.close),
        ),
      ),
    );
    this.overlay.appendChild(wrap);
    this.modals.push(wrap);
    return close;
  }

  confirm(text, { title = 'Emin misin?', ok = T.confirm, danger = false } = {}) {
    return new Promise((resolve) => {
      let done = false;
      this.sheet(h('p.confirmText', {}, text), {
        title,
        actions: [{ label: ok, primary: !danger, danger, onTap: () => { done = true; resolve(true); } }],
        onClose: () => { if (!done) resolve(false); },
      });
    });
  }

  toast(content, kind = 'info', ms = 2200) {
    let host = this.overlay.querySelector('.toasts');
    if (!host) {
      host = h('div.toasts');
      this.overlay.appendChild(host);
    }
    const el = h(`div.toast.${kind}`, {}, content);
    host.appendChild(el);
    while (host.children.length > 3) host.firstChild.remove();
    setTimeout(() => el.classList.add('out'), ms);
    setTimeout(() => el.remove(), ms + 400);
  }

  showItem(id, { owned = null, buy = null } = {}) {
    const actions = [];
    if (owned && id === 'ITEM_REPAIR_KIT') actions.push({ label: 'Kullan (+30 HP)', primary: true, onTap: () => { const r = this.core.useRepairKit(owned.uid); if (r.ok) this.audio.play('repair'); } });
    if (owned) actions.push({ label: 'Itemi bırak', danger: true, onTap: () => { this.confirm(`${id ? '' : ''}Bu itemi gemiden atmak istiyor musun? Geri alınamaz.`, { danger: true, ok: 'At' }).then((y) => y && this.core.discardItem(owned.uid)); } });
    if (buy) actions.push(buy);
    this.sheet(itemDetail(id, owned), { actions });
  }

  showCrew(id, actions = []) {
    this.sheet(crewDetail(id, this.core.meta), { actions });
  }

  showPet(id, actions = []) {
    this.sheet(petDetail(id), { actions });
  }

  showGood(id) {
    this.sheet(goodDetail(id));
  }

  showHarbor(id, known) {
    this.sheet(harborDetail(id, known));
  }

  /** Slot doluyken değiştirilecek öğeyi seçtirir. list: [{id, label, sub}] */
  chooseReplace(title, list, onPick) {
    let close = null;
    const body = h('div.replaceList', {}, ...list.map((x) => h('button.btn.replaceBtn', { onTap: () => { close(); onPick(x.id); } }, x.icon || null, h('span', {}, x.label), x.sub ? h('small', {}, x.sub) : null)));
    close = this.sheet(body, { title });
  }

  // ───────── Konuşma balonları ─────────

  drawBubbles(list) {
    const layer = this.bubbleLayer;
    const visible = this.renderer.scene === 'world';
    while (layer.children.length < list.length) layer.appendChild(h('div.bubble'));
    [...layer.children].forEach((el, i) => {
      const b = list[i];
      if (!b || !visible) { el.style.display = 'none'; return; }
      el.style.display = 'block';
      const cls = b.kind === 'float' ? 'bubble float' : 'bubble';
      if (el.className !== cls) el.className = cls;
      if (el.textContent !== b.text) el.textContent = b.text;
      el.style.color = b.kind === 'float' ? b.color : '';
      el.style.opacity = b.kind === 'float' ? Math.max(0, Math.min(1, b.a * 1.6)) : '';
      el.style.transform = `translate(${Math.round(b.x)}px, ${Math.round(b.y)}px) translate(-50%, -100%)`;
    });
  }

  // ───────── Eski Dostlar sinematiği ─────────

  oldFriendsCinematic() {
    this.audio.silence(2.4);
    let closed = false;
    const close = () => { if (closed) return; closed = true; wrap.classList.add('out'); setTimeout(() => wrap.remove(), 800); };
    const t0 = Date.now();
    // animasyon bittikten sonra ekranın herhangi bir yerine dokunmak da kapatır (oyuncu hiçbir zaman burada takılı kalmaz)
    const wrap = h('div.cinematic', { onTap: () => { if (Date.now() - t0 > 3200) close(); } },
      h('div.cineInner', {},
        h('div.cinePets', {}, h('img.cinePet', { src: petPortraitURL('PET_TARCIN', 8), alt: 'Tarçın' }), h('img.cinePet.flip', { src: petPortraitURL('PET_ZIPIR', 8), alt: 'Zıpır' })),
        h('h1.cineTitle', {}, T.oldFriendsTitle),
        h('p.cineSub', {}, T.oldFriendsSub),
        h('p.cineNote', {}, 'Hayvan kapasitesi ikiye çıktı. Codex\'te "Eski Dostlar" sayfası açıldı.'),
        h('button.btn.primary.cineBtn', { onTap: close }, T.next),
      ),
      h('div.cineHint', {}, 'Devam etmek için dokun'),
    );
    this.overlay.appendChild(wrap);
    setTimeout(() => { wrap.classList.add('show'); this.audio.play('oldfriends'); }, 1600);
  }
}

export { Events };
