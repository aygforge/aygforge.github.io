// Başarımlar. ACH_OLD_FRIENDS GDD'de tanımlıdır; diğerleri HTML5 sürümünde eklendi (KARAR).
export const ACHIEVEMENTS = [
  { id: 'ACH_OLD_FRIENDS', name: 'Eski Dostlar', desc: 'Zıpır ve Tarçın, ikisi de gemide. Bazı şeyler ayrılmaz.', secret: true },
  { id: 'ACH_FIRST_VOYAGE', name: 'İlk Yolculuk', desc: 'İlk limanından ayrılıp bir sonraki limana ulaş.' },
  { id: 'ACH_GRAND_HARBOR', name: 'Büyük Liman', desc: "Bir run'ı Büyük Liman'da tamamla." },
  { id: 'ACH_SUNK', name: 'Denizin Dibi', desc: 'Geminin batışını yaşa. Kaybetmek de ilerletir.' },
  { id: 'ACH_GALLEON', name: 'Yüzen Saray', desc: 'Ticaret Galeonu\'na yükselt.' },
  { id: 'ACH_FULL_CREW', name: 'Tam Kadro', desc: 'Beş tayfa ile aynı anda yelken aç.' },
  { id: 'ACH_RICH', name: 'Altın Ambar', desc: 'Bir run içinde 2000 altına ulaş.' },
  { id: 'ACH_CHAIN_MASTER', name: 'Zincirin Sonu', desc: 'Bir event zincirini sonuna kadar tamamla.' },
  { id: 'ACH_TREASURE', name: 'Hazine Avcısı', desc: 'Hazine Peşinde zincirinde hazineyi bul.' },
  { id: 'ACH_GHOST', name: 'Hayaletlerle Konuşan', desc: 'Hayalet Gemi zincirinde kaptanın dileğini yerine getir.' },
  { id: 'ACH_PRINCESS', name: 'Kayıp Prenses', desc: "İsadora'nın gerçek kimliğini ortaya çıkar." },
  { id: 'ACH_BORDERLINE', name: 'Kıl Payı', desc: 'Batmak Üzere bir gemiyle limana ulaş.' },
  { id: 'ACH_TRADER', name: 'Usta Tüccar', desc: 'Tek bir satışta 300 altından fazla kâr et.' },
  { id: 'ACH_EXPLORER', name: 'Ufkun Ötesi', desc: 'Bilinmeyenin Ucu bölgesine ulaş.' },
  { id: 'ACH_ALL_TYPES', name: 'Haritacı', desc: 'Sekiz liman tipinin hepsini keşfet.' },
];
export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
