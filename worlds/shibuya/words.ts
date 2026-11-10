/**
 * The words taught in this world, and the record of how well each is known.
 *
 * A word is first heard by tapping the thing itself. Only words that have been
 * heard are ever asked for. Each right answer moves a word up a box, and words
 * in higher boxes come back less often: the ones she finds hard return soonest.
 */

export interface Word {
  id: string;
  kana: string;
  romaji: string;
  english: string;
}

export const WORDS: Word[] = [
  { id: 'neko', kana: 'ねこ', romaji: 'neko', english: 'cat' },
  { id: 'inu', kana: 'いぬ', romaji: 'inu', english: 'dog' },
  { id: 'kuruma', kana: 'くるま', romaji: 'kuruma', english: 'car' },
  { id: 'densha', kana: 'でんしゃ', romaji: 'densha', english: 'train' },
  { id: 'eki', kana: 'えき', romaji: 'eki', english: 'station' },
  { id: 'mise', kana: 'みせ', romaji: 'mise', english: 'shop' },
  { id: 'ki', kana: 'き', romaji: 'ki', english: 'tree' },
  { id: 'tsuki', kana: 'つき', romaji: 'tsuki', english: 'moon' },
  { id: 'kasa', kana: 'かさ', romaji: 'kasa', english: 'umbrella' },
  { id: 'hito', kana: 'ひと', romaji: 'hito', english: 'person' },
  { id: 'hana', kana: 'はな', romaji: 'hana', english: 'flower' },
  { id: 'tokei', kana: 'とけい', romaji: 'tokei', english: 'clock' },
];

export const wordById = (id: string) => WORDS.find((w) => w.id === id)!;

export interface Progress {
  /** Words she has tapped and heard at least once. */
  heard: string[];
  /** How well each word is known: 0 = new or just missed, up to 4. */
  box: Record<string, number>;
  /** The question number at which each word is next due. */
  due: Record<string, number>;
  /** How many questions have been asked. */
  asked: number;
  /** Words found at least once: these have their tag sprayed on a wall. */
  tagged: string[];
}

const STORE = 'portal-worlds-shibuya-v1';
const GAPS = [1, 3, 7, 16, 40];

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    // Private windows and blocked storage: play still works, it just is not remembered.
  }
  return { heard: [], box: {}, due: {}, asked: 0, tagged: [] };
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(STORE, JSON.stringify(p));
  } catch {
    // See above.
  }
}

/** The next word to ask for, never the same one twice running. */
export function nextWord(p: Progress, last: string | null): Word | null {
  const pool = p.heard.filter((id) => id !== last);
  if (!pool.length) return null;
  const due = pool.filter((id) => (p.due[id] ?? 0) <= p.asked);
  const from = due.length ? due : pool;
  const lowest = Math.min(...from.map((id) => p.box[id] ?? 0));
  const shaky = from.filter((id) => (p.box[id] ?? 0) === lowest);
  return wordById(shaky[Math.floor(Math.random() * shaky.length)]);
}

/** Notes whether a word was found at the first try. */
export function record(p: Progress, id: string, firstTry: boolean): void {
  p.asked++;
  p.box[id] = firstTry ? Math.min(GAPS.length - 1, (p.box[id] ?? 0) + 1) : 0;
  p.due[id] = p.asked + GAPS[p.box[id]];
}
