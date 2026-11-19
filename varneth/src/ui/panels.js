// In-game menus. Every button triggers a real server command; nothing is simulated locally.
import { h, fmt, pct, toast, modal, confirmBox, promptBox, withTooltip, hideTooltip } from './dom.js';
import { heroCanvas, itemIcon, matIcon, skillIcon } from './icons.js';
import { itemTooltip, compareTooltip, affixText, reqLevel } from './itemtext.js';
import { audio } from '../game/audio.js';
import { CLASSES } from '../../shared/data/classes.js';
import { SKILLS, TREES, RULES, CLASS_SKILLS, NODE_BY_ID } from '../../shared/data/skills.js';
import { REGIONS, REGION_BY_ID, ZONE_BY_ID, DUNGEONS, BOSS_ENCOUNTERS } from '../../shared/data/regions.js';
import { ENEMIES } from '../../shared/data/enemies.js';
import { RARITIES } from '../../shared/data/rarities.js';
import { BASE_BY_ID, BASES, SLOTS, SLOT_NAMES, SETS, UNIQUE_BASES, FAMILIES, baseAllowedForClass } from '../../shared/data/items.js';
import { AFFIXES, AFFIX_BY_ID } from '../../shared/data/affixes.js';
import { MATERIALS } from '../../shared/data/materials.js';
import { SMITH_RECIPES, ALCHEMY_RECIPES } from '../../shared/data/recipes.js';
import { MAIN_QUESTS, MAIN_QUEST_BY_ID, WEEKLY_HUNTS, ACHIEVEMENTS } from '../../shared/data/quests.js';
import { UNIQUE_SOURCES } from '../../shared/loot.js';
import { BALANCE } from '../../shared/data/balance.js';
import { upgradeCost, reforgeCost, polishCost, skillResetCost, marketFees, npcSellValue } from '../../shared/formulas.js';
import { deriveStats } from '../../shared/stats.js';

const TITLES = { world: 'Dünya Haritası', dungeons: 'Zindanlar', character: 'Karakter', inventory: 'Envanter', stash: 'Ortak Mahzen (Depo)', workshop: 'Atölye', quests: 'Avcılar Loncası — Görevler', market: 'Tüccarlar Meydanı — Oyuncu Pazarı', collection: 'Kadim Arşiv — Koleksiyon', settings: 'Ayarlar' };

export function openPanel(app, key, sub) {
  app.closePanels();
  const m = modal(TITLES[key], h('div', {}, 'Yükleniyor…'));
  const render = async (s = sub) => {
    try {
      const content = await PANELS[key](app, render, s, m);
      m.body.replaceChildren(content);
    } catch (e) { m.body.replaceChildren(h('div', { class: 'danger-text' }, e.message || String(e))); }
  };
  render();
  return m;
}

const tabs = (items, cur, onPick) => h('div', { class: 'tabs' }, items.map(([k, label]) => h('button', { class: cur === k ? 'on' : '', onclick: () => onPick(k) }, label)));
const matName = (m) => MATERIALS[m]?.name || m;
const matList = (mats) => Object.entries(mats).map(([m, n]) => `${n}× ${matName(m)}`).join(', ');

function itemCell(item, { onClick, selected, ctx, current } = {}) {
  const el = h('div', { class: `cell bc${item.rarity}${selected ? ' sel' : ''}`, onclick: onClick },
    itemIcon(item.base_id),
    item.upgrade ? h('span', { class: 'up' }, '+' + item.upgrade) : null,
    item.locked ? h('span', { class: 'lock' }, '🔒') : null);
  withTooltip(el, () => (current !== undefined && ctx?.compare ? compareTooltip(item, current, ctx) : itemTooltip(item, ctx || {})), current !== undefined);
  return el;
}

function ctxFor(app) {
  const v = app.view;
  const lo = v.loadouts[v.character.activeBuild];
  const buffs = (v.character.buffs || []).filter((b) => b.remaining > 0).map((b) => ({ stat: MATERIALS[b.id].buff.stat, value: MATERIALS[b.id].buff.value }));
  return { char: v.character, equipped: v.equipped, loadout: lo, buffs, setCounts: v.stats.setCounts, compare: true };
}

function slotOf(item) {
  const b = BASE_BY_ID[item.base_id];
  if (b.slot === 'ring') return app_ring(item);
  const f = FAMILIES[b.family];
  return f.kind === 'weapon' ? 'mainhand' : b.slot;
}
function app_ring() { return 'ring1'; }

async function afterSessionChange(app, r) {
  if (r?.session && app.farm?.active) app.farm.resync(r.session);
  await app.refreshView();
}

// =====================================================================================
const PANELS = {
  // ------------------------------------------------------------------ WORLD
  async world(app, render) {
    const v = app.view;
    const unlocked = v.progress.unlockedRegions;
    const lvl = v.character.level;
    const huntBox = h('label', { class: 'row', style: { color: 'var(--text)' } }, h('input', { type: 'checkbox', id: 'use-hunt', disabled: app.boot.profile.dailyHunts <= 0 }),
      `Günlük özel av hakkı kullan (nadir şampiyon çağırır) — ${app.boot.profile.dailyHunts}/7 hak`);
    const regions = REGIONS.map((r) => {
      if (!r.available) {
        return h('div', { class: 'region frame unknown' }, h('h3', {}, r.name), h('div', { class: 'small muted' }, `Seviye ${r.levels[0]}–${r.levels[1]} · Keşfedilmedi`), h('div', { class: 'small muted' }, 'Sonraki güncellemelerde açılacak.'));
      }
      const open = unlocked.includes(r.id);
      const enc = BOSS_ENCOUNTERS[r.boss];
      const gate = MAIN_QUESTS.find((q) => q.bossGate && q.obj.boss === r.boss);
      const gateOpen = v.quests.some((q) => q.id === gate.id) || (v.progress.bossKills[r.boss] > 0);
      return h('div', { class: 'region frame' + (open ? '' : ' locked') },
        h('h3', {}, r.name, ' ', h('span', { class: 'small muted' }, `Sv ${r.levels[0]}–${r.levels[1]}`)),
        h('p', { class: 'small muted' }, r.lore),
        !open ? h('div', { class: 'small danger-text' }, `Kilitli — ${ENEMIES[REGIONS[r.order - 2]?.boss]?.name || ''} yenilmeli.`) : null,
        ...r.zones.map((z) => h('div', { class: 'zone' },
          h('div', {}, h('div', {}, z.name), h('div', { class: 'small muted' }, `Sv ${z.levels[0]}–${z.levels[1]} · ${z.pool.map(([e]) => ENEMIES[e].name).join(', ')}`)),
          h('button', { class: 'small primary', disabled: !open, onclick: () => app.startFarm('farm', z.id, 'normal', document.getElementById('use-hunt')?.checked) }, app.farm?.session?.target === z.id ? 'Burada' : 'Avla'))),
        h('div', { class: 'zone' },
          h('div', {}, h('div', { class: 'danger-text' }, `Boss: ${ENEMIES[r.boss].name}`), h('div', { class: 'small muted' }, `Sv ${enc.level} · Gerekli Sv ${enc.minLevel} · Kesilen: ${v.progress.bossKills[r.boss] || 0}`)),
          h('button', { class: 'small danger', disabled: !open || !gateOpen || lvl < enc.minLevel, title: !gateOpen ? 'Önce bölgenin ana görevlerini ilerlet' : '', onclick: () => app.startFarm('boss', r.boss) }, 'Meydan Oku')),
        h('div', { class: 'small muted' }, `Elit: ${r.elites.map((e) => ENEMIES[e].name).join(', ')} · Nadir şampiyon: ${r.champions.map((e) => ENEMIES[e].name).join(', ')}`),
        h('div', { class: 'small muted' }, `Malzemeler: ${[...r.materials, ...r.herbs].map(matName).join(', ')}`),
        v.progress.seals.includes(r.id) ? h('p', { class: 'small gold' }, r.sealFragment) : null);
    });
    return h('div', {}, huntBox, h('div', { class: 'worldmap', style: { marginTop: '8px' } }, regions));
  },

  // ------------------------------------------------------------------ DUNGEONS
  async dungeons(app) {
    const v = app.view;
    const D = DUNGEONS.rotting_roots;
    const unlocked = v.progress.bossKills[D.unlock.boss] > 0;
    const done = v.progress.stats.dungeons || 0;
    return h('div', { class: 'col' },
      h('div', { class: 'region frame' },
        h('h3', {}, D.name, ' ', h('span', { class: 'small muted' }, `Sv ${D.minLevel}+ · Tamamlama: ${done}`)),
        h('p', { class: 'small muted' }, D.desc),
        h('ol', { class: 'small' }, D.stages.map((s) => h('li', {}, s.name, s.boss ? ` — ${ENEMIES[s.boss].name}` : '', s.hazard ? ' (zehirli gaz)' : ''))),
        !unlocked ? h('div', { class: 'danger-text small' }, 'Kilitli: önce Köklerin Efendisi\'ni yen.') : null,
        h('div', { class: 'row' }, Object.entries(D.difficulties).map(([k, d]) => h('button', {
          class: k === 'heroic' ? 'danger' : 'primary', disabled: d.locked || !unlocked || v.character.level < D.minLevel || (k === 'heroic' && !done),
          onclick: () => app.startFarm('dungeon', D.id, k),
        }, `${d.name} (Sv ${d.level})${d.locked ? ' — yakında' : ''}`))),
        h('p', { class: 'small muted' }, 'Sınırsız tekrar · enerji/bilet yok · başarısızlıkta ekipman kaybı yok. Kahraman zorlukta set parçası şansı ve ganimet kalitesi artar. 3 ölümde zindan başarısız olur.')));
  },

  // ------------------------------------------------------------------ CHARACTER
  async character(app, render, sub = 'equip') {
    const v = app.view;
    const c = v.character;
    const head = tabs([['equip', 'Ekipman & Statlar'], ['skills', 'Yetenekler & Otomasyon'], ['tree', 'Uzmanlık Ağaçları'], ['opts', 'Av Ayarları']], sub, (k) => render(k));
    if (sub === 'equip') {
      const st = v.stats;
      const slotCell = (slot) => {
        const it = v.equipped[slot];
        if (!it) return h('div', { class: 'cell' }, h('div', { class: 'slotname' }, SLOT_NAMES[slot]));
        return itemCell(it, { ctx: { setCounts: st.setCounts }, onClick: async () => {
          if (await confirmBox(`${BASE_BY_ID[it.base_id].name} çıkarılsın mı?`, { ok: 'Çıkar' })) { const r = await app.call('unequip', { characterId: c.id, slot }); await afterSessionChange(app, r); render('equip'); }
        } });
      };
      const left = ['head', 'chest', 'gloves', 'legs', 'boots', 'belt'];
      const right = ['mainhand', 'offhand', 'amulet', 'ring1', 'ring2'];
      const stat = (k, v2) => [h('div', { class: 'k' }, k), h('div', {}, v2)];
      return h('div', {}, head, h('div', { class: 'two' },
        h('div', {}, h('div', { class: 'paperdoll' }, h('div', { class: 'side' }, left.map(slotCell)), h('div', { class: 'center' }, heroCanvas(c.cls, c.appearance, v.equipped, 3, 0)), h('div', { class: 'side' }, right.map(slotCell))),
          h('div', { class: 'small muted' }, 'Kuşanmak için Envanter\'de bir eşyaya tıkla. Çıkarmak için yuvaya tıkla.'),
          st.setBonuses.length ? h('div', { class: 'small ok-text' }, 'Aktif set bonusları: ' + st.setBonuses.map((s) => `${SETS[s.split(':')[0]].name} (${s.split(':')[1]})`).join(', ')) : null),
        h('div', {}, h('h3', {}, `${c.name} — ${CLASSES[c.cls].name} Sv ${c.level}`),
          h('div', { class: 'statlist' },
            stat('Maks. Can', fmt(st.maxHp)), stat('Zırh', fmt(st.armor)), stat('Element direnci', pct(st.resist)),
            stat('Silah DPS', st.weaponDps.toLocaleString('tr-TR')), stat('Tahmini DPS', fmt(st.estDps)), stat('Hasar çarpanı', '×' + st.dmgMult.toFixed(2)),
            stat('Saldırı/sn', st.aps.toFixed(2)), stat('Kritik şansı', pct(st.critChance) + (st.critChance >= BALANCE.CAPS.critChance ? ' (üst sınır)' : '')),
            stat('Kritik hasarı', pct(st.critDamage, 0)), stat('Kaçınma', pct(st.evasion)), stat('Blok', pct(st.blockChance)),
            stat('Can çalma', pct(st.lifesteal)), stat('Boss/Elit hasarı', `${pct(st.bossDmg)} / ${pct(st.eliteDmg)}`),
            stat('Element hasarı', pct(st.elemDmg)), stat('XP / Altın / Ganimet', `${pct(st.xpBonus)} / ${pct(st.goldBonus)} / ${pct(st.lootBonus)}`),
            stat('Toplam öldürme', fmt(v.progress.stats.kills || 0)), stat('Ölüm', fmt(v.progress.stats.deaths || 0))),
          h('p', { class: 'small muted' }, 'Kritik (%60), can çalma (%8), saldırı hızı (+%100), kaçınma (%40) ve hasar azaltma (%75) üst sınırlıdır.'))));
    }
    if (sub === 'skills') {
      const lo = v.loadouts[c.activeBuild];
      const draft = { actives: [...lo.actives].concat([null, null, null, null]).slice(0, 4).map((x) => x || ''), passives: [...lo.passives].concat([null, null]).slice(0, 2).map((x) => x || ''), rules: JSON.parse(JSON.stringify(lo.rules || {})) };
      const actives = CLASS_SKILLS[c.cls].actives, passives = CLASS_SKILLS[c.cls].passives;
      const opt = (id) => h('option', { value: id, disabled: SKILLS[id].unlock > c.level }, `${SKILLS[id].name}${SKILLS[id].unlock > c.level ? ` (Sv ${SKILLS[id].unlock})` : ''}`);
      const sel = (arr, i, pool) => h('select', { onchange: (e) => { arr[i] = e.target.value; } }, h('option', { value: '' }, '— boş —'), pool.map((id) => { const o = opt(id); if (arr[i] === id) o.selected = true; return o; }));
      const ruleEditor = (id) => h('div', { class: 'li' }, h('div', { class: 'row' }, skillIcon(id), h('b', {}, SKILLS[id].name), h('span', { class: 'small muted' }, SKILLS[id].desc)),
        h('div', { class: 'row small' }, 'Kullan:', Object.entries(RULES).map(([rk, rn]) => h('label', { class: 'row', style: { color: 'var(--text)', margin: 0 } },
          h('input', { type: 'checkbox', checked: (draft.rules[id] || SKILLS[id].rules).includes(rk), onchange: (e) => {
            const cur = new Set(draft.rules[id] || SKILLS[id].rules);
            if (e.target.checked) cur.add(rk); else cur.delete(rk);
            draft.rules[id] = [...cur];
          } }), rn))));
      return h('div', {}, head,
        h('div', { class: 'row' }, 'Build:', v.loadouts.map((l) => h('button', { class: l.idx === c.activeBuild ? 'primary small' : 'small', onclick: async () => { const r = await app.call('set_active_build', { characterId: c.id, build: l.idx }); await afterSessionChange(app, r); render('skills'); } }, `${l.idx + 1}. ${l.name} (${l.pointsSpent}/${l.pointsTotal})`))),
        h('h3', { style: { marginTop: '8px' } }, 'Aktif yetenekler (öncelik sırası: 1 → 4)'),
        h('div', { class: 'row' }, [0, 1, 2, 3].map((i) => sel(draft.actives, i, actives))),
        h('h3', {}, 'Pasif yetenekler'),
        h('div', { class: 'row' }, [0, 1].map((i) => sel(draft.passives, i, passives))),
        h('div', { class: 'small muted' }, passives.map((id) => `${SKILLS[id].name} (Sv ${SKILLS[id].unlock}): ${SKILLS[id].desc}`).join(' · ')),
        h('h3', { style: { marginTop: '8px' } }, 'Otomasyon koşulları'),
        h('div', { class: 'list' }, actives.filter((id) => SKILLS[id].unlock <= c.level).map(ruleEditor)),
        h('div', { class: 'row', style: { marginTop: '8px' } },
          h('button', { class: 'primary', onclick: async () => {
            const r = await app.call('set_loadout', { characterId: c.id, build: c.activeBuild, actives: draft.actives.map((x) => x || null), passives: draft.passives.map((x) => x || null), rules: draft.rules });
            toast('Build kaydedildi.'); await afterSessionChange(app, r); render('skills');
          } }, 'Kaydet'),
          h('button', { onclick: async () => {
            const name = await promptBox('Build adı', [{ name: 'n', label: 'Ad', value: lo.name }]);
            if (name) { await app.call('set_loadout', { characterId: c.id, build: c.activeBuild, actives: draft.actives.map((x) => x || null), passives: draft.passives.map((x) => x || null), rules: draft.rules, name: name.n }); render('skills'); }
          } }, 'Yeniden adlandır')));
    }
    if (sub === 'tree') {
      const lo = v.loadouts[c.activeBuild];
      const free = lo.pointsTotal - lo.pointsSpent;
      const trees = TREES.filter((t) => t.cls === c.cls);
      return h('div', {}, head,
        h('div', { class: 'row' }, h('b', {}, `Build ${c.activeBuild + 1}: ${free} boş puan`), h('span', { class: 'small muted' }, '(her 2 seviyede 1 puan · Sv 30\'da 15)'),
          h('button', { class: 'small danger', onclick: async () => {
            if (!(await confirmBox(`Ağaç sıfırlansın mı? Maliyet: ${fmt(skillResetCost(c.level))} altın`, { ok: 'Sıfırla', danger: true }))) return;
            const r = await app.call('skill_reset', { characterId: c.id, build: c.activeBuild }); await afterSessionChange(app, r); render('tree');
          } }, 'Sıfırla')),
        h('div', { class: 'tree', style: { marginTop: '8px' } }, trees.map((t) => h('div', {}, h('h3', {}, t.name), h('div', { class: 'small muted' }, t.desc),
          t.nodes.map((n) => {
            const rank = lo.tree[n.id] || 0;
            const locked = n.reqLevel > c.level || (n.req && !(lo.tree[n.req] > 0));
            return h('div', { class: 'node' + (rank ? ' has' : '') + (locked ? ' lock' : ''), onclick: async () => {
              if (locked || free <= 0 || rank >= n.maxRank) return;
              const r = await app.call('skill_alloc', { characterId: c.id, build: c.activeBuild, nodeId: n.id });
              audio.sfx('click'); await afterSessionChange(app, r); render('tree');
            } }, h('div', { class: 'row' }, h('b', { class: 'grow' }, n.name), h('span', {}, `${rank}/${n.maxRank}`)), h('div', { class: 'small muted' }, n.d, n.reqLevel > 30 ? ' (Sv ' + n.reqLevel + ')' : n.reqLevel > c.level ? ` — Sv ${n.reqLevel}` : ''));
          })))));
    }
    // opts
    const lf = c.lootFilter || {};
    const rsel = (val, max) => h('select', {}, h('option', { value: -1 }, 'Kapalı'), RARITIES.slice(0, max + 1).map((r) => h('option', { value: r.id, selected: val === r.id }, `${r.name} ve altı`)));
    const sell = rsel(lf.sellBelow ?? -1, 2), salv = rsel(lf.salvageBelow ?? -1, 3);
    const death = h('select', {}, [['retreat', 'Daha güvenli bölgeye çekil'], ['stop', 'Avı durdur'], ['continue', 'Devam et']].map(([k, l]) => h('option', { value: k, selected: c.deathRule === k }, l)));
    return h('div', {}, head, h('div', { class: 'col', style: { maxWidth: '420px' } },
      h('label', {}, 'Otomatik ganimet filtresi — NPC\'ye sat'), sell,
      h('label', {}, 'Otomatik ganimet filtresi — parçala'), salv,
      h('div', { class: 'small muted' }, 'Benzersiz ve set eşyaları filtreden etkilenmez. Çanta dolarsa eşyalar silinmez, "Kayıp Eşya" kutusuna gider.'),
      h('label', {}, '5 dakika içinde 3 ölümde'), death,
      h('button', { class: 'primary', onclick: async () => { await app.call('set_char_settings', { characterId: c.id, deathRule: death.value, lootFilter: { sellBelow: Number(sell.value), salvageBelow: Number(salv.value) } }); toast('Kaydedildi (bir sonraki ava başlarken uygulanır).'); await app.refreshView(); } }, 'Kaydet')));
  },

  // ------------------------------------------------------------------ INVENTORY
  async inventory(app, render, sub) {
    const v = app.view;
    const c = v.character;
    const state = (PANELS.inventory.state ||= { sort: 'rarity', filter: '', sel: null });
    let items = [...v.bag];
    if (state.filter) items = items.filter((it) => BASE_BY_ID[it.base_id].slot === state.filter || (state.filter === 'mainhand' && FAMILIES[BASE_BY_ID[it.base_id].family].kind === 'weapon'));
    const sorters = { rarity: (a, b) => b.rarity - a.rarity || b.item_level - a.item_level, level: (a, b) => b.item_level - a.item_level, slot: (a, b) => SLOTS.indexOf(slotOf(a)) - SLOTS.indexOf(slotOf(b)) };
    items.sort(sorters[state.sort]);
    const ctx = ctxFor(app);
    const sel = [...v.bag, ...app.boot.overflow].find((x) => x.id === state.sel);
    const grid = h('div', { class: 'grid-items' }, items.map((it) => itemCell(it, { selected: it.id === state.sel, ctx, current: v.equipped[slotOf(it)] || null, onClick: () => { state.sel = it.id; render(); } })));
    const details = sel ? itemActions(app, sel, render, ctx) : h('div', { class: 'muted small' }, 'Bir eşya seç.');
    const overflow = app.boot.overflow.length ? h('div', { class: 'notice', style: { marginTop: '8px' } },
      h('b', {}, `Kayıp Eşya kutusu (${app.boot.overflow.length})`), ' — çanta/depo doluyken gelen eşyalar burada bekler.',
      h('div', { class: 'grid-items', style: { marginTop: '6px' } }, app.boot.overflow.map((it) => itemCell(it, { selected: it.id === state.sel, ctx, onClick: () => { state.sel = it.id; render(); } })))) : null;
    const accMats = app.boot.materials, bound = v.boundMaterials;
    const bulk = async (kind, maxR) => {
      const ids = v.bag.filter((it) => !it.locked && it.rarity <= maxR && it.tradeable !== false && !BASE_BY_ID[it.base_id].unique && !BASE_BY_ID[it.base_id].set).map((x) => x.id).slice(0, 60);
      if (!ids.length) return toast('Uygun eşya yok.');
      if (!(await confirmBox(`${ids.length} eşya ${kind === 'sell_npc' ? 'NPC\'ye satılacak' : 'parçalanacak'} (${RARITIES[maxR].name} ve altı, kilitsiz). Emin misin?`, { ok: 'Onayla', danger: true }))) return;
      const r = await app.call(kind, { itemIds: ids });
      toast(kind === 'sell_npc' ? `+${fmt(r.earned)} altın` : `Malzemeler: ${matList(r.materials)}`); audio.sfx(kind === 'sell_npc' ? 'gold' : 'craft');
      await app.refreshView(); render();
    };
    return h('div', { class: 'two' },
      h('div', {},
        h('div', { class: 'row' }, h('b', {}, `Çanta ${v.bag.length}/${BALANCE.BAG_SLOTS}`),
          h('select', { onchange: (e) => { state.sort = e.target.value; render(); } }, [['rarity', 'Nadirlik'], ['level', 'Seviye'], ['slot', 'Yuva']].map(([k, l]) => h('option', { value: k, selected: state.sort === k }, 'Sırala: ' + l))),
          h('select', { onchange: (e) => { state.filter = e.target.value; render(); } }, h('option', { value: '' }, 'Tüm yuvalar'), SLOTS.filter((s) => !['ring2', 'offhand'].includes(s)).map((s) => h('option', { value: s === 'ring1' ? 'ring' : s, selected: state.filter === (s === 'ring1' ? 'ring' : s) }, s === 'ring1' ? 'Yüzük' : SLOT_NAMES[s])))),
        h('div', { style: { marginTop: '6px' } }, grid),
        h('div', { class: 'row', style: { marginTop: '6px' } },
          h('button', { class: 'small', onclick: () => bulk('sell_npc', 0) }, 'Sıradanları sat'),
          h('button', { class: 'small', onclick: () => bulk('salvage', 1) }, 'Gelişmiş ve altını parçala')),
        overflow,
        h('h3', { style: { marginTop: '10px' } }, 'Malzeme Kasası (hesap)'),
        h('div', { class: 'grid-items' }, Object.entries(accMats).map(([m, n]) => withTooltip(h('div', { class: 'cell' }, matIcon(m), h('span', { class: 'qty' }, n)), () => h('div', {}, h('b', {}, matName(m)), h('div', { class: 'small muted' }, MATERIALS[m].consumable ? 'İksir — Atölye > Simyacı\'dan kullan.' : 'Hesap kasası: tüm karakterler kullanabilir.'))))),
        Object.keys(bound).length ? [h('h3', { style: { marginTop: '8px' } }, 'Karaktere bağlı (offline) malzemeler'),
          h('div', { class: 'grid-items' }, Object.entries(bound).map(([m, n]) => withTooltip(h('div', { class: 'cell' }, matIcon(m), h('span', { class: 'qty' }, n)), () => h('div', {}, h('b', {}, matName(m)), h('div', { class: 'small muted' }, 'Bağlı: yalnızca bu karakterin simya iksirlerinde kullanılabilir.')))))] : null),
      h('div', {}, details));
  },

  // ------------------------------------------------------------------ STASH
  async stash(app, render) {
    const v = app.view;
    const ctx = ctxFor(app);
    const st = (PANELS.stash.state ||= { sel: null });
    const all = [...app.boot.stash, ...v.bag];
    const sel = all.find((x) => x.id === st.sel);
    return h('div', { class: 'two' },
      h('div', {},
        h('h3', {}, `Ortak Depo ${app.boot.stash.length}/${BALANCE.STASH_SLOTS}`),
        h('div', { class: 'small muted' }, 'Hesaptaki tüm karakterler erişir. Eşyanın kimliği, yükseltmesi ve özellikleri aynen korunur.'),
        h('div', { class: 'grid-items', style: { marginTop: '6px' } }, app.boot.stash.map((it) => itemCell(it, { selected: it.id === st.sel, ctx, current: v.equipped[slotOf(it)] || null, onClick: () => { st.sel = it.id; render(); } }))),
        h('h3', { style: { marginTop: '10px' } }, `${v.character.name} çantası ${v.bag.length}/${BALANCE.BAG_SLOTS}`),
        h('div', { class: 'grid-items' }, v.bag.map((it) => itemCell(it, { selected: it.id === st.sel, ctx, onClick: () => { st.sel = it.id; render(); } })))),
      h('div', {}, sel ? itemActions(app, sel, render, ctx) : h('div', { class: 'muted small' }, 'Bir eşya seç.')));
  },

  // ------------------------------------------------------------------ WORKSHOP
  async workshop(app, render, sub = 'smith') {
    const v = app.view;
    const c = v.character;
    const head = tabs([['smith', 'Demirci'], ['enchant', 'Büyü Ustası'], ['alchemy', 'Simyacı']], sub, (k) => render(k));
    const ctx = ctxFor(app);
    const W = (PANELS.workshop.state ||= { sel: null, slot: 'chest', cls: null });
    const pool = [...Object.values(v.equipped), ...v.bag, ...app.boot.stash];
    const sel = pool.find((x) => x.id === W.sel);
    const picker = h('div', { class: 'grid-items' }, pool.map((it) => itemCell(it, { selected: it.id === W.sel, ctx: { setCounts: v.stats.setCounts }, onClick: () => { W.sel = it.id; render(sub); } })));
    const have = app.boot.materials;
    const costLine = (cost) => h('div', { class: 'small' }, `Maliyet: ${fmt(cost.gold)} altın · ${matList(cost.mats || {})}`,
      h('div', { class: Object.entries(cost.mats || {}).every(([m, n]) => (have[m] || 0) >= n) && app.boot.gold >= cost.gold ? 'ok-text' : 'danger-text' },
        `Sende: ${fmt(app.boot.gold)} altın · ${Object.keys(cost.mats || {}).map((m) => `${have[m] || 0} ${matName(m)}`).join(', ')}`));
    if (sub === 'smith') {
      const craftSlots = ['mainhand', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'belt', 'amulet', 'ring'];
      const forCls = W.cls || c.cls;
      const up = sel ? upgradeCost(sel) : null;
      return h('div', {}, head, h('div', { class: 'two' },
        h('div', {},
          h('h3', {}, 'Ekipman Üretimi'),
          h('div', { class: 'row' }, 'Yuva:', h('select', { onchange: (e) => { W.slot = e.target.value; } }, craftSlots.map((s) => h('option', { value: s, selected: W.slot === s }, s === 'ring' ? 'Yüzük' : SLOT_NAMES[s]))),
            'Sınıf:', h('select', { onchange: (e) => { W.cls = e.target.value; } }, Object.values(CLASSES).map((cl) => h('option', { value: cl.id, selected: forCls === cl.id }, cl.name)))),
          h('div', { class: 'list', style: { marginTop: '6px' } }, SMITH_RECIPES.map((r) => h('div', { class: 'li' + (c.level < r.reqLevel ? ' locked' : '') },
            h('div', { class: 'row' }, h('b', { class: 'grow' }, r.name), h('span', { class: 'small muted' }, `Eşya Sv ${r.itemLevel} · Gerekli Sv ${r.reqLevel}`)),
            costLine({ gold: r.gold, mats: r.mats }),
            h('div', { class: 'small muted' }, 'Nadirlik: ' + r.rarityWeights.map((w, i) => (w ? `${RARITIES[i].name} %${w}` : null)).filter(Boolean).join(' · ')),
            h('button', { class: 'small primary', disabled: c.level < r.reqLevel, onclick: async () => {
              const res = await app.call('craft', { recipeId: r.id, characterId: c.id, slot: W.slot, cls: forCls });
              audio.sfx('craft'); toast(`Üretildi: ${BASE_BY_ID[res.item.base_id].name} (${RARITIES[res.item.rarity].name})`);
              await app.refreshView(); W.sel = res.item.id; render('smith');
            } }, 'Üret')))),
          h('p', { class: 'small muted' }, 'Ekipman üretimi yalnızca hesap kasasındaki malzemeleri kullanır; offline (bağlı) malzemeler ticari ekipmana dönüşemez.')),
        h('div', {},
          h('h3', {}, 'Geliştirme (+0 → +10) ve Parçalama'),
          picker,
          sel ? h('div', { style: { marginTop: '8px' } }, itemTooltip(sel, { setCounts: v.stats.setCounts }),
            up ? [costLine(up), h('button', { class: 'primary', onclick: async () => {
              const r = await app.call('upgrade', { itemId: sel.id, characterId: c.id });
              audio.sfx('craft'); toast(`+${r.item.upgrade} başarılı!`); await afterSessionChange(app, r); render('smith');
            } }, `+${sel.upgrade + 1} Geliştir`)] : h('div', { class: 'gold' }, 'Maksimum +10'),
            h('div', { class: 'small muted' }, 'Geliştirme asla başarısız olmaz ve eşya kırılmaz. Temel değer her seviyede +%8 artar.'),
            h('button', { class: 'danger small', style: { marginTop: '6px' }, disabled: sel.locked || ['equipped', 'market'].includes(sel.location), onclick: async () => {
              if (!(await confirmBox(`${BASE_BY_ID[sel.base_id].name} parçalansın mı? Bu işlem geri alınamaz.`, { ok: 'Parçala', danger: true }))) return;
              const r = await app.call('salvage', { itemIds: [sel.id] }); audio.sfx('craft'); toast('Malzemeler: ' + matList(r.materials)); W.sel = null; await app.refreshView(); render('smith');
            } }, sel.locked ? 'Kilitli — parçalanamaz' : 'Parçala')) : h('div', { class: 'small muted' }, 'Geliştirmek için bir eşya seç.'))));
    }
    if (sub === 'enchant') {
      const rc = sel ? reforgeCost(sel) : null, pc = sel ? polishCost(sel) : null;
      return h('div', {}, head, h('div', { class: 'two' },
        h('div', {}, h('h3', {}, 'Eşya seç'), picker),
        h('div', {}, sel ? h('div', {}, itemTooltip(sel, { setCounts: v.stats.setCounts }),
          !sel.affixes.length ? h('p', { class: 'muted' }, 'Bu eşyanın değiştirilecek özelliği yok.') :
            sel.pending_polish ? h('div', { class: 'li', style: { marginTop: '8px' } },
              h('b', {}, 'Cila sonucu'),
              h('div', {}, 'Mevcut: ', affixText(sel.affixes[sel.pending_polish.index])),
              h('div', { class: 'gold' }, 'Yeni: ', affixText(sel.pending_polish.affix)),
              h('div', { class: 'row' },
                h('button', { class: 'primary', onclick: async () => { const r = await app.call('polish_choose', { itemId: sel.id, accept: true }); await afterSessionChange(app, r); render('enchant'); } }, 'Yeniyi al'),
                h('button', { onclick: async () => { const r = await app.call('polish_choose', { itemId: sel.id, accept: false }); await afterSessionChange(app, r); render('enchant'); } }, 'Eskisini koru')))
              : h('div', { class: 'list', style: { marginTop: '8px' } }, sel.affixes.map((a, i) => h('div', { class: 'li' },
                h('div', { class: 'aff' }, affixText(a), h('span', { class: 'muted small' }, ` (${Math.round(a.q * 100)}%)`)),
                h('div', { class: 'row' },
                  h('button', { class: 'small', disabled: sel.location === 'market', onclick: async () => {
                    if (!(await confirmBox(`Reforge: "${AFFIX_BY_ID[a.id].name}" rastgele başka bir özellikle değiştirilecek. Diğer özellikler korunur. Maliyet: ${fmt(rc.gold)} altın, ${matList(rc.mats)}`, { ok: 'Reforge' }))) return;
                    const r = await app.call('reforge', { itemId: sel.id, index: i }); audio.sfx('craft'); toast(`Yeni özellik: ${affixText(r.affix)}`); await afterSessionChange(app, r); render('enchant');
                  } }, 'Reforge'),
                  h('button', { class: 'small', disabled: sel.location === 'market', onclick: async () => {
                    await app.call('polish', { itemId: sel.id, index: i }); audio.sfx('craft'); await app.refreshView(); render('enchant');
                  } }, 'Cila (Polish)'))))),
          rc ? h('div', { class: 'small muted', style: { marginTop: '6px' } }, `Reforge: ${fmt(rc.gold)} altın + ${matList(rc.mats)} · Cila: ${fmt(pc.gold)} altın + ${matList(pc.mats)} — her denemede maliyet artar.`) : null)
          : h('div', { class: 'small muted' }, 'Bir eşya seç.'))));
    }
    // alchemy
    const bound = v.boundMaterials;
    const elixirs = Object.entries(MATERIALS).filter(([, m]) => m.consumable);
    return h('div', {}, head, h('div', { class: 'two' },
      h('div', {}, h('h3', {}, 'İksir Tarifleri'),
        h('div', { class: 'list' }, ALCHEMY_RECIPES.map((r) => h('div', { class: 'li' },
          h('div', { class: 'row' }, matIcon(r.output), h('b', { class: 'grow' }, r.name), h('span', { class: 'small muted' }, MATERIALS[r.output].buff ? `+${pct(MATERIALS[r.output].buff.value, 0)} · ${MATERIALS[r.output].buff.durationS / 60} dk aktif av` : '')),
          h('div', { class: 'small' }, `${fmt(r.gold)} altın · ${Object.entries(r.mats).map(([m, n]) => `${n} ${matName(m)} (sende ${(app.boot.materials[m] || 0)} + bağlı ${(bound[m] || 0)})`).join(', ')}`),
          h('button', { class: 'small primary', onclick: async () => { const res = await app.call('brew', { recipeId: r.id, characterId: c.id }); audio.sfx('craft'); toast(`${MATERIALS[res.output].name} hazır${res.bound ? ' (karaktere bağlı)' : ''}.`); await app.refreshView(); render('alchemy'); } }, 'Demle')))),
        h('p', { class: 'small muted' }, 'Simya önce karaktere bağlı (offline) malzemeleri kullanır; bu durumda iksir de karaktere bağlı olur.')),
      h('div', {}, h('h3', {}, 'İksirlerin'),
        h('div', { class: 'list' }, elixirs.map(([id, m]) => {
          const n = (app.boot.materials[id] || 0) + (bound[id] || 0);
          return h('div', { class: 'li' }, h('div', { class: 'row' }, matIcon(id), h('b', { class: 'grow' }, m.name), `×${n}`),
            h('button', { class: 'small', disabled: !n, onclick: async () => { const r = await app.call('use_elixir', { characterId: c.id, elixirId: id }); toast(`${m.name} etkin.`); audio.sfx('heal'); await afterSessionChange(app, r); render('alchemy'); } }, 'Kullan'));
        })),
        h('div', { class: 'small muted', style: { marginTop: '6px' } }, 'Aktif: ' + ((c.buffs || []).map((b) => `${MATERIALS[b.id].name} ${Math.ceil(b.remaining / 60)} dk`).join(', ') || 'yok')))));
  },

  // ------------------------------------------------------------------ QUESTS
  async quests(app, render, sub = 'main') {
    const v = app.view;
    const c = v.character;
    const head = tabs([['main', 'Ana Görevler'], ['contracts', 'Kontratlar'], ['weekly', 'Haftalık & Günlük'], ['ach', 'Başarımlar']], sub, (k) => render(k));
    const bar = (p, t) => h('div', { class: 'progress' }, h('i', { style: { width: Math.min(100, (p / t) * 100) + '%' } }));
    if (sub === 'main') {
      const mine = new Map(v.quests.filter((q) => q.kind === 'main').map((q) => [q.id, q]));
      return h('div', {}, head, h('div', { class: 'list' }, MAIN_QUESTS.map((mq) => {
        const q = mine.get(mq.id);
        if (!q) return h('div', { class: 'li locked' }, h('b', {}, `${REGION_BY_ID[mq.region].name} — ???`));
        return h('div', { class: 'li' + (q.state === 'complete' ? ' done' : '') },
          h('div', { class: 'row' }, h('b', { class: 'grow' }, mq.name), h('span', { class: 'small muted' }, REGION_BY_ID[mq.region].name)),
          h('div', { class: 'small muted' }, mq.text),
          h('div', { class: 'small' }, `${q.progress}/${q.target} · Ödül: ${fmt(mq.reward.xp)} XP, ${fmt(mq.reward.gold)} altın${mq.reward.seal ? ', Mühür Parçası' : ''}`),
          bar(q.progress, q.target),
          q.state === 'complete' ? h('button', { class: 'small primary', onclick: async () => { await app.call('quest_claim', { characterId: c.id, questId: q.id }); audio.sfx('rare'); await app.refreshView(); render('main'); } }, 'Ödülü Al') : null,
          q.state === 'claimed' ? h('span', { class: 'small ok-text' }, '✓ Tamamlandı') : null);
      })));
    }
    if (sub === 'contracts') {
      const active = v.quests.filter((q) => q.kind === 'contract');
      return h('div', {}, head, h('div', { class: 'two' },
        h('div', {}, h('h3', {}, 'Pano (yenilenir)'), h('div', { class: 'list' }, (v.progress.contractOffers || []).map((o, i) => h('div', { class: 'li' },
          h('b', {}, o.name), h('div', { class: 'small' }, `Hedef: ${o.count} · Ödül: ${fmt(o.reward.gold)} altın, ${fmt(o.reward.xp)} XP, ${matList(o.reward.mats)}`),
          h('button', { class: 'small primary', disabled: active.length >= 3, onclick: async () => { await app.call('contract_accept', { characterId: c.id, index: i }); await app.refreshView(); render('contracts'); } }, 'Kabul Et'))))),
        h('div', {}, h('h3', {}, `Aktif kontratlar ${active.length}/3`), h('div', { class: 'list' }, active.map((q) => h('div', { class: 'li' + (q.state === 'complete' ? ' done' : '') },
          h('b', {}, q.data.name), h('div', { class: 'small' }, `${q.progress}/${q.target}`), bar(q.progress, q.target),
          h('div', { class: 'row' },
            q.state === 'complete' ? h('button', { class: 'small primary', onclick: async () => { await app.call('contract_claim', { characterId: c.id, questId: q.id }); audio.sfx('gold'); await app.refreshView(); render('contracts'); } }, 'Ödülü Al') : null,
            h('button', { class: 'small ghost', onclick: async () => { if (await confirmBox('Kontrattan vazgeçilsin mi?')) { await app.call('contract_abandon', { characterId: c.id, questId: q.id }); await app.refreshView(); render('contracts'); } } }, 'Vazgeç'))))))));
    }
    if (sub === 'weekly') {
      const wk = app.boot.weekly;
      return h('div', {}, head,
        h('div', { class: 'li' }, h('b', {}, `Günlük özel av hakları: ${app.boot.profile.dailyHunts}/${BALANCE.DAILY_HUNT_MAX}`),
          h('div', { class: 'small muted' }, 'Her gün 1 hak birikir (en fazla 7). Kaçırılan gün kaybolmaz; seri veya zorunlu giriş yok. Dünya haritasında bir bölgeyi avlarken kullan: nadir şampiyon çağırır.')),
        h('h3', { style: { marginTop: '8px' } }, `Haftalık Büyük Av (${wk.period}) — hesap geneli`),
        h('div', { class: 'list' }, wk.hunts.map((w) => {
          const def = WEEKLY_HUNTS.find((x) => x.id === w.id);
          return h('div', { class: 'li' + (w.progress >= w.target ? ' done' : '') }, h('b', {}, def.name), h('div', { class: 'small' }, `${fmt(w.progress)}/${fmt(w.target)} · Ödül: 2.500 altın, 3 Mistik Öz, 1 Boşluk Kristali`), bar(w.progress, w.target),
            w.claimed ? h('span', { class: 'small ok-text' }, '✓ Alındı') : h('button', { class: 'small primary', disabled: w.progress < w.target, onclick: async () => { await app.call('weekly_claim', { huntId: w.id }); audio.sfx('rare'); await app.refreshView(); render('weekly'); } }, 'Ödülü Al'));
        })));
    }
    const got = new Map(app.boot.achievements.map((a) => [a.id, a]));
    const stats = app.boot.profile.stats || {};
    return h('div', {}, head, h('div', { class: 'list' }, ACHIEVEMENTS.map((a) => {
      const g = got.get(a.id);
      const prog = Math.min(a.target, stats[a.stat] || 0);
      return h('div', { class: 'li' + (g ? ' done' : '') }, h('div', { class: 'row' }, h('b', { class: 'grow' }, a.name), h('span', { class: 'small gold' }, `${fmt(a.gold)} altın`)),
        h('div', { class: 'small muted' }, a.desc), !g && stats[a.stat] != null ? bar(prog, a.target) : null,
        g ? (g.claimed ? h('span', { class: 'small ok-text' }, '✓ Ödül alındı') : h('button', { class: 'small primary', onclick: async () => { await app.call('achievement_claim', { achievementId: a.id }); audio.sfx('gold'); await app.refreshView(); render('ach'); } }, 'Ödülü Al')) : null);
    })));
  },

  // ------------------------------------------------------------------ MARKET (real players)
  async market(app, render, sub = 'browse') {
    if (!app.api.marketEnabled) {
      return h('div', { class: 'notice' }, h('h3', {}, 'Gerçek oyuncu pazarı bu modda kapalı'),
        h('p', {}, 'Sandbox (çevrimdışı antrenman) modunda yalnızca sen varsın; sahte NPC ilanlarıyla pazar taklidi yapılmaz.'),
        h('p', {}, 'Gerçek pazar için: Supabase yapılandırılmış "Çevrimiçi" mod ya da "Yerel Sunucu" modu (npm run server) ile iki ayrı hesap kullan.'));
    }
    const head = tabs([['browse', 'İlanlar'], ['sell', 'Satışa Koy'], ['mine', 'İlanlarım & Geçmiş'], ['notes', 'Bildirimler']], sub, (k) => render(k));
    const F = (PANELS.market.filters ||= { cls: '', rarity: '', minLevel: '', maxLevel: '', slot: '', affix: '', maxPrice: '', sort: 'new', page: 0 });
    if (sub === 'browse') {
      const res = await app.call('market_search', F);
      const inp = (k, ph, type = 'number') => h('input', { type, placeholder: ph, value: F[k], style: { width: '90px' }, onchange: (e) => { F[k] = e.target.value; } });
      const ctx = ctxFor(app);
      return h('div', {}, head,
        h('div', { class: 'row small' },
          h('select', { onchange: (e) => { F.cls = e.target.value; } }, h('option', { value: '' }, 'Tüm sınıflar'), Object.values(CLASSES).map((c) => h('option', { value: c.id, selected: F.cls === c.id }, c.name))),
          h('select', { onchange: (e) => { F.rarity = e.target.value; } }, h('option', { value: '' }, 'Her nadirlik'), RARITIES.map((r) => h('option', { value: r.id, selected: String(F.rarity) === String(r.id) }, r.name + '+'))),
          h('select', { onchange: (e) => { F.slot = e.target.value; } }, h('option', { value: '' }, 'Her yuva'), ['mainhand', 'offhand', 'head', 'chest', 'gloves', 'legs', 'boots', 'belt', 'amulet', 'ring'].map((s) => h('option', { value: s, selected: F.slot === s }, s === 'ring' ? 'Yüzük' : SLOT_NAMES[s]))),
          h('select', { onchange: (e) => { F.affix = e.target.value; } }, h('option', { value: '' }, 'Her özellik'), AFFIXES.map((a) => h('option', { value: a.id, selected: F.affix === a.id }, a.name))),
          inp('minLevel', 'min Sv'), inp('maxLevel', 'max Sv'), inp('maxPrice', 'max fiyat'),
          h('select', { onchange: (e) => { F.sort = e.target.value; } }, [['new', 'En yeni'], ['price_asc', 'Fiyat ↑'], ['price_desc', 'Fiyat ↓'], ['level_desc', 'Seviye ↓'], ['rarity_desc', 'Nadirlik ↓']].map(([k, l]) => h('option', { value: k, selected: F.sort === k }, l))),
          h('button', { class: 'small primary', onclick: () => { F.page = 0; render('browse'); } }, 'Ara')),
        h('table', { class: 'table', style: { marginTop: '6px' } },
          h('tr', {}, h('th', {}, ''), h('th', {}, 'Eşya'), h('th', {}, 'Sv'), h('th', {}, 'Satıcı'), h('th', {}, 'Fiyat'), h('th', {}, 'Bitiş'), h('th', {}, '')),
          res.listings.map((l) => h('tr', {},
            h('td', {}, itemCell({ ...l.item, tradeable: true }, { ctx, current: app.view.equipped[slotOf(l.item)] || null })),
            h('td', { class: 'r' + l.item.rarity }, BASE_BY_ID[l.item.base_id]?.name + (l.item.upgrade ? ` +${l.item.upgrade}` : '')),
            h('td', {}, l.item.item_level), h('td', {}, l.seller), h('td', { class: 'gold' }, fmt(l.price)),
            h('td', { class: 'small muted' }, new Date(l.expiresAt).toLocaleString('tr-TR')),
            h('td', {}, l.sellerUser === app.boot.profile.userId ? h('span', { class: 'small muted' }, 'Senin') : h('button', { class: 'small primary', onclick: async () => {
              if (!(await confirmBox(`${BASE_BY_ID[l.item.base_id].name} için ${fmt(l.price)} altın ödenecek. Eşya ortak depona gelecek. Onaylıyor musun?`, { ok: 'Satın Al' }))) return;
              await app.call('market_buy', { listingId: l.id }); audio.sfx('market'); toast('Satın alındı! Eşya ortak depoda.'); await app.refreshView(); render('browse');
            } }, 'Satın Al'))))),
        !res.listings.length ? h('p', { class: 'muted' }, 'Bu filtrelere uygun ilan yok.') : null,
        h('div', { class: 'row' }, h('button', { class: 'small', disabled: !F.page, onclick: () => { F.page--; render('browse'); } }, '‹'), h('span', { class: 'small' }, `Sayfa ${F.page + 1}`), h('button', { class: 'small', disabled: res.listings.length < 30, onclick: () => { F.page++; render('browse'); } }, '›')));
    }
    if (sub === 'sell') {
      const sellable = [...app.view.bag, ...app.boot.stash, ...app.boot.overflow].filter((x) => x.tradeable !== false && !x.bound_character);
      const S = (PANELS.market.sellSel ||= { id: null });
      const sel = sellable.find((x) => x.id === S.id);
      return h('div', {}, head, h('div', { class: 'two' },
        h('div', {}, h('div', { class: 'small muted' }, 'Ticarete açık eşyaların (çanta, depo, kayıp eşya). Kuşanılmış eşyaları önce çıkar.'),
          h('div', { class: 'grid-items', style: { marginTop: '6px' } }, sellable.map((it) => itemCell(it, { selected: it.id === S.id, ctx: {}, onClick: () => { S.id = it.id; render('sell'); } })))),
        h('div', {}, sel ? h('div', {}, itemTooltip(sel, {}),
          h('button', { class: 'primary', style: { marginTop: '8px' }, disabled: sel.locked, onclick: () => listItem(app, sel, () => render('mine')) }, sel.locked ? 'Kilitli — önce kilidi aç' : 'Pazara Koy'))
          : h('p', { class: 'muted small' }, `Kurallar: hesap başına en fazla ${BALANCE.MARKET_MAX_ACTIVE} aktif ilan · süre 12/24/48 saat · açılış ücreti %2 (iade edilmez) · satış komisyonu %5 · sabit fiyat.`))));
    }
    if (sub === 'mine') {
      const r = await app.call('market_history');
      const row = (l, mine) => h('tr', {}, h('td', { class: 'r' + l.item.rarity }, BASE_BY_ID[l.item.base_id]?.name + (l.item.upgrade ? ` +${l.item.upgrade}` : '')), h('td', { class: 'gold' }, fmt(l.price)),
        h('td', {}, { active: 'Aktif', sold: 'Satıldı', cancelled: 'İptal', expired: 'Süresi doldu' }[l.status]), h('td', { class: 'small muted' }, new Date(l.closedAt || l.createdAt).toLocaleString('tr-TR')),
        h('td', {}, mine && l.status === 'active' ? h('button', { class: 'small danger', onclick: async () => {
          if (!(await confirmBox('İlan iptal edilsin mi? Açılış ücreti iade edilmez; eşya ortak depona döner.', { ok: 'İptal Et', danger: true }))) return;
          await app.call('market_cancel', { listingId: l.id }); await app.refreshView(); render('mine');
        } }, 'İptal') : null));
      return h('div', {}, head, h('h3', {}, 'İlanlarım'), h('table', { class: 'table' }, r.myListings.map((l) => row(l, true))),
        h('h3', { style: { marginTop: '10px' } }, 'Satın aldıklarım'), h('table', { class: 'table' }, r.purchases.map((l) => row(l, false))));
    }
    await app.call('notifications_read');
    return h('div', {}, head, h('div', { class: 'list' }, app.boot.notifications.map((n) => h('div', { class: 'li' },
      n.kind === 'market_sold' ? `Satış: ${BASE_BY_ID[n.payload.base_id]?.name} → ${n.payload.buyer}, ${fmt(n.payload.price)} altın (komisyon sonrası ${fmt(n.payload.net)})`
        : n.kind === 'market_expired' ? `Süresi doldu: ${BASE_BY_ID[n.payload.base_id]?.name} ortak depona döndü.` : n.kind,
      h('div', { class: 'small muted' }, new Date(n.at).toLocaleString('tr-TR'))))));
  },

  // ------------------------------------------------------------------ COLLECTION
  async collection(app, render, sub = 'bestiary') {
    const col = await app.call('collection');
    const disc = (kind) => new Map(col.discoveries.filter((d) => d.kind === kind).map((d) => [d.id, d.count]));
    const head = tabs([['bestiary', 'Canavar Ansiklopedisi'], ['uniques', 'Benzersiz & Set Kataloğu'], ['bosses', 'Boss Sayacı'], ['stats', 'İstatistikler & Mühürler']], sub, (k) => render(k));
    if (sub === 'bestiary') {
      const seen = disc('enemy');
      return h('div', {}, head, h('table', { class: 'table' }, h('tr', {}, h('th', {}, 'Yaratık'), h('th', {}, 'Tür'), h('th', {}, 'Davranış'), h('th', {}, 'Öldürülen')),
        Object.values(ENEMIES).map((e) => {
          const n = seen.get(e.id) || disc('boss').get(e.id);
          return h('tr', {}, h('td', {}, n ? e.name : '???'), h('td', {}, { normal: 'Normal', elite: 'Elit', champion: 'Nadir Şampiyon', boss: 'Boss' }[e.tier]), h('td', { class: 'small muted' }, n ? e.behavior : '—'), h('td', {}, n ? fmt(n) : '0'));
        })));
    }
    if (sub === 'uniques') {
      const seen = new Map([...disc('unique'), ...disc('set')]);
      const wl = new Set(col.wishlist);
      const list = [...UNIQUE_BASES, ...BASES.filter((b) => b.set)];
      return h('div', {}, head, h('div', { class: 'list' }, list.map((b) => {
        const s = UNIQUE_SOURCES[b.unique];
        const src = b.unique ? [...(s?.bosses || []).map((x) => ENEMIES[x].name), ...(s?.regions || []).map((x) => REGION_BY_ID[x].name), ...(s?.champions || []).map((x) => ENEMIES[x].name)].join(', ') : 'Çürük Yürek (zindan), Ocak Bekçisi, Demir İnfazcı · Sv 18+';
        return h('div', { class: 'li' }, h('div', { class: 'row' }, itemIcon(b.id), h('b', { class: 'grow ' + (seen.get(b.id) ? 'r' + (b.fixedRarity ?? 4) : 'muted') }, b.name), seen.get(b.id) ? h('span', { class: 'small ok-text' }, 'Keşfedildi') : h('span', { class: 'small muted' }, 'Keşfedilmedi'),
          h('button', { class: 'small' + (wl.has(b.id) ? ' primary' : ''), onclick: async () => { await app.call('wishlist_toggle', { baseId: b.id }); render('uniques'); } }, wl.has(b.id) ? '★ Hedefte' : '☆ Hedefe ekle')),
          h('div', { class: 'small uniq', style: { color: 'var(--r4)' } }, b.uniqueText || SETS[b.set]?.bonus4.text), h('div', { class: 'small muted' }, 'Kaynak: ' + src));
      })));
    }
    if (sub === 'bosses') {
      return h('div', {}, head, h('table', { class: 'table' }, h('tr', {}, h('th', {}, 'Karakter'), ...Object.keys(BOSS_ENCOUNTERS).map((b) => h('th', {}, ENEMIES[b].name)), h('th', {}, 'Çürük Yürek')),
        col.characters.map((c) => h('tr', {}, h('td', {}, c.name), ...Object.keys(BOSS_ENCOUNTERS).map((b) => h('td', {}, c.bossKills[b] || 0)), h('td', {}, c.bossKills.rot_heart || 0)))));
    }
    const st = app.boot.profile.stats || {};
    return h('div', {}, head, h('div', { class: 'two' },
      h('div', { class: 'statlist' }, ...[['Toplam öldürme', st.kills], ['Elit', st.elites], ['Şampiyon', st.champions], ['Boss', st.bosses], ['Efsanevi bulunan', st.legendaries], ['Parçalanan', st.salvaged], ['Üretilen', st.crafted], ['Reforge', st.reforges], ['Pazar satışı', st.market_sales], ['Pazar alımı', st.market_buys]].flatMap(([k, v]) => [h('div', { class: 'k' }, k), h('div', {}, fmt(v || 0))]),
        ...col.characters.flatMap((c) => [h('div', { class: 'k' }, `${c.name} av süresi`), h('div', {}, `${Math.round((c.stats.seconds || 0) / 60)} dk`)])),
      h('div', {}, h('h3', {}, 'Mühür Parçaları'), ...col.characters.flatMap((c) => c.seals.map((s) => h('p', { class: 'small gold' }, `${c.name}: ${REGION_BY_ID[s].sealFragment}`))),
        !col.characters.some((c) => c.seals.length) ? h('p', { class: 'small muted' }, 'Henüz mühür parçası yok. Bölge bosslarını yenip ana görevleri tamamla.') : null)));
  },

  // ------------------------------------------------------------------ SETTINGS
  async settings(app, render) {
    const s = app.settings;
    const save = () => { try { localStorage.setItem('varneth.settings', JSON.stringify(s)); } catch { /* ignore */ } audio.setVolumes(s); };
    const slider = (k, label) => h('div', {}, h('label', {}, `${label}: ${Math.round(s[k] * 100)}%`), h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s[k], oninput: (e) => { s[k] = Number(e.target.value); e.target.previousSibling.textContent = `${label}: ${Math.round(s[k] * 100)}%`; save(); } }));
    const choice = (k, label, opts) => h('div', {}, h('label', {}, label), h('select', { onchange: (e) => { s[k] = e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value; save(); } }, opts.map(([v, l]) => h('option', { value: String(v), selected: String(s[k]) === String(v) }, l))));
    return h('div', { class: 'two' },
      h('div', { class: 'col' }, h('h3', {}, 'Ses'), slider('music', 'Müzik'), slider('sfx', 'Savaş sesleri'), slider('ui', 'Bildirim sesleri'),
        choice('muted', 'Tamamen sessiz', [[false, 'Hayır'], [true, 'Evet']]),
        h('h3', {}, 'Görüntü'), choice('fx', 'Efekt yoğunluğu', [['high', 'Yüksek'], ['medium', 'Orta'], ['low', 'Düşük']]),
        choice('shake', 'Ekran sarsıntısı', [[true, 'Açık'], [false, 'Kapalı']]),
        choice('numbers', 'Hasar sayıları', [['all', 'Hepsi'], ['crits', 'Sadece kritik'], ['none', 'Kapalı']]),
        choice('lang', 'Dil / Language', [['tr', 'Türkçe'], ['en', 'English (kısmi)']])),
      h('div', { class: 'col' }, h('h3', {}, 'Hesap'),
        h('div', { class: 'small' }, 'Mod: ', app.modeBadge(), ` · ${app.boot.profile.displayName}`),
        h('button', { onclick: async () => { if (app.farm?.active) await app.farm.stop().catch(() => {}); app.boot = await app.call('bootstrap'); app.charSelect(); } }, 'Karakter Değiştir'),
        h('button', { class: 'danger', onclick: async () => { if (app.farm?.active) await app.farm.stop().catch(() => {}); await app.api.logout(); app.api = null; app.loginScreen(); } }, 'Çıkış Yap'),
        h('p', { class: 'small muted' }, 'VARNETH Alpha 0.1 — The First Hunt. Tüm grafikler ve sesler bu proje için prosedürel olarak üretilmiştir.')));
  },
};

async function listItem(app, item, after) {
  const r = await promptBox(`${BASE_BY_ID[item.base_id].name} pazara konacak. Eşya satılana veya süre bitene kadar emanette tutulur.`, [
    { name: 'price', label: 'Fiyat (altın)', type: 'number', min: 10, value: Math.max(10, npcSellValue(item) * 3),
      onInput: (inp) => { const p = Number(inp.price.value) || 0; const f = marketFees(p); const el = document.getElementById('hint-price'); if (el) el.textContent = `Açılış ücreti: ${fmt(f.listingFee)} · Satışta komisyon: ${fmt(f.commission)} · Eline geçecek: ${fmt(p - f.commission)}`; },
      hint: ' ' },
    { name: 'hours', label: 'Süre', options: BALANCE.MARKET_DURATIONS_H.map((x) => ({ value: String(x), label: `${x} saat` })), value: '24' },
  ], { ok: 'İlan Aç' });
  if (!r) return;
  await app.call('market_list', { itemId: item.id, price: Number(r.price), hours: Number(r.hours) });
  audio.sfx('market');
  toast('İlan açıldı.');
  await app.refreshView();
  after?.();
}

function itemActions(app, it, render, ctx) {
  const v = app.view;
  const b = BASE_BY_ID[it.base_id];
  const c = v.character;
  const canEquip = baseAllowedForClass(b, c.cls) && c.level >= reqLevel(it) && (!it.bound_character || it.bound_character === c.id);
  const btns = [];
  if (['bag', 'stash'].includes(it.location)) {
    btns.push(h('button', { class: 'primary', disabled: !canEquip, onclick: async () => {
      let slot;
      if (b.slot === 'ring') slot = v.equipped.ring1 ? (v.equipped.ring2 ? 'ring1' : 'ring2') : 'ring1';
      const r = await app.call('equip', { characterId: c.id, itemId: it.id, slot });
      audio.sfx('item'); if (r.session && app.farm?.active) app.farm.resync(r.session);
      await app.refreshView(); render();
    } }, canEquip ? 'Kuşan' : 'Kuşanamaz'));
    if (FAMILIES[b.family].offhandOk && b.classes?.includes(c.cls)) btns.push(h('button', { disabled: !canEquip, onclick: async () => { const r = await app.call('equip', { characterId: c.id, itemId: it.id, slot: 'offhand' }); if (r.session && app.farm?.active) app.farm.resync(r.session); await app.refreshView(); render(); } }, 'İkinci ele kuşan'));
  }
  if (it.location === 'bag') btns.push(h('button', { disabled: !!it.bound_character, onclick: async () => { await app.call('move_item', { itemId: it.id, to: 'stash' }); await app.refreshView(); render(); } }, 'Depoya Gönder'));
  if (['stash', 'overflow'].includes(it.location)) btns.push(h('button', { onclick: async () => { await app.call('move_item', { itemId: it.id, to: 'bag', characterId: c.id }); await app.refreshView(); render(); } }, 'Çantaya Al'));
  if (it.location === 'overflow') btns.push(h('button', { onclick: async () => { await app.call('move_item', { itemId: it.id, to: 'stash' }); await app.refreshView(); render(); } }, 'Depoya Gönder'));
  btns.push(h('button', { onclick: async () => { await app.call('lock_item', { itemId: it.id, locked: !it.locked }); await app.refreshView(); render(); } }, it.locked ? 'Kilidi Aç' : 'Kilitle'));
  btns.push(h('button', { disabled: it.locked, onclick: async () => {
    if (!(await confirmBox(`${b.name} NPC'ye ${fmt(npcSellValue(it))} altına satılsın mı? ${it.rarity >= 3 ? 'DİKKAT: Bu değerli bir eşya!' : ''}`, { ok: 'Sat', danger: it.rarity >= 2 }))) return;
    await app.call('sell_npc', { itemIds: [it.id] }); audio.sfx('gold'); await app.refreshView(); render();
  } }, `NPC'ye Sat (${fmt(npcSellValue(it))})`));
  btns.push(h('button', { disabled: it.locked, class: 'danger', onclick: async () => {
    if (!(await confirmBox(`${b.name} parçalansın mı?`, { ok: 'Parçala', danger: true }))) return;
    const r = await app.call('salvage', { itemIds: [it.id] }); audio.sfx('craft'); toast('Malzemeler: ' + matList(r.materials)); await app.refreshView(); render();
  } }, 'Parçala'));
  if (app.api.marketEnabled && it.tradeable !== false) btns.push(h('button', { disabled: it.locked, onclick: () => listItem(app, it, render) }, 'Pazara Koy'));
  btns.push(h('button', { class: 'ghost', onclick: () => { PANELS.workshop.state = { ...(PANELS.workshop.state || {}), sel: it.id }; openPanel(app, 'workshop', 'smith'); } }, 'Atölyede Aç'));
  const cur = v.equipped[slotOf(it)];
  return h('div', {}, compareTooltip(it, cur || null, ctx), h('div', { class: 'row', style: { marginTop: '8px' } }, btns));
}
