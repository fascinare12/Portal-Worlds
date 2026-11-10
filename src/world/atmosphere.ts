import * as THREE from 'three';
import { mulberry32, smoothstep } from '../noise';
import { daylight } from './daylight';
import { groundHeight, trees } from './layout';

function createSky(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(450, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uHorizon: { value: daylight.horizon },
        uZenith: { value: daylight.zenith },
        uSun: { value: daylight.sunDir },
        uMoon: { value: daylight.moonDir },
        uLight: { value: daylight.light },
        uNight: { value: 0 },
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
        uniform vec3 uMoon;
        uniform vec3 uLight;
        uniform float uNight;
        varying vec3 vDir;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          vec3 d = normalize(vDir);
          vec3 col = mix(uHorizon, uZenith, smoothstep(0.0, 0.55, d.y));

          // The sun: a soft disc with a wide glow that warms the sky around it.
          float toSun = max(dot(d, uSun), 0.0);
          col += uLight * (pow(toSun, 6.0) * 0.22 + pow(toSun, 60.0) * 0.5 + smoothstep(0.9990, 0.9996, toSun) * 2.0) * (1.0 - uNight);

          // Night: a pale moon and a scatter of stars that twinkle out near the horizon.
          float toMoon = max(dot(d, uMoon), 0.0);
          col += vec3(0.75, 0.82, 1.0) * (pow(toMoon, 40.0) * 0.25 + smoothstep(0.9988, 0.9993, toMoon) * 1.6) * uNight;
          vec2 grid = d.xz / (0.35 + d.y) * 70.0;
          vec2 cell = floor(grid);
          float star = step(0.975, hash(cell)) * hash(cell + 7.0) * smoothstep(0.35, 0.05, length(fract(grid) - 0.5));
          col += vec3(0.9, 0.93, 1.0) * star * uNight * smoothstep(0.05, 0.4, d.y) * 1.4;

          gl_FragColor = vec4(col, 1.0);
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
  const sky = createSky();
  group.add(sky);

  // Shafts of sunlight slanting down between the trees. Each is two crossed
  // sheets sharing one axis, all parallel because they come from one sun.
  const SHAFTS = 46;
  const shaftMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uStrength: { value: 0 }, uTime: { value: 0 }, uLight: { value: daylight.light } },
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
      uniform vec3 uLight;
      varying vec2 vUv;
      varying float vSeed;
      void main() {
        float across = pow(sin(vUv.x * 3.14159), 2.0);
        float along = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
        float breathe = 0.7 + 0.3 * sin(uTime * 0.4 + vSeed);
        gl_FragColor = vec4(uLight, across * along * breathe * uStrength);
      }`,
  });
  const shafts = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), shaftMat, SHAFTS * 2);
  shafts.frustumCulled = false;
  const feet: { x: number; y: number; z: number; length: number; width: number }[] = [];
  for (let i = 0; i < SHAFTS; i++) {
    // Shafts fall beside trees, where gaps in the canopy would be.
    const t = trees[Math.floor(rand() * trees.length)];
    const x = t.x + (rand() - 0.5) * 8;
    const z = t.z + (rand() - 0.5) * 8;
    feet.push({ x, y: groundHeight(x, z), z, length: 20 + rand() * 8, width: 2.2 + rand() * 3.2 });
  }
  const up = new THREE.Vector3(0, 1, 0);
  const lean = new THREE.Quaternion();
  const quarter = new THREE.Quaternion().setFromAxisAngle(up, Math.PI / 2);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const centre = new THREE.Vector3();
  const aimed = new THREE.Vector3();
  /** Turn every shaft to point at the light, which moves through the day. */
  function aimShafts(): void {
    aimed.copy(daylight.lightDir);
    lean.setFromUnitVectors(up, aimed);
    feet.forEach((f, i) => {
      scale.set(f.width, f.length, 1);
      centre.set(f.x, f.y, f.z).addScaledVector(aimed, f.length * 0.5 - 1);
      q.copy(lean);
      shafts.setMatrixAt(i * 2, m.compose(centre, q, scale));
      q.multiply(quarter);
      shafts.setMatrixAt(i * 2 + 1, m.compose(centre, q, scale));
    });
    shafts.instanceMatrix.needsUpdate = true;
  }
  aimShafts();
  group.add(shafts);

  // Pollen by day, fireflies by night.
  const MOTES = 1800;
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
    uniforms: { uTime: { value: 0 }, uScale: { value: 800 }, uStrength: { value: 0 }, uNight: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uScale;
      uniform float uNight;
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
        gl_PointSize = uScale * (0.09 + aPhase * 0.11) * (1.0 + uNight * 0.8) / -mv.z;
        // Fireflies blink on and off; pollen only shimmers.
        float blink = smoothstep(0.2, 0.9, sin(uTime * (0.9 + aPhase * 1.3) + aPhase * 60.0));
        float shimmer = 0.45 + 0.55 * sin(uTime * (0.6 + aPhase) + aPhase * 60.0);
        vAlpha = mix(shimmer, blink * 1.6, uNight);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uStrength;
      uniform float uNight;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        vec3 col = mix(vec3(1.0, 0.93, 0.5), vec3(0.6, 1.0, 0.25), uNight);
        gl_FragColor = vec4(col, smoothstep(0.5, 0.0, d) * vAlpha * uStrength);
      }`,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  motes.frustumCulled = false;
  group.add(motes);

  return {
    group,
    update(time, zoom, viewportHeight) {
      if (aimed.dot(daylight.lightDir) < 0.9995) aimShafts();
      (sky.material as THREE.ShaderMaterial).uniforms.uNight.value = daylight.night;
      // Shafts and motes belong to the view from among the trees; from high above they fade out.
      const near = smoothstep(0.3, 0.7, zoom);
      shaftMat.uniforms.uStrength.value = near * (0.22 * daylight.day + 0.07 * daylight.night);
      shaftMat.uniforms.uTime.value = time;
      moteMat.uniforms.uStrength.value = (0.45 + 0.75 * near) * (1 + daylight.night);
      moteMat.uniforms.uNight.value = daylight.night;
      moteMat.uniforms.uTime.value = time;
      moteMat.uniforms.uScale.value = viewportHeight;
    },
  };
}
