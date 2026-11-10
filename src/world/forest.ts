import * as THREE from 'three';
import { fbm, lerp, mulberry32, smoothstep } from '../noise';
import grassUrl from '../textures/grass.webp';
import spikeUrl from '../textures/spike.webp';
import sprigUrl from '../textures/sprig.webp';
import { daylight } from './daylight';
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

/**
 * A trunk drawn by hand rather than turned on a lathe: it leans and curves a
 * little, tapers towards the crown, and spreads into uneven roots at the foot.
 */
function trunkGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.16, 0.4, 1, 10, 10, true);
  geo.translate(0, 0.5, 0);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const angle = Math.atan2(pos.getZ(i), pos.getX(i));
    // Five roots of different sizes reach out at the base.
    const root = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(angle * 2.5 + 0.6)), 1.5);
    const flare = 1 + 3.2 * root * Math.pow(Math.max(0, 0.2 - y) / 0.2, 2);
    // The girth wavers slightly all the way up.
    const waver = 1 + 0.08 * Math.sin(y * 9 + angle * 2);
    pos.setX(i, pos.getX(i) * flare * waver + Math.sin(y * 2.6) * 0.11 + Math.sin(y * 7) * 0.02);
    pos.setZ(i, pos.getZ(i) * flare * waver + Math.sin(y * 3.4 + 1) * 0.07);
    // Moss creeps up from the roots.
    const t = smoothstep(0.02, 0.26, y);
    colors[i * 3] = lerp(0.5, 1, t);
    colors[i * 3 + 1] = lerp(0.85, 1, t);
    colors[i * 3 + 2] = lerp(0.5, 1, t);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function createTrees(): THREE.Group {
  const rand = mulberry32(22);
  const bark = paint({ vertexColors: true, dab: 0.7, bark: true });
  const trunks = new THREE.InstancedMesh(trunkGeometry(), bark, trees.length);
  const barks = [0x6a4a36, 0x7a5a44, 0x5d4a3e, 0x8a7868, 0xb9ab95];

  // Three boughs per tree reach from the trunk up into the side masses of leaves.
  const boughGeo = new THREE.CylinderGeometry(0.05, 0.15, 1, 6, 1, true);
  boughGeo.translate(0, 0.5, 0);
  const boughs = new THREE.InstancedMesh(boughGeo, bark, trees.length * 3);
  const up = new THREE.Vector3(0, 1, 0);
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();

  trees.forEach((t, i) => {
    const width = 1 + t.h * 0.07;
    dummy.position.set(t.x, t.base, t.z);
    dummy.rotation.set((rand() - 0.5) * 0.1, rand() * 6.28, (rand() - 0.5) * 0.1);
    dummy.scale.set(width, t.h + t.r * 0.3, width);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    color.set(barks[Math.floor(rand() * barks.length)]);
    trunks.setColorAt(i, color);

    for (let b = 0; b < 3; b++) {
      const c = t.clumps[b + 1];
      from.set(t.x, t.base + t.h * (0.62 + rand() * 0.18), t.z);
      to.set(c.x, c.y, c.z).sub(from);
      dummy.position.copy(from);
      dummy.quaternion.setFromUnitVectors(up, to.clone().normalize());
      dummy.scale.set(width, to.length(), width);
      dummy.updateMatrix();
      boughs.setMatrixAt(i * 3 + b, dummy.matrix);
      boughs.setColorAt(i * 3 + b, color);
    }
  });
  dummy.rotation.set(0, 0, 0);

  const group = new THREE.Group();
  group.add(trunks, boughs);
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
function createGroundCover(): { group: THREE.Group; meshes: THREE.InstancedMesh[] } {
  const rand = mulberry32(314);
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();
  const geo = plantGeometry();
  const meshes: THREE.InstancedMesh[] = [];

  const kinds: PlantKind[] = [
    {
      url: grassUrl,
      count: 48000,
      size: [0.5, 1.1],
      tints: [0xa9c79a, 0xc4d8a6, 0x9dbf95, 0xd8e2b0],
      grows: (x, z, chance) => fbm(x * 0.11 + 30, z * 0.11 + 30, 2) > 0.14 + chance * 0.18, // nearly everywhere, thinner in places
    },
    {
      url: sprigUrl,
      count: 7000,
      size: [0.7, 1.4],
      tints: [0xffffff, 0xe6efd8],
      grows: (x, z) => fbm(x * 0.06 + 200, z * 0.06 + 200, 2) > 0.47, // meadows
    },
    {
      url: spikeUrl,
      count: 4000,
      size: [0.8, 1.6],
      tints: [0xffffff, 0xf2ead8],
      grows: (x, z) => fbm(x * 0.05 + 400, z * 0.05 + 400, 2) > 0.5, // rarer patches
    },
  ];

  for (const kind of kinds) {
    const map = loader.load(kind.url);
    map.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide });
    mat.color = daylight.ambient; // painted plants dim and cool with the light
    addSway(mat, 0.07, true);
    const mesh = new THREE.InstancedMesh(geo, mat, kind.count);
    let n = 0;
    let tries = 0;
    while (n < kind.count && tries++ < kind.count * 30) {
      const a = rand() * 6.28;
      const d = Math.sqrt(rand()) * 110;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      // Grow right down the bank to the waterline, but not in the water itself.
      const pool = poolAt(x, z, 6);
      if (pool && groundHeight(x, z) < pool.level + 0.04) continue;
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
    mesh.userData.full = n;
    meshes.push(mesh);
    group.add(mesh);
  }
  return { group, meshes };
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

  const count = 520;
  // A stem that swells towards the foot, with a ring left by the cap.
  const stemGeo = new THREE.CylinderGeometry(0.04, 0.075, 0.3, 8, 4);
  stemGeo.translate(0, 0.15, 0);
  {
    const sp = stemGeo.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      const y = sp.getY(i);
      const swell = 1 + 0.5 * Math.pow(1 - y / 0.3, 3) + (Math.abs(y - 0.19) < 0.03 ? 0.45 : 0);
      sp.setX(i, sp.getX(i) * swell + Math.sin(y * 9) * 0.012);
      sp.setZ(i, sp.getZ(i) * swell);
    }
    stemGeo.computeVertexNormals();
  }
  // A domed cap with a wavy rim, darker towards the edge and pale underneath.
  const capGeo = new THREE.SphereGeometry(0.2, 14, 7, 0, Math.PI * 2, 0, Math.PI * 0.58);
  capGeo.scale(1, 0.72, 1);
  {
    const cp = capGeo.attributes.position;
    const cc = new Float32Array(cp.count * 3);
    for (let i = 0; i < cp.count; i++) {
      const y = cp.getY(i);
      const angle = Math.atan2(cp.getZ(i), cp.getX(i));
      const edge = 1 - smoothstep(-0.02, 0.1, y); // 1 at the rim, 0 at the crown
      const wave = 1 + edge * 0.1 * Math.sin(angle * 5);
      cp.setX(i, cp.getX(i) * wave);
      cp.setZ(i, cp.getZ(i) * wave);
      cp.setY(i, y + edge * 0.02 * Math.sin(angle * 3 + 1));
      const tone = y < -0.005 ? 1.25 : lerp(1.1, 0.72, edge);
      cc.set([tone, tone, tone * (y < -0.005 ? 0.9 : 1)], i * 3);
    }
    capGeo.setAttribute('color', new THREE.BufferAttribute(cc, 3));
    capGeo.computeVertexNormals();
  }
  capGeo.translate(0, 0.28, 0);
  const stems = new THREE.InstancedMesh(stemGeo, paint({ color: 0xf2ead8, dab: 0.3 }), count);
  const caps = new THREE.InstancedMesh(capGeo, paint({ vertexColors: true, dab: 0.4, spots: true }), count);
  const capColors = [0xc9584a, 0xd99a4a, 0xb59ad6, 0xefe6d2, 0xc9584a, 0x6fa8c9];
  for (let i = 0; i < count; i++) {
    // Mushrooms gather at the feet of trees.
    const t = trees[Math.floor(rand() * trees.length)];
    const a = rand() * 6.28;
    const d = 0.9 + rand() * 2.2;
    const x = t.x + Math.cos(a) * d;
    const z = t.z + Math.sin(a) * d;
    // Most are small; now and then one grows as tall as a child's knee.
    const grown = rand() < 0.1 ? 2.6 + rand() * 1.6 : 0.9 + rand() * 1.6;
    const s = poolAt(x, z, 3) || Math.hypot(x, z) > 110 ? 0 : grown;
    dummy.position.set(x, groundHeight(x, z) - 0.02, z);
    dummy.rotation.set((rand() - 0.5) * 0.3, rand() * 6.28, (rand() - 0.5) * 0.3);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
    caps.setMatrixAt(i, dummy.matrix);
    caps.setColorAt(i, color.set(capColors[Math.floor(rand() * capColors.length)]));
  }
  group.add(stems, caps);
  return group;
}

export interface Forest {
  group: THREE.Group;
  /** 1 = everything; lower values thin leaves and plants for slower devices. */
  setDensity(amount: number): void;
}

export function createForest(): Forest {
  const group = new THREE.Group();
  const foliage = createFoliage();
  const cover = createGroundCover();
  group.add(createTrees(), foliage.mesh, cover.group, createDetails());
  return {
    group,
    setDensity(amount) {
      foliage.setDensity(amount);
      for (const m of cover.meshes) m.count = Math.round(m.userData.full * amount);
    },
  };
}
