// scenes/Settings.js — separate control centre. Every control here really works:
// audio (master/music/SFX), shake, vibration, reduced motion, low graphics, fullscreen (if supported),
// tutorial reset, save export / import (validated + confirmed, previous save kept as backup), progress reset.
// Not yet in this build (shown disabled with reason): extra languages (Phase 14), joystick/fire layout
// purchase restore (needs native billing). Phase 03: joystick/fire size, control opacity and left-handed mode.
import { Save } from '../core/SaveManager.js';
import { Audio } from '../core/AudioManager.js';
import { T } from '../core/i18n.js';
import { View } from '../core/state.js';
import { PlatformAdapter } from '../platform/PlatformAdapter.js';
import { icon } from '../ui/icons.js';
import { backdrop } from '../ui/SceneArt.js';
import { btn } from '../ui/UITheme.js';
import { Overlays } from '../ui/Overlays.js';
import { App } from '../ui/App.js';

const fsOk = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

export const Settings = {
  id: 'Settings', hub: true, navIndex: 4, canvas: null,
  enter(ctx) {
    ctx.root.style.backgroundImage = `url(${backdrop('control', View.h)})`;
    this.render(ctx);
    ctx.on(ctx.root, 'click', e => this.onClick(e, ctx));
    ctx.on(ctx.root, 'change', e => this.onFile(e, ctx));
    ctx.on(document, 'fullscreenchange', () => this.render(ctx));
  },
  render(ctx) {
    const s = Save.data.settings, hasV = !!navigator.vibrate;
    const sc = ctx.root.querySelector('.p-scroll'), st = sc ? sc.scrollTop : 0;
    const tog = (k, note = '') => `<div class="st-row"><span>${T('s_' + k)}${note ? ` <small>${note}</small>` : ''}</span><button class="tog ${s[k] ? 'on' : ''}" data-a="tog" data-k="${k}" role="switch" aria-checked="${!!s[k]}" aria-label="${T('s_' + k)}"></button></div>`;
    const seg = (k, opts) => `<div class="st-row"><span>${T('s_' + k)}</span><span class="st-seg">${opts.map(([v, l]) => `<button class="${Math.abs((s[k] || 1) - v) < 0.01 ? 'on' : ''}" data-a="set" data-k="${k}" data-v="${v}">${/%$/.test(l) ? l : T(l)}</button>`).join('')}</span></div>`;
    const group = (ic, title, body) => `<div class="st-g p-card p-navy"><div class="st-h">${icon(ic)}<b>${title}</b></div>${body}</div>`;
    ctx.root.innerHTML = `<div class="st">
      <h1 class="p-title">${T('settings')}</h1>
      <div class="p-scroll st-list">
        ${group('sound', T('st_audio'), tog('master') + tog('music') + tog('sfx'))}
        ${group('gamepad', T('st_play'), tog('shake') + tog('vibe', hasV ? '' : T('s_noVibe')) + tog('leftHanded') +
          seg('joySize', [[0.85, 'sz_S'], [1, 'sz_M'], [1.2, 'sz_L']]) + seg('fireSize', [[0.85, 'sz_S'], [1, 'sz_M'], [1.2, 'sz_L']]) +
          seg('ctrlOpacity', [[0.5, '50%'], [0.75, '75%'], [1, '100%']]))}
        ${group('monitor', T('st_display'), tog('reducedMotion') + tog('lowGfx') +
          `<div class="st-row"><span>${T('s_fullscreen')}${fsOk() ? '' : ` <small>${T('s_unsupported')}</small>`}</span>${btn(isFs() ? T('s_exitFs') : T('s_enterFs'), `data-a="fs" ${fsOk() ? '' : 'disabled'}`, 'blue', 'sm')}</div>`)}
        ${group('globe', T('st_lang'), `<div class="st-row"><span>Türkçe</span><span class="st-on">${icon('check')}</span></div><div class="st-row dis"><span>English · Deutsch · Français · Español · Português (BR) <small>${T('s_langSoon')}</small></span></div>`)}
        ${group('save', T('st_data'), `<div class="st-btns">${btn(T('s_export'), 'data-a="export"', 'blue', 'sm')}${btn(T('s_import'), 'data-a="import"', 'blue', 'sm')}</div>
          <input type="file" accept="application/json,.json" data-file hidden>
          <div class="st-btns">${btn(T('s_tutReset'), 'data-a="tut"', 'steel', 'sm')}${btn(T('s_reset'), 'data-a="reset"', 'red', 'sm')}</div>
          <small class="st-note">${T('s_dataNote')}</small>
          <small class="st-note">${T('s_saveInfo', Save.meta.rev, (Save.meta.slot || '-').toUpperCase())}${Save.meta.source ? ' · ' + T('s_saveSource', T('src_' + Save.meta.source)) : ''}${Save.meta.gdevelopDetected ? ' · ' + T('s_gdevDetected') : ''}${Object.keys(Save.data.legacy.refunded).length ? ' · ' + T('s_legacyRefund', Object.values(Save.data.legacy.refunded).reduce((a, b) => a + b, 0)) : ''}</small>`)}
        ${group('store', T('st_purchases'), `<div class="st-row dis"><span>${T('s_restore')} <small>${PlatformAdapter.billing.available ? '' : T('s_billingNA')}</small></span></div>
          <div class="st-row dis"><span>${T('s_privacy')} <small>${T('s_privacyNote')}</small></span></div>`)}
        <div class="st-foot">${T('s_controlsInfo')}<br>DeliveRogue v0.3 · AYG FORGE</div>
      </div></div>`;
    const s2 = ctx.root.querySelector('.p-scroll'); if (s2) s2.scrollTop = st;
  },
  onClick(e, ctx) {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    Audio.init(); Audio.play('click');
    const a = b.dataset.a;
    if (a === 'tog') {
      const k = b.dataset.k, v = Overlays.toggleSetting(k, b); b.setAttribute('aria-checked', v);
      if (k === 'reducedMotion') App.applyMotion();
      if (k === 'lowGfx') App.applyGraphics();
    } else if (a === 'set') {
      Save.data.settings[b.dataset.k] = +b.dataset.v; Save.write(); this.render(ctx);
    } else if (a === 'fs') {
      const el = document.documentElement;
      try { if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else (el.requestFullscreen || el.webkitRequestFullscreen).call(el); } catch (err) { App.toast(T('s_unsupported')); }
    } else if (a === 'export') {
      const bundle = Save.exportBundle(), blob = new Blob([JSON.stringify(bundle, null, 1)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'deliverogue_save_' + bundle.exportedAt.slice(0, 10) + '.json'; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000); App.toast(T('s_exported'));
    } else if (a === 'import') ctx.root.querySelector('[data-file]').click();
    else if (a === 'tut') Overlays.confirm(T('s_tutResetQ'), T('s_tutReset'), () => { Save.data.tutorial = {}; Save.write(); App.toast(T('s_tutResetDone')); }, { danger: false });
    else if (a === 'reset') Overlays.confirm(T('s_resetQ'), T('s_resetYes'), () => { Save.reset(); Audio.apply(); App.applyMotion(); App.applyGraphics(); App.toast(T('s_resetDone')); App.refreshChrome(); this.render(ctx); });
  },
  onFile(e, ctx) {
    const input = e.target.closest('[data-file]'); if (!input || !input.files || !input.files[0]) return;
    const f = input.files[0]; input.value = '';
    f.text().then(text => {
      if (!ctx.alive) return;
      const r = Save.inspectBundle(text);
      if (!r.ok) { App.toast(T('s_importBad')); return; }
      const d = r.data;
      Overlays.confirm(T('s_importQ'), T('s_import'), () => {
        if (Save.applyImport(d)) { Audio.apply(); App.applyMotion(); App.applyGraphics(); App.refreshChrome(); this.render(ctx); App.toast(T('s_imported')); }
        else App.toast(T('s_saveFail'));
      }, { danger: true, sub: T('s_importSum', d.level, d.coins, d.completed.filter(Boolean).length) + (r.checksumOk ? '' : ' · ' + T('s_checksumWarn')) });
    }).catch(() => App.toast(T('s_importBad')));
  },
  refresh(ctx) { this.render(ctx); },
  exit() {},
};
