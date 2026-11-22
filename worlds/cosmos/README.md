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
  are got right. Each kind comes with a worked example, open until one of
  that kind has been got right and again after a miss.

## Built so far

| Step | Chamber | Math introduced |
| --- | --- | --- |
| 1 · The budget | `budget.html`: an arrow of fixed length on a quarter circle; speed across, clock rate up; two clocks running at those rates | Pythagoras; a rate of change (the first derivative) |
| 2 · The twins | `twins.html`: a spacetime diagram of a round trip, with layers for birthdays, the flashes each twin receives, and the traveller's lines of "now" | The interval; adding up small pieces (the first integral) |
| 3 · Light cones | `cones.html`: five events round "you, now", and a slider that shows them as timed by someone passing | Slopes and graphs; the interval |
| 4 · Falling is the straight line | `falling.html`: four sealed rooms with a dropped ball and a beam of light; a clock raised to any height; a clock thrown and caught | Acceleration (the second derivative) |
| 5 · Curved space and tides | `tides.html`: walkers on a plain, a globe and a saddle; a ring of loose balls in a falling lift | Curvature as an equation; the inverse cube |
| 6 · Orbits | `orbits.html`: Newton's cannon, with every path found by stepping | The inverse square; stepping a differential equation |
| 7 · Horizons | `horizons.html`: a ship under steady thrust on the spacetime diagram; a message from home whose sending time is slid past the last moment it can ever arrive | Exponentials and logarithms |
| 8 · Black holes | `holes.html`: a ship hovering at any height, shown on the budget's arrow; a dropped beacon with its own clock and a far watcher's; three real masses | Limits |
| 9 · Wormholes | `wormholes.html`: light going round against a ship going through; one mouth taken on the twins' journey until it makes a time machine | None new |
| 10 · Light as messenger | `light.html`: a glowing body of any temperature with its curve; a spectrum to match against the lines of five elements, at rest and receding | Powers of ten; logarithms to base ten |
| 11 · The life of a star | `stars.html`: a star to squeeze, puff up and starve; a star of any mass, with its brightness, colour, lifetime and ending | Balance and feedback; power laws |
| 12 · The distance ladder | `ladder.html`: the Earth's orbit and a star's shift; a lamp of known brightness to place; the whole ladder on a scale of powers of ten | Small angles; inverse-square for light |
| 13 · Space stretching | `expansion.html`: a field of galaxies to stretch and to stand anywhere in; a wave of light stretched on its way; three histories of the universe's size | Proportionality; the scale factor |
| 14 · The oldest light | `oldest.html`: the universe cooling until it clears; a ripple of sound spreading and freezing; the expansion rate set until the ruler's angle fits | Waves |
| 15 · The Hubble tension | `tension.html`: a measurement to repeat; the two results as bell curves, with a hidden bias to try; eight real measurements | Error bars |
| 16 · A number on every possibility | `amplitudes.html`: two ways to a detector with their arrows added tip to tail; two slits and a screen, particles sent one at a time | Complex numbers |
| 17 · Why the world looks definite | `decoherence.html`: one bounce and how much it gives away; how long a large molecule or a dust grain keeps its interference in four surroundings | Probability |

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

For steps 7 to 9 the checks are `checkStrong()` in `strong.ts`: the ship's
clock against the length of its path; its thrust against steady growth of
momentum; each message's arrival against the ship's actual position, and late
messages against stepping the chase directly, with engines on and cut; the
horizon radius against the Sun's known 2.95 km; the hovering clock against the
budget; the fall and what the watcher sees against stepping the fall; tides
at the horizon against the inverse square of the mass; and the wormhole
mouth's lag against the twins' path rule.

Quoted in steps 7 to 9 and where checked: S2's 16-year orbit, its speed of
nearly 3% of light and the reddening (the European Southern Observatory's
2018 release); 4.3 million and 6.5 billion Suns (Wikipedia, citing the
GRAVITY and Event Horizon Telescope collaborations); the 2019 and 2022 images
(ESO; EHT-Japan); the 2020 Nobel citation (nobelprize.org); Einstein and
Rosen 1935, Fuller and Wheeler 1962, Morris and Thorne 1988, Hawking's
conjecture (Wikipedia); Davies and Unruh (Wikipedia). From memory and not
re-fetched: the masses and distance of the first gravitational-wave source,
Michell's 1783 paper, the 1992 date of Hawking's conjecture, and the
rough size of the negative mass a wormhole needs (computed as c² × radius ÷ G,
an order of magnitude only). All sources fetched were European, Japanese or
American institutions writing in English or Japanese; none disagreed on any
figure used.

For steps 10 to 12 the checks are `checkStarlight()` in `starlight.ts`: Wien's
law against a hunt for the top of the Planck curve; the fourth-power law
against the curve added up; hydrogen's lines against Rydberg's formula; the
four pieces of the brightness rule against each other where they meet; each
typical star's brightness against its size and temperature; the parsec from
the astronomical unit and a second of arc; and the inverse-square law against
the same light through spheres of different size.

Quoted in steps 10 to 12 and where checked: the table of typical stars and
the four-piece brightness rule (Wikipedia, "Main sequence" and
"Mass–luminosity relation"); the Cepheid rule (Wikipedia, citing Benedict and
others 2007); Proxima's parallax, Bessel and 61 Cygni, Leavitt 1912,
Andromeda's distance, the Chandrasekhar limit (Wikipedia). From memory and not
re-fetched: Fraunhofer, Kirchhoff and Bunsen, Balmer, the helium dates, Payne
1925, the 1987 supernova's neutrinos, the solar neutrino experiments, Hubble's
1923 Cepheid and his distance for it, the 1998 supernova result, Gaia's star
count, and the two values of the Hubble constant.

For steps 13 to 15 the checks are `checkCosmology()` in `cosmology.ts`. The
standard model is coded directly, the measured contents of the universe are
put in, and the check asks whether the published figures come out: an age of
13.8 billion years; clearing at about 370,000 years; a sound ruler of 144
megaparsecs; the oldest light 13,870 megaparsecs away; the ruler's angle as
measured; an edge of sight of 46 billion light-years; and, solving for it, an
expansion rate between 66.5 and 68.5. They do. The three histories are checked
against a known formula and against each other; the bell curve against its
familiar fractions; and the size of the tension against the figure the
measuring team quotes.

Step 15 is dated November 2026, and was written after web searches for the
state of the question that month. Its figures and where they came from: the
ladder at 73.50 ± 0.81 (NOIRLab's page on the H0 Distance Network, 2026,
fetched); the oldest light at about 67.2 (the same page) with ± 0.4 taken from
a search summary of the combined Planck, ACT and SPT analysis, not from the
paper; SH0ES at 73.49 ± 0.93 and the red-giant ladder at about 70.4 (search
summaries of the 2025 papers, not fetched); lensing at 71.1 +2.4 −2.3 (the
TDCOSMO 2026 abstract, fetched); Planck 2018, the neutron-star figure and the
DESI figure (from memory). The two readings of the tension quoted are from
abstracts fetched from arXiv: a review by Cai and Wang (2026) and an analysis
by Pantos and Perivolaropoulos (2026). Several of these are preprints.

For steps 16 and 17 the checks are `checkQuantum()` in `quantum.ts`: that a
quarter-turn done twice is a half-turn (i × i = −1) and that multiplying arrows
adds their turns; the two-way chance by arrows against the cosine formula;
that interference moves probability about the screen and makes none; and, for
decoherence, a particle and the thing that bounced off it written out in full,
with the contrast of the pattern found by direct calculation and the best
possible telling-apart found by trying every way of looking. Their squares add
to one, as claimed. The particles sent at the screen are checked to pile up
where the rule says.

Quoted in steps 16 and 17 and where checked: the decoherence times (read from
table 1 of Schlosshauer's 2019 review, fetched as a PDF); the 2026 sodium
cluster experiment (ScienceAlert's report of the Nature paper, fetched; found
by web search); the state of collapse-model tests (a search summary of a 2025
review). From memory and not re-fetched: Young, Merli and colleagues,
Tonomura, Born, de Broglie, Zeh, Zurek, Haroche's 1996 experiment, the Vienna
gas and heat experiments, Englert's relation.

## Files

- `physics.ts`: the arithmetic of special relativity, and its checks.
- `gravity.ts`: light cones, clocks and height, curved surfaces, tides and orbits, and their checks.
- `strong.ts`: the thrusting ship, the black hole and the wormhole mouth, and their checks.
- `art.ts`: shared drawing pieces (stars, shaded planet, black hole, glows). Decoration only.
- `starlight.ts`: glowing bodies and spectral lines, stars by mass, and distances, with their checks.
- `cosmology.ts`: the expanding universe, the sound ruler and its angle, uncertainty, and the measured values of H0, with their checks.
- `quantum.ts`: arrows that add and multiply, two ways and two slits, records and how long interference lasts, with their checks.
- `chamber.ts`: what a chamber's page does, shared by steps 3 onward.
- `budget.ts`, `twins.ts`, `cones.ts`, `falling.ts`, `tides.ts`, `orbits.ts`, `horizons.ts`, `holes.ts`, `wormholes.ts`, `light.ts`, `stars.ts`, `ladder.ts`, `expansion.ts`, `oldest.ts`, `tension.ts`, `amplitudes.ts`, `decoherence.ts` (each with its `.html`): the chambers and practice.
- `PLAN.md`: the full plan.
- `index.html`, `hub.ts`: the map. `cosmos.css`: the night colours.
- The page shell and practice runner are shared with the Spire
  (`../canon/shell.ts`).
- In the wood: the pool's stars are `nightPool` in `src/world/pools.ts`, and
  the shooting stars are `src/world/creatures/meteor.ts`.
