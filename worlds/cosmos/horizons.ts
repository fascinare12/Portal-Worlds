import { Shell, checkKinds, choices, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { frac, tidy } from './physics';
import { arrives, checkStrong, reply, ship, shipCut, stretch, unruh } from './strong';

/**
 * Horizons.
 *
 * A ship that keeps its engines burning for ever never reaches the speed of
 * light, and yet there is a last message from home that can ever catch it.
 * Light sent later gains on the ship for ever and never closes the gap. The
 * edge of what the ship can ever see is a horizon: nothing is there, home
 * passes through it without noticing, messages cross it one way only, and it
 * vanishes if the engines are cut.
 *
 * Every one of those properties comes back in the next chamber, where
 * gravity makes a horizon that cannot be turned off.
 *
 * The playable is the spacetime diagram again, with the ship's bent path.
 * The thrust is such that everything comes out in round numbers: 0.97 of the
 * Earth's gravity, for which the horizon forms one light-year behind.
 */

const sh = new Shell('portal-worlds-cosmos-horizons-v1');

// ---- Practice ----

const IDEAS: [string, string, string[], string][] = [
  ['A ship thrusts steadily for ever. Light is faster than the ship at every moment. How can any light from home fail to catch it?', 'The light gains on the ship for ever, but by less and less, and the gap never closes', ['The ship does pass the speed of light in the end', 'Light from home slows down on the way', 'Space ends behind the ship'], 'The ship\'s speed creeps toward light\'s without reaching it. A flash sent too late closes on the ship more and more slowly: always nearer, never there.'],
  ['Home is one light-year behind a ship thrusting at 1 g, at the moment the ship\'s horizon passes over it. What do the people at home notice?', 'Nothing at all', ['A flash of light', 'Their clocks stop', 'They are pulled toward the ship'], 'A horizon is not a thing. It is the edge of what somebody else will ever be able to see. Nothing marks it where it is.'],
  ['Can the ship send messages home across its own horizon?', 'Yes: the ship\'s messages always arrive. It is only home\'s late messages that never do', ['No: nothing crosses a horizon either way', 'Only while the engines are off', 'Only messages sent in the first year'], 'A horizon is one-way. Signals pass from the ship\'s side to the far side, and never back.'],
  ['The ship\'s crew cut the engines and coast. What becomes of the horizon?', 'It is gone: every message from home now arrives in the end', ['It stays where it was', 'It moves closer', 'It doubles in size'], 'The horizon belonged to the plan of thrusting for ever. A coasting ship moves slower than light, and light catches it.'],
  ['The Unruh effect says an accelerating thermometer in empty space reads slightly warm. What is its standing?', 'Predicted by well-tested theory; too small to have been measured directly', ['Measured many times in the laboratory', 'Disproved', 'A guess with no theory behind it'], 'At 1 g the warmth is 4 hundred-billion-billionths of a degree. The prediction is not seriously doubted, and nobody has yet seen it directly.'],
  ['Watching home through a telescope from the ever-thrusting ship, what does the crew see happen to home\'s clock?', 'It runs slower and slower, creeping toward one fixed reading and never passing it', ['It runs faster and faster', 'It stops suddenly', 'It runs normally, then vanishes'], 'Each later flash takes longer to arrive than the one before, without limit. The picture of home reddens, dims and freezes. Home itself carries on as usual.'],
];
const DIST = [0.54, 2.76, 9.07, 26.3, 73.2, 200.7, 547.3, 1489.5, 4050.5];

const EXAMPLES: Record<string, string> = {
  catch: '<p>A ship holds <b>4 g</b> for ever. Home sends a message <b>0.2 years</b> after it left. Does it arrive?</p><ol><li>At 1 g, the last message that can arrive is sent about 1 year after the ship leaves.</li><li>At 4 times the thrust, that deadline is 4 times sooner: 1 ÷ 4 = 0.25 years.</li><li>0.2 is before 0.25, so <b>yes, it arrives</b>.</li></ol><p>A message sent at 0.3 years would be after the deadline, and would never arrive while the engines burn.</p>',
  where: '<p>A ship thrusts at <b>5 g</b>. How far behind it is its horizon?</p><ol><li>At 1 g the horizon is about 1 light-year behind.</li><li>The distance goes as one over the thrust: 1 ÷ 5 = <b>1/5 of a light-year</b>.</li></ol><p>Harder thrust, closer horizon. Gentle thrust, a horizon far away.</p>',
  arrive: '<p>At 1 g, a message sent with <b>½ a year</b> to spare before the deadline arrives when the ship\'s clock reads 0.69 years. What of one sent with <b>1/8 of a year</b> to spare?</p><ol><li>Each time the margin is halved, the arrival is 0.69 years later.</li><li>From ½ to 1/8 is two more halvings (½ → ¼ → 1/8), three in all.</li><li>3 × 0.69 = <b>2.08 years</b>.</li></ol><p>This is what a logarithm does: it turns repeated halving into steady adding. 0.69 is the natural logarithm of 2.</p>',
  far: '<p>After <b>3</b> years by its own clock, a ship at 1 g is <b>9.07 light-years</b> from home. Roughly how far after 4?</p><ol><li>Once it is well under way, each further year aboard multiplies the distance by about 2.7 (the number e).</li><li>9.07 × 2.7 ≈ <b>25 light-years</b>. (Exactly, 26.3.)</li></ol><p>Not 9.07 plus a bit: growth by a fixed <i>multiple</i> each year is exponential growth.</p>',
  sees: '<p>The ship\'s clock reads <b>2 years</b>. How slowly does home\'s clock seem to run, seen from the ship?</p><ol><li>The slowing multiplies by about 2.7 for each year aboard.</li><li>After 2 years: 2.7 × 2.7 ≈ <b>7.4 times slower than life</b>.</li></ol>',
  idea: '<p>Four facts about the horizon of a ship that thrusts for ever settle these.</p><ol><li>It exists although the ship never reaches the speed of light.</li><li>Nothing is there: whoever is passed over by it notices nothing.</li><li>It is one-way: the ship\'s signals get out, late signals never get in.</li><li>It belongs to the thrust: cut the engines and it is gone.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'catch',
    level: 1,
    make(rand) {
      const k = pickOne(rand, [1, 2, 4, 5]);
      const sent = pickOne(rand, [0.25, 0.5, 0.8, 1.2, 1.5, 3]) / k;
      const ok = sent * k < 1;
      return { ask: 'Does the message ever reach the ship?', show: `<p>At 1 g, the last message from home that can ever reach an ever-thrusting ship is sent about 1 year after it leaves. At k times the thrust the deadline is k times sooner.</p><p>A ship holds <b>${k} g</b> for ever. Home sends a message <b>${tidy(sent)} ${sent === 1 ? 'year' : 'years'}</b> after it left.</p>`, options: ['Yes, in the end', 'No, never, while the engines burn'], right: ok ? 0 : 1, why: `The deadline at ${k} g is 1 ÷ ${k} = ${tidy(1 / k)} ${k === 1 ? 'year' : 'years'}. ${tidy(sent)} is ${ok ? 'before it: the flash catches the ship' : 'after it: the flash gains on the ship for ever and never arrives'}.` };
    },
  },
  {
    id: 'where',
    level: 1,
    make(rand) {
      const k = pickOne(rand, [2, 3, 4, 10]);
      const gentle = rand() < 0.3;
      return { ask: 'How far behind the ship is its horizon?', show: `<p>At 1 g the horizon of an ever-thrusting ship is about 1 light-year behind where it started. The distance goes as one over the thrust.</p><p>A ship thrusts at <b>${gentle ? `${frac(1, k)} of a g` : `${k} g`}</b>.</p>`, ...choices(rand, gentle ? `${k} light-years` : `${frac(1, k)} of a light-year`, gentle ? [`${frac(1, k)} of a light-year`, '1 light-year', `${k * k} light-years`] : [`${k} light-years`, '1 light-year', `${frac(1, k * k)} of a light-year`]), why: gentle ? `1 ÷ ${frac(1, k)} = ${k}. Gentle thrust puts the horizon far away.` : `1 ÷ ${k} = ${frac(1, k)}. The harder the thrust, the closer the horizon.` };
    },
  },
  {
    id: 'arrive',
    level: 2,
    make(rand) {
      const n = 2 + Math.floor(rand() * 4);
      const right = tidy(Math.log(2) * n);
      return { ask: 'What does the ship\'s clock read when it arrives?', show: `<p>At 1 g, a message sent with ½ a year to spare before the deadline arrives when the ship's clock reads 0.69 years. Each halving of the margin delays the arrival by another 0.69.</p><p>A message is sent with <b>${frac(1, 2 ** n)} of a year</b> to spare.</p>`, outside: `<p class="soft">How many times must ½ be halved to reach ${frac(1, 2 ** n)}? Count the halvings from a whole year.</p>`, ...choices(rand, `${right} years`, [`${tidy(0.69 * 2 ** (n - 1))} years`, `${tidy(Math.log(2) * (n - 1))} years`, `${tidy(Math.log(2) * (n + 1))} years`, `${tidy(0.69 / n)} years`]), why: `${frac(1, 2 ** n)} is a year halved ${n} times, so ${n} × 0.69 = ${right}. Halve the margin for ever and the arrival is delayed for ever: that is the horizon.` };
    },
  },
  {
    id: 'far',
    level: 2,
    make(rand) {
      const i = 2 + Math.floor(rand() * 6);
      const now = DIST[i];
      const next = DIST[i + 1];
      const show = (x: number) => (x >= 100 ? Math.round(x).toLocaleString() : tidy(x));
      return { ask: 'Roughly how far is it a year later, by its own clock?', show: `<p>A ship thrusting at 1 g is <b>${show(now)} light-years</b> from home when its own clock reads <b>${i + 1} years</b>. Once it is well under way, each year aboard multiplies the distance by about 2.7.</p>`, ...choices(rand, `About ${show(next)} light-years`, [`About ${show(now + (now - DIST[i - 1]))} light-years`, `About ${show(now * 2)} light-years`, `About ${show(now * now)} light-years`]), why: `${show(now)} × 2.7 ≈ ${show(next)}. The distance multiplies each year; it does not merely add.` };
    },
  },
  {
    id: 'sees',
    level: 3,
    make(rand) {
      const tau = 1 + Math.floor(rand() * 5);
      const show = (x: number) => (x >= 10 ? String(Math.round(x)) : tidy(Math.round(x * 10) / 10));
      return { ask: 'Seen from the ship, how slowly does home\'s clock seem to run?', show: `<p>From an ever-thrusting ship at 1 g, home's clock seems to run slower by a factor that multiplies by about 2.7 for every year on the ship's clock.</p><p>The ship's clock reads <b>${tau} ${tau === 1 ? 'year' : 'years'}</b>.</p>`, ...choices(rand, `About ${show(stretch(tau))} times slower than life`, [`About ${show(stretch(tau + 1))} times slower than life`, `About ${show(2.7 * tau + 0.3)} times slower than life`, `About ${show(stretch(tau - 1) + 0.4)} times slower than life`]), why: `2.7 multiplied by itself ${tau} ${tau === 1 ? 'time' : 'times'}: ${show(stretch(tau))}. The picture of home is slowed, reddened and dimmed by that factor, and it grows without limit.` };
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

let sent = 0.2;
let sentMax = 0.2;
let off = Infinity;
const layer = { sees: false, replies: false };
const U = 84;
const X = (x: number) => 60 + x * U;
const Y = (t: number) => 450 - t * U;
const TOP = 5.2;
const where = (tau: number) => (off === Infinity ? ship(tau) : shipCut(tau, off));

function diagram(): string {
  let g = '';
  if (off === Infinity) g += `<path d="M${X(-0.6)} ${Y(0.4)}L${X(4.2)} ${Y(TOP)}H${X(-0.6)}Z" fill="rgba(255,154,154,0.09)"/><text x="${X(0.75)}" y="${Y(4.55)}" font-size="12" text-anchor="middle" fill="#ff9a9a">never seen from the ship</text><text x="${X(0.75)}" y="${Y(4.55) + 15}" font-size="12" text-anchor="middle" fill="#ff9a9a">while the engines burn</text>`;
  g += `<path d="M${X(-0.6)} ${Y(0.4)}L${X(4.2)} ${Y(TOP)}" stroke="${off === Infinity ? '#ff9a9a' : '#4a5080'}" stroke-dasharray="5 5" fill="none"/>`;
  if (off === Infinity) g += `<text x="${X(1.85)}" y="${Y(3.1)}" font-size="12" fill="#ff9a9a" transform="rotate(-45 ${X(1.85)} ${Y(3.1)})">the horizon</text>`;
  // What the ship sees of home, and what home hears from the ship.
  const ray = (x0: number, t0: number, x1: number, t1: number, colour: string, width = 1.2) => {
    // Cut off at the top of the picture.
    const k = t1 > TOP ? (TOP - t0) / (t1 - t0) : 1;
    return `<line x1="${X(x0).toFixed(1)}" y1="${Y(t0).toFixed(1)}" x2="${X(x0 + (x1 - x0) * k).toFixed(1)}" y2="${Y(t0 + (t1 - t0) * k).toFixed(1)}" stroke="${colour}" stroke-width="${width}" stroke-dasharray="${width > 2 ? '' : '4 4'}"/>`;
  };
  const flash = (from: number, colour: string, width: number) => {
    const tau = arrives(from, off);
    if (tau === Infinity) return ray(0, from, TOP - from + 0.2, TOP + 0.2, colour, width);
    const p = where(tau);
    return ray(0, from, p.x, p.t, colour, width);
  };
  if (layer.sees) for (let s = 0.25; s < 2.01; s += 0.25) g += flash(s, '#e8c24a', 1.2);
  if (layer.replies)
    for (let tau = 0.5; tau < 3.6; tau += 0.5) {
      const p = where(tau);
      if (p.t < TOP) g += ray(p.x, p.t, 0, p.t + p.x, '#7fb6ff');
    }
  // Home, with its years.
  g += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(TOP)}" stroke="#e8c24a" stroke-width="4"/>`;
  for (let t = 1; t <= 5; t++) g += `<circle cx="${X(0)}" cy="${Y(t)}" r="4.5" fill="#0b0e22" stroke="#e8c24a" stroke-width="2"/><text x="${X(0) - 10}" y="${Y(t) + 4}" font-size="11" text-anchor="end" opacity="0.7">${t}</text>`;
  // The ship, with its years.
  let d = '';
  for (let tau = 0; tau <= 6; tau += 0.02) {
    const p = where(tau);
    if (p.t > TOP + 0.05) break;
    d += `${d ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.t).toFixed(1)}`;
  }
  g += `<path d="${d}" stroke="#7fb6ff" stroke-width="4" fill="none"/>`;
  for (let tau = 1; tau <= 5; tau++) {
    const p = where(tau);
    if (p.t < TOP) g += `<circle cx="${X(p.x)}" cy="${Y(p.t)}" r="4.5" fill="#0b0e22" stroke="#7fb6ff" stroke-width="2"/><text x="${X(p.x) + 10}" y="${Y(p.t) + 4}" font-size="11" fill="#7fb6ff">${tau}</text>`;
  }
  if (off !== Infinity) {
    const p = ship(off);
    g += `<text x="${X(p.x) + 12}" y="${Y(p.t) + 18}" font-size="11" fill="#7fb6ff">engines cut</text>`;
  }
  // The message she is sending.
  const lands = arrives(sent, off);
  g += flash(sent, lands === Infinity ? '#ff9a9a' : '#8fe0a4', 3) + `<circle cx="${X(0)}" cy="${Y(sent)}" r="6" fill="${lands === Infinity ? '#ff9a9a' : '#8fe0a4'}"/>`;
  g += `<text x="${X(0)}" y="${Y(0) + 16}" font-size="12" text-anchor="middle" fill="#e8c24a">home</text><text x="${X(2.2)}" y="${Y(0) + 16}" font-size="11" text-anchor="middle" opacity="0.7">distance, light-years →</text><text x="14" y="${Y(2.6)}" font-size="11" text-anchor="middle" opacity="0.7" transform="rotate(-90 14 ${Y(2.6)})">time at home, years →</text>`;
  for (let x = 1; x <= 4; x++) g += `<text x="${X(x)}" y="${Y(0) + 16}" font-size="11" text-anchor="middle" opacity="${x === 2 ? 0 : 0.6}">${x}</text>`;
  return `<svg viewBox="0 0 460 474" style="width:100%;max-width:540px;display:block;margin:auto">${g}</svg>`;
}

function told(): string {
  const lands = arrives(sent, off);
  const head = `Home sends a message when its clock reads <b>${tidy(sent)} years</b>. `;
  if (lands === Infinity) return `<p>${head}<span class="bad">It never reaches the ship.</span> It gains on the ship for ever and never arrives.</p>`;
  const p = where(lands);
  return `<p>${head}<span class="good">It reaches the ship when the ship's clock reads <b>${tidy(lands)} years</b></span>, ${tidy(p.x)} light-years out, in home's year ${tidy(p.t)}${p.t > TOP ? ' (off the top of the picture)' : ''}.</p>`;
}

function drawer(): string {
  const a = 1.0323; // one g, in light-years per year per year
  const reach = (tau: number) => (Math.cosh(a * tau) - 1) / a;
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The edge of the region from which no signal can ever reach an observer is that observer's <b>horizon</b>. This one, for steady thrust, is the <b>Rindler horizon</b>.</li>
      <li>Steady thrust, as felt on board, is constant <b>proper acceleration</b>, and the bent path it gives on the diagram is <b>hyperbolic motion</b>.</li>
      <li>Light arriving stretched, slowed and reddened is <b>redshift</b>. The picture of home is redshifted without limit.</li>
      <li>The faint warmth that theory says an accelerating observer feels in empty space is the <b>Unruh effect</b>.</li>
    </ul>
    <p><b>What is established and what is not.</b> The horizon itself follows from special relativity alone, which is as well tested as anything in physics; but nobody has flown at 1 g for a year, so it has not been watched directly. The Unruh effect was derived in the 1970s (Fulling, Davies, Unruh) and is not seriously doubted, but at 1 g it comes to ${tidy(unruh(9.80665) * 1e20)} hundred-billion-billionths of a degree, and it has not been measured directly.</p>
    <p>A curiosity that falls out of the same arithmetic: holding 1 g, a ship is ${tidy(reach(1))} light-years out after one year by its own clock, ${tidy(reach(3))} after three, ${Math.round(reach(5))} after five, and about ${(Math.round(reach(12) / 1000) * 1000).toLocaleString()} after twelve, which is further than the Milky Way is wide. The trouble is the fuel, not the physics.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>The exponential.</b> There is one function whose rate of change is equal to itself: the bigger it is, the faster it grows, in exact proportion. It is written e<sup>x</sup>, and e is a number, about 2.718. Add 1 to x and the function is multiplied by 2.718; add 1 again and it is multiplied again.</p>
      <p>Its opposite is the <b>natural logarithm</b>, ln: if e<sup>x</sup> = y then x = ln y. A logarithm turns multiplying into adding, so ln 2 ≈ 0.69 is what x must grow by to double e<sup>x</sup>.</p>
      <p><b>The ship.</b> With time in years, distance in light-years, and this chamber's thrust, the ship's own clock reading τ fixes where and when it is:</p>
      <div class="eq">t = ½ (e<sup>τ</sup> − e<sup>−τ</sup>) &nbsp;&nbsp;&nbsp; x = ½ (e<sup>τ</sup> + e<sup>−τ</sup>) − 1</div>
      <p>These two combinations have names, sinh τ and cosh τ. A flash sent from home at time s is at x = t − s. Put the ship's t and x into that and nearly everything cancels:</p>
      <div class="eq">s = 1 − e<sup>−τ</sup> &nbsp;&nbsp;&nbsp; so &nbsp;&nbsp;&nbsp; τ = −ln(1 − s)</div>
      <p>e<sup>−τ</sup> gets as small as you like but is never zero, so s never reaches 1: a flash sent at 1 or later has no arrival time. And as s creeps up to 1, the arrival time grows without limit. That is the horizon, in one line.</p>
      <p><b>Why one light-year.</b> For an acceleration a, the horizon forms a distance c²/a behind. For the Earth's gravity that is 0.97 light-years: a coincidence between how strongly our planet pulls and how long it takes to go round the Sun.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://math.ucr.edu/home/baez/physics/Relativity/SR/Rocket/rocket.html" target="_blank" rel="noopener">The Relativistic Rocket</a>, from the Usenet Physics FAQ kept by John Baez. The formulas of this chamber, with a table of where 1 g takes you, and a section on the horizon ("Below the rocket, something strange is happening").</li>
      <li>Read: <a href="https://www.eftaylor.com/spacetimephysics/" target="_blank" rel="noopener">Taylor and Wheeler, <i>Spacetime Physics</i></a>. The exercises on the accelerating rocket.</li>
      <li>Watch: <a href="https://theoreticalminimum.com/courses/general-relativity/2012/fall" target="_blank" rel="noopener">Leonard Susskind, General Relativity (Stanford)</a>. The lectures on uniformly accelerated observers lead straight into black holes, as this chamber does.</li>
      <li>For the math: <a href="https://www.3blue1brown.com/lessons/eulers-number" target="_blank" rel="noopener">3Blue1Brown, What's so special about Euler's number e?</a>, and <a href="https://openstax.org/books/calculus-volume-1/pages/1-5-exponential-and-logarithmic-functions" target="_blank" rel="noopener">OpenStax Calculus, volume 1, section 1.5</a>, on exponentials and logarithms.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · horizons', 'Does it ever arrive?', 'Ships here thrust steadily and for ever unless it says otherwise. <b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'horizons',
    kicker: 'Horizons · 7',
    title: 'Horizons',
    steps: [
      { say: 'The diagram again: time up, distance across. Home is the gold line. The blue line is a ship that starts beside home and fires its engines steadily, at about the push of the Earth\'s gravity, and never stops. Its path bends over toward the slope of light and never reaches it, because of the budget. The dots are years on each clock. Home sends the ship a message by light: the green line. <b>Slide the sending time later, to half a year.</b>', until: () => sentMax >= 0.5 },
      { say: 'Sent at half a year, it arrives when the ship\'s clock reads 0.69. Light is faster than the ship at every moment, and always will be.', ask: ['Is there any message home could send too late for it ever to catch the ship?', ['No: light is faster, so sooner or later it must arrive', 'Yes'], 1, '<b>Slide the sending time on, to 0.9, to 0.99, and past 1.</b> Watch the arrival time.'] },
      { say: '<b>Slide the sending time on, to 0.9, to 0.99, and past 1.</b> Watch the arrival time.', until: () => sentMax >= 1.05 },
      { say: 'Anything sent after one year never arrives, however long you wait.', ask: ['The ship never reaches the speed of light. So how does the light fail to catch it?', ['It gains on the ship for ever, but by less and less, and never closes the gap', 'The ship does outrun light in the end', 'The light gives out on the way'], 0, 'The blue path keeps nearing the dotted red line and never touches it, and light sent late runs along beside that line. The red line is the ship\'s <b>horizon</b>: the edge of everything it will ever see.'] },
      { say: '<b>Turn on "what the ship sees of home".</b> Each gold line is a flash home sends every quarter of a year.', until: () => layer.sees },
      { say: 'The crew watch home through a telescope. The flashes sent in home\'s first year are spread over the whole of the ship\'s endless journey.', ask: ['What do they see home\'s clock do?', ['Run slower and slower, creeping toward the one-year mark and never passing it', 'Run normally and then vanish at one year', 'Race ahead'], 0, 'The picture of home slows, reddens and dims, without limit. And at home? Nothing whatever happens at the one-year mark. People there cross the ship\'s horizon without noticing, and go on with their lives.'] },
      { say: '<b>Now turn on "the ship\'s replies".</b>', until: () => layer.replies },
      { say: 'The blue dashes are messages from the ship.', ask: ['Do the ship\'s messages reach home?', ['Yes, every one', 'Only those sent in the first year', 'No'], 0, 'A horizon is one-way. Home hears from the ship for ever; the ship can never hear what home did after its first year.'] },
      { say: 'Set the sending time somewhere past one year, so that the message is lost. <b>Then cut the engines.</b>', until: () => off !== Infinity },
      { say: 'With the engines off the ship coasts, slower than light, and the lost message arrives after all.', ask: ['So what was the horizon?', ['A barrier in space, one light-year behind the start', 'Nothing in space at all: a consequence of the plan to keep thrusting for ever'], 1, 'There was never anything there. A horizon is a fact about a whole journey, not about a place. Keep all four of its properties in mind for the next chamber: it exists though nothing reaches light speed; nothing marks it; it is one-way; and what one observer never sees, another passes through untroubled. Gravity can make a horizon with all of those, and no engines to cut.'] },
    ],
    summary: '<b>A horizon is the edge of what an observer can ever see.</b> Steady thrust is enough to make one: light sent too late chases the ship for ever. Nothing is there; it is one-way; and the crew see everything behind it slow, redden and freeze, while the people behind it notice nothing.',
    frame: () =>
      `<div id="diagram"></div><div id="told"></div><div class="bar"><span class="soft">sent at once</span><input id="sent" type="range" min="0" max="2" step="0.01" value="0.2" style="flex:1"><span class="soft">after 2 years</span></div>` +
      `<div class="bar"><button class="chip pale" data-do="layer" data-v="sees">what the ship sees of home</button><button class="chip pale" data-do="layer" data-v="replies">the ship's replies</button></div>` +
      `<div class="bar"><button class="chip pale" data-do="off" data-v="Infinity">engines on for ever</button><button class="chip pale" data-do="off" data-v="1">cut after 1 year aboard</button><button class="chip pale" data-do="off" data-v="2">cut after 2</button></div>`,
    paint: () => {
      $('diagram').innerHTML = diagram();
      $('told').innerHTML = told();
      run?.mark('layer', (k) => layer[k as keyof typeof layer]);
      run?.mark('off', (k) => Number(k) === off);
    },
    slide: (_id, value) => {
      sent = value;
      sentMax = Math.max(sentMax, value);
    },
    act: (what, value) => {
      if (what === 'layer') layer[value as keyof typeof layer] = !layer[value as keyof typeof layer];
      else if (what === 'off') off = Number(value);
    },
    drawer,
    next: ['holes', 'On to black holes'],
  });
  sh.draw();
}
expose(
  () => [...checkKinds(KINDS), ...checkStrong(), ...(Math.abs(arrives(0.5) - Math.log(2)) < 1e-9 && Math.abs(reply(1) - (Math.E - 1)) < 1e-9 && DIST.every((x, i) => Math.abs(x - (Math.cosh(i + 1) - 1)) < 0.06) ? [] : ['the chamber\'s own figures'])],
  () => ({ sent, off, layer, done: sh.kept.chapter }),
);
