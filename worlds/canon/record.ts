import { draw, row } from './draw';
import type { Skin } from './draw';
import { Shell, checkKinds, choices, numbers, pickOne, runPractice, shuffled } from './shell';
import type { Kind } from './shell';

/**
 * The record that breaks the player: a system strong enough to describe
 * itself, and what that costs it.
 * (Gödel, Escher, Bach: the dialogue "Contracrostipunctus" before chapter IV;
 * chapter IX, "Mumon and Gödel"; chapter XIV, "On Formally Undecidable
 * Propositions of TNT and Related Systems".)
 *
 * The chamber follows the dialogue's idea, not its script. She plays the
 * Tortoise: for each record player the Crab buys, she writes the record that
 * shatters it, by reading how the player is built. A player that refuses
 * some notes survives, and is a poor player. A player that rebuilds itself
 * from each record can still be caught, by a record that is its own
 * reflection. Then, from outside, each piece of the story is matched to its
 * piece of logic; and a short exercise shows how a system's rules can be
 * written down as numbers, which is what lets arithmetic talk about itself.
 */

const sh = new Shell('portal-worlds-spire-record-v1');
const small = (s: string, skin: Skin) => draw(s, skin).replace('class="sym"', 'class="sym" style="width:22px;height:22px;display:inline-flex;vertical-align:middle"');

// ---- The story and the logic, side by side ----

const PAIRS: [string, string][] = [
  ['a record player', 'a formal system: axioms and rules'],
  ['a record', 'a statement written in the system\'s symbols'],
  ['the player plays the record', 'the system proves the statement'],
  ['the player\'s build, written out as a tune', 'the system\'s own rules, written out as numbers'],
  ['a player that refuses some notes', 'a system too weak to describe itself'],
  ['"for every player there is a record it cannot play"', '"for every such system there is a true statement it cannot prove"'],
];

// ---- Practice ----

const TURNS: { id: string; say: string; f: (r: string) => string }[] = [
  { id: 'reverse', say: 'turns the record back to front', f: (r) => [...r].reverse().join('') },
  { id: 'halves', say: 'swaps the record\'s first half with its second', f: (r) => r.slice(r.length / 2) + r.slice(0, r.length / 2) },
  { id: 'pairs', say: 'swaps the 1st note with the 2nd, and the 3rd with the 4th', f: (r) => r[1] + r[0] + r[3] + r[2] },
  { id: 'ends', say: 'swaps the first note with the last', f: (r) => r[3] + r.slice(1, 3) + r[0] },
];
const rows4 = (() => {
  const out: string[] = [];
  for (const a of 'abc') for (const b of 'abc') for (const c of 'abc') for (const d of 'abc') out.push(a + b + c + d);
  return out;
})();
const words = (s: string) => s.replace(/[.,'"“”]/g, '').split(/\s+/).filter(Boolean);
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const FATES = ['True', 'False', 'It cannot be either', 'It could be either, and nothing settles which'];

const KINDS: Kind[] = [
  {
    id: 'code',
    level: 1,
    make(rand, skin) {
      const digits = shuffled(rand, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
      const code: Record<string, number> = { a: digits[0], b: digits[1], c: digits[2] };
      const r = Array.from({ length: 3 + Math.floor(rand() * 2) }, () => pickOne(rand, ['a', 'b', 'c'])).join('');
      const num = (s: string) => Number([...s].map((x) => code[x]).join(''));
      const book = `<p>The code book: ${['a', 'b', 'c'].map((s) => `${small(s, skin)} is <b>${code[s]}</b>`).join(', ')}.</p>`;
      if (rand() < 0.5) {
        const wrong = [num([...r].reverse().join('')), num(r.slice(1) + r[0]), num(r) + 9, Number([...r].map((x) => code[x === 'a' ? 'b' : x === 'b' ? 'a' : 'c']).join(''))];
        return { ask: 'What number is this row?', show: book + row(r, skin, 'small'), ...numbers(rand, num(r), wrong), why: 'Read it off one mark at a time. The row and the number are the same thing in two alphabets.' };
      }
      const others = shuffled(rand, rows4.concat(rows4.map((x) => x.slice(1)))).filter((x) => x.length === r.length && x !== r).slice(0, 3);
      return { ask: `Which row is the number ${num(r)}?`, show: book, ...choices(rand, row(r, skin, 'small'), others.map((x) => row(x, skin, 'small'))), why: 'Any row can be turned into a number and back again, with nothing lost.' };
    },
  },
  {
    id: 'rule',
    level: 2,
    make(rand, skin) {
      const digits = shuffled(rand, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
      const code: Record<string, number> = { a: digits[0], b: digits[1], c: digits[2] };
      const r = Array.from({ length: 2 + Math.floor(rand() * 2) }, () => pickOne(rand, ['a', 'b', 'c'])).join('');
      const num = (s: string) => Number([...s].map((x) => code[x]).join(''));
      const add = pickOne(rand, ['a', 'b', 'c']);
      const other = pickOne(rand, ['a', 'b', 'c'].filter((x) => x !== add));
      const rules: [string, string][] = [
        [`Put ${small(add, skin)} on the end`, r + add],
        [`Put ${small(other, skin)} on the end`, r + other],
        ['Write the whole row twice', r + r],
        ['Take the last mark off', r.slice(0, -1)],
      ];
      const which = Math.floor(rand() * 4);
      const after = num(rules[which][1]);
      const book = `<p>The code book: ${['a', 'b', 'c'].map((s) => `${small(s, skin)} is <b>${code[s]}</b>`).join(', ')}.</p>`;
      return { ask: `Its number went from ${num(r)} to ${after}. Which rule was used on the row?`, show: `${book}<div class="label">The row before</div>${row(r, skin, 'small')}`, ...choices(rand, rules[which][0], rules.filter((_, i) => i !== which).map((x) => x[0])), why: 'Every rule for pushing marks about is also a rule of arithmetic on the numbers. So questions about the marks become questions about numbers.' };
    },
  },
  {
    id: 'match',
    level: 2,
    make(rand) {
      const [story, logic] = pickOne(rand, PAIRS);
      const forward = rand() < 0.5;
      const wrong = shuffled(rand, PAIRS.filter((p) => p[0] !== story)).slice(0, 3).map((p) => (forward ? p[1] : p[0]));
      return { ask: forward ? 'In logic, that is:' : 'In the story of the record players, that is:', show: `<p>${forward ? 'In the story:' : 'In logic:'} <b>${forward ? story : logic}</b></p>`, ...choices(rand, forward ? logic : story, wrong), why: 'The dialogue and the theorem have the same shape. That match is itself an isomorphism, of the kind you practised in Mirrors.' };
    },
  },
  {
    id: 'fixed',
    level: 2,
    make(rand, skin) {
      const turn = pickOne(rand, TURNS);
      const fixed = shuffled(rand, rows4.filter((r) => turn.f(r) === r && new Set(r).size > 1));
      const loose = shuffled(rand, rows4.filter((r) => turn.f(r) !== r));
      // Wrong records that some other machine would be caught by are the tempting ones.
      const tempting = loose.filter((r) => TURNS.some((t) => t.f(r) === r));
      const wrong = [...tempting.slice(0, 2), ...loose.filter((r) => !tempting.slice(0, 2).includes(r))].slice(0, 3);
      return {
        ask: 'Which record shatters it?',
        show: `<p>This player is clever. Before it plays a record it rebuilds itself: it reads the record and ${turn.say}, and that becomes its new build.</p><p>It still shatters if the record it then plays is the same as its build.</p>`,
        outside: `<p class="soft">You need a record that the rebuilding leaves exactly as it was.</p>`,
        ...choices(rand, row(fixed[0], skin, 'small'), wrong.map((r) => row(r, skin, 'small'))),
        why: 'The rebuilding turns this record into itself. However the machine dodges, a record that is its own reflection in that dodge still catches it.',
      };
    },
  },
  {
    id: 'says',
    level: 3,
    make(rand) {
      const makers: (() => [string, number])[] = [
        () => {
          const n = 4 + Math.floor(rand() * 5);
          const s = `This sentence has ${NUM[n]} words.`;
          return [s, words(s).length === n ? 0 : 1];
        },
        () => {
          const n = 5 + Math.floor(rand() * 5);
          const s = `This sentence has fewer than ${NUM[n]} words.`;
          return [s, words(s).length < n ? 0 : 1];
        },
        () => {
          const w = pickOne(rand, ['This', 'That', 'The']);
          return [`The first word of this sentence is "${w}".`, w === 'The' ? 0 : 1];
        },
        () => {
          const w = pickOne(rand, ['not', 'word', 'banana']);
          const no = rand() < 0.5;
          return [`This sentence does ${no ? 'not ' : ''}contain the word "${w}".`, no ? 1 : 0];
        },
        () => [pickOne(rand, ['This sentence is false.', 'This sentence is not true.', 'What this sentence says is untrue.']), 2],
        () => [pickOne(rand, ['This sentence is true.', 'What this sentence says is so.']), 3],
        () => [pickOne(rand, ['The next sentence is true. The sentence before this one is false.', 'The next sentence is false. The sentence before this one is true.']), 2],
      ];
      const [s, fate] = pickOne(rand, makers)();
      return { ask: 'Which is it?', show: `<p style="font-size:20px">${s}</p>`, outside: `<p class="soft">Suppose it is true, and see what follows. Then suppose it is false, and see what follows.</p>`, options: FATES, right: fate, why: ['It says something about itself that you can check, and it checks out.', 'It says something about itself that you can check, and it is wrong.', 'If it is true then it is false, and if it is false then it is true. No answer is stable.', 'If it is true, it is true. If it is false, it is false. Both hold together, and nothing outside it decides.'][fate] };
    },
  },
];

// ---- The chamber ----

const NOTES = ['C', 'D', 'E', 'G', 'A'];
const PITCH: Record<string, number> = { C: 60, D: 62, E: 64, G: 67, A: 69 };
const INK: Record<string, string> = { C: '#c9951c', D: '#5f9a62', E: '#2c7f93', G: '#7a5fa8', A: '#b9486e' };
const dot = (n: string, size = 40) => `<span class="sym" style="background:${INK[n]};width:${size}px;height:${size}px;font-size:${size * 0.5}px;border-radius:50%">${n}</span>`;
interface Player {
  name: string;
  build: string[];
  about: string;
  /** A note it cannot sound at all. */
  deaf?: string;
  /** Rebuilds itself from the record before playing. */
  omega?: boolean;
}
const PLAYERS: Player[] = [
  { name: 'Record Player One', build: ['E', 'G', 'C'], about: 'The Crab is proud of it. It will play any record at all, perfectly.' },
  { name: 'Record Player Two', build: ['A', 'D', 'A'], about: 'The Crab has bought a better one. It, too, will play any record perfectly.' },
  { name: 'The Cautious Player', build: ['G', 'C', 'E'], deaf: 'G', about: 'This one cannot sound the note G at all. The Crab says nothing can hurt it.' },
  { name: 'Record Player Omega', build: ['?', '?', '?'], omega: true, about: 'The Crab\'s masterpiece. It reads each record before playing it, and rebuilds itself as that record back to front, so that it is never built the way the record expects.' },
];
let at = 0;
let slots: string[] = [];
let tries = 0;
let outcome: '' | 'plays' | 'shatters' | 'muffled' = '';
let phase = 0; // 0 the players, 1 matching, 2 numbering, 3 done
const matched: number[] = PAIRS.map(() => -1);
const offered = PAIRS.map((_, i) => shuffled(Math.random, [i, (i + 1 + Math.floor(Math.random() * 2)) % PAIRS.length, (i + 3 + Math.floor(Math.random() * 2)) % PAIRS.length]));
const QUIZ: [string, string[], number, string][] = [
  ['With that code, what number is the row MIU?', ['310', '301', '31'], 0, 'M is 3, I is 1, U is 0.'],
  ['Rule 1 of the MU-puzzle adds a U to any row ending in I. What does that do to MI, which is 31?', ['It becomes 310', 'It becomes 32', 'It becomes 311'], 0, 'Adding a U on the end is multiplying by ten. A rule about letters has become a rule about numbers.'],
  ['"MU cannot be made" now says something about a number. Which?', ['30 can never be reached by these number-rules', '30 is not an even number', 'There is no such number as 30'], 0, 'It is a plain statement of arithmetic, and it is secretly about the MIU-system. Arithmetic can talk about systems of rules; so a system of rules for arithmetic can talk about itself.'],
];
let quizAt = 0;
let quizSaid = '';

function play(): void {
  const p = PLAYERS[at];
  tries++;
  const build = p.omega ? [...slots].reverse() : p.build;
  const same = slots.join() === build.join();
  outcome = p.deaf && slots.includes(p.deaf) ? 'muffled' : same ? 'shatters' : 'plays';
  if (sh.sound.ctx) {
    slots.forEach((n, i) => {
      if (n !== p.deaf) sh.sound.note(sh.sound.ctx!.currentTime + i * 0.3, 0.32, PITCH[n], 0, 0, 0.18);
    });
    if (outcome === 'shatters') setTimeout(() => sh.sound.knock(), 950);
  }
}
function bookCard(): string {
  return `<div class="card book"><h3>In the book</h3>
    <ul class="terms">
      <li>The story is the dialogue <b>Contracrostipunctus</b>. Hofstadter's players and records differ in detail from the ones here; the idea is his. The Crab's line is "high fidelity or low fidelity, he loses either way."</li>
      <li>Writing a system's symbols and rules as numbers is <b>Gödel numbering</b> (chapter IX). It lets a system of arithmetic make statements about itself.</li>
      <li>The book's system of arithmetic is <b>TNT</b>, Typographical Number Theory. The statement Gödel built for it, called <b>G</b>, says in effect: "I am not a theorem of TNT."</li>
      <li>If G could be proved, TNT would have proved something false: it would be <b>inconsistent</b> (the shattered player). If it cannot, then G is true and unprovable: TNT is <b>incomplete</b> (the record it cannot play). This is Gödel's <b>Incompleteness Theorem</b>, 1931.</li>
    </ul>
    <p>Some have argued from this that a mind can do what no machine can, since we can "see" that G is true. Hofstadter disagrees. For him the twist by which a system comes to speak about itself is not the limit of machines but the beginning of selves, and the last step on this map is about that.</p></div>`;
}

function chamber(): string {
  const head = `<div class="kicker">Contracrostipunctus · Chapters IX and XIV</div><h1>The record that breaks the player</h1>`;
  if (!sh.above && phase === 0) {
    const p = PLAYERS[at];
    const build = p.omega && slots.length === 3 ? [...slots].reverse() : p.build;
    const said =
      outcome === 'shatters'
        ? `<p class="good"><b>It shatters.</b> ${p.omega ? 'It rebuilt itself as your record back to front; and your record is the same back to front.' : 'Each part of it rang at its own note until it shook itself apart.'}</p>`
        : outcome === 'muffled'
          ? `<p class="bad"><b>It survives.</b> It skipped the ${p.deaf}, so what came out was not the record you wrote. It is safe from this record, and it cannot play it; nor any other record with a ${p.deaf} in it.</p>`
          : outcome === 'plays'
            ? `<p>It plays. Quite pleasant.${tries >= 2 && !p.omega ? ' <span class="soft">Look at how the player is built. Every part of it rings at one note.</span>' : ''}${tries >= 2 && p.omega ? ' <span class="soft">Whatever you write, it becomes that, reversed. When would a record and its reverse be the same?</span>' : ''}</p>`
            : '';
    const onward = outcome === 'shatters' || (outcome === 'muffled' && p.deaf) ? `<button class="chip gold" data-do="onward">${at < PLAYERS.length - 1 ? 'The Crab buys another ▶' : 'Step outside: press ◉'}</button>` : '';
    return (
      `${head}<p>You are the Tortoise. Your friend the Crab collects record players. You bring him records.</p>` +
      `<div class="card"><div class="kicker">${at + 1} of ${PLAYERS.length} · ${p.name}</div><p>${p.about}</p>` +
      `<div class="label">How it is built: its frame, its arm and its horn each ring at one note</div><div class="row">${build.map((n) => (n === '?' ? `<span class="sym" style="background:#c9c6be;border-radius:50%">?</span>` : dot(n))).join('')}${p.deaf ? `<span class="soft" style="margin-left:8px">cannot sound ${dot(p.deaf, 24)}</span>` : ''}</div>` +
      `<div class="label">Your record: three notes</div><div class="row">${[0, 1, 2].map((i) => (slots[i] ? dot(slots[i]) : `<span class="sym" style="outline:2px dashed #c9c6be"></span>`)).join('')}</div>` +
      `<div class="bar">${NOTES.map((n) => `<button data-do="note" data-v="${n}"${slots.length >= 3 ? ' disabled' : ''}>${dot(n, 44)}</button>`).join('')}</div>` +
      `<div class="bar"><button class="chip" data-do="play"${slots.length < 3 ? ' disabled' : ''}>▶ Play it</button><button class="chip pale" data-do="clear"${slots.length ? '' : ' disabled'}>clear</button>${onward}</div>${said}</div>` +
      (at === 2 && outcome === 'muffled' ? `<div class="card"><p><b>High fidelity or low fidelity, he loses either way.</b> A player good enough to play everything can be made to play the record that breaks it. A player that is safe is safe because there are records it cannot play.</p></div>` : '')
    );
  }
  if (phase === 0) return `${head}<div class="card"><p>Finish with the Crab's record players first; then come back out here.</p></div>`;
  if (phase === 1) {
    const rows = PAIRS.map(([story], i) => {
      const done = matched[i] === i;
      return `<div class="card" style="margin:8px 0;padding:10px 14px"><p style="margin:0 0 6px"><b>${story}</b></p>${done ? `<p class="good" style="margin:0">↔ ${PAIRS[i][1]}</p>` : `<div class="reasons">${offered[i].map((j) => `<button data-do="match" data-v="${i}:${j}"${matched[i] === j ? ' style="outline:3px solid #a23a3a"' : ''}>${PAIRS[j][1]}</button>`).join('')}</div>`}</div>`;
    }).join('');
    return `${head}<p>From out here the story is about something else. The dialogue was written to have the same shape as a theorem of logic. <b>Match each piece of the story to its piece of logic.</b></p>${rows}`;
  }
  const q = QUIZ[Math.min(quizAt, QUIZ.length - 1)];
  const quiz =
    quizAt < QUIZ.length
      ? `<p><b>${q[0]}</b></p><div class="reasons">${q[1].map((o, i) => `<button data-do="quiz" data-v="${i}">${o}</button>`).join('')}</div>${quizSaid ? `<p class="bad">${quizSaid}</p>` : ''}`
      : '';
  return (
    `${head}<div class="card"><p><b>One piece is left: how can a system be made to talk about itself?</b> The Tortoise read the player's build and wrote it down as a tune. Gödel did the same with rules and numbers.</p>` +
    `<p>Take the MU-puzzle, and a code book: <b>M is 3, I is 1, U is 0</b>. Then MI is the number 31.</p>${QUIZ.slice(0, quizAt).map((x) => `<p class="good">${x[0]} <b>${x[1][x[2]]}.</b> <span class="soft">${x[3]}</span></p>`).join('')}${quiz}</div>` +
    (quizAt >= QUIZ.length ? `${bookCard()}<div class="bar"><a class="chip gold" href="./record.html?practice">Practise the move ▶</a><a class="chip pale" href="./index.html">Back to the map</a></div>` : '')
  );
}

if (sh.practising) {
  runPractice(sh, 'Practice · a system that speaks of itself', 'Codes, reflections and sentences', 'Three things to get used to: rows as numbers, records that are their own reflection, and sentences about themselves.', KINDS);
} else {
  sh.render = () => {
    sh.page.innerHTML = chamber();
    sh.call(phase === 1 && !sh.above && matched.some((m, i) => m !== i));
  };
  sh.on((what, value) => {
    if (what === 'note' && slots.length < 3) {
      slots.push(value);
      outcome = '';
      if (sh.sound.ctx) sh.sound.note(sh.sound.ctx.currentTime, 0.25, PITCH[value], 0, 0, 0.16);
    } else if (what === 'clear') {
      slots = [];
      outcome = '';
    } else if (what === 'play') play();
    else if (what === 'onward') {
      if (at < PLAYERS.length - 1) {
        at++;
        slots = [];
        tries = 0;
        outcome = '';
      } else {
        phase = 1;
        sh.above = true;
      }
    } else if (what === 'match') {
      const [i, j] = value.split(':').map(Number);
      matched[i] = j;
      if (matched.every((m, k) => m === k)) phase = 2;
    } else if (what === 'quiz') {
      const q = QUIZ[quizAt];
      if (Number(value) === q[2]) {
        quizAt++;
        quizSaid = '';
        if (quizAt >= QUIZ.length) {
          phase = 3;
          sh.finish();
        }
      } else quizSaid = 'Not that. Use the code book: M is 3, I is 1, U is 0.';
    }
    sh.draw();
  });
  sh.draw();
}
(window as unknown as { spire: Record<string, unknown> }).spire = { ...((window as unknown as { spire?: Record<string, unknown> }).spire ?? {}), check: () => checkKinds(KINDS), chamber: () => ({ at, phase, outcome, quizAt, matched, offered, done: sh.kept.chapter }) };
void numbers;
