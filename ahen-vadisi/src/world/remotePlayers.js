// Parti arkadaşlarının haritadaki görüntüsü (Faz 1). Yalnız görseldir: çarpışma, hedef seçme, savaşa ya da ganimete etkisi yok.
// Konumlar ≈0,4 sn'de bir gelir; görüntü INTERP_MS geriden, iki konum arasında yumuşatılarak çizilir.
import { bus } from '../core/events.js';
import { spritePack } from '../art/spriteRuntime.js';
import { ensurePlayerTexture } from '../scenes/textures.js';
import { partyGame } from '../online/partyGame.js';

const INTERP_MS = 450;
const SNAP_PX = 320;            // bundan uzak sıçrama: ışınlanma say, kaydırma
const DEPTH_LABEL = 50000;
const textStyle = (size, color) => ({ fontFamily: 'Trebuchet MS, sans-serif', fontSize: size + 'px', fontStyle: 'bold', color, stroke: '#000', strokeThickness: 3 });

class Ghost {
  constructor(scene, m) {
    this.scene = scene; this.uid = m.uid;
    this.samples = []; this.lastAt = 0;
    this.x = m.st.x; this.y = m.st.y; this.cls = null; this.anim = '';
    const c = scene.add.container(this.x, this.y);
    this.shadow = scene.add.image(0, 0, 'obj_shadow').setScale(1.4, 1.2).setAlpha(0.6);
    this.ring = scene.add.ellipse(0, 1, 40, 12, 0x5ee07a, 0.28);
    this.body = scene.add.sprite(0, 0, 'fx_px');
    c.add([this.shadow, this.ring, this.body]);
    this.container = c;
    this.label = scene.add.text(this.x, this.y - 72, '', textStyle(11, '#9df0b0')).setOrigin(0.5, 1).setDepth(DEPTH_LABEL);
    this.hpBg = scene.add.rectangle(this.x, this.y - 70, 36, 4, 0x000000, 0.7).setOrigin(0.5, 0).setDepth(DEPTH_LABEL);
    this.hpFg = scene.add.rectangle(this.x - 17, this.y - 69, 34, 2, 0x5ee07a).setOrigin(0, 0).setDepth(DEPTH_LABEL);
    this.bubble = null; this.bubbleUntil = 0;
    this.setLook(m.st.cls);
  }

  setLook(cls) {
    if (this.cls === cls) return;
    this.cls = cls;
    const pack = spritePack('hero_' + cls);
    this.pack = pack;
    if (pack) { this.key = pack.id; this.body.setTexture(`${pack.id}:idle`, 0).setOrigin(pack.ox, pack.oy); }
    else {
      this.key = ensurePlayerTexture(this.scene, cls, {});
      this.body.setTexture(this.key, 'idle0').setOrigin(0.5, 28.5 / 30);
    }
    this.anim = '';
  }

  play(name) {
    const k = this.pack ? `${this.key}_${name}` : `${this.key}_${name === 'atk' ? 'atk' : name}`;
    if (this.anim === k || !this.scene.anims.exists(k)) return;
    this.anim = k;
    this.body.play(k, true);
  }

  push(st) {
    if (st.at === this.lastAt) return;
    this.lastAt = st.at;
    const last = this.samples[this.samples.length - 1];
    if (last && Math.hypot(st.x - last.x, st.y - last.y) > SNAP_PX) this.samples = [];
    this.samples.push({ t: st.at, x: st.x, y: st.y });
    if (this.samples.length > 8) this.samples.shift();
  }

  update(m, now) {
    const st = m.st;
    this.setLook(st.cls);
    this.push(st);
    const rt = now - INTERP_MS;
    const s = this.samples;
    let x = s[s.length - 1].x, y = s[s.length - 1].y;
    for (let i = s.length - 1; i > 0; i--) {
      if (s[i - 1].t <= rt) {
        const a = s[i - 1], b = s[i], k = Math.max(0, Math.min(1, (rt - a.t) / Math.max(1, b.t - a.t)));
        x = a.x + (b.x - a.x) * k; y = a.y + (b.y - a.y) * k;
        break;
      }
      if (i === 1) { x = s[0].x; y = s[0].y; }
    }
    const dx = x - this.x, dy = y - this.y;
    const moving = Math.hypot(dx, dy) > 0.3;
    this.x = x; this.y = y;
    const c = this.container;
    c.setPosition(Math.round(x), Math.round(y)).setDepth(100 + y);
    if (Math.abs(dx) > 0.3) c.scaleX = dx < 0 ? -1 : 1; else if (!moving) c.scaleX = st.f;
    if (st.d) { this.play(this.pack ? 'die' : 'idle'); c.setAlpha(0.6); }
    else {
      c.setAlpha(1);
      if (st.a && !moving && this.pack) this.play('atk');
      else this.play(moving || st.mv ? 'walk' : 'idle');
    }
    const nm = `${m.nick} · Lv.${st.lv}`;
    if (this.label.text !== nm) this.label.setText(nm);
    if (this.mate !== m.mate) { this.mate = m.mate; this.label.setColor(m.mate ? '#9df0b0' : '#bfe0ff'); this.ring.setFillStyle(m.mate ? 0x5ee07a : 0x6aa8ff, m.mate ? 0.28 : 0.18); this.hpFg.setFillStyle(m.mate ? 0x5ee07a : 0x6aa8ff); }
    this.label.setPosition(Math.round(x), Math.round(y) - 72);
    this.hpBg.setPosition(Math.round(x), Math.round(y) - 70);
    this.hpFg.setPosition(Math.round(x) - 17, Math.round(y) - 69).setSize(Math.max(0, 34 * st.hp / 100), 2);
    if (this.bubble) {
      if (now > this.bubbleUntil) { this.bubble.destroy(); this.bubble = null; }
      else this.bubble.setPosition(Math.round(x), Math.round(y) - 86);
    }
  }

  say(text, now) {
    this.bubble?.destroy();
    this.bubble = makeBubble(this.scene, text).setPosition(this.x, this.y - 86);
    this.bubbleUntil = now + 5000;
  }

  destroy() { this.container.destroy(); this.label.destroy(); this.hpBg.destroy(); this.hpFg.destroy(); this.bubble?.destroy(); }
}

function makeBubble(scene, text) {
  return scene.add.text(0, 0, text.length > 60 ? text.slice(0, 57) + '…' : text, {
    fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px', color: '#1a1410', backgroundColor: '#f4ecd8',
    padding: { x: 5, y: 3 }, wordWrap: { width: 170 }, align: 'center',
  }).setOrigin(0.5, 1).setDepth(DEPTH_LABEL + 1);
}

export class RemotePlayers {
  constructor(scene) {
    this.scene = scene;
    this.ghosts = new Map();
    this.selfBubble = null; this.selfUntil = 0;
    this.off = bus.on('partyChat', (e) => this.onChat(e));
  }

  // aynı haritadaki, durumu taze arkadaşlar. Ortak dünya sunucusuna bağlıyken bölgedeki TÜM oyuncular (parti üyeleri yeşil).
  visible() {
    const p = partyGame.party;
    const nw = this.scene.netWorld;
    if (nw?.active) {
      const mates = new Set(p?.inParty ? p.others().map((m) => m.uid) : []);
      return nw.remoteList().map((m) => ({ ...m, mate: mates.has(m.uid) }));
    }
    if (!p?.inParty) return [];
    return p.others().filter((m) => m.fresh && m.st.m === this.scene.mapId).map((m) => ({ ...m, mate: true }));
  }

  ghostOf(uid) { return this.ghosts.get(uid) || null; }

  update() {
    const now = Date.now();
    const list = this.visible();
    const keep = new Set();
    for (const m of list) {
      keep.add(m.uid);
      let g = this.ghosts.get(m.uid);
      if (!g) { g = new Ghost(this.scene, m); this.ghosts.set(m.uid, g); }
      g.update(m, now);
    }
    for (const [uid, g] of this.ghosts) if (!keep.has(uid)) { g.destroy(); this.ghosts.delete(uid); }
    if (this.selfBubble) {
      const pl = this.scene.player;
      if (now > this.selfUntil || !pl) { this.selfBubble.destroy(); this.selfBubble = null; }
      else this.selfBubble.setPosition(Math.round(pl.x), Math.round(pl.y) - 86);
    }
  }

  onChat(e) {
    const now = Date.now();
    if (e.self) {
      this.selfBubble?.destroy();
      const pl = this.scene.player;
      if (!pl) return;
      this.selfBubble = makeBubble(this.scene, e.text).setPosition(pl.x, pl.y - 86);
      this.selfUntil = now + 5000;
      return;
    }
    this.ghosts.get(e.uid)?.say(e.text, now);
  }

  // mini/büyük harita işaretleri (karo koordinatı)
  markers(tile) {
    return [...this.ghosts.values()].map((g) => ({ x: g.x / tile, y: g.y / tile }));
  }

  destroy() {
    this.off?.();
    for (const g of this.ghosts.values()) g.destroy();
    this.ghosts.clear();
    this.selfBubble?.destroy(); this.selfBubble = null;
  }
}
