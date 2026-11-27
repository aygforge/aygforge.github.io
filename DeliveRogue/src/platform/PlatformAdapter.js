// platform/PlatformAdapter.js — browser vs native capability boundary (Phase 01 skeleton).
// Browser/offline build: rewarded ads and billing are UNAVAILABLE. No fake grants are possible:
// every request resolves to { ok: false, reason: 'unavailable' }. Native Android (AdMob rewarded,
// Play Billing) is connected in a later phase through a native bridge that replaces these methods.
const isNative = typeof window !== 'undefined' && !!window.DeliveRogueNative;

export const PlatformAdapter = {
  kind: isNative ? 'native' : 'browser',
  ads: { available: false, async showRewarded(/* placementId */) { return { ok: false, reason: 'unavailable' }; } },
  billing: { available: false, async purchase(/* productId */) { return { ok: false, reason: 'unavailable' }; },
    async restore() { return { ok: false, reason: 'unavailable', items: [] }; } },
};
