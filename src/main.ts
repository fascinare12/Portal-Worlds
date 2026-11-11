import * as THREE from 'three';
import { CameraRig } from './camera';
import { Finish } from './finish';
import { lerp, smoothstep } from './noise';
import { createAtmosphere } from './world/atmosphere';
import { daylight, updateDaylight } from './world/daylight';
import { createFox } from './world/creatures/fox';
import { createJelly } from './world/creatures/jelly';
import { createPaper } from './world/creatures/paper';
import { createSphinx } from './world/creatures/sphinx';
import { createForest } from './world/forest';
import { pools } from './world/layout';
import { wind } from './world/paint';
import { createPools } from './world/pools';
import { createTerrain } from './world/terrain';

const canvas = document.getElementById('world') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });

const scene = new THREE.Scene();
const fog = new THREE.FogExp2(0xffffff, 0.004);
fog.color = daylight.horizon; // distance fades into whatever colour the horizon is now
scene.fog = fog;

// Light from the sun or moon, plus softer light bouncing between sky and ground.
const bounce = new THREE.HemisphereLight();
const sun = new THREE.DirectionalLight();
scene.add(bounce, sun);

const terrain = createTerrain();
const poolsView = createPools();
const atmosphere = createAtmosphere();
const forest = createForest();
scene.add(terrain.mesh, forest.group, poolsView.group, atmosphere.group);

// Visitors from other worlds.
const desertIndex = pools.findIndex((p) => p.world === 'desert');
const sphinx = createSphinx(pools[desertIndex], () => poolsView.stir(desertIndex));
scene.add(sphinx.group);
const cityIndex = pools.findIndex((p) => p.world === 'shibuya');
const fox = createFox(pools[cityIndex], () => poolsView.stir(cityIndex));
scene.add(fox.group);
const seaIndex = pools.findIndex((p) => p.world === 'sea');
const jelly = createJelly(pools[seaIndex], () => poolsView.stir(seaIndex));
scene.add(jelly.group);
const printIndex = pools.findIndex((p) => p.world === 'print');
const paper = createPaper(pools[printIndex], () => poolsView.stir(printIndex));
scene.add(paper.group);

const rig = new CameraRig(canvas, terrain.mesh);
const finish = new Finish(renderer);

// Quality steps down by itself on devices that cannot keep up, so movement stays smooth.
const DEVICE_RATIO = Math.min(window.devicePixelRatio, 2);
const LEVELS = [
  { ratio: DEVICE_RATIO, smoothing: true, density: 1, blur: true },
  { ratio: Math.min(DEVICE_RATIO, 1.5), smoothing: true, density: 0.8, blur: true },
  { ratio: Math.min(DEVICE_RATIO, 1), smoothing: false, density: 0.65, blur: false },
  { ratio: 0.75, smoothing: false, density: 0.45, blur: false },
];
const fixedLevel = new URLSearchParams(window.location.search).get('q'); // ?q=0..3 pins a level for testing
let level = fixedLevel === null ? 0 : Math.min(LEVELS.length - 1, Math.max(0, Number(fixedLevel) || 0));

function resize(): void {
  renderer.setPixelRatio(LEVELS[level].ratio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  rig.resize(window.innerWidth, window.innerHeight);
  finish.resize();
}
function applyLevel(): void {
  finish.setSmoothing(LEVELS[level].smoothing);
  forest.setDensity(LEVELS[level].density);
  resize();
}
window.addEventListener('resize', resize);
applyLevel();

// Passing the mouse over a pool, or touching one, wakes it.
const pointerRay = new THREE.Raycaster();
const pointerAt = new THREE.Vector2();
function wake(e: PointerEvent): void {
  pointerAt.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  pointerRay.setFromCamera(pointerAt, rig.camera);
  poolsView.touch(pointerRay.ray);
}
canvas.addEventListener('pointermove', wake);
canvas.addEventListener('pointerdown', wake);

// Diving through a pool: the view drops into the water, the screen fills with the
// pool's colour, and the other world loads. Each world lives in its own folder
// under worlds/ and runs by its own rules.
const veil = document.getElementById('veil') as HTMLDivElement;
rig.onDive = (pool) => {
  rig.dive(pool);
  veil.style.background = '#' + pool.color.toString(16).padStart(6, '0');
  setTimeout(() => veil.classList.add('closed'), 500);
  setTimeout(() => {
    window.location.href = `worlds/${pool.world}/index.html`;
  }, 1700);
};
// Coming home: rise out of the pool that leads to the world just left.
const cameFrom = window.location.hash.replace('#from-', '');
// For looking at one pool while developing: add ?at=3 (the pool's number) to the address.
const lookAt = new URLSearchParams(window.location.search).get('at');
const homePool = lookAt !== null ? pools[Number(lookAt)] : pools.find((p) => p.world && p.world === cameFrom);
if (homePool) {
  rig.arriveAt(homePool);
  veil.style.background = '#' + homePool.color.toString(16).padStart(6, '0');
  veil.classList.add('closed', 'instant');
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
// If the browser brings this page back from its history, lift the veil again.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});

// The picture fades in once its painted textures have arrived.
const reveal = () => {
  canvas.classList.add('ready');
  veil.classList.remove('instant');
  requestAnimationFrame(() => veil.classList.remove('closed'));
};
THREE.DefaultLoadingManager.onLoad = reveal;
setTimeout(reveal, 5000);

const clock = new THREE.Clock();
let sampleTime = 0;
let sampleFrames = 0;
let warmUp = 3;
let skyClock = 0;

renderer.setAnimationLoop(() => {
  const raw = clock.getDelta();
  const dt = Math.min(raw, 0.1);
  const time = clock.elapsedTime;

  // Watch the frame rate over two-second stretches; drop a level if it sags.
  if (fixedLevel === null && raw < 0.5) {
    if (warmUp > 0) {
      warmUp -= raw;
    } else {
      sampleTime += raw;
      sampleFrames++;
      if (sampleTime >= 2) {
        if (sampleFrames / sampleTime < 40 && level < LEVELS.length - 1) {
          level++;
          applyLevel();
          warmUp = 2;
        }
        sampleTime = sampleFrames = 0;
      }
    }
  }

  // The sun moves slowly; checking where it is every few seconds is plenty.
  skyClock -= dt;
  if (skyClock <= 0) {
    skyClock = 5;
    updateDaylight(new Date());
    sun.position.copy(daylight.lightDir).multiplyScalar(100);
    sun.color.copy(daylight.light);
    sun.intensity = daylight.lightPower;
    bounce.color.copy(daylight.bounceSky);
    bounce.groundColor.copy(daylight.bounceGround);
    bounce.intensity = daylight.bouncePower;
  }

  rig.update(dt);
  // Clear air from above, soft mist down among the trunks.
  fog.density = lerp(0.003, 0.02, rig.zoom * rig.zoom);
  wind.value = time;
  poolsView.update(time, dt, window.innerHeight, rig.camera.position);
  sphinx.update(dt);
  fox.update(dt);
  jelly.update(dt);
  paper.update(dt);
  terrain.update(time, poolsView.glow);
  atmosphere.update(time, rig.zoom, window.innerHeight);
  const blur = LEVELS[level].blur ? smoothstep(0.6, 0.95, rig.zoom) : 0;
  // From high above, leaf edges are only a pixel or two apart, where strong ink lines
  // would crawl; they lighten with height.
  const ink = lerp(0.4, 0.8, smoothstep(0.1, 0.5, rig.zoom));
  finish.render(scene, rig.camera, fog.density, blur, ink);
});
