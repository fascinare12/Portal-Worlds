import './spire.css';
import { NAMES, SKINS, draw, esc, row, sing as singRow } from './draw';
import type { Skin } from './draw';
import { READINGS, asRow, checkReadings, fits, makeMirror } from './readings';
import type { MirrorPuzzle, Reading, Triple } from './readings';
import { Voices } from './sound';
import { seeded } from './system';

/**
 * Mirrors: the second step of the book's argument, as something to do.
 *
 * The chamber is Hofstadter's pq-system (Gödel, Escher, Bach, chapter II).
 * She makes rows of hyphens, p's and q's from the axioms and the one rule,
 * and is asked which rows can be made. Nothing is said about what the marks
 * mean. Then she presses ◉ and tries four ways of reading them. Two fit every
 * row; one fits a row or two and then fails; one is nonsense. Last, she is
 * asked whether a row that would be *true* under her reading can be *made*.
 *
 * Practice (mirror.html?practice) asks for the same move again and again:
 * here are some rows a system makes; what could they be about? Either pick
 * the reading that fits them all, or pick the row that also belongs.
 *
 * For development: ?fresh forgets what is kept; ?reading=mul pins a reading;
 * window.spire.check() tests every reading.
 */

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const params = new URLSearchParams(window.location.search);
const practising = params.has('practice');
const page = $('page');
const sound = new Voices();
const sing = (r: string) => singRow(sound, r);

const KEY = 'portal-worlds-spire-mirror-v1';
interface Kept {
  chapter: boolean;
  practice: Record<string, { seen: number; right: number }>;
  streak: number;
}
let kept: Kept = { chapter: false, practice: {}, streak: 0 };
try {
  const saved = JSON.parse((!params.has('fresh') && localStorage.getItem(KEY)) || 'null');
  if (saved) kept = { ...kept, ...saved };
} catch {
  // nothing kept
}
const keep = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(kept));
  } catch {
    // private browsing
  }
};

// ---- The chamber: the pq-system ----

const parse = (r: string): Triple | null => {
  const m = /^(-+)p(-+)q(-+)$/.exec(r);
  return m ? [m[1].length, m[2].length, m[3].length] : null;
};
const theorem = (r: string) => {
  const t = parse(r);
  return !!t && t[0] + t[1] === t[2];
};
const BUILD = ['--p--q----', '-p---q----', '---p--q-----'];
const ASK: [string, boolean][] = [
  ['--p---q-----', true],
  ['--p--q-----', false],
  ['-p-q--', true],
  ['---p-q---', false],
];
const READ: { id: string; p: string; q: string; say: (t: Triple) => string; holds: (t: Triple) => boolean | null }[] = [
  { id: 'plus', p: 'plus', q: 'equals', say: ([x, y, z]) => `${x} plus ${y} equals ${z}`, holds: ([x, y, z]) => x + y === z },
  { id: 'times', p: 'times', q: 'equals', say: ([x, y, z]) => `${x} times ${y} equals ${z}`, holds: ([x, y, z]) => x * y === z },
  { id: 'horse', p: 'horse', q: 'happy', say: ([x, y, z]) => `${'apple '.repeat(x)}horse ${'apple '.repeat(y)}happy ${'apple '.repeat(z)}`.trim(), holds: () => null },
  { id: 'from', p: 'equals', q: 'taken from', say: ([x, y, z]) => `${x} equals ${y} taken from ${z}`, holds: ([x, y, z]) => x === z - y },
];
const TWICE = '--p--p--q------';

let now = '';
let made: string[] = [];
let step = 0; // 0..2 building, 3..6 asking, 7 ready to read
let lastAnswer: { right: boolean; say: string } | null = null;
let above = false;
let reading = '';
const tried = new Set<string>();
let passive: '' | 'yes' | 'no' = '';

function note(next: string): void {
  now = next;
  sing(now);
  if (theorem(now) && !made.includes(now)) made.push(now);
  if (step < BUILD.length && now === BUILD[step]) {
    step++;
    sound.chime();
  }
  render();
}

function builder(): string {
  const axioms = [1, 2, 3, 4].map((x) => `<button class="ruleb" data-axiom="${x}">${row(`${'-'.repeat(x)}p-q${'-'.repeat(x)}-`, 'letters', 'small')}</button>`).join('');
  const t = parse(now);
  return (
    `<div class="label">You have</div>${row(now, 'letters')}` +
    `<div class="label">Start from one of these (there is one for every number of hyphens; here are four)</div><div class="rules" style="grid-template-columns:1fr 1fr">${axioms}</div>` +
    `<div class="label">The one rule</div><div class="rules"><button class="ruleb" data-do="grow"${t ? '' : ' disabled'}><span class="n">+</span><span>Add one hyphen <b>in the middle</b> and one <b>at the end</b>.</span></button></div>`
  );
}

function chamber(): string {
  const head = `<div class="kicker">Chapter II · Meaning and Form in Mathematics</div><h1>Mirrors</h1>`;
  if (!above) {
    let task = '';
    if (step < BUILD.length) {
      task = `<p>Three marks: a hyphen, a <b>p</b> and a <b>q</b>. They mean nothing. There are rows you may start from, and one rule. Make this row (${step + 1} of ${BUILD.length}):</p>${row(BUILD[step], 'letters')}`;
    } else if (step < BUILD.length + ASK.length) {
      const [r] = ASK[step - BUILD.length];
      task =
        `<p>Now decide. <b>Can this row be made?</b> Build it if you want to, or just look.</p>${row(r, 'letters')}` +
        `<div class="bar"><button class="chip" data-say="yes">It can be made</button><button class="chip" data-say="no">It cannot</button></div>` +
        (lastAnswer ? `<p class="${lastAnswer.right ? 'good' : 'bad'}">${lastAnswer.say}</p>` : '');
    } else {
      task = `${lastAnswer ? `<p class="${lastAnswer.right ? 'good' : 'bad'}">${lastAnswer.say}</p>` : ''}<p><b>At some point you probably stopped building and started counting.</b> Nobody told you the marks were about anything. Press <b>◉</b> and try reading them.</p>`;
    }
    return `${head}<div class="card">${task}</div><div class="card">${builder()}</div><div class="label">Rows you have made</div><div class="trail">${[...made].reverse().map((r) => row(r, 'letters', 'small')).join('') || '<span class="nothing">none yet</span>'}</div>`;
  }
  // From outside: the same rows, read four ways.
  const rows = [...new Set([...made, ...ASK.filter(([, yes]) => yes).map(([r]) => r)])].slice(0, 6);
  const r = READ.find((x) => x.id === reading);
  const table = r
    ? rows
        .map((s) => {
          const t = parse(s)!;
          const ok = r.holds(t);
          return `<tr><td>${row(s, 'letters', 'small')}</td><td style="text-align:left">${esc(r.say(t))}</td><td>${ok === null ? '<span class="soft">?</span>' : ok ? '<span class="good">true</span>' : '<span class="bad">false</span>'}</td></tr>`;
        })
        .join('')
    : '';
  const verdict = !r
    ? ''
    : r.id === 'horse'
      ? 'Neither true nor false. You may read the marks any way you please; most ways tell you nothing.'
      : r.id === 'times'
        ? 'It fits a row or two and then breaks. A reading has to fit every row, not the first one you look at.'
        : 'Every row comes out true. The rows the system makes, and the true sentences of this kind, keep step exactly.';
  const all = tried.size === READ.length;
  let end = '';
  if (all) {
    end =
      `<div class="card"><p><b>Two different readings fit perfectly.</b> So the meaning is not in the marks. It is in the fit between what the system does and something else that behaves the same way; and more than one thing can.</p>` +
      `<p>One last question. Read <b>p</b> as "plus" and <b>q</b> as "equals". Then this row says "2 plus 2 plus 2 equals 6", which is true. <b>Can it be made?</b></p>${row(TWICE, 'letters')}` +
      `<div class="bar"><button class="chip" data-passive="yes">It can be made</button><button class="chip" data-passive="no">It cannot</button></div>` +
      (passive
        ? `<p class="${passive === 'no' ? 'good' : 'bad'}"><b>${passive === 'no' ? 'Right.' : 'No.'}</b> The system has never heard of your reading. It has its starting rows and its one rule, and none of them has two p's. A reading lets you understand what the system makes. It does not let you add to it.</p>`
        : '') +
      `</div>`;
    if (passive) end += `${bookCard()}<div class="bar"><a class="chip gold" href="./mirror.html?practice">Practise the move ▶</a><a class="chip pale" href="./index.html">Back to the map</a></div>`;
  }
  return (
    `${head}<p>The same rows, and four ways to read them. A hyphen-run is read as its count. Try each.</p>` +
    `<div class="card"><div class="reasons">${READ.map((x) => `<button data-read="${x.id}" style="${reading === x.id ? 'outline:3px solid #c9951c' : ''}">${tried.has(x.id) ? '✓ ' : ''}<b>p</b> means “${x.p}”, <b>q</b> means “${x.q}”${x.id === 'horse' ? ', a hyphen means “apple”' : ''}</button>`).join('')}</div>` +
    (r ? `<table class="tally" style="margin-top:10px">${table}</table><p class="soft">${verdict}</p>` : '') +
    `</div>${end}`
  );
}
function bookCard(): string {
  return `<div class="card book"><h3>In the book</h3>
    <ul class="terms">
      <li>This is the <b>pq-system</b>. A row with the right shape (hyphens, p, hyphens, q, hyphens) is a <b>well-formed string</b>; the rows you can make are its <b>theorems</b>.</li>
      <li>The starting rows are given by an <b>axiom schema</b>: a mould that turns out an axiom for every number of hyphens.</li>
      <li>A way of reading the marks is an <b>interpretation</b>. When the theorems and the true statements keep step exactly, that is an <b>isomorphism</b>, and the interpretation is <b>meaningful</b>. "Horse, apple, happy" is a <b>meaningless</b> one.</li>
      <li>You found the fit; you did not choose it. And it gave you no power over the system: its meaning is <b>passive</b>.</li>
    </ul>
    <p>Hofstadter's claim is that this is what meaning is, everywhere: a match noticed between two things that behave alike. It is the book's first answer to how marks that only follow rules can come to be about something, and the same question is asked today of the numbers inside a machine.</p></div>`;
}

// ---- Practice ----

let puzzle: MirrorPuzzle | null = null;
let skin: Skin = 'stones';
let answered = -1;
let lastId = '';
const stat = (r: Reading) => (kept.practice[r.id] ??= { seen: 0, right: 0 });
const rightsAt = (level: number) => READINGS.filter((r) => r.level === level).reduce((n, r) => n + stat(r).right, 0);
function nextPuzzle(): void {
  const top = rightsAt(1) < 3 ? 1 : rightsAt(2) < 3 ? 2 : 3;
  const open = READINGS.filter((r) => r.level <= top && r.id !== lastId);
  const least = Math.min(...open.map((r) => stat(r).right));
  const pool = open.filter((r) => stat(r).right <= least + 1);
  const truth = READINGS.find((r) => r.id === params.get('reading')) ?? pool[Math.floor(Math.random() * pool.length)];
  puzzle = makeMirror(truth, seeded(Math.floor(Math.random() * 1e9)));
  lastId = truth.id;
  skin = SKINS[(SKINS.indexOf(skin) + 1 + Math.floor(Math.random() * 2)) % 3];
  answered = -1;
  above = false;
  stat(truth).seen++;
  keep();
  render();
}
const rightChoice = (p: MirrorPuzzle) => (p.kind === 'read' ? p.options.findIndex((r) => r.id === p.truth.id) : p.rows.findIndex((t) => fits(p.truth, t)));
function legend(r: Reading, p: MirrorPuzzle): string {
  const mark = (s: string) => draw(s, skin).replace('class="sym"', 'class="sym" style="width:24px;height:24px;display:inline-flex;vertical-align:middle"');
  return `${mark(p.marks[1])} means “${r.first}”${r.second ? `, ${mark(p.marks[2])} means “${r.second}”` : ''}`;
}
function counts(t: Triple, runs: 2 | 3): string {
  return runs === 3 ? `${t[0]} · ${t[1]} · ${t[2]}` : `${t[0]} · ${t[1]}`;
}
function practice(): string {
  if (!puzzle) return '';
  const p = puzzle;
  const total = Object.values(kept.practice).reduce((n, f) => n + f.right, 0);
  const done = answered >= 0;
  const right = done && answered === rightChoice(p);
  const head = `<div class="kicker">Practice · what could it be about?</div><h1>Find the mirror</h1><p class="soft">${total} solved${kept.streak > 1 ? ` · ${kept.streak} in a row` : ''}. Some system makes the rows below, and only rows like them. Press <b>◉</b> to see them as counts.</p>`;
  // Each row, and under it (from outside, or once answered) its counts and what it says.
  const list = p.shown
    .map((t) => {
      const under = done ? `${counts(t, p.truth.runs)} · “${esc(p.truth.say(...t))}”` : above ? counts(t, p.truth.runs) : '';
      return `<div>${row(asRow(t, p.truth.runs, p.marks), skin, 'tiny')}${under ? `<div class="soft" style="font-size:14px;margin:1px 0 6px">${under}</div>` : ''}</div>`;
    })
    .join('');
  let ask = '';
  if (p.kind === 'read') {
    ask =
      `<p><b>Which reading makes every one of them true?</b></p><div class="reasons">` +
      p.options
        .map((r, i) => {
          const mine = done && i === answered;
          const fail = done ? p.shown.find((t) => !fits(r, t)) : undefined;
          const tail = done ? (r.id === p.truth.id ? ' <span class="good">· fits them all</span>' : fail ? ` <span class="bad">· fails: “${esc(r.say(...fail))}”</span>` : '') : '';
          return `<button data-pick="${i}"${done ? ' disabled' : ''} style="${mine ? 'outline:3px solid #2f3440' : ''}">${legend(r, p)}${tail}</button>`;
        })
        .join('') +
      `</div>`;
  } else {
    ask =
      `<p><b>Which of these is another row the same system makes?</b></p><div class="reasons">` +
      p.rows
        .map((t, i) => {
          const mine = done && i === answered;
          const tail = done ? ` <span class="${fits(p.truth, t) ? 'good' : 'bad'}">“${esc(p.truth.say(...t))}”</span>` : '';
          return `<button data-pick="${i}"${done ? ' disabled' : ''} style="${mine ? 'outline:3px solid #2f3440' : ''}">${row(asRow(t, p.truth.runs, p.marks), skin, 'tiny')}${tail ? `<div style="font-size:14px;margin-top:3px">${tail}</div>` : ''}</button>`;
        })
        .join('') +
      `</div>`;
  }
  const after = done
    ? `<p class="${right ? 'good' : 'bad'}"><b>${right ? 'Yes.' : 'Not that one.'}</b> ${p.kind === 'use' ? `The reading that fits: ${legend(p.truth, p)}.` : right ? '' : `The one that fits: ${legend(p.truth, p)}.`}</p><div class="bar"><button class="chip gold" data-do="next">Another ▶</button><a class="chip pale" href="./index.html">Back to the map</a></div>`
    : '';
  return `${head}<div class="card"><div class="label">Rows it makes</div><div style="display:grid;gap:7px">${list}</div></div><div class="card">${ask}${after}</div>`;
}

// ---- Drawing and hands ----

function render(): void {
  page.innerHTML = practising ? practice() : chamber();
  $('eye').classList.toggle('on', above);
  $('eye').classList.toggle('call', !practising && !above && step >= BUILD.length + ASK.length && !kept.chapter);
}
page.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-axiom],[data-do],[data-say],[data-read],[data-passive],[data-pick]');
  if (!el || el.hasAttribute('disabled')) return;
  sound.start();
  if (el.dataset.axiom) {
    const x = Number(el.dataset.axiom);
    note(`${'-'.repeat(x)}p-q${'-'.repeat(x)}-`);
  } else if (el.dataset.do === 'grow') {
    const t = parse(now);
    if (t && now.length < 30) note(`${'-'.repeat(t[0])}p${'-'.repeat(t[1] + 1)}q${'-'.repeat(t[2] + 1)}`);
  } else if (el.dataset.do === 'next') nextPuzzle();
  else if (el.dataset.say) {
    const [r, yes] = ASK[step - BUILD.length];
    const right = (el.dataset.say === 'yes') === yes;
    const t = parse(r)!;
    lastAnswer = {
      right,
      say: `${right ? 'Yes.' : 'No.'} ${yes ? `It can be made: start from the row with ${t[0]} ${t[0] === 1 ? 'hyphen' : 'hyphens'} in front, and use the rule ${t[1] - 1 === 0 ? 'not at all' : t[1] - 1 === 1 ? 'once' : `${t[1] - 1} times`}.` : 'It cannot be made. Try, and see where it goes wrong.'}`,
    };
    if (yes && !made.includes(r)) made.push(r);
    step++;
    if (right) sound.chime();
    render();
  } else if (el.dataset.read) {
    reading = el.dataset.read;
    tried.add(reading);
    render();
  } else if (el.dataset.passive) {
    passive = el.dataset.passive as 'yes' | 'no';
    if (!kept.chapter) {
      kept.chapter = true;
      keep();
    }
    if (passive === 'no') sound.chime();
    render();
  } else if (el.dataset.pick !== undefined && puzzle && answered < 0) {
    answered = Number(el.dataset.pick);
    const right = answered === rightChoice(puzzle);
    if (right) {
      stat(puzzle.truth).right++;
      kept.streak++;
      sound.chime();
    } else kept.streak = 0;
    keep();
    render();
  }
});
$('eye').onclick = () => {
  above = !above;
  render();
};
$('sound').onclick = () => {
  sound.start();
  sound.setOn(!sound.on);
  $('sound').style.opacity = sound.on ? '1' : '0.4';
};
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});
requestAnimationFrame(() => $('veil').classList.add('open'));

if (practising) nextPuzzle();
else render();

// For the test page.
(window as unknown as { spire: unknown }).spire = {
  check: () => checkReadings(),
  state: () => ({ now, step, made: made.length, above, tried: tried.size, passive, kept, kind: puzzle?.kind, truth: puzzle?.truth.id, right: puzzle ? rightChoice(puzzle) : -1, answered, names: NAMES[skin] }),
};
