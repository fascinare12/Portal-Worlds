# The Endless Canon

The world behind the white pool in the wood: a spire in white mist, and round
it a path of stones that is also a piece of music. Time runs round the spire;
the height of a stone is the height of its note. Three voices walk it.

The music is J. S. Bach's *Canon a 2 per tonos* from the Musical Offering
(BWV 1079, 1747): eight bars that end one whole tone higher than they begin,
so that they can be played for ever, always rising. Douglas Hofstadter made
it the opening example of a "strange loop" in *Gödel, Escher, Bach*.

## What she does

She builds the canon one rule at a time. Each rule is something she sets and
then hears.

1. **A tune.** One voice walks once round.
2. **The tune chases itself.** A second tune joins, and then its echo. She
   sets how far behind the echo walks and how much higher it sings. A red
   line shows how much the three voices are clashing; Bach's setting (one bar
   behind, a fifth higher) keeps it lowest.
3. **The end is higher than the beginning.** The eight bars finish in a new
   key, so a flat circle does not join up. A clock of the twelve notes shows
   where the round arrives (a ring) and where the next begins (a dot). When
   she moves the dot into the ring, the circle becomes a spiral.
4. **Home, but higher.** She climbs. The stones change colour with the key.
   After six rounds the first colour returns: the same notes, six rounds up.
   Then she looks from above, where the spiral is a circle.

After that it is hers. Every rule can be changed (begin each round three
half-steps higher and home comes every four rounds, not six; the clock draws
a square in place of a hexagon), any voice silenced, and any stone dragged up
or down, which changes that note in every round at once.

- Drag to look round the spire; scroll or pinch to come nearer.
- **◉** looks from the side or from above. **new** takes it apart. **♪** is
  the sound. The green button goes home. Press the panel's heading to fold it.

Kept in this browser: which rule she has reached and how the rules are set.
Changed stones are not kept.

## How it never stops rising

Each note is a small stack of the same note in several octaves, under a soft
bell curve of loudness that stays where the note was written while the stack
slides up with each round. After twelve half-steps the stack is exactly what
it was. This is Roger Shepard's illusion (1964).

## Where the notes come from, and how sure they are

Transcribed by eye from a modern typeset score of the public-domain work (the
Internet Archive's copy of an IMSLP edition), bars 1 to 8, into `score.ts`.
Two checks were made by program: each line adds up to exactly eight bars, and
the echo as printed equals the tune moved by one bar and a fifth in every bar
that was read. Nobody has yet listened to it. The first sixteenth of every
round after the first is a joining note that the score shows in bar 9.

Two honest limits on what the red line proves. Bach's setting is the least
clashing of the twenty offered, but not by a wide margin (about 0.31 against
0.38 for the next best, on the measure used). And the reason for rule 3 is a
change of key, which that measure barely registers; that is why rule 3 is
shown on the clock and not left to the line.

## Files

- `score.ts`: the notes, and the rules that place them in the endless piece.
- `sound.ts`: the voices.
- `main.ts`: the spire, the stones, the walkers, the rules and what is said.

For development: `?fresh`, `?stage=3`, `?top`, `?speed=4`.
