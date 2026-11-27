// scenes/FightScene.js — gameplay scene. The simulation (DistrictRuntimeCore), renderer, HUD and input
// are the preserved Phase 01 runtime; this scene owns their lifecycle: start run on enter, overlays for
// chapter intro / skill choice / pause / confirm, safe abandon only through a confirmed quit, and the
// hand-off to RunSummary when the run ends. No hub navigation bar is shown here.
import { Save } from '../core/SaveManager.js';
import { Audio } from '../core/AudioManager.js';
import { Art } from '../core/Art.js';
import { Game } from '../core/DistrictRuntimeCore.js';
import { Input } from '../core/InputManager.js';
import { T } from '../core/i18n.js';
import { Bus, G } from '../core/state.js';
import { esc } from '../core/util.js';
import { ENEMY_DB, ENEMY_SHORT } from '../data/enemies.js';
import { SKILL_BY_ID, EVO_BY_ID, FALLBACK } from '../data/skills.js';
import { SkillMgr } from '../systems/SkillMgr.js';
import { Overlays } from '../ui/Overlays.js';
import { App } from '../ui/App.js';

function toggles() {
  const st = Save.data.settings, hasV = !!navigator.vibrate;
  return ['music', 'sfx', 'shake', 'vibe'].map(k => `<div class="set"><span>${T('s_' + k)}${k === 'vibe' && !hasV ? ` <span class="small muted">${T('s_noVibe')}</span>` : ''}</span><button class="tog ${st[k] ? 'on' : ''}" data-a="tog" data-k="${k}" aria-label="${T('s_' + k)}"></button></div>`).join('');
}

export const FightScene = {
  id: 'FightScene', hub: false, canvas: 'game', engine: 'game',
  enter(ctx, params) {
    document.getElementById('pauseBtn').classList.add('show');
    Overlays.setHandler((a, b) => this.onAction(a, b, ctx));
    ctx.offBus = [Bus.on('pick', info => this.showSkillPick(info)), Bus.on('resume', () => Overlays.close()),
      Bus.on('end', run => this.onEnd(run, ctx)), Bus.on('discover', id => App.toast(T('bookAdded', ENEMY_DB[id].name)))];
    this.startRun(params.chapter || 1, ctx);
  },
  startRun(n, ctx) {
    if (n < 1 || n > Save.data.unlocked) { App.go('RunPrep', { chapter: n }); return; }
    G.parts.length = 0; G.floats.length = 0;
    const run = Game.start(n); ctx.chapter = n; App.state.prepChapter = n;
    this.showIntro(run);
  },
  showIntro(run) {
    const ch = run.ch, intro = ch.intro.map(sh => { const d = ENEMY_DB[ENEMY_SHORT[sh]]; return `<div class="newe"><img src="${Art.url(Art.portrait(sh))}"><div class="tx"><b style="color:var(--gold)">${T('newEnemy')}${d.elite ? ' · ' + T('elite') : ''}: ${d.name}</b><br>${d.desc}</div></div>`; }).join('');
    const tips = [];
    if (ch.n === 1) tips.push(T('tut_move'), T('tut_pickup'), T('tut_time'));
    if (ch.cp) tips.push(T('tut_check'));
    if (ch.n <= 2) tips.push(T('tut_fire'));
    Overlays.open(`<div class="intro"><div class="tagline">COFFEE DISTRICT · ${T('chapter').toUpperCase()} ${ch.n}</div><div class="big" style="margin:4px 0 8px">${esc(ch.name)}</div>
      <div class="row" style="background:rgba(0,0,0,.28);border-radius:12px;padding:8px"><img src="${Art.url(Art.pkgIcon(ch.pkg, 32))}" width="32" height="32"><div><b style="color:${run.pkg.color}">${T('pkg_' + ch.pkg)}</b><div class="small" style="color:var(--cream2)">${T('pkgd_' + ch.pkg)}</div></div></div>
      <div class="kv" style="margin-top:8px"><div><span>${T('timer')}</span><b>${ch.timer} sn</b></div><div><span>${T('fastTarget')}</span><b>${ch.fast} sn</b></div>
      <div><span>${T('enemies')}</span><b>${ch.enemies}</b></div><div><span>${T('skillPicks')}</span><b>${ch.picks} + ${T('runXpShort')}</b></div></div>
      ${intro}${tips.length ? `<div class="tip">💡 ${tips.join('<br>💡 ')}</div>` : ''}
      <button class="btn mint wide" style="margin-top:12px" data-a="begin">${T('begin')} ▶</button></div>`, 'intro');
  },
  showSkillPick(info) {
    const run = G.run; if (!run || run.state !== 'pick') return;
    const kind = info.kind || run.pickKind;
    const title = kind === 'level' ? `▲ ${T('levelUpTitle', run.level)}` : `${T('chooseSkill')} <span class="muted" style="font-size:14px">${T('skillOf', run.pickIdx + 1, run.pickTotal)}</span>`;
    const cards = run.offer.map(id => {
      const k = SkillMgr.kindOf(id);
      if (k === 'evo') {
        const e = EVO_BY_ID[id];
        return `<button class="skill evo" data-a="pickskill" data-id="${id}"><span class="sk-evo">★</span><div><div class="nm">${e.name}</div>
          <span class="cat cat-evo">${T('evolution')}</span> <span class="small muted">${SKILL_BY_ID[e.a].name} + ${SKILL_BY_ID[e.b].name}</span><div class="ds">${e.desc}</div></div></button>`;
      }
      if (k === 'fallback') return `<button class="skill fb" data-a="pickskill" data-id="${id}"><span class="sk-evo">✚</span><div><div class="nm">${FALLBACK.name}</div><span class="cat cat-utility">${T('cat_utility')}</span><div class="ds">${FALLBACK.desc}</div></div></button>`;
      const s = SKILL_BY_ID[id], have = SkillMgr.count(run.skills, id);
      return `<button class="skill rar-${s.rarity}" data-a="pickskill" data-id="${id}"><img src="${Art.url(Art.skillIcon(id))}"><div><div class="nm">${s.name}</div>
        <span class="cat cat-${s.cat}">${T('cat_' + s.cat)}</span> <span class="rar rar-${s.rarity}">${T('rar_' + s.rarity)}</span>${s.max > 1 ? ` <span class="small muted">${T('stack', have + 1, s.max)}</span>` : ''}<div class="ds">${s.desc}</div></div></button>`;
    }).join('');
    const owned = run.skills.length || run.evos.length ? `<div class="small muted" style="text-align:center;margin-top:2px">${run.skills.map(id => SKILL_BY_ID[id].name).concat(run.evos.map(id => '★ ' + EVO_BY_ID[id].name)).join(' · ')}</div>` : '';
    const reroll = `<button class="btn alt wide sk-reroll" data-a="reroll" ${run.rerolls > 0 ? '' : 'disabled'}>↻ ${T('reroll')} <span class="small">(${run.rerolls})</span></button>`;
    Overlays.open(`<h2>${title}</h2><div class="sub">${kind === 'level' ? T('levelUpSub') : T('pickSub')}</div>${cards}${reroll}${owned}`, 'pick');
  },
  showPause() {
    Overlays.open(`<h2>❚❚ ${T('paused')}</h2><button class="btn mint wide" data-a="resume">▶ ${T('resume')}</button>
      <div style="margin:8px 0">${toggles()}</div>
      <div class="row"><button class="btn alt" style="flex:1" data-a="restart">↻ ${T('restart')}</button><button class="btn red" style="flex:1" data-a="quitask">✕ ${T('quitRun')}</button></div>`, 'pause');
  },
  togglePause() {
    const run = G.run; if (!run) return;
    if (Overlays.kind === 'pause') { Overlays.close(); Game.pause(false); }
    else if (!Overlays.kind && run.state === 'play' && !run.paused) { if (Game.pause(true)) this.showPause(); }
  },
  onAction(a, b, ctx) {
    switch (a) {
      case '__back': if (Overlays.kind === 'pause') { Overlays.close(); Game.pause(false); } return true; // intro / pick cannot be dismissed
      case 'begin': Overlays.close(); Game.beginPicks(); break;
      case 'pickskill': if (Overlays.kind === 'pick') { Overlays.close(); if (!Game.choose(b.dataset.id)) this.showSkillPick({}); } break;
      case 'reroll': if (Overlays.kind === 'pick') Game.reroll(); break;
      case 'resume': Overlays.close(); Game.pause(false); break;
      case 'restart': Overlays.confirm(T('restart') + '?', T('restart'), () => { const n = G.run.n; Game.quit(); this.startRun(n, ctx); }, { onCancel: () => this.showPause() }); break;
      case 'quitask': Overlays.confirm(T('quitQ'), T('quitRun'), () => { const run = G.run, n = run ? run.n : ctx.chapter; if (run) Game.quit(); G.run = null; App.go('RunPrep', { chapter: n }); }, { onCancel: () => this.showPause() }); break;
    }
    return true;
  },
  onEnd(run, ctx) { if (ctx.alive) App.go('RunSummary', { run }); },
  back() { this.togglePause(); return true; },
  exit(ctx) {
    (ctx.offBus || []).forEach(off => off());
    Overlays.close(); Overlays.setHandler(null);
    document.getElementById('pauseBtn').classList.remove('show');
    const h = document.getElementById('hint'); if (h) h.classList.remove('show');
    Input.reset();
    if (G.run && !G.run.ended) Game.quit();
    Audio.init();
  },
};
