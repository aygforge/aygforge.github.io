// Ödüllü reklam adaptörü. Bu sürümde GERÇEK bir reklam SDK'sı YOKTUR.
// Entegrasyon: sayfaya window.DUMEN_AD_PROVIDER = { isReady(): bool, showRewarded(): Promise<{rewarded: bool}> } eklenirse,
// yalnız rewarded===true geri çağrısından sonra tek kullanımlık bir ödül jetonu üretilir; çark eylemi jetonu doğrular.
// Sağlayıcı yoksa reklamlı haklar devre dışıdır ("reklam entegrasyonu gerekli"). Sahte reklam izletilmez.
(function (D) {
  'use strict';
  const tokens = new Set();
  let seq = 0;
  const Ads = {
    provider() { return globalThis.DUMEN_AD_PROVIDER || null; },
    isAvailable() { const p = Ads.provider(); try { return !!(p && p.isReady && p.isReady()); } catch (e) { return false; } },
    statusText() { return Ads.isAvailable() ? 'Reklam hazır' : 'Reklam entegrasyonu gerekli (bu sürümde reklam SDK\'sı yok)'; },
    async showRewarded() {
      const p = Ads.provider();
      if (!p || !Ads.isAvailable()) return { ok: false, reason: 'Reklam sağlayıcısı yok.' };
      try {
        const r = await p.showRewarded();
        if (r && r.rewarded === true) { const t = 'ad-' + Date.now() + '-' + (++seq); tokens.add(t); return { ok: true, token: t }; }
        return { ok: false, reason: 'Reklam tamamlanmadı; hak verilmedi.' };
      } catch (e) { return { ok: false, reason: 'Reklam hatası: ' + e.message }; }
    },
    consumeToken(t) { if (t && tokens.has(t)) { tokens.delete(t); return true; } return false; }
  };
  D.Ads = Ads;
})(globalThis.DUMEN);
