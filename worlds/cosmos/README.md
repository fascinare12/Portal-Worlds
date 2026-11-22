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
| 3 · Light cones | `cones.html`: five events round "you, now", and a slider that shows them as timed by someone passing | Slopes and graphs; the interval |
| 4 · Falling is the straight line | `falling.html`: four sealed rooms with a dropped ball and a beam of light; a clock raised to any height; a clock thrown and caught | Acceleration (the second derivative) |
| 5 · Curved space and tides | `tides.html`: walkers on a plain, a globe and a saddle; a ring of loose balls in a falling lift | Curvature as an equation; the inverse cube |
| 6 · Orbits | `orbits.html`: Newton's cannon, with every path found by stepping | The inverse square; stepping a differential equation |

The whole plan, nineteen steps in seven stages, with what each unbuilt step
is meant to hold and how to add one, is in [`PLAN.md`](PLAN.md). The map
(`index.html`) shows all nineteen.

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

For steps 3 to 6 the checks are `checkGravity()` in `gravity.ts`: the interval
and the sorting of events against the Lorentz transformation; clock rates
with height against the known GPS figures (about 45 millionths of a second a
day gained, 7 lost, 38 net); the thrown clock against a finely cut sum, and
the real arc against arcs bent out of shape; the walkers against two great
circles followed on a globe and against the curvature equation stepped
directly; tides against differences in the pull; and stepped orbits against
the conservation laws and Kepler's third law. The falling ring in step 5 is
integrated, not drawn, and is checked to stretch twice as fast as it narrows.

Quoted in steps 3 to 6 and where checked: the 2017 neutron-star collision
(about 130 million light-years; Wikipedia, GW170817); the 2011 neutrino
result and its fibre fault (Wikipedia); Pound and Rebka (Wikipedia; the
22.5 m height is from memory, and the size of the shift is computed); the
33 cm clock comparison (NIST's own page); the Sun's tide at a little under
half the Moon's (Wikipedia gives 46%, NOAA "about half"); light bending of
1.75 arcseconds and escape speed of 11.2 km/s (Wikipedia). From memory and
not re-fetched: Mercury's 43 arcseconds a century, Io, the LIGO arm figure,
Wheeler's sentence, Einstein's "happiest thought". The Feynman Lectures
links could not be fetched by script (the site turns scripts away), so those
three chapter references are unconfirmed.

## Files

- `physics.ts`: the arithmetic of special relativity, and its checks.
- `gravity.ts`: light cones, clocks and height, curved surfaces, tides and orbits, and their checks.
- `chamber.ts`: what a chamber's page does, shared by steps 3 onward.
- `budget.ts`, `twins.ts`, `cones.ts`, `falling.ts`, `tides.ts`, `orbits.ts` (each with its `.html`): the chambers and practice.
- `PLAN.md`: the full plan.
- `index.html`, `hub.ts`: the map. `cosmos.css`: the night colours.
- The page shell and practice runner are shared with the Spire
  (`../canon/shell.ts`).
- In the wood: the pool's stars are `nightPool` in `src/world/pools.ts`, and
  the shooting stars are `src/world/creatures/meteor.ts`.
