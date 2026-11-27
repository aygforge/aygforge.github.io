// ui/Chrome.js — persistent hub chrome: TopBar (portrait, level, rank, XP, coins) and NavigationBar
// (Home | Garage | RunPrep | MetaHub | Settings). Both stay mounted while hub scenes change; only the
// centre content transitions. Badges and numbers always come from the real save state.
import { Save } from '../core/SaveManager.js';
import { T } from '../core/i18n.js';
import { Art } from '../core/Art.js';
import { GARAGE_ORDER, GARAGE_MAX, garageCost } from '../data/garage.js';
import { xpToNext } from '../data/quests.js';
import { Progression } from '../systems/Progression.js';
import { PlatformAdapter } from '../platform/PlatformAdapter.js';
import { icon } from './icons.js';
import { fmtNum, rankOf } from './UITheme.js';

export const NAV_TABS = [
  { id: 'MainMenu', icon: 'home', key: 'nav_home' },
  { id: 'Garage', icon: 'garage', key: 'nav_garage' },
  { id: 'RunPrep', icon: 'runprep', key: 'nav_runprep' },
  { id: 'MetaHub', icon: 'metahub', key: 'nav_metahub' },
  { id: 'Settings', icon: 'settings', key: 'nav_settings' },
];

/** Real badge counts. */
export function badgeCounts() {
  const s = Save.data;
  const affordable = GARAGE_ORDER.filter(id => s.garage[id] < GARAGE_MAX && s.coins >= garageCost(id, s.garage[id])).length;
  return { Garage: affordable, MetaHub: Progression.claimableCount() };
}

export const Chrome = (() => {
  let top, nav, shownCoins = null, targetCoins = 0, coinEl = null, visible = false, activeTab = null, onNav = () => {};
  function init(topEl, navEl, navHandler) {
    top = topEl; nav = navEl; onNav = navHandler;
    nav.innerHTML = NAV_TABS.map((t, i) => `<button class="p-tab" data-nav="${t.id}" data-i="${i}" aria-label="${T(t.key)}"><span class="p-tab-ic">${icon(t.icon)}</span><span class="p-tab-l">${T(t.key)}</span><span class="p-badge" hidden></span></button>`).join('');
    nav.addEventListener('click', e => { const b = e.target.closest('[data-nav]'); if (b) onNav(b.dataset.nav); });
    renderTop();
  }
  function renderTop() {
    const s = Save.data, need = xpToNext(s.level), rk = rankOf(s.level), store = PlatformAdapter.billing.available;
    top.innerHTML = `<div class="p-prof"><div class="p-avatar"><img alt="" src="${Art.url(Art.courierPortrait(s.cosmetics.selected))}"></div><div class="p-lvl">${s.level}</div></div>
      <div class="p-pinfo"><div class="p-rank">${T('rank_' + rk)}</div><div class="p-xpbar"><i style="width:${Math.min(100, s.xp / need * 100)}%"></i><span>${s.xp}/${need} XP</span></div></div>
      <div class="p-coins" data-coins>${icon('coin')}<b>${fmtNum(shownCoins ?? s.coins)}</b>${store ? `<button class="p-plus" data-store aria-label="${T('store')}">+</button>` : ''}</div>`;
    coinEl = top.querySelector('[data-coins] b');
  }
  /** Re-read save state; coins count up/down smoothly toward the real value. */
  function refresh() {
    const s = Save.data; targetCoins = s.coins; if (shownCoins === null) shownCoins = s.coins;
    renderTop();
    const c = badgeCounts();
    nav.querySelectorAll('[data-nav]').forEach(b => {
      const n = c[b.dataset.nav] || 0, el = b.querySelector('.p-badge');
      el.hidden = !n; el.textContent = n > 9 ? '9+' : n;
      b.classList.toggle('on', b.dataset.nav === activeTab);
    });
  }
  function show(scene) {
    visible = !!scene.hub; activeTab = scene.hub ? scene.id : null;
    top.classList.toggle('show', visible); nav.classList.toggle('show', visible);
    if (visible) refresh();
  }
  /** Delta-based coin count animation (skipped instantly with reduced motion). */
  function update(dt, reduced) {
    if (shownCoins === null || shownCoins === targetCoins || !coinEl) return;
    if (reduced) shownCoins = targetCoins;
    else { const d = targetCoins - shownCoins, step = Math.max(1, Math.abs(d) * Math.min(1, dt * 6)); shownCoins = Math.abs(d) <= step ? targetCoins : shownCoins + Math.sign(d) * step; }
    coinEl.textContent = fmtNum(Math.round(shownCoins));
  }
  return { init, refresh, show, update, get visible() { return visible; } };
})();
