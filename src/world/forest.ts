import * as THREE from 'three';
import { fbm, lerp, mulberry32, noise2, smoothstep } from '../noise';
import grassUrl from '../textures/grass.webp';
import spikeUrl from '../textures/spike.webp';
import sprigUrl from '../textures/sprig.webp';
import { createFoliage } from './foliage';
import { groundHeight, poolAt, pools, trees } from './layout';
import { paint, wind } from './paint';

const dummy = new THREE.Object3D();
const color = new THREE.Color();

/** Makes an instanced material sway gently; `amount` is in world units at the top of the shape. */
function addSway(mat: THREE.Material, amount: number, byHeight: boolean): void {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWind;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float swayPhase = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.27;
        float sway = sin(uWind * 0.9 + swayPhase) + 0.5 * sin(uWind * 2.3 + swayPhase * 1.7);
        float swayScale = ${byHeight ? 'max(position.y, 0.0) * 2.0' : '1.0'};
        transformed.x += sway * swayScale * ${amount.toFixed(3)};
        transformed.z += sway * swayScale * ${(amount * 0.6).toFixed(3)};`,
      );
  };
}

/** A lumpy leaf mass, shaded cool underneath and warm on top like a painted tree. */
function blobGeometry(): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i).normalize();
    const bump = 0.78 + noise2(n.x * 2.3 + n.z * 1.7 + 4, n.y * 2.3 - n.z * 1.1 + 4) * 0.5;
    pos.setXYZ(i, n.x * bump, n.y * bump, n.z * bump);
    nor.setXYZ(i, n.x, n.y, n.z);
    const t = smoothstep(-0.7, 0.9, n.y);
    colors[i * 3] = lerp(0.42, 1.2, t);
    colors[i * 3 + 1] = lerp(0.6, 1.16, t);
    colors[i * 3 + 2] = lerp(0.72, 0.92, t);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/** A tapering trunk with flared, mossy roots and a slight lean. */
function trunkGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.2, 0.4, 1, 8, 6, true);
  geo.translate(0, 0.5, 0);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const flare = 1 + 2.4 * Math.pow(Math.max(0, 0.16 - y) / 0.16, 2);
    pos.setX(i, pos.getX(i) * flare + Math.sin(y * 3) * 0.07);
    pos.setZ(i, pos.getZ(i) * flare);
    const t = smoothstep(0, 0.3, y);
    colors[i * 3] = lerp(0.45, 1, t);
    colors[i * 3 + 1] = lerp(0.75, 1, t);
    colors[i * 3 + 2] = lerp(0.5, 1, t);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function createTrees(): THREE.Group {
  const rand = mulberry32(22);
  const trunks = new THREE.InstancedMesh(
    trunkGeometry(),
    paint({ vertexColors: true, dab: 0.7 }),
    trees.length,
  );
  const barks = [0x5c4635, 0x6f5a47, 0x6f5a47, 0x8b8577, 0xd6cfbd];

  const BLOBS = 4;
  const leafMat = paint({ vertexColors: true, sway: 0.09, dab: 1.3 });
  const leaves = new THREE.InstancedMesh(blobGeometry(), leafMat, trees.length * BLOBS);
  // Dark cores inside the painted leaf cards (see foliage.ts), giving the crown depth.

  trees.forEach((t, i) => {
    const y = groundHeight(t.x, t.z) - 0.25;
    const width = 1 + t.h * 0.07;
    dummy.position.set(t.x, y, t.z);
    dummy.rotation.set((rand() - 0.5) * 0.1, rand() * 6.28, (rand() - 0.5) * 0.1);
    dummy.scale.set(width, t.h, width);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    trunks.setColorAt(i, color.set(barks[Math.floor(rand() * barks.length)]));

    for (let b = 0; b < BLOBS; b++) {
      const centre = b === 0;
      const a = (b / (BLOBS - 1)) * 6.28 + rand();
      const spread = centre ? 0 : t.r * 0.75;
      const size = t.r * (centre ? 1 : 0.62 + rand() * 0.2);
      dummy.position.set(
        t.x + Math.cos(a) * spread,
        y + t.h + (centre ? t.r * 0.35 : -t.r * 0.15 + rand() * t.r * 0.35),
        t.z + Math.sin(a) * spread,
      );
      dummy.rotation.set(0, rand() * 6.28, 0);
      dummy.scale.set(size * 0.62, size * 0.45, size * 0.62);
      dummy.updateMatrix();
      leaves.setMatrixAt(i * BLOBS + b, dummy.matrix);
      leaves.setColorAt(i * BLOBS + b, color.set(0x2f7350));
    }
  });

  const group = new THREE.Group();
  group.add(trunks, leaves);
  return group;
}

/** Two upright cards crossed at right angles, carrying a painted plant. */
function plantGeometry(): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let q = 0; q < 2; q++) {
    const dx = q === 0 ? 0.5 : 0;
    const dz = q === 0 ? 0 : 0.5;
    const o = q * 4;
    pos.push(-dx, 0, -dz, dx, 0, dz, dx, 1, dz, -dx, 1, -dz);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

interface PlantKind {
  url: string;
  count: number;
  /** Smallest and largest height in world units. */
  size: [number, number];
  tints: number[];
  /** Where this plant grows: returns true to accept a spot. */
  grows(x: number, z: number, chance: number): boolean;
}

/** Hand-painted grass and flowering plants scattered over the forest floor. */
function createGroundCover(): THREE.Group {
  const rand = mulberry32(314);
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();
  const geo = plantGeometry();

  const kinds: PlantKind[] = [
    {
      url: grassUrl,
      count: 9000,
      size: [0.5, 1.1],
      tints: [0xa9c79a, 0xc4d8a6, 0x9dbf95, 0xd8e2b0],
      grows: (x, z, chance) => fbm(x * 0.11 + 30, z * 0.11 + 30, 2) > 0.36 + chance * 0.2, // in drifts
    },
    {
      url: sprigUrl,
      count: 900,
      size: [0.7, 1.4],
      tints: [0xffffff, 0xe6efd8],
      grows: (x, z) => fbm(x * 0.06 + 200, z * 0.06 + 200, 2) > 0.57, // meadows
    },
    {
      url: spikeUrl,
      count: 500,
      size: [0.8, 1.6],
      tints: [0xffffff, 0xf2ead8],
      grows: (x, z) => fbm(x * 0.05 + 400, z * 0.05 + 400, 2) > 0.62, // rarer patches
    },
  ];

  for (const kind of kinds) {
    const map = loader.load(kind.url);
    map.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide });
    addSway(mat, 0.07, true);
    const mesh = new THREE.InstancedMesh(geo, mat, kind.count);
    let n = 0;
    let tries = 0;
    while (n < kind.count && tries++ < kind.count * 30) {
      const a = rand() * 6.28;
      const d = Math.sqrt(rand()) * 110;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      if (poolAt(x, z, 4)) continue; // keep clear of the water
      if (!kind.grows(x, z, rand())) continue;
      const h = lerp(kind.size[0], kind.size[1], rand());
      dummy.position.set(x, groundHeight(x, z) - 0.04, z);
      // A slight lean, so plants also show their faces when seen from above.
      dummy.rotation.set((rand() - 0.5) * 0.7, rand() * 6.28, (rand() - 0.5) * 0.7);
      dummy.scale.set(h, h, h);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      mesh.setColorAt(n, color.set(kind.tints[Math.floor(rand() * kind.tints.length)]));
      n++;
    }
    mesh.count = n;
    group.add(mesh);
  }
  return group;
}

/** Stones round the pools and mushrooms under the trees. */
function createDetails(): THREE.Group {
  const rand = mulberry32(99);
  const group = new THREE.Group();

  const perPool = 14;
  const stoneGeo = new THREE.DodecahedronGeometry(1, 1);
  const stones = new THREE.InstancedMesh(
    stoneGeo,
    paint({ color: 0x8f978c, dab: 0.8 }),
    pools.length * perPool,
  );
  let n = 0;
  for (const p of pools) {
    for (let i = 0; i < perPool; i++) {
      const a = (i / perPool) * 6.28 + rand() * 0.3;
      const d = p.radius + 1.6 + rand() * 1.4;
      const x = p.x + Math.cos(a) * d;
      const z = p.z + Math.sin(a) * d;
      const s = 0.25 + rand() * 0.45;
      dummy.position.set(x, groundHeight(x, z) + s * 0.15, z);
      dummy.rotation.set(rand() * 6.28, rand() * 6.28, rand() * 6.28);
      dummy.scale.set(s, s * 0.6, s * (0.7 + rand() * 0.5));
      dummy.updateMatrix();
      stones.setMatrixAt(n, dummy.matrix);
      stones.setColorAt(n, color.set(rand() < 0.4 ? 0x6f8f6a : 0x9aa096));
      n++;
    }
  }
  group.add(stones);

  const count = 420;
  const stemGeo = new THREE.CylinderGeometry(0.045, 0.07, 0.3, 6);
  stemGeo.translate(0, 0.15, 0);
  const capGeo = new THREE.SphereGeometry(0.2, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  capGeo.scale(1, 0.75, 1);
  capGeo.translate(0, 0.27, 0);
  const stems = new THREE.InstancedMesh(stemGeo, new THREE.MeshLambertMaterial({ color: 0xf2ead8 }), count);
  const caps = new THREE.InstancedMesh(capGeo, paint({ dab: 0.4 }), count);
  const capColors = [0xc9584a, 0xd99a4a, 0xb59ad6, 0xefe6d2, 0xc9584a];
  for (let i = 0; i < count; i++) {
    // Mushrooms gather at the feet of trees.
    const t = trees[Math.floor(rand() * trees.length)];
    const a = rand() * 6.28;
    const d = 0.9 + rand() * 2.2;
    const x = t.x + Math.cos(a) * d;
    const z = t.z + Math.sin(a) * d;
    const s = poolAt(x, z, 3) || Math.hypot(x, z) > 110 ? 0 : 0.7 + rand() * 1.5;
    dummy.position.set(x, groundHeight(x, z) - 0.02, z);
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
  group.add(createTrees(), createFoliage(), createGroundCover(), createDetails());
  return group;
}
