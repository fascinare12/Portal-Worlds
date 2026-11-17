import * as THREE from 'three';
import { mobiusGeometry, mobiusNormal, mobiusPoint } from '../../mobius';
import type { Pool } from '../layout';

/**
 * What lives in the white pool: a band with one side, turning slowly half out
 * of the water, and a line of ants walking it. Each ant goes round once on
 * top, once underneath, and is back where it began without ever crossing an
 * edge. It is the shape of the world on the other side.
 */
export function createMobius(pool: Pool): { group: THREE.Group; update(dt: number): void } {
  const group = new THREE.Group();
  const radius = pool.radius * 0.5;
  const tilt = new THREE.Group();
  tilt.rotation.set(0.45, 0, 0.25);
  const band = new THREE.Mesh(mobiusGeometry(radius, radius * 0.3), new THREE.MeshLambertMaterial({ color: 0xfbfaf6, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.25 }));
  tilt.add(band);

  const ANTS = 14;
  const ants = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshLambertMaterial({ color: 0x2a2622 }), ANTS * 3);
  tilt.add(ants);
  group.add(tilt);
  group.position.set(pool.x, pool.level + radius * 0.62, pool.z);

  const at = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const along = new THREE.Vector3();
  const m4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const size = new THREE.Vector3();
  const forward = new THREE.Vector3(1, 0, 0);
  let t = 0;
  return {
    group,
    update(dt) {
      t += dt;
      tilt.rotation.y = t * 0.16;
      group.position.y = pool.level + radius * 0.62 + Math.sin(t * 0.6) * radius * 0.05;
      for (let i = 0; i < ANTS; i++) {
        // Twice round the band is once round the ant's whole walk.
        const s = t * 0.35 + (i / ANTS) * Math.PI * 4;
        mobiusPoint(s, 0, radius, at);
        mobiusPoint(s + 0.05, 0, radius, ahead);
        mobiusNormal(s, normal);
        along.subVectors(ahead, at).normalize();
        quat.setFromUnitVectors(forward, along);
        // Three beads to an ant: head, middle, tail.
        for (let part = 0; part < 3; part++) {
          const r = radius * [0.035, 0.028, 0.045][part];
          size.set(r * 1.3, r, r);
          m4.compose(ahead.copy(at).addScaledVector(along, (1 - part) * radius * 0.07).addScaledVector(normal, r * 1.1), quat, size);
          ants.setMatrixAt(i * 3 + part, m4);
        }
      }
      ants.instanceMatrix.needsUpdate = true;
    },
  };
}
