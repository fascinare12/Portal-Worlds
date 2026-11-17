/**
 * The notes of J. S. Bach's "Canon a 2 per tonos" from the Musical Offering
 * (BWV 1079, 1747), and the rules that turn eight bars into something endless.
 *
 * The piece has three lines. One plays a version of the king's theme. The
 * other two are a canon: the second sings exactly what the first sang one bar
 * earlier, a fifth higher (set down an octave, so it lies a fourth below).
 * The eight bars begin in C minor and end in D minor, so when they come round
 * again everything is one whole tone higher. Six rounds make an octave.
 *
 * Transcribed by eye from a modern typeset score of the public-domain work
 * (the Internet Archive's copy of the IMSLP edition), and checked two ways:
 * each line adds up to exactly eight bars, and the second canon voice as
 * printed matches the first, moved by a bar and a fifth, in every bar.
 *
 * A pitch is a MIDI number (60 is middle C); a length is in sixteenths.
 * `null` is a rest.
 */

export type Note = [pitch: number | null, length: number];

/** Sixteenths in one round of the canon: eight bars of four beats. */
export const ROUND = 128;
export const BAR = 16;

export const BACH_THEME: Note[] = [
  [60, 6], [62, 2], [63, 2], [64, 2], [65, 2], [66, 2],
  [67, 8], [68, 5], [65, 1], [61, 1], [60, 1],
  [59, 4], [null, 8], [67, 8],
  [66, 8], [65, 8],
  [64, 8], [63, 8],
  [62, 6], [61, 2], [58, 2], [57, 2],
  [62, 4], [null, 8], [67, 8],
  [65, 4], [64, 8],
];

export const BACH_LEADER: Note[] = [
  [null, 1], [60, 1], [63, 1], [67, 1], [72, 8], [70, 2], [69, 2],
  [70, 5], [64, 1], [62, 1], [64, 1], [65, 1], [60, 1], [65, 1], [67, 1], [68, 6],
  [68, 2], [67, 2], [65, 2], [63, 5], [65, 1], [63, 1], [62, 1],
  [60, 2], [61, 2], [62, 4], [null, 2], [63, 2], [62, 2], [60, 2],
  [59, 2], [60, 1], [59, 1], [60, 1], [62, 1], [60, 1], [58, 1], [57, 1], [55, 1], [57, 1], [58, 1], [60, 1], [57, 1], [58, 1], [60, 1],
  [62, 2], [72, 4], [70, 1], [69, 1], [70, 2], [67, 2], [64, 2], [69, 1], [67, 1],
  [66, 2], [67, 1], [69, 1], [70, 2], [61, 2], [62, 4], [null, 4],
  [null, 2], [62, 3], [65, 1], [64, 1], [62, 1], [61, 1], [62, 1], [64, 1], [65, 1], [67, 1], [70, 1], [69, 1], [67, 1],
];
/** From the second round on, the leader's opening rest is filled by this note, which joins the end of one round to the start of the next. */
export const LINK = 63;

/** What Bach chose. */
export const BACH = { delay: 16, interval: 7, step: 2 };

export interface Rules {
  /** How far behind the follower sings, in sixteenths. */
  delay: number;
  /** How much higher it sings, in semitones (it is then set down an octave). */
  interval: number;
  /** How much higher each round begins than the last, in semitones. */
  step: number;
}

/** One note as it is placed in the endless piece. */
export interface Placed {
  voice: 0 | 1 | 2;
  /** Its place in its line's list of notes, so that it can be changed. */
  index: number;
  /** When it starts, in sixteenths from the very beginning. */
  at: number;
  length: number;
  /** Its pitch as written in its round, before the round's own rise is added. */
  pitch: number;
  /** How far its round has risen, in semitones. */
  rise: number;
}

export class Score {
  theme: Note[] = BACH_THEME.map((n) => [...n] as Note);
  leader: Note[] = BACH_LEADER.map((n) => [...n] as Note);

  restore(): void {
    this.theme = BACH_THEME.map((n) => [...n] as Note);
    this.leader = BACH_LEADER.map((n) => [...n] as Note);
  }

  /** Every note of one voice that starts in the given round. */
  round(voice: 0 | 1 | 2, round: number, rules: Rules): Placed[] {
    const out: Placed[] = [];
    if (voice === 0) {
      let at = round * ROUND;
      this.theme.forEach(([pitch, length], index) => {
        if (pitch !== null) out.push({ voice, index, at, length, pitch, rise: round * rules.step });
        at += length;
      });
      return out;
    }
    // The follower sings whatever the leader sang `delay` earlier, so its notes in this round
    // come partly from the leader's round before.
    const shift = voice === 2 ? rules.delay : 0;
    const lift = voice === 2 ? rules.interval - 12 : 0;
    for (const r of voice === 2 ? [round - 1, round] : [round]) {
      let at = r * ROUND + shift;
      this.leader.forEach(([pitch, length], index) => {
        const p = pitch ?? (index === 0 && r > 0 ? LINK : null);
        if (p !== null && Math.floor(at / ROUND) === round) out.push({ voice, index, at, length, pitch: p + lift, rise: r * rules.step });
        at += length;
      });
    }
    return out;
  }
}

/** How harsh two notes are together, by the gap between them: 0 for sweet, 1 for the worst. */
export function harsh(a: number, b: number): number {
  const gap = ((Math.round(a - b) % 12) + 12) % 12;
  return gap === 1 || gap === 11 ? 1 : gap === 6 ? 0.7 : gap === 2 || gap === 10 ? 0.5 : 0;
}

/** After how many rounds the music is back in the key it began in. */
export function roundsHome(step: number): number {
  const s = ((step % 12) + 12) % 12;
  if (s === 0) return 1;
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  return 12 / gcd(12, s);
}
