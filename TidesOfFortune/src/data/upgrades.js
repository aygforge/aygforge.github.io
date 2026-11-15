// GDD Bölüm 11: 20 kalıcı upgrade (4 dal + gizli Solara dalı).
export const UPGRADE_BRANCHES = {
  sailing: { name: 'Denizcilik', icon: 'wheel' },
  trade: { name: 'Ticaret', icon: 'coin' },
  gear: { name: 'Teçhizat', icon: 'cannon' },
  explore: { name: 'Keşif', icon: 'compass' },
  crew: { name: 'Mürettebat', icon: 'crew' },
  legend: { name: 'Deniz Efsaneleri', icon: 'eye' },
  solara: { name: "Solara'nın Mirası", icon: 'sun', hidden: true },
};

const U = (id, branch, name, effect, cost, req = null, extra = {}) => ({ id, branch, name, effect, cost, req, ...extra });

export const UPGRADES = [
  U('UPG_HULL_1', 'sailing', 'Güçlendirilmiş Gövde I', 'Başlangıç hull +10', 150, null, { hullBonus: 10 }),
  U('UPG_HULL_2', 'sailing', 'Güçlendirilmiş Gövde II', 'Başlangıç hull +20 (toplam)', 300, 'UPG_HULL_1', { hullBonus: 20 }),
  U('UPG_HULL_3', 'sailing', 'Güçlendirilmiş Gövde III', 'Başlangıç hull +30 (toplam)', 500, 'UPG_HULL_2', { hullBonus: 30 }),
  U('UPG_SEASONED_ROUTE', 'sailing', 'Deneyimli Rota', 'Rota başına event −1', 400),
  U('UPG_STORM_SENSE', 'sailing', 'Fırtına Sezgisi', 'Fırtına eventlerinde kaçış +%10', 250),
  U('UPG_CAPITAL_1', 'trade', 'Başlangıç Sermayesi I', 'Başlangıç altını +50', 100, null, { goldBonus: 50 }),
  U('UPG_CAPITAL_2', 'trade', 'Başlangıç Sermayesi II', 'Başlangıç altını +100 (toplam)', 250, 'UPG_CAPITAL_1', { goldBonus: 100 }),
  U('UPG_CAPITAL_3', 'trade', 'Başlangıç Sermayesi III', 'Başlangıç altını +200 (toplam)', 450, 'UPG_CAPITAL_2', { goldBonus: 200 }),
  U('UPG_GLOBAL_NET', 'trade', 'Global Satış Ağı', 'Tüm satışlarda +%5 kâr', 350),
  U('UPG_EXTRA_HOLD', 'trade', 'Ekstra Ambar', 'Başlangıç kargosu +1 slot', 300),
  U('UPG_ARMORY_1', 'gear', 'Geniş Cephanelik', '4. item slotu başlangıçta açık', 400),
  U('UPG_RARE_SUPPLIER', 'gear', 'Nadir Tedarikçi', 'Item havuzuna kalıcı nadir itemler eklenir', 300),
  U('UPG_CHEAP_SWAP', 'gear', 'Ucuz Takas', 'Item değiştirme ücreti −%50', 200),
  U('UPG_ARMORY_2', 'gear', 'İkinci Cephanelik', '5. item slotu açık', 600, 'UPG_ARMORY_1'),
  U('UPG_MYSTERY_MAPS', 'explore', 'Gizemli Ada Haritaları', 'Gizemli Ada liman tipinin kilidi açılır', 200),
  U('UPG_ICE_ROUTES', 'explore', 'Buzul Rotaları', 'Buzul Limanı tipinin kilidi açılır', 350, 'UPG_MYSTERY_MAPS'),
  U('UPG_HARBOR_SIGHT', 'explore', 'Liman Öngörüsü', 'Haritada liman tipleri baştan görünür', 250),
  U('UPG_EXPLORER', 'explore', 'Kaşif Ruhu', 'Keşif eventlerinde XP +%50', 300),
  // ── Yaşayan Denizler (X1): 12 yükseltme, toplam 4.730 XP ──
  U('UPG_X1_RUDDER', 'sailing', 'Güçlendirilmiş Dümen', 'Manevra seçimlerine (seyir, kaçış, riskli geçiş) +10 yüzde puan başarı', 280, 'UPG_STORM_SENSE'),
  U('UPG_X1_ROPES', 'sailing', 'Yedek Halatlar', "Her run'da ilk direk/arma hasarı %50 azalır; tayfalar yedek halatlarla müdahale eder", 420, 'UPG_X1_RUDDER'),
  U('UPG_X1_MARKET_INTEL', 'trade', 'Pazar İstihbaratı', 'Rota seçiminde bir mal grubunun talep ipucu; söylenti doğruluğu +15 yüzde puan', 300, 'UPG_GLOBAL_NET'),
  U('UPG_X1_CARGO_INSURANCE', 'trade', 'Tüccar Sigortası', "Her run'da ilk düşmanca kargo hırsızlığında 1 birim mal korunur", 480, 'UPG_X1_MARKET_INTEL'),
  U('UPG_X1_EMERGENCY_LOCKER', 'gear', 'Acil Durum Dolabı', "Her run'da bir kez +15 hull acil onarım hakkı (item slotu kullanmaz)", 330),
  U('UPG_X1_MASTER_TOOLS', 'gear', 'Usta Tamirci Aletleri', 'Event onarımlarına +5 hull; şansa bağlı tayfa onarımlarına +10 yüzde puan (liman tamirinde geçmez)', 520, 'UPG_X1_EMERGENCY_LOCKER'),
  U('UPG_X1_LIGHTHOUSE_NETWORK', 'explore', 'Deniz Feneri Ağı', 'Rota seçiminde her deniz yolu için bir tehlike ipucu (hedef liman açılmaz)', 260, 'UPG_HARBOR_SIGHT'),
  U('UPG_X1_DEEP_RESEARCH', 'explore', 'Derin Deniz Araştırmaları', "Derin deniz eventlerinde özel araştırma seçenekleri; run'daki ilk derin keşfe +10 yüzde puan", 500, 'UPG_MYSTERY_MAPS'),
  U('UPG_X1_RECRUITER', 'crew', 'Usta İşe Alımcı', "Her run'da altınla işe alınan ilk tayfaya %15 indirim", 220),
  U('UPG_X1_CREW_JOURNALS', 'crew', 'Mürettebat Günlükleri', "Kişisel tayfa hikâyelerinde özel seçenekler; her run'da tamamlanan ilk kişisel hikâyeye +10 XP", 420, 'UPG_X1_RECRUITER'),
  U('UPG_X1_LEGEND_WHISPER', 'legend', 'Efsanelerin Fısıltısı', "Run'daki ilk uygun gizemli karşılaşmadan önce atmosferik ipucu", 350, null, { needMysteries: 5 }),
  U('UPG_X1_LEGEND_HUNTER', 'legend', 'Efsane Avcısı', 'Nadir gizem eventlerinin gizem kategorisi içindeki ağırlığı %25 artar (tüm havuz değil)', 650, 'UPG_X1_LEGEND_WHISPER', { needMysteryChain: true }),
  U('UPG_SUN_GRACE', 'solara', 'Güneşin Lütfu', 'Run boyunca XP kazanımı +%10', 400, null, { needsSolara: true }),
  U('UPG_ETERNAL_LIGHT', 'solara', 'Ebedi Işık', 'Felaket eventlerinde sonuç bir kategori yumuşar', 600, 'UPG_SUN_GRACE', { needsSolara: true }),
];
export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
