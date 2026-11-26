# CozFis — Upload Anahtarı (Keystore) Saklama ve Yedekleme

Bu belgede **şifre ya da özel anahtar yoktur**. Anahtar dosyası (`.jks`) ve şifresi Git'e asla eklenmez.
Kökteki ve `android/` altındaki `.gitignore` dosyaları `keystore.properties`, `*.jks` ve `*.keystore` dosyalarını dışlar.

## Anahtar bilgileri (gizli değil)

| Alan | Değer |
|---|---|
| Uygulama kimliği | `com.aygforge.cozfis` (26.11.2026'da kalıcı olarak onaylandı) |
| Dosya | `cozfis-upload.jks` (PKCS12) |
| Alias | `cozfis-upload` |
| Algoritma | RSA 4096, SHA384withRSA |
| Sahip | `CN=Ayg Forge, O=Ayg Forge` |
| Geçerlilik | 26.11.2026 – 13.04.2054 |
| SHA-1 | `19:D0:14:18:98:40:20:9C:FA:48:8C:CB:18:C1:85:05:BA:B0:E0:A9` |
| SHA-256 | `3C:66:C7:9F:FF:3B:FD:A6:E0:F8:A0:00:6C:CF:CD:A9:11:97:58:5F:70:35:5B:08:F2:0D:87:E7:30:39:AE:B7` |

Anahtar deposu şifresi ile anahtar şifresi aynıdır (PKCS12 bunu gerektirir).

## Bu bir "upload key"dir — Play App Signing

Google Play'e ilk yüklemede **Play App Signing** etkinleştirilir. Yeni uygulamalarda bu varsayılan ve zorunludur.
- Uygulamayı kullanıcılara dağıtırken imzalayan **uygulama imzalama anahtarını Google** üretir ve saklar.
- Bu dosya yalnızca sizin Play'e yaptığınız **yüklemeleri** imzalar.
- Upload anahtarı kaybolur ya da sızarsa Play Console › Kurulum › Uygulama imzalama › "Upload anahtarını sıfırla" adımıyla yenisi
  tanımlanabilir. Bu işlem birkaç gün sürebilir; uygulama bu sürede güncellenemez.

## Yedekleme (hemen yapın)

1. **Parola yöneticisi:** Yeni bir kayıt açın (ör. "CozFis Play upload key"). Şifreyi, alias'ı (`cozfis-upload`) ve yukarıdaki
   SHA-256 parmak izini yazın. `cozfis-upload.jks` dosyasını kayda **ek olarak** yükleyin.
   1Password, Bitwarden ve KeePassXC dosya eklemeyi destekler.
2. **İkinci, çevrimdışı kopya:** `.jks` dosyasını şifreli bir USB belleğe ya da şifreli bir arşive (ör. `7z -p`, AES-256) koyun.
   Şifreyi bu kopyanın yanına **yazmayın**.
3. **İsteğe bağlı üçüncü kopya:** Arşivi kişisel bulut depolamaya koyabilirsiniz. Arşiv şifresi ile keystore şifresi farklı olmalı.
4. Kopyaları doğrulayın:
   ```bash
   keytool -list -v -keystore cozfis-upload.jks -alias cozfis-upload
   ```
   Komut şifreyi sorar. Çıktıdaki SHA-256 değeri bu belgedekiyle aynı olmalı.
5. Bulut oturumu kapandığında oturum içindeki kopya silinir. **Teslim edilen dosya tek kopyadır;** yedekleri aynı gün alın.

## Yerel derleme makinesinde kullanım

`cozfis/CozFis/android/keystore.properties` dosyasını oluşturun. Bu dosya Git'e girmez; izinlerini `chmod 600` ile kısıtlayın.

```properties
storeFile=/tam/yol/cozfis-upload.jks
storePassword=<parola yöneticisinden>
keyAlias=cozfis-upload
keyPassword=<aynı şifre>
```

Ardından:

```bash
npm run android:aab                      # → dist/CozFis_Release.aab (imzalı)
jarsigner -verify dist/CozFis_Release.aab
keytool -printcert -jarfile dist/CozFis_Release.aab   # SHA-256 değeri yukarıdakiyle aynı olmalı
```

`keystore.properties` yoksa çıktı **imzasız** olur ve komut bunu belirtir.

## Yapılmaması gerekenler

- `.jks` dosyasını veya şifreyi Git'e, e-postaya, sohbet uygulamalarına ya da paylaşılan klasörlere koymayın.
- Anahtarı CI ortamına koymak gerekirse yalnızca gizli değişken (secret) olarak koyun. Dosyayı base64 ile kodlayıp secret'a,
  şifreyi ayrı bir secret'a yazın.
- Yeni bir anahtar üretip onunla yüklemeye çalışmayın. Play, kayıtlı upload anahtarıyla imzalanmayan paketi reddeder.

## Her yeni yüklemede

1. `android/version.properties` dosyasında `versionCode` değerini **artırın** (1 → 2 → 3 …). `versionName` serbesttir.
2. `npm run android:aab` çalıştırın ve imzayı doğrulayın.
3. Play Console'da ilgili test kanalına yeni bir sürüm oluşturun.
