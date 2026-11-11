import * as THREE from 'three';
import { fbm } from '../../src/noise';
import { BODY_VERT, glow, makeJellyfish } from '../../src/world/creatures/jellyModel';

/**
 * The deep sea. The viewer hangs in the middle of a column of water and sinks
 * through three zones: sunlit shallows, blue twilight, and black water lit
 * only by living things. Almost everything here is drawn as light.
 */

/** How far down the water goes, in world units. */
export const DEEPEST = 160;
const FLOOR = -(DEEPEST + 6);

export interface Ocean {
  scene: THREE.Scene;
  /** The whale has just come into view: time for its call. */
  onWhale: (() => void) | null;
  /** A tap along this ray. Returns what was touched. */
  tap(ray: THREE.Ray): 'jelly' | 'angler' | 'water';
  /** Where the finger or cursor is pointing, and whether it is down. */
  point(ray: THREE.Ray, pressed: boolean): void;
  update(time: number, dt: number, eye: THREE.Vector3): void;
}

let seed = 4242;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const step01 = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Colour of the water straight ahead, by how deep you are (0 = surface, 1 = floor). */
function waterColour(t: number, out: THREE.Color): THREE.Color {
  const shallow = new THREE.Color(0.03, 0.34, 0.5);
  const dusk = new THREE.Color(0.012, 0.09, 0.24);
  const black = new THREE.Color(0, 0.004, 0.014);
  return out.copy(shallow).lerp(dusk, step01(0, 0.4, t)).lerp(black, step01(0.4, 0.72, t));
}

const COMB_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vP;
  varying float vFade;
  void main() {
    float edge = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
    // Eight rows of beating combs, each scattering light into running rainbows.
    float row = pow(abs(sin(atan(vP.z, vP.x) * 4.0)), 24.0);
    float hue = fract(vP.y * 1.5 - uTime * 0.9 + uPhase);
    vec3 rainbow = clamp(abs(mod(hue * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    float sparkle = 0.5 + 0.5 * sin(vP.y * 40.0 - uTime * 12.0);
    vec3 c = vec3(0.25, 0.5, 0.7) * edge * 0.45 + rainbow * row * (0.5 + 0.7 * sparkle);
    gl_FragColor = vec4(c * vFade, 1.0);
  }`;

export function buildOcean(): Ocean {
  const scene = new THREE.Scene();
  const fog = new THREE.FogExp2(0x0a6a94, 0.02);
  scene.fog = fog;
  const sky = new THREE.HemisphereLight(0xa8ecff, 0x06203a, 1.6);
  const sun = new THREE.DirectionalLight(0xdff8ff, 1.6);
  sun.position.set(0.3, 1, 0.2);
  scene.add(sky, sun);

  const uTime = { value: 0 };
  const uDepth = { value: 0 };

  // ---- The water itself: colour by depth, the shimmering surface overhead, and shafts of sunlight.
  const water = new THREE.Mesh(
    new THREE.SphereGeometry(300, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { uTime, uDepth },
      vertexShader: `varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uDepth;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float t = uDepth;
          vec3 ahead = mix(mix(vec3(0.03, 0.34, 0.5), vec3(0.012, 0.09, 0.24), smoothstep(0.0, 0.4, t)), vec3(0.0, 0.004, 0.014), smoothstep(0.4, 0.72, t));
          vec3 above = mix(mix(vec3(0.2, 0.62, 0.74), vec3(0.025, 0.18, 0.38), smoothstep(0.0, 0.35, t)), vec3(0.0, 0.005, 0.016), smoothstep(0.35, 0.7, t));
          vec3 col = d.y > 0.0 ? mix(ahead, above, pow(d.y, 0.7)) : mix(ahead, ahead * 0.3, pow(-d.y, 0.6));
          float shallow = 1.0 - smoothstep(0.0, 0.32, t);
          if (d.y > 0.02) {
            // The underside of the waves, seen from below.
            vec2 s = d.xz / d.y;
            float w = sin(s.x * 3.0 + uTime * 0.8 + sin(s.y * 2.0 + uTime * 0.5) * 1.5) * sin(s.y * 3.3 - uTime * 0.6 + sin(s.x * 2.4) * 1.5);
            col += vec3(0.5, 0.8, 0.82) * smoothstep(0.25, 0.95, w) * shallow * smoothstep(0.0, 0.5, d.y) * 0.22;
          }
          // Sunbeams fanning down through the water.
          float a = atan(d.z, d.x);
          float rays = pow(0.5 + 0.5 * sin(a * 14.0 + sin(a * 5.0 + uTime * 0.2) * 2.0 + uTime * 0.15), 3.0);
          col += vec3(0.4, 0.75, 0.82) * rays * shallow * smoothstep(-0.35, 0.5, d.y) * 0.16;
          // In the dark, slow curtains of living light drift through the water, like an aurora under the sea.
          float deepness = smoothstep(0.4, 0.75, t);
          float curtain = pow(0.5 + 0.5 * sin(d.y * 5.0 + sin(a * 3.0 + uTime * 0.25) * 2.2 - uTime * 0.35), 7.0);
          float drift = 0.5 + 0.5 * sin(a * 2.0 - uTime * 0.12);
          col += mix(vec3(0.05, 0.75, 0.7), vec3(0.4, 0.2, 0.9), 0.5 + 0.5 * sin(a * 1.5 + uTime * 0.07)) * curtain * drift * deepness * 0.11;
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  scene.add(water);

  // ---- Plankton and drifting specks, everywhere. In the deep they are alive with light: they
  // twinkle, flare under a finger, and carry the waves of light that sweep through the water.
  const SPECKS = 16000;
  const specks = new Float32Array(SPECKS * 3);
  const seeds = new Float32Array(SPECKS);
  for (let i = 0; i < SPECKS; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 2.5 + Math.sqrt(rnd()) * 44;
    specks.set([Math.cos(a) * r, 6 + rnd() * (FLOOR - 6), Math.sin(a) * r], i * 3);
    seeds[i] = rnd();
  }
  const speckGeo = new THREE.BufferGeometry();
  speckGeo.setAttribute('position', new THREE.BufferAttribute(specks, 3));
  speckGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const pulses = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, -100));
  const speckUniforms = {
    uTime,
    uScale: { value: 800 },
    uPulses: { value: pulses },
    uRayO: { value: new THREE.Vector3() },
    uRayD: { value: new THREE.Vector3(0, 0, -1) },
    uTouch: { value: 0 },
  };
  const plankton = new THREE.Points(
    speckGeo,
    glow({
      uniforms: speckUniforms,
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        uniform float uScale;
        uniform vec4 uPulses[4];
        uniform vec3 uRayO;
        uniform vec3 uRayD;
        uniform float uTouch;
        varying vec3 vCol;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.2 + aSeed * 50.0) * 0.6;
          p.y += sin(uTime * 0.15 + aSeed * 80.0) * 0.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float deep = smoothstep(-22.0, -70.0, p.y);
          float twinkle = pow(0.5 + 0.5 * sin(uTime * (0.5 + aSeed) + aSeed * 100.0), 8.0);
          float lit = 0.07 + twinkle * 0.9 * deep;
          // Waves of light: each is a shell that swells outward from where it began.
          for (int i = 0; i < 4; i++) {
            float age = uTime - uPulses[i].w;
            if (age > 0.0 && age < 7.0) {
              float shell = abs(distance(p, uPulses[i].xyz) - age * 7.0);
              lit += smoothstep(3.4, 0.0, shell) * (1.0 - age / 7.0) * 6.0;
            }
          }
          // And they flare along the line of a finger.
          vec3 w = p - uRayO;
          float along = dot(w, uRayD);
          lit += smoothstep(2.4, 0.0, length(w - uRayD * along)) * step(0.0, along) * uTouch * 2.2;
          vec3 hue = mix(vec3(0.2, 0.9, 1.0), vec3(0.3, 1.0, 0.5), fract(aSeed * 7.0));
          hue = mix(hue, vec3(0.55, 0.4, 1.0), step(0.8, fract(aSeed * 13.0)));
          vCol = mix(vec3(0.8, 0.9, 1.0) * 0.5, hue, deep) * lit * exp(-length(mv.xyz) * 0.03);
          gl_PointSize = uScale * (0.09 + 0.13 * fract(aSeed * 31.0)) * (1.0 + lit * 0.45) / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vCol;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          gl_FragColor = vec4(vCol * smoothstep(0.5, 0.0, d), 1.0);
        }`,
    }),
  );
  plankton.frustumCulled = false;
  scene.add(plankton);
  // Each wave of light is also seen as a faint, swelling bubble of glow.
  const shells = pulses.map(() => {
    const strength = { value: 0 };
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 28),
      glow({
        uniforms: { uStrength: strength },
        vertexShader: `varying vec3 vN; varying vec3 vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float uStrength; varying vec3 vN; varying vec3 vV; void main() { float edge = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0); gl_FragColor = vec4(vec3(0.25, 0.9, 1.0) * edge * uStrength, 1.0); }`,
      }),
    );
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, strength };
  });
  let nextPulse = 0;
  let pulseSlot = 0;
  const startPulse = (x: number, y: number, z: number, time: number) => {
    pulses[pulseSlot].set(x, y, z, time);
    pulseSlot = (pulseSlot + 1) % pulses.length;
  };

  // ---- Jellyfish, from the shallows down into the dark.
  interface Jelly {
    group: THREE.Group;
    angle: number;
    radius: number;
    home: number;
    size: number;
    phase: number;
    kick: number;
    flash: { value: number };
  }
  const jellies: Jelly[] = [];
  const jellyHues = [0x6fe3ff, 0xff8ad8, 0x9f8cff, 0x8cffd0, 0xffc88a, 0x5ab0ff];
  for (let i = 0; i < 22; i++) {
    const size = 0.6 + rnd() * 1.5;
    const phase = rnd() * 6.28;
    const { group, flash } = makeJellyfish({ time: uTime, colour: new THREE.Color(pick(jellyHues)), phase, random: rnd });
    group.scale.setScalar(size);
    scene.add(group);
    jellies.push({ group, angle: rnd() * 6.28, radius: 5 + rnd() * 22, home: -4 - rnd() * rnd() * 135 - i * 2, size, phase, kick: 0, flash });
  }

  // ---- Comb jellies in the twilight: clear bodies with rainbows running down them.
  const combs: { mesh: THREE.Mesh; angle: number; radius: number; home: number; phase: number }[] = [];
  const combGeo = new THREE.SphereGeometry(1, 28, 20).scale(0.55, 0.85, 0.55);
  for (let i = 0; i < 14; i++) {
    const phase = rnd() * 6.28;
    const mesh = new THREE.Mesh(combGeo, glow({ uniforms: { uTime, uPhase: { value: phase }, uAmp: { value: 0.04 }, uFade: { value: 0.03 } }, vertexShader: BODY_VERT, fragmentShader: COMB_FRAG }));
    mesh.scale.setScalar(0.5 + rnd() * 0.9);
    scene.add(mesh);
    combs.push({ mesh, angle: rnd() * 6.28, radius: 4 + rnd() * 16, home: -45 - rnd() * 60, phase });
  }

  // ---- Chains of light in the midnight water: long colonies whose glow runs along them in pulses.
  for (let i = 0; i < 5; i++) {
    const beads = 90;
    const along = new Float32Array(beads);
    for (let k = 0; k < beads; k++) along[k] = k / (beads - 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(beads * 3), 3));
    geo.setAttribute('aAlong', new THREE.BufferAttribute(along, 1));
    const a = rnd() * 6.28;
    const r = 7 + rnd() * 16;
    const chain = new THREE.Points(
      geo,
      glow({
        uniforms: { uTime, uScale: speckUniforms.uScale, uPhase: { value: rnd() * 6.28 }, uHead: { value: new THREE.Vector3(Math.cos(a) * r, -95 - rnd() * 45, Math.sin(a) * r) }, uColor: { value: new THREE.Color(pick([0xff5a8a, 0x5affc8, 0x8a9cff, 0xffb05a])) } },
        vertexShader: /* glsl */ `
          attribute float aAlong;
          uniform float uTime;
          uniform float uScale;
          uniform float uPhase;
          uniform vec3 uHead;
          uniform vec3 uColor;
          varying vec3 vCol;
          void main() {
            float s = aAlong;
            vec3 p = uHead + vec3(sin(s * 9.0 + uTime * 0.5 + uPhase) * 1.6 * s, -s * 16.0 + sin(uTime * 0.3 + uPhase) * 1.5, cos(s * 7.0 + uTime * 0.4 + uPhase) * 1.6 * s);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            // Light runs down the chain in beats.
            float run = pow(0.5 + 0.5 * sin(s * 26.0 - uTime * 4.0 + uPhase), 6.0);
            vCol = uColor * (0.25 + run * 1.6) * exp(-length(mv.xyz) * 0.03);
            gl_PointSize = uScale * (0.16 + run * 0.14) / -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `varying vec3 vCol; void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vCol * smoothstep(0.5, 0.0, d), 1.0); }`,
      }),
    );
    chain.frustumCulled = false;
    scene.add(chain);
  }

  // ---- Shoals: streams of fish circling the viewer, parting round a finger.
  const fishShape: THREE.Vector2[] = [[0, 0.5], [0.1, 0.32], [0.14, 0.06], [0.1, -0.24], [0.035, -0.42], [0.13, -0.62]].map(([r, y]) => new THREE.Vector2(r, y));
  const fishGeo = new THREE.LatheGeometry(fishShape, 10).rotateX(Math.PI / 2).scale(0.45, 1, 1);
  interface Shoal {
    mesh: THREE.InstancedMesh;
    count: number;
    y: number;
    radius: number;
    speed: number;
    offsets: Float32Array;
  }
  const shoals: Shoal[] = [];
  const addShoal = (count: number, y: number, radius: number, speed: number, material: THREE.Material, size: number) => {
    const mesh = new THREE.InstancedMesh(fishGeo, material, count);
    mesh.frustumCulled = false;
    const offsets = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) offsets.set([(rnd() - 0.5) * 1.5, (rnd() - 0.5) * 5, (rnd() - 0.5) * 4, size * (0.7 + rnd() * 0.6)], i * 4);
    scene.add(mesh);
    shoals.push({ mesh, count, y, radius, speed, offsets });
  };
  addShoal(170, -9, 13, 0.16, new THREE.MeshLambertMaterial({ color: 0xbfd8e6, emissive: 0x1a3a4a }), 1.5);
  addShoal(120, -24, 19, -0.11, new THREE.MeshLambertMaterial({ color: 0xffc070, emissive: 0x402a10 }), 1.2);
  // Lanternfish: dark bodies that carry their own lights.
  addShoal(150, -72, 15, 0.13, new THREE.MeshBasicMaterial({ color: 0x38d8ff }), 0.7);
  addShoal(110, -112, 12, -0.09, new THREE.MeshBasicMaterial({ color: 0x7affb0 }), 0.6);

  // ---- A whale and her calf, passing through the twilight.
  const whaleSkin = new THREE.MeshLambertMaterial({ color: 0x2a4a68 });
  const makeWhale = () => {
    const g = new THREE.Group();
    const profile = [[0, 6], [0.9, 5.6], [1.6, 4.5], [2.0, 2.5], [2.1, 0.5], [1.8, -2], [1.2, -4.5], [0.6, -6.5], [0.3, -7.6]].map(([r, y]) => new THREE.Vector2(r, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 24).rotateX(Math.PI / 2), whaleSkin);
    body.scale.y = 0.85;
    const blob = (sx: number, sy: number, sz: number, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), whaleSkin);
      m.scale.set(sx, sy, sz);
      m.position.set(x, y, z);
      return m;
    };
    const tail = new THREE.Group();
    tail.position.z = -7.4;
    const left = blob(1.9, 0.14, 0.9, 1.5, 0, -0.5);
    const right = blob(1.9, 0.14, 0.9, -1.5, 0, -0.5);
    left.rotation.y = -0.5;
    right.rotation.y = 0.5;
    tail.add(left, right);
    const finL = blob(1.9, 0.12, 0.6, 2.4, -0.9, 2.4);
    const finR = blob(1.9, 0.12, 0.6, -2.4, -0.9, 2.4);
    finL.rotation.set(0, -0.4, -0.5);
    finR.rotation.set(0, 0.4, 0.5);
    g.add(body, tail, finL, finR, blob(0.12, 0.5, 0.9, 0, 1.75, -2.5));
    return { group: g, tail, fins: [finL, finR] };
  };
  const whale = makeWhale();
  const calf = makeWhale();
  calf.group.scale.setScalar(0.45);
  const lane = new THREE.Group();
  lane.add(whale.group, calf.group);
  scene.add(lane);
  let whaleClock = 10;
  let whaleCalled = false;

  // ---- Anglerfish in the black: all you see at first is the lure.
  interface Angler {
    group: THREE.Group;
    lamp: THREE.PointLight;
    lure: THREE.Mesh;
    angle: number;
    radius: number;
    y: number;
    flare: number;
  }
  const anglers: Angler[] = [];
  const hide = new THREE.MeshLambertMaterial({ color: 0x2a2030 });
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    const part = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      g.add(m);
      return m;
    };
    const ball = new THREE.SphereGeometry(1, 18, 14);
    part(ball, hide, 0, 0, 0, 0.9, 0.8, 1.2);
    part(ball, hide, 0, -0.35, 0.75, 0.62, 0.22, 0.6); // the lower jaw, hanging open
    part(new THREE.ConeGeometry(0.5, 0.8, 4), hide, 0, 0, -1.5, 0.3, 1, 1).rotation.x = -Math.PI / 2;
    const tooth = new THREE.ConeGeometry(0.035, 0.26, 5);
    const ivory = new THREE.MeshLambertMaterial({ color: 0xe8e4d0 });
    for (let k = 0; k < 9; k++) {
      const a = ((k - 4) / 4) * 1.1;
      part(tooth, ivory, Math.sin(a) * 0.55, -0.16, 0.72 + Math.cos(a) * 0.5, 1, 1, 1);
      part(tooth, ivory, Math.sin(a) * 0.5, 0.02, 0.7 + Math.cos(a) * 0.46, 1, 1, 1).rotation.x = Math.PI;
    }
    for (const sx of [1, -1]) part(ball, new THREE.MeshLambertMaterial({ color: 0xd8f0f0 }), sx * 0.5, 0.28, 0.75, 0.09, 0.09, 0.09);
    // The fishing rod growing from its head, with a light on the end.
    const rod = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.7, 0.4), new THREE.Vector3(0, 1.5, 0.9), new THREE.Vector3(0, 1.6, 1.7), new THREE.Vector3(0, 1.15, 2.1)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(rod, 16, 0.03, 6), hide));
    const lure = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), new THREE.MeshBasicMaterial({ color: 0xaef4ff }));
    lure.position.set(0, 1.12, 2.12);
    const lamp = new THREE.PointLight(0x8fe8ff, 5, 9, 1.6);
    lamp.position.copy(lure.position);
    g.add(lure, lamp);
    g.scale.setScalar(1.1 + rnd() * 0.7);
    scene.add(g);
    anglers.push({ group: g, lamp, lure, angle: rnd() * 6.28, radius: 7 + rnd() * 9, y: -118 - i * 9 - rnd() * 4, flare: 0 });
  }

  // ---- The seafloor: dark hills threaded with veins of light, and gardens of glowing stalks.
  const floorY = (x: number, z: number) => FLOOR + fbm(x * 0.03 + 9, z * 0.03 + 9, 3) * 9;
  const floorGeo = new THREE.PlaneGeometry(260, 260, 130, 130).rotateX(-Math.PI / 2);
  const fp = floorGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) fp.setY(i, floorY(fp.getX(i), fp.getZ(i)));
  floorGeo.computeVertexNormals();
  const floorUniforms = { uTime, uPulses: speckUniforms.uPulses };
  scene.add(
    new THREE.Mesh(
      floorGeo,
      new THREE.ShaderMaterial({
        uniforms: floorUniforms,
        vertexShader: `varying vec3 vW; varying vec3 vN; varying float vDist; void main() { vW = (modelMatrix * vec4(position, 1.0)).xyz; vN = normal; vec4 mv = viewMatrix * vec4(vW, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec4 uPulses[4];
          varying vec3 vW;
          varying vec3 vN;
          varying float vDist;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
          }
          float cloud(vec2 p) { return noise(p) * 0.5 + noise(p * 2.1) * 0.3 + noise(p * 4.3) * 0.2; }
          void main() {
            vec2 q = vW.xz * 0.12;
            float f = cloud(q + cloud(q * 1.7) * 1.5);
            // Fine branching lines, like veins or rivers seen from the air.
            float vein = pow(1.0 - abs(sin(f * 18.0)), 14.0);
            // Light travels along them, outward from the middle, in slow beats.
            float run = 0.3 + 0.7 * pow(0.5 + 0.5 * sin(f * 40.0 - uTime * 1.4 + length(vW.xz) * 0.08), 2.0);
            // And every wave of light in the water sets them blazing as it passes.
            for (int i = 0; i < 4; i++) {
              float age = uTime - uPulses[i].w;
              if (age > 0.0 && age < 7.0) run += smoothstep(4.0, 0.0, abs(distance(vW, uPulses[i].xyz) - age * 7.0)) * (1.0 - age / 7.0) * 2.0;
            }
            vec3 hue = mix(vec3(0.1, 0.9, 0.8), vec3(0.6, 0.3, 1.0), noise(q * 0.5));
            vec3 c = vec3(0.006, 0.014, 0.028) * (0.5 + vN.y) + hue * vein * run * 1.3;
            gl_FragColor = vec4(c * exp(-vDist * 0.026), 1.0);
          }`,
      }),
    ),
  );
  {
    const STALKS = 520;
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.06, 1, 6).translate(0, 0.5, 0), new THREE.MeshLambertMaterial({ color: 0x14202c }), STALKS);
    const tips = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial(), STALKS);
    const m = new THREE.Matrix4();
    const tint = new THREE.Color();
    const hues = [0x5affe0, 0xff6ad0, 0x8a8cff, 0xffd86a, 0x6ad0ff];
    for (let i = 0; i < STALKS; i++) {
      // They grow in clumps.
      const clump = Math.floor(rnd() * 40);
      const ca = clump * 2.4;
      const cr = 6 + ((clump * 37) % 60);
      const x = Math.cos(ca) * cr + (rnd() - 0.5) * 7;
      const z = Math.sin(ca) * cr + (rnd() - 0.5) * 7;
      const h = 0.6 + rnd() * 2.4;
      const y = floorY(x, z) - 0.1;
      stems.setMatrixAt(i, m.makeScale(1, h, 1).setPosition(x, y, z));
      tips.setMatrixAt(i, m.makeScale(1, 1, 1).setPosition(x, y + h, z));
      tips.setColorAt(i, tint.set(hues[clump % hues.length]).multiplyScalar(0.5 + rnd() * 0.5));
    }
    scene.add(stems, tips);
  }

  const pointer = { ray: new THREE.Ray(), pressed: false };
  const hit = new THREE.Vector3();
  const tintNow = new THREE.Color();
  const dummy = new THREE.Object3D();

  const ocean: Ocean = {
    scene,
    onWhale: null,
    tap(ray) {
      // A jellyfish: it flashes and jets away upward.
      let best: Jelly | null = null;
      let bestAlong = Infinity;
      for (const j of jellies) {
        const along = ray.direction.dot(hit.copy(j.group.position).sub(ray.origin));
        if (along < 0 || along > 60) continue;
        if (ray.distanceToPoint(j.group.position) < j.size * 1.6 && along < bestAlong) {
          best = j;
          bestAlong = along;
        }
      }
      if (best) {
        best.flash.value = 1;
        best.kick = 1;
        startPulse(best.group.position.x, best.group.position.y, best.group.position.z, uTime.value);
        return 'jelly';
      }
      for (const a of anglers) {
        if (ray.distanceToPoint(a.group.position) < 2.6) {
          a.flare = 1;
          return 'angler';
        }
      }
      // Open water: a wave of light spreads from the spot.
      ray.at(12, hit);
      startPulse(hit.x, hit.y, hit.z, uTime.value);
      return 'water';
    },
    point(ray, pressed) {
      pointer.ray.copy(ray);
      pointer.pressed = pressed;
    },
    update(time, dt, eye) {
      uTime.value = time;
      const t = Math.min(1, Math.max(0, -eye.y / DEEPEST));
      uDepth.value = t;
      water.position.copy(eye);
      waterColour(t, tintNow);
      fog.color.copy(tintNow);
      fog.density = mix(0.016, 0.03, t);
      sky.intensity = mix(1.7, 0.03, step01(0, 0.6, t));
      sun.intensity = mix(1.6, 0, step01(0, 0.5, t));
      speckUniforms.uScale.value = window.innerHeight;
      speckUniforms.uRayO.value.copy(pointer.ray.origin);
      speckUniforms.uRayD.value.copy(pointer.ray.direction);
      speckUniforms.uTouch.value += ((pointer.pressed ? 1 : 0.35) - speckUniforms.uTouch.value) * Math.min(1, dt * 5);

      pulses.forEach((p, i) => {
        const age = time - p.w;
        const on = age > 0 && age < 7;
        shells[i].mesh.visible = on;
        if (on) {
          shells[i].mesh.position.set(p.x, p.y, p.z);
          shells[i].mesh.scale.setScalar(Math.max(0.01, age * 7));
          shells[i].strength.value = 0.55 * (1 - age / 7) * (1 - age / 7);
        }
      });

      // Now and then a wave of light sets off somewhere in the dark, unbidden.
      nextPulse -= dt;
      if (nextPulse <= 0) {
        nextPulse = 5 + Math.random() * 5;
        const a = Math.random() * 6.28;
        const r = 6 + Math.random() * 22;
        startPulse(Math.cos(a) * r, Math.min(-35, eye.y + (Math.random() - 0.5) * 30), Math.sin(a) * r, time);
      }

      for (const j of jellies) {
        j.angle += dt * 0.012 * (j.phase > 3 ? 1 : -1);
        j.kick = Math.max(0, j.kick - dt * 0.5);
        j.flash.value = Math.max(0, j.flash.value - dt * 1.2);
        if (j.kick > 0) j.home += dt * 5 * j.kick;
        j.home = Math.min(j.home, -3);
        // Each beat of the bell lifts it a little; between beats it sinks.
        const y = j.home + Math.sin(time * 0.21 + j.phase) * 3 + Math.sin(time * 1.6 + j.phase) * 0.18;
        j.group.position.set(Math.cos(j.angle) * j.radius, y, Math.sin(j.angle) * j.radius);
        j.group.rotation.z = Math.sin(time * 0.4 + j.phase) * 0.18;
        j.group.rotation.x = Math.cos(time * 0.33 + j.phase) * 0.14;
      }
      for (const c of combs) {
        c.angle += dt * 0.03;
        c.mesh.position.set(Math.cos(c.angle) * c.radius, c.home + Math.sin(time * 0.17 + c.phase) * 4, Math.sin(c.angle) * c.radius);
        c.mesh.rotation.set(Math.sin(time * 0.2 + c.phase) * 0.5, time * 0.1 + c.phase, Math.cos(time * 0.23 + c.phase) * 0.5);
      }

      for (const s of shoals) {
        for (let i = 0; i < s.count; i++) {
          const o = s.offsets;
          const a = time * s.speed + o[i * 4] + Math.sin(time * 0.6 + i) * 0.03;
          const r = s.radius + o[i * 4 + 2] + Math.sin(a * 3 + i) * 0.6;
          dummy.position.set(Math.cos(a) * r, s.y + o[i * 4 + 1] + Math.sin(a * 2 + i * 0.3) * 1.2, Math.sin(a) * r);
          // The shoal opens round a finger held in the water.
          const along = pointer.ray.direction.dot(hit.copy(dummy.position).sub(pointer.ray.origin));
          if (along > 0) {
            const off = hit.copy(pointer.ray.origin).addScaledVector(pointer.ray.direction, along).sub(dummy.position);
            const gap = off.length();
            if (gap < 3.5 && gap > 0.001) dummy.position.addScaledVector(off, (-(3.5 - gap) / gap) * (pointer.pressed ? 1 : 0.5));
          }
          const dir = s.speed > 0 ? 1 : -1;
          dummy.rotation.set(0, -a + (dir > 0 ? Math.PI : 0) + Math.sin(time * 9 + i) * 0.12, 0);
          dummy.scale.setScalar(o[i * 4 + 3]);
          dummy.updateMatrix();
          s.mesh.setMatrixAt(i, dummy.matrix);
        }
        s.mesh.instanceMatrix.needsUpdate = true;
      }

      // The whales cross once every minute or so, each time from a new direction.
      whaleClock += dt;
      const crossing = 46;
      if (whaleClock > crossing + 22) {
        whaleClock = 0;
        whaleCalled = false;
        lane.rotation.y = Math.random() * 6.28;
      }
      const s = whaleClock / crossing;
      const x = mix(-95, 95, s);
      whale.group.position.set(x, -58 + Math.sin(time * 0.3) * 2, -27);
      calf.group.position.set(x - 10, -62 + Math.sin(time * 0.4 + 1) * 1.5, -22);
      for (const w of [whale, calf]) {
        w.group.rotation.set(Math.sin(time * 0.5) * 0.06, Math.PI / 2, 0);
        w.tail.rotation.x = Math.sin(time * 1.1) * 0.35;
        w.fins[0].rotation.z = -0.5 + Math.sin(time * 0.7) * 0.15;
        w.fins[1].rotation.z = 0.5 - Math.sin(time * 0.7) * 0.15;
      }
      if (!whaleCalled && Math.abs(x) < 40 && Math.abs(eye.y + 58) < 45) {
        whaleCalled = true;
        ocean.onWhale?.();
      }

      for (const a of anglers) {
        a.angle += dt * 0.02;
        a.flare = Math.max(0, a.flare - dt * 0.6);
        a.group.position.set(Math.cos(a.angle) * a.radius, a.y + Math.sin(time * 0.2 + a.angle) * 1.5, Math.sin(a.angle) * a.radius);
        a.group.rotation.y = -a.angle + Math.PI;
        const flicker = 0.75 + 0.25 * Math.sin(time * 5 + a.radius) * Math.sin(time * 2.3);
        a.lamp.intensity = 5 * flicker + a.flare * 26;
        a.lure.scale.setScalar(1 + a.flare * 1.6 + flicker * 0.2);
      }
    },
  };
  return ocean;
}
