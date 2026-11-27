// scenes/MetaHub.js — logistics operations centre (layout authority: reference/ui/88175.png + 88173.png).
// Centre: Delivery Milestones hologram station (real progress + collect). Bottom centre: Delivery Board.
// Sides: Daily / Weekly; top: Special Events; Courier Book terminal. Milestone detail = connected reward
// nodes with locked / claimable / claimed states. Reference chests/gems are mapped to coins/trophies.
// Daily, Weekly and Special Events are not part of this build yet (Phase 11) and are shown locked —
// never with invented progress.
import { Save } from '../core/SaveManager.js';
import { Audio } from '../core/AudioManager.js';
import { Art } from '../core/Art.js';
import { T } from '../core/i18n.js';
import { View } from '../core/state.js';
import { esc, fmtTime1 } from '../core/util.js';
import { CHAPTERS } from '../data/chapters.js';
import { ENEMY_DB, ENEMY_ORDER } from '../data/enemies.js';
import { MILESTONES, QUESTS } from '../data/quests.js';
import { Progression } from '../systems/Progression.js';
import { icon } from '../ui/icons.js';
import { backdrop } from '../ui/SceneArt.js';
import { bar, btn, fmtNum, stars } from '../ui/UITheme.js';
import { App } from '../ui/App.js';

/** Real delivery track: next delivery-count milestone threshold. */
const DELIVERY_TRACK = [1, 5, 10];
function trackInfo(s) {
  const d = s.stats.deliveries, next = DELIVERY_TRACK.find(t => d < t);
  return next ? { d, next, pct: d / next } : { d, next: DELIVERY_TRACK[DELIVERY_TRACK.length - 1], pct: 1 };
}
function msState(s, m) { return s.milestones.claimed[m.id] ? 'claimed' : s.milestones.unlocked[m.id] ? 'ready' : 'locked'; }

export const MetaHub = {
  id: 'MetaHub', hub: true, navIndex: 3, canvas: null,
  enter(ctx, params = {}) {
    ctx.view = params.view || 'main';
    ctx.root.style.backgroundImage = `url(${backdrop('ops', View.h)})`;
    this.render(ctx);
    ctx.on(ctx.root, 'click', e => this.onClick(e, ctx));
  },
  render(ctx) {
    const sc = ctx.root.querySelector('.p-scroll'), st = sc ? sc.scrollTop : 0;
    ctx.root.innerHTML = ({ main: this.main, milestones: this.milestones, board: this.board, book: this.book })[ctx.view].call(this, ctx);
    const s2 = ctx.root.querySelector('.p-scroll'); if (s2) s2.scrollTop = st;
  },
  main() {
    const s = Save.data, got = MILESTONES.filter(m => s.milestones.unlocked[m.id]).length, ready = MILESTONES.filter(m => msState(s, m) === 'ready').length;
    const qDone = QUESTS.filter(q => Progression.questDone(s, q)).length, qReady = QUESTS.filter(q => Progression.questDone(s, q) && !s.quests.claimed[q.id]).length;
    const seen = ENEMY_ORDER.filter(id => s.book[id].seen).length;
    const lockedPanel = (cls, ic, title) => `<div class="mh-side ${cls} p-card p-steel locked"><div class="mh-side-h">${title}</div><div class="mh-side-ic">${icon(ic)}</div><div class="p-locknote">${icon('lock')}<span>${T('meta_soon')}</span></div></div>`;
    return `<div class="mh">
      <div class="mh-top">
        <button class="mh-book p-card p-blue" data-a="view" data-v="book"><span class="mh-term">${icon('book')}</span><b>${T('courierBook')}</b><small>${T('bookCount', seen, ENEMY_ORDER.length)}</small></button>
        <div class="mh-event p-card p-violet locked"><b>${T('specialEvents')}</b><span class="mh-ev-ic">${icon('event')}</span><div class="p-locknote">${icon('lock')}<span>${T('meta_soon')}</span></div></div>
      </div>
      <div class="mh-station" data-a="view" data-v="milestones" role="button" aria-label="${T('milestones')}">
        <div class="mh-plate">${T('deliveryMilestones')}</div>
        <div class="mh-holo"><div class="mh-beam"></div><div class="mh-cube">${icon('box')}</div></div>
        <div class="mh-base"><div class="mh-pct">${T('msProgress', got, MILESTONES.length)}</div>${bar(got / MILESTONES.length, 'cyan')}
          ${ready ? btn(`${T('collect')} <small>(${ready})</small>`, 'data-a="collect"', 'gold', 'mh-collect') : btn(T('details'), 'data-a="view" data-v="milestones"', 'blue', 'mh-collect')}</div>
      </div>
      <div class="mh-bottom">
        ${lockedPanel('daily', 'clipboard', T('dailyTasks'))}
        <div class="mh-board p-card p-wood"><div class="mh-clip"></div><div class="mh-board-h">${T('board')}</div>
          <div class="mh-board-map">${icon('box')}${icon('pin')}${icon('box')}</div>
          <div class="mh-board-s">${T('boardProgress', qDone, QUESTS.length)}${qReady ? ` · <b>${T('claimableN', qReady)}</b>` : ''}</div>
          ${btn(T('openBoard'), 'data-a="view" data-v="board"', qReady ? 'gold' : 'blue', 'sm')}</div>
        ${lockedPanel('weekly', 'calendar', T('weeklyTasks'))}
      </div></div>`;
  },
  head(title) { return `<div class="p-subhead">${btn(icon('back'), `data-a="close" aria-label="${T('back')}"`, 'steel', 'icon')}<h1 class="p-title sm">${title}</h1></div>`; },
  milestones() {
    const s = Save.data, tr = trackInfo(s);
    const nodes = MILESTONES.map((m, i) => {
      const st = msState(s, m);
      return `<div class="ms-node ${st}">${i ? '<i class="ms-link"></i>' : ''}
        <div class="ms-ic">${st === 'claimed' ? icon('check') : st === 'ready' ? `<span class="ms-em">${m.icon}</span>` : icon('lock')}</div>
        <div class="ms-tx"><b>${m.name}</b><small>${m.text}</small></div>
        <div class="ms-rw">${st === 'ready' ? btn(`${T('claim')} ${icon('coin')}${m.reward}`, `data-a="claimm" data-id="${m.id}"`, 'gold', 'sm') : st === 'claimed' ? `<span class="ms-done">${T('claimed')}</span>` : `<span class="ms-rv">${icon('coin')}${m.reward}</span>`}</div></div>`;
    }).join('');
    return `<div class="mh sub">${this.head(T('milestoneRewards'))}
      <div class="ms-track p-card p-navy"><div class="ms-track-h">${T('trackDeliveries')}</div>${bar(tr.pct, 'gold')}<b>${tr.d}/${tr.next}</b></div>
      <div class="ms-list p-scroll">${nodes}</div></div>`;
  },
  board() {
    const s = Save.data;
    const list = QUESTS.map(q => {
      const v = Math.min(q.target, s.stats[q.stat] || 0), done = v >= q.target, cl = !!s.quests.claimed[q.id];
      return `<div class="bd-q p-card ${cl ? 'p-steel' : done ? 'p-gold' : 'p-navy'}"><div class="bd-t">${icon('clipboard')}<b>${q.text}</b></div>
        <div class="bd-r">${bar(v / q.target, done ? 'gold' : 'cyan')}<span>${v}/${q.target}</span>
        ${cl ? `<span class="ms-done">${T('claimed')}</span>` : btn(`${done ? T('claim') : T('inProgress')} ${icon('coin')}${q.reward}`, `data-a="claimq" data-id="${q.id}" ${done ? '' : 'disabled'}`, done ? 'gold' : 'steel', 'sm')}</div></div>`;
    }).join('');
    return `<div class="mh sub">${this.head(T('board'))}<div class="p-note">${T('boardNote')}</div><div class="bd-list p-scroll">${list}</div></div>`;
  },
  book() {
    const s = Save.data;
    const ents = ENEMY_ORDER.map(id => {
      const d = ENEMY_DB[id], b = s.book[id];
      if (!b.seen) return `<div class="bk-e p-card p-steel hid"><img alt="" src="${Art.url(Art.portrait(d.short))}"><div><b>???</b><small>${T('unknownEnemy')}</small></div></div>`;
      return `<div class="bk-e p-card p-navy"><img alt="" src="${Art.url(Art.portrait(d.short))}"><div><b>${d.name}${d.role === 'Elite' ? ` <span class="bk-elite">${T('elite')}</span>` : ''}</b>
        <small>${T('role')}: ${d.role} · ${T('archetype')}: ${d.arch}</small><p>${d.desc}</p><small>${T('encounters')}: ${b.enc} · ${T('defeats')}: ${b.def}</small></div></div>`;
    }).join('');
    const chs = CHAPTERS.map((c, i) => `<div class="bk-ch"><span>${c.n}. ${esc(c.name)}</span>${stars(s.stars[i], 3, 'xs')}<small>${s.bestTime[i] ? fmtTime1(s.bestTime[i]) : '—'}</small></div>`).join('');
    return `<div class="mh sub">${this.head(T('courierBook'))}<div class="p-scroll bk">
      <div class="bk-d p-card p-navy"><b>☕ Coffee District</b><small>${T('coffeeInfo')}</small>${chs}</div>${ents}</div></div>`;
  },
  onClick(e, ctx) {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    Audio.init(); const a = b.dataset.a;
    if (a === 'view') { Audio.play('click'); ctx.view = b.dataset.v; this.render(ctx); }
    else if (a === 'close') { Audio.play('click'); ctx.view = 'main'; this.render(ctx); }
    else if (a === 'collect') {
      let n = 0, coins = 0; MILESTONES.forEach(m => { if (msState(Save.data, m) === 'ready' && Progression.claimMilestone(m.id)) { n++; coins += m.reward; } });
      if (n) { Audio.play('coin'); App.toast(T('collected', n, fmtNum(coins))); this.render(ctx); App.refreshChrome(); }
    } else if (a === 'claimm') { if (Progression.claimMilestone(b.dataset.id)) { Audio.play('coin'); this.render(ctx); App.refreshChrome(); } }
    else if (a === 'claimq') { if (Progression.claimQuest(b.dataset.id)) { Audio.play('coin'); this.render(ctx); App.refreshChrome(); } }
  },
  back(ctx) { if (ctx.view !== 'main') { ctx.view = 'main'; this.render(ctx); return true; } return false; },
  refresh(ctx) { this.render(ctx); },
  exit() {},
};
