import './cave.css';
import { FILTERS, draw, rock, sign } from './art';
import { Mind, SIGNS, checkGame, deal, kindOf, nameOf, reach, round } from './game';
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
  // The same screen drawn again (a mark made, a wall chosen) stays where it was
  // scrolled to. Only a new screen starts from the top.
  const same = Object.keys(handlers).sort().join() === Object.keys(actions).sort().join();
  const y = window.scrollY;
  app.innerHTML = html;
  actions = handlers;
  window.scrollTo(0, same ? y : 0);
}
app.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-do]');
  if (!el || el.hasAttribute('disabled')) return;
  actions[el.dataset.do!]?.(el.dataset.v ?? '');
});

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const who = (i: number, size = 30) => `<span class="who">${sign(seats[i].sign, size)}</span>`;
const short = (token: number) => nameOf(token).replace('the ', '').replace(' moon', '').replace('woolly ', '');
const mark = (token: number, size = 56) => `<span class="token">${draw(token, size)}<small>${nameOf(token).replace('the ', '')}</small></span>`;

// ---- The cave: six walls in a ring round the fire ----

/** The ring. `wall` gives what stands at each place; everyone's sign is put where she stands. */
function ring(wall: (place: number, style: string, stand: string) => string, small = false): string {
  const walls = [0, 1, 2, 3, 4, 5]
    .map((p) => {
      const a = (p / 6) * Math.PI * 2 - Math.PI / 2;
      const stand = `<span class="stand">${seats.map((o, i) => (o.at === p ? who(i, 20) : '')).join('')}</span>`;
      // Each wall is lit on the side that faces the fire.
      return wall(p, `left:${50 + 37 * Math.cos(a)}%;top:${50 + 37 * Math.sin(a)}%;--a:${Math.round((a * 180) / Math.PI) + 270}deg`, stand);
    })
    .join('');
  const byFire = seats.map((o, i) => (o.at < 0 ? who(i, 20) : '')).join('');
  return `<div class="ring${small ? ' small' : ''}"><div class="glow"></div><div class="fire"><i></i><i></i><i></i></div><div class="byfire">${byFire}</div>${walls}</div>`;
}

/** Who is known not to hold a token: everyone who has had nothing for a question that named it. */
function lacks(me: number, token: number): number[] {
  const out = new Set<number>();
  for (const e of log) if ('asking' in e && e.asking.tokens.includes(token)) for (const o of e.asking.could) if (o !== me) out.add(o);
  return [...out].sort();
}

/**
 * One of the eighteen, as it stands on a player's tablet: the drawing, her own
 * mark on it, whose it is if she knows, and who is known not to hold it.
 */
function cell(me: number, token: number, o: { lit?: boolean; far?: boolean; style?: string; stand?: string } = {}): string {
  const s = seats[me];
  const mine = s.hand.includes(token);
  const hearth = d.hearth.includes(token);
  const from = s.from[token];
  const fixed = mine || hearth || from !== null;
  const tag = mine ? sign(s.sign, 20) : hearth ? '<i class="ember"></i>' : from !== null ? sign(seats[from].sign, 20) : '';
  const no = fixed ? '' : lacks(me, token).map((x) => `<s>${sign(seats[x].sign, 13)}</s>`).join('');
  return `<button class="cell${o.style ? ' alcove' : ''} n${fixed ? 1 : s.notes[token]}${fixed ? ' fixed' : ''}${o.lit ? ' lit' : ''}${o.far ? ' far' : ''}"${o.style ? ` style="${o.style}"` : ''} data-do="tap" data-v="${token}">${draw(token, 64)}<small>${short(token)}</small><span class="tag">${tag}</span><span class="pips">${no}</span>${o.stand ?? ''}</button>`;
}

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

/**
 * One question, played out by the fire: the three drawings, and then each
 * player in turn with nothing, or showing one. The asker alone is shown which.
 */
function stage(e: Entry, viewer: number, shown: number, more: boolean, on: () => void, skip: () => void, extra = ''): void {
  if ('accused' in e) {
    screen(
      `<div class="play told"><div class="telling"><div class="big dark">${sign(seats[e.accused].sign, 120)}</div><h2>${cap(seats[e.accused].sign)} said what happened, and was wrong.</h2><p class="quiet">That torch is out.</p>
        <div class="row"><button class="stone go" data-do="on">Go on</button>${more ? '<button class="stone" data-do="skip">Skip the rest</button>' : ''}</div></div></div>`,
      { on, skip },
    );
    return;
  }
  const a = e.asking;
  const mine = a.asker === viewer;
  const order = round(a.asker, seats.length);
  let wait = 1.5;
  const answers = order
    .map((o) => {
      const kind = a.could.includes(o) ? 'none' : o === a.shower ? 'shows' : 'unasked';
      const at = kind === 'unasked' ? wait : (wait += 0.8);
      return `<div class="ans ${kind}" style="--d:${at.toFixed(1)}s">${sign(seats[o].sign, 54)}<span>${kind === 'none' ? 'nothing' : kind === 'shows' ? (mine ? 'shows you one' : 'shows one') : 'not asked'}</span></div>`;
    })
    .join('');
  wait += 0.8;
  const last =
    a.shower < 0
      ? `<div class="reveal" style="--d:${wait}s"><p><b>Nobody could show any of them.</b></p>${mine ? '<p class="quiet">Then whichever of the three you do not hold yourself is the truth.</p>' : ''}</div>`
      : mine
        ? `<div class="reveal" style="--d:${wait}s"><p>${who(a.shower, 30)} showed you:</p>${draw(shown, 170, true, wait + 0.3)}<p><b>${cap(nameOf(shown).replace('the ', ''))}</b> was not part of it.</p></div>`
        : '';
  screen(
    `<div class="play told"><div class="scene">${ring((p, style, stand) => `<div class="alcove show${a.tokens[1] === 6 + p ? ' lit' : ''}" style="${style}">${draw(6 + p, 64)}${stand}</div>`, true)}</div>
      <div class="telling"><div class="head">${sign(seats[a.asker].sign, 40)}<h2>${mine ? 'You ask' : `${cap(seats[a.asker].sign)} asks`}</h2></div>
        <div class="asked3">${a.tokens.map((t, k) => `<span class="token">${draw(t, 96, true, k * 0.35)}<small>${nameOf(t).replace('the ', '')}</small></span>`).join('')}</div>
        <div class="answers">${answers}</div>${last}
        <div class="row">${extra || `<button class="stone go" data-do="on">${more ? 'Next' : 'Go on'}</button>${more ? '<button class="stone" data-do="skip">Skip the rest</button>' : ''}`}</div></div></div>`,
    { on, skip },
  );
}

/** Everything that has happened round the fire since this player last looked, a question at a time. */
function replay(me: number, then: () => void): void {
  const fresh = log.slice(seats[me].told);
  const done = () => {
    seats[me].told = log.length;
    then();
  };
  const show = (n: number): void => (n >= fresh.length ? done() : stage(fresh[n], me, -1, n < fresh.length - 1, () => show(n + 1), done));
  show(0);
}

// ---- A person's turn ----

/**
 * The board: the cave above, with its six walls, and the beasts and moons
 * below. The same eighteen drawings are the tablet and the things to ask
 * about. A switch says whether a tap chooses or marks.
 */
function board(me: number, phase: 'ask' | 'after'): void {
  const s = seats[me];
  const pick: [number, number, number] = [-1, phase === 'ask' && s.at >= 0 ? 6 + s.at : -1, -1];
  const can = phase === 'ask' ? reach(s.at) : [];
  let marking = phase === 'after';
  const paint = () => {
    const ready = pick.every((t) => t >= 0);
    const slot = (k: number) => `<span class="slot${pick[k] >= 0 ? ' full' : ''}">${pick[k] >= 0 ? draw(pick[k], 54) : ['beast', 'wall', 'moon'][k]}</span>`;
    const asking =
      phase === 'ask'
        ? `<div class="question">${slot(0)}<em>at</em>${slot(1)}<em>under</em>${slot(2)}<button class="stone go" data-do="ask"${ready ? '' : ' disabled'}>Ask</button></div>
           <p class="quiet say">${ready ? `Was it ${nameOf(pick[0])}, at ${nameOf(pick[1])}, under ${nameOf(pick[2])}?` : s.at < 0 ? 'From the fire, walk to any wall. Then choose a beast and a moon.' : 'Stay at your wall or step next door. Then choose a beast and a moon.'}</p>`
        : `<div class="question"><button class="stone go" data-do="done">End my turn</button></div><p class="quiet say">Mark your tablet if you like.</p>`;
    screen(
      `<div class="play${marking ? ' marking' : ''}">
        <div class="scene"><div class="head">${sign(s.sign, 36)}<h2>${cap(s.sign)}</h2></div>
          ${ring((p, style, stand) => cell(me, 6 + p, { style, stand, lit: pick[1] === 6 + p, far: phase === 'ask' && !marking && !can.includes(p) }))}</div>
        <div class="table">${asking}
          ${phase === 'ask' ? `<div class="switch"><button class="${marking ? '' : 'on'}" data-do="mode" data-v="0">Choose</button><button class="${marking ? 'on' : ''}" data-do="mode" data-v="1">Mark the tablet</button></div>` : ''}
          <div class="grid">${[0, 1, 2, 3, 4, 5].map((i) => cell(me, i, { lit: pick[0] === i })).join('')}${[12, 13, 14, 15, 16, 17].map((t) => cell(me, t, { lit: pick[2] === t })).join('')}</div>
          <p class="quiet key">${marking ? 'Tap to cross off. Tap again to ring a suspect.' : ''} <s>${sign('dots', 13)}</s> had nothing when it was asked about.</p>
          <div class="row"><button class="stone" data-do="accuse">I know what happened</button></div></div></div>`,
      {
        tap: (v) => {
          const t = Number(v);
          const fixed = s.hand.includes(t) || d.hearth.includes(t) || s.from[t] !== null;
          if (marking) {
            if (fixed) return;
            s.notes[t] = (s.notes[t] + 1) % 3;
          } else {
            if (kindOf(t) === 1 && !can.includes(t - 6)) return;
            pick[kindOf(t)] = t;
          }
          paint();
        },
        mode: (v) => {
          marking = v === '1';
          paint();
        },
        ask: () => {
          s.at = pick[1] - 6;
          resolve(me, pick, (a, shown) => {
            s.told = log.length;
            stage({ asking: a }, me, shown, false, () => board(me, 'after'), () => board(me, 'after'));
          });
        },
        done: next,
        accuse: () => accuse(me, () => board(me, phase)),
      },
    );
  };
  paint();
}

const myTurn = (me: number) => replay(me, () => board(me, 'ask'));

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
      <div class="panel"><p>${who(asker, 34)} asks about:</p><div class="row">${tokens.map((t) => mark(t, 84)).join('')}</div>
      <p>You hold ${has.length === 1 ? 'one of them, and must show it' : `${has.length} of them. Choose <b>one</b> to show`}. Only ${cap(seats[asker].sign)} will see it.</p>
      <div class="row">${has.map((t) => `<button class="stone pick" data-do="show" data-v="${t}">${draw(t, 110)}<small>${nameOf(t).replace('the ', '')}</small></button>`).join('')}</div></div></div>`,
    { show: (v) => then(Number(v)) },
  );
}

// ---- Saying what happened ----

function accuse(me: number, back: () => void): void {
  const pick = [-1, -1, -1];
  const paint = () => {
    const row = (kind: number) => `<div class="grid">${[0, 1, 2, 3, 4, 5].map((i) => cell(me, kind * 6 + i, { lit: pick[kind] === kind * 6 + i })).join('')}</div>`;
    const ready = pick.every((t) => t >= 0);
    screen(
      `<div class="wall"><div class="head">${sign(seats[me].sign, 44)}<h2>${cap(seats[me].sign)}: say what happened</h2></div>
        <div class="panel"><p class="quiet">You may do this only once. If you are wrong, your torch goes out.</p>
        <h3>Which beast?</h3>${row(0)}<h3>At which place?</h3>${row(1)}<h3>Under which moon?</h3>${row(2)}
        <div class="row"><button class="stone go" data-do="say"${ready ? '' : ' disabled'}>${ready ? `It was ${nameOf(pick[0])}, at ${nameOf(pick[1])}, under ${nameOf(pick[2])}` : 'Choose all three'}</button><button class="stone" data-do="back">Not yet</button></div></div></div>`,
      {
        tap: (v) => {
          pick[kindOf(Number(v))] = Number(v);
          paint();
        },
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
      <div class="sealed"><div class="ground">${draw(p, 230, true, 0.4)}</div><div class="moonlit">${draw(m, 150, true, 1.8)}</div><div class="beast">${draw(b, 320, true, 2.8)}</div></div>
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
