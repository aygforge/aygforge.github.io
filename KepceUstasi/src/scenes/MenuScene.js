// MenuScene — minimal restoran ana ekranı: OYNA, TARİFLER, GELİŞTİR, MAĞAZA, AYARLAR.
import Phaser from 'phaser';
import { app } from '../game/AppState.js';
import { CHAPTERS, UPGRADES, RECIPE_LABELS, MAX_UPGRADE_LEVEL } from '../data/content.js';
import { purchaseUpgrade, upgradeCost, upgradeValue, isUnlocked } from '../systems/Progression.js';
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

    // main actions
    const run = app.save.activeRun;
    const y0 = off + 700;
    if (run) {
      const ch = CHAPTERS.find((c) => c.id === run.chapterId);
      const wave = run.run.wave > 6 ? 'Boss' : `Dalga ${run.run.wave}`;
      button(this, W / 2, y0, 330, 86, 'DEVAM ET', () => this.startRun({ snapshot: run }), { size: 34, fill: COLORS.btnGreen, dark: COLORS.btnGreenDark, light: 0x8be07a });
      text(this, W / 2, y0 + 60, `${ch.name} · ${wave} başı`, 20, COLORS.cream);
    } else {
      const ch = this.defaultChapter();
      button(this, W / 2, y0, 330, 86, 'OYNA', () => this.startRun({ chapterId: ch.id }), { size: 40 });
      text(this, W / 2, y0 + 60, `Sipariş: ${ch.name}`, 20, COLORS.cream);
    }
    const y1 = off + 818;
    button(this, W / 2 - 172, y1, 160, 62, 'TARİFLER', () => this.openChapters(), { size: 20 });
    button(this, W / 2, y1, 160, 62, 'GELİŞTİR', () => this.openUpgrades(), { size: 20 });
    button(this, W / 2 + 172, y1, 160, 62, 'MAĞAZA', () => this.openShop(), { size: 20 });
    text(this, W / 2, H - 22, 'Alpha 0.1 · Ayg Forge · çevrimdışı · reklamsız', 16, '#d8c9b0');

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
    c.add(text(this, this.W / 2, top + 80, 'Mağaza Android sürümünde açılacak.\nAlpha 0.1\'de satın alma ve reklam yok.', 17, COLORS.cream, { wrap: 440 }));
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
