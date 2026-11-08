# Kayıp Ufuk — Claude Opus'a nasıl verilir?

## Önerilen tek dosya kurulumu (Claude Code / Cursor / terminal ortamı)
1. `Kayip_Ufuk_Opus_Tek_Paket_v2_0.zip` arşivini **boş proje klasörüne çıkart**. ZIP içinde `Kayip_Ufuk_GDD_v2_0/` (tam GDD, 31 DB, 7 karo haritası, sözleşmeler), `.claude/skills/` (3 gerçek Claude Code skill), `CLAUDE.md`, `PROMPT_TEK_MESAJ.txt` ve `tools/` bulunur.
2. Terminali **arşivden çıkan proje kökünde** aç; Claude Code'u başlat. `PROMPT_TEK_MESAJ.txt` dosyasının tamamını Claude Opus'a ilk mesaj olarak ver; veya dosyayı açıkça okut: "Bu klasördeki PROMPT_TEK_MESAJ.txt içeriğini uygula."
3. Test: `python tools/preflight.py` (tasarım statik doğrulaması), oyun üretimi sonrası `python tools/validate_delivery.py`.
4. Aynı anda eski v1.0–v1.9 ZIP'lerini yükleme; v2.0 zaten tüm güncel içerikleri birleştirir.

## İki ZIP ile kurulum (alternatif)
1. `Kayip_Ufuk_GDD_v2_0_Kesin_Uretim_Paketi.zip` arşivini aç: `Kayip_Ufuk_GDD_v2_0/` klasörü oluşur.
2. `Kayip_Ufuk_Claude_Code_Skill_Paketi.zip` arşivini **aynı proje köküne** aç. `.claude/skills/` bu aşamada oluşmalıdır.
3. `PROMPT_TEK_MESAJ.txt` dosyasını ilk mesaja yapıştır.

## Claude.ai sohbetinde Opus kullanıyorsan (web / masaüstü chat)
1. `Kayip_Ufuk_Claude_AI_Skill.zip` dosyasını **sohbete değil**, Claude arayüzündeki **Customize → Skills → + → Create skill → Upload a skill** üzerinden bir kez yükle ve etkinleştir. Bu ZIP tek kök `kayip-ufuk-creator/SKILL.md` dizinidir, Claude Code için olan üçlü `.claude/` ZIP'inden farklıdır.
2. Yeni Opus sohbetine **`Kayip_Ufuk_GDD_v2_0_Kesin_Uretim_Paketi.zip`** dosyasını ekle ve ayrı `Kayip_Ufuk_Claude_Opus_Nihai_Tek_Prompt.txt` içeriğini mesaja yapıştır.
3. Sohbetteki kod çalıştırma / dosya üretme özelliklerinin ZIP'i gerçekten okuyabildiğini doğrulat: `ProductionTruth_v2.0.json`, `DB/ItemDB.json`, `Maps/TerrainGrid_MAIN_v1.2.json` gibi dosyaları örnek olarak açmasını iste. Bu erişimi sağlayamıyorsa arşivi önce açıp dosya erişimi olan bir Claude Code oturumunda çalışmak gerekir.

Skills özelliği uygulamada etkin değilse en azından GDD ZIP ve uzun promptu kullanabilirsin; ancak büyük projede yerel dosya sistemi erişimi olan **Claude Code** daha uygun.

## ZIP seçimi — kesin tablo
- **Claude Code en kolay yol:** `Kayip_Ufuk_Opus_Tek_Paket_v2_0.zip` tek başına yeterli; açıp proje kökünde kullan.
- **Claude Code iki ZIP alternatifi:** `Kayip_Ufuk_GDD_v2_0_Kesin_Uretim_Paketi.zip` + `Kayip_Ufuk_Claude_Code_Skill_Paketi.zip`; ikisini aynı proje köküne aç.
- **Claude.ai web sohbeti:** `Kayip_Ufuk_Claude_AI_Skill.zip` dosyasını Customize > Skills'e kur; yeni sohbete **yalnızca GDD v2.0 ZIP** ekle ve prompt metnini yapıştır.
- **GEREKMEZ:** GDD v0.9–v1.9 ayrı ZIP dosyaları, ayrıca eski yamalar.
- **Henüz mevcut değil:** gerçek sprite atlas/ses veya çalışan oyun ZIP'i. Opus bunları oluşturmalı.

## Skill komutları
`/kayip-ufuk-build` · `/kayip-ufuk-assets` · `/kayip-ufuk-qa`

Claude Code project skill mekanizması `.claude/skills/<skill-name>/SKILL.md` biçimini kullanır. Bu, ZIP'in tek başına 'kurulu plugin' olduğu anlamına gelmez; **içindeki .claude/ dizini proje köküne çıkarıldığında** skill'ler yüklenebilir.
