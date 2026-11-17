/**
 * The sound of the canon: notes that can rise for ever.
 *
 * Each note is a small stack of the same note in several octaves. A soft bell
 * curve over pitch decides how loud each one is, and the curve stays where the
 * note was written while the stack slides up with every round. After twelve
 * semitones the stack is exactly what it was at the start, so six rounds of
 * Bach's canon arrive home without ever having jumped down. (The idea is
 * Roger Shepard's, 1964.)
 */

export class Voices {
  ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  on = true;

  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = this.on ? 0.9 : 0;
    const squash = ctx.createDynamicsCompressor();
    master.connect(squash).connect(ctx.destination);
    // A hall made of nothing but mist: a few seconds of fading noise to ring in.
    const len = Math.floor(ctx.sampleRate * 2.6);
    const hall = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = hall.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const room = ctx.createConvolver();
    room.buffer = hall;
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    master.connect(room).connect(wet).connect(ctx.destination);
    this.out = master;
  }

  setOn(on: boolean): void {
    this.on = on;
    if (this.ctx && this.out) this.out.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
  }

  /**
   * One note. `pitch` is where it is written; `rise` is how far its round has climbed.
   * `pan` places the voice left or right, and `gain` sets how loud it is.
   */
  note(when: number, seconds: number, pitch: number, rise: number, pan: number, gain: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.out || !this.on) return;
    const t = Math.max(when, ctx.currentTime + 0.005);
    const env = ctx.createGain();
    const hold = Math.max(0.09, seconds * 0.94);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.012);
    env.gain.exponentialRampToValueAtTime(gain * 0.5, t + Math.min(0.35, hold));
    env.gain.setValueAtTime(gain * 0.5, t + hold);
    env.gain.exponentialRampToValueAtTime(0.0004, t + hold + 0.16);
    const side = ctx.createStereoPanner();
    side.pan.value = pan;
    env.connect(side).connect(this.out);
    const up = ((rise % 12) + 12) % 12;
    for (let octave = -3; octave <= 2; octave++) {
      const sounding = pitch + up + octave * 12;
      const weight = Math.exp(-0.5 * ((sounding - pitch) / 7) ** 2);
      if (weight < 0.04) continue;
      const osc = ctx.createOscillator();
      // A little brightness on top of the pure tone, so that quick notes speak.
      osc.type = 'triangle';
      osc.frequency.value = 440 * Math.pow(2, (sounding - 69) / 12);
      const level = ctx.createGain();
      level.gain.value = weight;
      osc.connect(level).connect(env);
      osc.start(t);
      osc.stop(t + hold + 0.2);
    }
  }

  /** A small bell, for when a rule is found. */
  chime(pitch = 84): void {
    const ctx = this.ctx;
    if (!ctx) return;
    [0, 7, 12].forEach((add, i) => this.note(ctx.currentTime + i * 0.09, 0.7, pitch + add - 12, 0, 0, 0.12));
  }
  /** A dull knock, for a round that does not join. */
  knock(): void {
    const ctx = this.ctx;
    if (!ctx || !this.out || !this.on) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(env).connect(this.out);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}
