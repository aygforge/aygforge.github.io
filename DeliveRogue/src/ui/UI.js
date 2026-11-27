// ui/UI.js — migrated verbatim from DeliveRogue.html (Phase 01 Core Migration).
import { Art } from '../core/Art.js';
import { Audio } from '../core/AudioManager.js';
import { Game } from '../core/DistrictRuntimeCore.js';
import { Main } from '../core/GameEngine.js';
import { Save } from '../core/SaveManager.js';
import { T } from '../core/i18n.js';
import { Bus, G } from '../core/state.js';
import { clamp, esc, fmtTime1 } from '../core/util.js';
import { CHAPTERS, MASTERY_REWARD, MASTERY_TEXT } from '../data/chapters.js';
import { COSMETICS } from '../data/cosmetics.js';
import { ENEMY_DB, ENEMY_ORDER, ENEMY_SHORT } from '../data/enemies.js';
import { EPISODES } from '../data/episodes.js';
import { GARAGE, GARAGE_MAX, GARAGE_ORDER, garageCost } from '../data/garage.js';
import { PACKAGES } from '../data/packages.js';
import { PLAYER_BASE } from '../data/player.js';
import { MILESTONES, QUESTS, xpToNext } from '../data/quests.js';
import { SKILL_BY_ID } from '../data/skills.js';
import { Haptic } from '../platform/Haptics.js';
import { Progression } from '../systems/Progression.js';
import { SkillMgr } from '../systems/SkillMgr.js';

/* ============================== UI ==============================
   DOM screens (menus) + modals. All buttons use data-a actions handled
   by one delegated listener; navigation is debounced against double taps.
   ================================================================ */
export const UI = (() => {
  const $ = id => document.getElementById(id);
  let scr, modal, lock = false, sel = 0, page = 0, gTab = 'eq', mTab = 'board', modalKind = null, confirmCb = null, lastResultRun = null;
  const coinFmt = n => Math.floor(n).toLocaleString('tr-TR');
  const coinPill = () => `<span class="pill"><span class="coin"></span> ${coinFmt(Save.data.coins)}</span>`;
  const starsHtml = (n, max = 3) => `<span class="stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(max - n)}</span></span>`;
  function init() {
    scr = $('screen'); modal = $('modal');
    $('ui').addEventListener('click', onClick);
    $('pauseBtn').addEventListener('click', e => { e.stopPropagation(); Audio.init(); Audio.play('click'); togglePause(); });
    Bus.on('pick', showSkillPick); Bus.on('resume', closeModal); Bus.on('end', onRunEnd);
    Bus.on('discover', id => toast('📖 ' + ENEMY_DB[id].name + ' — Teslimat Kitabı\'na eklendi'));
  }
  function toast(text) { const box = $('toasts'); while (box.children.length >= 3) box.firstChild.remove(); const t = document.createElement('div'); t.className = 'toast'; t.textContent = text; $('toasts').appendChild(t); setTimeout(() => t.remove(), 3200); }
  function navLock() { if (lock) return false; lock = true; setTimeout(() => lock = false, 280); return true; }

  /* ---------------- screens ---------------- */
  let current = 'menu';
  function go(name) {
    current = name; Main.scene = name === 'game' ? 'game' : name;
    closeModal(); $('pauseBtn').classList.toggle('show', name === 'game');
    if (name !== 'game' && name !== 'summary') { G.floats.length = 0; }
    scr.innerHTML = name === 'game' ? '' : (SCREENS[name] ? SCREENS[name]() : '');
    const sc = scr.querySelector('.scroll'); if (sc) sc.scrollTop = 0;
  }
  function refresh() { const sc = scr.querySelector('.scroll'), st = sc ? sc.scrollTop : 0; scr.innerHTML = SCREENS[current](); const s2 = scr.querySelector('.scroll'); if (s2) s2.scrollTop = st; }
  const SCREENS = {
    menu() {
      const s = Save.data, need = xpToNext(s.level), stars = Progression.totalStars(), done = s.completed.filter(Boolean).length, cl = Progression.claimableCount();
      return `<div class="scr">
        <div class="row" style="justify-content:space-between">
          <div class="profile"><div class="lvl"><small>${T('level')}</small>${s.level}</div>
            <div><div style="font-weight:900;font-size:13px">Kurye</div><div class="bar" style="width:118px;margin:3px 0"><i style="width:${Math.round(s.xp / need * 100)}%"></i></div><div class="small muted">XP ${s.xp}/${need}</div></div></div>
          ${coinPill()}
        </div>
        <div class="logo"><div class="t">Delive<b>Rogue</b></div><div class="s">${T('subtitle')}</div></div>
        <div class="card" style="margin-top:22px">
          <div class="row" style="justify-content:space-between"><b style="font-size:14px">☕ Coffee District</b>${starsHtml(1, 1)} <b>${stars}/36</b></div>
          <div class="bar" style="margin:7px 0 5px"><i style="width:${done / 12 * 100}%"></i></div>
          <div class="small muted">${T('episodeProg')}: ${done}/12 ${T('completed').toLowerCase()} · ${T('chapter')} ${Math.min(12, s.unlocked)} ${T('unlocked').toLowerCase()}</div>
        </div>
        <div class="menu-btns">
          <button class="btn" data-a="nav" data-to="prep">▶ ${T('play')}</button>
          <div class="menu-grid">
            <button class="btn alt" data-a="nav" data-to="garage">🛵<br>${T('garage')}</button>
            <button class="btn alt" data-a="nav" data-to="meta">📋<br>${T('metahub')}${cl ? ` <span class="badge">${cl}</span>` : ''}</button>
            <button class="btn alt" data-a="nav" data-to="settings">⚙️<br>${T('settings')}</button>
          </div>
          <div class="small muted" style="text-align:center">v1.0 · Aygforge Studios</div>
        </div>
      </div>`;
    },
    prep() {
      const s = Save.data; sel = clamp(sel, 0, 11);
      const cards = [0, 1, 2].map(k => {
        const i = page + k, c = CHAPTERS[i], locked = i + 1 > s.unlocked, done = s.completed[i];
        return `<button class="ch ${i === sel ? 'sel' : ''} ${locked ? 'locked' : ''}" data-a="selch" data-i="${i}">
          ${done ? '<span class="done">✓</span>' : ''}<div class="num">${locked ? '🔒' : c.n}</div><div class="nm">${esc(c.name)}</div>
          ${starsHtml(s.stars[i])}<span class="tag" style="color:${PACKAGES[c.pkg].color}">${T('pkgShort_' + c.pkg)}</span>
          <span class="small muted">👾 ${c.enemies} · ⏱ ${c.timer}s</span></button>`;
      }).join('');
      const c = CHAPTERS[sel], locked = sel + 1 > s.unlocked;
      const mast = c.mastery.map((m, k) => `<div class="${s.mastery[c.id + '_' + k] ? 'ok' : ''}">${s.mastery[c.id + '_' + k] ? '✓' : '○'} ${MASTERY_TEXT[m.k](m)} <span class="muted">(+${MASTERY_REWARD})</span></div>`).join('');
      const eps = EPISODES.map(e => {
        const sub = e.playable ? T('epPlayable') : (s.episodes.coffee ? T('epContentSoon') : T('epNeedCoffee'));
        return `<div class="ep ${e.playable ? 'on' : 'off'}">${e.playable ? '☕' : '🔒'} ${e.name}<br><span class="muted" style="font-size:9.5px">${sub}</span></div>`;
      }).join('');
      return `<div class="scr">
        <div class="topbar"><button class="btn alt icon" data-a="nav" data-to="menu">←</button><h2>${T('runprep')}</h2>${coinPill()}</div>
        <div class="eps">${eps}</div>
        <div class="chap-row"><button class="nav" data-a="page" data-d="-3" ${page <= 0 ? 'disabled' : ''}>‹</button><div class="chaps">${cards}</div><button class="nav" data-a="page" data-d="3" ${page >= 9 ? 'disabled' : ''}>›</button></div>
        <div class="dots">${[0, 3, 6, 9].map(p => `<i class="${p === page ? 'on' : ''}"></i>`).join('')}</div>
        <div class="scroll"><div class="card detail">
          <div class="row" style="justify-content:space-between"><b style="font-size:16px">${T('chapter')} ${c.n} · ${esc(c.name)}</b>${starsHtml(s.stars[sel])}</div>
          ${locked ? `<div class="tip">🔒 ${T('lockedChapter')}</div>` : ''}
          <div class="row" style="margin:7px 0"><img src="${Art.url(Art.pkgIcon(c.pkg, 28))}" width="28" height="28"><div><b style="color:${PACKAGES[c.pkg].color}">${T('pkg_' + c.pkg)}</b><div class="small" style="color:var(--cream2)">${T('pkgd_' + c.pkg)}</div></div></div>
          <div class="kv">
            <div><span>${T('timer')}</span><b>${c.timer} sn</b></div><div><span>${T('fastTarget')}</span><b>${c.fast} sn</b></div>
            <div><span>${T('enemies')}</span><b>${c.enemies}${c.n >= 7 ? ' · ' + T('elite') : ''}</b></div><div><span>${T('difficulty')}</span><b>${T('diff')[c.diff]} ${'●'.repeat(c.diff)}</b></div>
            <div><span>${T('best')}</span><b>${s.bestTime[sel] ? fmtTime1(s.bestTime[sel]) : T('none')}</b></div><div><span>Kontrol noktası</span><b>${c.cp ? T('yes') : T('no')} · ${c.picks + (c.cp ? 1 : 0)} beceri</b></div>
          </div>
          <div class="mast"><b class="small">${T('mastery')}</b>${mast}</div>
        </div></div>
        <div class="row" style="margin-top:8px"><button class="btn alt" style="flex:0 0 96px" data-a="nav" data-to="garage">🛵 ${T('garage')}</button>
          <button class="btn mint" style="flex:1" data-a="start" ${locked ? 'disabled' : ''}>🛵 ${T('startDelivery')}</button></div>
      </div>`;
    },
    garage() {
      const s = Save.data;
      const tabs = [['eq', T('equipment')], ['skin', T('looks')], ['stat', T('statsTab')], ['tro', T('trophies')]].map(([k, l]) => `<button class="tab ${gTab === k ? 'on' : ''}" data-a="gtab" data-t="${k}">${l}</button>`).join('');
      let body = '';
      if (gTab === 'eq') {
        body = GARAGE_ORDER.map(id => {
          const g = GARAGE[id], l = s.garage[id], max = l >= GARAGE_MAX, cost = max ? 0 : garageCost(id, l), can = !max && s.coins >= cost;
          return `<div class="card eq"><img src="${Art.url(Art.garageIcon(id))}"><div class="info">
            <div class="row" style="justify-content:space-between"><span class="nm">${T('eq_' + id)}</span><span class="small muted">Lv.${l}/${GARAGE_MAX}</span></div>
            <div class="small muted">${T('eqd_' + id)}</div>
            <div class="pips">${Array.from({ length: GARAGE_MAX }, (_, k) => `<i class="${k < l ? 'on' : ''}"></i>`).join('')}</div>
            <div class="bon">${T('now')}: <b>${g.fmt(g.per * l)}</b>${max ? '' : ` → ${T('next')}: <b style="color:var(--mint)">${g.fmt(g.per * (l + 1))}</b>`}</div></div>
            <button class="btn sm ${can ? '' : 'alt'}" style="flex:none;width:78px" data-a="up" data-id="${id}" ${can ? '' : 'disabled'}>${max ? T('maxed') : `${T('upgrade')}<br><span class="coin"></span> ${coinFmt(cost)}`}</button></div>`;
        }).join('');
      } else if (gTab === 'skin') {
        body = `<div class="small muted" style="margin-bottom:8px">${T('skinNote')}</div><div class="skins">` + COSMETICS.map(c => {
          const own = s.cosmetics.owned.includes(c.id), selc = s.cosmetics.selected === c.id, lvOk = s.level >= c.lvl;
          const btn = selc ? `<button class="btn sm mint wide" disabled>${T('selected')}</button>` : own ? `<button class="btn sm wide" data-a="skinsel" data-id="${c.id}">${T('select')}</button>`
            : !lvOk ? `<button class="btn sm alt wide" disabled>${T('needLevel', c.lvl)}</button>` : `<button class="btn sm wide ${s.coins >= c.price ? '' : 'alt'}" data-a="skinbuy" data-id="${c.id}" ${s.coins >= c.price ? '' : 'disabled'}><span class="coin"></span> ${c.price}</button>`;
          return `<div class="card skin ${selc ? 'sel' : ''}"><img src="${Art.url(Art.courierPortrait(c.id))}" class="${own || lvOk ? '' : 'lock'}"><div style="font-weight:800;font-size:12px;margin:4px 0">${c.name}</div>${btn}</div>`;
        }).join('') + '</div>';
      } else if (gTab === 'stat') {
        const g = s.garage, rows = [
          [T('st_level'), s.level], [T('st_deliveries'), s.stats.deliveries], [T('st_failures'), s.stats.failures], [T('st_runs'), s.stats.runs],
          [T('st_kills'), s.stats.kills], [T('st_elite'), s.stats.eliteKills], [T('st_stars'), Progression.totalStars() + '/36'],
          [T('st_chapters'), s.completed.filter(Boolean).length + '/12'], [T('st_mastery'), s.stats.mastery + '/36'],
          [T('st_speed'), GARAGE.motor.fmt(GARAGE.motor.per * g.motor)], [T('st_hp'), Math.round(PLAYER_BASE.hp * (1 + GARAGE.helmet.per * g.helmet))],
          [T('st_dr'), Math.round(GARAGE.jacket.per * g.jacket * 100) + '%'], [T('st_dmg'), (PLAYER_BASE.dmg * (1 + GARAGE.pos.per * g.pos)).toFixed(1)]];
        body = `<div class="card">${rows.map(([a, b]) => `<div class="stat"><span class="muted">${a}</span><b>${b}</b></div>`).join('')}</div>`;
      } else {
        body = MILESTONES.map(m => { const got = !!s.milestones.unlocked[m.id]; return `<div class="trophy ${got ? 'got' : ''}"><div class="ic">${got ? m.icon : '🔒'}</div><div class="tx"><b>${m.name}</b>${m.text}</div>${got ? '<span class="badge">✓</span>' : ''}</div>`; }).join('');
      }
      return `<div class="scr"><div class="topbar"><button class="btn alt icon" data-a="back">←</button><h2>${T('garage')}</h2>${coinPill()}</div>
        <div class="tabs">${tabs}</div><div class="scroll">${body}</div></div>`;
    },
    meta() {
      const s = Save.data;
      const tabs = [['board', T('board')], ['ms', T('milestones')], ['book', T('bookTab')]].map(([k, l]) => `<button class="tab ${mTab === k ? 'on' : ''}" data-a="mtab" data-t="${k}">${l}</button>`).join('');
      let body = '';
      if (mTab === 'board') {
        body = QUESTS.map(q => {
          const v = Math.min(q.target, s.stats[q.stat] || 0), done = v >= q.target, cl = !!s.quests.claimed[q.id];
          return `<div class="card quest"><div class="row"><b style="font-size:13px">${q.text}</b><span class="pill"><span class="coin"></span> ${q.reward}</span></div>
            <div class="row" style="margin-top:6px"><div class="bar" style="flex:1"><i style="width:${v / q.target * 100}%"></i></div><span class="small">${v}/${q.target}</span>
            <button class="btn sm ${done && !cl ? 'mint' : 'alt'}" data-a="claimq" data-id="${q.id}" ${done && !cl ? '' : 'disabled'}>${cl ? T('claimed') : done ? T('claim') : T('inProgress')}</button></div></div>`;
        }).join('');
      } else if (mTab === 'ms') {
        body = MILESTONES.map(m => {
          const got = !!s.milestones.unlocked[m.id], cl = !!s.milestones.claimed[m.id];
          return `<div class="trophy ${got ? 'got' : ''}"><div class="ic">${got ? m.icon : '🔒'}</div><div class="tx"><b>${m.name}</b>${m.text} · <span class="coin"></span> ${m.reward}</div>
            <button class="btn sm ${got && !cl ? 'mint' : 'alt'}" data-a="claimm" data-id="${m.id}" ${got && !cl ? '' : 'disabled'}>${cl ? T('claimed') : got ? T('claim') : '🔒'}</button></div>`;
        }).join('');
      } else {
        const ents = ENEMY_ORDER.map(id => {
          const d = ENEMY_DB[id], b = s.book[id];
          if (!b.seen) return `<div class="card ent hid"><img src="${Art.url(Art.portrait(d.short))}"><div class="tx"><b>???</b><br>${T('unknownEnemy')}<br><span class="muted">${d.role === 'Elite' ? T('elite') : 'Normal'}</span></div></div>`;
          return `<div class="card ent"><img src="${Art.url(Art.portrait(d.short))}"><div class="tx"><b>${d.name}</b> ${d.role === 'Elite' ? '<span class="badge" style="background:#ffb347">ELİT</span>' : ''}<br>
            <span class="muted">${T('role')}: ${d.role} · ${T('archetype')}: ${d.arch}</span><br>${d.desc}<br><span class="muted">${T('encounters')}: ${b.enc} · ${T('defeats')}: ${b.def}</span></div></div>`;
        }).join('');
        const chs = CHAPTERS.map((c, i) => `<div class="stat"><span>${c.n}. ${esc(c.name)}</span><span>${starsHtml(s.stars[i])} <span class="muted small">${s.bestTime[i] ? fmtTime1(s.bestTime[i]) : '—'}</span></span></div>`).join('');
        body = `<div class="card" style="margin-bottom:8px"><b>☕ Coffee District</b><div class="small" style="color:var(--cream2);margin-top:4px">${T('coffeeInfo')}</div>${chs}</div><div class="book">${ents}</div>`;
      }
      return `<div class="scr"><div class="topbar"><button class="btn alt icon" data-a="nav" data-to="menu">←</button><h2>${T('metahub')}</h2>${coinPill()}</div>
        <div class="tabs">${tabs}</div><div class="scroll">${body}</div></div>`;
    },
    settings() {
      return `<div class="scr"><div class="topbar"><button class="btn alt icon" data-a="nav" data-to="menu">←</button><h2>${T('settings')}</h2></div>
        <div class="scroll"><div class="card">${toggles(true)}</div>
        <div class="small muted" style="margin:10px 4px">${T('s_pauseInfo')}</div>
        <button class="btn red wide" style="margin-top:12px" data-a="reset">${T('s_reset')}</button>
        <div class="small muted" style="margin:14px 4px;line-height:1.4">Kontroller: Mobilde sol alttaki sabit joystick\'in topuzunu sürükle. Masaüstünde WASD / ok tuşları, ESC duraklatır.</div></div></div>`;
    },
    summary() { return ''; },
  };
  function toggles(all) {
    const st = Save.data.settings, hasV = !!navigator.vibrate;
    const list = all ? ['master', 'music', 'sfx', 'shake', 'vibe'] : ['music', 'sfx', 'shake', 'vibe'];
    return list.map(k => `<div class="set"><span>${T('s_' + k)}${k === 'vibe' && !hasV ? ` <span class="small muted">${T('s_noVibe')}</span>` : ''}</span><button class="tog ${st[k] ? 'on' : ''}" data-a="tog" data-k="${k}" aria-label="${T('s_' + k)}"></button></div>`).join('');
  }

  /* ---------------- modals ---------------- */
  function openModal(html, kind) { modal.innerHTML = `<div class="mbox">${html}</div>`; modal.classList.add('open'); modalKind = kind; }
  function closeModal() { modal.classList.remove('open'); modal.innerHTML = ''; modalKind = null; }
  function showIntro(run) {
    const ch = run.ch, intro = ch.intro.map(sh => { const d = ENEMY_DB[ENEMY_SHORT[sh]]; return `<div class="newe"><img src="${Art.url(Art.portrait(sh))}"><div class="tx"><b style="color:var(--gold)">${T('newEnemy')}${d.elite ? ' · ' + T('elite') : ''}: ${d.name}</b><br>${d.desc}</div></div>`; }).join('');
    const tips = [];
    if (ch.n === 1) tips.push(T('tut_move'), T('tut_pickup'), T('tut_time'));
    if (ch.cp) tips.push(T('tut_check'));
    openModal(`<div class="intro"><div class="tagline">COFFEE DISTRICT · ${T('chapter').toUpperCase()} ${ch.n}</div><div class="big" style="margin:4px 0 8px">${esc(ch.name)}</div>
      <div class="row" style="background:rgba(0,0,0,.28);border-radius:12px;padding:8px"><img src="${Art.url(Art.pkgIcon(ch.pkg, 32))}" width="32" height="32"><div><b style="color:${run.pkg.color}">${T('pkg_' + ch.pkg)}</b><div class="small" style="color:var(--cream2)">${T('pkgd_' + ch.pkg)}</div></div></div>
      <div class="kv" style="margin-top:8px"><div><span>${T('timer')}</span><b>${ch.timer} sn</b></div><div><span>${T('fastTarget')}</span><b>${ch.fast} sn</b></div>
      <div><span>${T('enemies')}</span><b>${ch.enemies}</b></div><div><span>Beceri seçimi</span><b>${ch.picks}${ch.cp ? ' + 1' : ''}</b></div></div>
      ${intro}${tips.length ? `<div class="tip">💡 ${tips.join('<br>💡 ')}</div>` : ''}
      <button class="btn mint wide" style="margin-top:12px" data-a="begin">${T('begin')} ▶</button></div>`, 'intro');
  }
  function showSkillPick(info) {
    const run = G.run; if (!run) return;
    const opts = SkillMgr.roll(run);
    const title = info.checkpoint ? `☕ ${T('checkpoint')}` : `${T('chooseSkill')} <span class="muted" style="font-size:14px">${T('skillOf', run.pickIdx + 1, run.pickTotal)}</span>`;
    const cards = opts.map(id => {
      const s = SKILL_BY_ID[id], have = SkillMgr.count(run.skills, id);
      return `<button class="skill" data-a="pickskill" data-id="${id}"><img src="${Art.url(Art.skillIcon(id))}"><div><div class="nm">${s.name}</div>
        <span class="cat cat-${s.cat}">${T('cat_' + s.cat)}</span>${s.max > 1 ? ` <span class="small muted">${T('stack', have + 1, s.max)}</span>` : ''}<div class="ds">${s.desc}</div></div></button>`;
    }).join('');
    const owned = run.skills.length ? `<div class="small muted" style="text-align:center;margin-top:2px">${run.skills.map(id => SKILL_BY_ID[id].name).join(' · ')}</div>` : '';
    openModal(`<h2>${title}</h2><div class="sub">${info.checkpoint ? T('checkpointSub') : 'Bu teslimat boyunca geçerli. Süre durdu.'}</div>${cards}${owned}`, 'pick');
  }
  function showPause() {
    openModal(`<h2>❚❚ ${T('paused')}</h2><button class="btn mint wide" data-a="resume">▶ ${T('resume')}</button>
      <div style="margin:8px 0">${toggles(false)}</div>
      <div class="row"><button class="btn alt" style="flex:1" data-a="restart">↻ ${T('restart')}</button><button class="btn red" style="flex:1" data-a="quitask">✕ ${T('quitRun')}</button></div>`, 'pause');
  }
  function confirm(text, yes, cb, back) {
    confirmCb = cb;
    openModal(`<h2 style="font-size:17px">${text}</h2><div class="row" style="margin-top:10px"><button class="btn alt" style="flex:1" data-a="cancel" data-back="${back || ''}">${T('s_cancel')}</button><button class="btn red" style="flex:1" data-a="confirm">${yes}</button></div>`, 'confirm');
  }
  function togglePause() {
    const run = G.run; if (!run || current !== 'game') return;
    if (modalKind === 'pause') { closeModal(); Game.pause(false); }
    else if (!modalKind && run.state === 'play' && !run.paused) { if (Game.pause(true)) showPause(); }
  }

  /* ---------------- run lifecycle ---------------- */
  function startChapter(n) {
    if (n < 1 || n > Save.data.unlocked) return;
    G.parts.length = 0; G.floats.length = 0;
    const run = Game.start(n); sel = n - 1; go('game'); showIntro(run);
  }
  function onRunEnd(run) {
    lastResultRun = run;
    const res = run.settled;
    if (res && res.epComplete) {
      scr.innerHTML = `<div class="epdone"><div class="a">EPISODE 1</div><div class="b">${T('epComplete')}<br>${T('epComplete2')}</div><div class="small" style="max-width:260px;color:var(--cream2);margin-bottom:16px">${T('epComplete3')}</div><button class="btn" data-a="sumshow">${T('cont')} ▶</button></div>`;
      current = 'summary'; $('pauseBtn').classList.remove('show'); Audio.play('win');
      return;
    }
    showSummary(run);
  }
  function showSummary(run) {
    current = 'summary'; Main.scene = 'summary'; $('pauseBtn').classList.remove('show'); closeModal();
    const r = run.settled || {}, st = run.stats, ch = run.ch, s = Save.data, need = xpToNext(s.level);
    let html;
    if (run.success) {
      const stars = [1, 2, 3].map((k, i) => `<span class="${k <= r.stars ? 'on' : ''}" style="animation-delay:${0.15 + i * 0.22}s">★</span>`).join('');
      const extras = [r.first ? `<span class="badge">${T('firstBonus')} +${r.firstBonus}</span>` : '', r.perfBonus ? `<span class="badge">★ +${r.perfBonus}</span>` : '', r.killBonus ? `<span class="badge">👾 +${r.killBonus}</span>` : '',
        r.unlockedNext ? `<span class="badge" style="background:var(--gold)">${T('nextUnlocked')}</span>` : '', r.newBest ? `<span class="badge" style="background:#9fd8ff">${T('newBest')}</span>` : ''].join('');
      const mast = r.mastery.length ? `<div class="tip">🏅 ${r.mastery.map(m => T('masteryDone', m, MASTERY_REWARD)).join('<br>🏅 ')}</div>` : '';
      html = `<div class="sum-h win">${T('deliveryComplete')}</div><div style="text-align:center;font-weight:800;color:var(--cream2)">${T('chapter')} ${ch.n} · ${esc(ch.name)}</div>
        <div class="bigstars">${stars}</div>
        <div class="kv"><div><span>${T('grade')}</span><b><span class="grade">${r.grade}</span></b></div><div><span>${T('time')}</span><b>${fmtTime1(st.time)} <span class="muted small">/ 3★ ${ch.fast}s</span></b></div>
          <div><span>${T('remHp')}</span><b>${Math.ceil(st.hp)}/${st.maxHp}</b></div><div><span>${T('remPkg')}</span><b>${Math.ceil(st.pkgHp)}/${st.pkgMax} (${Math.round(st.pkgPct * 100)}%)</b></div>
          <div><span>${T('kills')}</span><b>${st.kills}${st.eliteKills ? ` (${st.eliteKills} ${T('elite')})` : ''}</b></div><div><span>${T('level')}</span><b>${s.level} · ${s.xp}/${need} XP</b></div></div>
        <div class="rew"><div><span>${T('coins')}</span><span class="coin"></span> +${r.coins}</div><div><span>${T('xp')}</span>+${r.xp}</div></div>
        <div style="text-align:center">${extras}</div>${mast}
        <div class="sum-btns">${ch.n < 12 && s.unlocked >= ch.n + 1 ? `<button class="btn mint full" data-a="next">${T('nextChapter')} ▶</button>` : ''}
          <button class="btn" data-a="replay">↻ ${T('replay')}</button><button class="btn alt" data-a="nav" data-to="prep">${T('toPrep')}</button>
          <button class="btn alt" data-a="nav" data-to="garage">🛵 ${T('garage')}</button><button class="btn alt" data-a="nav" data-to="menu">${T('toMenu')}</button></div>`;
    } else {
      html = `<div class="sum-h lose">${T('deliveryFailed')}</div><div style="text-align:center;font-weight:800;color:var(--cream2)">${T('chapter')} ${ch.n} · ${esc(ch.name)}</div>
        <div class="tip" style="text-align:center;font-size:14px;font-weight:800">${T('fail_' + run.reason)}</div>
        <div class="kv" style="margin-top:8px"><div><span>${T('grade')}</span><b><span class="grade F">F</span></b></div><div><span>${T('progressReached')}</span><b>%${Math.round((st.progress || 0) * 100)}</b></div>
          <div><span>${T('kills')}</span><b>${st.kills}</b></div><div><span>${T('time')}</span><b>${fmtTime1(st.time)}</b></div></div>
        <div class="bar" style="margin:10px 0"><i style="width:${Math.round((st.progress || 0) * 100)}%"></i></div>
        ${r.coins || r.xp ? `<div class="rew"><div><span>${T('consolation')}</span><span class="coin"></span> +${r.coins}</div><div><span>${T('xp')}</span>+${r.xp}</div></div>` : `<div class="small muted" style="text-align:center">${T('noReward')}</div>`}
        <div class="sum-btns"><button class="btn mint full" data-a="replay">↻ ${T('retry')}</button><button class="btn alt" data-a="nav" data-to="prep">${T('toPrep')}</button><button class="btn alt" data-a="nav" data-to="menu">${T('toMenu')}</button></div>`;
    }
    scr.innerHTML = `<div class="scr" style="background:rgba(16,10,7,.93)"><div class="scroll">${html}</div></div>`;
    if (run.success) setTimeout(() => Audio.play('coin'), 500);
    const later = []; if (r.levelUps) later.push(T('levelUp', s.level)); (r.milestones || []).forEach(m => later.push('🏆 ' + T('milestoneGot', m))); (r.quests || []).forEach(q => later.push('📋 ' + T('questReady', q)));
    later.forEach((m, i) => setTimeout(() => toast(m), 700 + i * 900));
  }

  /* ---------------- actions ---------------- */
  function onClick(e) {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    Audio.init();
    const a = b.dataset.a, s = Save.data;
    const NAV = ['nav', 'start', 'next', 'replay', 'back', 'begin', 'restart', 'confirm', 'sumshow', 'pickskill'];
    if (NAV.includes(a) && !navLock()) return;
    Audio.play('click');
    switch (a) {
      case 'nav': { const to = b.dataset.to; if (G.run && G.run.ended) { G.run = null; } if (to === 'prep' && current !== 'prep') { sel = current === 'menu' ? Math.min(11, s.unlocked - 1) : clamp(sel, 0, Math.min(11, s.unlocked - 1)); page = Math.min(9, Math.floor(sel / 3) * 3); } if (to === 'garage') garageBack = current; go(to); break; }
      case 'back': go(garageBack === 'summary' ? 'prep' : (garageBack && garageBack !== 'garage' ? garageBack : 'menu')); break;
      case 'page': page = clamp(page + (+b.dataset.d), 0, 9); refresh(); break;
      case 'selch': sel = +b.dataset.i; if (sel + 1 > s.unlocked) Audio.play('error'); refresh(); break;
      case 'start': startChapter(sel + 1); break;
      case 'next': startChapter(lastResultRun.n + 1); break;
      case 'replay': startChapter(lastResultRun.n); break;
      case 'begin': closeModal(); Game.beginPicks(); break;
      case 'pickskill': if (modalKind === 'pick') { closeModal(); Game.choose(b.dataset.id); } break;
      case 'resume': closeModal(); Game.pause(false); break;
      case 'restart': confirm(T('restart') + '?', T('restart'), () => { const n = G.run.n; Game.quit(); startChapter(n); }, 'pause'); break;
      case 'quitask': confirm(T('quitQ'), T('quitRun'), () => { const run = G.run; if (run) { Game.quit(); } G.run = null; sel = run ? run.n - 1 : sel; page = Math.min(9, Math.floor(sel / 3) * 3); go('prep'); }, 'pause'); break;
      case 'confirm': { const cb = confirmCb; confirmCb = null; closeModal(); if (cb) cb(); break; }
      case 'cancel': confirmCb = null; if (b.dataset.back === 'pause') showPause(); else closeModal(); break;
      case 'tog': { const k = b.dataset.k; s.settings[k] = !s.settings[k]; Save.write(); Audio.apply(); if (k === 'vibe' && s.settings.vibe) Haptic.buzz(30); b.classList.toggle('on', s.settings[k]); break; }
      case 'reset': confirm(T('s_resetQ'), T('s_resetYes'), () => { Save.reset(); Audio.apply(); sel = 0; page = 0; toast(T('s_resetDone')); go('menu'); }); break;
      case 'gtab': gTab = b.dataset.t; refresh(); break;
      case 'mtab': mTab = b.dataset.t; refresh(); break;
      case 'up': if (Progression.buyUpgrade(b.dataset.id)) { Audio.play('buy'); refresh(); } else Audio.play('error'); break;
      case 'skinbuy': if (Progression.buySkin(b.dataset.id)) { Audio.play('buy'); refresh(); } else Audio.play('error'); break;
      case 'skinsel': s.cosmetics.selected = b.dataset.id; Save.write(); refresh(); break;
      case 'claimq': if (Progression.claimQuest(b.dataset.id)) { Audio.play('coin'); refresh(); } break;
      case 'claimm': if (Progression.claimMilestone(b.dataset.id)) { Audio.play('coin'); refresh(); } break;
      case 'sumshow': showSummary(lastResultRun); break;
    }
  }
  let garageBack = 'menu';
  return { init, go, toast, togglePause, showPause, closeModal, get modalKind() { return modalKind; }, get current() { return current; } };
})();
