import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { Rng } from '../../src/core/rng.js';
import { SaveRepository } from '../../src/save/repository.js';
import { newProfile, exportJson, importJson, wrap, unwrap } from '../../src/save/serialize.js';
import { createCharacter, gainExp } from '../../src/systems/character.js';
import { createItem } from '../../src/systems/loot.js';
import { addItem, addStack } from '../../src/systems/inventory.js';

const rng = new Rng(8);

function sampleProfile() {
  const p = newProfile();
  const c = createCharacter({ name: 'Kayıtçı', cls: 'warrior', slot: 0 }, rng);
  gainExp(c, 5000);
  c.gold = 1234;
  addItem(c, createItem('W03', 'R', rng));
  addStack(c.bag, 'iron', 7);
  c.quests.m01 = { s: 'done', p: [3], used: [] };
  c.world.map = 'forest'; c.world.x = 50; c.world.y = 40;
  p.characters[0] = c;
  p.characters[2] = createCharacter({ name: 'İkinci Şövalye', cls: 'mage', slot: 2 }, rng);
  return p;
}

describe('Kayıt sistemi', () => {
  it('kapat-aç: karakter, envanter, bonuslar, görevler ve dünya korunur', async () => {
    const repo = new SaveRepository();
    const p = sampleProfile();
    await repo.save(p);
    const repo2 = new SaveRepository();
    const { profile, source } = await repo2.load();
    expect(source).toBe('profile');
    expect(profile.characters[0]).toEqual(p.characters[0]);
    expect(profile.characters[2].name).toBe('İkinci Şövalye');
  });
  it('checksum bozulursa snapshot\'tan kurtarır', async () => {
    const repo = new SaveRepository();
    const p = sampleProfile();
    await repo.save(p, { forceSnapshot: true });
    p.characters[0].gold = 9999;
    await repo.save(p, { forceSnapshot: true });
    // ana kaydı boz
    const env = await repo.readRaw('profile');
    env.data = env.data.replace('9999', '99999');
    await new Promise((res) => { const tx = repo.db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(env, 'profile'); tx.oncomplete = res; });
    const r = await new SaveRepository().load();
    expect(r.source).toBe('snap_0');
    expect(r.profile.characters[0].gold).toBe(1234);
  });
  it('JSON dışa/içe aktarma, sürüm ve bütünlük kontrolü', () => {
    const p = sampleProfile();
    const text = exportJson(p);
    const r = importJson(text);
    expect(r.ok).toBe(true);
    expect(r.profile.characters[0].name).toBe('Kayıtçı');
    const env = JSON.parse(text);
    env.data = env.data.replace('"gold":1234', '"gold":5');
    expect(importJson(JSON.stringify(env)).ok).toBe(false);
    const env2 = wrap(p); env2.schemaVersion = 99;
    expect(unwrap(env2).ok).toBe(false);
    expect(importJson('merhaba').ok).toBe(false);
  });
  it('geçersiz veri reddedilir (bilinmeyen eşya, çift uid)', () => {
    const p = sampleProfile();
    const it = p.characters[0].bag.slots.find((s) => s && s.q === undefined);
    p.characters[0].bag.slots[30] = { ...it };
    expect(unwrap(wrap(p)).ok).toBe(false);
    const p2 = sampleProfile();
    p2.characters[0].equipment.weapon.tid = 'X99';
    expect(unwrap(wrap(p2)).ok).toBe(false);
  });
  it('simüle kayıt hatası fırlatır, sonraki kayıt başarılı olur', async () => {
    const repo = new SaveRepository();
    repo.failNext = 1;
    await expect(repo.save(sampleProfile())).rejects.toThrow();
    await expect(repo.save(sampleProfile())).resolves.toBeTruthy();
  });
});
