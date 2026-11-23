import '../canon/spire.css';
import './cosmos.css';

/** The map of the night world: what is built, what is done, and what is to come. */
const read = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
};
for (const name of ['budget', 'twins', 'cones', 'falling', 'tides', 'orbits', 'horizons', 'holes', 'wormholes', 'light', 'stars', 'ladder', 'expansion', 'oldest', 'tension', 'amplitudes', 'decoherence', 'entangled', 'dimensions', 'information']) {
  const kept = read(`portal-worlds-cosmos-${name}-v1`);
  const tick = document.querySelector<HTMLElement>(`[data-tick="${name}"]`);
  if (tick && kept?.chapter) tick.textContent = '✓ done';
  const right = Object.values((kept?.practice ?? {}) as Record<string, { right: number }>).reduce((n, f) => n + (f.right ?? 0), 0);
  const el = document.getElementById(`done-${name}`);
  if (el && right) el.textContent = `${right} practice ${right === 1 ? 'question' : 'questions'} solved`;
}
const veil = document.getElementById('veil') as HTMLElement;
(document.getElementById('home') as HTMLElement).onclick = () => {
  veil.style.background = '#4f9a5c';
  veil.classList.remove('open');
  setTimeout(() => (window.location.href = '../../index.html#from-cosmos'), 1300);
};
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});
requestAnimationFrame(() => veil.classList.add('open'));
