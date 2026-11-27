// Monetization — saf kurallar (platform bağımsız, test edilebilir). Gerçek SDK çağrıları platform/ adaptörlerinde.
// - Interstitial: ilk 2 tamamlanan koşuda yok; en az 2 tamamlanan koşu arayla ve ≥ 5 dk; reklam kaldırma hakkında hiç yok.
//   Yalnız sonuç ekranından menüye geçerken çağrılır (savaş/dalga/kart seçiminde ASLA).
// - Rewarded: ödül yalnız doğrulanmış sağlayıcı callback'i ({status:'rewarded', verified:true, rewardId}) sonrası, rewardId başına 1 kez.
// - IAP: satın alma token'ı başına tek tahsis; restore yalnız sahip olunan (iade edilmemiş) kalıcı hakları bırakır.
import { MONETIZATION } from '../platform/monetization.config.js';

const monet = (save) => (save.monet ||= { completedRuns: 0, sinceInterstitial: 0, lastInterstitialAt: 0, adRewardIds: [], tipBonusRuns: [] });
const iap = (save) => (save.iap ||= { entitlements: [], tokens: [] });
export const hasEntitlement = (save, id) => iap(save).entitlements.includes(id);

export function noteRunCompleted(save) {
  const m = monet(save);
  m.completedRuns++;
  m.sinceInterstitial++;
}
export function interstitialDue(save, now) {
  const m = monet(save);
  if (hasEntitlement(save, 'remove_ads')) return false;
  return m.completedRuns > 2 && m.sinceInterstitial >= 2 && now - (m.lastInterstitialAt || 0) >= 5 * 60 * 1000;
}
export function noteInterstitialShown(save, now) {
  const m = monet(save);
  m.sinceInterstitial = 0;
  m.lastInterstitialAt = now;
}

// true once per verified reward event; anything else (unavailable/failed/cancelled/unverified/replayed) -> false
export function consumeAdReward(save, result) {
  if (!result || result.status !== 'rewarded' || result.verified !== true || !result.rewardId) return false;
  const m = monet(save);
  if (m.adRewardIds.includes(result.rewardId)) return false;
  m.adRewardIds.push(result.rewardId);
  if (m.adRewardIds.length > 100) m.adRewardIds.splice(0, m.adRewardIds.length - 100);
  return true;
}

// Result screen: +40 % of that run's tip reward, once per runId, only for a verified reward.
export function applyTipBonus(save, runId, runTips, adResult) {
  const m = monet(save);
  if (!runTips || m.tipBonusRuns.includes(runId)) return 0;
  if (!consumeAdReward(save, adResult)) return 0;
  const bonus = Math.round(runTips * 0.4);
  m.tipBonusRuns.push(runId);
  if (m.tipBonusRuns.length > 50) m.tipBonusRuns.splice(0, m.tipBonusRuns.length - 50);
  save.tips += bonus;
  return bonus;
}

// Purchase from the billing adapter: { productId, token, state: 'purchased' | 'pending' | 'failed' | 'cancelled' }
export function applyPurchase(save, p) {
  const def = MONETIZATION.billing.products[p?.productId];
  if (!def || p.state !== 'purchased' || !p.token) return { ok: false, reason: 'not_purchased' };
  const s = iap(save);
  if (s.tokens.includes(p.token)) return { ok: false, reason: 'duplicate' };
  if (def.type === 'non_consumable' && s.entitlements.includes(p.productId)) {
    s.tokens.push(p.token);
    return { ok: false, reason: 'owned' };
  }
  s.tokens.push(p.token);
  if (def.type === 'non_consumable') s.entitlements.push(p.productId);
  if (def.grant) {
    save.tips += def.grant.tips || 0;
    save.currencyParts += def.grant.parts || 0;
  }
  return { ok: true, grant: def.grant || null };
}

// Restore: the store's list of currently OWNED non-consumables is the truth. Refunded/revoked items disappear;
// already-granted resources are never clawed back into negatives.
export function restorePurchases(save, ownedIds) {
  const s = iap(save);
  const nonCons = Object.entries(MONETIZATION.billing.products).filter(([, d]) => d.type === 'non_consumable').map(([id]) => id);
  const before = [...s.entitlements];
  s.entitlements = nonCons.filter((id) => ownedIds.includes(id));
  return { added: s.entitlements.filter((id) => !before.includes(id)), removed: before.filter((id) => !s.entitlements.includes(id)) };
}
