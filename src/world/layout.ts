import { fbm, lerp, mulberry32, smoothstep } from '../noise';

/** How far from the centre the camera may travel. */
export const WORLD_RADIUS = 85;
/** How far the trees and ground continue, so the edge is hidden in mist. */
export const GROUND_SIZE = 320;

const BANK = 5; // width of the sloping bank around each pool

export interface Pool {
  x: number;
  z: number;
  radius: number;
  /** Height of the water surface. */
  level: number;
  /** Colour of the world on the other side, shown when the pool is open. */
  color: number;
  open: boolean;
}

function naturalHeight(x: number, z: number): number {
  return fbm(x * 0.018 + 40, z * 0.018 + 40) * 7 + fbm(x * 0.09, z * 0.09, 2) * 0.7;
}

/** Colours of the worlds behind the open pools. */
const OPEN_COLORS = [0xffc94d, 0xb07cff, 0x6fe3ff, 0xff7fa8, 0x8dff9a];

function makePools(): Pool[] {
  const rand = mulberry32(7);
  const pools: Pool[] = [];
  let tries = 0;
  while (pools.length < 16 && tries++ < 4000) {
    const angle = rand() * Math.PI * 2;
    const dist = Math.sqrt(rand()) * (WORLD_RADIUS - 8);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const radius = 2.6 + rand() * 1.8;
    if (pools.some((p) => Math.hypot(p.x - x, p.z - z) < 24)) continue;
    // Water sits just below the lowest point of the surrounding bank,
    // so it never floats above the ground on a slope.
    let level = Infinity;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      level = Math.min(level, naturalHeight(x + Math.cos(a) * (radius + BANK), z + Math.sin(a) * (radius + BANK)));
    }
    pools.push({ x, z, radius, level: level - 0.15, color: 0, open: false });
  }
  // Open roughly one pool in three, each to a differently coloured world.
  let c = 0;
  pools.forEach((p, i) => {
    if (i % 3 === 0) {
      p.open = true;
      p.color = OPEN_COLORS[c++ % OPEN_COLORS.length];
    }
  });
  return pools;
}

export const pools: Pool[] = makePools();

/** Ground height at any point, including the basins dug for the pools. */
export function groundHeight(x: number, z: number): number {
  let h = naturalHeight(x, z);
  for (const p of pools) {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < p.radius + BANK) {
      h = lerp(p.level - 0.7, h, smoothstep(p.radius * 0.8, p.radius + BANK, d));
    }
  }
  return h;
}

/** The pool at this point, if any (with a little margin around the water). */
export function poolAt(x: number, z: number, margin = 2): Pool | undefined {
  return pools.find((p) => Math.hypot(p.x - x, p.z - z) < p.radius + margin);
}
