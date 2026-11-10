import * as THREE from 'three';
import { noiseTexture } from './noiseTexture';

/** Shared clock for the breeze that moves leaves and grass. */
export const wind = { value: 0 };

/** Three flat tones of light instead of a smooth computer gradient. */
function buildRamp(): THREE.DataTexture {
  const tex = new THREE.DataTexture(new Uint8Array([105, 170, 228, 255]), 4, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
const ramp = buildRamp();

interface PaintOptions {
  color?: number;
  vertexColors?: boolean;
  /** How far the shape sways in the breeze, in world units. */
  sway?: number;
  /** How ragged the edge between light and shade is (0 = clean cel shading). */
  dab?: number;
}

/**
 * A material that shades like gouache: flat tones of light, with the boundary
 * between them broken up as if dabbed on with a brush.
 */
export function paint(opts: PaintOptions = {}): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({
    color: opts.color ?? 0xffffff,
    vertexColors: opts.vertexColors ?? false,
    gradientMap: ramp,
  });
  const dab = (opts.dab ?? 0.9).toFixed(3);
  const sway = opts.sway ?? 0;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.uniforms.uNoise = { value: noiseTexture };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWind;\nvarying vec3 vPaintPos;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          ${
            sway > 0
              ? `float swayPhase = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.27;
          float swayNow = sin(uWind * 0.9 + swayPhase) + 0.5 * sin(uWind * 2.3 + swayPhase * 1.7);
          transformed.x += swayNow * ${sway.toFixed(3)};
          transformed.z += swayNow * ${(sway * 0.6).toFixed(3)};`
              : ''
          }
          vPaintPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vPaintPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uNoise;\nvarying vec3 vPaintPos;')
      .replace(
        '#include <normal_fragment_begin>',
        `#include <normal_fragment_begin>
        // Nudge the surface direction with a cloudy pattern fixed in the world,
        // so the tones meet along an uneven, hand-painted edge.
        vec3 dabP = vPaintPos * 0.21;
        vec3 dabV = vec3(
          texture2D(uNoise, dabP.xz + dabP.y * 0.7).r,
          texture2D(uNoise, dabP.zy + dabP.x * 0.6 + 0.37).r,
          texture2D(uNoise, dabP.yx - dabP.z * 0.5 + 0.71).r) - 0.5;
        normal = normalize(normal + dabV * ${dab});`,
      );
  };
  return mat;
}
