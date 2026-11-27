# Kepçe Ustası — Alpha 0.4C | Kısa Uygulama Talimatı

**Görev:** ÇALIŞAN Alpha 0.4B kaynak projesini koruyarak 20 campaign level'ının birbirinin kopyası gibi hissettirmesini gider. Oyunu sıfırdan yazma, yeni chapter/dungeon/ekipman/şef ekleme.

**Girdi:** Yanındaki `Alpha04C_Level_Identity_20.json` dosyası, önceki Alpha 0.4 tasarım verisinden oluşturulmuş **entegrasyon önerisidir**; mevcut 0.4B kod şeması olduğu varsayılmaz. Önce gerçek kaynakta level adaptörünü, `RunController` dalga akışını, son düşman/zafer kapısını ve `RecipeTracker` verisini kısa incele; JSON'u mevcut şemaya doğru bağla.

## Kodla

1. **20 gerçek level kimliği:** JSON'daki her level için adı, tarif hedefi, ayrı dalga kompozisyonu, dalga sayısı (3–6) ve final karşılaşmasını uygula. 10. ve 20. level'daki mevcut chapter boss mekaniklerini koru. 5 ve 15 mini boss; 9 ve 19 iki elitli final olsun. Boss olmayan her level'da aynı güçlü domates/patatesi tekrar tekrar final yapma.
2. **Kısa, normal, uzun koşu:** Normal dalga sayısı dinamik olsun; her normal dalgadan sonra bir kart seçimi, finalden sonra kart yok. Mevcut 24 yetenek ve seçme sistemi aynen çalışsın. Dört dalgalı koşu dört kart, altı dalgalı koşu altı kart versin.
3. **Mevcut sistemleri kullan:** `rush/near` düşmanları biraz yakında doğurur, ancak düşmanlar **yalnız tur sonunda sağdan sola** hareket eder. `swarm` düşük/orta can ve sayıca fazla düşman kullanır; `armor` mevcut kalkan/zırhı öne çıkarır; `staggered` düşmanların X konumlarını farklı dağıtır, sabit lane yaratmaz. `pot_bonus` sadece mevcut büyük yağın dolum ihtimalini bu level'da 1,35 ile çarpar; gerçek Matter.js fizik, kepçe kapasitesi ve hibrit tencere korunur. Başka mekanik, yeni yağ türü veya yeni sanat altyapısı icat etme.
4. **Final düşmanları:** JSON'daki `enemies` dizisi 1 veya 2 düşman içerebilir. Çift finalde level, iki final düşmanı da yenilince tamamlanır; ödül bir kez verilir. Mevcut basit sprite'ları yeniden kullan; isteğe bağlı küçük renk/ölçek farkı ve kısa isim etiketi yeterli. Ayrı animasyon seti hazırlama.
5. **Oyuncuya farklılık göster:** Level girişinde 1–2 saniyelik sade başlık, `stageIdentity.onScreenRuleLabel` etiketi ve Menemen/Patates tarif hedeflerini göster. Ekranın üst savaş / alt kepçe düzenini ve minimalist menüyü bozma.
6. **İlerlemenin korunması:** Tamamlanan level'ları, ekipman Common/Uncommon/Rare, SG, dungeon hakları, enerji, bahşiş ve kayıt geçişlerini değiştirme. Var olan level ID'lerini koru. Ekipman, ekonomi, günlük limit, reklama bağlı haklar ve boss AI'ı bu revizyonun kapsamı dışında.

## Kısa test bütçesi

- `npm run build` ve yalnız ilgili birim testleri. Tüm testler kısa sürüyorsa `npm test`.
- Hedefli kontroller: L1 3 dalga/3 kart, L8 rush, L9 çift elit zaferi, L10 eski boss, L19 çift zırhlı, L20 boss, kayıt/yükseltme/enerji korunuyor.
- **En fazla 3 kısa smoke koşusu.** 100+/1000+ seed, kapsamlı benchmark, uzun analiz veya denge raporu YAPMA.
- Teslim: güncellenmiş proje ZIP + web build ZIP + **10 satırı geçmeyen** değişiklik/test özeti. Kaynak kodun tamamını sohbete dökme.

**Kabul kriteri:** L1–L20'nin her biri en az dalga düzeni, düşman baskısı, hedef tarif veya final biçiminde somut bir farklılık taşır. Fiziksel yakalama, savaş tur sırası ve 0.4B ilerlemesi bozulmaz.
