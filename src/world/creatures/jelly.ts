import * as THREE from 'three';
import { lerp, smoothstep } from '../../noise';
import { groundHeight } from '../layout';
import type { Pool } from '../layout';
import { makeJellyfish } from './jellyModel';

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
  // The same kind of jellyfish as swims in the sea beyond: a beating bell, fine tentacles
  // and broad frilled arms, all rippling. A little brighter here, to show in daylight.
  const time = { value: 0 };
  const { group: body } = makeJellyfish({ time, colour: new THREE.Color(0x6fe3ff).multiplyScalar(1.5), phase: 0, fade: 0.004 });
  body.scale.setScalar(1.25);
  const group = new THREE.Group();
  group.add(body);
  group.visible = false;

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
      const beat = Math.sin(life * 1.6);
      const floor = Math.max(pool.level, groundHeight(x, z));
      group.position.set(x, lerp(pool.level, floor, out) + lift + beat * 0.12 + Math.sin(life * 0.3) * 0.5 * out, z);
      time.value = life;
      group.rotation.z = Math.sin(life * 0.45) * 0.16;
      group.rotation.x = Math.cos(life * 0.38) * 0.12;
    },
  };
}
