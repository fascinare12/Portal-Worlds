import { ART, urlOf } from './art';
import { BRACE_FOOT, L, STRIP, W, inner, quads, standAngles, stands } from './fold';
import type { Piece, Spread } from './fold';

/**
 * The Pop-up Book, on real paper.
 *
 * For each spread: one sheet that is the two pages, with the flat pictures
 * printed in place and every glue patch marked with a letter; then the pieces
 * themselves, each with its folds, its glue tabs and the same letters.
 *
 * Everything is drawn at its true size, in centimetres, so the sheets must be
 * printed at 100%, not "fit to page".
 */

const TAB = 1;
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const n = (v: number) => v.toFixed(2);
const cutLine = 'fill="none" stroke="#222" stroke-width="0.04"';
const foldLine = 'fill="none" stroke="#222" stroke-width="0.04" stroke-dasharray="0.25 0.18"';
const glue = 'fill="#d9d4c8" stroke="#888" stroke-width="0.03"';
const label = (x: number, y: number, text: string, size = 0.42) => `<text x="${n(x)}" y="${n(y)}" font-size="${size}" text-anchor="middle" font-family="sans-serif" fill="#333">${text}</text>`;
const picture = (art: string, x: number, y: number, w: number, h: number, extra = '') => `<image href="${urlOf(art)}" xlink:href="${urlOf(art)}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" preserveAspectRatio="none" ${extra}/>`;
const sheet = (w: number, h: number, inner: string, caption: string) => `<figure class="sheet"><figcaption>${caption}</figcaption><svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}cm" height="${n(h)}cm" viewBox="0 0 ${n(w)} ${n(h)}">${inner}</svg></figure>`;

/** Where a point of the open book is on the printed spread: the spine down the middle, the reader at the bottom. */
const sx = (x: number) => W + x;
const sy = (z: number) => L / 2 + z;

/** The two pages, with the stickers printed on and the glue patches marked. */
function base(spread: Spread, names: string[]): string {
  let out = `<rect x="0" y="0" width="${2 * W}" height="${L}" ${cutLine}/><path d="M${W} 0V${L}" ${foldLine}/>`;
  spread.pieces.forEach((p) => {
    if (p.kind === 'sticker') out += picture(p.art, sx(p.x - p.w / 2), sy(p.z - p.h / 2), p.w, p.h);
  });
  spread.pieces.forEach((p, i) => {
    const name = names[i];
    if (p.kind === 'flap') {
      // The flap's tab is glued just beyond its far edge.
      out += `<rect x="${n(sx(p.x - p.w / 2))}" y="${n(sy(p.z - p.h / 2) - TAB)}" width="${n(p.w)}" height="${TAB}" ${glue}/>` + label(sx(p.x), sy(p.z - p.h / 2) - 0.35, name);
    } else if (p.kind === 'slide') {
      // Two bands hold the strip to the page; it slides under them.
      const [, track] = quads(p, 1, 0);
      const xs = track.c.map((c) => c[0]);
      const zs = track.c.map((c) => c[2]);
      const x0 = Math.min(...xs);
      const x1 = Math.max(...xs);
      const z0 = Math.min(...zs);
      const z1 = Math.max(...zs);
      out += `<rect x="${n(sx(x0))}" y="${n(sy(z0))}" width="${n(x1 - x0)}" height="${n(z1 - z0)}" fill="none" stroke="#888" stroke-width="0.03" stroke-dasharray="0.15 0.15"/>`;
      for (const f of [0.3, 0.7]) {
        const bx = p.flip ? x0 + (x1 - x0) * f : (x0 + x1) / 2;
        const bz = p.flip ? (z0 + z1) / 2 : z0 + (z1 - z0) * f;
        const [bw, bh] = p.flip ? [0.8, 2.6] : [2.6, 0.8];
        out += `<rect x="${n(sx(bx) - bw / 2)}" y="${n(sy(bz) - bh / 2)}" width="${bw}" height="${bh}" fill="none" stroke="#888" stroke-width="0.03"/>` + label(sx(bx), sy(bz) + 0.15, name, 0.32);
      }
    } else if (p.kind === 'vfold' || p.kind === 'double') {
      // A strip along each glue line, on the side the tab folds to.
      const [left, right] = quads(p, 1);
      for (const [q, tag, a, b] of [[left, name + '1', 1, 0], [right, name + '2', 0, 1]] as const) {
        const [x0, , z0] = q.c[a];
        const [x1, , z1] = q.c[b];
        const len = Math.hypot(x1 - x0, z1 - z0);
        const ang = (Math.atan2(z1 - z0, x1 - x0) * 180) / Math.PI;
        // The tab may fold to either side of this line; the line itself is what has to be right.
        out += `<g transform="translate(${n(sx(x0))} ${n(sy(z0))}) rotate(${n(ang)})"><rect x="0" y="-0.2" width="${n(len)}" height="0.4" ${glue}/></g>` + label(sx((x0 + x1) / 2), sy((z0 + z1) / 2) + 0.15, tag);
      }
    } else if (p.kind === 'stand') {
      // The foot runs straight out from the spine; the brace's foot slants across the other page.
      const sd = p.x < 0 ? -1 : 1;
      const far = Math.abs(p.x) + p.w / 2;
      out += `<rect x="${n(sx(sd > 0 ? 0.3 : -far))}" y="${n(sy(p.z) - 0.2)}" width="${n(far - 0.3)}" height="0.4" ${glue}/>` + label(sx((sd * far) / 2), sy(p.z) - 0.3, name + '1');
      const [, , braceQuad] = quads(p, 1);
      const [bx, , bz] = braceQuad.c[1];
      const ang = (Math.atan2(bz - p.z, bx) * 180) / Math.PI;
      out += `<g transform="translate(${n(sx(0))} ${n(sy(p.z))}) rotate(${n(ang)})"><rect x="0.3" y="-0.2" width="${n(BRACE_FOOT - 0.3)}" height="0.4" ${glue}/></g>` + label(sx(bx / 2) - sd * 0.6, sy((p.z + bz) / 2), name + '2');
    } else if (stands(p)) {
      const a = p.kind === 'tent' ? p.reach - p.x : p.reach;
      const b = p.kind === 'tent' ? p.reach + p.x : p.reach;
      const y = sy(p.z - p.w / 2);
      out += `<rect x="${n(sx(-a) - TAB)}" y="${n(y)}" width="${TAB}" height="${n(p.w)}" ${glue}/>` + label(sx(-a) - TAB / 2, sy(p.z) + 0.15, name + '1');
      out += `<rect x="${n(sx(b))}" y="${n(y)}" width="${TAB}" height="${n(p.w)}" ${glue}/>` + label(sx(b) + TAB / 2, sy(p.z) + 0.15, name + '2');
      if (p.kind === 'platform') out += `<rect x="${n(sx(0) - TAB / 2)}" y="${n(y)}" width="${TAB}" height="${n(p.w)}" ${glue}/>` + label(sx(0), sy(p.z) + 0.15, name + '3');
    }
  });
  return out;
}

/** One piece, flat, with its folds and tabs: what to cut out. Returns the drawing and its size. */
function net(p: Piece, name: string): { svg: string; w: number; h: number; note: string } | null {
  const pad = 0.3;
  if (p.kind === 'slide') {
    const len = p.reach + (p.flip ? p.w : p.h) + 2.2;
    const svg =
      `<rect x="${pad}" y="${pad}" width="0.9" height="${n(len)}" ${cutLine}/>` + label(pad + 0.45, pad + len - 0.4, 'pull', 0.28) +
      picture(p.art, pad + 1.6, pad, p.w, p.h) + `<rect x="${n(pad + 1.6)}" y="${pad}" width="${n(p.w)}" height="${n(p.h)}" ${foldLine.replace('0.25 0.18', '0.06 0.12')}/>` +
      [0, 1].map((i) => `<rect x="${n(pad + 2.2 + p.w + i * 1.3)}" y="${pad}" width="0.8" height="2.6" ${cutLine}/><rect x="${n(pad + 2.2 + p.w + i * 1.3)}" y="${pad}" width="0.8" height="0.6" ${glue}/><rect x="${n(pad + 2.2 + p.w + i * 1.3)}" y="${n(pad + 2)}" width="0.8" height="0.6" ${glue}/>`).join('');
    return { svg, w: pad * 2 + 2.2 + p.w + 2.6, h: Math.max(len, p.h, 2.6) + 2 * pad, note: `${name}: a pull tab. Cut out the long strip, the picture and the two short bands. Glue the picture on one end of the strip. Lay the strip in the dotted track on the page, picture at the start, and glue the two bands over it by their grey ends only, at the boxes marked ${name}, so that the strip slides under them. Pull the other end.` };
  }
  if (p.kind === 'double') {
    const small = inner(p);
    const first = net({ ...p, kind: 'vfold', flip: !p.flip }, name)!;
    const second = net({ ...p, kind: 'vfold', art: p.art2 ?? p.art, w: small.w, h: small.h, flip: true }, name + 'x')!;
    return {
      svg: first.svg + `<g transform="translate(${n(first.w + 0.4)} 0)">${second.svg}</g>`,
      w: first.w + second.w + 0.4,
      h: Math.max(first.h, second.h),
      note: `${name}: a double V. The big piece is an ordinary V-fold: fold it down the middle and glue ${name}1 and ${name}2 to the pages, opening towards you. The small piece goes inside it, across the big one's fold: fold it down the middle, and glue ${name}x1 to the left wing and ${name}x2 to the right wing, ${small.up.toFixed(1)} cm up from the page, with its fold exactly on the big fold and its tabs pointing up at the same angle as the big piece's tabs make with the spine. Shut the big piece on it to let it find its place.`,
    };
  }
  if (p.kind === 'vfold') {
    const w = 2 * p.w;
    const cutOut = ART[p.art]?.paper === false;
    const svg =
      picture(p.art, pad, pad, w, p.h) +
      `<rect x="${pad}" y="${pad}" width="${n(w)}" height="${n(p.h)}" ${cutOut ? foldLine.replace('0.25 0.18', '0.06 0.12') : cutLine}/>` +
      `<path d="M${n(pad + p.w)} ${pad}V${n(pad + p.h)}" ${foldLine}/><path d="M${pad} ${n(pad + p.h)}H${n(pad + w)}" ${foldLine}/>` +
      `<rect x="${pad}" y="${n(pad + p.h)}" width="${n(p.w - 0.15)}" height="${TAB}" ${glue}/><rect x="${n(pad + p.w + 0.15)}" y="${n(pad + p.h)}" width="${n(p.w - 0.15)}" height="${TAB}" ${glue}/>` +
      label(pad + p.w / 2, pad + p.h + 0.65, name + '1') +
      label(pad + p.w * 1.5, pad + p.h + 0.65, name + '2');
    return { svg, w: w + 2 * pad, h: p.h + TAB + 2 * pad, note: `${name}: a V-fold. Fold down the middle so the picture is outside${p.flip ? '' : ' (its corner points towards you)'}. Fold both tabs the same way, whichever hides them best. ${cutOut ? 'Cut round the picture, but leave the bottom edge and tabs whole. ' : ''}Glue ${name}1 on the left page and ${name}2 on the right, with the bottom edge of the piece along the grey line and the fold exactly on the spine.` };
  }
  if (p.kind === 'tent') {
    const left = p.reach + p.x + p.h;
    const right = p.reach - p.x + p.h;
    const x = pad + TAB;
    const svg =
      picture(p.art, x, pad, left + right, p.w) +
      `<rect x="${pad}" y="${pad}" width="${n(left + right + 2 * TAB)}" height="${n(p.w)}" ${cutLine}/>` +
      `<path d="M${n(x)} ${pad}V${n(pad + p.w)}M${n(x + left)} ${pad}V${n(pad + p.w)}M${n(x + left + right)} ${pad}V${n(pad + p.w)}" ${foldLine}/>` +
      `<rect x="${pad}" y="${pad}" width="${TAB}" height="${n(p.w)}" ${glue}/><rect x="${n(x + left + right)}" y="${pad}" width="${TAB}" height="${n(p.w)}" ${glue}/>` +
      label(pad + TAB / 2, pad + p.w / 2, name + '1') +
      label(x + left + right + TAB / 2, pad + p.w / 2, name + '2');
    return { svg, w: left + right + 2 * TAB + 2 * pad, h: p.w + 2 * pad, note: `${name}: a tent. Fold the middle line into a ridge and both tabs outwards. Glue ${name}1 on the left page${Math.abs(p.x) > 0.01 ? ' (the longer side goes nearer the spine)' : ''}, then shut the book on ${name}2 so that it finds its own place.` };
  }
  if (p.kind === 'platform') {
    const x = pad + TAB;
    const widths = [p.h, p.reach, p.reach, p.h];
    let at = x;
    let folds = `M${n(x)} ${pad}V${n(pad + p.w)}`;
    for (const d of widths) folds += `M${n((at += d))} ${pad}V${n(pad + p.w)}`;
    const total = 2 * p.h + 2 * p.reach;
    const legX = x + total + TAB + 0.8;
    const svg =
      picture(p.art, x + p.h, pad, 2 * p.reach, p.w) +
      `<rect x="${pad}" y="${pad}" width="${n(total + 2 * TAB)}" height="${n(p.w)}" ${cutLine}/><path d="${folds}" ${foldLine}/>` +
      `<rect x="${pad}" y="${pad}" width="${TAB}" height="${n(p.w)}" ${glue}/><rect x="${n(x + total)}" y="${pad}" width="${TAB}" height="${n(p.w)}" ${glue}/>` +
      label(pad + TAB / 2, pad + p.w / 2, name + '1') +
      label(x + total + TAB / 2, pad + p.w / 2, name + '2') +
      // The middle leg: a strip folded into a T at each end.
      `<rect x="${n(legX)}" y="${pad}" width="${n(p.h + 2 * TAB)}" height="${n(p.w)}" ${cutLine}/><path d="M${n(legX + TAB)} ${pad}V${n(pad + p.w)}M${n(legX + TAB + p.h)} ${pad}V${n(pad + p.w)}" ${foldLine}/>` +
      `<rect x="${n(legX)}" y="${pad}" width="${TAB}" height="${n(p.w)}" ${glue}/><rect x="${n(legX + TAB + p.h)}" y="${pad}" width="${TAB}" height="${n(p.w)}" ${glue}/>` +
      label(legX + TAB / 2, pad + p.w / 2, name + '3') +
      label(legX + TAB + p.h + TAB / 2, pad + p.w / 2, 'top');
    return { svg, w: legX + p.h + 2 * TAB + pad, h: p.w + 2 * pad, note: `${name}: a platform. Fold the long strip into a table with a crease across the middle of its top, and glue ${name}1 and ${name}2 to the pages. The short strip is the middle leg: glue its "top" tab under the crease, fold tab ${name}3 in half along its length, and glue half to each page across the spine.` };
  }
  if (p.kind === 'stand') {
    // Laid flat: the brace unfolds to the far side of the crease from the picture.
    const { lean, corner } = standAngles;
    const k = Math.min(STRIP, p.h);
    const near = Math.abs(p.x) - p.w / 2;
    const far = Math.abs(p.x) + p.w / 2;
    const tip = [k / Math.tan(lean), k];
    const end = [BRACE_FOOT * Math.cos(lean + corner), BRACE_FOOT * Math.sin(lean + corner)];
    const left = -end[0] + TAB + pad;
    const X = (v: number) => n(left + v);
    const Y = (v: number) => n(pad + p.h - v);
    // The brace's tab, standing out square from its foot.
    const along = [end[0] / BRACE_FOOT, end[1] / BRACE_FOOT];
    const off = [-along[1] * TAB, along[0] * TAB];
    const svg =
      picture(p.art, left + near, pad, p.w, p.h) +
      `<path d="M${X(0)} ${Y(0)}H${X(far)}V${Y(p.h)}H${X(near)}V${Y(k)}H${X(tip[0])}L${X(end[0])} ${Y(end[1])}Z" ${cutLine}/>` +
      `<path d="M${X(0)} ${Y(0)}L${X(tip[0])} ${Y(tip[1])}" ${foldLine}/><path d="M${X(0.3)} ${Y(0)}H${X(far)}" ${foldLine}/>` +
      `<rect x="${X(0.3)}" y="${Y(0)}" width="${n(far - 0.3)}" height="${TAB}" ${glue}/>` +
      `<path d="M${X(along[0] * 0.3)} ${Y(along[1] * 0.3)}L${X(end[0])} ${Y(end[1])}L${X(end[0] + off[0])} ${Y(end[1] + off[1])}L${X(along[0] * 0.3 + off[0])} ${Y(along[1] * 0.3 + off[1])}Z" ${glue}/>` +
      label(left + far / 2, pad + p.h + 0.65, name + '1') +
      label(left + end[0] / 2 + off[0] / 2, pad + p.h - end[1] / 2 - off[1] / 2 + 0.15, name + '2');
    return { svg, w: left + far + pad, h: p.h + TAB + 2 * pad, note: `${name}: a stand-up. Fold the slanting line so that the small triangle goes behind the picture. Fold both tabs. Glue ${name}1 along its grey line, with the corner of the piece exactly on the spine, then shut the book on ${name}2 so that the brace finds its own place.` };
  }
  if (p.kind === 'flap') {
    const svg = picture(p.art, pad, pad + TAB, p.w, p.h) + `<rect x="${pad}" y="${pad}" width="${n(p.w)}" height="${n(p.h + TAB)}" ${cutLine}/><path d="M${pad} ${n(pad + TAB)}H${n(pad + p.w)}" ${foldLine}/><rect x="${pad}" y="${pad}" width="${n(p.w)}" height="${TAB}" ${glue}/>` + label(pad + p.w / 2, pad + 0.65, name);
    return { svg, w: p.w + 2 * pad, h: p.h + TAB + 2 * pad, note: `${name}: a flap. Fold the tab back and glue it on patch ${name}.` };
  }
  return null;
}

/** Everything needed to make the book, as sheets to print. */
export function sheets(title: string, spreads: Spread[], lines: string[] = [], cover: Spread | null = null, backs: (string | undefined)[] = []): string {
  let out = `<header class="sheet"><h1>${title}</h1><p><b>Print at 100% (not "fit to page")</b>, on card or heavy paper if you have it. A whole spread is ${2 * W} cm by ${L} cm.</p>
    <p><span class="k cut"></span> cut &nbsp; <span class="k fold"></span> fold &nbsp; <span class="k glue"></span> glue here</p>
    <p>For each spread: cut out the pages and fold them down the middle. Cut out the pieces. Each grey tab has a letter; glue it on the grey patch with the same letter. For pieces that go on both pages, glue one side, then shut the book on the other so it finds its own place.</p></header>`;
  if (cover) {
    // The front cover: the stickers where they were put, and the title. Glue it to the outside of the first spread.
    const inner = `<rect x="0" y="0" width="${W}" height="${L}" ${cutLine}/>` + label(W / 2, 2.6, title, 0.9) + cover.pieces.map((p) => picture(p.art, W / 2 + p.x - p.w / 2, L / 2 + p.z - p.h / 2, p.w, p.h)).join('');
    out += sheet(W, L, inner, 'The front cover. Glue it on the outside of the first spread, on the right-hand half.');
  }
  spreads.forEach((spread, s) => {
    const names = spread.pieces.map((_, i) => LETTERS[i % LETTERS.length]);
    const back = backs[s] ? `<image href="${backs[s]}" xlink:href="${backs[s]}" x="0" y="0" width="${2 * W}" height="${L}" preserveAspectRatio="none"/>` : '';
    out += sheet(2 * W, L, back + base(spread, names), `Spread ${s + 1}: the pages${lines[s] ? `. <i>${lines[s]}</i>` : ''}`);
    const notes: string[] = [];
    spread.pieces.forEach((p, i) => {
      const made = net(p, names[i]);
      if (!made) return;
      out += sheet(made.w, made.h, made.svg, `Spread ${s + 1}, piece ${names[i]}`);
      notes.push(made.note);
    });
    if (notes.length) out += `<ol class="sheet notes">${notes.map((t) => `<li>${t}</li>`).join('')}</ol>`;
  });
  return out;
}
