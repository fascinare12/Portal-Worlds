# The Pop-up Book

The world behind the cream pool: a book that is built on the screen, opened
and shut by hand, read through, and then printed, cut out and made in paper.

## The rule

Nothing here is faked. Every piece moves as stiff paper would: it bends only
at its folds, stays glued where it is glued, and lies flat when the book is
shut. A piece that could not be made in paper is edged in red, with a
sentence saying why:

- it pokes out of the book when the book shuts;
- its glue is not on the page;
- a corner of it would be pushed through a page part way shut;
- it would pass through another piece somewhere between shut and open (a tent through a platform's top, for one), or two pieces are glued to the same stretch of the spine.

## The mechanisms

| Piece | What it is | The rule it obeys |
|---|---|---|
| V-fold | Creased down the middle, glued to both pages along two lines that meet on the spine | The crease stays square to both glue lines; that fixes how far it leans at every angle |
| Stand-up | A piece that stands on one page, facing the reader, anywhere out from the spine. It is one wing of a lopsided V-fold: its foot runs straight out from the spine, and a small triangular brace on the other page pulls it up | The brace's foot is at 30° to the spine; the crease is at atan(2 tan 30°) ≈ 49.1° to the piece's foot. With those two angles it is exactly upright when the book is flat and exactly flat when it is shut |
| Tent | A strip with one ridge, glued to each page parallel to the spine | The longer side is glued nearer the spine, by exactly the difference in lengths |
| Platform | A level top over the spine, on three legs of one height | The middle leg stands on the spine and stays upright; the top halves stay parallel to the pages |
| Flap | Hinged to one page; lifted by a tap | Cannot cross the spine |
| Sticker | A picture glued flat | Cannot cross the spine |

Parallel ("box" or "step") folds are left out on purpose. They stand when a
card is half open and lie flat when it is opened right out, and this is a
book that opens right out.

## Adding a piece

Tap a kind of piece and its pictures open. Each tap on a picture puts one
more piece of that kind into the book, in the first free place where it
works, edged green for a moment so it can be found. To change a piece that is
already in the book, tap it on the page (it is edged blue), then tap a
picture. A flap has a button to lift it and a line saying what is under it.

## How it is checked

`checkFold()` in `fold.ts` opens two hundred pieces of random size to six
angles each and requires that every side and diagonal of every piece keeps
its length, that every glued corner is still on its page, that folds do not
tear, and that with the book shut everything lies in one plane.
`window.popup.check()` runs it on the page.

## The story

`story.ts` holds The Three Little Pigs as five spreads. Each has a line of
the tale and one thing the scene needs: two things standing; something of
straw that stands; a wolf hidden under a flap; something of sticks taller
than 5 cm; something of bricks at least 8 cm tall, and a pig. The check looks
at what stands, what is hidden and how tall, never at which mechanism was
used. The next spread opens when the need is met and nothing is edged in red.

"My own book" is the same tray with empty pages and no needs.

## Printing

`print.ts` draws every spread at its true size (26 cm by 19 cm): the pages,
with stickers printed in place and a lettered grey patch wherever something
is glued; then each piece flat, with cut lines, fold lines, glue tabs and the
matching letters, and a sentence on how to put it in. It must be printed at
100%.

**The printed sheets have not been made up in paper by anyone yet.** The
geometry is the same as on the screen, but tab sizes, the platform's middle
leg and the wording of the instructions are a first attempt.

## The bookshelf and the covers

The first screen is a bookshelf: the stories to build, the builder's own
books (as many as wanted, each with a name), and a way to start a new one.
Any book can be emptied to build it again, or an own book thrown away; both
take two taps. Books are kept in this browser only.

Every book comes off the shelf shut. Its front cover takes stickers, and an
own book's cover has its title. The cover is printed with the rest.

## A book as a link

In "My own book", "Copy a link" puts the whole book into the address. Whoever
opens the link sees the book without disturbing their own, and can keep it.
Nothing is stored anywhere but in the link.

## Files

- `fold.ts`: the geometry, the faults, and the check.
- `art.ts`: the pictures and papers, as cut paper.
- `story.ts`: the tale and what each spread needs.
- `print.ts`: the sheets.
- `main.ts`: the book on its table, and the controls.
- In the wood: pool 10 in `src/world/layout.ts`.

## Not done

- The other tales (Jack and the Beanstalk, Billy Goats Gruff, Red Riding
  Hood, Rapunzel).
- Pull tabs.
- Standing one piece on another, such as a house on a platform.
- Pictures are cut out round a rectangle on screen for the fault checks, not
  round their true outline, so the checks are slightly strict.
- Reordering and naming pages in "My own book".
