// Minimal pixel-style UI widgets (programatik, özgün). Tek font: Pixelify Sans (OFL, yerel paket).
export const FONT = '"Pixelify Sans", monospace';
export const COLORS = {
  ink: '#2a2230',
  cream: '#fff4dc',
  gold: '#ffd84a',
  red: '#e8402e',
  green: '#4caf3a',
  panel: 0x2b2533,
  panelLight: 0x3d3447,
  panelEdge: 0x15111a,
  btn: 0xe8862e,
  btnDark: 0xa85618,
  btnLight: 0xffb35a,
  btnGreen: 0x4caf3a,
  btnGreenDark: 0x2e7d32,
  btnGrey: 0x6b6476,
  btnGreyDark: 0x45404d,
};

export function text(scene, x, y, str, size = 20, color = COLORS.cream, opts = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    align: opts.align || 'center',
    stroke: opts.stroke ?? COLORS.ink,
    strokeThickness: opts.strokeThickness ?? Math.max(2, Math.round(size / 7)),
    wordWrap: opts.wrap ? { width: opts.wrap, useAdvancedWrap: true } : undefined,
    lineSpacing: opts.lineSpacing ?? 2,
  });
  t.setOrigin(opts.ox ?? 0.5, opts.oy ?? 0.5);
  return t;
}

export function panel(scene, x, y, w, h, opts = {}) {
  const g = scene.add.graphics();
  const fill = opts.fill ?? COLORS.panel;
  g.fillStyle(COLORS.panelEdge, 1);
  g.fillRect(x - 3, y + 1, w + 6, h - 2);
  g.fillRect(x + 1, y - 3, w - 2, h + 6);
  g.fillStyle(fill, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(opts.light ?? COLORS.panelLight, 1);
  g.fillRect(x, y, w, 4);
  g.fillStyle(0x000000, 0.25);
  g.fillRect(x, y + h - 4, w, 4);
  return g;
}

// Button: container with graphics + label. onClick fires on pointerup inside (no double fire).
export function button(scene, x, y, w, h, label, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const size = opts.size ?? Math.min(26, Math.round(h * 0.42));
  const t = text(scene, 0, -1, label, size, opts.color ?? COLORS.cream);
  c.add([g, t]);
  c.setSize(w, h);
  let enabled = opts.enabled ?? true;
  let down = false;
  const draw = () => {
    const base = !enabled ? COLORS.btnGrey : opts.fill ?? COLORS.btn;
    const dark = !enabled ? COLORS.btnGreyDark : opts.dark ?? COLORS.btnDark;
    const light = !enabled ? 0x8a8296 : opts.light ?? COLORS.btnLight;
    g.clear();
    const oy = down ? 3 : 0;
    g.fillStyle(COLORS.panelEdge, 1);
    g.fillRect(-w / 2 - 3, -h / 2 + 1, w + 6, h + 2);
    g.fillRect(-w / 2 + 1, -h / 2 - 3, w - 2, h + 8);
    g.fillStyle(dark, 1);
    g.fillRect(-w / 2, -h / 2 + 4, w, h);
    g.fillStyle(base, 1);
    g.fillRect(-w / 2, -h / 2 + oy, w, h - 4);
    g.fillStyle(light, 1);
    g.fillRect(-w / 2 + 4, -h / 2 + 3 + oy, w - 8, 3);
    t.y = -3 + oy;
    t.setAlpha(enabled ? 1 : 0.75);
  };
  draw();
  c.setInteractive({ useHandCursor: true });
  c.on('pointerdown', (p, lx, ly, ev) => {
    ev?.stopPropagation?.();
    if (!enabled) return;
    down = true;
    draw();
  });
  c.on('pointerout', () => {
    down = false;
    draw();
  });
  c.on('pointerup', (p, lx, ly, ev) => {
    ev?.stopPropagation?.();
    if (!enabled || !down) return;
    down = false;
    draw();
    onClick?.();
  });
  c.setEnabled = (v) => {
    enabled = v;
    draw();
    return c;
  };
  c.setLabel = (s) => {
    t.setText(s);
    return c;
  };
  c.label = t;
  return c;
}

// Full-screen dim layer that swallows input below it.
export function blocker(scene, alpha = 0.6) {
  const r = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x0c0a10, alpha).setOrigin(0);
  r.setInteractive();
  r.on('pointerdown', (p, lx, ly, ev) => ev?.stopPropagation?.());
  return r;
}
