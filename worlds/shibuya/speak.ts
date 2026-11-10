/**
 * Says Japanese aloud using the voice built into the device, and makes the
 * world's few sounds. Whether a Japanese voice exists, and how good it is,
 * depends on the device: `hasVoice()` reports whether one was found.
 */

let voice: SpeechSynthesisVoice | null = null;

function findVoice(): void {
  if (!('speechSynthesis' in window)) return;
  const all = window.speechSynthesis.getVoices().filter((v) => /^ja([-_]|$)/i.test(v.lang));
  // Prefer a voice that runs on the device itself, so it works without a connection.
  voice = all.find((v) => v.localService) ?? all[0] ?? null;
}
if ('speechSynthesis' in window) {
  findVoice();
  window.speechSynthesis.addEventListener('voiceschanged', findVoice);
}

export const hasVoice = () => voice !== null;

/** Speaks Japanese text. Spaces are removed first, so particles are read correctly. */
export function say(text: string): void {
  if (!('speechSynthesis' in window)) return;
  findVoice();
  const u = new SpeechSynthesisUtterance(text.replace(/\s+/g, ''));
  u.lang = 'ja-JP';
  if (voice) u.voice = voice;
  u.rate = 0.82; // a little slower than natural, for a beginner
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

let ctx: AudioContext | null = null;
function note(freq: number, length: number, delay = 0, loud = 0.12, to = freq): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + length);
    gain.gain.setValueAtTime(loud, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + length + 0.02);
  } catch {
    // No sound on this device; carry on without it.
  }
}

export const sound = {
  right: () => {
    note(660, 0.14);
    note(880, 0.14, 0.1);
    note(1320, 0.3, 0.2);
  },
  /** A spray can: a short hiss made of high, falling tones. */
  spray: () => {
    for (let i = 0; i < 5; i++) note(3000 + Math.random() * 3000, 0.12, i * 0.05, 0.02, 1500);
  },
  boom: () => note(120, 0.5, 0, 0.18, 40),
};
