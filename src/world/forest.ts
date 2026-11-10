import * as THREE from 'three';
import { fbm, lerp, mulberry32, noise2, smoothstep } from '../noise';
import { groundHeight, poolAt, pools, trees } from './layout';

const dummy = new THREE.Object3D();
const color = new THREE.Color();

/** Shared clock for the breeze that moves leaves and grass. */
export const wind = { value: 0 };

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
    new THREE.MeshLambertMaterial({ vertexColors: true }),
    trees.length,
  );
  const barks = [0x5c4635, 0x6f5a47, 0x6f5a47, 0x8b8577, 0xd6cfbd];

  const BLOBS = 4;
  const leafMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  addSway(leafMat, 0.09, false);
  const leaves = new THREE.InstancedMesh(blobGeometry(), leafMat, trees.length * BLOBS);
  // Mostly greens from deep teal to spring; a few amber and rose trees for accent.
  const foliage = [0x1f5d4a, 0x2e7a4f, 0x4c9a55, 0x79b05a, 0xa7bf5c];
  const accents = [0xd9a441, 0xc97b63, 0xe6c15a];

  trees.forEach((t, i) => {
    const y = groundHeight(t.x, t.z) - 0.25;
    const width = 1 + t.h * 0.07;
    dummy.position.set(t.x, y, t.z);
    dummy.rotation.set((rand() - 0.5) * 0.1, rand() * 6.28, (rand() - 0.5) * 0.1);
    dummy.scale.set(width, t.h, width);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    trunks.setColorAt(i, color.set(barks[Math.floor(rand() * barks.length)]));

    const tint =
      rand() < 0.09 ? accents[Math.floor(rand() * accents.length)] : foliage[Math.floor(rand() * foliage.length)];
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
      dummy.scale.set(size, size * 0.72, size);
      dummy.updateMatrix();
      leaves.setMatrixAt(i * BLOBS + b, dummy.matrix);
      leaves.setColorAt(i * BLOBS + b, color.set(tint).offsetHSL((rand() - 0.5) * 0.03, 0, (rand() - 0.5) * 0.08));
    }
  });

  const group = new THREE.Group();
  group.add(trunks, leaves);
  return group;
}

/** Grass tufts and drifts of small flowers. */
function createGroundCover(): THREE.Group {
  const rand = mulberry32(314);
  const group = new THREE.Group();

  // One tuft: three thin blades, dark at the root and bright at the tip.
  const blades = 4;
  const bp = new Float32Array(blades * 9);
  const bc = new Float32Array(blades * 9);
  const bn = new Float32Array(blades * 9);
  for (let b = 0; b < blades; b++) {
    const a = (b / blades) * 6.28;
    const cx = Math.cos(a) * 0.07;
    const cz = Math.sin(a) * 0.07;
    const w = 0.03;
    bp.set([cx - cz * w * 14, 0, cz + cx * w * 14, cx + cz * w * 14, 0, cz - cx * w * 14, cx * 3.2, 0.5, cz * 3.2], b * 9);
    bc.set([0.62, 0.74, 0.62, 0.62, 0.74, 0.62, 1.12, 1.16, 0.85], b * 9);
    bn.set([0, 1, 0, 0, 1, 0, 0, 1, 0], b * 9);
  }
  const tuftGeo = new THREE.BufferGeometry();
  tuftGeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  tuftGeo.setAttribute('color', new THREE.BufferAttribute(bc, 3));
  tuftGeo.setAttribute('normal', new THREE.BufferAttribute(bn, 3));
  // Unlit, so both faces of a blade keep their painted colour.
  const tuftMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
  addSway(tuftMat, 0.06, true);

  const TUFTS = 16000;
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, TUFTS);
  const grassTints = [0x5a9448, 0x74a850, 0x8fb858, 0x4c8650];
  let n = 0;
  let tries = 0;
  while (n < TUFTS && tries++ < TUFTS * 6) {
    const a = rand() * 6.28;
    const d = Math.sqrt(rand()) * 112;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (poolAt(x, z, 2.2)) continue;
    if (fbm(x * 0.11 + 30, z * 0.11 + 30, 2) < 0.38 + rand() * 0.2) continue; // grow in drifts
    const s = 0.55 + rand() * 0.8;
    dummy.position.set(x, groundHeight(x, z) - 0.03, z);
    dummy.rotation.set(0, rand() * 6.28, 0);
    dummy.scale.set(s, s * (0.7 + rand() * 0.8), s);
    dummy.updateMatrix();
    tufts.setMatrixAt(n, dummy.matrix);
    tufts.setColorAt(n, color.set(grassTints[Math.floor(rand() * grassTints.length)]));
    n++;
  }
  tufts.count = n;
  group.add(tufts);

  const FLOWERS = 2600;
  const flowerGeo = new THREE.IcosahedronGeometry(0.055, 0);
  flowerGeo.scale(1, 0.6, 1);
  flowerGeo.translate(0, 0.26, 0);
  const flowerMat = new THREE.MeshLambertMaterial({ emissive: 0x333333 });
  addSway(flowerMat, 0.05, false);
  const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, FLOWERS);
  const petals = [0xffffff, 0xfff1a8, 0xbcd6ff, 0xf7c1dc, 0xd9c2ff];
  n = 0;
  tries = 0;
  while (n < FLOWERS && tries++ < FLOWERS * 30) {
    const a = rand() * 6.28;
    const d = Math.sqrt(rand()) * 105;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (poolAt(x, z, 2.2)) continue;
    const patch = fbm(x * 0.06 + 200, z * 0.06 + 200, 2);
    if (patch < 0.58) continue; // meadows of flowers, not an even sprinkle
    const s = 0.7 + rand() * 0.8;
    dummy.position.set(x, groundHeight(x, z), z);
    dummy.rotation.set(0, rand() * 6.28, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    flowers.setMatrixAt(n, dummy.matrix);
    // Each meadow leans towards one colour.
    const pick = Math.floor(noise2(x * 0.02 + 5, z * 0.02 + 5) * petals.length + rand() * 1.2) % petals.length;
    flowers.setColorAt(n, color.set(petals[pick]));
    n++;
  }
  flowers.count = n;
  group.add(flowers);
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
    new THREE.MeshLambertMaterial({ color: 0x8f978c }),
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
  const caps = new THREE.InstancedMesh(capGeo, new THREE.MeshLambertMaterial(), count);
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
  group.add(createTrees(), createGroundCover(), createDetails());
  return group;
}
