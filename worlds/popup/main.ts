import * as THREE from 'three';
import './popup.css';
import { ART, canvasOf, loadPainted, pageArt, pagePaper, urlOf } from './art';
import { L, STAND_CLEAR, W, checkFold, fits, fresh, moves, heightOf, problems, quads, stands, tilt } from './fold';
import type { Kind, Piece, Spread } from './fold';
import { sheets } from './print';
import { STORIES } from './story';
import type { Story } from './story';

/**
 * The Pop-up Book: a book that is built, opened, shut, read, and printed.
 *
 * The book lies on a table. Pieces are chosen from a tray and put on the
 * open spread; the book can be shut and opened by hand at any moment to see
 * how they fold. A piece that would not work in paper is edged in red, with
 * a sentence saying why.
 */

// ---- What is kept ----

interface Saved {
  pigs: Spread[];
  /** The furthest spread of the story that has been reached. */
  reached: number;
  free: Spread[];
  /** What is stuck on the front of the story's book. */
  pigsCover?: Spread;
  /** Every story's book: its spreads, its cover, and how far it has been got through. */
  tales?: Record<string, Tale>;
  /** The builder's own books, each with its name and its cover. */
  own?: Own[];
}
interface Tale {
  spreads: Spread[];
  cover: Spread;
  reached: number;
}
interface Own {
  title: string;
  cover: Spread;
  spreads: Spread[];
}
const STORE = 'portal-worlds-popup-v1';
const blank = (): Spread => ({ pieces: [] });
function load(): Saved {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      const s = JSON.parse(raw) as Saved;
      if (Array.isArray(s.pigs) && Array.isArray(s.free)) return s;
    }
  } catch {
    // Private windows: the book still works, it is just not remembered.
  }
  return { pigs: STORIES[0].pages.map(blank), reached: 0, free: [blank()] };
}
const saved = load();
while (saved.pigs.length < STORIES[0].pages.length) saved.pigs.push(blank());
if (!saved.free.length) saved.free.push(blank());
saved.pigsCover ??= blank();
// The first version had the one story; it becomes the first of several.
saved.tales ??= { pigs: { spreads: saved.pigs, cover: saved.pigsCover, reached: saved.reached } };
for (const st of STORIES) {
  const t = (saved.tales[st.id] ??= { spreads: [], cover: blank(), reached: 0 });
  while (t.spreads.length < st.pages.length) t.spreads.push(blank());
}
// The one own book of the first version becomes the first on the shelf.
saved.own ??= [{ title: 'My Pop-up Book', cover: blank(), spreads: saved.free }];
if (!saved.own.length) saved.own.push({ title: 'My Pop-up Book', cover: blank(), spreads: [blank()] });
/** Which of the builder's own books is open. */
let ownAt = 0;
const own = (): Own => saved.own![Math.min(ownAt, saved.own!.length - 1)];

/** A book as a string short enough to go in a link. */
// New kinds go on the end: a link holds each kind as its place in this list.
const KINDS: Kind[] = ['vfold', 'tent', 'platform', 'flap', 'sticker', 'stand', 'double', 'slide'];
const TRAY: Kind[] = ['vfold', 'stand', 'double', 'tent', 'platform', 'flap', 'slide', 'sticker'];
const r2 = (v: number) => Math.round(v * 100) / 100;
const pack = (spreads: Spread[]) => btoa(JSON.stringify(spreads.map((s) => s.pieces.map((p) => [KINDS.indexOf(p.kind), p.art, r2(p.x), r2(p.z), r2(p.w), r2(p.h), r2(p.angle), r2(p.reach), p.flip ? 1 : 0, ...(p.art2 ? [p.art2] : [])])))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function unpack(text: string): Spread[] | null {
  try {
    const rows = JSON.parse(atob(text.replace(/-/g, '+').replace(/_/g, '/'))) as (number | string)[][][];
    const num = (v: unknown, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number(v) || 0));
    return rows.slice(0, 24).map((row) => ({
      pieces: row.slice(0, 40).map((a) => ({ kind: KINDS[Number(a[0])] ?? 'sticker', art: ART[String(a[1])] ? String(a[1]) : 'plain', x: num(a[2], -W, W), z: num(a[3], -L, L), w: num(a[4], 0.5, 20), h: num(a[5], 0.5, 20), angle: num(a[6], 30, 70), reach: num(a[7], 1, W), flip: !!a[8], ...(a[9] && ART[String(a[9])] ? { art2: String(a[9]) } : {}) })),
    }));
  } catch {
    return null;
  }
}

type Mode = 'story' | 'free';
let mode: Mode = 'story';
/** Which story is open, when one is. */
let story: Story = STORIES[0];
const tale = (): Tale => saved.tales![story.id];
let at = 0;
/** A book that came in a link is looked at without touching what is kept, until it is kept on purpose. */
let visiting: Spread[] | null = null;
const book = (): Spread[] => visiting ?? (mode === 'story' ? tale().spreads : own().spreads);
/** The front cover is the page before the first: number −1. */
const visitCover = blank();
const coverNow = (): Spread => (visiting ? visitCover : mode === 'story' ? tale().cover : own().cover);
const spread = (): Spread => (at < 0 ? coverNow() : (book()[at] ?? book()[0]));
const titleOf = () => (visiting ? 'A book for you' : mode === 'story' ? story.title : own().title);
/** What is wrong on this spread. On the cover the only thing that can be is a sticker hanging off the edge. */
const faultsNow = (): (string | null)[] => (at < 0 ? spread().pieces.map((q) => (Math.abs(q.x) + q.w / 2 > W / 2 + 0.01 || Math.abs(q.z) + q.h / 2 > L / 2 + 0.01 ? 'This hangs off the edge of the cover.' : null)) : problems(spread()));
function keep(): void {
  if (visiting) return;
  try {
    localStorage.setItem(STORE, JSON.stringify(saved));
  } catch {
    // See above.
  }
}

// ---- The table, the book, the light ----

const canvas = document.getElementById('view') as HTMLCanvasElement;
const stage = document.getElementById('stage') as HTMLElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2f4650);
const camera = new THREE.PerspectiveCamera(38, 1, 1, 400);
let azimuth = 0;
let elevation = 0.82;

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.15));
const sun = new THREE.DirectionalLight(0xfff0d8, 2.1);
sun.position.set(-16, 34, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -24;
sun.shadow.camera.right = sun.shadow.camera.top = 24;
sun.shadow.camera.far = 120;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.04;
scene.add(sun);

const table = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: 0x3f5b66 }));
table.rotation.x = -Math.PI / 2;
table.position.y = -0.42;
table.receiveShadow = true;
scene.add(table);

const paper = new THREE.CanvasTexture(pagePaper());
paper.colorSpace = THREE.SRGBColorSpace;
const pageMat = new THREE.MeshLambertMaterial({ map: paper });
const coverMat = new THREE.MeshLambertMaterial({ color: 0x8a3340 });
const halves = [-1, 1].map((side) => {
  const half = new THREE.Group();
  const page = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, L), pageMat);
  page.position.set((side * W) / 2, -0.05, 0);
  page.receiveShadow = true;
  page.castShadow = true;
  const cover = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.2, L + 0.9), coverMat);
  cover.position.set((side * (W + 0.5)) / 2, -0.21, 0);
  cover.receiveShadow = true;
  cover.castShadow = true;
  half.add(page, cover);
  scene.add(half);
  // A painted background, where the spread has one: a printed sheet lying on the page.
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  sheet.rotation.x = -Math.PI / 2;
  sheet.position.set((side * W) / 2, 0.004, 0);
  sheet.receiveShadow = true;
  sheet.visible = false;
  half.add(sheet);
  return { side, half, sheet };
});
let backdrop: string | undefined;
/** Puts the spread's painted background on the pages, or takes it off. */
function showBackdrop(): void {
  const url = mode === 'story' && !visiting && at >= 0 ? pageArt(story.id, at) : undefined;
  if (url === backdrop) return;
  backdrop = url;
  for (const { sheet } of halves) sheet.visible = false;
  if (!url) return;
  new THREE.TextureLoader().load(url, (whole) => {
    if (backdrop !== url) return;
    for (const { side, sheet } of halves) {
      // Each page shows its own half of the one picture.
      const map = whole.clone();
      map.colorSpace = THREE.SRGBColorSpace;
      map.repeat.set(0.5, 1);
      map.offset.set(side < 0 ? 0 : 0.5, 0);
      map.needsUpdate = true;
      const mat = sheet.material as THREE.MeshLambertMaterial;
      mat.map?.dispose();
      mat.map = map;
      mat.needsUpdate = true;
      sheet.visible = true;
    }
  });
}

// The shut book, seen from the front: what is shown for the cover.
function coverFace(title: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 520;
  c.height = 760;
  const g = c.getContext('2d');
  if (!g) return c;
  g.fillStyle = '#8a3340';
  g.fillRect(0, 0, 520, 760);
  // The weave of the cloth.
  g.strokeStyle = 'rgba(255, 230, 220, 0.05)';
  for (let i = 0; i < 760; i += 4) {
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(520, i);
    g.stroke();
  }
  g.strokeStyle = '#e9cf8f';
  g.lineWidth = 4;
  g.strokeRect(26, 26, 468, 708);
  g.lineWidth = 1.5;
  g.strokeRect(36, 36, 448, 688);
  g.fillStyle = '#f4ead6';
  g.textAlign = 'center';
  g.font = '52px Georgia, serif';
  // The title, on as many lines as it needs.
  const lines: string[] = [];
  let line = '';
  for (const word of title.split(/\s+/).filter(Boolean)) {
    if (line && g.measureText(`${line} ${word}`).width > 400) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  lines.slice(0, 4).forEach((t, i) => g.fillText(t, 260, 130 + i * 62, 420));
  return c;
}
const faceMap = new THREE.CanvasTexture(coverFace(''));
faceMap.colorSpace = THREE.SRGBColorSpace;
const shutBook = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 1.1, L + 0.9), [coverMat, coverMat, new THREE.MeshLambertMaterial({ map: faceMap }), coverMat, pageMat, pageMat]);
shutBook.position.y = -0.56;
shutBook.castShadow = true;
shutBook.receiveShadow = true;
shutBook.visible = false;
scene.add(shutBook);
let faceTitle = '';
function showTitle(): void {
  if (faceTitle === titleOf()) return;
  faceTitle = titleOf();
  faceMap.image = coverFace(faceTitle);
  faceMap.needsUpdate = true;
}

// ---- The pieces, as paper ----

const plain = new THREE.MeshLambertMaterial({ color: 0xf4ead6, side: THREE.DoubleSide });
const mats = new Map<string, THREE.Material>();
function matOf(art: string): THREE.Material {
  let m = mats.get(art);
  if (!m) {
    const map = new THREE.CanvasTexture(canvasOf(art));
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    m = new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide, alphaTest: 0.5 });
    mats.set(art, m);
  }
  return m;
}

// The fold down the middle of the book: a real book shows it even when it lies quite flat.
const gutter = new THREE.Group();
const crease = new THREE.Mesh(new THREE.PlaneGeometry(0.1, L), new THREE.MeshBasicMaterial({ color: 0x8f7a5c, transparent: true, opacity: 0.75 }));
const shade = new THREE.Mesh(new THREE.PlaneGeometry(1.6, L), new THREE.MeshBasicMaterial({ color: 0x6b5638, transparent: true, opacity: 0.1 }));
crease.position.y = 0.008;
shade.position.y = 0.005;
for (const m of [shade, crease]) {
  m.rotation.x = -Math.PI / 2;
  gutter.add(m);
}
scene.add(gutter);

/** The line a V-fold or a platform can slide along, shown while one is in hand. */
const guide = new THREE.Mesh(new THREE.PlaneGeometry(0.22, L), new THREE.MeshBasicMaterial({ color: 0x2f7fd0, transparent: true, opacity: 0.7, depthTest: false }));
guide.rotation.x = -Math.PI / 2;
guide.position.y = 0.02;
guide.renderOrder = 4;
scene.add(guide);

interface Made {
  meshes: THREE.Mesh[];
  edge: THREE.LineSegments;
}
const pieceRoot = new THREE.Group();
scene.add(pieceRoot);
let made: Made[] = [];
let lifts: { now: number; want: number }[] = [];
let open = 1;
let selected = -1;
/** The piece just put in, shown edged for a moment so that it can be found. */
let just = -1;
let faults: (string | null)[] = [];

/** Makes the paper for the spread on show, from nothing. Called whenever a piece is added, taken away or re-covered. */
function rebuild(): void {
  for (const m of made) {
    for (const mesh of m.meshes) mesh.geometry.dispose();
    m.edge.geometry.dispose();
  }
  pieceRoot.clear();
  made = spread().pieces.map((piece, index) => {
    const meshes = quads(piece, 1).map((q) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
      const [u0, v0, u1, v1] = q.uv;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([u0, v0, u1, v0, u1, v1, u0, v1]), 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      const mesh = new THREE.Mesh(g, q.art ? matOf(q.inner ? (piece.art2 ?? piece.art) : piece.art) : plain);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.index = index;
      mesh.frustumCulled = false;
      pieceRoot.add(mesh);
      return mesh;
    });
    const eg = new THREE.BufferGeometry();
    eg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(meshes.length * 24), 3));
    const edge = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0xd9342b, depthTest: false }));
    edge.renderOrder = 5;
    edge.frustumCulled = false;
    pieceRoot.add(edge);
    return { meshes, edge };
  });
  showBackdrop();
  while (lifts.length < made.length) lifts.push({ now: 0, want: 0 });
  lifts.length = made.length;
  faults = faultsNow();
}

/** Puts every piece where it is at this moment: the book this far open, each flap this far lifted. */
function place(): void {
  // The cover is a shut book lying flat: nothing on it folds.
  const onCover = at < 0;
  const shown = onCover ? 1 : open;
  const alpha = tilt(shown);
  for (const { side, half } of halves) {
    half.rotation.z = side * alpha;
    half.visible = !onCover;
  }
  shutBook.visible = onCover;
  shutSlider.style.visibility = onCover ? 'hidden' : '';
  gutter.visible = !onCover;
  if (onCover) showTitle();
  const inHand = spread().pieces[selected];
  shade.visible = open > 0.9;
  guide.visible = !onCover && !!inHand && (inHand.kind === 'vfold' || inHand.kind === 'platform' || inHand.kind === 'double') && open > 0.97;
  spread().pieces.forEach((piece, i) => {
    const m = made[i];
    if (!m) return;
    const qs = quads(piece, shown, lifts[i]?.now ?? 0);
    const line = m.edge.geometry.getAttribute('position') as THREE.BufferAttribute;
    qs.forEach((q, k) => {
      const pos = m.meshes[k].geometry.getAttribute('position') as THREE.BufferAttribute;
      q.c.forEach((c, j) => {
        pos.setXYZ(j, c[0], c[1], c[2]);
        const next = q.c[(j + 1) % 4];
        line.setXYZ(k * 8 + j * 2, c[0], c[1], c[2]);
        line.setXYZ(k * 8 + j * 2 + 1, next[0], next[1], next[2]);
      });
      pos.needsUpdate = true;
      m.meshes[k].geometry.computeVertexNormals();
    });
    line.needsUpdate = true;
    const bad = !!faults[i];
    m.edge.visible = bad || i === selected || i === just;
    (m.edge.material as THREE.LineBasicMaterial).color.set(bad ? 0xd9342b : i === selected ? 0x2f7fd0 : 0x58994f);
  });
}

// ---- Moving the book ----

let running = 0;
/** Opens or shuts the book to a point, over some seconds. A later call takes over from an earlier one. */
function swing(to: number, seconds: number): Promise<boolean> {
  const mine = ++running;
  const from = open;
  const start = performance.now();
  return new Promise((done) => {
    const step = () => {
      if (mine !== running) return done(false);
      const t = Math.min(1, (performance.now() - start) / (seconds * 1000));
      open = from + (to - from) * (t * t * (3 - 2 * t));
      slider.value = String(Math.round(open * 100));
      if (t < 1) requestAnimationFrame(step);
      else done(true);
    };
    step();
  });
}
const pause = (seconds: number) => new Promise<void>((done) => setTimeout(done, seconds * 1000));

/** Shuts the book, changes the spread, and opens it again. */
async function turnTo(index: number): Promise<void> {
  selected = -1;
  pending = null;
  if (!(await swing(0, 0.45))) return;
  at = index;
  lifts = [];
  rebuild();
  draw();
  await swing(1, 0.9);
}

// ---- The controls ----

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const slider = el<HTMLInputElement>('open');
const shutSlider = el('shut');
const side = el('side');
const banner = el('banner');
const cover = el('cover');

const ICONS: Record<Kind, string> = {
  vfold: '<path d="M6 30 20 12 34 30" fill="#f4ead6" stroke="#5a4632" stroke-width="2" stroke-linejoin="round"/><path d="M20 12V4" stroke="#5a4632" stroke-width="2" stroke-dasharray="3 2"/><path d="M2 34h36" stroke="#5a4632" stroke-width="2"/>',
  tent: '<path d="M6 32 20 8 34 32" fill="none" stroke="#5a4632" stroke-width="2.4" stroke-linejoin="round"/><path d="M2 32h36" stroke="#5a4632" stroke-width="2"/><path d="M20 32v4" stroke="#5a4632" stroke-width="2" stroke-dasharray="2 2"/>',
  platform: '<path d="M6 14h28M8 14v18M32 14v18M20 14v18" fill="none" stroke="#5a4632" stroke-width="2.4"/><path d="M2 32h36" stroke="#5a4632" stroke-width="2"/>',
  flap: '<rect x="8" y="16" width="24" height="16" fill="none" stroke="#5a4632" stroke-width="2" stroke-dasharray="3 2"/><path d="M8 16 14 4h24l-6 12Z" fill="#f4ead6" stroke="#5a4632" stroke-width="2" stroke-linejoin="round"/>',
  sticker: '<rect x="8" y="8" width="24" height="24" rx="4" fill="#f4ead6" stroke="#5a4632" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="#e58f9c"/>',
  double: '<path d="M2 34h36" stroke="#5a4632" stroke-width="2"/><path d="M4 30 20 8 36 30" fill="#f4ead6" stroke="#5a4632" stroke-width="2" stroke-linejoin="round"/><path d="M11 30 20 17 29 30" fill="#fffaf0" stroke="#5a4632" stroke-width="2" stroke-linejoin="round"/><path d="M20 8v22" stroke="#5a4632" stroke-width="1.6" stroke-dasharray="3 2"/>',
  slide: '<rect x="17" y="6" width="6" height="30" rx="3" fill="none" stroke="#5a4632" stroke-width="1.6" stroke-dasharray="3 2"/><rect x="9" y="6" width="22" height="16" rx="3" fill="#f4ead6" stroke="#5a4632" stroke-width="2"/><path d="M20 26v8m-4-4 4 4 4-4" fill="none" stroke="#5a4632" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  stand: '<path d="M2 34h36" stroke="#5a4632" stroke-width="2"/><path d="M10 34v4" stroke="#5a4632" stroke-width="2" stroke-dasharray="2 2"/><rect x="20" y="8" width="14" height="26" fill="#f4ead6" stroke="#5a4632" stroke-width="2"/><path d="M10 34h10v-5Z" fill="#f4ead6" stroke="#5a4632" stroke-width="1.6" stroke-linejoin="round"/>',
};
const KIND_NAME: Record<Kind, string> = { double: 'Double V', slide: 'Pull tab', stand: 'Stand-up', vfold: 'V-fold', tent: 'Tent', platform: 'Platform', flap: 'Flap', sticker: 'Sticker' };
const KIND_SAYS: Record<Kind, string> = {
  vfold: 'Creased down the middle and glued to both pages in a V. It stands up when the book opens.',
  tent: 'A strip glued to both pages, with a ridge over the spine.',
  platform: 'A flat top that floats level above the pages.',
  flap: 'Lies flat on one page. Tap it to lift it and see what is under it.',
  sticker: 'A picture glued flat on a page.',
  double: 'A V-fold with a second, smaller fold inside it. Both open together.',
  slide: 'A picture that slides along the page when its tab is pulled. Tap it to pull it.',
  stand: 'Stands on one page, facing you, anywhere out from the middle. A small brace across the fold pulls it up.',
};
const SLIDERS: Record<Kind, [keyof Piece, string, number, number][]> = {
  vfold: [['h', 'How tall', 2, 13], ['w', 'How wide', 1.5, 9], ['angle', 'How open the V', 30, 70]],
  tent: [['h', 'How tall', 0.5, 9], ['reach', 'How far apart', 1.5, 10], ['w', 'How long', 2, 18]],
  platform: [['h', 'How high', 1, 8], ['reach', 'How wide', 1.5, 10], ['w', 'How long', 2, 18]],
  flap: [['w', 'How wide', 1.5, 12], ['h', 'How tall', 1.5, 12]],
  sticker: [['w', 'How wide', 1, 12], ['h', 'How tall', 1, 12]],
  stand: [['h', 'How tall', 2, 13], ['w', 'How wide', 1.5, 10]],
  double: [['h', 'How tall', 3, 13], ['w', 'How wide', 2, 9], ['angle', 'How open the V', 30, 70]],
  slide: [['reach', 'How far it slides', 1, 12], ['w', 'How wide', 1, 9], ['h', 'How tall', 1, 9]],
};

/** Every picture, with the ones the open story uses first. */
function artList(): [string, (typeof ART)[string]][] {
  const all = Object.entries(ART);
  if (mode !== 'story' || visiting) return all;
  const first = story.arts.filter((id) => ART[id]);
  return [...first.map((id): [string, (typeof ART)[string]] => [id, ART[id]]), ...all.filter(([id]) => !first.includes(id))];
}

/** Pictures that look right as a smaller copy of themselves, one in front of the other. */
const LAYERS = ['tree', 'pine', 'bush', 'hill', 'beanstalk', 'palm', 'flower', 'cloud', 'web', 'hair'];

/** What the story asks of this spread, and whether it has it yet. */
function need(): { ok: boolean; hint: string } {
  if (mode !== 'story' || visiting || at < 0) return { ok: true, hint: '' };
  if (faults.some(Boolean)) return { ok: false, hint: 'Something is edged in red. Tap it to see what is wrong.' };
  const hint = story.pages[at].check(spread());
  return { ok: !hint, hint: hint ?? '' };
}

/** What a flap is hiding, in words. */
function under(flap: Piece): string {
  const names: string[] = [];
  const part: string[] = [];
  for (const p of spread().pieces) {
    if (p.kind !== 'sticker' || Math.sign(p.x) !== Math.sign(flap.x)) continue;
    const dx = Math.abs(p.x - flap.x);
    const dz = Math.abs(p.z - flap.z);
    const name = ART[p.art]?.name ?? 'something';
    if (dx + p.w / 2 <= flap.w / 2 + 0.05 && dz + p.h / 2 <= flap.h / 2 + 0.05) names.push(name);
    else if (dx < (p.w + flap.w) / 2 && dz < (p.h + flap.h) / 2) part.push(name);
  }
  if (!names.length && !part.length) return 'Nothing is under it yet. Put a sticker on the page and move the flap over it.';
  return `${names.length ? `Hidden under it: the ${names.join(', the ')}. ` : ''}${part.length ? `Part of the ${part.join(' and the ')} still shows: make the flap bigger, or move it.` : ''}`;
}

function changed(structure = false): void {
  if (structure) rebuild();
  else faults = faultsNow();
  keep();
  draw();
}

function draw(): void {
  const pieces = spread().pieces;
  const inStory = mode === 'story' && !visiting;
  const state = need();
  const last = at === book().length - 1;
  const onCover = at < 0;
  if (onCover) banner.innerHTML = '<p class="need">The front cover. Decorate it with stickers.</p>';
  else if (inStory) {
    const page = story.pages[at];
    banner.innerHTML = `<p class="line">${page.line}</p><p class="need ${state.ok ? 'met' : ''}"><b>${state.ok ? '✓' : '✎'}</b> ${page.need}</p>${state.ok ? '' : `<p class="hint">${state.hint}</p>`}`;
  } else banner.innerHTML = visiting ? '<p class="need">A book someone sent you.</p>' : '';
  banner.hidden = !banner.innerHTML;
  if (inStory && !onCover && state.ok && at === tale().reached && at < story.pages.length - 1) {
    tale().reached = at + 1;
    keep();
  }
  const canNext = inStory ? at < tale().reached || (last && state.ok) : true;
  const sel = pieces[selected];
  const fault = selected >= 0 ? faults[selected] : faults.find(Boolean) ? 'Something is edged in red. Tap it to see what is wrong.' : null;
  side.innerHTML = `
    ${
      sel || pending
        ? // With a piece in hand or the pictures open, the top corner goes back out of that, never to another page.
          `<div class="nav"><button data-do="${sel ? 'done' : 'cancel'}" class="go">◀ ${sel && pending ? 'Back to the pictures' : 'Back to the pieces'}</button><span>${onCover ? 'Cover' : `Spread ${at + 1}`}</span></div>`
        : onCover
          ? `<div class="nav"><button data-do="shelf">◀ Bookshelf</button><span>Cover</span><button data-do="next" class="go">Open it ▶</button></div>
             ${mode === 'free' && !visiting ? `<label class="title">What is it called?<input type="text" data-title maxlength="48" value="${own().title.replace(/"/g, '&quot;')}"></label>` : ''}`
          : `<div class="nav"><button data-do="prev">◀ ${at === 0 ? 'Front cover' : 'Page before'}</button><span>${at + 1} of ${book().length}</span>
      <button data-do="next" class="${inStory && state.ok ? 'go' : ''}"${canNext ? '' : ' disabled'}>${inStory && last ? 'The end ▶' : !inStory && last ? '＋ New page' : 'Next page ▶'}</button></div>`
    }
    ${fault ? `<p class="fault">${fault}</p>` : ''}
    ${
      sel
        ? `<div class="edit"><h3>${KIND_NAME[sel.kind]}${stands(sel) ? ` <small>${heightOf(sel).toFixed(1)} cm tall</small>` : ''}</h3>
          ${
            sel.kind === 'double'
              ? `<p class="say">A double V has two pictures: one on the big fold, and one on the small fold inside it.</p><div class="switch"><button class="${inside ? '' : 'on'}" data-do="which" data-v="0">The big fold</button><button class="${inside ? 'on' : ''}" data-do="which" data-v="1">The small one inside</button></div>`
              : '<p class="say">This one is picked. Tap a picture to change it.</p>'
          }
          <div class="arts">${artList().map(([id, a]) => `<button data-do="art" data-v="${id}" class="${(sel.kind === 'double' && inside ? (sel.art2 ?? sel.art) : sel.art) === id ? 'on' : ''}" style="background-image:url(${urlOf(id)})" aria-label="${a.name}"></button>`).join('')}</div>
          ${SLIDERS[sel.kind].map(([key, name, lo, hi]) => `<label>${name}<input type="range" data-key="${key}" min="${lo}" max="${hi}" step="0.25" value="${sel[key]}"></label>`).join('')}
          <p class="tip">${sel.kind === 'vfold' || sel.kind === 'platform' || sel.kind === 'double' ? `A ${KIND_NAME[sel.kind].toLowerCase()} sits on the fold in the middle of the book. Drag it to slide it along the blue line.` : sel.kind === 'flap' ? 'Tap the flap again to lift it or let it down. Drag it to move it.' : 'Drag it to move it.'}</p>
          <div class="row nudge"><span>Move it</span><button data-do="nudge" data-v="0,-1" aria-label="Further back">▲ back</button><button data-do="nudge" data-v="0,1" aria-label="Nearer">▼ nearer</button>${sel.kind === 'vfold' || sel.kind === 'platform' || sel.kind === 'double' ? '' : '<button data-do="nudge" data-v="-1,0" aria-label="Left">◀</button><button data-do="nudge" data-v="1,0" aria-label="Right">▶</button>'}</div>
          ${sel.kind === 'flap' ? `<p class="say">${under(sel)}</p>` : ''}
          <div class="row">${moves(sel) ? `<button data-do="lift" class="go">${sel.kind === 'slide' ? (lifts[selected]?.want ? 'Push it back' : 'Pull it') : lifts[selected]?.want ? 'Let it down' : 'Lift it up'}</button>` : ''}${sel.kind === 'slide' ? `<button data-do="flip">${sel.flip ? 'Slide it down the page' : 'Slide it sideways'}</button>` : ''}${sel.kind === 'vfold' ? '<button data-do="flip">Turn it round</button>' : sel.kind === 'stand' ? '<button data-do="flip">Brace on the other side</button>' : ''}<button data-do="copy">Another like it</button><button data-do="delete" class="warn">Take it off</button><button data-do="done" class="go">Done</button></div></div>`
        : pending
          ? `<div class="edit"><h3>${KIND_NAME[pending.kind]}</h3><p class="say">Tap a picture to put one in the book. Tap another to add another.</p>
              <div class="arts big">${artList().map(([id, a]) => `<button data-do="choose" data-v="${id}" style="background-image:url(${urlOf(id)})" aria-label="${a.name}"></button>`).join('')}</div>
              <p class="tip">${KIND_SAYS[pending.kind]} To change one that is already in the book, tap it on the page first, then tap a picture.</p>
              <div class="row"><button data-do="cancel">Back to the pieces</button></div></div>`
          : `<h3 class="ask">Add something</h3><div class="tray">${(onCover ? (['sticker'] as Kind[]) : TRAY).map((k) => `<button data-do="add" data-v="${k}"><svg viewBox="0 0 40 40">${ICONS[k]}</svg><b>${KIND_NAME[k]}</b><small>${KIND_SAYS[k]}</small></button>`).join('')}</div>
          <div class="row menu">${pieces.some(moves) ? `<button data-do="flaps">${lifts.some((l, i) => pieces[i] && moves(pieces[i]) && l.want) ? 'Flaps and tabs back' : 'Lift the flaps, pull the tabs'}</button>` : ''}<button data-do="read">▶ Read the book</button><button data-do="print">Print it</button>${visiting ? '<button data-do="mine">Keep it as mine</button>' : mode === 'free' ? '<button data-do="link">Copy a link</button>' : ''}${mode === 'free' && !visiting && book().length > 1 ? '<button data-do="unpage" class="warn">Tear out this page</button>' : ''}${onCover ? '' : '<button data-do="cover">Front cover</button>'}<button data-do="shelf">Bookshelf</button></div>
          <p class="tip">Tap a piece on the page to change it. Drag it to move it. Drag the table to look round. Slide the book shut to see how it folds.</p>`
    }`;
}

side.addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  if (input.dataset.title !== undefined) {
    own().title = input.value.trim() || 'My Pop-up Book';
    keep();
    return;
  }
  const piece = spread().pieces[selected];
  if (!piece || !input.dataset.key) return;
  (piece as unknown as Record<string, number>)[input.dataset.key] = Number(input.value);
  if (piece.kind === 'stand') moveTo(piece, piece.x, piece.z);
  faults = faultsNow();
  keep();
  // The panel is not drawn again while a slider is held, or the slider would be torn from under the finger.
  const small = side.querySelector('h3 small');
  if (small) small.textContent = `${heightOf(piece).toFixed(1)} cm tall`;
  const fault = side.querySelector('.fault');
  if (fault) fault.textContent = faults[selected] ?? '';
  const say = side.querySelector('.edit .say');
  if (say && piece.kind === 'flap') say.textContent = under(piece);
});
side.addEventListener('change', (e) => {
  // The title box keeps its place while it is typed in.
  if ((e.target as HTMLElement).dataset.title === undefined) draw();
});

let armed = '';
/** For a double V in hand: whether a picture tapped goes on the small fold inside, or the big one. */
let inside = false;
/** A piece being chosen, before it is on the page: first its kind, then what is on it, then where. */
let pending: { kind: Kind } | null = null;
side.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-do]');
  if (!b || b.hasAttribute('disabled')) return;
  const pieces = spread().pieces;
  const what = b.dataset.do!;
  const v = b.dataset.v ?? '';
  if (what === 'add') {
    pending = { kind: v as Kind };
    draw();
  } else if (what === 'choose' && pending) {
    // One tap, one piece: it goes straight into the book, at a place where it works.
    const piece = fresh(pending.kind, v);
    // A double V of something leafy looks right with the same again inside it. Of anything else
    // (a house, a pig) a small copy inside looks wrong, so it starts with a bush in front instead.
    if (piece.kind === 'double' && !LAYERS.includes(v) && !ART[v]?.paper) piece.art2 = 'bush';
    // It goes in the first free place: where it shuts, hits nothing, and does not lie on another of its kind.
    const lying = !stands(piece);
    const spots: [number, number][] = [];
    if (piece.kind === 'stand') for (const z of [-3, 2, -6, 5, -1, 7, -8]) for (const x of [6.5, -6.5, 9.5, -9.5]) spots.push([x, z]);
    else if (!lying) for (const z of [0, -5, 5, -2.5, 2.5, 7, -7, -8.5, 8.5]) spots.push([0, z]);
    else if (piece.kind === 'slide') for (const z of [-3, -6, 0, -8]) for (const x of [5, -5, 8.5, -8.5]) spots.push([x, z]);
    else if (at < 0) for (const z of [3, -2, 7, -6]) for (const x of [0, -3.5, 3.5]) spots.push([x, z]);
    else for (const z of [4, -3, 7, -6, 0]) for (const x of [6.5, -6.5, 3.5, -3.5, 9.5, -9.5]) spots.push([x, z]);
    const free = (): boolean => {
      if (piece.kind === 'slide' && fits(piece)) return false;
      if (lying) return !pieces.some((q) => q.kind === piece.kind && Math.abs(q.x - piece.x) < (q.w + piece.w) / 2 && Math.abs(q.z - piece.z) < (q.h + piece.h) / 2);
      // Two pieces in the very same place do not cut through each other, so that has to be asked separately.
      if (pieces.some((q) => stands(q) && Math.abs(q.z - piece.z) < 1.5 && (piece.kind !== 'stand' || q.kind !== 'stand' || Math.abs(q.x - piece.x) < 2))) return false;
      for (const flip of piece.kind === 'vfold' ? [false, true] : [piece.flip]) {
        piece.flip = flip;
        if (!problems({ pieces: [...pieces, piece] })[pieces.length]) return true;
      }
      return false;
    };
    moveTo(piece, spots[0][0], spots[0][1]);
    for (const [x, z] of spots) {
      moveTo(piece, x, z);
      if (free()) break;
    }
    if (!free()) {
      piece.flip = false;
      moveTo(piece, spots[0][0], spots[0][1]);
    }
    pieces.push(piece);
    just = pieces.length - 1;
    setTimeout(() => (just = -1), 1600);
    changed(true);
    if (stands(piece)) void swing(0.45, 0.6).then((ok) => ok && swing(1, 0.7));
  } else if (what === 'cancel') {
    pending = null;
    draw();
  } else if (what === 'art') {
    if (pieces[selected].kind === 'double' && inside) pieces[selected].art2 = v;
    else pieces[selected].art = v;
    changed(true);
  } else if (what === 'which') {
    inside = v === '1';
    draw();
  } else if (what === 'nudge') {
    const [dx, dz] = v.split(',').map(Number);
    moveTo(pieces[selected], pieces[selected].x + dx * 0.5, pieces[selected].z + dz * 0.5);
    changed();
  } else if (what === 'lift') {
    lifts[selected].want = lifts[selected].want ? 0 : 2.3;
    draw();
  } else if (what === 'flaps') {
    const up = lifts.some((l, i) => pieces[i] && moves(pieces[i]) && l.want);
    lifts.forEach((l, i) => (l.want = pieces[i] && moves(pieces[i]) && !up ? 2.3 : 0));
    draw();
  } else if (what === 'flip') {
    pieces[selected].flip = !pieces[selected].flip;
    changed();
  } else if (what === 'copy') {
    const twin = { ...pieces[selected] };
    twin.z = Math.max(-L / 2 + 1, Math.min(L / 2 - 1, twin.z + (twin.z > 0 ? -4 : 4)));
    pieces.push(twin);
    selected = pieces.length - 1;
    changed(true);
  } else if (what === 'delete') {
    pieces.splice(selected, 1);
    lifts.splice(selected, 1);
    selected = -1;
    changed(true);
  } else if (what === 'done') {
    selected = -1;
    draw();
  } else if (what === 'prev') void turnTo(at - 1);
  else if (what === 'next' && at < 0) void turnTo(0);
  else if (what === 'next') {
    if (at < book().length - 1) void turnTo(at + 1);
    else if (mode === 'story' && !visiting) void read();
    else if (!visiting) {
      own().spreads.push(blank());
      keep();
      void turnTo(at + 1);
    }
  } else if (what === 'unpage') {
    if (armed !== 'unpage') {
      armed = 'unpage';
      b.textContent = 'Tap again to tear it out';
      setTimeout(() => (armed = ''), 2500);
      return;
    }
    armed = '';
    own().spreads.splice(at, 1);
    keep();
    void turnTo(Math.max(0, at - 1));
  } else if (what === 'read') void read();
  else if (what === 'print') {
    b.textContent = 'Getting it ready…';
    void print().then(() => draw());
  }
  else if (what === 'link') {
    const url = `${location.origin}${location.pathname}#b=${pack(book())}`;
    const say = (t: string) => (b.textContent = t);
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => say('Copied. Paste it to send it'), () => window.prompt('Copy this link:', url));
    else window.prompt('Copy this link:', url);
  } else if (what === 'mine') {
    if (armed !== 'mine') {
      armed = 'mine';
      b.textContent = 'Tap again to put it on your shelf';
      setTimeout(() => (armed = ''), 3000);
      return;
    }
    saved.own!.push({ title: 'A book I was sent', cover: blank(), spreads: visiting! });
    ownAt = saved.own!.length - 1;
    visiting = null;
    history.replaceState(null, '', location.pathname);
    keep();
    draw();
  } else if (what === 'cover') void turnTo(-1);
  else if (what === 'shelf') showShelf();
});

slider.addEventListener('input', () => {
  running++;
  open = Number(slider.value) / 100;
});

// ---- Touching the book ----

const ray = new THREE.Raycaster();
/** `was`: it was already the piece in hand when touched, so a tap means more than choosing it. */
let drag: { index: number; x: number; z: number; scale: number; moved: boolean; was: boolean } | null = null;
let look: { x: number; y: number } | null = null;
let downAt = { x: 0, y: 0 };
function aim(e: { clientX: number; clientY: number }): void {
  const r = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
}
/** Puts a piece at a place on the open spread, as far as its kind allows. */
function moveTo(piece: Piece, x: number, z: number): void {
  const snap = (v: number) => Math.round(v * 4) / 4;
  // What lies flat stays wholly on its page.
  const lying = piece.kind === 'flap' || piece.kind === 'sticker' || piece.kind === 'slide';
  const zMost = L / 2 - (lying ? piece.h / 2 : 0);
  piece.z = snap(Math.max(-zMost, Math.min(zMost, z)));
  // Only what is glued to one page, or a tent, can go across: a V-fold and a platform sit on the spine.
  if (piece.kind === 'double') piece.x = 0;
  else if (piece.kind === 'tent') piece.x = snap(Math.max(-piece.reach + 0.5, Math.min(piece.reach - 0.5, x)));
  else if (piece.kind === 'stand') {
    // Either page, but clear of the fold in the middle, where its brace goes.
    const least = piece.w / 2 + STAND_CLEAR;
    const side = Math.abs(x) < 0.5 ? Math.sign(piece.x) || 1 : Math.sign(x);
    piece.x = side * snap(Math.max(least, Math.min(W - piece.w / 2, Math.abs(x))));
  } else if (lying && at < 0) {
    piece.x = snap(Math.max(-W / 2 + piece.w / 2, Math.min(W / 2 - piece.w / 2, x)));
  } else if (lying) {
    const side = Math.abs(x) < 0.3 ? Math.sign(piece.x) || 1 : Math.sign(x);
    piece.x = side * snap(Math.max(piece.w / 2 + 0.3, Math.min(W - piece.w / 2, Math.abs(x))));
  }
}
/** The piece whose outline on the screen is nearest the finger, if the finger is within a little of it; else −1. */
function near(e: PointerEvent): number {
  const r = canvas.getBoundingClientRect();
  const v = new THREE.Vector3();
  let best = -1;
  let bestFar = Infinity;
  spread().pieces.forEach((piece, i) => {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const q of quads(piece, at < 0 ? 1 : open, lifts[i]?.now ?? 0))
      for (const c of q.c) {
        v.set(c[0], c[1], c[2]).project(camera);
        const sx = r.left + ((v.x + 1) / 2) * r.width;
        const sy = r.top + ((1 - v.y) / 2) * r.height;
        x0 = Math.min(x0, sx);
        x1 = Math.max(x1, sx);
        y0 = Math.min(y0, sy);
        y1 = Math.max(y1, sy);
      }
    const slack = 22;
    if (e.clientX < x0 - slack || e.clientX > x1 + slack || e.clientY < y0 - slack || e.clientY > y1 + slack) return;
    const far = Math.hypot(e.clientX - (x0 + x1) / 2, e.clientY - (y0 + y1) / 2);
    if (far < bestFar) {
      bestFar = far;
      best = i;
    }
  });
  return best;
}
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  downAt = { x: e.clientX, y: e.clientY };
  aim(e);
  const hit = reading ? null : ray.intersectObjects(made.flatMap((m) => m.meshes))[0];
  // A near miss still takes hold: a small or far-off piece is hard to touch exactly.
  const index = hit ? (hit.object.userData.index as number) : reading ? -1 : near(e);
  if (index >= 0) {
    const piece = spread().pieces[index];
    // How far across the table one step of the finger is, at the place that was touched.
    const scale = (2 * (hit?.distance ?? camera.position.length()) * Math.tan((camera.fov * Math.PI) / 360)) / canvas.getBoundingClientRect().height;
    drag = { index, x: piece.x, z: piece.z, scale, moved: false, was: selected === index };
    if (selected !== index) {
      inside = false;
      selected = index;
      draw();
    }
  } else look = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointermove', (e) => {
  if (drag && open > 0.97) {
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6 && !drag.moved) return;
    drag.moved = true;
    // The piece goes the way the finger goes: across the screen is across the table, up the screen is away.
    // This is reckoned from the finger's own travel, so it works wherever a tall piece is taken hold of
    // and however low the table is looked at from.
    const across = (e.clientX - downAt.x) * drag.scale;
    const away = ((downAt.y - e.clientY) * drag.scale) / Math.max(0.35, Math.sin(elevation));
    moveTo(spread().pieces[drag.index], drag.x + across * Math.cos(azimuth) - away * Math.sin(azimuth), drag.z - across * Math.sin(azimuth) - away * Math.cos(azimuth));
    faults = faultsNow();
  } else if (look) {
    azimuth = Math.max(-1.3, Math.min(1.3, azimuth - (e.clientX - look.x) * 0.006));
    elevation = Math.max(0.2, Math.min(1.5, elevation + (e.clientY - look.y) * 0.005));
    look = { x: e.clientX, y: e.clientY };
  }
});
canvas.addEventListener('pointerup', () => {
  if (drag) {
    const piece = spread().pieces[drag.index];
    // A tap on a flap lifts it, or lets it down.
    if (!drag.moved && piece && moves(piece) && open > 0.97 && drag.was) {
      lifts[drag.index].want = lifts[drag.index].want ? 0 : 2.3;
      draw();
    }
    if (drag.moved) changed();
  } else if (look && Math.hypot(downAt.x - look.x, downAt.y - look.y) < 6 && selected >= 0 && !reading) {
    // A tap on the bare page lets go of the piece in hand. It does not move it: that is what dragging is for.
    selected = -1;
    draw();
  }
  drag = null;
  look = null;
});

// ---- Reading the book through ----

let reading = false;
const caption = el('caption');
async function read(): Promise<void> {
  reading = true;
  selected = -1;
  document.body.classList.add('reading');
  const inStory = mode === 'story' && !visiting;
  const token = () => reading;
  // It begins shut, with its cover showing.
  at = -1;
  lifts = [];
  rebuild();
  caption.innerHTML = '';
  await pause(2.2);
  open = 0;
  for (let i = 0; i < book().length && token(); i++) {
    await swing(0, 0.6);
    if (!token()) break;
    at = i;
    lifts = [];
    rebuild();
    caption.innerHTML = inStory ? `<p>${story.pages[i].line}</p>` : '';
    await swing(1, 2.6);
    if (!token()) break;
    await pause(0.9);
    for (const [k, p] of spread().pieces.entries()) if (moves(p) && token()) lifts[k].want = 2.3;
    await pause(inStory ? 3.4 : 2.2);
    for (const l of lifts) l.want = 0;
    await pause(0.5);
  }
  if (reading) caption.innerHTML = `<p><b>The End</b></p>`;
}
el('stop').onclick = () => {
  reading = false;
  running++;
  document.body.classList.remove('reading');
  caption.innerHTML = '';
  void swing(1, 0.5);
  draw();
};

// ---- Printing ----

/**
 * The pictures on the sheets are images, and an image put on the page a moment
 * ago may not have been drawn yet. Printing at once left most of them blank,
 * so the printer is not called until every one of them is ready.
 */
async function print(): Promise<void> {
  const inStory = mode === 'story' && !visiting;
  const holder = el('print');
  holder.innerHTML = sheets(titleOf(), book(), inStory ? story.pages.map((p) => p.line) : [], coverNow(), inStory ? story.pages.map((_, i) => pageArt(story.id, i)) : []);
  const urls = [...new Set(Array.from(holder.querySelectorAll('image')).map((i) => i.getAttribute('href') ?? ''))].filter(Boolean);
  await Promise.all(
    urls.map((url) => {
      const img = new Image();
      img.src = url;
      return img.decode().catch(() => undefined);
    }),
  );
  // And a moment for the page itself to lay them out.
  await new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 250))));
  window.print();
}

// ---- The bookshelf: which book to work on ----

let shelfArmed = '';
function showShelf(): void {
  const count = (spreads: Spread[]) => {
    const n = spreads.reduce((sum, q) => sum + q.pieces.length, 0);
    return n ? `${spreads.length} ${spreads.length === 1 ? 'spread' : 'spreads'}, ${n} ${n === 1 ? 'piece' : 'pieces'}` : 'Empty pages, and everything in the tray';
  };
  const again = (key: string, has: boolean) => (has ? `<button class="small warn" data-clear="${key}">${shelfArmed === key ? 'Tap again to empty it' : 'Start it again'}</button>` : '');
  cover.innerHTML = `<div class="card"><h1>The Bookshelf</h1><p>Build a book that stands up when it opens. Then print it, cut it out, and make the real one.</p>
    <h2>Stories to build</h2>
    ${STORIES.map((st) => {
      const t = saved.tales![st.id];
      const begun = t.spreads.some((q) => q.pieces.length) || t.cover.pieces.length > 0;
      const done = t.reached >= st.pages.length - 1 && !st.pages[st.pages.length - 1].check(t.spreads[st.pages.length - 1]);
      return `<div class="book"><button data-go="s:${st.id}" class="tale"><i style="background-image:url(${urlOf(st.art)})"></i><b>${st.title}</b><small>${st.from}${done ? ' · finished' : begun ? ` · spread ${Math.min(t.reached + 1, st.pages.length)} of ${st.pages.length}` : ''}</small></button>${again(`s:${st.id}`, begun)}</div>`;
    }).join('')}
    <h2>Your own books</h2>
    ${saved.own!.map((o, i) => `<div class="book"><button data-go="${i}"><b>${o.title.replace(/</g, '&lt;')}</b><small>${count(o.spreads)}</small></button>${again(String(i), o.spreads.some((q) => q.pieces.length) || o.cover.pieces.length > 0)}${saved.own!.length > 1 ? `<button class="small warn" data-drop="${i}">${shelfArmed === `drop${i}` ? 'Tap again to throw it away' : 'Throw away'}</button>` : ''}</div>`).join('')}
    <button data-new="1" class="new">＋ A new book</button></div>`;
  cover.hidden = false;
}
function openBook(): void {
  visiting = null;
  // Every book is taken off the shelf shut, with its cover up.
  at = -1;
  selected = -1;
  pending = null;
  lifts = [];
  cover.hidden = true;
  open = 1;
  rebuild();
  draw();
}
cover.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('button');
  if (!b) return;
  // Emptying a book, or throwing one away, takes two taps.
  const risky = b.dataset.clear !== undefined ? b.dataset.clear : b.dataset.drop !== undefined ? `drop${b.dataset.drop}` : null;
  if (risky !== null && shelfArmed !== risky) {
    shelfArmed = risky;
    showShelf();
    setTimeout(() => {
      if (shelfArmed === risky) {
        shelfArmed = '';
        if (!cover.hidden) showShelf();
      }
    }, 3000);
    return;
  }
  shelfArmed = '';
  if (b.dataset.clear?.startsWith('s:')) {
    const st = STORIES.find((q) => q.id === b.dataset.clear!.slice(2))!;
    saved.tales![st.id] = { spreads: st.pages.map(blank), cover: blank(), reached: 0 };
  } else if (b.dataset.clear !== undefined) {
    const o = saved.own![Number(b.dataset.clear)];
    o.spreads = [blank()];
    o.cover = blank();
  } else if (b.dataset.drop !== undefined) {
    saved.own!.splice(Number(b.dataset.drop), 1);
    ownAt = 0;
  } else if (b.dataset.new) {
    saved.own!.push({ title: 'My Pop-up Book', cover: blank(), spreads: [blank()] });
    ownAt = saved.own!.length - 1;
    mode = 'free';
    keep();
    return openBook();
  } else if (b.dataset.go !== undefined) {
    if (b.dataset.go.startsWith('s:')) {
      mode = 'story';
      story = STORIES.find((q) => q.id === b.dataset.go!.slice(2)) ?? STORIES[0];
    } else {
      mode = 'free';
      ownAt = Number(b.dataset.go);
    }
    return openBook();
  } else return;
  keep();
  showShelf();
});
el('home').onclick = () => {
  window.location.href = '../../index.html#from-popup';
};

// ---- Every frame ----

function frame(): void {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  // Far enough back that the whole spread is in view, however narrow the screen.
  const dist = Math.max(46, 48 / camera.aspect);
  camera.position.set(Math.sin(azimuth) * Math.cos(elevation) * dist, Math.sin(elevation) * dist + 2, Math.cos(azimuth) * Math.cos(elevation) * dist);
  camera.lookAt(0, 2.2, 0);
  for (const l of lifts) l.now += ((open > 0.97 ? l.want : 0) - l.now) * 0.16;
  place();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---- Starting ----

const sent = /#b=([\w-]+)/.exec(window.location.hash);
const got = sent ? unpack(sent[1]) : null;
if (got?.length) {
  visiting = got;
  mode = 'free';
  cover.hidden = true;
} else showShelf();
rebuild();
draw();
frame();
// Painted pictures take the place of the drawn ones as they arrive.
loadPainted((id) => {
  const m = mats.get(id) as THREE.MeshLambertMaterial | undefined;
  if (m?.map) m.map.needsUpdate = true;
  draw();
});

(window as unknown as { popup: Record<string, unknown> }).popup = {
  check: checkFold,
  state: () => ({ mode, at, open, selected, reading, visiting: !!visiting, pieces: spread().pieces, faults, need: need(), reached: mode === 'story' ? tale().reached : 0, story: story.id }),
  add: (kind: Kind, art: string, props: Partial<Piece> = {}) => {
    spread().pieces.push({ ...fresh(kind, art), ...props });
    selected = -1;
    changed(true);
  },
  select: (i: number) => {
    selected = i;
    draw();
  },
  shut: (v: number) => {
    running++;
    open = v;
  },
  look: (a: number, e: number) => {
    azimuth = a;
    elevation = e;
  },
  lift: (i: number, v: number) => (lifts[i].want = v),
  link: () => pack(book()),
};
