import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS, stars } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { CORNERS, EDGES, checkEdges, cube, pull, round } from './edges';
import type { Round } from './edges';
import { frac, tidy } from './physics';

/**
 * What a dimension does.
 *
 * A dimension is a direction: one more number needed to say where something
 * is. It is not another realm, and not a level that things rise through.
 * What the number of directions does can be worked out exactly. A force
 * that spreads from a point thins out faster the more directions there are
 * to spread into; and with that, orbits that hold together in three
 * directions fall apart in four. So the fact that there are planets is
 * itself a measurement of how many directions space has.
 *
 * A cube in four directions can be counted and drawn, and that is
 * mathematics. Whether space has directions beyond the three we see is a
 * question for experiment, and so far the answer is: none found.
 *
 * Three figures: a force spreading in two, three and four directions; an
 * orbit in each; and a four-dimensional cube to turn.
 */

const sh = new Shell('portal-worlds-cosmos-dimensions-v1');

// ---- Practice ----

const NEEDS: [string, number, string][] = [
  ['where a ship is on the surface of the sea', 2, 'Latitude and longitude. The sea\'s surface has two directions, though it sits in a space of three.'],
  ['where an aeroplane is', 3, 'Latitude, longitude and height.'],
  ['where and when two people will meet', 4, 'Three numbers for the place and one for the time. An event in spacetime needs four.'],
  ['where a bead is on a wire', 1, 'Only how far along the wire it is.'],
  ['the places of two flies in a room', 6, 'Three for each. Nothing six-dimensional is in the room; six is how many numbers the question needs.'],
  ['the setting of a mixing desk with ten sliders', 10, 'One number per slider. "Ten dimensions" here means exactly that and nothing stranger.'],
  ['the places of three ships on the sea', 6, 'Two for each ship.'],
];
const IDEAS: [string, string, string[], string][] = [
  ['What is a dimension?', 'An independent direction: one more number needed to say where something is', ['Another world alongside this one', 'A higher level of reality', 'A kind of energy'], 'Left-right, forward-back, up-down: three. Add time and an event needs four. Nothing more mysterious is meant.'],
  ['Why could planets not orbit a sun in a space of four directions?', 'Gravity would fall off as 1/r³, and with that every orbit either spirals in or flies away', ['There would be no gravity', 'Planets would be too heavy', 'They could: nothing would change'], 'A circle is possible but the slightest nudge ends it. Paul Ehrenfest showed this in 1917. The same goes for electrons round nuclei, so no atoms either.'],
  ['A tesseract can be counted and drawn. Does that show space has a fourth direction?', 'No: it shows the mathematics is consistent. What space has is a question for experiment', ['Yes', 'Yes, but we cannot see it', 'No: tesseracts are impossible'], 'Mathematics can describe spaces of any number of directions. Which one we live in has to be measured, and the inverse-square law says three.'],
  ['Some theories propose extra directions of space, curled up too small to see. What is the evidence?', 'None so far. Gravity has been checked to a twentieth of a millimetre, and colliders have looked: nothing', ['They were found in 2012', 'They are seen in every atom', 'The idea has been disproved'], 'Extra directions would change gravity at short range and show up in collisions. Searches set limits on their size. The idea is neither confirmed nor ruled out.'],
  ['Time is called the fourth dimension. Is it just like the other three?', 'No: it enters the measure of distance with a minus sign, and one can only go forward in it', ['Yes, exactly like them', 'It is not a dimension at all', 'Yes, but slower'], 'Chamber 2: the interval is t² − x². That minus sign is the whole difference between time and space, and is why there are light cones.'],
  ['"The state of two particles lives in a six-dimensional space." What does that mean?', 'Six numbers are needed to give both places. It is a space of possibilities, not a place', ['The particles are in a six-dimensional world', 'There are three hidden directions', 'Each particle is two-dimensional'], 'Mathematicians call any list of independent numbers a space. The amplitudes of chamber 16 live on such a list. That is the general meaning of "dimension", and it should not be confused with a direction you could travel in.'],
];

const EXAMPLES: Record<string, string> = {
  spread: '<p>In a space of <b>4 directions</b>, a force spreads from a point. How much weaker is it at <b>3 times</b> the distance?</p><ol><li>The force spreads over a surface, and in a space of D directions that surface has D − 1.</li><li>So the force goes as 1 over distance to the power D − 1. For D = 4: the power 3.</li><li>3 × 3 × 3 = 27: <b>1/27</b> as strong.</li></ol><p>In our three directions it would be 1/9; in a flat world of two, 1/3.</p>',
  count: '<p>How many corners has a cube in <b>5 directions</b>?</p><ol><li>Each corner is a choice of one end or the other, along each direction.</li><li>Five directions, two choices each: 2 × 2 × 2 × 2 × 2 = <b>32</b>.</li></ol><p>A square has 4, a cube 8, a tesseract 16. Each new direction doubles them: the old shape, a copy of it moved along the new direction, and edges joining the two.</p>',
  scale: '<p>A shape in <b>3 directions</b> is made <b>4 times</b> as big each way. How much more space does it fill?</p><ol><li>Scaling multiplies the content once for each direction.</li><li>4 × 4 × 4 = <b>64 times</b>.</li></ol><p>In two directions (an area) it would be 16; in four, 256. The exponent <i>is</i> the number of directions: that is a power law.</p>',
  needs: '<p>How many numbers does it take to say where <b>two ships</b> are on the sea?</p><ol><li>Each ship needs two: how far north, how far east.</li><li>Two ships: 2 + 2 = <b>4</b>.</li></ol><p>That is all "four dimensions" means in such a case. The sea has not gained any directions.</p>',
  orbit: '<p>Can a planet keep a steady orbit in a space of <b>4 directions</b>?</p><ol><li>Steady orbits need the pull to fall off more slowly than 1 over distance cubed.</li><li>In D directions the pull goes as 1 over distance to the power D − 1. For D = 4 that is exactly the cube.</li><li><b>No.</b> Two and three directions: yes. Four and more: no.</li></ol>',
  idea: '<p>What to hold on to.</p><ol><li>A dimension is a direction: one more number needed.</li><li>A force from a point goes as 1 over distance to the power (directions − 1).</li><li>Steady orbits, and atoms, need three directions or fewer.</li><li>Higher-dimensional shapes are sound mathematics. Extra directions of real space are a proposal with no evidence yet.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'needs',
    level: 1,
    make(rand) {
      const [what, n, why] = pickOne(rand, NEEDS);
      return { ask: 'How many numbers does it take?', show: `<p>To say <b>${what}</b>.</p>`, ...numbers(rand, n, [n + 1, n - 1, n * 2, 3]), why };
    },
  },
  {
    id: 'spread',
    level: 1,
    make(rand) {
      const D = pickOne(rand, [2, 3, 4, 5]);
      const k = pickOne(rand, [2, 3, 10]);
      return { ask: 'How strong is the force there, against what it was?', show: `<p>In a space of D directions, a force that spreads from a point goes as 1 over the distance to the power D − 1.</p><p>Space has <b>${D} directions</b>, and something moves to <b>${k} times</b> the distance.</p>`, ...choices(rand, frac(1, k ** (D - 1)), [frac(1, k ** D), frac(1, k * (D - 1)), frac(1, k ** Math.max(1, D - 2)), frac(1, k * D)]), why: `The power is ${D} − 1 = ${D - 1}. ${Array(D - 1).fill(k).join(' × ')} = ${(k ** (D - 1)).toLocaleString()}.` };
    },
  },
  {
    id: 'count',
    level: 2,
    make(rand) {
      const n = pickOne(rand, [2, 3, 4, 5]);
      const edges = rand() < 0.4;
      const c = cube(n);
      const name = ['', '', 'A square', 'A cube', 'A tesseract (a cube in four directions)', 'A cube in five directions'][n];
      return edges
        ? { ask: 'How many edges has it?', show: `<p>${name} has <b>${c[0]} corners</b>, and at each corner <b>${n} edges</b> meet. Each edge has two ends.</p>`, outside: `<p class="soft">Count edge-ends: corners × edges at each. Every edge was counted twice.</p>`, ...numbers(rand, c[1], [c[0] * n, c[0], c[1] / 2, c[1] + n]), why: `${c[0]} × ${n} = ${c[0] * n} edge-ends, and each edge has two: ${c[1]}.` }
        : { ask: 'How many corners has it?', show: `<p>${name}.</p>`, outside: `<p class="soft">At each corner, each direction is at one end or the other.</p>`, ...numbers(rand, c[0], [n * 2, n * n, c[0] * 2, c[0] / 2]), why: `Two choices in each of ${n} directions: ${Array(n).fill(2).join(' × ')} = ${c[0]}.` };
    },
  },
  {
    id: 'scale',
    level: 2,
    make(rand) {
      const D = pickOne(rand, [2, 3, 4]);
      const k = pickOne(rand, [2, 3, 10]);
      const what = ['', '', 'A flat shape', 'A solid', 'A shape in four directions'][D];
      return { ask: 'How many times as much does it now contain?', show: `<p>${what} is made <b>${k} times</b> as big in every direction.</p>`, ...numbers(rand, k ** D, [k * D, k ** (D - 1), k ** (D + 1), k]), why: `Once for each of its ${D} directions: ${Array(D).fill(k).join(' × ')} = ${(k ** D).toLocaleString()}.` };
    },
  },
  {
    id: 'orbit',
    level: 2,
    make(rand) {
      const D = pickOne(rand, [2, 3, 4, 5, 6]);
      return { ask: 'Could a planet hold a steady orbit round a sun there?', show: `<p>Imagine a space with <b>${D} directions</b>, where gravity spreads from a point as it does here.</p>`, outside: `<p class="soft">The pull goes as 1 over distance to the power ${D - 1}. Steady orbits need a power less than 3.</p>`, options: ['Yes', 'No'], right: D < 4 ? 0 : 1, why: D < 4 ? `The pull goes as 1 over distance${D === 3 ? ' squared' : ''}: gently enough that a nudged orbit swings back.` : `The pull goes as 1 over distance to the power ${D - 1}. A nudge inward meets a pull that grows too fast, and the planet spirals in; a nudge outward, and it is gone.` };
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

let D = 3;
let r = 1;
let furthest = 1;
const seenD = new Set<number>([3]);
let orbitD = 3;
let speed = 1;
let nudged3 = false;
let nudged4 = false;
let flight: Round = round(3, 1, 40);
let made = '';
let turn = 0;
let turned = 0;

function spreading(): string {
  const cx = 150;
  const cy = 130;
  const R = 26 + r * 30;
  let g = DEFS;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    g += `<path d="M${cx} ${cy}L${(cx + 128 * Math.cos(a)).toFixed(1)} ${(cy + 128 * Math.sin(a)).toFixed(1)}" stroke="#e8c24a" stroke-width="1.4" opacity="0.6"/>`;
  }
  g += `<circle cx="${cx}" cy="${cy}" r="${R.toFixed(1)}" fill="none" stroke="#7fb6ff" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="7" fill="#fff"/>`;
  g += `<text x="${cx}" y="266" font-size="11" text-anchor="middle" opacity="0.8">${D === 2 ? 'the blue circle is the whole surface' : D === 3 ? 'the blue circle stands for a sphere' : 'the blue circle stands for the surface of a 4-ball'}</text>`;
  // Strength against distance, for all three.
  const X = (d: number) => 300 + ((d - 0.5) / 3.5) * 140;
  const Y = (f: number) => 230 - Math.min(1.6, f) * 120;
  let graph = `<path d="M${X(0.5)} ${Y(0)}H${X(4)}M${X(0.5)} ${Y(0)}V${Y(1.6)}" stroke="#8d93b8" fill="none"/><text x="${X(2.25)}" y="${Y(0) + 16}" font-size="11" text-anchor="middle" opacity="0.8">distance →</text><text x="${X(0.5) - 8}" y="${Y(0.8)}" font-size="11" text-anchor="middle" opacity="0.8" transform="rotate(-90 ${X(0.5) - 8} ${Y(0.8)})">strength →</text>`;
  for (const d of [2, 3, 4]) {
    let path = '';
    for (let q = 0.62; q <= 4; q += 0.05) path += `${path ? 'L' : 'M'}${X(q).toFixed(1)} ${Y(pull(d, q)).toFixed(1)}`;
    graph += `<path d="${path}" stroke="${d === D ? '#fff' : '#4a5080'}" stroke-width="${d === D ? 2.8 : 1.5}" fill="none"/>`;
  }
  graph += `<circle cx="${X(r)}" cy="${Y(pull(D, r))}" r="6" fill="#ff9ab8"/>`;
  const power = D - 1;
  return `<svg viewBox="0 0 460 274" style="width:100%;max-width:560px;display:block;margin:auto">${g}${graph}</svg><p>Space with <b>${D} directions</b>. At <b>${tidy(Math.round(r * 100) / 100)}</b> times the distance, the same force is spread over a surface <b>${tidy(Math.round(r ** power * 100) / 100)}</b> times as large, and is <b>${tidy(Math.round(pull(D, r) * 1000) / 1000)}</b> as strong.</p>`;
}

function orbiting(): string {
  const key = `${orbitD}|${speed}`;
  if (key !== made) {
    made = key;
    flight = round(orbitD, speed, 60);
  }
  const u = 62;
  const X = (x: number) => 230 + x * u;
  const Y = (y: number) => 150 - y * u;
  let d = '';
  for (const [x, y] of flight.path) if (Math.abs(x) < 3.7 && Math.abs(y) < 2.5) d += `${d ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`;
  let g = DEFS + stars(460, 300, 40, 91) + `<circle cx="${X(0)}" cy="${Y(0)}" r="${u}" fill="none" stroke="#5f6aa8" stroke-dasharray="4 6"/>`;
  g += `<path d="${d}" stroke="#e8c24a" stroke-width="2" fill="none" stroke-linejoin="round" opacity="0.95"/><circle cx="${X(0)}" cy="${Y(0)}" r="9" fill="#ffe9a8" filter="url(#art-glow)"/><circle cx="${X(1)}" cy="${Y(0)}" r="4" fill="#fff"/>`;
  const says = flight.fate === 'holds' ? (Math.abs(speed - 1) < 0.003 ? 'A perfect circle.' : orbitD === 3 ? 'An oval that closes on itself, for ever.' : 'It stays, tracing a rosette that never quite repeats.') : flight.fate === 'falls in' ? '<span class="bad">It spirals into the centre.</span>' : '<span class="bad">It flies off and does not return.</span>';
  return `<svg viewBox="0 0 460 300" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><p>A planet in a space of <b>${orbitD} directions</b>, set going at <b>${tidy(Math.round(speed * 100) / 100)}</b> times the speed that holds a circle. ${says}</p>`;
}

function tesseract(): string {
  // Turn it in the plane of the first and fourth directions, and a little in two others so that nothing hides.
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  const place = (p: number[]): [number, number, number] => {
    let [x, y, z, w] = p;
    [x, w] = [x * c - w * s, x * s + w * c];
    [y, z] = [y * Math.cos(0.5) - z * Math.sin(0.5), y * Math.sin(0.5) + z * Math.cos(0.5)];
    [x, z] = [x * Math.cos(0.6) - z * Math.sin(0.6), x * Math.sin(0.6) + z * Math.cos(0.6)];
    // Seen from a little way off in the fourth direction, and then in the third: nearer parts look bigger.
    const k4 = 2.6 / (3.4 - w);
    const k3 = 5 / (6.5 - z * k4);
    return [230 + x * k4 * k3 * 78, 150 - y * k4 * k3 * 78, w];
  };
  const at = CORNERS.map(place);
  let g = '';
  for (const [i, j] of EDGES) {
    const along = [0, 1, 2, 3].find((b) => CORNERS[i][b] !== CORNERS[j][b]);
    const depth = (at[i][2] + at[j][2]) / 2;
    g += `<line x1="${at[i][0].toFixed(1)}" y1="${at[i][1].toFixed(1)}" x2="${at[j][0].toFixed(1)}" y2="${at[j][1].toFixed(1)}" stroke="${along === 3 ? '#ff9ab8' : '#b9c4ff'}" stroke-width="${(1.4 + (depth + 1.5) * 0.6).toFixed(1)}" opacity="${(0.45 + (depth + 1.5) * 0.17).toFixed(2)}" stroke-linecap="round"/>`;
  }
  for (const p of at) g += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${(2.5 + (p[2] + 1.5) * 0.8).toFixed(1)}" fill="#fff"/>`;
  const table = [1, 2, 3, 4].map((n) => `<tr><td>${['a line', 'a square', 'a cube', 'a tesseract'][n - 1]}</td><td>${n}</td>${[0, 1, 2, 3].map((k) => `<td>${cube(n)[k] ?? ''}</td>`).join('')}</tr>`).join('');
  return `<svg viewBox="0 0 460 300" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><table class="tally" style="margin:8px auto;font-size:15px"><tr><th></th><th>directions</th><th>corners</th><th>edges</th><th>squares</th><th>cubes</th></tr>${table}</table><p class="soft">This is the shadow of the shadow: four directions flattened to three, and three to the page. The pink edges are the ones that run in the fourth direction.</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The number of independent directions in a space is its <b>dimension</b>. Equally: how many numbers, or <b>coordinates</b>, it takes to say where something is.</li>
      <li>The cube in four directions is a <b>tesseract</b>, or 4-cube; in any number, a <b>hypercube</b>.</li>
      <li>The idea that space has further directions curled up too small to see is <b>compactification</b>; its first form was <b>Kaluza–Klein theory</b> (1921, 1926).</li>
      <li>Any list of independent quantities can be treated as a space, with a dimension for each. The space of all the arrangements a system could have is its <b>configuration space</b>.</li>
    </ul>
    <p><b>What is established.</b> Space has three directions that anything can be seen to move in, and with time, events need four numbers. Gravity and electricity obey the inverse-square law, which is what three directions give; gravity has been checked down to about a twentieth of a millimetre and up to the size of the solar system. That steady orbits and atoms are possible only in three directions or fewer was shown by Paul Ehrenfest in 1917.</p>
    <p><b>What is proposed and not found.</b> String theory requires nine directions of space, with six curled up small; other proposals have one or two larger ones. These would alter gravity at short range and leave marks in particle collisions. Experiments have looked, in laboratories and at the Large Hadron Collider, and so far found nothing, which limits how large any extra direction can be. The proposals are neither confirmed nor ruled out.</p>
    <p><b>What a dimension is not.</b> It is not another world, nor a higher level that things ascend to, nor a stack of realms each emerging from the one below. It is a direction. The looser use of the word, as in "the six-dimensional space of two particles' positions", means only that six numbers are needed; nothing six-dimensional is in the room.</p>
    <p class="soft">There is one serious idea in physics that a direction of space might not be fundamental, and it is the subject of the last chamber. It is a precise mathematical claim about black holes and information, and it is unproven for our universe.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Power laws.</b> A rule of the form y = x<sup>n</sup>. Chamber 11 met one with an awkward exponent; here the exponent has a plain meaning: it counts directions.</p>
      <p><b>Scaling.</b> Make a shape k times as big each way. A length becomes k times as long; an area, k²; a volume, k³; the content of a shape in D directions, k<sup>D</sup>.</p>
      <p><b>Spreading.</b> A force from a point crosses every surface that surrounds it in the same total amount. In a space of D directions that surface has D − 1 of them, so it grows as r<sup>D−1</sup>, and the force thins as</p>
      <div class="eq">F ∝ 1 / r<sup>D−1</sup></div>
      <p>For D = 3 this is the inverse-square law, which is therefore not an extra fact about gravity but a count of directions.</p>
      <p><b>Why orbits fail in four.</b> A planet is kept out by its sideways motion, an effect that grows as 1/r³ as it comes closer, and pulled in by gravity. In three directions gravity grows only as 1/r², so close in the outward effect wins and the planet is turned back: the orbit is stable. In four directions gravity also goes as 1/r³. The two are matched at every distance, and nothing restores a nudged orbit.</p>
      <p><b>Counting a cube.</b> To go up a direction, take the shape, slide a copy of it along the new direction, and join each corner to its copy. So corners double: 2<sup>n</sup>. Edges: twice the old ones plus one for each old corner. For a tesseract: twice a cube's 12 edges, plus one for each of its 8 corners: 12 + 12 + 8 = 32.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: Edwin Abbott, <i>Flatland</i> (1884). A square's account of meeting a third direction. Short, out of copyright, and still the best way in.</li>
      <li>See: <a href="https://www.math.brown.edu/tbanchof/Beyond3d/" target="_blank" rel="noopener">Thomas Banchoff, Beyond the Third Dimension</a> (Brown University). Pictures and text from the mathematician who first filmed a turning tesseract.</li>
      <li>Read: <a href="https://www.einstein-online.info/en/spotlight/extra_dimensions/" target="_blank" rel="noopener">Einstein Online, Hunting for extra dimensions</a>. What is proposed and how it is searched for, from the Max Planck Institute.</li>
      <li>Read: <a href="https://arxiv.org/abs/2605.18212" target="_blank" rel="noopener">Murata, Fujiie and Suzuki, "Short-range tests of the gravitational inverse-square law" (2026)</a>. A review from Rikkyo University in Tokyo of every experimental limit. Technical.</li>
      <li>Read: <a href="https://openstax.org/books/university-physics-volume-1/pages/13-introduction" target="_blank" rel="noopener">OpenStax University Physics, volume 1, chapter 13</a>, for the orbit argument in three directions.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · what a dimension does', 'Count the directions', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'dimensions',
    kicker: 'The edges · 18',
    title: 'What a dimension does',
    steps: [
      { say: 'A dimension is a direction: one more number needed to say where something is. Space has three. This chamber asks what difference the number makes. ¶ Something at the centre sends out a force, evenly, in every direction there is. The gold lines carry it; the blue surface catches all of it. <b>Move the surface out to twice the distance.</b>', until: () => furthest >= 2 },
      { say: 'The same force, spread over a sphere twice as wide.', ask: ['In our space of three directions, how strong is the force at twice the distance?', ['Half', 'A quarter', 'An eighth'], 1, 'A sphere twice as wide has four times the surface. This is the inverse-square law of chambers 6 and 12, and now it can be seen for what it is: a count of directions.'] },
      { say: '<b>Try a flat world of two directions, and then a space of four.</b>', until: () => seenD.has(2) && seenD.has(4) },
      { say: 'In two directions the surface is only a circle, and the force thins slowly. In four it thins fast.', ask: ['In a space of four directions, how strong is the force at twice the distance?', ['A quarter', 'An eighth', 'A sixteenth'], 1, 'The surface there has three directions of its own, so it grows as the cube: 2 × 2 × 2. The rule is 1 over distance to the power (directions − 1).'] },
      { say: 'Does that matter? Below is a planet circling a sun, in our three directions, at exactly the speed that holds a circle. <b>Nudge its speed a little, either way.</b>', until: () => nudged3 },
      { say: 'The circle becomes an oval, and the oval holds. Nudge it again and it is a different oval. Our solar system has survived four and a half billion years of nudges.', ask: ['Before you try it: the same planet in a space of four directions, nudged the same way. What happens?', ['A slightly different oval', 'It spirals into the sun, or flies away for good', 'Nothing changes'], 1, '<b>Switch to four directions and nudge it.</b>'] },
      { say: '<b>Switch to four directions, and nudge the speed either way.</b>', until: () => nudged4 },
      { say: 'A hair too slow, and it spirals in. A hair too fast, and it leaves.', ask: ['So what would a universe with four directions of space be like?', ['Much like ours', 'No lasting orbits: no planets round suns, and no electrons round nuclei', 'Twice as bright'], 1, 'Electricity spreads the same way gravity does, so atoms would fail for the same reason. That there are planets and atoms at all is a measurement of how many directions space has. It says three.'] },
      { say: 'Mathematics is not so limited. A square is a line slid sideways; a cube is a square slid upward. Slide a cube in a fourth direction and you have a <b>tesseract</b>. It cannot be built here, but its shadow can be drawn. <b>Turn it, at least a quarter of the way round.</b>', until: () => turned >= Math.PI / 2 },
      { say: 'What looks like one cube swallowing another is two equal cubes, one further off in the fourth direction, changing places.', ask: ['A square has 4 corners and a cube has 8. How many has a tesseract?', ['12', '16', '32'], 1, 'Each new direction doubles them. The table underneath counts the rest. All of this is exact and certain. But it is mathematics, and says nothing about whether space has such a direction.'] },
      { say: 'Some theories of physics do propose more directions of space, curled up too small to notice.', ask: ['What is the evidence for them?', ['They were confirmed at the Large Hadron Collider', 'None so far: gravity keeps to the inverse square down to a twentieth of a millimetre, and colliders have found nothing', 'They have been ruled out'], 1, 'An extra direction would change how gravity spreads at short range, as the first figure showed. So far every test finds three. The idea is alive, untested at smaller sizes, and unconfirmed.'] },
    ],
    summary: '<b>A dimension is a direction, and the number of them can be measured.</b> It fixes how forces thin with distance, and that fixes whether orbits and atoms can last: in three, yes; in four, no. Shapes in more directions are sound mathematics. More directions of real space are a proposal, searched for and not found.',
    frame: () =>
      `<div id="spreading"></div><div class="bar"><span class="soft">close</span><input id="reach" type="range" min="0.7" max="3.5" step="0.01" value="1" style="flex:1"><span class="soft">far</span></div><div class="bar">${[2, 3, 4].map((d) => `<button class="chip pale" data-do="space" data-v="${d}">${d} directions</button>`).join('')}</div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">An orbit</div><div id="orbiting"></div><div class="bar"><span class="soft">slower</span><input id="speed" type="range" min="0.8" max="1.2" step="0.005" value="1" style="flex:1"><span class="soft">faster</span></div><div class="bar">${[2, 3, 4].map((d) => `<button class="chip pale" data-do="orbit" data-v="${d}">${d} directions</button>`).join('')}<button class="chip pale" data-do="circle" data-v="1">back to the circle</button></div></div>` +
      `<div id="part3" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A cube in four directions</div><div id="tesseract"></div><div class="bar"><span class="soft">turn it in the fourth direction</span><input id="turn" type="range" min="0" max="6.283" step="0.01" value="0" style="flex:1"></div></div>`,
    paint: () => {
      $('spreading').innerHTML = spreading();
      $('orbiting').innerHTML = orbiting();
      $('tesseract').innerHTML = tesseract();
      run?.mark('space', (k) => Number(k) === D);
      run?.mark('orbit', (k) => Number(k) === orbitD);
      const at = run?.step() ?? 0;
      ($('part2') as HTMLElement).hidden = at < 4;
      ($('part3') as HTMLElement).hidden = at < 8;
    },
    slide: (id, value) => {
      if (id === 'reach') {
        r = value;
        furthest = Math.max(furthest, r);
      } else if (id === 'speed') {
        speed = value;
        if (Math.abs(speed - 1) >= 0.02) {
          if (orbitD === 3) nudged3 = true;
          if (orbitD === 4) nudged4 = true;
        }
      } else {
        turned = Math.max(turned, value);
        turn = value;
      }
    },
    act: (what, value) => {
      if (what === 'space') {
        D = Number(value);
        seenD.add(D);
      } else if (what === 'orbit') {
        orbitD = Number(value);
        if (Math.abs(speed - 1) >= 0.02 && orbitD === 4) nudged4 = true;
      } else if (what === 'circle') {
        speed = 1;
        ($('speed') as HTMLInputElement).value = '1';
      }
    },
    key: () => [['#e8c24a', 'the force; the planet\'s path'], ['#7fb6ff', 'the surface that catches it'], ['#ff9ab8', 'edges along the fourth direction']],
    drawer,
    next: ['information', 'On to information and black holes'],
  });
  sh.draw();
}
expose(
  () => [...checkKinds(KINDS), ...checkEdges(), ...(cube(4)[0] === 16 && cube(4)[1] === 32 && Math.abs(pull(4, 2) - 1 / 8) < 1e-12 && round(4, 0.97, 60).fate === 'falls in' && round(4, 1.03, 60).fate === 'flies off' && round(3, 1.1, 60).fate === 'holds' && round(2, 0.85, 60).fate === 'holds' ? [] : ['the chamber\'s own figures'])],
  () => ({ D, r, orbitD, speed, fate: flight.fate, turn, done: sh.kept.chapter }),
);
