import type { Shell } from '../canon/shell';

/**
 * What the chambers of the night world share: a run of steps, each of which
 * either asks a question or waits for something to be done to the figure;
 * then a closing sentence, the card of terms, and the way on.
 *
 * The figure is built once and repainted, never rebuilt, so that a slider can
 * be dragged without being pulled out from under the finger.
 */

export interface Step {
  say: string;
  /** A question: what is asked, the answers, which is right, and what is said afterwards. */
  ask?: [string, string[], number, string];
  /** Or something to do: the step is passed once this is true. */
  until?: () => boolean;
}

export interface Chamber {
  sh: Shell;
  /** The page's own name, as in "cones" for cones.html. */
  file: string;
  kicker: string;
  title: string;
  steps: Step[];
  /** Said when every step is done. */
  summary: string;
  /** The figure and its controls, built once. */
  frame: () => string;
  /** Brings the figure up to date. */
  paint: () => void;
  /** A click on anything marked data-do, other than an answer. */
  act?: (what: string, value: string) => void;
  /** A slider moved: its id and where it now is. */
  slide?: (id: string, value: number) => void;
  /** What the colours in the figure stand for: each a colour and a few words. */
  key?: () => [string, string][];
  drawer: () => string;
  /** The next chamber, if it is built: its page and what to call it. */
  next?: [string, string];
}

export interface Running {
  /** Which step she is on; equal to the number of steps when all are done. */
  step: () => number;
  /** Shows which of a set of chips is chosen. */
  mark: (what: string, chosen: (value: string) => boolean) => void;
}

/** Text written with " ¶ " between its paragraphs, set as paragraphs. */
export const paras = (text: string) => text.split(' ¶ ').map((p) => `<p>${p}</p>`).join('');
/** What is said after an answer: set apart from what comes next, so the two are not read as one. */
export function saidBox(said: string): string {
  if (!said) return '';
  const yes = said.startsWith('Yes');
  const cut = said.indexOf('.') + 1;
  return `<div class="said ${yes ? 'good' : 'bad'}"><p><b>${said.slice(0, cut)}</b>${said.slice(cut).split(' ¶ ').join('</p><p>')}</p></div>`;
}
/** The answers already tried and found wrong, for the question now showing. */
const missed = new Set<number>();
/** A question and its answers: the ones tried and found wrong are crossed off, and the rest can still be chosen. */
export const question = (ask: [string, string[], number, string]) =>
  `<p><b>${ask[0]}</b></p><div class="reasons">${ask[1].map((o, i) => `<button data-do="answer" data-v="${i}"${missed.has(i) ? ' disabled style="opacity:0.45;text-decoration:line-through"' : ''}>${o}</button>`).join('')}</div>`;
/**
 * An answer is given. Right: what to say, and the chamber may move on. Wrong: nothing is given away;
 * that answer is crossed off, and she tries again.
 */
export function answered(ask: [string, string[], number, string], value: number): { right: boolean; said: string } {
  if (value === ask[2]) {
    missed.clear();
    return { right: true, said: `Yes. ${ask[3]}` };
  }
  missed.add(value);
  return { right: false, said: 'Not quite. That one is crossed off: have another go.' };
}

/** How far through the chamber she is. */
export const stepLine = (step: number, of: number) => `<div class="stepno">${step >= of ? 'Done' : `Step ${step + 1} of ${of}`}<span>${Array.from({ length: of }, (_, i) => `<i class="${i < step ? 'past' : i === step ? 'here' : ''}"></i>`).join('')}</span></div>`;

export function runChamber(c: Chamber): Running {
  const { sh } = c;
  let step = 0;
  let said = '';
  sh.page.innerHTML = `<div class="kicker">${c.kicker}</div><h1>${c.title}</h1><div id="top"></div><div class="card" id="figure">${c.frame()}<div id="key" class="key"></div></div><div id="rest"></div>`;
  const $ = (id: string) => document.getElementById(id) as HTMLElement;
  const running: Running = {
    step: () => step,
    mark: (what, chosen) =>
      sh.page.querySelectorAll<HTMLElement>(`[data-do="${what}"]`).forEach((el) => {
        const on = chosen(el.dataset.v ?? '');
        el.classList.toggle('gold', on);
        el.classList.toggle('pale', !on);
      }),
  };
  sh.render = () => {
    const s = c.steps[Math.min(step, c.steps.length - 1)];
    const done = step >= c.steps.length;
    $('top').innerHTML =
      `<div class="card">${stepLine(step, c.steps.length)}${saidBox(said)}` +
      (done ? paras(c.summary) : `${paras(s.say)}${s.ask ? question(s.ask) : ''}`) +
      `</div>`;
    $('rest').innerHTML = done ? `${c.drawer()}<div class="bar"><a class="chip gold" href="./${c.file}.html?practice">Practise ▶</a>${c.next ? `<a class="chip" href="./${c.next[0]}.html">${c.next[1]} ▶</a>` : ''}<a class="chip pale" href="./index.html">Back to the map</a></div>` : '';
    $('key').innerHTML = (c.key?.() ?? []).map(([colour, words]) => `<span><i style="background:${colour}"></i>${words}</span>`).join('');
    c.paint();
  };
  const advance = () => {
    const s = c.steps[step];
    if (s && !s.ask && s.until?.()) {
      step++;
      said = '';
      sh.sound.chime();
      if (step >= c.steps.length) sh.finish();
      sh.draw();
    }
  };
  sh.page.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.type !== 'range') return;
    c.slide?.(el.id, Number(el.value));
    c.paint();
    advance();
  });
  sh.on((what, value) => {
    if (what === 'answer') {
      const s = c.steps[step];
      if (!s?.ask) return;
      const got = answered(s.ask, Number(value));
      said = got.said;
      if (got.right) {
        step++;
        if (step >= c.steps.length) sh.finish();
      }
      sh.draw();
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      c.act?.(what, value);
      c.paint();
    }
    advance();
  });
  sh.draw();
  return running;
}

/** The page's hooks for testing: the checks, and where the chamber has got to. */
export function expose(check: () => string[], chamber: () => Record<string, unknown>): void {
  const w = window as unknown as { spire?: Record<string, unknown> };
  w.spire = { ...(w.spire ?? {}), check, chamber };
}
