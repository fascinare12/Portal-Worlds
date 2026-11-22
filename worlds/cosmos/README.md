# The Night Sky

The world behind the dark blue pool in the wood: a place to build accurate
pictures of physics and astrophysics, and to use them until they are habits.
It is for an adult learner whose calculus is long ago.

The rule of the world: **nothing in it is wrong on purpose.** Everything is
standard physics; where something is unsettled, the page says so. Personal
constructions that do not match the physics are not included, however
appealing.

## The shape of a step

- a **chamber**: one idea to push around, with predictions asked for before
  the answer is shown;
- **the terms**, and the evidence that the idea is measured and not supposed;
- **the math underneath**, folded away: the calculus is rebuilt a piece at a
  time, at the point where an idea first needs it;
- **go deeper**: links to a text, a video and a course, each opened and
  checked on the day it was added;
- **practice**: generated questions, with harder kinds opening as easier ones
  are got right.

## Built so far

| Step | Chamber | Math introduced |
| --- | --- | --- |
| 1 · The budget | `budget.html`: an arrow of fixed length on a quarter circle; speed across, clock rate up; two clocks running at those rates | Pythagoras; a rate of change (the first derivative) |
| 2 · The twins | `twins.html`: a spacetime diagram of a round trip, with layers for birthdays, the flashes each twin receives, and the traveller's lines of "now" | The interval; adding up small pieces (the first integral) |

The map (`index.html`) lists eight more steps as not built: gravity as the
shape of spacetime, horizons, black holes and wormholes, expansion, the
Hubble tension, amplitudes, decoherence, and what a dimension does.

## How the physics is checked

`checkPhysics()` in `physics.ts` tests every formula the questions rely on by
a second route: exact fractions against the square root; clock rates against
the Lorentz transformation; a round trip's ages against a count of yearly
flashes followed one by one across the gap; the traveller's "now" against the
transformation; and the path rule against a path cut into ten thousand
steps. It passes. `checkKinds()` then checks that each generated question is
well formed.

Speeds in practice come from whole-number right triangles (3-4-5, 5-12-13,
7-24-25, 8-15-17), so every answer is exact.

Facts quoted on the pages and where they were checked: the Hafele and Keating
figures (59 nanoseconds lost eastbound, 273 gained westbound) against the US
Naval Observatory's account; von Laue's 1911 result on the straight worldline
against the history of the twin paradox. A muon storage-ring figure was
wanted and could not be confirmed, so it is not quoted.

## Files

- `physics.ts`: the arithmetic of special relativity, and its checks.
- `budget.ts`, `twins.ts` (each with its `.html`): the chambers and practice.
- `index.html`, `hub.ts`: the map. `cosmos.css`: the night colours.
- The page shell and practice runner are shared with the Spire
  (`../canon/shell.ts`).
- In the wood: the pool's stars are `nightPool` in `src/world/pools.ts`, and
  the shooting stars are `src/world/creatures/meteor.ts`.
