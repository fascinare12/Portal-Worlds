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

export function runChamber(c: Chamber): Running {
  const { sh } = c;
  let step = 0;
  let said = '';
  sh.page.innerHTML = `<div class="kicker">${c.kicker}</div><h1>${c.title}</h1><div id="top"></div><div class="card" id="figure">${c.frame()}</div><div id="rest"></div>`;
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
      `<div class="card">${said ? `<p class="${said.startsWith('Yes') ? 'good' : 'bad'}">${said}</p>` : ''}` +
      (done ? `<p>${c.summary}</p>` : `<p>${s.say}</p>${s.ask ? `<p><b>${s.ask[0]}</b></p><div class="reasons">${s.ask[1].map((o, i) => `<button data-do="answer" data-v="${i}">${o}</button>`).join('')}</div>` : ''}`) +
      `</div>`;
    $('rest').innerHTML = done ? `${c.drawer()}<div class="bar"><a class="chip gold" href="./${c.file}.html?practice">Practise ▶</a>${c.next ? `<a class="chip" href="./${c.next[0]}.html">${c.next[1]} ▶</a>` : ''}<a class="chip pale" href="./index.html">Back to the map</a></div>` : '';
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
      said = `${Number(value) === s.ask[2] ? 'Yes.' : 'Not quite.'} ${s.ask[3]}`;
      step++;
      if (step >= c.steps.length) sh.finish();
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
