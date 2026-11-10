/**
 * Small sounds made on the spot, so there is nothing to download: a knock
 * when a block lands, a chime for a right answer, a rattle when blocks arrive.
 * Browsers only allow sound after a tap, and everything here follows one.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null; // no sound on this device; the game carries on without it
  }
}

function note(freq: number, length: number, delay = 0, shape: OscillatorType = 'triangle', loud = 0.16, slideTo = freq): void {
  const a = audio();
  if (!a) return;
  const start = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = shape;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + length);
  gain.gain.setValueAtTime(loud, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(a.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

export const sound = {
  /** A block set down: a short knock, a little different each time. */
  place: () => note(380 + Math.random() * 160, 0.09, 0, 'triangle', 0.2, 180),
  /** A block taken back. */
  remove: () => note(260, 0.1, 0, 'sine', 0.14, 420),
  /** A right answer. */
  right: () => {
    note(660, 0.14);
    note(990, 0.22, 0.1);
  },
  /** A missed answer: soft, not a buzzer. */
  wrong: () => note(240, 0.3, 0, 'sine', 0.14, 170),
  /** Blocks arriving: a quick rattle. */
  deliver: () => {
    for (let i = 0; i < 6; i++) note(300 + Math.random() * 260, 0.06, 0.12 + i * 0.05, 'square', 0.06, 200);
  },
  /** A firework. */
  boom: () => {
    note(140, 0.5, 0, 'sine', 0.22, 40);
    note(1400 + Math.random() * 900, 0.35, 0.05, 'triangle', 0.05, 500);
  },
  /** The building is finished. */
  fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => note(f, 0.28, i * 0.14, 'triangle', 0.16)),
  /** The rocket's engines. */
  launch: () => note(70, 5, 0, 'sawtooth', 0.12, 200),
  /** The sphinx notices you. */
  sphinx: () => {
    note(196, 0.4, 0, 'sine', 0.16);
    note(147, 0.6, 0.25, 'sine', 0.16);
  },
};
