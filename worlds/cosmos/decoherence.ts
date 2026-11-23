import { Shell, checkKinds, choices, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { PACES, frac, tidy } from './physics';
import { LASTS, after, checkQuantum, left, survives, tells } from './quantum';

/**
 * Why the world looks definite.
 *
 * Arrows are added only for ways that end in exactly the same situation,
 * everything included. A stray air molecule that bounces off a thing, and is
 * left even slightly differently by its two possible places, makes the two
 * situations differ. The arrows stop adding, and the interference goes. No
 * observer is needed. This is decoherence, and for anything large enough to
 * see it happens in times too short to have a name.
 *
 * It is caused by whatever a thing is in contact with: air, light, warmth.
 * It is not caused by the expansion of the universe, and has nothing to do
 * with it. And it explains why interference is not seen, but not, by
 * itself, why any single outcome occurs: that is an open question.
 *
 * Two figures: one bounce, and how much it gives away; and how long a large
 * molecule or a dust grain can stay in two places, in four surroundings.
 */

const sh = new Shell('portal-worlds-cosmos-decoherence-v1');

type Thing = keyof typeof LASTS;
type Around = keyof (typeof LASTS)['grain'];
const THINGS: Record<Thing, string> = { molecule: 'a large molecule (a hundred-thousandth of a millimetre)', grain: 'a dust grain (a hundredth of a millimetre)' };
const AROUND: Record<Around, string> = { air: 'ordinary air', vacuum: 'the best laboratory vacuum', warm: 'only the glow of a room-temperature wall', oldest: 'only the oldest light, in deep space' };

function time(seconds: number, drawn = false): string {
  if (seconds >= 3.15e7 * 1e9) return `${tidy(Number((seconds / 3.15e16).toPrecision(1)))} billion years`.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  if (seconds >= 3.15e7) return `${Math.round(seconds / 3.15e7).toLocaleString()} years`;
  if (seconds >= 86400) return `${Math.round(seconds / 86400)} days`;
  if (seconds >= 1) return Math.abs(seconds - 1) < 0.05 ? '1 second' : `${tidy(Number(seconds.toPrecision(2)))} seconds`;
  if (seconds >= 1e-3) return `${tidy(Number((seconds * 1e3).toPrecision(2)))} thousandths of a second`;
  const e = Math.round(Math.log10(seconds));
  const power = String(e).replace('-', '−');
  return drawn ? `10<tspan dy="-5" font-size="8">${power}</tspan><tspan dy="5"> seconds</tspan>` : `10<sup>${power}</sup> seconds`;
}

// ---- Practice ----

const RECORDS: [string, boolean, string][] = [
  ['An atom takes one of two routes in a perfect vacuum, touching nothing and giving off nothing', true, 'Nothing anywhere differs between the two routes. The arrows add, and interference is seen.'],
  ['A molecule takes one of two routes, and on the way a single gas atom bounces off it and flies away unnoticed', false, 'The gas atom\'s path depends on where the molecule was. That is a record, whether or not anyone reads it.'],
  ['A warm molecule takes one of two routes and gives off a photon of heat that could show where it was', false, 'The photon carries the information away. This has been measured: heat the molecules and their interference fades.'],
  ['A photon takes one of two routes through glass that it leaves exactly as it found it', true, 'The glass is the same either way, so nothing has been recorded.'],
  ['A grain of dust floats in ordinary air', false, 'It is struck by something like a billion billion air molecules every second, each one carrying off where it was.'],
  ['A molecule takes one of two routes; a gas atom bounces off it, and is left exactly the same whichever route it was', true, 'A bounce that cannot tell the routes apart records nothing. What matters is not contact but whether the routes leave different traces.'],
];
const FASTER: [string, string, string, number, string][] = [
  ['A dust grain in air', 'The same dust grain in a good vacuum', 'a dust grain', 0, 'More collisions each second, so the record builds faster.'],
  ['A dust grain in a vacuum', 'A large molecule in the same vacuum', 'things in a vacuum', 0, 'The grain is a far bigger target, and its two places are further apart, so each collision tells more.'],
  ['A molecule in two places a hair\'s breadth apart', 'The same molecule in two places an atom\'s width apart', 'a molecule', 0, 'The further apart the two places, the more easily one bounce tells them apart. The rate goes as the square of the separation.'],
  ['A grain in deep space, lit only by the oldest light', 'The same grain in sunlight', 'a grain', 1, 'Sunlight is vastly more photons, each more energetic. Any light that bounces off is an environment.'],
  ['A cold molecule in a vacuum', 'The same molecule, heated until it glows', 'a molecule', 1, 'A hot molecule gives off its own photons, and they carry away where it was.'],
];
const IDEAS: [string, string, string[], string][] = [
  ['Does decoherence need a conscious observer?', 'No: any stray particle that is left differently by the two possibilities will do', ['Yes: someone has to look', 'Yes, or at least a measuring device', 'Only for large objects'], 'An air molecule, a photon of heat, a speck of light from the sky. Nobody need ever examine it. The record only has to exist.'],
  ['Is decoherence caused by the expansion of the universe?', 'No: it is caused by whatever the thing is in contact with, and happens the same in a universe that is not expanding', ['Yes: stretching space pulls the possibilities apart', 'Yes, but only over large distances', 'Partly: expansion sets its rate'], 'Its rate depends on the surroundings: air, light, heat. Shield the thing better and it lasts longer, in the same expanding universe. The oldest light does decohere a dust grain in deep space, but by bouncing off it, as any light would.'],
  ['Why is a cat never seen in two places at once, when a molecule can be?', 'Its surroundings record where it is almost instantly, so the two possibilities never interfere', ['Quantum rules stop applying above a certain size', 'Cats are alive', 'It is, but too briefly to matter and for a different reason'], 'No experiment has found a size at which the rules change. What changes is how impossible it becomes to keep anything from recording which place.'],
  ['After decoherence, which of the possibilities actually happened?', 'Decoherence does not say. Why one outcome is found is an open question', ['The more probable one, always', 'Both, visibly', 'Whichever the air molecule chose'], 'Decoherence explains why the possibilities stop interfering and behave like ordinary chances. Why a single one is then found is the measurement problem, and physicists disagree about it.'],
  ['Could interference lost to decoherence ever be got back?', 'In principle, by gathering every particle that carried a record; in practice, never for anything large', ['No, never, even in principle', 'Yes, easily, by waiting', 'Yes, by looking away'], 'With one or two photons it has been done: such experiments are called quantum erasers. With a billion billion air molecules it cannot.'],
  ['Why are quantum computers kept so cold and so isolated?', 'So that nothing records the state of their parts before the calculation is done', ['To save power', 'Because cold makes electrons faster', 'For no physical reason'], 'A quantum computer works by interference among its possibilities. Decoherence is the thing it is racing.'],
];

const EXAMPLES: Record<string, string> = {
  halve: '<p>Each stray molecule that bounces off halves the contrast of the bands. How much is left after <b>4</b> bounces?</p><ol><li>The bounces are independent, so their effects multiply.</li><li>½ × ½ × ½ × ½ = <b>1/16</b>.</li></ol><p>After 10 bounces, 1/1,024. After 20, about a millionth. This is how a great many small leaks add up to total loss.</p>',
  both: '<p>In each microsecond, the chance that a molecule escapes being hit is <b>9/10</b>. What is the chance it escapes for two microseconds running?</p><ol><li>For independent events to <i>both</i> happen, multiply their chances.</li><li>9/10 × 9/10 = <b>81/100</b>.</li></ol><p>"Both" multiplies. "Either" adds, when the two cannot happen together.</p>',
  duality: '<p>A stray particle lets the two ways be told apart <b>3/5</b> as well as is possible. How much of the bands\' contrast is left?</p><ol><li>Knowledge of the way, and contrast of the bands, obey the budget\'s rule: (knowledge)² + (contrast)² = 1.</li><li>3/5 belongs to the 3-4-5 triangle: the contrast is <b>4/5</b>.</li></ol><p>Full knowledge, no bands. No knowledge, full bands. And every mixture in between.</p>',
  record: '<p>Ask: <b>after it is over, does anything, anywhere, differ according to which way it went?</b></p><ol><li>If something does, even a single photon flying off into space: the ways are recorded, and there is <b>no interference</b>.</li><li>If nothing at all differs: <b>interference</b>.</li></ol><p>Contact alone is not the test. A bounce that leaves the bouncer identical either way records nothing.</p>',
  faster: '<p>Which loses its interference sooner: a grain in air, or the same grain in a vacuum?</p><ol><li>The loss is faster the more things bounce off each second.</li><li>It is faster the bigger the object, and the further apart its two places.</li><li>Air means far more collisions: <b>the grain in air</b>.</li></ol>',
  idea: '<p>What to hold on to.</p><ol><li>Interference needs the ways to end in exactly the same situation, everything included.</li><li>Anything that is left differently by the two ways is a record, read or not. Records end interference.</li><li>Big things in ordinary surroundings are recorded almost instantly. That is all that "big" means here.</li><li>The cause is the surroundings. Not an observer, and not the expansion of the universe.</li><li>Why one outcome is then found is a separate question, and open.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'record',
    level: 1,
    make(rand) {
      const [what, clean, why] = pickOne(rand, RECORDS);
      return { ask: 'Will interference be seen?', show: `<p>${what}.</p>`, outside: `<p class="soft">Afterwards, does anything anywhere differ according to which route was taken?</p>`, options: ['Yes: nothing has recorded the route', 'No: the route has been recorded'], right: clean ? 0 : 1, why };
    },
  },
  {
    id: 'halve',
    level: 1,
    make(rand) {
      const n = 2 + Math.floor(rand() * 7);
      return { ask: 'What fraction of the contrast is left?', show: `<p>Each stray molecule that bounces off a thing halves the contrast of its interference bands. <b>${n}</b> molecules bounce off, one after another.</p>`, outside: `<p class="soft">Halve, and halve again, ${n} times.</p>`, ...choices(rand, frac(1, 2 ** n), [frac(1, 2 * n), frac(1, 2 ** (n - 1)), frac(1, n * n), frac(1, 2 ** (n + 1))]), why: `½ multiplied by itself ${n} times is ${frac(1, 2 ** n)}. Each bounce multiplies what the last one left.` };
    },
  },
  {
    id: 'both',
    level: 2,
    make(rand) {
      const [n, d] = pickOne(rand, [[9, 10], [1, 2], [2, 3], [3, 4], [4, 5]] as [number, number][]);
      const k = pickOne(rand, [2, 3]);
      return { ask: `What is the chance it escapes for ${k} microseconds running?`, show: `<p>In each microsecond, independently, the chance that a molecule escapes being hit by anything is <b>${frac(n, d)}</b>.</p>`, outside: `<p class="soft">For independent things all to happen, multiply their chances.</p>`, ...choices(rand, frac(n ** k, d ** k), [frac(n * k, d * k + 1), frac(n, d * k), frac(n ** k, d), frac(Math.max(1, n - 1), d)]), why: `${Array(k).fill(frac(n, d)).join(' × ')} = ${frac(n ** k, d ** k)}. The chance of a run of escapes shrinks with every step, which is why isolation cannot last.` };
    },
  },
  {
    id: 'duality',
    level: 2,
    make(rand) {
      const p = pickOne(rand, PACES);
      return { ask: 'How much of the bands\' contrast survives?', show: `<p>A stray particle bounces off, and by examining it the two ways could be told apart <b>${frac(p.a, p.c)}</b> as well as is possible. The rule: (how well the ways can be told apart)² + (contrast of the bands)² = 1.</p>`, ...choices(rand, frac(p.b, p.c), [frac(p.a, p.c), frac(p.c - p.a, p.c), '1']), why: `(${frac(p.a, p.c)})² + (${frac(p.b, p.c)})² = 1. The more the bounce gives away, the less interference is left: the budget, again.` };
    },
  },
  {
    id: 'faster',
    level: 2,
    make(rand) {
      const [one, two, , which, why] = pickOne(rand, FASTER);
      const swap = rand() < 0.5;
      const options = swap ? [two, one] : [one, two];
      return { ask: 'Which loses its interference sooner?', show: `<p>Two cases:</p><p><b>${options[0]}.</b></p><p><b>${options[1]}.</b></p>`, options: ['The first', 'The second'], right: swap ? 1 - which : which, why };
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

let told = 0; // how well one bounce tells the two ways apart: 0 to 1
let most = 0;
let near = false;
let thing: Thing = 'molecule';
let around: Around = 'vacuum';
let when = -40; // log10 of seconds
const tried = new Set<string>(['molecule:vacuum']);

/** A strip of bright and dark bands, with a given contrast. */
function bands(x: number, y: number, width: number, height: number, contrast: number): string {
  let g = '';
  const n = 90;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const edge = Math.exp(-((u - 0.5) ** 2) / (2 * 0.2 * 0.2));
    const b = 0.5 * edge * (1 + contrast * Math.cos(2 * Math.PI * 7 * (u - 0.5)));
    g += `<rect x="${(x + (i / n) * width).toFixed(1)}" y="${y}" width="${(width / n + 0.4).toFixed(1)}" height="${height}" fill="#e8c24a" opacity="${b.toFixed(3)}"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#050714"/>${g}`;
}

function bounce(): string {
  const alike = Math.sqrt(1 - told * told);
  const contrast = survives(alike);
  // The budget's arrow, a third time: across is what the bounce gives away; up is what is left of the bands.
  const R = 150;
  const x = tells(alike) * R;
  const y = -contrast * R;
  let dial = `<path d="M0 0H${R + 10}M0 0V-${R + 10}" stroke="#8d93b8" stroke-width="1.5" fill="none"/><path d="M${R} 0A${R} ${R} 0 0 0 0 -${R}" stroke="#3b4170" stroke-width="2" fill="none" stroke-dasharray="4 5"/>`;
  dial += `<text x="${R / 2}" y="20" font-size="11.5" text-anchor="middle">how well the ways can be told apart →</text><text x="-12" y="${-R / 2}" font-size="11.5" text-anchor="middle" transform="rotate(-90 -12 ${-R / 2})">contrast of the bands →</text>`;
  dial += `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="0" stroke="#ff9ab8" stroke-width="5"/><line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e8c24a" stroke-width="5"/><line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#fff" stroke-width="3"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#fff"/>`;
  // The stray molecule, as it is left by each of the two ways.
  const angle = Math.asin(Math.min(1, told));
  const mol = (ox: number, colour: string, a: number, label: string) => `<circle cx="${ox}" cy="-108" r="16" fill="none" stroke="#3b4170"/><line x1="${ox}" y1="-108" x2="${(ox + 22 * Math.sin(a)).toFixed(1)}" y2="${(-108 - 22 * Math.cos(a)).toFixed(1)}" stroke="${colour}" stroke-width="3.5" stroke-linecap="round"/><circle cx="${(ox + 22 * Math.sin(a)).toFixed(1)}" cy="${(-108 - 22 * Math.cos(a)).toFixed(1)}" r="5" fill="${colour}"/><text x="${ox}" y="-66" font-size="10.5" text-anchor="middle">${label}</text>`;
  dial += `<text x="318" y="-150" font-size="11.5" text-anchor="middle">the stray molecule, afterwards</text>` + mol(280, '#b9c4ff', -angle / 2, 'if way A') + mol(356, '#ff9ab8', angle / 2, 'if way B');
  return `<svg viewBox="-28 -168 440 196" style="width:100%;max-width:540px;display:block;margin:auto">${DEFS}${dial}</svg><svg viewBox="0 0 460 62" style="width:100%;max-width:540px;display:block;margin:6px auto 0">${bands(20, 6, 420, 36, contrast)}<text x="230" y="58" font-size="11" text-anchor="middle" opacity="0.8">the bands on the screen</text></svg><p>The molecule lets the two ways be told apart <b>${tidy(Math.round(told * 100) / 100)}</b> as well as is possible. The bands keep <b>${tidy(Math.round(contrast * 100) / 100)}</b> of their contrast.</p>`;
}

function fading(): string {
  const lasts = LASTS[thing][around];
  const seconds = Math.pow(10, when);
  const contrast = left(seconds, lasts);
  const X = (e: number) => 30 + ((e + 40) / 68) * 400;
  let g = `<path d="M${X(-40)} 26H${X(28)}" stroke="#8d93b8"/>`;
  const marks: [number, string][] = [[-18.5, 'light crosses an atom'], [0, 'a second'], [7.5, 'a year'], [17.6, 'the age of the universe']];
  marks.forEach(([e, name], i) => {
    g += `<path d="M${X(e)} 20v12" stroke="#8d93b8"/><text x="${X(e)}" y="${i % 2 ? 14 : 46}" font-size="10" text-anchor="middle" opacity="0.75">${name}</text>`;
  });
  g += `<path d="M${X(Math.log10(lasts))} 8V44" stroke="#ff9a9a" stroke-width="2.5"/><text x="${X(Math.log10(lasts))}" y="62" font-size="11" text-anchor="${Math.log10(lasts) > 10 ? 'end' : Math.log10(lasts) < -25 ? 'start' : 'middle'}" fill="#ff9a9a">interference lost about here</text>`;
  g += `<circle cx="${X(when)}" cy="26" r="7" fill="#fff"/>`;
  return `<svg viewBox="0 0 460 70" style="width:100%;max-width:540px;display:block;margin:auto">${g}</svg><svg viewBox="0 0 460 62" style="width:100%;max-width:540px;display:block;margin:6px auto 0">${bands(20, 6, 420, 36, contrast)}<text x="230" y="58" font-size="11" text-anchor="middle" opacity="0.8">what would be left of the bands, after ${time(seconds, true)}</text></svg><p><b>${THINGS[thing][0].toUpperCase()}${THINGS[thing].slice(1)}</b>, in two places its own width apart, surrounded by <b>${AROUND[around]}</b>. Its surroundings have recorded which place within about <b>${time(lasts)}</b>.</p><p class="soft">Each mark on the scale is far more than ten times the one before: the scale runs from 10<sup>−40</sup> seconds to 10<sup>28</sup>. The figures are order-of-magnitude estimates from the standard review of the subject.</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The loss of interference through records kept by a thing's surroundings is <b>decoherence</b>. The surroundings, in this sense, are its <b>environment</b>.</li>
      <li>When what is found about one thing depends on what is found about another, the two are <b>entangled</b>. A bounce that records the way entangles the bouncer with the thing it hit.</li>
      <li>The contrast of the bands is their <b>visibility</b>, and how well the ways can be told apart is the <b>distinguishability</b>. That their squares add to one is a <b>duality relation</b> (Englert, 1996).</li>
      <li>The time it takes is the <b>decoherence time</b>.</li>
      <li>The question of why one outcome is found is the <b>measurement problem</b>.</li>
    </ul>
    <p><b>How this is known.</b> The theory was worked out by Dieter Zeh in 1970 and Wojciech Zurek in the 1980s. In 1996 Serge Haroche's group in Paris put a few photons into two states at once and watched the interference between them fade, step by step, at the predicted rate. In Vienna, large molecules sent through an interferometer lose their bands exactly as predicted when a little gas is let in (2003), or when the molecules are heated until they glow (2004). And in 2026 clusters of over 7,000 sodium atoms kept their interference, because enough was done to keep anything from recording their path.</p>
    <p><b>What it is not.</b> Decoherence is not caused by anyone looking; a stray molecule is enough. It is not a size limit on quantum physics; no experiment has found one. And it is not caused by, or tied to, the expansion of the universe. Its rate depends on what a thing is in contact with, and the same grain in the same air would lose its interference just as fast in a universe that was not expanding at all. The oldest light of chamber 14 does spoil the interference of a dust grain floating in deep space, in about a second: by bouncing off it, as any light does.</p>
    <p><b>What is not settled.</b> Decoherence explains why the possibilities stop interfering, and so why they can be treated as ordinary chances. It does not, by itself, say why one of them is then found. On that, physicists divide. Some hold that the amplitudes describe what can be known, and nothing more needs saying. Some, following Hugh Everett, that every outcome occurs, each in its own branch. Some, following de Broglie and Bohm, that particles have definite places all along, steered by the wave. And some that the rules themselves change for large things, so that possibilities really do collapse; that last idea predicts tiny effects that experiments are now hunting for, and so far have not found. All of these agree with every experiment done. Nobody knows which, if any, is right.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Probability.</b> A probability is a number from 0 (never) to 1 (always). Two rules cover nearly everything.</p>
      <p>If two things cannot both happen, the chance of <b>one or the other</b> is the <b>sum</b> of their chances.</p>
      <p>If two things are independent, the chance of <b>both</b> is the <b>product</b> of their chances.</p>
      <p><b>Many small leaks.</b> Suppose each bounce leaves a fraction f of the interference. Bounces are independent, so after N of them</p>
      <div class="eq">what is left = f<sup>N</sup></div>
      <p>If each bounce takes only a little, f = 1 − ε, then (1 − ε)<sup>N</sup> is very nearly e<sup>−Nε</sup>: the exponential of chamber 7, running downward. With N in the billions of billions each second, nothing is left almost at once, however small ε is.</p>
      <p><b>One bounce.</b> Write the two ways as A and B, and the state the bouncer is left in as E<sub>A</sub> or E<sub>B</sub>. The contrast of the bands is the overlap of those two states, a number from 0 to 1; call it V. The best that anyone examining the bouncer could do at telling the ways apart is D = √(1 − V²). So</p>
      <div class="eq">V² + D² = 1</div>
      <p>The same circle as the budget of chamber 1, for a wholly different reason. This page checks it by writing out the particle and the bouncer in full and trying every way of looking.</p>
      <p><b>What sets the time.</b> For collisions, the rate goes as the number of hits per second times the square of the distance between the two places. That is why "large" and "far apart" mean "gone at once".</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://arxiv.org/abs/1911.06282" target="_blank" rel="noopener">Maximilian Schlosshauer, "Quantum decoherence" (Physics Reports, 2019)</a>. The standard review, free to read, and the source of the times in the second figure. Technical, with a clear introduction.</li>
      <li>Read: <a href="https://plato.stanford.edu/entries/qm-decoherence/" target="_blank" rel="noopener">Stanford Encyclopedia of Philosophy, The Role of Decoherence in Quantum Mechanics</a>. Careful about what it does and does not solve.</li>
      <li>Read: <a href="https://www.nobelprize.org/prizes/physics/2012/summary/" target="_blank" rel="noopener">The Nobel Prize in Physics 2012</a>: Haroche and Wineland, for experiments that watch single quantum systems, decoherence included.</li>
      <li>Read: <a href="https://www.scientificamerican.com/article/quantum-physicists-just-supersized-schroedingers-cat/" target="_blank" rel="noopener">Scientific American, on the 2026 sodium-cluster experiment</a>, and what it rules out.</li>
      <li>Read: <a href="https://arxiv.org/abs/2508.18822" target="_blank" rel="noopener">Carlesso and Donadi, "Spontaneous collapse models" (2025)</a>. The one family of ideas about the measurement problem that makes different predictions, and how experiments are closing in on it.</li>
      <li>For the math: <a href="https://openstax.org/books/introductory-statistics-2e/pages/3-introduction" target="_blank" rel="noopener">OpenStax Introductory Statistics, chapter 3, Probability Topics</a>.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · why the world looks definite', 'Has anything kept a record?', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'decoherence',
    kicker: 'The quantum · 17',
    title: 'Why the world looks definite',
    steps: [
      { say: 'The last chamber ended on a condition: arrows are added only for ways that end in <i>exactly</i> the same situation, everything included. ¶ A particle is on its way to the screen by two ways at once. One stray air molecule bounces off it. If the molecule is left even slightly differently by the two ways, the two situations are no longer the same. <b>Slide up how much the bounce gives away, to the top.</b>', until: () => most >= 0.98 },
      { say: 'The bands have gone, as they did when a detector watched the slits. But there is no detector here.', ask: ['Who observed which way the particle went?', ['A physicist', 'A measuring device', 'Nobody. A stray molecule was left in a different state, and that is all it takes'], 2, 'Nothing has to look. The record only has to exist: somewhere, something is different according to which way was taken. This loss of interference is called <b>decoherence</b>.'] },
      { say: 'It is not all or nothing. <b>Set the bounce to give away about 0.6.</b>', until: () => near },
      { say: 'The molecule tells the ways apart 0.6 as well as is possible, and the bands keep 0.8 of their contrast.', ask: ['0.6 and 0.8. You have met this pair before. Where?', ['In the budget of chamber 1: the two sides of an arrow of fixed length', 'In the orbit of chamber 6', 'Nowhere: it is a coincidence'], 0, 'What can be known of the way, and what is left of the interference, share one fixed budget: their squares add to one. The more the surroundings learn, the less interference remains.'] },
      { say: 'The interference is not destroyed so much as carried off.', ask: ['Could the bands ever be got back?', ['No, not even in principle', 'In principle, by catching the molecule and undoing its record; in practice, not once there are many', 'Yes, by waiting'], 1, 'With a single photon as the record it has been done. But in air a dust grain is struck by something like a billion billion molecules a second, each flying off with a little of the record. ¶ Below: how long that takes.'] },
      { say: 'Here is a large molecule in the best laboratory vacuum, in two places at once. The white dot is the time gone by; the red mark is when its surroundings have recorded which place. <b>Now choose the dust grain, in ordinary air.</b>', until: () => thing === 'grain' && around === 'air' },
      { say: 'About 10<sup>−31</sup> seconds. Light takes a trillion times longer than that to cross a single atom.', ask: ['So why is a dust grain, or a cat, never seen in two places at once?', ['Quantum rules do not apply to large things', 'Its surroundings record where it is almost instantly, so its possibilities never get the chance to interfere', 'It is too heavy to move that fast'], 1, 'No size has been found at which the rules stop working. What grows with size is the impossibility of keeping the surroundings from finding out.'] },
      { say: 'Now take the air away, and the walls, and every lamp. <b>Put the dust grain in deep space, with only the oldest light.</b>', until: () => thing === 'grain' && around === 'oldest' },
      { say: 'Even there, with nothing but the faint microwaves of chamber 14, a grain\'s interference lasts about a second.', ask: ['Is it the expansion of the universe that ends it?', ['Yes: stretching space pulls the possibilities apart', 'No: it is that light bouncing off the grain, as any light would. Expansion plays no part'], 1, 'Shield the grain from the microwaves and it would last longer, in the very same expanding universe. Decoherence depends on what a thing is in contact with, and on nothing else. The oldest light counts only because it is light.'] },
      { say: '<b>Try the large molecule in each of the four surroundings.</b>', until: () => (['air', 'vacuum', 'warm', 'oldest'] as Around[]).every((k) => tried.has(`molecule:${k}`)) },
      { say: 'In a good vacuum, a large molecule keeps its interference for a hundredth of a second: long enough to send it through an experiment. That is how the experiments of the last chamber are possible, and why they need vacuum and cold.', ask: ['Decoherence explains why the possibilities stop interfering. Does it explain why just one of them is found?', ['Yes, completely', 'No. That is a separate question, and physicists do not agree on the answer'], 1, 'After decoherence the possibilities behave like ordinary chances: heads or tails. Why one is then found, and what became of the other, is called the measurement problem. There are several answers on offer, all consistent with every experiment, and no agreement.'] },
    ],
    summary: '<b>The everyday world looks definite because nothing in it is ever alone.</b> Interference needs two ways to end in exactly the same situation, and for anything large, air and light record which way almost instantly. No observer is needed, no size limit is involved, and the expansion of the universe has nothing to do with it. What decoherence leaves unanswered is why one outcome is found at all.',
    frame: () =>
      `<div id="bounce"></div><div class="bar"><span class="soft">the bounce gives nothing away</span><input id="told" type="range" min="0" max="1" step="0.01" value="0" style="flex:1"><span class="soft">everything</span></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">How long it lasts</div><div id="fading"></div><div class="bar"><span class="soft">no time at all</span><input id="when" type="range" min="-40" max="28" step="0.25" value="-40" style="flex:1"><span class="soft">far longer than the universe</span></div><div class="bar">${(Object.keys(THINGS) as Thing[]).map((k) => `<button class="chip pale" data-do="thing" data-v="${k}">${k === 'grain' ? 'a dust grain' : 'a large molecule'}</button>`).join('')}</div><div class="bar">${(Object.keys(AROUND) as Around[]).map((k) => `<button class="chip pale" data-do="around" data-v="${k}">${{ air: 'in air', vacuum: 'in the best vacuum', warm: 'with warm walls only', oldest: 'with only the oldest light' }[k]}</button>`).join('')}</div></div>`,
    paint: () => {
      $('bounce').innerHTML = bounce();
      $('fading').innerHTML = fading();
      run?.mark('thing', (k) => k === thing);
      run?.mark('around', (k) => k === around);
      ($('part2') as HTMLElement).hidden = (run?.step() ?? 0) < 5;
    },
    slide: (id, value) => {
      if (id === 'told') {
        told = value;
        most = Math.max(most, value);
        near = most >= 0.98 && Math.abs(value - 0.6) < 0.025;
      } else when = value;
    },
    act: (what, value) => {
      if (what === 'thing') thing = value as Thing;
      else if (what === 'around') around = value as Around;
      tried.add(`${thing}:${around}`);
    },
    key: () => [['#ff9ab8', 'what the bounce gives away'], ['#e8c24a', 'what is left of the bands'], ['#ff9a9a', 'when the interference is lost']],
    drawer,
    next: ['entangled', 'On to two things, one state'],
  });
  sh.draw();
}
expose(
  () => [...checkKinds(KINDS), ...checkQuantum(), ...(Math.abs(survives(Math.sqrt(1 - 0.36)) - 0.8) < 1e-9 && Math.abs(after(4, 0.5) - 1 / 16) < 1e-12 && LASTS.grain.air === 1e-31 && LASTS.molecule.vacuum === 1e-2 && 3e-10 / 3e8 / 1e-31 > 1e12 ? [] : ['the chamber\'s own figures'])],
  () => ({ told, thing, around, when, done: sh.kept.chapter }),
);
