import * as THREE from 'three';
import { lerp, smoothstep } from '../../noise';
import { groundHeight } from '../layout';
import type { Pool } from '../layout';
import { paint } from '../paint';

/**
 * A white fox with red markings that comes through the red pool from the
 * city on the other side. It behaves like a fox, not like the sphinx: it
 * springs out and shakes the water off, trots about with its nose down,
 * freezes with its ears pricked when it hears something in the grass, leaps
 * high and dives nose-first at it, then curls up with its tail over its nose
 * for a nap. When it wakes it stretches, trots to the water and jumps in.
 *
 * In the old stories a fox grows more tails as it grows wiser. This one has a
 * tail for every five words learned in the city, up to nine.
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

function tailsEarned(): number {
  try {
    const saved = JSON.parse(localStorage.getItem('portal-worlds-shibuya-v1') ?? '{}') as { tagged?: string[] };
    return Math.min(9, 1 + Math.floor((saved.tagged?.length ?? 0) / 5));
  } catch {
    return 1;
  }
}

function turnToward(from: number, to: number, amount: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d * amount;
}

export function createFox(pool: Pool, stirPool: () => void): Fox {
  const white = paint({ color: WHITE, dab: 0.25 });
  const red = paint({ color: RED, dab: 0.25 });
  const dark = paint({ color: DARK, dab: 0.1 });

  const ball = (mat: THREE.Material, r: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  };
  const cone = (mat: THREE.Material, r: number, h: number) => new THREE.Mesh(new THREE.ConeGeometry(r, h, 12), mat);

  const group = new THREE.Group();
  group.scale.setScalar(SIZE);
  group.visible = false;
  const body = new THREE.Group();
  group.add(body);

  // A slim body, deeper at the chest.
  body.add(ball(white, 0.2, 0, 0, -0.14, 0.85, 0.85, 1.5), ball(white, 0.2, 0, 0.02, 0.16, 0.95, 1, 1.2));

  // Head: a pointed muzzle, tall ears tipped with red, and red marks on the brow and cheeks.
  const head = new THREE.Group();
  head.position.set(0, 0.16, 0.36);
  body.add(head);
  head.add(ball(white, 0.16, 0, 0.06, 0.06, 1.05, 0.95, 1));
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

  // Legs, each hinged at the top.
  const legs: THREE.Group[] = [];
  for (const [x, z] of [[0.09, 0.2], [-0.09, 0.2], [0.09, -0.24], [-0.09, -0.24]]) {
    const leg = new THREE.Group();
    leg.position.set(x, -0.08, z);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.26, 4, 10), white);
    shin.position.y = -0.17;
    leg.add(shin, ball(dark, 0.042, 0, -0.33, 0.015, 1, 0.6, 1.3));
    body.add(leg);
    legs.push(leg);
  }

  // Tails: thick brushes with red tips, fanned out behind.
  const tails: THREE.Group[] = [];
  const count = tailsEarned();
  for (let i = 0; i < count; i++) {
    const tail = new THREE.Group();
    tail.position.set(0, 0.04, -0.4);
    const brush = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.36, 6, 12), white);
    brush.rotation.x = Math.PI / 2;
    brush.position.z = -0.26;
    brush.scale.set(1, 1, 1.15);
    tail.add(brush, ball(red, 0.075, 0, 0, -0.5, 0.9, 0.9, 1.2));
    tail.userData.fan = count === 1 ? 0 : (i / (count - 1) - 0.5) * Math.min(1.9, 0.45 * count);
    body.add(tail);
    tails.push(tail);
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
    at.x += Math.sin(heading) * speed * dt;
    at.y += Math.cos(heading) * speed * dt;
    stride += dt * 13;
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

      // Ease every part of the pose towards where it should be.
      const ease = 1 - Math.exp(-dt * 9);
      for (const k of Object.keys(pose) as (keyof typeof pose)[]) pose[k] = lerp(pose[k], want[k], ease);

      // Coming out of or going into the pool it passes through the water's surface.
      const inWater = at.distanceTo(new THREE.Vector2(pool.x, pool.z)) < pool.radius * 0.5;
      const ground = inWater ? pool.level - 0.5 : Math.max(groundHeight(at.x, at.y), pool.level);
      group.position.set(at.x, ground + pose.lift * SIZE, at.y);
      group.rotation.y = heading;

      const bounce = moving ? Math.abs(Math.sin(stride)) * 0.035 : 0;
      const breath = Math.sin(life * 1.6) * 0.008 * pose.lie;
      body.position.y = lerp(0.42, 0.16, Math.max(pose.lie, pose.crouch * 0.55)) + bounce + breath;
      // Pitch: nose down for a bow or a dive, with the rump up.
      body.rotation.x = pose.pitch + pose.bow * 0.5;
      // It leans into its turns, like anything running a bend.
      body.rotation.z = pose.roll - Math.max(-0.35, Math.min(0.35, turning * 0.16)) * (moving ? 1 : 0);

      legs.forEach((l, i) => {
        const front = i < 2;
        const swing = moving ? Math.sin(stride + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.75 : 0;
        const tucked = front ? -1.45 : 1.35; // folded under when lying down
        const bowed = front ? -1.1 : 0.25; // front legs stretched forward in a bow
        const airborne = pose.lift > 0.1 ? (front ? -0.9 : 0.9) : 0; // stretched out in mid-leap
        l.rotation.x = lerp(lerp(swing + airborne, bowed, pose.bow), tucked, pose.lie);
      });

      head.rotation.x = pose.nose * 0.6 - pose.bow * 0.3 + pose.curl * 0.5 - pose.prick * 0.15;
      head.rotation.z = pose.tilt;
      head.rotation.y = pose.curl * -1.1;
      const twitch = stage === 'nap' && Math.sin(life * 0.9) > 0.96 ? 0.5 : 0;
      ears.forEach((e, i) => {
        e.rotation.x = -pose.prick * 0.25 + pose.lie * 0.5 - (i === 0 ? twitch : 0);
      });

      tails.forEach((t, i) => {
        const fan = t.userData.fan as number;
        const wag = Math.sin(life * (pose.bow > 0.5 ? 9 : 2.2) + i) * (pose.bow > 0.5 ? 0.35 : 0.1);
        // Streaming behind when it runs, held high in a bow, wrapped round to its nose when curled.
        t.rotation.y = lerp(fan + wag, 2.3 + fan * 0.25, pose.curl);
        t.rotation.x = lerp(lerp(-0.35, -1.0, pose.bow), 0.1, pose.curl) - Math.abs(fan) * 0.25;
      });
    },
  };
}
