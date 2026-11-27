# Gizlilik / Play Console veri güvenliği notları (V1.0)

**Şu anki derleme (web ve Android debug):** reklam SDK'sı ve faturalandırma eklentisi **kurulu değil**. Uygulama hesap, ad, e-posta, konum, kişi listesi veya cihaz kimliği toplamaz; sunucuya veri göndermez. Kayıt yalnız cihazda (WebView localStorage). İzin: yalnız `INTERNET` (Capacitor varsayılanı; oyun çevrimdışı çalışır).

## AdMob eklenince (`@capacitor-community/admob`)
- Google Mobile Ads SDK: reklam kimliği (AAID), IP'den yaklaşık konum, cihaz/uygulama bilgisi, etkileşim ve çökme/teşhis verileri toplanabilir; reklam ve analiz amaçlı, Google ile paylaşılır.
- Play Console → Veri güvenliği: "Cihaz veya diğer kimlikler", "Uygulama etkinliği (etkileşimler)", "Uygulama bilgileri ve performans" → toplandı + paylaşıldı (reklam). Aktarımda şifreli: evet.
- Manifest: `com.google.android.gms.permission.AD_ID` (Android 13+ hedeflerde reklam kimliği için).
- AB/BK/İsviçre için onay: Google UMP (AdService `requestConsentInfo` / `showConsentForm` çağırır; AdMob konsolunda GDPR mesajı oluşturulmalı).
- Çocuklara yönelik değilse "Families" politikası dışı işaretlenmeli; hedef kitle 13+ önerilir (karar sizin).

## Google Play Billing eklenince (`cordova-plugin-purchase`)
- Satın alma geçmişi (Play üzerinden). Hassas ödeme verisi uygulamaya gelmez.
- Veri güvenliği: "Finansal bilgi → Satın alma geçmişi" (uygulama işlevi).

## Doldurmanız gerekenler
Gizlilik politikası URL'si, geliştirici iletişim e-postası, hedef yaş grubu, içerik derecelendirme anketi, reklam içerir beyanı.
