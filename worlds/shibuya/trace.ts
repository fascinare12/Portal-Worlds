import { say, sound } from './speak';
import strokeData from './strokes.json';
import type { Word } from './words';

/**
 * Writing with a spray can. A word's kana come up on a wall one at a time,
 * and she traces each stroke in the proper order and direction. The stroke
 * she is on shows where to start and which way to go; paint only goes on
 * while she follows it. Stroke order comes from the KanjiVG project (see
 * CREDITS.md), so it is the standard handwritten order.
 */

const STROKES = strokeData as Record<string, string[]>;
/** KanjiVG draws every character in a box this many units square. */
const BOX = 109;

interface Pt {
  x: number;
  y: number;
}

/** Points along a stroke, evenly spaced, in the direction it is written. */
function sample(d: string): Pt[] {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  const length = path.getTotalLength();
  const n = Math.max(6, Math.round(length / 3));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const p = path.getPointAtLength((i / n) * length);
    pts.push({ x: p.x / BOX, y: p.y / BOX });
  }
  return pts;
}

const NEON = ['#ff4fa3', '#39e6ff', '#ffe14a', '#8cff6a', '#c58bff', '#ff7a3a'];

export function openTrace(word: Word, done: (finished: boolean) => void): void {
  const root = document.getElementById('trace') as HTMLDivElement;
  const canvas = root.querySelector('canvas') as HTMLCanvasElement;
  const title = root.querySelector('.word') as HTMLDivElement;
  const g = canvas.getContext('2d')!;
  const chars = [...word.kana].filter((c) => STROKES[c]);
  const colour = NEON[Math.floor(Math.random() * NEON.length)];

  let charIndex = 0;
  let strokes: Pt[][] = [];
  let strokeIndex = 0;
  let reached = 0; // how far along the current stroke she has sprayed
  let spraying = false;
  let pause = 0; // a short rest after finishing a character
  let open = true;
  let size = 0;
  let last = performance.now();

  function layout(): void {
    size = Math.floor(Math.min(window.innerWidth * 0.92, window.innerHeight * 0.68));
    const ratio = Math.min(window.devicePixelRatio, 2);
    canvas.style.width = canvas.style.height = `${size}px`;
    canvas.width = canvas.height = size * ratio;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawTitle(): void {
    title.replaceChildren(
      ...chars.map((c, i) => {
        const span = document.createElement('span');
        span.textContent = c;
        span.className = i < charIndex ? 'done' : i === charIndex ? 'now' : '';
        return span;
      }),
    );
  }

  function load(): void {
    strokes = STROKES[chars[charIndex]].map(sample);
    strokeIndex = 0;
    reached = 0;
    drawTitle();
  }

  function line(pts: Pt[], upTo: number): void {
    g.beginPath();
    pts.slice(0, upTo + 1).forEach((p, i) => (i ? g.lineTo(p.x * size, p.y * size) : g.moveTo(p.x * size, p.y * size)));
    g.stroke();
  }

  function draw(time: number): void {
    // The wall: dark, mottled concrete.
    g.fillStyle = '#1d1a30';
    g.fillRect(0, 0, size, size);
    g.strokeStyle = 'rgba(255,255,255,0.05)';
    g.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      g.beginPath();
      g.moveTo(0, (i / 6) * size);
      g.lineTo(size, (i / 6) * size);
      g.stroke();
    }
    g.lineCap = g.lineJoin = 'round';

    // The whole character, faintly, so she can see what she is making.
    g.strokeStyle = 'rgba(255,255,255,0.13)';
    g.lineWidth = size * 0.075;
    g.shadowBlur = 0;
    for (const s of strokes) line(s, s.length - 1);

    // Paint already on the wall.
    g.strokeStyle = colour;
    g.shadowColor = colour;
    g.shadowBlur = size * 0.04;
    g.lineWidth = size * 0.07;
    strokes.forEach((s, i) => {
      if (i < strokeIndex) line(s, s.length - 1);
      else if (i === strokeIndex && reached > 0) line(s, reached);
    });
    g.shadowBlur = 0;

    // The stroke to write now: a dashed path, a pulsing dot where it starts, and a marker running along it.
    const now = strokes[strokeIndex];
    if (now && pause <= 0) {
      g.setLineDash([size * 0.012, size * 0.03]);
      g.strokeStyle = 'rgba(255,255,255,0.75)';
      g.lineWidth = size * 0.008;
      line(now, now.length - 1);
      g.setLineDash([]);
      const start = now[Math.min(reached, now.length - 1)];
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(start.x * size, start.y * size, size * (0.028 + 0.008 * Math.sin(time * 6)), 0, 6.3);
      g.fill();
      const runner = now[Math.floor(((time * 0.7) % 1) * (now.length - 1))];
      g.fillStyle = 'rgba(255,255,255,0.6)';
      g.beginPath();
      g.arc(runner.x * size, runner.y * size, size * 0.014, 0, 6.3);
      g.fill();
      // Which stroke this is.
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.font = `700 ${size * 0.045}px system-ui, sans-serif`;
      g.fillText(String(strokeIndex + 1), now[0].x * size - size * 0.07, now[0].y * size - size * 0.03);
    }
  }

  function spray(x: number, y: number): void {
    const now = strokes[strokeIndex];
    if (!now || pause > 0) return;
    const near = (p: Pt) => Math.hypot(p.x * size - x, p.y * size - y) < size * 0.1;
    // Paint advances only while the can is over the next part of the stroke.
    let moved = false;
    while (reached < now.length - 1 && (near(now[reached + 1]) || (reached + 2 < now.length && near(now[reached + 2])))) {
      reached++;
      moved = true;
    }
    if (reached === 0 && near(now[0])) moved = true;
    if (moved && Math.random() < 0.3) sound.spray();
    if (reached >= now.length - 1) {
      strokeIndex++;
      reached = 0;
      if (strokeIndex >= strokes.length) {
        // The character is finished: say it, rest a moment, move on.
        say(chars[charIndex]);
        pause = 1.1;
      }
    }
  }

  const point = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    spray(e.clientX - r.left, e.clientY - r.top);
  };
  const down = (e: PointerEvent) => {
    spraying = true;
    canvas.setPointerCapture(e.pointerId);
    point(e);
  };
  const move = (e: PointerEvent) => {
    if (spraying) point(e);
  };
  const up = () => (spraying = false);

  function close(finished: boolean): void {
    open = false;
    root.hidden = true;
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    window.removeEventListener('resize', layout);
    done(finished);
  }

  function frame(): void {
    if (!open) return;
    const t = performance.now();
    const dt = (t - last) / 1000;
    last = t;
    if (pause > 0) {
      pause -= dt;
      if (pause <= 0) {
        charIndex++;
        if (charIndex >= chars.length) {
          say(word.kana);
          sound.right();
          close(true);
          return;
        }
        load();
      }
    }
    draw(t / 1000);
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  window.addEventListener('resize', layout);
  (root.querySelector('.close') as HTMLButtonElement).onclick = () => close(false);
  (root.querySelector('.hear') as HTMLButtonElement).onclick = () => say(chars[charIndex] ?? word.kana);
  (root.querySelector('.meaning') as HTMLDivElement).textContent = `${word.romaji} · ${word.english}`;
  root.hidden = false;
  layout();
  load();
  say(word.kana);
  requestAnimationFrame(frame);
}
