import { ACT_MEANING, ACT_TITLE, PANELS } from './acts';
import type { Panel, Question } from './acts';
import { GROUND, SCENES, creature } from './scenes';
import { LINEN, Stitcher } from './stitch';
import type { Mode } from './stitch';

/**
 * The Tapestry: a long strip of linen, read from left to right, on which the
 * year 1066 is told in panels. The player is the scribe who finishes it.
 *
 * Each panel starts as an under-drawing. At the desk below she reads what
 * happened, then answers questions: each right answer stitches part of the
 * panel; a wrong one is stitched badly, unpicked, and a creature from the
 * border leans in with a hint. Some panels are told twice, by two sides who
 * disagreed, and both tellings have to be stitched before she may go on.
 */

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('cloth');
const g = canvas.getContext('2d')!;
const params = new URLSearchParams(window.location.search);

// ---- What is kept between visits, in this browser only ----

interface Kept {
  /** For each panel: how many questions of each telling are stitched, and whether it is finished. */
  parts: number[];
  weighed: boolean;
  done: boolean;
  /** Questions answered right at the first attempt, and questions answered at all. */
  first: number;
  asked: number;
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
      focus = Math.min(PANELS.length - 1, saved.focus ?? 0);
    }
  } catch {
    // nothing kept, or it cannot be read: begin on bare linen
  }
  for (const p of PANELS) if (!kept[p.id] || kept[p.id].parts.length !== p.tellings.length) kept[p.id] = blank(p);
  // For looking at the finished cloth while developing: ?all stitches everything, ?at=4 opens on that panel.
  if (params.has('all')) for (const p of PANELS) kept[p.id] = { parts: p.tellings.map((t) => t.questions.length), weighed: true, done: true, first: 0, asked: 0 };
  if (params.has('at')) focus = Math.min(PANELS.length - 1, Number(params.get('at')) || 0);
}
function keep(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ kept, focus }));
  } catch {
    // not allowed, or no room: the cloth is simply not remembered
  }
}
restore();
/** A panel can be worked on once the one before it is finished. */
const unlocked = (i: number) => i === 0 || kept[PANELS[i - 1].id].done;

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

interface Drawn {
  sketch: HTMLCanvasElement;
  full: HTMLCanvasElement;
  wrong?: HTMLCanvasElement;
}
const drawn = new Map<number, Drawn>();

/** Draws one whole panel, borders and all, in one of the three ways. */
function drawPanel(index: number, mode: Mode): HTMLCanvasElement {
  const p = PANELS[index];
  const c = document.createElement('canvas');
  c.width = Math.ceil(panelW * dpr);
  c.height = Math.ceil(stripH * dpr);
  const cg = c.getContext('2d')!;
  cg.scale(dpr, dpr);
  const K = new Stitcher(cg, mode);
  K.reseed(index + 1);
  const top = band / scale; // the borders, measured in scene units
  cg.save();
  cg.scale(scale, scale);
  // The top border: the Latin, between two ruled lines.
  K.line([[0, top - 6], [PW, top - 6]], 'terracotta', 2.6, false);
  K.line([[0, 7], [PW, 7]], 'navy', 2.2, false);
  K.words(p.caption, PW / 2, top * 0.52, Math.min(27, top * 0.42), 'center', PW - 60);
  // The scene itself, and over a panel told twice, who is speaking in each half.
  cg.save();
  cg.translate(0, top);
  const list = SCENES[p.id];
  list.forEach((scene, i) => {
    K.reseed(index * 7 + i + 3);
    scene(K, (i * PW) / list.length, PW / list.length);
    const banner = p.tellings[i].banner;
    if (banner) {
      K.words(banner, (i + 0.5) * (PW / list.length), 26, 19, 'center', PW / list.length - 40);
      if (i) K.line([[PW / 2, 6], [PW / 2, GROUND + 30]], 'rust', 2, false);
    }
  });
  cg.restore();
  // The bottom border: beasts between slanting bars.
  cg.save();
  cg.translate(0, top + PH);
  K.line([[0, 6], [PW, 6]], 'terracotta', 2.6, false);
  K.line([[0, top - 7], [PW, top - 7]], 'navy', 2.2, false);
  const beasts = 5;
  for (let i = 0; i < beasts; i++) {
    const cx = ((i + 0.5) / beasts) * PW;
    K.reseed(index * 31 + i);
    creature(K, index * 3 + i * 2, cx, top * 0.52, top * 0.62);
    K.line([[cx + PW / beasts / 2 - 14, top - 10], [cx + PW / beasts / 2 + 14, 9]], i % 2 ? 'teal' : 'ochre', 3, false);
  }
  cg.restore();
  cg.restore();
  return c;
}
function panelArt(index: number): Drawn {
  let d = drawn.get(index);
  if (!d) {
    // Only a few panels are kept drawn at once; the rest are redrawn when she comes back to them.
    for (const k of [...drawn.keys()]) if (Math.abs(k - index) > 2) drawn.delete(k);
    d = { sketch: drawPanel(index, 'sketch'), full: drawPanel(index, 'full') };
    drawn.set(index, d);
  }
  return d;
}

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
  scroll = home(focus);
}
window.addEventListener('resize', resize);
resize();

// ---- Stitching: how much of each telling shows, eased towards how much has been earned ----

const shown: number[][] = PANELS.map((p) => p.tellings.map((t, j) => kept[p.id].parts[j] / t.questions.length));
const earned = (i: number, j: number) => kept[PANELS[i].id].parts[j] / PANELS[i].tellings[j].questions.length;
/** A wrong answer, being shown and then unpicked: which panel and telling, and when it began. */
let botch: { panel: number; telling: number; at: number } | null = null;

function paint(now: number): void {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = LINEN;
  g.fillRect(0, 0, W, stripH);
  // The weave of the linen.
  g.fillStyle = 'rgba(120, 100, 70, 0.05)';
  for (let y = 0; y < stripH; y += 3) g.fillRect(0, y, W, 1);

  const first = Math.max(0, Math.floor(scroll / panelW));
  const last = Math.min(PANELS.length - 1, Math.floor((scroll + W) / panelW));
  for (let i = first; i <= last; i++) {
    const x = i * panelW - scroll;
    if (!unlocked(i)) {
      // Linen not yet reached: only the ruled lines of the borders, waiting.
      g.strokeStyle = 'rgba(110, 92, 70, 0.35)';
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
    g.drawImage(art.sketch, x, 0, panelW, stripH);
    const tellings = PANELS[i].tellings.length;
    const part = panelW / tellings;
    for (let j = 0; j < tellings; j++) {
      const want = earned(i, j);
      const moving = Math.abs(want - shown[i][j]) > 0.001;
      shown[i][j] += (want - shown[i][j]) * 0.045;
      if (!moving) shown[i][j] = want;
      const upTo = shown[i][j] * part;
      if (upTo > 0.5) {
        g.save();
        g.beginPath();
        g.rect(x + j * part, 0, upTo, stripH);
        g.clip();
        g.drawImage(art.full, x, 0, panelW, stripH);
        g.restore();
      }
      if (moving) needle(x + j * part + upTo, now);
      // A wrong answer: the next stretch is stitched in the wrong wools, shivers, and is pulled out again.
      if (botch && botch.panel === i && botch.telling === j) {
        const age = (now - botch.at) / 1000;
        if (age > 2) botch = null;
        else {
          art.wrong ??= drawPanel(i, 'wrong');
          const from = x + j * part + upTo;
          const wide = part / PANELS[i].tellings[j].questions.length;
          g.save();
          g.beginPath();
          g.rect(from, 0, wide * Math.min(1, age / 0.5), stripH);
          g.clip();
          g.globalAlpha = age < 1.3 ? 1 : Math.max(0, 1 - (age - 1.3) / 0.7);
          g.drawImage(art.wrong, x + Math.sin(now / 28) * 2.5, Math.cos(now / 23) * 1.5, panelW, stripH);
          g.restore();
        }
      }
    }
  }
}
/** The needle at the edge of what is stitched so far, bobbing, trailing its thread. */
function needle(x: number, now: number): void {
  const y = stripH / 2 + Math.sin(now / 70) * stripH * 0.3;
  g.strokeStyle = '#b0502c';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x - 22, y + 26, x - 6, y + 54);
  g.stroke();
  g.strokeStyle = '#3b302b';
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(x - 3, y + 4);
  g.lineTo(x + 13, y - 20);
  g.stroke();
}

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
const finished = () => [293.66, 349.23, 440, 587.33].forEach((f, i) => tone(f, i * 0.16, 1.6, 0.1));
const wrongSound = () => tone(98, 0, 0.35, 0.16, 'sine');
$('sound').onclick = () => {
  soundOn = !soundOn;
  $('sound').style.opacity = soundOn ? '1' : '0.4';
};

// ---- The desk ----

type View = 'locked' | 'choose' | 'read' | 'ask' | 'weigh' | 'done';
let view: View = 'read';
let telling = 0;
let hint = '';
let struck: string[] = []; // wrong answers already tried for the question on the desk
let firstGo = true;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/** The same question always lays its answers out in the same order, but not with the right one first. */
function shuffled(q: Question): string[] {
  let n = 0;
  for (const ch of q.ask) n = (n * 31 + ch.charCodeAt(0)) % 9973;
  const order = [[0, 1, 2], [1, 0, 2], [2, 1, 0], [1, 2, 0], [2, 0, 1], [0, 2, 1]][n % 6];
  return order.map((i) => q.answers[i]);
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
  $('where').innerHTML = `<b>${esc(p.title)}</b><span>${esc(p.date)}</span>`;
  $<HTMLButtonElement>('back').disabled = focus === 0;
  $<HTMLButtonElement>('next').disabled = focus === PANELS.length - 1;
  const t = p.tellings[telling];
  const head = `<p class="latin">${esc(p.caption)}</p><p class="means">${esc(p.meaning)}</p>`;
  const hintBox = hint ? `<div class="hint"><i>🐦</i><span>${esc(hint)}</span></div>` : '';
  const options = (q: Question) =>
    shuffled(q)
      .map((a) => `<button class="pick" data-answer="${esc(a)}" ${struck.includes(a) ? 'disabled' : ''}>${esc(a)}</button>`)
      .join('');
  let html = '';
  if (view === 'locked') {
    html = `<p>This stretch of linen is still bare. Finish the panel before it, and the under-drawing for this one will be marked out.</p><button class="go quiet" data-do="back">◀ Go back</button>`;
  } else if (view === 'choose') {
    html =
      head +
      `<p>This scene was told in more than one way, by people who did not agree. A scribe sets down each account as it was given. Stitch both, then weigh them.</p>` +
      p.tellings
        .map((tt, j) => `<button class="pick ${k.parts[j] >= tt.questions.length ? 'done' : ''}" data-telling="${j}">${esc(tt.voice ?? '')}</button>`)
        .join('');
  } else if (view === 'read') {
    html =
      (t.voice ? `<p class="voice">${esc(t.voice)}</p>` : head) +
      t.account.map((line) => `<p>${esc(line)}</p>`).join('') +
      `<p class="source">${esc(t.source)}</p><button class="go" data-do="begin">Take up the needle</button>`;
  } else if (view === 'ask') {
    const q = t.questions[k.parts[telling]];
    html =
      (t.voice ? `<p class="voice">${esc(t.voice)}</p>` : '') +
      `<div class="dots">${t.questions.map((_, i) => `<i class="${i < k.parts[telling] ? 'on' : ''}"></i>`).join('')}</div>` +
      `<p class="ask">${esc(q.ask)}</p>${options(q)}${hintBox}<button class="go quiet" data-do="reread">Read the account again</button>`;
  } else if (view === 'weigh') {
    html = `<p class="voice">Weighing the two</p><p class="ask">${esc(p.weigh!.ask)}</p>${options(p.weigh!)}${hintBox}`;
  } else {
    const all = PANELS.every((x) => kept[x.id].done);
    const first = PANELS.reduce((n, x) => n + kept[x.id].first, 0);
    const asked = PANELS.reduce((n, x) => n + kept[x.id].asked, 0);
    html =
      head +
      `<p>${esc(p.mattered)}</p>` +
      (focus < PANELS.length - 1
        ? `<button class="go" data-do="next">On to the next panel ▶</button>`
        : all
          ? `<p><b>${esc(ACT_TITLE)}</b> is stitched: ${esc(ACT_MEANING.charAt(0).toLowerCase() + ACT_MEANING.slice(1))}, from an empty throne to a new king. The linen to either side of it, before 1066 and after, is still bare.</p>`
          : '') +
      (asked ? `<p class="tally">Right at the first attempt: ${first} of ${asked} questions so far.</p>` : '') +
      p.tellings.map((tt, j) => `<button class="go quiet" data-reread="${j}">Read ${tt.voice ? esc(tt.voice.charAt(0).toLowerCase() + tt.voice.slice(1)) : 'the account'} again</button>`).join('');
  }
  const page = $('page');
  page.innerHTML = html;
  page.scrollTop = 0;
}
function answer(text: string): void {
  const p = PANELS[focus];
  const k = kept[p.id];
  const q = view === 'weigh' ? p.weigh! : p.tellings[telling].questions[k.parts[telling]];
  if (text !== q.answers[0]) {
    // Stitched wrong: it shows for a moment, comes out, and the creature offers a hint.
    struck.push(text);
    firstGo = false;
    hint = q.hint;
    if (view === 'ask') botch = { panel: focus, telling, at: performance.now() };
    wrongSound();
    render();
    return;
  }
  k.asked++;
  if (firstGo) k.first++;
  hint = '';
  struck = [];
  firstGo = true;
  if (view === 'weigh') k.weighed = true;
  else k.parts[telling]++;
  const complete = p.tellings.every((t, j) => k.parts[j] >= t.questions.length);
  if (complete && (!p.weigh || k.weighed)) {
    k.done = true;
    finished();
  } else right();
  keep();
  if (view === 'ask' && k.parts[telling] < p.tellings[telling].questions.length) render();
  else settle();
}
$('page').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.answer !== undefined) answer(d.answer);
  else if (d.telling !== undefined) {
    telling = Number(d.telling);
    const k = kept[PANELS[focus].id];
    view = k.parts[telling] >= PANELS[focus].tellings[telling].questions.length || k.parts[telling] === 0 ? 'read' : 'ask';
    if (k.parts[telling] >= PANELS[focus].tellings[telling].questions.length) reading = true;
    render();
  } else if (d.reread !== undefined) {
    telling = Number(d.reread);
    reading = true;
    view = 'read';
    render();
  } else if (d.do === 'begin') {
    // "Take up the needle" after re-reading something already stitched just goes back to where she was.
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
  } else if (d.do === 'next') go(focus + 1);
  else if (d.do === 'back') go(focus - 1);
});
/** She is reading an account again, not starting it. */
let reading = false;

// ---- Moving along the cloth ----

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
let dragging: { x: number; scroll: number } | null = null;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  dragging = { x: e.clientX, scroll };
});
canvas.addEventListener('pointermove', (e) => {
  if (dragging) scroll = dragging.scroll - (e.clientX - dragging.x);
});
const letGo = () => {
  if (!dragging) return;
  dragging = null;
  // Let go, and the cloth settles on whichever panel is nearest the middle.
  const nearest = Math.round((scroll + (W - panelW) / 2) / panelW);
  if (nearest !== focus) go(nearest);
};
canvas.addEventListener('pointerup', letGo);
canvas.addEventListener('pointercancel', letGo);
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    if (Math.abs(e.deltaX) + Math.abs(e.deltaY) > 30) go(focus + (e.deltaX + e.deltaY > 0 ? 1 : -1));
  },
  { passive: false },
);

// ---- Starting again, and going home ----

const veil = $('veil');
$('fresh').onclick = () => {
  if (!window.confirm('Unpick everything and start again on bare linen?')) return;
  for (const p of PANELS) kept[p.id] = blank(p);
  PANELS.forEach((p, i) => p.tellings.forEach((_, j) => (shown[i][j] = 0)));
  go(0);
};
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
