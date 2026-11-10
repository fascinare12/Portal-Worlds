import * as THREE from 'three';
import { fbm } from '../noise';
import { GROUND_SIZE, groundHeight, pools } from './layout';

export function createTerrain(): THREE.Mesh {
  const segments = 220;
  const geo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grassA = new THREE.Color(0x5f9e4a);
  const grassB = new THREE.Color(0x86b85a);
  const moss = new THREE.Color(0x3f6f3d);
  const mud = new THREE.Color(0x2c3b2f);
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundHeight(x, z);
    pos.setY(i, y);

    c.copy(grassA).lerp(grassB, fbm(x * 0.05, z * 0.05, 3));
    for (const p of pools) {
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < p.radius + 6) c.lerp(moss, 1 - Math.max(0, d - p.radius) / 6);
      if (y < p.level && d < p.radius + 6) c.copy(mud);
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  return new THREE.Mesh(geo, mat);
}
