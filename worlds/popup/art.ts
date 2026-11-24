/// <reference types="vite/client" />
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
  // ---- Jack and the Beanstalk ----
  beanstalk: {
    name: 'beanstalk',
    paper: false,
    draw(g) {
      cut(g, '#4f8f4a', (c) => {
        c.moveTo(112, 256);
        c.bezierCurveTo(60, 190, 190, 150, 118, 90);
        c.bezierCurveTo(80, 50, 150, 30, 128, 0);
        c.lineTo(148, 0);
        c.bezierCurveTo(170, 36, 106, 52, 140, 86);
        c.bezierCurveTo(214, 150, 86, 190, 138, 256);
        c.closePath();
      });
      for (const [x, y, r, f] of [[78, 200, 30, 1], [182, 150, 30, -1], [80, 104, 26, 1], [176, 60, 24, -1], [92, 30, 18, 1]]) cut(g, '#6fb35a', (c) => c.ellipse(x, y, r, r * 0.55, f * 0.5, 0, 7));
    },
  },
  giant: {
    name: 'giant',
    paper: false,
    draw(g) {
      cut(g, '#5a4632', box(70, 196, 46, 56));
      cut(g, '#5a4632', box(140, 196, 46, 56));
      cut(g, '#7a8f4e', poly(44, 110, 212, 110, 200, 206, 56, 206));
      cut(g, '#e3b58a', disc(30, 150, 20));
      cut(g, '#e3b58a', disc(226, 150, 20));
      cut(g, '#e3b58a', disc(128, 66, 52, 50));
      cut(g, '#6b4630', poly(76, 50, 100, 12, 128, 30, 156, 12, 180, 50, 128, 40));
      cut(g, '#6b4630', poly(92, 84, 164, 84, 150, 118, 128, 126, 106, 118));
      cut(g, '#3a2a26', disc(108, 62, 6), false);
      cut(g, '#3a2a26', disc(148, 62, 6), false);
      cut(g, '#c98d6a', disc(128, 78, 10, 8), false);
    },
  },
  castle: {
    name: 'castle',
    paper: false,
    draw(g) {
      cut(g, '#b8bcc8', box(50, 110, 156, 142));
      cut(g, '#cfd3dd', poly(20, 70, 30, 70, 30, 56, 44, 56, 44, 70, 58, 70, 58, 56, 72, 56, 72, 70, 82, 70, 82, 252, 20, 252));
      cut(g, '#cfd3dd', poly(174, 70, 184, 70, 184, 56, 198, 56, 198, 70, 212, 70, 212, 56, 226, 56, 226, 70, 236, 70, 236, 252, 174, 252));
      cut(g, '#b9523f', poly(51, 8, 86, 56, 16, 56));
      cut(g, '#b9523f', poly(205, 8, 240, 56, 170, 56));
      cut(g, '#5a4632', (c) => {
        c.moveTo(104, 252);
        c.lineTo(104, 190);
        c.quadraticCurveTo(128, 156, 152, 190);
        c.lineTo(152, 252);
        c.closePath();
      });
      cut(g, '#4c6a8a', box(42, 120, 16, 30), false);
      cut(g, '#4c6a8a', box(198, 120, 16, 30), false);
    },
  },
  cow: {
    name: 'cow',
    paper: false,
    draw(g) {
      for (const x of [62, 92, 160, 190]) cut(g, '#e9e2d4', box(x, 180, 20, 68));
      cut(g, '#f6f1e6', disc(126, 150, 86, 54));
      cut(g, '#3a2e2a', disc(100, 136, 26, 20), false);
      cut(g, '#3a2e2a', disc(162, 168, 22, 16), false);
      cut(g, '#f6f1e6', disc(214, 100, 38, 34));
      cut(g, '#f2a9b4', disc(226, 116, 22, 16));
      cut(g, '#e9cf8f', poly(188, 70, 180, 44, 200, 62));
      cut(g, '#e9cf8f', poly(236, 70, 246, 44, 226, 62));
      cut(g, '#3a2a26', disc(206, 92, 5), false);
      cut(g, '#3a2a26', disc(228, 92, 5), false);
    },
  },
  beans: {
    name: 'magic beans',
    paper: false,
    draw(g) {
      for (const [x, y, a, col] of [[90, 150, 0.4, '#7b4ea3'], [150, 120, -0.5, '#4f8f4a'], [160, 180, 0.9, '#d9534a'], [100, 96, -0.2, '#f2b632'], [128, 150, 1.4, '#4c6a8a']] as [number, number, number, string][]) cut(g, col, (c) => c.ellipse(x, y, 34, 22, a, 0, 7));
    },
  },
  jack: {
    name: 'Jack',
    paper: false,
    draw(g) {
      cut(g, '#4c6a8a', box(98, 170, 26, 80));
      cut(g, '#4c6a8a', box(132, 170, 26, 80));
      cut(g, '#d9534a', poly(84, 98, 172, 98, 164, 180, 92, 180));
      cut(g, '#e8b98f', disc(74, 140, 14));
      cut(g, '#e8b98f', disc(182, 140, 14));
      cut(g, '#e8b98f', disc(128, 60, 40));
      cut(g, '#b9762f', poly(86, 54, 96, 18, 160, 18, 170, 54, 128, 36));
      cut(g, '#3a2a26', disc(114, 62, 5), false);
      cut(g, '#3a2a26', disc(142, 62, 5), false);
    },
  },
  egg: {
    name: 'golden egg',
    paper: false,
    draw(g) {
      cut(g, '#b08a2c', disc(128, 226, 70, 18));
      cut(g, '#f2b632', (c) => c.ellipse(128, 138, 62, 84, 0, 0, 7));
      cut(g, '#f7d154', (c) => c.ellipse(108, 110, 20, 34, 0.4, 0, 7), false);
    },
  },
  // ---- The Three Billy Goats Gruff ----
  goat: {
    name: 'billy goat',
    paper: false,
    draw(g) {
      for (const x of [70, 98, 150, 178]) cut(g, '#d9d2c2', box(x, 176, 18, 72));
      cut(g, '#efe9db', disc(122, 148, 74, 46));
      cut(g, '#efe9db', poly(170, 130, 214, 60, 240, 84, 226, 128, 196, 158));
      cut(g, '#8a6a4a', (c) => {
        c.moveTo(214, 62);
        c.quadraticCurveTo(190, 10, 160, 30);
        c.quadraticCurveTo(190, 30, 204, 70);
        c.closePath();
      });
      cut(g, '#efe9db', poly(226, 126, 232, 168, 214, 136));
      cut(g, '#3a2a26', disc(222, 92, 5), false);
      cut(g, '#efe9db', poly(50, 130, 34, 112, 56, 146));
    },
  },
  troll: {
    name: 'troll',
    paper: false,
    draw(g) {
      cut(g, '#5f7a4a', box(84, 200, 34, 50));
      cut(g, '#5f7a4a', box(138, 200, 34, 50));
      cut(g, '#6f8f55', disc(128, 160, 74, 60));
      cut(g, '#6f8f55', disc(40, 170, 22));
      cut(g, '#6f8f55', disc(216, 170, 22));
      cut(g, '#84a868', disc(128, 84, 58, 50));
      cut(g, '#6f8f55', poly(64, 80, 30, 50, 74, 100));
      cut(g, '#6f8f55', poly(192, 80, 226, 50, 182, 100));
      cut(g, '#5a4632', poly(82, 50, 100, 20, 128, 42, 156, 20, 174, 50, 128, 40));
      cut(g, '#f7d154', disc(106, 78, 11), false);
      cut(g, '#f7d154', disc(150, 78, 11), false);
      cut(g, '#3a2a26', disc(106, 78, 4.5), false);
      cut(g, '#3a2a26', disc(150, 78, 4.5), false);
      cut(g, '#ffffff', poly(108, 112, 114, 126, 120, 112), false);
      cut(g, '#ffffff', poly(136, 112, 142, 126, 148, 112), false);
      cut(g, '#5f7a4a', disc(128, 98, 12, 9), false);
    },
  },
  // ---- Little Red Riding Hood ----
  redhood: {
    name: 'Red Riding Hood',
    paper: false,
    draw(g) {
      cut(g, '#5a4632', box(106, 214, 18, 36));
      cut(g, '#5a4632', box(132, 214, 18, 36));
      cut(g, '#c93a36', poly(128, 20, 196, 110, 206, 226, 50, 226, 60, 110));
      cut(g, '#e8b98f', disc(128, 92, 36));
      cut(g, '#c93a36', (c) => {
        c.moveTo(84, 100);
        c.quadraticCurveTo(128, 20, 172, 100);
        c.quadraticCurveTo(128, 50, 84, 100);
        c.closePath();
      });
      cut(g, '#3a2a26', disc(116, 94, 4.5), false);
      cut(g, '#3a2a26', disc(140, 94, 4.5), false);
      cut(g, '#b9762f', box(150, 170, 46, 34));
      lines(g, '#8a5c38', 3, [[150, 180, 196, 180], [150, 192, 196, 192]]);
    },
  },
  cottage: {
    name: 'cottage',
    paper: false,
    draw(g) {
      cut(g, '#f1e2c2', box(40, 124, 176, 128));
      cut(g, '#5a8f6a', box(100, 176, 50, 76));
      cut(g, '#bfe3ef', box(54, 150, 34, 34));
      cut(g, '#bfe3ef', box(168, 150, 34, 34));
      lines(g, '#5a4632', 2.5, [[71, 150, 71, 184], [54, 167, 88, 167], [185, 150, 185, 184], [168, 167, 202, 167]]);
      cut(g, '#8a5c38', box(176, 30, 28, 70));
      cut(g, '#b9762f', poly(128, 14, 250, 132, 6, 132));
    },
  },
  bed: {
    name: 'bed',
    paper: false,
    draw(g) {
      cut(g, '#8a5c38', box(20, 70, 22, 170));
      cut(g, '#8a5c38', box(214, 130, 22, 110));
      cut(g, '#f6f1e6', box(42, 150, 172, 60));
      // The pillow: a box with its corners rounded by hand, since not every browser can round them itself.
      cut(g, '#ffffff', (c) => {
        c.moveTo(60, 118);
        c.lineTo(96, 118);
        c.quadraticCurveTo(110, 118, 110, 132);
        c.lineTo(110, 144);
        c.quadraticCurveTo(110, 158, 96, 158);
        c.lineTo(60, 158);
        c.quadraticCurveTo(46, 158, 46, 144);
        c.lineTo(46, 132);
        c.quadraticCurveTo(46, 118, 60, 118);
        c.closePath();
      });
      cut(g, '#7b9fc9', poly(96, 150, 214, 150, 214, 214, 96, 214));
      lines(g, '#bfe3ef', 3, [[110, 166, 200, 166], [110, 182, 200, 182], [110, 198, 200, 198]]);
    },
  },
  basket: {
    name: 'basket',
    paper: false,
    draw(g) {
      g.strokeStyle = '#8a5c38';
      g.lineWidth = 12;
      g.beginPath();
      g.arc(128, 140, 66, Math.PI, 0);
      g.stroke();
      cut(g, '#d9534a', disc(104, 138, 22));
      cut(g, '#f6f1e6', poly(120, 110, 176, 110, 170, 150, 126, 150));
      cut(g, '#b9762f', poly(52, 140, 204, 140, 186, 226, 70, 226));
      lines(g, '#8a5c38', 3, [[60, 162, 196, 162], [66, 186, 190, 186], [72, 208, 184, 208]]);
    },
  },
  // ---- Rapunzel ----
  tower: {
    name: 'tower',
    paper: false,
    draw(g) {
      cut(g, '#b8bcc8', poly(92, 80, 164, 80, 172, 252, 84, 252));
      lines(g, '#8f94a3', 2.4, [[90, 120, 166, 120], [88, 160, 168, 160], [87, 200, 169, 200], [110, 120, 110, 160], [146, 160, 146, 200], [128, 200, 128, 250]]);
      cut(g, '#cfd3dd', box(76, 64, 104, 24));
      cut(g, '#7b4ea3', poly(128, 4, 190, 66, 66, 66));
      cut(g, '#3a2e3a', (c) => {
        c.moveTo(112, 118);
        c.lineTo(112, 96);
        c.quadraticCurveTo(128, 78, 144, 96);
        c.lineTo(144, 118);
        c.closePath();
      });
    },
  },
  rapunzel: {
    name: 'Rapunzel',
    paper: false,
    draw(g) {
      cut(g, '#f2c84b', poly(92, 60, 164, 60, 178, 250, 150, 250, 146, 120, 110, 120, 106, 250, 78, 250));
      cut(g, '#9b6fc0', poly(128, 96, 180, 250, 76, 250));
      cut(g, '#e8b98f', disc(128, 70, 34));
      cut(g, '#f2c84b', (c) => {
        c.moveTo(92, 74);
        c.quadraticCurveTo(128, 6, 164, 74);
        c.quadraticCurveTo(128, 40, 92, 74);
        c.closePath();
      });
      cut(g, '#3a2a26', disc(116, 74, 4.5), false);
      cut(g, '#3a2a26', disc(140, 74, 4.5), false);
    },
  },
  hair: {
    name: 'golden hair',
    paper: false,
    draw(g) {
      for (let i = 0; i < 9; i++) cut(g, i % 2 ? '#f2c84b' : '#e2b23a', (c) => c.ellipse(128 + (i % 2 ? 12 : -12), 18 + i * 26, 30, 20, i % 2 ? 0.5 : -0.5, 0, 7));
      cut(g, '#d9534a', poly(104, 236, 152, 236, 164, 256, 92, 256));
    },
  },
  prince: {
    name: 'prince',
    paper: false,
    draw(g) {
      cut(g, '#3a2e2a', box(100, 176, 24, 74));
      cut(g, '#3a2e2a', box(132, 176, 24, 74));
      cut(g, '#4c6a8a', poly(84, 98, 172, 98, 166, 186, 90, 186));
      cut(g, '#f2b632', box(84, 138, 88, 10), false);
      cut(g, '#e8b98f', disc(128, 62, 38));
      cut(g, '#f2b632', poly(94, 40, 94, 12, 112, 28, 128, 8, 144, 28, 162, 12, 162, 40));
      cut(g, '#3a2a26', disc(114, 64, 5), false);
      cut(g, '#3a2a26', disc(142, 64, 5), false);
    },
  },
  witch: {
    name: 'witch',
    paper: false,
    draw(g) {
      cut(g, '#3a2e3a', poly(128, 96, 196, 250, 60, 250));
      cut(g, '#a8c79a', disc(128, 100, 36));
      cut(g, '#3a2e3a', poly(128, 0, 168, 76, 88, 76));
      cut(g, '#3a2e3a', (c) => c.ellipse(128, 76, 74, 12, 0, 0, 7));
      cut(g, '#a8c79a', poly(128, 100, 120, 122, 136, 122));
      cut(g, '#3a2a26', disc(114, 96, 4.5), false);
      cut(g, '#3a2a26', disc(142, 96, 4.5), false);
    },
  },
  // ---- Momotaro ----
  peach: {
    name: 'peach',
    paper: false,
    draw(g) {
      cut(g, '#4f8f4a', (c) => c.ellipse(176, 56, 44, 20, -0.5, 0, 7));
      cut(g, '#f7a6a0', (c) => {
        c.moveTo(128, 40);
        c.bezierCurveTo(240, 20, 250, 190, 128, 246);
        c.bezierCurveTo(6, 190, 16, 20, 128, 40);
        c.closePath();
      });
      cut(g, '#fbc9b5', (c) => c.ellipse(92, 120, 34, 56, 0.3, 0, 7), false);
      lines(g, '#e77f84', 4, [[128, 46, 128, 236]]);
    },
  },
  momotaro: {
    name: 'Momotaro',
    paper: false,
    draw(g) {
      cut(g, '#3a2e2a', box(100, 190, 24, 60));
      cut(g, '#3a2e2a', box(132, 190, 24, 60));
      cut(g, '#f6f1e6', poly(80, 100, 176, 100, 170, 200, 86, 200));
      cut(g, '#4c6a8a', poly(80, 100, 128, 150, 86, 200));
      cut(g, '#4c6a8a', poly(176, 100, 128, 150, 170, 200));
      cut(g, '#d9534a', box(86, 148, 84, 12), false);
      cut(g, '#e8b98f', disc(128, 62, 38));
      cut(g, '#2e2a2c', poly(92, 50, 100, 20, 156, 20, 164, 50, 128, 34));
      cut(g, '#ffffff', box(90, 40, 76, 10), false);
      cut(g, '#f7a6a0', disc(128, 45, 7), false);
      cut(g, '#3a2a26', disc(114, 66, 5), false);
      cut(g, '#3a2a26', disc(142, 66, 5), false);
    },
  },
  dog: {
    name: 'dog',
    paper: false,
    draw(g) {
      for (const x of [70, 98, 152, 180]) cut(g, '#c9a676', box(x, 178, 18, 70));
      cut(g, '#d9b98a', disc(126, 156, 76, 42));
      cut(g, '#d9b98a', poly(46, 150, 20, 96, 60, 130));
      cut(g, '#d9b98a', disc(206, 104, 40, 36));
      cut(g, '#8a5c38', poly(176, 80, 170, 130, 192, 100));
      cut(g, '#8a5c38', poly(232, 76, 244, 124, 222, 100));
      cut(g, '#f1e2c2', disc(216, 120, 20, 15));
      cut(g, '#2e2a2c', disc(222, 114, 6), false);
      cut(g, '#3a2a26', disc(198, 96, 4.5), false);
      cut(g, '#3a2a26', disc(220, 94, 4.5), false);
    },
  },
  monkey: {
    name: 'monkey',
    paper: false,
    draw(g) {
      g.strokeStyle = '#8a5c38';
      g.lineWidth = 12;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(176, 200);
      g.quadraticCurveTo(250, 200, 226, 130);
      g.stroke();
      cut(g, '#8a5c38', disc(128, 178, 54, 62));
      cut(g, '#e3b58a', disc(128, 190, 30, 38));
      cut(g, '#8a5c38', disc(74, 80, 22));
      cut(g, '#8a5c38', disc(182, 80, 22));
      cut(g, '#8a5c38', disc(128, 84, 48));
      cut(g, '#e3b58a', (c) => {
        c.ellipse(112, 76, 20, 22, 0, 0, 7);
        c.ellipse(144, 76, 20, 22, 0, 0, 7);
        c.ellipse(128, 100, 30, 24, 0, 0, 7);
      });
      cut(g, '#3a2a26', disc(114, 78, 5), false);
      cut(g, '#3a2a26', disc(142, 78, 5), false);
    },
  },
  pheasant: {
    name: 'pheasant',
    paper: false,
    draw(g) {
      cut(g, '#b9762f', poly(20, 200, 110, 130, 120, 170));
      cut(g, '#8a5c38', poly(10, 170, 110, 126, 100, 150));
      cut(g, '#c9683a', disc(140, 150, 62, 44));
      cut(g, '#2f6a4a', disc(200, 92, 32));
      cut(g, '#ffffff', box(176, 112, 40, 8), false);
      cut(g, '#d9342b', disc(206, 88, 14), false);
      cut(g, '#f2b632', poly(228, 88, 250, 96, 228, 104));
      cut(g, '#3a2a26', disc(206, 88, 4.5), false);
      cut(g, '#8a5c38', box(126, 190, 8, 50));
      cut(g, '#8a5c38', box(150, 190, 8, 50));
    },
  },
  oni: {
    name: 'oni',
    paper: false,
    draw(g) {
      cut(g, '#b9433a', box(84, 204, 34, 46));
      cut(g, '#b9433a', box(138, 204, 34, 46));
      cut(g, '#d9534a', disc(128, 156, 70, 58));
      cut(g, '#f2b632', poly(74, 180, 182, 180, 176, 216, 80, 216));
      for (const [x, y] of [[96, 192], [128, 200], [158, 190]]) cut(g, '#3a2a26', disc(x, y, 6), false);
      cut(g, '#d9534a', disc(40, 160, 22));
      cut(g, '#d9534a', disc(216, 160, 22));
      cut(g, '#e2685f', disc(128, 80, 54, 50));
      cut(g, '#f6f1e6', poly(92, 46, 84, 6, 112, 36));
      cut(g, '#f6f1e6', poly(164, 46, 172, 6, 144, 36));
      cut(g, '#2e2a2c', poly(86, 40, 128, 54, 170, 40, 128, 30));
      cut(g, '#f7d154', disc(108, 76, 10), false);
      cut(g, '#f7d154', disc(148, 76, 10), false);
      cut(g, '#3a2a26', disc(108, 76, 4.5), false);
      cut(g, '#3a2a26', disc(148, 76, 4.5), false);
      cut(g, '#ffffff', poly(106, 108, 112, 92, 118, 108), false);
      cut(g, '#ffffff', poly(138, 108, 144, 92, 150, 108), false);
    },
  },
  boat: {
    name: 'boat',
    paper: false,
    draw(g) {
      cut(g, '#8a5c38', box(122, 30, 10, 150));
      cut(g, '#f6f1e6', poly(134, 36, 220, 150, 134, 150));
      cut(g, '#f7a6a0', disc(162, 116, 14), false);
      cut(g, '#b9762f', poly(24, 170, 232, 170, 196, 230, 60, 230));
      lines(g, '#8a5c38', 3, [[40, 190, 216, 190]]);
    },
  },
  treasure: {
    name: 'treasure',
    paper: false,
    draw(g) {
      for (const [x, y] of [[90, 110], [128, 96], [166, 110], [108, 126], [150, 126]]) cut(g, '#f2b632', disc(x, y, 22));
      cut(g, '#d9534a', poly(128, 70, 142, 92, 128, 112, 114, 92));
      cut(g, '#8a5c38', box(44, 130, 168, 104));
      cut(g, '#f2b632', box(44, 160, 168, 12), false);
      cut(g, '#f2b632', box(116, 150, 24, 34), false);
      cut(g, '#6b4630', (c) => {
        c.moveTo(44, 130);
        c.quadraticCurveTo(30, 60, 80, 56);
        c.lineTo(84, 76);
        c.quadraticCurveTo(56, 80, 62, 130);
        c.closePath();
      });
    },
  },
  // ---- Anansi ----
  spider: {
    name: 'Anansi the spider',
    paper: false,
    draw(g) {
      g.strokeStyle = '#3a2e2a';
      g.lineWidth = 9;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      for (const sdx of [-1, 1])
        for (const [y0, kx, ky, ex, ey] of [[120, 70, 50, 104, 86], [136, 86, 100, 116, 150], [152, 84, 170, 112, 214], [164, 60, 210, 80, 246]]) {
          g.beginPath();
          g.moveTo(128 + sdx * 30, y0);
          g.lineTo(128 + sdx * kx, ky);
          g.lineTo(128 + sdx * ex, ey);
          g.stroke();
        }
      cut(g, '#5a4632', disc(128, 164, 50, 56));
      cut(g, '#f2b632', poly(128, 130, 150, 164, 128, 198, 106, 164), false);
      cut(g, '#6b4630', disc(128, 94, 34));
      cut(g, '#ffffff', disc(114, 90, 9), false);
      cut(g, '#ffffff', disc(142, 90, 9), false);
      cut(g, '#3a2a26', disc(114, 90, 4), false);
      cut(g, '#3a2a26', disc(142, 90, 4), false);
    },
  },
  claypot: {
    name: 'pot of wisdom',
    paper: false,
    draw(g) {
      cut(g, '#b9762f', (c) => {
        c.moveTo(92, 60);
        c.lineTo(164, 60);
        c.quadraticCurveTo(160, 86, 200, 120);
        c.quadraticCurveTo(246, 240, 128, 244);
        c.quadraticCurveTo(10, 240, 56, 120);
        c.quadraticCurveTo(96, 86, 92, 60);
        c.closePath();
      });
      cut(g, '#8a5c38', box(84, 46, 88, 18));
      lines(g, '#f1e2c2', 4, [[70, 150, 96, 130], [96, 130, 122, 150], [122, 150, 148, 130], [148, 130, 174, 150], [174, 150, 190, 138]]);
      lines(g, '#3a2e2a', 3, [[64, 176, 192, 176]]);
    },
  },
  web: {
    name: 'web',
    paper: false,
    draw(g) {
      cut(g, 'rgba(255,255,255,0.001)', disc(128, 128, 126), false);
      g.strokeStyle = '#ffffff';
      g.lineWidth = 4;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.beginPath();
        g.moveTo(128, 128);
        g.lineTo(128 + Math.cos(a) * 122, 128 + Math.sin(a) * 122);
        g.stroke();
      }
      for (const r of [34, 66, 98]) {
        g.beginPath();
        for (let i = 0; i <= 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const x = 128 + Math.cos(a) * r;
          const y = 128 + Math.sin(a) * r;
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
        g.stroke();
      }
    },
  },
  palm: {
    name: 'tall tree',
    paper: false,
    draw(g) {
      cut(g, '#8a5c38', poly(116, 256, 122, 70, 136, 70, 142, 256));
      lines(g, '#6b4630', 3, [[118, 220, 140, 214], [119, 180, 139, 174], [120, 140, 138, 134], [121, 100, 137, 94]]);
      for (const [a, len] of [[-2.7, 110], [-2.1, 100], [-1.57, 70], [-1.0, 100], [-0.44, 110]]) cut(g, '#3f7d4a', (c) => c.ellipse(128 + (Math.cos(a) * len) / 2, 66 + (Math.sin(a) * len) / 2 + 14, len / 2, 16, a, 0, 7));
      cut(g, '#58994f', disc(128, 66, 22));
    },
  },
  // ---- Stone Soup ----
  monk: {
    name: 'monk',
    paper: false,
    draw(g) {
      cut(g, '#c9762f', poly(128, 84, 196, 250, 60, 250));
      cut(g, '#e2933a', poly(128, 84, 168, 250, 110, 250));
      cut(g, '#e8b98f', disc(128, 60, 36));
      cut(g, '#3a2a26', disc(114, 62, 4.5), false);
      cut(g, '#3a2a26', disc(142, 62, 4.5), false);
      lines(g, '#3a2a26', 3, [[116, 78, 128, 82], [128, 82, 140, 78]]);
      cut(g, '#8a5c38', box(196, 60, 8, 190));
    },
  },
  stones: {
    name: 'three stones',
    paper: false,
    draw(g) {
      cut(g, '#8f94a3', disc(86, 176, 52, 40));
      cut(g, '#b8bcc8', disc(170, 186, 46, 34));
      cut(g, '#a2a8b5', disc(128, 122, 44, 34));
      cut(g, '#d6d9e0', (c) => c.ellipse(116, 110, 16, 8, -0.3, 0, 7), false);
    },
  },
  carrot: {
    name: 'carrot',
    paper: false,
    draw(g) {
      cut(g, '#4f8f4a', poly(128, 70, 96, 10, 120, 50, 128, 4, 136, 50, 160, 10));
      cut(g, '#ee8a35', poly(96, 66, 160, 66, 128, 250));
      lines(g, '#c9682a', 3, [[108, 100, 132, 100], [122, 140, 142, 140], [118, 180, 134, 180]]);
    },
  },
  cabbage: {
    name: 'cabbage',
    paper: false,
    draw(g) {
      cut(g, '#58994f', disc(128, 140, 96, 90));
      cut(g, '#7db85e', disc(100, 130, 62, 70));
      cut(g, '#7db85e', disc(160, 136, 60, 68));
      cut(g, '#a5d184', disc(128, 150, 50, 56));
      lines(g, '#58994f', 3, [[128, 100, 128, 200], [128, 150, 100, 120], [128, 160, 158, 130]]);
    },
  },
  lantern: {
    name: 'lantern',
    paper: false,
    draw(g) {
      lines(g, '#3a2e2a', 4, [[128, 0, 128, 40]]);
      cut(g, '#8a5c38', box(100, 36, 56, 14));
      cut(g, '#d9342b', (c) => c.ellipse(128, 124, 70, 78, 0, 0, 7));
      cut(g, '#f2a03a', (c) => c.ellipse(128, 124, 34, 74, 0, 0, 7), false);
      lines(g, '#b9433a', 3, [[80, 70, 80, 178], [176, 70, 176, 178]]);
      cut(g, '#8a5c38', box(100, 198, 56, 14));
      cut(g, '#f2b632', poly(118, 212, 138, 212, 134, 252, 122, 252));
    },
  },
  villager: {
    name: 'villager',
    paper: false,
    draw(g) {
      cut(g, '#3a2e2a', box(104, 200, 20, 50));
      cut(g, '#3a2e2a', box(132, 200, 20, 50));
      cut(g, '#4c8a8a', poly(128, 92, 184, 210, 72, 210));
      cut(g, '#e8b98f', disc(128, 70, 34));
      cut(g, '#2e2a2c', (c) => {
        c.moveTo(94, 72);
        c.quadraticCurveTo(128, 10, 162, 72);
        c.quadraticCurveTo(128, 44, 94, 72);
        c.closePath();
      });
      cut(g, '#2e2a2c', disc(90, 60, 12));
      cut(g, '#2e2a2c', disc(166, 60, 12));
      cut(g, '#3a2a26', disc(116, 76, 4.5), false);
      cut(g, '#3a2a26', disc(140, 76, 4.5), false);
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
  planks: {
    name: 'planks',
    paper: true,
    draw(g) {
      g.fillStyle = '#b9762f';
      g.fillRect(0, 0, SIZE, SIZE);
      lines(g, '#8a5c38', 4, Array.from({ length: 7 }, (_, i) => [0, 18 + i * 37, 256, 18 + i * 37]));
      lines(g, '#d9a45c', 2, scatter(40, 13).map(([a, b]) => [a * 256, b * 256, a * 256 + 26, b * 256]));
    },
  },
  stone: {
    name: 'stone',
    paper: true,
    draw(g) {
      g.fillStyle = '#b8bcc8';
      g.fillRect(0, 0, SIZE, SIZE);
      const segs: number[][] = [];
      for (let row = 0, y = 0; y < 256; y += 32, row++) {
        segs.push([0, y, 256, y]);
        for (let x = row % 2 ? 32 : 0; x < 256; x += 64) segs.push([x, y, x, y + 32]);
      }
      lines(g, '#8f94a3', 3, segs);
    },
  },
  cloudpaper: {
    name: 'cloud',
    paper: true,
    draw(g) {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, SIZE, SIZE);
      for (const [a, b, c] of scatter(26, 17)) {
        g.fillStyle = 'rgba(180, 205, 230, 0.35)';
        g.beginPath();
        g.ellipse(a * 256, b * 256, 30 + c * 30, 12 + c * 10, 0, 0, 7);
        g.fill();
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
    // One picture that a browser cannot draw must not take the rest down with it.
    try {
      if (g) (ART[id] ?? ART.plain).draw(g);
    } catch {
      if (g) ART.plain.draw(g);
    }
    made.set(id, c);
  }
  return c;
}
const urls = new Map<string, string>();
export function urlOf(id: string): string {
  if (!urls.has(id)) urls.set(id, canvasOf(id).toDataURL('image/png'));
  return urls.get(id)!;
}

// ---- Painted pictures ----

/**
 * Any picture or paper can be replaced by a painted one: a file in
 * `pictures/` named after it (`pig.png`, `straw.jpg`). A picture needs a
 * clear background, since it is cut out round its edge. Until its file has
 * loaded, and if there is none, the cut-paper drawing above is used.
 *
 * A spread of a story can have a painted background too: a file named
 * `page-<story>-<number>.jpg`, as wide to tall as the open book (26 to 19).
 *
 * `scripts/illustrate.mjs` makes these files.
 */
const FILES = import.meta.glob('./pictures/*.{png,jpg,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const fileOf = (name: string): string | undefined => FILES[`./pictures/${name}.png`] ?? FILES[`./pictures/${name}.webp`] ?? FILES[`./pictures/${name}.jpg`];
const watchers: ((id: string) => void)[] = [];
/** Loads every painted picture there is, and tells `changed` as each one replaces its drawing. */
export function loadPainted(changed: (id: string) => void): void {
  watchers.push(changed);
  for (const id of Object.keys(ART)) {
    const url = fileOf(id);
    if (!url) continue;
    const img = new Image();
    img.onload = () => {
      const c = canvasOf(id);
      c.width = c.height = 512;
      const g = c.getContext('2d');
      if (!g) return;
      g.clearRect(0, 0, 512, 512);
      if (ART[id].paper) g.drawImage(img, 0, 0, 512, 512);
      else {
        // Whole, and as large as will fit, standing on the bottom edge.
        const k = Math.min(512 / img.width, 512 / img.height);
        g.drawImage(img, (512 - img.width * k) / 2, 512 - img.height * k, img.width * k, img.height * k);
      }
      urls.delete(id);
      for (const w of watchers) w(id);
    };
    img.src = url;
  }
}
/** The painted background of a story's spread, if it has one. */
export const pageArt = (story: string, spread: number): string | undefined => fileOf(`page-${story}-${spread + 1}`);

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
