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
  /** A long robe to the ankle. */
  robe?: boolean;
  /** A wound cloth on the head. */
  turban?: boolean;
  /** A ring of gold behind the head, as saints and eastern emperors are shown. */
  halo?: boolean;
  /** A Roman soldier's crest on the helmet. */
  crest?: boolean;
  seated?: boolean;
  riding?: boolean;
  arm?: 'point' | 'down' | 'up' | 'forward' | 'oath' | 'face';
  hold?: 'spear' | 'sword' | 'axe' | 'bow' | 'staff' | 'sceptre' | 'banner' | 'needle';
  shield?: Wool;
  /** The wool for face and hands, where the usual buff would be wrong. */
  skin?: Wool;
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
  const long = o.priest || o.lady || o.crown || o.robe;
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
  K.oval(hand[0], hand[1], h * 0.022, h * 0.022, o.skin ?? 'buff');
  if (o.arm === 'oath') {
    const other = at(-0.26, 0.6);
    K.line([[sx, sy + h * 0.02], [(sx + other[0]) / 2, (sy + other[1]) / 2 + h * 0.03], other], sleeve, h * 0.045);
    K.oval(other[0], other[1], h * 0.022, h * 0.022, o.skin ?? 'buff');
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
  if (o.halo) K.oval(hx, hy - h * 0.01, h * 0.115, h * 0.115, 'ochre');
  if (o.mail) K.shape([[hx - h * 0.075, hy - h * 0.02], [hx + f * h * 0.03, hy - h * 0.08], [hx + f * h * 0.05, hy + h * 0.09], [hx - f * h * 0.09, hy + h * 0.1]], 'teal');
  K.oval(hx, hy, h * 0.058, h * 0.068, o.skin ?? 'buff');
  K.line([[hx + f * h * 0.05, hy - h * 0.01], [hx + f * h * 0.078, hy + h * 0.02], [hx + f * h * 0.05, hy + h * 0.028]], 'dark', 1.3, false); // the nose
  K.oval(hx + f * h * 0.022, hy - h * 0.012, h * 0.008, h * 0.008, 'dark', null); // the eye
  if (o.lady) {
    K.shape([[hx + f * h * 0.03, hy - h * 0.085], [hx - f * h * 0.08, hy - h * 0.06], [hx - f * h * 0.1, hy + h * 0.16], [hx - f * h * 0.02, hy + h * 0.1], [hx - f * h * 0.03, hy - h * 0.02]], 'buff');
  } else if (o.priest) {
    K.line([[hx - f * h * 0.055, hy - h * 0.02], [hx - f * h * 0.03, hy - h * 0.06], [hx + f * h * 0.04, hy - h * 0.055]], o.hair ?? 'rust', 3); // a ring of hair round a shaved crown
  } else if (o.turban) {
    K.oval(hx - f * h * 0.01, hy - h * 0.055, h * 0.08, h * 0.05, 'buff');
    K.line([[hx - h * 0.07, hy - h * 0.06], [hx, hy - h * 0.04], [hx + h * 0.07, hy - h * 0.065]], 'terracotta', 2);
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
    if (o.crest) K.line([[hx - h * 0.07, hy - h * 0.1], [hx, hy - h * 0.2], [hx + h * 0.07, hy - h * 0.1]], 'terracotta', h * 0.035);
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
/** `chequered` crosses the sail with a lattice, as the Northmen's sails are shown on their own picture-stones. */
function ship(K: Stitcher, x: number, wy: number, w: number, f: number, sail: Wool[], crew: number, horses = 0, chequered = false): void {
  const at = (dx: number, dy: number): Pt => [x + f * dx * w, wy - dy * w];
  // Mast and sail.
  K.line([at(0, 0.02), at(0, 0.5)], 'rust', 3.4);
  const stripes = 6;
  for (let i = 0; i < stripes; i++) {
    const a = -0.26 + (i / stripes) * 0.52;
    const b = a + 0.52 / stripes;
    K.shape([at(a, 0.47), at(b, 0.47), at(b + 0.02, 0.16), at(a + 0.02, 0.16)], sail[i % sail.length], 'dark', false);
  }
  if (chequered) {
    // The lattice is kept to the sail itself.
    const cloth = new Path2D();
    [at(-0.26, 0.47), at(0.26, 0.47), at(0.28, 0.16), at(-0.24, 0.16)].forEach(([px, py], i) => (i ? cloth.lineTo(px, py) : cloth.moveTo(px, py)));
    cloth.closePath();
    K.g.save();
    K.g.clip(cloth);
    for (let i = -3; i <= 6; i++) {
      K.line([at(-0.26 + i * 0.09, 0.47), at(-0.26 + i * 0.09 + 0.3, 0.16)], 'dark', 1.3, false);
      K.line([at(0.26 - i * 0.09, 0.47), at(0.26 - i * 0.09 - 0.3, 0.16)], 'dark', 1.3, false);
    }
    K.g.restore();
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

// Long hair and a moustache: the fashion of the English, and of the Northmen before them.
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
  const kinds = 19;
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
    case 5: // a raven
      K.shape([at(-0.46, 0.1), at(-0.16, -0.2), at(0.2, -0.24), at(0.4, -0.32), at(0.46, -0.2), at(0.3, -0.1), at(0.16, 0.14), at(-0.2, 0.18)], 'dark');
      K.line([at(0.44, -0.24), at(0.62, -0.14)], 'dark', 3.4);
      K.shape([at(-0.1, -0.14), at(-0.4, -0.36), at(-0.06, -0.3)], 'navy');
      K.line([at(-0.02, 0.16), at(-0.04, 0.4)], 'dark', 1.8);
      K.line([at(0.1, 0.15), at(0.1, 0.4)], 'dark', 1.8);
      break;
    case 6: // a wolf
      K.shape([at(-0.42, -0.04), at(-0.12, -0.16), at(0.22, -0.18), at(0.34, -0.36), at(0.4, -0.22), at(0.58, -0.14), at(0.42, -0.02), at(0.24, 0.08), at(-0.22, 0.1)], 'navy');
      K.line([at(-0.42, -0.04), at(-0.6, 0.12)], 'navy', 4);
      for (const dx of [-0.3, -0.18, 0.16, 0.28]) K.line([at(dx, 0.08), at(dx - 0.03, 0.4)], 'navy', 4);
      K.line([at(0.44, -0.08), at(0.56, -0.1)], 'buff', 1.6);
      break;
    case 7: // a ribbon-beast, knotted through itself
      K.line([at(-0.56, 0.2), at(-0.3, -0.3), at(0, 0.24), at(0.24, -0.3), at(0.44, 0.0), at(0.2, 0.26), at(-0.1, -0.2), at(-0.4, 0.3)], 'terracotta', s * 0.09);
      K.oval(at(-0.58, 0.22)[0], at(-0.58, 0.22)[1], s * 0.07, s * 0.05, 'terracotta');
      K.oval(at(-0.62, 0.2)[0], at(-0.62, 0.2)[1], s * 0.014, s * 0.014, 'dark', null);
      break;
    case 8: // an eagle, wings spread
      K.shape([at(-0.1, 0.2), at(-0.12, -0.14), at(0, -0.3), at(0.12, -0.14), at(0.1, 0.2)], 'rust');
      K.shape([at(-0.1, -0.1), at(-0.56, -0.3), at(-0.5, 0.04), at(-0.12, 0.1)], 'ochre');
      K.shape([at(0.1, -0.1), at(0.56, -0.3), at(0.5, 0.04), at(0.12, 0.1)], 'ochre');
      K.line([at(0.04, -0.28), at(0.16, -0.22)], 'ochre', 3);
      K.oval(at(0.02, -0.24)[0], at(0.02, -0.24)[1], s * 0.014, s * 0.014, 'dark', null);
      K.line([at(-0.05, 0.2), at(-0.08, 0.38)], 'ochre', 2.4);
      K.line([at(0.05, 0.2), at(0.08, 0.38)], 'ochre', 2.4);
      break;
    case 9: // a dolphin, leaping
      K.shape([at(-0.5, 0.16), at(-0.2, -0.2), at(0.2, -0.26), at(0.5, -0.04), at(0.56, 0.08), at(0.3, 0.02), at(0, 0.1), at(-0.3, 0.3)], 'teal');
      K.shape([at(-0.5, 0.16), at(-0.66, 0.02), at(-0.56, 0.2), at(-0.64, 0.36)], 'navy');
      K.shape([at(-0.04, -0.24), at(0.04, -0.44), at(0.14, -0.24)], 'navy');
      K.oval(at(0.38, -0.06)[0], at(0.38, -0.06)[1], s * 0.016, s * 0.016, 'dark', null);
      break;
    case 10: // a peacock
      K.shape([at(-0.1, 0.1), at(-0.56, -0.36), at(-0.3, -0.42), at(-0.02, -0.14)], 'teal');
      for (const [dx, dy] of [[-0.44, -0.32], [-0.3, -0.34], [-0.2, -0.2]]) K.oval(at(dx, dy)[0], at(dx, dy)[1], s * 0.04, s * 0.04, 'ochre');
      K.shape([at(-0.14, 0.14), at(0, -0.1), at(0.2, -0.06), at(0.22, 0.12), at(0.04, 0.2)], 'navy');
      K.line([at(0.18, -0.06), at(0.3, -0.3)], 'navy', 5);
      K.oval(at(0.32, -0.34)[0], at(0.32, -0.34)[1], s * 0.05, s * 0.05, 'navy');
      K.line([at(0.34, -0.38), at(0.34, -0.5)], 'ochre', 1.8);
      K.line([at(0.04, 0.2), at(0.04, 0.4)], 'ochre', 2);
      break;
    case 11: // a lamb
      K.oval(at(-0.04, 0)[0], at(-0.04, 0)[1], s * 0.34, s * 0.2, 'buff');
      K.oval(at(0.34, -0.16)[0], at(0.34, -0.16)[1], s * 0.12, s * 0.1, 'buff');
      for (const dx of [-0.26, -0.12, 0.08, 0.2]) K.line([at(dx, 0.14), at(dx, 0.4)], 'dark', 2.6);
      K.oval(at(0.38, -0.18)[0], at(0.38, -0.18)[1], s * 0.014, s * 0.014, 'dark', null);
      K.line([at(0.26, -0.24), at(0.2, -0.32)], 'buff', 3);
      break;
    case 12: // an ox
      K.shape([at(-0.46, -0.16), at(0.2, -0.2), at(0.34, -0.3), at(0.54, -0.22), at(0.56, -0.06), at(0.4, -0.02), at(0.3, 0.14), at(-0.4, 0.14)], 'rust');
      K.line([at(0.4, -0.3), at(0.36, -0.46), at(0.48, -0.5)], 'buff', 3);
      K.line([at(-0.46, -0.14), at(-0.56, 0.1)], 'rust', 2.6);
      for (const dx of [-0.34, -0.2, 0.14, 0.26]) K.line([at(dx, 0.12), at(dx, 0.4)], 'rust', 4.4);
      K.oval(at(0.46, -0.18)[0], at(0.46, -0.18)[1], s * 0.016, s * 0.016, 'dark', null);
      break;
    case 13: // a pig
      K.oval(at(-0.04, 0.02)[0], at(-0.04, 0.02)[1], s * 0.36, s * 0.2, 'buff');
      K.shape([at(0.26, -0.12), at(0.5, -0.06), at(0.52, 0.06), at(0.28, 0.12)], 'buff');
      K.shape([at(0.22, -0.14), at(0.26, -0.3), at(0.34, -0.14)], 'terracotta');
      for (const dx of [-0.26, -0.14, 0.1, 0.2]) K.line([at(dx, 0.18), at(dx, 0.4)], 'buff', 4);
      K.line([at(-0.4, -0.02), at(-0.5, -0.12), at(-0.44, -0.18), at(-0.5, -0.24)], 'terracotta', 1.8);
      K.oval(at(0.36, -0.04)[0], at(0.36, -0.04)[1], s * 0.014, s * 0.014, 'dark', null);
      for (let i = 0; i < 5; i++) K.line([at(-0.26 + i * 0.1, -0.18), at(-0.3 + i * 0.1, -0.28)], 'dark', 1.4);
      break;
    case 14: // a stag
      K.shape([at(-0.4, -0.1), at(0.1, -0.14), at(0.24, -0.36), at(0.36, -0.42), at(0.5, -0.32), at(0.4, -0.26), at(0.3, -0.04), at(0.2, 0.08), at(-0.36, 0.08)], 'ochre');
      for (const side of [0, 0.08]) {
        K.line([at(0.3 + side, -0.42), at(0.24 + side, -0.6), at(0.14 + side, -0.7)], 'rust', 2);
        K.line([at(0.25 + side, -0.56), at(0.36 + side, -0.66)], 'rust', 2);
      }
      for (const dx of [-0.3, -0.2, 0.1, 0.2]) K.line([at(dx, 0.06), at(dx + 0.02, 0.4)], 'ochre', 3);
      K.shape([at(-0.4, -0.1), at(-0.48, -0.16), at(-0.44, -0.02)], 'buff');
      K.oval(at(0.4, -0.34)[0], at(0.4, -0.34)[1], s * 0.014, s * 0.014, 'dark', null);
      break;
    case 15: // a hare
      K.shape([at(-0.3, 0.2), at(-0.26, -0.06), at(0, -0.16), at(0.22, -0.1), at(0.36, -0.2), at(0.46, -0.1), at(0.36, 0.02), at(0.24, 0.22)], 'buff');
      K.shape([at(0.32, -0.18), at(0.22, -0.5), at(0.3, -0.52), at(0.4, -0.2)], 'buff');
      K.shape([at(-0.3, 0.2), at(-0.1, 0.1), at(0.06, 0.24), at(0.0, 0.4), at(-0.3, 0.4)], 'rust');
      K.line([at(0.2, 0.2), at(0.24, 0.4)], 'buff', 3.4);
      K.oval(at(-0.32, 0.08)[0], at(-0.32, 0.08)[1], s * 0.06, s * 0.06, 'buff');
      K.oval(at(0.38, -0.1)[0], at(0.38, -0.1)[1], s * 0.014, s * 0.014, 'dark', null);
      break;
    case 16: // a camel
      K.shape([at(-0.44, 0.06), at(-0.4, -0.16), at(-0.16, -0.2), at(-0.04, -0.4), at(0.1, -0.2), at(0.24, -0.16), at(0.34, -0.44), at(0.5, -0.5), at(0.56, -0.4), at(0.44, -0.36), at(0.38, -0.02), at(0.26, 0.08)], 'ochre');
      for (const dx of [-0.36, -0.26, 0.2, 0.3]) K.line([at(dx, 0.04), at(dx + 0.01, 0.4)], 'ochre', 3);
      K.line([at(-0.44, -0.1), at(-0.52, 0.12)], 'rust', 2);
      K.shape([at(-0.14, -0.22), at(-0.04, -0.34), at(0.08, -0.22)], 'terracotta');
      K.oval(at(0.5, -0.44)[0], at(0.5, -0.44)[1], s * 0.014, s * 0.014, 'dark', null);
      break;
    case 17: // a rat
      K.shape([at(-0.3, 0.2), at(-0.26, 0.0), at(0, -0.1), at(0.26, -0.04), at(0.46, 0.12), at(0.3, 0.22)], 'dark');
      K.oval(at(0.2, -0.1)[0], at(0.2, -0.1)[1], s * 0.06, s * 0.07, 'rust');
      K.line([at(-0.3, 0.14), at(-0.5, 0.2), at(-0.62, 0.06), at(-0.7, 0.16)], 'rust', 2);
      for (const dx of [-0.16, 0.16]) K.line([at(dx, 0.2), at(dx + 0.04, 0.34)], 'dark', 2.4);
      K.oval(at(0.34, 0.06)[0], at(0.34, 0.06)[1], s * 0.014, s * 0.014, 'buff', null);
      break;
    case 18: // a snail, as the scribes drew them
      K.shape([at(-0.44, 0.3), at(-0.4, 0.16), at(0.3, 0.14), at(0.44, -0.1), at(0.52, -0.06), at(0.44, 0.3)], 'buff');
      K.oval(at(-0.06, -0.04)[0], at(-0.06, -0.04)[1], s * 0.28, s * 0.24, 'terracotta');
      K.oval(at(-0.04, -0.02)[0], at(-0.04, -0.02)[1], s * 0.15, s * 0.13, null, 'dark');
      K.oval(at(-0.02, 0)[0], at(-0.02, 0)[1], s * 0.05, s * 0.04, 'ochre');
      K.line([at(0.46, -0.1), at(0.5, -0.3)], 'dark', 1.6);
      K.line([at(0.5, -0.08), at(0.6, -0.26)], 'dark', 1.6);
      break;
    default: // a fish
      K.shape([at(-0.3, 0), at(-0.05, -0.18), at(0.3, -0.12), at(0.48, 0), at(0.3, 0.12), at(-0.05, 0.18)], 'sage');
      K.shape([at(-0.3, 0), at(-0.52, -0.18), at(-0.46, 0), at(-0.52, 0.18)], 'teal');
      K.oval(at(0.32, -0.03)[0], at(0.32, -0.03)[1], s * 0.02, s * 0.02, 'dark', null);
      for (const dx of [-0.02, 0.1, 0.2]) K.line([at(dx, -0.1), at(dx + 0.04, 0), at(dx, 0.1)], 'dark', 1.2);
  }
}

// ---- Act 2: the Northmen. The same stitches, with things borrowed from their own carving and weaving. ----

/** A stone raised in memory of someone, cut with a ribbon-beast and a band of runes. */
function runestone(K: Stitcher, x: number, gy: number, h: number): void {
  K.shape([[x - h * 0.2, gy], [x - h * 0.24, gy - h * 0.6], [x - h * 0.12, gy - h * 0.95], [x + h * 0.1, gy - h], [x + h * 0.24, gy - h * 0.7], [x + h * 0.22, gy]], 'buff');
  // The beast: one long ribbon looping round the edge, biting its own tail.
  K.line([[x - h * 0.13, gy - h * 0.08], [x - h * 0.17, gy - h * 0.6], [x - h * 0.06, gy - h * 0.86], [x + h * 0.08, gy - h * 0.88], [x + h * 0.16, gy - h * 0.62], [x + h * 0.14, gy - h * 0.1], [x + h * 0.02, gy - h * 0.2]], 'terracotta', h * 0.035);
  K.oval(x - h * 0.02, gy - h * 0.22, h * 0.03, h * 0.022, 'terracotta');
  for (let i = 0; i < 9; i++) {
    const ry = gy - h * (0.16 + i * 0.075);
    K.line([[x - h * 0.03, ry], [x - h * 0.03, ry - h * 0.045]], 'navy', 1.6, false);
    if (i % 2) K.line([[x - h * 0.03, ry - h * 0.03], [x + h * 0.01, ry - h * 0.012]], 'navy', 1.6, false);
    else K.line([[x - h * 0.06, ry - h * 0.012], [x, ry - h * 0.035]], 'navy', 1.6, false);
  }
}

/** A written grant, with its lines of writing and the king's seal hanging from it. */
function charter(K: Stitcher, x: number, y: number, w: number): void {
  K.shape([[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + w * 1.15], [x - w / 2, y + w * 1.15]], 'buff', 'dark', false);
  for (let i = 0; i < 8; i++) K.line([[x - w * 0.4, y + w * (0.14 + i * 0.11)], [x + w * (i === 7 ? 0.05 : 0.4), y + w * (0.14 + i * 0.11)]], 'dark', 1.3, false);
  K.line([[x, y + w * 1.15], [x, y + w * 1.36]], 'terracotta', 2.4);
  K.oval(x, y + w * 1.46, w * 0.13, w * 0.13, 'terracotta');
}

function coins(K: Stitcher, x: number, y: number, n: number): void {
  for (let i = 0; i < n; i++) K.oval(x + (i % 5) * 15 - (Math.floor(i / 5) % 2) * 7, y - Math.floor(i / 5) * 9, 7, 4.5, 'ochre');
}

Object.assign(SCENES, {
  northmen: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 470);
      hall(K, x + 190, GROUND, 290, 250, 'sage');
      man(K, x + 110, GROUND, 222, { ...ENGLISH, tunic: 'rust', arm: 'forward', hold: 'axe' });
      man(K, x + 240, GROUND, 205, { f: -1, lady: true, tunic: 'teal', arm: 'forward' });
      runestone(K, x + 400, GROUND, 190);
      waves(K, x + 470, x + 1000, GROUND - 24, 4);
      ship(K, x + 730, GROUND - 48, 420, 1, ['terracotta', 'buff'], 7, 0, true);
    },
  ],
  lindisfarne: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 270);
      waves(K, x + 270, x + 500, GROUND - 16, 3);
      church(K, x + 120, GROUND, 190, 250);
      // Fire in the sky, as the Chronicle has it.
      creature(K, 2, x + 150, 64, 76);
      creature(K, 2, x + 350, 96, 60);
      man(K, x + 40, GROUND, 196, { f: -1, priest: true, tunic: 'rust', arm: 'up' });
      man(K, x + 232, GROUND, 200, { f: -1, priest: true, tunic: 'navy', arm: 'up' });
      man(K, x + 300, GROUND, 214, { ...ENGLISH, f: -1, helmet: true, tunic: 'terracotta', arm: 'up', hold: 'axe', shield: 'ochre' });
      ship(K, x + 410, GROUND - 36, 180, -1, ['navy', 'buff'], 3, 0, true);
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      runestone(K, x + 250, GROUND, 340);
      man(K, x + 120, GROUND, 214, { ...ENGLISH, tunic: 'sage', arm: 'forward', hold: 'needle' });
      // A hoard: a pot of silver put in the ground and never come back for.
      K.shape([[x + 380, GROUND + 6], [x + 366, GROUND - 40], [x + 384, GROUND - 62], [x + 426, GROUND - 62], [x + 444, GROUND - 40], [x + 430, GROUND + 6]], 'rust');
      coins(K, x + 384, GROUND - 66, 9);
      coins(K, x + 440, GROUND - 2, 5);
    },
  ],
  east: [
    (K: Stitcher, x: number) => {
      waves(K, x, x + 420, GROUND - 22, 4);
      ship(K, x + 205, GROUND - 46, 320, 1, ['ochre', 'teal'], 5, 0, true);
      ground(K, x + 420, x + 1000);
      // The traders, with their furs and a pair of scales.
      man(K, x + 480, GROUND, 232, { ...ENGLISH, tunic: 'rust', arm: 'forward', hold: 'axe' });
      for (let i = 0; i < 3; i++) K.oval(x + 548 + i * 16, GROUND - 14 - i * 12, 30, 12, i % 2 ? 'dark' : 'rust');
      man(K, x + 640, GROUND, 226, { ...ENGLISH, tunic: 'teal', arm: 'forward' });
      K.line([[x + 668, GROUND - 190], [x + 728, GROUND - 190]], 'dark', 2);
      for (const sx of [668, 728]) {
        K.line([[x + sx, GROUND - 190], [x + sx, GROUND - 160]], 'dark', 1.2);
        K.shape([[x + sx - 14, GROUND - 160], [x + sx + 14, GROUND - 160], [x + sx + 8, GROUND - 150], [x + sx - 8, GROUND - 150]], 'ochre', 'dark', false);
      }
      coins(K, x + 690, GROUND - 4, 10);
      // The envoy from Baghdad, seated before his tent, writing it all down.
      K.shape([[x + 830, GROUND], [x + 905, GROUND - 240], [x + 985, GROUND]], 'terracotta', 'dark', false);
      K.shape([[x + 880, GROUND], [x + 905, GROUND - 150], [x + 932, GROUND]], 'navy', 'dark', false);
      man(K, x + 800, GROUND - 6, 214, { f: -1, seated: true, robe: true, turban: true, tunic: 'teal', arm: 'forward', hold: 'needle' });
      K.shape([[x + 716, GROUND - 96], [x + 770, GROUND - 104], [x + 772, GROUND - 60], [x + 720, GROUND - 54]], 'buff');
    },
  ],
  settlers: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 700);
      // The peace: the English king and the Danish one, and the line drawn between their lands.
      man(K, x + 80, GROUND, 232, { ...ENGLISH, crown: true, tunic: 'navy', cloak: 'terracotta', arm: 'forward' });
      man(K, x + 190, GROUND, 232, { ...ENGLISH, f: -1, helmet: true, tunic: 'rust', arm: 'forward' });
      for (let i = 0; i < 9; i++) K.line([[x + 136, GROUND - 250 + i * 18], [x + 136, GROUND - 240 + i * 18]], 'terracotta', 3, false);
      // Settled: a house, a plough, a field.
      hall(K, x + 370, GROUND, 190, 190, 'sage');
      horse(K, x + 580, GROUND, 110, 'rust', 1);
      K.line([[x + 505, GROUND - 60], [x + 470, GROUND - 6]], 'dark', 3);
      man(K, x + 462, GROUND, 196, { ...ENGLISH, tunic: 'ochre', arm: 'forward' });
      // And further still: a ship standing in to a new shore.
      waves(K, x + 700, x + 1000, GROUND - 20, 4);
      ship(K, x + 850, GROUND - 44, 260, 1, ['terracotta', 'buff'], 4, 0, true);
    },
  ],
  cnut: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 740);
      // Silver going down to the ships.
      for (let i = 0; i < 2; i++) {
        man(K, x + 70 + i * 90, GROUND, 208, { ...ENGLISH, tunic: i ? 'sage' : 'rust', arm: 'forward' });
        K.oval(x + 116 + i * 90, GROUND - 150, 24, 30, 'buff');
      }
      hall(K, x + 480, GROUND, 420, 400, 'teal');
      throne(K, x + 420, GROUND, 250, 1);
      man(K, x + 422, GROUND - 78, 250, { seated: true, crown: true, english: true, tunic: 'navy', cloak: 'terracotta', arm: 'forward', hold: 'sceptre' });
      man(K, x + 570, GROUND, 236, { f: -1, lady: true, crown: true, tunic: 'terracotta', arm: 'forward' });
      // Her sons, sent over the sea to her brother's court.
      waves(K, x + 740, x + 1000, GROUND - 18, 3);
      ship(K, x + 870, GROUND - 38, 210, 1, ['navy', 'ochre'], 2);
    },
  ],
  rollo: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      throne(K, x + 96, GROUND, 200, 1);
      // The king, going over backwards.
      man(K, x + 98, GROUND - 64, 205, { seated: true, crown: true, tunic: 'teal', cloak: 'ochre', arm: 'up', tilt: 0.28 });
      man(K, x + 236, GROUND, 222, { ...ENGLISH, f: -1, helmet: true, tunic: 'terracotta', arm: 'forward' });
      man(K, x + 340, GROUND, 250, { ...ENGLISH, f: -1, tunic: 'rust', cloak: 'navy', arm: 'down', hold: 'axe' });
      man(K, x + 440, GROUND, 220, { f: -1, priest: true, tunic: 'buff', arm: 'point', hold: 'staff' });
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 300);
      // A clerk at his desk, and the document itself.
      K.shape([[x + 130, GROUND], [x + 130, GROUND - 110], [x + 210, GROUND - 126], [x + 210, GROUND]], 'rust', 'dark', false);
      man(K, x + 70, GROUND - 4, 208, { seated: true, priest: true, tunic: 'navy', arm: 'forward', hold: 'needle' });
      charter(K, x + 250, GROUND - 392, 150);
      // What it records: Northmen set to guard the river.
      waves(K, x + 300, x + 500, GROUND - 16, 3);
      ship(K, x + 420, GROUND - 34, 150, -1, ['terracotta', 'buff'], 2, 0, true);
      man(K, x + 350, GROUND - 18, 190, { ...ENGLISH, helmet: true, tunic: 'sage', hold: 'spear', shield: 'terracotta' });
    },
  ],
  french: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      // Baptism: the chieftain in the font, the bishop's hand over him.
      K.shape([[x + 70, GROUND], [x + 60, GROUND - 100], [x + 190, GROUND - 100], [x + 180, GROUND]], 'teal', 'dark', false);
      K.oval(x + 125, GROUND - 128, 17, 20, 'buff');
      K.line([[x + 108, GROUND - 138], [x + 122, GROUND - 152], [x + 142, GROUND - 140]], 'ochre', 4);
      man(K, x + 250, GROUND, 232, { f: -1, priest: true, tunic: 'buff', cloak: 'terracotta', arm: 'up' });
      // An abbey going up.
      church(K, x + 500, GROUND, 250, 300);
      K.line([[x + 660, GROUND], [x + 690, GROUND - 230]], 'rust', 3);
      K.line([[x + 690, GROUND], [x + 720, GROUND - 230]], 'rust', 3);
      for (let i = 1; i < 6; i++) K.line([[x + 662 + i * 5, GROUND - i * 38], [x + 692 + i * 5, GROUND - i * 38]], 'rust', 2.4);
      // And the new way of war: a knight.
      horse(K, x + 850, GROUND, 150, 'navy', 1, { helmet: true, mail: true, arm: 'forward', hold: 'spear', shield: 'terracotta' });
      tree(K, x + 380, GROUND, 200, -1);
    },
  ],
  william: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      // The castle at Falaise.
      K.shape([[x + 30, GROUND], [x + 30, GROUND - 270], [x + 150, GROUND - 270], [x + 150, GROUND]], 'buff', 'dark', false);
      K.shape([[x + 66, GROUND], [x + 66, GROUND - 110], [x + 90, GROUND - 140], [x + 114, GROUND - 110], [x + 114, GROUND]], 'navy', 'dark');
      for (let i = 0; i < 4; i++) K.shape([[x + 30 + i * 33, GROUND - 270], [x + 30 + i * 33, GROUND - 296], [x + 48 + i * 33, GROUND - 296], [x + 48 + i * 33, GROUND - 270]], 'buff', 'dark', false);
      // The boy duke, a guardian at his back, and another cut down in front of him.
      man(K, x + 230, GROUND, 230, { helmet: true, mail: true, hold: 'spear', shield: 'teal' });
      man(K, x + 320, GROUND, 150, { tunic: 'terracotta', cloak: 'teal', arm: 'forward', hold: 'sword' });
      man(K, x + 430, GROUND + 12, 190, { tilt: 1, tunic: 'ochre' });
      man(K, x + 540, GROUND, 226, { f: -1, tunic: 'navy', arm: 'up', hold: 'sword' });
      // The line he comes from: six heads on one branch, from the Viking to the duke.
      K.line([[x + 640, GROUND - 40], [x + 720, GROUND - 120], [x + 800, GROUND - 190], [x + 880, GROUND - 250], [x + 960, GROUND - 300]], 'rust', 5);
      for (let i = 0; i < 6; i++) {
        const hx = x + 640 + i * 64;
        const hy = GROUND - 60 - i * 50;
        K.oval(hx, hy, 24, 27, 'buff');
        K.line([[hx + 12, hy - 4], [hx + 20, hy + 4], [hx + 12, hy + 6]], 'dark', 1.3, false);
        if (i === 0) K.shape([[hx - 24, hy - 12], [hx, hy - 52], [hx + 24, hy - 12]], 'ochre', 'dark', false);
        else K.line([[hx - 20, hy - 14], [hx, hy - 30], [hx + 20, hy - 16]], i === 5 ? 'terracotta' : 'rust', 6);
      }
    },
  ],
});

/** Two strands plaited together, for the borders of the Northmen's part of the cloth. */
export function braid(K: Stitcher, x0: number, x1: number, y: number, amp: number): void {
  for (const [phase, ink] of [[0, 'terracotta'], [Math.PI, 'teal']] as [number, Wool][]) {
    const pts: Pt[] = [];
    for (let x = x0; x <= x1; x += 9) pts.push([x, y + Math.sin((x - x0) * 0.09 + phase) * amp]);
    K.line(pts, ink, 2.6);
  }
}

/** Small things scattered through a scene so that the cloth is busy, as the real one is: birds overhead, plants and stones underfoot. */
export function garnish(K: Stitcher, x: number, w: number): void {
  const birds = 2 + Math.floor(K.rnd() * 3);
  for (let i = 0; i < birds; i++) {
    const bx = x + 40 + K.rnd() * (w - 80);
    const by = 46 + K.rnd() * 70;
    const s = 9 + K.rnd() * 7;
    K.line([[bx - s, by - s * 0.3], [bx - s * 0.3, by - s * 0.7], [bx, by], [bx + s * 0.4, by - s * 0.8], [bx + s, by - s * 0.3]], i % 2 ? 'navy' : 'rust', 2);
  }
  const plants = Math.round(w / 90);
  for (let i = 0; i < plants; i++) {
    const px = x + 20 + ((i + K.rnd() * 0.8) / plants) * (w - 40);
    const h = 16 + K.rnd() * 22;
    const ink: Wool = (['sage', 'teal', 'ochre'] as Wool[])[i % 3];
    K.line([[px, GROUND + 4], [px + 2, GROUND - h]], 'rust', 1.8);
    for (const a of [-1, 0, 1]) K.oval(px + 2 + a * h * 0.3, GROUND - h - (a ? 0 : h * 0.22), h * 0.16, h * 0.26, ink, 'dark', a * 0.7);
  }
  for (let i = 0; i < Math.round(w / 260); i++) {
    const sx = x + 60 + K.rnd() * (w - 120);
    K.oval(sx, GROUND + 9, 13 + K.rnd() * 8, 6, 'buff');
  }
}

/**
 * What a wrong answer looks like when it is stitched: a small picture of the mistake itself,
 * drawn in a box 320 wide and 300 high with the ground at 270.
 */
export const GAG_ART: Record<string, (K: Stitcher) => void> = {
  elephant: (K) => {
    for (const lx of [92, 132, 196, 232]) K.shape([[lx - 13, 270], [lx - 13, 190], [lx + 13, 190], [lx + 13, 270]], 'buff', 'dark', false);
    K.oval(160, 160, 92, 60, 'buff');
    K.oval(246, 122, 44, 42, 'buff');
    K.shape([[214, 96], [196, 150], [232, 162], [244, 112]], 'rust');
    K.line([[280, 132], [300, 190], [286, 240], [300, 252]], 'buff', 15);
    K.line([[266, 150], [300, 172]], 'ochre', 5);
    K.oval(256, 110, 3, 3, 'dark', null);
    K.line([[70, 150], [50, 200]], 'buff', 4);
    man(K, 150, 106, 110, { helmet: true, mail: true, arm: 'forward', hold: 'spear' });
  },
  cannon: (K) => {
    K.shape([[70, 196], [210, 150], [222, 184], [84, 232]], 'navy');
    K.oval(110, 240, 34, 34, 'rust');
    K.oval(110, 240, 9, 9, 'ochre');
    K.oval(268, 120, 15, 15, 'dark');
    for (const [px, py, r] of [[232, 150, 16], [250, 168, 12], [226, 128, 11]]) K.oval(px, py, r, r, 'buff');
    man(K, 40, 270, 150, { tunic: 'terracotta', arm: 'forward' });
  },
  cat: (K) => {
    throne(K, 150, 270, 220, 1);
    K.oval(170, 168, 34, 26, 'ochre');
    K.oval(206, 138, 19, 17, 'ochre');
    K.shape([[192, 128], [196, 108], [206, 124]], 'ochre', 'dark', false);
    K.shape([[208, 124], [218, 106], [222, 128]], 'ochre', 'dark', false);
    K.line([[138, 172], [112, 150], [118, 122]], 'ochre', 6);
    K.oval(200, 136, 2.4, 2.4, 'dark', null);
    K.oval(213, 136, 2.4, 2.4, 'dark', null);
    for (const side of [-1, 1]) K.line([[207, 144], [207 + side * 24, 140 + side * 3]], 'dark', 1);
  },
  pope: (K) => {
    man(K, 150, 270, 230, { priest: true, tunic: 'buff', cloak: 'terracotta', arm: 'up', hold: 'staff' });
    for (let i = 0; i < 3; i++) K.shape([[136 + i * 4, 50 - i * 16], [182 - i * 4, 50 - i * 16], [176 - i * 4, 36 - i * 16], [142 + i * 4, 36 - i * 16]], 'ochre', 'dark', false);
    for (let i = 0; i < 6; i++) K.line([[206 + i * 14, 268], [206 + i * 14, 250]], 'dark', 1.4);
  },
  vote: (K) => {
    for (let i = 0; i < 4; i++) man(K, 50 + i * 62, 270, 150 - (i % 2) * 14, { ...ENGLISH, tunic: shields[i], arm: 'up' });
    K.shape([[250, 270], [250, 210], [306, 210], [306, 270]], 'rust', 'dark', false);
    K.line([[262, 210], [294, 210]], 'dark', 4);
  },
  squabble: (K) => {
    man(K, 70, 270, 150, { crown: true, tunic: 'terracotta', arm: 'up', hold: 'sword' });
    man(K, 160, 270, 150, { crown: true, f: -1, tunic: 'teal', arm: 'up', hold: 'axe' });
    man(K, 250, 270, 150, { crown: true, f: -1, tunic: 'ochre', arm: 'up', hold: 'sword' });
    for (const [sx, sy] of [[112, 80], [206, 70]]) for (let i = 0; i < 6; i++) K.line([[sx, sy], [sx + Math.cos(i) * 18, sy + Math.sin(i) * 18]], 'terracotta', 2);
  },
  sink: (K) => {
    K.g.save();
    K.g.translate(160, 200);
    K.g.rotate(0.5);
    ship(K, 0, 0, 230, 1, ['navy', 'buff'], 3);
    K.g.restore();
    K.shape([[0, 300], [0, 232], [320, 232], [320, 300]], 'teal', null, false);
    waves(K, 0, 320, 226, 2);
    for (const [bx, by] of [[240, 190], [262, 160], [250, 128]]) K.oval(bx, by, 8, 8, null, 'navy');
  },
  news: (K) => {
    man(K, 110, 270, 200, { ...ENGLISH, tunic: 'navy', arm: 'forward' });
    K.shape([[150, 110], [282, 96], [292, 214], [160, 224]], 'buff', 'dark', false);
    for (let i = 0; i < 6; i++) K.line([[168, 132 + i * 14], [274, 122 + i * 14]], 'dark', i ? 1.4 : 4);
  },
  hermit: (K) => {
    K.shape([[40, 270], [60, 110], [160, 60], [262, 110], [284, 270]], 'rust');
    K.shape([[110, 270], [116, 170], [160, 132], [206, 170], [212, 270]], 'dark');
    K.oval(160, 196, 21, 24, 'buff');
    K.line([[140, 216], [160, 244], [180, 216]], 'buff', 9);
    K.oval(152, 192, 2.6, 2.6, 'dark', null);
    K.oval(169, 192, 2.6, 2.6, 'dark', null);
  },
  rain: (K) => {
    for (const [cx, cy, r] of [[110, 70, 44], [170, 56, 52], [230, 74, 40]]) K.oval(cx, cy, r, r * 0.7, 'navy');
    for (let i = 0; i < 12; i++) K.line([[70 + i * 17, 110 + (i % 3) * 14], [62 + i * 17, 140 + (i % 3) * 14]], 'teal', 2.2);
    man(K, 110, 270, 150, { ...ENGLISH, helmet: true, shield: 'terracotta', arm: 'up' });
    man(K, 210, 270, 150, { ...ENGLISH, helmet: true, shield: 'ochre', arm: 'up' });
  },
  planet: (K) => {
    K.oval(160, 140, 78, 78, 'ochre');
    K.oval(160, 140, 124, 26, null, 'terracotta', -0.3);
    K.oval(134, 122, 7, 9, 'dark', null);
    K.oval(184, 122, 7, 9, 'dark', null);
    K.line([[128, 166], [160, 186], [192, 166]], 'dark', 3.4);
  },
  easel: (K) => {
    man(K, 90, 270, 190, { ...ENGLISH, tunic: 'teal', arm: 'forward', hold: 'needle' });
    K.line([[170, 270], [214, 90], [262, 270]], 'rust', 5);
    K.shape([[168, 110], [270, 110], [270, 210], [168, 210]], 'buff', 'dark', false);
    K.shape([[184, 196], [218, 140], [252, 196]], 'terracotta');
    K.oval(240, 132, 10, 10, 'ochre');
  },
  purse: (K) => {
    man(K, 60, 270, 190, { ...ENGLISH, tunic: 'rust', arm: 'forward' });
    man(K, 262, 270, 190, { f: -1, tunic: 'navy', arm: 'forward' });
    K.shape([[130, 230], [118, 170], [146, 138], [176, 138], [204, 170], [192, 230]], 'ochre');
    K.line([[140, 142], [182, 142]], 'dark', 4);
    for (let i = 0; i < 5; i++) K.oval(132 + i * 14, 250, 8, 5, 'ochre');
  },
  duck: (K) => {
    waves(K, 0, 320, 244, 3);
    K.shape([[50, 226], [70, 160], [190, 150], [250, 180], [236, 232], [90, 244]], 'buff');
    K.oval(246, 118, 34, 30, 'buff');
    K.line([[232, 148], [226, 170]], 'buff', 22);
    K.shape([[274, 116], [312, 124], [276, 136]], 'ochre');
    K.oval(254, 110, 3.4, 3.4, 'dark', null);
    K.shape([[96, 190], [150, 170], [190, 196], [140, 214]], 'ochre');
    for (let i = 0; i < 3; i++) K.oval(100 + i * 36, 140, 11, 13, 'buff');
  },
  fish: (K) => {
    waves(K, 0, 320, 246, 2);
    K.shape([[60, 200], [130, 150], [240, 168], [290, 200], [240, 232], [130, 250]], 'sage');
    K.shape([[60, 200], [14, 156], [28, 200], [14, 244]], 'teal');
    K.oval(250, 190, 5, 5, 'dark', null);
    man(K, 160, 168, 140, { ...ENGLISH, crown: true, tunic: 'terracotta', arm: 'point', riding: true });
  },
  upside: (K) => {
    K.g.save();
    K.g.translate(160, 150);
    K.g.rotate(Math.PI);
    horse(K, 0, 90, 130, 'terracotta', 1, { helmet: true, mail: true, arm: 'up' });
    K.g.restore();
  },
};

// ---- Act 1: Rome and after. The same stitches, with things borrowed from Roman and eastern buildings and mosaics. ----

/** A temple front: columns under a pediment. */
function temple(K: Stitcher, x: number, gy: number, w: number, h: number): void {
  K.shape([[x - w / 2 - 10, gy], [x + w / 2 + 10, gy], [x + w / 2 + 10, gy - h * 0.06], [x - w / 2 - 10, gy - h * 0.06]], 'buff', 'dark', false);
  const n = Math.max(3, Math.round(w / 46));
  for (let i = 0; i < n; i++) {
    const cx = x - w / 2 + 10 + (i / (n - 1)) * (w - 20);
    K.shape([[cx - 9, gy - h * 0.06], [cx - 7, gy - h * 0.7], [cx + 7, gy - h * 0.7], [cx + 9, gy - h * 0.06]], 'buff', 'dark', false);
    K.line([[cx, gy - h * 0.1], [cx, gy - h * 0.66]], 'dark', 1, false);
  }
  K.shape([[x - w / 2 - 8, gy - h * 0.7], [x + w / 2 + 8, gy - h * 0.7], [x + w / 2 + 8, gy - h * 0.78], [x - w / 2 - 8, gy - h * 0.78]], 'ochre', 'dark', false);
  K.shape([[x - w / 2 - 12, gy - h * 0.78], [x, gy - h], [x + w / 2 + 12, gy - h * 0.78]], 'terracotta', 'dark', false);
}
/** A great domed church. */
function dome(K: Stitcher, x: number, gy: number, w: number, h: number, cross = true): void {
  K.shape([[x - w / 2, gy], [x - w / 2, gy - h * 0.5], [x + w / 2, gy - h * 0.5], [x + w / 2, gy]], 'buff', 'dark', false);
  for (let i = 0; i < 5; i++) {
    const ax = x - w / 2 + 14 + i * ((w - 28 - w * 0.1) / 4);
    K.shape([[ax, gy], [ax, gy - h * 0.26], [ax + w * 0.05, gy - h * 0.34], [ax + w * 0.1, gy - h * 0.26], [ax + w * 0.1, gy]], 'navy', 'dark');
  }
  for (const side of [-1, 1]) K.shape([[x + side * w * 0.5, gy - h * 0.5], [x + side * w * 0.36, gy - h * 0.66], [x + side * w * 0.2, gy - h * 0.5]], 'teal');
  const cap: Pt[] = [];
  for (let i = 0; i <= 12; i++) cap.push([x - w * 0.3 + (i / 12) * w * 0.6, gy - h * 0.5 - Math.sin((i / 12) * Math.PI) * h * 0.44]);
  K.shape([...cap], 'ochre');
  for (let i = 1; i < 6; i++) K.line([[x - w * 0.3 + i * w * 0.1, gy - h * 0.52], [x, gy - h * 0.94]], 'dark', 1, false);
  K.line([[x, gy - h * 0.94], [x, gy - h * 1.06]], 'dark', 2);
  if (cross) K.line([[x - 8, gy - h * 1.02], [x + 8, gy - h * 1.02]], 'dark', 2);
  else K.oval(x, gy - h * 1.08, 5, 5, 'ochre');
}
/** A city wall with towers. */
function wall(K: Stitcher, x0: number, x1: number, gy: number, h: number, ink: Wool = 'buff'): void {
  K.shape([[x0, gy], [x0, gy - h], [x1, gy - h], [x1, gy]], ink, 'dark', false);
  for (let x = x0; x < x1 - 8; x += 26) K.shape([[x, gy - h], [x, gy - h - 14], [x + 14, gy - h - 14], [x + 14, gy - h]], ink, 'dark', false);
  for (let r = 1; r < 4; r++) K.line([[x0, gy - (h * r) / 4], [x1, gy - (h * r) / 4]], 'dark', 1, false);
  for (const tx of [x0 + 20, x1 - 20]) {
    K.shape([[tx - 24, gy], [tx - 24, gy - h * 1.5], [tx + 24, gy - h * 1.5], [tx + 24, gy]], ink, 'dark', false);
    for (let i = 0; i < 3; i++) K.shape([[tx - 24 + i * 18, gy - h * 1.5], [tx - 24 + i * 18, gy - h * 1.5 - 14], [tx - 12 + i * 18, gy - h * 1.5 - 14], [tx - 12 + i * 18, gy - h * 1.5]], ink, 'dark', false);
    K.shape([[tx - 8, gy - h * 1.2], [tx - 8, gy - h * 0.95], [tx + 8, gy - h * 0.95], [tx + 8, gy - h * 1.2]], 'navy', 'dark');
  }
}
/** A run of arches, as of an aqueduct. */
function arches(K: Stitcher, x0: number, n: number, gy: number, w: number, h: number): void {
  K.shape([[x0, gy - h], [x0 + n * w, gy - h], [x0 + n * w, gy - h * 0.82], [x0, gy - h * 0.82]], 'buff', 'dark', false);
  for (let i = 0; i <= n; i++) K.shape([[x0 + i * w - 7, gy], [x0 + i * w - 7, gy - h * 0.82], [x0 + i * w + 7, gy - h * 0.82], [x0 + i * w + 7, gy]], 'buff', 'dark', false);
  for (let i = 0; i < n; i++) K.line([[x0 + i * w + 7, gy - h * 0.6], [x0 + (i + 0.5) * w, gy - h * 0.82], [x0 + (i + 1) * w - 7, gy - h * 0.6]], 'dark', 2.2);
}
function flames(K: Stitcher, x: number, y: number, s: number): void {
  for (let i = 0; i < 4; i++) K.shape([[x - s * 0.5 + i * s * 0.3, y], [x - s * 0.4 + i * s * 0.3, y - s * (0.7 + (i % 2) * 0.5)], [x - s * 0.2 + i * s * 0.3, y - s * 0.3], [x - s * 0.1 + i * s * 0.3, y]], i % 2 ? 'ochre' : 'terracotta');
}
/** A paved road running along the ground, with a milestone. */
function road(K: Stitcher, x0: number, x1: number, gy: number): void {
  K.shape([[x0, gy + 2], [x1, gy + 2], [x1, gy + 20], [x0, gy + 20]], 'buff', 'dark', false);
  for (let x = x0 + 24; x < x1; x += 34) K.line([[x, gy + 2], [x - 6, gy + 20]], 'dark', 1.2, false);
}
function book(K: Stitcher, x: number, y: number, s: number, ink: Wool = 'terracotta'): void {
  K.shape([[x - s, y - s * 0.6], [x, y - s * 0.5], [x + s, y - s * 0.6], [x + s, y + s * 0.5], [x, y + s * 0.6], [x - s, y + s * 0.5]], 'buff', 'dark', false);
  K.line([[x, y - s * 0.5], [x, y + s * 0.6]], ink, 2.4, false);
  for (let i = 0; i < 3; i++) for (const side of [-1, 1]) K.line([[x + side * s * 0.2, y - s * 0.3 + i * s * 0.26], [x + side * s * 0.8, y - s * 0.36 + i * s * 0.26]], 'dark', 1, false);
}
const ROMAN: Man = { robe: true };

Object.assign(SCENES, {
  rome: [
    (K: Stitcher, x: number) => {
      road(K, x, x + 1000, GROUND);
      temple(K, x + 170, GROUND, 250, 330);
      // The emperor, and the soldiers who keep his peace.
      man(K, x + 350, GROUND, 250, { ...ROMAN, crown: true, tunic: 'buff', cloak: 'terracotta', arm: 'point', hold: 'sceptre' });
      for (let i = 0; i < 4; i++) man(K, x + 450 + i * 56, GROUND, 216, { helmet: true, crest: true, mail: true, hold: 'spear', shield: i % 2 ? 'terracotta' : 'ochre' });
      K.shape([[x + 690, GROUND], [x + 690, GROUND - 76], [x + 716, GROUND - 90], [x + 742, GROUND - 76], [x + 742, GROUND]], 'buff'); // a milestone
      arches(K, x + 770, 3, GROUND, 70, 230);
    },
  ],
  fall: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      wall(K, x + 250, x + 500, GROUND, 190);
      flames(K, x + 340, GROUND - 204, 60);
      flames(K, x + 430, GROUND - 204, 50);
      // The Goths at the gate, and a Roman running.
      man(K, x + 60, GROUND, 226, { ...ENGLISH, helmet: true, tunic: 'rust', hold: 'spear', shield: 'teal' });
      man(K, x + 140, GROUND, 232, { ...ENGLISH, crown: true, tunic: 'terracotta', arm: 'point', hold: 'sword' });
      man(K, x + 220, GROUND, 200, { f: -1, ...ROMAN, tunic: 'buff', arm: 'up' });
      K.shape([[x + 20, GROUND], [x + 26, GROUND - 60], [x + 50, GROUND - 60], [x + 44, GROUND]], 'buff'); // a broken column
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      hall(K, x + 250, GROUND, 400, 380, 'terracotta');
      throne(K, x + 200, GROUND, 230, 1);
      // A Gothic king on a Roman throne, with a Roman clerk reading him the Roman law.
      man(K, x + 202, GROUND - 72, 232, { ...ENGLISH, seated: true, crown: true, tunic: 'teal', cloak: 'terracotta', arm: 'forward' });
      man(K, x + 340, GROUND, 220, { f: -1, ...ROMAN, tunic: 'buff', arm: 'forward' });
      K.shape([[x + 262, GROUND - 180], [x + 312, GROUND - 186], [x + 314, GROUND - 130], [x + 264, GROUND - 124]], 'buff');
      man(K, x + 420, GROUND, 214, { f: -1, priest: true, tunic: 'navy', arm: 'down', hold: 'staff' });
    },
  ],
  legacy: [
    (K: Stitcher, x: number) => {
      road(K, x, x + 1000, GROUND);
      arches(K, x + 30, 3, GROUND, 66, 210);
      // The road still in use, long after the men who built it.
      man(K, x + 290, GROUND, 214, { ...ENGLISH, tunic: 'sage', arm: 'forward', hold: 'staff' });
      horse(K, x + 430, GROUND, 120, 'rust', 1);
      K.shape([[x + 520, GROUND], [x + 520, GROUND - 80], [x + 546, GROUND - 94], [x + 572, GROUND - 80], [x + 572, GROUND]], 'buff');
      // A town on Roman foundations, and the letters and the law that stayed.
      wall(K, x + 620, x + 820, GROUND, 130);
      church(K, x + 720, GROUND - 130, 120, 150);
      book(K, x + 910, GROUND - 190, 56);
      K.words('A B C', x + 910, GROUND - 90, 34);
    },
  ],
  church: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 700);
      wall(K, x + 20, x + 230, GROUND, 150);
      // The bishop of Rome, feeding his city.
      man(K, x + 330, GROUND, 250, { priest: true, halo: true, tunic: 'buff', cloak: 'terracotta', arm: 'forward', hold: 'staff' });
      K.oval(x + 396, GROUND - 150, 22, 15, 'ochre'); // bread
      man(K, x + 470, GROUND, 200, { f: -1, lady: true, tunic: 'sage', arm: 'forward' });
      man(K, x + 540, GROUND, 190, { ...ENGLISH, f: -1, tunic: 'rust', arm: 'forward' });
      man(K, x + 600, GROUND, 140, { f: -1, tunic: 'teal', arm: 'forward' });
      // And a monk setting out for England.
      waves(K, x + 700, x + 1000, GROUND - 20, 4);
      ship(K, x + 850, GROUND - 44, 250, 1, ['buff', 'terracotta'], 2);
      man(K, x + 850, GROUND - 60, 150, { priest: true, tunic: 'navy', arm: 'point', hold: 'staff' });
    },
  ],
  monks: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      church(K, x + 150, GROUND, 240, 320);
      // The writing-room: two monks at their desks.
      for (const [mx, f] of [[420, 1], [640, -1]]) {
        K.shape([[x + mx + f * 60, GROUND], [x + mx + f * 60, GROUND - 120], [x + mx + f * 130, GROUND - 136], [x + mx + f * 130, GROUND]], 'rust', 'dark', false);
        man(K, x + mx, GROUND - 6, 214, { f, seated: true, priest: true, tunic: f > 0 ? 'navy' : 'rust', arm: 'forward', hold: 'needle' });
        book(K, x + mx + f * 96, GROUND - 150, 30, 'teal');
      }
      // Books on the shelf, and one monk in the garden.
      K.shape([[x + 770, GROUND - 120], [x + 950, GROUND - 120], [x + 950, GROUND - 130], [x + 770, GROUND - 130]], 'rust', 'dark', false);
      for (let i = 0; i < 6; i++) K.shape([[x + 780 + i * 27, GROUND - 130], [x + 780 + i * 27, GROUND - 196], [x + 800 + i * 27, GROUND - 196], [x + 800 + i * 27, GROUND - 130]], shields[i % 5], 'dark', false);
      man(K, x + 860, GROUND, 200, { priest: true, tunic: 'sage', arm: 'down', hold: 'staff' });
    },
  ],
  time: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      church(K, x + 480, GROUND, 250, 340);
      K.oval(x + 480, GROUND - 290, 14, 18, 'ochre'); // the bell
      // The village on its way in.
      man(K, x + 120, GROUND, 214, { ...ENGLISH, tunic: 'sage', arm: 'forward' });
      man(K, x + 200, GROUND, 200, { lady: true, tunic: 'terracotta', arm: 'forward' });
      man(K, x + 270, GROUND, 130, { tunic: 'ochre', arm: 'up' });
      man(K, x + 690, GROUND, 226, { f: -1, priest: true, tunic: 'buff', arm: 'point' });
      // A wheel of the year, and the tenth sheaf set aside.
      K.oval(x + 880, GROUND - 300, 62, 62, 'buff');
      for (let i = 0; i < 12; i++) K.line([[x + 880, GROUND - 300], [x + 880 + Math.cos(i * 0.5236) * 60, GROUND - 300 + Math.sin(i * 0.5236) * 60]], i % 3 ? 'dark' : 'terracotta', 1.6, false);
      for (let i = 0; i < 10; i++) K.shape([[x + 770 + i * 22, GROUND], [x + 778 + i * 22, GROUND - 44], [x + 786 + i * 22, GROUND]], i === 9 ? 'terracotta' : 'ochre');
    },
  ],
  charlemagne: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      hall(K, x + 250, GROUND, 440, 390, 'teal');
      // The Pope sets the crown on him, and the people shout.
      man(K, x + 180, GROUND, 250, { ...ENGLISH, crown: true, tunic: 'terracotta', cloak: 'navy', arm: 'forward' });
      man(K, x + 270, GROUND, 236, { f: -1, priest: true, halo: true, tunic: 'buff', arm: 'up' });
      for (let i = 0; i < 3; i++) man(K, x + 350 + i * 44, GROUND, 200 - i * 8, { f: -1, ...ROMAN, tunic: shields[i], arm: 'up' });
      man(K, x + 80, GROUND, 214, { helmet: true, mail: true, hold: 'spear' });
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      hall(K, x + 250, GROUND, 440, 390, 'teal');
      // The king on his knees at prayer, and the Pope coming up behind him with the crown.
      man(K, x + 300, GROUND, 236, { ...ENGLISH, tunic: 'terracotta', cloak: 'navy', arm: 'face' });
      man(K, x + 180, GROUND, 236, { priest: true, tunic: 'buff', arm: 'forward' });
      K.shape([[x + 222, GROUND - 170], [x + 228, GROUND - 196], [x + 240, GROUND - 180], [x + 250, GROUND - 200], [x + 260, GROUND - 180], [x + 272, GROUND - 196], [x + 278, GROUND - 170]], 'ochre', 'dark', false);
      man(K, x + 420, GROUND, 210, { f: -1, ...ROMAN, tunic: 'sage', arm: 'point' });
    },
  ],
  byzantium: [
    (K: Stitcher, x: number) => {
      waves(K, x, x + 330, GROUND - 20, 4);
      ship(K, x + 160, GROUND - 44, 250, 1, ['terracotta', 'ochre'], 4);
      ground(K, x + 330, x + 1000);
      // The walls, and the city behind them.
      dome(K, x + 660, GROUND - 150, 280, 250);
      wall(K, x + 360, x + 980, GROUND, 150);
      man(K, x + 520, GROUND - 150, 150, { helmet: true, crest: true, mail: true, hold: 'spear' });
      man(K, x + 820, GROUND - 150, 160, { ...ROMAN, crown: true, halo: true, tunic: 'terracotta', arm: 'point' });
      K.oval(x + 930, 96, 30, 30, 'ochre');
    },
  ],
  justinian: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      dome(K, x + 340, GROUND, 290, 330);
      // The emperor with his book of laws, and the empress who would not run.
      man(K, x + 90, GROUND, 250, { ...ROMAN, crown: true, halo: true, tunic: 'terracotta', cloak: 'ochre', arm: 'forward' });
      book(K, x + 150, GROUND - 160, 28, 'navy');
      man(K, x + 200, GROUND, 236, { f: -1, lady: true, crown: true, halo: true, tunic: 'navy', arm: 'point' });
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      hall(K, x + 250, GROUND, 440, 380, 'navy');
      K.oval(x + 420, 110, 30, 30, 'buff'); // the moon
      // The emperor walking the palace at night, and his head somewhere else.
      man(K, x + 220, GROUND, 250, { ...ROMAN, tunic: 'terracotta', cloak: 'ochre', arm: 'forward' });
      K.oval(x + 232, GROUND - 222, 24, 28, 'buff', 'buff'); // nothing where the head should be
      K.oval(x + 330, GROUND - 300, 20, 23, 'buff');
      K.shape([[x + 312, GROUND - 318], [x + 318, GROUND - 340], [x + 326, GROUND - 324], [x + 332, GROUND - 344], [x + 338, GROUND - 324], [x + 346, GROUND - 340], [x + 350, GROUND - 318]], 'ochre', 'dark', false);
      K.oval(x + 336, GROUND - 302, 2.4, 2.4, 'dark', null);
      man(K, x + 400, GROUND, 196, { f: 1, tunic: 'sage', arm: 'up' });
      man(K, x + 70, GROUND - 6, 196, { seated: true, priest: false, tunic: 'navy', arm: 'forward', hold: 'needle' });
    },
  ],
});

/** A border of squared spirals, the key pattern of Roman floors. */
export function meander(K: Stitcher, x0: number, x1: number, y: number, s: number): void {
  const pts: Pt[] = [];
  for (let x = x0; x < x1; x += s * 4) pts.push([x, y + s], [x, y - s], [x + s * 3, y - s], [x + s * 3, y + s * 0.2], [x + s * 1.2, y + s * 0.2], [x + s * 1.2, y - s * 0.3], [x + s * 2, y - s * 0.3], [x + s * 2, y + s], [x + s * 4, y + s]);
  K.line(pts, 'terracotta', 2, false);
}

// ---- Act 4: after the Conquest. The same stitches, with the Normans' own buildings: earth castles, stone keeps, and round arches cut with zigzag. ----

/** A castle of earth and timber: a mound with a tower on it, and a fence round the yard below. */
function motte(K: Stitcher, x: number, gy: number, w: number, h: number): void {
  hill(K, x - w / 2, x + w / 2, gy, h * 0.55, 'sage');
  const ty = gy - h * 0.53;
  for (let i = -3; i <= 3; i++) K.shape([[x + i * 14 - 6, ty + 6], [x + i * 14 - 6, ty - 26], [x + i * 14, ty - 34], [x + i * 14 + 6, ty - 26], [x + i * 14 + 6, ty + 6]], 'rust', 'dark', false);
  K.shape([[x - 30, ty - 20], [x - 30, gy - h * 0.92], [x + 30, gy - h * 0.92], [x + 30, ty - 20]], 'ochre', 'dark', false);
  for (let i = 1; i < 4; i++) K.line([[x - 30 + i * 15, ty - 20], [x - 30 + i * 15, gy - h * 0.92]], 'dark', 1, false);
  K.shape([[x - 38, gy - h * 0.92], [x, gy - h * 1.06], [x + 38, gy - h * 0.92]], 'terracotta', 'dark', false);
  K.shape([[x - 7, gy - h * 0.8], [x - 7, gy - h * 0.7], [x + 7, gy - h * 0.7], [x + 7, gy - h * 0.8]], 'navy', 'dark');
}
/** A fence of sharpened stakes. */
function stakes(K: Stitcher, x0: number, x1: number, gy: number, h: number): void {
  for (let x = x0; x < x1; x += 13) K.shape([[x, gy], [x, gy - h], [x + 5, gy - h - 9], [x + 10, gy - h], [x + 10, gy]], 'rust', 'dark', false);
}
/** A great church in the Norman manner: two towers, and rows of round-headed arches. */
function minster(K: Stitcher, x: number, gy: number, w: number, h: number): void {
  K.shape([[x - w / 2, gy], [x - w / 2, gy - h * 0.6], [x + w / 2, gy - h * 0.6], [x + w / 2, gy]], 'buff', 'dark', false);
  const n = Math.max(3, Math.round(w / 60));
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < n; i++) {
      const aw = (w - 30) / n;
      const ax = x - w / 2 + 15 + i * aw + aw * 0.2;
      const base = gy - row * h * 0.31;
      const top = h * (row ? 0.16 : 0.2);
      const arch: Pt[] = [[ax, base - (row ? h * 0.04 : 0)], [ax, base - top]];
      for (let k = 1; k < 6; k++) arch.push([ax + (aw * 0.6 * k) / 6, base - top - Math.sin((k / 6) * Math.PI) * aw * 0.3]);
      arch.push([ax + aw * 0.6, base - top], [ax + aw * 0.6, base - (row ? h * 0.04 : 0)]);
      K.shape(arch, row ? 'teal' : 'navy', 'dark', false);
    }
  }
  // The zigzag the Normans cut round their arches, run along the wall.
  const zig: Pt[] = [];
  for (let zx = x - w / 2 + 6; zx <= x + w / 2 - 6; zx += 10) zig.push([zx, gy - h * 0.3 - (zig.length % 2) * 8]);
  K.line(zig, 'terracotta', 2, false);
  K.shape([[x - w / 2 - 8, gy - h * 0.6], [x - w / 2 + 14, gy - h * 0.72], [x + w / 2 - 14, gy - h * 0.72], [x + w / 2 + 8, gy - h * 0.6]], 'terracotta', 'dark', false);
  for (const side of [-1, 1]) {
    const tx = x + side * (w / 2 - 34);
    K.shape([[tx - 30, gy - h * 0.6], [tx - 30, gy - h * 0.98], [tx + 30, gy - h * 0.98], [tx + 30, gy - h * 0.6]], 'buff', 'dark', false);
    for (const dy of [0.7, 0.86]) K.shape([[tx - 8, gy - h * dy + 14], [tx - 8, gy - h * dy - 8], [tx, gy - h * dy - 18], [tx + 8, gy - h * dy - 8], [tx + 8, gy - h * dy + 14]], 'navy', 'dark');
    K.shape([[tx - 34, gy - h * 0.98], [tx, gy - h * 1.12], [tx + 34, gy - h * 0.98]], 'teal', 'dark', false);
  }
}
/** A plough drawn by an ox, with the ploughman behind. Faces right. */
function ploughTeam(K: Stitcher, x: number, gy: number, who: Man): void {
  creature(K, 12, x + 150, gy - 52, 130);
  K.line([[x + 90, gy - 62], [x + 40, gy - 50], [x + 20, gy - 6]], 'rust', 4);
  K.shape([[x + 8, gy], [x + 26, gy - 22], [x + 40, gy]], 'dark');
  K.line([[x + 36, gy - 50], [x + 6, gy - 96]], 'rust', 4);
  man(K, x - 26, gy, 206, { ...who, arm: 'forward' });
  for (let i = 0; i < 4; i++) K.line([[x - 200 + i * 44, gy + 10], [x - 170 + i * 44, gy + 5], [x - 140 + i * 44, gy + 10]], 'rust', 1.8);
}
/** The chequered cloth the king's treasurers counted on, which gave the Exchequer its name. */
function chequers(K: Stitcher, x: number, y: number, w: number): void {
  const c = w / 6;
  K.shape([[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + c * 2], [x - w / 2, y + c * 2]], 'buff', 'dark', false);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) K.shape([[x - w / 2 + i * c, y + j * c], [x - w / 2 + (i + 1) * c, y + j * c], [x - w / 2 + (i + 1) * c, y + (j + 1) * c], [x - w / 2 + i * c, y + (j + 1) * c]], 'navy', null, false);
  for (const side of [-1, 1]) K.line([[x + side * w * 0.42, y + c * 2], [x + side * w * 0.42, y + c * 2 + 70]], 'rust', 5);
}
const NORMAN: Man = { hair: 'rust' };

Object.assign(SCENES, {
  castles: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      motte(K, x + 250, GROUND, 360, 330);
      stakes(K, x + 430, x + 640, GROUND, 54);
      // The English, digging; and the man who is making them.
      man(K, x + 80, GROUND, 204, { ...ENGLISH, tunic: 'sage', arm: 'forward', hold: 'staff' });
      man(K, x + 470, GROUND, 200, { ...ENGLISH, f: -1, tunic: 'rust', arm: 'forward', hold: 'staff' });
      K.oval(x + 420, GROUND - 6, 26, 12, 'rust'); // a heap of earth
      man(K, x + 560, GROUND, 196, { ...ENGLISH, f: -1, tunic: 'teal', arm: 'up' });
      K.oval(x + 548, GROUND - 204, 22, 14, 'rust'); // a basket of it, on his head
      horse(K, x + 730, GROUND, 150, 'navy', -1, { ...NORMAN, helmet: true, mail: true, arm: 'point', hold: 'spear' });
      // A house in the way.
      hall(K, x + 910, GROUND, 130, 150, 'sage');
      K.line([[x + 850, GROUND - 150], [x + 970, GROUND - 40]], 'dark', 2.4, false);
    },
  ],
  harrying: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      hall(K, x + 350, GROUND, 190, 210, 'sage');
      flames(K, x + 330, GROUND - 204, 70);
      flames(K, x + 400, GROUND - 190, 50);
      // The barn, the plough and the ox: what a village needs to eat next year.
      K.line([[x + 196, GROUND], [x + 216, GROUND - 40], [x + 250, GROUND - 46]], 'rust', 4);
      flames(K, x + 226, GROUND - 44, 44);
      horse(K, x + 100, GROUND, 150, 'terracotta', 1, { ...NORMAN, helmet: true, mail: true, arm: 'up', hold: 'sword' }, true);
      man(K, x + 462, GROUND, 190, { lady: true, tunic: 'teal', arm: 'up' });
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      // Sixteen years on: posts where a house was, and a clerk writing one word.
      for (const px of [300, 340, 392, 430]) K.line([[x + px, GROUND], [x + px + 4, GROUND - 60 - (px % 3) * 22]], 'dark', 5, false);
      K.line([[x + 286, GROUND - 4], [x + 450, GROUND - 4]], 'rust', 2, false);
      man(K, x + 80, GROUND - 6, 200, { ...NORMAN, seated: true, priest: true, tunic: 'navy', arm: 'forward', hold: 'needle' });
      book(K, x + 160, GROUND - 120, 34, 'navy');
      man(K, x + 230, GROUND, 196, { ...ENGLISH, f: -1, tunic: 'rust', arm: 'down' });
      K.words('WASTA', x + 370, GROUND - 190, 30);
      creature(K, 5, x + 372, GROUND - 124, 60); // a raven on the tallest post
    },
  ],
  lords: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      throne(K, x + 130, GROUND, 230, 1);
      man(K, x + 132, GROUND - 72, 236, { ...NORMAN, seated: true, crown: true, tunic: 'terracotta', cloak: 'navy', arm: 'forward', hold: 'sceptre' });
      // His barons, swearing; and what they get for it.
      for (let i = 0; i < 3; i++) man(K, x + 290 + i * 70, GROUND, 214 - i * 4, { ...NORMAN, f: -1, mail: true, tunic: shields[i], arm: 'oath' });
      charter(K, x + 250, GROUND - 330, 64);
      // The men who held it before, going.
      man(K, x + 640, GROUND, 210, { ...ENGLISH, tunic: 'sage', arm: 'down', hold: 'staff' });
      man(K, x + 710, GROUND, 196, { lady: true, tunic: 'ochre', arm: 'down' });
      waves(K, x + 780, x + 1000, GROUND - 20, 4);
      ship(K, x + 890, GROUND - 44, 200, 1, ['teal', 'buff'], 2);
    },
  ],
  domesday: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      man(K, x + 70, GROUND - 6, 200, { ...NORMAN, seated: true, priest: true, tunic: 'navy', arm: 'forward', hold: 'needle' });
      book(K, x + 150, GROUND - 120, 34);
      man(K, x + 220, GROUND, 208, { ...ENGLISH, tunic: 'rust', arm: 'point' });
      // Every one of them written down.
      creature(K, 12, x + 320, GROUND - 46, 116);
      creature(K, 12, x + 406, GROUND - 40, 100);
      creature(K, 13, x + 462, GROUND - 26, 66);
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      hall(K, x + 250, GROUND, 440, 380, 'navy');
      // The treasurer at his chequered cloth, with the book that settles everything.
      chequers(K, x + 260, GROUND - 126, 200);
      coins(K, x + 200, GROUND - 132, 9);
      man(K, x + 110, GROUND, 226, { ...NORMAN, priest: true, tunic: 'terracotta', cloak: 'teal', arm: 'point' });
      book(K, x + 320, GROUND - 170, 50, 'terracotta');
      man(K, x + 420, GROUND, 204, { ...NORMAN, f: -1, tunic: 'sage', arm: 'forward' });
    },
  ],
  tongue: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      // In the field, in English.
      tree(K, x + 40, GROUND, 230);
      man(K, x + 120, GROUND, 208, { ...ENGLISH, tunic: 'sage', arm: 'point', hold: 'staff' });
      creature(K, 12, x + 230, GROUND - 46, 116);
      creature(K, 13, x + 340, GROUND - 30, 76);
      creature(K, 11, x + 430, GROUND - 30, 76);
      K.words('COW', x + 230, GROUND - 130, 22);
      K.words('PIG', x + 340, GROUND - 96, 22);
      K.words('SHEEP', x + 432, GROUND - 96, 22);
      K.line([[x + 500, 60], [x + 500, GROUND + 20]], 'rust', 2, false);
      // At the table, in French.
      hall(K, x + 750, GROUND, 460, 380, 'terracotta');
      K.shape([[x + 580, GROUND - 120], [x + 920, GROUND - 120], [x + 920, GROUND - 104], [x + 580, GROUND - 104]], 'buff', 'dark', false);
      for (const lx of [600, 900]) K.line([[x + lx, GROUND - 104], [x + lx, GROUND]], 'rust', 5);
      man(K, x + 600, GROUND - 40, 220, { ...NORMAN, seated: true, tunic: 'navy', cloak: 'terracotta', arm: 'forward' });
      man(K, x + 905, GROUND - 40, 210, { f: -1, lady: true, seated: true, tunic: 'teal', arm: 'forward' });
      for (const [dx, word] of [[672, 'BEEF'], [752, 'PORK'], [838, 'MUTTON']] as [number, string][]) {
        K.oval(x + dx, GROUND - 128, 28, 9, 'ochre');
        K.oval(x + dx, GROUND - 138, 17, 9, 'rust');
        K.words(word, x + dx, GROUND - 176, 18);
      }
    },
  ],
  stone: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      // The old church, small and about to go.
      church(K, x + 90, GROUND, 130, 170);
      man(K, x + 210, GROUND, 236, { ...NORMAN, priest: true, tunic: 'buff', cloak: 'terracotta', arm: 'point', hold: 'staff' });
      man(K, x + 300, GROUND, 190, { ...ENGLISH, priest: true, tunic: 'navy', arm: 'face' });
      // The new one, going up.
      minster(K, x + 660, GROUND, 460, 370);
      for (const sx of [400, 440]) K.line([[x + sx, GROUND], [x + sx, GROUND - 250]], 'rust', 3, false);
      for (const sy of [90, 170, 250]) K.line([[x + 396, GROUND - sy], [x + 446, GROUND - sy]], 'rust', 3, false);
      man(K, x + 420, GROUND - 170, 76, { ...ENGLISH, tunic: 'sage', arm: 'up', hold: 'axe' });
      for (let i = 0; i < 3; i++) K.shape([[x + 330 + i * 22, GROUND], [x + 330 + i * 22, GROUND - 18], [x + 350 + i * 22, GROUND - 18], [x + 350 + i * 22, GROUND]], 'buff', 'dark', false);
      K.shape([[x + 342, GROUND - 18], [x + 342, GROUND - 36], [x + 362, GROUND - 36], [x + 362, GROUND - 18]], 'buff', 'dark', false);
    },
  ],
  forest: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      tree(K, x + 50, GROUND, 250);
      tree(K, x + 470, GROUND, 290, -1);
      tree(K, x + 800, GROUND, 260);
      tree(K, x + 950, GROUND, 220, -1);
      horse(K, x + 220, GROUND, 160, 'rust', 1, { ...NORMAN, crown: true, tunic: 'terracotta', arm: 'forward', hold: 'bow' }, true);
      creature(K, 3, x + 400, GROUND - 36, 90);
      creature(K, 14, x + 590, GROUND - 60, 150);
      creature(K, 14, x + 700, GROUND - 48, 120);
      creature(K, 15, x + 760, GROUND - 22, 54);
      creature(K, 13, x + 900, GROUND - 28, 70);
      // A villager who would like his barley back, keeping very still.
      man(K, x + 850, GROUND, 196, { ...ENGLISH, f: -1, tunic: 'sage', arm: 'face' });
    },
  ],
  plough: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      horse(K, x + 70, GROUND, 150, 'navy', 1, { ...NORMAN, tunic: 'terracotta', cloak: 'ochre', arm: 'point' });
      ploughTeam(K, x + 250, GROUND, { ...ENGLISH, tunic: 'rust' });
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      church(K, x + 410, GROUND, 150, 200);
      // The sheriff with the king's writ, in English; and a man with his chain off.
      man(K, x + 70, GROUND, 216, { ...NORMAN, tunic: 'navy', cloak: 'terracotta', arm: 'forward' });
      charter(K, x + 120, GROUND - 200, 44);
      man(K, x + 190, GROUND, 204, { ...ENGLISH, f: -1, tunic: 'sage', arm: 'forward' });
      man(K, x + 320, GROUND, 190, { ...ENGLISH, tunic: 'ochre', arm: 'up' });
      for (let i = 0; i < 4; i++) K.oval(x + 292 + i * 12, GROUND - 6 - (i % 2) * 3, 7, 4.4, null, 'dark');
    },
  ],
  reckoning: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      // The king on his bier, with seven feet of ground.
      K.shape([[x + 150, GROUND - 40], [x + 450, GROUND - 40], [x + 450, GROUND - 62], [x + 150, GROUND - 62]], 'navy', 'dark', false);
      for (const lx of [170, 430]) K.line([[x + lx, GROUND], [x + lx, GROUND - 40]], 'rust', 5);
      man(K, x + 440, GROUND - 66, 236, { ...NORMAN, f: 1, tilt: 1, crown: true, tunic: 'terracotta', cloak: 'ochre' });
      man(K, x + 90, GROUND, 214, { priest: true, tunic: 'buff', arm: 'up', hold: 'staff' });
      // Three sons, and what each of them got.
      man(K, x + 530, GROUND, 196, { ...NORMAN, f: -1, tunic: 'sage', arm: 'down', hold: 'sword' });
      man(K, x + 610, GROUND, 214, { ...NORMAN, f: -1, tunic: 'terracotta', arm: 'up' });
      K.shape([[x + 572, GROUND - 228], [x + 576, GROUND - 250], [x + 584, GROUND - 236], [x + 590, GROUND - 254], [x + 596, GROUND - 236], [x + 604, GROUND - 250], [x + 608, GROUND - 228]], 'ochre', 'dark', false);
      man(K, x + 690, GROUND, 190, { ...NORMAN, f: -1, tunic: 'navy', arm: 'forward' });
      coins(K, x + 716, GROUND - 6, 12);
      // The one who is writing it all down, good and evil.
      man(K, x + 860, GROUND - 6, 204, { ...ENGLISH, f: -1, seated: true, priest: true, tunic: 'navy', arm: 'forward', hold: 'needle' });
      book(K, x + 780, GROUND - 120, 36, 'terracotta');
      church(K, x + 950, GROUND, 90, 190);
    },
  ],
});

/** A border of zigzag, as the Normans cut it round their doors and arches. */
export function chevron(K: Stitcher, x0: number, x1: number, y: number, s: number): void {
  for (const [dy, ink] of [[0, 'terracotta'], [s * 0.9, 'navy']] as [number, Wool][]) {
    const pts: Pt[] = [];
    for (let x = x0, i = 0; x <= x1; x += s * 2, i++) pts.push([x, y + dy + (i % 2 ? -s : s) * 0.8]);
    K.line(pts, ink, 2, false);
  }
}

// ---- Act 5: the world beyond. The same stitches; the borders are taken from the margins of books. ----

/** A printing press: two posts, a screw, and the bed the type lies on. */
function press(K: Stitcher, x: number, gy: number, h: number): void {
  for (const side of [-1, 1]) K.shape([[x + side * h * 0.3 - 7, gy], [x + side * h * 0.3 - 7, gy - h], [x + side * h * 0.3 + 7, gy - h], [x + side * h * 0.3 + 7, gy]], 'rust', 'dark', false);
  K.shape([[x - h * 0.36, gy - h], [x + h * 0.36, gy - h], [x + h * 0.36, gy - h * 0.9], [x - h * 0.36, gy - h * 0.9]], 'rust', 'dark', false);
  K.shape([[x - 7, gy - h * 0.9], [x + 7, gy - h * 0.9], [x + 7, gy - h * 0.52], [x - 7, gy - h * 0.52]], 'ochre', 'dark', false);
  for (let i = 0; i < 5; i++) K.line([[x - 7, gy - h * (0.86 - i * 0.07)], [x + 7, gy - h * (0.83 - i * 0.07)]], 'dark', 1.2, false);
  K.line([[x, gy - h * 0.7], [x - h * 0.34, gy - h * 0.62]], 'dark', 4, false); // the bar
  K.shape([[x - h * 0.2, gy - h * 0.52], [x + h * 0.2, gy - h * 0.52], [x + h * 0.2, gy - h * 0.46], [x - h * 0.2, gy - h * 0.46]], 'navy', 'dark', false);
  K.shape([[x - h * 0.26, gy - h * 0.4], [x + h * 0.26, gy - h * 0.4], [x + h * 0.26, gy - h * 0.34], [x - h * 0.26, gy - h * 0.34]], 'buff', 'dark', false);
  K.shape([[x - h * 0.36, gy - h * 0.34], [x + h * 0.36, gy - h * 0.34], [x + h * 0.36, gy - h * 0.28], [x - h * 0.36, gy - h * 0.28]], 'rust', 'dark', false);
}
/** A printed sheet, or a written one. */
function sheet(K: Stitcher, x: number, y: number, w: number): void {
  K.shape([[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + w * 1.3], [x - w / 2, y + w * 1.3]], 'buff', 'dark', false);
  for (let i = 0; i < 6; i++) K.line([[x - w * 0.36, y + w * (0.2 + i * 0.17)], [x + w * 0.36, y + w * (0.2 + i * 0.17)]], 'dark', 1.2, false);
}
/** A cross on a pole, carried in front. */
function standard(K: Stitcher, x: number, gy: number, h: number): void {
  K.line([[x, gy], [x, gy - h]], 'rust', 3, false);
  K.line([[x - h * 0.1, gy - h * 0.86], [x + h * 0.1, gy - h * 0.86]], 'terracotta', 5, false);
  K.line([[x, gy - h], [x, gy - h * 0.72]], 'terracotta', 5, false);
}
/** A star with eight points. */
function star(K: Stitcher, x: number, y: number, r: number, ink: Wool = 'ochre'): void {
  const pts: Pt[] = [];
  for (let i = 0; i < 16; i++) pts.push([x + Math.cos((i / 16) * Math.PI * 2) * (i % 2 ? r * 0.45 : r), y + Math.sin((i / 16) * Math.PI * 2) * (i % 2 ? r * 0.45 : r)]);
  K.shape(pts, ink, 'dark', false);
}
const EAST: Man = { robe: true, turban: true };
const FRANK: Man = { hair: 'rust', helmet: true, mail: true };

Object.assign(SCENES, {
  baghdad: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      dome(K, x + 170, GROUND, 260, 300, false);
      throne(K, x + 400, GROUND, 220, 1);
      man(K, x + 402, GROUND - 70, 226, { ...EAST, seated: true, tunic: 'navy', cloak: 'ochre', arm: 'forward' });
      // A Greek book going in at one end and an Arabic one coming out at the other.
      man(K, x + 540, GROUND, 206, { f: -1, robe: true, tunic: 'buff', arm: 'forward' });
      book(K, x + 600, GROUND - 150, 30, 'navy');
      man(K, x + 670, GROUND - 6, 196, { ...EAST, f: -1, seated: true, tunic: 'sage', arm: 'forward', hold: 'needle' });
      man(K, x + 770, GROUND, 204, { f: -1, priest: true, tunic: 'terracotta', arm: 'point' });
      for (let i = 0; i < 4; i++) K.shape([[x + 810, GROUND - i * 13], [x + 866, GROUND - i * 13], [x + 866, GROUND - 12 - i * 13], [x + 810, GROUND - 12 - i * 13]], shields[i], 'dark', false);
      creature(K, 16, x + 930, GROUND - 56, 140);
    },
  ],
  algebra: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      // The stars, and a man measuring them.
      for (const [sx, sy] of [[60, 90], [150, 60], [240, 100], [300, 70]]) star(K, x + sx, sy, 12);
      man(K, x + 130, GROUND, 214, { ...EAST, tunic: 'navy', arm: 'up' });
      K.oval(x + 176, GROUND - 236, 20, 20, 'ochre');
      K.line([[x + 160, GROUND - 248], [x + 192, GROUND - 224]], 'dark', 2, false);
      // The numbers.
      K.shape([[x + 300, GROUND - 250], [x + 560, GROUND - 250], [x + 560, GROUND - 120], [x + 300, GROUND - 120]], 'buff', 'dark', false);
      K.words('1 2 3 4 5', x + 430, GROUND - 212, 30);
      K.words('6 7 8 9 0', x + 430, GROUND - 160, 30);
      for (const lx of [320, 540]) K.line([[x + lx, GROUND - 120], [x + lx, GROUND]], 'rust', 4);
      man(K, x + 610, GROUND, 208, { ...EAST, f: -1, tunic: 'terracotta', arm: 'point' });
      // The doctor, and the man with the lamp.
      man(K, x + 720, GROUND, 210, { ...EAST, tunic: 'sage', arm: 'forward' });
      man(K, x + 800, GROUND - 6, 190, { f: -1, lady: true, seated: true, tunic: 'ochre', arm: 'down' });
      flames(K, x + 890, GROUND - 120, 26);
      K.line([[x + 886, GROUND], [x + 886, GROUND - 118]], 'rust', 4);
      man(K, x + 950, GROUND, 204, { ...EAST, f: -1, tunic: 'teal', arm: 'face' });
    },
  ],
  toledo: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      arches(K, x + 20, 3, GROUND, 70, 230);
      // One reads the Arabic aloud; one writes it down in Latin.
      K.shape([[x + 280, GROUND - 110], [x + 520, GROUND - 110], [x + 520, GROUND - 96], [x + 280, GROUND - 96]], 'buff', 'dark', false);
      for (const lx of [296, 504]) K.line([[x + lx, GROUND - 96], [x + lx, GROUND]], 'rust', 5);
      man(K, x + 250, GROUND, 208, { ...EAST, tunic: 'teal', arm: 'point' });
      book(K, x + 330, GROUND - 130, 30, 'navy');
      man(K, x + 400, GROUND, 200, { robe: true, tunic: 'ochre', arm: 'forward' });
      book(K, x + 470, GROUND - 130, 30);
      man(K, x + 560, GROUND - 6, 200, { f: -1, seated: true, priest: true, tunic: 'navy', arm: 'forward', hold: 'needle' });
      K.line([[x + 640, 60], [x + 640, GROUND + 20]], 'rust', 2, false);
      // Two ways to write the same number.
      man(K, x + 720, GROUND, 208, { tunic: 'terracotta', hair: 'rust', arm: 'point' });
      K.words('48', x + 790, GROUND - 230, 34);
      K.words('XLVIII', x + 900, GROUND - 230, 26);
      man(K, x + 930, GROUND, 204, { ...ENGLISH, f: -1, tunic: 'sage', arm: 'face' });
      coins(K, x + 800, GROUND - 6, 10);
    },
  ],
  clermont: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      church(K, x + 90, GROUND, 150, 230);
      K.shape([[x + 190, GROUND], [x + 190, GROUND - 46], [x + 300, GROUND - 46], [x + 300, GROUND]], 'rust', 'dark', false);
      man(K, x + 244, GROUND - 46, 240, { priest: true, tunic: 'buff', cloak: 'terracotta', arm: 'point', hold: 'staff' });
      standard(K, x + 350, GROUND, 300);
      // Knights, and behind them the poor, who went first.
      for (let i = 0; i < 4; i++) man(K, x + 420 + i * 62, GROUND, 216 - (i % 2) * 6, { ...FRANK, f: -1, tunic: shields[i], arm: 'up', hold: i % 2 ? 'sword' : 'spear' });
      man(K, x + 700, GROUND, 196, { ...ENGLISH, f: -1, tunic: 'sage', arm: 'up', hold: 'staff' });
      man(K, x + 770, GROUND, 190, { f: -1, lady: true, tunic: 'rust', arm: 'up' });
      man(K, x + 840, GROUND, 140, { f: -1, tunic: 'teal', arm: 'up' });
      creature(K, 12, x + 930, GROUND - 44, 110);
    },
  ],
  jerusalem: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      wall(K, x + 270, x + 500, GROUND, 200);
      // The siege tower, and the first man over.
      K.shape([[x + 190, GROUND], [x + 196, GROUND - 290], [x + 260, GROUND - 290], [x + 266, GROUND]], 'rust', 'dark', false);
      for (let i = 1; i < 5; i++) K.line([[x + 194, GROUND - i * 58], [x + 264, GROUND - i * 58]], 'dark', 1.4, false);
      man(K, x + 300, GROUND - 204, 150, { ...FRANK, tunic: 'terracotta', arm: 'up', hold: 'sword' });
      standard(K, x + 228, GROUND - 290, 90);
      man(K, x + 70, GROUND, 214, { ...FRANK, tunic: 'navy', arm: 'up', hold: 'spear' });
      man(K, x + 140, GROUND, 208, { ...FRANK, tunic: 'ochre', arm: 'forward', hold: 'axe' });
      flames(K, x + 420, GROUND - 216, 50);
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      dome(K, x + 100, GROUND, 170, 220, false);
      flames(K, x + 90, GROUND - 240, 44);
      // The road to Baghdad.
      man(K, x + 230, GROUND, 200, { ...EAST, tunic: 'sage', arm: 'down', hold: 'staff' });
      man(K, x + 300, GROUND, 190, { lady: true, tunic: 'navy', arm: 'face' });
      man(K, x + 356, GROUND, 130, { tunic: 'ochre', arm: 'forward' });
      man(K, x + 440, GROUND, 214, { ...EAST, tunic: 'buff', cloak: 'teal', arm: 'point' });
    },
  ],
  saladin: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      wall(K, x + 20, x + 260, GROUND, 170);
      dome(K, x + 140, GROUND - 170, 120, 150, false);
      // The surrender, and the price.
      man(K, x + 320, GROUND, 208, { hair: 'rust', mail: true, tunic: 'navy', arm: 'forward' });
      K.shape([[x + 368, GROUND], [x + 368, GROUND - 34], [x + 428, GROUND - 34], [x + 428, GROUND]], 'rust', 'dark', false);
      coins(K, x + 374, GROUND - 38, 8);
      horse(K, x + 520, GROUND, 156, 'terracotta', -1, { ...EAST, tunic: 'ochre', cloak: 'navy', arm: 'forward', hold: 'sword' });
      man(K, x + 640, GROUND, 196, { lady: true, tunic: 'sage', arm: 'down' });
      man(K, x + 700, GROUND, 130, { tunic: 'teal', arm: 'forward' });
      K.line([[x + 760, 60], [x + 760, GROUND + 20]], 'rust', 2, false);
      // Two neighbours, who will be fighting again next year.
      man(K, x + 830, GROUND, 214, { ...EAST, tunic: 'teal', cloak: 'buff', arm: 'forward' });
      man(K, x + 930, GROUND, 214, { hair: 'rust', mail: true, f: -1, tunic: 'buff', arm: 'forward' });
      K.line([[x + 922, GROUND - 150], [x + 938, GROUND - 150]], 'terracotta', 4, false);
      K.line([[x + 930, GROUND - 162], [x + 930, GROUND - 136]], 'terracotta', 4, false);
    },
  ],
  roads: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      // The caravan.
      for (let i = 0; i < 3; i++) creature(K, 16, x + 90 + i * 130, GROUND - 60, 150);
      man(K, x + 430, GROUND, 200, { ...EAST, tunic: 'navy', arm: 'point', hold: 'staff' });
      // The king of Mali, as the mapmaker drew him: crowned, and holding up a nugget of gold.
      throne(K, x + 560, GROUND, 220, 1);
      man(K, x + 562, GROUND - 70, 230, { seated: true, crown: true, robe: true, tunic: 'sage', cloak: 'ochre', hair: 'dark', skin: 'rust', arm: 'up' });
      K.oval(x + 624, GROUND - 300, 16, 16, 'ochre');
      // A rider of the steppe, and a ship for the last leg.
      horse(K, x + 750, GROUND, 130, 'rust', 1, { tunic: 'teal', hair: 'dark', arm: 'forward', hold: 'bow' }, true);
      waves(K, x + 850, x + 1000, GROUND - 20, 4);
      ship(K, x + 925, GROUND - 44, 140, 1, ['terracotta', 'ochre'], 1);
    },
  ],
  plague: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      // Three planets in one place, and the men who blamed them.
      K.oval(x + 300, 100, 22, 22, 'ochre');
      K.oval(x + 346, 86, 16, 16, 'terracotta');
      K.oval(x + 382, 112, 13, 13, 'buff');
      K.oval(x + 300, 100, 34, 9, null, 'dark', -0.3);
      man(K, x + 120, GROUND, 220, { robe: true, tunic: 'terracotta', hair: 'rust', arm: 'point' });
      man(K, x + 200, GROUND, 212, { robe: true, tunic: 'navy', hair: 'rust', arm: 'up' });
      book(K, x + 160, GROUND - 120, 26, 'navy');
      K.shape([[x + 280, GROUND - 30], [x + 470, GROUND - 30], [x + 470, GROUND - 46], [x + 280, GROUND - 46]], 'rust', 'dark', false);
      man(K, x + 462, GROUND - 48, 180, { tilt: 1, tunic: 'buff' });
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 260);
      waves(K, x + 250, x + 500, GROUND - 20, 4);
      ship(K, x + 380, GROUND - 44, 220, -1, ['buff', 'navy'], 0);
      // Down the rope and on to the quay.
      K.line([[x + 300, GROUND - 70], [x + 220, GROUND]], 'rust', 2.4, false);
      creature(K, 17, x + 250, GROUND - 46, 46);
      creature(K, 17, x + 170, GROUND - 16, 52);
      creature(K, 17, x + 90, GROUND - 16, 52);
      // A gravestone by a lake, a long way east.
      K.shape([[x + 20, GROUND], [x + 24, GROUND - 70], [x + 42, GROUND - 86], [x + 60, GROUND - 70], [x + 64, GROUND]], 'buff', 'dark', false);
      K.line([[x + 42, GROUND - 74], [x + 42, GROUND - 40]], 'dark', 2, false);
      K.line([[x + 32, GROUND - 62], [x + 52, GROUND - 62]], 'dark', 2, false);
    },
  ],
  after: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 1000);
      // A lord with a purse, and a ploughman who has heard a better offer.
      horse(K, x + 90, GROUND, 150, 'navy', 1, { hair: 'rust', tunic: 'terracotta', cloak: 'ochre', arm: 'forward' });
      coins(K, x + 196, GROUND - 6, 6);
      man(K, x + 270, GROUND, 208, { ...ENGLISH, f: -1, tunic: 'sage', arm: 'up', hold: 'staff' });
      // The preacher and his rhyme.
      K.shape([[x + 400, GROUND], [x + 408, GROUND - 40], [x + 480, GROUND - 40], [x + 488, GROUND]], 'sage', 'dark', false);
      man(K, x + 444, GROUND - 40, 220, { priest: true, tunic: 'rust', arm: 'up' });
      for (let i = 0; i < 4; i++) man(K, x + 560 + i * 62, GROUND, 204 - (i % 2) * 8, { ...ENGLISH, f: -1, tunic: shields[i + 1], arm: 'up', hold: (['staff', 'axe', 'bow', 'staff'] as const)[i] });
      flames(K, x + 810, GROUND - 8, 36);
      sheet(K, x + 806, GROUND - 66, 30);
      // The king, who is fourteen.
      horse(K, x + 920, GROUND, 120, 'terracotta', -1, { crown: true, tunic: 'navy', arm: 'forward' });
    },
  ],
  press: [
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      press(K, x + 260, GROUND, 300);
      man(K, x + 130, GROUND, 214, { hair: 'rust', tunic: 'navy', arm: 'forward' });
      // The sheets, hung up to dry.
      K.line([[x + 330, GROUND - 320], [x + 490, GROUND - 330]], 'rust', 2, false);
      for (let i = 0; i < 3; i++) sheet(K, x + 366 + i * 48, GROUND - 322 - i * 3, 36);
      man(K, x + 440, GROUND, 180, { f: -1, tunic: 'sage', arm: 'forward' });
      sheet(K, x + 392, GROUND - 170, 34);
    },
    (K: Stitcher, x: number) => {
      ground(K, x, x + 500);
      // A roof with its corners turned up, and under it the type in its frame.
      K.shape([[x + 60, GROUND - 300], [x + 100, GROUND - 340], [x + 400, GROUND - 340], [x + 440, GROUND - 300], [x + 470, GROUND - 316], [x + 440, GROUND - 280], [x + 60, GROUND - 280], [x + 30, GROUND - 316]], 'teal', 'dark', false);
      for (const px of [80, 420]) K.line([[x + px, GROUND - 280], [x + px, GROUND]], 'terracotta', 7, false);
      K.shape([[x + 170, GROUND - 110], [x + 340, GROUND - 110], [x + 340, GROUND - 96], [x + 170, GROUND - 96]], 'buff', 'dark', false);
      for (const lx of [184, 326]) K.line([[x + lx, GROUND - 96], [x + lx, GROUND]], 'rust', 5);
      for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) K.shape([[x + 186 + i * 20, GROUND - 146 + j * 18], [x + 202 + i * 20, GROUND - 146 + j * 18], [x + 202 + i * 20, GROUND - 132 + j * 18], [x + 186 + i * 20, GROUND - 132 + j * 18]], (i + j) % 3 ? 'buff' : 'terracotta', 'dark', false);
      man(K, x + 130, GROUND, 206, { robe: true, hair: 'dark', tunic: 'navy', arm: 'forward' });
      man(K, x + 390, GROUND, 200, { f: -1, priest: true, tunic: 'ochre', arm: 'forward' });
      book(K, x + 346, GROUND - 170, 24, 'navy');
    },
  ],
});

/** A trailing vine with leaves, as scribes of every faith drew down their margins. */
export function vine(K: Stitcher, x0: number, x1: number, y: number, s: number): void {
  const pts: Pt[] = [];
  for (let x = x0; x <= x1; x += 8) pts.push([x, y + Math.sin((x - x0) * 0.05) * s * 0.9]);
  K.line(pts, 'sage', 2.2);
  for (let x = x0 + 16, i = 0; x < x1; x += 31.4, i++) K.oval(x, y + (i % 2 ? s : -s) * 1.1, s * 1.1, s * 0.6, i % 3 ? 'teal' : 'terracotta', null, i % 2 ? 0.6 : -0.6);
}
