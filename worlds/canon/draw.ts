/**
 * How a symbol looks and sounds. The same three symbols can be dressed as
 * letters, stones, notes or things from a garden, so that a puzzle has to be
 * recognised by its structure and not by its look.
 */
import type { Voices } from './sound';

export type Skin = 'letters' | 'stones' | 'notes' | 'garden';
export const SKINS: Skin[] = ['stones', 'notes', 'garden'];
const INK: Record<string, string> = { M: '#c9951c', I: '#2c7f93', U: '#b9486e', a: '#c9951c', b: '#2c7f93', c: '#b9486e', '-': '#2c7f93', p: '#c9951c', q: '#b9486e' };
const PITCH: Record<string, number> = { M: 60, I: 67, U: 64, a: 72, b: 67, c: 62, '-': 67, p: 60, q: 64 };
export const NAMES: Record<Skin, Record<string, string>> = {
  letters: { M: 'M', I: 'I', U: 'U', '-': 'hyphen', p: 'p', q: 'q' },
  stones: { a: 'square', b: 'circle', c: 'diamond' },
  notes: { a: 'high note', b: 'middle note', c: 'low note' },
  garden: { a: 'seed', b: 'leaf', c: 'flower' },
};

export function draw(s: string, skin: Skin): string {
  const ink = INK[s];
  if (skin === 'letters') return `<span class="sym" style="background:${ink}">${s === '-' ? '–' : s}</span>`;
  let svg = '';
  if (skin === 'stones') {
    svg = s === 'a' ? `<rect x="5" y="5" width="30" height="30" rx="5" fill="${ink}"/>` : s === 'b' ? `<circle cx="20" cy="20" r="16" fill="${ink}"/>` : `<path d="M20 3 37 20 20 37 3 20Z" fill="${ink}"/>`;
  } else if (skin === 'notes') {
    const y = s === 'a' ? 9 : s === 'b' ? 20 : 31;
    svg = `<g stroke="#c9c6be" stroke-width="1.5"><line x1="2" x2="38" y1="9" y2="9"/><line x1="2" x2="38" y1="20" y2="20"/><line x1="2" x2="38" y1="31" y2="31"/></g><ellipse cx="18" cy="${y}" rx="8" ry="6" fill="${ink}"/><line x1="26" x2="26" y1="${y}" y2="${Math.max(1, y - 16)}" stroke="${ink}" stroke-width="2.4"/>`;
  } else {
    svg =
      s === 'a'
        ? `<ellipse cx="20" cy="22" rx="8" ry="11" fill="#8a6a3a"/><path d="M20 12v20" stroke="#6b5230" stroke-width="1.5"/>`
        : s === 'b'
          ? `<path d="M6 32C6 14 18 5 35 6 36 24 26 35 8 34Z" fill="#5f9a62"/><path d="M8 33 30 11" stroke="#3f7445" stroke-width="1.8" fill="none"/>`
          : `<g fill="${ink}">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="20" cy="9.5" rx="6" ry="8.5" transform="rotate(${a} 20 20)"/>`).join('')}</g><circle cx="20" cy="20" r="5" fill="#e8c24a"/>`;
  }
  return `<span class="sym"><svg viewBox="0 0 40 40">${svg}</svg></span>`;
}
export const row = (r: string, skin: Skin, cls = '') => `<div class="row ${cls}">${r ? [...r].map((s) => draw(s, skin)).join('') : '<span class="nothing">nothing at all</span>'}</div>`;
/** Plays a row as a quick run of notes. */
export function sing(sound: Voices, r: string): void {
  if (!sound.ctx) return;
  [...r].slice(0, 16).forEach((s, i) => sound.note(sound.ctx!.currentTime + i * 0.085, 0.16, PITCH[s] ?? 64, 0, 0, 0.13));
}
export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
