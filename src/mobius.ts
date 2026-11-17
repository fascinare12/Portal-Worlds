import * as THREE from 'three';

/**
 * A Möbius band: a strip joined to itself with half a twist, so that it has
 * one side and one edge. Something walking along the middle of it comes back
 * to where it started on the other face, and has to go round again to get home.
 */

/** A point on the band: `s` runs once round it for every 2π, `v` across it from the middle. */
export function mobiusPoint(s: number, v: number, radius: number, out = new THREE.Vector3()): THREE.Vector3 {
  const r = radius + v * Math.cos(s / 2);
  return out.set(r * Math.cos(s), v * Math.sin(s / 2), r * Math.sin(s));
}

/** Which way is "up" for something standing on the middle of the band at `s`. It turns over once for each trip round. */
export function mobiusNormal(s: number, out = new THREE.Vector3()): THREE.Vector3 {
  const across = new THREE.Vector3(Math.cos(s / 2) * Math.cos(s), Math.sin(s / 2), Math.cos(s / 2) * Math.sin(s));
  return out.set(-Math.sin(s), 0, Math.cos(s)).cross(across).normalize();
}

export function mobiusGeometry(radius: number, half: number, around = 160, across = 6): THREE.BufferGeometry {
  const pos: number[] = [];
  const index: number[] = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= around; i++) {
    for (let j = 0; j <= across; j++) {
      mobiusPoint((i / around) * Math.PI * 2, (j / across * 2 - 1) * half, radius, p);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < around; i++) {
    for (let j = 0; j < across; j++) {
      const a = i * (across + 1) + j;
      const b = a + across + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}
