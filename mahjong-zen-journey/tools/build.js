#!/usr/bin/env node
/*
 * Bundles src/ into a single self-contained index.html (no external files,
 * no CDN) and packages dist/mahjong-zen-journey-itch.zip for itch.io.
 * Usage: node tools/build.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const MODULES = ['core.js', 'levels-data.js', 'validator.js', 'progress.js', 'assets.js', 'audio.js', 'save.js', 'renderer.js', 'debug.js', 'game.js'];

function build() {
  const tpl = fs.readFileSync(path.join(SRC, 'template.html'), 'utf8');
  const css = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');
  let js = '';
  for (const m of MODULES) {
    const code = fs.readFileSync(path.join(SRC, m), 'utf8');
    if (/<\/script/i.test(code)) throw new Error(m + ' contains a closing script tag');
    js += `\n/* ===== ${m} ===== */\n` + code;
  }
  const html = tpl.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
  if (/(src|href)=["']https?:/i.test(html)) throw new Error('external resource reference found');
  const out = path.join(ROOT, 'index.html');
  fs.writeFileSync(out, html);
  console.log(`index.html: ${(html.length / 1024).toFixed(1)} KB`);

  const dist = path.join(ROOT, 'dist');
  fs.mkdirSync(dist, { recursive: true });
  const zip = path.join(dist, 'mahjong-zen-journey-itch.zip');
  if (fs.existsSync(zip)) fs.unlinkSync(zip);
  try {
    execFileSync('zip', ['-j', '-9', '-X', zip, out], { stdio: 'ignore' });
    console.log(`dist/mahjong-zen-journey-itch.zip: ${(fs.statSync(zip).size / 1024).toFixed(1)} KB`);
  } catch (e) {
    console.warn('zip not available — skipped ZIP packaging');
  }
}

build();
