// UI çekirdeği: yerleşim/ölçek (16:9 + extend), DOM yardımcıları, düğme, modal, toast, diyalog, ikon kanvasları, tam ekran.
(function (D) {
  'use strict';
  const UI = {};
  // Koşullu çocuk eklerken (cond ? el : null) DOM'a "null" metni düşmesin.
  if (typeof Element !== 'undefined' && !Element.prototype._dumenAppend) {
    const orig = Element.prototype.append;
    Element.prototype._dumenAppend = orig;
    Element.prototype.append = function (...nodes) { return orig.apply(this, nodes.filter((n) => n != null && n !== false)); };
  }
  const $ = (s) => document.querySelector(s);
  UI.view = { W: 1920, H: 1080, scale: 1, dpr: 1 };

  // ---------- yerleşim ----------
  UI.layout = () => {
    const iw = window.innerWidth, ih = window.innerHeight;
    document.body.classList.toggle('portrait', ih > iw * 1.05 && Math.min(iw, ih) < 900);
    const asp = iw / ih;
    let W = 1920, H = 1080;
    if (asp >= 16 / 9) W = Math.min(2400, Math.round(1080 * asp)); else H = Math.min(1440, Math.round(1920 / asp));
    const scale = Math.min(iw / W, ih / H);
    const offX = (iw - W * scale) / 2, offY = (ih - H * scale) / 2;
    const st = $('#stage');
    st.style.width = W + 'px'; st.style.height = H + 'px';
    st.style.transform = `translate(${offX}px, ${offY}px) scale(${scale})`;
    const s = D.Game.settings || {};
    const dpr = Math.min(window.devicePixelRatio || 1, s.lowPower ? 1 : 2);
    const cv = $('#cv');
    cv.width = Math.round(W * scale * dpr); cv.height = Math.round(H * scale * dpr);
    st.style.setProperty('--tap', Math.max(96, Math.ceil(46 / scale)) + 'px');
    st.style.setProperty('--fs', Math.max(32, Math.ceil(13.5 / scale)) * (s.uiScale || 1) + 'px');
    st.style.setProperty('--hudH', 'calc(var(--fs) * 5)');
    // çentik güvenli alanı
    const probe = UI._probe || (UI._probe = Object.assign(document.createElement('div'), { style: 'position:fixed;left:0;top:0;padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right);visibility:hidden;pointer-events:none' }));
    if (!probe.parentNode) document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    st.style.setProperty('--safeL', (parseFloat(cs.paddingLeft) || 0) / scale + 'px');
    st.style.setProperty('--safeR', (parseFloat(cs.paddingRight) || 0) / scale + 'px');
    Object.assign(UI.view, { W, H, scale, dpr, offX, offY });
    D.Art.clearCache('scene:');
    D.bus.emit('layout', UI.view);
  };

  // ---------- DOM ----------
  UI.h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    return el;
  };
  const h = UI.h;
  UI.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  // Tek fiziksel dokunuş = tek eylem. Yalnız 'click' dinlenir; kısa kilit ve "meşgul" bayrağı çift tetiklemeyi engeller.
  UI.btn = (label, fn, opts) => {
    opts = opts || {};
    const b = h('button', { class: 'btn ' + (opts.cls || ''), type: 'button', title: opts.title || null, 'aria-label': opts.aria || null });
    if (opts.icon) b.append(opts.icon);
    if (label != null) b.append(h('span', { class: 'lbl' }, label));
    if (opts.disabled) b.disabled = true;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (b.disabled || b._busy || D.Input.blocked()) return;
      b._busy = true; setTimeout(() => { b._busy = false; }, 180);
      D.Audio.sfx('click');
      try { fn && fn(e); } catch (err) { console.error(err); UI.toast('Hata: ' + err.message, 'bad'); }
    });
    return b;
  };
  // Bir eylemi çalıştırır; sonuç başarısızsa mesaj gösterir, başarılıysa onOk çağrılır. Başarı toast'u yalnız ok sonrası.
  UI.act = (name, payload, onOk, okMsg) => {
    const r = D.Game.act(name, payload);
    if (r.ok) { if (okMsg) UI.toast(typeof okMsg === 'function' ? okMsg(r) : okMsg, 'good'); if (onOk) onOk(r); }
    else if (!r.duplicate) { UI.toast(r.message || 'İşlem yapılamadı.', 'bad'); D.Audio.sfx('error'); }
    return r;
  };

  // ---------- Toast ----------
  UI.toast = (msg, kind, ms) => {
    const root = $('#toast-root');
    const t = h('div', { class: 'toast ' + (kind || '') }, msg);
    root.append(t);
    while (root.children.length > 4) root.firstChild.remove();
    setTimeout(() => t.remove(), ms || 2600);
  };

  // ---------- Modal ----------
  const stack = [];
  UI.modalOpen = () => stack.length > 0;
  UI.modal = (opts) => {
    const root = $('#modal-root');
    const back = h('div', { class: 'modal-back' });
    const panel = h('div', { class: 'panel', style: { width: opts.width ? opts.width + 'px' : null, height: opts.height ? opts.height + 'px' : null } });
    if (opts.title) panel.append(h('h2', null, opts.title));
    const body = h('div', { class: 'col grow ' + (opts.scroll === false ? '' : 'scroll') });
    panel.append(body);
    const actions = h('div', { class: 'modal-actions' });
    panel.append(actions);
    const box = h('div', { class: 'modal' }, panel);
    back.append(box);
    const m = { el: panel, body, actions, closed: false };
    m.close = (val) => {
      if (m.closed) return; m.closed = true;
      back.remove(); const i = stack.indexOf(m); if (i >= 0) stack.splice(i, 1);
      D.Input.block(220);
      if (opts.onClose) opts.onClose(val);
    };
    if (opts.closable !== false) {
      box.append(h('div', { class: 'x' }, UI.btn('✕', () => m.close(), { cls: 'round red', aria: 'Kapat' })));
      back.addEventListener('pointerdown', (e) => { if (e.target === back) m._downBack = true; });
      back.addEventListener('click', (e) => { if (e.target === back && m._downBack) m.close(); m._downBack = false; });
    }
    for (const a of opts.actions || []) actions.append(UI.btn(a.label, () => { if (a.fn) { const keep = a.fn(m); if (keep === true) return; } m.close(a.value); }, { cls: a.cls }));
    if (!actions.children.length) actions.style.display = 'none';
    if (opts.body) { const r = opts.body(body, m); if (r instanceof Node) body.append(r); }
    root.append(back);
    stack.push(m);
    D.Input.releaseAll();
    return m;
  };
  UI.closeTop = () => { const m = stack[stack.length - 1]; if (m) { m.close(); return true; } return false; };
  UI.closeAll = () => { while (stack.length) stack[stack.length - 1].close(); };
  UI.confirm = (title, text, yes, opts) => UI.modal({ title, width: 1100, scroll: false, body: (b) => b.append(h('p', null, text)), actions: [{ label: 'Vazgeç' }, { label: (opts && opts.yesLabel) || 'Evet', cls: (opts && opts.cls) || 'green', fn: () => { yes(); } }] });

  // ---------- Kanvas ikonları ----------
  UI.canvas = (w, h2, draw, cls) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1) * Math.max(0.5, UI.view.scale) * 1.1;
    const cv = h('canvas', { class: cls || null, width: Math.ceil(w * dpr), height: Math.ceil(h2 * dpr) });
    cv.style.width = w + 'px'; cv.style.height = h2 + 'px';
    const c = cv.getContext('2d'); c.scale(dpr, dpr); draw(c, w, h2);
    return cv;
  };
  UI.itemIcon = (id, size) => UI.canvas(size, size, (c) => {
    if (D.CosmeticDB[id]) D.ItemArt.drawCosmetic(c, id, size / 2, size / 2, size * 0.9);
    else if (D.TrashDB[id]) D.ItemArt.drawTrash(c, id, size / 2, size / 2, size * 0.9);
    else D.ItemArt.draw(c, id, size / 2, size / 2, size * 0.92);
  }, 'ico');
  UI.fishIcon = (fishId, size, sil) => UI.canvas(size, size * 0.72, (c) => D.FishArt.draw(c, fishId, size / 2, size * 0.36, size * 0.78, { sil, t: 0.4 }), 'ico');
  UI.portrait = (npc, size) => {
    const cv = UI.canvas(size, size, (c) => D.NPCArt.portrait(c, npc, size / 2, size / 2, size / 2 - 6, 0.5));
    return cv;
  };
  UI.rarityBadge = (r) => h('span', { class: 'rar', style: { background: D.RARITY_COLOR[r] } }, D.RARITY_ICON[r] + ' ' + D.RARITY_TR[r]);
  UI.walletChip = (id, n) => h('span', { class: 'chip' }, UI.itemIcon(id, 40), D.fmt(n));
  UI.rewardList = (got) => h('div', { class: 'row wrap' }, (got || []).map((g) => h('span', { class: 'chip' }, g.cosmetic ? UI.itemIcon(g.cosmetic, 40) : g.id ? UI.itemIcon(g.id, 40) : null, D.Inv.describe([g])[0])));

  // ---------- Diyalog ----------
  // lines: [[konuşan, metin] | {choice:[{label,set,reply}]}]; vars: {fishCaught, playMin}
  UI.dialog = (lines, opts) => new Promise((resolve) => {
    opts = opts || {};
    const root = $('#modal-root');
    const back = h('div', { class: 'modal-back', style: { alignItems: 'flex-end', background: 'rgba(11,24,36,.35)' } });
    const ptWrap = h('div', { class: 'pt' });
    const name = h('div', { class: 'name' }), txt = h('div', { class: 'txt' }), choices = h('div', { class: 'choices' }), nxt = h('div', { class: 'nxt' }, '▼ dokun');
    const box = h('div', { class: 'box' }, name, txt, choices, nxt);
    const dlg = h('div', { class: 'dlg' }, ptWrap, box);
    back.append(dlg); root.append(back);
    const m = { close() {} }; stack.push(m);
    D.Input.releaseAll();
    const queue = lines.slice();
    let typing = null, full = '', shownSpeaker = null;
    const fill = (s) => s.replace(/\{(\w+)\}/g, (_, k) => (opts.vars && opts.vars[k] != null ? opts.vars[k] : ''));
    const end = () => { back.remove(); const i = stack.indexOf(m); if (i >= 0) stack.splice(i, 1); D.Input.block(260); resolve(); };
    m.close = end;
    const next = () => {
      if (typing) { clearInterval(typing); typing = null; txt.textContent = full; return; }
      const item = queue.shift();
      if (!item) return end();
      if (item.choice) {
        UI.clear(choices); nxt.style.display = 'none';
        for (const ch of item.choice) choices.append(UI.btn(ch.label, () => {
          UI.clear(choices); nxt.style.display = '';
          if (ch.set) D.Game.act('choice', { set: ch.set });
          if (opts.onChoice) opts.onChoice(ch);
          queue.unshift(...(ch.reply || []));
          next();
        }, { cls: 'block' }));
        return;
      }
      const [who, line] = item;
      if (who !== shownSpeaker) { UI.clear(ptWrap); if (who !== 'player' && D.NPCArt.has(who)) ptWrap.append(UI.portrait(who, 250)); else if (who === 'player') ptWrap.append(UI.portrait('player', 250)); shownSpeaker = who; }
      name.textContent = (D.NPCDB[who] || { name: who }).name;
      full = fill(line); txt.textContent = '';
      let i = 0; D.Audio.sfx('dialog');
      const reduce = D.Game.settings && D.Game.settings.reducedMotion;
      if (reduce) { txt.textContent = full; return; }
      typing = setInterval(() => { i += 2; txt.textContent = full.slice(0, i); if (i >= full.length) { clearInterval(typing); typing = null; } }, 18);
    };
    back.addEventListener('click', (e) => { if (choices.children.length || D.Input.blocked()) return; next(); });
    next();
  });

  // ---------- Tam ekran ----------
  UI.fullscreen = {
    supported() { const el = document.documentElement; return !!(el.requestFullscreen || el.webkitRequestFullscreen); },
    active() { return !!(document.fullscreenElement || document.webkitFullscreenElement); },
    async toggle() {
      const el = document.documentElement;
      if (!UI.fullscreen.supported()) { UI.toast('Bu tarayıcı tam ekranı desteklemiyor. iPhone\'da: Paylaş → "Ana Ekrana Ekle" ile tam ekran açılır.', 'bad', 4200); return; }
      try {
        if (UI.fullscreen.active()) { await (document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen()); }
        else {
          await (el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen());
          try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) { /* bazı tarayıcılarda kilit yok */ }
        }
      } catch (e) { UI.toast('Tam ekran açılamadı: ' + (e.message || 'tarayıcı izin vermedi'), 'bad', 3500); }
    }
  };

  // ---------- Konuşma balonu (sahne üstü) ----------
  // Martı konuşma balonu (kullanıcı görseli assets/ui/bubble.webp, 900×644; kuyruk ucu %70.5 / %99.7).
  // (tipX, tipY): kuyruğun değeceği nokta (martının başı). inline: akışta (modal içinde) gösterilir.
  const BUB = { w: 900, h: 644, tip: [0.705, 0.997], text: [0.12, 0.13, 0.76, 0.57] };
  UI.fitText = (el, max, min) => { let f = max; el.style.fontSize = f + 'em'; while (f > min && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) { f -= 0.03; el.style.fontSize = f + 'em'; } };
  UI.gullBubble = (text, opts) => {
    opts = opts || {};
    if (!D.Assets.get('bubble')) return h('div', { class: 'speech' + (opts.inline ? ' inline' : '') }, text);
    const t = BUB.text, inner = h('div', { class: 'gb-text', style: { left: t[0] * 100 + '%', top: t[1] * 100 + '%', width: t[2] * 100 + '%', height: t[3] * 100 + '%' } }, h('span', null, text));
    const el = h('div', { class: 'gbubble' + (opts.inline ? ' inline' : ''), role: 'status', style: { width: (opts.w || 600) + 'px', backgroundImage: 'url(' + D.Assets.get('bubble').src + ')' } }, inner);
    requestAnimationFrame(() => UI.fitText(inner, opts.fs || 1.05, 0.5));
    return el;
  };
  UI.gullSpeech = (parent, tipX, tipY, text, ms, opts) => {
    opts = opts || {};
    if (parent._gull) parent._gull.remove();
    const w = opts.w || 600, hh = w * BUB.h / BUB.w, v = UI.view;
    const el = UI.gullBubble(text, { w, fs: opts.fs });
    if (!D.Assets.get('bubble')) { el.style.left = Math.max(20, tipX - 60) + 'px'; el.style.top = Math.max(110, tipY - 160) + 'px'; }
    else {
      const left = D.clamp(tipX - BUB.tip[0] * w, 16, v.W - w - 16), top = D.clamp(tipY - BUB.tip[1] * hh, 8, v.H - hh - 8);
      el.style.left = left + 'px'; el.style.top = top + 'px';
    }
    parent.append(el); parent._gull = el;
    setTimeout(() => { el.remove(); if (parent._gull === el) parent._gull = null; }, ms || Math.max(4200, Math.min(9000, 1800 + text.length * 55)));
    return el;
  };
  UI.speech = (parent, x, y, text, ms) => {
    const sp = h('div', { class: 'speech', style: { left: x + 'px', top: y + 'px' } }, text);
    parent.append(sp); setTimeout(() => sp.remove(), ms || 3600);
    return sp;
  };
  D.UI = UI;
})(globalThis.DUMEN);
