// scenes/Boot.js — AYG FORGE logo, save load/recovery, data validation, asset warm-up -> MainMenu.
// Progress is real: it advances per completed step / per generated asset; no timer-driven fake bar.
import { Save } from '../core/SaveManager.js';
import { validateData } from '../core/DataValidator.js';
import { Art } from '../core/Art.js';
import { T } from '../core/i18n.js';
import { COSMETICS } from '../data/cosmetics.js';
import { ENEMY_DB } from '../data/enemies.js';
import { SKILLS } from '../data/skills.js';
import { GARAGE_ORDER } from '../data/garage.js';
import { PACKAGES } from '../data/packages.js';
import { backdrop } from '../ui/SceneArt.js';
import { View } from '../core/state.js';

const MIN_LOGO_MS = 900; // logo visibility; progress itself is never faked

export const Boot = {
  id: 'Boot', hub: false, canvas: null,
  enter(ctx, params) {
    ctx.root.innerHTML = `<div class="boot">
      <div class="forge"><div class="forge-mark"><svg viewBox="0 0 120 80" aria-hidden="true"><path d="M14 30h70l22-10v12l-14 8H76l-6 10h14v10H34V50h14l-6-10H24z" fill="#3a4a66" stroke="#0c1426" stroke-width="4" stroke-linejoin="round"/><path d="M20 30h62l20-9" fill="none" stroke="#8fa3c4" stroke-width="3"/><path d="M58 8l6 10-6 6-6-6z" fill="#ff9a3c" stroke="#0c1426" stroke-width="3" stroke-linejoin="round"/><circle cx="58" cy="16" r="16" fill="url(#gl)"/><defs><radialGradient id="gl"><stop offset="0" stop-color="#ffd166" stop-opacity=".7"/><stop offset="1" stop-color="#ff7a2c" stop-opacity="0"/></radialGradient></defs></svg></div>
        <div class="forge-name">AYG <b>FORGE</b></div><div class="forge-sub">${T('boot_presents')}</div></div>
      <div class="boot-load"><div class="boot-step" data-step></div><div class="p-bar boot-bar"><i data-bar style="width:0%"></i></div></div></div>`;
    const stepEl = ctx.root.querySelector('[data-step]'), barEl = ctx.root.querySelector('[data-bar]');
    const t0 = performance.now();
    // asset jobs: real procedural sprite generation that gameplay/menus need first
    const jobs = [];
    COSMETICS.forEach(c => { jobs.push(() => Art.courierPortrait(c.id)); for (let d = 0; d < 4; d++) jobs.push(() => Art.courier(c.id, d, 0, true, 0, false)); });
    Object.values(ENEMY_DB).forEach(e => jobs.push(() => Art.portrait(e.short)));
    SKILLS.forEach(s => jobs.push(() => Art.skillIcon(s.id)));
    GARAGE_ORDER.forEach(id => jobs.push(() => Art.garageIcon(id)));
    Object.keys(PACKAGES).forEach(id => jobs.push(() => Art.pkgIcon(id, 28)));
    ['ops', 'prep', 'workshop', 'control', 'city'].forEach(k => jobs.push(() => backdrop(k, View.h)));
    const total = 2 + jobs.length; let done = 0;
    const prog = () => { barEl.style.width = (done / total * 100).toFixed(1) + '%'; };
    const report = { save: null, data: null };
    const steps = [
      () => { stepEl.textContent = T('boot_save'); Save.load(); report.save = Save.loadStatus; done++; },
      () => { stepEl.textContent = T('boot_data'); const r = validateData(); report.data = r; if (r.errors.length) console.error('[Boot] data validation errors', r.errors); done++; },
    ];
    let i = 0;
    const tick = () => {
      if (!ctx.alive) return;
      const frameEnd = performance.now() + 10;
      while (performance.now() < frameEnd) {
        if (i < steps.length) steps[i++]();
        else if (jobs.length) { if (i === steps.length) { stepEl.textContent = T('boot_assets'); i++; } jobs.shift()(); done++; }
        else break;
      }
      prog();
      if (i >= steps.length && !jobs.length) {
        stepEl.textContent = report.save === 'recovered' ? T('boot_recovered') : report.save === 'unavailable' ? T('boot_noStorage') : report.save === 'migrated' ? T('boot_migrated', T('src_' + (Save.meta.source || 'html5_v1'))) : T('boot_ready');
        Boot.report = report;
        const wait = Math.max(0, MIN_LOGO_MS - (performance.now() - t0)) + (report.save === 'recovered' || report.save === 'unavailable' || report.save === 'migrated' ? 1600 : 0);
        ctx.timeout(() => params.onDone && params.onDone(report), wait);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  exit() {},
  report: null,
};
