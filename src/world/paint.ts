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
  /** Paint long vertical strokes of bark over the colour. */
  bark?: boolean;
  /** Dot the surface with pale spots, like a toadstool cap. */
  spots?: boolean;
}

const BARK = /* glsl */ `
  // Bark: long dry-brush strokes running up the trunk, darker furrows, a few knots.
  vec2 around = vec2((vPaintPos.x + vPaintPos.z) * 0.95, vPaintPos.y * 0.06);
  float stroke = texture2D(uNoise, around).r;
  float furrow = texture2D(uNoise, around * vec2(2.7, 1.6) + 0.31).r;
  float knot = texture2D(uNoise, vPaintPos.xz * 0.45 + vPaintPos.y * 0.33).r;
  diffuseColor.rgb *= 0.6 + 0.7 * stroke;
  diffuseColor.rgb *= 0.72 + 0.28 * smoothstep(0.38, 0.5, furrow);
  diffuseColor.rgb *= 0.86 + 0.2 * smoothstep(0.45, 0.6, knot);
`;

const SPOTS = /* glsl */ `
  // Pale spots of uneven size, and streaks running down from the crown of the cap.
  float spot = texture2D(uNoise, vPaintPos.xz * 2.3 + vPaintPos.y * 1.1).r;
  float streak = texture2D(uNoise, vec2(atan(vPaintPos.z, vPaintPos.x) * 0.0 + (vPaintPos.x - vPaintPos.z) * 3.0, vPaintPos.y * 0.6)).r;
  diffuseColor.rgb *= 0.82 + 0.3 * streak;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.96, 0.86), smoothstep(0.6, 0.66, spot) * 0.9);
`;

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
  const swayCode =
    sway > 0
      ? `float swayPhase = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.27;
         float swayNow = sin(uWind * 0.9 + swayPhase) + 0.5 * sin(uWind * 2.3 + swayPhase * 1.7);
         swayNow *= smoothstep(95.0, 45.0, distance(cameraPosition, instanceMatrix[3].xyz));
         transformed.x += swayNow * ${sway.toFixed(3)};
         transformed.z += swayNow * ${(sway * 0.6).toFixed(3)};`
      : '';
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.uniforms.uNoise = { value: noiseTexture };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWind;\nvarying vec3 vPaintPos;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          ${swayCode}
          vPaintPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vPaintPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uNoise;\nvarying vec3 vPaintPos;')
      .replace('#include <color_fragment>', `#include <color_fragment>\n${opts.bark ? BARK : ''}${opts.spots ? SPOTS : ''}`)
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
