// GDD Bölüm 11: 20 kalıcı upgrade (4 dal + gizli Solara dalı).
export const UPGRADE_BRANCHES = {
  sailing: { name: 'Denizcilik', icon: 'wheel' },
  trade: { name: 'Ticaret', icon: 'coin' },
  gear: { name: 'Teçhizat', icon: 'cannon' },
  explore: { name: 'Keşif', icon: 'compass' },
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
  U('UPG_SUN_GRACE', 'solara', 'Güneşin Lütfu', 'Run boyunca XP kazanımı +%10', 400, null, { needsSolara: true }),
  U('UPG_ETERNAL_LIGHT', 'solara', 'Ebedi Işık', 'Felaket eventlerinde sonuç bir kategori yumuşar', 600, 'UPG_SUN_GRACE', { needsSolara: true }),
];
export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
