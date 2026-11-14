// Run özeti: tamamlanan limanlar, XP kaynakları, altın, başarımlar, istatistikler.
import { h, icon, fmt } from '../dom.js';
import { T } from '../../data/strings.js';
import { ACHIEVEMENT_BY_ID } from '../../data/achievements.js';
import { HARBOR_BY_ID } from '../../data/harbors.js';
import { SHIP_BY_LEVEL } from '../../data/ships.js';

const SRC = { arrival: 'Limana varış', trade: 'Ticaret kârı', events: 'Olaylar', exploration: 'Keşif', discovery: 'Yeni liman tipleri', complete: "Run'ı tamamlama", other: 'Diğer' };

export function renderSummary(ui) {
  const core = ui.core;
  const run = core.run;
  const complete = run.result === 'complete';
  const abandoned = run.result === 'abandoned';
  const last = HARBOR_BY_ID[run.route[run.idx].harborId];
  const xpRows = Object.entries(run.xp.sources).filter(([, v]) => v).map(([k, v]) => h('div.xprow', {}, h('span', {}, SRC[k] || k), h('b', {}, (v > 0 ? '+' : '') + v)));
  const ach = run.newAchievements.map((id) => h('div.achRow', {}, icon('star'), ' ', h('b', {}, ACHIEVEMENT_BY_ID[id].name), h('small', {}, ' — ', ACHIEVEMENT_BY_ID[id].desc)));
  const leave = (view) => {
    core.dismissSummary();
    ui.renderer.sinkAnim = 0;
    ui.go(view);
  };
  return h('div.screen.world.summary', {},
    h('div.sumPanel.panel', {},
      h('h1', {}, complete ? "Büyük Liman'a ulaştın!" : abandoned ? 'Sefer yarıda kaldı' : 'Gemi battı'),
      h('p.sub', {}, complete ? 'Rıhtımda kalabalık seni alkışladı. Bu sefer denizler seninleydi.' : abandoned ? 'Limanda demir alıp seferi bıraktın.' : `${last.name} açıklarında dalgalar gemiyi yuttu. Ama her batış bir derstir.`),
      run.special.oldFriends ? h('div.banner.gold', {}, icon('heart'), ' ', T.oldFriendsLine) : null,
      h('div.sumGrid', {},
        h('div.sumStats', {},
          h('h3', {}, 'Sefer'),
          h('div.xprow', {}, h('span', {}, 'Ulaşılan liman'), h('b', {}, `${run.stats.harborsReached}`)),
          h('div.xprow', {}, h('span', {}, 'Son gemi'), h('b', {}, SHIP_BY_LEVEL[run.ship.level].name)),
          h('div.xprow', {}, h('span', {}, 'Elde kalan altın'), h('b', {}, `${fmt(run.gold)} `, h('small', {}, '(sıfırlanır)'))),
          h('div.xprow', {}, h('span', {}, 'En yüksek altın'), h('b', {}, fmt(run.stats.maxGold))),
          h('div.xprow', {}, h('span', {}, 'Ticaret kârı'), h('b', {}, fmt(run.stats.profit))),
          h('div.xprow', {}, h('span', {}, 'Çözülen olay'), h('b', {}, run.stats.eventsResolved)),
          h('div.xprow', {}, h('span', {}, 'Tamamlanan zincir'), h('b', {}, run.stats.chainsCompleted)),
          h('div.xprow', {}, h('span', {}, 'Seed'), h('b', {}, run.seed)),
        ),
        h('div.sumXp', {},
          h('h3', {}, 'XP dökümü'),
          ...xpRows,
          h('div.xprow.total', {}, h('span', {}, 'Kazanılan run XP'), h('b', {}, '+' + run.xp.total)),
          h('div.xprow', {}, h('span', {}, 'Harcanabilir XP'), h('b', {}, fmt(core.meta.xpAvailable))),
          h('div.xprow', {}, h('span', {}, 'Toplam kazanılan XP'), h('b', {}, fmt(core.meta.xpTotalEarned))),
        ),
      ),
      ach.length ? h('div.sumAch', {}, h('h3', {}, 'Açılan başarımlar'), ...ach) : null,
      h('div.sumBtns', {},
        h('button.btn.big.primary', { onTap: () => leave('upgrades') }, icon('upgrade', 'big'), ' ', T.upgrades),
        h('button.btn.big', { onTap: () => leave('menu') }, icon('home', 'big'), ' ', T.mainMenu),
      ),
    ),
  );
}
