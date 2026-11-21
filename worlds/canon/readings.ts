/**
 * Readings: ways of taking a row of meaningless marks as a statement.
 *
 * A row here is one, two or three runs of the same mark with one or two
 * other marks between them: ●●▲●●●■●●●●●. A reading says what the two odd
 * marks mean; under it every row becomes a sentence about numbers, true or
 * false. A reading *fits* a system when every row the system can make comes
 * out true. That fit is what Hofstadter, in chapter II of "Gödel, Escher,
 * Bach", calls an isomorphism, and it is where he says meaning comes from.
 */

import { seeded } from './system';

export interface Reading {
  id: string;
  level: 1 | 2 | 3;
  /** How many runs of marks a row has. */
  runs: 2 | 3;
  /** What the first odd mark means, and the second (if there is one). */
  first: string;
  second?: string;
  holds: (x: number, y: number, z: number) => boolean;
  say: (x: number, y: number, z: number) => string;
}

export const READINGS: Reading[] = [
  { id: 'add', level: 1, runs: 3, first: 'plus', second: 'equals', holds: (x, y, z) => x + y === z, say: (x, y, z) => `${x} plus ${y} equals ${z}` },
  { id: 'less', level: 1, runs: 2, first: 'is less than', holds: (x, y) => x < y, say: (x, y) => `${x} is less than ${y}` },
  { id: 'same', level: 1, runs: 2, first: 'is the same as', holds: (x, y) => x === y, say: (x, y) => `${x} is the same as ${y}` },
  { id: 'next', level: 1, runs: 2, first: 'is one less than', holds: (x, y) => x + 1 === y, say: (x, y) => `${x} is one less than ${y}` },
  { id: 'sub', level: 2, runs: 3, first: 'take away', second: 'leaves', holds: (x, y, z) => x - y === z, say: (x, y, z) => `${x} take away ${y} leaves ${z}` },
  { id: 'double', level: 2, runs: 2, first: 'is half of', holds: (x, y) => x * 2 === y, say: (x, y) => `${x} is half of ${y}` },
  { id: 'more', level: 2, runs: 2, first: 'is more than', holds: (x, y) => x > y, say: (x, y) => `${x} is more than ${y}` },
  { id: 'max', level: 2, runs: 3, first: 'and', second: 'the larger is', holds: (x, y, z) => Math.max(x, y) === z, say: (x, y, z) => `${x} and ${y}: the larger is ${z}` },
  { id: 'mul', level: 3, runs: 3, first: 'times', second: 'equals', holds: (x, y, z) => x * y === z, say: (x, y, z) => `${x} times ${y} equals ${z}` },
  { id: 'min', level: 3, runs: 3, first: 'and', second: 'the smaller is', holds: (x, y, z) => Math.min(x, y) === z, say: (x, y, z) => `${x} and ${y}: the smaller is ${z}` },
  { id: 'divides', level: 3, runs: 2, first: 'goes exactly into', holds: (x, y) => y % x === 0, say: (x, y) => `${x} goes exactly into ${y}` },
];

export type Triple = [number, number, number];
export interface MirrorPuzzle {
  /** The reading that fits. */
  truth: Reading;
  /** 'read': pick the reading that fits. 'use': pick the row that also belongs. */
  kind: 'read' | 'use';
  /** Rows the system makes. */
  shown: Triple[];
  /** For 'read': the readings offered. */
  options: Reading[];
  /** For 'use': the rows offered, one of which belongs. */
  rows: Triple[];
  /** Which symbol plays the repeated mark, the first odd mark and the second. */
  marks: [string, string, string];
}

const TOP = 8; // no run is longer than this, so that a whole row fits across a phone
/** Every statement the reading could be asked about, with small numbers. */
function all(runs: 2 | 3): Triple[] {
  const out: Triple[] = [];
  for (let x = 1; x <= (runs === 3 ? 5 : 6); x++) for (let y = 1; y <= (runs === 3 ? 5 : TOP); y++) for (let z = 1; z <= (runs === 3 ? TOP : 1); z++) out.push([x, y, runs === 3 ? z : 0]);
  return out;
}
export const fits = (r: Reading, t: Triple) => r.holds(t[0], t[1], t[2]);
export function asRow(t: Triple, runs: 2 | 3, marks: [string, string, string]): string {
  return marks[0].repeat(t[0]) + marks[1] + marks[0].repeat(t[1]) + (runs === 3 ? marks[2] + marks[0].repeat(t[2]) : '');
}

export function makeMirror(truth: Reading, rand: () => number, kind: 'read' | 'use' = rand() < 0.5 ? 'read' : 'use'): MirrorPuzzle {
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const shuffle = <T,>(list: T[]) => [...list].sort(() => rand() - 0.5);
  const space = all(truth.runs);
  const yes = space.filter((t) => fits(truth, t));
  const rivals = READINGS.filter((r) => r.runs === truth.runs && r.id !== truth.id);
  const marks = shuffle(['a', 'b', 'c']) as [string, string, string];
  for (let tries = 0; tries < 200; tries++) {
    const others = shuffle(rivals).slice(0, 2);
    // Begin with a row that a wrong reading also fits, if there is one: the first look should not settle it.
    const trap = yes.filter((t) => others.some((r) => fits(r, t)));
    const shown: Triple[] = [];
    if (trap.length) shown.push(pick(trap));
    // Five rows where the system has that many to spare; always one kept back to ask about.
    const want = Math.min(5, yes.length - 1);
    while (shown.length < want) {
      const t = pick(yes);
      if (!shown.some((s) => s.join() === t.join())) shown.push(t);
    }
    if (shown.length < 3) continue;
    // Every wrong reading must fail on at least one of the rows shown.
    if (others.some((r) => shown.every((t) => fits(r, t)))) continue;
    const no = space.filter((t) => !fits(truth, t));
    const belongs = yes.filter((t) => !shown.some((s) => s.join() === t.join()));
    if (!belongs.length || no.length < 3) continue;
    // Wrong rows that a rival reading would let in are the tempting ones.
    const tempting = shuffle(no.filter((t) => others.some((r) => fits(r, t))));
    const plain = shuffle(no);
    const wrong: Triple[] = [];
    for (const t of [...tempting.slice(0, 2), ...plain]) if (wrong.length < 3 && !wrong.some((w) => w.join() === t.join())) wrong.push(t);
    return { truth, kind, shown: [shown[0], ...shuffle(shown.slice(1))], options: shuffle([truth, ...others]), rows: shuffle([pick(belongs), ...wrong]), marks };
  }
  throw new Error(`no puzzle for ${truth.id}`);
}

/** Makes many puzzles for every reading and checks them; returns what is wrong, if anything. */
export function checkReadings(times = 80): string[] {
  const wrong: string[] = [];
  for (const truth of READINGS) {
    for (let i = 0; i < times; i++) {
      for (const kind of ['read', 'use'] as const) {
        const p = makeMirror(truth, seeded(i * 104729 + truth.id.length * 31 + (kind === 'use' ? 7 : 0)), kind);
        if (!p.shown.every((t) => fits(truth, t))) wrong.push(`${truth.id}: a shown row is not true`);
        const fitting = p.options.filter((r) => p.shown.every((t) => fits(r, t)));
        if (fitting.length !== 1 || fitting[0].id !== truth.id) wrong.push(`${truth.id}: ${fitting.length} readings fit the rows shown`);
        if (p.rows.filter((t) => fits(truth, t)).length !== 1) wrong.push(`${truth.id}: not exactly one offered row belongs`);
        if (p.rows.length !== 4 || p.options.length !== 3) wrong.push(`${truth.id}: wrong number of choices`);
        if ([...p.shown, ...p.rows].some((t) => Math.max(...t) > TOP)) wrong.push(`${truth.id}: a run is too long`);
      }
    }
  }
  return [...new Set(wrong)];
}
