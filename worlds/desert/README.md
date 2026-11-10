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
- `builder.ts`: the 3D building site, camera and sphinx.
- `main.ts`: the screens and the flow of play.

Progress and builds are kept in the browser on each device. Nothing is sent
anywhere, so a child's progress on one device does not appear on another.
