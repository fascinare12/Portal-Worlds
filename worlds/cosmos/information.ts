import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS, hole as holeArt, stars } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { SUN_KG, bits, checkEdges, hawking, holeBits, holeGlow, holeLife, page, ways } from './edges';
import { frac, tidy } from './physics';

/**
 * Information and black holes.
 *
 * The last chamber, and the one furthest from anything measured. Three
 * well-tested theories meet at a black hole's horizon and do not agree.
 * Thermodynamics says a black hole must have entropy; and it does, in
 * proportion to its area. Anything with entropy has a temperature and must
 * glow; and the theory says it does, and so slowly evaporates. But the glow
 * comes out random, which would destroy the record of everything that fell
 * in, and quantum physics does not allow records to be destroyed.
 *
 * Almost none of this has been observed. So the chamber sorts every claim as
 * it goes: observed, predicted, or argued over. As this was written, in
 * November 2026, the central question is open.
 *
 * Three figures: coins, for counting arrangements; a black hole of any mass,
 * with its entropy, glow and lifetime; and the entropy of what comes out, by
 * two reckonings.
 */

const sh = new Shell('portal-worlds-cosmos-information-v1');
const ASOF = 'November 2026';
const COINS = 20;
const SWITCHES = 40;

function big(x: number): string {
  if (x >= 1e6 || x < 1e-3) {
    const e = Math.floor(Math.log10(x));
    const m = x / 10 ** e;
    return `${Math.round(m) === 1 && Math.abs(m - 1) < 0.05 ? '' : `${tidy(Math.round(m * 10) / 10)} × `}10<sup>${String(e).replace('-', '−')}</sup>`;
  }
  return x >= 100 ? Math.round(x).toLocaleString() : tidy(Number(x.toPrecision(2)));
}

// ---- Practice ----

/** 0: observed or measured. 1: predicted by well-tested theory, not observed. 2: conjectured, or argued over. */
const STANDING: [string, number, string][] = [
  ['When two black holes merge, the final horizon is at least as large in area as the two before', 0, 'Predicted by Hawking in 1971 and checked against gravitational-wave signals, most sharply with a loud one recorded in January 2025.'],
  ['Two particles can share a state such that neither has one of its own (entanglement)', 0, 'Measured in thousands of experiments since the 1970s; the 2022 Nobel Prize was for it.'],
  ['Heat flows from hot to cold, and entropy does not decrease', 0, 'The second law of thermodynamics: among the best-tested statements in all of science.'],
  ['A black hole glows faintly, with a temperature that is higher the lighter it is', 1, 'Hawking\'s 1974 result follows from theories that are each well tested. For any known black hole the glow is far too faint to detect.'],
  ['A black hole\'s entropy is a quarter of its horizon\'s area, in the smallest units', 1, 'It follows from the same reasoning as the glow, and several independent calculations agree. It has not been measured.'],
  ['A black hole left alone will eventually evaporate entirely', 1, 'It follows if the glow is real. The time needed is vastly longer than the age of the universe.'],
  ['The information about what fell in comes back out in the radiation', 2, 'Most physicists now expect so, and calculations since 2019 support it. How it comes out is not understood, and no experiment bears on it.'],
  ['Everything in a region of space can be described by information on its boundary (the holographic principle), in our universe', 2, 'There is an exact example in a universe shaped differently from ours. Whether it holds for ours is not known.'],
  ['Entangled black holes are joined by a wormhole', 2, 'A conjecture from 2013. It is taken seriously, and it is far from established.'],
];
const STANDING_WORDS = ['Observed or measured', 'Predicted by well-tested theory, not observed', 'Conjectured, or argued over'];
const IDEAS: [string, string, string[], string][] = [
  ['What is entropy?', 'A count of how many hidden arrangements fit what is seen, expressed as a logarithm', ['A kind of energy', 'A measure of how hot something is', 'Disorder, which cannot be counted'], 'A hundred coins with fifty heads can be arranged in vastly more ways than a hundred all heads. Entropy is the logarithm of that number, and in base 2 it is counted in bits.'],
  ['Why is the entropy of a black hole a surprise?', 'It goes as the area of the horizon, not the volume inside', ['It is zero', 'It is infinite', 'It is the same for every black hole'], 'For everything else, the number of arrangements goes up with volume. A black hole holds the most entropy that can fit in a region, and that maximum goes as the surface.'],
  ['Why is the randomness of a black hole\'s glow a problem?', 'Quantum physics never destroys information, and purely random radiation would', ['Random radiation is dangerous', 'It makes the black hole heavier', 'It is not: randomness is normal'], 'In chamber 17, interference lost to the surroundings was carried away, not destroyed. Every known quantum process can in principle be run backwards. A black hole that turned everything into featureless heat would be the one exception.'],
  ['Has the black hole information problem been solved?', 'Not fully. Calculations since 2019 show the radiation\'s entropy turning over as it should, but how the information gets out is not understood', ['Yes, in 1974', 'Yes, by experiment', 'No, and nobody works on it'], 'The Page curve has been derived in simplified models from gravity\'s own equations. That was real progress. It is not the same as knowing the mechanism, and nothing has been tested.'],
  ['Could we detect the glow of a real black hole?', 'Not with anything known: a black hole of the Sun\'s mass is colder than the oldest light, and takes in more than it gives out', ['Yes, the Event Horizon Telescope has', 'Yes, with any radio telescope', 'Only during an eclipse'], 'At 60 billionths of a degree it is far colder than the 2.7 K sky around it. Effects like it have been seen in laboratory stand-ins, flowing fluids with a "horizon" for sound, and how much those show is itself debated.'],
  ['The holographic principle says a region\'s contents can be described on its boundary. Does that mean the world is an illusion?', 'No: it is a claim that two mathematical descriptions are equivalent', ['Yes', 'Yes, and this has been shown', 'It means space does not exist'], 'A hologram is a flat plate that fully encodes a scene with depth. The claim is that a theory with gravity might be exactly rewritten as one without, in one direction fewer. Neither description would be the "fake" one.'],
];

const EXAMPLES: Record<string, string> = {
  bits: '<p>A lock has <b>64</b> equally likely settings. How many bits of entropy is that?</p><ol><li>A bit is one yes-or-no question. Each one halves what is left.</li><li>64 → 32 → 16 → 8 → 4 → 2 → 1: six halvings.</li><li><b>6 bits.</b> (2⁶ = 64, so log₂ 64 = 6.)</li></ol><p>Entropy is the logarithm of the number of arrangements. Doubling the arrangements adds one bit.</p>',
  ways: '<p><b>5 coins</b> are tossed. How many different arrangements of heads and tails are there in all?</p><ol><li>Each coin has 2 possibilities, independently.</li><li>2 × 2 × 2 × 2 × 2 = <b>32</b>.</li></ol><p>Only 1 of those is all heads; 10 have exactly two heads. "Two heads" is a description that many arrangements fit, and so has more entropy.</p>',
  area: '<p>A black hole\'s entropy goes as the area of its horizon, and the horizon\'s radius goes as the mass. What happens to the entropy when the mass is <b>3 times</b> as great?</p><ol><li>The radius is 3 times as great.</li><li>The area goes as the radius squared: 3 × 3 = 9.</li><li><b>9 times</b> the entropy.</li></ol>',
  glow: '<p>A black hole\'s temperature goes as 1 over its mass, and its lifetime as its mass cubed. What of a hole with <b>half</b> the mass?</p><ol><li>Temperature: 1 ÷ ½ = <b>twice as hot</b>.</li><li>Lifetime: ½ × ½ × ½ = <b>1/8 as long</b>.</li></ol><p>So as a hole shrinks it heats up and shrinks faster: evaporation runs away at the end.</p>',
  standing: '<p>Sort each claim by two questions.</p><ol><li><b>Has it been measured or observed?</b> If so: observed.</li><li>If not: <b>does it follow from well-tested theory, with general agreement?</b> If so: predicted. If physicists are still arguing: conjectured.</li></ol><p>At this edge, very little is in the first group, and it matters to know which.</p>',
  curve: '<p>A black hole is modelled as <b>10</b> switches, which it gives up one at a time. After <b>7</b> have come out, what is the entropy of the radiation, if information is kept?</p><ol><li>While less than half is out, the radiation\'s entropy is the number of switches out.</li><li>Past half, it is the number still <i>in</i>: 10 − 7 = <b>3 bits</b>.</li></ol><p>Hawking\'s reckoning would say 7 and rising. The two agree until half-way and then part.</p>',
  idea: '<p>What to hold on to.</p><ol><li>Entropy counts hidden arrangements, in bits.</li><li>A black hole\'s entropy goes as its <i>area</i>: a strange and central fact.</li><li>So it has a temperature, glows, and evaporates: predicted, never observed.</li><li>The glow looks random, which would destroy information; quantum physics forbids that. This is the paradox, and it is not settled.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'bits',
    level: 1,
    make(rand) {
      const n = 2 + Math.floor(rand() * 9);
      return { ask: 'How many bits of entropy is that?', show: `<p>Something could be in any of <b>${(2 ** n).toLocaleString()}</b> arrangements, all equally likely, and you cannot tell which.</p>`, outside: `<p class="soft">How many times must it be halved to get down to 1?</p>`, ...numbers(rand, n, [2 ** n, n * 2, n - 1, n + 1]), why: `2 multiplied by itself ${n} times is ${(2 ** n).toLocaleString()}, so it takes ${n} yes-or-no questions to find out which.` };
    },
  },
  {
    id: 'ways',
    level: 1,
    make(rand) {
      const n = 3 + Math.floor(rand() * 6);
      const all = rand() < 0.5;
      return all
        ? { ask: 'How many different arrangements are there in all?', show: `<p><b>${n} coins</b> lie in a row, each heads or tails.</p>`, ...numbers(rand, 2 ** n, [n * 2, n * n, 2 ** (n - 1), 2 ** (n + 1)]), why: `Two possibilities for each of ${n} coins: ${Array(n).fill(2).join(' × ')} = ${2 ** n}.` }
        : { ask: 'How many arrangements have exactly one head?', show: `<p><b>${n} coins</b> lie in a row, each heads or tails.</p>`, ...numbers(rand, n, [1, 2 ** n, n * 2, n - 1]), why: `The one head can be any of the ${n} coins: ${n} arrangements. "All tails" has only 1; "half heads" has ${ways(n, Math.floor(n / 2))}.` };
    },
  },
  {
    id: 'area',
    level: 2,
    make(rand) {
      const k = pickOne(rand, [2, 3, 10, 100]);
      return { ask: 'How does its entropy compare?', show: `<p>A black hole's entropy goes as the area of its horizon, and the horizon's radius goes in step with the mass.</p><p>One black hole has <b>${k} times</b> the mass of another.</p>`, ...choices(rand, `${(k * k).toLocaleString()} times as much`, [`${k} times as much`, `${(k ** 3).toLocaleString()} times as much`, 'The same']), why: `${k} times the radius, so ${k} × ${k} = ${(k * k).toLocaleString()} times the area. For ordinary things entropy would go with the volume, ${(k ** 3).toLocaleString()} times; that it does not is the surprise.` };
    },
  },
  {
    id: 'glow',
    level: 2,
    make(rand) {
      const k = pickOne(rand, [2, 3, 10]);
      const heavy = rand() < 0.5;
      const temp = rand() < 0.5;
      const rule = `<p>A black hole's temperature goes as 1 over its mass. Its lifetime goes as its mass cubed.</p>`;
      return temp
        ? { ask: 'How does its temperature compare?', show: `${rule}<p>One black hole has <b>${heavy ? `${k} times` : frac(1, k)}</b> the mass of another.</p>`, ...choices(rand, heavy ? `${frac(1, k)} as hot` : `${k} times as hot`, [heavy ? `${k} times as hot` : `${frac(1, k)} as hot`, heavy ? `${frac(1, k * k)} as hot` : `${k * k} times as hot`, 'The same']), why: heavy ? `Heavier is colder: ${frac(1, k)} the temperature.` : `Lighter is hotter: ${k} times the temperature.` }
        : { ask: 'How does its lifetime compare?', show: `${rule}<p>One black hole has <b>${heavy ? `${k} times` : frac(1, k)}</b> the mass of another.</p>`, ...choices(rand, heavy ? `${(k ** 3).toLocaleString()} times as long` : `${frac(1, k ** 3)} as long`, [heavy ? `${k} times as long` : `${frac(1, k)} as long`, heavy ? `${k * k} times as long` : `${frac(1, k * k)} as long`, heavy ? `${frac(1, k ** 3)} as long` : `${(k ** 3).toLocaleString()} times as long`]), why: `${k} × ${k} × ${k} = ${(k ** 3).toLocaleString()}. ${heavy ? 'Heavy holes last immensely longer.' : 'Light holes go quickly, and faster as they shrink.'}` };
    },
  },
  {
    id: 'standing',
    level: 2,
    make(rand) {
      const [what, where, why] = pickOne(rand, STANDING);
      return { ask: `What is its standing, as of ${ASOF}?`, show: `<p><b>${what}.</b></p>`, outside: `<p class="soft">Measured? If not: agreed to follow from tested theory, or still argued over?</p>`, options: STANDING_WORDS, right: where, why };
    },
  },
  {
    id: 'curve',
    level: 3,
    make(rand) {
      const N = pickOne(rand, [10, 20, 100]);
      const out = pickOne(rand, [0.2, 0.3, 0.7, 0.8, 0.9]) * N;
      const kept = rand() < 0.65;
      const right = kept ? Math.min(out, N - out) : out;
      return { ask: `What is the entropy of the radiation so far, ${kept ? 'if information is kept (Page\'s reckoning)' : 'by Hawking\'s reckoning'}?`, show: `<p>A black hole is modelled as <b>${N}</b> two-way switches, which it gives up one at a time as radiation. <b>${out}</b> have come out.</p>`, outside: `<p class="soft">Hawking: one bit for each switch out. Page: the same until half-way, and after that one bit for each switch still in.</p>`, ...numbers(rand, right, [out, N - out, N, N / 2]), why: kept ? (out <= N / 2 ? `Less than half is out, so both reckonings agree: ${out} bits.` : `More than half is out, so the entropy is what is left inside: ${N} − ${out} = ${N - out} bits. It is on its way back to zero.`) : `Hawking's radiation is random, so each switch adds a bit: ${out}. It would reach ${N} at the end, with nothing left to account for it.` };
    },
  },
  {
    id: 'idea',
    level: 3,
    make(rand) {
      const [ask, right, wrong, why] = pickOne(rand, IDEAS);
      return { ask: 'Which is right?', show: `<p>${ask}</p>`, ...choices(rand, right, wrong), why };
    },
  },
];

// ---- The chamber ----

let heads = 0;
let reachedHalf = false;
type Mass = { id: string; name: string; kg: number };
const MASSES: Mass[] = [
  { id: 'sgr', name: 'the Milky Way\'s', kg: 4.3e6 * SUN_KG },
  { id: 'sun', name: 'one Sun', kg: SUN_KG },
  { id: 'earth', name: 'the Earth', kg: 5.972e24 },
  { id: 'mountain', name: 'a mountain', kg: 1e12 },
];
let mass = MASSES[1];
const triedMass = new Set<string>(['sun']);
let out = 0;
let furthest = 0;

function coins(): string {
  let g = '';
  for (let i = 0; i < COINS; i++) {
    const up = i < heads;
    g += `<circle cx="${32 + i * 20.8}" cy="26" r="8.5" fill="${up ? '#e8c24a' : '#2c3260'}" stroke="${up ? '#fff2c0' : '#4a5080'}"/>`;
  }
  // How many arrangements fit each number of heads: the bars are logarithms, so they show bits.
  const X = (k: number) => 32 + k * 20.8;
  const top = bits(ways(COINS, COINS / 2));
  for (let k = 0; k <= COINS; k++) {
    const b = bits(ways(COINS, k));
    g += `<rect x="${X(k) - 7}" y="${(160 - (b / top) * 90).toFixed(1)}" width="14" height="${((b / top) * 90 + 1).toFixed(1)}" rx="2" fill="${k === heads ? '#e8c24a' : '#4a5494'}"/>`;
    if (k % 5 === 0) g += `<text x="${X(k)}" y="176" font-size="10" text-anchor="middle" opacity="0.7">${k}</text>`;
  }
  g += `<text x="240" y="192" font-size="11" text-anchor="middle" opacity="0.8">number of heads among ${COINS} coins →</text><text x="12" y="118" font-size="11" text-anchor="middle" opacity="0.8" transform="rotate(-90 12 118)">bits →</text>`;
  const w = ways(COINS, heads);
  return `<svg viewBox="0 0 460 198" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p>"<b>${heads}</b> of the ${COINS} are heads." That is all you are told. The number of arrangements that fit: <b>${w.toLocaleString()}</b>. The entropy of that description: <b>${tidy(Math.round(bits(w) * 10) / 10)} bits</b>.</p><p class="soft">The row of coins shows one arrangement that fits; the bars count them all.</p>`;
}

function measure(): string {
  const kg = mass.kg;
  const rs = (2 * 6.6743e-11 * kg) / 299792458 ** 2;
  const T = holeGlow(kg);
  const life = holeLife(kg);
  const size = rs >= 1e9 ? `${tidy(Math.round(rs / 1e8) / 10)} million km` : rs >= 1000 ? `${tidy(Math.round(rs / 100) / 10)} km` : rs >= 1e-3 ? `${tidy(Number((rs * 1000).toPrecision(2)))} mm` : `${big(rs)} metres`;
  const px = Math.max(6, Math.min(50, 10 + 2.2 * (Math.log10(rs) + 16)));
  let g = DEFS + stars(192, 150, 16, 101) + holeArt(96, 75, px);
  const against = T < 2.725 ? 'It is colder than the oldest light (2.7 K), so at present it takes in more than it gives out, and grows.' : 'It is hotter than the oldest light, so it would really be shrinking.';
  return `<svg viewBox="0 0 192 150" style="width:100%;max-width:230px;display:block;margin:auto;background:#070919">${g}</svg><p>A black hole with the mass of <b>${mass.name}</b>.</p><ul class="terms"><li>Its horizon is <b>${size}</b> in radius.</li><li>Its entropy is <b>${big(holeBits(kg))} bits</b>.</li><li>It glows at <b>${big(T)} K</b>.</li><li>Left alone, it would last <b>${big(life)} years</b>.</li></ul><p>${against}</p><p class="soft">All four figures are calculated from accepted theory. None has been measured for any black hole. (The picture is not to scale.)</p>`;
}

function curves(): string {
  const X = (n: number) => 46 + (n / SWITCHES) * 390;
  const Y = (b: number) => 200 - (b / SWITCHES) * 170;
  let g = `<path d="M${X(0)} ${Y(0)}H${X(SWITCHES)}M${X(0)} ${Y(0)}V${Y(SWITCHES)}" stroke="#8d93b8" fill="none"/><path d="M${X(SWITCHES / 2)} ${Y(0)}V${Y(SWITCHES)}" stroke="#2c3260" stroke-dasharray="3 4"/><text x="${X(SWITCHES / 2)}" y="${Y(SWITCHES) - 4}" font-size="10.5" text-anchor="middle" opacity="0.75">half-way</text>`;
  let h = '';
  let p = '';
  let inside = '';
  for (let n = 0; n <= SWITCHES; n += 0.5) {
    h += `${h ? 'L' : 'M'}${X(n).toFixed(1)} ${Y(hawking(n)).toFixed(1)}`;
    p += `${p ? 'L' : 'M'}${X(n).toFixed(1)} ${Y(page(SWITCHES, n)).toFixed(1)}`;
    inside += `${inside ? 'L' : 'M'}${X(n).toFixed(1)} ${Y(SWITCHES - n).toFixed(1)}`;
  }
  g += `<path d="${inside}" stroke="#aab0d6" stroke-width="1.5" stroke-dasharray="5 4" fill="none"/><path d="${h}" stroke="#ff9a9a" stroke-width="2.5" fill="none"/><path d="${p}" stroke="#8fe0a4" stroke-width="2.5" fill="none"/>`;
  g += `<circle cx="${X(out)}" cy="${Y(hawking(out))}" r="6" fill="#ff9a9a"/><circle cx="${X(out)}" cy="${Y(page(SWITCHES, out))}" r="6" fill="#8fe0a4"/>`;
  g += `<text x="${X(SWITCHES / 2)}" y="${Y(0) + 18}" font-size="11" text-anchor="middle" opacity="0.8">how much of the black hole has come out as radiation →</text><text x="16" y="${Y(SWITCHES / 2)}" font-size="11" text-anchor="middle" opacity="0.8" transform="rotate(-90 16 ${Y(SWITCHES / 2)})">entropy, bits →</text>`;
  return `<svg viewBox="0 0 460 226" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p>A black hole of ${SWITCHES} switches, with <b>${Math.round(out)}</b> given up as radiation. The radiation's entropy by Hawking's reckoning: <b>${Math.round(hawking(out))} bits</b>. If information is kept: <b>${tidy(Math.round(page(SWITCHES, out) * 10) / 10)} bits</b>. The most the black hole itself can still account for: ${Math.round(SWITCHES - out)}.</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The logarithm of the number of hidden arrangements that fit what is seen is <b>entropy</b>. That it does not decrease is the <b>second law of thermodynamics</b>. In base 2 it is counted in <b>bits</b>.</li>
      <li>A black hole's entropy, a quarter of its horizon's area in the smallest units there are, is the <b>Bekenstein–Hawking entropy</b>. The smallest length is the <b>Planck length</b>, about 10<sup>−35</sup> metres.</li>
      <li>The predicted glow of a black hole is <b>Hawking radiation</b>.</li>
      <li>The clash between that glow's randomness and the rule that quantum physics never destroys information is the <b>black hole information paradox</b>.</li>
      <li>The curve the radiation's entropy must follow if information is kept is the <b>Page curve</b>, and the turning point the <b>Page time</b>.</li>
      <li>That the most a region can hold goes as its surface, and the proposal that a region can be fully described on its boundary, is the <b>holographic principle</b>.</li>
      <li>When two things share one state, with neither having its own, they are <b>entangled</b> (chamber 18). The uncertainty a part has on that account is its <b>entanglement entropy</b>, and it is this that the two curves plot.</li>
    </ul>
    <p><b>Observed.</b> Entanglement, many times over. The second law, always. And one black hole result: when two merge, the final horizon's area is at least the sum of the two before, as Hawking proved it must be in 1971. Gravitational-wave signals have confirmed it, most sharply one recorded in January 2025, from two holes of about 34 and 32 Suns.</p>
    <p><b>Predicted, not observed.</b> That a black hole has entropy (Bekenstein, 1972) in proportion to its area, and a temperature, and glows (Hawking, 1974). Several independent lines of calculation agree. For a hole of the Sun's mass the glow is at 60 billionths of a degree, and no instrument could find it against the sky. Laboratory stand-ins, in which sound in a flowing fluid meets a "horizon", have shown effects of the same form; how much they establish is disputed.</p>
    <p><b>Argued over, as of ${ASOF}.</b> Whether, and how, information gets out. Most physicists now expect that it does. In 2019 and 2020, calculations using gravity's own equations reproduced the turn-over of the Page curve in simplified models, which was the first real progress in decades. They do not show how the information escapes; some physicists question the method; other answers, such as a small remnant left behind, are still defended. An article in the American Physical Society's magazine <i>Physics</i> in November 2026, looking back over a half century of proposed solutions, says the fate of the information remains a mystery.</p>
    <p><b>Also argued over.</b> The holographic principle has one exact example (Maldacena, 1997): a universe with gravity, of a shape unlike ours, is equivalent to a theory without gravity living on its boundary, with one direction fewer. In that example a direction of space is not fundamental but arises from something else. Whether anything like it is true of our own universe is not known.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Entropy.</b> If what you can see is consistent with W different hidden arrangements, the entropy is</p>
      <div class="eq">S = log W</div>
      <p>The logarithm is there so that entropies add when arrangements multiply: two separate systems with W₁ and W₂ arrangements have W₁ × W₂ together, and log(W₁ W₂) = log W₁ + log W₂. With logarithms to base 2, S is the number of yes-or-no questions needed to pin the arrangement down: bits. (Physicists use the natural logarithm and multiply by Boltzmann's constant; it is the same quantity in other units.)</p>
      <p>Twenty coins have 2²⁰, about a million, arrangements. Of these, 184,756 have exactly ten heads, and 1 has none. Shake the coins and you will nearly always find them near ten. That is all the second law is.</p>
      <p><b>A black hole's three numbers.</b> For a mass M:</p>
      <div class="eq">S ∝ M² &nbsp;&nbsp;&nbsp;&nbsp; T ∝ 1 / M &nbsp;&nbsp;&nbsp;&nbsp; lifetime ∝ M³</div>
      <p>The first because the horizon's radius goes as M and entropy as its area. In full, S = A ÷ 4 in units of the Planck length squared, and the temperature is T = ħc³ ÷ (8π G M k). That one formula contains the constants of quantum physics (ħ), relativity (c), gravity (G) and heat (k), which is why it is taken as a clue to how they fit together.</p>
      <p><b>The two curves.</b> Model the black hole as N switches, given up one at a time. If the radiation is random, as Hawking found, its entropy after n switches is n bits, rising to N. If the whole process keeps information, the radiation and what remains are two entangled parts of one exactly known state, as the two photons of chamber 18 were; and each part's entropy can be no more than the size of the smaller: about n for the first half and N − n for the second. This page uses Page's exact formula, and checks it by making random states and working out the entropy directly.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://www.quantamagazine.org/the-most-famous-paradox-in-physics-nears-its-end-20201029/" target="_blank" rel="noopener">George Musser, "The Most Famous Paradox in Physics Nears Its End" (Quanta Magazine, 2020)</a>. The best plain account of the 2019 calculations. Its title is more confident than the field is.</li>
      <li>Read: <a href="https://physics.aps.org/articles/v19/159" target="_blank" rel="noopener">"A Half Century of Possible Solutions to the Information Paradox" (Physics, American Physical Society, November 2026)</a>. Where the question stands.</li>
      <li>Read: <a href="https://arxiv.org/abs/2006.06872" target="_blank" rel="noopener">Almheiri, Hartman, Maldacena, Shaghoulian and Tajdini, "The entropy of Hawking radiation" (2020)</a>. The review by the people who did the work. The first sections can be followed.</li>
      <li>Read: <a href="https://arxiv.org/abs/2509.08054" target="_blank" rel="noopener">LIGO, Virgo and KAGRA collaborations, "GW250114: testing Hawking's area law" (2025)</a>. The one observation in this chamber.</li>
      <li>Read: <a href="https://math.ucr.edu/home/baez/physics/Relativity/BlackHoles/hawking.html" target="_blank" rel="noopener">Hawking Radiation</a>, from the Usenet Physics FAQ. What it is, and what the popular "particle pairs" picture gets wrong.</li>
      <li>Read: <a href="https://www.nobelprize.org/prizes/physics/2022/summary/" target="_blank" rel="noopener">The Nobel Prize in Physics 2022</a>, for the experiments that established entanglement.</li>
      <li>Book: Leonard Susskind, <i>The Black Hole War</i> (2008). The argument with Hawking, told by one side. Lively, and partisan; it predates the 2019 results.</li>
      <li>For the math: <a href="https://openstax.org/books/university-physics-volume-2/pages/4-introduction" target="_blank" rel="noopener">OpenStax University Physics, volume 2, chapter 4</a>, on the second law and entropy.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · information and black holes', 'Count the arrangements; sort the claims', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'information',
    kicker: 'The edges · 20',
    title: 'Information and black holes',
    steps: [
      { say: 'This is the last chamber, and the one furthest from anything measured. Almost nothing in it has been observed, and its central question is open as of ' + ASOF + '. It will say at each step which is which. ¶ It starts with a count. Twenty coins, and all you are told is how many are heads. <b>Slide the number of heads to ten.</b>', until: () => reachedHalf },
      { say: '"No heads" fits one arrangement. "Ten heads" fits 184,756. The number of hidden arrangements that fit what you can see, counted as a logarithm, is called <b>entropy</b>.', ask: ['Shake the twenty coins. Which will you almost certainly find?', ['All heads', 'Somewhere near ten heads', 'Any number, equally'], 1, 'Not because coins prefer it, but because nearly all the arrangements are there. That is the second law of thermodynamics: things move toward what can happen in the most ways, and entropy does not go down.'] },
      { say: 'Now drop a cup of hot tea into a black hole. The tea had entropy: countless arrangements of its molecules. From outside, it is gone.', ask: ['Has the entropy of the universe gone down?', ['Yes: black holes break the second law', 'No: the black hole itself must have entropy, and it must have grown by at least as much', 'It was never there'], 1, 'Jacob Bekenstein argued this in 1972, and proposed that the entropy is the <i>area</i> of the horizon. Hawking had just proved that the area never decreases, which is how entropy behaves. That area rule has since been confirmed in the gravitational waves from merging black holes: the one thing in this chamber that has been observed. ¶ Below: a black hole, by the numbers.'] },
      { say: 'A black hole of the Sun\'s mass has an entropy of about 10<sup>77</sup> bits: ten million million million times the Sun\'s own.', ask: ['Its entropy goes as the area of its horizon. Double the radius, and the entropy is:', ['Twice as great', 'Four times as great', 'Eight times as great'], 1, 'For everything else, the room for arrangements goes up with <i>volume</i>. A black hole is the most that can be fitted into a region, and that most goes as the <i>surface</i>. This is the hint behind the holographic principle: that everything in a region might be describable on its boundary.'] },
      { say: 'Anything with entropy and energy has a temperature, and anything with a temperature glows (chamber 10). In 1974 Hawking found, to his own surprise, that a black hole does. <b>Try each of the four masses.</b>', until: () => triedMass.size >= MASSES.length },
      { say: 'The lighter the hole, the hotter it glows and the faster it loses mass, which makes it hotter still.', ask: ['Has anyone detected this glow?', ['Yes, from the black hole in the Milky Way', 'No: for every known black hole it is far colder than the sky around it', 'Yes, with the Webb telescope'], 1, 'A hole of the Sun\'s mass glows at 60 billionths of a degree, and the sky is at 2.7. So this is a prediction: one that follows from well-tested theory, that nearly every physicist accepts, and that nobody has seen.'] },
      { say: 'Here is the trouble. Hawking\'s calculation says the glow is perfectly random: it carries no trace of what fell in. When the hole has evaporated, the tea, the star, everything, is featureless heat.', ask: ['Why is that a problem? Recall chamber 17.', ['It is not a problem: heat is always random', 'Quantum physics never destroys information. Even interference lost to the air was carried away, not erased', 'Because black holes cannot evaporate'], 1, 'Every known process can in principle be run backwards from its results. A burnt book\'s words are in the smoke and ash, hopelessly scrambled but there. Hawking\'s result made the black hole the single exception. That is the <b>information paradox</b>. ¶ Below is a way to see exactly where the two accounts part.'] },
      { say: 'Model the black hole as 40 switches, which it gives up one at a time. The red line is the entropy of the radiation by Hawking\'s reckoning. The green is what it must do if information is kept. The dashed line is the most the shrinking hole can still account for. <b>Slide the evaporation all the way through.</b>', until: () => furthest >= SWITCHES - 0.5 },
      { say: 'The two agree until half-way. Then the red line rises above the dashed one: more entropy in the radiation than the black hole has left to match it.', ask: ['If information is kept, what must the radiation\'s entropy be when the hole is gone?', ['As high as it ever was', 'Zero: everything is accounted for', 'Half its highest value'], 1, 'The green line is the Page curve (Don Page, 1993). In 2019 and 2020, calculations with gravity\'s own equations produced the turn-over for the first time, in simplified models.'] },
      { say: 'So, as of ' + ASOF + ':', ask: ['Is the paradox solved?', ['Yes: the Page curve has been derived', 'In part. The curve has been derived in simplified models; how the information gets out is not understood, the method is questioned by some, and nothing has been observed', 'No: nothing has changed since 1974'], 1, 'That is where it stands. And it is a fair place to end: three of the best-tested ideas in physics, about heat, about gravity and about quantum possibilities, meet at one surface and do not yet agree. What makes them agree is not known.'] },
    ],
    summary: '<b>A black hole has entropy, in proportion to its area; so it should glow, and evaporate; and its glow should carry out everything that ever fell in.</b> The first rests on one confirmed prediction about areas. The second is predicted and unobserved. The third is expected by most, partly calculated, and not understood. Knowing which is which is the skill this whole world has been for.',
    frame: () =>
      `<div id="coins"></div><div class="bar"><span class="soft">no heads</span><input id="heads" type="range" min="0" max="${COINS}" step="1" value="0" style="flex:1"><span class="soft">all heads</span></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A black hole, by the numbers</div><div id="measure"></div><div class="bar">${MASSES.map((m) => `<button class="chip pale" data-do="mass" data-v="${m.id}">${m.name}</button>`).join('')}</div></div>` +
      `<div id="part3" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">The entropy of what comes out</div><div id="curves"></div><div class="bar"><span class="soft">newly formed</span><input id="out" type="range" min="0" max="${SWITCHES}" step="0.5" value="0" style="flex:1"><span class="soft">gone</span></div></div>`,
    paint: () => {
      $('coins').innerHTML = coins();
      $('measure').innerHTML = measure();
      $('curves').innerHTML = curves();
      run?.mark('mass', (k) => k === mass.id);
      const at = run?.step() ?? 0;
      ($('part2') as HTMLElement).hidden = at < 3;
      ($('part3') as HTMLElement).hidden = at < 7;
    },
    slide: (id, value) => {
      if (id === 'heads') {
        heads = value;
        if (heads === COINS / 2) reachedHalf = true;
      } else {
        out = value;
        furthest = Math.max(furthest, value);
      }
    },
    act: (what, value) => {
      if (what === 'mass') {
        mass = MASSES.find((m) => m.id === value) ?? mass;
        triedMass.add(mass.id);
      }
    },
    key: () => [['#e8c24a', 'the arrangements that fit'], ['#ff9a9a', 'Hawking\'s reckoning'], ['#8fe0a4', 'if information is kept'], ['#aab0d6', 'what the hole has left']],
    drawer,
  });
  sh.draw();
}
expose(
  () => [...checkKinds(KINDS), ...checkEdges(), ...(ways(COINS, 10) === 184756 && Math.abs(holeGlow(SUN_KG) * 1e9 - 61.7) < 0.5 && holeBits(SUN_KG) / 1e58 > 1e18 && holeBits(SUN_KG) / 1e58 < 1e20 && Math.abs(page(SWITCHES, 30) - 10) < 0.01 && holeGlow(1e12) > 2.725 && holeGlow(5.972e24) < 2.725 ? [] : ['the chamber\'s own figures'])],
  () => ({ heads, mass: mass.id, out, done: sh.kept.chapter }),
);
