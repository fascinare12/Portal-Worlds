import * as THREE from 'three';
import { fbm, smoothstep } from '../noise';
import { noiseTexture } from './noiseTexture';
import { GROUND_SIZE, groundHeight, pools, trees } from './layout';

export interface TerrainView {
  mesh: THREE.Mesh;
  /** `openness` is how open each pool is (0..1); open pools cast their colour on the ground. */
  update(time: number, openness: number[]): void;
}

export function createTerrain(): TerrainView {
  const segments = 220;
  const geo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const moss = new THREE.Color(0x4a8748);
  const grass = new THREE.Color(0x86b257);
  const leafLitter = new THREE.Color(0xa9984f);
  const shade = new THREE.Color(0x1f4a40);
  const bank = new THREE.Color(0x355f45);
  const mud = new THREE.Color(0x20302a);
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundHeight(x, z);
    pos.setY(i, y);

    c.copy(moss).lerp(grass, fbm(x * 0.045, z * 0.045, 3));
    c.lerp(leafLitter, smoothstep(0.58, 0.8, fbm(x * 0.07 + 70, z * 0.07 + 70, 3)) * 0.6);

    // Soft pools of shade under each canopy.
    let shadow = 0;
    for (const t of trees) {
      const reach = t.r * 1.8;
      const dx = t.x - x;
      const dz = t.z - z;
      if (dx > reach || dx < -reach || dz > reach || dz < -reach) continue;
      shadow = Math.max(shadow, 1 - smoothstep(reach * 0.25, reach, Math.hypot(dx, dz)));
    }
    c.lerp(shade, shadow * 0.5);

    for (const p of pools) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < p.radius + 6) {
        c.lerp(bank, 1 - Math.max(0, d - p.radius) / 6);
        if (y < p.level) c.copy(mud);
      }
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const uniforms = {
    uTime: { value: 0 },
    uNoise: { value: noiseTexture },
    uPools: { value: pools.map((p) => new THREE.Vector4(p.x, p.z, p.radius, 0)) },
    uPoolColors: { value: pools.map((p) => new THREE.Color(p.color || 0xffffff)) },
  };

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vWPos;
        uniform float uTime;
        uniform vec4 uPools[${pools.length}];
        uniform vec3 uPoolColors[${pools.length}];
        uniform sampler2D uNoise;
        float dapple(vec2 p, float t) {
          float n = texture2D(uNoise, p * 0.028 + t * 0.003).r * 0.65 + texture2D(uNoise, p * 0.09 - t * 0.004).r * 0.35;
          return smoothstep(0.47, 0.66, n);
        }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // Sunlight falling through the leaves.
        float sunSpot = dapple(vWPos.xz, uTime);
        diffuseColor.rgb *= mix(0.86, 1.2, sunSpot);
        diffuseColor.rgb += vec3(0.09, 0.07, 0.0) * sunSpot;
        // Uneven washes of pigment, so the ground is never one flat fill.
        float wash = texture2D(uNoise, vWPos.xz * 0.16 + 0.5).r;
        float stroke = texture2D(uNoise, vWPos.xz * vec2(0.9, 0.35)).r;
        diffuseColor.rgb *= 0.9 + 0.2 * smoothstep(0.4, 0.6, wash) + 0.08 * (stroke - 0.5);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        // Open pools light the ground around them in their own colour.
        for (int i = 0; i < ${pools.length}; i++) {
          float d = max(distance(vWPos.xz, uPools[i].xy) - uPools[i].z, 0.0);
          totalEmissiveRadiance += uPoolColors[i] * uPools[i].w * exp(-d * 0.42) * 0.55;
        }`,
      );
  };

  return {
    mesh: new THREE.Mesh(geo, mat),
    update(time, openness) {
      uniforms.uTime.value = time;
      pools.forEach((p, i) => {
        uniforms.uPools.value[i].w = openness[i];
        uniforms.uPoolColors.value[i].set(p.color || 0xffffff);
      });
    },
  };
}
