import { Shell, checkKinds, choices, pickOne, runPractice, shuffled } from '../canon/shell';
import type { Kind } from '../canon/shell';
import './cosmos.css';
import { DEFS, RAINBOW, star, starColour, stars } from './art';
import { expose, runChamber } from './chamber';
import type { Running } from './chamber';
import { frac, tidy } from './physics';
import { C_KM, LINES, SUN_T, checkStarlight, peak, planck, power, shifted } from './starlight';

/**
 * Light as messenger.
 *
 * Nobody has been to a star, and nearly everything known about them was read
 * out of their light. Three readings carry most of it. The colour of the
 * glow gives the temperature. The dark lines across the spectrum give the
 * ingredients, because each element takes out its own wavelengths. And when
 * the whole pattern of lines sits to one side of where it belongs, the size
 * of the shift is the speed toward or away from us.
 *
 * Two figures: a glowing body whose temperature can be set, with its curve;
 * and a spectrum to be matched against the lines of the elements.
 */

const sh = new Shell('portal-worlds-cosmos-light-v1');
const BANDS: [number, string][] = [[10, 'X-rays'], [380, 'the ultraviolet'], [750, 'visible light'], [1e6, 'the infrared']];
const band = (nm: number) => BANDS.find(([top]) => nm < top)?.[1] ?? 'radio';
const ELEMENTS = Object.keys(LINES);
const cap = (w: string) => w[0].toUpperCase() + w.slice(1);

// ---- Practice ----

const COLOURS: [string, number][] = [['red', 1], ['orange', 2], ['yellow', 3], ['white', 4], ['blue-white', 5]];
const IDEAS: [string, string, string[], string][] = [
  ['A star\'s spectrum has no helium lines. Does that show the star has no helium?', 'No: a line appears only if the star is hot enough to make that element absorb it', ['Yes: no lines, no element', 'Yes, unless the star is very far away', 'No: helium has no lines at all'], 'The Sun is about a quarter helium, and its ordinary spectrum barely shows it. Reading amounts from lines takes the temperature into account, which is what Cecilia Payne worked out in 1925.'],
  ['Why does each element have its own set of lines?', 'Its atoms can take in light only at particular wavelengths, different for every element', ['Each element is a different colour', 'The lines are made by the telescope', 'Heavier elements block more light'], 'An atom\'s electrons can hold only certain energies, so it absorbs only the light that carries it exactly from one to another. The pattern is a fingerprint.'],
  ['Every line in a galaxy\'s spectrum sits at a wavelength 5% longer than in the laboratory. What does that show?', 'The galaxy is moving away from us', ['The galaxy is made of unknown elements', 'The galaxy is very hot', 'The galaxy is moving toward us'], 'One element might be mistaken for another; but a whole pattern, shifted by the same fraction, is a known pattern from something receding. Longer is redder: a redshift.'],
  ['How was helium discovered?', 'As an unexplained line in the Sun\'s light, in 1868, before it was found on Earth', ['In a mine, and later seen in the Sun', 'By sending a probe to the Sun', 'It was predicted and never seen'], 'It is named after the Sun, helios. It was found on Earth in 1895.'],
  ['A blacksmith heats a bar of iron. In what order do the colours come?', 'Dull red, then orange, then yellow-white', ['Blue, then white, then red', 'White, then yellow, then red', 'It depends on the kind of iron'], 'Hotter means the peak of the glow moves to shorter wavelengths. The same rule holds for iron, lamp filaments and stars.'],
  ['You are warm. Do you glow?', 'Yes: in the infrared, far beyond what eyes can see', ['No: only hot things glow', 'Yes, in visible light, too faintly to notice', 'Only in the dark'], 'At body temperature the peak is near 9,000 nanometres. Thermal cameras see it.'],
];

const EXAMPLES: Record<string, string> = {
  peak: '<p>The Sun, at about 5,800 K, glows brightest at about 500 nanometres. Where does a star at <b>2,900 K</b> glow brightest?</p><ol><li>Peak wavelength × temperature is always the same number.</li><li>2,900 is half of 5,800, so the wavelength must be double.</li><li>500 × 2 = <b>1,000 nanometres</b>: in the infrared.</li></ol><p>Cooler, longer and redder. Hotter, shorter and bluer.</p>',
  hotter: '<p>Three stars: one orange, one blue-white, one yellow. Which is hottest?</p><ol><li>The order of colour with rising temperature: red, orange, yellow, white, blue-white.</li><li>Blue-white is furthest along: <b>the blue-white one</b>.</li></ol><p>It runs the opposite way to bathroom taps.</p>',
  power: '<p>A star\'s surface is <b>3 times</b> as hot as another\'s. How much more light does each square metre give out?</p><ol><li>Light given out goes as the temperature to the fourth power.</li><li>3 × 3 × 3 × 3 = <b>81 times</b> as much.</li></ol>',
  shift: '<p>A line that belongs at <b>400 nanometres</b> is found at <b>408</b>.</p><ol><li>The shift is 408 − 400 = 8 nanometres.</li><li>As a fraction of where it belongs: 8 ÷ 400 = 2%.</li><li>So the speed is 2% of the speed of light: 0.02 × 300,000 = <b>6,000 km/s</b>.</li><li>The line moved to a <i>longer</i> wavelength, so the thing is moving <b>away</b>.</li></ol>',
  which: '<p>A spectrum shows dark lines at <b>656, 486 and 434</b> nanometres.</p><ol><li>Compare with the lists. Hydrogen: 656, 486, 434, 410. Sodium: 589. Helium: 668, 588, 502, 447.</li><li>All three match hydrogen: <b>hydrogen</b>.</li></ol><p>If nothing matches, check whether every line is off by the same percentage. Lines at 689, 510 and 456 are hydrogen\'s, each 5% longer.</p>',
  tens: '<p>How many times longer is a wave of <b>10⁻³ metres</b> than one of <b>10⁻⁹ metres</b>?</p><ol><li>To divide powers of ten, subtract the little numbers: −3 − (−9) = 6.</li><li>10⁶ is <b>a million</b>.</li></ol><p>The little number is a logarithm: it counts the tens multiplied together. Each step along a scale marked in powers of ten is ten times the one before.</p>',
  idea: '<p>Three readings, and what each gives.</p><ol><li><b>The colour of the glow</b> gives the temperature. Hotter is bluer and, by the fourth power, brighter.</li><li><b>The pattern of dark lines</b> gives the ingredients. Each element has its own.</li><li><b>The shift of the whole pattern</b> gives the speed toward or away: longer (redder) is away.</li></ol>',
};

const KINDS: Kind[] = [
  {
    id: 'peak',
    level: 1,
    make(rand) {
      const k = pickOne(rand, [2, 4, 5, 10]);
      const hotter = rand() < 0.5;
      const T = hotter ? 5800 * k : 5800 / k;
      const right = hotter ? 500 / k : 500 * k;
      return { ask: 'At what wavelength does it glow brightest?', show: `<p>The Sun's surface is at about 5,800 K, and it glows brightest at about 500 nanometres. Peak wavelength times temperature is the same for every glowing body.</p><p>A body is at <b>${T.toLocaleString()} K</b>.</p>`, outside: `<p class="soft">How many times hotter or cooler than the Sun is it? The wavelength goes the other way by the same factor.</p>`, ...choices(rand, `${right.toLocaleString()} nanometres`, [`${(hotter ? 500 * k : 500 / k).toLocaleString()} nanometres`, '500 nanometres', `${(hotter ? 500 / (k * k) : 500 * k * k).toLocaleString()} nanometres`]), why: `${k} times ${hotter ? 'hotter' : 'cooler'}, so the peak is at ${k} times ${hotter ? 'shorter' : 'longer'} a wavelength: ${right.toLocaleString()} nanometres, in ${band(right)}.` };
    },
  },
  {
    id: 'hotter',
    level: 1,
    make(rand) {
      const three = shuffled(rand, COLOURS).slice(0, 3);
      const hot = rand() < 0.6;
      const pick = [...three].sort((a, b) => (hot ? b[1] - a[1] : a[1] - b[1]))[0];
      return { ask: hot ? 'Which has the hottest surface?' : 'Which has the coolest surface?', show: `<p>Three stars are seen: one <b>${three[0][0]}</b>, one <b>${three[1][0]}</b>, one <b>${three[2][0]}</b>.</p>`, options: three.map((c) => `The ${c[0]} one`), right: three.indexOf(pick), why: 'With rising temperature: red, orange, yellow, white, blue-white. Red stars are the cool ones.' };
    },
  },
  {
    id: 'power',
    level: 2,
    make(rand) {
      const k = pickOne(rand, [2, 3, 10]);
      const hotter = rand() < 0.6;
      const f = k ** 4;
      return { ask: 'How does the light from each square metre of its surface compare?', show: `<p>The light a glowing surface gives out goes as its temperature to the fourth power.</p><p>One star's surface is <b>${hotter ? `${k} times as hot as` : `${frac(1, k)} as hot as`}</b> another's.</p>`, ...choices(rand, hotter ? `${f.toLocaleString()} times as much` : `${frac(1, f)} as much`, hotter ? [`${k} times as much`, `${(k * k).toLocaleString()} times as much`, `${4 * k} times as much`] : [`${frac(1, k)} as much`, `${frac(1, k * k)} as much`, `${frac(1, 4 * k)} as much`]), why: `${k} × ${k} × ${k} × ${k} = ${f.toLocaleString()}. A small change in temperature is a large change in brightness.` };
    },
  },
  {
    id: 'shift',
    level: 2,
    make(rand) {
      const rest = pickOne(rand, [400, 500, 600]);
      const pct = pickOne(rand, [1, 2, 5, 10]);
      const away = rand() < 0.6;
      const found = rest * (1 + (away ? pct : -pct) / 100);
      const speed = pct * 3000;
      return { ask: 'How is it moving?', show: `<p>For speeds well below light's, the fraction by which a line is shifted is the speed as a fraction of the speed of light (300,000 km/s).</p><p>A line that belongs at <b>${rest} nanometres</b> is found at <b>${tidy(found)}</b>.</p>`, outside: `<p class="soft">First the shift as a percentage of ${rest}. Then that percentage of 300,000.</p>`, ...choices(rand, `${away ? 'Away from' : 'Toward'} us at ${speed.toLocaleString()} km/s`, [`${away ? 'Toward' : 'Away from'} us at ${speed.toLocaleString()} km/s`, `${away ? 'Away from' : 'Toward'} us at ${(speed / 10).toLocaleString()} km/s`, `${away ? 'Toward' : 'Away from'} us at ${(speed * 10).toLocaleString()} km/s`]), why: `Shifted by ${tidy(Math.abs(found - rest))} in ${rest}: ${pct}%. ${pct}% of 300,000 is ${speed.toLocaleString()} km/s. ${away ? 'Longer, so redder, so receding.' : 'Shorter, so bluer, so approaching.'}` };
    },
  },
  {
    id: 'which',
    level: 2,
    make(rand) {
      const name = pickOne(rand, ['hydrogen', 'helium', 'calcium']);
      const moved = rand() < 0.4 ? pickOne(rand, [0.05, 0.1]) : 0;
      const seen = LINES[name].slice(0, 3).map((l) => Math.round(l * (1 + moved)));
      const table = `Hydrogen: 656, 486, 434. Helium: 668, 588, 502. Sodium: 589. Calcium: 397, 393.`;
      const say = (n: string, m: number) => (m ? `${cap(n)}, moving away at ${m * 100}% of the speed of light` : `${cap(n)}, at rest`);
      const others = ['hydrogen', 'helium', 'calcium'].filter((n) => n !== name);
      return { ask: 'What made these lines?', show: `<p>Dark lines are found at <b>${seen.join(', ')}</b> nanometres.</p><p class="soft">In the laboratory: ${table}</p>`, outside: `<p class="soft">If nothing matches, divide each line by the one it might be. Is the answer the same for all of them?</p>`, ...choices(rand, say(name, moved), [say(others[0], 0), say(others[1], moved || 0.05), say(name, moved ? 0 : 0.05)]), why: moved ? `Each is ${moved * 100}% longer than one of ${name}'s lines: ${LINES[name].slice(0, 3).map((l) => Math.round(l)).join(', ')}. A whole pattern shifted alike is a redshift.` : `They are ${name}'s lines exactly, where they belong.` };
    },
  },
  {
    id: 'tens',
    level: 3,
    make(rand) {
      const a = -pickOne(rand, [2, 3, 4, 5]);
      const b = a - pickOne(rand, [2, 3, 6]);
      const steps = a - b;
      const words: Record<number, string> = { 2: 'A hundred', 3: 'A thousand', 6: 'A million' };
      return { ask: 'How many times longer is the first than the second?', show: `<p>One kind of light has a wavelength of <b>10<sup>${a}</sup> metres</b>, another of <b>10<sup>${b}</sup> metres</b>.</p>`, outside: `<p class="soft">Dividing powers of ten: subtract the little numbers.</p>`, ...choices(rand, `${words[steps]} times`, [2, 3, 6].filter((s) => s !== steps).map((s) => `${words[s]} times`).concat([`${steps} times`])), why: `${a} − (${b}) = ${steps}, and 10<sup>${steps}</sup> is ${words[steps].toLowerCase()}. The little number counts the tens: it is a logarithm.` };
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

let T = SUN_T;
let hottest = SUN_T;
let coolest = SUN_T;
type Target = 'star' | 'galaxy';
let target: Target = 'star';
const on = new Set<string>();
const tried = new Set<string>();
let v = 0;
const AWAY = 0.04;
const IN_STAR = ['hydrogen', 'sodium', 'calcium', 'magnesium'];
/** The dark lines in what is being looked at. */
const dark = () => IN_STAR.flatMap((e) => LINES[e]).map((l) => shifted(l, target === 'galaxy' ? AWAY : 0));
/** Whether every line of an element, moved by the speed she has assumed, falls on a dark line. */
const fits = (e: string) => LINES[e].every((l) => dark().some((d) => Math.abs(d - shifted(l, v)) < 1.3));

const STARS: [string, number][] = [['a red dwarf', 3000], ['Betelgeuse', 3600], ['the Sun', SUN_T], ['Sirius', 9940], ['Rigel', 12100], ['a hot blue star', 30000]];
const toT = (s: number) => 2000 * Math.pow(17.5, s);

function glowing(): string {
  const W = 460;
  const H = 280;
  const LO = 0;
  const HI = 2000;
  const X = (nm: number) => 170 + ((nm - LO) / (HI - LO)) * 280;
  const Y = (f: number) => 230 - f * 190;
  const top = planck(peak(T), T);
  let d = '';
  for (let nm = 40; nm <= HI; nm += 10) d += `${d ? 'L' : 'M'}${X(nm).toFixed(1)} ${Y(planck(nm, T) / top).toFixed(1)}`;
  const at = peak(T);
  let g = DEFS + `<defs>${RAINBOW}</defs>` + stars(W, H, 30, 4) + star(82, 130, 30 + Math.min(26, Math.log(T / 2000) * 9), starColour(T));
  g += `<rect x="${X(380)}" y="${Y(1.02)}" width="${X(700) - X(380)}" height="${Y(0) - Y(1.02)}" fill="url(#art-rainbow)" opacity="0.28"/>`;
  g += `<path d="${d}L${X(HI)} ${Y(0)}L${X(40)} ${Y(0)}Z" fill="rgba(255,255,255,0.10)"/><path d="${d}" stroke="#fff" stroke-width="2.5" fill="none" filter="url(#art-glow)"/>`;
  g += `<path d="M${X(LO)} ${Y(0)}H${X(HI)}" stroke="#8d93b8"/>`;
  for (const nm of [500, 1000, 1500, 2000]) g += `<path d="M${X(nm)} ${Y(0)}v5" stroke="#8d93b8"/><text x="${X(nm)}" y="${Y(0) + 18}" font-size="11" text-anchor="${nm === 2000 ? 'end' : 'middle'}" opacity="0.7">${nm.toLocaleString()}</text>`;
  g += `<text x="${X(1000)}" y="${Y(0) + 36}" font-size="12" text-anchor="middle" opacity="0.8">wavelength, nanometres →</text><text x="${X(190)}" y="${Y(1.09)}" font-size="11" text-anchor="middle" opacity="0.7">ultraviolet</text><text x="${X(540)}" y="${Y(1.09)}" font-size="11" text-anchor="middle" opacity="0.9">visible</text><text x="${X(1300)}" y="${Y(1.09)}" font-size="11" text-anchor="middle" opacity="0.7">infrared</text>`;
  if (at < HI) g += `<path d="M${X(at)} ${Y(0)}V${Y(1)}" stroke="#e8c24a" stroke-dasharray="4 4"/><circle cx="${X(at)}" cy="${Y(1)}" r="5" fill="#e8c24a"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:560px;display:block;margin:auto;background:#070919">${g}</svg><p>At <b>${Math.round(T / 10) * 10 >= 10000 ? (Math.round(T / 100) * 100).toLocaleString() : (Math.round(T / 10) * 10).toLocaleString()} K</b> it glows brightest at <b>${Math.round(at).toLocaleString()} nanometres</b>, in ${band(at)}. Each square metre of it gives out <b>${power(T) >= 10 ? Math.round(power(T)).toLocaleString() : tidy(power(T))}</b> times what a square metre of the Sun does.</p><p class="soft">The curve is drawn to the same height each time, so that its shape can be seen.</p>`;
}

function spectrum(): string {
  const W = 460;
  const X = (nm: number) => 92 + ((nm - 380) / 320) * 348;
  let g = `<defs>${RAINBOW}</defs><rect x="92" y="16" width="348" height="64" rx="3" fill="url(#art-rainbow)"/>`;
  for (const l of dark()) g += `<rect x="${(X(l) - 1.4).toFixed(1)}" y="16" width="2.8" height="64" fill="#000"/>`;
  for (const nm of [400, 450, 500, 550, 600, 650, 700]) g += `<text x="${X(nm)}" y="96" font-size="11" text-anchor="middle" opacity="0.7">${nm}</text>`;
  g += `<text x="92" y="10" font-size="12">${target === 'star' ? 'light from a nearby star' : 'light from a distant galaxy'}</text>`;
  const list = [...on];
  list.forEach((e, row) => {
    const y = 116 + row * 24;
    const ok = fits(e);
    g += `<text x="84" y="${y + 2}" font-size="12" text-anchor="end" fill="${ok ? '#8fe0a4' : '#ff9a9a'}">${e}</text>`;
    for (const l of LINES[e]) {
      const at = shifted(l, v);
      if (at >= 380 && at <= 700) g += `<path d="M${X(at).toFixed(1)} 80V${y - 8}" stroke="${ok ? '#8fe0a4' : '#ff9a9a'}" stroke-width="1" stroke-dasharray="2 3" opacity="0.7"/><path d="M${X(at).toFixed(1)} ${y - 8}v12" stroke="${ok ? '#8fe0a4' : '#ff9a9a'}" stroke-width="3"/>`;
    }
  });
  const height = 110 + Math.max(1, list.length) * 24;
  const told = list.length ? list.map((e) => `${cap(e)}: <span class="${fits(e) ? 'good' : 'bad'}">${fits(e) ? 'every line falls on a dark line' : 'does not fit'}</span>`).join('. ') + '.' : 'Turn on an element to lay its lines against the spectrum.';
  const speed = Math.abs(v) < 1e-9 ? 'at rest' : `moving ${v > 0 ? 'away' : 'toward us'} at ${tidy(Math.abs(v) * 100)}% of the speed of light (${Math.round(Math.abs(v) * C_KM).toLocaleString()} km/s)`;
  return `<svg viewBox="0 0 ${W} ${height}" style="width:100%;max-width:560px;display:block;margin:auto">${g}</svg><p>${told}</p><p class="soft">The elements' lines are drawn as they would appear from something ${speed}.</p>`;
}

function drawer(): string {
  return `<div class="card book"><h3>The terms</h3>
    <ul class="terms">
      <li>Light spread out by wavelength is a <b>spectrum</b>; doing so and reading it is <b>spectroscopy</b>.</li>
      <li>The smooth glow of anything hot and dense is <b>thermal</b> or <b>blackbody radiation</b>. That its peak wavelength goes as one over the temperature is <b>Wien's law</b>; that its output goes as the temperature to the fourth power is the <b>Stefan–Boltzmann law</b>.</li>
      <li>The dark lines are <b>absorption lines</b>: cooler gas in front of the glow takes out its own wavelengths. Hot thin gas seen against darkness shows the same lines bright: <b>emission lines</b>.</li>
      <li>Hydrogen's visible lines are the <b>Balmer series</b>.</li>
      <li>The shift of lines by motion is the <b>Doppler shift</b>: to longer wavelengths, a <b>redshift</b>; to shorter, a <b>blueshift</b>.</li>
    </ul>
    <p><b>How this came to be known.</b> Fraunhofer mapped the dark lines in sunlight in 1814 without knowing what they were. In 1859 Kirchhoff and Bunsen showed that each element, heated in a flame, gives lines at its own wavelengths, and matched them to the Sun's. Helium was found as an unexplained line in sunlight in 1868, and on Earth only in 1895. In 1925 Cecilia Payne showed from the lines, with the temperature properly allowed for, that stars are overwhelmingly hydrogen and helium.</p>
    <p class="soft">One caution, built into the second figure: a missing line does not prove a missing element. The Sun is about a quarter helium, and helium barely marks its ordinary spectrum, because the Sun's surface is too cool to make helium absorb visible light.</p></div>
    <details><summary>The math underneath</summary><div class="card">
      <p><b>Powers of ten.</b> Light runs from radio waves metres long to gamma rays a million-millionth of a metre long. To hold such a range, count the tens: 10³ is a thousand, 10⁻⁹ a billionth. The little number is the <b>logarithm</b> (to base ten) of the big one: log 1,000 = 3. Chamber 7 met the natural logarithm, which counts multiplications by e; this one counts multiplications by ten.</p>
      <p>On a <b>logarithmic scale</b>, equal steps are equal <i>multiples</i>. The temperature slider here is one: each nudge multiplies the temperature by the same factor.</p>
      <p><b>The two laws.</b> For a glowing body at temperature T (in kelvin):</p>
      <div class="eq">λ<sub>peak</sub> = 2,898,000 nm ÷ T &nbsp;&nbsp;&nbsp;&nbsp; output per square metre ∝ T⁴</div>
      <p>For the Sun, 2,898,000 ÷ 5,772 = 502 nanometres: green, in the middle of what eyes evolved to see.</p>
      <p><b>The shift.</b> For speeds well below light's, with λ the wavelength where it belongs and Δλ the amount it has moved:</p>
      <div class="eq">Δλ / λ = v / c</div>
      <p>For higher speeds the twins' factor takes over: the wavelength is multiplied by √((1 + v/c) ÷ (1 − v/c)).</p>
      <p><b>Hydrogen's lines</b> obey a formula found by a schoolteacher, Johann Balmer, in 1885, nearly thirty years before Niels Bohr explained why: 1/λ = R (1/4 − 1/n²), for n = 3, 4, 5, 6.</p>
    </div></details>
    <details><summary>Go deeper</summary><div class="card"><ul class="links">
      <li>Read: <a href="https://openstax.org/books/astronomy-2e/pages/5-thinking-ahead" target="_blank" rel="noopener">OpenStax Astronomy, chapter 5, Radiation and Spectra</a>, and <a href="https://openstax.org/books/astronomy-2e/pages/17-thinking-ahead" target="_blank" rel="noopener">chapter 17, Analyzing Starlight</a>. A free standard textbook.</li>
      <li>Play: <a href="https://phet.colorado.edu/en/simulations/blackbody-spectrum" target="_blank" rel="noopener">PhET, Blackbody Spectrum</a>. The University of Colorado's version of the first figure, with the true heights of the curves.</li>
      <li>Watch: <a href="https://www.youtube.com/playlist?list=PL8dPuuaLjXtPAJr1ysd5yGIyiSFuh0mIL" target="_blank" rel="noopener">Crash Course Astronomy</a>. The episodes on light and on stars.</li>
      <li>See: <a href="https://www.eso.org/public/science/" target="_blank" rel="noopener">European Southern Observatory, Science with ESO telescopes</a>. What is being read from spectra now.</li>
      <li>For the math: <a href="https://openstax.org/books/college-algebra-2e/pages/6-3-logarithmic-functions" target="_blank" rel="noopener">OpenStax College Algebra, section 6.3</a>, on logarithms.</li>
    </ul></div></details>`;
}

if (sh.practising) {
  runPractice(sh, 'Practice · light as messenger', 'What does the light say?', 'Wavelengths in nanometres; the speed of light as 300,000 km/s. <b>◉</b> gives a nudge where there is one.', KINDS, EXAMPLES);
} else {
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  let run: Running | undefined;
  run = runChamber({
    sh,
    file: 'light',
    kicker: 'Light and stars · 10',
    title: 'Light as messenger',
    steps: [
      { say: 'Anything hot glows, and the glow depends on the temperature and on almost nothing else. The curve shows how much light comes out at each wavelength; the coloured band is the part eyes can see. ¶ This is the Sun\'s surface, at 5,772 K. <b>Heat it up, past 10,000 K.</b>', until: () => hottest >= 10000 },
      { say: 'The peak slid toward shorter wavelengths, and the glow turned from yellow-white to blue-white.', ask: ['Two stars, one red and one blue. Which has the hotter surface?', ['The red one', 'The blue one', 'Colour says nothing about temperature'], 1, 'Blue is hotter, the opposite of bathroom taps. A red star\'s surface is around 3,000 K; a blue one\'s, 20,000 K or more.'] },
      { say: '<b>Now cool it right down, to Betelgeuse at 3,600 K.</b>', until: () => coolest <= 3700 },
      { say: 'The peak has left the coloured band altogether.', ask: ['Where is most of Betelgeuse\'s light?', ['In the ultraviolet', 'In the visible, at the red end', 'In the infrared, where eyes cannot see it'], 2, 'Its peak is near 800 nanometres. We see only the short-wavelength tail of its glow, which is why it looks red. Everything warm glows somewhere: you do, near 9,000 nanometres.'] },
      { say: 'Look at the last number under the picture as you move the slider.', ask: ['Make a surface twice as hot. How much more light does each square metre give out?', ['Twice as much', 'Four times as much', 'Sixteen times as much'], 2, 'The fourth power: 2 × 2 × 2 × 2. So temperature is the first thing light gives away. ¶ The second is below. Spread a star\'s light into a rainbow and it is crossed by dark lines.'] },
      { say: 'Each dark line is a wavelength that some element in the star\'s outer layers has taken out. Every element takes its own set, the same in a star as in a laboratory. ¶ <b>Turn on hydrogen</b> to lay its four lines against the star\'s.', until: () => on.has('hydrogen') },
      { say: 'All four of hydrogen\'s lines fall on dark lines: there is hydrogen in this star. <b>Now try the other four elements.</b>', until: () => tried.size >= ELEMENTS.length },
      { say: 'Four of the five fit.', ask: ['Which element left no lines in this star\'s light?', ['Sodium', 'Helium', 'Calcium'], 1, 'Helium\'s lines are missing. That does <i>not</i> show the star has none: a star like this is about a quarter helium, but its surface is too cool to make helium absorb visible light. Reading <i>how much</i> of each element from the lines takes care; reading <i>which</i> are there is as simple as this.'] },
      { say: 'Now a harder one. <b>Switch to the distant galaxy,</b> and try hydrogen against it.', until: () => target === 'galaxy' && on.has('hydrogen') },
      { say: 'Nothing fits. But look at the <i>spacing</i> of the galaxy\'s dark lines: it is hydrogen\'s pattern, with every line pushed toward the red. ¶ <b>Slide the speed until hydrogen\'s lines fall on the galaxy\'s.</b>', until: () => target === 'galaxy' && on.has('hydrogen') && fits('hydrogen') },
      { say: 'They fit when the galaxy is taken to be moving away at 4% of the speed of light.', ask: ['How fast is that?', ['About 1,200 km/s', 'About 12,000 km/s', 'About 120,000 km/s'], 1, '4% of 300,000 km/s. One pattern has told you what the galaxy is made of and how fast it is leaving. Nearly every distant galaxy turns out to be leaving, and that is where the map goes after the stars.'] },
    ],
    summary: '<b>Light carries three messages.</b> The colour of the glow gives the temperature. The pattern of dark lines gives the ingredients. And the shift of the whole pattern gives the speed toward us or away. Nearly everything known about anything beyond the solar system was read from these.',
    frame: () =>
      `<div id="glowing"></div><div class="bar"><span class="soft">2,000 K</span><input id="temp" type="range" min="0" max="1" step="0.002" value="${Math.log(SUN_T / 2000) / Math.log(17.5)}" style="flex:1"><span class="soft">35,000 K</span></div><div class="bar">${STARS.map(([name, t]) => `<button class="chip pale" data-do="temp" data-v="${t}">${name}</button>`).join('')}</div>` +
      `<div id="part2" hidden><hr style="border:0;border-top:1px solid rgba(255,255,255,0.12);margin:16px 0"><div class="label">A spectrum, and the elements' lines</div><div id="spectrum"></div><div class="bar">${ELEMENTS.map((e) => `<button class="chip pale" data-do="element" data-v="${e}">${e}</button>`).join('')}</div><div class="bar"><button class="chip pale" data-do="target" data-v="star">a nearby star</button><button class="chip pale" data-do="target" data-v="galaxy">a distant galaxy</button></div><div class="bar"><span class="soft">toward us</span><input id="speed" type="range" min="-0.06" max="0.06" step="0.002" value="0" style="flex:1"><span class="soft">away</span></div></div>`,
    paint: () => {
      $('glowing').innerHTML = glowing();
      $('spectrum').innerHTML = spectrum();
      run?.mark('temp', (k) => Math.abs(Number(k) - T) < 1);
      run?.mark('element', (k) => on.has(k));
      run?.mark('target', (k) => k === target);
      ($('part2') as HTMLElement).hidden = (run?.step() ?? 0) < 5;
    },
    slide: (id, value) => {
      if (id === 'temp') {
        T = toT(value);
        hottest = Math.max(hottest, T);
        coolest = Math.min(coolest, T);
      } else v = Math.round(value * 1000) / 1000;
    },
    act: (what, value) => {
      if (what === 'temp') {
        T = Number(value);
        hottest = Math.max(hottest, T);
        coolest = Math.min(coolest, T);
        ($('temp') as HTMLInputElement).value = String(Math.log(T / 2000) / Math.log(17.5));
      } else if (what === 'element') {
        if (on.has(value)) on.delete(value);
        else on.add(value);
        tried.add(value);
      } else if (what === 'target') {
        target = value as Target;
        v = 0;
        ($('speed') as HTMLInputElement).value = '0';
      }
    },
    key: () => [['#fff', 'the glow at each wavelength'], ['#e8c24a', 'its peak'], ['#8fe0a4', 'an element that fits'], ['#ff9a9a', 'one that does not']],
    drawer,
    next: ['stars', 'On to the life of a star'],
  });
  sh.draw();
}
expose(
  () => [...checkKinds(KINDS), ...checkStarlight(), ...(Math.abs(peak(3600) - 805) < 1 && Math.abs(shifted(656.3, AWAY) - 683.1) < 0.1 && Math.abs(power(2 * SUN_T) - 16) < 1e-9 ? [] : ['the chamber\'s own figures'])],
  () => ({ T, target, on: [...on], v, fits: ELEMENTS.filter(fits), done: sh.kept.chapter }),
);
