import { Builder } from './builder';
import type { BuildSave } from './builder';
import { freshProgress, nextProblem, record, stretchProblem, summary } from './facts';
import type { ChildId, Problem, Progress } from './facts';
import { MODES } from './modes';
import type { Mode, ModeId } from './modes';

/**
 * The desert: a building site where blocks are earned by answering sums.
 *
 * A child picks who they are, picks what to build, and builds it. Blocks run
 * out quickly; ordering more means answering a question at that child's level.
 * The sphinx paces the site and, if approached, asks three harder questions
 * for blocks that cannot be had any other way.
 *
 * There is almost no writing on screen: letters for the three children,
 * numbers, and pictures.
 */

// ---- What is remembered between visits (on this device only) ----

interface Saved {
  progress: Record<ChildId, Progress>;
  builds: Partial<Record<ChildId, Partial<Record<ModeId, BuildSave & { plan: boolean }>>>>;
}
const STORE = 'portal-worlds-desert-v1';
function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    // Private windows and blocked storage: play still works, it just is not remembered.
  }
  return { progress: { C: freshProgress(), R: freshProgress(), S: freshProgress() }, builds: {} };
}
const saved = loadSaved();
function persist(): void {
  try {
    localStorage.setItem(STORE, JSON.stringify(saved));
  } catch {
    // See above.
  }
}

// ---- Small helpers for building the screens ----

const ui = document.getElementById('ui') as HTMLDivElement;
const veil = document.getElementById('veil') as HTMLDivElement;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html) node.innerHTML = html;
  return node;
}
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

/** A group of bricks laid out in fives, so ten is always two full rows. */
function bricks(n: number): HTMLDivElement {
  const box = el('div', 'bricks');
  for (let i = 0; i < n; i++) {
    const b = el('i');
    if (i >= 5 && i < 10 && n > 10) b.className = 'ten';
    box.append(b);
  }
  return box;
}

function celebrate(): void {
  const colours = ['#f2c84b', '#d9485f', '#2f7fd0', '#4f9a5c', '#ffffff'];
  for (let i = 0; i < 60; i++) {
    const s = el('i', 'spark');
    s.style.left = '50vw';
    s.style.top = '45vh';
    s.style.background = colours[i % colours.length];
    s.style.setProperty('--dx', `${(Math.random() - 0.5) * 90}vw`);
    s.style.setProperty('--dy', `${(Math.random() - 0.6) * 90}vh`);
    document.body.append(s);
    setTimeout(() => s.remove(), 1700);
  }
}

// ---- State ----

let child: ChildId = 'C';
let mode: Mode = MODES[0];
let followPlan = true;

const builder = new Builder(document.getElementById('world') as HTMLCanvasElement, {
  needBlocks: (type) => order(type),
  changed: () => {
    keep();
    drawPalette();
  },
  finished: () => {
    celebrate();
    // Finishing a blueprint earns two of each special block.
    mode.blocks.forEach((b, i) => {
      if (b.special) builder.stock[i] += 2;
    });
    keep();
    drawPalette();
  },
  sphinx: () => riddles(),
  home: () => goHome(),
});

function keep(): void {
  (saved.builds[child] ??= {})[mode.id] = { ...builder.save(), plan: followPlan };
  persist();
}

// ---- Screens ----

const who = el('section', 'screen');
const what = el('section', 'screen');
const report = el('section', 'screen');
const top = el('div');
const palette = el('div');
const panel = el('div');
top.id = 'top';
palette.id = 'palette';
panel.id = 'panel';
report.id = 'report';
ui.append(top, palette, who, what, report, panel);
what.hidden = report.hidden = panel.hidden = top.hidden = palette.hidden = true;

// Who is playing: one big letter each.
{
  const row = el('div', 'row');
  for (const id of ['C', 'R', 'S'] as ChildId[]) {
    const tile = el('button', `tile who-${id.toLowerCase()}`, id);
    tile.onclick = () => {
      child = id;
      who.hidden = true;
      what.hidden = false;
    };
    row.append(tile);
  }
  // A small corner for grown-ups: how each child is getting on.
  const grown = el('button', 'round', '◔');
  grown.onclick = () => {
    report.replaceChildren();
    const table = el('table');
    for (const id of ['C', 'R', 'S'] as ChildId[]) {
      const s = summary(id, saved.progress[id]);
      const tr = el('tr');
      tr.append(el('td', `who-${id.toLowerCase()}`, id), el('td', '', `▲ ${s.level} / ${s.levels}`), el('td', '', `✓ ${s.known} / ${s.facts}`), el('td', '', `? ${saved.progress[id].asked}`));
      table.append(tr);
    }
    const back = el('button', 'round', '←');
    back.onclick = () => {
      report.hidden = true;
      who.hidden = false;
    };
    report.append(table, back);
    who.hidden = true;
    report.hidden = false;
  };
  who.append(row, grown);
}

// What to build, and whether to follow a blueprint or build freely.
{
  const row = el('div', 'row');
  for (const m of MODES) {
    const tile = el('button', 'tile', `<svg viewBox="0 0 40 40">${m.icon}</svg>`);
    tile.onclick = () => start(m);
    row.append(tile);
  }
  const style = el('div', 'row');
  const plan = el('button', 'tile small on', '<svg viewBox="0 0 40 40"><path d="M20 5 34 12v16l-14 7-14-7V12Z" fill="none" stroke="#4a3620" stroke-width="2.5" stroke-dasharray="4 3"/></svg>');
  const free = el('button', 'tile small', '<svg viewBox="0 0 40 40"><path d="M20 5 34 12v16l-14 7-14-7V12Z" fill="#d8a45c"/><path d="M6 12l14 7 14-7M20 19v16" fill="none" stroke="#4a3620" stroke-width="2"/></svg>');
  plan.onclick = () => {
    followPlan = true;
    plan.classList.add('on');
    free.classList.remove('on');
  };
  free.onclick = () => {
    followPlan = false;
    free.classList.add('on');
    plan.classList.remove('on');
  };
  style.append(plan, free);
  const back = el('button', 'round', '←');
  back.onclick = () => {
    what.hidden = true;
    who.hidden = false;
  };
  what.append(row, style, back);
}

function start(m: Mode): void {
  mode = m;
  const old = saved.builds[child]?.[m.id];
  builder.load(m, old ?? { blocks: [], stock: m.blocks.map((b) => (b.special ? 0 : 0)), done: false }, followPlan);
  // A few blocks to begin with, so the first thing a child does is build.
  if (!old) builder.stock[0] = 6;
  what.hidden = true;
  top.hidden = palette.hidden = false;
  drawTop();
  drawPalette();
  keep();
}

function drawTop(): void {
  const left = el('div');
  const right = el('div');
  const back = el('button', 'round', '←');
  back.onclick = () => {
    keep();
    top.hidden = palette.hidden = true;
    what.hidden = false;
  };
  const home = el('button', 'round');
  home.id = 'home';
  home.onclick = () => goHome();
  const rub = el('button', 'round' + (builder.erasing ? ' on' : ''), '⌫');
  rub.onclick = () => {
    builder.erasing = !builder.erasing;
    drawTop();
  };
  // Clearing the plot takes two taps, so it cannot happen by accident.
  const clear = el('button', 'round', '⟲');
  clear.onclick = () => {
    if (!clear.classList.contains('warn')) {
      clear.classList.add('warn');
      setTimeout(() => clear.classList.remove('warn'), 2500);
      return;
    }
    delete saved.builds[child]?.[mode.id];
    start(mode);
  };
  left.append(back, home);
  right.append(rub, clear);
  top.replaceChildren(left, right);
}

function drawPalette(): void {
  palette.replaceChildren();
  mode.blocks.forEach((b, i) => {
    const have = builder.stock[i];
    const tile = el('button', 'block');
    tile.style.background = hex(b.color);
    if (b.indoor) tile.classList.add('indoor');
    if (i === builder.selected && !builder.erasing) tile.classList.add('on');
    if (b.special && have === 0) tile.classList.add('locked');
    if (!b.special && have === 0) tile.classList.add('empty');
    // Shows how many are in hand; a plus means tap to order more; a question mark means ask the sphinx.
    tile.append(el('b', '', have > 0 ? String(have) : b.special ? '?' : '+'));
    tile.onclick = () => {
      const again = builder.selected === i && !builder.erasing;
      builder.selected = i;
      builder.erasing = false;
      drawTop();
      drawPalette();
      if (again || have === 0) order(i);
    };
    palette.append(tile);
  });
}

// ---- Asking questions ----

/** Shows one question and resolves with whether it was answered correctly and how fast. */
function ask(problem: Problem, badge?: HTMLElement): Promise<{ correct: boolean; seconds: number } | null> {
  return new Promise((resolve) => {
    const card = el('div', 'card');
    const began = performance.now();
    const answerWith = async (value: number, reveal: () => void) => {
      const correct = value === problem.answer;
      card.classList.add(correct ? 'right' : 'wrong');
      card.style.pointerEvents = 'none';
      if (!correct) reveal();
      await wait(correct ? 450 : 2200);
      resolve({ correct, seconds: (performance.now() - began) / 1000 });
    };
    const close = el('button', 'close', '✕');
    close.onclick = () => resolve(null);
    card.append(close);
    if (badge) card.append(badge);

    if (problem.kind === 'type') {
      let typed = '';
      const box = el('span', 'box');
      const sum = el('div', 'sum');
      sum.append(problem.prompt, ' = ', box);
      const hint = el('div');
      const pad = el('div', 'pad');
      const press = (label: string, cls = '') => {
        const key = el('button', cls, label);
        pad.append(key);
        return key;
      };
      for (const d of '123456789') press(d).onclick = () => type(d);
      press('⌫').onclick = () => {
        typed = typed.slice(0, -1);
        box.textContent = typed;
      };
      press('0').onclick = () => type('0');
      press('✓', 'ok').onclick = () => {
        if (typed === '') return;
        void answerWith(Number(typed), () => {
          box.textContent = String(problem.answer);
          // After a missed times-table fact, show it as rows of bricks.
          if (problem.array) {
            const [across, down] = problem.array;
            const dots = el('div', 'dots');
            dots.style.gridTemplateColumns = `repeat(${across}, auto)`;
            for (let i = 0; i < across * down; i++) dots.append(el('i'));
            hint.append(dots);
          }
        });
      };
      const type = (d: string) => {
        if (typed.length < 4) typed += d;
        box.textContent = typed;
      };
      card.append(sum, hint, pad);
    } else if (problem.kind === 'pickNumeral' || problem.kind === 'pickPile') {
      const numerals = problem.kind === 'pickNumeral';
      card.append(numerals ? bricks(problem.answer) : el('div', 'sum', problem.prompt));
      const picks = el('div', 'picks');
      for (const c of problem.choices!) {
        const pick = el('button');
        pick.append(numerals ? String(c) : bricks(c));
        if (c === problem.answer) pick.dataset.is = '1';
        pick.onclick = () => void answerWith(c, () => picks.querySelector('[data-is]')!.classList.add('is'));
        picks.append(pick);
      }
      card.append(picks);
    } else {
      // Count out that many bricks by tapping them, then confirm.
      card.append(el('div', 'sum', problem.prompt));
      const tray = el('div', 'bricks tap');
      const size = problem.answer <= 5 ? 10 : problem.answer <= 10 ? 15 : 25;
      for (let i = 0; i < size; i++) {
        const b = el('i');
        b.onclick = () => b.classList.toggle('in');
        tray.append(b);
      }
      const ok = el('button', 'round on', '✓');
      ok.onclick = () =>
        void answerWith(tray.querySelectorAll('.in').length, () => {
          tray.querySelectorAll('i').forEach((b, i) => b.classList.toggle('in', i < problem.answer));
        });
      card.append(tray, ok);
    }
    panel.replaceChildren(card);
    panel.hidden = false;
  });
}

/** How many blocks a right answer brings. */
function batch(problem: Problem, quick: boolean): number {
  if (child === 'C') return problem.kind === 'count' ? Math.max(3, problem.answer) : 5;
  return (child === 'R' ? 6 : 8) + (quick ? 3 : 0);
}

let busy = false;

/** Order more of a block: answer a question, receive a batch. */
async function order(type: number): Promise<void> {
  if (busy || mode.blocks[type].special || builder.stock[type] >= 16) return;
  busy = true;
  builder.enabled = false;
  const progress = saved.progress[child];
  const problem = nextProblem(child, progress);
  let first = true;
  for (;;) {
    const result = await ask(problem);
    if (!result) break; // closed without answering
    let gain = 0;
    if (first) {
      const outcome = record(child, progress, problem, result.correct, result.seconds);
      if (result.correct) gain = batch(problem, outcome.quick);
      if (outcome.levelUp) celebrate();
    } else if (result.correct) {
      gain = Math.ceil(batch(problem, false) / 2); // got it after being shown: half a batch
    }
    first = false;
    persist();
    if (result.correct) {
      builder.stock[type] += gain;
      panel.replaceChildren(el('div', 'card right', `<div class="gain">+${gain}</div>`));
      await wait(650);
      break;
    }
    // Missed: the answer was shown; now ask the very same thing again.
  }
  panel.hidden = true;
  builder.enabled = true;
  busy = false;
  keep();
  drawPalette();
}

/** The sphinx's three riddles: harder questions, for blocks that cannot be ordered. */
async function riddles(): Promise<void> {
  if (busy) return;
  busy = true;
  builder.enabled = false;
  await wait(900); // let the camera come round to face it
  const progress = saved.progress[child];
  const specials = mode.blocks.map((b, i) => (b.special ? i : -1)).filter((i) => i >= 0);
  let won = 0;
  for (let q = 0; q < 3; q++) {
    const badge = el('div', 'row');
    badge.innerHTML = `<svg class="face" viewBox="0 0 40 40"><path d="M6 36V14l6-9h16l6 9v22h-7V22H13v14Z" fill="#2f5fa8"/><path d="M6 20h7M6 27h7M27 20h7M27 27h7" stroke="#e6bd4c" stroke-width="2.5"/><rect x="12" y="11" width="16" height="17" rx="2" fill="#d9b97c"/><rect x="11" y="8" width="18" height="4" fill="#e6bd4c"/><path d="M15 18h3M22 18h3" stroke="#3a2c22" stroke-width="2.4"/><rect x="18" y="28" width="4" height="7" fill="#e6bd4c"/></svg>`;
    const pips = el('div', 'pips');
    for (let i = 0; i < 3; i++) pips.append(el('i', i < won ? 'won' : ''));
    badge.append(pips);
    const problem = stretchProblem(child, progress);
    const result = await ask(problem, badge);
    if (!result) break;
    record(child, progress, problem, result.correct, result.seconds);
    persist();
    if (result.correct) {
      won++;
      // Give whichever special block they have fewest of.
      const give = specials.sort((a, b) => builder.stock[a] - builder.stock[b])[0];
      builder.stock[give]++;
    }
  }
  if (won === 3) celebrate();
  panel.hidden = true;
  builder.release();
  builder.enabled = true;
  busy = false;
  keep();
  drawPalette();
}

// ---- Arriving and leaving ----

function goHome(): void {
  keep();
  veil.style.background = '#4f9a5c';
  veil.classList.remove('open');
  setTimeout(() => {
    window.location.href = '../../index.html#from-desert';
  }, 1500);
}
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});
requestAnimationFrame(() => veil.classList.add('open'));
