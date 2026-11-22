import { Shell, checkKinds, choices, numbers, pickOne, runPractice } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS, star, stars } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { frac, tidy } from './physics';
import { H0, PC_LY, cepheid, checkStarlight, looks, parsecs } from './starlight';

/**
 * The distance ladder.
 *
 * Nothing in the sky comes with its distance written on it, and no single
 * method reaches all the way out. Distances are built up in rungs. The
 * nearest stars are surveyed by parallax, the shift in their position as the
 * Earth goes round the Sun. Stars of known true brightness, calibrated on
 * those, give distances from how faint they look. Brighter beacons are
 * calibrated on those in turn. Every rung stands on the one below, so an
 * error low down is carried all the way up.
 *
 * Three figures: the Earth's orbit and a star's shift; a lamp of known
 * brightness to be placed; and the whole ladder on a scale of powers of ten.
 */

const sh = new Shell('portal-worlds-cosmos-ladder-v1');
const ly = (x: number) => (x >= 1e9 ? `${tidy(Math.round(x / 1e8) / 10)} billion` : x >= 1e6 ? `${tidy(Math.round(x / 1e5) / 10)} million` : x >= 1000 ? (Math.round(x / 100) * 100).toLocaleString() : tidy(Math.round(x * 10) / 10));

// ---- Practice ----

const RUNGS: [string, number, string][] = [
  ['Venus', 0, 'Inside the solar system, a radar pulse is bounced off the planet and timed.'],
  ['A spacecraft passing Jupiter', 0, 'Its own radio signals are timed there and back.'],
  ['A star 40 light-years away', 1, 'Close enough for its shift against the background to be measured as the Earth goes round the Sun.'],
  ['A star 3,000 light-years away, in our part of the Milky Way', 1, 'The Gaia spacecraft measures parallaxes this small for more than a billion stars.'],
  ['A galaxy 20 million light-years away', 2, 'Far too distant for parallax. Single pulsing stars can still be picked out in it, and their periods give their true brightness.'],
  ['The Andromeda galaxy, 2.5 million light-years away', 2, 'This is the measurement that first showed, in 1923, that there are other galaxies at all.'],
  ['A galaxy 4 billion light-years away', 3, 'No single ordinary star can be seen so far off. A white dwarf exploding as a supernova outshines its whole galaxy for weeks.'],
  ['A galaxy 900 million light-years away', 3, 'Beyond the reach of Cepheids. Exploding white dwarfs, calibrated on Cepheids nearer by, take over.'],
];
const RUNG_WORDS = ['Timing a radar or radio signal', 'Parallax', 'Pulsing stars of known brightness (Cepheids)', 'Exploding white dwarfs (Type Ia supernovae)'];
const IDEAS: [string, string, string[], string][] = [
  ['Why is it called a ladder?', 'Each method is calibrated using the one below it', ['The methods were discovered in order of height', 'Each method is twice as accurate as the last', 'Distances are measured in rungs'], 'Parallax gives the true brightness of nearby Cepheids. Cepheids give the true brightness of supernovae. So each rung leans on the one beneath.'],
  ['Every parallax distance turns out to be 3% too large. What happens to distances measured with supernovae?', 'They are about 3% too large as well', ['Nothing: they are measured separately', 'They become 3% too small', 'The error averages away'], 'An error in a lower rung is carried up through every calibration above it. This is why so much work goes into the bottom of the ladder.'],
  ['What makes something a "standard candle"?', 'Its true brightness is known, so its distance follows from how faint it looks', ['It is the brightest thing in its galaxy', 'It never changes', 'It is close to the Earth'], 'A Cepheid gives away its true brightness by how fast it pulses. Compare that with how bright it looks, and the inverse-square law gives the distance.'],
  ['In 1923 Edwin Hubble found a Cepheid in the "Andromeda nebula" that was very faint for its period. What followed?', 'Andromeda is far outside the Milky Way: a galaxy in its own right', ['Andromeda is a small cloud nearby', 'Cepheids cannot be trusted', 'The Milky Way is larger than thought'], 'The star had to be about a million light-years off by his reckoning, several times the size of the Milky Way. (The modern figure is 2.5 million.) The universe became vastly bigger overnight.'],
  ['Why does parallax fail for very distant stars?', 'The shift becomes too small to measure', ['Distant stars do not shift', 'The Earth\'s orbit is too large', 'Their light is too red'], 'The shift halves each time the distance doubles. For a star 30,000 light-years away it is about a ten-thousandth of a second of arc, near the limit of the best instrument yet flown.'],
  ['Looking at a galaxy a billion light-years away, what are we seeing?', 'The galaxy as it was a billion years ago', ['The galaxy as it is now', 'A picture a billion years into its future', 'Nothing: its light has not arrived'], 'Chamber 3: its present is in our elsewhere. Distance is also time, and the far end of the ladder looks into the young universe.'],
];

const EXAMPLES: Record<string, string> = {
  parallax: '<p>A star shows a parallax of <b>0.04 seconds of arc</b>. How far away is it?</p><ol><li>Distance in parsecs is 1 divided by the parallax in seconds of arc.</li><li>1 ÷ 0.04 = <b>25 parsecs</b>.</li></ol><p>A parsec is 3.26 light-years, so that is about 82 light-years. Smaller shift, greater distance.</p>',
  fainter: '<p>A lamp is moved to <b>6 times</b> its distance. How bright does it look now?</p><ol><li>Its light is spread over a sphere 6 times as wide, whose surface is 6 × 6 times as large.</li><li><b>1/36</b> as bright.</li></ol><p>The other way: if it looks 1/49 as bright, it is √49 = 7 times as far.</p>',
  candle: '<p>Two identical stars. One is <b>500 light-years</b> away. The other looks <b>1/16</b> as bright. How far is it?</p><ol><li>Fainter by 16 means further by √16 = 4.</li><li>500 × 4 = <b>2,000 light-years</b>.</li></ol>',
  rung: '<p>Which method reaches a galaxy <b>60 million light-years</b> away?</p><ol><li>Radar: the solar system only.</li><li>Parallax: stars in our own galaxy, out to some tens of thousands of light-years.</li><li>Cepheids: single stars in other galaxies, out to about a hundred million light-years.</li><li>Type Ia supernovae: out to billions.</li></ol><p>60 million is within reach of <b>Cepheids</b>.</p>',
  angle: '<p>A tower <b>50 metres</b> tall is <b>5 km</b> away. What angle does it span?</p><ol><li>For a small angle, measured in radians: angle = size ÷ distance.</li><li>Use the same units: 50 m ÷ 5,000 m = <b>1/100 of a radian</b>.</li></ol><p>A radian is about 57 degrees, so this is a little over half a degree. Twice as far away, it would span half the angle.</p>',
  tens: '<p>The centre of the Milky Way is about <b>10⁴</b> light-years away, and a far galaxy <b>10⁹</b>. How many times further is the galaxy?</p><ol><li>Subtract the little numbers: 9 − 4 = 5.</li><li>10⁵ is <b>a hundred thousand</b> times.</li></ol>',
  hubble: '<p>Galaxies recede at about 70 km/s for every million parsecs of distance. A galaxy is <b>200 million parsecs</b> away. How fast is it receding?</p><ol><li>Speed = 70 × distance in millions of parsecs.</li><li>70 × 200 = <b>14,000 km/s</b>.</li></ol><p>Backwards: a galaxy receding at 7,000 km/s is 7,000 ÷ 70 = 100 million parsecs away. This is the top rung: a redshift gives a distance.</p>',
  idea: '<p>What to hold on to.</p><ol><li>Parallax: nearer things shift more. Distance = 1 ÷ shift.</li><li>Standard candles: known true brightness, and the inverse-square law.</li><li>Each rung is calibrated on the one below, so errors climb.</li><li>Looking far is looking back in time.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'parallax',
    level: 1,
    make(rand) {
      const d = pickOne(rand, [2, 4, 5, 10, 20, 50, 100]);
      return rand() < 0.6
        ? { ask: 'How far away is it?', show: `<p>A star's distance in parsecs is 1 divided by its parallax in seconds of arc.</p><p>A star shows a parallax of <b>${tidy(1 / d)} seconds of arc</b>.</p>`, ...choices(rand, `${d} parsecs`, [`${tidy(1 / d)} parsecs`, `${d * 2} parsecs`, `${d / 2} parsecs`]), why: `1 ÷ ${tidy(1 / d)} = ${d} parsecs, which is about ${ly(d * PC_LY)} light-years.` }
        : { ask: 'What parallax does it show?', show: `<p>A star's distance in parsecs is 1 divided by its parallax in seconds of arc.</p><p>A star is <b>${d} parsecs</b> away.</p>`, ...choices(rand, `${tidy(1 / d)} seconds of arc`, [`${d} seconds of arc`, `${tidy(2 / d)} seconds of arc`, `${tidy(1 / (d * 2))} seconds of arc`]), why: `1 ÷ ${d} = ${tidy(1 / d)}. Every star's parallax is under one second of arc: even the nearest is more than a parsec away.` };
    },
  },
  {
    id: 'fainter',
    level: 1,
    make(rand) {
      const k = pickOne(rand, [2, 3, 4, 5, 10]);
      return rand() < 0.5
        ? { ask: 'How bright does it look now?', show: `<p>A lamp is carried to <b>${k} times</b> its distance.</p>`, outside: `<p class="soft">The same light is spread over a sphere ${k} times as wide.</p>`, ...choices(rand, `${frac(1, k * k)} as bright`, [`${frac(1, k)} as bright`, `${frac(1, k * k * k)} as bright`, `${frac(1, 2 * k)} as bright`]), why: `${k} × ${k} = ${k * k}. The surface of a sphere goes as the square of its radius.` }
        : { ask: 'How many times further away is the second?', show: `<p>Two identical lamps. The second looks <b>${frac(1, k * k)}</b> as bright as the first.</p>`, ...numbers(rand, k, [k * k, 2 * k, (k * k) / 2]), why: `The square root of ${k * k} is ${k}.` };
    },
  },
  {
    id: 'candle',
    level: 2,
    make(rand) {
      const near = pickOne(rand, [100, 200, 500, 1000]);
      const k = pickOne(rand, [3, 4, 5, 10, 100]);
      return { ask: 'How far away is the second?', show: `<p>Two Cepheids pulse with the same period, so they are truly as bright as each other. One is known, from its parallax, to be <b>${near.toLocaleString()} light-years</b> away. The other looks <b>${frac(1, k * k)}</b> as bright.</p>`, outside: `<p class="soft">How many times further must it be, to look that much fainter?</p>`, ...choices(rand, `${(near * k).toLocaleString()} light-years`, [`${(near * k * k).toLocaleString()} light-years`, `${(near * 2 * k).toLocaleString()} light-years`, `${((near * k) / 2).toLocaleString()} light-years`]), why: `Fainter by ${(k * k).toLocaleString()} means further by √${(k * k).toLocaleString()} = ${k}. ${near.toLocaleString()} × ${k} = ${(near * k).toLocaleString()}.` };
    },
  },
  {
    id: 'rung',
    level: 1,
    make(rand) {
      const [what, which, why] = pickOne(rand, RUNGS);
      return { ask: 'Which method measures its distance?', show: `<p><b>${what}.</b></p>`, outside: `<p class="soft">Radar: the solar system. Parallax: our own galaxy. Cepheids: to about a hundred million light-years. Supernovae: to billions.</p>`, options: RUNG_WORDS, right: which, why };
    },
  },
  {
    id: 'angle',
    level: 2,
    make(rand) {
      const [size, far, n] = pickOne(rand, [
        ['2 metres', '200 metres', 100],
        ['1 km', '1,000 km', 1000],
        ['30 metres', '6 km', 200],
        ['3,500 km (the Moon)', '385,000 km', 110],
        ['5 cm', '100 metres', 2000],
      ] as [string, string, number][]);
      return { ask: 'What angle does it span, in radians?', show: `<p>For a small angle, in radians: angle = size ÷ distance.</p><p>Something <b>${size}</b> across is <b>${far}</b> away.</p>`, outside: `<p class="soft">Put both in the same units first.</p>`, ...choices(rand, `About ${frac(1, n)}`, [`About ${frac(1, n * 10)}`, `About ${frac(1, n / 10)}`, `About ${n}`]), why: `Size ÷ distance = ${frac(1, n)} of a radian${n === 110 ? ', which is about half a degree: the width of the full Moon' : ''}.` };
    },
  },
  {
    id: 'tens',
    level: 2,
    make(rand) {
      const a = pickOne(rand, [0, 1, 4, 6]);
      const steps = pickOne(rand, [2, 3, 6]);
      const words: Record<number, string> = { 2: 'A hundred', 3: 'A thousand', 6: 'A million' };
      return { ask: 'How many times further is the second than the first?', show: `<p>One thing is about <b>10<sup>${a}</sup></b> light-years away, another about <b>10<sup>${a + steps}</sup></b>.</p>`, ...choices(rand, `${words[steps]} times`, [2, 3, 6].filter((s) => s !== steps).map((s) => `${words[s]} times`).concat([`${steps} times`])), why: `${a + steps} − ${a} = ${steps}, and 10<sup>${steps}</sup> is ${words[steps].toLowerCase()}.` };
    },
  },
  {
    id: 'hubble',
    level: 3,
    make(rand) {
      const d = pickOne(rand, [10, 50, 100, 200, 500, 1000]);
      const rule = `<p>Distant galaxies recede at about ${H0} km/s for every million parsecs of distance.</p>`;
      return rand() < 0.5
        ? { ask: 'How fast is it receding?', show: `${rule}<p>A galaxy is <b>${d.toLocaleString()} million parsecs</b> away.</p>`, ...choices(rand, `${(H0 * d).toLocaleString()} km/s`, [`${(H0 + d).toLocaleString()} km/s`, `${(H0 * d * 10).toLocaleString()} km/s`, `${((H0 * d) / 10).toLocaleString()} km/s`]), why: `${H0} × ${d.toLocaleString()} = ${(H0 * d).toLocaleString()}.` }
        : { ask: 'How far away is it?', show: `${rule}<p>A galaxy's lines are shifted as for a speed of <b>${(H0 * d).toLocaleString()} km/s</b> away from us.</p>`, ...choices(rand, `${d.toLocaleString()} million parsecs`, [`${(d * 10).toLocaleString()} million parsecs`, `${(d / 10).toLocaleString()} million parsecs`, `${(H0 * d).toLocaleString()} million parsecs`]), why: `${(H0 * d).toLocaleString()} ÷ ${H0} = ${d.toLocaleString()}. The redshift of chamber 10 has become a ruler.` };
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

let d = 2; // parsecs
let furthest = 2;
const NEAR = 1000; // light-years
const GOAL = 100000;
let far = 3000;
let period = 10;
let periodChanged = false;
const toFar = (s: number) => 1000 * Math.pow(400, s);

function parallax(): string {
  const SX = 70;
  const SY = 118;
  const starX = 150 + ((d - 1) / 19) * 250;
  const BG = 440;
  let g = DEFS + stars(460, 236, 26, 31);
  g += `<ellipse cx="${SX}" cy="${SY}" rx="16" ry="52" fill="none" stroke="#5f6aa8" stroke-dasharray="3 4"/>` + star(SX, SY, 9, '#ffe9a8');
  const sight = (ey: number, colour: string) => {
    const slope = (SY - ey) / (starX - SX);
    return `<path d="M${SX} ${ey}L${BG} ${(ey + slope * (BG - SX)).toFixed(1)}" stroke="${colour}" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  };
  g += sight(SY - 52, '#7fb6ff') + sight(SY + 52, '#ff9ab8');
  g += `<circle cx="${SX}" cy="${SY - 52}" r="6" fill="#7fb6ff"/><text x="${SX - 12}" y="${SY - 58}" font-size="11" text-anchor="end" fill="#7fb6ff">January</text><circle cx="${SX}" cy="${SY + 52}" r="6" fill="#ff9ab8"/><text x="${SX - 12}" y="${SY + 66}" font-size="11" text-anchor="end" fill="#ff9ab8">July</text>`;
  g += star(starX, SY, 6, '#fff') + `<text x="${starX}" y="${SY + 26}" font-size="11" text-anchor="middle">the star</text>`;
  g += `<path d="M${BG} 20V216" stroke="#3b4170"/><text x="${BG - 6}" y="16" font-size="11" text-anchor="end" opacity="0.7">far background</text>`;
  // Through the telescope: the same field in January and in July.
  const shift = 150 / d;
  let view = `<rect x="20" y="10" width="420" height="70" rx="8" fill="#050714" stroke="#3b4170"/>`;
  for (const [x, y] of [[60, 30], [110, 62], [170, 24], [250, 58], [300, 28], [360, 66], [410, 36], [205, 44]]) view += `<circle cx="${x}" cy="${y}" r="1.8" fill="#e9e6f5" opacity="0.8"/>`;
  view += `<circle cx="${230 + shift / 2}" cy="45" r="5" fill="#7fb6ff" filter="url(#art-glow)"/><circle cx="${230 - shift / 2}" cy="45" r="5" fill="#ff9ab8" filter="url(#art-glow)"/><path d="M${230 - shift / 2} 62H${230 + shift / 2}" stroke="#e8c24a" stroke-width="2"/><text x="230" y="98" font-size="12" text-anchor="middle">through the telescope: where the star is seen in January and in July</text>`;
  const p = 1 / d;
  return `<svg viewBox="0 0 460 236" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><svg viewBox="0 0 460 104" style="width:100%;max-width:560px;display:block;margin:8px auto 0">${DEFS}${view}</svg><p>At <b>${tidy(Math.round(d * 10) / 10)} parsecs</b> (${tidy(Math.round(d * PC_LY * 10) / 10)} light-years), the star's parallax is <b>${tidy(Math.round(p * 1000) / 1000)} seconds of arc</b>: the angle a small coin spans from ${tidy(Math.round(4.1 * d * 10) / 10)} km away.</p><p class="soft">The picture is not to scale. Drawn truly, with the Earth's orbit this size, the nearest star would be several kilometres off the page.</p>`;
}

function candle(): string {
  const dim = looks(1, far / NEAR);
  const want = looks(1, GOAL / NEAR);
  const matched = Math.abs(Math.log10(far / GOAL)) < 0.02;
  const glow = (x: number, y: number, b: number, label: string) => {
    const r = Math.max(1.2, 22 * Math.pow(b, 0.22));
    return star(x, y, r, '#ffe9a8') + `<text x="${x}" y="${y + 52}" font-size="12" text-anchor="middle">${label}</text>`;
  };
  let g = DEFS + stars(460, 190, 24, 41);
  g += glow(80, 70, 1, 'the near one') + glow(230, 70, dim, 'yours, where you put it') + glow(380, 70, want, 'the far one, as seen');
  g += `<text x="80" y="140" font-size="11" text-anchor="middle" opacity="0.8">${NEAR.toLocaleString()} light-years</text><text x="230" y="140" font-size="11" text-anchor="middle" opacity="0.8">${ly(far)} light-years</text><text x="380" y="140" font-size="11" text-anchor="middle" opacity="0.8">distance unknown</text>`;
  g += `<text x="80" y="158" font-size="11" text-anchor="middle" opacity="0.8">brightness 1</text><text x="230" y="158" font-size="11" text-anchor="middle" fill="${matched ? '#8fe0a4' : '#e9e6f5'}">1/${Math.round(1 / dim).toLocaleString()}</text><text x="380" y="158" font-size="11" text-anchor="middle" opacity="0.8">1/${Math.round(1 / want).toLocaleString()}</text>`;
  // How it pulses.
  let curve = '';
  for (let t = 0; t <= 60; t += 0.5) {
    const ph = ((t / period) % 1 + 1) % 1;
    const b = ph < 0.3 ? ph / 0.3 : 1 - (ph - 0.3) / 0.7;
    curve += `${curve ? 'L' : 'M'}${(40 + (t / 60) * 380).toFixed(1)} ${(64 - b * 44).toFixed(1)}`;
  }
  const pulse = `<svg viewBox="0 0 460 92" style="width:100%;max-width:560px;display:block;margin:8px auto 0"><path d="M40 68H420" stroke="#8d93b8"/><path d="${curve}" stroke="#ffe9a8" stroke-width="2.5" fill="none"/><text x="40" y="86" font-size="11" opacity="0.7">0</text><text x="420" y="86" font-size="11" text-anchor="end" opacity="0.7">60 days</text><text x="230" y="86" font-size="11" text-anchor="middle" opacity="0.8">how a Cepheid's brightness rises and falls</text></svg>`;
  return `<svg viewBox="0 0 460 170" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><p>${matched ? '<span class="good">They match.</span> The far star is <b>100,000 light-years</b> away: a hundred times as far as the near one, and so ten thousand times as faint.' : `Three identical stars. Yours, at ${ly(far)} light-years, looks ${dim > want ? 'brighter' : 'fainter'} than the far one does.`}</p>${pulse}<p>A Cepheid that pulses once every <b>${period} days</b> is truly about <b>${(Math.round(cepheid(period) / 100) * 100).toLocaleString()} times</b> as bright as the Sun, wherever it is.</p>`;
}

const SPANS: [string, number, number, string][] = [
  ['radar and radio timing', 1.6e-5, 2e-3, '#aab0d6'],
  ['parallax', 1, 3e4, '#7fb6ff'],
  ['Cepheids', 1e3, 1.3e8, '#ffe9a8'],
  ['Type Ia supernovae', 3e7, 1e10, '#ff9ab8'],
  ['redshift', 1e8, 1.3e10, '#ff9a9a'],
];
const MARKS: [string, number][] = [['the Sun', 1.58e-5], ['nearest star', 4.25], ['centre of the galaxy', 2.67e4], ['Andromeda', 2.5e6], ['furthest galaxies', 1.3e10]];
function whole(): string {
  const X = (x: number) => 30 + ((Math.log10(x) + 5) / 15.5) * 410;
  let g = '';
  for (let e = -5; e <= 10; e++) g += `<path d="M${X(10 ** e)} 30V${48 + SPANS.length * 26}" stroke="#2c3260"/>${e % 5 === 0 ? `<text x="${X(10 ** e)}" y="22" font-size="11" text-anchor="middle" opacity="0.7">10${e === 0 ? '⁰' : e === 5 ? '⁵' : e === 10 ? '¹⁰' : '⁻⁵'}</text>` : ''}`;
  SPANS.forEach(([name, from, to, colour], i) => {
    const y = 42 + i * 26;
    g += `<rect x="${X(from)}" y="${y}" width="${X(to) - X(from)}" height="12" rx="6" fill="${colour}" opacity="0.85"/><text x="${X(to) + 6 > 330 ? X(from) - 6 : X(to) + 6}" y="${y + 10}" font-size="11" text-anchor="${X(to) + 6 > 330 ? 'end' : 'start'}">${name}</text>`;
  });
  const base = 56 + SPANS.length * 26;
  MARKS.forEach(([name, at], i) => {
    g += `<path d="M${X(at)} ${base - 8}v${14 + (i % 2) * 14}" stroke="#e8c24a"/><text x="${X(at)}" y="${base + 18 + (i % 2) * 14}" font-size="10" text-anchor="${i === 0 ? 'start' : i === MARKS.length - 1 ? 'end' : 'middle'}" fill="#e8c24a">${name}</text>`;
  });
  return `<svg viewBox="0 0 460 ${base + 66}" style="width:100%;max-width:560px;display:block;margin:auto">${g}<text x="230" y="${base + 60}" font-size="11" text-anchor="middle" opacity="0.7">distance in light-years: each line is ten times the one before</text></svg>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>The shift in a star's apparent place as the Earth goes round the Sun is its <b>parallax</b>: by convention, half the full swing, in seconds of arc.</li>
      <li>The distance at which the parallax is one second of arc is a <b>parsec</b>: 3.26 light-years. A million of them is a <b>megaparsec</b>.</li>
      <li>The Earth's average distance from the Sun is the <b>astronomical unit</b>: 149.6 million km. It is the baseline of every parallax.</li>
      <li>Something whose true brightness is known is a <b>standard candle</b>. A star's true output is its <b>luminosity</b>; how bright it looks from here, its <b>apparent brightness</b>.</li>
      <li>A <b>Cepheid</b> is a giant star that pulses, and the slower the pulse the brighter the star: the <b>period–luminosity relation</b>, or <b>Leavitt law</b>.</li>
      <li>A white dwarf pushed over its limit explodes as a <b>Type Ia supernova</b>, always with nearly the same brightness.</li>
      <li>That galaxies recede at a speed in proportion to their distance is <b>Hubble's law</b> (now also named for Lemaître), and the constant of proportion is the <b>Hubble constant</b>.</li>
    </ul>
    <p><b>How the ladder was built.</b> Friedrich Bessel measured the first stellar parallax in 1838, for the star 61 Cygni. Henrietta Leavitt, cataloguing variable stars at Harvard, found in 1912 that the brighter Cepheids pulse more slowly. In 1923 Edwin Hubble found a Cepheid in the Andromeda "nebula" and showed it lay far outside the Milky Way. In 1998 two teams using Type Ia supernovae found that the expansion of the universe is speeding up. And since 2013 the European spacecraft Gaia has measured parallaxes for more than a billion stars, which is the firm ground the rest now stands on.</p>
    <p><b>What is not settled.</b> The top of the ladder gives the rate at which the universe is expanding, and it gives about 73 km/s per megaparsec. A wholly separate method, from the oldest light in the universe, gives about 67. Both claim errors too small to cover the gap. Whether that is a fault in the ladder, or something missing from our account of the universe, is not known. It has its own chamber further on.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Small angles.</b> Measure an angle not in degrees but by the arc it cuts from a circle, divided by the circle's radius. That is the <b>radian</b>; a full turn is 2π of them, and one is about 57°. In radians, for any small angle,</p>
      <div class="eq">angle = size ÷ distance</div>
      <p>with no trigonometry needed: for small angles the sine and the tangent are, near enough, the angle itself. A second of arc is 1/3,600 of a degree, or about one 206,265th of a radian. So a star whose parallax is one second of arc is 206,265 times as far as the Earth is from the Sun: one parsec.</p>
      <div class="eq">distance (parsecs) = 1 ÷ parallax (seconds of arc)</div>
      <p><b>The inverse-square law, again.</b> Chamber 6 had it for gravity. Light obeys it for a plainer reason: a star's output L spreads over a sphere whose area is 4π d², so the brightness seen at distance d is</p>
      <div class="eq">b = L ÷ (4π d²)</div>
      <p>Know L and measure b, and d follows.</p>
      <p><b>Powers of ten.</b> The last figure covers from the Sun to the furthest galaxies: a range of a million billion. On a scale where each step is ten times the last, it fits on a page, and the rungs can be seen to overlap. The overlaps are where one rung is calibrated against the next.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://openstax.org/books/astronomy-2e/pages/19-thinking-ahead" target="_blank" rel="noopener">OpenStax Astronomy, chapter 19, Celestial Distances</a>. A free standard textbook; this chapter is the ladder, rung by rung.</li>
      <li>See: <a href="https://www.cosmos.esa.int/web/gaia/dr3" target="_blank" rel="noopener">European Space Agency, Gaia Data Release 3</a>. What the parallax survey contains, from the people who made it.</li>
      <li>Read: <a href="https://hubblesite.org/contents/articles/the-cosmic-distance-ladder" target="_blank" rel="noopener">NASA, The Cosmic Distance Ladder</a>. How the Hubble telescope's Cepheids join the rungs.</li>
      <li>Read: <a href="https://www.nobelprize.org/prizes/physics/2011/summary/" target="_blank" rel="noopener">The Nobel Prize in Physics 2011</a>: Perlmutter, Schmidt and Riess, for what the supernovae showed.</li>
      <li>Watch: <a href="https://www.youtube.com/playlist?list=PL8dPuuaLjXtPAJr1ysd5yGIyiSFuh0mIL" target="_blank" rel="noopener">Crash Course Astronomy</a>. The episode on distances.</li>
      <li>See: <a href="https://www.nao.ac.jp/en/" target="_blank" rel="noopener">National Astronomical Observatory of Japan</a>, whose VERA radio telescopes measure parallaxes across the Milky Way by a different technique from Gaia's.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · the distance ladder', 'How far, and how do we know?', '<b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'ladder',
    kicker: 'Light and stars · 12',
    title: 'The distance ladder',
    steps: [
      { say: 'Hold a thumb at arm\'s length and look at it with one eye, then the other: it jumps against the wall behind. The nearer the thumb, the bigger the jump. ¶ The Earth\'s two "eyes" are its places in January and in July, 300 million km apart. Seen from each, a nearby star sits in a slightly different place against the far background. <b>Move the star further away, to 10 parsecs.</b>', until: () => furthest >= 10 },
      { say: 'The further the star, the smaller its shift.', ask: ['A star is moved to twice the distance. What happens to its shift?', ['It doubles', 'It halves', 'It falls to a quarter'], 1, 'Twice as far, half the shift. So distance is simply 1 ÷ shift. With the shift in seconds of arc, the distance comes out in a unit made for the purpose: the parsec, 3.26 light-years.'] },
      { say: 'A second of arc is tiny: a small coin seen from 4 km. Every star\'s parallax is smaller than that.', ask: ['A star shows a parallax of a tenth of a second of arc. How far away is it?', ['A tenth of a parsec', '10 parsecs', '100 parsecs'], 1, '1 ÷ 0.1 = 10 parsecs, about 33 light-years. This is the bottom rung of the ladder, and the only one that is pure geometry. But the shift soon becomes too small to measure. ¶ For anything further, a different idea is needed, below.'] },
      { say: 'Suppose you knew two stars were <i>truly</i> equally bright. Then the fainter-looking one is simply further away, and by how much follows from the inverse-square law. ¶ The near star is 1,000 light-years away, measured by parallax. The far one is identical, and looks 10,000 times fainter. <b>Slide your own copy outward until it looks as faint as the far one.</b>', until: () => Math.abs(Math.log10(far / GOAL)) < 0.02 },
      { say: 'Ten thousand times fainter, a hundred times further.', ask: ['Another identical star looks 25 times fainter than the near one. How much further away is it?', ['5 times', '25 times', '625 times'], 0, 'The square root of 25. Something of known true brightness is called a standard candle. The whole difficulty is knowing the true brightness of a star you cannot visit.'] },
      { say: 'In 1912 Henrietta Leavitt found stars that give their true brightness away. Cepheids swell and shrink, brightening and dimming over days, and the slower the pulse, the brighter the star really is. <b>Try a slower Cepheid.</b>', until: () => periodChanged },
      { say: 'Time the pulse, and you know the true brightness. Compare with how bright it looks, and you have the distance.', ask: ['Two Cepheids pulse with the same period. One looks four times fainter than the other. How do their distances compare?', ['It is twice as far', 'It is four times as far', 'It is sixteen times as far'], 0, 'Same period, same true brightness; four times fainter, twice as far. Cepheids are bright enough to pick out in other galaxies. ¶ Below is the whole ladder.'] },
      { say: 'Each bar is one method, with the distances it can reach. Notice that they overlap.', ask: ['The true brightness of Cepheids was fixed using nearby ones whose distance came from parallax. If every parallax distance were 5% too small, what of the distances to far galaxies?', ['They would be unaffected', 'They would be about 5% too small as well', 'They would be 5% too large'], 1, 'Each rung is calibrated on the one below, so an error at the bottom is carried to the top. That is why it is a ladder, and why the bottom rung matters so much.'] },
      { say: 'In 1923 Edwin Hubble found a Cepheid in a faint smudge called the Andromeda nebula. For its period, it was astonishingly dim.', ask: ['The Milky Way is about 100,000 light-years across. The Cepheid\'s faintness put it about a million light-years away. What did that show?', ['The Milky Way is bigger than thought', 'Andromeda is another galaxy, far outside our own', 'Cepheids are unreliable'], 1, 'Until that night it was an open question whether the Milky Way was the whole universe. The modern distance to Andromeda is 2.5 million light-years, and it is the nearest large galaxy of hundreds of billions.'] },
    ],
    summary: '<b>Distances are built up in rungs, each standing on the one below.</b> Geometry reaches the nearer stars. Stars of known brightness, calibrated on those, reach other galaxies. Exploding stars, calibrated on those, reach most of the way across the universe. And to look that far is to look back in time.',
    frame: () =>
      `<div id="parallax"></div><div class="bar"><span class="soft">nearby</span><input id="dist" type="range" min="1.3" max="20" step="0.1" value="2" style="flex:1"><span class="soft">20 parsecs</span></div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A star of known brightness</div><div id="candle"></div><div class="bar"><span class="soft">1,000 light-years</span><input id="far" type="range" min="0" max="1" step="0.002" value="${Math.log(3) / Math.log(400)}" style="flex:1"><span class="soft">400,000</span></div><div class="bar">${[3, 10, 30].map((p) => `<button class="chip pale" data-do="period" data-v="${p}">pulses every ${p} days</button>`).join('')}</div></div>` +
      `<div id="part3" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">The whole ladder</div><div id="whole"></div></div>`,
    paint: () => {
      $('parallax').innerHTML = parallax();
      $('candle').innerHTML = candle();
      $('whole').innerHTML = whole();
      run?.mark('period', (k) => Number(k) === period);
      const at = run?.step() ?? 0;
      ($('part2') as HTMLElement).hidden = at < 3;
      ($('part3') as HTMLElement).hidden = at < 7;
    },
    slide: (id, value) => {
      if (id === 'dist') {
        d = value;
        furthest = Math.max(furthest, d);
      } else far = toFar(value);
    },
    act: (what, value) => {
      if (what === 'period') {
        periodChanged = periodChanged || Number(value) !== period;
        period = Number(value);
      }
    },
    key: () => [['#7fb6ff', 'January'], ['#ff9ab8', 'July'], ['#e8c24a', 'the shift']],
    drawer,
    next: ['expansion', 'On to the cosmos'],
  });
  sh.draw();
}
expose(
  () => [...checkKinds(KINDS), ...checkStarlight(), ...(Math.abs(parsecs(0.1) - 10) < 1e-9 && Math.abs(looks(1, GOAL / NEAR) - 1e-4) < 1e-12 && Math.abs(10 * PC_LY - 32.6) < 0.05 && Math.abs(1.58e-5 - 149597870.7 / 9.4607e12) < 1e-7 && Math.abs(206265 - 1 / (Math.PI / 180 / 3600)) < 1 ? [] : ['the chamber\'s own figures'])],
  () => ({ d, far, period, done: sh.kept.chapter }),
);
