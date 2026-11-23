# Gelecek sürüm tasarım notları (v1'de UYGULANMADI)

Bu kurallar yalnızca ileride eklenecek sistemler için tasarım notudur. v0.1 prototipinde hiçbir ekonomi,
sandık, kupa veya reklam sistemi çalışıyormuş gibi gösterilmez; menüde "Gelecek sürüm" etiketiyle önizlenir.

- 6 haftalık dereceli sezon; sezon sonunda 2.000 üzerindeki kupanın %25'i düşer.
- Gerçek zamanlı iki oyunculu maç, kupa/MMR eşleştirme. Bot maçları dereceli kupa kazandırmaz.
- Altı başlangıç şampiyonu, diğerlerinin açılması (v0.1'de 18'i de açık).
- Dört sandık yuvası: Savaş 2 sa, Büyülü 6 sa, Efsanevi 12 sa.
- Parçaların %70'i odak şampiyona, %30'u diğerlerine.
- Kalıcı geliştirme bonusları yalnızca PvE'de; dereceli PvP'de eşit temel istatistikler.
- Günlük ilk beş bot galibiyetinde azaltılmış ekonomi ödülü.
- Ustalık yalnızca kozmetik ilerleme; kozmetik sezon ödülleri.
- Günlük en fazla üç isteğe bağlı reklamla 30'ar dakika sandık süresi azaltımı.
- Bağlantı kopunca otomatik savaş sürer, 5 sn sonra bot komutan devralır, yeniden bağlanma desteklenir.

## PvP'ye hazırlık (mevcut mimaride korunanlar)
- `src/core` Phaser'dan bağımsızdır; sabit 20 Hz adım, seed'li PRNG, deterministik olay sırası.
- Oyuncu girdileri doğrulanabilir `Command` nesneleridir (`World.applyCommand`), komut günlüğü tutulur.
- `observe(world, team)` takıma özel görünür durumu üretir; sunucu yalnızca bunu gönderebilir.
- `src/network/protocol.ts` mesaj tiplerini tanımlar (canlı sunucu/WebSocket yoktur).
