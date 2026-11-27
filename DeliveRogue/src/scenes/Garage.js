// scenes/Garage.js — workshop scene (layout authority: reference/ui/88176.png).
// Left: scrollable equipment column (level, next bonus, price, upgrade). Centre: lit courier platform
// with the active skin. Right: Trophy Room door (top), real stats (middle), Skin Shop (bottom).
// Sub-views (Skin Shop, Trophy Room) are full in-scene content with back. No trophy fee / level gate.
// Phase 05: 8 categories × 20 levels (linear stats, price = base × 1.20^level, all available from the start)
// and the 6 original skins (visual only; buy once, re-equip free). Purchases are atomic save transactions.
import { Save } from '../core/SaveManager.js';
import { Audio } from '../core/AudioManager.js';
import { Art } from '../core/Art.js';
import { T } from '../core/i18n.js';
import { View } from '../core/state.js';
import { GARAGE, GARAGE_ORDER, GARAGE_MAX, garageCost } from '../data/garage.js';
import { COSMETICS } from '../data/cosmetics.js';
import { PLAYER_BASE } from '../data/player.js';
import { MILESTONES } from '../data/quests.js';
import { Progression } from '../systems/Progression.js';
import { icon } from '../ui/icons.js';
import { backdrop } from '../ui/SceneArt.js';
import { bar, btn, fmtNum } from '../ui/UITheme.js';
import { App } from '../ui/App.js';

const EQ_COLOR = { motor: 'orange', helmet: 'blue', jacket: 'gold', pos: 'teal', bag: 'orange', tires: 'steel', brakes: 'blue', battery: 'teal' };

function statsRows(s) {
  const g = s.garage;
  const hp = Math.round(PLAYER_BASE.hp * (1 + GARAGE.helmet.per * g.helmet));
  return [
    ['speed', T('st_speed'), Math.round(PLAYER_BASE.speed * (1 + GARAGE.motor.per * g.motor)), GARAGE.motor.per * g.motor / (GARAGE.motor.per * GARAGE_MAX)],
    ['heart', T('st_hp'), hp, GARAGE.helmet.per * g.helmet / (GARAGE.helmet.per * GARAGE_MAX)],
    ['shield', T('st_dr'), Math.round(GARAGE.jacket.per * g.jacket * 100) + '%', g.jacket / GARAGE_MAX],
    ['card', T('st_dmg'), (PLAYER_BASE.dmg * (1 + GARAGE.pos.per * g.pos)).toFixed(1), g.pos / GARAGE_MAX],
    ['box', T('st_pkg'), '+' + Math.round(GARAGE.bag.per * g.bag * 100) + '%', g.bag / GARAGE_MAX],
    ['spill', T('st_slip'), '-' + Math.round(GARAGE.tires.per * g.tires * 100) + '%', g.tires / GARAGE_MAX],
    ['shield', T('st_impact'), '-' + Math.round(GARAGE.brakes.per * g.brakes * 100) + '%', g.brakes / GARAGE_MAX],
    ['bolt', T('st_rate'), (1 / (PLAYER_BASE.interval / (1 + GARAGE.battery.per * g.battery))).toFixed(2) + '/s', g.battery / GARAGE_MAX],
  ];
}

export const Garage = {
  id: 'Garage', hub: true, navIndex: 1, canvas: null,
  enter(ctx, params = {}) {
    ctx.view = params.view || 'main'; ctx.preview = null;
    ctx.root.style.backgroundImage = `url(${backdrop('workshop', View.h)})`;
    this.render(ctx);
    ctx.on(ctx.root, 'click', e => this.onClick(e, ctx));
  },
  render(ctx) {
    const sc = ctx.root.querySelector('.p-scroll'), st = sc ? sc.scrollTop : 0;
    ctx.root.innerHTML = ctx.view === 'skins' ? this.skins(ctx) : ctx.view === 'trophy' ? this.trophies(ctx) : this.main(ctx);
    const s2 = ctx.root.querySelector('.p-scroll'); if (s2) s2.scrollTop = st;
  },
  platform(skinId, label) {
    return `<div class="gr-plat"><div class="gr-glow"></div><div class="gr-disc"></div>
      <img class="gr-courier" alt="" src="${Art.url(Art.courier(skinId, 2, 0, true, 0, false))}">
      <div class="gr-plate">${label}</div></div>`;
  },
  main(ctx) {
    const s = Save.data, skin = COSMETICS.find(c => c.id === s.cosmetics.selected) || COSMETICS[0];
    const eq = GARAGE_ORDER.map(id => {
      const g = GARAGE[id], l = s.garage[id], max = l >= GARAGE_MAX, cost = max ? 0 : garageCost(id, l), can = !max && s.coins >= cost;
      return `<div class="gr-eq p-card p-${EQ_COLOR[id]}" data-eq="${id}">
        <div class="gr-eq-top"><img alt="" src="${Art.url(Art.garageIcon(id))}"><div><div class="gr-eq-n">${T('eq_' + id)}</div><div class="gr-eq-l">${T('lvShort', l, GARAGE_MAX)}</div></div></div>
        ${bar(l / GARAGE_MAX, 'dark')}
        <div class="gr-eq-b">${g.fmt(g.per * l)}${max ? '' : ` <span class="gr-next">→ ${g.fmt(g.per * (l + 1))}</span>`}</div>
        ${max ? `<div class="gr-max">${T('maxed')}</div>` : btn(`${T('upgrade')}<small>${icon('coin')}${fmtNum(cost)}</small>`, `data-a="up" data-id="${id}" ${can ? '' : 'disabled'}`, can ? 'gold' : 'steel', 'sm gr-up')}
      </div>`;
    }).join('');
    const trophies = MILESTONES.filter(m => s.milestones.unlocked[m.id]).length;
    const stats = statsRows(s).map(([ic, l, v, p]) => `<div class="gr-stat"><span class="gr-stat-ic">${icon(ic)}</span><div><div class="gr-stat-l">${l} <b>${v}</b></div>${bar(p, 'blue thin')}</div></div>`).join('');
    return `<div class="gr">
      <h1 class="p-title">${T('garage')}</h1>
      <div class="gr-left p-scroll">${eq}</div>
      <button class="gr-door p-card p-steel" data-a="view" data-v="trophy"><span class="gr-door-ic">${icon('door')}</span><b>${T('trophyRoom')}</b><small>${T('trophyCount', trophies, MILESTONES.length)}</small></button>
      <div class="gr-center">${this.platform(skin.id, `${T('activeCourier')}<b>${skin.name}</b>`)}</div>
      <div class="gr-stats p-card p-navy">${stats}</div>
      <button class="gr-shop p-card p-violet" data-a="view" data-v="skins"><span class="gr-shop-ic">${icon('gift')}</span><b>${T('skinShop')}</b><small>${T('skinsOwned', s.cosmetics.owned.length, COSMETICS.length)}</small></button>
    </div>`;
  },
  skins(ctx) {
    const s = Save.data, pv = ctx.preview || s.cosmetics.selected, pc = COSMETICS.find(c => c.id === pv) || COSMETICS[0];
    const own = s.cosmetics.owned.includes(pc.id), sel = s.cosmetics.selected === pc.id;
    const action = sel ? btn(T('selected'), 'disabled', 'teal')
      : own ? btn(T('equip'), `data-a="equip" data-id="${pc.id}"`, 'blue')
        : btn(`${T('buy')} ${icon('coin')}${fmtNum(pc.price)}`, `data-a="buy" data-id="${pc.id}" ${s.coins >= pc.price ? '' : 'disabled'}`, s.coins >= pc.price ? 'gold' : 'steel');
    const grid = COSMETICS.map(c => {
      const o = s.cosmetics.owned.includes(c.id), se = s.cosmetics.selected === c.id;
      return `<button class="sk-item p-card ${c.id === pc.id ? 'on' : ''} ${o ? '' : 'notown'}" data-a="preview" data-id="${c.id}"><img alt="" src="${Art.url(Art.courierPortrait(c.id))}"><span class="sk-n">${c.name}</span><span class="sk-s">${se ? T('selected') : o ? T('owned') : `${icon('coin')}${fmtNum(c.price)}`}</span></button>`;
    }).join('');
    return `<div class="gr sub">
      <div class="p-subhead">${btn(icon('back'), 'data-a="close" aria-label="' + T('back') + '"', 'steel', 'icon')}<h1 class="p-title sm">${T('skinShop')}</h1></div>
      <div class="sk-prev">${this.platform(pc.id, `<b>${pc.name}</b><small>${T('skinNote')}</small>`)}</div>
      <div class="sk-act">${action}</div>
      <div class="sk-grid p-scroll">${grid}</div></div>`;
  },
  trophies() {
    const s = Save.data, n = MILESTONES.filter(m => s.milestones.unlocked[m.id]).length;
    const list = MILESTONES.map(m => { const got = !!s.milestones.unlocked[m.id]; return `<div class="tr-slot p-card ${got ? 'got' : ''}"><div class="tr-ic">${got ? m.icon : icon('lock')}</div><b>${got ? m.name : '???'}</b><small>${m.text}</small></div>`; }).join('');
    return `<div class="gr sub">
      <div class="p-subhead">${btn(icon('back'), 'data-a="close" aria-label="' + T('back') + '"', 'steel', 'icon')}<h1 class="p-title sm">${T('trophyRoom')}</h1></div>
      <div class="tr-sum">${icon('trophy')}<span>${T('trophyCount', n, MILESTONES.length)}</span></div>
      <div class="tr-grid p-scroll">${list}</div>
      <div class="p-note">${T('trophyNote')}</div></div>`;
  },
  onClick(e, ctx) {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    const a = b.dataset.a, s = Save.data;
    Audio.init();
    if (a === 'view') { Audio.play('click'); ctx.view = b.dataset.v; ctx.preview = null; this.render(ctx); }
    else if (a === 'close') { Audio.play('click'); ctx.view = 'main'; this.render(ctx); }
    else if (a === 'up') {
      if (Progression.buyUpgrade(b.dataset.id)) { Audio.play('buy'); this.render(ctx); App.refreshChrome(); const c = ctx.root.querySelector(`[data-eq="${b.dataset.id}"]`); if (c) c.classList.add('pop'); }
      else { Audio.play('error'); if (!Save.ok) App.saveFailedToast(); }
    } else if (a === 'preview') { Audio.play('click'); ctx.preview = b.dataset.id; this.render(ctx); }
    else if (a === 'buy') { if (Progression.buySkin(b.dataset.id)) { Audio.play('buy'); this.render(ctx); App.refreshChrome(); } else { Audio.play('error'); if (!Save.ok) App.saveFailedToast(); } }
    else if (a === 'equip') { if (Progression.equipSkin(b.dataset.id)) { Audio.play('buy'); this.render(ctx); App.refreshChrome(); } else { Audio.play('error'); App.saveFailedToast(); } }
  },
  back(ctx) { if (ctx.view !== 'main') { ctx.view = 'main'; this.render(ctx); return true; } return false; },
  refresh(ctx) { this.render(ctx); },
  exit() {},
};
