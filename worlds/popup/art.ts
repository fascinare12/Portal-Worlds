/**
 * The Pop-up Book: what is on the paper.
 *
 * Everything is cut paper: flat shapes of plain colour laid one on another,
 * each with the thin shadow of the sheet above it. There are pictures, which
 * are cut out round their edges, and papers, which cover the whole piece.
 */

export interface Art {
  name: string;
  /** A paper covers the whole piece; a picture is cut out round its outline. */
  paper: boolean;
  draw(g: CanvasRenderingContext2D): void;
}

const SIZE = 256;
type Path = (g: CanvasRenderingContext2D) => void;

/** One piece of cut paper: its shadow on the sheet below, then itself. */
function cut(g: CanvasRenderingContext2D, colour: string, path: Path, shadow = true): void {
  if (shadow) {
    g.save();
    g.translate(3, 4);
    g.fillStyle = 'rgba(40, 28, 16, 0.22)';
    g.beginPath();
    path(g);
    g.fill();
    g.restore();
  }
  g.fillStyle = colour;
  g.beginPath();
  path(g);
  g.fill();
}
const poly = (...p: number[]): Path => (g) => {
  g.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]);
  g.closePath();
};
const disc = (x: number, y: number, r: number, ry = r): Path => (g) => g.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
const box = (x: number, y: number, w: number, h: number): Path => (g) => g.rect(x, y, w, h);
/** Thin snipped lines, for straw, sticks and the courses of bricks. */
function lines(g: CanvasRenderingContext2D, colour: string, width: number, segs: number[][]): void {
  g.strokeStyle = colour;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.beginPath();
  for (const [a, b, c, d] of segs) {
    g.moveTo(a, b);
    g.lineTo(c, d);
  }
  g.stroke();
}
/** A seeded scatter, so that a paper looks the same every time. */
function scatter(n: number, seed: number): number[][] {
  const out: number[][] = [];
  let s = seed;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < n; i++) out.push([r(), r(), r(), r()]);
  return out;
}

const CREAM = '#f4ead6';
const bricks = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, course = 18): void => {
  const segs: number[][] = [];
  for (let row = 0, yy = y + course; yy < y + h; yy += course, row++) segs.push([x, yy, x + w, yy]);
  for (let row = 0, yy = y; yy < y + h; yy += course, row++) for (let xx = x + (row % 2 ? course : course * 2); xx < x + w; xx += course * 2) segs.push([xx, yy, xx, Math.min(yy + course, y + h)]);
  lines(g, '#f1d9c4', 2.2, segs);
};

export const ART: Record<string, Art> = {
  // ---- Pictures ----
  tree: {
    name: 'tree',
    paper: false,
    draw(g) {
      cut(g, '#7a5236', poly(112, 250, 118, 130, 138, 130, 144, 250));
      cut(g, '#3f7d4a', disc(128, 120, 78, 70));
      cut(g, '#58994f', disc(96, 92, 50, 46));
      cut(g, '#58994f', disc(164, 104, 46, 42));
      cut(g, '#7db85e', disc(130, 62, 44, 40));
    },
  },
  pine: {
    name: 'pine',
    paper: false,
    draw(g) {
      cut(g, '#6b4630', box(116, 200, 24, 52));
      cut(g, '#2f6a4a', poly(128, 96, 222, 214, 34, 214));
      cut(g, '#3c8058', poly(128, 50, 200, 150, 56, 150));
      cut(g, '#55996a', poly(128, 6, 178, 88, 78, 88));
    },
  },
  bush: {
    name: 'bush',
    paper: false,
    draw(g) {
      cut(g, '#3f7d4a', disc(80, 190, 62, 54));
      cut(g, '#3f7d4a', disc(176, 190, 62, 54));
      cut(g, '#58994f', disc(128, 158, 70, 60));
      cut(g, '#d9534a', disc(100, 160, 8));
      cut(g, '#d9534a', disc(150, 140, 8));
      cut(g, '#d9534a', disc(170, 190, 8));
      cut(g, '#3f7d4a', box(22, 196, 212, 54), false);
    },
  },
  hill: {
    name: 'hill',
    paper: false,
    draw(g) {
      cut(g, '#6faa5c', (c) => {
        c.moveTo(0, 256);
        c.quadraticCurveTo(128, -40, 256, 256);
        c.closePath();
      });
      cut(g, '#8fc46e', (c) => {
        c.moveTo(40, 256);
        c.quadraticCurveTo(140, 70, 230, 256);
        c.closePath();
      });
    },
  },
  sun: {
    name: 'sun',
    paper: false,
    draw(g) {
      const rays: number[] = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const r = i % 2 ? 78 : 122;
        rays.push(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
      }
      cut(g, '#f2b632', poly(...rays));
      cut(g, '#f7d154', disc(128, 128, 66));
    },
  },
  cloud: {
    name: 'cloud',
    paper: false,
    draw(g) {
      cut(g, '#ffffff', (c) => {
        c.ellipse(80, 150, 58, 44, 0, 0, 7);
        c.ellipse(176, 150, 62, 46, 0, 0, 7);
        c.ellipse(128, 112, 62, 52, 0, 0, 7);
      });
      cut(g, '#ffffff', box(60, 150, 140, 44), false);
    },
  },
  pig: {
    name: 'pig',
    paper: false,
    draw(g) {
      cut(g, '#e58f9c', box(74, 196, 26, 52));
      cut(g, '#e58f9c', box(156, 196, 26, 52));
      cut(g, '#f4a9b4', disc(128, 164, 84, 62));
      cut(g, '#e58f9c', poly(60, 62, 96, 80, 70, 112));
      cut(g, '#e58f9c', poly(196, 62, 160, 80, 186, 112));
      cut(g, '#f7b9c2', disc(128, 108, 62, 56));
      cut(g, '#ec97a5', disc(128, 124, 30, 22));
      cut(g, '#8a4250', disc(117, 124, 5.5, 8), false);
      cut(g, '#8a4250', disc(139, 124, 5.5, 8), false);
      cut(g, '#3a2a26', disc(104, 92, 6.5), false);
      cut(g, '#3a2a26', disc(152, 92, 6.5), false);
    },
  },
  wolf: {
    name: 'wolf',
    paper: false,
    draw(g) {
      cut(g, '#6f7480', poly(40, 240, 20, 150, 60, 190));
      cut(g, '#7d8390', box(84, 196, 26, 54));
      cut(g, '#7d8390', box(150, 196, 26, 54));
      cut(g, '#8f95a3', disc(128, 170, 72, 56));
      cut(g, '#7d8390', poly(66, 20, 104, 62, 62, 90));
      cut(g, '#7d8390', poly(190, 20, 152, 62, 194, 90));
      cut(g, '#a2a8b5', poly(60, 70, 196, 70, 172, 132, 128, 176, 84, 132));
      cut(g, '#e8e2d6', poly(98, 122, 158, 122, 128, 176));
      cut(g, '#2e2a2c', disc(128, 166, 12, 9), false);
      cut(g, '#f2c84b', disc(102, 96, 10, 8), false);
      cut(g, '#f2c84b', disc(154, 96, 10, 8), false);
      cut(g, '#2e2a2c', disc(102, 96, 3.5, 7), false);
      cut(g, '#2e2a2c', disc(154, 96, 3.5, 7), false);
      cut(g, '#ffffff', poly(110, 150, 116, 164, 122, 150), false);
      cut(g, '#ffffff', poly(134, 150, 140, 164, 146, 150), false);
    },
  },
  strawhouse: {
    name: 'straw house',
    paper: false,
    draw(g) {
      cut(g, '#e6c766', box(40, 130, 176, 122));
      lines(g, '#c9a43f', 2.4, scatter(46, 7).map(([a, b, c]) => [44 + a * 168, 136 + b * 100, 44 + a * 168 + (c - 0.5) * 10, 136 + b * 100 + 18]));
      cut(g, '#6b4a2e', (c) => {
        c.moveTo(104, 252);
        c.lineTo(104, 196);
        c.quadraticCurveTo(128, 166, 152, 196);
        c.lineTo(152, 252);
        c.closePath();
      });
      cut(g, '#d4ae45', poly(128, 8, 250, 140, 6, 140));
      lines(g, '#b08a2c', 2.6, scatter(40, 11).map(([a, b]) => {
        const y = 40 + b * 94;
        const half = ((y - 8) / 132) * 118;
        const x = 128 + (a - 0.5) * 2 * half;
        return [x, y, x + (x - 128) * 0.12, y + 16];
      }));
    },
  },
  stickhouse: {
    name: 'stick house',
    paper: false,
    draw(g) {
      cut(g, '#a8774a', box(40, 124, 176, 128));
      lines(g, '#7a5232', 3, Array.from({ length: 10 }, (_, i) => [56 + i * 16, 128, 56 + i * 16, 250]));
      lines(g, '#c69563', 2, Array.from({ length: 10 }, (_, i) => [50 + i * 16, 128, 50 + i * 16, 250]));
      cut(g, '#5a3c26', box(104, 180, 48, 72));
      cut(g, '#f6e3a4', box(166, 160, 30, 30));
      cut(g, '#8a5c38', poly(128, 10, 248, 132, 8, 132));
      lines(g, '#5f3e25', 3, [[128, 14, 34, 118], [128, 14, 222, 118], [128, 14, 80, 126], [128, 14, 176, 126], [128, 14, 128, 128]]);
    },
  },
  brickhouse: {
    name: 'brick house',
    paper: false,
    draw(g) {
      cut(g, '#8d3f31', box(170, 20, 34, 80));
      cut(g, '#b9523f', box(36, 116, 184, 136));
      bricks(g, 36, 116, 184, 136);
      cut(g, '#4c6a8a', box(102, 176, 50, 76));
      cut(g, '#f2c84b', disc(142, 216, 4.5), false);
      cut(g, '#f6e3a4', box(52, 150, 34, 34));
      cut(g, '#f6e3a4', box(170, 150, 34, 34));
      cut(g, '#59606e', poly(128, 16, 250, 124, 6, 124));
    },
  },
  pot: {
    name: 'cooking pot',
    paper: false,
    draw(g) {
      cut(g, '#f2a03a', poly(70, 250, 96, 190, 112, 226, 128, 178, 146, 226, 160, 192, 186, 250));
      cut(g, '#f7d154', poly(100, 250, 128, 206, 156, 250), false);
      cut(g, '#34343c', (c) => {
        c.moveTo(48, 96);
        c.lineTo(208, 96);
        c.quadraticCurveTo(222, 214, 128, 218);
        c.quadraticCurveTo(34, 214, 48, 96);
        c.closePath();
      });
      cut(g, '#4a4a54', box(36, 78, 184, 26));
      cut(g, '#ffffff', disc(96, 50, 16, 12));
      cut(g, '#ffffff', disc(140, 30, 20, 14));
    },
  },
  flower: {
    name: 'flower',
    paper: false,
    draw(g) {
      cut(g, '#4f8f4a', box(122, 120, 12, 132));
      cut(g, '#58994f', poly(128, 200, 70, 170, 90, 214));
      cut(g, '#58994f', poly(128, 180, 186, 150, 166, 196));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        cut(g, i % 2 ? '#e8627a' : '#f08a9c', disc(128 + Math.cos(a) * 44, 84 + Math.sin(a) * 44, 32));
      }
      cut(g, '#f7d154', disc(128, 84, 26));
    },
  },
  // ---- Papers ----
  straw: {
    name: 'straw',
    paper: true,
    draw(g) {
      g.fillStyle = '#e6c766';
      g.fillRect(0, 0, SIZE, SIZE);
      lines(g, '#c9a43f', 2.6, scatter(120, 3).map(([a, b, c]) => [a * 256, b * 256, a * 256 + (c - 0.5) * 16, b * 256 + 26]));
      lines(g, '#f3dd92', 2, scatter(60, 5).map(([a, b, c]) => [a * 256, b * 256, a * 256 + (c - 0.5) * 12, b * 256 + 22]));
    },
  },
  sticks: {
    name: 'sticks',
    paper: true,
    draw(g) {
      g.fillStyle = '#a8774a';
      g.fillRect(0, 0, SIZE, SIZE);
      lines(g, '#7a5232', 4, Array.from({ length: 13 }, (_, i) => [10 + i * 20, 0, 10 + i * 20, 256]));
      lines(g, '#c69563', 2.4, Array.from({ length: 13 }, (_, i) => [3 + i * 20, 0, 3 + i * 20, 256]));
    },
  },
  bricks: {
    name: 'bricks',
    paper: true,
    draw(g) {
      g.fillStyle = '#b9523f';
      g.fillRect(0, 0, SIZE, SIZE);
      bricks(g, 0, 0, 256, 256, 21.33);
    },
  },
  grass: {
    name: 'grass',
    paper: true,
    draw(g) {
      g.fillStyle = '#7db85e';
      g.fillRect(0, 0, SIZE, SIZE);
      lines(g, '#5e9a48', 3, scatter(70, 9).map(([a, b, c]) => [a * 256, b * 256, a * 256 + (c - 0.5) * 12, b * 256 - 16]));
    },
  },
  water: {
    name: 'water',
    paper: true,
    draw(g) {
      g.fillStyle = '#5aa6c9';
      g.fillRect(0, 0, SIZE, SIZE);
      g.strokeStyle = '#bfe3ef';
      g.lineWidth = 3;
      for (let y = 22; y < 256; y += 40) {
        g.beginPath();
        for (let x = -20; x <= 276; x += 40) g.quadraticCurveTo(x + 10, y - 12, x + 20, y), g.quadraticCurveTo(x + 30, y + 12, x + 40, y);
        g.stroke();
      }
    },
  },
  red: { name: 'red paper', paper: true, draw: (g) => ((g.fillStyle = '#d9534a'), g.fillRect(0, 0, SIZE, SIZE)) },
  blue: { name: 'blue paper', paper: true, draw: (g) => ((g.fillStyle = '#4c6a8a'), g.fillRect(0, 0, SIZE, SIZE)) },
  plain: { name: 'plain paper', paper: true, draw: (g) => ((g.fillStyle = CREAM), g.fillRect(0, 0, SIZE, SIZE)) },
};

const made = new Map<string, HTMLCanvasElement>();
/** The picture or paper, drawn once and kept. */
export function canvasOf(id: string): HTMLCanvasElement {
  let c = made.get(id);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const g = c.getContext('2d');
    if (g) (ART[id] ?? ART.plain).draw(g);
    made.set(id, c);
  }
  return c;
}
const urls = new Map<string, string>();
export function urlOf(id: string): string {
  if (!urls.has(id)) urls.set(id, canvasOf(id).toDataURL('image/png'));
  return urls.get(id)!;
}

/** Cream paper with a few fibres in it, for the pages. */
export function pagePaper(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  if (!g) return c;
  g.fillStyle = CREAM;
  g.fillRect(0, 0, 512, 512);
  for (const [a, b, d, e] of scatter(900, 21)) {
    g.strokeStyle = e < 0.5 ? 'rgba(150, 120, 80, 0.07)' : 'rgba(255, 255, 255, 0.35)';
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(a * 512, b * 512);
    g.lineTo(a * 512 + (d - 0.5) * 22, b * 512 + (e - 0.5) * 22);
    g.stroke();
  }
  return c;
}
