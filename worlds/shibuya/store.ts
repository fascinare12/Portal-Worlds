import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Thing } from './city';

/**
 * The inside of the convenience store: bright after the night street, with
 * shelves, a fridge, a fruit stand, a magazine rack and a clerk at the till.
 * Twelve things in here carry a word. The door at the front leads back out.
 */

export interface Store {
  scene: THREE.Scene;
  things: Thing[];
  /** The way out. */
  exit: THREE.Object3D;
  /** Half the width and depth of the floor she can walk on. */
  half: { x: number; z: number };
  /** True where furniture stands, so she walks round it and not through it. */
  blocked(x: number, z: number): boolean;
  update(time: number): void;
}

const KANA_FONT = '"Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", "Noto Sans JP", "Noto Sans CJK JP", sans-serif';

const lambert = (color: number, glow = 0) => new THREE.MeshLambertMaterial({ color, emissive: glow ? color : 0, emissiveIntensity: glow });

function box(mat: THREE.Material, w: number, h: number, d: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const geo = Math.max(w, h, d) > 5 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 3, Math.min(0.06, Math.min(w, h, d) * 0.3));
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

function ball(mat: THREE.Material, r: number, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildStore(): Store {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9eef2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfd6dc, 2.1));
  const lamp = new THREE.DirectionalLight(0xffffff, 0.9);
  lamp.position.set(2, 6, 3);
  scene.add(lamp);

  const things: Thing[] = [];
  const unseen = new THREE.MeshBasicMaterial({ visible: false });
  const thing = (word: string, object: THREE.Object3D, lift: number) => {
    // An unseen box round each thing, a little bigger than it is, so a finger does not have to be exact.
    // It is measured where the thing stands, then placed in the thing's own frame.
    object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3()).addScalar(0.3).divideScalar(object.scale.x);
    const across = Math.max(size.x, size.z); // the thing may be turned, so allow for either way round
    const pad = new THREE.Mesh(new THREE.BoxGeometry(across, size.y, across), unseen);
    pad.position.copy(object.worldToLocal(bounds.getCenter(new THREE.Vector3())));
    object.add(pad);
    scene.add(object);
    things.push({ word, object, anchor: object.position.clone().add(new THREE.Vector3(0, lift, 0)) });
  };

  // Where the furniture stands: centre, and half its width and depth plus room for a person.
  const solid: [number, number, number, number][] = [];
  const block = (x: number, z: number, w: number, d: number) => solid.push([x, z, w / 2 + 0.4, d / 2 + 0.4]);

  const W = 13; // across
  const D = 10; // front to back
  const H = 3.6;

  // Floor: pale tiles, polished enough to catch the lights.
  const floorMap = canvasTexture(256, 256, (g) => {
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        g.fillStyle = (x + y) % 2 ? '#e6ebe8' : '#f4f6f2';
        g.fillRect(x * 64, y * 64, 64, 64);
      }
    }
    g.strokeStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i <= 4; i++) {
      g.strokeRect(i * 64, 0, 0.5, 256);
      g.strokeRect(0, i * 64, 256, 0.5);
    }
  });
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
  floorMap.repeat.set(5, 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshLambertMaterial({ map: floorMap }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Walls and ceiling, with strip lights overhead.
  const wall = lambert(0xf2efe6);
  scene.add(box(wall, W, H, 0.2, 0, H / 2, -D / 2), box(wall, 0.2, H, D, -W / 2, H / 2, 0), box(wall, 0.2, H, D, W / 2, H / 2, 0));
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lambert(0xfafafa));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  scene.add(ceiling);
  for (const x of [-4, 0, 4]) scene.add(box(new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.3, 0.06, 7, x, H - 0.05, 0));
  // A band of colour round the top of the walls, as these shops have.
  for (const [colour, y] of [[0x2f9a6a, H - 0.5], [0xf4a23a, H - 0.72]] as const) {
    scene.add(box(lambert(colour, 0.2), W - 0.3, 0.2, 0.06, 0, y, -D / 2 + 0.14));
  }

  // The front: glass looking out on the night street, and the door.
  const night = canvasTexture(512, 256, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, '#0c0a2a');
    sky.addColorStop(1, '#6a2a70');
    g.fillStyle = sky;
    g.fillRect(0, 0, 512, 256);
    // Lit windows and lanterns across the road, out of focus.
    for (let i = 0; i < 90; i++) {
      g.fillStyle = ['#ffd27a', '#ff4fa3', '#39e6ff', '#ff6a3a'][i % 4];
      g.globalAlpha = 0.25 + Math.random() * 0.5;
      g.beginPath();
      g.arc(Math.random() * 512, Math.random() * 220, 3 + Math.random() * 9, 0, 6.3);
      g.fill();
    }
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: night }));
  glass.rotation.y = Math.PI;
  glass.position.set(0, H / 2, D / 2);
  scene.add(glass);
  for (const x of [-W / 2 + 0.1, -2.2, 2.2, W / 2 - 0.1]) scene.add(box(lambert(0xd8dde0), 0.14, H, 0.14, x, H / 2, D / 2 - 0.08));
  // The door: a bright frame with a green sign over it that says "exit".
  const exit = new THREE.Group();
  exit.add(box(new THREE.MeshBasicMaterial({ color: 0xbff3e0, transparent: true, opacity: 0.55 }), 2.2, 2.7, 0.08, 0, 1.35, 0));
  exit.add(box(lambert(0xd8dde0), 0.1, 2.7, 0.12, 0, 1.35, 0));
  const exitSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.55),
    new THREE.MeshBasicMaterial({
      map: canvasTexture(384, 124, (g) => {
        g.fillStyle = '#1f9a5a';
        g.fillRect(0, 0, 384, 124);
        g.fillStyle = '#ffffff';
        g.font = `800 84px ${KANA_FONT}`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('でぐち', 192, 66);
      }),
    }),
  );
  exitSign.rotation.y = Math.PI;
  exitSign.position.set(0, 3.05, -0.06);
  exit.add(exitSign);
  exit.position.set(0, 0, D / 2 - 0.1);
  scene.add(exit);

  // Shelving: a long unit against the back wall, and one down the middle of the floor.
  const steel = lambert(0xdfe3e6);
  const shelfUnit = (x: number, z: number, w: number, turn: number) => {
    const g = new THREE.Group();
    g.add(box(steel, w, 2, 0.08, 0, 1, -0.28));
    for (const y of [0.35, 0.95, 1.55]) g.add(box(steel, w, 0.05, 0.6, 0, y, 0), box(lambert(0xf4a23a), w, 0.07, 0.03, 0, y - 0.01, 0.3));
    g.position.set(x, 0, z);
    g.rotation.y = turn;
    scene.add(g);
    block(x, z, w, 0.6);
    // Rows of ordinary stock, so the named things sit among other goods.
    const colours = [0xff7a8a, 0x6fc3ff, 0xffe27a, 0x9be08a, 0xc9a2ff, 0xffb070];
    for (const y of [0.35, 0.95, 1.55]) {
      for (let i = 0; i < w / 0.34 - 1; i++) {
        if ((i * 7 + Math.round(y * 10)) % 5 === 0) continue;
        const b = box(lambert(colours[(i + Math.round(y * 3)) % colours.length]), 0.22, 0.26 + ((i * 3) % 3) * 0.05, 0.2, -w / 2 + 0.3 + i * 0.34, y + 0.17, 0.05);
        g.add(b);
      }
    }
    return g;
  };
  shelfUnit(-1.5, -D / 2 + 0.55, 7.4, 0);
  shelfUnit(-0.6, -0.6, 4.6, 0);
  shelfUnit(-0.6, -1.25, 4.6, Math.PI);

  /** Puts something on show on a small stand at shelf height, where it is easy to see and tap. */
  const stand = (x: number, z: number, colour = 0xffffff) => {
    scene.add(box(lambert(colour), 1.1, 1, 0.8, x, 0.5, z));
    block(x, z, 1.1, 0.8);
  };

  // おべんとう: a boxed lunch with rice, a pickled plum, and two side dishes.
  {
    const g = new THREE.Group();
    g.add(box(lambert(0x2a2622), 0.9, 0.12, 0.6, 0, 0, 0));
    g.add(box(lambert(0xffffff), 0.38, 0.1, 0.48, -0.22, 0.06, 0), ball(lambert(0xd8382e), 0.06, -0.22, 0.13, 0));
    g.add(box(lambert(0xf4c04a), 0.34, 0.1, 0.2, 0.22, 0.06, -0.14), box(lambert(0x5aa85a), 0.34, 0.1, 0.2, 0.22, 0.06, 0.14));
    g.add(ball(lambert(0xff8a5a), 0.07, 0.14, 0.12, -0.14), ball(lambert(0xff8a5a), 0.07, 0.3, 0.12, -0.14));
    stand(-4.2, -3.6, 0xf4a23a);
    g.position.set(-4.2, 1.1, -3.6);
    g.rotation.x = 0.35;
    g.scale.setScalar(1.25);
    thing('obentou', g, 0.9);
  }

  // おかし: bags and boxes of snacks.
  {
    const g = new THREE.Group();
    const bag = (colour: number, x: number, lean: number) => {
      const b = box(lambert(colour), 0.34, 0.5, 0.14, x, 0.25, 0);
      b.rotation.z = lean;
      g.add(b, box(lambert(0xffffff), 0.22, 0.14, 0.15, x, 0.3, 0.005));
    };
    bag(0xff4fa3, -0.4, 0.08);
    bag(0xffd23a, 0, -0.05);
    bag(0x39b6ff, 0.4, 0.1);
    stand(-2.6, 1.2, 0xff7a8a);
    g.position.set(-2.6, 1, 1.2);
    thing('okashi', g, 1);
  }

  // The fridge along the left wall, with glass doors: milk and eggs inside.
  {
    scene.add(box(lambert(0xcfe6f2), 0.7, 2.4, 4.4, -W / 2 + 0.5, 1.2, -1.2));
    block(-W / 2 + 0.5, -1.2, 0.7, 4.4);
    scene.add(box(new THREE.MeshBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.25 }), 0.04, 2.1, 4.2, -W / 2 + 0.88, 1.25, -1.2));
    // ぎゅうにゅう: a carton of milk with a folded top.
    const milk = new THREE.Group();
    for (const dz of [-0.26, 0.26]) {
      milk.add(box(lambert(0xffffff), 0.26, 0.5, 0.26, 0, 0.25, dz), box(lambert(0x2f7fd0), 0.27, 0.16, 0.27, 0, 0.22, dz));
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.19, 0.14, 4).rotateY(Math.PI / 4), lambert(0xffffff));
      top.position.set(0, 0.57, dz);
      milk.add(top);
    }
    milk.position.set(-W / 2 + 1.05, 1, -2.2);
    milk.scale.setScalar(1.25);
    thing('gyuunyuu', milk, 1.2);
    // たまご: a carton of six eggs.
    const eggs = new THREE.Group();
    eggs.add(box(lambert(0xc9b48a), 0.34, 0.1, 0.9, 0, 0, 0));
    for (let i = 0; i < 6; i++) eggs.add(ball(lambert(0xfff6e6), 0.085, (i % 2 ? 0.08 : -0.08), 0.1, -0.3 + Math.floor(i / 2) * 0.3, 1, 1.25, 1));
    eggs.position.set(-W / 2 + 1.05, 1.1, -0.4);
    eggs.rotation.z = -0.3;
    eggs.scale.setScalar(1.25);
    thing('tamago', eggs, 0.8);
  }

  // The fruit and vegetable stand along the right of the back wall.
  {
    const crate = (x: number) => {
      scene.add(box(lambert(0xb98a55), 1.15, 0.9, 0.9, x, 0.45, -D / 2 + 0.75));
      block(x, -D / 2 + 0.75, 1.15, 0.9);
    };
    const pile = (mat: THREE.Material, r: number, squash = 1) => {
      const g = new THREE.Group();
      for (const [x, y, z] of [[-0.2, 0, -0.12], [0.2, 0, -0.12], [0, 0, 0.2], [0, r * 1.4, 0]]) g.add(ball(mat, r, x, y + r, z, 1, squash, 1));
      return g;
    };
    // みかん: mandarin oranges, each with a little green stalk.
    const mikan = pile(lambert(0xff9a1f), 0.2, 0.85);
    mikan.add(box(lambert(0x3f8a3f), 0.05, 0.05, 0.05, 0, 0.66, 0));
    crate(3);
    mikan.position.set(3, 0.9, -D / 2 + 0.75);
    thing('mikan', mikan, 1);
    // もも: peaches.
    const momo = pile(lambert(0xffa8b8), 0.21);
    crate(4.3);
    momo.position.set(4.3, 0.9, -D / 2 + 0.75);
    thing('momo', momo, 1.05);
    // いちご: a punnet of strawberries.
    const ichigo = new THREE.Group();
    ichigo.add(box(lambert(0xeaf2e6), 0.8, 0.14, 0.56, 0, 0.07, 0));
    for (let i = 0; i < 6; i++) {
      const x = -0.24 + (i % 3) * 0.24;
      const z = i < 3 ? -0.12 : 0.12;
      const berry = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 12).rotateX(Math.PI), lambert(0xe0283a));
      berry.position.set(x, 0.25, z);
      ichigo.add(berry, ball(lambert(0x3f8a3f), 0.06, x, 0.36, z, 1.4, 0.4, 1.4));
    }
    crate(5.6);
    ichigo.position.set(5.6, 0.9, -D / 2 + 0.75);
    ichigo.scale.setScalar(1.2);
    thing('ichigo', ichigo, 0.9);
    // やさい: vegetables in a basket: a cabbage, two carrots and a tomato.
    const yasai = new THREE.Group();
    yasai.add(box(lambert(0x8a6a44), 1, 0.3, 0.7, 0, 0.15, 0), ball(lambert(0x8fcf6a), 0.26, -0.22, 0.46, 0));
    for (const z of [-0.12, 0.14]) {
      const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.44, 10).rotateZ(Math.PI / 2), lambert(0xff8a2a));
      carrot.position.set(0.24, 0.38, z);
      yasai.add(carrot, ball(lambert(0x3f8a3f), 0.06, 0.02, 0.38, z, 1.6, 0.6, 0.6));
    }
    yasai.add(ball(lambert(0xe0383a), 0.13, 0.12, 0.44, -0.3));
    scene.add(box(lambert(0xb98a55), 1.15, 0.9, 0.9, W / 2 - 0.8, 0.45, -2.6));
    block(W / 2 - 0.8, -2.6, 0.9, 1.15);
    yasai.position.set(W / 2 - 0.8, 0.9, -2.6);
    yasai.rotation.y = -Math.PI / 2;
    thing('yasai', yasai, 1.05);
  }

  // ざっし: magazines in a rack by the window.
  {
    const g = new THREE.Group();
    g.add(box(steel, 1.8, 1.5, 0.3, 0, 0.75, 0));
    const covers = [0xff4fa3, 0x39b6ff, 0xffd23a, 0x8a5ad0, 0x4fc08a, 0xff7a3a];
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 4; i++) {
        const m = box(lambert(covers[(i + row * 2) % covers.length]), 0.36, 0.5, 0.03, -0.63 + i * 0.42, 0.45 + row * 0.6, -0.18);
        m.rotation.x = 0.25;
        g.add(m, box(lambert(0xffffff), 0.26, 0.1, 0.035, -0.63 + i * 0.42, 0.58 + row * 0.6, -0.2));
      }
    }
    g.position.set(-4.3, 0, D / 2 - 0.6);
    block(-4.3, D / 2 - 0.6, 1.8, 0.3);
    thing('zasshi', g, 2);
  }

  // かご: a stack of shopping baskets by the door.
  {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const y = 0.16 + i * 0.13;
      const red = lambert(0xe0383a);
      g.add(box(red, 0.8, 0.05, 0.56, 0, y - 0.1, 0), box(red, 0.8, 0.26, 0.04, 0, y, 0.27), box(red, 0.8, 0.26, 0.04, 0, y, -0.27), box(red, 0.04, 0.26, 0.56, 0.39, y, 0), box(red, 0.04, 0.26, 0.56, -0.39, y, 0));
    }
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 8, 20, Math.PI), lambert(0x2a2622));
    handle.position.y = 0.66;
    g.add(handle);
    g.position.set(2.1, 0, D / 2 - 0.9);
    block(2.1, D / 2 - 0.9, 0.9, 0.65);
    g.scale.setScalar(1.15);
    thing('kago', g, 1.5);
  }

  // The counter, with the till and the clerk behind it.
  {
    scene.add(box(lambert(0xf4f0e6), 3.2, 1.05, 0.9, W / 2 - 2.2, 0.52, 1.6), box(lambert(0x2f9a6a), 3.2, 0.12, 0.92, W / 2 - 2.2, 0.2, 1.6));
    scene.add(box(lambert(0x3a3a44), 0.6, 0.4, 0.5, W / 2 - 1.3, 1.25, 1.6), box(lambert(0x9fe0c0, 0.6), 0.4, 0.3, 0.03, W / 2 - 1.3, 1.56, 1.42));
    block(W / 2 - 2.2, 2.05, 3.2, 1.9); // the counter and the clerk's place behind it
    // おかね: coins and a note in the tray on the counter.
    const money = new THREE.Group();
    money.add(box(lambert(0x3a6a8a), 0.7, 0.04, 0.46, 0, 0, 0), box(lambert(0xcfe6c0), 0.46, 0.02, 0.22, -0.06, 0.04, -0.06));
    for (const [x, z, colour] of [[0.2, 0.1, 0xf2c84b], [0.05, 0.14, 0xd8d8e0], [-0.14, 0.13, 0xf2c84b], [0.24, -0.08, 0xc98a5a]] as const) {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20), lambert(colour, 0.25));
      coin.position.set(x, 0.05, z);
      money.add(coin);
    }
    money.position.set(W / 2 - 2.6, 1.08, 1.35);
    money.rotation.x = 0.5;
    money.scale.setScalar(1.3);
    thing('okane', money, 0.7);

    // てんいん: the clerk, in an apron and cap, who bows a little now and then.
    const clerk = new THREE.Group();
    const capsule = (mat: THREE.Material, r: number, len: number, x: number, y: number) => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat);
      m.position.set(x, y, 0);
      return m;
    };
    const shirt = lambert(0xffffff);
    const upper = new THREE.Group();
    upper.name = 'upper';
    upper.position.y = 0.95;
    const torso = capsule(shirt, 0.26, 0.42, 0, 0.3);
    torso.scale.z = 0.7;
    upper.add(torso, box(lambert(0x2f9a6a), 0.44, 0.6, 0.06, 0, 0.26, 0.18), capsule(shirt, 0.075, 0.5, 0.34, 0.3), capsule(shirt, 0.075, 0.5, -0.34, 0.3));
    upper.add(ball(lambert(0xf0c9a0), 0.19, 0, 0.9, 0), ball(lambert(0x1a1626), 0.2, 0, 0.95, -0.04, 1, 0.75, 1));
    upper.add(box(lambert(0x2f9a6a), 0.42, 0.1, 0.42, 0, 1.08, 0), box(lambert(0x2f9a6a), 0.3, 0.04, 0.2, 0, 1.04, 0.26));
    upper.add(ball(lambert(0x2a2018), 0.022, 0.07, 0.92, 0.18), ball(lambert(0x2a2018), 0.022, -0.07, 0.92, 0.18));
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI), lambert(0x8a3a3a));
    smile.rotation.z = Math.PI;
    smile.position.set(0, 0.86, 0.185);
    upper.add(smile);
    clerk.add(capsule(lambert(0x23203a), 0.1, 0.7, 0.12, 0.45), capsule(lambert(0x23203a), 0.1, 0.7, -0.12, 0.45), upper);
    clerk.position.set(W / 2 - 2.2, 0, 2.5);
    clerk.rotation.y = Math.PI;
    clerk.scale.setScalar(1.15);
    thing('tenin', clerk, 2.6);
  }

  const upper = scene.getObjectByName('upper')!;
  return {
    scene,
    things,
    exit,
    half: { x: W / 2 - 0.9, z: D / 2 - 0.9 },
    blocked: (x, z) => solid.some(([cx, cz, hx, hz]) => Math.abs(x - cx) < hx && Math.abs(z - cz) < hz),
    update(time) {
      // A small bow from the clerk every few seconds.
      const beat = (time % 7) / 7;
      upper.rotation.x = beat < 0.12 ? Math.sin((beat / 0.12) * Math.PI) * 0.45 : 0;
    },
  };
}
