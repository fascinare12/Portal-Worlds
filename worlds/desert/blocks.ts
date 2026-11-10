import * as THREE from 'three';
import type { BlockType, Face, Shape } from './modes';

/**
 * What blocks look like: a painted face for each material (stone courses, wood
 * grain, roof tiles...) and a shape (cube, slab, slope, cone, arch, post, pane).
 * The faces are drawn here in code, so there are no pictures to download.
 */

const SIZE = 64;

function css(color: number, lightness = 1): string {
  const c = new THREE.Color(color).multiplyScalar(lightness);
  const to = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255);
  // THREE.Color holds linear values; convert back to the screen colours a canvas expects.
  const out = new THREE.Color().copyLinearToSRGB(c);
  return `rgb(${to(out.r)}, ${to(out.g)}, ${to(out.b)})`;
}

/** Repeatable randomness, so a block's face is the same every time. */
function dice(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807 + 11) % 2147483647) / 2147483647;
}

function draw(face: Face, color: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const g = canvas.getContext('2d')!;
  const rnd = dice(color + face.length * 97);
  const fill = (l: number) => (g.fillStyle = css(color, l));
  const line = (l: number, w = 2) => {
    g.strokeStyle = css(color, l);
    g.lineWidth = w;
  };
  fill(1);
  g.fillRect(0, 0, SIZE, SIZE);

  const speckle = (n: number, strength: number) => {
    for (let i = 0; i < n; i++) {
      fill(1 + (rnd() - 0.5) * strength);
      g.fillRect(rnd() * SIZE, rnd() * SIZE, 2 + rnd() * 3, 2 + rnd() * 2);
    }
  };

  switch (face) {
    case 'stone': {
      // Two courses of big blocks, the upper one offset, each a slightly different tone.
      for (let row = 0; row < 2; row++) {
        for (let i = -1; i < 2; i++) {
          fill(0.82 + rnd() * 0.3);
          g.fillRect(i * 40 + (row ? 20 : 0), row * 32, 40, 32);
        }
      }
      speckle(26, 0.3);
      line(0.5, 3);
      g.strokeRect(0, 0, SIZE, 32);
      g.strokeRect(0, 32, SIZE, 32);
      g.beginPath();
      g.moveTo(40, 0);
      g.lineTo(40, 32);
      g.moveTo(20, 32);
      g.lineTo(20, 64);
      g.moveTo(60, 32);
      g.lineTo(60, 64);
      g.stroke();
      break;
    }
    case 'brick': {
      // Pale mortar, with each brick its own shade.
      g.fillStyle = '#e4d8c4';
      g.fillRect(0, 0, SIZE, SIZE);
      for (let row = 0; row < 4; row++) {
        for (let i = -1; i < 3; i++) {
          fill(0.74 + rnd() * 0.4);
          g.fillRect(i * 32 + (row % 2 ? 16 : 0) + 1.5, row * 16 + 1.5, 29, 13);
        }
      }
      break;
    }
    case 'plank': {
      for (let i = 0; i < 4; i++) {
        fill(0.8 + rnd() * 0.36);
        g.fillRect(i * 16, 0, 16, SIZE);
        line(0.62, 1.2);
        for (let k = 0; k < 3; k++) {
          const x = i * 16 + 3 + rnd() * 10;
          g.beginPath();
          g.moveTo(x, rnd() * 20);
          g.lineTo(x + (rnd() - 0.5) * 3, 30 + rnd() * 34);
          g.stroke();
        }
      }
      line(0.45, 2.5);
      for (let i = 0; i <= 4; i++) {
        g.beginPath();
        g.moveTo(i * 16, 0);
        g.lineTo(i * 16, SIZE);
        g.stroke();
      }
      break;
    }
    case 'bark': {
      for (let i = 0; i < 16; i++) {
        line(0.6 + rnd() * 0.6, 2 + rnd() * 3);
        const x = rnd() * SIZE;
        g.beginPath();
        g.moveTo(x, 0);
        g.bezierCurveTo(x + 6, 20, x - 6, 44, x + 2, SIZE);
        g.stroke();
      }
      break;
    }
    case 'leaf': {
      for (let i = 0; i < 46; i++) {
        fill(0.72 + rnd() * 0.6);
        g.beginPath();
        g.ellipse(rnd() * SIZE, rnd() * SIZE, 4 + rnd() * 5, 2 + rnd() * 3, rnd() * 3, 0, 6.3);
        g.fill();
      }
      break;
    }
    case 'tile': {
      // Rows of rounded roof tiles, overlapping like fish scales.
      for (let row = 0; row < 4; row++) {
        for (let i = -1; i < 5; i++) {
          fill(0.74 + rnd() * 0.42);
          g.beginPath();
          g.arc(i * 16 + (row % 2 ? 8 : 0) + 8, row * 16, 9.5, 0, Math.PI);
          g.fill();
          line(0.48, 2);
          g.stroke();
        }
      }
      break;
    }
    case 'panel': {
      // A metal plate with a raised edge and a rivet in each corner.
      fill(1.08);
      g.fillRect(5, 5, SIZE - 10, SIZE - 10);
      line(0.72, 2);
      g.strokeRect(5, 5, SIZE - 10, SIZE - 10);
      fill(0.62);
      for (const [x, y] of [[11, 11], [53, 11], [11, 53], [53, 53]]) {
        g.beginPath();
        g.arc(x, y, 2.6, 0, 6.3);
        g.fill();
      }
      break;
    }
    case 'cloth': {
      // A woven pattern with a border, for carpets, rugs and flags.
      line(1.25, 3);
      for (let i = -SIZE; i < SIZE; i += 12) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i + SIZE, SIZE);
        g.moveTo(i + SIZE, 0);
        g.lineTo(i, SIZE);
        g.stroke();
      }
      line(0.6, 6);
      g.strokeRect(3, 3, SIZE - 6, SIZE - 6);
      break;
    }
    case 'sand':
      speckle(110, 0.45);
      break;
    case 'glass': {
      line(1.6, 5);
      g.beginPath();
      g.moveTo(10, 44);
      g.lineTo(38, 12);
      g.moveTo(26, 52);
      g.lineTo(52, 22);
      g.stroke();
      break;
    }
    case 'plain':
      speckle(20, 0.2);
      break;
  }

  // A darker rim on every face, so each block can be told from its neighbours.
  line(0.58, 3.5);
  g.strokeRect(0, 0, SIZE, SIZE);
  return canvas;
}

const faces = new Map<string, THREE.CanvasTexture>();

/** The painted face for a block type. */
export function faceFor(type: BlockType): THREE.CanvasTexture {
  const face = type.face ?? 'plain';
  const key = `${face}:${type.color}`;
  let tex = faces.get(key);
  if (!tex) {
    tex = new THREE.CanvasTexture(draw(face, type.color));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    faces.set(key, tex);
  }
  return tex;
}

/** The same face as a picture, for the block's button. */
export function facePicture(type: BlockType): string {
  return draw(type.face ?? 'plain', type.color).toDataURL();
}

const shapes = new Map<Shape, THREE.BufferGeometry>();

/** The solid form of a block. Slopes and arches face +z; the builder turns them as they are placed. */
export function shapeFor(shape: Shape = 'cube'): THREE.BufferGeometry {
  let geo = shapes.get(shape);
  if (geo) return geo;
  switch (shape) {
    case 'slab':
      geo = new THREE.BoxGeometry(1, 0.5, 1).translate(0, -0.25, 0);
      break;
    case 'post':
      geo = new THREE.BoxGeometry(0.3, 1, 0.3);
      break;
    case 'pane':
      geo = new THREE.BoxGeometry(1, 1, 0.18);
      break;
    case 'cone':
      geo = new THREE.ConeGeometry(0.7071, 1, 4).rotateY(Math.PI / 4);
      break;
    case 'slope': {
      // A wedge: full height at the back, running down to nothing at the front.
      const A = [-0.5, -0.5, 0.5];
      const B = [0.5, -0.5, 0.5];
      const C = [0.5, -0.5, -0.5];
      const D = [-0.5, -0.5, -0.5];
      const E = [-0.5, 0.5, -0.5];
      const F = [0.5, 0.5, -0.5];
      const tris = [A, B, F, A, F, E, C, D, E, C, E, F, A, D, C, A, C, B, A, E, D, B, C, F];
      const uvs: number[] = [];
      tris.forEach((v, i) => {
        const side = i >= 18; // the two triangular ends
        uvs.push(side ? v[2] + 0.5 : v[0] + 0.5, i < 6 ? 0.5 - v[2] : i >= 12 && i < 18 ? v[2] + 0.5 : v[1] + 0.5);
      });
      geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.computeVertexNormals();
      break;
    }
    case 'arch': {
      // A block with a round-topped doorway through it.
      const s = new THREE.Shape();
      s.moveTo(-0.5, -0.5);
      s.lineTo(-0.3, -0.5);
      s.lineTo(-0.3, 0.05);
      s.absarc(0, 0.05, 0.3, Math.PI, 0, true);
      s.lineTo(0.3, -0.5);
      s.lineTo(0.5, -0.5);
      s.lineTo(0.5, 0.5);
      s.lineTo(-0.5, 0.5);
      s.closePath();
      geo = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -0.5);
      break;
    }
    default:
      geo = new THREE.BoxGeometry(1, 1, 1);
  }
  shapes.set(shape, geo);
  return geo;
}
