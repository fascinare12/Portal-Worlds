import * as THREE from 'three';
import { Finish } from '../../src/finish';
import { fbm, lerp, smoothstep } from '../../src/noise';

/**
 * Arrival in the desert. Deliberately small: dunes, a sky, and the pool you
 * came through, which is also the way home. Everything else about this world
 * is still to be decided, and nothing here is shared with the wood's rules.
 */

const canvas = document.getElementById('world') as HTMLCanvasElement;
const veil = document.getElementById('veil') as HTMLDivElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

const SKY_LOW = new THREE.Color(0xf6e2b8);
const SKY_HIGH = new THREE.Color(0x7fb6e6);
const SUN = new THREE.Vector3(0.5, 0.62, -0.6).normalize();
const POOL_RADIUS = 3.4;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(SKY_LOW, 0.006);
scene.add(new THREE.HemisphereLight(0xfff1d0, 0xc99a5a, 1.2));
const sun = new THREE.DirectionalLight(0xfff0cf, 2.2);
sun.position.copy(SUN).multiplyScalar(100);
scene.add(sun);

/** Height of the sand; flat and slightly sunken around the pool. */
function sandHeight(x: number, z: number): number {
  const d = Math.hypot(x, z);
  const dunes = Math.max(0, fbm(x * 0.012 + 5, z * 0.012 + 5, 3) * 30 - 9) + Math.sin(x * 0.05 + z * 0.03) * 1.5;
  // A shallow basin holds the water; beyond its rim the dunes begin.
  const rim = 0.25 + dunes * smoothstep(8, 70, d);
  return lerp(-0.7, rim, smoothstep(POOL_RADIUS * 0.85, POOL_RADIUS + 2, d));
}

// Sand.
const sandGeo = new THREE.PlaneGeometry(420, 420, 300, 300);
sandGeo.rotateX(-Math.PI / 2);
const sp = sandGeo.attributes.position;
const sc = new Float32Array(sp.count * 3);
const light = new THREE.Color(0xf0d49a);
const dark = new THREE.Color(0xd9b06c);
const tone = new THREE.Color();
for (let i = 0; i < sp.count; i++) {
  const x = sp.getX(i);
  const z = sp.getZ(i);
  sp.setY(i, sandHeight(x, z));
  tone.copy(dark).lerp(light, fbm(x * 0.05, z * 0.05, 3));
  sc.set([tone.r, tone.g, tone.b], i * 3);
}
sandGeo.setAttribute('color', new THREE.BufferAttribute(sc, 3));
sandGeo.computeVertexNormals();
scene.add(new THREE.Mesh(sandGeo, new THREE.MeshLambertMaterial({ vertexColors: true })));

// Sky.
scene.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(500, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { uLow: { value: SKY_LOW }, uHigh: { value: SKY_HIGH }, uSun: { value: SUN } },
      vertexShader: `varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform vec3 uLow; uniform vec3 uHigh; uniform vec3 uSun; varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          vec3 col = mix(uLow, uHigh, smoothstep(0.0, 0.5, d.y));
          float toSun = max(dot(d, uSun), 0.0);
          col += vec3(1.0, 0.92, 0.7) * (pow(toSun, 8.0) * 0.3 + smoothstep(0.9985, 0.9992, toSun) * 2.5);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  ),
);

// The pool home: green and swirling, the colour of the wood on the other side.
const poolUniforms = { uTime: { value: 0 } };
const pool = new THREE.Mesh(
  new THREE.CircleGeometry(POOL_RADIUS + 2, 48),
  new THREE.ShaderMaterial({
    uniforms: poolUniforms,
    vertexShader: `varying vec2 vPos; void main() { vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; varying vec2 vPos;
      void main() {
        float r = length(vPos) / ${POOL_RADIUS.toFixed(1)};
        float arms = sin(atan(vPos.y, vPos.x) * 3.0 + r * 5.5 - uTime * 1.1) * 0.5 + 0.5;
        float heart = smoothstep(1.3, 0.0, r);
        vec3 wood = vec3(0.42, 0.72, 0.46);
        vec3 col = mix(wood * 0.7, mix(wood, vec3(1.0), 0.7), heart * heart);
        col = mix(col, mix(wood, vec3(1.0), 0.5), arms * 0.45 * smoothstep(1.5, 0.3, r));
        gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
      }`,
  }),
);
pool.rotation.x = -Math.PI / 2;
pool.position.y = -0.3;
scene.add(pool);

// A ring of sandstone blocks around it.
const blocks = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0xcfa66a }),
  14,
);
const dummy = new THREE.Object3D();
for (let i = 0; i < 14; i++) {
  const a = (i / 14) * Math.PI * 2;
  const d = POOL_RADIUS + 3 + Math.sin(i * 2.3) * 0.6;
  const s = 0.5 + ((i * 37) % 10) / 20;
  dummy.position.set(Math.cos(a) * d, sandHeight(Math.cos(a) * d, Math.sin(a) * d) + s * 0.3, Math.sin(a) * d);
  dummy.rotation.set(0, a + i, 0);
  dummy.scale.set(s * 1.4, s, s);
  dummy.updateMatrix();
  blocks.setMatrixAt(i, dummy.matrix);
}
scene.add(blocks);

// Camera: stands by the pool and looks around. Drag to turn, pinch or scroll to step back.
const camera = new THREE.PerspectiveCamera(50, 1, 0.3, 700);
const finish = new Finish(renderer);
let yaw = 0.6;
let yawGoal = yaw;
let back = 13;
let backGoal = back;
let rise = 0; // 0 = under the water, 1 = standing on the sand
let diving = 0;

function resize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  finish.resize();
}
window.addEventListener('resize', resize);
resize();

const pointers = new Map<number, { x: number; y: number }>();
let tap: { x: number; y: number; t: number } | null = null;
let pinch = 0;
const ray = new THREE.Raycaster();

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  tap = pointers.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
  pinch = 0;
});
canvas.addEventListener('pointermove', (e) => {
  const prev = pointers.get(e.pointerId);
  if (!prev) return;
  if (pointers.size === 1) yawGoal -= (e.clientX - prev.x) * 0.006;
  prev.x = e.clientX;
  prev.y = e.clientY;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch) backGoal = Math.min(40, Math.max(8, backGoal * (pinch / dist)));
    pinch = dist;
  }
});
const release = (e: PointerEvent) => {
  pointers.delete(e.pointerId);
  pinch = 0;
  const t = tap;
  tap = null;
  if (!t || diving || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 10 || performance.now() - t.t > 400) return;
  // Tap the pool to dive back to the wood.
  ray.setFromCamera(
    new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1),
    camera,
  );
  const dir = ray.ray.direction;
  if (dir.y >= 0) return;
  const k = (pool.position.y - ray.ray.origin.y) / dir.y;
  const hx = ray.ray.origin.x + dir.x * k;
  const hz = ray.ray.origin.z + dir.z * k;
  if (Math.hypot(hx, hz) < POOL_RADIUS + 1) {
    diving = 0.001;
    veil.style.background = '#4f9a5c';
    setTimeout(() => veil.classList.remove('open'), 500);
    setTimeout(() => {
      window.location.href = '../../index.html#from-desert';
    }, 1900);
  }
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    backGoal = Math.min(40, Math.max(8, backGoal * (1 + Math.max(-120, Math.min(120, e.deltaY)) * 0.0012)));
  },
  { passive: false },
);
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});

requestAnimationFrame(() => veil.classList.add('open'));

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  poolUniforms.uTime.value = clock.elapsedTime;
  yaw = lerp(yaw, yawGoal, 1 - Math.exp(-dt * 8));
  back = lerp(back, backGoal, 1 - Math.exp(-dt * 6));
  rise = Math.min(1, rise + dt / 2.4);
  if (diving) diving = Math.min(1, diving + dt / 1.6);

  // Rise out of the water on arrival; drop back into it when diving home.
  const up = smoothstep(0, 1, rise) * (1 - smoothstep(0, 1, diving));
  const d = lerp(0.5, back, up);
  camera.position.set(Math.sin(yaw) * d, lerp(-0.1, 3.2 + back * 0.12, up), Math.cos(yaw) * d);
  camera.lookAt(0, lerp(-3, 1.2, up), 0);

  finish.render(scene, camera, 0.006, 0, 0.7);
});
