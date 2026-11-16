// Karşılaşma panelleri: gemi ve olay nesneleri görünür kalırken altta açılan dar karar paneli,
// animasyon sırasında küçülen başlık, sonuçta kısa özet + bekleyen seçimler.
import * as X2 from '../../systems/X2System.js';
import * as X3 from '../../systems/X3System.js';
import { h, icon, fmt } from '../dom.js';
import { T } from '../../data/strings.js';
import { EVENT_BY_ID, EVENT_CATEGORIES, CHAINS } from '../../data/events.js';
import { ITEM_BY_ID } from '../../data/items.js';
import { CREW_BY_ID } from '../../data/crew.js';
import { PET_BY_ID } from '../../data/pets.js';
import { GOOD_BY_ID } from '../../data/goods.js';
import { BALANCE } from '../../config/balance.js';
import * as Ship from '../../systems/ShipSystem.js';
import * as Events from '../../systems/EventSystem.js';
import * as Trade from '../../systems/TradeSystem.js';
import { crewCard, petCard } from '../components.js';
import { crewPortraitURL } from '../../rendering/Characters.js';
import { PH } from '../../presentation/EncounterDirector.js';

const KIND_ICON = { heal: 'heart', damage: 'hull', xp: 'star', cargo: 'crate', item: 'gift', info: 'info', gold: 'coin', route: 'compass', chain: 'chain', status: 'flag', crew: 'crew', pet: 'paw', codex: 'book', buff: 'sun' };

let RUN = null;
/** Paket 3: kaptan karşılaşmasında küçük üç renkli ilişki işareti (kırmızı gergin, gri tarafsız, yeşil dost) */
function relChips(ev) {
  if (!RUN?.x3) return [];
  return X3.capsOf(RUN, ev).map((k) => {
    const v = X3.rel(RUN, k);
    return h(`span.relChip.${X3.relTone(v)}`, { title: `${X3.CAPTAINS[k].name}: ${X3.relName(v)}` }, h('i.relDot', {}), ` ${X3.CAPTAINS[k].name} `, h('small', {}, X3.relName(v)));
  });
}
function header(ev, cur) {
  const cat = EVENT_CATEGORIES[ev.cat] || EVENT_CATEGORIES.mystery;
  const chain = ev.chain ? CHAINS[ev.chain] : null;
  return h('div.encHead', {},
    h('span.catTag', { style: { background: cat.color } }, cat.name),
    chain ? h('span.tag.chain', {}, icon('chain'), ` ${chain.name} `, h('b.n', {}, `${ev.step}/${chain.steps}`)) : null,
    cur?.lucky ? h('span.tag.gold', {}, '★ Şanslı') : null,
    h('b.encTitle', {}, ev.title),
    ...relChips(ev),
  );
}

/** Ana karşılaşma paneli (director fazına göre) */
export function encounterPanel(ui, host) {
  RUN = ui.core.run;
  const d = ui.director;
  const cur = host?.current;
  const ev = EVENT_BY_ID[cur?.id || d.eventId];
  if (!ev) return null;
  if (d.phase === PH.APPROACH) return h('div.encBar', {}, icon('eye'), ' ', approachText(ev));
  if (d.phase === PH.INTRO) return h('div.encPanel.slim', {}, header(ev, cur), h('p.encText', {}, evText(ui, ev)));
  if (d.phase === PH.DECISION && cur && !cur.result) return decisionPanel(ui, host, ev, cur);
  if (d.phase === PH.ACTION) return h('div.encBar.action', {}, icon('sail'), ' ', cur?.result?.label || '…');
  if ((d.phase === PH.OUTCOME || d.phase === PH.DECISION) && cur?.result) return outcomePanel(ui, host, ev, cur);
  return null;
}

function approachText(ev) {
  const art = ev.art || {};
  const o = art.obj || [];
  if (o.includes('pirateShip') || o.includes('pirateFleet')) return 'Ufukta şüpheli yelkenler…';
  if (o.includes('ghostShip')) return 'Sisin içinde bir şey kıpırdıyor…';
  if (o.includes('wave') || o.includes('tsunami')) return 'Deniz bir anda değişti…';
  if (o.includes('seaSerpent') || o.includes('tentacles')) return 'Suyun altında dev bir gölge!';
  if (ev.cat === 'fortune') return 'Gözcü bir şey gördü…';
  return 'Bir şeyler oluyor…';
}

function decisionPanel(ui, host, ev, cur) {
  const G = ui.core.G;
  const opts = Events.getOptions(G, host);
  const hl = ui.sub.eventHighlight;
  return h('div.encPanel', {},
    h('div.encLeft', {}, header(ev, cur), h('p.encText', { 'data-scroll': 'enctext' }, evText(ui, ev))),
    h('div.encOpts', { 'data-scroll': 'encopts' }, ...opts.map((o) => optionCard(ui, o, hl))),
  );
}

function optionCard(ui, o, hl) {
  const G = ui.core.G;
  const v = o.view;
  const opt = o.opt;
  const reqs = [];
  const r = opt.req || {};
  if (r.item) reqs.push(h(`span.req${G.run.items.some((i) => i.id === r.item) ? '.ok' : '.no'}`, {}, icon(ITEM_BY_ID[r.item].icon), ' ', ITEM_BY_ID[r.item].name, opt.consume === r.item ? ' (tükenir)' : ''));
  if (r.crew) reqs.push(h(`span.req${G.run.crew.includes(r.crew) ? '.ok' : '.no'}`, {}, h('img.miniP', { src: crewPortraitURL(r.crew, 2) }), ' ', CREW_BY_ID[r.crew].name));
  if (r.crewAny) reqs.push(h(`span.req${r.crewAny.some((c) => G.run.crew.includes(c)) ? '.ok' : '.no'}`, {}, icon('crew'), ' ', r.crewAny.map((c) => CREW_BY_ID[c].name).join(' / ')));
  if (r.pet) reqs.push(h('span.req', {}, icon('paw'), ' ', PET_BY_ID[r.pet].name));
  if (r.cargoFree) reqs.push(h('span.req', {}, icon('crate'), ' ', h('b.n', {}, r.cargoFree), ' boş kargo'));
  if (opt.cost?.gold) reqs.push(h(`span.req${G.run.gold >= opt.cost.gold ? '.ok' : '.no'}`, {}, icon('coin'), ' ', h('b.n', {}, opt.cost.gold), ' altın'));
  const highlight = hl && (v.items.includes(hl) || (opt.bonus || []).some((b) => b.item === hl));
  const bd = v.breakdown.length > 1 ? v.breakdown.slice(1).map((b) => `${b.label} ${b.v >= 0 ? '+' : ''}${b.v}`).join(' · ') : null;
  return h(`button.optCard${v.available ? '' : '.locked'}${highlight ? '.hl' : ''}${o.injected ? '.special' : ''}`, {
    onTap: () => {
      if (!v.available) { ui.toast(v.reasons.join(' · '), 'warn'); ui.audio.play('error'); return; }
      ui.sub.eventHighlight = null;
      const res = ui.director.choose(o.key);
      if (!res.ok && res.reason) ui.toast(res.reason, 'warn');
    },
  },
    h('div.optHead', {}, icon(opt.icon || 'info', 'big'), h('b', {}, opt.label), v.chance != null ? h('span.chance.n' + (v.chance >= 70 ? '.hi' : v.chance >= 40 ? '.mid' : '.lo'), {}, `%${v.chance}`) : h('span.chance.sure', {}, 'Kesin')),
    reqs.length ? h('div.reqs', {}, ...reqs) : null,
    bd ? h('div.bd.n', {}, bd) : null,
    v.hint ? h('div.hint', {}, v.hint) : null,
    !v.available ? h('div.lockReason', {}, icon('lock'), ' ', v.reasons.join(' · ')) : null,
  );
}

function outcomePanel(ui, host, ev, cur) {
  const res = cur.result;
  const run = ui.core.run;
  const sunk = run.ship.hull <= 0;
  const pend = (res.pending || []).map((p, i) => pendingWidget(ui, p, i)).filter(Boolean);
  const summary = res.lines.filter((l) => ['damage', 'heal', 'gold', 'cargo', 'item', 'crew', 'pet', 'xp', 'status', 'chain', 'route'].includes(l.kind));
  return h(`div.encPanel.outcome.${res.success ? 'ok' : 'bad'}`, {},
    h('div.encLeft', {},
      h('div.resHead', {}, res.auto ? h('b', {}, '✦ Otomatik çözüm') : h('b', {}, res.success ? '✔ Başarılı' : '✖ Başarısız'), h('small', {}, ` ${res.label}`), res.chance != null ? h('small.n', {}, ` · %${res.chance}`) : null),
      h('p.encText', { 'data-scroll': 'restext' }, res.text),
    ),
    h('div.encRes', { 'data-scroll': 'resl' },
      h('div.resLines', {}, ...summary.map((l) => h(`div.line.k-${l.kind}`, {}, icon(KIND_ICON[l.kind] || 'info'), ' ', l.text))),
      ...pend,
      sunk ? h('div.banner.bad', {}, icon('skull'), ' Gövde dayanamadı. Gemi batıyor…') : null,
      h('button.btn.primary.contBtn', { onTap: () => { ui.audio.play('page'); ui.director.continueAfter(); } }, sunk ? 'Run özeti' : T.next, ' ▸'),
    ),
  );
}

function prepJoin(ui) {
  const L = ui.world.layout();
  const side = ui.director.scene?.side || 1;
  ui.world.deck.spawnAt = L.stations.find((s) => s.type === (side < 0 ? 'railL' : 'railR')) || null;
}

function pendingWidget(ui, p, i) {
  const core = ui.core;
  const G = core.G;
  const run = core.run;
  if (p.done) {
    if (p.type === 'crew' && p.taken) return h('div.pend.done', {}, icon('crew'), ` ${CREW_BY_ID[p.taken].name} gemiye katıldı.`);
    if (['item', 'pet', 'crew'].includes(p.type)) return h('div.pend.done', {}, p.declined ? 'Reddedildi.' : 'Tamamlandı.');
    return null;
  }
  if (p.type === 'item') {
    const it = ITEM_BY_ID[p.id];
    return h('div.pend', {}, h('div.pendTitle', {}, icon(it.icon, 'big'), ` ${it.name} (slot dolu)`),
      h('div.pendBtns', {},
        h('button.btn.sm.primary', { onTap: () => ui.chooseReplace(`${it.name} için hangi item bırakılsın?`, run.items.map((x) => ({ id: x.uid, label: ITEM_BY_ID[x.id].name, icon: icon(ITEM_BY_ID[x.id].icon, 'big') })), (uid) => core.pendingAction(i, 'take', { replaceUid: uid })) }, 'Değiştir'),
        h('button.btn.sm', { onTap: () => core.pendingAction(i, 'decline') }, 'Bırak')));
  }
  if (p.type === 'crew') {
    const full = run.crew.length >= Ship.crewSlots(G);
    const take = (id) => {
      prepJoin(ui);
      if (full) ui.chooseReplace(`Tayfa slotların dolu: kimin yerine ${CREW_BY_ID[id].name}?`, run.crew.map((c) => ({ id: c, label: CREW_BY_ID[c].name, sub: CREW_BY_ID[c].title })), (rep) => core.pendingAction(i, 'take', { id, replaceId: rep }));
      else core.pendingAction(i, 'take', { id });
    };
    return h('div.pend', {}, h('div.pendTitle', {}, icon('crew', 'big'), p.ids.length > 1 ? ' Biri gemine katılabilir:' : ' Gemine katılmak istiyor:'),
      h('div.list', {}, ...p.ids.map((id) => crewCard(ui, id, { action: () => take(id), actionLabel: 'Katılsın', small: true }))),
      h('div.pendBtns', {}, h('button.btn.sm', { onTap: () => core.pendingAction(i, 'decline') }, 'Kimseyi alma')));
  }
  if (p.type === 'pet') {
    const pet = PET_BY_ID[p.id];
    const special = p.special === 'tookTarcin' || p.special === 'tookZipir';
    return h('div.pend', {}, h('div.pendTitle', {}, icon('paw', 'big'), ` ${pet.name} gemine katılmak istiyor.`),
      petCard(ui, p.id, {
        actionLabel: run.pets.length ? 'Değiştir' : 'Al',
        action: async () => {
          prepJoin(ui);
          if (run.pets.length) {
            const rep = run.pets[0];
            const ok = await ui.confirm(`${PET_BY_ID[rep].name} gemiden ayrılacak ve ${pet.name} katılacak. Emin misin?`, { danger: true, ok: 'Değiştir' });
            if (!ok) return;
            core.pendingAction(i, 'take', { replaceId: rep });
          } else core.pendingAction(i, 'take', {});
        },
      }),
      h('div.pendBtns', {}, h('button.btn.sm', { onTap: () => core.pendingAction(i, 'decline') }, special ? 'Rıhtımda kalsın' : 'Gitsin')));
  }
  if (p.type === 'trade') {
    const buyRows = p.goods.map((g) => h('div.trow', {}, h('div.gname', {}, icon(g.good, 'big'), h('span', {}, h('b', {}, GOOD_BY_ID[g.good].name), h('small', {}, 'Stok ', h('b.n', {}, g.stock)))),
      h('div.num', {}, h('small', {}, 'Fiyat'), h('b.n', {}, g.price)),
      h('div.tbtns', {}, h('button.btn.sm' + (g.stock > 0 && run.gold >= g.price && Ship.cargoFree(G) > 0 ? '' : '.locked'), { onTap: () => { const r = core.pendingAction(i, 'buy', { good: g.good }); if (r.ok) ui.audio.play('buy'); } }, 'Al'))));
    const sellRows = run.cargo.filter((l) => !GOOD_BY_ID[l.good].questItem).map((l) => {
      const bonus = Trade.sellBonuses(G, l.good).reduce((s, b) => s + b.v, 0);
      const unit = Math.round(GOOD_BY_ID[l.good].sell * p.sellMult * (1 + bonus) * (l.spoiled ? BALANCE.trade.spoiledSellFactor : 1));
      return h('div.trow', {}, h('div.gname', {}, icon(l.good, 'big'), h('span', {}, h('b', {}, GOOD_BY_ID[l.good].name, ' ×', h('span.n', {}, l.qty)), h('small', {}, 'Maliyet ', h('b.n', {}, l.cost)))),
        h('div.num', {}, h('small', {}, 'Satış'), h('b.n', {}, unit)),
        h('div.tbtns', {}, h('button.btn.sm', { onTap: () => { const r = core.pendingAction(i, 'sell', { lotId: l.id }); if (r.ok) ui.audio.play('sell'); } }, 'Sat')));
    });
    return h('div.pend', {}, h('div.pendTitle', {}, icon('scale', 'big'), p.mode === 'friendly' ? ' Dostane takas' : ' Küçük pazar'),
      ...buyRows, ...sellRows, h('div.pendBtns', {}, h('button.btn.sm.primary', { onTap: () => core.pendingAction(i, 'close') }, 'Takası bitir')));
  }
  if (p.type === 'shop') {
    const full = run.items.length >= Ship.itemSlots(G);
    const rows = p.items.map((it) => {
      const d = ITEM_BY_ID[it.id];
      const buy = () => {
        if (full) ui.chooseReplace(`${d.name} için hangi item bırakılsın?`, run.items.map((x) => ({ id: x.uid, label: ITEM_BY_ID[x.id].name })), (uid) => core.pendingAction(i, 'buy', { id: it.id, replaceUid: uid }));
        else core.pendingAction(i, 'buy', { id: it.id });
      };
      return h('div.trow', {}, h('button.gname', { onTap: () => ui.showItem(it.id) }, icon(d.icon, 'big'), h('span', {}, h('b', {}, d.name), h('small', {}, d.effect))),
        h('div.num', {}, h('small', {}, 'Fiyat'), h('b.n.pos', {}, it.price)),
        h('div.tbtns', {}, h('button.btn.sm' + (it.bought || run.gold < it.price ? '.locked' : ''), { onTap: () => (it.bought ? ui.toast('Satıldı.', 'warn') : run.gold < it.price ? ui.toast('Yetersiz altın.', 'warn') : buy()) }, it.bought ? 'Alındı' : 'Al')));
    });
    return h('div.pend', {}, h('div.pendTitle', {}, icon('gift', 'big'), ' Seyyar tüccar (%20 indirim)'), ...rows,
      h('div.pendBtns', {}, h('button.btn.sm.primary', { onTap: () => core.pendingAction(i, 'close') }, 'Kapat')));
  }
  return null;
}

export { fmt };

/** Olay metni + Sonsuz Deniz varyantı (Paket 2): derinliğe bağlı ek anlatım; tiyatro gerçek sefer istatistiklerini anlatır */
function evText(ui, ev) {
  const run = ui.core.run;
  const v = X2.variantOf(run, ev);
  const cap = run?.x3?.pursuit ? X3.CAPTAINS[run.x3.pursuit] : null;
  const base = ev.text.replace('{cap}', cap ? `${cap.gen} ${cap.ship}` : 'Rakip bir kaptanın');
  if (!v) return base;
  return `${base} ${v.theatre ? X2.theatreText(run) : v.text || ''}`.trim();
}
