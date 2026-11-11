/**
 * Drawing as embroidery. Everything in the Tapestry world is put down with
 * this kit, which works the way the real cloth was worked: shapes are filled
 * with rows of laid thread held down by crossing threads, and outlined in a
 * darker stem stitch, in eight colours of wool on bare linen.
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

const MUDDLE: Record<Wool, Wool> = { terracotta: 'teal', ochre: 'navy', sage: 'rust', teal: 'ochre', navy: 'sage', buff: 'terracotta', dark: 'ochre', rust: 'buff' };

export class Stitcher {
  private seed = 7;
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
  path(pts: Pt[], closed = true, smooth = true): Path2D {
    const q = pts.map((p) => this.place(p));
    const p = new Path2D();
    const n = q.length;
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
  /** Fills a path with laid threads and outlines it in stem stitch. */
  work(p: Path2D, colour: Wool | null, edge: Wool | null = 'dark', slant = 0.5): void {
    const g = this.g;
    if (this.mode === 'sketch') {
      g.setLineDash([4, 4]);
      g.lineWidth = 1.1;
      g.strokeStyle = 'rgba(110, 92, 70, 0.75)';
      g.stroke(p);
      g.setLineDash([]);
      return;
    }
    if (colour) {
      g.fillStyle = this.ink(colour);
      g.fill(p);
      // The laid threads: fine parallel rows, some catching the light and some in shadow...
      g.save();
      g.clip(p);
      const a = this.mode === 'wrong' ? this.rnd() * 3 : slant;
      g.translate(500, 260);
      g.rotate(a);
      g.lineWidth = 1;
      for (let y = -900; y < 900; y += 3) {
        g.strokeStyle = (y / 3) % 2 ? 'rgba(255, 244, 220, 0.2)' : 'rgba(30, 18, 10, 0.16)';
        g.beginPath();
        g.moveTo(-900, y);
        g.lineTo(900, y);
        g.stroke();
      }
      // ...and the threads laid across them at intervals to hold them down.
      g.strokeStyle = 'rgba(30, 18, 10, 0.2)';
      for (let x = -900; x < 900; x += 13) {
        g.beginPath();
        g.moveTo(x, -900);
        g.lineTo(x, 900);
        g.stroke();
      }
      g.restore();
    }
    if (edge) {
      g.strokeStyle = this.ink(edge);
      g.lineWidth = 2.3;
      g.stroke(p);
      // Stem stitch is a row of short slanting stitches: show the breaks between them.
      g.strokeStyle = 'rgba(255, 244, 220, 0.28)';
      g.lineWidth = 0.9;
      g.setLineDash([1.5, 5]);
      g.stroke(p);
      g.setLineDash([]);
    }
  }
  shape(pts: Pt[], colour: Wool | null, edge: Wool | null = 'dark', smooth = true, slant = 0.5): void {
    this.work(this.path(pts, true, smooth), colour, edge, slant);
  }
  /** A line of stem stitch. */
  line(pts: Pt[], colour: Wool = 'dark', width = 2.3, smooth = true): void {
    const g = this.g;
    const p = this.path(pts, false, smooth);
    if (this.mode === 'sketch') {
      g.setLineDash([4, 4]);
      g.lineWidth = 1.1;
      g.strokeStyle = 'rgba(110, 92, 70, 0.75)';
      g.stroke(p);
      g.setLineDash([]);
      return;
    }
    g.strokeStyle = this.ink(colour);
    g.lineWidth = width;
    g.stroke(p);
    g.strokeStyle = 'rgba(255, 244, 220, 0.28)';
    g.lineWidth = Math.max(0.7, width * 0.4);
    g.setLineDash([1.5, 5]);
    g.stroke(p);
    g.setLineDash([]);
  }
  oval(x: number, y: number, rx: number, ry: number, colour: Wool | null, edge: Wool | null = 'dark', turn = 0): void {
    const [px, py] = this.place([x, y]);
    const p = new Path2D();
    p.ellipse(px, py, rx, ry, turn, 0, Math.PI * 2);
    this.work(p, colour, edge);
  }
  /** Lettering as on the cloth: plain capitals, each word in a different wool. */
  words(text: string, x: number, y: number, size: number, align: CanvasTextAlign = 'center', maxWidth = 0): void {
    const g = this.g;
    g.font = `600 ${size}px Georgia, 'Times New Roman', serif`;
    g.textBaseline = 'middle';
    const list = text.split(' ');
    const gap = size * 0.42;
    const widths = list.map((w) => g.measureText(w).width + w.length * size * 0.06);
    let total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
    let squeeze = 1;
    if (maxWidth && total > maxWidth) {
      squeeze = maxWidth / total;
      total = maxWidth;
    }
    let at = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    const inks: Wool[] = ['navy', 'terracotta', 'dark', 'teal', 'rust'];
    list.forEach((word, i) => {
      g.save();
      g.translate(at, y);
      g.scale(squeeze, 1);
      (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${size * 0.06}px`;
      if (this.mode === 'sketch') {
        g.strokeStyle = 'rgba(110, 92, 70, 0.6)';
        g.lineWidth = 0.9;
        g.setLineDash([3, 3]);
        g.strokeText(word, 0, 0);
        g.setLineDash([]);
      } else {
        g.fillStyle = this.ink(inks[i % inks.length]);
        g.fillText(word, 0, 0);
      }
      g.restore();
      at += (widths[i] + gap) * squeeze;
    });
  }
}
