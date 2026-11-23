import './cave.css';
import { FILTERS, draw, rock, sign } from './art';
import { Mind, NAMES, SIGNS, checkGame, deal, kindOf, nameOf, reach, round } from './game';
import type { Asking, Deal } from './game';

/**
 * The Painted Cave, as it is played: the screens, the handing of the tablet
 * from one player to the next, and the turns of the computer players.
 *
 * Whatever one player may see and another may not is kept behind a screen
 * that shows nothing but whose turn it is. That screen replaces the whole
 * page, so there is nothing underneath it to glimpse.
 */

interface Seat {
  sign: string;
  human: boolean;
  hand: number[];
  mind: Mind | null;
  /** Which place's wall she stands at: −1 for by the fire. */
  at: number;
  /** A wrong accusation puts her torch out: she still answers, and cannot win. */
  out: boolean;
  /** Her own marks on her tablet, one per token: 0 nothing, 1 ruled out, 2 suspected. */
  notes: number[];
  /** Who showed her each token, where somebody has. */
  from: (number | null)[];
  /** How much of what has happened round the fire she has already been told. */
  told: number;
}
type Entry = { asking: Asking } | { accused: number };

const app = document.getElementById('app') as HTMLElement;
document.body.insertAdjacentHTML('afterbegin', FILTERS);
document.body.style.backgroundImage = `url(${rock()})`;
// The torch: a pool of light that follows the finger.
window.addEventListener('pointermove', (e) => {
  document.body.style.setProperty('--tx', `${e.clientX}px`);
  document.body.style.setProperty('--ty', `${e.clientY}px`);
});

let seed = (Date.now() % 2147483646) + 1;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
let d: Deal;
let seats: Seat[] = [];
let log: Entry[] = [];
let turn = 0;
let humans = 1;
let actions: Record<string, (value: string) => void> = {};

/** Put up a screen: its markup, and what its buttons do. */
function screen(html: string, handlers: Record<string, (value: string) => void>): void {
  app.innerHTML = html;
  actions = handlers;
  window.scrollTo(0, 0);
}
app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-do]');
  if (!el || el.hasAttribute('disabled')) return;
  actions[el.dataset.do!]?.(el.dataset.v ?? '');
});

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const who = (i: number, size = 30) => `<span class="who">${sign(seats[i].sign, size)}</span>`;
const mark = (token: number, size = 56) => `<span class="token">${draw(token, size)}<small>${nameOf(token).replace('the ', '')}</small></span>`;

// ---- Starting ----

let wantHumans = 1;
let wantSeats = 3;
function setup(): void {
  wantSeats = Math.max(wantSeats, wantHumans, 3);
  screen(
    `<div class="wall"><h1>The Painted Cave</h1>
      <p class="tale">A hunter went out alone and did not come back. Nobody saw what happened.</p>
      <p class="tale"><b>Which beast? At which place? Under which moon?</b></p>
      <div class="row">${[0, 1, 2, 3, 4, 5].map((t) => draw(t, 74)).join('')}</div>
      <h2>Who is playing?</h2>
      <div class="row">${[1, 2, 3, 4].map((n) => `<button class="stone${n === wantHumans ? ' lit' : ''}" data-do="humans" data-v="${n}">${n} ${n === 1 ? 'person' : 'people'}</button>`).join('')}</div>
      <h2>How many round the fire?</h2>
      <div class="row">${[3, 4].map((n) => `<button class="stone${n === wantSeats ? ' lit' : ''}" data-do="seats" data-v="${n}"${n < wantHumans ? ' disabled' : ''}>${n}</button>`).join('')}</div>
      <p class="quiet">${wantSeats - wantHumans > 0 ? `${wantSeats - wantHumans === 1 ? 'One seat is' : `${wantSeats - wantHumans} seats are`} taken by the cave's own players, who follow the same rules as you.` : 'No computer players.'}</p>
      <div class="row"><button class="stone go" data-do="start">Light the torches</button></div>
      <details class="how"><summary>How to play</summary>
        <p>There are six beasts, six places and six moons. One of each is the truth, and those three are sealed away. All the rest are shared out. Whatever you hold, you <i>saw for yourself</i>, so you know it was <b>not</b> part of what happened.</p>
        <p><b>On your turn</b> walk to a place's wall: stay where you are, or step to the next wall either side. Then ask about a beast, that place, and a moon.</p>
        <p>Going round the fire, the first player who holds any of your three must show you <b>one</b> of them, and only you see which. Everyone sees who showed and who had nothing.</p>
        <p>Cross things off on your tablet. When you are sure, say what happened. You may say it only once: get it wrong and your torch goes out. You still answer other people's questions, but you cannot win.</p>
      </details></div>`,
    {
      humans: (v) => {
        wantHumans = Number(v);
        setup();
      },
      seats: (v) => {
        wantSeats = Number(v);
        setup();
      },
      start: begin,
    },
  );
}

function begin(): void {
  humans = wantHumans;
  d = deal(rand, wantSeats);
  seats = d.hands.map((hand, i) => {
    const human = i < humans;
    const notes = Array(18).fill(0);
    for (const t of [...hand, ...d.hearth]) notes[t] = 1;
    return { sign: SIGNS[i], human, hand, mind: human ? null : new Mind(i, wantSeats, hand, d.hearth, hand.length), at: -1, out: false, notes, from: Array(18).fill(null), told: 0 };
  });
  log = [];
  turn = -1;
  next();
}

// ---- Handing the tablet over ----

/** A screen with nothing on it but whose turn it is. Only with more than one person playing. */
function passTo(i: number, then: () => void, why = 'Your turn'): void {
  if (humans < 2) return then();
  screen(`<div class="pass"><div class="big">${sign(seats[i].sign, 150)}</div><p>Hand the tablet to <b>${cap(seats[i].sign)}</b>.</p><button class="stone go" data-do="ready">I am ${cap(seats[i].sign)}: ${why.toLowerCase()}</button></div>`, { ready: then });
}

// ---- What everyone has seen ----

function tell(e: Entry): string {
  if ('accused' in e) return `<li>${who(e.accused)} said what happened, and was <b>wrong</b>. That torch is out.</li>`;
  const a = e.asking;
  const none = a.could.map((s) => who(s, 24)).join('');
  return `<li>${who(a.asker)} asked: <span class="asked">${a.tokens.map((t) => draw(t, 40)).join('')}</span> ${none ? `${none} had nothing. ` : ''}${a.shower >= 0 ? `${who(a.shower, 24)} <b>showed one</b>.` : '<b>Nobody could show any of them.</b>'}</li>`;
}
function news(me: number): string {
  const fresh = log.slice(seats[me].told);
  return fresh.length ? `<div class="panel"><h3>Round the fire since your last turn</h3><ul class="news">${fresh.map(tell).join('')}</ul></div>` : '';
}

function tablet(me: number): string {
  const s = seats[me];
  const cell = (t: number) => {
    const fixed = s.hand.includes(t) || d.hearth.includes(t) || s.from[t] !== null;
    const tag = s.hand.includes(t) ? 'yours' : d.hearth.includes(t) ? 'by the fire' : s.from[t] !== null ? who(s.from[t]!, 18) : '';
    return `<button class="cell n${s.notes[t]}${fixed ? ' fixed' : ''}" data-do="note" data-v="${t}"${fixed ? ' disabled' : ''}>${draw(t, 38)}<span>${nameOf(t).replace('the ', '')}</span><em>${tag}</em></button>`;
  };
  return `<div class="panel"><h3>Your tablet</h3><p class="quiet">Tap to cross something off. Tap again to ring it as a suspect.</p><div class="tablet">${[0, 1, 2].map((k) => `<div>${[0, 1, 2, 3, 4, 5].map((i) => cell(k * 6 + i)).join('')}</div>`).join('')}</div></div>`;
}

// ---- A person's turn ----

function myTurn(me: number): void {
  const s = seats[me];
  const pick: [number, number, number] = [-1, s.at >= 0 ? 6 + s.at : -1, -1];
  const paint = () => {
    const can = reach(s.at);
    const ring = [0, 1, 2, 3, 4, 5]
      .map((p) => {
        const a = (p / 6) * Math.PI * 2 - Math.PI / 2;
        const here = seats.map((o, i) => (o.at === p ? who(i, 18) : '')).join('');
        return `<button class="alcove${can.includes(p) ? '' : ' far'}${pick[1] === 6 + p ? ' lit' : ''}" style="left:${50 + 39 * Math.cos(a)}%;top:${50 + 39 * Math.sin(a)}%" data-do="place" data-v="${p}"${can.includes(p) ? '' : ' disabled'}>${draw(6 + p, 54)}<small>${NAMES[1][p].replace('the ', '')}</small><span class="stand">${here}</span></button>`;
      })
      .join('');
    const row = (kind: number) => `<div class="row">${[0, 1, 2, 3, 4, 5].map((i) => `<button class="stone pick${pick[kind] === kind * 6 + i ? ' lit' : ''}" data-do="pick" data-v="${kind * 6 + i}">${draw(kind * 6 + i, 52)}<small>${NAMES[kind][i].replace('the ', '')}</small></button>`).join('')}</div>`;
    const ready = pick.every((t) => t >= 0);
    screen(
      `<div class="wall"><div class="head">${sign(s.sign, 44)}<h2>${cap(s.sign)}: your turn</h2></div>
        ${news(me)}
        <div class="panel"><h3>What you saw for yourself</h3><div class="row">${s.hand.map((t) => mark(t)).join('')}</div>${d.hearth.length ? `<h3>Painted by the fire, for all to see</h3><div class="row">${d.hearth.map((t) => mark(t)).join('')}</div>` : ''}</div>
        <div class="panel"><h3>1 · Walk to a wall</h3><p class="quiet">${s.at < 0 ? 'From the fire you may go to any wall.' : 'Stay, or step to the wall on either side.'}</p><div class="ring"><div class="fire"></div>${ring}</div>
        <h3>2 · Which beast?</h3>${row(0)}<h3>3 · Under which moon?</h3>${row(2)}
        <div class="row"><button class="stone go" data-do="ask"${ready ? '' : ' disabled'}>${ready ? `Ask: was it ${nameOf(pick[0])}, at ${nameOf(pick[1])}, under ${nameOf(pick[2])}?` : 'Choose a wall, a beast and a moon'}</button></div></div>
        ${tablet(me)}
        <div class="row"><button class="stone" data-do="accuse">I know what happened</button></div></div>`,
      {
        place: (v) => {
          pick[1] = 6 + Number(v);
          paint();
        },
        pick: (v) => {
          pick[kindOf(Number(v))] = Number(v);
          paint();
        },
        note: (v) => {
          s.notes[Number(v)] = (s.notes[Number(v)] + 1) % 3;
          paint();
        },
        ask: () => {
          s.told = log.length;
          s.at = pick[1] - 6;
          resolve(me, pick, (a, shown) => answerTo(me, a, shown));
        },
        accuse: () => accuse(me, () => myTurn(me)),
      },
    );
  };
  paint();
}

/** What the asker is shown, privately; and a last look at the tablet before the turn ends. */
function answerTo(me: number, a: Asking, shown: number): void {
  const s = seats[me];
  const paint = () =>
    screen(
      `<div class="wall"><div class="head">${sign(s.sign, 44)}<h2>${cap(s.sign)}: the answer</h2></div>
        <div class="panel"><p>You asked about:</p><div class="row">${a.tokens.map((t) => mark(t)).join('')}</div>
        ${a.could.length ? `<p>${a.could.map((o) => who(o, 26)).join(' ')} had none of them.</p>` : ''}
        ${a.shower >= 0 ? `<p>${who(a.shower, 34)} showed you:</p><div class="row shown">${mark(shown, 92)}</div><p class="quiet">So ${nameOf(shown)} was <b>not</b> part of it. It is crossed off on your tablet.</p>` : `<p><b>Nobody could show you any of them.</b></p><p class="quiet">Then whichever of the three you do not hold yourself is the truth.</p>`}</div>
        ${tablet(me)}
        <div class="row"><button class="stone go" data-do="done">End my turn</button><button class="stone" data-do="accuse">I know what happened</button></div></div>`,
      {
        note: (v) => {
          s.notes[Number(v)] = (s.notes[Number(v)] + 1) % 3;
          paint();
        },
        done: next,
        accuse: () => accuse(me, () => answerTo(me, a, shown)),
      },
    );
  paint();
}

// ---- Asking, and being answered ----

/**
 * A question is put. Each of the others in turn either has nothing, or shows one token to the asker.
 * A person who must show something is handed the tablet to choose which.
 */
function resolve(asker: number, tokens: [number, number, number], after: (a: Asking, shown: number) => void): void {
  const a: Asking = { asker, tokens, could: [], shower: -1 };
  const finish = (shown: number) => {
    log.push({ asking: a });
    for (const s of seats) s.mind?.heard(a);
    if (a.shower >= 0) {
      const s = seats[asker];
      if (s.mind) s.mind.shown(a.shower, shown);
      else {
        s.notes[shown] = 1;
        s.from[shown] = a.shower;
      }
    }
    // The tablet goes back to the asker, if the asker is a person and somebody else has had it.
    if (seats[asker].human && a.shower >= 0 && seats[a.shower].human) passTo(asker, () => after(a, shown), 'See the answer');
    else after(a, shown);
  };
  const order = round(asker, seats.length);
  const step = (n: number): void => {
    if (n >= order.length) return finish(-1);
    const other = order[n];
    const has = tokens.filter((t) => seats[other].hand.includes(t));
    if (!has.length) {
      a.could.push(other);
      return step(n + 1);
    }
    a.shower = other;
    const mind = seats[other].mind;
    if (mind) return finish(mind.show(asker, tokens));
    passTo(other, () => choose(other, asker, tokens, has, finish), 'Answer a question');
  };
  step(0);
}

/** A person is asked, and holds at least one of the three: she chooses which to show. */
function choose(me: number, asker: number, tokens: number[], has: number[], then: (shown: number) => void): void {
  screen(
    `<div class="wall"><div class="head">${sign(seats[me].sign, 44)}<h2>${cap(seats[me].sign)}: you are asked</h2></div>
      <div class="panel"><p>${who(asker, 34)} asks about:</p><div class="row">${tokens.map((t) => mark(t)).join('')}</div>
      <p>You hold ${has.length === 1 ? 'one of them, and must show it' : `${has.length} of them. Choose <b>one</b> to show`}. Only ${cap(seats[asker].sign)} will see it.</p>
      <div class="row">${has.map((t) => `<button class="stone pick" data-do="show" data-v="${t}">${draw(t, 70)}<small>${nameOf(t).replace('the ', '')}</small></button>`).join('')}</div></div></div>`,
    { show: (v) => then(Number(v)) },
  );
}

// ---- Saying what happened ----

function accuse(me: number, back: () => void): void {
  const pick = [-1, -1, -1];
  const paint = () => {
    const row = (kind: number) => `<div class="row">${[0, 1, 2, 3, 4, 5].map((i) => `<button class="stone pick${pick[kind] === kind * 6 + i ? ' lit' : ''}" data-do="pick" data-v="${kind * 6 + i}">${draw(kind * 6 + i, 52)}<small>${NAMES[kind][i].replace('the ', '')}</small></button>`).join('')}</div>`;
    const ready = pick.every((t) => t >= 0);
    screen(
      `<div class="wall"><div class="head">${sign(seats[me].sign, 44)}<h2>${cap(seats[me].sign)}: say what happened</h2></div>
        <div class="panel"><p class="quiet">You may do this only once. If you are wrong, your torch goes out.</p>
        <h3>Which beast?</h3>${row(0)}<h3>At which place?</h3>${row(1)}<h3>Under which moon?</h3>${row(2)}
        <div class="row"><button class="stone go" data-do="say"${ready ? '' : ' disabled'}>${ready ? `It was ${nameOf(pick[0])}, at ${nameOf(pick[1])}, under ${nameOf(pick[2])}` : 'Choose all three'}</button><button class="stone" data-do="back">Not yet</button></div></div>
        ${tablet(me)}</div>`,
      {
        pick: (v) => {
          pick[kindOf(Number(v))] = Number(v);
          paint();
        },
        note: () => {},
        back,
        say: () => {
          if (pick.every((t, k) => t === d.sealed[k])) return end(me);
          seats[me].out = true;
          seats[me].told = log.length;
          log.push({ accused: me });
          screen(`<div class="wall"><div class="head">${sign(seats[me].sign, 44)}<h2>That is not what happened</h2></div><div class="panel"><p>Your torch has gone out. You will still be asked what you saw, and must answer; but you cannot say again what happened.</p><div class="row"><button class="stone go" data-do="done">Go on</button></div></div></div>`, { done: next });
        },
      },
    );
  };
  paint();
}

// ---- Whose turn ----

function next(): void {
  for (;;) {
    turn = (turn + 1) % seats.length;
    const s = seats[turn];
    if (s.out) continue;
    if (s.human) return passTo(turn, () => myTurn(turn));
    // One of the cave's own players. It says what happened as soon as it is sure, and not before.
    const me = turn;
    if (s.mind!.solved()) return end(me);
    const tokens = s.mind!.ask(s.at, rand);
    s.at = tokens[1] - 6;
    // If a person has to answer, the screens take over, and the turns go on when she has chosen.
    let waiting = false;
    let answered = false;
    resolve(me, tokens, () => {
      answered = true;
      if (waiting) next();
    });
    if (!answered) {
      waiting = true;
      return;
    }
  }
}

function end(winner: number): void {
  const [b, p, m] = d.sealed;
  screen(
    `<div class="wall"><h1>${winner < 0 ? 'Every torch is out' : seats[winner].human ? `${cap(seats[winner].sign)} has it` : `${cap(seats[winner].sign)}, one of the cave's own, has it`}</h1>
      <div class="sealed"><div class="moonlit">${draw(m, 120)}</div><div class="scene">${draw(b, 240)}</div><div class="ground">${draw(p, 170)}</div></div>
      <p class="tale">It was <b>${nameOf(b)}</b>, at <b>${nameOf(p)}</b>, under <b>${nameOf(m)}</b>.</p>
      <div class="panel"><h3>What each had seen</h3>${seats.map((s, i) => `<div class="row hand">${who(i, 34)}${s.hand.map((t) => draw(t, 46)).join('')}</div>`).join('')}</div>
      <div class="row"><button class="stone go" data-do="again">Another night</button></div></div>`,
    { again: setup },
  );
}

(document.getElementById('home') as HTMLElement).onclick = () => {
  window.location.href = '../../index.html#from-cave';
};
(window as unknown as { cave: Record<string, unknown> }).cave = {
  check: () => checkGame(120),
  state: () => ({ turn, sealed: d?.sealed, hands: seats.map((s) => s.hand), hearth: d?.hearth, out: seats.map((s) => s.out), at: seats.map((s) => s.at), log: log.length }),
};
setup();
