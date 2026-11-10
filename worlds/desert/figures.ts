import * as THREE from 'three';
import type { ModeId } from './modes';

/**
 * Who turns up when a blueprint is finished: a golden pharaoh for the pyramid,
 * a knight on a horse for the castle, monkeys for the tree fort, astronauts
 * for the rocket and townspeople for the town. All are built from blocks, like
 * the sphinx, and all they do is walk about the finished building.
 */

export interface Figure {
  group: THREE.Group;
  /** Moves the limbs for this point in the walk. */
  step(phase: number): void;
  /** How high it bobs with each step. */
  bounce: number;
  /** How fast it walks, in blocks per second. */
  speed: number;
}

const materials = new Map<number, THREE.MeshLambertMaterial>();
function mat(color: number, glow = 0): THREE.MeshLambertMaterial {
  const key = color + glow * 16777216;
  let m = materials.get(key);
  if (!m) materials.set(key, (m = new THREE.MeshLambertMaterial({ color, emissive: glow ? color : 0, emissiveIntensity: glow })));
  return m;
}

function block(color: number, w: number, h: number, d: number, x = 0, y = 0, z = 0, glow = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, glow));
  mesh.position.set(x, y, z);
  return mesh;
}

/** A limb that swings from its top end. */
function limb(color: number, w: number, h: number, d: number, x: number, y: number, z = 0): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  pivot.add(block(color, w, h, d, 0, -h / 2, 0));
  return pivot;
}

interface Person {
  skin: number;
  top: number;
  legs: number;
  size: number;
  /** Extra blocks on the head (hats, helmets, crowns) and on the body. */
  dress?(head: THREE.Group, body: THREE.Group): void;
  glow?: number;
  bounce?: number;
  speed?: number;
}

/** A two-legged figure: legs, body, arms and a head, about one block tall before scaling. */
function person(p: Person): Figure {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const g = p.glow ?? 0;
  const legL = limb(p.legs, 0.15, 0.45, 0.17, 0.1, 0.45);
  const legR = limb(p.legs, 0.15, 0.45, 0.17, -0.1, 0.45);
  const armL = limb(p.top, 0.11, 0.4, 0.13, 0.26, 0.88);
  const armR = limb(p.top, 0.11, 0.4, 0.13, -0.26, 0.88);
  const head = new THREE.Group();
  head.position.set(0, 1.08, 0);
  head.add(block(p.skin, 0.3, 0.3, 0.3, 0, 0, 0, g));
  // Two dark eyes, so it is clear which way it faces.
  head.add(block(0x2a2018, 0.05, 0.05, 0.02, 0.07, 0.03, 0.155), block(0x2a2018, 0.05, 0.05, 0.02, -0.07, 0.03, 0.155));
  body.add(legL, legR, armL, armR, head, block(p.top, 0.4, 0.46, 0.24, 0, 0.68, 0, g));
  p.dress?.(head, body);
  group.scale.setScalar(p.size);
  return {
    group,
    bounce: p.bounce ?? 0.04,
    speed: p.speed ?? 1.1,
    step(phase) {
      const swing = Math.sin(phase) * 0.6;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.8;
      armR.rotation.x = swing * 0.8;
    },
  };
}

function pharaoh(): Figure {
  const gold = 0xf2c84b;
  return person({
    skin: gold,
    top: gold,
    legs: 0xe0b13a,
    size: 1.9,
    glow: 0.35,
    speed: 0.8,
    dress(head, body) {
      // The striped headcloth, and a crook to carry.
      head.add(block(0x2f5fa8, 0.44, 0.44, 0.22, 0, 0.02, -0.1), block(gold, 0.46, 0.07, 0.24, 0, 0.14, -0.1, 0.35));
      head.add(block(0x2f5fa8, 0.1, 0.36, 0.12, 0.19, -0.2, 0.04), block(0x2f5fa8, 0.1, 0.36, 0.12, -0.19, -0.2, 0.04));
      head.add(block(gold, 0.34, 0.07, 0.32, 0, 0.18, 0.005, 0.35), block(gold, 0.07, 0.14, 0.07, 0, -0.2, 0.13, 0.35));
      body.add(block(0x2f5fa8, 0.05, 0.9, 0.05, 0.34, 0.75, 0.1), block(0x2f5fa8, 0.05, 0.05, 0.16, 0.34, 1.2, 0.16));
      body.add(block(0x2f9a9a, 0.42, 0.1, 0.26, 0, 0.86, 0));
    },
  });
}

function astronaut(): Figure {
  return person({
    skin: 0xf4f6f8,
    top: 0xf4f6f8,
    legs: 0xe2e6ea,
    size: 1.35,
    bounce: 0.28, // low gravity
    speed: 0.7,
    dress(head, body) {
      head.add(block(0xf4f6f8, 0.4, 0.4, 0.4, 0, 0.02, 0), block(0x2b4f8f, 0.28, 0.2, 0.03, 0, 0.03, 0.2));
      body.add(block(0xc9ced4, 0.34, 0.4, 0.14, 0, 0.72, -0.19), block(0xd94f4f, 0.12, 0.08, 0.02, 0.08, 0.78, 0.125));
    },
  });
}

function monkey(): Figure {
  const fur = 0x8a5a34;
  return person({
    skin: fur,
    top: fur,
    legs: 0x7a4c2a,
    size: 0.85,
    bounce: 0.22,
    speed: 1.9,
    dress(head, body) {
      head.add(block(0xe0b98a, 0.2, 0.16, 0.04, 0, -0.04, 0.15), block(fur, 0.1, 0.12, 0.06, 0.2, 0.02, 0), block(fur, 0.1, 0.12, 0.06, -0.2, 0.02, 0));
      // A long tail that curls up behind.
      body.add(block(fur, 0.07, 0.07, 0.36, 0, 0.5, -0.28), block(fur, 0.07, 0.3, 0.07, 0, 0.66, -0.44));
    },
  });
}

function townsperson(i: number): Figure {
  const tops = [0xd9485f, 0x2f7fd0, 0xe6a23c, 0x4f9a5c, 0x7a4fc9];
  const hairs = [0x3a2c22, 0x8a5a34, 0xe6c85a, 0x2a2018];
  const skins = [0xf0c9a0, 0xc68e5c, 0x8a5a3c, 0xe8b48a];
  return person({
    skin: skins[i % skins.length],
    top: tops[i % tops.length],
    legs: i % 2 ? 0x4a5568 : 0x7a5a3c,
    size: i % 3 === 2 ? 0.95 : 1.25, // one in three is a child
    speed: 0.9 + (i % 3) * 0.25,
    dress(head) {
      head.add(block(hairs[i % hairs.length], 0.32, 0.1, 0.32, 0, 0.17, 0), block(hairs[i % hairs.length], 0.32, 0.2, 0.08, 0, 0.06, -0.13));
    },
  });
}

/** A knight in armour riding a horse. */
function knight(): Figure {
  const group = new THREE.Group();
  const coat = 0x8a5a34;
  const horse = new THREE.Group();
  group.add(horse);
  horse.add(block(coat, 0.42, 0.46, 1.05, 0, 0.92, 0));
  // Neck, head, mane and tail.
  const neck = block(coat, 0.26, 0.56, 0.26, 0, 1.3, 0.5);
  neck.rotation.x = 0.5;
  horse.add(neck, block(coat, 0.24, 0.26, 0.46, 0, 1.56, 0.78), block(0x2a2018, 0.08, 0.5, 0.2, 0, 1.42, 0.38));
  horse.add(block(0x2a2018, 0.05, 0.05, 0.02, 0.1, 1.6, 1.01), block(0x2a2018, 0.05, 0.05, 0.02, -0.1, 1.6, 1.01));
  const tail = limb(0x2a2018, 0.1, 0.5, 0.1, 0, 1.08, -0.56);
  tail.rotation.x = -0.5;
  horse.add(tail);
  // A red cloth under the saddle.
  horse.add(block(0xb83a3a, 0.46, 0.3, 0.5, 0, 0.96, -0.02));
  const legs = [
    limb(coat, 0.13, 0.7, 0.15, 0.14, 0.7, 0.4),
    limb(coat, 0.13, 0.7, 0.15, -0.14, 0.7, 0.4),
    limb(coat, 0.13, 0.7, 0.15, 0.14, 0.7, -0.4),
    limb(coat, 0.13, 0.7, 0.15, -0.14, 0.7, -0.4),
  ];
  horse.add(...legs);

  const steel = 0xb8c0c8;
  const rider = person({
    skin: steel,
    top: steel,
    legs: 0x8f98a6,
    size: 1,
    dress(head, body) {
      head.add(block(0x4a5568, 0.26, 0.05, 0.02, 0, 0.03, 0.16)); // visor slit
      head.add(block(0xd9485f, 0.08, 0.26, 0.24, 0, 0.26, -0.04)); // plume
      // A lance held upright, with a pennant.
      body.add(block(0x7a5a3c, 0.05, 1.5, 0.05, -0.34, 0.95, 0.1), block(0xd9485f, 0.02, 0.2, 0.3, -0.34, 1.6, -0.06));
      body.add(block(0x2f7fd0, 0.04, 0.34, 0.28, 0.3, 0.72, 0.06)); // shield
    },
  });
  rider.group.position.set(0, 0.72, -0.05);
  rider.step(0.9); // legs astride, not walking
  group.add(rider.group);
  group.scale.setScalar(1.6);

  return {
    group,
    bounce: 0.07,
    speed: 2.2,
    step(phase) {
      legs.forEach((leg, i) => {
        leg.rotation.x = Math.sin(phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.55;
      });
      tail.rotation.x = -0.5 + Math.sin(phase * 0.5) * 0.15;
    },
  };
}

/** The visitors for a finished build. */
export function figuresFor(mode: ModeId): Figure[] {
  switch (mode) {
    case 'pyramid':
      return [pharaoh()];
    case 'castle':
      return [knight()];
    case 'treefort':
      return [monkey(), monkey(), monkey()];
    case 'rocket':
      return [astronaut(), astronaut()];
    case 'town':
      return [0, 1, 2, 3, 4].map(townsperson);
  }
}
