// Dünya haritası: rota ilerlemesi, mesafe renkleri, bölge değişimleri; varışta varış raporu.
import { h, icon } from '../dom.js';
import { T } from '../../data/strings.js';
import { HARBOR_BY_ID, HARBOR_TYPES, REGIONS } from '../../data/harbors.js';
import { mapLayout, DIST_COLORS } from '../../rendering/MapArt.js';
import { PX } from '../../rendering/Renderer.js';
import { DISTANCE_NAMES, distanceInfo } from '../../systems/RouteSystem.js';
import { statusBar } from '../components.js';

const KIND_ICON = { heal: 'heart', damage: 'hull', xp: 'star', cargo: 'crate', item: 'gift', info: 'info', gold: 'coin', route: 'compass', chain: 'chain', status: 'flag', crew: 'crew', pet: 'paw', codex: 'book', buff: 'sun' };

export function renderMap(ui, { arrival }) {
  const core = ui.core;
  const run = core.run;
  const meta = core.meta;
  const known = (i) => {
    const id = run.route[i].harborId;
    return i <= run.idx || meta.upgrades.includes('UPG_HARBOR_SIGHT') || !!meta.codex.harbors[id] || !!meta.codex.revealed[id];
  };
  ui.renderer.setScene('map', { known });
  ui.music(arrival ? 'voyage' : 'harbor', 'sea');
  const bw = ui.renderer.W;
  const bh = ui.renderer.H;
  const nodes = mapLayout(run.route, bw, bh);
  const labels = run.route.map((r, i) => {
    const hb = HARBOR_BY_ID[r.harborId];
    const k = known(i);
    const cur = i === run.idx;
    return h(`button.mapLabel${cur ? '.cur' : ''}${i < run.idx ? '.past' : ''}${hb.final ? '.final' : ''}`, {
      style: { left: nodes[i].x * PX + 'px', top: nodes[i].y * PX + 30 + 'px' },
      onTap: () => ui.showHarbor(hb.id, k),
    }, h('b', {}, hb.name), h('small', {}, k ? HARBOR_TYPES[hb.type].name : '???'));
  });
  // sonraki rota bilgisi
  let nextInfo = null;
  if (run.idx < run.route.length - 1) {
    const d = run.route[run.idx].distance;
    const di = distanceInfo(d);
    const cur = HARBOR_BY_ID[run.route[run.idx].harborId];
    const nx = HARBOR_BY_ID[run.route[run.idx + 1].harborId];
    const warns = [];
    if (nx.region !== cur.region) warns.push(`Yeni bölge: ${REGIONS[nx.region].name}`);
    if (known(run.idx + 1) && nx.type === 'fog') warns.push('Sis limanı: olaylar sık (+1)');
    if (known(run.idx + 1) && nx.type === 'mystery') warns.push('Gizemli Ada: tehlikeli yol');
    if (run.pendingRoute.length) warns.push('Bir zincir bir sonraki rotada devam edecek');
    nextInfo = h('div.nextRoute', {},
      h('span.dist', { style: { background: DIST_COLORS[d] } }, `${DISTANCE_NAMES[d]} rota`),
      h('span', {}, ` · ${di.events[0] === di.events[1] ? di.events[0] : di.events.join('–')} olay · Hedef: ${nx.name}`),
      ...warns.map((w) => h('span.warnTag', {}, icon('warn'), ' ', w)),
    );
  } else {
    nextInfo = h('div.nextRoute', {}, icon('crown'), " Büyük Liman: run'ın son durağı.");
  }

  const legend = h('div.legend', {},
    h('span', {}, h('i.sw', { style: { background: DIST_COLORS.short } }), 'Kısa (2 olay)'),
    h('span', {}, h('i.sw', { style: { background: DIST_COLORS.medium } }), 'Orta (3–4)'),
    h('span', {}, h('i.sw', { style: { background: DIST_COLORS.long } }), 'Uzun (5–6)'),
  );

  let panel;
  if (arrival) {
    const a = run.arrival;
    const hb = HARBOR_BY_ID[run.route[run.idx].harborId];
    const pendingEvents = a.queue.length - a.pos;
    panel = h('div.arrivalPanel.panel', {},
      h('div.apHead', {}, h('h2', {}, a.first ? 'Yolculuk Başlıyor' : `Varış: ${hb.name}`), h('span.tag', { style: { background: REGIONS[hb.region].color } }, REGIONS[hb.region].name)),
      h('div.apLines', { 'data-scroll': 'arr' }, ...a.report.map((l) => h(`div.line.k-${l.kind}`, {}, icon(KIND_ICON[l.kind] || 'info'), ' ', l.text))),
      h('div.apActions', {},
        h('button.btn.big.primary', { onTap: () => { ui.audio.play('page'); core.arrivalNext(); } }, pendingEvents > 0 ? 'Rıhtımda bir şey var…' : T.enterHarbor, ' ', icon('anchor', 'big')),
      ),
    );
  } else {
    panel = h('div.arrivalPanel.panel.slim', {},
      nextInfo,
      h('div.apActions', {}, h('button.btn.big', { onTap: () => { ui.sub.mapOpen = false; ui.render(); } }, T.close)),
    );
  }

  return h('div.screen.map', {},
    h('div.topRow', {}, statusBar(ui), h('button.iconBtn', { onTap: () => ui.go('menu'), title: T.mainMenu }, icon('home', 'big'))),
    h('div.mapTitle', {}, h('h2', {}, `Rota · ${run.route.length} liman`), legend, arrival ? nextInfo : null),
    h('div.mapLabels', {}, ...labels),
    panel,
  );
}
