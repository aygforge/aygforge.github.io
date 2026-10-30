/* =========================================================================
   Sfx (WebAudio, synthesized) + Battle (live renderer, HUD, commands).
   Battle only READS the CombatEngine state; it never changes outcomes
   except through the player's legal commands (CombatAI.command).
   ========================================================================= */

const Sfx = {
  ctx: null, on: true, crowdNode: null, noiseBuf: null,
  init() {
    if (this.ctx || typeof window === 'undefined') return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const len = this.ctx.sampleRate * 1.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  resume() { this.init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); },
  env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  noise(dur, freq, q, peak, type = 'bandpass') {
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); this.env(g, t, 0.005, dur, peak);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  },
  tone(freq, dur, type, peak, slide) {
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = c.createGain(); this.env(g, t, 0.01, dur, peak);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  },
  play(kind) {
    if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
    try {
      switch (kind) {
        case 'clash': this.noise(0.12, 2800 + Math.random() * 900, 6, 0.22); this.tone(1900 + Math.random() * 400, 0.18, 'triangle', 0.05); break;
        case 'hit': this.noise(0.09, 500, 1.2, 0.3, 'lowpass'); this.tone(110, 0.1, 'sine', 0.12, 60); break;
        case 'block': this.noise(0.16, 1300, 3, 0.28); this.tone(320, 0.2, 'square', 0.03, 200); break;
        case 'swing': this.noise(0.12, 900, 0.8, 0.06, 'highpass'); break;
        case 'net': this.noise(0.25, 700, 0.6, 0.08, 'lowpass'); break;
        case 'fall': this.noise(0.35, 220, 0.8, 0.35, 'lowpass'); break;
        case 'horn': this.tone(196, 0.9, 'sawtooth', 0.06); this.tone(294, 0.9, 'sawtooth', 0.04); break;
        case 'cheer': this.noise(1.4, 1100, 0.5, 0.12); break;
        case 'click': this.tone(660, 0.05, 'triangle', 0.04); break;
        case 'coin': this.tone(1320, 0.08, 'triangle', 0.05); setTimeout(() => this.on && this.tone(1760, 0.12, 'triangle', 0.05), 70); break;
      }
    } catch (e) { }
  },
  crowd(on) {
    if (!this.ctx) return;
    try {
      if (on && !this.crowdNode && this.on) {
        const c = this.ctx;
        const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.4;
        const g = c.createGain(); g.gain.value = 0.035;
        const lfo = c.createOscillator(); lfo.frequency.value = 0.23; const lg = c.createGain(); lg.gain.value = 0.015;
        lfo.connect(lg); lg.connect(g.gain);
        src.connect(f); f.connect(g); g.connect(c.destination); src.start(); lfo.start();
        this.crowdNode = { src, lfo, g };
      } else if (!on && this.crowdNode) {
        this.crowdNode.src.stop(); this.crowdNode.lfo.stop(); this.crowdNode = null;
      }
    } catch (e) { this.crowdNode = null; }
  },
  setOn(v) { this.on = v; if (!v) this.crowd(false); }
};

// ---------------------------------------------------------------- live battle
const Battle = {
  m: null, setup: null, fx: null, comp: null, onDone: null, raf: 0,
  speed: 1, acc: 0, last: 0, rv: [], parts: [], shake: 0, bg: null, W: 0, H: 0, dpr: 1,
  targeting: false, endT: -1, recorded: false, kits: [],
  open(fx, comp, onDone) {
    this.fx = fx; this.comp = comp; this.onDone = onDone;
    this.setup = MatchSystem.build(fx.m, comp, { live: true });
    this.fixColors(this.setup);
    this.m = CombatEngine.create(this.setup);
    this.pside = this.setup.sides[0].cid === S.player ? 0 : 1;
    this.speed = 1; this.acc = 0; this.parts = []; this.shake = 0; this.endT = -1; this.targeting = false; this.recorded = false;
    this.rv = this.m.units.map(u => ({ hitT: -9, blkT: -9, evT: -9, spT: -9, sp: null, elimT: -9, netT: -9, dustT: 0, critT: -9 }));
    this.kits = this.m.units.map(u => {
      const sd = this.setup.sides[u.side];
      const g = sd.glads[u.slot];
      return Art.kitOf(g, sd.colors);
    });
    const H = S.clubs[fx.m.h];
    this.theme = comp.type === 'icup' && fx.m.nt ? { floor: '#dcc79c', wall: '#efe6d6', a: '#7a1f1a', b: '#d4ad52', grand: true } : { ...REGION_BY_ID[H.reg].pal };
    UI.showBattle();
    this.resize();
    this.last = performance.now();
    Sfx.play('horn'); Sfx.crowd(true);
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(t => this.frame(t));
  },
  // purely cosmetic: make sure both teams wear clearly different colours
  fixColors(setup) {
    const rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const dist = (a, b) => { const A = rgb(a), B = rgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
    const h = setup.sides[0].colors, a = setup.sides[1].colors;
    if (dist(h[0], a[0]) >= 110) return;
    const alts = [a[1], '#e9e1cf', '#25507a', '#2a9d8f', '#d4ad52', '#1f1a17'];
    const pick = alts.find(c => dist(c, h[0]) >= 110 && dist(c, h[1]) >= 60) || '#e9e1cf';
    setup.sides[1].colors = [pick, a[0]];
  },
  close() { cancelAnimationFrame(this.raf); this.raf = 0; Sfx.crowd(false); this.m = null; },
  resize() {
    const cv = document.getElementById('bcanvas'); if (!cv) return;
    const r = cv.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2400000 / Math.max(1, r.width * r.height)));
    this.dpr = dpr; this.W = Math.max(320, r.width); this.H = Math.max(180, r.height);
    cv.width = Math.round(this.W * dpr); cv.height = Math.round(this.H * dpr);
    cv.style.width = this.W + 'px'; cv.style.height = this.H + 'px';
    this.bg = this.renderBG();
  },
  // world → screen
  proj(x, y) {
    const cx = this.W / 2, cy = this.H * 0.63, rx = this.W * 0.44, ry = this.H * 0.29;
    return { x: cx + x / ARENA_RX * rx, y: cy + y / ARENA_RY * ry, s: Math.min(this.H / 540, this.W / 960) * (0.88 + 0.12 * (y + ARENA_RY) / (2 * ARENA_RY)) };
  },
  renderBG() {
    const c = document.createElement('canvas');
    c.width = Math.round(this.W * this.dpr); c.height = Math.round(this.H * this.dpr);
    const x = c.getContext('2d'); x.scale(this.dpr, this.dpr);
    const W = this.W, H = this.H, T = this.theme;
    const rng = new RNG(this.m.seed);
    // sky & stands
    const sky = x.createLinearGradient(0, 0, 0, H * 0.4); sky.addColorStop(0, '#2a1d14'); sky.addColorStop(1, '#4a3626');
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    // upper arcade
    x.fillStyle = Art.shade(T.wall, -0.35); x.fillRect(0, 0, W, H * 0.07);
    for (let i = 0; i < W / 26 + 1; i++) { x.fillStyle = '#1b130d'; x.beginPath(); x.moveTo(i * 26 + 5, H * 0.07); x.lineTo(i * 26 + 5, H * 0.03); x.arc(i * 26 + 13, H * 0.03, 8, Math.PI, 0); x.lineTo(i * 26 + 21, H * 0.07); x.fill(); }
    // seating tiers with crowd
    const tiers = 7;
    for (let t = 0; t < tiers; t++) {
      const y0 = H * 0.07 + t * H * 0.034;
      x.fillStyle = t % 2 ? Art.shade(T.wall, -0.25) : Art.shade(T.wall, -0.15);
      x.fillRect(0, y0, W, H * 0.034);
      const sp = Math.max(7, H * 0.02), hw = sp * 0.36, hr = sp * 0.24;
      const n = Math.floor(W / sp);
      for (let i = 0; i < n; i++) {
        if (rng.next() < 0.14) continue;
        const px = i * sp + rng.range(0, sp * 0.35), py = y0 + H * 0.017 + rng.range(-1, 1);
        const tone = Art.SKIN[rng.int(0, 5)];
        x.fillStyle = rng.pick(['#7b2d26', '#2f4a6b', '#e6dccb', '#6b5a2a', T.a, T.b, '#3e5c3a', '#8c6d46']);
        x.beginPath(); x.moveTo(px - hw, py + H * 0.017); x.lineTo(px - hw * 0.8, py + hr * 0.6); x.quadraticCurveTo(px, py, px + hw * 0.8, py + hr * 0.6); x.lineTo(px + hw, py + H * 0.017); x.fill();
        x.fillStyle = tone; x.beginPath(); x.arc(px, py - hr * 0.3, hr, 0, 7); x.fill();
        if (rng.next() < 0.3) { x.fillStyle = Art.HAIR[rng.int(0, 5)]; x.beginPath(); x.arc(px, py - hr * 0.6, hr * 0.9, Math.PI, 0); x.fill(); }
      }
    }
    // podium wall with banners
    const wy = H * 0.07 + tiers * H * 0.034;
    const wallG = x.createLinearGradient(0, wy, 0, wy + H * 0.08); wallG.addColorStop(0, T.wall); wallG.addColorStop(1, Art.shade(T.wall, -0.3));
    x.fillStyle = wallG; x.fillRect(0, wy, W, H * 0.08);
    x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 1;
    for (let i = 0; i < W; i += 38) { x.beginPath(); x.moveTo(i, wy); x.lineTo(i, wy + H * 0.08); x.stroke(); }
    const sides = this.setup.sides;
    for (let i = 0; i < 8; i++) {
      const bx = W * (0.08 + i * 0.12), col = sides[i % 2].colors;
      x.fillStyle = col[0]; x.beginPath(); x.moveTo(bx - 9, wy + 2); x.lineTo(bx + 9, wy + 2); x.lineTo(bx + 9, wy + H * 0.075); x.lineTo(bx, wy + H * 0.06); x.lineTo(bx - 9, wy + H * 0.075); x.closePath(); x.fill();
      x.fillStyle = col[1]; x.fillRect(bx - 9, wy + 6, 18, 3);
    }
    if (T.grand) { x.fillStyle = '#d4ad52'; x.font = `bold ${Math.round(H * 0.03)}px serif`; x.textAlign = 'center'; x.fillText(tx('✦ BÜYÜK KOLEZYUM ✦', '✦ GRAND COLOSSEUM ✦'), W / 2, wy + H * 0.05); }
    // arena floor
    const cx = W / 2, cy = H * 0.63, rx = W * 0.5, ry = H * 0.36;
    x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.clip();
    const fl = x.createRadialGradient(cx, cy - ry * 0.2, 10, cx, cy, rx);
    fl.addColorStop(0, Art.shade(T.floor, 0.12)); fl.addColorStop(0.7, T.floor); fl.addColorStop(1, Art.shade(T.floor, -0.25));
    x.fillStyle = fl; x.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 260; i++) { x.fillStyle = rng.next() < 0.5 ? 'rgba(90,60,30,0.12)' : 'rgba(255,240,210,0.14)'; x.fillRect(rng.range(0, W), rng.range(cy - ry, H), 1.5, 1.5); }
    x.strokeStyle = 'rgba(120,85,45,0.12)'; x.lineWidth = 2;
    for (let k = 1; k < 7; k++) { x.beginPath(); x.ellipse(cx, cy, rx * k / 7, ry * k / 7, 0, 0, Math.PI * 2); x.stroke(); }
    x.restore();
    x.strokeStyle = Art.shade(T.wall, -0.45); x.lineWidth = 3;
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.04, Math.PI * 1.96); x.stroke();
    // vignette
    const vg = x.createRadialGradient(cx, cy, H * 0.3, cx, cy, W * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
    return c;
  },
  frame(ts) {
    if (!this.m) return;
    const dt = Math.min(0.1, (ts - this.last) / 1000);
    this.last = ts;
    const m = this.m;
    if (!m.over) {
      this.acc += dt * this.speed;
      let n = 0;
      while (this.acc >= COMBAT_DT && !m.over && n++ < 12) {
        CombatEngine.step(m);
        this.acc -= COMBAT_DT;
        this.consumeEvents();
      }
    } else {
      if (this.endT < 0) { this.endT = ts; this.consumeEvents(); Sfx.play('cheer'); this.petals(); }
      if (ts - this.endT > 2600 && !this.recorded) this.finish();
    }
    const alpha = m.over ? 1 : clamp(this.acc / COMBAT_DT, 0, 1);
    this.draw(dt, alpha);
    this.updateHUD();
    this.raf = requestAnimationFrame(t => this.frame(t));
  },
  consumeEvents() {
    const m = this.m;
    for (const e of m.events) this.onEvent(e);
    m.events.length = 0;
  },
  head(u) { const p = this.proj(u.x, u.y); return { x: p.x, y: p.y - 72 * p.s, s: p.s }; },
  chest(u) { const p = this.proj(u.x, u.y); return { x: p.x, y: p.y - 58 * p.s, s: p.s }; },
  text(x, y, t, col, size = 14, life = 0.9) {
    // stack labels instead of drawing them on top of each other
    x += (Math.random() - 0.5) * 16;
    const step = size * Math.max(0.8, this.H / 470) + 3;
    for (let k = 0; k < 6; k++) { if (!this.parts.some(q => q.k === 'txt' && q.life > q.max * 0.45 && Math.abs(q.x - x) < 46 && Math.abs(q.y - y) < step)) break; y -= step; }
    let n = 0; for (const q of this.parts) if (q.k === 'txt') n++;
    if (n > 7) { const i = this.parts.findIndex(q => q.k === 'txt'); if (i >= 0) this.parts.splice(i, 1); }
    this.parts.push({ k: 'txt', x, y, vx: 0, vy: -38, t, col, size, life, max: life });
  },
  sparks(x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 140; this.parts.push({ k: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, col, life: 0.25 + Math.random() * 0.15, max: 0.35 }); } },
  dust(x, y, n, big) { for (let i = 0; i < n; i++) this.parts.push({ k: 'dust', x: x + (Math.random() - 0.5) * 14, y: y - Math.random() * 4, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 15, r: big ? 6 : 3, life: 0.6 + Math.random() * 0.4, max: 1 }); },
  petals() { for (let i = 0; i < 60; i++) this.parts.push({ k: 'petal', x: Math.random() * this.W, y: -Math.random() * this.H * 0.5, vx: (Math.random() - 0.5) * 30, vy: 40 + Math.random() * 40, rot: Math.random() * 6, col: Math.random() < 0.6 ? '#b3261e' : '#efe6d6', life: 4, max: 4 }); },
  onEvent(e) {
    const m = this.m, U = m.units;
    const now = m.t;
    switch (e.type) {
      case 'swing': if (Math.random() < 0.5) Sfx.play('swing'); break;
      case 'hit': {
        const T = U[e.tg], A = U[e.u], c = this.chest(T);
        const rv = this.rv[e.tg];
        if (e.blocked) { rv.blkT = now; this.sparks(lerp(c.x, this.chest(A).x, 0.3), c.y, 10, '#ffe7a0'); Sfx.play('block'); this.text(c.x, c.y - 18 * c.s, tx('BLOK ', 'BLOCK ') + Math.round(e.dmg), '#e6d8b0', 12); }
        else { rv.hitT = now; this.sparks(c.x, c.y, e.crit ? 14 : 6, e.crit ? '#ffd27a' : '#f5f0e0'); Sfx.play(e.crit ? 'clash' : 'hit'); this.text(c.x, c.y - 18 * c.s, String(Math.round(e.dmg)), e.crit ? '#ffcc4d' : '#fff', e.crit ? 18 : 14); }
        if (e.crit) { this.text(c.x, c.y - 40 * c.s, tx('KRİTİK!', 'CRITICAL!'), '#ffb02e', 15, 1.1); this.shake = Math.max(this.shake, 5); this.rv[e.tg].critT = now; }
        if (e.sp) this.dust(this.proj(T.x, T.y).x, this.proj(T.x, T.y).y, 4);
        break;
      }
      case 'miss': case 'whiff': { if (Math.random() < 0.4) { const c = this.chest(U[e.tg]); this.text(c.x, c.y - 18 * c.s, tx('ıska', 'miss'), '#bfb6a2', 10, 0.5); } break; }
      case 'evade': { this.rv[e.tg].evT = now; const c = this.chest(U[e.tg]); this.text(c.x, c.y - 18 * c.s, tx('KAÇTI', 'DODGED'), '#9fd3ff', 12, 0.7); break; }
      case 'special': {
        const u = U[e.u], rv = this.rv[e.u];
        rv.spT = now; rv.sp = e.sp;
        const h = this.head(u);
        this.text(h.x, h.y - 14, CLASSES[u.cls].sp.name, '#ffd27a', 13, 1.2);
        if (e.sp === 'agile' || e.sp === 'pursuit' || e.sp === 'lunge') { const p = this.proj(u.x, u.y); this.dust(p.x, p.y, 6, true); }
        if (e.sp === 'shieldwall') { const c = this.chest(u); this.sparks(c.x, c.y, 8, '#fff2c0'); Sfx.play('block'); }
        if (e.sp === 'net') { rv.netT = now; Sfx.play('net'); }
        break;
      }
      case 'net': {
        const T = U[e.tg], c = this.chest(T);
        this.parts.push({ k: 'netfly', from: e.u, to: e.tg, life: 0.25, max: 0.25 });
        if (e.ok) this.text(c.x, c.y - 26 * c.s, tx('AĞA DÜŞTÜ!', 'NETTED!'), '#cde7ff', 13, 1.1); else this.text(c.x, c.y - 26 * c.s, tx('AĞ BOŞA GİTTİ', 'NET MISSED'), '#bfb6a2', 11, 0.8);
        break;
      }
      case 'stumble': { const c = this.chest(U[e.u]); this.text(c.x, c.y - 20 * c.s, tx('Sendeledi', 'Stumbled'), '#d9b38c', 11, 0.8); break; }
      case 'elim': {
        const u = U[e.u]; this.rv[e.u].elimT = now;
        const p = this.proj(u.x, u.y); this.dust(p.x, p.y, 14, true); this.shake = Math.max(this.shake, 8);
        this.text(p.x, p.y - 90 * p.s, tx('ELENDİ', 'ELIMINATED'), '#ff7a6b', 16, 1.6);
        Sfx.play('fall'); setTimeout(() => Sfx.play('cheer'), 200);
        UI.battleLog(tx(`${u.name} elendi`, `${u.name} eliminated`) + (e.by >= 0 ? ' — ' + U[e.by].name : ''));
        break;
      }
      case 'cmd': UI.battleLog(e.side === this.pside ? tx('Emir: ', 'Order: ') + (e.cmd === 'attack' ? tx('Hücum!', 'Attack!') : e.cmd === 'defend' ? tx('Savunma!', 'Defend!') : tx('Odaklan: ', 'Focus: ') + (U[e.tg] ? U[e.tg].name : '')) : tx('Rakip taktik değiştirdi', 'The opponent changed tactics')); break;
    }
  },
  // pose derived from engine state + event timings (visual only)
  pose(u, i, vt, alpha) {
    const rv = this.rv[i];
    const cls = u.cls;
    const shieldCls = cls === 'murmillo' || cls === 'secutor' || cls === 'thraex' || cls === 'hoplomachus';
    const P = { footF: { x: 7, y: 0 }, footB: { x: -7, y: 0 }, lean: 0.05, bob: 0, crouch: 0.18, hipX: 0, armF: [0.55, 1.25], armB: [-0.25, 0.85], wB: 2.0, wF: 2.2, head: 0, fall: 0, shieldTilt: 0, noNet: false };
    if (shieldCls) P.armF = [0.85, 1.5];
    if (cls === 'retiarius') { P.armB = [0.5, 1.45]; P.wB = 1.72; P.armF = [0.25, 0.45]; }
    if (cls === 'hoplomachus') { P.armB = [0.25, 1.55]; P.wB = 1.66; }
    if (cls === 'dimachaerus') { P.armB = [-0.1, 1.15]; P.wB = 2.2; P.armF = [0.5, 1.3]; P.wF = 2.3; }
    P.bob = Math.sin(vt * 2.4 + i * 1.7) * 0.8;
    const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    // elimination
    if (!u.alive) {
      const k = clamp((vt - rv.elimT) / 1.2, 0, 1);
      const k1 = clamp(k / 0.45, 0, 1), k2 = clamp((k - 0.45) / 0.55, 0, 1);
      P.crouch = 0.18 + k1 * 0.75; P.lean = 0.05 + k1 * 0.35; P.footF.x = 7 + k1 * 6; P.armB = [0.2, 0.3]; P.armF = [0.3, 0.4];
      P.fall = ease(k2); P.dropped = k1 >= 1; P.head = 0.3 * k1;
      return P;
    }
    // movement
    const speed = Math.hypot(u.x - u.px, u.y - u.py) / COMBAT_DT;
    if (speed > 0.25) {
      const ph = (u.walk + speed * COMBAT_DT * alpha) * 2.1 + i;
      const amp = Math.min(1.3, speed / 2.2);
      const sw = Math.sin(ph);
      P.footF.x = 7 + sw * 10 * amp; P.footF.y = -Math.max(0, Math.cos(ph)) * 5 * amp;
      P.footB.x = -7 - sw * 10 * amp; P.footB.y = -Math.max(0, -Math.cos(ph)) * 5 * amp;
      P.bob -= Math.abs(Math.cos(ph)) * 1.8 * amp;
      P.lean += 0.06 + (u.st.sprint > 0 ? 0.3 : 0);
      if (!shieldCls) P.armF[0] += sw * 0.25;
      // backpedalling (kiting) leans back
      const dirx = (u.x - u.px) * u.face;
      if (dirx < -0.05) P.lean -= 0.18;
    }
    // actions
    const a = u.act;
    if (a) {
      const t = Math.min(a.dur, a.t + COMBAT_DT * alpha);
      const p = t / a.dur;
      const thrustCls = cls === 'retiarius' || cls === 'hoplomachus';
      if (a.k === 'atk') {
        const imp = 0.28 / 0.55;
        const wind = ease(clamp(p / imp, 0, 1)), strike = ease(clamp((p - imp) / 0.2, 0, 1)), rec = clamp((p - imp - 0.2) / (1 - imp - 0.2), 0, 1);
        if (thrustCls || a.v === 2) {
          const up0 = P.armB[0], f0 = P.armB[1];
          P.armB[0] = lerp(lerp(up0, 0.7, wind), 1.45, strike * (1 - rec)) + (rec > 0 ? (up0 - 1.45) * 0 : 0);
          P.armB[1] = lerp(lerp(f0, 0.35, wind), 1.6, strike * (1 - rec));
          if (rec > 0) { P.armB[0] = lerp(1.45, up0, rec); P.armB[1] = lerp(1.6, f0, rec); }
          P.wB = thrustCls ? lerp(P.wB, 1.6, strike) : 1.6;
          P.lean += -0.05 * wind + 0.3 * strike * (1 - rec);
          P.footF.x += 5 * strike * (1 - rec);
        } else {
          const up0 = P.armB[0], f0 = P.armB[1], w0 = P.wB;
          const hi = a.v === 1 ? -1.6 : -2.5;
          let up = lerp(up0, hi, wind), fo = lerp(f0, hi + 0.4, wind), wv = lerp(w0, hi - 0.4, wind);
          if (p > imp) { up = lerp(hi, 1.35, strike); fo = lerp(hi + 0.4, 1.45, strike); wv = lerp(hi - 0.4, 1.25, strike); }
          if (rec > 0) { up = lerp(1.35, up0, rec); fo = lerp(1.45, f0, rec); wv = lerp(1.25, w0, rec); }
          P.armB = [up, fo]; P.wB = wv;
          P.lean += -0.06 * wind * (1 - strike) + 0.25 * strike * (1 - rec);
          P.footF.x += 5 * strike * (1 - rec);
        }
      } else if (a.k === 'stumble') {
        const s = Math.sin(p * Math.PI);
        P.lean += 0.4 * s; P.head = 0.4 * s; P.footF.x += 8 * s; P.armB[0] -= 0.6 * s;
      } else if (a.k === 'sp') {
        switch (a.sp) {
          case 'shieldwall': break; // guard pose handled below
          case 'net': {
            const w = ease(clamp(p / 0.6, 0, 1)), th = ease(clamp((p - 0.6) / 0.25, 0, 1));
            P.armF = [lerp(lerp(0.25, -2.5, w), 2.3, th), lerp(lerp(0.45, -2.2, w), 2.1, th)];
            P.lean += -0.1 * w + 0.3 * th; P.footF.x += 6 * th;
            if (p > 0.6) P.noNet = true;
            break;
          }
          case 'agile': {
            const d = clamp(p / 0.32, 0, 1), s = ease(clamp((p - 0.32) / 0.15, 0, 1)), b = clamp((p - 0.56) / 0.44, 0, 1);
            P.lean += 0.45 * d * (1 - b) - 0.25 * b; P.crouch += 0.25 * d * (1 - b);
            P.footF.x += 10 * d * (1 - b); P.footB.x -= 6 * d * (1 - b);
            P.armB = [lerp(-2.4, 1.4, s), lerp(-2.0, 1.5, s)]; P.wB = lerp(-2.8, 1.3, s);
            if (b > 0) { P.footF.y = -6 * Math.sin(b * Math.PI); P.footB.y = -6 * Math.sin(b * Math.PI); P.armB = [lerp(1.4, -0.25, b), lerp(1.5, 0.85, b)]; P.wB = lerp(1.3, 2.0, b); }
            break;
          }
          case 'pursuit': P.lean += 0.25; P.crouch += 0.1; break;
          case 'combo': {
            const s1 = ease(clamp(p / 0.27, 0, 1)), r1 = clamp((p - 0.3) / 0.2, 0, 1);
            const s2 = ease(clamp((p - 0.4) / 0.22, 0, 1)), r2 = clamp((p - 0.7) / 0.3, 0, 1);
            P.armB = [lerp(lerp(-2.3, 1.35, s1), -0.1, r1), lerp(lerp(-1.9, 1.45, s1), 1.15, r1)]; P.wB = lerp(lerp(-2.7, 1.25, s1), 2.2, r1);
            P.armF = [lerp(lerp(0.5, 1.5, s2), 0.5, r2), lerp(lerp(-1.5, 1.6, s2), 1.3, r2)]; P.wF = lerp(lerp(-2.4, 1.3, s2), 2.3, r2);
            P.lean += 0.2 * Math.max(s1 * (1 - r1), s2 * (1 - r2)); P.footF.x += 5 * s2;
            break;
          }
          case 'lunge': {
            const w = ease(clamp(p / 0.4, 0, 1)), s = ease(clamp((p - 0.4) / 0.15, 0, 1)), r = clamp((p - 0.65) / 0.35, 0, 1);
            P.armB = [lerp(lerp(0.25, 0.5, w), 1.55, s * (1 - r)), lerp(lerp(1.55, 0.2, w), 1.6, s * (1 - r))];
            P.wB = 1.6; P.lean += 0.42 * s * (1 - r) - 0.08 * w; P.crouch += 0.3 * s * (1 - r);
            P.footF.x += 14 * s * (1 - r); P.footB.x -= 8 * s * (1 - r);
            break;
          }
        }
      }
    }
    // shield wall / guard stance
    if (u.st.guard > 0) { P.crouch += 0.3; P.armF = [1.3, 1.7]; P.shieldTilt = -0.12; P.lean += 0.1; }
    // reactions
    const dh = vt - rv.hitT;
    if (dh >= 0 && dh < 0.3) { const k = 1 - dh / 0.3; P.lean -= 0.32 * k; P.hipX -= 3 * k; P.head -= 0.25 * k; P.flash = k; }
    const db = vt - rv.blkT;
    if (db >= 0 && db < 0.35 && shieldCls) { const k = 1 - db / 0.35; P.armF = [lerp(P.armF[0], 1.35, k), lerp(P.armF[1], 1.75, k)]; P.lean -= 0.1 * k; }
    const de = vt - rv.evT;
    if (de >= 0 && de < 0.42) { const k = Math.sin(Math.PI * de / 0.42); P.hipX -= 8 * k; P.lean -= 0.3 * k; P.footB.x -= 5 * k; P.crouch += 0.15 * k; }
    if (u.st.root > 0) { P.lean += Math.sin(vt * 22) * 0.06; P.armB[0] -= 0.4; P.armF[0] -= 0.4; }
    if (u.st.stag > 0) { P.lean -= 0.2; P.head += 0.25; }
    if (cls === 'retiarius' && vt - rv.netT < 3 && vt - rv.netT > 0.4) P.noNet = true;
    // victory celebration
    if (this.m.over && this.m.result && this.m.result.w === u.side) {
      const k = clamp((performance.now() - this.endT) / 400, 0, 1);
      P.armB = [lerp(P.armB[0], 2.75, k), lerp(P.armB[1], 2.95, k)]; P.wB = lerp(P.wB, 3.05, k);
      if (!shieldCls) P.armF = [lerp(P.armF[0], 2.5, k), lerp(P.armF[1], 2.8, k)];
      P.bob -= Math.abs(Math.sin(vt * 5 + i)) * 4 * k; P.lean = lerp(P.lean, -0.05, k);
    }
    return P;
  },
  draw(dt, alpha) {
    const cv = document.getElementById('bcanvas'); if (!cv) return;
    const ctx = cv.getContext('2d');
    const m = this.m;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.shake *= Math.pow(0.02, dt);
    const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
    ctx.save(); ctx.translate(sx, sy);
    ctx.drawImage(this.bg, 0, 0, this.W, this.H);
    const vt = m.over ? m.t : m.t - COMBAT_DT * (1 - alpha);
    // order by depth
    const order = m.units.map((u, i) => i).sort((a, b) => {
      const A = m.units[a], B = m.units[b];
      if (A.alive !== B.alive) return A.alive ? 1 : -1;
      return lerp(A.py, A.y, alpha) - lerp(B.py, B.y, alpha);
    });
    for (const i of order) {
      const u = m.units[i];
      const x = lerp(u.px, u.x, alpha), y = lerp(u.py, u.y, alpha);
      const p = this.proj(x, y);
      const team = m.teams[u.side];
      // shadow + team ring
      ctx.fillStyle = 'rgba(30,20,10,0.32)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 22 * p.s * (u.alive ? 1 : 1.9), 6.5 * p.s, 0, 0, Math.PI * 2); ctx.fill();
      if (u.alive) {
        ctx.strokeStyle = team.colors[0]; ctx.lineWidth = 2.4 * p.s;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, 19 * p.s, 5.5 * p.s, 0, 0, Math.PI * 2); ctx.stroke();
        if (u.side === this.pside) { ctx.strokeStyle = 'rgba(255,230,160,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, 22 * p.s, 7 * p.s, 0, 0, Math.PI * 2); ctx.stroke(); }
      }
      const P = this.pose(u, i, vt, alpha);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.s * u.face, p.s);
      const kit = this.kits[i];
      Art.figure(ctx, u.look, u.cls, kit, P);
      ctx.restore();
      if (P.flash > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = P.flash * 0.55;
        const g = ctx.createRadialGradient(p.x, p.y - 55 * p.s, 2, p.x, p.y - 55 * p.s, 32 * p.s);
        g.addColorStop(0, '#fff3d6'); g.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y - 55 * p.s, 32 * p.s, 0, 7); ctx.fill(); ctx.restore();
      }
      if (u.st.root > 0) this.drawNetOver(ctx, p);
      if (u.st.guard > 0) { ctx.strokeStyle = 'rgba(255,230,150,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x + 12 * p.s * u.face, p.y - 50 * p.s, 30 * p.s, -1.2, 1.2); ctx.stroke(); }
      // overhead bar
      if (u.alive) {
        const bw = 34 * p.s, by = p.y - 112 * p.s;
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(p.x - bw / 2 - 1, by - 1, bw + 2, 5);
        ctx.fillStyle = u.hp / u.hpMax > 0.35 ? team.colors[0] === '#1f1a17' ? '#8a8a8a' : this.hpCol(u.side) : '#d24b3a';
        ctx.fillRect(p.x - bw / 2, by, bw * u.hp / u.hpMax, 3);
        if (team.focus >= 0) { }
      }
      // focus marker on enemy targeted by the player's team
      const myTeam = m.teams[this.pside];
      if (u.alive && myTeam.focus === i) {
        const hy = p.y - 122 * p.s;
        ctx.fillStyle = '#ff5a3c'; ctx.beginPath(); ctx.moveTo(p.x - 7, hy - 9); ctx.lineTo(p.x + 7, hy - 9); ctx.lineTo(p.x, hy); ctx.closePath(); ctx.fill();
      }
      if (this.targeting && u.alive && u.side !== this.pside) {
        ctx.strokeStyle = 'rgba(255,90,60,' + (0.5 + 0.4 * Math.sin(performance.now() / 150)) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(p.x, p.y - 45 * p.s, 28 * p.s, 62 * p.s, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    this.drawParts(ctx, dt);
    ctx.restore();
  },
  hpCol(side) { return side === this.pside ? '#6fcf6a' : '#e8b34a'; },
  drawNetOver(ctx, p) {
    ctx.save(); ctx.translate(p.x, p.y - 50 * p.s); ctx.strokeStyle = 'rgba(225,212,170,0.9)'; ctx.lineWidth = 1;
    const r = 30 * p.s;
    ctx.beginPath();
    for (let i = -3; i <= 3; i++) { ctx.moveTo(i * r / 3.2, -r); ctx.quadraticCurveTo(i * r / 2.6, 0, i * r / 3.2, r); ctx.moveTo(-r, i * r / 3.2); ctx.quadraticCurveTo(0, i * r / 2.6, r, i * r / 3.2); }
    ctx.stroke(); ctx.restore();
  },
  drawParts(ctx, dt) {
    const U = this.m.units;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const q = this.parts[i];
      q.life -= dt;
      if (q.life <= 0) { this.parts.splice(i, 1); continue; }
      const k = q.life / q.max;
      if (q.k === 'spark') {
        q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt;
        ctx.strokeStyle = q.col; ctx.globalAlpha = k; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03); ctx.stroke();
      } else if (q.k === 'dust') {
        q.x += q.vx * dt; q.y += q.vy * dt;
        ctx.globalAlpha = k * 0.4; ctx.fillStyle = '#c8ad80';
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (2 - k) * (this.H / 470), 0, 7); ctx.fill();
      } else if (q.k === 'txt') {
        q.y += q.vy * dt; q.vy *= 0.96;
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.font = `bold ${Math.round(q.size * Math.max(0.8, this.H / 470))}px "Trebuchet MS", sans-serif`;
        ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,10,5,0.85)';
        ctx.strokeText(q.t, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.t, q.x, q.y);
      } else if (q.k === 'petal') {
        q.x += q.vx * dt + Math.sin(q.life * 3) * 0.5; q.y += q.vy * dt; q.rot += dt * 3;
        ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = q.col;
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, 7); ctx.fill(); ctx.restore();
      } else if (q.k === 'netfly') {
        const A = this.chest(U[q.from]), B = this.chest(U[q.to]);
        const t = 1 - k;
        const x = lerp(A.x, B.x, t), y = lerp(A.y, B.y, t) - Math.sin(t * Math.PI) * 30;
        const r = 8 + t * 18;
        ctx.globalAlpha = 0.9; ctx.strokeStyle = '#e6dcb8'; ctx.lineWidth = 1;
        ctx.beginPath(); for (let j = -2; j <= 2; j++) { ctx.moveTo(x + j * r / 2.5, y - r); ctx.lineTo(x + j * r / 2.5, y + r); ctx.moveTo(x - r, y + j * r / 2.5); ctx.lineTo(x + r, y + j * r / 2.5); } ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  },
  // ---------------------------------------------------------------- HUD & controls
  setSpeed(s) {
    if (s === 'sim') { this.simulateRest(); return; }
    this.speed = s;
    UI.battleSpeedUI(s);
  },
  simulateRest() {
    // same engine, run to the end without visual waiting
    const m = this.m; if (!m) return;
    m.headless = true; m.events.length = 0;
    let guard = 0;
    while (!m.over && guard++ < 2000) CombatEngine.step(m);
    m.headless = false;
    this.endT = performance.now() - 2000;
    for (const u of m.units) { u.px = u.x; u.py = u.y; if (!u.alive && this.rv[u.i].elimT < 0) this.rv[u.i].elimT = m.t - 2; }
  },
  command(cmd) {
    const m = this.m; if (!m || m.over) return;
    if (cmd === 'focus') { this.targeting = !this.targeting; UI.battleTargeting(this.targeting); return; }
    const ok = CombatAI.command(m, this.pside, cmd);
    if (!ok) UI.toast(tx('Komut bekleme süresinde (', 'Command on cooldown (') + Math.ceil(m.teams[this.pside].cmdCd) + tx(' sn).', 's).'));
    this.consumeEvents();
  },
  pickTarget(idx) {
    const m = this.m; if (!m) return;
    this.targeting = false; UI.battleTargeting(false);
    const ok = CombatAI.command(m, this.pside, 'focus', idx);
    if (!ok) UI.toast(m.teams[this.pside].cmdCd > 0 ? tx('Komut bekleme süresinde.', 'Command on cooldown.') : tx('Geçersiz hedef.', 'Invalid target.'));
    this.consumeEvents();
  },
  canvasTap(ev) {
    if (!this.targeting || !this.m) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const x = ev.clientX - r.left, y = ev.clientY - r.top;
    let best = -1, bd = 1e9;
    for (const u of this.m.units) {
      if (!u.alive || u.side === this.pside) continue;
      const p = this.proj(u.x, u.y);
      const d = Math.hypot(p.x - x, (p.y - 45 * p.s) - y);
      if (d < bd) { bd = d; best = u.i; }
    }
    if (best >= 0 && bd < 120) this.pickTarget(best);
  },
  updateHUD() {
    const m = this.m; if (!m) return;
    UI.battleHUD(m, this.pside);
  },
  finish() {
    if (this.recorded) return;
    this.recorded = true;
    const res = this.m.result;
    const setup = this.setup;
    const fx = this.fx, comp = this.comp;
    const done = this.onDone;
    const m = this.m;
    this.close();
    done && done(res, setup, m);
  }
};
