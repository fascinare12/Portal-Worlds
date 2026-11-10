/**
 * The five things that can be built, each with its own set of blocks and a
 * blueprint to follow for children who want one.
 */

export type ModeId = 'pyramid' | 'castle' | 'treefort' | 'rocket' | 'town';

export interface BlockType {
  color: number;
  /** Indoor blocks furnish the inside; outdoor blocks make the shell. */
  indoor?: boolean;
  /** Colour it glows, for lamps, torches and engines. */
  glow?: number;
  /** Cannot be ordered: only won from the sphinx. */
  special?: boolean;
}

export interface Cell {
  x: number;
  y: number;
  z: number;
  /** Index into the mode's blocks. */
  t: number;
}

export interface Mode {
  id: ModeId;
  /** A small drawing for the mode's tile, as the inside of an SVG with a 0..40 box. */
  icon: string;
  blocks: BlockType[];
  blueprint(): Cell[];
}

/** The building plot is a square this many blocks wide, and this many high. */
export const PLOT = 31;
export const HEIGHT = 12;
const MID = Math.floor(PLOT / 2);

const GOLD: BlockType = { color: 0xf2c84b, special: true };
const GLASS: BlockType = { color: 0x9fe0f5, glow: 0x2a6a80, special: true };

const pyramid: Mode = {
  id: 'pyramid',
  icon: '<path d="M20 5 37 34H3Z" fill="#e2bd76"/><path d="M20 5 37 34H20Z" fill="#c79b55"/>',
  blocks: [
    { color: 0xdcb878 }, // sandstone
    { color: 0xf1e6cc }, // limestone casing
    { color: 0x8a6f58 }, // granite
    { color: 0x2f9a9a, indoor: true }, // painted wall
    { color: 0xffb347, glow: 0xff7a1a, indoor: true }, // torch
    GOLD,
    { color: 0x3a66c9, special: true }, // lapis
  ],
  blueprint() {
    const cells: Cell[] = [];
    for (let y = 0; y < 5; y++) {
      const half = 4 - y;
      for (let x = MID - half; x <= MID + half; x++) {
        for (let z = MID - half; z <= MID + half; z++) {
          const edge = x === MID - half || x === MID + half || z === MID - half || z === MID + half;
          cells.push({ x, y, z, t: y === 4 ? 1 : edge ? 0 : 2 });
        }
      }
    }
    return cells;
  },
};

const castle: Mode = {
  id: 'castle',
  icon: '<path d="M5 34V12h5v4h4v-4h5v4h3v-4h5v4h4v-4h5v22Z" fill="#9aa3ad"/><path d="M17 34V24a3 3 0 0 1 6 0v10Z" fill="#5d4a3e"/>',
  blocks: [
    { color: 0xa7adb5 }, // stone
    { color: 0x767d88 }, // dark stone
    { color: 0x7a5a3c }, // timber
    { color: 0xb83a3a, indoor: true }, // carpet
    { color: 0xffc766, glow: 0xff8c1a, indoor: true }, // torch
    GOLD,
    GLASS,
  ],
  blueprint() {
    const cells: Cell[] = [];
    const lo = MID - 4;
    const hi = MID + 4;
    for (let x = lo; x <= hi; x++) {
      for (let z = lo; z <= hi; z++) {
        const wall = x === lo || x === hi || z === lo || z === hi;
        const corner = (x === lo || x === hi) && (z === lo || z === hi);
        if (!wall) continue;
        const gate = z === hi && Math.abs(x - MID) <= 0;
        const top = corner ? 5 : 3;
        for (let y = 0; y < top; y++) {
          if (gate && y < 2) continue;
          cells.push({ x, y, z, t: corner ? 1 : 0 });
        }
        // Battlements: every other block along the top of the wall.
        if (!corner && (x + z) % 2 === 0) cells.push({ x, y: 3, z, t: 1 });
      }
    }
    return cells;
  },
};

const treefort: Mode = {
  id: 'treefort',
  icon: '<rect x="17" y="18" width="6" height="17" fill="#7a5a3c"/><circle cx="20" cy="13" r="11" fill="#4f9a55"/><rect x="9" y="20" width="22" height="4" fill="#b98a55"/>',
  blocks: [
    { color: 0xc49a62 }, // planks
    { color: 0x6b4a34 }, // bark
    { color: 0x4f9a55 }, // leaves
    { color: 0xe6c85a, indoor: true }, // rug
    { color: 0xffe08a, glow: 0xffb030, indoor: true }, // lantern
    GOLD,
    { color: 0xd94f4f, special: true }, // flag
  ],
  blueprint() {
    const cells: Cell[] = [];
    for (let y = 0; y < 5; y++) for (let x = MID; x <= MID + 1; x++) for (let z = MID; z <= MID + 1; z++) cells.push({ x, y, z, t: 1 });
    for (let x = MID - 3; x <= MID + 4; x++) {
      for (let z = MID - 3; z <= MID + 4; z++) {
        cells.push({ x, y: 5, z, t: 0 });
        const edge = x === MID - 3 || x === MID + 4 || z === MID - 3 || z === MID + 4;
        if (edge && (x + z) % 2 === 0) cells.push({ x, y: 6, z, t: 0 });
      }
    }
    for (let x = MID - 2; x <= MID + 3; x++) for (let z = MID - 2; z <= MID + 3; z++) cells.push({ x, y: 9, z, t: 2 });
    for (let y = 6; y < 9; y++) for (let x = MID; x <= MID + 1; x++) for (let z = MID; z <= MID + 1; z++) cells.push({ x, y, z, t: 1 });
    return cells;
  },
};

const rocket: Mode = {
  id: 'rocket',
  icon: '<path d="M20 3c7 7 8 17 6 26H14C12 20 13 10 20 3Z" fill="#eef1f5"/><circle cx="20" cy="15" r="3.5" fill="#6fd0ee"/><path d="M14 24 7 34h8Zm12 0 7 10h-8Z" fill="#d94f4f"/><path d="M16 29h8l-4 9Z" fill="#ffa53a"/>',
  blocks: [
    { color: 0xeef1f5 }, // hull
    { color: 0xd94f4f }, // fins and nose
    { color: 0x8f98a6 }, // metal
    { color: 0x4a78d9, indoor: true }, // seat
    { color: 0x6ff0e0, glow: 0x1fb0a0, indoor: true }, // control panel
    { color: 0xffa53a, glow: 0xff5a10, special: true }, // flame
    GLASS,
  ],
  blueprint() {
    const cells: Cell[] = [];
    const ring = (y: number, r: number, t: number) => {
      for (let x = MID - r; x <= MID + r; x++) {
        for (let z = MID - r; z <= MID + r; z++) {
          const corner = Math.abs(x - MID) === r && Math.abs(z - MID) === r && r > 1;
          const shell = Math.abs(x - MID) === r || Math.abs(z - MID) === r;
          if (shell && !corner) cells.push({ x, y, z, t });
        }
      }
    };
    for (let y = 1; y < 8; y++) ring(y, 2, y === 1 ? 2 : 0);
    ring(8, 1, 1);
    cells.push({ x: MID, y: 9, z: MID, t: 1 });
    // Four fins the rocket stands on.
    for (const [dx, dz] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) {
      for (let y = 0; y < 3; y++) cells.push({ x: MID + dx, y, z: MID + dz, t: 1 });
    }
    return cells;
  },
};

const town: Mode = {
  id: 'town',
  icon: '<path d="M3 34V20l8-7 8 7v14Z" fill="#c9694f"/><path d="M21 34V16l8-7 8 7v18Z" fill="#f1e2c2"/><path d="M1 21 11 12l10 9M19 17 29 8l10 9" fill="none" stroke="#a84f3a" stroke-width="2.5"/>',
  blocks: [
    { color: 0xc9694f }, // brick
    { color: 0xf1e2c2 }, // plaster
    { color: 0xa84f3a }, // roof tile
    { color: 0xb98a55, indoor: true }, // floorboards
    { color: 0xfff0a8, glow: 0xffc040, indoor: true }, // lamp
    GOLD,
    GLASS,
  ],
  blueprint() {
    const cells: Cell[] = [];
    const house = (x0: number, z0: number, w: number, wall: number) => {
      for (let x = x0; x < x0 + w; x++) {
        for (let z = z0; z < z0 + w; z++) {
          const edge = x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + w - 1;
          const door = z === z0 + w - 1 && x === x0 + 1;
          if (edge) for (let y = 0; y < 3; y++) if (!(door && y < 2)) cells.push({ x, y, z, t: wall });
        }
      }
      // A stepped roof.
      for (let step = 0; step * 2 < w; step++) {
        for (let x = x0 + step; x < x0 + w - step; x++) {
          for (let z = z0 + step; z < z0 + w - step; z++) cells.push({ x, y: 3 + step, z, t: 2 });
        }
      }
    };
    const o = MID - 7; // the three houses sit together in the middle of the plot
    house(o + 1, o + 1, 5, 0);
    house(o + 9, o + 2, 4, 1);
    house(o + 5, o + 9, 5, 1);
    return cells;
  },
};

export const MODES: Mode[] = [pyramid, castle, treefort, rocket, town];
