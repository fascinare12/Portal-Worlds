/**
 * The cave's drawings: six beasts, six places, six moons and four signs, as
 * marks of mineral on rock. Each is a few strokes, roughened by a filter so
 * that the edges wander and the pigment is patchy, the way paint sits on
 * stone. The palette is the real one: red and yellow ochre, charcoal,
 * manganese black, and white calcite.
 */

export const OCHRE = '#b0472b';
export const YELLOW = '#cf9a3c';
export const CHARCOAL = '#241d19';
export const CALCITE = '#ece3d2';

/** The filters every drawing uses: put once into the page. */
export const FILTERS = `<svg width="0" height="0" style="position:absolute"><defs>
  <filter id="pigment" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="3" result="wander"/>
    <feDisplacementMap in="SourceGraphic" in2="wander" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="rough"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="8" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.42" result="patchy"/>
    <feComposite in="rough" in2="patchy" operator="in"/>
  </filter>
  <filter id="blown" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="soft"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.5" result="spray"/>
    <feComposite in="soft" in2="spray" operator="in"/>
  </filter>
</defs></svg>`;

const line = (d: string, colour = CHARCOAL, width = 3) => `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const fill = (d: string, colour: string) => `<path d="${d}" fill="${colour}" stroke="${CHARCOAL}" stroke-width="2.2" stroke-linejoin="round"/>`;
const dot = (x: number, y: number, r: number, colour = CHARCOAL) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${colour}"/>`;

/** Each beast, facing right, in a box 100 wide and 70 high. */
const BEASTS: string[] = [
  // The sabre-tooth: a lean cat with a bobbed tail and two long teeth.
  fill('M12 36 Q16 26 34 26 Q52 24 64 26 Q72 17 82 21 Q91 26 88 34 Q84 40 76 38 Q72 43 68 42 L68 60 L62 60 L60 46 Q46 49 32 46 L30 60 L24 60 L22 44 Q14 44 12 36Z', YELLOW) + line('M13 35 Q6 33 6 26') + fill('M73 20 l2 -7 l5 6z', YELLOW) + `<path d="M80 36 l1.5 12 l3 -11z M85 35 l1 9 l2.5 -9z" fill="${CALCITE}" stroke="${CHARCOAL}" stroke-width="1"/>` + dot(83, 27, 1.4),
  // The cave bear: heavy and round, with small ears and no tail to speak of.
  fill('M10 44 Q10 22 34 19 Q52 14 64 21 Q74 18 83 27 Q92 32 91 40 Q87 47 76 44 L72 47 L72 61 L62 61 L61 51 Q48 55 34 51 L33 61 L23 61 L21 51 Q10 53 10 44Z', OCHRE) + `<circle cx="70" cy="19" r="4.5" fill="${OCHRE}" stroke="${CHARCOAL}" stroke-width="2"/>` + dot(84, 31, 1.5) + dot(91, 38, 1.8),
  // The hyena: high at the shoulder and low behind, round ears, a spotted flank.
  fill('M14 47 Q16 37 32 33 Q50 25 62 22 Q70 13 80 17 Q89 21 89 30 Q85 36 76 34 Q72 39 68 38 L68 60 L62 60 L60 45 Q46 47 34 47 L33 60 L27 60 L25 49 Q16 51 14 47Z', YELLOW) + `<circle cx="72" cy="15" r="4.2" fill="${YELLOW}" stroke="${CHARCOAL}" stroke-width="2"/>` + line('M15 46 Q8 50 8 57') + [[36, 38], [44, 34], [50, 40], [56, 31], [42, 42], [30, 42]].map(([x, y]) => dot(x, y, 2)).join('') + dot(82, 23, 1.4),
  // The wolf: pointed ears, a long nose, and a brush of a tail.
  fill('M16 36 Q22 28 36 28 Q52 26 62 28 Q68 18 76 20 L92 28 Q91 33 82 34 Q76 36 70 40 L70 60 L64 60 L62 46 Q48 48 34 46 L32 60 L26 60 L24 44 Q18 42 16 36Z', '#8c7a68') + fill('M70 20 l1 -10 l6 8z', '#8c7a68') + fill('M17 36 Q5 37 3 51 Q10 47 19 42Z', '#8c7a68') + dot(79, 25, 1.4),
  // The woolly rhino: long and low, the head hung, one great horn and one small.
  fill('M10 38 Q12 22 34 22 Q52 17 66 26 Q78 25 88 36 Q93 42 86 47 Q78 49 70 45 L70 61 L61 61 L60 49 Q46 53 32 49 L31 61 L22 61 L21 47 Q12 47 10 38Z', OCHRE) + fill('M83 36 Q91 22 93 10 Q84 20 78 33Z', CALCITE) + fill('M74 30 l2 -9 l4 9z', CALCITE) + fill('M64 25 l2 -7 l4 6z', OCHRE) + dot(78, 37, 1.4) + line('M30 32 l4 6 M38 30 l4 6 M46 30 l4 6 M54 31 l3 6', CHARCOAL, 1.6),
  // The mammoth: a domed head, a high shoulder sloping away behind, a trunk and a long curved tusk.
  fill('M16 42 Q18 20 40 15 Q52 6 64 14 Q76 10 81 25 Q85 34 82 46 L82 61 L73 61 L72 49 Q60 53 44 49 L43 61 L34 61 L33 47 Q24 47 21 61 L13 61 Q13 49 16 42Z', '#7a4a32') + line('M80 30 Q92 42 86 60', CHARCOAL, 4) + line('M77 38 Q98 46 93 25', CALCITE, 3.4) + dot(74, 24, 1.5) + line('M26 46 l-2 7 M38 49 l-1 7 M50 51 l0 7 M62 50 l1 7', CHARCOAL, 1.6),
];

/** Each place, as a sign. */
const PLACES: string[] = [
  // The ford: water, and the stones across it.
  line('M10 28 Q22 20 34 28 T58 28 T82 28', '#4d6a78', 3.4) + line('M14 50 Q26 42 38 50 T62 50 T86 50', '#4d6a78', 3.4) + [22, 40, 58, 76].map((x) => `<ellipse cx="${x}" cy="39" rx="6" ry="4" fill="${CALCITE}" stroke="${CHARCOAL}" stroke-width="1.6"/>`).join(''),
  // The cliff: high ground, and the drop.
  fill('M8 22 L48 20 L52 30 L50 44 L55 58 L8 60Z', OCHRE) + line('M56 58 L92 60', CHARCOAL, 2.6) + line('M62 30 l4 8 M70 24 l5 12 M80 34 l3 8', CHARCOAL, 1.8),
  // The marsh: reeds standing in still water.
  line('M10 54 H90', '#4d6a78', 3.4) + [18, 30, 42, 54, 66, 78].map((x, i) => line(`M${x} 54 Q${x + (i % 2 ? 3 : -3)} 36 ${x + (i % 2 ? -2 : 2)} ${16 + (i % 3) * 5}`, '#5d6b3a', 2.6) + `<ellipse cx="${x + (i % 2 ? -2 : 2)}" cy="${15 + (i % 3) * 5}" rx="2.6" ry="6" fill="#5b3b25"/>`).join(''),
  // The high pass: two peaks, and the way between.
  fill('M6 60 L30 12 L48 44 L46 60Z', '#8c7a68') + fill('M54 60 L52 44 L70 16 L94 60Z', '#8c7a68') + `<path d="M30 12 l-6 12 l6 -3 l5 5z M70 16 l-6 10 l6 -2 l6 5z" fill="${CALCITE}"/>` + line('M48 62 Q50 50 50 40', YELLOW, 2.4),
  // The pines: three trees.
  [22, 50, 78].map((x, i) => fill(`M${x} ${10 + i * 3} L${x + 13} 34 L${x + 6} 33 L${x + 15} 52 L${x - 15} 52 L${x - 6} 33 L${x - 13} 34Z`, '#4f5d33') + line(`M${x} 52 V62`, '#5b3b25', 3.4)).join(''),
  // The far cave: a dark mouth in the hill.
  fill('M6 60 Q10 14 50 10 Q90 14 94 60Z', '#8c7a68') + `<path d="M32 60 Q34 28 50 26 Q66 28 68 60Z" fill="#120d0a" stroke="${CHARCOAL}" stroke-width="2"/>`,
];

/** Each moon, by how much of it is lit. */
function moon(i: number): string {
  const ring = `<circle cx="50" cy="35" r="24" fill="#1c1512" stroke="${CALCITE}" stroke-width="2.4"/>`;
  const lit = (d: string) => `<path d="${d}" fill="${CALCITE}"/>`;
  // The lit part: its outer edge is half the rim; its inner edge bulges one way or the other.
  const right = (bulge: number) => lit(`M50 11 A24 24 0 0 1 50 59 A${Math.abs(bulge)} 24 0 0 ${bulge > 0 ? 0 : 1} 50 11Z`);
  const left = (bulge: number) => lit(`M50 11 A24 24 0 0 0 50 59 A${Math.abs(bulge)} 24 0 0 ${bulge > 0 ? 1 : 0} 50 11Z`);
  return ring + [() => '', () => right(15), () => right(0.01), () => right(-14), () => `<circle cx="50" cy="35" r="24" fill="${CALCITE}"/>`, () => left(15)][i]();
}

/** The four signs players go by. */
const SIGN: Record<string, string> = {
  hand: `<path d="M30 64 Q23 50 26 38 L21 22 Q23 17 27 21 L32 36 L32 13 Q35 8 38 13 L39 34 L43 11 Q46 7 48 12 L46 36 L53 19 Q56 16 58 21 L51 43 Q59 38 63 40 Q66 45 59 49 Q51 57 47 64Z" fill="${OCHRE}"/>`,
  spiral: line('M50 36 Q50 30 56 30 Q64 30 64 38 Q64 48 52 48 Q38 48 38 34 Q38 18 56 18 Q76 18 76 40 Q76 58 52 58', YELLOW, 4.5),
  dots: [[36, 22], [64, 22], [50, 35], [36, 48], [64, 48]].map(([x, y]) => dot(x, y, 6.5, CALCITE)).join(''),
  zigzag: line('M18 48 L32 22 L46 48 L60 22 L74 48 L86 26', '#7fa3b4', 5),
};

/** A drawing of a token, at a given width. */
export function draw(token: number, width = 64): string {
  const inner = token < 6 ? BEASTS[token] : token < 12 ? PLACES[token - 6] : moon(token - 12);
  return `<svg viewBox="0 0 100 70" width="${width}" height="${width * 0.7}" class="mark"><g filter="url(#pigment)">${inner}</g></svg>`;
}
/** A player's sign. */
export const sign = (name: string, width = 34) => `<svg viewBox="12 4 76 64" width="${width}" height="${(width * 64) / 76}" class="mark"><g filter="url(#${name === 'hand' ? 'blown' : 'pigment'})">${SIGN[name]}</g></svg>`;

/** A patch of rock, as an image to lay behind everything: mottled, cracked, darker at the edges. */
export function rock(size = 420): string {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  if (!g) return '';
  let s = 20261124;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  g.fillStyle = '#4b3d31';
  g.fillRect(0, 0, size, size);
  // Mottling: many soft blotches, light and dark.
  for (let i = 0; i < 900; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 6 + rand() * 46;
    const tone = rand();
    g.fillStyle = tone < 0.5 ? `rgba(22,16,12,${0.03 + rand() * 0.07})` : `rgba(${150 + rand() * 60},${120 + rand() * 40},${90 + rand() * 30},${0.02 + rand() * 0.05})`;
    g.beginPath();
    g.ellipse(x, y, r, r * (0.5 + rand() * 0.8), rand() * 3, 0, 7);
    g.fill();
    // The same blotch wrapped round, so that the patch tiles without a seam.
    for (const [dx, dy] of [[size, 0], [-size, 0], [0, size], [0, -size]]) {
      g.beginPath();
      g.ellipse(x + dx, y + dy, r, r * 0.8, 0, 0, 7);
      g.fill();
    }
  }
  // Grain.
  const image = g.getImageData(0, 0, size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (rand() - 0.5) * 26;
    image.data[i] += n;
    image.data[i + 1] += n;
    image.data[i + 2] += n;
  }
  g.putImageData(image, 0, 0);
  // A few cracks.
  g.strokeStyle = 'rgba(14,10,8,0.5)';
  for (let i = 0; i < 7; i++) {
    let x = rand() * size;
    let y = rand() * size;
    g.lineWidth = 0.6 + rand() * 1.2;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 14; k++) {
      x += (rand() - 0.5) * 34;
      y += 6 + rand() * 20;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  return c.toDataURL('image/jpeg', 0.8);
}
