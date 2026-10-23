// Ticaret: teklif doğrulama, hep-ya-hiç uygulama, görev eşyası/kilitli eşya yasağı, sunucu aracılığı (akış, sıfırlanan
// kilitler, hazırlık reddi, kopma).
import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/rng.js';
import { createCharacter } from '../../src/systems/character.js';
import { addStack, countStack, firstFree } from '../../src/systems/inventory.js';
import { createItem } from '../../src/systems/loot.js';
import { ITEM_LIST } from '../../src/data/items.js';
import { QUEST_ITEM_LIST } from '../../src/data/materials.js';
import { offerable, sanitizeOffer, canTrade, applyTrade } from '../../src/systems/trade.js';
import { Hub } from '../../server/hub.mjs';
import { GAME_VERSION } from '../../src/data/constants.js';

const rng = new Rng(11);
function char(name) {
  const c = createCharacter({ name, cls: 'warrior', slot: 0 }, rng);
  c.gold = 1000;
  return c;
}
function give(c, n = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = ITEM_LIST[i + 3];
    const inst = createItem(t.id, t.allowedRarities.at(-1), rng);
    c.bag.slots[firstFree(c.bag)] = inst;
    out.push(inst);
  }
  return out;
}

describe('Ticaret kuralları', () => {
  it('kilitli eşya ve görev eşyası teklif edilemez; gelen teklif temizlenir', () => {
    const a = char('Ayg');
    const [x, y] = give(a, 2);
    y.lock = true;
    addStack(a.bag, 'hp_s', 5);
    const q = QUEST_ITEM_LIST[0].id;
    addStack(a.bag, q, 1);
    const off = offerable(a);
    expect(off.some((o) => o.inst?.uid === x.uid)).toBe(true);
    expect(off.some((o) => o.inst?.uid === y.uid)).toBe(false);
    expect(off.some((o) => o.tid === q)).toBe(false);
    const clean = sanitizeOffer({ items: [{ ...x, lock: true }, { uid: 'u', tid: 'YOK', r: 'L' }], stacks: [{ tid: 'hp_s', q: 3 }, { tid: q, q: 1 }, { tid: 'hp_s', q: 2 }], gold: -5 });
    expect(clean.items.length).toBe(1);
    expect(clean.items[0].lock).toBeUndefined();
    expect(clean.stacks).toEqual([{ tid: 'hp_s', q: 5 }]);
    expect(clean.gold).toBe(0);
  });

  it('takas: eşya, istif ve altın iki tarafta doğru el değiştirir', () => {
    const a = char('Ayg'), b = char('Bora');
    const [x] = give(a, 1);
    addStack(b.bag, 'hp_s', 10);
    const offA = sanitizeOffer({ items: [x], gold: 200 });
    const offB = sanitizeOffer({ stacks: [{ tid: 'hp_s', q: 4 }], gold: 50 });
    expect(canTrade(a, offA, offB).ok).toBe(true);
    expect(canTrade(b, offB, offA).ok).toBe(true);
    expect(applyTrade(a, offA, offB).ok).toBe(true);
    expect(applyTrade(b, offB, offA).ok).toBe(true);
    expect(a.bag.slots.some((s) => s?.uid === x.uid)).toBe(false);
    expect(b.bag.slots.some((s) => s?.uid === x.uid)).toBe(true);
    expect(countStack(a.bag, 'hp_s')).toBe(4);
    expect(countStack(b.bag, 'hp_s')).toBe(6);
    expect(a.gold).toBe(1000 - 200 + 50);
    expect(b.gold).toBe(1000 - 50 + 200);
  });

  it('hep-ya-hiç: eşya artık yoksa, altın yetmezse ya da çanta doluysa hiçbir şey değişmez', () => {
    const a = char('Ayg'), b = char('Bora');
    const [x] = give(a, 1);
    const before = JSON.stringify(a.bag);
    expect(applyTrade(a, sanitizeOffer({ gold: 5000 }), sanitizeOffer({})).ok).toBe(false);
    a.bag.slots[a.bag.slots.findIndex((s) => s?.uid === x.uid)] = null;   // eşya satıldı
    expect(applyTrade(a, sanitizeOffer({ items: [x] }), sanitizeOffer({ gold: 10 })).ok).toBe(false);
    expect(a.gold).toBe(1000);
    // b'nin çantası dolu: gelen eşya sığmaz
    for (let i = 0; i < b.bag.size; i++) if (!b.bag.slots[i]) b.bag.slots[i] = createItem(ITEM_LIST[1].id, ITEM_LIST[1].allowedRarities[0], rng);
    const [y] = give(char('C'), 1);
    const r = canTrade(b, sanitizeOffer({}), sanitizeOffer({ items: [y] }));
    expect(r.ok).toBe(false); expect(r.msg).toMatch(/yer yok/);
    void before;
  });
});

// --------------------------------------------------------------------------- sunucu aracılığı
function fakeWs() {
  const ws = { sent: [], readyState: 1, handlers: {} };
  ws.on = (ev, fn) => { ws.handlers[ev] = fn; };
  ws.send = (s) => ws.sent.push(JSON.parse(s));
  ws.close = () => ws.handlers.close?.();
  ws.ping = () => {};
  ws.msg = (m) => ws.handlers.message(JSON.stringify(m));
  ws.trades = (op) => ws.sent.filter((m) => m.t === 'trade' && (!op || m.op === op));
  return ws;
}
const verify = async (tok) => ({ uid: tok, email: tok + '@x' });
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('Ticaret sunucu aracılığı', () => {
  async function pair() {
    const hub = new Hub({ verify });
    const a = fakeWs(), b = fakeWs();
    hub.attach(a); hub.attach(b);
    a.msg({ t: 'hello', token: 'ua', v: GAME_VERSION, nick: 'Ayg' }); b.msg({ t: 'hello', token: 'ub', v: GAME_VERSION, nick: 'Bora' });
    await tick();
    return { hub, a, b };
  }

  it('istek → kabul → teklif → kilit → onay → hazırlık → yürütme', async () => {
    const { hub, a, b } = await pair();
    a.msg({ t: 'trade', op: 'req', to: 'ub' });
    expect(b.trades('req')[0]).toMatchObject({ from: 'ua', nick: 'Ayg' });
    b.msg({ t: 'trade', op: 'ans', from: 'ua', ok: true });
    const id = a.trades('open')[0].id;
    expect(b.trades('open')[0]).toMatchObject({ id, with: { uid: 'ua', nick: 'Ayg' } });
    const item = createItem(ITEM_LIST[5].id, ITEM_LIST[5].allowedRarities[0], rng);
    a.msg({ t: 'trade', op: 'offer', id, offer: { items: [item], gold: 10 } });
    b.msg({ t: 'trade', op: 'offer', id, offer: { stacks: [{ tid: 'hp_s', q: 3 }] } });
    expect(b.trades('state').at(-1).theirs.items[0].uid).toBe(item.uid);
    a.msg({ t: 'trade', op: 'lock', id, on: true });
    a.msg({ t: 'trade', op: 'confirm', id });                // karşı taraf kilitlemeden onay geçmez
    expect(a.trades('prep').length).toBe(0);
    b.msg({ t: 'trade', op: 'lock', id, on: true });
    a.msg({ t: 'trade', op: 'confirm', id }); b.msg({ t: 'trade', op: 'confirm', id });
    expect(a.trades('prep')[0]).toMatchObject({ give: { gold: 10 }, get: { stacks: [{ tid: 'hp_s', q: 3 }] } });
    a.msg({ t: 'trade', op: 'ready', id, ok: true });
    expect(a.trades('exec').length).toBe(0);
    b.msg({ t: 'trade', op: 'ready', id, ok: true });
    expect(a.trades('exec')[0].get.stacks[0]).toEqual({ tid: 'hp_s', q: 3 });
    expect(b.trades('exec')[0].get.items[0].uid).toBe(item.uid);
    expect(hub.trades.size).toBe(0);
  });

  it('teklif değişince kilitler açılır; hazırlıkta "yer yok" diyen taraf ticareti iptal eder; kopma iptal eder', async () => {
    const { hub, a, b } = await pair();
    a.msg({ t: 'trade', op: 'req', to: 'ub' }); b.msg({ t: 'trade', op: 'ans', from: 'ua', ok: true });
    const id = a.trades('open')[0].id;
    a.msg({ t: 'trade', op: 'lock', id, on: true }); b.msg({ t: 'trade', op: 'lock', id, on: true });
    b.msg({ t: 'trade', op: 'offer', id, offer: { gold: 5 } });
    expect(a.trades('state').at(-1).lock).toEqual({ me: false, them: false });
    a.msg({ t: 'trade', op: 'lock', id, on: true }); b.msg({ t: 'trade', op: 'lock', id, on: true });
    a.msg({ t: 'trade', op: 'confirm', id }); b.msg({ t: 'trade', op: 'confirm', id });
    b.msg({ t: 'trade', op: 'ready', id, ok: false, msg: 'Çantada yer yok' });
    expect(a.trades('cancel')[0].msg).toMatch(/yer yok/);
    expect(hub.trades.size).toBe(0);
    // yeni ticaret, sonra kopma
    a.msg({ t: 'trade', op: 'req', to: 'ub' }); b.msg({ t: 'trade', op: 'ans', from: 'ua', ok: true });
    expect(hub.trades.size).toBe(1);
    b.close();
    expect(a.trades('cancel').at(-1).msg).toMatch(/bağlantı/);
    expect(hub.trades.size).toBe(0);
  });

  it('reddedilen istek ve çevrimdışı hedef', async () => {
    const { a, b } = await pair();
    a.msg({ t: 'trade', op: 'req', to: 'yok' });
    expect(a.trades('err')[0].msg).toMatch(/sunucusunda değil/);
    a.msg({ t: 'trade', op: 'req', to: 'ub' });
    b.msg({ t: 'trade', op: 'ans', from: 'ua', ok: false });
    expect(a.trades('declined')[0].nick).toBe('Bora');
  });
});
