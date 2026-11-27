// MenuScene — minimal restoran ana ekranı: OYNA (sıradaki level), LEVEL SEÇ, GELİŞTİR, MAĞAZA, AYARLAR, enerji.
import Phaser from 'phaser';
import { app } from '../game/AppState.js';
import { CHAPTERS, UPGRADES, RECIPE_LABELS, MAX_UPGRADE_LEVEL } from '../data/content.js';
import { purchaseUpgrade, upgradeCost, upgradeValue, isUnlocked, currentLevel, stageState, isStageUnlocked, chefPower } from '../systems/Progression.js';
import { findChapter, stageByLevel, LEVEL_COUNT } from '../data/stages.js';
import { tickEnergy, msToNextPoint, msToUtcReset, adRefillsLeft, applyAdRefill, ENERGY } from '../systems/EnergyService.js';
import { launchLevel, launchDungeon } from '../game/StageLauncher.js';
import { DUNGEONS, stageByLevel as _stage } from '../data/stages.js';
import { t, chapterName } from '../i18n.js';
import { EQUIP, SLOT_LABEL, RARITY_LABEL, RARITY_COLOR, EFFECT_TEXT, ENHANCE_TEXT, craftInfo, craft, enhanceInfo, enhance } from '../systems/Equipment.js';
import { isDungeonUnlocked, dungeonFullLeft } from '../systems/Progression.js';
import { scaledDungeonReward, BOSS_KITCHEN, TOWER, utcWeek, bossKitchenPool, towerNextBlock, questList, claimQuest } from '../systems/V1Modes.js';
import { adService } from '../platform/AdService.js';
import { consumeAdReward, applyPurchase, restorePurchases, hasEntitlement } from '../systems/Monetization.js';
import { setLanguage, getLanguage } from '../i18n.js';
import { purchaseService } from '../platform/PurchaseService.js';
import { audio } from '../platform/AudioService.js';
import { lifecycle } from '../platform/Lifecycle.js';
import { text, panel, button, blocker, COLORS } from '../ui/widgets.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.W = W;
    this.H = H;
    this.overlay = null;
    const off = H - 960;
    this.add.rectangle(0, 0, W, Math.max(0, off) + 2, 0xc8693f).setOrigin(0);
    this.add.image(0, off, 'restaurant_bg').setOrigin(0).setScale(3);
    // sign
    text(this, W / 2, off + 75, 'KEPÇE USTASI', 34, COLORS.gold, { strokeThickness: 6 });
    // chef behind the counter
    const chef = this.add.image(W / 2, off + 602, 'chef').setOrigin(0.5, 1).setScale(5);
    if (!app.save.settings.lowMotion) this.tweens.add({ targets: chef, y: chef.y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.image(W / 2 + 120, off + 600, 'dish_menemen').setOrigin(0.5, 1).setScale(3);
    this.add.image(W / 2 - 120, off + 600, 'dish_fries').setOrigin(0.5, 1).setScale(2.4);

    // tip counter
    panel(this, 14, 14, 150, 44);
    this.add.image(38, 36, 'coin').setScale(2.6);
    this.tipText = text(this, 60, 36, String(app.save.tips), 24, COLORS.gold, { ox: 0 });
    button(this, W - 70, 36, 112, 46, t('menu.settings'), () => this.openSettings(), { size: 18, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 });
    // energy indicator (ticks every second; offline regeneration is applied on open)
    panel(this, 176, 14, 230, 44);
    this.energyText = text(this, 192, 36, '', 20, '#9ef0ff', { ox: 0 });
    this.refreshEnergy();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshEnergy() });

    // main actions
    let run = app.save.activeRun;
    // V1.0: a half-run whose encounter no longer exists is closed safely and its entry energy is refunded (never silent loss)
    if (run && !findChapter(run.chapterId)) {
      app.save.energy.value = Math.min(ENERGY.max, app.save.energy.value + 5);
      app.save.activeRun = null;
      app.persist();
      app.notice = 'Eski yarım koşu açılamadı: güvenle kapatıldı, 5 enerji iade edildi.';
      run = null;
    }
    const y0 = off + 700;
    if (run) {
      const ch = findChapter(run.chapterId) || CHAPTERS[0];
      const wave = run.run.wave > (ch.waves?.length ?? 6) ? 'Final' : `Dalga ${run.run.wave}`;
      button(this, W / 2, y0, 330, 86, t('menu.continue'), () => this.startRun({ snapshot: run }), { size: 34, fill: COLORS.btnGreen, dark: COLORS.btnGreenDark, light: 0x8be07a });
      text(this, W / 2, y0 + 60, `${ch.isStage ? `L${ch.level} · ` : ''}${ch.name} · ${wave} başı (enerji düşmez)`, 18, COLORS.cream);
    } else {
      const lvl = currentLevel(app.save);
      const st = stageByLevel(lvl);
      button(this, W / 2, y0, 330, 86, `${t('menu.play')} · L${lvl}`, () => this.playLevel(lvl), { size: 34 });
      text(this, W / 2, y0 + 60, `${st.name}${stageState(app.save, lvl).cleared ? ' (tekrar)' : ''} · ${st.energyCost} enerji`, 18, COLORS.cream);
    }
    const y1 = off + 818;
    button(this, W / 2 - 172, y1, 160, 62, t('menu.levels'), () => this.openLevels(), { size: 19 });
    button(this, W / 2, y1, 160, 62, t('menu.upgrade'), () => this.openUpgrades(), { size: 20 });
    button(this, W / 2 + 172, y1, 160, 62, t('menu.shop'), () => this.openShop(), { size: 20 });
    // Alpha 0.4B: two small buttons only (minimal menu)
    const small = { size: 15, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 };
    button(this, W / 2 - 172, y1 + 64, 160, 40, t('menu.equipment'), () => this.openEquipment(), small);
    button(this, W / 2, y1 + 64, 160, 40, t('menu.dungeon'), () => this.openDungeons(), small);
    const qReady = questList(app.save, Date.now()).some((q) => q.done && !q.claimed);
    button(this, W / 2 + 172, y1 + 64, 160, 40, `${t('menu.quests')}${qReady ? ' !' : ''}`, () => this.openQuests(), small);
    text(this, W / 2, H - 22, 'V1.0 · Ayg Forge · çevrimdışı oynanır', 16, '#d8c9b0');

    if (app.notice) {
      this.toast(app.notice);
      app.notice = null;
    }
    this.offBack = lifecycle.on('back', () => this.closeOverlay());
    this.events.once('shutdown', () => this.offBack?.());
    if (app.dev) window.__KEPCE__.menu = this;
  }

  defaultChapter() {
    const open = CHAPTERS.filter((c) => isUnlocked(app.save, c.index));
    return open.find((c) => !app.save.chapters[c.id]?.cleared) || open[open.length - 1];
  }

  refreshEnergy() {
    const now = Date.now();
    const e = tickEnergy(app.save.energy, now);
    const ms = msToNextPoint(e, now);
    const mm = String(Math.floor(ms / 60000)).padStart(2, '0');
    const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    this.energyText.setText(`ENERJİ ${e.value}/${ENERGY.max}${ms ? `  +1 ${mm}:${ss}` : ''}`);
  }

  playLevel(level) {
    audio.play('click');
    const r = launchLevel(this, level);
    if (!r.ok) {
      const ms = msToNextPoint(app.save.energy, Date.now());
      this.toast(r.reason === 'energy' ? `Enerji yetersiz (${app.save.energy.value}/${ENERGY.max}). Sonraki +1: ${Math.ceil(ms / 60000)} dk.` : 'Bu level henüz kilitli.');
    }
  }

  // ---------------- level select (V1.0: 12 chapter pages × 10 levels, never 120 buttons on one panel) ----------------
  openLevels(page = null) {
    const { c, top, h } = this.openOverlay(t('menu.levels'), 860);
    const now = Date.now();
    const sg = chefPower(app.save);
    const cur = currentLevel(app.save);
    const cs = stageByLevel(cur);
    const pages = Math.ceil(LEVEL_COUNT / 10);
    const pg = Math.max(1, Math.min(pages, page ?? Math.ceil(cur / 10)));
    this.levelPage = pg;
    c.add(text(this, this.W / 2, top + 68, `${t('ui.chefPower')} ${sg} · L${cur} ${t('ui.recommended')} ${cs.recommendedChefPower}${cs.powerWall ? ` (${cs.powerWall})` : ''}`, 16, sg >= cs.recommendedChefPower ? '#8be07a' : '#ffb35a'));
    const first = stageByLevel((pg - 1) * 10 + 1);
    const done = Array.from({ length: 10 }, (_, i) => stageState(app.save, (pg - 1) * 10 + i + 1).cleared).filter(Boolean).length;
    c.add(text(this, this.W / 2, top + 112, `${t('ui.chapter')} ${pg}/${pages} · ${chapterName(first)} · ${done}/10`, 20, COLORS.cream));
    c.add(this.add.image(this.W / 2, top + 156, first.dish || 'dish_menemen').setScale(2.2));
    const prev = button(this, 70, top + 112, 70, 50, '◀', () => this.openLevels(pg - 1), { size: 22, enabled: pg > 1 });
    const next = button(this, this.W - 70, top + 112, 70, 50, '▶', () => this.openLevels(pg + 1), { size: 22, enabled: pg < pages });
    c.add([prev, next]);
    const cols = 5;
    const bw = 88;
    const bh = 96;
    for (let k = 0; k < 10; k++) {
      const lvl = (pg - 1) * 10 + k + 1;
      if (lvl > LEVEL_COUNT) break;
      const st = stageByLevel(lvl);
      const ss = stageState(app.save, lvl);
      const open = isStageUnlocked(app.save, lvl);
      const x = this.W / 2 + ((k % cols) - (cols - 1) / 2) * (bw + 12);
      const y = top + 250 + Math.floor(k / cols) * (bh + 40);
      const fill = st.stageType === 'chapter_boss' ? 0xb5341f : st.stageType === 'mini_boss' ? 0x8a4fc0 : /dual|triple/.test(st.stageType) ? 0x3f6fb0 : COLORS.btn;
      const b = button(this, x, y, bw, bh, open ? `L${lvl}` : `L${lvl}\n${t('ui.locked')}`, () => this.playLevel(lvl), { size: open ? 22 : 14, enabled: open, fill });
      b.label.y -= open ? 14 : 0;
      c.add(b);
      if (open) for (let q = 0; q < 3; q++) c.add(this.add.image(x - 22 + q * 22, y + 22, q < ss.stars ? 'star' : 'star_empty').setScale(1.25));
      c.add(text(this, x, y + bh / 2 + 14, st.name, 11, '#d8c9b0', { wrap: bw + 8 }));
      if (lvl === cur) c.add(text(this, x, y - bh / 2 - 8, '▶', 14, COLORS.gold));
    }
    const fy = top + 540;
    const ev = (id) => app.save.unlockEvents.some((u) => u.id === id);
    const lv = (l) => stageState(app.save, l).cleared;
    const fut = [['Altın Mutfak', 7], ['Malzeme Deposu', 15], ['Boss Mutfağı', 25], ['Kazan Kulesi', 35], ['Epic', 35], ['Legendary', 70]]
      .map(([name, l]) => `${name}: ${lv(l) ? t('ui.open') : `L${l}`}`)
      .join(' · ');
    c.add(text(this, this.W / 2, fy, fut, 13, '#d8c9b0', { wrap: this.W - 90 }));
    if (ev('game_complete')) c.add(text(this, this.W / 2, fy + 40, t('ui.gameComplete'), 18, COLORS.gold));
    const left = adRefillsLeft(app.save.energy, now);
    const reset = Math.ceil(msToUtcReset(now) / 3600000);
    c.add(text(this, this.W / 2, fy + 70, `${t('ui.adRefill')}: ${left}/${ENERGY.dailyAdFullRefills} · UTC ~${reset} sa`, 15, '#9ef0ff'));
    // rewarded energy refill: only a verified native reward counts; in the browser the button stays disabled
    const ad = button(this, this.W / 2, top + h - 104, 380, 44, adService.isAvailable() ? 'ENERJİYİ DOLDUR (reklam)' : 'Enerji dolumu (reklam) — Android sürümünde', async () => {
      const res = await adService.show('rewarded_energy_refill');
      const r = consumeAdReward(app.save, res) ? applyAdRefill(app.save.energy, res, Date.now()) : { ok: false };
      if (r.ok) {
        app.persist();
        this.refreshEnergy();
      } else this.toast('Reklam ödülü doğrulanmadı; enerji verilmedi.');
    }, { size: 15, enabled: adService.isAvailable() && left > 0 });
    c.add(ad);
    const legacy = app.save.legacyCompletedChapters;
    if (legacy.length) c.add(text(this, this.W / 2, fy + 100, `Eski sürüm rozetleri: ${legacy.map((id) => `${CHAPTERS.find((x) => x.id === id)?.name} ${'★'.repeat(app.save.chapters[id]?.stars || 0)}`).join(' · ')}`, 13, '#b7a9c4'));
  }

  // ---------------- equipment & crafting (Alpha 0.4B) ----------------
  openEquipment() {
    const { c, top } = this.openOverlay(t('menu.equipment'), 860);
    const sg = chefPower(app.save);
    const cur = currentLevel(app.save);
    c.add(text(this, this.W / 2, top + 66, `${t('ui.chefPower')} ${sg} · L${cur} ${t('ui.recommended')} ${_stage(cur).recommendedChefPower} · SG yalnız öneridir`, 15, '#9ef0ff'));
    c.add(text(this, this.W / 2, top + 92, `${t('ui.parts')} ${app.save.currencyParts} · ${t('ui.tips')} ${app.save.tips} · ${t('ui.seals')} ${app.save.bossSeals || 0}`, 15, '#d8c9b0'));
    const reopen = () => {
      app.persist(); // atomic: cost + upgrade in one write
      audio.play('coin');
      this.refreshTips();
      this.openEquipment();
    };
    EQUIP.slots.forEach((slot, i) => {
      const y = top + 116 + i * 150;
      const info = craftInfo(app.save, slot);
      const en = enhanceInfo(app.save, slot);
      c.add(panel(this, 36, y, this.W - 72, 140, { fill: 0x3d3447, light: 0x51465d }));
      c.add(text(this, 52, y + 20, `${SLOT_LABEL[slot]} · ${RARITY_LABEL[info.cur]} · +${en.level}`, 19, RARITY_COLOR[info.cur], { ox: 0 }));
      c.add(text(this, 52, y + 46, EFFECT_TEXT[slot][info.cur], 13, '#e9dcc4', { ox: 0, wrap: 300, align: 'left' }));
      c.add(text(this, 52, y + 68, ENHANCE_TEXT[slot](en.level), 13, '#b7a9c4', { ox: 0, wrap: 300, align: 'left' }));
      if (info.next) {
        c.add(text(this, 52, y + 92, `→ ${RARITY_LABEL[info.next]}: ${EFFECT_TEXT[slot][info.next]}`, 12, '#b7a9c4', { ox: 0, oy: 0, wrap: 300, align: 'left' }));
        const label = info.unlocked ? `${info.cost.parts}P${info.cost.seals ? `+${info.cost.seals}M` : ''}+${info.cost.tips}` : `L${info.gateLevel}`;
        c.add(button(this, this.W - 110, y + 36, 136, 46, `${t('ui.craft')} ${label}`, () => {
          if (craft(app.save, slot).ok) reopen();
        }, { size: 12, enabled: info.unlocked && info.affordable, fill: COLORS.btnGreen, dark: COLORS.btnGreenDark, light: 0x8be07a }));
      } else c.add(text(this, this.W - 110, y + 36, 'MAKS', 16, COLORS.gold));
      c.add(button(this, this.W - 110, y + 98, 136, 42, en.max ? 'MAKS +30' : `${t('ui.enhance')} ${en.cost.tips}+${en.cost.parts}P`, () => {
        if (enhance(app.save, slot).ok) reopen();
      }, { size: 12, enabled: !en.max && en.affordable }));
    });
  }

  // ---------------- dungeons (Alpha 0.4B) ----------------
  openDungeons() {
    const { c, top } = this.openOverlay(t('menu.dungeon'), 880);
    const now = Date.now();
    const reset = Math.ceil(msToUtcReset(now) / 3600000);
    c.add(text(this, this.W / 2, top + 64, `Giriş ${DUNGEONS[0]?.energyCost ?? 5} enerji · günlük UTC ~${reset} sa · haftalık Pazartesi 00:00 UTC`, 13, '#d8c9b0', { wrap: 470 }));
    const go = (id, block) => {
      const r = launchDungeon(this, id, block);
      if (!r.ok) this.toast(r.reason === 'energy' ? 'Enerji yetersiz.' : 'Dungeon kilitli.');
    };
    const row = (i, name, open, lockLevel, l1, l2, btnLabel, onGo, extra) => {
      const y = top + 88 + i * 172;
      c.add(panel(this, 36, y, this.W - 72, 160, { fill: 0x3d3447, light: 0x51465d }));
      c.add(text(this, 52, y + 22, name, 20, open ? COLORS.cream : '#9a92a6', { ox: 0 }));
      c.add(text(this, 52, y + 52, open ? l1 : `L${lockLevel} temizlenince açılır`, 13, open ? '#e9dcc4' : '#ffb35a', { ox: 0, wrap: this.W - 110, align: 'left' }));
      if (open && l2) c.add(text(this, 52, y + 78, l2, 13, '#9ef0ff', { ox: 0, wrap: this.W - 110, align: 'left' }));
      c.add(button(this, extra ? this.W / 2 - 80 : this.W / 2, y + 126, extra ? 200 : 260, 42, open ? btnLabel : t('ui.locked'), onGo, { size: 15, enabled: open }));
      if (extra && open) c.add(button(this, this.W / 2 + 116, y + 126, 160, 42, extra.label, extra.go, { size: 13, enabled: extra.enabled, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 }));
    };
    DUNGEONS.forEach((dg, i) => {
      const d = scaledDungeonReward(app.save, dg.dungeonId, dg.reward);
      const full = d.fullRewardTips ? `${d.fullRewardTips} bahşiş` : `${d.fullRewardParts} parça`;
      const rep = d.repeatRewardTips ? `${d.repeatRewardTips} bahşiş` : `${d.repeatRewardParts} parça`;
      row(i, dg.name, isDungeonUnlocked(app.save, dg), dg.unlockedAfterLevel, `Tam: ${full} · Tekrar: ${rep}${d.firstClearPartsBonus ? ` · İlk: +${d.firstClearPartsBonus} parça` : ''}`,
        `Bugün kalan tam ödül: ${dungeonFullLeft(app.save, dg)}/2 · 4 dalga + ${dg.finalName}`, `GİR (${dg.energyCost} enerji)`, () => go(dg.dungeonId));
    });
    // Boss Mutfağı
    const bkOpen = !!stageState(app.save, BOSS_KITCHEN.unlockedAfterLevel).cleared;
    const bk = app.save.bossKitchen || {};
    const winsLeft = bk.week === utcWeek(now) ? Math.max(0, 3 - bk.wins) : 3;
    const pool = bossKitchenPool(app.save).map((l) => stageByLevel(l).finalName).join(' → ');
    row(2, t('ui.bossKitchen'), bkOpen, BOSS_KITCHEN.unlockedAfterLevel, `3 boss art arda: ${pool}`, `Bu hafta tam ödül (2 mühür): ${winsLeft}/3 · ${t('ui.seals')}: ${app.save.bossSeals || 0}`, 'GİR (5 enerji)', () => go('boss_kitchen'));
    // Kazan Kulesi
    const twOpen = !!stageState(app.save, TOWER.unlockedAfterLevel).cleared;
    const nb = towerNextBlock(app.save);
    row(3, t('ui.tower'), twOpen, TOWER.unlockedAfterLevel, `Sıradaki: ${t('ui.floor')} ${5 * nb + 1}–${5 * nb + 5} · checkpoint ${app.save.tower?.best || 0}. kat`,
      `Her 5 katta ilk kez bahşiş+parça, her 15. katta +1 mühür · ${100 - Math.min(100, app.save.tower?.best || 0)} kat kaldı (100+ sonsuz)`, `${t('ui.floor')} ${5 * nb + 1}`, () => go('tower', nb),
      { label: 'Son bloğu tekrarla', go: () => go('tower', nb - 1), enabled: nb > 0 });
  }

  // ---------------- daily / weekly quests (V1.0) ----------------
  openQuests() {
    const { c, top } = this.openOverlay(t('menu.quests'), 640);
    const now = Date.now();
    questList(app.save, now).forEach((q, i) => {
      const y = top + 80 + i * 78 + (q.kind === 'weekly' ? 20 : 0);
      if (i === 0 || (q.kind === 'weekly' && i === 3)) c.add(text(this, 52, y - 12, q.kind === 'daily' ? t('ui.daily') : t('ui.weekly'), 15, COLORS.gold, { ox: 0 }));
      const rw = q.reward.tips ? `${q.reward.tips} bahşiş` : `${q.reward.parts} parça`;
      c.add(text(this, 52, y + 18, `${q.name} (${Math.min(q.progress, q.target)}/${q.target}) · ${rw}`, 15, q.done ? '#8be07a' : COLORS.cream, { ox: 0 }));
      c.add(button(this, this.W - 100, y + 18, 120, 40, q.claimed ? t('ui.claimed') : t('ui.claim'), () => {
        if (claimQuest(app.save, q.id, Date.now()).ok) {
          app.persist();
          audio.play('coin');
          this.refreshTips();
          this.openQuests();
        }
      }, { size: 15, enabled: q.done && !q.claimed }));
    });
  }


  startRun(data) {
    audio.play('click');
    this.scene.start('Game', data);
  }

  toast(msg) {
    const t = text(this, this.W / 2, this.H - 70, msg, 16, COLORS.cream, { wrap: 460 });
    this.tweens.add({ targets: t, alpha: 0, delay: 2600, duration: 500, onComplete: () => t.destroy() });
  }

  refreshTips() {
    this.tipText.setText(String(app.save.tips));
  }

  closeOverlay() {
    if (this.overlay) {
      this.overlay.destroy(true);
      this.overlay = null;
    }
  }

  openOverlay(title, h = 760) {
    this.closeOverlay();
    audio.play('click');
    const c = this.add.container(0, 0).setDepth(100);
    c.add(blocker(this, 0.7));
    const top = Math.max(20, (this.H - h) / 2);
    c.add(panel(this, 20, top, this.W - 40, h));
    c.add(text(this, this.W / 2, top + 34, title, 28, COLORS.gold));
    c.add(button(this, this.W / 2, top + h - 44, 200, 54, 'KAPAT', () => this.closeOverlay(), { size: 22, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 }));
    this.overlay = c;
    return { c, top, h };
  }

  // ---------------- chapters ----------------
  openChapters() {
    const { c, top } = this.openOverlay('TARİFLER', 640);
    CHAPTERS.forEach((ch, i) => {
      const y = top + 80 + i * 210;
      const unlocked = isUnlocked(app.save, ch.index);
      const st = app.save.chapters[ch.id] || { stars: 0, cleared: false };
      c.add(panel(this, 40, y, this.W - 80, 190, { fill: 0x3d3447, light: 0x51465d }));
      c.add(this.add.image(98, y + 64, ch.id === 'menemen' ? 'dish_menemen' : 'dish_fries').setScale(ch.id === 'menemen' ? 3 : 2.6));
      c.add(text(this, 160, y + 30, `${ch.index}. ${ch.name}`, 24, unlocked ? COLORS.cream : '#9a92a6', { ox: 0 }));
      const recipe = Object.entries(ch.recipe).map(([k, n]) => `${n} ${RECIPE_LABELS[k]}`).join(' + ');
      c.add(text(this, 160, y + 64, `Tarif: ${recipe}`, 15, '#e9dcc4', { ox: 0, wrap: 320 }));
      c.add(text(this, 160, y + 92, `Boss: ${ch.boss === 'giant_tomato' ? 'Dev Domates' : 'Patates Kral'} · Bahşiş ${ch.baseTip}`, 15, '#e9dcc4', { ox: 0 }));
      for (let s = 0; s < 3; s++) c.add(this.add.image(78 + s * 30, y + 120, s < st.stars ? 'star' : 'star_empty').setScale(2));
      const label = !unlocked ? 'KİLİTLİ' : st.cleared ? 'TEKRAR OYNA' : 'OYNA';
      const b = button(this, this.W - 150, y + 150, 200, 50, label, () => {
        if (app.save.activeRun) {
          app.save.activeRun = null; // starting a new order abandons the saved checkpoint (no reward)
          app.persist();
        }
        this.startRun({ chapterId: ch.id });
      }, { size: 20, enabled: unlocked });
      c.add(b);
      if (!unlocked) c.add(text(this, 160, y + 150, 'Önceki tarifi bitir', 14, '#ffb35a', { ox: 0 }));
    });
    if (app.save.activeRun) c.add(text(this, this.W / 2, top + 512, 'Not: Yeni sipariş, kayıtlı dalga noktasını siler.', 14, '#ffb35a'));
  }

  // ---------------- upgrades ----------------
  openUpgrades() {
    const { c, top } = this.openOverlay('GELİŞTİR', 820);
    const tip = text(this, this.W / 2, top + 66, `Bahşiş: ${app.save.tips}`, 18, COLORS.gold);
    c.add(tip);
    const rows = [];
    const render = () => {
      for (const r of rows) r.destroy(true);
      rows.length = 0;
      tip.setText(`Bahşiş: ${app.save.tips}`);
      UPGRADES.forEach((u, i) => {
        const y = top + 96 + i * 104;
        const lvl = app.save.upgrades[u.id];
        const row = this.add.container(0, 0);
        row.add(panel(this, 40, y, this.W - 80, 92, { fill: 0x3d3447, light: 0x51465d }));
        row.add(text(this, 58, y + 22, `${u.name}  Sv ${lvl}/${MAX_UPGRADE_LEVEL}`, 19, COLORS.cream, { ox: 0 }));
        const cur = u.fmt(upgradeValue(app.save, u.id));
        const next = lvl < MAX_UPGRADE_LEVEL ? u.fmt(u.values[lvl]) : null;
        row.add(text(this, 58, y + 52, next ? `${cur}  →  ${next}` : `${cur}  (MAKS)`, 15, '#e9dcc4', { ox: 0, wrap: 300 }));
        const cost = upgradeCost(app.save, u.id);
        const b = button(this, this.W - 110, y + 46, 120, 52, cost == null ? 'MAKS' : `${cost}`, () => {
          const r = purchaseUpgrade(app.save, u.id);
          if (r.ok) {
            app.persist(); // atomic: check -> subtract -> level -> save
            audio.play('coin');
            this.refreshTips();
            render();
          }
        }, { size: 20, enabled: cost != null && app.save.tips >= cost, fill: COLORS.btnGreen, dark: COLORS.btnGreenDark, light: 0x8be07a });
        row.add(b);
        if (cost != null) row.add(this.add.image(this.W - 154, y + 44, 'coin').setScale(1.8));
        rows.push(row);
        c.add(row);
      });
    };
    render();
    c.add(text(this, this.W / 2, top + 730, 'Kalıcı geliştirmeler her koşuda geçerlidir.', 14, '#d8c9b0'));
  }

  // ---------------- shop (future integration only) ----------------
  openShop() {
    const { c, top } = this.openOverlay(t('menu.shop'), 700);
    const live = purchaseService.isAvailable();
    c.add(text(this, this.W / 2, top + 76, live ? 'Satın almalar Google Play üzerinden.' : 'Mağaza yalnız Android (Google Play) sürümünde çalışır.\nBu sürümde fiyat ve satın alma gösterilmez.', 15, COLORS.cream, { wrap: 440 }));
    purchaseService.listProducts().then((list) => {
      if (!this.overlay || this.overlay !== c) return;
      list.forEach((p, i) => {
        const y = top + 130 + i * 96;
        const owned = hasEntitlement(app.save, p.id);
        c.add(panel(this, 40, y, this.W - 80, 84, { fill: 0x3d3447, light: 0x51465d }));
        c.add(text(this, 58, y + 24, p.name, 19, COLORS.cream, { ox: 0 }));
        c.add(text(this, 58, y + 54, p.desc, 13, '#e9dcc4', { ox: 0, wrap: 300 }));
        c.add(button(this, this.W - 110, y + 42, 130, 48, owned ? 'SAHİPSİN' : live && p.available && p.price ? p.price : 'KAPALI', async () => {
          const r = applyPurchase(app.save, await purchaseService.purchase(p.id)); // one grant per purchase token
          if (r.ok) {
            app.persist();
            this.refreshTips();
            this.openShop();
          } else this.toast('Satın alma tamamlanmadı; hiçbir şey verilmedi.');
        }, { size: 15, enabled: live && p.available && !owned }));
      });
      c.add(button(this, this.W / 2, top + 130 + list.length * 96 + 20, 300, 46, 'SATIN ALIMLARI GERİ YÜKLE', async () => {
        const res = await purchaseService.restore();
        if (res.status !== 'ok') return this.toast('Geri yükleme yalnız Android sürümünde.');
        const d = restorePurchases(app.save, res.owned); // refunded / revoked items drop out
        app.persist();
        this.toast(`Geri yüklendi: ${d.added.length} · kaldırılan: ${d.removed.length}`);
      }, { size: 15, enabled: live }));
    });
  }


  // ---------------- settings ----------------
  openSettings() {
    const { c, top } = this.openOverlay(t('menu.settings'), 780);
    const s = app.save.settings;
    const items = [
      ['sound', 'Ses', (v) => (v ? 'AÇIK' : 'KAPALI')],
      ['music', 'Müzik', (v) => (v ? 'AÇIK' : 'KAPALI')],
      ['vibration', 'Titreşim', (v) => (v ? 'AÇIK' : 'KAPALI')],
      ['lowMotion', 'Düşük hareket', (v) => (v ? 'AÇIK' : 'KAPALI')],
      ['animSpeed', 'Animasyon hızı', (v) => `${v}x`],
      ['language', 'Dil / Language', (v) => (v === 'en' ? 'English' : 'Türkçe')],
    ];
    items.forEach(([k, label, fmt], i) => {
      const y = top + 100 + i * 76;
      c.add(text(this, 60, y, label, 21, COLORS.cream, { ox: 0 }));
      const b = button(this, this.W - 130, y, 160, 54, fmt(s[k]), () => {
        const v = k === 'animSpeed' ? (s[k] === 1 ? 2 : 1) : k === 'language' ? (s[k] === 'en' ? 'tr' : 'en') : !s[k];
        app.setSetting(k, v);
        if (k === 'language') {
          setLanguage(v);
          this.scene.restart();
          return;
        }
        b.setLabel(fmt(v));
        audio.play('click');
      }, { size: 20 });
      c.add(b);
    });
    const y = top + 100 + items.length * 76;
    c.add(button(this, this.W / 2, y + 10, 300, 52, 'EĞİTİMİ TEKRARLA', () => {
      app.save.tutorialDone = false;
      app.persist();
      this.toast('Eğitim bir sonraki Menemen koşusunda gösterilecek.');
    }, { size: 18, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 }));
    let confirm = false;
    const reset = button(this, this.W / 2, y + 76, 300, 52, 'KAYDI SIFIRLA', () => {
      if (!confirm) {
        confirm = true;
        reset.setLabel('EMİN MİSİN? DOKUN');
        return;
      }
      app.resetAll();
      this.scene.restart();
    }, { size: 18, fill: 0xb5341f, dark: 0x7a1f12, light: 0xe8582f });
    c.add(reset);
    c.add(text(this, this.W / 2, y + 128, 'Kayıt bu tarayıcıda (localStorage) tutulur.', 13, '#d8c9b0'));
  }
}
