// V4 yardımcı (iskelet) yöneticisi: en çok 2 iskelet (ana + Ölüler Ordusu geçicisi). Sahne başına bir tane.
// Kayıt: yalnız ana iskeletin varlığı ve can oranı (char.minion = { main: true, hpPct }). Geçici iskelet kaydedilmez.
// Harita geçişi sahneyi yeniden kurar: yöneticiler sıfırdan başlar ve kayıttaki durumdan tek bir ana iskelet kurulur
// (çoğalma imkânsız). Ölüm: bütün iskeletler kaybolur, kayıttaki durum silinir.
import { app } from '../core/app.js';
import { bus } from '../core/events.js';
import { TILE, TG_SQUASH } from '../data/constants.js';
import { Minion } from '../entities/Minion.js';

export const MAX_MINIONS = 2;
export const TELEGRAPH_MINION_DMG = 0.35;   // düşman telegrafının içinde kalan iskelet: maks. HP'nin %35'i

export class MinionManager {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    scene.events.once('shutdown', () => { this.list.forEach((m) => !m.dead && m.destroy()); this.list = []; });
  }

  get alive() { return this.list.filter((m) => !m.dead); }
  get main() { return this.list.find((m) => !m.dead && !m.temp) || null; }
  get temp() { return this.list.find((m) => !m.dead && m.temp) || null; }

  // Sahne kurulurken: kayıtta ana iskelet varsa (ve beceri açıksa) tek bir tane kur
  restore() {
    const ch = app.char, p = this.scene.player;
    if (!ch || ch.cls !== 'necromancer' || !ch.minion?.main || !ch.skills?.summon_skeleton || p.dead) { if (ch && ch.minion && ch.cls !== 'necromancer') ch.minion = null; return; }
    this.spawn({ hpPct: ch.minion.hpPct });
  }

  spawn({ temp = 0, hpPct = 1 } = {}) {
    if (this.alive.length >= MAX_MINIONS) return null;
    const p = this.scene.player;
    let x = p.x - p.facing * 26, y = p.y + 8;
    if (this.scene.grid.blockedAt(x, y)) { x = p.x; y = p.y; }
    const m = new Minion(this.scene, p, x, y, { temp, hpPct });
    this.list.push(m);
    this.persist();
    bus.emit('minion');
    return m;
  }

  // İskelet Çağır: yoksa çağırır, varsa canını yeniler (iki ana iskelet olamaz)
  summonMain() {
    const m = this.main;
    if (m) { m.refreshStats(); m.heal(1); this.scene.fx.sprite('spirit', m.x, m.y - 20, { scale: 1.4, tint: 0x8ad0a0 }); this.persist(); bus.emit('minion'); return m; }
    // ana iskelet yokken alan geçici iskelet tarafından doluysa da ana iskelet kurulabilir (toplam 2)
    return this.spawn();
  }

  // Ölüler Ordusu: süreli ikinci iskelet; varsa süresi yenilenir (üçüncü iskelet olmaz)
  summonTemp(sec) {
    const until = this.scene.clock + sec * 1000;
    const t = this.temp;
    if (t) { t.temp = until; t.heal(1); bus.emit('minion'); return t; }
    if (this.alive.length >= MAX_MINIONS) return null;
    return this.spawn({ temp: until });
  }

  update(dt) {
    for (const m of this.list) if (!m.dead) m.update(dt);
    if (this.list.some((m) => m.dead)) this.list = this.list.filter((m) => !m.dead || m.container.active);
  }

  refreshStats() { for (const m of this.alive) m.refreshStats(); }

  // kayda yalnız güvenli veri
  persist() {
    const ch = app.char;
    if (!ch) return;
    const m = this.main;
    ch.minion = m ? { main: true, hpPct: Math.max(0.05, Math.min(1, m.hp / m.maxHp)) } : null;
  }

  onMinionGone(m) {
    if (!m.temp) { const ch = app.char; if (ch) ch.minion = null; }
    bus.emit('minion');
  }

  // sahibi öldü: bütün iskeletler kaybolur
  clearAll() {
    for (const m of this.alive) m.vanish(true);
    const ch = app.char;
    if (ch) ch.minion = null;
    bus.emit('minion');
  }

  // Düşman telegrafı bittiğinde içinde kalan iskeletler hasar alır (boss mekanikleri iskeletle atlatılamaz)
  telegraphHit(shape) {
    for (const m of this.alive) if (inShape(m.x, m.y, shape)) m.takeHit(m.maxHp * TELEGRAPH_MINION_DMG);
  }
}

export function inShape(px, py, s) {
  if (s.kind === 'circle' || s.kind === 'ring') {
    const dx = (px - s.x) / s.r, dy = (py - s.y) / (s.r * TG_SQUASH);
    return dx * dx + dy * dy <= 1;
  }
  if (s.kind === 'rect') {
    const dx = px - s.x, dy = py - s.y;
    const along = dx * Math.cos(s.angle) + dy * Math.sin(s.angle);
    const perp = -dx * Math.sin(s.angle) + dy * Math.cos(s.angle);
    return along >= -8 && along <= s.len && Math.abs(perp) <= s.width / 2 + 6;
  }
  if (s.kind === 'cone') {
    const dx = px - s.x, dy = py - s.y, d = Math.hypot(dx, dy);
    let da = Math.atan2(dy, dx) - s.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    return d <= s.r && Math.abs(da) <= Math.PI / 3;
  }
  return false;
}

export { TILE };
