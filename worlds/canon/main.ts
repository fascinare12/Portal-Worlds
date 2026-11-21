import * as THREE from 'three';
import { mobiusGeometry } from '../../src/mobius';
import { BACH, BAR, ROUND, Score, harsh, roundsHome } from './score';
import type { Placed, Rules } from './score';
import { Voices } from './sound';

/**
 * The Endless Canon: a white world with a spire in it, and round the spire a
 * path of stones that is also a piece of music. Time runs round the spire;
 * the height of a stone is the height of its note. Three voices walk it.
 *
 * She builds Bach's "Canon per tonos" one rule at a time:
 *
 *   1  a tune
 *   2  the tune chases itself (how far behind, how much higher)
 *   3  the end is higher than the beginning (so the circle becomes a spiral)
 *   4  six rounds, and you are home, but higher
 *
 * and then it is hers: every rule can be changed and every stone dragged.
 *
 *   drag ............ look round the spire        scroll / pinch ... nearer, farther
 *   ◉ ............... from the side, or from above
 *
 * For development: ?fresh forgets what is kept, ?stage=3 starts at that rule,
 * ?top starts looking from above, ?speed=4 runs faster.
 */

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const params = new URLSearchParams(window.location.search);
const canvas = $<HTMLCanvasElement>('world');
const MIST = new THREE.Color(0xf4f2ee);
const VOICE = [new THREE.Color(0xc9951c), new THREE.Color(0x2c7f93), new THREE.Color(0xb9486e)];
const TRACK = [9.2, 10.9, 12.6];
/** How far the path climbs for each semitone a round begins higher. */
const CLIMB = 2.4;
/** How far a stone stands up for each semitone of its own note. */
const STEP = 0.14;
const SPIRE = 7.4;
const TEMPO = (80 / 60) * 4; // sixteenths in a second, at an unhurried walk

// ---- What is kept ----

const KEY = 'portal-worlds-canon-v1';
interface Kept {
  stage: number;
  rules: Rules;
}
const begun: Rules = { delay: 8, interval: 0, step: 0 };
let stage = 1;
let rules: Rules = { ...begun };
try {
  const saved: Kept | null = JSON.parse((!params.has('fresh') && localStorage.getItem(KEY)) || 'null');
  if (saved) {
    stage = saved.stage;
    rules = { ...begun, ...saved.rules };
  }
} catch {
  // nothing kept: begin at the beginning
}
if (params.has('stage')) {
  stage = Number(params.get('stage'));
  rules = { delay: stage > 2 ? BACH.delay : begun.delay, interval: stage > 2 ? BACH.interval : begun.interval, step: stage > 3 ? BACH.step : 0 };
}
const keep = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ stage, rules } satisfies Kept));
  } catch {
    // private browsing: nothing is kept, and that is fine
  }
};

// ---- The music, and where we are in it ----

const score = new Score();
const sound = new Voices();
let speed = Number(params.get('speed') ?? 1);
const heard = [true, true, true];
let started = false;
let posRef = ROUND;
let timeRef = 0;
let scheduled = ROUND;
const clockNow = () => (sound.ctx ? sound.ctx.currentTime : performance.now() / 1000);
const rate = () => TEMPO * speed;
const where = () => (started ? posRef + (clockNow() - timeRef) * rate() : posRef);
/** Move to another place in the music, or carry on from here at a new speed. */
function anchor(pos = where()): void {
  posRef = pos;
  timeRef = clockNow();
  scheduled = pos;
}

const rounds = new Map<number, Placed[][]>();
function roundOf(r: number): Placed[][] {
  let got = rounds.get(r);
  if (!got) {
    got = [0, 1, 2].map((v) => (r < 0 ? [] : score.round(v as 0 | 1 | 2, r, rules)));
    rounds.set(r, got);
    if (rounds.size > 40) rounds.delete(rounds.keys().next().value!);
  }
  return got;
}
const voiceOn = (v: number) => heard[v] && (stage > 1 || v === 0);
const angleAt = (pos: number) => (pos / ROUND) * Math.PI * 2;
const pathAt = (pos: number) => (pos / ROUND) * rules.step * CLIMB;
const stoneY = (n: Placed) => pathAt(n.at) + (n.pitch - 60) * STEP;

function schedule(): void {
  if (!started) return;
  const pos = where();
  const until = pos + rate() * 0.25;
  for (let r = Math.floor(scheduled / ROUND); r <= Math.floor(until / ROUND); r++) {
    roundOf(r).forEach((list, v) => {
      if (!voiceOn(v)) return;
      for (const n of list) {
        if (n.at < scheduled || n.at >= until) continue;
        sound.note(timeRef + (n.at - posRef) / rate(), n.length / rate(), n.pitch, n.rise, [0, -0.5, 0.5][v], [0.2, 0.15, 0.15][v]);
      }
    });
  }
  scheduled = until;
}

// ---- The world ----

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = MIST;
const camera = new THREE.PerspectiveCamera(46, 1, 0.5, 600);
scene.add(new THREE.HemisphereLight(0xffffff, 0xe4e2ee, 2.4));
const sun = new THREE.DirectionalLight(0xfff4e0, 0.9);
sun.position.set(20, 40, 10);
scene.add(sun);

// The spire: pale rock, banded, fading into the white above and below.
const spireMat = new THREE.ShaderMaterial({
  uniforms: { uEye: { value: 0 }, uMist: { value: MIST }, uTop: { value: 0 } },
  vertexShader: /* glsl */ `
    varying vec3 vWorld; varying vec3 vNormal;
    void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; vNormal = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: /* glsl */ `
    uniform float uEye; uniform vec3 uMist; uniform float uTop;
    varying vec3 vWorld; varying vec3 vNormal;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      float around = atan(vWorld.z, vWorld.x);
      float band = sin(vWorld.y * 1.7 + sin(around * 3.0) * 1.2) * 0.5 + 0.5;
      float grain = hash(floor(vec2(around * 40.0, vWorld.y * 6.0)));
      float strata = smoothstep(0.46, 0.5, abs(fract(vWorld.y * 0.42 + sin(around * 2.0) * 0.08) - 0.5));
      vec3 rock = mix(vec3(0.92, 0.91, 0.90), vec3(0.985, 0.98, 0.97), band) - grain * 0.012 - strata * 0.05;
      float light = 0.9 + 0.1 * dot(normalize(vNormal), normalize(vec3(0.5, 0.6, 0.3)));
      float far = smoothstep(9.0, 26.0, abs(vWorld.y - uEye));
      gl_FragColor = vec4(mix(rock * light, uMist, max(far, uTop * 0.6)), 1.0);
      #include <colorspace_fragment>
    }`,
});
const spire = new THREE.Mesh(new THREE.CylinderGeometry(SPIRE, SPIRE, 110, 64, 1, false), spireMat);
scene.add(spire);

// The stones: every note cut into short pieces that curve round the spire.
const MAX = 3200;
const stones = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), MAX);
stones.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
stones.frustumCulled = false;
scene.add(stones);
/** Which note each piece of stone belongs to, for dragging. */
const owner: (Placed | null)[] = new Array(MAX).fill(null);

// A gate where each round begins.
const GATES = 9;
const gates = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), GATES * 3);
gates.frustumCulled = false;
scene.add(gates);
let gateFlash = 0;
let gateGood = true;
const BAD = new THREE.Color(0x7a2020);

// The three voices.
const glowMap = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const walkers = VOICE.map((colour) => {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 14), new THREE.MeshLambertMaterial({ color: colour, emissive: colour, emissiveIntensity: 0.35 }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: colour, transparent: true, opacity: 0.55, depthWrite: false }));
  halo.scale.setScalar(2.6);
  group.add(body, halo);
  scene.add(group);
  return { group, body, halo, y: 0 };
});

// Sparks, for when two voices grate.
const SPARKS = 48;
const sparkGeo = new THREE.BufferGeometry();
const sparkPos = new Float32Array(SPARKS * 3);
const sparkVel = new Float32Array(SPARKS * 3);
const sparkLife = new Float32Array(SPARKS);
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xb23a3a, size: 0.34, transparent: true, opacity: 0.9, depthWrite: false }));
sparks.frustumCulled = false;
scene.add(sparks);
let nextSpark = 0;

// And, off in the mist, the thing the pool in the wood is made of: a band with one side.
const band = new THREE.Mesh(mobiusGeometry(9, 2.6), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.3 }));
scene.add(band);

// ---- Looking ----

const tall = () => window.innerHeight > window.innerWidth;
let turn = tall() ? 0.12 : 0.5; // how far round from the walker the eye stands
let distance = tall() ? 66 : 34;
let above = params.has('top') ? 1 : 0;
let aboveGoal = above;
const eye = new THREE.Vector3();
const eyeTop = new THREE.Vector3();
function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---- Drawing one frame of the path ----

const m4 = new THREE.Matrix4();
const quat = new THREE.Quaternion();
const up = new THREE.Vector3(0, 1, 0);
const at = new THREE.Vector3();
const size = new THREE.Vector3();
const tint = new THREE.Color();
const keyTint = (rise: number, out: THREE.Color) => out.setHSL((((rise % 12) + 12) % 12) / 12, 0.55, 0.84);
let quarrel = 0;
const sounding: (Placed | null)[] = [null, null, null];

function drawPath(pos: number, focusY: number): void {
  const here = Math.floor(pos / ROUND);
  let count = 0;
  sounding.fill(null);
  const lap = Math.max(2.4, Math.abs(rules.step) * CLIMB);
  const lo = rules.step === 0 ? here : here - 4;
  const hi = rules.step === 0 ? here : here + 4;
  for (let r = lo; r <= hi; r++) {
    // A flat ring is the same round over and over: draw it once, as the round we are in.
    roundOf(r).forEach((list, v) => {
      if (stage === 1 && v > 0) return;
      for (const n of list) {
        const y = stoneY(n);
        const off = y - focusY;
        // Out of the white, into the white: stones far above or below thin away. From above, whatever is over the walker's head is lifted off.
        const fromSide = 1 - THREE.MathUtils.smoothstep(Math.abs(off), 7, 15);
        const fromAbove = (1 - THREE.MathUtils.smoothstep(off, lap * 0.72, lap * 0.78)) * (1 - 0.8 * THREE.MathUtils.smoothstep(-off, lap, lap * 4));
        const fade = THREE.MathUtils.lerp(fromSide, fromAbove, above);
        if (fade <= 0.01) continue;
        const live = pos >= n.at && pos < n.at + n.length;
        if (live) sounding[v] = n;
        const pieces = Math.ceil(n.length / 2);
        keyTint(n.rise, tint).lerp(VOICE[v], live ? 1 : 0.16);
        if (!voiceOn(v)) tint.lerp(MIST, 0.6);
        tint.lerp(MIST, 1 - fade);
        for (let i = 0; i < pieces && count < MAX; i++) {
          const a0 = n.at + (n.length * i) / pieces;
          const span = n.length / pieces;
          const mid = angleAt(a0 + span / 2);
          const arc = TRACK[v] * angleAt(span);
          at.set(Math.cos(mid) * TRACK[v], y + (live ? 0.14 : 0), Math.sin(mid) * TRACK[v]);
          quat.setFromAxisAngle(up, -mid - Math.PI / 2);
          size.set(Math.max(0.2, arc * 1.03 - (i === pieces - 1 ? 0.16 : 0)), 0.26 * (0.4 + 0.6 * fade), 1.2 * fade);
          m4.compose(at, quat, size);
          stones.setMatrixAt(count, m4);
          stones.setColorAt(count, tint);
          owner[count] = n;
          count++;
        }
      }
    });
  }
  stones.count = count;
  stones.instanceMatrix.needsUpdate = true;
  if (stones.instanceColor) stones.instanceColor.needsUpdate = true;

  // Gates.
  let g = 0;
  for (let r = lo; r <= hi + 1 && g < GATES; r++) {
    const y = pathAt(r * ROUND);
    const fade = (1 - THREE.MathUtils.smoothstep(Math.abs(y - focusY), 7, 15)) * (1 - above);
    const a = angleAt(r * ROUND) - 0.012;
    keyTint(r * rules.step, tint).multiplyScalar(0.8);
    if (r === Math.round(pos / ROUND) && gateFlash > 0) tint.lerp(gateGood ? VOICE[0] : BAD, gateFlash);
    tint.lerp(MIST, 1 - fade);
    const parts: [number, number, number, number, number][] = [
      [8.3, 1.7, 0.3, 5.4, 0.3],
      [13.5, 1.7, 0.3, 5.4, 0.3],
      [10.9, 4.5, 0.4, 0.4, 6.2],
    ];
    parts.forEach(([rad, dy, sx, sy, sz], i) => {
      at.set(Math.cos(a) * rad, y + dy - 1.2, Math.sin(a) * rad);
      quat.setFromAxisAngle(up, -a - Math.PI / 2);
      size.set(sx, sy, sz).multiplyScalar(fade < 0.02 ? 0 : 1);
      size.y *= Math.max(0.001, fade);
      m4.compose(at, quat, size);
      gates.setMatrixAt(g * 3 + i, m4);
      gates.setColorAt(g * 3 + i, tint);
    });
    g++;
  }
  gates.count = g * 3;
  gates.instanceMatrix.needsUpdate = true;
  if (gates.instanceColor) gates.instanceColor.needsUpdate = true;
}

function spark(a: THREE.Vector3, b: THREE.Vector3): void {
  for (let i = 0; i < 5; i++) {
    const k = nextSpark++ % SPARKS;
    sparkPos.set([(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], k * 3);
    sparkVel.set([(Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3], k * 3);
    sparkLife[k] = 0.6;
  }
}

// ---- The rules she sets, and what is said about them ----

const DELAYS = [8, 16, 24, 32];
const DELAY_NAME: Record<number, string> = { 8: 'half a bar', 16: 'one bar', 24: 'a bar and a half', 32: 'two bars' };
const INTERVALS = [0, 2, 4, 5, 7, 9];
const INTERVAL_NAME: Record<number, string> = { 0: 'the same note', 2: 'a step', 4: 'a third', 5: 'a fourth', 7: 'a fifth', 9: 'a sixth' };
const STEPS = [-2, -1, 0, 1, 2, 3, 4, 5, 6];
const stepName = (s: number) => (s === 0 ? 'no higher' : `${Math.abs(s)} ${Math.abs(s) === 1 ? 'half-step' : 'half-steps'} ${s < 0 ? 'lower' : 'higher'}`);
const SPEEDS = [1, 2, 4];

let solved = false;
let fitSince = 0;
let climbFrom = 1;
let lastRound = 1;
let said = '';

const SAY: Record<number, [string, string, string]> = {
  1: ['I · A tune', 'One tune, walking once round the spire. Time runs round; the higher the stone, the higher the note.', 'That is the whole of it: eight bars. When the walker reaches the gate, it begins again.'],
  2: [
    'II · The tune chases itself',
    'Two more voices: a second tune, and its echo, which sings the same tune again a little later. Set how far behind the echo walks and how much higher it sings. The red line is how much the three are quarrelling: give each setting a bar or two, and find the one that keeps it lowest.',
    'That is a canon: one tune that fits against itself. Bach set the echo one bar behind and a fifth higher. The line never quite empties, because he lets the voices brush past each other on the way.',
  ],
  3: [
    'III · The end is higher than the beginning',
    'Look at the clock of twelve notes, top left. The tune set out from C. By its last bars it has settled on a new home, the ringed note, so when the round begins again at the dot, the music lurches back. Move the next round until the dot sits in the ring, and listen at the gate.',
    'Two half-steps higher, and each round begins where the last one came to rest. The circle has become a spiral.',
  ],
  4: [
    'IV · Home, but higher',
    'Climb. Every round is the same tune, two half-steps higher than the last, and the stones change colour with the key. Count the rounds until the first colour comes back.',
    'Six rounds, and every note is the note you began with. You are home, and you are six rounds up. Now look from above: press ◉.',
  ],
  5: ['The endless canon', 'From the side it climbs for ever. From above it is a circle. Both are true. It is yours now: change any rule, silence a voice, or drag a stone up or down and hear every round change with it.', ''],
};

function rule(label: string, value: string, change: (by: number) => void): HTMLElement {
  const row = document.createElement('div');
  row.className = 'rule';
  row.innerHTML = `<b>${label}</b><button aria-label="less">◀</button><span>${value}</span><button aria-label="more">▶</button>`;
  const [less, more] = Array.from(row.querySelectorAll('button'));
  less.onclick = () => change(-1);
  more.onclick = () => change(1);
  return row;
}
const pick = <T,>(list: T[], now: T, by: number): T => list[Math.max(0, Math.min(list.length - 1, list.indexOf(now) + by))];

function changed(): void {
  rounds.clear();
  // A new rule begins a fresh climb, from a round low enough to see and high enough to have a round beneath it.
  const pos = where();
  anchor(ROUND + (((pos % ROUND) + ROUND) % ROUND));
  climbFrom = lastRound = 1;
  keys.clear();
  keep();
  panel();
}

function panel(): void {
  const [title, ask, found] = SAY[stage];
  $('stage').textContent = `${title}  ▾`;
  $('say').textContent = solved && found ? found : ask;
  const box = $('rules');
  box.innerHTML = '';
  if (stage === 2 || stage === 5) {
    box.append(
      rule('The echo is', `${DELAY_NAME[rules.delay]} behind`, (by) => {
        rules.delay = pick(DELAYS, rules.delay, by);
        changed();
      }),
      rule('and sings', `${INTERVAL_NAME[rules.interval]}${rules.interval ? ' higher' : ''}`, (by) => {
        rules.interval = pick(INTERVALS, rules.interval, by);
        changed();
      }),
    );
  }
  if (stage === 3 || stage === 5) {
    box.append(
      rule('Each round begins', stepName(rules.step), (by) => {
        rules.step = pick(STEPS, rules.step, by);
        changed();
        // Go and stand just before the gate, to hear whether it joins.
        if (stage === 3) anchor(2 * ROUND - BAR - 4);
      }),
    );
  }
  if (stage === 3) {
    const skip = document.createElement('button');
    skip.className = 'chip';
    skip.textContent = 'to the gate ⏭';
    skip.onclick = () => anchor((Math.floor(where() / ROUND) + 1) * ROUND - BAR - 4);
    box.append(skip);
  }
  if (stage >= 4) {
    box.append(
      rule('Walking', speed === 1 ? 'at a walk' : speed === 2 ? 'at a trot' : 'at a run', (by) => {
        const pos = where();
        speed = pick(SPEEDS, speed, by);
        anchor(pos);
        panel();
      }),
    );
  }
  if (stage === 5) {
    ['the theme', 'the tune', 'its echo'].forEach((name, v) => {
      const chip = document.createElement('button');
      chip.className = `chip v${v}${heard[v] ? '' : ' off'}`;
      chip.textContent = name;
      chip.onclick = () => {
        heard[v] = !heard[v];
        panel();
      };
      box.append(chip);
    });
    const bach = document.createElement('button');
    bach.className = 'chip';
    bach.textContent = 'as Bach wrote it';
    bach.onclick = () => {
      score.restore();
      rules = { ...BACH };
      changed();
    };
    box.append(bach);
  }
  const next = document.createElement('button');
  next.id = 'next';
  next.className = `chip${solved && stage < 4 ? ' show' : ''}`;
  next.textContent = 'On ▶';
  next.onclick = () => enter(stage + 1);
  box.append(next);
  $('quarrel').style.display = stage >= 2 ? 'block' : 'none';
  $('eye').classList.toggle('call', stage === 4 && solved);
  said = $('say').textContent ?? '';
}

function enter(to: number): void {
  stage = to;
  solved = false;
  fitSince = 0;
  if (stage === 2) rules = { ...begun };
  if (stage === 3) rules = { ...BACH, step: 0 };
  if (stage >= 4) rules = { ...rules, delay: stage === 4 ? BACH.delay : rules.delay, interval: stage === 4 ? BACH.interval : rules.interval, step: stage === 4 ? BACH.step : rules.step };
  changed();
  if (stage === 4) anchor(ROUND);
}

// The twelve keys, as a clock.
const keys = new Set<number>();
const NAMES = ['C', '', 'D', '', 'E', 'F', '', 'G', '', 'A', '', 'B'];
function clock(pos: number): void {
  const here = Math.floor(pos / ROUND);
  const tonic = (((here * rules.step) % 12) + 12) % 12;
  if (stage >= 4) keys.add(tonic);
  const dot = (k: number) => [Math.sin((k / 12) * Math.PI * 2) * 36, -Math.cos((k / 12) * Math.PI * 2) * 36];
  let svg = '<circle r="36" fill="none" stroke="#c9c6be" stroke-width="1"/>';
  const lit = [...keys].sort((a, b) => a - b);
  if (lit.length > 1) svg += `<polygon points="${lit.map((k) => dot(k).join(',')).join(' ')}" fill="rgba(201,149,28,0.12)" stroke="#c9951c" stroke-width="1"/>`;
  for (let k = 0; k < 12; k++) {
    const [x, y] = dot(k);
    const on = keys.has(k) || k === tonic;
    svg += `<circle cx="${x}" cy="${y}" r="${k === tonic ? 6.5 : on ? 4.5 : 2.2}" fill="${on ? `hsl(${k * 30},48%,${k === tonic ? 52 : 68}%)` : '#c9c6be'}"/>`;
    if (NAMES[k]) svg += `<text x="${x * 0.62}" y="${y * 0.62 + 3}" font-size="8" text-anchor="middle" fill="#6a6f7a">${NAMES[k]}</text>`;
  }
  if (stage === 3) {
    const [rx, ry] = dot((tonic + BACH.step) % 12);
    const [nx, ny] = dot((((tonic + rules.step) % 12) + 12) % 12);
    svg += `<circle cx="${rx}" cy="${ry}" r="9" fill="none" stroke="#2f3440" stroke-width="2"/><circle cx="${nx}" cy="${ny}" r="4.5" fill="#2f3440"/>`;
  }
  $('clock').innerHTML = svg;
  $('clock').classList.toggle('big', stage === 3);
  const climbed = here - climbFrom;
  $('count').textContent = stage >= 4 && rules.step !== 0 ? `round ${climbed + 1} · home every ${roundsHome(rules.step)}` : '';
}

// ---- Hands ----

const pointers = new Map<number, { x: number; y: number }>();
let pinch = 0;
let dragging: { note: Placed; y: number; from: number } | null = null;
const ray = new THREE.Raycaster();
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (stage === 5 && pointers.size === 1) {
    ray.setFromCamera(new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1), camera);
    const hit = ray.intersectObject(stones)[0];
    const note = hit && hit.instanceId !== undefined ? owner[hit.instanceId] : null;
    if (note) dragging = { note, y: e.clientY, from: (note.voice === 0 ? score.theme : score.leader)[note.index][0] ?? 63 };
  }
});
canvas.addEventListener('pointermove', (e) => {
  const was = pointers.get(e.pointerId);
  if (!was) return;
  if (dragging) {
    const line = dragging.note.voice === 0 ? score.theme : score.leader;
    const to = Math.max(48, Math.min(79, dragging.from + Math.round((dragging.y - e.clientY) / 16)));
    if (line[dragging.note.index][0] !== to) {
      line[dragging.note.index][0] = to;
      rounds.clear();
      if (sound.ctx) sound.note(sound.ctx.currentTime, 0.3, to + (dragging.note.voice === 2 ? rules.interval - 12 : 0), dragging.note.rise, 0, 0.16);
    }
    return;
  }
  if (pointers.size === 2) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const [a, b] = [...pointers.values()];
    const gap = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch) distance = THREE.MathUtils.clamp(distance * (pinch / gap), 22, 90);
    pinch = gap;
    return;
  }
  turn -= (e.clientX - was.x) * 0.006;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
});
const lift = (e: PointerEvent) => {
  pointers.delete(e.pointerId);
  pinch = 0;
  dragging = null;
};
canvas.addEventListener('pointerup', lift);
canvas.addEventListener('pointercancel', lift);
canvas.addEventListener('wheel', (e) => {
  distance = THREE.MathUtils.clamp(distance * (1 + Math.sign(e.deltaY) * 0.08), 22, 90);
});

// The panel folds away when its heading is pressed, to leave more room for looking.
$('stage').onclick = () => $('panel').classList.toggle('folded');
$('eye').onclick = () => {
  aboveGoal = aboveGoal ? 0 : 1;
  if (stage === 4 && solved) {
    stage = 5;
    solved = false;
    keep();
    panel();
  }
};
$('sound').onclick = () => {
  sound.setOn(!sound.on);
  $('sound').style.opacity = sound.on ? '1' : '0.4';
};
$('fresh').onclick = () => {
  if (!window.confirm('Take the canon apart and build it again from the first rule?')) return;
  score.restore();
  heard.fill(true);
  speed = 1;
  aboveGoal = 0;
  enter(1);
};
$('go').onclick = () => {
  $('begin').style.display = 'none';
  sound.start();
  started = true;
  anchor(posRef);
};
const veil = $('veil');
$('home').onclick = () => {
  // Back to the map of the Spire; the wood is one step further out.
  veil.classList.remove('open');
  setTimeout(() => (window.location.href = './index.html'), 900);
};
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});
requestAnimationFrame(() => veil.classList.add('open'));

// ---- Every frame ----

const head = new THREE.Vector3();
const places = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
let last = performance.now();
panel();

renderer.setAnimationLoop(() => {
  const now = performance.now();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  schedule();
  const pos = where();
  const here = Math.floor(pos / ROUND);
  const focusY = pathAt(pos);

  // Passing a gate.
  if (here !== lastRound && started) {
    if (here > lastRound && stage === 3) {
      gateGood = rules.step === BACH.step;
      gateFlash = 1;
      if (gateGood) {
        sound.chime();
        if (!solved) {
          solved = true;
          panel();
        }
      } else sound.knock();
    }
    if (stage === 1 && !solved) {
      solved = true;
      panel();
    }
    if (stage === 4 && !solved && here - climbFrom >= roundsHome(rules.step)) {
      solved = true;
      sound.chime(79);
      panel();
    }
    lastRound = here;
  }
  gateFlash = Math.max(0, gateFlash - dt * 0.8);

  // The canon is found once the echo has sat in Bach's place long enough to be heard there.
  if (stage === 2 && !solved && started) {
    fitSince = rules.delay === BACH.delay && rules.interval === BACH.interval ? fitSince + dt : 0;
    if (fitSince > 7) {
      solved = true;
      sound.chime();
      panel();
    }
  }

  above += (aboveGoal - above) * Math.min(1, dt * 3);
  drawPath(pos, focusY);

  // The walkers: each on its own note, hopping the short ones.
  let worst = 0;
  walkers.forEach((w, v) => {
    const n = sounding[v];
    const a = angleAt(pos);
    const shown = stage > 1 || v === 0;
    w.group.visible = shown;
    if (n) {
      const through = (pos - n.at) / n.length;
      const hop = n.length <= 2 ? Math.sin(through * Math.PI) * 0.5 : Math.sin(Math.min(1, through * n.length) * Math.PI) * 0.3;
      w.y = stoneY(n) + 0.62 + hop;
    }
    w.group.position.set(Math.cos(a) * TRACK[v], w.y || focusY + 0.6, Math.sin(a) * TRACK[v]);
    const lit = n && voiceOn(v) ? 1 : 0.25;
    w.halo.material.opacity = 0.55 * lit;
    w.body.scale.setScalar(0.7 + 0.3 * lit);
    places[v].copy(w.group.position);
  });
  for (let a = 0; a < 3; a++) {
    for (let b = a + 1; b < 3; b++) {
      const x = sounding[a];
      const y = sounding[b];
      if (!x || !y || !voiceOn(a) || !voiceOn(b)) continue;
      const h = harsh(x.pitch + x.rise, y.pitch + y.rise);
      worst = Math.max(worst, h);
      if (h >= 0.7 && Math.random() < dt * 9) spark(places[a], places[b]);
    }
  }
  // Averaged over the last bar or two; even Bach's voices brush past each other, so it never quite empties.
  if (started) quarrel += (worst - quarrel) * Math.min(1, (dt * rate()) / 22);
  ($('quarrel').firstElementChild as HTMLElement).style.width = `${Math.round(THREE.MathUtils.clamp((quarrel - 0.14) / 0.46, 0.02, 1) * 100)}%`;
  for (let k = 0; k < SPARKS; k++) {
    if (sparkLife[k] <= 0) {
      sparkPos[k * 3 + 1] = -9999;
      continue;
    }
    sparkLife[k] -= dt;
    for (let c = 0; c < 3; c++) sparkPos[k * 3 + c] += sparkVel[k * 3 + c] * dt;
    sparkVel[k * 3 + 1] -= 6 * dt;
  }
  sparkGeo.attributes.position.needsUpdate = true;

  // The eye goes round with the theme, a little ahead of it; or hangs far overhead.
  const a = angleAt(pos) + turn;
  eye.set(Math.cos(a) * distance, focusY + 7, Math.sin(a) * distance);
  eyeTop.set(0.01, focusY + 190, 0.01);
  camera.position.lerpVectors(eye, eyeTop, above * above * (3 - 2 * above));
  camera.up.set(0, 1 - above, -above).normalize();
  // From above, narrow enough to flatten the spiral and wide enough to hold all three rings, whichever way the screen is turned.
  camera.fov = THREE.MathUtils.lerp(46, THREE.MathUtils.radToDeg(2 * Math.atan(15.5 / (190 * Math.min(1, camera.aspect)))), above);
  camera.updateProjectionMatrix();
  camera.lookAt(head.set(0, focusY - (tall() ? 9 : 3.2) * (1 - above), 0));

  // From overhead the spire's flat top would loom over the innermost ring of stones, so it sinks until it is level with them.
  spire.position.y = focusY - 53 * above;
  spireMat.uniforms.uEye.value = focusY;
  spireMat.uniforms.uTop.value = above;
  band.position.set(Math.cos(a + 2.45) * 58, focusY + 15, Math.sin(a + 2.45) * 58);
  band.rotation.set(0.5, now * 0.00012, 0.3);
  band.visible = above < 0.5;

  clock(pos);
  renderer.render(scene, camera);
});

// For the test page.
(window as unknown as { canon: unknown }).canon = { where, anchor, enter, state: () => ({ stage, solved, rules, said, speed, above }) };
