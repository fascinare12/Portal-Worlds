import * as THREE from 'three';
import { fbm } from '../../src/noise';
import coralUrl from './textures/coral.webp';
import sandUrl from './textures/sand.webp';
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
  /** The sea has rung a note of its own: a jellyfish lighting up, or a wave of light in the dark. */
  onChime: ((note: number, kind: 'jelly' | 'deep') => void) | null;
  /** A tap along this ray. Returns what was touched. */
  /** `note` is which note of the scale to ring: each jellyfish has its own, big ones low. */
  tap(ray: THREE.Ray): { kind: 'jelly' | 'angler' | 'water'; note: number };
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
          vec3 col = d.y > 0.0 ? mix(ahead, above, pow(d.y, 0.7)) : mix(ahead, ahead * mix(0.3, 1.0, smoothstep(0.82, 0.95, t)), pow(-d.y, 0.6));
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
          // Near the seabed the curtains rise out of darkness, well above where the floor fades away.
          curtain *= mix(1.0, smoothstep(0.03, 0.3, d.y), smoothstep(0.82, 0.95, t));
          col += mix(vec3(0.05, 0.75, 0.7), vec3(0.4, 0.2, 0.9), 0.5 + 0.5 * sin(a * 1.5 + uTime * 0.07)) * curtain * drift * deepness * 0.11;
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  scene.add(water);

  // ---- Shafts of sunlight standing in the shallow water, which fish and turtle swim through.
  const uSun = { value: 1 };
  {
    const shaft = new THREE.CylinderGeometry(0.5, 2.6, 44, 16, 1, true).translate(0, -22, 0);
    const shaftMat = glow({
      uniforms: { uTime, uSun },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV; varying float vDown; varying float vPhase;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          vDown = -position.y / 44.0;
          vPhase = modelMatrix[3].x * 0.7 + modelMatrix[3].z * 1.3;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uSun;
        varying vec3 vN; varying vec3 vV; varying float vDown; varying float vPhase;
        void main() {
          // Brightest through its middle, nothing at its edges, so it reads as a soft column and not a tube.
          float core = pow(abs(dot(normalize(vN), normalize(vV))), 5.0);
          float fade = smoothstep(0.0, 0.08, vDown) * (1.0 - smoothstep(0.35, 1.0, vDown));
          float breathe = 0.55 + 0.45 * sin(uTime * 0.6 + vPhase) * sin(uTime * 0.37 + vPhase * 1.7);
          gl_FragColor = vec4(vec3(0.55, 0.85, 0.9) * core * fade * breathe * uSun * 0.1, 1.0);
        }`,
    });
    for (let i = 0; i < 11; i++) {
      const a = i * 2.4 + rnd();
      const r = 9 + rnd() * 26;
      const m = new THREE.Mesh(shaft, shaftMat);
      m.position.set(Math.cos(a) * r, 4, Math.sin(a) * r);
      m.rotation.set(0.16, 0, -0.2);
      m.scale.set(0.7 + rnd() * 1.1, 1, 0.7 + rnd() * 1.1);
      scene.add(m);
    }
  }

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
  // Each of the five notes has its own colour, and a wave of light takes the colour of the note it rang with.
  const NOTE_HUES = [[0.25, 0.9, 1.0], [0.3, 1.0, 0.55], [1.0, 0.78, 0.3], [1.0, 0.42, 0.72], [0.62, 0.45, 1.0]].map(([r, g, b]) => new THREE.Vector3(r, g, b));
  const pulseHues = pulses.map(() => NOTE_HUES[0].clone());
  const speckUniforms = {
    uTime,
    uScale: { value: 800 },
    uPulses: { value: pulses },
    uPulseHue: { value: pulseHues },
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
        uniform vec3 uPulseHue[4];
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
          vec3 wave = vec3(0.0);
          // Waves of light: each is a shell that swells outward from where it began.
          for (int i = 0; i < 4; i++) {
            float age = uTime - uPulses[i].w;
            if (age > 0.0 && age < 7.0) {
              float shell = abs(distance(p, uPulses[i].xyz) - age * 7.0);
              float w = smoothstep(3.4, 0.0, shell) * (1.0 - age / 7.0) * 6.0;
              lit += w * 0.25;
              wave += uPulseHue[i] * w * 0.75;
            }
          }
          // And they flare along the line of a finger.
          vec3 w = p - uRayO;
          float along = dot(w, uRayD);
          lit += smoothstep(2.4, 0.0, length(w - uRayD * along)) * step(0.0, along) * uTouch * 2.2;
          vec3 hue = mix(vec3(0.2, 0.9, 1.0), vec3(0.3, 1.0, 0.5), fract(aSeed * 7.0));
          hue = mix(hue, vec3(0.55, 0.4, 1.0), step(0.8, fract(aSeed * 13.0)));
          vCol = (mix(vec3(0.8, 0.9, 1.0) * 0.5, hue, deep) * lit + wave) * exp(-length(mv.xyz) * 0.03);
          lit += dot(wave, vec3(0.4));
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
  const shells = pulses.map((_, slot) => {
    const strength = { value: 0 };
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 28),
      glow({
        uniforms: { uStrength: strength, uHue: { value: pulseHues[slot] } },
        vertexShader: `varying vec3 vN; varying vec3 vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float uStrength; uniform vec3 uHue; varying vec3 vN; varying vec3 vV; void main() { float edge = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0); gl_FragColor = vec4(uHue * edge * uStrength, 1.0); }`,
      }),
    );
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, strength };
  });
  let nextPulse = 0;
  let pulseSlot = 0;
  const startPulse = (x: number, y: number, z: number, time: number, note = 0) => {
    pulses[pulseSlot].set(x, y, z, time);
    pulseHues[pulseSlot].copy(NOTE_HUES[note % NOTE_HUES.length]);
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
    let home = -4 - rnd() * rnd() * 135 - i * 2;
    if (home < -24 && home > -44) home -= 22; // not inside the reef's rock
    jellies.push({ group, angle: rnd() * 6.28, radius: 5 + rnd() * 22, home, size, phase, kick: 0, flash });
  }

  // ---- Comb jellies in the twilight: clear bodies with rainbows running down them.
  const combs: { mesh: THREE.Mesh; angle: number; radius: number; home: number; phase: number }[] = [];
  const combGeo = new THREE.SphereGeometry(1, 28, 20).scale(0.55, 0.85, 0.55);
  for (let i = 0; i < 14; i++) {
    const phase = rnd() * 6.28;
    const mesh = new THREE.Mesh(combGeo, glow({ uniforms: { uTime, uPhase: { value: phase }, uAmp: { value: 0.04 }, uFade: { value: 0.03 } }, vertexShader: BODY_VERT, fragmentShader: COMB_FRAG }));
    mesh.scale.setScalar(0.5 + rnd() * 0.9);
    scene.add(mesh);
    combs.push({ mesh, angle: rnd() * 6.28, radius: 4 + rnd() * 16, home: -54 - rnd() * 52, phase });
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
  const fishZ = [0.5, 0.32, 0.06, -0.24, -0.42, -0.5];
  const fishShape: THREE.Vector2[] = [0.001, 0.1, 0.14, 0.1, 0.035, 0.028].map((r, i) => new THREE.Vector2(r, fishZ[i]));
  // The body is turned on a lathe; the fins are flat, cut out by hand and joined on.
  const fishGeo = (() => {
    const body = new THREE.LatheGeometry(fishShape, 12).rotateX(Math.PI / 2).scale(0.45, 1, 1).toNonIndexed();
    const pos = [...(body.attributes.position.array as Float32Array)];
    const nor = [...(body.attributes.normal.array as Float32Array)];
    const uv = [...(body.attributes.uv.array as Float32Array)];
    // Where along the painted skin a point this far down the body falls.
    const along = (z: number) => {
      for (let i = 0; i < fishZ.length - 1; i++) if (z >= fishZ[i + 1]) return (i + (fishZ[i] - z) / (fishZ[i] - fishZ[i + 1])) / (fishZ.length - 1);
      return 0.93;
    };
    const fin = (pts: number[][], round: number) => {
      for (const [x, y, z] of pts) {
        pos.push(x, y, z);
        nor.push(x === 0 ? 1 : 0, x === 0 ? 0 : 1, 0);
        uv.push(round, z < -0.42 ? 0.93 : along(z));
      }
    };
    fin([[0, 0.12, 0.2], [0, 0.3, -0.12], [0, 0.09, -0.26]], 0.5); // on its back
    fin([[0, 0.02, -0.44], [0, 0.26, -0.78], [0, 0, -0.62]], 0.5); // the tail, forked
    fin([[0, -0.02, -0.44], [0, 0, -0.62], [0, -0.26, -0.78]], 0.5);
    fin([[0, -0.1, 0.02], [0, -0.09, -0.2], [0, -0.22, -0.16]], 0.02); // underneath
    for (const side of [1, -1]) fin([[side * 0.05, -0.03, 0.17], [side * 0.2, -0.1, 0.0], [side * 0.05, -0.08, 0.04]], 0.25); // one at each side
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  })();
  /** Makes a fish's body flex as it swims: a wave runs down it, widest at the tail. */
  const swims = <T extends THREE.Material>(m: T): T => {
    m.side = THREE.DoubleSide;
    m.customProgramCacheKey = () => 'swims';
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;').replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float beat = instanceMatrix[3].x * 2.1 + instanceMatrix[3].z * 1.7 + instanceMatrix[3].y;
        #else
          float beat = 0.0;
        #endif
        float tailward = 0.5 - position.z;
        transformed.x += sin(uTime * 7.0 + beat - position.z * 4.0) * 0.1 * tailward * tailward;`,
      );
    };
    return m;
  };
  interface Shoal {
    mesh: THREE.InstancedMesh;
    count: number;
    y: number;
    radius: number;
    speed: number;
    offsets: Float32Array;
    state: Float32Array;
  }
  const shoals: Shoal[] = [];
  // `scatter` spreads a shoal right round the reef, as reef fish live, instead of bunching it.
  const addShoal = (count: number, y: number, radius: number, speed: number, material: THREE.Material, size: number, scatter = false, geo: THREE.BufferGeometry = fishGeo) => {
    const mesh = new THREE.InstancedMesh(geo, material, count);
    mesh.frustumCulled = false;
    const offsets = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) offsets.set([(rnd() - 0.5) * (scatter ? 6.28 : 1.5), (rnd() - 0.5) * (scatter ? 3.5 : 5), (rnd() - 0.5) * (scatter ? 12 : 4), size * (0.7 + rnd() * 0.6)], i * 4);
    scene.add(mesh);
    // Each fish keeps its own place on the circle, its own pace, and how long it stays startled,
    // so one can dart ahead or wheel round while its neighbours swim on.
    const state = new Float32Array(count * 5); // angle, pace, pace wanted, time left startled, sideways dodge
    for (let i = 0; i < count; i++) state.set([offsets[i * 4], 1, 1, 0, 0], i * 5);
    shoals.push({ mesh, count, y, radius, speed, offsets, state });
  };
  const K = '#141018';
  const W = '#ffffff';
  /**
   * Paints a fish's skin: `bands` are [from, to, colour] along the body, nose (0) to tail (1).
   * Every fish is darker along its back and paler underneath, as real ones are, and has eyes.
   * `lights` gives it rows of glowing spots instead, for the fish of the dark.
   */
  const skin = (base: string, bands: [number, number, string][], lights = '') => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = base;
    g.fillRect(0, 0, 64, 128);
    for (const [from, to, colour] of bands) {
      g.fillStyle = colour;
      g.fillRect(0, 128 - to * 128, 64, (to - from) * 128);
    }
    if (lights) {
      g.fillStyle = lights;
      for (const x of [9, 55]) for (let y = 20; y < 112; y += 11) g.fillRect(x - 2, y, 4, 4);
      for (const x of [22, 42]) g.fillRect(x - 3, 106, 6, 5);
    } else {
      const shade = g.createLinearGradient(0, 0, 64, 0);
      shade.addColorStop(0, 'rgba(255,255,255,0.5)');
      shade.addColorStop(0.2, 'rgba(255,255,255,0)');
      shade.addColorStop(0.5, 'rgba(0,12,36,0.42)');
      shade.addColorStop(0.8, 'rgba(255,255,255,0)');
      shade.addColorStop(1, 'rgba(255,255,255,0.5)');
      g.fillStyle = shade;
      g.fillRect(0, 0, 64, 128);
      for (const x of [20, 44]) {
        g.fillStyle = W;
        g.beginPath();
        g.ellipse(x, 113, 5, 3.4, 0, 0, 6.3);
        g.fill();
        g.fillStyle = K;
        g.beginPath();
        g.ellipse(x, 113.5, 2.8, 2, 0, 0, 6.3);
        g.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const livery = (base: string, bands: [number, number, string][], emissive = 0x262626) => swims(new THREE.MeshLambertMaterial({ map: skin(base, bands), emissive }));
  addShoal(170, -9, 13, 0.16, livery('#c4dcea', [[0.9, 1, '#8fb0c4']], 0x1a3a4a), 1.5);
  addShoal(120, -20, 19, -0.11, livery('#ffc070', [[0.9, 1, '#e08a3a']], 0x402a10), 1.2);
  // Reef fish: nine kinds, each with its own shape and markings, living all round the coral.
  const tallFish = fishGeo.clone().scale(1, 2.3, 0.85); // disc-shaped, like a butterflyfish
  const longFish = fishGeo.clone().scale(0.9, 0.75, 1.5); // slender, like a wrasse
  // Clownfish: orange with three white bars edged in black.
  addShoal(46, -29.4, 12, 0.05, livery('#ff7a1f', [[0.16, 0.19, K], [0.19, 0.27, W], [0.27, 0.3, K], [0.46, 0.49, K], [0.49, 0.57, W], [0.57, 0.6, K], [0.76, 0.79, K], [0.79, 0.85, W], [0.9, 1, K]]), 0.5, true);
  // Blue tang: royal blue, a black sweep along the body, and a yellow tail.
  addShoal(40, -27.5, 17, -0.07, livery('#1f5fe0', [[0.3, 0.62, '#10204a'], [0.8, 1, '#ffd21f']]), 0.85, true);
  // Butterflyfish: yellow discs with a black bar through the eye.
  addShoal(44, -28.6, 15, 0.06, livery('#ffd83a', [[0.1, 0.17, K], [0.72, 0.78, W], [0.86, 0.9, K]]), 0.6, true, tallFish);
  // Bannerfish: tall, in bold bars of black and white, with a yellow tail.
  addShoal(30, -27, 22, -0.045, livery(W, [[0.0, 0.12, K], [0.3, 0.46, K], [0.62, 0.76, K], [0.84, 1, '#ffd21f']]), 0.75, true, tallFish);
  // Parrotfish: big, shading from sea green through to rose.
  addShoal(26, -28, 20, 0.04, livery('#2fc0a8', [[0.0, 0.2, '#3a8ff0'], [0.45, 0.7, '#7ad0a0'], [0.7, 0.88, '#ff8ab0'], [0.88, 1, '#ffd070']]), 1.25, true);
  // Damselfish: tiny sparks of electric blue, in great numbers.
  addShoal(120, -28.8, 11, 0.09, livery('#2a9cff', [[0.82, 1, '#ffe14a']]), 0.32, true);
  // Sergeant majors: silver-yellow with five black bars.
  addShoal(50, -26.5, 18, -0.06, livery('#f4ec9a', [[0.14, 0.2, K], [0.3, 0.36, K], [0.46, 0.52, K], [0.62, 0.68, K], [0.78, 0.83, K]]), 0.6, true);
  // Anthias: small, rose and orange, hovering in clouds.
  addShoal(110, -27.8, 14, 0.075, livery('#ff6a8a', [[0.0, 0.25, '#ff9a3a'], [0.85, 1, '#c84ad0']]), 0.36, true);
  // Wrasse: long and slim, green with a violet head.
  addShoal(34, -29.2, 16, -0.08, livery('#3fc070', [[0.0, 0.24, '#8a5ad0'], [0.5, 0.56, '#ffe14a'], [0.9, 1, '#2f7fd0']]), 0.9, true, longFish);
  // Lanternfish: dark bodies that carry their own lights.
  addShoal(150, -72, 15, 0.13, swims(new THREE.MeshBasicMaterial({ map: skin('#0a2632', [], '#7cf0ff') })), 0.8);
  addShoal(110, -112, 12, -0.09, swims(new THREE.MeshBasicMaterial({ map: skin('#0a2a20', [], '#9affc4') })), 0.7);

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

  // ---- A sea turtle over the reef, and two manta rays in the blue below it.
  const ball = (mat: THREE.Material, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    return m;
  };
  const turtle = (() => {
    const g = new THREE.Group();
    // The shell: plates of olive and brown, with pale seams between them.
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const cg = c.getContext('2d')!;
    cg.fillStyle = '#c9b87a';
    cg.fillRect(0, 0, 128, 128);
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        cg.fillStyle = ['#4f5a2c', '#6a5a2a', '#5a6a34', '#7a6232'][(row * 3 + col * 5) % 4];
        cg.beginPath();
        cg.ellipse(col * 21 + (row % 2) * 10.5, row * 24 + 8, 9, 10.5, 0, 0, 6.3);
        cg.fill();
      }
    }
    const plates = new THREE.CanvasTexture(c);
    plates.colorSpace = THREE.SRGBColorSpace;
    plates.wrapS = THREE.RepeatWrapping;
    const shellMat = new THREE.MeshLambertMaterial({ map: plates, emissive: 0x141a10 });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0x8fa66a, emissive: 0x141a10 });
    g.add(ball(shellMat, 0.85, 0.36, 1.1), ball(skinMat, 0.8, 0.16, 1.02, 0, -0.14, 0));
    g.add(ball(skinMat, 0.24, 0.2, 0.3, 0, 0.02, 1.3), ball(skinMat, 0.1, 0.08, 0.3, 0, -0.08, -1.15));
    const flippers = [1, -1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.6, -0.05, 0.6);
      pivot.add(ball(skinMat, 0.75, 0.05, 0.26, side * 0.7, 0, 0.1));
      pivot.rotation.y = side * -0.5;
      g.add(pivot, ball(skinMat, 0.3, 0.04, 0.16, side * 0.6, -0.1, -0.95));
      return pivot;
    });
    g.scale.setScalar(1.5);
    scene.add(g);
    return { group: g, flippers };
  })();
  const mantas = [0, 1].map((n) => {
    const g = new THREE.Group();
    const back = new THREE.MeshLambertMaterial({ color: 0x2a3c54, emissive: 0x08101c });
    const pale = new THREE.MeshLambertMaterial({ color: 0xd8e4ee, emissive: 0x101820 });
    g.add(ball(back, 1.0, 0.24, 1.3), ball(pale, 0.92, 0.14, 1.2, 0, -0.14, 0));
    // The horns either side of its mouth, and a whip of a tail.
    for (const side of [1, -1]) g.add(ball(back, 0.12, 0.1, 0.4, side * 0.45, -0.02, 1.35));
    const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.008, 3.4, 6).rotateX(Math.PI / 2), back);
    whip.position.z = -2.8;
    g.add(whip);
    // Each wing is a flat triangle with a swept-back tip, hinged where it meets the body.
    const wings = [1, -1].map((side) => {
      const shape = new THREE.Shape();
      shape.moveTo(0, 1.15);
      shape.quadraticCurveTo(1.6, 0.9, 3.1, -0.5);
      shape.quadraticCurveTo(1.5, -0.55, 0, -1.1);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 10 }).rotateX(Math.PI / 2).translate(0, 0.05, 0);
      if (side < 0) geo.scale(-1, 1, 1);
      const wing = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x2a3c54, emissive: 0x08101c, side: THREE.DoubleSide }));
      const pivot = new THREE.Group();
      pivot.position.x = side * 0.7;
      pivot.add(wing);
      g.add(pivot);
      return pivot;
    });
    g.scale.setScalar(n ? 1.1 : 1.5);
    scene.add(g);
    return { group: g, wings, lag: n * 0.5 };
  });

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
  // Level in the middle, where she comes to rest, with hills rising round it.
  const floorY = (x: number, z: number) => FLOOR + fbm(x * 0.03 + 9, z * 0.03 + 9, 3) * 9 * step01(4, 30, Math.hypot(x, z));
  const floorGeo = new THREE.PlaneGeometry(260, 260, 130, 130).rotateX(-Math.PI / 2);
  const fp = floorGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) fp.setY(i, floorY(fp.getX(i), fp.getZ(i)));
  floorGeo.computeVertexNormals();
  // Where the fire vents stand, so the rock round them can crack and glow.
  const hotSpots = [0, 1, 2, 3].map(() => new THREE.Vector3(0, -9999, 0));
  const floorUniforms = { uTime, uPulses: speckUniforms.uPulses, uPulseHue: speckUniforms.uPulseHue, uHot: { value: hotSpots } };
  const floorMat = new THREE.ShaderMaterial({
        uniforms: floorUniforms,
        vertexShader: `varying vec3 vW; varying vec3 vN; varying float vDist; void main() {
          #ifdef USE_INSTANCING
            vW = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
          #else
            vW = (modelMatrix * vec4(position, 1.0)).xyz;
          #endif
          vN = normal; vec4 mv = viewMatrix * vec4(vW, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec4 uPulses[4];
          uniform vec3 uPulseHue[4];
          uniform vec3 uHot[4];
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
            vec3 hue = mix(vec3(0.1, 0.9, 0.8), vec3(0.6, 0.3, 1.0), noise(q * 0.5));
            vec3 lightUp = hue * run;
            for (int i = 0; i < 4; i++) {
              float age = uTime - uPulses[i].w;
              if (age > 0.0 && age < 7.0) lightUp += uPulseHue[i] * smoothstep(4.0, 0.0, abs(distance(vW, uPulses[i].xyz) - age * 7.0)) * (1.0 - age / 7.0) * 2.0;
            }
            // The stone itself: mottled, pitted and finely cracked. It shows only by the faint light
            // she carries with her, so the ground close by has grain and the distance stays dark.
            float grain = cloud(vW.xz * 1.1 + vW.y * 0.8);
            float pits = noise(vW.xz * 7.0 + vW.y * 4.0);
            float crack = pow(1.0 - abs(sin(cloud(vW.xz * 0.7 + vW.y * 0.6 + 3.0) * 24.0)), 9.0);
            vec3 stone = mix(vec3(0.05, 0.065, 0.09), vec3(0.2, 0.19, 0.2), grain) * (0.7 + 0.35 * pits) * (1.0 - crack * 0.7);
            float lamp = exp(-distance(vW, cameraPosition) * 0.075) * 1.05;
            vec3 c = vec3(0.006, 0.014, 0.028) * (0.5 + vN.y) + stone * lamp * (0.45 + 0.55 * clamp(vN.y, 0.0, 1.0)) + lightUp * vein * 1.3;
            // Round the fire vents the rock is split by seams of slow, breathing heat.
            float heat = 0.0;
            for (int i = 0; i < 4; i++) heat += smoothstep(11.0, 1.5, distance(vW.xz, uHot[i].xz)) * smoothstep(9.0, 0.0, abs(vW.y - uHot[i].y));
            float seam = pow(1.0 - abs(sin(cloud(vW.xz * 0.5 + vW.y * 0.4 + 7.0) * 15.0)), 7.0);
            c += vec3(1.5, 0.4, 0.05) * seam * heat * (0.55 + 0.45 * sin(uTime * 1.3 + f * 30.0));
            // With distance the floor dissolves into exactly the colour of the dark water beyond it,
            // so there is no edge to see where it ends.
            gl_FragColor = vec4(mix(vec3(0.0, 0.004, 0.014), c, exp(-vDist * 0.03)), 1.0);
          }`,
      });
  scene.add(new THREE.Mesh(floorGeo, floorMat));
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


  // ================= The coral reef: a first floor, about thirty units down =================
  // It rings a "blue hole": she settles among the coral, then sinks on through the opening.
  const REEF = -32;
  const HOLE = 7;
  /** The edge of the hole is not a clean circle: it bulges and bites in as it goes round. */
  const holeR = (a: number) => HOLE * (1 + 0.15 * Math.sin(a * 2 + 0.6) + 0.1 * Math.sin(a * 3 + 2.1) + 0.06 * Math.sin(a * 5 + 4.2) + 0.03 * Math.sin(a * 9 + 1.3));
  const reefY = (x: number, z: number) => REEF + fbm(x * 0.06 + 3, z * 0.06 + 3, 3) * 3.5 + step01(10, 46, Math.hypot(x, z)) * 5;
  const CAUSTIC = /* glsl */ `
    // The net of light that the waves throw onto everything beneath them.
    float caustic(vec2 p, float t) {
      float c = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 q = p * (0.35 + fi * 0.22) + vec2(t * 0.25 * (fi + 1.0), -t * 0.2);
        c += abs(sin(q.x + sin(q.y * 1.3 + t * 0.4)) * sin(q.y + sin(q.x * 1.1 - t * 0.3)));
      }
      return pow(1.0 - c / 3.0, 4.0) * 3.0;
    }`;
  const SURFACES = [
    // 0: brain coral, a maze of winding grooves
    `float g = sin(vWp.x * 15.0 + sin(vWp.z * 11.0 + vWp.y * 8.0) * 2.2) * sin(vWp.z * 15.0 + sin(vWp.y * 11.0 + vWp.x * 8.0) * 2.2);
     float pat = 0.68 + 0.4 * smoothstep(-0.7, 0.7, g);`,
    // 1: polyps, a skin of small pale dots
    `float pat = 0.72 + 0.6 * smoothstep(0.34, 0.1, length(fract(vWp * 5.0) - 0.5));`,
    // 2: cup coral: fine ridges fanning out from its centre, crossed by growth rings, paler at the rim
    `float reach = length(vLp.xz);
     float pat = 0.66 + 0.3 * sin(atan(vLp.z, vLp.x) * 44.0 + sin(reach * 9.0) * 1.5) + 0.1 * sin(reach * 38.0) + 0.3 * smoothstep(0.75, 1.05, reach);`,
    // 3: sand, in ripples, with scattered grains
    `float ripple = sin(vWp.x * 3.0 + sin(vWp.z * 1.3) * 2.0 + sin(vWp.z * 0.31 + vWp.x * 0.17) * 3.0);
     // Each ripple has a lit side and a shaded side, and finer ripples ride on its back.
     float pat = 0.84 + 0.15 * ripple + 0.07 * smoothstep(0.2, 1.0, ripple) * sin(vWp.x * 13.0 + vWp.z * 6.0 + sin(vWp.z * 4.0) * 2.0)
       + 0.14 * step(0.965, fract(sin(dot(floor(vWp.xz * 9.0), vec2(12.9898, 78.233))) * 43758.5453))
       - 0.12 * step(0.985, fract(sin(dot(floor(vWp.xz * 5.0), vec2(39.3, 11.1))) * 24634.63));`,
    // 4: plain
    `float pat = 1.0;`,
  ];
  const photo = (url: string) => {
    const t = new THREE.TextureLoader().load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const coralPhoto = photo(coralUrl);
  const sandPhoto = photo(sandUrl);
  /**
   * A lit material with one of those surfaces painted on, moving light from the waves, and an
   * optional sway. `detail` lays a photograph over it: pitted coral rock, or real sand.
   */
  const reefMat = (surface: number, opts: THREE.MeshLambertMaterialParameters = {}, sway = 0, detail: 'coral' | 'sand' | 'none' = 'coral') => {
    const m = new THREE.MeshLambertMaterial(opts);
    m.customProgramCacheKey = () => `reef:${surface}:${sway}:${detail}`;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.uniforms.uDetail = { value: detail === 'sand' ? sandPhoto : coralPhoto };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWp;\nvarying vec3 vLp;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vLp = position; // where on the object itself, so a pattern can be centred on it
          #ifdef USE_INSTANCING
            float swayPhase = instanceMatrix[3].x * 1.3 + instanceMatrix[3].z * 1.7;
            float bend = position.y * position.y * ${sway.toFixed(3)};
            transformed.x += sin(uTime * 1.3 + swayPhase) * bend;
            transformed.z += cos(uTime * 1.1 + swayPhase) * bend * 0.6;
            vWp = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
          #else
            vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;
          #endif`,
        );
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform float uTime;\nuniform sampler2D uDetail;\nvarying vec3 vWp;\nvarying vec3 vLp;\n${CAUSTIC}`)
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          ${SURFACES[surface]}
          ${
            detail === 'sand'
              ? 'diffuseColor.rgb *= texture2D(uDetail, vWp.xz * 0.11).rgb * 1.25;'
              : detail === 'coral'
                ? // The photograph is laid on from the side and from above, so it wraps any shape without seams showing.
                  'float pits = mix(texture2D(uDetail, vWp.xz * 0.42).r, texture2D(uDetail, vec2(vWp.x + vWp.z, vWp.y) * 0.42).r, 0.5); diffuseColor.rgb *= 0.45 + pits * 0.95;'
                : ''
          }
          diffuseColor.rgb *= pat * (0.74 + caustic(vWp.xz, uTime) * 0.42);
          ${surface < 3 ? '// Living coral lets light into its skin: its edges glow a little against the water.\n          diffuseColor.rgb *= 1.0 + pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.5) * 0.6;' : ''}`,
        );
    };
    return m;
  };

  // The reef bed: a wide ring of rippled sand, with the hole in its middle.
  {
    const rings = 56;
    const around = 96;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= rings; i++) {
      for (let k = 0; k <= around; k++) {
        const a = (k / around) * Math.PI * 2;
        const r = holeR(a) + Math.pow(i / rings, 1.7) * 150;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        pos.push(x, reefY(x, z), z);
      }
    }
    for (let i = 0; i < rings; i++) {
      for (let k = 0; k < around; k++) {
        const a = i * (around + 1) + k;
        idx.push(a, a + 1, a + around + 1, a + 1, a + around + 2, a + around + 1);
      }
    }
    const bed = new THREE.BufferGeometry();
    bed.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    bed.setIndex(idx);
    bed.computeVertexNormals();
    scene.add(new THREE.Mesh(bed, reefMat(3, { color: 0xffffff }, 0, 'sand')));
    // The throat of the hole, and the dark underside of the reef seen from below.
    // A short throat of dark rock: its top meets the sand, and it opens out below.
    const throat = new THREE.Mesh(new THREE.CylinderGeometry(HOLE, HOLE * 1.15, 9, 56, 1, true), reefMat(3, { color: 0x3c4650, side: THREE.BackSide }));
    throat.position.y = REEF + 1.2 - 4.5;
    // Both follow the hole's ragged outline.
    const ragged = (g: THREE.BufferGeometry, within: number) => {
      const gp = g.attributes.position;
      for (let i = 0; i < gp.count; i++) {
        const x = gp.getX(i);
        const z = gp.getZ(i);
        if (Math.hypot(x, z) > within) continue;
        const f = holeR(Math.atan2(z, x)) / HOLE;
        gp.setX(i, x * f);
        gp.setZ(i, z * f);
      }
      g.computeVertexNormals();
    };
    ragged(throat.geometry, 20);
    const under = new THREE.Mesh(new THREE.RingGeometry(HOLE * 1.15, 150, 64, 1).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x04121e }));
    ragged(under.geometry, 20);
    under.position.y = REEF + 1.2 - 9;
    scene.add(throat, under);
  }

  {
    // Real reefs are mostly tans, rusts and olives, with the vivid colours as accents among them.
    const CORAL = [0xff6f91, 0xff9671, 0xffc75f, 0xf9f871, 0x9a6ee0, 0x00c9a7, 0xd65db1, 0x3a8ff0, 0xff8066, 0xf4f0e6, 0xc9a27a, 0xb8865a, 0x8a9a5a, 0xd88a6a, 0xc9a27a, 0xe0c090];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const tint = new THREE.Color();
    /** A place on the reef, more often near the hole, where she will be looking. */
    const place = (inner = 8.5, reach = 40): [number, number, number] => {
      const a = rnd() * Math.PI * 2;
      const r = holeR(a) + inner - HOLE + Math.pow(rnd(), 1.6) * reach;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      return [x, reefY(x, z), z];
    };
    const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, count: number) => {
      const mesh = new THREE.InstancedMesh(geo, mat, count);
      mesh.frustumCulled = false;
      scene.add(mesh);
      return mesh;
    };
    const set = (mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0, colour?: number) => {
      mesh.setMatrixAt(i, m.compose(v.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), sc.set(sx, sy, sz)));
      if (colour !== undefined) mesh.setColorAt(i, tint.set(colour));
    };

    // Brain corals: great rounded boulders, grooved like a maze.
    const brains = instanced(new THREE.SphereGeometry(1, 24, 16), reefMat(0), 150);
    for (let i = 0; i < 150; i++) {
      const [x, y, z] = place();
      const k = 0.5 + rnd() * 1.4;
      set(brains, i, x, y + k * 0.2, z, k, k * 0.7, k, 0, rnd() * 6.28, 0, pick(CORAL));
    }

    // Staghorn: thickets of branching fingers.
    const BRANCHES = 9;
    const stags = instanced(new THREE.ConeGeometry(0.1, 1, 6).translate(0, 0.5, 0), reefMat(1), 240 * BRANCHES);
    for (let i = 0; i < 240; i++) {
      const [x, y, z] = place();
      const colour = pick(CORAL);
      const k = 0.7 + rnd() * 0.9;
      for (let b = 0; b < BRANCHES; b++) set(stags, i * BRANCHES + b, x + (rnd() - 0.5) * 0.5 * k, y - 0.05, z + (rnd() - 0.5) * 0.5 * k, k, k * (0.6 + rnd() * 1.1), k, (rnd() - 0.5) * 1.3, rnd() * 6.28, (rnd() - 0.5) * 1.3, colour);
    }

    // Cup corals: wide, ridged bowls on short stalks.
    // Each is a shallow cup that opens upward from a narrow foot, its rim rising and falling in waves.
    const cup = new THREE.LatheGeometry([[0.1, 0], [0.24, 0.16], [0.5, 0.32], [0.8, 0.43], [1.0, 0.5], [1.06, 0.58]].map(([r, y]) => new THREE.Vector2(r, y)), 40);
    {
      const cp = cup.attributes.position;
      for (let i = 0; i < cp.count; i++) {
        const x = cp.getX(i);
        const z = cp.getZ(i);
        const r = Math.hypot(x, z);
        const a = Math.atan2(z, x);
        const wave = 1 + 0.09 * Math.sin(a * 3 + 0.7) * r + 0.04 * Math.sin(a * 7) * r;
        cp.setXYZ(i, x * wave, cp.getY(i) + (Math.sin(a * 5) * 0.07 + Math.sin(a * 2 + 1) * 0.05) * r * r, z * wave);
      }
      cup.computeVertexNormals();
    }
    const plates = instanced(cup, reefMat(2, { side: THREE.DoubleSide }), 120);
    const stalks = instanced(new THREE.CylinderGeometry(0.16, 0.26, 1, 8).translate(0, 0.5, 0), reefMat(4), 120);
    for (let i = 0; i < 120; i++) {
      const [x, y, z] = place();
      const k = 0.7 + rnd() * 1.5;
      const h = 0.35 + rnd() * 0.9;
      const colour = pick(CORAL);
      set(stalks, i, x, y - 0.1, z, k * 0.8, h + 0.1, k * 0.8, 0, 0, 0, colour);
      set(plates, i, x, y + h - 0.05, z, k, k * (0.7 + rnd() * 0.7), k, (rnd() - 0.5) * 0.3, rnd() * 6.28, (rnd() - 0.5) * 0.3, colour);
    }

    // Cauliflower coral: tight heads of small rounded lobes.
    const LOBES = 7;
    const heads = instanced(new THREE.SphereGeometry(1, 12, 9), reefMat(1), 130 * LOBES);
    for (let i = 0; i < 130; i++) {
      const [x, y, z] = place();
      const colour = pick(CORAL);
      const k = 0.25 + rnd() * 0.3;
      for (let b = 0; b < LOBES; b++) {
        const a = (b / LOBES) * 6.28;
        const out = b === 0 ? 0 : k * 1.1;
        set(heads, i * LOBES + b, x + Math.cos(a) * out, y + k * (b === 0 ? 1.1 : 0.5), z + Math.sin(a) * out, k, k * 0.9, k, 0, 0, 0, colour);
      }
    }

    // Pillar coral: stands of tall rounded columns.
    const COLUMNS = 5;
    const pillars = instanced(new THREE.CapsuleGeometry(0.2, 1, 5, 10).translate(0, 0.6, 0), reefMat(0), 70 * COLUMNS);
    for (let i = 0; i < 70; i++) {
      const [x, y, z] = place();
      const colour = pick(CORAL);
      for (let b = 0; b < COLUMNS; b++) {
        const k = 0.7 + rnd() * 0.8;
        set(pillars, i * COLUMNS + b, x + (rnd() - 0.5) * 0.9, y - 0.2, z + (rnd() - 0.5) * 0.9, k, 0.8 + rnd() * 2.2, k, (rnd() - 0.5) * 0.2, 0, (rnd() - 0.5) * 0.2, colour);
      }
    }

    // Tube sponges: clusters of open pipes.
    const tubes = instanced(new THREE.CylinderGeometry(0.17, 0.12, 1, 12, 1, true).translate(0, 0.5, 0), reefMat(1, { side: THREE.DoubleSide }), 120 * 4);
    for (let i = 0; i < 120; i++) {
      const [x, y, z] = place();
      const colour = pick([0xffc75f, 0xb07cff, 0xff8066, 0x39c8ff]);
      for (let b = 0; b < 4; b++) {
        const k = 0.7 + rnd() * 0.8;
        set(tubes, i * 4 + b, x + (rnd() - 0.5) * 0.7, y - 0.05, z + (rnd() - 0.5) * 0.7, k, 0.8 + rnd() * 1.6, k, (rnd() - 0.5) * 0.3, 0, (rnd() - 0.5) * 0.3, colour);
      }
    }

    // Anemones: rings of soft tentacles, waving in the current.
    const ARMS = 16;
    const arms = instanced(new THREE.CylinderGeometry(0.03, 0.055, 1, 5).translate(0, 0.5, 0), reefMat(4, { emissive: 0x181018 }, 0.3, 'none'), 110 * ARMS);
    for (let i = 0; i < 110; i++) {
      const [x, y, z] = place();
      const colour = pick([0xff5aa0, 0xffd0e8, 0x8cffd0, 0xffb05a, 0xc9a2ff]);
      for (let b = 0; b < ARMS; b++) {
        const a = (b / ARMS) * 6.28;
        const ring = 0.1 + (b % 2) * 0.12;
        set(arms, i * ARMS + b, x + Math.cos(a) * ring, y, z + Math.sin(a) * ring, 1, 0.5 + rnd() * 0.5, 1, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5, colour);
      }
    }

    // Sea fans: flat lace, drawn branch by branch, swaying.
    const lace = document.createElement('canvas');
    lace.width = lace.height = 256;
    const lg = lace.getContext('2d')!;
    lg.strokeStyle = '#ffffff';
    lg.lineCap = 'round';
    const branch = (x: number, y: number, angle: number, len: number, width: number) => {
      if (len < 7) return;
      const x2 = x + Math.sin(angle) * len;
      const y2 = y - Math.cos(angle) * len;
      lg.lineWidth = width;
      lg.beginPath();
      lg.moveTo(x, y);
      lg.lineTo(x2, y2);
      lg.stroke();
      branch(x2, y2, angle - 0.42 - rnd() * 0.15, len * 0.76, width * 0.72);
      branch(x2, y2, angle + 0.42 + rnd() * 0.15, len * 0.76, width * 0.72);
      if (rnd() < 0.5) branch(x2, y2, angle + (rnd() - 0.5) * 0.3, len * 0.7, width * 0.7);
    };
    branch(128, 254, 0, 58, 9);
    const laceMap = new THREE.CanvasTexture(lace);
    const fans = instanced(new THREE.PlaneGeometry(1, 1, 1, 6).translate(0, 0.5, 0), reefMat(4, { map: laceMap, alphaTest: 0.35, side: THREE.DoubleSide, emissive: 0x201018 }, 0.1, 'none'), 130);
    for (let i = 0; i < 130; i++) {
      const [x, y, z] = place();
      const k = 1.2 + rnd() * 2.2;
      set(fans, i, x, y - 0.1, z, k, k, k, 0, rnd() * 6.28, 0, pick([0xff5a7a, 0xb07cff, 0xffa53a, 0xff8ad8]));
    }

    // Rubble: worn pebbles and bits of broken coral lying on the sand between the heads.
    const pebbles = instanced(new THREE.IcosahedronGeometry(1, 1), reefMat(4, { flatShading: false }), 420);
    for (let i = 0; i < 420; i++) {
      const [x, y, z] = place(7.6, 46);
      const k = 0.07 + rnd() * rnd() * 0.42;
      set(pebbles, i, x, y + k * 0.2, z, k * (0.8 + rnd() * 0.8), k * (0.4 + rnd() * 0.4), k * (0.8 + rnd() * 0.8), rnd(), rnd() * 6.28, rnd(), pick([0xcfc4ae, 0x9a948a, 0xe8dcc4, 0x7f7a74, 0xd8b8a0, 0xf2ece0]));
    }

    // Seagrass in drifts, and starfish on the sand.
    const grass = instanced(new THREE.PlaneGeometry(0.13, 1, 1, 5).translate(0, 0.5, 0), reefMat(4, { side: THREE.DoubleSide }, 0.55, 'none'), 1800);
    for (let i = 0; i < 1800; i++) {
      const patch = Math.floor(rnd() * 26);
      const pa = patch * 2.4;
      const pr = 9 + ((patch * 13) % 34);
      const x = Math.cos(pa) * pr + (rnd() - 0.5) * 6;
      const z = Math.sin(pa) * pr + (rnd() - 0.5) * 6;
      if (Math.hypot(x, z) < holeR(Math.atan2(z, x)) + 1) continue;
      set(grass, i, x, reefY(x, z) - 0.05, z, 1, 0.8 + rnd() * 1.7, 1, 0, rnd() * 6.28, 0, pick([0x3fae6a, 0x6fd07a, 0x2f9a6a]));
    }
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.14 : 0.36;
      const a = (i / 10) * Math.PI * 2;
      if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const stars = instanced(new THREE.ExtrudeGeometry(star, { depth: 0.07, bevelEnabled: false }).rotateX(-Math.PI / 2), reefMat(1), 90);
    for (let i = 0; i < 90; i++) {
      const [x, y, z] = place(8.5, 30);
      const k = 0.7 + rnd() * 0.9;
      set(stars, i, x, y + 0.04, z, k, 1, k, 0, rnd() * 6.28, 0, pick([0xff7a3a, 0xff4f6a, 0xb07cff, 0xffc75f]));
    }
  }

  // ================= More on the deep floor =================
  {
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const sc = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const tint = new THREE.Color();
    // Spires of rock, veined with the same light as the floor they rise from.
    // Rock worn lumpy and blunt: no clean cones, no points.
    const lumpy = (g: THREE.BufferGeometry, amount: number) => {
      const gp = g.attributes.position;
      for (let i = 0; i < gp.count; i++) {
        const x = gp.getX(i);
        const y = gp.getY(i);
        const z = gp.getZ(i);
        const a = Math.atan2(z, x);
        const f = 1 + amount * (Math.sin(a * 3 + y * 7) + 0.6 * Math.sin(a * 5 - y * 13 + 2));
        gp.setX(i, x * f);
        gp.setZ(i, z * f);
      }
      g.computeVertexNormals();
      return g;
    };
    const turned = (profile: number[][], around: number) => new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), around);
    const spires = new THREE.InstancedMesh(lumpy(turned([[1, 0], [0.82, 0.3], [0.7, 0.6], [0.6, 0.82], [0.46, 0.94], [0.25, 1], [0.001, 1.01]], 10), 0.09), floorMat, 54);
    spires.frustumCulled = false;
    for (let i = 0; i < 54; i++) {
      const a = rnd() * 6.28;
      const r = 13 + rnd() * 80;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      spires.setMatrixAt(i, m.compose(v.set(x, floorY(x, z) - 0.5, z), q.identity(), sc.set(0.8 + rnd() * 2, 3 + rnd() * 10, 0.8 + rnd() * 2)));
    }
    scene.add(spires);

    // Vents: blunt, open-mouthed chimneys ringed with tube worms. A few have fire in their throats;
    // most only smoke, pouring out slow grey billows.
    const VENTS = 10;
    const hot = (i: number) => i % 3 === 0;
    const PUFFS = 80;
    const WORMS = 46;
    const chimney = lumpy(turned([[1.5, 0], [1.1, 1.5], [0.9, 3], [0.78, 4.2], [0.86, 4.75], [0.8, 5], [0.6, 5.02], [0.45, 4.7], [0.4, 4.2]], 16), 0.05);
    const chimneys = new THREE.InstancedMesh(chimney, floorMat, VENTS);
    const throats = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.6, 0.12) }), VENTS);
    const wormTubes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.065, 1, 6).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: 0x4a4c48 }), VENTS * WORMS);
    const wormPlumes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3a3a }), VENTS * WORMS);
    const base = new Float32Array(VENTS * PUFFS * 3);
    const puffSeed = new Float32Array(VENTS * PUFFS);
    const puffKind = new Float32Array(VENTS * PUFFS); // 0 = fire-lit, 1 = smoke
    for (let i = 0; i < VENTS; i++) {
      const a = (i / VENTS) * 6.28 + rnd();
      const r = 11 + rnd() * 20;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = floorY(x, z) - 0.3;
      const k = 0.8 + rnd() * 0.7;
      const tall = k * (0.6 + rnd() * 0.7);
      chimneys.setMatrixAt(i, m.compose(v.set(x, y, z), q.setFromAxisAngle(v2.set(0, 1, 0), rnd() * 6.28), sc.set(k, tall, k)));
      const fire = hot(i) ? k : 0; // a smoking vent's throat is dark
      if (hot(i)) hotSpots[i / 3].set(x, y, z);
      throats.setMatrixAt(i, m.compose(v.set(x, y + 4.6 * tall, z), q.identity(), sc.set(fire, fire, fire)));
      for (let p = 0; p < PUFFS; p++) {
        base.set([x, y + 4.9 * tall, z], (i * PUFFS + p) * 3);
        puffSeed[i * PUFFS + p] = rnd();
        puffKind[i * PUFFS + p] = hot(i) ? 0 : 1;
      }
      for (let w = 0; w < WORMS; w++) {
        const wa = rnd() * 6.28;
        const wr = 1.5 * k + rnd() * 2.6;
        const wx = x + Math.cos(wa) * wr;
        const wz = z + Math.sin(wa) * wr;
        const h = 0.5 + rnd() * 1.6;
        const wy = floorY(wx, wz) - 0.1;
        wormTubes.setMatrixAt(i * WORMS + w, m.compose(v.set(wx, wy, wz), q.identity(), sc.set(1, h, 1)));
        wormPlumes.setMatrixAt(i * WORMS + w, m.compose(v.set(wx, wy + h + 0.05, wz), q.identity(), sc.set(1, 1.8, 1)));
      }
    }
    for (const mesh of [chimneys, throats, wormTubes, wormPlumes]) {
      mesh.frustumCulled = false;
      scene.add(mesh);
    }
    const plumeGeo = new THREE.BufferGeometry();
    plumeGeo.setAttribute('position', new THREE.BufferAttribute(base, 3));
    plumeGeo.setAttribute('aSeed', new THREE.BufferAttribute(puffSeed, 1));
    plumeGeo.setAttribute('aKind', new THREE.BufferAttribute(puffKind, 1));
    const plume = new THREE.Points(
      plumeGeo,
      glow({
        uniforms: { uTime, uScale: speckUniforms.uScale },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          attribute float aKind;
          uniform float uTime;
          uniform float uScale;
          varying vec3 vCol;
          void main() {
            // Smoke climbs more slowly than fire-lit water, and billows wider.
            float t = fract(uTime * mix(0.11, 0.06, aKind) + aSeed);
            float wide = mix(1.8, 3.4, aKind);
            vec3 p = position + vec3(sin(aSeed * 40.0 + t * 6.0) * t * wide, t * mix(15.0, 19.0, aKind), cos(aSeed * 31.0 + t * 5.0) * t * wide);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            // Fire: hot and orange at the mouth, cooling to a faint blue haze as it climbs.
            vec3 fire = mix(vec3(1.0, 0.45, 0.1), vec3(0.2, 0.35, 0.5), smoothstep(0.0, 0.5, t)) * 0.55;
            // Smoke: grey all the way up, thickest just above the mouth.
            vec3 smoke = mix(vec3(0.30, 0.31, 0.33), vec3(0.16, 0.2, 0.25), t) * 0.5;
            // Seen from close by, smoke thins out instead of whiting out the view.
            float near = mix(1.0, smoothstep(2.0, 16.0, length(mv.xyz)), aKind);
            vCol = mix(fire, smoke * 0.6, aKind) * (1.0 - t) * near * exp(-length(mv.xyz) * 0.03);
            gl_PointSize = min(uScale * mix(0.3 + t * 1.4, 0.5 + t * 1.8, aKind) / -mv.z, mix(400.0, 70.0, aKind));
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `varying vec3 vCol; void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vCol * smoothstep(0.5, 0.0, d), 1.0); }`,
      }),
    );
    plume.frustumCulled = false;
    scene.add(plume);

    // Sea pens: tall glowing feathers standing in the mud.
    const quill = document.createElement('canvas');
    quill.width = 128;
    quill.height = 256;
    const qg = quill.getContext('2d')!;
    qg.strokeStyle = '#ffffff';
    qg.lineCap = 'round';
    qg.lineWidth = 5;
    qg.beginPath();
    qg.moveTo(64, 254);
    qg.lineTo(64, 14);
    qg.stroke();
    qg.lineWidth = 3;
    for (let y = 40; y < 236; y += 9) {
      const reach = 54 * Math.sin(((y - 30) / 210) * Math.PI);
      for (const side of [1, -1]) {
        qg.beginPath();
        qg.moveTo(64, y);
        qg.quadraticCurveTo(64 + side * reach * 0.6, y - 6, 64 + side * reach, y - 22);
        qg.stroke();
      }
    }
    const pens = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.5, 1).translate(0, 0.5, 0),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(quill), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
      90,
    );
    pens.frustumCulled = false;
    for (let i = 0; i < 90; i++) {
      const a = rnd() * 6.28;
      const r = 6 + Math.pow(rnd(), 1.4) * 55;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = 1.6 + rnd() * 3.4;
      pens.setMatrixAt(i, m.compose(v.set(x, floorY(x, z) - 0.1, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6.28), sc.set(h, h, h)));
      pens.setColorAt(i, tint.set(pick([0x5affe0, 0xff6ad0, 0x8a8cff, 0xffd86a, 0x6ad0ff])).multiplyScalar(0.55));
    }
    scene.add(pens);
  }

  /** Each jellyfish has its own note: big ones low. */
  const noteOf = (j: Jelly) => Math.round((1 - (j.size - 0.6) / 1.5) * 9);
  const pointer = { ray: new THREE.Ray(), pressed: false };
  const hit = new THREE.Vector3();
  const tintNow = new THREE.Color();
  const dummy = new THREE.Object3D();

  const ocean: Ocean = {
    scene,
    onWhale: null,
    onChime: null,
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
        const note = noteOf(best);
        startPulse(best.group.position.x, best.group.position.y, best.group.position.z, uTime.value, note);
        return { kind: 'jelly', note };
      }
      for (const a of anglers) {
        if (ray.distanceToPoint(a.group.position) < 2.6) {
          a.flare = 1;
          return { kind: 'angler', note: 0 };
        }
      }
      // Open water: a wave of light spreads from the spot.
      ray.at(12, hit);
      const note = Math.floor(Math.random() * 5);
      startPulse(hit.x, hit.y, hit.z, uTime.value, note);
      return { kind: 'water', note };
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
      uSun.value = 1 - step01(0.12, 0.34, t);
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

      // Now and then the sea rings a note of its own. A jellyfish near her lights up and sounds;
      // or, in the dark with none about, a wave of light sets off somewhere by itself.
      nextPulse -= dt;
      if (nextPulse <= 0) {
        nextPulse = 4 + Math.random() * 5;
        const near = jellies.filter((j) => Math.abs(j.group.position.y - eye.y) < 24);
        if (near.length && Math.random() < 0.75) {
          const j = near[Math.floor(Math.random() * near.length)];
          const note = noteOf(j);
          j.flash.value = 0.8;
          startPulse(j.group.position.x, j.group.position.y, j.group.position.z, time, note);
          ocean.onChime?.(note, 'jelly');
        } else if (eye.y < -34) {
          const a = Math.random() * 6.28;
          const r = 6 + Math.random() * 22;
          const note = Math.floor(Math.random() * 5);
          startPulse(Math.cos(a) * r, Math.min(-35, eye.y + (Math.random() - 0.5) * 30), Math.sin(a) * r, time, note);
          ocean.onChime?.(note, 'deep');
        }
      }

      for (const j of jellies) {
        j.angle += dt * 0.012 * (j.phase > 3 ? 1 : -1);
        j.kick = Math.max(0, j.kick - dt * 0.5);
        j.flash.value = Math.max(0, j.flash.value - dt * 1.2);
        if (j.kick > 0) j.home += dt * 5 * j.kick;
        j.home = Math.min(j.home, -3);
        if (j.home > -44 && j.home < -24) j.home = -44; // a jellyfish jetting upward stops under the reef
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
          const st = s.state;
          const n = i * 5;
          const dir = s.speed > 0 ? 1 : -1;
          // Startled fish settle back to their usual pace; a pace below zero is a fish swimming back the way it came.
          st[n + 3] = Math.max(0, st[n + 3] - dt);
          if (st[n + 3] === 0) st[n + 2] = 1;
          st[n + 1] += (st[n + 2] - st[n + 1]) * Math.min(1, dt * (st[n + 3] > 0 ? 5 : 1.4));
          st[n] += dt * s.speed * st[n + 1];
          st[n + 4] *= Math.max(0, 1 - dt * 0.8);
          const a = st[n] + Math.sin(time * 0.6 + i) * 0.03;
          const r = s.radius + o[i * 4 + 2] + Math.sin(a * 3 + i) * 0.6 + st[n + 4];
          dummy.position.set(Math.cos(a) * r, s.y + o[i * 4 + 1] + Math.sin(a * 2 + i * 0.3) * 1.2, Math.sin(a) * r);
          // A finger in the water startles the fish near it. One that sees it ahead wheels round and
          // darts back; one that has it alongside or behind bolts forward.
          const along = pointer.ray.direction.dot(hit.copy(dummy.position).sub(pointer.ray.origin));
          if (along > 0) {
            const off = hit.copy(pointer.ray.origin).addScaledVector(pointer.ray.direction, along).sub(dummy.position);
            const gap = off.length();
            const reach = pointer.pressed ? 4.5 : 3.2;
            if (gap < reach) {
              // Edge away from it too, gently, rather than swimming straight through.
              const outward = (off.x * Math.cos(a) + off.z * Math.sin(a)) / (gap + 0.001);
              st[n + 4] = Math.max(-2.5, Math.min(2.5, st[n + 4] - outward * dt * 5));
              if (st[n + 3] < 0.25) {
                const ahead = (-Math.sin(a) * off.x + Math.cos(a) * off.z) * dir * (st[n + 1] < 0 ? -1 : 1) > 0;
                const dash = Math.min(9, Math.max(3, 7 / (Math.abs(s.speed) * r)));
                const facing = st[n + 1] < 0 ? -1 : 1;
                st[n + 2] = (ahead ? -facing : facing) * dash * (ahead ? 0.75 : 1);
                st[n + 3] = 0.9 + ((i * 7) % 10) * 0.08;
              }
            }
          }
          // Nose first: a fish circling one way faces along its path, and the other way faces back along it.
          // As its pace passes through nothing it swings round, alternate fish turning opposite ways.
          const swing = Math.min(1, Math.max(0, 0.5 - st[n + 1] * 1.2)) * Math.PI * (i % 2 ? 1 : -1);
          dummy.rotation.set(0, -a + (dir > 0 ? 0 : Math.PI) + swing + Math.sin(time * 9 + i) * (0.12 + Math.min(0.2, Math.abs(st[n + 1] - 1) * 0.04)), 0);
          dummy.scale.setScalar(o[i * 4 + 3]);
          dummy.updateMatrix();
          s.mesh.setMatrixAt(i, dummy.matrix);
        }
        s.mesh.instanceMatrix.needsUpdate = true;
      }

      // The turtle paddles a wide circle over the coral, with long slow strokes and a glide between.
      {
        const a = time * 0.045;
        turtle.group.position.set(Math.cos(a) * 15, -23.5 + Math.sin(time * 0.23) * 1.6, Math.sin(a) * 15);
        turtle.group.rotation.set(Math.cos(time * 0.23) * -0.12, -a, Math.sin(time * 0.4) * 0.08);
        const stroke = Math.sin(time * 1.5);
        turtle.flippers[0].rotation.z = stroke * 0.35 - 0.1;
        turtle.flippers[1].rotation.z = -stroke * 0.35 + 0.1;
      }
      // The mantas wheel the other way, lower down, one a little behind the other.
      for (const mr of mantas) {
        const a = -time * 0.05 - mr.lag;
        const r = 21 - mr.lag * 6;
        mr.group.position.set(Math.cos(a) * r, -46 - mr.lag * 5 + Math.sin(time * 0.19 + mr.lag * 4) * 2.5, Math.sin(a) * r);
        mr.group.rotation.set(Math.cos(time * 0.19 + mr.lag * 4) * 0.1, -a + Math.PI, -0.22);
        const flap = Math.sin(time * 1.15 + mr.lag * 3);
        mr.wings[0].rotation.z = flap * 0.42;
        mr.wings[1].rotation.z = -flap * 0.42;
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
