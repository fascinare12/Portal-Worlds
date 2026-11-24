import { heightOf, hidden, stands } from './fold';
import type { Spread } from './fold';

/**
 * The stories. Each spread has a line of the tale and one thing the scene
 * needs. How the need is met is the builder's own business: the check looks
 * only at what stands, what is hidden, and how tall, never at which mechanism
 * was used.
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
  pages: Page[];
}

const tallest = (spread: Spread, arts: string[]) => Math.max(0, ...spread.pieces.filter((p) => stands(p) && arts.includes(p.art)).map(heightOf));
const cm = (n: number) => `${n} cm`;

export const PIGS: Story = {
  id: 'pigs',
  title: 'The Three Little Pigs',
  pages: [
    {
      line: 'Once upon a time three little pigs left home, and walked through the wood to seek their fortunes.',
      need: 'Make the wood: two things that stand up when the book opens.',
      check(s) {
        const up = s.pieces.filter((p) => stands(p) && heightOf(p) >= 3).length;
        return up >= 2 ? null : up === 1 ? 'One thing is standing. The wood needs one more.' : `Nothing is standing up yet. Try a V-fold, and make it at least ${cm(3)} tall.`;
      },
    },
    {
      line: 'The first little pig built a house of straw, because it was the quickest.',
      need: 'Build the straw house so that it stands up.',
      check(s) {
        return tallest(s, ['straw', 'strawhouse']) >= 3 ? null : `Something made of straw has to stand up, at least ${cm(3)} tall. Choose a fold, then give it the straw paper or the straw house.`;
      },
    },
    {
      line: 'But a wolf was watching. He waited where nobody could see him.',
      need: 'Hide the wolf, so that he cannot be seen until a flap is lifted.',
      check(s) {
        const wolves = s.pieces.filter((p) => p.kind === 'sticker' && p.art === 'wolf');
        if (!wolves.length) return 'Stick the wolf on the page first.';
        return wolves.every((w) => hidden(s, w)) ? null : 'The wolf can still be seen. Put a flap over him, big enough to cover all of him.';
      },
    },
    {
      line: 'The second little pig built a house of sticks. It was taller than the straw house, and he was very proud of it.',
      need: `Build the stick house, taller than ${cm(5)}.`,
      check(s) {
        const h = tallest(s, ['sticks', 'stickhouse']);
        return h > 5 ? null : h > 0 ? `The stick house is ${h.toFixed(1)} cm tall. It needs to be taller than ${cm(5)}, and still shut inside the book.` : 'Something made of sticks has to stand up.';
      },
    },
    {
      line: 'The third little pig built a house of bricks. It took all summer, and it was the tallest and the strongest of all. The wolf huffed, and he puffed, and he could not blow it down.',
      need: `Build the brick house, at least ${cm(8)} tall, with a pig safe beside it.`,
      check(s) {
        const h = tallest(s, ['bricks', 'brickhouse']);
        if (h < 8) return h > 0 ? `The brick house is ${h.toFixed(1)} cm tall. Make it at least ${cm(8)}. If it pokes out of the book, turn it or change its angle.` : 'Something made of bricks has to stand up.';
        return s.pieces.some((p) => p.art === 'pig') ? null : 'The house is strong enough. Now add a pig.';
      },
    },
  ],
};
