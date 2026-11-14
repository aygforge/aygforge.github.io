// Event kartı: illüstrasyon (canvas), anlatı, seçenek kartları (gereksinim/şans/risk), sonuç ve bekleyen seçimler.
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
import { statusBar, itemBar, crewCard, petCard } from '../components.js';
import { crewPortraitURL } from '../../rendering/Characters.js';

const KIND_ICON = { heal: 'heart', damage: 'hull', xp: 'star', cargo: 'crate', item: 'gift', info: 'info', gold: 'coin', route: 'compass', chain: 'chain', status: 'flag', crew: 'crew', pet: 'paw', codex: 'book', buff: 'sun' };
const TIER = { 1: 'Kolay', 2: 'Orta', 3: 'Zor', 4: 'Felaket' };

export function renderEvent(ui, host) {
  const core = ui.core;
  const G = core.G;
  const run = core.run;
  const cur = host.current;
  const ev = EVENT_BY_ID[cur.id];
  const cat = EVENT_CATEGORIES[ev.cat] || EVENT_CATEGORIES.mystery;
  const chain = ev.chain ? CHAINS[ev.chain] : null;
  const isArrival = run.phase === 'arrival';
  const hl = ui.sub.eventHighlight && ui.sub.eventHighlightFor === cur.id + host.pos ? ui.sub.eventHighlight : null;

  const narrative = h('div.evText.panel', {},
    h('div.evTags', {},
      h('span.catTag', { style: { background: cat.color } }, cat.name),
      ev.tier ? h('span.tag', {}, TIER[ev.tier]) : null,
      chain ? h('span.tag.chain', {}, icon('chain'), ` Zincir ${ev.step}/${chain.steps} · ${chain.name}`) : null,
      cur.lucky ? h('span.tag.gold', {}, '★ Şanslı olay') : null,
      cur.luck ? h('span.tag.gold', {}, `Şans +%${cur.luck}`) : null,
    ),
    h('h2.evTitle', {}, ev.title),
    h('p.evNarr', {}, ev.text),
  );

  let right;
  if (!cur.result) {
    const opts = Events.getOptions(G, host);
    right = h('div.evOptions', { 'data-scroll': 'evopt' }, ...opts.map((o) => optionCard(ui, o, hl)));
  } else right = resultPanel(ui, host, ev);

  const onItemTap = (it) => {
    const opts = cur.result ? [] : Events.getOptions(G, host);
    const name = ITEM_BY_ID[it.id].name;
    const useful = opts.filter((o) => o.view.items.includes(it.id) || o.view.breakdown.some((b) => b.label === name) || (o.opt.bonus || []).some((b) => b.item === it.id));
    ui.sub.eventHighlight = it.id;
    ui.sub.eventHighlightFor = cur.id + host.pos;
    if (useful.length) ui.toast(`${name}: ${useful.map((o) => o.opt.label).join(', ')} seçeneğinde işe yarar.`, 'good');
    else ui.toast(`${name} bu olayda doğrudan işe yaramıyor.`, 'info');
    ui.render();
  };

  return h(`div.screen.event.cat-${ev.cat}`, {},
    h('div.topRow', {}, h('div.evWhere', {}, isArrival ? 'Limanda' : 'Yolculukta'), statusBar(ui)),
    h('div.evLeft', {}, narrative, itemBar(ui, { highlight: hl ? [hl] : [], onTap: onItemTap })),
    h('div.evRight', {}, right),
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
  if (r.cargoFree) reqs.push(h('span.req', {}, icon('crate'), ` ${r.cargoFree} boş kargo`));
  if (opt.cost?.gold) reqs.push(h(`span.req${G.run.gold >= opt.cost.gold ? '.ok' : '.no'}`, {}, icon('coin'), ` ${opt.cost.gold} altın`));
  const highlight = hl && (v.items.includes(hl) || (opt.bonus || []).some((b) => b.item === hl) || v.breakdown.some((b) => b.label === ITEM_BY_ID[hl].name));
  const bd = v.breakdown.length > 1 ? v.breakdown.map((b, i) => (i === 0 ? `Temel %${b.v}` : `${b.label} ${b.v >= 0 ? '+' : ''}${b.v}`)).join(' · ') : null;
  return h(`button.optCard${v.available ? '' : '.locked'}${highlight ? '.hl' : ''}${o.injected ? '.special' : ''}`, {
    onTap: () => {
      if (!v.available) { ui.toast(v.reasons.join(' · '), 'warn'); ui.audio.play('error'); return; }
      const res = ui.core.choose(o.key);
      if (res.ok) afterChoose(ui, res.result);
    },
  },
    h('div.optHead', {}, icon(opt.icon || 'info', 'big'), h('b', {}, opt.label), v.chance != null ? h('span.chance' + (v.chance >= 70 ? '.hi' : v.chance >= 40 ? '.mid' : '.lo'), {}, `%${v.chance}`) : h('span.chance.sure', {}, 'Kesin')),
    reqs.length ? h('div.reqs', {}, ...reqs) : null,
    bd ? h('div.bd', {}, bd) : null,
    v.hint ? h('div.hint', {}, v.hint) : null,
    !v.available ? h('div.lockReason', {}, icon('lock'), ' ', v.reasons.join(' · ')) : null,
  );
}

function afterChoose(ui, result) {
  ui.audio.play(result.success ? 'success' : 'fail');
  if (result.lines.some((l) => l.kind === 'damage')) setTimeout(() => { ui.audio.play('damage'); ui.renderer.shipShake = 0.5; }, 250);
  if (result.lines.some((l) => l.kind === 'heal')) setTimeout(() => ui.audio.play('repair'), 300);
}

function resultPanel(ui, host, ev) {
  const core = ui.core;
  const run = core.run;
  const res = host.current.result;
  const sunk = run.ship.hull <= 0;
  const cont = () => {
    ui.sub.eventHighlight = null;
    ui.audio.play('page');
    if (run.phase === 'arrival') core.arrivalNext();
    else core.continueEvent();
  };
  const pend = (res.pending || []).map((p, i) => pendingWidget(ui, p, i)).filter(Boolean);
  return h(`div.result.panel.${res.success ? 'ok' : 'bad'}`, { 'data-scroll': 'evres' },
    h('div.resHead', {}, res.auto ? h('b', {}, '✦ ', res.label) : h('b', {}, res.success ? '✔ Başarılı' : '✖ Başarısız'), res.chance != null ? h('small', {}, ` ${res.label} · şans %${res.chance}`) : h('small', {}, ` ${res.label}`)),
    h('p.resText', {}, res.text),
    h('div.resLines', {}, ...res.lines.map((l) => h(`div.line.k-${l.kind}`, {}, icon(KIND_ICON[l.kind] || 'info'), ' ', l.text))),
    ...pend,
    sunk ? h('div.banner.bad', {}, icon('skull'), ' Gövde dayanamadı. Gemi batıyor…') : null,
    h('button.btn.big.primary.contBtn', { onTap: cont }, sunk ? 'Run özeti' : T.next, ' ▸'),
  );
}

function pendingWidget(ui, p, i) {
  const core = ui.core;
  const G = core.G;
  const run = core.run;
  if (p.done) {
    if (p.type === 'crew' && p.taken) return h('div.pend.done', {}, icon('crew'), ` ${CREW_BY_ID[p.taken].name} gemiye katıldı.`);
    if (p.type === 'item' || p.type === 'pet' || p.type === 'crew') return h('div.pend.done', {}, p.declined ? 'Reddedildi.' : 'Tamamlandı.');
    return null;
  }
  if (p.type === 'item') {
    const it = ITEM_BY_ID[p.id];
    return h('div.pend', {},
      h('div.pendTitle', {}, icon(it.icon, 'big'), ` Bulunan item: ${it.name}`), h('p.small', {}, it.effect),
      h('div.pendBtns', {},
        h('button.btn.sm.primary', { onTap: () => ui.chooseReplace(`${it.name} için hangi item bırakılsın?`, run.items.map((x) => ({ id: x.uid, label: ITEM_BY_ID[x.id].name, icon: icon(ITEM_BY_ID[x.id].icon, 'big') })), (uid) => core.pendingAction(i, 'take', { replaceUid: uid })) }, 'Değiştir'),
        h('button.btn.sm', { onTap: () => core.pendingAction(i, 'decline') }, 'Bırak'),
      ));
  }
  if (p.type === 'crew') {
    const full = run.crew.length >= Ship.crewSlots(G);
    const take = (id) => {
      if (full) ui.chooseReplace(`Tayfa slotların dolu: kimin yerine ${CREW_BY_ID[id].name}?`, run.crew.map((c) => ({ id: c, label: CREW_BY_ID[c].name, sub: CREW_BY_ID[c].title })), (rep) => core.pendingAction(i, 'take', { id, replaceId: rep }));
      else core.pendingAction(i, 'take', { id });
    };
    return h('div.pend', {}, h('div.pendTitle', {}, icon('crew', 'big'), p.ids.length > 1 ? ' Biri gemine katılabilir (birini seç):' : ' Gemine katılmak istiyor:'),
      h('div.list', {}, ...p.ids.map((id) => crewCard(ui, id, { action: () => take(id), actionLabel: 'Katılsın' }))),
      h('div.pendBtns', {}, h('button.btn.sm', { onTap: () => core.pendingAction(i, 'decline') }, 'Kimseyi alma')));
  }
  if (p.type === 'pet') {
    const pet = PET_BY_ID[p.id];
    const special = p.special === 'tookTarcin' || p.special === 'tookZipir';
    return h('div.pend', {}, h('div.pendTitle', {}, icon('paw', 'big'), ` ${pet.name} gemine katılmak istiyor.`),
      petCard(ui, p.id, {
        actionLabel: run.pets.length ? 'Değiştir' : 'Al',
        action: async () => {
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
    const buyRows = p.goods.map((g) => h('div.trow', {}, h('div.gname', {}, icon(g.good, 'big'), h('span', {}, h('b', {}, GOOD_BY_ID[g.good].name), h('small', {}, `Stok ${g.stock}`))),
      h('div.num', {}, h('small', {}, 'Fiyat'), h('b', {}, g.price)),
      h('div.tbtns', {}, h('button.btn.sm' + (g.stock > 0 && run.gold >= g.price && Ship.cargoFree(G) > 0 ? '' : '.locked'), { onTap: () => { const r = core.pendingAction(i, 'buy', { good: g.good }); if (r.ok) ui.audio.play('buy'); } }, 'Al'))));
    const sellRows = run.cargo.filter((l) => !GOOD_BY_ID[l.good].questItem).map((l) => {
      const bonus = Trade.sellBonuses(G, l.good).reduce((s, b) => s + b.v, 0);
      const unit = Math.round(GOOD_BY_ID[l.good].sell * p.sellMult * (1 + bonus) * (l.spoiled ? BALANCE.trade.spoiledSellFactor : 1));
      return h('div.trow', {}, h('div.gname', {}, icon(l.good, 'big'), h('span', {}, h('b', {}, `${GOOD_BY_ID[l.good].name} ×${l.qty}`), h('small', {}, `Maliyet ${l.cost}${l.spoiled ? ' · bozuk' : ''}`))),
        h('div.num', {}, h('small', {}, 'Satış'), h('b', {}, unit)),
        h('div.tbtns', {}, h('button.btn.sm', { onTap: () => { const r = core.pendingAction(i, 'sell', { lotId: l.id }); if (r.ok) ui.audio.play('sell'); } }, 'Sat')));
    });
    return h('div.pend', {}, h('div.pendTitle', {}, icon('scale', 'big'), p.mode === 'friendly' ? ' Dostane takas (+%20 satış, ucuz alış)' : ' Koydaki küçük pazar'),
      h('small', {}, `Altın ${fmt(run.gold)} · Kargo ${Ship.cargoUsed(run)}/${Ship.cargoCapacity(G)}`),
      ...buyRows, sellRows.length ? h('h4', {}, 'Ambarından sat') : null, ...sellRows,
      h('div.pendBtns', {}, h('button.btn.sm.primary', { onTap: () => core.pendingAction(i, 'close') }, 'Takası bitir')));
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
        h('div.num', {}, h('small', {}, `Normal ${d.price}`), h('b.pos', {}, it.price)),
        h('div.tbtns', {}, h('button.btn.sm' + (it.bought || run.gold < it.price ? '.locked' : ''), { onTap: () => (it.bought ? ui.toast('Satıldı.', 'warn') : run.gold < it.price ? ui.toast('Yetersiz altın.', 'warn') : buy()) }, it.bought ? 'Alındı' : 'Al')));
    });
    return h('div.pend', {}, h('div.pendTitle', {}, icon('gift', 'big'), ' Seyyar tüccarın tezgâhı (%20 indirimli)'), ...rows,
      h('div.pendBtns', {}, h('button.btn.sm.primary', { onTap: () => core.pendingAction(i, 'close') }, 'Tezgâhı kapat')));
  }
  return null;
}
