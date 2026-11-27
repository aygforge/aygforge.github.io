// AdService — reklam soyutlaması.
// Web / itch.io: gerçek reklam YOK -> her çağrı "unavailable"; ASLA sahte ödül verilmez, oyun akışı kilitlenmez.
// Android (Capacitor): @capacitor-community/admob eklentisi KURULU ve monetization.config.js'te kimlikler (veya test
// birimleri) varsa native adaptör çalışır. Ödül yalnız eklentinin "kazanıldı" callback'inden sonra, benzersiz
// rewardId ile döner; Monetization.consumeAdReward aynı rewardId'yi ikinci kez kabul etmez.
import { registerPlugin } from '@capacitor/core';
import { MONETIZATION } from './monetization.config.js';

// Only when the native AdMob plugin is really installed in the Android project (isPluginAvailable); never on web.
let admob = null;
const plugin = () => {
  const C = globalThis.Capacitor;
  if (!C?.isNativePlatform?.() || !C.isPluginAvailable?.('AdMob')) return null;
  return (admob ||= registerPlugin('AdMob'));
};
const unit = (kind) => (MONETIZATION.admob.useTestAds ? MONETIZATION.admob.testUnits : MONETIZATION.admob.units)[kind];

export class AdService {
  constructor() {
    this.platform = plugin() ? 'android' : 'web';
    this.ready = false;
  }
  isAvailable() {
    return !!plugin() && !!unit('rewarded');
  }
  async init() {
    const p = plugin();
    if (!p || this.ready) return this.ready;
    try {
      // consent (UMP) must be gathered before ads in regions that need it
      if (p.requestConsentInfo) {
        const info = await p.requestConsentInfo();
        if (info?.isConsentFormAvailable && info.status === 'REQUIRED') await p.showConsentForm();
      }
      await p.initialize({ initializeForTesting: MONETIZATION.admob.useTestAds });
      this.ready = true;
    } catch {
      this.ready = false;
    }
    return this.ready;
  }
  // kind: 'rewarded_tip_bonus' | 'rewarded_continue' | 'rewarded_reroll' | 'rewarded_energy_refill' | 'interstitial'
  async show(kind) {
    const p = plugin();
    if (!p || !(await this.init())) return { status: 'unavailable', kind, rewarded: false };
    try {
      if (kind === 'interstitial') {
        await p.prepareInterstitial({ adId: unit('interstitial'), isTesting: MONETIZATION.admob.useTestAds });
        await p.showInterstitial();
        return { status: 'shown', kind, rewarded: false };
      }
      await p.prepareRewardVideoAd({ adId: unit('rewarded'), isTesting: MONETIZATION.admob.useTestAds });
      const item = await p.showRewardVideoAd(); // resolves only after onUserEarnedReward
      if (!item) return { status: 'cancelled', kind, rewarded: false };
      return { status: 'rewarded', verified: true, rewardId: `${kind}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`, kind, rewarded: true };
    } catch {
      return { status: 'failed', kind, rewarded: false };
    }
  }
  shouldShowInterstitial() {
    return this.isAvailable();
  }
}

export const adService = new AdService();
