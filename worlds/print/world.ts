import * as THREE from 'three';
import * as art from './art';

/**
 * The Printer's World. A sheet of cream paper on which a landscape prints
 * itself in front of whoever walks through it: first the outlines, drawn
 * across each thing from its top corner; then the pale washes; then deep
 * blue; then the warm colours. Each colour arrives in streaks, as if rubbed
 * on by hand. What has been looked at stays printed; turn away from
 * something half done and it waits.
 *
 * Everything is a flat cut-out standing at its own depth, turned to face the
 * viewer, like the flats of a paper theatre.
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

// The drum bridge: where the east road crosses the river. It is a real hump she can walk over.
const BRIDGE_Z = 5.4;
const BRIDGE_X = riverX(BRIDGE_Z);
const BRIDGE_HALF = 18;
const BRIDGE_TALL = 14.6; // the height of its side pieces; the arch itself rises a little over half that
const BRIDGE_RISE = (300 / 560) * BRIDGE_TALL;
/** How far the bridge lifts whoever stands at this spot. */
export function bridgeLift(x: number, z: number): number {
  const along = (x - BRIDGE_X + BRIDGE_HALF) / (BRIDGE_HALF * 2);
  if (along <= 0 || along >= 1) return 0;
  const across = 1 - Math.min(1, Math.max(0, (Math.abs(z - BRIDGE_Z) - 2.4) / 1.2));
  return Math.sin(along * Math.PI) * BRIDGE_RISE * across;
}

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
  // The marks of the printer's pad: long slanting streaks. Added to how far along a spot is, they
  // make each colour arrive stroke by stroke instead of all at once.
  float rubbed(vec2 at) { return noise(vec2(dot(at, vec2(0.8, 0.6)) * 0.3, dot(at, vec2(-0.6, 0.8)) * 4.5)) - 0.5; }
  // The paper itself: cream, with long fibres and a faint mottle.
  vec3 washi(vec3 paper, vec2 at) {
    float fibre = noise(vec2(at.x * 0.6, at.y * 14.0)) * 0.5 + noise(at * 5.0) * 0.5;
    return paper * (0.955 + 0.07 * fibre);
  }
`;

interface LayerOptions {
  /** A boat's rocking: how far it tips. */
  rock?: number;
  /** Something that travels: how far it goes in one crossing, and how many seconds that takes. */
  drift?: [number, number, number];
  period?: number;
}
interface Layer {
  art: art.Art;
  rows: number[]; // x, y, z, width, height, flip, far, fixed
  options: LayerOptions;
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
  /**
   * Moves the printing on. `halfView` is half the width of what she can see, as an angle: only
   * what is in view prints. Returns how much new printing happened this frame, for the sound.
   */
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
  const uFwd = { value: new THREE.Vector3(0, 0, -1) };
  const uPaper = { value: PAPER };
  const uLine = { value: LINE };
  /** How far the sheet has printed at a spot, as written in a shader. */
  const printedAt = (spot: string) => `texture2D(uField, ${spot} / ${WORLD.toFixed(1)} + 0.5).r`;

  // ---- The ground.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: { uField, uTime, uPaper, uLine, uFwd },
      vertexShader: `varying vec3 vW; void main() { vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uField;
        uniform float uTime;
        uniform vec3 uPaper;
        uniform vec3 uLine;
        uniform vec3 uFwd;
        varying vec3 vW;
        ${NOISE}
        float riverX(float z) { return 55.0 + 18.0 * sin(z * 0.025); }
        // A line of even width on the screen, however near: 1 on the line, 0 off it.
        float ruled(float d, float wide) { return 1.0 - smoothstep(0.0, max(fwidth(d) * wide, 0.004), abs(d)); }
        void main() {
          vec2 w = vW.xz;
          float seen = distance(vW, cameraPosition);
          float p = ${printedAt('w')} * 1.2 + rubbed(w) * 0.2 - 0.06;
          vec4 on = plates(p);
          // Underfoot the paper is evenly mottled; long fibres would streak away to the horizon.
          vec3 paper = uPaper * (0.96 + 0.06 * noise(w * 1.7) + 0.02 * noise(w * 9.0));
          vec3 c = paper;

          float shoreD = w.y - (95.0 + 10.0 * sin(w.x * 0.03) + 5.0 * sin(w.x * 0.11));
          float sea = smoothstep(-0.4, 0.4, shoreD);
          float off = w.x - riverX(w.y); // how far across the river, from its middle
          float river = (1.0 - smoothstep(5.8, 6.4, abs(off))) * step(-175.0, w.y) * (1.0 - sea);
          float water = max(sea, river);
          float land = 1.0 - water;

          // The roads: a ring round the middle and two that cross it, the pink of trodden earth.
          float ring = abs(length(w) - 62.0 - 6.0 * sin(atan(w.y, w.x) * 3.0));
          float roadD = min(ring, min(abs(w.x - 8.0 * sin(w.y * 0.04)), abs(w.y - 6.0 * sin(w.x * 0.035))));
          float road = (1.0 - smoothstep(1.7, 2.1, roadD)) * land;

          // Terraced fields to the west: bands of straw yellow and young green.
          float west = smoothstep(-52.0, -72.0, w.x) * (1.0 - smoothstep(70.0, 92.0, abs(w.y)));
          float terrace = w.y * 0.2 + sin(w.x * 0.05) * 1.6;
          float even = mod(floor(terrace), 2.0);

          // The open land is not painted as ground at all. It is laid in flat strips, one behind
          // another, each a wash that is strongest along its far edge and fades to bare paper
          // towards the viewer: the way distance is built up in the prints.
          float deep = max(dot(vW - cameraPosition, uFwd), 0.01);
          float rank = log(max(deep, 5.0) / 7.0) / log(1.6);
          float strip = floor(rank);
          float up = fract(rank);
          float kind = mod(strip, 3.0);
          vec3 tint = kind < 0.5 ? vec3(0.66, 0.80, 0.74) : kind < 1.5 ? vec3(0.76, 0.85, 0.86) : vec3(0.84, 0.86, 0.70);
          float open = land * (1.0 - west) * (1.0 - road);
          c = mix(c, tint, on.y * open * pow(up, 1.6) * 0.85);

          // Water. The sea: a pale wash, long dark bands, and deep blue further out.
          c = mix(c, vec3(0.71, 0.83, 0.87), on.y * water);
          float bands = smoothstep(0.52, 0.7, noise(vec2(w.x * 0.03 + uTime * 0.015, w.y * 0.33)));
          c = mix(c, vec3(0.09, 0.25, 0.48), on.z * sea * clamp(bands * 0.8 + smoothstep(18.0, 80.0, shoreD), 0.0, 0.92));
          // The river: deep down its middle, pale at the banks.
          c = mix(c, vec3(0.09, 0.25, 0.48), on.z * river * smoothstep(5.0, 1.0, abs(off)) * 0.85);

          // The warm colours: the fields (yellow first, with blue printed over it to make the green) and the roads.
          float field = west * land * (1.0 - road);
          c = mix(c, vec3(0.93, 0.85, 0.57), on.y * field * 0.9);
          c = mix(c, vec3(0.70, 0.80, 0.53), on.z * field * even * 0.9);
          c = mix(c, vec3(0.90, 0.75, 0.66), on.w * road * 0.9);

          // The key block.
          float near = 1.0 - smoothstep(30.0, 90.0, seen);
          // Clustered dabs over the nearest ground, as on his hillsides.
          vec2 cell = w * vec2(2.6, 1.5);
          vec2 id = floor(cell);
          vec2 jig = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
          vec2 d = (fract(cell) - 0.5 - jig * 0.6) * vec2(1.6, 0.9);
          float dots = step(1.0 - 0.45 * smoothstep(0.45, 0.8, noise(w * 0.07 + 7.0)), hash(id)) * smoothstep(0.16, 0.08, length(d)) * open * near * 0.6;
          // The far edge of every other strip is ruled.
          float rule = ruled(min(up, 1.0 - up), 1.2) * step(0.5, mod(strip, 2.0)) * open * 0.45;
          // The sea: long broken lines lying across it.
          float row = w.y * 0.5;
          float swell = ruled(fract(row + 0.14 * sin(w.x * 0.2 + floor(row) * 1.7)) - 0.5, 1.5) * step(0.42, hash(vec2(floor(w.x * 0.06 + floor(row) * 0.41), floor(row)))) * sea;
          // The river: lines that follow its banks, in dashes that move downstream a step at a time.
          float lane = off * 0.8;
          float current = ruled(fract(lane) - 0.5, 1.5) * step(0.45, hash(vec2(floor(w.y * 0.09 - floor(uTime * 2.0) * 0.12 + floor(lane) * 0.37), floor(lane)))) * river;
          // Edges: the shore, both banks (each drawn twice, as a bank has a top and a foot), the road sides, the terrace walls.
          float bank = ruled(shoreD, 1.6) + (ruled(abs(off) - 6.1, 1.6) + ruled(abs(off) - 6.9, 1.1) * 0.6) * step(-175.0, w.y) * (1.0 - sea);
          float verge = ruled(roadD - 1.9, 1.3) * land;
          float wall = ruled(min(fract(terrace), 1.0 - fract(terrace)), 1.3) * field;
          float line = clamp(dots + rule + (swell + current) * 0.8 * near + bank + verge * 0.8 + wall, 0.0, 1.0);
          c = mix(c, uLine, line * on.x * 0.88);

          // Far off, everything pales towards the paper.
          c = mix(c, paper, smoothstep(110.0, 330.0, seen) * 0.8);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  scene.add(ground);

  // ---- The sky: bare paper, deep blue pressed along the top, and different weather in each quarter.
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
          vec4 on = plates(uHere * 1.15 + rubbed(vec2(turn * 60.0, d.y * 90.0)) * 0.18 - 0.05);
          vec3 paper = washi(uPaper, vec2(turn * 40.0, d.y * 60.0));
          vec3 c = paper;
          float south = 0.5 + 0.5 * cos(turn - 1.5708);
          float north = 0.5 + 0.5 * cos(turn + 1.5708);
          float west = 0.5 + 0.5 * cos(turn - 3.1416);
          // The blue is wiped onto the block and fades as it comes down: darkest at the very top.
          float streak = 0.92 + 0.12 * noise(vec2(turn * 3.0, d.y * 260.0));
          // Flat clouds of bare paper lie in it. To the south they are a whole sky of small ranked
          // clouds, as over the red mountain; elsewhere a few long ones.
          float ranks = noise(vec2(turn * 7.0, d.y * 46.0)) * 0.7 + noise(vec2(turn * 19.0, d.y * 120.0)) * 0.3;
          float cloud = smoothstep(0.5, 0.56, ranks + south * south * 0.1) * smoothstep(mix(0.42, 0.62, south), 0.2, d.y);
          c = mix(c, vec3(0.62, 0.77, 0.85), on.y * smoothstep(0.07, 0.3, d.y) * 0.7 * (1.0 - cloud));
          c = mix(c, vec3(0.09, 0.25, 0.48) * streak, on.z * smoothstep(0.2, 0.44, d.y) * 0.95 * (1.0 - cloud));
          // North, over the pines: a low grey sky with snow in it.
          c = mix(c, vec3(0.60, 0.66, 0.72), on.y * north * north * smoothstep(0.0, 0.08, d.y) * (1.0 - smoothstep(0.1, 0.36, d.y)) * 0.75);
          // West, over the fields: the pink of evening along the horizon.
          c = mix(c, vec3(0.93, 0.66, 0.56), on.w * smoothstep(0.24, 0.0, d.y) * step(0.0, d.y) * west * west * 0.8);
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
  const layer = (name: string, picture: () => art.Art, options: LayerOptions = {}): Layer => {
    let l = layers.get(name);
    if (!l) layers.set(name, (l = { art: picture(), rows: [], options }));
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
    fuji: layer('fuji', () => art.fuji(0)),
    redFuji: layer('redFuji', () => art.fuji(1)),
    ridges: [layer('ridge1', () => art.ridge(1)), layer('ridge2', () => art.ridge(2))],
    hills: [layer('hill1', () => art.hill(1, 0)), layer('hill2', () => art.hill(2, 1)), layer('hill3', () => art.hill(3, 2)), layer('hill4', () => art.hill(4, 0))],
    pines: [1, 2, 3, 4].map((n) => layer('pine' + n, () => art.pine(n))),
    groves: [1, 2, 3].map((n) => layer('grove' + n, () => art.grove(n))),
    huts: [0, 1, 2].map((n) => layer('hut' + n, () => art.hut(n))),
    bridge: layer('bridge', art.bridge),
    people: [0, 1, 2, 3, 4, 5, 7, 8].map((n) => layer('people' + n, () => art.travellers(n))),
    chair: layer('chair', art.palanquin),
    horse: layer('horse', () => art.packhorse(0)),
    rider: layer('rider', () => art.packhorse(1)),
    boats: [0, 1].map((n) => layer('boat' + n, () => art.boat(n), { rock: 0.035 })),
    mists: [1, 2].map((n) => layer('mist' + n, () => art.mist(n))),
    waves: [1, 2].map((n) => layer('waves' + n, () => art.waves(n), { rock: 0.02 })),
    falls: layer('falls', art.falls),
    rocks: [1, 2].map((n) => layer('rocks' + n, () => art.rocks(n))),
    reeds: [1, 2].map((n) => layer('reeds' + n, () => art.reeds(n))),
    sheaves: layer('sheaves', art.sheaves),
    cranes: layer('cranes', art.cranes),
    birds: layer('birds', art.birds, { drift: [150, 0, 40], period: 70 }),
    blown: layer('blown', art.windblown, { drift: [70, 3, 24], period: 16, rock: 0.3 }),
    tub: layer('tub', art.tub),
    gate: layer('gate', art.gate),
    cedar: layer('cedar', art.cedar),
    lantern: layer('lantern', art.lantern),
    seal: layer('seal', art.seal),
  };

  // The mountain stands still, as mountains do, and is seen twice: far to the north beyond the
  // pines, white and blue; and to the south across the sea, red in the morning with a storm at
  // its foot. They are opposite each other, so the two are never seen together.
  const NORTH: [number, number] = [30, -560];
  const SOUTH: [number, number] = [-40, 600];
  put(L.fuji, NORTH[0], NORTH[1], 170, { far: true, y: -20 });
  put(L.redFuji, SOUTH[0], SOUTH[1], 170, { far: true, y: -20, flip: true });
  /** A spot `far` units from (x, z) on the way to one of the mountains, for standing something in the line of sight. */
  const toward = (x: number, z: number, peak: [number, number], far: number): [number, number] => {
    const d = Math.hypot(peak[0] - x, peak[1] - z);
    return [x + ((peak[0] - x) / d) * far, z + ((peak[1] - z) / d) * far];
  };

  // Far ranges all the way round.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.3;
    put(pick(L.ridges), Math.cos(a) * 250, Math.sin(a) * 250, 30 + rnd() * 16, { far: true, y: -3, flip: rnd() < 0.5 });
  }
  // The big hills stand just beyond where she can walk; low knolls lie among the roads.
  for (let i = 0; i < 64; i++) {
    const [x, z] = around(REACH + 12, REACH + 60);
    if (z > shoreZ(x) - 14) continue;
    put(pick(L.hills), x, z, 13 + rnd() * 15, { flip: rnd() < 0.5, y: -0.6, far: true });
  }
  for (let i = 0; i < 40; i++) {
    const [x, z] = onLand(50, 175, 8);
    put(pick(L.hills), x, z, 3.5 + rnd() * 3.5, { flip: rnd() < 0.5, y: -0.3 });
  }
  // Mist lying in bands across the middle distance.
  for (let i = 0; i < 46; i++) {
    const [x, z] = around(60, 200);
    put(pick(L.mists), x, z, 3 + rnd() * 2.6, { y: 1 + rnd() * 6, flip: rnd() < 0.5 });
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
  // The bridge's two sides. Unlike everything else they keep their own direction, lying along
  // the road, so that walking up to it the rails run away on either hand, and from the river
  // bank the whole arch is seen side on.
  for (const side of [-1, 1]) put(L.bridge, BRIDGE_X, BRIDGE_Z + side * 2.6, BRIDGE_TALL, { fixed: true, y: -((560 - 430) / 560) * BRIDGE_TALL, flip: side > 0 });
  // People on the roads.
  for (let i = 0; i < 64; i++) {
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
    if (isWater(x, z) || Math.hypot(x, z) < 6 || Math.abs(x - BRIDGE_X) < BRIDGE_HALF + 3) continue;
    const kind = rnd();
    if (kind < 0.07) put(L.chair, x, z, 3.6, { flip: rnd() < 0.5 });
    else if (kind < 0.15) put(L.rider, x, z, 4.6, { flip: rnd() < 0.5 });
    else put(pick(L.people), x, z, 2.9 + rnd() * 0.5, { flip: rnd() < 0.5 });
  }
  // The fields to the west: sheaves drying, packhorses carrying the harvest in, and a gust taking someone's papers.
  for (let i = 0; i < 34; i++) put(L.sheaves, -70 - rnd() * 100, -70 + rnd() * 140, 2.4 + rnd() * 0.8, { flip: rnd() < 0.5 });
  for (let i = 0; i < 8; i++) put(L.horse, -66 - rnd() * 90, 6 * Math.sin((-66 - i * 12) * 0.035) + (rnd() - 0.5) * 50, 4.4, { flip: rnd() < 0.5 });
  for (let i = 0; i < 7; i++) put(L.blown, -150 + rnd() * 60, -50 + rnd() * 90, 3 + rnd() * 2, { y: 2 + rnd() * 5 });
  // The sea to the south: rows of waves, boats working, cranes and reeds along the shore.
  for (let i = 0; i < 40; i++) {
    const x = -200 + rnd() * 400;
    put(pick(L.waves), x, shoreZ(x) + 8 + rnd() * rnd() * 110, 4.5 + rnd() * 4.5, { flip: rnd() < 0.3, y: -0.4 });
  }
  for (let i = 0; i < 12; i++) {
    const x = -170 + rnd() * 340;
    put(pick(L.boats), x, shoreZ(x) + 12 + rnd() * 60, 3.4 + rnd(), { flip: rnd() < 0.5, y: 0.1 });
  }
  for (let i = 0; i < 6; i++) {
    const z = -150 + i * 40 + rnd() * 16;
    if (Math.abs(z - BRIDGE_Z) < 8) continue;
    put(L.boats[0], riverX(z), z, 2.6, { flip: rnd() < 0.5, y: 0.1 });
  }
  // Along the river: reeds on both banks its whole length, and rocks where it bends.
  for (let i = 0; i < 110; i++) {
    const shoreline = i < 44;
    const x = shoreline ? -190 + rnd() * 380 : 0;
    const z = shoreline ? shoreZ(x) - 1 - rnd() * 7 : -165 + rnd() * 250;
    put(pick(L.reeds), shoreline ? x : riverX(z) + (rnd() < 0.5 ? -8.4 : 8.4) + (rnd() - 0.5) * 2.4, z, 2.2 + rnd() * 2, { flip: rnd() < 0.5 });
  }
  for (let i = 0; i < 40; i++) {
    const sea = i < 26;
    const x = -180 + rnd() * 360;
    const z = -160 + rnd() * 240;
    if (sea) put(pick(L.rocks), x, shoreZ(x) + (rnd() - 0.3) * 8, 2.5 + rnd() * 4, { flip: rnd() < 0.5 });
    else put(pick(L.rocks), riverX(z) + (rnd() < 0.5 ? -7.6 : 7.6), z, 1.4 + rnd() * 1.6, { flip: rnd() < 0.5 });
  }
  for (let i = 0; i < 6; i++) {
    const x = -90 + rnd() * 70;
    put(L.cranes, x, shoreZ(x) - 3 - rnd() * 4, 3.4, { flip: rnd() < 0.5 });
  }
  // The falls, at the head of the river in the northern hills.
  put(L.falls, riverX(-176) - 2, -180, 50, { y: -1 });
  for (let i = 0; i < 10; i++) put(pick(L.rocks), riverX(-170) + (rnd() - 0.5) * 60, -168 + rnd() * 16, 5 + rnd() * 7, { flip: rnd() < 0.5 });
  // Birds crossing, high up.
  for (let i = 0; i < 12; i++) {
    const [x, z] = around(40, 190);
    put(L.birds, x, z, 7 + rnd() * 5, { y: 22 + rnd() * 26, flip: rnd() < 0.5 });
  }

  // Eight places where the view is worth stopping for, each marked by a stone lantern with a red
  // seal hung over it. At four of them something stands between the lantern and the mountain,
  // so that from the lantern the mountain is seen through it, as in the prints.
  const viewpoints: Viewpoint[] = [
    [5, -16], // the crossroads
    [54.6, 17.5], // the river bank: the northern mountain under the arch of the bridge
    [104, 26], // the village
    [27, 86], // the shore: the red mountain through the shrine gate
    [-58, 92], // the marsh, among the cranes
    [-112, 8], // the fields: the northern mountain through the cooper's tub
    [-70, -92], // the pine pass: the mountain beside the great cedar
    [28, -150], // the falls
  ].map(([x, z]) => ({ x, z, found: false }));
  put(L.gate, ...toward(27, 86, SOUTH, 13), 11, { y: -0.3 });
  put(L.tub, ...toward(-112, 8, NORTH, 9), 8.5, { y: -0.2 });
  put(L.cedar, -84, -108, 40, { y: -0.4 });
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
        side: THREE.DoubleSide,
        // Soft edges without having to draw the cut-outs back to front: each pixel is covered in part.
        alphaToCoverage: true,
        uniforms: {
          tColour: { value: texture(l.art.colour) },
          tLine: { value: texture(l.art.line) },
          uFrames: { value: l.art.frames },
          uRock: { value: l.options.rock ?? 0 },
          uDrift: { value: new THREE.Vector3(...(l.options.drift ?? [0, 0, 0])) },
          uPeriod: { value: l.options.period ?? 0 },
          uField,
          uHere,
          uRight,
          uPaper,
          uLine,
          uTime,
        },
        vertexShader: /* glsl */ `
          attribute vec3 aPos;
          attribute vec2 aSize;
          attribute vec3 aOpt;
          uniform vec3 uRight;
          uniform float uTime;
          uniform float uFrames;
          uniform float uRock;
          uniform vec3 uDrift;
          uniform float uPeriod;
          varying vec2 vUv;
          varying vec2 vOn;
          varying vec3 vW;
          varying vec3 vFoot;
          varying vec3 vOpt;
          varying float vWide;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          void main() {
            float own = hash(aPos.xz); // so that no two copies move in step
            vec3 foot = aPos;
            // Things that travel cross their stretch of sky or field and begin again.
            if (uPeriod > 0.0) foot += uDrift * (mod(uTime + own * uPeriod, uPeriod) / uPeriod - 0.5);
            // Nothing here moves smoothly. A boat tips from one held position to the next.
            float tip = uRock * floor(sin(uTime * 0.9 + own * 6.283) * 2.0 + 0.5) / 2.0;
            // Every flat faces the viewer squarely, except the few that keep a direction of their own.
            vec3 right = mix(uRight, vec3(1.0, 0.0, 0.0), aOpt.z);
            vW = foot + right * ((position.x + position.y * tip) * aSize.x) + vec3(0.0, position.y * aSize.y, 0.0);
            vFoot = foot;
            vOpt = aOpt;
            vWide = aSize.x;
            // A figure that walks is two drawings, swapped back and forth.
            float across = aOpt.x > 0.0 ? uv.x : 1.0 - uv.x;
            float frame = floor(mod(uTime * 1.6 + own * 2.0, uFrames));
            vUv = vec2((across + frame) / uFrames, uv.y);
            vOn = vec2(across, uv.y);
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
          varying vec2 vOn;
          varying vec3 vW;
          varying vec3 vFoot;
          varying vec3 vOpt;
          varying float vWide;
          ${NOISE}
          void main() {
            // The colour blocks sit a hair out of register with the outlines, as they do on a real print.
            vec4 ink = texture2D(tColour, vUv + vec2(0.0022, -0.0018));
            float key = texture2D(tLine, vUv).a;
            float there = max(ink.a, key);
            // Anything she walks right up to fades away, so no cut-out ever fills the view.
            float closeBy = mix(smoothstep(1.5 + vWide * 0.12, 4.0 + vWide * 0.25, distance(vFoot.xz, cameraPosition.xz)), 1.0, vOpt.z);

            // How far the ground it stands on has been printed.
            float p = mix(${printedAt('vFoot.xz')}, uHere, vOpt.y) * 1.3;
            // The outlines are drawn across each cut-out from its top corner, like a hand writing.
            float drawn = smoothstep(0.03, 0.07, p - vOn.x * 0.15 - (1.0 - vOn.y) * 0.12);
            // Each colour is then rubbed down in streaks, from one side to the other.
            vec4 on = plates(p - 0.1 - vOn.x * 0.08 + rubbed(vW.xy * 1.4 + vW.z) * 0.2);
            if (drawn < 0.02) discard;

            vec3 paper = washi(uPaper, vW.xy * 0.5 + vW.z);
            // Which block a colour belongs to: warm colours last, dark blues and greens before them, pale washes first.
            float warm = step(ink.b + 0.015, ink.r);
            float dark = step(dot(ink.rgb, vec3(0.3, 0.5, 0.2)), 0.45);
            float printed = mix(mix(on.y, on.z, dark), on.w, warm);
            // Ink rubbed on by hand is never quite even, and is darker for a moment where it has only just gone down.
            float uneven = 0.95 + 0.09 * noise(vec2(vW.x * 0.8 + vW.z, vW.y * 5.0));
            vec3 body = ink.rgb * uneven;
            vec3 c = mix(paper, body * (1.0 - 0.25 * printed * (1.0 - printed) * 4.0), printed);
            // Green is not an ink of its own: yellow goes down first, and blue is printed over it.
            float green = step(ink.r + 0.02, ink.g) * step(ink.b + 0.01, ink.g);
            c = mix(c, mix(mix(paper, vec3(0.93, 0.85, 0.56), on.y), body, on.z), green);
            c = mix(paper, c, step(0.5, ink.a));
            c = mix(c, uLine, key * drawn * 0.9);
            // Things far away are printed paler.
            c = mix(c, paper, smoothstep(60.0, 260.0, distance(vW, cameraPosition)) * 0.5 * (1.0 - vOpt.y));

            // Until its colour arrives, the inside of a shape is not there at all: only its outline is, and
            // whatever stands behind shows through.
            float filled = step(0.5, ink.a) * smoothstep(0.0, 0.3, mix(printed, on.y, green));
            // An outline standing by itself is pure line colour; its strength is in how much of the pixel it covers.
            c = mix(uLine, c, filled);
            float solid = there * closeBy * max(min(1.0, key * 1.5) * drawn, filled);
            float show = solid + (hash(gl_FragCoord.xy) - 0.5) * 0.18 * step(solid, 0.98);
            if (show < 0.06) discard;
            gl_FragColor = vec4(c, show);
          }`,
      }),
    );
    mesh.frustumCulled = false;
    l.mesh = mesh;
    scene.add(mesh);
  }
  const rowsOf = (l: Layer) => ((l.mesh!.geometry as THREE.InstancedBufferGeometry).getAttribute('aPos') as THREE.InterleavedBufferAttribute).data;

  // ---- The deck of the bridge: planks laid over the arch, between its two sides.
  {
    const steps = 28;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = BRIDGE_X - BRIDGE_HALF + (i / steps) * BRIDGE_HALF * 2;
      const y = Math.sin((i / steps) * Math.PI) * BRIDGE_RISE - 0.25;
      pos.push(x, y, BRIDGE_Z - 2.6, x, y, BRIDGE_Z + 2.6);
      if (i < steps) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    const deck = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: { uField, uPaper, uLine },
        vertexShader: `varying vec3 vW; void main() { vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D uField;
          uniform vec3 uPaper;
          uniform vec3 uLine;
          varying vec3 vW;
          ${NOISE}
          void main() {
            float p = ${printedAt('vW.xz')} * 1.2 + rubbed(vW.xz * 2.0) * 0.2 - 0.06;
            vec4 on = plates(p);
            vec3 paper = uPaper * (0.96 + 0.06 * noise(vW.xz * 1.7));
            // Boards laid across, each a little different, with the joins ruled between them.
            float board = vW.x * 1.1;
            vec3 c = mix(paper, mix(vec3(0.93, 0.84, 0.55), vec3(0.82, 0.68, 0.44), hash(vec2(floor(board), 1.0)) * 0.6), on.w);
            float joint = 1.0 - smoothstep(0.0, max(fwidth(board) * 1.3, 0.004), min(fract(board), 1.0 - fract(board)));
            c = mix(c, uLine, joint * on.x * 0.8);
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    );
    deck.frustumCulled = false;
    scene.add(deck);
  }

  // ---- Snow, falling over the pines to the north: flecks of bare paper, seen against anything printed.
  const uScale = { value: 600 };
  {
    const FLAKES = 2600;
    const where = new Float32Array(FLAKES * 3);
    for (let i = 0; i < FLAKES; i++) where.set([-170 + rnd() * 340, rnd() * 46, -200 + rnd() * 150], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(where, 3));
    const snow = new THREE.Points(
      geo,
      new THREE.ShaderMaterial({
        uniforms: { uTime, uField, uPaper, uScale },
        vertexShader: /* glsl */ `
          uniform float uTime;
          uniform float uScale;
          uniform sampler2D uField;
          varying float vShow;
          void main() {
            vec3 p = position;
            // It comes down in small steps, each flake swinging a little as it falls.
            float t = floor(uTime * 6.0) / 6.0;
            p.y = mod(p.y - t * (1.6 + fract(p.x * 7.3) * 1.4), 46.0);
            p.x += sin(t * 0.8 + position.z) * 1.2;
            vShow = smoothstep(0.3, 0.5, ${printedAt('p.xz')}) * smoothstep(-52.0, -84.0, p.z);
            vec4 mv = viewMatrix * vec4(p, 1.0);
            gl_PointSize = uScale * (0.16 + 0.14 * fract(p.z * 3.7)) / -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uPaper;
          varying float vShow;
          void main() {
            if (vShow < 0.5 || length(gl_PointCoord - 0.5) > 0.5) discard;
            gl_FragColor = vec4(uPaper * 1.03, 1.0);
          }`,
      }),
    );
    snow.frustumCulled = false;
    scene.add(snow);
  }

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
      uFwd.value.set(Math.sin(yaw), 0, -Math.cos(yaw));
      uScale.value = window.innerHeight;
      sky.position.copy(eye);

      // Print the land she is looking at.
      const cell = WORLD / CELLS;
      const ci = Math.floor((eye.x + WORLD / 2) / cell);
      const cj = Math.floor((eye.z + WORLD / 2) / cell);
      const RANGE = 175;
      const span = Math.ceil(RANGE / cell);
      let fresh = 0;
      // Only what she is looking at prints. Turn away and it waits, half done; turn back and it carries on.
      const fx = Math.sin(yaw);
      const fz = -Math.cos(yaw);
      const edge = Math.cos(Math.min(3.1, halfView + 0.35));
      for (let j = Math.max(0, cj - span); j <= Math.min(CELLS - 1, cj + span); j++) {
        for (let i = Math.max(0, ci - span); i <= Math.min(CELLS - 1, ci + span); i++) {
          const x = (i + 0.5) * cell - WORLD / 2;
          const z = (j + 0.5) * cell - WORLD / 2;
          const d = Math.hypot(x - eye.x, z - eye.z);
          if (d > RANGE) continue;
          if (d > 5 && ((x - eye.x) * fx + (z - eye.z) * fz) / d < edge) continue;
          const k = j * CELLS + i;
          if (progress[k] >= 1) continue;
          // Everything in view prints right through to the last colour. What is near goes quickly and
          // what is far takes its time, so there is always something still arriving further off.
          const far = Math.min(1, Math.max(0, (d - 14) / (RANGE - 14)));
          const step = Math.min(1 - progress[k], dt * 0.075 * (1 - 0.8 * Math.sqrt(far)));
          progress[k] += step;
          fresh += step;
        }
      }
      toBytes();
      // The sky, the far hills and the mountains print as the paper under her feet does.
      const here = Math.min(CELLS - 1, Math.max(0, cj)) * CELLS + Math.min(CELLS - 1, Math.max(0, ci));
      uHere.value = Math.max(uHere.value, Math.min(progress[here], uHere.value + dt * 0.06));
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
