// PurchaseService — Google Play Billing soyutlaması.
// Web: "unavailable" (fiyat, satın alma başarısı veya hak ASLA sahte gösterilmez).
// Android: cordova-plugin-purchase (CdvPurchase) KURULU ve Play Console'da ürünler aktifse native adaptör çalışır.
// Hak tahsisi Monetization.applyPurchase (token başına bir kez) / restorePurchases (iade edilenler düşer) ile yapılır.
// Not: üretimde satın alma doğrulaması sunucu tarafı gerektirebilir (README_RELEASE.md).
import { MONETIZATION } from './monetization.config.js';

export const PRODUCTS = [
  { id: 'remove_ads', name: 'Reklamsız', desc: 'Geçiş reklamlarını kaldırır (ödüllü reklamlar isteğe bağlı kalır).' },
  { id: 'starter_pack', name: 'Başlangıç Paketi', desc: '500 bahşiş + 60 parça (bir kez).' },
  { id: 'tip_pack', name: 'Bahşiş Kesesi', desc: '1500 bahşiş.' },
  { id: 'apron_cosmetic', name: 'Desenli Önlük', desc: 'Kozmetik. Oynanışa etkisi yok.' },
];
const store = () => globalThis.Capacitor?.isNativePlatform?.() && globalThis.CdvPurchase?.store;

export class PurchaseService {
  isAvailable() {
    return !!store();
  }
  async listProducts() {
    const s = store();
    return PRODUCTS.map((p) => {
      const sp = s?.get?.(p.id);
      return { ...p, type: MONETIZATION.billing.products[p.id].type, price: sp?.pricing?.price ?? null, available: !!sp?.canPurchase };
    });
  }
  // Resolves { productId, token, state } for Monetization.applyPurchase; never 'purchased' without the store.
  async purchase(productId) {
    const s = store();
    if (!s) return { status: 'unavailable', productId, state: 'failed' };
    try {
      const offer = s.get(productId)?.getOffer?.();
      if (!offer) return { productId, state: 'failed' };
      const res = await new Promise((resolve) => {
        s.when().approved((tx) => {
          tx.verify?.();
          tx.finish?.();
          resolve({ productId, token: tx.transactionId || tx.purchaseId, state: 'purchased' });
        });
        offer.order().then((err) => err && resolve({ productId, state: 'failed' }));
      });
      return res;
    } catch {
      return { productId, state: 'failed' };
    }
  }
  // Owned (not refunded / revoked) non-consumables according to the store.
  async restore() {
    const s = store();
    if (!s) return { status: 'unavailable', owned: [] };
    try {
      await s.restorePurchases?.();
      return { status: 'ok', owned: PRODUCTS.map((p) => p.id).filter((id) => s.get(id)?.owned) };
    } catch {
      return { status: 'failed', owned: [] };
    }
  }
}

export const purchaseService = new PurchaseService();
