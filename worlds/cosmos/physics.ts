/**
 * The arithmetic of special relativity, in units where light travels one
 * light-year a year, and the checks that guard the practice questions.
 *
 * Speeds are kept as exact fractions taken from whole-number right triangles
 * (3-4-5, 5-12-13, ...), because for those the square roots come out exactly:
 * at 3/5 of light speed a clock runs at exactly 4/5.
 */

/** A speed a/c of light, and the rate b/c at which a clock moving that fast runs. */
export interface Pace {
  a: number;
  b: number;
  c: number;
}
export const PACES: Pace[] = [
  { a: 3, b: 4, c: 5 },
  { a: 4, b: 3, c: 5 },
  { a: 5, b: 12, c: 13 },
  { a: 12, b: 5, c: 13 },
  { a: 7, b: 24, c: 25 },
  { a: 24, b: 7, c: 25 },
  { a: 8, b: 15, c: 17 },
  { a: 15, b: 8, c: 17 },
];
export const beta = (p: Pace) => p.a / p.c;
/** How fast a moving clock runs, as a fraction of a clock at rest. */
export const rate = (v: number) => Math.sqrt(1 - v * v);
export const gamma = (v: number) => 1 / rate(v);
/** The time a clock records along a straight stretch of its path: t and x in years and light-years. */
export const proper = (dt: number, dx: number) => Math.sqrt(Math.max(0, dt * dt - dx * dx));
/** The time recorded along a path through the points given, each [t, x]. */
export const along = (path: [number, number][]) => path.slice(1).reduce((sum, p, i) => sum + proper(p[0] - path[i][0], p[1] - path[i][1]), 0);
/** How many times slower flashes arrive from something receding at v (and 1 over this for approaching). */
export const doppler = (v: number) => Math.sqrt((1 - v) / (1 + v));
/** The same event, as timed by someone moving at v: the Lorentz transformation. */
export const boosted = (t: number, x: number, v: number): [number, number] => [gamma(v) * (t - v * x), gamma(v) * (x - v * t)];

const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : Math.abs(x));
/** A fraction in lowest terms, written out: "4/5", or "3" when it is whole. */
export function frac(n: number, d: number): string {
  const g = gcd(n, d) || 1;
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
}
/** A number to at most two places, without trailing noughts. */
export const tidy = (x: number) => String(Math.round(x * 100) / 100);

/**
 * Checks the physics every other way it can be done: the exact fractions against the square
 * root; clock rates against the Lorentz transformation; a round trip's ages against a count of
 * yearly flashes actually followed across the gap; and the path-length rule against a path cut
 * into ten thousand small steps. Returns what disagrees, if anything.
 */
export function checkPhysics(): string[] {
  const wrong: string[] = [];
  const close = (x: number, y: number) => Math.abs(x - y) < 1e-9;
  for (const p of PACES) {
    const v = beta(p);
    if (!close(rate(v), p.b / p.c)) wrong.push(`rate at ${frac(p.a, p.c)}`);
    // A clock riding at v, read after t years of ours, by transforming the event where it then is.
    const [onBoard] = boosted(10, v * 10, v);
    if (!close(onBoard, 10 * rate(v))) wrong.push(`Lorentz at ${frac(p.a, p.c)}`);
    // A round trip out to L and back: ages by path length, and by counting flashes.
    const L = p.a * 2;
    const T = (2 * L) / v;
    const aboard = along([[0, 0], [T / 2, L], [T, 0]]);
    if (!close(aboard, T * rate(v))) wrong.push(`round trip at ${frac(p.a, p.c)}`);
    let outward = 0;
    let homeward = 0;
    for (let sent = 1; sent <= T + 1e-9; sent++) {
      // A flash sent from home at `sent` meets the outbound ship when t - sent = v t.
      const meetsOut = sent / (1 - v);
      if (meetsOut <= T / 2 + 1e-9) outward++;
      else if (sent <= T + 1e-9) homeward++;
    }
    const half = (T / 2) * rate(v);
    if (!close(outward, half * doppler(v))) wrong.push(`flashes out at ${frac(p.a, p.c)}: ${outward} against ${half * doppler(v)}`);
    if (!close(homeward, half / doppler(v))) wrong.push(`flashes back at ${frac(p.a, p.c)}: ${homeward} against ${half / doppler(v)}`);
    if (!close(outward + homeward, T)) wrong.push(`flashes in all at ${frac(p.a, p.c)}`);
    // What the traveller calls "now" at home, just before turning: from the Lorentz transformation run backwards.
    const nowHome = T / 2 - v * L;
    const [tShip] = boosted(nowHome, 0, v);
    const [tTurn] = boosted(T / 2, L, v);
    if (!close(tShip, tTurn)) wrong.push(`simultaneity at ${frac(p.a, p.c)}`);
  }
  // A bent path, cut fine, against the rule for each straight stretch.
  const bent: [number, number][] = [[0, 0], [3, 1.2], [7, -0.8], [10, 0]];
  let fine = 0;
  for (let leg = 0; leg < bent.length - 1; leg++) {
    const [t0, x0] = bent[leg];
    const [t1, x1] = bent[leg + 1];
    const v = (x1 - x0) / (t1 - t0);
    for (let i = 0; i < 10000; i++) fine += ((t1 - t0) / 10000) * rate(v);
  }
  if (Math.abs(fine - along(bent)) > 1e-6) wrong.push('bent path');
  if (!(along(bent) < 10)) wrong.push('the straight path should be the longest');
  return wrong;
}
