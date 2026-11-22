import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { expose, runChamber } from './chamber';
import { checkGravity, interval2, zone } from './gravity';
import type { Zone } from './gravity';
import { boosted, checkPhysics, frac, gamma, tidy } from './physics';

/**
 * Light cones: what can affect what.
 *
 * From any event, "here and now", light going out and light coming in cut
 * every other event into three kinds: those you can still affect, those that
 * can have affected you, and the rest, which are out of reach either way.
 * Observers in motion disagree about the order in time of the events out of
 * reach, and agree about everything else; which is why nothing outruns light.
 *
 * The playable is the diagram from the twins with five events on it, and a
 * slider that shows the same events as timed by someone passing by.
 */

const sh = new Shell('portal-worlds-cosmos-cones-v1');

const EVENTS: { name: string; t: number; x: number }[] = [
  { name: 'A', t: 4, x: 1 },
  { name: 'B', t: -3, x: -2 },
  { name: 'C', t: 1, x: 4 },
  { name: 'D', t: -2, x: -5 },
  { name: 'E', t: 3, x: 3 },
];
const ZONE_WORDS: Record<Zone, string> = {
  future: 'in your future: you can affect it',
  past: 'in your past: it can have affected you',
  elsewhere: 'elsewhere: out of reach both ways',
  cone: 'on the light cone: only light itself links you',
};

// ---- Practice ----

/** A small diagram with one straight line drawn on it from here-and-now. */
function sketch(t: number, x: number): string {
  const n = 6;
  const u = 34;
  const X = (v: number) => 20 + v * u;
  const Y = (v: number) => 20 + (n - v) * u;
  let s = '';
  for (let i = 0; i <= n; i++) s += `<path d="M${X(i)} ${Y(0)}V${Y(n)}M${X(0)} ${Y(i)}H${X(n)}" stroke="#2c3260" fill="none"/>`;
  s += `<path d="M${X(0)} ${Y(0)}L${X(n)} ${Y(n)}" stroke="#8d93b8" stroke-dasharray="3 5" fill="none"/><text x="${X(n) - 4}" y="${Y(n) + 14}" font-size="11" text-anchor="end">light</text>`;
  s += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(t)}" stroke="#e8c24a" stroke-width="3.5"/><circle cx="${X(0)}" cy="${Y(0)}" r="5" fill="#fff"/><circle cx="${X(x)}" cy="${Y(t)}" r="5" fill="#e8c24a"/>`;
  s += `<text x="${X(n / 2)}" y="${Y(0) + 16}" font-size="11" text-anchor="middle">distance, light-years →</text><text x="10" y="${Y(n / 2)}" font-size="11" text-anchor="middle" transform="rotate(-90 10 ${Y(n / 2)})">time, years →</text>`;
  return `<svg viewBox="0 0 ${40 + n * u} ${44 + n * u}" style="width:100%;max-width:280px;display:block;margin:auto">${s}</svg>`;
}

const SPANS: [number, number][] = [[5, 3], [5, 4], [10, 6], [10, 8], [13, 5], [13, 12], [17, 8], [17, 15], [25, 7], [25, 24]];

/** One question of each kind, worked through: shown until she has got one of that kind right. */
const EXAMPLES: Record<string, string> = {
  zone: "<p>A star <b>5 light-years</b> away will flare <b>3 years from now</b>. Where is the flare?</p><ol><li>Light needs 5 years to cross the gap.</li><li>Compare with the time there is: 3 years. Less than 5.</li><li>Not enough time for anything to cross: the flare is <b>elsewhere</b>.</li></ol><p>Had it been 8 years from now: more than 5, so in your future. Had it flared 8 years ago: in your past. Exactly 5: on the light cone.</p>",
  see: "<p>A star <b>30 light-years</b> away explodes in <b>2010</b>. When can we know?</p><ol><li>The light takes 30 years to arrive.</li><li>2010 + 30 = <b>2040</b>.</li></ol><p>The other way round: if we <i>see</i> it in 2040, it happened in 2040 − 30 = 2010.</p>",
  slope: "<p>A line runs from the white dot to a point <b>2 squares across</b> and <b>5 squares up</b>.</p><ol><li>Across is distance: 2 light-years. Up is time: 5 years.</li><li>Speed = distance ÷ time = <b>2/5</b> of the speed of light.</li></ol><p>If it ran 5 across and only 2 up, that would be 5 ÷ 2 = 2.5 times the speed of light. The line would lean over further than the dotted light-line, and nothing can follow it.</p>",
  interval: "<p>Two events are <b>13 years</b> apart in time and <b>5 light-years</b> apart in space.</p><ol><li>Square each: 13² = 169, 5² = 25.</li><li>Time's square minus distance's square: 169 − 25 = 144.</li><li>Square root: √144 = <b>12 years</b> on a clock carried between them.</li></ol><p>Swap them, 5 years and 13 light-years, and step 2 gives 25 − 169, a negative number. That means nothing can make the trip.</p>",
  order: "<p>A star <b>10 light-years</b> away will flare <b>4 years from now</b>. A ship passes you, heading for the star at <b>3/5</b> of the speed of light.</p><ol><li>The pilot's \"now\" at the star is ahead of yours by speed × distance = 3/5 × 10 = 6 years.</li><li>The flare is only 4 years ahead of your now.</li><li>4 is less than 6, so for the pilot the flare has <b>already happened</b>.</li></ol><p>Had the flare been 6 years ahead: at this moment, for the pilot. 8 years ahead: still to come.</p>",
  agree: "<p>One event happens <b>7 years</b> after another, <b>4 light-years</b> away.</p><ol><li>Could light get from the first to the second? It needs 4 years and has 7.</li><li>Yes: so the first could have caused the second, and <b>everyone agrees</b> on the order.</li></ol><p>Turn it round, 4 years after and 7 light-years away: light cannot make it, neither can have caused the other, and the order depends on who is asking.</p>",
};

const KINDS: Kind[] = [
  {
    id: 'zone',
    level: 1,
    make(rand) {
      const x = 1 + Math.floor(rand() * 9);
      const onCone = rand() < 0.2;
      let t = onCone ? x : 1 + Math.floor(rand() * 9);
      if (rand() < 0.5) t = -t;
      const z = zone(t, x);
      const when = t > 0 ? `will flare <b>${t} ${t === 1 ? 'year' : 'years'} from now</b>` : `flared <b>${-t} ${t === -1 ? 'year' : 'years'} ago</b>`;
      const all: Zone[] = ['future', 'past', 'elsewhere', 'cone'];
      const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
      return {
        ask: 'Where is the flare, as seen from here and now?',
        show: `<p>A star <b>${x} ${x === 1 ? 'light-year' : 'light-years'}</b> away ${when}.</p>`,
        outside: `<p class="soft">Compare the two numbers. Light needs ${x} ${x === 1 ? 'year' : 'years'} to cross the gap. Is there more time than that, less, or exactly that?</p>`,
        options: all.map((k) => cap(ZONE_WORDS[k])),
        right: all.indexOf(z),
        why: z === 'elsewhere' ? `Light needs ${x} years to cross and there are only ${Math.abs(t)}. Nothing can link the flare and you, now, in either direction.` : z === 'cone' ? `Light needs exactly ${x} years, and that is the time there is. ${t > 0 ? 'A beam you send now arrives just as it flares.' : 'Its light is reaching you at this moment.'}` : `Light needs ${x} years to cross and there are ${Math.abs(t)}: time to spare. ${t > 0 ? 'A signal sent now gets there first.' : 'Its light has already reached you.'}`,
      };
    },
  },
  {
    id: 'see',
    level: 1,
    make(rand) {
      const L = 2 + Math.floor(rand() * 40);
      const year = 2000 + Math.floor(rand() * 60);
      return rand() < 0.5
        ? { ask: 'In what year can anyone here first know of it?', show: `<p>A star <b>${L} light-years</b> away explodes in the year <b>${year}</b>, by our reckoning.</p>`, ...numbers(rand, year + L, [year, year - L, year + 2 * L]), why: `Until its light arrives, the explosion is in our elsewhere. ${year} + ${L} = ${year + L}.` }
        : { ask: 'When did it happen, by our reckoning?', show: `<p>In <b>${year}</b> we see a star <b>${L} light-years</b> away explode.</p>`, ...numbers(rand, year - L, [year, year + L, year - 2 * L]), why: `The light took ${L} years to get here: ${year} − ${L} = ${year - L}. Looking far away is looking into the past.` };
    },
  },
  {
    id: 'slope',
    level: 2,
    make(rand) {
      for (;;) {
        const t = 2 + Math.floor(rand() * 5);
        const x = 1 + Math.floor(rand() * 6);
        if (x === t) continue;
        const too = 'Faster than light: nothing can follow it';
        const base = { ask: 'What speed would it take to follow the gold line?', show: sketch(t, x), outside: `<p class="soft">Speed is distance covered divided by time taken: across, divided by up. Light's own line climbs one square for each square across.</p>` };
        return x < t
          ? { ...base, ...choices(rand, `${frac(x, t)} of the speed of light`, [too, `${frac(t - x, t)} of the speed of light`, `${frac(1, t)} of the speed of light`, `${frac(x, t + 1)} of the speed of light`]), why: `${x} light-${x === 1 ? 'year' : 'years'} in ${t} years: ${frac(x, t)} of the speed of light. The line is steeper than light's, as every real path is.` }
          : { ...base, ...choices(rand, too, [`${frac(t, x)} of the speed of light`, `${frac(x - t, x)} of the speed of light`, `${frac(1, x)} of the speed of light`]), why: `${x} light-years in only ${t} years would be ${tidy(x / t)} times the speed of light. The line leans over further than light's, so it is nobody's path.` };
      }
    },
  },
  {
    id: 'interval',
    level: 2,
    make(rand) {
      const [long, short] = pickOne(rand, SPANS);
      const inside = rand() < 0.65;
      const [t, x] = inside ? [long, short] : [short, long];
      const none = 'No clock can make the trip';
      const kept = Math.round(Math.sqrt(long * long - short * short));
      return { ask: 'A clock is carried straight from one to the other. How much time does it record?', show: `<p>Two events are <b>${t} years</b> apart in time and <b>${x} light-years</b> apart in space.</p>`, outside: `<p class="soft">From the twins: τ = √(t² − x²). What if the number under the root is negative?</p>`, ...choices(rand, inside ? `${kept} years` : none, inside ? [none, `${t} years`, `${t - x} years`, `${x} years`] : [`${kept} years`, `${t} years`, `${x - t} years`]), why: inside ? `√(${t}² − ${x}²) = √${interval2(t, x)} = ${kept}. And every observer, however they are moving, gets ${kept} for these two events.` : `${t}² − ${x}² is negative: the events are further apart in space than light can cross in the time. Each is in the other's elsewhere.` };
    },
  },
  {
    id: 'order',
    level: 3,
    make(rand) {
      const [a, c] = pickOne(rand, [[3, 5], [4, 5]] as [number, number][]);
      const k = 1 + Math.floor(rand() * 2);
      const x = c * k;
      const shift = a * k;
      // Kept short of x, so that the flare stays in elsewhere, where the order is open.
      const t = Math.min(x - 1, Math.max(1, shift + pickOne(rand, [-2, -1, 0, 0, 1])));
      const theirs = boosted(t, x, a / c)[0];
      const options = ['It has already happened', 'It is happening at this moment', 'It has yet to happen'];
      return { ask: 'For the pilot, at the moment of passing you, what of the flare?', show: `<p>A star <b>${x} light-years</b> away will flare <b>${t} ${t === 1 ? 'year' : 'years'} from now</b>, by your reckoning. A ship passes you at this moment, heading toward the star at <b>${frac(a, c)}</b> of the speed of light.</p>`, outside: `<p class="soft">From the twins: for someone moving at speed v, a place a distance L ahead is reckoned v × L years ahead of your schedule.</p>`, options, right: Math.abs(theirs) < 1e-9 ? 1 : theirs < 0 ? 0 : 2, why: `The pilot's "now" at the star is ${frac(a, c)} × ${x} = ${shift} years ahead of yours. The flare is ${t} ${t === 1 ? 'year' : 'years'} ahead of yours: ${t < shift ? 'already past, for the pilot' : t === shift ? 'exactly now, for the pilot' : 'still to come, for the pilot too'}. Neither of you can know of it for years yet, so nothing is contradicted.` };
    },
  },
  {
    id: 'agree',
    level: 3,
    make(rand) {
      const t = 1 + Math.floor(rand() * 9);
      let x = 1 + Math.floor(rand() * 9);
      if (x === t) x += 1;
      const inside = t > x;
      return { ask: 'Do all observers, however they are moving, agree on which came first?', show: `<p>By your reckoning, one event happens <b>${t} ${t === 1 ? 'year' : 'years'}</b> after another, <b>${x} ${x === 1 ? 'light-year' : 'light-years'}</b> away from it.</p>`, options: ['Yes: everyone agrees on the order', 'No: it depends on how you are moving'], right: inside ? 0 : 1, why: inside ? `Light could cross ${x} light-years in the ${t} years, so the first could have caused the second, and the order is the same for everyone.` : `Light cannot cross ${x} light-years in ${t} ${t === 1 ? 'year' : 'years'}. Neither can have caused the other, and someone moving at more than ${frac(t, x)} of light speed toward the second finds it happening first.` };
    },
  },
];

// ---- The chamber ----

let v = 0;
let sel = '';
let low = 0;

function diagram(): string {
  const S = 460;
  const u = 34;
  const X = (x: number) => S / 2 + x * u;
  const Y = (t: number) => S / 2 - t * u;
  const R = 6.5;
  let s = `<path d="M${X(0)} ${Y(0)}L${X(-R)} ${Y(R)}H${X(R)}Z" fill="rgba(232,194,74,0.10)"/><path d="M${X(0)} ${Y(0)}L${X(-R)} ${Y(-R)}H${X(R)}Z" fill="rgba(127,182,255,0.10)"/>`;
  s += `<path d="M${X(-R)} ${Y(-R)}L${X(R)} ${Y(R)}M${X(-R)} ${Y(R)}L${X(R)} ${Y(-R)}" stroke="#8d93b8" stroke-dasharray="4 5" fill="none"/>`;
  s += `<path d="M${X(-R)} ${Y(0)}H${X(R)}M${X(0)} ${Y(-R)}V${Y(R)}" stroke="#3b4170" fill="none"/>`;
  s += `<text x="${X(0)}" y="${Y(5.9)}" font-size="13" text-anchor="middle" fill="#e8c24a">future</text><text x="${X(0)}" y="${Y(-6.1)}" font-size="13" text-anchor="middle" fill="#7fb6ff">past</text><text x="${X(-5.3)}" y="${Y(0.25)}" font-size="13" text-anchor="middle">elsewhere</text><text x="${X(5.3)}" y="${Y(0.25)}" font-size="13" text-anchor="middle">elsewhere</text>`;
  s += `<text x="${X(R) - 2}" y="${Y(-0.5)}" font-size="11" text-anchor="end" opacity="0.6">distance →</text><text x="${X(-R) + 4}" y="${Y(R) + 14}" font-size="11" opacity="0.6">time ↑</text>`;
  for (const e of EVENTS) {
    // Every observer puts the event somewhere on this curve, and nowhere else.
    let d = '';
    for (let w = -0.95; w <= 0.951; w += 0.05) {
      const [t, x] = boosted(e.t, e.x, w);
      if (Math.abs(t) <= R && Math.abs(x) <= R) d += `${d ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(t).toFixed(1)}`;
    }
    s += `<path d="${d}" stroke="#4a5080" fill="none"/>`;
  }
  for (const e of EVENTS) {
    const [t, x] = boosted(e.t, e.x, v);
    if (Math.abs(t) > R || Math.abs(x) > R) continue;
    if (sel === e.name) s += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(t)}" stroke="${zone(e.t, e.x) === 'elsewhere' ? '#ff9a9a' : '#8fe0a4'}" stroke-width="2.5"/>`;
    s += `<g data-do="tap" data-v="${e.name}" style="cursor:pointer"><circle cx="${X(x)}" cy="${Y(t)}" r="17" fill="transparent"/><circle cx="${X(x)}" cy="${Y(t)}" r="9" fill="${sel === e.name ? '#fff' : '#ff9ab8'}"/><text x="${X(x)}" y="${Y(t) + 4}" font-size="11" text-anchor="middle" style="fill:#0b0e22;font-weight:bold">${e.name}</text></g>`;
  }
  s += `<circle cx="${X(0)}" cy="${Y(0)}" r="7" fill="#fff"/><text x="${X(0) - 11}" y="${Y(0) + 17}" font-size="12" text-anchor="end">you, now</text>`;
  return `<svg viewBox="0 0 ${S} ${S}" style="width:100%;max-width:520px;display:block;margin:auto">${s}</svg>`;
}

function told(): string {
  const who = Math.abs(v) < 0.005 ? 'By your reckoning' : `For someone passing you at ${tidy(Math.abs(v))} of light speed, heading ${v > 0 ? 'right' : 'left'}`;
  const e = EVENTS.find((k) => k.name === sel);
  if (!e) return `<p class="soft">${who}. Tap an event.</p>`;
  const [t, x] = boosted(e.t, e.x, v);
  const z = zone(e.t, e.x);
  const when = Math.abs(t) < 0.005 ? 'at this very moment' : `${tidy(Math.abs(t))} years ${t > 0 ? 'from now' : 'ago'}`;
  const link = z === 'cone' ? 'Only light itself can join you to it.' : z === 'elsewhere' ? `To join you to it would take ${tidy(Math.abs(x / t))} times the speed of light: impossible.` : `To join you to it takes ${tidy(Math.abs(x / t))} of the speed of light: possible.`;
  return `<p>${who}: <b>${e.name}</b> happens ${when}, ${tidy(Math.abs(x))} light-years to the ${x > 0 ? 'right' : 'left'}. It is ${ZONE_WORDS[z]}. ${Math.abs(t) < 0.005 ? '' : link}</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The two wedges, drawn with space in more than one direction, are cones: together, the <b>light cone</b> of the event at their tip. The upper is its <b>future light cone</b>, the lower its <b>past light cone</b>.</li>
      <li>Two events that something slower than light could join are <b>timelike separated</b>. If only light could join them, <b>lightlike</b> (or <b>null</b>). If nothing could, <b>spacelike separated</b>.</li>
      <li>That causes come before their effects for every observer is <b>causality</b>. It holds because effects stay inside the light cone.</li>
      <li>The quantity t² − x², which every observer computes alike for the same two events, is the <b>spacetime interval</b>. The faint curves on the diagram are curves of constant interval: sliding the speed moves each event along its own curve and never off it.</li>
    </ul>
    <p>The limit is measured. In 2017 two neutron stars collided about 130 million light-years away; the gravitational waves and the first light from it arrived within two seconds of each other. In 2011 an experiment reported neutrinos beating light by 60 billionths of a second; the cause was found to be a loose optical-fibre connector, and the corrected result agreed with the limit.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Slopes and graphs.</b> A graph is a picture of how one quantity depends on another, and the <i>slope</i> of a line on it is how much it rises for each unit it runs across:</p>
      <div class="eq">slope = rise ÷ run</div>
      <p>On these diagrams time is up and distance is across, so a path's slope is (time taken) ÷ (distance covered), which is 1 ÷ speed. A steep line is a slow thing; an upright line is a thing at rest; light, at one light-year a year, has slope exactly 1, which is 45°. A real path is always steeper than that.</p>
      <p>The derivative from the budget chamber is the same idea made to work for a curve: the slope of the curve at one point, which is the slope of the straight line that just touches it there.</p>
      <p><b>Sorting by one number.</b> For two events t years and x light-years apart, work out</p>
      <div class="eq">s² = t² − x²</div>
      <p>Positive: timelike, and √s² is the time on a clock carried between them. Zero: on the light cone. Negative: spacelike. Event A is 4 years and 1 light-year from you, so s² = 15. At 0.6 of light speed the passer-by times it at 4.25 years and 1.75 light-years: 18.0625 − 3.0625 = 15 again.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://www.eftaylor.com/spacetimephysics/" target="_blank" rel="noopener">Taylor and Wheeler, <i>Spacetime Physics</i></a>, chapter 6, "Regions of Spacetime". Free from the author's site.</li>
      <li>Read: <a href="https://www.einstein-online.info/en/category/elementary/" target="_blank" rel="noopener">Einstein Online, Elementary Einstein</a>. The Max Planck Institute's plain-language tour; the special relativity section covers this.</li>
      <li>Watch: <a href="https://www.youtube.com/playlist?list=PLoaVOjvkzQtyjhV55wZcdicAz5KexgKvm" target="_blank" rel="noopener">minutephysics, Intro to Special Relativity</a>. The episodes on spacetime diagrams and on the interval.</li>
      <li>Course: <a href="https://ocw.mit.edu/courses/8-20-introduction-to-special-relativity-january-iap-2021/" target="_blank" rel="noopener">MIT OpenCourseWare 8.20</a>. The lectures on causality and spacetime diagrams.</li>
      <li>For the math: <a href="https://openstax.org/books/college-algebra-2e/pages/4-1-linear-functions" target="_blank" rel="noopener">OpenStax College Algebra, section 4.1</a>, on straight lines and slope.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · light cones', 'What can reach what?', 'Time in years, distance in light-years. <b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  runChamber({
    sh,
    file: 'cones',
    kicker: 'Flat spacetime · 3',
    title: 'Light cones',
    steps: [
      { say: 'The diagram from the twins: time up the page, distance across. The white dot is you, here, now. The dotted lines are light: the upper pair is light leaving you now, the lower pair light arriving now. The pink dots are five things that happen. <b>Tap A.</b>', until: () => sel === 'A' },
      { say: 'A is 1 light-year away and 4 years off. Something leaving you now at a quarter of the speed of light gets there in time.', ask: ['C is 4 light-years away and happens 1 year from now. Can anything you do now make a difference to C?', ['Yes, given a fast enough ship', 'No: it would take four times the speed of light', 'Yes, but only by radio'], 1, 'Radio is light, and light needs 4 years. C lies outside the dotted lines. Tap it.'] },
      { say: 'Now look down the page, at what has already happened.', ask: ['B was 2 light-years away, 3 years ago. Which is true?', ['B can have affected you: its light got here a year ago', 'You can still affect B', 'B and you can have nothing to do with each other'], 0, 'Light from B took 2 years and arrived a year ago. So the upper wedge is everything you can still affect, the lower wedge is everything that can have affected you, and the two sides are neither. The sides are called <i>elsewhere</i>.'] },
      { say: 'The Sun is 8 light-minutes from Earth.', ask: ['If the Sun vanished this instant, when would anything on Earth change?', ['At once: the Earth would fly off straight away', 'After 8 minutes', 'After 16 minutes'], 1, 'The Sun-right-now is in our elsewhere. For 8 minutes the sky stays bright and the Earth keeps to its orbit, because changes in gravity travel at the speed of light too.'] },
      { say: 'Now the strange part. The slider shows the <i>same five events</i> as timed by someone passing you, right here, right now. <b>Slide it to 0.6 heading right, and watch C.</b>', until: () => v >= 0.58 },
      { say: 'For you, C is a year in the future. For the passer-by, C happened 1.75 years ago.', ask: ['Who is right about whether C comes before or after this moment?', ['You are: you are the one at rest', 'The passer-by is', 'Neither: for events in elsewhere, the order is not a fact'], 2, 'This is the twins\' tilted "now" again. It does no harm, because neither of you can know of C, or do anything to it, until its light arrives.'] },
      { say: '<b>Now slide all the way the other way, past 0.6 heading left,</b> and watch A and B the whole time.', until: () => low <= -0.58 },
      { say: 'Every event slid along its own faint curve.', ask: ['Did any speed carry A below this moment, or out of the upper wedge?', ['Yes, at the highest speeds', 'No: what is inside a wedge stays inside it'], 1, 'Everyone agrees on what is in your future, your past and your elsewhere, and on the order of anything that could be cause and effect. And this is why nothing outruns light: a faster message would run from you to somewhere like C, and some passers-by find C earlier than now. For them your message arrives before you send it. Relay it back the same way and you could answer yourself before you asked.'] },
    ],
    summary: '<b>The light cone sorts every event into your future, your past, and elsewhere.</b> Everyone agrees on the sorting. Only inside the cones is "before" and "after" a fact, and that is exactly where causes and effects live.',
    frame: () => `<div id="diagram"></div><div class="bar"><span class="soft">0.9 ←</span><input id="pass" type="range" min="-0.9" max="0.9" step="0.01" value="0" style="flex:1"><span class="soft">→ 0.9</span></div><div class="bar"><button class="chip pale" data-do="rest" data-v="0">back to your own reckoning</button></div><div id="told"></div>`,
    paint: () => {
      $('diagram').innerHTML = diagram();
      $('told').innerHTML = told();
    },
    slide: (_id, value) => {
      v = value;
      low = Math.min(low, v);
    },
    act: (what, value) => {
      if (what === 'tap') sel = value;
      else if (what === 'rest') {
        v = 0;
        ($('pass') as HTMLInputElement).value = '0';
      }
    },
    drawer,
    next: ['falling', 'On to falling'],
  });
}
expose(
  () => [...checkKinds(KINDS), ...checkPhysics(), ...checkGravity(), ...(Math.abs(gamma(0.6) * (1 - 0.6 * 4) + 1.75) < 1e-9 && Math.abs(boosted(4, 1, 0.6)[0] - 4.25) < 1e-9 ? [] : ['the chamber\'s own figures'])],
  () => ({ v, sel, done: sh.kept.chapter }),
);
