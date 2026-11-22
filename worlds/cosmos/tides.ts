import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS, planet, stars } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { apart, checkGravity } from './gravity';
import type { Surface } from './gravity';
import { frac, tidy } from './physics';

/**
 * Curved space and tides.
 *
 * The last chamber made gravity vanish inside a small falling room. It does
 * not vanish from a large one: two things falling side by side toward a
 * planet drift together, and two falling one above the other drift apart.
 * That is exactly what walkers do on a curved surface, where straight paths
 * that begin parallel do not stay so. Curvature means that and nothing else,
 * and the tide is the curvature of spacetime.
 *
 * This is the picture that does the work the rubber sheet is usually asked
 * to do. The sheet needs gravity underneath it to explain gravity, and shows
 * only space bending; here nothing pulls on the walkers at all.
 *
 * Two figures: walkers on a plain, a globe and a saddle; and a ring of loose
 * balls inside a lift that is falling toward a planet.
 */

const sh = new Shell('portal-worlds-cosmos-tides-v1');
const QUARTER = Math.PI / 2;

// ---- The falling ring, followed step by step under the planet's pull ----

interface Frame {
  /** The middle of the lift: its distance from the planet's centre, in planet radii. */
  r: number;
  /** Each ball, measured from the middle of the lift. */
  balls: [number, number][];
}
const RING = 12;
function fall(): Frame[] {
  const start = 4;
  const size = 0.3;
  const at: [number, number, number, number][] = [[0, start, 0, 0]];
  for (let i = 0; i < RING; i++) {
    const a = (i / RING) * Math.PI * 2;
    at.push([size * Math.cos(a), start + size * Math.sin(a), 0, 0]);
  }
  const frames: Frame[] = [];
  const dt = 0.0005;
  for (let n = 0; at[0][1] > 2.4; n++) {
    if (n % 40 === 0) frames.push({ r: at[0][1], balls: at.slice(1).map((b) => [(b[0] - at[0][0]) / size, (b[1] - at[0][1]) / size]) });
    for (const b of at) {
      const pull = (x: number, y: number) => {
        const r = Math.hypot(x, y);
        return [-x / (r * r * r), -y / (r * r * r)];
      };
      let [ax, ay] = pull(b[0], b[1]);
      b[2] += (ax * dt) / 2;
      b[3] += (ay * dt) / 2;
      b[0] += b[2] * dt;
      b[1] += b[3] * dt;
      [ax, ay] = pull(b[0], b[1]);
      b[2] += (ax * dt) / 2;
      b[3] += (ay * dt) / 2;
    }
  }
  return frames;
}
const FRAMES = fall();
const extent = (f: Frame) => ({ tall: Math.max(...f.balls.map((b) => b[1])) - Math.min(...f.balls.map((b) => b[1])), wide: Math.max(...f.balls.map((b) => b[0])) - Math.min(...f.balls.map((b) => b[0])) });

// ---- Practice ----

const SIGNS: [string, Surface][] = [
  ['Two straight paths set off side by side and parallel. Further on, they are closer together.', 'sphere'],
  ['Two straight paths set off side by side and parallel. Further on, they are further apart.', 'saddle'],
  ['Two straight paths set off side by side and parallel. Further on, they are exactly as far apart as before.', 'flat'],
  ['The three angles of a large triangle, carefully measured, add up to 200°.', 'sphere'],
  ['The three angles of a large triangle, carefully measured, add up to 150°.', 'saddle'],
  ['The three angles of every triangle, however large, add up to 180°.', 'flat'],
  ['A large circle is paced out. Its circumference comes to less than 2π times its radius.', 'sphere'],
  ['A large circle is paced out. Its circumference comes to more than 2π times its radius.', 'saddle'],
  ['Two straight paths cross, and further on they cross a second time.', 'sphere'],
];
const SURFACE_WORDS: Record<Surface, string> = { sphere: 'Curved like a ball', saddle: 'Curved like a saddle', flat: 'Flat' };
const IDEAS: [string, string, string[], string][] = [
  ['Inside a small falling room, gravity cannot be felt. What can be felt in a large one, given long enough?', 'Things side by side drifting together, and things one above the other drifting apart', ['A steady pull toward the floor', 'A steady pull toward the ceiling', 'Nothing, however large the room'], 'Free fall removes weight, but not the difference in gravity from place to place. That difference is the tide, and it is the part of gravity that is there for every observer.'],
  ['Why is a ball rolling on a stretched rubber sheet a poor picture of gravity?', 'It uses real gravity, pulling the ball down into the dip, to explain gravity', ['Rubber is not strong enough', 'Space is not made of anything', 'It is a good picture: that is how gravity works'], 'It also bends only space. Most of everyday gravity comes from time running at different rates at different heights, which the sheet has no way to show.'],
  ['On a curved surface, what is a "straight line"?', 'The path of someone who walks forward and never turns', ['The path that looks straight on a flat map', 'There are none', 'Any path along a line of latitude'], 'Such a path is called a geodesic. On a globe the geodesics are the great circles. A line of latitude, other than the equator, needs constant turning to stay on.'],
  ['How could creatures living in a surface, with no way to step outside it, find out whether it is curved?', 'Add up the angles of a large triangle, or watch whether parallel straight paths stay parallel', ['They could not: you must see it from outside', 'By feeling which way is downhill', 'By measuring one very short straight path'], 'Curvature shows itself entirely from within. That is how the curvature of spacetime is measured: nobody steps outside the universe.'],
  ['Why are there two high tides a day and not one?', 'The Moon stretches the Earth along the line to it, raising one bulge beneath it and one on the far side', ['The Moon pulls the water on the near side only, and it sloshes back', 'The Sun makes the second one', 'The Earth spins twice a day'], 'The near water is pulled more than the Earth\'s centre, and the centre more than the far water. Each end is left bulging, and the Earth turns under both.'],
];

/** One question of each kind, worked through: shown until she has got one of that kind right. */
const EXAMPLES: Record<string, string> = {
  surface: "<p>Surveyors find that a large triangle's angles add up to <b>190°</b>.</p><ol><li>On a flat surface they would add up to exactly 180°.</li><li>190° is too much: the triangle is fat. That happens on a surface <b>curved like a ball</b>.</li></ol><p>The full table. Ball: parallels draw together, triangles over 180°, circles too small round. Saddle: parallels spread, triangles under 180°, circles too big round.</p>",
  drift: "<p>Picture the line each ball falls along: straight toward the planet's centre.</p><ol><li><b>Side by side:</b> two different lines, which meet at the centre. The balls drift <b>together</b>.</li><li><b>One above the other:</b> the same line, but the lower ball is nearer and pulled harder, so it gets ahead. They drift <b>apart</b>.</li></ol>",
  walk: "<p>Two walkers start <b>80 km</b> apart on the equator and walk straight north.</p><ol><li>Distance apart = starting distance × cosine of the latitude.</li><li>At latitude 60°: 80 × ½ = <b>40 km</b>.</li><li>At the pole, latitude 90°: 80 × 0 = <b>0 km</b>.</li></ol>",
  triangle: "<p>A triangle on a globe has angles adding up to <b>225°</b>.</p><ol><li>The excess over a flat triangle: 225 − 180 = 45°.</li><li>As a fraction of 720°: 45 ÷ 720 = <b>1/16</b> of the globe.</li></ol>",
  tide: "<p>A falling room is moved to <b>4 times</b> as far from the planet.</p><ol><li>The tide goes as one over the <i>cube</i> of the distance.</li><li>4 × 4 × 4 = 64. The tide is <b>64 times weaker</b>.</li></ol><p>The planet's mass comes in plainly: three times the mass, three times the tide.</p>",
  idea: "<p>The rules behind these:</p><ol><li>A straight line in a curved surface is the path of someone who never turns. Curvature shows when two such paths that start parallel do not stay parallel.</li><li>Curvature can be found from inside: by triangles, circles, or watching a neighbour.</li><li>A falling room removes weight but not the tide: stretched along the line to the planet, squeezed across it.</li></ol>",
};

const KINDS: Kind[] = [
  {
    id: 'surface',
    level: 1,
    make(rand) {
      const [sign, which] = pickOne(rand, SIGNS);
      const all: Surface[] = ['sphere', 'saddle', 'flat'];
      return { ask: 'What kind of surface is it?', show: `<p>Surveyors who cannot leave the surface they live in report this:</p><p><b>${sign}</b></p>`, options: all.map((k) => SURFACE_WORDS[k]), right: all.indexOf(which), why: which === 'sphere' ? 'On a ball, straight paths lean toward each other: parallels meet, triangles are too fat, circles too small.' : which === 'saddle' ? 'On a saddle, straight paths lean away from each other: parallels spread, triangles are too thin, circles too big.' : 'Only on a flat surface do the rules from school geometry hold exactly.' };
    },
  },
  {
    id: 'drift',
    level: 1,
    make(rand) {
      const body = pickOne(rand, ['the Earth', 'the Moon', 'a star', 'Jupiter']);
      const side = rand() < 0.5;
      return { ask: 'After a long fall, what have the two balls done?', show: `<p>A large sealed room is falling freely toward <b>${body}</b>. Inside it float two balls, at rest to begin with, <b>${side ? 'side by side, at the same height' : 'one directly above the other'}</b>.</p>`, outside: `<p class="soft">Each ball falls toward the centre of ${body}, and the nearer the centre, the stronger the pull.</p>`, ...choices(rand, side ? 'Drifted toward each other' : 'Drifted apart', [side ? 'Drifted apart' : 'Drifted toward each other', 'Stayed exactly as they were']), why: side ? `Each falls straight toward the centre of ${body}, and those two lines meet there. Seen from inside the room, the balls close in.` : `The lower one is nearer ${body} and is pulled harder, so it gets ahead. Seen from inside the room, they separate.` };
    },
  },
  {
    id: 'walk',
    level: 2,
    make(rand) {
      const d = pickOne(rand, [10, 20, 40, 60, 100, 200]);
      const which = Math.floor(rand() * 3);
      const setup = `<p>Two walkers stand on the equator of a globe, <b>${d} km</b> apart, both facing due north. Each walks perfectly straight. On a globe, their distance apart at any latitude is the starting distance times the cosine of the latitude. (cos 0° = 1, cos 60° = ½, cos 90° = 0.)</p>`;
      return which === 0
        ? { ask: 'How far apart are they as they cross latitude 60°?', show: setup, ...numbers(rand, d / 2, [d, 0, d * 2]), why: `${d} × cos 60° = ${d} × ½ = ${d / 2} km. Nothing pushed them together: the surface did it.` }
        : which === 1
          ? { ask: 'How far apart are they when they reach latitude 90°?', show: setup, ...numbers(rand, 0, [d, d / 2, d * 2]), why: `Latitude 90° is the pole, and cos 90° = 0. Every straight path north from the equator passes through it.` }
          : { ask: 'At what latitude are they half as far apart as when they began?', show: setup, ...choices(rand, '60°', ['45°', '30°', '90°']), why: `cos 60° = ½. Not at 45°, halfway to the pole: the paths close slowly at first and quickly later.` };
    },
  },
  {
    id: 'triangle',
    level: 2,
    make(rand) {
      const [sum, n, d] = pickOne(rand, [[210, 1, 24], [240, 1, 12], [270, 1, 8], [300, 1, 6], [360, 1, 4]] as [number, number, number][]);
      return { ask: 'What fraction of the whole globe does the triangle cover?', show: `<p>On a globe the angles of a triangle add up to more than 180°, and the excess, as a fraction of 720°, is the fraction of the globe's surface that the triangle covers.</p><p>A triangle on a globe has angles that add up to <b>${sum}°</b>.</p>`, ...choices(rand, frac(n, d), [frac(sum - 180, 360), frac(1, d * 2), frac(1, d / 2), frac(sum, 720)]), why: `The excess is ${sum} − 180 = ${sum - 180}°, and ${sum - 180} ÷ 720 = ${frac(n, d)}. ${sum === 270 ? 'This is the triangle from the pole down two lines of longitude a quarter-turn apart, closed by the equator: three right angles.' : 'The bigger the triangle, the more the curvature shows.'}` };
    },
  },
  {
    id: 'tide',
    level: 3,
    make(rand) {
      const cases: [string, string, string[], string][] = [
        ['twice as far from the planet', '8 times weaker', ['2 times weaker', '4 times weaker', '16 times weaker'], '2 × 2 × 2 = 8. The pull itself falls only 4 times; the difference in pull across the room falls 8 times.'],
        ['3 times as far from the planet', '27 times weaker', ['3 times weaker', '9 times weaker', '81 times weaker'], '3 × 3 × 3 = 27.'],
        ['half as far from the planet', '8 times stronger', ['2 times stronger', '4 times stronger', '16 times stronger'], 'Halving the distance multiplies the tide by 2 × 2 × 2. Tides grow very quickly close in.'],
        ['10 times as far from the planet', '1000 times weaker', ['10 times weaker', '100 times weaker', '10,000 times weaker'], '10 × 10 × 10 = 1000.'],
        ['at the same distance from a planet with twice the mass', '2 times stronger', ['4 times stronger', '8 times stronger', 'No different'], 'The tide is in simple proportion to the mass. Only the distance comes in as a cube.'],
      ];
      const [where, right, wrong, why] = pickOne(rand, cases);
      return { ask: 'How does the stretching across the room compare?', show: `<p>The tide across a falling room is in proportion to the planet's mass, divided by the <i>cube</i> of the distance to the planet's centre.</p><p>The same room falls again, <b>${where}</b>.</p>`, ...choices(rand, right, wrong), why };
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

let surface: Surface = 'flat';
let s = 0;
const reached: Record<Surface, number> = { flat: 0, sphere: 0, saddle: 0 };
let tideT = 0;
let tideMax = 0;
const SURFACES: [Surface, string][] = [
  ['flat', 'a flat plain'],
  ['sphere', 'a globe'],
  ['saddle', 'a saddle'],
];
const GAP = 0.2; // half the walkers' starting separation, in radians of longitude on the globe

function walkers(): string {
  const Ht = 300;
  let g = DEFS;
  const dot = (x: number, y: number, c: string) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="${c}" filter="url(#art-glow)"/>`;
  const line = (pts: [number, number][], c: string, w = 3) => `<polyline points="${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
  if (surface === 'flat') {
    for (let i = 0; i <= 6; i++) g += `<path d="M${30 + i * 40} 30V270M30 ${30 + i * 40}H270" stroke="#2c3260"/>`;
    for (const [side, c] of [[-1, '#e8c24a'], [1, '#7fb6ff']] as [number, string][]) {
      const x = 150 + side * 28;
      g += line([[x, 262], [x, 262 - s * 224]], c) + dot(x, 262 - s * 224, c);
    }
  } else if (surface === 'sphere') {
    const R = 125;
    const tilt = 0.5;
    const P = (lat: number, lon: number): [number, number, number] => {
      const x = Math.cos(lat) * Math.sin(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(lon);
      return [150 + R * x, 160 - R * (y * Math.cos(tilt) - z * Math.sin(tilt)), y * Math.sin(tilt) + z * Math.cos(tilt)];
    };
    g += `<circle cx="150" cy="160" r="${R}" fill="url(#art-globe)" stroke="#5f6aa8"/>`;
    const front = (pts: [number, number, number][]) => pts.filter((p) => p[2] > 0).map((p) => [p[0], p[1]] as [number, number]);
    for (let lon = -Math.PI; lon < Math.PI; lon += Math.PI / 6) g += line(front(Array.from({ length: 31 }, (_, i) => P((i / 30) * QUARTER * 2 - QUARTER, lon))), '#2c3260', 1);
    for (const lat of [0, Math.PI / 6, Math.PI / 3]) g += line(front(Array.from({ length: 61 }, (_, i) => P(lat, (i / 60) * Math.PI * 2 - Math.PI))), lat === 0 ? '#8d93b8' : '#2c3260', lat === 0 ? 1.5 : 1);
    for (const [side, c] of [[-1, '#e8c24a'], [1, '#7fb6ff']] as [number, string][]) {
      const pts = Array.from({ length: 31 }, (_, i) => P((i / 30) * s * QUARTER, side * GAP));
      const end = pts[pts.length - 1];
      g += line(pts.map((p) => [p[0], p[1]]), c) + dot(end[0], end[1], c);
    }
    const pole = P(QUARTER, 0);
    g += `<text x="${pole[0]}" y="${pole[1] - 10}" font-size="11" text-anchor="middle" opacity="0.7">pole</text><text x="262" y="${P(0, 1.2)[1] + 16}" font-size="11" opacity="0.7">equator</text>`;
  } else {
    // A sketch of a saddle: it rises to left and right and falls away ahead and behind.
    const P = (x: number, y: number): [number, number] => [150 + 95 * x + 34 * y, 170 - 30 * y - 62 * (x * x - y * y) * 0.55];
    for (let i = -5; i <= 5; i++) {
      g += line(Array.from({ length: 21 }, (_, k) => P(i / 5, k / 10 - 1)), '#2c3260', 1);
      g += line(Array.from({ length: 21 }, (_, k) => P(k / 10 - 1, i / 5)), '#2c3260', 1);
    }
    for (const [side, c] of [[-1, '#e8c24a'], [1, '#7fb6ff']] as [number, string][]) {
      const pts = Array.from({ length: 31 }, (_, i) => {
        const u = (i / 30) * s;
        return P(side * 0.13 * Math.cosh(u * QUARTER), u * 1.9 - 0.95);
      });
      const end = pts[pts.length - 1];
      g += line(pts, c) + dot(end[0], end[1], c);
    }
    g += `<text x="150" y="292" font-size="11" text-anchor="middle" opacity="0.7">a sketch: the true surface curves this way at every point</text>`;
  }
  // How far apart, against how far walked.
  const GX = (u: number) => 330 + u * 110;
  const GY = (d: number) => 262 - (d / 2.6) * 224;
  let graph = `<path d="M${GX(0)} ${GY(0)}H${GX(1)}M${GX(0)} ${GY(0)}V${GY(2.6)}" stroke="#8d93b8" fill="none"/><path d="M${GX(0)} ${GY(1)}H${GX(1)}" stroke="#2c3260" stroke-dasharray="3 4"/>`;
  for (const [k] of SURFACES) graph += line(Array.from({ length: 41 }, (_, i) => [GX(i / 40), GY(apart(k, (i / 40) * QUARTER))]), k === surface ? '#fff' : '#3b4170', k === surface ? 2.5 : 1.5);
  graph += `<circle cx="${GX(s)}" cy="${GY(apart(surface, s * QUARTER))}" r="5" fill="#ff9ab8"/><text x="${GX(0.5)}" y="${GY(0) + 16}" font-size="11" text-anchor="middle" opacity="0.7">distance walked →</text><text x="${GX(0) - 8}" y="${GY(1.3)}" font-size="11" text-anchor="middle" opacity="0.7" transform="rotate(-90 ${GX(0) - 8} ${GY(1.3)})">distance apart →</text>`;
  return `<svg viewBox="0 0 460 ${Ht}" style="width:100%;max-width:560px;display:block;margin:auto">${g}${graph}</svg><p>They are now <b>${Math.round(100 * apart(surface, s * QUARTER))}</b> paces apart, having started at 100.</p>`;
}

function ring(): string {
  const f = FRAMES[Math.min(FRAMES.length - 1, Math.round(tideT * (FRAMES.length - 1)))];
  const e = extent(f);
  const u = 52;
  let g = DEFS + stars(460, 304, 40, 13) + `<rect x="20" y="20" width="260" height="260" rx="4" fill="#0b0e22" stroke="#aab0d6" stroke-width="3.5"/><circle cx="150" cy="150" r="${u}" fill="none" stroke="#3b4170" stroke-dasharray="3 5"/>`;
  g += `<polygon points="${f.balls.map((b) => `${(150 + b[0] * u).toFixed(1)},${(150 - b[1] * u).toFixed(1)}`).join(' ')}" fill="none" stroke="#ff9ab8" stroke-width="1.5"/>`;
  for (const b of f.balls) g += `<circle cx="${(150 + b[0] * u).toFixed(1)}" cy="${(150 - b[1] * u).toFixed(1)}" r="6" fill="#ff9ab8" filter="url(#art-glow)"/>`;
  g += `<text x="150" y="296" font-size="11" text-anchor="middle" opacity="0.7">inside the falling lift (the planet is below)</text>`;
  // Where the lift is.
  const Y = (r: number) => 262 - (r - 1) * 74;
  g += `${planet(390, 372, 104)}<path d="M390 ${Y(4)}V${Y(1.05)}" stroke="#3b4170" stroke-dasharray="3 5"/><rect x="381" y="${Y(f.r) - 9}" width="18" height="18" fill="#0b0e22" stroke="#8d93b8" stroke-width="2"/><text x="390" y="26" font-size="11" text-anchor="middle" opacity="0.7">where the lift is</text>`;
  return `<svg viewBox="0 0 460 304" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p>The ring is now <b>${tidy(e.tall / 2)}</b> times its first height and <b>${tidy(e.wide / 2)}</b> times its first width.</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The straightest possible path in a curved surface or a curved spacetime is a <b>geodesic</b>. On a globe the geodesics are the <b>great circles</b>.</li>
      <li>A surface where geodesics that start parallel draw together has <b>positive curvature</b>; where they spread, <b>negative curvature</b>; where they stay parallel it is <b>flat</b>.</li>
      <li>The drawing together or spreading of neighbouring geodesics is <b>geodesic deviation</b>. It is how curvature is defined and how it is measured.</li>
      <li>In spacetime, geodesic deviation is the <b>tidal effect</b> of gravity: stretching along the line to the mass, squeezing across it.</li>
    </ul>
    <p>John Wheeler's summary of the whole theory: "Spacetime tells matter how to move; matter tells spacetime how to curve."</p>
    <p>The stretching is measured at every scale. The Moon raises two bulges in the Earth's oceans, and the Sun two more, a little under half as high. Jupiter's tides knead its moon Io so hard that Io is the most volcanic body known. And in 2015 the LIGO detectors caught a passing gravitational wave, which is a tide that travels: it changed the length of their four-kilometre arms by a small fraction of the width of a proton.</p>
    <p class="soft">Why not the rubber sheet with a ball rolling in the dip? Because the ball rolls inward only when real gravity pulls it down the slope, so the picture uses gravity to explain gravity. It also bends only space, when most of everyday gravity is the bending of time from the last chamber.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Curvature, as an equation.</b> Call the walkers' distance apart d, and the distance they have walked s. The last chamber's second derivative, a rate of change of a rate of change, is what curvature controls:</p>
      <div class="eq">d²d/ds² = −K d</div>
      <p>K is the curvature. On a flat plain K is 0, and d never changes. On a globe of radius R, K is 1/R², and the equation's solution is d = d₀ cos(s/R): the walkers close slowly, then quickly, and meet a quarter of the way round. On a saddle K is negative and the solution grows without limit. The graph beside the walkers is this equation, solved.</p>
      <p><b>Triangles.</b> On a globe a triangle's angles add up to 180° plus 720° times the fraction of the globe it covers. A triangle with three right angles covers an eighth of the globe.</p>
      <p><b>Tides.</b> At a distance r from a mass M, two things a small distance d apart along the line to the mass are pulled apart with an acceleration</p>
      <div class="eq">2 G M d / r³</div>
      <p>and two things side by side are pushed together with half of that. Compare the two equations: the tide is the curvature K of spacetime, and it is set by GM/r³. Twice as far away, the pull is a quarter, and the tide an eighth.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://www.einstein-online.info/en/spotlight/geometry_force/" target="_blank" rel="noopener">Einstein Online, Gravity: from weightlessness to curvature</a>. This chamber's argument, from the Max Planck Institute for Gravitational Physics.</li>
      <li>Read: <a href="https://www.feynmanlectures.caltech.edu/II_42.html" target="_blank" rel="noopener">The Feynman Lectures on Physics, volume II, chapter 42, "Curved Space"</a>. Its first sections are bugs on a plane, a sphere and a hot plate, finding out their curvature from inside.</li>
      <li>Read: <a href="https://oceanservice.noaa.gov/education/tutorial_tides/tides02_cause.html" target="_blank" rel="noopener">NOAA, What causes tides</a>. The ocean's tides, and why distance counts for more than mass.</li>
      <li>Watch: <a href="https://www.youtube.com/playlist?list=PLsPUh22kYmNAmjsHke4pd8S9z6m_hVRur" target="_blank" rel="noopener">PBS Space Time, Curved Spacetime in General Relativity</a>.</li>
      <li>Watch: <a href="https://theoreticalminimum.com/courses/general-relativity/2012/fall" target="_blank" rel="noopener">Leonard Susskind, General Relativity (Stanford, The Theoretical Minimum)</a>. Full lectures; the opening ones are on the equivalence principle and tidal forces.</li>
      <li>Course: <a href="https://ocw.mit.edu/courses/8-962-general-relativity-spring-2020/" target="_blank" rel="noopener">MIT OpenCourseWare 8.962, General Relativity</a>. The graduate course, for seeing where this leads.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · curved space and tides', 'Which way do they lean?', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'tides',
    kicker: 'Gravity · 5',
    title: 'Curved space and tides',
    steps: [
      { say: 'Two walkers stand side by side on a flat plain, a hundred paces apart, both facing due north. Each will walk perfectly straight: forward, never turning. <b>Slide them forward.</b>', until: () => reached.flat > 0.8 },
      { say: 'A hundred paces apart the whole way. The graph on the right is a level line.', ask: ['Now stand them on the equator of a globe, side by side, both facing due north, each walking perfectly straight. What happens to the distance between them?', ['It stays at a hundred paces', 'It shrinks', 'It grows'], 1, '<b>Switch to the globe and walk them all the way.</b>'] },
      { say: '<b>Switch to the globe and walk them all the way.</b>', until: () => reached.sphere > 0.97 },
      { say: 'They have met at the pole.', ask: ['Neither of them ever turned. What brought them together?', ['A force pulling each toward the other', 'The shape of the surface they walk in', 'They were not really walking straight'], 1, 'Each path is as straight as a path in a globe can be. On a curved surface, straight lines that begin parallel do not stay parallel. That is what curvature <i>means</i>, and the walkers can find it out without ever seeing the globe from outside: each need only watch the other.'] },
      { say: '<b>Now try the saddle.</b>', until: () => reached.saddle > 0.8 },
      { say: 'On a saddle the straight paths spread. ¶ Now back to the falling lift of the last chamber. Make it a big lift, and let it fall toward the Earth for a long time, with two balls floating in it side by side. Each ball falls straight toward the centre of the Earth.', ask: ['Watching from inside the lift, what do you see the two balls do?', ['Stay exactly as they were', 'Drift slowly toward each other', 'Drift slowly apart'], 1, 'Two straight lines through spacetime start out parallel and draw together, exactly like the walkers on the globe. ¶ Below is the same lift, now with a whole ring of loose balls. <b>Slide time forward.</b>'] },
      { say: '<b>Slide time forward,</b> and watch the ring as the lift falls.', until: () => tideMax > 0.95 },
      { say: 'The ring has been squeezed from the sides, and stretched from top to bottom.', ask: ['Why stretched?', ['The lowest balls are nearest the planet and pulled hardest, so they get ahead', 'The air in the lift pushes them', 'The floor of the lift pushes them'], 0, 'Nothing touches the balls at all. This stretching and squeezing is the part of gravity that falling cannot remove, however you move. It has a familiar name: the tide.'] },
      { say: 'The Moon does this to the whole Earth, stretching it along the line that joins them.', ask: ['How many bulges of ocean does that raise?', ['One, facing the Moon', 'Two: one facing the Moon and one on the far side', 'None: water cannot be stretched'], 1, 'Two, like the top and bottom of the ring; and the Earth turns under both, which is why most coasts have two high tides a day.'] },
    ],
    summary: '<b>Curvature is straight paths that begin parallel and do not stay so.</b> A small falling room feels no gravity at all. A large one feels its contents drift together and apart, and that drift, the tide, is the curvature of spacetime.',
    frame: () =>
      `<div id="walkers"></div><div class="bar">${SURFACES.map(([k, name]) => `<button class="chip pale" data-do="surface" data-v="${k}">${name}</button>`).join('')}</div><div class="bar"><span class="soft">start</span><input id="walk" type="range" min="0" max="1" step="0.005" value="0" style="flex:1"><span class="soft">onward</span></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A ring of loose balls in a falling lift</div><div id="ring"></div><div class="bar"><span class="soft">let go</span><input id="time" type="range" min="0" max="1" step="0.005" value="0" style="flex:1"><span class="soft">later</span></div></div>`,
    paint: () => {
      $('walkers').innerHTML = walkers();
      $('ring').innerHTML = ring();
      run?.mark('surface', (k) => k === surface);
      ($('part2') as HTMLElement).hidden = (run?.step() ?? 0) < 6;
    },
    slide: (id, value) => {
      if (id === 'walk') {
        s = value;
        reached[surface] = Math.max(reached[surface], s);
      } else {
        tideT = value;
        tideMax = Math.max(tideMax, value);
      }
    },
    act: (what, value) => {
      if (what === 'surface') {
        surface = value as Surface;
        s = 0;
        ($('walk') as HTMLInputElement).value = '0';
      }
    },
    key: () => [['#e8c24a', 'one walker'], ['#7fb6ff', 'the other'], ['#fff', 'their distance apart, on the graph'], ['#ff9ab8', 'the loose balls']],
    drawer,
    next: ['orbits', 'On to orbits'],
  });
  sh.draw();
}
expose(
  () => {
    // Early in the fall, the ring should stretch along twice as fast as it is squeezed across.
    const early = extent(FRAMES[Math.round(FRAMES.length * 0.3)]);
    const ratio = (early.tall - 2) / (2 - early.wide);
    const end = extent(FRAMES[FRAMES.length - 1]);
    return [...checkKinds(KINDS), ...checkGravity(), ...(Math.abs(ratio - 2) < 0.15 ? [] : [`the ring stretches ${ratio} times as fast as it narrows`]), ...(end.tall > 2 && end.wide < 2 ? [] : ['the ring'])];
  },
  () => ({ surface, s, tideT, done: sh.kept.chapter }),
);
