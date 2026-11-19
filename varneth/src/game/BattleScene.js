// Visual presentation of the deterministic combat simulation (or the hub when idle).
// The scene never decides outcomes: it only renders sim state and sim events.
import Phaser from 'phaser';
import { ENEMIES } from '../../shared/data/enemies.js';
import { RARITIES } from '../../shared/data/rarities.js';
import { BASE_BY_ID } from '../../shared/data/items.js';
import { heroLayers } from './visuals.js';
import { audio } from './audio.js';

const GROUND = 272;
const HERO_FPS = { idle: 6, run: 12, attack: 18, cast: 16, hit: 14, death: 10, victory: 8 };
const ENEMY_FPS = { idle: 5, move: 9, attack: 12, hit: 12, death: 9, special: 9 };
const EL_COLOR = { fire: '#ff9a3a', ice: '#9ad8ff', lightning: '#e0f0ff', poison: '#8aff5a', arcane: '#c8a8ff', bleed: '#ff4a4a', burn: '#ff7a2a', reflect: '#e0d8c0', thorns: '#e0d8c0' };

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }
  preload() {
    const man = this.registry.get('manifest');
    const onProg = this.registry.get('onProgress');
    this.load.on('progress', (v) => onProg?.(v));
    const base = 'assets/';
    for (const [cls, layers] of Object.entries(man.hero.classes)) {
      for (const [k, file] of Object.entries(layers)) this.load.spritesheet(`hero_${cls}_${k}`, base + file, { frameWidth: man.hero.frameW, frameHeight: man.hero.frameH });
    }
    for (const [name, e] of Object.entries(man.enemies)) this.load.spritesheet(`enemy_${name}`, base + e.file, { frameWidth: e.frameW, frameHeight: e.frameH });
    for (const [key, layers] of Object.entries(man.backgrounds)) for (const [l, file] of Object.entries(layers)) this.load.image(`bg_${key}_${l}`, base + file);
    for (const [key, fx] of Object.entries(man.fx)) this.load.spritesheet(key, base + fx.file, { frameWidth: fx.frameW, frameHeight: fx.frameH });
  }
  create() {
    const man = this.registry.get('manifest');
    for (const [name, e] of Object.entries(man.enemies)) {
      for (const a of e.anims) {
        this.anims.create({ key: `enemy_${name}_${a.key}`, frames: this.anims.generateFrameNumbers(`enemy_${name}`, { start: a.start, end: a.start + a.count - 1 }), frameRate: ENEMY_FPS[a.key], repeat: ['idle', 'move'].includes(a.key) ? -1 : 0 });
      }
    }
    for (const [key, fx] of Object.entries(man.fx)) {
      if (fx.count > 1) this.anims.create({ key: `${key}_play`, frames: this.anims.generateFrameNumbers(key, { start: 0, end: fx.count - 1 }), frameRate: 18, repeat: key === 'fx_beam' || key === 'fx_shield' ? -1 : 0 });
    }
    this.scene.start('battle');
  }
}

export class BattleScene extends Phaser.Scene {
  constructor() { super('battle'); }

  create() {
    this.man = this.registry.get('manifest');
    this.settings = this.registry.get('settings');
    this.bgKey = null;
    this.layers = {};
    this.enemySprites = new Map();
    this.projSprites = new Map();
    this.telegraphs = new Map();
    this.texts = [];
    this.hero = null;
    this.heroAnim = { key: 'idle', t: 0, once: false };
    this.mode = 'hub';
    this.scroll = 0;
    this.shieldFx = null;
    this.setBackground('hub');
    this.events.on('shutdown', () => this.enemySprites.clear());
    this.registry.set('scene', this);
    this.registry.get('onSceneReady')?.(this);
  }

  setBackground(key) {
    if (this.bgKey === key) return;
    this.bgKey = key;
    for (const l of Object.values(this.layers)) l.destroy();
    this.layers = {};
    const depth = { sky: -50, far: -40, mid: -30, near: -20, fog: 40 };
    for (const l of ['sky', 'far', 'mid', 'near', 'fog']) {
      const tex = `bg_${key}_${l}`;
      if (!this.textures.exists(tex)) continue;
      const s = this.add.tileSprite(0, 0, 640, 360, tex).setOrigin(0, 0).setDepth(depth[l]);
      if (l === 'fog') s.setAlpha(this.settings.fx === 'low' ? 0.4 : 0.85);
      this.layers[l] = s;
    }
  }

  // ---------------------------------------------------------------- hero
  setHero(char, equipped) {
    if (this.hero) this.hero.destroy();
    if (!char) { this.hero = null; return; }
    const { layers, scaleX } = heroLayers(char.cls, char.appearance, equipped || {});
    const c = this.add.container(140, GROUND + 2).setDepth(10);
    c.sprites = layers.filter((l) => this.textures.exists(l.tex)).map((l) => {
      const s = this.add.sprite(0, 0, l.tex, 0).setOrigin(0.5, 1);
      if (l.tint != null) s.setTint(l.tint);
      c.add(s);
      return s;
    });
    c.setScale(scaleX, 1);
    c.cls = char.cls;
    c.shadow = this.add.image(140, GROUND + 1, 'shadow').setDepth(5);
    this.hero = c;
    this.heroAnim = { key: 'idle', t: 0, once: false };
  }

  playHero(key, once = true, duration = null) {
    const a = this.man.hero.anims.find((x) => x.key === key);
    if (!a) return;
    this.heroAnim = { key, t: 0, once, fps: duration ? a.count / duration : HERO_FPS[key] };
  }

  heroFrame(dt) {
    if (!this.hero) return;
    const ha = this.heroAnim;
    const a = this.man.hero.anims.find((x) => x.key === ha.key);
    ha.t += dt * (ha.fps || HERO_FPS[ha.key]);
    let f = Math.floor(ha.t);
    if (f >= a.count) {
      if (ha.once && ha.key !== 'death') { this.heroAnim = { key: this.heroLoop || 'idle', t: 0, once: false }; return this.heroFrame(0); }
      f = ha.key === 'death' ? a.count - 1 : f % a.count;
    }
    const frame = a.start + f;
    for (const s of this.hero.sprites) s.setFrame(frame);
  }

  // ---------------------------------------------------------------- sim binding
  bindSim(sim, opts = {}) {
    this.clearBattle();
    this.mode = 'battle';
    this.sim = sim;
    this.setBackground(opts.bg || 'meadow_road');
    if (this.hero) { this.hero.x = sim.p.x; this.hero.setAlpha(1); }
    this.heroLoop = 'idle';
  }

  setHub() {
    this.clearBattle();
    this.mode = 'hub';
    this.sim = null;
    this.setBackground('hub');
    if (this.hero) { this.hero.x = 320; this.hero.setAlpha(1); this.hero.scaleX = Math.abs(this.hero.scaleX); this.playHero('idle', false); }
  }

  clearBattle() {
    for (const s of this.enemySprites.values()) { s.spr.destroy(); s.bar?.destroy(); s.label?.destroy(); s.shadow?.destroy(); }
    this.enemySprites.clear();
    for (const p of this.projSprites.values()) p.destroy();
    this.projSprites.clear();
    for (const t of this.telegraphs.values()) t.destroy();
    this.telegraphs.clear();
    if (this.shieldFx) { this.shieldFx.destroy(); this.shieldFx = null; }
  }

  syncFromSim(sim) { this.sim = sim; }

  enemySprite(e) {
    let s = this.enemySprites.get(e.id);
    if (s) return s;
    const tpl = ENEMIES[e.tpl];
    const key = `enemy_${tpl.sprite}`;
    const spr = this.add.sprite(e.x, GROUND + 2, key, 0).setOrigin(0.5, 1).setDepth(8);
    if (e.tier === 'champion') spr.preFX?.addGlow?.(0xffd040, 2, 0, false);
    const shadow = this.add.image(e.x, GROUND + 1, 'shadow').setDepth(4).setScale(Math.max(0.6, tpl.w / 40), 1);
    s = { spr, anim: null, shadow, tpl, flash: 0 };
    if (e.tier !== 'normal') {
      s.bar = this.add.graphics().setDepth(30);
      const color = { elite: '#ffcf6a', champion: '#ffd040', boss: '#ff6a4a' }[e.tier];
      s.label = this.add.text(e.x, 0, tpl.name, { fontFamily: 'Georgia, serif', fontSize: '10px', color, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(31);
    }
    spr.on('animationcomplete', () => { if (!s.dead) s.anim = null; });
    this.enemySprites.set(e.id, s);
    return s;
  }

  playEnemy(s, key) {
    const name = `enemy_${s.tpl.sprite}_${key}`;
    if (s.anim === key && (key === 'idle' || key === 'move')) return;
    s.anim = key;
    s.spr.play(name, true);
  }

  // ---------------------------------------------------------------- events
  handleEvents(events) {
    const S = this.settings;
    for (const e of events) {
      switch (e.k) {
        case 'attack':
          if (e.id === 0) { this.playHero('attack', true, Math.min(0.45, 0.9 / (this.sim?.p.stats.aps || 1))); if (this.sim?.p.stats.cls === 'warrior') audio.sfx('slash'); else if (this.sim?.p.stats.cls === 'ranger') audio.sfx('arrow'); }
          else { const s = this.enemySprites.get(e.id); if (s) this.playEnemy(s, e.special ? 'special' : 'attack'); }
          break;
        case 'cast':
          if (e.id === 0) this.playHero(['iron_will', 'leap_back', 'spell_shield', 'first_aid'].includes(e.skill) ? 'hit' : 'cast', true, Math.max(0.25, e.t));
          break;
        case 'skill': this.skillFx(e); break;
        case 'hit': this.onHit(e); break;
        case 'miss': this.floatText(this.posOf(e.dst), 'Kaçındı', '#c8d0ff', 9); break;
        case 'block': this.floatText(this.posOf(e.dst), 'Blok', '#e0d8c0', 9); this.spawnFx('fx_impact', this.posOf(e.dst).x, GROUND - 28, 0.6); break;
        case 'absorb': break;
        case 'heal': if (e.amt > 0 && S.numbers !== 'none') this.floatText(this.posOf(0), '+' + e.amt, '#6aff8a', 10); break;
        case 'kill': this.onKill(e); break;
        case 'proj': this.spawnProj(e); break;
        case 'telegraph': this.addTelegraph(e); audio.sfx('telegraph'); break;
        case 'telegraph_fire': this.fireTelegraph(e); break;
        case 'phase': if (e.text) this.registry.get('onBanner')?.(e.text); { const s = this.enemySprites.get(e.id); if (s) this.playEnemy(s, 'special'); } this.shake(0.006, 300); break;
        case 'announce': this.registry.get('onBanner')?.(e.text, e.tone); break;
        case 'player_death': this.playHero('death', true); this.heroLoop = 'death'; audio.sfx('player_death'); break;
        case 'respawn': this.heroLoop = 'idle'; this.playHero('idle', false); if (this.hero) { this.hero.setAlpha(0); this.tweens.add({ targets: this.hero, alpha: 1, duration: 500 }); } break;
        case 'guard': { const s = this.enemySprites.get(e.id); if (s) { this.playEnemy(s, 'special'); s.spr.setTint(0xa0a8ff); this.time.delayedCall(e.t * 1000, () => s.spr.clearTint()); } break; }
        case 'lunge': { const s = this.enemySprites.get(e.id); if (s) this.playEnemy(s, 'attack'); break; }
        case 'fx': this.genericFx(e); break;
        case 'stage': this.registry.get('onBanner')?.(`${e.name} (${e.idx + 1}/${e.total})`, 'stage'); break;
        case 'status': if (e.status === 'won') { this.heroLoop = 'victory'; this.playHero('victory', false); } break;
        case 'retreat': this.registry.get('onBanner')?.('Çok fazla ölüm — daha güvenli bölgeye çekiliyor', 'warn'); break;
        case 'counter': this.floatText(this.posOf(0), 'Karşı!', '#ffd77a', 9); break;
        default: break;
      }
    }
  }

  posOf(id) {
    if (id === 0 || id === -1) return { x: this.hero ? this.hero.x : 140, y: GROUND - 48 };
    const s = this.enemySprites.get(id);
    if (!s) return { x: 400, y: GROUND - 40 };
    return { x: s.spr.x, y: GROUND - s.spr.displayHeight * 0.8 };
  }

  onHit(e) {
    const S = this.settings;
    const p = this.posOf(e.dst);
    if (e.dst === 0) {
      if (this.hero) { this.hero.sprites.forEach((s) => s.setTintFill(0xffffff)); this.time.delayedCall(60, () => this.restoreHeroTint()); }
      if (S.numbers === 'all') this.floatText(p, '-' + e.dmg, '#ff6a5a', 10);
      if (this.sim && e.dmg > this.sim.p.stats.maxHp * 0.12) { this.playHero('hit', true); this.shake(0.004, 120); }
      return;
    }
    const s = this.enemySprites.get(e.dst);
    if (s) {
      s.spr.setTintFill(0xffffff);
      this.time.delayedCall(50, () => s.spr && s.spr.active && s.spr.clearTint());
      if (!e.dot && !s.dead && (!s.anim || s.anim === 'idle' || s.anim === 'move')) this.playEnemy(s, 'hit');
    }
    if (S.numbers === 'none' || (S.numbers === 'crits' && !e.crit)) return;
    const col = e.crit ? '#ffd040' : e.el ? EL_COLOR[e.el] || '#ffffff' : '#ffffff';
    this.floatText(p, (e.crit ? '' : '') + e.dmg + (e.crit ? '!' : ''), col, e.crit ? 14 : e.dot ? 8 : 10);
    if (e.crit) { audio.sfx('crit'); this.shake(0.003, 80); if (S.fx !== 'low') this.spawnFx('fx_impact', p.x, p.y + 10, 0.8); }
    else if (!e.dot) audio.sfx('hit');
  }

  restoreHeroTint() {
    if (!this.hero) return;
    const char = this.registry.get('heroChar');
    const { layers } = heroLayers(this.hero.cls, char?.appearance, this.registry.get('heroEquip') || {});
    const ls = layers.filter((l) => this.textures.exists(l.tex));
    this.hero.sprites.forEach((s, i) => { s.clearTint(); if (ls[i]?.tint != null) s.setTint(ls[i].tint); });
  }

  onKill(e) {
    const s = this.enemySprites.get(e.id);
    if (s) { s.dead = true; this.playEnemy(s, 'death'); s.bar?.clear(); s.label?.destroy(); s.label = null; }
    audio.sfx('death');
    if (this.settings.numbers !== 'none' && e.gold) this.floatText({ x: e.x, y: GROUND - 20 }, '+' + e.gold + 'g', '#ffd77a', 8);
    for (const l of e.loot || []) {
      if (l.t !== 'item') continue;
      const r = l.item.rarity;
      const col = Phaser.Display.Color.HexStringToColor(RARITIES[r].color).color;
      if (r >= 2 || this.settings.fx !== 'low') {
        const beam = this.add.sprite(e.x, GROUND + 2, 'fx_beam').setOrigin(0.5, 1).setDepth(20).setTint(col).setBlendMode(Phaser.BlendModes.ADD);
        beam.setScale(r >= 4 ? 1.6 : r >= 3 ? 1.2 : 0.8, r >= 4 ? 1.4 : r >= 3 ? 1 : 0.6);
        beam.play('fx_beam_play');
        this.tweens.add({ targets: beam, alpha: 0, delay: r >= 4 ? 3500 : 1500, duration: 800, onComplete: () => beam.destroy() });
      }
      const name = BASE_BY_ID[l.item.base_id]?.name || '';
      this.floatText({ x: e.x, y: GROUND - 60 }, name, RARITIES[r].color, r >= 4 ? 12 : 9, 1800);
      audio.sfx(r >= 4 ? 'legendary' : r >= 2 ? 'rare' : 'item');
      if (r >= 4) this.shake(0.008, 400);
    }
  }

  spawnProj(e) {
    const kindTex = { arrow: 'pr_arrow', arrow_poison: 'pr_arrow_poison', bolt: 'pr_bolt', fireball: 'pr_fireball', ember: 'pr_ember', spit: 'pr_spit', sap: 'pr_sap', spore: 'pr_spore' }[e.kind] || 'pr_bolt';
    const spr = this.add.image(e.x, GROUND - (e.from === 0 ? 30 : 26), kindTex).setDepth(15);
    if (e.kind === 'fireball') audio.sfx('fire');
    this.projSprites.set(e.pid, spr);
  }

  addTelegraph(e) {
    const g = this.add.graphics().setDepth(3);
    g.data0 = { a: e.a, b: e.b, total: e.t, t0: this.time.now };
    this.telegraphs.set(e.tid, g);
    if (e.name && e.owner > 0) this.floatText({ x: (e.a + e.b) / 2, y: GROUND - 90 }, e.name, '#ff8a6a', 10, 1200);
  }

  fireTelegraph(e) {
    const g = this.telegraphs.get(e.tid);
    if (g) { g.destroy(); this.telegraphs.delete(e.tid); }
    const flash = this.add.rectangle((e.a + e.b) / 2, GROUND, Math.max(4, e.b - e.a), 26, 0xff5a2a, 0.55).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: flash, alpha: 0, scaleY: 2, duration: 350, onComplete: () => flash.destroy() });
    if (this.settings.fx !== 'low') this.spawnFx('fx_impact', (e.a + e.b) / 2, GROUND - 10, 1.2);
    this.shake(0.005, 160);
  }

  skillFx(e) {
    const hx = this.hero ? this.hero.x : e.px;
    const face = e.facing || 1;
    const low = this.settings.fx === 'low';
    switch (e.skill) {
      case 'cleave': case 'execute': case 'blood_rush': {
        const fx = this.spawnFx('fx_slash', e.x, GROUND - 32, 1.1);
        if (fx && e.skill === 'blood_rush') fx.setTint(0xff3a3a);
        if (fx && e.skill === 'execute') fx.setTint(0xffd040);
        if (!low) this.sparks(e.x, GROUND - 30, 0xfff0c0, 8);
        audio.sfx('slash');
        break;
      }
      case 'whirlwind':
        for (let i = 0; i < (low ? 1 : 3); i++) this.time.delayedCall(i * 90, () => { const f = this.spawnFx('fx_slash', hx, GROUND - 28, 1.6); if (f) f.setAngle(i * 120); });
        audio.sfx('slash');
        break;
      case 'ground_slam':
        this.spawnFx('fx_impact', hx + face * 20, GROUND - 6, 2);
        if (!low) this.sparks(hx + face * 20, GROUND - 4, 0xc8a070, 16);
        this.shake(0.01, 250); audio.sfx('crit');
        break;
      case 'iron_will': if (this.hero) { this.hero.sprites.forEach((s) => s.setTint(0x9ab0ff)); this.time.delayedCall(5000, () => this.restoreHeroTint()); } this.sparks(hx, GROUND - 30, 0xb0c0ff, 10); break;
      case 'leap_back': this.sparks(hx, GROUND - 2, 0x8a7a60, 10); break;
      case 'first_aid': { const f = this.spawnFx('fx_heal', hx, GROUND - 30, 1.2); audio.sfx('heal'); if (f) f.setDepth(16); break; }
      case 'frost_wave': { const f = this.spawnFx('fx_ice', hx + face * 60, GROUND - 22, 1.3); if (f && face < 0) f.setFlipX(true); audio.sfx('ice'); break; }
      case 'mana_drain': {
        const g = this.add.graphics().setDepth(16);
        g.lineStyle(2, 0xb48aff, 0.9).lineBetween(e.x, GROUND - 30, hx, GROUND - 34);
        this.tweens.add({ targets: g, alpha: 0, duration: 400, onComplete: () => g.destroy() });
        break;
      }
      case 'spell_shield':
        if (this.shieldFx) this.shieldFx.destroy();
        this.shieldFx = this.add.sprite(hx, GROUND + 2, 'fx_shield').setOrigin(0.5, 1).setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
        this.shieldFx.play('fx_shield_play');
        break;
      case 'meteor': case 'arrow_rain': case 'hunter_trap': break; // delayed fx events follow
      default: break;
    }
  }

  genericFx(e) {
    const low = this.settings.fx === 'low';
    switch (e.fx) {
      case 'meteor': {
        const m = this.add.image(e.x - 80, -20, 'fx_meteor').setDepth(25).setScale(1.5);
        this.tweens.add({ targets: m, x: e.x, y: GROUND - 10, duration: 220, onComplete: () => { m.destroy(); this.spawnFx('fx_explosion', e.x, GROUND - 24, 2.2); this.shake(0.012, 300); audio.sfx('fire'); } });
        break;
      }
      case 'arrow_rain':
        for (let i = 0; i < (low ? 4 : 10); i++) {
          const a = this.add.image(e.x + (i - 5) * 9, -10 - i * 12, 'pr_arrow').setAngle(80).setDepth(16);
          this.tweens.add({ targets: a, y: GROUND - 4, duration: 180 + i * 15, onComplete: () => a.destroy() });
        }
        audio.sfx('arrow');
        break;
      case 'hunter_trap': this.spawnFx('fx_impact', e.x, GROUND - 6, 1.4); this.sparks(e.x, GROUND - 4, 0xc0c8d0, 10); break;
      case 'chain': {
        const ids = [0, ...(e.ids || [])];
        const g = this.add.graphics().setDepth(17).setBlendMode(Phaser.BlendModes.ADD);
        for (let k = 0; k < ids.length - 1; k++) {
          const a = this.posOf(ids[k]); const b = this.posOf(ids[k + 1]);
          this.lightning(g, a.x, a.y + 14, b.x, b.y + 14);
        }
        this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
        audio.sfx('lightning');
        break;
      }
      case 'mini_lightning': {
        const g = this.add.graphics().setDepth(17).setBlendMode(Phaser.BlendModes.ADD);
        this.lightning(g, e.x, 0, e.x, GROUND - 20);
        this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
        break;
      }
      case 'poison_spread': if (!low) this.spawnFx('fx_poison', e.x, GROUND - 20, 0.8); break;
      case 'roots': this.sparks(e.x, GROUND - 6, 0x7fd04f, 14); break;
      case 'spark_burst': this.spawnFx('fx_explosion', e.x, GROUND - 26, 0.8); break;
      case 'arcane_empower': this.sparks(e.x, GROUND - 40, 0x7ff0ff, 12); break;
      default: break;
    }
  }

  lightning(g, x1, y1, x2, y2) {
    g.lineStyle(3, 0x6ab0ff, 0.6);
    const pts = [];
    const n = 7;
    for (let i = 0; i <= n; i++) pts.push({ x: x1 + (x2 - x1) * i / n + (i % n ? (Math.random() - 0.5) * 12 : 0), y: y1 + (y2 - y1) * i / n + (i % n ? (Math.random() - 0.5) * 10 : 0) });
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y); for (const p of pts) g.lineTo(p.x, p.y); g.strokePath();
    g.lineStyle(1, 0xffffff, 1);
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y); for (const p of pts) g.lineTo(p.x, p.y); g.strokePath();
  }

  spawnFx(key, x, y, scale = 1) {
    if (!this.textures.exists(key)) return null;
    const f = this.add.sprite(x, y, key).setDepth(18).setScale(scale).setBlendMode(Phaser.BlendModes.ADD);
    if (this.anims.exists(key + '_play')) { f.play(key + '_play'); f.on('animationcomplete', () => f.destroy()); }
    else this.tweens.add({ targets: f, alpha: 0, duration: 400, onComplete: () => f.destroy() });
    return f;
  }

  sparks(x, y, color, n) {
    if (this.settings.fx === 'low') n = Math.ceil(n / 3);
    else if (this.settings.fx === 'medium') n = Math.ceil(n / 1.6);
    for (let i = 0; i < n; i++) {
      const d = this.add.image(x, y, 'dot').setTint(color).setDepth(19).setScale(0.6 + Math.random() * 0.6);
      const a = Math.random() * Math.PI * 2;
      const r = 10 + Math.random() * 22;
      this.tweens.add({ targets: d, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.7 - 6, alpha: 0, duration: 350 + Math.random() * 300, onComplete: () => d.destroy() });
    }
  }

  floatText(p, str, color, size = 10, dur = 900) {
    const t = this.add.text(p.x + (Math.random() - 0.5) * 10, p.y, str, { fontFamily: '"DejaVu Sans", Verdana, sans-serif', fontStyle: 'bold', fontSize: size + 'px', color, stroke: '#140c14', strokeThickness: 3 }).setOrigin(0.5).setDepth(50);
    t.setResolution(2);
    this.tweens.add({ targets: t, y: p.y - 22, alpha: { from: 1, to: 0 }, ease: 'Cubic.easeOut', duration: dur, onComplete: () => t.destroy() });
  }

  shake(intensity, dur) {
    if (!this.settings.shake) return;
    this.cameras.main.shake(dur, intensity);
  }

  // ---------------------------------------------------------------- per-frame render
  update(time, delta) {
    const dt = delta / 1000;
    this.registry.get('onFrame')?.(dt);
    const sim = this.sim;
    if (this.layers.fog) this.layers.fog.tilePositionX += dt * 6;
    if (this.mode === 'battle' && sim) {
      const p = sim.p;
      // parallax: travel scroll + hero position
      const scroll = sim.scroll * 1.0;
      this.scroll += (scroll - this.scroll) * Math.min(1, dt * 8);
      if (this.layers.far) this.layers.far.tilePositionX = this.scroll * 0.15;
      if (this.layers.mid) this.layers.mid.tilePositionX = this.scroll * 0.4;
      if (this.layers.near) this.layers.near.tilePositionX = this.scroll * 1.0;
      if (this.layers.fog) this.layers.fog.tilePositionX = this.scroll * 1.2 + time * 0.006;
      if (this.hero) {
        this.hero.x += (p.x - this.hero.x) * Math.min(1, dt * 14);
        const sx = Math.abs(this.hero.scaleX);
        this.hero.scaleX = p.facing < 0 ? -sx : sx;
        this.hero.shadow.x = this.hero.x;
        // state -> loop animation
        if (this.heroLoop !== 'death' && this.heroLoop !== 'victory') {
          const moving = ['APPROACH', 'REPOSITION', 'EVADE_TELEGRAPH', 'TRAVEL'].includes(p.state);
          const loop = p.state === 'DYING' ? 'death' : moving ? 'run' : 'idle';
          if (loop !== this.heroLoop) { this.heroLoop = loop; if (!this.heroAnim.once || loop === 'death') this.playHero(loop, loop === 'death'); }
        } else if (this.heroLoop === 'death' && p.state !== 'DYING' && sim.status === 'running') { this.heroLoop = 'idle'; }
        if (this.shieldFx) { this.shieldFx.x = this.hero.x; if (p.shield <= 0) { this.shieldFx.destroy(); this.shieldFx = null; } }
      }
      // enemies
      const seen = new Set();
      for (const e of sim.e) {
        seen.add(e.id);
        const s = this.enemySprite(e);
        s.spr.x += (e.x - s.spr.x) * Math.min(1, dt * 14);
        s.spr.setFlipX(e.facing < 0);
        s.shadow.x = s.spr.x;
        if (!s.dead) {
          if (!s.anim || s.anim === 'idle' || s.anim === 'move') this.playEnemy(s, e.state === 'APPROACH' || e.state === 'REPOSITION' ? 'move' : 'idle');
          if (e.casting && s.anim !== 'special' && s.anim !== 'attack') this.playEnemy(s, 'special');
          if (s.bar) {
            const w = e.tier === 'boss' ? 0 : 36;
            s.bar.clear();
            if (w) {
              const y = GROUND - s.spr.displayHeight - 4;
              s.bar.fillStyle(0x000000, 0.8).fillRect(s.spr.x - w / 2 - 1, y - 1, w + 2, 5);
              s.bar.fillStyle(0xd04a2a, 1).fillRect(s.spr.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 3);
            }
            if (s.label) { s.label.x = s.spr.x; s.label.y = GROUND - s.spr.displayHeight - (w ? 6 : 2); }
          }
          const slowed = e.slowT > 0, poisoned = e.dots.some((d) => d.kind === 'poison'), burning = e.dots.some((d) => d.kind === 'burn');
          if (!s.spr.isTinted || s.tintState) {
            const want = slowed ? 0x9ad8ff : poisoned ? 0x9aff7a : burning ? 0xffb07a : null;
            if (want !== s.tintState) { s.tintState = want; if (want) s.spr.setTint(want); else s.spr.clearTint(); }
          }
        }
      }
      for (const [id, s] of this.enemySprites) {
        if (!seen.has(id)) {
          this.tweens.add({ targets: [s.spr, s.shadow], alpha: 0, duration: 300, onComplete: () => { s.spr.destroy(); s.shadow.destroy(); } });
          s.bar?.destroy(); s.label?.destroy();
          this.enemySprites.delete(id);
        }
      }
      // projectiles
      const live = new Set();
      for (const pr of sim.proj) {
        live.add(pr.id);
        const spr = this.projSprites.get(pr.id);
        if (!spr) continue;
        spr.x += (pr.x - spr.x) * Math.min(1, dt * 20);
        const tx = pr.to === 0 ? p.x : (sim.e.find((x) => x.id === pr.to)?.x ?? pr.x);
        spr.setFlipX(tx < pr.x);
      }
      for (const [id, spr] of this.projSprites) {
        if (!live.has(id)) {
          if (spr.texture.key === 'pr_fireball') this.spawnFx('fx_explosion', spr.x, spr.y, 1.1);
          spr.destroy(); this.projSprites.delete(id);
        }
      }
      // telegraphs
      for (const [id, g] of this.telegraphs) {
        const d = g.data0;
        const k = Math.min(1, (this.time.now - d.t0) / (d.total * 1000));
        g.clear();
        g.fillStyle(0xff2a1a, 0.12 + 0.25 * k).fillRect(d.a, GROUND - 8, d.b - d.a, 14);
        g.lineStyle(1, 0xff6a4a, 0.9).strokeRect(d.a, GROUND - 8, d.b - d.a, 14);
        g.fillStyle(0xffaa3a, 0.5).fillRect(d.a, GROUND - 8, (d.b - d.a) * k, 2);
        if (k >= 1.3) { g.destroy(); this.telegraphs.delete(id); }
      }
    } else if (this.mode === 'hub') {
      if (this.layers.far) this.layers.far.tilePositionX += dt * 2;
    }
    this.heroFrame(dt);
  }
}
