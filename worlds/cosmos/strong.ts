import { PACES, along, beta, rate } from './physics';

/**
 * The arithmetic of stage C: a traveller who accelerates for ever, a black
 * hole that does not spin, and a wormhole mouth taken on a journey; with the
 * checks that guard them. Every rule is tested here by a second route.
 */

// ---- A ship under steady thrust ----
// Units: years and light-years, and thrust such that the ship gains one light-year a year of
// speed each year by its own reckoning. That is 0.97 of the Earth's gravity: near enough 1 g.

/** Where the ship is, and what time it is at home, when its own clock reads tau. It starts beside home, at rest. */
export const ship = (tau: number): { t: number; x: number } => ({ t: Math.sinh(tau), x: Math.cosh(tau) - 1 });
/** The same for a ship that cuts its engines when its own clock reads off, and coasts. */
export function shipCut(tau: number, off: number): { t: number; x: number } {
  if (tau <= off) return ship(tau);
  const at = ship(off);
  // Coasting at the speed it had: its clock then runs slow by cosh(off).
  return { t: at.t + (tau - off) * Math.cosh(off), x: at.x + (tau - off) * Math.sinh(off) };
}
/**
 * A flash of light leaves home when home's clock reads sent. What the ship's own clock reads
 * when it arrives; or Infinity if it never does. off is when the engines are cut, if ever.
 */
export function arrives(sent: number, off = Infinity): number {
  // Under thrust the flash is caught when 1 − e^(−tau) = sent.
  const burning = sent < 1 ? -Math.log(1 - sent) : Infinity;
  if (burning <= off) return burning;
  if (off === Infinity) return Infinity;
  // Coasting: light gains on the ship at 1 − v, where v = tanh(off).
  const at = ship(off);
  const v = Math.tanh(off);
  const t = (sent + at.x - v * at.t) / (1 - v);
  return off + (t - at.t) / Math.cosh(off);
}
/** A flash leaves the ship when its clock reads tau. When it reaches home, by home's clock. */
export const reply = (tau: number) => Math.exp(tau) - 1;
/** How many times slower than life the ship sees home's clock running, when its own reads tau. */
export const stretch = (tau: number) => Math.exp(tau);
/** The faint warmth an accelerating thermometer is predicted to feel, in kelvin, for a given acceleration in m/s². */
export const unruh = (a: number) => (1.054571817e-34 * a) / (2 * Math.PI * 299792458 * 1.380649e-23);

// ---- A black hole that does not spin ----
// Distances in units of the horizon's radius; times in units of the time light takes to cross that radius.

export const C = 299792458;
export const GM_SUN = 1.32712440018e20;
/** The radius of the horizon of a hole of the given mass in Suns, in metres. */
export const horizon = (suns: number) => (2 * GM_SUN * suns) / (C * C);
/** The rate of a clock that hovers at r, against one far away. */
export const hover = (r: number) => Math.sqrt(1 - 1 / r);
/** The speed at which something that fell from rest far away passes a hoverer at r, as a fraction of light's. */
export const plunge = (r: number) => Math.sqrt(1 / r);
/** Where a thing falling freely from rest far away is, when its own clock has run tau since it passed r0. */
export const falling = (r0: number, tau: number) => Math.pow(Math.max(0, Math.pow(r0, 1.5) - 1.5 * tau), 2 / 3);
/** Its own time from r0 down to r. */
export const fallTime = (r0: number, r: number) => (2 / 3) * (Math.pow(r0, 1.5) - Math.pow(r, 1.5));
/**
 * When a flash sent outward from the falling thing at r reaches a watcher far away, up to a
 * constant that is the same for every flash. It grows without limit as r comes down to 1.
 */
export const seen = (r: number) => {
  const s = Math.sqrt(r);
  return -((2 / 3) * s * s * s + s * s + 2 * s + 2 * Math.log(s - 1));
};
/** How much the tide stretches, per metre of length, at the horizon of a hole of the given mass in Suns: in m/s² per metre. */
export const tideAtHorizon = (suns: number) => (2 * GM_SUN * suns) / Math.pow(horizon(suns), 3);

// ---- A wormhole mouth taken on a journey ----

/**
 * One mouth is flown away and back at speed v, taking T years by outside clocks. Its own clock,
 * and so the clock seen through the throat, falls behind by this many years.
 */
export const lag = (T: number, v: number) => T * (1 - rate(v));

// ---- The checks ----

export function checkStrong(): string[] {
  const wrong: string[] = [];
  const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

  // The ship. Its own clock must be the length of its path; its thrust must be steady; and the
  // flash must really be where the ship is at the moment claimed.
  let own = 0;
  const n = 200000;
  for (let i = 0; i < n; i++) {
    const a = ship((3 * i) / n);
    const b = ship((3 * (i + 1)) / n);
    own += Math.sqrt((b.t - a.t) ** 2 - (b.x - a.x) ** 2);
  }
  if (!close(own, 3, 1e-5)) wrong.push(`the ship's clock: ${own}`);
  for (const tau of [0.5, 1, 2.5]) {
    // Steady thrust means (speed × stretch factor) grows evenly with home time: it equals home time exactly.
    const v = Math.tanh(tau);
    if (!close(v / Math.sqrt(1 - v * v), ship(tau).t)) wrong.push('thrust is not steady');
    const d = 1e-5;
    if (!close((ship(tau + d).x - ship(tau - d).x) / (ship(tau + d).t - ship(tau - d).t), v, 1e-5)) wrong.push('the ship\'s speed');
  }
  for (const sent of [0.1, 0.5, 0.9, 0.99]) {
    const at = ship(arrives(sent));
    if (!close(at.t - sent, at.x)) wrong.push(`flash sent at ${sent}`);
  }
  // Late flashes: follow the light and the ship step by step and see that it never gets there.
  if (arrives(1) !== Infinity) wrong.push('a flash sent at 1 should not arrive');
  for (const sent of [1.001, 1.2, 2]) {
    if (arrives(sent) !== Infinity) wrong.push(`a flash sent at ${sent} should not arrive`);
    let caught = false;
    // (No further than 15 years aboard: beyond that the numbers are too large to subtract safely.)
    for (let tau = 0; tau < 15; tau += 0.001) if (ship(tau).t - sent >= ship(tau).x) caught = true;
    if (caught) wrong.push(`stepping says the flash sent at ${sent} arrives`);
  }
  // Engines cut: the same flashes, found by stepping, against the rule.
  for (const [sent, off] of [[1.2, 2], [2, 1], [1.5, 2]] as [number, number][]) {
    let found = Infinity;
    for (let tau = 0; tau < 200 && found === Infinity; tau += 0.0005) {
      const p = shipCut(tau, off);
      if (p.t - sent >= p.x) found = tau;
    }
    if (!close(found, arrives(sent, off), 2e-3)) wrong.push(`engines cut at ${off}, sent ${sent}: ${found} against ${arrives(sent, off)}`);
  }
  for (const tau of [0.5, 2]) {
    const p = ship(tau);
    if (!close(reply(tau), p.t + p.x)) wrong.push('the ship\'s reply');
    // The stretch is the rate at which home's sending time changes with the ship's receiving time, upside down.
    const d = 1e-5;
    const sentAt = (x: number) => 1 - Math.exp(-x);
    if (!close((2 * d) / (sentAt(tau + d) - sentAt(tau - d)), stretch(tau), 1e-5)) wrong.push('the stretch');
  }
  const g = 9.80665;
  if (!close((C * C) / g / (C * 365.25 * 86400), 0.969, 2e-3)) wrong.push('a light-year, near enough, behind');
  if (!(unruh(g) > 3.9e-20 && unruh(g) < 4.1e-20)) wrong.push(`the Unruh warmth: ${unruh(g)}`);

  // The hole. Known sizes; the hovering clock as the budget's arrow; the fall and what is seen of it, by stepping.
  if (!close(horizon(1), 2953, 1e-3)) wrong.push(`the Sun's horizon: ${horizon(1)}`);
  for (const p of PACES) {
    const r = (p.c * p.c) / (p.a * p.a);
    if (!close(plunge(r), beta(p)) || !close(hover(r), p.b / p.c) || !close(hover(r), rate(plunge(r)))) wrong.push(`hovering at ${r}`);
  }
  {
    let r = 5;
    let tau = 0;
    let far = 0;
    let atHorizon = 0;
    const d = 2e-6;
    const mark = 1.02;
    let farAtMark = 0;
    while (r > 0.0005) {
      const fell = Math.sqrt(1 / r) * d;
      if (r > 1) far += d / (1 - Math.sqrt(1 / r));
      if (r > 1 && r - fell <= 1) atHorizon = tau;
      if (r > mark && r - fell <= mark) farAtMark = far;
      r -= fell;
      tau += d;
    }
    if (!close(atHorizon, fallTime(5, 1), 1e-4)) wrong.push(`time to the horizon: ${atHorizon}`);
    if (!close(tau, fallTime(5, 0), 1e-4)) wrong.push(`time to the centre: ${tau}`);
    if (!close(tau - atHorizon, 2 / 3, 1e-3)) wrong.push('horizon to centre');
    if (!close(farAtMark, seen(mark) - seen(5), 1e-3)) wrong.push(`what the watcher sees: ${farAtMark} against ${seen(mark) - seen(5)}`);
    if (!(seen(1.000001) - seen(5) > 30)) wrong.push('the watcher should wait without limit');
    if (!close(falling(5, fallTime(5, 2)), 2)) wrong.push('where the faller is');
  }
  // Tides at the horizon go as one over the mass squared.
  if (!close(tideAtHorizon(10) * 100, tideAtHorizon(1))) wrong.push('tides and mass');
  if (!(tideAtHorizon(1) > 1.0e10 && tideAtHorizon(1) < 1.06e10)) wrong.push(`tide at a Sun-mass horizon: ${tideAtHorizon(1)}`);
  if (!close((2 / 3) * horizon(4.3e6) / C, 28.2, 1e-2)) wrong.push('the fall inside the galaxy\'s hole');

  // The wormhole mouth's lag, against the twins' path rule.
  for (const p of PACES) {
    const T = 2 * p.c;
    const v = beta(p);
    const mouth = along([[0, 0], [T / 2, (v * T) / 2], [T, 0]]);
    if (!close(T - mouth, lag(T, v))) wrong.push(`the mouth's lag at ${v}`);
  }
  return wrong;
}
