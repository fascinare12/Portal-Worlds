import * as THREE from 'three';
import { lerp } from '../../noise';
import { paint } from '../paint';

/**
 * The sphinx itself: a body carved from sandstone blocks, and the way it moves.
 * Each world that the sphinx appears in decides where it goes and what it
 * does; this file only knows what it looks like and how to strike a pose.
 */

const STONE = 0xd9b97c;
const STONE_SHADE = 0xbf9a60;
const LAPIS = 0x2f5fa8;
const GOLD = 0xe6bd4c;
const DARK = 0x3a2c22;

export interface SphinxPose {
  /** 1 = on its feet, 0 = lying down. */
  stand: number;
  /** 1 = tail wrapped round, head tucked. */
  curl: number;
  /** 0 = still, 1 = walking. */
  walking: number;
  /** Advances with each step taken. */
  stride: number;
  /** Seconds it has been alive, for breathing and tail flicks. */
  life: number;
  /** 1 = head up and looking about. */
  glance: number;
}

function block(mat: THREE.Material, w: number, h: number, d: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

export function buildSphinx(): { group: THREE.Group; pose(p: SphinxPose): void } {
  const stone = paint({ color: STONE, dab: 0.5 });
  const shade = paint({ color: STONE_SHADE, dab: 0.5 });
  const lapis = paint({ color: LAPIS, dab: 0.4 });
  const gold = paint({ color: GOLD, dab: 0.4 });
  const dark = paint({ color: DARK, dab: 0.2 });

  const group = new THREE.Group();

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

  return {
    group,
    pose({ stand, curl, walking, stride, life, glance }) {
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
