// Arayüz denetleyicisi — DOM tabanlı panel sistemi (Tides'ın #ui/#overlay/#bubbles katman mimarisi).
import { CFG } from '../config.js';
import { ITEMS, RARITY, SLOT_NAMES, FAMILY_SPECIAL } from '../data/items.js';
import { ENEMIES, INTENTS } from '../data/enemies.js';
import { UPGRADES, BRANCHES } from '../data/meta.js';
import { REGIONS, TOWN_TYPES, LANE_TYPES, DISTANCE_NAMES, ENDLESS_CONDITIONS } from '../data/world.js';
import { EVENTS, CHAINS, CATEGORY_NAMES, STANDALONE, CHAIN_STAGES } from '../data/index.js';
import { heroStats, hasUpg, qitemName } from '../core/state.js';
import { buffText, STAT_NAMES } from '../core/game.js';
import { alive } from '../core/combat.js';
import { drawIcon, iconForItem } from '../render/sprites.js';
import { PH } from '../engine/director.js';

const $ = (sel, root = document) => root.querySelector(sel);
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
};
const OPT_ICON = { sword: 'sword', axe: 'axe', spear: 'spear', coin: 'coin', bag: 'bag', bread: 'bread', map: 'map', scroll: 'scroll', crown: 'crown', flag: 'flag', shield: 'shield', potion: 'c_potion', herb: 'c_herb', bandage: 'c_bandage', smoke: 'c_smoke', fire: 'c_fire', pick: 'c_pick', charm: 'c_charm', ring: 'ring', heart: 'heart', holy: 'x_holy', wolf: 'x_wolf', eye: 'x_eye', rune: 'rune', rope: 'key', curse: 'x_eye', tree: 'w_axe', water: 'c_potion' };
const iconCache = new Map();
function iconURL(key, scale = 3) {
  const k = key + '|' + scale; if (iconCache.has(k)) return iconCache.get(k);
  const cv = document.createElement('canvas'); cv.width = cv.height = 10 * scale; const c = cv.getContext('2d');
  const extra = { boot: () => { c.fillStyle = '#7a4a2a'; c.fillRect(3 * scale, 1 * scale, 3 * scale, 6 * scale); c.fillRect(3 * scale, 6 * scale, 6 * scale, 3 * scale); }, hand: () => { c.fillStyle = '#e8b88a'; c.fillRect(2 * scale, 4 * scale, 6 * scale, 5 * scale); for (let i = 0; i < 4; i++) c.fillRect((2 + i * 1.5) * scale, 1 * scale, scale, 3 * scale); }, talk: () => { c.fillStyle = '#fffaf0'; c.fillRect(1 * scale, 1 * scale, 8 * scale, 6 * scale); c.fillRect(2 * scale, 7 * scale, 2 * scale, 2 * scale); c.fillStyle = '#2a1a10'; c.fillRect(3 * scale, 4 * scale, scale, scale); c.fillRect(5 * scale, 4 * scale, scale, scale); c.fillRect(7 * scale, 4 * scale, scale, scale); }, shout: () => { c.fillStyle = '#ffd23a'; c.fillRect(1 * scale, 3 * scale, 3 * scale, 4 * scale); c.fillRect(4 * scale, 1 * scale, 2 * scale, 8 * scale); c.fillRect(7 * scale, 2 * scale, scale, 6 * scale); }, door: () => { c.fillStyle = '#6a4a2a'; c.fillRect(2 * scale, 1 * scale, 6 * scale, 8 * scale); c.fillStyle = '#f2c14e'; c.fillRect(6 * scale, 5 * scale, scale, scale); }, ear: () => { c.fillStyle = '#e8b88a'; c.fillRect(3 * scale, 1 * scale, 4 * scale, 8 * scale); c.fillStyle = '#b87a50'; c.fillRect(4 * scale, 3 * scale, 2 * scale, 4 * scale); }, moon: () => { c.fillStyle = '#e8e0a0'; c.fillRect(3 * scale, 1 * scale, 4 * scale, 8 * scale); c.fillRect(2 * scale, 3 * scale, 2 * scale, 4 * scale); c.clearRect(5 * scale, 2 * scale, 2 * scale, 6 * scale); }, sun: () => { c.fillStyle = '#ffd23a'; c.fillRect(3 * scale, 3 * scale, 4 * scale, 4 * scale); c.fillRect(4.5 * scale, 0, scale, 2 * scale); c.fillRect(4.5 * scale, 8 * scale, scale, 2 * scale); c.fillRect(0, 4.5 * scale, 2 * scale, scale); c.fillRect(8 * scale, 4.5 * scale, 2 * scale, scale); }, note: () => { c.fillStyle = '#f2e080'; c.fillRect(6 * scale, 1 * scale, scale, 6 * scale); c.fillRect(3 * scale, 6 * scale, 4 * scale, 3 * scale); }, paw: () => { c.fillStyle = '#8a6a4a'; c.fillRect(3 * scale, 5 * scale, 4 * scale, 4 * scale); for (let i = 0; i < 3; i++) c.fillRect((2 + i * 2.5) * scale, 2 * scale, 2 * scale, 2 * scale); }, tent: () => { c.fillStyle = '#c8b08a'; c.fillRect(1 * scale, 5 * scale, 8 * scale, 4 * scale); c.fillRect(3 * scale, 2 * scale, 4 * scale, 3 * scale); }, gear: () => { c.fillStyle = '#9a9aa8'; c.fillRect(2 * scale, 2 * scale, 6 * scale, 6 * scale); c.fillStyle = '#2a2a2a'; c.fillRect(4 * scale, 4 * scale, 2 * scale, 2 * scale); } };
  if (extra[key]) extra[key](); else drawIcon(c, OPT_ICON[key] || key, 0, 0, scale);
  const u = cv.toDataURL(); iconCache.set(k, u); return u;
}
const IMG = (key, cls = 'ic') => h('img', { class: cls, src: iconURL(key), alt: '' });
const itemIcon = (id, cls) => IMG(iconForItem(ITEMS[id].icon || id), cls);
const RES_TITLE = { win: 'Başarılı', lose: 'Başarısız', flee: 'Kaçış', dead: 'Öldün' };

export class UI {
  constructor({ game, director, world, audio, stage }) {
    this.g = game; this.d = director; this.w = world; this.a = audio; this.stage = stage;
    this.ui = $('#ui'); this.ov = $('#overlay'); this.bub = $('#bubbles');
    this.bubbles = []; this.floats = []; this.foeBars = new Map(); this.target = null; this.modalEl = null; this.panel = null; this.screen = null; this.decisionFor = null;
    this.toastBox = h('div', { class: 'toasts' }); this.ov.append(this.toastBox);
    game.on(() => this.onChange());
  }
  sfx(n) { this.a.play(n); }
  click(fn) { return (e) => { e.stopPropagation(); this.a.unlock(); this.sfx('ui'); fn(e); }; }
  toast(text, kind) { const t = h('div', { class: 'toast' }, text); this.toastBox.append(t); setTimeout(() => t.remove(), 3300); }
  onChange() {
    for (const t of this.g.takeToasts()) this.toast(t.text, t.kind);
    this.renderHud();
  }
  // ——— Ekranlar ———
  showMenu() {
    this.screen = 'menu'; this.clearPanels(); this.ui.innerHTML = '';
    const w = this.w; w.mode = 'road'; w.entities = []; w.gate = null; w.setRoad({ region: 1 + (Date.now() >> 14) % 5, lane: 'trade', tod: 'day', seed: 'menu' + ((Date.now() >> 20) % 9) }); w.targetSpeed = 18; w.setWeather('clear'); w.lift = 0; w.hero.x = 0; w.hero.y = 0; w.hero.alpha = 1; w.darkTarget = 0;
    this.d.setPhase(PH.IDLE);
    this.a.setMusic('menu'); this.a.setAmbient('none');
    const run = this.g.run, m = this.g.meta;
    const box = h('div', { class: 'menu' },
      h('h1', { class: 'logo' }, 'Blades', h('br'), 'of Fortune', h('span', {}, 'Tek savaşçı. Sonsuz yollar. Bin hikâye.')),
      h('div', { class: 'menuBtns' },
        run && !run.ended ? h('button', { class: 'btn big primary', onclick: this.click(() => this.resume()) }, '▶ Devam Et') : null,
        h('button', { class: 'btn big' + (run && !run.ended ? '' : ' primary'), onclick: this.click(() => this.confirmNew()) }, '⚔ Yeni Macera'),
        h('button', { class: 'btn', onclick: this.click(() => this.metaModal()) }, `★ Kalıcı Gelişim  (${m.xp} XP)`),
        h('button', { class: 'btn', onclick: this.click(() => this.recordsModal()) }, '📜 Kodeks ve Rekorlar'),
        h('button', { class: 'btn', onclick: this.click(() => this.settingsModal()) }, '⚙ Ayarlar ve Kayıt')),
      h('div', { class: 'menuFoot' }, `AYG FORGE · Run: ${m.runs} · Zafer: ${m.wins} · En yüksek skor: ${m.records.score}`));
    this.ui.append(box);
  }
  confirmNew() {
    if (this.g.run && !this.g.run.ended) {
      this.modal('Yeni Macera', (b) => { b.append(h('p', {}, 'Mevcut macera terk edilecek (kazanılan XP kalıcı hesaba aktarılır). Emin misin?'), h('div', { class: 'row' }, h('button', { class: 'btn danger', onclick: this.click(() => { this.g.abandonRun(); this.g.dismissSummary(); this.closeModal(); this.startNew(); }) }, 'Evet, yeni başla'), h('button', { class: 'btn ghost', onclick: this.click(() => this.closeModal()) }, 'Vazgeç'))); }, 'narrow');
    } else this.startNew();
  }
  startNew() { this.g.newRun(); this.enterTown(true); this.toast('Çıraklar Köyü\'nden yola çıkıyorsun. Hedef: Krallığın Başkenti Altıntaç!'); }
  resume() {
    const r = this.g.run;
    if (!r) return this.showMenu();
    if (r.ended) return this.showSummary();
    this.screen = 'game'; this.ui.innerHTML = ''; this.closeModal();
    if (r.phase === 'town') this.enterTown(false);
    else if (r.phase === 'voyage') { this.ui.innerHTML = ''; this.renderHud(); this.d.enterVoyage(true); this.a.setMusic('road'); }
    else if (r.phase === 'arrival') { this.ui.innerHTML = ''; this.renderHud(); this.d.inArrival = true; this.w.mode = 'road'; this.w.setRoad({ region: this.g.town().region, lane: 'royal', tod: 'day', seed: r.seed + '|' + r.idx }); if (r.arrival.current) this.d.resumeEncounter(r.arrival.current); else this.d.playArrival(); }
  }
  enterTown(fresh) {
    this.screen = 'game'; this.clearPanels(); this.ui.innerHTML = ''; this.closeModal();
    this.d.toTown();
  }
  // ——— HUD ———
  renderHud() {
    if (this.screen !== 'game' || !this.g.run || this.g.run.ended) { const old = $('.hud', this.ui); if (old && this.screen !== 'game') old.remove(); return; }
    const r = this.g.run, st = heroStats(this.g.G), hp = r.hero.hp, pct = Math.max(0, hp / st.maxHp);
    let hud = $('.hud', this.ui);
    if (!hud) { hud = h('div', { class: 'hud' }); this.ui.prepend(hud); }
    hud.innerHTML = '';
    hud.append(
      h('div', { class: 'hbox', style: 'flex-direction:column;align-items:stretch;gap:3px' },
        h('div', { class: 'row' }, h('div', { class: 'hpbar ' + (pct < 0.3 ? 'low' : pct < 0.6 ? 'mid' : '') }, h('div', { class: 'fill', style: `width:${pct * 100}%` }), h('div', { class: 'lbl' }, `HP ${hp} / ${st.maxHp}`)), h('span', { class: 'stat' }, IMG('coin', 'ic sm'), h('b', {}, r.gold))),
        h('div', { class: 'statline' }, h('span', {}, `⚔ ${st.atk}`), h('span', {}, `🛡 ${st.def}`), h('span', {}, `➶ ${st.agi}`), st.luck ? h('span', {}, `☘ ${st.luck}`) : null, h('span', { class: 'goldc' }, `XP ${r.xp}`), r.hero.buffs.length ? h('span', { class: 'good', title: r.hero.buffs.map(buffText).join('\n') }, `✦${r.hero.buffs.length}`) : null)),
      this.routeBox(),
      h('div', { class: 'hudBtns' },
        h('button', { class: 'btn sm', onclick: this.click(() => this.inventoryModal()) }, IMG('bag', 'ic sm'), `Çanta ${r.bag.length}/${CFG.bag.slots}`),
        h('button', { class: 'btn sm', onclick: this.click(() => this.questsModal()) }, `Görev ${r.contracts.filter((c) => !c.done && !c.failed).length}`),
        h('button', { class: 'btn sm' + (this.d.ff > 1 ? ' primary' : ''), onclick: this.click(() => { this.d.setFast(this.d.ff === 1); this.g.G.settings.fast = this.d.ff > 1; this.g.saveSettings(); this.renderHud(); }) }, this.d.ff > 1 ? '»x2' : '»x1'),
        h('button', { class: 'btn sm', onclick: this.click(() => { this.g.G.settings.muted = !this.g.G.settings.muted; this.a.applyVolumes(); this.g.saveSettings(); this.renderHud(); }) }, this.g.G.settings.muted ? '🔇' : '🔊'),
        h('button', { class: 'btn sm', onclick: this.click(() => this.pauseModal()) }, '☰')));
    if (r.overflow.length && this.d.phase !== PH.ACTION && !this.modalEl) this.overflowModal();
  }
  routeBox() {
    const r = this.g.run;
    if (r.phase === 'voyage' && r.voyage) {
      const v = r.voyage, from = r.towns[v.from], to = r.towns[v.toId], k = Math.min(1, v.elapsed / v.duration);
      const pips = v.queue.map((q, i) => h('div', { class: 'pip' + (i < v.pos ? ' done' : ''), style: `left:${((i + 1) / (v.queue.length + 1)) * 100}%` }));
      return h('div', { class: 'hbox route' }, h('div', { class: 'names' }, h('span', {}, from.name), h('span', { class: 'chip' }, `${LANE_TYPES[v.lane].name} · ${REGIONS[v.region].name}${r.endless ? ` · Sonsuz ${r.endless.stage}` : ''}`), h('span', {}, '→ ' + to.name)), h('div', { class: 'bar' }, h('div', { class: 'fill', style: `width:${k * 100}%` }), ...pips));
    }
    const t = this.g.town();
    const leg = r.endless ? `Sonsuz Macera · Aşama ${r.endless.stage}${r.endless.cond ? ' · ' + ENDLESS_CONDITIONS[r.endless.cond].name : ''}` : `Yerleşim ${r.idx + 1} / ${r.legsTotal + 1}`;
    return h('div', { class: 'hbox route' }, h('div', { class: 'names' }, h('span', {}, t ? `${t.name} · ${TOWN_TYPES[t.type].name}` : ''), h('span', { class: 'chip' }, REGIONS[t ? t.region : 1].name), h('span', {}, leg)), h('div', { class: 'bar' }, h('div', { class: 'fill', style: `width:${r.endless ? 100 : (r.idx / r.legsTotal) * 100}%` })));
  }
  // ——— Olay panelleri ———
  clearPanels() { if (this.panel) this.panel.remove(); this.panel = null; this.hideCombat(); const s = $('.skipBtn', this.ui); if (s) s.remove(); }
  setPanel(el) { if (this.panel) this.panel.remove(); this.panel = el; if (el) this.ui.append(el); }
  onPhase(p) {
    const skip = $('.skipBtn', this.ui);
    const anim = [PH.APPROACH, PH.INTRO, PH.ACTION, PH.OUTCOME, PH.EXIT].includes(p) && !this.d.combatOn;
    if (anim && !skip && this.screen === 'game') this.ui.append(h('button', { class: 'btn sm ghost skipBtn', onclick: this.click(() => this.d.skip()) }, 'Atla ⏭'));
    if (!anim && skip) skip.remove();
    if (p !== PH.DOCKED) this.clearTownUi();
    if (p === PH.DECISION) this.showDecision(EVENTS[this.d.eventId]);
    if (p === PH.SAIL || p === PH.RESUME || p === PH.DOCKING) { this.clearPanels(); this.a.setMusic('road'); }
    if (p === PH.APPROACH) { const ev = EVENTS[this.d.eventId]; this.a.setMusic(ev.cat === 'danger' ? 'danger' : 'road'); }
  }
  showDecision(ev) {
    const opts = this.g.options(ev);
    const tag = ev.chain ? h('span', { class: 'chip chain' }, `${CHAINS[ev.chain].name} · ${ev.stage}/${CHAINS[ev.chain].stages.length}`) : h('span', { class: 'chip' + (ev.cat === 'royal' ? ' royal' : ev.cat === 'danger' ? ' bad' : '') }, CATEGORY_NAMES[ev.cat]);
    const cards = opts.map(({ opt, view }) => {
      const meta = [];
      if (view.chance != null) meta.push(h('span', { class: 'chip ' + (view.chance >= 60 ? 'good' : view.chance < 35 ? 'bad' : '') }, `%${view.chance}${view.stat ? ' · ' + view.stat : ''}`));
      if (view.cost) meta.push(h('span', { class: 'chip gold' }, `${view.cost} altın`));
      if (opt.consume) meta.push(h('span', { class: 'chip' }, 'Eşya tüketir'));
      if (view.threat) meta.push(h('span', { class: 'chip ' + (view.threat === 'Kolay' ? 'good' : view.threat === 'Orta' ? '' : 'bad') }, `Savaş · ${view.threat}`));
      if (view.bonuses.length) meta.push(h('span', { class: 'chip good' }, 'Eşya bonusu'));
      if (opt.hint && !view.available) meta.push(h('span', { class: 'chip' }, opt.hint));
      for (const rs of view.reasons) meta.push(h('span', { class: 'chip bad' }, rs));
      return h('button', { class: 'opt' + (view.available ? '' : ' locked') + (opt.fight ? ' fight' : ''), onclick: this.click(() => { if (!view.available) { this.toast(view.reasons.join(', ')); return; } const res = this.d.choose(opt.k); if (res && res.ok) this.setPanel(null); else if (res && res.reason) this.toast(res.reason); }) }, IMG(opt.ic || 'hand', 'ic big'), h('div', {}, h('div', { class: 't' }, opt.l), h('div', { class: 'm' }, meta)));
    });
    this.setPanel(h('div', { class: 'panel bottomPanel' }, h('div', { class: 'evHead' }, h('h2', {}, ev.t), tag), h('div', { class: 'evText' }, ev.txt), h('div', { class: 'opts' }, cards)));
  }
  showOutcome(res, ev) {
    const sk = $('.skipBtn', this.ui); if (sk) sk.remove();
    const cur = this.g.host() && this.g.host().current;
    const kind = res.dead ? 'dead' : res.outcome;
    const lines = (res.lines || []).map((l) => h('span', { class: 'chip ' + ({ gold: 'gold', hp: 'bad', bad: 'bad', heal: 'good', xp: '', item: l.rarity ? 'r-' + l.rarity : '', royal: 'royal', chain: 'chain', quest: 'good', perm: 'good', buff: 'good' }[l.kind] || '') }, l.text));
    const shop = cur && cur.shop ? h('div', { class: 'row', style: 'margin-bottom:8px' }, ...cur.shop.map((s, i) => h('button', { class: 'card item', style: 'flex:1;cursor:pointer;' + (s.sold ? 'opacity:.4' : ''), onclick: this.click(() => { const r = this.g.eventShopBuy(i); if (!r.ok) this.toast(r.reason || 'Alınamadı'); else { this.sfx('coins'); this.showOutcome(res, ev); } }) }, itemIcon(s.id, 'ic big'), h('div', {}, h('div', { class: 'nm' }, ITEMS[s.id].name), h('div', { class: 'ds' }, ITEMS[s.id].desc)), h('div', { class: 'pr' }, s.sold ? 'Satıldı' : `${s.price} altın`)))) : null;
    const btn = h('button', { class: 'btn big primary', onclick: this.click(() => { if (this.g.run.overflow.length) { this.overflowModal(); return; } this.setPanel(null); this.d.continueAfter(); }) }, res.dead ? 'Sonuç' : 'Devam ▶');
    this.setPanel(h('div', { class: 'panel bottomPanel' }, h('div', { class: 'row' }, h('h2', { class: 'outTitle ' + kind }, `${RES_TITLE[kind]} — ${res.label}`), h('span', { class: 'spacer' }), btn), h('div', { class: 'evText' }, res.text), h('div', { class: 'lines' }, lines), shop));
  }
  // ——— Savaş arayüzü ———
  showCombat(cb) {
    this.combat = cb; const r = this.g.run, st = heroStats(this.g.G), fam = st.fam, sp = FAMILY_SPECIAL[fam];
    if (!this.target || !cb.foes.find((f) => f.eid === this.target && !f.dead)) this.target = (alive(cb)[0] || {}).eid;
    this.a.setMusic('combat');
    const quick = r.quick.filter((id) => r.bag.some((b) => b.id === id));
    const flee = this.g.fleeChance(), noFlee = cb.foes.some((f) => f.noFlee && !f.dead);
    const act = (type, label, sub, cls = '', dis = false) => h('button', { class: 'btn act ' + cls, disabled: dis || this.d.busy ? 'disabled' : null, onclick: this.click(() => { if (type === 'item') return this.quickPop(quick); const res = this.d.combatAction({ type, target: this.target }); if (!res.ok && res.reason) this.toast(res.reason); else this.showCombat(this.combat); }) }, label, h('small', {}, sub));
    const pips = Array.from({ length: CFG.combat.focusMax }, (_, i) => h('i', { class: i < cb.focus ? 'on' : '' }));
    this.setPanel(h('div', { class: 'panel bottomPanel' }, h('div', { class: 'combat' },
      h('div', { class: 'me' }, h('div', { class: 'row' }, h('b', { class: 'goldc', style: 'font-weight:normal;font-size:26px' }, `Tur ${cb.turn}`), h('span', { class: 'spacer' }), h('div', { class: 'focus' }, 'Odak', ...pips)),
        h('div', { class: 'hpbar' + (r.hero.hp / st.maxHp < 0.3 ? ' low' : ''), style: 'width:100%' }, h('div', { class: 'fill', style: `width:${(r.hero.hp / st.maxHp) * 100}%` }), h('div', { class: 'lbl' }, `HP ${r.hero.hp}/${st.maxHp}`)),
        h('div', { class: 'statline' }, `⚔ ${Math.max(1, st.atk - cb.atkDebuff)}  🛡 ${st.def}  ➶ ${st.agi - cb.agiDebuff}`, cb.ward ? h('span', { class: 'good' }, ' · Tılsım') : null)),
      h('div', { class: 'acts' },
        act('attack', '⚔ Saldır', '+1 Odak'),
        act('defend', '🛡 Savun', `Hasar −%${Math.round((CFG.combat.defendCut + (hasUpg(this.g.meta, 'U_SHIELD') ? 0.08 : 0)) * 100)} · +1 Odak`),
        act('special', '✦ ' + sp.name, '2 Odak', cb.focus >= 2 ? 'primary' : '', cb.focus < 2),
        act('item', '⚗ Eşya', quick.length ? `${quick.length} hızlı eşya` : 'Hızlı eşya yok', '', !quick.length),
        act('flee', '➶ Kaç', noFlee ? 'Kaçış yok' : `%${flee}`, '', noFlee)))));
    this.renderFoeBars();
  }
  quickPop(quick) {
    const old = $('.quickPop', this.ui); if (old) { old.remove(); return; }
    const pop = h('div', { class: 'panel quickPop', style: 'left:640px' }, ...quick.map((id) => h('button', { class: 'card item', style: 'cursor:pointer;min-width:200px', onclick: this.click(() => { pop.remove(); const res = this.d.combatAction({ type: 'item', item: id, target: this.target }); if (!res.ok && res.reason) this.toast(res.reason); else this.showCombat(this.combat); }) }, itemIcon(id, 'ic big'), h('div', {}, h('div', { class: 'nm' }, ITEMS[id].name), h('div', { class: 'ds' }, ITEMS[id].desc)))));
    this.ui.append(pop);
  }
  hideCombat() { for (const el of this.foeBars.values()) el.remove(); this.foeBars.clear(); this.combat = null; const q = $('.quickPop', this.ui); if (q) q.remove(); }
  renderFoeBars() {
    const cb = this.combat; if (!cb) return;
    for (const f of cb.foes) {
      let el = this.foeBars.get(f.eid);
      if (f.dead) { if (el) { el.remove(); this.foeBars.delete(f.eid); } continue; }
      if (!el) { el = h('div', { class: 'foeBar', onclick: this.click(() => { this.target = f.eid; this.renderFoeBars(); }) }); this.bub.append(el); this.foeBars.set(f.eid, el); el.style.pointerEvents = 'auto'; }
      const I = INTENTS[f.intent] || INTENTS.atk;
      el.className = 'foeBar' + (this.target === f.eid ? ' sel' : '');
      el.innerHTML = '';
      el.append(h('div', { class: 'nm' }, h('span', {}, f.name), h('span', {}, `${f.hp}/${f.max}`)), h('div', { class: 'b' }, h('i', { style: `width:${(f.hp / f.max) * 100}%` })), h('div', { class: 'in' }, `${I.ic} ${I.n}${I.mult > 0 ? ' ~' + Math.max(1, Math.round((f.atk + f.buff) * I.mult - heroStats(this.g.G).def * 0.5)) : ''}`));
    }
    this.bub.style.pointerEvents = 'none';
  }
  // ——— Balonlar ve yüzen yazılar ———
  say(at, text, dur, think) {
    for (const b of this.bubbles) if (b.at === at) { b.el.remove(); b.dead = true; }
    const el = h('div', { class: 'bubble' + (think ? ' think' : '') }, text); this.bub.append(el);
    this.bubbles.push({ at, el, until: performance.now() + dur * 1000 / this.d.ff });
  }
  float(at, text, color) { const el = h('div', { class: 'float', style: `color:${color}` }, text); this.bub.append(el); const p = this.w.pos(at); this.floats.push({ el, x: p.x, y: p.y - 14 - this.floats.length % 3 * 8, until: performance.now() + 1300 }); }
  banner(text) { const el = h('div', { class: 'banner' }, text); this.ov.append(el); setTimeout(() => el.remove(), 2500); }
  frame() {
    const now = performance.now(), S = 1280 / 427;
    const place = (el, wx, wy, dy = 0) => { const s = this.w.toScreen(wx, wy); el.style.left = (s.x * S) + 'px'; el.style.top = (s.y * S + dy) + 'px'; };
    this.bubbles = this.bubbles.filter((b) => { if (b.dead) return false; if (now > b.until) { b.el.remove(); return false; } const p = this.w.pos(b.at); const e = typeof b.at === 'string' ? this.w.get(b.at) : null; const tall = e && ['troll', 'golem', 'wyvern', 'wraith'].includes(e.kind) ? 26 : e && e.prop ? 14 : 16; place(b.el, p.x, p.y - tall, -6); const bh = b.el.offsetHeight || 40, bw = b.el.offsetWidth || 120; let tp = parseFloat(b.el.style.top), lf = parseFloat(b.el.style.left); if (tp - bh < 96) b.el.style.top = (96 + bh) + 'px'; if (lf - bw / 2 < 8) b.el.style.left = (8 + bw / 2) + 'px'; if (lf + bw / 2 > 1272) b.el.style.left = (1272 - bw / 2) + 'px'; return true; });
    this.floats = this.floats.filter((f) => { if (now > f.until) { f.el.remove(); return false; } place(f.el, f.x, f.y); return true; });
    if (this.combat) { let i = 0; for (const [eid, el] of this.foeBars) { const e = this.w.get(eid); if (!e) continue; const tall = ['troll', 'golem', 'wyvern', 'wraith', 'champion'].includes(e.kind) ? 44 : 30; place(el, e.x, e.y - tall, -40); const top = parseFloat(el.style.top); if (top < 100 + (i % 2) * 54) el.style.top = (100 + (i % 2) * 54) + 'px'; i++; } }
  }
  // ——— Kasaba ———
  onDocked(town) {
    this.screen = 'game'; this.clearPanels(); this.a.setMusic('town'); this.a.setAmbient('town');
    this.renderHud(); this.renderTown();
    const rep = this.g.run.visit && this.g.run.visit.report;
    if (rep && rep.length) { for (const l of rep) this.toast(l.text); this.g.run.visit.report = null; }
    if (this.g.run.capitalWon && !this.g.run.endless && town.type === 'capital' && !this.victoryShown) { this.victoryShown = true; this.victoryModal(); }
  }
  renderTown() {
    const r = this.g.run, town = this.g.town(), T = TOWN_TYPES[town.type];
    for (const el of [...this.ui.querySelectorAll('.townSide, .townInfo')]) el.remove();
    const svc = (k, label, fn, cls = '') => h('button', { class: 'btn ' + cls, onclick: this.click(fn) }, label);
    const side = h('div', { class: 'panel townSide' });
    if (T.services.includes('smith')) side.append(svc('smith', '⚒ Demirci', () => this.shopModal('smith')));
    if (T.services.includes('market')) side.append(svc('market', '⚖ Pazar', () => this.shopModal('market')));
    side.append(svc('inn', `🛏 Han — Dinlen (${this.g.innCost()} altın)`, () => { const x = this.g.rest(); x.ok ? (this.sfx('heal'), this.toast(`+${x.heal} HP. İyi uyudun.`)) : this.toast(x.reason); this.renderTown(); }));
    if (T.services.includes('healer')) side.append(svc('healer', `✚ Şifacı — Tam şifa (${this.g.healerCost()} altın)`, () => { const x = this.g.heal(); x.ok ? (this.sfx('heal'), this.toast('Şifacı yaralarını ve lanetlerini iyileştirdi.')) : this.toast(x.reason); this.renderTown(); }));
    side.append(svc('board', '📜 Görev Tahtası', () => this.boardModal()));
    if (town.type === 'capital' && !r.capitalWon && !r.endless) side.append(svc('trial', '👑 Kraliyet Sınavı', () => this.trialConfirm(), 'royal'));
    if (r.capitalWon && !r.endless && town.type === 'capital') { side.append(svc('end', '🏆 Macerayı Tamamla', () => { this.g.completeRun(); this.showSummary(); }, 'primary'), svc('endless', '∞ Sonsuz Macera\'ya Devam', () => { this.g.enterEndless(); this.renderTown(); }, 'royal')); }
    else if (r.visit.lanes.length) side.append(svc('route', '🗺 Rota Seçimi — Yola Çık', () => this.routeModal(), 'primary'));
    side.append(svc('retire', '⚑ Emekli Ol (run\'ı bitir)', () => this.retireConfirm(), 'ghost'));
    const active = r.contracts.filter((c) => !c.done && !c.failed);
    const info = h('div', { class: 'panel townInfo' }, h('h2', {}, town.name), h('div', { class: 'row' }, h('span', { class: 'chip' }, T.name), h('span', { class: 'chip' }, REGIONS[town.region].name)),
      h('div', { class: 'dim', style: 'font-size:20px;margin-top:6px' }, town.type === 'capital' ? 'Krallığın kalbi. Kraliyet Sınavı seni bekliyor.' : `Hizmetler: ${T.services.map((s) => ({ smith: 'Demirci', market: 'Pazar', inn: 'Han', healer: 'Şifacı', board: 'Görev Tahtası' })[s]).join(', ')}`),
      active.length ? h('div', { style: 'font-size:19px;margin-top:6px' }, ...active.map((c) => h('div', {}, `• ${c.name}: ${c.desc}${c.need ? ` (${c.have}/${c.need})` : ''}`))) : null,
      Object.values(r.chains).filter((c) => c.status === 'active').map((c, i) => h('div', { class: 'chip chain', style: 'margin-top:6px' }, `Hikâye: ${CHAINS[Object.keys(r.chains).find((k) => r.chains[k] === c)].name}`)));
    this.ui.append(info, side);
  }
  trialConfirm() {
    this.modal('Kraliyet Sınavı', (b) => {
      b.append(h('p', {}, 'Kral ve Kraliyet Şampiyonu meydanda bekliyor. Sınava girmeden önce iyileşmeyi ve eşyalarını hazırlamayı unutma.'),
        h('p', { class: 'dim' }, `Kraliyet takdirnamesi: ${this.g.run.flags.royalFavor ? '✔ var' : '✘ yok'} · Kraliyet Mührü: ${this.g.run.bag.some((x) => x.id === 'Q_SEAL') ? '✔ var' : '✘ yok'} · Krallığın dostluğu: ${this.g.run.flags.royalFriend ? '✔ var' : '✘ yok'}`),
        h('div', { class: 'row' }, h('button', { class: 'btn royal big', onclick: this.click(() => { const x = this.g.startTrial(); if (!x.ok) return this.toast(x.reason); this.closeModal(); this.clearTownUi(); this.w.mode = 'road'; this.w.setRoad({ region: 5, lane: 'royal', tod: 'day', seed: this.g.run.seed + '|final' }); this.w.gate = { type: 'capital', y: -150 }; this.d.inArrival = true; this.d.playArrival(); }) }, 'Sınava Gir'), h('button', { class: 'btn ghost', onclick: this.click(() => this.closeModal()) }, 'Henüz değil')));
    }, 'narrow');
  }
  clearTownUi() { for (const el of [...this.ui.querySelectorAll('.townSide, .townInfo')]) el.remove(); }
  retireConfirm() {
    this.modal('Emekli Ol', (b) => { b.append(h('p', {}, 'Macerayı burada sonlandırırsın. Kazandığın XP kalıcı hesaba aktarılır; Başkent ödülü kazanılmaz.'), h('div', { class: 'row' }, h('button', { class: 'btn danger', onclick: this.click(() => { this.g.retire(); this.closeModal(); this.showSummary(); }) }, 'Emekli Ol'), h('button', { class: 'btn ghost', onclick: this.click(() => this.closeModal()) }, 'Vazgeç'))); }, 'narrow');
  }
  victoryModal() {
    this.modal('Krallığın Kılıcı!', (b) => { b.append(h('p', {}, 'Kraliyet Sınavı\'nı geçtin. Kral seni Krallığın Kılıcı ilan etti. Şimdi macerayı tamamlayabilir ya da Sonsuz Macera\'ya devam edebilirsin: karakterin, eşyaların ve altının korunur; her dört yerleşimde zorluk artar.'), h('div', { class: 'row' }, h('button', { class: 'btn primary big', onclick: this.click(() => { this.closeModal(); this.g.completeRun(); this.showSummary(); }) }, '🏆 Macerayı Tamamla'), h('button', { class: 'btn royal big', onclick: this.click(() => { this.closeModal(); this.g.enterEndless(); this.renderTown(); }) }, '∞ Sonsuz Macera'))); }, 'narrow');
  }
  // ——— Modallar ———
  modal(title, build, cls = '') {
    this.closeModal();
    const body = h('div', { class: 'mbody' });
    const box = h('div', { class: 'panel modal ' + cls, onclick: (e) => e.stopPropagation() }, h('div', { class: 'mhead' }, h('h2', {}, title), h('span', { class: 'spacer' }), h('button', { class: 'btn sm ghost', onclick: this.click(() => this.closeModal()) }, '✕')), body);
    const bg = h('div', { class: 'modalBg', onclick: () => this.closeModal() }, box);
    this.ov.append(bg); this.modalEl = bg; build(body, box);
    return body;
  }
  closeModal() { if (this.modalEl) this.modalEl.remove(); this.modalEl = null; if (this.g.run && this.g.run.overflow.length && this.d.phase !== PH.ACTION && this.screen === 'game') setTimeout(() => !this.modalEl && this.overflowModal(), 50); }
  itemRow(id, right, onclick, extra = '') {
    const it = ITEMS[id], st = [it.atk && `⚔+${it.atk}`, it.def && `🛡${it.def > 0 ? '+' : ''}${it.def}`, it.agi && `➶${it.agi > 0 ? '+' : ''}${it.agi}`].filter(Boolean).join(' ');
    return h('div', { class: 'card item', style: onclick ? 'cursor:pointer' : '', onclick: onclick ? this.click(onclick) : null }, itemIcon(id, 'ic big'), h('div', {}, h('div', { class: 'nm' }, it.name, ' ', h('span', { class: 'chip r-' + it.rarity }, RARITY[it.rarity].n), ' ', h('span', { class: 'chip' }, it.slot === 'bag' ? (it.kind === 'cons' ? 'Tüketilebilir' : 'Özel') : SLOT_NAMES[it.slot])), h('div', { class: 'ds' }, (st ? st + ' · ' : '') + it.desc + extra)), right ? h('div', { class: 'pr' }, right) : null);
  }
  shopModal(kind, tab = 'buy') {
    const v = this.g.run.visit;
    this.modal(kind === 'smith' ? 'Demirci' : 'Pazar', (b) => {
      b.append(h('div', { class: 'tabs' }, h('button', { class: 'btn sm' + (tab === 'buy' ? ' on' : ''), onclick: this.click(() => this.shopModal(kind, 'buy')) }, 'Satın Al'), h('button', { class: 'btn sm' + (tab === 'sell' ? ' on' : ''), onclick: this.click(() => this.shopModal(kind, 'sell')) }, 'Sat'), h('span', { class: 'spacer' }), h('span', { class: 'stat' }, IMG('coin', 'ic sm'), h('b', {}, this.g.run.gold))));
      const grid = h('div', { class: 'grid g2' });
      if (tab === 'buy') for (const id of v.stock[kind]) { const sold = ITEMS[id].slot !== 'bag' && v.bought[id]; grid.append(this.itemRow(id, sold ? 'Tükendi' : `${this.g.priceBuy(id)} altın`, sold ? null : () => { const r = this.g.buy(id); r.ok ? (this.sfx('coins'), this.toast(`${ITEMS[id].name} alındı.`)) : this.toast(r.reason); this.shopModal(kind, 'buy'); }, this.compare(id))); }
      else this.g.run.bag.forEach((bb, i) => grid.append(this.itemRow(bb.id, `${this.g.priceSell(bb.id)} altın${(bb.n || 1) > 1 ? ' ×' + bb.n : ''}`, () => { const r = this.g.sell(i); r.ok ? (this.sfx('coins'), this.toast(`Satıldı: +${r.price} altın`)) : this.toast(r.reason); this.shopModal(kind, 'sell'); })));
      if (!grid.children.length) grid.append(h('div', { class: 'dim' }, 'Burada bir şey yok.'));
      b.append(grid);
    });
  }
  compare(id) { const it = ITEMS[id]; if (it.slot === 'bag') return ''; const cur = ITEMS[this.g.run.equip[it.slot]]; if (!cur) return ' (boş yuva)'; const d = (k) => (it[k] || 0) - (cur[k] || 0); const parts = [['atk', '⚔'], ['def', '🛡'], ['agi', '➶']].map(([k, s]) => d(k) ? `${s}${d(k) > 0 ? '+' : ''}${d(k)}` : null).filter(Boolean); return parts.length ? ` [mevcuda göre ${parts.join(' ')}]` : ''; }
  inventoryModal(sel = null) {
    const r = this.g.run, st = heroStats(this.g.G), inTown = r.phase === 'town';
    this.modal('Envanter', (b) => {
      const eq = h('div', { class: 'row', style: 'margin-bottom:8px;flex-wrap:wrap' });
      for (const slot of ['weapon', 'armor', 'acc']) { const id = r.equip[slot]; eq.append(h('div', { class: 'card item', style: 'flex:1;min-width:300px' }, h('div', { class: 'slot' + (id ? ' r-' + ITEMS[id].rarity : ' empty') }, id ? itemIcon(id, 'ic big') : SLOT_NAMES[slot]), h('div', {}, h('div', { class: 'nm' }, id ? ITEMS[id].name : `${SLOT_NAMES[slot]} yok`), h('div', { class: 'ds' }, id ? ITEMS[id].desc : '')), id && slot !== 'weapon' ? h('button', { class: 'btn sm', onclick: this.click(() => { const x = this.g.unequip(slot); if (!x.ok) this.toast(x.reason); this.inventoryModal(); }) }, 'Çıkar') : null)); }
      b.append(h('div', { class: 'statline', style: 'font-size:22px;margin-bottom:6px' }, `HP ${r.hero.hp}/${st.maxHp} · Saldırı ${st.atk} · Savunma ${st.def} · Çeviklik ${st.agi} · İkna ${st.talk}${st.luck ? ' · Şans ' + st.luck : ''} · Özel: ${FAMILY_SPECIAL[st.fam].name}`), eq);
      const bag = h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' });
      for (let i = 0; i < CFG.bag.slots; i++) { const bb = r.bag[i]; bag.append(h('div', { class: 'slot' + (bb ? ' r-' + ITEMS[bb.id].rarity : ' empty') + (sel === i ? ' sel' : ''), onclick: this.click(() => bb && this.inventoryModal(i)) }, bb ? itemIcon(bb.id, 'ic big') : '', bb && (bb.n || 1) > 1 ? h('span', { class: 'n' }, '×' + bb.n) : null, bb && r.quick.includes(bb.id) ? h('span', { class: 'q' }, 'H') : null)); }
      b.append(h('div', { class: 'dim', style: 'font-size:19px' }, `Çanta (${r.bag.length}/${CFG.bag.slots}) — H: savaşta hızlı kullanım (en fazla ${CFG.bag.quick})`), bag);
      if (sel != null && r.bag[sel]) {
        const id = r.bag[sel].id, it = ITEMS[id];
        const acts = h('div', { class: 'row', style: 'margin-top:8px;flex-wrap:wrap' });
        if (it.slot !== 'bag') acts.append(h('button', { class: 'btn primary', onclick: this.click(() => { this.g.equip(sel); this.sfx('draw'); this.inventoryModal(); }) }, 'Kuşan'));
        if (it.heal) acts.append(h('button', { class: 'btn', onclick: this.click(() => { const x = this.g.useItem(sel); x.ok ? (this.sfx('heal'), this.toast(`+${x.heal} HP`)) : this.toast(x.reason); this.inventoryModal(); }) }, 'Kullan'));
        if (it.combat) acts.append(h('button', { class: 'btn', onclick: this.click(() => { this.g.toggleQuick(id); this.inventoryModal(sel); }) }, r.quick.includes(id) ? 'Hızlıdan çıkar' : 'Hızlıya ekle'));
        if (inTown) acts.append(h('button', { class: 'btn', onclick: this.click(() => { const x = this.g.sell(sel); x.ok ? this.toast(`+${x.price} altın`) : this.toast(x.reason); this.inventoryModal(); }) }, `Sat (${this.g.priceSell(id)})`));
        acts.append(h('button', { class: 'btn danger', onclick: this.click(() => { this.g.drop(sel); this.inventoryModal(); }) }, 'Bırak'));
        b.append(h('div', { style: 'margin-top:8px' }, this.itemRow(id, null, null, this.compare(id))), acts);
      }
      const q = Object.entries(r.qitems);
      b.append(h('div', { style: 'margin-top:10px;font-size:20px' }, 'Görev eşyaları: ', q.length ? q.map(([k, n]) => h('span', { class: 'chip good', style: 'margin-right:4px' }, qitemName(k) + (n > 1 ? ' ×' + n : ''))) : h('span', { class: 'dim' }, 'yok')),
        h('div', { style: 'margin-top:6px;font-size:20px' }, 'Etkiler: ', r.hero.buffs.length ? r.hero.buffs.map((x) => h('span', { class: 'chip', style: 'margin-right:4px' }, buffText(x))) : h('span', { class: 'dim' }, 'yok'), Object.keys(r.hero.perm).length ? h('span', { class: 'chip good' }, 'Kalıcı: ' + Object.entries(r.hero.perm).filter(([, v]) => v).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${STAT_NAMES[k]}`).join(', ')) : null));
    });
  }
  overflowModal() {
    const r = this.g.run; if (!r.overflow.length) return;
    const id = r.overflow[0];
    this.modal('Çanta Dolu!', (b) => {
      b.append(h('p', {}, 'Yeni bir eşya buldun ama çantanda yer yok. Almak için bir eşyayı bırak ya da yeni eşyadan vazgeç.'), this.itemRow(id, null, null, this.compare(id)), h('p', { class: 'dim' }, 'Bırakılacak eşyayı seç:'));
      const grid = h('div', { class: 'grid g2' });
      r.bag.forEach((bb, i) => grid.append(this.itemRow(bb.id, 'Bırak ve al', () => { this.g.overflowTake(0, i); this.closeModal(); })));
      b.append(grid, h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn danger', onclick: this.click(() => { this.g.overflowDiscard(0); this.closeModal(); }) }, `${ITEMS[id].name} — vazgeç`)));
    }, 'narrow');
  }
  boardModal() {
    const r = this.g.run, v = r.visit;
    this.modal('Görev Tahtası', (b) => {
      if (!v.contracts.length) b.append(h('p', { class: 'dim' }, 'Bugün tahtada iş yok.'));
      const grid = h('div', { class: 'grid g2' });
      v.contracts.forEach((c, i) => grid.append(h('div', { class: 'card item', style: 'flex-direction:column;align-items:stretch' }, h('div', { class: 'nm' }, c.name, ' ', h('span', { class: 'chip' + (c.type === 'special' ? ' royal' : '') }, { hunt: 'Av', delivery: 'Teslimat', rescue: 'Kurtarma', explore: 'Keşif', escort: 'Koruma', special: 'Özel' }[c.type])), h('div', { class: 'ds', style: 'font-size:19px' }, c.desc), h('div', { class: 'row', style: 'margin-top:6px' }, h('span', { class: 'chip gold' }, `${c.gold} altın`), h('span', { class: 'chip' }, `${c.xp} XP`), c.item ? h('span', { class: 'chip' }, ITEMS[c.item].name) : null, h('span', { class: 'spacer' }), h('button', { class: 'btn sm primary', disabled: c.taken ? 'disabled' : null, onclick: this.click(() => { const x = this.g.acceptContract(i); x.ok ? (this.sfx('quest'), this.toast(`Kontrat alındı: ${c.name}`)) : this.toast(x.reason); this.boardModal(); this.renderTown(); }) }, c.taken ? 'Alındı' : 'Kabul Et')))));
      b.append(grid);
      this.questList(b);
    });
  }
  questList(b) {
    const r = this.g.run;
    b.append(h('h3', { style: 'margin:10px 0 4px;font-weight:normal;color:var(--gold)' }, 'Aktif kontratlar (en fazla 2)'));
    const act = r.contracts.filter((c) => !c.done && !c.failed);
    b.append(act.length ? h('div', {}, ...act.map((c) => h('div', { style: 'font-size:20px' }, `• ${c.name}: ${c.desc}${c.need ? ` (${c.have}/${c.need})` : ''}`))) : h('div', { class: 'dim' }, 'yok'));
    const ch = Object.entries(r.chains);
    b.append(h('h3', { style: 'margin:10px 0 4px;font-weight:normal;color:var(--gold)' }, 'Hikâye zincirleri'));
    b.append(ch.length ? h('div', {}, ...ch.map(([id, c]) => h('div', { style: 'font-size:20px' }, `• ${CHAINS[id].name} — ${{ active: `Aşama ${c.stage}/${CHAINS[id].stages.length}`, done: 'Tamamlandı', failed: 'Sona erdi' }[c.status]}`))) : h('div', { class: 'dim' }, 'Henüz yok. Yolda karşına çıkabilirler.'));
  }
  questsModal() { this.modal('Görevler ve Hikâyeler', (b) => this.questList(b), 'narrow'); }
  routeModal() {
    const r = this.g.run, v = r.visit, sight = r.flags.sight > 0 || r.equip.acc === 'X_EYE', hint = hasUpg(this.g.meta, 'U_ROUTE');
    this.modal('Rota Seçimi', (b) => {
      if (r.overflow.length) b.append(h('p', { class: 'bad' }, 'Önce taşan eşyalara karar vermelisin.'));
      const grid = h('div', { class: 'grid ' + (v.lanes.length === 2 ? 'g2' : 'g3') });
      v.lanes.forEach((l, i) => {
        const L = LANE_TYPES[l.type], T = TOWN_TYPES[l.town.type];
        const danger = sight ? '☠'.repeat(l.danger) + '·'.repeat(5 - l.danger) : hint ? (l.danger >= 4 ? 'Yüksek' : l.danger >= 3 ? 'Orta-yüksek' : l.danger >= 2 ? 'Orta' : 'Düşük') : '?';
        grid.append(h('div', { class: 'card lane', onclick: this.click(() => { const x = this.g.depart(i); if (!x.ok) return this.toast(x.reason); this.closeModal(); this.clearTownUi(); this.d.enterVoyage(); this.a.setAmbient('none'); }) },
          h('div', { class: 'row' }, IMG({ royal: 'crown', forest: 'tree', mountain: 'rune', trade: 'bag', wild: 'paw' }[l.type], 'ic big'), h('h3', {}, L.name)),
          h('div', { style: 'font-size:19px' }, L.desc),
          h('div', { class: 'row', style: 'flex-wrap:wrap' }, h('span', { class: 'chip' }, `${DISTANCE_NAMES[l.distance]} yol`), h('span', { class: 'chip' }, { day: 'Gündüz', dusk: 'Akşam', night: 'Gece' }[l.tod]), h('span', { class: 'chip' }, REGIONS[l.town.region].name)),
          h('div', { style: 'font-size:21px' }, 'Varış: ', h('b', { class: 'goldc', style: 'font-weight:normal' }, `${l.town.name}`), ` (${T.name})`),
          h('div', { style: 'font-size:20px' }, 'Tehlike: ', h('span', { class: 'dg' }, danger)),
          h('div', { class: 'ds', style: 'font-size:17px;font-style:italic' }, 'Söylenti: ' + l.rumors.join(' '))));
      });
      b.append(grid, h('p', { class: 'dim', style: 'font-size:18px' }, sight ? 'Gerçek tehlike seviyeleri görünüyor.' : 'İpucu: Kuzgun Gözü veya Rota Sezgisi tehlikeyi gösterir.'));
    });
  }
  pauseModal() {
    this.modal('Duraklat', (b) => {
      b.append(h('div', { class: 'grid g2' },
        h('button', { class: 'btn', onclick: this.click(() => this.closeModal()) }, 'Oyuna dön'),
        h('button', { class: 'btn', onclick: this.click(() => this.settingsModal()) }, 'Ayarlar ve Kayıt'),
        h('button', { class: 'btn', onclick: this.click(() => { this.closeModal(); this.g.persist(); this.showMenu(); }) }, 'Kaydet ve ana menüye dön')),
        h('p', { class: 'dim', style: 'font-size:19px' }, 'Oyun her adımda otomatik kaydedilir. Olay, savaş ve hikâye aşamaları kaldığı yerden devam eder.'));
    }, 'narrow');
  }
  settingsModal() {
    const s = this.g.G.settings;
    this.modal('Ayarlar ve Kayıt', (b) => {
      const slider = (k, label) => h('div', { class: 'row', style: 'font-size:22px' }, h('span', { style: 'width:160px' }, label), h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s[k], oninput: (e) => { s[k] = Number(e.target.value); this.a.applyVolumes(); this.g.saveSettings(); } }));
      b.append(slider('master', 'Ana ses'), slider('music', 'Müzik'), slider('sfx', 'Efektler'),
        h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: this.click(() => { s.muted = !s.muted; this.a.applyVolumes(); this.g.saveSettings(); this.settingsModal(); }) }, s.muted ? 'Sesi aç' : 'Sesi kapat')),
        h('h3', { style: 'font-weight:normal;color:var(--gold);margin:12px 0 4px' }, 'Kayıt dışa/içe aktar'),
        h('textarea', { id: 'saveTxt' }),
        h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: this.click(() => { $('#saveTxt').value = this.g.exportSave(); }) }, 'Dışa aktar'), h('button', { class: 'btn sm', onclick: this.click(() => { const x = this.g.importSave($('#saveTxt').value); this.toast(x.ok ? 'Kayıt yüklendi.' : x.reason); if (x.ok) { this.closeModal(); this.showMenu(); } }) }, 'İçe aktar'), h('span', { class: 'spacer' }), h('button', { class: 'btn sm danger', onclick: this.click(() => { if (confirm('Tüm ilerleme silinsin mi?')) { this.g.resetAll(); this.closeModal(); this.showMenu(); } }) }, 'Tümünü sıfırla')));
    }, 'narrow');
  }
  metaModal() {
    const m = this.g.meta;
    this.modal(`Kalıcı Gelişim — ${m.xp} XP`, (b) => {
      if (this.g.hasActiveRun()) b.append(h('p', { class: 'bad', style: 'font-size:20px' }, 'Geliştirmeler yalnızca bir macera bittiğinde satın alınabilir.'));
      for (const [br, name] of Object.entries(BRANCHES)) {
        b.append(h('h3', { style: 'margin:8px 0 4px;font-weight:normal;color:var(--gold)' }, name));
        const grid = h('div', { class: 'grid', style: 'grid-template-columns:repeat(6,1fr)' });
        for (const u of UPGRADES.filter((x) => x.branch === br)) { const own = m.upgrades[u.id], can = this.g.canBuyUpgrade(u.id); grid.append(h('div', { class: 'card upg' + (own ? ' own' : can ? '' : ' lock'), onclick: this.click(() => { if (own) return; const x = this.g.buyUpgrade(u.id); x.ok ? (this.sfx('rare'), this.metaModal()) : this.toast(x.reason); }) }, h('div', { style: 'font-size:21px;line-height:1' }, u.name), h('div', { style: 'font-size:15px;line-height:1.05' }, u.desc), h('div', { class: 'chip ' + (own ? 'good' : 'gold'), style: 'margin-top:auto' }, own ? 'Açık' : `${u.cost} XP`))); }
        b.append(grid);
      }
    });
  }
  recordsModal() {
    const m = this.g.meta, rec = m.records;
    this.modal('Kodeks ve Rekorlar', (b) => {
      const seen = Object.keys(m.codex.events).filter((k) => EVENTS[k] && !EVENTS[k].chain).length, chs = Object.keys(m.codex.chains).length;
      b.append(h('div', { class: 'statsGrid' }, h('div', {}, 'Keşfedilen olaylar', h('b', {}, `${seen} / ${STANDALONE.length}`)), h('div', {}, 'Tamamlanan hikâyeler', h('b', {}, `${chs} / 20`)), h('div', {}, 'En çok yerleşim', h('b', {}, rec.maxTowns)), h('div', {}, 'En çok yenilen düşman', h('b', {}, rec.kills)), h('div', {}, 'En çok tamamlanan görev', h('b', {}, rec.quests)), h('div', {}, 'En yüksek macera puanı', h('b', {}, rec.score)), h('div', {}, 'En yüksek Sonsuz Macera aşaması', h('b', {}, rec.maxEndless)), h('div', {}, 'Toplam run / zafer / ölüm', h('b', {}, `${m.runs} / ${m.wins} / ${m.deaths}`))));
      b.append(h('h3', { style: 'font-weight:normal;color:var(--gold)' }, 'Hikâyeler'), h('div', { class: 'grid g4' }, ...Object.values(CHAINS).map((c) => h('div', { class: 'chip' + (m.codex.chains[c.id] ? ' chain' : ''), style: 'font-size:17px' }, (m.codex.chains[c.id] ? '✔ ' : '? ') + c.name))));
    });
  }
  showSummary() {
    const r = this.g.run; if (!r || !r.ended) return this.showMenu();
    this.screen = 'summary'; this.clearPanels(); this.ui.innerHTML = ''; this.closeModal();
    const e = r.ended, title = { dead: 'Yolun Sonu', endless_dead: 'Sonsuz Yolda Düştün', retire: 'Emekli Oldun', endless_retire: 'Sonsuz Macera Bitti', complete: 'Krallığın Kılıcı!' }[e.reason] || 'Macera Bitti';
    this.a.setMusic(e.reason.includes('dead') ? 'danger' : 'town');
    const box = h('div', { class: 'modalBg' }, h('div', { class: 'panel summary' }, h('h2', { style: 'margin:0;font-size:48px;font-weight:normal;color:' + (e.reason.includes('dead') ? 'var(--bad)' : 'var(--gold)') }, title),
      h('div', { class: 'statsGrid' }, h('div', {}, 'Ziyaret edilen yerleşim', h('b', {}, e.towns)), h('div', {}, 'Yenilen düşman', h('b', {}, e.kills)), h('div', {}, 'Tamamlanan görev', h('b', {}, e.quests)), h('div', {}, 'Tamamlanan hikâye', h('b', {}, e.chains)), h('div', {}, 'Macera puanı', h('b', {}, e.score)), h('div', {}, 'Kazanılan XP (kalıcı)', h('b', {}, '+' + e.xp)), e.endlessStage != null ? h('div', {}, 'Sonsuz Macera aşaması', h('b', {}, e.endlessStage)) : null, h('div', {}, 'Toplam kalıcı XP', h('b', {}, this.g.meta.xp))),
      h('p', { class: 'dim', style: 'font-size:20px' }, e.reason.includes('dead') ? 'Altın, ekipman ve eşyalar kayboldu; kazandığın XP kalıcı gelişim için korundu.' : 'Kazandığın XP kalıcı gelişim için hesabına aktarıldı.'),
      h('div', { class: 'row' }, h('button', { class: 'btn primary big', onclick: this.click(() => { this.g.dismissSummary(); this.metaModal(); this.showMenu(); }) }, 'Kalıcı Gelişim'), h('button', { class: 'btn big', onclick: this.click(() => { this.g.dismissSummary(); this.showMenu(); }) }, 'Ana Menü'))));
    this.ui.append(box);
  }
}
