# Test sonuçları biçimi

`reports/test-results.json` örnek:

```json
{
  "sourceVersion": "v2.0",
  "runtime": [{"id":"AT_BOOT_DATA_01", "status":"NOT_RUN", "evidence":[], "notes":"Oyun henüz üretilmedi"}],
  "visual": [{"id":"VIS_01", "status":"NOT_RUN", "evidence":[], "notes":"Atlas PNG eksik"}],
  "environment": {"browser":null,"device":null,"build":"dist"},
  "releaseReady":false
}
```

Bütün 92 runtime testin ve 28 görsel testin ID'lerini kaynaktan al. Bilinmeyen testleri otomatik PASS yapma; test ID'lerini silme veya ismini değiştirme. Her PASS bir ekran görüntüsü, log, automated assertion veya save-diff kanıtı ister. P0 blokaj varsa `releaseReady=false`.
