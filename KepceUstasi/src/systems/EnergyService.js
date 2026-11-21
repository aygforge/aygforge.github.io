// EnergyService — Alpha 0.4A enerji kuralları (data/alpha04_progression_economy.json -> energy).
// Saf fonksiyonlar: kayıt nesnesi + UTC zaman damgası (ms) alır, aynı nesneyi günceller. Kalıcı yazım çağıranın işidir.
//  - maks/başlangıç 30, giriş 10, 12 dakikada +1 (çevrimdışı da işler, artık süre devreder, 30 üstü birikmez)
//  - runId başına TEK düşüm (devam / yeniden yükleme ikinci kez düşmez)
//  - UTC günü başına 2 doğrulanmış reklam tam dolumu (30'a tamamlar, +30 değil); doğrulanmayan ödül hak yemez
//  - L1–L3 ilk temizlemesinde bir defalık +10 iade
import { ECONOMY04 } from '../data/stages.js';

export const ENERGY = ECONOMY04.energy;
const MIN = 60 * 1000;
const INTERVAL = ENERGY.regenMinutesPerPoint * MIN;

export const utcDay = (now) => new Date(now).toISOString().slice(0, 10);

export function defaultEnergy(now) {
  return { value: ENERGY.initial, lastRegenAt: now, adDay: utcDay(now), adUsed: 0, debitedRuns: [], refundedLevels: [] };
}

// Apply offline/online regeneration. A clock that moved backwards never grants energy.
export function tickEnergy(e, now) {
  if (!Number.isFinite(e.lastRegenAt) || now < e.lastRegenAt) e.lastRegenAt = now;
  if (e.value >= ENERGY.max) {
    e.value = Math.min(e.value, ENERGY.max);
    e.lastRegenAt = now; // full: no hidden stockpile
  } else {
    const n = Math.floor((now - e.lastRegenAt) / INTERVAL);
    if (n > 0) {
      e.value = Math.min(ENERGY.max, e.value + n);
      e.lastRegenAt = e.value >= ENERGY.max ? now : e.lastRegenAt + n * INTERVAL; // carry the remainder
    }
  }
  const day = utcDay(now);
  if (e.adDay !== day) {
    e.adDay = day;
    e.adUsed = 0;
  }
  return e;
}

export function msToNextPoint(e, now) {
  if (e.value >= ENERGY.max) return 0;
  return Math.max(0, e.lastRegenAt + INTERVAL - now);
}

export function msToUtcReset(now) {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - now;
}

// One debit per runId. Returns { ok, charged, reason }.
export function debitForRun(e, runId, now, cost = ENERGY.costPerRun) {
  tickEnergy(e, now);
  if (e.debitedRuns.includes(runId)) return { ok: true, charged: 0 };
  if (e.value < cost) return { ok: false, charged: 0, reason: 'energy' };
  const wasFull = e.value >= ENERGY.max;
  e.value -= cost;
  if (wasFull) e.lastRegenAt = now; // regen starts counting from the moment energy drops below max
  e.debitedRuns.push(runId);
  if (e.debitedRuns.length > 60) e.debitedRuns.splice(0, e.debitedRuns.length - 60);
  return { ok: true, charged: cost };
}

export function adRefillsLeft(e, now) {
  tickEnergy(e, now);
  return Math.max(0, ENERGY.dailyAdFullRefills - e.adUsed);
}

// Only a VERIFIED rewarded-ad result may refill. Unavailable / failed / cancelled -> nothing, no right used.
export function applyAdRefill(e, adResult, now) {
  tickEnergy(e, now);
  if (!adResult || adResult.status !== 'rewarded' || adResult.verified !== true) return { ok: false, reason: 'not_verified' };
  if (e.adUsed >= ENERGY.dailyAdFullRefills) return { ok: false, reason: 'daily_limit' };
  e.adUsed++;
  e.value = ENERGY.max; // set to max, not +30
  e.lastRegenAt = now;
  return { ok: true };
}

// First-clear refund for the onboarding levels (once per level, capped at max).
export function refundFirstClear(e, level, amount, now) {
  tickEnergy(e, now);
  if (!amount || !ENERGY.firstClearRefundLevels.includes(level) || e.refundedLevels.includes(level)) return 0;
  e.refundedLevels.push(level);
  const before = e.value;
  e.value = Math.min(ENERGY.max, e.value + amount);
  return e.value - before;
}
