// NPC etkileşim paneli: konuşma + gerçek hizmetler (görev, alışveriş, demirci, üretim, tamir, parçalama, depo,
// iksir, av sözleşmesi, yaratık rehberi, sıfırlama, çanta/depo genişletme).
import { h, clear, img, fmt } from '../dom.js';
import { ui } from '../ui.js';
import { app } from '../../core/app.js';
import { bus } from '../../core/events.js';
import { iconURL } from '../../art/icons.js';
import { npcSheet } from '../../art/characters.js';
import { NPCS } from '../../data/npcs.js';
import { ITEMS, isUpgradeable } from '../../data/items.js';
import { STACKABLES, POTION_LIST } from '../../data/materials.js';
import { RECIPES } from '../../data/recipes.js';
import { ENEMIES } from '../../data/enemies.js';
import { MAPS } from '../../data/maps/index.js';
import { RARITY_INFO, SLOTS, SLOT_NAMES, RESET_COST, BAG_STEPS, STORAGE_MAX } from '../../data/constants.js';
import { questsForNpc, contractOffers, isReady } from '../../systems/quests.js';
import { merchantStock, upgradeInfo, repairAllCost, repairCost, craftCheck, BOTTLE_PRICE, BAG_EXPAND_COST, STORAGE_EXPAND_COST, itemSellPrice } from '../../systems/economy.js';
import { countStack } from '../../systems/inventory.js';
import { skillPointsSpent, statPointsSpent } from '../../systems/character.js';
import { gridView, itemCell, cellSize } from './grid.js';
import { showItemCard, itemInfo } from './itemcard.js';
import { act } from '../actions.js';
import { sound } from '../../audio/sound.js';

const SVC_LABEL = {
  quests: 'Görevler', class_quests: 'Sınıf görevleri', shop: 'Satın al', sell: 'Sat', bag: 'Çanta genişlet',
  upgrade: 'Yükseltme', craft_blacksmith: 'Üretim', repair: 'Tamir', dismantle: 'Parçalama',
  potions: 'İksirler', craft_healer: 'İksir üretimi', contracts: 'Av sözleşmeleri', bestiary: 'Yaratık rehberi',
  reset_skills: 'Beceri sıfırla', reset_stats: 'Stat sıfırla', storage: 'Ortak depo', storage_expand: 'Depo genişlet',
};

export function openNpc(npcId) {
  const npc = NPCS[npcId];
  const services = npc.services.filter((s) => s !== 'class_quests');
  let cur = null;
  const content = h('div', { class: 'col grow scroll', style: { minWidth: 0 } });
  const svcBox = h('div', { class: 'svc scroll' });
  // başlıkta her zaman görünen cüzdan: gold + çanta doluluğu
  const wallet = h('div', { class: 'wallet', 'data-testid': 'wallet' });
  const shell = ui.shell({ title: npc.name, extra: wallet, onClose: () => { off(); ui.closePanel(); } });
  const portrait = npcSheet(npc.sprite)[0].toCanvas(2);
  const say = h('div', { class: 'say' }, `"${npc.greet}"`);
  const render = () => {
    updateWallet(wallet);
    clear(content);
    content.appendChild(h('div', { class: 'npc-head' }, portrait, h('div', { class: 'grow', style: { minWidth: 0 } }, h('div', { class: 'gold small' }, npc.title), say)));
    if (cur) content.appendChild((SERVICES[cur] || (() => h('div')))(npcId, render));
    clear(svcBox);
    for (const s of services) {
      const badge = s === 'quests' && questsForNpc(app.char, npcId).some((x) => x.status === 'available' || (x.status === 'active' && x.ready)) ? ' ❗' : '';
      svcBox.appendChild(h('button', { class: 'btn small' + (cur === s ? ' blue' : ''), 'data-testid': 'svc-' + s, onTap: () => { sound.play('click'); cur = s; render(); } }, SVC_LABEL[s] + badge));
    }
  };
  // varsayılan hizmet
  const list = questsForNpc(app.char, npcId);
  cur = list.length && services.includes('quests') ? 'quests' : services[0];
  shell.body.append(svcBox, content);
  ui.openPanel('npc', () => shell.el);
  const off = bus.on('changed', () => { if (ui.openName === 'npc' && !ui.layers.modal.firstChild) render(); });
  render();
}

const matsView = (inputs) => h('div', { class: 'mats' }, inputs.map((m) => {
  const have = countStack(app.char.bag, m.id);
  return h('span', { class: have >= m.qty ? 'ok' : 'bad' }, img(iconURL(m.id)), `${STACKABLES[m.id].name} ${have}/${m.qty}`);
}));
const goldView = (g) => h('span', { class: app.char.gold >= g ? 'gold' : 'bad' }, `${fmt(g)} G`);

function updateWallet(el) {
  const ch = app.char;
  clear(el).append(
    h('span', { class: 'wg', title: 'Gold' }, img(iconURL('ui:gold')), h('b', { 'data-testid': 'wallet-gold' }, fmt(ch.gold))),
    h('span', { class: 'wb', title: 'Çanta' }, img(iconURL('ui:bag')), `${ch.bag.slots.filter(Boolean).length}/${ch.bag.size}`));
}

// Satın alma onayı: ne alındığı, toplam fiyat ve alımdan sonra kalacak gold gösterilir
function confirmBuy({ icon, name, qty = 1, price, onOk }) {
  const ch = app.char;
  const total = price * qty, left = ch.gold - total, can = left >= 0;
  ui.confirm({
    title: 'Satın alınsın mı?',
    body: h('div', { class: 'buysum' },
      icon ? img(icon) : null,
      h('div', { class: 'grow' },
        h('b', {}, qty > 1 ? `${name} ×${qty}` : name),
        h('div', { class: 'small' }, 'Fiyat: ', h('b', { class: 'gold' }, `${fmt(total)} G`)),
        h('div', { class: 'small muted' }, 'Gold: ', `${fmt(ch.gold)} → `, h('b', { class: can ? 'ok' : 'bad' }, can ? `${fmt(left)} G` : 'yetersiz')))),
    ok: can ? 'Satın al' : 'Yetersiz Gold', okDisabled: !can,
    onOk,
  });
}

const SERVICES = {
  // ---------------------------------------------------------------- görevler
  quests(npcId, render) {
    const ch = app.char;
    const list = questsForNpc(ch, npcId);
    if (!list.length) return h('div', { class: 'box muted' }, 'Şu an senin için bir görevim yok. Daha güçlendiğinde tekrar uğra.');
    return h('div', { class: 'list' }, list.map(({ q, status }) => {
      const ready = status === 'active' && isReady(ch, q);
      return h('div', { class: 'li', style: { alignItems: 'flex-start' } },
        img(iconURL(q.main ? 'ui:star' : 'ui:quests')),
        h('div', { class: 'grow' },
          h('b', {}, q.name), h('span', { class: 'muted small' }, ` · Lv. ${q.rec}`),
          h('div', { class: 'small' }, q.text),
          h('div', { class: 'tiny gold' }, `Ödül: ${q.exp ? fmt(q.exp) + ' EXP · ' : ''}${fmt(q.gold)} Gold${q.rewardItems.length ? ' · ' + q.rewardItems.map((r) => `${STACKABLES[r.id].name} ×${r.qty}`).join(', ') : ''}${q.skillPoint ? ' · +1 beceri puanı' : ''}${q.mastery ? ' · Ustalık I' : ''}${q.title ? ' · Unvan' : ''}`)),
        status === 'available' ? h('button', { class: 'btn small green', 'data-testid': 'accept-' + q.id, onTap: () => { act.acceptQuest(q.id); render(); } }, 'Kabul et')
          : status === 'lowlevel' ? h('span', { class: 'bad small' }, `Lv.${q.minLevel} gerekli`)
            : status === 'active' && q.turnIn === npcId ? h('button', { class: 'btn small' + (ready ? ' green' : ' dis'), 'data-testid': 'turnin-' + q.id, onTap: () => { act.turnIn(q.id, npcId); render(); } }, ready ? 'Teslim et' : 'Devam ediyor')
              : h('span', { class: 'muted small' }, 'Aktif'));
    }));
  },

  // ---------------------------------------------------------------- tüccar
  shop(npcId, render) {
    const ch = app.char;
    const stock = merchantStock().filter((o) => ITEMS[o.tid].cls === ch.cls || ITEMS[o.tid].cls === 'any');
    const other = merchantStock().filter((o) => !stock.includes(o));
    const info = (o) => ui.modal(h('div', { class: 'card frame' }, h('div', { class: 'cb' }, itemInfo({ tid: o.tid, r: 'N', b: [], p: 0, d: 100 })), h('div', { class: 'acts' }, h('button', { class: 'btn ghost', onTap: () => ui.closeModal() }, 'Kapat'))));
    // kart: simgeye/isme dokununca bilgi, fiyat butonu onay penceresiyle satın alır
    const card = (o) => {
      const t = ITEMS[o.tid];
      return h('div', { class: 'scard' },
        h('div', { class: 'si', onTap: () => info(o) }, img(iconURL(o.tid)),
          h('div', { class: 'grow', style: { minWidth: 0 } }, h('b', { class: 'r-N' }, t.name), h('div', { class: 'tiny muted' }, `${SLOT_NAMES[t.slot]} · Lv.${t.lv}`))),
        h('button', { class: 'btn small green', 'data-testid': 'buyeq-' + o.tid, onTap: () => confirmBuy({ icon: iconURL(o.tid), name: t.name, price: o.price, onOk: () => { act.buyEquip(o.tid); render(); } }) }, goldView(o.price)));
    };
    const bottle = (q) => h('button', { class: 'btn small green', onTap: () => confirmBuy({ icon: iconURL('empty_bottle'), name: 'Boş Şişe', qty: q, price: BOTTLE_PRICE, onOk: () => { act.buyBottle(q); render(); } }) }, `×${q} · ${BOTTLE_PRICE * q} G`);
    return h('div', { class: 'col' },
      h('div', { class: 'shopgrid' }, ...stock.map(card)),
      h('div', { class: 'scard wide' }, h('div', { class: 'si' }, img(iconURL('empty_bottle')), h('div', { class: 'grow' }, h('b', {}, 'Boş Şişe'), h('div', { class: 'tiny muted' }, `İksir üretimi için · Sahip: ${countStack(ch.bag, 'empty_bottle')}`))), bottle(1), bottle(5)),
      h('div', { class: 'small muted' }, 'Diğer sınıfın ekipmanı (depo için)'),
      h('div', { class: 'shopgrid' }, ...other.map(card)));
  },
  sell(npcId, render) {
    const ch = app.char;
    return h('div', { class: 'col' },
      h('div', { class: 'small' }, 'Satmak için eşyaya dokun. Kilitli ve Legendary eşyalar satılamaz.', h('span', { class: 'gold' }, ` Gold: ${fmt(ch.gold)}`)),
      gridView(ch.bag, { cols: Math.max(5, Math.floor((window.innerWidth * 0.55) / (cellSize() + 4))), cell: cellSize(), onTap: (it, i) => showItemCard(it, { where: 'bag', index: i }, 'shop', render) }));
  },
  bag(npcId, render) {
    const ch = app.char;
    const next = BAG_STEPS.find((s) => s > ch.bag.size);
    return h('div', { class: 'box col' }, h('div', {}, `Çanta: ${ch.bag.size} slot`),
      next ? h('button', { class: 'btn green', onTap: () => confirmBuy({ icon: iconURL('ui:bag'), name: `Çanta ${ch.bag.size} → ${next} slot`, price: BAG_EXPAND_COST[next], onOk: () => { act.expandBag(); render(); } }) }, `${ch.bag.size} → ${next} slot (${fmt(BAG_EXPAND_COST[next])} G)`) : h('div', { class: 'ok' }, 'Çanta en büyük boyutta (48).'));
  },

  // ---------------------------------------------------------------- demirci
  upgrade(npcId, render) {
    const ch = app.char;
    const st = SERVICES._up || (SERVICES._up = { sel: null });
    const cands = [];
    for (const s of SLOTS) if (ch.equipment[s] && isUpgradeable(ITEMS[ch.equipment[s].tid])) cands.push({ inst: ch.equipment[s], loc: { where: 'equip', slot: s } });
    ch.bag.slots.forEach((it, i) => { if (it && it.q === undefined && isUpgradeable(ITEMS[it.tid])) cands.push({ inst: it, loc: { where: 'bag', index: i } }); });
    if (!st.sel || !cands.some((c) => c.inst.uid === st.sel)) st.sel = cands[0]?.inst.uid || null;
    const selC = cands.find((c) => c.inst.uid === st.sel);
    const fx = h('div', { class: 'upfx' });
    const res = h('div', { class: 'upres' });
    const list = h('div', { class: 'grid', style: { '--cols': 6 } }, cands.map((c) => itemCell(c.inst, { sel: c.inst.uid === st.sel, onTap: () => { st.sel = c.inst.uid; render(); } })));
    let detail;
    if (!selC) detail = h('div', { class: 'muted' }, 'Yükseltilebilir eşya yok (yüzük/kolye V1\'de yükseltilmez).');
    else {
      const info = upgradeInfo(selC.inst);
      const t = ITEMS[selC.inst.tid];
      fx.appendChild(img(iconURL(t.id)));
      detail = h('div', { class: 'col' },
        h('div', { class: 'row' }, fx, h('div', { class: 'col', style: { gap: '2px' } }, h('div', {}, h('b', { class: 'r-' + selC.inst.r }, `${t.name} +${selC.inst.p}`), selC.loc.where === 'equip' ? h('span', { class: 'muted small' }, ' (kuşanılı)') : null), res)),
        info.ok ? h('div', { class: 'col box' },
          h('div', {}, `+${info.from} → `, h('b', { class: 'gold' }, `+${info.to}`), ` · Başarı şansı `, h('b', { class: info.chance >= 0.75 ? 'ok' : info.chance >= 0.5 ? 'gold' : 'bad' }, `%${Math.round(info.chance * 100)}`)),
          h('div', { class: 'small' }, `Sonraki güç: temel değer +%${info.to * 6} (şu an +%${info.from * 6})`),
          h('div', { class: 'small' }, 'Ücret: ', goldView(info.gold), ` · Nadirlik çarpanı ×${RARITY_INFO[selC.inst.r].upMult}`),
          matsView(info.mats),
          h('div', { class: 'tiny muted' }, 'Başarısızlıkta materyal ve gold harcanır; eşya ASLA kırılmaz, silinmez veya seviyesi düşmez.'),
          h('button', { class: 'btn green', 'data-testid': 'do-upgrade', onTap: () => {
            const r = act.upgrade(selC.loc);
            if (r.ok) {
              fx.className = 'upfx ' + (r.success ? 'ok' : 'fail');
              res.textContent = r.success ? `BAŞARILI! +${r.plus}` : `Başarısız — eşya +${r.plus} olarak korundu`;
              res.className = 'upres ' + (r.success ? 'ok' : 'bad');
              setTimeout(render, 1100);
            }
          } }, 'Yükselt')) : h('div', { class: 'ok' }, info.msg));
    }
    return h('div', { class: 'col' }, h('div', { class: 'row', style: { alignItems: 'flex-start', flexWrap: 'wrap' } }, h('div', { class: 'col' }, h('div', { class: 'small muted' }, 'Eşya seç:'), list), h('div', { class: 'col grow', style: { minWidth: '260px' } }, detail)));
  },
  craft_blacksmith(npcId, render) { return craftList('blacksmith', render); },
  craft_healer(npcId, render) { return craftList('healer', render); },
  repair(npcId, render) {
    const ch = app.char;
    const total = repairAllCost(ch);
    return h('div', { class: 'col' },
      h('div', { class: 'list' }, SLOTS.filter((s) => ch.equipment[s] && isUpgradeable(ITEMS[ch.equipment[s].tid])).map((s) => {
        const it = ch.equipment[s];
        return h('div', { class: 'li' }, img(iconURL(it.tid)), h('div', { class: 'grow' }, h('b', { class: 'r-' + it.r }, ITEMS[it.tid].name), h('div', { class: 'tiny ' + (it.d < 20 ? 'bad' : 'muted') }, `Dayanıklılık ${it.d}/100 · tamir ${repairCost(it)} G`)));
      })),
      h('button', { class: 'btn green' + (total > 0 ? '' : ' dis'), onTap: () => { act.repair(); render(); } }, total > 0 ? ['Hepsini tamir et · ', goldView(total)] : 'Tamir gerekmiyor'),
      h('p', { class: 'tiny muted' }, 'Ölümde kuşanılı ekipman −10 dayanıklılık kaybeder. 0 dayanıklılıkta temel değer %25 düşer.'));
  },
  dismantle(npcId, render) {
    const ch = app.char;
    return h('div', { class: 'col' },
      h('div', { class: 'small' }, 'Parçalamak için eşyaya dokun. N: Hurda · U: Hurda (+şansla Zayıf Öz) · R: Nadir Öz · E: Epic Kalıntısı · Legendary: kapalı.'),
      gridView(ch.bag, { cols: Math.max(5, Math.floor((window.innerWidth * 0.55) / (cellSize() + 4))), cell: cellSize(), filter: (it) => it.q === undefined && it.r !== 'L', onTap: (it, i) => showItemCard(it, { where: 'bag', index: i }, 'normal', render) }));
  },

  // ---------------------------------------------------------------- şifacı
  potions(npcId, render) {
    const ch = app.char;
    const buy = (p, q) => h('button', { class: 'btn small green', 'data-testid': q === 1 ? 'buy-' + p.id : null, onTap: () => confirmBuy({ icon: iconURL(p.id), name: p.name, qty: q, price: p.buy, onOk: () => { act.buyPotion(p.id, q); render(); } }) }, `×${q} · ${fmt(p.buy * q)} G`);
    return h('div', { class: 'shopgrid' }, POTION_LIST.map((p) => h('div', { class: 'scard' },
      h('div', { class: 'si' }, img(iconURL(p.id)), h('div', { class: 'grow', style: { minWidth: 0 } }, h('b', {}, p.name), h('div', { class: 'tiny muted' }, `+${p.amount} ${p.kind.toUpperCase()} · Lv.${p.lv}+ · Sahip: ${countStack(ch.bag, p.id)}`))),
      h('div', { class: 'row', style: { gap: '4px' } }, buy(p, 1), buy(p, 5)))));
  },

  // ---------------------------------------------------------------- avcı
  contracts(npcId, render) {
    const ch = app.char;
    if (ch.quests.s01?.s !== 'done') return h('div', { class: 'box muted' }, 'Önce "Avcının İlk Sözleşmesi" görevini tamamla (Lv.3).');
    if (ch.contract) {
      const c = ch.contract, done = c.p >= c.n;
      return h('div', { class: 'box col' }, h('b', {}, `Aktif sözleşme: ${ENEMIES[c.enemy].name}`), h('div', {}, `${c.p}/${c.n} · Ödül ${c.exp} EXP, ${c.gold} Gold`),
        h('div', { class: 'row' }, h('button', { class: 'btn green' + (done ? '' : ' dis'), onTap: () => { act.claimContract(); render(); } }, 'Ödülü al'),
          h('button', { class: 'btn red small', onTap: () => { act.cancelContract(); render(); } }, 'İptal')));
    }
    const offers = contractOffers(ch);
    return h('div', { class: 'list' }, h('div', { class: 'small muted' }, 'Tekrarlanabilir av sözleşmeleri; günlük sınır yoktur. Ana görevlerden ayrıdır.'),
      offers.map((o) => h('div', { class: 'li' }, img(iconURL('ui:target')),
        h('div', { class: 'grow' }, h('b', {}, `${ENEMIES[o.enemy].name} ×${o.n}`), h('div', { class: 'tiny muted' }, `Lv.${ENEMIES[o.enemy].level} · ${o.exp} EXP · ${o.gold} Gold`)),
        h('button', { class: 'btn small green', onTap: () => { act.acceptContract(o.enemy); render(); } }, 'Al'))));
  },
  bestiary() {
    const zone = {};
    for (const def of Object.values(MAPS)) for (const a of def.areas) { for (const s of a.spawns || []) zone[s.enemy] = `${def.name} · ${a.name || ''}`; if (a.elite) zone[a.elite] = `${def.name} · ${a.name}`; if (a.boss) zone[a.boss] = `${def.name} · ${a.name}`; }
    zone.mine_golem = 'Derin Ocak · Maden Golemi Odası';
    const kills = app.char.record.killsByEnemy;
    return h('div', { class: 'list' }, Object.values(ENEMIES).filter((e) => ['normal', 'elite', 'boss'].includes(e.kind) && !e.variantOf).map((e) => h('div', { class: 'li' },
      h('div', { class: 'grow' }, h('b', { class: e.kind === 'boss' ? 'r-L' : e.kind === 'elite' ? 'r-E' : '' }, `${e.name} · Lv.${e.level}`),
        h('div', { class: 'tiny muted' }, `${zone[e.id] || ''} · HP ${fmt(e.hp)} · ATK ${e.atk} · DEF ${e.def}/${e.mdef} · ${e.exp} EXP · ${e.dmgType === 'magic' ? 'büyü' : 'fiziksel'} · ${({ passive: 'pasif', aggressive: 'agresif', pack: 'sürü çağırır', ranged: 'menzilli', tank: 'tank', elite: 'elit', boss_alpha: 'boss', boss_golem: 'boss' })[e.ai]}`),
        h('div', { class: 'tiny' }, `Öldürülen: ${kills[e.id] || 0}`)))));
  },

  // ---------------------------------------------------------------- bilge
  reset_skills(npcId, render) {
    const ch = app.char;
    const cost = RESET_COST(ch.level);
    return h('div', { class: 'box col' }, h('div', {}, `Harcanan beceri puanı: ${skillPointsSpent(ch)}. Tüm beceriler Rank 1'e döner, puanlar iade edilir.`),
      h('div', {}, 'Ücret: ', cost ? goldView(cost) : h('span', { class: 'ok' }, 'Ücretsiz (Lv.1–10)')),
      h('button', { class: 'btn red', onTap: () => ui.confirm({ title: 'Beceri sıfırla', danger: true, text: 'Emin misin?', ok: 'Sıfırla', onOk: () => { act.resetSkills(); render(); } }) }, 'Becerileri sıfırla'));
  },
  reset_stats(npcId, render) {
    const ch = app.char;
    const cost = RESET_COST(ch.level);
    return h('div', { class: 'box col' }, h('div', {}, `Dağıtılmış stat puanı: ${statPointsSpent(ch)}.`),
      h('div', {}, 'Ücret: ', cost ? goldView(cost) : h('span', { class: 'ok' }, 'Ücretsiz (Lv.1–10)')),
      h('button', { class: 'btn red', onTap: () => ui.confirm({ title: 'Stat sıfırla', danger: true, text: 'Emin misin?', ok: 'Sıfırla', onOk: () => { act.resetStats(); render(); } }) }, 'Statları sıfırla'));
  },

  // ---------------------------------------------------------------- depo
  storage(npcId, render) {
    const ch = app.char, stg = app.profile.storage;
    const cs = Math.max(38, cellSize() - 6);
    const cols = Math.max(5, Math.floor((window.innerWidth * 0.33) / (cs + 4)));
    return h('div', { class: 'col' },
      h('div', { class: 'small muted' }, 'Depo aynı profildeki bütün karakterlerinle ortaktır. Dokunarak taşı.'),
      h('div', { class: 'row', style: { alignItems: 'flex-start', flexWrap: 'wrap' } },
        h('div', { class: 'col' }, h('b', {}, `Çanta (${ch.bag.slots.filter(Boolean).length}/${ch.bag.size})`), gridView(ch.bag, { cols, cell: cs, onTap: (it, i) => { act.deposit(i); render(); } })),
        h('div', { class: 'col' }, h('div', { class: 'row' }, h('b', { class: 'grow' }, `Depo (${stg.slots.filter(Boolean).length}/${stg.size})`), h('button', { class: 'btn small', onTap: () => { act.sortStorage(); render(); } }, 'Sırala')),
          gridView(stg, { cols, cell: cs, onTap: (it, i) => { act.withdraw(i); render(); } }))));
  },
  storage_expand(npcId, render) {
    const stg = app.profile.storage;
    return h('div', { class: 'box col' }, h('div', {}, `Depo: ${stg.size} slot`),
      stg.size < STORAGE_MAX ? h('button', { class: 'btn green', onTap: () => confirmBuy({ icon: iconURL('ui:bag'), name: 'Ortak depo 60 → 90 slot', price: STORAGE_EXPAND_COST, onOk: () => { act.expandStorage(); render(); } }) }, `60 → 90 slot (${fmt(STORAGE_EXPAND_COST)} G)`) : h('div', { class: 'ok' }, 'Depo en büyük boyutta.'));
  },
};

function craftList(station, render) {
  const ch = app.char;
  return h('div', { class: 'list' }, h('div', { class: 'gold' }, `Gold: ${fmt(ch.gold)}`), RECIPES.filter((r) => r.station === station).map((r) => {
    const chk = craftCheck(ch, r.id);
    const outName = ITEMS[r.out.id]?.name || STACKABLES[r.out.id].name;
    const rar = ITEMS[r.out.id]?.rarity;
    return h('div', { class: 'li', style: { alignItems: 'flex-start' } }, img(iconURL(r.out.id)),
      h('div', { class: 'grow' }, h('b', { class: rar ? 'r-' + rar : '' }, `${outName}${r.out.qty > 1 ? ' ×' + r.out.qty : ''}`), rar ? h('span', { class: 'tiny muted' }, ` [${RARITY_INFO[rar].name}, bonuslar üretimde bir kez belirlenir]`) : null,
        matsView(r.inputs), h('div', { class: 'tiny' }, 'Ücret: ', goldView(r.gold))),
      h('button', { class: 'btn small green' + (chk.ok ? '' : ' dis'), 'data-testid': 'craft-' + r.id, onTap: () => { act.craft(r.id); render(); } }, chk.ok ? 'Üret' : chk.msg));
  }));
}

export { itemSellPrice };
