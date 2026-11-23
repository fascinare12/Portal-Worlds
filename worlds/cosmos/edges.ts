/**
 * The arithmetic of stage G: what the number of directions does to forces
 * and orbits, the counting of a cube in four dimensions, and the entropy,
 * temperature and lifetime of a black hole, with the curve its radiation's
 * entropy must follow if information is kept. With the checks that guard them.
 */

// ---- Directions ----

/** The size of the surface a distance r from a point, when space has the given number of directions. */
export function shell(directions: number, r: number): number {
  if (directions === 2) return 2 * Math.PI * r;
  if (directions === 3) return 4 * Math.PI * r * r;
  return 2 * Math.PI * Math.PI * r * r * r;
}
/** The strength of a force that spreads evenly from a point, at distance r: 1 at distance 1. */
export const pull = (directions: number, r: number) => Math.pow(r, -(directions - 1));

export interface Round {
  path: [number, number][];
  fate: 'holds' | 'falls in' | 'flies off';
  near: number;
  far: number;
}
/**
 * Something set going sideways at distance 1 from a centre whose pull falls off as it would in a
 * space of that many directions. Speed 1 is the speed that holds a circle. Stepped forward.
 */
export function round(directions: number, speed: number, time = 60, dt = 0.002): Round {
  let x = 1;
  let y = 0;
  let vx = 0;
  let vy = speed;
  const path: [number, number][] = [[x, y]];
  let near = 1;
  let far = 1;
  let fate: Round['fate'] = 'holds';
  const acc = (px: number, py: number): [number, number] => {
    const r = Math.hypot(px, py);
    const f = pull(directions, r) / r;
    return [-px * f, -py * f];
  };
  for (let t = 0, n = 0; t < time; t += dt, n++) {
    let [ax, ay] = acc(x, y);
    vx += (ax * dt) / 2;
    vy += (ay * dt) / 2;
    x += vx * dt;
    y += vy * dt;
    [ax, ay] = acc(x, y);
    vx += (ax * dt) / 2;
    vy += (ay * dt) / 2;
    const r = Math.hypot(x, y);
    near = Math.min(near, r);
    far = Math.max(far, r);
    if (n % 10 === 0) path.push([x, y]);
    if (r < 0.06) {
      fate = 'falls in';
      break;
    }
    if (r > 6) {
      fate = 'flies off';
      break;
    }
  }
  return { path, fate, near, far };
}

/** How many pieces of each kind a cube has in n directions: corners, edges, square faces, cubes, and so on. */
export function cube(n: number): number[] {
  const choose = (a: number, b: number): number => (b === 0 ? 1 : (choose(a, b - 1) * (a - b + 1)) / b);
  return Array.from({ length: n + 1 }, (_, k) => choose(n, k) * 2 ** (n - k));
}
/** The sixteen corners of a cube in four directions, and the thirty-two edges that join them. */
export const CORNERS: number[][] = Array.from({ length: 16 }, (_, i) => [0, 1, 2, 3].map((b) => ((i >> b) & 1 ? 1 : -1)));
export const EDGES: [number, number][] = CORNERS.flatMap((_, i) => [0, 1, 2, 3].filter((b) => !((i >> b) & 1)).map((b) => [i, i | (1 << b)] as [number, number]));

// ---- Counting, and black holes ----

/** The number of ways of having k heads among n coins. */
export function ways(n: number, k: number): number {
  let w = 1;
  for (let i = 1; i <= k; i++) w = (w * (n - k + i)) / i;
  return Math.round(w);
}
export const bits = (count: number) => Math.log2(count);

const G = 6.6743e-11;
const HBAR = 1.054571817e-34;
const C = 299792458;
const K = 1.380649e-23;
export const SUN_KG = 1.98847e30;
const YEAR = 3.15576e7;
/** A black hole's entropy, in bits, from its mass in kilograms: a quarter of its horizon's area, counted in the smallest area there is. */
export const holeBits = (kg: number) => (4 * Math.PI * G * kg * kg) / (HBAR * C) / Math.LN2;
/** The temperature it glows at, in kelvin. */
export const holeGlow = (kg: number) => (HBAR * C * C * C) / (8 * Math.PI * G * kg * K);
/** How long it takes to radiate itself away, in years, if nothing falls in. */
export const holeLife = (kg: number) => (5120 * Math.PI * G * G * kg * kg * kg) / (HBAR * C ** 4) / YEAR;

/**
 * A black hole made of N two-way switches gives them up one at a time. The entropy of what has come out,
 * in bits, once n have: by Hawking's reckoning, and by Page's, for radiation that keeps the information.
 */
export const hawking = (n: number) => n;
export function page(N: number, n: number): number {
  const small = 2 ** Math.min(n, N - n);
  const big = 2 ** Math.max(n, N - n);
  // The sum of 1/k from big+1 to small×big, by the usual formula for such sums.
  const harmonic = (x: number) => Math.log(x) + 0.5772156649015329 + 1 / (2 * x) - 1 / (12 * x * x);
  return Math.max(0, harmonic(small * big) - harmonic(big) - (small - 1) / (2 * big)) / Math.LN2;
}

// ---- The checks ----

export function checkEdges(): string[] {
  const wrong: string[] = [];
  const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

  // What spreads from a point is not used up: strength × surface is the same at every distance.
  for (const d of [2, 3, 4]) if (!close(pull(d, 1) * shell(d, 1), pull(d, 3.7) * shell(d, 3.7))) wrong.push(`spreading in ${d}`);
  // The surface in four directions, by adding up thin slices of ordinary spheres.
  {
    let sum = 0;
    const n = 200000;
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / n) * Math.PI;
      sum += 4 * Math.PI * Math.sin(a) ** 2 * (Math.PI / n);
    }
    if (!close(sum, shell(4, 1), 1e-6)) wrong.push(`the surface in four directions: ${sum}`);
  }
  // Orbits: nudged from a circle, they hold in two and three directions and not in four.
  for (const [d, speed, fate] of [[2, 0.9, 'holds'], [2, 1.1, 'holds'], [3, 0.9, 'holds'], [3, 1.1, 'holds'], [4, 0.97, 'falls in'], [4, 1.03, 'flies off']] as [number, number, string][]) {
    const got = round(d, speed, 200).fate;
    if (got !== fate) wrong.push(`an orbit in ${d} at ${speed}: ${got}`);
  }
  if (!close(round(3, 1, 20).far, 1, 1e-3) || !close(round(4, 1, 5).far, 1, 1e-3)) wrong.push('the circle');
  // The same from the balance of forces: a circle is steady only if the pull falls off more slowly than 1/r³.
  for (const d of [2, 3, 4, 5]) {
    const hill = (r: number) => 1 / (2 * r * r) + (d === 2 ? Math.log(r) : -1 / ((d - 2) * Math.pow(r, d - 2)));
    const bend = (hill(1.001) - 2 * hill(1) + hill(0.999)) / 1e-6;
    if ((bend > 1e-3) !== d < 4) wrong.push(`the balance in ${d}: ${bend}`);
  }

  // The cube in n directions: count its pieces by listing them, against the formula.
  for (let n = 1; n <= 4; n++) {
    const corners = 2 ** n;
    let edges = 0;
    for (let i = 0; i < corners; i++) for (let j = i + 1; j < corners; j++) if ([1, 2, 4, 8].includes(i ^ j)) edges++;
    let squares = 0;
    for (let i = 0; i < corners; i++) for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (!((i >> a) & 1) && !((i >> b) & 1)) squares++;
    const c = cube(n);
    if (c[0] !== corners || c[1] !== edges || (n >= 2 && c[2] !== squares)) wrong.push(`the cube in ${n}: ${c} against ${corners}, ${edges}, ${squares}`);
  }
  if (cube(4).join() !== '16,32,24,8,1' || EDGES.length !== 32 || cube(3).join() !== '8,12,6,1') wrong.push('the tesseract');

  // Counting.
  if (ways(20, 10) !== 184756 || ways(20, 0) !== 1) wrong.push('ways');
  let all = 0;
  for (let k = 0; k <= 20; k++) all += ways(20, k);
  if (all !== 2 ** 20) wrong.push('all the ways');

  // A black hole of the Sun's mass, against the figures in the textbooks.
  if (!close(holeGlow(SUN_KG), 6.17e-8, 5e-3)) wrong.push(`its glow: ${holeGlow(SUN_KG)}`);
  if (!close(holeLife(SUN_KG), 2.1e67, 2e-2)) wrong.push(`its life: ${holeLife(SUN_KG)}`);
  // Its entropy, the other way: the horizon's area over four times the smallest area.
  const rs = (2 * G * SUN_KG) / (C * C);
  const smallest = (HBAR * G) / C ** 3;
  if (!close(holeBits(SUN_KG), (4 * Math.PI * rs * rs) / (4 * smallest) / Math.LN2, 1e-9)) wrong.push('its entropy');
  if (!(holeBits(SUN_KG) > 1.4e77 && holeBits(SUN_KG) < 1.6e77)) wrong.push(`its entropy in bits: ${holeBits(SUN_KG)}`);
  if (!close(holeBits(2 * SUN_KG), 4 * holeBits(SUN_KG)) || !close(holeGlow(2 * SUN_KG), holeGlow(SUN_KG) / 2) || !close(holeLife(2 * SUN_KG), 8 * holeLife(SUN_KG))) wrong.push('how they scale');
  // Two holes that merge must end with at least the area they began with: the 2025 event.
  if (!(63 ** 2 > 33 ** 2 + 32 ** 2)) wrong.push('the area law');

  // Page's curve. For one switch against many, work it out directly: make random states, find the
  // entropy of the one switch from first principles, and average.
  {
    let seed = 99;
    const even = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const bell = () => Math.sqrt(-2 * Math.log(even())) * Math.cos(2 * Math.PI * even());
    const rest = 8;
    let total = 0;
    const tries = 6000;
    for (let t = 0; t < tries; t++) {
      // Amplitudes for (switch up or down) × (the rest in one of 8 states): sixteen arrows, drawn at random.
      const up = Array.from({ length: rest }, () => [bell(), bell()]);
      const down = Array.from({ length: rest }, () => [bell(), bell()]);
      const size = [...up, ...down].reduce((s, a) => s + a[0] * a[0] + a[1] * a[1], 0);
      const pUp = up.reduce((s, a) => s + a[0] * a[0] + a[1] * a[1], 0) / size;
      let re = 0;
      let im = 0;
      for (let k = 0; k < rest; k++) {
        re += (up[k][0] * down[k][0] + up[k][1] * down[k][1]) / size;
        im += (up[k][1] * down[k][0] - up[k][0] * down[k][1]) / size;
      }
      const root = Math.sqrt(Math.max(0, (2 * pUp - 1) ** 2 + 4 * (re * re + im * im)));
      for (const p of [(1 + root) / 2, (1 - root) / 2]) if (p > 1e-12) total -= p * Math.log2(p);
    }
    if (!close(total / tries, page(4, 1), 1e-2)) wrong.push(`Page's curve, by trial: ${total / tries} against ${page(4, 1)}`);
  }
  // It starts by following Hawking's line, peaks at the half-way point, and ends at nothing.
  if (!close(page(40, 5), 5, 1e-3) || !close(page(40, 35), 5, 1e-3) || !(page(40, 20) > 19 && page(40, 20) < 20) || page(40, 40) > 1e-6 || page(40, 0) > 1e-6) wrong.push('the shape of Page\'s curve');
  return wrong;
}
