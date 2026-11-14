// Varış (rıhtımda gemi + varış raporu) ve parşömen harita (keşfedilen yol + bilinmeyen sular).
import { h, icon } from '../dom.js';
import { T } from '../../data/strings.js';
import { HARBOR_BY_ID, HARBOR_TYPES, REGIONS } from '../../data/harbors.js';
import { mapLayout } from '../../rendering/MapArt.js';
import { PX } from '../../rendering/Renderer.js';
import { statusBar } from '../components.js';
import { encounterPanel } from './event.js';
import { PH } from '../../presentation/EncounterDirector.js';

const KIND_ICON = { heal: 'heart', damage: 'hull', xp: 'star', cargo: 'crate', item: 'gift', info: 'info', gold: 'coin', route: 'compass', chain: 'chain', status: 'flag', crew: 'crew', pet: 'paw', codex: 'book', buff: 'sun' };

/** Limana varış: gemi rıhtıma yanaşmış, liman adı açıklanır, varış eventleri rıhtımda oynar */
export function renderArrival(ui) {
  const core = ui.core;
  const run = core.run;
  const a = run.arrival;
  const hb = HARBOR_BY_ID[run.route[run.idx].harborId];
  const type = HARBOR_TYPES[hb.type];
  if (a.current) {
    if (ui.director.phase === PH.DOCKED || ui.director.phase === PH.IDLE) ui.director.enterHarbor(hb.final ? 'final' : hb.type, 1);
    const enc = encounterPanel(ui, a);
    return h('div.screen.world.arrival', {},
      h('div.topRow', {}, statusBar(ui, { compact: true })),
      enc ? h('div.encWrap', {}, enc) : null,
    );
  }
  const pending = a.queue.length - a.pos;
  return h('div.screen.world.arrival', {},
    h('div.topRow', {}, statusBar(ui, { compact: true }), h('button.iconBtn.sm', { onTap: () => ui.go('menu') }, icon('home', 'big'))),
    h('div.reveal', {}, h('small', {}, a.first ? 'Yolculuk başlıyor' : 'Liman keşfedildi'), h('h1', {}, hb.name), h('div', {}, icon(type.icon), ` ${hb.final ? 'Büyük Liman · Final' : type.name} · ${REGIONS[hb.region].name}`)),
    h('div.arrivalPanel.panel', {},
      h('div.apLines', { 'data-scroll': 'arr' }, ...a.report.map((l) => h(`div.line.k-${l.kind}`, {}, icon(KIND_ICON[l.kind] || 'info'), ' ', l.text))),
      h('div.apActions', {}, h('button.btn.big.primary', { onTap: () => { ui.audio.play('page'); core.arrivalNext(); } }, pending > 0 ? 'Rıhtımda bir şey var…' : T.enterHarbor, ' ', icon('anchor', 'big'))),
    ),
  );
}

export function renderMap(ui) {
  const core = ui.core;
  const run = core.run;
  const known = (i) => i <= run.idx;
  const prog = run.voyage ? Math.min(1, (run.voyage.elapsed || 0) / (run.voyage.duration || 1)) : null;
  ui.renderer.setScene('map', { known, progress: prog });
  const nodes = mapLayout(run.route, ui.renderer.W, ui.renderer.H);
  const labels = run.route.map((r, i) => {
    const hb = HARBOR_BY_ID[r.harborId];
    const k = known(i);
    if (!k && !hb.final) return null;
    return h(`button.mapLabel${i === run.idx ? '.cur' : ''}${i < run.idx ? '.past' : ''}`, { style: { left: nodes[i].x * PX + 'px', top: nodes[i].y * PX + 30 + 'px' }, onTap: () => ui.showHarbor(hb.id, k) },
      h('b', {}, hb.name), h('small', {}, HARBOR_TYPES[hb.type].name));
  }).filter(Boolean);
  if (!run.route.some((r) => HARBOR_BY_ID[r.harborId].final)) labels.push(h('div.mapLabel.final', { style: { left: (ui.renderer.W - 34) * PX + 'px', top: (nodes[0].y + 0) * PX + 'px' } }, h('b', {}, 'Büyük Liman'), h('small', {}, 'Son durak')));
  return h('div.screen.map', {},
    h('div.topRow', {}, statusBar(ui, { compact: true })),
    h('div.mapTitle', {}, h('h2', {}, 'Seyir Defteri'), h('div.legend', {}, `Ziyaret edilen ${run.idx + 1} liman · Ötesi bilinmeyen sular`)),
    h('div.mapLabels', {}, ...labels),
    h('div.arrivalPanel.panel.slim', {}, h('div.nextRoute', {}, icon('compass'), ' Rota her limanda seçtiğin deniz yoluyla şekillenir. Liman adları ancak varınca açıklanır.'),
      h('div.apActions', {}, h('button.btn.big', { onTap: () => { ui.sub.mapOpen = false; ui.render(); } }, T.close))),
  );
}
