import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { PACES, beta, frac, rate, tidy } from './physics';
import { checkStrong, lag } from './strong';

/**
 * Wormholes.
 *
 * The one chamber so far about something nobody has seen. The equations of
 * general relativity allow a short tunnel joining two distant places; they
 * also say what it would take to hold one open, which is matter of a kind
 * not known to exist in any quantity; and they say that an open one could be
 * turned into a way of arriving before you set out, which is the best reason
 * to suspect that nature forbids it.
 *
 * So the chamber's job is partly to teach the difference between "measured",
 * "predicted" and "allowed on paper", using everything from the earlier
 * chambers: nothing here outruns light locally (3), the mouths' clocks are
 * the twins' (2), and what holds the throat open must make light rays spread
 * where ordinary matter makes them converge (5).
 *
 * Two figures: a race between light going round and a ship going through;
 * and a spacetime diagram of one mouth taken on a journey.
 */

const sh = new Shell('portal-worlds-cosmos-wormholes-v1');

// ---- Practice ----

/** 0: observed or measured. 1: predicted by well-tested theory, not yet observed. 2: allowed on paper only. */
const STANDING: [string, number, string][] = [
  ['Clocks running slower lower down', 0, 'Measured since 1960, and now across a millimetre.'],
  ['Black holes of a few Suns\' mass, and of millions', 0, 'Seen by the orbits of stars round them, heard merging in gravitational waves, and imaged.'],
  ['Gravitational waves', 0, 'First detected in September 2015, and many times since.'],
  ['Moving clocks running slow', 0, 'Measured with particles, aircraft and satellites.'],
  ['The bending of light by gravity', 0, 'First measured in 1919, and used every day in astronomy since.'],
  ['The slight attraction between two metal plates in a vacuum (the Casimir effect)', 0, 'Measured in the laboratory. It involves a tiny negative energy between the plates, which is why it comes up in talk of wormholes.'],
  ['The faint warmth felt by an accelerating observer (the Unruh effect)', 1, 'It follows from well-tested theory and is far too small to have been measured directly.'],
  ['The faint glow of a black hole (Hawking radiation)', 1, 'It follows from combining well-tested theories. For any real black hole it is far too faint to detect.'],
  ['The horizon of a ship that thrusts for ever', 1, 'It follows from special relativity alone. Nobody has flown the ship.'],
  ['A wormhole you could travel through', 2, 'The equations permit the shape. Holding it open needs matter of a kind not known to exist in bulk, and none has been seen.'],
  ['Large amounts of matter with negative energy', 2, 'Only minute quantum amounts have ever been found. Nothing known supplies a planet\'s worth.'],
  ['A machine for arriving before you left', 2, 'Some solutions of the equations contain such paths. Most physicists expect a deeper law to forbid them; none is proved.'],
];
const STANDING_WORDS = ['Observed or measured', 'Predicted by well-tested theory, not yet observed', 'Allowed on paper only, and needing things not known to exist'];
const IDEAS: [string, string, string[], string][] = [
  ['A ship reaches a distant star through a wormhole sooner than light going the ordinary way. Has the ship gone faster than light?', 'No: at every point it moved slower than light beside it. It took a shorter road', ['Yes: that is the point of a wormhole', 'Yes, but only inside the throat', 'No, because time stops inside'], 'The speed limit is local: nothing passes a light beam that is next to it. A wormhole changes the length of the road, not the limit.'],
  ['The first wormhole found in the equations, the Einstein–Rosen bridge of 1935, joins the inside of a black hole to another region. Could anything cross it?', 'No: it pinches shut faster than even light could get through', ['Yes, if it goes fast enough', 'Yes, once', 'Only light can'], 'Fuller and Wheeler showed this in 1962. A bridge made of ordinary gravity collapses too quickly to be crossed.'],
  ['What would a wormhole need, to stay open long enough to cross?', 'Something whose gravity pushes light rays apart: matter with negative energy', ['A great deal of ordinary mass', 'Very fast rotation', 'Nothing: it stays open by itself'], 'Rays entering one mouth converge toward the throat and must spread out again on the far side. Ordinary matter only ever makes rays converge, as in chamber 5.'],
  ['Why do most physicists doubt that usable wormholes exist?', 'They need matter not known to exist in quantity, and would allow arriving before you left', ['The equations forbid them outright', 'One was built and it failed', 'They would be too small to see'], 'Neither reason is a proof. Together they are why wormholes are filed under "allowed on paper".'],
  ['Has a wormhole ever been observed?', 'No', ['Yes, in 2019', 'Yes, several, at the centres of galaxies', 'Yes, in the laboratory'], 'What was imaged in 2019 and 2022 were black holes. Searches for the marks a wormhole would leave on starlight have found nothing.'],
  ['Why does a wormhole time machine trouble physicists more than the twins do?', 'The twins only age differently. A path that returns to its own past lets an effect come before its cause', ['It does not: they are the same thing', 'Because it would need too much fuel', 'Because clocks cannot be moved'], 'Chamber 3: causes and effects stay inside the light cone, in an order everyone agrees on. A path that closes on itself breaks that.'],
];

const EXAMPLES: Record<string, string> = {
  standing: '<p>Sort each claim by asking two questions.</p><ol><li><b>Has anyone measured or observed it?</b> If so: observed. (Slow clocks, bent light, black holes, gravitational waves.)</li><li>If not: <b>does it follow from theory that has passed every test, using only ingredients known to exist?</b> If so: predicted. (Hawking radiation, the Unruh effect.)</li><li>If it needs an ingredient nobody has found: <b>allowed on paper only</b>. (Wormholes you could cross, time machines.)</li></ol>',
  race: '<p>Two stars are <b>12 light-years</b> apart. A wormhole between them has a throat <b>2 light-years</b> long. A ship goes through at <b>1/3</b> of the speed of light.</p><ol><li>The ship: 2 ÷ 1/3 = 6 years.</li><li>Light, the long way: 12 years.</li><li>The ship wins by 12 − 6 = <b>6 years</b>.</li></ol><p>And light sent through the throat takes 2 years and beats the ship. Nothing overtook the light beside it.</p>',
  lag: '<p>One mouth of a wormhole is flown away and back at <b>12/13</b> of the speed of light. The trip takes <b>26 years</b> by outside clocks.</p><ol><li>The mouth is the travelling twin. At 12/13 its clock runs at 5/13.</li><li>Its clock records 26 × 5/13 = 10 years.</li><li>It is behind the clocks around it by 26 − 10 = <b>16 years</b>.</li></ol>',
  machine: '<p>The moved mouth\'s clock is <b>9 years</b> behind. The two mouths are <b>5 light-years</b> apart outside.</p><ol><li>Step into the moved mouth: you come out of the other 9 years earlier, by outside dates.</li><li>Hurry back outside at nearly the speed of light: 5 years.</li><li>−9 + 5 = −4. You arrive <b>4 years before you left</b>.</li></ol><p>Had the lag been 3 years: −3 + 5 = +2, two years after you left. No paradox, only a quick round trip.</p>',
  idea: '<p>Three things to hold on to.</p><ol><li>A wormhole would be a shorter road, not a way of outrunning light: the limit is always against the light beside you.</li><li>The equations allow the shape, and demand negative energy to hold it open. Ordinary matter makes light rays converge; this must make them spread.</li><li>None has been seen, and an open one could be made into a time machine, which is why most physicists expect something to forbid it.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'standing',
    level: 1,
    make(rand) {
      const [what, where, why] = pickOne(rand, STANDING);
      return { ask: 'What is its standing?', show: `<p><b>${what}.</b></p>`, outside: `<p class="soft">Has it been measured? If not, does it need anything nobody has ever found?</p>`, options: STANDING_WORDS, right: where, why };
    },
  },
  {
    id: 'race',
    level: 1,
    make(rand) {
      for (;;) {
        const D = pickOne(rand, [8, 10, 12, 20]);
        const L = pickOne(rand, [1, 2, 3]);
        const k = pickOne(rand, [2, 3, 4]);
        if (L * k >= D) continue;
        return { ask: 'By how many years does the ship beat the light?', show: `<p>Two stars are <b>${D} light-years</b> apart. A wormhole joins them, with a throat <b>${L} ${L === 1 ? 'light-year' : 'light-years'}</b> long. At the same moment, a flash of light sets off the ordinary way and a ship sets off through the throat at <b>${frac(1, k)}</b> of the speed of light.</p>`, outside: `<p class="soft">Time is distance divided by speed, for each of them, each along its own road.</p>`, ...numbers(rand, D - L * k, [D - L, L * k, D - k]), why: `The ship takes ${L} ÷ ${frac(1, k)} = ${L * k} years; the light takes ${D}. ${D} − ${L * k} = ${D - L * k}. The ship never passed any light that was beside it.` };
      }
    },
  },
  {
    id: 'lag',
    level: 2,
    make(rand) {
      const p = pickOne(rand, PACES);
      const k = 1 + Math.floor(rand() * 2);
      const T = p.c * k;
      return { ask: 'By how much is the moved mouth\'s clock behind the clocks around it?', show: `<p>One mouth of a wormhole is flown away and back at <b>${frac(p.a, p.c)}</b> of the speed of light. The round trip takes <b>${T} years</b> by outside clocks.</p>`, outside: `<p class="soft">The mouth is the travelling twin. How much time does its own clock record?</p>`, ...numbers(rand, (p.c - p.b) * k, [p.b * k, T, p.a * k]), why: `Its clock runs at ${frac(p.b, p.c)}, recording ${p.b * k} years. ${T} − ${p.b * k} = ${(p.c - p.b) * k}.` };
    },
  },
  {
    id: 'machine',
    level: 3,
    make(rand) {
      let behind = 2 + Math.floor(rand() * 11);
      const D = 2 + Math.floor(rand() * 9);
      if (behind === D) behind += 1;
      const net = D - behind;
      const say = (n: number) => (n > 0 ? `${n} ${n === 1 ? 'year' : 'years'} after you left` : `${-n} ${n === -1 ? 'year' : 'years'} before you left`);
      return { ask: 'When do you get back to where you started?', show: `<p>A wormhole's moved mouth has a clock <b>${behind} years</b> behind the clocks around it. Outside, the two mouths are <b>${D} light-years</b> apart. You step into the moved mouth, come straight out of the other, and hurry back the ordinary way at very nearly the speed of light.</p>`, outside: `<p class="soft">Through the throat you lose ${behind} years of outside date. The road back costs ${D}.</p>`, ...choices(rand, say(net), [say(-net), say(D), say(-behind), say(D + behind)]), why: `−${behind} through the throat, +${D} on the road: ${net > 0 ? '+' : '−'}${Math.abs(net)}. ${net < 0 ? 'A path that returns to its own past. This is the reason most physicists expect that something forbids it.' : 'Later than you left, so nothing is contradicted. The lag must exceed the distance for trouble.'}` };
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

const FAR = 10; // light-years from A to B, the ordinary way
let open = false;
let throat = 1;
let pace = 0.5;
let now = 0;
let nowMax = 0;

const APART = 6; // light-years between the mouths in the second figure
let v = 0.8;
let trip = 4;

/** A point a fraction f of the way from A to B along the ordinary road, which is drawn folded over. */
function road(f: number): [number, number] {
  const arm = 240;
  const bend = Math.PI * 95;
  const d = f * (2 * arm + bend);
  if (d <= arm) return [360 - d, 60];
  if (d <= arm + bend) {
    const a = (d - arm) / 95;
    return [120 - 95 * Math.sin(a), 155 - 95 * Math.cos(a)];
  }
  return [120 + (d - arm - bend), 250];
}

function race(): string {
  let g = '';
  let d = '';
  for (let i = 0; i <= 100; i++) {
    const [x, y] = road(i / 100);
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  g += `<path d="${d}" stroke="#4a5080" stroke-width="14" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#8d93b8" stroke-width="1" fill="none" stroke-dasharray="2 6"/>`;
  g += `<text x="40" y="160" font-size="12" text-anchor="middle" transform="rotate(-90 40 160)">the ordinary road: ${FAR} light-years</text>`;
  if (open) {
    g += `<path d="M346 66Q358 155 346 244M374 66Q362 155 374 244" stroke="#b9c4ff" stroke-width="2" fill="none"/><path d="M346 66L374 66M346 244L374 244" stroke="#b9c4ff" stroke-width="2"/><text x="386" y="158" font-size="12" fill="#b9c4ff">the throat:</text><text x="386" y="174" font-size="12" fill="#b9c4ff">${tidy(throat)} light-${throat === 1 ? 'year' : 'years'}</text>`;
    const s = Math.min(1, (pace * now) / throat);
    const l = Math.min(1, now / throat);
    g += `<circle cx="353" cy="${66 + 178 * l}" r="5" fill="#e8c24a"/><rect x="361" y="${60 + 178 * s}" width="10" height="12" fill="#7fb6ff"/>`;
  }
  const [lx, ly] = road(Math.min(1, now / FAR));
  g += `<circle cx="${lx}" cy="${ly}" r="7" fill="#e8c24a"/>`;
  g += `<circle cx="360" cy="60" r="11" fill="#0b0e22" stroke="#fff" stroke-width="2"/><text x="360" y="64" font-size="12" text-anchor="middle">A</text><circle cx="360" cy="250" r="11" fill="#0b0e22" stroke="#fff" stroke-width="2"/><text x="360" y="254" font-size="12" text-anchor="middle">B</text>`;
  g += `<text x="230" y="158" font-size="11" text-anchor="middle" opacity="0.6">(the gap between the arms is not part of space)</text>`;
  const ship = throat / pace;
  const told = open ? `Year <b>${tidy(now)}</b>. The gold dots are light, the blue block is the ship. Through the throat, light takes ${tidy(throat)} ${throat === 1 ? 'year' : 'years'} and the ship ${tidy(ship)}; the light that went round takes ${FAR}.` : `Year <b>${tidy(now)}</b>. The gold dot is light, going from A to B the only way there is.`;
  return `<svg viewBox="0 0 460 300" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p>${told}</p>`;
}

function machine(): string {
  const U = 16;
  const X = (x: number) => 56 + x * U;
  const Y = (t: number) => 470 - t * U;
  const TOP = 28;
  const T = trip;
  const out = (v * T) / 2;
  const behind = lag(T, v);
  /** Where mouth B is at an outside time, and what its own clock reads. */
  const B = (t: number): { x: number; own: number } => {
    if (t <= 1) return { x: APART, own: t };
    if (t <= 1 + T / 2) return { x: APART + v * (t - 1), own: 1 + (t - 1) * rate(v) };
    if (t <= 1 + T) return { x: APART + out - v * (t - 1 - T / 2), own: 1 + (t - 1) * rate(v) };
    return { x: APART, own: t - behind };
  };
  let g = '';
  // The throat: it joins the two mouths wherever their own clocks agree.
  for (let own = 0; own <= TOP; own += 2) {
    // The outside time at which B's own clock reads this.
    const t = own <= 1 ? own : own <= 1 + T * rate(v) ? 1 + (own - 1) / rate(v) : own + behind;
    if (t <= TOP) g += `<line x1="${X(0)}" y1="${Y(own)}" x2="${X(B(t).x).toFixed(1)}" y2="${Y(t).toFixed(1)}" stroke="#b9c4ff" stroke-width="1" stroke-dasharray="2 5"/>`;
  }
  g += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(TOP)}" stroke="#e8c24a" stroke-width="4"/>`;
  let d = '';
  for (let t = 0; t <= TOP; t += 0.25) d += `${d ? 'L' : 'M'}${X(B(t).x).toFixed(1)} ${Y(t).toFixed(1)}`;
  g += `<path d="${d}" stroke="#7fb6ff" stroke-width="4" fill="none" stroke-linejoin="round"/>`;
  for (let t = 4; t < TOP; t += 4) g += `<text x="${X(0) - 10}" y="${Y(t) + 4}" font-size="11" text-anchor="end" opacity="0.7">${t}</text>`;
  // You: into B a year after it is home, out of A, and back by the ordinary road at the speed of light.
  const enter = 2 + T;
  const exit = enter - behind;
  const back = exit + APART;
  g += `<line x1="${X(APART)}" y1="${Y(enter)}" x2="${X(0)}" y2="${Y(exit)}" stroke="#ff9ab8" stroke-width="2.5" stroke-dasharray="6 4"/><line x1="${X(0)}" y1="${Y(exit)}" x2="${X(APART)}" y2="${Y(back)}" stroke="#ff9ab8" stroke-width="2.5"/>`;
  g += `<circle cx="${X(APART)}" cy="${Y(enter)}" r="6" fill="#ff9ab8"/><circle cx="${X(0)}" cy="${Y(exit)}" r="5" fill="#ff9ab8"/><circle cx="${X(APART)}" cy="${Y(back)}" r="6" fill="${back < enter ? '#ff9a9a' : '#8fe0a4'}" stroke="#fff" stroke-width="1.5"/>`;
  g += `<text x="${X(APART) + 10}" y="${Y(enter) + 4}" font-size="11" fill="#ff9ab8">you step in</text><text x="${X(APART) + 10}" y="${Y(back) + (Math.abs(back - enter) < 1.2 ? (back < enter ? 16 : -8) : 4)}" font-size="11" fill="${back < enter ? '#ff9a9a' : '#8fe0a4'}">you are back</text>`;
  g += `<text x="${X(0)}" y="${Y(0) + 16}" font-size="12" text-anchor="middle" fill="#e8c24a">mouth A</text><text x="${X(APART)}" y="${Y(0) + 16}" font-size="12" text-anchor="middle" fill="#7fb6ff">mouth B</text><text x="16" y="${Y(14)}" font-size="11" text-anchor="middle" opacity="0.7" transform="rotate(-90 16 ${Y(14)})">outside date, years →</text>`;
  const net = back - enter;
  const verdict = Math.abs(net) < 0.005 ? 'You are back at the very moment you left.' : net > 0 ? `You are back <b>${tidy(net)} years after</b> you left. Nothing is contradicted.` : `<span class="bad">You are back <b>${tidy(-net)} years before</b> you left.</span>`;
  return `<svg viewBox="0 0 400 494" style="width:100%;max-width:480px;display:block;margin:auto">${g}</svg><p>Mouth B was away for ${tidy(T)} years at ${tidy(v)} of light speed, and its clock is now <b>${tidy(behind)} years</b> behind the clocks around it. You step into B in year ${tidy(enter)}, come out of A in year ${tidy(exit)}, and return to B by the ordinary road, ${APART} light-years, at the speed of light. ${verdict}</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>A <b>wormhole</b> is a solution of Einstein's equations in which two places are joined by a tunnel, the <b>throat</b>, with a <b>mouth</b> at each end.</li>
      <li>The first found, in 1935, is the <b>Einstein–Rosen bridge</b>. It cannot be crossed: it pinches shut too fast (Fuller and Wheeler, 1962).</li>
      <li>One that could be crossed is a <b>traversable wormhole</b> (Morris and Thorne, 1988). It must be held open by <b>exotic matter</b>: matter with negative energy.</li>
      <li>A path through spacetime that returns to its own past is a <b>closed timelike curve</b>. Hawking's proposal that the laws of physics always prevent one is the <b>chronology protection conjecture</b> (1992). It is a conjecture.</li>
    </ul>
    <p><b>Where this stands.</b></p>
    <ul class="terms">
      <li><b>Established:</b> the equations of general relativity have wormhole solutions. That is mathematics.</li>
      <li><b>Established:</b> minute amounts of negative energy exist. The Casimir effect, a slight attraction between metal plates in a vacuum, has been measured.</li>
      <li><b>Not known:</b> whether negative energy can exist in the quantity needed. For a throat a metre across the need is, very roughly, the mass of a giant planet, negative.</li>
      <li><b>Not observed:</b> any wormhole, of any size.</li>
      <li><b>Argued over:</b> whether a deeper law forbids them, and what wormholes on paper are telling us about quantum gravity. That last question comes back at the end of the map.</li>
    </ul></div>
    <details><summary>The math underneath</summary><div class="card">
      <p>Nothing new is needed, which is the point: every piece of this chamber is an earlier one.</p>
      <p><b>The race</b> is distance ÷ speed, along two different roads. The speed limit of chamber 3 is about light cones at each point, and at no point does the ship leave its own.</p>
      <p><b>The moved mouth</b> is the travelling twin of chamber 2. Away for T years at speed v, its clock falls behind by</p>
      <div class="eq">T − T √(1 − v²)</div>
      <p><b>The time machine.</b> Through the throat you lose that much outside date. Coming back by the ordinary road costs at least the distance D between the mouths. You arrive before you left when</p>
      <div class="eq">T − T √(1 − v²) &gt; D</div>
      <p><b>Why negative energy.</b> Light rays going into a mouth draw together toward the throat, and coming out of the other they spread apart again. In chamber 5, drawing together was what the gravity of ordinary matter does to neighbouring straight paths. Something in the throat must do the opposite, and in Einstein's equations only negative energy does.</p>
      <p><b>Reading the first picture.</b> The band is space, with one of its three directions kept and two thrown away. It is drawn folded so that the throat can be drawn short; the fold is not real, and the page the band is drawn on is not part of space.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://doi.org/10.1119/1.15620" target="_blank" rel="noopener">Morris and Thorne, "Wormholes in spacetime and their use for interstellar travel: A tool for teaching general relativity"</a> (American Journal of Physics, 1988). The original paper, written for students and free to read. Demanding, and the source of nearly everything here.</li>
      <li>Read: <a href="https://math.ucr.edu/home/baez/physics/Relativity/GR/time_travel.html" target="_blank" rel="noopener">Time Travel: Fact or Fiction?</a>, from the Usenet Physics FAQ. Short, sober, with references.</li>
      <li>Read: <a href="https://plato.stanford.edu/entries/time-machine/" target="_blank" rel="noopener">Stanford Encyclopedia of Philosophy, Time Machines</a>. What it would even mean for physics to allow one. Written by philosophers of physics, and careful about what is and is not shown.</li>
      <li>Book: Kip Thorne, <i>Black Holes and Time Warps</i> (1994), the last chapter. The history told by the person who started it. Not free; most libraries have it.</li>
      <li>Read: <a href="https://www.einstein-online.info/en/spotlight/singularities/" target="_blank" rel="noopener">Einstein Online, Spacetime singularities</a>. On where general relativity stops giving answers, which is the same boundary these questions sit on.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · wormholes', 'Measured, predicted, or only allowed?', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'wormholes',
    kicker: 'Horizons · 9',
    title: 'Wormholes',
    steps: [
      { say: 'This chamber is different from the others: nobody has ever seen what it is about. It is here because the equations allow it, and because working out why it probably does not exist uses everything so far. The band is space; A and B are two stars 10 light-years apart. <b>Open the wormhole.</b>', until: () => open },
      { say: 'A tunnel through, one light-year long. At year 0 a flash of light leaves A for B the ordinary way, and a ship leaves A through the throat at half the speed of light. <b>Slide time forward until the ship arrives.</b>', until: () => nowMax >= throat / pace },
      { say: 'The ship is at B, and the light that went round is nowhere near.', ask: ['Has the ship gone faster than light?', ['Yes', 'No: it never passed any light that was beside it. It took a shorter road'], 1, 'Light sent through the throat beat the ship easily. The speed limit of chamber 3 is local: it is about the light cone where you are. A wormhole would leave every light cone alone and change how the places are joined up.'] },
      { say: 'So nothing so far is broken.', ask: ['Does general relativity allow such a shape?', ['No', 'Yes, as a shape; but it also says what must be there to hold it open'], 1, 'Light rays entering a mouth converge toward the throat, and must spread again on the way out. Ordinary matter and energy only make rays converge. Holding a throat open takes something that does the opposite: negative energy, of which only the faintest traces have ever been found.'] },
      { say: 'The equations allow it. That is all that has been said so far.', ask: ['Has a wormhole ever been observed?', ['Yes', 'No'], 1, 'None, of any size. Now the deeper trouble. Suppose one existed anyway.'] },
      { say: 'Below, a new picture: the spacetime diagram, with the two mouths 6 light-years apart. Mouth B is towed away and brought back: the travelling twin. The faint dotted lines are the throat, which joins the mouths wherever <i>their own clocks</i> agree, because the throat is short and went nowhere. <b>Lengthen the trip and watch those lines tilt.</b>', until: () => lag(trip, v) >= 3 },
      { say: 'Mouth B\'s clock is now years behind the clocks around it; but looking through the throat, the two mouths\' clocks still agree.', ask: ['You step into B. Where and when do you come out?', ['At A, on the same outside date', 'At A, on an earlier outside date', 'At A, on a later outside date'], 1, 'The pink dashes are you, going through. You come out of A years earlier than you went in, by every calendar outside. Then you travel back to B the ordinary way, which takes at least 6 years.'] },
      { say: '<b>Now make the trip fast enough and long enough that you get back to B before you left.</b>', until: () => lag(trip, v) > APART + 0.01 },
      { say: 'When the lag is more than the distance between the mouths, you can be standing at B to watch yourself step in.', ask: ['What do physicists make of that?', ['It shows time travel is possible', 'Most take it as a sign that something forbids such a wormhole; nobody has proved what', 'It has already been done with single particles'], 1, 'Chamber 3 said causes come before effects for everyone, because effects stay inside the light cone. A path that returns to its own past breaks that, and nothing of the kind has ever been seen. Hawking conjectured in 1992 that the laws of physics always step in. The conjecture is not proved; settling it needs a theory of gravity and quantum physics together.'] },
    ],
    summary: '<b>A wormhole is a fair question put to the equations, and so far the answers are: the shape is allowed; the stuff to hold it open is not known to exist; and one that stayed open could be made into a time machine, which is the best reason to think nature says no.</b> None has been seen. Keep this chamber as the pattern for sorting any claim: measured, predicted, or only allowed.',
    frame: () =>
      `<div id="race"></div><div class="bar"><span class="soft">year 0</span><input id="now" type="range" min="0" max="${FAR}" step="0.05" value="0" style="flex:1"><span class="soft">year ${FAR}</span></div>` +
      `<div class="bar"><button class="chip pale" data-do="open" data-v="on">open the wormhole</button>${[0.5, 1, 2].map((l) => `<button class="chip pale" data-do="throat" data-v="${l}">throat ${l}</button>`).join('')}${[0.5, 0.8].map((p) => `<button class="chip pale" data-do="pace" data-v="${p}">ship at ${p}</button>`).join('')}</div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">One mouth, taken on a journey</div><div id="machine"></div><div class="bar"><span class="soft">a short trip</span><input id="trip" type="range" min="2" max="24" step="0.5" value="4" style="flex:1"><span class="soft">24 years</span></div><div class="bar">${PACES.filter((p) => [0.6, 0.8].includes(beta(p)) || p.a === 12).map((p) => `<button class="chip pale" data-do="v" data-v="${beta(p)}">towed at ${frac(p.a, p.c)}</button>`).join('')}</div></div>`,
    paint: () => {
      $('race').innerHTML = race();
      $('machine').innerHTML = machine();
      run?.mark('open', () => open);
      run?.mark('throat', (k) => Number(k) === throat);
      run?.mark('pace', (k) => Number(k) === pace);
      run?.mark('v', (k) => Math.abs(Number(k) - v) < 1e-9);
      ($('part2') as HTMLElement).hidden = (run?.step() ?? 0) < 5;
    },
    slide: (id, value) => {
      if (id === 'now') {
        now = value;
        nowMax = Math.max(nowMax, value);
      } else trip = value;
    },
    act: (what, value) => {
      if (what === 'open') open = !open;
      else if (what === 'throat') throat = Number(value);
      else if (what === 'pace') pace = Number(value);
      else if (what === 'v') v = Number(value);
    },
    drawer,
  });
  sh.draw();
}
expose(
  () => [...checkKinds(KINDS), ...checkStrong(), ...(Math.abs(lag(20, 0.8) - 8) < 1e-9 && Math.abs(lag(26, 12 / 13) - 16) < 1e-9 && Math.abs((299792458 ** 2 * 0.5) / 6.6743e-11 / 1.898e27 - 0.355) < 0.01 ? [] : ['the chamber\'s own figures'])],
  () => ({ open, now, trip, v, lag: lag(trip, v), done: sh.kept.chapter }),
);
