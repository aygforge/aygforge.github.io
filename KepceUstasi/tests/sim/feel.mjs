// Yakalama hissi ölçümü (Alpha 0.3): gerçek PotPhysics + LadleController ile 9 hedef konum × 3 zamanlama
// toleransı yakalanan yük histogramı ve tencere topçuk dağılımı. Oyun verisini değiştirmez; deney parametreleri
// FEEL ortam değişkeniyle (JSON) verilir: {"pot":{...POT_GEOM alanları},"ladle":{...LADLE alanları},"pot2":{...POT}}
// Kullanım: node tests/sim/feel.mjs [seeds=12] [label]
import { Rng } from '../../src/core/rng.js';
import { PotPhysics, POT_GEOM } from '../../src/systems/PotPhysics.js';
import { LadleController } from '../../src/systems/LadleController.js';
import { LADLE, POT, CHAPTERS } from '../../src/data/content.js';

const SEEDS = Number(process.argv[2] || 12);
const LABEL = process.argv[3] || 'current';
if (process.env.FEEL) {
  const o = JSON.parse(process.env.FEEL);
  Object.assign(POT_GEOM, o.pot || {});
  Object.assign(LADLE, o.ladle || {});
  Object.assign(POT, o.pot2 || {});
}
const SIGMAS = [0, 4, 8]; // timing error, fixed 60 Hz steps (0 / 67 ms / 133 ms)
const REPS = 4;
const params = { radius: LADLE.radius, rimLift: LADLE.rimBase, capacity: LADLE.capacity, period: LADLE.swingPeriod };
const bigRate = CHAPTERS[0].bigOilRate;
const T = (params.period * 1000) / (1000 / 60); // period in steps

function gauss(r) {
  return Math.sqrt(-2 * Math.log(1 - r.next())) * Math.cos(2 * Math.PI * r.next());
}

// first step >= 10 at which the swing passes x
function crossingStep(ladle, x) {
  const r = Math.max(-1, Math.min(1, (x - ladle.centerX) / ladle.amp));
  const a = Math.asin(r);
  const c = [];
  for (let k = 0; k < 3; k++) {
    c.push(((a / (2 * Math.PI)) + k) * T);
    c.push(((0.5 - a / (2 * Math.PI)) + k) * T);
  }
  return Math.round(c.filter((t) => t >= 10).sort((p, q) => p - q)[0]);
}

function catchAt(snapshot, seed, tapStep) {
  const pot = new PotPhysics(new Rng(seed));
  pot.restore(snapshot);
  const l = new LadleController(pot);
  l.configure(params);
  l.startSwing();
  for (let i = 0; i < tapStep; i++) l.step();
  l.drop();
  let n = 0;
  while (l.step() !== 'CAUGHT' && n++ < 500);
  return l.resolveCatch().load;
}

// a "mid-run" pot: fill, then several random turns with hybrid refill (same rules as the game)
function warmPot(seed) {
  const rng = new Rng(seed);
  const pot = new PotPhysics(rng);
  pot.fillInitial(POT.startCount, bigRate);
  const l = new LadleController(pot);
  l.configure(params);
  const tr = new Rng(seed * 31 + 7);
  for (let turn = 0; turn < 5; turn++) {
    l.startSwing();
    const tap = tr.int(4, Math.round(T));
    for (let i = 0; i < tap; i++) l.step();
    l.drop();
    let n = 0;
    while (l.step() !== 'CAUGHT' && n++ < 500);
    l.resolveCatch();
    for (let i = 0; i < 24; i++) l.step();
    pot.refill(bigRate, 0);
    for (let i = 0; i < 45; i++) l.step();
  }
  return { snap: pot.serialize(), amp: l.amp, cx: l.centerX };
}

const positions = [];
const loads = {}; // `${pi}:${sigma}` -> [loads]
const ballBins = new Array(9).fill(0);
const ballBinsBig = new Array(9).fill(0);
let ampSeen = 0;
const bestBySeed = { 0: [], 4: [], 8: [] };
const bestPosCount = new Array(9).fill(0); // where the best exact-timing spot was, per warm pot
const randomLoads = [];
const t0 = Date.now();
for (let s = 1; s <= SEEDS; s++) {
  const { snap, amp, cx } = warmPot(1000 + s);
  ampSeen = amp;
  for (const b of snap.balls) {
    const bin = Math.max(0, Math.min(8, Math.floor((b.x / POT_GEOM.W) * 9)));
    ballBins[bin]++;
    if (b.t === 'big') ballBinsBig[bin]++;
  }
  const noise = new Rng(s * 977);
  const perPos = { 0: [], 4: [], 8: [] };
  for (let pi = 0; pi < 9; pi++) {
    const x = cx - amp + (2 * amp * pi) / 8;
    positions[pi] = Math.round(x - cx);
    const ladleProbe = new LadleController(new PotPhysics(new Rng(1)));
    ladleProbe.configure(params);
    const tc = crossingStep(ladleProbe, x);
    for (const sg of SIGMAS) {
      const reps = sg === 0 ? 1 : REPS;
      let sum = 0;
      for (let r = 0; r < reps; r++) {
        const tap = Math.max(1, Math.round(tc + gauss(noise) * sg));
        const load = catchAt(snap, 1000 + s, tap);
        (loads[`${pi}:${sg}`] ||= []).push(load);
        sum += load;
      }
      perPos[sg].push(sum / reps);
    }
  }
  // what a player who reads the pot (aims at its best spot) gets, per tolerance
  for (const sg of SIGMAS) {
    const bestPi = perPos[0].indexOf(Math.max(...perPos[0])); // chosen by the visible best spot
    if (sg === 0) {
      const m = Math.max(...perPos[0]);
      perPos[0].forEach((v, i) => v === m && bestPosCount[i]++); // ties count for every best spot
    }
    bestBySeed[sg].push(perPos[sg][bestPi]);
  }
  for (let r = 0; r < 6; r++) randomLoads.push(catchAt(snap, 1000 + s, noise.int(4, Math.round(T))));
}
const mean = (a) => +(a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)).toFixed(2);
const hist = (a) => {
  const h = new Array(13).fill(0);
  for (const v of a) h[Math.min(12, v)]++;
  return h;
};
const out = {
  label: LABEL,
  seeds: SEEDS,
  params: { pot: { ...POT_GEOM }, ladle: { radius: LADLE.radius, swingPeriod: LADLE.swingPeriod, capacity: LADLE.capacity }, amp: ampSeen },
  positions,
  table: Object.fromEntries(SIGMAS.map((sg) => [sg, positions.map((_, pi) => mean(loads[`${pi}:${sg}`]))])),
  histograms: Object.fromEntries(SIGMAS.map((sg) => [sg, positions.map((_, pi) => hist(loads[`${pi}:${sg}`]))])),
  readerBest: Object.fromEntries(SIGMAS.map((sg) => [sg, mean(bestBySeed[sg])])),
  centre: Object.fromEntries(SIGMAS.map((sg) => [sg, mean(loads[`4:${sg}`])])),
  random: mean(randomLoads),
  ballBins,
  ballBinsBig,
  bestPosCount,
  sideBestShare: +(bestPosCount.filter((_, i) => i !== 3 && i !== 4 && i !== 5).reduce((a, b) => a + b, 0) / bestPosCount.reduce((a, b) => a + b, 0)).toFixed(2),
  seconds: (Date.now() - t0) / 1000,
};
console.log(JSON.stringify(out));
