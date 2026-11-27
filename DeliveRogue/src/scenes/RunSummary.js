// scenes/RunSummary.js — separate result scene (layout authority: reference/ui/88172.png).
// Ornate title, XP bar, four result cards (kills, package, coins, time), two performance / mastery
// panels, stars, unlocks and rewards. All values come from the real run report (`run.stats`) and the
// settlement (`run.settled`), which Progression already committed exactly once BEFORE this scene shows;
// the animation is purely visual and skippable (tap). Re-entering never pays again.
import { Save } from '../core/SaveManager.js';
import { Audio } from '../core/AudioManager.js';
import { T } from '../core/i18n.js';
import { View } from '../core/state.js';
import { esc, fmtTime1 } from '../core/util.js';
import { CHAPTERS, MASTERY_REWARD } from '../data/chapters.js';
import { xpToNext } from '../data/quests.js';
import { icon } from '../ui/icons.js';
import { backdrop } from '../ui/SceneArt.js';
import { bar, btn, countUp, fmtNum, stars } from '../ui/UITheme.js';
import { App } from '../ui/App.js';

export const RunSummary = {
  id: 'RunSummary', hub: false, canvas: null,
  enter(ctx, params) {
    const run = ctx.run = params.run; ctx.root.style.backgroundImage = `url(${backdrop('ops', View.h)})`;
    if (!run) { App.go('RunPrep'); return; }
    const r = run.settled || {}, st = run.stats, ch = run.ch, s = Save.data, need = xpToNext(s.level), ok = run.success;
    const hasNext = ok && ch.n < CHAPTERS.length && s.unlocked >= ch.n + 1;
    const badges = [
      r.epComplete ? `<span class="rs-b gold">${T('epCompleteShort')}</span>` : '',
      r.first ? `<span class="rs-b">${T('firstBonus')} +${r.firstBonus}</span>` : '',
      r.perfBonus ? `<span class="rs-b">★ +${r.perfBonus}</span>` : '', r.pkgBonus ? `<span class="rs-b">${T('pkgBonus')} +${r.pkgBonus}</span>` : '', r.bossFirst ? `<span class="rs-b gold">🐉 ${T('bossFirstClear')} +${r.bossFirst}</span>` : '', r.skillBonus ? `<span class="rs-b">✦ +${r.skillBonus}</span>` : '', r.killBonus ? `<span class="rs-b">${T('killBonus')} +${r.killBonus}</span>` : '',
      r.unlockedNext ? `<span class="rs-b gold">${T('nextUnlocked')}</span>` : '', r.newBest ? `<span class="rs-b blue">${T('newBest')}</span>` : '',
      r.levelUps ? `<span class="rs-b gold">${T('levelUp', s.level)}</span>` : '',
    ].join('');
    const mastDone = ch.mastery.filter((m, k) => s.mastery[ch.id + '_' + k]).length;
    const row = (ic, label, valHtml, sub = '') => `<div class="rs-row p-card p-navy"><div class="rs-ic">${ic}</div><div class="rs-val"><small>${label}</small><b>${valHtml}</b>${sub ? `<em>${sub}</em>` : ''}</div></div>`;
    const pkgPct = Math.round((st.pkgPct || 0) * 100);
    ctx.root.innerHTML = `<div class="rs ${ok ? 'win' : 'lose'}">
      <div class="rs-banner"><div class="rs-gem l"></div><div class="rs-title">${ok ? T('deliveryComplete') : T('deliveryFailed')}</div><div class="rs-gem r"></div></div>
      <div class="rs-sub">${T('chapter')} ${ch.n} · ${esc(ch.name)}</div>
      ${ok ? `<div class="rs-stars">${stars(r.stars || 0, 3, 'big')}</div>` : `<div class="rs-reason">${T('fail_' + run.reason)}</div>`}
      <div class="rs-xp"><span class="rs-xpic">${icon('xp')}</span><div class="rs-xpb"><div class="rs-xpl">${T('level')} ${s.level}<span>+<b data-c="xp">0</b> XP</span></div>${bar(s.xp / need, 'cyan')}<small>${s.xp}/${need}</small></div></div>
      ${row(icon('skull'), T('kills'), `<span data-c="kills">0</span>${st.eliteKills ? ` <em class="rs-el">${st.eliteKills} ${T('elite')}</em>` : ''}`)}
      ${row(icon('box'), T('package'), `${Math.ceil(st.pkgHp)}/${st.pkgMax} <em>${pkgPct}%</em>`, ok ? '' : `${T('progressReached')} %${Math.round((st.progress || 0) * 100)}`)}
      ${row(icon('coin'), ok ? T('coins') : T('consolation'), `+<span data-c="coins">0</span>`)}
      ${row(icon('clock'), T('time'), `${fmtTime1(st.time)}${ok ? ` <em>/ 3★ ${ch.fast}s</em>` : ''}`)}
      <div class="rs-pair">
        <div class="rs-half p-card p-navy"><div class="rs-ic sm">${icon('trophy')}</div><div><small>${T('grade')}</small><b class="rs-grade ${ok ? '' : 'F'}">${ok ? r.grade : 'F'}</b></div></div>
        <div class="rs-half p-card p-navy"><div class="rs-ic sm">${icon('shield')}</div><div><small>${T('mastery')}</small><b>${mastDone}/${ch.mastery.length}</b>${(r.mastery || []).length ? `<em>+${r.mastery.length * MASTERY_REWARD}</em>` : ''}</div></div>
      </div>
      <div class="rs-badges">${badges}</div>
      <div class="rs-btns">
        ${hasNext ? btn(`${T('nextChapter')}${icon('arrow')}`, 'data-a="next"', 'orange', 'rs-main') : btn(`${T('cont')}${icon('arrow')}`, 'data-a="continue"', 'orange', 'rs-main')}
        <div class="rs-sec">${btn(`${icon('retry')}${ok ? T('replay') : T('retry')}`, 'data-a="replay"', 'blue')}${hasNext ? btn(T('cont'), 'data-a="continue"', 'steel') : btn(T('toMenu'), 'data-a="menu"', 'steel')}</div>
      </div></div>`;
    const red = App.reduced(), q = k => ctx.root.querySelector(`[data-c="${k}"]`);
    ctx.timeout(() => { countUp(ctx, q('kills'), 0, st.kills, 500, red); countUp(ctx, q('coins'), 0, r.coins || 0, 900, red); countUp(ctx, q('xp'), 0, r.xp || 0, 900, red); if (ok && (r.coins || 0) > 0) Audio.play('coin'); }, red ? 0 : 350);
    if (ok) Audio.play('win');
    const later = []; (r.milestones || []).forEach(m => later.push('🏆 ' + T('milestoneGot', m))); (r.quests || []).forEach(q2 => later.push('📋 ' + T('questReady', q2)));
    later.forEach((m, i) => ctx.timeout(() => App.toast(m), 900 + i * 900));
    ctx.on(ctx.root, 'click', e => this.onClick(e, ctx));
  },
  onClick(e, ctx) {
    const b = e.target.closest('[data-a]');
    if (!b) { ctx.root.querySelectorAll('[data-c]').forEach(el => { el.dataset.skip = '1'; }); ctx.root.classList.add('skip'); return; } // tap = skip animation
    Audio.init(); Audio.play('click');
    const n = ctx.run.n, a = b.dataset.a;
    if (a === 'next') App.go('FightScene', { chapter: n + 1 });
    else if (a === 'replay') App.go('FightScene', { chapter: n });
    else if (a === 'continue') App.go('RunPrep', { chapter: Math.min(CHAPTERS.length, ctx.run.success ? Math.min(Save.data.unlocked, n + 1) : n) });
    else if (a === 'menu') App.go('MainMenu');
  },
  back(ctx) { App.go('RunPrep', { chapter: ctx.run ? ctx.run.n : 1 }); return true; },
  exit() {},
};
