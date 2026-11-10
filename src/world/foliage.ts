import * as THREE from 'three';
import { mulberry32 } from '../noise';
import leavesUrl from '../textures/leaves.webp';
import { daylight } from './daylight';
import { trees } from './layout';
import { wind } from './paint';

export interface Foliage {
  mesh: THREE.Mesh;
  /** 1 = every leaf card; lower values thin the crowns evenly for slower devices. */
  setDensity(amount: number): void;
}

/**
 * Canopies painted by hand. Each mass of leaves is a handful of small cards
 * showing a painted leaf cluster. The cards always face the viewer, so a tree
 * looks leafy from above and from the forest floor alike. A few darker cards
 * sit deep inside each mass so no sky shows through the middle.
 */
export function createFoliage(): Foliage {
  const rand = mulberry32(2024);
  const INNER = 3;
  const OUTER = 9;
  // Outer cards are stored in this order so that dropping the last ones thins a crown evenly.
  const ORDER = [0, 5, 2, 7, 4, 8, 1, 6, 3];
  const clumps = trees.length * 4;
  const count = clumps * (INNER + OUTER);

  const centre = new Float32Array(count * 3);
  const facing = new Float32Array(count * 3);
  const tint = new Float32Array(count * 3);
  const shape = new Float32Array(count * 3); // size, rotation, sway phase

  // Mostly greens from deep teal to spring; a few amber and rose trees for accent.
  const greens = [0x1f6b52, 0x2f8552, 0x4fa457, 0x7fb95c, 0xa9c85e];
  const accents = [0xe0a43c, 0xd07f62, 0xe9c75a];
  const colour = new THREE.Color();
  const dir = new THREE.Vector3();

  let clump = 0;
  for (const t of trees) {
    const hex = rand() < 0.09 ? accents[Math.floor(rand() * accents.length)] : greens[Math.floor(rand() * greens.length)];
    for (const c of t.clumps) {
      for (let slot = 0; slot < INNER + OUTER; slot++) {
        const n = slot * clumps + clump;
        const inner = slot < INNER;
        if (inner) {
          // Deep in the mass, in shadow.
          const a = (slot / INNER) * 6.28 + rand();
          dir.set(Math.cos(a) * 0.3, -0.25, Math.sin(a) * 0.3);
        } else {
          // Spread evenly over the surface of the mass.
          const k = ORDER[slot - INNER];
          const y = 1 - (2 * (k + 0.5)) / OUTER;
          const ring = Math.sqrt(1 - y * y);
          const turn = k * 2.4 + rand() * 0.6;
          dir.set(Math.cos(turn) * ring, y, Math.sin(turn) * ring);
        }
        centre.set([c.x + dir.x * c.size * 0.8, c.y + dir.y * c.size * 0.55, c.z + dir.z * c.size * 0.8], n * 3);
        facing.set(inner ? [0, -1, 0] : [dir.x, dir.y, dir.z], n * 3);
        colour.set(hex).offsetHSL((rand() - 0.5) * 0.04, 0, (rand() - 0.5) * 0.1);
        if (inner) colour.multiplyScalar(0.8);
        tint.set([colour.r, colour.g, colour.b], n * 3);
        shape.set([c.size * (inner ? 1.7 : 1.4 + rand() * 0.5), rand() * 6.28, rand() * 6.28], n * 3);
      }
      clump++;
    }
  }

  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.setAttribute('aCentre', new THREE.InstancedBufferAttribute(centre, 3));
  geo.setAttribute('aFacing', new THREE.InstancedBufferAttribute(facing, 3));
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
  geo.setAttribute('aShape', new THREE.InstancedBufferAttribute(shape, 3));
  geo.instanceCount = count;

  const leaves = new THREE.TextureLoader().load(leavesUrl);
  leaves.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.ShaderMaterial({
    fog: true,
    alphaToCoverage: true,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uLeaves: { value: leaves },
      uSun: { value: daylight.lightDir },
      uAmbient: { value: daylight.ambient },
      uWind: wind,
    },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      uniform vec3 uSun;
      uniform vec3 uAmbient;
      uniform float uWind;
      attribute vec3 aCentre;
      attribute vec3 aFacing;
      attribute vec3 aTint;
      attribute vec3 aShape;
      varying vec2 vUv;
      varying vec3 vColor;
      varying float vNear;
      void main() {
        vUv = uv;
        vec3 c = aCentre;
        float sway = sin(uWind * 0.9 + aShape.z) + 0.5 * sin(uWind * 2.1 + aShape.z * 1.7);
        c.x += sway * 0.1;
        c.z += sway * 0.06;
        vec4 mvPosition = viewMatrix * vec4(c, 1.0);
        // Leaves right in front of the eye thin away instead of filling the view.
        vNear = smoothstep(1.2, 4.5, -mvPosition.z);
        float turn = aShape.y + sway * 0.04;
        vec2 p = mat2(cos(turn), sin(turn), -sin(turn), cos(turn)) * position.xy * aShape.x;
        mvPosition.xy += p;
        gl_Position = projectionMatrix * mvPosition;

        // Three flat tones of light, plus cool shade on the underside.
        float sun = dot(aFacing, uSun);
        float tone = sun > 0.35 ? 1.25 : (sun > -0.2 ? 0.95 : 0.66);
        vec3 shade = mix(vec3(0.62, 0.8, 0.95), vec3(1.08, 1.04, 0.9), smoothstep(-0.6, 0.6, aFacing.y));
        vColor = aTint * tone * shade * uAmbient;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform sampler2D uLeaves;
      varying vec2 vUv;
      varying vec3 vColor;
      varying float vNear;
      void main() {
        vec4 paint = texture2D(uLeaves, vUv);
        float alpha = smoothstep(0.15, 0.6, paint.a) * vNear;
        if (alpha < 0.1) discard;
        // Keep the painter's lights and darks, but take the hue from the tree.
        float value = dot(paint.rgb, vec3(0.3, 0.59, 0.11));
        gl_FragColor = vec4(vColor * (0.35 + value * 2.6), alpha);
        #include <fog_fragment>
      }`,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return {
    mesh,
    setDensity(amount) {
      const outer = Math.max(3, Math.round(OUTER * amount));
      geo.instanceCount = clumps * (INNER + outer);
    },
  };
}
