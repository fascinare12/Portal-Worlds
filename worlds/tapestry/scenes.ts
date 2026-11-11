import { Stitcher } from './stitch';
import type { Pt, Wool } from './stitch';

/**
 * The pictures. Each scene is drawn in a space 1000 wide and 520 high (a
 * panel told twice gives each telling half of that), with the ground at
 * GROUND. They follow the manner of the real cloth: everyone in profile, long
 * legs and small heads; Englishmen with moustaches and long hair, Normans
 * with the backs of their heads shaved; horses whose far legs are a different
 * colour from their near ones; trees of knotted branches between scenes.
 */

export const GROUND = 452;

interface Man {
  /** Facing right (1) or left (-1). */
  f?: number;
  tunic?: Wool;
  hose?: Wool;
  cloak?: Wool;
  hair?: Wool;
  english?: boolean;
  crown?: boolean;
  helmet?: boolean;
  mail?: boolean;
  /** A churchman: a long robe, and a shaved crown. */
  priest?: boolean;
  /** A woman: a long gown and a veil. */
  lady?: boolean;
  seated?: boolean;
  riding?: boolean;
  arm?: 'point' | 'down' | 'up' | 'forward' | 'oath' | 'face';
  hold?: 'spear' | 'sword' | 'axe' | 'bow' | 'staff' | 'sceptre' | 'banner' | 'needle';
  shield?: Wool;
  /** Lying down, turned by this much (in quarter turns: 1 is flat on the back). */
  tilt?: number;
}

function man(K: Stitcher, x: number, gy: number, h: number, o: Man = {}): void {
  const g = K.g;
  const f = o.f ?? 1;
  const tunic = o.tunic ?? 'terracotta';
  g.save();
  if (o.tilt) {
    g.translate(x, gy);
    g.rotate(-f * o.tilt * Math.PI * 0.5);
    g.translate(-x, -gy);
  }
  const sit = o.seated ? 0.14 : 0;
  const hipY = gy - h * (0.46 - sit);
  const long = o.priest || o.lady || o.crown;
  const sx = x + f * h * 0.02;
  const sy = hipY - h * 0.32;
  const hx = x + f * h * 0.045;
  const hy = sy - h * 0.1;
  const at = (dx: number, dy: number): Pt => [x + f * dx * h, gy - dy * h];

  // A cloak hangs behind everything else.
  if (o.cloak) K.shape([[sx - f * h * 0.07, sy], [sx + f * h * 0.05, sy - h * 0.02], [x - f * h * 0.02, hipY + h * 0.12], [x - f * h * 0.17, hipY + h * 0.2], [x - f * h * 0.14, hipY - h * 0.1]], o.cloak);

  // Legs: long and thin, in coloured hose, with pointed shoes.
  if (!o.riding) {
    for (const leg of [-1, 1]) {
      const foot = o.seated ? at(0.2 + leg * 0.03, 0) : at(leg * 0.11 + 0.01, 0);
      const knee = o.seated ? at(0.2 + leg * 0.03, 0.3) : at(leg * 0.06 + 0.02, 0.24);
      K.line([[x, hipY], knee, foot], leg < 0 ? (o.hose ?? 'navy') : (o.hose ?? 'navy'), h * 0.05);
      K.shape([[foot[0] - f * h * 0.02, foot[1] - h * 0.02], [foot[0] + f * h * 0.07, foot[1] - h * 0.004], [foot[0] - f * h * 0.02, foot[1] + h * 0.012]], 'dark', null, false);
    }
  } else {
    const foot = at(0.07, 0.1);
    K.line([[x, hipY], at(0.05, 0.28), foot], o.hose ?? 'navy', h * 0.05);
    K.shape([[foot[0] - f * h * 0.02, foot[1] - h * 0.02], [foot[0] + f * h * 0.07, foot[1]], [foot[0] - f * h * 0.02, foot[1] + h * 0.012]], 'dark', null, false);
  }

  // The body: a belted tunic to the knee; a robe to the ankle for kings, priests and ladies.
  const hem = long ? (o.seated ? 0.1 : 0.05) : 0.27 - sit * 0.6;
  K.shape(
    [
      [sx - f * h * 0.085, sy + h * 0.01],
      [sx + f * h * 0.085, sy + h * 0.01],
      [x + f * h * 0.075, hipY - h * 0.06],
      [x + f * h * (o.seated ? 0.24 : 0.13), gy - h * hem],
      [x - f * h * 0.13, gy - h * hem],
      [x - f * h * 0.07, hipY - h * 0.06],
    ],
    o.mail ? 'teal' : tunic,
    'dark',
    false,
  );
  if (o.mail) {
    // Mail, shown as it is on the cloth: rows of little rings.
    for (let row = 0; row < 5; row++) for (let k = -1; k <= 1; k++) K.oval(x + k * h * 0.055 + (row % 2) * h * 0.02, sy + h * 0.07 + row * h * 0.075, h * 0.018, h * 0.018, null, 'buff');
  } else {
    K.line([[x - f * h * 0.075, hipY - h * 0.05], [x + f * h * 0.08, hipY - h * 0.05]], 'ochre', h * 0.022);
  }

  // Arms.
  const reach: Record<NonNullable<Man['arm']>, [number, number]> = { point: [0.3, 0.86], forward: [0.25, 0.64], down: [0.07, 0.5], up: [0.13, 1.04], oath: [0.28, 0.62], face: [0.1, 0.9] };
  const [rx, ry] = reach[o.arm ?? 'down'];
  const hand = at(rx, ry - sit);
  const sleeve = o.mail ? 'teal' : tunic;
  K.line([[sx, sy + h * 0.02], [(sx + hand[0]) / 2 - f * h * 0.02, (sy + hand[1]) / 2 + h * 0.03], hand], sleeve, h * 0.045);
  K.oval(hand[0], hand[1], h * 0.022, h * 0.022, 'buff');
  if (o.arm === 'oath') {
    const other = at(-0.26, 0.6);
    K.line([[sx, sy + h * 0.02], [(sx + other[0]) / 2, (sy + other[1]) / 2 + h * 0.03], other], sleeve, h * 0.045);
    K.oval(other[0], other[1], h * 0.022, h * 0.022, 'buff');
  }

  // What is carried.
  if (o.hold === 'spear' || o.hold === 'banner') {
    const top: Pt = [hand[0] + f * h * 0.03, gy - h * 1.3];
    K.line([[hand[0] - f * h * 0.03, gy - h * 0.02], top], 'dark', 2);
    K.shape([[top[0], top[1] - h * 0.07], [top[0] + h * 0.02, top[1]], [top[0] - h * 0.02, top[1]]], 'navy', null, false);
    if (o.hold === 'banner') K.shape([[top[0], top[1] + h * 0.02], [top[0] - f * h * 0.2, top[1] + h * 0.04], [top[0] - f * h * 0.12, top[1] + h * 0.09], [top[0] - f * h * 0.2, top[1] + h * 0.14], [top[0], top[1] + h * 0.14]], 'terracotta', 'dark', false);
  } else if (o.hold === 'sword') {
    K.line([hand, [hand[0] + f * h * 0.08, hand[1] - h * 0.36]], 'navy', 3.4);
    K.line([[hand[0] - h * 0.035, hand[1] - h * 0.02], [hand[0] + h * 0.045, hand[1] - h * 0.03]], 'ochre', 3);
  } else if (o.hold === 'axe') {
    // The long-handled axe of the English household troops: a broad curved blade on one side of the haft.
    const top: Pt = [hand[0] + f * h * 0.03, hand[1] - h * 0.3];
    K.line([[hand[0] - f * h * 0.03, hand[1] + h * 0.26], top], 'rust', 2.8);
    K.shape([[top[0], top[1] - h * 0.01], [top[0] + f * h * 0.1, top[1] - h * 0.05], [top[0] + f * h * 0.115, top[1] + h * 0.08], [top[0], top[1] + h * 0.07]], 'navy', 'dark', false);
  } else if (o.hold === 'bow') {
    K.line([[hand[0], hand[1] - h * 0.2], [hand[0] + f * h * 0.1, hand[1]], [hand[0], hand[1] + h * 0.2]], 'rust', 2.6);
    K.line([[hand[0], hand[1] - h * 0.2], [hand[0], hand[1] + h * 0.2]], 'dark', 1);
    K.line([[hand[0] - f * h * 0.08, hand[1]], [hand[0] + f * h * 0.2, hand[1]]], 'dark', 1.4);
  } else if (o.hold === 'staff') {
    K.line([[hand[0], gy], [hand[0] + f * h * 0.02, gy - h * 1.02]], 'rust', 3.2);
    K.oval(hand[0] + f * h * 0.02, gy - h * 1.05, h * 0.035, h * 0.045, 'ochre');
  } else if (o.hold === 'sceptre') {
    K.line([hand, [hand[0] + f * h * 0.03, hand[1] - h * 0.3]], 'ochre', 2.6);
    K.oval(hand[0] + f * h * 0.03, hand[1] - h * 0.33, h * 0.03, h * 0.03, 'ochre');
  } else if (o.hold === 'needle') {
    K.line([hand, [hand[0] + f * h * 0.1, hand[1] + h * 0.1]], 'dark', 1.2);
  }
  if (o.shield) {
    // A long kite-shaped shield, held in front.
    const cx = x + f * h * 0.14;
    const cy = gy - h * 0.5;
    K.shape([[cx - h * 0.09, cy - h * 0.22], [cx + h * 0.09, cy - h * 0.22], [cx + h * 0.1, cy - h * 0.06], [cx, cy + h * 0.26], [cx - h * 0.1, cy - h * 0.06]], o.shield, 'dark');
    K.oval(cx, cy - h * 0.1, h * 0.022, h * 0.022, 'ochre');
  }

  // The head, in profile.
  if (o.mail) K.shape([[hx - h * 0.075, hy - h * 0.02], [hx + f * h * 0.03, hy - h * 0.08], [hx + f * h * 0.05, hy + h * 0.09], [hx - f * h * 0.09, hy + h * 0.1]], 'teal');
  K.oval(hx, hy, h * 0.058, h * 0.068, 'buff');
  K.line([[hx + f * h * 0.05, hy - h * 0.01], [hx + f * h * 0.078, hy + h * 0.02], [hx + f * h * 0.05, hy + h * 0.028]], 'dark', 1.3, false); // the nose
  K.oval(hx + f * h * 0.022, hy - h * 0.012, h * 0.008, h * 0.008, 'dark', null); // the eye
  if (o.lady) {
    K.shape([[hx + f * h * 0.03, hy - h * 0.085], [hx - f * h * 0.08, hy - h * 0.06], [hx - f * h * 0.1, hy + h * 0.16], [hx - f * h * 0.02, hy + h * 0.1], [hx - f * h * 0.03, hy - h * 0.02]], 'buff');
  } else if (o.priest) {
    K.line([[hx - f * h * 0.055, hy - h * 0.02], [hx - f * h * 0.03, hy - h * 0.06], [hx + f * h * 0.04, hy - h * 0.055]], o.hair ?? 'rust', 3); // a ring of hair round a shaved crown
  } else if (!o.helmet) {
    const hair = o.hair ?? (o.english ? 'ochre' : 'rust');
    // English hair is worn long over the neck; Normans shave the back of the head.
    if (o.english) K.shape([[hx + f * h * 0.04, hy - h * 0.06], [hx - f * h * 0.03, hy - h * 0.085], [hx - f * h * 0.08, hy - h * 0.02], [hx - f * h * 0.075, hy + h * 0.07], [hx - f * h * 0.04, hy + h * 0.02], [hx - f * h * 0.01, hy - h * 0.035]], hair, 'dark');
    else K.shape([[hx + f * h * 0.045, hy - h * 0.055], [hx, hy - h * 0.085], [hx - f * h * 0.045, hy - h * 0.06], [hx - f * h * 0.01, hy - h * 0.04]], hair, 'dark');
    if (o.english) K.line([[hx + f * h * 0.035, hy + h * 0.036], [hx + f * h * 0.075, hy + h * 0.05]], hair, 1.8); // the moustache
  }
  if (o.helmet) {
    K.shape([[hx - h * 0.065, hy - h * 0.02], [hx, hy - h * 0.15], [hx + h * 0.065, hy - h * 0.02]], 'ochre', 'dark', false);
    K.line([[hx + f * h * 0.045, hy - h * 0.03], [hx + f * h * 0.06, hy + h * 0.04]], 'dark', 2.2); // the nose guard
  }
  if (o.crown) {
    const c: Pt[] = [];
    for (let i = 0; i <= 6; i++) c.push([hx - h * 0.065 + (i / 6) * h * 0.13, hy - h * (0.07 + (i % 2 ? 0.07 : 0.02))]);
    K.shape([...c, [hx + h * 0.065, hy - h * 0.055], [hx - h * 0.065, hy - h * 0.055]], 'ochre', 'dark', false);
  }
  g.restore();
}

/** A horse, with its far legs in a different wool from its near ones, as on the cloth. */
function horse(K: Stitcher, x: number, gy: number, h: number, colour: Wool, f: number, rider?: Man, gallop = false): void {
  const far: Wool = colour === 'terracotta' ? 'teal' : colour === 'navy' ? 'ochre' : 'terracotta';
  const L = h * 1.45;
  const at = (dx: number, dy: number): Pt => [x + f * dx * L, gy - dy * h];
  const leg = (hx: number, sweep: number, ink: Wool) => {
    const top = at(hx, 0.44);
    const foot = at(hx + sweep, 0.02);
    K.line([top, at(hx + sweep * 0.3 + (gallop ? 0.02 : 0), 0.24), foot], ink, h * 0.075);
    K.shape([[foot[0] - h * 0.035, foot[1] + h * 0.02], [foot[0] - h * 0.03, foot[1] - h * 0.03], [foot[0] + h * 0.035, foot[1] - h * 0.03], [foot[0] + h * 0.04, foot[1] + h * 0.02]], 'dark', null, false);
  };
  const stride = gallop ? 0.16 : 0.03;
  leg(0.25, stride * 1.3, far);
  leg(-0.3, -stride * 1.2, far);
  // Tail.
  K.shape([at(-0.38, 0.62), at(-0.52, 0.5), at(-0.5, 0.22), at(-0.44, 0.3), at(-0.42, 0.52)], 'dark');
  // Body, neck and head.
  K.shape(
    [at(-0.4, 0.6), at(-0.3, 0.7), at(0.0, 0.66), at(0.2, 0.7), at(0.3, 0.92), at(0.4, 1.08), at(0.46, 1.1), at(0.47, 1.0), at(0.6, 0.86), at(0.62, 0.76), at(0.56, 0.74), at(0.46, 0.84), at(0.4, 0.74), at(0.36, 0.5), at(0.2, 0.36), at(-0.2, 0.36), at(-0.38, 0.44)],
    colour,
  );
  for (let i = 0; i < 6; i++) K.line([at(0.26 + i * 0.03, 0.9 + i * 0.035), at(0.21 + i * 0.03, 0.86 + i * 0.03)], 'dark', 1.6); // the mane
  K.oval(at(0.5, 0.94)[0], at(0.5, 0.94)[1], h * 0.012, h * 0.012, 'dark', null);
  K.line([at(0.44, 0.9), at(0.6, 0.8)], 'dark', 1.2); // the bridle
  leg(0.19, stride * 1.6 + 0.02, colour);
  leg(-0.24, -stride * 1.5 - 0.02, colour);
  if (rider) {
    K.shape([at(-0.14, 0.72), at(0.1, 0.72), at(0.08, 0.6), at(-0.12, 0.6)], 'ochre'); // the saddle
    man(K, x - f * L * 0.02, gy - h * 0.24, h * 1.02, { ...rider, f, riding: true });
  }
}

/** A long ship: striped sail, a beast's head at the prow, shields along the rail. */
function ship(K: Stitcher, x: number, wy: number, w: number, f: number, sail: Wool[], crew: number, horses = 0): void {
  const at = (dx: number, dy: number): Pt => [x + f * dx * w, wy - dy * w];
  // Mast and sail.
  K.line([at(0, 0.02), at(0, 0.5)], 'rust', 3.4);
  const stripes = 6;
  for (let i = 0; i < stripes; i++) {
    const a = -0.26 + (i / stripes) * 0.52;
    const b = a + 0.52 / stripes;
    K.shape([at(a, 0.47), at(b, 0.47), at(b + 0.02, 0.16), at(a + 0.02, 0.16)], sail[i % sail.length], 'dark', false);
  }
  // Crew, and horses if she is carrying them.
  for (let i = 0; i < crew; i++) {
    const cx = -0.34 + ((i + 0.5) / crew) * 0.68;
    K.oval(at(cx, 0.1)[0], at(cx, 0.1)[1], w * 0.02, w * 0.024, 'buff');
    K.line([at(cx - 0.016, 0.115), at(cx, 0.128), at(cx + 0.016, 0.115)], i % 2 ? 'rust' : 'ochre', 2.4);
  }
  for (let i = 0; i < horses; i++) {
    const cx = -0.2 + i * 0.13;
    K.shape([at(cx, 0.05), at(cx + 0.01, 0.15), at(cx + 0.05, 0.17), at(cx + 0.085, 0.11), at(cx + 0.07, 0.09), at(cx + 0.045, 0.11), at(cx + 0.04, 0.05)], i % 2 ? 'navy' : 'terracotta');
  }
  // The hull, in planks of alternating wool, rising to a carved head at each end.
  const sheer = (t: number) => 0.07 + 0.11 * Math.pow(Math.abs(t) / 0.5, 2.4);
  const keel = (t: number) => -0.06 + 0.13 * Math.pow(Math.abs(t) / 0.5, 2);
  const planks: Wool[] = ['terracotta', 'ochre', 'teal'];
  for (let s = 0; s < 3; s++) {
    const top: Pt[] = [];
    const bottom: Pt[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = -0.5 + i / 12;
      const a = sheer(t) + (keel(t) - sheer(t)) * (s / 3);
      const b = sheer(t) + (keel(t) - sheer(t)) * ((s + 1) / 3);
      top.push(at(t, a));
      bottom.push(at(t, b));
    }
    K.shape([...top, ...bottom.reverse()], planks[s], 'dark');
  }
  K.shape([at(0.5, 0.18), at(0.52, 0.3), at(0.58, 0.32), at(0.6, 0.27), at(0.56, 0.26), at(0.55, 0.2)], 'ochre');
  K.line([at(-0.5, 0.18), at(-0.53, 0.3), at(-0.5, 0.33)], 'ochre', 4);
  for (let i = 0; i < 7; i++) K.oval(at(-0.33 + i * 0.11, 0.045)[0], at(-0.33 + i * 0.11, 0.045)[1], w * 0.026, w * 0.026, (['navy', 'terracotta', 'sage'] as Wool[])[i % 3]);
}

function waves(K: Stitcher, x0: number, x1: number, y: number, rows = 3): void {
  for (let r = 0; r < rows; r++) {
    const pts: Pt[] = [];
    for (let x = x0; x <= x1; x += 14) pts.push([x, y + r * 13 + Math.sin(x * 0.09 + r * 2) * 4.5]);
    K.line(pts, r % 2 ? 'navy' : 'teal', 2.2);
  }
}

/** One of the cloth's trees: a leaning trunk whose branches knot through one another and end in lobed leaves. */
function tree(K: Stitcher, x: number, gy: number, h: number, lean = 1): void {
  K.shape([[x - 9, gy], [x - 5 + lean * h * 0.05, gy - h * 0.45], [x + lean * h * 0.1, gy - h * 0.7], [x + 8 + lean * h * 0.1, gy - h * 0.7], [x + 6 + lean * h * 0.03, gy - h * 0.4], [x + 10, gy]], 'rust');
  const tips: [number, number, Wool][] = [[-0.34, 0.86, 'sage'], [0.3, 0.98, 'teal'], [-0.1, 1.1, 'ochre'], [0.42, 0.7, 'sage'], [-0.4, 0.58, 'teal']];
  for (const [dx, dy, ink] of tips) {
    const tx = x + lean * h * 0.1 + dx * h;
    const ty = gy - dy * h;
    K.line([[x + lean * h * 0.09, gy - h * 0.62], [x + lean * h * 0.1 - dx * h * 0.5, gy - h * (0.62 + (dy - 0.62) * 0.6)], [tx, ty]], 'rust', 3);
    for (const a of [-0.9, 0, 0.9]) K.oval(tx + Math.sin(a) * h * 0.06, ty - Math.cos(a) * h * 0.05, h * 0.045, h * 0.07, ink, 'dark', a);
  }
}

function ground(K: Stitcher, x0: number, x1: number, gy = GROUND): void {
  const pts: Pt[] = [];
  for (let x = x0; x <= x1; x += 22) pts.push([x, gy + 4 + Math.sin(x * 0.045) * 3.5]);
  K.line(pts, 'sage', 2.6);
}

/** A hall: a tiled roof on round arches. `inside` leaves it open to show who is within. */
function hall(K: Stitcher, x: number, gy: number, w: number, h: number, roof: Wool = 'terracotta'): void {
  K.shape([[x - w / 2 - 12, gy - h * 0.72], [x - w / 2 + 16, gy - h], [x + w / 2 - 16, gy - h], [x + w / 2 + 12, gy - h * 0.72]], roof, 'dark', false);
  for (let r = 0; r < 3; r++) for (let i = 0; i < Math.floor(w / 26); i++) K.line([[x - w / 2 + 12 + i * 26 + (r % 2) * 13, gy - h * (0.96 - r * 0.08)], [x - w / 2 + 25 + i * 26 + (r % 2) * 13, gy - h * (0.9 - r * 0.08)], [x - w / 2 + 38 + i * 26 + (r % 2) * 13, gy - h * (0.96 - r * 0.08)]], 'dark', 1.2);
  for (const side of [-1, 1]) {
    K.shape([[x + side * (w / 2 - 6) - 8, gy], [x + side * (w / 2 - 6) - 8, gy - h * 0.72], [x + side * (w / 2 - 6) + 8, gy - h * 0.72], [x + side * (w / 2 - 6) + 8, gy]], 'ochre', 'dark', false);
    K.shape([[x + side * (w / 2 - 6) - 13, gy - h * 0.72], [x + side * (w / 2 - 6) + 13, gy - h * 0.72], [x + side * (w / 2 - 6) + 9, gy - h * 0.66], [x + side * (w / 2 - 6) - 9, gy - h * 0.66]], 'teal', 'dark', false);
  }
}

/** A church with a tower, for the abbey at Westminster. */
function church(K: Stitcher, x: number, gy: number, w: number, h: number): void {
  K.shape([[x - w / 2, gy], [x - w / 2, gy - h * 0.55], [x + w / 2, gy - h * 0.55], [x + w / 2, gy]], 'buff', 'dark', false);
  for (let i = 0; i < 4; i++) {
    const ax = x - w / 2 + 14 + i * ((w - 28) / 3.5);
    K.shape([[ax, gy], [ax, gy - h * 0.3], [ax + w * 0.07, gy - h * 0.4], [ax + w * 0.14, gy - h * 0.3], [ax + w * 0.14, gy]], 'navy', 'dark');
  }
  K.shape([[x - w / 2 - 8, gy - h * 0.55], [x - w / 2 + 10, gy - h * 0.72], [x + w / 2 - 10, gy - h * 0.72], [x + w / 2 + 8, gy - h * 0.55]], 'teal', 'dark', false);
  K.shape([[x - w * 0.12, gy - h * 0.72], [x - w * 0.12, gy - h * 0.92], [x + w * 0.12, gy - h * 0.92], [x + w * 0.12, gy - h * 0.72]], 'ochre', 'dark', false);
  K.shape([[x - w * 0.15, gy - h * 0.92], [x, gy - h * 1.06], [x + w * 0.15, gy - h * 0.92]], 'terracotta', 'dark', false);
  K.line([[x, gy - h * 1.06], [x, gy - h * 1.16]], 'dark', 2);
  K.line([[x - 7, gy - h * 1.12], [x + 7, gy - h * 1.12]], 'dark', 2);
}

function throne(K: Stitcher, x: number, gy: number, h: number, f: number): void {
  K.shape([[x - f * h * 0.16, gy], [x - f * h * 0.16, gy - h * 0.62], [x - f * h * 0.08, gy - h * 0.66], [x - f * h * 0.06, gy - h * 0.32], [x + f * h * 0.16, gy - h * 0.32], [x + f * h * 0.16, gy]], 'ochre', 'dark', false);
  K.shape([[x - f * h * 0.07, gy - h * 0.32], [x + f * h * 0.17, gy - h * 0.32], [x + f * h * 0.17, gy - h * 0.38], [x - f * h * 0.07, gy - h * 0.38]], 'terracotta');
  K.shape([[x - f * h * 0.2, gy], [x + f * h * 0.3, gy], [x + f * h * 0.3, gy - h * 0.05], [x - f * h * 0.2, gy - h * 0.05]], 'teal', 'dark', false);
}

/** A casket for the bones of saints: a little house on legs, with a cross. */
function relics(K: Stitcher, x: number, gy: number, s: number): void {
  for (const leg of [-1, 1]) K.line([[x + leg * s * 0.34, gy], [x + leg * s * 0.34, gy - s * 0.55]], 'rust', 3);
  K.shape([[x - s * 0.5, gy - s * 0.55], [x + s * 0.5, gy - s * 0.55], [x + s * 0.5, gy - s * 0.95], [x - s * 0.5, gy - s * 0.95]], 'ochre', 'dark', false);
  K.shape([[x - s * 0.56, gy - s * 0.95], [x, gy - s * 1.3], [x + s * 0.56, gy - s * 0.95]], 'terracotta', 'dark', false);
  K.line([[x, gy - s * 1.3], [x, gy - s * 1.52]], 'dark', 2);
  K.line([[x - s * 0.09, gy - s * 1.44], [x + s * 0.09, gy - s * 1.44]], 'dark', 2);
  for (let i = -1; i <= 1; i++) K.oval(x + i * s * 0.28, gy - s * 0.75, s * 0.08, s * 0.1, 'teal');
}

function hill(K: Stitcher, x0: number, x1: number, gy: number, h: number, ink: Wool = 'sage'): void {
  const pts: Pt[] = [[x0, gy + 6]];
  for (let i = 0; i <= 10; i++) pts.push([x0 + ((x1 - x0) * i) / 10, gy - Math.sin((i / 10) * Math.PI) * h]);
  pts.push([x1, gy + 6]);
  K.shape(pts, ink);
}

const ENGLISH: Man = { english: true };
const shields: Wool[] = ['terracotta', 'teal', 'ochre', 'navy', 'sage'];

/** Every scene, by the id of its panel; a panel told twice has one scene for each telling. */
export const SCENES: Record<string, ((K: Stitcher, x: number, w: number) => void)[]> = {
  edward: [
    (K, x) => {
      ground(K, x, x + 1000);
      hall(K, x + 430, GROUND, 520, 400);
      throne(K, x + 360, GROUND, 250, 1);
      man(K, x + 362, GROUND - 78, 250, { seated: true, crown: true, tunic: 'teal', cloak: 'terracotta', hair: 'buff', english: true, arm: 'point', hold: 'sceptre' });
      man(K, x + 560, GROUND, 250, { ...ENGLISH, f: -1, tunic: 'ochre', cloak: 'navy', arm: 'forward' });
      man(K, x + 640, GROUND, 240, { ...ENGLISH, f: -1, tunic: 'sage', arm: 'down' });
      tree(K, x + 880, GROUND, 250);
      tree(K, x + 90, GROUND, 220, -1);
    },
  ],
  oath: [
    (K, x) => {
      ground(K, x, x + 500);
      throne(K, x + 80, GROUND, 210, 1);
      man(K, x + 82, GROUND - 66, 215, { seated: true, tunic: 'navy', cloak: 'terracotta', arm: 'point', hold: 'sword' });
      relics(K, x + 210, GROUND, 96);
      relics(K, x + 370, GROUND - 30, 84);
      K.shape([[x + 320, GROUND], [x + 420, GROUND], [x + 420, GROUND - 30], [x + 320, GROUND - 30]], 'teal', 'dark', false);
      man(K, x + 290, GROUND, 232, { ...ENGLISH, tunic: 'ochre', cloak: 'sage', arm: 'oath' });
      man(K, x + 462, GROUND, 215, { f: -1, tunic: 'rust', arm: 'point' });
    },
    (K, x) => {
      ground(K, x, x + 500);
      relics(K, x + 250, GROUND, 90);
      man(K, x + 180, GROUND, 228, { ...ENGLISH, tunic: 'ochre', cloak: 'sage', arm: 'forward' });
      // He swears with armed men on every side.
      man(K, x + 60, GROUND, 232, { helmet: true, mail: true, hold: 'spear', shield: 'terracotta' });
      man(K, x + 350, GROUND, 236, { f: -1, tunic: 'navy', cloak: 'terracotta', arm: 'point', hold: 'sword' });
      man(K, x + 440, GROUND, 232, { f: -1, helmet: true, mail: true, hold: 'spear', shield: 'navy' });
      // Two kinsmen, held hostage, looking on from a window.
      K.shape([[x + 262, GROUND - 250], [x + 262, GROUND - 330], [x + 300, GROUND - 356], [x + 338, GROUND - 330], [x + 338, GROUND - 250]], 'navy', 'dark');
      K.oval(x + 286, GROUND - 290, 13, 15, 'buff');
      K.oval(x + 316, GROUND - 284, 12, 14, 'buff');
    },
  ],
  deathbed: [
    (K, x) => {
      ground(K, x, x + 1000);
      // The bed, under a hanging, with the king propped on pillows.
      K.shape([[x + 110, GROUND - 330], [x + 560, GROUND - 330], [x + 540, GROUND - 290], [x + 130, GROUND - 290]], 'terracotta', 'dark', false);
      for (const px of [130, 540]) K.line([[x + px, GROUND], [x + px, GROUND - 300]], 'rust', 5);
      K.shape([[x + 130, GROUND - 60], [x + 540, GROUND - 60], [x + 540, GROUND - 120], [x + 130, GROUND - 120]], 'ochre', 'dark', false);
      K.shape([[x + 140, GROUND - 120], [x + 250, GROUND - 190], [x + 280, GROUND - 120]], 'buff');
      // The king himself: head on the pillow, the coverlet over him, one arm stretched out to the man at his side.
      K.shape([[x + 250, GROUND - 60], [x + 540, GROUND - 60], [x + 540, GROUND - 150], [x + 290, GROUND - 156]], 'sage');
      K.shape([[x + 236, GROUND - 150], [x + 300, GROUND - 176], [x + 316, GROUND - 124], [x + 250, GROUND - 118]], 'teal');
      K.line([[x + 296, GROUND - 160], [x + 350, GROUND - 190], [x + 404, GROUND - 180]], 'teal', 11);
      K.oval(x + 408, GROUND - 180, 6, 6, 'buff');
      K.oval(x + 222, GROUND - 176, 17, 20, 'buff');
      K.line([[x + 236, GROUND - 172], [x + 244, GROUND - 164], [x + 236, GROUND - 162]], 'dark', 1.3, false);
      K.shape([[x + 204, GROUND - 190], [x + 208, GROUND - 212], [x + 216, GROUND - 198], [x + 223, GROUND - 216], [x + 230, GROUND - 198], [x + 238, GROUND - 212], [x + 240, GROUND - 190]], 'ochre', 'dark', false);
      man(K, x + 440, GROUND - 60, 215, { ...ENGLISH, f: -1, tunic: 'ochre', arm: 'forward' });
      man(K, x + 520, GROUND - 60, 200, { f: -1, lady: true, tunic: 'navy', arm: 'face' });
      man(K, x + 96, GROUND - 60, 205, { priest: true, tunic: 'rust', arm: 'forward' });
      church(K, x + 800, GROUND, 290, 330);
      tree(K, x + 620, GROUND, 200);
    },
  ],
  crown: [
    (K, x) => {
      ground(K, x, x + 1000);
      hall(K, x + 520, GROUND, 600, 410, 'teal');
      throne(K, x + 470, GROUND, 260, 1);
      man(K, x + 472, GROUND - 82, 258, { seated: true, crown: true, english: true, tunic: 'terracotta', cloak: 'navy', arm: 'forward', hold: 'sceptre' });
      K.oval(x + 432, GROUND - 205, 15, 15, 'ochre'); // the orb in his other hand
      man(K, x + 300, GROUND, 240, { ...ENGLISH, tunic: 'sage', arm: 'point', hold: 'axe' });
      man(K, x + 220, GROUND, 236, { ...ENGLISH, tunic: 'ochre', arm: 'up' });
      man(K, x + 660, GROUND, 250, { f: -1, priest: true, tunic: 'buff', cloak: 'rust', arm: 'forward' });
      for (let i = 0; i < 4; i++) man(K, x + 800 + i * 44, GROUND, 220 - i * 6, { ...ENGLISH, f: -1, tunic: shields[i], arm: 'point' });
    },
  ],
  comet: [
    (K, x) => {
      ground(K, x, x + 1000);
      // The star, with its long hair streaming.
      K.oval(x + 640, 96, 26, 26, 'ochre');
      for (let i = 0; i < 9; i++) K.line([[x + 640 + Math.cos(i * 0.7) * 30, 96 + Math.sin(i * 0.7) * 30], [x + 640 + Math.cos(i * 0.7) * 46, 96 + Math.sin(i * 0.7) * 46]], 'terracotta', 2.6);
      for (let i = 0; i < 6; i++) K.line([[x + 664, 84 + i * 5], [x + 760, 60 + i * 9], [x + 850, 70 + i * 13]], i % 2 ? 'ochre' : 'terracotta', 2.4);
      for (let i = 0; i < 5; i++) man(K, x + 150 + i * 62, GROUND, 232 - (i % 2) * 10, { ...ENGLISH, tunic: shields[i], arm: 'point' });
      hall(K, x + 800, GROUND, 300, 330);
      throne(K, x + 800, GROUND, 220, -1);
      man(K, x + 798, GROUND - 70, 222, { seated: true, f: -1, crown: true, english: true, tunic: 'terracotta', arm: 'forward' });
      man(K, x + 690, GROUND, 216, { ...ENGLISH, tunic: 'navy', arm: 'forward', hold: 'sword' });
    },
  ],
  claimants: [
    (K, x) => {
      ground(K, x, x + 1000);
      // Each stands under his own arch.
      for (let i = 0; i < 3; i++) {
        const cx = x + 180 + i * 320;
        for (const side of [-1, 1]) K.line([[cx + side * 120, GROUND], [cx + side * 120, GROUND - 300]], 'ochre', 9);
        K.line([[cx - 120, GROUND - 300], [cx - 84, GROUND - 386], [cx, GROUND - 420], [cx + 84, GROUND - 386], [cx + 120, GROUND - 300]], (['terracotta', 'navy', 'teal'] as Wool[])[i], 9);
      }
      man(K, x + 180, GROUND, 270, { ...ENGLISH, crown: true, tunic: 'terracotta', cloak: 'navy', arm: 'forward', hold: 'axe' });
      man(K, x + 500, GROUND, 270, { tunic: 'navy', cloak: 'terracotta', arm: 'point', hold: 'sword' });
      ship(K, x + 560, GROUND - 20, 110, 1, ['terracotta', 'ochre'], 0);
      // The King of Norway, a head taller than anyone, and Tostig at his shoulder.
      man(K, x + 800, GROUND, 318, { f: -1, helmet: true, mail: true, hair: 'ochre', arm: 'forward', hold: 'axe' });
      man(K, x + 890, GROUND, 240, { ...ENGLISH, f: -1, tunic: 'sage', arm: 'point' });
    },
  ],
  stamford: [
    (K, x) => {
      waves(K, x + 170, x + 400, GROUND - 4, 3);
      ground(K, x, x + 170);
      ground(K, x + 400, x + 500);
      // The bridge, and the one Northman who holds it.
      K.line([[x + 130, GROUND - 6], [x + 200, GROUND - 88], [x + 285, GROUND - 106], [x + 370, GROUND - 88], [x + 440, GROUND - 6]], 'rust', 9);
      for (const px of [215, 285, 355]) K.line([[x + px, GROUND + 26], [x + px, GROUND - 96]], 'rust', 5);
      man(K, x + 290, GROUND - 108, 196, { f: -1, helmet: true, tunic: 'terracotta', arm: 'up', hold: 'axe' });
      // Beneath it, an Englishman in a boat with a spear.
      K.shape([[x + 236, GROUND + 6], [x + 262, GROUND + 28], [x + 322, GROUND + 28], [x + 346, GROUND + 6]], 'ochre');
      K.oval(x + 290, GROUND - 12, 11, 13, 'buff');
      K.line([[x + 296, GROUND + 4], [x + 306, GROUND - 92]], 'dark', 2);
      // The English come on from the left.
      man(K, x + 40, GROUND, 214, { ...ENGLISH, helmet: true, mail: true, hold: 'banner', shield: 'navy' });
      man(K, x + 104, GROUND, 208, { ...ENGLISH, helmet: true, mail: true, arm: 'up', hold: 'axe', shield: 'terracotta' });
      // The Northmen break and run.
      man(K, x + 450, GROUND, 196, { tunic: 'sage', arm: 'up' });
    },
    (K, x) => {
      ground(K, x, x + 500);
      K.oval(x + 426, 92, 30, 30, 'ochre'); // a hot sun
      for (let i = 0; i < 10; i++) K.line([[x + 426 + Math.cos(i * 0.63) * 36, 92 + Math.sin(i * 0.63) * 36], [x + 426 + Math.cos(i * 0.63) * 52, 92 + Math.sin(i * 0.63) * 52]], 'terracotta', 2.4);
      // The lone rider.
      horse(K, x + 110, GROUND, 150, 'navy', 1, { ...ENGLISH, helmet: true, tunic: 'ochre', arm: 'point' });
      // The King of Norway and Tostig, with their mail left behind at the ships.
      man(K, x + 300, GROUND, 290, { f: -1, helmet: true, tunic: 'terracotta', hair: 'ochre', arm: 'forward', hold: 'axe' });
      man(K, x + 380, GROUND, 220, { ...ENGLISH, f: -1, tunic: 'sage', arm: 'point' });
      ship(K, x + 430, GROUND - 16, 120, -1, ['navy', 'ochre'], 0);
      // Seven feet of ground.
      K.shape([[x + 190, GROUND + 10], [x + 280, GROUND + 10], [x + 280, GROUND + 30], [x + 190, GROUND + 30]], 'rust', 'dark', false);
    },
  ],
  crossing: [
    (K, x) => {
      waves(K, x, x + 720, GROUND - 26, 4);
      ship(K, x + 190, GROUND - 46, 300, 1, ['terracotta', 'ochre', 'teal'], 6, 3);
      ship(K, x + 520, GROUND - 60, 250, 1, ['navy', 'ochre'], 5, 2);
      // The shore, the old fort at Pevensey, and the horses coming ashore.
      hill(K, x + 700, x + 1000, GROUND, 26, 'sage');
      K.shape([[x + 880, GROUND - 20], [x + 880, GROUND - 150], [x + 905, GROUND - 150], [x + 905, GROUND - 126], [x + 930, GROUND - 126], [x + 930, GROUND - 150], [x + 955, GROUND - 150], [x + 955, GROUND - 126], [x + 980, GROUND - 126], [x + 980, GROUND - 20]], 'buff', 'dark', false);
      horse(K, x + 790, GROUND - 16, 120, 'terracotta', 1);
      man(K, x + 730, GROUND - 14, 190, { tunic: 'navy', arm: 'forward' });
    },
  ],
  march: [
    (K, x) => {
      ground(K, x, x + 1000);
      // The gate of York behind them.
      K.shape([[x + 20, GROUND], [x + 20, GROUND - 260], [x + 130, GROUND - 260], [x + 130, GROUND]], 'buff', 'dark', false);
      K.shape([[x + 52, GROUND], [x + 52, GROUND - 120], [x + 75, GROUND - 150], [x + 98, GROUND - 120], [x + 98, GROUND]], 'navy', 'dark');
      for (let i = 0; i < 4; i++) K.shape([[x + 20 + i * 30, GROUND - 260], [x + 20 + i * 30, GROUND - 286], [x + 36 + i * 30, GROUND - 286], [x + 36 + i * 30, GROUND - 260]], 'buff', 'dark', false);
      // A long column on foot, heads down, with the king riding ahead.
      for (let i = 0; i < 8; i++) man(K, x + 190 + i * 62, GROUND, 208 - (i % 3) * 8, { ...ENGLISH, helmet: i % 2 === 0, mail: i % 3 === 0, tunic: shields[i % 5], hold: 'spear', shield: shields[(i + 2) % 5], arm: 'down' });
      horse(K, x + 780, GROUND, 150, 'terracotta', 1, { ...ENGLISH, crown: true, tunic: 'ochre', cloak: 'navy', arm: 'point' });
      tree(K, x + 930, GROUND, 230);
    },
  ],
  hastings: [
    (K, x) => {
      ground(K, x, x + 600);
      hill(K, x + 560, x + 1010, GROUND, 96, 'sage');
      // The shield wall on the ridge.
      for (let i = 0; i < 9; i++) {
        const mx = x + 640 + i * 40;
        const my = GROUND - Math.sin(((mx - x - 560) / 450) * Math.PI) * 96;
        man(K, mx, my, 196, { ...ENGLISH, f: -1, helmet: true, mail: true, hold: i % 3 === 1 ? 'axe' : 'spear', arm: i % 3 === 1 ? 'up' : 'down', shield: shields[i % 5] });
      }
      // The knights ride up at it; one turns in his saddle and tips back his helmet.
      horse(K, x + 150, GROUND, 150, 'navy', 1, { helmet: true, mail: true, arm: 'forward', hold: 'spear', shield: 'terracotta' }, true);
      horse(K, x + 400, GROUND, 156, 'terracotta', 1, { mail: true, arm: 'face', tunic: 'teal' }, true);
      man(K, x + 300, GROUND, 180, { tunic: 'sage', hold: 'bow', arm: 'forward' });
      man(K, x + 60, GROUND, 176, { tunic: 'ochre', hold: 'bow', arm: 'forward' });
      // The fallen.
      man(K, x + 520, GROUND + 12, 170, { ...ENGLISH, tilt: 1, mail: true });
    },
  ],
  harold: [
    (K, x) => {
      ground(K, x, x + 500);
      man(K, x + 70, GROUND, 190, { tunic: 'sage', hold: 'bow', arm: 'forward' });
      man(K, x + 150, GROUND, 186, { tunic: 'ochre', hold: 'bow', arm: 'forward' });
      // The king, his hand at the shaft in his face, under the dragon standard.
      man(K, x + 330, GROUND, 238, { ...ENGLISH, f: -1, helmet: true, mail: true, arm: 'face', shield: 'terracotta' });
      K.line([[x + 250, GROUND - 268], [x + 314, GROUND - 216]], 'dark', 2.4);
      man(K, x + 420, GROUND, 226, { ...ENGLISH, f: -1, helmet: true, mail: true, hold: 'spear', shield: 'navy' });
      K.shape([[x + 425, GROUND - 300], [x + 480, GROUND - 318], [x + 468, GROUND - 296], [x + 492, GROUND - 280], [x + 425, GROUND - 270]], 'terracotta'); // the dragon
    },
    (K, x) => {
      ground(K, x, x + 500);
      horse(K, x + 170, GROUND, 160, 'navy', 1, { helmet: true, mail: true, arm: 'up', hold: 'sword' }, true);
      // The king going down under the blade, his axe falling from his hand.
      man(K, x + 360, GROUND + 6, 232, { ...ENGLISH, f: -1, helmet: true, mail: true, tilt: -0.55, arm: 'down' });
      K.line([[x + 430, GROUND - 40], [x + 470, GROUND - 150]], 'rust', 2.6);
      K.shape([[x + 470, GROUND - 150], [x + 498, GROUND - 160], [x + 496, GROUND - 124], [x + 472, GROUND - 128]], 'navy');
      man(K, x + 470, GROUND + 14, 160, { ...ENGLISH, tilt: 1, tunic: 'ochre' });
    },
  ],
  tapestry: [
    (K, x) => {
      ground(K, x, x + 1000);
      // The needlewomen at their frame, and the cloth they are working.
      K.shape([[x + 60, GROUND - 150], [x + 560, GROUND - 150], [x + 560, GROUND - 120], [x + 60, GROUND - 120]], 'buff', 'dark', false);
      for (const px of [80, 300, 540]) K.line([[x + px, GROUND], [x + px, GROUND - 120]], 'rust', 5);
      for (let i = 0; i < 5; i++) K.oval(x + 110 + i * 86, GROUND - 135, 20, 8, shields[i]);
      for (let i = 0; i < 4; i++) man(K, x + 130 + i * 112, GROUND - 6, 196, { lady: true, seated: true, f: i % 2 ? -1 : 1, tunic: shields[(i + 1) % 5], arm: 'forward', hold: 'needle' });
      // The bishop who ordered it.
      man(K, x + 640, GROUND, 250, { f: -1, priest: true, tunic: 'navy', cloak: 'terracotta', arm: 'point', hold: 'staff' });
      // What the missing end probably showed: William crowned, and a castle going up.
      throne(K, x + 790, GROUND, 220, 1);
      man(K, x + 792, GROUND - 70, 222, { seated: true, crown: true, tunic: 'terracotta', cloak: 'teal', arm: 'forward', hold: 'sword' });
      hill(K, x + 880, x + 1000, GROUND, 120, 'sage');
      K.shape([[x + 915, GROUND - 116], [x + 915, GROUND - 190], [x + 965, GROUND - 190], [x + 965, GROUND - 116]], 'rust', 'dark', false);
    },
  ],
};

/** The creatures that live in the border: one drawn here, facing right, about `s` across. */
export function creature(K: Stitcher, kind: number, x: number, y: number, s: number): void {
  const at = (dx: number, dy: number): Pt => [x + dx * s, y + dy * s];
  const kinds = 5;
  switch (((kind % kinds) + kinds) % kinds) {
    case 0: // a bird
      K.shape([at(-0.42, 0.05), at(-0.1, -0.22), at(0.22, -0.2), at(0.36, -0.34), at(0.48, -0.26), at(0.4, -0.12), at(0.2, 0.16), at(-0.2, 0.2)], 'teal');
      K.shape([at(-0.1, -0.12), at(-0.34, -0.42), at(-0.02, -0.3)], 'ochre');
      K.line([at(0.48, -0.28), at(0.62, -0.22)], 'terracotta', 2.4);
      K.line([at(0, 0.18), at(0, 0.4)], 'dark', 1.8);
      K.line([at(0.12, 0.17), at(0.12, 0.4)], 'dark', 1.8);
      break;
    case 1: // a lion, tail curled over its back
      K.shape([at(-0.4, 0.1), at(-0.36, -0.14), at(0.1, -0.18), at(0.3, -0.34), at(0.5, -0.26), at(0.46, -0.04), at(0.26, 0.12), at(-0.2, 0.16)], 'ochre');
      K.line([at(-0.4, -0.06), at(-0.56, -0.3), at(-0.36, -0.44), at(-0.26, -0.3)], 'terracotta', 3);
      for (const dx of [-0.3, -0.16, 0.14, 0.28]) K.line([at(dx, 0.12), at(dx + 0.02, 0.4)], 'ochre', 4);
      K.oval(at(0.4, -0.2)[0], at(0.4, -0.2)[1], s * 0.02, s * 0.02, 'dark', null);
      break;
    case 2: // a winged dragon
      K.shape([at(-0.5, 0.2), at(-0.2, -0.04), at(0.16, -0.1), at(0.3, -0.32), at(0.5, -0.3), at(0.44, -0.14), at(0.3, -0.06), at(0.2, 0.18), at(-0.1, 0.14), at(-0.34, 0.34)], 'terracotta');
      K.shape([at(-0.06, -0.08), at(-0.3, -0.46), at(0.0, -0.36), at(0.14, -0.1)], 'navy');
      K.line([at(0.5, -0.26), at(0.62, -0.2), at(0.54, -0.16)], 'ochre', 2.2);
      K.line([at(0.1, 0.16), at(0.12, 0.4)], 'terracotta', 4);
      break;
    case 3: // a hound, running
      K.shape([at(-0.44, -0.02), at(-0.1, -0.14), at(0.24, -0.16), at(0.42, -0.26), at(0.56, -0.16), at(0.4, -0.06), at(0.24, 0.06), at(-0.2, 0.08)], 'rust');
      K.line([at(-0.44, -0.04), at(-0.62, -0.22)], 'rust', 3);
      K.line([at(-0.3, 0.06), at(-0.5, 0.34)], 'rust', 4);
      K.line([at(0.2, 0.05), at(0.44, 0.3)], 'rust', 4);
      K.line([at(0.36, -0.26), at(0.3, -0.38)], 'rust', 3);
      break;
    default: // a fish
      K.shape([at(-0.3, 0), at(-0.05, -0.18), at(0.3, -0.12), at(0.48, 0), at(0.3, 0.12), at(-0.05, 0.18)], 'sage');
      K.shape([at(-0.3, 0), at(-0.52, -0.18), at(-0.46, 0), at(-0.52, 0.18)], 'teal');
      K.oval(at(0.32, -0.03)[0], at(0.32, -0.03)[1], s * 0.02, s * 0.02, 'dark', null);
      for (const dx of [-0.02, 0.1, 0.2]) K.line([at(dx, -0.1), at(dx + 0.04, 0), at(dx, 0.1)], 'dark', 1.2);
  }
}
