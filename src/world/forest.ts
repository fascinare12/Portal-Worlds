import * as THREE from 'three';
import { fbm, mulberry32 } from '../noise';
import { GROUND_SIZE, groundHeight, poolAt, pools } from './layout';

const dummy = new THREE.Object3D();
const color = new THREE.Color();

/** Tall trees: bare trunks at child height, canopy overhead, clearings around every pool. */
function createTrees(): THREE.Group {
  const rand = mulberry32(21);
  const spots: { x: number; z: number; h: number; r: number }[] = [];
  const half = GROUND_SIZE / 2 - 6;
  let tries = 0;
  while (spots.length < 620 && tries++ < 20000) {
    const x = (rand() * 2 - 1) * half;
    const z = (rand() * 2 - 1) * half;
    if (poolAt(x, z, 7)) continue;
    if (fbm(x * 0.03 + 9, z * 0.03 + 9, 2) < 0.42) continue; // glades
    if (spots.some((s) => Math.hypot(s.x - x, s.z - z) < 3.2)) continue;
    spots.push({ x, z, h: 6 + rand() * 6, r: 2.2 + rand() * 1.6 });
  }

  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.5, 1, 6);
  trunkGeo.translate(0, 0.5, 0);
  const trunks = new THREE.InstancedMesh(
    trunkGeo,
    new THREE.MeshLambertMaterial({ color: 0x6b4a34, flatShading: true }),
    spots.length,
  );

  const BLOBS = 3;
  const leaves = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshLambertMaterial({ flatShading: true }),
    spots.length * BLOBS,
  );
  const greens = [0x2f7d3b, 0x3f9148, 0x57a653, 0x7bb85a, 0xc9b44a];

  spots.forEach((s, i) => {
    const y = groundHeight(s.x, s.z) - 0.2;
    dummy.position.set(s.x, y, s.z);
    dummy.rotation.set(0, rand() * 6.28, 0);
    dummy.scale.set(1 + s.h * 0.06, s.h, 1 + s.h * 0.06);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    const tint = greens[Math.floor(rand() * rand() * greens.length)];
    for (let b = 0; b < BLOBS; b++) {
      const spread = b === 0 ? 0 : s.r * 0.6;
      const a = rand() * 6.28;
      const size = s.r * (b === 0 ? 1 : 0.7);
      dummy.position.set(
        s.x + Math.cos(a) * spread,
        y + s.h + (b === 0 ? size * 0.4 : -size * 0.1 + rand()),
        s.z + Math.sin(a) * spread,
      );
      dummy.rotation.set(rand() * 6.28, rand() * 6.28, rand() * 6.28);
      dummy.scale.set(size, size * 0.8, size);
      dummy.updateMatrix();
      leaves.setMatrixAt(i * BLOBS + b, dummy.matrix);
      color.set(tint).offsetHSL(0, 0, (rand() - 0.5) * 0.08);
      leaves.setColorAt(i * BLOBS + b, color);
    }
  });

  const group = new THREE.Group();
  group.add(trunks, leaves);
  return group;
}

/** Small things that only matter once you are zoomed in: stones round the pools, mushrooms. */
function createDetails(): THREE.Group {
  const rand = mulberry32(99);
  const group = new THREE.Group();

  // Stones ringing each pool.
  const perPool = 14;
  const stones = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshLambertMaterial({ color: 0x8d9488, flatShading: true }),
    pools.length * perPool,
  );
  let n = 0;
  for (const p of pools) {
    for (let i = 0; i < perPool; i++) {
      const a = (i / perPool) * 6.28 + rand() * 0.3;
      const d = p.radius + 1.6 + rand() * 1.4;
      const x = p.x + Math.cos(a) * d;
      const z = p.z + Math.sin(a) * d;
      const s = 0.25 + rand() * 0.4;
      dummy.position.set(x, groundHeight(x, z) + s * 0.2, z);
      dummy.rotation.set(rand() * 6.28, rand() * 6.28, rand() * 6.28);
      dummy.scale.set(s, s * 0.7, s);
      dummy.updateMatrix();
      stones.setMatrixAt(n++, dummy.matrix);
    }
  }
  group.add(stones);

  // Mushrooms scattered through the wood.
  const count = 500;
  const stemGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.3, 5);
  stemGeo.translate(0, 0.15, 0);
  const capGeo = new THREE.ConeGeometry(0.2, 0.18, 6);
  capGeo.translate(0, 0.37, 0);
  const stems = new THREE.InstancedMesh(stemGeo, new THREE.MeshLambertMaterial({ color: 0xf2ead8 }), count);
  const caps = new THREE.InstancedMesh(capGeo, new THREE.MeshLambertMaterial({ flatShading: true }), count);
  const capColors = [0xd9483b, 0xe8a23a, 0xb98be0, 0xf2ead8];
  for (let i = 0; i < count; i++) {
    const a = rand() * 6.28;
    const d = Math.sqrt(rand()) * 100;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const y = groundHeight(x, z);
    const s = poolAt(x, z, 3) ? 0 : 0.7 + rand() * 1.6; // none under water
    dummy.position.set(x, y - 0.02, z);
    dummy.rotation.set(0, rand() * 6.28, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
    caps.setMatrixAt(i, dummy.matrix);
    caps.setColorAt(i, color.set(capColors[Math.floor(rand() * capColors.length)]));
  }
  group.add(stems, caps);
  return group;
}

export function createForest(): THREE.Group {
  const group = new THREE.Group();
  group.add(createTrees(), createDetails());
  return group;
}
