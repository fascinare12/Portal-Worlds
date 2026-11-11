import * as THREE from 'three';
import { lerp, smoothstep } from '../../noise';
import { groundHeight } from '../layout';
import type { Pool } from '../layout';

/**
 * A jellyfish made of light that comes up out of the ice-blue pool. It rises
 * above the water, drifts among the trees as if the air were sea, beating
 * slowly, then sinks back into the pool.
 */

export interface Jelly {
  group: THREE.Group;
  update(dt: number): void;
}

export function createJelly(pool: Pool, stirPool: () => void): Jelly {
  const group = new THREE.Group();
  group.visible = false;
  const light = (color: number, opacity: number) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });

  // The bell: a glassy dome with a brighter heart, and a bright rim.
  const bell = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), light(0x6fe3ff, 0.34));
  dome.scale.y = 0.7;
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), light(0xdff8ff, 0.5));
  heart.position.y = 0.22;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 8, 32).rotateX(Math.PI / 2), light(0xaef4ff, 0.8));
  bell.add(dome, heart, rim);
  group.add(bell);

  // Tentacles: each a curving strand, swaying from where it joins the rim.
  const strands: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const len = 2.2 + (i % 3) * 0.7;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      pts.push(new THREE.Vector3(Math.sin(t * 5 + i) * 0.16 * t, -t * len, Math.cos(t * 4 + i * 2) * 0.16 * t));
    }
    const strand = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.022, 5), light(0x8fe8ff, 0.55));
    strand.position.set(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85);
    group.add(strand);
    strands.push(strand);
  }

  let stage: 'away' | 'rise' | 'drift' | 'sink' = 'away';
  let clock = 0;
  let wait = new URLSearchParams(window.location.search).get('visit') === 'now' ? 3 : 70;
  let life = 0;
  const HOVER = 3.4;
  const DRIFT = 55;

  return {
    group,
    update(dt) {
      life += dt;
      clock += dt;
      if (stage === 'away') {
        if (clock < wait) return;
        group.visible = true;
        stirPool();
        stage = 'rise';
        clock = 0;
      }
      // Where it is: over the pool while rising and sinking; wandering a slow loop round it in between.
      let out = 0;
      let lift = HOVER;
      if (stage === 'rise') {
        lift = lerp(-1.2, HOVER, smoothstep(0, 6, clock));
        if (clock > 6) {
          stage = 'drift';
          clock = 0;
        }
      } else if (stage === 'drift') {
        out = smoothstep(0, 8, clock) * (1 - smoothstep(DRIFT - 9, DRIFT, clock));
        if (clock > DRIFT) {
          stage = 'sink';
          clock = 0;
        }
      } else if (stage === 'sink') {
        lift = lerp(HOVER, -1.6, smoothstep(0, 6, clock));
        if (clock > 3 && clock - dt <= 3) stirPool();
        if (clock > 6) {
          group.visible = false;
          stage = 'away';
          clock = 0;
          wait = 90 + Math.random() * 60;
          return;
        }
      }
      const a = life * 0.12;
      const x = pool.x + Math.cos(a) * (pool.radius + 5) * out;
      const z = pool.z + Math.sin(a * 1.3) * (pool.radius + 6) * out;
      // Each beat of the bell lifts it; between beats it settles.
      const beat = Math.sin(life * 1.7);
      const floor = Math.max(pool.level, groundHeight(x, z));
      group.position.set(x, lerp(pool.level, floor, out) + lift + beat * 0.12 + Math.sin(life * 0.3) * 0.5 * out, z);
      bell.scale.set(1 + beat * 0.14, 1 - beat * 0.1, 1 + beat * 0.14);
      group.rotation.z = Math.sin(life * 0.45) * 0.16;
      group.rotation.x = Math.cos(life * 0.38) * 0.12;
      strands.forEach((s, i) => {
        s.rotation.x = Math.sin(life * 1.3 + i) * 0.16 - beat * 0.08;
        s.rotation.z = Math.cos(life * 1.1 + i * 1.7) * 0.16;
      });
    },
  };
}
