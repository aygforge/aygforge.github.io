// Bulut kaydı kuralları (saf mantık; ağ ve arayüz içermez — birim testli).
// İlke: yerel kayıt her zaman asıldır. Bulut, yedek kodunun aynısını (sıkıştırılmış + checksum'lı zarf) saklar.
//  - Boş profil (karakter yok) buluta asla yazılmaz.
//  - Otomatik yükleme, buluttaki bir karakteri kaybettirecek ya da geriletecekse YAPILMAZ (oyuncuya sorulur).
//  - Buluttan indirme yalnız oyuncu onayıyla ve mevcut profilin kurtarma kopyası alınarak yapılır (içe aktarma yolu).

// Kayıt özeti: liderlik ve karşılaştırma için karakter başına küçük satır
export function summarize(profile) {
  return (profile?.characters || []).filter(Boolean).map((c) => ({
    id: c.id, name: c.name, cls: c.cls, level: c.level | 0, exp: c.exp | 0,
  }));
}

// Karakter A, B'den ileri mi (seviye, sonra EXP)
const ahead = (a, b) => a.level > b.level || (a.level === b.level && a.exp > b.exp);

// Buluta yüklemeden önce: { ok, reason?, lost?: [özet], behind?: [özet] }
export function uploadCheck(profile, cloudSummary) {
  const local = summarize(profile);
  if (!local.length) return { ok: false, reason: 'empty', msg: 'Bu cihazda karakter yok — boş profil buluta yazılmaz.' };
  const deleted = new Set(profile?.deletedChars || []);
  const byId = new Map(local.map((c) => [c.id, c]));
  const lost = [], behind = [];
  for (const c of cloudSummary || []) {
    if (!c?.id) continue;
    const l = byId.get(c.id);
    if (!l) { if (!deleted.has(c.id)) lost.push(c); } else if (ahead(c, l)) behind.push({ ...c, localLevel: l.level });
  }
  if (lost.length || behind.length) {
    const parts = [
      ...lost.map((c) => `${c.name} Lv.${c.level} (bu cihazda yok)`),
      ...behind.map((c) => `${c.name} bulutta Lv.${c.level}, burada Lv.${c.localLevel}`),
    ];
    return { ok: false, reason: 'behind', lost, behind, msg: `Bulut kaydı bu cihazdakinden ileri: ${parts.join(', ')}.` };
  }
  return { ok: true };
}

// Liderlik satırları (karakter başına)
export function leaderboardRows(profile, nickname) {
  return (profile?.characters || []).filter(Boolean).map((c) => ({
    char_id: c.id,
    nickname: String(nickname || 'Oyuncu').slice(0, 16),
    char_name: String(c.name).slice(0, 16),
    cls: c.cls,
    level: c.level | 0,
    exp: c.exp | 0,
    kills: c.history?.kills | 0,
    boss_kills: Object.values(c.history?.bossKills || {}).reduce((a, n) => a + (n | 0), 0),
    quests: Object.values(c.quests || {}).filter((q) => q?.s === 'done').length,
    updated_at: new Date().toISOString(),
  }));
}

export const AUTO_UPLOAD_MIN_MS = 3 * 60 * 1000;   // otomatik bulut kaydı en sık 3 dakikada bir
