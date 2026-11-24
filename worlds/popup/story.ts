import { heightOf, hidden, stands } from './fold';
import type { Piece, Spread } from './fold';

/**
 * The stories. Each spread has a line of the tale and one thing the scene
 * needs. How the need is met is mostly the builder's own business: the check
 * looks at what stands, what is hidden, what slides and how tall, and only
 * now and then asks for one particular kind of piece, when the point of the
 * spread is to try it.
 *
 * The tales are old ones, told here in this book's own words. The Stone Soup
 * with travelling monks follows the setting Jon J Muth gave it in 2003, and
 * borrows nothing else from his book.
 */
export interface Page {
  line: string;
  need: string;
  /** Null when the need is met; otherwise a sentence saying what is still missing. */
  check(spread: Spread): string | null;
}
export interface Story {
  id: string;
  title: string;
  /** Where the tale is from, for the shelf. */
  from: string;
  /** The picture on the shelf. */
  art: string;
  /** The pictures this tale uses, shown first when choosing. */
  arts: string[];
  pages: Page[];
}

const cm = (n: number) => `${n} cm`;
const up = (s: Spread, arts: string[]) => s.pieces.filter((p) => stands(p) && arts.includes(p.art));
const tallest = (s: Spread, arts: string[]) => Math.max(0, ...up(s, arts).map(heightOf));
const has = (s: Spread, art: string) => s.pieces.some((p) => p.art === art);
const stuck = (s: Spread, art: string) => s.pieces.filter((p) => p.kind === 'sticker' && p.art === art);
const slides = (s: Spread, arts: string[]) => s.pieces.filter((p) => p.kind === 'slide' && arts.includes(p.art));
/** Is this sticker out of sight under something that stands over it: a bridge, a table, a tent? */
const sheltered = (s: Spread, p: Piece) => s.pieces.some((q) => (q.kind === 'platform' || q.kind === 'tent') && Math.abs(p.z - q.z) + p.h / 2 <= q.w / 2 + 0.05 && Math.abs(p.x) + p.w / 2 <= q.reach + Math.abs(q.x) + 0.05);

/** The checks that come up again and again, each with its own sentence. */
const standing = (arts: string[], what: string, least = 3) => (s: Spread) => (tallest(s, arts) >= least ? null : tallest(s, arts) > 0 ? `${what} is ${tallest(s, arts).toFixed(1)} cm tall. Make it at least ${cm(least)}, and still shutting inside the book.` : `${what} has to stand up when the book opens. Choose a fold, then give it that picture.`);
const hide = (art: string, who: string) => (s: Spread) => {
  const them = stuck(s, art);
  if (!them.length) return `Stick ${who} on the page first, as a sticker.`;
  return them.every((p) => hidden(s, p)) ? null : `${who[0].toUpperCase()}${who.slice(1)} can still be seen. Put a flap over the whole of it.`;
};
const pull = (arts: string[], who: string, far = 3) => (s: Spread) => {
  const them = slides(s, arts);
  if (!them.length) return `Use a pull tab, and give it ${who}.`;
  return them.some((p) => p.reach >= far) ? null : `Make it slide further: at least ${cm(far)}.`;
};
const all = (...checks: ((s: Spread) => string | null)[]) => (s: Spread) => {
  for (const c of checks) {
    const hint = c(s);
    if (hint) return hint;
  }
  return null;
};
const present = (art: string, who: string) => (s: Spread) => (has(s, art) ? null : `Now add ${who}.`);
const TREES = ['tree', 'pine', 'palm', 'bush', 'beanstalk'];
const HOUSES = ['cottage', 'strawhouse', 'stickhouse', 'brickhouse'];

export const PIGS: Story = {
  id: 'pigs',
  title: 'The Three Little Pigs',
  from: 'An English nursery tale',
  art: 'pig',
  arts: ['pig', 'wolf', 'strawhouse', 'stickhouse', 'brickhouse', 'straw', 'sticks', 'bricks', 'tree', 'pine', 'bush'],
  pages: [
    {
      line: 'Once upon a time three little pigs left home, and walked through the wood to seek their fortunes.',
      need: 'Make the wood: two things that stand up when the book opens.',
      check(s) {
        const n = s.pieces.filter((p) => stands(p) && heightOf(p) >= 3).length;
        return n >= 2 ? null : n === 1 ? 'One thing is standing. The wood needs one more.' : `Nothing is standing up yet. Try a V-fold, and make it at least ${cm(3)} tall.`;
      },
    },
    { line: 'The first little pig built a house of straw, because it was the quickest.', need: 'Build the straw house so that it stands up.', check: standing(['straw', 'strawhouse'], 'The straw house') },
    { line: 'But a wolf was watching. He waited where nobody could see him.', need: 'Hide the wolf, so that he cannot be seen until a flap is lifted.', check: hide('wolf', 'the wolf') },
    { line: 'The second little pig built a house of sticks. It was taller than the straw house, and he was very proud of it.', need: `Build the stick house, taller than ${cm(5)}.`, check: standing(['sticks', 'stickhouse'], 'The stick house', 5.25) },
    {
      line: 'The third little pig built a house of bricks. It took all summer, and it was the tallest and the strongest of all. The wolf huffed, and he puffed, and he could not blow it down.',
      need: `Build the brick house, at least ${cm(8)} tall, with a pig safe beside it.`,
      check: all(standing(['bricks', 'brickhouse'], 'The brick house', 8), present('pig', 'a pig')),
    },
  ],
};

const JACK: Story = {
  id: 'jack',
  title: 'Jack and the Beanstalk',
  from: 'An English fairy tale',
  art: 'beanstalk',
  arts: ['jack', 'cow', 'beans', 'beanstalk', 'castle', 'giant', 'egg', 'cloud', 'cloudpaper', 'cottage', 'bush'],
  pages: [
    { line: 'Jack and his mother were so poor that they had to sell their cow. On the way to market, Jack swapped her for five magic beans.', need: 'Stand the cow up, and put the beans beside her.', check: all(standing(['cow'], 'The cow'), present('beans', 'the magic beans')) },
    { line: 'His mother threw the beans out of the window. In the night a beanstalk grew: up, and up, past the clouds.', need: `Grow the beanstalk at least ${cm(11)} tall. It still has to shut inside the book.`, check: standing(['beanstalk'], 'The beanstalk', 11) },
    { line: 'At the top was a castle, and in the castle a giant lay asleep.', need: 'Stand the castle up, and hide the sleeping giant under a flap.', check: all(standing(['castle'], 'The castle', 5), hide('giant', 'the giant')) },
    { line: 'Jack took the hen that laid golden eggs, and ran. Down the beanstalk he slid, with the giant close behind.', need: 'Make Jack slide: put him on a pull tab.', check: pull(['jack'], 'Jack') },
    {
      line: 'Jack chopped the beanstalk down, and that was the end of the giant. He and his mother were never poor again.',
      need: 'Make their garden: something with a fold inside a fold (a double V), and the golden egg.',
      check: all((s) => (s.pieces.some((p) => p.kind === 'double') ? null : 'Try the double V: a fold with a second fold inside it.'), present('egg', 'the golden egg')),
    },
  ],
};

const GOATS: Story = {
  id: 'goats',
  title: 'The Three Billy Goats Gruff',
  from: 'A Norwegian folk tale',
  art: 'goat',
  arts: ['goat', 'troll', 'planks', 'water', 'grass', 'hill', 'bush', 'tree'],
  pages: [
    { line: 'Three billy goats called Gruff lived on a bare hillside. Across the river, the grass was thick and sweet.', need: 'Make the green hill they longed for: something grassy, standing up.', check: standing(['grass', 'hill'], 'The green hill') },
    {
      line: 'The only way across was a bridge. And under the bridge lived a troll.',
      need: 'Build a bridge over the fold, and stick the troll underneath it.',
      check(s) {
        if (!s.pieces.some((p) => p.kind === 'platform' || p.kind === 'tent')) return 'A platform makes a good bridge: a flat top held up over the middle of the book.';
        const trolls = stuck(s, 'troll');
        if (!trolls.length) return 'Now stick the troll on the page, as a sticker.';
        return trolls.some((t) => sheltered(s, t)) ? null : 'The troll has to be right under the bridge. Move him, or make the bridge bigger.';
      },
    },
    {
      line: 'Trip, trap! The littlest goat went first. "Do not eat me," he said. "My brother is coming, and he is much bigger."',
      need: 'Stand up three goats: little, middle-sized and big.',
      check(s) {
        const sizes = up(s, ['goat']).map(heightOf).sort((a, b) => a - b);
        if (sizes.length < 3) return `${sizes.length ? `${sizes.length} standing so far. ` : ''}Three goats have to stand up.`;
        return sizes[1] - sizes[0] >= 1 && sizes[2] - sizes[1] >= 1 ? null : 'They are too alike. Make each one at least a centimetre taller than the last.';
      },
    },
    { line: 'Then came the biggest goat. He put down his horns and butted the troll right off the bridge.', need: 'Send the troll flying: put him on a pull tab.', check: pull(['troll'], 'the troll') },
    {
      line: 'And the three billy goats ate sweet grass on the far hillside until they were fat.',
      need: 'Make the hillside: a double V of anything green, and three goats.',
      check: all(
        (s) => (s.pieces.some((p) => p.kind === 'double') ? null : 'Try the double V: a fold with a second fold inside it.'),
        (s) => (s.pieces.filter((p) => p.art === 'goat').length >= 3 ? null : 'All three goats should be here.'),
      ),
    },
  ],
};

const RED: Story = {
  id: 'red',
  title: 'Little Red Riding Hood',
  from: 'A French and German fairy tale',
  art: 'redhood',
  arts: ['redhood', 'wolf', 'cottage', 'bed', 'basket', 'tree', 'pine', 'bush', 'flower'],
  pages: [
    {
      line: 'A girl in a red hood set out through the forest, with a basket for her grandmother.',
      need: 'Make a deep forest: three trees standing, some near and some far. Then add the girl.',
      check(s) {
        const depths = [...new Set(up(s, TREES).map((p) => Math.round(p.z / 2)))];
        if (depths.length < 3) return `${up(s, TREES).length} of 3 trees are standing${up(s, TREES).length >= 3 ? ', but they are all at the same depth. Move some nearer and some further back' : ''}.`;
        return has(s, 'redhood') ? null : 'Now add Red Riding Hood.';
      },
    },
    { line: 'A wolf was watching her from behind the trees.', need: 'Hide the wolf under a flap.', check: hide('wolf', 'the wolf') },
    { line: 'She came at last to her grandmother\'s cottage, and knocked.', need: `Stand the cottage up, at least ${cm(6)} tall.`, check: standing(HOUSES, 'The cottage', 6) },
    { line: '"Grandmother, what big teeth you have!" But it was not Grandmother in the bed.', need: 'Put the bed on the page, with the wolf hidden under a flap.', check: all(present('bed', 'the bed'), hide('wolf', 'the wolf')) },
    { line: 'A woodcutter heard her shout. He chased the wolf out of the cottage and far away into the forest.', need: 'Chase the wolf away: put him on a pull tab.', check: pull(['wolf'], 'the wolf') },
  ],
};

const RAPUNZEL: Story = {
  id: 'rapunzel',
  title: 'Rapunzel',
  from: 'A German fairy tale',
  art: 'tower',
  arts: ['rapunzel', 'tower', 'hair', 'prince', 'witch', 'castle', 'stone', 'tree', 'pine', 'bush'],
  pages: [
    { line: 'A witch took a girl called Rapunzel and shut her at the top of a tower that had no door and no stairs.', need: `Build the tower, at least ${cm(9)} tall.`, check: standing(['tower', 'stone'], 'The tower', 9) },
    { line: 'Rapunzel\'s golden hair grew as long as the tower was tall. "Rapunzel, Rapunzel, let down your hair!"', need: `Let down her hair: put it on a pull tab that slides at least ${cm(4)}.`, check: pull(['hair'], 'the golden hair', 4) },
    { line: 'A prince heard her singing. He hid, and watched how the witch climbed up.', need: 'Hide the prince under a flap.', check: hide('prince', 'the prince') },
    {
      line: 'When the witch found out, she sent Rapunzel far away into a wild wood.',
      need: 'Make the wild wood: a double V, and two more things standing.',
      check: all(
        (s) => (s.pieces.some((p) => p.kind === 'double') ? null : 'Try the double V: a fold with a second fold inside it.'),
        (s) => (s.pieces.filter((p) => stands(p) && p.kind !== 'double').length >= 2 ? null : 'A wood needs more than one tree. Stand up two more things.'),
      ),
    },
    { line: 'The prince searched until he found her, and they went home together.', need: `Stand up a castle at least ${cm(7)} tall, with Rapunzel and the prince.`, check: all(standing(['castle'], 'The castle', 7), present('rapunzel', 'Rapunzel'), present('prince', 'the prince')) },
  ],
};

const MOMOTARO: Story = {
  id: 'momotaro',
  title: 'Momotaro, the Peach Boy',
  from: 'A Japanese folk tale',
  art: 'peach',
  arts: ['momotaro', 'peach', 'dog', 'monkey', 'pheasant', 'oni', 'boat', 'treasure', 'castle', 'stone', 'water'],
  pages: [
    { line: 'An old woman was washing clothes in the river when a giant peach came floating by.', need: 'Make the river from the water paper, and float the peach along on a pull tab.', check: all(present('water', 'the river: anything made of the water paper'), pull(['peach'], 'the peach')) },
    { line: 'She and her husband cut the peach open, and inside was a baby boy. They called him Momotaro: Peach Boy.', need: 'Hide Momotaro under a flap. (A peach makes a good flap.)', check: hide('momotaro', 'Momotaro') },
    {
      line: 'When he was grown, Momotaro set out for the island of the oni, with millet dumplings in his bag. A dog, a monkey and a pheasant each joined him for a dumpling.',
      need: 'Stand up all four: Momotaro, the dog, the monkey and the pheasant.',
      check(s) {
        const missing = [['momotaro', 'Momotaro'], ['dog', 'the dog'], ['monkey', 'the monkey'], ['pheasant', 'the pheasant']].filter(([art]) => !up(s, [art]).length).map(([, name]) => name);
        return missing.length ? `Still to stand up: ${missing.join(', ')}.` : null;
      },
    },
    { line: 'They sailed across the sea to the island, where the oni had a great fortress.', need: `Build the fortress at least ${cm(8)} tall, and add the boat.`, check: all(standing(['castle', 'stone', 'bricks'], 'The fortress', 8), present('boat', 'the boat')) },
    { line: 'The pheasant pecked, the monkey climbed the wall, the dog bit, and Momotaro fought. The oni gave in, and handed over their treasure, and the four friends carried it home.', need: 'Stand up an oni, and hide the treasure under a flap.', check: all(standing(['oni'], 'The oni'), hide('treasure', 'the treasure')) },
  ],
};

const ANANSI: Story = {
  id: 'anansi',
  title: 'Anansi and the Pot of Wisdom',
  from: 'An Akan tale from Ghana',
  art: 'spider',
  arts: ['spider', 'claypot', 'palm', 'web', 'tree', 'bush', 'sun'],
  pages: [
    { line: 'Anansi the spider wanted to be the wisest of all. He went round the whole world gathering up wisdom, and put every bit of it into one pot.', need: 'Stand Anansi up, with the pot of wisdom beside him.', check: all(standing(['spider'], 'Anansi'), present('claypot', 'the pot of wisdom')) },
    { line: 'He would hide it where nobody else could reach: at the top of the tallest tree in the forest.', need: `Grow the tallest tree: at least ${cm(11)}.`, check: standing(TREES, 'The tree', 11) },
    { line: 'He tied the pot to his belly and began to climb. But the pot was in his way, and he slid down again and again.', need: 'Make Anansi slide down: put him on a pull tab.', check: pull(['spider'], 'Anansi') },
    {
      line: 'His son Ntikuma called up from below: "Father, why not tie it on your back?" It worked. And Anansi was cross that a child had thought of what he had not.',
      need: 'Stand up Anansi and little Ntikuma: two spiders, one smaller than the other.',
      check(s) {
        const sizes = up(s, ['spider']).map(heightOf).sort((a, b) => a - b);
        if (sizes.length < 2) return 'Two spiders have to stand up: father and son.';
        return sizes[sizes.length - 1] - sizes[0] >= 1.5 ? null : 'Make Ntikuma smaller than his father, by a centimetre and a half or more.';
      },
    },
    {
      line: 'In his temper he threw the pot down. It broke, and the wisdom blew away over the whole world. That is why everybody has a little wisdom, and nobody has it all.',
      need: 'Make the forest with a double V, and put the pot on the ground.',
      check: all((s) => (s.pieces.some((p) => p.kind === 'double') ? null : 'Try the double V: a fold with a second fold inside it.'), present('claypot', 'the pot')),
    },
  ],
};

const SOUP: Story = {
  id: 'soup',
  title: 'Stone Soup',
  from: 'An old tale, told with travelling monks',
  art: 'stones',
  arts: ['monk', 'stones', 'pot', 'villager', 'carrot', 'cabbage', 'lantern', 'cottage', 'strawhouse', 'stickhouse', 'planks'],
  pages: [
    {
      line: 'Three monks came walking to a village in the mountains. The people there trusted nobody, not even each other, and they shut their doors.',
      need: 'Build the village: three houses standing up.',
      check(s) {
        const n = up(s, [...HOUSES, 'straw', 'sticks', 'bricks']).length;
        return n >= 3 ? null : `${n} of 3 houses are standing.`;
      },
    },
    { line: 'The monks lit a fire in the square, filled a small pot with water, and dropped in three smooth stones. "We are making stone soup," they said.', need: 'Stand up a monk, and put the cooking pot and the three stones by him.', check: all(standing(['monk'], 'The monk'), present('pot', 'the cooking pot'), present('stones', 'the three stones')) },
    { line: 'A little girl crept out to look. "Our pot is too small," said the monks. So she ran and fetched her mother\'s biggest one.', need: 'Hide a villager peeping out: under a flap.', check: hide('villager', 'the villager') },
    { line: '"Stone soup is good," said the monks, "but it is better with a carrot." One by one the doors opened. A carrot came, then a cabbage, then more and more.', need: 'Bring the food to the pot on a pull tab: the carrot or the cabbage.', check: pull(['carrot', 'cabbage'], 'the carrot or the cabbage') },
    {
      line: 'That night the whole village ate together under lanterns, for the first time in years. And they have shared ever since.',
      need: 'Lay the feast: a table that floats level (a platform), two lanterns, and a monk.',
      check: all(
        (s) => (s.pieces.some((p) => p.kind === 'platform') ? null : 'A platform makes the table.'),
        (s) => (s.pieces.filter((p) => p.art === 'lantern').length >= 2 ? null : 'Hang two lanterns.'),
        present('monk', 'a monk'),
      ),
    },
  ],
};

export const STORIES: Story[] = [PIGS, JACK, GOATS, RED, RAPUNZEL, MOMOTARO, ANANSI, SOUP];
