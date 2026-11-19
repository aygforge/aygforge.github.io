// Item tooltip & comparison (client-side preview only; the server re-validates everything).
import { h, fmt, pct } from './dom.js';
import { BASE_BY_ID, FAMILIES, SETS, SLOT_NAMES, equipSlotsFor } from '../../shared/data/items.js';
import { AFFIX_BY_ID } from '../../shared/data/affixes.js';
import { RARITIES } from '../../shared/data/rarities.js';
import { CLASSES } from '../../shared/data/classes.js';
import { itemBaseStats, npcSellValue } from '../../shared/formulas.js';
import { deriveStats } from '../../shared/stats.js';

export function reqLevel(item) {
  const b = BASE_BY_ID[item.base_id];
  return Math.max(1, b.reqLevel, item.item_level - 3);
}

export function affixText(a) {
  const d = AFFIX_BY_ID[a.id];
  if (!d) return a.id;
  return `+${pct(a.v, a.v < 0.02 ? 2 : 1)} ${d.name}`;
}

function baseLines(item) {
  const b = BASE_BY_ID[item.base_id];
  const s = itemBaseStats(b, item.item_level, item.rarity, item.upgrade);
  const out = [];
  if (s.dps) out.push(`${fmt(s.hit)} vuruş hasarı · ${s.speed.toFixed(2)} saldırı/sn · ${s.dps.toLocaleString('tr-TR')} DPS`);
  if (s.armor) out.push(`${fmt(s.armor)} Zırh`);
  if (s.block) out.push(`${pct(s.block, 0)} Blok şansı`);
  if (s.spellPower) out.push(`+${s.spellPower.toLocaleString('tr-TR')} Büyü gücü`);
  if (s.resourceRegen) out.push(`+${pct(s.resourceRegen, 0)} Kaynak yenilenmesi`);
  if (s.hpPct) out.push(`+${pct(s.hpPct)} Maks. Can`);
  if (s.critChance) out.push(`+${pct(s.critChance)} Kritik şansı`);
  return out;
}

export function itemTooltip(item, ctx = {}) {
  const b = BASE_BY_ID[item.base_id];
  if (!b) return h('div', {}, item.base_id);
  const r = RARITIES[item.rarity];
  const fam = FAMILIES[b.family];
  const cls = b.anyClass || !b.classes ? 'Tüm sınıflar' : b.classes.map((c) => CLASSES[c].name).join(', ');
  const hand = fam.kind === 'weapon' ? (fam.hands === 2 ? 'Çift el' : 'Tek el') : '';
  const slots = equipSlotsFor(b).map((s) => SLOT_NAMES[s]).join(' / ');
  const el = h('div', {},
    h('div', { class: 'tname r' + item.rarity }, b.name + (item.upgrade ? ` +${item.upgrade}` : '')),
    h('div', { class: 'small r' + item.rarity }, `${r.name} ${fam.name}${b.unique ? ' · Benzersiz' : ''}${b.set ? ' · Set' : ''}`),
    h('div', { class: 'small muted' }, `Eşya seviyesi ${item.item_level} · Gerekli seviye ${reqLevel(item)} · ${slots}${hand ? ' · ' + hand : ''}`),
    h('div', { class: 'small muted' }, `Sınıf: ${cls}`),
    h('hr'),
    ...baseLines(item).map((t) => h('div', {}, t)),
    item.affixes?.length ? h('hr') : null,
    ...(item.affixes || []).map((a, i) => h('div', { class: 'aff' }, affixText(a), h('span', { class: 'muted small' }, `  (${Math.round(a.q * 100)}% roll)`),
      item.pending_polish && item.pending_polish.index === i ? h('span', { class: 'gold small' }, `  → cila: ${affixText(item.pending_polish.affix)}`) : null)),
  );
  if (b.uniqueText) el.append(h('hr'), h('div', { class: 'uniq' }, b.uniqueText));
  if (b.set) {
    const S = SETS[b.set];
    const n = ctx.setCounts?.[b.set] || 0;
    el.append(h('hr'), h('div', { class: 'setb' }, `${S.name} (${n}/4)`),
      h('div', { class: 'setb' + (n >= 2 ? '' : ' off') }, '(2) ' + S.bonus2.text),
      h('div', { class: 'setb' + (n >= 4 ? '' : ' off') }, '(4) ' + S.bonus4.text));
  }
  el.append(h('hr'), h('div', { class: 'small muted' },
    `NPC değeri: ${fmt(npcSellValue(item))} altın`,
    item.reforge_count ? ` · Reforge: ${item.reforge_count}` : '',
    item.polish_count ? ` · Cila: ${item.polish_count}` : ''),
  h('div', { class: 'small' },
    item.tradeable === false ? h('span', { class: 'danger-text' }, 'Ticarete kapalı (sistem ödülü) ') : h('span', { class: 'ok-text' }, 'Serbestçe ticareti yapılabilir '),
    item.locked ? h('span', { class: 'gold' }, '🔒 Kilitli') : null));
  if (ctx.compare) el.append(h('hr'), compareBlock(item, ctx));
  return el;
}

// Estimated DPS / defense change if this item replaced the current one
export function compareBlock(item, { char, equipped, loadout, buffs }) {
  if (!char) return h('div');
  const b = BASE_BY_ID[item.base_id];
  const slots = equipSlotsFor(b);
  const slot = slots.find((s) => !equipped[s]) || slots[0];
  const cur = deriveStats({ cls: char.cls, level: char.level, equipped, loadout, buffs });
  const eq2 = { ...equipped, [slot]: item };
  if (FAMILIES[b.family].hands === 2) delete eq2.offhand;
  const nxt = deriveStats({ cls: char.cls, level: char.level, equipped: eq2, loadout, buffs });
  const d = (a, c, label) => {
    const diff = c - a;
    if (Math.abs(diff) < 0.05) return h('div', { class: 'muted' }, `${label}: değişmez`);
    return h('div', { class: diff > 0 ? 'cmp-up' : 'cmp-down' }, `${label}: ${diff > 0 ? '+' : ''}${fmt(diff)} (${fmt(c)})`);
  };
  const canUse = (b.anyClass || !b.classes || b.classes.includes(char.cls)) && char.level >= reqLevel(item);
  return h('div', {}, h('div', { class: 'small muted' }, `Karşılaştırma (${SLOT_NAMES[slot]})${equipped[slot] ? '' : ' — boş yuva'}`),
    canUse ? [d(cur.estDps, nxt.estDps, 'Tahmini DPS'), d(cur.estDefense, nxt.estDefense, 'Etkin savunma'), d(cur.maxHp, nxt.maxHp, 'Maks. Can')]
      : h('div', { class: 'danger-text' }, 'Bu karakter kuşanamaz (sınıf/seviye).'));
}

export function compareTooltip(item, current, ctx) {
  return h('div', { class: 'twin' }, h('div', {}, h('div', { class: 'small muted' }, 'Seçilen'), itemTooltip(item, ctx)),
    current ? h('div', {}, h('div', { class: 'small muted' }, 'Kuşanılan'), itemTooltip(current, { setCounts: ctx.setCounts })) : null);
}
