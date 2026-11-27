// scenes/MainMenu.js — animated restaurant atmosphere (live canvas world), logo, active courier,
// last open restaurant + campaign progress, large Play / Continue. Hub chrome visible.
import { Save } from '../core/SaveManager.js';
import { T } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { CHAPTERS } from '../data/chapters.js';
import { EPISODE_IDS } from '../data/ids.js';
import { Progression } from '../systems/Progression.js';
import { icon } from '../ui/icons.js';
import { bar, btn, stars } from '../ui/UITheme.js';
import { App } from '../ui/App.js';

export const MainMenu = {
  id: 'MainMenu', hub: true, navIndex: 0, canvas: 'menu',
  enter(ctx) { this.render(ctx); ctx.on(ctx.root, 'click', e => this.onClick(e, ctx)); },
  render(ctx) {
    const s = Save.data, done = s.completed.filter(Boolean).length, total = Progression.totalStars();
    const next = Math.min(CHAPTERS.length, s.unlocked), ch = CHAPTERS[next - 1], started = s.stats.runs > 0 || done > 0;
    const allDone = !!s.episodes.coffee;
    const locked = EPISODE_IDS.length - 1; // restaurants after Coffee (content arrives in Phases 06–08)
    ctx.root.innerHTML = `<div class="mm">
      <div class="mm-logo"><div class="mm-t">Delive<b>Rogue</b></div><div class="mm-s">${T('subtitle')}</div></div>
      <div class="mm-ep p-panel p-steel">
        <div class="mm-ep-h"><span class="mm-ep-ic">☕</span><div><div class="mm-ep-k">${T('episodeN', 1)}</div><div class="mm-ep-n">Coffee District</div></div>${stars(Math.min(3, Math.floor(total / 12)), 3, 'sm')}</div>
        <div class="mm-ep-row"><span>${T('chapters')}</span><b>${done}/12</b></div>${bar(done / 12, 'gold')}
        <div class="mm-ep-row"><span>${T('stars')}</span><b>${total}/36</b></div>${bar(total / 36, 'blue')}
        <div class="mm-ep-more">${icon('lock')}<span>${T('mm_moreEpisodes', locked)}</span></div>
      </div>
      <div class="mm-cta">
        ${btn(`${icon('play')}<span class="mm-cta-l">${started ? T('continue') : T('play')}</span>`, 'data-a="play"', 'orange', 'mm-play')}
        <div class="mm-next">${allDone ? T('mm_allDone') : `${T('chapter')} ${ch.n} · ${esc(ch.name)}`}</div>
      </div>
      <div class="mm-ver">v0.3 · AYG FORGE</div></div>`;
  },
  onClick(e, ctx) {
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'play') App.go('RunPrep', { chapter: Math.min(CHAPTERS.length, Save.data.unlocked) });
  },
  refresh(ctx) { this.render(ctx); },
  exit() {},
};
