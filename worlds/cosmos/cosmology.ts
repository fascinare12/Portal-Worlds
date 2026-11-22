/**
 * The arithmetic of stage E: a universe that stretches, the light left over
 * from when it was hot, and the two measurements of its expansion that do
 * not agree; with the checks that guard them.
 *
 * The model is the standard one: space flat, filled with matter, light and a
 * constant dark energy. The numbers put into it are the measured ones, and
 * the checks ask whether, from those, this code reproduces the figures the
 * observing teams publish. It does.
 */

export const C_KM = 299792.458;
/** One megaparsec in millions of light-years; and 1/H0 in billions of years, for H0 = 100 km/s/Mpc. */
export const MPC_MLY = 3.2616;
export const HUBBLE_TIME = 9.7779;

/** The measured contents, as (fraction of the critical density) × h², where h = H0 / 100. */
export const MATTER = 0.143; // all matter
export const ATOMS = 0.02237; // ordinary matter
export const LIGHT = 2.473e-5; // the oldest light itself
export const RADIATION = 4.183e-5; // that light and the neutrinos
/** How much smaller the universe was when it became transparent. */
export const Z_CLEAR = 1089.9;
export const T_NOW = 2.7255;
/** The angle the sound ruler spans on the sky, in radians, as measured. */
export const THETA_SEEN = 0.010411;

/** The expansion rate when the universe was a times its present size, in km/s/Mpc. */
export function rate(a: number, h: number): number {
  const dark = h * h - MATTER - RADIATION;
  return 100 * Math.sqrt(MATTER / (a * a * a) + RADIATION / (a * a * a * a) + dark);
}
/** Simpson's rule: the adding-up of chamber 2, done carefully. */
function sum(f: (x: number) => number, from: number, to: number, n = 4000): number {
  const step = (to - from) / n;
  let total = f(from) + f(to);
  for (let i = 1; i < n; i++) total += f(from + i * step) * (i % 2 ? 4 : 2);
  return (total * step) / 3;
}
/** The time from the beginning until the universe was a times its present size, in billions of years. */
export function ageAt(a: number, h: number): number {
  // In steps of ln(a), so that the early universe gets its share of the steps.
  return 977.79 * sum((u) => 1 / rate(Math.exp(u), h), Math.log(1e-9), Math.log(a), 6000);
}
/** How far away, measured today, is something whose light has been stretched by 1 + z: in megaparsecs. */
export const distance = (z: number, h: number) => C_KM * sum((u) => Math.exp(-u) / rate(Math.exp(u), h), Math.log(1 / (1 + z)), 0, 6000);
/**
 * How far a ripple of sound had spread through the hot early universe by the time it was a times
 * its present size (never further than when it cleared), measured as it would be today: megaparsecs.
 */
export function sound(a = 1 / (1 + Z_CLEAR)): number {
  const until = Math.min(a, 1 / (1 + Z_CLEAR));
  // The speed of sound: light's over √3, slowed a little by the weight of the atoms carried along.
  const speed = (x: number) => C_KM / Math.sqrt(3 * (1 + ((3 * ATOMS) / (4 * LIGHT)) * x));
  return sum((u) => {
    const x = Math.exp(u);
    return speed(x) / (x * 100 * Math.sqrt(MATTER / (x * x * x) + RADIATION / (x * x * x * x)));
  }, Math.log(1e-9), Math.log(until), 6000);
}
/** The angle the sound ruler should span, in radians, if H0 = 100 h. */
export const theta = (h: number) => sound() / distance(Z_CLEAR, h);
/** The H0 at which the predicted angle is the measured one: found by halving the range again and again. */
export function fromOldestLight(): number {
  let lo = 0.5;
  let hi = 0.9;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (theta(mid) > THETA_SEEN) hi = mid;
    else lo = mid;
  }
  return 50 * (lo + hi);
}

// ---- Three histories, all expanding at the same rate today. Time in units of 1/H0, from now. ----

export type History = 'ours' | 'matter' | 'empty';
/** Our own, with 31.5% matter and the rest dark energy: found by stepping, as chamber 6 did orbits. */
const OURS: [number, number][] = (() => {
  const m = 0.315;
  const out: [number, number][] = [];
  const step = 0.0005;
  const slope = (a: number) => a * Math.sqrt(m / (a * a * a) + 1 - m);
  let a = 1;
  for (let t = 0; t <= 1.2; t += step) {
    out.push([t, a]);
    a += slope(a + (slope(a) * step) / 2) * step;
  }
  a = 1;
  const back: [number, number][] = [];
  for (let t = 0; a > 0.0005; t -= step) {
    back.push([t, a]);
    a -= slope(Math.max(1e-6, a - (slope(a) * step) / 2)) * step;
  }
  return [...back.reverse(), ...out.slice(1)];
})();
/** How big the universe is, against today, at a time t (in units of 1/H0, from now). Zero before the beginning. */
export function size(history: History, t: number): number {
  if (history === 'empty') return Math.max(0, 1 + t);
  if (history === 'matter') return Math.pow(Math.max(0, 1 + 1.5 * t), 2 / 3);
  if (t <= OURS[0][0]) return 0;
  const i = Math.min(OURS.length - 2, Math.max(0, Math.floor((t - OURS[0][0]) / 0.0005)));
  const [t0, a0] = OURS[i];
  const [t1, a1] = OURS[i + 1];
  return a0 + ((a1 - a0) * (t - t0)) / (t1 - t0);
}
/** How long ago each history began, in units of 1/H0. */
export const began = (history: History) => (history === 'empty' ? 1 : history === 'matter' ? 2 / 3 : -OURS[0][0]);

// ---- Uncertainty ----

/** How far apart two measurements are, counted in their combined uncertainty. */
export const apart = (a: number, ea: number, b: number, eb: number) => Math.abs(a - b) / Math.hypot(ea, eb);
/** The chance that a measurement lands within k of its uncertainties of the truth (the bell curve). */
export function within(k: number): number {
  // The error function, by Abramowitz and Stegun's formula 7.1.26.
  const x = k / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  return 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
}

/** The measurements of H0 shown in the last chamber: what, when, the value and its uncertainty, and which family. */
export const MEASURED: { name: string; how: string; year: number; value: number; minus: number; plus: number; family: 'ladder' | 'early' | 'other' }[] = [
  { name: 'Distance ladder: Cepheids and supernovae', how: 'SH0ES team', year: 2025, value: 73.49, minus: 0.93, plus: 0.93, family: 'ladder' },
  { name: 'Distance ladder: several methods combined', how: 'H0 Distance Network', year: 2026, value: 73.5, minus: 0.81, plus: 0.81, family: 'ladder' },
  { name: 'Distance ladder: red giants in place of Cepheids', how: 'Chicago–Carnegie programme', year: 2025, value: 70.4, minus: 1.9, plus: 1.9, family: 'ladder' },
  { name: 'Light bent round galaxies: delays between the images', how: 'TDCOSMO collaboration', year: 2026, value: 71.1, minus: 2.3, plus: 2.4, family: 'other' },
  { name: 'Colliding neutron stars, heard and seen', how: 'LIGO and Virgo', year: 2017, value: 70, minus: 8, plus: 12, family: 'other' },
  { name: 'The oldest light', how: 'Planck satellite', year: 2018, value: 67.4, minus: 0.5, plus: 0.5, family: 'early' },
  { name: 'The oldest light: three telescopes combined', how: 'Planck, ACT and SPT', year: 2025, value: 67.2, minus: 0.4, plus: 0.4, family: 'early' },
  { name: 'The sound ruler in the spread of galaxies', how: 'DESI survey', year: 2025, value: 68.5, minus: 0.6, plus: 0.6, family: 'early' },
];

// ---- The checks ----

export function checkCosmology(): string[] {
  const wrong: string[] = [];
  const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  const h = 0.674;

  // From the measured contents, the published figures: the age, the moment of clearing, the sound ruler,
  // the distance to the oldest light, the angle, and the edge of what can be seen.
  if (!close(ageAt(1, h), 13.8, 5e-3)) wrong.push(`the age: ${ageAt(1, h)}`);
  const cleared = ageAt(1 / (1 + Z_CLEAR), h) * 1e9;
  if (!(cleared > 365000 && cleared < 385000)) wrong.push(`when it cleared: ${cleared}`);
  if (!close(sound(), 144.4, 5e-3)) wrong.push(`the sound ruler: ${sound()}`);
  if (!close(distance(Z_CLEAR, h), 13870, 5e-3)) wrong.push(`the distance to the oldest light: ${distance(Z_CLEAR, h)}`);
  if (!close(theta(h), THETA_SEEN, 5e-3)) wrong.push(`the angle: ${theta(h)}`);
  const found = fromOldestLight();
  if (!(found > 66.5 && found < 68.5)) wrong.push(`H0 from the oldest light: ${found}`);
  const edge = (distance(1e8, h) * MPC_MLY) / 1000;
  if (!(edge > 45 && edge < 47.5)) wrong.push(`the edge of sight: ${edge}`);
  if (!close(T_NOW * (1 + Z_CLEAR), 2973, 2e-3)) wrong.push('the temperature when it cleared');
  if (!close(2.897771955 / T_NOW, 1.063, 1e-3)) wrong.push('where the oldest light peaks');
  // A larger H0 puts the oldest light nearer, so the ruler looks bigger.
  if (!(theta(0.73) > theta(0.674) && theta(0.62) < theta(0.674))) wrong.push('which way the angle goes');

  // The three histories. The empty one began 1/H0 ago; the matter one 2/3 of that; ours by a known formula.
  const formula = (2 / (3 * Math.sqrt(0.685))) * Math.asinh(Math.sqrt(0.685 / 0.315));
  if (!close(began('ours'), formula, 2e-3)) wrong.push(`our history began ${began('ours')} ago, against ${formula}`);
  if (!close((began('ours') * HUBBLE_TIME) / h, 13.8, 5e-3)) wrong.push('our history in years');
  for (const k of ['ours', 'matter', 'empty'] as History[]) {
    if (!close(size(k, 0), 1, 1e-3)) wrong.push(`${k}: size today`);
    // All three are expanding at the same rate now.
    if (!close((size(k, 0.001) - size(k, -0.001)) / 0.002, 1, 2e-3)) wrong.push(`${k}: rate today`);
  }
  // Ours was slowing, and is now speeding up; the matter one only ever slows.
  const bend = (k: History, t: number) => size(k, t + 0.01) - 2 * size(k, t) + size(k, t - 0.01);
  if (!(bend('ours', -0.7) < 0 && bend('ours', 0.3) > 0 && bend('matter', 0.3) < 0)) wrong.push('speeding up and slowing down');
  if (!close(HUBBLE_TIME / 0.7, 13.97, 1e-3)) wrong.push('1/H0');

  // Stretching, seen from anywhere: every gap grows by the same factor, so speed goes as distance.
  const places = [-7, -2, 0, 3, 11];
  for (const home of places) for (const other of places) if (other !== home) {
    const before = other - home;
    const after = 1.1 * other - 1.1 * home;
    if (!close((after - before) / before, 0.1)) wrong.push('no centre');
  }

  // Uncertainty: the bell curve's familiar fractions, and the size of the gap.
  if (!close(within(1), 0.6827, 1e-3) || !close(within(2), 0.9545, 1e-3) || !close(within(3), 0.9973, 1e-3)) wrong.push('the bell curve');
  if (!close(apart(73.5, 0.81, 67.19, 0.38), 7.05, 5e-3)) wrong.push(`the gap: ${apart(73.5, 0.81, 67.19, 0.38)}`);
  if (!close(apart(73.04, 1.04, 67.4, 0.5), 4.89, 5e-3)) wrong.push('the gap in 2022');
  if (!close(Math.hypot(3, 4), 5)) wrong.push('adding uncertainties');
  return wrong;
}
