// V4 kayıt güvenliği: şema 3 → 4, 3 → 5 karakter yuvası, eski kayıtlar asla reddedilmez/silinmez.
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { Rng } from '../../src/core/rng.js';
import { SaveRepository } from '../../src/save/repository.js';
import { newProfile, wrap, unwrap, salvage, validateProfile } from '../../src/save/serialize.js';
import { createCharacter, gainExp } from '../../src/systems/character.js';
import { createItem } from '../../src/systems/loot.js';
import { addItem } from '../../src/systems/inventory.js';
import { cumulativeXp, SCHEMA_VERSION, CHAR_SLOTS } from '../../src/data/constants.js';

class MemStorage {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  key(i) { return [...this.m.keys()][i] ?? null; }
  get length() { return this.m.size; }
}
beforeEach(() => { globalThis.indexedDB = new IDBFactory(); globalThis.localStorage = new MemStorage(); });

// 3.0.x biçiminde (şema 3, 3 yuva, V4 alanı yok) bir zarf
function v3Envelope() {
  const rng = new Rng(4);
  const p = newProfile();
  const a = createCharacter({ name: 'Eski Savasci', cls: 'warrior', slot: 0 }, rng);
  gainExp(a, cumulativeXp(40));
  a.gold = 123456;
  a.alloc.str = 80; a.alloc.vit = 37;
  addItem(a, createItem('W19', 'L', rng));
  a.quests.m46 = { s: 'done', p: [1], used: [] };
  a.mastery2 = true;
  const b = createCharacter({ name: 'Eski Buyucu', cls: 'mage', slot: 2 }, rng);
  gainExp(b, cumulativeXp(33));
  for (const c of [a, b]) { delete c.mastery3; delete c.minion; c.v = 3; }
  p.characters = [a, null, b];
  delete p.deletedChars;
  p.schemaVersion = 3;
  const env = wrap(p);
  env.schemaVersion = 3;
  delete env.meta;
  return { env, a, b };
}

describe('V4 kayıt geçişi (şema 3 → 4)', () => {
  it('eski 3 yuvalı profil 5 yuvaya genişler; sıra, kimlik, seviye, eşya, gold, stat ve görevler aynen kalır', () => {
    expect(SCHEMA_VERSION).toBe(4);
    expect(CHAR_SLOTS).toBe(5);
    const { env, a, b } = v3Envelope();
    const r = unwrap(env);
    expect(r.ok, r.msg).toBe(true);
    const ch = r.profile.characters;
    expect(ch.length).toBe(5);
    expect(ch[0].id).toBe(a.id); expect(ch[1]).toBeNull(); expect(ch[2].id).toBe(b.id);
    expect(ch[3]).toBeNull(); expect(ch[4]).toBeNull();
    expect(ch[0].level).toBe(40); expect(ch[0].gold).toBe(123456);
    expect(ch[0].alloc).toEqual(a.alloc);
    expect(ch[0].bag.slots.find((s) => s?.tid === 'W19').r).toBe('L');
    expect(ch[0].quests.m46.s).toBe('done');
    expect(ch[0].mastery2).toBe(true);
    expect(ch[0].mastery3).toBe(false);
    expect(ch[0].minion).toBeNull();
    expect(ch[2].level).toBe(33);
    expect(r.profile.schemaVersion).toBe(4);
    expect(validateProfile(r.profile).ok).toBe(true);
  });

  it('migrasyon doğrulamadan önce yapılır: 3 elemanlı dizi reddedilmez (sıkı ve kurtarıcı açma)', () => {
    const { env } = v3Envelope();
    expect(unwrap(env).ok).toBe(true);
    const s = salvage(env);
    expect(s.ok).toBe(true);
    expect(s.repaired).toBeFalsy();
  });

  it('depo: şema 3 kaydı yüklenir, v3_backup bir kez saklanır, yeni yuvaya karakter eklenir, eskiler silinmez', async () => {
    const { env, a, b } = v3Envelope();
    const repo = new SaveRepository();
    await repo.open();
    await repo.writeRaw('profile', env);
    const r = await new SaveRepository().load();
    expect(r.migratedFrom).toBe(3);
    expect(r.profile.characters.filter(Boolean).map((c) => c.id)).toEqual([a.id, b.id]);
    expect((await repo.readRaw('v3_backup')).schemaVersion).toBe(3);
    // 4. yuvaya yeni karakter (mevcut karakteri silmeden)
    const p = r.profile;
    p.characters[3] = createCharacter({ name: 'Yeni Okcu', cls: 'warrior', slot: 3 }, new Rng(1));
    const repo2 = new SaveRepository();
    await repo2.save(p);
    const back = await new SaveRepository().load();
    expect(back.profile.characters.filter(Boolean).length).toBe(3);
    expect(back.profile.characters[0].id).toBe(a.id);
    expect(back.profile.characters[3].name).toBe('Yeni Okcu');
  });

  it('IndexedDB açılamaz ve hiçbir kopya yoksa: boş profil "yüklendi" sayılmaz, hata türü bildirilir', async () => {
    const broken = { open() { const req = {}; setTimeout(() => { req.error = Object.assign(new Error('The operation is insecure.'), { name: 'SecurityError' }); req.onerror?.(); }, 0); return req; } };
    globalThis.localStorage = undefined;
    const repo = new SaveRepository(broken);
    const r = await repo.load();
    expect(r.profile).toBeNull();
    expect(r.storageError.code).toBe('blocked');
    expect(repo.mode).toBe('memory');
    expect(repo.storageInfo().memoryOnly).toBe(true);
  });

  it('IndexedDB açılamazsa aynadaki eski kayıt yüklenir ve hata bildirilir (üzerine boş profil yazılmaz)', async () => {
    const { env } = v3Envelope();
    localStorage.setItem('ahen-vadisi:mirror', JSON.stringify(env));
    const broken = { open() { const req = {}; setTimeout(() => { req.error = new Error('blocked'); req.onblocked?.(); }, 0); return req; } };
    const r = await new SaveRepository(broken).load();
    expect(r.profile.characters.filter(Boolean).length).toBe(2);
    expect(r.storageError).toBeTruthy();
  });

  it('son kalıcı kayıt bilgisi: IndexedDB + ayna yazımı kalıcı sayılır; yalnız bellek kalıcı sayılmaz', async () => {
    const repo = new SaveRepository();
    await repo.save(newProfile());
    expect(repo.lastWrite.persistent).toBe(true);
    expect(repo.lastWrite.idb).toBe(true);
    expect(repo.lastWrite.mirror).toBe(true);
    globalThis.localStorage = undefined;
    const mem = new SaveRepository(null);
    await mem.save(newProfile());
    expect(mem.mode).toBe('memory');
    expect(mem.lastWrite.persistent).toBe(false);
    expect(mem.storageInfo().memoryOnly).toBe(true);
  });
});
