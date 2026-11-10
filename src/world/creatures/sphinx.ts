import * as THREE from 'three';
import { lerp, smoothstep } from '../../noise';
import { groundHeight } from '../layout';
import type { Pool } from '../layout';
import { buildSphinx } from './sphinxModel';

/**
 * A sphinx carved from the same sandstone as the pyramid on the other side of
 * the desert pool. Every so often it wades up out of the water, pads to the
 * bank, lies down with its tail wrapped round it and goes as still as the
 * statue it is. After a while it gets up and walks back in.
 *
 * This is the first creature, and the pattern for later ones: a visitor
 * belongs to a pool, and its life is a short loop of stages.
 */

const SIZE = 1.3;

type Stage = 'away' | 'rise' | 'turn' | 'settle' | 'rest' | 'wake' | 'turnBack' | 'return';

export interface Sphinx {
  group: THREE.Group;
  update(dt: number): void;
}

/** Shortest way round from one heading to another. */
function turnToward(from: number, to: number, amount: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d * amount;
}

export function createSphinx(pool: Pool, stirPool: () => void): Sphinx {
  const { group, pose } = buildSphinx();
  group.scale.setScalar(SIZE);
  group.visible = false;

  // Where it comes ashore: the gentlest stretch of bank, just above the waterline.
  let bankAngle = 0;
  let bankDist = pool.radius + 3;
  let flattest = Infinity;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    for (let d = pool.radius * 0.8; d < pool.radius + 5; d += 0.2) {
      const h = groundHeight(pool.x + Math.cos(a) * d, pool.z + Math.sin(a) * d);
      if (h > pool.level + 0.15) {
        const further = groundHeight(pool.x + Math.cos(a) * (d + 1.5), pool.z + Math.sin(a) * (d + 1.5));
        if (Math.abs(further - h) < flattest) {
          flattest = Math.abs(further - h);
          bankAngle = a;
          bankDist = d + 0.55;
        }
        break;
      }
    }
  }
  const out = new THREE.Vector2(Math.cos(bankAngle), Math.sin(bankAngle));
  const start = new THREE.Vector2(pool.x, pool.z).addScaledVector(out, pool.radius * 0.15);
  const bank = new THREE.Vector2(pool.x, pool.z).addScaledVector(out, bankDist);
  const journey = start.distanceTo(bank);
  const headingOut = Math.atan2(out.x, out.y);
  const headingAlong = headingOut + Math.PI / 2; // lying side-on to the water
  const headingHome = headingOut + Math.PI;

  let stage: Stage = 'away';
  let clock = 0; // time spent in the current stage
  // The first visit comes soon after arriving; add ?visit=now to the address to see it at once.
  let wait = new URLSearchParams(window.location.search).get('visit') === 'now' ? 1 : 25;
  let travelled = 0;
  let heading = headingOut;
  let stand = 1; // 1 = on its feet, 0 = lying down
  let curl = 0; // 1 = tail wrapped round, head tucked
  let stride = 0;
  let life = 0;
  const WALK = 0.95;

  function go(next: Stage): void {
    stage = next;
    clock = 0;
  }

  /** Puts the sphinx `along` units from the pool's middle towards the bank. */
  function stepTo(along: number): void {
    const t = Math.min(1, Math.max(0, along / journey));
    const x = lerp(start.x, bank.x, t);
    const z = lerp(start.y, bank.y, t);
    // Deep in the middle of the pool it is wholly under water; it wades up as it nears the edge.
    const sunk = 1.5 * SIZE * (1 - smoothstep(0, 0.5, t));
    group.position.set(x, groundHeight(x, z) - sunk, z);
  }

  return {
    group,
    update(dt) {
      life += dt;
      clock += dt;
      let walking = 0;

      switch (stage) {
        case 'away':
          if (clock > wait) {
            travelled = 0;
            heading = headingOut;
            stand = 1;
            curl = 0;
            group.visible = true;
            stirPool();
            go('rise');
          }
          break;
        case 'rise':
          travelled += WALK * dt;
          walking = 1;
          if (travelled >= journey) go('turn');
          break;
        case 'turn':
          heading = turnToward(heading, headingAlong, 1 - Math.exp(-dt * 2.2));
          walking = 0.5;
          if (clock > 2) go('settle');
          break;
        case 'settle':
          stand = 1 - smoothstep(0, 2.4, clock);
          curl = smoothstep(1, 4, clock);
          if (clock > 4.2) go('rest');
          break;
        case 'rest':
          if (clock > 50) go('wake');
          break;
        case 'wake':
          curl = 1 - smoothstep(0, 1.6, clock);
          stand = smoothstep(0.8, 3, clock);
          if (clock > 3.2) go('turnBack');
          break;
        case 'turnBack':
          heading = turnToward(heading, headingHome, 1 - Math.exp(-dt * 2.2));
          walking = 0.5;
          if (clock > 2.2) {
            stirPool();
            go('return');
          }
          break;
        case 'return':
          travelled -= WALK * dt;
          walking = 1;
          if (travelled <= 0) {
            group.visible = false;
            wait = 80 + Math.random() * 60;
            go('away');
          }
          break;
      }
      if (!group.visible) return;

      stepTo(travelled);
      group.rotation.y = heading;
      stride += dt * 6.2 * walking;

      const glance = stage === 'rest' ? smoothstep(20, 22, clock) * (1 - smoothstep(27, 29, clock)) : 0;
      pose({ stand, curl, walking, stride, life, glance });
    },
  };
}
