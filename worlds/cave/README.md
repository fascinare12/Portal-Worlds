# The Painted Cave

The world behind the ochre pool: a game of deduction for one to four players,
round a fire in a cave.

A hunter went out alone and did not come back, and nobody saw what happened.
**Which beast, at which place, under which moon?**

## How it works

There are six beasts, six places and six moons. One of each is the truth, and
those three are sealed away. The other fifteen are shared out. Whatever a
player holds is something she saw for herself, and so knows was *not* part of
what happened: the beast she tracked all day somewhere else, the place where
she stood and nothing came. That is why holding a token lets her answer "no"
to a question about it.

On a turn a player walks to a place's wall (staying, or stepping to the wall
on either side; from the fire, anywhere) and asks about a beast, that place
and a moon. Going round the fire, the first player who holds any of the three
shows the asker one of them, and only the asker sees which. Everyone sees who
showed and who had nothing.

Each player keeps a tablet. What she holds, what lies by the fire, and what
she has been shown are crossed off for her; the rest she marks herself. When
she is sure she says what happened. She may say it once. If she is wrong her
torch goes out: she still answers questions and cannot win.

There are always three or four seats. Seats not taken by people are taken by
the cave's own players, who follow the same rules. With four seats the tokens
do not divide evenly, and three are painted by the fire for all to see.

## Handing the tablet round

With more than one person playing, anything one may see and another may not
is kept behind a screen that shows only whose turn it is. That screen replaces
the whole page, so there is nothing underneath it to glimpse. With one person
playing there are no such screens.

## The cave's own players

`Mind` in `game.ts` keeps the record a person would: for every token, who
might hold it. It sees only what a player in its seat would see. It learns
from what it is shown, from who had nothing, and from the case where nobody
could answer. It says what happened as soon as it is sure, and never guesses.

It can think harder (counting how many tokens each seat must hold, and
remembering "she showed him one of these three"), but that is switched off:
the game uses the plain player, which takes about seven rounds to finish
among its own kind, so that a child who has just learned has time.

## How it is checked

`checkGame()` plays several hundred games through among computer players
alone, plain and keen, with three seats and with four, and requires that every
one ends, and ends with a right answer. It also checks that a deal neither
loses nor doubles a token. `window.cave.check()` runs it on the page.

A browser test has played whole games with one, two, three and four people,
and confirmed that the pass screen never contains a token, a tablet or the
news.

## The screens

A turn is one screen, made to fit a phone without scrolling. Above is the
cave: six walls in a ring round the fire, each lit on the side facing it, with
every player's sign where she stands. Below are the beasts and the moons. The
eighteen drawings appear once each, and they are at once the tablet and the
things to ask about. A switch says whether a tap **chooses** (for the question)
or **marks** (cross off, then ring as a suspect).

Each drawing also carries what the tablet knows for certain, kept by itself:
a small sign in the corner for whose it is (her own, by the fire, or whoever
showed it to her), and beneath it the struck-through signs of players who had
nothing when it was asked about. It records; it does not conclude.

Every question is played out by the fire: the three drawings are painted on,
then each player in turn has nothing or shows one, and the asker alone is
shown which. Before a person's turn, the questions asked since she last looked
are played one at a time, with a way to skip.

## The look

Rock, firelight, and mineral paint, in the real palette of cave painting: red
and yellow ochre, charcoal, manganese black, white calcite. Every drawing is a
few strokes put through a filter that makes its edges wander and its colour
patchy, as paint sits on stone, and can be put on a stroke at a time. The rock
is made on the page. A pool of torchlight follows the finger.

The drawings are this world's own. They borrow the general vocabulary of
cave art (animals in profile, hands, dots, signs) and copy no particular
painting or tradition. The beasts, places and moons are a game's, not a
record of anything: nobody should take the moon signs as history.

## Files

- `game.ts`: the tokens, the deal, the ring of walls, the computer players,
  and the check.
- `art.ts`: the drawings, the signs, the filters and the rock.
- `main.ts`: the screens and the order of play.
- `cave.css`, `index.html`.
- In the wood: the pool is number 7 in `src/world/layout.ts`, and the mammoth
  that climbs out of it is `src/world/creatures/mammoth.ts` (`?at=7&visit=now`
  brings it out at once).

## Not done

- No sound.
- Play across separate devices: it would need a server, or a peer-to-peer
  link, and the site has neither.
- The keen computer player is written and unused; a "harder" switch would
  turn it on.
