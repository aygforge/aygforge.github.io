// UI yöneticisi: oyun fazına göre ekran seçer, modallar, bildirimler, sinematikler, ses/sahne senkronu.
import { h, icon, clear } from './dom.js';
import { T } from '../data/strings.js';
import { ACHIEVEMENT_BY_ID } from '../data/achievements.js';
import { EVENT_BY_ID } from '../data/events.js';
import { itemDetail, crewDetail, petDetail, goodDetail, harborDetail } from './components.js';
import { petPortraitURL } from '../rendering/Characters.js';
import * as Ship from '../systems/ShipSystem.js';
import * as Events from '../systems/EventSystem.js';
import { renderMenu } from './screens/menu.js';
import { renderMap } from './screens/map.js';
import { renderHarbor } from './screens/harbor.js';
import { renderVoyage } from './screens/voyage.js';
import { renderEvent } from './screens/event.js';
import { renderSummary } from './screens/summary.js';
import { renderUpgrades, renderCodex, renderSettings } from './screens/meta.js';

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
    renderer.onBubbles = (list) => this.drawBubbles(list);
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
    const scrolls = {};
    this.root.querySelectorAll('[data-scroll]').forEach((el) => (scrolls[el.dataset.scroll] = el.scrollTop));
    clear(this.root);
    let el;
    const run = this.core.run;
    if (this.view === 'upgrades') el = renderUpgrades(this);
    else if (this.view === 'codex') el = renderCodex(this);
    else if (this.view === 'settings') el = renderSettings(this);
    else if (this.view === 'menu' || !run) {
      this.view = 'menu';
      el = renderMenu(this);
      this.renderer.setScene('menu', { level: Math.min(5, 1 + Math.floor(this.core.meta.stats.completed / 2)) });
      this.music('menu', 'sea');
    } else el = this.renderGame();
    this.root.appendChild(el);
    this.root.querySelectorAll('[data-scroll]').forEach((s) => {
      if (scrolls[s.dataset.scroll] != null) s.scrollTop = scrolls[s.dataset.scroll];
    });
  }

  renderGame() {
    const run = this.core.run;
    const G = this.G;
    const dmg = Ship.hullCategory(G);
    if (run.ended) {
      this.renderer.setScene('summary');
      this.music('summary', run.result === 'complete' ? 'harbor' : 'sea');
      return renderSummary(this);
    }
    if (run.phase === 'arrival') {
      if (run.arrival.current) return this.eventView(run.arrival);
      return renderMap(this, { arrival: true });
    }
    if (run.phase === 'harbor') {
      if (this.sub.mapOpen) return renderMap(this, { arrival: false });
      this.renderer.setScene('harbor', { damage: dmg });
      this.music('harbor', 'harbor');
      return renderHarbor(this);
    }
    if (run.phase === 'voyage') {
      if (run.voyage.current) return this.eventView(run.voyage);
      return renderVoyage(this);
    }
    return h('div', {}, 'Bilinmeyen durum');
  }

  eventView(host) {
    const ev = EVENT_BY_ID[host.current.id];
    this.renderer.setScene('event', { eventId: ev.id });
    const danger = ev.cat === 'danger' || ev.cat === 'disaster';
    const myst = ev.cat === 'mystery' || ev.cat === 'chain';
    this.music(ev.id.startsWith('EVT_SPECIAL') ? 'oldfriends' : danger ? 'danger' : myst ? 'mystery' : 'voyage', (ev.art?.fx || []).includes('rain') ? 'storm' : 'sea');
    if (this.lastEventShown !== host.current.id + '|' + (host.pos || 0)) {
      this.lastEventShown = host.current.id + '|' + (host.pos || 0);
      this.audio.play(danger ? 'danger' : 'event');
      if (ev.id === 'EVT_SPECIAL_ZIPIR_TARCIN' || ev.id === 'EVT_SPECIAL_TARCIN_ALONE') setTimeout(() => this.audio.play('bark'), 600);
      if (ev.id === 'EVT_SPECIAL_ZIPIR_ALONE') setTimeout(() => this.audio.play('meow'), 900);
    }
    return renderEvent(this, host);
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
    this.sheet(itemDetail(id), { actions });
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
    const visible = this.renderer.scene === 'harbor' || this.renderer.scene === 'voyage';
    while (layer.children.length < list.length) layer.appendChild(h('div.bubble'));
    [...layer.children].forEach((el, i) => {
      const b = list[i];
      if (!b || !visible) { el.style.display = 'none'; return; }
      el.style.display = 'block';
      if (el.textContent !== b.text) el.textContent = b.text;
      el.style.transform = `translate(${Math.round(b.x)}px, ${Math.round(b.y)}px) translate(-50%, -100%)`;
    });
    if (visible) {
      for (const b of list) if (b.text.startsWith('Hav') && this._lastBark !== b.text + Math.floor(performance.now() / 2500)) { this._lastBark = b.text + Math.floor(performance.now() / 2500); this.audio.play('bark'); }
    }
  }

  // ───────── Eski Dostlar sinematiği ─────────

  oldFriendsCinematic() {
    this.audio.silence(2.4);
    const wrap = h('div.cinematic', {},
      h('div.cineInner', {},
        h('div.cinePets', {}, h('img.cinePet', { src: petPortraitURL('PET_TARCIN', 8), alt: 'Tarçın' }), h('img.cinePet.flip', { src: petPortraitURL('PET_ZIPIR', 8), alt: 'Zıpır' })),
        h('h1.cineTitle', {}, T.oldFriendsTitle),
        h('p.cineSub', {}, T.oldFriendsSub),
        h('p.cineNote', {}, 'Hayvan kapasitesi ikiye çıktı. Codex\'te "Eski Dostlar" sayfası açıldı.'),
        h('button.btn.primary.cineBtn', { onTap: () => { wrap.classList.add('out'); setTimeout(() => wrap.remove(), 800); } }, T.next),
      ),
    );
    this.overlay.appendChild(wrap);
    setTimeout(() => { wrap.classList.add('show'); this.audio.play('oldfriends'); }, 1600);
  }
}

export { Events };
