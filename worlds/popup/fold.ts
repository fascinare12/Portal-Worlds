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
 *  - Stand-up: a piece that stands on one page, facing the reader, anywhere
 *    out from the spine. It is one wing of a lopsided V-fold: its glue line
 *    runs straight out from the spine, and a small brace on the other page
 *    pulls it upright. The angles are chosen so that it is exactly upright
 *    when the book is flat, and exactly flat when the book is shut.
 *  - Double V: a V-fold with a second, smaller V-fold glued across its own
 *    crease. The two wings of the first are to the second what the two pages
 *    are to the first, and the same rule moves it.
 *  - Pull tab: a picture on a strip that slides along one page, worked by hand.
 *  - Flap: a piece hinged to one page, lifted by hand.
 *  - Sticker: a picture glued flat.
 */

/** A page: its width from spine to edge, and its length along the spine. */
export const W = 13;
export const L = 19;

export type Kind = 'vfold' | 'tent' | 'platform' | 'flap' | 'sticker' | 'stand' | 'double' | 'slide';
export interface Piece {
  kind: Kind;
  /** What is drawn on it. */
  art: string;
  /** Across the spread: for a flap, sticker or stand-up, where it is; for a tent, how far off-centre. */
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
  /** Double V: what is drawn on the small fold inside. Without it, the same as the big one. */
  art2?: string;
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
  /** Part of a double V's inner fold, which has a picture of its own. */
  inner?: boolean;
}

export const STANDS: Kind[] = ['vfold', 'tent', 'platform', 'stand', 'double'];
/** Pieces worked by hand: a tap lifts a flap, or pulls a tab out and pushes it back. */
export const moves = (p: Piece) => p.kind === 'flap' || p.kind === 'slide';
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

const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ---- A V-fold, on any hinge ----

/**
 * A V-fold glued across a hinge: two flat leaves meeting along a line. The
 * hinge may be the book itself (the leaves are the pages, the line the
 * spine), or the crease of another V-fold (the leaves are its wings).
 *
 * `along` is the hinge line's direction, the way the glue lines run; `left`
 * and `right` point out across each leaf, square to it. The new crease is
 * square to both glue lines, on the side that `toward` points to.
 */
function vOn(at: V3, along: V3, left: V3, right: V3, toward: V3, beta: number, w: number, h: number): { quads: Quad[]; crease: V3; glueL: V3; glueR: V3 } {
  const glue = (out: V3): V3 => [along[0] * Math.cos(beta) + out[0] * Math.sin(beta), along[1] * Math.cos(beta) + out[1] * Math.sin(beta), along[2] * Math.cos(beta) + out[2] * Math.sin(beta)];
  const glueL = glue(left);
  const glueR = glue(right);
  let crease = cross(glueL, glueR);
  const size = Math.hypot(crease[0], crease[1], crease[2]);
  if (size < 1e-9) {
    // The leaves lie on one another: the hinge is shut, and the piece lies flat between them.
    crease = [right[0] * Math.cos(beta) - along[0] * Math.sin(beta), right[1] * Math.cos(beta) - along[1] * Math.sin(beta), right[2] * Math.cos(beta) - along[2] * Math.sin(beta)];
  } else {
    const sign = dot(crease, toward) >= 0 ? 1 / size : -1 / size;
    crease = [crease[0] * sign, crease[1] * sign, crease[2] * sign];
  }
  const top = add(at, crease, h);
  const footL = add(at, glueL, w);
  const footR = add(at, glueR, w);
  return {
    quads: [
      { c: [footL, at, top, add(footL, crease, h)], uv: [0, 0, 0.5, 1], art: true },
      { c: [at, footR, add(footR, crease, h), top], uv: [0.5, 0, 1, 1], art: true },
    ],
    crease,
    glueL,
    glueR,
  };
}
/** The leaves of the book itself, for a V-fold whose glue lines run towards or away from the reader. */
const onBook = (z: number, s: number, alpha: number, beta: number, w: number, h: number) => vOn([0, 0, z], [0, 0, s], [-Math.cos(alpha), Math.sin(alpha), 0], [Math.cos(alpha), Math.sin(alpha), 0], [0, 1, 0], beta, w, h);

/** How the second fold of a double V is sized and placed from the first. */
export function inner(piece: Piece): { up: number; w: number; h: number } {
  const beta = (piece.angle * Math.PI) / 180;
  const up = piece.h * 0.3;
  const w = Math.min(piece.w * 0.62, (piece.h * 0.62) / Math.cos(beta));
  // With the book flat, the second crease slopes down towards the page. It may be only so long that its tip stays clear.
  const first = onBook(0, 1, 0, beta, piece.w, piece.h);
  const slope = vOn([0, 0, 0], first.crease, first.glueL, first.glueR, add(first.glueL, first.glueR), beta, 1, 1).crease[1];
  return { up, w, h: Math.min(piece.h * 0.5, slope < -1e-6 ? (up - 0.25) / -slope : Infinity) };
}

// ---- The stand-up ----

/** The brace's glue line makes this angle with the spine. */
const BRACE = Math.PI / 6;
/**
 * The angle, on the piece, between its foot and the crease. With the foot
 * running straight out from the spine, the piece is upright in the open book
 * exactly when tan(this) = 2 tan(brace angle).
 */
const LEAN = Math.atan(2 * Math.tan(BRACE));
/** And the brace's own corner: what makes the two shut flat together. */
const BRACE_CORNER = Math.PI / 2 + LEAN - BRACE;
/** How high the low strip is that joins the picture to the crease, and how long the brace's foot is. */
export const STRIP = 1.5;
export const BRACE_FOOT = 3;
export const standAngles = { brace: BRACE, lean: LEAN, corner: BRACE_CORNER };
/** The nearest the picture's inner edge may come to the spine: clear of the crease. */
export const STAND_CLEAR = STRIP / Math.tan(LEAN) + 0.2;


function standUp(piece: Piece, alpha: number): Quad[] {
  const sd = piece.x < 0 ? -1 : 1;
  const s = piece.flip ? 1 : -1;
  const V: V3 = [0, 0, piece.z];
  // The foot runs straight out across its page; the brace's foot slants across the other.
  const foot: V3 = [sd * Math.cos(alpha), Math.sin(alpha), 0];
  const brace: V3 = [-sd * Math.sin(BRACE) * Math.cos(alpha), Math.sin(BRACE) * Math.sin(alpha), s * Math.cos(BRACE)];
  // The crease keeps its angle to both feet. That leaves two directions; it is the upper one.
  const d = dot(foot, brace);
  const a = (Math.cos(LEAN) - d * Math.cos(BRACE_CORNER)) / (1 - d * d);
  const b = (Math.cos(BRACE_CORNER) - d * Math.cos(LEAN)) / (1 - d * d);
  const flatPart = add([foot[0] * a, foot[1] * a, foot[2] * a], brace, b);
  const out = cross(foot, brace);
  const t = Math.sqrt(Math.max(0, 1 - dot(flatPart, flatPart)) / Math.max(1e-12, dot(out, out)));
  const crease = add(flatPart, out, out[1] >= 0 ? t : -t);
  // Up the piece, square to its foot.
  const up: V3 = [(crease[0] - Math.cos(LEAN) * foot[0]) / Math.sin(LEAN), (crease[1] - Math.cos(LEAN) * foot[1]) / Math.sin(LEAN), (crease[2] - Math.cos(LEAN) * foot[2]) / Math.sin(LEAN)];
  const on = (p: number, q: number): V3 => add(add(V, foot, p), up, q);
  const mid = Math.abs(piece.x);
  const near = mid - piece.w / 2;
  const far = mid + piece.w / 2;
  // The picture, the right way round for the reader whichever page it is on.
  const [l, r] = sd > 0 ? [near, far] : [far, near];
  const k = Math.min(STRIP, piece.h);
  const top = add(V, crease, k / Math.sin(LEAN));
  return [
    { c: [on(l, 0), on(r, 0), on(r, piece.h), on(l, piece.h)], uv: [0, 0, 1, 1], art: true },
    // The low strip from the spine to the picture, cut slantwise where the crease is.
    { c: [V, on(near, 0), on(near, k), top], uv: [0, 0, 1, 1], art: false },
    // The brace: a triangle.
    { c: [V, add(V, brace, BRACE_FOOT), top, top], uv: [0, 0, 1, 1], art: false },
  ];
}

/** The flat pieces of paper a mechanism is made of, where they are when the book is `open` by this much. */
export function quads(piece: Piece, open: number, lift = 0): Quad[] {
  const alpha = tilt(open);
  const at = (v: V3, z: number): V3 => [v[0], v[1], z];
  if (piece.kind === 'stand') return standUp(piece, alpha);
  if (piece.kind === 'vfold') return onBook(piece.z, piece.flip ? 1 : -1, alpha, (piece.angle * Math.PI) / 180, piece.w, piece.h).quads;
  if (piece.kind === 'double') {
    // The first fold opens towards the reader, so that the second, inside it, is seen.
    const beta = (piece.angle * Math.PI) / 180;
    const first = onBook(piece.z, piece.flip ? -1 : 1, alpha, beta, piece.w, piece.h);
    const small = inner(piece);
    const from: V3 = add([0, 0, piece.z], first.crease, small.up);
    // To the second fold, the first one's crease is the spine and its wings are the pages.
    const second = vOn(from, first.crease, first.glueL, first.glueR, add(first.glueL, first.glueR), beta, small.w, small.h);
    return [...first.quads, ...second.quads.map((q) => ({ ...q, inner: true }))];
  }
  if (piece.kind === 'slide') {
    // A picture on a strip, in a track on one page. `lift` is how far it has been pulled: 0 to 2.3, as for a flap.
    const side = piece.x < 0 ? -1 : 1;
    const pulled = (Math.max(0, Math.min(2.3, lift)) / 2.3) * piece.reach;
    const [dx, dz] = piece.flip ? [side, 0] : [0, 1];
    const p = (X: number, z: number, n: number): V3 => onPage(side, Math.abs(X), z, n, alpha);
    const cx = piece.x + dx * pulled;
    const cz = piece.z + dz * pulled;
    const x0 = cx - piece.w / 2;
    const x1 = cx + piece.w / 2;
    const zt = cz - piece.h / 2;
    const zb = cz + piece.h / 2;
    // The track it runs in, and the tab that is pulled.
    const tr = 0.35;
    const ex = piece.x + dx * (piece.reach + piece.w / 2 + 1.1);
    const ez = piece.z + dz * (piece.reach + piece.h / 2 + 1.1);
    const track: Quad = piece.flip
      ? { c: [p(piece.x, piece.z + tr, 0.02), p(ex, piece.z + tr, 0.02), p(ex, piece.z - tr, 0.02), p(piece.x, piece.z - tr, 0.02)], uv: [0, 0, 1, 1], art: false }
      : { c: [p(piece.x - tr, ez, 0.02), p(piece.x + tr, ez, 0.02), p(piece.x + tr, piece.z, 0.02), p(piece.x - tr, piece.z, 0.02)], uv: [0, 0, 1, 1], art: false };
    const tx = cx + dx * (piece.w / 2 + 0.6);
    const tz = cz + dz * (piece.h / 2 + 0.6);
    const tab: Quad = { c: [p(tx - 0.6, tz + 0.6, 0.045), p(tx + 0.6, tz + 0.6, 0.045), p(tx + 0.6, tz - 0.6, 0.045), p(tx - 0.6, tz - 0.6, 0.045)], uv: [0, 0, 1, 1], art: false };
    return [{ c: [p(x0, zb, 0.05), p(x1, zb, 0.05), p(x1, zt, 0.05), p(x0, zt, 0.05)], uv: [0, 0, 1, 1], art: true }, track, tab];
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
  const x0 = piece.x - piece.w / 2;
  const x1 = piece.x + piece.w / 2;
  // On a spread nothing flat may lie across the fold. On the cover, which has no fold, it may lie across the middle.
  const across = x0 * x1 < 0;
  const corner = (X: number, t: number): V3 => onPage(across ? 1 : side, across ? X : Math.abs(X), hinge + t * Math.cos(lift), height + t * Math.sin(lift), alpha);
  return [{ c: [corner(x0, piece.h), corner(x1, piece.h), corner(x1, 0), corner(x0, 0)], uv: [0, 0, 1, 1], art: true }];
}

/** How high a piece stands above the open book. */
export const heightOf = (piece: Piece) => Math.max(...quads(piece, 1).flatMap((q) => q.c.map((c) => c[1])));

// ---- What can go wrong ----

/** Does a piece shut inside the book, and is its glue on the page? A sentence if not. */
export function fits(piece: Piece): string | null {
  if (piece.kind === 'slide') {
    // Everywhere it can be pulled to, and its tab, must be on the one page.
    const side = piece.x < 0 ? -1 : 1;
    for (const q of [...quads(piece, 1, 0), ...quads(piece, 1, 2.3)]) for (const c of q.c) if (c[0] * side < 0.3 || Math.abs(c[0]) > W + 1e-6 || Math.abs(c[2]) > L / 2 + 1e-6) return 'A pull tab has to stay on one page all the way along. Move it, or make it slide less far.';
    return null;
  }
  if (!stands(piece)) {
    const x0 = piece.x - piece.w / 2;
    const x1 = piece.x + piece.w / 2;
    if (x0 * x1 < 0 || Math.min(Math.abs(x0), Math.abs(x1)) < 0.3) return piece.kind === 'flap' ? 'A flap has to be on one page: it cannot cross the fold in the middle.' : 'This would be creased by the fold in the middle. Move it onto one page.';
    if (Math.max(Math.abs(x0), Math.abs(x1)) > W || Math.abs(piece.z) + piece.h / 2 > L / 2) return 'This hangs off the edge of the page.';
    return null;
  }
  if (piece.kind === 'stand' && Math.abs(piece.x) - piece.w / 2 < STAND_CLEAR - 1e-6) return 'This is too near the fold in the middle. Move it out a little: for the middle itself, use a V-fold.';
  if ((piece.kind === 'tent' || piece.kind === 'platform') && (piece.reach - Math.abs(piece.x) < 0.5 || piece.reach + Math.abs(piece.x) > W)) return 'Its glue has to be on the pages, one side on each.';
  for (const q of quads(piece, 1)) for (const c of q.c) if (Math.abs(c[1]) < 1e-6 && (Math.abs(c[0]) > W + 1e-6 || Math.abs(c[2]) > L / 2 + 1e-6)) return 'Its glue has to be on the pages.';
  // Part way shut, no corner may be pushed through a page.
  for (let open = 0.05; open < 1; open += 0.05) {
    const a = tilt(open);
    for (const q of quads(piece, open)) for (const c of q.c) if (c[1] * Math.cos(a) - Math.abs(c[0]) * Math.sin(a) < -0.02) return 'A corner of this catches on the other page as the book shuts. Move it out from the middle, or make it shorter.';
  }
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
  // The edges, and lines across the inside as well: two pieces whose ends line up exactly
  // cut through each other without any edge of one passing through the other.
  const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const edges = (q: Quad): [V3, V3][] => {
    const out: [V3, V3][] = [0, 1, 2, 3].map((i) => [q.c[i], q.c[(i + 1) % 4]]);
    for (const t of [0.07, 0.25, 0.5, 0.75, 0.93]) {
      out.push([mix(q.c[0], q.c[3], t), mix(q.c[1], q.c[2], t)]);
      out.push([mix(q.c[0], q.c[1], t), mix(q.c[3], q.c[2], t)]);
    }
    return out;
  };
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
  const BUMP = 'These two bump into each other as the book opens. Move one of them.';
  const SPINE = 'These two are both glued to the same part of the fold in the middle. Slide one of them along.';
  const clash = (a: number, b: number, why: string) => {
    out[standing[a].i] ??= why;
    out[standing[b].i] ??= why;
  };
  // What a piece takes up of the spine itself: a platform's middle leg stands along it;
  // a V-fold and a stand-up are each glued at one point of it.
  const onSpine = (p: Piece): [number, number] | null => (p.kind === 'platform' ? [p.z - p.w / 2, p.z + p.w / 2] : p.kind === 'tent' ? null : [p.z - 0.4, p.z + 0.4]);
  for (let a = 0; a < standing.length; a++)
    for (let b = a + 1; b < standing.length; b++) {
      const sa = onSpine(standing[a].p);
      const sb = onSpine(standing[b].p);
      if (sa && sb && sa[0] < sb[1] && sb[0] < sa[1]) clash(a, b, SPINE);
    }
  // A tent is hollow, and something low may stand inside it; but nothing may pass through its ridge.
  // So for this purpose each tent has a ceiling just under the ridge.
  const solid = (p: Piece, open: number): Quad[] => {
    const qs = quads(p, open);
    if (p.kind !== 'tent') return qs;
    const mix = (u: V3, v: V3): V3 => [u[0] + (v[0] - u[0]) * 0.96, u[1] + (v[1] - u[1]) * 0.96, u[2] + (v[2] - u[2]) * 0.96];
    const [left, right] = qs;
    return [...qs, { c: [mix(left.c[0], left.c[1]), mix(right.c[1], right.c[0]), mix(right.c[2], right.c[3]), mix(left.c[3], left.c[2])], uv: [0, 0, 1, 1], art: false }];
  };
  for (const open of [1, 0.8, 0.6, 0.4, 0.2]) {
    const at = standing.map(({ p }) => solid(p, open));
    for (let a = 0; a < standing.length; a++) for (let b = a + 1; b < standing.length; b++) if (at[a].some((qa) => at[b].some((qb) => crossing(qa, qb)))) clash(a, b, BUMP);
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
  if (kind === 'stand') return { ...base, x: 6, z: -2, w: 4, h: 6 };
  if (kind === 'double') return { ...base, w: 4.5, h: 7 };
  if (kind === 'slide') return { ...base, x: 5, z: -3, w: 3, h: 3, reach: 4 };
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
    const kind = STANDS[n % 5];
    const piece: Piece = { kind, art: '', x: kind === 'tent' ? (rand() - 0.5) * 3 : kind === 'stand' ? (rand() < 0.5 ? -1 : 1) * (5 + rand() * 4) : 0, z: (rand() - 0.5) * 6, w: 2 + rand() * 4, h: 1 + rand() * 5, angle: 30 + rand() * 40, reach: 2.5 + rand() * 3, flip: rand() < 0.5 };
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
      if (kind !== 'platform' && kind !== 'stand' && kind !== 'double' && dist(now[0].c[kind === 'vfold' ? 1 : 1], now[1].c[0]) > 1e-6) bad.push(`${kind}: tore along its fold at ${open}`);
    }
  }
  // A stand-up is exactly upright in the open book, and faces straight down the spine.
  for (const x of [-8, 5]) for (const q of quads({ kind: 'stand', art: '', x, z: 1, w: 4, h: 6, angle: 50, reach: 4, flip: false }, 1).slice(0, 2)) for (const c of q.c) if (Math.abs(c[2] - 1) > 1e-9) bad.push('stand-up: not upright when the book is open');
  return [...new Set(bad)];
}
