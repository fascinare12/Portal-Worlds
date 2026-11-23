import { Shell, checkKinds, choices, numbers, pickOne, runPractice, shuffled } from '../canon/shell';
import type { Kind } from '../canon/shell';
import { answered, paras, question, saidBox, stepLine } from './chamber';
import './cosmos.css';
import { PACES, along, beta, checkPhysics, doppler, frac, rate, tidy } from './physics';

/**
 * The twins: one stays at home, one travels out and back, and at the reunion
 * the traveller is younger.
 *
 * The budget chamber left a puzzle: each twin measures the other's clock
 * running slow, so how can either end up younger? The answer is on the
 * diagram. Time runs up the page and distance across it; each twin's life is
 * a line. The stay-at-home's line is straight. The traveller's has a corner.
 * A clock records the "length" of its own line, and in spacetime the straight
 * line between two events is the longest one, not the shortest.
 *
 * Two further layers show the same answer in other ways: the flashes each
 * twin actually receives from the other, and what the traveller reckons is
 * happening at home "now", which swings forward at the corner.
 */

const sh = new Shell('portal-worlds-cosmos-twins-v1');

// ---- Drawing a diagram ----

const INK = ['#e8c24a', '#7fb6ff', '#ff9ab8'];
/** A small picture of some paths from one event to another: time up, distance across. */
function picture(paths: [number, number][][], T: number, width = 240, height = 260): string {
  const reach = Math.max(1.5, ...paths.flat().map((p) => Math.abs(p[1])));
  const X = (x: number) => width / 2 + (x / reach) * (width / 2 - 26);
  const Y = (t: number) => height - 18 - (t / T) * (height - 36);
  const lines = paths.map((path, i) => `<polyline points="${path.map(([t, x]) => `${X(x)},${Y(t)}`).join(' ')}" fill="none" stroke="${INK[i]}" stroke-width="3.5" stroke-linejoin="round"/>`).join('');
  // Light would travel along the dotted lines: nothing may lean further than they do.
  const light = `<path d="M${X(0)} ${Y(0)}L${X(reach)} ${Y(reach)}M${X(0)} ${Y(0)}L${X(-reach)} ${Y(reach)}" stroke="#4a5080" stroke-dasharray="3 5" fill="none"/>`;
  return `<svg viewBox="0 0 ${width} ${height}" style="width:100%;max-width:${width + 40}px;display:block;margin:auto">${light}${lines}<circle cx="${X(0)}" cy="${Y(0)}" r="5" fill="#fff"/><circle cx="${X(0)}" cy="${Y(T)}" r="5" fill="#fff"/><text x="${X(0) + 9}" y="${Y(0) + 4}" font-size="11">parting</text><text x="${X(0) + 9}" y="${Y(T) + 4}" font-size="11">reunion</text><text x="8" y="${height / 2}" font-size="11" transform="rotate(-90 8 ${height / 2})" text-anchor="middle">time →</text></svg>`;
}
const NAMES = ['gold', 'blue', 'pink'];

// ---- Practice ----

/** One question of each kind, worked through: shown until she has got one of that kind right. */
const EXAMPLES: Record<string, string> = {
  ages: "<p>A twin flies out <b>12 light-years</b> and straight back at <b>12/13</b> of the speed of light. How much does each age?</p><ol><li>Time at home = distance ÷ speed. The round trip is 24 light-years: 24 ÷ 12/13 = 24 × 13/12 = <b>26 years</b>.</li><li>The traveller's clock rate at 12/13 is 5/13 (the 5-12-13 triangle).</li><li>Traveller's time = 26 × 5/13 = <b>10 years</b>.</li></ol><p>The traveller comes home 16 years the younger.</p>",
  path: "<p>No arithmetic is needed: compare the shapes.</p><ol><li>A line straight up the page holds the most time. It is the longest path there is between the two events.</li><li>Every bend away from straight costs time, and a stretch that leans over toward the dotted light-lines counts for very little.</li><li>So for \"most\", pick the straightest line. For \"least\", pick the one that spends longest leaning hardest.</li></ol><p>If you want a number for one straight stretch: √(time² − distance²). Five years while covering 3 light-years records √(25 − 9) = 4 years.</p>",
  flashes: "<p>A twin flies out <b>12 light-years</b> at <b>4/5</b> of the speed of light and straight back. Home sends a flash every year. How many reach the traveller on each leg?</p><ol><li>Each leg takes 12 ÷ 4/5 = 15 years at home, and 15 × 3/5 = 9 years on board.</li><li>The stretch factor at 4/5 is √((1 + 4/5) ÷ (1 − 4/5)) = √9 = 3.</li><li>Outward, flashes arrive 3 times less often: 9 ÷ 3 = <b>3 flashes</b>.</li><li>Homeward, 3 times more often: 9 × 3 = <b>27 flashes</b>.</li></ol><p>Check: 3 + 27 = 30, which is the 30 years that passed at home.</p>",
  now: "<p>A twin leaves in year 0 and flies out <b>6 light-years</b> at <b>0.6</b> of the speed of light, then turns round.</p><ol><li>The turn happens in home's year 6 ÷ 0.6 = 10.</li><li>The traveller's \"now\" at home is out of step by speed × distance = 0.6 × 6 = 3.6 years.</li><li>Just before turning (moving away), home's \"now\" is behind: 10 − 3.6 = <b>year 6.4</b>.</li><li>Just after turning (moving toward), it is ahead: 10 + 3.6 = <b>year 13.6</b>.</li><li>The jump is twice the shift: <b>7.2 years</b>.</li></ol>",
};

const KINDS: Kind[] = [
  {
    id: 'ages',
    level: 1,
    make(rand) {
      const p = pickOne(rand, PACES);
      const k = 1 + Math.floor(rand() * 2);
      const L = p.a * k;
      const T = 2 * p.c * k;
      const aboard = 2 * p.b * k;
      const which = rand() < 0.5;
      return which
        ? { ask: 'How much has the traveller aged at the reunion?', show: `<p>A twin flies out <b>${L} light-years</b> and straight back, at <b>${frac(p.a, p.c)}</b> of the speed of light throughout.</p>`, outside: `<p class="soft">First: how long does the round trip take by clocks at home? Then the budget gives the rest.</p>`, ...numbers(rand, aboard, [T, 2 * p.a * k, T - aboard]), why: `At home, ${2 * L} light-years at ${frac(p.a, p.c)} takes ${T} years. The traveller's clock runs at ${frac(p.b, p.c)}: ${aboard} years.` }
        : { ask: 'By how many years is the traveller the younger at the reunion?', show: `<p>A twin flies out <b>${L} light-years</b> and straight back, at <b>${frac(p.a, p.c)}</b> of the speed of light throughout.</p>`, ...numbers(rand, T - aboard, [aboard, T, 2 * p.a * k]), why: `Home ages ${T} years; the traveller ${aboard}. The difference is ${T - aboard}.` };
    },
  },
  {
    id: 'path',
    level: 2,
    make(rand) {
      for (;;) {
        const T = 10;
        const straight = rand() < 0.4;
        const corner = (): [number, number][] => {
          const t1 = 3 + rand() * 4;
          const x1 = (rand() < 0.5 ? -1 : 1) * (0.8 + rand() * 0.75 * Math.min(t1, T - t1) * 0.9);
          return [[0, 0], [t1, x1], [T, 0]];
        };
        const zigzag = (): [number, number][] => {
          const s = rand() < 0.5 ? -1 : 1;
          const x = 0.6 + rand() * 1.6;
          return [[0, 0], [2.5, s * x], [5, -s * x * rand()], [7.5, s * x * 0.8], [T, 0]];
        };
        const paths = shuffled(rand, [straight ? ([[0, 0], [T, 0]] as [number, number][]) : corner(), corner(), zigzag()]);
        // Nothing may outrun light, and the three must differ enough to tell apart by reasoning.
        if (paths.some((p) => p.slice(1).some((q, i) => Math.abs((q[1] - p[i][1]) / (q[0] - p[i][0])) > 0.92))) continue;
        const times = paths.map(along);
        const sorted = [...times].sort((a, b) => a - b);
        if (sorted[1] - sorted[0] < 0.5 || sorted[2] - sorted[1] < 0.5) continue;
        const most = rand() < 0.5;
        const right = times.indexOf(most ? sorted[2] : sorted[0]);
        return { ask: most ? 'Three people part and meet again. Who has aged the most?' : 'Three people part and meet again. Who has aged the least?', show: picture(paths, T), outside: `<p class="soft">Each clock records the length of its own line; and here, the more a line wanders from straight, the <i>less</i> it records. A stretch that leans close to the dotted light-lines counts for almost nothing.</p>`, options: NAMES.map((n) => `The ${n} one`), right, why: `Their clocks read ${times.map((t, i) => `${NAMES[i]} ${tidy(t)}`).join(', ')} years, out of 10 for a straight line. The straightest path is the longest.` };
      }
    },
  },
  {
    id: 'flashes',
    level: 3,
    make(rand) {
      // Speeds for which the flashes arrive in a whole-number ratio.
      const p = pickOne(rand, PACES.filter((q) => Number.isInteger(1 / doppler(beta(q)))));
      const slow = 1 / doppler(beta(p)); // flashes arrive this many times slower on the way out
      const k = 1;
      const L = p.a * slow * k;
      const legAboard = (L / beta(p)) * rate(beta(p)); // the traveller's years on each leg
      const out = Math.round(legAboard / slow);
      const back = Math.round(legAboard * slow);
      const outward = rand() < 0.5;
      return { ask: outward ? 'How many of home\'s flashes reach the traveller during the outward leg?' : 'How many of home\'s flashes reach the traveller during the leg home?', show: `<p>A twin flies out <b>${L} light-years</b> at <b>${frac(p.a, p.c)}</b> of the speed of light, and straight back. Each leg takes <b>${tidy(legAboard)} years</b> by the traveller's clock. The twin at home sends a flash of light every birthday.</p>`, outside: `<p class="soft">Moving apart at ${frac(p.a, p.c)}, flashes arrive ${slow} times less often than they are sent. Coming together, ${slow} times more often.</p>`, ...numbers(rand, outward ? out : back, [outward ? back : out, Math.round(legAboard), Math.round(L / beta(p))]), why: `Out: ${tidy(legAboard)} years ÷ ${slow} = ${out} flashes. Back: ${tidy(legAboard)} × ${slow} = ${back}. Together ${out + back}: exactly the ${tidy((2 * L) / beta(p))} years that passed at home.` };
    },
  },
  {
    id: 'now',
    level: 3,
    make(rand) {
      const p = pickOne(rand, [PACES[0], PACES[1]]);
      const v = beta(p);
      const L = p.a === 3 ? pickOne(rand, [3, 6]) : pickOne(rand, [4, 8]);
      const half = L / v;
      const before = half - v * L;
      const after = half + v * L;
      const which = Math.floor(rand() * 3);
      const ask = ['Just before turning, what year does the traveller reckon it is at home "right now"?', 'Just after turning, what year does the traveller reckon it is at home "right now"?', 'How many years at home does the traveller\'s reckoning jump over at the turn?'][which];
      const right = [before, after, after - before][which];
      return { ask, show: `<p>A twin leaves in year 0, flies out <b>${L} light-years</b> at <b>${tidy(v)}</b> of the speed of light, and turns straight round. The turn happens in home's year <b>${tidy(half)}</b>.</p>`, outside: `<p class="soft">For someone moving at speed v, "at the same time" tilts: a place a distance L away is reckoned to be v × L years out of step.</p>`, ...choices(rand, `${tidy(right)}`, [before, after, after - before, half, half * rate(v)].filter((x) => Math.abs(x - right) > 0.01).map(tidy)), why: `Out of step by ${tidy(v)} × ${L} = ${tidy(v * L)} years. Before the turn: ${tidy(half)} − ${tidy(v * L)} = ${tidy(before)}. After: ${tidy(half)} + ${tidy(v * L)} = ${tidy(after)}. Nothing happens at home; the traveller has changed which moments count as "now".` };
    },
  },
];

// ---- The chamber ----

const TRIPS = [
  { name: 'Trip A', v: 0.6, L: 3 },
  { name: 'Trip B', v: 0.8, L: 4 },
];
let trip = 0;
const layer = { birthdays: false, home: false, ship: false, now: false };
let step = 0;
let said = '';

const STEPS: { say: string; ask?: [string, string[], number, string]; until?: () => boolean; show?: (keyof typeof layer)[] }[] = [
  { say: 'Time runs up the page and distance runs across, so a line is a whole life. ¶ The <b>gold</b> line is the twin who stays at home: ten years, going nowhere. The <b>blue</b> line is the twin who flies 3 light-years out at 0.6 of the speed of light, and straight back.', ask: ['Ten years pass at home. From the budget: how much does the traveller age?', ['6 years', '8 years', '10 years'], 1, 'At 0.6 the clock runs at 0.8. Ten years at home, eight on board. The dots are birthdays: count them on each line.'], show: ['birthdays'] },
  { say: 'Eight dots against ten. But remember the puzzle: on the way out, each twin measures the <i>other\'s</i> clock running slow. The same on the way back.', ask: ['Both see the other\'s clock slow, yet only one comes home younger. What is different about the two of them?', ['Speed really does slow a clock, and only the traveller was really moving', 'The traveller\'s line has a corner in it; the stay-at-home\'s is straight', 'The engines\' force squeezed the traveller\'s clock'], 1, 'Neither is "really" moving, and force does nothing to a good clock. The two lines are different shapes: one straight, one bent. Each clock records the length of its own line.'] },
  { say: 'You need not take that on trust. Each twin sends out a flash of light on every birthday, and light climbs the page at 45°. ¶ <b>Turn on "flashes from home"</b> and follow them to the blue line.', until: () => layer.home },
  { say: 'On the way out the traveller is running from the flashes, and they arrive rarely. On the way back the traveller runs into them.', ask: ['The outward leg takes 4 years on board. How many of home\'s flashes arrive during it?', ['2', '4', '5'], 0, 'Two on the way out, and eight on the way back: ten in all. The traveller watches ten years go by at home while living through eight. Now turn on "flashes from the ship": home receives four in the first eight years, and four more in the last two. Eight. Both twins agree on everything they actually see.'], show: ['ship'] },
  { say: 'One layer more. <b>Turn on "the traveller\'s now".</b> Each grey line joins events the traveller reckons happen at the same moment.', until: () => layer.now },
  { say: 'Moving, the traveller\'s idea of "at the same time" is tilted. Outbound it tilts one way, homebound the other. At the corner it swings.', ask: ['Just before the turn the traveller reckons it is year 3.2 at home. Just after, year 6.8. What happened at home in between?', ['Home lived through 3.6 years in an instant', 'Nothing. The traveller changed which moments count as "now"', 'Time at home ran backwards'], 1, 'Nothing happens to the twin at home. "Now, far away" is bookkeeping, and the traveller swapped one set of books for another. This is the relativity of simultaneity, and it is where the missing years are.'] },
  { say: '<b>Switch to Trip B:</b> 4 light-years at 0.8. The home line is the same ten years.', until: () => trip === 1 },
  { say: 'A sharper corner.', ask: ['How much does this traveller age?', ['4 years', '6 years', '8 years'], 1, 'At 0.8 the clock runs at 0.6: six years. The further the line bends from straight, the less time it holds.'] },
];

function diagram(): string {
  const { v, L } = TRIPS[trip];
  const T = (2 * L) / v;
  const W = 420;
  const H = 520;
  const X = (x: number) => 70 + (x / 5) * (W - 110);
  const Y = (t: number) => H - 30 - (t / T) * (H - 60);
  const shipAt = (t: number) => (t <= T / 2 ? v * t : L - v * (t - T / 2));
  let s = '';
  // What the traveller calls "now": lines tilted by the traveller's speed.
  if (layer.now) {
    for (let tau = 1; tau < T * rate(v) - 0.01; tau++) {
      const out = tau <= (T / 2) * rate(v) + 1e-9;
      const t = tau / rate(v);
      const x = shipAt(t);
      const home = out ? t - v * x : t + v * x;
      s += `<line x1="${X(0)}" y1="${Y(home)}" x2="${X(x)}" y2="${Y(t)}" stroke="#7d83a8" stroke-width="1.2" opacity="0.8"/>`;
    }
    const before = T / 2 - v * L;
    const after = T / 2 + v * L;
    s += `<line x1="${X(0) - 9}" y1="${Y(before)}" x2="${X(0) - 9}" y2="${Y(after)}" stroke="#ff9ab8" stroke-width="5"/><text x="${X(0) - 16}" y="${Y(T / 2) + 4}" font-size="12" text-anchor="end" fill="#ff9ab8">${tidy(after - before)} years</text><text x="${X(0) - 16}" y="${Y(T / 2) + 19}" font-size="12" text-anchor="end" fill="#ff9ab8">jumped</text>`;
  }
  // Flashes: one from each twin on each birthday, climbing at 45 degrees.
  if (layer.home) {
    for (let sent = 1; sent < T - 0.01; sent++) {
      const meet = sent / (1 - v) <= T / 2 ? sent / (1 - v) : (sent + L + v * (T / 2)) / (1 + v);
      s += `<line x1="${X(0)}" y1="${Y(sent)}" x2="${X(shipAt(meet))}" y2="${Y(meet)}" stroke="#e8c24a" stroke-width="1.3" stroke-dasharray="5 4"/>`;
    }
  }
  if (layer.ship) {
    for (let tau = 1; tau < T * rate(v) - 0.01; tau++) {
      const t = tau / rate(v);
      const x = shipAt(t);
      s += `<line x1="${X(x)}" y1="${Y(t)}" x2="${X(0)}" y2="${Y(t + x)}" stroke="#7fb6ff" stroke-width="1.3" stroke-dasharray="5 4"/>`;
    }
  }
  s += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(T)}" stroke="#e8c24a" stroke-width="4"/><polyline points="${X(0)},${Y(0)} ${X(L)},${Y(T / 2)} ${X(0)},${Y(T)}" fill="none" stroke="#7fb6ff" stroke-width="4" stroke-linejoin="round"/>`;
  if (layer.birthdays) {
    for (let t = 1; t < T - 0.01; t++) s += `<circle cx="${X(0)}" cy="${Y(t)}" r="5" fill="#0b0e22" stroke="#e8c24a" stroke-width="2.5"/>`;
    for (let tau = 1; tau < T * rate(v) - 0.01; tau++) s += `<circle cx="${X(shipAt(tau / rate(v)))}" cy="${Y(tau / rate(v))}" r="5" fill="#0b0e22" stroke="#7fb6ff" stroke-width="2.5"/>`;
  }
  for (let t = 0; t <= T; t += 2) s += `<text x="${X(0) - 44}" y="${Y(t) + 4}" font-size="11" text-anchor="end" opacity="0.6">${t}</text>`;
  for (let x = 1; x <= 4; x++) s += `<text x="${X(x)}" y="${H - 8}" font-size="11" text-anchor="middle" opacity="0.6">${x}</text>`;
  s += `<text x="${X(2.5)}" y="${H + 8}" font-size="12" text-anchor="middle" opacity="0.7">distance, light-years</text><text x="-40" y="${H / 2}" font-size="12" text-anchor="middle" opacity="0.7" transform="rotate(-90 -40 ${H / 2})">time at home, years</text>`;
  s += `<text x="${X(0) + 8}" y="${Y(T) - 8}" font-size="13" fill="#e8c24a">home: ${tidy(T)} years</text><text x="${X(L) + 10}" y="${Y(T / 2) + 4}" font-size="13" fill="#7fb6ff">traveller: ${tidy(T * rate(v))} years</text>`;
  return `<svg viewBox="-56 -8 ${W + 56} ${H + 24}" style="width:100%;max-width:520px;display:block;margin:auto">${s}</svg>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>A point on the diagram, a place at a time, is an <b>event</b>. The line of a whole life is a <b>worldline</b>.</li>
      <li>The time a clock records along its worldline is its <b>proper time</b>. Between two events, the straight worldline has the most of it. This was shown by Max von Laue in 1911, and is sometimes called the principle of maximal aging.</li>
      <li>That two observers in relative motion disagree about which distant events are "at the same time" is the <b>relativity of simultaneity</b>.</li>
      <li>Flashes arriving less often from something receding, and more often from something approaching, is the <b>Doppler effect</b>. For light at speed v it is a factor of √((1 − v)/(1 + v)): one half at 0.6, one third at 0.8.</li>
    </ul>
    <p>It is called the twin <i>paradox</i>, but nothing in it contradicts anything. The mistake is to treat the two twins as interchangeable. They are not: one line is straight and the other is not.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p>With time in years and distance in light-years, a clock carried in a straight line from one event to another, t years later and x light-years away, records</p>
      <div class="eq">τ = √(t² − x²)</div>
      <p>This is Pythagoras with a minus sign, and the minus sign is the whole of relativity. Trip A, each leg: √(5² − 3²) = √16 = 4 years; two legs, 8.</p>
      <p><b>A first integral.</b> A worldline need not be made of straight stretches. Cut any path into pieces so short that each is as good as straight, work out √(dt² − dx²) for each, and add them all up. Adding up endlessly many endlessly small pieces is what an integral is, and the sign for it is a stretched S, for "sum":</p>
      <div class="eq">τ = ∫ √(1 − v²) dt</div>
      <p>Read it as: "at each moment, take the clock rate at that moment's speed, and add up over the journey."</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://www.einstein-online.info/en/spotlight/twins/" target="_blank" rel="noopener">Einstein Online, The case of the travelling twins</a>. A short, careful account from the Max Planck Institute for Gravitational Physics.</li>
      <li>Read: <a href="https://www.eftaylor.com/spacetimephysics/" target="_blank" rel="noopener">Taylor and Wheeler, <i>Spacetime Physics</i></a>. The chapters on the interval and on a round trip to a star.</li>
      <li>Watch: <a href="https://theoreticalminimum.com/courses/special-relativity-and-electrodynamics/2012/spring" target="_blank" rel="noopener">Leonard Susskind, Special Relativity (Stanford, The Theoretical Minimum)</a>. Full lectures, for when you want the algebra.</li>
      <li>Course: <a href="https://ocw.mit.edu/courses/8-20-introduction-to-special-relativity-january-iap-2021/" target="_blank" rel="noopener">MIT OpenCourseWare 8.20</a>. Its problem sets include this one.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · the twins', 'Whose clock holds more?', 'Time in years, distance in light-years, speeds as fractions of the speed of light.', KINDS, EXAMPLES);
} else {
  sh.render = () => {
    const s = STEPS[Math.min(step, STEPS.length - 1)];
    const done = step >= STEPS.length;
    const toggles = (
      [
        ['birthdays', 'birthdays'],
        ['home', 'flashes from home'],
        ['ship', 'flashes from the ship'],
        ['now', 'the traveller\'s now'],
      ] as [keyof typeof layer, string][]
    )
      .map(([k, name]) => `<button class="chip${layer[k] ? ' gold' : ' pale'}" data-do="layer" data-v="${k}">${name}</button>`)
      .join('');
    sh.page.innerHTML =
      `<div class="kicker">Spacetime · 2</div><h1>The twins</h1>` +
      `<div class="card">${stepLine(step, STEPS.length)}${saidBox(said)}` +
      (done
        ? `<p><b>A clock measures the length of its own path through spacetime, and the straight path is the longest.</b> Every puzzle about who ages how much comes down to drawing the lines and measuring them.</p>`
        : `${paras(s.say)}${s.ask ? question(s.ask) : ''}`) +
      `</div><div class="card">${diagram()}<div class="bar">${TRIPS.map((t, i) => `<button class="chip${trip === i ? ' gold' : ' pale'}" data-do="trip" data-v="${i}">${t.name}: ${t.L} light-years at ${t.v}</button>`).join('')}</div><div class="bar">${toggles}</div><div class="key"><span><i style="background:#e8c24a"></i>home, and its flashes</span><span><i style="background:#7fb6ff"></i>the traveller, and theirs</span><span><i style="background:#7d83a8"></i>the traveller's "now"</span><span><i style="background:#ff9ab8"></i>years of home jumped at the turn</span></div></div>` +
      (done ? `${drawer()}<div class="bar"><a class="chip gold" href="./twins.html?practice">Practise ▶</a><a class="chip" href="./cones.html">On to light cones ▶</a><a class="chip pale" href="./index.html">Back to the map</a></div>` : '');
  };
  const advance = () => {
    const s = STEPS[step];
    if (s && !s.ask && s.until?.()) {
      step++;
      said = '';
      sh.sound.chime();
    }
  };
  sh.on((what, value) => {
    if (what === 'layer') layer[value as keyof typeof layer] = !layer[value as keyof typeof layer];
    else if (what === 'trip') trip = Number(value);
    else if (what === 'answer') {
      const s = STEPS[step];
      if (!s.ask) return;
      const got = answered(s.ask, Number(value));
      said = got.said;
      if (got.right) {
        s.show?.forEach((k) => (layer[k] = true));
        step++;
        if (step >= STEPS.length) sh.finish();
      }
    }
    advance();
    sh.draw();
  });
  sh.draw();
}
(window as unknown as { spire: Record<string, unknown> }).spire = {
  ...((window as unknown as { spire?: Record<string, unknown> }).spire ?? {}),
  check: () => [...checkKinds(KINDS), ...checkPhysics()],
  chamber: () => ({ step, trip, layer, done: sh.kept.chapter }),
};
