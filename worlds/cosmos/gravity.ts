import { boosted } from './physics';

/**
 * The arithmetic behind the chambers on light cones, falling, curved space
 * and orbits, and the checks that guard them. As in physics.ts, every rule a
 * question relies on is tested here by a second, independent route.
 */

// ---- Light cones ----

export type Zone = 'future' | 'past' | 'elsewhere' | 'cone';
/** Where an event t years on and x light-years off lies, seen from here and now. */
export const zone = (t: number, x: number): Zone => (Math.abs(Math.abs(t) - Math.abs(x)) < 1e-9 ? 'cone' : Math.abs(t) < Math.abs(x) ? 'elsewhere' : t > 0 ? 'future' : 'past');
/** The interval, squared: the one thing about two events that every observer agrees on. */
export const interval2 = (t: number, x: number) => t * t - x * x;

// ---- Falling ----

export const C = 299792458; // metres a second
export const G_SURFACE = 9.80665; // metres a second, each second
export const GM_EARTH = 3.986004418e14; // cubic metres per second squared
export const R_EARTH = 6.371e6; // metres
export const YEAR = 365.25 * 86400;
/** By what fraction a clock h metres above the ground runs faster than one on it (gravity only). */
export const higher = (h: number) => (GM_EARTH / (C * C)) * (1 / R_EARTH - 1 / (R_EARTH + h));
/** By what fraction a clock in a circular orbit h metres up runs slower, from its speed alone. */
export const orbiting = (h: number) => GM_EARTH / (R_EARTH + h) / (2 * C * C);
/**
 * A clock thrown straight up and caught T seconds later, on an arc that peaks H metres up:
 * the seconds it gains over a clock held in the hand from being higher, the seconds it loses
 * from moving, and the difference. Good for everyday heights and speeds.
 */
export function thrown(H: number, T: number, g = G_SURFACE): { height: number; speed: number; net: number } {
  const height = ((2 / 3) * g * H * T) / (C * C);
  const speed = (8 * H * H) / (3 * T) / (C * C);
  return { height, speed, net: height - speed };
}
/** The peak of the arc a thrown thing really follows, if it comes back after T seconds. */
export const truePeak = (T: number, g = G_SURFACE) => (g * T * T) / 8;

// ---- Curved surfaces ----

export type Surface = 'flat' | 'sphere' | 'saddle';
/**
 * Two walkers set off side by side, each dead straight. How far apart they are, as a multiple
 * of where they began, after walking s (in units of the surface's radius of curvature).
 */
export const apart = (surface: Surface, s: number) => (surface === 'flat' ? 1 : surface === 'sphere' ? Math.cos(s) : Math.cosh(s));

// ---- Orbits, in units where the planet's pull is 1 at distance 1 ----

export interface Flight {
  /** Where it went: x, y, and the time. */
  path: [number, number, number][];
  fate: 'lands' | 'orbits' | 'escapes';
  /** Its least and greatest distances from the centre along the way. */
  near: number;
  far: number;
  /** How long one full circuit took, if it made one. */
  period: number;
}
/**
 * Fires something sideways at the given speed from distance 1, above a planet of the given
 * radius, and steps it forward: at each step the pull changes the velocity, and the velocity
 * changes the position.
 */
export function fire(speed: number, planet = 0.5, dt = 0.002, crude = false, limit = 80): Flight {
  let x = 0;
  let y = 1;
  let vx = speed;
  let vy = 0;
  let t = 0;
  const path: [number, number, number][] = [[x, y, 0]];
  let near = 1;
  let far = 1;
  let turned = 0;
  let angle = Math.atan2(x, y);
  let fate: Flight['fate'] = 'orbits';
  let period = 0;
  const pull = (px: number, py: number): [number, number] => {
    const r = Math.hypot(px, py);
    return [-px / (r * r * r), -py / (r * r * r)];
  };
  while (t < limit) {
    if (crude) {
      // The simplest stepping: use the pull where you are, for the whole step.
      const [ax, ay] = pull(x, y);
      x += vx * dt;
      y += vy * dt;
      vx += ax * dt;
      vy += ay * dt;
    } else {
      // The same, with the velocity kept half a step out of time with the position, which holds an orbit closed.
      let [ax, ay] = pull(x, y);
      vx += (ax * dt) / 2;
      vy += (ay * dt) / 2;
      x += vx * dt;
      y += vy * dt;
      [ax, ay] = pull(x, y);
      vx += (ax * dt) / 2;
      vy += (ay * dt) / 2;
    }
    t += dt;
    const r = Math.hypot(x, y);
    near = Math.min(near, r);
    far = Math.max(far, r);
    path.push([x, y, t]);
    if (r < planet) {
      fate = 'lands';
      break;
    }
    if (r > 40) {
      fate = 'escapes';
      break;
    }
    const now = Math.atan2(x, y);
    let d = now - angle;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    turned += d;
    angle = now;
    if (!crude && Math.abs(turned) >= 2 * Math.PI) {
      period = t;
      break;
    }
  }
  if (fate === 'orbits' && !period && !crude && speed * speed >= 2) fate = 'escapes';
  return { path, fate, near, far, period };
}
/** The greatest distance reached, by the conservation laws and not by stepping. */
export const farthest = (speed: number) => (speed * speed) / (2 - speed * speed);

// ---- The checks ----

export function checkGravity(): string[] {
  const wrong: string[] = [];
  const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

  // Light cones: the interval and the sorting survive every change of observer; order in time does not, outside the cone.
  for (let i = 0; i < 400; i++) {
    const t = ((i * 37) % 19) - 9;
    const x = ((i * 53) % 17) - 8;
    const v = (((i * 29) % 37) - 18) / 20;
    const [t2, x2] = boosted(t, x, v);
    if (!close(interval2(t, x), interval2(t2, x2), 1e-9)) wrong.push('the interval changed');
    if (zone(t, x) !== zone(t2, x2) && Math.abs(Math.abs(t) - Math.abs(x)) > 1e-9) wrong.push(`the sorting changed: ${t},${x} at ${v}`);
    if (zone(t, x) === 'elsewhere' && t !== 0) {
      // Someone moving at t/x finds it happening "now"; a little faster, and it has changed sides.
      const level = t / x;
      if (!close(boosted(t, x, level)[0], 0, 1e-9)) wrong.push('no observer finds it simultaneous');
      const beyond = level + Math.sign(level) * 0.5 * (1 - Math.abs(level));
      if (Math.sign(boosted(t, x, beyond)[0]) === Math.sign(t)) wrong.push('the order did not flip');
    }
  }

  // Clocks and height: the full expression against g h / c² near the ground, and against the well-known figures for GPS.
  if (!close(higher(1), G_SURFACE / (C * C), 5e-3)) wrong.push('clock rate per metre');
  if (!close(higher(1) * YEAR * 1e9, 3.44, 5e-3)) wrong.push('nanoseconds a year per metre');
  const gps = 20.2e6;
  const up = higher(gps) * 86400 * 1e6;
  const down = (orbiting(gps) - (465 * 465) / (2 * C * C)) * 86400 * 1e6;
  if (!(up > 45 && up < 46.5)) wrong.push(`GPS gravity part ${up}`);
  if (!(down > 6.9 && down < 7.4)) wrong.push(`GPS speed part ${down}`);
  if (!(up - down > 38 && up - down < 39)) wrong.push(`GPS net ${up - down}`);

  // The thrown clock: the closed form against the sum over a finely cut arc; the best arc against the real one;
  // and the real one against arcs bent a little out of shape, which must all do worse.
  const T = 2;
  const g = G_SURFACE;
  const sum = (h: (t: number) => number) => {
    let total = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.5) * T) / n;
      const v = (h(t + 1e-5) - h(t - 1e-5)) / 2e-5;
      total += (g * h(t) - (v * v) / 2) * (T / n);
    }
    return total / (C * C);
  };
  const arc = (H: number) => (t: number) => 4 * H * (t / T) * (1 - t / T);
  for (const H of [1, 4.9, 9]) if (!close(sum(arc(H)), thrown(H, T).net, 1e-6)) wrong.push(`thrown clock at ${H}`);
  let best = 0;
  for (let H = 0; H < 12; H += 0.001) if (thrown(H, T).net > thrown(best, T).net) best = H;
  if (Math.abs(best - truePeak(T)) > 0.002) wrong.push(`best arc ${best} against ${truePeak(T)}`);
  const real = sum(arc(truePeak(T)));
  for (let k = 1; k <= 5; k++) for (const e of [-0.3, 0.3]) if (!(sum((t) => arc(truePeak(T))(t) + e * Math.sin((k * Math.PI * t) / T)) < real)) wrong.push(`a bent arc beat the real one (${k}, ${e})`);

  // Curved surfaces: the rule against two walkers actually followed round a globe, and against stepping d'' = ∓d.
  const delta = 0.01;
  for (const s of [0.3, 1, Math.PI / 3, 1.5]) {
    // Each walker keeps to a great circle through the pole: latitude s, longitudes ±delta.
    const a = [Math.cos(s) * Math.sin(delta), Math.sin(s), Math.cos(s) * Math.cos(delta)];
    const b = [-Math.cos(s) * Math.sin(delta), Math.sin(s), Math.cos(s) * Math.cos(delta)];
    const angle = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    if (!close(angle / (2 * delta), apart('sphere', s), 1e-3)) wrong.push(`walkers on the globe at ${s}`);
    for (const [surface, sign] of [['sphere', -1], ['saddle', 1]] as [Surface, number][]) {
      let d = 1;
      let rate = 0;
      const n = 200000;
      for (let i = 0; i < n; i++) {
        rate += sign * d * (s / n);
        d += rate * (s / n);
      }
      if (!close(d, apart(surface, s), 1e-4)) wrong.push(`${surface} by stepping at ${s}`);
    }
  }
  if (!close(apart('sphere', Math.PI / 3), 0.5)) wrong.push('cos 60°');

  // Tides: the difference in pull across a small gap, against 2d/r³ along and d/r³ across.
  for (const r of [2, 3, 10]) {
    const d = 1e-4;
    const along = 1 / ((r - d / 2) * (r - d / 2)) - 1 / ((r + d / 2) * (r + d / 2));
    if (!close(along, (2 * d) / (r * r * r), 1e-5)) wrong.push(`tide along at ${r}`);
    // Two things side by side, each pulled toward the centre: the parts of the pulls that draw them together.
    const across = (2 * (d / 2)) / Math.pow(r * r + (d * d) / 4, 1.5);
    if (!close(across, d / (r * r * r), 1e-5)) wrong.push(`tide across at ${r}`);
  }

  // Orbits: stepping against the conservation laws and Kepler's third law.
  if (!close(fire(1).far, 1, 1e-3) || !close(fire(1).near, 1, 1e-3)) wrong.push('the circle');
  if (!close(fire(1).period, 2 * Math.PI, 2e-3)) wrong.push('the circle\'s period');
  for (const v of [1.1, 1.2, 1.3]) {
    const f = fire(v);
    if (!close(f.far, farthest(v), 2e-3)) wrong.push(`farthest at ${v}: ${f.far} against ${farthest(v)}`);
    const a = (1 + farthest(v)) / 2;
    if (!close(f.period, 2 * Math.PI * Math.pow(a, 1.5), 3e-3)) wrong.push(`period at ${v}`);
  }
  for (const v of [0.9, 0.85]) if (!close(fire(v, 0.1).near, farthest(v), 2e-3)) wrong.push(`nearest at ${v}`);
  if (fire(0.7).fate !== 'lands' || fire(1.2).fate !== 'orbits' || fire(1.45).fate !== 'escapes' || fire(1.38).fate !== 'orbits') wrong.push('fates');
  if (Math.abs(0.5 / (2 - 0.5) - 1 / 3) > 1e-9 || fire(0.9).fate !== 'orbits' || fire(0.8).fate !== 'lands') wrong.push('where landing begins');
  return wrong;
}
