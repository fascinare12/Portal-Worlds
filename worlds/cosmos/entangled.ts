import { Shell, checkKinds, choices, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS, stars } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { frac } from './physics';
import { SETTINGS, agree, checkEntangled, checkQuantum, planAgrees } from './quantum';

/**
 * Two things, one state.
 *
 * Two photons made together can share a single state, with no state of its
 * own for either. Measured alone, each gives a result that is pure chance.
 * Measured the same way, the two always match. The natural explanation is
 * that each pair leaves with matching instructions. John Bell showed in 1964
 * that this explanation can be tested, and experiments since 1972 have ruled
 * it out: no set of instructions, however clever, gives the matches that are
 * actually seen.
 *
 * It cannot be used to send a message: what either side sees alone is the
 * same whatever the other does. And it is the same thing as chamber 17's
 * record, seen from the other end: the whole is exactly known, and the
 * parts, taken alone, are random.
 *
 * Two figures: a source and two detectors, each with a three-way dial; and a
 * set of instructions to write, and fail to make work.
 */

const sh = new Shell('portal-worlds-cosmos-entangled-v1');

// ---- Practice ----

const LABELS: Record<string, string> = { '1': 'Always', '3/4': '3/4 of the time', '1/2': '1/2 of the time', '1/4': '1/4 of the time', '0': 'Never' };
const ANGLES: [number, string][] = [[0, '1'], [30, '3/4'], [45, '1/2'], [60, '1/4'], [90, '0']];
const TIED: [string, boolean, string][] = [
  ['A pair of gloves is split between two boxes and posted to two cities. Open one box, and you know which glove is in the other', false, 'Each glove was left or right all along. That is a set of instructions, and it can never beat Bell\'s limit. Ordinary correlation, not entanglement.'],
  ['Two photons from one atom always match when measured the same way, and match one time in four when measured 60° apart', true, 'One in four is fewer than any instructions can manage. Only a shared state does this.'],
  ['Two coins are tossed in different rooms and happen to land the same', false, 'Chance. Repeat it and they will agree half the time.'],
  ['Two dice are loaded by the same maker so that both always show six', false, 'The answer is fixed in each die in advance: instructions. Nothing here needs a shared state.'],
  ['A stray molecule bounces off a particle that was on two paths at once, and is left differently by each', true, 'The molecule and the particle now share one state: molecule-this-way-and-particle-here, with molecule-that-way-and-particle-there. That is entanglement, and it is what chamber 17 called a record.'],
  ['Two electrons in a helium atom, whose spins are always found opposite along any direction chosen', true, 'Opposite along <i>any</i> direction, chosen afterwards, is more than fixed instructions can do. Neither electron has a spin direction of its own.'],
];
const IDEAS: [string, string, string[], string][] = [
  ['Can entanglement be used to send a message faster than light?', 'No: what either side sees alone is pure chance, whatever the other side does', ['Yes, instantly', 'Yes, but only one bit at a time', 'Only over short distances'], 'The matches show up only when the two lists of results are brought together and compared, and that takes an ordinary message. The light cones of chamber 3 are safe.'],
  ['What did Bell\'s theorem show?', 'That no scheme of instructions carried by the particles can reproduce the matches quantum physics predicts', ['That quantum physics is wrong', 'That particles talk to each other faster than light', 'That measurements are impossible'], 'It turned a philosophical argument into something a laboratory can decide. The experiments have sided with quantum physics every time.'],
  ['Before it is measured, what is the polarisation of one photon of an entangled pair?', 'It has none of its own: only the pair has a definite state', ['Upright', 'It has one, and we do not know it', 'Half upright and half level'], '"It has one and we do not know it" is the instruction picture, and that is what the experiments rule out. The whole is definite and the part is not.'],
  ['How is entanglement related to the decoherence of chamber 17?', 'They are the same thing: a record kept by the surroundings is entanglement with the surroundings', ['They are opposites', 'They are unrelated', 'Decoherence destroys entanglement and nothing else'], 'When a molecule bounces off and is left differently by two paths, particle and molecule share a state. Looked at alone, the particle has lost its interference.'],
  ['Einstein, Podolsky and Rosen argued in 1935 that quantum physics must be incomplete. Were they right?', 'Not in the way they hoped: the kind of completion they had in mind is what Bell\'s test rules out', ['Yes, entirely', 'They were ignored', 'The question cannot be tested'], 'They assumed each particle carries definite answers and is unaffected by what is done far away. Those two assumptions together cannot be squared with the results. Which to give up is still argued over.'],
  ['The state of an entangled pair is known exactly. How much can be predicted about one photon alone?', 'Nothing: its result is a coin toss', ['Everything', 'Its result, three times in four', 'Its result, if the other is measured first'], 'The whole carries no uncertainty, and each part carries one full bit of it. For anything not entangled, knowing the whole exactly means knowing the parts.'],
];

const EXAMPLES: Record<string, string> = {
  match: '<p>Two entangled photons meet filters set <b>30°</b> apart. How often do they do the same thing?</p><ol><li>The chance of matching is the square of the cosine of the angle between the filters.</li><li>cos 30° = 0.866, and its square is <b>3/4</b>.</li></ol><p>To remember: 0° gives 1; 30° gives ¾; 45° gives ½; 60° gives ¼; 90° gives 0. It is the same cos² as two arrows a fixed angle apart, in chamber 16.</p>',
  plan: '<p>Suppose a pair of photons leaves with these instructions: <b>pass, pass, stop</b> for settings 1, 2 and 3. If the two filters are on <i>different</i> settings, how often do the photons match?</p><ol><li>List the ways the settings can differ: 1&2, 1&3, 2&3 (and each the other way round).</li><li>1&2: pass and pass, a match. 1&3: pass and stop, no. 2&3: pass and stop, no.</li><li>One in three: <b>1/3</b>.</li></ol><p>Every mixed set of instructions gives 1/3, and "all the same" gives 1. Nothing gives less than 1/3. The photons themselves give 1/4.</p>',
  alone: '<p>The far filter is turned from setting 1 to setting 3. What changes in the results at the near detector?</p><ol><li>Each side alone sees its photon pass half the time and stop half the time, at random.</li><li>That is so whatever the far setting is.</li><li><b>Nothing changes.</b></li></ol><p>Only the comparison of the two lists changes. That is why no signal can be sent.</p>',
  tied: '<p>Ask: <b>could each thing have been carrying its answer all along?</b></p><ol><li>If yes, as with a left and a right glove, it is ordinary correlation.</li><li>If the results match in a way no pre-set answers could, however clever, it is entanglement.</li></ol>',
  bits: '<p>Two photons share one exactly known state. How much is uncertain about the pair, and about each one?</p><ol><li>The pair: nothing. Its state is known. <b>0 bits.</b></li><li>Each photon alone: a fair coin toss. <b>1 bit</b> each.</li></ol><p>For ordinary things the uncertainty of the whole is at least that of each part. Entanglement is exactly the case where it is less.</p>',
  idea: '<p>What to hold on to.</p><ol><li>Two things can share one state, with neither having its own.</li><li>Alone, each gives pure chance. Compared, they match in ways no pre-set instructions can.</li><li>That is Bell\'s theorem, and experiment confirms it.</li><li>No message can be sent with it.</li><li>A record kept by the surroundings is this same thing.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'match',
    level: 1,
    make(rand) {
      const [deg, right] = pickOne(rand, ANGLES);
      return { ask: 'How often do the two photons do the same thing?', show: `<p>For a pair of photons made to match, the chance that both do the same at two filters is the square of the cosine of the angle between the filters: at 0°, 1; at 30°, ¾; at 45°, ½; at 60°, ¼; at 90°, 0.</p><p>The two filters are set <b>${deg}°</b> apart.</p>`, ...choices(rand, LABELS[right], Object.values(LABELS).filter((o) => o !== LABELS[right])), why: `cos² of ${deg}° is ${right}.` };
    },
  },
  {
    id: 'plan',
    level: 2,
    make(rand) {
      const plan = [rand() < 0.5, rand() < 0.5, rand() < 0.5];
      const said = plan.map((p) => (p ? 'pass' : 'stop')).join(', ');
      const got = planAgrees(plan);
      return { ask: 'When the two filters are on different settings, how often do the photons match?', show: `<p>Suppose each pair of photons left its source carrying the same instructions, one for each of the three settings. This pair carries: <b>${said}</b> (for settings 1, 2, 3).</p>`, outside: `<p class="soft">Go through 1&2, 1&3 and 2&3. In how many do the two instructions agree?</p>`, ...choices(rand, got === 1 ? 'Always' : '1/3 of the time', ['Always', '1/3 of the time', '1/4 of the time', '2/3 of the time'].filter((o) => o !== (got === 1 ? 'Always' : '1/3 of the time'))), why: got === 1 ? 'All three instructions are the same, so the photons match whatever the settings. Far too often: real pairs match only 1/4 of the time on different settings.' : `Two of the instructions are alike and one differs, so one pairing in three matches. That is the least any instructions can give, and real pairs give 1/4.` };
    },
  },
  {
    id: 'alone',
    level: 1,
    make(rand) {
      const what = pickOne(rand, ['is turned to a different setting', 'is removed altogether', 'is moved a light-year further away', 'is read before the near one']);
      return { ask: 'What changes in the results at the near detector, taken alone?', show: `<p>Entangled pairs are sent to two detectors. The far detector <b>${what}</b>.</p>`, options: ['Nothing: it still passes half and stops half, at random', 'It passes more often', 'It stops giving random results'], right: 0, why: 'Each side alone sees a coin toss, always. Only the two lists compared show anything, and comparing them takes an ordinary message. So nothing here outruns light.' };
    },
  },
  {
    id: 'tied',
    level: 2,
    make(rand) {
      const [what, yes, why] = pickOne(rand, TIED);
      return { ask: 'Is this entanglement, or could each have carried its answer all along?', show: `<p>${what}.</p>`, options: ['Entanglement: a shared state', 'Ordinary: the answers could have been set in advance'], right: yes ? 0 : 1, why };
    },
  },
  {
    id: 'bits',
    level: 3,
    make(rand) {
      const pairs = 1 + Math.floor(rand() * 5);
      const which = rand() < 0.5;
      return which
        ? { ask: 'How many bits of uncertainty has one side\'s collection, taken alone?', show: `<p><b>${pairs}</b> perfectly entangled ${pairs === 1 ? 'pair is' : 'pairs are'} made, and one photon of each is sent to each of two laboratories. The state of the whole is known exactly.</p>`, ...choices(rand, `${pairs}`, [`${pairs * 2}`, '0', `${pairs + 1}`]), why: `Each photon alone is a fair coin toss: one bit each, ${pairs} in all. And the whole has none.` }
        : { ask: 'How many bits of uncertainty has the whole?', show: `<p><b>${pairs}</b> perfectly entangled ${pairs === 1 ? 'pair is' : 'pairs are'} made, and one photon of each is sent to each of two laboratories. The state of the whole is known exactly.</p>`, ...choices(rand, '0', [`${pairs}`, `${pairs * 2}`, '1']), why: `None: the state of the whole is known. Each side alone has ${pairs} ${pairs === 1 ? 'bit' : 'bits'}. The parts are more uncertain than the whole, which never happens without entanglement.` };
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

let left = 0;
let right = 0;
const tally = { same: [0, 0], differ: [0, 0], nearPass: [0, 0, 0], nearRuns: [0, 0, 0] };
let last: [boolean, boolean] | null = null;
let seed = 314159;
const even = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
function run(): void {
  // The near photon passes or stops at random; the far one does the same with the chance the rule gives.
  const near = even() < 0.5;
  const same = even() < agree(SETTINGS[left] - SETTINGS[right]);
  const far = same ? near : !near;
  last = [near, far];
  const bucket = left === right ? tally.same : tally.differ;
  bucket[1]++;
  if (same) bucket[0]++;
  tally.nearRuns[right]++;
  if (near) tally.nearPass[right]++;
}
const plan = [true, true, true];
const triedPlans = new Set<string>();

function bench(): string {
  let g = DEFS + stars(460, 190, 26, 111);
  const dial = (cx: number, setting: number, lit: boolean | null, name: string) => {
    let d = `<circle cx="${cx}" cy="86" r="30" fill="#0b0e22" stroke="#aab0d6" stroke-width="2.5"/>`;
    for (let k = 0; k < 3; k++) {
      const a = ((SETTINGS[k] - 90) * Math.PI) / 180;
      d += `<text x="${(cx + 44 * Math.cos(a)).toFixed(1)}" y="${(90 + 44 * Math.sin(a)).toFixed(1)}" font-size="11" text-anchor="middle" opacity="${k === setting ? 1 : 0.5}">${k + 1}</text>`;
    }
    const a = ((SETTINGS[setting] - 90) * Math.PI) / 180;
    d += `<path d="M${(cx - 24 * Math.cos(a)).toFixed(1)} ${(86 - 24 * Math.sin(a)).toFixed(1)}L${(cx + 24 * Math.cos(a)).toFixed(1)} ${(86 + 24 * Math.sin(a)).toFixed(1)}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
    d += `<circle cx="${cx}" cy="150" r="13" fill="${lit === null ? '#2c3260' : lit ? '#e8c24a' : '#7fb6ff'}" ${lit === null ? '' : 'filter="url(#art-glow)"'}/><text x="${cx}" y="180" font-size="11" text-anchor="middle">${lit === null ? name : lit ? 'passed' : 'stopped'}</text><text x="${cx}" y="18" font-size="11.5" text-anchor="middle">${name}</text>`;
    return d;
  };
  g += `<path d="M230 86H136M230 86H324" stroke="#ff9ab8" stroke-width="2" stroke-dasharray="5 5"/><circle cx="230" cy="86" r="11" fill="#ff9ab8" filter="url(#art-glow)"/><text x="230" y="116" font-size="11" text-anchor="middle">source of pairs</text>`;
  g += dial(96, left, last ? last[1] : null, 'the far detector') + dial(364, right, last ? last[0] : null, 'the near detector');
  const pct = (a: number, b: number) => (b ? `${a} of ${b} (${Math.round((100 * a) / b)}%)` : 'none yet');
  const near = [0, 1, 2].map((k) => (tally.nearRuns[k] ? `${Math.round((100 * tally.nearPass[k]) / tally.nearRuns[k])}%` : '–')).join(', ');
  return `<svg viewBox="0 0 460 190" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><table class="tally" style="margin:8px auto;font-size:15px"><tr><td>Dials on the <b>same</b> setting: the two did the same</td><td><b>${pct(tally.same[0], tally.same[1])}</b></td></tr><tr><td>Dials on <b>different</b> settings: the two did the same</td><td><b>${pct(tally.differ[0], tally.differ[1])}</b></td></tr><tr><td>The near photon passed, with the near dial on 1, 2, 3</td><td>${near}</td></tr></table>`;
}

function instructions(): string {
  const got = planAgrees(plan);
  let g = '';
  const X = (k: number) => 190 + k * 70;
  const Yr = (k: number) => 60 + k * 44;
  g += `<text x="${X(1)}" y="16" font-size="11.5" text-anchor="middle">near dial</text><text x="96" y="${Yr(1) + 4}" font-size="11.5" text-anchor="middle" transform="rotate(-90 96 ${Yr(1) + 4})">far dial</text>`;
  for (let k = 0; k < 3; k++) g += `<text x="${X(k)}" y="36" font-size="12" text-anchor="middle">${k + 1}</text><text x="130" y="${Yr(k) + 4}" font-size="12" text-anchor="middle">${k + 1}</text>`;
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++) {
      const same = plan[a] === plan[b];
      g += `<rect x="${X(b) - 30}" y="${Yr(a) - 18}" width="60" height="36" rx="6" fill="${a === b ? 'rgba(255,255,255,0.05)' : same ? 'rgba(143,224,164,0.25)' : 'rgba(255,154,154,0.18)'}" stroke="rgba(255,255,255,0.12)"/><text x="${X(b)}" y="${Yr(a) + 4}" font-size="12" text-anchor="middle" opacity="${a === b ? 0.5 : 1}">${same ? 'same' : 'differ'}</text>`;
    }
  // Where the instructions land, against what is measured.
  const B = (f: number) => 40 + f * 380;
  let bar = `<path d="M${B(0)} 30H${B(1)}" stroke="#8d93b8"/>`;
  for (const [f, name] of [[0, '0'], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [1, '1']] as [number, string][]) bar += `<path d="M${B(f)} 25v10" stroke="#8d93b8"/><text x="${B(f)}" y="50" font-size="11" text-anchor="middle" opacity="0.8">${name}</text>`;
  bar += `<rect x="${B(0)}" y="24" width="${B(1 / 3) - B(0)}" height="12" fill="rgba(255,154,154,0.25)"/><path d="M${B(0.25)} 8V38" stroke="#e8c24a" stroke-width="3"/><text x="${B(0.25)}" y="6" font-size="11" text-anchor="middle" fill="#e8c24a">measured</text><circle cx="${B(got)}" cy="30" r="7" fill="#fff"/>`;
  return `<svg viewBox="0 0 460 170" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><svg viewBox="0 -8 460 64" style="width:100%;max-width:560px;display:block;margin:4px auto 0">${bar}</svg><p>With these instructions, pairs on different settings would match <b>${got === 1 ? 'every time' : `${frac(Math.round(got * 6), 6)} of the time`}</b>. The real ones match ¼ of the time. No instructions can reach the shaded part.</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>Two or more things that share one state, with none having a state of its own, are <b>entangled</b>.</li>
      <li>The idea that each particle carries definite answers, unaffected by what is done far away, is <b>local realism</b>; the answers are <b>hidden variables</b>. The 1935 argument for them is the <b>EPR</b> argument, after Einstein, Podolsky and Rosen.</li>
      <li>That no such scheme can match quantum physics is <b>Bell's theorem</b> (John Bell, 1964), and the limit such schemes obey is a <b>Bell inequality</b>.</li>
      <li>That neither side can affect what the other sees alone is the <b>no-signalling</b> property.</li>
      <li>The uncertainty a part has because it is entangled with the rest is its <b>entanglement entropy</b>.</li>
    </ul>
    <p><b>How this is known.</b> Freedman and Clauser made the first test in 1972, and Alain Aspect's group in Paris a sharper one in 1982, changing the settings while the photons were in flight. In 2015 three groups, in Delft, Vienna and Colorado, closed the remaining gaps in the argument at once. In 2017 the Chinese satellite Micius sent entangled photons to two ground stations 1,200 km apart, and the result held. The 2022 Nobel Prize went to Aspect, Clauser and Anton Zeilinger.</p>
    <p><b>What is ruled out, and what is not.</b> Ruled out: that each particle carries pre-set answers and is unaffected by distant choices. Not ruled out, and still argued over: which half of that to give up. Some say the results are simply not settled until measured. Some say there are definite facts, connected in a way that ignores distance but cannot carry a signal. These are the same camps as at the end of chamber 17, and no experiment yet separates them.</p>
    <p class="soft">The chamber's version, with three settings and "fewer than a third", is David Mermin's (1981). Laboratories test an equivalent form with four settings, whose limit is 2 and which entangled photons push to 2.83. This page checks both.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>An inequality from counting.</b> Suppose each pair carries instructions: for each of three settings, pass or stop. There are only eight possible sets. In two of them all three answers agree, and the photons match on every pairing of settings. In the other six, two answers agree and one differs; of the three ways to choose two different settings, exactly one picks the agreeing two. So, whatever mixture of instructions the source uses,</p>
      <div class="eq">chance of matching on different settings ≥ ⅓</div>
      <p>This is a <b>bound</b>: a statement not of what a quantity is, but of what it cannot go below. It needs no physics at all, only counting.</p>
      <p><b>What the photons do.</b> By the arrows of chamber 16, two photons in this shared state match at filters an angle θ apart with chance</p>
      <div class="eq">cos² θ</div>
      <p>The three settings are 60° apart from each other, and cos² 60° = ¼ (and cos² 120° is ¼ too). A quarter is less than a third. That is the whole of Bell's theorem.</p>
      <p><b>The shared state.</b> Write "upright" and "level" for the two polarisations. The pair has an arrow of length 1/√2 for "both upright" and the same for "both level", and none for one of each. No pair of separate states, one per photon, multiplies out to that.</p>
      <p><b>Parts and whole.</b> Squaring those arrows: each photon alone is upright half the time and level half the time, whatever is done to the other. One bit of uncertainty each; none in the pair.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://www.nobelprize.org/prizes/physics/2022/popular-information/" target="_blank" rel="noopener">The Nobel Prize in Physics 2022, popular information</a>. The experiments, in plain language.</li>
      <li>Read: N. David Mermin, "Is the moon there when nobody looks?" (<i>Physics Today</i>, April 1985). The three-setting device of this chamber, by the person who devised it. Widely reprinted.</li>
      <li>Read: <a href="https://plato.stanford.edu/entries/bell-theorem/" target="_blank" rel="noopener">Stanford Encyclopedia of Philosophy, Bell's Theorem</a>. Exactly what is assumed and what follows.</li>
      <li>Read: <a href="https://www.quantamagazine.org/tag/entanglement/" target="_blank" rel="noopener">Quanta Magazine, on entanglement</a>.</li>
      <li>Watch: minutephysics and 3Blue1Brown, "Bell's Theorem: The Quantum Venn Diagram Paradox" (2017). The same argument, done with three polarising filters you can hold in your hand. Search for the title: a stable link could not be confirmed.</li>
      <li>Course: <a href="https://theoreticalminimum.com/courses/quantum-entanglement/2006/fall" target="_blank" rel="noopener">Leonard Susskind, Quantum Entanglements (Stanford)</a>.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · two things, one state', 'Could the answers have been set in advance?', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let chamber: Running | undefined;
  chamber = runChamber({
    sh,
    file: 'entangled',
    kicker: 'The quantum · 18',
    title: 'Two things, one state',
    steps: [
      { say: 'A source in the middle sends out photons in pairs, one each way. Each meets a filter that it either passes or is stopped by, and each filter has a dial with three settings. ¶ Leave both dials on setting 1. <b>Send at least 30 pairs.</b>', until: () => tally.same[1] >= 30 },
      { say: 'Each detector alone: pass, stop, stop, pass, with no pattern. But the two <i>always do the same thing</i>. Try the dials both on 2, or both on 3: the same.', ask: ['What is the most natural explanation?', ['The photons signal each other as they are measured', 'Each pair leaves the source carrying matching instructions: what to do at each setting', 'It is coincidence'], 1, 'That is what Einstein thought, and it is how matching gloves in two boxes work. For thirty years it seemed a matter of taste whether to believe it. Then John Bell found that it can be tested: by setting the two dials differently.'] },
      { say: '<b>Turn the two dials to different settings and send 300 pairs.</b> Any different settings will do; try more than one.', until: () => tally.differ[1] >= 300 },
      { say: 'On different settings the two match about a quarter of the time. Keep that figure. Now try to explain it. ¶ Below, you write the instructions a pair carries: for each of the three settings, pass or stop. Both photons carry the same set, so that they always match on the same setting. <b>Try several different sets.</b>', until: () => triedPlans.size >= 4 },
      { say: 'The grid shows, for every pairing of dials, whether your instructions make the photons match.', ask: ['On different settings, what is the lowest rate of matching any instructions give?', ['A quarter', 'A third', 'Zero'], 1, 'Any three answers of "pass" or "stop" must contain two that agree, so at least one pairing in three matches. Mixing different instruction sets cannot go below a third either. This limit is a Bell inequality.'] },
      { say: 'Instructions: at least a third. Measured: a quarter.', ask: ['What follows?', ['The measurement must be wrong', 'The photons did not carry instructions. No pre-set answers, however clever, give these results', 'The photons carried very complicated instructions'], 1, 'This is Bell\'s theorem (1964), and since 1972 experiments have confirmed the quantum figure, with every loophole closed by 2015. The pair has a state. Neither photon has one of its own.'] },
      { say: 'It is tempting to say that measuring one photon instantly tells the other what to do. Look at the bottom line of the tally: how often the near photon passed, for each near setting.', ask: ['If the far dial is turned, what changes in what the near detector sees alone?', ['Its photons pass more often', 'Nothing: half pass and half stop, at random, as before', 'Its results stop being random'], 1, 'Nothing whatever. The connection appears only when the two lists are brought together and compared, and that needs an ordinary message. So nothing here outruns light, and the light cones of chamber 3 are untouched.'] },
      { say: 'One more thing, and it is the bridge to the end of the map. The state of the pair is known exactly. Each photon, taken alone, is a perfect coin toss.', ask: ['Where have you met this before: something whose own behaviour became random because of what it shared with something else?', ['In chamber 17: the particle and the molecule that bounced off it', 'In chamber 6: the planet and the sun', 'Nowhere'], 0, 'The same thing exactly. When the molecule was left differently by the two paths, molecule and particle became entangled, and the particle alone lost its interference. A record kept by the surroundings <i>is</i> entanglement with the surroundings. The whole stays exactly known; the parts, alone, look random.'] },
    ],
    summary: '<b>Two things can share a single state, with neither having one of its own.</b> Alone, each behaves by pure chance. Compared, they match in a way that no pre-set instructions could produce: that is Bell\'s theorem, and experiment has confirmed it. No message can be sent this way. And a part of an exactly known whole can be perfectly random, which is the idea the last chamber turns on.',
    frame: () =>
      `<div id="bench"></div><div class="bar"><span class="soft">far dial:</span>${[0, 1, 2].map((k) => `<button class="chip pale" data-do="left" data-v="${k}">${k + 1}</button>`).join('')}<span class="soft">near dial:</span>${[0, 1, 2].map((k) => `<button class="chip pale" data-do="right" data-v="${k}">${k + 1}</button>`).join('')}</div><div class="bar"><button class="chip gold" data-do="send" data-v="1">send a pair</button><button class="chip pale" data-do="send" data-v="30">send 30</button><button class="chip pale" data-do="send" data-v="300">send 300</button><button class="chip pale" data-do="clear" data-v="on">clear the tally</button></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">Write the instructions yourself</div><div id="instructions"></div><div class="bar">${[0, 1, 2].map((k) => `<button class="chip pale" data-do="plan" data-v="${k}" id="plan${k}"></button>`).join('')}</div></div>`,
    paint: () => {
      $('bench').innerHTML = bench();
      $('instructions').innerHTML = instructions();
      chamber?.mark('left', (k) => Number(k) === left);
      chamber?.mark('right', (k) => Number(k) === right);
      for (let k = 0; k < 3; k++) {
        const b = document.getElementById(`plan${k}`);
        if (b) b.textContent = `setting ${k + 1}: ${plan[k] ? 'pass' : 'stop'}`;
      }
      ($('part2') as HTMLElement).hidden = (chamber?.step() ?? 0) < 3;
    },
    act: (what, value) => {
      if (what === 'left') left = Number(value);
      else if (what === 'right') right = Number(value);
      else if (what === 'send') {
        for (let i = 0; i < Number(value); i++) run();
      } else if (what === 'clear') {
        tally.same = [0, 0];
        tally.differ = [0, 0];
        tally.nearPass = [0, 0, 0];
        tally.nearRuns = [0, 0, 0];
        last = null;
      } else if (what === 'plan') {
        plan[Number(value)] = !plan[Number(value)];
        triedPlans.add(plan.join());
      }
    },
    key: () => [['#ff9ab8', 'the source'], ['#e8c24a', 'passed'], ['#7fb6ff', 'stopped'], ['#fff', 'where your instructions land']],
    drawer,
    next: ['dimensions', 'On to the edges'],
  });
  sh.draw();
}
expose(
  () => {
    // Pairs sent by chance should match as the rule says.
    let s = 2718;
    const rnd = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    let same = 0;
    for (let i = 0; i < 40000; i++) if (rnd() < agree(60)) same++;
    return [...checkKinds(KINDS), ...checkQuantum(), ...checkEntangled(), ...(Math.abs(same / 40000 - 0.25) < 0.01 && planAgrees([true, true, false]) === 1 / 3 && planAgrees([true, true, true]) === 1 ? [] : ['the chamber\'s own figures'])];
  },
  () => ({ left, right, tally, plan, done: sh.kept.chapter }),
);
