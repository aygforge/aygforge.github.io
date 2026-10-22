// Arayüz komutları: her komut yetkili sistemi çağırır, sonucu bildirir, statları yeniler ve kaydeder.
// Arayüz hiçbir değeri kendi hesaplamaz.
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import * as inv from '../systems/inventory.js';
import * as eco from '../systems/economy.js';
import * as chr from '../systems/character.js';
import * as qs from '../systems/quests.js';
import { WAYSTONES } from '../data/maps/index.js';
import { ITEMS } from '../data/items.js';
import { STACKABLES } from '../data/materials.js';
import { sound } from '../audio/sound.js';

function result(r, { okText, okSound = 'click', what = 'inventory', critical = true, failSound = 'error' } = {}) {
  if (r && r.ok) {
    if (okText) bus.emit('toast', { text: typeof okText === 'function' ? okText(r) : okText, kind: 'ok' });
    if (okSound) sound.play(okSound);
    app.changed(what);
    app.requestSave(what, critical);
  } else if (r) {
    bus.emit('toast', { text: r.msg || 'Yapılamadı', kind: 'warn' });
    if (failSound) sound.play(failSound);
  }
  return r;
}

// Görev ilerleme bildirimleri (questProgress) + kayıt
function questUpdates(ups) {
  if (!ups?.length) return;
  for (const u of ups) { bus.emit('questProgress', u); if (u.say) bus.emit('toast', { text: u.say, kind: 'info' }); }
  sound.play('quest');
  app.changed('quest');
  app.requestSave('quest', true);
}
export { questUpdates };

export const act = {
  equip(index) { return result(inv.equipFromBag(app.char, index), { okSound: 'click', what: 'equip' }); },
  unequip(slot) { return result(inv.unequip(app.char, slot), { what: 'equip' }); },
  lock(uid) { return result(inv.toggleLock(app.char, uid), { okText: (r) => (r.lock ? 'Eşya kilitlendi' : 'Kilit açıldı'), what: 'inventory', critical: false }); },
  sort() { return result({ ok: inv.sortContainer(app.char.bag) }, { okText: 'Çanta sıralandı', critical: false }); },
  claimPending() {
    const n = inv.claimPending(app.char);
    return result(n ? { ok: true, n } : { ok: false, msg: 'Çantada yer yok' }, { okText: (r) => `${r.n} eşya çantaya alındı` });
  },
  sell(index) {
    const it = app.char.bag.slots[index];
    const name = it ? (ITEMS[it.tid]?.name || STACKABLES[it.tid]?.name) : '';
    return result(eco.sellFromBag(app.char, index), { okText: (r) => `${name} satıldı: +${r.price} Gold`, okSound: 'coin' });
  },
  dismantle(index) {
    return result(eco.dismantle(app.char, index, app.rng), { okText: (r) => `Parçalandı: ${r.out.map((o) => `${STACKABLES[o.id].name} ×${o.qty}`).join(', ')}`, okSound: 'anvil' });
  },
  buyEquip(tid) { return result(eco.buyEquipment(app.char, tid), { okText: (r) => `${ITEMS[tid].name} alındı (−${r.price} G)`, okSound: 'coin' }); },
  buyPotion(tid, qty) { return result(eco.buyPotion(app.char, tid, qty), { okText: (r) => `Satın alındı (−${r.cost} G)`, okSound: 'coin' }); },
  buySupply(tid, qty, price) { return result(eco.buyStack(app.char, tid, qty, price), { okText: (r) => `${STACKABLES[tid].name} ×${qty} (−${r.cost} G)`, okSound: 'coin' }); },
  buyBottle(qty) { return result(eco.buyBottle(app.char, qty), { okText: (r) => `Boş Şişe ×${qty} (−${r.cost} G)`, okSound: 'coin' }); },
  craft(id) {
    const r = result(eco.craft(app.char, id, app.rng), { okText: (r) => (r.inst ? `Üretildi: ${ITEMS[r.inst.tid].name}` : `Üretildi: ${STACKABLES[r.out.id].name} ×${r.out.qty}`), okSound: 'anvil' });
    // V3: üretim görevleri yalnız gerçek üretimde ilerler
    if (r.ok) questUpdates(qs.onCraft(app.char, id, r.inst ? r.inst.tid : r.out.id, r.inst ? 1 : r.out.qty));
    return r;
  },
  // V3: NPC ile konuşma ('visit' hedefleri: mesaj/paket teslimi)
  talk(npcId) { questUpdates(qs.onTalk(app.char, npcId)); },
  track(id) { return result(qs.toggleTrack(app.char, id), { okText: (r) => (r.tracked ? 'Görev HUD\'da takip ediliyor' : 'Takip bırakıldı'), what: 'quest', critical: false }); },
  upgrade(loc) {
    const r = eco.upgrade(app.char, loc, app.rng);
    if (r.ok) {
      sound.play(r.success ? 'up_ok' : 'up_fail');
      bus.emit('toast', { text: r.success ? `Yükseltme başarılı! +${r.plus}` : `Yükseltme başarısız. Eşya korundu (+${r.plus}).`, kind: r.success ? 'level' : 'warn' });
      if (r.success) app.char.record.upgrades++;
      app.changed('upgrade');
      app.requestSave('upgrade', true);
    } else result(r);
    return r;
  },
  repair() { return result(eco.repairAll(app.char), { okText: (r) => `Ekipman tamir edildi (−${r.cost} G)`, okSound: 'anvil', what: 'repair' }); },
  expandBag() { return result(eco.expandBag(app.char), { okText: (r) => `Çanta ${r.size} slota genişledi`, okSound: 'coin' }); },
  expandStorage() { return result(eco.expandStorage(app.char, app.profile.storage), { okText: 'Depo 90 slota genişledi', okSound: 'coin' }); },
  deposit(index) { return result(inv.moveBetween(app.char.bag, index, app.profile.storage), { okSound: 'click' }); },
  withdraw(index) { return result(inv.moveBetween(app.profile.storage, index, app.char.bag), { okSound: 'click' }); },
  sortStorage() { return result({ ok: inv.sortContainer(app.profile.storage) }, { okText: 'Depo sıralandı', critical: false }); },
  moveSlot(from, to) { return result(inv.moveSlot(app.char.bag, from, to), { what: 'inventory', critical: false, failSound: null }); },
  allocate(add) { return result(chr.allocateStats(app.char, add), { okText: 'Stat puanları dağıtıldı', what: 'stats' }); },
  setSkillBar(slot, id) { return result(chr.setSkillBar(app.char, slot, id), { okText: 'Beceri çubuğu güncellendi', what: 'stats' }); },
  applyBook(id) { return result(chr.applyMasteryBook(app.char, id), { okText: (r) => `Ustalık Kitabı uygulandı: ${r.book.name}`, okSound: 'buff', what: 'stats' }); },
  rankUp(id) { return result(chr.rankUp(app.char, id), { okText: (r) => `Rank ${r.rank}`, okSound: 'buff', what: 'stats' }); },
  resetSkills() { return result(chr.resetSkills(app.char), { okText: (r) => `Beceriler sıfırlandı${r.cost ? ` (−${r.cost} G)` : ''}`, what: 'stats' }); },
  resetStats() { return result(chr.resetStats(app.char), { okText: (r) => `Statlar sıfırlandı: ${r.free} puan dağıtılabilir${r.cost ? ` (−${r.cost.toLocaleString('tr-TR')} G)` : ' (ücretsiz)'}`, what: 'stats' }); },
  acceptQuest(id) {
    const r = qs.acceptQuest(app.char, id);
    if (r.ok) { app.char.tracked = id; for (const g of r.q.giveOnAccept || []) bus.emit('loot', { name: STACKABLES[g.id].name, qty: g.qty, icon: g.id, r: 'U' }); sound.play('click'); bus.emit('toast', { text: `Görev alındı: ${r.q.name}`, kind: 'ok' }); app.changed('quest'); app.requestSave('quest', true); }
    else result(r);
    return r;
  },
  turnIn(id, npc) {
    const r = qs.turnInQuest(app.char, id, npc);
    if (r.ok) {
      sound.play('quest');
      bus.emit('toast', { text: `Görev tamamlandı: ${r.q.name} (+${r.exp} EXP, +${r.gold} Gold)`, kind: 'level' });
      if (r.q.title) bus.emit('toast', { text: `Unvan kazanıldı: ${r.q.title}`, kind: 'elite' });
      if (r.q.mastery) bus.emit('toast', { text: 'Ustalık I açıldı!', kind: 'elite' });
      if (r.q.mastery2) bus.emit('toast', { text: 'Ustalık II açıldı!', kind: 'elite' });
      if (r.q.skillPoint) bus.emit('toast', { text: '+1 beceri puanı', kind: 'level' });
      for (const ev of r.levelEvents) app.world?.onLevelUp(ev);
      if (app.char.tracked === id) app.char.tracked = null;
      app.char.tracking = (app.char.tracking || []).filter((x) => x !== id);
      app.changed('quest');
      app.requestSave('questDone', true);
      if (r.q.id === 'm18') bus.emit('storyComplete');
    } else result(r);
    return r;
  },
  abandon(id) { return result(qs.abandonQuest(app.char, id), { okText: 'Görev bırakıldı', what: 'quest' }); },
  acceptContract(enemy) { return result(qs.acceptContract(app.char, enemy), { okText: 'Av sözleşmesi alındı', what: 'quest' }); },
  claimContract() {
    const r = qs.claimContract(app.char);
    if (r.ok) {
      sound.play('quest');
      bus.emit('toast', { text: `Sözleşme tamamlandı (+${r.exp} EXP, +${r.gold} Gold)`, kind: 'level' });
      for (const ev of r.levelEvents) app.world?.onLevelUp(ev);
      app.changed('quest'); app.requestSave('contract', true);
    } else result(r);
    return r;
  },
  cancelContract() { return result(qs.cancelContract(app.char), { okText: 'Sözleşme iptal edildi', what: 'quest' }); },
  travel(wsId) {
    const ws = WAYSTONES[wsId];
    const ch = app.char;
    if (!ch.world.waystones.includes(wsId)) return result({ ok: false, msg: 'Bu Yol Taşı henüz keşfedilmedi' });
    if (ch.gold < ws.cost) return result({ ok: false, msg: `${ws.cost} Gold gerekli` });
    ch.gold -= ws.cost;
    sound.play('portal');
    app.changed('inventory');
    bus.emit('closePanels');
    app.world.travelTo(ws.map);
    return { ok: true };
  },
};
