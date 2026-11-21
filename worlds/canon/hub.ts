import './spire.css';

/** The map of the white world: the steps of the book's argument, each with a chamber and its practice. */
const $ = (id: string) => document.getElementById(id) as HTMLElement;
const read = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
};
const canon = read('portal-worlds-canon-v1');
const rules = read('portal-worlds-spire-rules-v1');
const tick = (name: string, on: boolean) => {
  const el = document.querySelector<HTMLElement>(`[data-tick="${name}"]`);
  if (el && on) el.textContent = '✓ done';
};
tick('canon', (canon?.stage ?? 0) >= 5);
tick('rules', !!rules?.chapter);
const right = Object.values((rules?.practice ?? {}) as Record<string, { right: number }>).reduce((n, f) => n + (f.right ?? 0), 0);
if (right) $('done1').textContent = `${right} practice ${right === 1 ? 'puzzle' : 'puzzles'} solved`;

const veil = $('veil');
$('home').onclick = () => {
  veil.style.background = '#4f9a5c';
  veil.classList.remove('open');
  setTimeout(() => (window.location.href = '../../index.html#from-canon'), 1300);
};
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});
requestAnimationFrame(() => veil.classList.add('open'));
