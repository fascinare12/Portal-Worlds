import './spire.css';
import { SKINS } from './draw';
import type { Skin } from './draw';
import { Voices } from './sound';
import { seeded } from './system';

/**
 * What every chamber page of the Spire shares: the page itself, the sound,
 * the ◉ button (inside or outside), what is kept in the browser, and a
 * runner for practice puzzles that are made fresh each time.
 */

export interface Kept {
  chapter: boolean;
  practice: Record<string, { seen: number; right: number }>;
  streak: number;
}

export class Shell {
  page = document.getElementById('page') as HTMLElement;
  params = new URLSearchParams(window.location.search);
  practising = this.params.has('practice');
  sound = new Voices();
  kept: Kept = { chapter: false, practice: {}, streak: 0 };
  /** Whether she is looking from outside (◉). */
  above = false;
  render: () => void = () => {};
  private eye = document.getElementById('eye') as HTMLElement;

  constructor(private key: string) {
    try {
      const saved = JSON.parse((!this.params.has('fresh') && localStorage.getItem(key)) || 'null');
      if (saved) this.kept = { ...this.kept, ...saved };
    } catch {
      // nothing kept
    }
    this.eye.onclick = () => {
      this.above = !this.above;
      this.draw();
    };
    const note = document.getElementById('sound') as HTMLElement;
    note.onclick = () => {
      this.sound.start();
      this.sound.setOn(!this.sound.on);
      note.style.opacity = this.sound.on ? '1' : '0.4';
    };
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) window.location.reload();
    });
    requestAnimationFrame(() => document.getElementById('veil')?.classList.add('open'));
  }
  keep(): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.kept));
    } catch {
      // private browsing
    }
  }
  /** Marks the chamber as done, once. */
  finish(): void {
    if (this.kept.chapter) return;
    this.kept.chapter = true;
    this.keep();
    this.sound.chime();
  }
  /** Makes ◉ pulse, to say: now look from outside. */
  call(on: boolean): void {
    this.eye.classList.toggle('call', on);
  }
  draw(): void {
    this.render();
    this.eye.classList.toggle('on', this.above);
  }
  /** Every click on something marked data-do="name" (with data-v for a value) comes here. */
  on(handler: (what: string, value: string, el: HTMLElement) => void): void {
    this.page.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-do]');
      if (!el || el.hasAttribute('disabled')) return;
      this.sound.start();
      handler(el.dataset.do!, el.dataset.v ?? '', el);
    });
  }
}

// ---- Practice ----

/** One question, already worked out. */
export interface Asked {
  /** What is asked, in a sentence. */
  ask: string;
  /** What she is shown (HTML). */
  show: string;
  /** What ◉ adds: the same thing seen from outside. */
  outside?: string;
  options: string[];
  right: number;
  /** Said afterwards, whichever she chose. */
  why: string;
}
export interface Kind {
  id: string;
  level: 1 | 2 | 3;
  make: (rand: () => number, skin: Skin) => Asked;
}

/**
 * `examples` gives, for any kind of question, one of that kind already worked through. It is shown open
 * until she has got one of the kind right, and again after a miss; after that it is folded away.
 */
export function runPractice(sh: Shell, kicker: string, title: string, intro: string, kinds: Kind[], examples: Record<string, string> = {}): void {
  let asked: Asked | null = null;
  let kind: Kind | null = null;
  let answered = -1;
  let last = '';
  let skin: Skin = 'stones';
  let exampleOpen = false;
  const stat = (k: Kind) => (sh.kept.practice[k.id] ??= { seen: 0, right: 0 });
  const rightsAt = (level: number) => kinds.filter((k) => k.level === level).reduce((n, k) => n + stat(k).right, 0);
  const next = () => {
    const top = rightsAt(1) < 3 ? 1 : rightsAt(2) < 3 ? 2 : 3;
    const unlocked = kinds.filter((k) => k.level <= top);
    // Not the kind she has just had, unless it is the only one open.
    const open = unlocked.length > 1 ? unlocked.filter((k) => k.id !== last) : unlocked;
    const least = Math.min(...open.map((k) => stat(k).right));
    const pool = open.filter((k) => stat(k).right <= least + 1);
    kind = kinds.find((k) => k.id === sh.params.get('kind')) ?? pool[Math.floor(Math.random() * pool.length)];
    last = kind.id;
    skin = SKINS[(SKINS.indexOf(skin) + 1 + Math.floor(Math.random() * 2)) % 3];
    asked = kind.make(seeded(Math.floor(Math.random() * 1e9)), skin);
    answered = -1;
    sh.above = false;
    exampleOpen = stat(kind).right === 0;
    stat(kind).seen++;
    sh.keep();
    sh.draw();
  };
  sh.render = () => {
    if (!asked) return;
    const total = Object.values(sh.kept.practice).reduce((n, f) => n + f.right, 0);
    const done = answered >= 0;
    const right = answered === asked.right;
    sh.page.innerHTML =
      `<div class="kicker">${kicker}</div><h1>${title}</h1><p class="soft">${total} solved${sh.kept.streak > 1 ? ` · ${sh.kept.streak} in a row` : ''}. ${intro}</p>` +
      (kind && examples[kind.id] ? `<details class="example"${exampleOpen ? ' open' : ''}><summary>A worked example of this kind</summary><div class="card book">${examples[kind.id]}</div></details>` : '') +
      `<div class="card">${asked.show}${sh.above && asked.outside ? `<div class="label">From outside</div>${asked.outside}` : ''}</div>` +
      `<div class="card"><p><b>${asked.ask}</b></p><div class="reasons">${asked.options
        .map((o, i) => `<button data-do="pick" data-v="${i}"${done ? ' disabled' : ''} style="${done && i === asked!.right ? 'outline:3px solid #2f7d4f' : done && i === answered ? 'outline:3px solid #a23a3a' : ''}">${o}</button>`)
        .join('')}</div>` +
      (done ? `<p class="${right ? 'good' : 'bad'}"><b>${right ? 'Yes.' : 'Not that one.'}</b> ${asked.why}</p><div class="bar"><button class="chip gold" data-do="next">Another ▶</button><a class="chip pale" href="./index.html">Back to the map</a></div>` : '') +
      `</div>`;
  };
  sh.on((what, value) => {
    if (what === 'next') next();
    else if (what === 'pick' && asked && kind && answered < 0) {
      answered = Number(value);
      if (answered === asked.right) {
        stat(kind).right++;
        sh.kept.streak++;
        sh.sound.chime();
      } else {
        sh.kept.streak = 0;
        exampleOpen = true;
      }
      sh.keep();
      sh.draw();
    }
  });
  (window as unknown as { spire: Record<string, unknown> }).spire = {
    ...((window as unknown as { spire?: Record<string, unknown> }).spire ?? {}),
    state: () => ({ example: !!(kind && examples[kind.id]), kind: kind?.id, right: asked?.right, options: asked?.options.length, answered }),
  };
  next();
}

/** Makes every kind of question many times and checks that each is well formed. */
export function checkKinds(kinds: Kind[], times = 150): string[] {
  const wrong: string[] = [];
  for (const k of kinds) {
    for (let i = 0; i < times; i++) {
      for (const skin of SKINS) {
        try {
          const a = k.make(seeded(i * 7919 + k.id.length * 101 + 3), skin);
          if (a.options.length < 2 || a.options.length > 4) wrong.push(`${k.id}: ${a.options.length} options`);
          if (!(a.right >= 0 && a.right < a.options.length)) wrong.push(`${k.id}: no right answer`);
          if (new Set(a.options).size !== a.options.length) wrong.push(`${k.id}: two options the same`);
          if (!a.ask || !a.show || !a.why) wrong.push(`${k.id}: something is missing`);
        } catch (e) {
          wrong.push(`${k.id}: ${String(e)}`);
        }
      }
    }
  }
  return [...new Set(wrong)];
}

/** Helpers for making questions. */
export const pickOne = <T,>(rand: () => number, list: T[]): T => list[Math.floor(rand() * list.length)];
export const shuffled = <T,>(rand: () => number, list: T[]): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
/** Shuffles the options and says where the right one (given first) went. */
export function choices(rand: () => number, right: string, wrong: string[]): { options: string[]; right: number } {
  const unique = [...new Set(wrong.filter((w) => w !== right))].slice(0, 3);
  const options = shuffled(rand, [right, ...unique]);
  return { options, right: options.indexOf(right) };
}
/** A right number and three wrong ones near it. */
export function numbers(rand: () => number, right: number, near: number[]): { options: string[]; right: number } {
  const wrong = [...new Set(near.filter((n) => n !== right && n >= 0))];
  for (let d = 1; wrong.length < 3; d++) for (const n of [right + d, right - d]) if (n >= 0 && n !== right && !wrong.includes(n) && wrong.length < 3) wrong.push(n);
  return choices(rand, String(right), wrong.slice(0, 3).map(String));
}
