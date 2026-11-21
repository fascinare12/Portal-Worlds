import { draw } from './draw';
import type { Skin } from './draw';
import { Shell, checkKinds, choices, pickOne, runPractice, shuffled } from './shell';
import type { Kind } from './shell';

/**
 * Levels: the same thing, described low and high.
 * (Gödel, Escher, Bach: "Prelude...", chapter X "Levels of Description, and
 * Computer Systems", "...Ant Fugue", and chapters XI and XII.)
 *
 * The chamber is an ant colony. Each ant has three rules and knows almost
 * nothing. Watched one at a time they stumble about; watched together they
 * find the food, wear a road to it, and wear a new one when the food moves.
 * She is asked where that knowledge is kept. Then a word made of words: one
 * piece of ink with two readings, and the question of which is the real one.
 */

const sh = new Shell('portal-worlds-spire-levels-v1');
const small = (s: string, skin: Skin) => draw(s, skin).replace('class="sym"', 'class="sym" style="width:20px;height:20px;display:inline-flex;vertical-align:middle"');

// ---- Practice ----

const GLYPH: Record<string, string[]> = {
  H: ['#...#', '#...#', '#####', '#...#', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..'],
  L: ['#....', '#....', '#....', '#....', '#####'],
  X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  U: ['#...#', '#...#', '#...#', '#...#', '.###.'],
};
const LETTERS = Object.keys(GLYPH);
/** A letter built of letters built (perhaps) of letters. */
function nested(levels: string[]): string {
  const rects: string[] = [];
  const size = 5 ** levels.length;
  const fill = (depth: number, x: number, y: number, span: number): void => {
    if (depth === levels.length) {
      rects.push(`<rect x="${x}" y="${y}" width="${span * 0.86}" height="${span * 0.86}"/>`);
      return;
    }
    const cell = span / 5;
    GLYPH[levels[depth]].forEach((line, r) => [...line].forEach((c, col) => c === '#' && fill(depth + 1, x + col * cell + cell * 0.07, y + r * cell + cell * 0.07, cell * 0.86)));
  };
  fill(0, 0, 0, size);
  return `<svg viewBox="0 0 ${size} ${size}" style="width:100%;max-width:${levels.length === 3 ? 380 : 260}px;display:block;margin:auto" fill="#2f3440">${rects.join('')}</svg>`;
}
const SYSTEMS: { name: string; levels: string[][] }[] = [
  { name: 'an ant colony', levels: [['One ant turned to the left.', 'An ant put down a crumb.'], ['A line of ants is walking along the trail.'], ['The trail has shifted to go round the stone.'], ['The colony has found a new source of food.', 'The colony is getting ready for winter.']] },
  { name: 'a printed book', levels: [['There is a speck of ink at this spot.'], ['This letter is an e.'], ['This word is "tortoise".'], ['The Tortoise is teasing Achilles.', 'The story has a sad ending.']] },
  { name: 'a piece of music', levels: [['The string moves back and forth 440 times a second.'], ['This note is an A.'], ['The tune climbs by steps and then falls back.'], ['The fugue sounds mournful.', 'The piece is building to its close.']] },
  { name: 'a computer', levels: [['The voltage rose in one transistor.'], ['The number held in this slot went up by one.'], ['The loop ran ten times.'], ['The program sorted the names into order.', 'The program is checking your spelling.']] },
  { name: 'a brain', levels: [['One nerve cell fired.'], ['A patch at the back of the brain became busy.'], ['She recognised a face.'], ['She decided to forgive her sister.', 'She is wondering what to say.']] },
  { name: 'a tyre full of air', levels: [['One molecule bounced off the wall.'], ['A great many molecules are hitting this patch of rubber.'], ['The pressure in the tyre has gone up.'], ['The car is ready for the journey.']] },
];
const expand = (unit: string, m: number, tail: string, k: number) => (unit.repeat(m) + tail).repeat(k);

const KINDS: Kind[] = [
  {
    id: 'far',
    level: 1,
    make(rand) {
      const [big, little, ...rest] = shuffled(rand, LETTERS);
      const far = rand() < 0.5;
      return { ask: far ? 'Standing well back, what letter is it?' : 'Looking closely, what letter is it made of?', show: nested([big, little]), ...choices(rand, far ? big : little, [far ? little : big, rest[0], rest[1]]), why: `From far off it is ${big}; close to, it is made of ${little}s. Both are true of the same marks.` };
    },
  },
  {
    id: 'middle',
    level: 2,
    make(rand) {
      const [a, b, c, d] = shuffled(rand, LETTERS);
      const which = Math.floor(rand() * 3);
      return { ask: ['Standing well back, what letter is it?', 'There is a level in between the largest and the smallest. What letter is it there?', 'Right up close, what are the smallest letters?'][which], show: nested([a, b, c]), ...choices(rand, [a, b, c][which], [a, b, c, d].filter((x) => x !== [a, b, c][which])), why: `It is ${a} made of ${b}s, and each of those is made of ${c}s. Three levels, one picture.` };
    },
  },
  {
    id: 'chunk',
    level: 2,
    make(rand, skin) {
      for (;;) {
        const unit = Array.from({ length: 2 + Math.floor(rand() * 2) }, () => pickOne(rand, ['a', 'b', 'c'])).join('');
        const m = 2 + Math.floor(rand() * 2);
        const k = 2 + Math.floor(rand() * 2);
        const tail = rand() < 0.7 ? pickOne(rand, ['a', 'b', 'c']) : '';
        const target = expand(unit, m, tail, k);
        if (target.length > 20 || new Set(unit).size < 2) continue;
        const say = (u: string, mm: number, t: string, kk: number) => `[ ${[...u].map((s) => small(s, skin)).join('')} × ${mm}${t ? `, then ${small(t, skin)}` : ''} ] × ${kk}`;
        const other = pickOne(rand, ['a', 'b', 'c'].filter((x) => x !== tail));
        const wrong = ([[unit, m + 1, tail, k], [unit, m, tail, k + 1], [[...unit].reverse().join(''), m, tail, k], [unit, m, other, k], [unit, m - 1, tail, k + 1]] as [string, number, string, number][]).filter(([u, mm, t, kk]) => mm > 0 && expand(u, mm, t, kk) !== target);
        return { ask: 'Which short description gives exactly this row?', show: `<div class="row small">${[...target].map((s) => draw(s, skin)).join('')}</div>`, outside: `<p class="soft">${target.length} marks in all. Look for the piece that repeats; then for what the repeats themselves repeat.</p>`, ...choices(rand, say(unit, m, tail, k), shuffled(rand, wrong).map((w) => say(...w))), why: 'The row and the description are the same thing at two levels. The description is shorter because it names the pattern.' };
      }
    },
  },
  {
    id: 'top',
    level: 2,
    make(rand) {
      const sys = pickOne(rand, SYSTEMS);
      const lines = sys.levels.map((l) => pickOne(rand, l));
      const high = rand() < 0.5;
      return { ask: high ? 'Which of these is said at the highest level?' : 'Which of these is said at the lowest level?', show: `<p>Four true things about ${sys.name}:</p>`, ...choices(rand, high ? lines[3] : lines[0], lines.filter((_, i) => i !== (high ? 3 : 0))), why: 'None of the four contradicts another. They describe the same events in bigger or smaller pieces.' };
    },
  },
  {
    id: 'same',
    level: 3,
    make(rand) {
      const [one, two] = shuffled(rand, SYSTEMS);
      const level = Math.floor(rand() * 4);
      const lines = two.levels.map((l) => pickOne(rand, l));
      return { ask: `Which statement about ${two.name} is at the same level?`, show: `<p>About ${one.name}: <b>${pickOne(rand, one.levels[level])}</b></p>`, ...choices(rand, lines[level], lines.filter((_, i) => i !== level)), why: `Both are about ${['the smallest single part', 'a small group of parts', 'a pattern across many parts', 'what the whole thing is doing'][level]}.` };
    },
  },
];

// ---- The chamber: an ant colony ----

const W = 110;
const H = 62;
const NEST = { x: 20, y: 31 };
const SPOTS = [{ x: 86, y: 14 }, { x: 80, y: 50 }, { x: 52, y: 8 }];
let food = 0;
let scent = new Float32Array(W * H);
interface Ant {
  x: number;
  y: number;
  dir: number;
  carrying: boolean;
}
let ants: Ant[] = [];
let delivered = 0;
let sinceMove = 0;
let view: 'colony' | 'ant' | 'trail' = 'colony';
let step = 0; // 0 watching, 1 asked about one ant, 2 told to move the food, 3 food moved, 4 asked where, 5 the word, 6 done
let said = '';
let zoom = 1;
const scentAt = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : scent[Math.floor(y) * W + Math.floor(x)]);
function reset(): void {
  ants = Array.from({ length: 80 }, () => ({ x: NEST.x, y: NEST.y, dir: Math.random() * Math.PI * 2, carrying: false }));
  scent = new Float32Array(W * H);
}
function tick(): void {
  const f = SPOTS[food];
  for (const a of ants) {
    if (a.carrying) {
      // Rule 3: with a crumb, walk straight home, leaving scent.
      a.dir = Math.atan2(NEST.y - a.y, NEST.x - a.x) + (Math.random() - 0.5) * 0.5;
      const i = Math.floor(a.y) * W + Math.floor(a.x);
      scent[i] = Math.min(60, scent[i] + 2.4);
      if (Math.hypot(a.x - NEST.x, a.y - NEST.y) < 2.2) {
        a.carrying = false;
        a.dir += Math.PI;
        delivered++;
        sinceMove++;
      }
    } else {
      // Rule 2: follow scent, away from home. Rule 1: otherwise wander.
      const here = Math.hypot(a.x - NEST.x, a.y - NEST.y);
      let best = 0.25;
      let turn = 0;
      for (const d of [-0.6, 0, 0.6]) {
        const sx = a.x + Math.cos(a.dir + d) * 3;
        const sy = a.y + Math.sin(a.dir + d) * 3;
        const s = scentAt(sx, sy) * (1 + 0.35 * (Math.hypot(sx - NEST.x, sy - NEST.y) - here));
        if (s > best) {
          best = s;
          turn = d;
        }
      }
      a.dir += best > 0.25 ? turn * 0.7 + (Math.random() - 0.5) * 0.25 : (Math.random() - 0.5) * 0.7;
      if (Math.hypot(a.x - f.x, a.y - f.y) < 3) {
        a.carrying = true;
        a.dir += Math.PI;
      }
    }
    a.x += Math.cos(a.dir) * 0.55;
    a.y += Math.sin(a.dir) * 0.55;
    if (a.x < 1 || a.x > W - 2) {
      a.dir = Math.PI - a.dir;
      a.x = Math.max(1, Math.min(W - 2, a.x));
    }
    if (a.y < 1 || a.y > H - 2) {
      a.dir = -a.dir;
      a.y = Math.max(1, Math.min(H - 2, a.y));
    }
  }
  for (let i = 0; i < scent.length; i++) scent[i] *= 0.992;
}
function bookCard(): string {
  return `<div class="card book"><h3>In the book</h3>
    <ul class="terms">
      <li>What you watched are <b>levels of description</b>: ant, trail, colony. Each is a true account of the same events.</li>
      <li>In the dialogue "...Ant Fugue" the colony is a character, <b>Aunt Hillary</b>, who holds conversations of which no ant knows anything. Teams of ants there are <b>signals</b>; at a higher level they make up <b>symbols</b>.</li>
      <li><b>Reductionism</b> says the whole is fully explained by its parts. <b>Holism</b> says the whole has properties the parts lack. The dialogue's answer to "which is right?" is the <b>MU</b> you met in the first chamber: unask the question.</li>
      <li>Grouping many small things into one named thing is <b>chunking</b>. Something true of the whole that no part causes on purpose is an <b>epiphenomenon</b>.</li>
    </ul>
    <p>This is the book's picture of a brain: nerve cells that know nothing, and thoughts that are real all the same, at another level. It is also a fair picture of a neural network, where no single number knows anything and whatever the system knows is in the pattern.</p></div>`;
}
const ASKS: Record<number, [string, string[], number, string]> = {
  1: ['Does this ant know where the food is?', ['Yes: it is heading for it', 'No: it knows the way home, and how to follow a smell', 'Only once it has been there'], 1, 'Its whole rulebook is three lines. Nothing in them says where food is. Even an ant carrying a crumb only knows to go home.'],
  4: ['The colony found the new place, and its road moved. Where was the route kept?', ['In the memory of the oldest ant', 'In a plan held at the nest', 'In the trail: a pattern that no ant can see whole'], 2, 'The route is the scent on the ground, laid by many ants and followed by many others. It is knowledge that belongs to the colony and to no ant.'],
  5: ['One piece of ink, two readings. Which is the real one?', ['The big word: the small ones are only how it is drawn', 'The small words: the big one is only an impression', 'Both, at different levels'], 2, 'Neither reading is a mistake, and neither can be read off without the other being there. Which you see depends on where you stand.'],
};

if (sh.practising) {
  runPractice(sh, 'Practice · low and high', 'What level is that?', 'The same thing can be read in small pieces or large ones. Tell them apart, and move between them.', KINDS);
} else {
  sh.page.innerHTML = `<div class="kicker">Prelude, Ant Fugue · Chapters X to XII</div><h1>Levels</h1><div id="top"></div><div class="card" id="stage"><canvas id="ants" width="${W * 8}" height="${H * 8}" style="width:100%;display:block;border-radius:10px;background:#fbfaf7"></canvas><div class="bar" id="views"></div></div><div class="card" id="word" style="display:none"><div style="overflow:hidden;border-radius:10px;background:#fbfaf7;height:230px;display:flex;align-items:center;justify-content:center"><canvas id="ink" width="1500" height="420" style="width:100%;transform-origin:center"></canvas></div><div class="bar"><span class="soft">far</span><input id="zoom" type="range" min="0.6" max="7" step="0.1" value="1" style="flex:1"><span class="soft">near</span></div></div><div id="rest"></div>`;
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  const canvas = $('ants') as HTMLCanvasElement;
  const g = canvas.getContext('2d')!;
  reset();

  // The word made of words.
  const ink = $('ink') as HTMLCanvasElement;
  {
    const mask = document.createElement('canvas');
    mask.width = 150;
    mask.height = 42;
    const mg = mask.getContext('2d', { willReadFrequently: true })!;
    mg.font = 'bold 40px Georgia, serif';
    mg.textAlign = 'center';
    mg.textBaseline = 'middle';
    mg.fillText('WHOLE', 75, 23);
    const data = mg.getImageData(0, 0, 150, 42).data;
    const ig = ink.getContext('2d')!;
    ig.fillStyle = '#2f3440';
    ig.font = '9px Georgia, serif';
    ig.textBaseline = 'top';
    for (let y = 0; y < 42; y++) for (let x = 0; x < 150; x += 2) if (data[(y * 150 + x) * 4 + 3] > 110) ig.fillText('part', x * 10, y * 10);
  }
  ($('zoom') as HTMLInputElement).addEventListener('input', (e) => {
    zoom = Number((e.target as HTMLInputElement).value);
    ink.style.transform = `scale(${zoom})`;
  });

  sh.render = () => {
    const ask = ASKS[step];
    const lead =
      step === 0
        ? `<p>A nest (dark), some food (gold) and eighty ants. Watch what they do. <span class="soft">${delivered} crumbs brought home so far.</span></p>`
        : step === 2
          ? `<p><b>Now move the food</b>, and watch the colony, not the ants.</p><div class="bar"><button class="chip gold" data-do="move">Move the food</button></div>`
          : step === 3
            ? `<p>The food has moved. The old road leads nowhere now. <span class="soft">${sinceMove} crumbs brought home from the new place.</span></p>`
            : step >= 5
              ? `<p>The same thing happens on a page. Slide from far to near.</p>`
              : '';
    const rules = view === 'ant' ? `<div class="card"><div class="label">This ant's whole rulebook</div><ul class="terms"><li><b>1.</b> If there is nothing to smell, wander.</li><li><b>2.</b> If you smell a trail, follow it away from home.</li><li><b>3.</b> If you bump into food, pick up a crumb and walk straight home, leaving a smell behind you.</li></ul></div>` : '';
    // What was said about her last answer stays in view, above whatever comes next.
    $('top').innerHTML = `${said ? `<div class="card"><p class="${said.startsWith('Yes') ? 'good' : 'bad'}">${said}</p></div>` : ''}<div class="card">${lead}${ask ? `<p><b>${ask[0]}</b></p><div class="reasons">${ask[1].map((o, i) => `<button data-do="answer" data-v="${i}">${o}</button>`).join('')}</div>` : ''}</div>${rules}`;
    $('views').innerHTML = (['colony', 'ant', 'trail'] as const).map((v) => `<button class="chip${view === v ? '' : ' pale'}" data-do="view" data-v="${v}">${v === 'colony' ? 'The colony' : v === 'ant' ? 'One ant' : 'Only the trail'}</button>`).join('');
    $('stage').style.display = step >= 5 ? 'none' : 'block';
    $('word').style.display = step >= 5 ? 'block' : 'none';
    $('rest').innerHTML = step >= 6 ? `${bookCard()}<div class="bar"><a class="chip gold" href="./levels.html?practice">Practise the move ▶</a><a class="chip pale" href="./index.html">Back to the map</a></div>` : '';
  };
  sh.on((what, value) => {
    if (what === 'view') view = value as typeof view;
    else if (what === 'move') {
      food = (food + 1) % SPOTS.length;
      sinceMove = 0;
      step = 3;
      view = 'colony';
      said = '';
    } else if (what === 'answer') {
      const ask = ASKS[step];
      const right = Number(value) === ask[2];
      said = `${right ? 'Yes.' : 'Not quite.'} ${ask[3]}`;
      if (step === 1) {
        step = 2;
        view = 'colony';
      } else if (step === 4) step = 5;
      else if (step === 5) {
        step = 6;
        sh.finish();
      }
    }
    sh.draw();
  });
  sh.draw();

  let frames = 0;
  const loop = () => {
    if (step < 5) {
      for (let i = 0; i < 3; i++) tick();
      const s = canvas.width / W;
      g.clearRect(0, 0, canvas.width, canvas.height);
      if (view !== 'ant') {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const v = scent[y * W + x];
          if (v < 0.3) continue;
          g.fillStyle = `rgba(185,72,110,${Math.min(0.75, v / 22)})`;
          g.fillRect(x * s, y * s, s, s);
        }
      }
      g.fillStyle = '#2f3440';
      g.beginPath();
      g.arc(NEST.x * s, NEST.y * s, 2.4 * s, 0, 7);
      g.fill();
      g.fillStyle = '#c9951c';
      g.beginPath();
      g.arc(SPOTS[food].x * s, SPOTS[food].y * s, 2.6 * s, 0, 7);
      g.fill();
      if (view !== 'trail') {
        ants.forEach((a, i) => {
          const me = view === 'ant' && i === 0;
          if (view === 'ant' && !me) g.globalAlpha = 0.12;
          g.fillStyle = a.carrying ? '#c9951c' : '#2f3440';
          g.beginPath();
          g.arc(a.x * s, a.y * s, (me ? 1.1 : 0.55) * s, 0, 7);
          g.fill();
          if (me) {
            g.strokeStyle = '#2c7f93';
            g.lineWidth = 2;
            g.beginPath();
            g.arc(a.x * s, a.y * s, 3 * s, 0, 7);
            g.stroke();
          }
          g.globalAlpha = 1;
        });
      }
      // The story moves on when the colony has done its part.
      if (step === 0 && delivered >= 12) {
        step = 1;
        view = 'ant';
        sh.draw();
      } else if (step === 3 && sinceMove >= 8) {
        step = 4;
        sh.draw();
      } else if (++frames % 45 === 0 && (step === 0 || step === 3)) sh.draw();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  (window as unknown as { colony: unknown }).colony = { run: (n: number) => { for (let i = 0; i < n; i++) tick(); return { delivered, sinceMove }; }, state: () => ({ step, delivered, sinceMove, view, done: sh.kept.chapter }) };
}
(window as unknown as { spire: Record<string, unknown> }).spire = { ...((window as unknown as { spire?: Record<string, unknown> }).spire ?? {}), check: () => checkKinds(KINDS) };
