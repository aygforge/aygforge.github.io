// Parti çekirdeği (Faz 1): kodlar, üyelik ve lider, durum paylaşımı ve mesaj bütçesi, sohbet, davetler, güvenilmez veri.
import { describe, it, expect } from 'vitest';
import { Party, Lobby, newPartyCode, normCode, sanitizeState, sanitizeChat, orderMembers, PARTY_MAX, KEEPALIVE_MS, SEND_MS, STALE_MS } from '../../src/online/party.js';
import { createHub } from '../fake-realtime.mjs';

const flush = () => new Promise((r) => setTimeout(r, 0));
function clock(t0 = 1_000_000) { const c = { t: t0, now: () => c.t, add: (ms) => { c.t += ms; } }; return c; }
function player(hub, clk, uid, nick) {
  const events = [];
  const p = new Party({ transport: hub.transport(), me: () => ({ uid, nick }), now: clk.now, onEvent: (e) => events.push(e) });
  p.events = events;
  return p;
}
const st = (m, x, y, extra = {}) => ({ m, x, y, f: 1, mv: 0, hp: 100, lv: 10, n: 'Kahraman', cls: 'archer', d: 0, a: 0, dg: 0, ...extra });

describe('Parti kodu ve güvenilmez veri', () => {
  it('kod 6 karakter, karışan harfler (I, O, 0, 1) yok; normCode küçük harf ve boşluğu düzeltir', () => {
    for (let i = 0; i < 200; i++) { const c = newPartyCode(); expect(c).toMatch(/^[A-HJ-NP-Z2-9]{6}$/); }
    expect(normCode(' k7m-2qx ')).toBe('K7M2QX');
    expect(normCode('ABC')).toBe(null);
    expect(normCode('ABCDE0')).toBe(null);
  });
  it('gelen durum sınırlanır: uzun ad kesilir, bilinmeyen sınıf, taşan sayılar, kontrol karakterleri', () => {
    const s = sanitizeState({ u: 'x', m: 'forest', x: -50, y: 1e9, hp: 500, lv: 99, n: 'Ç'.repeat(40), cls: 'hacker', nick: 'a\u0000b', f: -3 });
    expect(s).toMatchObject({ x: 0, y: 1e5, hp: 100, lv: 50, cls: 'warrior', nick: 'ab', f: -1 });
    expect(s.n.length).toBe(16);
    expect(sanitizeState({ m: 'x' })).toBe(null);
    expect(sanitizeChat('  merhaba \n\n  dünya  ')).toBe('merhaba dünya');
    expect(sanitizeChat('x'.repeat(500)).length).toBe(120);
  });
  it('üyeler katılma sırasına göre; ilk gelen lider; aynı kişi bir kez', () => {
    const o = orderMembers([{ uid: 'b', nick: 'B', joinedAt: 20 }, { uid: 'a', nick: 'A', joinedAt: 10 }, { uid: 'b', nick: 'B2', joinedAt: 30 }]);
    expect(o.map((x) => x.uid)).toEqual(['a', 'b']);
  });
});

describe('Parti akışı (bellek içi anlık bağlantı)', () => {
  it('kur → kodla katıl → iki taraf da birbirini görür; lider kuran kişi; haritada konum paylaşılır', async () => {
    const hub = createHub(), clk = clock();
    const a = player(hub, clk, 'ua', 'Ayg'), b = player(hub, clk, 'ub', 'Bora');
    const r = a.create();
    expect(r.ok).toBe(true);
    await flush();
    expect(a.status).toBe('in');
    clk.add(10);
    expect(b.join(r.code.toLowerCase()).ok).toBe(true);
    await flush();
    expect(a.members.map((m) => m.uid)).toEqual(['ua', 'ub']);
    expect(b.leaderUid).toBe('ua');
    expect(a.events.some((e) => e.type === 'member-join' && e.nick === 'Bora')).toBe(true);
    // ilk durum her iki taraftan da hemen gider
    expect(a.tick(st('forest', 100, 100))).toBe(true);
    expect(b.tick(st('forest', 300, 120, { cls: 'mage', lv: 7 }))).toBe(true);
    expect(a.others()[0]).toMatchObject({ uid: 'ub', nick: 'Bora', fresh: true });
    expect(a.others()[0].st).toMatchObject({ m: 'forest', x: 300, cls: 'mage', lv: 7 });
    expect(b.others()[0].st).toMatchObject({ x: 100, nick: 'Ayg' });
  });

  it('mesaj bütçesi: hareket ederken en sık SEND_MS, dururken sessiz, yalnızken konum gönderilmez, KEEPALIVE yoklaması', async () => {
    const hub = createHub(), clk = clock();
    const a = player(hub, clk, 'ua', 'Ayg'), b = player(hub, clk, 'ub', 'Bora');
    const { code } = a.create(); b.join(code); await flush();
    a.tick(st('forest', 0, 0)); b.tick(st('forest', 500, 500));
    const s0 = hub.stats.sent;
    // 10 sn boyunca 100 ms'de bir hareket (≈10 Hz çağrı) → en çok 10000/SEND_MS gönderim
    for (let i = 1; i <= 100; i++) { clk.add(100); a.tick(st('forest', i * 3, 0, { mv: 1 })); }
    const moving = hub.stats.sent - s0;
    expect(moving).toBeGreaterThanOrEqual(Math.floor(10000 / SEND_MS) - 2);
    expect(moving).toBeLessThanOrEqual(Math.ceil(10000 / SEND_MS) + 1);
    // durdu: bir son konum, sonra sessiz
    clk.add(100); a.tick(st('forest', 303, 0, { mv: 0 }));
    const s1 = hub.stats.sent;
    for (let i = 0; i < 100; i++) { clk.add(100); a.tick(st('forest', 303, 0)); }
    expect(hub.stats.sent - s1).toBe(0);
    // KEEPALIVE dolunca bir yoklama
    clk.add(KEEPALIVE_MS); a.tick(st('forest', 303, 0));
    expect(hub.stats.sent - s1).toBe(1);
    // arkadaş başka haritadaysa yürürken konum gitmez; harita değişimi hemen gider
    b.tick(st('village', 10, 10));
    const s2 = hub.stats.sent;
    for (let i = 1; i <= 50; i++) { clk.add(100); a.tick(st('forest', 303 + i * 3, 0, { mv: 1 })); }
    expect(hub.stats.sent - s2).toBe(0);
    clk.add(100); expect(a.tick(st('village', 50, 50))).toBe(true);
    expect(b.events.some((e) => e.type === 'member-map' && e.map === 'village' && e.uid === 'ua')).toBe(true);
  });

  it('sohbet iki tarafa gider, kendi mesajım da günlükte; çok hızlı mesaj reddedilir', async () => {
    const hub = createHub(), clk = clock();
    const a = player(hub, clk, 'ua', 'Ayg'), b = player(hub, clk, 'ub', 'Bora');
    const { code } = a.create(); b.join(code); await flush();
    expect(a.sendChat('  selam, ormanda buluşalım ').ok).toBe(true);
    expect(a.sendChat('ikinci').ok).toBe(false);
    clk.add(800);
    expect(a.sendChat('ikinci').ok).toBe(true);
    expect(b.chat.map((c) => c.text)).toEqual(['selam, ormanda buluşalım', 'ikinci']);
    expect(b.chat[0].nick).toBe('Ayg');
    expect(a.chat.every((c) => c.self)).toBe(true);
  });

  it('ayrılan ya da bağlantısı kopan üye listeden düşer; sessiz kalan üye bayat sayılır', async () => {
    const hub = createHub(), clk = clock();
    const a = player(hub, clk, 'ua', 'Ayg'), b = player(hub, clk, 'ub', 'Bora'), c = player(hub, clk, 'uc', 'Cem');
    const { code } = a.create(); b.join(code); c.join(code); await flush();
    a.tick(st('forest', 0, 0)); b.tick(st('forest', 1, 1)); c.tick(st('forest', 2, 2));
    expect(a.members.length).toBe(3);
    b.leave();
    expect(a.members.map((m) => m.uid)).toEqual(['ua', 'uc']);
    expect(a.events.some((e) => e.type === 'member-leave' && e.nick === 'Bora')).toBe(true);
    c.ch.drop();
    expect(a.members.map((m) => m.uid)).toEqual(['ua']);
    // presence gelmeden yalnız durumla görünen üye STALE_MS sonra listeden düşer
    a.onBroadcast('st', { u: 'ux', nick: 'Hayalet', m: 'forest', x: 1, y: 1, lv: 3, cls: 'mage' });
    expect(a.members.some((m) => m.uid === 'ux')).toBe(true);
    clk.add(STALE_MS + 1);
    expect(a.members.some((m) => m.uid === 'ux')).toBe(false);
  });

  it(`parti en çok ${PARTY_MAX} kişi: sonradan gelen "dolu" uyarısıyla çıkar`, async () => {
    const hub = createHub(), clk = clock();
    const ps = ['a', 'b', 'c', 'd', 'e'].map((u) => player(hub, clk, 'u' + u, u.toUpperCase()));
    const { code } = ps[0].create(); await flush();
    for (const p of ps.slice(1)) { clk.add(10); p.join(code); await flush(); }
    expect(ps[4].inParty).toBe(false);
    expect(ps[4].events.some((e) => e.type === 'full')).toBe(true);
    expect(ps[0].members.length).toBe(PARTY_MAX);
  });

  it('davet: yalnız hedef oyuncuya gider; kabul/ret yanıtı gönderene döner; davet sıklığı sınırlı', async () => {
    const hub = createHub();
    const got = { a: [], b: [], c: [] }, replies = [];
    const mk = (uid, nick, k) => new Lobby({ transport: hub.transport(), me: () => ({ uid, nick }), onInvite: (i) => got[k].push(i), onReply: (r) => replies.push(r) });
    const la = mk('ua', 'Ayg', 'a'), lb = mk('ub', 'Bora', 'b'), lc = mk('uc', 'Cem', 'c');
    la.start(); lb.start(); lc.start(); await flush();
    expect(la.invite('ub', 'K7M2QX').ok).toBe(true);
    expect(la.invite('ub', 'K7M2QX').ok).toBe(false);
    expect(got.b).toEqual([{ from: 'ua', nick: 'Ayg', code: 'K7M2QX' }]);
    expect(got.c.length).toBe(0);
    lb.reply('ua', true);
    expect(replies).toEqual([{ from: 'ub', nick: 'Bora', ok: true }]);
    // bozuk kodlu davet yok sayılır
    lc.ch.send('inv', { to: 'ub', from: 'uc', nick: 'Cem', code: 'bozuk!' });
    expect(got.b.length).toBe(1);
  });
});
