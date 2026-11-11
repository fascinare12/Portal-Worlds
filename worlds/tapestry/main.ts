import { ACTS, PANELS } from './acts';
import type { Panel, Question } from './acts';
import { BEASTS, BEAST_AT, BIRD_SAYS, GAGS, LION_SAYS, ODD, POKES, SPARE_GAGS, WYRM_SAYS } from './extras';
import type { Poke } from './extras';
import runesUrl from './fonts/runes.woff2';
import { GAG_ART, GROUND, SCENES, braid, chevron, creature, garnish, meander } from './scenes';
import { LINEN, Stitcher } from './stitch';
import type { Box, Mode, Pt, Stitch } from './stitch';
import linenUrl from './textures/linen.webp';

/**
 * The Tapestry: a long strip of linen, read from left to right, on which
 * history is told in panels. The player is the scribe who finishes it.
 *
 * Each panel starts as an under-drawing. At the desk below she reads what
 * happened, then answers questions. A right answer is stitched while she
 * watches, shape by shape in the order the needle would take them, and the
 * figures in it stir when it is done. A wrong answer is stitched as a small
 * picture of the mistake itself, and unpicked; the beasts of the border lean
 * in with a hint. Finished figures can be poked, and say something.
 */

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('cloth');
const g = canvas.getContext('2d')!;
const params = new URLSearchParams(window.location.search);

// ---- What is kept between visits, in this browser only ----

interface Kept {
  /** How many questions of each telling are stitched, and whether the panel is finished. */
  parts: number[];
  weighed: boolean;
  done: boolean;
  /** Questions answered right at the first attempt, and questions answered at all. */
  first: number;
  asked: number;
  /** Beasts she has chosen for this panel's border, one for each place in it. */
  border?: number[];
  /** Whether she has decoded this panel's runes. */
  decoded?: boolean;
}
const KEY = 'portal-worlds-tapestry-v1';
const blank = (p: Panel): Kept => ({ parts: p.tellings.map(() => 0), weighed: false, done: false, first: 0, asked: 0 });
let kept: Record<string, Kept> = {};
let focus = 0;
function restore(): void {
  try {
    const saved = JSON.parse((!params.has('fresh') && localStorage.getItem(KEY)) || 'null');
    if (saved) {
      kept = saved.kept ?? {};
      const at = PANELS.findIndex((p) => p.id === saved.focusId);
      // A cloth begun when 1066 was the only act remembers its place by number within that act.
      const year = ACTS.find((a) => a.style === 'bayeux')!.panels;
      const old = typeof saved.focus === 'number' ? year[Math.min(saved.focus, year.length - 1)].id : '';
      focus = at >= 0 ? at : Math.max(0, PANELS.findIndex((p) => p.id === old));
    }
  } catch {
    // nothing kept, or it cannot be read: begin on bare linen
  }
  // The cloth now begins with Rome. A cloth begun before that act existed is opened there once,
  // so that she starts at the beginning; after that it opens wherever she left it.
  const newRome = !kept[PANELS[0].id];
  for (const p of PANELS) if (!kept[p.id] || kept[p.id].parts.length !== p.tellings.length) kept[p.id] = blank(p);
  if (newRome) focus = 0;
  // For looking at the finished cloth while developing: ?all stitches everything, ?at=4 opens on that panel.
  if (params.has('all')) for (const p of PANELS) kept[p.id] = { parts: p.tellings.map((t) => t.questions.length), weighed: true, done: true, first: 0, asked: 0 };
  if (params.has('at')) focus = Math.min(PANELS.length - 1, Number(params.get('at')) || 0);
}
function keep(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ kept, focusId: PANELS[focus].id }));
  } catch {
    // not allowed, or no room: the cloth is simply not remembered
  }
}
restore();
/** A panel can be worked on once the one before it is finished. The first panel of every act is open from the start. */
const unlocked = (i: number) => i === 0 || PANELS[i - 1].act !== PANELS[i].act || kept[PANELS[i - 1].id].done;
const finished = () => PANELS.filter((p) => kept[p.id].done).length;
/** Which beasts have joined the collection. */
const owned = () => BEAST_AT.map((n) => finished() >= n);

// ---- The cloth: measurements, and each panel drawn once and kept ----

let W = 0;
let H = 0;
let stripH = 0;
let band = 0; // the height of each border
let scale = 1; // from a scene's own units to the screen
let panelW = 0;
let dpr = 1;
const PW = 1000;
const PH = 520;
const BEAST_PLACES = 5;

interface Drawn {
  sketch: HTMLCanvasElement;
  full: HTMLCanvasElement;
  /** Everything the needle did to make `full`, in order. */
  stitches: Stitch[];
}
const drawn = new Map<number, Drawn>();
const beastsOf = (index: number): number[] => {
  const p = PANELS[index];
  const style = ACTS[p.act].style;
  const kinds = style === 'norman' ? [12, 13, 14, 15, 3] : style === 'roman' ? [8, 9, 10, 11, 4] : style === 'norse' ? [5, 6, 7, 2, 4] : [0, 1, 2, 3, 4];
  return Array.from({ length: BEAST_PLACES }, (_, i) => kept[p.id].border?.[i] ?? kinds[(index * 3 + i * 2) % kinds.length]);
};

/** Draws one whole panel, borders and all. If `record` is given, every stitch is noted in it. */
function drawPanel(index: number, mode: Mode, record?: Stitch[]): HTMLCanvasElement {
  const p = PANELS[index];
  const c = document.createElement('canvas');
  c.width = Math.ceil(panelW * dpr);
  c.height = Math.ceil(stripH * dpr);
  const cg = c.getContext('2d')!;
  cg.scale(dpr, dpr);
  const K = new Stitcher(cg, mode);
  K.record = record ?? null;
  K.reseed(index + 1);
  const top = band / scale; // the borders, measured in scene units
  cg.save();
  cg.scale(scale, scale);
  // Each act borrows its borders and beasts from the people it is about.
  const style = ACTS[p.act].style;
  const norse = style === 'norse';
  const roman = style === 'roman';
  const norman = style === 'norman';
  // The top border: the caption, between two ruled lines.
  if (roman) meander(K, 0, PW, top - 8, 4);
  else if (norman) chevron(K, 0, PW, top - 9, 4);
  else if (norse) braid(K, 0, PW, top - 7, 3.4);
  else K.line([[0, top - 6], [PW, top - 6]], 'terracotta', 2.6, false);
  K.line([[0, 7], [PW, 7]], 'navy', 2.2, false);
  if (p.script === 'arabic') K.words(p.caption, PW / 2, top * 0.5, Math.min(30, top * 0.5), 'center', PW - 60, 'serif', true);
  else K.words(p.caption, PW / 2, top * 0.52, Math.min(27, top * 0.42), 'center', PW - 60);
  // The scene itself, and over a panel told twice, who is speaking in each half.
  cg.save();
  cg.translate(0, top);
  const list = SCENES[p.id];
  const part = PW / list.length;
  list.forEach((scene, i) => {
    K.reseed(index * 13 + i + 5);
    garnish(K, i * part, part);
    K.reseed(index * 7 + i + 3);
    scene(K, i * part, part);
    const t = p.tellings[i];
    // A real inscription is stitched in its own runes; otherwise a banner in Latin says who is speaking.
    if (t.runes) K.words(t.runes.text, (i + 0.5) * part, 26, 24, 'center', part - 30, 'Runes, serif');
    else if (t.banner) K.words(t.banner, (i + 0.5) * part, 26, 19, 'center', part - 40);
    if (i) K.line([[i * part, 6], [i * part, GROUND + 30]], 'rust', 2, false);
  });
  cg.restore();
  // The bottom border: beasts, with slanting bars or knots between them.
  cg.save();
  cg.translate(0, top + PH);
  if (roman) meander(K, 0, PW, 8, 4);
  else if (norman) chevron(K, 0, PW, 6, 4);
  else if (norse) braid(K, 0, PW, 7, 3.4);
  else K.line([[0, 6], [PW, 6]], 'terracotta', 2.6, false);
  K.line([[0, top - 7], [PW, top - 7]], 'navy', 2.2, false);
  const kinds = beastsOf(index);
  for (let i = 0; i < BEAST_PLACES; i++) {
    const cx = ((i + 0.5) / BEAST_PLACES) * PW;
    K.reseed(index * 31 + i);
    creature(K, kinds[i], cx, top * 0.52, top * 0.62);
    const sx = cx + PW / BEAST_PLACES / 2;
    if (roman) {
      // Between the beasts, a little column.
      K.shape([[sx - 5, top - 12], [sx - 4, 16], [sx + 4, 16], [sx + 5, top - 12]], 'buff', 'dark', false);
      K.line([[sx - 9, 15], [sx + 9, 15]], 'ochre', 3, false);
    } else if (norman) {
      // Between the beasts, a round-headed arch on two short pillars.
      const arch: Pt[] = [[sx - 9, top - 12]];
      for (let k = 0; k <= 8; k++) arch.push([sx - 9 + (18 * k) / 8, 26 - Math.sin((k / 8) * Math.PI) * 11]);
      arch.push([sx + 9, top - 12]);
      K.line(arch, i % 2 ? 'teal' : 'ochre', 3, false);
    } else if (norse) {
      K.oval(sx - 6, top * 0.52, 9, top * 0.26, null, i % 2 ? 'teal' : 'ochre', 0.5);
      K.oval(sx + 6, top * 0.52, 9, top * 0.26, null, i % 2 ? 'ochre' : 'teal', -0.5);
    } else K.line([[sx - 14, top - 10], [sx + 14, 9]], i % 2 ? 'teal' : 'ochre', 3, false);
  }
  cg.restore();
  cg.restore();
  return c;
}
function panelArt(index: number): Drawn {
  let d = drawn.get(index);
  if (!d) {
    // Only a few panels are kept drawn at once; the rest are redrawn when she comes back to them.
    for (const k of [...drawn.keys()]) if (Math.abs(k - index) > 2 && k !== sewing?.panel) drawn.delete(k);
    const stitches: Stitch[] = [];
    d = { sketch: drawPanel(index, 'sketch'), full: drawPanel(index, 'full', stitches), stitches };
    drawn.set(index, d);
  }
  return d;
}

// The linen itself: a photograph of real cloth, laid under everything and moving with it.
let cloth: CanvasPattern | null = null;
const linen = new Image();
linen.onload = () => (cloth = g.createPattern(linen, 'repeat'));
linen.src = linenUrl;
// The runes, which need a typeface of their own. Anything already drawn is drawn again once it arrives.
new FontFace('Runes', `url(${runesUrl})`)
  .load()
  .then((face) => {
    (document.fonts as unknown as { add(f: FontFace): void }).add(face);
    drawn.clear();
  })
  .catch(() => undefined);

let scroll = 0;
const home = (i: number) => i * panelW - (W - panelW) / 2;
function resize(): void {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  // The cloth takes a little over half the height; the desk has the rest.
  stripH = Math.round(Math.min(H * 0.56, W * 0.7));
  band = stripH * 0.13;
  scale = (stripH - band * 2) / PH;
  panelW = PW * scale;
  canvas.width = Math.ceil(W * dpr);
  canvas.height = Math.ceil(stripH * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${stripH}px`;
  $('desk').style.top = `${stripH}px`;
  drawn.clear();
  sewing = null;
  scroll = home(focus);
}

// ---- Stitching that can be watched ----

/** A stretch of a panel being stitched right now: which stitches, and how far through them the needle is. */
interface Sewing {
  panel: number;
  telling: number;
  /** How much of this telling was stitched before, and how much will be after. */
  from: number;
  to: number;
  /** Which of the panel's stitches fall in this stretch, in order. */
  list: number[];
  /** How many of those are finished and already on `live`. */
  done: number;
  /** The stretch so far, kept as a picture so finished stitches are not redone every frame. */
  live: HTMLCanvasElement;
  start: number;
  length: number;
}
let sewing: Sewing | null = null;
const fraction = (i: number, j: number) => kept[PANELS[i].id].parts[j] / PANELS[i].tellings[j].questions.length;
/** How much of a telling counts as stitched for drawing: what has been earned, less any stretch still under the needle. */
const stitched = (i: number, j: number) => (sewing && sewing.panel === i && sewing.telling === j ? sewing.from : fraction(i, j));

function sew(panel: number, telling: number, from: number, to: number): void {
  const art = panelArt(panel);
  const part = (panelW * dpr) / PANELS[panel].tellings.length;
  const x0 = telling * part + from * part;
  const x1 = telling * part + to * part;
  const list: number[] = [];
  art.stitches.forEach((s, k) => {
    const mid = (s.box[0] + s.box[2]) / 2;
    if (mid >= x0 && mid < x1) list.push(k);
  });
  const live = document.createElement('canvas');
  live.width = art.full.width;
  live.height = art.full.height;
  sewing = { panel, telling, from, to, list, done: 0, live, start: performance.now(), length: Math.max(1800, Math.min(5200, list.length * 34)) };
}
/** Puts one stitch, or the first part of it, onto a canvas by copying that much of the finished panel. */
function lay(ctx: CanvasRenderingContext2D, art: Drawn, s: Stitch, howFar: number, dx: number): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (howFar < 1) {
    // A shape is filled from the top down, as rows of thread are laid.
    ctx.beginPath();
    ctx.rect(s.box[0] + dx - 2, s.box[1] - 2, s.box[2] - s.box[0] + 4, (s.box[3] - s.box[1] + 4) * howFar);
    ctx.clip();
  }
  ctx.setTransform(s.matrix.a, s.matrix.b, s.matrix.c, s.matrix.d, s.matrix.e + dx, s.matrix.f);
  ctx.clip(s.clip);
  ctx.setTransform(1, 0, 0, 1, dx, 0);
  ctx.drawImage(art.full, 0, 0);
  ctx.restore();
}

// ---- Things that move: figures stirring when finished or poked, and what they say ----

interface Jig {
  panel: number;
  /** The piece of the panel that moves, in pixels of the panel's own picture. */
  box: Box;
  kind: 'man' | 'horse' | 'thing';
  start: number;
}
let jigs: Jig[] = [];
let speech: { panel: number; x: number; y: number; text: string; until: number } | null = null;
/** Where a pokeable thing is within its panel, in the panel's own pixels. */
function pokeBox(index: number, p: Poke): Box {
  const top = band / scale;
  const part = PW / PANELS[index].tellings.length;
  const kind = p.kind ?? 'man';
  const w = kind === 'man' ? p.h * 0.56 : kind === 'horse' ? p.h * 1.8 : (p.w ?? p.h);
  const h = kind === 'man' ? p.h * 1.34 : kind === 'horse' ? p.h * 1.9 : p.h;
  const x = (p.t ?? 0) * part + p.x;
  const foot = top + GROUND - (p.y ?? 0);
  const k = scale * dpr;
  return [(x - w / 2) * k, (foot - h) * k, (x + w / 2) * k, (foot + 6) * k];
}
function stir(index: number, p: Poke, delay = 0): void {
  jigs.push({ panel: index, box: pokeBox(index, p), kind: p.kind ?? 'man', start: performance.now() + delay });
}
/** Whether the needle has reached this far across. */
function isStitched(index: number, p: Poke): boolean {
  const part = PW / PANELS[index].tellings.length;
  return p.x / part < fraction(index, p.t ?? 0) - 0.02 || kept[PANELS[index].id].done;
}

/** A wrong answer, shown as a small picture of itself before it is unpicked. */
let botch: { panel: number; telling: number; at: number; art: HTMLCanvasElement } | null = null;
const gagArt = new Map<string, HTMLCanvasElement>();
let spare = 0;
function gagFor(answer: string): HTMLCanvasElement {
  const name = GAGS.find(([words]) => words.test(answer))?.[1] ?? SPARE_GAGS[spare++ % SPARE_GAGS.length];
  let c = gagArt.get(name);
  if (!c) {
    c = document.createElement('canvas');
    c.width = 320 * 2;
    c.height = 300 * 2;
    const cg = c.getContext('2d')!;
    cg.scale(2, 2);
    const K = new Stitcher(cg, 'full');
    K.reseed(name.length);
    GAG_ART[name](K);
    gagArt.set(name, c);
  }
  return c;
}

function paint(now: number): void {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  // The linen.
  if (cloth) {
    cloth.setTransform(new DOMMatrix().translate(-scroll, 0).scale(0.42));
    g.fillStyle = cloth;
  } else g.fillStyle = LINEN;
  g.fillRect(0, 0, W, stripH);

  const first = Math.max(0, Math.floor(scroll / panelW));
  const last = Math.min(PANELS.length - 1, Math.floor((scroll + W) / panelW));
  for (let i = first; i <= last; i++) {
    const x = i * panelW - scroll;
    if (!unlocked(i)) {
      // Linen not yet reached: only the ruled lines of the borders, waiting.
      g.strokeStyle = 'rgba(110, 92, 70, 0.4)';
      g.setLineDash([5, 6]);
      g.lineWidth = 1;
      for (const y of [band - 6 * scale, stripH - band + 6 * scale]) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + panelW, y);
        g.stroke();
      }
      g.setLineDash([]);
      continue;
    }
    const art = panelArt(i);
    const tellings = PANELS[i].tellings.length;
    const part = panelW / tellings;
    const moving = jigs.filter((j) => j.panel === i && now >= j.start);
    for (let j = 0; j < tellings; j++) {
      const upTo = stitched(i, j) * part;
      // The under-drawing shows only where the needle has not been.
      if (upTo < part - 0.5) {
        g.save();
        g.beginPath();
        g.rect(x + j * part + upTo, 0, part - upTo, stripH);
        g.clip();
        g.drawImage(art.sketch, x, 0, panelW, stripH);
        g.restore();
      }
      if (upTo > 0.5) {
        g.save();
        g.beginPath();
        g.rect(x + j * part, 0, upTo, stripH);
        // Anything that is stirring is left out here and drawn again below, moved.
        for (const m of moving) g.rect(x + m.box[0] / dpr, m.box[1] / dpr, (m.box[2] - m.box[0]) / dpr, (m.box[3] - m.box[1]) / dpr);
        g.clip('evenodd');
        g.drawImage(art.full, x, 0, panelW, stripH);
        g.restore();
      }
    }
    for (const m of moving) {
      const t = (now - m.start) / (m.kind === 'horse' ? 900 : 620);
      if (t >= 1) continue;
      const [bx, by, bx2, by2] = m.box.map((v) => v / dpr);
      const swing = Math.sin(t * Math.PI);
      g.save();
      if (m.kind === 'horse') {
        // A horse rears: up on its hind legs and down again.
        g.translate(x + bx + (bx2 - bx) * 0.25, by2);
        g.rotate(-0.24 * swing);
        g.translate(-(x + bx + (bx2 - bx) * 0.25), -by2);
      } else if (m.kind === 'man') {
        // A person hops, and sways as they land.
        g.translate(x + (bx + bx2) / 2, by2 - swing * 9 * scale * 2);
        g.rotate(Math.sin(t * Math.PI * 2) * 0.07);
        g.translate(-(x + (bx + bx2) / 2), -by2);
      } else {
        // A thing shivers and swells.
        g.translate(x + (bx + bx2) / 2, (by + by2) / 2);
        g.rotate(Math.sin(t * Math.PI * 4) * 0.035 * (1 - t));
        g.scale(1 + swing * 0.05, 1 + swing * 0.05);
        g.translate(-(x + (bx + bx2) / 2), -(by + by2) / 2);
      }
      g.drawImage(art.full, m.box[0], m.box[1], m.box[2] - m.box[0], m.box[3] - m.box[1], x + bx, by, bx2 - bx, by2 - by);
      g.restore();
    }

    // The stretch under the needle: each stitch in the order it was made.
    if (sewing && sewing.panel === i) {
      const s = sewing;
      const t = Math.min(1, (now - s.start) / s.length);
      const at = t * s.list.length;
      const lg = s.live.getContext('2d')!;
      while (s.done < Math.floor(at)) lay(lg, art, art.stitches[s.list[s.done++]], 1, 0);
      g.drawImage(s.live, x, 0, panelW, stripH);
      const current = art.stitches[s.list[Math.min(s.list.length - 1, Math.floor(at))]];
      if (t < 1 && current) {
        g.save();
        lay(g, art, current, at % 1, x * dpr);
        g.restore();
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        needle(x + (current.box[0] + (current.box[2] - current.box[0]) * (0.5 + 0.5 * Math.sin(now / 45))) / dpr, (current.box[1] + (current.box[3] - current.box[1]) * (at % 1)) / dpr);
      } else if (t >= 1) {
        // Done: this stretch joins the rest of the cloth, and whoever is in it stirs.
        const stretch = [s.from, s.to];
        sewing = null;
        (POKES[PANELS[i].id] ?? []).filter((p) => (p.t ?? 0) === s.telling && p.x / (PW / tellings) >= stretch[0] && p.x / (PW / tellings) < stretch[1]).forEach((p, k) => stir(i, p, k * 110));
      }
    }

    // A wrong answer: a patch with a picture of the mistake, which shivers, then is pulled off.
    if (botch && botch.panel === i) {
      const age = (now - botch.at) / 1000;
      if (age > 2.6) botch = null;
      else {
        const size = Math.min(stripH * 0.62, part * 0.9);
        const cx = x + botch.telling * part + Math.min(part - size / 2, stitched(i, botch.telling) * part + size / 2 + 8);
        const cy = stripH / 2 + (age > 2 ? (age - 2) * 380 : 0);
        g.save();
        g.translate(cx, cy);
        g.rotate(Math.sin(now / 60) * 0.03 + (age > 2 ? (age - 2) * 0.9 : 0));
        g.scale(Math.min(1, age / 0.25), Math.min(1, age / 0.25));
        g.globalAlpha = age > 2 ? Math.max(0, 1 - (age - 2) / 0.6) : 1;
        g.fillStyle = cloth ?? LINEN;
        g.shadowColor = 'rgba(40, 26, 12, 0.45)';
        g.shadowBlur = 12;
        g.shadowOffsetY = 5;
        g.fillRect(-size / 2, -size / 2, size, size);
        g.shadowColor = 'transparent';
        g.strokeStyle = '#b0502c';
        g.lineWidth = 2.4;
        g.setLineDash([7, 5]);
        g.strokeRect(-size / 2 + 6, -size / 2 + 6, size - 12, size - 12);
        g.setLineDash([]);
        g.drawImage(botch.art, -size / 2 + 10, -size / 2 + 10 + (size - 20) * 0.03, size - 20, (size - 20) * (300 / 320));
        g.restore();
      }
    }

    // What somebody has just said.
    if (speech && speech.panel === i) {
      if (now > speech.until) speech = null;
      else say(x + speech.x, speech.y, speech.text, Math.min(1, (speech.until - now) / 300));
    }
  }
  jigs = jigs.filter((j) => now - j.start < 1000);
}
/** The needle, trailing its thread. */
function needle(x: number, y: number): void {
  g.strokeStyle = '#b0502c';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x - 20, y + 22, x - 5, y + 46);
  g.stroke();
  g.strokeStyle = '#f4f1ea';
  g.lineWidth = 3.4;
  g.beginPath();
  g.moveTo(x - 3, y + 4);
  g.lineTo(x + 12, y - 19);
  g.stroke();
  g.strokeStyle = '#3b302b';
  g.lineWidth = 1;
  g.stroke();
}
/** A speech scroll over a figure's head. */
function say(x: number, y: number, text: string, alpha: number): void {
  g.save();
  g.globalAlpha = alpha;
  g.font = 'italic 15px Georgia, serif';
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (g.measureText(line + word).width > 190 && line) {
      lines.push(line.trim());
      line = '';
    }
    line += word + ' ';
  }
  lines.push(line.trim());
  const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 22;
  const h = lines.length * 19 + 14;
  const left = Math.max(6, Math.min(W - w - 6, x - w / 2));
  const top = Math.max(4, y - h - 12);
  g.fillStyle = '#f7f0dc';
  g.strokeStyle = '#3b302b';
  g.lineWidth = 2;
  g.shadowColor = 'rgba(40, 26, 12, 0.35)';
  g.shadowBlur = 8;
  g.shadowOffsetY = 3;
  g.beginPath();
  g.roundRect(left, top, w, h, 8);
  g.fill();
  g.shadowColor = 'transparent';
  g.stroke();
  g.beginPath();
  g.moveTo(x - 7, top + h - 1);
  g.lineTo(x, top + h + 10);
  g.lineTo(x + 7, top + h - 1);
  g.fill();
  g.stroke();
  g.fillStyle = '#3b302b';
  g.textBaseline = 'top';
  lines.forEach((l, k) => g.fillText(l, left + 11, top + 8 + k * 19));
  g.restore();
}

window.addEventListener('resize', resize);
resize();

// ---- Sound: a plucked note or two for a stitch well made, a dull knock for one that must come out ----

let audio: AudioContext | null = null;
let soundOn = true;
function tone(freq: number, when: number, length: number, loud: number, type: OscillatorType = 'triangle'): void {
  if (!soundOn) return;
  try {
    audio ??= new AudioContext();
    const start = audio.currentTime + when;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(loud, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + length + 0.05);
  } catch {
    // no sound on this device
  }
}
// The notes are from the Dorian mode on D, which much plainchant of the time is in.
const right = () => [293.66, 440, 392].forEach((f, i) => tone(f, i * 0.13, 1.1, 0.1));
const fanfare = () => [293.66, 349.23, 440, 587.33].forEach((f, i) => tone(f, i * 0.16, 1.6, 0.1));
const wrongSound = () => [196, 156, 110].forEach((f, i) => tone(f, i * 0.12, 0.3, 0.12, 'sawtooth')); // a sad trombone, more or less
const squeak = () => tone(620 + Math.random() * 260, 0, 0.12, 0.07, 'square');
$('sound').onclick = () => {
  soundOn = !soundOn;
  $('sound').style.opacity = soundOn ? '1' : '0.4';
};

// ---- The beasts of the border, as little pictures for the desk ----

const portraits = BEASTS.map((_, kind) => {
  const c = document.createElement('canvas');
  c.width = 184;
  c.height = 156;
  const cg = c.getContext('2d')!;
  cg.scale(2, 2);
  const K = new Stitcher(cg, 'full');
  K.reseed(kind + 3);
  creature(K, kind, 44, 44, 62);
  return c.toDataURL();
});
$('beasts').style.backgroundImage = `url(${portraits[1]})`;

// ---- The desk ----

type View = 'locked' | 'choose' | 'read' | 'ask' | 'weigh' | 'done' | 'beasts' | 'runes';
let view: View = 'read';
let telling = 0;
let hint = '';
let hintBy = 0;
let struck: string[] = []; // wrong answers already tried for the question on the desk
let firstGo = true;
let wrongs = 0;
/** She is reading an account again, not starting it. */
let reading = false;
/** How far she has got with the runes on the desk. */
let rune = 0;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
/** The same question always lays its answers out in the same order, but not with the right one first. */
function shuffled(q: Question): string[] {
  let n = 0;
  for (const ch of q.ask) n = (n * 31 + ch.charCodeAt(0)) % 9973;
  const order = [[0, 1, 2], [1, 0, 2], [2, 1, 0], [1, 2, 0], [2, 0, 1], [0, 2, 1]][n % 6];
  return order.map((i) => q.answers[i]);
}
/** What a caption is, in a sentence or two: its language, its meaning, and where it is from. */
function captionNote(p: Panel): string {
  return `<b>${esc(p.language ?? 'Latin')}${p.quoted ? '' : ', the scribe\'s own'}</b>${p.reads ? `<i>${esc(p.reads)}</i>` : ''}“${esc(p.meaning)}”${p.quoted ? `<i>${esc(p.quoted)}</i>` : '<i>Written for this cloth: there is no such caption on any real one.</i>'}`;
}
function settle(): void {
  const p = PANELS[focus];
  const k = kept[p.id];
  hint = '';
  struck = [];
  firstGo = true;
  if (!unlocked(focus)) view = 'locked';
  else if (k.done) view = 'done';
  else if (p.tellings.length > 1) {
    const left = p.tellings.findIndex((t, j) => k.parts[j] < t.questions.length);
    view = left < 0 ? 'weigh' : 'choose';
  } else {
    telling = 0;
    view = k.parts[0] === 0 ? 'read' : 'ask';
  }
  render();
}
function render(): void {
  const p = PANELS[focus];
  const k = kept[p.id];
  const act = ACTS[p.act];
  $('where').innerHTML = `<i>${act.numeral} · ${esc(act.title)}</i><b>${esc(p.title)}</b><span>${esc(p.date)}</span>`;
  $<HTMLButtonElement>('back').disabled = focus === 0;
  $<HTMLButtonElement>('next').disabled = focus === PANELS.length - 1;
  const t = p.tellings[telling];
  // The acts of the cloth, to jump between.
  const chips = `<div class="acts">${ACTS.map((a, i) => `<button class="${i === p.act ? 'here' : ''}" data-act="${i}">${a.numeral} · ${esc(a.title)}</button>`).join('')}</div>`;
  const head = `<p class="latin"${p.script === 'arabic' ? ' dir="rtl" style="font-variant: normal; font-size: 22px"' : ''}>${esc(p.caption)}</p><p class="means">${p.language ? `${esc(p.language)}: ` : ''}${esc(p.meaning)}${p.quoted ? '' : ' <span style="opacity:0.7">(the scribe\'s own caption)</span>'}</p>`;
  // At the head of each act, once: what its pictures are modelled on.
  const opening = focus === 0 || PANELS[focus - 1].act !== p.act ? `<p class="source">${esc(act.modelled)}</p>` : '';
  // A wrong answer brings the bird, who agreed with it, and then one of the other two with a real hint.
  const hintBox = hint
    ? `<div class="hint bird"><img src="${portraits[0]}" alt=""><span><b>The Bird Who Is Always Wrong</b>${esc(BIRD_SAYS[wrongs % BIRD_SAYS.length])}</span></div>` +
      (hintBy
        ? `<div class="hint"><img src="${portraits[2]}" alt=""><span><b>Grim the wyrm</b>${esc(hint)} ${esc(WYRM_SAYS[wrongs % WYRM_SAYS.length])}</span></div>`
        : `<div class="hint"><img src="${portraits[1]}" alt=""><span><b>Leofric, a lion of quality</b>${esc(LION_SAYS[wrongs % LION_SAYS.length])} ${esc(hint)}</span></div>`)
    : '';
  const options = (q: Question) =>
    shuffled(q)
      .map((a) => `<button class="pick" data-answer="${esc(a)}" ${struck.includes(a) ? 'disabled' : ''}>${esc(a)}</button>`)
      .join('');
  const runeLine = (tt: typeof t) =>
    tt.runes
      ? `<p class="runes">${esc(tt.runes.text)}</p><p class="means">${esc(tt.runes.reads)}<br>“${esc(tt.runes.means)}”</p><p class="source">${esc(tt.runes.source)}</p><button class="go quiet" data-do="runes">${k.decoded ? 'Decode the runes again' : 'Decode a word of it yourself'}</button>`
      : '';
  let html = '';
  if (view === 'locked') {
    html = `<p>This stretch of linen is still bare. Finish the panel before it, and the under-drawing for this one will be marked out.</p><button class="go quiet" data-do="back">◀ Go back</button>`;
  } else if (view === 'choose') {
    html =
      head +
      `<p>This scene comes down to us in more than one way, from sources that do not agree. A scribe sets down each as it was given. Stitch both, then weigh them.</p>` +
      p.tellings
        .map((tt, j) => `<button class="pick ${k.parts[j] >= tt.questions.length ? 'done' : ''}" data-telling="${j}">${esc(tt.voice ?? '')}</button>`)
        .join('');
  } else if (view === 'read') {
    html =
      (t.voice ? `<p class="voice">${esc(t.voice)}</p>` : opening + head) +
      t.account.map((line) => `<p>${esc(line)}</p>`).join('') +
      `<p class="source">${esc(t.source)}</p>${runeLine(t)}<button class="go" data-do="begin">${reading ? 'Back to the cloth' : 'Take up the needle'}</button>`;
  } else if (view === 'ask') {
    const q = t.questions[k.parts[telling]];
    html =
      (t.voice ? `<p class="voice">${esc(t.voice)}</p>` : '') +
      `<div class="dots">${t.questions.map((_, i) => `<i class="${i < k.parts[telling] ? 'on' : ''}"></i>`).join('')}</div>` +
      `<p class="ask">${esc(q.ask)}</p>${options(q)}${hintBox}<button class="go quiet" data-do="reread">Read the account again</button>`;
  } else if (view === 'weigh') {
    html = `<p class="voice">Weighing the two</p><p class="ask">${esc(p.weigh!.ask)}</p>${options(p.weigh!)}${hintBox}`;
  } else if (view === 'runes') {
    // Decoding: the sixteen runes the Northmen used, and one word of the inscription to work out.
    const r = p.tellings[telling].runes!;
    const KEYS: [string, string][] = [['ᚠ', 'f'], ['ᚢ', 'u'], ['ᚦ', 'þ'], ['ᚬ', 'o'], ['ᚱ', 'r'], ['ᚴ', 'k'], ['ᚼ', 'h'], ['ᚾ', 'n'], ['ᛁ', 'i'], ['ᛅ', 'a'], ['ᛋ', 's'], ['ᛏ', 't'], ['ᛒ', 'b'], ['ᛘ', 'm'], ['ᛚ', 'l'], ['ᛦ', 'ʀ']];
    const word = [...r.word];
    html =
      `<p class="voice">Decoding the runes</p><p>The Northmen wrote with sixteen runes. Here they are, each with the sound it stood for. (þ is the "th" of "thing"; ʀ is a kind of r.)</p>` +
      `<div class="key">${KEYS.map(([sign, sound]) => `<span><i>${sign}</i>${sound}</span>`).join('')}</div>` +
      `<p>This word is cut near the end of the stone. What does it say? Choose a letter for each rune.</p>` +
      `<div class="slots">${word.map((sign, i) => `<span class="${i === rune ? 'now' : ''}"><i>${sign}</i>${i < rune ? r.answer[i] : ''}</span>`).join('')}</div>` +
      (rune < word.length
        ? `<div class="letters">${KEYS.map(([, sound]) => `<button data-letter="${sound}">${sound}</button>`).join('')}</div>`
        : `<div class="odd"><b>${esc(r.answer)}.</b> ${esc(r.wordMeans)}</div><button class="go" data-do="unrune">Back to the cloth</button>`);
  } else if (view === 'beasts') {
    const have = owned();
    html =
      `<p class="voice">The beasts of the border</p><p>Every finished panel brings the next one nearer. Once a beast is yours, tap any beast in the border under a finished panel to change it for one of yours.</p>` +
      `<div class="zoo">${BEASTS.map((b, i) => `<div class="${have[i] ? '' : 'locked'}"><img src="${portraits[i]}" alt=""><span><b>${have[i] ? esc(b.name) : '?'}</b>${have[i] ? esc(b.about) : `Joins after ${BEAST_AT[i]} finished ${BEAST_AT[i] === 1 ? 'panel' : 'panels'}.`}</span></div>`).join('')}</div>` +
      `<button class="go" data-do="unbeast">Back to the cloth</button>` +
      `<p class="voice" style="margin-top:16px">Starting again</p><p>Unpicking takes the stitches out so that the questions can be answered afresh. The beasts you have collected depend on how many panels are finished, so they go back too.</p>` +
      `<button class="go quiet" data-do="fresh-act">Unpick only ${act.numeral} · ${esc(act.title)}</button><button class="go quiet" data-do="fresh">Unpick the whole cloth</button>`;
  } else {
    const first = PANELS.reduce((n, x) => n + kept[x.id].first, 0);
    const asked = PANELS.reduce((n, x) => n + kept[x.id].asked, 0);
    const lastOfAct = focus === PANELS.length - 1 || PANELS[focus + 1].act !== p.act;
    const actDone = PANELS.filter((x) => x.act === p.act).every((x) => kept[x.id].done);
    html =
      head +
      `<p>${esc(p.mattered)}</p>` +
      (ODD[p.id] ? `<div class="odd"><b>True, and odd.</b> ${esc(ODD[p.id])}</div>` : '') +
      (lastOfAct && actDone ? `<p><b>${esc(act.latin)}</b> is stitched: ${esc(act.meaning.charAt(0).toLowerCase() + act.meaning.slice(1))}, ${esc(act.closing)}</p>` : '') +
      (focus < PANELS.length - 1
        ? `<button class="go" data-do="next">${lastOfAct ? `On to ${ACTS[p.act + 1].numeral} · ${esc(ACTS[p.act + 1].title)}` : 'On to the next panel'} ▶</button>`
        : `<p>The linen beyond this is still bare.</p>`) +
      `<p class="tally">Tap anyone in the picture to hear from them.${asked ? ` Right at the first attempt: ${first} of ${asked} questions so far.` : ''}</p>` +
      p.tellings.map((tt, j) => `<button class="go quiet" data-reread="${j}">Read ${tt.voice ? esc(tt.voice.charAt(0).toLowerCase() + tt.voice.slice(1)) : 'the account'} again</button>`).join('');
  }
  const page = $('page');
  page.innerHTML = (view === 'beasts' || view === 'runes' ? '' : chips) + html;
  page.scrollTop = 0;
}
function answer(text: string): void {
  const p = PANELS[focus];
  const k = kept[p.id];
  const q = view === 'weigh' ? p.weigh! : p.tellings[telling].questions[k.parts[telling]];
  if (text !== q.answers[0]) {
    // Stitched wrong: a picture of the mistake appears, and is pulled off again; the beasts lean in.
    struck.push(text);
    firstGo = false;
    hint = q.hint;
    wrongs++;
    hintBy = wrongs % 2;
    botch = { panel: focus, telling: view === 'ask' ? telling : 0, at: performance.now(), art: gagFor(text) };
    wrongSound();
    render();
    return;
  }
  k.asked++;
  if (firstGo) k.first++;
  hint = '';
  struck = [];
  firstGo = true;
  const before = finished();
  if (view === 'weigh') k.weighed = true;
  else {
    const from = fraction(focus, telling);
    k.parts[telling]++;
    // If the needle is still busy with the last stretch, that one is taken as done.
    sew(focus, telling, from, fraction(focus, telling));
  }
  const complete = p.tellings.every((t, j) => k.parts[j] >= t.questions.length);
  if (complete && (!p.weigh || k.weighed)) {
    k.done = true;
    fanfare();
    // A beast may have joined the collection.
    const have = owned();
    const gained = BEAST_AT.findIndex((n, i) => have[i] && before < n);
    if (gained >= 0) speech = { panel: focus, x: panelW / 2, y: stripH * 0.5, text: `${BEASTS[gained].name} has joined your border.`, until: performance.now() + 5200 };
  } else right();
  keep();
  if (view === 'ask' && k.parts[telling] < p.tellings[telling].questions.length) render();
  else settle();
}
$('page').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button');
  if (!b) return;
  const d = b.dataset;
  const p = PANELS[focus];
  if (d.answer !== undefined) answer(d.answer);
  else if (d.act !== undefined) {
    // To an act: its first unfinished panel, or its first if it is all done.
    const mine = PANELS.map((x, i) => ({ x, i })).filter(({ x }) => x.act === Number(d.act));
    go((mine.find(({ x }) => !kept[x.id].done) ?? mine[0]).i);
  } else if (d.letter !== undefined) {
    const r = p.tellings[telling].runes!;
    if (d.letter === r.answer[rune]) {
      rune++;
      squeak();
      if (rune >= [...r.word].length) {
        kept[p.id].decoded = true;
        keep();
        fanfare();
      }
      render();
    } else {
      b.classList.add('no');
      setTimeout(() => b.classList.remove('no'), 320);
      wrongSound();
    }
  } else if (d.telling !== undefined) {
    telling = Number(d.telling);
    const k = kept[p.id];
    const whole = k.parts[telling] >= p.tellings[telling].questions.length;
    reading = whole;
    view = whole || k.parts[telling] === 0 ? 'read' : 'ask';
    render();
  } else if (d.reread !== undefined) {
    telling = Number(d.reread);
    reading = true;
    view = 'read';
    render();
  } else if (d.do === 'begin') {
    if (reading) {
      reading = false;
      settle();
    } else {
      view = 'ask';
      render();
    }
  } else if (d.do === 'reread') {
    view = 'read';
    render();
  } else if (d.do === 'runes') {
    rune = 0;
    view = 'runes';
    render();
  } else if (d.do === 'unrune' || d.do === 'unbeast') {
    reading = false;
    settle();
  } else if (d.do === 'fresh' || d.do === 'fresh-act') {
    // One act, or all of them.
    const all = d.do === 'fresh';
    if (!window.confirm(all ? 'Unpick the whole cloth and start again on bare linen?' : `Unpick ${ACTS[p.act].title} and start it again?`)) return;
    for (const x of PANELS) if (all || x.act === p.act) kept[x.id] = blank(x);
    drawn.clear();
    sewing = null;
    go(PANELS.findIndex((x) => x.act === p.act));
  } else if (d.do === 'next') go(focus + 1);
  else if (d.do === 'back') go(focus - 1);
});
$('beasts').onclick = () => {
  view = view === 'beasts' ? 'done' : 'beasts';
  if (view === 'beasts') render();
  else settle();
};

// ---- Moving along the cloth, and touching it ----

function go(i: number): void {
  focus = Math.max(0, Math.min(PANELS.length - 1, i));
  reading = false;
  keep();
  settle();
}
$('back').onclick = () => go(focus - 1);
$('next').onclick = () => go(focus + 1);
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') go(focus - 1);
  if (e.key === 'ArrowRight') go(focus + 1);
});
const tip = $('tip');
/** Which panel is under a point on the screen, and where in it. */
function under(cx: number, cy: number): { i: number; x: number; y: number } | null {
  const i = Math.floor((cx + scroll) / panelW);
  if (i < 0 || i >= PANELS.length || cy > stripH) return null;
  return { i, x: cx + scroll - i * panelW, y: cy };
}
function showTip(cx: number, cy: number): void {
  const at = under(cx, cy);
  // Only over a caption, in the top border of a panel she has reached.
  if (!at || at.y > band || !unlocked(at.i)) {
    tip.style.display = 'none';
    return;
  }
  tip.innerHTML = captionNote(PANELS[at.i]);
  tip.style.display = 'block';
  tip.style.left = `${Math.max(8, Math.min(W - 356, cx - 160))}px`;
  tip.style.top = `${band + 8}px`;
}
/** A tap on the cloth: a figure to be poked, a beast to be changed, or a caption to be read. */
function touch(cx: number, cy: number): void {
  const at = under(cx, cy);
  if (!at || !unlocked(at.i)) return;
  const id = PANELS[at.i].id;
  if (at.y < band) return showTip(cx, cy);
  if (at.y > stripH - band) {
    // The border of a finished panel: change the beast in this place for the next of hers.
    if (!kept[id].done) return;
    const mine = owned().map((have, kind) => (have ? kind : -1)).filter((kind) => kind >= 0);
    if (!mine.length) return;
    const place = Math.min(BEAST_PLACES - 1, Math.floor((at.x / panelW) * BEAST_PLACES));
    const now = beastsOf(at.i);
    now[place] = mine[(mine.indexOf(now[place]) + 1) % mine.length];
    kept[id].border = now;
    drawn.delete(at.i);
    keep();
    squeak();
    return;
  }
  const px = at.x * dpr;
  const py = at.y * dpr;
  // The smallest thing under the finger is the one meant.
  const hit = (POKES[id] ?? [])
    .filter((p) => isStitched(at.i, p))
    .map((p) => ({ p, box: pokeBox(at.i, p) }))
    .filter(({ box }) => px >= box[0] && px <= box[2] && py >= box[1] && py <= box[3])
    .sort((a, b) => (a.box[2] - a.box[0]) * (a.box[3] - a.box[1]) - (b.box[2] - b.box[0]) * (b.box[3] - b.box[1]))[0];
  if (!hit) return;
  stir(at.i, hit.p);
  speech = { panel: at.i, x: (hit.box[0] + hit.box[2]) / 2 / dpr, y: hit.box[1] / dpr, text: hit.p.say, until: performance.now() + 3600 };
  squeak();
}
let dragging: { x: number; scroll: number; far: boolean } | null = null;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  dragging = { x: e.clientX, scroll, far: false };
});
canvas.addEventListener('pointermove', (e) => {
  if (dragging) {
    if (Math.abs(e.clientX - dragging.x) > 8) dragging.far = true;
    if (dragging.far) scroll = dragging.scroll - (e.clientX - dragging.x);
  } else if (e.pointerType === 'mouse') showTip(e.clientX, e.clientY);
});
canvas.addEventListener('pointerleave', () => (tip.style.display = 'none'));
const letGo = (e: PointerEvent) => {
  if (!dragging) return;
  const far = dragging.far;
  dragging = null;
  if (!far) return touch(e.clientX, e.clientY);
  // Let go, and the cloth settles on whichever panel is nearest the middle.
  const nearest = Math.round((scroll + (W - panelW) / 2) / panelW);
  if (nearest !== focus) go(nearest);
};
canvas.addEventListener('pointerup', letGo);
canvas.addEventListener('pointercancel', () => (dragging = null));
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    if (Math.abs(e.deltaX) + Math.abs(e.deltaY) > 30) go(focus + (e.deltaX + e.deltaY > 0 ? 1 : -1));
  },
  { passive: false },
);

// ---- Going home ----

const veil = $('veil');
$('home').onclick = () => {
  keep();
  veil.style.background = '#4f9a5c';
  veil.classList.remove('open');
  setTimeout(() => {
    window.location.href = '../../index.html#from-tapestry';
  }, 1700);
};
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});
requestAnimationFrame(() => veil.classList.add('open'));

settle();
function frame(now: number): void {
  if (!dragging) scroll += (home(focus) - scroll) * 0.12;
  paint(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
