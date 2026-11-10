import * as THREE from 'three';
import { tileNoise } from '../noise';

/** A small seamless cloud texture, used for dappled sunlight and reflections in water. */
function build(): THREE.DataTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n =
        tileNoise((x / size) * 6, (y / size) * 6, 6) * 0.55 +
        tileNoise((x / size) * 12 + 3, (y / size) * 12 + 3, 12) * 0.3 +
        tileNoise((x / size) * 24 + 7, (y / size) * 24 + 7, 24) * 0.15;
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = Math.round(n * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

export const noiseTexture = build();
