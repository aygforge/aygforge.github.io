// Yolculuk ekranı: yaşayan top-down gemi ana odak. Üstte küçük durum, altta ilerleme; karşılaşmalar
// aynı sahnede oynar, karar paneli gemiyi kapatmadan alttan açılır.
import { h, icon } from '../dom.js';
import * as X1 from '../../systems/X1System.js';
import * as Ship from '../../systems/ShipSystem.js';
import { endlessChips } from './x1ui.js';
import { HARBOR_BY_ID, REGIONS } from '../../data/harbors.js';
import { EVENT_BY_ID, EVENT_CATEGORIES, CHAINS } from '../../data/events.js';
import * as Events from '../../systems/EventSystem.js';
import { statusBar, itemBar } from '../components.js';
import { DISTANCE_NAMES, LANE_TYPES } from '../../systems/RouteSystem.js';
import { encounterPanel } from './event.js';
import { PH } from '../../presentation/EncounterDirector.js';

export function renderVoyage(ui) {
  const core = ui.core;
  const G = core.G;
  const run = core.run;
  const v = run.voyage;
  const d = ui.director;
  const sailing = d.phase === PH.SAIL || d.phase === PH.RESUME;
  const lane = run.currentLane;
  const warn = Events.tarcinWarning(G);
  const rc = Events.revealCount(G);

  const chips = [];
  if (sailing && warn) chips.push(h('div.warnChip.dog', {}, icon('dog'), warn.ahead === 1 ? ' Tarçın havlıyor! Yaklaşan olay tehlikeli.' : ' Tarçın iki olay öteden tehlike sezdi!'));
  if (sailing && Events.disasterAhead(G) && run.pets.includes('PET_GECEYARISI')) chips.push(h('div.warnChip.purple', {}, icon('parrot'), " Gece Yarısı'nın tüyleri kabardı…"));
  if (sailing && v.hintIdx != null && v.hintIdx >= v.pos) { const ev = EVENT_BY_ID[v.queue[v.hintIdx].id]; chips.push(h('div.warnChip.purple', {}, icon('parrot'), ` Kehanet: bir ${EVENT_CATEGORIES[ev.cat].name.toLowerCase()} olayı var.`)); }
  const chains = Object.entries(run.chains).filter(([, c]) => c.status === 'active').map(([id, c]) => h('div.chainChip', {}, icon('chain'), ` ${CHAINS[id].name} `, h('b.n', {}, `${c.step}/${CHAINS[id].steps}`)));
  if (X1.endlessOn(run)) chips.unshift(...endlessChips(run));
  if (run.x1?.escort) chips.push(h('div.warnChip', {}, icon('shield'), ' Kraliyet konvoyuna eşlik ediyorsun'));
  if (sailing && core.meta.upgrades.includes('UPG_X1_LEGEND_WHISPER') && !run.x1?.mysteryHinted && EVENT_BY_ID[v.queue[v.pos]?.id]?.cat === 'mystery') chips.push(h('div.warnChip.purple', {}, icon('eye'), ' Efsaneler fısıldıyor… sularda tuhaf bir şey var.'));
  const upcoming = sailing && rc ? Events.upcoming(G, rc).map((u) => h('div.upItem', { style: { borderColor: EVENT_CATEGORIES[u.ev.cat].color } }, h('b', {}, u.ev.title))) : [];

  const fill = h('div.pfill');
  ui.progressFill = fill;
  const host = core.host();
  const enc = encounterPanel(ui, host);

  return h('div.screen.world.voyage', {},
    h('div.topRow', {}, statusBar(ui, { compact: true }), h('button.iconBtn.sm', { onTap: () => { ui.sub.mapOpen = true; ui.render(); }, title: 'Harita' }, icon('map', 'big')), h('button.iconBtn.sm', { onTap: () => ui.go('menu'), title: 'Ana menü' }, icon('home', 'big'))),
    h('div.voyHud', {},
      h('div', {}, h('small', {}, 'Rota'), h('b', {}, lane ? LANE_TYPES[lane.type].name : DISTANCE_NAMES[v.distance])),
      h('div', {}, h('small', {}, 'Sular'), h('b', {}, REGIONS[lane?.region || HARBOR_BY_ID[run.route[v.fromIdx].harborId].region].name)),
      h('div', {}, h('small', {}, 'Hedef'), h('b', {}, '???')),
    ),
    h('div.voyChips', {}, d.phase === PH.APPROACH && enc ? enc : null, ...chips, ...chains),
    upcoming.length ? h('div.upcoming', {}, h('small', {}, 'Önden görünenler'), ...upcoming) : null,
    enc && d.phase !== PH.APPROACH ? h('div.encWrap', {}, enc) : null,
    !enc || d.phase === PH.APPROACH ? h('div.voyBottom', {},
      itemBar(ui, { compact: true }),
      core.meta.upgrades.includes('UPG_X1_EMERGENCY_LOCKER') && !run.x1?.once?.locker && run.ship.hull < Ship.maxHull(G) ? h('button.btn.sm.lockerBtn', { onTap: () => { const r = core.useEmergencyLocker(); if (r.ok) { ui.audio.play('repair'); ui.toast(`Acil Durum Dolabı: +${r.healed} hull`, 'good'); } else ui.toast(r.reason, 'warn'); } }, icon('kit'), ' +15') : null,
      h('div.progressWrap', {}, h('div.progress', {}, fill, h('div.pEnd', {}, icon('anchor'))), h('div.plabels', {}, h('span', {}, HARBOR_BY_ID[run.route[v.fromIdx].harborId].name), h('span', {}, 'Bilinmeyen liman'))),
    ) : null,
  );
}

/** Renderer her karede çağırır: ilerleme çubuğu */
export function tickVoyage(ui) {
  const v = ui.core.run?.voyage;
  if (!ui.progressFill || !v || !ui.progressFill.isConnected) return;
  ui.progressFill.style.width = Math.min(100, ((v.elapsed || 0) / (v.duration || 1)) * 100) + '%';
}
