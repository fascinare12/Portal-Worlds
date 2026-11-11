# The Tapestry

The world behind the gold pool in the wood: a long strip of embroidered linen,
read from left to right, that teaches medieval history. The player is the
scribe who finishes it.

So far one act is made: **the year 1066**, in twelve panels, from King Edward
dying without an heir to William crowned on Christmas Day.

## How it works

- Each panel starts as an under-drawing on bare linen.
- At the desk below the cloth she reads a short account of what happened, with
  where the account comes from.
- Then come two to four questions. Each right answer stitches the next part
  of the panel. A wrong answer is stitched in the wrong wools, shivers, and is
  unpicked; a creature from the border gives a hint; that answer is struck
  out and she tries again.
- When a panel is finished the desk says why it mattered, and the next panel's
  under-drawing appears.

**Whose account?** Three panels are told twice, by people who disagreed:

| Panel | One telling | The other |
| --- | --- | --- |
| Harold's oath | the Normans (William of Poitiers) | the English (the Chronicle's silence; Eadmer) |
| Stamford Bridge | the English (Anglo-Saxon Chronicle) | the Northmen (Snorri's saga, c. 1230) |
| Harold's death | the arrow (the tapestry; Amatus; Baudri) | the sword (the Carmen, c. 1067) |

Both tellings must be stitched, side by side in the same panel, and then one
more question asks her to weigh them: what they agree on, what they differ
on, and why.

Two panels (the three claimants, and Stamford Bridge) are not in the real
tapestry at all, and say so. That absence is itself one of the questions in
the last panel, which is about the cloth as an object: who paid for it, who
stitched it, and what it leaves out.

## Moving

- ◀ ▶, the arrow keys, a swipe or the scroll wheel move along the cloth.
- The green button goes home. **new** unpicks everything. ♪ is the sound.

## Sources, and what is certain

- **The Latin captions** are the tapestry's own, taken from F. F. L. Birrell's
  *Guide to the Bayeux Tapestry* (Victoria and Albert Museum, 1921), except
  three written for panels the tapestry does not have: `TRES REGNUM PETUNT`,
  `HIC HAROLD REX NORTHMANNOS VICIT`, and the banners over the paired
  tellings (`NORMANNI DICUNT`, `ANGLI DICUNT`, `NORTHMANNI DICUNT`, `SAGITTA`,
  `GLADIUS`). The game says which are which. `ET FUGA VERTERUNT ANGLI`, the
  last surviving caption, is not in Birrell's list and is given from general
  knowledge.
- **Quotations from the Anglo-Saxon Chronicle** are from James Ingram's
  translation (1823), checked against the Project Gutenberg text.
- **Everything else** is a summary of what is generally taught. The Norman
  writers (William of Poitiers, William of Jumièges), Eadmer, John of
  Worcester, the Carmen, Amatus, Baudri and Snorri are described, not quoted.
  The saga's "seven feet of English ground" is given in reported speech.
- Where historians disagree the text says so: whether Edward died on the 4th
  or 5th of January; who crowned Harold; whether the first Norman retreat at
  Hastings was a trick or a panic; the date of the Carmen; how Harold died;
  who commissioned the tapestry and where it was made.

## What is remembered

In this browser only: which parts of which panels are stitched, and how many
questions were answered right at the first attempt.

## Files

- `acts.ts`: the history. Every caption, account, source note, question and
  hint. The first answer listed for each question is the right one.
- `stitch.ts`: drawing as embroidery, in three manners: under-drawing,
  stitched, and stitched wrong.
- `scenes.ts`: the figures, horses, ships and buildings, the twelve scenes,
  and the creatures of the border.
- `main.ts`: the cloth, the desk, stitching, sound, and what is remembered.

For development: `?fresh` ignores what is remembered, `?all` shows everything
stitched, `?at=6` opens on that panel.

## Still to make

Acts 1, 2, 4 and 5 of the outline: Rome's shadow; the Viking thread; what the
Conquest changed; the medieval world beyond England.
