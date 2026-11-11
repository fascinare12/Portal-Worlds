/**
 * Drawing as embroidery. Everything in the Tapestry world is put down with
 * this kit, which works the way the real cloth was worked: a shape is filled
 * with rows of wool laid side by side and held down by threads across them,
 * then outlined in a rope of stem stitch, in eight colours on bare linen.
 *
 * Every thread is drawn as a thread: its own strand, a shade lighter or
 * darker than its neighbours because no two lengths of hand-dyed wool match,
 * lit along its top and shadowed along its foot. The wool stands a little
 * proud of the cloth and throws a soft shadow on it.
 *
 * The same scene can be drawn three ways:
 *   'sketch'  the under-drawing only, as a designer would mark it on the linen
 *   'full'    properly stitched
 *   'wrong'   stitched badly: the wrong wools, pulled out of true
 */

export const LINEN = '#e6dcc2';
export const WOOL = {
  terracotta: '#b0502c',
  ochre: '#c4963a',
  sage: '#7c8a55',
  teal: '#3f6965',
  navy: '#2a3a55',
  buff: '#d8bd90',
  dark: '#3b302b',
  rust: '#8a4a34',
};
export type Wool = keyof typeof WOOL;
export type Mode = 'sketch' | 'full' | 'wrong';
export type Pt = [number, number];
/** A box: left, top, right, bottom. */
export type Box = [number, number, number, number];

/** One thing the needle did, kept so that the stitching can be played back in the order it was done. */
export interface Stitch {
  /** The area it covers, in the scene's own units... */
  clip: Path2D;
  /** ...and how those units were placed on the canvas at the time. */
  matrix: DOMMatrix;
  /** Its extent on the canvas, in pixels. */
  box: Box;
}

const MUDDLE: Record<Wool, Wool> = { terracotta: 'teal', ochre: 'navy', sage: 'rust', teal: 'ochre', navy: 'sage', buff: 'terracotta', dark: 'ochre', rust: 'buff' };
const ROW = 4.2; // the width of one laid thread, in a scene's units

/** A wool, a little lighter or darker. */
function tone(hex: string, by: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * by)));
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
}

export class Stitcher {
  private seed = 7;
  private boxes = new WeakMap<Path2D, Box>();
  /** When set, everything stitched is also noted here, in order. */
  record: Stitch[] | null = null;
  constructor(public g: CanvasRenderingContext2D, public mode: Mode) {
    g.lineCap = g.lineJoin = 'round';
  }
  rnd = (): number => (this.seed = (this.seed * 16807 + 11) % 2147483647) / 2147483647;
  reseed(n: number): void {
    this.seed = n * 7919 + 17;
  }
  private ink(c: Wool): string {
    return WOOL[this.mode === 'wrong' ? MUDDLE[c] : c];
  }
  /** In a botched panel nothing sits quite where it should. */
  private place(p: Pt): Pt {
    if (this.mode !== 'wrong') return p;
    return [p[0] + (this.rnd() - 0.5) * 9, p[1] + (this.rnd() - 0.5) * 9];
  }
  private note(clip: Path2D, box: Box): void {
    if (!this.record || this.mode !== 'full') return;
    const m = this.g.getTransform();
    const xs: number[] = [];
    const ys: number[] = [];
    for (const [x, y] of [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]]) {
      xs.push(m.a * x + m.c * y + m.e);
      ys.push(m.b * x + m.d * y + m.f);
    }
    this.record.push({ clip, matrix: m, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
  }
  private boxOf(pts: Pt[], pad = 0): Box {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
  }
  private rect(b: Box): Path2D {
    const p = new Path2D();
    p.rect(b[0], b[1], b[2] - b[0], b[3] - b[1]);
    return p;
  }
  path(pts: Pt[], closed = true, smooth = true): Path2D {
    const q = pts.map((p) => this.place(p));
    const p = new Path2D();
    const n = q.length;
    this.boxes.set(p, this.boxOf(q));
    if (!smooth || n < 3) {
      q.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
      if (closed) p.closePath();
      return p;
    }
    const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
      const m0 = mid(q[n - 1], q[0]);
      p.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i++) {
        const m = mid(q[i], q[(i + 1) % n]);
        p.quadraticCurveTo(q[i][0], q[i][1], m[0], m[1]);
      }
      p.closePath();
    } else {
      p.moveTo(q[0][0], q[0][1]);
      for (let i = 1; i < n - 1; i++) {
        const m = mid(q[i], q[i + 1]);
        p.quadraticCurveTo(q[i][0], q[i][1], m[0], m[1]);
      }
      p.lineTo(q[n - 1][0], q[n - 1][1]);
    }
    return p;
  }
  private sketched(p: Path2D): void {
    const g = this.g;
    g.setLineDash([4, 4]);
    g.lineWidth = 1.1;
    g.strokeStyle = 'rgba(110, 92, 70, 0.75)';
    g.stroke(p);
    g.setLineDash([]);
  }
  /** A line of stem stitch: short slanting stitches overlapping one another, like a fine rope. */
  private rope(p: Path2D, colour: string, width: number): void {
    const g = this.g;
    g.strokeStyle = 'rgba(40, 26, 12, 0.3)'; // its shadow on the cloth
    g.lineWidth = width + 1.6;
    g.save();
    g.translate(0.7, 1.1);
    g.stroke(p);
    g.restore();
    g.strokeStyle = colour;
    g.lineWidth = width;
    g.stroke(p);
    g.strokeStyle = 'rgba(255, 244, 220, 0.36)'; // the lit side of each stitch
    g.lineWidth = Math.max(0.8, width * 0.42);
    g.setLineDash([2.6, 2.8]);
    g.stroke(p);
    g.strokeStyle = 'rgba(20, 12, 8, 0.4)'; // the gap where one stitch tucks under the next
    g.lineWidth = Math.max(0.7, width * 0.34);
    g.setLineDash([0.9, 4.5]);
    g.lineDashOffset = 2.7;
    g.stroke(p);
    g.setLineDash([]);
    g.lineDashOffset = 0;
  }
  /** Fills a path with laid threads and outlines it in stem stitch. */
  work(p: Path2D, colour: Wool | null, edge: Wool | null = 'dark', slant = 0.5): void {
    const g = this.g;
    if (this.mode === 'sketch') return this.sketched(p);
    const b = this.boxes.get(p) ?? [0, 0, 1000, 520];
    if (colour) {
      const base = this.ink(colour);
      // The wool stands proud of the linen and shadows it.
      g.save();
      g.shadowColor = 'rgba(46, 30, 14, 0.42)';
      g.shadowBlur = 3.5;
      g.shadowOffsetX = 1.2;
      g.shadowOffsetY = 2;
      g.fillStyle = base;
      g.fill(p);
      g.restore();
      // Then the threads themselves, laid side by side across the shape.
      g.save();
      g.clip(p);
      const cx = (b[0] + b[2]) / 2;
      const cy = (b[1] + b[3]) / 2;
      const reach = Math.hypot(b[2] - b[0], b[3] - b[1]) / 2 + ROW;
      g.translate(cx, cy);
      g.rotate(this.mode === 'wrong' ? this.rnd() * 3 : slant);
      g.lineCap = 'butt';
      for (let y = -reach; y < reach; y += ROW) {
        // No two lengths of hand-dyed wool are the same shade.
        g.strokeStyle = tone(base, 0.9 + this.rnd() * 0.22);
        g.lineWidth = ROW;
        g.beginPath();
        g.moveTo(-reach, y);
        g.lineTo(reach, y);
        g.stroke();
        // And one length is not the same shade all the way along.
        for (let k = 0; k < 2; k++) {
          const from = -reach + this.rnd() * reach * 2;
          g.strokeStyle = this.rnd() < 0.5 ? 'rgba(255, 240, 210, 0.13)' : 'rgba(30, 16, 8, 0.13)';
          g.beginPath();
          g.moveTo(from, y);
          g.lineTo(from + 8 + this.rnd() * reach * 0.7, y);
          g.stroke();
        }
        g.lineWidth = 1;
        g.strokeStyle = 'rgba(255, 246, 225, 0.3)'; // lit along its top
        g.beginPath();
        g.moveTo(-reach, y - ROW * 0.24);
        g.lineTo(reach, y - ROW * 0.24);
        g.stroke();
        g.strokeStyle = 'rgba(24, 13, 7, 0.34)'; // dark where it meets the next
        g.beginPath();
        g.moveTo(-reach, y + ROW * 0.5);
        g.lineTo(reach, y + ROW * 0.5);
        g.stroke();
      }
      // The threads across, that hold the laid ones down: short stitches, staggered.
      g.lineWidth = 1.5;
      g.strokeStyle = tone(base, 0.62);
      g.setLineDash([ROW * 1.3, ROW * 2.7]);
      let odd = 0;
      for (let x = -reach; x < reach; x += 15) {
        g.lineDashOffset = odd++ % 2 ? ROW * 2 : 0;
        g.beginPath();
        g.moveTo(x, -reach);
        g.lineTo(x, reach);
        g.stroke();
      }
      g.setLineDash([]);
      g.lineDashOffset = 0;
      g.lineCap = 'round';
      g.restore();
    }
    if (edge) this.rope(p, this.ink(edge), 2.8);
    this.note(p, [b[0] - 3, b[1] - 3, b[2] + 3, b[3] + 5]);
  }
  shape(pts: Pt[], colour: Wool | null, edge: Wool | null = 'dark', smooth = true, slant = 0.5): void {
    this.work(this.path(pts, true, smooth), colour, edge, slant);
  }
  /** A line of stem stitch. */
  line(pts: Pt[], colour: Wool = 'dark', width = 2.3, smooth = true): void {
    const p = this.path(pts, false, smooth);
    if (this.mode === 'sketch') return this.sketched(p);
    this.rope(p, this.ink(colour), width + 0.5);
    const b = this.boxes.get(p)!;
    const pad = width / 2 + 3;
    this.note(this.rect([b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad]), [b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad]);
  }
  oval(x: number, y: number, rx: number, ry: number, colour: Wool | null, edge: Wool | null = 'dark', turn = 0): void {
    const [px, py] = this.place([x, y]);
    const p = new Path2D();
    p.ellipse(px, py, rx, ry, turn, 0, Math.PI * 2);
    const r = Math.max(rx, ry);
    this.boxes.set(p, [px - r, py - r, px + r, py + r]);
    this.work(p, colour, edge);
  }
  /**
   * Lettering as on the cloth: plain capitals, each word in a different wool.
   * `font` names another typeface, for runes; `whole` keeps the text in one piece and one wool,
   * for a script that joins its letters and runs from right to left.
   */
  words(text: string, x: number, y: number, size: number, align: CanvasTextAlign = 'center', maxWidth = 0, font = "Georgia, 'Times New Roman', serif", whole = false): void {
    const g = this.g;
    g.font = `600 ${size}px ${font}`;
    g.textBaseline = 'middle';
    const list = whole ? [text] : text.split(' ');
    const gap = size * 0.42;
    const spaced = whole ? 0 : size * 0.06;
    const widths = list.map((w) => g.measureText(w).width + w.length * spaced);
    let total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
    let squeeze = 1;
    if (maxWidth && total > maxWidth) {
      squeeze = maxWidth / total;
      total = maxWidth;
    }
    let at = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    const start = at;
    const inks: Wool[] = ['navy', 'terracotta', 'dark', 'teal', 'rust'];
    list.forEach((word, i) => {
      g.save();
      g.translate(at, y);
      g.scale(squeeze, 1);
      g.textAlign = 'left';
      (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spaced}px`;
      if (this.mode === 'sketch') {
        g.strokeStyle = 'rgba(110, 92, 70, 0.6)';
        g.lineWidth = 0.9;
        g.setLineDash([3, 3]);
        g.strokeText(word, 0, 0);
        g.setLineDash([]);
      } else {
        g.shadowColor = 'rgba(46, 30, 14, 0.4)';
        g.shadowBlur = 2;
        g.shadowOffsetY = 1.2;
        g.fillStyle = g.strokeStyle = this.ink(inks[i % inks.length]);
        g.fillText(word, 0, 0);
        // Runes are cut as thin strokes; stitched, they want more thread.
        if (font.startsWith('Runes')) {
          g.lineWidth = 1.5;
          g.strokeText(word, 0, 0);
        }
      }
      g.restore();
      at += (widths[i] + gap) * squeeze;
    });
    const box: Box = [start - 4, y - size * 0.7, start + total + 4, y + size * 0.7];
    this.note(this.rect(box), box);
  }
}
