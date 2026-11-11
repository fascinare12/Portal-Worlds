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
  /** The world this pool leads to, once that world exists: the folder name under worlds/. */
  world?: string;
  /** The picture seen when looking into the pool: 1 = a pyramid being built, 2 = kanji being sprayed on a wall, 3 = fish circling in dark water. */
  scene?: number;
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
      if (i === 0) {
        // The first doorway that goes somewhere: pale sand, for the desert.
        p.color = 0xe6cfa0;
        p.world = 'desert';
        p.scene = 1;
      }
      if (i === 3) {
        // The second doorway, red: a city street at night, where Japanese is learned.
        p.color = 0xe0383a;
        p.world = 'shibuya';
        p.scene = 2;
      }
      if (i === 6) {
        // The third doorway, ice blue: the deep sea.
        p.color = 0x6fe3ff;
        p.world = 'sea';
        p.scene = 3;
      }
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

export interface Tree {
  x: number;
  z: number;
  /** Trunk height. */
  h: number;
  /** Canopy radius. */
  r: number;
  /** Height of the ground at the foot of the tree. */
  base: number;
  /** The masses of leaves that make up the crown: one on top, three around. */
  clumps: { x: number; y: number; z: number; size: number }[];
}

function makeTrees(): Tree[] {
  const rand = mulberry32(21);
  const trees: Tree[] = [];
  const half = GROUND_SIZE / 2 - 6;
  let tries = 0;
  while (trees.length < 820 && tries++ < 30000) {
    const x = (rand() * 2 - 1) * half;
    const z = (rand() * 2 - 1) * half;
    if (poolAt(x, z, 7)) continue;
    if (fbm(x * 0.03 + 9, z * 0.03 + 9, 2) < 0.4) continue; // glades
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 3)) continue;
    trees.push({ x, z, h: 7 + rand() * 7, r: 2.4 + rand() * 1.8, base: groundHeight(x, z) - 0.25, clumps: [] });
  }
  const shape = mulberry32(22);
  for (const t of trees) {
    for (let c = 0; c < 4; c++) {
      const top = c === 0;
      const a = (c / 3) * 6.28 + shape();
      const spread = top ? 0 : t.r * 0.75;
      t.clumps.push({
        x: t.x + Math.cos(a) * spread,
        y: t.base + t.h + (top ? t.r * 0.35 : -t.r * 0.15 + shape() * t.r * 0.35),
        z: t.z + Math.sin(a) * spread,
        size: t.r * (top ? 1 : 0.62 + shape() * 0.2),
      });
    }
  }
  return trees;
}

export const trees: Tree[] = makeTrees();
