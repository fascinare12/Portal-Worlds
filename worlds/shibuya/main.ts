import * as THREE from 'three';
import { KERB, ROAD, buildCity } from './city';
import type { Thing } from './city';
import { hasVoice, say, sound } from './speak';
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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
const camera = new THREE.PerspectiveCamera(62, 1, 0.2, 900);
const city = buildCity();
const progress = loadProgress();

// Tags already earned are on the walls from the start.
for (const id of progress.tagged) city.tag(wordById(id).kana, false);

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---- Walking and looking ----

const EYE = 1.7;
const at = new THREE.Vector2(0, 41);
const goal = at.clone();
let yaw = 0; // 0 looks up the street, away from where she arrives
let pitch = 0.06;
let yawGoal = yaw;
let pitchGoal = pitch;

/** Keeps a spot on the roads: the main street, or the street that crosses it. */
function onRoad(p: THREE.Vector2): THREE.Vector2 {
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
  ray.setFromCamera(new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1), camera);
  // A thing with a name?
  const hit = ray.intersectObjects(city.things.map((t) => t.object), true)[0];
  if (hit) {
    const thing = city.things.find((t) => {
      for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) if (o === t.object) return true;
      return false;
    });
    if (thing) return touch(thing);
  }
  if (ray.intersectObject(city.puddle).length) return goHome();
  // Otherwise walk to the spot on the road.
  const d = ray.ray.direction;
  if (d.y < -0.02) {
    const k = -ray.ray.origin.y / d.y;
    goal.copy(onRoad(new THREE.Vector2(ray.ray.origin.x + d.x * k, ray.ray.origin.z + d.z * k)));
  }
}

// ---- Words ----

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
        city.tag(w.kana, true);
        sound.spray();
      }
      ask.classList.add('right');
      ask.querySelector('.hint')!.textContent = 'せいかい！ (seikai: correct)';
      quest = null;
      questTimer = 2.6;
    } else {
      // Not that one: it tells her its own name, and the question stands.
      quest.firstTry = false;
    }
  } else if (questTimer <= 0 && progress.heard.length >= 4) {
    questTimer = 2.5; // enough heard: the street starts asking
  }
  saveProgress(progress);
  drawCount();
}

function drawCount(): void {
  count.textContent = `${progress.tagged.length} / ${WORDS.length}`;
}

function newQuest(): void {
  const w = nextWord(progress, lastAsked);
  if (!w) return;
  quest = { word: w, firstTry: true };
  lastAsked = w.id;
  ask.classList.remove('right');
  ask.querySelector('.kana')!.textContent = `${w.kana} は どこ？`;
  ask.querySelector('.romaji')!.textContent = needsRomaji(w.id) ? `${w.romaji} wa doko?` : '… wa doko?';
  // The frame of the question is explained; the word itself is hers to remember.
  ask.querySelector('.hint')!.textContent = progress.asked < 3 ? '〜 は どこ？ means “where is 〜?”  Find it and tap it.' : '';
  ask.hidden = false;
  say(`${w.kana}はどこ？`);
}
$('again').onclick = () => {
  if (quest) say(`${quest.word.kana}はどこ？`);
};

// ---- Arriving and leaving ----

function goHome(): void {
  saveProgress(progress);
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

$('start').onclick = () => {
  // Sound is only allowed after a tap, so the greeting is spoken here.
  $('intro').hidden = true;
  say('こんばんは');
  setTimeout(() => {
    $('mute').hidden = hasVoice();
  }, 1200);
  if (progress.heard.length >= 4) questTimer = 3;
};
drawCount();
requestAnimationFrame(() => veil.classList.add('open'));

// ---- Every frame ----

const clock = new THREE.Clock();
const projected = new THREE.Vector3();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const time = clock.elapsedTime;

  // Keys walk and turn: arrows or WASD.
  const fwd = (keys.has('arrowup') || keys.has('w') ? 1 : 0) - (keys.has('arrowdown') || keys.has('s') ? 1 : 0);
  const turn = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0);
  yawGoal += turn * dt * 1.6;
  if (fwd) goal.copy(onRoad(new THREE.Vector2(at.x + Math.sin(yaw) * fwd * 2, at.y - Math.cos(yaw) * fwd * 2)));

  // Walk towards the goal at a steady pace.
  const step = goal.clone().sub(at);
  const far = step.length();
  if (far > 0.01) at.add(step.multiplyScalar(Math.min(1, (dt * 6) / far)));
  yaw += (yawGoal - yaw) * (1 - Math.exp(-dt * 10));
  pitch += (pitchGoal - pitch) * (1 - Math.exp(-dt * 10));
  const bob = far > 0.05 ? Math.sin(time * 9) * 0.04 : 0;
  camera.position.set(at.x, EYE + bob, at.y);
  camera.lookAt(at.x + Math.sin(yaw) * Math.cos(pitch), EYE + bob + Math.sin(pitch), at.y - Math.cos(yaw) * Math.cos(pitch));

  city.update(time, dt);

  if (questTimer > 0) {
    questTimer -= dt;
    if (questTimer <= 0 && !quest && $('intro').hidden) newQuest();
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

  renderer.render(city.scene, camera);
});
