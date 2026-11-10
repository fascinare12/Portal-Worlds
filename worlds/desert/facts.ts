/**
 * What each child practises, and how the game decides what to ask next.
 *
 * Every child has a ladder of levels. Inside a level, each fact sits in a box:
 * box 0 is new or just missed, and each quick correct answer moves it up a box.
 * Facts in low boxes come back after a question or two; facts in high boxes
 * come back much later. That is spaced retrieval practice: the facts a child
 * finds hard are the ones they meet most.
 */

export type ChildId = 'C' | 'R' | 'S';

export type ProblemKind =
  | 'type' // read a sum, type the answer on the number pad
  | 'pickNumeral' // see some bricks, tap the numeral that says how many
  | 'pickPile' // see a numeral, tap the pile with that many bricks
  | 'count'; // see a numeral, tap that many bricks

export interface Problem {
  key: string;
  level: number;
  kind: ProblemKind;
  /** What is shown: a sum such as "7 × 8", or a single numeral. */
  prompt: string;
  answer: number;
  /** For the two "pick" kinds: the numerals or pile sizes on offer. */
  choices?: number[];
  /** For multiplication, the two sides of the array, to draw it after a miss. */
  array?: [number, number];
}

interface Item {
  key: string;
  make(): Omit<Problem, 'key' | 'level'>;
}

interface Level {
  /** A fixed set of facts to master... */
  items?: Item[];
  /** ...or sums made up fresh each time, for levels too big to list. */
  invent?: () => Omit<Problem, 'key' | 'level'>;
}

const rand = (n: number) => Math.floor(Math.random() * n);
const between = (a: number, b: number) => a + rand(b - a + 1);
const shuffle = <T>(list: T[]): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** A number with two near neighbours, in random order, as wrong answers to choose between. */
function withNeighbours(n: number, lowest: number, highest: number): number[] {
  const pool = [n - 2, n - 1, n + 1, n + 2].filter((v) => v >= lowest && v <= highest);
  return shuffle([n, ...shuffle(pool).slice(0, 2)]);
}

// ---- C: matching written numbers to how many bricks there are ----

function cLevel(from: number, to: number): Level {
  const items: Item[] = [];
  for (let n = from; n <= to; n++) {
    items.push({
      key: `C:numeral:${n}`,
      make: () => ({ kind: 'pickNumeral', prompt: String(n), answer: n, choices: withNeighbours(n, 1, Math.max(to, 5)) }),
    });
    items.push({
      key: `C:pile:${n}`,
      make: () => ({ kind: 'pickPile', prompt: String(n), answer: n, choices: withNeighbours(n, 1, Math.max(to, 5)) }),
    });
    items.push({ key: `C:count:${n}`, make: () => ({ kind: 'count', prompt: String(n), answer: n }) });
  }
  return { items };
}

// ---- R: addition and subtraction, one digit, then two, then three ----

const sum = (a: number, b: number): Omit<Problem, 'key' | 'level'> => ({ kind: 'type', prompt: `${a} + ${b}`, answer: a + b });
const diff = (a: number, b: number): Omit<Problem, 'key' | 'level'> => ({ kind: 'type', prompt: `${a} − ${b}`, answer: a - b });

function rLevels(): Level[] {
  const addTo10: Item[] = [];
  const subTo10: Item[] = [];
  const addOver10: Item[] = [];
  const subOver10: Item[] = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      if (a + b <= 10) {
        addTo10.push({ key: `R:${a}+${b}`, make: () => sum(a, b) });
        subTo10.push({ key: `R:${a + b}-${a}`, make: () => diff(a + b, a) });
      } else if (a >= 2 && b >= 2) {
        addOver10.push({ key: `R:${a}+${b}`, make: () => sum(a, b) });
        subOver10.push({ key: `R:${a + b}-${a}`, make: () => diff(a + b, a) });
      }
    }
  }
  /** Add or take away, half and half, keeping totals within `top`. */
  const either = (pickA: () => number, pickB: () => number, top: number) => () => {
    for (;;) {
      const a = pickA();
      const b = pickB();
      if (Math.random() < 0.5 && a + b <= top) return sum(a, b);
      if (a > b) return diff(a, b);
      if (b > a) return diff(b, a);
    }
  };
  return [
    { items: addTo10 },
    { items: subTo10 },
    { items: addOver10 },
    { items: subOver10 },
    { invent: either(() => between(1, 9) * 10, () => between(1, 9) * 10, 100) }, // 30 + 40
    { invent: either(() => between(11, 89), () => between(2, 9), 99) }, // 47 + 5
    { invent: either(() => between(11, 89), () => between(11, 89), 100) }, // 47 + 25
    { invent: either(() => between(1, 9) * 100, () => between(1, 9) * 100, 1000) }, // 300 + 400
    { invent: either(() => between(101, 899), () => between(11, 899), 1000) }, // 347 + 225
  ];
}

// ---- S: times tables to 12, and the division facts that go with them ----

function sLevels(): Level[] {
  const order = [2, 10, 5, 4, 3, 9, 6, 8, 7, 11, 12]; // easiest patterns first
  const seen = new Set<string>();
  return order.map((t) => {
    const items: Item[] = [];
    for (let b = 2; b <= 12; b++) {
      const lo = Math.min(t, b);
      const hi = Math.max(t, b);
      if (seen.has(`${lo}x${hi}`)) continue; // already met in an earlier table, the other way round
      seen.add(`${lo}x${hi}`);
      items.push({
        key: `S:${lo}x${hi}`,
        make: () => {
          const [p, q] = Math.random() < 0.5 ? [lo, hi] : [hi, lo];
          return { kind: 'type', prompt: `${p} × ${q}`, answer: lo * hi, array: [p, q] };
        },
      });
      items.push({
        key: `S:${lo * hi}/${lo}`,
        make: () => {
          const by = Math.random() < 0.5 ? lo : hi;
          return { kind: 'type', prompt: `${lo * hi} ÷ ${by}`, answer: (lo * hi) / by, array: [by, (lo * hi) / by] };
        },
      });
    }
    return { items };
  });
}

const LADDERS: Record<ChildId, Level[]> = {
  C: [cLevel(1, 3), cLevel(4, 5), cLevel(6, 10), cLevel(11, 20)],
  R: rLevels(),
  S: sLevels(),
};

/** Seconds within which an answer counts as known by heart, not worked out. */
const QUICK: Record<ChildId, number> = { C: 6, R: 4, S: 3.5 };
/** How many questions later a fact returns, by box. */
const GAPS = [2, 5, 12, 30, 70];

export interface FactRecord {
  box: number;
  due: number;
}

export interface Progress {
  /** How many questions this child has been asked, ever. */
  asked: number;
  level: number;
  facts: Record<string, FactRecord>;
  /** Recent right-or-wrong on invented sums, by level, newest last. */
  recent: Record<number, number[]>;
}

export const freshProgress = (): Progress => ({ asked: 0, level: 0, facts: {}, recent: {} });

function fromLevel(child: ChildId, p: Progress, index: number): Problem {
  const level = LADDERS[child][index];
  if (level.invent) return { ...level.invent(), key: `${child}:level${index}`, level: index };
  const items = level.items!;
  const record = (it: Item) => p.facts[it.key] ?? { box: 0, due: 0 };
  const due = items.filter((it) => record(it).due <= p.asked);
  let pick: Item;
  if (due.length) {
    // Among facts that are due, take the shakiest.
    const lowest = Math.min(...due.map((it) => record(it).box));
    const shaky = due.filter((it) => record(it).box === lowest);
    pick = shaky[rand(shaky.length)];
  } else {
    // Nothing is due: revisit whichever fact is due soonest.
    pick = [...items].sort((a, b) => record(a).due - record(b).due)[0];
  }
  return { ...pick.make(), key: pick.key, level: index };
}

/** The next thing to ask: mostly the level being learned, sometimes a look back. */
export function nextProblem(child: ChildId, p: Progress): Problem {
  const index = p.level > 0 && Math.random() < 0.25 ? rand(p.level) : p.level;
  return fromLevel(child, p, index);
}

/** A harder question for the sphinx to ask: from the level above, where there is one. */
export function stretchProblem(child: ChildId, p: Progress): Problem {
  return fromLevel(child, p, Math.min(p.level + 1, LADDERS[child].length - 1));
}

export interface Outcome {
  /** Answered fast enough to count as recall. */
  quick: boolean;
  /** This answer finished a level and opened the next. */
  levelUp: boolean;
}

/** Notes how an answer went and moves the child up a level when the current one is solid. */
export function record(child: ChildId, p: Progress, problem: Problem, correct: boolean, seconds: number): Outcome {
  p.asked++;
  const quick = correct && seconds <= QUICK[child];
  const level = LADDERS[child][problem.level];

  if (level.items) {
    const fact = p.facts[problem.key] ?? { box: 0, due: 0 };
    fact.box = correct ? Math.min(GAPS.length - 1, fact.box + (quick ? 2 : 1)) : 0;
    fact.due = p.asked + GAPS[fact.box];
    p.facts[problem.key] = fact;
  } else {
    const list = (p.recent[problem.level] ??= []);
    list.push(correct ? 1 : 0);
    if (list.length > 10) list.shift();
  }

  let levelUp = false;
  if (problem.level === p.level && p.level < LADDERS[child].length - 1) {
    const solid = level.items
      ? level.items.filter((it) => (p.facts[it.key]?.box ?? 0) >= 2).length >= level.items.length * 0.85
      : (p.recent[p.level]?.length ?? 0) >= 10 && p.recent[p.level].reduce((a, b) => a + b, 0) >= 9;
    if (solid) {
      p.level++;
      levelUp = true;
    }
  }
  return { quick, levelUp };
}

/** For the grown-ups' corner: how far along each child is. */
export function summary(child: ChildId, p: Progress): { level: number; levels: number; known: number; facts: number } {
  const ladder = LADDERS[child];
  const all = ladder.flatMap((l) => l.items ?? []);
  return {
    level: p.level + 1,
    levels: ladder.length,
    known: all.filter((it) => (p.facts[it.key]?.box ?? 0) >= 2).length,
    facts: all.length,
  };
}
