import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS, RAINBOW, stars } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { HUBBLE_TIME, began, checkCosmology, size } from './cosmology';
import type { History } from './cosmology';
import { frac, tidy } from './physics';

/**
 * Space stretching.
 *
 * Nearly every galaxy's light is shifted to the red, and the further the
 * galaxy the bigger the shift. The reading that fits is not that we sit at
 * the middle of an explosion, but that space itself is stretching: every gap
 * grows by the same factor, so from any galaxy at all, the others recede at
 * speeds in proportion to their distance. Light crossing the stretching
 * space is stretched with it. Run the stretching backwards and everything
 * was once close and hot, a finite time ago.
 *
 * Three figures: a field of galaxies to stretch and to stand anywhere in; a
 * wave of light that set out when the universe was smaller; and three
 * histories of the universe's size, of which the measurements pick one.
 */

const sh = new Shell('portal-worlds-cosmos-expansion-v1');
const H = 0.674;
/** Billions of years in one unit of 1/H0. */
const UNIT = HUBBLE_TIME / H;

// ---- Practice ----

const IDEAS: [string, string, string[], string][] = [
  ['Nearly every galaxy is moving away from us. Does that put us at the centre of the universe?', 'No: seen from any galaxy, all the others are moving away', ['Yes: everything is fleeing from here', 'Yes, but only roughly', 'No: half of them are really approaching'], 'When every gap grows by the same factor, every point sees the rest recede, at speeds in proportion to distance. There is no centre to find.'],
  ['Where did the Big Bang happen?', 'Everywhere: all of space was once dense and hot', ['At a point somewhere in the constellation Virgo', 'At the centre of the Milky Way', 'Outside the universe'], 'It was not an explosion into empty space from a point. It was all of space, everywhere, much denser and hotter than now, and stretching.'],
  ['A galaxy\'s light has been stretched to twice its wavelength. What mainly caused that?', 'Space stretched to twice its size while the light was travelling', ['The galaxy is rushing through space at near light speed', 'The light got tired on the way', 'Dust reddened it'], 'For distant galaxies the redshift measures how much the universe has grown since the light set out. It is not a speed through space.'],
  ['Very distant galaxies are receding faster than light. Does that break the rule of chamber 3?', 'No: nothing is overtaking light where it is. The space between is growing', ['Yes: the rule fails at large distances', 'No, because they are not really receding', 'Yes, and it is unexplained'], 'The limit is local: nothing outruns a light beam that is beside it. Two distant places can be carried apart faster than light by the growth of the space between them.'],
  ['In 1998 distant supernovae were found fainter, and so further, than expected. What did that show?', 'The expansion is speeding up', ['The expansion has stopped', 'The universe is smaller than thought', 'Supernovae are unreliable'], 'Matter\'s gravity should slow the expansion. Something is making it speed up instead. It is called dark energy, and what it is is not known.'],
  ['The universe is 13.8 billion years old, yet the edge of what we can see is 46 billion light-years away. How?', 'The space the light crossed has kept stretching since', ['The light travelled faster than light', 'One of the two figures is wrong', 'The universe is older than it looks'], 'The oldest light has travelled for 13.8 billion years. The place it left has meanwhile been carried much further off.'],
];

const EXAMPLES: Record<string, string> = {
  twice: '<p>A galaxy <b>100 million light-years</b> away recedes at <b>2,100 km/s</b>. What of one <b>300 million</b> light-years away?</p><ol><li>Recession speed is in proportion to distance.</li><li>Three times as far, so three times as fast: 2,100 × 3 = <b>6,300 km/s</b>.</li></ol><p>That simple proportion is the sign of a uniform stretch.</p>',
  stretch: '<p>A galaxy\'s light arrives with its wavelengths stretched to <b>5 times</b> their original length. How big was the universe when the light set out?</p><ol><li>Light is stretched by exactly as much as space has stretched since it set out.</li><li>So the universe was <b>1/5</b> of its present size.</li></ol><p>Astronomers quote the redshift z, which is the stretch minus 1: here z = 4.</p>',
  wave: '<p>Light leaves a galaxy at <b>500 nanometres</b>. Since then the universe has <b>tripled</b> in size. At what wavelength does it arrive?</p><ol><li>The wave is stretched with the space it crosses.</li><li>500 × 3 = <b>1,500 nanometres</b>: in the infrared.</li></ol>',
  gaps: '<p>Three galaxies in a row, <b>10</b> and <b>30</b> million light-years from the first. The universe grows by <b>half</b> as much again.</p><ol><li>Every distance is multiplied by 1.5: they are now at 15 and 45.</li><li>The nearer one moved 5 further off; the farther one moved 15.</li><li>Three times as far, and it receded <b>three times as much</b> in the same time.</li></ol>',
  age: '<p>If the universe had always expanded at today\'s rate, everything was together a time 1 ÷ H₀ ago. For H₀ = 70 that is 14 billion years. What if H₀ were <b>140</b>?</p><ol><li>Twice the rate means the same distances are covered in half the time.</li><li>14 ÷ 2 = <b>7 billion years</b>.</li></ol><p>Faster expansion now means a younger universe.</p>',
  idea: '<p>Four things to hold on to.</p><ol><li>Space stretches: every gap grows by the same factor, so speed goes as distance.</li><li>No centre and no edge: every galaxy sees the same thing.</li><li>Light is stretched as much as space has grown since it set out.</li><li>Run it backwards and everything was close and hot, 13.8 billion years ago, everywhere at once.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'twice',
    level: 1,
    make(rand) {
      const d = pickOne(rand, [50, 100, 200]);
      const k = pickOne(rand, [2, 3, 4, 10]);
      const v = d * 21;
      return { ask: 'How fast is the second receding?', show: `<p>A galaxy <b>${d} million light-years</b> away is receding at <b>${v.toLocaleString()} km/s</b>. Another is <b>${(d * k).toLocaleString()} million light-years</b> away.</p>`, outside: `<p class="soft">How many times further is the second?</p>`, ...choices(rand, `${(v * k).toLocaleString()} km/s`, [`${v.toLocaleString()} km/s`, `${(v * k * k).toLocaleString()} km/s`, `${(v + k * 100).toLocaleString()} km/s`]), why: `${k} times as far, ${k} times as fast: ${v.toLocaleString()} × ${k} = ${(v * k).toLocaleString()}.` };
    },
  },
  {
    id: 'stretch',
    level: 1,
    make(rand) {
      const k = pickOne(rand, [2, 3, 4, 5, 10]);
      return rand() < 0.5
        ? { ask: 'How big was the universe when that light set out?', show: `<p>A galaxy's light arrives with every wavelength stretched to <b>${k} times</b> its original length.</p>`, ...choices(rand, `${frac(1, k)} of its present size`, [`${frac(1, k * k)} of its present size`, `${k} times its present size`, `${frac(1, k + 1)} of its present size`]), why: `Light is stretched by as much as space has grown. Stretched ${k} times, so space was ${frac(1, k)} the size. (Redshift z = ${k - 1}.)` }
        : { ask: 'By how much are its wavelengths stretched on arrival?', show: `<p>Light set out from a galaxy when the universe was <b>${frac(1, k)}</b> of its present size.</p>`, ...choices(rand, `${k} times`, [`${k * k} times`, `${k - 1} times`, `${frac(1, k)} of the original`]), why: `The universe has grown ${k} times since, and the light with it. (Redshift z = ${k - 1}.)` };
    },
  },
  {
    id: 'wave',
    level: 2,
    make(rand) {
      const start = pickOne(rand, [400, 500, 600]);
      const k = pickOne(rand, [2, 3, 5, 10]);
      return { ask: 'At what wavelength does it arrive?', show: `<p>Light leaves a galaxy at <b>${start} nanometres</b>. Between then and now the universe has grown to <b>${k} times</b> the size.</p>`, ...numbers(rand, start * k, [start, start + k, start / k, start * k * k]), why: `${start} × ${k} = ${(start * k).toLocaleString()} nanometres${start * k > 750 ? ': pushed out of the visible and into the infrared' : ''}.` };
    },
  },
  {
    id: 'gaps',
    level: 2,
    make(rand) {
      const d = pickOne(rand, [10, 20, 40]);
      const k = pickOne(rand, [2, 3, 5]);
      const grow = pickOne(rand, [1.5, 2, 3]);
      return { ask: 'How much further did the far one move away than the near one?', show: `<p>Two galaxies lie in the same direction, <b>${d}</b> and <b>${d * k}</b> million light-years from us. The universe grows to <b>${grow} times</b> its size.</p>`, outside: `<p class="soft">Multiply both distances by ${grow}, and see how far each has moved.</p>`, ...choices(rand, `${k} times as far`, [`The same distance`, `${k * k} times as far`, `${tidy(grow)} times as far`].filter((o) => o !== `${k} times as far`)), why: `They are now at ${tidy(d * grow)} and ${tidy(d * k * grow)}. The near one moved ${tidy(d * (grow - 1))}, the far one ${tidy(d * k * (grow - 1))}: ${k} times as much, in the same time. Speed in proportion to distance.` };
    },
  },
  {
    id: 'age',
    level: 3,
    make(rand) {
      const [rateNow, years] = pickOne(rand, [[35, 28], [140, 7], [100, 9.8], [50, 19.6], [700, 1.4]] as [number, number][]);
      return { ask: 'How long ago, at that steady rate?', show: `<p>If the universe had always expanded at today's rate H₀, everything would have been together a time 1 ÷ H₀ ago. For H₀ = 70 (in the usual units) that is 14 billion years.</p><p>Suppose H₀ were <b>${rateNow}</b>.</p>`, ...choices(rand, `${years} billion years`, [`${tidy((rateNow / 70) * 14)} billion years`, '14 billion years', `${tidy(years / 2)} billion years`]), why: `${rateNow} is ${tidy(rateNow / 70)} times 70, so the time is 14 ÷ ${tidy(rateNow / 70)} = ${years} billion years. Faster now, younger.` };
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

let a = 1;
let widest = 1;
let home: [number, number] = [0, 0];
let moved = false;
let then = 1;
let smallest = 1;
let history: History = 'ours';
let t = 0;
let earliest = 0;
const seen = new Set<History>(['ours']);
const TINT = ['#ffe9a8', '#b9c4ff', '#ff9ab8', '#8fe0a4', '#e9e6f5'];

function field(): string {
  const W = 460;
  const Ht = 300;
  const gap = 58 * a;
  let g = DEFS + stars(W, Ht, 40, 51);
  let arrows = '';
  let dots = '';
  for (let i = -9; i <= 9; i++) {
    for (let j = -7; j <= 7; j++) {
      const x = W / 2 + (i - home[0]) * gap;
      const y = Ht / 2 + (j - home[1]) * gap;
      if (x < -20 || x > W + 20 || y < -20 || y > Ht + 20) continue;
      const here = i === home[0] && j === home[1];
      const tint = TINT[((i * 7 + j * 13) % 5 + 5) % 5];
      if (!here) {
        // Each galaxy's speed away from where she stands: in proportion to how far it is.
        const dx = (i - home[0]) * 12;
        const dy = (j - home[1]) * 12;
        arrows += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${dx} ${dy}" stroke="#ff9a9a" stroke-width="1.6" opacity="0.7" marker-end="url(#tip)"/>`;
      }
      dots += `<g data-do="stand" data-v="${i},${j}" style="cursor:pointer"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="transparent"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${here ? 11 : 8}" ry="${here ? 6 : 4.5}" fill="${here ? '#e8c24a' : tint}" transform="rotate(${(i * 37 + j * 71) % 180} ${x.toFixed(1)} ${y.toFixed(1)})" ${here ? 'filter="url(#art-glow)"' : 'opacity="0.9"'}/></g>`;
    }
  }
  g += `<defs><marker id="tip" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#ff9a9a"/></marker></defs>` + arrows + dots;
  g += `<text x="${W / 2}" y="${Ht / 2 + 24}" font-size="12" text-anchor="middle" fill="#e8c24a">you are here</text>`;
  return `<svg viewBox="0 0 ${W} ${Ht}" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><p>The universe at <b>${tidy(Math.round(a * 100) / 100)}</b> times the size it began this picture with. Every gap has grown by that factor.</p>`;
}

/** Roughly the colour of light of a wavelength in nanometres; grey outside what eyes can see. */
function hue(nm: number): string {
  if (nm < 380 || nm > 750) return '#8d93b8';
  const stops: [number, string][] = [[380, '#7a2cff'], [450, '#3a55ff'], [490, '#00b0ff'], [530, '#22e07a'], [580, '#ffe600'], [620, '#ff8a00'], [750, '#d01000']];
  return stops.reduce((best, s) => (Math.abs(s[0] - nm) < Math.abs(best[0] - nm) ? s : best))[1];
}
function wave(): string {
  const grown = 1 / then;
  const draw = (y: number, length: number, colour: string) => {
    let d = '';
    for (let x = 30; x <= 430; x += 2) d += `${d ? 'L' : 'M'}${x} ${(y - 16 * Math.sin(((x - 30) / length) * Math.PI * 2)).toFixed(1)}`;
    return `<path d="${d}" stroke="${colour}" stroke-width="3" fill="none" filter="url(#art-glow)"/>`;
  };
  const sent = 450;
  const got = sent * grown;
  let g = DEFS + `<defs>${RAINBOW}</defs>`;
  g += `<text x="30" y="20" font-size="12">as it set out: ${sent} nanometres</text>` + draw(52, 26, hue(sent));
  g += `<text x="30" y="104" font-size="12">as it arrives: ${Math.round(got).toLocaleString()} nanometres</text>` + draw(138, 26 * grown, hue(got));
  const where = got < 750 ? 'still visible' : got < 1e6 ? 'in the infrared' : 'in the microwaves';
  return `<svg viewBox="0 0 460 170" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><p>The light set out when the universe was <b>${tidy(Math.round(then * 100) / 100)}</b> of its present size. Space has since grown <b>${tidy(Math.round(grown * 100) / 100)} times</b>, and the wave with it: it arrives ${where}. Astronomers call this a redshift of z = ${tidy(Math.round((grown - 1) * 100) / 100)}.</p>`;
}

const NAMES: Record<History, string> = { ours: 'matter and dark energy', matter: 'matter only', empty: 'nothing in it' };
const INK: Record<History, string> = { ours: '#e8c24a', matter: '#7fb6ff', empty: '#aab0d6' };
function histories(): string {
  const X = (time: number) => 50 + ((time + 1.05) / 1.85) * 390;
  const Y = (s: number) => 230 - (s / 2.2) * 200;
  let g = `<path d="M${X(-1.05)} ${Y(0)}H${X(0.8)}M${X(-1.05)} ${Y(0)}V${Y(2.2)}" stroke="#8d93b8" fill="none"/><path d="M${X(0)} ${Y(0)}V${Y(2.2)}" stroke="#5f6aa8" stroke-dasharray="3 4"/><text x="${X(0)}" y="${Y(2.2) - 4}" font-size="11" text-anchor="middle" opacity="0.8">now</text><path d="M${X(-1.05)} ${Y(1)}H${X(0.8)}" stroke="#2c3260" stroke-dasharray="3 4"/>`;
  for (const gyr of [-14, -10, -5, 5, 10]) g += `<path d="M${X(gyr / UNIT)} ${Y(0)}v5" stroke="#8d93b8"/><text x="${X(gyr / UNIT)}" y="${Y(0) + 18}" font-size="11" text-anchor="middle" opacity="0.7">${gyr > 0 ? '+' : ''}${gyr}</text>`;
  g += `<text x="${X(-0.1)}" y="${Y(0) + 36}" font-size="11" text-anchor="middle" opacity="0.8">billions of years from now →</text><text x="18" y="${Y(1.1)}" font-size="11" text-anchor="middle" opacity="0.8" transform="rotate(-90 18 ${Y(1.1)})">size of the universe →</text><text x="44" y="${Y(1) + 4}" font-size="10" text-anchor="end" opacity="0.7">1</text>`;
  for (const k of ['empty', 'matter', 'ours'] as History[]) {
    let d = '';
    for (let time = -began(k); time <= 0.8; time += 0.005) d += `${d ? 'L' : 'M'}${X(time).toFixed(1)} ${Y(Math.min(2.2, size(k, time))).toFixed(1)}`;
    g += `<path d="${d}" stroke="${INK[k]}" stroke-width="${k === history ? 3.5 : 1.5}" fill="none" opacity="${k === history ? 1 : 0.55}"/><circle cx="${X(-began(k))}" cy="${Y(0)}" r="4" fill="${INK[k]}" opacity="${k === history ? 1 : 0.55}"/>`;
  }
  const s = size(history, t);
  if (s > 0 && s <= 2.2) g += `<circle cx="${X(t)}" cy="${Y(s)}" r="7" fill="#fff" filter="url(#art-glow)"/>`;
  const when = Math.abs(t) < 0.004 ? 'Now' : `${tidy(Math.round(Math.abs(t) * UNIT * 10) / 10)} billion years ${t < 0 ? 'ago' : 'from now'}`;
  return `<svg viewBox="0 0 460 272" style="width:100%;max-width:560px;display:block;margin:auto">${DEFS}${g}</svg><p>A universe with <b>${NAMES[history]}</b>: it began <b>${tidy(Math.round(began(history) * UNIT * 10) / 10)} billion years ago</b>. ${when}, it ${s <= 0 ? 'had not yet begun' : 'is'} ${s <= 0 ? '' : `<b>${tidy(Math.round(s * 100) / 100)}</b> times its present size`}.</p><p class="soft">All three are expanding at the same rate today. They differ in how they got here.</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The size of the universe at any time, against its size now, is the <b>scale factor</b>, written a. Today a = 1.</li>
      <li>The stretch of light by the growth of space is the <b>cosmological redshift</b>. The number z is the stretch minus one, so that 1 + z = 1 ÷ a at the moment the light set out.</li>
      <li>That recession speed is in proportion to distance is <b>Hubble's law</b>, v = H₀ d (now also named for Georges Lemaître, who derived it from Einstein's equations in 1927). H₀ is the <b>Hubble constant</b>.</li>
      <li>That the universe looks alike from every place and in every direction, on the large scale, is the <b>cosmological principle</b>.</li>
      <li>The hot, dense early state, and the account of the universe expanding from it, is the <b>Big Bang</b>.</li>
      <li>Whatever is making the expansion speed up is called <b>dark energy</b>. If it is constant, as in the simplest account, it is the <b>cosmological constant</b>, Λ.</li>
    </ul>
    <p><b>How this is known.</b> Vesto Slipher found from 1912 that most galaxies' light is shifted to the red. Lemaître in 1927, and Hubble with measured distances in 1929, found the shift in proportion to distance. In 1998 two teams measuring distant supernovae found the expansion speeding up. The age that follows, 13.8 billion years, sits comfortably above the ages of the oldest stars, which is a real test: a universe of matter alone, expanding at today's rate, would be 9.7 billion years old, younger than stars that are in it.</p>
    <p><b>What is not known.</b> What dark energy is. Whether it is truly constant: surveys of galaxies since 2024 have given hints, not yet convincing, that it may be changing. What, if anything, came before the hot dense state: the equations run back to it and stop. And the exact present rate of expansion, on which two good measurements disagree. That is two chambers on.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Proportionality.</b> "y is in proportion to x", written y ∝ x, means y = k x for some fixed k: double one and the other doubles. On a graph it is a straight line through the origin, and k is its slope.</p>
      <p>A uniform stretch <i>must</i> give a proportion. If every distance d is multiplied by the same scale factor a(t), a galaxy now at distance d is at a·d, and its speed of recession is the rate of change of that:</p>
      <div class="eq">v = (da/dt) d &nbsp;&nbsp; = &nbsp;&nbsp; H d, &nbsp;&nbsp; with &nbsp;&nbsp; H = (da/dt) ÷ a</div>
      <p>The same H for every galaxy and from every place. H₀ is its value today: about 70 km/s for each million parsecs.</p>
      <p><b>An age from a rate.</b> 1 ÷ H₀ is a time: about 14 billion years. It is the age the universe would have if it had always expanded at today's rate. The true age depends on how the rate has changed, which depends on what is in the universe.</p>
      <p><b>The three curves</b> come from Einstein's equations applied to a uniform universe (Friedmann, 1922):</p>
      <div class="eq">(da/dt)² = H₀² ( Ω<sub>m</sub> / a + Ω<sub>Λ</sub> a² )</div>
      <p>Ω<sub>m</sub> is the share of matter and Ω<sub>Λ</sub> of dark energy. Matter's term shrinks as the universe grows; dark energy's grows. The gold curve has 31.5% matter and 68.5% dark energy, and was found by stepping this equation forward and back, as chamber 6 stepped an orbit.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://openstax.org/books/astronomy-2e/pages/26-thinking-ahead" target="_blank" rel="noopener">OpenStax Astronomy, chapter 26, Galaxies</a> (for Hubble's law) and <a href="https://openstax.org/books/astronomy-2e/pages/29-thinking-ahead" target="_blank" rel="noopener">chapter 29, The Big Bang</a>.</li>
      <li>See: <a href="https://lambda.gsfc.nasa.gov/education/graphic_history/" target="_blank" rel="noopener">NASA LAMBDA, a graphic history of cosmology</a>. How each number in this stage came to be measured, with the data.</li>
      <li>Read: <a href="https://www.einstein-online.info/en/category/elementary/cosmology-en/" target="_blank" rel="noopener">Einstein Online, Cosmology</a>. From the Max Planck Institute for Gravitational Physics.</li>
      <li>Read: <a href="https://www.nobelprize.org/prizes/physics/2011/summary/" target="_blank" rel="noopener">The Nobel Prize in Physics 2011</a>, for the discovery that the expansion is speeding up.</li>
      <li>Watch: <a href="https://www.youtube.com/playlist?list=PL8dPuuaLjXtPAJr1ysd5yGIyiSFuh0mIL" target="_blank" rel="noopener">Crash Course Astronomy</a>. The episodes on the Big Bang and dark energy.</li>
      <li>Book: Barbara Ryden, <i>Introduction to Cosmology</i>. The standard first textbook. This chamber is its chapters 2 to 5.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · space stretching', 'Every gap, by the same factor', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'expansion',
    kicker: 'The cosmos · 13',
    title: 'Space stretching',
    steps: [
      { say: 'In chamber 10 a distant galaxy\'s light was shifted to the red. Nearly every galaxy\'s is, and the further away, the more. ¶ Here is a field of galaxies, with you in the gold one. The red arrows show how fast each of the others is moving away. <b>Stretch space.</b>', until: () => widest >= 1.35 },
      { say: 'Nothing moved <i>through</i> space. Every gap simply grew by the same factor.', ask: ['Look at the arrows. A galaxy twice as far from you is receding:', ['At the same speed', 'Twice as fast', 'Half as fast'], 1, 'If every gap grows by a tenth, a gap of 10 grows by 1 and a gap of 20 by 2, in the same time. Speed in proportion to distance: that is what Hubble measured.'] },
      { say: 'It looks as though you are at the centre of an explosion. <b>Tap any other galaxy to stand there instead.</b>', until: () => moved },
      { say: 'The same picture: everything rushing away from wherever you stand.', ask: ['So where is the centre of the expansion?', ['At the first galaxy you stood in', 'At a point too far away to see', 'There is none: every galaxy sees the same thing'], 2, 'No centre, and no edge is needed either. And so the Big Bang was not an explosion at a place. Run the stretch backwards and <i>everywhere</i> was dense and hot at once.'] },
      { say: 'Now follow one wave of light across the stretching space, below. <b>Slide back to when the universe was half its present size.</b>', until: () => smallest <= 0.5 },
      { say: 'While the light travelled, the space it was crossing doubled, and the wave was stretched with it.', ask: ['A galaxy\'s light arrives stretched to four times its wavelength. How big was the universe when the light left?', ['Half its present size', 'A quarter of its present size', 'Four times its present size'], 1, 'The stretch of the light <i>is</i> the growth of the universe since it set out. So a redshift is not really a speed. It is a direct reading of how much smaller the universe was.'] },
      { say: 'If everything is moving apart, then earlier it was closer together. Below is the size of the universe through time. <b>Slide time back until the gold curve reaches zero.</b>', until: () => earliest <= -began('ours') + 0.02 },
      { say: 'The gold curve reaches zero 13.8 billion years ago. Before the hot, dense beginning the equations give nothing.', ask: ['The oldest stars known are about 13 billion years old. Look at the three curves. Which universe could <i>not</i> contain them?', ['The one with matter and dark energy', 'The one with matter only', 'The empty one'], 1, 'A universe of matter alone, expanding at today\'s rate, would be only 9.7 billion years old: younger than its own stars. In the 1990s that was a real puzzle. <b>Compare the curves yourself.</b>'] },
      { say: '<b>Look at each of the three universes in turn.</b> Matter\'s gravity slows the expansion, so the blue curve bends over. The gold one bends over at first, then bends the other way.', until: () => seen.size >= 3 },
      { say: 'In 1998, supernovae in distant galaxies were found to be fainter, and so further away, than a slowing universe allows.', ask: ['What is the expansion doing now?', ['Slowing down, as gravity requires', 'Holding steady', 'Speeding up'], 2, 'It slowed for about its first eight billion years and has been speeding up since. Whatever drives that is called dark energy; it makes up about two-thirds of everything, and nobody knows what it is.'] },
    ],
    summary: '<b>Space is stretching, everywhere alike.</b> So every galaxy sees the others recede, in proportion to their distance, with no centre. Light is stretched by exactly as much as space has grown since it set out. Run backwards, the stretching leads to a hot, dense beginning 13.8 billion years ago.',
    frame: () =>
      `<div id="field"></div><div class="bar"><span class="soft">smaller</span><input id="grow" type="range" min="0.6" max="1.6" step="0.01" value="1" style="flex:1"><span class="soft">larger</span></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A wave of light, crossing</div><div id="wave"></div><div class="bar"><span class="soft">set out long ago</span><input id="then" type="range" min="0.1" max="1" step="0.01" value="1" style="flex:1"><span class="soft">just now</span></div></div>` +
      `<div id="part3" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">The size of the universe, through time</div><div id="histories"></div><div class="bar"><span class="soft">the past</span><input id="time" type="range" min="-1.05" max="0.8" step="0.005" value="0" style="flex:1"><span class="soft">the future</span></div><div class="bar">${(['ours', 'matter', 'empty'] as History[]).map((k) => `<button class="chip pale" data-do="history" data-v="${k}">${NAMES[k]}</button>`).join('')}</div></div>`,
    paint: () => {
      $('field').innerHTML = field();
      $('wave').innerHTML = wave();
      $('histories').innerHTML = histories();
      run?.mark('history', (k) => k === history);
      const at = run?.step() ?? 0;
      ($('part2') as HTMLElement).hidden = at < 4;
      ($('part3') as HTMLElement).hidden = at < 6;
    },
    slide: (id, value) => {
      if (id === 'grow') {
        a = value;
        widest = Math.max(widest, a);
      } else if (id === 'then') {
        then = value;
        smallest = Math.min(smallest, then);
      } else {
        t = value;
        earliest = Math.min(earliest, t);
      }
    },
    act: (what, value) => {
      if (what === 'stand') {
        const [i, j] = value.split(',').map(Number);
        moved = moved || i !== home[0] || j !== home[1];
        home = [i, j];
      } else if (what === 'history') {
        history = value as History;
        seen.add(history);
      }
    },
    key: () => [['#e8c24a', 'where you stand; our universe'], ['#ff9a9a', 'speed away from you'], ['#7fb6ff', 'matter only'], ['#aab0d6', 'empty']],
    drawer,
    next: ['oldest', 'On to the oldest light'],
  });
  sh.draw();
}
expose(
  () => [...checkKinds(KINDS), ...checkCosmology(), ...(Math.abs(began('ours') * UNIT - 13.8) < 0.1 && Math.abs(began('matter') * UNIT - 9.67) < 0.05 && Math.abs(HUBBLE_TIME / 0.7 - 14) < 0.05 ? [] : ['the chamber\'s own figures'])],
  () => ({ a, home, then, history, t, done: sh.kept.chapter }),
);
