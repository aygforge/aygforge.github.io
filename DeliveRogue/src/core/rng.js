// core/rng.js — deterministic gameplay RNG + separate cosmetic RNG.
// Gameplay randomness (map variants, spawns, crits, procs, skill choices) must come from a
// seeded stream owned by the run; visual-only randomness (particles, shake, jitter) uses `cosmetic`.
export { RNG, hashStr } from './util.js';

/** Cosmetic-only random source. Never use for anything that affects simulation state. */
export const cosmetic = { next: () => Math.random(), range: (a, b) => a + (b - a) * Math.random() };
