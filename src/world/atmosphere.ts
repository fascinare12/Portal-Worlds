import * as THREE from 'three';
import { mulberry32, smoothstep } from '../noise';
import { groundHeight, trees } from './layout';

/** Colour of distant mist; the sky meets it at the horizon so the wood has no visible edge. */
export const MIST = 0xbcd8c0;
const ZENITH = 0xf6f2cc;

/** Direction the sunlight travels from, shared by the light and the shafts. */
export const SUN_DIR = new THREE.Vector3(0.45, 0.85, 0.3).normalize();

function createSky(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(450, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uHorizon: { value: new THREE.Color(MIST) },
        uZenith: { value: new THREE.Color(ZENITH) },
        uSun: { value: SUN_DIR },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uHorizon;
        uniform vec3 uZenith;
        uniform vec3 uSun;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          vec3 col = mix(uHorizon, uZenith, smoothstep(0.0, 0.55, d.y));
          col += vec3(1.0, 0.9, 0.6) * pow(max(dot(d, uSun), 0.0), 6.0) * 0.25;
          gl_FragColor = vec4(col, 1.0);
          gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(2.2)); // authored in display colour, stored linear
        }`,
    }),
  );
}

export interface Atmosphere {
  group: THREE.Group;
  update(time: number, zoom: number, viewportHeight: number): void;
}

export function createAtmosphere(): Atmosphere {
  const group = new THREE.Group();
  const rand = mulberry32(77);
  group.add(createSky());

  // Shafts of sunlight slanting down between the trees. Each is two crossed
  // sheets sharing one axis, all parallel because they come from one sun.
  const SHAFTS = 46;
  const shaftMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uStrength: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vSeed;
      void main() {
        vUv = uv;
        vSeed = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.11;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uStrength;
      uniform float uTime;
      varying vec2 vUv;
      varying float vSeed;
      void main() {
        float across = pow(sin(vUv.x * 3.14159), 2.0);
        float along = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
        float breathe = 0.7 + 0.3 * sin(uTime * 0.4 + vSeed);
        gl_FragColor = vec4(1.0, 0.95, 0.72, across * along * breathe * uStrength);
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(2.2)); // authored in display colour, stored linear
      }`,
  });
  const shafts = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), shaftMat, SHAFTS * 2);
  shafts.frustumCulled = false;
  const up = new THREE.Vector3(0, 1, 0);
  const lean = new THREE.Quaternion().setFromUnitVectors(up, SUN_DIR);
  const quarter = new THREE.Quaternion().setFromAxisAngle(up, Math.PI / 2);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const centre = new THREE.Vector3();
  for (let i = 0; i < SHAFTS; i++) {
    // Shafts fall beside trees, where gaps in the canopy would be.
    const t = trees[Math.floor(rand() * trees.length)];
    const x = t.x + (rand() - 0.5) * 8;
    const z = t.z + (rand() - 0.5) * 8;
    const length = 20 + rand() * 8;
    scale.set(2.2 + rand() * 3.2, length, 1);
    centre.set(x, groundHeight(x, z), z).addScaledVector(SUN_DIR, length * 0.5 - 1);
    q.copy(lean);
    shafts.setMatrixAt(i * 2, m.compose(centre, q, scale));
    q.multiply(quarter);
    shafts.setMatrixAt(i * 2 + 1, m.compose(centre, q, scale));
  }
  group.add(shafts);

  // Pollen and fireflies drifting through the air.
  const MOTES = 700;
  const pos = new Float32Array(MOTES * 3);
  const phase = new Float32Array(MOTES);
  for (let i = 0; i < MOTES; i++) {
    const a = rand() * 6.28;
    const d = Math.sqrt(rand()) * 100;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    pos.set([x, groundHeight(x, z) + 0.4 + rand() * rand() * 9, z], i * 3);
    phase[i] = rand();
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  moteGeo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const moteMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 800 }, uStrength: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uScale;
      attribute float aPhase;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * 0.25 + aPhase * 40.0;
        p.x += sin(t) * 1.2 + sin(t * 0.37) * 2.0;
        p.y += sin(t * 0.8 + aPhase * 9.0) * 0.6;
        p.z += cos(t * 0.9) * 1.2 + cos(t * 0.31) * 2.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uScale * (0.07 + aPhase * 0.08) / -mv.z;
        vAlpha = 0.45 + 0.55 * sin(uTime * (0.6 + aPhase) + aPhase * 60.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uStrength;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(1.0, 0.96, 0.7, smoothstep(0.5, 0.0, d) * vAlpha * uStrength);
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(2.2)); // authored in display colour, stored linear
      }`,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  group.add(motes);

  return {
    group,
    update(time, zoom, viewportHeight) {
      // Both belong to the view from among the trees; from high above they fade out.
      const near = smoothstep(0.3, 0.7, zoom);
      shaftMat.uniforms.uStrength.value = 0.3 * near;
      shaftMat.uniforms.uTime.value = time;
      moteMat.uniforms.uStrength.value = 0.25 + 0.75 * near;
      moteMat.uniforms.uTime.value = time;
      moteMat.uniforms.uScale.value = viewportHeight;
    },
  };
}
