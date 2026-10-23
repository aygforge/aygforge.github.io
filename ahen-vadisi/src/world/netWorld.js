// Ortak dünya (oyun sunucusu) görüntüsü: sunucudaki yaratıkları NetEnemy olarak çizer, telegraf/tehlike/mermi
// olaylarını oynatır, sunucudan gelen isabeti oyuncunun kendi savunmasıyla uygular, ölümde paylaşılan ödülü verir.
// Bu haritada sunucu bağlıyken kamp yaratıkları ve elitler yerelde doğmaz (Spawner.net). Boss'lar, görev avları,
// sunak dalgaları ve görev olayları kişiseldir (yalnız sen görürsün) — yerelde kalır.
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { ENEMIES } from '../data/enemies.js';
import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy.js';
import { applyKill } from '../systems/rewards.js';
import { claimBossLoot, bossKillId, dungeonOfBoss, breakSeal, clearStage, getRun, bossStage } from '../systems/dungeon.js';
import { onDungeonStage } from '../systems/quests.js';
import { net } from '../online/gameServer.js';
import { sound } from '../audio/sound.js';

const SNAP_PX = 6 * 32;        // bundan büyük sıçrama: ışınla (dalış, eve dönüş)
const ZONE_WAIT_MS = 4000;     // bölge bilgisi gelmezse yerel moda dön

export class NetEnemy extends Enemy {
  constructor(scene, full) {
    super(scene, ENEMIES[full.tpl], full.x, full.y, {});
    this.net = true;
    this.netId = full.id;
    this.maxHp = full.mhp; this.hp = full.hp;
    this.tx = full.x; this.ty = full.y;
    this.setFacing(full.f || 1);
    this.flags = 0; this.netTint = 0; this.netPhase = 0; this.netAura = 0;
    this.stage = full.st || 0;
    this.summoned = !!full.sm;
    // boss çubuğu faz ve kalkan bilgisini sunucudan okur (istemci boss davranışı çalışmaz)
    this.behavior = { phase: () => this.netPhase || 1, update: () => false, reset() {}, onDeath: () => this.aura?.destroy() };
    // oyuncunun becerileri yavaşlatma/sersemletmeyi yerel alanlara yazar → sunucuya da bildir
    let slowUntil = 0, stunUntil = 0;
    Object.defineProperty(this, 'slowUntil', { get: () => slowUntil, set: (v) => { slowUntil = v; this.queueEffect(); }, configurable: true });
    Object.defineProperty(this, 'stunUntil', { get: () => stunUntil, set: (v) => { stunUntil = v; this.queueEffect(); }, configurable: true });
    this.drawBar();
  }

  queueEffect() {
    if (this.effectQueued || !this.scene) return;
    this.effectQueued = true;
    queueMicrotask(() => {
      this.effectQueued = false;
      if (this.dead) return;
      const now = this.scene.clock, s = {};
      if (this.slowUntil > now) s.slow = [this.slowPct || 0.2, Math.round(this.slowUntil - now)];
      if (this.stunUntil > now) s.stun = Math.round(this.stunUntil - now);
      if (s.slow || s.stun) net.effect(this.netId, s);
    });
  }

  // yapay zekâ sunucuda; yerelde yalnız saldırganlık işareti (hedef çubuğu vb. için)
  aggro() {}
  onDamaged() {
    if (this.hasHurt && this.tpl.kind !== 'boss') { this.sprite.play(this.animKey + '_hurt'); this.hurtUntil = this.scene.clock + 180; }
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => { if (!this.dead) this.applyTint(); });
    this.drawBar();
  }
  applyTint() {
    this.sprite.clearTint();
    const t = this.netTint || this.baseTint;
    if (t) this.sprite.setTint(t);
  }

  applySnap(s) {
    const [, x, y, hp, f, fl, red, tint, phase, aura, dm, mhp] = s;
    if (mhp) this.maxHp = mhp;   // parti dungeon'unda boss canı parti gücüne göre ölçeklenir
    this.netPhase = phase || 0;
    if (dm != null) { const k = dm / 100; this.def = Math.round(this.tpl.def * k); this.mdef = Math.round(this.tpl.mdef * k); }
    if ((aura || 0) !== this.netAura) this.setAura(aura || 0);
    this.tx = x; this.ty = y;
    if (hp < this.hp) this.onDamaged();
    this.hp = hp;
    this.flags = fl;
    this.engaged = !!(fl & 2);
    this.reduce = (red || 0) / 100;
    if (f) this.facingNet = f;
    if ((tint || 0) !== this.netTint) { this.netTint = tint || 0; this.applyTint(); }
    this.sprite.setAlpha(fl & 4 ? 0.5 : 1);
    this.drawBar();
  }

  // kalkan / bayrak parıltısı
  setAura(color) {
    this.netAura = color;
    this.aura?.destroy(); this.aura = null;
    if (!color) return;
    this.aura = this.scene.add.image(0, -this.height / 2, 'light_white').setScale(this.tpl.kind === 'boss' ? 2 : 1.4).setAlpha(0.5).setTint(color).setBlendMode(Phaser.BlendModes.ADD);
    this.container.addAt(this.aura, 0);
  }

  update(dt) {
    if (this.dead) return;
    const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
    if (d > SNAP_PX) { this.x = this.tx; this.y = this.ty; }
    else if (d > 0.5) { const k = Math.min(1, dt * 12); this.x += dx * k; this.y += dy * k; }
    const moving = !!(this.flags & 1) || d > 3;
    if (Math.abs(dx) > 1) this.setFacing(dx); else if (this.facingNet) this.setFacing(this.facingNet);
    const cur = this.sprite.anims.currentAnim?.key || '';
    const busy = cur.endsWith('_atk') && this.sprite.anims.isPlaying;
    if (!busy) this.playAnim(moving ? 'walk' : 'idle');
    this.sync();
  }

  netDie() {
    if (this.dead) return;
    const p = this.scene.player;
    if (p?.target === this) { p.target = null; if (!p.interact) p.approaching = false; bus.emit('target', null); }
    this.die();
  }

  // görünürlükten çıktı: ödülsüz, sessiz kaldır
  vanish() {
    if (this.dead) return;
    const p = this.scene.player;
    if (p?.target === this) { p.target = null; if (!p.interact) p.approaching = false; bus.emit('target', null); }
    this.dead = true;
    this.destroy();
  }
}

export class NetWorld {
  constructor(scene) {
    this.scene = scene;
    this.byId = new Map();
    this.hz = new Map();
    this.players = [];       // [uid, x, y, f, mv, hp, d, a, lv, cls, nick, name]
    this.playersAt = 0;
    this.active = false;
    this.waitSince = 0;
  }

  // sahne açılırken: sunucu bağlıysa ve harita ortaksa yaratıklar sunucudan beklenir (yerel kamp yaratığı doğmaz)
  get expectShared() { return net.ready; }

  attach(m) {
    if (m.map !== this.scene.mapId) return;
    this.clear();
    this.active = true;
    this.scene.spawner.goNet();
    for (const e of m.e) this.add(e);
    if (m.dg) this.syncDungeon(m.dg, true);
    bus.emit('netWorld', true);
  }

  detach() {
    if (!this.active && !this.waitSince) return;
    this.clear();
    this.active = false; this.waitSince = 0;
    this.players = [];
    if (this.scene.spawner?.net) this.scene.spawner.goLocal();
    bus.emit('netWorld', false);
  }

  clear() {
    for (const e of this.byId.values()) e.vanish();
    this.byId.clear();
  }

  add(full) {
    if (this.byId.has(full.id) || !ENEMIES[full.tpl]) return null;
    const e = new NetEnemy(this.scene, full);
    this.byId.set(full.id, e);
    this.scene.enemies.push(e);
    return e;
  }

  snap(m) {
    if (!this.active) return;
    for (const f of m.n || []) this.add(f);
    for (const s of m.e || []) this.byId.get(s[0])?.applySnap(s);
    for (const id of m.g || []) { const e = this.byId.get(id); if (e) { e.vanish(); this.byId.delete(id); } }
    if (m.p) { this.players = m.p; this.playersAt = Date.now(); }
  }

  // diğer oyuncular (RemotePlayers bunları çizer)
  remoteList() {
    const now = Date.now();
    return this.players.map(([uid, x, y, f, mv, hp, d, a, lv, cls, nick, n]) => ({
      uid, nick, fresh: true, net: true,
      st: { m: this.scene.mapId, x, y, f, mv, hp, d, a, lv, cls, n, at: this.playersAt || now },
    }));
  }

  update() {
    // sunucu bağlı ama bölge bilgisi gelmedi: bir süre bekle, gelmezse yerel moda dön
    if (!this.active && this.scene.spawner?.net && this.waitSince && Date.now() - this.waitSince > ZONE_WAIT_MS) this.detach();
  }

  // ---------------------------------------------------------------- olaylar
  events(list) {
    if (!this.active) return;
    const sc = this.scene, fx = sc.fx, cb = sc.combat;
    for (const ev of list) {
      try {
        switch (ev.k) {
          case 'tg': fx.telegraph(ev.s, ev.ms, ev.c); break;
          case 'fx': this.fxEvent(ev); break;
          case 'tx': fx.text(ev.x, ev.y, ev.s, { color: ev.c, size: ev.z || 13 }); if (ev.snd) sound.play(ev.snd); break;
          case 'hz': { const hz = cb.groundHazard({ x: ev.x, y: ev.y, r: ev.r, dur: ev.dur, warn: ev.warn, key: ev.key, tint: ev.tint, visual: true }); if (ev.id) this.hz.set(ev.id, hz); break; }
          case 'hzc': for (const id of ev.ids || []) { const hz = this.hz.get(id); if (hz) { hz.warn = 0; hz.left = 0; this.hz.delete(id); } } break;
          case 'ann': fx.text(ev.x, ev.y - 90, ev.s, { color: ev.c, size: 16, rise: 26, dur: 1800 }); bus.emit('bossAnnounce', ev.s); break;
          case 'sh': cb.fallingShard({ x: ev.x, y: ev.y, r: ev.r, delay: ev.delay, style: ev.style, visual: true }); break;
          case 'pj': this.projectile(ev); break;
          case 'a': this.byId.get(ev.e)?.playAnim('atk'); break;
          case 'eh': this.hitMe(ev); break;
          case 'die': { const e = this.byId.get(ev.e); if (e) { e.netDie(); this.byId.delete(ev.e); } break; }
          case 'kill': this.reward(ev); break;
          case 'note': bus.emit('toast', { text: ev.s, kind: ev.kind || 'info' }); break;
          case 'dg': this.dungeonEvent(ev); break;
          case 'qe': { const o = this.objOf(ev.id); if (!o) break; if (ev.op === 'start') o.netStart?.(ev); else if (ev.op === 'done') o.netDone?.(ev); else if (ev.op === 'fail') o.netFail?.(ev); break; }
          case 'qeo': this.objOf(ev.id)?.netState?.(ev); break;
          case 'alt': { const o = this.objOf(ev.id); if (!o) break; if (ev.op === 'start') o.netStart?.(); else o.netEnd?.(ev.op === 'done'); break; }
          default: break;
        }
      } catch (err) {
        console.error('[Ahen] sunucu olayı işlenemedi', ev.k, err);
      }
    }
  }

  fxEvent(ev) {
    const sc = this.scene, o = ev.o || {};
    if (ev.key === 'beam_line') sc.combat.beamFlash?.(ev.x, ev.y, o.angle, o.len, o.width, o.tint);
    else if (ev.key === 'none') { /* yalnız ses/sarsıntı */ }
    else if (ev.key === 'burst') sc.fx.burst(ev.x, ev.y, o.tint || 0xffffff, o.n || 18, 160, 500);
    else if (!sc.textures.exists('fx_' + ev.key)) { /* bilinmeyen efekt: çizme */ }
    else {
      sc.fx.sprite(ev.key, ev.x, ev.y, { scale: o.scale || 1, rotation: o.rotation || 0, tint: o.tint || null });
      if (o.twin) sc.fx.sprite(ev.key, ev.x, ev.y, { scale: o.scale || 1, rotation: Math.PI, tint: o.tint || null });
    }
    if (o.snd) sound.play(o.snd);
    if (o.shake && this.near(ev.x, ev.y, 8 * 32)) sc.fx.shake(o.shake > 1 ? 0.014 : 0.006, o.shake > 1 ? 400 : 160);
  }

  objOf(id) { return this.scene.objects.find((o) => o.o?.id === id) || null; }

  near(x, y, r) { const p = this.scene.player; return p && Math.hypot(p.x - x, p.y - y) <= r; }

  projectile(ev) {
    const e = this.byId.get(ev.e);
    if (!e || e.dead) return;
    const sc = this.scene;
    const to = ev.to === net.uid ? sc.player : sc.remote?.ghostOf(ev.to);
    if (!to) return;
    sound.play('bolt', { vol: 0.6 });
    const pr = sc.combat.projectile(e, to, ev.key, 300, () => {});
    pr.s.setPosition(e.x + e.facing * 10, e.y - e.height * 0.6);
  }

  // sunucu: "bu yaratık seni vurdu" — hasar oyuncunun kendi istatistikleriyle hesaplanır
  hitMe(ev) {
    const sc = this.scene, cb = sc.combat;
    const e = this.byId.get(ev.e) || proxyEnemy(ev.tpl, sc);
    if (!e) return;
    cb.enemyHitsPlayer(e, { coef: ev.coef, isNormal: !!ev.n, dmgType: ev.dt || null, label: ev.label || null });
    if (ev.poison) cb.poisonPlayer(e, ev.poison);
    if (ev.slow) cb.slowPlayer(ev.slow[0], ev.slow[1]);
    if (ev.curse) cb.cursePlayer(ev.curse[0], ev.curse[1]);
    const p = sc.player;
    if (!p || p.dead) return;
    if (ev.kb) p.knockback?.(ev.kb[0], ev.kb[1]);
    if (ev.stun) { p.stun?.(ev.stun); if (ev.say) sc.fx.text(p.x, p.y - 84, ev.say, { color: '#c8f0ff', size: 13 }); }
    if (ev.pslow) p.slow?.(ev.pslow[0], ev.pslow[1]);
  }

  // ölüm ödülü (hasar verdin ya da partin paylaştı): EXP/altın payı + kendi ganimet zarın + görev sayacı
  reward(ev) {
    const sc = this.scene, ch = app.char;
    if (!ch || !ENEMIES[ev.tpl]) return;
    const tpl = ENEMIES[ev.tpl];
    let res;
    const dId = dungeonOfBoss(ev.tpl);
    if (dId && sc.mapId === dId) {
      // zindan bossu: koşu başına tek ganimet (her oyuncunun kendi koşusu)
      const allowed = claimBossLoot(ch, dId);
      res = allowed ? applyKill(ch, ev.tpl, { killId: bossKillId(ch, dId), unique: true, share: ev.share ?? 1 }, sc.combat.rng)
        : { duplicate: true, quest: [], levelEvents: [], items: [], pending: [], lost: [], stacks: [], lostStacks: [], exp: 0, gold: 0 };
      if (allowed) ch.history.dungeons[dId] = (ch.history.dungeons[dId] || 0) + 1;
    } else if (tpl.kind === 'boss' && ev.killId) res = applyKill(ch, ev.tpl, { killId: ev.killId, unique: true, share: ev.share ?? 1 }, sc.combat.rng);
    else res = applyKill(ch, ev.tpl, { share: ev.share ?? 1 }, sc.combat.rng);
    const at = { x: ev.x, y: ev.y, height: this.byId.get(ev.e)?.height || 40, tpl: ENEMIES[ev.tpl] };
    sc.combat.presentRewards(at, res);
    if (ev.n > 1) sc.fx.text(ev.x, ev.y - at.height - 26, `Parti payı ×${(ev.share).toFixed(2)} (${ev.n} kişi)`, { color: '#9df0b0', size: 11, dur: 1300 });
    const critical = res.levelEvents.length || tpl.kind === 'elite' || tpl.kind === 'boss' || [...res.items, ...res.pending].some((i) => i.r !== 'N') || res.quest.length;
    app.changed('kill');
    app.requestSave('kill', !!critical);
  }

  // ---------------------------------------------------------------- parti dungeon'u (sunucu örneği)
  // sunucunun koşu durumunu yerel koşuya yansıt: kapılar, mühürler, bölümler (yerel kurallar — kontrol noktası, HUD,
  // görev ilerlemesi — aynen çalışsın)
  syncDungeon(dg, initial = false) {
    const sc = this.scene, ch = app.char, map = sc.mapId;
    this.waves = new Set(dg.waves || []);
    for (const id of dg.seals || []) breakSeal(ch, map, id);
    for (const st of dg.cleared || []) this.stageCleared(st, initial);
    if (dg.bossKilled) { const r = getRun(ch, map); if (r) r.bossKilled = true; }
    for (const o of sc.objects) o.refresh?.();
  }

  stageCleared(stage, quiet = false) {
    const sc = this.scene, ch = app.char, map = sc.mapId;
    if (!clearStage(ch, stage, map)) return;
    sc.openGates(stage);
    const ups = onDungeonStage(ch, stage, map);
    ups.forEach((u) => bus.emit('questProgress', u));
    if (!quiet) {
      if (stage === bossStage(map)) {
        sound.play('victory');
        sc.cameras.main.flash(600, 255, 230, 160);
        const boss = sc.mapDef.boss || 'mine_golem';
        bus.emit('toast', { text: `${ENEMIES[boss].name.toLocaleUpperCase('tr-TR')} YENİLDİ! ${sc.mapDef.name} temizlendi.`, kind: 'elite' });
        bus.emit('bossDefeated', boss);
      } else {
        const area = sc.mapDef.areas.find((a) => a.stage === stage);
        bus.emit('toast', { text: `Bölüm temizlendi: ${area?.name || stage}. Kapı açıldı!`, kind: 'ok' });
      }
    }
    bus.emit('dungeonProgress');
    app.requestSave('dungeonStage', true);
  }

  dungeonEvent(ev) {
    const sc = this.scene, ch = app.char, map = sc.mapId;
    if (!sc.mapDef.dungeon) return;
    if (ev.op === 'clear') this.stageCleared(ev.stage);
    else if (ev.op === 'seal') {
      this.waves?.delete(ev.id);
      if (breakSeal(ch, map, ev.id)) {
        sound.play(ev.lever ? 'portal' : 'altar');
        bus.emit('toast', { text: `${ev.name} ${ev.lever ? 'etkinleşti' : 'kırıldı'} (${ev.n}/${ev.total})`, kind: ev.n >= ev.total ? 'elite' : 'ok' });
        app.requestSave('seal', true);
      }
      sc.objects.find((o) => o.o?.id === ev.id)?.refresh?.();
      bus.emit('dungeonProgress');
    } else if (ev.op === 'wave') {
      (this.waves ||= new Set()).add(ev.id);
      sound.play(ev.idx ? 'warn' : 'shield');
      bus.emit('toast', { text: ev.n > 1 ? `${ev.name}: savunma dalgası ${ev.idx + 1}/${ev.n}` : `${ev.name} uyandı! Muhafızlarını yen.`, kind: 'elite' });
      sc.objects.find((o) => o.o?.id === ev.id)?.refresh?.();
    }
  }

  destroy() { this.clear(); }
}

function proxyEnemy(tplId, scene) {
  const t = ENEMIES[tplId];
  if (!t) return null;
  const p = scene.player;
  return { tpl: t, atk: t.atk, level: t.level, dmgType: t.dmgType, def: t.def, mdef: t.mdef, weakenUntil: 0, x: p.x, y: p.y, height: 40, dead: false };
}
