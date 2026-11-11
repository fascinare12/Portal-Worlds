# The Printer's World

The world behind the parchment-coloured pool in the wood: a landscape that
woodblock-prints itself onto cream paper round whoever walks through it.
There is nothing to read.

## The idea

Ahead of you the world is still being made, one block at a time, and you
watch it happen:

1. the outlines are drawn across each thing from its top corner, in dark blue;
2. the pale washes are rubbed on in streaks, and yellow goes down wherever
   there will be green;
3. deep blue follows, and where it goes over the yellow the green appears;
4. the warm colours come last.

Only what you are looking at prints: turn away and it waits, half done; turn
back and it carries on. Near things finish in about a quarter of a minute,
far things in their own time. Where you have been, it is a finished print.

Everything is a flat cut-out standing at its own depth and turned to face
you, like the flats of a paper theatre. The open ground is not drawn as
ground at all but as flat strips of wash laid one behind another, each
strongest along its far edge, which is how distance is built in the prints.

The mountain stands still and is seen twice: far to the north beyond the
pines, white and blue; and to the south across the sea, red in the morning
with lightning at its foot.

## Moving

- Tap to walk a little way towards where you tapped.
- Drag sideways to turn. Scroll or pinch to walk forwards and back; arrow
  keys work too.
- The green button goes home. ♪ turns the sound off. The blank page starts a
  fresh sheet.

## What is there

- **The middle:** a crossing of roads, a house, pines.
- **North:** a pine forest under a grey sky with snow falling, one enormous
  cedar, and the falls at the head of the river.
- **East:** the river, with currents that move downstream, reeds and rocks
  along both banks; the drum bridge, which is a real hump in the road that
  you walk up and over; and a village of thatched houses.
- **West:** terraced fields under a pink evening sky, sheaves drying,
  packhorses, a cooper building a great tub, and a gust carrying off
  somebody's papers and hat.
- **South:** the sea under a sky of small ranked clouds, with waves that
  break into hooked fingers of foam, fishing boats, a shrine gate at the
  water's edge, reeds, rocks and cranes.
- **On the roads:** walkers with staffs, porters, a man with baskets on a
  pole, riders, and a covered chair carried by two bearers.

Small things move, but never smoothly: walkers swap between two drawings,
boats and waves tip from one held position to the next, snow and the river's
current go a step at a time, birds and blown paper cross and begin again.

Eight stone lanterns mark places worth stopping. Reaching one stamps its red
seal into the cartouche on the left. At four of them something stands between
the lantern and a mountain, so the mountain is seen through it: under the
arch of the bridge, through the shrine gate, through the cooper's tub, and
beside the great cedar.

## The manner

Taken from Hokusai's *Thirty-six Views of Mount Fuji* (c. 1830-32), studied
from the Art Institute of Chicago's public-domain scans:

- outlines printed in dark blue, not black;
- a small set of flat inks: Prussian blue, a mid and a pale blue, two greens,
  straw yellow, pink, tan, and one red kept for the seal;
- colour that fades out to bare paper (bokashi), darkest along the top of the
  sky;
- slopes textured with clustered dots and short strokes;
- pines with salmon trunks and flat pads of needles;
- bands of mist the colour of bare paper lying across the land;
- small figures in indigo with straw hats, caught mid-step;
- the colour blocks a hair out of register with the outlines.

None of the prints themselves are used: every cut-out is drawn in code.

## Sound

A koto, made in the browser: each pluck is a model of a string, tuned to the
five notes of the *in* scale (D, E flat, G, A, B flat). The music is sparse:
one chord, rolled from the bottom string up, each time you set off walking,
and never more often than every four seconds. Under it there is only a faint
rubbing, like the printer's pad, while new ground prints. Reaching a lantern
sounds two knocks of wooden clappers and a rolled chord.

## What is remembered

In this browser only: how far the sheet has printed, which seals are found,
and where you stood. The blank-page button wipes all three.

## Files

- `art.ts`: every cut-out, drawn onto a colour sheet and a line sheet.
- `world.ts`: the land, sky and ground, where each cut-out stands, and the
  printing.
- `main.ts`: moving, seals, sound, and what is remembered.

For development: `?fresh` ignores what is remembered, `?printed` shows the
whole sheet finished, `?x=60&z=10&turn=1.5` starts at that place and facing.
