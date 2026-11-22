import { Shell, checkKinds, choices, numbers, pickOne, runPractice, shuffled } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS, stars } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { C, G_SURFACE, YEAR, checkGravity, higher, orbiting, thrown, truePeak } from './gravity';
import { tidy } from './physics';

/**
 * Falling is the straight line.
 *
 * Shut in a small room, nobody can tell standing on the ground from being
 * pushed along by a rocket, or falling freely from drifting in deep space.
 * Taking that seriously gives three things: weight is the floor pushing, not
 * gravity pulling; light bends; and a clock higher up runs faster. The last
 * is what gravity mostly is. A thing in free fall follows the path through
 * spacetime that gives its own clock the most time, which is the twins'
 * straight line; it is the person standing on the ground who is being pushed
 * off it.
 *
 * Three figures: four rooms with a dropped ball and a beam of light; a clock
 * raised to any height; and a clock thrown up and caught.
 */

const sh = new Shell('portal-worlds-cosmos-falling-v1');

// ---- Practice ----

const FEEL: [string, boolean, string][] = [
  ['An astronaut floating inside the space station as it circles the Earth', true, 'The station and everyone in it are falling round the Earth together. Nothing pushes on the astronaut.'],
  ['A passenger in a lift, in the moments after the cable snaps', true, 'Lift and passenger fall together, and the floor stops pushing.'],
  ['A diver between leaving the board and reaching the water (leaving the air out of it)', true, 'Nothing is pushing on the diver, going up or coming down.'],
  ['A stone at the very top of its flight, thrown straight up', true, 'It is in free fall the whole way, including the instant it is not moving.'],
  ['The Moon', true, 'It has been falling round the Earth for four and a half billion years.'],
  ['A probe drifting between the stars with its engines off', true, 'Nothing pushes on it. This and falling are the same condition.'],
  ['You, standing in a kitchen', false, 'The floor is pushing up on your feet, and you can feel it. That push is what bends your path away from free fall.'],
  ['A book lying on a table', false, 'The table pushes up on it all the time.'],
  ['A pilot in a rocket whose engines are firing, far from any planet', false, 'The seat pushes the pilot along. It feels exactly like weight.'],
  ['A parachutist coming down at a steady speed under an open parachute', false, 'The harness holds the parachutist up against the fall. A steady speed here means being pushed, by the air through the canopy.'],
  ['A passenger pressed into the seat as an aeroplane takes off', false, 'The seat pushes, and the passenger feels it.'],
];
const IDEAS: [string, string, string[], string][] = [
  ['Why do astronauts in the space station float?', 'Because they and the station are falling together', ['Because there is no gravity that high up', 'Because the station spins', 'Because space has no air'], 'At the station\'s height gravity is still about nine-tenths of what it is on the ground. Floating is what free fall feels like from inside.'],
  ['You stand on a set of scales in a lift whose cable has snapped. What do the scales read?', 'Nothing', ['Your usual weight', 'Twice your usual weight', 'Half your usual weight'], 'Scales measure how hard they are pushed. You and they are falling together, so you do not push on them.'],
  ['A beam of light crosses a room on Earth, from one wall to the other. What is its path?', 'Bent downward, by far too little to notice', ['Perfectly straight: light has no weight', 'Bent upward', 'Bent downward as sharply as a thrown ball\'s'], 'In a rocket pushing at the same rate the floor rises to meet the beam, and the two rooms cannot be told apart. Over a few metres the bend is less than the width of an atom.'],
  ['A thrown ball\'s arc looks curved. In what sense is it a straight line?', 'Of all ways of getting from the throw to the catch, it is the one that puts the most time on the ball\'s own clock', ['It is the shortest distance between the hand and the hand', 'It only looks curved because the Earth spins', 'It is not: gravity is a force that bends it'], 'The straight line of the twins was the path of most time. The same rule, with clocks ticking faster higher up, picks out the arc.'],
  ['In a rocket pushing steadily forward, a clock in the nose is compared with one in the tail. Which runs faster?', 'The one in the nose', ['The one in the tail', 'Neither', 'Whichever was switched on first'], 'Each flash from the nose is caught by a tail that has gained speed toward it, so flashes arrive closer together than they were sent. The nose clock is "higher".'],
  ['What is the difference between standing on Earth and standing in a rocket pushing at one g in empty space, as judged from inside a small sealed room?', 'There is none to be found', ['Dropped things fall faster on Earth', 'Only on Earth do heavy and light things fall together', 'Clocks at the ceiling and floor agree in the rocket'], 'This is the principle the whole theory is built on. It holds for a small room and a short time; the next chamber is about what happens in a large one.'],
];
/** Nanoseconds gained in a year by a clock one metre higher, near the ground. */
const NS_PER_M = 3.44;

/** One question of each kind, worked through: shown until she has got one of that kind right. */
const EXAMPLES: Record<string, string> = {
  feel: "<p>One test settles all of these: <b>what would a set of scales carried along with it read?</b></p><ol><li>An astronaut in orbit: the scales float too and read nothing. <b>Free fall.</b></li><li>Someone sitting in a chair: the scales read their weight. <b>Something is pushing.</b></li></ol><p>Whether the thing is moving, or which way, does not matter. A stone at the top of its flight is still in free fall; a parachutist at a steady speed is being held up by the harness.</p>",
  clocks: "<p>One clock on a hilltop, one in the valley.</p><ol><li>Which is higher? The hilltop one.</li><li>Higher clocks run faster. So the hilltop clock runs faster, and after a year the valley clock has counted <b>less</b> time.</li></ol><p>In a rocket with its engines on, the nose counts as \"higher\" than the tail.</p>",
  gain: "<p>A clock gains about 3.44 billionths of a second a year for each metre it is raised. One clock is <b>30 metres</b> above another.</p><ol><li>The gain is in simple proportion to the height.</li><li>3.44 × 30 = <b>103 billionths of a second</b> a year.</li></ol>",
  drop: "<p>A stone falls from rest for <b>3 seconds</b>, gaining 10 metres a second every second.</p><ol><li><b>Speed:</b> 10 × 3 = 30 metres a second.</li><li><b>Distance:</b> its speed grew evenly from 0 to 30, so it averaged 15. 15 × 3 = 45 metres. (The formula: ½ × 10 × 3².)</li></ol><p>Thrown <i>up</i> at 30 metres a second, it loses 10 every second, so it stops rising after 30 ÷ 10 = 3 seconds.</p>",
  arc: "<p>A clock leaves your hand and returns <b>10 seconds</b> later. Which arc gives it the most time?</p><ol><li>The arc of most time is the one a freely thrown thing follows.</li><li>A thrown thing that returns after 10 seconds rises for 5 and falls for 5.</li><li>Falling from rest for 5 seconds covers ½ × 10 × 5² = <b>125 metres</b>. That is the peak to look for.</li></ol>",
  idea: "<p>Three rules settle nearly all of these.</p><ol><li>In a small sealed room, standing on the ground cannot be told from being pushed by a rocket; and falling cannot be told from drifting.</li><li>Weight is the floor pushing on you. Take the floor away and you feel nothing.</li><li>Higher clocks run faster, and a freely falling thing follows the path that gives its clock the most time.</li></ol>",
};

const KINDS: Kind[] = [
  {
    id: 'feel',
    level: 1,
    make(rand) {
      const [who, free, why] = pickOne(rand, FEEL);
      return { ask: 'Is this in free fall: following its own straight line through spacetime, with nothing pushing on it?', show: `<p>${who}.</p>`, outside: `<p class="soft">Ask what a set of scales carried along would read.</p>`, options: ['Yes: free fall', 'No: something is pushing on it'], right: free ? 0 : 1, why };
    },
  },
  {
    id: 'clocks',
    level: 1,
    make(rand) {
      const pairs: [string, string, string][] = [
        ['on a mountain top', 'at the seashore', 'on a planet'],
        ['in the attic', 'in the cellar', 'on a planet'],
        ['on a weather balloon', 'on the launch pad below it', 'on a planet'],
        ['in the nose of a rocket that is firing its engines', 'in the tail of the same rocket', 'in the rocket'],
        ['on the hundredth floor', 'on the first floor', 'on a planet'],
      ];
      const [hi, lo] = pickOne(rand, pairs);
      const fast = rand() < 0.5;
      return { ask: fast ? 'Which clock runs faster?' : 'After a year, which clock has counted less time?', show: `<p>Two identical clocks: one <b>${hi}</b>, one <b>${lo}</b>. Neither is moving relative to the other.</p>`, ...choices(rand, `The one ${fast ? hi : lo}`, [`The one ${fast ? lo : hi}`, 'Neither: they agree']), why: 'The higher clock runs faster. Lower down, or toward the tail of a rocket that is pushing forward, less time passes.' };
    },
  },
  {
    id: 'gain',
    level: 2,
    make(rand) {
      const h = pickOne(rand, [5, 10, 20, 50, 100, 200, 500, 1000]);
      const gain = Math.round(NS_PER_M * h);
      return { ask: 'After a year, by about how much is the higher clock ahead?', show: `<p>Near the ground, a clock gains about <b>${NS_PER_M} billionths of a second a year</b> for each metre it is raised. One clock stays on the ground; another sits <b>${h.toLocaleString()} metres</b> higher.</p>`, outside: `<p class="soft">Near the ground the gain is in proportion to the height: twice as high, twice the gain.</p>`, ...choices(rand, `${gain.toLocaleString()} billionths of a second`, [`${Math.round(NS_PER_M * h * h).toLocaleString()} billionths of a second`, `${tidy(NS_PER_M)} billionths of a second`, `${Math.round((NS_PER_M * h) / 10).toLocaleString()} billionths of a second`]), why: `${NS_PER_M} × ${h.toLocaleString()} = ${gain.toLocaleString()}. Tiny, and measured: the best clocks now show the difference across a millimetre.` };
    },
  },
  {
    id: 'drop',
    level: 2,
    make(rand) {
      const t = 1 + Math.floor(rand() * 6);
      const which = Math.floor(rand() * 3);
      const v0 = 10 * t;
      return which === 0
        ? { ask: 'How fast is it going?', show: `<p>A stone is let go from rest and falls for <b>${t} ${t === 1 ? 'second' : 'seconds'}</b>. Take its acceleration as 10 metres a second, each second, and leave the air out.</p>`, outside: `<p class="soft">Acceleration is the rate at which speed changes: here, 10 more metres a second for every second that passes.</p>`, ...numbers(rand, 10 * t, [5 * t * t, 10 + t, 5 * t]), why: `10 metres a second gained each second, for ${t} ${t === 1 ? 'second' : 'seconds'}: ${10 * t} metres a second.` }
        : which === 1
          ? { ask: 'How far has it fallen?', show: `<p>A stone is let go from rest and falls for <b>${t} ${t === 1 ? 'second' : 'seconds'}</b>. Take its acceleration as 10 metres a second, each second, and leave the air out.</p>`, outside: `<p class="soft">Its speed grows steadily from 0 to ${10 * t}, so on average it was ${5 * t}. Distance is average speed times time.</p>`, ...numbers(rand, 5 * t * t, [10 * t, 10 * t * t, 5 * t]), why: `Average speed ${5 * t} metres a second, for ${t} ${t === 1 ? 'second' : 'seconds'}: ${5 * t * t} metres. That is ½ × 10 × ${t}².` }
          : { ask: 'How long until it stops rising?', show: `<p>A stone is thrown straight up at <b>${v0} metres a second</b>. Take its acceleration as 10 metres a second, each second, downward.</p>`, ...numbers(rand, t, [2 * t, v0, t + 1]), why: `It loses 10 metres a second every second, so ${v0} are gone after ${t} ${t === 1 ? 'second' : 'seconds'}. It comes back to the hand after ${2 * t}.` };
    },
  },
  {
    id: 'arc',
    level: 3,
    make(rand) {
      const T = pickOne(rand, [2, 4, 6, 8]);
      const real = (10 * T * T) / 8;
      const others = shuffled(rand, [real / 5, real / 2, real * 2, real * 4]).slice(0, 2);
      const peaks = shuffled(rand, [real, ...others]);
      return { ask: 'Which arc puts the most time on the clock?', show: `<p>A clock leaves your hand and returns to it <b>${T} seconds</b> later. Three arcs it might be made to follow between those two moments peak at <b>${peaks.map((p) => `${tidy(p)} m`).join('</b>, <b>')}</b>. (Take the acceleration of free fall as 10.)</p>`, outside: `<p class="soft">The path of most time is the path of free fall. A thing thrown up that takes ${T} seconds to return was rising for ${T / 2}; it falls from its peak in the same ${T / 2}.</p>`, options: peaks.map((p) => `The one that peaks at ${tidy(p)} m`), right: peaks.indexOf(real), why: `Falling from rest for ${T / 2} seconds covers ½ × 10 × ${T / 2}² = ${tidy(real)} metres, so the arc of a freely thrown clock peaks there. Lower, and it misses time it could have had from height. Higher, and it loses more to speed than it gains.` };
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

type Scene = 'ground' | 'rocket' | 'fall' | 'drift';
const SCENES: [Scene, string][] = [
  ['ground', 'standing on Earth'],
  ['rocket', 'rocket, engines on'],
  ['fall', 'cable cut: falling'],
  ['drift', 'drifting in deep space'],
];
let scene: Scene = 'ground';
let beam = false;
let h = 1;
let towered = false;
let H = 1;
const T = 2;
let clock = 0;

/** Height in metres from a slider that runs evenly through the powers of ten. */
const fromSlider = (s: number) => Math.pow(10, s);
function span(seconds: number): string {
  const a = Math.abs(seconds);
  if (a >= 1e-3) return `${tidy(a * 1e3)} thousandths of a second`;
  if (a >= 1e-6) return `${tidy(a * 1e6)} millionths of a second`;
  if (a >= 1e-9) return `${tidy(a * 1e9)} billionths of a second`;
  return `${tidy(a * 1e12)} trillionths of a second`;
}
const metres = (m: number) => (m >= 1000 ? `${Math.round(m / 1000).toLocaleString()} km` : m >= 10 ? `${Math.round(m)} m` : `${tidy(m)} m`);

function room(): string {
  const pushed = scene === 'ground' || scene === 'rocket';
  // The ball is let go every four seconds. Pushed rooms: it meets the floor. Free rooms: it stays put.
  const t = clock % 4;
  const drop = pushed ? Math.min(118, 0.5 * 420 * t * t) : 0;
  let s = DEFS;
  // What is outside, which the person inside cannot see.
  if (scene === 'ground') {
    s += `<rect x="100" y="-44" width="260" height="306" fill="#131a3e"/><path d="M100 -44V262M360 -44V262" stroke="#2c3260" stroke-width="3"/><path d="M230 30V-44" stroke="#8d93b8" stroke-width="3"/><rect x="0" y="262" width="460" height="66" fill="url(#art-ground)"/><text x="14" y="292" font-size="13">the ground</text><text x="372" y="20" font-size="12" opacity="0.7">lift shaft</text>`;
  } else if (scene === 'rocket') {
    const f = Math.sin(clock * 31) * 5;
    s += stars(460, 330, 55, 11) + `<path d="M150 262Q230 ${356 + f} 310 262Z" fill="url(#art-flame)" filter="url(#art-glow)"/><path d="M196 262Q230 ${316 - f} 264 262Z" fill="#fff" opacity="0.9"/>`;
    s += `<path d="M130 30Q230 -92 330 30Z" fill="#2a3166" stroke="#8d93b8" stroke-width="3"/><path d="M130 190L92 272H130ZM330 190L368 272H330Z" fill="#2a3166" stroke="#8d93b8" stroke-width="3" stroke-linejoin="round"/>`;
  } else if (scene === 'fall') {
    s += `<rect x="100" y="-44" width="260" height="372" fill="#131a3e"/><path d="M100 -44V328M360 -44V328" stroke="#2c3260" stroke-width="3"/><path d="M230 30q9 -16 -3 -30q-8 -10 4 -22" stroke="#8d93b8" stroke-width="3" fill="none"/>`;
    s += [112, 124, 336, 348].map((x, i) => `<path d="M${x} ${-30 + ((clock * 210 + i * 83) % 330)}v-34" stroke="#5f6aa8" stroke-width="2.5" stroke-linecap="round"/>`).join('');
    s += `<text x="372" y="20" font-size="12" opacity="0.7">cable cut</text>`;
  } else s += stars(460, 330, 70, 5);
  s += `<rect x="130" y="30" width="200" height="232" rx="4" fill="#0b0e22" stroke="#aab0d6" stroke-width="3.5"/><path d="M133 258H327" stroke="#4a5080" stroke-width="5"/>`;
  // The person: feet on the floor where there is a push; afloat where there is not.
  const py = pushed ? 0 : -40 + Math.sin(clock * 0.9) * 5;
  const lean = pushed ? 0 : Math.sin(clock * 0.6) * 6;
  s += `<g transform="translate(180 ${py}) rotate(${lean} 0 215)"><g stroke="#e9e6f5" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M0 186V224"/><path d="M0 224L${pushed ? -9 : -14} ${pushed ? 256 : 250}M0 224L${pushed ? 9 : 12} ${pushed ? 256 : 252}"/><path d="M0 194L24 ${pushed ? 180 : 188}M0 194L-14 214"/></g><circle cx="0" cy="170" r="12" fill="#e9e6f5"/></g>`;
  s += `<circle cx="214" cy="${(pushed ? 150 : 150 + py) + drop}" r="8" fill="#ff9ab8" filter="url(#art-glow)"/>`;
  if (beam) {
    // The bend is real and far too small to see; it is drawn here some hundred million million times too large.
    const sag = pushed ? 46 : 0;
    s += `<path d="M133 70Q230 70 327 ${70 + sag}" stroke="#e8c24a" stroke-width="3" fill="none" filter="url(#art-glow)"/><circle cx="133" cy="70" r="5" fill="#e8c24a"/><path d="M327 70h-12" stroke="#aab0d6" stroke-width="2.5"/>`;
    s += `<text x="338" y="${75 + sag}" font-size="12">${pushed ? 'lands low' : 'lands level'}</text>`;
  }
  return `<svg viewBox="0 -44 460 372" style="width:100%;max-width:520px;display:block;margin:auto;background:#070919">${s}</svg>`;
}

function tower(): string {
  const day = higher(h) * 86400;
  const year = higher(h) * YEAR;
  return `<p>A clock <b>${metres(h)}</b> above the ground runs faster than one on the ground by <b>${span(day)} a day</b>, which is ${span(year)} a year.</p>`;
}

function arcs(): string {
  const W = 460;
  const Ht = 230;
  const X = (t: number) => 40 + (t / T) * (W - 70);
  const Y = (m: number) => Ht - 26 - (m / 12) * (Ht - 44);
  const curve = (peak: number) => {
    let d = '';
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * T;
      d += `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Y(4 * peak * (t / T) * (1 - t / T)).toFixed(1)}`;
    }
    return d;
  };
  const now = thrown(H, T);
  const best = thrown(truePeak(T), T).net;
  let s = `<path d="M${X(0)} ${Y(0)}H${X(T)}" stroke="#8d93b8"/>`;
  for (const m of [0, 4, 8, 12]) s += `<text x="${X(0) - 8}" y="${Y(m) + 4}" font-size="11" text-anchor="end" opacity="0.6">${m} m</text>`;
  s += `<text x="${X(0)}" y="${Ht - 6}" font-size="11" text-anchor="middle" opacity="0.7">thrown</text><text x="${X(T) + 8}" y="${Ht - 6}" font-size="11" text-anchor="end" opacity="0.7">caught, 2 s later</text>`;
  s += `<path d="${curve(H)}" stroke="#e8c24a" stroke-width="3.5" fill="none"/>`;
  const bar = (label: string, value: number, colour: string, row: number) => `<text x="0" y="${14 + row * 22}" font-size="12">${label}</text><rect x="118" y="${4 + row * 22}" width="${Math.max(0, (Math.abs(value) / (best * 4.2)) * 250).toFixed(1)}" height="12" fill="${colour}"/><text x="${124 + Math.max(0, (Math.abs(value) / (best * 4.2)) * 250)}" y="${14 + row * 22}" font-size="12">${value < 0 ? '−' : ''}${tidy(Math.abs(value) * 1e15)}</text>`;
  const bars = `<svg viewBox="0 0 460 72" style="width:100%;max-width:520px;display:block;margin:auto">${bar('gained from height', now.height, '#8fe0a4', 0)}${bar('lost to speed', -now.speed, '#ff9a9a', 1)}${bar('net, over a held clock', now.net, now.net >= best * 0.995 ? '#e8c24a' : '#e9e6f5', 2)}</svg>`;
  return `<svg viewBox="0 0 ${W} ${Ht}" style="width:100%;max-width:520px;display:block;margin:auto">${s}</svg>${bars}<p class="soft">The arc peaks at <b>${tidy(H)} m</b>. Figures are in millionths of a billionth of a second.</p>`;
}

function drawer(): string {
  const gps = 20.2e6;
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>That no experiment in a small sealed room can tell gravity from steady acceleration, or free fall from drifting, is the <b>equivalence principle</b>. Einstein came to it in 1907 and called it the happiest thought of his life.</li>
      <li>Moving with nothing pushing on you is <b>free fall</b>, and the path of a thing in free fall through spacetime is a <b>geodesic</b>: the straightest path there is, and the one of most proper time.</li>
      <li>What you feel as weight is the floor's push. Physicists call the acceleration you can feel <b>proper acceleration</b>. Standing still on Earth, yours is one g, upward.</li>
      <li>Clocks lower down running slower is <b>gravitational time dilation</b>. Seen in light climbing upward, whose waves arrive stretched, it is <b>gravitational redshift</b>.</li>
    </ul>
    <p>All of it is measured. In 1960 Pound and Rebka found the shift in light sent up a 22.5-metre tower at Harvard: ${tidy(higher(22.5) * 1e15)} parts in a thousand million million. In 2010 a pair of clocks at NIST in Colorado showed it across 33 centimetres. The bending of starlight past the Sun was first measured at the eclipse of 1919. And satellite navigation would not work without it: a GPS clock gains ${Math.round(higher(gps) * 86400 * 1e6)} millionths of a second a day from being high, loses ${Math.round((orbiting(gps) - (465 * 465) / (2 * C * C)) * 86400 * 1e6)} from moving fast, and is built to run slow by the difference.</p>
    <p class="soft">One caution. The rocket argument gives only half of the bending of light that is measured. The other half comes from space itself being curved near the Sun, which the next chamber begins on.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Acceleration.</b> Speed was a rate of change: how fast position changes, v = dx/dt. Acceleration is the rate of change of <i>that</i>: how fast the speed changes.</p>
      <div class="eq">a = dv/dt = d²x/dt²</div>
      <p>The last form is read "d two x by d t squared", and called a <b>second derivative</b>: a rate of change of a rate of change. For a thing let go near the ground, a is the same all the time, about 9.8 metres a second each second, and written g. Then</p>
      <div class="eq">speed = g t &nbsp;&nbsp;&nbsp; distance fallen = ½ g t²</div>
      <p>The ½ is there because the speed grew evenly from nothing, so on average it was half its final value.</p>
      <p><b>Clocks and height.</b> Near the ground, raising a clock by a height h makes it run faster by the fraction</p>
      <div class="eq">g h / c²</div>
      <p>For one metre that is ${tidy(higher(1) * 1e16)} parts in ten thousand million million, or ${tidy(higher(1) * YEAR * 1e9)} billionths of a second a year.</p>
      <p><b>The thrown clock.</b> Step 1 said a clock moving at speed v runs slow by the fraction v²/2c², near enough, when v is small. So the time a thrown clock gains over one held still is the integral, over the flight, of what height gives less what speed costs:</p>
      <div class="eq">gain = ∫ ( g h / c² − v² / 2c² ) dt</div>
      <p>For an arc that peaks at H and returns after T, this comes to (⅔ g H T − 8H²/3T) ÷ c². It is greatest when H = g T²/8, and that is exactly how high a thrown stone goes if it is to return after T. The chamber tried only arcs of one shape; the same is true against every path there is.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://www.einstein-online.info/en/spotlight/equivalence_principle/" target="_blank" rel="noopener">Einstein Online, The elevator, the rocket, and gravity</a>. The equivalence principle, carefully, with its limits.</li>
      <li>Read: <a href="https://www.feynmanlectures.caltech.edu/II_42.html" target="_blank" rel="noopener">The Feynman Lectures on Physics, volume II, chapter 42, "Curved Space"</a>. Its later sections are this chamber, thrown clock included. Free from Caltech.</li>
      <li>Read: <a href="https://www.nist.gov/news-events/news/2010/09/nist-pair-aluminum-atomic-clocks-reveal-einsteins-relativity-personal-scale" target="_blank" rel="noopener">NIST, Aluminum atomic clocks reveal relativity at a personal scale</a>. The 33-centimetre measurement.</li>
      <li>Watch: <a href="https://www.youtube.com/playlist?list=PLsPUh22kYmNAmjsHke4pd8S9z6m_hVRur" target="_blank" rel="noopener">PBS Space Time, Curved Spacetime in General Relativity</a>. A playlist that takes this and the next chamber slowly.</li>
      <li>Book: <a href="https://www.eftaylor.com/exploringblackholes/" target="_blank" rel="noopener">Taylor, Wheeler and Bertschinger, <i>Exploring Black Holes</i></a>. Free from the author's site. General relativity with little more than this chamber's calculus.</li>
      <li>For the math: <a href="https://www.3blue1brown.com/lessons/higher-order-derivatives" target="_blank" rel="noopener">3Blue1Brown, Higher order derivatives</a>, and <a href="https://openstax.org/books/university-physics-volume-1/pages/3-introduction" target="_blank" rel="noopener">OpenStax University Physics, volume 1, chapter 3</a>, on motion along a line.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · falling', 'Pushed, or free?', 'Leave the air out of it throughout. <b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'falling',
    kicker: 'Gravity · 4',
    title: 'Falling is the straight line',
    steps: [
      { say: 'You are shut in a lift with no windows, standing on Earth. You let go of a ball, and it drops to the floor. ¶ <b>Now switch to the rocket.</b> It is far from any planet, and its engines push the floor up at a steady rate.', until: () => scene === 'rocket' },
      { say: 'The ball meets the floor in just the same way. In the rocket nothing pulls the ball down: the floor comes up to it.', ask: ['From inside, without looking out, which experiment tells the two rooms apart?', ['Dropping a heavy ball and a light one together', 'Standing on a set of scales', 'Neither. Nothing done inside the room can'], 2, 'In both rooms everything let go reaches the floor together, whatever it weighs, and the scales read the same. Einstein\'s proposal was that there is no difference to find: not a hidden one, none.'] },
      { say: '<b>Now cut the lift\'s cable.</b>', until: () => scene === 'fall' },
      { say: 'The lift, you and the ball are all falling together.', ask: ['You let go of the ball. As you see it, what does it do?', ['Drops to the floor as before', 'Stays floating where you let it go', 'Rises to the ceiling'], 1, 'It floats, and so do you. Look at the fourth room, drifting in deep space: it is the same. What you feel as weight was only ever the floor pushing on your feet.'] },
      { say: '<b>Turn on the beam of light,</b> and look at it in each room.', until: () => beam },
      { say: 'In the rocket the beam lands low on the far wall, because the floor rose while the light was crossing.', ask: ['If nothing can tell the rocket from the ground, what must light do on the ground?', ['Bend downward too', 'Go perfectly straight, since light weighs nothing', 'Slow down and stop'], 0, 'Gravity bends light. Across a room the bend is less than the width of an atom, and is drawn here vastly too large. Past the Sun it is big enough to measure, and it was, in 1919.'] },
      { say: 'One consequence more, and it is the important one. ¶ In the rocket, put a clock in the nose that flashes once a second toward the tail. While each flash is on its way down, the tail gains speed toward it. So the flashes arrive closer together than they were sent. This is the twins\' Doppler effect, and here it never stops. ¶ Watched from the tail, the nose clock runs fast.', ask: ['So, in a house on the ground: which runs faster, a clock in the attic or one in the cellar?', ['The one in the attic', 'The one in the cellar', 'Neither'], 0, 'Higher clocks run faster. This is not an appearance: bring the two together afterwards and the attic clock has counted more. <b>Slide the height below</b> and see how much.'] },
      { say: 'Slide the height of the upper clock, from a step on a staircase to a navigation satellite.', until: () => towered },
      { say: 'Now put that together with the twins, where the straight path between two meetings put the most time on its clock. ¶ <b>Throw a clock up and catch it two seconds later.</b> Two things pull against each other. Higher up, it ticks faster. But to go higher in the same two seconds it must move faster, and moving costs time. ¶ <b>Slide the peak of the arc and find the most time.</b>', until: () => Math.abs(H - truePeak(T)) < 0.16 },
      { say: 'The most time comes when the arc peaks at 4.9 metres.', ask: ['Throw a real ball so that it comes back to your hand after two seconds. How high does it go?', ['About 2.5 metres', 'About 4.9 metres', 'About 9.8 metres'], 1, 'The same. Nothing steers the ball onto that arc: it is the straight line, the path of most time, and the ball simply follows it. It looks curved only on a drawing of height against time. You, standing and watching, are the one being pushed off a straight line, by the ground.'] },
    ],
    summary: '<b>Gravity is not a force that pulls things off their straight paths. Free fall is the straight path.</b> Clocks run at different rates at different heights, and a falling thing follows the line of most time through that. Weight is what it feels like to be held off the line.',
    frame: () =>
      `<div id="room"></div><div class="bar">${SCENES.map(([k, name]) => `<button class="chip pale" data-do="scene" data-v="${k}">${name}</button>`).join('')}</div><div class="bar"><button class="chip pale" data-do="beam" data-v="on">a beam of light</button></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A clock, raised</div><div id="tower"></div><div class="bar"><span class="soft">a step</span><input id="height" type="range" min="-0.5" max="7.31" step="0.01" value="0" style="flex:1"><span class="soft">a satellite</span></div><div class="bar">${[[0.33, 'one stair-step'], [22.5, 'the Harvard tower'], [8849, 'Everest'], [20.2e6, 'a GPS satellite']].map(([m, name]) => `<button class="chip pale" data-do="height" data-v="${m}">${name}</button>`).join('')}</div></div>` +
      `<div id="part3" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A clock, thrown and caught</div><div id="arcs"></div><div class="bar"><span class="soft">barely tossed</span><input id="peak" type="range" min="0" max="12" step="0.05" value="1" style="flex:1"><span class="soft">12 m</span></div></div>`,
    paint: () => {
      $('room').innerHTML = room();
      run?.mark('scene', (k) => k === scene);
      run?.mark('beam', () => beam);
      const at = run?.step() ?? 0;
      ($('part2') as HTMLElement).hidden = at < 7;
      ($('part3') as HTMLElement).hidden = at < 8;
      $('tower').innerHTML = tower();
      $('arcs').innerHTML = arcs();
    },
    slide: (id, value) => {
      if (id === 'height') {
        h = fromSlider(value);
        towered = true;
      } else if (id === 'peak') H = value;
    },
    act: (what, value) => {
      if (what === 'scene') scene = value as Scene;
      else if (what === 'beam') beam = !beam;
      else if (what === 'height') {
        h = Number(value);
        ($('height') as HTMLInputElement).value = String(Math.log10(h));
        towered = true;
      }
    },
    drawer,
    next: ['tides', 'On to curved space'],
  });
  sh.draw();
  let last = performance.now();
  const loop = (now: number) => {
    clock += Math.min(0.1, (now - last) / 1000);
    last = now;
    $('room').innerHTML = room();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
expose(
  () => [...checkKinds(KINDS), ...checkGravity(), ...(Math.abs(higher(1) * YEAR * 1e9 - NS_PER_M) < 0.02 && Math.abs(truePeak(2) - G_SURFACE / 2) < 1e-9 ? [] : ['the chamber\'s own figures'])],
  () => ({ scene, beam, h, H, done: sh.kept.chapter }),
);
