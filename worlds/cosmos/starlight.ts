/**
 * The arithmetic of stage D: what light says about the thing that sent it,
 * how a star's mass settles its life, and how distances are measured; with
 * the checks that guard them. Every rule is tested by a second route.
 */

// ---- Light ----

/** Wien's constant: a glowing body's peak wavelength in nanometres, times its temperature in kelvin. */
export const WIEN = 2.897771955e6;
export const SUN_T = 5772;
export const peak = (T: number) => WIEN / T;
/** The brightness of a glowing body at one wavelength (in nanometres), in units that do not matter. */
export function planck(nm: number, T: number): number {
  const x = 1.438776877e7 / (nm * T);
  return x > 600 ? 0 : 1 / (Math.pow(nm, 5) * Math.expm1(x));
}
/** How much each square metre of surface gives out, against the Sun's. */
export const power = (T: number) => Math.pow(T / SUN_T, 4);
/** The strongest visible lines of a few elements, in nanometres, as measured in air. */
export const LINES: Record<string, number[]> = {
  hydrogen: [656.3, 486.1, 434.0, 410.2],
  helium: [667.8, 587.6, 501.6, 447.1],
  sodium: [589.3],
  calcium: [396.8, 393.4],
  magnesium: [517.3],
};
/** A wavelength as received from something moving away at v (a fraction of light speed; negative for approaching). */
export const shifted = (nm: number, v: number) => nm * Math.sqrt((1 + v) / (1 - v));
export const C_KM = 299792.458;

// ---- Stars ----

/** How bright a star in the main part of its life is, in Suns, from its mass in Suns. An empirical fit, in four pieces. */
export function luminosity(M: number): number {
  if (M < 0.43) return 0.23 * Math.pow(M, 2.3);
  if (M < 2) return Math.pow(M, 4);
  if (M < 55) return 1.4 * Math.pow(M, 3.5);
  return 32000 * M;
}
/** How long it shines that way, in billions of years: its fuel over the rate it burns it, with the Sun's 10 as the measure. */
export const lifetime = (M: number) => (10 * M) / luminosity(M);
/** Typical stars in the main part of their lives: mass, radius (both in Suns) and surface temperature in kelvin. */
export const TYPICAL: [number, number, number][] = [
  [0.08, 0.11, 2650],
  [0.15, 0.18, 3120],
  [0.6, 0.51, 3800],
  [0.69, 0.74, 4410],
  [0.78, 0.85, 5240],
  [0.93, 0.93, 5610],
  [1, 1, SUN_T],
  [1.1, 1.05, 5920],
  [1.3, 1.2, 6540],
  [1.7, 1.3, 7240],
  [2.1, 1.7, 8620],
  [3.2, 2.5, 10800],
  [6.5, 3.8, 16400],
  [18, 7.4, 30000],
  [35, 9.8, 38000],
  [100, 12, 50000],
];
function between(M: number, column: 1 | 2): number {
  const rows = TYPICAL;
  if (M <= rows[0][0]) return rows[0][column];
  for (let i = 1; i < rows.length; i++) {
    if (M <= rows[i][0]) {
      const f = Math.log(M / rows[i - 1][0]) / Math.log(rows[i][0] / rows[i - 1][0]);
      return rows[i - 1][column] * Math.pow(rows[i][column] / rows[i - 1][column], f);
    }
  }
  return rows[rows.length - 1][column];
}
export const radius = (M: number) => between(M, 1);
export const surface = (M: number) => between(M, 2);
export type Fate = 'brown' | 'white' | 'neutron' | 'hole';
/** What is left at the end. The upper two boundaries are rough, and still argued over. */
export const fate = (M: number): Fate => (M < 0.08 ? 'brown' : M < 8 ? 'white' : M < 20 ? 'neutron' : 'hole');

// ---- Distances ----

export const AU_KM = 149597870.7;
export const LY_KM = C_KM * 86400 * 365.25;
/** One parsec, in light-years: the distance from which the Earth's orbit looks one second of arc in radius. */
export const PC_LY = AU_KM / Math.tan(Math.PI / 180 / 3600) / LY_KM;
/** Distance in parsecs from a parallax in seconds of arc. */
export const parsecs = (arcsec: number) => 1 / arcsec;
/** How bright a Cepheid really is, in Suns, from the days it takes to pulse once (Benedict and others, 2007). */
export const cepheid = (days: number) => Math.pow(10, 0.4 * (4.83 - (-2.43 * (Math.log10(days) - 1) - 4.05)));
/** How bright something looks, from how bright it is and how far: any units, so long as they are kept to. */
export const looks = (bright: number, far: number) => bright / (far * far);
/** The rate at which the universe is expanding, in km/s for each million parsecs: the round figure between the two measured ones. */
export const H0 = 70;

// ---- The checks ----

export function checkStarlight(): string[] {
  const wrong: string[] = [];
  const close = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

  // Wien's law, by hunting for the top of the curve; and the fourth-power law, by adding the curve up.
  for (const T of [3000, SUN_T, 12000, 30000]) {
    let best = 0;
    let at = 0;
    for (let nm = 20; nm < 5000; nm += 0.05) {
      const b = planck(nm, T);
      if (b > best) {
        best = b;
        at = nm;
      }
    }
    if (!close(at, peak(T), 2e-3)) wrong.push(`peak at ${T}: ${at} against ${peak(T)}`);
  }
  const total = (T: number) => {
    let sum = 0;
    for (let nm = 5; nm < 400000; nm *= 1.0005) sum += planck(nm, T) * nm * 0.0005;
    return sum;
  };
  if (!close(total(2 * SUN_T) / total(SUN_T), 16, 2e-3)) wrong.push(`twice as hot: ${total(2 * SUN_T) / total(SUN_T)}`);
  if (!close(total(3000) / total(SUN_T), power(3000), 2e-3)) wrong.push('the fourth-power law');
  if (!close(peak(SUN_T), 502, 2e-3)) wrong.push('the Sun\'s peak');

  // Hydrogen's lines from Rydberg's formula (which gives them in a vacuum; air shortens them by 0.028%).
  LINES.hydrogen.forEach((line, i) => {
    const n = i + 3;
    const vacuum = 1 / (1.0967757e-2 * (1 / 4 - 1 / (n * n)));
    if (Math.abs(vacuum / 1.000277 - line) > 0.15) wrong.push(`hydrogen line ${n}: ${vacuum / 1.000277} against ${line}`);
  });
  // For slow things the shift is simply the speed as a fraction of light's.
  if (!close(shifted(500, 0.01) / 500 - 1, 0.01, 1e-4)) wrong.push('the shift for slow things');
  if (!(shifted(656.3, 0.04) > 656.3 && shifted(656.3, -0.04) < 656.3)) wrong.push('which way the shift goes');
  if (!close(shifted(shifted(600, 0.3), -0.3), 600)) wrong.push('the shift undone');

  // Stars: the four pieces of the brightness rule must meet; the Sun must come out as the Sun.
  for (const [edge, tol] of [[0.43, 0.06], [2, 0.03], [55, 0.03]] as [number, number][]) if (!close(luminosity(edge * 0.9999), luminosity(edge * 1.0001), tol)) wrong.push(`the brightness rule at ${edge}`);
  if (!close(luminosity(1), 1) || !close(lifetime(1), 10) || !close(surface(1), SUN_T) || !close(radius(1), 1)) wrong.push('the Sun');
  if (!(lifetime(10) > 0.015 && lifetime(10) < 0.03)) wrong.push(`a ten-Sun star's life: ${lifetime(10)}`);
  if (!(lifetime(0.1) > 500)) wrong.push(`a small star's life: ${lifetime(0.1)}`);
  for (let i = 1; i < TYPICAL.length; i++) if (!(TYPICAL[i][0] > TYPICAL[i - 1][0] && TYPICAL[i][2] > TYPICAL[i - 1][2])) wrong.push('the table of typical stars');
  // The Sun's light, as mass lost each second: 3.828e26 watts over c squared.
  if (!close(3.828e26 / (C_KM * 1000) ** 2 / 1e9, 4.26, 3e-3)) wrong.push('the Sun\'s mass loss');
  // Brightness against size and temperature: a star's light is its area times the fourth power of its temperature.
  for (const [M, R, T] of TYPICAL) {
    const fromSurface = R * R * power(T);
    const ratio = fromSurface / luminosity(M);
    if (!(ratio > 0.2 && ratio < 5)) wrong.push(`a star of ${M} Suns: its surface gives ${fromSurface}, the rule ${luminosity(M)}`);
  }

  // Distances.
  if (!close(PC_LY, 3.2616, 1e-4)) wrong.push(`the parsec: ${PC_LY}`);
  if (!close(parsecs(0.7680665) * PC_LY, 4.2465, 1e-3)) wrong.push('the nearest star');
  // A second of arc: a two-centimetre coin four kilometres off, near enough.
  if (!close(0.02 / 4125, Math.PI / 180 / 3600, 2e-3)) wrong.push('the coin');
  if (!close(cepheid(10), 3565, 5e-3)) wrong.push(`a ten-day Cepheid: ${cepheid(10)}`);
  if (!(cepheid(30) > cepheid(10) && cepheid(10) > cepheid(3))) wrong.push('Cepheids');
  if (!close(looks(1, 10), looks(1, 1) / 100)) wrong.push('the inverse square');
  // Light spread over a sphere: the same total through every sphere, whatever its size.
  if (!close(looks(1, 3) * 4 * Math.PI * 9, looks(1, 7) * 4 * Math.PI * 49)) wrong.push('light is not used up on the way');
  return wrong;
}
