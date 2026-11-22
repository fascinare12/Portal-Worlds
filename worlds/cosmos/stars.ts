import { Shell, checkKinds, choices, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS, star, starColour, stars } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { tidy } from './physics';
import { checkStarlight, fate, lifetime, luminosity, radius, surface } from './starlight';
import type { Fate } from './starlight';

/**
 * The life of a star.
 *
 * A star is a balance: gravity pulling everything inward, and the pressure
 * of hot gas pushing out, kept hot by fusion at the centre. The balance
 * holds itself, like a thermostat. And one number, the mass, settles nearly
 * everything else: how bright the star is, what colour, how long it lasts,
 * and what is left at the end.
 *
 * Two figures: a star that can be squeezed, puffed up and starved, to see
 * the balance restore itself; and a star whose mass can be set.
 *
 * The first is a cartoon of the real feedback, and says so. The second uses
 * measured rules for brightness, size and temperature, and a rough rule for
 * the ending, whose upper boundaries are still argued over.
 */

const sh = new Shell('portal-worlds-cosmos-stars-v1');

const ENDS: Record<Fate, [string, string]> = {
  brown: ['a brown dwarf', 'Its centre never gets hot enough to fuse hydrogen. It glows dimly from the heat of its own shrinking, and fades.'],
  white: ['a white dwarf', 'It swells into a red giant, sheds its outer layers, and leaves its core bare: a white dwarf, about the size of the Earth, with no fusion, cooling for ever.'],
  neutron: ['a neutron star', 'It fuses its way up to iron, which yields nothing. The core collapses in under a second and the rest is blown off as a supernova. What is left is a neutron star: more than the Sun\'s mass in a ball some 20 km across.'],
  hole: ['a black hole', 'It ends as a neutron star would, but the collapsing core is too heavy for anything to hold up. A black hole.'],
};
function years(billions: number): string {
  if (billions >= 1000) return `${tidy(Math.round(billions / 100) / 10)} trillion years`;
  if (billions >= 1) return `${billions >= 100 ? Math.round(billions) : tidy(Math.round(billions * 10) / 10)} billion years`;
  return `${billions * 1000 >= 100 ? Math.round(billions * 1000) : tidy(Math.round(billions * 10000) / 10)} million years`;
}
const suns = (x: number) => (x >= 1000 ? Math.round(x / (x >= 1e5 ? 1000 : 10)) * (x >= 1e5 ? 1000 : 10) : x >= 10 ? Math.round(x) : x >= 0.01 ? Math.round(x * 100) / 100 : Number(x.toPrecision(1))).toLocaleString(undefined, { maximumFractionDigits: 5 });

// ---- Practice ----

const ORIGINS: [string, number, string][] = [
  ['hydrogen', 0, 'Hydrogen is the oldest thing there is: its nuclei are single protons, left from the first moments.'],
  ['most of the helium', 0, 'About a quarter of ordinary matter came out of the first few minutes as helium. Stars have added only a little since.'],
  ['the carbon in your body', 1, 'Carbon is made from helium in the cores of giant stars, and scattered when they shed their outer layers.'],
  ['the oxygen you breathe', 1, 'Oxygen is made by fusion inside massive stars, and thrown out when they explode.'],
  ['the calcium in bones', 1, 'Made inside massive stars in their last stages, and released in supernovae.'],
  ['gold', 2, 'Elements much heavier than iron need a flood of neutrons. The collision of two neutron stars seen in 2017 showed such a flood making heavy elements.'],
  ['uranium', 2, 'Nothing so heavy can be built by ordinary fusion. It takes the neutron flood of a stellar catastrophe.'],
  ['platinum', 2, 'Like gold: built by rapid capture of neutrons, in colliding neutron stars and perhaps some supernovae.'],
];
const ORIGIN_WORDS = ['The first minutes of the universe', 'Fusion inside stars', 'Stellar catastrophes: collapsing and colliding stars'];
const BALANCES: [string, boolean, string][] = [
  ['A marble resting at the bottom of a bowl is nudged', true, 'It rolls back. Whatever pushes it away is answered by something pushing it back.'],
  ['A pencil balanced on its point is nudged', false, 'The further it leans, the harder it is pulled over. The push grows instead of being answered.'],
  ['A room with a thermostat gets a little too warm', true, 'The heating cuts out and the room cools back. The change causes its own correction: negative feedback.'],
  ['The core of a star like the Sun gets a little too hot', true, 'Hotter gas pushes outward, the core expands, expanding cools it, and fusion slows. The star is its own thermostat.'],
  ['A microphone is brought too close to its own loudspeaker', false, 'The sound it picks up is made louder and picked up again. The change feeds itself: positive feedback, and a howl.'],
  ['The iron core of a massive star, which no fusion can heat, is squeezed a little', false, 'Squeezing iron releases nothing to push back with. It gives way, and in under a second the core has collapsed.'],
  ['A ball on the very top of a hill is nudged', false, 'It rolls away faster and faster.'],
  ['The Sun\'s core cools slightly and its fusion slows', true, 'With less push, gravity squeezes the core, squeezing heats it, and fusion picks up again.'],
];
const IDEAS: [string, string, string[], string][] = [
  ['A star of ten Suns has ten times the fuel of the Sun. How does its life compare?', 'Far shorter: it burns its fuel thousands of times faster', ['Ten times longer', 'About the same', 'Far longer: big stars burn slowly'], 'More mass means a hotter, denser centre, and fusion is ferociously sensitive to temperature. The fuel goes up tenfold and the burning several thousandfold.'],
  ['What holds a star like the Sun up against its own gravity?', 'The pressure of hot gas, kept hot by fusion at the centre', ['Its spin', 'A solid core', 'Nothing: it is slowly falling in'], 'Gravity pulls inward at every point, and the pressure of the hot gas pushes back exactly as hard. Fusion replaces the heat that leaks away as light.'],
  ['What holds up a white dwarf, which has no fusion?', 'A rule of quantum physics: electrons cannot be crowded into the same state', ['The heat left over from its youth', 'Its spin', 'Nothing: all white dwarfs are collapsing'], 'It is not heat, so it does not fade as the star cools. But it has a limit: above about 1.4 Suns of mass it fails. That is the Chandrasekhar limit.'],
  ['Will the Sun explode as a supernova?', 'No: it is far too light. It will swell, shed its outer layers, and leave a white dwarf', ['Yes, in about five billion years', 'Yes, but gently', 'Only if it gains mass from a comet'], 'A supernova of the collapsing kind needs about eight times the Sun\'s mass. The Sun has about five billion years of steady shining left.'],
  ['The smallest true stars, red dwarfs, are by far the commonest. Why has nobody ever seen one die?', 'They live far longer than the universe is old', ['They are too faint to watch', 'They do not die', 'They are too far away'], 'A star of a tenth of the Sun\'s mass sips its fuel for hundreds of billions of years or more. The universe is 13.8 billion years old. Every red dwarf ever made is still shining.'],
  ['How do we know fusion is going on at the centre of the Sun, which cannot be seen?', 'Neutrinos made by the fusion fly straight out, and are caught on Earth', ['The Sun is yellow', 'It was measured by a probe', 'It is only a theory, with no test'], 'Light takes many thousands of years to work its way out of the Sun. Neutrinos leave in two seconds and arrive eight minutes later. They are counted, deep underground, at the rate fusion predicts.'],
];

const EXAMPLES: Record<string, string> = {
  fate: '<p>A star is born with <b>12 times</b> the Sun\'s mass. What will it leave?</p><ol><li>The rough dividing lines: below 0.08, never a star (a brown dwarf). Up to about 8: a white dwarf. About 8 to 20: a neutron star. Above about 20: a black hole.</li><li>12 falls between 8 and 20: <b>a neutron star</b>, after a supernova.</li></ol><p>The lines at 8 and 20 are rough, and the upper one is still being worked out.</p>',
  origin: '<p>Where were the atoms of <b>nitrogen</b> made?</p><ol><li>Only hydrogen, most helium and a trace of lithium came from the first minutes.</li><li>Everything from carbon up to about iron is made by fusion inside stars.</li><li>Nitrogen sits between carbon and oxygen: <b>fusion inside stars</b>.</li></ol><p>The very heavy elements, such as gold and uranium, need the catastrophes: collapsing and colliding stars.</p>',
  balance: '<p>A balance is nudged. Ask one question: <b>does the nudge cause something that pushes back, or something that pushes further?</b></p><ol><li>A marble in a bowl: pushed up the side, it is pulled back down. <b>It holds.</b></li><li>A pencil on its point: leaning a little, it is pulled over more. <b>It runs away.</b></li></ol><p>A change that causes its own correction is negative feedback. One that feeds itself is positive feedback.</p>',
  bright: '<p>For stars heavier than the Sun, brightness goes roughly as mass to the power 3.5. How much brighter is a star of <b>4 Suns</b>?</p><ol><li>4 to the power 3.5 is 4 × 4 × 4 × √4.</li><li>64 × 2 = <b>about 128 times</b> as bright.</li></ol><p>The ".5" in the power is a square root: 4<sup>3.5</sup> = 4³ × 4<sup>½</sup>.</p>',
  life: '<p>The Sun will shine for about 10 billion years. How long does a star of <b>4 Suns</b> last?</p><ol><li>It has 4 times the fuel.</li><li>It burns it about 128 times as fast (4 to the power 3.5).</li><li>So it lasts 4 ÷ 128 = 1/32 as long: 10 billion ÷ 32 ≈ <b>300 million years</b>.</li></ol><p>Life goes as fuel ÷ burning rate, which comes to mass to the power −2.5.</p>',
  idea: '<p>What to hold on to.</p><ol><li>A star is a balance of gravity against pressure, and the balance corrects itself.</li><li>Mass settles the rest: heavier means hotter, bluer, enormously brighter and much shorter-lived.</li><li>Endings by mass: white dwarf, neutron star, black hole.</li><li>Nearly every element heavier than helium was made in stars.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'fate',
    level: 1,
    make(rand) {
      const M = pickOne(rand, [0.03, 0.05, 0.3, 0.5, 1, 3, 6, 10, 12, 15, 30, 50]);
      const all: Fate[] = ['brown', 'white', 'neutron', 'hole'];
      const f = fate(M);
      return { ask: 'What does it leave at the end?', show: `<p>A body forms with <b>${M} ${M === 1 ? 'time' : 'times'}</b> the mass of the Sun.</p>`, outside: `<p class="soft">The rough dividing lines are at 0.08, 8 and 20 Suns.</p>`, options: all.map((k) => `${ENDS[k][0][0].toUpperCase()}${ENDS[k][0].slice(1)}`), right: all.indexOf(f), why: ENDS[f][1] };
    },
  },
  {
    id: 'origin',
    level: 1,
    make(rand) {
      const [what, where, why] = pickOne(rand, ORIGINS);
      return { ask: 'Where was it made?', show: `<p>Think of <b>${what}</b>.</p>`, options: ORIGIN_WORDS, right: where, why };
    },
  },
  {
    id: 'balance',
    level: 1,
    make(rand) {
      const [what, holds, why] = pickOne(rand, BALANCES);
      return { ask: 'Does the balance restore itself, or run away?', show: `<p>${what}.</p>`, outside: `<p class="soft">Does the change cause something that pushes back, or something that pushes further the same way?</p>`, options: ['It restores itself', 'It runs away'], right: holds ? 0 : 1, why };
    },
  },
  {
    id: 'bright',
    level: 2,
    make(rand) {
      const [M, L] = pickOne(rand, [[4, 128], [9, 2187], [16, 16384]] as [number, number][]);
      const root = Math.sqrt(M);
      return { ask: 'About how many times as bright as the Sun is it?', show: `<p>For stars heavier than the Sun, brightness goes roughly as mass to the power 3.5.</p><p>A star has <b>${M} times</b> the Sun's mass.</p>`, outside: `<p class="soft">${M}<sup>3.5</sup> is ${M} × ${M} × ${M} × √${M}.</p>`, ...choices(rand, `About ${L.toLocaleString()} times`, [`About ${(M * 3.5).toLocaleString()} times`, `About ${(M * M * M).toLocaleString()} times`, `About ${(M * M).toLocaleString()} times`]), why: `${M} × ${M} × ${M} = ${M ** 3}, and √${M} = ${root}: ${(M ** 3).toLocaleString()} × ${root} = ${L.toLocaleString()}.` };
    },
  },
  {
    id: 'life',
    level: 2,
    make(rand) {
      const [M, f, right, wrong] = pickOne(rand, [
        [4, 32, 'About 300 million years', ['About 2.5 billion years', 'About 40 billion years', 'About 80 million years']],
        [9, 243, 'About 40 million years', ['About 1 billion years', 'About 90 billion years', 'About 5 million years']],
        [16, 1024, 'About 10 million years', ['About 600 million years', 'About 160 billion years', 'About 1 million years']],
      ] as [number, number, string, string[]][]);
      return { ask: 'About how long does it shine?', show: `<p>The Sun shines for about 10 billion years. A star's life is its fuel divided by the rate it burns it; and for stars heavier than the Sun, the burning rate goes roughly as mass to the power 3.5.</p><p>A star has <b>${M} times</b> the Sun's mass.</p>`, outside: `<p class="soft">${M} times the fuel, burned ${(f * M).toLocaleString()} times as fast.</p>`, ...choices(rand, right, wrong), why: `${M} times the fuel ÷ ${(f * M).toLocaleString()} times the burning = 1/${f.toLocaleString()} of the Sun's life. 10 billion ÷ ${f.toLocaleString()}: ${right.toLowerCase()}.` };
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

// The balance: the star's size against its size at rest, and how fast that is changing.
let size = 1;
let drift = 0;
let fuel = true;
let nudged = false;
let M = 1;
let heaviest = 1;
let lightest = 1;
const toM = (s: number) => 0.05 * Math.pow(1200, s);

function balance(): string {
  // A cartoon: the centre's temperature rises as the star is squeezed, and fusion with it, steeply.
  const core = 15.7 / size;
  const burn = fuel ? Math.pow(1 / size, 4) : 0;
  const r = 74 * size;
  let g = DEFS + stars(460, 250, 40, 17) + star(150, 125, r, fuel ? starColour(5772 / Math.sqrt(size)) : '#ffb27a');
  g += `<circle cx="150" cy="125" r="${Math.max(6, 18 * size)}" fill="#fff" opacity="${Math.min(0.95, 0.25 + burn * 0.35)}" filter="url(#art-glow)"/>`;
  // Gravity in, pressure out.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const p = (d: number) => `${(150 + Math.cos(a) * d).toFixed(1)} ${(125 + Math.sin(a) * d).toFixed(1)}`;
    g += `<path d="M${p(r + 30)}L${p(r + 8)}" stroke="#7fb6ff" stroke-width="3" stroke-linecap="round" marker-end="url(#in)"/>`;
    const b = a + 0.5;
    const q = (d: number) => `${(150 + Math.cos(b) * d).toFixed(1)} ${(125 + Math.sin(b) * d).toFixed(1)}`;
    const push = fuel ? 22 / size : 8;
    g += `<path d="M${q(Math.max(8, r - 12 - push))}L${q(r - 10)}" stroke="#e8c24a" stroke-width="3" stroke-linecap="round" marker-end="url(#out)"/>`;
  }
  g += `<defs><marker id="in" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#7fb6ff"/></marker><marker id="out" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#e8c24a"/></marker></defs>`;
  const bar = (label: string, value: number, full: number, colour: string, y: number, text: string) => `<text x="290" y="${y}" font-size="12">${label}</text><rect x="290" y="${y + 7}" width="150" height="9" rx="4" fill="rgba(255,255,255,0.1)"/><rect x="290" y="${y + 7}" width="${Math.max(0, Math.min(150, (value / full) * 150)).toFixed(1)}" height="9" rx="4" fill="${colour}"/><text x="290" y="${y + 32}" font-size="12" opacity="0.8">${text}</text>`;
  g += bar('size', size, 1.6, '#aab0d6', 40, `${tidy(Math.round(size * 100) / 100)} of its size at rest`);
  g += bar('temperature at the centre', core, 40, '#ff9ab8', 106, `${tidy(Math.round(core * 10) / 10)} million K`);
  g += bar('fusion', burn, 4, '#e8c24a', 172, fuel ? `${tidy(Math.round(burn * 100) / 100)} of its usual rate` : 'none: the hydrogen is gone');
  return `<svg viewBox="0 0 460 250" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg>`;
}

function built(): string {
  const f = fate(M);
  const L = luminosity(M);
  const life = lifetime(M);
  const T = surface(M);
  const R = radius(M);
  const px = (rad: number) => 6 + 16 * Math.pow(rad, 0.45);
  let g = DEFS + stars(460, 210, 34, 23);
  g += f === 'brown' ? star(110, 100, px(R), '#8a4a5a') : star(110, 100, px(R), starColour(T));
  g += `<circle cx="110" cy="100" r="${px(1)}" fill="none" stroke="#aab0d6" stroke-dasharray="3 4"/><text x="110" y="198" font-size="11" text-anchor="middle" opacity="0.7">dashed: the Sun's size</text>`;
  // How long it shines, on a scale where each mark is ten times the last.
  const X = (billions: number) => 240 + ((Math.log10(billions) + 3.6) / 7.6) * 200;
  g += `<text x="240" y="24" font-size="12">how long it shines</text><path d="M${X(0.001)} 78H${X(5000)}" stroke="#8d93b8"/>`;
  for (const [b, name] of [[0.001, '1 million'], [0.1, ''], [1, '1 billion'], [10, ''], [1000, '1 trillion'], [0.01, '']] as [number, string][]) g += `<path d="M${X(b)} 73v10" stroke="#8d93b8"/><text x="${X(b)}" y="98" font-size="10" text-anchor="middle" opacity="0.7">${name}</text>`;
  g += `<path d="M${X(13.8)} 52V86" stroke="#ff9a9a" stroke-dasharray="3 3"/><text x="${X(13.8)}" y="48" font-size="10" text-anchor="middle" fill="#ff9a9a">the universe's age</text>`;
  if (f !== 'brown') g += `<circle cx="${X(Math.min(4000, life)).toFixed(1)}" cy="78" r="7" fill="#e8c24a" filter="url(#art-glow)"/>`;
  g += `<text x="240" y="136" font-size="12">what it leaves</text><text x="240" y="160" font-size="16" fill="#e8c24a">${ENDS[f][0]}</text>`;
  const head = f === 'brown' ? `<b>${tidy(Math.round(M * 100) / 100)} Suns</b> of mass is too little to make a star.` : `A star of <b>${M >= 10 ? Math.round(M) : tidy(Math.round(M * 100) / 100)} ${M === 1 ? 'Sun' : 'Suns'}</b> shines about <b>${suns(L)}</b> ${L === 1 ? 'time' : 'times'} as brightly as the Sun, with a surface at about ${(Math.round(T / 100) * 100).toLocaleString()} K, for about <b>${years(life)}</b>.`;
  return `<svg viewBox="0 0 460 210" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><p>${head} ${ENDS[f][1]}</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The balance of gravity against pressure, at every depth, is <b>hydrostatic equilibrium</b>.</li>
      <li>The joining of light nuclei into heavier ones, with energy to spare, is <b>nuclear fusion</b>. A star that is fusing hydrogen in its core is on the <b>main sequence</b>, where it spends about nine-tenths of its life.</li>
      <li>That brightness climbs steeply with mass is the <b>mass–luminosity relation</b>.</li>
      <li>The remnants: a <b>white dwarf</b>, held up by <b>electron degeneracy pressure</b>, up to the <b>Chandrasekhar limit</b> of about 1.4 Suns; a <b>neutron star</b>, held up the same way by neutrons, up to a limit somewhere above 2 Suns; and beyond that a <b>black hole</b>.</li>
      <li>The explosion of a massive star whose core has collapsed is a <b>core-collapse supernova</b>. The making of elements in stars is <b>nucleosynthesis</b>.</li>
    </ul>
    <p><b>How this is known.</b> Not from watching a star live: nobody can. It is known from seeing millions of stars at every age at once, and from physics that can be tested here. Neutrinos from the fusion in the Sun's core have been counted since the 1960s, most precisely at Super-Kamiokande in Japan and the Sudbury Neutrino Observatory in Canada. When a star was seen to explode in 1987, in a small galaxy next to ours, about two dozen neutrinos from its collapsing core were caught in detectors in Japan, the United States and the Soviet Union, a few hours before the light arrived. White dwarfs and neutron stars are seen directly. And in 2017 the collision of two neutron stars was caught both in gravitational waves and in light, with the marks of freshly made heavy elements in its glow.</p>
    <p><b>What is rough, and what is not settled.</b> The brightness rule is a fit to measured stars, in four pieces, good to a factor of two or so. Lives worked out from it are estimates; for the smallest stars they come out too short, because those stars mix and burn nearly all their hydrogen. The dividing lines at about 8 and about 20 Suns are not sharp, and which heavy stars leave neutron stars and which leave black holes is an active question.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Balance and feedback.</b> A balance is <b>stable</b> if a small push away from it causes something that pushes back, and <b>unstable</b> if it causes something that pushes further. A change that brings about its own correction is <b>negative feedback</b>; one that feeds itself, <b>positive feedback</b>.</p>
      <p>A star with fusion in its core has negative feedback. Squeeze it: the centre heats, fusion speeds up steeply, pressure rises, the star swells back. In the language of chamber 5, the push back is in proportion to the displacement, and that same equation, d²x/dt² = −k x, gives a wobble round the balance that dies away. The first figure is that equation with a little friction.</p>
      <p><b>Power laws.</b> A rule of the form y = x<sup>a</sup> is a power law. The exponent need not be whole: x<sup>3.5</sup> means x³ × √x. Power laws have no built-in scale, so they are best seen with both quantities in powers of ten, where they become straight lines whose slope is the exponent.</p>
      <div class="eq">brightness ∝ M<sup>3.5</sup> &nbsp;&nbsp;&nbsp;&nbsp; life ∝ fuel ÷ burning ∝ M ÷ M<sup>3.5</sup> = M<sup>−2.5</sup></div>
      <p>Dividing powers of the same thing subtracts the exponents: 1 − 3.5 = −2.5. A negative exponent means "one over".</p>
      <p><b>The Sun's fuel bill.</b> The Sun gives out 3.8 × 10²⁶ watts. By E = mc², that is 4.3 million tonnes of mass turned to light every second. It has done so for 4.6 billion years and has used well under a thousandth of itself.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://openstax.org/books/astronomy-2e/pages/16-thinking-ahead" target="_blank" rel="noopener">OpenStax Astronomy, chapter 16, The Sun: A Nuclear Powerhouse</a>; <a href="https://openstax.org/books/astronomy-2e/pages/22-thinking-ahead" target="_blank" rel="noopener">chapter 22, Stars from Adolescence to Old Age</a>; and <a href="https://openstax.org/books/astronomy-2e/pages/23-thinking-ahead" target="_blank" rel="noopener">chapter 23, The Death of Stars</a>.</li>
      <li>See: <a href="https://www-sk.icrr.u-tokyo.ac.jp/en/sk/about/research/" target="_blank" rel="noopener">Super-Kamiokande, University of Tokyo</a>. The detector that counts the Sun's neutrinos, described by the people who run it.</li>
      <li>Read: <a href="https://www.nobelprize.org/prizes/physics/2002/summary/" target="_blank" rel="noopener">The Nobel Prize in Physics 2002</a> (Davis and Koshiba, for catching neutrinos from the Sun and from the 1987 supernova) and <a href="https://www.nobelprize.org/prizes/physics/1983/summary/" target="_blank" rel="noopener">1983</a> (Chandrasekhar, and Fowler for how the elements are made).</li>
      <li>See: <a href="https://www.eso.org/public/news/eso1733/" target="_blank" rel="noopener">European Southern Observatory, first light from a gravitational-wave source (2017)</a>. The colliding neutron stars, and the heavy elements in the wreckage.</li>
      <li>Watch: <a href="https://www.youtube.com/playlist?list=PL8dPuuaLjXtPAJr1ysd5yGIyiSFuh0mIL" target="_blank" rel="noopener">Crash Course Astronomy</a>. The episodes from "Stars" to "Neutron Stars".</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · the life of a star', 'Mass decides', 'Masses are in Suns. <b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'stars',
    kicker: 'Light and stars · 11',
    title: 'The life of a star',
    steps: [
      { say: 'A star is a ball of gas held together by its own gravity, which is always trying to crush it. What holds it up is the pressure of the gas, kept hot by fusion at the centre. ¶ <b>Blue</b> arrows are gravity; <b>gold</b> arrows are pressure. At the moment they balance. <b>Squeeze the star and watch.</b>', until: () => nudged },
      { say: 'It sprang back, wobbled, and settled where it was.', ask: ['What pushed it back out?', ['Squeezing heated the centre, fusion sped up, and the pressure rose', 'Gravity weakened', 'Nothing: it would have stayed squeezed'], 0, 'And puffing it up does the reverse: the centre cools, fusion slows, gravity pulls it back. Whatever you do to it causes its own correction. A star is a thermostat.'] },
      { say: 'That is why stars shine steadily for billions of years instead of going off like bombs.', ask: ['Suppose the centre of the Sun got a little too hot, and fusion sped up. What then?', ['It runs away and the Sun explodes', 'The core swells, cools, and fusion drops back', 'Nothing changes'], 1, 'Now see what happens when the correction fails. <b>Take away the fuel.</b>'] },
      { say: '<b>Take away the fuel:</b> let the hydrogen at the centre run out.', until: () => !fuel },
      { say: 'With nothing to replace the heat that leaks away, gravity wins and the core shrinks. But look at the temperature at the centre.', ask: ['As the starved core shrinks, what happens to its temperature?', ['It cools, since the fire is out', 'It rises: squeezing heats it', 'It stays the same'], 1, 'It heats, until at about 100 million K the helium left behind begins to fuse, and a new balance is found. Stars climb a ladder of fuels this way. How far up they get, and how fast, is settled by one number. ¶ Below is a star whose <b>mass</b> you can set.'] },
      { say: 'This is the Sun: one Sun of mass, ten billion years of steady shining. <b>Make it ten times as heavy.</b>', until: () => heaviest >= 10 },
      { say: 'Ten times the mass is ten times the fuel.', ask: ['So how long does it last, against the Sun?', ['Ten times as long', 'About as long', 'A few hundred times less long'], 2, 'It is thousands of times brighter, so it burns through ten times the fuel in about twenty million years. Heavy stars are blue, brilliant and brief.'] },
      { say: '<b>Now make it a fifth of the Sun\'s mass, or less.</b>', until: () => lightest <= 0.2 },
      { say: 'A dim red ember, which will last for hundreds of billions of years.', ask: ['The universe is 13.8 billion years old. How many of these small red stars have ever died of old age?', ['Most of them', 'About half', 'None'], 2, 'None. Every red dwarf ever made is still shining, and they are by far the commonest stars there are.'] },
      { say: '<b>Slide through all the masses</b> and read what each leaves behind.', until: () => heaviest >= 25 && lightest <= 0.07 },
      { say: 'Too small: never a star. Then white dwarfs, then neutron stars, then black holes.', ask: ['How will the Sun end?', ['As a supernova', 'By swelling, shedding its outer layers, and leaving a white dwarf', 'As a black hole'], 1, 'It is far too light to explode. In about five billion years it becomes a red giant, then a white dwarf the size of the Earth.'] },
      { say: 'One thing more. The first minutes of the universe made hydrogen, helium, and almost nothing else.', ask: ['Where did the carbon, oxygen and calcium in your body come from?', ['They were always there', 'They were made inside stars that died before the Sun was born', 'They were made in the Sun'], 1, 'Made by fusion in earlier stars and scattered when those stars died. The gold in a ring needed something rarer still: a collapsing or colliding star. The Sun and its planets formed from that enriched gas.'] },
    ],
    summary: '<b>A star is a balance that corrects itself, and its mass decides the rest.</b> Heavier means hotter, bluer, vastly brighter and far shorter-lived; and the mass at birth settles whether the end is a white dwarf, a neutron star or a black hole. Nearly every atom heavier than helium was made on the way.',
    frame: () =>
      `<div id="balance"></div><div class="bar"><button class="chip pale" data-do="nudge" data-v="-1">squeeze it</button><button class="chip pale" data-do="nudge" data-v="1">puff it up</button><button class="chip pale" data-do="fuel" data-v="off">take away the fuel</button></div><p class="soft">A cartoon of the real feedback: the directions are right, the sizes and speeds are not.</p>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A star of any mass</div><div id="built"></div><div class="bar"><span class="soft">0.05 Suns</span><input id="mass" type="range" min="0" max="1" step="0.002" value="${Math.log(1 / 0.05) / Math.log(1200)}" style="flex:1"><span class="soft">60 Suns</span></div><div class="bar">${[0.1, 0.5, 1, 2, 10, 30].map((m) => `<button class="chip pale" data-do="mass" data-v="${m}">${m}</button>`).join('')}</div></div>`,
    paint: () => {
      $('balance').innerHTML = balance();
      $('built').innerHTML = built();
      run?.mark('fuel', () => !fuel);
      run?.mark('mass', (k) => Math.abs(Number(k) - M) < 1e-6);
      ($('part2') as HTMLElement).hidden = (run?.step() ?? 0) < 5;
    },
    slide: (_id, value) => {
      M = toM(value);
      heaviest = Math.max(heaviest, M);
      lightest = Math.min(lightest, M);
    },
    act: (what, value) => {
      if (what === 'nudge') {
        drift += Number(value) * 1.6;
        nudged = true;
      } else if (what === 'fuel') fuel = !fuel;
      else if (what === 'mass') {
        M = Number(value);
        heaviest = Math.max(heaviest, M);
        lightest = Math.min(lightest, M);
        ($('mass') as HTMLInputElement).value = String(Math.log(M / 0.05) / Math.log(1200));
      }
    },
    key: () => [['#7fb6ff', 'gravity, inward'], ['#e8c24a', 'pressure, outward; fusion'], ['#ff9a9a', 'the universe\'s age']],
    drawer,
    next: ['ladder', 'On to the distance ladder'],
  });
  sh.draw();
  // The balance, stepped forward: pulled back toward where it rests, with a little friction.
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const rest = fuel ? 1 : 0.45;
    const pull = fuel ? 14 : 1.2;
    drift += (-pull * (size - rest) - (fuel ? 2.2 : 2.4) * drift) * dt;
    size = Math.max(0.3, Math.min(1.6, size + drift * dt));
    if (Math.abs(size - rest) > 0.002 || Math.abs(drift) > 0.002) $('balance').innerHTML = balance();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
expose(
  () => [...checkKinds(KINDS), ...checkStarlight(), ...(Math.abs(4 ** 3.5 - 128) < 1e-9 && Math.abs(9 ** 3.5 - 2187) < 1e-6 && lifetime(10) * 1000 > 15 && lifetime(10) * 1000 < 30 && fate(1) === 'white' && fate(12) === 'neutron' ? [] : ['the chamber\'s own figures'])],
  () => ({ size, fuel, M, fate: fate(M), done: sh.kept.chapter }),
);
