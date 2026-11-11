/**
 * Every picture in the Printer's World is drawn here, by hand, onto two sheets:
 * a colour sheet (the flat inks) and a line sheet (the key block: outlines,
 * dots and fine strokes). The world shows them as flat cut-outs and prints
 * them in stages: lines first, then the pale washes, then deep blue, then the
 * warm colours.
 *
 * The manner is taken from Hokusai's "Thirty-six Views of Mount Fuji"
 * (c. 1830-32): outlines in dark blue rather than black; a small set of flat
 * inks; colour that fades out to bare paper (bokashi); hills and slopes
 * covered in clustered dots; pines with salmon trunks and flat pads of
 * needles; bands of mist that cut across the land; small figures in indigo
 * with round straw hats.
 */

export const PAPER = '#e9e0c6';
const DEEP = '#173f7a'; // Prussian blue
const MID = '#4d7fae';
const PALE = '#b4d0d8';
const GREEN = '#5f9486'; // blue printed over yellow
const LEAF = '#3f7f78';
const LIME = '#a9c178';
const STRAW = '#ecd58c';
const PINK = '#e6a98c';
const TAN = '#cfa76c';
const EARTH = '#7a6658';
const RED = '#c23a26';

export interface Art {
  colour: HTMLCanvasElement;
  line: HTMLCanvasElement;
  /** Width divided by height. */
  aspect: number;
}

type Pt = [number, number];

class Sheet {
  colour: HTMLCanvasElement;
  line: HTMLCanvasElement;
  c: CanvasRenderingContext2D;
  l: CanvasRenderingContext2D;
  private seed: number;
  constructor(public w: number, public h: number, seed: number) {
    this.colour = document.createElement('canvas');
    this.line = document.createElement('canvas');
    this.colour.width = this.line.width = w;
    this.colour.height = this.line.height = h;
    this.c = this.colour.getContext('2d')!;
    this.l = this.line.getContext('2d')!;
    this.l.strokeStyle = this.l.fillStyle = '#fff';
    this.l.lineCap = this.l.lineJoin = 'round';
    this.seed = seed * 7919 + 13;
  }
  rnd = (): number => (this.seed = (this.seed * 16807) % 2147483647) / 2147483647;
  /** A closed (or open) path through points; `smooth` rounds the corners. */
  path(pts: Pt[], closed = true, smooth = true): Path2D {
    const p = new Path2D();
    if (!smooth) {
      pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
      if (closed) p.closePath();
      return p;
    }
    const n = pts.length;
    const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
      const m0 = mid(pts[n - 1], pts[0]);
      p.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i++) {
        const m = mid(pts[i], pts[(i + 1) % n]);
        p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
      p.closePath();
    } else {
      p.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n - 1; i++) {
        const m = mid(pts[i], pts[i + 1]);
        p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
      p.lineTo(pts[n - 1][0], pts[n - 1][1]);
    }
    return p;
  }
  fill(p: Path2D, ink: string | CanvasGradient): void {
    this.c.fillStyle = ink;
    this.c.fill(p);
    // Whatever is laid on top hides the lines of what is underneath.
    this.l.save();
    this.l.globalCompositeOperation = 'destination-out';
    this.l.fill(p);
    this.l.restore();
  }
  stroke(p: Path2D, width = 2.2): void {
    this.l.lineWidth = width;
    this.l.stroke(p);
  }
  /** Fill and outline together. */
  shape(pts: Pt[], ink: string | CanvasGradient, width = 2.2, smooth = true): Path2D {
    const p = this.path(pts, true, smooth);
    this.fill(p, ink);
    this.stroke(p, width);
    return p;
  }
  /** Colour that fades from one ink to another down the sheet: bokashi. */
  fade(y0: number, y1: number, top: string, bottom: string): CanvasGradient {
    const g = this.c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    return g;
  }
  /** Clustered dots of the key block inside a shape: Hokusai's way of giving a slope its texture. */
  dots(clip: Path2D, box: [number, number, number, number], count: number, size = 1.6, weight: (x: number, y: number) => number = () => 1): void {
    this.l.save();
    this.l.clip(clip);
    for (let i = 0; i < count; i++) {
      const x = box[0] + this.rnd() * box[2];
      const y = box[1] + this.rnd() * box[3];
      if (this.rnd() > weight(x, y)) continue;
      // They come in little clusters, and each is a short dab, not a round point.
      const n = 1 + Math.floor(this.rnd() * 4);
      for (let k = 0; k < n; k++) {
        this.l.beginPath();
        this.l.ellipse(x + (this.rnd() - 0.5) * size * 7, y + (this.rnd() - 0.5) * size * 4, size * (0.6 + this.rnd()), size * 0.55, this.rnd() * 0.6 - 0.3, 0, 6.3);
        this.l.fill();
      }
    }
    this.l.restore();
  }
  /** Fine strokes of the key block: grass, needles, straw. */
  strokes(x: number, y: number, count: number, spread: number, length: number, angle: number, fan: number, width = 1): void {
    this.l.lineWidth = width;
    this.l.beginPath();
    for (let i = 0; i < count; i++) {
      const px = x + (this.rnd() - 0.5) * spread;
      const a = angle + (this.rnd() - 0.5) * fan;
      const len = length * (0.6 + this.rnd() * 0.6);
      this.l.moveTo(px, y);
      this.l.lineTo(px + Math.cos(a) * len, y + Math.sin(a) * len);
    }
    this.l.stroke();
  }
  /** Fades the bottom of the whole cut-out away, so it stands in mist and has no hard foot. */
  mistFoot(from: number): void {
    for (const ctx of [this.c, this.l]) {
      const g = ctx.createLinearGradient(0, from, 0, this.h);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = g;
      ctx.fillRect(0, from, this.w, this.h - from);
      ctx.restore();
    }
  }
  done(): Art {
    return { colour: this.colour, line: this.line, aspect: this.w / this.h };
  }
}

/** The mountain: bare paper for snow, blue coming up its flanks in streaks and dots. */
export function fuji(): Art {
  const s = new Sheet(1400, 620, 1);
  const top = 70;
  const base = 560;
  const cx = 720;
  // Long hollow slopes, as he always drew them, and a top with three small teeth.
  const slope = (side: number, t: number): Pt => [cx + side * (34 + 640 * Math.pow(t, 1.75)), top + (base - top) * t];
  const outline: Pt[] = [];
  for (let i = 20; i >= 0; i--) outline.push(slope(-1, i / 20));
  outline.push([cx - 20, top - 6], [cx - 8, top + 5], [cx + 4, top - 8], [cx + 16, top + 4], [cx + 28, top - 4]);
  for (let i = 0; i <= 20; i++) outline.push(slope(1, i / 20));
  const body = s.path(outline, true, false);
  s.fill(body, PAPER);
  // Blue rising from below: it ends in long tongues that run up between fingers of snow.
  const tongues: Pt[] = [slope(-1, 1)];
  const line = (t: number) => top + (base - top) * t;
  const n = 46;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const edge = 0.36 + 0.2 * Math.abs(u - 0.52) + 0.05 * Math.sin(u * 37);
    const left = slope(-1, edge)[0];
    const right = slope(1, edge)[0];
    const x = left + (right - left) * u;
    tongues.push([x, line(edge + (i % 2 ? 0.02 : 0.17 + s.rnd() * 0.12))]);
  }
  tongues.push(slope(1, 1));
  const blue = s.path(tongues, true, false);
  s.c.save();
  s.c.clip(body);
  s.fill(blue, s.fade(line(0.34), base, DEEP, MID));
  // A lower fold of green hills against its foot.
  s.fill(s.path([[cx + 60, base], [cx + 180, line(0.74)], [cx + 300, line(0.66)], [cx + 430, line(0.76)], [cx + 600, base]]), s.fade(line(0.66), base, GREEN, PALE));
  s.c.restore();
  s.stroke(s.path(outline, false, false), 2.6);
  s.dots(body, [cx - 420, line(0.3), 840, (base - top) * 0.36], 520, 1.7, (x, y) => (y - line(0.3)) / ((base - top) * 0.36));
  s.l.save();
  s.l.clip(body);
  for (let i = 0; i < 9; i++) s.stroke(s.path([[cx - 16 + i * 5 + s.rnd() * 6, top + 10], [cx - 70 + i * 18 + s.rnd() * 20, top + 70 + s.rnd() * 50]], false), 1.4);
  s.l.restore();
  s.mistFoot(base - 110);
  return s.done();
}

/** A far range of hills: one blue ink, fading down into nothing. */
export function ridge(seed: number): Art {
  const s = new Sheet(1200, 300, seed);
  const pts: Pt[] = [[0, 300]];
  let y = 200;
  for (let x = 0; x <= 1200; x += 40) {
    y += (s.rnd() - 0.5) * 70;
    y = Math.min(250, Math.max(60, y));
    const edge = Math.min(1, Math.min(x, 1200 - x) / 220);
    pts.push([x, 300 - (300 - y) * edge]);
  }
  pts.push([1200, 300]);
  const p = s.path(pts);
  s.fill(p, s.fade(60, 290, seed % 2 ? MID : '#6f8fae', PALE));
  s.stroke(s.path(pts.slice(1, -1), false), 2);
  s.dots(p, [0, 60, 1200, 140], 260, 1.5);
  s.mistFoot(190);
  return s.done();
}

/** A rounded hill covered in dots and tufts. `ink` 0 green, 1 blue, 2 straw yellow. */
export function hill(seed: number, ink: number): Art {
  const s = new Sheet(900, 330, seed + 20);
  const pts: Pt[] = [[0, 330]];
  const humps = 2 + Math.floor(s.rnd() * 2);
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    let h = 0;
    for (let k = 0; k < humps; k++) h = Math.max(h, (0.55 + 0.45 * ((k * 37 + seed * 11) % 10) / 10) * Math.exp(-Math.pow((u - (k + 0.6) / (humps + 0.2)) * (2.2 + humps), 2)));
    pts.push([u * 900, 318 - h * 270 * Math.sin(u * Math.PI) ** 0.4]);
  }
  pts.push([900, 330]);
  const p = s.path(pts);
  const [topInk, footInk] = [[GREEN, PALE], [MID, PALE], [STRAW, '#f0e2b0']][ink];
  s.fill(p, s.fade(40, 320, topInk, footInk));
  s.stroke(s.path(pts.slice(1, -1), false), 2.4);
  s.dots(p, [0, 40, 900, 280], 700, 1.7, (_x, y) => 1 - (y - 40) / 320);
  for (let i = 0; i < 26; i++) {
    const x = 60 + s.rnd() * 780;
    s.l.save();
    s.l.clip(p);
    s.strokes(x, 150 + s.rnd() * 160, 7, 16, 12, -Math.PI / 2, 0.9, 1.1);
    s.l.restore();
  }
  s.mistFoot(250);
  return s.done();
}

/** A pine: a leaning salmon trunk spotted with bark, and flat pads of needles. */
export function pine(seed: number): Art {
  const s = new Sheet(520, 900, seed + 40);
  const lean = (s.rnd() - 0.5) * 220;
  const sway = (s.rnd() - 0.5) * 120;
  const spine = (t: number): Pt => [260 + lean * t * t + Math.sin(t * 3.4 + seed) * sway * t * (1 - t) * 2, 880 - t * 700];
  const width = (t: number) => 26 * (1 - t * 0.72) + 3;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const [x, y] = spine(t);
    left.push([x - width(t), y]);
    right.push([x + width(t), y]);
  }
  // Boughs first, so the pads sit over them.
  const pads: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const t = 0.42 + i * 0.09 + s.rnd() * 0.03;
    const [x, y] = spine(Math.min(1, t));
    const side = i % 2 ? 1 : -1;
    const reach = (70 + s.rnd() * 110) * (1.15 - t * 0.5);
    const ex = x + side * reach;
    const ey = y - 20 - s.rnd() * 50;
    const bough = s.path([[x, y], [x + side * reach * 0.5, y - 4], [ex, ey]], false);
    s.c.strokeStyle = PINK;
    s.c.lineWidth = 9 * (1.2 - t);
    s.c.lineCap = 'round';
    s.c.stroke(bough);
    s.stroke(bough, 1.2);
    pads.push({ x: ex, y: ey, w: 70 + s.rnd() * 60 });
  }
  const [tx, ty] = spine(1);
  pads.push({ x: tx, y: ty - 10, w: 95 });
  const trunk = s.path([...left, ...right.reverse()]);
  s.fill(trunk, PINK);
  s.stroke(trunk, 2.2);
  s.dots(trunk, [0, 150, 520, 740], 420, 2.1);
  for (const pad of pads) {
    // Each pad is flat underneath and lobed on top.
    const pts: Pt[] = [];
    const lobes = 5 + Math.floor(s.rnd() * 3);
    pts.push([pad.x - pad.w, pad.y + 8]);
    for (let k = 0; k <= lobes * 2; k++) {
      const u = k / (lobes * 2);
      pts.push([pad.x - pad.w + u * pad.w * 2, pad.y - Math.sin(u * Math.PI) * pad.w * 0.42 - (k % 2 ? 12 : 0)]);
    }
    pts.push([pad.x + pad.w, pad.y + 8]);
    const p = s.path(pts);
    s.fill(p, s.fade(pad.y - pad.w * 0.5, pad.y + 10, LEAF, GREEN));
    s.stroke(p, 1.8);
    s.l.save();
    s.l.clip(p);
    for (let k = 0; k < 26; k++) s.strokes(pad.x + (s.rnd() - 0.5) * pad.w * 1.8, pad.y - s.rnd() * pad.w * 0.4, 6, 4, 11, -Math.PI / 2, 2.2, 1);
    s.l.restore();
  }
  return s.done();
}

/** A stand of leafy trees and bushes: scalloped masses, dark and light. */
export function grove(seed: number): Art {
  const s = new Sheet(700, 420, seed + 60);
  const clumps = 5 + Math.floor(s.rnd() * 3);
  for (let i = 0; i < clumps; i++) {
    const x = 90 + (i / (clumps - 1)) * 520 + (s.rnd() - 0.5) * 50;
    const r = 70 + s.rnd() * 60;
    const y = 400 - r * (0.9 + s.rnd() * 0.8);
    if (s.rnd() < 0.6) {
      const stem = s.path([[x - 5, 410], [x - 4, y], [x + 4, y], [x + 6, 410]]);
      s.fill(stem, TAN);
      s.stroke(stem, 1.4);
    }
    const pts: Pt[] = [];
    const lobes = 9;
    for (let k = 0; k < lobes * 2; k++) {
      const a = (k / (lobes * 2)) * Math.PI * 2;
      const rr = r * (k % 2 ? 0.82 : 1) * (0.9 + s.rnd() * 0.2);
      pts.push([x + Math.cos(a) * rr * 1.15, y + Math.sin(a) * rr * 0.8]);
    }
    const p = s.path(pts);
    s.fill(p, s.fade(y - r, y + r, i % 2 ? LEAF : GREEN, i % 3 ? GREEN : LIME));
    s.stroke(p, 2);
    s.dots(p, [x - r * 1.2, y - r, r * 2.4, r * 2], 150, 1.8, (_x, yy) => 1 - (yy - (y - r)) / (2 * r));
  }
  s.mistFoot(360);
  return s.done();
}

/** A thatched house: a heavy straw roof over posts and a dark doorway. */
export function hut(seed: number): Art {
  const s = new Sheet(520, 380, seed + 80);
  const wide = seed % 2 === 0;
  const roofInk = [PINK, STRAW, TAN][seed % 3];
  const wall = s.path([[90, 372], [90, 220], [430, 220], [430, 372]], true, false);
  s.fill(wall, '#d9cfae');
  s.stroke(wall, 2);
  // Posts and a boarded front.
  for (let x = 90; x <= 430; x += wide ? 68 : 85) {
    const post = s.path([[x - 6, 372], [x - 6, 215], [x + 6, 215], [x + 6, 372]], true, false);
    s.fill(post, STRAW);
    s.stroke(post, 1.5);
  }
  const door = s.path([[200, 372], [200, 250], [300, 250], [300, 372]], true, false);
  s.fill(door, s.fade(250, 372, DEEP, MID));
  s.stroke(door, 2);
  for (let y = 240; y < 370; y += 16) s.stroke(s.path([[330, y], [424, y]], false), 1);
  const roof: Pt[] = [[30, 235], [150, 60], [250, 38], [370, 60], [490, 235], [400, 246], [260, 250], [120, 246]];
  const p = s.path(roof);
  s.fill(p, s.fade(40, 250, roofInk, '#f1e6c4'));
  s.stroke(p, 2.6);
  s.l.save();
  s.l.clip(p);
  for (let i = 0; i < 90; i++) {
    const x = 40 + s.rnd() * 440;
    const y = 60 + s.rnd() * 180;
    s.strokes(x, y, 3, 8, 26, Math.PI / 2 + (x - 260) / 420, 0.25, 1);
  }
  s.l.restore();
  const cap = s.path([[205, 52], [215, 26], [305, 26], [315, 52]], true, false);
  s.fill(cap, TAN);
  s.stroke(cap, 2);
  return s.done();
}

/** The drum bridge: a high wooden arch on paired posts, with travellers' hats showing over the rail. */
export function bridge(): Art {
  const s = new Sheet(1500, 560, 5);
  const arch = (x: number, lift: number) => 430 - lift - Math.sin(((x - 60) / 1380) * Math.PI) * 300;
  const deck: Pt[] = [];
  for (let x = 60; x <= 1440; x += 46) deck.push([x, arch(x, 0)]);
  const under: Pt[] = [];
  for (let x = 1440; x >= 60; x -= 46) under.push([x, arch(x, -34)]);
  // Posts, in pairs, standing in the water.
  for (const x of [470, 540, 960, 1030]) {
    const post = s.path([[x - 13, 556], [x - 13, arch(x, -30)], [x + 13, arch(x, -30)], [x + 13, 556]], true, false);
    s.fill(post, s.fade(150, 556, TAN, '#e3c79a'));
    s.stroke(post, 2);
  }
  for (const x of [505, 995]) for (const y of [300, 420]) s.stroke(s.path([[x - 60, y], [x + 60, y]], false), 5);
  const span = s.path([...deck, ...under], true, false);
  s.fill(span, s.fade(120, 470, STRAW, TAN));
  s.stroke(span, 2.6);
  s.stroke(s.path(deck.map(([x, y]) => [x, y + 12] as Pt), false, false), 1.2);
  // The rail and its uprights.
  const rail: Pt[] = deck.map(([x, y]) => [x, y - 34] as Pt);
  s.stroke(s.path(rail, false, false), 3);
  s.stroke(s.path(deck.map(([x, y]) => [x, y - 18] as Pt), false, false), 1.4);
  for (const [x, y] of deck) s.stroke(s.path([[x, y], [x, y - 40]], false), 2.4);
  // People crossing: hats and shoulders.
  for (let i = 0; i < 11; i++) {
    const x = 170 + i * 108 + s.rnd() * 50;
    const y = arch(x, 0) - 44;
    const body = s.path([[x - 13, y + 30], [x - 11, y + 4], [x + 11, y + 4], [x + 13, y + 30]]);
    s.fill(body, i % 3 ? DEEP : GREEN);
    s.stroke(body, 1.4);
    const hat = new Path2D();
    hat.ellipse(x, y, 17, i % 2 ? 9 : 15, 0, 0, 6.3);
    s.fill(hat, i % 4 === 0 ? PINK : '#efe4c2');
    s.stroke(hat, 1.4);
  }
  // Stone footings at either end.
  for (const [x0, flip] of [[0, 1], [1500, -1]]) {
    const foot = s.path([[x0, 556], [x0, 410], [x0 + flip * 150, 420], [x0 + flip * 210, 556]], true, false);
    s.fill(foot, s.fade(410, 556, '#9fb0b8', PALE));
    s.stroke(foot, 2.2);
    for (let k = 0; k < 16; k++) {
      const stone = new Path2D();
      stone.ellipse(x0 + flip * (20 + s.rnd() * 150), 440 + s.rnd() * 100, 16, 11, 0, 0, 6.3);
      s.stroke(stone, 1.2);
    }
  }
  return s.done();
}

const SKIN = '#ecc9a6';
const HAT = '#efe2b6';

/**
 * One small figure, built on a skeleton so that it stands and moves like a
 * person: a head a seventh of its height, a short belted coat, bare thighs,
 * dark leggings and straw sandals, and whatever it is carrying.
 *
 * `k` is its height in pixels. `pose`: 0 a walker with a staff, 1 a traveller
 * with a bundle on his back, 2 a worker bent to his task, 3 someone fishing,
 * 4 a walker leaning into the wind, 5 a carrier with a pole and two baskets.
 */
function person(s: Sheet, x: number, y: number, k: number, pose: number, flip: number): void {
  const f = flip;
  const P = [
    { lean: 0.1, stride: 1, crouch: 0, coat: DEEP, hat: 1 },
    { lean: 0.3, stride: 0.8, crouch: 0.03, coat: MID, hat: 1 },
    { lean: 0.75, stride: 0.5, crouch: 0.08, coat: GREEN, hat: 0 },
    { lean: 0.05, stride: 0.35, crouch: 0, coat: DEEP, hat: 1 },
    { lean: 0.5, stride: 1.1, crouch: 0.04, coat: MID, hat: 2 },
    { lean: 0.15, stride: 0.9, crouch: 0.02, coat: DEEP, hat: 0 },
  ][pose];
  const at = (px: number, py: number): Pt => [x + f * px * k, y - py * k];
  /** A limb: a tapered strip from a to b, filled and outlined. */
  const limb = (a: Pt, b: Pt, wa: number, wb: number, ink: string) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * k;
    const ny = (dx / len) * k;
    s.shape([[a[0] + nx * wa, a[1] + ny * wa], [b[0] + nx * wb, b[1] + ny * wb], [b[0] - nx * wb, b[1] - ny * wb], [a[0] - nx * wa, a[1] - ny * wa]], ink, 1.2);
  };
  const hipY = 0.47 - P.crouch;
  const hip = at(0, hipY);
  const shoulder = at(P.lean * 0.3, hipY + 0.31 * Math.cos(P.lean * 0.9));
  const head = at(P.lean * 0.3 + P.lean * 0.07 + 0.01, hipY + 0.31 * Math.cos(P.lean * 0.9) + 0.085);

  // The far arm and far leg go down first, so the near ones overlap them.
  const leg = (dir: number) => {
    const foot = at(dir * 0.17 * P.stride, 0);
    const knee = at(dir * 0.09 * P.stride + 0.045 + P.crouch, hipY * 0.5 + (dir < 0 ? 0.01 : 0));
    limb(hip, knee, 0.05, 0.04, SKIN);
    limb(knee, foot, 0.04, 0.028, DEEP);
    // A straw sandal under a small foot.
    s.shape([[foot[0] - f * k * 0.03, foot[1]], [foot[0] + f * k * 0.075, foot[1]], [foot[0] + f * k * 0.07, foot[1] - k * 0.022], [foot[0] - f * k * 0.02, foot[1] - k * 0.03]], HAT, 1);
  };
  const arm = (reach: number, drop: number, bend: number): Pt => {
    const elbow: Pt = [shoulder[0] + f * k * reach * 0.5 - f * k * bend, shoulder[1] + k * drop * 0.55];
    const hand: Pt = [shoulder[0] + f * k * reach, shoulder[1] + k * drop];
    limb([shoulder[0], shoulder[1] + k * 0.02], elbow, 0.04, 0.034, P.coat);
    limb(elbow, hand, 0.028, 0.022, SKIN);
    return hand;
  };
  leg(-1);
  arm(pose === 2 ? 0.2 : -0.1, pose === 2 ? 0.22 : 0.2, 0.03);
  leg(1);

  // What is carried behind the body.
  if (pose === 1) {
    // A bundle wrapped in a green cloth, knotted across the chest.
    const pack = at(P.lean * 0.3 - 0.16, hipY + 0.24);
    const cloth = new Path2D();
    cloth.ellipse(pack[0], pack[1], k * 0.15, k * 0.12, -0.3 * f, 0, 6.3);
    s.fill(cloth, GREEN);
    s.stroke(cloth, 1.3);
    s.dots(cloth, [pack[0] - k * 0.16, pack[1] - k * 0.13, k * 0.32, k * 0.26], 10, 1.1);
  }

  // The coat: narrow at the shoulders, belted, with a short flared skirt.
  const coat: Pt[] = [
    [shoulder[0] - f * k * 0.075, shoulder[1] + k * 0.01],
    [shoulder[0] + f * k * 0.01, shoulder[1] - k * 0.03],
    [shoulder[0] + f * k * 0.09, shoulder[1] + k * 0.03],
    [hip[0] + f * k * 0.085, hip[1] - k * 0.03],
    [hip[0] + f * k * 0.115, hip[1] + k * 0.09],
    [hip[0] - f * k * 0.1, hip[1] + k * 0.1],
    [hip[0] - f * k * 0.075, hip[1] - k * 0.03],
  ];
  s.shape(coat, P.coat, 1.4);
  s.stroke(s.path([[hip[0] - f * k * 0.08, hip[1] - k * 0.02], [hip[0] + f * k * 0.09, hip[1] - k * 0.015]], false), 2.2); // the sash
  s.stroke(s.path([[shoulder[0] + f * k * 0.01, shoulder[1]], [hip[0] + f * k * 0.03, hip[1] - k * 0.03]], false), 0.9); // where the coat folds over

  // The head, then whatever is on it.
  const face = new Path2D();
  face.ellipse(head[0], head[1], k * 0.05, k * 0.058, 0, 0, 6.3);
  s.fill(face, SKIN);
  s.stroke(face, 1.1);
  if (P.hat === 1) {
    // A wide, shallow straw hat with its ribs showing.
    const brim: Pt[] = [[head[0] - k * 0.16, head[1] - k * 0.015], [head[0] - f * k * 0.01, head[1] - k * 0.115], [head[0] + k * 0.16, head[1] - k * 0.015], [head[0], head[1] + k * 0.012]];
    const hat = s.path(brim, true, false);
    s.fill(hat, HAT);
    s.stroke(hat, 1.3);
    for (const e of [-0.1, -0.04, 0.04, 0.1]) s.stroke(s.path([[head[0] - f * k * 0.01, head[1] - k * 0.115], [head[0] + k * e, head[1] - k * 0.004]], false), 0.6);
  } else if (P.hat === 2) {
    // Head down against the wind: the hat is seen full on, and he holds it there.
    const hat = new Path2D();
    hat.ellipse(head[0] + f * k * 0.03, head[1] - k * 0.01, k * 0.12, k * 0.115, 0, 0, 6.3);
    s.fill(hat, PINK);
    s.stroke(hat, 1.3);
    const boss = new Path2D();
    boss.arc(head[0] + f * k * 0.03, head[1] - k * 0.01, k * 0.03, 0, 6.3);
    s.stroke(boss, 0.8);
  } else {
    // Bare-headed: a shaved crown, a topknot, and a twisted cloth round the brow.
    s.stroke(s.path([[head[0] - k * 0.05, head[1] - k * 0.02], [head[0] + k * 0.05, head[1] - k * 0.025]], false), 2.4);
    const knot = new Path2D();
    knot.ellipse(head[0] - f * k * 0.02, head[1] - k * 0.065, k * 0.03, k * 0.014, 0, 0, 6.3);
    s.fill(knot, DEEP);
  }

  // The near arm, and what it holds.
  if (pose === 0) {
    const hand = arm(0.2, 0.17, -0.02);
    s.stroke(s.path([[hand[0] + f * k * 0.03, y], [hand[0] - f * k * 0.02, hand[1] - k * 0.32]], false), 2); // a staff taller than he is
  } else if (pose === 1) {
    arm(0.1, 0.2, -0.03);
    s.stroke(s.path([[shoulder[0] - f * k * 0.06, shoulder[1] + k * 0.04], [shoulder[0] + f * k * 0.07, shoulder[1] + k * 0.12]], false), 2); // the knotted ends of the cloth
  } else if (pose === 2) {
    const hand = arm(0.26, 0.26, 0.02);
    // A long-handled hoe, swung down at the ground.
    s.stroke(s.path([[hand[0] - f * k * 0.2, hand[1] - k * 0.22], [hand[0] + f * k * 0.2, y - k * 0.03]], false), 2.2);
    s.shape([[hand[0] + f * k * 0.2, y - k * 0.06], [hand[0] + f * k * 0.25, y - k * 0.03], [hand[0] + f * k * 0.16, y]], MID, 1.1, false);
  } else if (pose === 3) {
    const hand = arm(0.2, 0.1, -0.02);
    // A rod, and the line running out from its tip.
    const tip: Pt = [hand[0] + f * k * 0.95, hand[1] - k * 0.5];
    s.stroke(s.path([[hand[0] - f * k * 0.08, hand[1] + k * 0.05], [hand[0] + f * k * 0.5, hand[1] - k * 0.3], tip], false), 1.5);
    s.stroke(s.path([tip, [tip[0] + f * k * 0.12, y - k * 0.35], [tip[0] + f * k * 0.16, y - k * 0.02]], false), 0.7);
  } else if (pose === 4) {
    arm(0.12, -0.12, -0.05); // a hand up to the hat
    s.shape([[hip[0] - f * k * 0.1, hip[1] + k * 0.02], [hip[0] - f * k * 0.3, hip[1] - k * 0.06], [hip[0] - f * k * 0.34, hip[1] + k * 0.08], [hip[0] - f * k * 0.12, hip[1] + k * 0.1]], P.coat, 1.2); // the coat blown out behind
  } else {
    // A pole across one shoulder with a basket slung from each end.
    const hand = arm(0.16, -0.02, -0.03);
    const front: Pt = [shoulder[0] + f * k * 0.42, shoulder[1] - k * 0.02];
    const back: Pt = [shoulder[0] - f * k * 0.42, shoulder[1] - k * 0.06];
    s.stroke(s.path([back, [shoulder[0], shoulder[1] - k * 0.05], [hand[0], hand[1] - k * 0.03], front], false), 2.6);
    for (const end of [front, back]) {
      const top = end[1] + k * 0.26;
      s.stroke(s.path([end, [end[0] - k * 0.07, top]], false), 0.8);
      s.stroke(s.path([end, [end[0] + k * 0.07, top]], false), 0.8);
      const basket = s.shape([[end[0] - k * 0.085, top], [end[0] + k * 0.085, top], [end[0] + k * 0.065, top + k * 0.13], [end[0] - k * 0.065, top + k * 0.13]], STRAW, 1.2, false);
      s.l.save();
      s.l.clip(basket);
      for (let i = 0; i < 5; i++) s.stroke(s.path([[end[0] - k * 0.09, top + k * 0.026 * i], [end[0] + k * 0.09, top + k * 0.026 * i]], false), 0.6);
      s.l.restore();
      const heap = new Path2D();
      heap.ellipse(end[0], top, k * 0.08, k * 0.035, 0, Math.PI, 0);
      s.fill(heap, LIME);
      s.stroke(heap, 1);
    }
  }
}

/** Travellers on the road, caught mid-step. */
export function travellers(seed: number): Art {
  const s = new Sheet(720, 330, seed + 100);
  const count = 1 + (seed % 3);
  const way = seed % 2 ? 1 : -1;
  for (let i = 0; i < count; i++) person(s, 170 + i * 190 + s.rnd() * 30, 322, 250 + s.rnd() * 30, (seed + i * 2) % 6, way);
  return s.done();
}

/** A packhorse under a great load of straw, led by a man on foot. */
export function packhorse(): Art {
  const s = new Sheet(760, 460, 7);
  const g = 452; // the ground
  /** One leg: three joints, tapering to a dark hoof. */
  const leg = (top: Pt, knee: Pt, hock: Pt, foot: Pt, far: boolean) => {
    const ink = far ? '#d99a80' : PINK;
    const strip = (a: Pt, b: Pt, wa: number, wb: number) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      s.shape([[a[0] + nx * wa, a[1] + ny * wa], [b[0] + nx * wb, b[1] + ny * wb], [b[0] - nx * wb, b[1] - ny * wb], [a[0] - nx * wa, a[1] - ny * wa]], ink, 1.3);
    };
    strip(top, knee, 19, 12);
    strip(knee, foot, 12, 9);
    void hock;
    s.shape([[foot[0] - 11, g], [foot[0] - 8, foot[1] - 6], [foot[0] + 9, foot[1] - 6], [foot[0] + 13, g]], DEEP, 1.1, false);
  };
  // The far legs, then the tail, then the body over them.
  leg([255, 290], [240, 352], [262, 392], [250, g - 12], true);
  leg([420, 290], [436, 352], [426, 398], [440, g - 12], true);
  const tail = s.path([[178, 222], [128, 262], [118, 340], [140, 372], [150, 300], [186, 256]]);
  s.fill(tail, EARTH);
  s.stroke(tail, 1.6);
  s.l.save();
  s.l.clip(tail);
  for (let i = 0; i < 9; i++) s.stroke(s.path([[170 - i * 4, 232 + i * 6], [128 + i * 2, 300 + i * 8]], false), 0.8);
  s.l.restore();
  // Body, neck and head in one outline: a deep chest, a dipped back, a long head carried low.
  const body: Pt[] = [
    [176, 236], [200, 206], [270, 200], [350, 204], [396, 192], [440, 160], [480, 140], [494, 116], [502, 138], [514, 124], [520, 146],
    [548, 184], [562, 222], [552, 236], [530, 230], [512, 208], [494, 200], [474, 228], [456, 266], [420, 300], [330, 312], [250, 304], [196, 286],
  ];
  s.shape(body, s.fade(84, 312, PINK, '#efc0a6'), 2.2);
  // Mane, eye, nostril, and the halter.
  for (let i = 0; i < 9; i++) s.stroke(s.path([[404 + i * 10, 186 - i * 6], [394 + i * 10, 206 - i * 5]], false), 1.6);
  const eye = new Path2D();
  eye.ellipse(522, 168, 5, 3.5, 0.5, 0, 6.3);
  s.l.fill(eye);
  s.stroke(s.path([[554, 222], [549, 228]], false), 2);
  s.stroke(s.path([[516, 150], [534, 206], [558, 214]], false), 1.4);
  s.stroke(s.path([[534, 206], [550, 194]], false), 1.4);
  leg([232, 292], [212, 352], [238, 396], [224, g - 12], false);
  leg([440, 286], [452, 350], [444, 398], [456, g - 12], false);
  // The load: a great sheaf lashed across its back, over a saddle cloth.
  s.shape([[230, 214], [380, 214], [392, 270], [222, 272]], DEEP, 1.4, false);
  const load = s.path([[176, 226], [206, 86], [300, 44], [404, 84], [436, 220], [300, 242]]);
  s.fill(load, s.fade(44, 242, EARTH, TAN));
  s.stroke(load, 2.4);
  s.l.save();
  s.l.clip(load);
  for (let i = 0; i < 150; i++) s.strokes(176 + s.rnd() * 260, 60 + s.rnd() * 180, 2, 6, 34, Math.PI * 0.42 + s.rnd() * 0.5, 0.3, 0.9);
  s.l.restore();
  s.stroke(s.path([[204, 112], [300, 140], [406, 112]], false), 2.6);
  s.stroke(s.path([[186, 186], [300, 208], [428, 184]], false), 2.6);
  // The man leading it, and the rope between them.
  person(s, 668, g, 262, 4, -1);
  s.stroke(s.path([[556, 222], [606, 256], [640, 236]], false), 1.4);
  return s.done();
}

/** A long fishing boat with two men working it. */
export function boat(seed: number): Art {
  const s = new Sheet(900, 300, seed + 120);
  const hull = s.path([[20, 150], [130, 232], [450, 262], [770, 232], [880, 120], [770, 190], [450, 214], [130, 190]]);
  s.fill(hull, s.fade(120, 262, STRAW, '#f2e7b8'));
  s.stroke(hull, 2.6);
  s.stroke(s.path([[70, 178], [450, 238], [830, 170]], false), 1.2);
  for (let x = 160; x < 760; x += 46) s.stroke(s.path([[x, 206 + Math.sin((x / 900) * Math.PI) * 14], [x + 3, 246 + Math.sin((x / 900) * Math.PI) * 12]], false), 0.9);
  if (seed % 2) {
    // A square sail of matting on a single mast.
    s.stroke(s.path([[450, 214], [450, 10]], false), 4);
    const sail = s.path([[350, 30], [550, 30], [562, 170], [338, 170]], true, false);
    s.fill(sail, s.fade(30, 170, '#f1e6c4', STRAW));
    s.stroke(sail, 2);
    for (let x = 372; x < 550; x += 26) s.stroke(s.path([[x, 32], [x - 2, 168]], false), 0.9);
  } else {
    person(s, 300, 214, 170, 3, 1);
    person(s, 600, 206, 170, 2, -1);
    s.stroke(s.path([[640, 150], [870, 286]], false), 3); // the sculling oar
  }
  return s.done();
}

/** A band of mist, drawn the old way: a long flat cloud with lobed ends, the colour of bare paper. */
export function mist(seed: number): Art {
  const s = new Sheet(1100, 200, seed + 140);
  const pts: Pt[] = [];
  const lobes = 9;
  for (let i = 0; i <= lobes; i++) pts.push([70 + (i / lobes) * 960, 70 - (i % 2 ? 26 : 0) * (0.5 + s.rnd()) - Math.sin((i / lobes) * Math.PI) * 20]);
  pts.push([1070, 110], [1010, 140]);
  for (let i = lobes; i >= 0; i--) pts.push([70 + (i / lobes) * 960 + 20, 150 + (i % 2 ? 18 : 0) * s.rnd()]);
  pts.push([20, 120]);
  const p = s.path(pts);
  s.fill(p, s.fade(40, 170, PAPER, '#dfe6da'));
  s.stroke(p, 1.3);
  s.mistFoot(105);
  return s.done();
}

/** A row of small waves: blue backs, and curling crests of bare paper that break into claws. */
export function waves(seed: number): Art {
  const s = new Sheet(1200, 240, seed + 160);
  const count = 5;
  for (let i = 0; i < count; i++) {
    const x = 40 + i * 235 + s.rnd() * 30;
    const top = 60 + s.rnd() * 50;
    const back = s.path([[x - 40, 240], [x + 10, 170], [x + 90, top + 20], [x + 170, top], [x + 215, top + 40], [x + 250, 150], [x + 290, 240]]);
    s.fill(back, s.fade(top, 240, DEEP, MID));
    s.stroke(back, 2.2);
    s.l.save();
    s.l.clip(back);
    for (let k = 0; k < 7; k++) s.stroke(s.path([[x + k * 16, 240], [x + 60 + k * 20, top + 60 + k * 12], [x + 170 + k * 10, top + 24 + k * 16]], false), 1.1);
    s.l.restore();
    // The crest: foam that hooks over and ends in little claws.
    const foam: Pt[] = [[x + 110, top + 14], [x + 160, top - 22], [x + 222, top - 6]];
    for (let k = 0; k < 5; k++) foam.push([x + 244 - k * 9, top + 22 + k * 11], [x + 226 - k * 10, top + 12 + k * 11]);
    foam.push([x + 170, top + 34]);
    const crest = s.path(foam);
    s.fill(crest, PAPER);
    s.stroke(crest, 1.6);
    s.dots(crest, [x + 110, top - 20, 140, 80], 12, 1.4);
  }
  s.mistFoot(200);
  return s.done();
}

/** A cliff with a waterfall: the water as straight blue bands with paper between. */
export function falls(): Art {
  const s = new Sheet(700, 1000, 9);
  const cliff = s.path([[20, 1000], [50, 420], [120, 130], [260, 40], [450, 60], [600, 190], [660, 520], [690, 1000]]);
  s.fill(cliff, s.fade(40, 1000, EARTH, '#b9a58c'));
  s.stroke(cliff, 2.8);
  s.dots(cliff, [20, 40, 670, 960], 900, 2.2);
  const water = s.path([[285, 70], [395, 74], [470, 960], [215, 960]], true, false);
  s.fill(water, PAPER);
  s.c.save();
  s.c.clip(water);
  for (let i = 0; i < 9; i++) {
    const band = s.path([[292 + i * 12, 70], [300 + i * 12, 70], [236 + i * 27, 960], [222 + i * 27, 960]], true, false);
    s.fill(band, i % 2 ? DEEP : MID);
  }
  s.c.restore();
  s.stroke(water, 2);
  // Green growing on the ledges either side.
  for (const [x, y, r] of [[150, 300, 70], [540, 330, 80], [110, 620, 90], [590, 660, 85], [330, 30, 60]]) {
    const pts: Pt[] = [];
    for (let k = 0; k < 14; k++) pts.push([x + Math.cos((k / 14) * 6.28) * r * (k % 2 ? 0.8 : 1.05), y + Math.sin((k / 14) * 6.28) * r * 0.6]);
    const p = s.path(pts);
    s.fill(p, s.fade(y - r, y + r, LEAF, GREEN));
    s.stroke(p, 1.8);
    s.dots(p, [x - r, y - r, r * 2, r * 2], 60, 1.8);
  }
  // Spray at the foot, in scallops.
  for (let i = 0; i < 9; i++) {
    const puff = new Path2D();
    puff.arc(200 + i * 36, 950 - (i % 2) * 22, 30, Math.PI, 0);
    s.fill(puff, PAPER);
    s.stroke(puff, 1.4);
  }
  s.mistFoot(900);
  return s.done();
}

/** Rocks at the water's edge. */
export function rocks(seed: number): Art {
  const s = new Sheet(600, 260, seed + 180);
  for (let i = 0; i < 4; i++) {
    const x = 90 + i * 130 + s.rnd() * 40;
    const w = 70 + s.rnd() * 60;
    const h = 80 + s.rnd() * 130;
    const p = s.path([[x - w, 260], [x - w * 0.8, 260 - h * 0.6], [x - w * 0.2, 260 - h], [x + w * 0.5, 260 - h * 0.85], [x + w, 260 - h * 0.3], [x + w * 1.1, 260]]);
    s.fill(p, s.fade(260 - h, 260, i % 2 ? '#7f93a4' : EARTH, PALE));
    s.stroke(p, 2.2);
    s.dots(p, [x - w, 260 - h, w * 2.2, h], 70, 1.8);
  }
  s.mistFoot(215);
  return s.done();
}

/** Reeds and tall grass: nothing but fine strokes over a faint wash. */
export function reeds(seed: number): Art {
  const s = new Sheet(600, 220, seed + 200);
  const wash = s.path([[10, 220], [60, 150], [300, 120], [540, 150], [590, 220]]);
  s.fill(wash, s.fade(110, 220, '#c9dcc0', PAPER));
  for (let i = 0; i < 22; i++) s.strokes(30 + s.rnd() * 540, 218, 6, 26, 80 + s.rnd() * 90, -Math.PI / 2 + (s.rnd() - 0.5) * 0.3, 0.5, 0.9);
  s.mistFoot(180);
  return s.done();
}

/** Sheaves of cut rice stacked to dry. */
export function sheaves(): Art {
  const s = new Sheet(600, 240, 11);
  for (let i = 0; i < 4; i++) {
    const x = 90 + i * 140;
    const h = 150 + s.rnd() * 60;
    const p = s.path([[x - 62, 238], [x - 30, 238 - h * 0.7], [x, 238 - h], [x + 30, 238 - h * 0.7], [x + 62, 238]]);
    s.fill(p, s.fade(238 - h, 238, i % 2 ? PINK : STRAW, '#f3e8c0'));
    s.stroke(p, 2);
    s.l.save();
    s.l.clip(p);
    for (let k = 0; k < 40; k++) s.strokes(x + (s.rnd() - 0.5) * 100, 238 - s.rnd() * h, 2, 4, 40, Math.PI / 2 + (s.rnd() - 0.5) * 0.5, 0.2, 1);
    s.l.restore();
    s.stroke(s.path([[x - 26, 238 - h * 0.72], [x + 26, 238 - h * 0.72]], false), 2.4);
  }
  return s.done();
}

/** Two cranes standing in the shallows. */
export function cranes(): Art {
  const s = new Sheet(520, 420, 13);
  for (const [x, f, bow] of [[170, 1, 0], [360, -1, 1]]) {
    for (const leg of [-14, 16]) s.stroke(s.path([[x + leg, 270], [x + leg + f * 6, 350], [x + leg - f * 4, 416]], false), 2.4);
    const body = new Path2D();
    body.ellipse(x, 240, 78, 46, -0.25 * f, 0, 6.3);
    s.fill(body, PAPER);
    s.stroke(body, 2.2);
    const tail = s.path([[x - f * 50, 216], [x - f * 120, 250], [x - f * 96, 296], [x - f * 40, 268]]);
    s.fill(tail, DEEP);
    s.stroke(tail, 1.8);
    const head: [number, number] = bow ? [x + f * 96, 330] : [x + f * 70, 60];
    const neck = s.path([[x + f * 56, 220], [x + f * (bow ? 120 : 96), bow ? 210 : 140], head], false);
    s.c.strokeStyle = DEEP;
    s.c.lineWidth = 15;
    s.c.lineCap = 'round';
    s.c.stroke(neck);
    s.stroke(neck, 1.2);
    const skull = new Path2D();
    skull.arc(head[0], head[1], 13, 0, 6.3);
    s.fill(skull, PAPER);
    s.stroke(skull, 1.6);
    const crown = new Path2D();
    crown.arc(head[0] - f * 2, head[1] - 9, 6, 0, 6.3);
    s.fill(crown, RED);
    s.stroke(s.path([[head[0] + f * 11, head[1] + 2], [head[0] + f * 52, head[1] + (bow ? 26 : 8)]], false), 3);
  }
  return s.done();
}

/** A scatter of birds, each a single flick of the brush. */
export function birds(): Art {
  const s = new Sheet(600, 240, 15);
  for (let i = 0; i < 16; i++) {
    const x = 40 + s.rnd() * 520;
    const y = 30 + s.rnd() * 180;
    const k = 8 + s.rnd() * 10;
    s.stroke(s.path([[x - k, y - k * 0.3], [x - k * 0.3, y - k * 0.6], [x, y], [x + k * 0.4, y - k * 0.7], [x + k, y - k * 0.2]], false), 1.8);
  }
  return s.done();
}

/** A stone lantern: it marks a place where the view is worth stopping for. */
export function lantern(): Art {
  const s = new Sheet(260, 520, 17);
  const stone = '#a9b4b6';
  const parts: Pt[][] = [
    [[60, 518], [70, 480], [190, 480], [200, 518]],
    [[108, 480], [112, 290], [148, 290], [152, 480]],
    [[66, 290], [76, 262], [184, 262], [194, 290]],
    [[86, 262], [86, 178], [174, 178], [174, 262]],
    [[30, 180], [70, 120], [130, 96], [190, 120], [230, 180]],
    [[112, 98], [130, 56], [148, 98]],
  ];
  for (const pts of parts) s.shape(pts, s.fade(60, 518, stone, PALE), 2.2, false);
  const glow = s.path([[108, 248], [108, 192], [152, 192], [152, 248]], true, false);
  s.fill(glow, STRAW);
  s.stroke(glow, 1.6);
  s.dots(s.path([[60, 518], [60, 100], [200, 100], [200, 518]], true, false), [60, 100, 140, 418], 70, 1.6);
  return s.done();
}

/** The printer's red seal. */
export function seal(): Art {
  const s = new Sheet(160, 160, 19);
  const block = s.path([[14, 14], [146, 14], [146, 146], [14, 146]], true, false);
  s.fill(block, RED);
  s.c.fillStyle = PAPER;
  // A simple mark cut into it: a mountain over a line of water.
  s.c.fill(s.path([[40, 100], [72, 52], [80, 60], [88, 52], [120, 100]], true, false));
  s.c.fillRect(40, 112, 80, 9);
  return s.done();
}
