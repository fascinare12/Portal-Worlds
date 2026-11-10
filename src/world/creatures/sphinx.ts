import * as THREE from 'three';
import { lerp, smoothstep } from '../../noise';
import { groundHeight } from '../layout';
import type { Pool } from '../layout';
import { paint } from '../paint';

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
const STONE = 0xd9b97c;
const STONE_SHADE = 0xbf9a60;
const LAPIS = 0x2f5fa8;
const GOLD = 0xe6bd4c;
const DARK = 0x3a2c22;

type Stage = 'away' | 'rise' | 'turn' | 'settle' | 'rest' | 'wake' | 'turnBack' | 'return';

export interface Sphinx {
  group: THREE.Group;
  update(dt: number): void;
}

function block(mat: THREE.Material, w: number, h: number, d: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

/** Shortest way round from one heading to another. */
function turnToward(from: number, to: number, amount: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d * amount;
}

export function createSphinx(pool: Pool, stirPool: () => void): Sphinx {
  const stone = paint({ color: STONE, dab: 0.5 });
  const shade = paint({ color: STONE_SHADE, dab: 0.5 });
  const lapis = paint({ color: LAPIS, dab: 0.4 });
  const gold = paint({ color: GOLD, dab: 0.4 });
  const dark = paint({ color: DARK, dab: 0.2 });

  const group = new THREE.Group();
  group.scale.setScalar(SIZE);
  group.visible = false;

  // Body: a long block with a deeper chest and haunches.
  const body = new THREE.Group();
  group.add(body);
  body.add(block(stone, 0.62, 0.55, 1.5));
  body.add(block(shade, 0.68, 0.66, 0.5, 0, 0.06, 0.52));
  body.add(block(shade, 0.7, 0.6, 0.5, 0, 0.02, -0.5));

  // Head, with the striped headcloth of a pharaoh.
  const head = new THREE.Group();
  head.position.set(0, 0.42, 0.72);
  body.add(head);
  head.add(block(stone, 0.42, 0.46, 0.42, 0, 0.28, 0));
  head.add(block(lapis, 0.64, 0.62, 0.3, 0, 0.3, -0.12));
  head.add(block(lapis, 0.14, 0.5, 0.16, 0.27, 0.04, 0.08));
  head.add(block(lapis, 0.14, 0.5, 0.16, -0.27, 0.04, 0.08));
  head.add(block(gold, 0.46, 0.08, 0.44, 0, 0.5, 0.005));
  head.add(block(gold, 0.66, 0.06, 0.31, 0, 0.1, -0.12));
  head.add(block(gold, 0.66, 0.06, 0.31, 0, 0.4, -0.12));
  head.add(block(shade, 0.08, 0.13, 0.08, 0, 0.26, 0.24));
  head.add(block(dark, 0.08, 0.05, 0.02, 0.1, 0.35, 0.215));
  head.add(block(dark, 0.08, 0.05, 0.02, -0.1, 0.35, 0.215));
  head.add(block(gold, 0.1, 0.2, 0.1, 0, -0.02, 0.19));

  // Four legs, each hinged at the shoulder or hip.
  const legs: THREE.Group[] = [];
  for (const [x, z] of [
    [0.27, 0.55],
    [-0.27, 0.55],
    [0.29, -0.52],
    [-0.29, -0.52],
  ]) {
    const leg = new THREE.Group();
    leg.position.set(x, -0.2, z);
    leg.add(block(stone, 0.2, 0.55, 0.22, 0, -0.275, 0));
    leg.add(block(shade, 0.25, 0.12, 0.34, 0, -0.5, 0.07));
    body.add(leg);
    legs.push(leg);
  }

  // Tail: a chain of short blocks ending in a tuft.
  const tail: THREE.Group[] = [];
  let parent: THREE.Object3D = body;
  for (let i = 0; i < 5; i++) {
    const joint = new THREE.Group();
    joint.position.set(0, i === 0 ? 0.1 : 0, i === 0 ? -0.75 : -0.28);
    joint.add(i < 4 ? block(stone, 0.1, 0.1, 0.3, 0, 0, -0.14) : block(shade, 0.18, 0.18, 0.2, 0, 0, -0.08));
    parent.add(joint);
    tail.push(joint);
    parent = joint;
  }

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

      // Body height: up on its legs, or down on its belly. It breathes while it rests.
      const breath = Math.sin(life * 1.3) * 0.012 * (1 - stand);
      body.position.y = lerp(0.33, 0.76, stand) + Math.abs(Math.sin(stride)) * 0.03 * walking + breath;
      body.rotation.z = Math.sin(stride) * 0.035 * walking;

      // Legs swing in diagonal pairs when walking, and stretch flat along the ground when lying.
      legs.forEach((leg, i) => {
        const swing = Math.sin(stride + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5 * walking;
        leg.rotation.x = lerp(i < 2 ? -1.5 : -1.35, swing, stand);
      });

      // Head: level when up; lowered and turned towards the water when curled. Now
      // and then, mid-rest, it lifts and looks about before going still again.
      const glance = stage === 'rest' ? smoothstep(20, 22, clock) * (1 - smoothstep(27, 29, clock)) : 0;
      head.rotation.x = lerp(0, 0.3, curl) * (1 - glance);
      head.rotation.y = lerp(0, -0.55, curl) * (1 - glance) + Math.sin(life * 0.9) * 0.5 * glance;

      // Tail: sways behind when up; wraps round the body when curled, with the odd flick of the tip.
      const flick = Math.max(0, Math.sin(life * 0.8)) ** 12 * 0.5;
      tail.forEach((joint, i) => {
        const sway = Math.sin(life * 2 + i * 0.7) * 0.12 * stand;
        joint.rotation.y = lerp(sway, -0.72, curl) + (i === 4 ? flick * curl : 0);
        joint.rotation.x = lerp(i === 0 ? 0.5 : -0.22, i === 0 ? -0.25 : 0, curl);
      });
    },
  };
}
