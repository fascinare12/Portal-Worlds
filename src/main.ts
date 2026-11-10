import * as THREE from 'three';
import { CameraRig } from './camera';
import { lerp } from './noise';
import { createForest } from './world/forest';
import { createPools } from './world/pools';
import { createTerrain } from './world/terrain';

const canvas = document.getElementById('world') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const MIST = 0xb9d6a8;
const scene = new THREE.Scene();
scene.background = new THREE.Color(MIST);
const fog = new THREE.FogExp2(MIST, 0.004);
scene.fog = fog;

scene.add(new THREE.HemisphereLight(0xe6f5d0, 0x3d5a34, 1.5));
const sun = new THREE.DirectionalLight(0xfff0c8, 1.6);
sun.position.set(60, 120, 40);
scene.add(sun);

const terrain = createTerrain();
const poolsView = createPools();
scene.add(terrain, createForest(), poolsView.group);

const rig = new CameraRig(canvas, terrain);

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  rig.resize(w, h);
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  rig.update(dt);
  // Clear air from above, thick green mist down among the trunks.
  fog.density = lerp(0.0035, 0.022, rig.zoom * rig.zoom);
  poolsView.update(clock.elapsedTime, dt, window.innerHeight, rig.camera.position);
  renderer.render(scene, rig.camera);
});
