import { draw } from './draw';
import type { Skin } from './draw';
import { Shell, checkKinds, choices, numbers, pickOne, runPractice, shuffled } from './shell';
import type { Kind } from './shell';

/**
 * Nesting: going down a level, and getting back out in order.
 * (Gödel, Escher, Bach, chapter V, "Recursive Structures and Processes", and
 * the dialogue before it, "Little Harmonic Labyrinth".)
 *
 * The chamber has two halves. First, stories inside stories: she goes three
 * levels down, then has to come home with the lights out, and is offered an
 * ending that feels like home one level too soon. Second, a thing defined in
 * terms of itself: a fern whose rule mentions ferns, which is perfectly
 * drawable so long as the rule has a bottom, and never finishes without one.
 */

const sh = new Shell('portal-worlds-spire-nest-v1');
const small = (s: string, skin: Skin) => draw(s, skin).replace('class="sym"', 'class="sym" style="width:22px;height:22px;display:inline-flex;vertical-align:middle"');

// ---- Practice: where are you? ----

type Move = string | null; // a door to go in by, or null to come out
function walk(rand: () => number, length: number): { moves: Move[]; stack: string[] } {
  const moves: Move[] = [];
  const stack: string[] = [];
  for (let i = 0; i < length; i++) {
    if (stack.length === 0 || (stack.length < 4 && rand() < 0.56)) {
      const door = pickOne(rand, ['a', 'b', 'c']);
      moves.push(door);
      stack.push(door);
    } else {
      moves.push(null);
      stack.pop();
    }
  }
  return { moves, stack };
}
const chips = (moves: Move[], skin: Skin) => `<div class="row" style="gap:6px">${moves.map((m) => `<span class="mv">${m ? `↓${small(m, skin)}` : '↑'}</span>`).join('')}</div>`;
const trace = (moves: Move[], skin: Skin) => {
  const stack: string[] = [];
  return `<table class="tally"><tr><th>move</th><th>you are now inside</th></tr>${moves
    .map((m) => {
      if (m) stack.push(m);
      else stack.pop();
      return `<tr><td>${m ? `↓${small(m, skin)}` : '↑'}</td><td>${stack.length ? stack.map((s) => small(s, skin)).join(' › ') : 'nothing: home'}</td></tr>`;
    })
    .join('')}</table>`;
};
const KEY = `<p class="soft">↓ with a mark means go in by that door. ↑ means come back out of wherever you last went in.</p>`;
const NOUNS: [string, string, string][] = [
  ['tower', 'a block', 'on top of'],
  ['chain', 'a link', 'joined to'],
  ['train', 'a carriage', 'coupled to'],
  ['queue', 'a person', 'standing behind'],
  ['necklace', 'a bead', 'threaded next to'],
];

const KINDS: Kind[] = [
  {
    id: 'depth',
    level: 1,
    make(rand, skin) {
      const w = walk(rand, 5 + Math.floor(rand() * 4));
      return { ask: 'How many doors deep are you now?', show: KEY + chips(w.moves, skin), outside: trace(w.moves, skin), ...numbers(rand, w.stack.length, [w.moves.filter((m) => m).length, w.moves.filter((m) => !m).length]), why: `You went in ${w.moves.filter((m) => m).length} times and came out ${w.moves.filter((m) => !m).length} times.` };
    },
  },
  {
    id: 'where',
    level: 1,
    make(rand, skin) {
      const w = walk(rand, 5 + Math.floor(rand() * 4));
      const top = w.stack[w.stack.length - 1];
      const options = ['Home, outside all of them', ...['a', 'b', 'c'].map((s) => `Inside ${small(s, skin)}`)];
      return { ask: 'Where are you standing now?', show: KEY + chips(w.moves, skin), outside: trace(w.moves, skin), options, right: top ? 1 + ['a', 'b', 'c'].indexOf(top) : 0, why: 'Coming out always undoes the most recent going in that has not been undone yet.' };
    },
  },
  {
    id: 'home',
    level: 2,
    make(rand, skin) {
      // One journey that ends at home; one that is still inside; one that comes out before it has gone in; one more that is still inside.
      const balanced = (): Move[] => {
        for (;;) {
          const w = walk(rand, 6);
          if (!w.stack.length) return w.moves;
        }
      };
      const inside = (): Move[] => {
        for (;;) {
          const w = walk(rand, 6);
          if (w.stack.length) return w.moves;
        }
      };
      const good = balanced();
      const early = balanced();
      const first = early.findIndex((m) => m);
      const out = early.indexOf(null);
      [early[first], early[out]] = [early[out], early[first]]; // the same moves, but it comes out first
      const right = chips(good, skin);
      return { ask: 'Which of these journeys ends at home?', show: KEY, ...choices(rand, right, [chips(inside(), skin), chips(early, skin), chips(inside(), skin)]), why: 'Count alone is not enough. Each ↑ must have a ↓ before it to undo, and none may be left over.' };
    },
  },
  {
    id: 'tips',
    level: 2,
    make(rand) {
      const b = 2 + Math.floor(rand() * 2);
      const d = 2 + Math.floor(rand() * 3);
      return { ask: `After ${d} rounds of splitting, how many tips are there?`, show: `<p>A twig ends in ${b} smaller twigs. Each of those ends in ${b} smaller twigs, and so on.</p>`, outside: `<p class="soft">One round: ${b} tips. Two rounds: each of those ${b} has ${b} of its own.</p>`, ...numbers(rand, b ** d, [b * d, b ** (d - 1), b ** (d + 1), b + d]), why: `${Array(d).fill(b).join(' × ')} = ${b ** d}. Each round multiplies; it does not add.` };
    },
  },
  {
    id: 'bottom',
    level: 3,
    make(rand) {
      const [thing, part, on] = pickOne(rand, NOUNS);
      const A = thing === 'tower' ? 'A' : 'A';
      const good = `${A} ${thing} is ${part}; or ${part} ${on} a ${thing}.`;
      const bad = [`${A} ${thing} is ${part} ${on} a ${thing}.`, `${A} ${thing} is a ${thing} with ${part} ${on} it.`, `${A} ${thing} is whatever a ${thing} is.`];
      if (rand() < 0.5) return { ask: 'Which of these definitions could you actually follow to the end?', show: `<p>Each tries to say what a ${thing} is, using the word "${thing}".</p>`, ...choices(rand, good, bad), why: 'A definition may mention itself, as long as one of its cases does not. That case is the bottom, where the unwinding stops.' };
      const fine = [good, `${A} ${thing} is ${part}; or two ${thing}s joined end to end.`, `${A} ${thing} is nothing at all; or ${part} ${on} a ${thing}.`];
      return { ask: 'Which of these definitions never comes to an end?', show: `<p>Each tries to say what a ${thing} is, using the word "${thing}".</p>`, ...choices(rand, bad[0], fine), why: 'It has no case that stops. Every time you ask what it means, it sends you to ask again.' };
    },
  },
  {
    id: 'unwind',
    level: 3,
    make(rand) {
      const s = 1 + Math.floor(rand() * 3);
      const n = 2 + Math.floor(rand() * 3);
      const double = rand() < 0.5;
      const k = 2 + Math.floor(rand() * 3);
      const f = (i: number): number => (i === 0 ? s : double ? f(i - 1) * 2 : f(i - 1) + k);
      const rule = double ? `twice the worth of step n − 1` : `the worth of step n − 1, and ${k} more`;
      const lines = Array.from({ length: n + 1 }, (_, i) => `<tr><td>step ${n - i}</td><td>${i === n ? `is ${s}: the bottom` : `needs step ${n - i - 1} first`}</td></tr>`).join('');
      return { ask: `What is step ${n} worth?`, show: `<p>Step 0 is worth <b>${s}</b>.<br>Step n is worth <b>${rule}</b>.</p>`, outside: `<table class="tally">${lines}</table><p class="soft">Go all the way down first. Then work back up.</p>`, ...numbers(rand, f(n), [f(n - 1), f(n + 1), double ? s + 2 * n : s * k * n]), why: `Unwound from the bottom: ${Array.from({ length: n + 1 }, (_, i) => f(i)).join(', ')}.` };
    },
  },
];

// ---- The chamber ----

type Door = 'book' | 'dream' | 'painting';
const DOORS: Record<Door, { go: string; told: string; ink: string; lift: number }> = {
  book: { go: 'Open the book', told: 'a book lies open, and you begin to read', ink: '#c9951c', lift: 7 },
  dream: { go: 'Fall asleep', told: 'someone falls asleep, and dreams', ink: '#2c7f93', lift: 5 },
  painting: { go: 'Step into the painting', told: 'a painting hangs on the wall, and you step into it', ink: '#b9486e', lift: 4 },
};
let stack: Door[] = [];
let phase = 0; // 0 going down, 1 coming back in the dark, 2 the fern, 3 done
let fooled = 0;
let said = '';
let depth = 2;
let twigs = 2;
let bottom = true;
let deepest = 2;
let ranAway = false;

const chord = () => {
  if (!sh.sound.ctx) return;
  const tonic = 55 + (stack.reduce((n, d) => n + DOORS[d].lift, 0) % 12);
  [0, 3, 7].forEach((add, i) => sh.sound.note(sh.sound.ctx!.currentTime + i * 0.05, 0.9, tonic + add, 0, 0, 0.12));
};
const place = (i: number) => (i < 0 ? 'wood' : stack[i]);
function boxes(i = 0): string {
  if (i >= stack.length) return '<div style="padding:10px;text-align:center">you are here</div>';
  const d = DOORS[stack[i]];
  return `<div style="border:3px solid ${d.ink};border-radius:12px;padding:6px 8px 8px;margin-top:4px"><span style="color:${d.ink};font-variant:small-caps;letter-spacing:.05em">the ${stack[i]}</span>${boxes(i + 1)}</div>`;
}
function fern(): { svg: string; stems: number; stopped: boolean } {
  let stems = 0;
  const lines: string[] = [];
  const limit = 9000;
  // Level by level, not branch by branch: so that a rule with no bottom runs out evenly, all over the fern.
  let edge: [number, number, number, number, number][] = [[160, 236, 0, 62, 0]];
  while (edge.length && stems < limit) {
    const next: typeof edge = [];
    for (const [x, y, angle, len, level] of edge) {
      if (stems >= limit) break;
      if (bottom && level > depth) continue;
      if (!bottom && len < 0.35) continue; // the page's own floor, which no rule here can remove
      const x2 = x + Math.sin(angle) * len;
      const y2 = y - Math.cos(angle) * len;
      stems++;
      lines.push(`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${Math.max(0.4, len / 14).toFixed(2)}"/>`);
      for (let i = 0; i < twigs; i++) next.push([x2, y2, angle + (twigs === 2 ? [-0.5, 0.45][i] : [-0.7, 0.05, 0.65][i]), len * (twigs === 2 ? 0.72 : 0.62), level + 1]);
    }
    edge = next;
  }
  return { svg: `<svg viewBox="0 0 320 240" style="width:100%;max-width:520px;display:block;margin:auto"><g stroke="#4f8a57" stroke-linecap="round">${lines.join('')}</g></svg>`, stems, stopped: stems >= limit };
}
function bookCard(): string {
  return `<div class="card book"><h3>In the book</h3>
    <ul class="terms">
      <li>Going down a level is a <b>push</b>. Coming back is a <b>pop</b>. The list of where you came from is the <b>stack</b>, and you can only ever pop its top.</li>
      <li>A rule that uses itself is <b>recursive</b>. It is not circular, because one of its cases does not use itself: Hofstadter says a recursive definition must <b>bottom out</b>.</li>
      <li>In music the home key is the <b>tonic</b>. A piece can move to a new key and settle there so firmly that it feels like home: a <b>pseudo-tonic</b>. The dialogue before this chapter, and the piece it is named after, never get back to the true one.</li>
      <li>The fern is <b>self-similar</b>: each part is a small copy of the whole.</li>
    </ul>
    <p>Recursion is how a short rulebook makes things without limit: sentences inside sentences, programs that call themselves, branches on branches. It is also how a system loses its place. A machine, or a mind, that pushes without keeping its stack cannot tell an ending from a way-station.</p></div>`;
}

function chamber(): string {
  const head = `<div class="kicker">Chapter V · Recursive Structures and Processes</div><h1>Nesting</h1>`;
  if (phase < 2) {
    const story = ['You are in the wood.', ...stack.map((d, i) => `In the ${place(i - 1)}, ${DOORS[d].told}.`)].join(' ');
    const dark = phase === 1;
    const doors = (Object.keys(DOORS) as Door[]).map((d) => `<button class="chip" style="background:${DOORS[d].ink}" data-do="push" data-v="${d}"${stack.length >= 4 ? ' disabled' : ''}>↓ ${DOORS[d].go}</button>`).join('');
    const task =
      phase === 0
        ? `<p>A story can have a story inside it, and that one another. <b>Go three levels down</b>, by any doors you like.</p>`
        : `<p><b>Now come home.</b> The lights are out: nobody will show you where you are. Come out as many times as it takes, and say when you are home.</p>`;
    const lure = dark && stack.length === 1 ? `<p><i>The tale comes to a satisfying close. The last chord settles. Everything feels finished.</i></p>` : '';
    return (
      `${head}<div class="card">${task}${dark ? '' : `<p class="soft">${story}</p>`}${lure}${said ? `<p class="${said.startsWith('Not') ? 'bad' : 'good'}">${said}</p>` : ''}` +
      `<div class="bar">${dark ? '' : doors}<button class="chip pale" data-do="pop"${!dark && !stack.length ? ' disabled' : ''}>↑ Come back out</button>${dark ? '<button class="chip gold" data-do="home">I am home</button>' : ''}</div></div>` +
      (dark && !sh.above ? '' : `<div class="card"><div class="label">${sh.above ? 'From outside: the stack, newest on top' : 'Where you are'}</div>${sh.above ? `<table class="tally">${[...stack].reverse().map((d, i) => `<tr><td>${i === 0 ? '<b>top</b>' : ''}</td><td style="text-align:left">the ${d}</td></tr>`).join('')}<tr><td></td><td style="text-align:left">the wood (home)</td></tr></table><p class="soft">Going in is a <b>push</b>: it puts a place on top. Coming out is a <b>pop</b>: it takes the top one off. Nothing else is possible.</p>` : `<div style="border:3px solid #4f9a5c;border-radius:12px;padding:6px 8px 8px"><span style="color:#4f9a5c;font-variant:small-caps;letter-spacing:.05em">the wood</span>${boxes()}</div>`}</div>`)
    );
  }
  const f = fern();
  const done = deepest >= 5 && ranAway;
  return (
    `${head}<div class="card"><p>A different kind of nesting: a thing whose own rule mentions it.</p><p style="font-size:19px"><b>A fern</b> is a stem, with ${twigs === 2 ? 'two' : 'three'} smaller <b>ferns</b> at its tip${bottom ? `; <span style="background:#e4efe6">unless it is ${depth} levels down, in which case it is only a stem</span>` : ''}.</p>` +
    `<div class="bar"><span class="soft">levels</span><button class="chip pale" data-do="depth" data-v="-1"${!bottom || depth <= 0 ? ' disabled' : ''}>−</button><b>${bottom ? depth : '∞'}</b><button class="chip pale" data-do="depth" data-v="1"${!bottom || depth >= 8 ? ' disabled' : ''}>+</button>` +
    `<button class="chip pale" data-do="twigs">${twigs === 2 ? 'three' : 'two'} at each tip</button><button class="chip${bottom ? '' : ' gold'}" data-do="bottom">${bottom ? 'Take away the "unless"' : 'Put the "unless" back'}</button></div></div>` +
    `<div class="card">${f.svg}<p class="soft" style="text-align:center">${f.stems.toLocaleString()} stems${!bottom ? '. With no bottom the rule never finishes. It was stopped for you here, by the page, because the stems had grown too small to draw' : ''}.</p></div>` +
    (done
      ? `<div class="card"><p><b>One short rule, and as much fern as you ask for.</b> The rule mentions itself and that is no trouble at all, so long as one case does not. Take that case away and it never ends.</p></div>${bookCard()}<div class="bar"><a class="chip gold" href="./nest.html?practice">Practise the move ▶</a><a class="chip pale" href="./index.html">Back to the map</a></div>`
      : `<p class="soft">Grow it to five levels or more. Then take away the "unless" and see what the rule does without a bottom.</p>`)
  );
}

if (sh.practising) {
  runPractice(sh, 'Practice · down and back', 'Where are you?', 'Keep your place as the levels go down and come back. Press <b>◉</b> to see it worked from outside.', KINDS);
} else {
  sh.render = () => {
    sh.page.innerHTML = chamber();
    sh.call(phase === 1 && fooled > 0 && !sh.above);
  };
  sh.on((what, value) => {
    said = '';
    if (what === 'push' && stack.length < 4) {
      stack.push(value as Door);
      chord();
      if (phase === 0 && stack.length >= 3) {
        phase = 1;
        said = 'Three levels down. Remember how you got here.';
      }
    } else if (what === 'pop') {
      if (stack.length) {
        stack.pop();
        chord();
      } else if (phase === 1) {
        phase = 2;
        said = '';
        sh.sound.chime();
      }
    } else if (what === 'home') {
      if (stack.length) {
        fooled++;
        said = `Not yet. You are still inside the ${stack[stack.length - 1]}${stack.length > 1 ? ', which is inside something else' : ''}. It felt like home because every level has a home of its own.`;
      } else {
        phase = 2;
        sh.above = false;
        sh.sound.chime();
      }
    } else if (what === 'depth') {
      depth = Math.max(0, Math.min(8, depth + Number(value)));
      deepest = Math.max(deepest, depth);
    } else if (what === 'twigs') twigs = twigs === 2 ? 3 : 2;
    else if (what === 'bottom') {
      bottom = !bottom;
      if (!bottom) ranAway = true;
    }
    if (phase === 2 && deepest >= 5 && ranAway) sh.finish();
    sh.draw();
  });
  sh.draw();
}
(window as unknown as { spire: Record<string, unknown> }).spire = { ...((window as unknown as { spire?: Record<string, unknown> }).spire ?? {}), check: () => checkKinds(KINDS), chamber: () => ({ phase, depth: stack.length, fooled, deepest, ranAway, done: sh.kept.chapter }) };
void shuffled;
