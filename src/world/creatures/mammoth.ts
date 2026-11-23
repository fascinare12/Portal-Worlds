import * as THREE from 'three';
import { groundHeight } from '../layout';
import type { Pool } from '../layout';

/**
 * A woolly mammoth, out of the ochre pool: the one that leads to the painted
 * cave. Now and then it climbs up out of the water, walks a slow turn about
 * the bank with its trunk swinging, and goes back in.
 *
 * It is built of a few plain shapes, in the brown of the cave's own painting
 * of it, with tusks of the same white.
 */

type Doing = 'under' | 'out' | 'round' | 'home';

export function createMammoth(pool: Pool, stirPool: () => void): { group: THREE.Group; update(dt: number): void } {
  const group = new THREE.Group();
  const beast = new THREE.Group();
  group.add(beast);
  const coat = new THREE.MeshLambertMaterial({ color: 0x7a4a32, flatShading: true });
  const dark = new THREE.MeshLambertMaterial({ color: 0x4a2c1e, flatShading: true });
  const ivory = new THREE.MeshLambertMaterial({ color: 0xece3d2, flatShading: true });
  const lump = (r: number, sx: number, sy: number, sz: number, x: number, y: number, z: number, mat = coat, parent: THREE.Object3D = beast) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  // It faces along +x. A high shoulder sloping away to a low rump; a domed head.
  lump(1, 1.25, 1.0, 0.82, 0.1, 2.05, 0);
  lump(1, 0.95, 0.85, 0.74, -0.75, 1.8, 0);
  lump(0.62, 1, 1.05, 0.95, 0.75, 2.75, 0);
  const head = new THREE.Group();
  head.position.set(1.35, 2.5, 0);
  beast.add(head);
  lump(0.62, 1, 1.15, 0.92, 0.1, 0.25, 0, coat, head);
  lump(0.3, 0.25, 1, 0.8, -0.1, 0.25, 0.58, dark, head);
  lump(0.3, 0.25, 1, 0.8, -0.1, 0.25, -0.58, dark, head);
  // The trunk: a chain of pieces, each hung from the one above, so that it swings.
  const trunk: THREE.Group[] = [];
  let hang: THREE.Object3D = head;
  for (let i = 0; i < 5; i++) {
    const joint = new THREE.Group();
    joint.position.set(i === 0 ? 0.5 : 0, i === 0 ? -0.1 : -0.34, 0);
    hang.add(joint);
    lump(0.22 - i * 0.022, 1, 1.3, 1, 0, -0.17, 0, coat, joint);
    trunk.push(joint);
    hang = joint;
  }
  // The tusks: each a curve of beads, out, down, and up again at the tip.
  for (const side of [1, -1]) {
    for (let i = 0; i < 7; i++) {
      const a = i / 6;
      lump(0.1 - a * 0.045, 1, 1, 1, 0.42 + Math.sin(a * 2.4) * 0.95, -0.25 - Math.sin(a * Math.PI) * 0.55 + a * 0.5, side * (0.3 + Math.sin(a * Math.PI) * 0.25), ivory, head);
    }
  }
  // Four legs, each swinging from the top.
  const legs: THREE.Group[] = [];
  for (const [x, z] of [[0.75, 0.42], [0.75, -0.42], [-0.9, 0.4], [-0.9, -0.4]]) {
    const leg = new THREE.Group();
    leg.position.set(x, 1.45, z);
    beast.add(leg);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.3, 1.45, 7), coat);
    shin.position.y = -0.72;
    leg.add(shin);
    legs.push(leg);
  }
  lump(0.09, 1, 3, 1, -1.62, 1.75, 0, dark);
  beast.scale.setScalar(0.62);

  const soon = new URLSearchParams(window.location.search).get('visit') === 'now';
  let doing: Doing = 'under';
  let wait = soon ? 3 : 20 + Math.random() * 25;
  let x = pool.x;
  let z = pool.z;
  let heading = 0;
  let round = 0;
  let stride = 0;
  let depth = 1;
  const SPEED = 0.75;
  const away = () => Math.hypot(x - pool.x, z - pool.z);
  beast.visible = false;

  return {
    group,
    update(dt) {
      if (doing === 'under') {
        wait -= dt;
        if (wait > 0) return;
        heading = Math.random() * Math.PI * 2;
        x = pool.x;
        z = pool.z;
        doing = 'out';
        depth = 1;
        beast.visible = true;
        stirPool();
        return;
      }
      if (doing === 'out') {
        if (away() > pool.radius + 2.2) {
          doing = 'round';
          round = 0;
        }
      } else if (doing === 'round') {
        // A slow turn about the pool, keeping its distance.
        const want = Math.atan2(z - pool.z, x - pool.x) + Math.PI / 2 + (away() > pool.radius + 3 ? 0.5 : -0.2);
        heading += Math.atan2(Math.sin(want - heading), Math.cos(want - heading)) * 1.2 * dt;
        round += dt;
        if (round > 26) doing = 'home';
      } else {
        const want = Math.atan2(pool.z - z, pool.x - x);
        heading += Math.atan2(Math.sin(want - heading), Math.cos(want - heading)) * 1.5 * dt;
        if (away() < 0.5) {
          doing = 'under';
          wait = soon ? 6 : 40 + Math.random() * 50;
          beast.visible = false;
          stirPool();
          return;
        }
      }
      x += Math.cos(heading) * SPEED * dt;
      z += Math.sin(heading) * SPEED * dt;
      stride += dt * 2.6;
      // Over the water it wades, sunk to the shoulder; on the bank it stands on the ground.
      const inWater = away() < pool.radius * 0.9;
      depth += ((inWater ? 1 : 0) - depth) * Math.min(1, dt * 1.5);
      const ground = Math.max(groundHeight(x, z), pool.level - 0.7);
      beast.position.set(x, ground - depth * 0.55 + Math.abs(Math.sin(stride * 2)) * 0.03, z);
      beast.rotation.y = -heading;
      legs.forEach((leg, i) => (leg.rotation.z = Math.sin(stride + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.38));
      trunk.forEach((joint, i) => (joint.rotation.z = -0.12 - i * 0.05 + Math.sin(stride * 0.8 - i * 0.6) * 0.14));
      head.rotation.z = Math.sin(stride * 0.8) * 0.05;
    },
  };
}
