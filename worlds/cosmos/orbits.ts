import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { checkGravity, farthest, fire } from './gravity';
import type { Flight } from './gravity';
import { frac, tidy } from './physics';

/**
 * Orbits: falling, and missing.
 *
 * Newton's own picture: a cannon on a mountain, fired level. Slowly, and the
 * ball lands nearby; faster, and further round; at one speed the ground
 * curves away exactly as fast as the ball falls, and it never lands. Faster
 * again and the path is a long oval; at 1.41 times the circling speed it
 * does not come back.
 *
 * The paths drawn are not looked up. Each is made by stepping: the pull
 * changes the velocity a little, the velocity changes the position a little,
 * again and again. That is the whole of how a computer follows anything
 * through space, and the chamber ends by showing the steps.
 */

const sh = new Shell('portal-worlds-cosmos-orbits-v1');
const PLANET = 0.5;

// ---- Practice ----

const IDEAS: [string, string, string[], string][] = [
  ['Why does the Moon not fall to the Earth?', 'It does fall, all the time; it is also moving sideways fast enough to keep missing', ['It is too far away for gravity to reach', 'Its own gravity holds it up', 'The Sun pulls it the other way'], 'An orbit is free fall with enough sideways speed that the ground curves away as fast as you drop.'],
  ['A satellite in a circular orbit switches its engine off. What happens?', 'Nothing: it carries on round as before', ['It slows down and spirals in', 'It stops and drops straight down', 'It flies off in a straight line'], 'No engine is needed to stay in orbit. Above the air there is nothing to slow it, and an orbit is what falling freely looks like.'],
  ['On a long oval orbit, where is the satellite moving fastest?', 'At its closest to the planet', ['At its furthest from the planet', 'Halfway between', 'It moves at one speed throughout'], 'Falling inward it gains speed, and climbing outward it loses it. It lingers far out and whips round close in.'],
  ['A computer follows a planet by taking steps in time. What does making the steps smaller do?', 'Brings the computed path closer to the true one, at the cost of more work', ['Makes the planet move more slowly', 'Nothing, if the equation is right', 'Makes the path less accurate'], 'Each step pretends the pull is fixed for a moment. The shorter the moment, the smaller the pretence.'],
  ['Astronauts in orbit float about their cabin. How strong is the Earth\'s gravity where they are, 400 km up?', 'About nine-tenths of its strength on the ground', ['Zero', 'About a tenth of its strength on the ground', 'About half its strength on the ground'], 'They are only 400 km further from the Earth\'s centre than the ground\'s 6,371. They float because they are falling, not because gravity has gone.'],
];

const KINDS: Kind[] = [
  {
    id: 'fate',
    level: 1,
    make(rand) {
      const k = pickOne(rand, [0.5, 0.7, 0.9, 1, 1.1, 1.2, 1.3, 1.5, 2]);
      const options = ['It dips closer to the planet than where it started', 'It stays at this height all the way round', 'It swings further out, and comes back', 'It leaves and never comes back'];
      const right = k < 1 ? 0 : k === 1 ? 1 : k * k < 2 ? 2 : 3;
      return { ask: 'What does it do?', show: `<p>A probe high above a planet is moving level with the ground at <b>${k === 1 ? 'exactly' : `${tidy(k)} times`} the speed that would hold a circle</b> at that height. Its engine is off.</p>`, outside: `<p class="soft">Two speeds matter: the circling speed, and 1.41 times it (the square root of 2), which is the speed of escape.</p>`, options, right, why: right === 0 ? 'Too slow to hold the circle, it falls inward, picks up speed, and (if it misses the ground) swings back up to where it began.' : right === 1 ? 'At exactly the circling speed, it falls just as fast as the ground curves away.' : right === 2 ? `Faster than the circle needs, but under 1.41 times: it climbs, slows, and falls back, on an oval.` : `${tidy(k)} is more than 1.41. It has more than enough speed to climb for ever.` };
    },
  },
  {
    id: 'square',
    level: 1,
    make(rand) {
      const k = pickOne(rand, [2, 3, 4, 5, 10]);
      const out = rand() < 0.7;
      return { ask: 'How strong is the planet\'s pull on it now?', show: `<p>A probe moves to <b>${out ? `${k} times as far` : `${frac(1, k)} as far`}</b> from the centre of a planet as it was.</p>`, outside: `<p class="soft">The pull goes as one over the square of the distance.</p>`, ...choices(rand, out ? `${frac(1, k * k)} of what it was` : `${k * k} times what it was`, out ? [`${frac(1, k)} of what it was`, `${frac(1, k * k * k)} of what it was`, `${frac(1, 2 * k)} of what it was`] : [`${k} times what it was`, `${k * k * k} times what it was`, `${2 * k} times what it was`]), why: out ? `${k} times as far: ${k} × ${k} = ${k * k} times weaker.` : `${k} times closer: ${k} × ${k} = ${k * k} times stronger.` };
    },
  },
  {
    id: 'speed',
    level: 2,
    make(rand) {
      const k = pickOne(rand, [4, 9, 16, 25, 100]);
      const root = Math.round(Math.sqrt(k));
      const out = rand() < 0.6;
      return { ask: 'How fast must it go to hold a circle there?', show: `<p>The speed that holds a circular orbit goes as one over the <i>square root</i> of the orbit's radius. A satellite moves to a circular orbit <b>${out ? `${k} times as large` : `${frac(1, k)} the size`}</b>.</p>`, ...choices(rand, out ? `${frac(1, root)} as fast` : `${root} times as fast`, out ? [`${frac(1, k)} as fast`, `${root} times as fast`, `${frac(1, k * k)} as fast`] : [`${k} times as fast`, `${frac(1, root)} as fast`, `${k * k} times as fast`]), why: `The square root of ${k} is ${root}. ${out ? 'Far orbits are slow orbits: the pull out there is weak, and little speed is needed to keep missing.' : 'Close orbits are fast ones.'}` };
    },
  },
  {
    id: 'kepler',
    level: 2,
    make(rand) {
      const root = pickOne(rand, [2, 3, 4, 5]);
      const a = root * root;
      const T = root * root * root;
      const forward = rand() < 0.6;
      const rule = `<p>For everything circling the Sun: (years to go round)² = (distance from the Sun, in Earth-distances)³.</p>`;
      return forward
        ? { ask: 'How many years does it take to go round?', show: `${rule}<p>A body circles the Sun at <b>${a} times</b> the Earth's distance.</p>`, outside: `<p class="soft">${a}³ = ${a * a * a}. What number, squared, gives that?</p>`, ...numbers(rand, T, [a, a * a, a * 2]), why: `${a}³ = ${a * a * a}, and ${T}² = ${T * T}. So ${T} years. (${a === 4 ? 'Jupiter, at 5.2 Earth-distances, takes 11.9.' : a === 9 ? 'Saturn, at 9.6 Earth-distances, takes 29.5.' : 'Far out, a year is a long time.'})` }
        : { ask: 'How many times further from the Sun than the Earth is it?', show: `${rule}<p>A body takes <b>${T} years</b> to circle the Sun.</p>`, outside: `<p class="soft">${T}² = ${T * T}. What number, cubed, gives that?</p>`, ...numbers(rand, a, [T, root, a * 2]), why: `${T}² = ${T * T}, and ${a}³ = ${a * a * a}. So ${a} Earth-distances.` };
    },
  },
  {
    id: 'sweep',
    level: 3,
    make(rand) {
      const k = pickOne(rand, [2, 3, 4, 5]);
      const slow = pickOne(rand, [1, 2, 3, 4]);
      const near = pickOne(rand, [1, 2, 3]);
      const wantSlow = rand() < 0.5;
      const setup = `<p>On an oval orbit, (speed) × (distance from the planet's centre) comes to the same number at the nearest point as at the furthest.</p>`;
      return wantSlow
        ? { ask: 'How fast is it going at its furthest point?', show: `${setup}<p>A probe is <b>${near} units</b> from the centre at its nearest, moving at <b>${slow * k} km/s</b>. At its furthest it is <b>${near * k} units</b> away.</p>`, ...numbers(rand, slow, [slow * k, slow * k * k, slow + k]), why: `${slow * k} × ${near} = ${slow * k * near}, so at ${near * k} units the speed is ${slow * k * near} ÷ ${near * k} = ${slow} km/s. ${k} times further, ${k} times slower.` }
        : { ask: 'How fast is it going at its nearest point?', show: `${setup}<p>A probe is <b>${near * k} units</b> from the centre at its furthest, moving at <b>${slow} km/s</b>. At its nearest it is <b>${near} ${near === 1 ? 'unit' : 'units'}</b> away.</p>`, ...numbers(rand, slow * k, [slow, slow * k * k, slow + k]), why: `${slow} × ${near * k} = ${slow * k * near}, so at ${near} ${near === 1 ? 'unit' : 'units'} the speed is ${slow * k} km/s. ${k} times closer, ${k} times faster.` };
    },
  },
  {
    id: 'step',
    level: 3,
    make(rand) {
      const x = pickOne(rand, [0, 10, 20, 100]);
      const v = pickOne(rand, [2, 5, 10, 20]);
      const a = pickOne(rand, [-4, -2, 1, 2, 3]);
      const dt = pickOne(rand, [1, 2]);
      const wantV = rand() < 0.5;
      const setup = `<p>A computer follows a ball along a line by stepping. Each step: new position = old position + velocity × step; then new velocity = old velocity + acceleration × step.</p><p>Position <b>${x} m</b>, velocity <b>${v} m/s</b>, acceleration <b>${a} m/s each second</b>, step <b>${dt} ${dt === 1 ? 'second' : 'seconds'}</b>.</p>`;
      return wantV ? { ask: 'What is the velocity after one step?', show: setup, ...choices(rand, `${v + a * dt} m/s`, [`${v} m/s`, `${v - a * dt} m/s`, `${v + a} m/s`, `${v * dt + a} m/s`, `${x + v * dt} m/s`]), why: `${v} + (${a} × ${dt}) = ${v + a * dt}.` } : { ask: 'What is the position after one step?', show: setup, ...choices(rand, `${x + v * dt} m`, [`${x + v * dt + a * dt} m`, `${x + v} m`, `${x + a * dt} m`, `${x} m`, `${v + a * dt} m`]), why: `${x} + (${v} × ${dt}) = ${x + v * dt}. Over and over, that is how every simulated planet, spacecraft and galaxy is moved.` };
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

let v = 0.5;
let crude = false;
let top = 0.5;
let flight: Flight = fire(v, PLANET);
let made = '';
let clock = 0;
const W = 460;
const HT = 470;
const U = 48;
const X = (x: number) => W / 2 + x * U;
const Y = (y: number) => 118 - y * U;

function remake(): void {
  const key = `${v}|${crude}`;
  if (key === made) return;
  made = key;
  flight = crude ? fire(v, PLANET, 0.2, true, 14) : fire(v, PLANET);
}
const fateWords = () => (flight.fate === 'lands' ? 'It comes down.' : flight.fate === 'escapes' ? 'It leaves and does not come back.' : Math.abs(v - 1) < 0.006 ? 'A circle. It never lands.' : v < 1 ? `It clears the ground and comes back round, dipping to ${tidy(flight.near)} of its starting distance.` : `An oval. It swings out to ${tidy(farthest(v))} times its starting distance and comes back.`);

function scene(): string {
  remake();
  let g = '';
  for (const [x, y] of [[40, 60], [410, 40], [70, 300], [400, 250], [330, 420], [120, 430], [30, 180], [435, 150]]) g += `<circle cx="${x}" cy="${y}" r="1.5" fill="#e9e6f5" opacity="0.7"/>`;
  g += `<circle cx="${X(0)}" cy="${Y(0)}" r="${PLANET * U}" fill="#24402c" stroke="#3f7a52" stroke-width="2"/><path d="M${X(-0.06)} ${Y(PLANET - 0.02)}L${X(0)} ${Y(1)}L${X(0.06)} ${Y(PLANET - 0.02)}Z" fill="#3f7a52"/>`;
  const step = crude ? 1 : Math.max(1, Math.floor(flight.path.length / 700));
  let d = '';
  flight.path.forEach((p, i) => {
    if (i % step === 0 || i === flight.path.length - 1) d += `${d ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`;
  });
  g += `<path d="${d}" stroke="#e8c24a" stroke-width="${crude ? 1.5 : 2.5}" fill="none" stroke-linejoin="round"/>`;
  if (crude) for (const p of flight.path) g += `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="2.8" fill="#fff"/>`;
  g += `<g id="ball"></g>`;
  return `<svg viewBox="0 0 ${W} ${HT}" style="width:100%;max-width:520px;display:block;margin:auto">${g}</svg>`;
}
/** Where the ball is now along its path, which loops (or is fired again) for ever. */
function ball(): string {
  if (crude) return '';
  const path = flight.path;
  const end = path[path.length - 1][2];
  const t = flight.fate === 'orbits' && flight.period ? (clock * 1.6) % end : (clock * 1.6) % (Math.min(end, 22) + 1.2);
  if (t > end) return '';
  const i = Math.min(path.length - 1, Math.round((t / end) * (path.length - 1)));
  return `<circle cx="${X(path[i][0]).toFixed(1)}" cy="${Y(path[i][1]).toFixed(1)}" r="6" fill="#fff"/>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>Newton's rule: every mass pulls every other, with a force in proportion to both masses and to one over the square of the distance between them. This is the <b>inverse-square law</b>.</li>
      <li>The speed that holds a circle at a given height is the <b>circular</b> or <b>orbital speed</b>. Close to the Earth's surface it is about 7.9 km/s.</li>
      <li>The least speed that never comes back is the <b>escape speed</b>: √2, about 1.41, times the circular speed at the same place. From the Earth's surface, 11.2 km/s.</li>
      <li>The oval is an <b>ellipse</b>, with the planet at one <b>focus</b>, not at the centre. Its nearest point is the <b>periapsis</b> and its furthest the <b>apoapsis</b> (round the Earth, perigee and apogee; round the Sun, perihelion and aphelion).</li>
      <li><b>Kepler's laws</b>, found from the planets before Newton explained them: orbits are ellipses; a planet moves faster the nearer it is, sweeping equal areas in equal times; and (time to go round)² goes as (size of orbit)³.</li>
    </ul>
    <p>Astronauts in the space station float because they are in orbit, which is free fall. Gravity at their height is still about nine-tenths of what it is on the ground.</p>
    <p class="soft">Where this stops being right. Newton's law is what the last two chambers come to when gravity is weak and speeds are slow, and it is very nearly exact for the planets. Very nearly: Mercury's oval turns 43 seconds of arc a century more than Newton allows, which Einstein's theory accounts for exactly. Close to a black hole the two part company altogether, and that is where the map goes next.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>The law.</b> At a distance r from the centre of a mass M, everything falls with acceleration</p>
      <div class="eq">a = G M / r²</div>
      <p>G is a fixed number of nature. Twice as far, a quarter of the acceleration.</p>
      <p><b>Stepping an equation.</b> That law says how the velocity changes, and the velocity says how the position changes. Neither says where the ball will <i>be</i>. To find out, take a small step of time, dt, and do this again and again:</p>
      <div class="eq">v ← v + a dt &nbsp;&nbsp;&nbsp; x ← x + v dt</div>
      <p>This is an integral done by brute force: the adding-up from the twins, with the thing being added changing as you go. An equation like this one, which gives a rate of change and leaves you to find the path, is a <b>differential equation</b>. Nearly all of physics is written in them, and nearly all of them are solved this way, by machine. "Show the steps" uses 31 steps to an orbit and the crudest rule, and the orbit fails to close. The gold curves use about 3,000 and a slightly better rule.</p>
      <p><b>The two speeds.</b> For a circle, the acceleration needed to keep turning, v²/r, must equal the pull, GM/r²:</p>
      <div class="eq">v<sub>circle</sub> = √(G M / r) &nbsp;&nbsp;&nbsp; v<sub>escape</sub> = √(2 G M / r)</div>
      <p><b>Kepler's third law</b> for a circle follows in one line: the time to go round is the circumference over the speed, T = 2πr ÷ √(GM/r), so T² = (4π²/GM) r³.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Play: <a href="https://phet.colorado.edu/en/simulations/gravity-and-orbits" target="_blank" rel="noopener">PhET, Gravity and Orbits</a>. The University of Colorado's free simulation: Sun, Earth, Moon and a satellite.</li>
      <li>Read: <a href="https://www.feynmanlectures.caltech.edu/I_07.html" target="_blank" rel="noopener">The Feynman Lectures on Physics, volume I, chapter 7, "The Theory of Gravitation"</a>, and <a href="https://www.feynmanlectures.caltech.edu/I_09.html" target="_blank" rel="noopener">chapter 9, "Newton's Laws of Dynamics"</a>, in which he steps a planet round the Sun by hand.</li>
      <li>Read: <a href="https://openstax.org/books/university-physics-volume-1/pages/13-introduction" target="_blank" rel="noopener">OpenStax University Physics, volume 1, chapter 13, Gravitation</a>. A free standard textbook chapter, with problems.</li>
      <li>Book: <a href="https://www.eftaylor.com/exploringblackholes/" target="_blank" rel="noopener">Taylor, Wheeler and Bertschinger, <i>Exploring Black Holes</i></a>. What orbits become when gravity is strong.</li>
      <li>For the math: <a href="https://www.3blue1brown.com/topics/calculus" target="_blank" rel="noopener">3Blue1Brown, Essence of Calculus</a>, and <a href="https://openstax.org/details/books/calculus-volume-1" target="_blank" rel="noopener">OpenStax Calculus, volume 1</a>.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · orbits', 'Falling, and missing', 'Engines are off throughout. <b>◉</b> gives a nudge where there is one.', KINDS);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'orbits',
    kicker: 'Gravity · 6',
    title: 'Orbits',
    steps: [
      { say: 'A cannon stands on a mountain and fires level with the ground. (The mountain is absurdly tall, so that the picture can be read.) There is no air. At this speed the ball comes down not far off. <b>Fire faster, and watch where it lands.</b>', until: () => top >= 0.74 },
      { say: 'Faster, and it lands further round the planet. It is falling the whole time; but the ground is curving away beneath it.', ask: ['Is there a speed at which the ball falls for ever and never lands?', ['No: whatever falls must land', 'Yes: when the ground curves away as fast as the ball drops', 'Only if an engine keeps pushing it'], 1, '<b>Find the speed that gives a perfect circle.</b>'] },
      { say: '<b>Find the speed that gives a perfect circle:</b> the same height all the way round.', until: () => Math.abs(v - 1) < 0.006 && !crude },
      { say: 'That is an orbit. Nothing holds the ball up and nothing pushes it along.', ask: ['Is the ball in the circular orbit still falling?', ['No: it has escaped gravity', 'Yes, all the time. It keeps missing', 'Only on the far side of the planet'], 1, 'Falling freely, exactly as in the cut lift; which is why astronauts float. An orbit is the straight line of the last two chambers, round a planet.'] },
      { say: '<b>Fire faster than the circle needs,</b> and watch the white ball go round.', until: () => v >= 1.15 && v < 1.4 },
      { say: 'The circle has become an oval, with the planet near one end of it.', ask: ['Where on the oval is the ball moving slowest?', ['Nearest the planet', 'Furthest from the planet', 'It keeps one speed all the way'], 1, 'It spends its speed climbing away, drifts over the top, and gets the speed back falling in. Comets do this: years far out in the dark, and a few weeks whipping round the Sun.'] },
      { say: '<b>Faster still. Find where it stops coming back.</b>', until: () => v >= 1.42 },
      { say: 'At about 1.41 times the circling speed, the oval opens out and the ball leaves for good.', ask: ['1.41 is a number you have met. What is it?', ['Half of π', 'The square root of 2', 'A coincidence'], 1, 'Escape speed is always √2 times the circling speed at the same place. Skimming the Earth\'s surface the circle needs 7.9 km/s, and escape 11.2.'] },
      { say: 'Everything you have watched came from one rule: the pull goes as one over the square of the distance.', ask: ['Move the Moon out to twice its distance. How strong is the Earth\'s pull on it there?', ['Half as strong', 'A quarter as strong', 'An eighth as strong'], 1, 'Twice as far: 2 × 2 times weaker. Three times as far: nine times weaker. (An eighth was the <i>tide</i>, which is the difference in pull from one side to the other, and falls off faster.)'] },
      { say: 'The computer drawing these paths knows nothing about circles or ovals. It knows the rule for the pull, and it takes steps. <b>Set the speed back near 1 and press "show the steps".</b>', until: () => crude },
      { say: 'Each dot is one step: move the way you are going, then let the pull change the way you are going. With steps this big the orbit does not close.', ask: ['What would bring the stepped path closer to the true circle?', ['Bigger steps', 'Smaller steps, and more of them', 'Nothing: stepping is always this bad'], 1, 'The smooth curves are the same method with steps a hundred times smaller. Every prediction of an eclipse, every spacecraft\'s course and every simulated galaxy is made like this.'] },
    ],
    summary: '<b>An orbit is falling and missing.</b> One rule, the pull going as one over the square of the distance, gives the crash, the circle, the oval and the escape; and stepping that rule forward in time is how any path through space is found.',
    frame: () =>
      `<div id="scene"></div><div id="read"></div><div class="bar"><span class="soft">slow</span><input id="speed" type="range" min="0.3" max="1.6" step="0.005" value="0.5" style="flex:1"><span class="soft">fast</span></div><div class="bar">${[0.5, 0.9, 1, 1.2, 1.3, 1.41].map((k) => `<button class="chip pale" data-do="set" data-v="${k}">${k}</button>`).join('')}<button class="chip pale" data-do="crude" data-v="on">show the steps</button></div>`,
    paint: () => {
      $('scene').innerHTML = scene();
      $('read').innerHTML = `<p>Fired at <b>${tidy(v)}</b> times the circling speed${crude ? ', in big steps' : ''}. ${crude ? (flight.fate === 'lands' ? 'It comes down.' : 'Stepped this coarsely, the path drifts outward and never closes. The true path does not.') : fateWords()}</p>`;
      run?.mark('crude', () => crude);
    },
    slide: (_id, value) => {
      v = value;
      top = Math.max(top, v);
    },
    act: (what, value) => {
      if (what === 'set') {
        v = Number(value);
        top = Math.max(top, v);
        ($('speed') as HTMLInputElement).value = value;
      } else if (what === 'crude') crude = !crude;
    },
    drawer,
  });
  sh.draw();
  let last = performance.now();
  const loop = (now: number) => {
    clock += Math.min(0.1, (now - last) / 1000);
    last = now;
    const b = document.getElementById('ball');
    if (b) b.innerHTML = ball();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
expose(
  () => [...checkKinds(KINDS), ...checkGravity(), ...(Math.abs((6371 / 6771) ** 2 - 0.885) < 0.002 && Math.abs(7.9 * Math.SQRT2 - 11.2) < 0.05 ? [] : ['the chamber\'s own figures'])],
  () => ({ v, crude, fate: flight.fate, far: flight.far, done: sh.kept.chapter }),
);
