/**
 * The Painted Cave: the rules, the deal, and the minds of the computer players.
 *
 * A hunter went out alone and did not come back, and nobody saw what
 * happened. Which beast, at which place, under which moon? Eighteen things
 * could be part of the answer. Three of them, one of each kind, are the truth
 * and are sealed away. Everybody else's paintings are of what they saw for
 * themselves, and so know was NOT it: the beast they tracked all day
 * somewhere else, the place they were standing when nothing came.
 *
 * On a turn a player stands at one place's wall and asks about a beast, that
 * place and a moon. Going round the fire, the first player who has painted
 * any of the three shows the asker one of them, privately. Everybody sees who
 * showed and who could not, and nobody else sees what.
 *
 * Nothing in this file draws anything. The computer players keep the same
 * kind of record a person would, and reason from it honestly: they see only
 * what a player in their seat would see.
 */

export const KINDS = ['beast', 'place', 'moon'] as const;
export const NAMES: string[][] = [
  ['the sabre-tooth', 'the cave bear', 'the hyena', 'the wolf', 'the woolly rhino', 'the mammoth'],
  ['the ford', 'the cliff', 'the marsh', 'the high pass', 'the pines', 'the far cave'],
  ['the dark moon', 'the thin moon', 'the half moon', 'the fat moon', 'the full moon', 'the old moon'],
];
/** Tokens are numbered 0 to 17: six beasts, then six places, then six moons. */
export const kindOf = (token: number) => Math.floor(token / 6);
export const nameOf = (token: number) => NAMES[kindOf(token)][token % 6];
export const SIGNS = ['hand', 'spiral', 'dots', 'zigzag'];

export interface Deal {
  seats: number;
  /** What each seat has painted. */
  hands: number[][];
  /** Left over when the tokens do not divide evenly: painted by the fire, for all to see. */
  hearth: number[];
  /** The truth: a beast, a place and a moon. */
  sealed: [number, number, number];
}

export function deal(rand: () => number, seats: number): Deal {
  const pick = (kind: number) => kind * 6 + Math.floor(rand() * 6);
  const sealed: [number, number, number] = [pick(0), pick(1), pick(2)];
  const rest = Array.from({ length: 18 }, (_, i) => i).filter((t) => !sealed.includes(t));
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const each = Math.floor(rest.length / seats);
  const hands = Array.from({ length: seats }, (_, s) => rest.slice(s * each, (s + 1) * each).sort((a, b) => a - b));
  return { seats, hands, hearth: rest.slice(seats * each).sort((a, b) => a - b), sealed };
}

/** The six places stand in a ring. From one you may stay, or step to either neighbour. From the fire, anywhere. */
export const reach = (at: number): number[] => (at < 0 ? [0, 1, 2, 3, 4, 5] : [at, (at + 1) % 6, (at + 5) % 6]);
/** The other seats, in the order they are asked: round the fire from the asker's left. */
export const round = (asker: number, seats: number) => Array.from({ length: seats - 1 }, (_, i) => (asker + 1 + i) % seats);

/** What everyone at the fire sees of one question. */
export interface Asking {
  asker: number;
  tokens: [number, number, number];
  /** Those who were asked and had nothing to show. */
  could: number[];
  /** The one who showed something, or −1 if nobody did. */
  shower: number;
}

/**
 * What one player knows. For every token, who might hold it: any of the seats, or the sealed place.
 */
export class Mind {
  /** can[token][holder]: holder is a seat, or `seats` for sealed. */
  can: boolean[][];
  private sizes: number[];
  /** "This seat holds at least one of these": learned when it showed something to somebody else. */
  private holdsOne: { seat: number; tokens: number[] }[] = [];
  /** What this player has shown, and to whom: so as to show the same thing again when it can. */
  private gave = new Map<number, Set<number>>();
  constructor(
    public seat: number,
    private seats: number,
    public hand: number[],
    hearth: number[],
    handSize: number,
    /**
     * How hard this player thinks. A keen one counts how many tokens each seat must hold, and remembers
     * "she showed him one of these three". A plain one notes only what it is shown and who had nothing,
     * and half the time asks without much plan: about how a child plays who has just learned the game.
     */
    private keen = false,
  ) {
    this.sizes = Array(seats).fill(handSize);
    this.can = Array.from({ length: 18 }, () => Array(seats + 1).fill(true));
    for (let t = 0; t < 18; t++) {
      if (hand.includes(t)) this.only(t, seat);
      else this.can[t][seat] = false;
      if (hearth.includes(t)) this.can[t].fill(false);
    }
    this.settle();
  }
  private only(token: number, holder: number): void {
    for (let h = 0; h <= this.seats; h++) this.can[token][h] = h === holder;
  }
  /** Somebody showed me this. */
  shown(by: number, token: number): void {
    this.only(token, by);
    this.settle();
  }
  /** Everybody saw this question and who answered it. */
  heard(a: Asking): void {
    for (const s of a.could) for (const t of a.tokens) this.can[t][s] = false;
    if (a.shower >= 0 && a.shower !== this.seat && a.asker !== this.seat) this.holdsOne.push({ seat: a.shower, tokens: [...a.tokens] });
    // Nobody could show any of the three: then whatever the asker does not hold is the truth.
    if (a.shower < 0 && a.asker !== this.seat) for (const t of a.tokens) for (let h = 0; h < this.seats; h++) if (h !== a.asker) this.can[t][h] = false;
    this.settle();
  }
  /** Follow everything that follows, until nothing more does. */
  settle(): void {
    for (let changed = true; changed; ) {
      changed = false;
      const off = (t: number, h: number) => {
        if (this.can[t][h]) {
          this.can[t][h] = false;
          changed = true;
        }
      };
      for (let t = 0; t < 18; t++) {
        const where = this.can[t].map((c, h) => (c ? h : -1)).filter((h) => h >= 0);
        // Sealed for certain: then nothing else of its kind is.
        if (where.length === 1 && where[0] === this.seats) for (let u = kindOf(t) * 6; u < kindOf(t) * 6 + 6; u++) if (u !== t) off(u, this.seats);
      }
      for (let k = 0; k < 3; k++) {
        // Exactly one of each kind is sealed: if only one still could be, it is, and nobody holds it.
        const open = [0, 1, 2, 3, 4, 5].map((i) => k * 6 + i).filter((t) => this.can[t][this.seats]);
        if (open.length === 1) for (let h = 0; h < this.seats; h++) off(open[0], h);
      }
      for (let s = 0; this.keen && s < this.seats; s++) {
        // Each seat holds a known number of tokens.
        const sure: number[] = [];
        const maybe: number[] = [];
        for (let t = 0; t < 18; t++) {
          if (!this.can[t][s]) continue;
          (this.can[t].filter(Boolean).length === 1 ? sure : maybe).push(t);
        }
        if (sure.length === this.sizes[s]) for (const t of maybe) off(t, s);
        else if (sure.length + maybe.length === this.sizes[s]) for (const t of maybe) for (let h = 0; h <= this.seats; h++) if (h !== s) off(t, h);
      }
      for (const c of this.keen ? this.holdsOne : []) {
        const left = c.tokens.filter((t) => this.can[t][c.seat]);
        if (left.length === 1) for (let h = 0; h <= this.seats; h++) if (h !== c.seat) off(left[0], h);
      }
    }
  }
  /** The sealed token of a kind, if this player has worked it out; otherwise −1. */
  answer(kind: number): number {
    const open = [0, 1, 2, 3, 4, 5].map((i) => kind * 6 + i).filter((t) => this.can[t][this.seats]);
    return open.length === 1 ? open[0] : -1;
  }
  solved(): [number, number, number] | null {
    const a = [0, 1, 2].map((k) => this.answer(k));
    return a.every((t) => t >= 0) ? (a as [number, number, number]) : null;
  }
  /** Where to stand and what to ask. */
  ask(at: number, rand: () => number): [number, number, number] {
    const any = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
    const choose = (kind: number, among: number[]) => {
      // Ask about what is still in doubt. Once a kind is settled, ask about one's own painting of it,
      // so that any answer has to be about the other two.
      const doubt = among.filter((t) => this.can[t][this.seats]);
      if (!this.keen && rand() < 0.5) return any(among);
      if (this.answer(kind) < 0 && doubt.length) return any(doubt);
      const mine = among.filter((t) => this.hand.includes(t));
      return mine.length ? any(mine) : doubt.length ? any(doubt) : any(among);
    };
    const all = (kind: number) => [0, 1, 2, 3, 4, 5].map((i) => kind * 6 + i);
    return [choose(0, all(0)), choose(1, reach(at).map((p) => 6 + p)), choose(2, all(2))];
  }
  /** Asked for one of these three: which to show. The same as before, if this asker has already seen one. */
  show(asker: number, tokens: number[]): number {
    const have = tokens.filter((t) => this.hand.includes(t));
    const before = this.gave.get(asker) ?? new Set<number>();
    const pick = have.find((t) => before.has(t)) ?? have[0];
    before.add(pick);
    this.gave.set(asker, before);
    return pick;
  }
}

/** A whole game among computer players only: used to check that the rules and the minds are sound. */
export function selfPlay(seed: number, seats: number, keen = false): { turns: number; winner: number; right: boolean } {
  let s = seed % 2147483647 || 1;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const d = deal(rand, seats);
  const minds = d.hands.map((h, i) => new Mind(i, seats, h, d.hearth, h.length, keen));
  const at = Array(seats).fill(-1);
  for (let turn = 0; turn < 400; turn++) {
    const me = turn % seats;
    const done = minds[me].solved();
    if (done) return { turns: turn, winner: me, right: done.every((t, k) => t === d.sealed[k]) };
    const tokens = minds[me].ask(at[me], rand);
    at[me] = tokens[1] - 6;
    const a: Asking = { asker: me, tokens, could: [], shower: -1 };
    for (const other of round(me, seats)) {
      if (tokens.some((t) => d.hands[other].includes(t))) {
        a.shower = other;
        minds[me].shown(other, minds[other].show(me, tokens));
        break;
      }
      a.could.push(other);
    }
    for (const m of minds) m.heard(a);
  }
  return { turns: 400, winner: -1, right: false };
}

/** Many games played through, to see that every one ends with a right answer. */
export function checkGame(games = 300): string[] {
  const wrong: string[] = [];
  for (const seats of [3, 4]) {
    let total = 0;
    for (let g = 1; g <= games; g++) {
      const r = selfPlay(g * 7919 + seats, seats, g % 2 === 0);
      if (r.winner < 0) wrong.push(`${seats} seats, game ${g}: nobody ever worked it out`);
      else if (!r.right) wrong.push(`${seats} seats, game ${g}: a computer player accused wrongly`);
      total += r.turns;
    }
    const mean = total / games / seats;
    if (!(mean > 2 && mean < 30)) wrong.push(`${seats} seats: games last ${mean} rounds`);
  }
  // The deal itself.
  let s = 5;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (const seats of [3, 4]) {
    const d = deal(rand, seats);
    const all = [...d.hands.flat(), ...d.hearth, ...d.sealed].sort((a, b) => a - b);
    if (all.join() !== Array.from({ length: 18 }, (_, i) => i).join()) wrong.push(`${seats} seats: the deal lost or doubled a token`);
    if (d.sealed.map(kindOf).join() !== '0,1,2') wrong.push('the sealed three should be one of each kind');
  }
  return [...new Set(wrong)].slice(0, 8);
}
