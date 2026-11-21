import './spire.css';
import { NAMES, SKINS, draw, esc, row, sing as singRow } from './draw';
import type { Skin } from './draw';
import { Voices } from './sound';
import { FAMILIES, MIU, makePuzzle, moves, reach, seeded, selfCheck } from './system';
import type { Family, Puzzle, Rule, System } from './system';

/**
 * Inside and outside: the first step of the book's argument, as something to do.
 *
 * The chamber is Hofstadter's MU-puzzle (Gödel, Escher, Bach, chapter I). She
 * works inside the MIU-system for as long as she likes, making rows. Then she
 * presses ◉, stops making rows, and looks at what the rules do to one number.
 * That settles the question that no amount of row-making could.
 *
 * Practice (rules.html?practice) asks for the same move over and over: a
 * small system she has never seen, a target, and "can you get there?". Either
 * she gets there, from inside; or she says it cannot be done and picks out
 * why, from outside. The systems come in families, each with one thing its
 * rules can never change, and each dressed three ways so that the move has to
 * be recognised and not remembered.
 *
 * For development: ?fresh forgets what is kept; ?family=threes pins a family;
 * window.spire.check() tests every family.
 */

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const params = new URLSearchParams(window.location.search);
const practising = params.has('practice');
const page = $('page');
const sound = new Voices();

// ---- What is kept ----

const KEY = 'portal-worlds-spire-rules-v1';
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

const sing = (r: string) => singRow(sound, r);
function ruleSays(rule: Rule, skin: Skin): string {
  if (rule.kind === 'double') return `<span>Keep the first one. <b>Double</b> everything after it.</span>`;
  const to = rule.to ? row(rule.to, skin, 'small') : '<span class="nothing">nothing</span>';
  return `${row(rule.from, skin, 'small')}<span class="to">→</span>${to}<span class="why">${rule.kind === 'end' ? 'only at the end' : 'anywhere'}</span>`;
}

// ---- One system being worked on ----

let sys: System = MIU;
let skin: Skin = 'letters';
let now = sys.start;
let trail: string[] = [now];
let choosing: { rule: number; at: number[] } | null = null;
let above = false;
let fresh = -1; // where the newest stones begin, to drop them in
let refused = -1;

function use(index: number): void {
  const options = moves(now, sys.rules[index], sys.cap);
  if (!options.length) {
    refused = index;
    choosing = null;
    render();
    return;
  }
  if (options.length === 1) return land(options[0].row, options[0].at);
  choosing = { rule: index, at: options.map((o) => o.at) };
  render();
}
function land(next: string, at: number): void {
  now = next;
  trail.push(now);
  choosing = null;
  fresh = at;
  sing(now);
  arrived();
  render();
}
function undo(): void {
  if (trail.length < 2) return;
  trail.pop();
  now = trail[trail.length - 1];
  choosing = null;
  render();
}
function restart(): void {
  now = sys.start;
  trail = [now];
  choosing = null;
  render();
}

function board(target: string | null): string {
  const stones = [...now].map((s, i) => draw(s, skin).replace('class="sym"', `class="sym${fresh >= 0 && i >= fresh ? ' new' : ''}"`)).join('');
  // When a rule fits in more than one place, each place is shown whole: the marks that would be replaced, ringed.
  let places = '';
  if (choosing) {
    const rule = sys.rules[choosing.rule];
    const span = rule.kind === 'rewrite' ? rule.from.length : 1;
    places =
      `<div class="label">It fits in ${choosing.at.length} places. The ringed marks are the ones that would be replaced. Choose one:</div><div class="reasons">` +
      choosing.at.map((at) => `<button data-at="${at}"><div class="row small">${[...now].map((s, i) => draw(s, skin).replace('class="sym"', `class="sym ${i >= at && i < at + span ? 'hit' : 'dim'}"`)).join('')}</div></button>`).join('') +
      `</div>`;
  }
  const rules = sys.rules
    .map((r, i) => `<button class="ruleb${refused === i ? ' no' : ''}${choosing?.rule === i ? ' sel' : ''}" data-rule="${i}"><span class="n">${i + 1}</span>${ruleSays(r, skin)}</button>`)
    .join('');
  return (
    (target !== null ? `<div class="label">Make this</div>${row(target, skin)}` : '') +
    `<div class="label">You have</div><div class="row" id="now">${stones || '<span class="nothing">nothing at all</span>'}</div>${places}` +
    `<div class="label">The rules</div><div class="rules">${rules}</div>` +
    `<div class="bar"><button class="chip pale" data-do="undo"${trail.length < 2 ? ' disabled' : ''}>↶ undo</button><button class="chip pale" data-do="restart"${trail.length < 2 ? ' disabled' : ''}>start again</button>${practising && !verdict ? '<button class="chip" data-do="cannot">It cannot be done</button>' : ''}<span class="soft" style="font-size:14px">${trail.length - 1} ${trail.length === 2 ? 'move' : 'moves'}</span></div>`
  );
}

// ---- The chamber: the MU-puzzle ----

const TARGET = 'MU';
const tried = new Set<string>();
const left = (r: string) => (r.split('I').length - 1) % 3;
const EFFECT = [
  ['adds a U', (n: number) => n, 'No I is added or taken, so nothing changes.'],
  ['doubles the row', (n: number) => (n * 2) % 3, ''],
  ['turns III into U', (n: number) => n, 'It takes away exactly three I\'s: one whole bundle. What is left over stays.'],
  ['drops UU', (n: number) => n, 'No I is touched.'],
] as const;

function chamber(): string {
  const made = new Set(trail).size;
  const head = `<div class="kicker">Chapter I · The MU-puzzle</div><h1>Inside and outside</h1>`;
  if (!above) {
    const nudge =
      trail.length > 12
        ? `<p><b>${made} different rows so far, and none of them is MU.</b> You can go on as long as you like; the rows never run out. Or press <b>◉</b>, stop making rows, and look at the rules themselves.</p>`
        : `<p>You start with <b>MI</b>. There are four rules, and you may use any of them, as often as you like, wherever it fits. Can you make <b>MU</b>?</p>`;
    return `${head}${nudge}<div class="card">${board(TARGET)}</div><div class="label">Every row you have made</div><div class="trail">${[...trail].reverse().slice(0, 30).map((r) => row(r, skin, 'small')).join('')}</div>`;
  }
  const here = left(now);
  const all = tried.size === 8;
  const grid = EFFECT.map(([what, f, why], r) =>
    [1, 2]
      .map((from) => {
        const k = `${r}:${from}`;
        const to = f(from);
        const note = r === 1 ? (from === 1 ? 'One doubled is two.' : 'Two doubled is four: one bundle of three, and 1 left over.') : why;
        return tried.has(k) ? `<button class="done" title="${esc(note)}">→ <b>${to}</b> left over</button>` : `<button data-try="${k}">try it</button>`;
      })
      .join(''),
  ).map((cells, r) => `<div><b>${r + 1}</b> · ${EFFECT[r][0]}</div>${cells}`);
  const last = [...tried].pop();
  const lastNote = last ? (() => { const [r, from] = last.split(':').map(Number); return r === 1 ? (from === 1 ? 'One doubled is two.' : 'Two doubled is four: one bundle of three, and 1 left over.') : EFFECT[r][2]; })() : '';
  return (
    `${head}<p>From out here you stop making rows. Take any row, count only its <b>I</b>'s, and tie them in bundles of three. All that matters is <b>how many are left over</b>.</p>` +
    `<div class="card"><div class="label">Your row now</div>${row(now, skin, 'small')}<div class="dial">${[0, 1, 2].map((n) => `<div class="${n === here ? 'here' : ''}${n === 0 ? ' goal' : ''}">${n === 0 ? 'none left over<br><b>MU lives here</b>' : `<b>${n}</b> left over`}</div>`).join('')}</div>` +
    `<p class="soft">MI has one I, so it begins at "1 left over". MU has no I at all, so it sits at "none left over". Now try every rule from both of the places a row can be.</p>` +
    `<div class="grid"><div></div><div class="h">from 1 left over</div><div class="h">from 2 left over</div>${grid.join('')}</div>${lastNote ? `<p class="soft">${lastNote}</p>` : ''}</div>` +
    (all
      ? `<div class="card"><p><b>No rule ever lands on "none left over".</b> Every row you can make has 1 or 2 left over. MU has none. So MU cannot be made, and you know that about every one of the endless rows without making any of them.</p></div>${bookCard()}<div class="bar"><a class="chip gold" href="./rules.html?practice">Practise the move ▶</a><a class="chip pale" href="./index.html">Back to the map</a></div>`
      : '')
  );
}
function bookCard(): string {
  return `<div class="card book"><h3>In the book</h3>
    <ul class="terms">
      <li>The rows are <b>strings</b>. The one you are given, MI, is the <b>axiom</b>.</li>
      <li>The four rules are <b>rules of production</b>. A row you can make is a <b>theorem</b>, and the list of rows that led to it is its <b>derivation</b>.</li>
      <li>Working inside the rules is the <b>Mechanical mode</b> (M-mode). Stepping out to think about the rules is the <b>Intelligent mode</b> (I-mode).</li>
      <li>A test that always finishes and always says whether a string is a theorem is a <b>decision procedure</b>. What you found, the leftover of the I's, is part of one.</li>
    </ul>
    <p>A machine told to make rows until it reaches MU would run for ever and never complain. Hofstadter's point is that people do not: sooner or later they notice something and step outside. Whether that stepping outside can itself be written down as rules is the question the rest of the book works towards, and it is still a live question about thinking machines.</p></div>`;
}

// ---- Practice ----

let puzzle: Puzzle | null = null;
let verdict: '' | 'reached' | 'why' | 'right' | 'wrongReason' | 'wasPossible' = '';
let chosen = -1;
let lastFamily = '';
let replay = 0;
const stat = (f: Family) => (kept.practice[f.id] ??= { seen: 0, right: 0 });
const rightsAt = (level: number) => FAMILIES.filter((f) => f.level === level).reduce((n, f) => n + stat(f).right, 0);
function unlocked(): Family[] {
  const top = rightsAt(1) < 3 ? 1 : rightsAt(2) < 3 ? 2 : 3;
  return FAMILIES.filter((f) => f.level <= top);
}
function nextPuzzle(): void {
  const pinned = FAMILIES.find((f) => f.id === params.get('family'));
  // Whichever open family she has got right least often, but never the one she has just had.
  const open = unlocked().filter((f) => f.id !== lastFamily || unlocked().length === 1);
  const least = Math.min(...open.map((f) => stat(f).right));
  const pool = open.filter((f) => stat(f).right <= least + 1);
  const family = pinned ?? pool[Math.floor(Math.random() * pool.length)];
  puzzle = makePuzzle(family, seeded(Math.floor(Math.random() * 1e9)));
  lastFamily = family.id;
  skin = SKINS[(SKINS.indexOf(skin) + 1 + Math.floor(Math.random() * 2)) % 3];
  sys = puzzle.system;
  now = sys.start;
  trail = [now];
  choosing = null;
  verdict = '';
  chosen = -1;
  above = false;
  stat(family).seen++;
  keep();
  render();
}
function score(right: boolean): void {
  if (!puzzle) return;
  if (right) {
    stat(puzzle.family).right++;
    kept.streak++;
    sound.chime();
  } else kept.streak = 0;
  keep();
}
function tallies(): string {
  if (!puzzle) return '';
  const letters = [...new Set([...sys.start, ...puzzle.target, ...sys.rules.flatMap((r) => (r.kind === 'double' ? [] : [...r.from, ...r.to]))])].sort();
  const line = (r: string, cls = '', tag = '') =>
    `<tr class="${cls}"><td>${row(r, skin, 'small')}${tag}</td><td>${r.length}</td>${letters.map((s) => `<td>${r.split(s).length - 1}</td>`).join('')}<td>${r ? draw(r[0], skin).replace('class="sym"', 'class="sym" style="width:22px;height:22px;display:inline-flex"') : ''}</td></tr>`;
  const rows = [...new Set(trail)].slice(-9);
  return `<table class="tally"><tr><th></th><th>how many</th>${letters.map((s) => `<th>${NAMES[skin][s]}s</th>`).join('')}<th>first</th></tr>${rows.map((r) => line(r)).join('')}${line(puzzle.target, 'goal', '')}</table><p class="soft">The shaded row is the one you are asked to make. Make a few rows, then come back and look down the columns: is there anything the rules never change?</p>`;
}
function practice(): string {
  if (!puzzle) return '';
  const p = puzzle;
  const name = (s: string) => NAMES[skin][s];
  const total = Object.values(kept.practice).reduce((n, f) => n + f.right, 0);
  const head = `<div class="kicker">Practice · inside or outside?</div><h1>Can you get there?</h1><p class="soft">${total} solved${kept.streak > 1 ? ` · ${kept.streak} in a row` : ''}. Get there by using the rules, or say that it cannot be done. Press <b>◉</b> to stop making rows and look at them from outside.</p>`;
  let after = '';
  if (verdict === 'reached') {
    const best = p.way.length - 1;
    after = `<div class="card"><p class="good"><b>You got there, from inside,</b> in ${trail.length - 1} moves${best > 0 && best < trail.length - 1 ? `. It can be done in ${best}` : ''}.</p></div>`;
  } else if (verdict === 'why') {
    after = `<div class="card"><p><b>How do you know?</b> Which of these is true of every row these rules can make, and rules the target out?</p><div class="reasons">${p.reasons.map((c, i) => `<button data-reason="${i}">${esc(c.say(name))}</button>`).join('')}</div></div>`;
  } else if (verdict === 'right') {
    after = `<div class="card"><p class="good"><b>Yes.</b> ${esc(p.family.truth.say(name))} The target breaks that, so no amount of work inside the rules will reach it.</p></div>`;
  } else if (verdict === 'wrongReason') {
    after = `<div class="card"><p class="bad"><b>It cannot be done, but not for that reason.</b> ${esc(p.reasons[chosen].say(name))} These rules do change that. What they never change:</p><p><b>${esc(p.family.truth.say(name))}</b></p></div>`;
  } else if (verdict === 'wasPossible') {
    after = `<div class="card"><p class="bad"><b>It can be done.</b> Here is one way, in ${p.way.length - 1} moves:</p><div class="trail">${p.way.slice(0, replay + 1).map((r) => row(r, skin, 'small')).join('')}</div></div>`;
  }
  const next = verdict && verdict !== 'why' ? `<div class="bar"><button class="chip gold" data-do="next">Another ▶</button><a class="chip pale" href="./index.html">Back to the map</a></div>` : '';
  return `${head}<div class="card">${above ? `<div class="label">From outside</div>${tallies()}` : board(p.target)}</div>${after}${next}`;
}

/** After every move: has she arrived? */
function arrived(): void {
  if (practising && puzzle && !verdict && now === puzzle.target) {
    verdict = 'reached';
    score(puzzle.possible);
  }
}

// ---- Drawing and hands ----

function render(): void {
  page.innerHTML = practising ? practice() : chamber();
  $('eye').classList.toggle('on', above);
  $('eye').classList.toggle('call', !practising && !above && trail.length > 12 && !kept.chapter);
  fresh = -1;
  refused = -1;
}
page.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-rule],[data-at],[data-do],[data-try],[data-reason]');
  if (!el) return;
  sound.start();
  if (el.dataset.rule !== undefined && (!verdict || !practising)) use(Number(el.dataset.rule));
  else if (el.dataset.at !== undefined && choosing) {
    const option = moves(now, sys.rules[choosing.rule], sys.cap).find((o) => o.at === Number(el.dataset.at));
    if (option) land(option.row, option.at);
  } else if (el.dataset.do === 'undo') undo();
  else if (el.dataset.do === 'restart') restart();
  else if (el.dataset.do === 'next') nextPuzzle();
  else if (el.dataset.do === 'cannot' && puzzle) {
    if (puzzle.possible) {
      verdict = 'wasPossible';
      score(false);
      replay = 0;
      const tick = () => {
        if (verdict !== 'wasPossible' || !puzzle || replay >= puzzle.way.length - 1) return;
        replay++;
        sing(puzzle.way[replay]);
        render();
        setTimeout(tick, 700);
      };
      setTimeout(tick, 600);
    } else verdict = 'why';
    render();
  } else if (el.dataset.reason !== undefined && puzzle) {
    chosen = Number(el.dataset.reason);
    const right = puzzle.reasons[chosen].key === puzzle.family.truth.key;
    verdict = right ? 'right' : 'wrongReason';
    score(right);
    render();
  } else if (el.dataset.try !== undefined) {
    tried.add(el.dataset.try);
    if (tried.size === 8 && !kept.chapter) {
      kept.chapter = true;
      keep();
      sound.chime();
    }
    render();
  }
});
$('eye').onclick = () => {
  above = !above;
  choosing = null;
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
  check: () => selfCheck(),
  state: () => ({ now, trail: trail.length, above, verdict, possible: puzzle?.possible, target: puzzle?.target, way: puzzle?.way, family: puzzle?.family.id, truth: puzzle?.family.truth.key, reasons: puzzle?.reasons.map((r) => r.key), tried: tried.size, kept }),
  reach: (depth: number) => reach(sys, depth).size,
};
