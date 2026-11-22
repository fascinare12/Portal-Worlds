import { Shell, checkKinds, choices, pickOne, runPractice, shuffled } from '../canon/shell';
import type { Kind } from '../canon/shell';
import { paras, saidBox, stepLine } from './chamber';
import './cosmos.css';
import { PACES, beta, boosted, checkPhysics, frac, gamma, rate, tidy } from './physics';

/**
 * The budget: everything moves through spacetime at one fixed rate. The more
 * of it goes into moving through space, the less is left for moving through
 * time.
 *
 * Stated exactly: if you watch something move at speed v, then for each
 * second on your clock its own clock advances by the square root of
 * (1 − v²/c²). So (v/c)² + (its clock rate)² = 1, which is a circle, and the
 * playable is that circle with an arrow she turns.
 *
 * What the picture does not show, and the chamber says so before it ends:
 * the rates are as measured by one observer. The ship's crew find the same
 * thing about her clock. That puzzle is the next chamber's.
 */

const sh = new Shell('portal-worlds-cosmos-budget-v1');
const speedWord = (p: { a: number; c: number }) => `${frac(p.a, p.c)} of the speed of light`;

// ---- Practice ----

const CONCEPT: [string, string, string[], string][] = [
  ['A ship passes you at 3/5 of the speed of light. You measure its clocks running at 4/5 of yours. What does its crew measure about your clocks?', 'They run slow too: at 4/5 of the crew\'s own', ['They run fast: at 5/4 of the crew\'s own', 'They run at exactly the same rate as the crew\'s', 'They have stopped'], 'Neither of you is "really" moving. Each of you sees the other go by at 3/5, so each finds the other\'s clock slow. How both can be true is what the twins are for.'],
  ['The crew of a fast ship look at their own wristwatches. What do they notice?', 'Nothing unusual: their own time passes normally', ['Their watches run visibly slow', 'Their watches run visibly fast', 'Their watches run backwards'], 'Nobody ever feels their own time slow down. A slowed clock is always someone else\'s, measured from outside.'],
  ['Something is sitting perfectly still in front of you. How is it spending its budget?', 'All of it on moving through time', ['All of it on moving through space', 'Half on each', 'It has no budget while it is still'], 'At rest in space, the whole of the fixed rate goes into time: its clock keeps pace with yours.'],
  ['What happens to the clock rate you measure as a ship\'s speed gets closer and closer to the speed of light?', 'It gets closer and closer to zero, without reaching it', ['It settles at one half', 'It becomes negative', 'It jumps back up to normal'], 'The arrow swings toward lying flat. Nothing with mass can get it all the way there.'],
  ['You pour energy into a ship already moving at 24/25 of the speed of light. What changes most?', 'Its clock slows further; its speed barely rises', ['Its speed rises steadily past the speed of light', 'Nothing changes at all', 'Its clock speeds back up'], 'Near the end of the arc, a tiny change in speed is a large change in clock rate. That is why the speed of light is a limit and not a wall you hit.'],
];

/** One question of each kind, worked through: shown until she has got one of that kind right. */
const EXAMPLES: Record<string, string> = {
  rate: "<p>A ship passes at <b>5/13</b> of the speed of light. How fast does its clock run?</p><ol><li>Square the speed: (5/13)² = 25/169.</li><li>Take that from 1: 1 − 25/169 = 144/169.</li><li>Take the square root: √(144/169) = <b>12/13</b>.</li></ol><p>Its clock advances 12/13 of a second for each second of yours. The shortcut: 5, 12 and 13 are the sides of a right triangle, and the speed and the clock rate are the two short sides over the long one. The triangles used here are 3-4-5, 5-12-13, 8-15-17 and 7-24-25.</p>",
  slowest: "<p>Ships pass at 3/5, 12/13 and 7/25 of the speed of light. Whose clock is slowest?</p><ol><li>Turn the speeds into decimals to compare them: 0.6, 0.92, 0.28.</li><li>The fastest ship has the slowest clock: the one at <b>12/13</b> (its clock runs at only 5/13).</li><li>The slowest ship has the fastest clock: the one at 7/25 (its clock runs at 24/25).</li></ol>",
  trip: "<p>A ship cruises at <b>4/5</b> of the speed of light for <b>10 years</b> by your clock. How much time passes on board?</p><ol><li>Find its clock rate. 4/5 belongs to the 3-4-5 triangle, so the rate is 3/5.</li><li>Ship's time = your time × clock rate = 10 × 3/5 = <b>6 years</b>.</li></ol>",
  speed: "<p>You want a ship's clock to run at <b>5/13</b> of yours. How fast must it go?</p><ol><li>Find the triangle with 5 and 13 in it: 5-12-13.</li><li>The speed is the other short side over the long one: <b>12/13</b> of the speed of light.</li><li>Check: (5/13)² + (12/13)² = 25/169 + 144/169 = 1.</li></ol>",
  lifetime: "<p>A particle lasts <b>6 microseconds</b> by its own clock and passes you at <b>4/5</b> of the speed of light. How long does it last by yours?</p><ol><li>Its clock rate: 3/5 (the 3-4-5 triangle).</li><li>Its clock is the slow one, so its 6 microseconds take <i>longer</i> on yours. Divide by the rate: 6 ÷ 3/5 = 6 × 5/3 = <b>10 microseconds</b>.</li></ol><p>Multiply by the rate to go from your time to its time; divide to go from its time to yours.</p>",
  reach: "<p>A particle lasts <b>6 microseconds</b> by its own clock and passes you at <b>4/5</b> of the speed of light. How far does it get?</p><ol><li>First, how long it lasts by <i>your</i> clock: 6 ÷ 3/5 = 10 microseconds.</li><li>Distance = speed × your time = 4/5 × 10 = <b>8 light-microseconds</b>.</li></ol><p>Using its own 6 microseconds would give 4.8, which is too short: you are the one measuring the distance, so use your time.</p>",
  idea: "<p>These have no arithmetic. Two rules settle nearly all of them.</p><ol><li><b>Nobody notices their own clock run slow.</b> A slow clock is always someone else's, measured from outside.</li><li><b>It is the same both ways.</b> If you find a ship's clock slow, its crew find yours slow by the same amount.</li></ol><p>For example: \"A ship's crew time their own heartbeats. What do they find?\" By rule 1, nothing unusual.</p>",
};

const KINDS: Kind[] = [
  {
    id: 'rate',
    level: 1,
    make(rand) {
      const p = pickOne(rand, PACES);
      return { ask: 'For each second on your clock, how much does the ship\'s clock advance?', show: `<p>A ship passes you at <b>${speedWord(p)}</b>.</p>`, outside: `<p class="soft">The two parts of the budget are the sides of a right triangle whose long side is 1.</p>`, ...choices(rand, `${frac(p.b, p.c)} of a second`, [`${frac(p.a, p.c)} of a second`, `${frac(p.c, p.b)} seconds`, `${frac(p.c - p.a, p.c)} of a second`]), why: `(${frac(p.a, p.c)})² + (${frac(p.b, p.c)})² = 1.` };
    },
  },
  {
    id: 'slowest',
    level: 1,
    make(rand) {
      const three = shuffled(rand, PACES).slice(0, 3);
      const slow = rand() < 0.5;
      const pickd = [...three].sort((x, y) => (slow ? beta(y) - beta(x) : beta(x) - beta(y)))[0];
      return { ask: slow ? 'Whose clock do you measure running slowest?' : 'Whose clock do you measure running fastest?', show: `<p>Three ships pass you:</p>`, ...choices(rand, `the one at ${frac(pickd.a, pickd.c)}`, three.filter((p) => p !== pickd).map((p) => `the one at ${frac(p.a, p.c)}`)), why: 'The more of the budget is spent on speed through space, the less is left for time.' };
    },
  },
  {
    id: 'trip',
    level: 1,
    make(rand) {
      const p = pickOne(rand, PACES);
      const k = 1 + Math.floor(rand() * 3);
      const T = p.c * k;
      return { ask: 'How much time passes on the ship?', show: `<p>A ship cruises at <b>${speedWord(p)}</b> for <b>${T} years</b> by your clock.</p>`, ...choices(rand, `${p.b * k} years`, [`${p.a * k} years`, `${T} years`, `${tidy((T * p.c) / p.b)} years`]), why: `Its clock runs at ${frac(p.b, p.c)} of yours: ${T} × ${frac(p.b, p.c)} = ${p.b * k}.` };
    },
  },
  {
    id: 'speed',
    level: 2,
    make(rand) {
      const p = pickOne(rand, PACES);
      const others = shuffled(rand, PACES.filter((q) => q.a * p.c !== p.a * q.c)).slice(0, 3);
      return { ask: 'How fast must it go?', show: `<p>You want a ship's clock to run at <b>${frac(p.b, p.c)}</b> of the rate of yours.</p>`, ...choices(rand, speedWord(p), others.map(speedWord)), why: `Whatever is not spent on time is spent on space: (${frac(p.b, p.c)})² + (${frac(p.a, p.c)})² = 1.` };
    },
  },
  {
    id: 'lifetime',
    level: 2,
    make(rand) {
      const p = pickOne(rand, PACES);
      const k = 1 + Math.floor(rand() * 3);
      const own = p.b * k;
      return { ask: 'How long does it last by your clock?', show: `<p>A particle falls apart after <b>${own} microseconds</b> by its own clock. It flies past you at <b>${speedWord(p)}</b>.</p>`, ...choices(rand, `${p.c * k} microseconds`, [`${own} microseconds`, `${tidy((own * p.b) / p.c)} microseconds`, `${p.a * k} microseconds`]), why: `Its clock runs slow by ${frac(p.b, p.c)}, so its ${own} microseconds take ${own} ÷ ${frac(p.b, p.c)} = ${p.c * k} of yours. This is measured: fast particles outlive slow ones.` };
    },
  },
  {
    id: 'reach',
    level: 2,
    make(rand) {
      const p = pickOne(rand, PACES);
      const k = 1 + Math.floor(rand() * 2);
      const own = p.b * k;
      return { ask: 'How far does it get before it falls apart?', show: `<p>A particle lasts <b>${own} microseconds</b> by its own clock, and passes you at <b>${speedWord(p)}</b>. Light covers one light-microsecond (about 300 metres) each microsecond.</p>`, outside: `<p class="soft">First find how long it lasts by your clock. Then: distance is speed times that time.</p>`, ...choices(rand, `${p.a * k} light-microseconds`, [`${tidy((own * p.a) / p.c)} light-microseconds`, `${own} light-microseconds`, `${p.c * k} light-microseconds`]), why: `By your clock it lasts ${p.c * k} microseconds, at ${frac(p.a, p.c)} of light speed: ${p.c * k} × ${frac(p.a, p.c)} = ${p.a * k}. Without the slowed clock it would get only ${tidy((own * p.a) / p.c)}.` };
    },
  },
  {
    id: 'idea',
    level: 3,
    make(rand) {
      const [ask, right, wrong, why] = pickOne(rand, CONCEPT);
      return { ask: 'Which is right?', show: `<p>${ask}</p>`, ...choices(rand, right, wrong), why };
    },
  },
];

// ---- The chamber ----

let v = 0;
let step = 0;
let said = '';
let home = 0;
let ship = 0;
const C_KM = 299792;

const STEPS: { say: string; ask?: [string, string[], number, string]; until?: () => boolean }[] = [
  { say: 'The arrow is the ship\'s budget. It never changes length. Right now the ship is at rest, and all of the arrow points up: through time. <b>Slide the speed up and watch where the arrow goes.</b>', until: () => v > 0.3 },
  { say: 'As the arrow leans over, less of it points up, and the ship\'s clock falls behind yours. <b>Find the speed at which the ship\'s clock runs at exactly half the rate of yours.</b>', until: () => Math.abs(rate(v) - 0.5) < 0.012 },
  { say: 'About 87% of the speed of light. Half the budget\'s <i>length</i> was not enough: the arrow has to lean a long way before its height halves.', ask: ['Before you try it: at 3/5 of the speed of light, how fast does the ship\'s clock run?', ['At 2/5 of yours', 'At 3/5 of yours', 'At 4/5 of yours'], 2, 'A 3-4-5 triangle: 3/5 across, 4/5 up. Set the speed to 0.6 and see.'] },
  { say: '<b>Now push the speed as high as it will go.</b>', until: () => v > 0.99 },
  { say: 'The arrow is almost flat and the ship\'s clock has almost stopped; but the last sliver of speed never comes. To lie flat the arrow would need to spend nothing at all on time.', ask: ['One thing this picture leaves out. The ship\'s crew are watching <i>your</i> clock. What do they find?', ['That your clock runs fast', 'That your clock runs slow, by the same amount', 'That your clock agrees with theirs'], 1, 'To them, you are the one moving. Each of you measures the other\'s clock running slow. That sounds impossible, and it is the question the next chamber answers.'] },
];

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The time a clock records for itself is its <b>proper time</b>. Finding a moving clock slow is <b>time dilation</b>.</li>
      <li>The stretch factor, 1 ÷ (clock rate), is the <b>Lorentz factor</b>, written γ ("gamma"). At 3/5 of light speed γ is 5/4.</li>
      <li>The fixed-length arrow is, in the full theory, the <b>four-velocity</b>: every object's has the same size, the speed of light.</li>
      <li><b>c</b> is the speed of light, about 299,792 kilometres a second. It is the exchange rate between space and time.</li>
    </ul>
    <p>This is measured, not supposed. In 1971 Hafele and Keating flew atomic clocks round the world on airliners: the eastbound clocks came home 59 billionths of a second behind the ones left on the ground, and the westbound ones 273 ahead, as predicted once gravity is counted too.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p>Pythagoras is all it takes. The arrow has length 1. Its part across is the speed, as a fraction of light's: v/c. Its part up is the clock rate. So</p>
      <div class="eq">(v/c)² + (clock rate)² = 1</div>
      <div class="eq">clock rate = √(1 − v²/c²) &nbsp;&nbsp; and &nbsp;&nbsp; γ = 1 / √(1 − v²/c²)</div>
      <p><b>A first piece of calculus.</b> "Clock rate" is a <i>rate of change</i>: how much the ship's time τ changes for each small change in your time t. It is written dτ/dt, read "d tau by d t". A derivative is nothing more than that: one thing's change per unit change of another. Speed is the same idea: v = dx/dt.</p>
      <p><b>Where the square root comes from.</b> Picture a clock that ticks by bouncing light between two mirrors, one above the other. Riding along with it, the light goes straight up and down. Watching it fly past, you see the light travel a longer, slanted path. Light's speed is the same for both of you, so by your reckoning each tick takes longer. The slanted path, the upright one and the distance the clock moved make a right triangle, and the square root falls out of it.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://www.eftaylor.com/spacetimephysics/" target="_blank" rel="noopener">Taylor and Wheeler, <i>Spacetime Physics</i></a>, chapter 1. Free from the author's site. The best first book on this.</li>
      <li>Watch: <a href="https://www.youtube.com/playlist?list=PLoaVOjvkzQtyjhV55wZcdicAz5KexgKvm" target="_blank" rel="noopener">minutephysics, Intro to Special Relativity</a>. Short, careful, visual.</li>
      <li>Course: <a href="https://ocw.mit.edu/courses/8-20-introduction-to-special-relativity-january-iap-2021/" target="_blank" rel="noopener">MIT OpenCourseWare 8.20, Introduction to Special Relativity</a>. Lectures and problem sets.</li>
      <li>Read: <a href="https://openstax.org/books/university-physics-volume-3/pages/5-introduction" target="_blank" rel="noopener">OpenStax University Physics, volume 3, chapter 5</a>. A free standard textbook chapter, with problems.</li>
      <li>For the calculus: <a href="https://www.3blue1brown.com/topics/calculus" target="_blank" rel="noopener">3Blue1Brown, Essence of Calculus</a>, and <a href="https://openstax.org/details/books/calculus-volume-1" target="_blank" rel="noopener">OpenStax Calculus, volume 1</a>.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · the budget', 'How is it spending it?', 'Speeds are given as fractions of the speed of light. <b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  sh.page.innerHTML =
    `<div class="kicker">Spacetime · 1</div><h1>The budget</h1><div id="top"></div>` +
    `<div class="card"><svg id="dial" viewBox="-30 -230 520 270" style="width:100%;display:block">
      <path d="M0 0H210M0 0V-210" stroke="#8d93b8" stroke-width="1.5" fill="none"/><path d="M200 0A200 200 0 0 0 0 -200" stroke="#3b4170" stroke-width="2" fill="none" stroke-dasharray="4 5"/>
      <text x="105" y="22" font-size="13" text-anchor="middle">speed through space →</text><text x="-14" y="-105" font-size="13" text-anchor="middle" transform="rotate(-90 -14 -105)">speed through time →</text>
      <line id="across" x1="0" y1="0" x2="0" y2="0" stroke="#7fb6ff" stroke-width="5"/><line id="up" x1="0" y1="0" x2="0" y2="-200" stroke="#e8c24a" stroke-width="5"/>
      <line id="arrow" x1="0" y1="0" x2="0" y2="-200" stroke="#fff" stroke-width="3"/><circle id="tip" cx="0" cy="-200" r="7" fill="#fff"/>
      <g transform="translate(300 -190)"><text x="45" y="-12" font-size="13" text-anchor="middle">your clock</text><circle cx="45" cy="45" r="42" fill="none" stroke="#8d93b8" stroke-width="2"/><line id="h1" x1="45" y1="45" x2="45" y2="9" stroke="#e9e6f5" stroke-width="3" stroke-linecap="round"/></g>
      <g transform="translate(400 -190)"><text x="45" y="-12" font-size="13" text-anchor="middle">the ship's clock</text><circle cx="45" cy="45" r="42" fill="none" stroke="#e8c24a" stroke-width="2"/><line id="h2" x1="45" y1="45" x2="45" y2="9" stroke="#e8c24a" stroke-width="3" stroke-linecap="round"/></g>
      <text id="read" x="390" y="-60" font-size="14" text-anchor="middle"></text><text id="read2" x="390" y="-38" font-size="14" text-anchor="middle"></text><text id="read3" x="390" y="-16" font-size="14" text-anchor="middle"></text>
    </svg>
    <div class="bar"><span class="soft">at rest</span><input id="speed" type="range" min="0" max="0.999" step="0.001" value="0" style="flex:1"><span class="soft">light speed</span></div>
    <div class="bar">${[0, 0.6, 0.8, 0.96].map((x) => `<button class="chip pale" data-do="set" data-v="${x}">${x === 0 ? 'at rest' : x}</button>`).join('')}</div></div><div id="rest"></div>`;
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  const slider = $('speed') as HTMLInputElement;
  const set = (id: string, attrs: Record<string, number>) => Object.entries(attrs).forEach(([k, val]) => $(id).setAttribute(k, String(val)));
  const paint = () => {
    const x = v * 200;
    const y = -rate(v) * 200;
    set('arrow', { x2: x, y2: y });
    set('tip', { cx: x, cy: y });
    set('across', { x2: x });
    set('up', { x1: x, x2: x, y2: y });
    $('read').textContent = `speed: ${tidy(v)} of light (${Math.round(v * C_KM).toLocaleString()} km/s)`;
    $('read2').textContent = `ship's clock runs at ${tidy(rate(v))} of yours`;
    $('read3').textContent = `stretch factor γ = ${v > 0.9985 ? 'over 18' : tidy(gamma(v))}`;
  };
  sh.render = () => {
    const s = STEPS[Math.min(step, STEPS.length - 1)];
    const done = step >= STEPS.length;
    $('top').innerHTML =
      `<div class="card">${stepLine(step, STEPS.length)}${saidBox(said)}` +
      (done
        ? `<p><b>That is the whole idea.</b> One fixed budget; speed through space is paid for out of speed through time. Everything else in relativity has to live with it.</p>`
        : `${paras(s.say)}${s.ask ? `<p><b>${s.ask[0]}</b></p><div class="reasons">${s.ask[1].map((o, i) => `<button data-do="answer" data-v="${i}">${o}</button>`).join('')}</div>` : ''}`) +
      `</div>`;
    $('rest').innerHTML = done ? `${drawer()}<div class="bar"><a class="chip gold" href="./budget.html?practice">Practise ▶</a><a class="chip" href="./twins.html">On to the twins ▶</a><a class="chip pale" href="./index.html">Back to the map</a></div>` : '';
  };
  const advance = () => {
    const s = STEPS[step];
    if (s && !s.ask && s.until?.()) {
      step++;
      said = '';
      sh.sound.chime();
      sh.draw();
    }
  };
  slider.addEventListener('input', () => {
    v = Number(slider.value);
    paint();
    advance();
  });
  sh.on((what, value) => {
    if (what === 'set') {
      v = Number(value);
      slider.value = value;
      paint();
      advance();
    } else if (what === 'answer') {
      const s = STEPS[step];
      if (!s.ask) return;
      const right = Number(value) === s.ask[2];
      said = `${right ? 'Yes.' : 'Not quite.'} ${s.ask[3]}`;
      step++;
      if (step >= STEPS.length) sh.finish();
      sh.draw();
    }
  });
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    home += dt;
    ship += dt * rate(v);
    for (const [id, t] of [['h1', home], ['h2', ship]] as const) {
      const a = t * 1.2;
      set(id, { x2: 45 + Math.sin(a) * 36, y2: 45 - Math.cos(a) * 36 });
    }
    requestAnimationFrame(loop);
  };
  paint();
  sh.draw();
  requestAnimationFrame(loop);
}
(window as unknown as { spire: Record<string, unknown> }).spire = {
  ...((window as unknown as { spire?: Record<string, unknown> }).spire ?? {}),
  check: () => [...checkKinds(KINDS), ...checkPhysics(), ...(Math.abs(boosted(5, 3, 0.6)[0] - 4) < 1e-9 ? [] : ['boost'])],
  chamber: () => ({ step, v, done: sh.kept.chapter }),
};
