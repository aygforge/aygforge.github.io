'use strict';
/* ---- 07_v4.js ---- */
/* =====================================================================
   07_v4.js : CozFis v4.0 — The Cozy Adventure Update
   AvTemposu (Akıcı/Klasik) · FishingOpportunities · TrophyFishing · AnglerGuild · TownStories
   ShoreCollection (Kıyı Keşfi verisi) · Binoculars · Unlocks. Mevcut S / Tx / Inv / Selector / Catch / Wildlife yapıları kullanılır.
   ===================================================================== */
const V4 = {
  flowWait: [1.5, 3.5],
  schoolFish: ['sardalya', 'hamsi', 'istavrit', 'gumus_baligi', 'izmarit', 'isparoz', 'kupes', 'uskumru', 'kolyoz', 'tirsi', 'ringa', 'kapelin', 'ucan_balik', 'sari_kuyruklu_fusilier', 'mavi_cerrah'],
  oppTypes: {
    school: { get name() { return _t('sys4.balik_surusu'); }, set name(v) { _sv(this, "name", v); }, icon: 'op_school', get hint() { return _t('sys4.yuzeyde_sicramalar_surunun_mesafesine_atis'); }, set hint(v) { _sv(this, "hint", v); } },
    big: { get name() { return _t('sys4.buyuk_balik_izleri'); }, set name(v) { _sv(this, "name", v); }, icon: 'op_big', get hint() { return _t('sys4.suyun_altinda_iri_bir_golge'); }, set hint(v) { _sv(this, "hint", v); } },
    bottom: { get name() { return _t('sys4.dip_hareketliligi'); }, set name(v) { _sv(this, "name", v); }, icon: 'op_bottom', get hint() { return _t('sys4.dipte_kabarciklar_ve_kum_bulutlari'); }, set hint(v) { _sv(this, "hint", v); } },
    predator: { get name() { return _t('sys4.avci_balik_takibi'); }, set name(v) { _sv(this, "name", v); }, icon: 'op_predator', get hint() { return _t('sys4.hizli_bir_golge_yem_ariyor'); }, set hint(v) { _sv(this, "hint", v); } }
  },
  trophies: [
    { id: 't_zargana', fid: 'zargana', rid: 'sakin_liman', get name() { return _t('sys4.kiyinin_oku'); }, set name(v) { _sv(this, "name", v); }, specials: ['side', 'run'], jumps: 1, speed: 0.56, dur: [6, 9], get desc() { return _t('sys4.yuzeye_yakin_hizli_kacis_kisa'); }, set desc(v) { _sv(this, "desc", v); }, reward: { kind: 'decor', id: 'tr_zargana', get name() { return _t('sys4.zargana_trofesi'); }, set name(v) { _sv(this, "name", v); } } },
    { id: 't_levrek', fid: 'levrek', rid: 'yesil_koy', get name() { return _t('sys4.koyun_avcisi'); }, set name(v) { _sv(this, "name", v); }, specials: ['run', 'run', 'lift'], speed: 0.64, dur: [9, 13], get desc() { return _t('sys4.iki_ani_kacis_kisa_sakinlesme'); }, set desc(v) { _sv(this, "desc", v); }, reward: { kind: 'ornament', id: 'orn_tr_levrek', get name() { return _t('sys4.levrek_desenli_tekne_bayragi'); }, set name(v) { _sv(this, "name", v); } } },
    { id: 't_sinarit', fid: 'sinarit', rid: 'kayalik_adalar', get name() { return _t('sys4.kayalarin_hakimi'); }, set name(v) { _sv(this, "name", v); }, specials: ['run', 'side'], speed: 0.8, dur: [12, 16], get desc() { return _t('sys4.kayaliklara_dalis_misinayi_germe_ve'); }, set desc(v) { _sv(this, "desc", v); }, reward: { kind: 'charm', id: 'charm_sinarit', get name() { return _t('sys4.kayalik_adalar_olta_susu'); }, set name(v) { _sv(this, "name", v); } } },
    { id: 't_akya', fid: 'akya', rid: 'serin_akintilar', get name() { return _t('sys4.akintinin_gucu'); }, set name(v) { _sv(this, "name", v); }, specials: ['run', 'lift'], speed: 0.7, dur: [14, 19], get desc() { return _t('sys4.akinti_yonunde_guclu_kacis_kisa'); }, set desc(v) { _sv(this, "desc", v); }, reward: { kind: 'color', id: 'akinti', get name() { return _t('sys4.akinti_desenli_govde_boyasi'); }, set name(v) { _sv(this, "name", v); } } },
    { id: 't_halibut', fid: 'halibut', rid: 'sisli_kuzey', get name() { return _t('sys4.derinligin_devi'); }, set name(v) { _sv(this, "name", v); }, specials: ['lift', 'run', 'lift'], speed: 0.6, dur: [14, 20], get desc() { return _t('sys4.dibe_dogru_agir_direnc_ve'); }, set desc(v) { _sv(this, "desc", v); }, reward: { kind: 'decor', id: 'tr_halibut', get name() { return _t('sys4.kuzey_denizleri_balik_tablosu'); }, set name(v) { _sv(this, "name", v); } } },
    { id: 't_barrakuda', fid: 'barrakuda', rid: 'gunes_adalari', get name() { return _t('sys4.tropik_avci'); }, set name(v) { _sv(this, "name", v); }, specials: ['side', 'side', 'run'], speed: 0.76, dur: [12, 17], get desc() { return _t('sys4.yuksek_hizli_ani_hareketler_ve'); }, set desc(v) { _sv(this, "desc", v); }, reward: { kind: 'ornament', id: 'orn_tr_barrakuda', get name() { return _t('sys4.tropik_deniz_flamasi'); }, set name(v) { _sv(this, "name", v); } } },
    { id: 't_yelken', fid: 'yelken_baligi', rid: 'derin_mavi', get name() { return _t('sys4.acik_denizin_sampiyonu'); }, set name(v) { _sv(this, "name", v); }, specials: ['run', 'jump', 'lift'], speed: 0.72, dur: [18, 25], get desc() { return _t('sys4.uzun_ilk_kacis_sudan_sicrama'); }, set desc(v) { _sv(this, "desc", v); }, reward: { kind: 'decor', id: 'tr_yelken', get name() { return _t('sys4.yelken_baligi_altin_kupasi'); }, set name(v) { _sv(this, "name", v); } } }
  ],
  /* Balıkçı Birliği: 24 şablon (A: av becerisi, B: deniz keşfi, C: kasaba ve ticaret, D: koleksiyon ve yönetim) */
  guild: [
    { id: 'A01', get name() { return _t('sys4.samandira_ustasi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.samandirali_yontemle_3_balik_yakala'); }, set desc(v) { _sv(this, "desc", v); }, need: 3, slot: 1 },
    { id: 'A02', get name() { return _t('sys4.dip_avcisi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.dip_oltasi_ile_3_balik'); }, set desc(v) { _sv(this, "desc", v); }, need: 3, slot: 1 },
    { id: 'A03', get name() { return _t('sys4.spin_deneyimi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.spin_yontemiyle_3_balik_yakala'); }, set desc(v) { _sv(this, "desc", v); }, need: 3, slot: 1 },
    { id: 'A04', get name() { return _t('sys4.uc_yontem'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.uc_farkli_av_yontemiyle_birer'); }, set desc(v) { _sv(this, "desc", v); }, need: 3, slot: 1 },
    { id: 'A05', get name() { return _t('sys4.kusursuz_tasma'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.3_mukemmel_tasma_gerceklestir'); }, set desc(v) { _sv(this, "desc", v); }, need: 3, slot: 1 },
    { id: 'A06', get name() { return _t('sys4.buyuk_mucadele'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.guc_3_veya_uzeri_bir'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 1 },
    { id: 'B01', get name() { return _t('sys4.kiyi_gezgini'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.bir_seferde_veya_iskele_avinda'); }, set desc(v) { _sv(this, "desc", v); }, need: 2, slot: 2 },
    { id: 'B02', get name() { return _t('sys4.denizler_arasi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.tek_seferde_2_farkli_ana'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 2 },
    { id: 'B03', get name() { return _t('sys4.sabah_balikcisi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.sabah_atmosferinde_2_basarili_av'); }, set desc(v) { _sv(this, "desc", v); }, need: 2, slot: 2 },
    { id: 'B04', get name() { return _t('sys4.gun_batimi_avi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.aksamustu_atmosferinde_2_basarili_av'); }, set desc(v) { _sv(this, "desc", v); }, need: 2, slot: 2 },
    { id: 'B05', get name() { return _t('sys3.doga_gozlemcisi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.durbunle_gozlem_etkinligini_1_kez'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 2, nonFish: true },
    { id: 'B06', get name() { return _t('sys4.trofe_izinde'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.aktif_trofe_hedefinde_ozel_karsilasma'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 2 },
    { id: 'C01', get name() { return _t('sys4.balik_hali_ziyareti'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.balik_haline_en_az_3'); }, set desc(v) { _sv(this, "desc", v); }, need: 3, slot: 3, nonFish: true },
    { id: 'C02', get name() { return _t('sys4.siparis_teslimati'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.bir_siparise_en_az_bir'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 3, nonFish: true },
    { id: 'C03', get name() { return _t('sys4.cay_molasi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.cay_bahcesine_gunun_baligindan_en'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 3, nonFish: true },
    { id: 'C04', get name() { return _t('sys4.kasaba_dostu'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.2_farkli_kasabaliyla_konus'); }, set desc(v) { _sv(this, "desc", v); }, need: 2, slot: 3, nonFish: true },
    { id: 'C05', get name() { return _t('sys4.misafir_kaptan'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.bir_npc_misafiriyle_tekne_seferi'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 3, nonFish: true },
    { id: 'C06', get name() { return _t('sys4.kasaba_yatirimi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.acik_bir_kasaba_projesine_toplam'); }, set desc(v) { _sv(this, "desc", v); }, need: 100, slot: 3, nonFish: true },
    { id: 'D01', get name() { return _t('sys4.akvaryum_duzenle'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.bir_akvaryuma_balik_ekle_veya'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 3, nonFish: true },
    { id: 'D02', get name() { return _t('sys4.kiyi_koleksiyoncusu'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.kiyi_kesfi_etkinligini_1_kez'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 3, nonFish: true },
    { id: 'D03', get name() { return _t('sys4.deniz_fotografcisi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.fotograf_modunda_bir_deniz_doga'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 3, nonFish: true },
    { id: 'D04', get name() { return _t('sys4.filo_isletmecisi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.bir_npc_filo_gorevinden_donen'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 3, nonFish: true },
    { id: 'D05', get name() { return _t('sys4.olta_hazirligi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.farkli_bir_kayitli_ekipman_setini'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 2 },
    { id: 'D06', get name() { return _t('sys4.gunluk_inceleme'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.en_az_iki_farkli_av'); }, set desc(v) { _sv(this, "desc", v); }, need: 1, slot: 2 }
  ],
  stories: {
    efe: { get title() { return _t('sys4.efe_nin_eski_av_defteri'); }, set title(v) { _sv(this, "title", v); }, get unlock() { return _t('sys4.ilk_basarili_manuel_av'); }, set unlock(v) { _sv(this, "unlock", v); }, stages: [
      { get goal() { return _t('sys4.efe_ile_konus_kayip_defter'); }, set goal(v) { _sv(this, "goal", v); }, get talk() { return _t('sys4.gencken_bir_defter_tutardim_bir'); }, set talk(v) { _sv(this, "talk", v); } },
      { get goal() { return _t('sys4.iskeledeki_dalgakiran_noktasina_git_ve'); }, set goal(v) { _sv(this, "goal", v); }, inspect: 'liman_dalgakiran', get found() { return _t('sys4.taslarin_arasinda_yagmurdan_korunmus_eski'); }, set found(v) { _sv(this, "found", v); } },
      { get goal() { return _t('sys4.efe_ye_don_ve_hikayesini'); }, set goal(v) { _sv(this, "goal", v); }, get talk() { return _t('sys4.o_sabah_babamla_cikmistik_bu'); }, set talk(v) { _sv(this, "talk", v); } }
    ], reward: { album: 'efe_photo', decor: 'efe_foto', get name() { return _t('sys4.efe_nin_eski_fotografi'); }, set name(v) { _sv(this, "name", v); } } },
    mert: { get title() { return _t('sys4.mert_in_ilk_acik_deniz'); }, set title(v) { _sv(this, "title", v); }, get unlock() { return _t('sys4.ilk_tekne'); }, set unlock(v) { _sv(this, "unlock", v); }, stages: [
      { get goal() { return _t('sys4.mert_ile_konus_ve_onu'); }, set goal(v) { _sv(this, "goal", v); }, get talk() { return _t('sys4.bir_gun_tekneyle_acilmak_en'); }, set talk(v) { _sv(this, "talk", v); } },
      { get goal() { return _t('sys4.mert_misafirinle_sakin_liman_disindaki'); }, set goal(v) { _sv(this, "goal", v); } },
      { get goal() { return _t('sys4.geziden_sonra_mert_ile_konus'); }, set goal(v) { _sv(this, "goal", v); }, get talk() { return _t('sys4.ufukta_martilarin_ardindan_gittigimiz_an'); }, set talk(v) { _sv(this, "talk", v); } }
    ], reward: { album: 'mert_trip', get name() { return _t('sys4.ilk_yolculuk_hatirasi'); }, set name(v) { _sv(this, "name", v); } } },
    elif: { get title() { return _t('sys4.elif_in_deniz_cizimleri'); }, set title(v) { _sv(this, "title", v); }, get unlock() { return _t('sys4.ilk_tekne'); }, set unlock(v) { _sv(this, "unlock", v); }, stages: [
      { get goal() { return _t('sys4.elif_ile_konus_cizim_defterindeki'); }, set goal(v) { _sv(this, "goal", v); }, get talk() { return _t('sys4.defterimde_iki_manzara_yarim_kaldi'); }, set talk(v) { _sv(this, "talk", v); } },
      { get goal() { return _t('sys4.tekneyle_iki_manzara_noktasini_ziyaret'); }, set goal(v) { _sv(this, "goal", v); } },
      { get goal() { return _t('sys4.elif_e_don_ve_cizimleri'); }, set goal(v) { _sv(this, "goal", v); }, get talk() { return _t('sys4.anlattiklarin_sayesinde_tamamladim_bu_iki'); }, set talk(v) { _sv(this, "talk", v); } }
    ], reward: { album: 'elif_drawings', decor: 'elif_pano', get name() { return _t('sys4.iki_deniz_cizimi_ve_cizim'); }, set name(v) { _sv(this, "name", v); } } },
    kerem: { get title() { return _t('sys4.kerem_in_deniz_koleksiyonu'); }, set title(v) { _sv(this, "title", v); }, get unlock() { return _t('sys4.ilk_kiyi_kesfi'); }, set unlock(v) { _sv(this, "unlock", v); }, stages: [
      { get goal() { return _t('sys4.kerem_ile_konus_deniz_koleksiyonu'); }, set goal(v) { _sv(this, "goal", v); }, get talk() { return _t('sys4.kiyida_buldugun_kabuklar_ve_camlar'); }, set talk(v) { _sv(this, "talk", v); } },
      { get goal() { return _t('sys4.kiyi_koleksiyonu_nda_uc_farkli'); }, set goal(v) { _sv(this, "goal", v); } },
      { get goal() { return _t('sys4.kerem_e_don_ve_sergi'); }, set goal(v) { _sv(this, "goal", v); }, get talk() { return _t('sys4.sergi_kosesi_hazir_bir_benzerini'); }, set talk(v) { _sv(this, "talk", v); } }
    ], reward: { album: 'kerem_exhibit', decor: 'deniz_sergisi', get name() { return _t('sys4.kalici_deniz_sergisi'); }, set name(v) { _sv(this, "name", v); } } },
    bora: { get title() { return _t('sys4.bora_nin_eski_teknesi'); }, set title(v) { _sv(this, "title", v); }, get unlock() { return _t('sys4.ilk_tekne'); }, set unlock(v) { _sv(this, "unlock", v); }, stages: [
      { get goal() { return _t('sys4.bora_ile_konus_eski_kiyi'); }, set goal(v) { _sv(this, "goal", v); }, get talk() { return _t('sys4.ilk_teknemle_hep_iki_noktayi'); }, set talk(v) { _sv(this, "talk", v); } },
      { get goal() { return _t('sys4.teknenle_iki_farkli_av_noktasini'); }, set goal(v) { _sv(this, "goal", v); } },
      { get goal() { return _t('sys4.limana_don_ve_bora_ya'); }, set goal(v) { _sv(this, "goal", v); }, get talk() { return _t('sys4.demek_rota_hala_guzel_eski'); }, set talk(v) { _sv(this, "talk", v); } }
    ], reward: { album: 'bora_plate', decor: 'bora_levha', get name() { return _t('sys4.bora_nin_hatira_levhasi'); }, set name(v) { _sv(this, "name", v); } } }
  },
  /* Kıyı koleksiyonu: 24 nesne; env = bulunabildiği ortamlar (sand / rocks / tide) */
  shore: [
    { id: 'midye', get cat() { return _t('sys4.kabuk'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.midye_kabugu'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'rocks', 'tide'], get info() { return _t('sys4.mor_siyah_iki_parcali_kabugun'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'tarak', get cat() { return _t('sys4.kabuk'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.deniz_taragi'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'tide'], get info() { return _t('sys4.yelpaze_bicimli_cizgili_kabuk'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'spiral', get cat() { return _t('sys4.kabuk'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.spiral_kabuk'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'tide'], get info() { return _t('sys4.kivrilarak_buyuyen_kucuk_salyangoz_kabugu'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'istiridye', get cat() { return _t('sys4.kabuk'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.cizgili_istiridye_kabugu'); }, set name(v) { _sv(this, "name", v); }, env: ['rocks', 'tide'], get info() { return _t('sys4.puruzlu_dis_yuzu_sedefli_ici'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'minare', get cat() { return _t('sys4.kabuk'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.kucuk_deniz_minaresi'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'rocks'], get info() { return _t('sys4.ince_uzun_ve_sivri_helezon'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'sedef', get cat() { return _t('sys4.kabuk'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.sedefli_kabuk'); }, set name(v) { _sv(this, "name", v); }, env: ['tide'], get info() { return _t('sys4.isikta_gokkusagi_gibi_parlayan_nadir'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'cam_yesil', get cat() { return _t('sys4.deniz_cami'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.yesil_deniz_cami'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'tide'], get info() { return _t('sys4.dalgalarla_yumusamis_eski_sise_cami'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'cam_mavi', get cat() { return _t('sys4.deniz_cami'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.mavi_deniz_cami'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'tide'], get info() { return _t('sys4.koyu_mavi_buzlu_yuzeyli_cam'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'cam_beyaz', get cat() { return _t('sys4.deniz_cami'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.buz_beyazi_cam'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'rocks'], get info() { return _t('sys4.sut_beyazi_yuvarlak_kenarli_cam'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'cam_amber', get cat() { return _t('sys4.deniz_cami'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.amber_deniz_cami'); }, set name(v) { _sv(this, "name", v); }, env: ['sand'], get info() { return _t('sys4.bal_renginde_sicak_tonlu_cam'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'cam_turkuaz', get cat() { return _t('sys4.deniz_cami'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.turkuaz_deniz_cami'); }, set name(v) { _sv(this, "name", v); }, env: ['tide'], get info() { return _t('sys4.denizin_rengini_tasiyan_parlak_cam'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'cam_mor', get cat() { return _t('sys4.deniz_cami'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.mor_deniz_cami'); }, set name(v) { _sv(this, "name", v); }, env: ['rocks', 'tide'], get info() { return _t('sys4.guneste_zamanla_morarmis_cok_eski'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'cakil', get cat() { return _t('sys4.kiyi_tasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.yuvarlak_cakil'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'rocks'], get info() { return _t('sys4.puruzsuz_avuc_icine_sigan_gri'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'kuvars', get cat() { return _t('sys4.kiyi_tasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.beyaz_kuvars'); }, set name(v) { _sv(this, "name", v); }, env: ['rocks', 'sand'], get info() { return _t('sys4.yari_saydam_beyaz_mineral'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'bazalt', get cat() { return _t('sys4.kiyi_tasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.siyah_bazalt'); }, set name(v) { _sv(this, "name", v); }, env: ['rocks'], get info() { return _t('sys4.volkanik_koyu_ve_agir_tas'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'benekli', get cat() { return _t('sys4.kiyi_tasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.benekli_tas'); }, set name(v) { _sv(this, "name", v); }, env: ['rocks', 'tide'], get info() { return _t('sys4.uzeri_kucuk_acik_renk_beneklerle'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'delikli', get cat() { return _t('sys4.kiyi_tasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.delikli_sahil_tasi'); }, set name(v) { _sv(this, "name", v); }, env: ['rocks'], get info() { return _t('sys4.dalgalarin_actigi_bir_deligi_olan'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'cizgili_tas', get cat() { return _t('sys4.kiyi_tasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.cizgili_mineral_tasi'); }, set name(v) { _sv(this, "name", v); }, env: ['rocks', 'sand'], get info() { return _t('sys4.katman_katman_renkli_damarlar_tasiyor'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'dugme', get cat() { return _t('sys4.deniz_hatirasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.eski_denizci_dugmesi'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'tide'], get info() { return _t('sys4.uzerinde_capa_islenmis_pirinc_dugme'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'seramik', get cat() { return _t('sys4.deniz_hatirasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.kucuk_seramik_parcasi'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'rocks'], get info() { return _t('sys4.mavi_desenli_eski_bir_tabaktan'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'capa_sus', get cat() { return _t('sys4.deniz_hatirasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.pasli_capa_susu'); }, set name(v) { _sv(this, "name", v); }, env: ['rocks'], get info() { return _t('sys4.bir_tekne_anahtarligindan_dusmus_minik'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'jeton', get cat() { return _t('sys4.deniz_hatirasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.minik_gemi_jetonu'); }, set name(v) { _sv(this, "name", v); }, env: ['tide'], get info() { return _t('sys4.eski_vapur_iskelesinden_kalma_pirinc'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'ahsap', get cat() { return _t('sys4.deniz_hatirasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.oyulmus_ahsap_parcasi'); }, set name(v) { _sv(this, "name", v); }, env: ['sand', 'tide'], get info() { return _t('sys4.bir_balikcinin_oydugu_kucuk_balik'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'duduk', get cat() { return _t('sys4.deniz_hatirasi'); }, set cat(v) { _sv(this, "cat", v); }, get name() { return _t('sys4.eski_denizci_dudugu'); }, set name(v) { _sv(this, "name", v); }, env: ['rocks', 'tide'], get info() { return _t('sys4.hala_ince_bir_ses_cikaran'); }, set info(v) { _sv(this, "info", v); } }
  ],
  shoreEnv: { sand: { get name() { return _t('sys4.kumluk_sahil'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.kumun_uzerindeki_ipuclarini_farkli_renk'); }, set desc(v) { _sv(this, "desc", v); } }, rocks: { get name() { return _t('sys4.kayalik_kiyi'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.kabarciklari_ve_kucuk_izleri_takip'); }, set desc(v) { _sv(this, "desc", v); } }, tide: { get name() { return _t('sys4.gelgit_havuzlari'); }, set name(v) { _sv(this, "name", v); }, get desc() { return _t('sys4.su_cekildiginde_havuzlarda_beliren_nesneyi'); }, set desc(v) { _sv(this, "desc", v); } } }
};
const TROPHY = Object.fromEntries(V4.trophies.map(t => [t.id, t]));
const TROPHY_BY_FISH = Object.fromEntries(V4.trophies.map(t => [t.fid, t]));
const GUILDT = Object.fromEntries(V4.guild.map(g => [g.id, g]));
const SHORE = Object.fromEntries(V4.shore.map(s => [s.id, s]));
const STORY_NPCS = Object.keys(V4.stories);
const hr = (...a) => hash32(S.seed, ...a) / 4294967296;

/* ---------- yeni kozmetikler ---------- */
DECOR.push(
  { id: 'tr_zargana', get name() { return _t('sys4.zargana_trofesi'); }, set name(v) { _sv(this, "name", v); }, slot: 'shelf', get unlockTr() { return _t('sys4.trofe_kiyinin_oku'); }, set unlockTr(v) { _sv(this, "unlockTr", v); } },
  { id: 'tr_halibut', get name() { return _t('sys4.kuzey_denizleri_balik_tablosu'); }, set name(v) { _sv(this, "name", v); }, slot: 'wall', get unlockTr() { return _t('sys4.trofe_derinligin_devi'); }, set unlockTr(v) { _sv(this, "unlockTr", v); } },
  { id: 'tr_yelken', get name() { return _t('sys4.yelken_baligi_altin_kupasi'); }, set name(v) { _sv(this, "name", v); }, slot: 'shelf', get unlockTr() { return _t('sys4.trofe_acik_denizin_sampiyonu'); }, set unlockTr(v) { _sv(this, "unlockTr", v); } },
  { id: 'efe_foto', get name() { return _t('sys4.efe_nin_eski_fotografi'); }, set name(v) { _sv(this, "name", v); }, slot: 'wall', get unlockTr() { return _t('sys4.hikaye_efe_nin_eski_av'); }, set unlockTr(v) { _sv(this, "unlockTr", v); } },
  { id: 'elif_pano', get name() { return _t('sys4.elif_in_cizim_panosu'); }, set name(v) { _sv(this, "name", v); }, slot: 'board', get unlockTr() { return _t('sys4.hikaye_elif_in_deniz_cizimleri'); }, set unlockTr(v) { _sv(this, "unlockTr", v); } },
  { id: 'deniz_sergisi', get name() { return _t('sys4.kalici_deniz_sergisi'); }, set name(v) { _sv(this, "name", v); }, slot: 'table', get unlockTr() { return _t('sys4.hikaye_kerem_in_deniz_koleksiyonu'); }, set unlockTr(v) { _sv(this, "unlockTr", v); } },
  { id: 'bora_levha', get name() { return _t('sys4.bora_nin_hatira_levhasi'); }, set name(v) { _sv(this, "name", v); }, slot: 'wall', get unlockTr() { return _t('sys4.hikaye_bora_nin_eski_teknesi'); }, set unlockTr(v) { _sv(this, "unlockTr", v); } },
  { id: 'kabuk_sergisi', get name() { return _t('sys4.deniz_kabugu_sergisi'); }, set name(v) { _sv(this, "name", v); }, slot: 'table', ach: 'shore12' },
  { id: 'poster_shore', get name() { return _t('sys4.sahil_temali_poster'); }, set name(v) { _sv(this, "name", v); }, slot: 'wall', ach: 'shore18' }
);
for (const d of DECOR) DECOR_BY[d.id] = d;
BOAT_COLORS.push({ id: 'akinti', get name() { return _t('sys4.akinti_deseni'); }, set name(v) { _sv(this, "name", v); }, price: 0, trophy: 't_akya', get unlockTr() { return _t('sys4.trofe_akintinin_gucu_akya'); }, set unlockTr(v) { _sv(this, "unlockTr", v); }, c: ['#2f8ab8', '#1e5c8a', '#8ad0f0'] });
ACHS.push(
  { id: 'trophy7', get name() { return _t('sys4.yedi_denizin_ustasi'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys4.yedi_bolgesel_trofenin_hepsini_yakala'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys4.trofeler'); }, set category(v) { _sv(this, "category", v); } },
  { id: 'shore6', get name() { return _t('sys4.kiyi_kasifi'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys4.6_farkli_kiyi_nesnesi_bul'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys4.kiyi_koleksiyonu'); }, set category(v) { _sv(this, "category", v); } },
  { id: 'shore12', get name() { return _t('sys4.kabuk_meraklisi'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys4.12_farkli_kiyi_nesnesi_bul'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys4.kiyi_koleksiyonu'); }, set category(v) { _sv(this, "category", v); } },
  { id: 'shore18', get name() { return _t('sys4.sahil_gezgini'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys4.18_farkli_kiyi_nesnesi_bul'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys4.kiyi_koleksiyonu'); }, set category(v) { _sv(this, "category", v); } },
  { id: 'shore24', get name() { return _t('sys4.kiyi_koleksiyoncusu'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys4.24_kiyi_nesnesinin_hepsini_bul'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys4.kiyi_koleksiyonu'); }, set category(v) { _sv(this, "category", v); } }
);
ACH_DEF.trophy7 = [() => Object.keys(S.trophy.done).length, V4.trophies.length];
ACH_DEF.shore6 = [() => Object.keys(S.shore.items).length, 6];
ACH_DEF.shore12 = [() => Object.keys(S.shore.items).length, 12];
ACH_DEF.shore18 = [() => Object.keys(S.shore.items).length, 18];
ACH_DEF.shore24 = [() => Object.keys(S.shore.items).length, V4.shore.length];
ACH_REWARD.trophy7 = { type: 'title', id: 'seven_seas', get name() { return _t('sys4.yedi_denizin_ustasi_unvani'); }, set name(v) { _sv(this, "name", v); } };
ACH_REWARD.shore6 = { type: 'badge', id: 'shore_badge', get name() { return _t('sys4.kiyi_kasifi_rozeti'); }, set name(v) { _sv(this, "name", v); } };
ACH_REWARD.shore12 = { type: 'decor', id: 'kabuk_sergisi', get name() { return _t('sys4.deniz_kabugu_sergisi'); }, set name(v) { _sv(this, "name", v); } };
ACH_REWARD.shore18 = { type: 'decor', id: 'poster_shore', get name() { return _t('sys4.sahil_temali_poster'); }, set name(v) { _sv(this, "name", v); } };
ACH_REWARD.shore24 = { type: 'title', id: 'shore_collector', get name() { return _t('sys4.kiyi_koleksiyoncusu_unvani'); }, set name(v) { _sv(this, "name", v); } };
CFG.npc_dialogues.mert = (CFG.npc_dialogues.mert || []).concat([{ trigger: 'mert_story', get text_tr() { return _t('sys4.acik_deniz_yolculugumuzdan_beri_her'); }, set text_tr(v) { _sv(this, "text_tr", v); } }, { trigger: 'mert_story', get text_tr() { return _t('sys4.pusulayi_hala_tasiyor_musun_ben'); }, set text_tr(v) { _sv(this, "text_tr", v); } }]);
NPC_TRIG.mert_story = [true, () => !!(S.stories.mert && S.stories.mert.stage === 4)];

/* ---------- Av temposu ---------- */
const Tempo = {
  cur() { return S && S.tempo === 'classic' ? 'classic' : 'flow'; },
  wait(t) { return t === 'classic' ? RC.wait_sec_range : V4.flowWait; },
  set(t) { if (!['flow', 'classic'].includes(t)) return { ok: false }; S.tempo = t; Save.soon(); return { ok: true, note: Fishing.ctx && Fishing.phase !== 'READY' ? _t('sys4.sonraki_atistan_itibaren_gecerli') : '' }; }
};

/* ---------- Özel av fırsatları ---------- */
const Opp = {
  CHANCE: 0.12, PER_SESSION: 2, CASTS: 2, MUL: 1.3,
  key() { return S.trip ? 't' + S.trip.id : 'p' + S.day; },
  sess() { const k = this.key(); const p = S.opp.per[k] || (S.opp.per[k] = { casts: 0, n: 0 }); const ks = Object.keys(S.opp.per); while (ks.length > 12) delete S.opp.per[ks.shift()]; return p; },
  active() { const a = S.opp.active; return a && a.status === 'active' ? a : null; },
  /* tür havuzu: yalnız bu noktada gerçekten bulunan türler */
  set(type, spotId) {
    const ws = Object.keys(SPOTS[spotId].weights);
    if (type === 'school') return ws.filter(f => V4.schoolFish.includes(f));
    if (type === 'bottom') return ws.filter(f => Methods.of(f).includes('bottom'));
    if (type === 'predator') return ws.filter(f => Methods.of(f).includes('spin'));
    return ws;
  },
  endIfMoved(rid) { const a = this.active(); if (a && a.rid !== rid) { a.status = 'ended'; } },
  /* tamamlanan her geçerli manuel atıştan sonra (Tx içinde) */
  roll(pc) {
    if (!pc || pc.comp || pc.mode === 'auto') return null; const rid = SPOTS[pc.spotId].region_id; this.endIfMoved(rid);
    const ss = this.sess(); ss.casts++;
    if (ss.casts < this.CASTS || ss.n >= this.PER_SESSION || this.active()) return null;
    if (hr('opp', S.stats.manualCasts) >= this.CHANCE) return null;
    const types = Object.keys(V4.oppTypes).filter(t => t === 'big' || this.set(t, pc.spotId).length);
    const type = types[Math.floor(hr('oppT', S.stats.manualCasts) * types.length)];
    const band = ['near', 'mid', 'far'][Math.floor(hr('oppB', S.stats.manualCasts) * 3)];
    S.opp.seq = (S.opp.seq || 0) + 1;
    const ev = { id: 'op' + S.opp.seq, type, day: S.day, trip: S.trip ? S.trip.id : null, rid, spot: pc.spotId, band, left: 2, status: 'active' };
    S.opp.active = ev; ss.n++; S.opp.log.push({ id: ev.id, type, day: S.day, rid }); while (S.opp.log.length > 20) S.opp.log.shift();
    return ev;
  },
  /* iniş anında (Tx içinde): hakkı tüketir, şartı sağlayan atışa etki döndürür */
  consume(pc, blocked) {
    const a = this.active(); if (!a) return null; const rid = SPOTS[pc.spotId].region_id; if (a.rid !== rid) { a.status = 'ended'; return null; }
    a.left--; if (a.left <= 0) a.status = 'used';
    let matched = false;
    if (a.type === 'school' || a.type === 'big') matched = pc.band === a.band;
    else if (a.type === 'bottom') matched = pc.method === 'bottom';
    else if (a.type === 'predator') matched = pc.method === 'spin';
    if (blocked) matched = false;
    return { id: a.id, type: a.type, matched, set: matched && a.type !== 'big' && a.type !== 'predator' ? this.set(a.type, pc.spotId) : null };
  }
};

/* ---------- Trofe avları ---------- */
const Trophy = {
  unlocked(id) { const t = TROPHY[id]; return !!(t && S.ency[t.fid] && S.ency[t.fid].caught > 0); },
  chance(id) { return Math.min(0.85, 0.08 + 0.06 * (S.trophy.miss[id] || 0)); },
  setTarget(id) { if (id && !this.unlocked(id)) return { ok: false, msg: _t('sys4.once_bu_turu_kendin_kesfetmelisin') }; S.trophy.target = id || null; Save.soon(); return { ok: true }; },
  eligible(pc) {
    const id = S.trophy.target; if (!id || !this.unlocked(id) || pc.comp) return null; const t = TROPHY[id]; const sp = SPOTS[pc.spotId];
    if (sp.region_id !== t.rid || !sp.weights[t.fid]) return null; if (FISH[t.fid].power > rodOf().power + 1) return null; return t;
  },
  /* iniş anında (Tx içinde) — deterministik, 4–6 atışta bir anlamlı fırsat hedefi */
  roll(pc) {
    const t = this.eligible(pc); if (!t) return null;
    if (hr('tro', S.stats.manualCasts, t.id) < this.chance(t.id)) { S.trophy.miss[t.id] = 0; S.trophy.enc = (S.trophy.enc || 0) + 1; Guild.ev('trophyEnc', {}); return t; }
    S.trophy.miss[t.id] = (S.trophy.miss[t.id] || 0) + 1; return null;
  },
  size(t) { const f = FISH[t.fid]; const k = 0.75 + hr('trs', S.stats.manualCasts) * 0.25; const [l0, l1] = f.size_game_range.length_cm, [w0, w1] = f.size_game_range.weight_kg; return { cls: k >= 0.9 ? 'exceptional' : 'large', t: k, cm: Math.round(l0 + k * (l1 - l0)), kg: round2(w0 + Math.pow(k, 3) * (w1 - w0)), trophy: t.id }; },
  /* Tx içinde: trofe yakalandı → ilk ödül bir kez */
  onCatch(id, size) {
    const t = TROPHY[id]; const b = S.trophy.best[id]; if (!b || size.kg > b.kg) S.trophy.best[id] = { cm: size.cm, kg: size.kg };
    if (S.trophy.done[id]) return false;
    S.trophy.done[id] = { day: S.day, cm: size.cm, kg: size.kg }; this.grant(t.reward); if (!S.album.some(a => a.id === id)) S.album.push({ id, day: S.day });
    return true;
  },
  grant(r) {
    if (r.kind === 'decor' && !S.home.owned.includes(r.id)) S.home.owned.push(r.id);
    if (r.kind === 'ornament') { S.cosmetics.ornaments = S.cosmetics.ornaments || []; if (!S.cosmetics.ornaments.includes(r.id)) S.cosmetics.ornaments.push(r.id); }
    if (r.kind === 'charm') { S.cosmetics.charms = S.cosmetics.charms || []; if (!S.cosmetics.charms.includes(r.id)) S.cosmetics.charms.push(r.id); if (!S.cosmetics.charm) S.cosmetics.charm = r.id; }
    if (r.kind === 'color' && !S.cosmetics.boatColors.includes(r.id)) S.cosmetics.boatColors.push(r.id);
  }
};

/* ---------- Balıkçı Birliği ---------- */
const Guild = {
  week(d) { return Math.floor(((d || S.day) - 1) / 7) + 1; },
  open() { return S.day >= 3; },
  stage() { return S.boats.owned.length >= 3 || S.day >= 45 ? 'late' : S.boats.owned.length ? 'mid' : 'early'; },
  reward(stage) { return stage === 'late' ? { cash: 69, bait: 'lure', n: 3 } : stage === 'mid' ? { cash: 28, bait: 'shrimp', n: 3 } : { cash: 12, bait: 'worm', n: 2 }; },
  value(r) { return r.cash + r.n * BAIT[r.bait].purchase_price; },
  ok(id) {
    const boat = S.boats.owned.length > 0;
    switch (id) {
      case 'A06': return SPOT_LIST.some(sp => S.world.unlocked[sp.region_id] && Object.keys(sp.weights).some(f => FISH[f].power >= 3 && FISH[f].power <= maxRodPower() + 1));
      case 'B02': return S.boats.owned.some(b => Trips.maxStops(b) > 1) && REGIONS.filter(r => r.id !== 'sakin_liman' && S.boats.owned.some(b => Boats.reach(r.id, b).ok)).length >= 2;
      case 'B05': case 'C05': case 'D06': return boat;
      case 'B06': return V4.trophies.some(t => Trophy.unlocked(t.id) && S.boats.owned.concat([null]).some(b => Boats.reach(t.rid, b).ok) && FISH[t.fid].power <= maxRodPower() + 1);
      case 'C06': return V3.projects.some(p => !Projects.done(p.id));
      case 'D01': return Object.keys(S.aq.owned).length > 0;
      case 'D02': return S.stats.manualCatches >= 1;
      case 'D04': return S.boats.owned.length >= 2;
      case 'D05': return S.gearSets.some(g => g.rod);
    }
    return true;
  },
  /* her hafta 3 görev: kayıtlı, deterministik; yeniden yükleme değiştirmez */
  ensure() {
    if (!this.open()) return null; const w = this.week();
    if (S.guild && S.guild.week === w) return S.guild;
    const prev = S.guild ? S.guild.tasks.map(t => t.id) : [];
    S.guild = { week: w, tasks: this.pick(w, prev, []), rerolled: false, prev, gen: S.day, sets: {} };
    return S.guild;
  },
  pick(w, prev, keep) {
    const out = keep.slice(); const used = new Set(out.map(t => t.id)); const stg = this.stage();
    for (const slot of [1, 2, 3]) {
      if (out.some(t => GUILDT[t.id].slot === slot)) continue;
      let pool = V4.guild.filter(g => g.slot === slot && !used.has(g.id) && this.ok(g.id));
      const fresh = pool.filter(g => !prev.includes(g.id)); if (fresh.length) pool = fresh;
      if (!pool.length) pool = V4.guild.filter(g => !used.has(g.id) && this.ok(g.id) && g.nonFish);
      const g = pool[Math.floor(hr('guild', w, slot, keep.length) * pool.length)]; used.add(g.id);
      out.push({ id: g.id, prog: 0, done: false, claimed: false, reward: this.reward(stg) });
    }
    if (!out.some(t => GUILDT[t.id].nonFish)) { const alt = V4.guild.filter(g => g.slot === 3 && g.nonFish && !used.has(g.id) && this.ok(g.id)); out[2] = { id: alt[0].id, prog: 0, done: false, claimed: false, reward: this.reward(stg) }; }
    return out.sort((a, b) => GUILDT[a.id].slot - GUILDT[b.id].slot);
  },
  reroll(id) {
    return Tx.run('guildReroll', () => {
      const G = this.ensure(); if (!G) return { ok: false }; if (G.rerolled) return { ok: false, msg: _t('sys4.bu_hafta_gorev_degistirme_hakkini') };
      const i = G.tasks.findIndex(t => t.id === id); if (i < 0 || G.tasks[i].claimed || G.tasks[i].done) return { ok: false, msg: _t('sys4.tamamlanan_gorev_degistirilemez') };
      const slot = GUILDT[id].slot; const used = new Set(G.tasks.map(t => t.id)); let pool = V4.guild.filter(g => g.slot === slot && !used.has(g.id) && this.ok(g.id) && !G.prev.includes(g.id));
      if (!pool.length) pool = V4.guild.filter(g => g.slot === slot && !used.has(g.id) && this.ok(g.id)); if (!pool.length) return { ok: false, msg: _t('sys4.uygun_baska_gorev_yok') };
      const others = G.tasks.filter((t, k) => k !== i); let g = pool[Math.floor(hr('guildR', G.week) * pool.length)];
      if (!others.some(t => GUILDT[t.id].nonFish) && !g.nonFish) { const nf = pool.filter(x => x.nonFish); if (!nf.length) return { ok: false, msg: _t('sys4.bu_gorev_haftanin_tek_balikcilik') }; g = nf[0]; }
      G.tasks[i] = { id: g.id, prog: 0, done: false, claimed: false, reward: G.tasks[i].reward }; G.rerolled = true; delete G.sets[id];
      return { ok: true, id: g.id };
    });
  },
  claim(id) {
    return Tx.run('guildClaim', () => {
      const G = this.ensure(); const t = G && G.tasks.find(x => x.id === id); if (!t || !t.done) return { ok: false, msg: _t('sys4.gorev_henuz_tamamlanmadi') }; if (t.claimed) return { ok: false, msg: _t('sys4.odul_zaten_alindi') };
      t.claimed = true; const r = t.reward; S.cash += r.cash; S.today.guildIncome = (S.today.guildIncome || 0) + r.cash; S.stats.guildIncome = (S.stats.guildIncome || 0) + r.cash; S.baitStock[r.bait] += r.n; S.stats.guildDone = (S.stats.guildDone || 0) + 1;
      Sound.sfx('coin'); return { ok: true, r };
    });
  },
  /* olay tabanlı ilerleme: yalnız görevin seçildiği haftada yapılan gerçek faaliyetler (çağrı Tx içinde de dışında da olabilir) */
  ev(type, d) {
    if (!S || !S.guild || S.guild.week !== this.week() || QA.noGuild) return; d = d || {}; const G = S.guild; let ch = false;
    for (const t of G.tasks) {
      if (t.done) continue; const before = t.prog; const set = k => { const s = G.sets[t.id] || (G.sets[t.id] = []); if (!s.includes(k)) s.push(k); t.prog = s.length; };
      switch (t.id) {
        case 'A01': if (type === 'catch' && d.method === 'float') t.prog++; break;
        case 'A02': if (type === 'catch' && d.method === 'bottom') t.prog++; break;
        case 'A03': if (type === 'catch' && d.method === 'spin') t.prog++; break;
        case 'A04': if (type === 'catch' && d.method) set(d.method); break;
        case 'A05': if (type === 'perfect') t.prog++; break;
        case 'A06': if (type === 'catch' && d.power >= 3) t.prog++; break;
        case 'B01': if (type === 'spots2') t.prog = Math.max(t.prog, d.n); break;
        case 'B02': if (type === 'stops2') t.prog++; break;
        case 'B03': if (type === 'catch' && d.daypart === 'morning') t.prog++; break;
        case 'B04': if (type === 'catch' && d.daypart === 'evening') t.prog++; break;
        case 'B05': if (type === 'binoc') t.prog++; break;
        case 'B06': if (type === 'trophyEnc') t.prog++; break;
        case 'C01': if (type === 'market') t.prog += d.n; break;
        case 'C02': if (type === 'order' && d.n > 0) t.prog++; break;
        case 'C03': if (type === 'tea' && d.n > 0) t.prog++; break;
        case 'C04': if (type === 'talk') set(d.npc); break;
        case 'C05': if (type === 'guestTrip') t.prog++; break;
        case 'C06': if (type === 'donate') t.prog += d.n; break;
        case 'D01': if (type === 'aq') t.prog++; break;
        case 'D02': if (type === 'shore') t.prog++; break;
        case 'D03': if (type === 'photo') t.prog++; break;
        case 'D04': if (type === 'fleet') t.prog++; break;
        case 'D05': if (type === 'catch' && G.gsReady) t.prog++; break;
        case 'D06': if (type === 'report2') t.prog++; break;
      }
      t.prog = Math.min(t.prog, GUILDT[t.id].need);
      if (t.prog !== before) ch = true;
      if (t.prog >= GUILDT[t.id].need && !t.done) { t.done = S.day; Bus.toast(_t('sys4.birlik_gorevi_tamamlandi_n', [GUILDT[t.id].name]), 'good', 'guild'); }
    }
    if (ch) Save.soon();
  }
};

/* ---------- Kasaba hikâyeleri ---------- */
const Stories = {
  st(npc) { return S.stories[npc] || (S.stories[npc] = { stage: 0, data: {} }); },
  /* 0 kilitli · 1..3 aktif aşama · 4 tamamlandı */
  cond(npc) { if (npc === 'efe') return S.stats.manualCatches >= 1; if (npc === 'kerem') return (S.shore.runs || 0) >= 1; return S.boats.owned.length > 0; },
  check() { for (const n of STORY_NPCS) { const s = this.st(n); if (s.stage === 0 && this.cond(n)) { s.stage = 1; s.unlocked = S.day; if (S.storyTrack.length < 2 && !S.storyTrack.includes(n)) S.storyTrack.push(n); } } this.auto(); },
  auto() {
    const k = S.stories.kerem; if (k && k.stage === 2 && Object.keys(S.shore.items).length >= 3) k.stage = 3;
  },
  goal(npc) { const s = this.st(npc); if (s.stage === 0) return _t('sys4.acilma_n', [V4.stories[npc].unlock]); if (s.stage >= 4) return _t('sys4.tamamlandi'); let g = V4.stories[npc].stages[s.stage - 1].goal; if (npc === 'elif' && s.stage === 2 && s.data.spots) g += ' (' + s.data.spots.map(x => SPOTS[x].name + (s.data.seen && s.data.seen.includes(x) ? ' ✓' : '')).join(', ') + ')'; if (npc === 'bora' && s.stage === 2) g += ' (' + ((s.data.spots || []).length) + '/2)'; if (npc === 'kerem' && s.stage === 2) g += ' (' + Math.min(3, Object.keys(S.shore.items).length) + '/3)'; return g; },
  canTalk(npc) { const s = this.st(npc); return s.stage === 1 || s.stage === 3; },
  talk(npc) {
    let line = null;
    const r = Tx.run('storyTalk', () => {
      const s = this.st(npc); if (!this.canTalk(npc)) return { ok: false };
      line = V4.stories[npc].stages[s.stage - 1].talk;
      if (s.stage === 1) {
        if (npc === 'mert') { if (!S.boats.active) return { ok: false, msg: _t('sys4.aktif_bir_tekne_gerekli') }; if (Guests.valid() && S.guest.npc !== 'mert') return { ok: false, msg: _t('sys4.bugun_zaten_baska_bir_misafirin') }; S.guest = { npc: 'mert', day: S.day }; }
        if (npc === 'elif') s.data.spots = this.elifSpots();
        if (npc === 'bora') s.data.spots = [];
        s.stage = 2; s.start = S.day; this.auto();
      } else if (s.stage === 3) { s.stage = 4; s.done = S.day; this.reward(npc); }
      return { ok: true };
    });
    return r.ok ? { ok: true, line, done: this.st(npc).stage === 4 } : r;
  },
  elifSpots() {
    const regs = REGIONS.filter(r => r.id !== 'sakin_liman' && S.boats.owned.some(b => Boats.reach(r.id, b).ok)).map(r => r.id); if (!regs.length) regs.push('sakin_liman');
    const spots = []; regs.forEach(r => REGION[r].spot_ids.forEach(sp => spots.push(sp)));
    const a = spots[Math.floor(hr('elif', 1) * spots.length)]; const rest = spots.filter(x => x !== a); const b = rest[Math.floor(hr('elif', 2) * rest.length)];
    return [a, b];
  },
  /* özel inceleme noktası (Efe: Dalgakıran; Elif: iki manzara noktası) */
  inspectable(spotId) {
    const out = []; const e = S.stories.efe; if (e && e.stage === 2 && spotId === V4.stories.efe.stages[1].inspect && Game.sceneName === 'PierFishing') out.push('efe');
    const l = S.stories.elif; if (l && l.stage === 2 && l.data.spots && l.data.spots.includes(spotId) && !(l.data.seen || []).includes(spotId) && Game.sceneName === 'BoatFishing') out.push('elif');
    return out;
  },
  inspect(npc, spotId) {
    let text = null;
    const r = Tx.run('storyInspect', () => {
      const s = this.st(npc); if (!this.inspectable(spotId).includes(npc)) return { ok: false };
      if (npc === 'efe') { s.stage = 3; text = V4.stories.efe.stages[1].found; }
      if (npc === 'elif') { s.data.seen = (s.data.seen || []).concat([spotId]); text = _t('sys4.elif_in_cizdigi_manzara_n', [SPOTS[spotId].name]); if (s.data.spots.every(x => s.data.seen.includes(x))) s.stage = 3; }
      return { ok: true };
    });
    return r.ok ? { ok: true, text } : r;
  },
  onSpot(spotId) { const b = S.stories.bora; if (b && b.stage === 2 && Game.sceneName === 'BoatFishing') { b.data.spots = b.data.spots || []; if (!b.data.spots.includes(spotId)) b.data.spots.push(spotId); if (b.data.spots.length >= 2) b.stage = 3; } },
  onTripEnd(rep) { const m = S.stories.mert; if (m && m.stage === 2 && rep.guest === 'mert' && rep.stops.some(r => r !== 'sakin_liman')) m.stage = 3; },
  reward(npc) { const R = V4.stories[npc].reward; if (!S.album.some(a => a.id === R.album)) S.album.push({ id: R.album, day: S.day }); if (R.decor && !S.home.owned.includes(R.decor)) S.home.owned.push(R.decor); },
  track(npc) { const i = S.storyTrack.indexOf(npc); if (i >= 0) S.storyTrack.splice(i, 1); else { if (S.storyTrack.length >= 2) S.storyTrack.shift(); S.storyTrack.push(npc); } Save.soon(); }
};

/* ---------- Kıyı keşfi (veri ve kurallar; sahne 10_v4) ---------- */
const Shore = {
  unlocked() { return S.stats.manualCatches >= 1; },
  canStart() { return this.unlocked() && S.shore.day !== S.day; },
  count() { return Object.keys(S.shore.items).length; },
  session() { const s = S.shore.session; if (s && s.day !== S.day) { S.shore.session = null; return null; } return S.shore.session; },
  /* oturum kayıtlıdır: yarıda bırakılırsa aynı düzen ve aynı nesnelerle devam eder (yeniden zar atılmaz) */
  start(env) {
    if (!this.unlocked()) return { ok: false, msg: _t('sys4.kiyi_kesfi_ilk_basarili_avdan') };
    if (S.shore.day === S.day) return { ok: false, msg: _t('sys4.bugunku_kiyi_kesfini_tamamladin_yarin') };
    const cur = this.session(); if (cur) return { ok: true, s: cur, resumed: true };
    if (!V4.shoreEnv[env]) return { ok: false };
    return Tx.run('shoreStart', () => {
      const r = mulberry(hash32(S.seed, 'shore', S.day, env)); const items = this.rollItems(env, r);
      const n = env === 'sand' ? 7 : env === 'rocks' ? 6 : 5; const idx = []; while (idx.length < items.length) { const k = Math.floor(r() * n); if (!idx.includes(k)) idx.push(k); }
      const clues = env === 'sand' ? ['color', 'glint', 'wave', 'stones'] : null;
      const spots = Array.from({ length: n }, (_, i) => ({ i, item: idx.includes(i) ? items[idx.indexOf(i)] : null, clue: clues ? clues[Math.floor(r() * 4)] : null, decoy: false, tapped: false }));
      const free = spots.filter(s => !s.item); if (free.length) free[Math.floor(r() * free.length)].decoy = true;
      S.shore.session = { day: S.day, env, spots, found: [], taps: 0, hints: 0, done: false };
      return { ok: true, s: S.shore.session };
    });
  },
  /* ilk keşifte yeni nesne garanti; iki tekrar sonrasında (yeni kaldıysa) yeni garanti */
  rollItems(env, r) {
    const all = V4.shore.filter(x => x.env.includes(env)); const fresh = all.filter(x => !S.shore.items[x.id]); const anyFresh = V4.shore.filter(x => !S.shore.items[x.id]);
    const mustNew = (S.shore.runs === 0 || S.shore.dup >= 2) && anyFresh.length > 0;
    let first; if (mustNew) { const pool = fresh.length ? fresh : anyFresh; first = pool[Math.floor(r() * pool.length)].id; } else first = all[Math.floor(r() * all.length)].id;
    const out = [first]; if (r() < 0.25) { const pool = all.filter(x => x.id !== first); out.push(pool[Math.floor(r() * pool.length)].id); }
    return out;
  },
  /* bir noktayı incele: yanlış seçim cezasız; doğru seçimde nesne bulunur */
  pick(i) {
    let got = null;
    const r = Tx.run('shorePick', () => {
      const s = this.session(); if (!s || s.done) return { ok: false }; const sp = s.spots[i]; if (!sp || sp.tapped) return { ok: false };
      sp.tapped = true; s.taps++; if (sp.item) { s.found.push(sp.item); got = sp.item; }
      if (s.spots.filter(x => x.item).every(x => x.tapped)) this.complete(s);
      return { ok: true };
    });
    return r.ok ? { ok: true, item: got, done: !!(S.shore.session && S.shore.session.done) } : r;
  },
  hint() { const s = this.session(); if (!s || s.done) return; s.hints++; Save.soon(); },
  /* Tx içinde: koleksiyona kaydet, günlük hak tüket */
  complete(s) {
    let anyNew = false; s.newItems = [];
    for (const id of s.found) { const e = S.shore.items[id]; if (!e) { S.shore.items[id] = { first: S.day, n: 1 }; anyNew = true; s.newItems.push(id); } else e.n++; }
    S.shore.dup = anyNew ? 0 : (S.shore.dup || 0) + 1; S.shore.runs = (S.shore.runs || 0) + 1; S.shore.day = S.day; s.done = true;
    Guild.ev('shore', {}); Stories.check();
  }
};

/* ---------- Dürbünle gözlem (sefer başına 1, 5 enerji) ---------- */
const Binoc = {
  ENERGY: 5, DUR: 40, FOCUS: 1.2,
  unlocked() { return S.boats.owned.length > 0; },
  reason() {
    if (!this.unlocked()) return _t('sys4.ilk_tekneyle_acilir'); if (Game.sceneName !== 'BoatFishing' || !S.trip) return _t('sys4.yalnizca_tekne_seferinde_kullanilabilir');
    if (S.trip.binoc) return _t('sys4.bu_seferde_durbun_etkinligi_yapildi'); const sc = Game.scene; if (!sc.atSpot() || Math.abs(sc.v) > 4 || sc.arrive > 0) return _t('sys4.tekne_bir_av_noktasinda_durmali');
    if (Fishing.phase !== 'READY') return _t('sys4.once_oltayi_topla'); if (S.energy < this.ENERGY) return _t('sys4.enerji_yetmiyor_5_gerekli'); return null;
  },
  start() {
    return Tx.run('binocStart', () => {
      const why = this.reason(); if (why) return { ok: false, msg: why };
      const rid = Game.scene.rid; const r = mulberry(hash32(S.seed, 'binoc', S.trip.id, rid)); const pool = Wildlife.pool(rid);
      const appear = r() < 0.7 * Wildlife.chanceMul(); const targets = [];
      if (appear && pool.length) { const n = r() < 0.35 ? 2 : 1; for (let i = 0; i < n; i++) { const tot = sum(pool.map(w => w.w)); let x = r() * tot, pick = pool[0]; for (const w of pool) { x -= w.w; if (x < 0) { pick = w; break; } } targets.push({ id: pick.id, x: -0.85 + r() * 1.7, t0: 3 + r() * 14 + i * 8, life: 9 + r() * 5 }); } }
      S.energy -= this.ENERGY; S.trip.binoc = { state: 'on', rid, targets, day: S.day };
      return { ok: true };
    });
  },
  /* odaklanılan canlıyı kaydet — mevcut günlük 4 gözlem sınırına dahil */
  finish(id) {
    let res = null;
    Tx.run('binocDone', () => {
      const b = S.trip && S.trip.binoc; if (!b || b.state !== 'on') return { ok: false };
      b.state = 'done'; b.found = id || null; res = { id: id || null, recorded: false, isNew: false, capped: false };
      if (id) { if (S.wild.day !== S.day) { S.wild.day = S.day; S.wild.n = 0; S.wild.keys = {}; } if (S.wild.n >= Wildlife.DAILY_MAX) res.capped = true; else { res.isNew = Wildlife.register(id, b.rid); res.recorded = true; } }
      S.stats.binoc = (S.stats.binoc || 0) + 1; Guild.ev('binoc', {});
      return { ok: true };
    });
    return res;
  }
};

/* ---------- Açılış tanıtımları: aynı gün yalnızca en önemlisi bildirilir ---------- */
const Unlocks = {
  list: [
    { key: 'efe', get name() { return _t('sys4.kasaba_hikayesi_efe_nin_eski'); }, set name(v) { _sv(this, "name", v); }, ok: () => S.stats.manualCatches >= 1, icon: 'story' },
    { key: 'shore', get name() { return _t('sys4.kiyi_kesfi_acildi_iskele_yanindaki'); }, set name(v) { _sv(this, "name", v); }, ok: () => S.stats.manualCatches >= 1, icon: 'shore' },
    { key: 'guild', get name() { return _t('sys4.balikci_birligi_panosu_acildi_haftalik'); }, set name(v) { _sv(this, "name", v); }, ok: () => S.day >= 3, icon: 'guild' },
    { key: 'binoc', get name() { return _t('sys4.durbunle_gozlem_acildi_teknede_sefer'); }, set name(v) { _sv(this, "name", v); }, ok: () => S.boats.owned.length > 0, icon: 'binoc' },
    { key: 'boatStories', get name() { return _t('sys4.mert_elif_ve_bora_nin'); }, set name(v) { _sv(this, "name", v); }, ok: () => S.boats.owned.length > 0, icon: 'story' },
    { key: 'kerem', get name() { return _t('sys4.kasaba_hikayesi_kerem_in_deniz'); }, set name(v) { _sv(this, "name", v); }, ok: () => (S.shore.runs || 0) >= 1, icon: 'story' },
    { key: 'trophy', get name() { return _t('sys4.trofe_avi_balikci_defteri_nde'); }, set name(v) { _sv(this, "name", v); }, ok: () => V4.trophies.some(t => Trophy.unlocked(t.id)), icon: 'trophy_t' }
  ],
  check() {
    if (!S || !S.unlocks) return; let first = null;
    for (const u of this.list) if (!S.unlocks[u.key] && u.ok()) { S.unlocks[u.key] = S.day; if (!first) first = u; }
    if (first && S.v4.introDay !== S.day) { S.v4.introDay = S.day; Bus.toast(first.name, 'good', first.icon); }
  },
  fresh(key) { return S.unlocks[key] && S.day - S.unlocks[key] <= 1; }
};
{
  const _cc = Cosmetics.check.bind(Cosmetics);
  Cosmetics.check = function () { _cc(); if (S.stories) { Stories.check(); Unlocks.check(); } };
  const _sd = World.startDay.bind(World);
  World.startDay = function () { _sd(); if (S.guild !== undefined) Guild.ensure(); };
}

/* ---------- olay bağlantıları (mevcut sistemlere ince sarmalayıcılar) ---------- */
{
  const wrapN = (obj, fn, type, nOf) => { const f = obj[fn].bind(obj); obj[fn] = function (...a) { const r = f(...a); const n = nOf(r); if (n > 0) Guild.ev(type, { n }); return r; }; };
  wrapN(Market, 'sell', 'market', r => r && r.ok ? r.n : 0); wrapN(Market, 'sellAll', 'market', r => r && r.ok ? r.n : 0);
  wrapN(SellIn, 'market', 'market', r => r ? r.n : 0); wrapN(SellIn, 'order', 'order', r => r ? r.n : 0); wrapN(SellIn, 'tea', 'tea', r => r ? r.n : 0);
  wrapN(Orders, 'deliver', 'order', r => r && r.ok ? r.n : 0); wrapN(Tea, 'sell', 'tea', r => r && r.ok ? r.n : 0);
  wrapN(Projects, 'donate', 'donate', r => r && r.ok ? r.amt : 0); wrapN(Aq, 'put', 'aq', r => r && r.ok ? 1 : 0); wrapN(Aq, 'move', 'aq', r => r && r.ok ? 1 : 0);
  wrapN(Fleet, 'collect', 'fleet', r => r && r.ok ? 1 : 0);
  const _ga = GearSets.apply.bind(GearSets);
  GearSets.apply = function (i) { const r = _ga(i); if (r.ok && S.guild) { if (S.guild.lastSet !== i) S.guild.gsReady = true; S.guild.lastSet = i; Save.soon(); } return r; };
  const _line = NPCDialog.line.bind(NPCDialog);
  NPCDialog.line = function (npc) { const l = _line(npc); Guild.ev('talk', { npc }); return l; };
  const _add = Trips.addStop.bind(Trips);
  Trips.addStop = function (rid) { const r = _add(rid); if (r.ok) { Opp.endIfMoved(rid); Guild.ev('stops2', {}); Save.soon(); } return r; };
  const _end = Trips.end.bind(Trips);
  Trips.end = function () {
    const rep = _end(); if (!rep) return rep;
    if (rep.guest) Guild.ev('guestTrip', {}); if (rep.spots.length >= 2) { S.guild && (S.guild.rep2 = rep.id); }
    Stories.onTripEnd(rep); const a = Opp.active(); if (a && a.trip === rep.id) a.status = 'ended'; Save.soon();
    return rep;
  };
}

/* ---------- Mali Günlük: Birlik ödülleri ayrı gelir kalemi ---------- */
Finance.close = function (rep) {
  const by = rep.expBy || {}; const gearC = (by.gear || 0) + (by.boat || 0) + (by.automation || 0);
  const fw = by.fleet_wage || 0, ff = by.fleet_fuel || 0, pj = by.project || 0;
  const income = (rep.marketIncome || 0) + (rep.orderIncome || 0) + (rep.teaIncome || 0) + (rep.prizeIncome || 0) + (rep.guildIncome || 0);
  const expense = rep.expenses || 0;
  const e = { day: rep.prevDay || rep.day, manual: rep.manualCatches, auto: rep.autoCatches, fleetFish: rep.fleetFish || 0, market: rep.marketIncome || 0, orders: rep.orderIncome || 0, tea: rep.teaIncome || 0, prize: rep.prizeIncome || 0, guild: rep.guildIncome || 0,
    bait: by.bait || 0, fuel: by.fuel || 0, gear: gearC, fleetWage: fw, fleetFuel: ff, project: pj, other: expense - (by.bait || 0) - (by.fuel || 0) - gearC - fw - ff - pj, income, expense, net: rep.endCash - rep.startCash, startCash: rep.startCash, endCash: rep.endCash };
  e.consistent = e.net === income - expense;
  S.fin.push(e); while (S.fin.length > 30) S.fin.shift();
  return e;
};

/* ---------- kayıt doğrulama (şema 5 alanları) ---------- */
V4.validate = function (st) {
  const e = [];
  if (!['flow', 'classic'].includes(st.tempo)) e.push(_t('sys4.av_temposu'));
  if (!st.opp || typeof st.opp.per !== 'object' || !Array.isArray(st.opp.log)) e.push(_t('sys4.firsatlar')); else if (st.opp.active && (!V4.oppTypes[st.opp.active.type] || !(st.opp.active.left >= 0) || st.opp.active.left > 2)) e.push(_t('sys4.aktif_firsat'));
  if (!st.trophy || typeof st.trophy.done !== 'object') e.push(_t('sys4.trofeler_2')); else { if (st.trophy.target && !TROPHY[st.trophy.target]) e.push(_t('sys4.trofe_hedefi')); for (const k in st.trophy.done) if (!TROPHY[k]) e.push('trofe ' + k); }
  if (st.guild) { if (!Array.isArray(st.guild.tasks) || st.guild.tasks.length !== 3 || st.guild.tasks.some(t => !GUILDT[t.id])) e.push(_t('sys4.birlik_gorevleri')); else if (new Set(st.guild.tasks.map(t => t.id)).size !== 3) e.push(_t('sys4.tekrarli_gorev')); }
  if (!st.stories || typeof st.stories !== 'object') e.push(_t('sys4.hikayeler')); else for (const k in st.stories) if (!V4.stories[k] || !(st.stories[k].stage >= 0 && st.stories[k].stage <= 4)) e.push(_t('sys4.hikaye_n', [k]));
  if (!st.shore || typeof st.shore.items !== 'object') e.push(_t('sys4.kiyi_koleksiyonu_2')); else for (const k in st.shore.items) if (!SHORE[k]) e.push(_t('sys4.kiyi_nesnesi_n', [k]));
  if (!Array.isArray(st.album) || !Array.isArray(st.storyTrack) || st.storyTrack.length > 2) e.push(_t('sys4.album_takip'));
  return e;
};
