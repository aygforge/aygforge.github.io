// AdService — reklam soyutlaması. Alpha 0.1 / tarayıcı: gerçek reklam YOK, her çağrı "unavailable" döner.
// Android (Capacitor) sürümünde bu sınıfın yerine gerçek SDK adaptörü bağlanacak.
// Kural: reklam başarısız/yoksa ASLA ödül verilmez ve oyun akışı kilitlenmez.
export class AdService {
  constructor() {
    this.platform = 'web';
  }
  isAvailable() {
    return false;
  }
  // kind: 'rewarded_tip_bonus' | 'rewarded_continue' | 'rewarded_reroll' | 'interstitial'
  async show(kind) {
    return { status: 'unavailable', kind, rewarded: false };
  }
  // Future interstitial pacing (GDD §15): never in the first 2 runs; at most every 2 finished runs AND >= 5 min.
  shouldShowInterstitial({ finishedRuns, runsSinceLast, msSinceLast, rewardedThisBreak }) {
    if (!this.isAvailable()) return false;
    if (rewardedThisBreak) return false;
    return finishedRuns > 2 && runsSinceLast >= 2 && msSinceLast >= 5 * 60 * 1000;
  }
}

export const adService = new AdService();
