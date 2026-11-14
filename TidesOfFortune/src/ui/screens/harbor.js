// Liman ekranı: tek sahne + beş panel (Mal Al/Sat, İtem Seç, Tersane, Tayfa, Hayvan).
import { h, icon, fmt } from '../dom.js';
import { T } from '../../data/strings.js';
import { HARBOR_BY_ID, HARBOR_TYPES, REGIONS } from '../../data/harbors.js';
import { GOOD_BY_ID, GOOD_GROUPS } from '../../data/goods.js';
import { ITEM_BY_ID, ITEM_TYPES } from '../../data/items.js';
import { CREW_BY_ID } from '../../data/crew.js';
import { PET_BY_ID } from '../../data/pets.js';
import { SHIP_BY_LEVEL } from '../../data/ships.js';
import { BALANCE } from '../../config/balance.js';
import * as Ship from '../../systems/ShipSystem.js';
import * as Trade from '../../systems/TradeSystem.js';
import * as Items from '../../systems/ItemSystem.js';
import * as Repair from '../../systems/RepairSystem.js';
import * as Crew from '../../systems/CrewSystem.js';
import * as Pets from '../../systems/PetSystem.js';
import { statusBar, itemBar, crewCard, petCard, statusChips, hullBar } from '../components.js';
import { crewPortraitURL, petPortraitURL } from '../../rendering/Characters.js';

const TABS = [
  ['trade', 'scale'],
  ['items', 'gift'],
  ['yard', 'hammer'],
  ['crew', 'crew'],
  ['pets', 'paw'],
];

export function renderHarbor(ui) {
  const core = ui.core;
  const run = core.run;
  const visit = run.visit;
  const harbor = HARBOR_BY_ID[visit.harborId];
  const type = HARBOR_TYPES[harbor.type];
  const tab = ui.sub.harborTab || 'trade';

  const tabs = h('div.tabs', {}, ...TABS.map(([id, ic]) => {
    let badge = null;
    if (id === 'items' && visit.starterPicks > 0) badge = h('span.tbadge', {}, visit.starterPicks);
    if (id === 'pets' && visit.pet && !visit.petBought) badge = h('span.tbadge', {}, '!');
    return h(`button.tab${tab === id ? '.on' : ''}`, { onTap: () => { ui.sub.harborTab = id; ui.audio.play('page'); ui.render(); } }, icon(ic, 'big'), h('span', {}, T.tabs[id]), badge);
  }));

  let content;
  if (tab === 'trade') content = tradePanel(ui);
  else if (tab === 'items') content = itemsPanel(ui);
  else if (tab === 'yard') content = yardPanel(ui);
  else if (tab === 'crew') content = crewPanel(ui);
  else content = petsPanel(ui);

  const departBtn = harbor.final
    ? h('button.btn.big.primary.departBtn', { onTap: async () => {
      const unsold = run.cargo.filter((l) => !GOOD_BY_ID[l.good].questItem).length;
      const ok = await ui.confirm(unsold ? 'Ambarında hâlâ satılmamış mal var. Büyük Liman\'da satarsan çift XP kazanırsın. Yine de run\'ı tamamlamak istiyor musun?' : "Run'ı tamamlayıp XP'ni kalıcı hesabına aktarmak istiyor musun?", { title: T.completeRun, ok: T.completeRun });
      if (ok) { ui.audio.play('achievement'); core.completeRun(); }
    } }, icon('crown', 'big'), ' ', T.completeRun)
    : h('button.btn.big.primary.departBtn', { onTap: async () => {
      if (visit.starterPicks > 0 && run.items.length < Ship.itemSlots(core.G)) {
        const ok = await ui.confirm(T.departNoItems, { title: T.depart, ok: T.depart });
        if (!ok) return;
      }
      ui.audio.play('depart');
      ui.sailing = null;
      core.depart();
    } }, icon('sail', 'big'), ' ', T.depart);

  return h('div.screen.harbor', {},
    h('div.topRow', {},
      h('div.harborName', {}, icon(type.icon, 'big'), h('div', {}, h('b', {}, harbor.name), h('small', {}, `${harbor.final ? 'Final · ' : ''}${type.name} · ${REGIONS[harbor.region].name} · Liman ${run.idx + 1}/${run.route.length}`))),
      statusBar(ui),
      h('button.iconBtn', { onTap: () => { ui.sub.mapOpen = true; ui.render(); }, title: T.map }, icon('map', 'big')),
      h('button.iconBtn', { onTap: () => ui.go('menu'), title: T.mainMenu }, icon('home', 'big')),
    ),
    visit.statuses.length || run.pirateRep ? h('div.statusRow', {}, ...statusChips(visit.statuses, run)) : null,
    h('div.harborLeft', {}, itemBar(ui), deckInfo(ui)),
    h('div.harborPanel.panel', {},
      tabs,
      h('div.panelBody', { 'data-scroll': 'hp-' + tab }, content),
      h('div.panelFoot', {}, departBtn),
    ),
  );
}

function deckInfo(ui) {
  const run = ui.core.run;
  const G = ui.core.G;
  return h('div.deckInfo', {},
    h('span', {}, icon('crew'), ` ${run.crew.length}/${Ship.crewSlots(G)}`),
    h('span', {}, icon('paw'), ` ${run.pets.length}/${Pets.isOldFriendsPair(run) ? 2 : 1}`),
    h('span', {}, icon('wheel'), ` ${Ship.shipDef(run).name}`),
  );
}

// ───────── Mal Al/Sat ─────────

function tradePanel(ui) {
  const core = ui.core;
  const G = core.G;
  const run = core.run;
  const visit = run.visit;
  const harbor = HARBOR_BY_ID[visit.harborId];
  const free = Ship.cargoFree(G);
  const nextId = run.route[run.idx + 1]?.harborId;
  const selene = Crew.hasCrew(G, 'CREW_SELENE') && nextId;
  const parrot = Crew.hasPet(G, 'PET_KIRMIZI') && visit.prevPrices;

  const infos = [];
  if (Crew.hasCrew(G, 'CREW_TARIK') && nextId && visit.tipGood) {
    const p = Trade.sellPrice(G, nextId, visit.tipGood, { statuses: [] });
    infos.push(h('div.info', {}, icon('abacus'), ` Tarık'ın fiyat sezgisi: ${GOOD_BY_ID[visit.tipGood].name} sonraki limanda (${HARBOR_BY_ID[nextId].name}) ≈ ${p} altına satılır.`));
  }
  if (parrot) infos.push(h('div.info', {}, icon('parrot'), ` Kaptan Kırmızı önceki limanın (${HARBOR_BY_ID[visit.prevPrices.harborId].name}) fiyatlarını hatırlıyor: "Önceki" sütunu.`));
  if (selene) infos.push(h('div.info', {}, icon('eye'), ' Selene\'nin istihbaratı: "Sonraki" sütunu bir sonraki limanın satış fiyatlarını gösterir.'));

  const marketRows = visit.market.map((m) => {
    const g = GOOD_BY_ID[m.good];
    const bp = Trade.buyPrice(G, visit.harborId, m.good);
    const sp = Trade.sellPrice(G, visit.harborId, m.good);
    const maxQ = Math.max(0, Math.min(m.stock, free, Math.floor(run.gold / bp)));
    const reason = m.stock <= 0 ? 'Stok yok' : free <= 0 ? 'Kargo dolu' : run.gold < bp ? 'Yetersiz altın' : null;
    return h('div.trow', {},
      h('button.gname', { onTap: () => ui.showGood(m.good) }, icon(m.good, 'big'), h('span', {}, h('b', {}, g.name), h('small', {}, GOOD_GROUPS[g.group], g.contraband ? ' · ⚠ kaçak' : ''))),
      h('div.num', {}, h('small', {}, 'Alış'), h('b', {}, bp)),
      h('div.num.dim', {}, h('small', {}, 'Burada'), h('b', {}, sp)),
      parrot ? h('div.num.dim', {}, h('small', {}, 'Önceki'), h('b', {}, visit.prevPrices.prices[m.good] ?? '-')) : null,
      selene ? h('div.num.dim', {}, h('small', {}, 'Sonraki'), h('b', {}, Trade.sellPrice(G, nextId, m.good, { statuses: [] }))) : null,
      h('div.num', {}, h('small', {}, 'Stok'), h('b', {}, m.stock)),
      h('div.tbtns', {},
        h('button.btn.sm' + (reason ? '.locked' : ''), { onTap: () => { if (reason) return ui.toast(reason, 'warn'); const r = core.buyGood(m.good, 1); if (r.ok) ui.audio.play('buy'); } }, 'Al'),
        h('button.btn.sm' + (maxQ < 2 ? '.locked' : ''), { onTap: () => { if (maxQ < 2) return ui.toast(reason || 'En az 2 birim alınabilmeli', 'warn'); const r = core.buyGood(m.good, maxQ); if (r.ok) ui.audio.play('buy'); } }, `×${Math.max(maxQ, 0)}`),
      ),
    );
  });

  const lots = run.cargo.map((lot) => {
    const g = GOOD_BY_ID[lot.good];
    const chk = Trade.canSellHere(G, lot);
    const unit = chk.ok ? Trade.lotSellPrice(G, lot) : 0;
    const refund = lot.boughtVisit === visit.key && !lot.spoiled;
    const profit = unit - lot.cost;
    return h('div.trow.lot' + (lot.spoiled ? '.spoiled' : ''), {},
      h('button.gname', { onTap: () => ui.showGood(lot.good) }, icon(lot.good, 'big'), h('span', {}, h('b', {}, `${g.name} ×${lot.qty}`), h('small', {}, lot.spoiled ? 'Bozulmuş (%40 fiyat)' : refund ? 'Bu limandan alındı (iade)' : g.questItem ? 'Görev sandığı' : `Maliyet ${lot.cost}`, isContraband(g, harbor) ? ' · ⚠ kaçak' : ''))),
      h('div.num', {}, h('small', {}, 'Satış'), h('b', {}, chk.ok ? unit : '—')),
      h('div.num', {}, h('small', {}, refund ? 'İade' : 'Kâr/birim'), h('b.' + (refund ? 'neutral' : profit >= 0 ? 'pos' : 'neg'), {}, chk.ok ? (refund ? '0' : (profit >= 0 ? '+' : '') + profit) : '—')),
      h('div.tbtns', {},
        h('button.btn.sm' + (chk.ok ? '' : '.locked'), { onTap: () => { if (!chk.ok) return ui.toast(chk.reason, 'warn'); const r = core.sellLot(lot.id, 1); if (r.ok) ui.audio.play('sell'); } }, 'Sat'),
        h('button.btn.sm' + (chk.ok && lot.qty > 1 ? '' : '.locked'), { onTap: () => { if (!chk.ok) return ui.toast(chk.reason, 'warn'); if (lot.qty < 2) return ui.toast('Tek birim var; Sat\'ı kullan.', 'warn'); const r = core.sellLot(lot.id, lot.qty); if (r.ok) ui.audio.play('sell'); } }, 'Hepsi'),
      ),
    );
  });

  return h('div.trade', {},
    h('div.phead', {}, h('span', {}, icon('crate'), ` Kargo ${Ship.cargoUsed(run)}/${Ship.cargoCapacity(G)}`), h('span', {}, icon('coin'), ` ${fmt(run.gold)} altın`), h('span.hint', {}, 'Kâr: her 10 altın = 1 XP')),
    ...infos,
    h('h3', {}, 'Limanın malları'),
    ...marketRows,
    h('h3', {}, 'Ambarın'),
    lots.length ? lots : h('p.empty', {}, 'Ambarın boş. Ucuza al, başka limanda pahalıya sat.'),
  );
}

function isContraband(g, harbor) {
  return g.contraband && !g.questItem;
}

// ───────── İtem Seç ─────────

function itemsPanel(ui) {
  const core = ui.core;
  const G = core.G;
  const run = core.run;
  const visit = run.visit;
  const slots = Ship.itemSlots(G);
  const full = run.items.length >= slots;
  const starter = visit.starterPicks > 0;

  const buy = (id) => {
    const doBuy = (replaceUid) => {
      const r = core.buyItem(id, replaceUid);
      if (r.ok) ui.audio.play('buy');
    };
    if (full) {
      ui.chooseReplace(`Slotların dolu: hangi item yerine ${ITEM_BY_ID[id].name}?${starter ? '' : ` (değiştirme ücreti ${Items.swapFee(G)} altın)`}`, run.items.map((it) => ({ id: it.uid, label: ITEM_BY_ID[it.id].name, icon: icon(ITEM_BY_ID[it.id].icon, 'big') })), doBuy);
    } else doBuy(null);
  };

  const cards = visit.items.map((id) => {
    const it = ITEM_BY_ID[id];
    const bought = visit.itemsBought.includes(id);
    const price = Items.itemPrice(G, id);
    const total = price + (full && !starter ? Items.swapFee(G) : 0);
    const reason = bought ? 'Bu teklif zaten alındı.' : run.gold < total ? `Yetersiz altın (${total})` : null;
    return h(`div.card.itemcard.r-${it.rarity}${bought ? '.bought' : ''}`, { onLong: () => ui.showItem(id) },
      h('button.itop', { onTap: () => ui.showItem(id, { buy: bought ? null : { label: starter ? 'Ücretsiz seç' : `Al (${total})`, primary: true, onTap: () => buy(id) } }) }, icon(it.icon, 'huge'), h('b', {}, it.name), h('small', {}, ITEM_TYPES[it.type])),
      h('p.ieff', {}, it.effect),
      h('div.cact', {},
        starter ? h('div.price.free', {}, 'ÜCRETSİZ') : h('div.price', {}, icon('coin'), price),
        h('button.btn.sm' + (reason ? '.locked' : ''), { onTap: () => (reason ? ui.toast(reason, 'warn') : buy(id)) }, bought ? 'Alındı' : starter ? 'Seç' : 'Al'),
      ),
    );
  });
  return h('div.items', {},
    starter ? h('div.banner', {}, icon('gift'), ` Başlangıç: ${visit.starterPicks} ücretsiz item seçebilirsin. Sonraki limanlarda itemler ücretlidir.`) : null,
    h('div.phead', {}, h('span', {}, `Slot ${run.items.length}/${slots}`), full && !starter ? h('span.hint', {}, `Slot dolu: değiştirme ücreti ${Items.swapFee(G)} altın`) : h('span.hint', {}, 'Itemlere dokun: hangi olaylarda işe yaradığını gör')),
    h('div.grid', {}, ...cards),
  );
}

// ───────── Tersane ─────────

function yardPanel(ui) {
  const core = ui.core;
  const G = core.G;
  const run = core.run;
  const yard = Repair.shipyardOf(G);
  const ship = Ship.shipDef(run);
  const opts = Repair.repairOptions(G);
  const next = SHIP_BY_LEVEL[run.ship.level + 1];
  const cost = Ship.upgradeCost(G);
  const kit = run.items.find((i) => i.id === 'ITEM_REPAIR_KIT');

  const shipCard = h('div.card.shipcard', {},
    h('div', {}, h('h3', {}, ship.name, h('small', {}, ` · Seviye ${ship.level}`)), h('p', {}, ship.desc)),
    hullBar(G, true),
    h('div.shipstats', {},
      h('span', {}, icon('crate'), ` Kargo ${Ship.cargoCapacity(G)}`), h('span', {}, icon('gift'), ` Item ${Ship.itemSlots(G)}`), h('span', {}, icon('crew'), ` Tayfa ${Ship.crewSlots(G)}`), h('span', {}, icon('hull'), ` Hull ${Ship.maxHull(G)}`)),
    h('p.small', {}, 'Hasarlı: kaçış −%5 · Kritik: kaçış −%15, kargo −1 · Batmak Üzere: kaçış −%25, kargo −2, her rotada −3 HP sızıntı.'),
  );
  const repairs = opts.length
    ? opts.map((o) => {
      const reason = o.disabled || (o.heal <= 0 ? 'Onarılacak hasar yok.' : run.gold < o.cost ? `Yetersiz altın (${o.cost})` : null);
      return h('div.trow', {},
        h('div.gname', {}, icon(o.id === 'patch' ? 'kit' : 'hammer', 'big'), h('span', {}, h('b', {}, o.name), h('small', {}, o.desc))),
        h('div.num', {}, h('small', {}, 'Onarım'), h('b.pos', {}, `+${Math.max(0, o.heal)}`)),
        h('div.num', {}, h('small', {}, 'Ücret'), h('b', {}, o.cost)),
        h('div.tbtns', {}, h('button.btn.sm' + (reason ? '.locked' : ''), { onTap: () => { if (reason) return ui.toast(reason, 'warn'); const r = core.repair(o.id); if (r.ok) ui.audio.play('repair'); } }, 'Onar')),
      );
    })
    : [h('p.empty', {}, 'Bu limanda tersane yok. (Sis limanları onarım yapmaz.)')];
  const kitRow = kit ? h('div.trow', {}, h('div.gname', {}, icon('kit', 'big'), h('span', {}, h('b', {}, 'Onarım Takımı kullan'), h('small', {}, 'Item ile tamir: +30 HP, tek kullanım'))), h('div.tbtns', {}, h('button.btn.sm', { onTap: () => { const r = core.useRepairKit(kit.uid); if (r.ok) ui.audio.play('repair'); } }, 'Kullan'))) : null;

  let upg;
  if (!next) upg = h('p.empty', {}, 'Gemin denizlerin en büyüğü: Ticaret Galeonu.');
  else {
    const reason = !yard.upgrade ? 'Bu limanın tersanesi gemi yükseltemez (tam tersane gerekli).' : run.gold < cost ? `Yetersiz altın (${cost})` : null;
    upg = h('div.card.upgcard', {},
      h('div', {}, h('h3', {}, `${next.name}`, h('small', {}, ` · Seviye ${next.level}`)), h('p', {}, next.desc),
        h('div.shipstats', {}, h('span', {}, `Kargo ${next.cargo}`), h('span', {}, `Item ${next.items}`), h('span', {}, `Tayfa ${next.crew}`), h('span', {}, `Hull ${next.hull}`))),
      h('div.cact', {}, h('div.price', {}, icon('coin'), fmt(cost)), h('button.btn' + (reason ? '.locked' : '.primary'), { onTap: async () => {
        if (reason) return ui.toast(reason, 'warn');
        const ok = await ui.confirm(`${fmt(cost)} altına ${next.name} gemisine geçmek istiyor musun? (Mevcut hasar korunur, yeni kapasite eklenir.)`, { title: 'Gemi yükseltme', ok: 'Yükselt' });
        if (ok) { const r = core.upgradeShip(); if (r.ok) { ui.audio.play('achievement'); ui.toast(`Yeni gemin: ${next.name}!`, 'good'); } }
      } }, 'Yükselt')),
    );
  }
  return h('div.yard', {}, shipCard, h('h3', {}, 'Tamir'), ...repairs, kitRow, h('h3', {}, 'Gemi yükseltme'), upg);
}

// ───────── Tayfa ─────────

function crewPanel(ui) {
  const core = ui.core;
  const G = core.G;
  const run = core.run;
  const visit = run.visit;
  const slots = Ship.crewSlots(G);
  const full = run.crew.length >= slots;
  const hire = (id) => {
    const go = (rep) => { const r = core.hireCrew(id, rep); if (r.ok) { ui.audio.play('coin'); ui.toast(`${CREW_BY_ID[id].name} gemiye katıldı!`, 'good'); } };
    if (full) ui.chooseReplace(`Tayfa slotların dolu: kimin yerine ${CREW_BY_ID[id].name}? (Bırakılan tayfa bu run'da geri dönmez.)`, run.crew.map((c) => ({ id: c, label: CREW_BY_ID[c].name, sub: CREW_BY_ID[c].title, icon: h('img.miniP', { src: crewPortraitURL(c, 2) }) })), go);
    else go(null);
  };
  const offers = visit.crew.map((id) => {
    const hired = visit.crewHired.includes(id) || run.crew.includes(id);
    const price = Crew.crewPrice(G, id);
    const syn = synergyNote(run, id);
    return crewCard(ui, id, { price, action: () => hire(id), actionLabel: hired ? 'Gemide' : 'İşe al', disabled: hired ? 'Zaten gemide.' : run.gold < price ? `Yetersiz altın (${price})` : null, extra: syn ? h('div.syn', {}, icon('star'), ' ', syn) : null });
  });
  const mine = run.crew.map((id) => crewCard(ui, id, { small: true, action: async () => {
    const ok = await ui.confirm(`${CREW_BY_ID[id].name} gemiden ayrılsın mı? Bu run'da geri dönmez ve pasif etkileri kalkar.`, { danger: true, ok: 'Bırak' });
    if (ok) core.dismissCrew(id);
  }, actionLabel: 'Bırak' }));
  return h('div.crew', {},
    h('div.phead', {}, h('span', {}, `Tayfa ${run.crew.length}/${slots}`), h('span.hint', {}, 'Karta dokun: ayrıntı ve sinerjiler')),
    h('h3', {}, 'Limanda iş arayanlar'),
    offers.length ? h('div.list', {}, ...offers) : h('p.empty', {}, 'Bu limanda iş arayan kimse yok.'),
    h('h3', {}, 'Mürettebatın'),
    mine.length ? h('div.list', {}, ...mine) : h('p.empty', {}, 'Henüz tayfan yok.'),
  );
}

function synergyNote(run, id) {
  const has = (x) => run.crew.includes(x) || run.pets.includes(x);
  if (id === 'CREW_PITA') return 'Pita gemideki tüm tayfa becerilerini %10 güçlendirir' + (has('PET_TARCIN') ? ' (Tarçın ile %15)' : '');
  if (id === 'CREW_ESPERANZA' && has('CREW_VARGAS')) return 'Sinerji: Doc Vargas ile varışta ek +15 HP';
  if (id === 'CREW_VARGAS' && has('CREW_ESPERANZA')) return 'Sinerji: Esperanza ile varışta ek +15 HP';
  if (id === 'CREW_REZA' && has('PET_CUCE')) return 'Sinerji: Cüce Kaptan ile kaçakçılık eventleri otomatik başarılır';
  if (id === 'CREW_GROOT' && has('PET_ZIPIR')) return 'Zıpır Groot\'un yanında uyumayı sever';
  if (id === 'CREW_BJORN' && has('PET_TARCIN')) return 'Bjorn kemik atar, Tarçın getirir';
  if (id === 'CREW_DIEGO' && has('PET_KIRMIZI')) return 'Kaptan Kırmızı Diego\'nun omzuna konar';
  if (id === 'CREW_MAGDA' && has('PET_GECEYARISI')) return 'Gece Yarısı ile güvertenin köşesinde otururlar';
  if (id === 'CREW_SOLARA') return 'İşe alınırsa kalıcı yükseltmelerde gizli "Solara\'nın Mirası" dalı açılır';
  return null;
}

// ───────── Hayvan ─────────

function petsPanel(ui) {
  const core = ui.core;
  const G = core.G;
  const run = core.run;
  const visit = run.visit;
  const pair = Pets.isOldFriendsPair(run);
  const cap = pair ? 2 : 1;
  const parts = [];
  if (visit.pet) {
    const price = Pets.petPrice(G, visit.pet);
    const owned = run.pets.includes(visit.pet) || visit.petBought;
    parts.push(h('h3', {}, 'Limandaki hayvan'), petCard(ui, visit.pet, {
      price,
      actionLabel: owned ? 'Gemide' : 'Satın al',
      disabled: owned ? 'Zaten gemide.' : run.gold < price ? `Yetersiz altın (${price})` : null,
      action: async () => {
        if (run.pets.length >= cap) {
          const repl = run.pets[0];
          const ok = await ui.confirm(`Hayvan slotun dolu. ${PET_BY_ID[repl].name} limanda kalacak ve ${PET_BY_ID[visit.pet].name} gemine gelecek. Emin misin?`, { danger: true, ok: 'Değiştir' });
          if (!ok) return;
          const r = core.buyPet(repl);
          if (r.ok) ui.audio.play('coin');
        } else {
          const r = core.buyPet(null);
          if (r.ok) ui.audio.play('coin');
        }
      },
    }));
  } else parts.push(h('p.empty', {}, 'Bu limanda satılık hayvan yok. (Hayvan teklifi olasılığa bağlıdır: %30, balıkçı köylerinde %40, gizemli adalarda %50.)'));
  parts.push(h('h3', {}, `Gemideki hayvanlar ${run.pets.length}/${cap}`));
  if (run.pets.length) {
    for (const id of run.pets) {
      parts.push(petCard(ui, id, {
        actionLabel: 'Serbest bırak',
        action: async () => {
          const extra = (id === 'PET_ZIPIR' || id === 'PET_TARCIN') ? ' Bu, bir daha geri dönmeyecek.' : '';
          const ok = await ui.confirm(`${PET_BY_ID[id].name} limanda kalsın mı?${extra}`, { danger: true, ok: 'Bırak' });
          if (ok) core.releasePet(id);
        },
      }));
    }
  } else parts.push(h('p.empty', {}, 'Gemide hayvan yok.'));
  if (pair) parts.push(h('div.banner.gold', {}, icon('heart'), ' Eski Dostlar: Zıpır ve Tarçın birlikte. Zıpır\'ın şans bonusu %15; Tarçın iki olay önceden uyarır.'));
  if (Crew.hasPet(G, 'PET_TARCIN')) {
    const has = run.buffs.biscuit;
    parts.push(h('div.card.biscuit', {},
      h('div.gname', {}, icon('biscuit', 'huge'), h('span', {}, h('b', {}, 'Tarçın için bisküvi'), h('small', {}, 'Bir sonraki rotada tüm tayfa becerileri +%8. Kargoda Bisküvi Kasası varsa Tarçın\'ın becerileri +%15.'))),
      h('div.cact', {}, h('div.price', {}, icon('coin'), BALANCE.pets.biscuitCost), h('button.btn.sm' + (has ? '.locked' : ''), { onTap: () => { if (has) return ui.toast('Tarçın bisküvisini zaten aldı. Kuyruğu hâlâ sallanıyor.', 'warn'); const r = core.buyBiscuit(); if (r.ok) { ui.audio.play('bark'); ui.toast('Tarçın bisküviyi kaptı! Kuyruğu durmuyor.', 'good'); } } }, has ? 'Alındı' : 'Al')),
    ));
  }
  return h('div.pets', {}, ...parts);
}

export { petPortraitURL };
