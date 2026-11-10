import * as THREE from 'three';
import { mulberry32 } from '../noise';
import { pools } from './layout';

/**
 * Every pool is a still, dark mirror. An OPEN pool is told apart without words:
 * the water glows and swirls in the colour of the world behind it, a soft column
 * of light stands over it (visible from far above and through the trunks),
 * and sparks drift upward out of it.
 */

const waterVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const waterFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpen;
  uniform float uRadius;
  uniform vec3 uColor;
  varying vec2 vPos;
  void main() {
    float r = length(vPos) / uRadius;
    float a = atan(vPos.y, vPos.x);

    // Closed: dark mirror of canopy and sky with slow, faint ripples.
    float ripple = sin(r * 9.0 - uTime * 0.6) * 0.5 + 0.5;
    vec3 closed = mix(vec3(0.05, 0.13, 0.12), vec3(0.42, 0.60, 0.55), 0.25 + 0.2 * ripple * r);

    // Open: a bright swirl in the colour of the other world.
    float swirl = sin(a * 3.0 + r * 7.0 - uTime * 1.6) * 0.5 + 0.5;
    float rings = sin(r * 16.0 - uTime * 2.6) * 0.5 + 0.5;
    float core = smoothstep(1.1, 0.0, r);
    vec3 open = uColor * (0.45 + 0.5 * swirl + 0.25 * rings) + vec3(1.0) * core * core * 0.45;

    gl_FragColor = vec4(mix(closed, open, uOpen), 1.0);
  }
`;

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const beamFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpen;
  uniform float uNear;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float fade = pow(1.0 - vUv.y, 2.0) * uNear;
    float shimmer = 0.75 + 0.25 * sin(vUv.x * 40.0 + uTime * 1.5 + vUv.y * 6.0);
    gl_FragColor = vec4(uColor, fade * shimmer * 0.45 * uOpen);
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
  }
`;

export interface PoolsView {
  group: THREE.Group;
  /** Open or close a pool; it eases between the two states. */
  setOpen(index: number, open: boolean, color?: number): void;
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
        uniforms: { uTime: { value: 0 }, uOpen: { value: openness[i] }, uRadius: { value: p.radius }, uColor },
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(p.x, p.level, p.z);
    group.add(water);
    waterMats.push(water.material);

    const height = 16;
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

  return {
    group,
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
        waterMats[i].uniforms.uTime.value = time + i * 3;
        waterMats[i].uniforms.uOpen.value = openness[i];
        beamMats[i].uniforms.uTime.value = time + i * 3;
        beamMats[i].uniforms.uOpen.value = openness[i];
        // Standing inside the column would wash the whole view out, so it thins as you approach.
        const away = Math.hypot(eye.x - p.x, eye.z - p.z) / p.radius;
        beamMats[i].uniforms.uNear.value = 0.15 + 0.85 * Math.min(1, Math.max(0, (away - 1.5) / 4));
      });
      if (sparksDirty) sparkGeo.attributes.aOpen.needsUpdate = true;
    },
  };
}
