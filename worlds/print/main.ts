import * as THREE from 'three';
import { CELLS, REACH, bridgeLift, buildWorld } from './world';

/**
 * The Printer's World: a landscape that prints itself onto cream paper round
 * whoever walks through it. There is nothing to read.
 *
 *   tap ................ walk a little way towards where you tapped
 *   drag sideways ...... turn and look around
 *   scroll / pinch ..... walk forwards or back; arrow keys work too
 *   stone lanterns ..... reach one and its red seal is stamped into the cartouche
 */

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('world');
const veil = $('veil');
const params = new URLSearchParams(window.location.search);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const camera = new THREE.PerspectiveCamera(55, 1, 0.3, 1400);
const world = buildWorld();

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---- What is kept between visits (in this browser only): the sheet as far as it has printed, the seals, and where she stood.
const KEY = 'portal-worlds-print-v1';
const EYE = 3.4;
const at = new THREE.Vector3(0, EYE, 0);
const goal = new THREE.Vector3(0, EYE, 0);
let yaw = 0;
let yawGoal = 0;

const slots = world.viewpoints.map(() => {
  const i = document.createElement('i');
  $('seals').appendChild(i);
  return i;
});
function restore(): void {
  if (params.has('fresh')) return;
  try {
    const kept = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!kept) return;
    world.load(kept.sheet);
    (kept.seals as boolean[]).forEach((found, i) => {
      if (!found || !world.viewpoints[i]) return;
      world.collect(i);
      slots[i].classList.add('on');
    });
    at.set(kept.x, EYE, kept.z);
    goal.copy(at);
    yaw = yawGoal = kept.yaw;
  } catch {
    // nothing kept, or it cannot be read: start on a blank sheet
  }
}
function keep(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ sheet: world.save(), seals: world.viewpoints.map((v) => v.found), x: at.x, z: at.z, yaw }));
  } catch {
    // no room, or not allowed: the sheet is simply not remembered
  }
}
restore();
// For looking at one place while developing: ?x=60&z=10&turn=1.5 starts there, ?printed shows the whole sheet finished.
if (params.has('x')) at.set(Number(params.get('x')), EYE, Number(params.get('z') ?? 0));
if (params.has('x')) goal.copy(at);
if (params.has('turn')) yaw = yawGoal = Number(params.get('turn'));
if (params.has('printed')) world.load(btoa('\xff'.repeat(CELLS * CELLS)));
setInterval(keep, 4000);
window.addEventListener('pagehide', keep);

// ---- Walking and looking ----

const ray = new THREE.Raycaster();
const pointers = new Map<number, { x: number; y: number }>();
let tap: { x: number; y: number; t: number } | null = null;
let pinch = 0;
let moved = false;
const keys = new Set<string>();

function hasMoved(): void {
  if (moved) return;
  moved = true;
  const hint = $('hint');
  hint.style.opacity = '0';
  setTimeout(() => hint.remove(), 900);
}
// The hint is only for the very start: it goes at the first touch, key or scroll of any kind,
// or by itself after a few seconds, and is not shown at all on a sheet she has already begun.
for (const kind of ['pointerdown', 'keydown', 'wheel']) window.addEventListener(kind, hasMoved, { once: true, passive: true });
setTimeout(hasMoved, 7000);
if (localStorage.getItem(KEY) && !params.has('fresh')) hasMoved();
function walkTo(x: number, z: number): void {
  const r = Math.hypot(x, z);
  const k = r > REACH ? REACH / r : 1;
  goal.set(x * k, EYE, z * k);
  hasMoved();
}
const ahead = () => new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  tap = pointers.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
  pinch = 0;
  startSound();
});
canvas.addEventListener('pointermove', (e) => {
  const prev = pointers.get(e.pointerId);
  if (!prev) return;
  const dx = e.clientX - prev.x;
  prev.x = e.clientX;
  prev.y = e.clientY;
  if (pointers.size === 1) {
    yawGoal -= dx * 0.0042; // drag the picture, and the view follows the finger
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch) {
      const step = ahead().multiplyScalar((d - pinch) * 0.12);
      walkTo(goal.x + step.x, goal.z + step.z);
    }
    pinch = d;
  }
});
const release = (e: PointerEvent) => {
  pointers.delete(e.pointerId);
  pinch = 0;
  const t = tap;
  tap = null;
  if (e.type === 'pointercancel' || !t) return;
  if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > 10 || performance.now() - t.t > 450) return;
  // A tap: walk towards that spot on the ground, or a fair stride that way if it was a tap at the sky.
  ray.setFromCamera(new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1), camera);
  const d = ray.ray.direction;
  const flat = Math.hypot(d.x, d.z) || 1;
  const far = d.y < -0.02 ? Math.min(26, Math.max(7, (-EYE / d.y) * flat)) : 18;
  walkTo(at.x + (d.x / flat) * far, at.z + (d.z / flat) * far);
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const step = ahead().multiplyScalar(-Math.max(-120, Math.min(120, e.deltaY)) * 0.06);
    walkTo(goal.x + step.x, goal.z + step.z);
    startSound();
  },
  { passive: false },
);
window.addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase());
  startSound();
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

// ---- Sound: a koto, made on the spot. Each pluck is a string model, tuned to the old "in" scale. ----

let audio: AudioContext | null = null;
let master: GainNode | null = null;
let rub: GainNode | null = null;
let soundOn = true;
/** D, E flat, G, A, B flat: the scale of the koto's most familiar tuning. Two octaves and a top note. */
const SCALE = [146.83, 155.56, 196.0, 220.0, 233.08, 293.66, 311.13, 392.0, 440.0, 466.16, 587.33];
const strings = new Map<number, AudioBuffer>();

function startSound(): void {
  if (audio) return;
  try {
    audio = new AudioContext();
    master = audio.createGain();
    master.gain.value = soundOn ? 1 : 0;
    master.connect(audio.destination);
    // The sound of the printer's pad rubbing the back of the paper, heard only while new ground is printing.
    const hiss = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const d = hiss.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = audio.createBufferSource();
    src.buffer = hiss;
    src.loop = true;
    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1700;
    band.Q.value = 0.7;
    rub = audio.createGain();
    rub.gain.value = 0;
    src.connect(band).connect(rub).connect(master);
    src.start();
  } catch {
    audio = null; // no sound on this device; the world is silent but otherwise the same
  }
}
/** One plucked string: a burst of noise going round and round a short loop, softening each time. */
function stringFor(freq: number): AudioBuffer {
  const made = strings.get(freq);
  if (made) return made;
  const rate = audio!.sampleRate;
  const buffer = audio!.createBuffer(1, Math.floor(rate * 3), rate);
  const out = buffer.getChannelData(0);
  const loop = Math.round(rate / freq);
  const ring = new Float32Array(loop);
  let soft = 0;
  for (let i = 0; i < loop; i++) ring[i] = soft = soft * 0.35 + (Math.random() * 2 - 1) * 0.65; // plucked near the bridge: bright
  const keepFor = 0.9965 - 40 / (freq * 60); // low strings ring longer
  for (let i = 0; i < out.length; i++) {
    const k = i % loop;
    out[i] = ring[k];
    ring[k] = (ring[k] + ring[(k + 1) % loop]) * 0.5 * keepFor;
  }
  strings.set(freq, buffer);
  return buffer;
}
function pluck(note: number, loud = 0.2, delay = 0): void {
  if (!audio || !master) return;
  const start = audio.currentTime + delay;
  const src = audio.createBufferSource();
  src.buffer = stringFor(SCALE[Math.max(0, Math.min(SCALE.length - 1, note))]);
  // The player's left hand presses the string as it is plucked, so the note starts a shade sharp and settles.
  src.playbackRate.setValueAtTime(1.014, start);
  src.playbackRate.exponentialRampToValueAtTime(1, start + 0.18);
  const g = audio.createGain();
  g.gain.setValueAtTime(loud, start);
  g.gain.setTargetAtTime(0, start + 1.6, 0.5);
  src.connect(g).connect(master);
  src.start(start);
  src.stop(start + 3);
}
/** The wooden clappers that mark a moment in the theatre: two sharp knocks. */
function clap(delay: number): void {
  if (!audio || !master) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(1500, start);
  osc.frequency.exponentialRampToValueAtTime(900, start + 0.04);
  const g = audio.createGain();
  g.gain.setValueAtTime(0.16, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
  osc.connect(g).connect(master);
  osc.start(start);
  osc.stop(start + 0.1);
}
// The tune wanders up and down the scale by steps, with a leap now and then. It plays only as
// new ground prints, so the music is the sound of the picture being made.
let note = 5;
let owed = 0;
let sinceNote = 0;
let rest = 5;
function nextNote(loud: number): void {
  const leap = Math.random() < 0.18;
  note += (Math.random() < 0.5 ? -1 : 1) * (leap ? 3 : 1);
  if (note < 0) note = 2;
  if (note > SCALE.length - 1) note = SCALE.length - 3;
  pluck(note, loud);
  if (Math.random() < 0.22) pluck(Math.max(0, note - 5), loud * 0.7, 0.03); // the same note an octave down, struck with it
  sinceNote = 0;
}
$('sound').onclick = () => {
  startSound();
  soundOn = !soundOn;
  if (master) master.gain.value = soundOn ? 1 : 0;
  $('sound').style.opacity = soundOn ? '1' : '0.4';
};

// ---- A fresh sheet, and going home ----

$('fresh').onclick = () => {
  veil.style.background = '#efe6c9';
  veil.classList.remove('open');
  setTimeout(() => {
    world.clear();
    slots.forEach((s) => s.classList.remove('on'));
    at.set(0, EYE, 0);
    goal.copy(at);
    yaw = yawGoal = 0;
    keep();
    veil.classList.add('open');
  }, 1200);
};
$('home').onclick = () => {
  keep();
  veil.style.background = '#4f9a5c';
  veil.classList.remove('open');
  setTimeout(() => {
    window.location.href = '../../index.html#from-print';
  }, 1700);
};
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});
requestAnimationFrame(() => veil.classList.add('open'));

// ---- Every frame ----

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const time = clock.elapsedTime;
  const forward = (keys.has('arrowup') || keys.has('w') ? 1 : 0) - (keys.has('arrowdown') || keys.has('s') ? 1 : 0);
  const turn = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
  yawGoal += turn * dt * 1.3;
  yaw += (yawGoal - yaw) * (1 - Math.exp(-dt * 8));
  if (forward) {
    const step = ahead().multiplyScalar(forward * 6);
    walkTo(at.x + step.x, at.z + step.z);
  }
  // Walk towards the goal at an even pace, slowing over the last stride.
  const gap = goal.clone().sub(at);
  const dist = gap.length();
  const pace = Math.min(11, dist * 2.2);
  if (dist > 0.01) at.addScaledVector(gap, Math.min(1, (pace * dt) / dist));
  // The bridge is a real hump in the road: she climbs it and comes down the far side.
  camera.position.set(at.x, EYE + bridgeLift(at.x, at.z) + Math.sin(time * 6) * 0.05 * Math.min(1, pace / 6), at.z);
  camera.rotation.set(-0.03, -yaw, 0, 'YXZ');

  const halfView = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
  const fresh = world.update(dt, time, camera.position, yaw, halfView);

  // Reaching a lantern stamps its seal.
  world.viewpoints.forEach((v, i) => {
    if (v.found || Math.hypot(v.x - at.x, v.z - at.z) > 5.5) return;
    world.collect(i);
    slots[i].classList.add('on', 'stamp');
    setTimeout(() => slots[i].classList.remove('stamp'), 60);
    clap(0);
    clap(0.22);
    [0, 3, 5, 7].forEach((n, k) => pluck(n, 0.2, 0.45 + k * 0.07));
    keep();
  });

  // Music from the printing itself.
  sinceNote += dt;
  owed += fresh;
  if (rub) rub.gain.value += (Math.min(0.05, fresh * 0.01) - rub.gain.value) * Math.min(1, dt * 6);
  if (owed > 15 && sinceNote > 0.3) {
    owed = 0;
    nextNote(0.16);
  }
  if (sinceNote > rest) {
    rest = 6 + Math.random() * 6;
    nextNote(0.09); // a single quiet note when all is still
  }
  renderer.render(world.scene, camera);
});
