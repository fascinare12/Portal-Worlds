import * as THREE from 'three';
import { lerp, smoothstep } from './noise';
import { WORLD_RADIUS, groundHeight, poolAt, trees } from './world/layout';
import type { Tree } from './world/layout';

/**
 * One continuous camera. Zoomed out it looks down on the whole wood like a map;
 * zooming in lowers it until it stands at child height among the trunks.
 *
 *   drag / one finger ........ move (a flick keeps gliding)
 *   wheel / pinch ............ zoom, towards the finger or cursor
 *   two-finger twist, right-drag, Q/E ... turn
 *   tap ...................... glide to that spot (and lean in if it is a pool)
 *   arrows / WASD, + / - ..... move and zoom from the keyboard
 */

const FAR = 170;
const NEAR = 5;
const FOV = 50;

interface View {
  x: number;
  z: number;
  yaw: number;
  zoom: number;
}

const distanceAt = (zoom: number) => FAR * Math.pow(NEAR / FAR, zoom);
/** Angle above the horizon: steep from afar, nearly level up close. */
const pitchAt = (zoom: number) => lerp(1.25, 0.1, smoothstep(0, 1, zoom));
const eyeLiftAt = (zoom: number) => lerp(0, 1.3, zoom);

/** Places a camera for a view and returns the height it looks at. */
function place(cam: THREE.PerspectiveCamera, v: View): number {
  const d = distanceAt(v.zoom);
  const p = pitchAt(v.zoom);
  const lookY = groundHeight(v.x, v.z) + eyeLiftAt(v.zoom);
  cam.position.set(
    v.x + Math.sin(v.yaw) * Math.cos(p) * d,
    lookY + Math.sin(p) * d,
    v.z + Math.cos(v.yaw) * Math.cos(p) * d,
  );
  cam.lookAt(v.x, lookY, v.z);
  return lookY;
}

// Trees sorted into a grid so the camera only checks the few trunks near it.
const CELL = 8;
const grid = new Map<string, Tree[]>();
for (const t of trees) {
  const key = `${Math.floor(t.x / CELL)},${Math.floor(t.z / CELL)}`;
  let list = grid.get(key);
  if (!list) grid.set(key, (list = []));
  list.push(t);
}

export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.3, 600);

  private now: View = { x: 0, z: 0, yaw: 0.5, zoom: 0.22 };
  private goal: View = { ...this.now };

  private pointers = new Map<number, { x: number; y: number }>();
  private tap: { x: number; y: number; t: number } | null = null;
  private pinch: { dist: number; angle: number; cx: number; cy: number } | null = null;
  private keys = new Set<string>();
  private raycaster = new THREE.Raycaster();
  private probe = new THREE.PerspectiveCamera(FOV, 1, 0.3, 600);

  // Momentum: how fast the last drag was moving the view, in world units per second.
  private dragVel = { x: 0, z: 0 };
  private glide = { x: 0, z: 0 };
  private lastDrag = 0;
  private stride = 0;

  constructor(
    private el: HTMLCanvasElement,
    private ground: THREE.Object3D,
  ) {
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointercancel', this.onUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => this.keys.add(e.key.toLowerCase()));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }

  /** 0 = whole wood from above, 1 = standing on the forest floor. */
  get zoom(): number {
    return this.now.zoom;
  }

  /** Moves the view by a drag of this many pixels; returns the world distance moved. */
  private pan(dx: number, dy: number): { x: number; z: number } {
    const zoom = this.goal.zoom;
    const perPixel = (2 * distanceAt(zoom) * Math.tan((FOV * Math.PI) / 360)) / this.el.clientHeight;
    const sin = Math.sin(this.goal.yaw);
    const cos = Math.cos(this.goal.yaw);
    const forward = (dy * perPixel) / Math.max(Math.sin(pitchAt(zoom)), 0.4);
    const right = dx * perPixel;
    const move = { x: -cos * right - sin * forward, z: sin * right - cos * forward };
    this.goal.x += move.x;
    this.goal.z += move.z;
    this.clampGoal();
    return move;
  }

  private clampGoal(): void {
    const d = Math.hypot(this.goal.x, this.goal.z);
    if (d > WORLD_RADIUS) {
      this.goal.x *= WORLD_RADIUS / d;
      this.goal.z *= WORLD_RADIUS / d;
      this.glide.x = this.glide.z = 0;
    }
    this.goal.zoom = Math.min(1, Math.max(0, this.goal.zoom));
  }

  private ndc(clientX: number, clientY: number): THREE.Vector2 {
    const rect = this.el.getBoundingClientRect();
    return new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  /** The spot on the ground under a screen point, as seen from a given view. */
  private groundUnder(clientX: number, clientY: number, v: View): { x: number; z: number } | null {
    this.probe.aspect = this.camera.aspect;
    this.probe.updateProjectionMatrix();
    const lookY = place(this.probe, v);
    this.probe.updateMatrixWorld();
    this.raycaster.setFromCamera(this.ndc(clientX, clientY), this.probe);
    const { origin, direction } = this.raycaster.ray;
    if (direction.y > -0.08) return null; // looking at the horizon or sky
    const t = (lookY - origin.y) / direction.y;
    const x = origin.x + direction.x * t;
    const z = origin.z + direction.z * t;
    if (Math.hypot(x - v.x, z - v.z) > distanceAt(v.zoom) * 1.5) return null;
    return { x, z };
  }

  /** Zooms while keeping the ground under the finger or cursor where it is. */
  private zoomAt(amount: number, clientX: number, clientY: number): void {
    const before = this.groundUnder(clientX, clientY, this.goal);
    this.goal.zoom = Math.min(1, Math.max(0, this.goal.zoom + amount));
    const after = before && this.groundUnder(clientX, clientY, this.goal);
    if (before && after) {
      this.goal.x += before.x - after.x;
      this.goal.z += before.z - after.z;
    }
    this.clampGoal();
  }

  private onDown = (e: PointerEvent): void => {
    this.el.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.tap = this.pointers.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
    this.pinch = null;
    this.glide.x = this.glide.z = 0; // a touch catches the gliding view
    this.dragVel.x = this.dragVel.z = 0;
  };

  private onMove = (e: PointerEvent): void => {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX;
    prev.y = e.clientY;

    if (this.pointers.size === 1) {
      if (e.buttons & 2) {
        this.goal.yaw -= dx * 0.006;
        return;
      }
      const move = this.pan(dx, dy);
      const t = performance.now();
      const dt = Math.max(0.004, (t - this.lastDrag) / 1000);
      this.lastDrag = t;
      if (dt < 0.1) {
        this.dragVel.x = lerp(this.dragVel.x, move.x / dt, 0.4);
        this.dragVel.z = lerp(this.dragVel.z, move.z / dt, 0.4);
      }
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const now = {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
      if (this.pinch) {
        this.zoomAt(Math.log(now.dist / Math.max(this.pinch.dist, 1)) * 0.35, now.cx, now.cy);
        let turn = now.angle - this.pinch.angle;
        if (turn > Math.PI) turn -= Math.PI * 2;
        if (turn < -Math.PI) turn += Math.PI * 2;
        this.goal.yaw += turn;
        this.pan(now.cx - this.pinch.cx, now.cy - this.pinch.cy);
      }
      this.pinch = now;
    }
  };

  private onUp = (e: PointerEvent): void => {
    const wasDragging = this.pointers.size === 1;
    this.pointers.delete(e.pointerId);
    this.pinch = null;
    const t = this.tap;
    this.tap = null;
    if (e.type === 'pointercancel') return;
    const isTap = t && Math.hypot(e.clientX - t.x, e.clientY - t.y) <= 10 && performance.now() - t.t <= 400;
    if (isTap) {
      this.goTo(e.clientX, e.clientY);
    } else if (wasDragging && performance.now() - this.lastDrag < 90) {
      // Let go mid-flick: the view keeps gliding and slows to a stop.
      this.glide.x = this.dragVel.x;
      this.glide.z = this.dragVel.z;
    }
  };

  /** Tap: glide to the tapped spot. Tapping a pool also leans in for a close look. */
  private goTo(clientX: number, clientY: number): void {
    this.raycaster.setFromCamera(this.ndc(clientX, clientY), this.camera);
    const hit = this.raycaster.intersectObject(this.ground)[0];
    if (!hit) return;
    const pool = poolAt(hit.point.x, hit.point.z);
    this.goal.x = pool ? pool.x : hit.point.x;
    this.goal.z = pool ? pool.z : hit.point.z;
    if (pool) this.goal.zoom = Math.max(this.goal.zoom, 0.72);
    this.clampGoal();
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const delta = Math.max(-120, Math.min(120, e.deltaY)) * (e.ctrlKey ? 0.004 : 0.0011);
    this.zoomAt(-delta, e.clientX, e.clientY);
  };

  private applyKeys(dt: number): void {
    const k = this.keys;
    const speed = 500 * dt;
    if (k.has('arrowleft') || k.has('a')) this.pan(speed, 0);
    if (k.has('arrowright') || k.has('d')) this.pan(-speed, 0);
    if (k.has('arrowup') || k.has('w')) this.pan(0, speed);
    if (k.has('arrowdown') || k.has('s')) this.pan(0, -speed);
    if (k.has('q')) this.goal.yaw += dt * 1.2;
    if (k.has('e')) this.goal.yaw -= dt * 1.2;
    if (k.has('+') || k.has('=')) this.goal.zoom += dt * 0.5;
    if (k.has('-') || k.has('_')) this.goal.zoom -= dt * 0.5;
    this.clampGoal();
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number): void {
    this.applyKeys(dt);

    if (Math.abs(this.glide.x) + Math.abs(this.glide.z) > 0.02) {
      this.goal.x += this.glide.x * dt;
      this.goal.z += this.glide.z * dt;
      const slow = Math.exp(-dt * 3.2);
      this.glide.x *= slow;
      this.glide.z *= slow;
      this.clampGoal();
    }

    const ease = 1 - Math.exp(-dt * 9);
    const px = this.now.x;
    const pz = this.now.z;
    this.now.x = lerp(this.now.x, this.goal.x, ease);
    this.now.z = lerp(this.now.z, this.goal.z, ease);
    this.now.yaw = lerp(this.now.yaw, this.goal.yaw, ease);
    this.now.zoom = lerp(this.now.zoom, this.goal.zoom, 1 - Math.exp(-dt * 6));

    const lookY = place(this.camera, this.now);
    const cam = this.camera.position;

    // Down among the trees, step round trunks instead of passing through them.
    const cx = Math.floor(cam.x / CELL);
    const cz = Math.floor(cam.z / CELL);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (const t of grid.get(`${cx + i},${cz + j}`) ?? []) {
          if (cam.y > t.base + t.h) continue;
          const keep = 0.5 * (1 + t.h * 0.07) + 0.7;
          const dx = cam.x - t.x;
          const dz = cam.z - t.z;
          const d = Math.hypot(dx, dz);
          if (d < keep && d > 0.001) {
            cam.x = t.x + (dx / d) * keep;
            cam.z = t.z + (dz / d) * keep;
          }
        }
      }
    }

    // Never dip below the ground or a pool's surface.
    cam.y = Math.max(cam.y, groundHeight(cam.x, cam.z) + 1.1);

    // A slight rise and fall with each step when walking at child height.
    this.stride += Math.hypot(this.now.x - px, this.now.z - pz) * 1.5;
    const bob = Math.sin(this.stride) * 0.045 * smoothstep(0.7, 1, this.now.zoom);
    cam.y += bob;
    this.camera.lookAt(this.now.x, lookY + bob, this.now.z);
  }
}
