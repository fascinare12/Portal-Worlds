import * as THREE from 'three';
import { lerp, smoothstep } from './noise';
import { WORLD_RADIUS, groundHeight, poolAt } from './world/layout';

/**
 * One continuous camera. Zoomed out it looks down on the whole wood like a map;
 * zooming in lowers it until it stands at child height among the trunks.
 *
 *   drag / one finger ........ move
 *   wheel / pinch ............ zoom
 *   two-finger twist, right-drag, Q/E ... turn
 *   tap ...................... glide to that spot (and lean in if it is a pool)
 *   arrows / WASD, + / - ..... move and zoom from the keyboard
 */

const FAR = 170;
const NEAR = 5;
const FOV = 50;

export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.3, 600);

  /** 0 = whole wood from above, 1 = standing on the forest floor. */
  zoom = 0.22;
  private x = 0;
  private z = 0;
  private yaw = 0.5;
  private goal = { x: 0, z: 0, yaw: 0.5, zoom: 0.22 };

  private pointers = new Map<number, { x: number; y: number }>();
  private tap: { x: number; y: number; t: number } | null = null;
  private pinch: { dist: number; angle: number; cx: number; cy: number } | null = null;
  private keys = new Set<string>();
  private raycaster = new THREE.Raycaster();

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

  private get distance(): number {
    return FAR * Math.pow(NEAR / FAR, this.zoom);
  }

  /** Angle above the horizon: steep from afar, nearly level up close. */
  private get pitch(): number {
    return lerp(1.25, 0.1, smoothstep(0, 1, this.zoom));
  }

  private pan(dx: number, dy: number): void {
    const perPixel = (2 * this.distance * Math.tan((FOV * Math.PI) / 360)) / this.el.clientHeight;
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const forward = (dy * perPixel) / Math.max(Math.sin(this.pitch), 0.4);
    const right = dx * perPixel;
    this.goal.x += -cos * right - sin * forward;
    this.goal.z += sin * right - cos * forward;
    this.clampGoal();
  }

  private clampGoal(): void {
    const d = Math.hypot(this.goal.x, this.goal.z);
    if (d > WORLD_RADIUS) {
      this.goal.x *= WORLD_RADIUS / d;
      this.goal.z *= WORLD_RADIUS / d;
    }
    this.goal.zoom = Math.min(1, Math.max(0, this.goal.zoom));
  }

  private onDown = (e: PointerEvent): void => {
    this.el.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.tap = this.pointers.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
    this.pinch = null;
  };

  private onMove = (e: PointerEvent): void => {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX;
    prev.y = e.clientY;

    if (this.pointers.size === 1) {
      if (e.buttons & 2) this.goal.yaw -= dx * 0.006;
      else this.pan(dx, dy);
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const now = {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
      if (this.pinch) {
        this.goal.zoom += Math.log(now.dist / Math.max(this.pinch.dist, 1)) * 0.35;
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
    this.pointers.delete(e.pointerId);
    this.pinch = null;
    const t = this.tap;
    this.tap = null;
    if (!t || e.type === 'pointercancel') return;
    if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > 10 || performance.now() - t.t > 400) return;
    this.goTo(e.clientX, e.clientY);
  };

  /** Tap: glide to the tapped spot. Tapping a pool also leans in for a close look. */
  private goTo(clientX: number, clientY: number): void {
    const rect = this.el.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
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
    this.goal.zoom -= delta;
    this.clampGoal();
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
    const ease = 1 - Math.exp(-dt * 7);
    this.x = lerp(this.x, this.goal.x, ease);
    this.z = lerp(this.z, this.goal.z, ease);
    this.yaw = lerp(this.yaw, this.goal.yaw, ease);
    this.zoom = lerp(this.zoom, this.goal.zoom, ease);

    const d = this.distance;
    const p = this.pitch;
    const lookY = groundHeight(this.x, this.z) + lerp(0, 1.3, this.zoom);
    const cam = this.camera.position;
    cam.set(
      this.x + Math.sin(this.yaw) * Math.cos(p) * d,
      lookY + Math.sin(p) * d,
      this.z + Math.cos(this.yaw) * Math.cos(p) * d,
    );
    // Never dip below the ground or a pool's surface.
    cam.y = Math.max(cam.y, groundHeight(cam.x, cam.z) + 1.1);
    this.camera.lookAt(this.x, lookY, this.z);
  }
}
