import * as THREE from 'three';
import { lerp, smoothstep } from '../../noise';
import { groundHeight } from '../layout';
import type { Pool } from '../layout';
import furUrl from '../../textures/fur.webp';

/**
 * A white fox with red markings that comes through the red pool from the
 * city on the other side. It behaves like a fox, not like the sphinx: it
 * springs out and shakes the water off, trots about with its nose down,
 * freezes with its ears pricked when it hears something in the grass, leaps
 * high and dives nose-first at it, then curls up with its tail over its nose
 * for a nap. When it wakes it stretches, trots to the water and jumps in.

 */

const SIZE = 2.1;
const WHITE = 0xfbf7f0;
const RED = 0xd8382e;
const DARK = 0x2a2018;

type Stage = 'away' | 'emerge' | 'shake' | 'trot' | 'listen' | 'crouch' | 'pounce' | 'nuzzle' | 'settle' | 'nap' | 'stretch' | 'home' | 'dive';

export interface Fox {
  group: THREE.Group;
  update(dt: number): void;
}

function turnToward(from: number, to: number, amount: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d * amount;
}

export function createFox(pool: Pool, stirPool: () => void): Fox {
  // Soft shading and a photographed pile of short fur, so he reads as an animal, not a model.
  const furMap = new THREE.TextureLoader().load(furUrl);
  furMap.colorSpace = THREE.SRGBColorSpace;
  furMap.wrapS = furMap.wrapT = THREE.RepeatWrapping;
  furMap.repeat.set(7, 5); // small, so it reads as short fur and not as wool
  const white = new THREE.MeshLambertMaterial({ color: WHITE, map: furMap });
  const red = new THREE.MeshLambertMaterial({ color: RED, map: furMap });
  const dark = new THREE.MeshLambertMaterial({ color: DARK });

  const ball = (mat: THREE.Material, r: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  };
  const cone = (mat: THREE.Material, r: number, h: number) => new THREE.Mesh(new THREE.ConeGeometry(r, h, 16), mat);
  /** A rounded limb hanging down from the origin. */
  const limb = (mat: THREE.Material, r: number, len: number) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat);
    m.position.y = -len / 2;
    return m;
  };

  const group = new THREE.Group();
  group.scale.setScalar(SIZE);
  group.visible = false;
  const body = new THREE.Group();
  group.add(body);

  // One continuous body: a deep chest, a slim waist and rounded haunches, all blending together.
  const barrel = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.34, 8, 18), white);
  barrel.rotation.x = Math.PI / 2;
  body.add(barrel, ball(white, 0.2, 0, 0.015, 0.17, 0.92, 1, 1.05), ball(white, 0.185, 0, 0.0, -0.2, 0.95, 0.98, 1.1));
  body.add(ball(white, 0.11, 0.1, -0.02, 0.2, 1, 1.2, 1), ball(white, 0.11, -0.1, -0.02, 0.2, 1, 1.2, 1)); // shoulders
  body.add(ball(white, 0.12, 0.1, -0.02, -0.24, 1, 1.25, 1.1), ball(white, 0.12, -0.1, -0.02, -0.24, 1, 1.25, 1.1)); // thighs

  // A neck that carries the head, so the head can lead the body into a turn.
  const neck = new THREE.Group();
  neck.position.set(0, 0.1, 0.27);
  body.add(neck);
  const throat = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.16, 6, 14), white);
  throat.position.set(0, 0.07, 0.05);
  throat.rotation.x = 0.7;
  neck.add(throat, ball(white, 0.13, 0, 0.0, 0.0, 1, 1, 1)); // and a ruff of fur at its base

  // Head: a pointed muzzle, tall ears tipped with red, and red marks on the brow and cheeks.
  const head = new THREE.Group();
  head.position.set(0, 0.15, 0.13);
  neck.add(head);
  head.add(ball(white, 0.16, 0, 0.06, 0.06, 1.05, 0.95, 1), ball(white, 0.1, 0.1, 0.02, 0.06, 1, 0.9, 1), ball(white, 0.1, -0.1, 0.02, 0.06, 1, 0.9, 1));
  const muzzle = cone(white, 0.085, 0.24);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.02, 0.24);
  head.add(muzzle, ball(dark, 0.028, 0, 0.03, 0.36));
  const ears: THREE.Group[] = [];
  for (const side of [1, -1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 0.09, 0.17, 0.02);
    const outer = cone(white, 0.06, 0.18);
    outer.position.y = 0.09;
    const tip = cone(red, 0.034, 0.08);
    tip.position.y = 0.15;
    ear.add(outer, tip);
    ear.rotation.z = -side * 0.22;
    head.add(ear);
    ears.push(ear);
    head.add(ball(dark, 0.024, side * 0.07, 0.085, 0.185, 1, 1.2, 0.6)); // eyes
    head.add(ball(red, 0.03, side * 0.11, 0.03, 0.15, 1.6, 0.6, 0.5)); // cheek marks
  }
  head.add(ball(red, 0.026, 0, 0.16, 0.16, 0.7, 1.5, 0.5)); // brow mark

  // Legs with a joint in the middle, so they fold as they lift and reach as they land.
  const legs: { hip: THREE.Group; knee: THREE.Group; front: boolean }[] = [];
  for (const [x, z] of [[0.095, 0.2], [-0.095, 0.2], [0.1, -0.25], [-0.1, -0.25]]) {
    const front = z > 0;
    const hip = new THREE.Group();
    hip.position.set(x, -0.06, z);
    const knee = new THREE.Group();
    knee.position.y = -0.18;
    hip.add(limb(white, front ? 0.045 : 0.055, 0.18), knee);
    knee.add(limb(white, 0.034, 0.17), ball(dark, 0.042, 0, -0.185, 0.02, 1, 0.6, 1.35));
    body.add(hip);
    legs.push({ hip, knee, front });
  }

  // Tails: each a chain of three soft segments, so a movement at the root ripples out to the tip.
  const tails: { joints: THREE.Group[]; fan: number }[] = [];
  const count = 1;
  for (let i = 0; i < count; i++) {
    const joints: THREE.Group[] = [];
    let parent: THREE.Object3D = body;
    for (let k = 0; k < 3; k++) {
      const joint = new THREE.Group();
      joint.position.set(0, k === 0 ? 0.04 : 0, k === 0 ? -0.36 : -0.17);
      const r = [0.07, 0.092, 0.08][k];
      const part = new THREE.Mesh(new THREE.CapsuleGeometry(r, 0.13, 6, 14), white);
      part.rotation.x = Math.PI / 2;
      part.position.z = -0.085;
      joint.add(part);
      if (k === 2) joint.add(ball(red, 0.078, 0, 0, -0.17, 0.95, 0.95, 1.25));
      parent.add(joint);
      joints.push(joint);
      parent = joint;
    }
    tails.push({ joints, fan: count === 1 ? 0 : (i / (count - 1) - 0.5) * Math.min(1.9, 0.45 * count) });
  }

  // Where it goes: a spot on the bank to land, then a few places round the pool to investigate.
  const start = Math.random() * Math.PI * 2;
  const spot = (angle: number, out: number) => new THREE.Vector2(pool.x + Math.cos(angle) * (pool.radius + out), pool.z + Math.sin(angle) * (pool.radius + out));
  const bank = spot(start, 3.4);
  const rounds = [spot(start + 0.9, 4.6), spot(start + 2.1, 3.8), spot(start + 3.2, 4.8)];
  const bed = spot(start + 4.3, 4);

  const at = new THREE.Vector2(pool.x, pool.z);
  let heading = start;
  let stage: Stage = 'away';
  let clock = 0;
  let wait = new URLSearchParams(window.location.search).get('visit') === 'now' ? 4 : 45;
  let leg = 0; // which stop on its round it is making for
  let stride = 0;
  let life = 0;
  let from = new THREE.Vector2();
  let to = new THREE.Vector2();
  // The pose, eased towards each frame so nothing snaps.
  const pose = { lift: 0, crouch: 0, lie: 0, curl: 0, nose: 0, tilt: 0, prick: 0, bow: 0, roll: 0, pitch: 0 };
  const want = { ...pose };

  const go = (next: Stage) => {
    stage = next;
    clock = 0;
  };
  let pace = 0; // how fast he is actually going
  let wantPace = 0;
  let turning = 0; // how hard it is turning, for leaning into bends
  /** Trots towards a point along a curving, wandering line, as an animal does; true once it arrives. */
  const trotTo = (target: THREE.Vector2, dt: number, speed = 1.9): boolean => {
    const d = target.clone().sub(at);
    const far = d.length();
    if (far < 0.4) return true;
    // It steers gradually and weaves a little, so its path is an arc, never a ruled line.
    // Close to the target it steers harder and stops weaving, so it does not circle it.
    const close = 1 - smoothstep(0.8, 2.6, far);
    const weave = Math.sin(life * 1.9) * 0.55 * (1 - close);
    const before = heading;
    heading = turnToward(heading, Math.atan2(d.x, d.y) + weave, 1 - Math.exp(-dt * lerp(2.4, 9, close)));
    turning = lerp(turning, (heading - before) / Math.max(dt, 0.001), 1 - Math.exp(-dt * 6));
    // He eases up to speed and slows as he arrives; the stepping itself happens once, in update.
    wantPace = speed * Math.min(1, Math.max(0.35, far / 1.2));
    return false;
  };
  /**
   * A leap from one spot to another; `t` runs 0 to 1. It gathers speed off the ground and
   * slows into the landing, and the body follows the curve of its flight: nose up as it
   * rises, level over the top, nose down as it comes in.
   */
  const leap = (t: number, height: number) => {
    const along = t * t * (3 - 2 * t); // ease out of the take-off and into the landing
    at.lerpVectors(from, to, along);
    want.lift = pose.lift = Math.sin(along * Math.PI) * height;
    const slope = Math.cos(along * Math.PI); // +1 rising, 0 at the top, -1 falling
    const settle = smoothstep(0, 0.18, t); // tip up gradually from the crouch
    want.pitch = pose.pitch = -slope * 0.8 * settle;
    // Legs tuck at the top of the arc and reach for the ground on the way down.
    want.crouch = pose.crouch = Math.sin(along * Math.PI) * 0.5;
  };

  return {
    group,
    update(dt) {
      life += dt;
      clock += dt;
      let moving = false;
      Object.assign(want, { lift: 0, crouch: 0, lie: 0, curl: 0, nose: 0, tilt: 0, prick: 0, bow: 0, roll: 0, pitch: 0 });
      turning *= Math.exp(-dt * 4);
      wantPace = 0;

      switch (stage) {
        case 'away':
          if (clock > wait) {
            group.visible = true;
            at.set(pool.x, pool.z);
            from = at.clone();
            to = bank.clone();
            heading = Math.atan2(to.x - from.x, to.y - from.y);
            leg = 0;
            stirPool();
            go('emerge');
          }
          break;
        case 'emerge': // springs out of the water onto the bank
          leap(Math.min(1, clock / 1.1), 1.5);
          if (clock > 1.1) go('shake');
          break;
        case 'shake': // shakes itself dry, nose to tail
          want.roll = pose.roll = Math.sin(clock * 34) * 0.32 * (1 - clock / 1.1);
          if (clock > 1.1) go('trot');
          break;
        case 'trot': // nose down, following a scent to the next spot
          want.nose = 0.75;
          moving = true;
          if (trotTo(rounds[leg], dt)) go('listen');
          break;
        case 'listen': // something rustled: stock still, ears up, head cocked
          want.prick = 1;
          want.tilt = Math.sin(clock * 2.2) > 0 ? 0.4 : -0.3;
          if (clock > 1.8) go('crouch');
          break;
        case 'crouch': // gathers itself, hindquarters wiggling
          want.crouch = 1;
          want.prick = 1;
          want.roll = pose.roll = Math.sin(clock * 22) * 0.07;
          if (clock > 0.7) {
            from = at.clone();
            to = at.clone().add(new THREE.Vector2(Math.sin(heading), Math.cos(heading)).multiplyScalar(1.7));
            go('pounce');
          }
          break;
        case 'pounce': // the high, arching leap of a hunting fox, landing nose first
          leap(Math.min(1, clock / 0.95), 1.25);
          if (clock > 0.95) go('nuzzle');
          break;
        case 'nuzzle': // nose in the grass, rump in the air, tail waving
          want.bow = 1;
          want.nose = 1;
          if (clock > 1.3) {
            leg++;
            go(leg < rounds.length ? 'trot' : 'settle');
          }
          break;
        case 'settle': // trots to a soft spot, turns round once, and lies down
          if (clock < 30 && !trotTo(bed, dt, 1.4)) {
            moving = true;
            clock = 0;
          } else {
            if (clock < 1.4) heading += dt * 4.5;
            want.lie = smoothstep(1.2, 2.2, clock);
            want.curl = smoothstep(1.6, 2.8, clock);
            if (clock > 3) go('nap');
          }
          break;
        case 'nap': // curled up, tail over its nose, one ear twitching
          want.lie = want.curl = 1;
          if (clock > 26) go('stretch');
          break;
        case 'stretch': // front legs out, back arched, a long stretch
          want.bow = smoothstep(0, 0.5, clock) * (1 - smoothstep(1.2, 1.7, clock));
          want.lie = 1 - smoothstep(0, 0.5, clock);
          if (clock > 1.8) go('home');
          break;
        case 'home': // back to the water's edge
          moving = true;
          if (trotTo(bank, dt)) {
            from = at.clone();
            to = new THREE.Vector2(pool.x, pool.z);
            heading = Math.atan2(to.x - from.x, to.y - from.y);
            go('dive');
          }
          break;
        case 'dive': // one jump, and it is gone
          leap(Math.min(1, clock / 1.0), 1.3);
          if (clock > 0.7 && clock - dt <= 0.7) stirPool();
          if (clock > 1.0) {
            group.visible = false;
            wait = 70 + Math.random() * 60;
            go('away');
          }
          break;
      }
      if (!group.visible) return;

      // Speed builds and fades smoothly, and the feet step in time with the ground covered.
      pace = lerp(pace, wantPace, 1 - Math.exp(-dt * (wantPace > pace ? 3 : 5)));
      at.x += Math.sin(heading) * pace * dt;
      at.y += Math.cos(heading) * pace * dt;
      stride += pace * dt * 6.4;
      const walk = moving || pace > 0.08 ? Math.min(1, pace / 1.5) : 0;

      // Ease every part of the pose towards where it should be.
      const ease = 1 - Math.exp(-dt * 9);
      for (const k of Object.keys(pose) as (keyof typeof pose)[]) pose[k] = lerp(pose[k], want[k], ease);

      // Coming out of or going into the pool it passes through the water's surface.
      const inWater = at.distanceTo(new THREE.Vector2(pool.x, pool.z)) < pool.radius * 0.5;
      const ground = inWater ? pool.level - 0.5 : Math.max(groundHeight(at.x, at.y), pool.level);
      group.position.set(at.x, ground + pose.lift * SIZE, at.y);
      group.rotation.y = heading;

      // A soft rise and fall twice per stride, with no jolt at the bottom.
      const bounce = (1 - Math.cos(stride * 2)) * 0.5 * 0.028 * walk;
      const breath = Math.sin(life * 1.6) * 0.008 * pose.lie;
      body.position.y = lerp(0.42, 0.16, Math.max(pose.lie, pose.crouch * 0.55)) + bounce + breath;
      // Pitch: nose down for a bow or a dive, with the rump up. A trot rocks the body very slightly.
      body.rotation.x = pose.pitch + pose.bow * 0.5 + Math.sin(stride * 2) * 0.025 * walk;
      // He leans into his turns, and his shoulders sway a touch with each step.
      const lean = Math.max(-0.35, Math.min(0.35, turning * 0.16));
      body.rotation.z = pose.roll - lean * walk + Math.sin(stride) * 0.03 * walk;

      for (const [i, l] of legs.entries()) {
        const phase = stride + (i === 0 || i === 3 ? 0 : Math.PI);
        // Trot: the leg swings from the shoulder or hip, and folds at its joint while it is carried forward.
        const swing = Math.sin(phase) * 0.55 * walk;
        const fold = Math.max(0, -Math.cos(phase)) * walk;
        const stand = l.front ? [swing, fold * 0.95] : [swing - 0.3, 0.55 + fold * 0.7];
        const air = l.front ? [-0.9, 0.25] : [0.75, 0.5];
        const bowed = l.front ? [-1.1, 0.05] : [-0.3, 0.55];
        const lying = l.front ? [-1.42, 0.12] : [-1.15, 2.35];
        const inAir = Math.min(1, pose.lift * 2.2);
        for (const [k, part] of [l.hip, l.knee].entries()) {
          let a = lerp(stand[k], air[k], inAir);
          a = lerp(a, bowed[k], pose.bow);
          part.rotation.x = lerp(a, lying[k], pose.lie);
        }
      }

      // The head leads: it turns into a bend before the body follows.
      neck.rotation.y = Math.max(-0.5, Math.min(0.5, turning * 0.3)) * walk + pose.curl * -0.75;
      neck.rotation.x = pose.nose * 0.45 - pose.bow * 0.25 + pose.curl * 0.35 - pose.prick * 0.2 - Math.sin(stride * 2) * 0.02 * walk;
      head.rotation.x = pose.nose * 0.25 + pose.curl * 0.2;
      head.rotation.z = pose.tilt;
      head.rotation.y = pose.curl * -0.4;
      const twitch = stage === 'nap' && Math.sin(life * 0.9) > 0.96 ? 0.5 : 0;
      ears.forEach((e, i) => {
        e.rotation.x = -pose.prick * 0.25 + pose.lie * 0.5 - (i === 0 ? twitch : 0);
      });

      for (const [i, tl] of tails.entries()) {
        const quick = pose.bow > 0.5;
        tl.joints.forEach((joint, k) => {
          // Each segment follows the one before it a moment later, so the tail flows.
          const wave = Math.sin(life * (quick ? 9 : 2.2) + i - k * 0.8) * (quick ? 0.22 : 0.07) * (1 + k * 0.5);
          const trail = -lean * walk * 0.5 * (k + 1); // streaming out behind through a turn
          const run = Math.sin(stride - k * 0.9) * 0.06 * walk;
          const base = k === 0 ? tl.fan : 0;
          joint.rotation.y = lerp(base + wave + trail + run, k === 0 ? 0.9 + tl.fan * 0.2 : 0.75, pose.curl);
          const lift = k === 0 ? lerp(-0.35, -0.95, pose.bow) - Math.abs(tl.fan) * 0.25 + walk * 0.12 : 0.1 + (quick ? -0.1 : 0);
          joint.rotation.x = lerp(lift, k === 0 ? 0.1 : 0, pose.curl);
        });
      }
    },
  };
}
