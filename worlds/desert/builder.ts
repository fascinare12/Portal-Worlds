import * as THREE from 'three';
import { Finish } from '../../src/finish';
import { fbm, lerp, smoothstep } from '../../src/noise';
import { sunAt } from '../../src/world/daylight';
import { buildSphinx } from '../../src/world/creatures/sphinxModel';
import { paint } from '../../src/world/paint';
import { faceFor, shapeFor } from './blocks';
import { figuresFor } from './figures';
import type { Figure } from './figures';
import { HEIGHT, PLOT } from './modes';
import type { Cell, Mode, Setting } from './modes';
import { sound } from './sound';

/**
 * The building site: a square plot in the desert where blocks are placed on a
 * grid, a camera that swings all the way round it, and the sphinx that paces
 * the edge. This file knows nothing about maths; it only reports what the
 * builder tried to do (place a block they have none of, finish a blueprint,
 * meet the sphinx) and leaves the rest to main.ts.
 */

export interface BuildSave {
  /** Placed blocks as [x, y, z, block type]. */
  blocks: [number, number, number, number][];
  /** How many of each block type are waiting to be placed. */
  stock: number[];
  /** The blueprint has been completed at least once. */
  done: boolean;
  /** How wide the plot was when this was saved, so older builds can be re-centred on a bigger one. */
  plot?: number;
}

export interface BuilderEvents {
  /** The child tried to place a block type they have run out of. */
  needBlocks(type: number): void;
  /** Something was placed or removed. */
  changed(): void;
  /** The last block of the blueprint went in. */
  finished(): void;
  /** The sphinx has caught the child. */
  sphinx(): void;
  /** The child tapped the pool that leads home. */
  home(): void;
}

const HALF = PLOT / 2;
const SUN = new THREE.Vector3(0.5, 0.62, -0.6).normalize();

// A placed block is stored as its type plus which way it was turned (0-3 quarter turns).
const TURN = 64;
const typeOf = (v: number) => v % TURN;
const turnOf = (v: number) => Math.floor(v / TURN);
const SPARKS = 900;
const POOL = new THREE.Vector3(-(HALF + 5), 0.04, -(HALF + 5));
const POOL_RADIUS = 2.6;
const SPHINX_RING = HALF * 1.42 + 4; // just outside the corners of the plot

const MAX_DIST = PLOT * 2.6;

const keyOf = (x: number, y: number, z: number) => x + z * PLOT + y * PLOT * PLOT;
const centre = (x: number, y: number, z: number, out: THREE.Vector3) => out.set(x - HALF + 0.5, y + 0.5, z - HALF + 0.5);

/** Everything beyond this distance from the middle may rise, fall or grow trees; inside it is level. */
const LEVEL = HALF * 1.42 + 14;

interface Look {
  skyLow: number;
  skyHigh: number;
  /** Colour of light bouncing up off the ground. */
  bounce: number;
  ground: [number, number];
  paving: [string, string];
  line: string;
}

const LOOKS: Record<Setting, Look> = {
  desert: { skyLow: 0xf6e2b8, skyHigh: 0x7fb6e6, bounce: 0xc99a5a, ground: [0xd9b06c, 0xf0d49a], paving: ['#e9cf9c', '#e2c48c'], line: 'rgba(120, 90, 50, 0.35)' },
  forest: { skyLow: 0xd6ecd0, skyHigh: 0x78b4ea, bounce: 0x5f8a4a, ground: [0x4f8f48, 0x86bb5c], paving: ['#9ccb78', '#90c16e'], line: 'rgba(40, 80, 30, 0.35)' },
  coast: { skyLow: 0xe2f1f4, skyHigh: 0x57a4e8, bounce: 0xbfae84, ground: [0xe0c890, 0xf4e4b8], paving: ['#d3d7da', '#c6cace'], line: 'rgba(70, 80, 90, 0.4)' },
};

/** The lie of the land around the plot: dunes in the desert, hills in the forest, a shore on the coast. */
function landHeight(setting: Setting, x: number, z: number): number {
  const d = Math.hypot(x, z);
  const out = smoothstep(LEVEL, LEVEL + 60, d);
  if (setting === 'forest') return Math.max(0, fbm(x * 0.015 + 9, z * 0.015 + 9, 3) * 20 - 6) * out;
  const dunes = Math.max(0, fbm(x * 0.012 + 5, z * 0.012 + 5, 3) * 30 - 8) + Math.sin(x * 0.05 + z * 0.03) * 1.5;
  if (setting === 'desert') return dunes * out;
  // Coast: low dunes inland, and the beach running down into the sea on one side.
  const sea = smoothstep(LEVEL - 4, LEVEL + 40, x);
  return dunes * 0.25 * out * (1 - sea) - sea * 7;
}

export class Builder {
  /** The block type that a tap places. */
  selected = 0;
  /** When on, a tap removes a block and gives it back. */
  erasing = false;
  stock: number[] = [];

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.3, 700);
  private finish: Finish;
  private ray = new THREE.Raycaster();

  private mode: Mode | null = null;
  private blocks = new Map<number, number>();
  private meshes: THREE.InstancedMesh[] = [];
  private meshKeys: number[][] = [];
  private plot: THREE.Mesh;
  private skyLow = new THREE.Color();
  private skyHigh = new THREE.Color();
  private fog = new THREE.FogExp2(0xffffff, 0.004);
  private bounce = new THREE.HemisphereLight(0xfff1d0, 0xc99a5a, 1.05);
  private land = new THREE.Group();
  /** Everything that has been built, as one group, so the rocket can lift off whole. */
  private built = new THREE.Group();
  private sun = new THREE.DirectionalLight(0xfff0cf, 1.75);
  private look0: Look = LOOKS.desert;
  private sunClock = 0;
  private sea: THREE.Mesh | null = null;
  private boat: THREE.Group | null = null;
  private birds: { group: THREE.Group; wings: THREE.Mesh[]; angle: number; ring: number; height: number; speed: number }[] = [];
  private glowing: THREE.MeshToonMaterial[] = [];
  /** Blocks that have just been set down and are still springing into place. */
  private pops = new Map<number, number>();
  // Sparks: dust from a block landing, fireworks, rocket flame.
  private sparkPos = new Float32Array(SPARKS * 3);
  private sparkVel = new Float32Array(SPARKS * 3);
  private sparkCol = new Float32Array(SPARKS * 3);
  private sparkLife = new Float32Array(SPARKS);
  private sparkNext = 0;
  private sparks: THREE.Points;
  /** Seconds into the celebration for a finished blueprint; -1 when there is none. */
  private party = -1;
  private partyBoom = 0;
  private sweep = 0;
  private sitClock = 30;
  private sitting = 0;
  private stand = 1;
  private nod = 0;
  private headTurn = 0;
  /** Whoever came out when the blueprint was finished, walking round the building. */
  private visitors: { figure: Figure; angle: number; ring: number; out: number }[] = [];
  private setting: Setting | null = null;
  private pool: THREE.Mesh;
  private poolTime = { value: 0 };

  private plan: Cell[] = [];
  private planOn = false;
  private done = false;
  private ghost: THREE.InstancedMesh;
  private ghostCells: Cell[] = [];

  // Camera: swings round the middle of the plot.
  private yaw = 0.7;
  private pitch = 0.55;
  private dist = 42;
  private goal = { yaw: 0.7, pitch: 0.7, dist: 42 };
  private look = new THREE.Vector3(0, 2.5, 0);
  /** The spot on the plot the camera swings round; two fingers (or shift-drag) slide it about. */
  private focus = new THREE.Vector3(0, 2.5, 0);

  private sphinx = buildSphinx();
  private sphinxAngle = 0;
  private sphinxStride = 0;
  private sphinxRest = 20; // seconds before it will catch anyone
  private caught = false;
  private life = 0;
  /** While false, taps on the site do nothing (a panel is open over it). */
  enabled = true;

  constructor(
    private canvas: HTMLCanvasElement,
    private events: BuilderEvents,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.finish = new Finish(this.renderer);

    const { scene } = this;
    scene.fog = this.fog;
    scene.add(this.bounce);
    // The sun casts shadows across the plot, so buildings sit on the ground instead of floating.
    this.renderer.shadowMap.enabled = !new URLSearchParams(window.location.search).has('noshadow');
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const { sun } = this;
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const reach = HALF * 1.42 + 6;
    Object.assign(sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 300 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
    scene.add(sun, sun.target, this.built);

    const sparkGeo = new THREE.BufferGeometry();
    this.sparkPos.fill(-999);
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPos, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkCol, 3));
    this.sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ size: 0.45, vertexColors: true, transparent: true, depthWrite: false }));
    this.sparks.frustumCulled = false;
    scene.add(this.sparks);

    // A few birds wheeling overhead.
    const wing = new THREE.PlaneGeometry(0.9, 0.38).translate(0.45, 0, 0);
    for (let i = 0; i < 7; i++) {
      const group = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
      const left = new THREE.Mesh(wing, mat);
      const right = new THREE.Mesh(wing, mat);
      left.rotation.x = right.rotation.x = -Math.PI / 2;
      right.scale.x = -1;
      group.add(left, right);
      scene.add(group);
      this.birds.push({ group, wings: [left, right], angle: i * 0.9, ring: 26 + i * 5, height: 13 + (i % 3) * 4, speed: 5 + (i % 4) });
    }

    // Sky. Its colours change with the setting.
    scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(500, 32, 16),
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          depthWrite: false,
          uniforms: { uLow: { value: this.skyLow }, uHigh: { value: this.skyHigh }, uSun: { value: SUN } },
          vertexShader: `varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `
            uniform vec3 uLow; uniform vec3 uHigh; uniform vec3 uSun; varying vec3 vDir;
            void main() {
              vec3 d = normalize(vDir);
              vec3 col = mix(uLow, uHigh, smoothstep(0.0, 0.5, d.y));
              float toSun = max(dot(d, uSun), 0.0);
              col += vec3(1.0, 0.92, 0.7) * (pow(toSun, 8.0) * 0.3 + smoothstep(0.9985, 0.9992, toSun) * 2.5);
              gl_FragColor = vec4(col, 1.0);
            }`,
        }),
      ),
    );

    // The plot, with the grid marked out so every block has an obvious place.
    this.plot = new THREE.Mesh(new THREE.PlaneGeometry(PLOT, PLOT), new THREE.MeshLambertMaterial());
    this.plot.rotation.x = -Math.PI / 2;
    this.plot.position.y = 0.02;
    this.plot.receiveShadow = true;
    scene.add(this.plot);

    // The pool home: green and swirling, the colour of the wood on the other side.
    this.pool = new THREE.Mesh(
      new THREE.CircleGeometry(POOL_RADIUS, 40),
      new THREE.ShaderMaterial({
        uniforms: { uTime: this.poolTime },
        vertexShader: `varying vec2 vPos; void main() { vPos = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform float uTime; varying vec2 vPos;
          void main() {
            float r = length(vPos) / ${POOL_RADIUS.toFixed(1)};
            float arms = sin(atan(vPos.y, vPos.x) * 3.0 + r * 5.5 - uTime * 1.1) * 0.5 + 0.5;
            float heart = smoothstep(1.3, 0.0, r);
            vec3 wood = vec3(0.42, 0.72, 0.46);
            vec3 col = mix(wood * 0.7, mix(wood, vec3(1.0), 0.7), heart * heart);
            col = mix(col, mix(wood, vec3(1.0), 0.5), arms * 0.45);
            gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
          }`,
      }),
    );
    this.pool.rotation.x = -Math.PI / 2;
    this.pool.position.copy(POOL);
    scene.add(this.pool);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(POOL_RADIUS + 0.25, 0.3, 6, 20),
      new THREE.MeshLambertMaterial({ color: 0xcfa66a }),
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.copy(POOL);
    scene.add(rim);

    // Outlines of the blocks still to place when following a blueprint.
    this.ghost = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.94, 0.94, 0.94),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false }),
      PLOT * PLOT * HEIGHT,
    );
    this.ghost.count = 0;
    scene.add(this.ghost);

    this.sphinx.group.scale.setScalar(1.7);
    this.sphinx.group.traverse((o) => (o.castShadow = true));
    scene.add(this.sphinx.group);

    this.listen();
    window.addEventListener('resize', () => this.resize());
    this.resize();

    const clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.frame(Math.min(clock.getDelta(), 0.1)));
  }

  /** Puts the plot in its setting: desert, forest or coast. */
  private dress(setting: Setting): void {
    if (setting === this.setting) return;
    this.setting = setting;
    const look = LOOKS[setting];
    this.look0 = look;
    this.sunClock = 0; // re-tint the sky for the time of day
    this.sea = null;
    this.boat = null;
    this.skyLow.set(look.skyLow);
    this.skyHigh.set(look.skyHigh);
    this.fog.color.set(look.skyLow);
    this.bounce.groundColor.set(look.bounce);

    this.scene.remove(this.land);
    this.land.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.land = new THREE.Group();
    this.scene.add(this.land);

    // The ground.
    const geo = new THREE.PlaneGeometry(500, 500, 160, 160);
    geo.rotateX(-Math.PI / 2);
    const gp = geo.attributes.position;
    const gc = new Float32Array(gp.count * 3);
    const dark = new THREE.Color(look.ground[0]);
    const light = new THREE.Color(look.ground[1]);
    const wet = new THREE.Color(0xc9ae78);
    const tone = new THREE.Color();
    for (let i = 0; i < gp.count; i++) {
      const x = gp.getX(i);
      const z = gp.getZ(i);
      const y = landHeight(setting, x, z);
      gp.setY(i, y);
      tone.copy(dark).lerp(light, fbm(x * 0.05, z * 0.05, 3));
      if (setting === 'coast') tone.lerp(wet, smoothstep(-0.2, -1.2, y));
      gc.set([tone.r, tone.g, tone.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(gc, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    ground.receiveShadow = true;
    this.land.add(ground);

    // The sea, on the coast.
    if (setting === 'coast') {
      const sea = new THREE.Mesh(
        new THREE.PlaneGeometry(700, 700),
        new THREE.MeshLambertMaterial({ color: 0x3f9fd0, transparent: true, opacity: 0.86 }),
      );
      sea.rotation.x = -Math.PI / 2;
      sea.position.y = -1.1;
      this.land.add(sea);
      this.sea = sea;

      // A sailing boat out on the water.
      const boat = new THREE.Group();
      const wood = new THREE.MeshLambertMaterial({ color: 0x8a5a34 });
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 6), wood);
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6, 0.2), wood);
      mast.position.y = 3.4;
      const sail = new THREE.Mesh(
        new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0.8, 2.4, 0, 6.2, 0.2, 0, 0.8, -2.2], 3)),
        new THREE.MeshBasicMaterial({ color: 0xfdf6e3, side: THREE.DoubleSide }),
      );
      boat.add(hull, mast, sail);
      this.land.add(boat);
      this.boat = boat;
    }

    const feathers = setting === 'coast' ? 0xffffff : setting === 'forest' ? 0x4a3a2c : 0x2a2420;
    for (const b of this.birds) (b.wings[0].material as THREE.MeshBasicMaterial).color.set(feathers);

    // Small things right up to the edge of the plot, so the setting is in view while building:
    // rocks everywhere, bushes and flowers in the forest, cactus in the desert, shells on the coast.
    {
      let seed = 99;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      /** A spot beside the plot: off the paving, clear of the sphinx's path and the pool. */
      const beside = (): [number, number] => {
        for (;;) {
          const x = (rnd() * 2 - 1) * (LEVEL + 4);
          const z = (rnd() * 2 - 1) * (LEVEL + 4);
          const r = Math.hypot(x, z);
          if (Math.max(Math.abs(x), Math.abs(z)) < HALF + 1.3 || r > LEVEL + 4) continue;
          if (Math.abs(r - SPHINX_RING) < 2.4 || Math.hypot(x - POOL.x, z - POOL.z) < POOL_RADIUS + 2) continue;
          if (setting === 'coast' && x > LEVEL - 8) continue;
          return [x, z];
        }
      };
      const dummy = new THREE.Object3D();
      const tint = new THREE.Color();
      const scatter = (geo: THREE.BufferGeometry, n: number, colours: number[], size: [number, number], squash: number, lift = 0) => {
        const mesh = new THREE.InstancedMesh(geo, paint({ dab: 0.8 }), n);
        for (let i = 0; i < n; i++) {
          const [x, z] = beside();
          const k = size[0] + rnd() * (size[1] - size[0]);
          dummy.position.set(x, k * lift, z);
          dummy.rotation.set(0, rnd() * 6.28, 0);
          dummy.scale.set(k, k * squash, k);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          mesh.setColorAt(i, tint.set(colours[Math.floor(rnd() * colours.length)]));
        }
        mesh.castShadow = mesh.receiveShadow = true;
        this.land.add(mesh);
      };
      const lump = new THREE.IcosahedronGeometry(1, 0);
      const ball = new THREE.IcosahedronGeometry(1, 1);
      scatter(lump, 60, setting === 'forest' ? [0x8f978c, 0x7a8478] : [0xc9a878, 0xb8956a, 0xa88a66], [0.3, 0.9], 0.6, 0.2);
      if (setting === 'forest') {
        scatter(ball, 90, [0x3f8f4c, 0x57a653, 0x2f7a45], [0.6, 1.3], 0.75, 0.5);
        scatter(ball, 240, [0xffffff, 0xfff1a8, 0xf7b6d6, 0xbcd6ff, 0xd9485f], [0.1, 0.17], 1, 2);
      } else if (setting === 'desert') {
        // Cactus: a tall green post with a shorter one beside it.
        scatter(new THREE.CylinderGeometry(0.28, 0.32, 1, 7).translate(0, 0.5, 0), 26, [0x4f8a52, 0x5f9a5a], [1.2, 3], 1.6);
        scatter(new THREE.CylinderGeometry(0.22, 0.26, 1, 7).translate(1.5, 0.9, 0), 26, [0x4f8a52, 0x5f9a5a], [0.5, 1], 1.4);
      } else {
        scatter(ball, 70, [0xfdf6e3, 0xf7c9b0, 0xe6d6f2], [0.12, 0.22], 0.5, 0.4); // shells
      }
    }

    // Trees: a wood all round in the forest, a few palms inland on the coast.
    if (setting !== 'desert') {
      const palms = setting === 'coast';
      const near = palms ? 10 : 46; // these stand close beside the plot
      const count = (palms ? 26 : 260) + near;
      const bark = paint({ dab: 0.6 });
      const leaf = paint({ dab: 1.1 });
      const trunkGeo = new THREE.CylinderGeometry(palms ? 0.16 : 0.3, palms ? 0.3 : 0.6, 1, 7);
      trunkGeo.translate(0, 0.5, 0);
      const trunks = new THREE.InstancedMesh(trunkGeo, bark, count);
      const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), leaf, count * 2);
      const greens = palms ? [0x4f9a55, 0x62ab5a] : [0x2f7a45, 0x3f8f4c, 0x57a653, 0x7bb85a, 0x266a48];
      const dummy = new THREE.Object3D();
      const tint = new THREE.Color();
      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < count; i++) {
        let x = 0;
        let z = 0;
        // Outside the level ground; on the coast, only on the landward side.
        for (let tries = 0; tries < 30; tries++) {
          const a = rnd() * Math.PI * 2;
          const d = i < near ? HALF + 4 + rnd() * (LEVEL - HALF - 6) : LEVEL - 6 + Math.sqrt(rnd()) * (palms ? 40 : 95);
          x = Math.cos(a) * d;
          z = Math.sin(a) * d;
          // Close-in trees keep off the paving and out of the sphinx's way.
          if (i < near && (Math.max(Math.abs(x), Math.abs(z)) < HALF + 3.5 || Math.abs(d - SPHINX_RING) < 3.6)) continue;
          if (Math.hypot(x - POOL.x, z - POOL.z) > POOL_RADIUS + 4 && (!palms || x < LEVEL - 12)) break;
        }
        const y = landHeight(setting, x, z) - 0.2;
        const h = palms ? 6 + rnd() * 4 : 5 + rnd() * 6;
        const r = palms ? 2.6 + rnd() : 2.6 + rnd() * 2.2;
        dummy.position.set(x, y, z);
        dummy.rotation.set((rnd() - 0.5) * (palms ? 0.35 : 0.08), rnd() * 6.28, (rnd() - 0.5) * (palms ? 0.35 : 0.08));
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);
        trunks.setColorAt(i, tint.set(palms ? 0xa8875a : rnd() < 0.5 ? 0x6a4a36 : 0x7a5a44));
        for (let c = 0; c < 2; c++) {
          dummy.position.set(x + (c ? (rnd() - 0.5) * r : 0), y + h + (c ? -r * 0.2 : r * 0.3), z + (c ? (rnd() - 0.5) * r : 0));
          dummy.rotation.set(0, rnd() * 6.28, 0);
          const size = r * (c ? 0.75 : 1);
          dummy.scale.set(size, size * (palms ? 0.32 : 0.8), size);
          dummy.updateMatrix();
          crowns.setMatrixAt(i * 2 + c, dummy.matrix);
          crowns.setColorAt(i * 2 + c, tint.set(greens[Math.floor(rnd() * greens.length)]));
        }
      }
      trunks.castShadow = crowns.castShadow = true;
      this.land.add(trunks, crowns);
    }

    // The plot's surface: sandstone paving, a mown clearing, or a launch pad.
    const paving = document.createElement('canvas');
    paving.width = paving.height = PLOT * 32;
    const g = paving.getContext('2d')!;
    for (let x = 0; x < PLOT; x++) {
      for (let z = 0; z < PLOT; z++) {
        g.fillStyle = look.paving[(x + z) % 2];
        g.fillRect(x * 32, z * 32, 32, 32);
      }
    }
    g.strokeStyle = look.line;
    g.lineWidth = 2;
    for (let i = 0; i <= PLOT; i++) {
      g.beginPath();
      g.moveTo(i * 32, 0);
      g.lineTo(i * 32, PLOT * 32);
      g.moveTo(0, i * 32);
      g.lineTo(PLOT * 32, i * 32);
      g.stroke();
    }
    const map = new THREE.CanvasTexture(paving);
    map.colorSpace = THREE.SRGBColorSpace;
    const surface = this.plot.material as THREE.MeshLambertMaterial;
    surface.map?.dispose();
    surface.map = map;
    surface.needsUpdate = true;
  }

  /** Starts (or resumes) a build. */
  load(mode: Mode, save: BuildSave, followPlan: boolean): void {
    for (const m of this.meshes) {
      this.built.remove(m);
      m.dispose();
    }
    this.mode = mode;
    this.dress(mode.setting);
    this.built.position.y = 0;
    this.party = -1;
    this.pops.clear();
    this.glowing = [];
    this.meshes = mode.blocks.map((type) => {
      // Each block wears a painted face (stone, planks, tiles...) and has its own shape.
      const mat = paint({ dab: 0.3 });
      mat.map = faceFor(type);
      if (type.shape === 'pane') {
        mat.transparent = true;
        mat.opacity = type.face === 'glass' ? 0.6 : 1;
        mat.side = THREE.DoubleSide;
      }
      if (type.glow) {
        mat.emissive.set(type.glow);
        mat.emissiveIntensity = 0.9;
        this.glowing.push(mat);
      }
      const mesh = new THREE.InstancedMesh(shapeFor(type.shape), mat, PLOT * PLOT * HEIGHT);
      mesh.count = 0;
      mesh.castShadow = mesh.receiveShadow = true;
      this.built.add(mesh);
      return mesh;
    });
    this.blocks.clear();
    // A build saved on a smaller plot is moved to the middle of this one.
    const shift = Math.floor((PLOT - (save.plot ?? 15)) / 2);
    for (const [x, y, z, t] of save.blocks) if (typeOf(t) < mode.blocks.length) this.blocks.set(keyOf(x + shift, y, z + shift), t);
    this.focus.set(0, 2.5, 0);
    this.stock = mode.blocks.map((_, i) => save.stock[i] ?? 0);
    this.done = save.done;
    this.plan = mode.blueprint();
    this.planOn = followPlan;
    this.selected = 0;
    this.erasing = false;
    this.refresh();
    // A build whose blueprint was finished on an earlier visit still has its visitors.
    this.welcome(this.done && followPlan, false);
  }

  /** Brings out the visitors for this build; `fresh` makes them walk out from the middle. */
  welcome(show: boolean, fresh: boolean): void {
    for (const v of this.visitors) this.scene.remove(v.figure.group);
    this.visitors = [];
    if (!show || !this.mode) return;
    const figures = figuresFor(this.mode.id);
    figures.forEach((figure, i) => {
      figure.group.traverse((o) => (o.castShadow = true));
      this.scene.add(figure.group);
      this.visitors.push({ figure, angle: (i / figures.length) * Math.PI * 2 + 1, ring: 8.5 + (i % 3) * 1.4, out: fresh ? 0 : 1 });
    });
  }

  /** What to store so this build can be picked up again later. */
  save(): BuildSave {
    const blocks: BuildSave['blocks'] = [];
    for (const [k, t] of this.blocks) {
      // `t` carries both the block type and which way it was turned.
      blocks.push([k % PLOT, Math.floor(k / (PLOT * PLOT)), Math.floor(k / PLOT) % PLOT, t]);
    }
    return { blocks, stock: [...this.stock], done: this.done, plot: PLOT };
  }

  /** Throws out a handful of sparks from a point. */
  private burst(x: number, y: number, z: number, count: number, speed: number, life: number, rgb: number[]): void {
    for (let i = 0; i < count; i++) {
      const k = this.sparkNext;
      this.sparkNext = (this.sparkNext + 1) % SPARKS;
      const a = Math.random() * Math.PI * 2;
      const up = Math.random() * 2 - 0.6;
      const flat = Math.sqrt(Math.max(0, 1 - Math.min(1, up * up)));
      this.sparkPos.set([x, y, z], k * 3);
      this.sparkVel.set([Math.cos(a) * flat * speed, up * speed, Math.sin(a) * flat * speed], k * 3);
      this.sparkCol.set(rgb, k * 3);
      this.sparkLife[k] = life * (0.6 + Math.random() * 0.6);
    }
  }

  /** The celebration for a finished blueprint: fireworks, a turn right round the building, then the visitors. */
  celebrate(): void {
    this.party = 0;
    this.partyBoom = 0;
    this.sweep = Math.PI * 2;
    this.focus.set(0, 2.5, 0);
    this.goal.dist = Math.max(this.goal.dist, 30);
    this.goal.pitch = 0.45;
    sound.fanfare();
    if (this.mode?.id === 'rocket') sound.launch();
  }

  /** The sphinx nods: the answer was right. */
  sphinxNod(): void {
    this.nod = 1;
  }

  /** A small picture of the build as it stands, for the choosing screens. */
  snapshot(): string {
    this.frame(0);
    const w = this.canvas.width;
    const h = this.canvas.height;
    const side = Math.min(w, h);
    const small = document.createElement('canvas');
    small.width = small.height = 200;
    small.getContext('2d')!.drawImage(this.canvas, (w - side) / 2, (h - side) / 2, side, side, 0, 0, 200, 200);
    return small.toDataURL('image/jpeg', 0.7);
  }

  /** Lets go of a child the sphinx was holding. */
  release(): void {
    this.caught = false;
    this.sphinxRest = 45;
  }

  private refresh(): void {
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    this.meshKeys = this.meshes.map(() => []);
    for (const [k, v] of this.blocks) {
      const t = typeOf(v);
      const list = this.meshKeys[t];
      centre(k % PLOT, Math.floor(k / (PLOT * PLOT)), Math.floor(k / PLOT) % PLOT, p);
      this.meshes[t].setMatrixAt(list.length, m.makeRotationY((turnOf(v) * Math.PI) / 2).setPosition(p));
      list.push(k);
    }
    this.meshes.forEach((mesh, t) => {
      mesh.count = this.meshKeys[t].length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });

    // Show only the outlines that can be reached now: on the ground, or on top of a placed block.
    this.ghostCells = [];
    if (this.planOn && this.mode) {
      const tint = new THREE.Color();
      for (const c of this.plan) {
        if (this.blocks.has(keyOf(c.x, c.y, c.z))) continue;
        if (c.y > 0 && !this.blocks.has(keyOf(c.x, c.y - 1, c.z))) continue;
        centre(c.x, c.y, c.z, p);
        this.ghost.setMatrixAt(this.ghostCells.length, m.makeTranslation(p.x, p.y, p.z));
        this.ghost.setColorAt(this.ghostCells.length, tint.set(0xfff8e8)); // one pale colour: no block is 'meant' for a space
        this.ghostCells.push(c);
      }
    }
    this.ghost.count = this.ghostCells.length;
    this.ghost.instanceMatrix.needsUpdate = true;
    if (this.ghost.instanceColor) this.ghost.instanceColor.needsUpdate = true;
    this.ghost.computeBoundingSphere();
  }

  private place(x: number, y: number, z: number, type: number): void {
    if (x < 0 || z < 0 || y < 0 || x >= PLOT || z >= PLOT || y >= HEIGHT) return;
    if (this.blocks.has(keyOf(x, y, z))) return;
    if (this.stock[type] <= 0) {
      this.events.needBlocks(type);
      return;
    }
    this.stock[type]--;
    // Slopes, arches and the like turn to face whoever is building.
    const shaped = (this.mode?.blocks[type].shape ?? 'cube') !== 'cube';
    const turn = shaped ? ((Math.round(this.yaw / (Math.PI / 2)) % 4) + 4) % 4 : 0;
    this.blocks.set(keyOf(x, y, z), type + turn * TURN);
    this.pops.set(keyOf(x, y, z), 0);
    this.refresh();
    sound.place();
    const at = centre(x, y, z, new THREE.Vector3());
    this.burst(at.x, at.y - 0.4, at.z, 7, 2.2, 0.5, [0.86, 0.78, 0.62]);
    this.events.changed();
    if (this.planOn && !this.done && this.plan.every((c) => this.blocks.has(keyOf(c.x, c.y, c.z)))) {
      this.done = true;
      this.events.finished();
    }
  }

  private tap(clientX: number, clientY: number): void {
    if (!this.enabled || !this.mode || this.party >= 0) return;
    this.ray.setFromCamera(
      new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1),
      this.camera,
    );
    if (this.ray.intersectObject(this.sphinx.group, true).length) {
      this.catchChild();
      return;
    }
    const hit = this.ray.intersectObjects([this.ghost, ...this.meshes, this.plot, this.pool], false)[0];
    if (!hit) return;

    if (hit.object === this.pool) {
      this.events.home();
    } else if (hit.object === this.ghost) {
      const c = this.ghostCells[hit.instanceId!];
      // Any block may fill any outline: the blueprint gives the shape, the child chooses the colours.
      if (!this.erasing) this.place(c.x, c.y, c.z, this.selected);
    } else if (hit.object === this.plot) {
      if (!this.erasing) this.place(Math.floor(hit.point.x + HALF), 0, Math.floor(hit.point.z + HALF), this.selected);
    } else {
      const type = this.meshes.indexOf(hit.object as THREE.InstancedMesh);
      const k = this.meshKeys[type][hit.instanceId!];
      const x = k % PLOT;
      const y = Math.floor(k / (PLOT * PLOT));
      const z = Math.floor(k / PLOT) % PLOT;
      if (this.erasing) {
        this.blocks.delete(k);
        this.stock[type]++;
        this.refresh();
        sound.remove();
        this.events.changed();
      } else {
        // Build onto whichever face of the block was tapped: turn the face's direction
        // the way the block was turned, then take the nearest of up, down and the four sides.
        const n = hit.face!.normal.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (turnOf(this.blocks.get(k) ?? 0) * Math.PI) / 2);
        const ax = Math.abs(n.x);
        const ay = Math.abs(n.y);
        const az = Math.abs(n.z);
        const dx = ax >= ay && ax >= az ? Math.sign(n.x) : 0;
        const dy = dx === 0 && ay >= az ? Math.sign(n.y) : 0;
        const dz = dx === 0 && dy === 0 ? Math.sign(n.z) : 0;
        this.place(x + dx, y + dy, z + dz, this.selected);
      }
    }
  }

  private catchChild(): void {
    if (this.caught) return;
    this.caught = true;
    this.events.sphinx();
  }

  private listen(): void {
    const pointers = new Map<number, { x: number; y: number }>();
    let tap: { x: number; y: number; t: number } | null = null;
    let pinch = 0;
    const el = this.canvas;

    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      tap = pointers.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
      pinch = 0;
    });
    el.addEventListener('pointermove', (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev || this.caught) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (pointers.size === 1 && !(e.shiftKey || e.buttons & 2)) {
        // Drag to swing right round the building and to look from higher or lower.
        this.goal.yaw -= dx * 0.008;
        this.goal.pitch = Math.min(1.35, Math.max(0.12, this.goal.pitch + dy * 0.006));
      } else {
        // Two fingers (or shift-drag, or right-drag) slide the view across the plot.
        const k = (this.dist * 0.0018) / pointers.size;
        const sin = Math.sin(this.yaw);
        const cos = Math.cos(this.yaw);
        this.focus.x = Math.min(HALF, Math.max(-HALF, this.focus.x - (cos * dx + sin * dy) * k));
        this.focus.z = Math.min(HALF, Math.max(-HALF, this.focus.z - (-sin * dx + cos * dy) * k));
      }
      prev.x = e.clientX;
      prev.y = e.clientY;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) this.goal.dist = Math.min(MAX_DIST, Math.max(9, this.goal.dist * (pinch / d)));
        pinch = d;
      }
    });
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinch = 0;
      const t = tap;
      tap = null;
      if (e.type === 'pointercancel' || !t) return;
      if (Math.hypot(e.clientX - t.x, e.clientY - t.y) <= 10 && performance.now() - t.t <= 450) this.tap(e.clientX, e.clientY);
    };
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (this.caught) return;
        const step = Math.max(-120, Math.min(120, e.deltaY)) * 0.0012;
        this.goal.dist = Math.min(MAX_DIST, Math.max(9, this.goal.dist * (1 + step)));
      },
      { passive: false },
    );
  }

  private resize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.finish.resize();
  }

  /** Everything that moves by itself: light, water, birds, sparks, springing blocks, the celebration. */
  private live(dt: number): void {
    const t = this.life;

    // The sun stands where it does over Brevard, but never lower than a warm late afternoon,
    // so there is always light to build by. Low sun means long shadows and a golden sky.
    this.sunClock -= dt;
    if (this.sunClock <= 0) {
      this.sunClock = 30;
      const real = sunAt(new Date());
      const el = (Math.max(16, real.elevation) * Math.PI) / 180;
      const az = (real.azimuth * Math.PI) / 180;
      SUN.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
      const gold = 1 - smoothstep(16, 50, Math.max(16, real.elevation));
      this.sun.position.copy(SUN).multiplyScalar(120);
      this.sun.color.set(0xfff0cf).lerp(new THREE.Color(0xffb866), gold);
      this.skyLow.set(this.look0.skyLow).lerp(new THREE.Color(0xf7c79a), gold * 0.75);
      this.skyHigh.set(this.look0.skyHigh).lerp(new THREE.Color(0x8ea4d8), gold * 0.5);
      this.fog.color.copy(this.skyLow);
    }

    // Torches, lamps and engines flicker.
    this.glowing.forEach((m, i) => (m.emissiveIntensity = 0.8 + 0.25 * Math.sin(t * 9 + i * 2) * Math.sin(t * 5.3 + i)));

    // The sea laps at the beach; the boat sails slowly along the horizon.
    if (this.sea) this.sea.position.y = -1.1 + Math.sin(t * 0.8) * 0.14;
    if (this.boat) {
      const along = ((t * 1.2) % 240) - 120;
      this.boat.position.set(LEVEL + 55, -0.9 + Math.sin(t * 1.3) * 0.15, along);
      this.boat.rotation.z = Math.sin(t * 1.1) * 0.06;
    }

    // Birds circle and flap.
    for (const b of this.birds) {
      b.angle += (dt * b.speed) / b.ring;
      b.group.position.set(Math.cos(b.angle) * b.ring, b.height + Math.sin(t * 0.7 + b.ring) * 1.5, Math.sin(b.angle) * b.ring);
      b.group.rotation.y = -b.angle;
      const flap = Math.sin(t * 7 + b.ring) * 0.6;
      b.wings[0].rotation.y = flap;
      b.wings[1].rotation.y = -flap;
    }

    // Blocks spring into place: they land small, overshoot, and settle.
    if (this.pops.size) {
      const m = new THREE.Matrix4();
      const p = new THREE.Vector3();
      const q = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      for (const [k, age] of this.pops) {
        const now = age + dt;
        const v = this.blocks.get(k);
        if (v === undefined || now > 0.3) {
          this.pops.delete(k);
        } else {
          this.pops.set(k, now);
        }
        if (v === undefined) continue;
        const type = typeOf(v);
        const i = this.meshKeys[type].indexOf(k);
        if (i < 0) continue;
        const u = Math.min(1, now / 0.3);
        const size = 1 + Math.sin(u * Math.PI) * 0.22 - (1 - u) * 0.5 * (1 - u);
        centre(k % PLOT, Math.floor(k / (PLOT * PLOT)), Math.floor(k / PLOT) % PLOT, p);
        q.setFromAxisAngle(up, (turnOf(v) * Math.PI) / 2);
        this.meshes[type].setMatrixAt(i, m.compose(p, q, new THREE.Vector3(size, size, size)));
        this.meshes[type].instanceMatrix.needsUpdate = true;
      }
    }

    // The celebration when a blueprint is finished.
    if (this.party >= 0) {
      this.party += dt;
      this.partyBoom -= dt;
      if (this.partyBoom <= 0 && this.party < 7) {
        this.partyBoom = 0.35 + Math.random() * 0.35;
        const colours = [[1, 0.82, 0.3], [0.95, 0.3, 0.4], [0.35, 0.6, 1], [0.4, 0.9, 0.5], [1, 1, 1]];
        this.burst((Math.random() - 0.5) * 22, 11 + Math.random() * 9, (Math.random() - 0.5) * 22, 46, 7, 1.5, colours[Math.floor(Math.random() * colours.length)]);
        sound.boom();
      }
      // The rocket lifts off, climbs out of sight, and comes back down to its pad.
      if (this.mode?.id === 'rocket') {
        const u = this.party;
        const climb = u < 1 ? 0 : u < 5.5 ? (u - 1) * (u - 1) * 4.5 : Math.max(0, 91 * (1 - smoothstep(5.5, 9, u)));
        this.built.position.y = climb;
        this.built.position.x = u < 5.5 && u > 0.2 ? (Math.random() - 0.5) * 0.08 : 0;
        if (u > 0.6 && u < 5.5) this.burst((Math.random() - 0.5) * 3, climb + 0.5, (Math.random() - 0.5) * 3, 8, 5, 0.7, [1, 0.55 + Math.random() * 0.3, 0.15]);
      }
      if (this.party > 2.6 && !this.visitors.length) this.welcome(true, true);
      if (this.party > 9.5) {
        this.party = -1;
        this.built.position.set(0, 0, 0);
      }
    }

    // Sparks fly, fall and fade.
    const pos = this.sparkPos;
    const vel = this.sparkVel;
    for (let k = 0; k < SPARKS; k++) {
      if (this.sparkLife[k] <= 0) continue;
      this.sparkLife[k] -= dt;
      if (this.sparkLife[k] <= 0) {
        pos[k * 3 + 1] = -999;
        continue;
      }
      vel[k * 3 + 1] -= 6 * dt;
      pos[k * 3] += vel[k * 3] * dt;
      pos[k * 3 + 1] += vel[k * 3 + 1] * dt;
      pos[k * 3 + 2] += vel[k * 3 + 2] * dt;
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
    this.sparks.geometry.attributes.color.needsUpdate = true;
  }

  private frame(dt: number): void {
    this.life += dt;
    this.poolTime.value = this.life;

    // The sphinx paces a circle round the plot, and stops to face whoever it has caught.
    const s = this.sphinx.group;
    // Every so often it sits down for a rest, then gets up and walks on.
    this.sitClock -= dt;
    if (this.sitClock < 0) {
      this.sitting = 9;
      this.sitClock = 40 + Math.random() * 30;
    }
    this.sitting = Math.max(0, this.sitting - dt);
    const resting = this.sitting > 0 && !this.caught;
    this.stand = lerp(this.stand, resting ? 0 : 1, 1 - Math.exp(-dt * 2.5));
    const moving = !this.caught && this.stand > 0.9;
    if (moving) {
      this.sphinxAngle += (dt * 1.0) / SPHINX_RING;
      this.sphinxStride += dt * 5.5;
    }
    if (!this.caught) this.sphinxRest = Math.max(0, this.sphinxRest - dt);
    this.nod = Math.max(0, this.nod - dt * 1.4);
    const sx = Math.cos(this.sphinxAngle) * SPHINX_RING;
    const sz = Math.sin(this.sphinxAngle) * SPHINX_RING;
    s.position.set(sx, 0, sz);
    const outward = Math.atan2(sx, sz);
    const along = Math.atan2(-Math.sin(this.sphinxAngle), Math.cos(this.sphinxAngle));
    s.rotation.y = this.caught ? outward : along;
    // Its head follows whoever is building, as far as its neck will turn.
    const facing = s.rotation.y;
    let toChild = Math.atan2(this.camera.position.x - sx, this.camera.position.z - sz) - facing;
    while (toChild > Math.PI) toChild -= Math.PI * 2;
    while (toChild < -Math.PI) toChild += Math.PI * 2;
    this.headTurn = lerp(this.headTurn, Math.max(-1.1, Math.min(1.1, toChild)), 1 - Math.exp(-dt * 3));
    this.sphinx.pose({
      stand: this.stand,
      curl: 1 - this.stand,
      walking: moving ? 1 : 0,
      stride: this.sphinxStride,
      life: this.life,
      glance: 0,
      look: this.headTurn,
      nod: Math.sin(this.nod * Math.PI * 2) * 0.4 * this.nod,
    });

    this.live(dt);

    // Visitors stroll round the finished building; when new, they walk out from its middle.
    for (const v of this.visitors) {
      v.out = Math.min(1, v.out + dt / 4);
      const r = v.ring * smoothstep(0, 1, v.out);
      v.angle += (dt * v.figure.speed) / v.ring;
      const phase = v.angle * v.ring * 5;
      v.figure.step(phase);
      const g = v.figure.group;
      g.position.set(Math.cos(v.angle) * r, Math.abs(Math.sin(phase)) * v.figure.bounce + (1 - v.out) * 0.01, Math.sin(v.angle) * r);
      // Facing along the path once out; facing outward while leaving the building.
      g.rotation.y = v.out < 1 ? Math.atan2(Math.cos(v.angle), Math.sin(v.angle)) : Math.atan2(-Math.sin(v.angle), Math.cos(v.angle));
    }

    // Camera: ease towards where the child has swung it, or go face to face with the sphinx.
    const ease = 1 - Math.exp(-dt * 7);
    let yaw = this.goal.yaw;
    let pitch = this.goal.pitch;
    let dist = this.goal.dist;
    const target = this.focus.clone();
    if (this.sweep > 0 && !this.caught) {
      // Celebrating: one slow turn right round the building.
      const step = Math.min(this.sweep, dt * 1.05);
      this.sweep -= step;
      this.goal.yaw += step;
      yaw = this.goal.yaw;
    }
    if (this.caught) {
      yaw = outward;
      pitch = 0.16;
      dist = 6.5;
      target.set(sx, 1.5, sz);
      // Turn the short way round.
      while (yaw - this.yaw > Math.PI) yaw -= Math.PI * 2;
      while (yaw - this.yaw < -Math.PI) yaw += Math.PI * 2;
    }
    this.yaw = lerp(this.yaw, yaw, this.caught ? ease * 0.5 : ease);
    this.pitch = lerp(this.pitch, pitch, ease);
    this.dist = lerp(this.dist, dist, ease);
    this.look.lerp(target, ease);
    if (!this.caught) this.goal.yaw = yaw; // keep the wrapped angle
    this.camera.position.set(
      this.look.x + Math.sin(this.yaw) * Math.cos(this.pitch) * this.dist,
      this.look.y + Math.sin(this.pitch) * this.dist,
      this.look.z + Math.cos(this.yaw) * Math.cos(this.pitch) * this.dist,
    );
    this.camera.lookAt(this.look);

    // Zoom in on the sphinx and it catches you.
    if (!this.caught && this.enabled && this.mode && this.sphinxRest === 0 && this.camera.position.distanceTo(s.position) < 7.5) {
      this.catchChild();
    }

    this.finish.render(this.scene, this.camera, 0.004, 0, 0.75);
  }
}
