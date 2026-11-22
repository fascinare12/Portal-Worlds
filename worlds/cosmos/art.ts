/**
 * Drawing pieces shared by the night world's figures: a field of stars, a
 * shaded planet, a black hole with its bright ring, and the gradients they
 * need. All of it is decoration; nothing here carries any physics.
 */

/** Gradients and glows, to be put once inside any figure that uses the pieces below. */
export const DEFS = `<defs>
  <radialGradient id="art-planet" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#7fd0a0"/><stop offset="0.55" stop-color="#2f7a56"/><stop offset="1" stop-color="#123326"/></radialGradient>
  <radialGradient id="art-air" cx="50%" cy="50%" r="50%"><stop offset="0.78" stop-color="#7fb6ff" stop-opacity="0.35"/><stop offset="1" stop-color="#7fb6ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="art-globe" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#2a3a86"/><stop offset="0.7" stop-color="#151c4a"/><stop offset="1" stop-color="#0b0e22"/></radialGradient>
  <radialGradient id="art-hole" cx="50%" cy="50%" r="50%"><stop offset="0.55" stop-color="#000"/><stop offset="0.62" stop-color="#000"/><stop offset="0.66" stop-color="#ffd27a" stop-opacity="0.95"/><stop offset="0.74" stop-color="#ff8a4a" stop-opacity="0.45"/><stop offset="1" stop-color="#ff8a4a" stop-opacity="0"/></radialGradient>
  <linearGradient id="art-flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="0.35" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff7a3a" stop-opacity="0"/></linearGradient>
  <linearGradient id="art-future" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e8c24a" stop-opacity="0.28"/><stop offset="1" stop-color="#e8c24a" stop-opacity="0.04"/></linearGradient>
  <linearGradient id="art-past" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb6ff" stop-opacity="0.28"/><stop offset="1" stop-color="#7fb6ff" stop-opacity="0.04"/></linearGradient>
  <linearGradient id="art-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f7a52"/><stop offset="1" stop-color="#16301f"/></linearGradient>
  <filter id="art-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;

/** A scatter of stars over a figure of the given size: always the same scatter for the same seed. */
export function stars(width: number, height: number, count = 60, seed = 7): string {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  let out = '';
  for (let i = 0; i < count; i++) {
    const big = rand() < 0.12;
    out += `<circle cx="${(rand() * width).toFixed(1)}" cy="${(rand() * height).toFixed(1)}" r="${big ? 1.5 : 0.8}" fill="${rand() < 0.2 ? '#b9c4ff' : '#e9e6f5'}" opacity="${(0.25 + rand() * 0.6).toFixed(2)}"/>`;
  }
  return out;
}

/** A planet, lit from the upper left, with a thin haze of air. */
export const planet = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r * 1.22}" fill="url(#art-air)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#art-planet)"/>`;

/** A black hole: r is the radius of the horizon itself; the bright ring is drawn just outside it. */
export const hole = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r / 0.62}" fill="url(#art-hole)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#000"/>`;

/** Something drawn with a soft glow round it. */
export const glow = (inner: string) => `<g filter="url(#art-glow)">${inner}</g>`;

/**
 * Roughly the colour a glowing body of the given temperature (in kelvin) looks to the eye:
 * Tanner Helland's fit to the blackbody colours. Good enough to paint a star with; not a measurement.
 */
export function starColour(T: number): string {
  const t = Math.max(10, Math.min(400, T / 100));
  const clamp = (x: number) => Math.round(Math.max(0, Math.min(255, x)));
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}

/** A star: a disc of the given colour with a wide soft halo. */
export const star = (cx: number, cy: number, r: number, colour: string) =>
  `<circle cx="${cx}" cy="${cy}" r="${r * 1.9}" fill="${colour}" opacity="0.10"/><circle cx="${cx}" cy="${cy}" r="${r * 1.35}" fill="${colour}" opacity="0.22"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${colour}" filter="url(#art-glow)"/>`;

/** The colours of the rainbow, as stops for a gradient running from 380 to 700 nanometres. */
export const RAINBOW = `<linearGradient id="art-rainbow" x1="0" x2="1"><stop offset="0" stop-color="#5a00a8"/><stop offset="0.14" stop-color="#3a35ff"/><stop offset="0.30" stop-color="#00a2ff"/><stop offset="0.42" stop-color="#00e08a"/><stop offset="0.55" stop-color="#b6f000"/><stop offset="0.64" stop-color="#ffe600"/><stop offset="0.74" stop-color="#ff8a00"/><stop offset="0.88" stop-color="#ff1a00"/><stop offset="1" stop-color="#8a0000"/></linearGradient>`;
