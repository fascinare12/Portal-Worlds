import * as THREE from 'three';
import { mulberry32 } from '../noise';
import leavesUrl from '../textures/leaves.webp';
import { SUN_DIR } from './atmosphere';
import { groundHeight, trees } from './layout';
import { wind } from './paint';

/**
 * Canopies painted by hand. Each tree carries a few dozen small cards showing a
 * painted cluster of leaves. The cards always face the viewer, so the tree
 * looks leafy from above and from the forest floor alike, and each card takes
 * its light from where it sits on the crown.
 */
export function createFoliage(): THREE.Mesh {
  const rand = mulberry32(2024);
  const CLUMPS = 4; // leaf masses per tree: one on top, three around
  const CARDS = 10; // painted cards per mass
  const count = trees.length * CLUMPS * CARDS;

  const centre = new Float32Array(count * 3);
  const facing = new Float32Array(count * 3);
  const tint = new Float32Array(count * 3);
  const shape = new Float32Array(count * 3); // size, rotation, sway phase

  // Mostly greens from deep teal to spring; a few amber and rose trees for accent.
  const greens = [0x1f6b52, 0x2f8552, 0x4fa457, 0x7fb95c, 0xa9c85e];
  const accents = [0xe0a43c, 0xd07f62, 0xe9c75a];
  const colour = new THREE.Color();
  const dir = new THREE.Vector3();
  let n = 0;

  for (const t of trees) {
    const base = groundHeight(t.x, t.z) - 0.25 + t.h;
    const hex = rand() < 0.09 ? accents[Math.floor(rand() * accents.length)] : greens[Math.floor(rand() * greens.length)];
    for (let c = 0; c < CLUMPS; c++) {
      const top = c === 0;
      const a = (c / (CLUMPS - 1)) * 6.28 + rand();
      const spread = top ? 0 : t.r * 0.75;
      const size = t.r * (top ? 1 : 0.62 + rand() * 0.2);
      const cx = t.x + Math.cos(a) * spread;
      const cy = base + (top ? t.r * 0.35 : -t.r * 0.15 + rand() * t.r * 0.35);
      const cz = t.z + Math.sin(a) * spread;
      for (let k = 0; k < CARDS; k++) {
        // Spread the cards evenly over the mass, a little flattened.
        const y = 1 - (2 * (k + 0.5)) / CARDS;
        const ring = Math.sqrt(1 - y * y);
        const turn = k * 2.4 + rand() * 0.6;
        dir.set(Math.cos(turn) * ring, y, Math.sin(turn) * ring);
        centre.set([cx + dir.x * size * 0.8, cy + dir.y * size * 0.55, cz + dir.z * size * 0.8], n * 3);
        facing.set([dir.x, dir.y, dir.z], n * 3);
        colour.set(hex).offsetHSL((rand() - 0.5) * 0.04, 0, (rand() - 0.5) * 0.1);
        tint.set([colour.r, colour.g, colour.b], n * 3);
        shape.set([size * (1.4 + rand() * 0.5), rand() * 6.28, rand() * 6.28], n * 3);
        n++;
      }
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
      uSun: { value: SUN_DIR },
      uWind: wind,
    },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      uniform vec3 uSun;
      uniform float uWind;
      attribute vec3 aCentre;
      attribute vec3 aFacing;
      attribute vec3 aTint;
      attribute vec3 aShape;
      varying vec2 vUv;
      varying vec3 vColor;
      void main() {
        vUv = uv;
        vec3 c = aCentre;
        float sway = sin(uWind * 0.9 + aShape.z) + 0.5 * sin(uWind * 2.1 + aShape.z * 1.7);
        c.x += sway * 0.1;
        c.z += sway * 0.06;
        vec4 mvPosition = viewMatrix * vec4(c, 1.0);
        float turn = aShape.y + sway * 0.04;
        vec2 p = mat2(cos(turn), sin(turn), -sin(turn), cos(turn)) * position.xy * aShape.x;
        mvPosition.xy += p;
        gl_Position = projectionMatrix * mvPosition;

        // Three flat tones of sunlight, plus cool shade on the underside.
        float sun = dot(aFacing, uSun);
        float tone = sun > 0.35 ? 1.25 : (sun > -0.2 ? 0.95 : 0.66);
        vec3 shade = mix(vec3(0.62, 0.8, 0.95), vec3(1.08, 1.04, 0.9), smoothstep(-0.6, 0.6, aFacing.y));
        vColor = aTint * tone * shade;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform sampler2D uLeaves;
      varying vec2 vUv;
      varying vec3 vColor;
      void main() {
        vec4 paint = texture2D(uLeaves, vUv);
        if (paint.a < 0.15) discard;
        // Keep the painter's lights and darks, but take the hue from the tree.
        float value = dot(paint.rgb, vec3(0.3, 0.59, 0.11));
        gl_FragColor = vec4(vColor * (0.35 + value * 2.6), smoothstep(0.15, 0.6, paint.a));
        #include <fog_fragment>
      }`,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}
