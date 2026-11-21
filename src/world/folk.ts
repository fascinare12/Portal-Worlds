import * as THREE from 'three';
import { groundHeight, trees } from './layout';
import type { Tree } from './layout';
import { paint } from './paint';

/**
 * The folk of the wood: who comes out when a tree or a tall mushroom is
 * tapped. Each stays a few seconds and goes back where it came from.
 *
 * They are the old creatures of myth and fable that woods like this one have
 * always had in them: a dryad, a faun, an owl, a squirrel; and under the
 * mushrooms a mouse, a hedgehog, and now and then a guinea pig that somebody
 * once sent here with a yellow ring tied to it, and which liked it too much
 * to leave. None of them is anyone in particular.
 */

export interface Mushroom {
  x: number;
  y: number;
  z: number;
  /** How tall it stands. */
  h: number;
}
/** The mushrooms tall enough to hide something. Filled in when the forest is made. */
export const tallMushrooms: Mushroom[] = [];

interface Actor {
  group: THREE.Group;
  /** Seconds it lasts. */
  lasts: number;
  /** Poses it for a moment `t` seconds in. */
  pose: (t: number) => void;
}

const inks = new Map<number, THREE.Material>();
const ink = (color: number): THREE.Material => {
  let m = inks.get(color);
  if (!m) inks.set(color, (m = paint({ color, dab: 0.5 })));
  return m;
};
const ball = (color: number, r: number, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1): THREE.Mesh => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), ink(color));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
};
const stick = (color: number, r0: number, r1: number, h: number, x = 0, y = 0, z = 0): THREE.Mesh => {
  const g = new THREE.CylinderGeometry(r0, r1, h, 8);
  g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, ink(color));
  m.position.set(x, y, z);
  return m;
};
const cone = (color: number, r: number, h: number, x = 0, y = 0, z = 0): THREE.Mesh => {
  const g = new THREE.ConeGeometry(r, h, 8);
  g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, ink(color));
  m.position.set(x, y, z);
  return m;
};
/** 0 at the start and end, 1 through the middle: for coming out and going back. */
const there = (t: number, lasts: number, lead = 0.9) => Math.min(1, t / lead, (lasts - t) / lead);
const ease = (x: number) => x * x * (3 - 2 * x);

// ---- Out of the trees ----

/** A dryad: the tree's own spirit rises out of the top of its crown, turns once in a swirl of leaves, and sinks back in. */
function dryad(tree: Tree, toward: number, k: number): Actor {
  const group = new THREE.Group();
  const leaf = [0x6f9a4a, 0xc9951c, 0xb5562e][Math.floor(tree.x * 7 + tree.z * 3 + 300) % 3];
  const body = new THREE.Group();
  body.add(cone(0x7fa05a, 0.75, 2.3), stick(0xcfe3b0, 0.26, 0.34, 0.8, 0, 1.9, 0), ball(0xdcebc2, 0.36, 0, 3.0, 0));
  for (let i = 0; i < 7; i++) body.add(ball(leaf, 0.22, Math.cos(i * 0.9) * 0.34, 3.2 + Math.sin(i * 1.7) * 0.16, Math.sin(i * 0.9) * 0.34 - 0.06));
  const arms = [-1, 1].map((side) => {
    const arm = stick(0xcfe3b0, 0.07, 0.09, 1.1, side * 0.3, 2.55, 0);
    body.add(arm);
    return arm;
  });
  const swirl = Array.from({ length: 9 }, () => {
    const l = ball(leaf, 0.12, 0, 0, 0, 1.4, 0.3, 0.8);
    group.add(l);
    return l;
  });
  group.add(body);
  // The wood is mostly seen from above, so she comes up through the leaves, not out at the foot.
  const base = tree.base + tree.h - 1.2;
  const big = Math.max(1.5, tree.r * 0.6) * (0.6 + 0.4 * k);
  return {
    group,
    lasts: 6.5,
    pose(t) {
      const out = ease(there(t, 6.5, 1.2));
      body.position.set(tree.x, base + (tree.r * 0.9 + 0.6) * out, tree.z);
      body.scale.setScalar(big * (0.25 + 0.75 * out));
      body.rotation.y = -toward + Math.PI / 2 + ease(Math.max(0, Math.min(1, (t - 1.5) / 3))) * Math.PI * 2;
      arms.forEach((arm, i) => (arm.rotation.z = (i ? -1 : 1) * (0.5 + 1.6 * out + Math.sin(t * 2.4 + i) * 0.2)));
      swirl.forEach((l, i) => {
        const a = t * 2.2 + i * 0.7;
        const r = (tree.r * 0.8 + 0.4) * out + 0.2;
        l.position.set(body.position.x + Math.cos(a) * r, body.position.y + 0.6 + ((t * 0.9 + i * 0.37) % 1) * 3.2 * big, body.position.z + Math.sin(a) * r);
        l.rotation.set(a, a * 1.3, 0);
        l.scale.setScalar(out * big * 1.3);
      });
    },
  };
}

/** A faun: skips out from behind the trunk, dances once round the tree with his pipe, and slips behind it again. */
function faun(tree: Tree, toward: number, k: number): Actor {
  const group = new THREE.Group();
  const body = new THREE.Group();
  const legs = [-1, 1].map((side) => {
    const leg = stick(0x7a5632, 0.12, 0.07, 0.95, side * 0.17, 0.95, 0);
    leg.rotation.x = Math.PI; // hangs down from the hip
    body.add(leg);
    return leg;
  });
  body.add(ball(0x7a5632, 0.36, 0, 1.05, 0, 1, 0.8, 0.9), stick(0xd9b08a, 0.22, 0.28, 0.75, 0, 1.15, 0), ball(0xd9b08a, 0.28, 0, 2.15, 0), ball(0x5d3f24, 0.3, 0, 2.25, -0.06, 1, 0.8, 1));
  for (const side of [-1, 1]) {
    const horn = cone(0xe8dcc0, 0.06, 0.3, side * 0.16, 2.38, 0.04);
    horn.rotation.z = -side * 0.4;
    body.add(horn, ball(0xd9b08a, 0.09, side * 0.3, 2.2, 0, 0.5, 1.2, 1));
  }
  const pipe = stick(0xc9a25a, 0.035, 0.035, 0.6, 0, 2.02, 0.26);
  pipe.rotation.x = Math.PI / 2 - 0.3;
  body.add(pipe, stick(0xd9b08a, 0.06, 0.06, 0.5, -0.24, 1.75, 0.12), stick(0xd9b08a, 0.06, 0.06, 0.5, 0.24, 1.75, 0.12));
  group.add(body);
  const behind = toward + Math.PI;
  return {
    group,
    lasts: 8,
    pose(t) {
      // Once and a bit round the trunk, from behind it to behind it.
      const round = ease(Math.max(0, Math.min(1, (t - 0.4) / 7.2)));
      const a = behind + round * Math.PI * 2;
      const r = tree.r + 1 + 0.6 * k; // clear of the leaves, where he can be seen
      const x = tree.x + Math.cos(a) * r;
      const z = tree.z + Math.sin(a) * r;
      const hop = Math.abs(Math.sin(t * 6.5));
      body.position.set(x, groundHeight(x, z) + hop * 0.6, z);
      body.rotation.y = -a; // facing the way he goes round
      body.rotation.z = Math.sin(t * 6.5) * 0.12;
      body.scale.setScalar(1.5 * k * ease(there(t, 8, 0.5)));
      legs.forEach((leg, i) => (leg.rotation.x = Math.PI + Math.sin(t * 6.5 + i * Math.PI) * 0.7));
    },
  };
}

/** An owl: drops out of the crown, sails one slow circle over the tree, and goes back in. */
function owl(tree: Tree, toward: number, k: number): Actor {
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.add(ball(0x8a6a48, 0.42, 0, 0, 0, 0.85, 1.05, 1), ball(0xe9dcc2, 0.3, 0, 0.12, 0.2, 1, 0.9, 0.6), ball(0x2a2622, 0.06, -0.12, 0.2, 0.36), ball(0x2a2622, 0.06, 0.12, 0.2, 0.36), cone(0xd9a23a, 0.05, 0.12, 0, 0.02, 0.4));
  for (const side of [-1, 1]) body.add(cone(0x8a6a48, 0.08, 0.18, side * 0.2, 0.4, 0));
  const wings = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    const w = ball(0x6f5236, 0.5, side * 0.55, 0, 0, 1.3, 0.12, 0.6);
    pivot.add(w);
    body.add(pivot);
    return pivot;
  });
  group.add(body);
  const top = tree.base + tree.h + tree.r * 0.2;
  return {
    group,
    lasts: 7.5,
    pose(t) {
      const out = ease(there(t, 7.5, 1.3));
      const a = toward + ease(Math.max(0, Math.min(1, (t - 0.6) / 6.3))) * Math.PI * 2;
      const r = (tree.r + 2.2) * out;
      body.position.set(tree.x + Math.cos(a) * r, top + 1.4 * out + Math.sin(t * 1.3) * 0.25, tree.z + Math.sin(a) * r);
      body.rotation.y = -a - Math.PI / 2; // nose along the circle
      body.rotation.z = -0.35 * out; // banking into the turn
      body.scale.setScalar((0.3 + 1.2 * out) * k);
      const flap = Math.sin(t * 7) * 0.55;
      wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * flap));
    },
  };
}

/** A squirrel: pops out on top of the crown, races twice round over the leaves, and dives back in. */
function squirrel(tree: Tree, toward: number, k: number): Actor {
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.add(ball(0xb5562e, 0.2, 0, 0, 0, 0.8, 0.8, 1.5), ball(0xb5562e, 0.14, 0, 0.06, 0.32), ball(0xc9743e, 0.2, 0, 0.22, -0.34, 0.7, 1.5, 0.8), ball(0x2a2622, 0.03, 0.07, 0.1, 0.42), ball(0x2a2622, 0.03, -0.07, 0.1, 0.42));
  for (const side of [-1, 1]) body.add(cone(0xb5562e, 0.04, 0.1, side * 0.08, 0.16, 0.3));
  group.add(body);
  return {
    group,
    lasts: 4.6,
    pose(t) {
      const round = Math.max(0, Math.min(1, (t - 0.3) / 3.8));
      const a = toward + round * Math.PI * 4;
      const r = tree.r * 0.6 * Math.sin(round * Math.PI);
      const hop = Math.abs(Math.sin(t * 10)) * 0.5;
      body.position.set(tree.x + Math.cos(a) * r, tree.base + tree.h + tree.r * 0.75 + hop, tree.z + Math.sin(a) * r);
      body.rotation.set(0, -a - Math.PI / 2, 0);
      body.scale.setScalar(2.2 * k * ease(there(t, 4.6, 0.35)));
    },
  };
}

// ---- Out from under the mushrooms ----

/** Something small that comes out from under the cap, runs a ring or two round the stem, and goes back under. */
function scurrier(m: Mushroom, toward: number, k: number, make: () => THREE.Group, laps: number, lasts: number, size: number, bounce: number): Actor {
  const group = new THREE.Group();
  const body = make();
  group.add(body);
  return {
    group,
    lasts,
    pose(t) {
      const out = ease(there(t, lasts, 0.7));
      const round = ease(Math.max(0, Math.min(1, (t - 0.4) / (lasts - 0.8))));
      const a = toward + round * Math.PI * 2 * laps;
      const r = (0.25 + m.h * 0.9) * out * (0.5 + 0.5 * k);
      const x = m.x + Math.cos(a) * r;
      const z = m.z + Math.sin(a) * r;
      body.position.set(x, groundHeight(x, z) + Math.abs(Math.sin(t * 9)) * bounce, z);
      body.rotation.y = -a;
      body.scale.setScalar(size * k * (0.35 + 0.65 * out));
    },
  };
}
function mouse(): THREE.Group {
  const g = new THREE.Group();
  g.add(ball(0x9a958c, 0.16, 0, 0.14, 0, 1.5, 0.9, 0.9), ball(0x9a958c, 0.1, 0.24, 0.17, 0), ball(0xe7b5b0, 0.07, 0.22, 0.28, 0.08, 0.4, 1, 1), ball(0xe7b5b0, 0.07, 0.22, 0.28, -0.08, 0.4, 1, 1), ball(0x2a2622, 0.02, 0.32, 0.19, 0.04), ball(0x2a2622, 0.02, 0.32, 0.19, -0.04));
  const tail = stick(0xe7b5b0, 0.012, 0.02, 0.4, -0.22, 0.1, 0);
  tail.rotation.z = Math.PI / 2 + 0.4;
  g.add(tail);
  return g;
}
function hedgehog(): THREE.Group {
  const g = new THREE.Group();
  g.add(ball(0x6b4a2e, 0.2, 0, 0.16, 0, 1.3, 0.9, 1), ball(0xd9b08a, 0.09, 0.26, 0.11, 0, 1.4, 0.9, 0.9), ball(0x2a2622, 0.025, 0.36, 0.1, 0));
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const up = 0.5 + (i % 3) * 0.35;
    const spine = cone(0x4a3320, 0.03, 0.14, Math.cos(a) * 0.16 * Math.cos(up) - 0.04, 0.2 + Math.sin(up) * 0.12, Math.sin(a) * 0.15 * Math.cos(up));
    spine.rotation.set(Math.sin(a) * (1.2 - up * 0.6), 0, -Math.cos(a) * (1.2 - up * 0.6));
    g.add(spine);
  }
  return g;
}
/** Tan and white, with a yellow ring still tied to its back. */
function guineaPig(): THREE.Group {
  const g = new THREE.Group();
  g.add(ball(0xd9a25a, 0.2, 0, 0.17, 0, 1.5, 0.95, 1), ball(0xf2ead8, 0.16, 0.16, 0.17, 0, 1.2, 1, 1.05), ball(0xd9a25a, 0.12, 0.33, 0.2, 0), ball(0x2a2622, 0.025, 0.4, 0.24, 0.07), ball(0x2a2622, 0.025, 0.4, 0.24, -0.07), ball(0xe7b5b0, 0.05, 0.3, 0.3, 0.1, 0.5, 1, 1), ball(0xe7b5b0, 0.05, 0.3, 0.3, -0.1, 0.5, 1, 1));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 16), new THREE.MeshBasicMaterial({ color: 0xffd84a }));
  ring.position.set(-0.05, 0.37, 0);
  ring.rotation.x = Math.PI / 2 - 0.4;
  g.add(ring);
  return g;
}

// ---- Who answers a tap ----

export interface Folk {
  group: THREE.Group;
  /** A tap along this line of sight: if it lands on a tree or a tall mushroom, someone comes out. */
  tap(ray: THREE.Ray, kind?: number): void;
  update(dt: number): void;
}

export function createFolk(): Folk {
  const group = new THREE.Group();
  const playing: { actor: Actor; t: number; key: string }[] = [];
  const point = new THREE.Vector3();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  let turn = 0;
  /** How far along the ray it passes within `reach` of the upright line from `foot` up to `height`; or Infinity. */
  const near = (ray: THREE.Ray, x: number, y: number, z: number, height: number, reach: number): number => {
    a.set(x, y, z);
    b.set(x, y + height, z);
    const d2 = ray.distanceSqToSegment(a, b, point);
    return d2 < reach * reach ? ray.origin.distanceTo(point) : Infinity;
  };
  return {
    group,
    tap(ray, forced) {
      if (playing.length >= 3) return;
      // Whatever the tap reaches first: a tall mushroom, a trunk, or a crown.
      let best = Infinity;
      let who: ((k: number) => Actor) | null = null;
      let key = '';
      tallMushrooms.forEach((m, i) => {
        const d = near(ray, m.x, m.y, m.z, m.h, m.h * 0.6);
        if (d >= best) return;
        best = d;
        key = `m${i}`;
        const toward = Math.atan2(ray.origin.z - m.z, ray.origin.x - m.x);
        const kind = forced ?? (i + turn) % 5;
        who = (k) => (kind === 4 ? scurrier(m, toward, k, guineaPig, 1, 7, 1.7, 0.03) : kind % 2 ? scurrier(m, toward, k, hedgehog, 1, 6.5, 1.6, 0.02) : scurrier(m, toward, k, mouse, 2, 4.6, 1.5, 0.08));
      });
      trees.forEach((t, i) => {
        const d = Math.min(near(ray, t.x, t.base, t.z, t.h, 0.75), near(ray, t.x, t.base + t.h, t.z, 0.01, t.r * 0.8));
        if (d >= best) return;
        best = d;
        key = `t${i}`;
        const toward = Math.atan2(ray.origin.z - t.z, ray.origin.x - t.x);
        const kind = (forced ?? i + turn) % 4;
        who = (k) => [dryad, faun, owl, squirrel][kind](t, toward, k);
      });
      if (!who || playing.some((p) => p.key === key)) return;
      // Seen from far overhead they are drawn larger, or they would be specks; close to, they are their own size.
      const actor = (who as (k: number) => Actor)(Math.max(1, Math.min(3, best / 28)));
      turn++;
      actor.pose(0);
      group.add(actor.group);
      playing.push({ actor, t: 0, key });
    },
    update(dt) {
      for (let i = playing.length - 1; i >= 0; i--) {
        const p = playing[i];
        p.t += dt;
        if (p.t >= p.actor.lasts) {
          group.remove(p.actor.group);
          p.actor.group.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
          playing.splice(i, 1);
        } else p.actor.pose(p.t);
      }
    },
  };
}
