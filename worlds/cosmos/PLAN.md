# The Night Sky: the full plan

Nineteen steps in seven stages. This file is the working plan: what is built,
what each remaining step is meant to hold, and the rules any new step must
keep. Read it before building the next one, and update it after.

## The rules

1. **Nothing wrong on purpose.** Everything is standard physics. Where
   something is unsettled, the page says so, and says who disagrees. Personal
   constructions that do not match the physics are left out and replaced by
   the correct step (see "What was replaced" below).
2. **The goal is accurate intuition that transfers.** Each chamber asks for a
   prediction before it shows the answer.
3. **The shape of a step:** a chamber to play, ending in the proper terms and
   the evidence that it is measured; "the math underneath", folded away, which
   rebuilds one piece of mathematics at the point an idea first needs it;
   "go deeper" links, each fetched on the day it was added; and generated
   practice with harder kinds opening as easier ones are got right. Every
   kind of practice question has a worked example (`EXAMPLES` in the page's
   file), shown open until one of that kind has been got right, and again
   after a miss.
4. **Every rule a practice question relies on is checked by a second,
   independent route** (`checkPhysics` in `physics.ts`, `checkGravity` in
   `gravity.ts`), and `checkKinds` makes each kind of question many times to
   see that it is well formed.
5. **Free services only**, and it deploys as static pages with the rest of
   the site.

## The map

Status: ✓ built and live · ○ not built.

### A · Flat spacetime

| | Step | The idea | The playable | Math it brings in |
| --- | --- | --- | --- | --- |
| ✓ | 1 · The budget (`budget`) | Speed through space is paid for out of speed through time | An arrow of fixed length, and two clocks | A rate of change (first derivative) |
| ✓ | 2 · The twins (`twins`) | A clock measures the length of its own path; the straight path is the longest | A spacetime diagram with layers | Adding up small pieces (first integral) |
| ✓ | 3 · Light cones (`cones`) | What can affect what; order in time is a fact only inside the cone; why nothing outruns light | Five events, and a slider for the observer's speed | Slopes and graphs; the interval |

### B · Gravity

| | Step | The idea | The playable | Math it brings in |
| --- | --- | --- | --- | --- |
| ✓ | 4 · Falling is the straight line (`falling`) | The equivalence principle; light bends; higher clocks run faster; free fall is the path of most time | Four rooms; a clock raised; a clock thrown and caught | Acceleration (second derivative) |
| ✓ | 5 · Curved space and tides (`tides`) | Curvature is parallel straight paths that do not stay parallel; tides are the curvature of spacetime | Walkers on a plain, a globe and a saddle; a ring of balls in a falling lift | Curvature as an equation; inverse-cube |
| ✓ | 6 · Orbits (`orbits`) | Falling and missing; circle, oval, escape | Newton's cannon, with the path found by stepping | Inverse-square; stepping a differential equation |

### C · Horizons

| | Step | The idea | The playable | Math it brings in |
| --- | --- | --- | --- | --- |
| ✓ | 7 · Horizons (`horizons`) | A ship that thrusts for ever has a last message that can ever catch it. A horizon is nowhere in particular, one-way, and belongs to the observer. Unruh effect stated as predicted, not measured | The spacetime diagram with the ship's bent path; a message to send; layers; engines to cut | Exponentials and logarithms |
| ✓ | 8 · Black holes (`holes`) | The same horizon, made by gravity: hovering is thrusting, falling is being "home". Finite on the faller's clock, never seen by the far watcher. Tides at the horizon go as 1/M². Non-spinning hole only | Hovering on the budget's arrow; a dropped beacon with both clocks; three real masses | Limits |
| ✓ | 9 · Wormholes (`wormholes`) | Allowed by the equations, needing negative energy, never seen; an open one makes a time machine, which is why most expect it is forbidden. Teaches measured / predicted / allowed-on-paper | A race round and through; one mouth taken on the twins' journey | None new |

### D · Light and stars

| | Step | The idea | The playable | Math it brings in |
| --- | --- | --- | --- | --- |
| ✓ | 10 · Light as messenger (`light`) | Colour gives temperature; dark lines give ingredients; their shift gives speed. A missing line is not a missing element | A glowing body with its curve; a spectrum to match against five elements, at rest and receding | Powers of ten and logarithms to base ten |
| ✓ | 11 · The life of a star (`stars`) | A self-correcting balance of gravity and pressure; mass decides brightness, colour, lifetime and ending; where the elements were made | A star to squeeze, puff up and starve (a cartoon, labelled as one); a star of any mass | Balance and feedback; power laws |
| ✓ | 12 · The distance ladder (`ladder`) | Parallax, standard candles, Cepheids, supernovae, redshift; each rung calibrated on the one below | The Earth's orbit and a star's shift; a lamp to place; the whole ladder in powers of ten | Small angles and radians; inverse-square for light |

### E · The cosmos

| | Step | The idea | The playable | Math it brings in |
| --- | --- | --- | --- | --- |
| ✓ | 13 · Space stretching (`expansion`) | Every gap grows alike, so speed goes as distance and there is no centre; light is stretched as much as space has grown; three histories, and the one the measurements pick | A field of galaxies to stretch and stand anywhere in; a wave of light; three histories of the universe's size | Proportionality; the scale factor |
| ✓ | 14 · The oldest light (`oldest`) | A glowing fog that cleared at 370,000 years; its light now microwaves; sound ripples frozen into it as a ruler; the ruler's angle gives H0 given the standard account | The universe cooling and clearing; a ripple spreading and freezing; the expansion rate to set until the angle fits | Waves |
| ✓ | 15 · The Hubble tension (`tension`) | What an uncertainty means; counting a gap in sigma; scatter against bias; the state of the question, taking no side. **Dated November 2026: re-check before relying on it** | A measurement to repeat; the two results as bell curves with a bias to try; eight real measurements | Error bars |

### F · The quantum

| | Step | The idea | The playable (proposed) | Math it brings in |
| --- | --- | --- | --- | --- |
| ○ | 16 · A number on every possibility | Amplitudes add before they are squared; interference. An amplitude is not a place and not a dimension | Two paths that cancel | Complex numbers |
| ○ | 17 · Why the world looks definite | Decoherence: caused by a system's entanglement with its surroundings; how fast it is. Not caused by, and not coupled to, the expansion of the universe. Say plainly that it does not by itself settle the measurement problem | A thing, and the air around it | Probability |

### G · The edges

| | Step | The idea | The playable (proposed) | Math it brings in |
| --- | --- | --- | --- | --- |
| ○ | 18 · What a dimension does | Gravity, orbits and waves change with the number of directions (no stable orbits in four space dimensions). Tesseracts as geometry. Extra dimensions are a proposal with no evidence so far | The same orbit in two, three and four dimensions | Power laws |
| ○ | 19 · Information and black holes | Hawking radiation, black hole entropy, the information paradox, the Page curve, holography. Frontier: mark what is established, what is predicted and untested, and what is argued over | Counting what goes in and what comes out | Entropy |

## Order

A, B and C run in sequence. After C, D → E is one line and F is another; either
can come first. G needs both. Steps 7 and 8 lean on step 3 (light cones) and
steps 4 to 6.

## Where the learner's own questions land

- Hubble tension: step 15.
- Rindler space and the Unruh effect: step 7.
- Wormholes: step 9.
- Tesseracts: step 18.
- Holographic principle, information paradox, Page curve: step 19.

## What was replaced

Three earlier personal constructions are not in the world, because they do
not match the physics:

- "Amplitude as a fifth dimension" → step 16 (what an amplitude is).
- "Decoherence coupled to cosmological expansion" → step 17.
- "A stack of emerging dimensions" → step 18.

And two common pictures are replaced by better ones:

- The rubber sheet (trampoline) → steps 4 and 5.
- "Speed through spacetime" is kept (step 1): it is correct, as the fixed
  size of the four-velocity.

## The mathematics, in the order it arrives

1. Pythagoras; a rate of change (derivative).
2. Adding up small pieces (integral).
3. Slope; graphs.
4. Acceleration (second derivative).
5. An equation for a rate of change of a rate of change; cosine and its saddle twin.
6. Inverse-square; stepping a differential equation.
7. Exponentials. 8. Limits. 10. Logarithms. 12. Small angles.
14. Waves. 15. Error bars. 16. Complex numbers. 17. Probability. 19. Entropy.

## Building the next step

- New page `name.html` (copy any chamber's) and `name.ts`; add it to
  `vite.config.ts` as `cosmosName`, to the list in `hub.ts`, and turn its
  card on in `index.html`.
- `chamber.ts` runs the steps: give it the steps, a figure built once
  (`frame`), a `paint` to bring it up to date, and the drawer.
- Put new physics and its second-route checks in a module beside
  `gravity.ts` (stage C's is `strong.ts`, stage D's `starlight.ts`, stage E's `cosmology.ts`), and call the check from the page's `expose`.
- Keep each instruction short: write " ¶ " between paragraphs in a step's
  text, end with the thing to do in bold, and give the figure a colour `key`
  instead of describing the colours in the prose. Use `art.ts` for stars,
  planets and glows.
- Give the previous chamber a "next" link.
- Fetch every link before adding it. Note in the README anything quoted that
  could not be confirmed.
- Update the status marks in this file and the table in `README.md`.

## Known weak points to revisit

- **Step 15 will go out of date.** Its figures are in `MEASURED` in
  `cosmology.ts` and its date is `ASOF` in `tension.ts`. Search for the
  current state before trusting it, and update both.
- Step 14's ruler figure holds the matter and light densities fixed and varies
  only H0, which is how the real inference works in outline but not in full.
- Step 13 leaves out inflation, curvature and what dark matter is.

- Step 11's balance figure is a cartoon (a damped spring), not a stellar
  model. Its lifetimes come from a four-piece fit and are estimates; for the
  smallest stars they are too short. The neutron-star / black-hole boundary
  is rough and unsettled. Type Ia supernovae and binaries get one line.
- Step 10's star colours are an approximate fit, for painting only.
- Step 12 mentions the Hubble tension and leaves it for step 15.

- Step 8 treats only the non-spinning hole; spin (Kerr), accretion discs and
  jets are named or left out. Hawking radiation is deferred to step 19.
- Step 9 leaves out ER = EPR and the 2022 quantum-computer "wormhole"; both
  belong with step 19 and need care.
- Step 7's "1 g" is really 0.97 g, chosen so the horizon is exactly one
  light-year behind. The page says so.

- Practice in steps 1 and 2 is arithmetic-heavy.
- The saddle in step 5 is a sketch, not a true constant-curvature surface.
- Step 4's thrown clock tries only arcs of one shape in the chamber (the
  check tries others).
- Links rot; re-fetch them now and then.
