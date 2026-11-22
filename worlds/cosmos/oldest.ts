import { Shell, checkKinds, choices, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS, starColour, stars } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { MPC_MLY, THETA_SEEN, T_NOW, Z_CLEAR, ageAt, checkCosmology, distance, fromOldestLight, sound } from './cosmology';
import { frac, tidy } from './physics';

/**
 * The oldest light.
 *
 * Run the stretching backwards far enough and the universe is a glowing
 * fog: so hot that atoms cannot hold together, and so full of loose charged
 * particles that light cannot travel. When it cooled to about 3,000 degrees
 * the fog cleared, and the light that was in it has been travelling ever
 * since. It arrives from every direction, stretched eleven hundred times,
 * as microwaves.
 *
 * Before the fog cleared, sound could travel through it, and the ripples
 * were frozen in place when it did. Their size is known from physics, so
 * they make a ruler; and the angle the ruler spans on the sky gives the
 * distance to the oldest light, and from that the rate of expansion, without
 * any rung of the distance ladder.
 *
 * Three figures: the universe cooling and clearing; a ripple of sound
 * spreading and freezing; and the ruler, with the expansion rate to be set.
 */

const sh = new Shell('portal-worlds-cosmos-oldest-v1');
const H = 0.674;
const CLEAR = 1 / (1 + Z_CLEAR);
const RULER = sound();
const SEEN_DEG = (THETA_SEEN * 180) / Math.PI;

function years(billions: number): string {
  const y = billions * 1e9;
  if (y >= 1e9) return `${tidy(Math.round(y / 1e8) / 10)} billion years`;
  if (y >= 1e6) return `${Math.round(y / 1e6).toLocaleString()} million years`;
  if (y >= 1000) return `${(Math.round(y / 1000) * 1000).toLocaleString()} years`;
  return `${Math.round(y)} years`;
}
function wavelength(nm: number): string {
  if (nm >= 1e6) return `${tidy(Math.round(nm / 1e4) / 100)} millimetres`;
  if (nm >= 1e4) return `${tidy(Math.round(nm / 100) / 10)} thousandths of a millimetre`;
  return `${(Math.round(nm / 10) * 10).toLocaleString()} nanometres`;
}
const band = (nm: number) => (nm < 380 ? 'the ultraviolet' : nm < 750 ? 'visible light' : nm < 1e6 ? 'the infrared' : 'microwaves');

// ---- Practice ----

const WHEN: [string, number][] = [['the first helium nuclei', 1], ['the fog clearing and the oldest light setting out', 2], ['the first stars', 3], ['the Sun and the Earth', 4]];
const WHEN_WORDS: Record<number, string> = { 1: 'the first few minutes', 2: 'about 370,000 years', 3: 'one or two hundred million years', 4: 'about 9 billion years' };
const IDEAS: [string, string, string[], string][] = [
  ['Where in the sky does the oldest light come from?', 'Every direction, almost perfectly evenly', ['One spot, where the Big Bang happened', 'The plane of the Milky Way', 'The direction we are moving in'], 'The fog filled all of space, and we are inside what it filled. In every direction, far enough away, we are looking at the moment it cleared.'],
  ['Why can no telescope see further back than the oldest light?', 'Before it, the universe was opaque: light could not travel', ['There was nothing there', 'Telescopes are not yet big enough', 'That light has all been absorbed since'], 'Looking further is like trying to see into a flame. Earlier times can be reached only by other messengers: the mix of the first elements, and one day perhaps gravitational waves.'],
  ['The oldest light is the same temperature in every direction to one part in 100,000. What are the tiny differences?', 'Ripples of sound in the early fog, frozen when it cleared', ['Faults in the detectors', 'Heat from nearby stars', 'The motion of the Earth'], 'Slightly denser patches were slightly hotter. Those patches are also the seeds that gravity later grew into galaxies.'],
  ['Why does the sound ruler give a distance?', 'Its true size is known from physics, and its angle on the sky is measured', ['It is the same size as the Milky Way', 'Its light takes a known time to arrive', 'It does not: it gives only a temperature'], 'Chamber 12\'s small-angle rule: angle = size ÷ distance. The ruler is a standard ruler, as a Cepheid is a standard candle.'],
  ['The oldest light gives an expansion rate without using the distance ladder. What does it lean on instead?', 'The standard account of what the universe contains, between then and now', ['Nothing: it is a direct measurement', 'The brightness of supernovae', 'The parallax of nearby stars'], 'The angle fixes the distance to the oldest light. Turning that into today\'s expansion rate needs a model of how the universe expanded in between. If the model is missing something, the answer shifts.'],
  ['The oldest light was predicted before it was found. How was it found?', 'By accident, in 1965, as a hiss in a radio antenna that would not go away', ['By a satellite built to look for it', 'By Edwin Hubble, in 1929', 'It has been inferred but never detected'], 'Penzias and Wilson were testing an antenna, and even cleared pigeons out of it. Alpher and Herman had predicted such a glow in 1948, at about 5 degrees above absolute zero.'],
];

const EXAMPLES: Record<string, string> = {
  cool: '<p>The oldest light is now at 2.7 degrees above absolute zero. How hot was it when the universe was <b>1/50</b> of its present size?</p><ol><li>Stretching light cools it in simple proportion: half the size, twice the temperature.</li><li>2.7 × 50 = <b>135 K</b>.</li></ol><p>Chamber 10: peak wavelength × temperature is fixed. Stretch every wavelength 50 times and the temperature falls 50 times.</p>',
  band: '<p>Light of <b>1,000 nanometres</b> is stretched <b>100 times</b>. Where does it end up?</p><ol><li>1,000 × 100 = 100,000 nanometres, which is a tenth of a millimetre.</li><li>Infrared runs from 750 nanometres to 1 millimetre. Microwaves begin at 1 millimetre.</li><li>A tenth of a millimetre: still <b>infrared</b>.</li></ol>',
  wave: '<p>Sound travels at <b>340 metres a second</b> in air. A note makes <b>170 vibrations a second</b>. How long is its wave?</p><ol><li>Speed = vibrations a second × length of each wave.</li><li>340 = 170 × length, so the length is <b>2 metres</b>.</li></ol><p>Higher notes have more vibrations a second and so shorter waves. The same rule holds for light and for the sound in the early universe.</p>',
  ruler: '<p>A ruler <b>500 million light-years</b> long is seen to span an angle of <b>1/80 of a radian</b>. How far away is it?</p><ol><li>For small angles: angle = size ÷ distance, so distance = size ÷ angle.</li><li>500 ÷ (1/80) = 500 × 80 = <b>40,000 million light-years</b>.</li></ol>',
  first: '<p>Which came earlier: the first stars, or the oldest light setting out?</p><ol><li>The order: first nuclei (minutes); the fog clearing (370,000 years); first stars (a hundred million years or more); the Sun (9 billion years).</li><li><b>The oldest light</b> set out long before any star shone.</li></ol>',
  idea: '<p>What to hold on to.</p><ol><li>Smaller means hotter. Above about 3,000 K the universe was an opaque, glowing fog.</li><li>When it cleared, at 370,000 years, its light was freed, and still arrives from every direction, stretched into microwaves.</li><li>Sound ripples in the fog froze when it cleared, leaving a ruler of known size.</li><li>The ruler\'s angle gives the expansion rate, given the standard account of the universe.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'cool',
    level: 1,
    make(rand) {
      const k = pickOne(rand, [2, 10, 100, 1000]);
      const T = Math.round(2.7 * k * 10) / 10;
      return { ask: 'How hot was the light that filled it then?', show: `<p>The oldest light is now at 2.7 K, and its temperature goes as one over the size of the universe.</p><p>Go back to when the universe was <b>${frac(1, k)}</b> of its present size.</p>`, ...choices(rand, `${T.toLocaleString()} K`, [`${tidy(2.7 / k)} K`, `${(Math.round(2.7 * k * k * 10) / 10).toLocaleString()} K`, '2.7 K']), why: `2.7 × ${k.toLocaleString()} = ${T.toLocaleString()} K. Smaller, so hotter.` };
    },
  },
  {
    id: 'band',
    level: 1,
    make(rand) {
      const [k, where, size] = pickOne(rand, [[2, 'Infrared', '2,000 nanometres'], [100, 'Infrared', 'a tenth of a millimetre'], [1100, 'Microwaves', '1.1 millimetres'], [10000, 'Microwaves', '1 centimetre']] as [number, string, string][]);
      return { ask: 'What kind of light is it on arrival?', show: `<p>Infrared runs from 750 nanometres to 1 millimetre (a million nanometres). Microwaves run from 1 millimetre up to about a metre.</p><p>Light of <b>1,000 nanometres</b> is stretched <b>${k.toLocaleString()} times</b> on its way.</p>`, options: ['Visible light', 'Infrared', 'Microwaves'], right: where === 'Infrared' ? 1 : 2, why: `1,000 × ${k.toLocaleString()} nanometres is ${size}: ${where.toLowerCase()}.${k === 1100 ? ' This is the oldest light itself.' : ''}` };
    },
  },
  {
    id: 'wave',
    level: 2,
    make(rand) {
      const [f, len] = pickOne(rand, [[170, '2 metres'], [340, '1 metre'], [680, 'half a metre'], [85, '4 metres'], [3400, 'a tenth of a metre']] as [number, string][]);
      const all = ['4 metres', '2 metres', '1 metre', 'half a metre', 'a tenth of a metre'];
      return { ask: 'How long is each wave?', show: `<p>For any wave: speed = vibrations a second × length of one wave. Sound in air travels at 340 metres a second.</p><p>A note makes <b>${f.toLocaleString()} vibrations a second</b>.</p>`, ...choices(rand, len, all.filter((x) => x !== len)), why: `340 ÷ ${f.toLocaleString()} = ${len}. More vibrations a second, shorter waves.` };
    },
  },
  {
    id: 'ruler',
    level: 2,
    make(rand) {
      const sizeOf = pickOne(rand, [100, 470, 500]);
      const n = pickOne(rand, [50, 100, 200]);
      return { ask: 'How far away is it?', show: `<p>For a small angle in radians: angle = size ÷ distance.</p><p>A ruler <b>${sizeOf} million light-years</b> long spans an angle of <b>${frac(1, n)} of a radian</b>.</p>`, ...choices(rand, `${(sizeOf * n).toLocaleString()} million light-years`, [`${tidy(sizeOf / n)} million light-years`, `${(sizeOf * n * 10).toLocaleString()} million light-years`, `${(sizeOf + n).toLocaleString()} million light-years`]), why: `Distance = size ÷ angle = ${sizeOf} × ${n} = ${(sizeOf * n).toLocaleString()}.` };
    },
  },
  {
    id: 'first',
    level: 2,
    make(rand) {
      const i = Math.floor(rand() * WHEN.length);
      let j = Math.floor(rand() * (WHEN.length - 1));
      if (j >= i) j += 1;
      const [x, y] = [WHEN[i], WHEN[j]];
      const early = x[1] < y[1] ? x : y;
      const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
      return { ask: 'Which came first?', show: `<p>Two events in the history of the universe: <b>${x[0]}</b>, and <b>${y[0]}</b>.</p>`, options: [cap(x[0]), cap(y[0])], right: early === x ? 0 : 1, why: `${cap(x[0])}: ${WHEN_WORDS[x[1]]} after the beginning. ${cap(y[0])}: ${WHEN_WORDS[y[1]]}.` };
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
let smallest = 1;
let clearedAfter = false;
let backToNow = false;
let when = 0; // years
let latest = 0;
let h0 = 74;
const toA = (s: number) => Math.pow(10, -4 + 4 * s);

/** The first 600,000 years: for each of a run of sizes, how old the universe was and how far sound had spread. */
const EARLY: [number, number][] = Array.from({ length: 160 }, (_, i) => {
  const size = Math.pow(10, -6 + (i / 159) * 3.25);
  return [ageAt(size, H) * 1e9, sound(size)] as [number, number];
});
function spread(yearsOld: number): number {
  for (let i = 1; i < EARLY.length; i++) {
    if (yearsOld <= EARLY[i][0]) {
      const f = (yearsOld - EARLY[i - 1][0]) / (EARLY[i][0] - EARLY[i - 1][0]);
      return EARLY[i - 1][1] + f * (EARLY[i][1] - EARLY[i - 1][1]);
    }
  }
  return RULER;
}

function fog(): string {
  const T = T_NOW / a;
  const opaque = a < CLEAR;
  const glow = 2.897771955e6 / T;
  let g = DEFS;
  if (opaque) {
    g += `<rect x="0" y="0" width="460" height="190" fill="${starColour(T)}" opacity="${Math.min(0.85, 0.45 + 0.1 * Math.log10(CLEAR / a))}"/>`;
    // A ray of light in the fog: knocked aside again and again, getting nowhere.
    let x = 60;
    let y = 95;
    let d = `M${x} ${y}`;
    let seed = 11;
    for (let i = 0; i < 46; i++) {
      seed = (seed * 16807) % 2147483647;
      const turn = (seed / 2147483647) * Math.PI * 2;
      x = Math.max(20, Math.min(440, x + Math.cos(turn) * 26));
      y = Math.max(20, Math.min(170, y + Math.sin(turn) * 26));
      d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    g += `<path d="${d}" stroke="#0b0e22" stroke-width="2.2" fill="none" opacity="0.75"/><circle cx="60" cy="95" r="5" fill="#0b0e22"/>`;
    g += `<text x="230" y="182" font-size="12" text-anchor="middle" style="fill:#0b0e22;stroke:none">a glowing fog: light is knocked aside before it gets anywhere</text>`;
  } else {
    g += stars(460, 190, a > 0.05 ? 50 : 0, 61) + `<path d="M60 95H420" stroke="#e8c24a" stroke-width="7" opacity="0.25" stroke-linecap="round"/><path d="M60 95H420" stroke="#e8c24a" stroke-width="2.5" marker-end="url(#ray)"/><circle cx="60" cy="95" r="5" fill="#e8c24a"/><defs><marker id="ray" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#e8c24a"/></marker></defs>`;
    g += `<text x="230" y="182" font-size="12" text-anchor="middle">clear: light travels freely${a > 0.05 ? ', among the stars' : '; no stars yet'}</text>`;
  }
  const size = a > 0.999 ? 'its present size' : `<b>1/${Math.round(1 / a).toLocaleString()}</b> of its present size`;
  return `<svg viewBox="0 0 460 190" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><p>The universe at ${size}, <b>${years(ageAt(a, H))}</b> after the beginning. The light that fills it is at <b>${T >= 100 ? (Math.round(T / 10) * 10).toLocaleString() : tidy(Math.round(T * 10) / 10)} K</b>, and glows brightest at ${wavelength(glow)}: ${band(glow)}.</p>`;
}

function ripple(): string {
  const r = spread(when);
  const frozen = when >= EARLY[EARLY.length - 1][0] || r >= RULER - 0.01;
  const px = (r / RULER) * 104;
  let g = DEFS + `<rect x="0" y="0" width="460" height="250" fill="${frozen ? '#070919' : '#3a2416'}"/>`;
  if (frozen) g += stars(460, 250, 0, 1);
  g += `<circle cx="230" cy="125" r="${px.toFixed(1)}" fill="none" stroke="#e8c24a" stroke-width="${frozen ? 4 : 6}" opacity="0.9" filter="url(#art-glow)"/><circle cx="230" cy="125" r="9" fill="#b9c4ff" filter="url(#art-glow)"/>`;
  g += `<path d="M230 ${125 + 126}h${px.toFixed(1)}" stroke="#aab0d6"/><text x="230" y="244" font-size="11" opacity="0.8">${Math.round(r * MPC_MLY)} million light-years, as measured today</text>`;
  g += `<text x="20" y="22" font-size="12">${frozen ? 'the fog has cleared: the ripple is frozen in' : 'a ripple of sound, spreading at over half the speed of light'}</text>`;
  return `<svg viewBox="0 0 460 250" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p><b>${(Math.round(when / 1000) * 1000).toLocaleString()} years</b> after the beginning. ${frozen ? 'With the light gone, nothing drives the ripple. It stays, as a faint ring of extra matter, and is carried apart with everything else.' : 'A denser spot has pushed outward: the light trapped in the fog presses on the matter, and the pressure travels as sound.'}</p>`;
}

function ruler(): string {
  const h = h0 / 100;
  const D = distance(Z_CLEAR, h);
  const deg = ((RULER / D) * 180) / Math.PI;
  const off = deg - SEEN_DEG;
  const fits = Math.abs(off) < 0.0006;
  // The picture: us, the ruler, and the angle (drawn far wider than it is).
  const far = 110 + (D / 16500) * 300;
  let g = DEFS + stars(460, 150, 24, 71);
  g += `<path d="M40 75L${far.toFixed(1)} 35M40 75L${far.toFixed(1)} 115" stroke="#7fb6ff" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M${far.toFixed(1)} 35V115" stroke="#e8c24a" stroke-width="11" opacity="0.25" stroke-linecap="round"/><path d="M${far.toFixed(1)} 35V115" stroke="#e8c24a" stroke-width="5" stroke-linecap="round"/><circle cx="40" cy="75" r="6" fill="#fff"/><text x="40" y="100" font-size="11" text-anchor="middle">us, now</text><text x="${(far + 10).toFixed(1)}" y="72" font-size="11">the ruler:</text><text x="${(far + 10).toFixed(1)}" y="86" font-size="11">${Math.round(RULER * MPC_MLY)} million</text><text x="${(far + 10).toFixed(1)}" y="100" font-size="11">light-years</text>`;
  // The gauge: what the angle should be, against what it is.
  const X = (d: number) => 40 + ((d - 0.58) / 0.04) * 380;
  let gauge = `<path d="M${X(0.58)} 40H${X(0.62)}" stroke="#8d93b8"/>`;
  for (const d of [0.58, 0.59, 0.6, 0.61, 0.62]) gauge += `<path d="M${X(d)} 35v10" stroke="#8d93b8"/><text x="${X(d)}" y="62" font-size="11" text-anchor="middle" opacity="0.7">${d.toFixed(2)}°</text>`;
  gauge += `<path d="M${X(SEEN_DEG)} 14V46" stroke="#8fe0a4" stroke-width="3"/><text x="${X(SEEN_DEG)}" y="10" font-size="11" text-anchor="middle" fill="#8fe0a4">measured</text>`;
  if (deg > 0.58 && deg < 0.62) gauge += `<circle cx="${X(deg).toFixed(1)}" cy="40" r="7" fill="${fits ? '#8fe0a4' : '#e8c24a'}" filter="url(#art-glow)"/>`;
  return `<svg viewBox="0 0 460 150" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><svg viewBox="0 0 460 70" style="width:100%;max-width:560px;display:block;margin:8px auto 0">${DEFS}${gauge}</svg><p>If the universe is expanding at <b>${tidy(h0)}</b> km/s per megaparsec, the oldest light is <b>${tidy(Math.round((D * MPC_MLY) / 100) / 10)} billion light-years</b> away, and the ruler should span <b>${deg.toFixed(4)}°</b>. It is measured at ${SEEN_DEG.toFixed(4)}°. ${fits ? '<span class="good">They agree.</span>' : `<span class="bad">Too ${off > 0 ? 'big' : 'small'}.</span>`}</p><p class="soft">The angle is drawn far wider than it is: about the width of the full Moon. The amounts of matter and light are held at their measured values.</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The oldest light is the <b>cosmic microwave background</b>, or CMB.</li>
      <li>The moment the fog cleared, when electrons joined nuclei to make the first whole atoms, is called <b>recombination</b> (oddly, since they had never been combined before). The place the light last bounced is the <b>surface of last scattering</b>.</li>
      <li>The tiny differences in the light's temperature from place to place are its <b>anisotropies</b>.</li>
      <li>The sound ripples are <b>baryon acoustic oscillations</b>, and the distance one had spread by the time the fog cleared is the <b>sound horizon</b>.</li>
      <li>The standard account of the universe, with dark energy (Λ) and cold dark matter, is the <b>ΛCDM model</b>.</li>
    </ul>
    <p><b>How this is known.</b> Alpher and Herman predicted a leftover glow in 1948. Penzias and Wilson found it by accident in 1965, as a hiss in a radio antenna. The COBE satellite showed in 1990 that it has exactly the spectrum of a glowing body, at 2.725 K, and in 1992 found the ripples: one part in 100,000. The WMAP and Planck satellites, and telescopes in Chile and at the South Pole, have mapped them since. The same frozen ripples were found in 2005 in the way galaxies are spread through space.</p>
    <p><b>What it tells.</b> The pattern of ripples fits the standard account with only six numbers set, and gives: an age of 13.8 billion years; ordinary atoms 5% of everything, unseen dark matter 27%, dark energy 68%; and an expansion rate today of about 67 km/s per megaparsec.</p>
    <p class="soft">That last figure is not measured directly. It is what the standard account requires, given the ruler's angle. The distance ladder of chamber 12 measures the same thing directly, and gets 73. That is the next chamber.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Waves.</b> A wave is a disturbance that travels. Its <b>wavelength</b> λ is the distance from one crest to the next; its <b>frequency</b> f is how many crests pass each second; and the two multiply to its speed:</p>
      <div class="eq">v = f λ</div>
      <p>Sound is a wave of pressure. In air it travels at 340 metres a second. In the early universe the pressure was that of the trapped light, and sound travelled at the speed of light divided by √3: about 58% of it.</p>
      <p><b>The ruler.</b> The distance sound had covered by the time the fog cleared is an integral, the adding-up of chamber 2: the speed of sound at each moment, times a short time, corrected for the stretching since.</p>
      <div class="eq">r<sub>s</sub> = ∫ c<sub>s</sub> dt / a</div>
      <p>With the measured amounts of matter and light it comes to ${Math.round(RULER)} megaparsecs: ${Math.round(RULER * MPC_MLY)} million light-years. This page works it out afresh each time it loads.</p>
      <p><b>The angle.</b> Chamber 12's rule, angle = size ÷ distance, with the distance to the oldest light being another integral, of the speed of light over the expansion rate at every moment since. A faster expansion today puts the oldest light nearer, so the ruler looks bigger. Only one rate matches the measured ${SEEN_DEG.toFixed(4)}°: this page finds ${tidy(Math.round(fromOldestLight() * 10) / 10)}, and the Planck team's full analysis gives 67.4.</p>
      <p><b>Temperature and size.</b> Chamber 10's rule, peak wavelength × temperature = constant, with every wavelength stretched by the growth of space, gives T ∝ 1/a. At ${Math.round(Z_CLEAR + 1).toLocaleString()} times smaller: ${Math.round(T_NOW * (Z_CLEAR + 1)).toLocaleString()} K.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://background.uchicago.edu/~whu/beginners/introduction.html" target="_blank" rel="noopener">Wayne Hu, An introduction to the cosmic microwave background</a> (University of Chicago). The sound waves, explained with moving pictures by one of the people who worked out the theory.</li>
      <li>Read: <a href="https://openstax.org/books/astronomy-2e/pages/29-thinking-ahead" target="_blank" rel="noopener">OpenStax Astronomy, chapter 29, The Big Bang</a>.</li>
      <li>See: <a href="https://www.cosmos.esa.int/web/planck" target="_blank" rel="noopener">European Space Agency, the Planck mission</a>. The maps, and the papers behind the numbers above.</li>
      <li>Read: <a href="https://www.nobelprize.org/prizes/physics/1978/summary/" target="_blank" rel="noopener">The Nobel Prizes in Physics for 1978</a> (the discovery), <a href="https://www.nobelprize.org/prizes/physics/2006/summary/" target="_blank" rel="noopener">2006</a> (the spectrum and the ripples) and <a href="https://www.nobelprize.org/prizes/physics/2019/summary/" target="_blank" rel="noopener">2019</a> (Peebles, for the theory).</li>
      <li>See: <a href="https://lambda.gsfc.nasa.gov/education/graphic_history/" target="_blank" rel="noopener">NASA LAMBDA, a graphic history of cosmology</a>. Every measurement of these quantities, plotted against the year it was made.</li>
      <li>See: <a href="https://www.ipmu.jp/en" target="_blank" rel="noopener">Kavli Institute for the Physics and Mathematics of the Universe, Tokyo</a>, one of the groups building the next satellite to map the oldest light, LiteBIRD.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · the oldest light', 'Smaller, hotter, foggier', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'oldest',
    kicker: 'The cosmos · 14',
    title: 'The oldest light',
    steps: [
      { say: 'The last chamber ran the stretching backwards. Light stretched less is light that is hotter, so a smaller universe was a hotter one. ¶ This is the universe today: clear and cold, with a faint glow at 2.7 K. <b>Slide back until it is at least 2,000 times smaller.</b>', until: () => smallest <= 1 / 2000 },
      { say: 'Hotter than the surface of the Sun, everywhere. At this heat atoms cannot hold together, and space is full of loose charged particles, which knock light aside.', ask: ['Could a telescope ever see light from this time directly?', ['Yes, with a large enough mirror', 'No: the light never got out. The universe was opaque', 'Yes, as radio waves'], 1, 'It is like trying to see into a flame. <b>Now slide forward again, slowly, to the moment the fog clears.</b>'] },
      { say: '<b>Slide forward again, slowly, to the moment the fog clears.</b>', until: () => clearedAfter },
      { say: 'At about 3,000 K, 370,000 years after the beginning, electrons joined nuclei and made whole atoms. Atoms let light pass.', ask: ['What became of the light that was in the fog at that moment?', ['It was absorbed', 'It has been travelling ever since', 'It fell back into the atoms'], 1, 'Nothing has stopped it. It is still arriving. <b>Slide on to today</b> and see what it has become.'] },
      { say: '<b>Slide on to today.</b>', until: () => backToNow },
      { say: 'It set out as the glow of a body at 3,000 K, brightest near 1,000 nanometres. Since then the universe has grown 1,090 times.', ask: ['What is that light now?', ['Visible light, very faint', 'Microwaves, at 2.7 degrees above absolute zero', 'X-rays'], 1, 'Stretched 1,090 times, to about a millimetre: microwaves. It comes from every direction, because the fog was everywhere and we are inside where it was. It was found by accident in 1965. ¶ It also carries a ruler. See below.'] },
      { say: 'While the universe was fog, the trapped light pressed on the matter, and that pressure could travel: sound. Wherever the fog was a little denser, a ripple spread outward. <b>Slide time forward to 400,000 years.</b>', until: () => latest >= 400000 },
      { say: 'The ripple stopped.', ask: ['Why?', ['It ran out of energy', 'When the fog cleared, the light escaped and stopped pushing on the matter', 'It reached the edge of the universe'], 1, 'With nothing to drive it, each ripple froze where it was: a ring 470 million light-years in radius, as measured today. Its size follows from the physics of hot gas, and so it is a ruler whose true length is known.'] },
      { say: 'A ruler of known length, seen across the sky, gives a distance: chamber 12\'s rule, angle = size ÷ distance. And the distance to the oldest light depends on how fast the universe has been expanding. ¶ <b>Slide the expansion rate until the ruler\'s angle comes out as measured.</b>', until: () => Math.abs(((RULER / distance(Z_CLEAR, h0 / 100)) * 180) / Math.PI - SEEN_DEG) < 0.0006 },
      { say: 'It fits at about 67 or 68, and nowhere else: the angle is measured to one part in three thousand.', ask: ['This route to the expansion rate never used the distance ladder. What did it use instead?', ['Nothing: it is a direct measurement', 'The ruler\'s angle, and the standard account of what has happened between then and now', 'The brightness of supernovae'], 1, 'That is its strength and its weak point. It is wholly independent of the ladder. But it is a prediction: what today\'s rate <i>must</i> be if the standard account is complete. The ladder measures today\'s rate directly, and gets 73.'] },
    ],
    summary: '<b>The universe was once a glowing fog, and the light from the moment it cleared still fills the sky,</b> stretched into microwaves. Ripples of sound frozen into it make a ruler of known size. Its angle, with the standard account of the universe, gives the age, the contents and the rate of expansion: 67, where the distance ladder says 73.',
    frame: () =>
      `<div id="fog"></div><div class="bar"><span class="soft">10,000 times smaller</span><input id="size" type="range" min="0" max="1" step="0.002" value="1" style="flex:1"><span class="soft">today</span></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A ripple of sound</div><div id="ripple"></div><div class="bar"><span class="soft">the beginning</span><input id="when" type="range" min="0" max="600000" step="2000" value="0" style="flex:1"><span class="soft">600,000 years</span></div></div>` +
      `<div id="part3" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">The ruler, and the rate of expansion</div><div id="ruler"></div><div class="bar"><span class="soft">60</span><input id="h0" type="range" min="60" max="80" step="0.1" value="74" style="flex:1"><span class="soft">80</span></div></div>`,
    paint: () => {
      $('fog').innerHTML = fog();
      $('ripple').innerHTML = ripple();
      $('ruler').innerHTML = ruler();
      const at = run?.step() ?? 0;
      ($('part2') as HTMLElement).hidden = at < 6;
      ($('part3') as HTMLElement).hidden = at < 8;
    },
    slide: (id, value) => {
      if (id === 'size') {
        a = value >= 0.999 ? 1 : toA(value);
        smallest = Math.min(smallest, a);
        if (smallest <= 1 / 2000 && a >= CLEAR) clearedAfter = true;
        if (clearedAfter && a >= 0.999) backToNow = true;
      } else if (id === 'when') {
        when = value;
        latest = Math.max(latest, value);
      } else h0 = value;
    },
    key: () => [['#e8c24a', 'light; the sound ripple and ruler'], ['#b9c4ff', 'the dense spot it spread from'], ['#8fe0a4', 'the measured angle']],
    drawer,
    next: ['tension', 'On to the Hubble tension'],
  });
  sh.draw();
}
expose(
  () => [...checkKinds(KINDS), ...checkCosmology(), ...(Math.abs(RULER * MPC_MLY - 470.6) < 2 && Math.abs(SEEN_DEG - 0.5965) < 1e-4 && Math.abs(ageAt(CLEAR, H) * 1e9 - 371000) < 3000 && Math.abs(spread(371000) - RULER) < 1.5 ? [] : ['the chamber\'s own figures'])],
  () => ({ a, when, h0, done: sh.kept.chapter }),
);
