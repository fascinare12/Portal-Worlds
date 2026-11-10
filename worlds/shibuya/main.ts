import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { KERB, ROAD, buildCity } from './city';
import type { Thing } from './city';
import { hasVoice, say, sound } from './speak';
import { buildStore } from './store';
import { openTrace } from './trace';
import { WORDS, loadProgress, nextWord, record, saveProgress, wordById } from './words';
import type { Word } from './words';

/**
 * Shibuya at night: a street to walk through, where everything has a name.
 *
 * First she listens: tapping a thing says its name and shows it in hiragana.
 * Once she has heard a few, the street starts asking: "ねこ は どこ？" (where
 * is the cat?), and she finds it. Each word she finds is sprayed on a wall as
 * a tag, so the street fills up with what she knows. Words she finds hard are
 * asked again soonest; the romaji under a word fades away once she knows it.
 */

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('world');
const veil = $('veil');
const label = $('label');
const ask = $('ask');
const count = $('count');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const camera = new THREE.PerspectiveCamera(62, 1, 0.2, 900);
const city = await buildCity();

// Glow: bright things bleed light into the dark around them, as in a night photograph.
// It is costly, so it switches itself off on a device that cannot keep up (or with ?plain).
// Its drawing surface smooths edges itself; without that, every edge would be a staircase.
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(city.scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.65, 0.7));
composer.addPass(new OutputPass());
let quality = new URLSearchParams(window.location.search).has('plain') ? 0 : 2; // 2 = everything, 1 = no glow, 0 = no glow, reflections or rain
const progress = loadProgress();

// The convenience store is a second place, entered through its front on the street.
const store = buildStore();
let inside = false;
const thingsHere = () => (inside ? store.things : city.things);

// Tags already earned are on the walls from the start.
progress.sprayed ??= [];
for (const id of progress.tagged) city.tag(id, wordById(id).kana, progress.sprayed.includes(id), false);

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---- Walking and looking ----

const EYE = 1.7;
/** How far one tap walks. */
const STRIDE = 4;
/** Where she was standing on the street when she went into the store. */
const outside = { x: 0, z: 41, yaw: 0 };
const at = new THREE.Vector2(0, 41);
const goal = at.clone();
let yaw = 0; // 0 looks up the street, away from where she arrives
let pitch = 0.06;
let yawGoal = yaw;
let pitchGoal = pitch;

/** Keeps a spot on the roads: the main street, or the street that crosses it. */
function onRoad(p: THREE.Vector2): THREE.Vector2 {
  // Inside the store, she can walk anywhere on its floor.
  if (inside) return new THREE.Vector2(Math.max(-store.half.x, Math.min(store.half.x, p.x)), Math.max(-store.half.z, Math.min(store.half.z, p.y)));
  const main = new THREE.Vector2(Math.max(-KERB + 1, Math.min(KERB - 1, p.x)), Math.max(-46, Math.min(46, p.y)));
  const cross = new THREE.Vector2(Math.max(-44, Math.min(44, p.x)), Math.max(-ROAD, Math.min(ROAD, p.y)));
  return main.distanceTo(p) <= cross.distanceTo(p) ? main : cross;
}

const ray = new THREE.Raycaster();
const pointers = new Map<number, { x: number; y: number }>();
let tap: { x: number; y: number; t: number } | null = null;
const keys = new Set<string>();

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  tap = pointers.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
});
canvas.addEventListener('pointermove', (e) => {
  const prev = pointers.get(e.pointerId);
  if (!prev) return;
  // Drag to look around, as if turning your head.
  yawGoal += (e.clientX - prev.x) * 0.0045;
  pitchGoal = Math.max(-0.5, Math.min(1.1, pitchGoal + (e.clientY - prev.y) * 0.0035));
  prev.x = e.clientX;
  prev.y = e.clientY;
});
const release = (e: PointerEvent) => {
  pointers.delete(e.pointerId);
  const t = tap;
  tap = null;
  if (e.type === 'pointercancel' || !t) return;
  if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > 10 || performance.now() - t.t > 450) return;
  tapped(e.clientX, e.clientY);
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
window.addEventListener('keydown', (e) => keys.add(e.key.toLowerCase()));
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

function tapped(x: number, y: number): void {
  if (writing) return;
  ray.setFromCamera(new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1), camera);
  // A thing with a name?
  const hit = ray.intersectObjects(thingsHere().map((t) => t.object), true)[0];
  if (hit) {
    const thing = thingsHere().find((t) => {
      for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) if (o === t.object) return true;
      return false;
    });
    if (thing) return touch(thing);
  }
  // One of her tags on the wall: write it with the spray can.
  const tagHit = inside ? undefined : ray.intersectObjects(city.tags.map((t) => t.mesh))[0];
  if (tagHit) {
    const t = city.tags.find((x) => x.mesh === tagHit.object)!;
    return write(t.id);
  }
  if (inside) {
    if (ray.intersectObject(store.exit, true).length) return goThrough(false);
  } else {
    if (ray.intersectObject(city.storeDoor, true).length) return goThrough(true);
    if (ray.intersectObject(city.puddle).length) return goHome();
  }
  // Otherwise walk to the spot on the road.
  const d = ray.ray.direction;
  if (d.y < -0.02) {
    const k = -ray.ray.origin.y / d.y;
    // A tap is a few steps in that direction, not a journey: tap again to keep going.
    const to = new THREE.Vector2(ray.ray.origin.x + d.x * k, ray.ray.origin.z + d.z * k).sub(at);
    const stride = inside ? 2 : STRIDE;
    if (to.length() > stride) to.setLength(stride);
    goal.copy(onRoad(to.add(at)));
  }
}

// ---- Words ----

/** Said when she finds something. */
const PRAISE: [string, string][] = [
  ['せいかい！', 'seikai: correct'],
  ['すごい！', 'sugoi: amazing'],
  ['いいね！', 'ii ne: nice'],
];

let shown: { thing: Thing; until: number } | null = null;
let quest: { word: Word; firstTry: boolean } | null = null;
let lastAsked: string | null = null;
let questTimer = 0;

/** Romaji is a crutch: it is shown while a word is new and dropped once she knows it. */
const needsRomaji = (id: string) => (progress.box[id] ?? 0) < 2;

function show(thing: Thing): void {
  const w = wordById(thing.word);
  label.querySelector('.kana')!.textContent = w.kana;
  label.querySelector('.romaji')!.textContent = needsRomaji(w.id) ? w.romaji : '';
  label.querySelector('.english')!.textContent = w.english;
  label.hidden = false;
  shown = { thing, until: performance.now() + 3200 };
}

function touch(thing: Thing): void {
  const w = wordById(thing.word);
  say(w.kana);
  show(thing);
  if (!progress.heard.includes(w.id)) progress.heard.push(w.id);

  if (quest) {
    if (quest.word.id === w.id) {
      // Found it.
      record(progress, w.id, quest.firstTry);
      sound.right();
      city.firework();
      setTimeout(() => sound.boom(), 250);
      if (!progress.tagged.includes(w.id)) {
        progress.tagged.push(w.id);
        city.tag(w.id, w.kana, false, true);
        sound.spray();
      }
      ask.classList.add('right');
      const first = !progress.tagged.includes(w.id);
      const cheer = PRAISE[Math.floor(Math.random() * PRAISE.length)];
      ask.querySelector('.hint')!.textContent = `${cheer[0]} (${cheer[1]})` + (first ? (inside ? '  Its outline is waiting on a wall outside, for you to spray.' : '  Now tap its outline on the wall to spray it.') : '');
      setTimeout(() => say(cheer[0].replace('！', '')), 900);
      quest = null;
      questTimer = 2.6;
    } else {
      // Not that one: it tells her its own name, and the question stands.
      quest.firstTry = false;
    }
  } else if (questTimer <= 0 && thingsHere().filter((t) => progress.heard.includes(t.word)).length >= (inside ? 3 : 4)) {
    questTimer = 2.5; // enough heard: the street starts asking
  }
  saveProgress(progress);
  drawCount();
}

function drawCount(): void {
  // Found, and of those, written by her own hand.
  count.textContent = `🔎 ${progress.tagged.length}  ✍ ${progress.sprayed!.length} / ${WORDS.length}`;
}

let writing = false;
/** Opens a word on the wall for writing; finishing it fills the tag with colour. */
function write(id: string): void {
  if (writing) return;
  writing = true;
  label.hidden = true;
  shown = null;
  openTrace(wordById(id), (finished) => {
    writing = false;
    if (!finished) return;
    if (!progress.sprayed!.includes(id)) progress.sprayed!.push(id);
    city.fill(id);
    city.firework();
    saveProgress(progress);
    drawCount();
  });
}

function newQuest(): void {
  const w = nextWord(progress, lastAsked, new Set(thingsHere().map((t) => t.word)));
  if (!w) return;
  quest = { word: w, firstTry: true };
  lastAsked = w.id;
  ask.classList.remove('right');
  // Things in the street are looked for; food at the stall is asked for, as a customer would.
  const frame = w.food
    ? { kana: 'を ください', romaji: 'o kudasai', spoken: 'をください', hint: '〜 を ください means “〜, please.”  Find it and tap it.' }
    : { kana: 'は どこ？', romaji: 'wa doko?', spoken: 'はどこ？', hint: '〜 は どこ？ means “where is 〜?”  Find it and tap it.' };
  questSpoken = `${w.kana}${frame.spoken}`;
  ask.querySelector('.kana')!.textContent = `${w.kana} ${frame.kana}`;
  ask.querySelector('.romaji')!.textContent = needsRomaji(w.id) ? `${w.romaji} ${frame.romaji}` : `… ${frame.romaji}`;
  // The frame of the question is explained the first few times; the word itself is hers to remember.
  const seen = w.food ? (progress.box['_kudasai'] = (progress.box['_kudasai'] ?? 0) + 1) : progress.asked + 1;
  ask.querySelector('.hint')!.textContent = seen <= 3 ? frame.hint : '';
  ask.hidden = false;
  say(questSpoken);
}
let questSpoken = '';
$('again').onclick = () => {
  if (quest) say(questSpoken);
};

// ---- Going into the store and coming out ----

const toast = $('toast');
let toastTimer = 0;
function announce(kana: string, note: string): void {
  toast.querySelector('.kana')!.textContent = kana;
  toast.querySelector('.romaji')!.textContent = note;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.hidden = true), 4500);
  say(kana);
}

/** Steps through the shop door, in either direction, with a quick wash of light. */
function goThrough(entering: boolean): void {
  veil.style.transition = 'opacity 0.35s ease';
  veil.style.background = '#ffffff';
  veil.classList.remove('open');
  setTimeout(() => {
    if (entering) {
      Object.assign(outside, { x: at.x, z: at.y, yaw });
      at.set(0, store.half.z - 0.2);
      yaw = yawGoal = 0;
    } else {
      at.set(outside.x, outside.z);
      yaw = yawGoal = outside.yaw;
    }
    goal.copy(at);
    pitch = pitchGoal = 0;
    inside = entering;
    // Whatever was being asked for is in the other place now.
    quest = null;
    ask.hidden = true;
    label.hidden = true;
    shown = null;
    questTimer = 5;
    veil.classList.add('open');
    // What shop staff call out when a customer comes in, and what they say as one leaves.
    if (entering) announce('いらっしゃいませ', 'irasshaimase: welcome! (said by shop staff)');
    else announce('ありがとう ございました', 'arigatō gozaimashita: thank you very much');
    setTimeout(() => (veil.style.transition = ''), 500);
  }, 380);
}

// ---- Arriving and leaving ----

function goHome(): void {
  saveProgress(progress);
  say('またね'); // see you
  veil.style.background = '#4f9a5c';
  veil.classList.remove('open');
  setTimeout(() => {
    window.location.href = '../../index.html#from-shibuya';
  }, 1500);
}
$('home').onclick = goHome;
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});

// The greeting follows the real time of day, as it would in Japan.
const hour = new Date().getHours();
const greeting =
  hour < 11
    ? { kana: 'おはよう', romaji: 'ohayō: good morning' }
    : hour < 17
      ? { kana: 'こんにちは', romaji: 'konnichiwa: hello, good afternoon' }
      : { kana: 'こんばんは', romaji: 'konbanwa: good evening' };
$('greeting').textContent = `${greeting.kana}！`;
$('greeting-romaji').textContent = greeting.romaji;

$('start').onclick = () => {
  // Sound is only allowed after a tap, so the greeting is spoken here.
  $('intro').hidden = true;
  say(greeting.kana);
  setTimeout(() => {
    $('mute').hidden = hasVoice();
  }, 1200);
  if (progress.heard.length >= 4) questTimer = 3;
  // For trying the writing practice directly: add ?write=neko (a word's id) to the address.
  // For going straight into the store: add ?store to the address.
  if (new URLSearchParams(window.location.search).has('store')) goThrough(true);
  const test = new URLSearchParams(window.location.search).get('write');
  if (test && wordById(test)) write(test);
};
drawCount();
requestAnimationFrame(() => veil.classList.add('open'));

// ---- Every frame ----

city.setRich(quality > 0);
let slowTime = 0;
let slowFrames = 0;
const clock = new THREE.Clock();
const projected = new THREE.Vector3();
renderer.setAnimationLoop(() => {
  const raw = clock.getDelta();
  const dt = Math.min(raw, 0.1);
  const time = clock.elapsedTime;

  // Keys walk and turn: arrows or WASD.
  const fwd = (keys.has('arrowup') || keys.has('w') ? 1 : 0) - (keys.has('arrowdown') || keys.has('s') ? 1 : 0);
  const turn = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
  yawGoal += turn * dt * 1.6;
  if (fwd) goal.copy(onRoad(new THREE.Vector2(at.x + Math.sin(yaw) * fwd * 2, at.y - Math.cos(yaw) * fwd * 2)));

  // Walk towards the goal at a steady pace.
  const step = goal.clone().sub(at);
  const far = step.length();
  if (far > 0.01) {
    const before = at.clone();
    at.add(step.multiplyScalar(Math.min(1, (dt * 4.5) / far)));
    // In the store she stops at the furniture and does not walk through it.
    if (inside && store.blocked(at.x, at.y)) {
      at.copy(before);
      goal.copy(at);
    }
  }
  yaw += (yawGoal - yaw) * (1 - Math.exp(-dt * 10));
  pitch += (pitchGoal - pitch) * (1 - Math.exp(-dt * 10));
  const bob = far > 0.05 ? Math.sin(time * 9) * 0.04 : 0;
  camera.position.set(at.x, EYE + bob, at.y);
  camera.lookAt(at.x + Math.sin(yaw) * Math.cos(pitch), EYE + bob + Math.sin(pitch), at.y - Math.cos(yaw) * Math.cos(pitch));

  city.update(time, dt, camera.position);
  store.update(time);

  // Watch the frame rate over three-second stretches and shed the costliest effect if it sags.
  if (time > 4 && raw < 0.5) {
    slowTime += raw;
    slowFrames++;
    if (slowTime >= 3) {
      if (slowFrames / slowTime < 30 && quality > 0) {
        quality--;
        city.setRich(quality > 0);
      }
      slowTime = slowFrames = 0;
    }
  }

  if (questTimer > 0) {
    questTimer -= dt;
    if (questTimer <= 0 && !quest && $('intro').hidden && !writing) newQuest();
  }

  // The label follows the thing it names.
  if (shown) {
    if (performance.now() > shown.until) {
      label.hidden = true;
      shown = null;
    } else {
      projected.copy(shown.thing.anchor).project(camera);
      const behind = projected.z > 1;
      label.style.left = `${Math.max(90, Math.min(window.innerWidth - 90, (projected.x * 0.5 + 0.5) * window.innerWidth))}px`;
      label.style.top = `${Math.max(110, (-projected.y * 0.5 + 0.5) * window.innerHeight)}px`;
      label.style.visibility = behind ? 'hidden' : 'visible';
    }
  }

  // The store is brightly lit, so it is drawn plainly; the glow is for the night outside.
  if (inside) renderer.render(store.scene, camera);
  else if (quality === 2) composer.render();
  else renderer.render(city.scene, camera);
});
