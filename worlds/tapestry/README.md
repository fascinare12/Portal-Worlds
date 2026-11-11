# The Tapestry

The world behind the gold pool in the wood: a long strip of embroidered linen,
read from left to right, that teaches medieval history. The player is the
scribe who finishes it.

Two acts are made so far, twenty panels and 67 questions:

- **II · The Viking Thread** (eight panels): who the Northmen were, the raid
  on Lindisfarne, the road east to Baghdad's silver, settlement from the
  Danelaw to Newfoundland, Cnut and Emma, Rollo's bargain on the Seine, how
  the Northmen of Normandy became French, and William's childhood.
- **III · The Year 1066** (twelve panels): from King Edward dying without an
  heir to William crowned on Christmas Day.

The first panel of each act is open from the start, so either can be begun
first. Within an act the panels unlock in order.

## One cloth, changing borders

The scribe, the linen and the stitches are the same throughout. But each act
borrows its borders and its motifs from the people it is about, and says so
at its head:

- **1066** follows the Bayeux Tapestry itself: slanting bars in the borders,
  and its birds, lions, dragons, hounds and fish.
- **The Viking Thread** has plaited borders, knots between ravens, wolves and
  ribbon-beasts, ships with chequered sails as on the Gotland picture-stones,
  and rune-stones. There is no tapestry of these events, so every Latin
  caption in that act is the scribe's own.

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

**Whose account?** Five panels are told twice, from sources that disagree:

| Panel | One telling | The other |
| --- | --- | --- |
| The raid on Lindisfarne | the monks (the Chronicle; Alcuin) | what the Northmen left: no words, only things |
| Rollo's bargain | Dudo's story, written for Rollo's descendants | a dry charter of 918 |
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
  translation (1823), checked against the Project Gutenberg text (the
  entries for 793, 1017, 1065 and 1066).
- **In the Viking act**, Alcuin, Ibn Fadlan, Dudo of Saint-Quentin and the
  charter of 918 are described or given in reported speech. The Newfoundland
  date of 1021 is from the tree-ring study published in *Nature* in 2021.
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

- `acts.ts`: the acts, and the history of 1066. Every caption, account,
  source note, question and hint. The first answer listed for each question
  is the right one.
- `vikings.ts`: the same for the Viking act.
- `stitch.ts`: drawing as embroidery, in three manners: under-drawing,
  stitched, and stitched wrong.
- `scenes.ts`: the figures, horses, ships and buildings, the twelve scenes,
  and the creatures of the border.
- `main.ts`: the cloth, the desk, stitching, sound, and what is remembered.

For development: `?fresh` ignores what is remembered, `?all` shows everything
stitched, `?at=6` opens on that panel.

## Still to make

Acts 1, 4 and 5 of the outline: Rome's shadow; what the Conquest changed; the
medieval world beyond England. Each will take its borders from its own
sources, as above.
