'use strict';
/* ---- 07_v3.js ---- */
/* =====================================================================
   07_v3.js : CozFis v3.0 sistemleri
   FishingMethods, Dayparts, Trips (çok duraklı sefer + sefer raporu), TownProjects,
   Wildlife, Guests, Fleet (yevmiyeli balıkçılar). Mevcut S / Tx / Inv / Selector / Boats / Orders
   yapıları genişletilir; ikinci bir ekonomi, envanter veya kayıt sistemi yoktur.
   ===================================================================== */
const V3 = {
  methods: {
    float: { get name() { return _t('sys3.samandirali_av'); }, set name(v) { _sv(this, "name", v); }, get short() { return _t('sys3.samandira'); }, set short(v) { _sv(this, "short", v); }, icon: 'm_float', get desc() { return _t('sys3.mevcut_klasik_yontem_atis_bekleme'); }, set desc(v) { _sv(this, "desc", v); } },
    bottom: { get name() { return _t('sys3.dip_oltasi'); }, set name(v) { _sv(this, "name", v); }, get short() { return _t('sys3.dip'); }, set short(v) { _sv(this, "short", v); }, icon: 'm_bottom', get desc() { return _t('sys3.yem_dibe_iner_samandira_yerine'); }, set desc(v) { _sv(this, "desc", v); } },
    spin: { get name() { return _t('sys3.spin_avciligi'); }, set name(v) { _sv(this, "name", v); }, get short() { return _t('sys3.spin'); }, set short(v) { _sv(this, "short", v); }, icon: 'm_spin', get desc() { return _t('sys3.atistan_sonra_yem_durdugunda_kisa'); }, set desc(v) { _sv(this, "desc", v); } }
  },
  /* her türün uygun yöntemleri (birinci öğe en uygunu). Yöntem çarpanı yalnızca göreli ağırlıktır; hiçbir tür kapanmaz. */
  fishMethods: {
    sardalya: ['float'], gumus_baligi: ['float'], istavrit: ['float', 'spin'], izmarit: ['float', 'bottom'], kefal: ['float'], zargana: ['spin', 'float'],
    hamsi: ['float'], kaya_baligi: ['bottom', 'float'], sarpan: ['float'], iskorpit: ['bottom'],
    isparoz: ['float', 'bottom'], melanur: ['float'], karagoz: ['float', 'bottom'], cipura: ['bottom', 'float'], sargoz: ['float', 'bottom'], levrek: ['float', 'spin'],
    kupes: ['float'], mirmir: ['bottom'], dil_baligi: ['bottom'], minakop: ['bottom'],
    tekir: ['bottom'], barbun: ['bottom'], eskina: ['bottom'], mercan: ['bottom'], fangri: ['bottom'], sinarit: ['spin', 'bottom'], hanos: ['bottom', 'float'],
    kirlangic: ['bottom'], lahoz: ['bottom'], orfoz: ['bottom'],
    kolyoz: ['float', 'spin'], uskumru: ['spin', 'float'], lufer: ['spin'], palamut: ['spin'], yazili_orkinos: ['spin'], akya: ['spin'], tirsi: ['float'],
    dulger: ['bottom'], kalkan: ['bottom'], sarikuyruk: ['spin'],
    ringa: ['float'], mezgit: ['bottom'], pisi_baligi: ['bottom'], morina: ['bottom'], komur_baligi: ['bottom', 'spin'], halibut: ['bottom'], kapelin: ['float'],
    topak_baligi: ['bottom'], kizil_levrek: ['bottom'], kurt_baligi: ['bottom'],
    ucan_balik: ['float'], sari_kuyruklu_fusilier: ['float'], mavi_yuzgecli_trevally: ['spin'], kirmizi_snapper: ['bottom'], lambuka: ['spin'], barrakuda: ['spin'],
    mavi_cerrah: ['float'], papagan_baligi: ['float'], mercan_hanisi: ['bottom'], dev_trevally: ['spin'],
    albakor: ['spin'], sari_yuzgecli_orkinos: ['spin'], wahoo: ['spin'], buyuk_gozlu_orkinos: ['spin', 'bottom'], kilic_baligi: ['spin'], yelken_baligi: ['spin'],
    cizgili_orkinos: ['spin'], pervane_baligi: ['bottom'], opah: ['bottom'], mavi_marlin: ['spin']
  },
  dayparts: {
    morning: { get name() { return _t('sys3.sabah'); }, set name(v) { _sv(this, "name", v); }, icon: 'dp_morning', get desc() { return _t('sys3.pembe_altin_gun_dogumu_suru'); }, set desc(v) { _sv(this, "desc", v); } },
    day: { get name() { return _t('sys3.gunduz'); }, set name(v) { _sv(this, "name", v); }, icon: 'dp_day', get desc() { return _t('sys3.standart_aydinlatma_ve_mevcut_av'); }, set desc(v) { _sv(this, "desc", v); } },
    evening: { get name() { return _t('sys3.aksamustu'); }, set name(v) { _sv(this, "name", v); }, icon: 'dp_evening', get desc() { return _t('sys3.turuncu_mor_gun_batimi_aksam'); }, set desc(v) { _sv(this, "desc", v); } }
  },
  dpFish: {
    morning: ['sardalya', 'hamsi', 'istavrit', 'gumus_baligi', 'levrek', 'cipura', 'karagoz', 'isparoz', 'tekir', 'barbun', 'kolyoz', 'uskumru', 'tirsi', 'ringa', 'kapelin', 'mezgit', 'ucan_balik', 'mavi_yuzgecli_trevally', 'sari_kuyruklu_fusilier', 'albakor', 'cizgili_orkinos'],
    evening: ['iskorpit', 'kefal', 'minakop', 'mirmir', 'sinarit', 'orfoz', 'lahoz', 'lufer', 'palamut', 'kalkan', 'dulger', 'morina', 'kurt_baligi', 'komur_baligi', 'kirmizi_snapper', 'barrakuda', 'lambuka', 'dev_trevally', 'wahoo', 'kilic_baligi', 'opah']
  },
  projects: [
    { id: 'pier', get name() { return _t('sys3.iskele_yenilemesi'); }, set name(v) { _sv(this, "name", v); }, cost: 3500, icon: 'proj_pier', get look() { return _t('sys3.yeni_ahsaplar_banklar_kucuk_fenerler'); }, set look(v) { _sv(this, "look", v); }, get perk() { return _t('sys3.yalnizca_sakin_liman_iskele_avlarinda'); }, set perk(v) { _sv(this, "perk", v); } },
    { id: 'market', get name() { return _t('sys3.balik_pazari_duzenlemesi'); }, set name(v) { _sv(this, "name", v); }, cost: 12000, icon: 'proj_market', get look() { return _t('sys3.yeni_golgelikler_tezgah_susleri_cicekler'); }, set look(v) { _sv(this, "look", v); }, get perk() { return _t('sys3.siparis_panosunda_1_aktif_alis'); }, set perk(v) { _sv(this, "perk", v); } },
    { id: 'lighthouse', get name() { return _t('sys3.liman_feneri_yenilemesi'); }, set name(v) { _sv(this, "name", v); }, cost: 28000, icon: 'proj_lighthouse', get look() { return _t('sys3.mevcut_fener_tas_yuzey_ve'); }, set look(v) { _sv(this, "look", v); }, get perk() { return _t('sys3.sectigin_iki_bolgenin_ertesi_gun'); }, set perk(v) { _sv(this, "perk", v); } },
    { id: 'terrace', get name() { return _t('sys3.deniz_seyir_terasi'); }, set name(v) { _sv(this, "name", v); }, cost: 55000, icon: 'proj_terrace', get look() { return _t('sys3.iskele_ucunda_ahsap_seyir_platformu'); }, set look(v) { _sv(this, "look", v); }, get perk() { return _t('sys3.deniz_canlisi_gozlem_karsilasmalarinin_goreli'); }, set perk(v) { _sv(this, "perk", v); } }
  ],
  /* 24 gözlem: yedi bölgenin iklim ve habitatına uygun gerçek canlılar. kind = animasyon türü */
  wildlife: [
    { id: 'gumus_marti', rid: 'sakin_liman', get name() { return _t('sys3.gumus_marti'); }, set name(v) { _sv(this, "name", v); }, kind: 'sky', w: 5, get info() { return _t('sys3.sari_bacakli_kiyi_martisi_balikci'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'karabatak', rid: 'sakin_liman', get name() { return _t('sys3.karabatak'); }, set name(v) { _sv(this, "name", v); }, kind: 'dive', w: 3, get info() { return _t('sys3.suya_dalip_balik_avlayan_koyu'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'kiyi_yengeci', rid: 'sakin_liman', get name() { return _t('sys3.kiyi_yengeci'); }, set name(v) { _sv(this, "name", v); }, kind: 'crab', w: 3, get info() { return _t('sys3.taslarin_arasinda_yan_yan_yuruyen'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'gri_balikcil', rid: 'sakin_liman', get name() { return _t('sys3.gri_balikcil'); }, set name(v) { _sv(this, "name", v); }, kind: 'wade', w: 2, get info() { return _t('sys3.siglikta_sabirla_bekleyip_ani_bir'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'caretta', rid: 'yesil_koy', get name() { return _t('sys3.caretta_kaplumbagasi'); }, set name(v) { _sv(this, "name", v); }, kind: 'surface', w: 2, get info() { return _t('sys3.iri_basli_deniz_kaplumbagasi_nefes'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'ay_denizanasi', rid: 'yesil_koy', get name() { return _t('sys3.ay_denizanasi'); }, set name(v) { _sv(this, "name", v); }, kind: 'under', w: 4, get info() { return _t('sys3.yari_saydam_dort_halkali_zararsiz'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'deniz_ati', rid: 'yesil_koy', get name() { return _t('sys3.deniz_ati'); }, set name(v) { _sv(this, "name", v); }, kind: 'under', w: 2, get info() { return _t('sys3.deniz_cayirlarinda_kuyruguyla_tutunan_kucuk'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'akdeniz_foku', rid: 'kayalik_adalar', get name() { return _t('sys3.akdeniz_foku'); }, set name(v) { _sv(this, "name", v); }, kind: 'surface', w: 1, get info() { return _t('sys3.nadir_gorulen_fok_kayalik_magaralarda'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'deniz_yildizi', rid: 'kayalik_adalar', get name() { return _t('sys3.deniz_yildizi'); }, set name(v) { _sv(this, "name", v); }, kind: 'bed', w: 4, get info() { return _t('sys3.kayalik_dipte_yavasca_ilerleyen_bes'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'ahtapot', rid: 'kayalik_adalar', get name() { return _t('sys3.ahtapot'); }, set name(v) { _sv(this, "name", v); }, kind: 'under', w: 3, get info() { return _t('sys3.renk_degistirerek_kayalara_karisan_zeki'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'afalina', rid: 'serin_akintilar', get name() { return _t('sys3.afalina_yunus_surusu'); }, set name(v) { _sv(this, "name", v); }, kind: 'leap', w: 3, get info() { return _t('sys3.akinti_boylarinda_suruyle_yuzen_teknelerin'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'sumsuk', rid: 'serin_akintilar', get name() { return _t('sys3.sumsuk_kusu'); }, set name(v) { _sv(this, "name", v); }, kind: 'dive', w: 3, get info() { return _t('sys3.yuksekten_ok_gibi_suya_dalan'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'pusula_denizanasi', rid: 'serin_akintilar', get name() { return _t('sys3.pusula_denizanasi'); }, set name(v) { _sv(this, "name", v); }, kind: 'under', w: 2, get info() { return _t('sys3.semsiyesinde_pusula_gulunu_andiran_kahverengi'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'liman_foku', rid: 'sisli_kuzey', get name() { return _t('sys3.liman_foku'); }, set name(v) { _sv(this, "name", v); }, kind: 'surface', w: 3, get info() { return _t('sys3.benekli_kurklu_kuzey_foku_merakli'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'puffin', rid: 'sisli_kuzey', get name() { return _t('sys3.deniz_papagani'); }, set name(v) { _sv(this, "name", v); }, kind: 'sky', w: 3, get info() { return _t('sys3.renkli_gagali_kucuk_kuzey_kusu'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'orka', rid: 'sisli_kuzey', get name() { return _t('sys3.orka_surusu'); }, set name(v) { _sv(this, "name", v); }, kind: 'fin', w: 1, get info() { return _t('sys3.siyah_beyaz_deniz_memelileri_uzun'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'fulmar', rid: 'sisli_kuzey', get name() { return _t('sys3.fulmar'); }, set name(v) { _sv(this, "name", v); }, kind: 'sky', w: 3, get info() { return _t('sys3.dalgalarin_hemen_ustunde_suzulen_martiya'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'ucan_balik_suru', rid: 'gunes_adalari', get name() { return _t('sys3.ucan_balik_surusu'); }, set name(v) { _sv(this, "name", v); }, kind: 'skim', w: 4, get info() { return _t('sys3.gogus_yuzgeclerini_acip_yuzeyin_ustunde'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'manta', rid: 'gunes_adalari', get name() { return _t('sys3.manta_vatozu'); }, set name(v) { _sv(this, "name", v); }, kind: 'leap', w: 1, get info() { return _t('sys3.kanat_gibi_yuzgecleriyle_suzulen_dev'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'yesil_kaplumbaga', rid: 'gunes_adalari', get name() { return _t('sys3.yesil_deniz_kaplumbagasi'); }, set name(v) { _sv(this, "name", v); }, kind: 'surface', w: 2, get info() { return _t('sys3.deniz_cayirlariyla_beslenen_mercanlarin_arasinda'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'firkateyn', rid: 'gunes_adalari', get name() { return _t('sys3.firkateyn_kusu'); }, set name(v) { _sv(this, "name", v); }, kind: 'sky', w: 2, get info() { return _t('sys3.kirmizi_girtlak_kesesi_olan_ruzgarda'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'kambur_balina', rid: 'derin_mavi', get name() { return _t('sys3.kambur_balina'); }, set name(v) { _sv(this, "name", v); }, kind: 'spout', w: 1, get info() { return _t('sys3.uzakta_su_puskurten_dev_balina'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'donen_yunus', rid: 'derin_mavi', get name() { return _t('sys3.donen_yunus'); }, set name(v) { _sv(this, "name", v); }, kind: 'leap', w: 3, get info() { return _t('sys3.sudan_sicrayip_kendi_ekseninde_donen'); }, set info(v) { _sv(this, "info", v); } },
    { id: 'ay_baligi', rid: 'derin_mavi', get name() { return _t('sys3.ay_baligi'); }, set name(v) { _sv(this, "name", v); }, kind: 'fin', w: 2, get info() { return _t('sys3.yuzeyde_yan_yatip_guneslenen_yuvarlak'); }, set info(v) { _sv(this, "info", v); } }
  ],
  guestNpcs: ['efe', 'ali', 'mert', 'elif', 'bora'],
  guestLines: {
    greet: { get efe() { return _t('sys3.ruzgari_kokla_evlat_deniz_bugun'); }, set efe(v) { _sv(this, "efe", v); }, get ali() { return _t('sys3.teknen_ferahmis_yasli_kemiklerim_iyi'); }, set ali(v) { _sv(this, "ali", v); }, get mert() { return _t('sys3.sonunda_tekneyle_acilmayi_hep_hayal'); }, set mert(v) { _sv(this, "mert", v); }, get elif() { return _t('sys3.defterimi_getirdim_gordugumuz_her_seyi'); }, set elif(v) { _sv(this, "elif", v); }, get bora() { return _t('sys3.motoru_dinliyorum_tikir_tikir_iyi'); }, set bora(v) { _sv(this, "bora", v); } },
    region: {
      get sakin_liman() { return _t('sys3.bu_koyda_dedemle_ilk_istavritimi'); }, set sakin_liman(v) { _sv(this, "sakin_liman", v); }, get yesil_koy() { return _t('sys3.yesil_koy_un_sabahlari_zeytin'); }, set yesil_koy(v) { _sv(this, "yesil_koy", v); }, get kayalik_adalar() { return _t('sys3.kayaliklarda_bir_kez_dev_bir'); }, set kayalik_adalar(v) { _sv(this, "kayalik_adalar", v); },
      get serin_akintilar() { return _t('sys3.akinti_luferi_getirir_martilar_toplaninca'); }, set serin_akintilar(v) { _sv(this, "serin_akintilar", v); }, get sisli_kuzey() { return _t('sys3.sis_cokunce_fener_sesini_dinle'); }, set sisli_kuzey(v) { _sv(this, "sisli_kuzey", v); }, get gunes_adalari() { return _t('sys3.burada_su_oyle_berrak_ki'); }, set gunes_adalari(v) { _sv(this, "gunes_adalari", v); }, get derin_mavi() { return _t('sys3.derin_mavi_de_sabir_her'); }, set derin_mavi(v) { _sv(this, "derin_mavi", v); }
    },
    weather: { get sunny() { return _t('sys3.gunes_parlak_ama_golge_arayan'); }, set sunny(v) { _sv(this, "sunny", v); }, get cloudy() { return _t('sys3.bulutlu_hava_baligi_cesaretlendirir_sansimiz'); }, set cloudy(v) { _sv(this, "cloudy", v); }, get rain() { return _t('sys3.yagmur_suyu_karistirir_birazdan_istahlari'); }, set rain(v) { _sv(this, "rain", v); }, get fog() { return _t('sys3.sis_yumusak_bir_ortu_gibi'); }, set fog(v) { _sv(this, "fog", v); }, get wind() { return _t('sys3.ruzgarli_gun_misinayi_zorlar_gerilimi'); }, set wind(v) { _sv(this, "wind", v); } },
    get big() { return _t('sys3.vay_canina_bu_bir_canavar'); }, set big(v) { _sv(this, "big", v); }, get fresh() { return _t('sys3.bunu_daha_once_hic_gormemistim'); }, set fresh(v) { _sv(this, "fresh", v); }, get any() { return _t('sys3.guzel_av_elin_iyice_alisti'); }, set any(v) { _sv(this, "any", v); }, get farewell() { return _t('sys3.guzel_bir_geziydi_beni_de'); }, set farewell(v) { _sv(this, "farewell", v); }
  },
  fleetNpc: [
    { id: 'tuna', name: 'Tuna', get title() { return _t('sys3.kiyi_uzmani'); }, set title(v) { _sv(this, "title", v); }, mult: 0.90, get desc() { return _t('sys3.sakin_ve_sabirli_kucuk_ve'); }, set desc(v) { _sv(this, "desc", v); }, look: { skin: 1, hair: 1, hairColor: 2, body: 0, outfit: { shirt: '#4f86c6', shirt2: '#2e5a8a', pants: '#3a3a44', shoes: '#2a2226', pat: 'stripes' }, hat: 'bere' } },
    { id: 'bselin', get name() { return _t('sys3.balikci_selin'); }, set name(v) { _sv(this, "name", v); }, get title() { return _t('sys3.dengeli_balikci'); }, set title(v) { _sv(this, "title", v); }, mult: 1.00, get desc() { return _t('sys3.her_bolgede_dengeli_tur_dagilimiyla'); }, set desc(v) { _sv(this, "desc", v); }, look: { skin: 3, hair: 4, hairColor: 1, body: 0, outfit: { shirt: '#5fc46a', shirt2: '#3a8a42', pants: '#4a3a2a', shoes: '#3a2a22', pat: 'plain' }, hat: 'hasir' } },
    { id: 'ozan', name: 'Ozan', get title() { return _t('sys3.kayalik_ve_dip_avcisi'); }, set title(v) { _sv(this, "title", v); }, mult: 1.10, get desc() { return _t('sys3.kayalik_diplerin_ustasi_dip_turlerini'); }, set desc(v) { _sv(this, "desc", v); }, look: { skin: 4, hair: 0, hairColor: 0, body: 1, outfit: { shirt: '#7a5a3a', shirt2: '#5a3e24', pants: '#2a2a3a', shoes: '#1a1a22', pat: 'vest' }, hat: 'kasket', beard: true } },
    { id: 'melis', name: 'Melis', get title() { return _t('sys3.suru_balikcisi'); }, set title(v) { _sv(this, "title", v); }, mult: 1.05, get desc() { return _t('sys3.kucuk_suru_baliklarini_bulur_4'); }, set desc(v) { _sv(this, "desc", v); }, look: { skin: 0, hair: 7, hairColor: 4, body: 0, outfit: { shirt: '#f2c230', shirt2: '#c89a20', pants: '#3a4a6a', shoes: '#2a2226', pat: 'flower' }, hat: 'none' } },
    { id: 'riza', get name() { return _t('sys3.riza'); }, set name(v) { _sv(this, "name", v); }, get title() { return _t('sys3.ekonomik_balikci'); }, set title(v) { _sv(this, "title", v); }, mult: 0.85, get desc() { return _t('sys3.ucuza_calisir_ama_guclu_turlerde'); }, set desc(v) { _sv(this, "desc", v); }, look: { skin: 2, hair: 2, hairColor: 6, body: 1, outfit: { shirt: '#8a8a7a', shirt2: '#6a6a5a', pants: '#4a4a3a', shoes: '#3a2a22', pat: 'buttons' }, hat: 'klasik', mustache: true } },
    { id: 'duru', name: 'Duru', get title() { return _t('sys3.akinti_uzmani'); }, set title(v) { _sv(this, "title", v); }, mult: 1.15, get desc() { return _t('sys3.hareketli_deniz_baliklarinda_basarili_serin'); }, set desc(v) { _sv(this, "desc", v); }, look: { skin: 1, hair: 3, hairColor: 0, body: 0, outfit: { shirt: '#2fa39a', shirt2: '#1e7a72', pants: '#2a3a4a', shoes: '#2a2226', pat: 'knit' }, hat: 'denizci_bere' } },
    { id: 'kemal', name: 'Kemal', get title() { return _t('sys3.acik_deniz_uzmani'); }, set title(v) { _sv(this, "title", v); }, mult: 1.20, get desc() { return _t('sys3.kabinli_veya_acik_deniz_teknesiyle'); }, set desc(v) { _sv(this, "desc", v); }, look: { skin: 3, hair: 0, hairColor: 6, body: 1, outfit: { shirt: '#2a3a5a', shirt2: '#1a2440', pants: '#2a2a2a', shoes: '#1a1a22', pat: 'buttons' }, hat: 'kaptan', beard: true, beardColor: '#9a9a9a' } },
    { id: 'nil', name: 'Nil', get title() { return _t('sys3.tropik_deniz_uzmani'); }, set title(v) { _sv(this, "title", v); }, mult: 1.15, get desc() { return _t('sys3.tropik_ve_resif_baliklarini_tercih'); }, set desc(v) { _sv(this, "desc", v); }, look: { skin: 5, hair: 5, hairColor: 0, body: 0, outfit: { shirt: '#f26a8a', shirt2: '#c84a6a', pants: '#f4f0e4', shoes: '#c8a070', pat: 'flower' }, hat: 'cicek_taci' } }
  ],
  fleetDays: { yesil_koy: 2, kayalik_adalar: 2, serin_akintilar: 2, sisli_kuzey: 3, gunes_adalari: 3, derin_mavi: 3 },
  fleetWage: { yesil_koy: 55, kayalik_adalar: 110, serin_akintilar: 145, sisli_kuzey: 170, gunes_adalari: 230, derin_mavi: 460 },
  maxStops: { coastal_skiff: 1, motorboat: 2, cabin: 2, offshore: 2 }
};
const PROJ = Object.fromEntries(V3.projects.map(p => [p.id, p]));
const WILD = Object.fromEntries(V3.wildlife.map(w => [w.id, w]));
const FLEETNPC = Object.fromEntries(V3.fleetNpc.map(n => [n.id, n]));
const METHOD_IDS = ['float', 'bottom', 'spin'], DAYPART_IDS = ['morning', 'day', 'evening'];
const DP_SET = { morning: new Set(V3.dpFish.morning), evening: new Set(V3.dpFish.evening) };

/* ---------------- Av yöntemleri ---------------- */
const Methods = {
  PREF: { bottom: 1.22, spin: 1.2 }, MISS: 0.88,
  of(fid) { return V3.fishMethods[fid] || ['float']; },
  /* manuel atışta geçerli yöntem: yarışmada her zaman standart şamandıra */
  cur() { if (Comp.active() && Game.sceneName === 'PierFishing') return 'float'; return METHOD_IDS.includes(S.method) ? S.method : 'float'; },
  factor(m, fid, bait) {
    if (!m || m === 'float') return 1;
    const ok = this.of(fid).includes(m);
    if (m === 'bottom') return ok ? this.PREF.bottom : this.MISS;
    if (!ok) return this.MISS;
    return bait === 'lure' ? this.PREF.spin : (bait && bait !== 'basic' ? 1.12 : 1.06);
  },
  set(m) {
    if (!METHOD_IDS.includes(m)) return { ok: false };
    if (Fishing.ctx && Fishing.phase !== 'READY') return { ok: false, msg: _t('sys3.atis_veya_mucadele_surerken_yontem') };
    if (Comp.active() && Game.sceneName === 'PierFishing') return { ok: false, msg: _t('sys3.yarismada_standart_samandirali_av_kullanilir') };
    S.method = m; Save.soon(); return { ok: true };
  }
};
/* ---------------- Gün ışığı ---------------- */
const Dayparts = {
  BONUS: 1.12,
  cur() { if (Comp.active() && Game.sceneName === 'PierFishing') return 'day'; if (S.trip && S.trip.daypart) return S.trip.daypart; return DAYPART_IDS.includes(S.daypart) ? S.daypart : 'day'; },
  /* sahne çizimi için: yalnız av sahneleri ve deniz haritası gün ışığını yansıtır */
  scene() { return S && ['PierFishing', 'BoatFishing'].includes(Game.sceneName) ? this.cur() : 'day'; },
  factor(dp, fid) { return dp && DP_SET[dp] && DP_SET[dp].has(fid) ? this.BONUS : 1; },
  set(dp) {
    if (!DAYPART_IDS.includes(dp)) return { ok: false };
    if (S.trip) return { ok: false, msg: _t('sys3.seferde_gun_isigi_sefer_boyunca') };
    if (Fishing.ctx && Fishing.phase !== 'READY') return { ok: false, msg: _t('sys3.atis_surerken_degistirilemez') };
    S.daypart = dp; Save.soon(); return { ok: true };
  }
};
/* Selector.weights: isteğe bağlı yöntem ve gün ışığı çarpanları (temel × yem × mevsim × hava × mesafe × olay × gün ışığı × yöntem), yeniden normalize */
{
  const _w = Selector.weights.bind(Selector);
  Selector.weights = function (spotId, o) {
    const r = _w(spotId, o); o = o || {};
    if (o.auto || (!o.method && !o.daypart)) return r;
    for (const x of r.list) { x.fac.method = Methods.factor(o.method, x.id, o.bait); x.fac.daypart = Dayparts.factor(o.daypart, x.id); x.w *= x.fac.method * x.fac.daypart; }
    r.total = sum(r.list.map(x => x.w)); r.list.forEach(x => x.p = r.total > 0 ? x.w / r.total : 0);
    return r;
  };
}

/* ---------------- Kasaba projeleri ---------------- */
const Projects = {
  st(id) { return S.projects[id] || (S.projects[id] = { paid: 0, done: 0 }); },
  done(id) { return !!(S && S.projects && S.projects[id] && S.projects[id].done); },
  left(id) { return Math.max(0, PROJ[id].cost - this.st(id).paid); },
  mask() { return V3.projects.map(p => this.done(p.id) ? 1 : 0).join(''); },
  donate(id, amount) {
    let fin = false;
    const r = Tx.run('projectDonate', () => {
      const P = PROJ[id]; if (!P) return { ok: false }; const st = this.st(id);
      if (st.done) return { ok: false, msg: _t('sys3.bu_proje_zaten_tamamlandi') };
      const amt = Math.min(Math.floor(+amount || 0), this.left(id), S.cash);
      if (amt <= 0) return { ok: false, msg: S.cash <= 0 ? _t('sys3.bagis_icin_paran_yok') : _t('sys3.gecersiz_miktar') };
      spend(amt, 'project'); st.paid += amt; S.stats.donated = (S.stats.donated || 0) + amt;
      if (st.paid >= P.cost) { st.paid = P.cost; st.done = S.day; fin = true; if (id === 'market') Orders.refresh(S.day, null); if (id === 'lighthouse' && !(st.fc && st.fc.length)) st.fc = ['sakin_liman', 'yesil_koy']; }
      Sound.sfx(fin ? 'fanfare' : 'coin'); return { ok: true, amt, done: fin };
    });
    if (r.ok && fin) { Atlas.drop('pier:'); Game.projectFx = { id, t: Game.t }; Bus.toast(_t('sys3.n_tamamlandi_kasaba_yenilendi', [PROJ[id].name]), 'ach', PROJ[id].icon); }
    return r;
  },
  setForecast(i, rid) { const st = this.st('lighthouse'); if (!st.done || !REGION[rid]) return; st.fc = (st.fc || []).slice(0, 2); st.fc[i] = rid; Save.soon(); },
  /* yarının hava tahmini: World.weatherFor ile aynı deterministik sonuç */
  forecast() { if (!this.done('lighthouse')) return []; return (this.st('lighthouse').fc || []).filter(r => REGION[r]).slice(0, 2).map(rid => ({ rid, wx: World.weatherFor(rid, S.day + 1) })); }
};
{ const _slots = Orders.slots.bind(Orders); Orders.slots = function () { return _slots() + (Projects.done('market') ? 1 : 0); }; }

/* ---------------- Sefer (çok duraklı) ve sefer raporu ---------------- */
const Trips = {
  maxStops(bid) { return V3.maxStops[bid] || 1; },
  active() { return !!S.trip; },
  cur() { return S.trip ? S.trip.stops[S.trip.stops.length - 1] : null; },
  canAddStop() { const t = S.trip; if (!t) return false; return t.stops.length < this.maxStops(t.boat); },
  legCost(rid) { return Math.round(REGION[rid].trip_fuel_cost * 0.9); },
  /* Tx içinde çağrılır (SeaMap.depart) */
  begin(rid, fuel) {
    S.tripSeq = (S.tripSeq || 0) + 1;
    S.trip = { id: S.tripSeq, day: S.day, boat: S.boats.active, stops: [rid], legs: [{ rid, fuel }], spots: [], daypart: DAYPART_IDS.includes(S.daypart) ? S.daypart : 'day', fuel,
      energy0: S.energy, bait0: Object.assign({}, S.baitStock), manual: 0, auto: 0, fish: {}, value: 0, newSp: [], recs: [], wild: [], guest: Guests.valid() ? S.guest.npc : null, wildRoll: {} };
  },
  addStop(rid) {
    return Tx.run('tripLeg', () => {
      const t = S.trip; if (!t) return { ok: false, msg: _t('sys3.aktif_sefer_yok') };
      if (!this.canAddStop()) return { ok: false, msg: t.stops.length >= 2 ? _t('sys3.bir_seferde_en_fazla_iki') : _t('sys3.n_tek_bolgelik_seferler_yapabilir', [BOAT[t.boat].name]) };
      if (rid === this.cur()) return { ok: false, msg: _t('sys3.zaten_bu_bolgedesin') };
      if (t.stops.includes(rid)) return { ok: false, msg: _t('sys3.bu_bolgeyi_bu_seferde_zaten') };
      const re = Boats.reach(rid, t.boat); if (!re.ok) return { ok: false, msg: _t('sys3.bu_tekne_oraya_ulasamaz_n', [re.miss.join(', ')]) };
      const c = this.legCost(rid); if (S.cash < c) return { ok: false, msg: _t('sys3.yakit_icin_paran_yetmiyor_n', [c]) };
      if (c) spend(c, 'fuel'); S.stats.fuelSpent += c; t.fuel += c; t.legs.push({ rid, fuel: c }); t.stops.push(rid);
      S.regionId = rid; S.spotId = REGION[rid].spot_ids[0]; S.stats.regionsVisited[rid] = true; S.scene = 'BoatFishing';
      return { ok: true, cost: c };
    });
  },
  onCatch(fid, size, auto, res) {
    const t = S.trip; if (!t) return;
    if (auto) t.auto++; else t.manual++; t.fish[fid] = (t.fish[fid] || 0) + 1; t.value += FISH[fid].base_price;
    if (res.isNew && !t.newSp.includes(fid)) t.newSp.push(fid); if (res.isRecord) t.recs.push({ fid, cm: size.cm });
  },
  onSpot(sid) { const t = S.trip; if (t && !t.spots.includes(sid)) t.spots.push(sid); },
  end() {
    const t = S.trip; if (!t) return null; let rep = null;
    Tx.run('tripEnd', () => {
      let bait = 0; for (const b of PAID_BAITS) { const used = Math.max(0, (t.bait0[b] || 0) - (S.baitStock[b] || 0)); bait += used * BAIT[b].purchase_price; }
      rep = { id: t.id, day: t.day, boat: t.boat, boatName: BOAT[t.boat] ? BOAT[t.boat].name : t.boat, stops: t.stops.slice(), spots: t.spots.slice(), daypart: t.daypart, manual: t.manual, auto: t.auto, fish: Object.assign({}, t.fish),
        energy: Math.max(0, t.energy0 - S.energy), baitCost: bait, fuel: t.fuel, value: t.value, newSp: t.newSp.slice(), recs: t.recs.slice(), wild: t.wild.slice(), guest: t.guest };
      S.tripLog.push(rep); while (S.tripLog.length > 10) S.tripLog.shift();
      if (t.guest) S.guestLog[t.guest] = (S.guestLog[t.guest] || 0) + 1;
      S.trip = null; if (S.guest && t.guest === S.guest.npc) S.guest = null; return { ok: true };
    });
    return rep;
  }
};

/* ---------------- Deniz canlıları gözlemi ---------------- */
const Wildlife = {
  DAILY_MAX: 4, active: null,
  pool(rid) { return V3.wildlife.filter(w => w.rid === rid); },
  count() { return Object.keys(S.wild.seen).length; },
  /* oyun günü + av bağlamıyla deterministik karşılaşma; aynı sahneye girip çıkmak yeni gözlem üretmez */
  chanceMul() { return Projects.done('terrace') ? 1.1 : 1; },
  roll(rid, ctxKey, base) {
    if (!REGION[rid]) return null;
    if (S.wild.day !== S.day) { S.wild.day = S.day; S.wild.n = 0; S.wild.keys = {}; }
    S.wild.keys = S.wild.keys || {}; if (S.wild.keys[ctxKey]) return null; S.wild.keys[ctxKey] = 1;
    if (S.wild.n >= this.DAILY_MAX) return null;
    const r = mulberry(hash32(S.seed, 'wild', S.day, ctxKey)); if (r() >= base * this.chanceMul()) return null;
    const pool = this.pool(rid); const tot = sum(pool.map(w => w.w)); let x = r() * tot, pick = pool[0];
    for (const w of pool) { x -= w.w; if (x < 0) { pick = w; break; } }
    return pick.id;
  },
  /* Tx içinde: gözlemi kaydet (envanter, para, balık değişmez) */
  register(id, rid) {
    const e = S.wild.seen[id] || (S.wild.seen[id] = { first: S.day, rid, n: 0 }); const isNew = e.n === 0; e.n++; S.wild.n++;
    S.wild.log[S.day] = (S.wild.log[S.day] || 0) + 1; const days = Object.keys(S.wild.log); if (days.length > 30) delete S.wild.log[days[0]];
    if (S.trip && !S.trip.wild.includes(id)) S.trip.wild.push(id);
    return isNew;
  },
  trigger(rid, ctxKey, base) {
    const id = this.roll(rid, ctxKey, base); if (!id) { Save.soon(); return null; }
    let isNew = false; Tx.run('wildSeen', () => { isNew = this.register(id, rid); return { ok: true }; });
    this.active = { id, t: 0, rid, dir: hash32(S.day, ctxKey) % 2 ? 1 : -1 };
    Bus.toast((isNew ? _t('sys3.yeni_gozlem') : _t('sys3.gozlem')) + WILD[id].name + ' (' + this.count() + '/' + V3.wildlife.length + ')', isNew ? 'good' : 'info', 'wild_book');
    if (isNew) Sound.sfx('record');
    return id;
  },
  update(dt) { if (this.active) { this.active.t += dt; if (this.active.t > 6) this.active = null; } }
};
DECOR.push({ id: 'poster_wild', get name() { return _t('sys3.deniz_yasami_posteri'); }, set name(v) { _sv(this, "name", v); }, slot: 'wall', ach: 'wild16' }); DECOR_BY.poster_wild = DECOR[DECOR.length - 1];
ACHS.push(
  { id: 'wild8', get name() { return _t('sys3.doga_gozlemcisi'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys3.8_farkli_deniz_canlisi_gozlemle'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys3.deniz_yasami'); }, set category(v) { _sv(this, "category", v); } },
  { id: 'wild16', get name() { return _t('sys3.deniz_biyologu'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys3.16_farkli_deniz_canlisi_gozlemle'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys3.deniz_yasami'); }, set category(v) { _sv(this, "category", v); } },
  { id: 'wild24', get name() { return _t('sys3.yedi_denizin_tanigi'); }, set name(v) { _sv(this, "name", v); }, get condition_tr() { return _t('sys3.24_deniz_canlisinin_hepsini_gozlemle'); }, set condition_tr(v) { _sv(this, "condition_tr", v); }, get category() { return _t('sys3.deniz_yasami'); }, set category(v) { _sv(this, "category", v); } }
);
ACH_DEF.wild8 = [() => Object.keys(S.wild.seen).length, 8];
ACH_DEF.wild16 = [() => Object.keys(S.wild.seen).length, 16];
ACH_DEF.wild24 = [() => Object.keys(S.wild.seen).length, V3.wildlife.length];
ACH_REWARD.wild8 = { type: 'badge', id: 'wild_badge', get name() { return _t('sys3.doga_gozlemcisi_rozeti'); }, set name(v) { _sv(this, "name", v); } };
ACH_REWARD.wild16 = { type: 'decor', id: 'poster_wild', get name() { return _t('sys3.deniz_yasami_posteri'); }, set name(v) { _sv(this, "name", v); } };
ACH_REWARD.wild24 = { type: 'title', id: 'naturalist', get name() { return _t('sys3.yedi_denizin_tanigi_unvani'); }, set name(v) { _sv(this, "name", v); } };

/* ---------------- Misafir NPC gezileri (yalnızca sosyal) ---------------- */
const Guests = {
  bubble: null,
  valid() { return !!(S.guest && S.guest.day === S.day && V3.guestNpcs.includes(S.guest.npc)); },
  invite(npc) {
    return Tx.run('guestInvite', () => {
      if (!V3.guestNpcs.includes(npc)) return { ok: false, msg: _t('sys3.bu_kisi_su_an_geziye') };
      if (!S.boats.active) return { ok: false, msg: _t('sys3.misafir_almak_icin_bir_teknen') };
      if (S.trip) return { ok: false, msg: _t('sys3.sefer_surerken_misafir_alinamaz') };
      if (this.valid() && S.guest.npc !== npc) return { ok: false, msg: _t('sys3.ayni_anda_yalnizca_bir_misafir', [NPCS[S.guest.npc].name]) };
      S.guest = { npc, day: S.day }; return { ok: true };
    });
  },
  cancel() { S.guest = null; Save.soon(); },
  say(kind, arg) {
    const t = S.trip; if (!t || !t.guest) return; const L = V3.guestLines; const g = t.guest;
    const text = kind === 'greet' ? L.greet[g] : kind === 'region' ? L.region[arg] : kind === 'weather' ? L.weather[arg] : L[kind];
    if (text) this.bubble = { text, t: 0, life: 4.5 };
  },
  update(dt) { if (this.bubble) { this.bubble.t += dt; if (this.bubble.t > this.bubble.life) this.bubble = null; } }
};

/* ---------------- Filo: yevmiyeli balıkçılar ---------------- */
const Fleet = {
  capacity() { return Math.min(3, Math.max(0, S.boats.owned.length - 1)); },
  missionOf(bid) { return S.fleet.missions.find(m => m.boat === bid) || null; },
  busyNpc(id) { return S.fleet.missions.some(m => m.npc === id); },
  onMission(bid) { return !!this.missionOf(bid); },
  status(bid) { if (bid === S.boats.active) return 'active'; const m = this.missionOf(bid); if (!m) return 'idle'; return m.status === 'out' ? 'out' : 'back'; },
  /* günlük 5 aday: tohum + gün + uygunluk ile deterministik, gün içinde sabit */
  candidates() {
    const c = S.fleet.cand;
    if (!c || c.day !== S.day) {
      const avail = V3.fleetNpc.map(n => n.id).filter(id => !this.busyNpc(id)); const r = mulberry(hash32(S.seed, 'fleetc', S.day));
      for (let i = avail.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [avail[i], avail[j]] = [avail[j], avail[i]]; }
      S.fleet.cand = { day: S.day, ids: avail.slice(0, 5) };
    }
    return S.fleet.cand.ids;
  },
  maxPower(npc, bid) { const tier = BOAT_INFO[bid] ? BOAT_INFO[bid].tier : 1; return npc === 'kemal' && tier >= 3 ? 4 : 3; },
  cost(npc, rid) { const wage = Math.round(V3.fleetWage[rid] * FLEETNPC[npc].mult); const fuel = REGION[rid].trip_fuel_cost; return { wage, fuel, total: wage + fuel }; },
  /* NPC'nin bu bölgede getirebileceği türler: yalnız oyuncunun keşfettiği, güç 5 asla */
  pool(npc, rid, bid) {
    const mp = this.maxPower(npc, bid); const m = {};
    for (const sid of REGION[rid].spot_ids) for (const fid in SPOTS[sid].weights) {
      const f = FISH[fid]; if (!f || f.power >= 5 || f.power > mp) continue; if (!(S.ency[fid] && S.ency[fid].caught > 0)) continue;
      m[fid] = (m[fid] || 0) + SPOTS[sid].weights[fid];
    }
    return Object.entries(m).map(([fid, w]) => ({ fid, w: w * this.spec(npc, fid, rid) }));
  },
  spec(npc, fid, rid) {
    const f = FISH[fid], meth = Methods.of(fid);
    switch (npc) {
      case 'tuna': return f.power <= 2 ? 1.15 : 1;
      case 'ozan': return meth.includes('bottom') ? 1.18 : 1;
      case 'melis': return f.power <= 2 ? 1.12 : 1;
      case 'riza': return f.power >= 3 ? 0.8 : 1;
      case 'duru': return meth.includes('spin') ? 1.15 : 1;
      case 'kemal': return f.power >= 3 ? 1.15 : 1;
      case 'nil': return f.home_region === 'gunes_adalari' ? 1.2 : 1;
    }
    return 1;
  },
  countDist(npc, rid) {
    if (npc === 'melis' || (npc === 'duru' && rid === 'serin_akintilar') || (npc === 'nil' && rid === 'gunes_adalari')) return [0.20, 0.55, 0.25];
    if (npc === 'riza') return [0.30, 0.55, 0.15];
    return [0.25, 0.55, 0.20];
  },
  check(bid, npc, rid) {
    if (!Boats.owned(bid)) return _t('sys3.bu_tekneye_sahip_degilsin');
    if (S.boats.owned.length < 2) return _t('sys3.filo_gorevi_icin_en_az');
    if (bid === S.boats.active) return _t('sys3.aktif_teknen_goreve_gonderilemez_once');
    if (this.onMission(bid)) return _t('sys3.bu_tekne_zaten_bir_gorevde');
    if (S.fleet.missions.length >= this.capacity()) return _t('sys3.filo_kapasitesi_dolu_n', [this.capacity()]);
    if (Inv.total('boat:' + bid) > 0) return _t('sys3.goreve_cikmadan_once_tekne_deposu');
    if (!FLEETNPC[npc]) return _t('sys3.balikci_bulunamadi');
    if (this.busyNpc(npc)) return _t('sys3.n_baska_bir_gorevde', [FLEETNPC[npc].name]);
    if (!this.candidates().includes(npc)) return _t('sys3.n_bugun_is_ilanlarinda_degil', [FLEETNPC[npc].name]);
    if (!REGION[rid] || !V3.fleetDays[rid]) return _t('sys3.gecersiz_bolge');
    const re = Boats.reach(rid, bid); if (!re.ok) return _t('sys3.n_bu_bolgeye_ulasamaz_n', [BOAT[bid].name, re.miss.join(', ')]);
    if (!this.pool(npc, rid, bid).length) return _t('sys3.bu_bolgede_henuz_kendin_kesfettigin');
    if (S.cash < this.cost(npc, rid).total) return _t('sys3.paran_yetmiyor_n', [this.cost(npc, rid).total]);
    return null;
  },
  start(bid, npc, rid) {
    return Tx.run('fleetStart', () => {
      const err = this.check(bid, npc, rid); if (err) return { ok: false, msg: err };
      const c = this.cost(npc, rid); spend(c.wage, 'fleet_wage'); spend(c.fuel, 'fleet_fuel');
      S.fleet.seq = (S.fleet.seq || 0) + 1; const days = V3.fleetDays[rid];
      S.fleet.missions.push({ id: 'm' + S.fleet.seq, boat: bid, npc, rid, start: S.day, ret: S.day + days, days, wage: c.wage, fuel: c.fuel, status: 'out', result: null, left: null, notified: false });
      S.fleet.stats.wages += c.wage; S.fleet.stats.fuel += c.fuel; this.anim = { bid, kind: 'leave', t: Game.t };
      Sound.sfx('horn'); return { ok: true };
    });
  },
  /* görev sonucu: görev tohumu ile deterministik ve üretildiği anda kalıcı */
  resolve(m) {
    const r = mulberry(hash32(S.seed, 'fleet', m.id, m.npc, m.rid)); const d = this.countDist(m.npc, m.rid); const u = r();
    const n = u < d[0] ? 2 : u < d[0] + d[1] ? 3 : 4; const pool = this.pool(m.npc, m.rid, m.boat); const fish = {};
    if (pool.length) { const tot = sum(pool.map(p => p.w)); for (let i = 0; i < n; i++) { let x = r() * tot, pick = pool[0].fid; for (const p of pool) { x -= p.w; if (x < 0) { pick = p.fid; break; } } fish[pick] = (fish[pick] || 0) + 1; } }
    const total = sum(Object.values(fish)); const value = sum(Object.entries(fish).map(([f, q]) => FISH[f].base_price * q));
    return { fish, n: total, value };
  },
  /* yalnızca oyun günü ilerlediğinde (World.startDay) çağrılır; aynı gün tekrar çağrı sonucu değiştirmez */
  onNewDay() {
    if (!S.fleet) return; const back = [];
    for (const m of S.fleet.missions) if (m.status === 'out' && S.day >= m.ret) { m.result = this.resolve(m); m.left = Object.entries(m.result.fish).map(([f, q]) => ({ f, q })); m.status = 'back'; m.backDay = S.day; back.push(m); }
    if (back.length) Bus.toast(_t('sys3.balikci_limana_dondu_n', [back.map(m => _t('sys3.n_n_balik', [FLEETNPC[m.npc].name, m.result.n])).join(', ')]), 'good', 'fleet_back');
  },
  leftN(m) { return m.left ? sum(m.left.map(x => x.q)) : 0; },
  destinations() { const d = ['bag', 'chest']; for (const b of S.boats.owned) if (!this.onMission(b)) d.push('boat:' + b); return d; },
  /* teslimat: seçilen depo (ya da öncelik sırası); sığmayanlar Liman Teslim Kasası'nda bekler */
  collect(mid, dest) {
    return Tx.run('fleetCollect', () => {
      const m = S.fleet.missions.find(x => x.id === mid); if (!m || m.status !== 'back' || !m.left) return { ok: false, msg: _t('sys3.teslim_alinacak_balik_yok') };
      if (Game.sceneName !== 'Town' && !QA.silent) return { ok: false, msg: _t('sys3.teslimat_yalnizca_limandan_kasabadan_alinabilir') };
      const keys = dest ? [dest] : this.destinations(); let moved = 0;
      for (const it of m.left) { for (const k of keys) { if (it.q <= 0) break; if (k.startsWith('boat:') && this.onMission(k.slice(5)) && k.slice(5) !== m.boat) continue; const a = Inv.add(k, it.f, it.q); it.q -= a; moved += a; } }
      m.left = m.left.filter(x => x.q > 0);
      if (!moved) return { ok: false, msg: _t('sys3.secilen_depoda_yer_yok_baliklar') };
      S.fleet.stats.fish += moved; S.today.fleetFish = (S.today.fleetFish || 0) + moved;
      let done = false;
      if (!m.left.length) { done = true; S.fleet.stats.missions++; S.fleet.stats.value += m.result.value; S.fleet.missions = S.fleet.missions.filter(x => x !== m);
        S.fleet.log.push({ id: m.id, npc: m.npc, boat: m.boat, rid: m.rid, start: m.start, ret: m.ret, n: m.result.n, value: m.result.value, fish: m.result.fish, wage: m.wage, fuel: m.fuel }); while (S.fleet.log.length > 10) S.fleet.log.shift(); this.anim = { bid: m.boat, kind: 'arrive', t: Game.t }; }
      Sound.sfx('coin'); return { ok: true, n: moved, done, left: this.leftN(m) };
    });
  }
};
{
  const _sd = World.startDay.bind(World);
  World.startDay = function () { _sd(); if (S.fleet) Fleet.onNewDay(); if (S.guest && S.guest.day !== S.day) S.guest = null; };
  /* aktif tekne: görevdeki tekne seçilemez; seferde tekne değişmez */
  const _sa = Boats.setActive.bind(Boats);
  Boats.setActive = function (id) { if (Fleet.onMission(id)) { Bus.toast(_t('sys3.n_su_an_filo_gorevinde', [BOAT[id].name]), 'warn', 'fleet_out'); return { ok: false, msg: _t('sys3.tekne_gorevde') }; } if (S.trip) return { ok: false, msg: _t('sys3.tekne_degistirme_yalnizca_limanda_yapilabilir') }; return _sa(id); };
  const _acc = Inv.accessible.bind(Inv);
  Inv.accessible = function () { return _acc().filter(k => !(k.startsWith('boat:') && Fleet.onMission(k.slice(5)))); };
  /* mount: görevdeki tekneye cihaz takılamaz */
  const _mount = Auto.mount.bind(Auto);
  Auto.mount = function (dev, bid) { if (Fleet.onMission(bid)) return { ok: false, msg: _t('sys3.tekne_filo_gorevinde') }; return _mount(dev, bid); };
}

/* ---------------- Catch.record: sefer raporu ve misafir tepkisi ---------------- */
{
  const _rec = Catch.record;
  Catch.record = function (fid, size, auto, meta) {
    const r = _rec(fid, size, auto, meta);
    if (S.trip) { Trips.onCatch(fid, size, auto, r); if (!auto && S.trip.guest) Guests.say(r.isNew ? 'fresh' : (size.cls === 'exceptional' || r.isRecord) ? 'big' : (Math.random() < 0.35 ? 'any' : null)); }
    return r;
  };
}

/* ---------------- Mali Günlük: filo ve proje kalemleri ---------------- */
Finance.close = function (rep) {
  const by = rep.expBy || {}; const gearC = (by.gear || 0) + (by.boat || 0) + (by.automation || 0);
  const fw = by.fleet_wage || 0, ff = by.fleet_fuel || 0, pj = by.project || 0;
  const income = (rep.marketIncome || 0) + (rep.orderIncome || 0) + (rep.teaIncome || 0) + (rep.prizeIncome || 0);
  const expense = rep.expenses || 0;
  const e = { day: rep.prevDay || rep.day, manual: rep.manualCatches, auto: rep.autoCatches, fleetFish: rep.fleetFish || 0, market: rep.marketIncome || 0, orders: rep.orderIncome || 0, tea: rep.teaIncome || 0, prize: rep.prizeIncome || 0,
    bait: by.bait || 0, fuel: by.fuel || 0, gear: gearC, fleetWage: fw, fleetFuel: ff, project: pj, other: expense - (by.bait || 0) - (by.fuel || 0) - gearC - fw - ff - pj, income, expense, net: rep.endCash - rep.startCash, startCash: rep.startCash, endCash: rep.endCash };
  e.consistent = e.net === income - expense;
  S.fin.push(e); while (S.fin.length > 30) S.fin.shift();
  return e;
};

/* ---------------- kayıt doğrulama (şema 4 alanları) ---------------- */
V3.validate = function (st) {
  const e = [];
  if (!METHOD_IDS.includes(st.method)) e.push(_t('sys3.av_yontemi')); if (!DAYPART_IDS.includes(st.daypart)) e.push(_t('sys3.gun_isigi'));
  if (!st.projects || typeof st.projects !== 'object') e.push(_t('sys3.projeler'));
  else for (const p of V3.projects) { const x = st.projects[p.id]; if (!x || !(x.paid >= 0) || x.paid > p.cost || (x.done && x.paid !== p.cost)) e.push('proje ' + p.id); }
  if (!st.fleet || !Array.isArray(st.fleet.missions) || !Array.isArray(st.fleet.log)) e.push(_t('sys3.filo'));
  else {
    const boats = new Set(), npcs = new Set();
    for (const m of st.fleet.missions) {
      if (!st.boats.owned.includes(m.boat) || !FLEETNPC[m.npc] || !REGION[m.rid] || boats.has(m.boat) || npcs.has(m.npc) || m.boat === st.boats.active) e.push(_t('sys3.filo_gorevi_n', [m.id]));
      boats.add(m.boat); npcs.add(m.npc);
      if (m.left) for (const x of m.left) if (!FISH[x.f] || !(x.q >= 1) || x.q !== (x.q | 0)) e.push(_t('sys3.teslim_kasasi'));
    }
    if (st.fleet.missions.length > Math.min(3, Math.max(0, st.boats.owned.length - 1))) e.push(_t('sys3.filo_kapasitesi'));
  }
  if (!Array.isArray(st.tripLog) || st.tripLog.length > 10) e.push(_t('sys3.sefer_raporlari'));
  if (st.trip && (!Array.isArray(st.trip.stops) || st.trip.stops.length > 2 || !st.boats.owned.includes(st.trip.boat))) e.push(_t('sys3.aktif_sefer'));
  if (!st.wild || typeof st.wild.seen !== 'object') e.push(_t('sys3.gozlemler')); else for (const k in st.wild.seen) if (!WILD[k]) e.push(_t('sys3.gozlem_n', [k]));
  return e;
};
