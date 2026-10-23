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

  it('bölgeye giriş/çıkış; dungeon parti başına ayrı örnektir (partisiz oyuncunun kendi örneği)', async () => {
    const hub = new Hub({ verify });
    const a = fakeWs(), b = fakeWs(), c = fakeWs();
    hub.attach(a); hub.attach(b); hub.attach(c);
    for (const [w, t] of [[a, 'ok:ua'], [b, 'ok:ub'], [c, 'ok:uc']]) w.msg({ t: 'hello', token: t, v: GAME_VERSION });
    await tick();
    a.msg({ t: 'enter', map: 'forest', x: 60 * TILE, y: 44 * TILE });
    expect(hub.zones.get('forest').players.has('ua')).toBe(true);
    expect(a.last('zone').map).toBe('forest');
    a.msg({ t: 'enter', map: null });
    expect(hub.zones.get('forest').players.size).toBe(0);
    const topic = 'ahen-party-K7M2QX';
    for (const w of [a, b]) { w.msg({ t: 'sub', topic }); w.msg({ t: 'track', topic, meta: { nick: 'x', joinedAt: 1 } }); }
    a.msg({ t: 'enter', map: 'dungeon', x: 5 * TILE, y: 60 * TILE, run: { cleared: [1] } });
    b.msg({ t: 'enter', map: 'dungeon', x: 5 * TILE, y: 60 * TILE });
    c.msg({ t: 'enter', map: 'dungeon', x: 5 * TILE, y: 60 * TILE });
    const inst = hub.zones.get('dungeon@' + topic);
    expect(inst.players.size).toBe(2);
    expect(inst.dg.cleared).toEqual([1]);                  // ilk girenin koşu durumu
    expect(b.last('zone').dg.cleared).toEqual([1]);        // sonradan gelen aynı durumu alır
    expect(hub.zones.get('dungeon@solo:uc').players.has('uc')).toBe(true);
  });
});

describe('Parti dungeon örneği', () => {
  it('bölüm yaratıkları doğar, kapılar kapalıdır; bölüm temizlenince kapı açılır ve herkese duyurulur', () => {
    const z = mkZone('dungeon');
    z.join('a', { x: 5 * TILE, y: 60 * TILE });
    const s1 = z.enemies.filter((e) => e.stage === 1);
    expect(s1.length).toBeGreaterThan(0);
    const g1 = z.def.gates.find((g) => g.opensAfter === 1);
    const gi = g1.y0 * z.grid.w + g1.x0;
    expect(z.grid.dyn[gi] || z.grid.solid[gi]).toBeTruthy();
    for (const e of s1) z.onHit('a', e.id, e.maxHp + 1);
    z.flush();
    expect(z.evs('a', 'dg').some((d) => d.op === 'clear' && d.stage === 1)).toBe(true);
    expect(z.grid.dyn[gi]).toBe(0);
    expect(z.dg.cleared).toEqual([1]);
  });

  it('kayıtlı koşu durumuyla açılan örnek temizlenmiş bölümleri yeniden doğurmaz; boss yalnız boss bölümünde', () => {
    const z = mkZone('dungeon');
    const z2 = new Zone('dungeon', { out: () => {}, run: { cleared: [1, 2, 3] } });
    expect(z2.enemies.every((e) => e.stage === 4)).toBe(true);
    expect(z2.enemies.find((e) => e.tpl.kind === 'boss').tpl.id).toBe('mine_golem');
    const z3 = new Zone('dungeon', { out: () => {}, run: { cleared: [1, 2, 3, 4], bossKilled: true } });
    expect(z3.enemies.length).toBe(0);
    void z;
  });

  it('Buz Mabedi mühürleri: dokununca muhafız dalgası, dalga ölünce mühür kırılır; mühürler + yaratıklar bitince bölüm açılır', () => {
    const z = mkZone('frost_temple');
    z.dg.cleared.push(1, 2);
    z.join('a', { x: 10 * TILE, y: 10 * TILE });
    const seals = z.def.seals.filter((x) => (x.stage || 3) === 3 && x.kind !== 'decoy');
    expect(seals.length).toBeGreaterThan(0);
    for (const e of z.enemies.filter((x) => x.stage === 3)) z.onHit('a', e.id, e.maxHp + 1);
    z.flush();
    expect(z.evs('a', 'note').some((n) => /mührü de kır/.test(n.s))).toBe(true);
    for (const seal of seals) {
      z.onSeal('a', seal.id);
      let guard = 0;
      while (!z.dg.seals.includes(seal.id) && guard++ < 6) {
        const wave = z.dg.waves.get(seal.id) || [];
        expect(wave.length).toBeGreaterThan(0);
        for (const e of wave) if (!e.dead) z.onHit('a', e.id, e.maxHp + 1);
      }
      expect(z.dg.seals).toContain(seal.id);
    }
    z.flush();
    expect(z.evs('a', 'dg').some((d) => d.op === 'seal' && d.n === seals.length)).toBe(true);
    expect(z.dg.cleared).toContain(3);
  });

  it('Karanlık Mahzen mekanizmaları dokununca hemen etkinleşir; yanıltıcı düğüm hiçbir şey yapmaz', () => {
    const z = mkZone('dark_crypt');
    z.dg.cleared.push(1);
    z.join('a', { x: 10 * TILE, y: 10 * TILE });
    const levers = z.def.seals.filter((x) => x.kind === 'lever');
    expect(levers.length).toBeGreaterThan(0);
    z.onSeal('a', levers[0].id);
    expect(z.dg.seals).toContain(levers[0].id);
    const decoy = (z.def.seals || []).find((x) => x.kind === 'decoy');
    if (decoy) { z.onSeal('a', decoy.id); expect(z.dg.seals).not.toContain(decoy.id); }
  });
});

describe('Boss\'lar sunucuda', () => {
  it('açık dünya boss\'u doğar; ölünce ödül kimliği (killId) ile paylaştırılır ve yeniden doğma süresi kurulur', () => {
    const z = mkZone('forest');
    z.join('a', { x: 5 * TILE, y: 42 * TILE });
    z.tick(0.05);
    const b = z.bosses[0];
    expect(b.ent.tpl.id).toBe('alpha_wolf');
    z.onHit('a', b.ent.id, b.ent.maxHp + 1);
    z.flush();
    const k = z.evs('a', 'kill').find((x) => x.tpl === 'alpha_wolf');
    expect(k.killId).toMatch(/^alpha_wolf:forest:/);
    expect(b.respawnAt).toBeGreaterThan(z.clock + 500 * 1000);
  });

  it('Alfa Kurt %70 altında sürüyü çağırır (ödülsüz çağrılmışlar), öfkede hızlanır; savaş bitince çağrılmışlar dağılır', () => {
    const z = mkZone('forest');
    z.tick(0.05);
    const w = z.bosses[0].ent;
    z.join('a', { x: w.x + 40, y: w.y });
    w.hp = w.maxHp * 0.65;
    w.target = 'a'; w.state = 'chase'; w.engaged = true;
    for (let i = 0; i < 40; i++) z.tick(0.05);
    const pack = z.enemies.filter((e) => e.tpl.id === 'pack_wolf' && !e.dead);
    expect(pack.length).toBe(2);
    expect(pack.every((e) => e.summoned)).toBe(true);
    z.flush();
    expect(z.evs('a', 'ann').some((x) => /Sürü Uluması/.test(x.s))).toBe(true);
    w.hp = w.maxHp * 0.2;
    z.tick(0.05);
    expect(w.speedMult).toBeGreaterThan(1);
    expect(w.behavior.phase()).toBe(2);
    // oyuncu ölür → boss eve döner, sıfırlanır, çağrılmışlar dağılır
    z.update('a', { d: 1 });
    for (let i = 0; i < 200; i++) z.tick(0.05);
    expect(z.enemies.filter((e) => e.tpl.id === 'pack_wolf' && !e.dead).length).toBe(0);
    expect(w.speedMult).toBe(1);
  });

  it('Maden Golemi kalkanı: %50 altında iki kristal + %85 hasar azaltma; kristaller kırılınca kalkan söner', () => {
    const z = new Zone('dungeon', { out: () => {}, run: { cleared: [1, 2, 3] } });
    const g = z.enemies.find((e) => e.tpl.id === 'mine_golem');
    z.join('a', { x: g.x + 50, y: g.y });
    g.hp = g.maxHp * 0.45; g.target = 'a'; g.state = 'chase'; g.engaged = true;
    z.tick(0.05);
    const cr = z.enemies.filter((e) => e.tpl.id === 'shield_crystal');
    expect(cr.length).toBe(2);
    expect(g.reduce).toBeCloseTo(0.85);
    expect(g.snap()[9]).toBeTruthy();   // parıltı
    for (const c of cr) z.onHit('a', c.id, c.maxHp + 1);
    z.tick(0.05);
    expect(g.reduce).toBe(0);
  });

  it('Fırtına Tiranı kristalleri kırılınca zırhı çatlar (savunma çarpanı istemciye gider)', () => {
    const z = mkZone('sky_rift');
    z.tick(0.05);
    const t = z.bosses[0].ent;
    expect(t.tpl.id).toBe('storm_tyrant');
    z.join('a', { x: t.x + 50, y: t.y });
    t.hp = t.maxHp * 0.55; t.target = 'a'; t.state = 'chase'; t.engaged = true;
    z.tick(0.05);
    const cr = z.enemies.filter((e) => e.tpl.id === 'tyrant_crystal');
    expect(cr.length).toBe(2);
    expect(t.reduce).toBeCloseTo(0.6);
    for (const c of cr) z.onHit('a', c.id, c.maxHp + 1);
    z.tick(0.05);
    expect(t.defMult).toBeCloseTo(0.65);
    expect(t.snap()[10]).toBe(65);
  });
});

describe('Görev olayları ve avlar sunucuda', () => {
  const near = (z, id) => { const ev = z.events.get(id); return { x: ev.x + 20, y: ev.y }; };

  it('alan savunması: başlatılır, dalgalar korunan hedefe saldırır; dalgalar bitince herkese "tamam" gider; olay yaratıkları ödül vermez', () => {
    const z = mkZone('forest');
    z.join('a', { ...near(z, 'saplings') }); z.join('b', { ...near(z, 'saplings') });
    z.onEvent('a', 'saplings');
    z.flush();
    expect(z.evs('b', 'qe').some((e) => e.op === 'start' && e.id === 'saplings')).toBe(true);
    const ev = z.events.get('saplings');
    expect(ev.running).toBe(true);
    for (let w = 0; w < ev.o.waves.length + 2 && ev.running; w++) {
      for (const e of ev.aliveWave()) { expect(e.questSpawn).toBe(true); z.onHit('a', e.id, e.maxHp + 1); }
      for (let i = 0; i < 40; i++) z.tick(0.05);
    }
    z.flush();
    expect(z.evs('b', 'qe').some((e) => e.op === 'done' && e.id === 'saplings' && e.kind === 'defend')).toBe(true);
    expect(z.evs('a', 'kill').length).toBe(0);
  });

  it('savunma: dalga yaratıkları hedefe vurur; hedef düşerse olay başarısız olur ve yeniden denenebilir', () => {
    const z = mkZone('forest');
    z.join('a', { ...near(z, 'saplings') });
    z.onEvent('a', 'saplings');
    const ev = z.events.get('saplings');
    ev.hp = 1;
    for (let i = 0; i < 400 && ev.running; i++) z.tick(0.05);
    z.flush();
    expect(ev.running).toBe(false);
    expect(z.evs('a', 'qe').some((e) => e.op === 'fail')).toBe(true);
    expect(ev.hp).toBe(ev.maxHp);
  });

  it('refakat: oyuncu yakındayken kervan yol alır; uzaklaşınca durur; pusu dalgası doğar', () => {
    const z = mkZone('forest');
    z.join('a', { ...near(z, 'meadow_caravan') });
    z.onEvent('a', 'meadow_caravan');
    const ev = z.events.get('meadow_caravan');
    const x0 = ev.x, y0 = ev.y;
    for (let i = 0; i < 40; i++) { const p = z.player('a'); p.x = ev.x + 10; p.y = ev.y; z.tick(0.05); }
    expect(Math.hypot(ev.x - x0, ev.y - y0)).toBeGreaterThan(20);
    const p = z.player('a'); p.x = ev.x + 15 * TILE; p.y = ev.y;
    const x1 = ev.x;
    for (let i = 0; i < 20; i++) z.tick(0.05);
    expect(Math.abs(ev.x - x1)).toBeLessThan(1);
    // ileri sar: pusu oranına kadar ilerlet
    ev.node = Math.ceil(ev.total * (ev.o.ambushes[0].at + 0.01));
    p.x = ev.x + 10; p.y = ev.y;
    z.tick(0.05);
    expect(ev.aliveWave().length).toBeGreaterThan(0);
  });

  it('sunak: dalgalar normal (ödüllü) yaratıklardır; bitince yakındakilere "arındırıldı" gider', () => {
    const z = mkZone('forest');
    z.join('a', { ...near(z, 'altar_forest') });
    z.onEvent('a', 'altar_forest');
    const al = z.events.get('altar_forest');
    for (let w = 0; w < 5 && al.event; w++) {
      for (const e of al.event.alive) if (!e.dead) z.onHit('a', e.id, e.maxHp + 1);
      for (let i = 0; i < 30; i++) z.tick(0.05);
    }
    z.flush();
    expect(z.evs('a', 'alt').some((e) => e.op === 'done')).toBe(true);
    expect(z.evs('a', 'kill').length).toBeGreaterThan(0);
  });

  it('görev avı: isteyen oyuncu varken bölgede tek ve ortak doğar; isteyen kalmayınca kalkar', () => {
    const z = mkZone('forest');
    z.join('a', { x: 5 * TILE, y: 42 * TILE }); z.join('b', { x: 5 * TILE, y: 43 * TILE });
    const h = { key: 'q1:0', enemy: 'gray_wolf', x: 40, y: 40 };
    z.onHunts('a', [h]); z.onHunts('b', [h]);
    for (let i = 0; i < 12; i++) z.tick(0.05);
    const hunts = z.enemies.filter((e) => e.huntKey === 'q1:0' && !e.dead);
    expect(hunts.length).toBe(1);
    z.onHunts('a', []); z.onHunts('b', []);
    for (let i = 0; i < 12; i++) z.tick(0.05);
    expect(z.enemies.filter((e) => e.huntKey === 'q1:0' && !e.dead).length).toBe(0);
  });
});
