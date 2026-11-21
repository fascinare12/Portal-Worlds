# The Spire

The world behind the white pool in the wood: a playable companion to Douglas
Hofstadter's *Gödel, Escher, Bach*. The pool opens on a map (`index.html`) of
the steps of the book's argument. Each step has two things:

- a **chamber**, played before or beside its chapter, which ends in a card
  tying what was done to the book's own terms;
- **practice**: short puzzles without end that ask for the same move in
  different dress, for making the idea a habit and not only understood.

Built so far:

| Step | In the book | Chamber | Practice |
| --- | --- | --- | --- |
| A loop through levels | Introduction | The Endless Canon (`canon.html`) | none yet |
| Inside and outside | Chapter I, the MU-puzzle | `rules.html` | `rules.html?practice` |
| Mirrors | Chapter II, the pq-system | `mirror.html` | `mirror.html?practice` |

Four more steps are listed on the map as not built: nesting (ch. V), the record that breaks the player (ch. IV, IX, XIV), levels (ch. X to
XII) and the loop closing (ch. XX).

## Inside and outside

**The chamber** is the MU-puzzle. She starts with MI and four rules and tries
to make MU, for as long as she likes; after a dozen moves the page suggests
pressing ◉. From outside she stops making rows: she counts the I's in a row,
ties them in threes, and tries each rule from each place a row can be. No
rule lands on "none left over", which is where MU is. The card then gives the
book's words: string, axiom, rule of production, theorem, derivation, M-mode
and I-mode, decision procedure.

**Practice** makes a new small system each time (`system.ts`): a start, two
to four rewriting rules, and a target. Half the targets can be reached. She
either gets there, or says it cannot be done and picks the reason from three.
◉ shows tallies of the rows she has made, to look for what never changes.

- There are eight families, each with one thing its rules cannot change: the
  row never shortens; the first symbol is fixed; a count is fixed; a count
  keeps its oddness; two kinds never pass each other; a difference is fixed;
  a weighted total is fixed; a count's leftover in threes (the MU-puzzle's
  own).
- Three levels. Harder families open after three right answers at the level
  below. The family she has got right least often comes up most.
- Three skins (stones, notes, a garden), changed every puzzle.
- `selfCheck()` in `system.ts` makes sixty puzzles in every family and checks
  each by search: reachable targets are reachable in at least three moves,
  unreachable ones are unreachable, the stated reason holds for every row
  that can be made, and the wrong reasons really are wrong. It passes.

Kept in this browser: whether the chamber is done, and right answers by
family.

## Mirrors

**The chamber** is the pq-system. She makes three rows from the starting rows
and the one rule, then is asked of four rows whether each can be made.
Nothing is said about meaning. Then ◉ offers four ways to read the marks:
"plus, equals" and "equals, taken from" both fit every row; "times, equals"
fits one or two and then fails; "horse, happy, apple" says nothing. A last
question asks whether a row that reads as a true sum, but has two p's, can be
made. It cannot: the reading gives no power over the system. The card gives
the book's words: well-formed string, axiom schema, interpretation,
isomorphism, meaningful and meaningless, passive meaning.

**Practice** shows three to five rows that some system makes and asks either
which of three readings makes them all true, or which of four further rows
the same system would make. ◉ shows the rows as counts.

- Eleven readings (`readings.ts`) in three levels: plus, less than, the same
  as, one less than; take away, half of, more than, the larger; times, the
  smaller, goes exactly into.
- The first row shown is chosen, where possible, so that a wrong reading fits
  it too.
- Which of the three symbols is the repeated mark changes every puzzle, as
  does the skin.
- `checkReadings()` makes eighty puzzles of each kind for every reading and
  checks that exactly one offered reading fits all the rows shown, and that
  exactly one offered row belongs. It passes.

---

## The Endless Canon

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
  the sound. ☰ goes back to the map. Press the panel's heading to fold it.

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

- `index.html`, `hub.ts`, `spire.css`: the map, and the look shared by the pages of words and stones.
- `rules.html`, `rules.ts`, `system.ts`: the MU-puzzle chamber, its practice, and the small formal systems.
- `mirror.html`, `mirror.ts`, `readings.ts`: the pq-system chamber, its practice, and the readings.
- `draw.ts`: how a symbol looks and sounds in each skin.
- `canon.html`, `main.ts`: the Endless Canon.
- `score.ts`: the notes, and the rules that place them in the endless piece.
- `sound.ts`: the voices.

For development: `?fresh`, `?stage=3`, `?top`, `?speed=4`.
