import { Shell, checkKinds, choices, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { PACES, frac, tidy } from './physics';
import { C, checkStrong, fallTime, falling, horizon, hover, plunge, seen, tideAtHorizon } from './strong';

/**
 * Black holes.
 *
 * The last chamber's horizon, made by gravity. To hover near a black hole is
 * to be the ever-thrusting ship; to fall in is to be "home", crossing someone
 * else's horizon and noticing nothing. So a falling beacon reaches the
 * horizon, and the centre, in a short time by its own clock, while a watcher
 * far away sees it slow, redden and never quite arrive.
 *
 * The hole here does not spin. Real ones do, which changes the details near
 * the horizon and not the ideas.
 *
 * Three figures: a ship hovering at any height, shown on the budget's arrow;
 * a beacon dropped in, with its own clock and the watcher's; and the same
 * for holes of different mass.
 */

const sh = new Shell('portal-worlds-cosmos-holes-v1');

interface Hole {
  id: string;
  name: string;
  suns: number;
}
const HOLES: Hole[] = [
  { id: 'ten', name: 'ten Suns', suns: 10 },
  { id: 'sgr', name: 'the Milky Way\'s: 4.3 million Suns', suns: 4.3e6 },
  { id: 'm87', name: 'M87\'s: 6.5 billion Suns', suns: 6.5e9 },
];

function span(seconds: number): string {
  const a = Math.abs(seconds);
  const round = (x: number) => (x >= 100 ? Math.round(x).toLocaleString() : x >= 10 ? String(Math.round(x * 10) / 10) : tidy(x));
  if (a >= 86400 * 2) return `${round(a / 86400)} days`;
  if (a >= 3600 * 2) return `${round(a / 3600)} hours`;
  if (a >= 120) return `${round(a / 60)} minutes`;
  if (a >= 1) return `${round(a)} seconds`;
  if (a >= 1e-3) return `${round(a * 1e3)} thousandths of a second`;
  return `${round(a * 1e6)} millionths of a second`;
}
function length(m: number): string {
  if (m >= 1.496e11 * 2) return `${tidy(m / 1.496e11)} times the Earth's distance from the Sun`;
  if (m >= 1e9) return `${tidy(m / 1e9)} million km`;
  return `${tidy(m / 1000)} km`;
}
function big(x: number): string {
  if (x >= 1e12) return `${tidy(x / 1e12)} million million`;
  if (x >= 1e9) return `${tidy(x / 1e9)} billion`;
  if (x >= 1e6) return `${tidy(x / 1e6)} million`;
  if (x >= 100) return Math.round(x).toLocaleString();
  if (x >= 0.01) return tidy(x);
  if (x >= 1e-6) return `${tidy(x * 1e6)} millionths of a`;
  return `${tidy(x * 1e9)} billionths of a`;
}

// ---- Practice ----

const IDEAS: [string, string, string[], string][] = [
  ['A probe falls into a black hole, sending a flash every second by its own clock. What does a watcher far away see?', 'The flashes arrive further and further apart, redder and dimmer, and the probe is never seen to cross', ['The probe speeds up and vanishes in an instant', 'The flashes keep coming once a second until they stop', 'The probe bounces off the horizon'], 'The last flashes sent before the horizon take longer and longer to climb out, without limit. The watcher\'s picture of the probe freezes and fades.'],
  ['The same probe. What does its own clock show as it crosses the horizon?', 'An ordinary, finite time; and nothing unusual happens there', ['Its clock stops', 'An endless time passes', 'Time runs backwards'], 'Like "home" under the thrusting ship\'s horizon, the faller notices nothing at the horizon itself. Its clock runs on to the centre.'],
  ['Who is right: the watcher who never sees the probe cross, or the probe, which crosses?', 'The probe crosses. The watcher only fails to receive the light that would show it', ['The watcher: the probe hangs at the horizon for ever', 'Both, in separate universes', 'Neither: the question has no answer'], 'The watcher\'s "never" is about light arriving, as it was for the thrusting ship. The crossing is an event on the probe\'s own path, and it happens.'],
  ['What does the Sun\'s gravity do to the Earth if the Sun is replaced by a black hole of the same mass?', 'Nothing changes: the Earth orbits as before, in the dark', ['The Earth is sucked in', 'The Earth flies away', 'The Earth\'s orbit shrinks slowly'], 'From far away a black hole pulls exactly as any other body of its mass. They are not vacuum cleaners. The differences are all close in.'],
  ['Why can nothing, with any engine, climb back out from inside the horizon?', 'Inside, the centre is not a place ahead of you but a time ahead of you', ['The pull is strong but a strong enough engine would manage', 'There is a solid surface in the way', 'It could, but nobody has tried'], 'Outside you can stay where you are and must move forward in time. Inside the horizon those roles are exchanged: every possible path, light\'s included, leads to smaller radius.'],
  ['What is known about the very centre of a black hole, the singularity?', 'That general relativity gives no answer there: the theory breaks down', ['It is a tiny solid ball', 'It is a doorway, and this has been observed', 'It is empty space like anywhere else'], '"Singularity" is the name for where the equations stop making sense. What replaces them is not known; that needs a theory of gravity and quantum physics together.'],
  ['How do we know black holes exist?', 'Stars are seen orbiting something dark and millions of Suns in mass; merging holes have been heard in gravitational waves; and two have been imaged', ['Only from the equations', 'One has been visited by a probe', 'They are still only a guess'], 'Three independent kinds of evidence, each matching the predictions. The inside, by its nature, is not among the things seen.'],
];

const EXAMPLES: Record<string, string> = {
  radius: '<p>A black hole has the mass of <b>20 Suns</b>. How big is its horizon?</p><ol><li>For the Sun\'s mass the horizon\'s radius would be about 3 km.</li><li>The radius is in simple proportion to the mass: 3 × 20 = <b>60 km</b>.</li></ol><p>Twice the mass, twice the radius. That is unlike ordinary things, whose size grows much more slowly than their mass.</p>',
  rate: '<p>A ship hovers where things that fell in from far away go past at <b>5/13</b> of the speed of light. How fast does its clock run, against one far away?</p><ol><li>This is the budget again: (speed)² + (clock rate)² = 1.</li><li>5/13 belongs to the 5-12-13 triangle, so the rate is <b>12/13</b>.</li></ol><p>A clock held still at some height runs exactly like a clock moving at the falling speed for that height.</p>',
  where: '<p>How far out do things falling from far away pass at <b>1/6</b> of the speed of light?</p><ol><li>The falling speed, as a fraction of light\'s, is 1 over the square root of the distance in horizon radii.</li><li>So the distance is 1 over the speed, squared: 6 × 6 = <b>36 horizon radii</b>.</li></ol><p>At the horizon itself (1 radius) the falling speed is 1: the speed of light.</p>',
  fall: '<p>From the horizon of a Sun-mass hole to its centre takes about 7 millionths of a second on the faller\'s clock. What about a hole of <b>100 Suns</b>?</p><ol><li>Everything about a black hole scales with its mass, times included.</li><li>7 × 100 = <b>700 millionths of a second</b>.</li></ol>',
  orbit: '<p>Can a probe with its engines off hold a steady circle at <b>4 horizon radii</b>?</p><ol><li>Stable circles exist only from 3 horizon radii outward.</li><li>4 is more than 3: <b>yes</b>.</li></ol><p>Between 1.5 and 3 radii a circle is possible but the slightest nudge ends it. At 1.5 only light can circle. Inside that, nothing circles at all.</p>',
  tide: '<p>One hole has <b>5 times</b> the mass of another. How do the tides at their horizons compare?</p><ol><li>The tide at the horizon goes as one over the mass, squared.</li><li>5 × 5 = 25: the heavier hole\'s is <b>25 times gentler</b>.</li></ol><p>Why: the tide goes as mass ÷ distance³, and the horizon\'s distance grows with the mass. Mass ÷ mass³ leaves one over mass squared.</p>',
  idea: '<p>Carry over the four facts about a horizon from the last chamber, and add two.</p><ol><li>Hovering near a hole is thrusting; falling in is being "home". The faller notices nothing at the horizon.</li><li>A far watcher sees the faller slow, redden and never cross. That is about light arriving, not about what happens.</li><li>Far from a hole, its gravity is the same as any other body\'s of that mass.</li><li>Inside, the centre is in your future. What happens there is not known.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'radius',
    level: 1,
    make(rand) {
      const [n, right, wrong] = pickOne(rand, [
        ['5 Suns', '15 km', ['5 km', '75 km', '3 km']],
        ['10 Suns', '30 km', ['10 km', '300 km', '3 km']],
        ['30 Suns', '90 km', ['30 km', '2,700 km', '9 km']],
        ['100 Suns', '300 km', ['30 km', '30,000 km', '100 km']],
        ['4 million Suns', '12 million km', ['4 million km', '12,000 km', '48 million million km']],
        ['a billion Suns', '3 billion km', ['3 million km', '1 billion km', '9 billion km']],
      ] as [string, string, string[]][]);
      return { ask: 'What is the radius of its horizon?', show: `<p>A black hole with the mass of the Sun would have a horizon about 3 km in radius, and the radius is in proportion to the mass.</p><p>A black hole has the mass of <b>${n}</b>.</p>`, ...choices(rand, right, wrong), why: `Three kilometres for each Sun's worth of mass: ${right}.` };
    },
  },
  {
    id: 'rate',
    level: 1,
    make(rand) {
      const p = pickOne(rand, PACES);
      return { ask: 'How fast does the hovering ship\'s clock run, against a clock far away?', show: `<p>A ship hovers above a black hole, at the height where things that fell from rest far away go past it at <b>${frac(p.a, p.c)}</b> of the speed of light.</p>`, outside: `<p class="soft">The budget, exactly: (falling speed)² + (hovering clock's rate)² = 1.</p>`, ...choices(rand, `At ${frac(p.b, p.c)}`, [`At ${frac(p.a, p.c)}`, `At ${frac(p.c - p.a, p.c)}`, 'At the same rate']), why: `(${frac(p.a, p.c)})² + (${frac(p.b, p.c)})² = 1. A clock held still at a height runs like a clock moving at the falling speed for that height.` };
    },
  },
  {
    id: 'where',
    level: 2,
    make(rand) {
      const k = pickOne(rand, [2, 3, 4, 5, 10]);
      const rule = `<p>Above a black hole, things that fell from rest far away pass at a speed, as a fraction of light's, of 1 over the square root of the distance from the centre in horizon radii.</p>`;
      return rand() < 0.5
        ? { ask: 'How fast do they pass?', show: `${rule}<p>A ship hovers at <b>${k * k} horizon radii</b>.</p>`, ...choices(rand, `${frac(1, k)} of the speed of light`, [`${frac(1, k * k)} of the speed of light`, `${frac(1, 2 * k)} of the speed of light`, `${frac(k - 1, k)} of the speed of light`]), why: `The square root of ${k * k} is ${k}, and 1 over that is ${frac(1, k)}.` }
        : { ask: 'How far out is it?', show: `${rule}<p>Falling things pass a hovering ship at <b>${frac(1, k)}</b> of the speed of light.</p>`, ...choices(rand, `${k * k} horizon radii`, [`${k} horizon radii`, `${2 * k} horizon radii`, `${k * k * k} horizon radii`]), why: `1 over ${frac(1, k)} is ${k}, and ${k} squared is ${k * k}.` };
    },
  },
  {
    id: 'fall',
    level: 2,
    make(rand) {
      const [n, right, wrong] = pickOne(rand, [
        ['10 Suns', '70 millionths of a second', ['7 millionths of a second', '700 millionths of a second', '49 millionths of a second']],
        ['1,000 Suns', '7 thousandths of a second', ['7 millionths of a second', '7 seconds', '70 millionths of a second']],
        ['a million Suns', '7 seconds', ['7 thousandths of a second', '7 millionths of a second', '7,000 seconds']],
        ['a billion Suns', '7,000 seconds, which is about two hours', ['7 seconds', '7 years', '7 thousandths of a second']],
      ] as [string, string, string[]][]);
      return { ask: 'How long is it from the horizon to the centre, by the faller\'s own clock?', show: `<p>Falling into a black hole of the Sun's mass, the trip from the horizon to the centre takes about 7 millionths of a second on the faller's own clock. Times scale with the mass.</p><p>A black hole has the mass of <b>${n}</b>.</p>`, ...choices(rand, right, wrong), why: `In proportion to the mass: ${right}. Short, and finite.` };
    },
  },
  {
    id: 'orbit',
    level: 2,
    make(rand) {
      const k = pickOne(rand, [1.2, 2, 2.5, 3.5, 5, 10, 50]);
      return { ask: 'Can it hold a steady circular orbit there with its engines off?', show: `<p>A probe wants to circle a black hole at <b>${k} horizon radii</b> from the centre.</p>`, outside: `<p class="soft">Stable circles: from 3 horizon radii outward. At 1.5, only light circles.</p>`, options: ['Yes', 'No'], right: k >= 3 ? 0 : 1, why: k >= 3 ? `${k} is outside 3 horizon radii, where circular orbits are stable, as round any star.` : k > 1.5 ? `Between 1.5 and 3 horizon radii a circle can be set up, but the least disturbance sends the probe in or out. Newton's gravity has nothing like this.` : `Inside 1.5 horizon radii not even light can circle. Without thrust, everything there is on its way in or on its way out.` };
    },
  },
  {
    id: 'tide',
    level: 3,
    make(rand) {
      const k = pickOne(rand, [2, 3, 10, 100, 1000]);
      const words = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString()} million` : n.toLocaleString());
      return { ask: 'How does the stretching at the heavier hole\'s horizon compare?', show: `<p>The tide at a black hole's horizon goes as one over the square of the hole's mass.</p><p>One hole has <b>${k.toLocaleString()} times</b> the mass of another.</p>`, ...choices(rand, `${words(k * k)} times gentler`, [`${words(k)} times gentler`, `${words(k * k)} times fiercer`, `${words(k)} times fiercer`]), why: `${k.toLocaleString()} × ${k.toLocaleString()} = ${words(k * k)}. Big holes are gentle at the horizon; small ones pull things apart far outside it.` };
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

let hole = HOLES[0];
let r = 10;
let rMin = 10;
let tau = 0;
let tauMax = 0;
const START = 5;
const END = fallTime(START, 0);
const CROSS = fallTime(START, 1);
/** The time light takes to cross one horizon radius: the unit every time here is counted in. */
const unit = () => horizon(hole.suns) / C;

function dial(): string {
  const v = plunge(r);
  const up = hover(r);
  const x = v * 180;
  const y = -up * 180;
  const push = (C * C) / (2 * horizon(hole.suns) * r * r) / up / 9.80665;
  let g = `<path d="M0 0H190M0 0V-190" stroke="#8d93b8" stroke-width="1.5" fill="none"/><path d="M180 0A180 180 0 0 0 0 -180" stroke="#3b4170" stroke-width="2" fill="none" stroke-dasharray="4 5"/>`;
  g += `<text x="95" y="20" font-size="12" text-anchor="middle">falling speed there →</text><text x="-12" y="-95" font-size="12" text-anchor="middle" transform="rotate(-90 -12 -95)">hovering clock's rate →</text>`;
  g += `<line x1="0" y1="0" x2="${x}" y2="0" stroke="#7fb6ff" stroke-width="5"/><line x1="${x}" y1="0" x2="${x}" y2="${y}" stroke="#e8c24a" stroke-width="5"/><line x1="0" y1="0" x2="${x}" y2="${y}" stroke="#fff" stroke-width="3"/><circle cx="${x}" cy="${y}" r="7" fill="#fff"/>`;
  // The hole and the ship, to scale along one line.
  const R = (d: number) => 240 + d * 20;
  g += `<circle cx="${R(0)}" cy="-150" r="20" fill="#000" stroke="#ff9a9a" stroke-dasharray="3 3"/><line x1="${R(1)}" y1="-150" x2="${R(10)}" y2="-150" stroke="#3b4170"/><rect x="${R(r) - 6}" y="-158" width="12" height="16" fill="#7fb6ff"/><text x="${R(0)}" y="-118" font-size="11" text-anchor="middle" fill="#ff9a9a">horizon</text>`;
  g += `<text x="232" y="-78" font-size="13">hovering at ${tidy(r)} horizon radii</text><text x="232" y="-56" font-size="13">clock runs at ${tidy(up)} of a far one</text><text x="232" y="-34" font-size="13">fallers pass at ${tidy(v)} of light speed</text><text x="232" y="-12" font-size="13">push to hover: ${big(push)} g</text>`;
  return `<svg viewBox="-28 -205 500 235" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg>`;
}

const FLASH = 0.25;
function drop(): string {
  const at = falling(START, tau);
  const R = (d: number) => 40 + d * 74;
  let g = `<rect x="${R(0)}" y="14" width="${R(1) - R(0)}" height="52" fill="#000"/><line x1="${R(1)}" y1="8" x2="${R(1)}" y2="72" stroke="#ff9a9a" stroke-dasharray="4 4"/><text x="${R(1)}" y="86" font-size="11" text-anchor="middle" fill="#ff9a9a">horizon</text><text x="${R(0)}" y="86" font-size="11" text-anchor="middle" opacity="0.7">centre</text><line x1="${R(1)}" y1="40" x2="${R(5.4)}" y2="40" stroke="#3b4170"/>`;
  for (let d = 2; d <= 5; d++) g += `<text x="${R(d)}" y="86" font-size="11" text-anchor="middle" opacity="0.6">${d}</text>`;
  g += `<text x="${R(5.4)}" y="30" font-size="11" text-anchor="end" opacity="0.7">to the watcher, far away →</text>`;
  g += `<circle cx="${R(at)}" cy="40" r="8" fill="${at > 1 ? '#e8c24a' : '#8d93b8'}"/>`;
  // The beacon's own clock: an even line.
  const T = (t: number) => 40 + (t / END) * 380;
  g += `<text x="40" y="122" font-size="12">the beacon's own clock</text><line x1="${T(0)}" y1="140" x2="${T(END)}" y2="140" stroke="#8d93b8"/>`;
  for (let k = 0; k * FLASH <= END; k++) g += `<line x1="${T(k * FLASH)}" y1="${k * FLASH <= tau ? 132 : 136}" x2="${T(k * FLASH)}" y2="${k * FLASH <= tau ? 148 : 144}" stroke="${k * FLASH <= tau ? (k * FLASH < CROSS ? '#e8c24a' : '#8d93b8') : '#3b4170'}" stroke-width="2"/>`;
  g += `<line x1="${T(CROSS)}" y1="126" x2="${T(CROSS)}" y2="154" stroke="#ff9a9a" stroke-dasharray="3 3"/><text x="${T(CROSS)}" y="168" font-size="11" text-anchor="end" fill="#ff9a9a">crosses the horizon</text><text x="${T(END)}" y="168" font-size="11" text-anchor="end" opacity="0.7" dx="18">centre</text>`;
  // The watcher's clock: when each of those flashes arrives.
  const SPAN = 30;
  const W = (u: number) => 40 + (Math.min(u, SPAN) / SPAN) * 380;
  g += `<text x="40" y="204" font-size="12">the watcher's clock, as each flash arrives</text><line x1="${W(0)}" y1="222" x2="${W(SPAN)}" y2="222" stroke="#8d93b8"/><text x="${W(SPAN) + 4}" y="226" font-size="12" fill="#ff9a9a">→</text>`;
  for (let k = 0; k * FLASH <= Math.min(tau, CROSS - 1e-9); k++) {
    const u = seen(falling(START, k * FLASH)) - seen(START);
    if (u <= SPAN) g += `<line x1="${W(u)}" y1="214" x2="${W(u)}" y2="230" stroke="#e8c24a" stroke-width="2"/>`;
  }
  g += `<text x="${W(SPAN)}" y="250" font-size="11" text-anchor="end" fill="#ff9a9a">the flash from the horizon itself: never</text>`;
  const own = `The beacon's clock reads <b>${span(tau * unit())}</b>. It is ${at > 1 ? `at ${tidy(at)} horizon radii` : at > 0.001 ? `inside, at ${tidy(at)} of the horizon's radius` : 'at the centre'}.`;
  const far = at > 1.0005 ? `The flash it sends now reaches the watcher after <b>${span((seen(at) - seen(START)) * unit())}</b>, slowed ${tidy(1 / (1 - plunge(at)))} times.` : at > 1 ? 'The flash it sends now will take longer to climb out than anyone will wait.' : '<span class="bad">Nothing it sends now ever reaches the watcher.</span>';
  return `<svg viewBox="0 0 460 258" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p>${own} ${far}</p>`;
}

function scale(): string {
  const rs = horizon(hole.suns);
  const tide = (tideAtHorizon(hole.suns) * 2) / 9.80665;
  return `<p>A hole of <b>${hole.suns >= 1e9 ? `${tidy(hole.suns / 1e9)} billion` : hole.suns >= 1e6 ? `${tidy(hole.suns / 1e6)} million` : hole.suns} Suns</b>: its horizon is <b>${length(rs)}</b> in radius. Falling from the horizon to the centre takes <b>${span((2 / 3) * unit())}</b> by the faller's clock. At the horizon, the tide across a body two metres long is <b>${big(tide)} g</b>.</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The surface from inside which nothing, light included, can reach the outside is the <b>event horizon</b>. Its radius for a hole that does not spin is the <b>Schwarzschild radius</b>, 2GM/c²: about 3 km for each Sun of mass.</li>
      <li>Clocks lower down running slower is the <b>gravitational time dilation</b> of chamber 4, here taken to its limit; the reddening of light climbing out is <b>gravitational redshift</b>.</li>
      <li>Being pulled long and squeezed thin by the tide is, in the trade, <b>spaghettification</b>.</li>
      <li>The closest stable circular orbit, at 3 horizon radii, is the <b>ISCO</b> (innermost stable circular orbit). The radius where light itself can circle, 1.5, is the <b>photon sphere</b>.</li>
      <li>The centre, where the theory gives no answer, is the <b>singularity</b>.</li>
    </ul>
    <p><b>How we know they are there.</b> A star called S2 circles something dark at the centre of the Milky Way every 16 years; at its closest in 2018 it was moving at nearly 3% of the speed of light, and its light was reddened as general relativity predicts. The dark thing has the mass of 4.3 million Suns. In September 2015 the LIGO detectors recorded the gravitational waves from two black holes, of about 36 and 29 Suns, merging 1.3 billion light-years away. And the Event Horizon Telescope has imaged the shadows of two: M87's in 2019 and the Milky Way's own in 2022, each the size predicted.</p>
    <p><b>What is not known.</b> Nothing has been observed from inside a horizon, and by the nature of the thing nothing can be. What happens at the centre is unknown: the singularity is where general relativity stops giving answers, not a description of what is there.</p>
    <p class="soft">Two simplifications here. Real black holes spin, which drags space round with them and moves the special orbits; the ideas are the same. And black holes are predicted to glow very faintly and slowly evaporate, which belongs to quantum physics and to the last step on the map.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Limits.</b> Some questions have no answer at a point but a perfectly good answer for what happens <i>as you approach</i> it. That is a limit, written "lim". The hovering clock's rate at a distance r from a hole whose horizon has radius r<sub>s</sub> is</p>
      <div class="eq">rate = √(1 − r<sub>s</sub> / r)</div>
      <p>As r comes down toward r<sub>s</sub>, the rate goes to 0: closer and closer, as near as you like. And the push needed to hover, which has that square root underneath a division, grows beyond any bound; "goes to infinity" means only that. Nothing can hover <i>at</i> the horizon, and the limit says how things go wrong on the way there.</p>
      <p>The derivative of chamber 1 was a limit all along: the slope between two points on a curve, as the points are brought together.</p>
      <p><b>The size of the horizon.</b> Chamber 6's escape speed was √(2GM/r). Ask where it equals the speed of light, and r = 2GM/c² drops out. John Michell did that sum in 1783. That Newton's formula gives the right radius is partly luck; the full theory gives the same number for better reasons.</p>
      <p><b>The fall.</b> Measuring distance in horizon radii and time in the time light takes to cross one, a thing that falls from rest far away has, by its own clock, from a distance r to the centre,</p>
      <div class="eq">τ = ⅔ r<sup>3/2</sup></div>
      <p>From the horizon, r = 1, that is ⅔: finite. Each flash it sends is received by the far watcher slowed by 1 ÷ (1 − 1/√r), and as r comes down to 1 that grows without limit. Two limits, two observers, one fall.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://www.einstein-online.info/en/spotlight/descent/" target="_blank" rel="noopener">Einstein Online, Descent into a black hole</a>, and <a href="https://www.einstein-online.info/en/spotlight/changing_places/" target="_blank" rel="noopener">Changing places: space and time inside a black hole</a>. From the Max Planck Institute for Gravitational Physics.</li>
      <li>Read: <a href="https://math.ucr.edu/home/baez/physics/Relativity/BlackHoles/fall_in.html" target="_blank" rel="noopener">What happens to you if you fall into a black hole?</a>, from the Usenet Physics FAQ. Both points of view, plainly.</li>
      <li>See: <a href="https://www.eso.org/public/news/eso1825/" target="_blank" rel="noopener">European Southern Observatory, the star S2 passing the black hole (2018)</a>, and <a href="https://www.eso.org/public/news/eso2208-eht-mw/" target="_blank" rel="noopener">the first image of the Milky Way's black hole (2022)</a>. The second is also told by <a href="https://www.miz.nao.ac.jp/eht-j/c/pr/pr20220512" target="_blank" rel="noopener">EHT-Japan at the National Astronomical Observatory of Japan</a> (in Japanese).</li>
      <li>Read: <a href="https://www.nobelprize.org/prizes/physics/2020/summary/" target="_blank" rel="noopener">The Nobel Prize in Physics 2020</a>: Penrose for showing that black holes must form, Genzel and Ghez for the dark object at the centre of the galaxy. The "popular information" paper linked there is a good account.</li>
      <li>Watch: <a href="https://www.youtube.com/playlist?list=PLsPUh22kYmNBl4h0i4mI5zDflExXJMo_x" target="_blank" rel="noopener">PBS Space Time, Black Holes</a>.</li>
      <li>Book: <a href="https://www.eftaylor.com/exploringblackholes/" target="_blank" rel="noopener">Taylor, Wheeler and Bertschinger, <i>Exploring Black Holes</i></a>. Free from the author's site. This chamber, done properly, with only this much calculus.</li>
      <li>For the math: <a href="https://www.3blue1brown.com/lessons/limits" target="_blank" rel="noopener">3Blue1Brown, Limits</a>, and <a href="https://openstax.org/books/calculus-volume-1/pages/2-introduction" target="_blank" rel="noopener">OpenStax Calculus, volume 1, chapter 2</a>.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · black holes', 'Two clocks, one fall', 'The holes here do not spin. <b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'holes',
    kicker: 'Horizons · 8',
    title: 'Black holes',
    steps: [
      { say: 'Squeeze enough mass into a small enough space and gravity makes a horizon: for ten Suns\' worth, a sphere 30 km in radius. A ship hovers above it on its engines. The arrow is the budget from the first chamber: across is the speed at which things falling from far away go past the ship; up is the rate of the ship\'s clock, against a clock far away. <b>Lower the ship toward the horizon.</b>', until: () => rMin < 1.2 },
      { say: 'A clock held still at any height runs exactly like a clock moving at the falling speed for that height. At the horizon the falling speed is the speed of light.', ask: ['What of a ship hovering exactly at the horizon?', ['Its clock would run at half speed', 'It cannot be done: the clock rate goes to nothing and the push needed grows without limit', 'It would hover normally'], 1, 'The arrow lies flat. No engine can hold anything still at the horizon, just as none can reach the speed of light.'] },
      { say: 'Look at the push needed to hover, close in. The ship is thrusting hard and steadily, and getting nowhere.', ask: ['In the last chamber, who had a horizon just behind them?', ['Someone drifting freely', 'Someone thrusting hard and steadily'], 1, 'The hovering ship <i>is</i> the ever-thrusting ship, and the black hole\'s horizon is its horizon. So we know what to expect of something that stops thrusting and falls: it is "home". <b>Drop a beacon, below.</b>'] },
      { say: 'A beacon is let fall, flashing regularly by its own clock. <b>Slide its clock forward, all the way.</b> The upper line is its own time; the lower shows when each flash reaches a watcher far away.', until: () => tauMax >= END - 0.02 },
      { say: 'By its own clock the beacon reached the horizon, passed it, and reached the centre soon after. The watcher\'s line tells another story.', ask: ['When does the watcher see the beacon cross the horizon?', ['At the moment it crosses', 'After a delay, like any distant event', 'Never: the last flashes arrive ever further apart, redder and dimmer, without end'], 2, 'Exactly as the ship\'s crew saw home\'s clock creep toward one year and never pass it. In practice the picture reddens and fades from sight very quickly; but no flash from the horizon ever arrives.'] },
      { say: 'Two accounts of one fall.', ask: ['Did the beacon cross the horizon or not?', ['No: it hangs at the horizon for ever', 'Yes. The watcher merely never receives the light that would show it'], 1, 'It crossed, as home lived on past its first year. "Never" is a fact about what light can reach the watcher, not about what happens to the beacon.'] },
      { say: 'Everything about a black hole scales with its mass. <b>Choose a bigger one,</b> and read the line beneath.', until: () => hole.id !== 'ten' },
      { say: 'At the horizon of the ten-Sun hole, the tide across your body is tens of millions of g: you would be pulled into a thread long before you got there.', ask: ['From chamber 5, the tide goes as mass ÷ distance³, and a horizon\'s radius grows in step with the mass. So at the horizon of a hole a million times heavier, the tide is:', ['A million times fiercer', 'The same', 'A million million times gentler'], 2, 'Mass over mass cubed. At the horizon of the giant in the middle of the galaxy you would feel nothing: no surface, no jolt, no sign. That is the equivalence principle of chamber 4, still holding.'] },
      { say: 'And inside. Every path, light\'s included, leads inward.', ask: ['Why can no engine, however strong, turn you round?', ['It could, with enough thrust', 'Because inside, the centre is not a place in front of you. It is a time ahead of you'], 1, 'Outside, you may stay where you are but cannot help moving into the future. Inside the horizon those roles change places, and reaching the centre is as unavoidable as reaching tomorrow. What happens when you get there, nobody knows: the theory itself gives out.'] },
    ],
    summary: '<b>A black hole is a horizon made by gravity.</b> To hover is to thrust; to fall is to cross someone else\'s horizon without noticing. The faller reaches the centre in a short, finite time; the far watcher never sees the crossing. Both accounts are right, and they are about different things.',
    frame: () =>
      `<div id="dial"></div><div class="bar"><span class="soft">far up</span><input id="height" type="range" min="0" max="1" step="0.002" value="0" style="flex:1"><span class="soft">the horizon</span></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A beacon, dropped</div><div id="drop"></div><div class="bar"><span class="soft">let go</span><input id="fall" type="range" min="0" max="${END}" step="0.01" value="0" style="flex:1"><span class="soft">the centre</span></div></div>` +
      `<hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">Which black hole</div><div class="bar">${HOLES.map((h) => `<button class="chip pale" data-do="hole" data-v="${h.id}">${h.name}</button>`).join('')}</div><div id="scale"></div>`,
    paint: () => {
      $('dial').innerHTML = dial();
      $('drop').innerHTML = drop();
      $('scale').innerHTML = scale();
      run?.mark('hole', (k) => k === hole.id);
      ($('part2') as HTMLElement).hidden = (run?.step() ?? 0) < 3;
    },
    slide: (id, value) => {
      if (id === 'height') {
        r = 1.003 + 8.997 * (1 - value) ** 2;
        rMin = Math.min(rMin, r);
      } else {
        tau = Math.min(END, value);
        tauMax = Math.max(tauMax, value);
      }
    },
    act: (what, value) => {
      if (what === 'hole') hole = HOLES.find((h) => h.id === value) ?? hole;
    },
    drawer,
    next: ['wormholes', 'On to wormholes'],
  });
  sh.draw();
}
expose(
  () => [...checkKinds(KINDS), ...checkStrong(), ...(Math.abs((2 / 3) * (horizon(1) / C) * 1e6 - 6.57) < 0.02 && Math.abs(horizon(10) - 29532) < 5 && (tideAtHorizon(10) * 2) / 9.80665 > 1e7 ? [] : ['the chamber\'s own figures'])],
  () => ({ r, tau, hole: hole.id, done: sh.kept.chapter }),
);
