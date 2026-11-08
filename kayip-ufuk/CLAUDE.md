# Kayıp Ufuk — Claude Code proje talimatı

Bu proje **tam sürüm, mobil yatay HTML5/Canvas2D tropikal ada survival** oyunudur. Ana tasarım kaynağı `Kayip_Ufuk_GDD_v2_0/` klasörüdür. Kaynak dosyaları değiştirme; kodu `src/`, derlenmiş oyunu `dist/`, testleri `tests/` ve üretim raporlarını `reports/` altında oluştur. Eski v0.9–v1.9 yamalarını yeniden uygulama.

Önce `ProductionTruth_v2.0.json` ve `README_BASLANGIC.md` oku, ardından GDD, ilgili DB/Maps, Art ve Contracts dosyalarını referans al. Oyunu kodlamadan önce statik denetim çalıştır; bunu runtime PASS sayma.

**Kesin kilitler:** tek oyuncu, adada yaşayan insan NPC yok; sohbet eden insan telsizi yok; yatay mobil kontrol; vibrant modern pixel art; 4 hazır ev (modüler duvar/çatı yok); 179 item/183 tarif/58 build/38 POI/12 puzzle/15 günlük/20 blueprint/25 canlı/12 crop/8 skill/2 final; 18 dakikalık oyun günü; çevrimdışı ilerleme yok; 3 IndexedDB kayıt slotu; final sonrası ada yaşamına devam.

Sprite kimlikleri için `Art/SpriteCatalog.json` ve `Art/AtlasLayout.json` **tek doğru kaynaktır**, gerçek PNG henüz üretilmemiştir. SpriteID, ItemID veya POIID türetip değiştirme. İşlevsiz menü, sahte QA, placeholder asseti final kabul etme.

Üretim sırası `Contracts/IntegrationMilestones.json`. Test sözleşmesi `Contracts/AcceptanceTests.json` (92 runtime test) ve `Art/AssetAcceptanceTests.json` (28 görsel test). Her P0 test tamamlanmadan RELEASE_READY deme; otomatik veya manuel gerçek kanıt kaydet. Testler çalıştırılamıyorsa NOT_RUN olarak işaretle.

İsteğe göre ilgili proje becerilerini kullan:
- `/kayip-ufuk-build`: sistem inşası ve kaynak DB bağlantıları;
- `/kayip-ufuk-assets`: atlas ve ses üretimi;
- `/kayip-ufuk-qa`: kanıta dayalı kaynak/oyun testleri.

Asıl tek mesaj üretim talimatı: `PROMPT_TEK_MESAJ.txt`.
