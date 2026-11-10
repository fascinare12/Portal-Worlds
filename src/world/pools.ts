import * as THREE from 'three';
import { mulberry32 } from '../noise';
import { daylight } from './daylight';
import { pools } from './layout';
import { noiseTexture } from './noiseTexture';

/**
 * Every pool is a still, dark mirror. An OPEN pool is told apart without words:
 * the water glows and swirls in the colour of the world behind it, a soft column
 * of light stands over it (visible from far above and through the trunks),
 * and sparks drift upward out of it.
 */

const waterVertex = /* glsl */ `
  varying vec2 vPos;
  varying vec3 vWorld;
  void main() {
    vPos = position.xy;
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpen;
  uniform float uPulse;
  uniform float uScene;
  uniform float uReveal;
  uniform float uRadius;
  uniform vec3 uColor;
  varying vec2 vPos;
  varying vec3 vWorld;

  uniform sampler2D uNoise;
  uniform vec3 uSky;
  uniform vec3 uAmbient;

  // Soft, slowly shifting clouds: leaves and sky seen in moving water.
  float blot(vec2 p) {
    return texture2D(uNoise, p * 0.07).r;
  }

  float blockTone(float n) { return fract(sin(n * 91.345) * 47453.5); }

  // What you see when you lean over the desert pool: far away under another
  // sun, a pyramid going up one block at a time.
  vec3 desertPicture(vec2 p, float t) {
    vec3 c = mix(vec3(0.98, 0.90, 0.72), vec3(0.55, 0.78, 0.93), smoothstep(-0.3, 0.9, p.y));
    c = mix(c, vec3(1.0, 0.97, 0.8), smoothstep(0.16, 0.13, length(p - vec2(0.5, 0.56))));
    float dune = -0.28 + 0.07 * sin(p.x * 4.0 + 1.0) + 0.04 * sin(p.x * 9.0);
    c = mix(c, vec3(0.86, 0.70, 0.45), smoothstep(0.012, 0.0, p.y - dune));

    const float ROWS = 7.0;
    float w = 0.17;
    float h = 0.105;
    float ground = -0.42;
    float total = ROWS * (ROWS + 1.0) / 2.0;
    // One block every moment or so; then the finished pyramid stands a while before starting again.
    float built = mod(t * 1.3, total + 9.0);
    float row = floor((p.y - ground) / h);
    if (row >= 0.0 && row < ROWS) {
      float inRow = ROWS - row;
      float left = -inRow * w * 0.5;
      float nth = floor((p.x - left) / w);
      if (nth >= 0.0 && nth < inRow) {
        float index = row * ROWS - row * (row - 1.0) * 0.5 + nth;
        float placed = clamp(built - index, 0.0, 1.0);
        vec2 cell = vec2(fract((p.x - left) / w), fract((p.y - ground) / h));
        // Each block grows into its place.
        float inside = step(max(abs(cell.x - 0.5), abs(cell.y - 0.5)) * 2.0, placed);
        float face = smoothstep(0.0, 0.08, cell.x) * smoothstep(1.0, 0.92, cell.x) * smoothstep(0.0, 0.1, cell.y) * smoothstep(1.0, 0.9, cell.y);
        vec3 stone = vec3(0.92, 0.78, 0.52) * (0.86 + 0.22 * blockTone(index)) * mix(0.68, 1.0, face);
        stone *= mix(0.84, 1.08, smoothstep(-0.4, 0.4, p.x)); // lit from the sun's side
        c = mix(c, stone, inside);
      }
    }
    c = mix(c, vec3(0.94, 0.81, 0.57), smoothstep(0.006, 0.0, p.y - ground));
    return c;
  }

  void main() {
    float r = length(vPos) / uRadius;
    vec3 toEye = normalize(cameraPosition - vWorld);
    // Water mirrors more at a glancing angle and shows its depth from above.
    float glance = pow(1.0 - clamp(toEye.y, 0.0, 1.0), 3.0);
    // Everything in the water turns slowly about the centre, faster towards the middle,
    // wound into a fixed spiral that turns as a whole, like a stirred cup.
    float twist = uTime * 0.22 + 2.6 * exp(-r * 1.4);
    vec2 spun = mat2(cos(twist), sin(twist), -sin(twist), cos(twist)) * vPos;
    vec2 rip = spun + 0.18 * vec2(sin(spun.y * 2.0 + uTime * 0.5), cos(spun.x * 2.0 + uTime * 0.4));
    // Spiral arms winding inwards.
    float arms = sin(atan(vPos.y, vPos.x) * 3.0 + r * 5.5 - uTime * 1.1) * 0.5 + 0.5;
    arms *= smoothstep(1.5, 0.3, r);

    // Closed: a dark mirror holding the canopy and the pale sky between the leaves.
    float canopy = blot(rip * 0.8 + 3.0) * 0.7 + blot(rip * 2.1 + 9.0) * 0.3;
    // The water holds whatever sky is overhead right now, day or night.
    vec3 sky = pow(uSky, vec3(0.4545));
    vec3 amb = pow(uAmbient, vec3(0.4545));
    vec3 mirror = mix(vec3(0.13, 0.30, 0.24) * amb, sky, smoothstep(0.42, 0.68, canopy));
    vec3 closed = mix(vec3(0.04, 0.13, 0.15) * amb, mirror, 0.38 + 0.55 * glance);
    closed += mirror * arms * 0.22;

    // Open: lit from below in the colour of the other world, brightest at the heart.
    float heart = smoothstep(1.3, 0.0, r);
    float shimmer = blot(rip * 1.6 + uTime * 0.4);
    float rings = sin(r * 10.0 - uTime * 1.2) * 0.5 + 0.5;
    vec3 open = mix(uColor * 0.8, mix(uColor, vec3(1.0), 0.75), heart * heart);
    open += uColor * (0.2 * shimmer + 0.07 * rings);
    open = mix(open, mix(uColor, vec3(1.0), 0.55), arms * 0.5);
    open = mix(open, mirror, 0.2 * glance);

    vec3 col = mix(closed, open, uOpen);

    // A pool that leads somewhere shows that place once you are close enough to look in.
    if (uScene > 0.5 && uReveal > 0.01) {
      vec2 off = vec2(vPos.x, -vPos.y); // across the ground, from the pool's centre
      vec2 away = normalize(vWorld.xz - off - cameraPosition.xz);
      // Turn the picture to face whoever is looking, so it is never upside down.
      vec2 across = vec2(-away.y, away.x);
      vec2 p = vec2(dot(off, across), dot(off, away)) / uRadius;
      p += 0.012 * vec2(sin(p.y * 18.0 + uTime * 1.3), cos(p.x * 16.0 + uTime * 1.1)); // seen through water
      float window = smoothstep(1.0, 0.72, length(p)) * uReveal;
      col = mix(col, desertPicture(p, uTime), window);
    }
    // Woken by a touch: a ring of light runs outward and the whole pool brightens.
    float wake = uPulse * (1.0 - uOpen);
    float ring = smoothstep(0.25, 0.0, abs(r - (1.0 - uPulse) * 1.6));
    col += mix(sky, vec3(1.0), 0.6) * wake * (0.35 * smoothstep(1.4, 0.0, r) + 0.6 * ring);
    gl_FragColor = vec4(col, 1.0);

    gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(2.2)); // authored in display colour, stored linear
  }
`;

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vNormal = normal;
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const beamFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpen;
  uniform float uNear;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    // Fade towards the silhouette so the column has no hard sides.
    vec3 toEye = cameraPosition - vWorld;
    float facing = abs(dot(normalize(vNormal.xz), normalize(toEye.xz)));
    float soft = pow(facing, 2.5);
    float fade = pow(1.0 - vUv.y, 1.6) * smoothstep(0.0, 0.04, vUv.y);
    float shimmer = 0.8 + 0.2 * sin(vUv.x * 30.0 + uTime * 1.2 + vUv.y * 5.0);
    vec3 col = mix(uColor, vec3(1.0), 0.35);
    gl_FragColor = vec4(col, fade * soft * shimmer * 0.32 * uOpen * uNear);
    gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(2.2)); // authored in display colour, stored linear
  }
`;

const sparkVertex = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  attribute float aPhase;
  attribute float aOpen;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float t = fract(uTime * 0.12 + aPhase);
    vec3 p = position;
    p.y += t * 9.0;
    p.x += sin(uTime * 0.9 + aPhase * 40.0) * 0.4;
    p.z += cos(uTime * 0.7 + aPhase * 31.0) * 0.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uScale * 0.28 / -mv.z;
    vColor = aColor;
    vAlpha = sin(t * 3.14159) * aOpen;
  }
`;

const sparkFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * vAlpha);
    gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(2.2)); // authored in display colour, stored linear
  }
`;

export interface PoolsView {
  group: THREE.Group;
  /** How open each pool currently is, 0..1. */
  openness: number[];
  /** Open or close a pool; it eases between the two states. */
  setOpen(index: number, open: boolean, color?: number): void;
  /** How brightly each pool lights its surroundings right now, 0..1. */
  glow: number[];
  /** Wake any pool this line of sight passes over; it answers with a burst of light. */
  touch(ray: THREE.Ray): void;
  update(time: number, dt: number, viewportHeight: number, eye: THREE.Vector3): void;
}

export function createPools(): PoolsView {
  const group = new THREE.Group();
  const rand = mulberry32(5);
  const SPARKS = 40;

  const waterMats: THREE.ShaderMaterial[] = [];
  const beamMats: THREE.ShaderMaterial[] = [];
  const openness: number[] = pools.map((p) => (p.open ? 1 : 0));

  const sparkPos = new Float32Array(pools.length * SPARKS * 3);
  const sparkPhase = new Float32Array(pools.length * SPARKS);
  const sparkOpen = new Float32Array(pools.length * SPARKS);
  const sparkColor = new Float32Array(pools.length * SPARKS * 3);
  const tmp = new THREE.Color();

  pools.forEach((p, i) => {
    const uColor = { value: new THREE.Color(p.color || 0xffffff) };

    // Oversized disc: the sloping bank cuts it into a natural shoreline.
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(p.radius + 5, 40),
      new THREE.ShaderMaterial({
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
        uniforms: {
          uTime: { value: 0 },
          uOpen: { value: openness[i] },
          uRadius: { value: p.radius },
          uPulse: { value: 0 },
          uScene: { value: p.world ? 1 : 0 },
          uReveal: { value: 0 },
          uNoise: { value: noiseTexture },
          uSky: { value: daylight.zenith },
          uAmbient: { value: daylight.ambient },
          uColor,
        },
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(p.x, p.level, p.z);
    group.add(water);
    waterMats.push(water.material);

    const height = 20;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(p.radius * 0.7, p.radius * 0.95, height, 28, 1, true),
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        uniforms: { uTime: { value: i * 3 }, uOpen: { value: openness[i] }, uNear: { value: 1 }, uColor },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    );
    beam.position.set(p.x, p.level + height / 2, p.z);
    group.add(beam);
    beamMats.push(beam.material);

    for (let s = 0; s < SPARKS; s++) {
      const k = i * SPARKS + s;
      const a = rand() * 6.28;
      const d = Math.sqrt(rand()) * p.radius * 0.8;
      sparkPos.set([p.x + Math.cos(a) * d, p.level, p.z + Math.sin(a) * d], k * 3);
      sparkPhase[k] = rand();
      sparkOpen[k] = openness[i];
      tmp.set(p.color || 0xffffff).lerp(new THREE.Color(0xffffff), 0.4);
      sparkColor.set([tmp.r, tmp.g, tmp.b], k * 3);
    }
  });

  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  sparkGeo.setAttribute('aPhase', new THREE.BufferAttribute(sparkPhase, 1));
  sparkGeo.setAttribute('aOpen', new THREE.BufferAttribute(sparkOpen, 1));
  sparkGeo.setAttribute('aColor', new THREE.BufferAttribute(sparkColor, 3));
  const sparkMat = new THREE.ShaderMaterial({
    vertexShader: sparkVertex,
    fragmentShader: sparkFragment,
    uniforms: { uTime: { value: 0 }, uScale: { value: 800 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  sparks.frustumCulled = false;
  group.add(sparks);

  const pulse = pools.map(() => 0);
  const glow = pools.map(() => 0);
  const hit = new THREE.Vector3();

  return {
    group,
    openness,
    glow,
    touch(ray) {
      if (ray.direction.y >= -0.02) return;
      pools.forEach((p, i) => {
        const t = (p.level - ray.origin.y) / ray.direction.y;
        hit.copy(ray.origin).addScaledVector(ray.direction, t);
        if (Math.hypot(hit.x - p.x, hit.z - p.z) < p.radius + 1.2) pulse[i] = 1;
      });
    },
    setOpen(index, open, colorHex) {
      const p = pools[index];
      p.open = open;
      if (colorHex !== undefined) {
        p.color = colorHex;
        (waterMats[index].uniforms.uColor.value as THREE.Color).set(colorHex);
        tmp.set(colorHex).lerp(new THREE.Color(0xffffff), 0.4);
        for (let s = 0; s < SPARKS; s++) sparkColor.set([tmp.r, tmp.g, tmp.b], (index * SPARKS + s) * 3);
        sparkGeo.attributes.aColor.needsUpdate = true;
      }
    },
    update(time, dt, viewportHeight, eye) {
      sparkMat.uniforms.uTime.value = time;
      sparkMat.uniforms.uScale.value = viewportHeight;
      let sparksDirty = false;
      pools.forEach((p, i) => {
        const goal = p.open ? 1 : 0;
        if (openness[i] !== goal) {
          const step = dt / 1.5;
          openness[i] = goal > openness[i] ? Math.min(goal, openness[i] + step) : Math.max(goal, openness[i] - step);
          for (let s = 0; s < SPARKS; s++) sparkOpen[i * SPARKS + s] = openness[i];
          sparksDirty = true;
        }
        // A woken pool sends up light for a couple of seconds, then settles.
        if (pulse[i] > 0) {
          pulse[i] = Math.max(0, pulse[i] - dt / 2.2);
          sparksDirty = true;
        }
        const lit = Math.max(openness[i], Math.sqrt(pulse[i]));
        glow[i] = Math.max(openness[i], pulse[i] * 0.7);
        if (sparksDirty) for (let s = 0; s < SPARKS; s++) sparkOpen[i * SPARKS + s] = lit;
        waterMats[i].uniforms.uTime.value = time + i * 3;
        waterMats[i].uniforms.uOpen.value = openness[i];
        waterMats[i].uniforms.uPulse.value = pulse[i];
        const reach = Math.hypot(eye.x - p.x, eye.y - p.level, eye.z - p.z);
        waterMats[i].uniforms.uReveal.value = 1 - Math.min(1, Math.max(0, (reach - 14) / 30));
        beamMats[i].uniforms.uTime.value = time + i * 3;
        beamMats[i].uniforms.uOpen.value = lit;
        // Standing inside the column would wash the whole view out, so it thins as you approach.
        const away = Math.hypot(eye.x - p.x, eye.z - p.z) / p.radius;
        beamMats[i].uniforms.uNear.value = 0.2 + 0.8 * Math.min(1, Math.max(0, (away - 1.5) / 4));
      });
      if (sparksDirty) sparkGeo.attributes.aOpen.needsUpdate = true;
    },
  };
}
