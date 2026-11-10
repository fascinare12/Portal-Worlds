import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import asphaltUrl from './textures/asphalt.webp';
import concreteUrl from './textures/concrete.webp';
import shutterUrl from './textures/shutter.webp';
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
  /** Her tags on the walls; tapping one opens it for writing. */
  tags: { id: string; mesh: THREE.Mesh }[];
  /** Puts a word's tag on the next free stretch of wall: an outline until she has written it herself. */
  tag(id: string, kana: string, filled: boolean, animate: boolean): void;
  /** Fills a tag in with colour, once she has written the word. */
  fill(id: string): void;
  /** Sets off a firework over the street. */
  firework(): void;
  /** Turns the costly extras (reflections, rain) on or off, for slower devices. */
  setRich(on: boolean): void;
  update(time: number, dt: number, eye: THREE.Vector3): void;
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

/** Photographs of real surfaces, loaded before the city is built. */
let photo: { asphalt: HTMLImageElement; concrete: HTMLImageElement; shutter: HTMLImageElement };

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((done, fail) => {
    const img = new Image();
    img.onload = () => done(img);
    img.onerror = fail;
    img.src = url;
  });
}

/** Fills a canvas with a photographed surface, tinted. */
function surface(g: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, tint: string): void {
  g.drawImage(img, 0, 0, w, h);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = tint;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
}

/** The face of a building: stained concrete with rows of windows set into it, some lit. It tiles, so tall buildings get more floors. */
function facade(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 256);
  surface(g, photo.concrete, 256, 256, pick(['#3c3a62', '#46406e', '#33405f', '#4a3a66', '#3a3550']));
  const warm = ['#ffd27a', '#ffe9b0', '#ffbf66', '#fff3d0'];
  for (let r = 0; r < 4; r++) {
    for (let k = 0; k < 4; k++) {
      const x = k * 64 + 12;
      const y = r * 64 + 14;
      // The window sits back in the wall: a dark reveal above and to the left, a pale sill below.
      g.fillStyle = '#07061a';
      g.fillRect(x - 4, y - 5, 48, 44);
      const lit = rnd();
      if (lit < 0.46) {
        g.fillStyle = lit < 0.38 ? pick(warm) : pick(NEON);
        g.globalAlpha = 0.6 + rnd() * 0.4;
        g.fillRect(x, y, 40, 34);
        g.globalAlpha = 1;
        // Curtains, a blind, or someone's silhouette.
        const what = rnd();
        g.fillStyle = 'rgba(10, 8, 30, 0.55)';
        if (what < 0.3) g.fillRect(x, y, 40, 8 + rnd() * 16);
        else if (what < 0.5) {
          g.fillRect(x, y, 9, 34);
          g.fillRect(x + 31, y, 9, 34);
        } else if (what < 0.6) {
          g.beginPath();
          g.arc(x + 20, y + 16, 6, 0, 6.3);
          g.fill();
          g.fillRect(x + 11, y + 22, 18, 12);
        }
      } else {
        g.fillStyle = '#0d0c22';
        g.fillRect(x, y, 40, 34);
        g.fillStyle = 'rgba(120, 140, 255, 0.12)'; // a faint reflection of the sky
        g.fillRect(x, y, 40, 12);
      }
      g.fillStyle = '#17152c';
      g.fillRect(x + 19, y, 2, 34); // the bar down the middle
      g.fillStyle = '#6a6890';
      g.fillRect(x - 5, y + 36, 50, 4);
    }
  }
  // Grime: streaks running down from the sills.
  for (let i = 0; i < 22; i++) {
    g.fillStyle = `rgba(0,0,0,${0.12 + rnd() * 0.2})`;
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 3, 20 + rnd() * 70);
  }
  const t = texture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** The ground floor of a building: a rolled-down metal shutter, or a shop with its lights on. */
function groundFloor(): { map: THREE.CanvasTexture; shutter: boolean } {
  const [c, g] = canvas(512, 256);
  if (rnd() < 0.55) {
    // Shutter: real painted metal, tinted, rust-stained, with a lock box and a number.
    surface(g, photo.shutter, 512, 256, pick(['#8a889c', '#6f8a8a', '#9a7a6a', '#7a7a9a', '#a09a80']));
    for (let i = 0; i < 16; i++) {
      const x = rnd() * 512;
      const fall = g.createLinearGradient(0, 0, 0, 256);
      fall.addColorStop(0, `rgba(60, 25, 10, ${0.25 + rnd() * 0.3})`);
      fall.addColorStop(1, 'rgba(60, 25, 10, 0)');
      g.fillStyle = fall;
      g.fillRect(x, rnd() * 80, 3 + rnd() * 10, 180);
    }
    g.fillStyle = '#1c1a2c';
    g.fillRect(244, 226, 24, 22);
    g.fillRect(0, 0, 512, 12);
    return { map: texture(c), shutter: true };
  }
  // Shop: looking in through the glass at shelves, a counter and whoever is serving.
  const back = g.createLinearGradient(0, 0, 0, 256);
  const tone = pick(['#ffd27a', '#ffe9b0', '#bff3ff', '#ffc6e6']);
  back.addColorStop(0, tone);
  back.addColorStop(1, '#c97a4a');
  g.fillStyle = back;
  g.fillRect(0, 0, 512, 256);
  // Shelves receding along the back wall.
  for (let row = 0; row < 3; row++) {
    g.fillStyle = 'rgba(60, 30, 20, 0.5)';
    g.fillRect(20, 70 + row * 44, 472, 5);
    for (let x = 24; x < 488; x += 10 + rnd() * 10) {
      g.fillStyle = pick(NEON);
      g.globalAlpha = 0.75;
      const h = 14 + rnd() * 20;
      g.fillRect(x, 70 + row * 44 - h, 7 + rnd() * 6, h);
    }
    g.globalAlpha = 1;
  }
  // The counter, and a figure behind it.
  g.fillStyle = 'rgba(40, 22, 30, 0.85)';
  g.fillRect(300, 190, 180, 66);
  g.beginPath();
  g.arc(390, 150, 17, 0, 6.3);
  g.fill();
  g.fillRect(366, 166, 48, 30);
  // Hanging lamps.
  for (const x of [110, 256, 400]) {
    const lamp = g.createRadialGradient(x, 26, 2, x, 26, 60);
    lamp.addColorStop(0, 'rgba(255,255,240,0.95)');
    lamp.addColorStop(1, 'rgba(255,255,240,0)');
    g.fillStyle = lamp;
    g.fillRect(x - 60, 0, 120, 90);
  }
  // The window frame, a door, and reflections on the glass.
  g.fillStyle = '#12101f';
  g.fillRect(0, 0, 512, 12);
  g.fillRect(0, 244, 512, 12);
  for (const x of [0, 170, 250, 506]) g.fillRect(x - 3, 0, 9, 256);
  g.strokeStyle = 'rgba(255,255,255,0.22)';
  g.lineWidth = 14;
  for (const x of [40, 300]) {
    g.beginPath();
    g.moveTo(x, 256);
    g.lineTo(x + 120, 0);
    g.stroke();
  }
  return { map: texture(c), shutter: false };
}

/** A neon sign: glass tubes bent into kana on a dark backing board, written top to bottom as street signs are. */
function sign(kana: string, color: string, upright: boolean): THREE.Mesh {
  const n = kana.length;
  const [c, g] = upright ? canvas(128, 128 * n + 24) : canvas(128 * n + 24, 128);
  g.fillStyle = '#080614';
  g.fillRect(0, 0, c.width, c.height);
  // Rivets at the corners of the board, and a tube running round its edge.
  g.fillStyle = '#2c2a44';
  for (const [x, y] of [[9, 9], [c.width - 9, 9], [9, c.height - 9], [c.width - 9, c.height - 9]]) g.fillRect(x - 2, y - 2, 4, 4);
  g.lineJoin = g.lineCap = 'round';
  const tube = (drawIt: () => void) => {
    // A wide soft halo, the coloured glass, then the white-hot gas down the middle.
    g.shadowColor = color;
    g.shadowBlur = 22;
    g.strokeStyle = color;
    g.lineWidth = 9;
    drawIt();
    g.shadowBlur = 8;
    g.lineWidth = 5;
    drawIt();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 2;
    drawIt();
  };
  tube(() => g.strokeRect(16, 16, c.width - 32, c.height - 32));
  g.font = `bold 84px ${KANA_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  [...kana].forEach((ch, i) => {
    const x = upright ? 64 : 76 + i * 128;
    const y = upright ? 76 + i * 128 : 66;
    tube(() => g.strokeText(ch, x, y));
  });
  const h = upright ? 1.5 * n + 0.3 : 1.5;
  const w = upright ? 1.5 : 1.5 * n + 0.3;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture(c) }));
}

/** Kana as if sprayed on a wall: thick, soft-edged, outlined, slightly tilted. */
function tagTexture(kana: string, color: string, filled: boolean): THREE.CanvasTexture {
  const [c, g] = canvas(512, 256);
  if (!filled) {
    // Not yet written by her: a chalky dashed outline, waiting for paint.
    g.translate(256, 128);
    g.rotate(-0.07);
    g.font = `900 ${kana.length > 3 ? 100 : 150}px ${KANA_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.setLineDash([10, 9]);
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 5;
    g.strokeText(kana, 0, 0);
    return texture(c);
  }
  g.translate(256, 128);
  g.rotate(-0.07);
  g.font = `900 ${kana.length > 3 ? 100 : 150}px ${KANA_FONT}`;
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

/** Wordless graffiti: bubble shapes with outlines, arrows, stars, crowns, drips and stickers, layered over each other. */
function scribble(big = false): THREE.CanvasTexture {
  const [c, g] = canvas(256, 128);
  g.lineCap = g.lineJoin = 'round';
  // Old work underneath: faded, half scrubbed off.
  for (let i = 0; i < (big ? 5 : 1); i++) {
    g.strokeStyle = pick(['#8a88a8', '#a89088', '#88a8a0']);
    g.globalAlpha = 0.28;
    g.lineWidth = 8 + rnd() * 10;
    g.beginPath();
    g.moveTo(rnd() * 256, rnd() * 128);
    g.bezierCurveTo(rnd() * 256, rnd() * 128, rnd() * 256, rnd() * 128, rnd() * 256, rnd() * 128);
    g.stroke();
  }
  const layers = (big ? 4 : 2) + Math.floor(rnd() * 3);
  for (let i = 0; i < layers; i++) {
    const colour = pick(NEON);
    const x = 40 + rnd() * 176;
    const y = 30 + rnd() * 68;
    const kind = Math.floor(rnd() * 5);
    g.globalAlpha = 0.5 + rnd() * 0.45;
    if (kind === 0) {
      // A throw-up: a fat bubble shape with a dark outline and a highlight.
      g.fillStyle = colour;
      g.strokeStyle = '#0a0818';
      g.lineWidth = 6;
      g.beginPath();
      for (let k = 0; k < 4; k++) g.ellipse(x - 36 + k * 24, y + (k % 2) * 8, 18, 22, 0, 0, 6.3);
      g.fill();
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.8)';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x - 40, y - 8, 9, 3.4, 4.6);
      g.stroke();
    } else if (kind === 1) {
      // A quick one-line scrawl with an arrow on the end.
      g.strokeStyle = colour;
      g.lineWidth = 4 + rnd() * 5;
      g.beginPath();
      g.moveTo(x - 50, y);
      g.bezierCurveTo(x - 20, y - 40, x, y + 40, x + 44, y - 6);
      g.lineTo(x + 30, y - 14);
      g.moveTo(x + 44, y - 6);
      g.lineTo(x + 36, y + 8);
      g.stroke();
    } else if (kind === 2) {
      // A star or a crown.
      g.fillStyle = colour;
      g.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 9 : 22;
        g.lineTo(x + Math.sin((k / 10) * 6.283) * r, y - Math.cos((k / 10) * 6.283) * r);
      }
      g.fill();
    } else if (kind === 3) {
      // A sticker: a small tilted rectangle with a border.
      g.save();
      g.translate(x, y);
      g.rotate((rnd() - 0.5) * 0.6);
      g.fillStyle = '#f4f0e6';
      g.fillRect(-16, -11, 32, 22);
      g.fillStyle = colour;
      g.fillRect(-13, -8, 26, 16);
      g.restore();
    } else {
      // Drips from a heavy line.
      g.strokeStyle = colour;
      g.lineWidth = 9;
      g.beginPath();
      g.moveTo(x - 40, y - 10);
      g.lineTo(x + 40, y - 14);
      g.stroke();
      g.lineWidth = 3;
      for (let k = 0; k < 5; k++) {
        const dx = x - 34 + k * 17;
        g.beginPath();
        g.moveTo(dx, y - 10);
        g.lineTo(dx, y + 8 + rnd() * 34);
        g.stroke();
      }
    }
  }
  return texture(c);
}

const lambert = (color: number, glow = 0) =>
  new THREE.MeshLambertMaterial({ color, emissive: glow ? color : 0, emissiveIntensity: glow });

/** A block. Anything smaller than a building has its edges and corners rounded off, so nothing looks cut from cardboard. */
function box(mat: THREE.Material, w: number, h: number, d: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const small = Math.min(w, h, d);
  const geo = Math.max(w, h, d) > 6.5 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 3, Math.min(0.12, small * 0.32));
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

const ball = (mat: THREE.Material, r: number, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1): THREE.Mesh => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
};

export async function buildCity(): Promise<City> {
  const [asphalt, concrete, shutter] = await Promise.all([loadImage(asphaltUrl), loadImage(concreteUrl), loadImage(shutterUrl)]);
  photo = { asphalt, concrete, shutter };
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
  // Small parts repeated hundreds of times (balconies, air conditioners, pipes, awnings) are drawn in one go each.
  const parts: Record<string, { m: THREE.Matrix4; c: THREE.Color }[]> = { balcony: [], ac: [], pipe: [], awning: [] };
  const part = (kind: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, turn = 0, color = 0xffffff) => {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turn), new THREE.Vector3(sx, sy, sz));
    parts[kind].push({ m, c: new THREE.Color(color) });
  };
  const signs: THREE.Mesh[] = [];
  const spills: { x: number; z: number; color: string }[] = [];
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
  const faces = Array.from({ length: 7 }, () => facade());
  const floors = Array.from({ length: 9 }, () => {
    const f = groundFloor();
    return { mat: new THREE.MeshBasicMaterial({ map: f.map }), shutter: f.shutter };
  });
  const [bc, bg] = canvas(128, 128);
  surface(bg, photo.concrete, 128, 128, '#3a3852');
  const baseMap = texture(bc);
  const roofStuff = new THREE.MeshLambertMaterial({ map: baseMap });
  const signWords = WORDS.map((w) => w.kana);
  const building = (x: number, z: number, w: number, d: number, h: number, faceX: number, faceZ: number) => {
    const wide = faceX ? d : w; // how long the street face is
    const turn = faceX ? (faceX * Math.PI) / 2 : faceZ > 0 ? 0 : Math.PI;
    /** A point on the street face: `along` runs across it, `out` is how far it stands proud of the wall. */
    const onFace = (along: number, out: number): [number, number] =>
      faceX ? [x + faceX * (w / 2 + out), z + along] : [x + along, z + faceZ * (d / 2 + out)];

    // Windows stay the same size however big the building is.
    const map = pick(faces).clone();
    map.repeat.set(Math.max(1, Math.round(wide / 8)), Math.max(1, Math.round(h / 8)));
    map.needsUpdate = true;
    const wall = new THREE.MeshBasicMaterial({ map });
    city.add(box(wall, w, h, d, x, h / 2 + 3.4, z));
    // Some buildings step back partway up, so the skyline is not a row of boxes.
    let top = h + 3.4;
    if (rnd() < 0.45) {
      const extra = 4 + rnd() * 9;
      city.add(box(wall, w * 0.7, extra, d * 0.7, x - faceX * w * 0.12, top + extra / 2, z - faceZ * d * 0.12));
      top += extra;
    }
    // The ground floor: a shutter or a shop facing the street, on a concrete base.
    city.add(box(roofStuff, w, 3.4, d, x, 1.7, z));
    const floor = pick(floors);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(wide - 0.6, 3), floor.mat);
    const [fx, fz] = onFace(0, 0.03);
    front.position.set(fx, 1.7, fz);
    front.rotation.y = turn;
    city.add(front);
    if (floor.shutter && rnd() < 0.7) {
      // A big piece painted right across the shutter.
      const piece = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(wide - 1.2, 7), 2.6), new THREE.MeshBasicMaterial({ map: scribble(true), transparent: true, depthWrite: false }));
      const [px, pz] = onFace(0, 0.06);
      piece.position.set(px, 1.6, pz);
      piece.rotation.y = turn;
      city.add(piece);
    } else if (!floor.shutter) {
      // An awning over an open shop, and warm light on the pavement outside.
      const [ax, az] = onFace(0, 0.8);
      part('awning', ax, 3.25, az, faceX ? 1.7 : wide - 0.8, 0.16, faceX ? wide - 0.8 : 1.7, 0, parseInt(pick(NEON).slice(1), 16));
      const [lx, lz] = onFace(0, 2.2);
      spills.push({ x: lx, z: lz, color: '#ffd27a' });
    }
    // A ledge over the ground floor.
    city.add(box(roofStuff, w + (faceX ? 0.8 : 0), 0.3, d + (faceZ ? 0.8 : 0), x + faceX * 0.4, 3.5, z + faceZ * 0.4));
    // Balconies with washing-line rails, air conditioners and a drainpipe on the street face.
    for (let y = 6.5; y < h + 1; y += 4) {
      for (let a = -wide / 2 + 2; a < wide / 2 - 1.5; a += 4) {
        const roll = rnd();
        if (roll < 0.28) {
          const [bx, bz] = onFace(a, 0.45);
          part('balcony', bx, y, bz, faceX ? 0.9 : 2.6, 0.9, faceX ? 2.6 : 0.9);
        } else if (roll < 0.42) {
          const [bx, bz] = onFace(a, 0.3);
          part('ac', bx, y - 0.2, bz, faceX ? 0.55 : 1, 0.65, faceX ? 1 : 0.55);
        }
      }
    }
    const [dx, dz] = onFace(wide / 2 - 0.5, 0.12);
    part('pipe', dx, (h + 3.4) / 2, dz, 0.16, h + 3.4, 0.16);
    // Roof clutter: a water tank, an aerial, a hoarding, a red warning light.
    if (rnd() < 0.5) city.add(box(roofStuff, 2, 2.2, 2, x + (rnd() - 0.5) * (w * 0.4), top + 1.1, z + (rnd() - 0.5) * (d * 0.4)));
    if (rnd() < 0.5) part('pipe', x + (rnd() - 0.5) * 3, top + 2.5, z + (rnd() - 0.5) * 3, 0.08, 5, 0.08);
    if (rnd() < 0.35) {
      const big = sign(pick(signWords), pick(NEON), false);
      big.scale.setScalar(1.8);
      big.position.set(x + faceX * (w * 0.3), top + 1.6, z + faceZ * (d * 0.3));
      big.rotation.y = turn;
      city.add(big);
      signs.push(big);
    }
    if (top > 26) light(x, top + 0.4, z, '#ff3030', 2.2);
    // Most buildings carry a neon sign on the side facing the street, which lights the ground beneath it.
    if (rnd() < 0.8) {
      const upright = rnd() < 0.65;
      const colour = pick(NEON);
      const s = sign(pick(signWords), colour, upright);
      const y = 6.5 + rnd() * Math.min(8, h - 8);
      const [sx, sz] = onFace((rnd() - 0.5) * (wide - 3), 0.3);
      s.position.set(sx, y, sz);
      s.rotation.y = turn;
      city.add(s);
      signs.push(s);
      light(sx + faceX * 0.4, y, sz + faceZ * 0.4, colour, 4);
      spills.push({ x: sx + faceX * 2.6, z: sz + faceZ * 2.6, color: colour });
    }
  };
  for (const side of [-1, 1]) {
    for (let z = -46; z < 48; ) {
      const w = 7 + rnd() * 6;
      const mid = z + w / 2;
      if (Math.abs(mid) > 9 + w / 2) building(side * (KERB + 5), mid, 10, w - 0.4, 8 + rnd() * 24, -side, 0);
      // Now and then, a narrow alley between two buildings, lit by one dim lamp.
      z += w;
      if (rnd() < 0.3 && Math.abs(z) > 14) {
        light(side * (KERB + 4), 2.6, z + 0.8, '#ff9f5a', 2.5);
        z += 1.6;
      }
    }
    for (const far of [-1, 1]) {
      for (let x = KERB + 10; x < 60; ) {
        const w = 7 + rnd() * 6;
        building(side * (x + w / 2), far * (KERB + 3), w - 0.4, 10, 8 + rnd() * 22, 0, -far);
        x += w;
      }
    }
  }

  // ---- The far city: dim towers in the haze all round, each with a red light on top.
  {
    const dim = pick(faces).clone();
    dim.repeat.set(3, 8);
    dim.needsUpdate = true;
    const far = new THREE.MeshBasicMaterial({ map: dim, color: 0x8888aa });
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + rnd() * 0.1;
      const r = 95 + rnd() * 70;
      const h = 40 + rnd() * 70;
      const wdt = 14 + rnd() * 14;
      const tower = box(far, wdt, h, wdt, Math.cos(a) * r, h / 2, Math.sin(a) * r);
      scene.add(tower);
      light(Math.cos(a) * r, h + 1, Math.sin(a) * r, '#ff3030', 5);
    }
  }

  // ---- Power poles along the kerb, strung with sagging wires: the skyline of any Japanese back street.
  {
    const dark = lambert(0x1a1828);
    const wire = new THREE.LineBasicMaterial({ color: 0x0c0a18 });
    for (const side of [-1, 1]) {
      const x = side * (KERB - 0.5);
      const tops: THREE.Vector3[] = [];
      for (let z = -44; z <= 44; z += 11) {
        if (Math.abs(z) < 9) continue;
        city.add(box(dark, 0.26, 9.5, 0.26, x, 4.75, z), box(dark, 2.2, 0.14, 0.14, x, 9, z), box(dark, 1.6, 0.14, 0.14, x, 8.2, z));
        if (rnd() < 0.6) city.add(box(lambert(0x5a5870), 0.5, 0.8, 0.5, x - side * 0.4, 7.3, z)); // transformer
        tops.push(new THREE.Vector3(x, 9, z));
      }
      for (let i = 0; i + 1 < tops.length; i++) {
        for (const off of [-1, 0, 1]) {
          const pts: THREE.Vector3[] = [];
          for (let k = 0; k <= 8; k++) {
            const t = k / 8;
            pts.push(new THREE.Vector3(tops[i].x + off, tops[i].y - Math.sin(t * Math.PI) * (0.5 + Math.abs(off) * 0.3) - (off ? 0 : 0.8), tops[i].z + (tops[i + 1].z - tops[i].z) * t));
          }
          city.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire));
        }
      }
    }
    // Street clutter: cones, crates and bin bags by the kerb.
    for (let i = 0; i < 26; i++) {
      const side = rnd() < 0.5 ? -1 : 1;
      const z = (rnd() * 2 - 1) * 44;
      if (Math.abs(z) < 10) continue;
      const x = side * (KERB - 0.9 - rnd() * 0.8);
      const kind = rnd();
      if (kind < 0.35) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 16), lambert(0xff7a3a, 0.4));
        cone.position.set(x, 0.5, z);
        city.add(cone);
      } else if (kind < 0.7) {
        city.add(box(lambert(pick([0x39a0c0, 0xc0a039, 0x8a4a6a])), 0.7, 0.45, 0.5, x, 0.43, z));
      } else {
        const bag = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), lambert(0x15131f));
        bag.position.set(x, 0.5, z);
        bag.scale.y = 0.8;
        city.add(bag);
      }
    }
  }

  // ---- The ground: real asphalt, worn paint, manhole covers and cracks, and raised concrete pavements.
  const [gc, gg] = canvas(2048, 2048);
  gg.fillStyle = gg.createPattern(photo.asphalt, 'repeat')!;
  gg.save();
  gg.scale(0.5, 0.5);
  gg.fillRect(0, 0, 4096, 4096);
  gg.restore();
  gg.globalCompositeOperation = 'multiply';
  gg.fillStyle = '#4a4870';
  gg.fillRect(0, 0, 2048, 2048);
  gg.globalCompositeOperation = 'source-over';
  // One canvas pixel is 1/16 of a unit; the crossing sits in the middle.
  const px = (u: number) => 1024 + u * 16;
  const worn = (x: number, y: number, w: number, h: number, colour: string) => {
    gg.fillStyle = colour;
    gg.fillRect(x, y, w, h);
    // Paint scuffed away in places, so the asphalt shows through.
    gg.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < (w * h) / 220; i++) {
      gg.globalAlpha = 0.5 + rnd() * 0.5;
      gg.fillRect(x + rnd() * w, y + rnd() * h, 2 + rnd() * 7, 1 + rnd() * 3);
    }
    gg.globalAlpha = 1;
    gg.globalCompositeOperation = 'source-over';
  };
  const [roadCopy, rg] = canvas(2048, 2048);
  rg.drawImage(gc, 0, 0);
  for (let i = -6; i <= 6; i++) {
    worn(px(i) - 6, px(-12), 12, 64, 'rgba(235, 235, 255, 0.9)');
    worn(px(i) - 6, px(8), 12, 64, 'rgba(235, 235, 255, 0.9)');
    worn(px(-12), px(i) - 6, 64, 12, 'rgba(235, 235, 255, 0.9)');
    worn(px(8), px(i) - 6, 64, 12, 'rgba(235, 235, 255, 0.9)');
  }
  for (let v = -60; v < 60; v += 5) {
    if (Math.abs(v + 1.5) < 13) continue;
    worn(px(0) - 2, px(v), 4, 48, 'rgba(255, 225, 74, 0.8)');
    worn(px(v), px(0) - 2, 48, 4, 'rgba(255, 225, 74, 0.8)');
  }
  // The scuffing cut holes right through; lay the plain road back underneath them.
  gg.globalCompositeOperation = 'destination-over';
  gg.drawImage(roadCopy, 0, 0);
  gg.globalCompositeOperation = 'source-over';
  // Manhole covers and cracks.
  for (let i = 0; i < 14; i++) {
    const mx = px((rnd() - 0.5) * 10);
    const my = px((rnd() * 2 - 1) * 44);
    gg.fillStyle = '#23223a';
    gg.beginPath();
    gg.arc(mx, my, 13, 0, 6.3);
    gg.fill();
    gg.strokeStyle = '#5a5878';
    gg.lineWidth = 2;
    for (const r of [12, 8, 4]) {
      gg.beginPath();
      gg.arc(mx, my, r, 0, 6.3);
      gg.stroke();
    }
  }
  gg.strokeStyle = 'rgba(0,0,0,0.6)';
  gg.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    let cx = px((rnd() - 0.5) * 14);
    let cy = px((rnd() * 2 - 1) * 46);
    gg.beginPath();
    gg.moveTo(cx, cy);
    for (let k = 0; k < 6; k++) gg.lineTo((cx += (rnd() - 0.5) * 30), (cy += (rnd() - 0.5) * 30));
    gg.stroke();
  }
  // Where the road is wet it mirrors sharply (puddles); elsewhere it is rough and the reflection is dim.
  const [ac, ag] = canvas(256, 256);
  ag.fillStyle = 'rgb(232,232,232)';
  ag.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 46; i++) {
    const x = 128 + (rnd() - 0.5) * 30 + (rnd() < 0.3 ? (rnd() - 0.5) * 200 : 0);
    const y = rnd() * 256;
    const r = 5 + rnd() * 13;
    const pool = ag.createRadialGradient(x, y, r * 0.3, x, y, r);
    pool.addColorStop(0, 'rgba(120,120,120,1)');
    pool.addColorStop(1, 'rgba(120,120,120,0)');
    ag.fillStyle = pool;
    ag.save();
    ag.translate(x, y);
    ag.scale(1, 0.6 + rnd() * 1.2);
    ag.translate(-x, -y);
    ag.fillRect(x - r, y - r, r * 2, r * 2);
    ag.restore();
  }
  const roadTex = texture(gc);
  roadTex.anisotropy = 4;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(128, 128),
    new THREE.MeshBasicMaterial({ map: roadTex, alphaMap: new THREE.CanvasTexture(ac), transparent: true }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.renderOrder = 1;
  scene.add(ground);

  // Rain on the road: rings spreading where drops land.
  const rippleTime = { value: 0 };
  const ripples = new THREE.Mesh(
    new THREE.PlaneGeometry(128, 128),
    new THREE.ShaderMaterial({
      uniforms: { uTime: rippleTime },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime; varying vec2 vP;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          float a = 0.0;
          for (int layer = 0; layer < 2; layer++) {
            vec2 p = vP * (layer == 0 ? 0.9 : 1.7) + float(layer) * 7.3;
            vec2 cell = floor(p);
            float start = hash(cell);
            float t = fract(uTime * 0.8 + start);
            vec2 c = cell + 0.25 + 0.5 * vec2(hash(cell + 3.1), hash(cell + 9.7));
            float d = length(p - c);
            a += smoothstep(0.03, 0.0, abs(d - t * 0.42)) * (1.0 - t);
          }
          gl_FragColor = vec4(vec3(0.75, 0.8, 1.0) * a * 0.5, 1.0);
        }`,
    }),
  );
  ripples.rotation.x = -Math.PI / 2;
  ripples.position.y = 0.015;
  ripples.renderOrder = 3;
  scene.add(ripples);

  const [pc, pg] = canvas(256, 256);
  surface(pg, photo.concrete, 256, 256, '#6a6788');
  pg.strokeStyle = 'rgba(0,0,0,0.5)';
  pg.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    pg.strokeRect(i * 64, 0, 64, 256);
    pg.strokeRect(0, i * 64, 256, 64);
  }
  const paveMap = texture(pc);
  paveMap.wrapS = paveMap.wrapT = THREE.RepeatWrapping;
  paveMap.repeat.set(2, 12);
  const pavement = new THREE.MeshLambertMaterial({ map: paveMap });
  const paveMapAcross = paveMap.clone();
  paveMapAcross.repeat.set(12, 2);
  paveMapAcross.needsUpdate = true;
  const pavementAcross = new THREE.MeshLambertMaterial({ map: paveMapAcross });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      city.add(box(pavement, KERB - ROAD, 0.2, 60, sx * (ROAD + KERB) * 0.5, 0.1, sz * (ROAD + 30)));
      city.add(box(pavementAcross, 60, 0.2, KERB - ROAD, sx * (KERB + 30), 0.1, sz * (ROAD + KERB) * 0.5));
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
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14), lantern);
        l.scale.y = 1.2;
        l.position.set(x, y - 0.5, z);
        city.add(l);
        light(x, y - 0.5, z, '#ff6a3a', 3.2);
      } else {
        light(x, y, z, '#ffe0a0', 1.2);
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

  // ---- Graffiti: wordless pieces to begin with; her own tags are added as she learns.
  const slots: { x: number; z: number; side: number }[] = [];
  for (let k = 0; k < 15; k++) {
    for (const side of [-1, 1]) {
      const z = 43 - k * 6 - (side > 0 ? 3 : 0);
      if (Math.abs(z) < 11) continue;
      slots.push({ x: side * (KERB - 0.1), z, side });
    }
  }
  for (let i = 0; i < 70; i++) {
    const side = rnd() < 0.5 ? -1 : 1;
    const z = (rnd() * 2 - 1) * 46;
    if (Math.abs(z) < 10) continue;
    const size = 0.7 + rnd() * 0.8;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(3.4 * size, 1.7 * size), new THREE.MeshBasicMaterial({ map: scribble(), transparent: true, depthWrite: false }));
    s.position.set(side * (KERB - 0.06 - rnd() * 0.02), 0.6 + rnd() * 2.4, z);
    s.rotation.y = (-side * Math.PI) / 2;
    s.rotation.z = (rnd() - 0.5) * 0.2;
    city.add(s);
  }

  // ---- The things that carry a word.

  // ねこ: a ginger cat sitting on top of a glowing vending machine.
  {
    const g = new THREE.Group();
    const machine = box(lambert(0x39e6ff, 0.7), 1.3, 2.2, 0.9, 0, 1.3, 0);
    const front = box(new THREE.MeshBasicMaterial({ color: 0xffffff }), 1.1, 0.9, 0.05, 0, 1.7, 0.46);
    // Rows of drinks behind the glass, and the slot at the bottom.
    for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) g.add(box(lambert(pick([0xff4fa3, 0xffe14a, 0x8cff6a, 0xff7a3a]), 0.8), 0.14, 0.3, 0.06, -0.4 + k * 0.2, 1.5 + r * 0.4, 0.47));
    g.add(box(lambert(0x15131f), 0.9, 0.25, 0.06, 0, 0.6, 0.46));
    const fur = lambert(0xf2a65a, 0.15);
    const cream = lambert(0xfff0d8, 0.2);
    const cat = new THREE.Group();
    cat.add(ball(fur, 0.3, 0, 0.3, 0, 0.9, 1, 1.1), ball(cream, 0.2, 0, 0.26, 0.16, 0.8, 0.9, 0.7)); // body and bib
    cat.add(ball(fur, 0.22, 0, 0.68, 0.14)); // head
    for (const sx of [1, -1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 12), fur);
      ear.position.set(sx * 0.13, 0.9, 0.12);
      cat.add(ear, box(lambert(0x8cff6a, 1.2), 0.07, 0.05, 0.02, sx * 0.09, 0.72, 0.345)); // ears and green eyes
      cat.add(box(lambert(0xffffff, 0.6), 0.22, 0.008, 0.008, sx * 0.2, 0.64, 0.33)); // whiskers
    }
    cat.add(box(lambert(0xff8fa8, 0.5), 0.04, 0.03, 0.02, 0, 0.66, 0.36)); // nose
    const tail = new THREE.Group();
    tail.name = 'tail';
    tail.position.set(0.1, 0.12, -0.25);
    tail.add(box(fur, 0.08, 0.08, 0.55, 0, 0, -0.27));
    cat.add(tail);
    cat.position.y = 2.4;
    cat.scale.setScalar(1.5);
    g.add(machine, front, cat);
    g.position.set(ROAD + 1.6, 0.2, 30);
    g.rotation.y = -Math.PI / 2;
    light(ROAD + 1, 1.8, 30, '#39e6ff', 6);
    spills.push({ x: ROAD - 0.6, z: 30, color: '#39e6ff' });
    thing('neko', g, 4.4);
  }

  // いぬ: a bronze dog sitting on a plinth, the kind people arrange to meet beside.
  {
    const g = new THREE.Group();
    const bronze = lambert(0xa8794a, 0.2);
    g.add(box(new THREE.MeshLambertMaterial({ map: baseMap, color: 0xaaaacc }), 1.6, 1, 1.6, 0, 0.5, 0));
    g.add(ball(bronze, 0.42, 0, 1.45, -0.1, 0.9, 1, 1.1), ball(bronze, 0.3, 0, 1.75, 0.2, 0.9, 1.1, 0.9)); // haunches and chest
    g.add(ball(bronze, 0.27, 0, 2.2, 0.32), ball(bronze, 0.14, 0, 2.14, 0.56, 1, 0.8, 1.2)); // head and muzzle
    for (const sx of [1, -1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 12), bronze);
      ear.position.set(sx * 0.16, 2.46, 0.26);
      g.add(ear, box(lambert(0x23160c), 0.05, 0.05, 0.02, sx * 0.1, 2.26, 0.565), box(bronze, 0.13, 0.7, 0.13, sx * 0.17, 1.35, 0.42));
    }
    g.add(box(lambert(0x23160c), 0.07, 0.05, 0.03, 0, 2.17, 0.72));
    const curl = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 12, Math.PI * 1.5), bronze);
    curl.position.set(0, 1.5, -0.55);
    curl.rotation.y = Math.PI / 2;
    g.add(curl);
    g.position.set(ROAD + 1.8, 0.2, -32);
    g.rotation.y = -Math.PI / 2;
    light(ROAD + 1.8, 3.4, -32, '#ffe0a0', 5);
    thing('inu', g, 3.5);
  }

  // くるま: a taxi waiting at the kerb. Other cars cross at the junction.
  const car = (colour: number, taxi: boolean): THREE.Group => {
    const g = new THREE.Group();
    const paint = lambert(colour, 0.2);
    g.add(box(paint, 1.9, 0.6, 4.2, 0, 0.62, 0), box(paint, 1.7, 0.3, 2.4, 0, 1.05, -0.2));
    const cabin = box(lambert(0x9fdcff, 0.45), 1.66, 0.5, 2.1, 0, 1.4, -0.2);
    g.add(cabin, box(paint, 1.7, 0.08, 2.0, 0, 1.68, -0.2));
    if (taxi) g.add(box(lambert(0xff4fa3, 1.2), 0.5, 0.2, 0.3, 0, 1.84, -0.2));
    for (const [x, z] of [[0.95, 1.3], [-0.95, 1.3], [0.95, -1.3], [-0.95, -1.3]]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.26, 14).rotateZ(Math.PI / 2), lambert(0x15131f));
      wheel.position.set(x, 0.34, z);
      g.add(wheel, box(lambert(0x8a8aa0), 0.28, 0.2, 0.2, x, 0.34, z));
    }
    for (const sx of [0.6, -0.6]) {
      g.add(box(lambert(0xffffe0, 1.4), 0.4, 0.18, 0.05, sx, 0.7, 2.12), box(lambert(0xff3030, 1.2), 0.4, 0.14, 0.05, sx, 0.7, -2.12));
    }
    g.add(box(lambert(0x15131f), 1.5, 0.12, 0.06, 0, 0.45, 2.13)); // bumper
    return g;
  };
  {
    const g = car(0xffc93a, true);
    g.position.set(-(ROAD - 1.4), 0, 20);
    light(-(ROAD - 2), 0.7, 22.4, '#ffffd0', 4);
    light(-(ROAD - 0.8), 0.7, 22.4, '#ffffd0', 4);
    spills.push({ x: -(ROAD - 1.4), z: 25, color: '#ffffd0' });
    thing('kuruma', g, 2.8);
  }

  const person = (coatColour: number, umbrella: boolean): { group: THREE.Group; legs: THREE.Mesh[] } => {
    const g = new THREE.Group();
    const coat = lambert(coatColour, 0.2);
    const dark = lambert(0x23203a);
    const capsule = (mat: THREE.Material, r: number, len: number, x: number, y: number) => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat);
      m.position.set(x, y, 0);
      return m;
    };
    // Legs swing from the hip, so each hangs from a pivot at its top.
    const legs = [0.12, -0.12].map((x) => {
      const hip = new THREE.Mesh(new THREE.BufferGeometry(), dark);
      hip.position.set(x, 0.85, 0);
      hip.add(capsule(dark, 0.09, 0.62, 0, -0.42));
      return hip;
    });
    const torso = capsule(coat, 0.25, 0.42, 0, 1.2);
    torso.scale.z = 0.7;
    g.add(...legs, torso, capsule(coat, 0.075, 0.5, 0.33, 1.2), capsule(coat, 0.075, 0.5, -0.33, 1.2));
    g.add(ball(lambert(0xf0c9a0, 0.15), 0.19, 0, 1.8, 0), ball(lambert(0x1a1626), 0.2, 0, 1.86, -0.03, 1, 0.8, 1)); // head and hair
    g.add(box(dark, 0.05, 0.04, 0.02, 0.07, 1.81, 0.18), box(dark, 0.05, 0.04, 0.02, -0.07, 1.81, 0.18)); // eyes
    if (umbrella) {
      const colour = pick([0xff4fa3, 0x39e6ff, 0xffe14a, 0xffffff, 0xc58bff]);
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.36, 20, 1, true), new THREE.MeshLambertMaterial({ color: colour, emissive: colour, emissiveIntensity: 0.35, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
      canopy.position.set(0.2, 2.45, 0);
      g.add(canopy, box(lambert(0xdddddd), 0.04, 1.3, 0.04, 0.3, 1.8, 0.1));
    }
    return { group: g, legs };
  };

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
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, 3, 14), lambert(0x5a3040));
    trunk.position.y = 1.5;
    g.add(trunk);
    const petal = lambert(0xf5a8d8, 0.35);
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.9 + rnd() * 0.6, 16, 12), petal);
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
    const g = person(0x39e6ff, false).group;
    g.position.set(ROAD + 1, 0.2, 9.5);
    g.rotation.y = Math.PI;
    g.scale.setScalar(1.15);
    thing('hito', g, 2.9);

    const u = new THREE.Group();
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.5, 20, 1, true), new THREE.MeshLambertMaterial({ color: 0xff4fa3, emissive: 0xff4fa3, emissiveIntensity: 0.45, side: THREE.DoubleSide }));
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
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), lambert(pick([0xff4fa3, 0xffe14a, 0xffffff, 0xff7a3a, 0xc58bff]), 0.7));
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

  // ほし: one star far brighter than the rest.
  {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(5, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
    star.position.set(120, 150, -240);
    star.scale.set(1, 2.2, 1);
    scene.add(star);
    things.push({ word: 'hoshi', object: star, anchor: star.position.clone().add(new THREE.Vector3(0, 18, 0)) });
  }

  // The food stall, along the crossing street to the right: things here are asked for, not looked for.
  {
    const stall = new THREE.Group();
    stall.add(box(lambert(0x8a4a2a), 7, 1, 1.4, 0, 0.7, 0)); // counter
    stall.add(box(lambert(0xff4fa3, 0.5), 7.6, 0.25, 2.6, 0, 3.5, 0.2)); // awning
    stall.add(box(lambert(0x2a2740), 0.14, 3.4, 0.14, -3.4, 1.7, 1), box(lambert(0x2a2740), 0.14, 3.4, 0.14, 3.4, 1.7, 1));
    stall.position.set(24, 0.2, -(ROAD + 1.6));
    city.add(stall);
    for (let i = 0; i < 5; i++) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff5a3a }));
      l.position.set(21 + i * 1.5, 3.4, -(ROAD + 0.2));
      city.add(l);
      light(l.position.x, 3.4, l.position.z, '#ff6a3a', 3);
    }
    light(24, 2.4, -(ROAD + 1), '#ffe0a0', 9);
    const onCounter = (word: string, x: number, parts: THREE.Object3D[]) => {
      const g = new THREE.Group();
      g.add(...parts);
      g.position.set(24 + x, 1.95, -(ROAD + 1.3));
      g.scale.setScalar(1.35);
      thing(word, g, 1.5);
    };
    const ball = (color: number, r: number, glowing = 0.3) => new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), lambert(color, glowing));
    // りんご: a red apple with a stalk and a leaf.
    onCounter('ringo', -2.7, [ball(0xe0383a, 0.38), box(lambert(0x5a3a22), 0.05, 0.2, 0.05, 0, 0.42, 0), box(lambert(0x4fa860), 0.2, 0.04, 0.1, 0.1, 0.48, 0)]);
    // おにぎり: a triangle of rice wrapped in a strip of seaweed.
    {
      const rice = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 3).rotateX(Math.PI / 2).rotateZ(Math.PI), lambert(0xffffff, 0.35));
      rice.position.y = 0.1;
      onCounter('onigiri', -1.6, [rice, box(lambert(0x16241c), 0.3, 0.3, 0.33, 0, -0.08, 0)]);
    }
    // すし: rice with a slice of fish on top, on a small board.
    onCounter('sushi', -0.5, [box(lambert(0x3a2a22), 0.9, 0.08, 0.5, 0, -0.3, 0), box(lambert(0xffffff, 0.3), 0.6, 0.22, 0.3, 0, -0.14, 0), box(lambert(0xff7a5a, 0.4), 0.7, 0.1, 0.34, 0, 0.02, 0)]);
    // おちゃ: a cup of green tea.
    {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.42, 12), lambert(0xf4f0e6, 0.2));
      const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 12), lambert(0x8fbf4a, 0.6));
      tea.position.y = 0.2;
      onCounter('ocha', 0.6, [cup, tea]);
    }
    // みず: a bottle of water.
    {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.7, 10), new THREE.MeshLambertMaterial({ color: 0x9fe0ff, emissive: 0x39a0d0, emissiveIntensity: 0.5, transparent: true, opacity: 0.85 }));
      bottle.position.y = 0.1;
      onCounter('mizu', 1.6, [bottle, box(lambert(0x2f7fd0), 0.14, 0.12, 0.14, 0, 0.5, 0), box(lambert(0xffffff), 0.36, 0.2, 0.36, 0, 0.12, 0)]);
    }
    // さかな: a silver fish laid on ice.
    {
      const body = ball(0xa8c4d8, 0.3, 0.25);
      body.scale.set(1.9, 0.75, 0.5);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.34, 3).rotateZ(-Math.PI / 2), lambert(0xa8c4d8, 0.25));
      tail.position.x = -0.68;
      tail.scale.z = 0.4;
      onCounter('sakana', 2.7, [box(lambert(0xdff4ff, 0.4), 1.3, 0.1, 0.6, 0, -0.28, 0), body, tail, box(lambert(0x15131f), 0.06, 0.06, 0.32, 0.36, 0.05, 0)]);
    }
  }

  // The café terrace, along the crossing street to the left.
  {
    const cx = -24;
    const cz = ROAD + 1.8;
    const wood = lambert(0xb07a48);
    const chairAt = (x: number, z: number, turn: number) => {
      const g = new THREE.Group();
      g.add(box(wood, 0.6, 0.08, 0.6, 0, 0.55, 0), box(wood, 0.6, 0.7, 0.08, 0, 0.95, -0.26));
      for (const [lx, lz] of [[0.25, 0.25], [-0.25, 0.25], [0.25, -0.25], [-0.25, -0.25]]) g.add(box(wood, 0.07, 0.55, 0.07, lx, 0.27, lz));
      g.position.set(x, 0.2, z);
      g.rotation.y = turn;
      g.scale.setScalar(1.3);
      return g;
    };
    // A round table with a lamp on it.
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 16), lambert(0xf4f0e6, 0.2));
    table.position.set(cx, 1.2, cz);
    city.add(table, box(lambert(0x2a2740), 0.12, 1, 0.12, cx, 0.7, cz));
    light(cx, 2, cz, '#ffe0a0', 7);
    // いす: an empty chair.
    thing('isu', chairAt(cx - 1.5, cz, Math.PI / 2), 2.2);
    // かばん: a bag left on the other chair.
    city.add(chairAt(cx + 1.5, cz, -Math.PI / 2));
    {
      const g = new THREE.Group();
      g.add(box(lambert(0xc58bff, 0.35), 0.6, 0.5, 0.3, 0, 0, 0), box(lambert(0x8a5ad0), 0.62, 0.16, 0.32, 0, 0.2, 0));
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 12, Math.PI), lambert(0x8a5ad0));
      strap.position.y = 0.26;
      g.add(strap);
      g.position.set(cx + 1.5, 1.25, cz);
      thing('kaban', g, 1.3);
    }
    // ほん: an open book on the table.
    {
      const g = new THREE.Group();
      const left = box(lambert(0xfff6dc, 0.4), 0.42, 0.04, 0.56, -0.21, 0, 0);
      const right = box(lambert(0xfff6dc, 0.4), 0.42, 0.04, 0.56, 0.21, 0, 0);
      left.rotation.z = 0.14;
      right.rotation.z = -0.14;
      g.add(left, right, box(lambert(0xe0383a, 0.3), 0.9, 0.03, 0.6, 0, -0.04, 0));
      g.position.set(cx, 1.32, cz);
      thing('hon', g, 1.3);
    }
    // じてんしゃ: a bicycle leaning by the terrace.
    {
      const g = new THREE.Group();
      const frame = lambert(0x39e6ff, 0.5);
      const tyre = lambert(0x15131f);
      for (const x of [-0.75, 0.75]) {
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 10, 36), tyre);
        wheel.position.set(x, 0.55, 0);
        g.add(wheel);
      }
      const bar = (x1: number, y1: number, x2: number, y2: number) => {
        const len = Math.hypot(x2 - x1, y2 - y1);
        const b = box(frame, len, 0.07, 0.07, (x1 + x2) / 2, (y1 + y2) / 2, 0);
        b.rotation.z = Math.atan2(y2 - y1, x2 - x1);
        g.add(b);
      };
      bar(-0.75, 0.55, -0.15, 1.1);
      bar(-0.15, 1.1, 0.5, 1.15);
      bar(0.5, 1.15, 0.75, 0.55);
      bar(-0.15, 1.1, 0.05, 0.5);
      bar(0.05, 0.5, 0.5, 1.15);
      bar(0.05, 0.5, -0.75, 0.55);
      g.add(box(tyre, 0.34, 0.08, 0.16, -0.2, 1.2, 0), box(tyre, 0.08, 0.08, 0.6, 0.55, 1.4, 0), box(frame, 0.07, 0.3, 0.07, 0.53, 1.28, 0));
      g.position.set(cx - 5, 0.2, cz + 0.6);
      g.rotation.set(0.12, 0.3, 0);
      g.scale.setScalar(1.25);
      thing('jitensha', g, 2.5);
    }
    // とり: a pigeon pecking about on the pavement.
    {
      const g = new THREE.Group();
      const grey = lambert(0x9aa0b4, 0.25);
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), grey);
      body.scale.set(0.8, 0.8, 1.3);
      body.position.y = 0.36;
      g.add(body, box(grey, 0.2, 0.22, 0.2, 0, 0.66, 0.3), box(lambert(0xffa53a, 0.6), 0.06, 0.05, 0.14, 0, 0.64, 0.46));
      g.add(box(lambert(0xff7a5a), 0.04, 0.2, 0.04, 0.08, 0.1, 0), box(lambert(0xff7a5a), 0.04, 0.2, 0.04, -0.08, 0.1, 0), box(grey, 0.24, 0.05, 0.3, 0, 0.4, -0.45));
      g.position.set(cx + 4.5, 0.2, cz - 0.4);
      g.rotation.y = -0.8;
      g.scale.setScalar(1.5);
      g.name = 'bird';
      thing('tori', g, 1.8);
    }
  }

  // A plain round dot, so petals are not little squares.
  const [rc, rgx] = canvas(32, 32);
  rgx.fillStyle = '#ffffff';
  rgx.beginPath();
  rgx.ellipse(16, 16, 14, 9, 0.6, 0, 6.3);
  rgx.fill();
  const roundDot = new THREE.CanvasTexture(rc);

  // Petals drifting down past the lights.
  const PETALS = 260;
  const petalPos = new Float32Array(PETALS * 3);
  for (let i = 0; i < PETALS; i++) petalPos.set([(rnd() * 2 - 1) * 30, rnd() * 16, (rnd() * 2 - 1) * 50], i * 3);
  const petalGeo = new THREE.BufferGeometry();
  petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
  const petals = new THREE.Points(petalGeo, new THREE.PointsMaterial({ color: 0xffc8ec, size: 0.22, transparent: true, opacity: 0.85, map: roundDot, alphaTest: 0.3 }));
  petals.frustumCulled = false;
  scene.add(petals);

  // The small repeated parts of the buildings, each kind drawn in one go.
  {
    const mats: Record<string, THREE.Material> = {
      balcony: new THREE.MeshLambertMaterial({ map: baseMap, color: 0x9a98b8 }),
      ac: lambert(0xb8b8c8),
      pipe: lambert(0x3a3850),
      awning: new THREE.MeshLambertMaterial({ emissive: 0xffffff, emissiveIntensity: 0.12 }),
    };
    const unit = new THREE.BoxGeometry(1, 1, 1);
    for (const kind of Object.keys(parts)) {
      const mesh = new THREE.InstancedMesh(unit, mats[kind], parts[kind].length);
      parts[kind].forEach((p, i) => {
        mesh.setMatrixAt(i, p.m);
        mesh.setColorAt(i, p.c);
      });
      city.add(mesh);
    }
  }

  scene.add(city);

  // Neon and shop light spilling onto the ground.
  {
    const [sc, sg] = canvas(64, 64);
    const fall = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    fall.addColorStop(0, 'rgba(255,255,255,0.55)');
    fall.addColorStop(1, 'rgba(255,255,255,0)');
    sg.fillStyle = fall;
    sg.fillRect(0, 0, 64, 64);
    const spill = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      spills.length,
    );
    const m = new THREE.Matrix4();
    spills.forEach((sp, i) => {
      const onRoadway = Math.abs(sp.x) < ROAD || Math.abs(sp.z) < ROAD;
      m.makeScale(9, 1, 9).setPosition(sp.x, onRoadway ? 0.03 : 0.23, sp.z);
      spill.setMatrixAt(i, m);
      spill.setColorAt(i, new THREE.Color(sp.color).multiplyScalar(0.5));
    });
    spill.renderOrder = 4;
    scene.add(spill);
  }

  // People walking the pavements, some under umbrellas, and cars passing at the junction.
  // They carry the same words as the ones standing still, so tapping any of them teaches.
  const walkers: { group: THREE.Group; legs: THREE.Mesh[]; dir: number; speed: number; thing: Thing }[] = [];
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1;
    const p = person(pick([0xff4fa3, 0xffe14a, 0x8cff6a, 0xc58bff, 0xff7a3a, 0xe8e8f0]), rnd() < 0.6);
    p.group.position.set(side * (ROAD + 2.4 + rnd() * 0.9), 0.2, (rnd() * 2 - 1) * 44);
    const dir = rnd() < 0.5 ? 1 : -1;
    p.group.rotation.y = dir > 0 ? 0 : Math.PI;
    scene.add(p.group);
    const t: Thing = { word: 'hito', object: p.group, anchor: new THREE.Vector3() };
    things.push(t);
    walkers.push({ ...p, dir, speed: 1 + rnd() * 0.8, thing: t });
  }
  const traffic: { group: THREE.Group; dir: number; thing: Thing }[] = [];
  for (const [colour, lane, dir] of [[0xe8e8f0, 3.4, 1], [0x39a0d0, -3.4, -1]] as const) {
    const g = car(colour, false);
    g.position.set(-dir * 70, 0, lane);
    g.rotation.y = (dir * Math.PI) / 2;
    scene.add(g);
    const t: Thing = { word: 'kuruma', object: g, anchor: new THREE.Vector3() };
    things.push(t);
    traffic.push({ group: g, dir, thing: t });
  }

  // Steam rising from the tea, the stall, and gratings in the road.
  const vents = [[24.8, 2.4, -(ROAD + 1.3)], [23, 2.2, -(ROAD + 1.6)], [-3, 0.1, 33], [2.5, 0.1, -24], [-2, 0.1, -40]];
  const PUFFS = 70;
  const puffPos = new Float32Array(PUFFS * 3);
  const puffGeo = new THREE.BufferGeometry();
  puffGeo.setAttribute('position', new THREE.BufferAttribute(puffPos, 3));
  const [vc, vg] = canvas(64, 64);
  const soft = vg.createRadialGradient(32, 32, 0, 32, 32, 32);
  soft.addColorStop(0, 'rgba(255,255,255,0.5)');
  soft.addColorStop(1, 'rgba(255,255,255,0)');
  vg.fillStyle = soft;
  vg.fillRect(0, 0, 64, 64);
  const steam = new THREE.Points(puffGeo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(vc), size: 1.5, transparent: true, opacity: 0.22, depthWrite: false, color: 0xdcd8ff }));
  steam.frustumCulled = false;
  scene.add(steam);

  // Light rain: thin streaks falling around whoever is walking.
  const DROPS = 600;
  const rainPos = new Float32Array(DROPS * 6);
  const rainAt = new Float32Array(DROPS * 3);
  for (let i = 0; i < DROPS; i++) rainAt.set([(rnd() * 2 - 1) * 26, rnd() * 22, (rnd() * 2 - 1) * 26], i * 3);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xa8b4ff, transparent: true, opacity: 0.3 }));
  rain.frustumCulled = false;
  scene.add(rain);

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
  // It is stretched downward, as lights smear on rough wet asphalt.
  const mirror = city.clone(true);
  mirror.scale.y = -1.5;
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
  const tags: { id: string; kana: string; mesh: THREE.Mesh; age: number; filled: boolean; colour: string }[] = [];
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

  // A few of the signs are on their last legs.
  const dying = signs.filter(() => Math.random() < 0.14).map((mesh) => ({ mat: mesh.material as THREE.MeshBasicMaterial, seed: Math.random() * 100 }));
  const train = city.getObjectByName('train')!;
  const tail = city.getObjectByName('tail')!;
  const bird = city.getObjectByName('bird')!;
  let minute = -1;

  return {
    scene,
    things,
    puddle,
    tags,
    tag(id, kana, filled, animate) {
      if (nextSlot >= slots.length) return;
      const s = slots[nextSlot++];
      const colour = NEON[nextSlot % NEON.length];
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 2.1),
        new THREE.MeshBasicMaterial({ map: tagTexture(kana, colour, filled), transparent: true, depthWrite: false, opacity: animate ? 0 : 1 }),
      );
      mesh.position.set(s.x, 1.9, s.z);
      mesh.rotation.y = (-s.side * Math.PI) / 2;
      scene.add(mesh);
      tags.push({ id, kana, mesh, age: animate ? 0 : 9, filled, colour });
    },
    fill(id) {
      const t = tags.find((x) => x.id === id);
      if (!t || t.filled) return;
      t.filled = true;
      t.age = 0;
      const mat = t.mesh.material as THREE.MeshBasicMaterial;
      mat.map?.dispose();
      mat.map = tagTexture(t.kana, t.colour, true);
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
    setRich(on) {
      mirror.visible = on;
      rain.visible = on;
      ripples.visible = on;
    },
    update(time, dt, eye) {
      puddleTime.value = time;
      rippleTime.value = time;
      // Failing neon: mostly on, with sudden stutters and the odd blackout.
      for (const d of dying) {
        const n = Math.sin(time * 31 + d.seed) * Math.sin(time * 7.3 + d.seed * 2);
        d.mat.color.setScalar(n > 0.75 ? 0.25 : Math.sin(time * 0.6 + d.seed) > 0.93 ? 0.08 : 1);
      }
      for (const w of walkers) {
        const g = w.group;
        g.position.z -= w.dir * w.speed * dt;
        if (g.position.z < -46) g.position.z = 46;
        if (g.position.z > 46) g.position.z = -46;
        const swing = Math.sin(time * 6 * w.speed + g.position.x) * 0.5;
        w.legs[0].rotation.x = swing;
        w.legs[1].rotation.x = -swing;
        w.thing.anchor.set(g.position.x, 3, g.position.z);
      }
      for (const c of traffic) {
        c.group.position.x += c.dir * 9 * dt;
        if (c.group.position.x * c.dir > 70) c.group.position.x = -c.dir * (70 + Math.random() * 60);
        c.thing.anchor.set(c.group.position.x, 2.8, c.group.position.z);
      }
      for (let i = 0; i < PUFFS; i++) {
        const v = vents[i % vents.length];
        const t = (time * 0.35 + i * 0.137) % 1;
        puffPos.set([v[0] + Math.sin(i * 7 + time) * 0.25 * t, v[1] + t * 2.6, v[2] + Math.cos(i * 5 + time * 0.8) * 0.25 * t], i * 3);
      }
      puffGeo.attributes.position.needsUpdate = true;
      if (rain.visible) {
        for (let i = 0; i < DROPS; i++) {
          rainAt[i * 3 + 1] -= dt * 26;
          if (rainAt[i * 3 + 1] < 0) rainAt[i * 3 + 1] += 22;
          const x = eye.x + rainAt[i * 3];
          const y = rainAt[i * 3 + 1];
          const z = eye.z + rainAt[i * 3 + 2];
          rainPos.set([x, y, z, x + 0.03, y + 0.7, z], i * 6);
        }
        rainGeo.attributes.position.needsUpdate = true;
      }
      glowMat.uniforms.uScale.value = window.innerHeight;
      // The train slides in, waits at the station, and slides out again.
      const cycle = time % 40;
      train.position.x = cycle < 6 ? -70 + (cycle / 6) * 70 * (2 - cycle / 6) : cycle < 26 ? 0 : (cycle - 26) * (cycle - 26) * 0.5;
      tail.rotation.y = Math.sin(time * 1.4) * 0.5;
      // The pigeon bobs its head as it pecks.
      bird.rotation.x = Math.max(0, Math.sin(time * 3)) * 0.35;
      for (let i = 0; i < PETALS; i++) {
        petalPos[i * 3 + 1] -= dt * (0.5 + (i % 5) * 0.12);
        petalPos[i * 3] += Math.sin(time * 0.8 + i) * dt * 0.4;
        if (petalPos[i * 3 + 1] < 0) petalPos[i * 3 + 1] = 16;
      }
      petalGeo.attributes.position.needsUpdate = true;
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
      // Outlines she has not written yet pulse gently, asking to be sprayed.
      for (const t of tags) {
        if (!t.filled && t.age > 2) (t.mesh.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.35 * Math.sin(time * 2.4);
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
