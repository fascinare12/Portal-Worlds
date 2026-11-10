import * as THREE from 'three';
import { WORDS } from './words';

/**
 * A city street at night, in the spirit of Shibuya: tall buildings with lit
 * windows, neon signs in kana, strings of lights and lanterns overhead, wet
 * asphalt that mirrors it all, and graffiti on the walls.
 *
 * Twelve things in the street carry a word. Tapping one says its name.
 */

export interface Thing {
  word: string;
  object: THREE.Object3D;
  /** Where its label floats. */
  anchor: THREE.Vector3;
}

export interface City {
  scene: THREE.Scene;
  things: Thing[];
  /** The puddle that leads back to the wood. */
  puddle: THREE.Mesh;
  /** Sprays a word's tag onto the next free stretch of wall. */
  tag(kana: string, animate: boolean): void;
  /** Sets off a firework over the street. */
  firework(): void;
  update(time: number, dt: number): void;
}

/** Half the width of the road, and of the road plus its pavements. */
export const ROAD = 7;
export const KERB = 11;

const NEON = ['#ff4fa3', '#39e6ff', '#ffe14a', '#8cff6a', '#c58bff', '#ff7a3a'];
const KANA_FONT = '"Hiragino Maru Gothic ProN", "Hiragino Sans", "Yu Gothic", "Meiryo", "Noto Sans JP", "Noto Sans CJK JP", sans-serif';

let seed = 12345;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function texture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The face of a building: a dark wall with a grid of windows, some lit, and a bright ground floor. */
function facade(): THREE.CanvasTexture {
  const [c, g] = canvas(128, 256);
  g.fillStyle = pick(['#15142e', '#1b1838', '#121a33', '#201636']);
  g.fillRect(0, 0, 128, 256);
  const cols = 4 + Math.floor(rnd() * 4);
  const rows = 9 + Math.floor(rnd() * 6);
  const cw = 128 / cols;
  const rh = 224 / rows;
  const warm = ['#ffd27a', '#ffe9b0', '#ffbf66', '#fff3d0'];
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const lit = rnd();
      g.fillStyle = lit < 0.5 ? pick(warm) : lit < 0.6 ? pick(NEON) : '#0b0b1c';
      g.globalAlpha = lit < 0.6 ? 0.75 + rnd() * 0.25 : 1;
      g.fillRect(k * cw + 2.5, r * rh + 2.5, cw - 5, rh - 5);
    }
  }
  g.globalAlpha = 1;
  // The ground floor glows like a shopfront.
  const glow = g.createLinearGradient(0, 224, 0, 256);
  glow.addColorStop(0, pick(warm));
  glow.addColorStop(1, '#ff9f5a');
  g.fillStyle = glow;
  g.fillRect(4, 228, 120, 28);
  return texture(c);
}

/** A neon sign: kana glowing on a dark board, written top to bottom as street signs are. */
function sign(kana: string, color: string, upright: boolean): THREE.Mesh {
  const n = kana.length;
  const [c, g] = upright ? canvas(128, 128 * n + 24) : canvas(128 * n + 24, 128);
  g.fillStyle = '#0c0a1c';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = color;
  g.lineWidth = 6;
  g.shadowColor = color;
  g.shadowBlur = 18;
  g.strokeRect(6, 6, c.width - 12, c.height - 12);
  g.font = `bold 96px ${KANA_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  [...kana].forEach((ch, i) => {
    const x = upright ? 64 : 76 + i * 128;
    const y = upright ? 76 + i * 128 : 66;
    g.shadowBlur = 26;
    g.fillStyle = color;
    g.fillText(ch, x, y);
    g.shadowBlur = 0;
    g.fillStyle = '#ffffff';
    g.globalAlpha = 0.85;
    g.fillText(ch, x, y);
    g.globalAlpha = 1;
  });
  const h = upright ? 1.5 * n + 0.3 : 1.5;
  const w = upright ? 1.5 : 1.5 * n + 0.3;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture(c) }));
}

/** Kana as if sprayed on a wall: thick, soft-edged, outlined, slightly tilted. */
function tagTexture(kana: string, color: string): THREE.CanvasTexture {
  const [c, g] = canvas(512, 256);
  g.translate(256, 128);
  g.rotate(-0.07);
  g.font = `900 ${kana.length > 3 ? 110 : 150}px ${KANA_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.shadowColor = color;
  g.shadowBlur = 28;
  g.strokeStyle = '#0a0818';
  g.lineWidth = 26;
  g.strokeText(kana, 0, 0);
  g.shadowBlur = 0;
  g.strokeStyle = '#ffffff';
  g.lineWidth = 12;
  g.strokeText(kana, 0, 0);
  g.fillStyle = color;
  g.fillText(kana, 0, 0);
  // Drips running down from the letters.
  g.fillStyle = color;
  for (let i = 0; i < 6; i++) g.fillRect(-180 + rnd() * 360, 30, 5, 30 + rnd() * 60);
  return texture(c);
}

/** Wordless scribbles and shapes, so the walls look painted before she adds anything. */
function scribble(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 128);
  g.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    g.strokeStyle = pick(NEON);
    g.globalAlpha = 0.55;
    g.lineWidth = 5 + rnd() * 9;
    g.beginPath();
    g.moveTo(rnd() * 256, rnd() * 128);
    g.bezierCurveTo(rnd() * 256, rnd() * 128, rnd() * 256, rnd() * 128, rnd() * 256, rnd() * 128);
    g.stroke();
  }
  return texture(c);
}

const lambert = (color: number, glow = 0) =>
  new THREE.MeshLambertMaterial({ color, emissive: glow ? color : 0, emissiveIntensity: glow });

function box(mat: THREE.Material, w: number, h: number, d: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

export function buildCity(): City {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x241046, 0.011);
  scene.add(new THREE.HemisphereLight(0x8f7bff, 0x3a1a4a, 1.5));
  const moonlight = new THREE.DirectionalLight(0xb8c4ff, 0.7);
  moonlight.position.set(-40, 60, -60);
  scene.add(moonlight);

  // Everything that should show in the wet street goes in `city`, which is then mirrored below the ground.
  const city = new THREE.Group();
  const things: Thing[] = [];
  const glow: number[] = []; // x, y, z, r, g, b, size for every point of light
  const light = (x: number, y: number, z: number, color: string | number, size = 1) => {
    const c = new THREE.Color(color);
    glow.push(x, y, z, c.r, c.g, c.b, size);
  };
  const thing = (word: string, object: THREE.Object3D, lift: number) => {
    city.add(object);
    things.push({ word, object, anchor: object.position.clone().add(new THREE.Vector3(0, lift, 0)) });
  };

  // ---- Sky: deep blue overhead, violet and rose at the horizon, with stars.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: `varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = clamp(d.y, -0.2, 1.0);
          vec3 col = mix(vec3(0.62, 0.20, 0.55), vec3(0.24, 0.10, 0.45), smoothstep(-0.05, 0.22, h));
          col = mix(col, vec3(0.05, 0.05, 0.22), smoothstep(0.15, 0.7, h));
          gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
        }`,
    }),
  );
  scene.add(sky);
  const starPos: number[] = [];
  for (let i = 0; i < 700; i++) {
    const a = rnd() * Math.PI * 2;
    const e = Math.asin(0.08 + rnd() * 0.9);
    starPos.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 })));

  // ---- Buildings, in rows along the main street and the street that crosses it.
  const faces = Array.from({ length: 7 }, () => new THREE.MeshBasicMaterial({ map: facade() }));
  const signWords = WORDS.map((w) => w.kana);
  const building = (x: number, z: number, w: number, d: number, h: number, faceX: number, faceZ: number) => {
    const b = box(pick(faces), w, h, d, x, h / 2, z);
    city.add(b);
    // Most buildings carry a neon sign on the side facing the street.
    if (rnd() < 0.75) {
      const upright = rnd() < 0.6;
      const s = sign(pick(signWords), pick(NEON), upright);
      const y = 5 + rnd() * Math.min(8, h - 8);
      s.position.set(x + faceX * (w / 2 + 0.25), y, z + faceZ * (d / 2 + 0.25));
      if (faceX) {
        s.rotation.y = (faceX * Math.PI) / 2;
        s.position.z += (rnd() - 0.5) * (d - 3);
      } else {
        s.rotation.y = faceZ > 0 ? 0 : Math.PI;
        s.position.x += (rnd() - 0.5) * (w - 3);
      }
      city.add(s);
      light(s.position.x + faceX * 0.5, y, s.position.z + faceZ * 0.5, pick(NEON), 5);
    }
  };
  for (const side of [-1, 1]) {
    for (let z = -46; z < 48; ) {
      const w = 7 + rnd() * 6;
      const mid = z + w / 2;
      if (Math.abs(mid) > 9 + w / 2) building(side * (KERB + 5), mid, 10, w - 0.4, 10 + rnd() * 24, -side, 0);
      z += w;
    }
    for (const far of [-1, 1]) {
      for (let x = KERB + 10; x < 60; ) {
        const w = 7 + rnd() * 6;
        building(side * (x + w / 2), far * (KERB + 3), w - 0.4, 10, 10 + rnd() * 22, 0, -far);
        x += w;
      }
    }
  }

  // ---- The ground: wet asphalt with a striped crossing, and raised pavements.
  const [gc, gg] = canvas(1024, 1024);
  gg.fillStyle = '#0d0c20';
  gg.fillRect(0, 0, 1024, 1024);
  gg.fillStyle = 'rgba(235, 235, 255, 0.85)';
  // One canvas pixel is 0.125 units; the crossing sits in the middle (512, 512).
  const px = (u: number) => 512 + u * 8;
  for (let i = -6; i <= 6; i++) {
    gg.fillRect(px(i) - 3, px(-12), 6, 32); // across the main street, far side
    gg.fillRect(px(i) - 3, px(8), 6, 32); // near side
    gg.fillRect(px(-12), px(i) - 3, 32, 6);
    gg.fillRect(px(8), px(i) - 3, 32, 6);
  }
  gg.fillStyle = 'rgba(255, 225, 74, 0.7)';
  for (let v = -60; v < 60; v += 5) {
    if (Math.abs(v + 1.5) < 13) continue;
    gg.fillRect(px(0) - 1, px(v), 2, 24);
  }
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(128, 128),
    new THREE.MeshBasicMaterial({ map: texture(gc), transparent: true, opacity: 0.74 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.renderOrder = 1;
  scene.add(ground);
  const pavement = lambert(0x3a3550);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      city.add(box(pavement, KERB - ROAD, 0.2, 60, sx * (ROAD + KERB) * 0.5, 0.1, sz * (ROAD + 30)));
      city.add(box(pavement, 60, 0.2, KERB - ROAD, sx * (KERB + 30), 0.1, sz * (ROAD + KERB) * 0.5));
    }
  }

  // ---- Strings of lights and red lanterns across the street, and street lamps.
  const lantern = new THREE.MeshBasicMaterial({ color: 0xff5a3a });
  for (let z = -42; z <= 42; z += 7) {
    if (Math.abs(z) < 8) continue;
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = (t * 2 - 1) * 10.6;
      const y = 8.6 - Math.sin(t * Math.PI) * 1.8;
      if (i % 5 === 2) {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), lantern);
        l.scale.y = 1.2;
        l.position.set(x, y - 0.5, z);
        city.add(l);
        light(x, y - 0.5, z, '#ff6a3a', 4.5);
      } else {
        light(x, y, z, '#ffe0a0', 1.6);
      }
    }
  }
  const pole = lambert(0x2a2740);
  for (let z = -40; z <= 40; z += 16) {
    for (const s of [-1, 1]) {
      city.add(box(pole, 0.16, 5, 0.16, s * (ROAD + 0.6), 2.5, z + s * 3));
      light(s * (ROAD + 0.6), 5.1, z + s * 3, '#fff0c0', 5);
    }
  }

  // ---- Graffiti: wordless scribbles to begin with; her own tags are added as she learns.
  const slots: { x: number; z: number; side: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1;
    const z = 38 - Math.floor(i / 2) * 6.2 - (side > 0 ? 3 : 0);
    if (Math.abs(z) < 11) continue;
    slots.push({ x: side * (KERB - 0.05), z, side });
  }
  for (let i = 0; i < 26; i++) {
    const side = rnd() < 0.5 ? -1 : 1;
    const z = (rnd() * 2 - 1) * 46;
    if (Math.abs(z) < 10) continue;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshBasicMaterial({ map: scribble(), transparent: true, depthWrite: false }));
    s.position.set(side * (KERB - 0.02), 0.5 + rnd() * 2.6, z);
    s.rotation.y = (-side * Math.PI) / 2;
    city.add(s);
  }

  // ---- The twelve things that carry a word.

  // ねこ: a cat sitting on top of a glowing vending machine.
  {
    const g = new THREE.Group();
    const machine = box(lambert(0x39e6ff, 0.7), 1.3, 2.2, 0.9, 0, 1.3, 0);
    const front = box(new THREE.MeshBasicMaterial({ color: 0xffffff }), 1.1, 0.9, 0.05, 0, 1.7, 0.46);
    const fur = lambert(0xf2a65a);
    const cat = new THREE.Group();
    cat.add(box(fur, 0.34, 0.4, 0.5, 0, 0.2, 0), box(fur, 0.3, 0.28, 0.28, 0, 0.5, 0.22));
    cat.add(box(fur, 0.09, 0.12, 0.06, 0.09, 0.68, 0.22), box(fur, 0.09, 0.12, 0.06, -0.09, 0.68, 0.22));
    cat.add(box(lambert(0x8cff6a, 1), 0.05, 0.05, 0.02, 0.07, 0.52, 0.365), box(lambert(0x8cff6a, 1), 0.05, 0.05, 0.02, -0.07, 0.52, 0.365));
    const tail = box(fur, 0.07, 0.07, 0.5, 0.15, 0.1, -0.4);
    tail.name = 'tail';
    cat.add(tail);
    cat.position.y = 2.4;
    cat.scale.setScalar(1.5);
    g.add(machine, front, cat);
    g.position.set(ROAD + 1.6, 0.2, 30);
    g.rotation.y = -Math.PI / 2;
    light(ROAD + 1, 1.8, 30, '#39e6ff', 6);
    thing('neko', g, 4.4);
  }

  // いぬ: a bronze dog on a plinth, the kind people arrange to meet beside.
  {
    const g = new THREE.Group();
    const bronze = lambert(0xa8794a, 0.15);
    g.add(box(lambert(0x55506a), 1.6, 1, 1.6, 0, 0.5, 0));
    g.add(box(bronze, 0.5, 0.6, 0.9, 0, 1.55, 0), box(bronze, 0.44, 0.44, 0.44, 0, 2.05, 0.4));
    g.add(box(bronze, 0.12, 0.2, 0.08, 0.14, 2.36, 0.4), box(bronze, 0.12, 0.2, 0.08, -0.14, 2.36, 0.4));
    g.add(box(bronze, 0.2, 0.18, 0.24, 0, 1.98, 0.7), box(bronze, 0.1, 0.36, 0.1, 0, 1.75, -0.5));
    for (const [x, z] of [[0.17, 0.3], [-0.17, 0.3], [0.17, -0.3], [-0.17, -0.3]]) g.add(box(bronze, 0.13, 0.4, 0.13, x, 1.15, z));
    g.position.set(ROAD + 1.8, 0.2, -32);
    g.rotation.y = -Math.PI / 2;
    light(ROAD + 1.8, 3.4, -32, '#ffe0a0', 5);
    thing('inu', g, 3.3);
  }

  // くるま: a taxi waiting at the kerb.
  {
    const g = new THREE.Group();
    const paint = lambert(0xffc93a, 0.2);
    g.add(box(paint, 1.9, 0.7, 4.2, 0, 0.65, 0), box(paint, 1.7, 0.6, 2.2, 0, 1.3, -0.2));
    g.add(box(lambert(0x9fdcff, 0.5), 1.72, 0.42, 2.0, 0, 1.3, -0.2));
    g.add(box(lambert(0xff4fa3, 1), 0.5, 0.2, 0.3, 0, 1.72, -0.2));
    for (const [x, z] of [[0.95, 1.3], [-0.95, 1.3], [0.95, -1.3], [-0.95, -1.3]]) g.add(box(lambert(0x15131f), 0.25, 0.6, 0.6, x, 0.3, z));
    g.add(box(lambert(0xffffe0, 1), 0.4, 0.18, 0.05, 0.6, 0.7, 2.12), box(lambert(0xffffe0, 1), 0.4, 0.18, 0.05, -0.6, 0.7, 2.12));
    g.add(box(lambert(0xff3030, 1), 0.4, 0.14, 0.05, 0.6, 0.7, -2.12), box(lambert(0xff3030, 1), 0.4, 0.14, 0.05, -0.6, 0.7, -2.12));
    g.position.set(-(ROAD - 1.4), 0, 20);
    light(-(ROAD - 2), 0.7, 22.4, '#ffffd0', 4);
    light(-(ROAD - 0.8), 0.7, 22.4, '#ffffd0', 4);
    thing('kuruma', g, 2.6);
  }

  // えき and でんしゃ: a station at the far end, with a train on the raised track above it.
  {
    const station = new THREE.Group();
    station.add(box(lambert(0x2a2740), 30, 0.7, 6, 0, 7, 0));
    for (const x of [-12, -6, 6, 12]) station.add(box(lambert(0x2a2740), 0.8, 7, 0.8, x, 3.5, 0));
    station.add(box(lambert(0xffe9b0, 0.9), 10, 3.4, 4, 0, 1.9, 0));
    const board = sign('えき', '#8cff6a', false);
    board.scale.setScalar(1.5);
    board.position.set(0, 5, 2.1);
    station.add(board);
    station.position.set(0, 0, -52);
    light(0, 5, -49, '#8cff6a', 8);
    thing('eki', station, 6.6);

    const train = new THREE.Group();
    const body = lambert(0xd8dde4);
    for (let i = 0; i < 3; i++) {
      train.add(box(body, 7.4, 2.4, 2.6, (i - 1) * 7.8, 0, 0));
      train.add(box(lambert(0x4fd08a, 0.5), 7.42, 0.36, 2.62, (i - 1) * 7.8, -0.75, 0));
      train.add(box(lambert(0xffe9b0, 1), 6.4, 0.8, 2.64, (i - 1) * 7.8, 0.35, 0));
    }
    train.position.set(0, 8.75, -52);
    train.name = 'train';
    thing('densha', train, 2.4);
  }

  // みせ: a small shop with an awning and a bright window.
  {
    const g = new THREE.Group();
    g.add(box(lambert(0xffe2a8, 1), 5, 2.6, 0.4, 0, 1.5, 0));
    g.add(box(lambert(0xff4fa3, 0.5), 5.4, 0.25, 1.6, 0, 3, 0.7));
    for (let i = 0; i < 5; i++) g.add(box(lambert(pick([0xff7a3a, 0x8cff6a, 0x39e6ff, 0xffe14a]), 0.6), 0.5, 0.5, 0.5, -1.8 + i * 0.9, 0.55, 0.6));
    const board = sign('みせ', '#ffe14a', false);
    board.position.set(0, 4, 0.3);
    g.add(board);
    g.position.set(-(KERB - 0.5), 0.2, -15);
    g.rotation.y = Math.PI / 2;
    light(-(KERB - 1.6), 1.6, -15, '#ffd27a', 9);
    thing('mise', g, 5.2);
  }

  // き: cherry trees in blossom, hung with small lights.
  for (const [x, z] of [[-(ROAD + 1.8), 12], [ROAD + 1.8, -20], [-(ROAD + 1.8), -38], [ROAD + 1.8, 42]]) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 3, 6), lambert(0x5a3040));
    trunk.position.y = 1.5;
    g.add(trunk);
    const petal = lambert(0xf5a8d8, 0.35);
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + rnd() * 0.6, 1), petal);
      b.position.set((rnd() - 0.5) * 2.2, 3.2 + rnd() * 1.5, (rnd() - 0.5) * 2.2);
      g.add(b);
      light(x + b.position.x, b.position.y + 0.2, z + b.position.z, '#ffd0f0', 1.6);
    }
    g.position.set(x, 0.2, z);
    thing('ki', g, 5.6);
  }

  // つき: a large pale moon over the far end of the street.
  {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff6dc, fog: false }));
    moon.position.set(-70, 95, -260);
    scene.add(moon);
    things.push({ word: 'tsuki', object: moon, anchor: moon.position.clone().add(new THREE.Vector3(0, 22, 0)) });
  }

  // ひと and かさ: someone waiting to cross, and an open umbrella left by the shop door.
  {
    const g = new THREE.Group();
    const coat = lambert(0x39e6ff, 0.25);
    g.add(box(lambert(0x23203a), 0.17, 0.8, 0.2, 0.12, 0.4, 0), box(lambert(0x23203a), 0.17, 0.8, 0.2, -0.12, 0.4, 0));
    g.add(box(coat, 0.5, 0.75, 0.3, 0, 1.17, 0), box(coat, 0.13, 0.65, 0.16, 0.33, 1.2, 0), box(coat, 0.13, 0.65, 0.16, -0.33, 1.2, 0));
    g.add(box(lambert(0xf0c9a0), 0.34, 0.34, 0.34, 0, 1.75, 0), box(lambert(0x1a1626), 0.36, 0.14, 0.36, 0, 1.94, 0));
    g.position.set(ROAD + 1, 0.2, 9.5);
    g.rotation.y = Math.PI;
    g.scale.setScalar(1.15);
    thing('hito', g, 2.9);

    const u = new THREE.Group();
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.5, 8, 1, true), new THREE.MeshLambertMaterial({ color: 0xff4fa3, emissive: 0xff4fa3, emissiveIntensity: 0.45, side: THREE.DoubleSide }));
    canopy.position.y = 1.9;
    u.add(canopy, box(lambert(0xdddddd), 0.05, 1.9, 0.05, 0, 0.95, 0));
    u.position.set(-(ROAD + 1.4), 0.2, -9.6);
    u.rotation.z = 0.25;
    light(-(ROAD + 1.4), 2, -9.6, '#ff4fa3', 3);
    thing('kasa', u, 3);
  }

  // はな: a planter full of flowers.
  {
    const g = new THREE.Group();
    g.add(box(lambert(0x55506a), 2.4, 0.6, 0.8, 0, 0.3, 0));
    for (let i = 0; i < 9; i++) {
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), lambert(pick([0xff4fa3, 0xffe14a, 0xffffff, 0xff7a3a, 0xc58bff]), 0.7));
      f.position.set(-1 + i * 0.25, 0.8 + (i % 2) * 0.16, (rnd() - 0.5) * 0.4);
      g.add(f, box(lambert(0x4fa860), 0.04, 0.3, 0.04, f.position.x, 0.62, f.position.z));
    }
    g.position.set(ROAD + 1.6, 0.2, -14);
    g.rotation.y = Math.PI / 2;
    light(ROAD + 1.6, 1.2, -14, '#ffb0e0', 3);
    thing('hana', g, 2.1);
  }

  // とけい: a street clock on a post, showing the real time.
  let clockHands: (date: Date) => void = () => {};
  {
    const g = new THREE.Group();
    g.add(box(lambert(0x2a2740), 0.18, 3.4, 0.18, 0, 1.7, 0));
    const [cc, cg] = canvas(128, 128);
    const faceTex = texture(cc);
    clockHands = (date) => {
      cg.fillStyle = '#fff6dc';
      cg.beginPath();
      cg.arc(64, 64, 62, 0, 6.3);
      cg.fill();
      cg.fillStyle = '#23203a';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        cg.fillRect(64 + Math.sin(a) * 52 - 3, 64 - Math.cos(a) * 52 - 3, 6, 6);
      }
      cg.strokeStyle = '#23203a';
      cg.lineCap = 'round';
      const hand = (turn: number, len: number, w: number) => {
        cg.lineWidth = w;
        cg.beginPath();
        cg.moveTo(64, 64);
        cg.lineTo(64 + Math.sin(turn * Math.PI * 2) * len, 64 - Math.cos(turn * Math.PI * 2) * len);
        cg.stroke();
      };
      hand((date.getHours() % 12) / 12 + date.getMinutes() / 720, 30, 8);
      hand(date.getMinutes() / 60, 46, 5);
      faceTex.needsUpdate = true;
    };
    clockHands(new Date());
    for (const s of [1, -1]) {
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.75, 24), new THREE.MeshBasicMaterial({ map: faceTex }));
      face.position.set(0, 3.9, s * 0.13);
      if (s < 0) face.rotation.y = Math.PI;
      g.add(face);
    }
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.24, 24).rotateX(Math.PI / 2), lambert(0x2a2740)).translateY(3.9));
    g.position.set(-(ROAD + 1.2), 0.2, 26);
    light(-(ROAD + 1.2), 3.9, 26.5, '#fff6dc', 5);
    thing('tokei', g, 5.1);
  }

  scene.add(city);

  // ---- Points of light: every bulb, lantern and sign glows softly, as in a night photograph.
  const [dot, dg] = canvas(64, 64);
  const grad = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  dg.fillStyle = grad;
  dg.fillRect(0, 0, 64, 64);
  const dotTex = new THREE.CanvasTexture(dot);
  const glowGeo = new THREE.BufferGeometry();
  const n = glow.length / 7;
  const gp = new Float32Array(n * 3);
  const gcol = new Float32Array(n * 3);
  const gs = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    gp.set(glow.slice(i * 7, i * 7 + 3), i * 3);
    gcol.set(glow.slice(i * 7 + 3, i * 7 + 6), i * 3);
    gs[i] = glow[i * 7 + 6];
  }
  glowGeo.setAttribute('position', new THREE.BufferAttribute(gp, 3));
  glowGeo.setAttribute('color', new THREE.BufferAttribute(gcol, 3));
  glowGeo.setAttribute('size', new THREE.BufferAttribute(gs, 1));
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: dotTex }, uScale: { value: 600 }, uFlip: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uScale; attribute float size; attribute vec3 color; varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uScale * size * 0.5 / -mv.z;
      }`,
    fragmentShader: `
      uniform sampler2D uMap; uniform float uFlip; varying vec3 vColor;
      void main() { gl_FragColor = vec4(vColor, 1.0) * texture2D(uMap, gl_PointCoord) * uFlip; }`,
  });
  const lights = new THREE.Points(glowGeo, glowMat);
  lights.frustumCulled = false;
  city.add(lights);

  // ---- The wet street: the whole city again, upside down beneath the dark, glassy road.
  const mirror = city.clone(true);
  mirror.scale.y = -1;
  scene.add(mirror);

  // ---- The puddle home: green and bright, the colour of the wood.
  const puddleTime = { value: 0 };
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 36),
    new THREE.ShaderMaterial({
      uniforms: { uTime: puddleTime },
      vertexShader: `varying vec2 vPos; void main() { vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime; varying vec2 vPos;
        void main() {
          float r = length(vPos) / 1.9;
          float arms = sin(atan(vPos.y, vPos.x) * 3.0 + r * 5.5 - uTime * 1.1) * 0.5 + 0.5;
          vec3 wood = vec3(0.42, 0.85, 0.5);
          vec3 col = mix(wood * 0.6, mix(wood, vec3(1.0), 0.7), smoothstep(1.2, 0.0, r));
          col = mix(col, vec3(1.0), arms * 0.3);
          gl_FragColor = vec4(pow(col, vec3(2.2)), smoothstep(1.0, 0.85, r));
        }`,
      transparent: true,
    }),
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(3.2, 0.03, 45);
  puddle.renderOrder = 2;
  scene.add(puddle);

  // ---- Her tags, sprayed onto the walls one by one.
  const tags: { mesh: THREE.Mesh; age: number }[] = [];
  let nextSlot = 0;

  // ---- Fireworks.
  const SPARKS = 500;
  const fp = new Float32Array(SPARKS * 3).fill(-999);
  const fv = new Float32Array(SPARKS * 3);
  const fc = new Float32Array(SPARKS * 3);
  const fl = new Float32Array(SPARKS);
  let fnext = 0;
  const fireGeo = new THREE.BufferGeometry();
  fireGeo.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  fireGeo.setAttribute('color', new THREE.BufferAttribute(fc, 3));
  const fire = new THREE.Points(fireGeo, new THREE.PointsMaterial({ size: 1.4, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  fire.frustumCulled = false;
  scene.add(fire);

  const train = city.getObjectByName('train')!;
  const tail = city.getObjectByName('tail')!;
  let minute = -1;

  return {
    scene,
    things,
    puddle,
    tag(kana, animate) {
      if (nextSlot >= slots.length) return;
      const s = slots[nextSlot++];
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 2.1),
        new THREE.MeshBasicMaterial({ map: tagTexture(kana, NEON[nextSlot % NEON.length]), transparent: true, depthWrite: false, opacity: animate ? 0 : 1 }),
      );
      mesh.position.set(s.x, 1.9, s.z);
      mesh.rotation.y = (-s.side * Math.PI) / 2;
      scene.add(mesh);
      tags.push({ mesh, age: animate ? 0 : 9 });
    },
    firework() {
      const c = new THREE.Color(NEON[Math.floor(Math.random() * NEON.length)]);
      const x = (Math.random() - 0.5) * 50;
      const y = 28 + Math.random() * 16;
      const z = -20 - Math.random() * 40;
      for (let i = 0; i < 90; i++) {
        const k = fnext;
        fnext = (fnext + 1) % SPARKS;
        const a = Math.random() * Math.PI * 2;
        const e = Math.acos(Math.random() * 2 - 1);
        const v = 9 + Math.random() * 3;
        fp.set([x, y, z], k * 3);
        fv.set([Math.sin(e) * Math.cos(a) * v, Math.cos(e) * v, Math.sin(e) * Math.sin(a) * v], k * 3);
        fc.set([c.r, c.g, c.b], k * 3);
        fl[k] = 1.6 + Math.random() * 0.6;
      }
    },
    update(time, dt) {
      puddleTime.value = time;
      glowMat.uniforms.uScale.value = window.innerHeight;
      // The train slides in, waits at the station, and slides out again.
      const cycle = time % 40;
      train.position.x = cycle < 6 ? -70 + (cycle / 6) * 70 * (2 - cycle / 6) : cycle < 26 ? 0 : (cycle - 26) * (cycle - 26) * 0.5;
      tail.rotation.y = Math.sin(time * 1.4) * 0.5;
      const now = new Date();
      if (now.getMinutes() !== minute) {
        minute = now.getMinutes();
        clockHands(now);
      }
      for (const t of tags) {
        if (t.age > 2) continue;
        t.age += dt;
        // A new tag fades up and swells slightly, as paint builds on the wall.
        (t.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1, t.age / 1.2);
        t.mesh.scale.setScalar(0.85 + 0.15 * Math.min(1, t.age / 1.2));
      }
      for (let k = 0; k < SPARKS; k++) {
        if (fl[k] <= 0) continue;
        fl[k] -= dt;
        if (fl[k] <= 0) {
          fp[k * 3 + 1] = -999;
          continue;
        }
        fv[k * 3 + 1] -= 5 * dt;
        for (let a = 0; a < 3; a++) {
          fv[k * 3 + a] *= 1 - dt * 0.9;
          fp[k * 3 + a] += fv[k * 3 + a] * dt;
        }
      }
      fireGeo.attributes.position.needsUpdate = true;
      fireGeo.attributes.color.needsUpdate = true;
    },
  };
}
