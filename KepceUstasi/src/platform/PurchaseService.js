// PurchaseService — uygulama içi satın alma soyutlaması. Tarayıcıda "unavailable".
export const PRODUCTS = [
  { id: 'remove_ads', name: 'Reklamsız', desc: 'Zorunlu geçiş reklamlarını kaldırır (ödüllü reklamlar isteğe bağlı kalır).' },
  { id: 'tip_pack_small', name: 'Küçük Bahşiş Kesesi', desc: 'Bahşiş paketi.' },
  { id: 'apron_cosmetic', name: 'Desenli Önlük', desc: 'Kozmetik. Oynanışa etkisi yok.' },
];

export class PurchaseService {
  isAvailable() {
    return false;
  }
  async listProducts() {
    return PRODUCTS.map((p) => ({ ...p, price: null, available: false }));
  }
  async purchase(productId) {
    return { status: 'unavailable', productId, granted: false };
  }
  async restore() {
    return { status: 'unavailable', restored: [] };
  }
}

export const purchaseService = new PurchaseService();
