import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { DEEPEST, buildOcean } from './ocean';

/**
 * The deep sea: a place to sink through and touch. There is nothing to win
 * and nothing to read.
 *
 *   drag up / scroll / pinch ... sink deeper (and the reverse to rise)
 *   drag sideways .............. turn to look around
 *   touch the water ............ a wave of light spreads from the spot
 *   touch a jellyfish .......... it flashes and jets away
 *   hold a finger still ........ plankton flares along it; fish dart away from it
 */

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('world');
const veil = $('veil');

const renderer = new THREE.WebGLRenderer({ canvas, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);
const ocean = buildOcean();

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(ocean.scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.7, 0.55);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---- Sinking and looking ----

// ?depth=120 starts at that depth, for looking at one zone while developing.
const startAt = Number(new URLSearchParams(window.location.search).get('depth') ?? 3);
let depth = startAt;
let depthGoal = startAt;
// ?turn=1.5 starts facing that way (in radians), also for development.
let yaw = Number(new URLSearchParams(window.location.search).get('turn') ?? 0);
let yawGoal = yaw;
const clampDepth = (d: number) => Math.min(DEEPEST, Math.max(1.5, d));

const ray = new THREE.Raycaster();
const pointers = new Map<number, { x: number; y: number }>();
let tap: { x: number; y: number; t: number } | null = null;
let pinch = 0;
let moved = false;
const keys = new Set<string>();

function aim(x: number, y: number): THREE.Ray {
  ray.setFromCamera(new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1), camera);
  return ray.ray;
}
function hasMoved(): void {
  if (moved) return;
  moved = true;
  $('hint').style.opacity = '0';
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  tap = pointers.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
  pinch = 0;
  startSound();
  ocean.point(aim(e.clientX, e.clientY), true);
});
canvas.addEventListener('pointermove', (e) => {
  ocean.point(aim(e.clientX, e.clientY), pointers.size > 0);
  const prev = pointers.get(e.pointerId);
  if (!prev) return;
  const dx = e.clientX - prev.x;
  const dy = e.clientY - prev.y;
  prev.x = e.clientX;
  prev.y = e.clientY;
  if (pointers.size === 1) {
    // Drag sideways to turn; drag up to sink, as if pulling the sea up past you.
    yawGoal += dx * 0.0045;
    depthGoal = clampDepth(depthGoal - dy * 0.11);
    if (Math.abs(dy) > 2) hasMoved();
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch) depthGoal = clampDepth(depthGoal + (d - pinch) * 0.12);
    pinch = d;
    hasMoved();
  }
});
const release = (e: PointerEvent) => {
  pointers.delete(e.pointerId);
  pinch = 0;
  ocean.point(aim(e.clientX, e.clientY), false);
  const t = tap;
  tap = null;
  if (e.type === 'pointercancel' || !t) return;
  if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > 10 || performance.now() - t.t > 450) return;
  const touched = ocean.tap(aim(e.clientX, e.clientY));
  // Every note comes from one five-note scale and rings for several seconds, so notes played
  // one after another pile up into a chord. Each jellyfish has its own note: big ones low.
  if (touched.kind === 'jelly') chime(SCALE[touched.note % SCALE.length] * 2);
  else if (touched.kind === 'angler') chime(SCALE[0] / 2, 0.12);
  else chime(SCALE[touched.note % 5], 0.045);
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    depthGoal = clampDepth(depthGoal + Math.max(-120, Math.min(120, e.deltaY)) * 0.05);
    hasMoved();
    startSound();
  },
  { passive: false },
);
window.addEventListener('keydown', (e) => keys.add(e.key.toLowerCase()));
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

// ---- Sound, made on the spot: a low hum that darkens with depth, chimes, and the whale's call ----

let audio: AudioContext | null = null;
let master: GainNode | null = null;
let muffle: BiquadFilterNode | null = null;
/** Where notes are sent to be given room: they come back as echoes and a long wash, as in a great space of water. */
let space: GainNode | null = null;
let lowDrone: GainNode | null = null;
let highDrone: GainNode | null = null;
let soundOn = true;
function startSound(): void {
  if (audio) return;
  try {
    audio = new AudioContext();
    master = audio.createGain();
    master.gain.value = soundOn ? 1 : 0;
    master.connect(audio.destination);
    // The sea: soft filtered noise, like blood in your ears, and two low notes drifting against each other.
    const noise = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const data = noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) data[i] = last = last * 0.98 + (Math.random() * 2 - 1) * 0.02;
    const rush = audio.createBufferSource();
    rush.buffer = noise;
    rush.loop = true;
    muffle = audio.createBiquadFilter();
    muffle.type = 'lowpass';
    muffle.frequency.value = 600;
    const rushGain = audio.createGain();
    rushGain.gain.value = 0.5;
    rush.connect(muffle).connect(rushGain).connect(master);
    rush.start();
    // Two pairs of held notes under everything: an open, lighter pair near the surface, which
    // gives way to a pair two octaves lower as she sinks.
    lowDrone = audio.createGain();
    highDrone = audio.createGain();
    lowDrone.gain.value = highDrone.gain.value = 0;
    lowDrone.connect(master);
    highDrone.connect(master);
    for (const [f, to] of [[55, lowDrone], [82.6, lowDrone], [130.81, highDrone], [196.4, highDrone]] as [number, GainNode][]) {
      const osc = audio.createOscillator();
      osc.frequency.value = f;
      osc.connect(to);
      osc.start();
    }
    // Room for the notes. Echoes: each note comes back several times, softer and duller each time.
    space = audio.createGain();
    const echo = audio.createDelay(2);
    echo.delayTime.value = 0.52;
    const again = audio.createGain();
    again.gain.value = 0.42;
    const dull = audio.createBiquadFilter();
    dull.type = 'lowpass';
    dull.frequency.value = 1500;
    const echoes = audio.createGain();
    echoes.gain.value = 0.5;
    space.connect(echo);
    echo.connect(dull).connect(again).connect(echo);
    echo.connect(echoes).connect(master);
    // And a wash: the sound of the note spread through a very large space, four seconds long.
    const length = Math.floor(audio.sampleRate * 4);
    const room = audio.createBuffer(2, length, audio.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = room.getChannelData(ch);
      let smooth = 0;
      for (let i = 0; i < length; i++) {
        smooth = smooth * 0.6 + (Math.random() * 2 - 1) * 0.4; // a dull room, not a bright one
        d[i] = smooth * Math.pow(1 - i / length, 2.6);
      }
    }
    const wash = audio.createConvolver();
    wash.buffer = room;
    const washGain = audio.createGain();
    washGain.gain.value = 0.9;
    space.connect(wash).connect(washGain).connect(master);
  } catch {
    audio = null; // no sound on this device; the sea is silent but otherwise the same
  }
}
/** C, D, E, G, A: any of these sound well together. Two octaves of them. */
const SCALE = [130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0];
const RING = 6.5; // seconds a note takes to die away

function chime(freq: number, loud = 0.075): void {
  if (!audio || !master) return;
  const start = audio.currentTime;
  for (const [mult, vol] of [[1, 1], [2.01, 0.4], [3.02, 0.15]]) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.frequency.value = freq * mult;
    // A soft strike, then a long, slow fade.
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(loud * vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(loud * vol * 0.45, start + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, start + RING);
    osc.connect(g).connect(master);
    if (space) g.connect(space);
    osc.start(start);
    osc.stop(start + RING + 0.1);
  }
}
ocean.onWhale = () => {
  if (!audio || !master) return;
  // A long, sliding call, then a higher answer from the calf.
  for (const [delay, from, to, len] of [[0, 190, 120, 2.6], [2.9, 130, 240, 2.2], [5.6, 420, 300, 1.4]]) {
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + len);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.11, start + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, start + len);
    osc.connect(g).connect(master);
    if (space) g.connect(space);
    osc.start(start);
    osc.stop(start + len + 0.1);
  }
};
// The sea plays by itself, quietly: a jellyfish that lights up sounds its own note, and a wave
// of light in the dark sounds a low one. With the long ring, these drift into slow chords.
ocean.onChime = (note, kind) => {
  if (kind === 'jelly') chime(SCALE[note % SCALE.length] * 2, 0.028);
  else chime(SCALE[note % 5], 0.03);
};
$('sound').onclick = () => {
  startSound();
  soundOn = !soundOn;
  if (master) master.gain.value = soundOn ? 1 : 0;
  $('sound').style.opacity = soundOn ? '1' : '0.4';
};

// ---- Arriving and leaving ----

function goHome(): void {
  veil.style.background = '#4f9a5c';
  veil.classList.remove('open');
  setTimeout(() => {
    window.location.href = '../../index.html#from-sea';
  }, 1700);
}
$('home').onclick = goHome;
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});
requestAnimationFrame(() => veil.classList.add('open'));

// ---- Every frame ----

const clock = new THREE.Clock();
const mark = $('mark');
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const time = clock.elapsedTime;
  const sink = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0);
  const turn = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
  if (sink) hasMoved();
  depthGoal = clampDepth(depthGoal + sink * dt * 22);
  yawGoal += turn * dt * 1.2;

  const before = depth;
  depth += (depthGoal - depth) * (1 - Math.exp(-dt * 3.5));
  yaw += (yawGoal - yaw) * (1 - Math.exp(-dt * 7));
  const t = depth / DEEPEST;
  // Near the surface she looks up towards the light; at the bottom, down at the glowing floor.
  // Sinking tips the view down a little; rising tips it up.
  const falling = (depth - before) / Math.max(dt, 0.001);
  // As she comes down onto the reef she looks down and across it.
  const overReef = Math.exp(-Math.pow((depth - 28.5) / 7, 2));
  const pitch = 0.32 - 0.62 * Math.pow(t, 1.4) - 0.36 * overReef - Math.max(-0.25, Math.min(0.25, falling * 0.012));
  camera.position.set(0, -depth + Math.sin(time * 0.5) * 0.15, 0);
  camera.lookAt(Math.sin(yaw) * Math.cos(pitch), camera.position.y + Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));

  ocean.update(time, dt, camera.position);
  if (lowDrone && highDrone) {
    lowDrone.gain.value = 0.012 + 0.03 * Math.min(1, t / 0.5);
    highDrone.gain.value = 0.013 * Math.max(0, 1 - t / 0.45);
  }
  if (muffle) muffle.frequency.value = 700 - 560 * t; // the water grows quieter and darker-sounding with depth
  mark.style.top = `${t * 100}%`;
  // Glow belongs to the dark. Near the surface, where everything is bright, it is turned well down.
  bloom.strength = 0.2 + 0.7 * Math.min(1, t / 0.3);
  composer.render();
});
