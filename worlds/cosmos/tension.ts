import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { MEASURED, apart, checkCosmology, within } from './cosmology';
import { tidy } from './physics';

/**
 * The Hubble tension.
 *
 * Two good measurements of how fast the universe is expanding do not agree.
 * The distance ladder, which measures it directly nearby, gives about 73.5.
 * The oldest light, with the standard account of the universe, requires
 * about 67. Each claims an uncertainty of about one per cent. As this page
 * was written, in November 2026, nobody knows why.
 *
 * So this chamber is about how to read a disagreement: what an uncertainty
 * means, how far apart two results have to be before chance stops being an
 * explanation, and the difference between scatter and a hidden bias. It
 * takes no side, because the question is open.
 *
 * Three figures: a measurement to repeat; the two results as bell curves,
 * with a hidden bias to try; and the other, independent measurements.
 */

const sh = new Shell('portal-worlds-cosmos-tension-v1');
const LADDER = MEASURED[1];
const EARLY = MEASURED[6];
const ASOF = 'November 2026';

// ---- Practice ----

const SORTS: [string, boolean, string][] = [
  ['A star\'s brightness is measured on ten nights, and the readings scatter a little either way', true, 'Scatter that goes either way, and shrinks when more readings are averaged, is random error.'],
  ['A ruler was printed 1% too short, and every length measured with it comes out 1% too long', false, 'Every reading is off the same way. Taking more of them does not help at all. That is a systematic error.'],
  ['Dust between us and a set of distant stars dims all of them slightly, making all of them look further away', false, 'A bias in one direction, shared by every measurement. Averaging does not remove it; only finding the dust does.'],
  ['The number of photons caught from a faint galaxy varies from one exposure to the next', true, 'Pure chance in the counting. More exposures average it down.'],
  ['A clock runs slow by a second a day, and is used to time a hundred races', false, 'All hundred timings are biased the same way.'],
  ['Twenty students time the same pendulum by hand, some pressing the button early and some late', true, 'Their errors go both ways and largely cancel in the average.'],
];
const IDEAS: [string, string, string[], string][] = [
  ['Two measurements disagree by seven times their combined uncertainty. Which explanation is left out?', 'Chance', ['A hidden bias in one of them', 'Something missing from the theory that links them', 'An error in both'], 'A seven-sigma gap happens by chance less than once in a hundred billion tries. What remains is a mistake nobody has found, or new physics.'],
  ['The distance ladder and the oldest light give different expansion rates. Is one of them simply wrong?', 'Not known. Either hides an undiscovered bias, or the standard account of the universe is incomplete', ['Yes: the ladder, since it has more steps', 'Yes: the oldest light, since it relies on a model', 'No: both are right, and the universe has two rates'], 'Careful people hold each view. As of late 2026 the question is open.'],
  ['The oldest-light figure for the expansion rate is a prediction, not a direct measurement. A prediction of what?', 'What today\'s rate must be if the standard account of the universe is complete', ['What the rate was 370,000 years after the beginning', 'What the rate will be in the future', 'What the ladder will find when it improves'], 'That is why the gap is interesting. If both measurements are sound, it is the standard account that has to give.'],
  ['What would most help settle the question?', 'Independent methods, sharing no steps with either, precise enough to side with one', ['A vote among astronomers', 'Repeating the same two measurements once more each', 'Waiting'], 'Light bent by galaxies, colliding neutron stars and others share nothing with the ladder or the oldest light. So far their uncertainties are too large, or their answers fall in between.'],
  ['A result is announced "at two sigma". How should it be taken?', 'As a hint: about one such result in twenty is a fluke', ['As a discovery', 'As certainly wrong', 'As proof of new physics'], 'Physicists\' usual bar for a discovery is five sigma, and even that guards only against chance, not against a hidden bias.'],
  ['Does an uncertainty of ±1 mean the true value is certainly within 1 of the measured one?', 'No: it is within 1 about two times in three', ['Yes, always', 'No: it is within 1 half the time', 'It means the last digit is uncertain'], 'By convention the quoted uncertainty is one "sigma": the true value lies within it 68% of the time, within twice it 95%, within three times it 99.7%.'],
];

const EXAMPLES: Record<string, string> = {
  spread: '<p>A length is measured as <b>50 ± 2</b>. How often does the true value lie between 46 and 54?</p><ol><li>46 to 54 is 2 uncertainties either side.</li><li>Within one: 68% of the time. Within two: <b>95%</b>. Within three: 99.7%.</li></ol><p>The quoted ± is not a guarantee. It is the size of a typical miss.</p>',
  combine: '<p>Two measurements have uncertainties of <b>3</b> and <b>4</b>. What is the uncertainty of the difference between them?</p><ol><li>Independent uncertainties do not simply add. They add like the sides of a right triangle.</li><li>√(3² + 4²) = √25 = <b>5</b>.</li></ol><p>Less than 3 + 4, because the two errors only sometimes point the same way.</p>',
  sigma: '<p>One team measures <b>60 ± 3</b>, another <b>80 ± 4</b>. How far apart are they?</p><ol><li>The difference: 80 − 60 = 20.</li><li>The combined uncertainty: √(3² + 4²) = 5.</li><li>20 ÷ 5 = <b>4 sigma</b>.</li></ol><p>Under 2: nothing to explain. Around 3: worth a look. Five or more: chance is no longer an explanation.</p>',
  sort: '<p>Ask one question of any error: <b>would taking many more measurements average it away?</b></p><ol><li>Readings that scatter either way: yes. That is <b>random</b> error.</li><li>Every reading off in the same direction, as from a mis-marked ruler: no. That is <b>systematic</b> error, or bias.</li></ol><p>The quoted ± is good at describing the first kind and can only estimate the second.</p>',
  bias: '<p>A team finds 73 for the expansion rate. If all their distances were really <b>10% larger</b> than they thought, what would they get?</p><ol><li>The rate is speed ÷ distance.</li><li>Distances 10% larger: 73 ÷ 1.10 ≈ <b>66</b>.</li></ol><p>So a hidden error in distances moves the answer by nearly the same percentage, the other way.</p>',
  idea: '<p>What to hold on to.</p><ol><li>An uncertainty is the size of a typical miss: right within it two times in three.</li><li>Count a disagreement in combined uncertainties. Five or more is not chance.</li><li>That leaves a hidden bias, or something missing from the theory. Averaging more data cures neither.</li><li>For the expansion rate, the gap is about seven, and nobody yet knows which it is.</li></ol>',
};

const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]];
const KINDS: Kind[] = [
  {
    id: 'spread',
    level: 1,
    make(rand) {
      const value = pickOne(rand, [50, 70, 120, 200]);
      const e = pickOne(rand, [1, 2, 5]);
      const k = pickOne(rand, [1, 2, 3]);
      const pct = ['68%', '95%', '99.7%'];
      return { ask: `How often does the true value lie between ${value - k * e} and ${value + k * e}?`, show: `<p>A quantity is measured as <b>${value} ± ${e}</b>, with the usual meaning of the ±.</p>`, outside: `<p class="soft">How many uncertainties either side is that? One: 68%. Two: 95%. Three: 99.7%.</p>`, ...choices(rand, `About ${pct[k - 1]} of the time`, [...pct.filter((_, i) => i !== k - 1).map((p) => `About ${p} of the time`), 'Always']), why: `That range is ${k} ${k === 1 ? 'uncertainty' : 'uncertainties'} either side: ${pct[k - 1]}. So about ${k === 1 ? 'one time in three' : k === 2 ? 'one time in twenty' : 'one time in 370'} the truth lies outside it.` };
    },
  },
  {
    id: 'combine',
    level: 2,
    make(rand) {
      const [x, y, z] = pickOne(rand, TRIPLES);
      return { ask: 'What is the uncertainty of the difference between them?', show: `<p>Two independent measurements have uncertainties of <b>${x}</b> and <b>${y}</b>.</p>`, outside: `<p class="soft">Square each, add, and take the square root.</p>`, ...numbers(rand, z, [x + y, y - x, y]), why: `√(${x}² + ${y}²) = √${x * x + y * y} = ${z}. Less than ${x + y}, because the two errors only sometimes point the same way.` };
    },
  },
  {
    id: 'sigma',
    level: 2,
    make(rand) {
      const [x, y, z] = pickOne(rand, TRIPLES);
      const k = pickOne(rand, [1, 2, 3, 5, 6]);
      const low = pickOne(rand, [100, 200, 500]);
      return { ask: 'How many sigma apart are they?', show: `<p>One team measures <b>${low} ± ${x}</b>. Another, independently, measures <b>${low + k * z} ± ${y}</b>.</p>`, outside: `<p class="soft">The difference, divided by the combined uncertainty √(${x}² + ${y}²).</p>`, ...numbers(rand, k, [Math.round((k * z) / (x + y)), k * 2, k + 1, Math.round((k * z) / y)]), why: `The difference is ${k * z}. The combined uncertainty is √(${x}² + ${y}²) = ${z}. ${k * z} ÷ ${z} = ${k}. ${k <= 2 ? 'Nothing that needs explaining.' : k === 3 ? 'Worth a look; flukes this big do happen.' : 'Not chance.'}` };
    },
  },
  {
    id: 'sort',
    level: 1,
    make(rand) {
      const [what, random, why] = pickOne(rand, SORTS);
      return { ask: 'Would taking many more measurements average this error away?', show: `<p>${what}.</p>`, options: ['Yes: it is random scatter', 'No: it is a bias, the same way every time'], right: random ? 0 : 1, why };
    },
  },
  {
    id: 'bias',
    level: 3,
    make(rand) {
      const [start, pct, end] = pickOne(rand, [[77, 10, 70], [72, 20, 60], [84, 5, 80], [66, 10, 60], [75, 25, 60]] as [number, number, number][]);
      return { ask: 'What expansion rate would they have found with the right distances?', show: `<p>The expansion rate is each galaxy's speed divided by its distance. A team finds <b>${start}</b>. It then turns out that every distance they used was really <b>${pct}% larger</b> than they thought.</p>`, outside: `<p class="soft">Dividing by something ${pct}% larger: divide the answer by ${tidy(1 + pct / 100)}.</p>`, ...numbers(rand, end, [Math.round(start * (1 + pct / 100)), start, Math.round(start * (1 - pct / 100) - 2)]), why: `${start} ÷ ${tidy(1 + pct / 100)} = ${end}. Larger distances, slower expansion.` };
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

/** Readings taken of something whose true value is 70, with an uncertainty of 1. */
const readings: number[] = [];
let seed = 20261122;
function reading(): number {
  // Two evenly scattered numbers made into one that follows the bell curve (Box and Muller's trick).
  const even = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return 70 + Math.sqrt(-2 * Math.log(even())) * Math.cos(2 * Math.PI * even());
}
let bias = 0;
let others = false;

function sampler(): string {
  const X = (v: number) => 230 + (v - 70) * 62;
  let g = `<rect x="${X(68)}" y="10" width="${X(72) - X(68)}" height="150" fill="rgba(127,182,255,0.08)"/><rect x="${X(69)}" y="10" width="${X(71) - X(69)}" height="150" fill="rgba(127,182,255,0.14)"/><path d="M${X(70)} 10V160" stroke="#8fe0a4" stroke-dasharray="4 4"/><path d="M${X(66.5)} 160H${X(73.5)}" stroke="#8d93b8"/>`;
  for (let v = 67; v <= 73; v++) g += `<path d="M${X(v)} 160v5" stroke="#8d93b8"/><text x="${X(v)}" y="178" font-size="11" text-anchor="middle" opacity="0.7">${v}</text>`;
  g += `<text x="${X(70)}" y="196" font-size="11" text-anchor="middle" fill="#8fe0a4">the true value</text>`;
  // Stack the readings in narrow bins.
  const heap: Record<number, number> = {};
  for (const r of readings) {
    const bin = Math.round((r - 70) / 0.2);
    heap[bin] = (heap[bin] ?? 0) + 1;
    if (Math.abs(r - 70) < 3.6 && heap[bin] <= 18) g += `<circle cx="${X(70 + bin * 0.2)}" cy="${160 - heap[bin] * 8 + 3}" r="3.6" fill="#e8c24a"/>`;
  }
  const n = readings.length;
  const one = readings.filter((r) => Math.abs(r - 70) <= 1).length;
  const two = readings.filter((r) => Math.abs(r - 70) <= 2).length;
  return `<svg viewBox="0 0 460 202" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p>${n ? `<b>${n}</b> ${n === 1 ? 'reading' : 'readings'}. Within 1 of the truth: <b>${one}</b> (${Math.round((100 * one) / n)}%). Within 2: <b>${two}</b> (${Math.round((100 * two) / n)}%).` : 'No readings yet. Each one will miss the true value by an amount that varies, typically by about 1.'}</p>`;
}

const bell = (x: number, mid: number, wide: number) => Math.exp(-0.5 * ((x - mid) / wide) ** 2);
function bells(): string {
  const X = (v: number) => 30 + ((v - 64) / 13) * 400;
  const Y = (p: number) => 150 - p * 108;
  const ladder = LADDER.value / (1 + bias / 100);
  const wide = LADDER.plus / (1 + bias / 100);
  const curve = (mid: number, w: number, colour: string) => {
    let d = '';
    for (let v = 64; v <= 77; v += 0.05) d += `${d ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(bell(v, mid, w)).toFixed(1)}`;
    return `<path d="${d}L${X(77)} ${Y(0)}L${X(64)} ${Y(0)}Z" fill="${colour}" opacity="0.18"/><path d="${d}" stroke="${colour}" stroke-width="2.5" fill="none"/>`;
  };
  let g = DEFS + curve(EARLY.value, EARLY.plus, '#7fb6ff') + curve(ladder, wide, '#e8c24a') + `<path d="M${X(64)} ${Y(0)}H${X(77)}" stroke="#8d93b8"/>`;
  for (let v = 64; v <= 77; v += 2) g += `<path d="M${X(v)} ${Y(0)}v5" stroke="#8d93b8"/><text x="${X(v)}" y="${Y(0) + 18}" font-size="11" text-anchor="middle" opacity="0.7">${v}</text>`;
  g += `<text x="${X(EARLY.value)}" y="${Y(1) - 22}" font-size="12" text-anchor="middle" fill="#7fb6ff">the oldest light</text><text x="${X(ladder)}" y="${Y(1) - 6}" font-size="12" text-anchor="middle" fill="#e8c24a">the ladder</text><text x="230" y="${Y(0) + 36}" font-size="11" text-anchor="middle" opacity="0.8">expansion rate today, km/s per megaparsec</text>`;
  const gap = apart(ladder, wide, EARLY.value, EARLY.plus);
  const chance = gap < 6 ? 1 / (1 - within(gap)) : Infinity;
  const odds = gap < 1 ? 'Results this far apart are entirely ordinary.' : chance < 1e9 ? `By chance alone, a gap this size would turn up about once in ${chance < 1000 ? Math.round(chance) : chance < 1e6 ? `${Math.round(chance / 1000).toLocaleString()},000` : `${tidy(Math.round(chance / 1e5) / 10)} million`} tries.` : 'By chance alone, a gap this size would turn up less than once in a billion tries.';
  return `<svg viewBox="0 0 460 190" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p>The oldest light: <b>${EARLY.value} ± ${EARLY.plus}</b>. The ladder${bias ? `, if its distances were all ${tidy(bias)}% too small` : ''}: <b>${tidy(Math.round(ladder * 10) / 10)} ± ${tidy(Math.round(wide * 100) / 100)}</b>. They are <b>${tidy(Math.round(gap * 10) / 10)} sigma</b> apart. ${odds}</p>`;
}

const FAMILY = { ladder: '#e8c24a', early: '#7fb6ff', other: '#8fe0a4' };
function chart(): string {
  const X = (v: number) => 30 + ((v - 60) / 24) * 400;
  const rows = others ? MEASURED : MEASURED.filter((m) => m === LADDER || m === EARLY);
  let g = '';
  for (let v = 60; v <= 84; v += 4) g += `<path d="M${X(v)} 8V${24 + rows.length * 40}" stroke="#2c3260"/><text x="${X(v)}" y="${44 + rows.length * 40}" font-size="11" text-anchor="middle" opacity="0.7">${v}</text>`;
  rows.forEach((m, i) => {
    const y = 34 + i * 40;
    const c = FAMILY[m.family];
    g += `<text x="30" y="${y - 12}" font-size="11.5">${m.name} <tspan opacity="0.6">(${m.how}, ${m.year})</tspan></text><path d="M${X(Math.max(60, m.value - m.minus))} ${y}H${X(Math.min(84, m.value + m.plus))}" stroke="${c}" stroke-width="3" stroke-linecap="round"/><circle cx="${X(m.value)}" cy="${y}" r="5.5" fill="${c}"/><text x="${X(Math.min(84, m.value + m.plus)) + 8}" y="${y + 4}" font-size="11" fill="${c}">${m.value}</text>`;
  });
  return `<svg viewBox="0 0 460 ${52 + rows.length * 40}" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p class="soft">Each bar is one measurement with its quoted uncertainty. Figures as published up to ${ASOF}.</p>`;
}

function drawer(): string {
  const gap = apart(LADDER.value, LADDER.plus, EARLY.value, EARLY.plus);
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The ± on a measurement is its <b>uncertainty</b>, by convention one <b>standard deviation</b>, written σ ("sigma"): the size of a typical miss.</li>
      <li>The pattern that scattered readings follow is the <b>normal distribution</b>, or bell curve: 68% within one σ of the middle, 95% within two, 99.7% within three.</li>
      <li>Scatter that averages away with more readings is <b>random</b> or <b>statistical error</b>. A bias that pushes every reading the same way is <b>systematic error</b>.</li>
      <li>A disagreement between measurements, counted in σ, is a <b>tension</b>. By custom in physics, five σ is the bar for calling something a discovery.</li>
      <li>The disagreement over the expansion rate is the <b>Hubble tension</b>.</li>
    </ul>
    <p><b>Where it stands, as of ${ASOF}.</b></p>
    <ul class="terms">
      <li><b>The ladder.</b> The most precise direct measurement, from a collaboration combining several versions of the ladder, is ${LADDER.value} ± ${LADDER.plus}. The Webb telescope has re-examined the Cepheids the Hubble telescope measured, looking for the blurring-together of crowded stars, and found no bias.</li>
      <li><b>The oldest light.</b> Three independent instruments, combined, require ${EARLY.value} ± ${EARLY.plus} under the standard account.</li>
      <li><b>The gap</b> is ${tidy(Math.round(gap * 10) / 10)} sigma. It has grown, not shrunk, as both sides have improved over ten years.</li>
      <li><b>A dissenting ladder.</b> One team, using red giant stars in place of Cepheids, gets about 70 and argues there may be no tension to explain. Others reply that the difference comes from which galaxies were chosen. That argument is not settled.</li>
      <li><b>Independent methods</b> fall between or cannot yet decide: delays in light bent round galaxies give 71.1 with an uncertainty over 2; colliding neutron stars give 70 with an uncertainty of about 10.</li>
      <li><b>Proposed explanations</b> include a brief extra push in the young universe that would shrink the sound ruler, dark energy that changes with time (for which galaxy surveys have reported hints since 2024), and undiscovered bias in the ladder. Each fixes one thing and strains another. None is accepted.</li>
    </ul>
    <p>A 2026 review by two physicists in China says it "has likely become a real crisis for modern cosmology". A 2026 analysis from Greece argues it is better described as the distance ladder against every other method. Both readings are held by serious people. <b>Nobody knows.</b></p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Error bars.</b> No measurement is exact. A result is reported as a best value and an uncertainty, 73.5 ± 0.8, and drawn as a point with a bar. The uncertainty σ is the size of a typical miss.</p>
      <p><b>Combining.</b> When two independent results are compared, their uncertainties combine like the sides of a right triangle, Pythagoras once more, because the two errors only sometimes point the same way:</p>
      <div class="eq">σ<sub>both</sub> = √(σ₁² + σ₂²)</div>
      <p><b>How far apart.</b> Divide the difference by that:</p>
      <div class="eq">(${LADDER.value} − ${EARLY.value}) ÷ √(${LADDER.plus}² + ${EARLY.plus}²) = ${tidy(Math.round((LADDER.value - EARLY.value) * 10) / 10)} ÷ ${tidy(Math.round(Math.hypot(LADDER.plus, EARLY.plus) * 100) / 100)} = ${tidy(Math.round(gap * 10) / 10)}</div>
      <p><b>What chance can do.</b> By the bell curve, a gap of one σ or more happens by chance one time in 3; of two, one in 22; of three, one in 370; of five, one in 1.7 million. This is why chance has been ruled out here, and why that says nothing about a bias: σ describes scatter, and a bias is not scatter.</p>
      <p><b>What a bias would have to be.</b> The rate is speed ÷ distance. To bring ${LADDER.value} down to ${EARLY.value}, every distance on the ladder would have to be ${tidy(Math.round((LADDER.value / EARLY.value - 1) * 1000) / 10)}% larger than measured. The ladder's builders put their total uncertainty at about 1%.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>See: <a href="https://noirlab.edu/public/images/noirlab2611b/" target="_blank" rel="noopener">NOIRLab, a picture of the Hubble tension (2026)</a>. The two routes as two halves of a bridge that do not meet, with the latest ladder figure.</li>
      <li>Read: <a href="https://arxiv.org/abs/2606.20434" target="_blank" rel="noopener">Cai and Wang, "The Hubble tension: A decade review" (2026)</a>. The case that it is real, and a survey of the proposed ways out. Technical; the introduction is readable.</li>
      <li>Read: <a href="https://arxiv.org/abs/2601.00650" target="_blank" rel="noopener">Pantos and Perivolaropoulos, "Dissecting the Hubble tension" (2026)</a>. Eighty-eight measurements sorted by method; the case that it is the ladder against the rest.</li>
      <li>Read: <a href="https://arxiv.org/abs/2610.14881" target="_blank" rel="noopener">TDCOSMO collaboration (2026)</a>. The most precise measurement that uses neither the ladder nor the oldest light.</li>
      <li>See: <a href="https://www.desi.lbl.gov/" target="_blank" rel="noopener">The DESI survey</a>, mapping tens of millions of galaxies to trace the expansion; the source of the hints that dark energy may be changing.</li>
      <li>For the math: <a href="https://openstax.org/books/introductory-statistics-2e/pages/6-introduction" target="_blank" rel="noopener">OpenStax Introductory Statistics, chapter 6, The Normal Distribution</a>, and <a href="https://www.3blue1brown.com/lessons/clt" target="_blank" rel="noopener">3Blue1Brown, But what is the Central Limit Theorem?</a>, on why the bell curve turns up everywhere.</li>
    </ul><p class="soft">Several of these are preprints: papers posted by their authors before independent review. On a live question that is where the argument happens, and it is also where mistakes are still being caught.</p></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · the Hubble tension', 'How far apart is far apart?', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'tension',
    kicker: 'The cosmos · 15',
    title: 'The Hubble tension',
    steps: [
      { say: 'This chamber is about a question that is open as it is written, in ' + ASOF + '. Before the question, a tool for reading it. ¶ Suppose something has a true value of 70, and your instrument misses by about 1, either way, at random. <b>Take at least thirty readings.</b>', until: () => readings.length >= 30 },
      { say: 'The readings pile up round the true value in a bell shape. The "± 1" is the size of a typical miss, not a limit.', ask: ['About what share of the readings fall within 1 of the truth?', ['Nearly all of them', 'About two-thirds', 'About half'], 1, 'About 68%. Within 2, about 95%; within 3, 99.7%. So a single result that is off by one of its uncertainties is nothing; by two, uncommon; by three, rare. The uncertainty has a name: sigma.'] },
      { say: 'Now the real thing, below. Two measurements of how fast the universe is expanding: the distance ladder of chamber 12, and the oldest light of chamber 14.', ask: ['The ladder gives 73.5 ± 0.8. The oldest light gives 67.2 ± 0.4. Their uncertainties combine to about 0.9. How many sigma apart are they?', ['About 2', 'About 7', 'About 16'], 1, 'The difference is 6.3, and 6.3 ÷ 0.9 is 7. Uncertainties combine like the sides of a right triangle: √(0.8² + 0.4²) ≈ 0.9.'] },
      { say: 'Seven sigma.', ask: ['Could the gap be bad luck: random scatter of the kind you watched in the readings?', ['Yes, easily', 'It is unlikely but possible: perhaps one time in a hundred', 'No: scatter that large would happen less than once in a hundred billion tries'], 2, 'Chance is not an explanation. Two possibilities remain. One of the measurements has a bias nobody has found. Or both are right, and the standard account that connects the young universe to the present one is missing something.'] },
      { say: 'Try the first possibility. The expansion rate is speed ÷ distance, so if the ladder\'s distances were all too small, its answer would be too high. <b>Slide in a hidden bias until the two curves agree.</b>', until: () => apart(LADDER.value / (1 + bias / 100), LADDER.plus / (1 + bias / 100), EARLY.value, EARLY.plus) < 1 },
      { say: 'It takes about 9%: every distance on the ladder would have to be 9% larger than measured.', ask: ['The ladder\'s builders put their total uncertainty near 1%, and the Webb telescope\'s re-check of their Cepheids found no bias. What follows?', ['The ladder must be right', 'An error of 9% would have to be hiding somewhere every check so far has missed: hard to believe, not impossible', 'The ladder must be wrong'], 1, 'That is the honest position. The same is true on the other side: the oldest-light figure has been confirmed by three separate instruments, but it is only as good as the standard account it assumes.'] },
      { say: 'What would help is a measurement that shares nothing with either. <b>Show the other measurements.</b>', until: () => others },
      { say: 'Gold bars are ladders; blue ones rest on the sound ruler; green ones use neither.', ask: ['Do the independent measurements settle it?', ['Yes: they side with the ladder', 'Yes: they side with the oldest light', 'No: they fall in between, or their uncertainties are too large to decide'], 2, 'And one ladder, built on red giant stars in place of Cepheids, comes out near 70, which its builders take as a sign there may be nothing to explain and others dispute. As of ' + ASOF + ' the question is open.'] },
    ],
    summary: '<b>Two careful measurements of the same number disagree by seven times their combined uncertainty, and nobody knows why.</b> Chance is ruled out. What is left is an undiscovered bias, or a gap in the standard account of the universe. Either would be worth knowing. Reading the argument takes only what this chamber used: what an uncertainty means, how to count a gap, and the difference between scatter and bias.',
    frame: () =>
      `<div id="sampler"></div><div class="bar"><button class="chip gold" data-do="read" data-v="1">take a reading</button><button class="chip pale" data-do="read" data-v="10">take ten</button><button class="chip pale" data-do="read" data-v="100">take a hundred</button></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">The two measurements</div><div id="bells"></div><div class="bar"><span class="soft">no bias</span><input id="bias" type="range" min="0" max="14" step="0.1" value="0" style="flex:1"><span class="soft">ladder distances 14% too small</span></div></div>` +
      `<div id="part3" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">Other ways of measuring it</div><div id="chart"></div><div class="bar"><button class="chip pale" data-do="others" data-v="on">show the other measurements</button></div></div>`,
    paint: () => {
      $('sampler').innerHTML = sampler();
      $('bells').innerHTML = bells();
      $('chart').innerHTML = chart();
      run?.mark('others', () => others);
      const at = run?.step() ?? 0;
      ($('part2') as HTMLElement).hidden = at < 2;
      ($('part3') as HTMLElement).hidden = at < 6;
    },
    slide: (_id, value) => {
      bias = value;
    },
    act: (what, value) => {
      if (what === 'read') for (let i = 0; i < Number(value) && readings.length < 2000; i++) readings.push(reading());
      else if (what === 'others') others = !others;
    },
    key: () => [['#e8c24a', 'the distance ladder'], ['#7fb6ff', 'the oldest light and the sound ruler'], ['#8fe0a4', 'the truth, in the first figure; independent methods, in the last']],
    drawer,
  });
  sh.draw();
}
expose(
  () => {
    // The readings themselves: many of them should follow the bell curve.
    let s = 12345;
    const even = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    let inside = 0;
    for (let i = 0; i < 20000; i++) if (Math.abs(Math.sqrt(-2 * Math.log(even())) * Math.cos(2 * Math.PI * even())) <= 1) inside++;
    const gap = apart(LADDER.value, LADDER.plus, EARLY.value, EARLY.plus);
    return [...checkKinds(KINDS), ...checkCosmology(), ...(Math.abs(inside / 20000 - 0.6827) < 0.01 ? [] : [`the readings do not follow the bell curve: ${inside / 20000}`]), ...(gap > 6.8 && gap < 7.2 && Math.abs(LADDER.value / EARLY.value - 1.094) < 0.002 ? [] : ['the chamber\'s own figures'])];
  },
  () => ({ readings: readings.length, bias, others, done: sh.kept.chapter }),
);
