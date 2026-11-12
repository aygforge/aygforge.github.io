/* FOOTBALL WARS — application controller (UI, live battle, automatic video export). */
(function () {
'use strict';
const DB = window.FW_MASTER_DB, CFG = window.FW_ENGINE_CONFIG, FLAGS = window.FW_FLAGS || {}, LIC = window.FW_LICENSES || {};
const E = window.FWEngine, S = window.FWSprites, F = window.FWFont, R = window.FWRender, A = window.FWAudio, X = window.FWExport;
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ALL = [...DB.clubs, ...DB.national_teams];
const BY_ID = new Map(ALL.map(t => [t.id, t]));
const LEAGUES = new Map(DB.leagues.map(l => [l.id, l]));
const ERRORS = [];
window.addEventListener('error', e => ERRORS.push(String(e.message || e)));
window.addEventListener('unhandledrejection', e => ERRORS.push(String((e.reason && e.reason.message) || e.reason)));
const DIAG = { matches: 0, exports: 0, urls: new Set(), lastLive: null, lastExport: null, encoderOpen: 0 };

// ======================= data checks =======================
function dataChecks() {
  const c = [];
  const m = DB.metadata.counts;
  c.push({ k: 'Lig sayısı', v: DB.leagues.length, ok: DB.leagues.length === 11 && m.leagues === 11 });
  c.push({ k: 'Kulüp sayısı', v: DB.clubs.length, ok: DB.clubs.length === 194 && m.clubs === 194 });
  c.push({ k: 'Milli takım sayısı', v: DB.national_teams.length, ok: DB.national_teams.length === 55 && m.national_teams === 55 });
  c.push({ k: 'Toplam takım', v: ALL.length, ok: ALL.length === 249 && m.total === 249 });
  c.push({ k: 'Benzersiz ID', v: BY_ID.size, ok: BY_ID.size === ALL.length });
  const rolesOk = ALL.filter(t => Object.values(t.battle_profile.roles_per_100).reduce((a, b) => a + b, 0) === 100).length;
  c.push({ k: 'roles_per_100 toplamı = 100', v: rolesOk + '/' + ALL.length, ok: rolesOk === ALL.length });
  const attrOk = ALL.filter(t => E.ATTRS.every(a => typeof t.battle_profile.attributes[a] === 'number')).length;
  c.push({ k: '10 özellik alanı mevcut', v: attrOk + '/' + ALL.length, ok: attrOk === ALL.length });
  const leagueOk = DB.leagues.every(l => l.team_ids.length === l.club_count && l.team_ids.every(id => BY_ID.has(id) && BY_ID.get(id).league_id === l.id));
  c.push({ k: 'Lig ↔ kulüp bağları', v: leagueOk ? 'tutarlı' : 'HATA', ok: leagueOk });
  const arch = ALL.every(t => CFG.archetype_definitions[t.battle_profile.archetype]);
  c.push({ k: 'Taktik arketipleri config’te tanımlı', v: arch ? 'evet' : 'HAYIR', ok: arch });
  return c;
}

// ======================= search =======================
function norm(s) { return String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ß/g, 'ss').replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, ' ').trim(); }
const INDEX = ALL.map(t => {
  const lg = t.league_id ? LEAGUES.get(t.league_id) : null;
  const keys = [t.name, t.display_name_tr, ...(t.search_aliases || []), t.search_key, t.id.replace(/^[A-Z]+_/, '').replace(/_/g, ' ')].map(norm).filter(Boolean);
  const extra = [t.country, lg ? lg.name : '', t.country_code].map(norm).filter(Boolean);
  return { t, keys: [...new Set(keys)], extra: [...new Set(extra)], compact: [...new Set(keys.map(k => k.replace(/ /g, '')))] };
});
function search(q, f) {
  const nq = norm(q), cq = nq.replace(/ /g, '');
  const out = [];
  for (const it of INDEX) {
    const t = it.t;
    if (f.type && t.type !== f.type) continue;
    if (f.league && t.league_id !== f.league) continue;
    let score = 9;
    if (!nq) score = 5;
    else {
      for (const k of it.keys) { if (k === nq) score = Math.min(score, 0); else if (k.startsWith(nq)) score = Math.min(score, 1); else if (k.split(' ').some(w => w.startsWith(nq))) score = Math.min(score, 2); else if (k.includes(nq)) score = Math.min(score, 3); }
      for (const k of it.compact) if (cq.length > 1 && k.includes(cq)) score = Math.min(score, 3);
      for (const k of it.extra) if (k.startsWith(nq) || (nq.length > 2 && k.includes(nq))) score = Math.min(score, 4);
    }
    if (score < 9) out.push([score, t]);
  }
  out.sort((a, b) => a[0] - b[0] || b[1].battle_profile.power_index - a[1].battle_profile.power_index);
  return out.map(x => x[1]);
}

// ======================= modes / validation =======================
const MODES = [
  ['domestic_league', 'Lig maçı (aynı lig) — Süper Lig ve diğer ligler', { tr: null, en: null }],
  ['champions_league', 'Şampiyonlar Ligi — kurgusal eşleşme', { tr: 'ŞAMPİYONLAR LİGİ', en: 'CHAMPIONS LEAGUE' }],
  ['europa_league', 'Avrupa Ligi — kurgusal eşleşme', { tr: 'AVRUPA LİGİ', en: 'EUROPA LEAGUE' }],
  ['conference_league', 'Konferans Ligi — kurgusal eşleşme', { tr: 'KONFERANS LİGİ', en: 'CONFERENCE LEAGUE' }],
  ['national_match', 'Milli maç', { tr: 'MİLLİ MAÇ', en: 'INTERNATIONAL' }],
  ['custom_exhibition', 'Serbest gösteri maçı', { tr: 'GÖSTERİ MAÇI', en: 'EXHIBITION' }]
];
const MODE_NOTES = {
  domestic_league: 'İki kulüp aynı ligden olmalı. Lig seçin (varsayılan: Süper Lig).',
  champions_league: 'KURGUSAL EŞLEŞME: Veri tabanındaki herhangi iki kulübü seçebilirsiniz. Gerçek UEFA fikstürü, resmî katılımcı listesi veya uygunluk doğrulanmaz/iddia edilmez.',
  europa_league: 'KURGUSAL EŞLEŞME: Herhangi iki kulüp seçilebilir. Gerçek fikstür veya katılımcı listesi iddiası yoktur.',
  conference_league: 'KURGUSAL EŞLEŞME: Herhangi iki kulüp seçilebilir. Gerçek fikstür veya katılımcı listesi iddiası yoktur.',
  national_match: 'İki UEFA milli takımı. Kaynak: FIFA erkekler dünya sıralaması (7 Ekim 2026); savaş gücü oyun için türetilmiş endekstir.',
  custom_exhibition: 'Serbest eşleşme. Kulüp ile milli takım karışık maç varsayılan olarak kapalıdır; Elo ve FIFA puanları aynı ölçeğe konmaz, yalnız oyunun güç endeksi kullanılır.'
};
function modeType(mode) { return mode === 'national_match' ? 'national' : mode === 'custom_exhibition' ? null : 'club'; }
function validate(a, b, mode, mixed) {
  const cfg = DB.metadata.modes[mode]; if (!cfg) return { ok: false, error: 'Bilinmeyen turnuva tipi' };
  if (!a && !b) return { ok: false, error: 'Takım A ve Takım B seçilmedi.' };
  if (!a) return { ok: false, error: 'Takım A seçilmedi.' };
  if (!b) return { ok: false, error: 'Takım B seçilmedi.' };
  if (a.id === b.id) return { ok: false, error: 'Bir takım kendisiyle eşleştirilemez.' };
  if (mode === 'domestic_league' && (a.type !== 'club' || b.type !== 'club' || a.league_id !== b.league_id)) return { ok: false, error: 'Lig maçı modu aynı ligdeki iki kulübü gerektirir.' };
  if (mode === 'national_match' && (a.type !== 'national' || b.type !== 'national')) return { ok: false, error: 'Milli maç modu iki milli takım gerektirir.' };
  if (['champions_league', 'europa_league', 'conference_league'].includes(mode) && (a.type !== 'club' || b.type !== 'club')) return { ok: false, error: 'UEFA kulüp turnuvası modları iki kulüp gerektirir.' };
  if (mode === 'custom_exhibition' && a.type !== b.type && !mixed) return { ok: false, error: 'Kulüp–milli takım karma maçı için “karma eşleşmeye izin ver” seçeneğini açın.' };
  return { ok: true };
}

// ======================= logos =======================
const flagImgs = new Map();
const userLogos = new Map();
const logoCache = new Map();
async function loadFlags() {
  const jobs = [];
  for (const id in FLAGS) {
    const img = new Image(); img.src = FLAGS[id].data;
    jobs.push(img.decode().then(() => flagImgs.set(id, img)).catch(() => { }));
  }
  for (const id in S.SIMPLE_FLAGS) if (!FLAGS[id]) flagImgs.set(id, S.simpleFlagImage(id));
  await Promise.all(jobs);
  // user logos saved earlier in this browser
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (!k || !k.startsWith('fw_logo:')) continue;
      const id = k.slice(8); if (!BY_ID.has(id)) continue;
      const img = new Image(); img.src = localStorage.getItem(k);
      try { await img.decode(); if (canvasSafe(img)) userLogos.set(id, img); } catch (e) { }
    }
  } catch (e) { }
}
function canvasSafe(img) { try { const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 2, 2); g.getImageData(0, 0, 1, 1); return true; } catch (e) { return false; } }
function logoKind(team) {
  if (userLogos.has(team.id)) return { kind: 'user', label: 'Kullanıcı tarafından yüklenen logo (yalnız bu tarayıcıda saklanır).', real: false };
  if (FLAGS[team.id]) return { kind: 'flag', label: 'Ülke bayrağı — Wikimedia Commons (' + FLAGS[team.id].file + '). Federasyon arması değildir.', real: true };
  if (S.SIMPLE_FLAGS[team.id]) return { kind: 'flag-simple', label: 'Basitleştirilmiş bayrak çizimi (yerel üretim). Federasyon arması değildir.', real: false };
  return { kind: 'generated', label: 'TEMSİLİ arma: takım renkleri ve baş harflerinden üretildi — resmî logo değildir.', real: false };
}
function logoSet(team) {
  let L = logoCache.get(team.id); if (L) return L;
  const k = logoKind(team);
  let small, big;
  if (k.kind === 'user') { const img = userLogos.get(team.id); small = S.imageBadge(img, 26); big = S.imageBadge(img, 96); }
  else if (k.kind === 'flag' || k.kind === 'flag-simple') { const img = flagImgs.get(team.id); if (img) { small = S.flagBadge(img, 26); big = S.flagBadge(img, 96); } }
  if (!small) { small = S.generatedCrest(team, 26); big = S.generatedCrest(team, 96); if (k.kind !== 'generated') { k.kind = 'generated'; k.label = 'TEMSİLİ arma (bayrak yüklenemedi).'; } }
  const thumb = big.toDataURL('image/png');
  L = { small, big, thumb, ...k };
  logoCache.set(team.id, L);
  return L;
}

// ======================= settings / persistence =======================
function radio(name) { const el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : null; }
function setRadio(name, v) { const el = document.querySelector('input[name="' + name + '"][value="' + v + '"]'); if (el && !el.disabled) el.checked = true; }
function settings() {
  return {
    res: radio('res') || '1080', fps: +(radio('fps') || 30), duration: radio('dur') || 'standard', fx: +(radio('fx') || 1), lang: radio('lang') || 'tr',
    sound: $('optSound').checked, labels: $('optLabels').checked, music: +$('volMusic').value / 100, sfx: +$('volSfx').value / 100
  };
}
function saveSettings() { try { localStorage.setItem('fw_settings', JSON.stringify({ ...settings(), mode: st.mode, league: st.league })); } catch (e) { } }
function loadSettings() {
  let s = null; try { s = JSON.parse(localStorage.getItem('fw_settings') || 'null'); } catch (e) { }
  if (!s) return null;
  setRadio('res', s.res); setRadio('fps', s.fps); setRadio('dur', s.duration); setRadio('fx', s.fx); setRadio('lang', s.lang);
  $('optSound').checked = s.sound !== false; $('optLabels').checked = s.labels !== false;
  if (s.music != null) $('volMusic').value = Math.round(s.music * 100); if (s.sfx != null) $('volSfx').value = Math.round(s.sfx * 100);
  return s;
}

// ======================= state =======================
const st = { mode: 'domestic_league', league: 'TUR_SUPER', typeFilter: '', mixed: false, a: null, b: null, phase: 'idle', caps: null, audioCtx: null,
  match: null, live: null, videoURL: null, cancel: false, lastSeed: null, lastSettings: null, player: null, raf: 0 };

// ======================= UI: modes & pickers =======================
function fillModes() {
  $('mode').innerHTML = MODES.map(m => `<option value="${m[0]}">${esc(m[1])}</option>`).join('');
  $('mode').value = st.mode;
}
function fillLeague() {
  const m = st.mode, sel = $('league');
  $('leagueWrap').classList.toggle('hidden', m === 'national_match');
  $('typeWrap').classList.toggle('hidden', m !== 'custom_exhibition');
  $('mixedWrap').classList.toggle('hidden', m !== 'custom_exhibition');
  if (m === 'domestic_league') {
    $('leagueLbl').textContent = 'Lig (zorunlu — iki kulüp de bu ligden)';
    sel.innerHTML = DB.leagues.map(l => `<option value="${l.id}">${esc(l.name)} — ${esc(l.country)} (${l.club_count} kulüp)</option>`).join('');
    if (!LEAGUES.has(st.league)) st.league = 'TUR_SUPER';
    sel.value = st.league;
  } else {
    $('leagueLbl').textContent = 'Lig filtresi (aramayı daraltır)';
    sel.innerHTML = '<option value="">Tüm ligler</option>' + DB.leagues.map(l => `<option value="${l.id}">${esc(l.name)} — ${esc(l.country)}</option>`).join('');
    sel.value = LEAGUES.has(st.league) && m !== 'domestic_league' ? st.league : '';
    if (m !== 'domestic_league') st.league = sel.value;
  }
  $('modeNote').textContent = MODE_NOTES[m];
  $('modeNote').className = 'note' + (['champions_league', 'europa_league', 'conference_league'].includes(m) ? ' warn' : '');
}
function filterFor() {
  const m = st.mode; const f = { type: modeType(m), league: '' };
  if (m === 'domestic_league') f.league = st.league;
  else if (m !== 'national_match') f.league = st.league || '';
  if (m === 'custom_exhibition') { f.type = st.typeFilter || null; if (f.league) f.type = 'club'; }
  return f;
}
function leagueName(t) { return t.type === 'national' ? 'Milli takım • ' + t.country : ((LEAGUES.get(t.league_id) || {}).name || '') + ' • ' + t.country; }
const pickers = {};
function setupPicker(side) {
  const inp = $('search' + side), box = $('res' + side);
  const P = { side, inp, box, list: [], act: -1 };
  pickers[side] = P;
  const render = () => {
    const f = filterFor();
    P.list = search(inp.value, f).slice(0, 60);
    const other = side === 'A' ? st.b : st.a;
    if (!P.list.length) { box.innerHTML = '<div class="res dis"><span></span><span class="lg">Sonuç yok — farklı bir yazım deneyin ya da lig filtresini değiştirin.</span><span></span></div>'; box.classList.add('open'); return; }
    box.innerHTML = P.list.map((t, i) => {
      const dis = other && other.id === t.id;
      return `<div class="res${dis ? ' dis' : ''}${i === P.act ? ' act' : ''}" data-i="${i}" title="${dis ? 'Kendi kendisiyle maç seçilemez' : ''}"><img src="${logoSet(t).thumb}" alt=""><div><div class="nm">${esc(t.display_name_tr || t.name)}</div><div class="lg">${esc(leagueName(t))}${dis ? ' — zaten diğer tarafta' : ''}</div></div><span class="pw">${t.battle_profile.power_index}</span></div>`;
    }).join('');
    box.classList.add('open');
  };
  P.render = render;
  inp.addEventListener('input', () => { P.act = -1; render(); });
  inp.addEventListener('focus', () => { render(); });
  inp.addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'ArrowDown') { P.act = Math.min(P.list.length - 1, P.act + 1); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { P.act = Math.max(0, P.act - 1); render(); e.preventDefault(); }
    else if (e.key === 'Enter') { const t = P.list[P.act >= 0 ? P.act : 0]; if (t) choose(side, t); e.preventDefault(); }
    else if (e.key === 'Escape') box.classList.remove('open');
  });
  box.addEventListener('mousedown', e => { const el = e.target.closest('.res'); if (!el || el.classList.contains('dis')) { e.preventDefault(); return; } const t = P.list[+el.dataset.i]; if (t) choose(side, t); e.preventDefault(); });
  document.addEventListener('mousedown', e => { if (!$('pick' + side).contains(e.target)) box.classList.remove('open'); });
}
function choose(side, t) {
  const other = side === 'A' ? st.b : st.a;
  if (other && other.id === t.id) return;
  if (side === 'A') st.a = t; else st.b = t;
  pickers[side].inp.value = t.display_name_tr || t.name;
  pickers[side].box.classList.remove('open');
  if (st.phase === 'done' || st.phase === 'error') st.phase = 'idle', setState('idle'); else refresh();
  renderCard(side);
}
const STAT_LABEL = { attack: 'Hücum', defense: 'Savunma', speed: 'Hız', pressing: 'Pres', teamwork: 'Takım oyunu', finishing: 'Bitiricilik' };
function renderCard(side) {
  const t = side === 'A' ? st.a : st.b, el = $('card' + side);
  if (!t) { el.classList.remove('on'); el.innerHTML = ''; return; }
  const bp = t.battle_profile, L = logoSet(t), arch = CFG.archetype_definitions[bp.archetype] || {};
  const sr = t.source_rating;
  const srTxt = sr.provider === 'FIFA' ? `FIFA puanı ${sr.value} (dünya ${sr.position}.) — ${sr.edition_date}` : `beyondELO kulüp Elo ${sr.value} (lig sırası ${sr.position}.)`;
  const bonus = Object.entries(arch.stat || {}).map(([k, v]) => `${STAT_LABEL[k] || k} ${v > 0 ? '+' : ''}${v}`).join(', ');
  const roles = Object.entries(bp.roles_per_100).map(([r, n]) => `<span class="tag">${E.ROLE_NAMES[r].tr} ${n}</span>`).join('');
  el.innerHTML = `<div class="hd"><img class="logo" src="${L.thumb}" alt=""><div><div class="tn">${esc(t.display_name_tr || t.name)}</div>
    <div class="meta">${esc(leagueName(t))}</div>
    <div class="meta"><span class="sw" style="background:${esc(t.visual.primary_color)}"></span><span class="sw" style="background:${esc(t.visual.secondary_color)}"></span> Güç endeksi <b style="color:#fff">${bp.power_index}</b> • ${esc(bp.archetype_label_tr || arch.tr || bp.archetype)}</div>
    <div class="pwbar"><i style="width:${bp.power_index}%"></i></div></div></div>
    <div class="stats">${['attack', 'defense', 'speed', 'pressing', 'teamwork', 'finishing'].map(k => `<div class="stat">${STAT_LABEL[k]} <b style="color:#fff">${bp.attributes[k]}</b><div class="bar"><i style="width:${bp.attributes[k]}%"></i></div></div>`).join('')}</div>
    <div class="tags">${bp.specials.map(s => `<span class="tag sp">★ ${esc((E.SPECIAL_NAMES[s] || {}).tr || s)}</span>`).join('')}<span class="tag">Taktik bonusu: ${esc(bonus || '—')}</span></div>
    <div class="tags">${roles}</div>
    <div class="note">Kaynak referansı: ${esc(srTxt)}</div>
    <div class="logo-src"><span class="badge${L.real ? ' real' : ''}">${L.kind === 'flag' ? 'BAYRAK' : L.kind === 'user' ? 'KULLANICI' : 'TEMSİLİ'}</span>${esc(L.label)}
      <div class="row" style="margin-top:6px"><button class="btn small" data-up="${t.id}">Logo yükle (PNG/SVG)</button>${L.kind === 'user' ? `<button class="btn small ghost" data-rm="${t.id}">Yüklenen logoyu kaldır</button>` : '<span></span>'}</div></div>`;
  el.classList.add('on');
}
function refresh() {
  const v = validate(st.a, st.b, st.mode, st.mixed);
  const busy = st.phase === 'live' || st.phase === 'encoding';
  $('btnStart').disabled = !v.ok || busy || !st.ready;
  $('startReason').textContent = !st.ready ? 'Hazırlanıyor…' : busy ? 'Savaş/video işlemi sürüyor…' : v.ok ? (st.mode === 'domestic_league' ? '' : (['champions_league', 'europa_league', 'conference_league'].includes(st.mode) ? 'Not: kurgusal eşleşme.' : '')) : v.error;
  $('startReason').className = 'note' + (v.ok ? '' : ' warn');
  ['btnReplay', 'btnRematch', 'btnNew'].forEach(id => $(id).disabled = busy);
  $('btnSwap').disabled = busy;
  const idle = st.phase === 'idle';
  if (idle) drawIdle();
  else if ((st.phase === 'done' || st.phase === 'error') && st.match && st.match.world.phase === 'ended') {
    // keep showing the finished battle (final winner frame) instead of the idle preview
    const w = st.match.world; try { st.match.renderer.render(sctx, w.endT + w.outroLen - 0.01, stage.width, stage.height); } catch (e) { }
  }
  for (const s of ['A', 'B']) { const t = s === 'A' ? st.a : st.b; $('liveLogo' + s).src = t ? logoSet(t).thumb : ''; $('liveName' + s).textContent = t ? (t.display_name_tr || t.name) : '—'; if (idle) $('live' + s).textContent = t ? '100' : '—'; }
  if (idle) { $('liveTotal').textContent = st.a && st.b ? '200' : '—'; $('liveTime').textContent = '00:00'; $('liveSeed').textContent = '—'; }
}
function onModeChange() {
  if (st.phase === 'done' || st.phase === 'error') setState('idle');
  st.mode = $('mode').value; fillLeague();
  // drop selections that no longer fit
  for (const s of ['A', 'B']) {
    const t = s === 'A' ? st.a : st.b; if (!t) continue;
    const f = filterFor(); let ok = (!f.type || t.type === f.type) && (!f.league || t.league_id === f.league);
    if (st.mode === 'custom_exhibition') ok = true;
    if (!ok) { if (s === 'A') st.a = null; else st.b = null; pickers[s].inp.value = ''; renderCard(s); }
  }
  refresh(); saveSettings();
}

// ======================= stage =======================
const stage = $('stage'); let sctx = stage.getContext('2d', { alpha: false });
function sizeStage() {
  const r = stage.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  const k = Math.max(1, Math.min(3, Math.round(r.width * dpr / 360)));
  if (stage.width !== 360 * k) { stage.width = 360 * k; stage.height = 640 * k; sctx = stage.getContext('2d', { alpha: false }); if (st.phase !== 'live' && st.phase !== 'encoding') refresh(); }
}
let idleTimer = 0;
function drawIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (st.phase === 'live' || st.phase === 'encoding') return;
    if (st.a && st.b && validate(st.a, st.b, st.mode, st.mixed).ok) {
      try {
        const m = buildMatch(1, settings(), true);
        E.advanceTo(m.world, 2.19);
        m.renderer.render(sctx, 2.19, stage.width, stage.height);
        m.renderer.dispose();
        drawStageText('HAZIR • BAŞLAT', 1);
      } catch (e) { console.error(e); }
    } else splash();
  }, 30);
}
function drawStageText(txt, k) {
  const c = document.createElement('canvas'); c.width = 360; c.height = 640; const g = c.getContext('2d');
  F.draw(g, txt, 180, 560, { scale: 2, bold: true, color: '#ffe14d', align: 'center' });
  sctx.imageSmoothingEnabled = false; sctx.drawImage(c, 0, 0, stage.width, stage.height); void k;
}
function splash() {
  const c = document.createElement('canvas'); c.width = 360; c.height = 640; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 640); gr.addColorStop(0, '#141a3a'); gr.addColorStop(1, '#070912'); g.fillStyle = gr; g.fillRect(0, 0, 360, 640);
  g.fillStyle = '#1f6b2a'; g.fillRect(20, 200, 320, 300); g.fillStyle = '#23762f'; for (let y = 200; y < 500; y += 40) g.fillRect(20, y, 320, 20);
  g.fillStyle = '#e9f6e2'; g.fillRect(20, 350, 320, 1); g.strokeStyle = '#e9f6e2'; g.beginPath(); g.arc(180, 350, 30, 0, 7); g.stroke();
  F.draw(g, 'FOOTBALL WARS', 180, 110, { scale: 4, bold: true, color: '#ffffff', color2: '#ffe14d', align: 'center' });
  F.draw(g, '100 VS 100 PIXEL BATTLE', 180, 150, { scale: 2, color: '#36f1cd', align: 'center' });
  F.draw(g, R.TXT[settings().lang].ready, 180, 540, { scale: 2, bold: true, color: '#ffffff', align: 'center' });
  sctx.imageSmoothingEnabled = false; sctx.drawImage(c, 0, 0, stage.width, stage.height);
}

// ======================= match building =======================
function modeLabel(lang) {
  const m = MODES.find(x => x[0] === st.mode);
  if (st.mode === 'domestic_league') { const l = LEAGUES.get(st.a.league_id); return F.upper(l ? l.name : 'LİG'); }
  return m[2][lang] || m[2].tr;
}
function buildMatch(seed, set, preview) {
  const teams = [st.a, st.b];
  const kits = S.makeKits(teams[0], teams[1]);
  const atlases = [S.buildAtlas(teams[0], kits[0]), S.buildAtlas(teams[1], kits[1])];
  const logos = teams.map(t => logoSet(t));
  const opts = { seed, teamA: teams[0], teamB: teams[1], cfg: CFG, duration: set.duration, fxLevel: set.fx };
  const world = E.createWorld(opts);
  const rOpts = { teams, kits, atlases, logos, lang: set.lang, labels: set.labels, modeLabel: modeLabel(set.lang), fictional: ['champions_league', 'europa_league', 'conference_league'].includes(st.mode) || (st.mode === 'custom_exhibition' && teams[0].type !== teams[1].type) };
  const renderer = R.createRenderer({ ...rOpts, world });
  return { teams, kits, atlases, logos, opts, rOpts, world, renderer, seed, set, mode: st.mode, preview: !!preview };
}
function randomSeed() { const a = new Uint32Array(1); crypto.getRandomValues(a); return (a[0] % 999999999) + 1; }
function parseSeed(v) { v = String(v || '').trim(); if (!/^\d{1,10}$/.test(v)) return null; const n = Number(v); return n <= 4294967295 ? n : null; }

// ======================= audio =======================
async function audioCtx() {
  if (!st.audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; st.audioCtx = new AC({ sampleRate: 48000 }); }
  if (st.audioCtx.state === 'suspended') { try { await st.audioCtx.resume(); } catch (e) { } }
  return st.audioCtx;
}
function stopAudio() { if (st.player) { st.player.stopAll(); st.player = null; } }

// ======================= status helpers =======================
function setState(phase, label) {
  st.phase = phase; const b = $('stateBadge');
  b.className = 'badge-state ' + ({ live: 'live', encoding: 'enc', done: 'done', error: 'err', replay: 'live' }[phase] || '');
  b.textContent = label || { idle: 'HAZIR', live: 'CANLI', encoding: 'VİDEO KODLANIYOR', done: 'VİDEO HAZIR', error: 'HATA', replay: 'TEKRAR' }[phase] || phase;
  refresh();
}
function status(text, kv, pct) {
  if (text != null) $('statusText').textContent = text;
  if (kv) $('statusKv').innerHTML = Object.entries(kv).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  if (pct != null) $('progBar').style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%';
}
function msg(text, cls, target) { const el = document.createElement('div'); el.className = 'msg ' + (cls || ''); el.textContent = text; (target || $('statusMsgs')).appendChild(el); return el; }
function clearMsgs() { $('statusMsgs').innerHTML = ''; }

// ======================= live battle =======================
function liveRun(m, withAudio, label) {
  return new Promise((resolve, reject) => {
    const w = m.world;
    let t0 = performance.now(), T = 0, lastUi = 0;
    const planner = new A.Planner(); planner.intro();
    const player = withAudio ? st.player : null;
    if (player) { player.start(0); player.schedule(planner.items); }
    let music = false, intense = false, stopped = false;
    $('liveSeed').textContent = m.seed;
    const frame = (now) => {
      if (st.cancel) { cancelAnimationFrame(st.raf); reject(new Error('cancelled')); return; }
      try {
        T = (now - t0) / 1000;
        if (T - w.t > 0.2) { t0 += (T - w.t - 0.2) * 1000; T = w.t + 0.2; } // keep sim smooth if the machine lags
        E.advanceTo(w, T);
        const items = planner.feed(w);
        if (player) {
          player.schedule(items);
          if (!music && w.phase === 'battle') { music = true; player.music('calm', E.TL.battleStart); }
          if (!intense && w.final15 >= 0 && w.phase === 'battle') { intense = true; player.music('intense', w.final15); }
          if (!stopped && w.phase === 'ended') { stopped = true; player.stopMusic(w.endT + 0.25); }
        }
        m.renderer.render(sctx, T, stage.width, stage.height);
        if (now - lastUi > 100) {
          lastUi = now;
          $('liveA').textContent = w.teams[0].alive; $('liveB').textContent = w.teams[1].alive;
          $('liveTotal').textContent = w.teams[0].alive + w.teams[1].alive;
          const bt = w.phase === 'battle' ? w.battleT : w.phase === 'ended' ? w.endT - E.TL.battleStart : 0;
          $('liveTime').textContent = R.mmss(bt);
          status(null, { 'Durum': label, 'Simülasyon süresi': bt.toFixed(1) + ' sn', 'Ayakta (A / B)': w.teams[0].alive + ' / ' + w.teams[1].alive, 'Toplam kalan': w.teams[0].alive + w.teams[1].alive, 'Seed': m.seed, 'Olay sayısı': w.evCount, 'Aktif mermi': w.proj.filter(p => p.on).length, 'Parçacık': w.parts.length }, w.phase === 'ended' ? 100 : Math.min(99, (w.t / 50) * 100));
        }
        if (w.phase === 'ended' && T >= w.endT + w.outroLen) { resolve(); return; }
      } catch (e) { reject(e); return; }
      st.raf = requestAnimationFrame(frame);
    };
    st.raf = requestAnimationFrame(frame);
  });
}

function cleanupPrevious(keepVideo) {
  st.cancel = false;
  cancelAnimationFrame(st.raf);
  stopAudio();
  if (st.match) { try { st.match.renderer.dispose(); } catch (e) { } st.match = null; }
  if (!keepVideo && st.videoURL) {
    const v = $('resVideo'); v.pause(); v.removeAttribute('src'); v.load();
    URL.revokeObjectURL(st.videoURL); DIAG.urls.delete(st.videoURL); st.videoURL = null;
    $('btnDownload').removeAttribute('href');
  }
}

async function startBattle(seedOverride) {
  const v = validate(st.a, st.b, st.mode, st.mixed);
  if (!v.ok) { status(v.error); return; }
  if (st.phase === 'live' || st.phase === 'encoding') return;
  const set = settings();
  let seed = seedOverride != null ? seedOverride : parseSeed($('seed').value);
  if ($('seed').value.trim() && seed == null && seedOverride == null) { status('Seed yalnızca 0–4294967295 arası tam sayı olabilir.'); return; }
  if (seed == null) seed = randomSeed();
  cleanupPrevious(false);
  clearMsgs(); $('resultCard').classList.add('hidden'); $('videoBox').classList.add('hidden');
  if (st.caps) { const pl = X.plan(st.caps, set.res === '720' ? 720 : 1080, set.res === '720' ? 1280 : 1920, set.fps, set.sound); if (pl && pl.warn) msg(pl.warn, 'warn'); }
  st.lastSeed = seed; st.lastSettings = set; st.lastTeams = [st.a, st.b]; st.lastMode = st.mode;
  DIAG.matches++;
  let ctx = null;
  if (set.sound) { ctx = await audioCtx(); if (ctx) { const { bank, loops } = A.ensure(); st.player = new A.LivePlayer(ctx, bank, loops, { music: set.music, sfx: set.sfx }); } else msg('Bu tarayıcıda WebAudio yok; ses devre dışı.', 'warn'); }
  const m = buildMatch(seed, set, false);
  st.match = m;
  setState('live');
  status('Canlı savaş: ' + (st.a.display_name_tr || st.a.name) + ' vs ' + (st.b.display_name_tr || st.b.name), null, 0);
  try {
    await liveRun(m, !!st.player, 'Canlı savaş oynatılıyor');
  } catch (e) {
    if (e && e.message === 'cancelled') return;
    console.error(e); setState('error'); msg('Canlı simülasyon hatası: ' + (e && e.message || e), 'bad'); return;
  }
  stopAudio();
  const live = m.world;
  DIAG.lastLive = { seed, hash: live.hash >>> 0, winner: live.winner, endT: live.endT, events: live.evCount, start: [m.world.units.filter(u => u.side === 0).length, m.world.units.filter(u => u.side === 1).length] };
  showResult(m);
  saveRecent(m);
  await exportVideo(m);
}

async function replay() {
  if (!st.lastTeams || st.phase === 'live' || st.phase === 'encoding') return;
  [st.a, st.b] = st.lastTeams; st.mode = st.lastMode;
  cancelAnimationFrame(st.raf); stopAudio();
  const set = st.lastSettings;
  if (set.sound) { const ctx = await audioCtx(); if (ctx) { const { bank, loops } = A.ensure(); st.player = new A.LivePlayer(ctx, bank, loops, { music: set.music, sfx: set.sfx }); } }
  const m = buildMatch(st.lastSeed, set, false);
  const prevPhase = st.videoURL ? 'done' : 'idle';
  setState('replay', 'TEKRAR (seed ' + st.lastSeed + ')');
  status('Aynı savaş tekrar oynatılıyor (aynı seed → birebir aynı olaylar).', null, 0);
  try { await liveRun(m, !!st.player, 'Tekrar izleniyor'); } catch (e) { if (e.message !== 'cancelled') msg('Tekrar hatası: ' + e.message, 'bad'); }
  stopAudio(); m.renderer.dispose();
  const same = st.match && (m.world.hash >>> 0) === (st.match.world.hash >>> 0);
  msg(same ? `Tekrar doğrulandı: olay günlüğü özeti (hash ${(m.world.hash >>> 0).toString(16)}) ilk savaşla aynı.` : 'UYARI: tekrar özeti farklı!', same ? 'ok' : 'bad');
  setState(prevPhase === 'done' ? 'done' : 'idle');
}

// ======================= export =======================
function slug(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ß/g, 'ss').replace(/[øØ]/g, 'o').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'Team'; }
function fileName(m, W, H, ext) { const d = new Date(); const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); return `FootballWars_${slug(m.teams[0].name)}_vs_${slug(m.teams[1].name)}_${ds}_seed${m.seed}_${W}x${H}.${ext}`; }
function fallbackPaths(caps, W, H, fps, wantAudio) {
  const k = W + 'x' + H + '@' + fps, out = [];
  const first = X.plan(caps, W, H, fps, wantAudio); if (first) out.push(first);
  const add = (p) => { if (p && !out.some(o => o.path === p.path)) out.push(p); };
  if (caps.mrMp4) add({ path: 'mr-mp4', container: 'mp4', ext: 'mp4', mime: caps.mrMp4, label: 'MP4 (MediaRecorder, gerçek zamanlı)' });
  if (caps.vp[k]) add({ path: 'wc-webm', container: 'webm', ext: 'webm', mime: 'video/webm', video: caps.vp[k], audio: wantAudio ? caps.opus : null, label: 'WebM (VP9/VP8 + Opus)', warn: 'MP4 üretilemedi; WebM kullanılıyor.' });
  if (caps.mrWebm) add({ path: 'mr-webm', container: 'webm', ext: 'webm', mime: caps.mrWebm, label: 'WebM (MediaRecorder, gerçek zamanlı)', warn: 'MP4 üretilemedi; WebM kullanılıyor.' });
  return out;
}
async function exportVideo(m) {
  const set = m.set, W = set.res === '720' ? 720 : 1080, H = set.res === '720' ? 1280 : 1920, fps = set.fps;
  if (!st.caps) st.caps = await X.detect();
  const paths = fallbackPaths(st.caps, W, H, fps, set.sound);
  if (!paths.length) { setState('error'); msg('Bu tarayıcı video kodlamayı desteklemiyor (WebCodecs ve MediaRecorder bulunamadı). Güncel Chrome veya Edge kullanın.', 'bad'); return; }
  const live = m.world;
  const total = live.endT + live.outroLen;
  // deterministic soundtrack mixed from the battle's own event timeline
  let audio = null;
  if (set.sound) {
    status('Ses miksajı hazırlanıyor…', null, 0);
    await new Promise(r => setTimeout(r, 10));
    const { bank, loops } = A.ensure(); const pl = new A.Planner(); pl.intro(); pl.feed(live);
    audio = A.mixOffline(bank, loops, pl.items, live, total, { music: set.music, sfx: set.sfx });
  }
  setState('encoding');
  let out = null, used = null, lastErr = null, ew = null;
  for (const p of paths) {
    if (p.warn && p !== paths[0]) msg(p.warn, 'warn');
    ew = E.createWorld(m.opts);
    const er = R.createRenderer({ ...m.rOpts, world: ew });
    const t0 = performance.now();
    status('Video oluşturuluyor: ' + p.label, { 'Format': p.label, 'Çözünürlük': W + '×' + H, 'FPS': fps, 'Süre': total.toFixed(2) + ' sn', 'Kare': '0 / ' + Math.ceil(total * fps) }, 0);
    let lastPrev = 0;
    try {
      DIAG.encoderOpen++;
      out = await X.run({
        plan: p, width: W, height: H, fps, duration: total, audio, audioCtx: st.audioCtx,
        isCancelled: () => st.cancel,
        draw: (ctx, T, w2, h2) => { E.advanceTo(ew, T); er.render(ctx, T, w2, h2); },
        onProgress: (o) => {
          const pct = o.total ? (o.frame / o.total) * 100 : 0;
          const kv = { 'Format': p.label, 'Çözünürlük': W + '×' + H + ' @ ' + fps + ' FPS', 'Kare': o.frame + ' / ' + o.total, 'Kalan kare': Math.max(0, o.total - o.frame), 'Tahmini kalan': o.eta != null ? o.eta.toFixed(1) + ' sn' : '—', 'Kodlama hızı': o.fpsEnc ? o.fpsEnc.toFixed(1) + ' kare/sn' : (o.phase === 'realtime' ? 'gerçek zamanlı' : '—'), 'Geçen': ((performance.now() - t0) / 1000).toFixed(1) + ' sn' };
          status(o.phase === 'audio' ? 'Ses kodlanıyor…' : 'Video kodlanıyor… %' + pct.toFixed(0), kv, pct);
          const now = performance.now();
          if (o.canvas && now - lastPrev > 250) { lastPrev = now; sctx.imageSmoothingEnabled = false; sctx.drawImage(o.canvas, 0, 0, stage.width, stage.height); }
        }
      });
      used = p; DIAG.encoderOpen--; er.dispose(); break;
    } catch (e) {
      DIAG.encoderOpen--; er.dispose(); lastErr = e; console.error(e);
      if (st.cancel) return;
      msg('Kodlama yolu başarısız (' + p.label + '): ' + (e && e.message || e) + ' — sıradaki yöntem deneniyor.', 'warn');
    }
  }
  if (!out) { setState('error'); msg('Video oluşturulamadı: ' + (lastErr && lastErr.message || lastErr), 'bad'); return; }
  // verification: the exported battle must be the one that was watched
  const same = (ew.hash >>> 0) === (live.hash >>> 0) && ew.winner === live.winner && Math.abs(ew.endT - live.endT) < 1e-9;
  if (!out.blob || out.blob.size === 0) { setState('error'); msg('Kodlayıcı boş dosya üretti — indirme devre dışı.', 'bad'); return; }
  const sn = await X.sniff(out.blob);
  let tracks = {};
  if (sn.container === 'mp4') tracks = await X.mp4Tracks(out.blob);
  if (sn.container !== used.container) { setState('error'); msg('Kapsayıcı doğrulaması başarısız (' + sn.container + ' ≠ ' + used.container + ').', 'bad'); return; }
  const url = URL.createObjectURL(out.blob); DIAG.urls.add(url); st.videoURL = url;
  const fn = fileName(m, W, H, used.ext);
  const a = $('btnDownload'); a.href = url; a.download = fn; a.textContent = 'VİDEOYU İNDİR (' + used.ext.toUpperCase() + ', ' + (out.blob.size / 1048576).toFixed(1) + ' MB)';
  const v = $('resVideo'); v.src = url; v.load();
  $('videoBox').classList.remove('hidden');
  DIAG.exports++;
  DIAG.lastExport = { path: used.path, size: out.blob.size, mime: out.blob.type, container: sn.container, tracks, verified: same, frames: out.frames, seconds: out.seconds, fileName: fn };
  const codecTxt = used.container === 'mp4' ? `MP4 • video ${out.videoCodec}${tracks.avc1 ? ' (H.264/avcC ✓)' : ''} • ses ${out.audioCodec ? out.audioCodec + (tracks.mp4a ? ' (AAC ✓)' : tracks.opus ? ' (Opus ✓)' : '') : 'yok'}` : `WebM • ${out.videoCodec}${out.audioCodec ? ' + ' + out.audioCodec : ''}`;
  $('videoInfo').innerHTML = `${esc(fn)}<br>${esc(codecTxt)} • ${W}×${H} • ${fps} FPS • ${(out.blob.size / 1048576).toFixed(2)} MB • ${out.frames} kare • kodlama ${out.seconds ? out.seconds.toFixed(1) + ' sn' : ''}`;
  v.onloadedmetadata = () => {
    const d = v.duration;
    const okD = isFinite(d) && Math.abs(d - total) < 0.6;
    msg(isFinite(d) ? `Önizleme açıldı: süre ${d.toFixed(2)} sn (beklenen ${total.toFixed(2)} sn) ${okD ? '✓' : '— süre farkı var'}` : 'Önizleme açıldı (süre metadata’sı tarayıcı tarafından bildirilmedi; WebM kayıtlarında normaldir).', okD || !isFinite(d) ? 'ok' : 'warn');
    DIAG.lastExport.previewDuration = d;
  };
  v.onerror = () => { msg('Tarayıcı önizlemesi bu dosyayı oynatamadı (codec desteği). Dosya yine de indirilebilir: ' + codecTxt, 'warn'); };
  msg(same ? `Doğrulandı: video, izlediğiniz savaşla birebir aynı (seed ${m.seed}, olay hash ${(live.hash >>> 0).toString(16)}, kazanan ve bitiş anı eşleşiyor).` : 'UYARI: Video simülasyonu canlı savaştan farklı çıktı!', same ? 'ok' : 'bad');
  if (set.sound && !out.audioCodec) msg('Ses kodlayıcı bulunamadı; video sessiz.', 'warn');
  if (used.audio && used.audio.codec === 'opus' && used.container === 'mp4') msg('Bu tarayıcıda AAC kodlayıcı yok; ses MP4 içinde Opus olarak kodlandı (Chrome/Edge/VLC/YouTube/TikTok oynatır; bazı eski oynatıcılar Opus-MP4 sesini desteklemeyebilir).', 'warn');
  status('Video hazır ✓', { 'Dosya': fn, 'Format': codecTxt, 'Boyut': (out.blob.size / 1048576).toFixed(2) + ' MB', 'Süre': total.toFixed(2) + ' sn', 'Kare': out.frames, 'Kodlama süresi': out.seconds ? out.seconds.toFixed(1) + ' sn' : '—', 'Doğrulama': same ? 'canlı = video ✓' : 'FARKLI ✗' }, 100);
  setState('done');
}

// ======================= results =======================
function showResult(m) {
  const w = m.world, win = w.winner, T = m.teams[win], L = logoSet(T), lose = m.teams[1 - win];
  $('resultCard').classList.remove('hidden');
  $('resLogo').src = L.thumb;
  $('resName').textContent = T.display_name_tr || T.name;
  $('resSub').textContent = `${w.teams[win].alive} kişi ayakta • ${R.mmss(w.endT - E.TL.battleStart)} • rakip: ${lose.display_name_tr || lose.name}`;
  const rows = E.ROLES.map(r => `<tr><td>${E.ROLE_NAMES[r].tr}</td><td>${w.teams[0].elimByRole[r]}</td><td>${w.teams[1].elimByRole[r]}</td></tr>`).join('');
  $('resRoles').innerHTML = `<tr><th>Eliminasyon (rol)</th><th>${esc(S.shortName(m.teams[0], 60))}</th><th>${esc(S.shortName(m.teams[1], 60))}</th></tr>${rows}<tr><th>Toplam</th><th>${w.teams[0].kills}</th><th>${w.teams[1].kills}</th></tr>`;
  let mvp = null; for (const u of w.units) if (!mvp || u.kills > mvp.kills) mvp = u;
  const topRole = s => E.ROLES.slice().sort((a, b) => w.teams[s].elimByRole[b] - w.teams[s].elimByRole[a])[0];
  const RULES = { HUNT: 'Av modu (az oyuncu/uzun süre: global hedefleme)', ZONE: 'Daralan taktik alan', STORM: 'Son dakika fırtınası (artan hasar, sağlıklı olan kazanır)', SUDDEN_DEATH: 'Ani ölüm (aynı tick’te çift eleme)', TIEBREAK_HP: 'Süre sınırı: kalan can oranı', TIEBREAK_COIN: 'Tam eşitlik: seed’li yazı-tura', ADAPT: 'Seri kayıp adaptasyonu (config: streak_adaptation)' };
  const used = s => Object.entries(w.teams[s].specialsUsed).map(([k, v]) => ((E.SPECIAL_NAMES[k] || {}).tr || k) + ' ×' + v).join(', ') || '—';
  $('resKv').innerHTML = [
    ['Seed', m.seed], ['Kazanan', (T.display_name_tr || T.name) + ' (' + w.teams[win].alive + ' ayakta)'], ['Savaş süresi', (w.endT - E.TL.battleStart).toFixed(2) + ' sn'], ['Video süresi', (w.endT + w.outroLen).toFixed(2) + ' sn (intro 2.2 + savaş + outro ' + w.outroLen.toFixed(1) + ')'],
    ['En çok eleyen rol', `A: ${E.ROLE_NAMES[topRole(0)].tr} • B: ${E.ROLE_NAMES[topRole(1)].tr}`], ['MVP birim', mvp ? `#${mvp.id} ${E.ROLE_NAMES[mvp.role].tr} (${m.teams[mvp.side].display_name_tr || m.teams[mvp.side].name}) — ${mvp.kills} eleme, ${mvp.assists} asist` : '—'],
    ['Özel yetenekler A', used(0)], ['Özel yetenekler B', used(1)], ['Form (A / B)', w.teams[0].form.toFixed(3) + ' / ' + w.teams[1].form.toFixed(3)],
    ['Uygulanan kurallar', w.rules.map(r => RULES[r] || r).join(' • ') || 'Yok (doğal bitiş)'], ['Olay sayısı / hash', w.evCount + ' / ' + (w.hash >>> 0).toString(16)]
  ].map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
}
function saveRecent(m) {
  try {
    const w = m.world; const list = JSON.parse(localStorage.getItem('fw_recent') || '[]');
    list.unshift({ d: new Date().toISOString().slice(0, 16).replace('T', ' '), a: m.teams[0].id, b: m.teams[1].id, w: w.winner, s: w.teams[w.winner].alive, seed: m.seed, t: +(w.endT - E.TL.battleStart).toFixed(1), mode: m.mode, dur: m.set.duration });
    localStorage.setItem('fw_recent', JSON.stringify(list.slice(0, 5)));
  } catch (e) { }
  renderRecent();
}
function renderRecent() {
  let list = []; try { list = JSON.parse(localStorage.getItem('fw_recent') || '[]'); } catch (e) { }
  $('recent').innerHTML = list.length ? list.map((r, i) => {
    const a = BY_ID.get(r.a), b = BY_ID.get(r.b); if (!a || !b) return '';
    const wn = r.w === 0 ? a : b;
    return `<li><div><b>${esc(a.display_name_tr || a.name)}</b> vs <b>${esc(b.display_name_tr || b.name)}</b><br><span>${esc(r.d)} • kazanan ${esc(wn.display_name_tr || wn.name)} (${r.s}) • ${r.t} sn • seed ${r.seed}</span></div><button class="btn small" data-load="${i}">Yükle</button></li>`;
  }).join('') : '<li><span>Henüz savaş yok.</span></li>';
}
function loadRecent(i) {
  let list = []; try { list = JSON.parse(localStorage.getItem('fw_recent') || '[]'); } catch (e) { }
  const r = list[i]; if (!r || st.phase === 'live' || st.phase === 'encoding') return;
  st.mode = r.mode || 'custom_exhibition'; $('mode').value = st.mode;
  if (st.mode === 'domestic_league') st.league = BY_ID.get(r.a).league_id;
  if (st.mode === 'custom_exhibition' && BY_ID.get(r.a).type !== BY_ID.get(r.b).type) { st.mixed = true; $('mixed').checked = true; }
  fillLeague();
  choose('A', BY_ID.get(r.a)); choose('B', BY_ID.get(r.b));
  $('seed').value = r.seed; if (r.dur) setRadio('dur', r.dur);
  status('Kayıtlı savaş yüklendi: aynı seed + takımlar + süre ayarı ile başlatırsanız aynı savaş üretilir.');
}

// ======================= logo upload =======================
let uploadFor = null;
function onUpload(file) {
  if (!file || !uploadFor) return;
  const id = uploadFor; uploadFor = null;
  if (file.size > 5 * 1024 * 1024) { alert('Dosya çok büyük (en fazla 5 MB).'); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement('canvas'); const k = Math.min(1, 160 / Math.max(img.naturalWidth || 160, img.naturalHeight || 160));
      c.width = Math.max(1, Math.round((img.naturalWidth || 160) * k)); c.height = Math.max(1, Math.round((img.naturalHeight || 160) * k));
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/png'); // throws if the image would taint the export canvas
      const im2 = new Image(); im2.onload = () => {
        if (!canvasSafe(im2)) { alert('Bu görsel video kanvasında güvenli kullanılamıyor (CORS/taint).'); return; }
        userLogos.set(id, im2); logoCache.delete(id);
        try { localStorage.setItem('fw_logo:' + id, data); } catch (e) { msg('Logo bu oturumda kullanılacak; tarayıcı depolaması dolu olduğu için kalıcı kaydedilemedi.', 'warn'); }
        if (st.a && st.a.id === id) renderCard('A'); if (st.b && st.b.id === id) renderCard('B'); refresh();
      }; im2.src = data;
    } catch (e) { alert('Logo kullanılamadı: ' + e.message); }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { URL.revokeObjectURL(url); alert('Görsel okunamadı.'); };
  img.src = url;
}

// ======================= modals =======================
function openAbout() {
  const flags = Object.entries(FLAGS).map(([id, f]) => `<div>${esc((BY_ID.get(id) || {}).display_name_tr || id)} — <a href="${esc(f.page)}" target="_blank" rel="noopener">${esc(f.file)}</a></div>`).join('');
  const simple = Object.keys(S.SIMPLE_FLAGS).filter(id => !FLAGS[id]).map(id => esc((BY_ID.get(id) || {}).display_name_tr || id)).join(', ');
  $('aboutBox').innerHTML = `<button class="btn small close" data-close>Kapat</button><h3>Hakkında / Lisanslar</h3>
  <p>FOOTBALL WARS bağımsız, ticari olmayan bir eğlence/hayran aracıdır. Hiçbir kulüp, milli federasyon, lig, UEFA veya FIFA ile bağlantılı değildir, onların sponsorluğu ya da onayı yoktur. Kulüp ve turnuva adları yalnızca tanımlayıcı olarak kullanılır; markalar sahiplerine aittir. Gerçek oyuncu adı/yüzü kullanılmaz.</p>
  <h4>Veri kaynakları (gömülü veri tabanı, ${esc(DB.metadata.compiled_date)})</h4>
  <ul><li>Kulüp Elo: <b>beyondELO (https://beyondelo.com)</b>, lisans <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> — 12.11.2026 anlık görüntüsü.</li>
  <li>Kulüp listeleri: FootballSquads (https://www.footballsquads.co.uk), 2026–27.</li>
  <li>Milli takımlar: FIFA erkekler dünya sıralaması, 7 Ekim 2026 (https://inside.fifa.com/fifa-rankings/world-ranking/men).</li>
  <li>Savaş özellikleri (hücum, savunma, hız…) gerçek istatistik değildir; Elo/FIFA puanından türetilmiş oyun tasarımı değerleridir. Kulüp Elo ve FIFA puanları aynı ölçeğe konmaz; savaşta yalnız oyunun <i>power_index</i> değeri ve yumuşak güç tavanı (%18) kullanılır.</li></ul>
  <h4>Logolar ve armalar</h4>
  <p><b>Kulüp armaları pakete dahil değildir.</b> Resmî kulüp armaları genelde telif/marka korumalıdır ve derleme sırasında Wikimedia Commons API'si erişim sınırı (HTTP 429) nedeniyle lisans doğrulaması yapılamadı. Bu nedenle 194 kulübün tamamı için takım renkleri ve baş harflerinden üretilmiş <b>TEMSİLİ</b> armalar kullanılır; bunlar resmî logo değildir. Kendi lisanslı logonuzu takım kartındaki “Logo yükle” ile ekleyebilirsiniz (yalnız bu tarayıcıda saklanır, dışarı gönderilmez).</p>
  <p><b>Milli takımlar:</b> ${Object.keys(FLAGS).length} ülke için <b>ulusal bayrak</b> (federasyon arması değildir) Wikimedia Commons'tan derleme anında indirildi ve küçük PNG olarak gömüldü. Ulusal bayraklar devlet sembolüdür ve Commons'ta genellikle kamu malı (Public Domain) olarak yayımlanır; her dosyanın kesin lisans etiketi aşağıdaki dosya sayfasında görülebilir. Erişim sınırı nedeniyle indirilemeyen ${esc(simple)} için basit geometrik bayrak çizimi yerelde üretildi. Kuzey İrlanda için resmî bir ulusal bayrak bulunmadığından temsili arma kullanılır.</p>
  <div class="flaglist">${flags}</div>
  <h4>Ses ve müzik</h4><p>Tüm ses efektleri ve chiptune müzik bu dosyanın içinde kodla sentezlenir (özgün). Hiçbir marş, takım şarkısı veya lisanssız müzik dosyası kullanılmaz.</p>
  <h4>Grafikler</h4><p>Pixel oyuncular, saha, yazı tipi ve efektler çalışma anında prosedürel olarak üretilir (özgün).</p>
  <h4>Yazılım</h4><p>Gömülü açık kaynak kütüphaneler: <b>mp4-muxer 5.2.2</b> ve <b>webm-muxer 5.1.4</b> (Vanilagy), MIT lisansı.</p>
  <pre>${esc(LIC.mp4 || '')}</pre><pre>${esc(LIC.webm || '')}</pre>`;
  $('modalAbout').classList.add('open');
}
async function openDiag() {
  const checks = dataChecks();
  const caps = st.caps || await X.detect(); st.caps = caps;
  const flagN = Object.keys(FLAGS).length, simpleN = Object.keys(S.SIMPLE_FLAGS).filter(id => !FLAGS[id]).length;
  const capRows = Object.keys(caps.h264).map(k => `<tr><td>${k}</td><td>${caps.h264[k] ? '<span class="pass">' + caps.h264[k].codec + '</span>' : '<span class="fail">yok</span>'}</td><td>${caps.vp[k] ? caps.vp[k].codec : 'yok'}</td></tr>`).join('');
  const L = DIAG.lastLive, X2 = DIAG.lastExport;
  $('diagBox').innerHTML = `<button class="btn small close" data-close>Kapat</button><h3>Geliştirici teşhis paneli</h3>
  <h4>Veri tabanı (gömülü)</h4><table>${checks.map(c => `<tr><td>${esc(c.k)}</td><td>${esc(c.v)}</td><td class="${c.ok ? 'pass' : 'fail'}">${c.ok ? 'GEÇTİ' : 'KALDI'}</td></tr>`).join('')}</table>
  <h4>Logolar</h4><p>Gömülü bayrak (Commons): ${flagN} • yerel bayrak çizimi: ${simpleN} • temsili arma: ${ALL.length - flagN - simpleN} • kullanıcı yüklemesi: ${userLogos.size}</p>
  <h4>Video / ses yetenekleri (çalışma anında ölçüldü)</h4>
  <p>Güvenli bağlam: ${caps.secure} • WebCodecs: ${caps.webcodecs} • AudioEncoder: ${caps.audioEncoder} • AAC kodlama: ${caps.aac ? 'var (' + caps.aac.sampleRate + ' Hz)' : 'yok'} • Opus kodlama: ${caps.opus ? 'var' : 'yok'} • MediaRecorder MP4: ${esc(caps.mrMp4 || 'yok')} • MediaRecorder WebM: ${esc(caps.mrWebm || 'yok')}</p>
  <table><tr><th>Hedef</th><th>H.264 (MP4)</th><th>VP9/VP8 (WebM)</th></tr>${capRows}</table>
  <h4>Son savaş</h4><p>${L ? `seed ${L.seed} • başlangıç birimi A/B: ${L.start[0]}/${L.start[1]} • olay: ${L.events} • hash ${L.hash.toString(16)} • bitiş ${L.endT.toFixed(3)} sn` : 'henüz yok'}</p>
  <p>${X2 ? `export: ${esc(X2.path)} • ${esc(X2.container)} • ${esc(X2.mime)} • ${(X2.size / 1048576).toFixed(2)} MB • ${X2.frames} kare • canlı=video: ${X2.verified} • izler: ${esc(JSON.stringify(X2.tracks))} • önizleme süresi: ${X2.previewDuration != null ? X2.previewDuration.toFixed(2) : '—'}` : ''}</p>
  <h4>Kaynak kullanımı</h4><p>Toplam savaş: ${DIAG.matches} • export: ${DIAG.exports} • açık video URL: ${DIAG.urls.size} • açık kodlayıcı: ${DIAG.encoderOpen} • canlı ses kaynağı: ${st.player ? st.player.sources.length : 0} • AudioContext: ${st.audioCtx ? st.audioCtx.state : 'oluşturulmadı'} • yakalanan JS hatası: ${ERRORS.length}${ERRORS.length ? '<br>' + ERRORS.slice(-5).map(esc).join('<br>') : ''}</p>
  <h4>Determinizm öz-testi</h4><button class="btn small" id="btnSelfTest">Testi çalıştır</button><div id="selfTest" class="note"></div>`;
  $('modalDiag').classList.add('open');
  $('btnSelfTest').onclick = runSelfTest;
}
function runSelfTest() {
  const out = $('selfTest'); out.textContent = 'Çalışıyor…';
  setTimeout(() => {
    const rows = [];
    for (const [a, b] of [['TUR_GALATASARAY', 'TUR_FENERBAHCE'], ['ESP_REAL_MADRID', 'ESP_FC_BARCELONA'], ['NAT_TURKIYE', 'NAT_GERMANY']]) {
      const o = s => ({ seed: s, teamA: BY_ID.get(a), teamB: BY_ID.get(b), cfg: CFG, duration: 'standard', fxLevel: 1 });
      const s1 = E.summary(E.simulate(o(424242))), s2 = E.summary(E.simulate(o(424242))), s3 = E.summary(E.simulate(o(777)));
      const w0 = E.createWorld(o(424242));
      rows.push(`${a} vs ${b}: başlangıç ${w0.units.filter(u => u.side === 0).length}/${w0.units.filter(u => u.side === 1).length} • aynı seed aynı: <span class="${JSON.stringify(s1) === JSON.stringify(s2) ? 'pass' : 'fail'}">${JSON.stringify(s1) === JSON.stringify(s2)}</span> • farklı seed farklı: <span class="${s1.hash !== s3.hash ? 'pass' : 'fail'}">${s1.hash !== s3.hash}</span> • kazanan ${s1.winner === 0 ? 'A' : 'B'} (${s1.survivors}) • ${s1.battleSeconds} sn • olay ${s1.events}`);
    }
    out.innerHTML = rows.join('<br>');
  }, 30);
}

// ======================= brand / boot =======================
function drawBrand() {
  const c = $('brandCv'); const g0 = F.textCanvas('FOOTBALL WARS', { scale: 3, bold: true, color: '#ffffff', color2: '#ffd23f' });
  c.width = g0.width; c.height = g0.height; const g = c.getContext('2d'); g.drawImage(g0, 0, 0);
}
async function boot() {
  drawBrand(); fillModes();
  const saved = loadSettings();
  if (saved && saved.mode && MODES.some(m => m[0] === saved.mode)) { st.mode = saved.mode; st.league = saved.league || st.league; $('mode').value = st.mode; }
  fillLeague();
  setupPicker('A'); setupPicker('B');
  const checks = dataChecks(); const allOk = checks.every(c => c.ok);
  $('dbChip').innerHTML = `Veri tabanı: <b>${ALL.length}</b> takım (<b>${DB.clubs.length}</b> kulüp + <b>${DB.national_teams.length}</b> milli) • <b>${DB.leagues.length}</b> lig • ${esc(DB.metadata.club_season)} ${allOk ? '<span class="pass">✓ doğrulandı</span>' : '<span class="fail">✗ veri kontrolü başarısız</span>'}`;
  const mobile = matchMedia('(pointer:coarse)').matches || Math.min(screen.width, screen.height) < 820;
  if (mobile && !saved) { setRadio('res', '720'); msg('Mobil cihaz algılandı: daha hızlı ve güvenli kodlama için 720×1280 seçildi (Gelişmiş ayarlardan değiştirilebilir).', 'warn', $('globalMsg')); }
  sizeStage(); splash();
  await loadFlags();
  // defaults: Süper Lig derby
  if (st.mode === 'domestic_league' && st.league === 'TUR_SUPER') { choose('A', BY_ID.get('TUR_GALATASARAY')); choose('B', BY_ID.get('TUR_FENERBAHCE')); }
  st.ready = true; refresh(); renderRecent();
  // codec detection (real runtime checks)
  try {
    st.caps = await X.detect();
    const set = settings(); const W = set.res === '720' ? 720 : 1080, H = set.res === '720' ? 1280 : 1920;
    updateFmt();
    if (!st.caps.h264['1080x1920@60'] && !st.caps.h264['720x1280@60'] && !st.caps.vp['1080x1920@60']) { const l = $('fps60l'); l.classList.add('dis'); l.querySelector('input').disabled = true; l.title = 'Bu tarayıcı 60 FPS kodlamayı desteklemiyor'; setRadio('fps', '30'); }
    void W; void H;
  } catch (e) { $('fmtChip').textContent = 'Video yetenek kontrolü başarısız: ' + e.message; $('fmtChip').className = 'chip bad'; }
}
function updateFmt() {
  if (!st.caps) return;
  const set = settings(); const W = set.res === '720' ? 720 : 1080, H = set.res === '720' ? 1280 : 1920;
  const p = X.plan(st.caps, W, H, set.fps, set.sound);
  const chip = $('fmtChip');
  if (!p) { chip.className = 'chip bad'; chip.innerHTML = 'Video kodlama desteklenmiyor'; return; }
  chip.className = 'chip ' + (p.container === 'mp4' ? (p.audio && p.audio.codec !== 'opus' || !set.sound ? 'ok' : 'warn') : 'warn');
  chip.innerHTML = `Video: <b>${esc(p.label)}</b> • ${W}×${H} • ${set.fps} FPS`;
  $('globalMsg').querySelectorAll('.fmtwarn').forEach(e => e.remove());
  if (p.warn) { const el = msg(p.warn + ' (' + p.label + ')', 'warn', $('globalMsg')); el.classList.add('fmtwarn'); }
}

// ======================= events =======================
$('mode').addEventListener('change', onModeChange);
$('league').addEventListener('change', () => { st.league = $('league').value; onModeChange(); });
$('typeFilter').addEventListener('change', () => { st.typeFilter = $('typeFilter').value; refresh(); });
$('mixed').addEventListener('change', () => { st.mixed = $('mixed').checked; refresh(); });
$('btnSwap').addEventListener('click', () => { const a = st.a; st.a = st.b; st.b = a; pickers.A.inp.value = st.a ? (st.a.display_name_tr || st.a.name) : ''; pickers.B.inp.value = st.b ? (st.b.display_name_tr || st.b.name) : ''; renderCard('A'); renderCard('B'); refresh(); });
$('btnStart').addEventListener('click', () => startBattle());
$('btnReplay').addEventListener('click', replay);
$('btnRematch').addEventListener('click', () => { if (!st.lastTeams) return; [st.a, st.b] = st.lastTeams; $('seed').value = ''; startBattle(randomSeed()); });
$('btnNew').addEventListener('click', () => { if (st.phase === 'live' || st.phase === 'encoding') return; cleanupPrevious(false); $('resultCard').classList.add('hidden'); clearMsgs(); status('Yeni savaş: turnuva ve takımları seç.', {}, 0); setState('idle'); $('seed').value = ''; pickers.A.inp.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
$('btnSeedRnd').addEventListener('click', () => { $('seed').value = randomSeed(); });
$('btnSeedCopy').addEventListener('click', async () => { const v = $('seed').value || st.lastSeed || ''; if (!v) return; try { await navigator.clipboard.writeText(String(v)); $('btnSeedCopy').textContent = 'Kopyalandı'; } catch (e) { $('seed').value = v; $('seed').select(); document.execCommand && document.execCommand('copy'); $('btnSeedCopy').textContent = 'Seçildi'; } setTimeout(() => $('btnSeedCopy').textContent = 'Kopyala', 1400); });
$('btnAbout').addEventListener('click', openAbout);
$('btnDiag').addEventListener('click', openDiag);
document.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) e.target.closest('.modal').classList.remove('open');
  else if (e.target.classList && e.target.classList.contains('modal')) e.target.classList.remove('open');
  const up = e.target.closest('[data-up]'); if (up) { uploadFor = up.dataset.up; $('logoFile').value = ''; $('logoFile').click(); }
  const rm = e.target.closest('[data-rm]'); if (rm) { const id = rm.dataset.rm; userLogos.delete(id); logoCache.delete(id); try { localStorage.removeItem('fw_logo:' + id); } catch (er) { } if (st.a && st.a.id === id) renderCard('A'); if (st.b && st.b.id === id) renderCard('B'); refresh(); }
  const ld = e.target.closest('[data-load]'); if (ld) loadRecent(+ld.dataset.load);
});
$('logoFile').addEventListener('change', e => onUpload(e.target.files && e.target.files[0]));
document.querySelectorAll('input[name=res],input[name=fps],#optSound').forEach(el => el.addEventListener('change', () => { updateFmt(); saveSettings(); }));
document.querySelectorAll('input[name=dur],input[name=fx],input[name=lang],#optLabels,#volMusic,#volSfx').forEach(el => el.addEventListener('change', () => { saveSettings(); if (st.phase !== 'live' && st.phase !== 'encoding') drawIdle(); }));
window.addEventListener('resize', () => sizeStage());
window.addEventListener('beforeunload', () => { for (const u of DIAG.urls) URL.revokeObjectURL(u); });
// test hooks (used by the automated browser tests; harmless for users)
window.FW_APP = { st, DIAG, choose: (s, id) => choose(s, BY_ID.get(id)), startBattle, replay, search, validate, dataChecks, settings, setMode: m => { $('mode').value = m; onModeChange(); }, ERRORS };
boot().catch(e => { console.error(e); msg('Başlatma hatası: ' + e.message, 'bad', $('globalMsg')); });
})();
