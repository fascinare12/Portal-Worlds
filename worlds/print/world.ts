import * as THREE from 'three';
import * as art from './art';

/**
 * The Printer's World. A sheet of cream paper on which a landscape prints
 * itself around whoever walks through it: first the outlines, then the pale
 * washes, then deep blue, then the warm colours. What has been walked past
 * stays printed; what lies ahead is still bare paper.
 *
 * Everything is a flat cut-out standing at its own depth, always turned to
 * face the viewer, like the flats of a paper theatre.
 */

/** The printed sheet covers this many units each way. */
export const WORLD = 440;
/** How far from the middle she may walk. */
export const REACH = 178;
export const CELLS = 176;
// These go to the shaders exactly as written, in the colours of the screen, so they match the painted cut-outs.
const PAPER = new THREE.Color(art.PAPER).convertLinearToSRGB();
const LINE = new THREE.Color('#16284a').convertLinearToSRGB(); // the key block is printed in dark blue, not black

// ---- The lie of the land, written once here and once more in the ground's shader below.
export const riverX = (z: number) => 55 + 18 * Math.sin(z * 0.025);
export const shoreZ = (x: number) => 95 + 10 * Math.sin(x * 0.03) + 5 * Math.sin(x * 0.11);
export const isWater = (x: number, z: number) => z > shoreZ(x) || (Math.abs(x - riverX(z)) < 6.5 && z > -175);

const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  // How far each block has been printed, from how far along (0 to 1) this spot is.
  // x: outlines, y: pale washes, z: deep blue, w: the warm colours.
  vec4 plates(float p) {
    return vec4(smoothstep(0.05, 0.2, p), smoothstep(0.3, 0.46, p), smoothstep(0.54, 0.7, p), smoothstep(0.78, 0.94, p));
  }
  // The paper itself: cream, with long fibres and a faint mottle.
  vec3 washi(vec3 paper, vec2 at) {
    float fibre = noise(vec2(at.x * 0.6, at.y * 14.0)) * 0.5 + noise(at * 5.0) * 0.5;
    return paper * (0.955 + 0.07 * fibre);
  }
`;

interface Layer {
  art: art.Art;
  rows: number[]; // x, y, z, width, height, flip, far, fixed
  mesh?: THREE.Mesh;
}

export interface Viewpoint {
  x: number;
  z: number;
  found: boolean;
}

export interface PrintWorld {
  scene: THREE.Scene;
  viewpoints: Viewpoint[];
  /** Moves the printing on. Returns how much new printing happened this frame, for the sound. */
  /** `halfView` is half the width of what she can see, as an angle. Only what is in view prints. */
  update(dt: number, time: number, eye: THREE.Vector3, yaw: number, halfView: number): number;
  /** The state of the sheet, to keep between visits, and to put back. */
  save(): string;
  load(data: string): void;
  /** A fresh sheet. */
  clear(): void;
  /** Marks a viewpoint as found, which takes down the seal that hung over it. */
  collect(index: number): void;
}

export function buildWorld(): PrintWorld {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(art.PAPER);

  let seed = 20260;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ---- The printing: a grid over the land holding how far each spot has got, from 0 to 1.
  const progress = new Float32Array(CELLS * CELLS);
  const bytes = new Uint8Array(CELLS * CELLS);
  const field = new THREE.DataTexture(bytes, CELLS, CELLS, THREE.RedFormat);
  field.magFilter = field.minFilter = THREE.LinearFilter;
  field.needsUpdate = true;
  const uField = { value: field };
  const uHere = { value: 0 };
  const uTime = { value: 0 };
  const uRight = { value: new THREE.Vector3(1, 0, 0) };
  const uPaper = { value: PAPER };
  const uLine = { value: LINE };

  // ---- The ground.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: { uField, uTime, uPaper, uLine },
      vertexShader: `varying vec3 vW; void main() { vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uField;
        uniform float uTime;
        uniform vec3 uPaper;
        uniform vec3 uLine;
        varying vec3 vW;
        ${NOISE}
        float riverX(float z) { return 55.0 + 18.0 * sin(z * 0.025); }
        void main() {
          vec2 w = vW.xz;
          float seen = distance(vW, cameraPosition);
          float p = texture2D(uField, w / ${WORLD.toFixed(1)} + 0.5).r + (noise(w * 0.3) - 0.5) * 0.14;
          vec4 on = plates(p);
          // Underfoot the paper is evenly mottled; long fibres would streak away to the horizon.
          vec3 paper = uPaper * (0.96 + 0.06 * noise(w * 1.7) + 0.02 * noise(w * 9.0));
          vec3 c = paper;

          float shore = 95.0 + 10.0 * sin(w.x * 0.03) + 5.0 * sin(w.x * 0.11);
          float sea = smoothstep(-0.6, 0.6, w.y - shore);
          float river = (1.0 - smoothstep(5.6, 6.6, abs(w.x - riverX(w.y)))) * step(-175.0, w.y);
          float water = max(sea, river);
          float land = 1.0 - water;

          // The roads: a ring round the middle and two that cross it, the pink of trodden earth.
          float r = length(w);
          float ring = abs(r - 62.0 - 6.0 * sin(atan(w.y, w.x) * 3.0));
          float north = abs(w.x - 8.0 * sin(w.y * 0.04));
          float east = abs(w.y - 6.0 * sin(w.x * 0.035));
          float roadD = min(ring, min(north, east));
          float road = (1.0 - smoothstep(1.7, 2.1, roadD)) * land;

          // Terraced fields to the west: bands of straw yellow and young green.
          float west = smoothstep(-52.0, -72.0, w.x) * (1.0 - smoothstep(70.0, 92.0, abs(w.y)));
          float terrace = w.y * 0.2 + sin(w.x * 0.05) * 1.6;
          float band = mod(floor(terrace), 2.0);
          float furrow = fract(terrace);

          // Pale washes: soft patches of blue-green over the land, fading out to bare paper.
          float patchy = smoothstep(0.3, 0.75, noise(w * 0.03 + 3.0));
          c = mix(c, vec3(0.70, 0.82, 0.76), on.y * land * patchy * 0.75 * (1.0 - west));
          c = mix(c, vec3(0.71, 0.83, 0.87), on.y * water);
          // Deep blue: far water, and long bands lying across the nearer water.
          float bands = smoothstep(0.52, 0.7, noise(vec2(w.x * 0.03 + uTime * 0.015, w.y * 0.33)));
          float far = smoothstep(18.0, 80.0, w.y - shore);
          c = mix(c, vec3(0.09, 0.25, 0.48), on.z * water * clamp(bands * 0.8 + far * sea, 0.0, 0.92));
          // The warm colours: fields and roads.
          c = mix(c, mix(vec3(0.93, 0.85, 0.57), vec3(0.72, 0.80, 0.53), band), on.w * west * land * (1.0 - road) * 0.9);
          c = mix(c, vec3(0.90, 0.75, 0.66), on.w * road * 0.9);

          // The key block. Close by: clustered dots and short dashes over the land, as on his hillsides.
          float near = 1.0 - smoothstep(40.0, 110.0, seen);
          vec2 cell = w * vec2(2.6, 1.5);
          vec2 id = floor(cell);
          float thick = smoothstep(0.45, 0.8, noise(w * 0.07 + 7.0));
          vec2 jig = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
          // Seen along the ground they would smear into long streaks, so each is drawn short and wide.
          vec2 d = (fract(cell) - 0.5 - jig * 0.6) * vec2(1.6, 0.9);
          float dots = step(1.0 - 0.5 * thick, hash(id)) * smoothstep(0.16, 0.08, length(d)) * land * (1.0 - road) * near * 0.7;
          // Water: rows of small curling lines.
          float row = w.y * 0.42;
          float curl = abs(fract(row + 0.22 * sin(w.x * 0.55 + floor(row) * 2.3 + uTime * 0.3)) - 0.5);
          float ripples = (1.0 - smoothstep(0.0, max(fwidth(row) * 1.6, 0.012), curl)) * water * step(0.35, hash(vec2(floor(w.x * 0.12 + floor(row) * 0.37), floor(row)))) * near;
          // Edges: the banks, the sides of the road, the terrace walls.
          // Each is kept about the same width on the screen however near it is, like a line cut in a block.
          float shoreD = w.y - shore;
          float riverD = abs(w.x - riverX(w.y)) - 6.1;
          float bank = (1.0 - smoothstep(0.0, max(fwidth(shoreD) * 1.6, 0.05), abs(shoreD))) + (1.0 - smoothstep(0.0, max(fwidth(riverD) * 1.6, 0.05), abs(riverD))) * step(-175.0, w.y) * (1.0 - sea);
          float verge = (1.0 - smoothstep(0.0, max(fwidth(roadD) * 1.3, 0.04), abs(roadD - 1.9))) * land;
          float wall = (1.0 - smoothstep(0.0, max(fwidth(terrace) * 1.3, 0.01), min(furrow, 1.0 - furrow))) * west * land * (1.0 - road);
          float line = clamp(dots + ripples * 0.85 + bank + verge * 0.8 + wall, 0.0, 1.0);
          c = mix(c, uLine, line * on.x * 0.88);

          // Far off, everything pales towards the paper.
          c = mix(c, paper, smoothstep(110.0, 330.0, seen) * 0.8);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  scene.add(ground);

  // ---- The sky: bare paper, a band of deep blue pressed along the top, and a blush low down.
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(900, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { uHere, uPaper, uLine },
      vertexShader: `varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uHere;
        uniform vec3 uPaper;
        uniform vec3 uLine;
        varying vec3 vD;
        ${NOISE}
        void main() {
          vec3 d = normalize(vD);
          float turn = atan(d.z, d.x);
          vec4 on = plates(uHere);
          vec3 paper = washi(uPaper, vec2(turn * 40.0, d.y * 60.0));
          vec3 c = paper;
          // The blue is wiped onto the block and fades as it comes down: darkest at the very top.
          float streak = 0.92 + 0.12 * noise(vec2(turn * 3.0, d.y * 260.0));
          // Flat clouds of bare paper lie in it, in ragged rows.
          float cloud = smoothstep(0.5, 0.56, noise(vec2(turn * 7.0, d.y * 46.0)) * 0.7 + noise(vec2(turn * 19.0, d.y * 120.0)) * 0.3) * smoothstep(0.42, 0.2, d.y);
          c = mix(c, vec3(0.62, 0.77, 0.85), on.y * smoothstep(0.07, 0.3, d.y) * 0.7 * (1.0 - cloud));
          c = mix(c, vec3(0.09, 0.25, 0.48) * streak, on.z * smoothstep(0.2, 0.44, d.y) * 0.95 * (1.0 - cloud));
          // A blush of pink low in one quarter of the sky.
          c = mix(c, vec3(0.93, 0.70, 0.60), on.w * smoothstep(0.2, 0.0, d.y) * step(0.0, d.y) * (0.5 + 0.5 * cos(turn - 2.2)) * 0.6);
          // A few ruled lines just above the horizon.
          float rule = smoothstep(0.0016, 0.0004, abs(d.y - 0.045)) + smoothstep(0.0014, 0.0004, abs(d.y - 0.07)) * step(0.5, noise(vec2(turn * 5.0, 1.0)));
          c = mix(c, uLine, rule * on.x * 0.5);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  scene.add(sky);

  // ---- The cut-outs.
  const layers = new Map<string, Layer>();
  const layer = (name: string, picture: () => art.Art): Layer => {
    let l = layers.get(name);
    if (!l) layers.set(name, (l = { art: picture(), rows: [] }));
    return l;
  };
  /** Stands a cut-out at (x, z), `height` tall. Returns its number within its layer. */
  const put = (l: Layer, x: number, z: number, height: number, opt: { y?: number; flip?: boolean; far?: boolean; fixed?: boolean } = {}) => {
    l.rows.push(x, opt.y ?? -0.15, z, height * l.art.aspect, height, opt.flip ? -1 : 1, opt.far ? 1 : 0, opt.fixed ? 1 : 0);
    return l.rows.length / 8 - 1;
  };
  const around = (rMin: number, rMax: number): [number, number] => {
    const a = rnd() * Math.PI * 2;
    const r = rMin + rnd() * (rMax - rMin);
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const onLand = (rMin: number, rMax: number, margin = 3): [number, number] => {
    for (let i = 0; i < 40; i++) {
      const [x, z] = around(rMin, rMax);
      if (!isWater(x, z) && !isWater(x + margin, z) && !isWater(x - margin, z) && z < shoreZ(x) - margin) return [x, z];
    }
    return [0, -30];
  };
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];

  const L = {
    fuji: layer('fuji', art.fuji),
    ridges: [layer('ridge1', () => art.ridge(1)), layer('ridge2', () => art.ridge(2))],
    hills: [layer('hill1', () => art.hill(1, 0)), layer('hill2', () => art.hill(2, 1)), layer('hill3', () => art.hill(3, 2)), layer('hill4', () => art.hill(4, 0))],
    pines: [1, 2, 3, 4].map((n) => layer('pine' + n, () => art.pine(n))),
    groves: [1, 2, 3].map((n) => layer('grove' + n, () => art.grove(n))),
    huts: [0, 1, 2].map((n) => layer('hut' + n, () => art.hut(n))),
    bridge: layer('bridge', art.bridge),
    people: [0, 1, 2, 3, 4, 5, 7].map((n) => layer('people' + n, () => art.travellers(n))),
    horse: layer('horse', art.packhorse),
    boats: [0, 1].map((n) => layer('boat' + n, () => art.boat(n))),
    mists: [1, 2].map((n) => layer('mist' + n, () => art.mist(n))),
    waves: [1, 2].map((n) => layer('waves' + n, () => art.waves(n))),
    falls: layer('falls', art.falls),
    rocks: [1, 2].map((n) => layer('rocks' + n, () => art.rocks(n))),
    reeds: [1, 2].map((n) => layer('reeds' + n, () => art.reeds(n))),
    sheaves: layer('sheaves', art.sheaves),
    cranes: layer('cranes', art.cranes),
    birds: layer('birds', art.birds),
    lantern: layer('lantern', art.lantern),
    seal: layer('seal', art.seal),
  };

  // The mountain, which is moved every frame to stay ahead of her.
  put(L.fuji, 0, -300, 118, { far: true, y: -14 });
  // Far ranges all the way round, and nearer hills in a broad ring.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.3;
    put(pick(L.ridges), Math.cos(a) * 250, Math.sin(a) * 250, 30 + rnd() * 16, { far: true, y: -3, flip: rnd() < 0.5 });
  }
  // The big hills stand just beyond where she can walk; low knolls lie among the roads.
  for (let i = 0; i < 64; i++) {
    const [x, z] = around(REACH + 12, REACH + 60);
    if (z > shoreZ(x) - 14) continue;
    put(pick(L.hills), x, z, 13 + rnd() * 15, { flip: rnd() < 0.5, y: -0.6 });
  }
  for (let i = 0; i < 40; i++) {
    const [x, z] = onLand(50, 175, 8);
    put(pick(L.hills), x, z, 3.5 + rnd() * 3.5, { flip: rnd() < 0.5, y: -0.3 });
  }
  // Mist lying in bands across the middle distance.
  for (let i = 0; i < 46; i++) {
    const [x, z] = around(60, 200);
    put(pick(L.mists), x, z, 4 + rnd() * 3.5, { y: 1 + rnd() * 6, flip: rnd() < 0.5 });
  }
  // Pines: a forest to the north, and odd ones everywhere.
  for (let i = 0; i < 120; i++) {
    const north = i < 80;
    const [x, z] = north ? [-110 + rnd() * 220, -60 - rnd() * 120] : onLand(8, 180);
    if (isWater(x, z) || Math.abs(x - 8 * Math.sin(z * 0.04)) < 3.5) continue;
    put(pick(L.pines), x, z, 13 + rnd() * 12, { flip: rnd() < 0.5 });
  }
  for (let i = 0; i < 60; i++) {
    const [x, z] = onLand(20, 185);
    put(pick(L.groves), x, z, 6 + rnd() * 6, { flip: rnd() < 0.5 });
  }
  // The village, east of the river, and a few houses standing by themselves.
  for (let i = 0; i < 20; i++) {
    const [x, z] = i < 14 ? [84 + rnd() * 50, -34 + rnd() * 62] : onLand(20, 150);
    if (isWater(x, z) || Math.abs(z - 6 * Math.sin(x * 0.035)) < 4) continue;
    put(pick(L.huts), x, z, 6 + rnd() * 2, { flip: rnd() < 0.5 });
  }
  // The bridge, where the east road meets the river. Like everything here it shows its side to whoever looks.
  const bridgeZ = 5.4;
  put(L.bridge, riverX(bridgeZ), bridgeZ, 13, { y: -1.2 });
  // People on the roads.
  for (let i = 0; i < 56; i++) {
    const which = i % 3;
    const t = (rnd() - 0.5) * 2;
    let x: number;
    let z: number;
    if (which === 0) {
      const a = rnd() * 6.28;
      const r = 62 + 6 * Math.sin(a * 3) + (rnd() - 0.5) * 2;
      [x, z] = [Math.cos(a) * r, Math.sin(a) * r];
    } else if (which === 1) {
      z = t * 150;
      x = 8 * Math.sin(z * 0.04) + (rnd() - 0.5) * 2;
    } else {
      x = t * 150;
      z = 6 * Math.sin(x * 0.035) + (rnd() - 0.5) * 2;
    }
    if (isWater(x, z) || Math.hypot(x, z) < 6) continue;
    put(pick(L.people), x, z, 2.7 + rnd() * 0.5, { flip: rnd() < 0.5 });
  }
  // The fields to the west: sheaves drying, packhorses carrying the harvest in.
  for (let i = 0; i < 34; i++) put(L.sheaves, -70 - rnd() * 100, -70 + rnd() * 140, 2.4 + rnd() * 0.8, { flip: rnd() < 0.5 });
  for (let i = 0; i < 8; i++) put(L.horse, -66 - rnd() * 90, 6 * Math.sin((-66 - i * 12) * 0.035) + (rnd() - 0.5) * 50, 4.4, { flip: rnd() < 0.5 });
  // The sea to the south: rows of waves, boats working, cranes and reeds along the shore.
  for (let i = 0; i < 44; i++) {
    const x = -200 + rnd() * 400;
    put(pick(L.waves), x, shoreZ(x) + 6 + rnd() * rnd() * 110, 4 + rnd() * 4, { flip: rnd() < 0.3, y: -0.4 });
  }
  for (let i = 0; i < 12; i++) {
    const x = -170 + rnd() * 340;
    put(pick(L.boats), x, shoreZ(x) + 12 + rnd() * 60, 3.4 + rnd(), { flip: rnd() < 0.5, y: 0.1 });
  }
  for (let i = 0; i < 5; i++) {
    const z = -150 + i * 46 + rnd() * 20;
    put(L.boats[0], riverX(z), z, 2.6, { flip: rnd() < 0.5, y: 0.1 });
  }
  for (let i = 0; i < 70; i++) {
    const shoreline = i < 44;
    const x = shoreline ? -190 + rnd() * 380 : 0;
    const z = shoreline ? shoreZ(x) - 1 - rnd() * 7 : -165 + rnd() * 250;
    put(pick(L.reeds), shoreline ? x : riverX(z) + (rnd() < 0.5 ? -8 : 8) + (rnd() - 0.5) * 2, z, 2.4 + rnd() * 2, { flip: rnd() < 0.5 });
  }
  for (let i = 0; i < 26; i++) {
    const x = -180 + rnd() * 360;
    put(pick(L.rocks), x, shoreZ(x) + (rnd() - 0.3) * 8, 2.5 + rnd() * 4, { flip: rnd() < 0.5 });
  }
  for (let i = 0; i < 6; i++) {
    const x = -90 + rnd() * 70;
    put(L.cranes, x, shoreZ(x) - 3 - rnd() * 4, 3.4, { flip: rnd() < 0.5 });
  }
  // The falls, at the head of the river in the northern hills.
  put(L.falls, riverX(-176) - 2, -180, 50, { y: -1 });
  for (let i = 0; i < 10; i++) put(pick(L.rocks), riverX(-170) + (rnd() - 0.5) * 60, -168 + rnd() * 16, 5 + rnd() * 7, { flip: rnd() < 0.5 });
  // Birds, high up.
  for (let i = 0; i < 12; i++) {
    const [x, z] = around(40, 190);
    put(L.birds, x, z, 7 + rnd() * 5, { y: 22 + rnd() * 26, flip: rnd() < 0.5 });
  }
  // Eight places where the view is worth stopping for: a stone lantern with a red seal hung over it.
  const viewpoints: Viewpoint[] = [
    [5, -16],
    [40, 9],
    [104, 26],
    [26, 86],
    [-58, 92],
    [-112, 8],
    [-74, -96],
    [28, -150],
  ].map(([x, z]) => ({ x, z, found: false }));
  const sealRows: number[] = [];
  for (const v of viewpoints) {
    put(L.lantern, v.x, v.z, 3.8);
    sealRows.push(put(L.seal, v.x, v.z - 0.05, 1.5, { y: 4.6 }));
  }

  // Each layer becomes one drawing of many copies of the same cut-out.
  const quad = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const texture = (canvas: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(canvas);
    t.anisotropy = 4;
    return t;
  };
  for (const l of layers.values()) {
    const count = l.rows.length / 8;
    if (!count) continue;
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = quad.index;
    geo.setAttribute('position', quad.attributes.position);
    geo.setAttribute('uv', quad.attributes.uv);
    const data = new THREE.InstancedInterleavedBuffer(new Float32Array(l.rows), 8);
    geo.setAttribute('aPos', new THREE.InterleavedBufferAttribute(data, 3, 0));
    geo.setAttribute('aSize', new THREE.InterleavedBufferAttribute(data, 2, 3));
    geo.setAttribute('aOpt', new THREE.InterleavedBufferAttribute(data, 3, 5));
    geo.instanceCount = count;
    const mesh = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({
        uniforms: { tColour: { value: texture(l.art.colour) }, tLine: { value: texture(l.art.line) }, uField, uHere, uRight, uPaper, uLine },
        vertexShader: /* glsl */ `
          attribute vec3 aPos;
          attribute vec2 aSize;
          attribute vec3 aOpt;
          uniform vec3 uRight;
          varying vec2 vUv;
          varying vec3 vW;
          varying vec3 vFoot;
          varying float vFar;
          varying float vWide;
          void main() {
            vWide = aSize.x;
            // Every flat faces the viewer squarely, except the few that keep a direction of their own.
            vec3 right = mix(uRight, vec3(1.0, 0.0, 0.0), aOpt.z);
            vW = aPos + right * (position.x * aSize.x) + vec3(0.0, position.y * aSize.y, 0.0);
            vFoot = aPos;
            vUv = vec2(aOpt.x > 0.0 ? uv.x : 1.0 - uv.x, uv.y);
            vFar = aOpt.y;
            gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D tColour;
          uniform sampler2D tLine;
          uniform sampler2D uField;
          uniform float uHere;
          uniform vec3 uPaper;
          uniform vec3 uLine;
          varying vec2 vUv;
          varying vec3 vW;
          varying vec3 vFoot;
          varying float vFar;
          varying float vWide;
          ${NOISE}
          void main() {
            // The colour blocks sit a hair out of register with the outlines, as they do on a real print.
            vec4 ink = texture2D(tColour, vUv + vec2(0.0022, -0.0018));
            float key = texture2D(tLine, vUv).a;
            float there = max(ink.a, key);
            // A cut-out whose foot fades into mist is broken up into specks rather than made see-through.
            float seen = distance(vW, cameraPosition);
            // Anything she walks right up to thins away, so no cut-out ever fills the view.
            float closeBy = smoothstep(2.5 + vWide * 0.2, 6.5 + vWide * 0.4, distance(vFoot.xz, cameraPosition.xz));
            float speck = hash(gl_FragCoord.xy);
            if (there < 0.04 + 0.92 * speck) discard;
            // It goes back to its bare outlines first, as if not yet printed, and then those go too.
            if (closeBy < 0.04 + 0.92 * speck && (key < 0.4 || closeBy < 0.2)) discard;
            // How far this spot has been printed. A cut-out prints across its width, not all at once.
            vec2 spot = mix(vFoot.xz, vW.xz, 0.6);
            float p = mix(texture2D(uField, spot / ${WORLD.toFixed(1)} + 0.5).r, uHere, vFar) + (noise(vW.xy * 0.45 + vW.z) - 0.5) * 0.12;
            // Each block is rubbed down from one side of a cut-out to the other, so it is seen to arrive.
            vec4 on = plates(p * 1.22 - vUv.x * 0.22);
            if (on.x < 0.02) discard;

            vec3 paper = washi(uPaper, vW.xy * 0.5 + vW.z);
            // Which block a colour belongs to: warm colours last, dark blues and greens before them, pale washes first.
            float warm = step(ink.b + 0.015, ink.r);
            float dark = step(dot(ink.rgb, vec3(0.3, 0.5, 0.2)), 0.45);
            float printed = mix(mix(on.y, on.z, dark), on.w, warm);
            // Ink rubbed on by hand is never quite even.
            float rub = 0.95 + 0.09 * noise(vec2(vW.x * 0.8 + vW.z, vW.y * 5.0));
            // Fresh ink is wet: darker for a moment where the block has only just come down.
            float wet = printed * (1.0 - printed) * 4.0;
            vec3 c = mix(paper, ink.rgb * rub * (1.0 - 0.22 * wet), printed * step(0.5, ink.a));
            c = mix(c, uLine, key * on.x * 0.9);
            // Things far away are printed paler.
            c = mix(c, paper, smoothstep(60.0, 260.0, seen) * 0.5 * (1.0 - vFar));
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    );
    mesh.frustumCulled = false;
    l.mesh = mesh;
    scene.add(mesh);
  }
  const rowsOf = (l: Layer) => ((l.mesh!.geometry as THREE.InstancedBufferGeometry).getAttribute('aPos') as THREE.InterleavedBufferAttribute).data;

  let fujiTurn = 0;
  let started = false;

  const toBytes = () => {
    for (let i = 0; i < progress.length; i++) bytes[i] = Math.round(progress[i] * 255);
    field.needsUpdate = true;
  };

  return {
    scene,
    viewpoints,
    update(dt, time, eye, yaw, halfView) {
      uTime.value = time;
      uRight.value.set(Math.cos(yaw), 0, Math.sin(yaw));
      sky.position.copy(eye);

      // Print the land round her. Near things finish; things further off get only as far as their
      // outlines or their first washes, and wait for her to come closer.
      const cell = WORLD / CELLS;
      const ci = Math.floor((eye.x + WORLD / 2) / cell);
      const cj = Math.floor((eye.z + WORLD / 2) / cell);
      const span = Math.ceil(84 / cell);
      let fresh = 0;
      // Only what she is looking at prints. Turn away and it waits, half done; turn back and it carries on.
      const fx = Math.sin(yaw);
      const fz = -Math.cos(yaw);
      const edge = Math.cos(Math.min(3.1, halfView + 0.12));
      for (let j = Math.max(0, cj - span); j <= Math.min(CELLS - 1, cj + span); j++) {
        for (let i = Math.max(0, ci - span); i <= Math.min(CELLS - 1, ci + span); i++) {
          const x = (i + 0.5) * cell - WORLD / 2;
          const z = (j + 0.5) * cell - WORLD / 2;
          const d = Math.hypot(x - eye.x, z - eye.z);
          if (d > 5 && ((x - eye.x) * fx + (z - eye.z) * fz) / d < edge) continue;
          const t = 1 - Math.min(1, Math.max(0, (d - 16) / 64));
          const goal = t * t * (3 - 2 * t);
          const k = j * CELLS + i;
          if (goal > progress[k]) {
            const step = Math.min(goal - progress[k], dt * 0.085); // slow enough to watch each block go down
            progress[k] += step;
            fresh += step;
          }
        }
      }
      toBytes();
      // The sky, the far hills and the mountain print as the paper under her feet does.
      const k = Math.min(CELLS - 1, Math.max(0, cj)) * CELLS + Math.min(CELLS - 1, Math.max(0, ci));
      uHere.value = Math.max(uHere.value, Math.min(progress[k], uHere.value + dt * 0.07));

      // The mountain is on every horizon.
      if (!started) {
        fujiTurn = yaw + 0.2;
        started = true;
      }
      // It never moves while she can see it. Once she has turned until it is out of sight, it is
      // quietly set down again just past the edge she is turning towards, so it comes into view
      // from there as any mountain would.
      const off = Math.atan2(Math.sin(fujiTurn - yaw), Math.cos(fujiTurn - yaw));
      const hidden = halfView + 0.42; // half the view, plus half the mountain's own width
      if (Math.abs(off) > hidden + 0.04) fujiTurn = yaw - Math.sign(off) * (hidden + 0.02);
      const data = rowsOf(L.fuji);
      data.array[0] = eye.x + Math.sin(fujiTurn) * 320;
      data.array[2] = eye.z - Math.cos(fujiTurn) * 320;
      data.needsUpdate = true;
      return fresh;
    },
    save() {
      toBytes();
      let text = '';
      for (let i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
      return btoa(text);
    },
    load(dataText) {
      try {
        const text = atob(dataText);
        if (text.length !== progress.length) return;
        for (let i = 0; i < progress.length; i++) progress[i] = text.charCodeAt(i) / 255;
        toBytes();
      } catch {
        // a sheet that cannot be read is simply left blank
      }
    },
    clear() {
      progress.fill(0);
      uHere.value = 0;
      toBytes();
      viewpoints.forEach((v, i) => {
        v.found = false;
        const d = rowsOf(L.seal);
        d.array[sealRows[i] * 8 + 4] = 1.5;
        d.array[sealRows[i] * 8 + 3] = 1.5 * L.seal.art.aspect;
        d.needsUpdate = true;
      });
    },
    collect(index) {
      viewpoints[index].found = true;
      const d = rowsOf(L.seal);
      d.array[sealRows[index] * 8 + 3] = 0;
      d.array[sealRows[index] * 8 + 4] = 0;
      d.needsUpdate = true;
    },
  };
}
