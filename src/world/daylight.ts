import * as THREE from 'three';

/**
 * The sky over the wood follows the real sky over Brevard, North Carolina.
 * Whatever device this runs on, and wherever it is, the sun here rises, sets
 * and sits where it does in Brevard at this moment.
 */
const LATITUDE = 35.2334;
const LONGITUDE = -82.7343;

const RAD = Math.PI / 180;

/** Sun position in degrees: elevation above the horizon, azimuth clockwise from north. */
export function sunAt(date: Date): { elevation: number; azimuth: number } {
  const days = date.getTime() / 86400000 + 2440587.5 - 2451545.0; // days since J2000
  const anomaly = (357.529 + 0.98560028 * days) * RAD;
  const meanLong = 280.459 + 0.98564736 * days;
  const ecliptic = (meanLong + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD;
  const tilt = (23.439 - 0.00000036 * days) * RAD;
  const rightAsc = Math.atan2(Math.cos(tilt) * Math.sin(ecliptic), Math.cos(ecliptic));
  const declination = Math.asin(Math.sin(tilt) * Math.sin(ecliptic));
  const siderealDeg = (18.697374558 + 24.06570982441908 * days) * 15 + LONGITUDE;
  const hourAngle = siderealDeg * RAD - rightAsc;
  const lat = LATITUDE * RAD;
  const elevation = Math.asin(
    Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle),
  );
  const azimuth = Math.atan2(
    -Math.sin(hourAngle),
    Math.tan(declination) * Math.cos(lat) - Math.sin(lat) * Math.cos(hourAngle),
  );
  return { elevation: elevation / RAD, azimuth: ((azimuth / RAD) % 360 + 360) % 360 };
}

interface Mood {
  /** Sun elevation in degrees at which this mood is fully in effect. */
  at: number;
  horizon: number;
  zenith: number;
  light: number;
  lightPower: number;
  bounceSky: number;
  bounceGround: number;
  bouncePower: number;
  /** Tint for things that carry their own painted colour (leaves, plants, water). */
  ambient: number;
}

// From deep night up to full day. Between two entries the world blends smoothly.
const MOODS: Mood[] = [
  { at: -12, horizon: 0x1c2b47, zenith: 0x0a1126, light: 0x9db8ff, lightPower: 0.75, bounceSky: 0x7088c4, bounceGround: 0x182838, bouncePower: 0.75, ambient: 0x6f86c4 },
  { at: -4, horizon: 0x6d6290, zenith: 0x232f5c, light: 0xb9a8e6, lightPower: 0.7, bounceSky: 0x9a8fc8, bounceGround: 0x263248, bouncePower: 0.85, ambient: 0x9f9bd2 },
  { at: 1.5, horizon: 0xf4b98a, zenith: 0x90a9cb, light: 0xffa868, lightPower: 1.5, bounceSky: 0xffd6b0, bounceGround: 0x3a4a52, bouncePower: 1.0, ambient: 0xffd9c2 },
  { at: 11, horizon: 0xd9dcaa, zenith: 0xf6ecc0, light: 0xffd088, lightPower: 1.9, bounceSky: 0xfff0cc, bounceGround: 0x2f5650, bouncePower: 1.1, ambient: 0xfff6e0 },
  { at: 30, horizon: 0xbcd8c0, zenith: 0xf6f2cc, light: 0xffe0a3, lightPower: 2.0, bounceSky: 0xfff3d2, bounceGround: 0x2c5a55, bouncePower: 1.15, ambient: 0xffffff },
];

/** Everything the rest of the world needs to know about the light right now. */
export const daylight = {
  /** Direction the main light comes from: the sun by day, the moon by night. */
  lightDir: new THREE.Vector3(0.45, 0.85, 0.3).normalize(),
  /** Where the sun actually is, even below the horizon. */
  sunDir: new THREE.Vector3(0.45, 0.85, 0.3).normalize(),
  moonDir: new THREE.Vector3(-0.35, 0.8, -0.45).normalize(),
  horizon: new THREE.Color(),
  zenith: new THREE.Color(),
  light: new THREE.Color(),
  lightPower: 2,
  bounceSky: new THREE.Color(),
  bounceGround: new THREE.Color(),
  bouncePower: 1,
  ambient: new THREE.Color(),
  /** 1 in full sun, 0 once the sun has set: drives sunbeams and dappled light. */
  day: 1,
  /** 1 in full night, 0 by day: drives stars, fireflies and the glow of open pools. */
  night: 0,
};

const a = new THREE.Color();
const b = new THREE.Color();
function blend(out: THREE.Color, from: number, to: number, t: number): void {
  out.copy(a.set(from)).lerp(b.set(to), t);
}

// For trying out times of day: add ?sun=-20 (night), ?sun=1 (sunset), ?sun=50 (noon) to the address.
const forced = new URLSearchParams(window.location.search).get('sun');

export function updateDaylight(date: Date): void {
  const sun = sunAt(date);
  if (forced !== null && forced !== '') {
    sun.elevation = Number(forced);
    sun.azimuth = 235;
  }
  const el = sun.elevation * RAD;
  const az = sun.azimuth * RAD;
  // World axes: +x is east, -z is north.
  daylight.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));

  let lo = MOODS[0];
  let hi = MOODS[MOODS.length - 1];
  for (let i = 0; i < MOODS.length - 1; i++) {
    if (sun.elevation >= MOODS[i].at) {
      lo = MOODS[i];
      hi = MOODS[i + 1];
    }
  }
  const t = Math.min(1, Math.max(0, (sun.elevation - lo.at) / (hi.at - lo.at)));
  blend(daylight.horizon, lo.horizon, hi.horizon, t);
  blend(daylight.zenith, lo.zenith, hi.zenith, t);
  blend(daylight.light, lo.light, hi.light, t);
  blend(daylight.bounceSky, lo.bounceSky, hi.bounceSky, t);
  blend(daylight.bounceGround, lo.bounceGround, hi.bounceGround, t);
  blend(daylight.ambient, lo.ambient, hi.ambient, t);
  daylight.lightPower = lo.lightPower + (hi.lightPower - lo.lightPower) * t;
  daylight.bouncePower = lo.bouncePower + (hi.bouncePower - lo.bouncePower) * t;

  daylight.day = Math.min(1, Math.max(0, (sun.elevation - 1) / 14));
  daylight.night = Math.min(1, Math.max(0, (-2 - sun.elevation) / 8));

  // Light the world from the sun while it is up (never from quite flat on the
  // horizon, which would leave everything in shadow), and from the moon after.
  if (sun.elevation > -2) {
    const lift = Math.max(el, 14 * RAD);
    daylight.lightDir.set(Math.sin(az) * Math.cos(lift), Math.sin(lift), -Math.cos(az) * Math.cos(lift));
  } else {
    daylight.lightDir.copy(daylight.moonDir);
  }
}

updateDaylight(new Date());
