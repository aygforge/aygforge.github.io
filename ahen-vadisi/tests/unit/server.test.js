// Ortak dünya sunucusu (server/): bölge simülasyonu, yapay zekâ, alan yetenekleri, ödül paylaşımı, elit kuralı,
// merkez (kimlik, sürüm, kanallar, parti bilgisi).
import { describe, it, expect } from 'vitest';
import { Zone, sharePerMember, isSharedMap, SHARE_RANGE } from '../../server/sim/zone.mjs';
import { Hub } from '../../server/hub.mjs';
import { ENEMIES } from '../../src/data/enemies.js';
import { ELITE_RULE } from '../../src/data/maps/index.js';
import { TILE, GAME_VERSION } from '../../src/data/constants.js';

function mkZone(map = 'forest', parties = {}) {
  const box = new Map();
  const out = (uid, m) => { if (!box.has(uid)) box.set(uid, []); box.get(uid).push(m); };
  const z = new Zone(map, { out, partyOf: (uid) => parties[uid] || null });
  z.box = box;
  z.evs = (uid, k) => (box.get(uid) || []).filter((m) => m.t === 'evs').flatMap((m) => m.l).filter((e) => !k || e.k === k);
  return z;
}
const run = (z, sec, dt = 0.05) => { for (let t = 0; t < sec; t += dt) z.tick(dt); };

describe('Bölge simülasyonu', () => {
  it('açık dünya haritaları ortak, dungeon\'lar değil; kamp yuvaları haritadaki kadar doğar', () => {
    expect(isSharedMap('forest')).toBe(true);
    expect(isSharedMap('dungeon')).toBe(false);
    expect(isSharedMap('yok')).toBe(false);
    const z = mkZone('forest');
    expect(z.slots.length).toBe(27);
    expect(z.enemies.length).toBe(27);
    expect(z.elites.length).toBe(1);
  });

  it('giren oyuncuya görüş alanındaki yaratıklar gelir; yakındaki saldırgan yaratık ona saldırır ve vurur', () => {
    const z = mkZone('forest');
    const e = z.enemies.find((x) => x.tpl.ai === 'aggressive' || x.tpl.ai === 'pack');
    // oyuncuyu yaratığın yanına (aynı yürünebilir kareye yakın) koy
    z.join('a', { x: e.x + 20, y: e.y, lv: 3 });
    const zoneMsg = z.box.get('a').find((m) => m.t === 'zone');
    expect(zoneMsg.e.some((x) => x.id === e.id)).toBe(true);
    run(z, 4);
    expect(e.target).toBe('a');
    expect(z.evs('a', 'eh').some((h) => h.e === e.id)).toBe(true);
    expect(z.box.get('a').some((m) => m.t === 'snap')).toBe(true);
  });

  it('güvenli bölgedeki oyuncuya saldırılmaz (köy)', () => {
    const z = mkZone('village');
    const e = z.enemies[0];
    z.join('a', { x: e.x + 10, y: e.y });
    run(z, 3);
    expect(z.evs('a', 'eh').length).toBe(0);
  });

  it('vuruşlar sunucuda toplanır; öldüren tek oyuncu tam pay alır, herkes ölümü görür', () => {
    const z = mkZone('forest');
    const e = z.enemies[0];
    z.join('a', { x: e.x + 30, y: e.y }); z.join('b', { x: e.x + 40, y: e.y });
    z.onHit('a', e.id, e.maxHp / 2);
    expect(e.hp).toBeCloseTo(e.maxHp / 2, 0);
    z.onHit('a', e.id, e.maxHp);
    z.flush();
    expect(e.dead).toBe(true);
    expect(z.evs('b', 'die').some((d) => d.e === e.id)).toBe(true);
    const kills = z.evs('a', 'kill');
    expect(kills).toEqual([expect.objectContaining({ e: e.id, tpl: e.tpl.id, share: 1, n: 1, killer: 1 })]);
    expect(z.evs('b', 'kill').length).toBe(0);   // vurmayan, partisiz oyuncu ödül almaz
    // ölü yaratığa ikinci vuruş yok sayılır
    z.onHit('a', e.id, 50);
    run(z, 0.6);
    expect(z.slots.find((s) => s === e.spawnRef).respawnAt).toBeGreaterThan(0);
  });

  it('parti: yakındaki üyeler EXP/altını bonuslu paylaşır (2 kişi ×0,6), uzaktaki üye ve yabancı almaz', () => {
    expect(sharePerMember(1)).toBe(1);
    expect(sharePerMember(2)).toBeCloseTo(0.6);
    expect(sharePerMember(4)).toBeCloseTo(0.4);
    const z = mkZone('forest', { a: 'ahen-party-K7M2QX', b: 'ahen-party-K7M2QX', c: 'ahen-party-K7M2QX' });
    const e = z.enemies[0];
    z.join('a', { x: e.x + 30, y: e.y });
    z.join('b', { x: e.x - 30, y: e.y });                    // vurmadı ama yakında → payını alır
    z.join('c', { x: e.x + SHARE_RANGE + 200, y: e.y });     // çok uzakta
    z.join('d', { x: e.x + 10, y: e.y });                    // partisiz yabancı
    z.onHit('a', e.id, e.maxHp + 1);
    z.flush();
    expect(z.evs('a', 'kill')[0]).toMatchObject({ share: 0.6, n: 2, killer: 1 });
    expect(z.evs('b', 'kill')[0]).toMatchObject({ share: 0.6, n: 2, killer: 0 });
    expect(z.evs('c', 'kill').length).toBe(0);
    expect(z.evs('d', 'kill').length).toBe(0);
  });

  it('iki ayrı grup aynı yaratığa vurursa ikisi de kendi payını alır', () => {
    const z = mkZone('forest', { a: 'ahen-party-AAAAAA', b: 'ahen-party-AAAAAA' });
    const e = z.enemies[0];
    z.join('a', { x: e.x + 30, y: e.y }); z.join('b', { x: e.x - 30, y: e.y }); z.join('x', { x: e.x, y: e.y + 30 });
    z.onHit('x', e.id, 10);
    z.onHit('a', e.id, e.maxHp);
    z.flush();
    expect(z.evs('x', 'kill')[0]).toMatchObject({ share: 1, n: 1, killer: 0 });
    expect(z.evs('a', 'kill')[0]).toMatchObject({ share: 0.6, n: 2 });
  });

  it('elit kuralı: kampında yeterli öldürme + süre dolunca herkes için tek elit doğar ve duyurulur', () => {
    const z = mkZone('forest');
    const el = z.elites[0];
    z.join('a', { x: el.area.x * TILE + 200, y: el.area.y * TILE });
    const campSlots = z.slots.filter((s) => s.area === el.area);
    expect(campSlots.length).toBeGreaterThan(0);
    for (let i = 0; i < ELITE_RULE.killsNeeded; i++) {
      const s = campSlots[i % campSlots.length];
      if (!s.ent || s.ent.dead) z.spawnSlot(s);
      z.onHit('a', s.ent.id, s.ent.maxHp + 1);
    }
    expect(z.eliteState.kills).toBe(ELITE_RULE.killsNeeded);
    z.eliteState.lastDeath = -1e12;
    run(z, 0.6);
    expect(el.ent && !el.ent.dead).toBe(true);
    expect(el.ent.tpl.id).toBe(el.enemy);
    expect(z.evs('a', 'note')[0].s).toMatch(/ortaya çıktı/);
  });

  it('elit alan yeteneği telegrafla duyurulur ve alandaki HER oyuncuyu vurur', () => {
    const z = mkZone('forest');
    const el = z.elites[0];
    const e = z.spawn(el.enemy, el.area.x * TILE + 16, el.area.y * TILE + 16, { spawnRef: el });
    expect(ENEMIES[el.enemy].abilities[0]).toBe('spin_slash');
    z.join('a', { x: e.x + 30, y: e.y }); z.join('b', { x: e.x - 30, y: e.y + 10 });
    e.target = 'a'; e.state = 'chase'; e.engaged = true; e.abilityCd = 0;
    e.updateAbility(0.05, z.player('a'), 30);
    z.flush();
    expect(z.evs('b', 'tg')[0]).toMatchObject({ s: { kind: 'circle' } });
    run(z, 1.5);
    expect(z.evs('a', 'eh').some((h) => h.label === 'Kasırga')).toBe(true);
    expect(z.evs('b', 'eh').some((h) => h.label === 'Kasırga')).toBe(true);
  });

  it('oyuncu ölünce/çıkınca yaratık onu bırakır ve eve döner; yavaşlatma ve sersemletme uygulanır', () => {
    const z = mkZone('forest');
    const e = z.enemies.find((x) => x.tpl.ai === 'aggressive' || x.tpl.ai === 'pack');
    z.join('a', { x: e.x + 20, y: e.y });
    run(z, 1);
    expect(e.state === 'chase' || e.state === 'attack').toBe(true);
    z.onStatus('a', e.id, { slow: [0.5, 2000], stun: 800 });
    expect(e.slowPct).toBe(0.5);
    expect(e.stunUntil).toBeGreaterThan(z.clock);
    z.update('a', { d: 1 });
    run(z, 1.5);
    expect(['return', 'idle']).toContain(e.state);   // eve dönüyor ya da döndü
    expect(e.target).toBe(null);
    z.leave('a');
    expect(e.threat.has('a')).toBe(false);
  });
});

// --------------------------------------------------------------------------- merkez
function fakeWs() {
  const ws = { sent: [], readyState: 1, handlers: {}, closed: false };
  ws.on = (ev, fn) => { ws.handlers[ev] = fn; };
  ws.send = (s) => ws.sent.push(JSON.parse(s));
  ws.close = () => { ws.closed = true; ws.handlers.close?.(); };
  ws.ping = () => {};
  ws.msg = (m) => ws.handlers.message(JSON.stringify(m));
  ws.last = (t) => [...ws.sent].reverse().find((m) => m.t === t);
  return ws;
}
const verify = async (tok) => (tok.startsWith('ok:') ? { uid: tok.slice(3), email: tok.slice(3) + '@x' } : null);
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('Sunucu merkezi', () => {
  it('sürüm uyuşmazlığı ve geçersiz oturum reddedilir; geçerli oturum karşılanır', async () => {
    const hub = new Hub({ verify });
    const a = fakeWs(); hub.attach(a);
    a.msg({ t: 'hello', token: 'ok:u1', v: '1.0.0' }); await tick();
    expect(a.last('err').code).toBe('version');
    a.msg({ t: 'hello', token: 'yanlis', v: GAME_VERSION }); await tick();
    expect(a.last('err').code).toBe('auth');
    a.msg({ t: 'hello', token: 'ok:u1', v: GAME_VERSION, nick: 'Ayg' }); await tick();
    expect(a.last('welcome')).toMatchObject({ uid: 'u1', n: 1 });
  });

  it('aynı hesap ikinci kez bağlanırsa eskisi kapanır; giriş yapmadan oyun mesajı işlenmez', async () => {
    const hub = new Hub({ verify });
    const a = fakeWs(), b = fakeWs(), c = fakeWs();
    hub.attach(a); hub.attach(b); hub.attach(c);
    c.msg({ t: 'enter', map: 'forest', x: 1, y: 1 });
    expect(hub.zones.size).toBe(0);
    a.msg({ t: 'hello', token: 'ok:u1', v: GAME_VERSION }); await tick();
    b.msg({ t: 'hello', token: 'ok:u1', v: GAME_VERSION }); await tick();
    expect(a.closed).toBe(true);
    expect(a.last('err').code).toBe('dup');
    expect(hub.byUid.size).toBe(1);
  });

  it('kanallar: abone olanlar presence ve yayınları alır; izlenen parti kanalı EXP paylaşımı için parti sayılır', async () => {
    const hub = new Hub({ verify });
    const a = fakeWs(), b = fakeWs();
    hub.attach(a); hub.attach(b);
    a.msg({ t: 'hello', token: 'ok:ua', v: GAME_VERSION }); b.msg({ t: 'hello', token: 'ok:ub', v: GAME_VERSION }); await tick();
    const topic = 'ahen-party-K7M2QX';
    a.msg({ t: 'sub', topic }); b.msg({ t: 'sub', topic });
    expect(a.last('subbed').topic).toBe(topic);
    expect(hub.partyOf('ua')).toBe(null);          // abone ama izlemiyor
    a.msg({ t: 'track', topic, meta: { nick: 'Ayg', joinedAt: 1 } });
    b.msg({ t: 'track', topic, meta: { nick: 'Bora', joinedAt: 2 } });
    expect(b.last('pres').metas.map((m) => m.uid).sort()).toEqual(['ua', 'ub']);
    expect(hub.partyOf('ua')).toBe(topic);
    a.msg({ t: 'bc', topic, ev: 'chat', p: { t: 'selam' } });
    expect(b.last('bc')).toMatchObject({ topic, ev: 'chat', p: { t: 'selam' } });
    expect(a.sent.filter((m) => m.t === 'bc').length).toBe(0);   // gönderen kendi yayınını almaz
    b.close();
    expect(a.last('pres').metas.map((m) => m.uid)).toEqual(['ua']);
  });

  it('bölgeye giriş/çıkış: dungeon haritası ortak değildir; boş bölge oyuncusuz kalır', async () => {
    const hub = new Hub({ verify });
    const a = fakeWs(); hub.attach(a);
    a.msg({ t: 'hello', token: 'ok:ua', v: GAME_VERSION }); await tick();
    a.msg({ t: 'enter', map: 'dungeon', x: 1, y: 1 });
    expect(hub.zones.size).toBe(0);
    a.msg({ t: 'enter', map: 'forest', x: 60 * TILE, y: 44 * TILE });
    expect(hub.zones.get('forest').players.has('ua')).toBe(true);
    expect(a.last('zone').map).toBe('forest');
    a.msg({ t: 'enter', map: null });
    expect(hub.zones.get('forest').players.size).toBe(0);
  });
});
