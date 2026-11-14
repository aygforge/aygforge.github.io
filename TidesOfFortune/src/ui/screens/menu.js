import { h, icon, fmt } from '../dom.js';
import { T } from '../../data/strings.js';
import { HARBOR_BY_ID } from '../../data/harbors.js';
import { toggleFullscreen } from '../Stage.js';

export function renderMenu(ui) {
  const core = ui.core;
  const meta = core.meta;
  const active = core.hasActiveRun();
  const run = core.run;

  const startNew = async () => {
    if (active) {
      const ok = await ui.confirm(T.confirmNewRun, { title: 'Yeni run', ok: 'Yeni run başlat', danger: true });
      if (!ok) return;
      core.abandonRun();
      core.dismissSummary();
    } else if (run && run.ended) core.dismissSummary();
    seedSheet(ui);
  };

  const cont = () => {
    ui.view = 'game';
    ui.render();
  };

  let runInfo = null;
  if (active) {
    const hb = HARBOR_BY_ID[run.route[run.idx].harborId];
    runInfo = h('div.runinfo', {}, `Liman ${run.idx + 1}/${run.route.length}: ${hb.name} · ${fmt(run.gold)} altın · ${run.xp.total} XP`);
  }

  return h('div.screen.menu', {},
    h('div.menuTop', {}, h('button.iconBtn', { onTap: toggleFullscreen, title: 'Tam ekran' }, icon('fullscreen', 'big'))),
    h('div.titleBlock', {},
      h('h1.logo', {}, 'Tides', h('span', {}, ' of '), 'Fortune'),
      h('p.tagline', {}, T.tagline),
    ),
    h('div.menuButtons', {},
      active ? h('button.btn.big.primary', { onTap: cont }, icon('anchor', 'big'), ' ', T.continue) : null,
      runInfo,
      run && run.ended ? h('button.btn.big.primary', { onTap: cont }, icon('scroll', 'big'), ' Run Özeti') : null,
      h('button.btn.big' + (active ? '' : '.primary'), { onTap: startNew }, icon('sail', 'big'), ' ', T.newRun),
      h('button.btn.big', { onTap: () => ui.go('upgrades') }, icon('upgrade', 'big'), ' ', T.upgrades),
      h('div.row2', {},
        h('button.btn', { onTap: () => ui.go('codex') }, icon('book', 'big'), ' ', T.codex),
        h('button.btn', { onTap: () => ui.go('settings') }, icon('gear', 'big'), ' ', T.settings),
      ),
    ),
    h('div.menuFoot', {},
      h('span', {}, icon('star'), ` Harcanabilir XP: ${fmt(meta.xpAvailable)}`),
      h('span', {}, ` · Toplam XP: ${fmt(meta.xpTotalEarned)}`),
      h('span', {}, ` · Run: ${meta.stats.runs}`),
      h('span.ver', {}, 'v1.0 · HTML5'),
    ),
  );
}

function seedSheet(ui) {
  const input = h('input.seedInput', { type: 'text', maxLength: 16, placeholder: 'Boş bırak: rastgele seed', autocomplete: 'off', autocapitalize: 'characters', spellcheck: false });
  ui.sheet(h('div', {},
    h('p', {}, 'Her run bir seed ile üretilir: rota, limanlar, fiyatlar ve olaylar. Aynı seed ve aynı kararlar aynı sonuçları verir.'),
    h('label.lbl', {}, 'Seed (isteğe bağlı)'),
    input,
  ), {
    title: 'Yeni Run',
    actions: [{
      label: 'Denize açıl', primary: true, onTap: () => {
        const seed = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || null;
        ui.audio.play('depart');
        const r = ui.core.newRun(seed);
        if (r.ok) { ui.view = 'game'; ui.sub.mapOpen = false; ui.sub.harborTab = 'items'; ui.render(); }
      },
    }],
  });
}
