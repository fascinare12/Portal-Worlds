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
  /** Food and drink at the stall are asked for, not looked for: "〜 を ください". */
  food?: boolean;
  /** Painted on a wall as a picture, because it has no place in a city street. */
  mural?: boolean;
  /** Found inside the convenience store. */
  store?: boolean;
}

export const WORDS: Word[] = [
  // The street.
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
  { id: 'hoshi', kana: 'ほし', romaji: 'hoshi', english: 'star' },
  // The food stall, down the street to the right of the crossing.
  { id: 'ringo', kana: 'りんご', romaji: 'ringo', english: 'apple', food: true },
  { id: 'onigiri', kana: 'おにぎり', romaji: 'onigiri', english: 'rice ball', food: true },
  { id: 'sushi', kana: 'すし', romaji: 'sushi', english: 'sushi', food: true },
  { id: 'ocha', kana: 'おちゃ', romaji: 'ocha', english: 'tea', food: true },
  { id: 'mizu', kana: 'みず', romaji: 'mizu', english: 'water', food: true },
  { id: 'sakana', kana: 'さかな', romaji: 'sakana', english: 'fish', food: true },
  // The café terrace, to the left of the crossing.
  { id: 'isu', kana: 'いす', romaji: 'isu', english: 'chair' },
  { id: 'hon', kana: 'ほん', romaji: 'hon', english: 'book' },
  { id: 'kaban', kana: 'かばん', romaji: 'kaban', english: 'bag' },
  { id: 'jitensha', kana: 'じてんしゃ', romaji: 'jitensha', english: 'bicycle' },
  { id: 'tori', kana: 'とり', romaji: 'tori', english: 'bird' },
  // Murals: common words with no place in a city street, painted on the walls.
  { id: 'yama', kana: 'やま', romaji: 'yama', english: 'mountain', mural: true },
  { id: 'umi', kana: 'うみ', romaji: 'umi', english: 'sea', mural: true },
  { id: 'taiyou', kana: 'たいよう', romaji: 'taiyō', english: 'sun', mural: true },
  { id: 'kumo', kana: 'くも', romaji: 'kumo', english: 'cloud', mural: true },
  { id: 'niji', kana: 'にじ', romaji: 'niji', english: 'rainbow', mural: true },
  { id: 'ame', kana: 'あめ', romaji: 'ame', english: 'rain', mural: true },
  { id: 'yuki', kana: 'ゆき', romaji: 'yuki', english: 'snow', mural: true },
  { id: 'hi', kana: 'ひ', romaji: 'hi', english: 'fire', mural: true },
  { id: 'ie', kana: 'いえ', romaji: 'ie', english: 'house', mural: true },
  { id: 'fune', kana: 'ふね', romaji: 'fune', english: 'boat', mural: true },
  { id: 'me', kana: 'め', romaji: 'me', english: 'eye', mural: true },
  { id: 'te', kana: 'て', romaji: 'te', english: 'hand', mural: true },
  { id: 'usagi', kana: 'うさぎ', romaji: 'usagi', english: 'rabbit', mural: true },
  { id: 'hebi', kana: 'へび', romaji: 'hebi', english: 'snake', mural: true },
  // Inside the convenience store. Things on the shelves are asked for with を ください.
  { id: 'obentou', kana: 'おべんとう', romaji: 'obentō', english: 'boxed lunch', food: true, store: true },
  { id: 'okashi', kana: 'おかし', romaji: 'okashi', english: 'snacks, sweets', food: true, store: true },
  { id: 'tamago', kana: 'たまご', romaji: 'tamago', english: 'egg', food: true, store: true },
  { id: 'gyuunyuu', kana: 'ぎゅうにゅう', romaji: 'gyūnyū', english: 'milk', food: true, store: true },
  { id: 'mikan', kana: 'みかん', romaji: 'mikan', english: 'mandarin orange', food: true, store: true },
  { id: 'momo', kana: 'もも', romaji: 'momo', english: 'peach', food: true, store: true },
  { id: 'ichigo', kana: 'いちご', romaji: 'ichigo', english: 'strawberry', food: true, store: true },
  { id: 'yasai', kana: 'やさい', romaji: 'yasai', english: 'vegetables', food: true, store: true },
  { id: 'zasshi', kana: 'ざっし', romaji: 'zasshi', english: 'magazine', food: true, store: true },
  { id: 'kago', kana: 'かご', romaji: 'kago', english: 'basket', food: true, store: true },
  { id: 'okane', kana: 'おかね', romaji: 'okane', english: 'money', store: true },
  { id: 'tenin', kana: 'てんいん', romaji: "ten'in", english: 'shop clerk', store: true },
  // More on the store's shelves.
  { id: 'enpitsu', kana: 'えんぴつ', romaji: 'enpitsu', english: 'pencil', food: true, store: true },
  { id: 'hasami', kana: 'はさみ', romaji: 'hasami', english: 'scissors', food: true, store: true },
  { id: 'sekken', kana: 'せっけん', romaji: 'sekken', english: 'soap', food: true, store: true },
  { id: 'haburashi', kana: 'はぶらし', romaji: 'haburashi', english: 'toothbrush', food: true, store: true },
  { id: 'kutsushita', kana: 'くつした', romaji: 'kutsushita', english: 'socks', food: true, store: true },
  { id: 'tebukuro', kana: 'てぶくろ', romaji: 'tebukuro', english: 'gloves', food: true, store: true },
  { id: 'boushi', kana: 'ぼうし', romaji: 'bōshi', english: 'hat', food: true, store: true },
  { id: 'denchi', kana: 'でんち', romaji: 'denchi', english: 'battery', food: true, store: true },
  { id: 'shinbun', kana: 'しんぶん', romaji: 'shinbun', english: 'newspaper', food: true, store: true },
  { id: 'toufu', kana: 'とうふ', romaji: 'tōfu', english: 'tofu', food: true, store: true },
  { id: 'shouyu', kana: 'しょうゆ', romaji: 'shōyu', english: 'soy sauce', food: true, store: true },
  { id: 'senbei', kana: 'せんべい', romaji: 'senbei', english: 'rice cracker', food: true, store: true },
  { id: 'dango', kana: 'だんご', romaji: 'dango', english: 'sweet dumplings on a stick', food: true, store: true },
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
  /** Words found at least once: these have their outline on a wall. */
  tagged: string[];
  /** Words she has written herself with the spray can: these are filled in. */
  sprayed?: string[];
  /** Shopping lists completed in the store: one stamp each. */
  stamps?: number;
  /** Every test taken: when, and how many right out of how many. */
  tests?: { date: string; right: number; total: number }[];
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
  return { heard: [], box: {}, due: {}, asked: 0, tagged: [], sprayed: [] };
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(STORE, JSON.stringify(p));
  } catch {
    // See above.
  }
}

/** The next word to ask for, never the same one twice running. */
/** `here` lists the words that can be found where she is standing, so she is never asked for something in another room. */
export function nextWord(p: Progress, last: string | null, here: Set<string>): Word | null {
  const pool = p.heard.filter((id) => id !== last && here.has(id));
  if (!pool.length) return null;
  const due = pool.filter((id) => (p.due[id] ?? 0) <= p.asked);
  const from = due.length ? due : pool;
  const lowest = Math.min(...from.map((id) => p.box[id] ?? 0));
  const shaky = from.filter((id) => (p.box[id] ?? 0) === lowest);
  return wordById(shaky[Math.floor(Math.random() * shaky.length)]);
}

/** Several different words to ask for at once, shakiest first. */
export function nextFew(p: Progress, here: Set<string>, count: number, want: (w: Word) => boolean): Word[] {
  const pool = p.heard.filter((id) => here.has(id) && want(wordById(id)));
  pool.sort((a, b) => (p.box[a] ?? 0) - (p.box[b] ?? 0) + (Math.random() - 0.5) * 0.9);
  return pool.slice(0, count).map(wordById);
}

/** Notes whether a word was found at the first try. */
export function record(p: Progress, id: string, firstTry: boolean): void {
  p.asked++;
  p.box[id] = firstTry ? Math.min(GAPS.length - 1, (p.box[id] ?? 0) + 1) : 0;
  p.due[id] = p.asked + GAPS[p.box[id]];
}
