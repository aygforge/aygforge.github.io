// Yolculuk ekranı: animasyonlu deniz, güverte, ilerleme çubuğu, uyarılar; event noktalarında durur.
import { h, icon } from '../dom.js';
import { HARBOR_BY_ID } from '../../data/harbors.js';
import { EVENT_BY_ID, EVENT_CATEGORIES, CHAINS } from '../../data/events.js';
import * as Ship from '../../systems/ShipSystem.js';
import * as Events from '../../systems/EventSystem.js';
import { statusBar, itemBar } from '../components.js';
import { DISTANCE_NAMES } from '../../systems/RouteSystem.js';

export function renderVoyage(ui) {
  const core = ui.core;
  const G = core.G;
  const run = core.run;
  const v = run.voyage;
  const dest = HARBOR_BY_ID[run.route[v.toIdx].harborId];
  const warn = Events.tarcinWarning(G);
  const disaster = Events.disasterAhead(G);
  const nextQ = v.queue[v.pos];
  const nextEv = nextQ ? EVENT_BY_ID[nextQ.id] : null;
  const mood = disaster ? 'disaster' : nextEv && nextEv.cat === 'danger' ? 'danger' : nextEv && nextEv.cat === 'fortune' ? 'fortune' : 'calm';
  ui.renderer.setScene('voyage', { damage: Ship.hullCategory(G), mood: warn || disaster ? mood : mood === 'fortune' ? 'fortune' : 'calm', shadowPet: 'PET_ZIPIR' });
  const wx = ui.renderer.weatherFor(run, v.toIdx);
  ui.music('voyage', wx.fx.includes('rain') || wx.sky === 'storm' ? 'storm' : 'sea');
  if (v.showShadow && !ui._shadowDone) {
    ui._shadowDone = true;
    setTimeout(() => ui.renderer.showShadow(), 1200 + Math.random() * 1500);
  }

  const total = v.queue.length;
  const markers = [];
  const rc = Events.revealCount(G);
  for (let i = 0; i < total; i++) {
    const q = v.queue[i];
    const ev = EVENT_BY_ID[q.id];
    const done = i < v.pos;
    const revealed = done || (i >= v.pos && i < v.pos + rc);
    const hinted = v.hintIdx === i && !done;
    const col = revealed || hinted ? EVENT_CATEGORIES[ev.cat]?.color : '#8a7a5a';
    markers.push(h(`div.marker${done ? '.done' : ''}`, { style: { left: ((i + 1) / (total + 1)) * 100 + '%', background: col }, title: revealed ? ev.title : '?' }, revealed ? '' : hinted ? '!' : '?'));
  }

  const chips = [];
  if (warn) chips.push(h('div.warnChip.dog', {}, icon('dog'), warn.ahead === 1 ? " Tarçın havlıyor! Yaklaşan olay tehlikeli." : ' Tarçın iki olay öteden tehlike sezdi!'));
  if (disaster && Events.disasterAhead(G)) {
    if (run.pets.includes('PET_GECEYARISI')) chips.push(h('div.warnChip.purple', {}, icon('parrot'), " Gece Yarısı'nın tüyleri kabardı…"));
    if (run.pets.includes('PET_ZIPIR')) chips.push(h('div.warnChip.grey', {}, icon('cat'), ' Zıpır güvertenin ortasına oturdu ve kıpırdamıyor.'));
  }
  if (v.hintIdx != null && v.hintIdx >= v.pos) {
    const ev = EVENT_BY_ID[v.queue[v.hintIdx].id];
    chips.push(h('div.warnChip.purple', {}, icon('parrot'), ` Gece Yarısı'nın kehaneti: bu rotada bir ${EVENT_CATEGORIES[ev.cat].name.toLowerCase()} olayı var.`));
  }
  const upcoming = rc ? Events.upcoming(G, rc).map((u) => h('div.upItem', { style: { borderColor: EVENT_CATEGORIES[u.ev.cat].color } }, h('b', {}, u.ev.title), h('small', {}, EVENT_CATEGORIES[u.ev.cat].name))) : [];
  const chains = Object.entries(run.chains).filter(([, c]) => c.status === 'active').map(([id, c]) => h('div.chainChip', {}, icon('chain'), ` ${CHAINS[id].name} ${c.step ? `${c.step}/${CHAINS[id].steps}` : ''}`));

  const fill = h('div.pfill');
  ui.progressFill = fill;
  ui.progressBase = v.pos / (total + 1);
  ui.progressStep = 1 / (total + 1);

  startSailing(ui);

  return h('div.screen.voyage', {},
    h('div.topRow', {}, statusBar(ui), h('button.iconBtn', { onTap: () => ui.go('menu'), title: 'Ana menü' }, icon('home', 'big'))),
    h('div.voyHud.panel.thin', {},
      h('div', {}, h('small', {}, 'Hedef'), h('b', {}, dest.name)),
      h('div', {}, h('small', {}, 'Rota'), h('b', {}, `${DISTANCE_NAMES[v.distance]}`)),
      h('div', {}, h('small', {}, 'Kalan olay'), h('b', {}, `${Math.max(0, total - v.pos)}`)),
    ),
    h('div.voyChips', {}, ...chips, ...chains),
    upcoming.length ? h('div.upcoming', {}, h('small', {}, 'Önden görünenler'), ...upcoming) : null,
    h('div.voyBottom', {},
      itemBar(ui, { compact: true }),
      h('div.progressWrap', {},
        h('div.progress', {}, fill, ...markers, h('div.pEnd', {}, icon('anchor'))),
        h('div.plabels', {}, h('span', {}, HARBOR_BY_ID[run.route[v.fromIdx].harborId].name), h('span', {}, dest.name)),
      ),
      h(`button.btn${ui.fast ? '.primary' : ''}`, { onTap: () => { ui.fast = !ui.fast; ui.render(); } }, icon('sail'), ui.fast ? ' Hızlı ✓' : ' Hızlı'),
    ),
  );
}

function startSailing(ui) {
  const run = ui.core.run;
  const v = run.voyage;
  const key = `${run.id}|${v.toIdx}|${v.pos}|${v.queue.length}`;
  if (ui.sailing && ui.sailing.key === key) return;
  const dur = (ui.fast ? 0.9 : 2.4) * (ui.core.settings.reduceMotion ? 0.6 : 1);
  ui.sailing = { key, start: performance.now(), dur: dur * 1000 };
  ui.renderer.sailSpeed = ui.fast ? 2.2 : 1;
  clearTimeout(ui.sailTimer);
  ui.sailTimer = setTimeout(() => {
    const r = ui.core.run;
    if (!r || r.phase !== 'voyage' || r.voyage.current) return;
    const k2 = `${r.id}|${r.voyage.toIdx}|${r.voyage.pos}|${r.voyage.queue.length}`;
    if (k2 !== key || ui.view !== 'game') { ui.sailing = null; if (ui.view === 'game') ui.render(); return; }
    ui.sailing = null;
    ui.core.nextEvent();
  }, dur * 1000);
}

/** Renderer her karede çağırır: ilerleme çubuğunu akıcı günceller */
export function tickVoyage(ui) {
  if (!ui.progressFill || !ui.sailing || !ui.progressFill.isConnected) return;
  const f = Math.min(1, (performance.now() - ui.sailing.start) / ui.sailing.dur);
  ui.progressFill.style.width = (ui.progressBase + ui.progressStep * f) * 100 + '%';
}
