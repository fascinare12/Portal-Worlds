import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { frac, tidy } from './physics';
import { arrow, checkQuantum, lands, plus, squared, twoWays } from './quantum';

/**
 * A number on every possibility.
 *
 * Ordinary chance says: if something can happen in two ways, add the chances.
 * Nature does something else. Each way has an arrow, a number with a size
 * and a direction. The arrows are added first, tip to tail, and the chance is
 * the square of what results. So two ways can cancel, and closing one door
 * can let more through.
 *
 * The arrow is called an amplitude. It is not a ripple in space and not a
 * direction one could travel in: it is a number attached to each thing that
 * could happen.
 *
 * Two figures: two ways to a detector, with their arrows; and two slits and
 * a screen, with particles sent one at a time.
 */

const sh = new Shell('portal-worlds-cosmos-amplitudes-v1');

// ---- Practice ----

const RULES: [string, boolean, string][] = [
  ['A photon can reach a detector by either of two mirrors, and nothing anywhere records which', true, 'With no record of the route, the two ways end in exactly the same situation. Their arrows add.'],
  ['An electron passes two slits, and a detector beside one slit clicks when it goes that way', false, 'A click and no click are different outcomes. Ways that end differently are not added as arrows: add the chances.'],
  ['A molecule passes two slits in a good vacuum, touching nothing', true, 'Nothing has recorded the route, so the arrows add, and the molecule shows a pattern of bands.'],
  ['An atom passes two slits and, on one route only, knocks a stray photon aside', false, 'The photon carries off the information, whether or not anyone ever catches it. The outcomes differ, so the chances add.'],
  ['A coin is tossed behind a screen and comes up heads or tails', false, 'An ordinary coin has left records of which way it fell on everything around it. Chances add.'],
  ['A neutron can take either of two routes through a crystal and nothing marks which', true, 'Unmarked routes to the same outcome: arrows add. Neutron interferometers work exactly this way.'],
];
const IDEAS: [string, string, string[], string][] = [
  ['Is an amplitude an extra dimension of space?', 'No: it is a number attached to each possibility, as a temperature is a number attached to each place', ['Yes: a fifth dimension', 'Yes, but a very small one', 'It is a kind of energy'], 'Drawing a wave takes an extra axis on the page, as drawing a temperature map does. That does not make temperature a direction you could walk in. And for two particles, the amplitude is one number for each <i>pair</i> of positions.'],
  ['One particle is sent at two slits. What arrives at the screen?', 'One whole particle, at one spot', ['Half a particle at each of two spots', 'A smear spread across the screen', 'Nothing, unless it is watched'], 'Every detection is of a whole particle in one place. The bands show up only in where many of them land.'],
  ['With both slits open, there are places on the screen where no particles land. What happens there if one slit is closed?', 'Particles begin to arrive', ['Still none', 'Half as many as before', 'Twice as many as nearby'], 'At a dark band the two arrows cancel. Remove one arrow and what is left has a size, and so a chance.'],
  ['What decides the direction of each arrow?', 'The length of the route: the arrow turns once for each wavelength travelled', ['The speed of the particle only', 'Chance', 'The size of the detector'], 'Two routes that differ by a whole number of wavelengths give arrows pointing the same way; by half a wavelength, opposite ways.'],
  ['Has this been seen with anything larger than an electron?', 'Yes: with atoms, large molecules and, in 2026, clusters of over 7,000 sodium atoms', ['No: only with light and electrons', 'Only in thought experiments', 'Yes, with grains of sand'], 'The University of Vienna\'s group has pushed the size up for 25 years. The limit so far is practical: keeping anything from recording the route.'],
  ['Why is the square of the arrow\'s length taken, and not the length itself?', 'It is the rule that fits every experiment; nobody has derived it from anything simpler that all accept', ['Because lengths can be negative', 'Because of the speed of light', 'To make the numbers smaller'], 'It is called the Born rule. It was guessed in 1926, and has passed every test since. Why nature works this way is still argued over.'],
];

const EXAMPLES: Record<string, string> = {
  add: '<p>Two ways lead to the same outcome, with arrows of length <b>3</b> and <b>4</b>, at right angles. What does the outcome\'s arrow come to, and its square?</p><ol><li>Put the arrows tip to tail. At right angles they make two sides of a right triangle.</li><li>The sum is the long side: √(3² + 4²) = 5.</li><li>The square is <b>25</b>.</li></ol><p>Pointing the same way they would give 7, and 49. Pointing opposite ways, 1, and 1. The same two arrows, three very different chances.</p>',
  bright: '<p>Two routes to a spot differ in length by <b>2½ wavelengths</b>. Bright or dark?</p><ol><li>An arrow turns once for each wavelength of route.</li><li>2½ turns leaves the second arrow half a turn from the first: pointing the opposite way.</li><li>They cancel: <b>dark</b>.</li></ol><p>A whole number of wavelengths: same direction, bright. A whole number and a half: opposite, dark.</p>',
  turn: '<p>What is a quarter-turn, done <b>three</b> times?</p><ol><li>A quarter-turn is written i. Doing it twice is a half-turn, which reverses an arrow: i × i = −1.</li><li>A third quarter-turn after that: −1 × i = <b>−i</b>, a quarter-turn the other way.</li></ol><p>Four of them bring an arrow back to where it started: i⁴ = 1.</p>',
  size: '<p>An arrow points <b>5 across and 12 up</b>. What chance does it stand for, if the chance is the square of its length?</p><ol><li>Its length is the long side of a right triangle: √(5² + 12²).</li><li>The square of that is simply 5² + 12² = 25 + 144 = <b>169</b>.</li></ol><p>Written as a complex number, the arrow is 5 + 12i, and this is its squared size.</p>',
  rule: '<p>Ask one question: <b>is there, anywhere, any record of which way it went?</b></p><ol><li>No record at all: the ways end in the same situation. <b>Add the arrows</b>, then square.</li><li>Any record, even one nobody reads: the ways end differently. <b>Add the chances.</b></li></ol>',
  both: '<p>Two ways lead to a detector, each with an arrow of length <b>1/3</b>, pointing the same way. What is the chance of arriving if nothing records the way? And if something does?</p><ol><li><b>No record:</b> add the arrows first. 1/3 + 1/3 = 2/3. Then square: <b>4/9</b>.</li><li><b>A record:</b> square each first, 1/9 and 1/9, then add the chances: <b>2/9</b>.</li></ol><p>The same two ways, and twice the chance when they are allowed to interfere. Had the arrows pointed opposite ways, no record would have given 0.</p>',
  idea: '<p>What to hold on to.</p><ol><li>Every way a thing can happen has an arrow: a size and a direction.</li><li>For ways that end in exactly the same situation, add the arrows, then square.</li><li>So ways can cancel as well as reinforce.</li><li>The arrow is a number on a possibility. It is not a place, and not a direction in space.</li></ol>',
};

const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]];
const KINDS: Kind[] = [
  {
    id: 'add',
    level: 1,
    make(rand) {
      const [a, b, c] = pickOne(rand, TRIPLES);
      const how = Math.floor(rand() * 3);
      const words = ['pointing the same way', 'pointing opposite ways', 'at right angles to each other'][how];
      const sum = [a + b, b - a, c][how];
      return { ask: 'What is the square of the arrow they add up to?', show: `<p>Two ways lead to the same outcome. Their arrows have lengths <b>${a}</b> and <b>${b}</b>, <b>${words}</b>.</p>`, outside: `<p class="soft">Tip to tail first. Then square the length of what results.</p>`, ...numbers(rand, sum * sum, [(a + b) ** 2, (b - a) ** 2, c * c, a * a + b]), why: `Tip to tail, they reach ${sum}. ${sum}² = ${sum * sum}.${how === 2 ? ` (At right angles: √(${a}² + ${b}²) = ${c}.)` : ''} Adding the squares separately would give ${a * a + b * b} every time, whatever the directions; arrows do not work that way.` };
    },
  },
  {
    id: 'bright',
    level: 1,
    make(rand) {
      const whole = Math.floor(rand() * 5);
      const half = rand() < 0.5;
      const n = whole + (half ? 0.5 : 0);
      return { ask: 'Is that spot bright or dark?', show: `<p>Two unmarked routes lead to a spot on the screen. One is longer than the other by <b>${n === 0 ? 'nothing at all' : `${tidy(n)} ${n === 1 ? 'wavelength' : 'wavelengths'}`}</b>.</p>`, outside: `<p class="soft">An arrow turns once for each wavelength of route.</p>`, options: ['Bright: the arrows point the same way', 'Dark: the arrows point opposite ways'], right: half ? 1 : 0, why: half ? `${tidy(n)} turns leaves the second arrow half a turn round from the first. They cancel.` : `A whole number of turns brings the second arrow round to the same direction as the first. They add.` };
    },
  },
  {
    id: 'turn',
    level: 2,
    make(rand) {
      const n = 2 + Math.floor(rand() * 7);
      const all = ['No turn at all (1)', 'A quarter-turn (i)', 'A half-turn (−1)', 'A quarter-turn the other way (−i)'];
      return { ask: 'What does that come to?', show: `<p>Multiplying by i turns an arrow a quarter of the way round. An arrow is multiplied by i <b>${n} times</b>.</p>`, outside: `<p class="soft">Four quarter-turns bring it back to the start, so only the remainder after dividing by 4 matters.</p>`, options: all, right: n % 4, why: `${n} quarter-turns is ${Math.floor(n / 4) ? `${Math.floor(n / 4)} full ${Math.floor(n / 4) === 1 ? 'turn' : 'turns'} and ` : ''}${n % 4} more: ${all[n % 4].toLowerCase()}. Two quarter-turns reverse an arrow, which is why i × i = −1.` };
    },
  },
  {
    id: 'size',
    level: 2,
    make(rand) {
      const [a, b, c] = pickOne(rand, TRIPLES);
      const flip = rand() < 0.5;
      return { ask: 'What is the square of its length?', show: `<p>An arrow points <b>${flip ? b : a} across and ${flip ? a : b} up</b>. (As a complex number: ${flip ? b : a} + ${flip ? a : b}i.)</p>`, ...numbers(rand, c * c, [a + b, c, (a + b) ** 2, a * b]), why: `${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}. Its length is ${c}.` };
    },
  },
  {
    id: 'rule',
    level: 2,
    make(rand) {
      const [what, arrows, why] = pickOne(rand, RULES);
      return { ask: 'To find the chance, what is added?', show: `<p>${what}.</p>`, outside: `<p class="soft">Is there, anywhere, any record of which way it went?</p>`, options: ['The arrows, and then the sum is squared', 'The chances'], right: arrows ? 0 : 1, why };
    },
  },
  {
    id: 'both',
    level: 3,
    make(rand) {
      const d = pickOne(rand, [2, 3, 4, 5]);
      const marked = rand() < 0.5;
      const each = frac(1, d * d);
      return { ask: 'What is the chance of arriving?', show: `<p>Two ways lead to a detector. Each has an arrow of length <b>${frac(1, d)}</b>, and the two arrows point the <b>same way</b>. ${marked ? 'A device records which way was taken.' : 'Nothing records which way was taken.'}</p>`, outside: `<p class="soft">Either way alone has a chance of ${each}.</p>`, ...choices(rand, marked ? frac(2, d * d) : frac(4, d * d), [marked ? frac(4, d * d) : frac(2, d * d), each, frac(2, d)]), why: marked ? `The route is recorded, so the chances add: ${each} + ${each} = ${frac(2, d * d)}.` : `No record, so the arrows add: ${frac(1, d)} + ${frac(1, d)} = ${frac(2, d)}, and its square is ${frac(4, d * d)}. Twice what adding the chances would give.` };
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

let extra = 0;
let cancelled = false;
let blocked = false;
let gap = 4;
let watched = false;
const hits: number[] = [];
let seed = 8675309;
const even = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
/** One particle sent: where it lands, drawn by chance from how likely each place is. */
function send(): number {
  for (;;) {
    const x = even() * 2 - 1;
    if (even() * 2 < lands(x, gap, watched ? 0 : 1)) return x;
  }
}

function ways(): string {
  const A = arrow(0.5, 0);
  const B = blocked ? ([0, 0] as [number, number]) : arrow(0.5, extra);
  const sum = plus(A, B);
  const chance = twoWays(extra, blocked);
  const U = 92;
  const ox = 318;
  const oy = 120;
  const tip = (v: [number, number]) => `${(ox + v[0] * U).toFixed(1)} ${(oy - v[1] * U).toFixed(1)}`;
  let g = DEFS + `<defs>${['#e8c24a', '#7fb6ff', '#fff'].map((c, i) => `<marker id="h${i}" markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="${c}"/></marker>`).join('')}</defs>`;
  // The apparatus: a source, two routes, a detector.
  const bump = 28 + extra * 22;
  g += `<circle cx="30" cy="120" r="8" fill="#fff"/><text x="30" y="146" font-size="11" text-anchor="middle">source</text><rect x="200" y="106" width="14" height="28" rx="3" fill="#aab0d6"/><text x="207" y="150" font-size="11" text-anchor="middle">detector</text>`;
  g += `<path d="M38 116Q118 60 200 116" stroke="#e8c24a" stroke-width="3" fill="none"/><text x="118" y="70" font-size="11" text-anchor="middle" fill="#e8c24a">way A</text>`;
  g += `<path d="M38 124Q118 ${124 + bump * 2} 200 124" stroke="#7fb6ff" stroke-width="3" fill="none" ${blocked ? 'opacity="0.3"' : ''}/><text x="118" y="${150 + bump}" font-size="11" text-anchor="middle" fill="#7fb6ff">way B${blocked ? ': blocked' : ''}</text>`;
  if (blocked) g += `<path d="M108 ${118 + bump}l20 14m0 -14l-20 14" stroke="#ff9a9a" stroke-width="3"/>`;
  // The arrows, tip to tail.
  g += `<circle cx="${ox}" cy="${oy}" r="${U}" fill="none" stroke="#2c3260" stroke-dasharray="3 5"/><circle cx="${ox}" cy="${oy}" r="3" fill="#8d93b8"/>`;
  g += `<path d="M${ox} ${oy}L${tip(A)}" stroke="#e8c24a" stroke-width="4" marker-end="url(#h0)"/>`;
  if (!blocked) g += `<path d="M${tip(A)}L${tip(sum)}" stroke="#7fb6ff" stroke-width="4" marker-end="url(#h1)"/>`;
  if (squared(sum) > 0.0004) g += `<path d="M${ox} ${oy + 5}L${(ox + sum[0] * U).toFixed(1)} ${(oy - sum[1] * U + 5).toFixed(1)}" stroke="#fff" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#h2)"/>`;
  g += `<text x="${ox}" y="14" font-size="11" text-anchor="middle" opacity="0.8">the arrows, tip to tail</text>`;
  // The chance, as a bar.
  g += `<rect x="430" y="20" width="16" height="200" rx="4" fill="rgba(255,255,255,0.1)"/><rect x="430" y="${(220 - chance * 200).toFixed(1)}" width="16" height="${(chance * 200).toFixed(1)}" rx="4" fill="#8fe0a4"/><text x="438" y="236" font-size="11" text-anchor="middle">chance</text>`;
  return `<svg viewBox="0 0 460 244" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p>Way B is longer than way A by <b>${tidy(Math.round(extra * 100) / 100)}</b> ${extra === 1 ? 'wavelength' : 'wavelengths'}${blocked ? ', and is blocked' : ''}. The arrows add to one of length <b>${tidy(Math.round(Math.sqrt(squared(sum)) * 100) / 100)}</b>, so the chance of arriving is <b>${tidy(Math.round(chance * 100) / 100)}</b>. Either way alone would give 0.25.</p>`;
}

function screen(): string {
  const X = (x: number) => 230 + x * 205;
  let g = `<path d="M${X(-1)} 170H${X(1)}" stroke="#8d93b8"/>`;
  // What the rule predicts, faintly.
  let d = '';
  for (let x = -1; x <= 1.001; x += 0.01) d += `${d ? 'L' : 'M'}${X(x).toFixed(1)} ${(170 - lands(x, gap, watched ? 0 : 1) * 70).toFixed(1)}`;
  g += `<path d="${d}" stroke="#3b4170" stroke-width="1.5" fill="none"/>`;
  const heap: Record<number, number> = {};
  for (const x of hits) {
    const bin = Math.round(x * 55);
    heap[bin] = (heap[bin] ?? 0) + 1;
    if (heap[bin] <= 40) g += `<circle cx="${X(bin / 55).toFixed(1)}" cy="${(170 - heap[bin] * 4 + 2).toFixed(1)}" r="1.9" fill="#e8c24a"/>`;
  }
  g += `<text x="230" y="190" font-size="11" text-anchor="middle" opacity="0.8">where each particle landed on the screen</text>`;
  return `<svg viewBox="0 0 460 198" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p><b>${hits.length.toLocaleString()}</b> ${hits.length === 1 ? 'particle' : 'particles'} sent, one at a time. ${watched ? 'A detector at the slits records which slit each one passed.' : 'Nothing records which slit each one passed.'}</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The arrow attached to each way a thing can happen is its <b>probability amplitude</b>, or just amplitude. The set of amplitudes for everything that could be found is the <b>wavefunction</b> or <b>quantum state</b>.</li>
      <li>The direction of the arrow is its <b>phase</b>.</li>
      <li>That the chance is the square of the amplitude's size is the <b>Born rule</b> (Max Born, 1926).</li>
      <li>Arrows adding and cancelling is <b>interference</b>. Having an amplitude for more than one possibility at once is being in a <b>superposition</b>.</li>
      <li>The experiment in the second figure is the <b>double-slit experiment</b>.</li>
    </ul>
    <p><b>How this is known.</b> Thomas Young showed interference with light in 1801. With single electrons, building the pattern up one dot at a time, it was done by Merli, Missiroli and Pozzi in Bologna in 1974 and by Tonomura's group at Hitachi in 1989. Since 1999 a group in Vienna has done it with ever larger molecules, and in 2026 with clusters of more than 7,000 sodium atoms, each cluster about 8 nanometres across, shown to have been in two places 133 nanometres apart.</p>
    <p><b>What an amplitude is not.</b> It is not a ripple in some substance filling space, and it is not an extra direction in space. Drawing a wave needs an extra axis on the page, exactly as a weather map needs colours or a third axis for temperature; that does not make temperature somewhere you could go. And the picture of "a wave in space" fails outright for two particles: the amplitude is then one number for each <i>pair</i> of places the two could be found. It lives on the list of possibilities, not in the room.</p>
    <p><b>What is not known.</b> What an amplitude <i>is</i>, beyond the rule for using it: a real physical thing, or a statement of what can be known. The rule itself is not in doubt. The next chamber is about why the everyday world does not look like this.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Complex numbers.</b> An ordinary number has a size and a sign: it points one of two ways along a line. A <b>complex number</b> has a size and a direction in a plane: an arrow. Two rules are all there is to them.</p>
      <p>To <b>add</b>, put the arrows tip to tail.</p>
      <p>To <b>multiply</b>, multiply the sizes and add the angles.</p>
      <p>Multiplying by −1 is a half-turn. So there ought to be a number that is a quarter-turn, and that done twice gives −1. It is called i:</p>
      <div class="eq">i × i = −1</div>
      <p>Every arrow can be written as a + b i: a across, b up. Its squared length is a² + b², Pythagoras again. An arrow of length 1 turned through an angle θ is written e<sup>iθ</sup>, because the exponential of chamber 7, fed a quarter-turn's worth of i, goes round a circle instead of growing.</p>
      <p><b>Two ways.</b> Take two arrows of length ½, the second turned by an angle φ from the first. Tip to tail and squared:</p>
      <div class="eq">chance = | ½ + ½ e<sup>iφ</sup> |² = ½ (1 + cos φ)</div>
      <p>At φ = 0 that is 1; at a half-turn, 0. Adding the chances instead would give ¼ + ¼ = ½ whatever φ was. The whole difference between the quantum world and ordinary chance is in that formula.</p>
      <p><b>The turn.</b> An arrow turns once for each wavelength of route, and a particle's wavelength is Planck's constant divided by its momentum (de Broglie, 1924). Heavy, fast things have tiny wavelengths: for the sodium clusters, about a hundred-billionth of a millimetre.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://www.feynmanlectures.caltech.edu/III_01.html" target="_blank" rel="noopener">The Feynman Lectures on Physics, volume III, chapter 1, "Quantum Behavior"</a>. The double slit, told by the person who said it contains "the only mystery". Free from Caltech.</li>
      <li>Book: Richard Feynman, <i>QED: The Strange Theory of Light and Matter</i> (1985). Four lectures for a general audience, done entirely with these arrows. The best single thing to read after this chamber.</li>
      <li>See: <a href="https://www.hitachi.com/rd/research/materials/quantum/doubleslit/index.html" target="_blank" rel="noopener">Hitachi, the double-slit experiment with single electrons</a>. Tonomura's own pictures and film of the pattern building up, dot by dot.</li>
      <li>Read: <a href="https://www.scientificamerican.com/article/quantum-physicists-just-supersized-schroedingers-cat/" target="_blank" rel="noopener">Scientific American, on the 2026 sodium-cluster experiment</a>.</li>
      <li>Play: <a href="https://phet.colorado.edu/en/simulations/quantum-wave-interference" target="_blank" rel="noopener">PhET, Quantum Wave Interference</a>.</li>
      <li>Watch: <a href="https://www.3blue1brown.com/lessons/light-quantum-mechanics" target="_blank" rel="noopener">3Blue1Brown with minutephysics, Some light quantum mechanics</a>; and for the math, <a href="https://www.3blue1brown.com/lessons/eulers-formula-dynamically" target="_blank" rel="noopener">e to the iπ in 3.14 minutes</a> and <a href="https://openstax.org/books/college-algebra-2e/pages/2-4-complex-numbers" target="_blank" rel="noopener">OpenStax College Algebra, section 2.4</a>, on complex numbers.</li>
      <li>Course: <a href="https://theoreticalminimum.com/courses/quantum-mechanics/2012/winter" target="_blank" rel="noopener">Leonard Susskind, Quantum Mechanics (Stanford, The Theoretical Minimum)</a>, and <a href="https://ocw.mit.edu/courses/8-04-quantum-physics-i-spring-2016/" target="_blank" rel="noopener">MIT OpenCourseWare 8.04</a>.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · a number on every possibility', 'Add the arrows, then square', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'amplitudes',
    kicker: 'The quantum · 16',
    title: 'A number on every possibility',
    steps: [
      { say: 'A particle leaves a source and can reach a detector by either of two ways. Sent by way A alone, it arrives one time in four. By way B alone, one time in four.', ask: ['Both ways are opened. By the ordinary rules of chance, how often should it arrive?', ['One time in four', 'One time in two', 'Every time'], 1, 'A quarter plus a quarter is a half. That is how chances combine for coins, cards and weather. It is not what happens here. ¶ Look at the figure: with both ways open and equally long, it arrives <i>every</i> time.'] },
      { say: 'Nature does not add the chances. Each way has an <b>arrow</b>: here, each of length ½. The arrows are added tip to tail, and the chance is the <i>square</i> of the length of the result. ½ + ½ = 1, and 1² = 1. ¶ The direction of an arrow depends on the length of the route. <b>Make way B longer, until nothing arrives at all.</b>', until: () => cancelled },
      { say: 'Half a wavelength longer, and way B\'s arrow points the opposite way. The two cancel, and the detector is silent.', ask: ['Both ways are open and nothing arrives. Now way B is blocked. What happens?', ['Still nothing arrives', 'It arrives one time in four', 'It arrives one time in two'], 1, '<b>Block way B and see.</b>'] },
      { say: '<b>Block way B.</b>', until: () => blocked },
      { say: 'With one way closed, a quarter get through, where with both open none did. Closing a door let more through.', ask: ['What can the arrow be, then?', ['The chance itself', 'Something that can be positive, negative, or point anywhere in between: a number with a direction', 'The particle\'s position'], 1, 'Chances are never negative and can never cancel. Arrows can. The arrow is called an <b>amplitude</b>, and this is the whole of the rule: for ways that end in the same situation, add the arrows, then square.'] },
      { say: 'Now the most famous experiment in physics, below. Particles are sent, one at a time, at a wall with two slits, and land on a screen behind. To each spot on the screen there are two ways: through one slit or the other. <b>Send at least 300 particles.</b>', until: () => hits.length >= 300 },
      { say: 'Each particle landed whole, at one spot. But together they make bands: bright where the two arrows point the same way, dark where they cancel.', ask: ['The particles went through one at a time. What was it that went through both slits?', ['Half a particle through each', 'Nothing travelled as a split thing. The particle had an arrow for each way, and the two arrows met', 'Two particles'], 1, 'Nobody has ever caught half an electron. What "takes both ways" is the bookkeeping: there is an amplitude for each way, and the pattern is what comes of adding them.'] },
      { say: 'Suppose a detector at the slits records which one each particle passes. <b>Turn it on, and send 300 more.</b>', until: () => watched && hits.length >= 300 },
      { say: 'The bands are gone.', ask: ['Why?', ['The detector knocked the particles off course', 'With a record of the slit, the two ways no longer end in the same situation, so their arrows are not added', 'The particles know they are watched'], 1, 'The rule said: add arrows for ways that end in <i>exactly</i> the same situation. "Went left, and the detector says left" is not the same situation as "went right, and the detector says right". So the chances add, as for coins. That one condition is what the next chamber is about.'] },
      { say: 'One last thing, because it is easily mistaken. A wave is usually drawn with its height on an extra axis.', ask: ['Does that make the amplitude an extra dimension of space?', ['Yes: a hidden fifth dimension', 'No: it is a number attached to each possibility, as temperature is a number attached to each place'], 1, 'A weather map needs colour, or a third axis, to show temperature; that does not make temperature somewhere you could walk to. And for two particles the amplitude is one number for each <i>pair</i> of places they could be. It lives on the list of possibilities, not in the room.'] },
    ],
    summary: '<b>Every way a thing can happen has an arrow. For ways that end in exactly the same situation, the arrows are added and the result is squared.</b> So possibilities can cancel as well as reinforce, which no rule of ordinary chance allows. The arrow, the amplitude, is a number on each possibility: not a place, and not a direction in space.',
    frame: () =>
      `<div id="ways"></div><div class="bar"><span class="soft">the same length</span><input id="extra" type="range" min="0" max="2" step="0.01" value="0" style="flex:1"><span class="soft">2 wavelengths longer</span></div><div class="bar"><button class="chip pale" data-do="block" data-v="on">block way B</button></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">Two slits and a screen</div><div id="screen"></div><div class="bar"><button class="chip gold" data-do="send" data-v="1">send one</button><button class="chip pale" data-do="send" data-v="20">send 20</button><button class="chip pale" data-do="send" data-v="300">send 300</button><button class="chip pale" data-do="clear" data-v="on">clear the screen</button></div><div class="bar"><button class="chip pale" data-do="watch" data-v="on">record which slit</button></div><div class="bar"><span class="soft">slits close together</span><input id="gap" type="range" min="2" max="8" step="0.1" value="4" style="flex:1"><span class="soft">far apart</span></div></div>`,
    paint: () => {
      $('ways').innerHTML = ways();
      $('screen').innerHTML = screen();
      run?.mark('block', () => blocked);
      run?.mark('watch', () => watched);
      ($('part2') as HTMLElement).hidden = (run?.step() ?? 0) < 5;
    },
    slide: (id, value) => {
      if (id === 'extra') {
        extra = value;
        if (!blocked && twoWays(extra) < 0.004) cancelled = true;
      } else {
        gap = value;
        hits.length = 0;
      }
    },
    act: (what, value) => {
      if (what === 'block') blocked = !blocked;
      else if (what === 'send') for (let i = 0; i < Number(value) && hits.length < 6000; i++) hits.push(send());
      else if (what === 'clear') hits.length = 0;
      else if (what === 'watch') {
        watched = !watched;
        hits.length = 0;
      }
    },
    key: () => [['#e8c24a', 'way A; landed particles'], ['#7fb6ff', 'way B'], ['#fff', 'the two arrows added'], ['#8fe0a4', 'the chance: the square of that']],
    drawer,
    next: ['decoherence', 'On to why the world looks definite'],
  });
  sh.draw();
}
expose(
  () => {
    // Particles sent by chance should pile up where the rule says: compare the middle band with the first dark one.
    let s = 4242;
    const rnd = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    let middle = 0;
    let dark = 0;
    for (let n = 0; n < 40000; ) {
      const x = rnd() * 2 - 1;
      if (rnd() * 2 < lands(x, 4, 1)) {
        n++;
        if (Math.abs(x) < 0.03) middle++;
        if (Math.abs(Math.abs(x) - 0.125) < 0.03) dark++;
      }
    }
    return [...checkKinds(KINDS), ...checkQuantum(), ...(dark > middle * 0.05 && dark < middle * 0.13 ? [] : [`the screen: ${middle} in the middle band, ${dark} in the dark ones`]), ...(Math.abs(twoWays(0.5)) < 1e-12 && Math.abs(twoWays(0.5, true) - 0.25) < 1e-12 ? [] : ['the chamber\'s own figures'])];
  },
  () => ({ extra, blocked, hits: hits.length, watched, done: sh.kept.chapter }),
);
