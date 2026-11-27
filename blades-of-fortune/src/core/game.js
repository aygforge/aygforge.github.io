// Oyun çekirdeği — Tides'ın çekirdek sınıfının (act/persist/newRun/depart/nextEvent/choose/continueEvent/_finishRoute…) Blades uyarlaması.
import { CFG, clamp } from '../config.js';
import { Rng, newSeed } from '../engine/rng.js';
import { SaveManager, pickStorage } from '../engine/save.js';
import { ITEMS, RARITY } from '../data/items.js';
import { ENEMIES } from '../data/enemies.js';
import { UPGRADES, UPG } from '../data/meta.js';
import { TOWN_TYPES, LANE_TYPES, ENDLESS_CONDITIONS, DISTANCE_NAMES } from '../data/world.js';
import { EVENTS, CHAINS } from '../data/index.js';
import { newMeta, migrateMeta, migrateRun, defaultSettings, newRunState, heroStats, opensKeys, clampHp, hasItem, hasInBag, addItem, removeOne, addQItem, removeQItem, qitemName, hasUpg, countItem } from './state.js';
import { startCombat, combatAct, alive, fleeChance } from './combat.js';
import { makeStartTown, makeLanes, regionFor, diffRegion, voyageEventCount, pickEvent, shopStock, activeChains } from './worldgen.js';

const CONTRACT_TYPES = ['hunt', 'delivery', 'rescue', 'explore', 'escort', 'special'];
const RESCUE_TARGETS = ['EV_N04', 'EV_N09', 'EV_N02', 'EV_D06', 'EV_N13'];
const ROYAL_TARGETS = ['EV_R07', 'EV_R12', 'EV_R10'];

export class Game {
  constructor(storage = null) {
    this.save = new SaveManager(storage || pickStorage(), { migrateMeta, migrateRun, defaultSettings });
    this.G = { meta: this.save.loadMeta(), run: this.save.loadRun(), settings: this.save.loadSettings() };
    if (this.G.run && this.G.run.ended && this.G.run.xpBanked && this.G.run.summarySeen) this.G.run = null;
    this.listeners = []; this.toasts = [];
    this.rng = new Rng(this.G.run ? this.G.run.rngState || 1 : 1);
  }
  get run() { return this.G.run; }
  get meta() { return this.G.meta; }
  on(fn) { this.listeners.push(fn); }
  emit(t = 'change', p = null) { for (const f of this.listeners) f(t, p); }
  toast(text, kind = 'info') { this.toasts.push({ text, kind }); }
  takeToasts() { const t = this.toasts; this.toasts = []; return t; }
  persist() { if (this.run) this.run.rngState = this.rng.getState(); this.save.saveRun(this.run); this.save.saveMeta(this.meta); }
  saveSettings() { this.save.saveSettings(this.G.settings); }
  act(name, fn) {
    let res;
    try { res = fn(); } catch (e) { console.error('[Blades] ' + name, e); res = { ok: false, reason: 'Hata: ' + e.message }; }
    if (res && res.ok !== false) this.persist();
    this.emit('change', name);
    return res || { ok: true };
  }
  hasActiveRun() { return !!(this.run && !this.run.ended); }

  // ——— Yeni run ———
  newRun(seed = null) {
    return this.act('newRun', () => {
      const s = seed || newSeed();
      const run = newRunState(this.meta, s);
      this.G.run = run;
      this.rng = new Rng(Rng.derive(s, 'core').getState());
      run.legsTotal = this.rng.int(CFG.route.legs[0], CFG.route.legs[1]);
      run.hero.hp = heroStats(this.G).maxHp;
      for (const [id, n] of CFG.start.items) for (let i = 0; i < n; i++) addItem(run, id);
      if (hasUpg(this.meta, 'U_READY')) addItem(run, 'C_BANDAGE');
      if (hasUpg(this.meta, 'U_MAPS')) addItem(run, 'Q_MAP');
      const t = makeStartTown(run);
      run.townTypesSeen[t.type] = 1;
      this._enterTown();
      return { ok: true };
    });
  }
  _enterTown() {
    const run = this.run, town = run.towns[run.route[run.idx]];
    run.phase = 'town';
    run.visit = { townId: town.id, stock: shopStock(this.G, town), contracts: this._makeContracts(town), lanes: (town.type === 'capital' && !run.endless) ? [] : makeLanes(this.G, town), sold: {}, bought: {} };
    return town;
  }
  town() { return this.run && this.run.towns[this.run.route[this.run.idx]]; }
  region() { const v = this.run.voyage; return v ? v.region : this.town().region; }
  dRegion() { return diffRegion(this.run, this.region()); }

  // ——— Kasaba hizmetleri ———
  priceBuy(id) {
    const it = ITEMS[id], town = this.town(), T = TOWN_TYPES[town.type];
    let p = it.price * T.buy * (this.run.visit ? this.run.visit.stock.local : 1);
    if (hasUpg(this.meta, 'U_BARGAIN')) p *= 0.92;
    if (this.run.flags.guildFriend) p *= 0.9;
    if (this.run.equip.acc === 'X_BROOCH' && (town.type === 'fort' || town.type === 'capital')) p *= 0.9;
    const c = this.cond(); if (c && c.price) p *= c.price;
    return Math.max(1, Math.round(p));
  }
  priceSell(id) { const it = ITEMS[id]; return Math.max(1, Math.round((it.sell || it.price) * CFG.economy.sellRate)); }
  cond() { return this.run.endless && this.run.endless.cond ? ENDLESS_CONDITIONS[this.run.endless.cond] : null; }
  _townGuard() { if (!this.run || this.run.phase !== 'town' || !this.run.visit) return { ok: false, reason: 'Kasabada değilsin.' }; return null; }
  buy(id) {
    return this.act('buy', () => {
      const g = this._townGuard(); if (g) return g;
      const v = this.run.visit;
      if (![...v.stock.smith, ...v.stock.market].includes(id)) return { ok: false, reason: 'Bu dükkânda yok.' };
      const it = ITEMS[id], price = this.priceBuy(id);
      if (it.slot !== 'bag' && v.bought[id]) return { ok: false, reason: 'Tükendi.' };
      if (this.run.gold < price) return { ok: false, reason: 'Yeterli altının yok.' };
      if (it.kind === 'cons' && countItem(this.run, id) >= CFG.bag.stack * 2) return { ok: false, reason: 'Bundan yeterince var.' };
      const freeStack = it.kind === 'cons' && this.run.bag.some((b) => b.id === id && (b.n || 1) < CFG.bag.stack);
      const freeSlot = it.slot !== 'bag' && !this.run.equip[it.slot];
      if (this.run.bag.length >= CFG.bag.slots && !freeStack && !freeSlot) return { ok: false, reason: 'Çanta dolu.' };
      this.run.gold -= price; addItem(this.run, id); v.bought[id] = (v.bought[id] || 0) + 1;
      return { ok: true, price };
    });
  }
  sell(bagIdx) {
    return this.act('sell', () => {
      const g = this._townGuard(); if (g) return g;
      const b = this.run.bag[bagIdx]; if (!b) return { ok: false, reason: 'Eşya yok.' };
      const p = this.priceSell(b.id);
      removeOne(this.run, b.id); this.run.gold += p;
      return { ok: true, price: p };
    });
  }
  innCost() { const r = this.dRegion(); let c = CFG.economy.innBase + r * 4; const k = this.cond(); if (k && k.inn) c *= k.inn; return Math.round(c); }
  healerCost() { const T = TOWN_TYPES[this.town().type]; let c = (CFG.economy.healerBase + this.dRegion() * 6) * (T.healer || 1); const k = this.cond(); if (k && k.healer) c *= k.healer; return Math.round(c); }
  rest() {
    return this.act('rest', () => {
      const g = this._townGuard(); if (g) return g;
      const st = heroStats(this.G), cost = this.innCost();
      if (this.run.hero.hp >= st.maxHp) return { ok: false, reason: 'Zaten dinçsin.' };
      if (this.run.gold < cost) return { ok: false, reason: 'Yeterli altının yok.' };
      this.run.gold -= cost;
      const heal = Math.round(st.maxHp * (0.55 + (hasUpg(this.meta, 'U_SLEEP') ? 0.15 : 0)));
      const before = this.run.hero.hp; this.run.hero.hp += heal; clampHp(this.G);
      return { ok: true, heal: this.run.hero.hp - before, cost };
    });
  }
  heal() {
    return this.act('heal', () => {
      const g = this._townGuard(); if (g) return g;
      if (!TOWN_TYPES[this.town().type].services.includes('healer')) return { ok: false, reason: 'Burada şifacı yok.' };
      const st = heroStats(this.G), cost = this.healerCost();
      const neg = this.run.hero.buffs.some((b) => Object.entries(b).some(([k, v]) => k !== 'legs' && v < 0));
      if (this.run.hero.hp >= st.maxHp && !neg) return { ok: false, reason: 'Şifaya ihtiyacın yok.' };
      if (this.run.gold < cost) return { ok: false, reason: 'Yeterli altının yok.' };
      this.run.gold -= cost; this.run.hero.hp = st.maxHp;
      this.run.hero.buffs = this.run.hero.buffs.filter((b) => !Object.entries(b).some(([k, v]) => k !== 'legs' && v < 0));
      return { ok: true, cost };
    });
  }
  // ——— Envanter ———
  equip(bagIdx) {
    return this.act('equip', () => {
      const r = this.run, b = r.bag[bagIdx]; if (!b) return { ok: false };
      const it = ITEMS[b.id]; if (it.slot === 'bag') return { ok: false, reason: 'Kuşanılamaz.' };
      const old = r.equip[it.slot]; r.equip[it.slot] = b.id; r.bag.splice(bagIdx, 1);
      if (old) r.bag.splice(bagIdx, 0, { id: old, n: 1 });
      clampHp(this.G);
      return { ok: true };
    });
  }
  unequip(slot) {
    return this.act('unequip', () => {
      const r = this.run, id = r.equip[slot]; if (!id) return { ok: false };
      if (slot === 'weapon') return { ok: false, reason: 'Silahsız yürüyemezsin.' };
      if (r.bag.length >= CFG.bag.slots) return { ok: false, reason: 'Çanta dolu.' };
      r.equip[slot] = null; r.bag.push({ id, n: 1 }); clampHp(this.G);
      return { ok: true };
    });
  }
  useItem(bagIdx) {
    return this.act('useItem', () => {
      const r = this.run, b = r.bag[bagIdx]; if (!b) return { ok: false };
      const it = ITEMS[b.id];
      if (!it.heal) return { ok: false, reason: 'Bu eşya burada kullanılamaz.' };
      if (r.hero.hp >= heroStats(this.G).maxHp) return { ok: false, reason: 'HP zaten dolu.' };
      if (this.run.voyage && this.run.voyage.current) return { ok: false, reason: 'Olay sırasında kullanılamaz.' };
      removeOne(r, b.id);
      const before = r.hero.hp; r.hero.hp += Math.round(it.heal * (hasUpg(this.meta, 'U_HEALER') && b.id.startsWith('C_POTION') ? 1.1 : 1)); clampHp(this.G);
      return { ok: true, heal: r.hero.hp - before };
    });
  }
  drop(bagIdx) { return this.act('drop', () => { const b = this.run.bag[bagIdx]; if (!b) return { ok: false }; this.run.bag.splice(bagIdx, 1); this.run.quick = this.run.quick.filter((q) => hasInBag(this.run, q)); return { ok: true }; }); }
  toggleQuick(id) {
    return this.act('quick', () => {
      const r = this.run; if (!ITEMS[id] || !ITEMS[id].combat) return { ok: false };
      if (r.quick.includes(id)) r.quick = r.quick.filter((q) => q !== id);
      else { if (r.quick.length >= CFG.bag.quick) r.quick.shift(); r.quick.push(id); }
      return { ok: true };
    });
  }
  overflowTake(i, dropIdx) {
    return this.act('overflowTake', () => {
      const r = this.run, id = r.overflow[i]; if (!id) return { ok: false };
      if (dropIdx != null) { if (!r.bag[dropIdx]) return { ok: false }; r.bag.splice(dropIdx, 1); }
      if (r.bag.length >= CFG.bag.slots) return { ok: false, reason: 'Önce bir eşya bırak.' };
      r.overflow.splice(i, 1); r.bag.push({ id, n: 1 });
      if (ITEMS[id].combat && r.quick.length < CFG.bag.quick && !r.quick.includes(id)) r.quick.push(id);
      r.quick = r.quick.filter((q) => hasInBag(r, q));
      return { ok: true };
    });
  }
  overflowDiscard(i) { return this.act('overflowDiscard', () => { this.run.overflow.splice(i, 1); return { ok: true }; }); }

  // ——— Görevler ———
  _makeContracts(town) {
    const run = this.run, rng = Rng.derive(run.seed, 'contracts', town.id), T = TOWN_TYPES[town.type];
    if (town.type === 'capital' && !run.endless) return [];
    const n = rng.int(1, 3), out = [], gm = CFG.regionGoldMult[diffRegion(run, town.region)];
    const types = rng.shuffle(CONTRACT_TYPES.filter((t) => t !== 'special' || T.special));
    if (T.special && !types.slice(0, n).includes('special') && rng.chance(60)) types.unshift('special');
    for (let i = 0; i < n; i++) {
      const type = types[i]; const id = town.id + '_C' + i;
      let c;
      if (type === 'hunt') { const tag = rng.pick(['bandit', 'beast', 'undead']); const need = tag === 'undead' ? 2 : rng.int(2, 4); c = { type, tag, need, have: 0, name: { bandit: 'Haydut Avı', beast: 'Canavar Avı', undead: 'Ölümsüz Avı' }[tag], desc: `${need} ${{ bandit: 'haydut', beast: 'vahşi hayvan', undead: 'ölümsüz' }[tag]} yen.` }; }
      else if (type === 'delivery') { const target = rng.pick(['fort', 'trade', 'monastery', 'mountain', 'city', 'village'].filter((t) => t !== town.type)); c = { type, target, legs: 2, name: 'Teslimat', desc: `Mühürlü paketi ${TOWN_TYPES[target].name} türü bir yerleşime 2 yolculuk içinde götür.` }; }
      else if (type === 'rescue') { const target = rng.pick(RESCUE_TARGETS); c = { type, target, name: 'Kurtarma', desc: `Bir sonraki yolda "${EVENTS[target].t}" olayını başarıyla çöz.` }; }
      else if (type === 'explore') { c = { type, need: 2, have: 0, name: 'Keşif', desc: '2 keşif veya hazine olayını başarıyla tamamla.' }; }
      else if (type === 'escort') { c = { type, legs: 1, name: 'Koruma', desc: 'Bir hacıyı bir sonraki yerleşime kadar koru. Savaştan kaçarsan görev başarısız olur.' }; }
      else { const target = rng.pick(ROYAL_TARGETS); c = { type: 'special', target, name: 'Kraliyet Kontratı', desc: `Bir sonraki yolda "${EVENTS[target].t}" olayını başarıyla çöz. Ödül: kraliyet takdirnamesi.`, royal: 1 }; }
      c.id = id; c.gold = Math.round((type === 'special' ? 45 : type === 'hunt' ? 35 : 28) * gm * rng.range(0.9, 1.2)); c.xp = type === 'special' ? 35 : CFG.xp.quest;
      c.item = rng.chance(30) ? rng.pick(['C_POTION', 'C_FIRE', 'C_SMOKE', 'C_CHARM', 'C_POTION_L']) : null;
      out.push(c);
    }
    return out;
  }
  acceptContract(i) {
    return this.act('accept', () => {
      const g = this._townGuard(); if (g) return g;
      const c = this.run.visit.contracts[i]; if (!c || c.taken) return { ok: false };
      if (this.run.contracts.filter((x) => !x.done && !x.failed).length >= 2) return { ok: false, reason: 'En fazla iki aktif kontrat.' };
      if (this.run.legsTotal - this.run.idx < 1 && !this.run.endless) return { ok: false, reason: 'Başkentte kontrat alınmaz.' };
      const k = { ...c, startIdx: this.run.idx, done: false, failed: false, paid: false };
      if (k.type === 'delivery') addQItem(this.run, 'QI_PARCEL');
      if (k.type === 'rescue' || k.type === 'special') this.run.pendingRoute.push({ id: k.target, src: 'quest', q: k.id });
      if (k.type === 'escort') k.fled = false;
      this.run.contracts.push(k); c.taken = true;
      // teslimat: rotalar yeniden üretilir ki hedef tür ulaşılabilir olsun
      if (k.type === 'delivery') this.run.visit.lanes = makeLanes(this.G, this.town());
      return { ok: true };
    });
  }
  _questProgress(kind, data, lines) {
    for (const c of this.run.contracts) {
      if (c.done || c.failed) continue;
      if (kind === 'kill' && c.type === 'hunt' && data.tags.includes(c.tag)) { c.have = Math.min(c.need, c.have + 1); if (c.have >= c.need) this._completeContract(c, lines); }
      if (kind === 'event' && c.type === 'explore' && data.success && ['explore', 'treasure'].includes(data.cat)) { c.have++; if (c.have >= c.need) this._completeContract(c, lines); }
      if (kind === 'event' && (c.type === 'rescue' || c.type === 'special') && data.id === c.target) { if (data.success) this._completeContract(c, lines); else { c.failed = true; lines.push({ kind: 'quest', text: `Kontrat başarısız: ${c.name}` }); } }
      if (kind === 'flee' && c.type === 'escort') c.fled = true;
    }
  }
  _completeContract(c, lines) {
    if (c.paid) return;
    c.done = true; c.paid = true;
    const r = this.run; r.gold += c.gold; r.stats.goldEarned += c.gold; r.xp += c.xp; r.stats.quests++;
    lines.push({ kind: 'quest', text: `Kontrat tamamlandı: ${c.name} (+${c.gold} altın, +${c.xp} XP)` });
    if (c.item) { const a = addItem(r, c.item); lines.push({ kind: 'item', text: `Ödül: ${ITEMS[c.item].name}${a === 'overflow' ? ' (çanta dolu)' : ''}` }); }
    if (c.royal) { r.flags.royalFavor = 1; lines.push({ kind: 'royal', text: 'Kraliyet takdirnamesi kazandın!' }); }
    if (c.type === 'delivery') removeQItem(r, 'QI_PARCEL');
  }

  // ——— Ayrılış ve yolculuk ———
  depart(laneIdx) {
    return this.act('depart', () => {
      const g = this._townGuard(); if (g) return g;
      const r = this.run, lane = r.visit.lanes[laneIdx];
      if (!lane) return { ok: false, reason: 'Geçersiz yol.' };
      if (r.overflow.length) return { ok: false, reason: 'Önce taşan eşyalara karar ver.' };
      const town = lane.town; r.towns[town.id] = town;
      const rng = Rng.derive(r.seed, 'voyage', r.idx, laneIdx);
      const n = voyageEventCount(rng, lane.distance);
      const queue = Array.from({ length: n }, () => ({ id: null, src: 'random' }));
      for (const p of r.pendingRoute) queue.splice(rng.int(Math.min(1, queue.length), queue.length), 0, { id: p.id, src: p.src, q: p.q });
      r.pendingRoute = [];
      const dur = CFG.voyage.duration[lane.distance];
      r.voyage = { from: r.route[r.idx], toId: town.id, lane: lane.type, distance: lane.distance, region: town.region, tod: lane.tod, danger: lane.danger, queue, pos: 0, elapsed: 0, duration: rng.int(dur[0], dur[1]) + Math.max(0, queue.length - n) * 25, current: null, skip: 0 };
      if (hasInBag(r, 'Q_MAP')) { removeOne(r, 'Q_MAP'); r.voyage.forceCat = 'treasure'; this.toast('Gizemli Harita açıldı: bu yolda bir hazine seni bekliyor.', 'item'); }
      // Geçici etkilerin süresi
      r.hero.buffs = r.hero.buffs.map((b) => ({ ...b, legs: b.legs - 1 })).filter((b) => b.legs >= 0);
      if (r.flags.sight > 0) r.flags.sight--;
      r.visit = null; r.phase = 'voyage';
      return { ok: true };
    });
  }
  host() { const r = this.run; return r ? (r.phase === 'voyage' ? r.voyage : r.phase === 'arrival' ? r.arrival : null) : null; }
  remainingEvents() { const v = this.run.voyage; return v ? v.queue.length - v.pos - (v.current ? 0 : 0) : 0; }
  nextEvent() {
    return this.act('nextEvent', () => {
      const r = this.run, v = r.voyage;
      if (!v || r.phase !== 'voyage') return { ok: false, reason: 'Yolculukta değilsin.' };
      if (v.current) return { ok: true, id: v.current.id, already: true };
      while (v.skip > 0 && v.pos < v.queue.length && !v.queue[v.pos].id) { v.queue.splice(v.pos, 1); v.skip--; }
      if (v.pos >= v.queue.length) return { ok: false, done: true };
      const q = v.queue[v.pos];
      const id = q.id || pickEvent(this.G, this.rng, v);
      v.pos++;
      v.current = { id, src: q.src, q: q.q, result: null, combat: null };
      this._onEventStart(id);
      return { ok: true, id };
    });
  }
  _onEventStart(id) {
    const ev = EVENTS[id], r = this.run;
    if (ev.chain && ev.stage === 1 && !r.chains[ev.chain]) r.chains[ev.chain] = { status: 'active', stage: 1, flags: {}, started: r.idx };
    r.seen[id] = 1; this.meta.codex.events[id] = 1;
  }
  setVoyageElapsed(t, save = false) { const v = this.run && this.run.voyage; if (v) { v.elapsed = Math.max(v.elapsed || 0, t); if (save) this.persist(); } }

  // ——— Seçenek görünümü ———
  optionView(ev, opt) {
    const G = this.G, r = this.run, st = heroStats(G), opens = opensKeys(G), reasons = [];
    const q = opt.req || {};
    const anyItem = (x) => [].concat(x).some((id) => hasItem(r, id));
    if (q.item && !anyItem(q.item)) reasons.push([].concat(q.item).map((i) => ITEMS[i].name).join(' / ') + ' gerekli');
    if (q.opens && !opens.has(q.opens)) reasons.push({ wolf: 'Kurt Dişi Kolyesi', holy: 'Kutsal eşya', royal: 'Kraliyet nişanı', stealth: 'Gizlilik zırhı', mystic: 'Gizemli eşya', chop: 'Balta', stone: 'Dağ Kralının Baltası', dawn: 'Şafak Kılıcı' }[q.opens] + ' gerekli');
    if (q.flag && ![].concat(q.flag).every((f) => r.flags[f])) reasons.push(q.flag === 'royalFavor' ? 'Kraliyet takdirnamesi gerekli' : q.flag === 'royalFriend' || [].concat(q.flag).includes('royalFriend') ? 'Krallığın dostluğu gerekli' : 'Özel koşul gerekli');
    if (q.qitem && !r.qitems[q.qitem]) reasons.push(qitemName(q.qitem) + ' gerekli');
    const cf = ev.chain && r.chains[ev.chain] ? r.chains[ev.chain].flags : {};
    if (q.cf && ![].concat(q.cf).some((f) => cf[f])) reasons.push('Önceki bir seçim gerekli');
    if (q.cfAll && !q.cfAll.every((f) => cf[f])) reasons.push('Önceki aşamalar gerekli');
    if (q.wfam && st.fam !== q.wfam) reasons.push({ spear: 'Mızrak', sword: 'Kılıç', axe: 'Balta' }[q.wfam] + ' gerekli');
    let cost = 0;
    if (opt.cost && opt.cost.gold) {
      let m = CFG.regionGoldMult[this.dRegion()] || 1;
      const c = this.cond(); if (c && c.tax && ev.cat === 'royal') m *= c.tax;
      cost = opt.cost.gold <= 3 ? opt.cost.gold : Math.round(opt.cost.gold * m);
      if (r.gold < cost) reasons.push(`${cost} altın gerekli`);
    }
    let chance = null;
    const bonuses = [];
    if (opt.chk || opt.chance != null) {
      if (opt.chk) {
        const val = { agi: st.agi, atk: st.atk, def: st.def, talk: st.talk }[opt.chk.s] || 0;
        chance = CFG.check.base + (val - opt.chk.dc) * CFG.check.perPoint;
      } else chance = opt.chance;
      for (const b of opt.bonus || []) {
        if ((b.opens && opens.has(b.opens)) || (b.item && hasItem(r, b.item))) { chance += b.add; bonuses.push(b); }
      }
      if (st.luck) chance += st.luck;
      if (ev.cat === 'explore' && hasUpg(this.meta, 'U_EXPLORER')) chance += 8;
      chance = clamp(Math.round(chance), CFG.check.min, CFG.check.max);
    }
    const stat = opt.chk ? { agi: 'Çeviklik', atk: 'Saldırı', def: 'Savunma', talk: 'İkna' }[opt.chk.s] : null;
    let threat = null;
    if (opt.fight) threat = this._threat(opt.fight.foes);
    return { available: !reasons.length, reasons, cost, chance, stat, bonuses, threat };
  }
  _threat(foes) {
    const st = heroStats(this.G), r = this.dRegion();
    const tot = foes.reduce((s, [, id]) => { const E = ENEMIES[id]; return s + E.hp * E.atk * (CFG.regionFoeMult[r] || 1); }, 0);
    const mine = this.run.hero.hp * Math.max(1, st.atk) * 0.8;
    const ratio = tot / mine;
    return ratio < 0.35 ? 'Kolay' : ratio < 0.8 ? 'Orta' : ratio < 1.4 ? 'Zor' : 'Ölümcül';
  }
  options(ev) { return ev.opts.map((o) => ({ opt: o, view: this.optionView(ev, o) })); }

  // ——— Karar ———
  choose(key) {
    return this.act('choose', () => {
      const h = this.host(); if (!h || !h.current) return { ok: false, reason: 'Aktif olay yok.' };
      const cur = h.current; if (cur.result) return { ok: false, reason: 'Bu olay zaten çözüldü.' };
      if (cur.combat) return { ok: false, reason: 'Savaş sürüyor.' };
      const ev = EVENTS[cur.id], opt = ev.opts.find((o) => o.k === key);
      if (!opt) return { ok: false, reason: 'Geçersiz seçenek.' };
      const view = this.optionView(ev, opt);
      if (!view.available) return { ok: false, reason: view.reasons.join(', ') };
      const r = this.run, lines = [];
      if (opt.fight) {
        cur.combat = startCombat(this.G, this.rng, opt.fight.foes, this.dRegion(), { key });
        return { ok: true, combat: true };
      }
      if (view.cost) { r.gold -= view.cost; lines.push({ kind: 'gold', text: `Ödenen: −${view.cost} altın` }); }
      if (opt.consume) {
        const id = [].concat(opt.consume).find((i) => hasInBag(r, i));
        if (id) { removeOne(r, id); lines.push({ kind: 'item', text: `${ITEMS[id].name} kullanıldı.` }); }
      }
      let success = true, roll = null;
      if (view.chance != null) { roll = Math.floor(this.rng.next() * 100); success = roll < view.chance; }
      const out = success ? opt.win : (opt.lose || opt.win);
      this._finishResult(cur, ev, opt, success ? 'win' : 'lose', out, lines, { roll, chance: view.chance });
      return { ok: true, result: cur.result };
    });
  }
  // Savaş eylemi: sonucu belirsiz çatışma; bittiğinde sonuç yalnızca bir kez kesinleşir.
  combatAction(action) {
    return this.act('combat', () => {
      const h = this.host(); const cur = h && h.current;
      if (!cur || !cur.combat) return { ok: false, reason: 'Savaş yok.' };
      if (cur.result) return { ok: false, reason: 'Savaş sonuçlandı.' };
      const res = combatAct(this.G, this.rng, cur.combat, action);
      if (!res.ok) return res;
      const cb = cur.combat;
      // ölen düşmanlar için ödül/görev ilerlemesi (bir kez)
      const lines = cb.lines || (cb.lines = []);
      for (const f of cb.foes) if (f.dead && !f.counted) {
        f.counted = true; const E = ENEMIES[f.id];
        this.run.stats.kills++;
        this.run.xp += Math.round(E.xp * (this.run.endless ? 1.3 : 1));
        const g = Math.round(this.rng.int(E.gold[0], E.gold[1]) * (CFG.regionGoldMult[cb.region] || 1) * (this.run.flags.bountyEdict && E.tags.includes('bandit') ? 1.5 : 1));
        if (g) { this.run.gold += g; this.run.stats.goldEarned += g; lines.push({ kind: 'gold', text: `${E.name}: +${g} altın` }); }
        this._questProgress('kill', { tags: E.tags }, lines);
      }
      if (cb.over) this._finishCombat(cur);
      return { ok: true, beats: res.beats, over: cb.over };
    });
  }
  _finishCombat(cur) {
    if (cur.result) return;
    const ev = EVENTS[cur.id], cb = cur.combat, opt = ev.opts.find((o) => o.k === cb.key);
    const lines = (cb.lines || []).slice();
    const outcome = cb.over === 'win' ? 'win' : cb.over === 'flee' ? 'flee' : 'lose';
    let out = outcome === 'win' ? opt.win : outcome === 'flee' ? ((opt.fight && opt.fight.flee) || { t: 'Savaştan kaçtın; düşmanlar arkanda kaldı.', fx: {} }) : (opt.lose || { t: 'Savaşta düştün.' });
    if (outcome === 'flee') this._questProgress('flee', {}, lines);
    this._finishResult(cur, ev, opt, outcome, out, lines, { combat: true });
  }
  _finishResult(cur, ev, opt, outcome, out, lines, extra = {}) {
    const r = this.run, success = outcome === 'win';
    const ctx = { ev, opt, success };
    lines.push(...this.applyFx(out.fx || {}, ctx, cur));
    if (success && !(opt.tags || []).includes('pass') && ev.cat !== 'special') { r.xp += CFG.xp.eventSuccess; lines.push({ kind: 'xp', text: `Olay başarıyla çözüldü: +${CFG.xp.eventSuccess} XP` }); }
    r.stats.events++;
    // zincir ilerlemesi
    if (ev.chain) this._chainAdvance(ev, opt, outcome, lines);
    this._questProgress('event', { id: ev.id, cat: ev.cat, success }, lines);
    clampHp(this.G);
    const dead = r.hero.hp <= 0;
    cur.result = { key: opt.k, label: opt.l, outcome, success, text: out.t || '', lines, dead, ...extra };
    cur.combat = cur.combat ? { ...cur.combat, over: cur.combat.over || outcome } : null;
  }
  _chainAdvance(ev, opt, outcome, lines) {
    const r = this.run, ch = r.chains[ev.chain] || (r.chains[ev.chain] = { status: 'active', stage: ev.stage, flags: {} });
    if (ch.status !== 'active') return;
    if (outcome === 'lose' && opt.fight) return; // ölüm
    const mode = opt.ch || (ev.last ? 'end' : 'next');
    ch.stage = ev.stage;
    if (mode === 'fail') { ch.status = 'failed'; lines.push({ kind: 'chain', text: `Hikâye sona erdi: ${CHAINS[ev.chain].name}` }); return; }
    if (mode === 'end') {
      ch.status = 'done';
      if (!ch.rewarded) { ch.rewarded = true; r.xp += CFG.xp.chainEnd; r.stats.chainsDone++; this.meta.codex.chains[ev.chain] = 1; lines.push({ kind: 'chain', text: `Hikâye tamamlandı: ${CHAINS[ev.chain].name} (+${CFG.xp.chainEnd} XP)` }); }
      return;
    }
    const nextId = CHAINS[ev.chain].stages[ev.stage];
    const next = EVENTS[nextId];
    if (next.where === 'town') r.pendingArrival.push({ id: nextId, src: 'chain' }); else r.pendingRoute.push({ id: nextId, src: 'chain' });
    lines.push({ kind: 'chain', text: `Hikâye ilerliyor: ${CHAINS[ev.chain].name} — sıradaki: ${next.where === 'town' ? 'bir sonraki kasabada' : 'bir sonraki yolculukta'}` });
  }
  pickLoot(kind) {
    const tier = Math.min(5, this.dRegion() + (this.run.voyage && LANE_TYPES[this.run.voyage.lane].rare ? 1 : 0));
    const rareBoost = hasUpg(this.meta, 'U_HUNTER') ? 1.5 : 1;
    let pool = Object.values(ITEMS).filter((i) => i.tier <= Math.max(tier, 1) && i.slot !== 'bag' || i.kind === 'cons');
    if (kind === 'weapon' || kind === 'armor' || kind === 'acc') pool = Object.values(ITEMS).filter((i) => i.slot === kind && i.tier <= tier + 1 && i.rarity !== 'legendary');
    else if (kind === 'cons') pool = Object.values(ITEMS).filter((i) => i.kind === 'cons' && i.tier <= tier + 1);
    else if (kind === 'rare') pool = Object.values(ITEMS).filter((i) => (i.rarity === 'rare' || (i.rarity === 'legendary' && tier >= 4)) && i.slot !== 'bag');
    else pool = Object.values(ITEMS).filter((i) => i.tier <= tier && i.rarity !== 'legendary' && i.kind !== 'special');
    const w = (i) => ({ common: 10, uncommon: 6, rare: 3 * rareBoost, legendary: 0.8 * rareBoost }[i.rarity] || 1);
    return (this.rng.weighted(pool, w) || ITEMS.C_POTION).id;
  }
  applyFx(fx, ctx, cur) {
    const r = this.run, lines = [], reg = this.dRegion(), c = this.cond();
    const give = (id) => { const a = addItem(r, id); const it = ITEMS[id]; lines.push({ kind: 'item', text: `${a === 'overflow' ? 'Çanta dolu! ' : 'Kazanılan: '}${it.name}`, rarity: it.rarity, overflow: a === 'overflow' }); };
    if (fx.hp) {
      if (fx.hp < 0) {
        let dmg = Math.round(-fx.hp * (CFG.regionDmgMult[reg] || 1) * (r.endless ? 1 + Math.min(r.endless.stage, 8) * 0.06 : 1));
        if (hasUpg(this.meta, 'U_SENSE') && !r.senseUsed) { r.senseUsed = true; lines.push({ kind: 'info', text: 'Tehlike Sezgisi: hasarı tamamen önledin!' }); dmg = 0; }
        if (dmg) { r.hero.hp -= dmg; lines.push({ kind: 'hp', text: `−${dmg} HP` }); }
      } else { const b = r.hero.hp; r.hero.hp += fx.hp; clampHp(this.G); lines.push({ kind: 'heal', text: `+${r.hero.hp - b} HP` }); }
    }
    if (fx.hpPct) { const b = r.hero.hp; r.hero.hp += Math.round(heroStats(this.G).maxHp * fx.hpPct); clampHp(this.G); if (r.hero.hp > b) lines.push({ kind: 'heal', text: `+${r.hero.hp - b} HP` }); }
    if (fx.gold) {
      let g = Array.isArray(fx.gold) ? this.rng.int(fx.gold[0], fx.gold[1]) : fx.gold;
      if (g > 0) { g = Math.round(g * (CFG.regionGoldMult[reg] || 1) * ((c && c.gold) || 1)); r.gold += g; r.stats.goldEarned += g; lines.push({ kind: 'gold', text: `+${g} altın` }); }
      else { const l = Math.min(r.gold, -g); r.gold -= l; if (l) lines.push({ kind: 'gold', text: `−${l} altın` }); }
    }
    if (fx.goldPct) { const l = Math.round(r.gold * -fx.goldPct); r.gold -= l; if (l) lines.push({ kind: 'gold', text: `−${l} altın` }); }
    if (fx.xp) { r.xp += fx.xp; lines.push({ kind: 'xp', text: `+${fx.xp} XP` }); }
    if (fx.item) give(Array.isArray(fx.item) ? this.rng.pick(fx.item) : fx.item);
    if (fx.loot) give(this.pickLoot(fx.loot));
    if (fx.forge) { const fam = heroStats(this.G).fam; give({ sword: 'W_SWORD_3', axe: 'W_AXE_3', spear: 'W_SPEAR_3' }[fam]); }
    if (fx.lose) {
      let id = fx.lose;
      if (id === 'cons') { const cons = r.bag.filter((b) => ITEMS[b.id].kind === 'cons'); id = cons.length ? this.rng.pick(cons).id : null; }
      if (id && removeOne(r, id)) lines.push({ kind: 'item', text: `Kaybedilen: ${ITEMS[id].name}` });
    }
    if (fx.qitem) { addQItem(r, fx.qitem); lines.push({ kind: 'quest', text: `Görev eşyası: ${qitemName(fx.qitem)}` }); }
    if (fx.qitemLose && removeQItem(r, fx.qitemLose)) lines.push({ kind: 'quest', text: `Teslim edildi: ${qitemName(fx.qitemLose)}` });
    if (fx.buff) { r.hero.buffs.push({ ...fx.buff }); lines.push({ kind: fx.buff.atk < 0 || fx.buff.luck < 0 || fx.buff.agi < 0 ? 'bad' : 'buff', text: buffText(fx.buff) }); }
    for (const p of [fx.perm, fx.perm2]) if (p) {
      for (const [k, v] of Object.entries(p)) { r.hero.perm[k] = (r.hero.perm[k] || 0) + v; if (k === 'maxHp' && v > 0) r.hero.hp += v; }
      clampHp(this.G); lines.push({ kind: Object.values(p).some((v) => v < 0) ? 'bad' : 'perm', text: 'Kalıcı: ' + Object.entries(p).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${STAT_NAMES[k]}`).join(', ') });
    }
    for (const f of [].concat(fx.flag || [])) { r.flags[f] = 1; if (f === 'royalFavor') lines.push({ kind: 'royal', text: 'Kraliyet takdirnamesi kazandın!' }); if (f === 'royalFriend') lines.push({ kind: 'royal', text: 'Krallığın dostu oldun.' }); }
    if (fx.unflag) delete r.flags[fx.unflag];
    if (fx.skipNext && r.voyage) { r.voyage.skip += fx.skipNext; r.voyage.duration = Math.max(r.voyage.elapsed + 30, r.voyage.duration - 25); lines.push({ kind: 'info', text: 'Kısayol: yolculuk kısaldı.' }); }
    if (fx.extra && r.voyage) { r.voyage.queue.push({ id: null, src: 'random' }); r.voyage.duration += 25; lines.push({ kind: 'info', text: 'Yol uzadı: bir olay daha.' }); }
    if (fx.sight) { r.flags.sight = Math.max(r.flags.sight || 0, fx.sight); lines.push({ kind: 'info', text: 'Rotaların tehlikesini görebiliyorsun.' }); }
    if (fx.shop && cur) {
      const rng = this.rng, pool = Object.values(ITEMS).filter((i) => i.slot !== 'bag' ? i.rarity !== 'common' && i.rarity !== 'legendary' : i.kind === 'cons' && i.rarity !== 'common');
      cur.shop = rng.sample(pool, 3).map((i) => ({ id: i.id, price: Math.round(i.price * 0.85), sold: false }));
      lines.push({ kind: 'info', text: 'Gezgin tüccar mallarını sergiliyor.' });
    }
    if (fx.cf && ctx.ev.chain) { const ch = r.chains[ctx.ev.chain]; if (ch) Object.assign(ch.flags, fx.cf); }
    if (fx.capital && !r.capitalWon) { r.capitalWon = true; r.xp += CFG.xp.capital; this.meta.wins++; lines.push({ kind: 'royal', text: `Kraliyet Sınavı geçildi! +${CFG.xp.capital} XP` }); }
    return lines;
  }
  eventShopBuy(i) {
    return this.act('eventShop', () => {
      const h = this.host(), cur = h && h.current; if (!cur || !cur.shop) return { ok: false };
      const s = cur.shop[i]; if (!s || s.sold) return { ok: false };
      if (this.run.gold < s.price) return { ok: false, reason: 'Yeterli altının yok.' };
      this.run.gold -= s.price; s.sold = true; const a = addItem(this.run, s.id);
      return { ok: true, overflow: a === 'overflow' };
    });
  }
  continueEvent() {
    return this.act('continueEvent', () => {
      const r = this.run, h = this.host();
      if (!h || !h.current || !h.current.result) return { ok: false, reason: 'Kapatılacak sonuç yok.' };
      const id = h.current.id;
      r.recent.push(id); if (r.recent.length > 30) r.recent.shift();
      h.current = null;
      if (r.hero.hp <= 0) return this._endRun(r.endless ? 'endless_dead' : 'dead');
      if (r.phase === 'arrival') { h.pos++; if (h.pos >= h.queue.length) this._afterArrival(); }
      return { ok: true };
    });
  }

  // ——— Varış ———
  finishRoute() {
    return this.act('finishRoute', () => {
      const r = this.run, v = r.voyage;
      if (!v || r.phase !== 'voyage') return { ok: false };
      if (v.current) return { ok: false, reason: 'Olay bitmedi.' };
      const lines = [];
      r.idx++; r.route[r.idx] = v.toId; r.route.length = r.idx + 1; r.voyage = null;
      const town = r.towns[v.toId];
      r.stats.towns++;
      r.xp += CFG.xp.arrival; lines.push({ kind: 'xp', text: `${town.name}'e varış: +${CFG.xp.arrival} XP` });
      if (!r.townTypesSeen[town.type]) { r.townTypesSeen[town.type] = 1; r.xp += CFG.xp.newTownType; lines.push({ kind: 'xp', text: `Yeni yerleşim türü (${TOWN_TYPES[town.type].name}): +${CFG.xp.newTownType} XP` }); }
      // görevler: teslimat ve koruma
      for (const c of r.contracts) {
        if (c.done || c.failed) continue;
        if (c.type === 'delivery') { if (town.type === c.target) this._completeContract(c, lines); else if (r.idx - c.startIdx >= c.legs) { c.failed = true; removeQItem(r, 'QI_PARCEL'); lines.push({ kind: 'quest', text: `Teslimat süresi doldu: ${c.name}` }); } }
        if (c.type === 'escort') { if (c.fled) { c.failed = true; lines.push({ kind: 'quest', text: 'Koruma görevi başarısız: hacı kaçarken kayboldu.' }); } else this._completeContract(c, lines); }
        if ((c.type === 'rescue' || c.type === 'special') && r.idx - c.startIdx >= 2 && !c.done) { c.failed = true; lines.push({ kind: 'quest', text: `Kontrat zaman aşımına uğradı: ${c.name}` }); }
      }
      // Sonsuz Macera aşama sistemi
      if (r.endless) {
        r.endless.since++;
        if (r.endless.since >= CFG.endless.stageEvery) {
          r.endless.since = 0; r.endless.stage++;
          const conds = Object.keys(ENDLESS_CONDITIONS).filter((k) => k !== r.endless.cond);
          r.endless.cond = this.rng.pick(conds);
          if (!r.endless.rewarded[r.endless.stage]) { r.endless.rewarded[r.endless.stage] = 1; r.xp += CFG.xp.endlessStage; }
          lines.push({ kind: 'royal', text: `Sonsuz Macera Aşama ${r.endless.stage}: ${ENDLESS_CONDITIONS[r.endless.cond].name} (+${CFG.xp.endlessStage} XP)` });
          this.meta.records.maxEndless = Math.max(this.meta.records.maxEndless, r.endless.stage);
        }
      }
      const queue = r.pendingArrival.slice(); r.pendingArrival = [];
      r.arrival = { townId: town.id, report: lines, queue, pos: 0, current: null };
      r.phase = 'arrival';
      if (!queue.length) this._afterArrival();
      return { ok: true, town: town.id };
    });
  }
  arrivalNext() {
    return this.act('arrivalNext', () => {
      const r = this.run, a = r.arrival; if (!a || r.phase !== 'arrival') return { ok: false };
      if (a.current) return { ok: true, id: a.current.id, already: true };
      if (a.pos >= a.queue.length) { this._afterArrival(); return { ok: false, done: true }; }
      const q = a.queue[a.pos];
      a.current = { id: q.id, src: q.src, result: null, combat: null };
      this._onEventStart(q.id);
      return { ok: true, id: q.id };
    });
  }
  _afterArrival() {
    const r = this.run;
    const report = r.arrival ? r.arrival.report : [];
    r.arrival = null;
    this._enterTown();
    r.visit.report = report;
  }
  // Başkent: Kraliyet Sınavı
  startTrial() {
    return this.act('trial', () => {
      const g = this._townGuard(); if (g) return g;
      const r = this.run; if (this.town().type !== 'capital' || r.capitalWon) return { ok: false, reason: 'Sınav burada değil.' };
      if (r.overflow.length) return { ok: false, reason: 'Önce taşan eşyalara karar ver.' };
      r.arrival = { townId: this.town().id, report: [], queue: [{ id: 'EV_FINAL', src: 'final' }], pos: 0, current: null };
      r.phase = 'arrival'; r.visit = null;
      return { ok: true };
    });
  }
  completeRun() { return this.act('complete', () => { if (!this.run.capitalWon) return { ok: false }; return this._endRun('complete'); }); }
  enterEndless() {
    return this.act('endless', () => {
      const r = this.run; if (!r.capitalWon || r.endless) return { ok: false };
      r.endless = { stage: 0, cond: null, since: 0, rewarded: {} };
      r.visit.lanes = makeLanes(this.G, this.town());
      this.toast('Sonsuz Macera başladı! Her dört yerleşimde zorluk artar.', 'royal');
      return { ok: true };
    });
  }
  retire() { return this.act('retire', () => { const g = this._townGuard(); if (g) return g; return this._endRun(this.run.endless ? 'endless_retire' : 'retire'); }); }
  _endRun(reason) {
    const r = this.run, m = this.meta;
    if (r.ended) return { ok: true, ended: true };
    const score = r.stats.towns * 20 + r.stats.kills * 5 + r.stats.quests * 30 + r.stats.chainsDone * 50 + Math.round(r.stats.goldEarned / 10) + (r.endless ? r.endless.stage * 100 : 0) + (r.capitalWon ? 200 : 0);
    r.ended = { reason, score, at: Date.now(), towns: r.stats.towns, kills: r.stats.kills, quests: r.stats.quests, chains: r.stats.chainsDone, xp: r.xp, endlessStage: r.endless ? r.endless.stage : null };
    r.phase = 'ended'; r.voyage = null; r.visit = null; r.arrival = null;
    if (!r.xpBanked) {
      r.xpBanked = true; m.xp += r.xp; m.xpTotal += r.xp; m.runs++;
      if (reason.includes('dead')) m.deaths++;
      const rec = m.records;
      rec.maxTowns = Math.max(rec.maxTowns, r.stats.towns); rec.kills = Math.max(rec.kills, r.stats.kills); rec.quests = Math.max(rec.quests, r.stats.quests);
      rec.score = Math.max(rec.score, score); rec.chains = Math.max(rec.chains, r.stats.chainsDone);
      if (r.endless) rec.maxEndless = Math.max(rec.maxEndless, r.endless.stage);
    }
    return { ok: true, ended: true };
  }
  dismissSummary() { return this.act('dismiss', () => { if (this.run && this.run.ended) { this.G.run = null; this.save.saveRun(null); } return { ok: true }; }); }
  abandonRun() { return this.act('abandon', () => { if (this.run && !this.run.ended) this._endRun('retire'); return { ok: true }; }); }

  // ——— Kalıcı gelişim ———
  canBuyUpgrade(id) {
    const u = UPG[id]; if (!u || this.meta.upgrades[id]) return false;
    const prev = UPGRADES.find((x) => x.branch === u.branch && x.idx === u.idx - 1);
    return (!prev || this.meta.upgrades[prev.id]) && this.meta.xp >= u.cost;
  }
  buyUpgrade(id) {
    return this.act('upgrade', () => {
      if (this.hasActiveRun()) return { ok: false, reason: 'Geliştirmeler run aralarında alınır.' };
      if (!this.canBuyUpgrade(id)) return { ok: false, reason: 'Açılamaz.' };
      this.meta.xp -= UPG[id].cost; this.meta.upgrades[id] = 1; return { ok: true };
    });
  }
  exportSave() { return this.save.exportString(this.meta, this.run, this.G.settings); }
  importSave(text) {
    const p = this.save.parseImport(text); if (!p.ok) return p;
    this.G.meta = p.meta; this.G.run = p.run; if (p.settings) this.G.settings = { ...this.G.settings, ...p.settings };
    this.rng = new Rng(this.run ? this.run.rngState || 1 : 1);
    this.persist(); this.saveSettings(); this.emit('change', 'import');
    return { ok: true };
  }
  resetAll() { this.save.wipeAll(); this.G.meta = newMeta(); this.G.run = null; this.G.settings = defaultSettings(); this.emit('change', 'reset'); return { ok: true }; }
  fleeChance() { const h = this.host(); return h && h.current && h.current.combat ? fleeChance(this.G, h.current.combat) : 0; }
}
export const STAT_NAMES = { atk: 'Saldırı', def: 'Savunma', agi: 'Çeviklik', maxHp: 'Maks. HP', luck: 'Şans' };
export function buffText(b) { return Object.entries(b).filter(([k]) => k !== 'legs').map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${STAT_NAMES[k]}`).join(', ') + ` (${b.legs} yolculuk)`; }
