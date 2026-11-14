// Paylaşılan arayüz bileşenleri.
import { h, icon, fmt } from './dom.js';
import { T } from '../data/strings.js';
import { ITEM_BY_ID, ITEM_CATEGORIES, ITEM_TYPES } from '../data/items.js';
import { CREW_BY_ID, CREW_CLASSES } from '../data/crew.js';
import { PET_BY_ID } from '../data/pets.js';
import { GOOD_BY_ID, GOOD_GROUPS } from '../data/goods.js';
import { HARBOR_BY_ID, HARBOR_TYPES, REGIONS } from '../data/harbors.js';
import { crewPortraitURL, petPortraitURL } from '../rendering/Characters.js';
import * as Ship from '../systems/ShipSystem.js';
import { STATUS_NAMES } from '../systems/EventSystem.js';

export const CAT_COLOR = { healthy: '#5cb85c', damaged: '#e8b94a', critical: '#e07b39', sinking: '#d9534f', sunk: '#555' };

export function hullBar(G, big = false) {
  const max = Ship.maxHull(G);
  const hp = G.run.ship.hull;
  const cat = Ship.hullCategory(G);
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  return h(`div.hullbar${big ? '.big' : ''}`, { title: 'Gövde' },
    icon('hull'),
    h('div.bar', {}, h('div.fill', { style: { width: pct + '%', background: CAT_COLOR[cat] } }), h('span.barlabel', {}, `${hp}/${max}`)),
    h('span.cat', { style: { color: CAT_COLOR[cat] } }, Ship.HULL_CATEGORY_NAMES[cat]),
  );
}

export function statusBar(ui, opts = {}) {
  const G = ui.core.G;
  const run = G.run;
  const cap = Ship.cargoCapacity(G);
  const used = Ship.cargoUsed(run);
  return h('div.statusbar', {},
    hullBar(G),
    h('div.stat', { title: T.gold }, icon('coin'), h('b', {}, fmt(run.gold))),
    h('div.stat' + (used >= cap ? '.full' : ''), { title: T.cargo }, icon('crate'), h('b', {}, `${used}/${cap}`)),
    h('div.stat', { title: 'Run XP' }, icon('star'), h('b', {}, fmt(run.xp.total))),
    opts.extra || null,
  );
}

export function itemBar(ui, { highlight = [], onTap = null, compact = false } = {}) {
  const G = ui.core.G;
  const run = G.run;
  const slots = Ship.itemSlots(G);
  const cells = [];
  for (let i = 0; i < slots; i++) {
    const it = run.items[i];
    if (!it) {
      cells.push(h('div.islot.empty', {}, ''));
      continue;
    }
    const def = ITEM_BY_ID[it.id];
    const hl = highlight.includes(it.id);
    cells.push(h(`button.islot.r-${def.rarity}${hl ? '.hl' : ''}`, {
      title: def.name,
      onTap: () => (onTap ? onTap(it) : ui.showItem(it.id, { owned: it })),
      onLong: () => ui.showItem(it.id, { owned: it }),
    }, icon(def.icon || 'info', 'big'), def.type === 'consumable' ? h('span.badge', {}, '1') : null));
  }
  return h(`div.itembar${compact ? '.compact' : ''}`, {}, h('span.lbl', {}, T.items), ...cells);
}

export function crewCard(ui, id, { price = null, action = null, actionLabel = '', disabled = null, small = false, extra = null } = {}) {
  const c = CREW_BY_ID[id];
  const cls = CREW_CLASSES[c.cls];
  return h(`div.card.crewcard${small ? '.small' : ''}`, { style: { '--cls': cls.color }, onLong: () => ui.showCrew(id) },
    h('img.portrait', { src: crewPortraitURL(id), alt: c.name, draggable: false, onTap: () => ui.showCrew(id) }),
    h('div.cbody', {},
      h('div.ctitle', {}, h('b', {}, c.name), h('span.clsTag', { style: { background: cls.color } }, cls.name)),
      h('div.csub', {}, c.title),
      small ? null : h('div.cpass', {}, c.passive),
      small ? null : h('div.cquote', {}, `“${c.quote}”`),
      extra,
    ),
    action ? h('div.cact', {},
      price != null ? h('div.price', {}, icon('coin'), fmt(price)) : null,
      h('button.btn.sm' + (disabled ? '.locked' : ''), { onTap: () => (disabled ? ui.toast(disabled, 'warn') : action()) }, actionLabel),
    ) : null,
  );
}

export function petCard(ui, id, { price = null, action = null, actionLabel = '', disabled = null, extra = null } = {}) {
  const p = PET_BY_ID[id];
  return h('div.card.crewcard.pet', { style: { '--cls': '#f0a060' }, onLong: () => ui.showPet(id) },
    h('img.portrait.petp', { src: petPortraitURL(id), alt: p.name, draggable: false, onTap: () => ui.showPet(id) }),
    h('div.cbody', {},
      h('div.ctitle', {}, h('b', {}, p.name), h('span.clsTag', { style: { background: '#c87a3a' } }, p.species)),
      h('div.cpass', {}, p.passive),
      extra,
    ),
    action ? h('div.cact', {},
      price != null ? h('div.price', {}, icon('coin'), fmt(price)) : null,
      h('button.btn.sm' + (disabled ? '.locked' : ''), { onTap: () => (disabled ? ui.toast(disabled, 'warn') : action()) }, actionLabel),
    ) : null,
  );
}

export function itemDetail(id) {
  const it = ITEM_BY_ID[id];
  return h('div.detail', {},
    h('div.dhead', {}, icon(it.icon || 'info', 'huge'), h('div', {}, h('h2', {}, it.name), h('div.tags', {},
      h('span.tag', {}, ITEM_CATEGORIES[it.cat]), h('span.tag', {}, ITEM_TYPES[it.type]), h(`span.tag.r-${it.rarity}`, {}, { common: 'Yaygın', uncommon: 'Seyrek', rare: 'Nadir' }[it.rarity]),
      h('span.tag', {}, icon('coin'), ` ${it.price}`)))),
    h('p', {}, it.effect),
    h('div.dsec', {}, h('b', {}, 'İşe yaradığı olaylar: '), it.events.join(', ')),
    it.assumption ? h('p.note', {}, 'Not: Bu item GDD açık sorularından geldi; değerleri geçici tasarım kararıdır.') : null,
  );
}

export function crewDetail(id, meta) {
  const c = CREW_BY_ID[id];
  const cls = CREW_CLASSES[c.cls];
  return h('div.detail', {},
    h('div.dhead', {}, h('img.portrait.xl', { src: crewPortraitURL(id, 6), alt: c.name }), h('div', {},
      h('h2', {}, c.name), h('div.csub', {}, c.title), h('div.tags', {}, h('span.tag', { style: { background: cls.color, color: '#1a1423' } }, cls.name), h('span.tag', {}, icon('coin'), ` ${c.price}`)))),
    h('p.cquote', {}, `“${c.quote}”`),
    h('p', {}, c.desc),
    h('div.dsec', {}, h('b', {}, 'Pasif: '), c.passive),
    h('div.dsec', {}, h('b', {}, 'Event bonusu: '), c.bonus),
    meta && meta.codex.crewHired[id] ? h('p.note', {}, 'Daha önce gemide çalıştı.') : null,
  );
}

export function petDetail(id) {
  const p = PET_BY_ID[id];
  return h('div.detail', {},
    h('div.dhead', {}, h('img.portrait.xl.petp', { src: petPortraitURL(id, 6), alt: p.name }), h('div', {}, h('h2', {}, p.name), h('div.csub', {}, p.species))),
    h('p', {}, p.desc),
    h('div.dsec', {}, h('b', {}, 'Pasif: '), p.passive),
    h('div.dsec', {}, h('b', {}, 'Özel: '), p.bonus),
    h('div.dsec', {}, h('b', {}, 'Edinme: '), p.acquire),
  );
}

export function goodDetail(id) {
  const g = GOOD_BY_ID[id];
  return h('div.detail', {},
    h('div.dhead', {}, icon(id, 'huge'), h('div', {}, h('h2', {}, g.name), h('div.tags', {}, h('span.tag', {}, GOOD_GROUPS[g.group]), g.contraband ? h('span.tag.warn', {}, '⚠ Kaçak (askerî liman)') : null))),
    h('div.dsec', {}, `Baz alış ${g.buy} · Baz satış ${g.sell} · Bozulma riski %${g.spoil}`),
    g.note ? h('p', {}, g.note) : null,
  );
}

export function harborDetail(id, known) {
  const hb = HARBOR_BY_ID[id];
  const t = HARBOR_TYPES[hb.type];
  return h('div.detail', {},
    h('h2', {}, hb.name),
    h('div.tags', {}, h('span.tag', { style: { background: REGIONS[hb.region].color, color: '#1a1423' } }, `Bölge ${hb.region}: ${REGIONS[hb.region].name}`), known ? h('span.tag', {}, t.name) : h('span.tag', {}, 'Tip bilinmiyor')),
    known ? h('p', {}, t.desc) : h('p', {}, 'Bu limanın tipi henüz bilinmiyor. (Kalıcı "Liman Öngörüsü" yükseltmesi haritada tipleri baştan gösterir.)'),
    hb.final ? h('p', {}, "Run'ın zirvesi: çift XP ve tüm item havuzu açık.") : null,
  );
}

export function statusChips(statuses, run) {
  const chips = (statuses || []).map((s) => h(`span.chip.st-${s}`, {}, STATUS_NAMES[s] || s));
  if (run && run.pirateRep) chips.push(h('span.chip.st-pirateRep', {}, `Korsan itibarı +${run.pirateRep}`));
  return chips;
}
