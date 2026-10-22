// Oyun menüsü: Envanter · Karakter · Beceriler · Görevler · Harita · Ayarlar
import { h, clear, img, fmt, pct } from '../dom.js';
import { ui } from '../ui.js';
import { app } from '../../core/app.js';
import { bus } from '../../core/events.js';
import { iconURL } from '../../art/icons.js';
import { humanSheet, playerLook } from '../../art/characters.js';
import { packPreviewCanvas } from '../../art/spriteRuntime.js';
import { SLOTS, SLOT_NAMES, xpToNext, MAX_LEVEL, TILE } from '../../data/constants.js';
import { CLASSES } from '../../data/classes.js';
import { SKILLS, CLASS_SKILLS, maxRank, rankUpCost, MASTERY_BOOKS } from '../../data/skills.js';
import { ALL_QUESTS, QUEST_MAP } from '../../data/quests.js';
import { ENEMIES } from '../../data/enemies.js';
import { STACKABLES } from '../../data/materials.js';
import { MAPS, MAP_ORDER } from '../../data/maps/index.js';
import { computeStats } from '../../systems/stats.js';
import { statPointsFree, statPointsSpent, statResetCost, skillPointsFree, canRankUp, canApplyMasteryBook } from '../../systems/character.js';
import { countStack } from '../../systems/inventory.js';
import { questStatus, trackedQuestList, objectiveProgress, objectiveTarget, isReady, currentHint, questRegion, questCategory, QUEST_REGIONS, OBJECTIVE_HELP, MAX_ACTIVE_SIDE } from '../../systems/quests.js';

import { gridView, itemCell, cellSize } from './grid.js';
import { showItemCard } from './itemcard.js';
import { act } from '../actions.js';
import { settingsTab } from './settings.js';
import { drawMarkers, npcName } from '../hud.js';
import { FOG_CELL, decodeFog, fogDims } from '../../world/fog.js';
import { getBuilt } from '../../scenes/WorldScene.js';
import { MINIMAP_COLORS, MASS_COLORS } from '../../art/tiles.js';

const TABS = [
  { id: 'inventory', label: 'Envanter', icon: iconURL('ui:bag') },
  { id: 'character', label: 'Karakter', icon: iconURL('ui:char') },
  { id: 'skills', label: 'Beceriler', icon: iconURL('ui:skills') },
  { id: 'quests', label: 'Görevler', icon: iconURL('ui:quests') },
  { id: 'map', label: 'Harita', icon: iconURL('ui:map') },
  { id: 'history', label: 'Av Geçmişi', icon: iconURL('ui:history') },
  { id: 'settings', label: 'Ayarlar', icon: iconURL('ui:settings') },
];

export function openGameMenu(tab = 'inventory') {
  let cur = tab;
  let off = null;
  statDraft = null;
  const render = () => {
    clear(shell.body);
    shell.body.appendChild(RENDER[cur](render));
  };
  // sekme değişince / menü kapanınca onaylanmamış stat puanları kaybolmaz: otomatik onaylanır
  const shell = ui.shell({ tabs: TABS, active: tab, onTab: (t) => { flushStatDraft(); cur = t; render(); }, onClose: () => { flushStatDraft(); off?.(); ui.closePanel(); } });
  ui.openPanel('menu', () => shell.el);
  off = bus.on('changed', () => { if (ui.openName === 'menu' && !ui.layers.modal.firstChild) render(); });
  bus.on('panelClose', function once() { off?.(); bus.off('panelClose', once); });
  render();
}

export function charPreview(ch, scale = 3) {
  const pack = packPreviewCanvas('hero_' + ch.cls, 30 * scale);
  if (pack) return pack;
  const pb = humanSheet(playerLook(ch.cls, ch.equipment))[0];
  return pb.toCanvas(scale);
}

// ------------------------------------------------------------------ ENVANTER
function inventoryTab(rerender) {
  const ch = app.char, st = computeStats(ch);
  const cs = cellSize();
  const slotCell = (slot) => {
    const it = ch.equipment[slot];
    const disabledOff = slot === 'offhand' && st.twoHanded;
    const c = itemCell(it, { eq: true, slotLabel: disabledOff ? 'Çift el' : SLOT_NAMES[slot], onTap: it ? () => showItemCard(it, { where: 'equip', slot }, 'normal', rerender) : null });
    if (disabledOff) c.style.opacity = 0.45;
    return c;
  };
  const doll = h('div', { class: 'doll' },
    slotCell('helm'), h('div', { class: 'mid', style: { gridRow: 'span 2' } }, charPreview(ch)), slotCell('amulet'),
    slotCell('chest'), slotCell('ring'),
    slotCell('weapon'), h('div'), slotCell('offhand'),
    slotCell('gloves'), h('div'), slotCell('boots'));
  const statLine = (k, v) => h('div', { class: 'row small', style: { justifyContent: 'space-between' } }, h('span', { class: 'muted' }, k), h('b', {}, v));
  const stats = h('div', { class: 'box col', style: { gap: '2px' } },
    statLine(st.damageType === 'phys' ? 'Fiziksel güç' : 'Büyü gücü', st.power.toFixed(1)),
    statLine('DEF / MDEF', `${st.def.toFixed(1)} / ${st.mdef.toFixed(1)}`),
    statLine('HP / MP', `${st.maxHp} / ${st.maxMp}`),
    statLine('Kritik', pct(st.critChance)), statLine('Saldırı hızı', '+' + pct(st.atkSpeed)));
  const left = h('div', { class: 'col scroll', style: { flex: 'none', width: 'min(232px, 34vw)' } }, doll, stats);
  const bagHead = h('div', { class: 'row', style: { flexWrap: 'wrap' } },
    h('span', { class: 'gold' }, img(iconURL('ui:gold')), ` ${fmt(ch.gold)} Gold`),
    h('span', { class: 'muted small grow' }, `Çanta ${ch.bag.slots.filter(Boolean).length}/${ch.bag.size}`),
    ch.pending.length ? h('button', { class: 'btn small blue', 'data-testid': 'pending-btn', onTap: () => openPending(rerender) }, `Bekleyen ganimet (${ch.pending.length})`) : null,
    h('button', { class: 'btn small', onTap: () => { act.sort(); rerender(); } }, 'Sırala'));
  bagHead.querySelector('img').style.cssText = 'width:20px;height:20px;vertical-align:middle';
  const cols = Math.max(5, Math.min(8, Math.floor((window.innerWidth * 0.55) / (cs + 4))));
  const grid = gridView(ch.bag, { cols, cell: cs, onTap: (it, i) => showItemCard(it, { where: 'bag', index: i }, 'normal', rerender),
    onMove: (from, to) => { act.moveSlot(from, to); rerender(); } });
  const right = h('div', { class: 'col grow' }, bagHead, h('div', { class: 'scroll grow' }, grid));
  return h('div', { class: 'row grow', style: { alignItems: 'stretch', minHeight: 0 } }, left, right);
}

function openPending(rerender) {
  const ch = app.char;
  const box = h('div', { class: 'dlg frame' }, h('h3', { class: 't' }, 'Bekleyen Ganimet'),
    h('p', { class: 'small muted' }, 'Çanta doluyken düşen Rare/Epic/Legendary eşyalar burada güvenle saklanır. Çantada yer açınca al.'),
    h('div', { class: 'grid', style: { '--cols': 6 } }, ch.pending.map((it) => itemCell(it, { onTap: () => { ui.closeModal(); showItemCard(it, { where: 'pending' }, 'normal', rerender); } }))),
    h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
      h('button', { class: 'btn green', onTap: () => { act.claimPending(); ui.closeModal(); rerender(); } }, 'Hepsini çantaya al'),
      h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Kapat')));
  ui.modal(box);
}

// ------------------------------------------------------------------ KARAKTER
// Onaylanmamış stat dağıtımı taslağı: menü yeniden çizilse de korunur
let statDraft = null;
function flushStatDraft() {
  const d = statDraft;
  statDraft = null;
  if (d && app.char && Object.values(d).some(Boolean)) act.allocate(d);
}

// Statları tamamen sıfırla: dağıtılmış bütün puanlar geri gelir. İlk sıfırlama ücretsiz, sonrakiler seviyeye göre Gold.
function statResetBox(rerender) {
  const ch = app.char;
  const spent = statPointsSpent(ch), cost = statResetCost(ch);
  const price = cost ? h('span', { class: ch.gold >= cost ? 'gold' : 'bad' }, `${fmt(cost)} G`) : h('span', { class: 'ok' }, 'Ücretsiz (ilk sıfırlama)');
  const can = spent > 0 && ch.gold >= cost;
  return h('div', { class: 'li', style: { flexWrap: 'wrap', gap: '6px', marginTop: '6px' } },
    h('div', { class: 'grow tiny' }, h('div', {}, `Statları tamamen sıfırla · dağıtılmış ${spent} puan geri gelir`), h('div', {}, 'Ücret: ', price)),
    h('button', { class: 'btn small red' + (can ? '' : ' dis'), 'data-testid': 'stat-reset', onTap: () => {
      if (!spent) return bus.emit('toast', { text: 'Sıfırlanacak stat puanı yok', kind: 'info', short: true });
      ui.confirm({ title: 'Statları sıfırla', danger: true,
        text: `Dağıttığın ${spent} stat puanı geri gelecek ve istediğin gibi yeniden dağıtabileceksin. ${cost ? `Ücret: ${fmt(cost)} Gold.` : 'İlk sıfırlama ücretsiz; sonrakiler seviyene göre Gold tutar.'}`,
        ok: 'Sıfırla', onOk: () => { statDraft = null; act.resetStats(); rerender(); } });
    } }, 'Statları sıfırla'));
}

function characterTab(rerender) {
  const ch = app.char, st = computeStats(ch), cls = CLASSES[ch.cls];
  const free = statPointsFree(ch);
  const pend = statDraft || (statDraft = { str: 0, dex: 0, int: 0, vit: 0 });
  const used = () => Object.values(pend).reduce((a, b) => a + b, 0);
  // taslak artık mevcut puanı aşamaz (ör. puan başka yerde harcandıysa)
  while (used() > free) { const k = ['vit', 'int', 'dex', 'str'].find((x) => pend[x] > 0); pend[k]--; }
  const rows = h('div', { class: 'statgrid' });
  const freeEl = h('b', { class: 'gold' });
  const head = h('div', { class: 'row', style: { alignItems: 'center', flexWrap: 'wrap' } });
  const draw = () => {
    clear(rows); clear(head);
    const left = free - used();
    freeEl.textContent = left;
    const any = used() > 0;
    head.append(
      h('div', { class: 'small grow' }, 'Dağıtılabilir stat puanı: ', freeEl),
      h('button', { class: 'btn small' + (any ? '' : ' dis'), onTap: () => { for (const k in pend) pend[k] = 0; draw(); } }, 'Geri al'),
      h('button', { class: 'btn small green' + (any ? '' : ' dis'), 'data-testid': 'stat-confirm', onTap: () => { const d = { ...pend }; statDraft = null; act.allocate(d); rerender(); } }, 'Onayla'));
    const names = { str: ['STR', 'Fiziksel güç'], dex: ['DEX', 'Kritik, hız'], int: ['INT', 'Büyü, MP'], vit: ['VIT', 'HP, DEF'] };
    for (const k of ['str', 'dex', 'int', 'vit']) {
      rows.appendChild(h('div', { class: 'li stat' },
        h('div', { class: 'grow' }, h('b', {}, names[k][0]), ' ', h('span', { class: 'gold' }, st[k] + pend[k]), pend[k] ? h('span', { class: 'ok' }, ` +${pend[k]}`) : null, h('div', { class: 'tiny muted' }, names[k][1])),
        h('button', { class: 'btn small' + (pend[k] > 0 ? '' : ' dis'), onTap: () => { if (pend[k] <= 0) return; pend[k]--; draw(); } }, '−'),
        h('button', { class: 'btn small green' + (left > 0 ? '' : ' dis'), 'data-testid': 'stat-' + k, onTap: () => { if (free - used() <= 0) return; pend[k]++; draw(); } }, '+')));
    }
  };
  draw();
  const line = (k, v) => h('div', { class: 'row small', style: { justifyContent: 'space-between', borderBottom: '1px solid #3a2c22', padding: '3px 0' } }, h('span', { class: 'muted' }, k), h('b', {}, v));
  const durItems = SLOTS.filter((s) => ch.equipment[s]).map((s) => `${SLOT_NAMES[s]} ${ch.equipment[s].d}`);
  const xpNeed = ch.level >= MAX_LEVEL ? '—' : `${fmt(ch.exp)} / ${fmt(xpToNext(ch.level))}`;
  return h('div', { class: 'row grow', style: { alignItems: 'stretch', minHeight: 0, flexWrap: 'wrap' } },
    h('div', { class: 'col box scroll', style: { flex: '1 1 240px' } },
      h('div', { class: 'row', style: { gap: '6px' } }, Object.assign(charPreview(ch, 2), { style: 'height:48px;image-rendering:pixelated' }), h('div', { class: 'small' },
        h('div', { style: { fontFamily: 'var(--title)', fontSize: '1.15rem', color: 'var(--gold2)', lineHeight: 1.1 } }, ch.name),
        h('div', {}, `${cls.name} (${cls.latin}) · Seviye ${ch.level}`),
        ch.titles.length ? h('div', { class: 'r-L small' }, `«${ch.titles.join(', ')}»`) : null,
        ch.mastery ? h('div', { class: 'r-E small' }, `Ustalık I: ${SKILLS[CLASS_SKILLS[ch.cls].mastery].name}`) : null,
        ch.mastery2 ? h('div', { class: 'r-L small' }, `Ustalık II: ${SKILLS[CLASS_SKILLS[ch.cls].mastery2].name}`) : null)),
      head,
      rows,
      statResetBox(rerender)),
    h('div', { class: 'col box scroll', style: { flex: '1 1 240px' } },
      h('h3', { class: 't' }, 'Hesaplanan değerler'),
      line('EXP', xpNeed),
      line('Maks. HP / MP', `${st.maxHp} / ${st.maxMp}`),
      line('Fiziksel güç', st.physPower.toFixed(1)),
      line('Büyü gücü', st.magicPower.toFixed(1)),
      line('DEF', st.def.toFixed(1)), line('MDEF', st.mdef.toFixed(1)),
      line('Kritik şansı (üst sınır %45)', pct(st.critChance)),
      line('Saldırı hızı bonusu (üst sınır %35)', pct(st.atkSpeed)),
      line('Normal saldırı aralığı', `${st.attackInterval.toFixed(2)} sn`),
      line('Zehir direnci', pct(st.poisonRes, 0)),
      ...Object.entries(st.species).map(([k, v]) => line(`Tür hasarı: ${k}`, '+' + pct(v, 0))),
      line('Dayanıklılık', durItems.join(' · ') || '—'),
      h('h3', { class: 't' }, 'Kayıtlar'),
      line('Öldürülen yaratık', fmt(ch.record.kills)), line('Ölüm', ch.record.deaths),
      line('Boss zaferleri', Object.entries(ch.record.bossKills).map(([k, v]) => `${ENEMIES[k].name} ×${v}`).join(', ') || '—'),
      line('Bulunan Legendary', ch.record.legendaries), line('Başarılı yükseltme', ch.record.upgrades),
      line('Oyun süresi', `${Math.floor(ch.record.playTime / 3600)} sa ${Math.floor((ch.record.playTime % 3600) / 60)} dk`)));
}

// ------------------------------------------------------------------ BECERİLER
let barSel = null;   // beceri çubuğunda seçili yuva (dokun → beceri seç)

function skillBarBox(rerender) {
  const ch = app.char, cs = CLASS_SKILLS[ch.cls];
  const bar = ch.skillBar || cs.actives.slice(0, 4);
  const slots = bar.map((id, i) => h('button', { class: 'barslot' + (barSel === i ? ' sel' : ''), 'data-testid': 'bar-' + i, onTap: () => { barSel = barSel === i ? null : i; rerender(); } },
    img(iconURL('skill:' + id)), h('span', { class: 'tiny' }, SKILLS[id].name)));
  const picks = barSel === null ? null : h('div', { class: 'row wrap' }, h('span', { class: 'small muted' }, `${barSel + 1}. düğmeye:`),
    cs.actives.filter((id) => id !== bar[barSel]).map((id) => {
      const open = !!ch.skills[id];
      return h('button', { class: 'btn small' + (open ? '' : ' dis'), 'data-testid': 'bar-pick-' + id, onTap: () => { act.setSkillBar(barSel, id); barSel = null; rerender(); } },
        img(iconURL('skill:' + id)), open ? SKILLS[id].name : `${SKILLS[id].name} (Lv.${SKILLS[id].unlock})`);
    }));
  return h('div', { class: 'box col' },
    h('div', { class: 'row' }, h('b', { class: 'gold' }, 'Beceri çubuğu'), h('span', { class: 'tiny muted' }, ' · Ekranda 4 düğme var. Bir yuvaya dokun, sonra yerleştireceğin beceriyi seç (yer değiştirir).')),
    h('div', { class: 'row barslots' }, slots), picks);
}

function skillsTab(rerender) {
  const ch = app.char;
  const cs = CLASS_SKILLS[ch.cls];
  const bookRow = (id) => {
    const bk = MASTERY_BOOKS[id];
    if (!bk || ch.level < 28) return null;
    if (ch.masteryBooks?.[id]) return h('div', { class: 'tiny', style: { color: '#d8a0ff' } }, `Ustalık Kitabı: ${bk.name} — ${bk.desc}${(ch.skills[id] || 0) < 5 ? ' (Rank 5\'te etkin)' : ''}`);
    const chk = canApplyMasteryBook(ch, id);
    return h('div', { class: 'row', style: { gap: '6px', alignItems: 'center' } },
      h('span', { class: 'tiny muted grow' }, `Ustalık Kitabı (Lv.30, Rank 5): ${bk.desc} · Kitap: ${countStack(ch.bag, 'mastery_book')}`),
      h('button', { class: 'btn small' + (chk.ok ? '' : ' dis'), 'data-testid': 'book-' + id, onTap: () => ui.confirm({ title: 'Ustalık Kitabı', text: `${SKILLS[id].name}: ${bk.desc} 1 Ustalık Kitabı harcanır; her beceriye yalnız bir kez uygulanır.`, ok: 'Uygula', onOk: () => { act.applyBook(id); rerender(); } }) }, 'Uygula'));
  };
  const card = (id) => {
    const s = SKILLS[id], r = s.kind === 'mastery2' ? (ch.mastery2 ? 1 : 0) : ch.skills[id] || 0, max = maxRank(s);
    const mk = s.kind === 'mastery' || s.kind === 'mastery2';
    const chk = canRankUp(ch, id);
    const next = r && r < max ? s.desc(r + 1, s) : null;
    const extra = s.kind === 'active' && r ? ` · MP ${s.mp[r - 1]} · Bekleme ${s.cd[r - 1]} sn${s.range ? ` · Menzil ${s.range} tile` : ''}` : '';
    return h('div', { class: 'li', style: { alignItems: 'flex-start' } },
      img(iconURL('skill:' + id)),
      h('div', { class: 'grow' },
        h('div', {}, h('b', { class: r ? 'gold' : 'muted' }, s.name), ` · ${s.kind === 'active' ? 'Aktif' : s.kind === 'passive' ? 'Pasif' : s.kind === 'mastery2' ? 'Ustalık II' : 'Ustalık'} · Rank ${r}/${max}`),
        h('div', { class: 'small' }, r ? s.desc(r, s) : `Seviye ${s.unlock}'te ${s.kind === 'mastery' ? 'Ustalık I görevi ile' : s.kind === 'mastery2' ? 'ana hikâye bitince Gezgin Bilge\'nin Ustalık II görevi ile' : 'ücretsiz'} açılır. ${s.desc(1, s)}`),
        h('div', { class: 'tiny muted' }, extra.slice(3)),
        next ? h('div', { class: 'tiny ok' }, `Sonraki rank: ${next} (maliyet ${rankUpCost(s, r + 1)} puan)`) : null,
        s.kind === 'active' ? bookRow(id) : null),
      !mk ? h('button', { class: 'btn small green' + (chk.ok ? '' : ' dis'), 'data-testid': 'rank-' + id, onTap: () => { act.rankUp(id); rerender(); } }, r >= max ? 'Maks.' : 'Yükselt') : null);
  };
  return h('div', { class: 'col grow scroll' },
    h('div', { class: 'row' }, h('div', { class: 'grow' }, 'Beceri puanı: ', h('b', { class: 'gold' }, skillPointsFree(ch)),
      h('span', { class: 'muted small' }, ` · Toplam ${ch.level - 1 + (ch.bonusSkillPoints || 0)} (her seviye 1, Lv.10/20 sınıf görevleri +1)`))),
    skillBarBox(rerender),
    h('h3', { class: 't' }, 'Aktif beceriler'), cs.actives.map(card),
    h('h3', { class: 't' }, 'Pasif beceriler'), cs.passives.map(card),
    h('h3', { class: 't' }, 'Ustalık I (Lv.20)'), card(cs.mastery),
    h('h3', { class: 't' }, 'Ustalık II (Lv.40)'), card(cs.mastery2),
    h('p', { class: 'tiny muted' }, 'Sıfırlama Gezgin Bilge\'dedir (Lv.1–10 ücretsiz, Lv.11–14 1.000 G, Lv.15–20 2.500 G, Lv.21–30 5.000 G, Lv.31–40 7.500 G). Ustalık Kitapları ve Ustalık II sıfırlamada kaybolmaz.'));
}

// ------------------------------------------------------------------ GÖREVLER
// V3 görev günlüğü: Ana / Yan / Sınıf / Sözleşme, bölge filtresi, en çok 3 HUD takibi, tamamlananlar.
// Alınabilir listesi kademeli: yalnız alınabilen ve en çok 3 seviye sonra açılacak görevler görünür.
const JOURNAL = { cat: 'main', region: 'all', sel: null };
const CAT_LABEL = { main: 'Ana hikâye', side: 'Yan', class: 'Sınıf', contract: 'Sözleşme' };

function objectiveHelpKey(o) {
  if (o.type === 'escort') return 'escort';
  if (o.type === 'defend') return 'defend';
  if (o.type === 'craft') return 'craft';
  if (o.type === 'kill' && o.spawn) return 'spawn';
  if (o.type === 'interact' && o.ordered) return 'ordered';
  if (o.type === 'interact' && (o.consume?.length || o.mode === 'repair' || o.mode === 'purify')) return 'consume';
  return null;
}

function questsTab(rerender) {
  const ch = app.char;
  const J = JOURNAL;
  const listEl = h('div', { class: 'list scroll', style: { flex: '1 1 42%' } });
  const detail = h('div', { class: 'box scroll', style: { flex: '1 1 58%' } });
  const tracking = ch.tracking || [];
  const showDetail = (q) => {
    clear(detail);
    J.sel = q.id;
    const st = questStatus(ch, q);
    const hint = currentHint(ch, q);
    const helps = [...new Set(q.objectives.map(objectiveHelpKey).filter(Boolean))];
    const tracked = tracking.includes(q.id);
    detail.append(...[
      h('h3', { class: 't' }, q.name),
      h('div', { class: 'small muted' }, `${q.main ? 'Ana hikâye' : q.classQuest ? 'Sınıf görevi' : 'Yan görev'} · ${QUEST_REGIONS.find(([k]) => k === questRegion(q))?.[1] || ''} · Önerilen Lv. ${q.rec} · Veren: ${npcName(q.giver)}${q.turnIn !== q.giver ? ` · Teslim: ${npcName(q.turnIn)}` : ''}`),
      h('p', { class: 'small' }, q.text),
      h('div', { class: 'small' }, q.objectives.map((o, i) => h('div', { class: objectiveProgress(ch, q, i) >= objectiveTarget(o) ? 'ok' : '' },
        `• ${o.label}${o.type === 'talk' ? '' : ` ${Math.min(objectiveProgress(ch, q, i), objectiveTarget(o))}/${objectiveTarget(o)}`}`))),
      helps.length ? h('div', { class: 'tiny', style: { color: '#9ad0ff', marginTop: '4px' } }, helps.map((k) => h('div', {}, 'ⓘ ' + OBJECTIVE_HELP[k]))) : null,
      h('div', { class: 'small gold', style: { marginTop: '6px' } }, `Ödül: ${q.exp ? fmt(q.exp) + ' EXP · ' : ''}${q.gold ? fmt(q.gold) + ' Gold' : ''}${q.rewardItems.length ? ' · ' + q.rewardItems.map((r) => `${STACKABLES[r.id].name} ×${r.qty}`).join(', ') : ''}${q.title ? ` · Unvan: ${q.title}` : ''}${q.skillPoint ? ' · +1 beceri puanı' : ''}${q.mastery2 ? ' · Ustalık II pasifi' : ''}`),
      hint ? h('div', { class: 'tiny muted' }, `Yaklaşık konum: ${MAPS[hint.map].name} — haritada sarı alan`) : null,
      st === 'active' ? h('div', { class: 'row', style: { marginTop: '8px' } },
        h('button', { class: 'btn small' + (tracked ? ' green' : ''), 'data-testid': 'track-' + q.id, onTap: () => { act.track(q.id); rerender(); } }, tracked ? `★ Takipte (${tracking.length}/3)` : `☆ Takip et (${tracking.length}/3)`),
        isReady(ch, q) ? h('span', { class: 'ok small' }, `✔ Teslim: ${npcName(q.turnIn)}`) : null,
        h('button', { class: 'btn small red', onTap: () => ui.confirm({ title: 'Görevi bırak', text: 'İlerleme silinir; görevi yeniden alabilirsin.', danger: true, ok: 'Bırak', onOk: () => { act.abandon(q.id); rerender(); } }) }, 'Bırak')) : null,
    ].filter(Boolean));
  };
  const inCat = (q) => questCategory(q) === J.cat && (!q.cls || q.cls === ch.cls);
  const inRegion = (q) => J.region === 'all' || questRegion(q) === J.region;
  const pool = ALL_QUESTS.filter((q) => inCat(q) && inRegion(q));
  const statusOf = (q) => questStatus(ch, q);
  const active = pool.filter((q) => statusOf(q) === 'active').sort((a, b) => (tracking.includes(b.id) - tracking.includes(a.id)) || (isReady(ch, b) - isReady(ch, a)));
  const done = pool.filter((q) => statusOf(q) === 'done');
  const avail = pool.filter((q) => statusOf(q) === 'available' || (statusOf(q) === 'lowlevel' && q.minLevel - ch.level <= 3));
  const allActive = ALL_QUESTS.filter((q) => statusOf(q) === 'active');
  const countCat = (c) => allActive.filter((q) => questCategory(q) === c).length;
  const item = (q, extra) => {
    const ready = isReady(ch, q), tracked = tracking.includes(q.id);
    const el = h('div', { class: 'li ia' + (J.sel === q.id ? ' on' : ''), 'data-testid': 'jq-' + q.id, onTap: () => { listEl.querySelectorAll('.li').forEach((x) => x.classList.remove('on')); el.classList.add('on'); showDetail(q); } },
      img(iconURL(q.main ? 'ui:star' : 'ui:quests')),
      h('div', { class: 'grow' }, h('b', {}, (tracked ? '★ ' : '') + q.name), h('div', { class: 'tiny ' + (ready ? 'ok' : 'muted') }, extra)));
    return el;
  };
  // kategori sekmeleri + bölge filtresi
  const cats = h('div', { class: 'row wrap', style: { gap: '4px' } }, Object.entries(CAT_LABEL).map(([k, label]) =>
    h('button', { class: 'btn small' + (J.cat === k ? ' green' : ' ghost'), 'data-testid': 'jcat-' + k, onTap: () => { J.cat = k; J.sel = null; rerender(); } },
      k === 'contract' ? label + (ch.contract ? ' (1)' : '') : `${label} (${countCat(k)})`)));
  const regionSel = h('select', { class: 'sel', 'data-testid': 'jregion', style: { minHeight: '40px' }, onchange: (e) => { J.region = e.target.value; J.sel = null; rerender(); } },
    h('option', { value: 'all' }, 'Bütün bölgeler'), QUEST_REGIONS.map(([k, n]) => h('option', { value: k, selected: J.region === k }, n)));
  const head = h('div', { class: 'row wrap', style: { gap: '6px', alignItems: 'center' } }, cats, regionSel,
    h('span', { class: 'tiny muted' }, `Takip ${tracking.length}/3 · Yan görev ${allActive.filter((q) => questCategory(q) === 'side').length}/${MAX_ACTIVE_SIDE}`));
  if (J.cat === 'contract') {
    const c = ch.contract;
    listEl.append(c ? h('div', { class: 'li' }, img(iconURL('ui:target')), h('div', { class: 'grow small' }, h('b', {}, `${ENEMIES[c.enemy].name} avı`), h('div', { class: 'tiny ' + (c.p >= c.n ? 'ok' : 'muted') }, `${c.p}/${c.n}${c.p >= c.n ? ' — Avcıya teslim et' : ''}`)))
      : h('p', { class: 'small muted' }, 'Aktif sözleşme yok. Usta Avcı (köy) ve Avcı Sena (Ayaz Konağı) tekrarlanabilir av sözleşmeleri verir.'));
    detail.append(h('h3', { class: 't' }, 'Av Sözleşmeleri'), h('p', { class: 'small' }, 'Sözleşmeler tekrarlanabilir; seviyene uygun bir yaratıktan belirli sayıda avlarsın. Ganimet şansını değiştirmez.'));
  } else {
    listEl.append(h('div', { class: 'small gold' }, `Aktif (${active.length})`),
      ...active.map((q) => item(q, isReady(ch, q) ? `✔ Hazır — ${npcName(q.turnIn)}` : `Lv. ${q.rec}`)),
      h('div', { class: 'small gold' }, `Alınabilir (${avail.length})`),
      ...avail.map((q) => item(q, `${npcName(q.giver)} · Lv. ${q.minLevel}+${statusOf(q) === 'lowlevel' ? ' (yakında)' : ''}`)),
      h('button', { class: 'btn small ghost', 'data-testid': 'quests-done-toggle', onTap: () => { showDone = !showDone; rerender(); } }, `${showDone ? '▾' : '▸'} Tamamlanan (${done.length}/${pool.length})`),
      ...(showDone ? done.map((q) => item(q, 'Tamamlandı ✔')) : []));
    if (!active.length && !avail.length) listEl.append(h('p', { class: 'small muted' }, 'Bu filtrede görev yok.'));
    const first = pool.find((q) => q.id === J.sel) || active[0] || avail[0];
    if (first) showDetail(first); else detail.append(h('p', { class: 'muted' }, 'Görev seç.'));
  }
  return h('div', { class: 'col grow', style: { minHeight: 0, gap: '6px' } }, head,
    h('div', { class: 'row grow', style: { alignItems: 'stretch', minHeight: 0 } }, listEl, detail));
}

let showDone = false;   // tamamlanan görevler listesi (mobilde kaydırmayı azaltmak için kapalı başlar)

// ------------------------------------------------------------------ AV GEÇMİŞİ (V2)
function historyTab() {
  const ch = app.char, hs = ch.history;
  const line = (k, v) => h('div', { class: 'row small', style: { justifyContent: 'space-between', borderBottom: '1px solid #3a2c22', padding: '3px 0' } }, h('span', { class: 'muted' }, k), h('b', {}, v));
  if (!hs) return h('div', { class: 'box' }, 'Av Geçmişi yok.');
  const since = new Date(hs.since).toLocaleDateString('tr-TR');
  const bosses = Object.entries(hs.bossKills).map(([k, v]) => `${ENEMIES[k].name} ×${v}`).join(', ') || '—';
  const dungeons = [['dungeon', 'Derin Ocak'], ['frost_temple', 'Buz Mabedi']].map(([k, n]) => `${n} ×${hs.dungeons[k] || 0}`).join(' · ');
  const kinds = { normal: 'Yaratıklar', elite: 'Elitler', boss: 'Bosslar' };
  const groups = Object.keys(kinds).map((kind) => {
    const rows = Object.entries(hs.byEnemy).filter(([id]) => ENEMIES[id]?.kind === kind).sort((a, b) => b[1] - a[1]);
    if (!rows.length) return null;
    return h('div', { class: 'col' }, h('h3', { class: 't' }, kinds[kind]),
      h('div', { class: 'histgrid' }, rows.map(([id, n]) => h('div', { class: 'row small' }, h('span', { class: 'grow' }, `${ENEMIES[id].name} (Lv.${ENEMIES[id].level})`), h('b', {}, fmt(n))))));
  });
  return h('div', { class: 'row grow', style: { alignItems: 'stretch', minHeight: 0, flexWrap: 'wrap' }, 'data-testid': 'history' },
    h('div', { class: 'col box scroll', style: { flex: '1 1 240px' } },
      h('h3', { class: 't' }, 'Av Geçmişi'),
      h('div', { class: 'tiny muted' }, hs.fromV1 ? `V2'den itibaren kaydediliyor (${since}). V1 kayıtları Karakter sekmesindedir.` : `Kayıt başlangıcı: ${since}`),
      line('Toplam öldürme', fmt(hs.kills)),
      line('Boss zaferleri', bosses),
      line('Bulunan Rare', fmt(hs.found.R)), line('Bulunan Epic', fmt(hs.found.E)), line('Bulunan Legendary', fmt(hs.found.L)),
      line('Tamamlanan zindan', dungeons),
      h('p', { class: 'tiny muted' }, 'Sayaçlar yalnız kayıt içindir; ganimet şansını hiçbir şekilde etkilemez.')),
    h('div', { class: 'col box scroll', style: { flex: '1 1 260px' } }, groups.filter(Boolean).length ? groups : h('p', { class: 'muted small' }, 'Henüz kayıt yok. Avlandıkça burada türlere göre sayılır.')));
}

// ------------------------------------------------------------------ HARİTA
function mapTab() {
  const ch = app.char;
  let mapId = app.world?.mapId || ch.world.map;
  const wrap = h('div', { class: 'bigmap' });
  const tabs = h('div', { class: 'col scroll', style: { flex: 'none', width: '150px' } });
  const legend = h('div', { class: 'tiny muted' }, '● NPC  ◆ Yol Taşı / Sunak  ■ Geçit  ○ Görev bölgesi. Normal yaratıklar gösterilmez.');
  const draw = () => {
    clear(wrap); clear(tabs);
    for (const id of MAP_ORDER) {
      const known = !!ch.world.discovered[id] || id === app.world?.mapId;
      tabs.appendChild(h('button', { class: 'btn small' + (id === mapId ? ' blue' : '') + (known ? '' : ' dis'), onTap: () => { mapId = id; draw(); } }, MAPS[id].name));
    }
    tabs.appendChild(legend);
    const def = MAPS[mapId];
    const b = getBuilt(mapId);
    const k = Math.max(2, Math.floor(Math.min((window.innerWidth - 220) / def.w, (window.innerHeight - 90) / def.h)));
    const c = h('canvas', { width: def.w * k, height: def.h * k });
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const live = app.world?.mapId === mapId;
    const base = live ? app.world.minimapImage : renderBase(b, def);
    ctx.drawImage(base, 0, 0, def.w * k, def.h * k);
    const fog = live ? app.world.fog : { ...fogDims(def.w, def.h), cells: decodeFog(ch.world.discovered[mapId], fogDims(def.w, def.h).fw * fogDims(def.w, def.h).fh) };
    ctx.fillStyle = '#05040a';
    for (let y = 0; y < fog.fh; y++) for (let x = 0; x < fog.fw; x++) if (!fog.cells[y * fog.fw + x]) ctx.fillRect(x * FOG_CELL * k, y * FOG_CELL * k, FOG_CELL * k + 1, FOG_CELL * k + 1);
    const fakeW = { mapDef: def, fog: { seen: (tx, ty) => fog.cells[Math.floor(ty / FOG_CELL) * fog.fw + Math.floor(tx / FOG_CELL)] === 1 } };
    drawMarkers(ctx, fakeW, (x, y) => [x * k, y * k], k, false);
    if (live) {
      const p = app.world.player;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x / TILE * k, p.y / TILE * k, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    wrap.appendChild(c);
  };
  draw();
  return h('div', { class: 'row grow', style: { alignItems: 'stretch', minHeight: 0 } }, tabs, wrap);
}

function renderBase(b, def) {
  const c = document.createElement('canvas');
  c.width = b.w; c.height = b.h;
  const ctx = c.getContext('2d');
  const id = ctx.createImageData(b.w, b.h);
  const toRgb = (hx) => [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)];
  const mc = toRgb(MASS_COLORS[def.mass] || '#111111');
  for (let i = 0; i < b.w * b.h; i++) {
    let col = toRgb(MINIMAP_COLORS[b.terrain[i]] || '#444444');
    if (b.mass[i]) col = mc; else if (b.sight[i]) col = col.map((v) => v * 0.55);
    id.data.set([col[0], col[1], col[2], 255], i * 4);
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

const RENDER = {
  history: historyTab,
  inventory: inventoryTab,
  character: characterTab,
  skills: skillsTab,
  quests: questsTab,
  map: mapTab,
  settings: settingsTab,
};

export { QUEST_MAP, trackedQuestList };
