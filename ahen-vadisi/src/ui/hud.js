// Oyun HUD'ı: sol üst HP/MP/EXP, üst orta hedef/boss çubuğu, sağ üst mini harita + menü,
// sol alt joystick, sağ alt beceri/saldırı/iksir/hedef değiştir, görev ve dungeon takipçisi.
import { h, clear, img, fmt } from './dom.js';
import { ui } from './ui.js';
import { app } from '../core/app.js';
import { NPCS } from '../data/npcs.js';
import { bus } from '../core/events.js';
import { iconURL } from '../art/icons.js';
import { createJoystick } from './joystick.js';
import { humanSheet, playerLook } from '../art/characters.js';
import { packPreviewCanvas } from '../art/spriteRuntime.js';
import { SKILLS, CLASS_SKILLS } from '../data/skills.js';
import { POTION_LIST } from '../data/materials.js';
import { QUEST_MAP } from '../data/quests.js';
import { MAPS } from '../data/maps/index.js';
import { xpToNext, MAX_LEVEL, TILE, SLOTS, DURABILITY_WARN } from '../data/constants.js';
import { countStack } from '../systems/inventory.js';
import { trackedQuestList, npcQuestMark } from '../systems/quests.js';
import { currentStage, getRun, bossStage } from '../systems/dungeon.js';
import { FOG_CELL } from '../world/fog.js';
import { sound } from '../audio/sound.js';
import { openPanel } from './panels/index.js';
import { online } from '../online/index.js';
import { openPlayers } from './panels/online.js';
import { openParty, openChat } from './panels/party.js';
import { partyGame, mapName } from '../online/partyGame.js';
import { net } from '../online/gameServer.js';

export function createHud() {
  const el = h('div', { id: 'hud' });
  // ---------------- sol üst
  const portrait = h('div', { class: 'pt' });
  const lvl = h('b', {}, '1');
  portrait.appendChild(lvl);
  const hpBar = h('div', { class: 'bar hp' }, h('i'), h('span'));
  const mpBar = h('div', { class: 'bar mp' }, h('i'), h('span'));
  const xpBar = h('div', { class: 'bar xp' }, h('i'));
  const buffs = h('div', { class: 'buffs' });
  // V4 Ölü Çağıran: iskelet yardımcı HP ve geçici iskeletin kalan süresi (ayrı yönetim paneli yok)
  const minionsEl = h('div', { class: 'minions hidden', 'data-testid': 'minion-hud' });
  const tracker = h('div', { class: 'tracker ia', onTap: () => openPanel('quests') });
  const dungeonBar = h('div', { class: 'dungeonbar hidden' });
  // parti arkadaşları (Faz 1): ad, seviye, can, başka bölgedeyse bölge adı; dokununca parti penceresi
  const partyEl = h('div', { class: 'partyf ia hidden', 'data-testid': 'hud-party-frame', onTap: () => openParty() });
  const tl = h('div', { class: 'hud-tl' }, h('div', { class: 'vit' }, portrait, h('div', { class: 'bars' }, hpBar, mpBar, xpBar)), partyEl, minionsEl, buffs, dungeonBar, tracker);

  // ---------------- üst orta
  const tName = h('span'), tLv = h('span', { class: 'muted' });
  const tBar = h('div', { class: 'bar' }, h('i'), h('span'));
  const target = h('div', { class: 'target hidden', onTap: () => { app.world?.player.clearTarget(); } }, h('div', { class: 'tn' }, tName, tLv), tBar);
  const bName = h('div', { class: 'tn' });
  const bTicks = h('div', { class: 'ticks' });
  const bShield = h('div', { class: 'shield hidden' });
  const bBarFill = h('i');
  const bBarText = h('span');
  const bPh = h('div', { class: 'ph' });
  const boss = h('div', { class: 'target boss bossbar hidden' }, bName, h('div', { class: 'bar', style: { position: 'relative' } }, bBarFill, bShield, bTicks, bBarText), bPh);
  const toasts = h('div', { class: 'toasts' });
  const tc = h('div', { class: 'hud-tc' }, boss, target, toasts);

  // ---------------- sağ üst
  const mmCanvas = h('canvas', { width: 128, height: 128 });
  const mmName = h('div', { class: 'mn' });
  const mm = h('div', { class: 'mm', onTap: () => openPanel('map') }, mmCanvas, mmName);
  const bagBadge = h('span', { class: 'badge p hidden' });
  const charBadge = h('span', { class: 'badge hidden' }, '!');
  const skillBadge = h('span', { class: 'badge hidden' });
  const ib = (icon, name, badge, cls = '') => h('button', { class: 'ibtn ' + cls, style: { backgroundImage: `url(${iconURL('ui:' + icon)})` }, 'data-testid': 'btn-' + name, onTap: () => { sound.play('click'); openPanel(name); } }, badge);
  const menuBtns = h('div', { class: 'menubtns' },
    ib('bag', 'inventory', bagBadge),
    ib('char', 'character', charBadge, 'opt'),
    ib('skills', 'skills', skillBadge, 'opt'),
    ib('quests', 'quests', null, 'opt'),
    ib('settings', 'settings', null, 'opt'),
    h('button', { class: 'ibtn more', style: { backgroundImage: `url(${iconURL('ui:menu')})` }, 'data-testid': 'btn-more', onTap: () => { sound.play('click'); openPanel('character'); } }, h('span', { class: 'badge hidden' })));
  // çevrimiçi oyuncu sayısı (sunucu ayarlıysa); dokununca kim, hangi karakterle, nerede
  const onl = h('button', { class: 'onl hidden', 'data-testid': 'hud-online', onTap: () => { sound.play('click'); openPlayers(); } });
  const updateOnline = () => {
    // ortak dünya sunucusu: bağlıysa sunucudaki oyuncu sayısı; bağlanamıyorsa durum
    if (net.configured && online.loggedIn) {
      onl.classList.remove('hidden');
      onl.dataset.net = net.status;
      onl.textContent = net.ready ? `● ${net.count} çevrimiçi · sunucu` : net.status === 'error' ? '○ sunucu: hata' : '○ sunucuya bağlanıyor…';
      onl.title = net.err || '';
      return;
    }
    const n = online.players?.length;
    onl.classList.toggle('hidden', !online.configured || n == null);
    onl.textContent = `● ${n ?? 0} çevrimiçi`;
  };
  const partyBadge = h('span', { class: 'badge hidden' }, '!');
  const partyBtn = h('button', { class: 'onl pbtn hidden', 'data-testid': 'hud-party', onTap: () => { sound.play('click'); openParty(); } }, 'Parti', partyBadge);
  const chatBtn = h('button', { class: 'onl pbtn hidden', 'data-testid': 'hud-chat', onTap: () => { sound.play('click'); openChat(); } }, 'Sohbet');
  const updateParty = () => {
    const pg = partyGame, p = pg.party;
    partyBtn.classList.toggle('hidden', !online.loggedIn);
    partyBadge.classList.toggle('hidden', !pg.invites.length);
    chatBtn.classList.toggle('hidden', !p?.inParty);
    const others = p?.inParty ? p.others() : [];
    const k = others.map((m) => `${m.uid}:${m.nick}:${m.leader}:${m.fresh}:${m.st?.lv}:${m.st?.m}:${Math.round((m.st?.hp ?? 100) / 5)}:${m.st?.d}`).join('|') + (p?.status || '') + (app.world?.mapId || '');
    if (partyEl.dataset.k === k) return;
    partyEl.dataset.k = k;
    clear(partyEl);
    partyEl.classList.toggle('hidden', !p?.inParty);
    if (!p?.inParty) return;
    if (!others.length) partyEl.append(h('div', { class: 'tiny muted' }, p.status === 'in' ? `Parti ${p.code} · arkadaş bekleniyor` : 'Parti: bağlanıyor…'));
    for (const m of others) {
      const st = m.st, away = st && st.m !== app.world?.mapId;
      partyEl.append(h('div', { class: 'pm' + (m.fresh ? '' : ' stale') },
        h('div', { class: 'pn' }, m.leader ? '★' : '', h('b', {}, m.nick), st ? ` Lv.${st.lv}` : '', away ? h('span', { class: 'tiny muted' }, ' · ' + mapName(st.m)) : null),
        h('div', { class: 'mbar' }, h('i', { style: { width: `${st ? (st.d ? 0 : st.hp) : 0}%` } }))));
    }
  };
  const tr = h('div', { class: 'hud-tr' }, menuBtns, h('div', { class: 'mmcol' }, mm, onl, h('div', { class: 'row', style: { gap: '3px' } }, partyBtn, chatBtn)));
  // parti sohbeti: alt ortada son mesajlar (birkaç saniye sonra solar)
  const chatLog = h('div', { class: 'chatlog', 'data-testid': 'hud-chat-log' });
  const pushChat = (e) => {
    const line = h('div', {}, h('b', { style: { color: e.self ? '#ffd86a' : '#9df0b0' } }, e.nick + ': '), e.text);
    chatLog.appendChild(line);
    while (chatLog.children.length > 4) chatLog.firstChild.remove();
    setTimeout(() => line.classList.add('fade'), 9000);
    setTimeout(() => line.remove(), 10000);
  };

  // ---------------- sol alt
  // sol alt köşe: joystick + çevresindeki geniş dokunma bölgesi
  const bl = h('div', { class: 'hud-bl', 'data-testid': 'joy-zone' });
  const joystick = createJoystick(app.settings.joystickSize === 'big', bl);
  bl.appendChild(joystick);
  const feed = h('div', { class: 'feed' });

  // ---------------- sağ alt aksiyonlar
  const br = h('div', { class: 'hud-br' });
  // büyük kılıç: aktif saldırı — her basış en yakın düşmana bir vuruş, basılı tutmak vurmayı sürdürür
  const release = () => { const p = app.world?.player; if (p) p.attackHeld = false; atk.classList.remove('press'); };
  const atkIcon = { archer: 'ui:bow', necromancer: 'ui:soul', mage: 'ui:sword' }[app.char?.cls] || 'ui:sword';
  const atk = h('button', { class: 'act atk', style: { backgroundImage: `url(${iconURL(atkIcon)})` }, 'data-testid': 'btn-attack',
    onPointerdown: (e) => {
      e.preventDefault(); sound.init();
      const w = app.world;
      if (!w?.player) return;
      atk.classList.add('press');
      if (w.attackNearest()) w.player.attackHeld = true;
    },
    onPointerup: release, onPointercancel: release, onPointerleave: release });
  // küçük kırmızı buton: otomatik normal saldırı aç/kapa
  const toggleAuto = () => {
    sound.play('click');
    const w = app.world;
    if (!w) return;
    w.autoAttack = !w.autoAttack;
    app.setSettings({ autoAttack: w.autoAttack });
    bus.emit('toast', { text: w.autoAttack ? 'Otomatik saldırı: AÇIK' : 'Otomatik saldırı: KAPALI — kılıca basarak saldır', kind: 'info', short: true });
    refreshAtk();
  };
  const refreshAtk = () => tgt.classList.toggle('on', !!(app.world?.autoAttack ?? true));
  const skillBtns = [0, 1, 2, 3].map((i) => {
    const cd = h('div', { class: 'cd' }), cdt = h('div', { class: 'cdt' }), lv = h('div', { class: 'lv' });
    const b = h('button', { class: 'act sk', 'data-testid': 'skill-' + i, onPointerdown: (e) => { e.preventDefault(); sound.init(); app.world?.player.useSkill(i); } }, cd, cdt, lv);
    b._cd = cd; b._cdt = cdt; b._lv = lv;
    return b;
  });
  const potBtn = (kind) => {
    const cnt = h('span', { class: 'cnt' }), cd = h('div', { class: 'cd' });
    const b = h('button', { class: 'act pot', 'data-testid': 'pot-' + kind, onPointerdown: (e) => { e.preventDefault(); app.world?.player.usePotion(kind); } }, cd, cnt);
    b._cnt = cnt; b._cd = cd; b._kind = kind;
    return b;
  };
  const hpPot = potBtn('hp'), mpPot = potBtn('mp');
  const tgt = h('button', { class: 'act tgt', style: { backgroundImage: `url(${iconURL('ui:target')})` }, 'data-testid': 'btn-auto', 'aria-label': 'Otomatik saldırı', onTap: toggleAuto }, h('span', { class: 'lbl' }, 'OTO'));
  br.append(atk, ...skillBtns, hpPot, mpPot, tgt);

  const layoutActions = () => {
    const H = window.innerHeight;
    const u = Math.max(0.85, Math.min(1.15, H / 400));
    const A = Math.round(Math.max(80, 98 * u)), S = Math.round(Math.max(48, 56 * u)), P = Math.round(Math.max(46, 50 * u));
    const set = (b, size, ang, r) => {
      const rad = ang * Math.PI / 180;
      const right = A / 2 - r * Math.cos(rad) - size / 2;
      const bottom = A / 2 + r * Math.sin(rad) - size / 2;
      Object.assign(b.style, { width: size + 'px', height: size + 'px', right: Math.round(right) + 'px', bottom: Math.round(bottom) + 'px' });
    };
    Object.assign(atk.style, { width: A + 'px', height: A + 'px', right: '0px', bottom: '0px' });
    // komşu butonlar arası kiriş ≥ boyut + 4 px (çakışma yok)
    const R1 = Math.max((S + 4) / (2 * Math.sin((33.3 / 2) * Math.PI / 180)), A / 2 + S / 2 + 8);
    [85, 118.3, 151.7, 185].forEach((a, i) => set(skillBtns[i], S, a, R1));
    const R2 = R1 + S / 2 + P / 2 + 6;
    set(hpPot, P, 100, R2); set(mpPot, P, 130, R2); set(tgt, P, 160, R2);
    br.style.width = Math.round(A / 2 + R2 + P / 2 + 4) + 'px';
    br.style.height = Math.round(A / 2 + R2 + P / 2 + 4) + 'px';
  };
  layoutActions();
  window.addEventListener('resize', layoutActions);

  const channel = h('div', { class: 'channel hidden' }, h('div', { class: 'small', style: { textAlign: 'center', textShadow: '0 1px 2px #000' } }), h('div', { class: 'bar' }, h('i')));
  const fps = h('div', { class: 'fps hidden' });
  el.append(tl, tc, tr, bl, feed, br, channel, fps, chatLog);

  // ---------------------------------------------------------------- güncellemeler
  let tAcc = 0, mmAcc = 0;
  const setBar = (bar, v, max, text = true) => {
    bar.firstChild.style.width = `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
    if (text && bar.children[1]) bar.children[1].textContent = `${fmt(Math.max(0, v))} / ${fmt(max)}`;
  };

  function updateVitals() {
    const ch = app.char, st = app.stats(), w = app.world;
    if (!ch || !st || !w) return;
    setBar(hpBar, ch.hp, st.maxHp);
    setBar(mpBar, ch.mp, st.maxMp);
    if (ch.level >= MAX_LEVEL) xpBar.firstChild.style.width = '100%';
    else xpBar.firstChild.style.width = `${(ch.exp / xpToNext(ch.level)) * 100}%`;
    lvl.textContent = ch.level;
    const lk = Object.values(ch.equipment).map((e) => e?.tid).join() + (app.settings.heroLook || '');
    if (portrait.dataset.k !== lk) {
      portrait.dataset.k = lk;
      const pc = packPreviewCanvas('hero_' + ch.cls, 80, true);
      portrait.style.backgroundImage = `url(${(pc || humanSheet(playerLook(ch.cls, ch.equipment))[0].toCanvas(2)).toDataURL()})`;
      portrait.classList.toggle('pk', !!pc);
    }
    // hedef
    const t = w.player.target;
    if (t && !t.dead && t.tpl.kind !== 'boss') {
      target.classList.remove('hidden');
      target.className = 'target ia' + (t.tpl.kind === 'elite' ? ' elite' : '');
      tName.textContent = t.tpl.name; tName.style.color = t.tpl.kind === 'elite' ? '#e0b0ff' : '#ffd8c8';
      tLv.textContent = `Lv.${t.level}`;
      setBar(tBar, t.hp, t.maxHp);
    } else target.classList.add('hidden');
    // boss
    const p = w.player;
    const bossE = w.enemies.find((e) => !e.dead && e.tpl.kind === 'boss' && (e.engaged || p.target === e) && Math.hypot(e.x - p.x, e.y - p.y) < 18 * TILE);
    if (bossE) {
      boss.classList.remove('hidden');
      const scale = bossE.maxHp / bossE.tpl.hp;
      bName.textContent = `${bossE.tpl.name} — Lv.${bossE.level}` + (scale > 1.01 ? ` · Parti ×${scale.toFixed(2).replace('.', ',')}` : '');
      bBarFill.style.width = `${(bossE.hp / bossE.maxHp) * 100}%`;
      bBarText.textContent = `${fmt(bossE.hp)} / ${fmt(bossE.maxHp)}`;
      bShield.classList.toggle('hidden', !(bossE.reduce > 0));
      const ticks = { mine_golem: [70, 50, 25], ash_giant: [55, 30, 20], frozen_guardian: [65, 30], lost_king: [65, 30], storm_tyrant: [60, 25], sky_prisoner: [65, 30] }[bossE.tpl.id] || [70, 40, 25];
      if (bTicks.dataset.k !== bossE.tpl.id) { clear(bTicks); ticks.forEach((tk) => bTicks.appendChild(h('b', { style: { left: tk + '%' } }))); bTicks.dataset.k = bossE.tpl.id; }
      const ph = bossE.behavior?.phase?.() || 1;
      const shieldTxt = { frozen_guardian: 'Buz Mührü aktif — iki kristali kır!', lost_king: 'Kırık Taç — iki kadim mührü kır!', storm_tyrant: 'Enerji Kristalleri — kristalleri kır, savunması düşsün!', sky_prisoner: 'Kırılan Mühürler — iki gök mührünü kır!' }[bossE.tpl.id] || 'Kristal Kalkanı aktif — kristalleri kır!';
      const furyTxt = { ash_giant: 'Aşama: Son Kor', frozen_guardian: 'Aşama III: Kışın Öfkesi', lost_king: 'Aşama III: Son Hüküm', storm_tyrant: 'Aşama: Son Gök Gürültüsü', sky_prisoner: 'Aşama III: Yıldızların Sonu' }[bossE.tpl.id] || 'Aşama: Son Öfke';
      bPh.textContent = bossE.reduce > 0 ? shieldTxt : ph >= 3 || (bossE.tpl.id === 'alpha_wolf' && ph === 2) ? furyTxt : `Aşama ${ph}`;
    } else boss.classList.add('hidden');
    // V4 iskeletler
    const mins = ch.cls === 'necromancer' && w.minions ? w.minions.alive : [];
    minionsEl.classList.toggle('hidden', !mins.length);
    if (mins.length) {
      const k = mins.map((m) => `${Math.round(m.hp / m.maxHp * 20)}:${m.temp ? Math.ceil((m.temp - w.clock) / 1000) : ''}`).join('|');
      if (minionsEl.dataset.k !== k) {
        minionsEl.dataset.k = k;
        clear(minionsEl);
        for (const m of mins) {
          minionsEl.appendChild(h('div', { class: 'mn' + (m.temp ? ' tmp' : '') },
            h('span', { class: 'tiny' }, m.temp ? `İskelet (${Math.max(0, Math.ceil((m.temp - w.clock) / 1000))} sn)` : 'İskelet'),
            h('div', { class: 'mbar' }, h('i', { style: { width: `${Math.max(0, m.hp / m.maxHp) * 100}%` } }))));
        }
      }
    } else minionsEl.dataset.k = '';
    // buff
    clear(buffs);
    const now = w.clock;
    const addBf = (icon, sec, tint) => buffs.appendChild(h('div', { class: 'bf', style: { backgroundImage: `url(${iconURL(icon)})`, borderColor: tint || '#000' } }, h('em', {}, sec > 0 ? Math.ceil(sec) : '')));
    for (const [k, b] of Object.entries(p.buffs)) {
      const icon = { ironSkin: 'skill:iron_skin', manaShield: 'skill:mana_shield', will: 'skill:unyielding_will', resonance: 'skill:arcane_resonance',
        fury: 'skill:iron_fury', agile: 'skill:agile_step', windRhythm: 'skill:wind_rhythm', boneArmor: 'skill:bone_armor', curse: 'skill:curse_seal' }[k];
      if (icon) addBf(icon, (b.until - now) / 1000);
    }
    if (p.poison) addBf('toxic_crystal', p.poison.left, '#5f5');
    if (now < p.slowUntil) addBf('skill:ice_blast', (p.slowUntil - now) / 1000, '#58f');
    if (now < p.stunUntil) addBf('ui:target', (p.stunUntil - now) / 1000, '#fd0');
    // beceri butonları
    const acts = ch.skillBar || CLASS_SKILLS[ch.cls].actives;
    skillBtns.forEach((b, i) => {
      const id = acts[i], s = SKILLS[id], r = ch.skills[id] || 0;
      if (b.dataset.id !== id) { b.dataset.id = id; b.style.backgroundImage = `url(${iconURL('skill:' + id)})`; }
      b.classList.toggle('lock', !r);
      b._lv.textContent = r ? '' : `Lv.${s.unlock}`;
      const cd = p.cooldowns[id] || 0;
      const total = r ? s.cd[r - 1] : 1;
      b._cd.style.setProperty('--p', `${(cd / total) * 100}%`);
      b._cdt.textContent = cd > 0 ? (cd >= 1 ? Math.ceil(cd) : cd.toFixed(1)) : '';
      b.classList.toggle('nomp', !!r && ch.mp < p.skillCost(id));
    });
    for (const b of [hpPot, mpPot]) {
      const best = p.bestPotion(b._kind);
      const total = POTION_LIST.filter((x) => x.kind === b._kind).reduce((a, x) => a + countStack(ch.bag, x.id), 0);
      const icon = best ? best.id : b._kind === 'hp' ? 'hp_s' : 'mp_s';
      if (b.dataset.icon !== icon) { b.dataset.icon = icon; b.style.backgroundImage = `url(${iconURL(icon)})`; }
      b._cnt.textContent = total;
      b.style.opacity = total ? 1 : 0.5;
      b._cd.style.setProperty('--p', `${(p.potionCd[b._kind] / 10) * 100}%`);
    }
    // rozetler
    bagBadge.classList.toggle('hidden', !ch.pending.length);
    bagBadge.textContent = ch.pending.length;
    const lowDur = SLOTS.some((s) => ch.equipment[s] && ch.equipment[s].d < DURABILITY_WARN);
    const statPts = 3 * (ch.level - 1) - Object.values(ch.alloc).reduce((a, b) => a + b, 0);
    charBadge.classList.toggle('hidden', !(lowDur || statPts > 0));
    charBadge.textContent = lowDur ? '⚒' : statPts;
    const more = menuBtns.querySelector('.more .badge');
    more.classList.toggle('hidden', !(lowDur || statPts > 0 || ch.pending.length));
    more.textContent = '!';
    // fps
    const showFps = app.settings.showFps || app.dev;
    fps.classList.toggle('hidden', !showFps);
    if (showFps) fps.textContent = `${Math.round(app.game.loop.actualFps)} FPS · ${w.enemies.filter((e) => !e.dead).length} yaratık`;
    refreshAtk();
  }

  function updateTracker() {
    const ch = app.char;
    if (!ch) return;
    clear(tracker);
    // V3: en çok 3 takip edilen görev (takip yoksa aktif ana görev). İlk görev tüm hedefleri, diğerleri sıradaki hedefi gösterir.
    const list = trackedQuestList(ch);
    let shown = list.filter((x) => x.tracked).slice(0, 3);
    if (!shown.length) shown = [list.find((x) => x.q.main) || list[0]].filter(Boolean);
    if (shown.length) {
      shown.forEach((q, k) => {
        tracker.appendChild(h('div', { class: 'qn' }, (q.q.main ? '◆ ' : '◇ ') + q.q.name));
        if (q.ready) { tracker.appendChild(h('div', { class: 'done' }, `✔ Teslim et: ${npcName(q.q.turnIn)}`)); return; }
        const objs = q.objectives.filter((o) => o.type !== 'talk');
        const list2 = k === 0 && shown.length === 1 ? objs : objs.filter((o) => o.p < o.n).slice(0, 1);
        for (const o of list2) tracker.appendChild(h('div', { class: o.p >= o.n ? 'done' : '' }, `${o.label} ${Math.min(o.p, o.n)}/${o.n}`));
      });
    } else {
      const next = nextMainHint(ch);
      if (next) tracker.appendChild(h('div', { class: 'qn' }, next));
    }
    if (ch.contract) tracker.appendChild(h('div', { class: ch.contract.p >= ch.contract.n ? 'done' : 'muted' }, `Sözleşme: ${ch.contract.p}/${ch.contract.n}`));
    tracker.classList.toggle('hidden', !tracker.firstChild);
    // dungeon
    const w = app.world;
    if (w?.mapDef.dungeon && getRun(ch, w.mapId)) {
      dungeonBar.classList.remove('hidden');
      clear(dungeonBar);
      const st = currentStage(ch, w.mapId);
      const area = w.mapDef.areas.find((a) => a.stage === st);
      const left = w.enemies.filter((e) => !e.dead && e.stage === st).length;
      const nSt = bossStage(w.mapId);
      const sc = w.mapDef.seals && st <= nSt ? w.sealCount(st) : null;
      const lever = w.mapDef.seals?.some((s) => (s.stage || 3) === st && s.kind === 'lever');
      const seals = sc?.total ? ` · ${lever ? 'mekanizma' : 'mühür'} ${sc.n}/${sc.total}` : '';
      const exit = w.mapDef.objects.find((o) => o.dungeonExit);
      dungeonBar.append(h('div', { class: 'grow' }, h('b', {}, w.mapDef.name + ' '), st <= nSt ? `· Bölüm ${st}/${nSt}: ${area?.name || ''} (${left} düşman${seals})` : '· Tamamlandı!'),
        // biten koşuda: aynı dungeon'da baştan yeni koşu (boss yeniden doğar; boss ganimeti yeni koşuda yeniden çekilir)
        st > nSt ? h('button', { class: 'btn small green', 'data-testid': 'dungeon-new-run', onTap: () => ui.confirm({ title: 'Yeni koşu', text: `${w.mapDef.name} baştan başlar: bütün bölümler ve boss yeniden doğar.`, ok: 'Başlat', onOk: () => w.changeMap(w.mapId, 'entrance', { exitDungeon: true, enterDungeon: true }) }) }, 'Yeni koşu') : null,
        h('button', { class: 'btn small red', onTap: () => ui.confirm({ title: 'Gönüllü çıkış', text: 'Mevcut koşu sona erer. Sonraki girişte yeni koşu başlar.', ok: 'Çık', danger: true, onOk: () => w.changeMap(exit.to, exit.entry, { exitDungeon: true }) }) }, 'Çık'));
    } else dungeonBar.classList.add('hidden');
  }

  function drawMinimap() {
    const w = app.world;
    if (!w?.minimapImage) return;
    const ctx = mmCanvas.getContext('2d');
    const S = 128, span = 44; // tile
    const k = S / span;
    const p = w.player;
    const px = p.x / TILE, py = p.y / TILE;
    const x0 = px - span / 2, y0 = py - span / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, S);
    ctx.drawImage(w.minimapImage, x0, y0, span, span, 0, 0, S, S);
    // keşfedilmemiş alanlar karanlık
    ctx.fillStyle = '#05040a';
    const f = w.fog;
    for (let fy = Math.floor(y0 / FOG_CELL); fy <= (y0 + span) / FOG_CELL; fy++) {
      for (let fx = Math.floor(x0 / FOG_CELL); fx <= (x0 + span) / FOG_CELL; fx++) {
        if (fx < 0 || fy < 0 || fx >= f.fw || fy >= f.fh || !f.cells[fy * f.fw + fx]) ctx.fillRect((fx * FOG_CELL - x0) * k, (fy * FOG_CELL - y0) * k, FOG_CELL * k + 1, FOG_CELL * k + 1);
      }
    }
    drawMarkers(ctx, w, (tx, ty) => [(tx - x0) * k, (ty - y0) * k], k, true);
    // oyuncu oku
    ctx.save(); ctx.translate(S / 2, S / 2);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(p.facing * 6, 0); ctx.lineTo(-p.facing * 4, -4.5); ctx.lineTo(-p.facing * 4, 4.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    mmName.textContent = `${w.mapDef.name}`;
  }

  const offs = [
    bus.on('tick', (dt) => {
      tAcc += dt; mmAcc += dt;
      if (tAcc >= 0.1) { tAcc = 0; updateVitals(); }
      if (mmAcc >= 0.25) { mmAcc = 0; drawMinimap(); updateParty(); }
    }),
    bus.on('changed', () => { updateVitals(); updateTracker(); }),
    bus.on('questProgress', (u) => {
      updateTracker();
      const done = u.p >= u.n;
      pushToast({ text: `${u.contract ? '' : 'Görev: '}${u.label} ${Math.min(u.p, u.n)}/${u.n}${done ? ' ✔' : ''}`, kind: done ? 'ok' : 'info', short: !done });
      if (u.q && done && QUEST_MAP[u.q.id]) {
        const all = trackedQuestList(app.char).find((x) => x.q.id === u.q.id);
        if (all?.ready) pushToast({ text: `"${u.q.name}" hazır — ${npcName(u.q.turnIn)}'a teslim et`, kind: 'level' });
      }
    }),
    bus.on('toast', (t) => pushToast(t)),
    bus.on('loot', (l) => pushFeed(l)),
    bus.on('channel', (c) => {
      channel.classList.toggle('hidden', !c);
      if (c) { channel.firstChild.textContent = c.label; channel.lastChild.firstChild.style.width = `${(1 - c.t / c.total) * 100}%`; }
    }),
    bus.on('saveError', () => pushToast({ text: 'Kayıt hatası! Tekrar denenecek. Yedek almanı öneririz.', kind: 'err' })),
    bus.on('mapEnter', (def) => { pushToast({ text: `${def.name} · ${def.rec}`, kind: 'level' }); updateTracker(); }),
    bus.on('dungeonProgress', updateTracker),
    bus.on('bossAnnounce', (t) => pushToast({ text: t, kind: 'elite' })),
    bus.on('online', () => { updateOnline(); updateParty(); }),
    bus.on('party', updateParty),
    bus.on('net', updateOnline),
    bus.on('partyChat', pushChat),
  ];

  const recent = new Map();
  function pushToast({ text, kind = 'info', short = false }) {
    const now = performance.now();
    if (recent.get(text) > now - 1200) return;
    recent.set(text, now);
    const t = h('div', { class: 'toast ' + kind }, text);
    toasts.appendChild(t);
    while (toasts.children.length > 4) toasts.firstChild.remove();
    setTimeout(() => t.remove(), short ? 1600 : 3000);
  }
  function pushFeed(l) {
    const line = h('div', {}, img(iconURL(l.icon)), h('span', { class: 'r-' + (l.r || 'N') }, `${l.name}${l.qty ? ' ×' + l.qty : ''}${l.pending ? ' (bekleyen)' : ''}`));
    feed.prepend(line);
    while (feed.children.length > 5) feed.lastChild.remove();
    setTimeout(() => line.remove(), 4500);
  }

  updateVitals();
  updateTracker();
  updateOnline();
  updateParty();
  return { el, destroy() { offs.forEach((f) => f()); window.removeEventListener('resize', layoutActions); el.remove(); } };
}

export function npcName(id) {
  return NPCS[id]?.name || id;
}

function nextMainHint(ch) {
  const next = Object.values(QUEST_MAP).filter((q) => q.main && !ch.quests[q.id]).sort((a, b) => a.order - b.order)[0];
  if (!next) return ch.quests.m18?.s === 'done' ? 'Hikâye tamamlandı — Legendary avına devam!' : null;
  if (ch.level < next.minLevel) return `Sonraki ana görev Lv.${next.minLevel}'de (Köy Muhtarı)`;
  return `Köy Muhtarı'nın yeni görevi var: ${next.name}`;
}

// Mini/büyük harita işaretleri (yaratıklar gösterilmez)
// NPC görev işaretleri mini haritada her karede yeniden hesaplanmasın (0,5 sn önbellek)
const markCache = { t: 0, m: {} };
function cachedMark(ch, npcId) {
  const now = performance.now();
  if (now - markCache.t > 500) { markCache.t = now; markCache.m = {}; }
  if (!(npcId in markCache.m)) markCache.m[npcId] = npcQuestMark(ch, npcId);
  return markCache.m[npcId];
}

export function drawMarkers(ctx, w, tf, k, mini) {
  const ch = app.char;
  const def = w.mapDef;
  const seen = (x, y) => w.fog.seen(Math.floor(x), Math.floor(y));
  const dot = (x, y, col, r = 3, shape = 'c') => {
    const [sx, sy] = tf(x, y);
    ctx.fillStyle = col; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath();
    if (shape === 'd') { ctx.moveTo(sx, sy - r); ctx.lineTo(sx + r, sy); ctx.lineTo(sx, sy + r); ctx.lineTo(sx - r, sy); ctx.closePath(); }
    else if (shape === 's') ctx.rect(sx - r, sy - r, r * 2, r * 2);
    else ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  };
  // görev ipucu alanı (V3 İzci Pusulası etkinken alan daralır ve parlar)
  const at = ch.world.activeTime, eff = ch.effects || {};
  const compass = at < (eff.compassUntil || 0);
  const tracked = trackedQuestList(ch);
  for (const t of tracked) {
    const hnt = t.hint;
    if (!hnt || hnt.map !== def.id || t.ready) continue;
    const [sx, sy] = tf(hnt.x, hnt.y);
    const r = compass ? Math.max(1.5, hnt.r * 0.45) : hnt.r;
    ctx.fillStyle = compass ? 'rgba(140,200,255,0.25)' : 'rgba(255,220,90,0.18)';
    ctx.strokeStyle = compass ? 'rgba(160,220,255,0.95)' : 'rgba(255,220,90,0.8)'; ctx.lineWidth = compass ? 1.5 : 1;
    ctx.beginPath(); ctx.arc(sx, sy, r * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // V3 Maden Lambası: bu haritadaki cevher ve ot düğümleri (tükenmişler soluk)
  if (at < (eff.lampUntil || 0)) {
    for (const o of def.objects) {
      if (o.type !== 'gather') continue;
      const ore = /ore|crystal/.test(o.kind);
      const used = at < (ch.world.gatherAt?.[o.id] || 0);
      dot(o.x, o.y, used ? '#5a5a5a' : ore ? '#9ad8e8' : '#8be06a', mini ? 2.2 : 3.2, 'd');
    }
  }
  for (const o of def.objects) {
    if (o.type === 'npc') {
      // V3: NPC görev simgesi — yeşil (teslim hazır), sarı (yeni görev), soluk (görev yok)
      const m = cachedMark(ch, o.npc);
      dot(o.x, o.y, m === 'ready' ? '#6af070' : m === 'avail' ? '#ffd040' : '#a89a70', m ? (mini ? 3.4 : 4.6) : (mini ? 2.4 : 3.2), m ? 'd' : 'c');
    }
    else if (o.type === 'waystone') { if (ch.world.waystones.includes(o.id)) dot(o.x, o.y, '#5ad8ff', mini ? 3.5 : 5, 'd'); }
    else if (o.type === 'altar') { if (seen(o.x, o.y)) dot(o.x, o.y, '#c070ff', mini ? 3.5 : 5, 'd'); }
    else if (o.type === 'portal' || o.type === 'dungeon_gate') { if (seen(Math.min(o.x, def.w - 1), Math.min(o.y, def.h - 1))) dot(Math.min(Math.max(o.x, 1), def.w - 2), Math.min(Math.max(o.y, 1), def.h - 2), '#ffffff', mini ? 3 : 4.5, 's'); }
  }
  // parti arkadaşları
  for (const m of w.remote?.markers(TILE) || []) dot(m.x, m.y, '#5ee07a', mini ? 3.6 : 5);
  if (!mini) {
    ctx.font = 'bold 11px Trebuchet MS, sans-serif'; ctx.textAlign = 'center';
    for (const a of def.areas) {
      if (!a.name || !seen(a.x, a.y)) continue;
      const [sx, sy] = tf(a.x, a.y);
      ctx.fillStyle = '#000'; ctx.fillText(a.name, sx + 1, sy + 1);
      ctx.fillStyle = a.boss ? '#ff9a4a' : a.camp ? '#f0e0c0' : '#c0e0ff'; ctx.fillText(a.name, sx, sy);
    }
  }
  void MAPS;
}
