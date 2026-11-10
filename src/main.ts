import * as THREE from 'three';
import { CameraRig } from './camera';
import { Finish } from './finish';
import { lerp } from './noise';
import { MIST, SUN_DIR, createAtmosphere } from './world/atmosphere';
import { createForest } from './world/forest';
import { wind } from './world/paint';
import { createPools } from './world/pools';
import { createTerrain } from './world/terrain';

const canvas = document.getElementById('world') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(MIST);
const fog = new THREE.FogExp2(MIST, 0.004);
scene.fog = fog;

// Warm light from above, cool green-blue bouncing up from the shade.
scene.add(new THREE.HemisphereLight(0xfff3d2, 0x2c5a55, 1.15));
const sun = new THREE.DirectionalLight(0xffe0a3, 2.0);
sun.position.copy(SUN_DIR).multiplyScalar(100);
scene.add(sun);

const terrain = createTerrain();
const poolsView = createPools();
const atmosphere = createAtmosphere();
scene.add(terrain.mesh, createForest(), poolsView.group, atmosphere.group);

const rig = new CameraRig(canvas, terrain.mesh);
const finish = new Finish(renderer);

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  rig.resize(w, h);
  finish.resize();
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const time = clock.elapsedTime;
  rig.update(dt);
  // Clear air from above, soft mist down among the trunks.
  fog.density = lerp(0.003, 0.02, rig.zoom * rig.zoom);
  wind.value = time;
  poolsView.update(time, dt, window.innerHeight, rig.camera.position);
  terrain.update(time, poolsView.openness);
  atmosphere.update(time, rig.zoom, window.innerHeight);
  finish.render(scene, rig.camera, fog.density);
});
