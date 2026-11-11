# Portal Worlds

A small 3D wood full of pools for children to explore. Some pools are open
doorways to other worlds: they glow, swirl and send up sparks.

There is no text in the world and nothing to lose. It runs entirely in the
browser: no server, no accounts, no data collected.

## Controls

| Action | Touch | Laptop |
|---|---|---|
| Move | drag with one finger | drag, arrow keys or WASD |
| Zoom (overhead view down to standing in the wood) | pinch | scroll wheel, trackpad pinch, `+` / `-` |
| Turn | twist with two fingers | right-drag, `Q` / `E` |
| Go to a spot or a pool | tap it | click it |
| Wake a sleeping pool | touch it | pass the mouse over it |

## Worlds

The wood is the hub. A pool that leads somewhere shows that place when you
stand over it: tap the pool once to lean in, and again to dive through. You
arrive rising out of a matching pool, which is also the way home.

Each world is a separate page in its own folder under `worlds/`, with its own
code and its own rules. To add one, create `worlds/<name>/index.html`, list it
in `vite.config.ts`, and set `world: '<name>'` on a pool in
`src/world/layout.ts`.

| World | Folder | Pool |
|---|---|---|
| Desert | `worlds/desert/` | pale sand; shows a pyramid being built |
| Shibuya | `worlds/shibuya/` | red; shows 日本 being sprayed on a wall |
| The deep sea | `worlds/sea/` | ice blue; shows small fish circling in dark water |

## Visitors

Creatures from other worlds come through their pools. A sandstone sphinx
wades out of the desert pool every couple of minutes, lies on the bank for a
while, then walks back in. Add `?visit=now` to the address to see it at once.

A white fox with red markings comes through the red pool. It springs out and
shakes itself dry, trots about with its nose down, freezes with ears pricked,
pounces nose-first into the grass, curls up for a nap, then stretches and
jumps back in. It has one tail for every five words found in Shibuya, up to
nine.

A jellyfish made of light rises out of the ice-blue pool, drifts among the
trees as if the air were sea, and sinks back in.

## Time of day

The sky follows the real sun over Brevard, North Carolina: morning light,
golden evenings, and night with a moon, stars and fireflies. To try another
time while developing, add `?sun=` and the sun's height in degrees to the
address (`?sun=50` noon, `?sun=1` sunset, `?sun=-20` night).

## Seasons

Leaf colour and fallen leaves follow the calendar in Brevard: blossom in
spring, deep green in summer, turning in early fall, dark red in late fall,
thin brown crowns in winter. To try another, add `?season=` with `spring`,
`summer`, `earlyFall`, `lateFall` or `winter`.

## Run it

```
npm install
npm run dev      # local development
npm run build    # static site in dist/, hostable anywhere
```
