// Sürümlü kayıt: şema, varsayılan alan tamamlama, migration, localStorage + yedek, export/import.
// Kayıt yalnız İLERLEME içerir; statik DB ve runtime (mücadele) durumu kayda girmez.
(function (D) {
  'use strict';
  const KEY = 'dumen.save.v2';
  const BAK = 'dumen.save.bak';
  const SETTINGS_KEY = 'dumen.settings';

  function newState(seed) {
    const now = Date.now();
    return {
      schemaVersion: D.SAVE_VERSION,
      gameVersion: D.VERSION,
      createdAt: now,
      savedAt: now,
      seed: seed >>> 0,
      counters: { cast: 0, instance: 0, order: 0, sale: 0, trip: 0 },
      trip: null,
      wallet: { CUR_COIN: 60, CUR_SCRAP: 0, CUR_MIYAV: 0 },
      boat: { level: 1, installed: [] },
      unlockedRegions: ['EL'],
      owned: { rod: ['ROD_01'], line: ['LINE_01'], hook: ['HOOK_01'], float: ['FLOAT_01'] },
      equip: { rod: 'ROD_01', line: 'LINE_01', hook: 'HOOK_01', float: 'FLOAT_01', bait: null, specials: [] },
      inv: { fish: [], chests: [], items: { BAIT_01: 5 }, trash: {} },
      cosmetics: { owned: [], equipped: { flag: null, paint: null, hat: null } },
      collection: {},
      collectionRewards: {},
      quests: {},
      flags: {},
      npc: { rel: {}, talk: {} },
      daily: { dayKey: null, list: [] },
      wheel: { dayKey: null, freeUsed: false, rewardedUsed: 0, totalSpins: 0 },
      board: { offers: [], nextRefreshAt: 0 },
      orders: {},
      donJobs: { current: null, nextAt: 0, done: 0 },
      pendingCast: null,
      clock: { playTime: 0, maxRealTs: now },
      miyavLog: [],
      tx: { recent: [], once: {}, count: 0 },
      stats: {
        fishCaught: 0, chestsCaught: 0, chestsOpened: 0, trashCaught: 0, coinsEarned: 0, coinsSpent: 0,
        fishSold: 0, casts: 0, escapes: 0, snaps: 0, earlyPulls: 0, greenTreasures: 0, recycled: 0, crafted: 0,
        spins: 0, legendaryCaught: 0, bossCaught: 0, baitUsed: 0, ordersAccepted: 0
      }
    };
  }

  function defaultSettings() {
    return { music: 0.6, sfx: 0.8, mute: false, haptics: true, reducedMotion: false, highContrast: false, lowPower: false, language: 'tr', uiScale: 1 };
  }

  // Eksik alanları varsayılanlarla tamamla (derin, yalnız eksik anahtarlar).
  function fillDefaults(target, def) {
    for (const k of Object.keys(def)) {
      if (target[k] === undefined || target[k] === null && def[k] !== null && typeof def[k] === 'object') {
        target[k] = D.clone(def[k]);
      } else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof target[k] === 'object' && !Array.isArray(target[k])) {
        fillDefaults(target[k], def[k]);
      }
    }
    return target;
  }

  // GDD §27.5 şemasındaki (schemaVersion 1) kayıtları v2'ye taşır. Balık miktarları örneklere açılır, kayıp olmaz.
  const LEGACY_ROD = { wooden_rod: 'ROD_01', balanced_rod: 'ROD_02', sturdy_rod: 'ROD_03', fast_reel_rod: 'ROD_04', master_rod: 'ROD_05', ice_breaker_rod: 'ROD_06', red_nettle_rod: 'ROD_07', rod_rust_eater: 'ROD_08', rust_eater_rod: 'ROD_08', moonlight_whisper_rod: 'ROD_09' };
  const LEGACY_REGION = { old_port: 'EL', lazy_reeds: 'TS', rusty_industrial_canal: 'PSK', yakamoz_bay: 'YK', shivering_glaciers: 'TB', sunken_pirate_graveyard: 'BKM', boiling_cauldron_delta: 'KKD', bermuda_vortex: 'BG' };

  function migrateV1(old) {
    const s = newState(old.seed || D.RNG.hashStr('migrated' + Date.now()));
    s.createdAt = old.createdAt || s.createdAt;
    const cur = old.currency || {};
    s.wallet.CUR_COIN = Math.max(0, Math.floor(cur.coin || 0));
    s.wallet.CUR_MIYAV = Math.max(0, Math.floor(cur.miyav || 0));
    s.wallet.CUR_SCRAP = Math.max(0, Math.floor(cur.scrap || 0));
    const mapRod = (r) => LEGACY_ROD[r] || (D.FishDBSource && D.ItemDBSource.ItemDB[r] ? r : null);
    s.owned.rod = Array.from(new Set(['ROD_01'].concat((old.ownedRods || []).map(mapRod).filter(Boolean))));
    s.equip.rod = mapRod(old.selectedRodId) || 'ROD_01';
    if (!s.owned.rod.includes(s.equip.rod)) s.equip.rod = 'ROD_01';
    s.boat.level = D.clamp(Math.floor((old.boat && old.boat.level) || 1), 1, 10);
    s.unlockedRegions = Array.from(new Set(['EL'].concat((old.unlockedRegions || []).map((r) => LEGACY_REGION[r] || r).filter((r) => D.REGION_ORDER.includes(r)))));
    const inv = old.inventory || {};
    const fishList = [];
    const pushFish = (fishId, extra) => {
      if (!D.FishDBSource.FishDB[fishId]) return;
      const id = 'F' + (++s.counters.instance);
      const bal = D.FishBalanceDB[fishId];
      fishList.push({
        instanceId: id, fishId, size: (extra && extra.size) || Math.round(((bal.sizeMin + bal.sizeMax) / 2) * 10) / 10,
        caughtPlay: 0, regionCode: D.FishDBSource.FishDB[fishId].regionCode, questProtected: !!(extra && extra.questProtected),
        locked: false, castId: null, migrated: true
      });
    };
    if (Array.isArray(inv.fish)) {
      for (const f of inv.fish) {
        const qty = Math.max(1, Math.floor(f.quantity || f.qty || 1));
        for (let i = 0; i < qty; i++) pushFish(f.fishId || f.id, f);
      }
    } else if (inv.fish && typeof inv.fish === 'object') {
      for (const [fishId, qty] of Object.entries(inv.fish)) for (let i = 0; i < Math.floor(qty); i++) pushFish(fishId);
    }
    s.inv.fish = fishList;
    const addItems = (obj) => {
      if (!obj) return;
      for (const [id, n] of Object.entries(obj)) if (D.ItemDBSource.ItemDB[id] && D.isInt(n) && n > 0) s.inv.items[id] = (s.inv.items[id] || 0) + n;
    };
    addItems(inv.bait); addItems(inv.materials); addItems(inv.specialItems);
    for (const c of inv.chests || []) {
      const chestId = c.chestId || c.id;
      if (D.ItemDBSource.ItemDB[chestId]) {
        const qty = Math.max(1, Math.floor(c.quantity || 1));
        for (let i = 0; i < qty; i++) s.inv.chests.push({ instanceId: 'C' + (++s.counters.instance), chestId, quality: 'normal' });
      }
    }
    for (const [fishId, c] of Object.entries(old.collection || {})) {
      if (!D.FishDBSource.FishDB[fishId]) continue;
      s.collection[fishId] = { count: Math.max(1, c.count || 1), maxSize: c.maxSize || 0, maxValue: c.maxValue || 0, firstAt: c.firstAt || 0 };
    }
    if (old.stats) for (const k of Object.keys(s.stats)) if (D.isInt(old.stats[k])) s.stats[k] = old.stats[k];
    s.migratedFrom = 1;
    return s;
  }

  function migrate(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Kayıt okunamadı');
    let s = raw;
    const v = s.schemaVersion || 1;
    if (v > D.SAVE_VERSION) throw new Error('Kayıt daha yeni bir oyun sürümünden (v' + v + ')');
    if (v < 2) s = migrateV1(s);
    fillDefaults(s, newState(s.seed || 1));
    s.schemaVersion = D.SAVE_VERSION;
    // Güvenlik: kayıt içindeki ID'ler geçerli mi?
    s.inv.fish = s.inv.fish.filter((f) => D.FishDBSource.FishDB[f.fishId]);
    s.inv.chests = s.inv.chests.filter((c) => D.ItemDBSource.ItemDB[c.chestId] && D.ItemDBSource.ItemDB[c.chestId].category === 'chest');
    for (const id of Object.keys(s.inv.items)) if (!D.ItemDBSource.ItemDB[id]) delete s.inv.items[id];
    for (const slot of ['rod', 'line', 'hook', 'float']) {
      s.owned[slot] = s.owned[slot].filter((id) => D.ItemDBSource.ItemDB[id] && D.ItemDBSource.ItemDB[id].category === slot);
      if (!s.owned[slot].includes(s.equip[slot])) s.equip[slot] = s.owned[slot][0];
    }
    s.pendingCast = null; // yarım kalmış atış asla geri gelmez (ekstra av üretmez)
    return s;
  }

  const store = {
    get(k) { try { return globalThis.localStorage ? localStorage.getItem(k) : null; } catch (e) { return null; } },
    set(k, v) { try { if (globalThis.localStorage) { localStorage.setItem(k, v); return true; } } catch (e) { console.warn('save failed', e); } return false; },
    del(k) { try { if (globalThis.localStorage) localStorage.removeItem(k); } catch (e) { /* yok */ } }
  };

  const Save = {
    KEY, BAK, newState, migrate, migrateV1, fillDefaults, defaultSettings,
    hasSave() { const r = store.get(KEY); if (!r) return false; try { migrate(JSON.parse(r)); return true; } catch (e) { return false; } },
    load() {
      const raw = store.get(KEY);
      if (!raw) return { state: null };
      try { return { state: migrate(JSON.parse(raw)) }; } catch (e) {
        const bak = store.get(BAK);
        if (bak) { try { return { state: migrate(JSON.parse(bak)), warning: 'Ana kayıt bozuktu; yedekten yüklendi.' }; } catch (e2) { /* yok */ } }
        return { state: null, error: 'Kayıt bozuk: ' + e.message };
      }
    },
    write(state) {
      state.savedAt = Date.now();
      const txt = JSON.stringify(state);
      const prev = store.get(KEY);
      if (prev) store.set(BAK, prev);
      return store.set(KEY, txt);
    },
    wipe() { const prev = store.get(KEY); if (prev) store.set('dumen.save.deleted', prev); store.del(KEY); store.del(BAK); },
    exportText(state) { return JSON.stringify({ format: 'DUMEN_SAVE', exportedAt: new Date().toISOString(), save: state }, null, 0); },
    importText(txt) {
      const obj = JSON.parse(txt);
      const raw = obj && obj.format === 'DUMEN_SAVE' ? obj.save : obj;
      const s = migrate(raw);
      D.Tx.checkInvariants(s);
      return s;
    },
    loadSettings() {
      const def = defaultSettings();
      try { const r = store.get(SETTINGS_KEY); if (r) return Object.assign(def, JSON.parse(r)); } catch (e) { /* varsayılan */ }
      return def;
    },
    saveSettings(st) { store.set(SETTINGS_KEY, JSON.stringify(st)); }
  };
  D.Save = Save;
})(globalThis.DUMEN);
