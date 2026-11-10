import { say, sound } from './speak';
import type { Word } from './words';

/**
 * The test: twenty questions drawn from every word in this world, with no
 * romaji to lean on. Three kinds take turns: hear a word and pick its
 * meaning; read a word and pick its meaning; see a meaning and pick the word.
 * Eighty per cent passes.
 */

export const PASS = 0.8;
const LENGTH = 20;

const shuffle = <T,>(list: T[]): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export function openQuiz(words: Word[], done: (right: number, total: number) => void): void {
  const root = document.getElementById('quiz') as HTMLDivElement;
  const prompt = root.querySelector('.prompt') as HTMLDivElement;
  const kindLine = root.querySelector('.kind') as HTMLDivElement;
  const options = root.querySelector('.options') as HTMLDivElement;
  const tally = root.querySelector('.tally') as HTMLDivElement;
  const hear = root.querySelector('.hear') as HTMLButtonElement;
  const asked = shuffle(words).slice(0, LENGTH);
  let n = 0;
  let right = 0;

  const close = () => {
    root.hidden = true;
  };
  (root.querySelector('.close') as HTMLButtonElement).onclick = close;

  function question(): void {
    if (n >= asked.length) return result();
    const w = asked[n];
    const kind = n % 3; // 0 = listen, 1 = read, 2 = choose the word
    const others = shuffle(words.filter((x) => x.id !== w.id && x.english !== w.english && x.kana !== w.kana)).slice(0, 3);
    const choices = shuffle([w, ...others]);
    tally.textContent = `${n + 1} / ${asked.length}`;
    hear.hidden = kind !== 0;
    hear.onclick = () => say(w.kana);
    if (kind === 0) {
      kindLine.textContent = 'Listen. What does it mean?';
      prompt.textContent = '🔊';
      say(w.kana);
    } else if (kind === 1) {
      kindLine.textContent = 'Read. What does it mean?';
      prompt.textContent = w.kana;
    } else {
      kindLine.textContent = 'Which word is it?';
      prompt.textContent = w.english;
    }
    options.replaceChildren(
      ...choices.map((c) => {
        const b = document.createElement('button');
        b.textContent = kind === 2 ? c.kana : c.english;
        if (kind === 2) b.className = 'kana';
        b.onclick = () => {
          const ok = c.id === w.id;
          if (ok) {
            right++;
            sound.right();
          }
          // Show which was right before moving on, so a miss still teaches.
          for (const other of Array.from(options.children)) (other as HTMLButtonElement).disabled = true;
          b.classList.add(ok ? 'yes' : 'no');
          (options.children[choices.indexOf(w)] as HTMLElement).classList.add('yes');
          n++;
          setTimeout(question, ok ? 600 : 1500);
        };
        return b;
      }),
    );
  }

  function result(): void {
    const passed = right / asked.length >= PASS;
    hear.hidden = true;
    kindLine.textContent = passed ? 'ごうかく！  (gōkaku: you passed)' : 'もう いちど  (mō ichido: once more)';
    prompt.textContent = `${Math.round((right / asked.length) * 100)}%`;
    tally.textContent = `${right} / ${asked.length}`;
    const note = document.createElement('p');
    note.textContent = passed
      ? 'Show this to your mom, and she will build you out an additional level.'
      : `You need ${Math.ceil(PASS * asked.length)} right to pass. Go and find the ones you missed, then try again.`;
    const ok = document.createElement('button');
    ok.textContent = 'OK';
    ok.onclick = close;
    options.replaceChildren(note, ok);
    if (passed) say('ごうかく');
    done(right, asked.length);
  }

  root.hidden = false;
  question();
}
