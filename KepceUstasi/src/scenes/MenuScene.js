// MenuScene — minimal restoran ana ekranı: OYNA (sıradaki level), LEVEL SEÇ, GELİŞTİR, MAĞAZA, AYARLAR, enerji.
import Phaser from 'phaser';
import { app } from '../game/AppState.js';
import { CHAPTERS, UPGRADES, RECIPE_LABELS, MAX_UPGRADE_LEVEL } from '../data/content.js';
import { purchaseUpgrade, upgradeCost, upgradeValue, isUnlocked, currentLevel, stageState, isStageUnlocked, chefPower } from '../systems/Progression.js';
import { findChapter, stageByLevel, LEVEL_COUNT } from '../data/stages.js';
import { tickEnergy, msToNextPoint, msToUtcReset, adRefillsLeft, applyAdRefill, ENERGY } from '../systems/EnergyService.js';
import { launchLevel, launchDungeon } from '../game/StageLauncher.js';
import { DUNGEONS, stageByLevel as _stage } from '../data/stages.js';
import { EQUIP, SLOT_LABEL, RARITY_LABEL, EFFECT_TEXT, craftInfo, craft } from '../systems/Equipment.js';
import { isDungeonUnlocked, dungeonFullLeft } from '../systems/Progression.js';
import { adService } from '../platform/AdService.js';
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
    button(this, W - 70, 36, 112, 46, 'AYARLAR', () => this.openSettings(), { size: 18, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 });
    // energy indicator (ticks every second; offline regeneration is applied on open)
    panel(this, 176, 14, 230, 44);
    this.energyText = text(this, 192, 36, '', 20, '#9ef0ff', { ox: 0 });
    this.refreshEnergy();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshEnergy() });

    // main actions
    const run = app.save.activeRun;
    const y0 = off + 700;
    if (run) {
      const ch = findChapter(run.chapterId) || CHAPTERS[0];
      const wave = run.run.wave > 6 ? 'Boss' : `Dalga ${run.run.wave}`;
      button(this, W / 2, y0, 330, 86, 'DEVAM ET', () => this.startRun({ snapshot: run }), { size: 34, fill: COLORS.btnGreen, dark: COLORS.btnGreenDark, light: 0x8be07a });
      text(this, W / 2, y0 + 60, `${ch.isStage ? `L${ch.level} · ` : ''}${ch.name} · ${wave} başı (enerji düşmez)`, 18, COLORS.cream);
    } else {
      const lvl = currentLevel(app.save);
      const st = stageByLevel(lvl);
      button(this, W / 2, y0, 330, 86, `OYNA · L${lvl}`, () => this.playLevel(lvl), { size: 34 });
      text(this, W / 2, y0 + 60, `${st.name}${stageState(app.save, lvl).cleared ? ' (tekrar)' : ''} · ${st.energyCost} enerji`, 18, COLORS.cream);
    }
    const y1 = off + 818;
    button(this, W / 2 - 172, y1, 160, 62, 'LEVEL SEÇ', () => this.openLevels(), { size: 19 });
    button(this, W / 2, y1, 160, 62, 'GELİŞTİR', () => this.openUpgrades(), { size: 20 });
    button(this, W / 2 + 172, y1, 160, 62, 'MAĞAZA', () => this.openShop(), { size: 20 });
    // Alpha 0.4B: two small buttons only (minimal menu)
    button(this, W / 2 - 84, y1 + 64, 150, 40, 'EKİPMAN', () => this.openEquipment(), { size: 16, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 });
    button(this, W / 2 + 84, y1 + 64, 150, 40, 'DUNGEON', () => this.openDungeons(), { size: 16, fill: COLORS.btnGrey, dark: COLORS.btnGreyDark, light: 0x9a92a6 });
    text(this, W / 2, H - 22, 'Alpha 0.5A · Ayg Forge · çevrimdışı · reklamsız', 16, '#d8c9b0');

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

  // ---------------- level select (L1–L30; Alpha 0.5A: 5 columns so 30 levels fit) ----------------
  openLevels() {
    const { c, top, h } = this.openOverlay('LEVEL SEÇ', 860);
    const now = Date.now();
    const sg = chefPower(app.save);
    const cur = currentLevel(app.save);
    const cs = stageByLevel(cur);
    c.add(text(this, this.W / 2, top + 68, `Şef Gücü ${sg} · L${cur} önerisi ${cs.recommendedChefPower}${cs.powerWall ? ` (${cs.powerWall})` : ''}`, 16, sg >= cs.recommendedChefPower ? '#8be07a' : '#ffb35a'));
    const cols = 5;
    const bw = 88;
    const bh = 74;
    const rows = Math.ceil(LEVEL_COUNT / cols);
    for (let i = 0; i < LEVEL_COUNT; i++) {
      const lvl = i + 1;
      const st = stageByLevel(lvl);
      const ss = stageState(app.save, lvl);
      const open = isStageUnlocked(app.save, lvl);
      const x = this.W / 2 + (i % cols - (cols - 1) / 2) * (bw + 12);
      const y = top + 130 + Math.floor(i / cols) * (bh + 10);
      const fill = st.stageType === 'chapter_boss' ? 0xb5341f : st.stageType === 'mini_boss' ? 0x8a4fc0 : COLORS.btn;
      const b = button(this, x, y, bw, bh, open ? `L${lvl}` : `L${lvl}\nKİLİT`, () => this.playLevel(lvl), { size: open ? 22 : 14, enabled: open, fill });
      b.label.y -= open ? 10 : 0;
      c.add(b);
      if (open) for (let k = 0; k < 3; k++) c.add(this.add.image(x - 22 + k * 22, y + 20, k < ss.stars ? 'star' : 'star_empty').setScale(1.25));
      if (lvl === cur) c.add(text(this, x, y - bh / 2 - 6, '▶', 14, COLORS.gold));
    }
    const fy = top + 130 + rows * (bh + 10) - 22;
    // future content unlocked by levels 7 / 15 / 16: recorded as data, screens come with 0.4B
    const ev = (id) => app.save.unlockEvents.some((u) => u.id === id);
    const fut = [['gold_kitchen', 'Altın Mutfak', 7], ['materials_depot', 'Malzeme Deposu', 15], ['rare_crafting', 'Nadir Üretim', 16]]
      .map(([id, name, l]) => `${name}: ${ev(id) ? 'açıldı' : `L${l}'de açılır`}`)
      .join('\n');
    c.add(text(this, 46, fy, fut, 15, '#d8c9b0', { ox: 0, oy: 0, align: 'left', lineSpacing: 4 }));
    const left = adRefillsLeft(app.save.energy, now);
    const reset = Math.ceil(msToUtcReset(now) / 3600000);
    c.add(text(this, this.W - 46, fy, `Reklam dolumu: ${left}/${ENERGY.dailyAdFullRefills}\nUTC sıfırlama: ~${reset} sa`, 15, '#9ef0ff', { ox: 1, oy: 0, align: 'right', lineSpacing: 4 }));
    // rewarded energy refill: only a verified native reward counts; in the browser the button stays disabled
    const ad = button(this, this.W / 2, top + h - 104, 380, 44, adService.isAvailable() ? 'ENERJİYİ DOLDUR (reklam)' : 'Enerji dolumu (reklam) — Android sürümünde', async () => {
      const res = await adService.show('rewarded_energy_refill');
      const r = applyAdRefill(app.save.energy, res, Date.now());
      if (r.ok) {
        app.persist();
        this.refreshEnergy();
      } else this.toast('Reklam ödülü doğrulanmadı; enerji verilmedi.');
    }, { size: 15, enabled: adService.isAvailable() && left > 0 });
    c.add(ad);
    const legacy = app.save.legacyCompletedChapters;
    if (legacy.length) c.add(text(this, this.W / 2, top + 100, `Eski sürüm rozetleri: ${legacy.map((id) => `${CHAPTERS.find((x) => x.id === id)?.name} ${'★'.repeat(app.save.chapters[id]?.stars || 0)}`).join(' · ')}`, 13, '#b7a9c4'));
  }

  // ---------------- equipment & crafting (Alpha 0.4B) ----------------
  openEquipment() {
    const { c, top } = this.openOverlay('EKİPMAN', 800);
    const sg = chefPower(app.save);
    c.add(text(this, this.W / 2, top + 66, `Şef Gücü ${sg} · öneri L10 ${_stage(10).recommendedChefPower} · L20 ${_stage(20).recommendedChefPower}`, 16, '#9ef0ff'));
    c.add(text(this, this.W / 2, top + 92, `Parça ${app.save.currencyParts} · Bahşiş ${app.save.tips} · SG yalnız öneridir, kilit değil`, 14, '#d8c9b0'));
    const rows = [];
    const render = () => {
      for (const r of rows) r.destroy(true);
      rows.length = 0;
      EQUIP.slots.forEach((slot, i) => {
        const y = top + 118 + i * 140;
        const info = craftInfo(app.save, slot);
        const row = this.add.container(0, 0);
        row.add(panel(this, 40, y, this.W - 80, 126, { fill: 0x3d3447, light: 0x51465d }));
        row.add(text(this, 58, y + 22, `${SLOT_LABEL[slot]} · ${RARITY_LABEL[info.cur]}`, 20, info.cur === 'rare' ? '#7fb0ff' : info.cur === 'uncommon' ? '#8be07a' : COLORS.cream, { ox: 0 }));
        row.add(text(this, 58, y + 52, EFFECT_TEXT[slot][info.cur], 14, '#e9dcc4', { ox: 0, wrap: 300, align: 'left' }));
        if (info.next) {
          row.add(text(this, 58, y + 82, `→ ${RARITY_LABEL[info.next]}: ${EFFECT_TEXT[slot][info.next]}`, 13, '#b7a9c4', { ox: 0, oy: 0, wrap: 290, align: 'left' }));
          const label = info.unlocked ? `${info.cost.parts}P + ${info.cost.tips}` : `L${info.gateLevel}'da açılır`;
          row.add(button(this, this.W - 112, y + 40, 128, 50, label, () => {
            if (craft(app.save, slot).ok) {
              app.persist(); // atomic craft: parts + tips + rarity in one write
              audio.play('coin');
              this.refreshTips();
              this.closeOverlay();
              this.openEquipment();
            }
          }, { size: 14, enabled: info.unlocked && info.affordable, fill: COLORS.btnGreen, dark: COLORS.btnGreenDark, light: 0x8be07a }));
        } else row.add(text(this, this.W - 112, y + 40, 'MAKS', 16, COLORS.gold));
        rows.push(row);
        c.add(row);
      });
    };
    render();
  }

  // ---------------- dungeons (Alpha 0.4B) ----------------
  openDungeons() {
    const { c, top } = this.openOverlay('DUNGEON', 560);
    const reset = Math.ceil(msToUtcReset(Date.now()) / 3600000);
    c.add(text(this, this.W / 2, top + 66, `Günde 2 tam ödül · sonra düşük ödül · giriş 10 enerji · UTC sıfırlama ~${reset} sa`, 13, '#d8c9b0', { wrap: 460 }));
    DUNGEONS.forEach((dg, i) => {
      const y = top + 96 + i * 180;
      const open = isDungeonUnlocked(app.save, dg);
      const d = dg.reward;
      const full = d.fullRewardTips ? `${d.fullRewardTips} bahşiş` : `${d.fullRewardParts} parça`;
      const rep = d.repeatRewardTips ? `${d.repeatRewardTips} bahşiş` : `${d.repeatRewardParts} parça`;
      c.add(panel(this, 40, y, this.W - 80, 164, { fill: 0x3d3447, light: 0x51465d }));
      c.add(text(this, 58, y + 24, dg.name, 22, open ? COLORS.cream : '#9a92a6', { ox: 0 }));
      c.add(text(this, 58, y + 58, `Tam: ${full} · Tekrar: ${rep}${d.firstClearPartsBonus ? ` · İlk: +${d.firstClearPartsBonus} parça` : ''}`, 14, '#e9dcc4', { ox: 0 }));
      c.add(text(this, 58, y + 84, open ? `Bugün kalan tam ödül: ${dungeonFullLeft(app.save, dg)}/2 · 4 dalga + ${dg.finalName}` : `L${dg.unlockedAfterLevel} temizlenince açılır`, 14, open ? '#9ef0ff' : '#ffb35a', { ox: 0 }));
      c.add(button(this, this.W / 2, y + 128, 260, 44, open ? 'GİR (10 enerji)' : 'KİLİTLİ', () => {
        const r = launchDungeon(this, dg.dungeonId);
        if (!r.ok) this.toast(r.reason === 'energy' ? 'Enerji yetersiz.' : 'Dungeon kilitli.');
      }, { size: 17, enabled: open }));
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
    const { c, top } = this.openOverlay('MAĞAZA', 560);
    c.add(text(this, this.W / 2, top + 80, 'Mağaza Android sürümünde açılacak.\nAlpha sürümünde satın alma ve reklam yok.', 17, COLORS.cream, { wrap: 440 }));
    purchaseService.listProducts().then((list) => {
      if (!this.overlay || this.overlay !== c) return;
      list.forEach((p, i) => {
        const y = top + 150 + i * 98;
        c.add(panel(this, 40, y, this.W - 80, 84, { fill: 0x3d3447, light: 0x51465d }));
        c.add(text(this, 58, y + 24, p.name, 19, COLORS.cream, { ox: 0 }));
        c.add(text(this, 58, y + 54, p.desc, 13, '#e9dcc4', { ox: 0, wrap: 300 }));
        c.add(button(this, this.W - 110, y + 42, 130, 48, 'YAKINDA', () => {}, { size: 16, enabled: false }));
      });
    });
  }

  // ---------------- settings ----------------
  openSettings() {
    const { c, top } = this.openOverlay('AYARLAR', 700);
    const s = app.save.settings;
    const items = [
      ['sound', 'Ses', (v) => (v ? 'AÇIK' : 'KAPALI')],
      ['music', 'Müzik', (v) => (v ? 'AÇIK' : 'KAPALI')],
      ['vibration', 'Titreşim', (v) => (v ? 'AÇIK' : 'KAPALI')],
      ['lowMotion', 'Düşük hareket', (v) => (v ? 'AÇIK' : 'KAPALI')],
      ['animSpeed', 'Animasyon hızı', (v) => `${v}x`],
    ];
    items.forEach(([k, label, fmt], i) => {
      const y = top + 100 + i * 76;
      c.add(text(this, 60, y, label, 21, COLORS.cream, { ox: 0 }));
      const b = button(this, this.W - 130, y, 160, 54, fmt(s[k]), () => {
        const v = k === 'animSpeed' ? (s[k] === 1 ? 2 : 1) : !s[k];
        app.setSetting(k, v);
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
