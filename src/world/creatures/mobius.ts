import * as THREE from 'three';
import { mobiusGeometry, mobiusNormal, mobiusPoint } from '../../mobius';
import { mulberry32 } from '../../noise';
import { groundHeight } from '../layout';
import type { Pool } from '../layout';

/**
 * What lives in the white pool: a band with one side, turning slowly half out
 * of the water, and a single ant walking it. The ant goes round once on top,
 * once underneath, and is back where it began without ever crossing an edge.
 *
 * The rest of the ants are visitors to the wood. Each crawls up out of the
 * water, wanders about the bank, walks one figure of eight, and crawls back
 * in; then, after a while, comes out again somewhere else.
 */

type Doing = 'under' | 'out' | 'wander' | 'eight' | 'home';
interface Walker {
  x: number;
  z: number;
  heading: number;
  doing: Doing;
  /** Seconds left of whatever it is doing. */
  left: number;
  /** For the figure of eight: where it is centred, which way it lies, and how far round it has got. */
  cx: number;
  cz: number;
  lie: number;
  round: number;
}

export function createMobius(pool: Pool): { group: THREE.Group; update(dt: number): void } {
  const group = new THREE.Group();
  const radius = pool.radius * 0.5;
  // The band, and the one ant on it, float and turn together.
  const float = new THREE.Group();
  const tilt = new THREE.Group();
  tilt.rotation.set(0.45, 0, 0.25);
  const band = new THREE.Mesh(mobiusGeometry(radius, radius * 0.3), new THREE.MeshLambertMaterial({ color: 0xfbfaf6, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.25 }));
  const dark = new THREE.MeshLambertMaterial({ color: 0x2a2622 });
  const bead = new THREE.SphereGeometry(1, 8, 6);
  const rider = new THREE.InstancedMesh(bead, dark, 3);
  const riderLegs = new THREE.InstancedMesh(bead, dark, 6);
  tilt.add(band, rider, riderLegs);
  float.add(tilt);
  float.position.set(pool.x, pool.level + radius * 0.62, pool.z);

  // The ants on the ground are placed in the wood itself, not on the band.
  const WALKERS = 11;
  const crowd = new THREE.InstancedMesh(bead, dark, WALKERS * 3);
  crowd.frustumCulled = false;
  const crowdLegs = new THREE.InstancedMesh(bead, dark, WALKERS * 6);
  crowdLegs.frustumCulled = false;
  group.add(float, crowd, crowdLegs);

  const rand = mulberry32(31);
  const SPEED = 0.85;
  const EIGHT = radius * 0.9; // half the length of the figure of eight
  const walkers: Walker[] = Array.from({ length: WALKERS }, (_, i) => ({ x: pool.x, z: pool.z, heading: 0, doing: 'under' as Doing, left: i * 1.7 + rand() * 2, cx: 0, cz: 0, lie: 0, round: 0 }));
  const away = (w: Walker) => Math.hypot(w.x - pool.x, w.z - pool.z);

  const at = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const along = new THREE.Vector3();
  const m4 = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const size = new THREE.Vector3();
  const forward = new THREE.Vector3(1, 0, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const BEADS = [0.035, 0.028, 0.045]; // head, middle, tail
  let t = 0;
  const side = new THREE.Vector3();
  const reach = new THREE.Vector3();
  const root = new THREE.Vector3();
  /**
   * Six legs for one ant: three a side, splayed out and down from the middle of its body, the
   * front and back of one side stepping with the middle of the other, as real ants walk.
   */
  function legs(mesh: THREE.InstancedMesh, first: number, body: THREE.Vector3, fwd: THREE.Vector3, upward: THREE.Vector3, long: number, stride: number): void {
    side.crossVectors(fwd, upward).normalize();
    for (let leg = 0; leg < 6; leg++) {
      const which = leg < 3 ? 1 : -1;
      const along3 = (leg % 3) - 1; // back, middle, front
      const swing = Math.sin(stride + (leg % 2 ? Math.PI : 0) + (which > 0 ? 0 : Math.PI)) * 0.35;
      reach.copy(side).multiplyScalar(which).addScaledVector(upward, -0.75).addScaledVector(fwd, along3 * 0.55 + swing).normalize();
      root.copy(body).addScaledVector(fwd, along3 * long * 0.22).addScaledVector(reach, long * 0.5);
      quat.setFromUnitVectors(forward, reach);
      size.set(long * 0.5, long * 0.05, long * 0.05);
      m4.compose(root, quat, size);
      mesh.setMatrixAt(first + leg, m4);
    }
  }

  function walk(w: Walker, dt: number): void {
    w.left -= dt;
    if (w.doing === 'under') {
      if (w.left > 0) return;
      // Up and out, by whichever part of the bank it happens to face.
      w.heading = rand() * Math.PI * 2;
      w.x = pool.x;
      w.z = pool.z;
      w.doing = 'out';
    } else if (w.doing === 'out') {
      // It is out once the ground under it is clear of the water.
      if (groundHeight(w.x, w.z) > pool.level + 0.25 || away(w) > pool.radius + 6) {
        w.doing = 'wander';
        w.left = 5 + rand() * 17;
      }
    } else if (w.doing === 'wander') {
      w.heading += (rand() - 0.5) * 2.6 * dt;
      // Not too far from the pool, and not back into it yet.
      const d = away(w);
      const toPool = Math.atan2(pool.z - w.z, pool.x - w.x);
      const pull = d > pool.radius + 6.5 ? 1 : groundHeight(w.x, w.z) < pool.level + 0.2 ? -1 : 0;
      if (pull) {
        const want = pull > 0 ? toPool : toPool + Math.PI;
        w.heading += Math.atan2(Math.sin(want - w.heading), Math.cos(want - w.heading)) * 2 * dt;
      }
      if (w.left <= 0) {
        // The figure of eight starts here, setting off the way the ant is already facing.
        w.doing = 'eight';
        w.cx = w.x;
        w.cz = w.z;
        w.lie = w.heading - Math.PI / 4;
        w.round = 0;
      }
    } else if (w.doing === 'eight') {
      // A lemniscate: out round one loop, back through the middle, round the other, and home to the middle.
      w.round += (dt * SPEED) / (EIGHT * 0.97);
      const a = Math.min(w.round, Math.PI * 2);
      const lx = Math.sin(a) * EIGHT;
      const lz = Math.sin(a) * Math.cos(a) * EIGHT;
      const nx = w.cx + lx * Math.cos(w.lie) - lz * Math.sin(w.lie);
      const nz = w.cz + lx * Math.sin(w.lie) + lz * Math.cos(w.lie);
      if (nx !== w.x || nz !== w.z) w.heading = Math.atan2(nz - w.z, nx - w.x);
      w.x = nx;
      w.z = nz;
      if (w.round >= Math.PI * 2) w.doing = 'home';
      return;
    } else if (w.doing === 'home') {
      const want = Math.atan2(pool.z - w.z, pool.x - w.x);
      w.heading += Math.atan2(Math.sin(want - w.heading), Math.cos(want - w.heading)) * 3 * dt;
      if (away(w) < 0.4) {
        w.doing = 'under';
        w.left = 2 + rand() * 14;
      }
    }
    w.x += Math.cos(w.heading) * SPEED * dt;
    w.z += Math.sin(w.heading) * SPEED * dt;
  }

  return {
    group,
    update(dt) {
      t += dt;
      tilt.rotation.y = t * 0.16;
      float.position.y = pool.level + radius * 0.62 + Math.sin(t * 0.6) * radius * 0.05;

      // The one ant on the band. Twice round the band is once round its whole walk.
      const s = t * 0.35;
      mobiusPoint(s, 0, radius, at);
      mobiusPoint(s + 0.05, 0, radius, ahead);
      mobiusNormal(s, normal);
      along.subVectors(ahead, at).normalize();
      quat.setFromUnitVectors(forward, along);
      for (let part = 0; part < 3; part++) {
        const r = radius * BEADS[part] * 1.25;
        size.set(r * 1.3, r, r);
        m4.compose(ahead.copy(at).addScaledVector(along, (1 - part) * radius * 0.085).addScaledVector(normal, r * 1.1), quat, size);
        rider.setMatrixAt(part, m4);
      }
      mobiusPoint(s, 0, radius, at);
      legs(riderLegs, 0, at.addScaledVector(normal, radius * 0.05), along, normal, radius * 0.11, t * 9);
      rider.instanceMatrix.needsUpdate = true;
      riderLegs.instanceMatrix.needsUpdate = true;

      // The ants in the wood. Under the water they are simply out of sight.
      walkers.forEach((w, i) => {
        walk(w, dt);
        const hidden = w.doing === 'under';
        along.set(Math.cos(w.heading), 0, Math.sin(w.heading));
        quat.setFromAxisAngle(up, -w.heading);
        for (let part = 0; part < 3; part++) {
          // Bigger than the one on the band, so that they can be seen from where the wood is usually watched.
          const r = hidden ? 0 : radius * BEADS[part] * 2.4;
          const px = w.x + along.x * (1 - part) * radius * 0.16;
          const pz = w.z + along.z * (1 - part) * radius * 0.16;
          size.set(r * 1.3, r, r);
          m4.compose(at.set(px, groundHeight(px, pz) + r * 0.9, pz), quat, size);
          crowd.setMatrixAt(i * 3 + part, m4);
        }
        const long = hidden ? 0 : radius * 0.2;
        legs(crowdLegs, i * 6, at.set(w.x, groundHeight(w.x, w.z) + radius * 0.09, w.z), along, up, long, t * 9 + i);
      });
      crowd.instanceMatrix.needsUpdate = true;
      crowdLegs.instanceMatrix.needsUpdate = true;
    },
  };
}
