// Ticaret penceresi: solda benim teklifim (çantadan eşya/malzeme + altın), sağda karşı teklif.
// İki taraf "Kilitle" der → ikisi de "Onayla" der → takas iki tarafta hep-ya-hiç uygulanır ve hemen kaydedilir.
import { h, clear, fmt } from '../dom.js';
import { ui } from '../ui.js';
import { bus } from '../../core/events.js';
import { app } from '../../core/app.js';
import { ITEMS } from '../../data/items.js';
import { STACKABLES } from '../../data/materials.js';
import { RARITY_INFO } from '../../data/constants.js';
import { iconURL } from '../../art/icons.js';
import { trade } from '../../online/trade.js';
import { offerable, TRADE_MAX_ITEMS, TRADE_MAX_STACKS } from '../../systems/trade.js';

const toast = (text, kind = 'info') => bus.emit('toast', { text, kind });

function itemLine(it, onTap, testid) {
  const t = ITEMS[it.tid];
  const col = RARITY_INFO[it.r]?.color || '#ddd';
  return h('div', { class: 'row small trade-it' + (onTap ? ' ia' : ''), 'data-testid': testid, onTap },
    h('img', { src: iconURL(it.tid), class: 'px', alt: '', style: { width: '22px', height: '22px' } }),
    h('span', { class: 'grow', style: { color: col } }, `${t?.name || it.tid}${it.p ? ' +' + it.p : ''}`),
    h('span', { class: 'tiny muted' }, `Lv.${t?.lv ?? '?'}`));
}
function stackLine(st, onTap, testid) {
  return h('div', { class: 'row small trade-it' + (onTap ? ' ia' : ''), 'data-testid': testid, onTap },
    h('img', { src: iconURL(st.tid), class: 'px', alt: '', style: { width: '22px', height: '22px' } }),
    h('span', { class: 'grow' }, STACKABLES[st.tid]?.name || st.tid),
    h('b', {}, '×' + st.q));
}

function offerView(o, editable) {
  const box = h('div', { class: 'col' });
  if (!o.items.length && !o.stacks.length && !o.gold) box.append(h('p', { class: 'tiny muted' }, 'Henüz bir şey konmadı'));
  for (const it of o.items) box.append(itemLine(it, editable ? () => edit({ removeItem: it.uid }) : null, editable ? 'trade-mine-item' : 'trade-their-item'));
  for (const st of o.stacks) box.append(stackLine(st, editable ? () => edit({ removeStack: st.tid }) : null, editable ? 'trade-mine-stack' : 'trade-their-stack'));
  if (o.gold) box.append(h('div', { class: 'row small' }, h('b', { class: 'gold' }, `${fmt(o.gold)} Gold`)));
  return box;
}

// teklif değişikliği (sunucuya gider; iki tarafın kilidi açılır)
function edit({ addItem, removeItem, addStack, removeStack, gold } = {}) {
  const s = trade.session;
  if (!s) return;
  const cur = { items: s.mine.items.map((i) => i), stacks: s.mine.stacks.map((x) => ({ ...x })), gold: s.mine.gold };
  if (addItem) {
    if (cur.items.length >= TRADE_MAX_ITEMS) { toast(`En çok ${TRADE_MAX_ITEMS} eşya`, 'warn'); return; }
    if (!cur.items.some((i) => i.uid === addItem.uid)) cur.items.push(addItem);
  }
  if (removeItem) cur.items = cur.items.filter((i) => i.uid !== removeItem);
  if (addStack) {
    const e = cur.stacks.find((x) => x.tid === addStack.tid);
    if (e) e.q = addStack.q; else if (cur.stacks.length < TRADE_MAX_STACKS) cur.stacks.push({ ...addStack }); else { toast(`En çok ${TRADE_MAX_STACKS} malzeme türü`, 'warn'); return; }
  }
  if (removeStack) cur.stacks = cur.stacks.filter((x) => x.tid !== removeStack);
  if (gold != null) cur.gold = gold;
  const r = trade.setOffer(cur);
  if (!r.ok && r.msg) toast(r.msg, 'warn');
}

export function openTrade() {
  const s0 = trade.session;
  if (!s0) return;
  const body = h('div', { class: 'col' });
  const goldIn = h('input', { class: 'name', type: 'number', min: 0, step: 1, placeholder: 'Gold', 'data-testid': 'trade-gold', style: { maxWidth: '110px' } });
  goldIn.addEventListener('change', () => edit({ gold: Math.max(0, Math.floor(+goldIn.value || 0)) }));
  const render = () => {
    const s = trade.session;
    if (!s) { if (body.isConnected) ui.closeModal(); off.forEach((f) => f()); return; }
    if (!body.isConnected && body.dataset.m) { off.forEach((f) => f()); return; }
    body.dataset.m = '1';
    clear(body);
    const ch = app.char;
    // çanta: teklif edilebilecekler (istifler türe göre toplanır)
    const inOffer = new Set(s.mine.items.map((i) => i.uid));
    const stacks = new Map();
    const items = [];
    for (const o of offerable(ch)) {
      if (o.kind === 'stack') stacks.set(o.tid, (stacks.get(o.tid) || 0) + o.q);
      else if (!inOffer.has(o.inst.uid)) items.push(o.inst);
    }
    const bag = h('div', { class: 'col scroll', style: { maxHeight: '26vh' }, 'data-testid': 'trade-bag' });
    for (const it of items) bag.append(itemLine(it, () => edit({ addItem: it }), 'trade-bag-item'));
    for (const [tid, q] of stacks) {
      const offered = s.mine.stacks.find((x) => x.tid === tid)?.q || 0;
      if (offered >= q) continue;
      bag.append(stackLine({ tid, q: q - offered }, () => edit({ addStack: { tid, q } }), 'trade-bag-stack'));
    }
    if (!bag.firstChild) bag.append(h('p', { class: 'tiny muted' }, 'Çantada verilebilecek eşya yok (kilitli eşyalar ve görev eşyaları takas edilemez)'));
    if (document.activeElement !== goldIn) goldIn.value = s.mine.gold || '';
    const lockMe = !!s.lock.me, lockThem = !!s.lock.them;
    const st = s.phase === 'prep' ? 'Takas yapılıyor…'
      : s.conf.me && !s.conf.them ? 'Onayladın — karşı taraf bekleniyor'
      : lockMe && lockThem ? 'İkiniz de kilitlediniz — Onayla'
      : lockMe ? 'Kilitledin — karşı taraf bekleniyor' : lockThem ? 'Karşı taraf kilitledi' : 'Teklifinizi hazırlayın';
    body.append(
      h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' } },
        h('div', { class: 'col box', style: { flex: '1 1 200px', borderColor: lockMe ? '#5ee07a' : '' }, 'data-testid': 'trade-mine' },
          h('b', {}, 'Senin teklifin' + (lockMe ? ' 🔒' : '')), offerView(s.mine, !lockMe && s.phase === 'open'),
          h('div', { class: 'row small' }, h('span', { class: 'muted' }, 'Gold:'), goldIn, h('span', { class: 'tiny muted' }, `(${fmt(ch.gold)} var)`))),
        h('div', { class: 'col box', style: { flex: '1 1 200px', borderColor: lockThem ? '#5ee07a' : '' }, 'data-testid': 'trade-theirs' },
          h('b', {}, `${s.with.nick} teklifi` + (lockThem ? ' 🔒' : '')), offerView(s.theirs, false))),
      h('p', { class: 'small', 'data-testid': 'trade-status' }, st),
      lockMe ? null : h('div', { class: 'col' }, h('b', { class: 'small' }, 'Çantan — eklemek için dokun'), bag),
      h('div', { class: 'row', style: { justifyContent: 'flex-end', flexWrap: 'wrap' } },
        h('button', { class: 'btn ghost', 'data-testid': 'trade-cancel', onTap: () => trade.cancel() }, 'İptal'),
        h('button', { class: 'btn' + (lockMe ? '' : ' green'), 'data-testid': 'trade-lock', onTap: () => trade.lock(!lockMe) }, lockMe ? 'Kilidi aç' : 'Kilitle'),
        h('button', { class: 'btn green' + (lockMe && lockThem && !s.conf.me ? '' : ' dis'), 'data-testid': 'trade-confirm', onTap: () => { if (lockMe && lockThem) trade.confirm(); } }, 'Onayla')),
      h('p', { class: 'tiny muted' }, 'Bir taraf teklifi değiştirirse kilitler açılır. Takas iki tarafta aynı anda uygulanır ve hemen kaydedilir; eşya ya da yer yetmezse hiçbir şey değişmez.'));
  };
  const off = [bus.on('trade', render), bus.on('changed', render)];
  ui.modal(h('div', { class: 'dlg frame scroll', style: { maxHeight: '94vh', minWidth: 'min(560px, 94vw)' }, 'data-testid': 'trade-dlg' },
    h('h3', { class: 't' }, `Ticaret — ${s0.with.nick}`), body), { dismiss: false });
  render();
}

// gelen istek ve açılış
export function bindTradeUi() {
  bus.on('tradeRequest', (inv) => {
    ui.modal(h('div', { class: 'dlg frame', 'data-testid': 'trade-req' }, h('h3', { class: 't' }, 'Ticaret isteği'),
      h('p', {}, h('b', {}, inv.nick), ' seninle ticaret yapmak istiyor.'),
      h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
        h('button', { class: 'btn ghost', 'data-testid': 'trade-req-no', onTap: () => { ui.closeModal(); trade.answer(false); } }, 'Reddet'),
        h('button', { class: 'btn green', 'data-testid': 'trade-req-ok', onTap: () => { ui.closeModal(); trade.answer(true); } }, 'Kabul et'))));
  });
  bus.on('tradeOpen', () => openTrade());
}
