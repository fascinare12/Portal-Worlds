import * as THREE from 'three';
import type { Pool } from '../layout';

/**
 * Shooting stars: now and then one leaves the night pool, climbs away over the
 * trees with a tail of light behind it, and burns out.
 */
export function createMeteors(pool: Pool, stirPool: () => void): { group: THREE.Group; update(dt: number): void } {
  const group = new THREE.Group();
  const TAIL = 46;
  const STREAKS = 3;
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), STREAKS * TAIL);
  beads.frustumCulled = false;
  group.add(beads);
  const streaks = Array.from({ length: STREAKS }, () => ({ t: -1, from: new THREE.Vector3(), dir: new THREE.Vector3(), speed: 0 }));
  const soon = new URLSearchParams(window.location.search).get('visit') === 'now';
  let wait = soon ? 2.5 : 9;
  const m4 = new THREE.Matrix4();
  const at = new THREE.Vector3();
  const size = new THREE.Vector3();
  const none = new THREE.Quaternion();
  const tint = new THREE.Color();
  const LASTS = 1.7;
  return {
    group,
    update(dt) {
      wait -= dt;
      if (wait <= 0) {
        // Usually one; sometimes two in quick succession.
        wait = soon ? 4 : 7 + Math.random() * 16;
        const free = streaks.find((s) => s.t < 0);
        if (free) {
          const around = Math.random() * Math.PI * 2;
          const up = 0.5 + Math.random() * 0.45;
          free.t = 0;
          free.from.set(pool.x + Math.cos(around) * pool.radius * 0.3, pool.level + 0.2, pool.z + Math.sin(around) * pool.radius * 0.3);
          free.dir.set(Math.cos(around) * Math.cos(up), Math.sin(up), Math.sin(around) * Math.cos(up));
          free.speed = 20 + Math.random() * 10;
          stirPool();
          if (Math.random() < 0.25) wait = 0.5;
        }
      }
      streaks.forEach((s, k) => {
        if (s.t >= 0) s.t += dt;
        if (s.t > LASTS) s.t = -1;
        for (let i = 0; i < TAIL; i++) {
          // Each bead is where the head was a moment ago; the further back, the smaller and bluer.
          const when = s.t - i * 0.007;
          const shown = s.t >= 0 && when > 0;
          const fade = shown ? Math.max(0, 1 - s.t / LASTS) * (1 - i / TAIL) : 0;
          // It climbs fast and curves over, as if the air were slowing it.
          const far = s.speed * when * (1 - 0.22 * when);
          at.copy(s.from).addScaledVector(s.dir, far);
          at.y -= 2.2 * when * when;
          size.setScalar(shown ? 0.03 + 0.17 * fade : 0);
          m4.compose(at, none, size);
          beads.setMatrixAt(k * TAIL + i, m4);
          beads.setColorAt(k * TAIL + i, tint.setRGB(0.6 + 0.4 * fade, 0.75 + 0.25 * fade, 1).multiplyScalar(fade));
        }
      });
      beads.instanceMatrix.needsUpdate = true;
      if (beads.instanceColor) beads.instanceColor.needsUpdate = true;
    },
  };
}
