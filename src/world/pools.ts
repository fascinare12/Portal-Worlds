import * as THREE from 'three';
import { mulberry32 } from '../noise';
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
  uniform float uRadius;
  uniform vec3 uColor;
  varying vec2 vPos;
  varying vec3 vWorld;

  uniform sampler2D uNoise;

  // Soft, slowly shifting clouds: leaves and sky seen in moving water.
  float blot(vec2 p) {
    return texture2D(uNoise, p * 0.07).r;
  }

  void main() {
    float r = length(vPos) / uRadius;
    vec3 toEye = normalize(cameraPosition - vWorld);
    // Water mirrors more at a glancing angle and shows its depth from above.
    float glance = pow(1.0 - clamp(toEye.y, 0.0, 1.0), 3.0);
    vec2 rip = vPos + 0.18 * vec2(sin(vPos.y * 2.0 + uTime * 0.5), cos(vPos.x * 2.0 + uTime * 0.4));

    // Closed: a dark mirror holding the canopy and the pale sky between the leaves.
    float canopy = blot(rip * 0.8 + 3.0) * 0.7 + blot(rip * 2.1 + 9.0) * 0.3;
    vec3 mirror = mix(vec3(0.13, 0.30, 0.24), vec3(0.94, 0.95, 0.80), smoothstep(0.42, 0.68, canopy));
    vec3 closed = mix(vec3(0.04, 0.13, 0.15), mirror, 0.38 + 0.55 * glance);

    // Open: lit from below in the colour of the other world, brightest at the heart.
    float heart = smoothstep(1.3, 0.0, r);
    float shimmer = blot(rip * 1.6 + uTime * 0.4);
    float rings = sin(r * 10.0 - uTime * 1.2) * 0.5 + 0.5;
    vec3 open = mix(uColor * 0.8, mix(uColor, vec3(1.0), 0.75), heart * heart);
    open += uColor * (0.2 * shimmer + 0.07 * rings);
    open = mix(open, mirror, 0.2 * glance);

    gl_FragColor = vec4(mix(closed, open, uOpen), 1.0);
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
  /** How open each pool currently is, 0..1. */
  openness: number[];
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
        uniforms: {
          uTime: { value: 0 },
          uOpen: { value: openness[i] },
          uRadius: { value: p.radius },
          uNoise: { value: noiseTexture },
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

  return {
    group,
    openness,
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
