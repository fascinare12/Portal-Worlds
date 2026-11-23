/**
 * The arithmetic of stage F: amplitudes, which are little arrows that add
 * before they are squared; and decoherence, which is what happens to the
 * adding when something else keeps a record. With the checks that guard them.
 */

// ---- Arrows: numbers with a size and a direction ----

/** An arrow, as how far it points across and how far up. */
export type Arrow = [number, number];
export const plus = (a: Arrow, b: Arrow): Arrow => [a[0] + b[0], a[1] + b[1]];
/** Multiplying two arrows: the sizes multiply and the turns add. */
export const times = (a: Arrow, b: Arrow): Arrow => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
/** An arrow of a given length, turned by a number of whole turns. */
export const arrow = (length: number, turns: number): Arrow => [length * Math.cos(2 * Math.PI * turns), length * Math.sin(2 * Math.PI * turns)];
/** The square of an arrow's length: the probability it stands for. */
export const squared = (a: Arrow) => a[0] * a[0] + a[1] * a[1];

/**
 * Two ways to reach a detector, each with an arrow of length ½. The second is longer by some
 * number of wavelengths, which turns its arrow by that many turns. The chance of arriving.
 */
export function twoWays(extra: number, blocked = false): number {
  return squared(blocked ? arrow(0.5, 0) : plus(arrow(0.5, 0), arrow(0.5, extra)));
}

// ---- Two slits and a screen ----

/**
 * How likely a particle is to land at x on the screen (x from −1 to 1), up to a constant.
 * gap sets how many bright bands fit; clear is how fully the two ways interfere (1: wholly; 0: not at all).
 */
export function lands(x: number, gap: number, clear = 1): number {
  const each = Math.exp(-(x * x) / (2 * 0.42 * 0.42));
  return each * (1 + clear * Math.cos(2 * Math.PI * gap * x));
}

// ---- A record kept by something else ----

/**
 * The thing that bounced off is left in one state if the particle went one way and another if it went
 * the other. How alike those two states are (1: identical; 0: wholly different) is all that matters:
 * it is the fraction of the interference that survives.
 */
export const survives = (alike: number) => alike;
/** How well the two ways could be told apart by examining the thing that bounced off, at best. */
export const tells = (alike: number) => Math.sqrt(Math.max(0, 1 - alike * alike));
/** What survives after many independent bounces, each leaving states that alike. */
export const after = (bounces: number, alike: number) => Math.pow(alike, bounces);

/**
 * How long an object can stay in two places a distance of its own size apart, in seconds, before
 * what surrounds it has recorded which. Order-of-magnitude estimates from Schlosshauer,
 * "Quantum decoherence", Physics Reports 831 (2019), table 1, after Joos and Zeh (1985).
 */
export const LASTS: Record<'grain' | 'molecule', Record<'air' | 'vacuum' | 'warm' | 'oldest', number>> = {
  grain: { air: 1e-31, vacuum: 1e-14, warm: 1e-18, oldest: 1 },
  molecule: { air: 1e-19, vacuum: 1e-2, warm: 1e6, oldest: 1e24 },
};
/** The fraction of the interference left after a time, when it would last that long. */
export const left = (seconds: number, lasts: number) => Math.exp(-seconds / lasts);

// ---- The checks ----

export function checkQuantum(): string[] {
  const wrong: string[] = [];
  const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

  // Arrows. A quarter-turn done twice is a half-turn: i × i = −1. Multiplying adds the turns and multiplies the sizes.
  const i: Arrow = [0, 1];
  const ii = times(i, i);
  if (!close(ii[0], -1) || !close(ii[1], 0)) wrong.push('i times i');
  for (const [p, q] of [[0.1, 0.3], [0.4, 0.45], [0.9, 0.25]]) {
    const product = times(arrow(2, p), arrow(3, q));
    const direct = arrow(6, p + q);
    if (!close(product[0], direct[0]) || !close(product[1], direct[1])) wrong.push('multiplying arrows');
  }
  if (!close(squared([3, 4]), 25)) wrong.push('the size of an arrow');

  // Two ways: by arrows, against the known formula cos²(half the angle between them).
  for (let extra = 0; extra <= 2; extra += 0.05) if (!close(twoWays(extra), Math.cos(Math.PI * extra) ** 2)) wrong.push(`two ways at ${extra}`);
  if (!close(twoWays(0), 1) || !close(twoWays(0.5), 0) || !close(twoWays(0.5, true), 0.25) || !close(twoWays(0.25), 0.5)) wrong.push('two ways: the cases in the chamber');

  // Interference moves probability about and makes none: over the whole screen the total is the same with or without it.
  const total = (gap: number, clear: number) => {
    let sum = 0;
    for (let x = -3; x <= 3; x += 0.0005) sum += lands(x, gap, clear) * 0.0005;
    return sum;
  };
  for (const gap of [3, 5, 8]) if (!close(total(gap, 1), total(gap, 0), 1e-4)) wrong.push(`the screen's total at ${gap}`);

  // A record. Write out particle-and-bouncer in full: the particle goes two ways, and the bouncer is left
  // in one of two states, an angle apart. The contrast of the pattern must be how alike those states are.
  for (const angle of [0, 0.3, 0.9, 1.2, Math.PI / 2]) {
    const a = [1, 0];
    const b = [Math.cos(angle), Math.sin(angle)];
    const alike = a[0] * b[0] + a[1] * b[1];
    // The chance of arriving, for each turn of the second way, summed over what the bouncer might be found doing.
    let most = 0;
    let least = 1;
    for (let turn = 0; turn < 1; turn += 0.01) {
      const second = arrow(0.5, turn);
      let chance = 0;
      for (const k of [0, 1]) chance += squared(plus([0.5 * a[k], 0], [second[0] * b[k], second[1] * b[k]]));
      most = Math.max(most, chance);
      least = Math.min(least, chance);
    }
    if (!close((most - least) / (most + least), survives(alike), 2e-3)) wrong.push(`the contrast at ${angle}`);
    // And the best anyone could do at telling the two ways apart from the bouncer alone, by trying every way of looking.
    let best = 0;
    for (let look = 0; look < Math.PI; look += 0.001) {
      const m = [Math.cos(look), Math.sin(look)];
      const hitA = (a[0] * m[0] + a[1] * m[1]) ** 2;
      const hitB = (b[0] * m[0] + b[1] * m[1]) ** 2;
      best = Math.max(best, Math.abs(hitA - hitB));
    }
    if (!close(best, tells(alike), 2e-3)) wrong.push(`telling the ways apart at ${angle}: ${best} against ${tells(alike)}`);
    if (!close(survives(alike) ** 2 + tells(alike) ** 2, 1)) wrong.push('contrast and knowledge');
  }
  // Many bounces: the likenesses multiply.
  if (!close(after(3, 0.9), 0.9 * 0.9 * 0.9) || !close(after(10, 0.5), 1 / 1024)) wrong.push('many bounces');
  // And many gentle ones fade it like an exponential.
  if (!close(after(100000, 1 - 1e-5), Math.exp(-1), 1e-4)) wrong.push('gentle bounces');
  if (!close(left(1e-31, 1e-31), Math.exp(-1))) wrong.push('how much is left');
  if (!(LASTS.grain.air < LASTS.grain.warm && LASTS.grain.warm < LASTS.grain.vacuum && LASTS.grain.vacuum < LASTS.grain.oldest && LASTS.molecule.oldest > LASTS.grain.oldest)) wrong.push('the table of times');
  return wrong;
}

// ---- Two things that share one state ----

/**
 * Two photons made together so that their polarisations match. Each meets a filter set at some
 * angle (in degrees). The chance that they do the same thing: both pass, or both are stopped.
 */
export const agree = (degreesApart: number) => Math.cos((degreesApart * Math.PI) / 180) ** 2;
/** The three settings each filter can be turned to, in degrees. */
export const SETTINGS = [0, 60, 120];
/**
 * Suppose instead each pair left with instructions: for each of the three settings, pass (true) or
 * stop. How often two such photons do the same thing, over the six ways the settings can differ.
 */
export function planAgrees(plan: boolean[]): number {
  let same = 0;
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (a !== b && plan[a] === plan[b]) same++;
  return same / 6;
}

export function checkEntangled(): string[] {
  const wrong: string[] = [];
  const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;
  // The shared state, written out: an arrow of 1/√2 for "both upright" and for "both level", none for the mixed cases.
  // A filter at angle t passes a photon with arrow (cos t, sin t) against (upright, level), and stops (−sin t, cos t).
  const both = (a: number, b: number) => {
    const ra = (a * Math.PI) / 180;
    const rb = (b * Math.PI) / 180;
    const ends: [number[], number[]] = [[Math.cos(ra), Math.sin(ra)], [-Math.sin(ra), Math.cos(ra)]];
    const ends2: [number[], number[]] = [[Math.cos(rb), Math.sin(rb)], [-Math.sin(rb), Math.cos(rb)]];
    // The chance of each of the four outcomes: (first passes or stops) × (second passes or stops).
    return ends.map((x) => ends2.map((y) => ((x[0] * y[0] + x[1] * y[1]) / Math.SQRT2) ** 2));
  };
  for (const a of [0, 17, 60, 120]) for (const b of [0, 33, 60, 120, 150]) {
    const p = both(a, b);
    if (!close(p[0][0] + p[1][1], agree(a - b))) wrong.push(`agreeing at ${a}, ${b}`);
    if (!close(p[0][0] + p[0][1] + p[1][0] + p[1][1], 1)) wrong.push('the chances do not add to one');
    // What one side sees does not depend on the other side's setting: no message can be sent.
    if (!close(p[0][0] + p[0][1], 0.5) || !close(p[0][0] + p[1][0], 0.5)) wrong.push(`one side alone at ${a}, ${b}`);
  }
  if (!close(agree(0), 1) || !close(agree(60), 0.25) || !close(agree(120), 0.25) || !close(agree(90), 0)) wrong.push('the settings in the chamber');
  // Every possible set of instructions, tried: none agrees less than a third of the time when settings differ.
  let least = 1;
  for (let i = 0; i < 8; i++) least = Math.min(least, planAgrees([!!(i & 1), !!(i & 2), !!(i & 4)]));
  if (!close(least, 1 / 3)) wrong.push(`the best instructions can do: ${least}`);
  if (!(agree(60) < least)) wrong.push('the quantum result should fall below every set of instructions');
  // The same thing in the form physicists test (Clauser, Horne, Shimony and Holt): instructions cannot beat 2; these photons reach 2√2.
  let best = 0;
  for (let i = 0; i < 16; i++) {
    const [a0, a1, b0, b1] = [0, 1, 2, 3].map((k) => (i & (1 << k) ? 1 : -1));
    best = Math.max(best, Math.abs(a0 * b0 + a0 * b1 + a1 * b0 - a1 * b1));
  }
  const tie = (a: number, b: number) => 2 * agree(a - b) - 1;
  const quantum = tie(0, 22.5) + tie(0, -22.5) + tie(45, 22.5) - tie(45, -22.5);
  if (best !== 2 || !close(quantum, 2 * Math.SQRT2)) wrong.push(`the bound of 2: ${best}, and the photons' ${quantum}`);
  return wrong;
}
