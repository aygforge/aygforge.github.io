// Kayıt sağlamlaştırma (3.0.1): hiçbir koşulda oyuncu ilerlemesi sessizce silinmemeli; eski kayıtlar aynen açılmalı.
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { Rng } from '../../src/core/rng.js';
import { SaveRepository, losesProgress, envSummary } from '../../src/save/repository.js';
import { newProfile, wrap, unwrap, salvage, repairProfile, encodeBackupCode, decodeBackupCode, importJson } from '../../src/save/serialize.js';
import { createCharacter, gainExp } from '../../src/systems/character.js';
import { createItem } from '../../src/systems/loot.js';
import { addItem, addStack } from '../../src/systems/inventory.js';

const rng = new Rng(21);

// her test temiz IndexedDB + localStorage ile başlar
class MemStorage {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  key(i) { return [...this.m.keys()][i] ?? null; }
  get length() { return this.m.size; }
}
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  globalThis.localStorage = new MemStorage();
});

function profile() {
  const p = newProfile();
  const a = createCharacter({ name: 'Demirkol', cls: 'warrior', slot: 0 }, rng);
  gainExp(a, 60000);
  a.gold = 45678;
  addItem(a, createItem('W03', 'R', rng));
  addStack(a.bag, 'iron', 12);
  const b = createCharacter({ name: 'Yıldız', cls: 'mage', slot: 1 }, rng);
  gainExp(b, 9000);
  b.gold = 777;
  p.characters[0] = a;
  p.characters[1] = b;
  return p;
}
const put = (repo, key, val) => new Promise((res) => { const tx = repo.db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(val, key); tx.oncomplete = res; });

describe('Kayıt onarımı (salvage/repairProfile)', () => {
  it('tek bozuk eşya bütün profili reddettirmez: eşya çıkarılır, karakterler korunur', () => {
    const p = profile();
    p.characters[0].bag.slots[3] = { uid: 'x1', tid: 'YOK_BOYLE_ESYA', r: 'R', p: 0, d: 100, b: [] };
    const env = wrap(p);
    expect(unwrap(env).ok).toBe(false);            // sıkı doğrulama hâlâ reddeder (testler/araçlar için)
    const r = salvage(env);
    expect(r.ok, r.msg).toBe(true);
    expect(r.repaired).toBe(true);
    expect(r.profile.characters[0].level).toBe(p.characters[0].level);
    expect(r.profile.characters[0].gold).toBe(45678);
    expect(r.profile.characters[1].name).toBe('Yıldız');
    expect(r.fixes.join(' ')).toMatch(/bilinmeyen eşya/);
  });
  it('çift uid: eşya silinmez, yeni kimlik alır', () => {
    const p = profile();
    const it0 = p.characters[0].bag.slots.find((s) => s && s.q === undefined);
    p.characters[0].bag.slots[20] = { ...it0 };
    const r = salvage(wrap(p));
    expect(r.ok).toBe(true);
    expect(r.repaired).toBe(true);
    expect(r.profile.characters[0].bag.slots[20].tid).toBe(it0.tid);
    expect(r.profile.characters[0].bag.slots[20].uid).not.toBe(it0.uid);
  });
  it('bozuk harita/konum ve aşırı istif onarılır', () => {
    const p = profile();
    p.characters[0].world.map = 'olmayan_harita';
    const st = p.characters[0].bag.slots.find((s) => s && s.tid === 'iron');
    st.q = 5000;
    const r = repairProfile(JSON.parse(JSON.stringify(p)));
    expect(r.ok, r.errors.join(';')).toBe(true);
    expect(r.profile.characters[0].world.map).not.toBe('olmayan_harita');
  });
  it('checksum tutmayan ama okunabilen kayıt yine kurtarılır (bildirilerek)', () => {
    const env = wrap(profile());
    env.checksum = 12345;
    const r = salvage(env);
    expect(r.ok).toBe(true);
    expect(r.checksumBad).toBe(true);
    expect(r.profile.characters[0].name).toBe('Demirkol');
  });
  it('daha yeni şema kaydı "newer" olarak işaretlenir', () => {
    const env = wrap(profile()); env.schemaVersion = 99;
    expect(salvage(env).newer).toBe(true);
  });
});

describe('Depo (repository) sağlamlığı', () => {
  it('ana kayıt doğrulanamazsa boş profil açılmaz: onarılıp yüklenir, ham kopya kurtarma anahtarına alınır', async () => {
    const repo = new SaveRepository();
    await repo.open();
    const p = profile();
    p.characters[0].bag.slots[2] = { uid: 'bad', tid: 'YOK', r: 'N', p: 0, d: 100, b: [] };
    await put(repo, 'profile', wrap(p));
    const r = await new SaveRepository().load();
    expect(r.profile).toBeTruthy();
    expect(r.repaired).toBe(true);
    expect(r.profile.characters[0].gold).toBe(45678);
    const keys = await repo.keys();
    expect(keys.some((k) => k.startsWith('rescue_') && k.includes('repair'))).toBe(true);
  });
  it('daha yeni sürüm kaydı: depo salt okunur olur ve hiçbir şey üzerine yazılmaz', async () => {
    const repo = new SaveRepository();
    await repo.open();
    const env = wrap(profile()); env.schemaVersion = 99;
    await put(repo, 'profile', env);
    const r2 = new SaveRepository();
    const r = await r2.load();
    expect(r.newer).toBe(true);
    expect(r2.readOnly).toBe(true);
    await expect(r2.save(newProfile())).rejects.toThrow();
    expect((await r2.readRaw('profile')).schemaVersion).toBe(99);
  });
  it('her kayıt localStorage aynasına da yazılır; IndexedDB boşalırsa aynadan yüklenir', async () => {
    const repo = new SaveRepository();
    await repo.save(profile());
    expect(localStorage.getItem('ahen-vadisi:mirror')).toBeTruthy();
    globalThis.indexedDB = new IDBFactory();      // IndexedDB silindi
    const r = await new SaveRepository().load();
    expect(r.source).toBe('mirror');
    expect(r.profile.characters[0].name).toBe('Demirkol');
  });
  it('IndexedDB açılamazsa eski kayıt aynadan yüklenir (boş profil yok)', async () => {
    await new SaveRepository().save(profile());
    const r = await new SaveRepository(null).load();
    expect(r.profile.characters[0].gold).toBe(45678);
  });
  it('en yeni kopya seçilir: IndexedDB yazılamayıp yalnız ayna güncellendiyse ayna kazanır', async () => {
    const repo = new SaveRepository();
    const p = profile();
    await repo.save(p);
    p.characters[0].gold = 99999;
    const env = wrap(p); env.savedAt += 5000;
    localStorage.setItem('ahen-vadisi:mirror', JSON.stringify(env));
    const r = await new SaveRepository().load();
    expect(r.profile.characters[0].gold).toBe(99999);
  });
  it('karakterli kayıt varken en yeni kopya karaktersizse karakterli olan seçilir', async () => {
    const repo = new SaveRepository();
    await repo.save(profile(), { forceSnapshot: true });
    await repo.save(profile(), { forceSnapshot: true });
    await repo.open();
    const empty = wrap(newProfile()); empty.savedAt += 10000;
    await put(repo, 'profile', empty);
    const r = await new SaveRepository().load();
    expect(r.profile.characters.filter(Boolean).length).toBe(2);
  });
  it('ilerleme koruması: karakter kaybettiren kayıttan önce eski kayıt kurtarma kopyasına alınır', async () => {
    const repo = new SaveRepository();
    const p = profile();
    await repo.save(p);
    const lost = JSON.parse(JSON.stringify(p)); lost.characters[1] = null;
    await repo.save(lost);
    const keys = await repo.keys();
    const guard = keys.find((k) => k.endsWith('_guard'));
    expect(guard).toBeTruthy();
    const env = await repo.readRaw(guard);
    expect(unwrap(env).profile.characters[1].name).toBe('Yıldız');
    // bilinçli silme koruma kopyası üretmez ve kurtarma listesine girmez
    const del = JSON.parse(JSON.stringify(p)); del.deletedChars = [p.characters[1].id]; del.characters[1] = null;
    expect(losesProgress(envSummary(wrap(p)), wrap(del).meta)).toBe(false);
  });
  it('kurtarılabilir karakter listesi: profilde olmayan ya da daha ileri karakterler bulunur, silinenler hariç', async () => {
    const repo = new SaveRepository();
    const p = profile();
    await repo.save(p);
    const now = JSON.parse(JSON.stringify(p));
    now.characters[1] = null;
    now.characters[0].level = 3;                    // seviye geriledi
    await repo.save(now);
    const r = await new SaveRepository().load();
    const ids = r.recoverable.map((x) => x.char.name).sort();
    expect(ids).toEqual(['Demirkol', 'Yıldız']);
    expect(r.recoverable.find((x) => x.char.name === 'Demirkol').replaces).toBe(true);
    // silinen karakter listeye girmez
    const del = JSON.parse(JSON.stringify(r.profile)); del.deletedChars = [p.characters[1].id];
    const repo2 = new SaveRepository();
    await repo2.save(del);
    const r2 = await new SaveRepository().load();
    expect(r2.recoverable.map((x) => x.char.name)).toEqual(['Demirkol']);
  });
  it('oturum geçmişi (hist_*) oturumun ilk kaydında önceki kaydı saklar', async () => {
    const p = profile();
    await new SaveRepository().save(p);
    const repo = new SaveRepository();              // yeni oturum
    p.characters[0].gold = 1;
    await repo.save(p);
    const h = await repo.readRaw('hist_0');
    expect(unwrap(h).profile.characters[0].gold).toBe(45678);
  });
  it('anlık görüntüden geri yükleme önce şu anki kaydı kurtarma kopyasına alır', async () => {
    const repo = new SaveRepository();
    const p = profile();
    await repo.save(p, { forceSnapshot: true });
    p.characters[0].gold = 5;
    await repo.save(p, { forceSnapshot: true });
    const back = await repo.restoreSnapshot('snap_0');
    expect(back.ok).toBe(true);
    expect(back.profile.characters[0].gold).toBe(45678);
    expect((await repo.keys()).some((k) => k.endsWith('before_restore'))).toBe(true);
  });
});

describe('Eski kayıtlarla uyumluluk', () => {
  it('meta alanı olmayan (3.0.0 ve öncesi) zarflar aynen açılır', async () => {
    const repo = new SaveRepository();
    await repo.open();
    const env = wrap(profile()); delete env.meta;
    await put(repo, 'profile', env);
    const r = await new SaveRepository().load();
    expect(r.source).toBe('profile');
    expect(r.repaired).toBe(false);
    expect(r.profile.characters[0].gold).toBe(45678);
    expect(envSummary(env).chars[0].name).toBe('Demirkol');
  });
  it('eski localStorage modu anahtarı (ahen-vadisi:profile:profile) okunur', async () => {
    const env = wrap(profile());
    localStorage.setItem('ahen-vadisi:profile:profile', JSON.stringify(env));
    const r = await new SaveRepository().load();
    expect(r.profile.characters[1].name).toBe('Yıldız');
  });
  it('yükleme hiçbir eski anahtarı silmez', async () => {
    const repo = new SaveRepository();
    const p = profile();
    await repo.save(p, { forceSnapshot: true });
    await repo.save(p, { forceSnapshot: true });
    const before = (await repo.keys()).filter((k) => !k.startsWith('rescue_'));
    await new SaveRepository().load();
    const after = await repo.keys();
    for (const k of before) expect(after).toContain(k);
  });
});

describe('Yedek kodu', () => {
  it('kopyala/yapıştır kodu profili birebir taşır', async () => {
    const p = profile();
    const code = await encodeBackupCode(p);
    expect(code.startsWith('AHV1')).toBe(true);
    const r = await decodeBackupCode(`  ${code.slice(0, 40)}\n${code.slice(40)}  `);
    expect(r.ok, r.msg).toBe(true);
    expect(r.profile.characters[0]).toEqual(p.characters[0]);
  });
  it('düz JSON da kabul edilir; eksik/bozuk kod reddedilir', async () => {
    const p = profile();
    expect((await decodeBackupCode(JSON.stringify(wrap(p)))).ok).toBe(true);
    const code = await encodeBackupCode(p);
    expect((await decodeBackupCode(code.slice(0, code.length - 30))).ok).toBe(false);
    expect((await decodeBackupCode('merhaba')).ok).toBe(false);
  });
  it('daha yeni sürüm yedeği anlaşılır mesajla reddedilir', () => {
    const env = wrap(profile()); env.schemaVersion = 99;
    const r = importJson(JSON.stringify(env));
    expect(r.ok).toBe(false);
    expect(r.newer).toBe(true);
  });
});

// 4.1.0: kayıt sürerken istenen kayıt beklenir — await flushSave() döndüğünde en son durum yazılmıştır
import { app as appCore } from '../../src/core/app.js';
describe('flushSave birleştirme', () => {
  it('kayıt sürerken çağrılan flushSave, ardından gelen kayıt bitene kadar bekler (en son durum yazılır)', async () => {
    const written = [];
    let release;
    const saved = { repo: appCore.repo, profile: appCore.profile, world: appCore.world };
    appCore.world = null;
    appCore.profile = { characters: [], v: 1 };
    appCore.repo = {
      readOnly: false, lastWrite: { persistent: true },
      async save(p) { const snap = p.v; if (snap === 1) await new Promise((r) => { release = r; }); else await new Promise((r) => setTimeout(r, 20)); written.push(snap); },
    };
    try {
      const first = appCore.flushSave('a');          // yavaş kayıt (v=1)
      await new Promise((r) => setTimeout(r, 5));
      appCore.profile.v = 2;                          // bu arada durum değişti
      let secondDone = false;
      const second = appCore.flushSave('b').then(() => { secondDone = true; });
      await new Promise((r) => setTimeout(r, 30));
      expect(secondDone).toBe(false);                 // ilk kayıt bitmeden "kaydedildi" sayılmaz
      release();
      await first; await second;
      expect(written).toEqual([1, 2]);                // ikinci çağrı en son durumu yazdıktan sonra döndü
      expect(secondDone).toBe(true);
    } finally { Object.assign(appCore, saved); appCore.save.inFlight = false; appCore.save.again = false; }
  });
});
