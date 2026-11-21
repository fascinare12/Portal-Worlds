import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from './shell';
import type { Kind } from './shell';

/**
 * The loop closes: the top level reaches down and rewrites the bottom.
 * (Gödel, Escher, Bach, chapter XX, "Strange Loops, Or Tangled Hierarchies".)
 *
 * The chamber starts with a plain hierarchy: a dial that she sets, acting on
 * a row of stones that cannot answer back. Then the dial is wired to one of
 * the stones, so that the row sets the rule that changes the row. She finds
 * what such a thing can do: hold still, go round for ever, flip, or switch
 * itself off. Two dials that turn each other show a hierarchy with no top.
 * Last comes the one level nothing inside can reach, and a picture of this
 * map inside this map, which is the way home.
 */

const sh = new Shell('portal-worlds-spire-loop-v1');
const stone = (v: number, ink = '#2c7f93', mark = false) => `<span class="sym" style="background:${ink};${mark ? 'outline:3px solid #c9951c;outline-offset:2px' : ''}">${v}</span>`;

/** Follows a rule until it repeats; says how long the repeating part is, and whether it began inside it. */
function fate<T>(start: T, next: (s: T) => T, key: (s: T) => string): { length: number; lead: number; path: T[] } {
  const seen = new Map<string, number>();
  const path: T[] = [];
  let s = start;
  while (!seen.has(key(s))) {
    seen.set(key(s), path.length);
    path.push(s);
    s = next(s);
  }
  const lead = seen.get(key(s))!;
  return { length: path.length - lead, lead, path };
}
const FATES = ['It comes to rest, and stays there', 'It ends up flipping between two states', 'It goes round three or more states, for ever'];
const fateOf = (length: number) => (length === 1 ? 0 : length === 2 ? 1 : 2);

// ---- Practice ----

type Lamps = [boolean, boolean];
const LAMP_RULES: { say: string; next: (l: Lamps) => Lamps }[] = [
  { say: 'Each lamp copies what the other one was doing.', next: ([a, b]) => [b, a] },
  { say: 'The first lamp copies the second. The second does the opposite of the first.', next: ([a, b]) => [b, !a] },
  { say: 'Each lamp does the opposite of what the other was doing.', next: ([a, b]) => [!b, !a] },
  { say: 'The first lamp copies the second. The second stays as it is.', next: ([a, b]) => [b, b] },
  { say: 'The first lamp does the opposite of itself. The second copies the first.', next: ([a]) => [!a, a] },
  { say: 'Each lamp lights only if both were lit.', next: ([a, b]) => [a && b, a && b] },
];
const lamp = (on: boolean) => `<span class="sym" style="border-radius:50%;background:${on ? '#e8c24a' : '#55585f'};box-shadow:${on ? '0 0 14px #e8c24a' : 'none'}"></span>`;
const INVIOLATE: [string, string, string[]][] = [
  ['Two hands, each drawing the other on the same sheet of paper.', 'The hand of the artist who drew them both', ['The left hand', 'The right hand', 'The pencil in the picture']],
  ['A board game in which a move may change how the pieces are allowed to move.', 'The rules, printed on the box, for how rules may be changed', ['The position of the pieces', 'The rule for how a knight moves', 'Whose turn it is']],
  ['A program that rewrites its own instructions as it runs.', 'The machine that carries out whatever instructions are there', ['The first line of the program', 'The value of its counter', 'The instruction it is about to run']],
  ['A person who, by thinking, changes what they believe and want.', 'The physics by which nerve cells fire', ['Their opinions', 'Their memories', 'Their plans for tomorrow']],
  ['The row of stones that sets the rule that changes the row.', 'The fact that a round means "turn each stone forward"', ['The number on the marked stone', 'The number on the dial', 'How many rounds have passed']],
];

const KINDS: Kind[] = [
  {
    id: 'dial',
    level: 1,
    make(rand) {
      const m = 5 + Math.floor(rand() * 5);
      const v = 1 + Math.floor(rand() * (m - 1));
      const f = fate(v, (x) => (x * 2) % m, String);
      return { ask: 'What does it do in the end?', show: `<p>A dial with ${m} places, numbered 0 to ${m - 1}. <b>Each round it turns forward by the number it is showing.</b> It starts at:</p><div class="row">${stone(v)}</div>`, outside: `<p class="soft">The first rounds: ${f.path.slice(0, 4).join(' → ')} → …</p>`, options: FATES, right: fateOf(f.length), why: `It runs ${[...f.path, f.path[f.lead]].join(' → ')}, and from there repeats.` };
    },
  },
  {
    id: 'after',
    level: 1,
    make(rand) {
      const m = 5 + Math.floor(rand() * 5);
      const v = 1 + Math.floor(rand() * (m - 1));
      const n = 3 + Math.floor(rand() * 3);
      let x = v;
      const path = [v];
      for (let i = 0; i < n; i++) path.push((x = (x * 2) % m));
      return { ask: `What does it show after ${n} rounds?`, show: `<p>A dial with ${m} places, numbered 0 to ${m - 1}. <b>Each round it turns forward by the number it is showing.</b> It starts at:</p><div class="row">${stone(v)}</div>`, ...numbers(rand, x, [path[n - 1], (v * n) % m, (v + n) % m].filter((y) => y < m)), why: `Round by round: ${path.join(' → ')}.` };
    },
  },
  {
    id: 'lamps',
    level: 2,
    make(rand) {
      const rule = pickOne(rand, LAMP_RULES);
      const start: Lamps = [rand() < 0.5, rand() < 0.5];
      const f = fate(start, rule.next, (l) => l.join());
      return { ask: 'What do they do in the end?', show: `<p>Two lamps. Each round, both change at once:</p><p><b>${rule.say}</b></p><p>They start like this:</p><div class="row">${start.map(lamp).join('')}</div>`, outside: `<div class="row">${f.path.slice(0, 3).map((l) => `${l.map(lamp).join('')}<span class="to">→</span>`).join('')}…</div>`, options: FATES, right: fateOf(f.length), why: f.length === 1 ? 'They reach a state the rule leaves alone.' : `They repeat every ${f.length} rounds. Each lamp's rule is about the other, so neither can settle the matter alone.` };
    },
  },
  {
    id: 'under',
    level: 2,
    make(rand) {
      const [scene, right, wrong] = pickOne(rand, INVIOLATE);
      return { ask: 'Which thing here can nothing inside the loop change?', show: `<p>${scene}</p>`, ...choices(rand, right, wrong), why: 'Every tangle rests on a level that is not in it. Hofstadter calls that the inviolate level.' };
    },
  },
  {
    id: 'hands',
    level: 3,
    make(rand) {
      const m = 4 + Math.floor(rand() * 4);
      const start: [number, number] = [Math.floor(rand() * m), 1 + Math.floor(rand() * (m - 1))];
      const next = ([a, b]: [number, number]): [number, number] => [(a + b) % m, (b + a) % m];
      const f = fate(start, next, (s) => s.join());
      if (rand() < 0.5) return { ask: 'What do they do in the end?', show: `<p>Two dials, each with ${m} places (0 to ${m - 1}). <b>Each round, each one turns forward by what the other was showing.</b></p><div class="row">${stone(start[0])}${stone(start[1], '#b9486e')}</div>`, outside: `<p class="soft">The first rounds: ${f.path.slice(0, 3).map((s) => `(${s.join(', ')})`).join(' → ')} → …</p>`, options: FATES, right: fateOf(f.length), why: `They run ${[...f.path, f.path[f.lead]].map((s) => `(${s.join(', ')})`).join(' → ')}, and from there repeat.` };
      const after = next(next(start));
      return { ask: 'What do they show after two rounds?', show: `<p>Two dials, each with ${m} places (0 to ${m - 1}). <b>Each round, each one turns forward by what the other was showing.</b></p><div class="row">${stone(start[0])}${stone(start[1], '#b9486e')}</div>`, ...choices(rand, `${after[0]} and ${after[1]}`, [`${next(start)[0]} and ${next(start)[1]}`, `${(start[0] + 2) % m} and ${(start[1] + 2) % m}`, `${(after[0] + 1) % m} and ${after[1]}`, `${after[1]} and ${(after[0] + 1) % m}`]), why: `(${start.join(', ')}) → (${next(start).join(', ')}) → (${after.join(', ')}). Both move together, each by the other's old number.` };
    },
  },
];

// ---- The chamber ----

let phase = 0; // 0 a plain hierarchy, 1 the loop closed, 2 two hands, 3 underneath, 4 the way home
let size = 5;
let dial = 1;
let stones = [0, 2, 3, 1, 1];
let rounds = 0;
let history: number[] = [];
const found = new Set<string>();
let hands: [number, number] = [1, 2];
let handsRounds = 0;
let said = '';
const WANT: [string, string][] = [
  ['still', 'holds perfectly still'],
  ['round', 'goes round and round, never settling'],
  ['flip', 'flips between two numbers'],
  ['off', 'runs for a while and then switches itself off'],
];
function judge(start: number): string {
  const f = fate(start, (x) => (x * 2) % size, String);
  if (f.length >= 3) return 'round';
  if (f.length === 2) return 'flip';
  return f.lead === 0 ? 'still' : 'off';
}
function bookCard(): string {
  return `<div class="card book"><h3>In the book</h3>
    <ul class="terms">
      <li>A <b>Tangled Hierarchy</b> is a system in which what should be the higher level is acted on by the lower one. The loop through it is a <b>Strange Loop</b>.</li>
      <li>Beneath every tangle is a level the tangle cannot touch: the <b>inviolate level</b>. In Escher's Drawing Hands it is Escher. In a brain it is the physics of nerve cells.</li>
      <li>Hofstadter's example is a <b>self-modifying game</b>: a kind of chess in which a move may change the rules of chess.</li>
      <li>A mind, he argues, holds a symbol for itself, the <b>self-symbol</b>. It is made by the low level, and it steers the low level. That loop is what the word "I" refers to.</li>
    </ul>
    <p>So the book ends where it began. The canon climbed through its keys and arrived home; the argument climbs from marks, to meaning, to systems that describe themselves, to a system whose description of itself is part of what runs it. Whether anything we build has, or could have, a loop like that is the question the book leaves with you.</p></div>`;
}
/** This map, with this chamber on it, with this map in it. */
function mapInMap(depth: number): string {
  const names = ['The Endless Canon', 'Inside and outside', 'Mirrors', 'Nesting', 'The record that breaks the player', 'Levels', 'The loop closes'];
  return `<div style="border:2px solid #c9c6be;border-radius:10px;padding:6px 8px;background:#fbfaf7;font-size:${Math.max(5, 15 - depth * 4)}px;line-height:1.35">${names.map((n, i) => `<div style="opacity:${i === 6 ? 1 : 0.6}">${i === 6 ? '<b>' : ''}${n}${i === 6 ? '</b>' : ''}</div>`).join('')}${depth < 3 ? `<div style="margin:4px 0 0 ${14 - depth * 3}px">${mapInMap(depth + 1)}</div>` : ''}</div>`;
}

function chamber(): string {
  const head = `<div class="kicker">Chapter XX · Strange Loops, Or Tangled Hierarchies</div><h1>The loop closes</h1>`;
  const row = `<div class="row">${stones.map((v, i) => stone(v, '#2c7f93', phase >= 1 && i === stones.length - 1)).join('')}</div>`;
  if (phase === 0) {
    return (
      `${head}<div class="card"><p>Five stones, each showing a number from 0 to ${size - 1}. Above them, a dial that you set. <b>Each round, every stone turns forward by what the dial says.</b></p>` +
      `<div class="label">The dial (yours to turn)</div><div class="bar">${[0, 1, 2, 3, 4].map((v) => `<button data-do="dial" data-v="${v}">${stone(v, v === dial ? '#c9951c' : '#c9c6be')}</button>`).join('')}</div>` +
      `<div class="label">The stones</div>${row}<div class="bar"><button class="chip" data-do="round">One round ▶</button><span class="soft">${rounds} ${rounds === 1 ? 'round' : 'rounds'}</span></div>` +
      (rounds >= 2 ? `<p>The dial acts on the stones. Nothing the stones do can reach the dial. That is a plain hierarchy: a rule above, and what it rules below.</p><div class="bar"><button class="chip gold" data-do="close">Wire the dial to the last stone ▶</button></div>` : '') +
      `</div>`
    );
  }
  if (phase === 1) {
    const list = WANT.map(([id, say]) => `<li>${found.has(id) ? '<span class="good">✓</span>' : '○'} one that ${say}${id === 'off' || id === 'flip' ? ' <span class="soft">(try six-place stones)</span>' : ''}</li>`).join('');
    return (
      `${head}<div class="card"><p>Now the dial is not yours. <b>It shows whatever the last stone shows.</b> So the row sets the rule, and the rule changes the row, last stone included.</p>` +
      `<div class="label">The dial (wired to the marked stone)</div><div class="row">${stone(stones[stones.length - 1], '#c9951c')}</div><div class="label">The stones · press the marked one to set where it starts</div>` +
      `<div class="row">${stones.map((v, i) => (i === stones.length - 1 ? `<button data-do="set">${stone(v, '#2c7f93', true)}</button>` : stone(v))).join('')}</div>` +
      `<div class="bar"><button class="chip" data-do="round">One round ▶</button><button class="chip pale" data-do="size">${size === 5 ? 'Six' : 'Five'}-place stones</button><span class="soft">${history.length > 1 ? `marked stone so far: ${history.join(' → ')}` : ''}</span></div>${said ? `<p class="good">${said}</p>` : ''}` +
      `<p>Find a starting number for the marked stone of each kind:</p><ul class="terms">${list}</ul>` +
      (found.size === WANT.length ? `<p><b>One rule, four fates,</b> and which you get depends only on where the loop starts. Nothing outside is steering.</p><div class="bar"><button class="chip gold" data-do="next">Two hands ▶</button></div>` : '') +
      `</div>`
    );
  }
  if (phase === 2) {
    return (
      `${head}<div class="card"><p>Two dials and no stones. <b>Each round, each dial turns forward by what the other was showing.</b></p><div class="row">${stone(hands[0])}<span class="to">⇄</span>${stone(hands[1], '#b9486e')}</div>` +
      `<div class="bar"><button class="chip" data-do="hands">One round ▶</button><span class="soft">${handsRounds} ${handsRounds === 1 ? 'round' : 'rounds'}</span></div>` +
      (handsRounds >= 3 ? `<p><b>Which of the two is the rule, and which is the thing ruled?</b></p><div class="reasons"><button data-do="top" data-v="0">The blue one is the rule</button><button data-do="top" data-v="1">The red one is the rule</button><button data-do="top" data-v="2">Each is both. There is no top</button></div>` : '') +
      `${said ? `<p class="${said.startsWith('Yes') ? 'good' : 'bad'}">${said}</p>` : ''}</div>`
    );
  }
  if (phase === 3) {
    return (
      `${head}<div class="card"><p>And yet something here was never in play. You changed where the loop started, and how many places a stone had. You never changed what a round <i>is</i>: that it means "turn forward". That is written in this page, underneath, where no stone can reach.</p>` +
      `<p><b>Picture two hands, each drawing the other. What plays that part there?</b></p><div class="reasons"><button data-do="under" data-v="0">The left hand</button><button data-do="under" data-v="1">The paper</button><button data-do="under" data-v="2">The artist, whose own hand is not in the picture</button></div>${said ? `<p class="${said.startsWith('Yes') ? 'good' : 'bad'}">${said}</p>` : ''}</div>`
    );
  }
  return (
    `${head}${bookCard()}<div class="card"><p>One last loop. Here is the map of the Spire, with this chamber at the bottom of it; and in this chamber, the map.</p>${mapInMap(0)}` +
    `<div class="bar"><a class="chip gold" href="../../index.html#from-canon">Step out, into the wood ▶</a><a class="chip" href="./loop.html?practice">Practise the move</a><a class="chip pale" href="./index.html">Back to the map</a></div></div>`
  );
}

if (sh.practising) {
  runPractice(sh, 'Practice · rules that read themselves', 'What will it do?', 'Each of these is a small loop: something whose next state is set by its own present state. Say where it ends up.', KINDS);
} else {
  sh.render = () => (sh.page.innerHTML = chamber());
  sh.on((what, value) => {
    const ring = (v: number) => sh.sound.ctx && sh.sound.note(sh.sound.ctx.currentTime, 0.3, 60 + v * 2, 0, 0, 0.15);
    if (what === 'dial') dial = Number(value);
    else if (what === 'round') {
      const by = phase === 0 ? dial : stones[stones.length - 1];
      stones = stones.map((v) => (v + by) % size);
      rounds++;
      ring(stones[stones.length - 1]);
      if (phase === 1) {
        history.push(stones[stones.length - 1]);
        if (history.length > 9) history = history.slice(-9);
      }
    } else if (what === 'close') {
      phase = 1;
      history = [stones[stones.length - 1]];
      said = '';
    } else if (what === 'set' || what === 'size') {
      if (what === 'size') {
        size = size === 5 ? 6 : 5;
        stones = stones.map((v) => v % size);
      } else stones[stones.length - 1] = (stones[stones.length - 1] + 1) % size;
      const start = stones[stones.length - 1];
      history = [start];
      const kind = judge(start);
      const f = fate(start, (x) => (x * 2) % size, String);
      said = `Starting from ${start}: ${[...f.path, f.path[f.lead]].join(' → ')} … so it ${WANT.find((w) => w[0] === kind)![1]}.`;
      if (!found.has(kind)) {
        found.add(kind);
        sh.sound.chime();
      }
    } else if (what === 'next') {
      phase = 2;
      said = '';
    } else if (what === 'hands') {
      hands = [(hands[0] + hands[1]) % 5, (hands[1] + hands[0]) % 5];
      handsRounds++;
      ring(hands[0]);
    } else if (what === 'top') {
      if (value === '2') {
        phase = 3;
        said = '';
        sh.sound.chime();
      } else said = 'Look again: it turns the other one, and the other one turns it.';
    } else if (what === 'under') {
      if (value === '2') {
        phase = 4;
        said = '';
        sh.finish();
      } else said = 'That is inside the picture, and being drawn. What is doing all the drawing?';
    }
    sh.draw();
  });
  sh.draw();
}
(window as unknown as { spire: Record<string, unknown> }).spire = { ...((window as unknown as { spire?: Record<string, unknown> }).spire ?? {}), check: () => checkKinds(KINDS), chamber: () => ({ phase, found: [...found], size, last: stones[stones.length - 1], done: sh.kept.chapter }) };
