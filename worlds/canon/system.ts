/**
 * Small formal systems: a row of symbols, a few rules for rewriting it, and
 * the question "can you get from here to there?".
 *
 * The first of them is Douglas Hofstadter's MIU-system, from chapter I of
 * "Gödel, Escher, Bach". The rest are made here, in families. Every family
 * has one thing that its rules can never change (an invariant). A target that
 * breaks the invariant cannot be reached, however long you work at it from
 * inside; the only way to know that is to step outside and look at the rules.
 */

export type Rule =
  /** Wherever `from` appears, it may be replaced by `to`. */
  | { kind: 'rewrite'; from: string; to: string }
  /** Only at the very end of the row. */
  | { kind: 'end'; from: string; to: string }
  /** Everything after the first symbol is doubled. */
  | { kind: 'double' };

export interface System {
  start: string;
  rules: Rule[];
  /** The row may not grow past this. */
  cap: number;
}

/** Every row that one use of this rule can make, with where the rule was used. */
export function moves(row: string, rule: Rule, cap: number): { at: number; row: string }[] {
  const out: { at: number; row: string }[] = [];
  if (rule.kind === 'double') {
    const next = row[0] + row.slice(1) + row.slice(1);
    if (row.length > 1 && next.length <= cap) out.push({ at: 1, row: next });
  } else if (rule.kind === 'end') {
    if (row.endsWith(rule.from)) {
      const next = row.slice(0, row.length - rule.from.length) + rule.to;
      if (next.length <= cap) out.push({ at: row.length - rule.from.length, row: next });
    }
  } else {
    for (let at = row.indexOf(rule.from); at >= 0; at = row.indexOf(rule.from, at + 1)) {
      const next = row.slice(0, at) + rule.to + row.slice(at + rule.from.length);
      if (next.length <= cap) out.push({ at, row: next });
    }
  }
  return out;
}

/** Everything reachable within `depth` moves, each with the row it came from. */
export function reach(sys: System, depth: number, limit = 4000): Map<string, { from: string | null; steps: number }> {
  const seen = new Map<string, { from: string | null; steps: number }>([[sys.start, { from: null, steps: 0 }]]);
  let edge = [sys.start];
  for (let d = 1; d <= depth && edge.length && seen.size < limit; d++) {
    const next: string[] = [];
    for (const row of edge) {
      for (const rule of sys.rules) {
        for (const m of moves(row, rule, sys.cap)) {
          if (seen.has(m.row)) continue;
          seen.set(m.row, { from: row, steps: d });
          next.push(m.row);
        }
      }
    }
    edge = next;
  }
  return seen;
}
export function pathTo(found: Map<string, { from: string | null }>, target: string): string[] {
  const path: string[] = [];
  for (let at: string | null = target; at !== null; at = found.get(at)?.from ?? null) path.unshift(at);
  return path;
}

/** The MIU-system. */
export const MIU: System = {
  start: 'MI',
  cap: 48,
  rules: [
    { kind: 'end', from: 'I', to: 'IU' },
    { kind: 'double' },
    { kind: 'rewrite', from: 'III', to: 'U' },
    { kind: 'rewrite', from: 'UU', to: '' },
  ],
};

// ---- Things that might never change ----

const count = (row: string, s: string) => row.split(s).length - 1;
/** A claim about a system: `of` is what it measures, and the claim is that this never changes. */
export interface Claim {
  key: string;
  say: (name: (s: string) => string) => string;
  of: (row: string) => string | number;
}
export const CLAIMS = {
  length: (): Claim => ({ key: 'length', say: () => 'The row never gets shorter.', of: (r) => r.length }),
  first: (): Claim => ({ key: 'first', say: () => 'The first one in the row never changes.', of: (r) => r[0] ?? '' }),
  same: (s: string): Claim => ({ key: `same${s}`, say: (n) => `The number of ${n(s)}s never changes.`, of: (r) => count(r, s) }),
  parity: (s: string): Claim => ({ key: `parity${s}`, say: (n) => `The number of ${n(s)}s stays odd, or stays even. It never switches.`, of: (r) => count(r, s) % 2 }),
  threes: (s: string): Claim => ({ key: `threes${s}`, say: (n) => `Sort the ${n(s)}s into threes. Whether any are left over never changes.`, of: (r) => (count(r, s) % 3 === 0 ? 0 : 1) }),
  gap: (a: string, b: string): Claim => ({ key: `gap${a}${b}`, say: (n) => `There are always the same number more ${n(a)}s than ${n(b)}s.`, of: (r) => count(r, a) - count(r, b) }),
  order: (a: string, b: string): Claim => ({
    key: `order${a}${b}`,
    say: (n) => `The ${n(a)}s and the ${n(b)}s never pass each other.`,
    of: (r) => [...r].filter((c) => c === a || c === b).join(''),
  }),
  weight: (a: string, b: string): Claim => ({ key: `weight${a}${b}`, say: (n) => `Count every ${n(b)} as two ${n(a)}s. That total never changes.`, of: (r) => count(r, a) + 2 * count(r, b) }),
};

export interface Family {
  id: string;
  /** How hard: 1 is plain to see, 3 takes some looking. */
  level: 1 | 2 | 3;
  starts: string[];
  rules: Rule[];
  cap: number;
  /** The thing its rules can never change. For `length` the claim is that it never falls. */
  truth: Claim;
  /** Other claims to offer beside the true one. */
  others: Claim[];
}

const rw = (from: string, to: string): Rule => ({ kind: 'rewrite', from, to });
export const FAMILIES: Family[] = [
  { id: 'grow', level: 1, starts: ['ab', 'ba', 'aab'], cap: 9, rules: [rw('a', 'ab'), rw('b', 'ba')], truth: CLAIMS.length(), others: [CLAIMS.same('a'), CLAIMS.parity('b'), CLAIMS.gap('a', 'b')] },
  { id: 'first', level: 1, starts: ['ab', 'acb', 'bcb'], cap: 13, rules: [{ kind: 'double' }, { kind: 'end', from: 'b', to: 'bc' }, rw('cc', '')], truth: CLAIMS.first(), others: [CLAIMS.same('b'), CLAIMS.length(), CLAIMS.parity('c')] },
  { id: 'shuffle', level: 1, starts: ['aabcb', 'abcbc', 'bcaab'], cap: 6, rules: [rw('ab', 'ba'), rw('ba', 'ab'), rw('bc', 'cb'), rw('cb', 'bc')], truth: CLAIMS.same('a'), others: [CLAIMS.order('a', 'b'), CLAIMS.first(), CLAIMS.order('b', 'c')] },
  { id: 'pairs', level: 2, starts: ['ababab', 'aababb', 'babbaa'], cap: 7, rules: [rw('aa', ''), rw('bb', ''), rw('ab', 'ba')], truth: CLAIMS.parity('a'), others: [CLAIMS.same('a'), CLAIMS.first(), CLAIMS.order('a', 'b')] },
  { id: 'lanes', level: 2, starts: ['abcc', 'abacc', 'bacbc'], cap: 6, rules: [rw('ac', 'ca'), rw('bc', 'cb'), rw('ca', 'ac')], truth: CLAIMS.order('a', 'b'), others: [CLAIMS.order('a', 'c'), CLAIMS.first(), CLAIMS.parity('c')] },
  { id: 'gap', level: 2, starts: ['aab', 'aaba', 'baa'], cap: 9, rules: [rw('a', 'aab'), rw('ba', 'ab'), rw('ab', '')], truth: CLAIMS.gap('a', 'b'), others: [CLAIMS.same('a'), CLAIMS.length(), CLAIMS.parity('b')] },
  { id: 'weight', level: 3, starts: ['aaaaaa', 'aabaa', 'babaa'], cap: 8, rules: [rw('aa', 'b'), rw('b', 'aa'), rw('ab', 'ba')], truth: CLAIMS.weight('a', 'b'), others: [CLAIMS.same('a'), CLAIMS.parity('a'), CLAIMS.length()] },
  { id: 'threes', level: 3, starts: ['ab', 'abb', 'abbbb'], cap: 12, rules: [{ kind: 'double' }, rw('bbb', 'c'), rw('cc', ''), { kind: 'end', from: 'b', to: 'bc' }], truth: CLAIMS.threes('b'), others: [CLAIMS.parity('b'), CLAIMS.same('b'), CLAIMS.length()] },
];

export interface Puzzle {
  family: Family;
  system: System;
  target: string;
  /** Whether the target can be reached; and if so, one way. */
  possible: boolean;
  way: string[];
  /** The claims offered as reasons, true one included, in the order shown. */
  reasons: Claim[];
}

/** A small generator of the same numbers every time for the same seed. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makePuzzle(family: Family, rand: () => number): Puzzle {
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const start = pick(family.starts);
  const system: System = { start, rules: family.rules, cap: family.cap };
  const found = reach(system, 9);
  const all = [...found.keys()];
  const letters = [...new Set(family.rules.flatMap((r) => (r.kind === 'double' ? [] : [...r.from, ...r.to])).concat([...start]))];
  const broken = (row: string) => (family.truth.key === 'length' ? row.length < start.length : family.truth.of(row) !== family.truth.of(start));
  let possible = rand() < 0.5;
  let target = '';
  if (!possible) {
    // Something that looks as if it belongs, but breaks the one thing the rules cannot change.
    for (let tries = 0; tries < 400 && !target; tries++) {
      const base = [...pick(all.filter((r) => r.length > 0))];
      const edit = Math.floor(rand() * 3);
      const at = Math.floor(rand() * (base.length + 1));
      if (edit === 0 && base.length > 1) base.splice(Math.min(at, base.length - 1), 1);
      else if (edit === 1) base.splice(at, 0, pick(letters));
      else base[Math.min(at, base.length - 1)] = pick(letters);
      const row = base.join('');
      if (row.length >= 1 && row.length <= family.cap && row !== start && broken(row) && !found.has(row)) target = row;
    }
    if (!target) possible = true;
  }
  if (possible) {
    // At least three moves away where the system allows it; otherwise as far as it goes.
    const deepest = Math.max(...all.map((r) => found.get(r)!.steps));
    const far = all.filter((r) => found.get(r)!.steps >= Math.min(3, deepest) && r.length > 0);
    target = pick(far.length ? far : all.filter((r) => r !== start));
  }
  // Reasons that sound right but are not: claims that do change somewhere among the rows that can be reached.
  const falseOnes = family.others.filter((c) => (c.key === 'length' ? all.some((r) => found.get(r)!.from !== null && r.length < found.get(r)!.from!.length) : new Set(all.map((r) => c.of(r))).size > 1));
  const reasons = [family.truth, ...falseOnes.slice(0, 2)].sort(() => rand() - 0.5);
  return { family, system, target, possible, way: possible ? pathTo(found, target) : [], reasons };
}

/** Checks every family many times over; returns what is wrong, if anything. Used by the test page. */
export function selfCheck(times = 60): string[] {
  const wrong: string[] = [];
  for (const family of FAMILIES) {
    let yes = 0;
    let no = 0;
    for (let i = 0; i < times; i++) {
      const p = makePuzzle(family, seeded(i * 7919 + family.id.length * 13 + 1));
      const wide = reach(p.system, 14, 20000);
      if (p.possible) {
        yes++;
        if (p.way.length - 1 < 3) wrong.push(`${family.id}: only ${p.way.length - 1} moves from ${p.system.start} to ${p.target}`);
        if (!wide.has(p.target) || p.way[p.way.length - 1] !== p.target || p.way[0] !== p.system.start) wrong.push(`${family.id}: says possible, but no way to ${p.target}`);
      } else {
        no++;
        if (wide.has(p.target)) wrong.push(`${family.id}: says impossible, but ${p.target} can be reached from ${p.system.start}`);
      }
      // The true reason must hold for everything reachable; the false ones must not.
      for (const row of wide.keys()) {
        const holds = family.truth.key === 'length' ? row.length >= p.system.start.length : family.truth.of(row) === family.truth.of(p.system.start);
        if (!holds) {
          wrong.push(`${family.id}: the true claim fails at ${row} from ${p.system.start}`);
          break;
        }
      }
      if (p.reasons.length < 2) wrong.push(`${family.id}: fewer than two reasons offered from ${p.system.start}`);
    }
    if (!yes || !no) wrong.push(`${family.id}: only ever ${yes ? 'possible' : 'impossible'}`);
  }
  return [...new Set(wrong)];
}
