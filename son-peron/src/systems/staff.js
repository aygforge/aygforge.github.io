// A modeli: yalnız yardımcı personel. Bu dosya sipariş alma, masa seçme, son servis, tahsilat
// veya kendi kendine pişirme başlatan HİÇBİR fonksiyonu çağırmaz (testle doğrulanır).
import { neighborsOfRect } from '../world/grid.js';
import * as Kitchen from './kitchen.js';

export function maxActive(sim) { return sim.C.staff.maxActive[sim.s.stage] || 0; }
export function refreshCandidates(sim, force) {
  const st = sim.s.staff, C = sim.C.staff;
  if (!force && st.candidates.length && sim.s.day - st.refreshDay < C.refreshDays) return;
  const pool = Object.keys(C.candidates).filter((id) => !st.roster.some((r) => r.id === id));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(sim.rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  // her rolden en az bir aday görünsün
  const out = []; for (const role of Object.keys(sim.C.roles)) { const k = pool.findIndex((id) => C.candidates[id].role === role); if (k >= 0) out.push(pool.splice(k, 1)[0]); }
  while (out.length < C.shown && pool.length) out.push(pool.shift());
  st.candidates = out.slice(0, C.shown); st.refreshDay = sim.s.day;
}
export function hire(sim, id) {
  const s = sim.s, st = s.staff; if (s.stage < sim.C.staff.minStage) return sim.fail('İş ilanları 2. restoran aşamasında açılır');
  if (!st.candidates.includes(id)) return sim.fail('Bu aday listede değil');
  if (st.roster.length >= maxActive(sim)) return sim.fail(`Bu aşamada en fazla ${maxActive(sim)} personel çalıştırabilirsin`);
  st.candidates = st.candidates.filter((x) => x !== id); st.roster.push({ id, active: true });
  sim.emit('hired', { id }); return sim.msg(`${sim.C.staff.candidates[id].name} ekibe katıldı. Vardiyası yarın sabah başlar.`, 'good');
}
export function dismiss(sim, id) { const st = sim.s.staff; st.roster = st.roster.filter((r) => r.id !== id); delete st.agents[id]; delete st.shift[id]; return sim.msg('Personel ekipten çıkarıldı (ücretsiz).'); }
export function setActive(sim, id, on) { const r = sim.s.staff.roster.find((x) => x.id === id); if (r) r.active = on; if (!on) { delete sim.s.staff.agents[id]; } return { ok: !!r }; }
// Sabah: vardiya ücreti gün başına TEK KEZ tahsil edilir; para yetmezse vardiya pasif kalır
export function startShifts(sim) {
  const s = sim.s, st = s.staff; st.shift = {}; st.agents = {}; let n = 0;
  for (const d of Object.values(s.dirty)) d.lock = null; for (const x of s.stains) x.lock = null; for (const b of s.batches) b.lock = undefined;
  for (const r of st.roster) {
    if (!r.active || n >= maxActive(sim)) continue; const c = sim.C.staff.candidates[r.id];
    const key = `wage:${s.day}:${r.id}`;
    if (s.tx[key]) st.shift[r.id] = true; // bugün zaten ödendi: tekrar tahsil edilmez
    else if (s.gold < c.wage) { sim.msg(`${c.name} için ${c.wage} G ücret ödenemedi; bugün çalışmıyor.`, 'error'); continue; }
    else sim.once(key, () => { s.gold -= c.wage; s.today.wages += c.wage; st.shift[r.id] = true; });
    if (st.shift[r.id]) n++;
    if (st.shift[r.id]) st.agents[r.id] = { id: r.id, role: c.role, scene: 'restaurant_interior', x: 20.5 + n, y: 30.5, dir: 'down', path: null, pi: 0, task: null, t: 0, look: lookOf(r.id) };
  }
}
function lookOf(id) { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return { skin: h % 4, hair: (h >> 3) % 6, style: (h >> 6) % 5, outfit: 3 + ((h >> 9) % 4), apron: true }; }
export function activeRole(sim, role) { return Object.values(sim.s.staff.agents).some((a) => a.role === role); }

function approach(sim, a, x, y, w, h) {
  const m = sim.map(a.scene), g = sim.grid(a.scene); let best = null;
  for (const [nx, ny] of neighborsOfRect(x, y, w, h)) { if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || g[ny * m.w + nx]) continue; const d = Math.abs(nx - a.x) + Math.abs(ny - a.y); if (!best || d < best.d) best = { nx, ny, d }; }
  return best ? sim.goto(a, best.nx, best.ny) : false;
}
export function tick(sim, dt) {
  const s = sim.s;
  for (const a of Object.values(s.staff.agents)) {
    const c = sim.C.staff.candidates[a.id]; const speed = sim.npcSpeed(7) / c.speed;
    if (a.task) {
      if (a.path) { if (!sim.step(a, dt, speed)) continue; }
      a.t += dt; a.working = true;
      if (a.t >= a.task.dur * c.speed) { const t = a.task; finishTask(sim, a); if (a.task === t) { a.task = null; a.working = false; } }
      continue;
    }
    a.working = false; a.cool = (a.cool || 0) - dt; if (a.cool > 0) { if (a.path) sim.step(a, dt, speed); continue; }
    a.cool = 1.5;
    if (a.role === 'cleaner') {
      // Öncelik: kirli masalar (müşteri bekleyebilir), sonra zemin lekeleri
      const tid = Object.keys(s.dirty).find((id) => !s.dirty[id].lock);
      if (tid) { const f = sim.furn(tid); const [w, h] = sim.fp(f); if (approach(sim, a, f.x, f.y, w, h)) { s.dirty[tid].lock = a.id; a.task = { kind: 'table', target: tid, dur: 1.6 }; a.t = 0; } continue; }
      const stn = s.stains.find((x) => !x.lock);
      if (stn && sim.goto(a, stn.x, stn.y)) { stn.lock = a.id; a.task = { kind: 'stain', target: stn.id, dur: 1.0 }; a.t = 0; continue; }
    } else if (a.role === 'service_helper') {
      // Yalnız oyuncunun menüye aldığı (slotu o ürüne ayrılmış) türleri bara taşır; yeni menü çeşidi seçmez
      const b = s.batches.find((x) => (x.loc === 'ready' || x.loc === 'pot') && !x.lock && Kitchen.isFresh(sim, x) && targetSlot(sim, x));
      if (b) { const f = sim.furn(b.inst); const [w, h] = sim.fp(f); if (approach(sim, a, f.x, f.y, w, h)) { b.lock = a.id; a.task = { kind: 'fetch', target: b.id, dur: 0.5 }; a.t = 0; } continue; }
      const tid = Object.keys(s.dirty).find((id) => s.dirty[id].plates && !s.dirty[id].lock);
      if (tid) { const f = sim.furn(tid); const [w, h] = sim.fp(f); if (approach(sim, a, f.x, f.y, w, h)) { s.dirty[tid].lock = a.id; a.task = { kind: 'plates', target: tid, dur: 0.7 }; a.t = 0; } continue; }
    } else if (a.role === 'kitchen_helper') {
      const f = s.furniture.find((x) => x.cook && x.cook.phase === 'prep');
      if (f && !a.path) { const [w, h] = sim.fp(f); approach(sim, a, f.x, f.y, w, h); a.working = true; }
    }
    if (!a.path) { const home = a.role === 'host_helper' ? [19, 31] : a.role === 'kitchen_helper' ? [38, 17] : a.role === 'service_helper' ? [27, 25] : [20, 28]; if (Math.abs(a.x - home[0] - 0.5) + Math.abs(a.y - home[1] - 0.5) > 1.5) sim.goto(a, home[0], home[1]); }
    else sim.step(a, dt, speed);
  }
}
function targetSlot(sim, b) {
  for (const m of Kitchen.barModules(sim)) for (let i = 0; i < m.slots.length; i++) if (m.slots[i].item === b.item && Kitchen.slotFill(sim, m.id, i) < sim.C.portionsPerSlot) return { m, i };
  return null;
}
function finishTask(sim, a) {
  const s = sim.s, t = a.task;
  if (t.kind === 'table') sim.service.finishCleanTable(sim, t.target, a.id);
  else if (t.kind === 'stain') sim.service.finishCleanStain(sim, t.target, a.id);
  else if (t.kind === 'plates') { const d = s.dirty[t.target]; if (d) { d.plates = false; d.lock = null; sim.emit('plates_collected', { by: a.id }); } }
  else if (t.kind === 'fetch') {
    const b = Kitchen.batch(sim, t.target); if (!b) return; const ts = targetSlot(sim, b); if (!ts) { b.lock = null; return; }
    a.carry = b.item; const [w, h] = sim.fp(ts.m); approach(sim, a, ts.m.x, ts.m.y, w, h); a.task = { kind: 'deliver', target: b.id, dur: 0.5 }; a.t = 0; a.keep = true;
    return;
  } else if (t.kind === 'deliver') {
    const b = Kitchen.batch(sim, t.target); a.carry = null; if (!b) return; b.lock = null; const ts = targetSlot(sim, b); if (!ts) return;
    const src = sim.furn(b.inst); const wasPot = b.loc === 'pot'; const total = b.qty; const n = Kitchen.moveBatchToBar(sim, b, ts.m, ts.i);
    if (wasPot && src?.cook) { if (n === total) src.cook = null; }
    if (n) sim.emit('bar_stocked', { item: b.item, qty: n, by: a.id });
  }
}
