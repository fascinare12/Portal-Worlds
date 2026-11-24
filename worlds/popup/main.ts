import * as THREE from 'three';
import './popup.css';
import { ART, canvasOf, pagePaper, urlOf } from './art';
import { L, STAND_CLEAR, W, checkFold, fits, fresh, heightOf, problems, quads, stands, tilt } from './fold';
import type { Kind, Piece, Spread } from './fold';
import { sheets } from './print';
import { PIGS } from './story';

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
  return { pigs: PIGS.pages.map(blank), reached: 0, free: [blank()] };
}
const saved = load();
while (saved.pigs.length < PIGS.pages.length) saved.pigs.push(blank());
if (!saved.free.length) saved.free.push(blank());

/** A book as a string short enough to go in a link. */
// New kinds go on the end: a link holds each kind as its place in this list.
const KINDS: Kind[] = ['vfold', 'tent', 'platform', 'flap', 'sticker', 'stand'];
const TRAY: Kind[] = ['vfold', 'stand', 'tent', 'platform', 'flap', 'sticker'];
const r2 = (v: number) => Math.round(v * 100) / 100;
const pack = (spreads: Spread[]) => btoa(JSON.stringify(spreads.map((s) => s.pieces.map((p) => [KINDS.indexOf(p.kind), p.art, r2(p.x), r2(p.z), r2(p.w), r2(p.h), r2(p.angle), r2(p.reach), p.flip ? 1 : 0])))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function unpack(text: string): Spread[] | null {
  try {
    const rows = JSON.parse(atob(text.replace(/-/g, '+').replace(/_/g, '/'))) as (number | string)[][][];
    const num = (v: unknown, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number(v) || 0));
    return rows.slice(0, 24).map((row) => ({
      pieces: row.slice(0, 40).map((a) => ({ kind: KINDS[Number(a[0])] ?? 'sticker', art: ART[String(a[1])] ? String(a[1]) : 'plain', x: num(a[2], -W, W), z: num(a[3], -L, L), w: num(a[4], 0.5, 20), h: num(a[5], 0.5, 20), angle: num(a[6], 30, 70), reach: num(a[7], 1, W), flip: !!a[8] })),
    }));
  } catch {
    return null;
  }
}

type Mode = 'pigs' | 'free';
let mode: Mode = 'pigs';
let at = 0;
/** A book that came in a link is looked at without touching what is kept, until it is kept on purpose. */
let visiting: Spread[] | null = null;
const book = (): Spread[] => visiting ?? (mode === 'pigs' ? saved.pigs : saved.free);
const spread = (): Spread => book()[at] ?? book()[0];
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
  return { side, half };
});

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
      const mesh = new THREE.Mesh(g, q.art ? matOf(piece.art) : plain);
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
  while (lifts.length < made.length) lifts.push({ now: 0, want: 0 });
  lifts.length = made.length;
  faults = problems(spread());
}

/** Puts every piece where it is at this moment: the book this far open, each flap this far lifted. */
function place(): void {
  const alpha = tilt(open);
  for (const { side, half } of halves) half.rotation.z = side * alpha;
  const inHand = spread().pieces[selected];
  shade.visible = open > 0.9;
  guide.visible = !!inHand && (inHand.kind === 'vfold' || inHand.kind === 'platform') && open > 0.97;
  spread().pieces.forEach((piece, i) => {
    const m = made[i];
    if (!m) return;
    const qs = quads(piece, open, lifts[i]?.now ?? 0);
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
    m.edge.visible = bad || i === selected;
    (m.edge.material as THREE.LineBasicMaterial).color.set(bad ? 0xd9342b : 0x2f7fd0);
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
const side = el('side');
const banner = el('banner');
const cover = el('cover');

const ICONS: Record<Kind, string> = {
  vfold: '<path d="M6 30 20 12 34 30" fill="#f4ead6" stroke="#5a4632" stroke-width="2" stroke-linejoin="round"/><path d="M20 12V4" stroke="#5a4632" stroke-width="2" stroke-dasharray="3 2"/><path d="M2 34h36" stroke="#5a4632" stroke-width="2"/>',
  tent: '<path d="M6 32 20 8 34 32" fill="none" stroke="#5a4632" stroke-width="2.4" stroke-linejoin="round"/><path d="M2 32h36" stroke="#5a4632" stroke-width="2"/><path d="M20 32v4" stroke="#5a4632" stroke-width="2" stroke-dasharray="2 2"/>',
  platform: '<path d="M6 14h28M8 14v18M32 14v18M20 14v18" fill="none" stroke="#5a4632" stroke-width="2.4"/><path d="M2 32h36" stroke="#5a4632" stroke-width="2"/>',
  flap: '<rect x="8" y="16" width="24" height="16" fill="none" stroke="#5a4632" stroke-width="2" stroke-dasharray="3 2"/><path d="M8 16 14 4h24l-6 12Z" fill="#f4ead6" stroke="#5a4632" stroke-width="2" stroke-linejoin="round"/>',
  sticker: '<rect x="8" y="8" width="24" height="24" rx="4" fill="#f4ead6" stroke="#5a4632" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="#e58f9c"/>',
  stand: '<path d="M2 34h36" stroke="#5a4632" stroke-width="2"/><path d="M10 34v4" stroke="#5a4632" stroke-width="2" stroke-dasharray="2 2"/><rect x="20" y="8" width="14" height="26" fill="#f4ead6" stroke="#5a4632" stroke-width="2"/><path d="M10 34h10v-5Z" fill="#f4ead6" stroke="#5a4632" stroke-width="1.6" stroke-linejoin="round"/>',
};
const KIND_NAME: Record<Kind, string> = { stand: 'Stand-up', vfold: 'V-fold', tent: 'Tent', platform: 'Platform', flap: 'Flap', sticker: 'Sticker' };
const KIND_SAYS: Record<Kind, string> = {
  vfold: 'Creased down the middle and glued to both pages in a V. It stands up when the book opens.',
  tent: 'A strip glued to both pages, with a ridge over the spine.',
  platform: 'A flat top that floats level above the pages.',
  flap: 'Lies flat on one page. Tap it to lift it and see what is under it.',
  sticker: 'A picture glued flat on a page.',
  stand: 'Stands on one page, facing you, anywhere out from the middle. A small brace across the fold pulls it up.',
};
const SLIDERS: Record<Kind, [keyof Piece, string, number, number][]> = {
  vfold: [['h', 'How tall', 2, 13], ['w', 'How wide', 1.5, 9], ['angle', 'How open the V', 30, 70]],
  tent: [['h', 'How tall', 0.5, 9], ['reach', 'How far apart', 1.5, 10], ['w', 'How long', 2, 18]],
  platform: [['h', 'How high', 1, 8], ['reach', 'How wide', 1.5, 10], ['w', 'How long', 2, 18]],
  flap: [['w', 'How wide', 1.5, 12], ['h', 'How tall', 1.5, 12]],
  sticker: [['w', 'How wide', 1, 12], ['h', 'How tall', 1, 12]],
  stand: [['h', 'How tall', 2, 13], ['w', 'How wide', 1.5, 10]],
};

/** What the story asks of this spread, and whether it has it yet. */
function need(): { ok: boolean; hint: string } {
  if (mode !== 'pigs' || visiting) return { ok: true, hint: '' };
  if (faults.some(Boolean)) return { ok: false, hint: 'Something is edged in red. Tap it to see what is wrong.' };
  const hint = PIGS.pages[at].check(spread());
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
  else faults = problems(spread());
  keep();
  draw();
}

function draw(): void {
  const pieces = spread().pieces;
  const story = mode === 'pigs' && !visiting;
  const state = need();
  const last = at === book().length - 1;
  if (story) {
    const page = PIGS.pages[at];
    banner.innerHTML = `<p class="line">${page.line}</p><p class="need ${state.ok ? 'met' : ''}"><b>${state.ok ? '✓' : '✎'}</b> ${page.need}</p>${state.ok ? '' : `<p class="hint">${state.hint}</p>`}`;
  } else banner.innerHTML = visiting ? '<p class="need">A book someone sent you.</p>' : '';
  banner.hidden = !banner.innerHTML;
  if (story && state.ok && at === saved.reached && at < PIGS.pages.length - 1) {
    saved.reached = at + 1;
    keep();
  }
  const canNext = story ? at < saved.reached || (last && state.ok) : true;
  const sel = pieces[selected];
  const fault = selected >= 0 ? faults[selected] : faults.find(Boolean) ? 'Something is edged in red. Tap it to see what is wrong.' : null;
  side.innerHTML = `
    <div class="nav"><button data-do="prev"${at === 0 ? ' disabled' : ''} aria-label="The page before">◀</button><span>Spread ${at + 1} of ${book().length}</span>
      <button data-do="next" class="${story && state.ok ? 'go' : ''}"${canNext ? '' : ' disabled'}>${story && last ? 'The end ▶' : !story && last ? '＋ page' : '▶'}</button></div>
    ${fault ? `<p class="fault">${fault}</p>` : ''}
    ${
      sel
        ? `<div class="edit"><h3>${KIND_NAME[sel.kind]}${stands(sel) ? ` <small>${heightOf(sel).toFixed(1)} cm tall</small>` : ''}</h3>
          <div class="arts">${Object.entries(ART).map(([id, a]) => `<button data-do="art" data-v="${id}" class="${sel.art === id ? 'on' : ''}" style="background-image:url(${urlOf(id)})" aria-label="${a.name}"></button>`).join('')}</div>
          ${SLIDERS[sel.kind].map(([key, name, lo, hi]) => `<label>${name}<input type="range" data-key="${key}" min="${lo}" max="${hi}" step="0.25" value="${sel[key]}"></label>`).join('')}
          <p class="tip">${sel.kind === 'vfold' || sel.kind === 'platform' ? `A ${KIND_NAME[sel.kind].toLowerCase()} sits on the fold in the middle of the book. Drag it, or tap the page, to slide it along the blue line.` : sel.kind === 'flap' ? 'Tap the flap again to lift it or let it down. Drag it, or tap the page, to move it.' : 'Drag it, or tap the page, to move it.'}</p>
          ${sel.kind === 'flap' ? `<p class="say">${under(sel)}</p>` : ''}
          <div class="row">${sel.kind === 'flap' ? `<button data-do="lift" class="go">${lifts[selected]?.want ? 'Let it down' : 'Lift it up'}</button>` : ''}${sel.kind === 'vfold' ? '<button data-do="flip">Turn it round</button>' : sel.kind === 'stand' ? '<button data-do="flip">Brace on the other side</button>' : ''}<button data-do="copy">Another like it</button><button data-do="delete" class="warn">Take it off</button><button data-do="done">Done</button></div></div>`
        : pending
          ? pending.art === null
            ? `<div class="edit"><h3>${KIND_NAME[pending.kind]}: of what?</h3><p class="tip">${KIND_SAYS[pending.kind]}</p>
              <div class="arts big">${Object.entries(ART).map(([id, a]) => `<button data-do="choose" data-v="${id}" style="background-image:url(${urlOf(id)})" aria-label="${a.name}"></button>`).join('')}</div>
              <div class="row"><button data-do="cancel">Back</button></div></div>`
            : `<div class="edit"><h3>Now tap the page</h3><div class="chosen" style="background-image:url(${urlOf(pending.art)})"></div>
              <p class="say">${pending.kind === 'vfold' || pending.kind === 'platform' ? `Tap where you want it. A ${KIND_NAME[pending.kind].toLowerCase()} sits on the fold in the middle, so it will go to the nearest place on the line.` : 'Tap where you want it to go.'}</p>
              <div class="row"><button data-do="repick">A different picture</button><button data-do="cancel">Never mind</button></div></div>`
          : `<h3 class="ask">Add something</h3><div class="tray">${TRAY.map((k) => `<button data-do="add" data-v="${k}"><svg viewBox="0 0 40 40">${ICONS[k]}</svg><b>${KIND_NAME[k]}</b><small>${KIND_SAYS[k]}</small></button>`).join('')}</div>
          <div class="row menu">${pieces.some((q) => q.kind === 'flap') ? `<button data-do="flaps">${lifts.some((l, i) => pieces[i]?.kind === 'flap' && l.want) ? 'Shut the flaps' : 'Lift the flaps'}</button>` : ''}<button data-do="read">▶ Read the book</button><button data-do="print">Print it</button>${visiting ? '<button data-do="mine">Keep it as mine</button>' : mode === 'free' ? '<button data-do="link">Copy a link</button>' : ''}${mode === 'free' && !visiting && book().length > 1 ? '<button data-do="unpage" class="warn">Tear out this page</button>' : ''}<button data-do="cover">Front cover</button></div>
          <p class="tip">Tap a piece on the page to change it. Drag it to move it. Drag the table to look round. Slide the book shut to see how it folds.</p>`
    }`;
}

side.addEventListener('input', (e) => {
  const input = e.target as HTMLInputElement;
  const piece = spread().pieces[selected];
  if (!piece || !input.dataset.key) return;
  (piece as unknown as Record<string, number>)[input.dataset.key] = Number(input.value);
  if (piece.kind === 'stand') moveTo(piece, piece.x, piece.z);
  faults = problems(spread());
  keep();
  // The panel is not drawn again while a slider is held, or the slider would be torn from under the finger.
  const small = side.querySelector('h3 small');
  if (small) small.textContent = `${heightOf(piece).toFixed(1)} cm tall`;
  const fault = side.querySelector('.fault');
  if (fault) fault.textContent = faults[selected] ?? '';
  const say = side.querySelector('.edit .say');
  if (say && piece.kind === 'flap') say.textContent = under(piece);
});
side.addEventListener('change', () => draw());

let armed = '';
/** A piece being chosen, before it is on the page: first its kind, then what is on it, then where. */
let pending: { kind: Kind; art: string | null } | null = null;
side.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-do]');
  if (!b || b.hasAttribute('disabled')) return;
  const pieces = spread().pieces;
  const what = b.dataset.do!;
  const v = b.dataset.v ?? '';
  if (what === 'add') {
    pending = { kind: v as Kind, art: null };
    draw();
  } else if (what === 'choose') {
    if (pending) pending.art = v;
    draw();
  } else if (what === 'repick') {
    if (pending) pending.art = null;
    draw();
  } else if (what === 'cancel') {
    pending = null;
    draw();
  } else if (what === 'art') {
    pieces[selected].art = v;
    changed(true);
  } else if (what === 'lift') {
    lifts[selected].want = lifts[selected].want ? 0 : 2.3;
    draw();
  } else if (what === 'flaps') {
    const up = lifts.some((l, i) => pieces[i]?.kind === 'flap' && l.want);
    lifts.forEach((l, i) => (l.want = pieces[i]?.kind === 'flap' && !up ? 2.3 : 0));
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
  else if (what === 'next') {
    if (at < book().length - 1) void turnTo(at + 1);
    else if (mode === 'pigs' && !visiting) void read();
    else if (!visiting) {
      saved.free.push(blank());
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
    saved.free.splice(at, 1);
    keep();
    void turnTo(Math.max(0, at - 1));
  } else if (what === 'read') void read();
  else if (what === 'print') print();
  else if (what === 'link') {
    const url = `${location.origin}${location.pathname}#b=${pack(book())}`;
    const say = (t: string) => (b.textContent = t);
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => say('Copied. Paste it to send it'), () => window.prompt('Copy this link:', url));
    else window.prompt('Copy this link:', url);
  } else if (what === 'mine') {
    if (armed !== 'mine') {
      armed = 'mine';
      b.textContent = 'This replaces your own book. Tap again';
      setTimeout(() => (armed = ''), 3000);
      return;
    }
    saved.free = visiting!;
    visiting = null;
    history.replaceState(null, '', location.pathname);
    keep();
    draw();
  } else if (what === 'cover') showCover();
});

slider.addEventListener('input', () => {
  running++;
  open = Number(slider.value) / 100;
});

// ---- Touching the book ----

const ray = new THREE.Raycaster();
const flat = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
/** `was`: it was already the piece in hand when touched, so a tap means more than choosing it. */
let drag: { index: number; x: number; z: number; px: number; pz: number; moved: boolean; was: boolean } | null = null;
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
  const lying = piece.kind === 'flap' || piece.kind === 'sticker';
  const zMost = L / 2 - (lying ? piece.h / 2 : 0);
  piece.z = snap(Math.max(-zMost, Math.min(zMost, z)));
  // Only what is glued to one page, or a tent, can go across: a V-fold and a platform sit on the spine.
  if (piece.kind === 'tent') piece.x = snap(Math.max(-piece.reach + 0.5, Math.min(piece.reach - 0.5, x)));
  else if (piece.kind === 'stand') {
    // Either page, but clear of the fold in the middle, where its brace goes.
    const least = piece.w / 2 + STAND_CLEAR;
    const side = Math.abs(x) < 0.5 ? Math.sign(piece.x) || 1 : Math.sign(x);
    piece.x = side * snap(Math.max(least, Math.min(W - piece.w / 2, Math.abs(x))));
  } else if (lying) {
    const side = Math.abs(x) < 0.3 ? Math.sign(piece.x) || 1 : Math.sign(x);
    piece.x = side * snap(Math.max(piece.w / 2 + 0.3, Math.min(W - piece.w / 2, Math.abs(x))));
  }
}
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  downAt = { x: e.clientX, y: e.clientY };
  aim(e);
  const hit = reading ? null : ray.intersectObjects(made.flatMap((m) => m.meshes))[0];
  if (hit) {
    const index = hit.object.userData.index as number;
    const piece = spread().pieces[index];
    const p = new THREE.Vector3();
    ray.ray.intersectPlane(flat, p);
    drag = { index, x: piece.x, z: piece.z, px: p.x, pz: p.z, moved: false, was: selected === index && !pending };
    if (selected !== index || pending) {
      pending = null;
      selected = index;
      draw();
    }
  } else look = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointermove', (e) => {
  if (drag && open > 0.97) {
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6 && !drag.moved) return;
    drag.moved = true;
    aim(e);
    const p = new THREE.Vector3();
    if (!ray.ray.intersectPlane(flat, p)) return;
    moveTo(spread().pieces[drag.index], drag.x + p.x - drag.px, drag.z + p.z - drag.pz);
    faults = problems(spread());
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
    if (!drag.moved && piece?.kind === 'flap' && open > 0.97 && drag.was) {
      lifts[drag.index].want = lifts[drag.index].want ? 0 : 2.3;
      draw();
    }
    if (drag.moved) changed();
  } else if (look && Math.hypot(downAt.x - look.x, downAt.y - look.y) < 6 && pending?.art && open > 0.97 && !reading) {
    // The piece that was chosen goes where the page is tapped.
    aim({ clientX: downAt.x, clientY: downAt.y });
    const p = new THREE.Vector3();
    if (ray.ray.intersectPlane(flat, p) && Math.abs(p.x) <= W + 1 && Math.abs(p.z) <= L / 2 + 1) {
      const piece = fresh(pending.kind, pending.art);
      if (!stands(piece) || piece.kind === 'stand') piece.x = p.x < 0 ? -Math.abs(piece.x) : Math.abs(piece.x);
      moveTo(piece, p.x, p.z);
      // A new piece should work where it lands: if it would not shut there, it is turned, or slid towards the middle of the page.
      if (stands(piece) && fits(piece)) {
        if (piece.kind === 'vfold') {
          piece.flip = !piece.flip;
          if (fits(piece)) piece.flip = !piece.flip;
        }
        while (fits(piece) && Math.abs(piece.z) > 0.2) piece.z -= Math.sign(piece.z) * 0.25;
      }
      spread().pieces.push(piece);
      selected = spread().pieces.length - 1;
      pending = null;
      changed(true);
      // A new piece shows what it does: the book half shuts and opens again.
      if (stands(piece)) void swing(0.45, 0.6).then((ok) => ok && swing(1, 0.7));
    }
  } else if (look && Math.hypot(downAt.x - look.x, downAt.y - look.y) < 6 && selected >= 0 && open > 0.97 && !reading) {
    // A tap on the page puts the piece in hand there.
    aim({ clientX: downAt.x, clientY: downAt.y });
    const p = new THREE.Vector3();
    if (ray.ray.intersectPlane(flat, p) && Math.abs(p.x) <= W + 1 && Math.abs(p.z) <= L / 2 + 1) {
      moveTo(spread().pieces[selected], p.x, p.z);
      changed();
    }
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
  const story = mode === 'pigs' && !visiting;
  const token = () => reading;
  for (let i = 0; i < book().length && token(); i++) {
    await swing(0, 0.6);
    if (!token()) break;
    at = i;
    lifts = [];
    rebuild();
    caption.innerHTML = story ? `<p>${PIGS.pages[i].line}</p>` : '';
    await swing(1, 2.6);
    if (!token()) break;
    await pause(0.9);
    for (const [k, p] of spread().pieces.entries()) if (p.kind === 'flap' && token()) lifts[k].want = 2.3;
    await pause(story ? 3.4 : 2.2);
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

function print(): void {
  const story = mode === 'pigs' && !visiting;
  el('print').innerHTML = sheets(story ? PIGS.title : 'My pop-up book', book(), story ? PIGS.pages.map((p) => p.line) : []);
  window.print();
}

// ---- The front cover ----

function showCover(): void {
  const started = saved.pigs.some((s) => s.pieces.length);
  cover.innerHTML = `<div class="card"><h1>The Pop-up Book</h1><p>Build a book that stands up when it opens. Then print it, cut it out, and make the real one.</p>
    <button data-go="pigs"><b>${PIGS.title}</b><small>${started ? 'Carry on with the story' : 'A story to build, a page at a time'}</small></button>
    <button data-go="free"><b>My own book</b><small>Empty pages, and everything in the tray</small></button></div>`;
  cover.hidden = false;
}
cover.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-go]');
  if (!b) return;
  mode = b.dataset.go as Mode;
  visiting = null;
  at = mode === 'pigs' ? Math.min(saved.reached, PIGS.pages.length - 1) : 0;
  selected = -1;
  lifts = [];
  cover.hidden = true;
  open = 0;
  rebuild();
  draw();
  void swing(1, 1.2);
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
} else showCover();
rebuild();
draw();
frame();

(window as unknown as { popup: Record<string, unknown> }).popup = {
  check: checkFold,
  state: () => ({ mode, at, open, selected, reading, visiting: !!visiting, pieces: spread().pieces, faults, need: need(), reached: saved.reached }),
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
