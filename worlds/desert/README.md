# Desert

The world behind the pale sand pool in the wood: a building site where blocks
are earned by answering sums. It is a separate page with its own code and
shares nothing with the wood's rules.

## How it plays

1. **Who is playing.** Three letters: C, R and S.
2. **What to build.** Pyramid, castle, tree fort, rocket or town, either
   following a blueprint (pale outlines show the shape; any block can fill
   any outline) or building freely.
3. **Build.** Tap the plot or the side of a block to place the selected block.
   Drag to swing right round the building; pinch or scroll to zoom; drag with
   two fingers (or shift-drag) to slide across the plot.
4. **Order more blocks.** Blocks run out quickly. Tapping a block type that has
   run out asks one question; a right answer delivers a batch. No more can be
   ordered once 32 of that block are in hand, so blocks cannot be stockpiled.
5. **The sphinx** paces the edge of the site. Tap it, or zoom in close, and it
   asks three harder questions. Each right answer wins two special blocks that
   cannot be ordered.

## Settings and rewards

Each build stands in its own setting, and finishing its blueprint brings
someone out to walk round it. They are still there on later visits.

| Build | Setting | Who comes out |
|---|---|---|
| Pyramid | Desert | A golden pharaoh |
| Castle | Forest clearing | A knight on a horse |
| Tree fort | Forest clearing | Three monkeys |
| Rocket | Launch pad on the coast | Two astronauts |
| Town | Forest clearing | Five townspeople |

Finishing also gives two of each special block.

## Blocks

Every block has a painted face (stone courses, brick, planks, bark, leaves,
roof tiles, metal panels, woven cloth) and a shape. Besides cubes there are
half-height slabs, slopes, cones, arches, posts and thin panes. Shaped blocks
turn to face the builder as they are placed, so swing the view round to set a
roof slope or a doorway the other way.

Each build has ten blocks: three outdoor, two indoor (dashed edge on the
button), three shaped, and two special ones that only the sphinx gives.

## Look and feel

- Buildings cast shadows. The sun stands where it does over Brevard, but never
  lower than a warm late afternoon, so there is always light to build by.
- Rocks, bushes, flowers, cactus or shells come right up to the plot's edge,
  with trees close by. Birds circle; on the coast the sea laps and a boat sails.
- Blocks spring into place with a puff of dust and a knock. Deliveries rattle
  in and the block's button bounces. Torches, lamps and engines flicker.
- Finishing a blueprint sets off fireworks and a fanfare, turns the view once
  round the building, and then brings the visitors out. A finished rocket
  lifts off, climbs out of sight and lands again.
- The sphinx watches whoever is building, sits down for a rest now and then,
  and nods at a right answer.
- The choosing screens show a picture of each build a child has started.

Sounds are made in the browser; there are no audio files. Add `?noshadow` to
the address to turn shadows off on a slow device, or `?party` to see the
finishing celebration without finishing.

## How much a right answer brings

Sized for roughly one question per 40 seconds of building.

| Child | Blocks per right answer |
|---|---|
| C | 10 (or twice the number she counted out, at least 8) |
| R | 12, or 17 if answered quickly |
| S | 16, or 21 if answered quickly |

## What each child practises

| Child | Practice | Steps |
|---|---|---|
| C | Matching written numbers to how many bricks | 1-3, then 4-5, 6-10, 11-20. Three kinds of question: pick the numeral for a pile, pick the pile for a numeral, tap out that many bricks |
| R | Addition and subtraction | Within 10, crossing 10, whole tens, two-digit sums, whole hundreds, three-digit sums |
| S | Times tables to 12, with division | Tables in the order 2, 10, 5, 4, 3, 9, 6, 8, 7, 11, 12 |

A missed question shows the answer (as rows of bricks for a times-table fact),
then asks the same question again for half a batch. Nothing is taken away.

Facts a child finds hard come back after a question or two; facts they know
come back much later. A level opens when most of the one before is known.
Quick right answers count for more, and bring R and S a few extra blocks, but
no clock is shown.

The round button on the first screen shows grown-ups how far each child has
got: level, facts known, and questions asked.

## Files

- `facts.ts`: what is asked, and how the next question is chosen.
- `modes.ts`: the five things to build, their blocks and blueprints.
- `builder.ts`: the 3D building site, camera, scenery and sphinx.
- `blocks.ts`: the painted faces and shapes of blocks.
- `figures.ts`: the visitors who come out of a finished build.
- `sound.ts`: the sounds.
- `main.ts`: the screens and the flow of play.

Progress and builds are kept in the browser on each device. Nothing is sent
anywhere, so a child's progress on one device does not appear on another.
