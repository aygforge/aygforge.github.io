// Çevrimiçi test katmanı: ayar doğrulama, bulut kaydı kuralları, liderlik satırları ve REST istemcisi (sahte Supabase ile).
import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/rng.js';
import { createCharacter, gainExp } from '../../src/systems/character.js';
import { newProfile, encodeBackupCode, decodeBackupCode } from '../../src/save/serialize.js';
import { cumulativeXp } from '../../src/data/constants.js';
import { validateConfig, shareCode, parseShareCode } from '../../src/online/config.js';
import { summarize, uploadCheck, leaderboardRows } from '../../src/online/cloud.js';
import { OnlineApi, errorText } from '../../src/online/api.js';
import { createFakeSupabase } from '../fake-supabase.mjs';

const rng = new Rng(7);
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (role) => `${b64u({ alg: 'HS256' })}.${b64u({ role, iss: 'supabase' })}.sig`;
const URL_ = 'https://abcd1234.supabase.co';

function profileWith(chars) {
  const p = newProfile();
  chars.forEach(([cls, lv], i) => {
    const c = createCharacter({ name: 'Oyuncu' + i, cls, slot: i }, rng);
    if (lv > 1) gainExp(c, cumulativeXp(lv));
    p.characters[i] = c;
  });
  return p;
}

describe('Çevrimiçi ayar', () => {
  it('yalnız herkese açık anahtar kabul edilir; gizli anahtar ve hatalı adres reddedilir', () => {
    expect(validateConfig({ url: URL_, anonKey: jwt('anon') }).ok).toBe(true);
    expect(validateConfig({ url: URL_ + '/', anonKey: 'sb_publishable_abc123' }).cfg.url).toBe(URL_);
    const sr = validateConfig({ url: URL_, anonKey: jwt('service_role') });
    expect(sr.ok).toBe(false); expect(sr.msg).toMatch(/GİZLİ/);
    expect(validateConfig({ url: URL_, anonKey: 'sb_secret_xyz' }).ok).toBe(false);
    expect(validateConfig({ url: 'http://abcd.supabase.co', anonKey: jwt('anon') }).ok).toBe(false);
    expect(validateConfig({ url: URL_, anonKey: 'rastgele' }).ok).toBe(false);
    expect(validateConfig({ url: '', anonKey: '' }).empty).toBe(true);
  });
  it('sunucu kodu gidip gelir ve yalnız adres + açık anahtarı taşır', () => {
    const cfg = validateConfig({ url: URL_, anonKey: 'sb_publishable_abc' }).cfg;
    const code = shareCode(cfg);
    expect(code.startsWith('AHO1:')).toBe(true);
    expect(parseShareCode(code).cfg).toEqual(cfg);
    expect(parseShareCode('AHV1g:xxx').ok).toBe(false);
  });
});

describe('Bulut kaydı kuralları', () => {
  it('boş profil buluta asla yazılmaz', () => {
    const r = uploadCheck(newProfile(), []);
    expect(r.ok).toBe(false); expect(r.reason).toBe('empty');
  });
  it('bulutta bu cihazda olmayan ya da daha ileri karakter varsa yükleme durur; silinen karakter sayılmaz', () => {
    const p = profileWith([['archer', 10]]);
    const [c] = summarize(p);
    expect(uploadCheck(p, []).ok).toBe(true);
    expect(uploadCheck(p, [{ ...c }]).ok).toBe(true);
    const ahead = uploadCheck(p, [{ ...c, level: 12 }]);
    expect(ahead.ok).toBe(false); expect(ahead.behind.length).toBe(1);
    const sameLvMoreExp = uploadCheck(p, [{ ...c, exp: c.exp + 50 }]);
    expect(sameLvMoreExp.ok).toBe(false);
    const other = { id: 'baska', name: 'Diğer', cls: 'mage', level: 5, exp: 0 };
    expect(uploadCheck(p, [c, other]).lost.length).toBe(1);
    p.deletedChars = ['baska'];
    expect(uploadCheck(p, [c, other]).ok).toBe(true);
    // bu cihaz daha ileride: yükleme serbest
    expect(uploadCheck(p, [{ ...c, level: 8 }]).ok).toBe(true);
  });
  it('liderlik satırları: karakter başına seviye, öldürme, boss, tamamlanan görev', () => {
    const p = profileWith([['necromancer', 20], ['warrior', 5]]);
    p.characters[0].history.kills = 321;
    p.characters[0].history.bossKills = { alpha_wolf: 2, mine_golem: 1 };
    p.characters[0].quests = { m01: { s: 'done' }, m02: { s: 'done' }, m03: { s: 'active' } };
    const rows = leaderboardRows(p, 'Ayg');
    expect(rows.length).toBe(2);
    expect(rows[0]).toMatchObject({ nickname: 'Ayg', cls: 'necromancer', level: 20, kills: 321, boss_kills: 3, quests: 2 });
  });
});

describe('REST istemcisi (sahte Supabase)', () => {
  const cfg = { url: URL_, anonKey: jwt('anon') };
  it('kayıt → takma ad → bulut kaydı → başka cihazda giriş ve indirme; kod çözülür, profil aynı', async () => {
    const fake = createFakeSupabase();
    const a = new OnlineApi(cfg, { fetchImpl: fake.fetchImpl });
    expect((await a.signUp('a@x.com', 'gizli123', 'Ayg')).ok).toBe(true);
    expect(await a.getNickname()).toBe('Ayg');
    expect((await a.getCloudMeta()).meta).toBe(null);
    const p = profileWith([['archer', 15]]);
    const code = await encodeBackupCode(p);
    expect((await a.putCloud({ code, summary: summarize(p), gameVersion: 'x', schemaVersion: 4 })).ok).toBe(true);
    expect((await a.putCloud({ code, summary: summarize(p), gameVersion: 'x', schemaVersion: 4 })).ok).toBe(true);   // upsert
    expect(fake.db.cloud_saves.length).toBe(1);
    expect((await a.putLeaderboard(leaderboardRows(p, 'Ayg'))).ok).toBe(true);
    // ikinci cihaz
    const b = new OnlineApi(cfg, { fetchImpl: fake.fetchImpl });
    expect(b.loggedIn).toBe(false);
    expect((await b.signIn('a@x.com', 'yanlis')).msg).toMatch(/yanlış/);
    expect((await b.signIn('a@x.com', 'gizli123')).ok).toBe(true);
    const got = await b.getCloudCode();
    const d = await decodeBackupCode(got.row.code);
    expect(d.ok).toBe(true);
    expect(d.profile.characters[0].name).toBe(p.characters[0].name);
    expect(d.profile.characters[0].level).toBe(15);
    const board = await b.getLeaderboard();
    expect(board.rows[0]).toMatchObject({ nickname: 'Ayg', level: 15, cls: 'archer' });
  });
  it('başka oyuncunun bulut kaydı görünmez; takma ad tekildir; anonim liderliği okur ve bildirim gönderir', async () => {
    const fake = createFakeSupabase();
    const a = new OnlineApi(cfg, { fetchImpl: fake.fetchImpl });
    await a.signUp('a@x.com', 'gizli123', 'Ayg');
    await a.putCloud({ code: 'AHV1:e30=', summary: [], gameVersion: 'x', schemaVersion: 4 });
    const b = new OnlineApi(cfg, { fetchImpl: fake.fetchImpl });
    const rb = await b.signUp('b@x.com', 'gizli123', 'Ayg');
    expect(rb.ok).toBe(true); expect(rb.warn).toMatch(/alınmış/);
    expect((await b.getCloudCode()).ok).toBe(false);
    const anon = new OnlineApi(cfg, { fetchImpl: fake.fetchImpl });
    expect((await anon.getLeaderboard()).ok).toBe(true);
    expect((await anon.sendFeedback('bir hata var', { v: 1 })).ok).toBe(true);
    expect(fake.db.feedback[0]).toMatchObject({ message: 'bir hata var', user_id: null });
  });
  it('süresi dolan oturum yenilenir; reddedilen yenilemede oturum kapanır; ağ hatası anlaşılır mesaj verir', async () => {
    const fake = createFakeSupabase();
    const a = new OnlineApi(cfg, { fetchImpl: fake.fetchImpl });
    await a.signUp('a@x.com', 'gizli123', 'Ayg');
    a.session.expires_at = 0;                      // istemci tarafında süre doldu → yenilenir
    expect((await a.getCloudMeta()).ok).toBe(true);
    fake.expireAll();                              // sunucu tarafında geçersiz → 401 → yenile → yeniden dene
    expect((await a.getCloudMeta()).ok).toBe(true);
    fake.expireAll(); a.session.refresh_token = 'gecersiz'; a.session.expires_at = 0;
    expect((await a.getCloudMeta()).ok).toBe(false);
    expect(a.loggedIn).toBe(false);
    const down = new OnlineApi(cfg, { fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
    const r = await down.signIn('a@x.com', 'gizli123');
    expect(r.ok).toBe(false); expect(r.msg).toMatch(/ulaşılamadı/);
  });
  it('e-posta onayı açıksa kayıt anlaşılır biçimde durur; tablo yoksa kurulum mesajı', async () => {
    const fake = createFakeSupabase({ confirmEmail: true });
    const a = new OnlineApi(cfg, { fetchImpl: fake.fetchImpl });
    const r = await a.signUp('a@x.com', 'gizli123', 'Ayg');
    expect(r.ok).toBe(false); expect(r.needsConfirm).toBe(true); expect(r.msg).toMatch(/Confirm email/);
    expect(errorText(404, { message: "Could not find the table 'public.cloud_saves'" })).toMatch(/kurulum/);
  });
});
