// scenes/RunPrep.js — operations room (layout authority: reference/ui/88174.png).
// Mode > restaurant > chapter selection. Left: the reference's three stacked cards are used for chapter
// selection (previous / selected / next). Right: real route preview (built world, segments, hazards,
// pickup / checkpoint / drop), enemy threat, deliveries and reward preview. Below: obstacles, package
// rule, star goals + mastery, START RUN and loadout preview (active skin + real garage levels).
// No global Safe/Normal/Risky difficulty is added. Locked content always states its reason.
import { Save } from '../core/SaveManager.js';
import { Audio } from '../core/AudioManager.js';
import { Art } from '../core/Art.js';
import { T } from '../core/i18n.js';
import { View } from '../core/state.js';
import { clamp, esc } from '../core/util.js';
import { CHAPTERS, MASTERY_REWARD, MASTERY_TEXT } from '../data/chapters.js';
import { ENEMY_DB, ENEMY_SHORT } from '../data/enemies.js';
import { ENEMY_CATALOG } from '../data/enemyCatalog.js';
import { EPISODE_IDS } from '../data/ids.js';
import { MODES } from '../data/modes.js';
import { PACKAGES } from '../data/packages.js';
import { GARAGE_ORDER } from '../data/garage.js';
import { COSMETICS } from '../data/cosmetics.js';
import { icon } from '../ui/icons.js';
import { backdrop } from '../ui/SceneArt.js';
import { routeData, drawRoute } from '../ui/RoutePreview.js';
import { btn, fmtNum, stars } from '../ui/UITheme.js';
import { App } from '../ui/App.js';

const DISTRICT_NAME = {}; ENEMY_CATALOG.forEach(e => { DISTRICT_NAME[e.districtCode] = e.districtName; });
const epDone = n => n === 1 ? !!Save.data.episodes.coffee : false; // only Coffee exists in this build

function chapterEnemies(ch) {
  const m = new Map();
  ch.layout.forEach(([, en]) => en.split(/\s+/).filter(Boolean).forEach(sh => m.set(sh, (m.get(sh) || 0) + 1)));
  return [...m.entries()].map(([sh, n]) => ({ sh, n, d: ENEMY_DB[ENEMY_SHORT[sh]] }));
}

export const RunPrep = {
  id: 'RunPrep', hub: true, navIndex: 2, canvas: null,
  enter(ctx, params = {}) {
    const s = Save.data;
    ctx.sel = clamp(params.chapter || App.state.prepChapter || s.unlocked, 1, CHAPTERS.length);
    ctx.pan = 0; ctx.panDir = 1;
    ctx.root.style.backgroundImage = `url(${backdrop('prep', View.h)})`;
    this.render(ctx);
    ctx.on(ctx.root, 'click', e => this.onClick(e, ctx));
  },
  render(ctx) {
    const s = Save.data, n = ctx.sel, ch = CHAPTERS[n - 1], locked = n > s.unlocked;
    App.state.prepChapter = n;
    const sc = ctx.root.querySelector('.rp-details'), st = sc ? sc.scrollTop : 0;
    const modes = MODES.map(m => {
      const unlocked = m.unlockEp === 0 || epDone(m.unlockEp);
      const why = m.implemented ? '' : unlocked ? T('mode_soon') : T('mode_lock', m.unlockEp);
      return `<button class="rp-chip ${m.id === 'campaign' ? 'on' : 'off'}" data-a="mode" data-id="${m.id}" data-why="${esc(why)}">${m.implemented ? '' : icon('lock')}${T('mode_' + m.id)}</button>`;
    }).join('');
    const eps = EPISODE_IDS.map((id, i) => {
      const playable = i === 0, prevDone = i === 0 || epDone(i);
      const why = playable ? '' : prevDone ? T('ep_soon') : T('ep_lockPrev', DISTRICT_NAME[EPISODE_IDS[i - 1]]);
      return `<button class="rp-chip ${playable ? 'on' : 'off'}" data-a="ep" data-why="${esc(why)}">${playable ? '☕' : icon('lock')}${DISTRICT_NAME[id]}</button>`;
    }).join('');
    const win = [n - 1, n, n + 1].map(k => clamp(k, 1, CHAPTERS.length));
    if (n === 1) win.splice(0, 3, 1, 2, 3); if (n === CHAPTERS.length) win.splice(0, 3, n - 2, n - 1, n);
    const cards = win.map(k => {
      const c = CHAPTERS[k - 1], lk = k > s.unlocked, done = s.completed[k - 1], on = k === n;
      const tone = lk ? 'locked' : on ? 'gold' : done ? 'teal' : 'blue';
      return `<button class="rp-card p-card p-${tone} ${on ? 'on' : ''}" data-a="sel" data-n="${k}">
        <div class="rp-card-h"><span class="rp-num">${lk ? icon('lock') : k}</span><span class="rp-cn">${esc(c.name)}</span></div>
        <div class="rp-card-m">${stars(s.stars[k - 1], 3, 'sm')}<span class="rp-pk" style="--pc:${PACKAGES[c.pkg].color}">${T('pkgShort_' + c.pkg)}</span></div>
        <div class="rp-card-f">${lk ? T('lockedChapter') : on ? T('selectedRoute') : done ? T('completed') : T('tapToSelect')}</div></button>`;
    }).join('');
    const rd = routeData(ch), inf = rd.info;
    const enemies = chapterEnemies(ch);
    const threat = enemies.map(e => `<span class="rp-en ${e.d.elite ? 'elite' : ''}" title="${esc(e.d.name)}"><img alt="" src="${Art.url(Art.portrait(e.sh))}"><b>×${e.n}</b></span>`).join('');
    const first = !s.completed[n - 1], firstBonus = first ? Math.round(ch.coins * 0.5) : 0, xp = Math.round((40 + 15 * ch.n) * (first ? 1.5 : 1));
    const obst = [
      inf.jets ? ['steam', T('ob_jets', inf.jets)] : null, inf.grates ? ['grate', T('ob_grates', inf.grates)] : null,
      inf.spill ? ['spill', T('ob_spill')] : null, inf.carts ? ['cart', T('ob_carts', inf.carts)] : null,
      inf.heals ? ['cross', T('ob_heal', inf.heals)] : null, inf.checkpoint ? ['flag', T('ob_check')] : null,
      inf.risky ? ['skull', T('ob_risky')] : null,
    ].filter(Boolean).map(([ic, t]) => `<div class="rp-li">${icon(ic)}<span>${t}</span></div>`).join('') || `<div class="rp-li muted">${T('ob_none')}</div>`;
    const goals = [
      [true, T('goal_1')], [s.stars[n - 1] >= 2, T('goal_2')], [s.stars[n - 1] >= 3, T('goal_3', ch.fast)],
    ].map(([ok, t], i) => `<div class="rp-li ${ok && s.stars[n - 1] > i ? 'ok' : ''}">${icon('star', s.stars[n - 1] > i)}<span>${t}</span></div>`).join('');
    const mast = ch.mastery.map((m, k) => { const ok = !!s.mastery[ch.id + '_' + k]; return `<div class="rp-li ${ok ? 'ok' : ''}">${ok ? icon('check') : icon('trophy')}<span>${MASTERY_TEXT[m.k](m)} <em>+${MASTERY_REWARD}</em></span></div>`; }).join('');
    const skin = COSMETICS.find(c => c.id === s.cosmetics.selected) || COSMETICS[0];
    const loadout = `<div class="rp-load"><span class="rp-load-l">${T('loadout')}</span><img class="rp-skin" alt="" src="${Art.url(Art.courierPortrait(skin.id))}">${GARAGE_ORDER.map(id => `<span class="rp-gear"><img alt="" src="${Art.url(Art.garageIcon(id))}"><b>${s.garage[id]}</b></span>`).join('')}</div>`;
    ctx.root.innerHTML = `<div class="rp">
      <div class="rp-sign"><span>${T('runprep')}</span></div>
      <div class="rp-chips">${modes}</div>
      <div class="rp-chips">${eps}</div>
      <div class="rp-main">
        <div class="rp-cards">${btn(icon('up'), `data-a="step" data-d="-1" aria-label="${T('prev')}" ${n <= 1 ? 'disabled' : ''}`, 'steel', 'icon xs')}${cards}${btn(icon('down'), `data-a="step" data-d="1" aria-label="${T('next')}" ${n >= CHAPTERS.length ? 'disabled' : ''}`, 'steel', 'icon xs')}</div>
        <div class="rp-prev p-card p-navy">
          <div class="rp-prev-h"><small>${T('episodeN', 1)} · ${T('chapter')} ${n}</small><b>${esc(ch.name)}</b><em style="color:${PACKAGES[ch.pkg].color}">${T('pkg_' + ch.pkg)}</em></div>
          <div class="rp-prev-b">
            <div class="rp-map"><canvas width="132" height="300"></canvas><div class="rp-map-k"><span class="k-start">${T('start')}</span><span class="k-drop">${T('drop')}</span></div></div>
            <div class="rp-info">
              <div class="rp-k">${T('threat')}</div><div class="rp-v warn">${T('diff')[ch.diff]} · ${ch.enemies}</div>
              <div class="rp-ens">${threat}</div>
              <div class="rp-k">${T('route')}</div><div class="rp-v">${T('routeSegs', inf.segs, inf.combatSegs)}</div>
              <div class="rp-k">${T('deliveries')}</div><div class="rp-v ok">0/1</div>
              <div class="rp-k">${T('timer')}</div><div class="rp-v">${T('secShort', ch.timer)}</div>
              <div class="rp-k">${T('rewards')}</div><div class="rp-v gold">${icon('coin')}${fmtNum(ch.coins + firstBonus)}${first ? ` <small>${T('firstClear')}</small>` : ''}</div>
              <div class="rp-v xp">${icon('xp')}${xp} XP</div>
            </div>
          </div>
        </div>
      </div>
      <div class="rp-details">
        <div class="rp-box p-card p-navy"><div class="rp-bh">${T('keyObstacles')}</div>${obst}</div>
        <div class="rp-box p-card p-navy"><div class="rp-bh">${T('packageRule')}</div><div class="rp-li">${`<img alt="" src="${Art.url(Art.pkgIcon(ch.pkg, 28))}">`}<span>${T('pkgd_' + ch.pkg)}</span></div><div class="rp-bh">${T('starGoals')}</div>${goals}</div>
        <div class="rp-box p-card p-navy wide"><div class="rp-bh">${T('mastery')} ${s.stars[n - 1] >= 3 ? '' : `<small>(${T('masteryHint')})</small>`}</div>${mast}${s.bestTime[n - 1] ? `<div class="rp-li">${icon('clock')}<span>${T('best')}: ${s.bestTime[n - 1].toFixed(1)} s</span></div>` : ''}</div>
      </div>
      <div class="rp-start">
        ${locked ? `<div class="p-locknote big">${icon('lock')}<span>${T('lockedChapter')}</span></div>` : btn(`${T('startRun')}${icon('arrow')}`, 'data-a="start"', 'orange', 'rp-go')}
        ${loadout}
      </div></div>`;
    const s2 = ctx.root.querySelector('.rp-details'); if (s2) s2.scrollTop = st;
    ctx.route = rd; ctx.cv = ctx.root.querySelector('.rp-map canvas'); ctx.pan = 0; ctx.hold = 1.2;
    drawRoute(ctx.cv, rd, 0);
  },
  update(dt, ctx) {
    if (!ctx.cv || App.reduced()) return;
    if (ctx.hold > 0) { ctx.hold -= dt; return; }
    ctx.pan += dt * ctx.panDir * 0.14;
    if (ctx.pan >= 1) { ctx.pan = 1; ctx.panDir = -1; ctx.hold = 1.4; } else if (ctx.pan <= 0) { ctx.pan = 0; ctx.panDir = 1; ctx.hold = 1.2; }
    drawRoute(ctx.cv, ctx.route, ctx.pan);
  },
  onClick(e, ctx) {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    Audio.init(); const a = b.dataset.a;
    if (a === 'sel') { Audio.play('click'); ctx.sel = +b.dataset.n; if (ctx.sel > Save.data.unlocked) Audio.play('error'); this.render(ctx); }
    else if (a === 'step') { Audio.play('click'); ctx.sel = clamp(ctx.sel + (+b.dataset.d), 1, CHAPTERS.length); this.render(ctx); }
    else if (a === 'mode' || a === 'ep') { if (b.dataset.why) { Audio.play('error'); App.toast(b.dataset.why); } else Audio.play('click'); }
    else if (a === 'start') { if (ctx.sel <= Save.data.unlocked) { Audio.play('click'); App.go('FightScene', { chapter: ctx.sel }); } }
  },
  refresh(ctx) { this.render(ctx); },
  exit() {},
};
