/**
 * The Pop-up Book: the paper engineering.
 *
 * A spread is two pages hinged at a spine. Everything here is worked out
 * exactly, as stiff paper would move: no piece stretches or bends anywhere
 * but at its folds, and every piece lies flat when the book is shut. Nothing
 * is faked for the look of it.
 *
 * Lengths are in centimetres, so that the same numbers can be printed, cut
 * out and glued. The spine runs along z, with +z towards the reader. The
 * pages lie in the plane y = 0 when the book is open flat.
 *
 * The mechanisms:
 *  - V-fold: a piece creased down the middle, glued to both pages along two
 *    lines that meet at a point on the spine. It stands when the book is flat.
 *  - Tent: a strip creased once, glued to each page along a line parallel to
 *    the spine. To shut flat, the longer side must be glued nearer the spine,
 *    by exactly the difference in the two lengths.
 *  - Platform: a flat top held up level over the spine by three legs of the
 *    same height, one of them on the spine itself.
 *  - Flap: a piece hinged to one page, lifted by hand.
 *  - Sticker: a picture glued flat.
 */

/** A page: its width from spine to edge, and its length along the spine. */
export const W = 13;
export const L = 19;

export type Kind = 'vfold' | 'tent' | 'platform' | 'flap' | 'sticker';
export interface Piece {
  kind: Kind;
  /** What is drawn on it. */
  art: string;
  /** Across the spread: for a flap or sticker, where it is; for a tent, how far off-centre. */
  x: number;
  /** Along the spine. */
  z: number;
  /** V-fold: each wing's width. Tent, platform: length along the spine. Flap, sticker: width. */
  w: number;
  /** V-fold, platform: height. Tent: how much longer each side is than it need be to lie flat. Flap, sticker: height. */
  h: number;
  /** V-fold: the angle, in degrees, between each glue line and the spine. */
  angle: number;
  /** Tent, platform: how far from the spine it is glued. */
  reach: number;
  /** V-fold: opening towards the reader, where otherwise its point is towards the reader. */
  flip: boolean;
}
export interface Spread {
  pieces: Piece[];
}

export type V3 = [number, number, number];
/** A flat four-cornered piece of paper, and the part of the picture that is on it. */
export interface Quad {
  /** Corners in order: picture's bottom-left, bottom-right, top-right, top-left. */
  c: [V3, V3, V3, V3];
  uv: [number, number, number, number];
  /** False for legs and supports, which are plain paper. */
  art: boolean;
}

export const STANDS: Kind[] = ['vfold', 'tent', 'platform'];
export const stands = (p: Piece) => STANDS.includes(p.kind);

/** How far each page is tilted up from flat, when the book is `open` (0 shut, 1 flat). */
export const tilt = (open: number) => ((1 - open) * Math.PI) / 2;

/** A point given on a page (how far from the spine, how far along, how high above the paper), in the world. */
export function onPage(side: number, u: number, z: number, n: number, alpha: number): V3 {
  return [side * (u * Math.cos(alpha) - n * Math.sin(alpha)), u * Math.sin(alpha) + n * Math.cos(alpha), z];
}

const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

/** Where the tent's ridge is: the two sides have fixed lengths, so it is where two circles cross. */
function ridge(a: number, b: number, extra: number, alpha: number): { A: V3; B: V3; P: V3; p: number; q: number } {
  const A = onPage(-1, a, 0, 0, alpha);
  const B = onPage(1, b, 0, 0, alpha);
  const p = b + extra;
  const q = a + extra;
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const d = Math.max(1e-9, Math.hypot(dx, dy));
  const along = (p * p - q * q + d * d) / (2 * d);
  const up = Math.sqrt(Math.max(0, p * p - along * along));
  // Of the two crossings, the one on the side the pages open towards.
  let nx = -dy / d;
  let ny = dx / d;
  if (ny < 0 || (Math.abs(ny) < 1e-9 && nx > 0)) {
    nx = -nx;
    ny = -ny;
  }
  // With the book shut the two glue lines lie on one line, and the ridge is out along it.
  if (d < 1e-6) return { A, B, P: [0, a + p, 0], p, q };
  return { A, B, P: [A[0] + (dx / d) * along + nx * up, A[1] + (dy / d) * along + ny * up, 0], p, q };
}

/** The flat pieces of paper a mechanism is made of, where they are when the book is `open` by this much. */
export function quads(piece: Piece, open: number, lift = 0): Quad[] {
  const alpha = tilt(open);
  const at = (v: V3, z: number): V3 => [v[0], v[1], z];
  if (piece.kind === 'vfold') {
    const beta = (piece.angle * Math.PI) / 180;
    const s = piece.flip ? 1 : -1;
    // The crease stays square to both glue lines. That fixes how far it leans as the book shuts.
    const delta = Math.atan2(Math.sin(beta) * Math.sin(alpha), Math.cos(beta)) + Math.PI / 2;
    const crease: V3 = [0, Math.sin(delta), s * Math.cos(delta)];
    const V: V3 = [0, 0, piece.z];
    const top = add(V, crease, piece.h);
    return [-1, 1].map((side) => {
      const glue: V3 = [side * Math.sin(beta) * Math.cos(alpha), Math.sin(beta) * Math.sin(alpha), s * Math.cos(beta)];
      const foot = add(V, glue, piece.w);
      const far = add(foot, crease, piece.h);
      return side < 0 ? { c: [foot, V, top, far], uv: [0, 0, 0.5, 1], art: true } : { c: [V, foot, far, top], uv: [0.5, 0, 1, 1], art: true };
    }) as Quad[];
  }
  const z0 = piece.z - piece.w / 2;
  const z1 = piece.z + piece.w / 2;
  if (piece.kind === 'tent') {
    const { A, B, P, p, q } = ridge(piece.reach - piece.x, piece.reach + piece.x, piece.h, alpha);
    const split = p / (p + q);
    return [
      { c: [at(A, z1), at(P, z1), at(P, z0), at(A, z0)], uv: [0, 0, split, 1], art: true },
      { c: [at(P, z1), at(B, z1), at(B, z0), at(P, z0)], uv: [split, 0, 1, 1], art: true },
    ];
  }
  if (piece.kind === 'platform') {
    // The middle leg stands on the spine and stays upright; everything else keeps parallel to a page or to it.
    const A = onPage(-1, piece.reach, 0, 0, alpha);
    const B = onPage(1, piece.reach, 0, 0, alpha);
    const up: V3 = [0, piece.h, 0];
    const O: V3 = [0, 0, 0];
    const C = up;
    const A2 = add(A, up);
    const B2 = add(B, up);
    return [
      { c: [at(A2, z1), at(C, z1), at(C, z0), at(A2, z0)], uv: [0, 0, 0.5, 1], art: true },
      { c: [at(C, z1), at(B2, z1), at(B2, z0), at(C, z0)], uv: [0.5, 0, 1, 1], art: true },
      { c: [at(A, z1), at(A, z0), at(A2, z0), at(A2, z1)], uv: [0, 0, 1, 1], art: false },
      { c: [at(B, z0), at(B, z1), at(B2, z1), at(B2, z0)], uv: [0, 0, 1, 1], art: false },
      { c: [at(O, z1), at(O, z0), at(C, z0), at(C, z1)], uv: [0, 0, 1, 1], art: false },
    ];
  }
  // A flap or a sticker: on one page. The flap is hinged along its far edge.
  const side = piece.x < 0 ? -1 : 1;
  const hinge = piece.z - piece.h / 2;
  const height = piece.kind === 'flap' ? 0.03 : 0.012;
  const corner = (X: number, t: number): V3 => onPage(side, Math.abs(X), hinge + t * Math.cos(lift), height + t * Math.sin(lift), alpha);
  const x0 = piece.x - piece.w / 2;
  const x1 = piece.x + piece.w / 2;
  return [{ c: [corner(x0, piece.h), corner(x1, piece.h), corner(x1, 0), corner(x0, 0)], uv: [0, 0, 1, 1], art: true }];
}

/** How high a piece stands above the open book. */
export const heightOf = (piece: Piece) => Math.max(...quads(piece, 1).flatMap((q) => q.c.map((c) => c[1])));

// ---- What can go wrong ----

/** Does a piece shut inside the book, and is its glue on the page? A sentence if not. */
export function fits(piece: Piece): string | null {
  if (!stands(piece)) {
    const x0 = piece.x - piece.w / 2;
    const x1 = piece.x + piece.w / 2;
    if (x0 * x1 < 0 || Math.min(Math.abs(x0), Math.abs(x1)) < 0.3) return piece.kind === 'flap' ? 'A flap has to be on one page: it cannot cross the fold in the middle.' : 'This would be creased by the fold in the middle. Move it onto one page.';
    if (Math.max(Math.abs(x0), Math.abs(x1)) > W || Math.abs(piece.z) + piece.h / 2 > L / 2) return 'This hangs off the edge of the page.';
    return null;
  }
  if (piece.kind !== 'vfold' && (piece.reach - Math.abs(piece.x) < 0.5 || piece.reach + Math.abs(piece.x) > W)) return 'Its glue has to be on the pages, one side on each.';
  for (const q of quads(piece, 1)) for (const c of q.c) if (Math.abs(c[1]) < 1e-6 && (Math.abs(c[0]) > W + 1e-6 || Math.abs(c[2]) > L / 2 + 1e-6)) return 'Its glue has to be on the pages.';
  for (const q of quads(piece, 0)) for (const c of q.c) if (c[1] > W + 1e-6 || c[1] < -1e-6 || Math.abs(c[2]) > L / 2 + 1e-6) return 'This pokes out of the book when it shuts. Make it shorter, or move it.';
  return null;
}

/** Does the line from a to b pass through the triangle? (Not counting a touch at the very ends or edges.) */
function pierces(a: V3, b: V3, t0: V3, t1: V3, t2: V3): boolean {
  const e1 = add(t1, t0, -1);
  const e2 = add(t2, t0, -1);
  const dir = add(b, a, -1);
  const h: V3 = [dir[1] * e2[2] - dir[2] * e2[1], dir[2] * e2[0] - dir[0] * e2[2], dir[0] * e2[1] - dir[1] * e2[0]];
  const det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
  if (Math.abs(det) < 1e-9) return false;
  const s = add(a, t0, -1);
  const u = (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]) / det;
  const q: V3 = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
  const v = (dir[0] * q[0] + dir[1] * q[1] + dir[2] * q[2]) / det;
  const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
  const eps = 0.01;
  return u > eps && v > eps && u + v < 1 - eps && t > eps && t < 1 - eps;
}
function crossing(a: Quad, b: Quad): boolean {
  const tris = (q: Quad): [V3, V3, V3][] => [
    [q.c[0], q.c[1], q.c[2]],
    [q.c[0], q.c[2], q.c[3]],
  ];
  const edges = (q: Quad): [V3, V3][] => [0, 1, 2, 3].map((i) => [q.c[i], q.c[(i + 1) % 4]]);
  for (const [one, other] of [[a, b], [b, a]]) for (const [p, q] of edges(one)) for (const [t0, t1, t2] of tris(other)) if (pierces(p, q, t0, t1, t2)) return true;
  return false;
}

/**
 * Everything wrong with a spread: for each piece that has a fault, a sentence
 * saying what. Two pieces that would pass through each other at any point as
 * the book opens are both at fault.
 */
export function problems(spread: Spread): (string | null)[] {
  const out: (string | null)[] = spread.pieces.map(fits);
  const standing = spread.pieces.map((p, i) => ({ p, i })).filter(({ p }) => stands(p));
  for (const open of [1, 0.8, 0.6, 0.4, 0.2]) {
    const at = standing.map(({ p }) => quads(p, open));
    for (let a = 0; a < standing.length; a++)
      for (let b = a + 1; b < standing.length; b++)
        if (at[a].some((qa) => at[b].some((qb) => crossing(qa, qb)))) {
          out[standing[a].i] ??= 'These two bump into each other as the book opens. Move one of them.';
          out[standing[b].i] ??= 'These two bump into each other as the book opens. Move one of them.';
        }
  }
  return out;
}

/** Is this sticker hidden under a shut flap? */
export function hidden(spread: Spread, sticker: Piece): boolean {
  return spread.pieces.some((f) => f.kind === 'flap' && Math.sign(f.x) === Math.sign(sticker.x) && Math.abs(f.x - sticker.x) + sticker.w / 2 <= f.w / 2 + 0.05 && Math.abs(f.z - sticker.z) + sticker.h / 2 <= f.h / 2 + 0.05);
}

/** A new piece of each kind, at a size and place that works. */
export function fresh(kind: Kind, art: string): Piece {
  const base = { kind, art, x: 0, z: 0, flip: false, angle: 50, reach: 4 };
  if (kind === 'vfold') return { ...base, w: 4, h: 6 };
  if (kind === 'tent') return { ...base, w: 6, h: 2.5, reach: 3.5 };
  if (kind === 'platform') return { ...base, w: 6, h: 2.5 };
  if (kind === 'flap') return { ...base, x: 6.5, z: 4, w: 5, h: 4 };
  return { ...base, x: -6.5, z: 4, w: 3.5, h: 3.5 };
}

// ---- Checking the geometry itself ----

/**
 * Paper does not stretch. This opens every kind of piece to many angles and
 * requires that every edge keeps its length, that every glued edge stays on
 * its page, and that with the book shut everything lies in the one plane.
 */
export function checkFold(): string[] {
  const bad: string[] = [];
  let seed = 12345;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  for (let n = 0; n < 200; n++) {
    const kind = STANDS[n % 3];
    const piece: Piece = { kind, art: '', x: kind === 'tent' ? (rand() - 0.5) * 3 : 0, z: (rand() - 0.5) * 6, w: 2 + rand() * 4, h: 1 + rand() * 5, angle: 30 + rand() * 40, reach: 2.5 + rand() * 3, flip: rand() < 0.5 };
    const flat = quads(piece, 1);
    for (const open of [0, 0.13, 0.37, 0.5, 0.71, 0.9]) {
      const now = quads(piece, open);
      const alpha = tilt(open);
      now.forEach((q, i) => {
        for (let k = 0; k < 4; k++) {
          // Sides and diagonals: if all keep their lengths, the piece has not bent.
          for (const j of [(k + 1) % 4, (k + 2) % 4]) if (Math.abs(dist(q.c[k], q.c[j]) - dist(flat[i].c[k], flat[i].c[j])) > 1e-6) bad.push(`${kind}: an edge changed length at ${open}`);
          // A corner that was on the paper is still on its page.
          if (Math.abs(flat[i].c[k][1]) < 1e-9 && Math.abs(flat[i].c[k][0]) > 1e-9) {
            const side = Math.sign(flat[i].c[k][0]);
            const want = onPage(side, Math.abs(flat[i].c[k][0]), flat[i].c[k][2], 0, alpha);
            if (dist(want, q.c[k]) > 1e-6) bad.push(`${kind}: came unglued at ${open}`);
          }
          if (open === 0 && Math.abs(q.c[k][0]) > 1e-6) bad.push(`${kind}: does not shut flat`);
        }
      });
      // Pieces that share a fold still meet along it.
      if (kind !== 'platform' && dist(now[0].c[kind === 'vfold' ? 1 : 1], now[1].c[0]) > 1e-6) bad.push(`${kind}: tore along its fold at ${open}`);
    }
  }
  return [...new Set(bad)];
}
