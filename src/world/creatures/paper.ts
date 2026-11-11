import * as THREE from 'three';
import { lerp, smoothstep } from '../../noise';
import { groundHeight } from '../layout';
import type { Pool } from '../layout';

/**
 * A sheet of printed paper that slides up out of the parchment pool, drifts
 * about like a leaf, folds itself in half and in half again, and opens out as
 * a paper crane. The crane flies a few circuits among the trees, comes back,
 * folds flat, opens into a sheet again and slips back into the pool.
 */

export interface Paper {
  group: THREE.Group;
  update(dt: number): void;
}

const CREAM = 0xf3ead0;
const SIDE = 2.6; // the sheet's edge
const HALF = SIDE / 2;

/** The print on the sheet: the mountain over water, and the printer's red seal. */
function printTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f3ead0';
  g.fillRect(0, 0, 256, 256);
  const sky = g.createLinearGradient(0, 0, 0, 150);
  sky.addColorStop(0, 'rgba(120,170,205,0.75)');
  sky.addColorStop(0.6, 'rgba(120,170,205,0)');
  sky.addColorStop(1, 'rgba(240,160,140,0.6)');
  g.fillStyle = sky;
  g.fillRect(14, 14, 228, 140);
  g.fillStyle = '#a9c9de';
  g.fillRect(14, 154, 228, 88);
  g.fillStyle = '#1c4484';
  g.beginPath();
  g.moveTo(52, 154);
  g.quadraticCurveTo(112, 130, 128, 66);
  g.lineTo(150, 66);
  g.quadraticCurveTo(166, 130, 226, 154);
  g.fill();
  g.fillStyle = '#f3ead0';
  g.beginPath();
  g.moveTo(128, 66);
  g.lineTo(150, 66);
  g.lineTo(158, 96);
  g.lineTo(150, 88);
  g.lineTo(144, 98);
  g.lineTo(138, 88);
  g.lineTo(130, 98);
  g.lineTo(122, 90);
  g.fill();
  g.strokeStyle = '#141a2e';
  g.lineWidth = 2.5;
  g.strokeRect(14, 14, 228, 228);
  for (let y = 172; y < 240; y += 17) {
    g.beginPath();
    for (let x = 14; x <= 242; x += 4) g.lineTo(x, y + Math.sin(x * 0.11 + y) * 3.5);
    g.stroke();
  }
  g.fillStyle = '#cc3122';
  g.fillRect(206, 206, 24, 24);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createPaper(pool: Pool, stirPool: () => void): Paper {
  const group = new THREE.Group();
  group.visible = false;

  // ---- The sheet: four triangles that meet in the middle, so it can fold along both diagonals.
  const corners = [
    [-HALF, -HALF],
    [HALF, -HALF],
    [HALF, HALF],
    [-HALF, HALF],
  ];
  const flat: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i < 4; i++) {
    for (const [x, z] of [[0, 0], corners[i], corners[(i + 1) % 4]]) {
      flat.push(x, 0, z);
      uv.push(x / SIDE + 0.5, 0.5 - z / SIDE);
    }
  }
  const sheetGeo = new THREE.BufferGeometry();
  sheetGeo.setAttribute('position', new THREE.Float32BufferAttribute(flat.slice(), 3));
  sheetGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const sheet = new THREE.Mesh(sheetGeo, new THREE.MeshLambertMaterial({ map: printTexture(), side: THREE.DoubleSide, emissive: 0x2a2820 }));
  sheet.frustumCulled = false;
  const axisOne = new THREE.Vector3(1, 0, 1).normalize();
  const axisTwo = new THREE.Vector3(1, 0, -1).normalize();
  const v = new THREE.Vector3();
  /** Folds the sheet: `one` and `two` run from 0 (flat) to 1 (folded right over). */
  const fold = (one: number, two: number) => {
    const p = sheetGeo.attributes.position;
    for (let i = 0; i < 12; i++) {
      v.set(flat[i * 3], 0, flat[i * 3 + 2]);
      const piece = Math.floor(i / 3);
      // Pieces 0 and 1 lie on one side of the first crease; pieces 0 and 3 on one side of the second.
      if (piece < 2) v.applyAxisAngle(axisOne, one * Math.PI * 0.97);
      if (piece === 0 || piece === 3) v.applyAxisAngle(axisTwo, -two * Math.PI * 0.96);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    p.needsUpdate = true;
    sheetGeo.computeVertexNormals();
  };

  // ---- The crane: thirteen flat facets. It faces along +z.
  const craneGeo = new THREE.BufferGeometry();
  craneGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(13 * 9), 3));
  craneGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(13 * 9), 3));
  const crane = new THREE.Mesh(craneGeo, new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide, flatShading: true, emissive: 0x2a2820 }));
  crane.frustumCulled = false;
  const cream = new THREE.Color(CREAM);
  const blue = new THREE.Color(0x2a5cb0);
  const red = new THREE.Color(0xcc3122);
  /** Shapes the crane. `open` 0 = folded tight, 1 = spread; `flap` -1..1 is where the wings are in their beat. */
  const shape = (open: number, flap: number) => {
    const p = craneGeo.attributes.position;
    const tint = craneGeo.attributes.color;
    let n = 0;
    const tri = (a: number[], b: number[], c: number[], ca = cream, cb = cream, cc = cream) => {
      for (const [q, col] of [[a, ca], [b, cb], [c, cc]] as [number[], THREE.Color][]) {
        p.setXYZ(n, q[0], q[1], q[2]);
        tint.setXYZ(n, col.r, col.g, col.b);
        n++;
      }
    };
    const F = [0, 0, 0.36];
    const B = [0, 0, -0.36];
    const T = [0, 0.26, 0];
    const K = [0, -0.12, 0];
    const L = [0.17, 0.05, 0];
    const R = [-0.17, 0.05, 0];
    tri(F, L, T);
    tri(F, T, R);
    tri(B, T, L);
    tri(B, R, T);
    tri(F, K, L);
    tri(F, R, K);
    tri(B, L, K);
    tri(B, K, R);
    // Wings: held together overhead when folded; spread and beating when open.
    const lift = flap * 0.55;
    for (const side of [1, -1]) {
      const tip = [lerp(side * 0.06, side * 1.3 * Math.cos(lift), open), lerp(1.15, 0.14 + 1.3 * Math.sin(lift), open), lerp(0, -0.1, open)];
      tri([side * 0.1, 0.12, 0.4], tip, [side * 0.1, 0.12, -0.42], cream, blue, cream);
    }
    // Neck and tail: tucked down against the body when folded; raised when open.
    const neck = [0, lerp(-0.45, 0.72, open), lerp(0.42, 0.74, open)];
    tri([0.11, 0, 0.24], [-0.11, 0, 0.24], neck);
    tri([neck[0] + 0.05, neck[1], neck[2]], [neck[0] - 0.05, neck[1], neck[2]], [0, neck[1] - 0.2 * open - 0.02, neck[2] + 0.28 * open + 0.03], cream, cream, red);
    tri([0.11, 0, -0.24], [-0.11, 0, -0.24], [0, lerp(-0.45, 0.82, open), lerp(-0.42, -0.84, open)]);
    p.needsUpdate = true;
    craneGeo.attributes.color.needsUpdate = true;
    craneGeo.computeVertexNormals();
  };
  crane.scale.setScalar(1.85);
  group.add(sheet, crane);

  // ---- The visit, as one timeline (in seconds from when the sheet first shows).
  const SLIDE = 4; // up out of the water, edge first
  const DRIFT = 15; // floating about like a leaf
  const FOLDED = 18.2; // creased twice
  const OPEN = 19.8; // the crane has spread
  const FLY = 62; // circuits among the trees
  const HOME = 66; // gliding back over the pool
  const SHUT = 67.4; // folded tight again
  const UNFOLD = 70.2; // a flat sheet once more
  const GONE = 74.5; // slipped back in

  let visiting = false;
  let clock = 0;
  let wait = new URLSearchParams(window.location.search).get('visit') === 'now' ? 3 : 45;
  let angle = 0;
  let spin = 0;
  const last = new THREE.Vector3();
  let heading = 0;
  const REACH = pool.radius + 7;

  return {
    group,
    update(dt) {
      clock += dt;
      if (!visiting) {
        if (clock < wait) return;
        visiting = true;
        // For looking at one part of the visit while developing: ?visit=now&skip=14 starts 14 seconds in.
        clock = Number(new URLSearchParams(window.location.search).get('skip') ?? 0);
        angle = Math.random() * 6.28;
        group.visible = true;
        stirPool();
      }
      const t = clock;
      if (t > GONE) {
        visiting = false;
        group.visible = false;
        clock = 0;
        wait = 80 + Math.random() * 60;
        return;
      }
      if (t > UNFOLD + 1.6 && t - dt <= UNFOLD + 1.6) stirPool();

      // How folded the sheet is, and how far open the crane.
      const out = t < FLY ? 1 : 0; // going out, or coming home
      const one = out ? smoothstep(DRIFT, DRIFT + 1.5, t) : 1 - smoothstep(SHUT + 1.4, UNFOLD, t);
      const two = out ? smoothstep(DRIFT + 1.6, FOLDED, t) : 1 - smoothstep(SHUT, SHUT + 1.4, t);
      const open = out ? smoothstep(FOLDED, OPEN, t) : 1 - smoothstep(HOME, SHUT, t);
      // The folded sheet and the folded crane are about the same shape; one is swapped for the other there.
      const isCrane = out ? t > FOLDED : t < SHUT;
      sheet.visible = !isCrane;
      crane.visible = isCrane;
      if (isCrane) shape(open, Math.sin(t * 5.2) * open);
      else fold(one, two);
      // Folding makes the sheet a quarter of the size; shrink it a little more so the swap is not seen.
      sheet.scale.setScalar(lerp(1, 0.86, two));

      // Where it is: over the pool at first and last, a wide circle round it in between.
      const far = smoothstep(SLIDE, OPEN + 6, t) * (1 - smoothstep(FLY - 8, HOME, t));
      const speed = lerp(0.1, 0.42, smoothstep(FOLDED, OPEN + 4, t) * (1 - smoothstep(FLY, HOME, t)));
      angle += dt * speed;
      const x = pool.x + Math.cos(angle) * REACH * far;
      const z = pool.z + Math.sin(angle) * REACH * far;
      const ground = Math.max(pool.level, groundHeight(x, z));
      const rise = smoothstep(0, SLIDE, t) * (1 - smoothstep(UNFOLD + 0.6, GONE, t));
      const aloft = smoothstep(FOLDED, OPEN + 5, t) * (1 - smoothstep(FLY - 4, HOME, t));
      const height = lerp(-1.3, 2.4, rise) + aloft * 3.6 + Math.sin(t * 0.9) * 0.35 * rise + (isCrane ? Math.sin(t * 5.2 + 1.2) * 0.1 * open : 0);
      group.position.set(x, lerp(pool.level, ground, far) + height, z);

      // Which way it faces. The crane follows its own path, leaning into the turn; the sheet turns idly,
      // comes out of the water on edge, and rocks as it floats.
      const dx = x - last.x;
      const dz = z - last.z;
      if (dx * dx + dz * dz > 1e-7) heading = Math.atan2(dx, dz);
      last.set(x, 0, z);
      spin += dt * 0.5;
      const flying = isCrane ? open : 0;
      const edge = 1 - smoothstep(0.5, SLIDE + 1.5, t) * (1 - smoothstep(UNFOLD + 0.8, GONE - 1, t));
      const rock = (1 - flying) * (1 - edge);
      let turn = heading - spin;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn)); // the short way round
      group.rotation.set(edge * 1.35 + Math.sin(t * 1.3) * 0.45 * rock, spin + turn * flying, Math.cos(t * 1.05) * 0.4 * rock - 0.3 * flying * far, 'YXZ');
    },
  };
}
