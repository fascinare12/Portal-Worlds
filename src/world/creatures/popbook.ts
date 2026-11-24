import * as THREE from 'three';
import { canvasOf, pagePaper } from '../../../worlds/popup/art';
import { L, W, quads, tilt } from '../../../worlds/popup/fold';
import type { Piece } from '../../../worlds/popup/fold';
import type { Pool } from '../layout';

/**
 * A pop-up book, floating open on the pool that leads to the pop-up books.
 * Now and then it half shuts, and its straw house folds down; then it opens
 * again and the house stands up.
 *
 * The house moves by the book's own fold maths, so it folds here exactly as
 * one built inside would.
 */
export function createPopBook(pool: Pool, stirPool: () => void): { group: THREE.Group; update(dt: number): void } {
  const group = new THREE.Group();
  const book = new THREE.Group();
  group.add(book);
  // The book's own measure is centimetres; here a spread is a little narrower than the pool.
  const scale = (pool.radius * 1.5) / (2 * W);
  book.scale.setScalar(scale);
  book.position.set(pool.x, pool.level + 0.06, pool.z);

  const paper = new THREE.CanvasTexture(pagePaper());
  paper.colorSpace = THREE.SRGBColorSpace;
  const pageMat = new THREE.MeshLambertMaterial({ map: paper, side: THREE.DoubleSide });
  const coverMat = new THREE.MeshLambertMaterial({ color: 0x8a3340 });
  const halves = [-1, 1].map((side) => {
    const half = new THREE.Group();
    const page = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, L), pageMat);
    page.position.set((side * W) / 2, -0.06, 0);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.25, L + 0.9), coverMat);
    cover.position.set((side * (W + 0.5)) / 2, -0.24, 0);
    half.add(page, cover);
    book.add(half);
    return { side, half };
  });

  // What stands in it: a straw house on the spine, and a tree out on each page.
  const pieces: Piece[] = [
    { kind: 'vfold', art: 'strawhouse', x: 0, z: 2, w: 5.5, h: 8, angle: 48, reach: 4, flip: false },
    { kind: 'stand', art: 'tree', x: 8, z: -4, w: 4, h: 5.5, angle: 50, reach: 4, flip: false },
    { kind: 'stand', art: 'pine', x: -8.5, z: -1, w: 3.5, h: 5, angle: 50, reach: 4, flip: false },
  ];
  const plain = new THREE.MeshLambertMaterial({ color: 0xf4ead6, side: THREE.DoubleSide });
  const made = pieces.map((piece) => {
    const map = new THREE.CanvasTexture(canvasOf(piece.art));
    map.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide, alphaTest: 0.5 });
    return quads(piece, 1).map((q) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
      const [u0, v0, u1, v1] = q.uv;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([u0, v0, u1, v0, u1, v1, u0, v1]), 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      const mesh = new THREE.Mesh(g, q.art ? mat : plain);
      mesh.frustumCulled = false;
      book.add(mesh);
      return mesh;
    });
  });

  const soon = new URLSearchParams(window.location.search).get('visit') === 'now';
  let open = 1;
  let want = 1;
  let wait = soon ? 2 : 9 + Math.random() * 6;
  let bob = Math.random() * 6;

  function place(): void {
    const alpha = tilt(open);
    for (const { side, half } of halves) half.rotation.z = side * alpha;
    pieces.forEach((piece, i) =>
      quads(piece, open).forEach((q, k) => {
        const pos = made[i][k].geometry.getAttribute('position') as THREE.BufferAttribute;
        q.c.forEach((c, j) => pos.setXYZ(j, c[0], c[1], c[2]));
        pos.needsUpdate = true;
        made[i][k].geometry.computeVertexNormals();
      }),
    );
  }
  place();

  return {
    group,
    update(dt) {
      bob += dt;
      book.position.y = pool.level + 0.08 + Math.sin(bob * 0.9) * 0.025;
      book.rotation.y = Math.sin(bob * 0.23) * 0.25;
      wait -= dt;
      if (wait <= 0) {
        // Shut most of the way, rest a moment, and open again.
        if (want === 1) {
          want = 0.22;
          wait = 2.6;
          stirPool();
        } else {
          want = 1;
          wait = soon ? 5 : 10 + Math.random() * 8;
        }
      }
      if (Math.abs(want - open) < 0.002) return;
      // Shutting is quick; opening is slow enough to watch the house stand up.
      open += (want - open) * Math.min(1, dt * (want < open ? 2.4 : 1.5));
      place();
    },
  };
}
