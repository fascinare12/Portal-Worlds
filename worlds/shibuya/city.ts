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
  /** Her tags on the walls; tapping one opens it for writing. */
  tags: { id: string; mesh: THREE.Mesh }[];
  /** Puts a word's tag on the next free stretch of wall: an outline until she has written it herself. */
  tag(id: string, kana: string, filled: boolean, animate: boolean): void;
  /** Fills a tag in with colour, once she has written the word. */
  fill(id: string): void;
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

/** The face of a building: a dark wall with a grid of windows, some lit. It tiles, so tall buildings get more floors. */
function facade(): THREE.CanvasTexture {
  const [c, g] = canvas(128, 128);
  g.fillStyle = pick(['#15142e', '#1b1838', '#121a33', '#201636', '#191526']);
  g.fillRect(0, 0, 128, 128);
  const warm = ['#ffd27a', '#ffe9b0', '#ffbf66', '#fff3d0'];
  for (let r = 0; r < 4; r++) {
    for (let k = 0; k < 4; k++) {
      const lit = rnd();
      g.fillStyle = lit < 0.42 ? pick(warm) : lit < 0.5 ? pick(NEON) : '#0b0b1c';
      g.globalAlpha = lit < 0.5 ? 0.6 + rnd() * 0.4 : 1;
      g.fillRect(k * 32 + 5, r * 32 + 7, 22, 18);
      // A sill under each window, and now and then an air conditioner.
      g.globalAlpha = 1;
      g.fillStyle = '#2c2a44';
      g.fillRect(k * 32 + 3, r * 32 + 26, 26, 2);
      if (rnd() < 0.15) {
        g.fillStyle = '#4a4860';
        g.fillRect(k * 32 + 9, r * 32 + 27, 12, 5);
      }
    }
  }
  // Grime: streaks running down the wall.
  for (let i = 0; i < 10; i++) {
    g.fillStyle = `rgba(0,0,0,${0.1 + rnd() * 0.2})`;
    g.fillRect(rnd() * 128, 0, 1 + rnd() * 3, 128);
  }
  const t = texture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** The ground floor of a building: a rolled-down metal shutter, or a lit shopfront. */
function groundFloor(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 128);
  if (rnd() < 0.55) {
    // Shutter: corrugated grey metal, dented and stained.
    for (let y = 0; y < 128; y += 6) {
      g.fillStyle = y % 12 ? '#3c3a4c' : '#2e2c3c';
      g.fillRect(0, y, 256, 6);
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = `rgba(0,0,0,${0.12 + rnd() * 0.2})`;
      g.fillRect(rnd() * 256, rnd() * 40, 2 + rnd() * 6, 60 + rnd() * 60);
    }
  } else {
    // Shopfront: warm light through glass, a doorway, shelves of things.
    const glow = g.createLinearGradient(0, 0, 0, 128);
    glow.addColorStop(0, pick(['#ffd27a', '#ffe9b0', '#bff3ff']));
    glow.addColorStop(1, '#ff9f5a');
    g.fillStyle = glow;
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#15142e';
    g.fillRect(0, 0, 256, 10);
    for (let x = 0; x <= 256; x += 64) g.fillRect(x - 3, 0, 6, 128);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = pick(NEON);
      g.globalAlpha = 0.7;
      g.fillRect(8 + rnd() * 236, 30 + Math.floor(rnd() * 3) * 30, 6 + rnd() * 8, 14);
    }
    g.globalAlpha = 1;
  }
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
function scribble(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 128);
  g.lineCap = g.lineJoin = 'round';
  const layers = 2 + Math.floor(rnd() * 3);
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
  const faces = Array.from({ length: 7 }, () => facade());
  const floors = Array.from({ length: 8 }, () => new THREE.MeshBasicMaterial({ map: groundFloor() }));
  const roofStuff = lambert(0x24223a);
  const signWords = WORDS.map((w) => w.kana);
  const building = (x: number, z: number, w: number, d: number, h: number, faceX: number, faceZ: number) => {
    // Windows stay the same size however big the building is.
    const map = pick(faces).clone();
    map.repeat.set(Math.max(1, Math.round((faceX ? d : w) / 5)), Math.max(2, Math.round(h / 5.5)));
    map.needsUpdate = true;
    const b = box(new THREE.MeshBasicMaterial({ map }), w, h, d, x, h / 2 + 3.4, z);
    city.add(b);
    // The ground floor: a shutter or a shopfront facing the street, on a dark base.
    city.add(box(roofStuff, w, 3.4, d, x, 1.7, z));
    const front = new THREE.Mesh(new THREE.PlaneGeometry((faceX ? d : w) - 0.6, 3), pick(floors));
    front.position.set(x + faceX * (w / 2 + 0.03), 1.7, z + faceZ * (d / 2 + 0.03));
    front.rotation.y = faceX ? (faceX * Math.PI) / 2 : faceZ > 0 ? 0 : Math.PI;
    city.add(front);
    // A ledge over the ground floor, and clutter on the roof: a water tank, a hoarding, a red warning light.
    city.add(box(roofStuff, w + (faceX ? 0.8 : 0), 0.3, d + (faceZ ? 0.8 : 0), x + faceX * 0.4, 3.5, z + faceZ * 0.4));
    const top = h + 3.4;
    if (rnd() < 0.5) city.add(box(roofStuff, 2, 2.2, 2, x + (rnd() - 0.5) * (w - 3), top + 1.1, z + (rnd() - 0.5) * (d - 3)));
    if (rnd() < 0.35) {
      const big = sign(pick(signWords), pick(NEON), false);
      big.scale.setScalar(1.8);
      big.position.set(x + faceX * (w / 2 - 0.4), top + 1.6, z + faceZ * (d / 2 - 0.4));
      big.rotation.y = faceX ? (faceX * Math.PI) / 2 : faceZ > 0 ? 0 : Math.PI;
      city.add(big);
    }
    if (h > 22) light(x, top + 0.4, z, '#ff3030', 2.2);
    // Most buildings carry a neon sign on the side facing the street.
    if (rnd() < 0.8) {
      const upright = rnd() < 0.65;
      const s = sign(pick(signWords), pick(NEON), upright);
      const y = 6.5 + rnd() * Math.min(8, h - 8);
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
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), lambert(0xff7a3a, 0.4));
        cone.position.set(x, 0.5, z);
        city.add(cone);
      } else if (kind < 0.7) {
        city.add(box(lambert(pick([0x39a0c0, 0xc0a039, 0x8a4a6a])), 0.7, 0.45, 0.5, x, 0.43, z));
      } else {
        const bag = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), lambert(0x15131f));
        bag.position.set(x, 0.5, z);
        bag.scale.y = 0.8;
        city.add(bag);
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
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff5a3a }));
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
    const ball = (color: number, r: number, glowing = 0.3) => new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), lambert(color, glowing));
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
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 18), tyre);
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
      const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), grey);
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

  // Petals drifting down past the lights.
  const PETALS = 260;
  const petalPos = new Float32Array(PETALS * 3);
  for (let i = 0; i < PETALS; i++) petalPos.set([(rnd() * 2 - 1) * 30, rnd() * 16, (rnd() * 2 - 1) * 50], i * 3);
  const petalGeo = new THREE.BufferGeometry();
  petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
  const petals = new THREE.Points(petalGeo, new THREE.PointsMaterial({ color: 0xffc8ec, size: 0.16, transparent: true, opacity: 0.85 }));
  petals.frustumCulled = false;
  scene.add(petals);

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
    update(time, dt) {
      puddleTime.value = time;
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
