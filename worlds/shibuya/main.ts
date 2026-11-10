import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { KERB, ROAD, buildCity } from './city';
import type { Thing } from './city';
import { hasVoice, say, sound } from './speak';
import { buildStore } from './store';
import { PASS, openQuiz } from './quiz';
import { openTrace } from './trace';
import { describe, tokyoWeather } from './weather';
import type { Weather } from './weather';
import { WORDS, loadProgress, nextFew, nextWord, record, saveProgress, wordById } from './words';
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
composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.65, 0.8));
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
  // Whatever is nearest along the line of the tap is what was tapped. (Taking the first thing
  // found, however far off, let a mural on a building behind the shop answer a tap on the shop.)
  const near = (list: THREE.Object3D[], deep = false) => ray.intersectObjects(list, deep)[0];
  const thingHit = near(thingsHere().map((t) => t.object), true);
  const tagHit = inside ? undefined : near(city.tags.map((t) => t.mesh));
  const doorHit = near([inside ? store.exit : city.storeDoor], true);
  const puddleHit = inside ? undefined : near([city.puddle]);
  const nearest = [thingHit, tagHit, doorHit, puddleHit].filter((h) => h).sort((a, b) => a!.distance - b!.distance)[0];
  if (nearest && nearest === thingHit) {
    const thing = thingsHere().find((t) => {
      for (let o: THREE.Object3D | null = thingHit.object; o; o = o.parent) if (o === t.object) return true;
      return false;
    });
    if (thing) return touch(thing);
  }
  // One of her tags on the wall: write it with the spray can.
  if (nearest && nearest === tagHit) return write(city.tags.find((x) => x.mesh === tagHit.object)!.id);
  if (nearest && nearest === doorHit) return goThrough(!inside);
  if (nearest && nearest === puddleHit) return goHome();
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

/**
 * What she is being asked to find. Usually one thing; in the store, sometimes a shopping list
 * of three. Words she knows well are sometimes asked by ear alone or by reading alone.
 */
interface Quest {
  words: Word[];
  found: Set<string>;
  firstTry: boolean;
  mode: 'both' | 'listen' | 'read';
}
let quest: Quest | null = null;
let lastAsked: string | null = null;
let questTimer = 0;
let sinceList = 0;

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
    if (quest.words.some((x) => x.id === w.id) && !quest.found.has(w.id)) {
      // Found one.
      quest.found.add(w.id);
      record(progress, w.id, quest.firstTry);
      quest.firstTry = true;
      sound.right();
      const first = !progress.tagged.includes(w.id);
      if (first) {
        progress.tagged.push(w.id);
        city.tag(w.id, w.kana, false, true);
        sound.spray();
      }
      if (quest.found.size < quest.words.length) {
        drawAsk(); // more of the list still to find
      } else {
        const list = quest.words.length > 1;
        city.firework();
        setTimeout(() => sound.boom(), 250);
        ask.classList.add('right');
        const cheer = PRAISE[Math.floor(Math.random() * PRAISE.length)];
        let note = `${cheer[0]} (${cheer[1]})`;
        if (list) {
          // A finished shopping list earns a stamp on her card; every fifth is a celebration.
          progress.stamps = (progress.stamps ?? 0) + 1;
          note = `はんこ！ (hanko: a stamp)  You have ${progress.stamps}.`;
          if (progress.stamps % 5 === 0) for (let i = 1; i < 6; i++) setTimeout(() => city.firework(), i * 350);
          setTimeout(() => say('ありがとうございます'), 900);
        } else {
          if (first) note += inside ? '  Its outline is waiting on a wall outside, for you to spray.' : '  Now tap its outline on the wall to spray it.';
          setTimeout(() => say(cheer[0].replace('！', '')), 900);
        }
        drawAsk();
        ask.querySelector('.hint')!.textContent = note;
        quest = null;
        questTimer = 2.8;
      }
    } else if (!quest.found.has(w.id)) {
      // Not that one: it tells her its own name, and the question stands.
      quest.firstTry = false;
    }
  } else if (questTimer <= 0 && thingsHere().filter((t) => progress.heard.includes(t.word)).length >= (inside ? 1 : 4)) {
    questTimer = 2.5; // enough heard: the street starts asking
  }
  saveProgress(progress);
  drawCount();
}

function drawCount(): void {
  // Found, and of those, written by her own hand.
  count.textContent = `🔎 ${progress.tagged.length}  ✍ ${progress.sprayed!.length} / ${WORDS.length}` + (progress.stamps ? `  ·  はんこ ${progress.stamps}` : '');
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

/** Writes the question along the bottom of the screen, ticking off what has been found. */
function drawAsk(): void {
  if (!quest) return;
  const q = quest;
  const list = q.words.length > 1;
  const food = list || !!q.words[0].food;
  const frame = food ? { kana: 'を ください', romaji: 'o kudasai' } : { kana: 'は どこ？', romaji: 'wa doko?' };
  const noun = (w: Word) => (q.found.has(w.id) ? `✓${w.kana}` : q.mode === 'listen' ? '？？？' : w.kana);
  ask.querySelector('.kana')!.textContent = `${q.words.map(noun).join(' と ')} ${frame.kana}`;
  const romaji = q.words.map((w) => (q.mode === 'both' && needsRomaji(w.id) ? w.romaji : '…')).join(' to ');
  ask.querySelector('.romaji')!.textContent = q.mode === 'both' ? `${romaji} ${frame.romaji}` : '';
  $('again').hidden = q.mode === 'read';
}

function newQuest(): void {
  const here = new Set(thingsHere().map((t) => t.word));
  // In the store, every third question is a shopping list of three things, joined with と ("and").
  const several = inside && sinceList >= 2 ? nextFew(progress, here, 3, (w) => !!w.food) : [];
  let words: Word[];
  if (several.length === 3) {
    words = several;
    sinceList = 0;
  } else {
    const w = nextWord(progress, lastAsked, here);
    if (!w) return;
    words = [w];
    sinceList++;
  }
  const one = words[0];
  lastAsked = one.id;
  // A word she has found twice running is sometimes asked by ear alone, or by reading alone.
  const known = words.length === 1 && (progress.box[one.id] ?? 0) >= 2;
  const mode: Quest['mode'] = known ? (Math.random() < 0.5 ? 'listen' : 'read') : 'both';
  quest = { words, found: new Set(), firstTry: true, mode };
  ask.classList.remove('right');
  const food = words.length > 1 || !!one.food;
  questSpoken = words.map((w) => w.kana).join('と') + (food ? 'をください' : 'はどこ？');
  drawAsk();
  // The frame of the question is explained the first few times; the words themselves are hers to remember.
  const count = (key: string) => (progress.box[key] = (progress.box[key] ?? 0) + 1);
  let hint = '';
  if (words.length > 1) hint = count('_list') <= 3 ? 'A shopping list. と means “and”. Find all three for a stamp.' : '';
  else if (mode === 'listen') hint = 'Listening only this time. Tap 🔊 to hear it again.';
  else if (mode === 'read') hint = 'Reading only this time.';
  else if (food) hint = count('_kudasai') <= 3 ? '〜 を ください means “〜, please.”  Find it and tap it.' : '';
  else hint = progress.asked < 3 ? '〜 は どこ？ means “where is 〜?”  Find it and tap it.' : '';
  ask.querySelector('.hint')!.textContent = hint;
  ask.hidden = false;
  if (mode !== 'read') say(questSpoken);
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
    questTimer = 4;
    veil.classList.add('open');
    // What shop staff call out when a customer comes in, and what they say as one leaves.
    if (entering) announce('いらっしゃいませ', 'irasshaimase: welcome! Tap things to hear them; the clerk will ask for what you have heard.');
    else announce('ありがとう ございました', 'arigatō gozaimashita: thank you very much');
    setTimeout(() => (veil.style.transition = ''), 500);
  }, 380);
}

// For automated checks only: with ?debug in the address, a script can "tap" a thing by its word.
if (new URLSearchParams(window.location.search).has('debug')) {
  (window as unknown as { tapWord(id: string): boolean }).tapWord = (id) => {
    const t = thingsHere().find((x) => x.word === id);
    if (t) touch(t);
    return !!t;
  };
}

// ---- Teaching her how to play ----

/**
 * One line that always says what to do next, worked out from how far she has got.
 * Each way of playing is introduced in turn: listen, find, spray, shop, test.
 */
function nextStep(): string {
  if (writing || !$('intro').hidden || !$('quiz').hidden) return '';
  const heardHere = thingsHere().filter((t) => progress.heard.includes(t.word)).length;
  if (quest && !ask.classList.contains('right')) {
    if (quest.words.length > 1) return 'A shopping list ↓  Find all three things and tap each one.';
    if (quest.mode === 'listen') return 'Listen ↓  Tap 🔊 to hear it again, then find it and tap it.';
    if (quest.mode === 'read') return 'Read the word ↓  then find it and tap it.';
    return 'You are being asked for something ↓  Find it and tap it. A wrong tap is fine.';
  }
  if (inside) {
    if (heardHere === 0) return 'Tap anything on the shelves to hear its name.';
    return 'Tap more things to learn them, or tap the green でぐち door to leave.';
  }
  if (heardHere === 0) return 'Tap anything in the street to hear its name.';
  if (heardHere < 4) return `Tap ${4 - heardHere} more thing${heardHere === 3 ? '' : 's'}. Then the street will start asking you for them.`;
  if (progress.tagged.length === 0) return 'Good. Now listen: the street is about to ask you to find one of them.';
  if (progress.tagged.length > 0 && progress.sprayed!.length === 0) return 'You found a word! Tap its dashed outline on a wall to spray it yourself.';
  if (progress.sprayed!.length > 0 && !progress.heard.some((id) => wordById(id).store)) return 'Go into the bright コンビニ shop for more words: tap its front.';
  if (progress.tagged.length >= 25 && !progress.tests?.length) return 'You know a lot of words. Try the ✎ Test when you feel ready.';
  return '';
}
const coach = $('coach');
setInterval(() => {
  const text = nextStep();
  coach.hidden = !text;
  if (text && coach.textContent !== text) coach.textContent = text;
}, 400);
$('help').onclick = () => ($('howto').hidden = false);
$('howto-close').onclick = () => ($('howto').hidden = true);

// ---- The test ----

function testLine(): string {
  const last = progress.tests?.[progress.tests.length - 1];
  if (!last) return '';
  const pct = Math.round((last.right / last.total) * 100);
  return `Last test: ${pct}% (${last.right} of ${last.total}) on ${last.date}` + (last.right / last.total >= PASS ? ', passed' : '');
}
$('test').onclick = () => {
  if (writing) return;
  openQuiz(WORDS, (right, total) => {
    (progress.tests ??= []).push({ date: new Date().toISOString().slice(0, 10), right, total });
    saveProgress(progress);
    $('last-test').textContent = testLine();
    if (right / total >= PASS) for (let i = 0; i < 6; i++) setTimeout(() => city.firework(), i * 300);
  });
};
$('last-test').textContent = testLine();

// ---- Weather ----

// The street has whatever weather Tokyo has at this moment, and a chip says what it is.
// Tapping the chip says the word. `?sky=snow` (or clear, cloudy, rain, fog, storm) overrides it for testing.
const weatherChip = $('weather');
let weather: Weather | null = null;
function setWeather(w: Weather): void {
  weather = w;
  city.setWeather(w.sky);
  weatherChip.querySelector('.kana')!.textContent = `とうきょう · ${w.kana}`;
  weatherChip.querySelector('.romaji')!.textContent = `Tōkyō now: ${w.romaji}, ${w.english}` + (w.degrees === null ? '' : `, ${w.degrees}°C`);
  weatherChip.hidden = false;
}
weatherChip.onclick = () => {
  if (weather) say(weather.kana);
};
const forcedSky = new URLSearchParams(window.location.search).get('sky');
if (forcedSky && ['clear', 'cloudy', 'rain', 'snow', 'fog', 'storm'].includes(forcedSky)) setWeather(describe(forcedSky as Weather['sky']));
else void tokyoWeather().then((w) => w && setWeather(w));

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
