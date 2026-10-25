// Eşya kartı: temel/sabit/rastgele bonuslar, legendary etkisi, dayanıklılık, karşılaştırma ve işlemler.
import { h, img, pct, fmt } from '../dom.js';
import { ui } from '../ui.js';
import { app } from '../../core/app.js';
import { iconURL } from '../../art/icons.js';
import { ITEMS, isUpgradeable } from '../../data/items.js';
import { STACKABLES } from '../../data/materials.js';
import { RARITY_INFO, SLOT_NAMES, SPECIES } from '../../data/constants.js';
import { BONUS_TYPES } from '../../data/loot.js';
import { CLASSES } from '../../data/classes.js';
import { itemBaseValues, computeStats, statsWithItem, COMPARE_KEYS } from '../../systems/stats.js';
import { itemSellPrice, dismantleOutput } from '../../systems/economy.js';
import { canEquip } from '../../systems/inventory.js';
import { act } from '../actions.js';

const EFFECTS = {
  crimson_strike: 'Kızıl Darbe: Normal vuruşta %10 şansla ek ateş hasarı (8 sn iç bekleme).',
  spirit_echo: 'Ruh Yankısı: Aktif hasar büyüsünde %8 şansla ek büyü hasarı (10 sn iç bekleme).',
};

export function bonusText(b) {
  const bt = BONUS_TYPES[b.t];
  if (b.t === 'species') return `+%${Math.round(b.v * 100)} ${SPECIES[b.s]} türüne hasar`;
  return bt.fmt === 'pct' ? `+%${Math.round(b.v * 100)} ${bt.name}` : `+${b.v} ${bt.name}`;
}

const FIXED_NAMES = { hp: 'HP', mp: 'MP', str: 'STR', dex: 'DEX', int: 'INT', vit: 'VIT', crit: 'Kritik şansı', poisonRes: 'Zehir direnci' };
const fixedText = (k, v) => (k === 'crit' || k === 'poisonRes' ? `+%${Math.round(v * 100)} ${FIXED_NAMES[k]}` : `+${v} ${FIXED_NAMES[k]}`);

export function itemInfo(inst) {
  if (inst.q !== undefined) {
    const s = STACKABLES[inst.tid];
    return h('div', { class: 'icard' },
      h('div', { class: 'hd' }, img(iconURL(inst.tid)), h('div', {}, h('div', { class: 'nm' }, s.name), h('div', { class: 'muted small' }, { potion: 'İksir', usable: 'Kullanım eşyası', quest: 'Görev eşyası' }[s.cat] || 'Materyal', ` · ${inst.q} adet`))),
      h('p', { class: 'small' }, s.desc || ''),
      h('div', { class: 'small muted' }, `Satış: ${s.sell} Gold / adet`));
  }
  const t = ITEMS[inst.tid];
  const b = itemBaseValues(inst);
  const lines = [];
  if (b.atkMin !== undefined) lines.push(`Saldırı ${fmt(b.atkMin)}–${fmt(b.atkMax)}${inst.p ? ` (+%${inst.p * 6})` : ''}`);
  if (b.magMin !== undefined) lines.push(`Büyü gücü ${fmt(b.magMin)}–${fmt(b.magMax)}${inst.p ? ` (+%${inst.p * 6})` : ''}`);
  if (b.mag !== undefined) lines.push(`+${Math.round(b.mag)} büyü gücü`);
  if (b.def !== undefined) lines.push(`+${Math.round(b.def)} DEF`);
  if (b.mdef !== undefined) lines.push(`+${Math.round(b.mdef)} MDEF`);
  const fixed = Object.entries({ ...t.fixed, ...(t.legendaryFixed || {}) }).map(([k, v]) => fixedText(k, v));
  const cls = t.cls === 'any' ? 'Her sınıf' : CLASSES[t.cls].name;
  const lvOk = app.char.level >= t.lv;
  return h('div', { class: 'icard' },
    h('div', { class: 'hd' }, img(iconURL(inst.tid)),
      h('div', {},
        h('div', { class: 'nm r-' + inst.r }, `${t.name}${inst.p ? ` +${inst.p}` : ''}`),
        h('div', { class: 'small' }, h('span', { class: 'r-' + inst.r }, RARITY_INFO[inst.r].name), ` · ${SLOT_NAMES[t.slot]}${t.slot === 'weapon' ? (t.hand === 'two' ? ' (çift el)' : ' (tek el)') : ''}`),
        h('div', { class: 'small ' + (lvOk ? 'muted' : 'bad') }, `Seviye ${t.lv} · ${cls}`))),
    h('ul', {}, lines.map((l) => h('li', {}, l)), fixed.map((l) => h('li', { class: 'gold' }, l)), (inst.b || []).map((bn) => h('li', { class: 'r-' + inst.r }, bonusText(bn)))),
    t.effect ? h('div', { class: 'eff' }, EFFECTS[t.effect]) : null,
    h('div', { class: 'small muted' },
      isUpgradeable(t) ? `Dayanıklılık ${inst.d}/100${inst.d <= 0 ? ' — KIRIK: temel değer −%25' : inst.d < 20 ? ' — tamir et!' : ''}` : 'Yükseltilemez (yüzük/kolye)',
      inst.lock ? ' · 🔒 Kilitli' : ''),
    h('div', { class: 'small muted' }, inst.r === 'L' ? 'Satılamaz · Parçalanamaz' : `Satış değeri: ${itemSellPrice(inst)} Gold`));
}

export function compareTable(inst) {
  const t = ITEMS[inst.tid];
  if (!t || inst.q !== undefined) return null;
  const ch = app.char;
  if (!(t.cls === 'any' || t.cls === ch.cls)) return null;
  const cur = computeStats(ch);
  const nxt = statsWithItem(ch, inst);
  const rows = [];
  for (const [k, label, kind] of COMPARE_KEYS) {
    const d = nxt[k] - cur[k];
    if (Math.abs(d) < 0.0005) continue;
    const v = kind === 'pct' ? `${d > 0 ? '+' : ''}${(d * 100).toFixed(1)}%` : `${d > 0 ? '+' : ''}${kind ? d.toFixed(1) : Math.round(d)}`;
    rows.push(h('tr', {}, h('td', {}, label), h('td', { class: d > 0 ? 'up' : 'down' }, v)));
  }
  const eq = ch.equipment[t.slot];
  return h('div', { class: 'box cmp' },
    h('div', { class: 'small gold' }, eq ? `Kuşanılı ile karşılaştırma: ${ITEMS[eq.tid].name}${eq.p ? ' +' + eq.p : ''}` : 'Slot boş — kuşanınca:'),
    rows.length ? h('table', {}, rows) : h('div', { class: 'small muted' }, 'Stat değişimi yok'));
}

// loc: { where: 'bag'|'equip'|'pending'|'storage', index, slot }, ctx: 'normal'|'shop'|'storage'
export function showItemCard(inst, loc, ctx = 'normal', after = () => {}) {
  const t = ITEMS[inst.tid];
  const acts = [];
  const done = () => { ui.closeModal(); after(); };
  if (loc.where === 'bag') {
    const su = !t ? STACKABLES[inst.tid] : null;
    if (su?.cat === 'usable' && su.use.kind !== 'quest') acts.push(h('button', { class: 'btn green', 'data-testid': 'use-btn', onTap: () => { const r = act.useItem(inst.tid); if (r?.ok) done(); } }, 'Kullan'));
    if (t) {
      const chk = canEquip(app.char, inst);
      acts.push(h('button', { class: 'btn green' + (chk.ok ? '' : ' dis'), onTap: () => { act.equip(loc.index); done(); } }, chk.ok ? 'Kuşan' : chk.msg));
      acts.push(h('button', { class: 'btn ghost', onTap: () => { act.lock(inst.uid); done(); } }, inst.lock ? 'Kilidi aç' : 'Kilitle ★'));
    }
    if (ctx === 'shop') {
      // V2 eşya koruması: Rare/Epic ya da yükseltilmiş eşya satılmadan önce ayrıca onay istenir
      const risky = t && (inst.r === 'R' || inst.r === 'E' || inst.p > 0);
      const doSell = () => { act.sell(loc.index); done(); };
      if (inst.r !== 'L') acts.push(h('button', { class: 'btn' + (inst.lock ? ' dis' : ''), 'data-testid': 'sell-btn', onTap: () => (risky ? ui.confirm({
        title: 'Değerli eşya satılsın mı?', danger: true, ok: 'Sat',
        text: `${t.name}${inst.p ? ` +${inst.p}` : ''} (${RARITY_INFO[inst.r].name}) ${itemSellPrice(inst)} Gold'a satılacak. Satılan eşya geri alınamaz.`,
        onOk: doSell,
      }) : doSell()) }, `Sat (+${itemSellPrice(inst)} G)`));
    }
    if (ctx === 'storage') acts.push(h('button', { class: 'btn blue', onTap: () => { act.deposit(loc.index); done(); } }, 'Depoya koy'));
    if (t && inst.r !== 'L' && ctx !== 'storage') {
      const out = dismantleOutput({ ...inst }, { int: (a) => a, float: () => 1 });
      const preview = out ? out.map((o) => STACKABLES[o.id].name).join(', ') : '';
      acts.push(h('button', { class: 'btn red' + (inst.lock ? ' dis' : ''), onTap: () => ui.confirm({ title: 'Parçala', text: `${t.name} parçalanacak. Elde edilecek: ${preview} (miktar rastgele). Emin misin?`, ok: 'Parçala', danger: true, onOk: () => { act.dismantle(loc.index); ui.closeModal(); after(); } }) }, 'Parçala'));
    }
  } else if (loc.where === 'equip') {
    acts.push(h('button', { class: 'btn', onTap: () => { act.unequip(loc.slot); done(); } }, 'Çıkar'));
    acts.push(h('button', { class: 'btn ghost', onTap: () => { act.lock(inst.uid); done(); } }, inst.lock ? 'Kilidi aç' : 'Kilitle ★'));
  } else if (loc.where === 'pending') {
    acts.push(h('button', { class: 'btn green', onTap: () => { act.claimPending(); done(); } }, 'Çantaya al'));
  } else if (loc.where === 'storage') {
    acts.push(h('button', { class: 'btn blue', onTap: () => { act.withdraw(loc.index); done(); } }, 'Çantaya al'));
  }
  acts.push(h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Kapat'));
  const cmp = loc.where !== 'equip' ? compareTable(inst) : null;
  const card = h('div', { class: 'card frame' },
    h('div', { class: 'cb scroll', style: { flexWrap: 'wrap' } }, itemInfo(inst), cmp ? h('div', { style: { flex: '1', minWidth: '180px' } }, cmp) : null),
    h('div', { class: 'acts' }, acts));
  ui.modal(card);
}

export { pct };
