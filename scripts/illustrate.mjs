#!/usr/bin/env node
/**
 * Paints the Pop-up Book's pictures and page backgrounds with Replicate.
 *
 *   REPLICATE_API_TOKEN=... node scripts/illustrate.mjs            everything not yet made
 *   REPLICATE_API_TOKEN=... node scripts/illustrate.mjs pig wolf   only these pictures
 *   REPLICATE_API_TOKEN=... node scripts/illustrate.mjs --pages    only the page backgrounds
 *   node scripts/illustrate.mjs --list                             what would be made, and nothing else
 *
 * The files go into worlds/popup/pictures/, where the book finds them by
 * name. A file that is already there is left alone, so a picture is redone
 * by deleting it and running this again. Look at every picture before
 * committing it: these are for small children.
 *
 * The token is read from the environment and is never written anywhere.
 *
 * Before the first run, check the two model names below against
 * https://replicate.com: models are renamed and retired, and this was
 * written without a token to try them with.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Makes the picture. */
const PAINTER = 'black-forest-labs/flux-schnell';
/** Takes the background away, so that a picture can be cut out round its edge. */
const CUTTER = '851-labs/background-remover';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'worlds', 'popup', 'pictures');
const STYLE = 'soft pastel storybook illustration for young children, gouache and coloured pencil, gentle rounded shapes, warm muted colours, friendly, hand-painted texture, no text, no lettering';
const ALONE = 'a single subject, whole and centred, seen from the front, standing on nothing, plain pure white background, no shadow on the ground, no border, no frame';

/** Each picture: what it is of. The names are the ones in worlds/popup/art.ts. */
const PICTURES = {
  tree: 'a round leafy tree with a brown trunk',
  pine: 'a pine tree',
  bush: 'a round green bush with a few red berries',
  hill: 'a rounded green grassy hill',
  sun: 'a plain yellow sun with rays, no face',
  cloud: 'a fluffy white cloud with a soft blue-grey edge',
  pig: 'a little pink pig standing up',
  wolf: 'a grey wolf sitting, sly but not frightening',
  strawhouse: 'a small cottage made of yellow straw with a thatched roof and a round door',
  stickhouse: 'a small cottage built of brown sticks and branches',
  brickhouse: 'a neat red brick cottage with a grey roof, a chimney and a blue door',
  pot: 'a black iron cooking pot of soup over a small fire, steam rising',
  flower: 'a pink flower on a green stem with two leaves',
  beanstalk: 'a tall twisting green beanstalk with big leaves, going straight up',
  giant: 'a big sleepy giant in a green tunic, gentle face',
  castle: 'a pale stone castle with two towers and red pointed roofs',
  cow: 'a white cow with black patches, seen from the side',
  beans: 'five magic beans in different colours',
  jack: 'a boy in a red shirt and blue trousers',
  egg: 'one golden egg on a little nest',
  goat: 'a white billy goat with curved horns and a beard, seen from the side',
  troll: 'a green troll with big ears and a wide grin, grumpy but funny',
  redhood: 'a little girl in a red hooded cloak carrying a basket',
  cottage: 'a cosy cream cottage with a brown roof, green door and two windows',
  bed: 'a wooden bed with a white pillow and a blue blanket, seen from the side',
  basket: 'a wicker basket with a cloth, a loaf and an apple',
  tower: 'a tall thin grey stone tower with one window at the top and a purple pointed roof, no door',
  rapunzel: 'a girl in a lilac dress with very long golden hair',
  hair: 'one very long thick golden plait of hair hanging straight down, tied with a red ribbon at the bottom',
  prince: 'a young prince in a blue coat with a small gold crown',
  witch: 'an old witch in a dark cloak and a pointed hat, stern but not frightening',
  peach: 'one large pink peach with a green leaf',
  momotaro: 'Momotaro, a Japanese folk-tale boy hero in a white and blue kimono jacket with a white headband with a small peach on it',
  dog: 'a friendly tan dog, seen from the side',
  monkey: 'a small brown monkey sitting, with a long curled tail',
  pheasant: 'a green pheasant with a red face and long brown tail feathers, seen from the side',
  oni: 'a Japanese folk-tale oni: a red ogre with two small horns and tiger-skin shorts, comic and not frightening',
  boat: 'a small wooden sailing boat with one white sail',
  treasure: 'an open wooden treasure chest full of gold coins and one red jewel',
  spider: 'Anansi the spider of West African folk tales: a cheerful brown spider with eight long legs and a gold pattern on his back',
  claypot: 'a round clay pot with a narrow neck and a simple painted zigzag band',
  web: 'a white spider web, a neat wheel shape',
  palm: 'a very tall thin palm tree',
  monk: 'a kindly travelling Buddhist monk in an orange robe with a walking staff',
  stones: 'three smooth grey river stones',
  carrot: 'one orange carrot with green leaves',
  cabbage: 'one green cabbage',
  lantern: 'a red paper lantern with a gold tassel',
  villager: 'a little girl with two black hair buns in a teal dress',
};

/** Each paper: what it is a pattern of. These fill the whole square. */
const PAPERS = {
  straw: 'yellow straw thatch',
  sticks: 'brown wooden sticks laid side by side',
  bricks: 'red brick wall',
  grass: 'green meadow grass',
  water: 'blue river water with soft ripples',
  planks: 'warm brown wooden planks',
  stone: 'grey castle stone blocks',
  cloudpaper: 'white clouds on pale blue sky',
};

/** Each spread's background: the ground and the far distance only, since the things themselves pop up. */
const PAGES = {
  pigs: ['a path through a sunny wood', 'a golden meadow at the edge of a wood', 'tall grass and bushes in a shady wood', 'a woodland clearing with logs', 'a green hillside garden with a little path'],
  jack: ['a country lane between fields', 'a cottage garden at dawn with a vegetable patch', 'the top of the clouds, soft white and gold', 'pale sky with clouds drifting, seen from high up', 'a cottage garden in summer'],
  goats: ['a bare stony hillside with a river below', 'a river running across the middle from top to bottom, grassy banks', 'a dusty path leading to a river', 'a river with splashes, grassy banks', 'a lush green hillside meadow with flowers'],
  red: ['a forest floor with a winding path and wild flowers', 'the deep forest floor, ferns and shadows', 'a garden path leading to a doorstep', 'the inside of a cosy bedroom, wooden floor and a rug', 'the edge of the forest in evening light'],
  rapunzel: ['a forest clearing with thorny bushes', 'the foot of a stone tower, grass and wild roses', 'a mossy forest floor at dusk', 'a wild overgrown wood, tangled roots', 'a castle courtyard garden with roses'],
  momotaro: ['a Japanese riverbank with reeds and smooth stones, a river across the middle', 'the earth floor of an old Japanese farmhouse, tatami mat', 'a mountain road in Japan with pine trees far off', 'a calm sea with a rocky island on the horizon', 'the stone courtyard of an island fortress'],
  anansi: ['a West African village yard, red earth and woven mats', 'the floor of a tropical forest, big leaves and roots', 'the forest floor beside the foot of a huge tree', 'a forest path with dappled light, red earth', 'a forest clearing, leaves blowing in the wind'],
  soup: ['a mountain village street in old China, grey stone paving', 'a village square with stone paving and a well', 'a narrow lane between courtyard walls', 'a village square, doors standing open', 'a village square at night under strings of lanterns'],
};

const token = process.env.REPLICATE_API_TOKEN;
const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith('--'));
const jobs = [];
if (!args.includes('--pages')) {
  for (const [id, what] of Object.entries(PICTURES)) jobs.push({ file: `${id}.png`, id, prompt: `${what}. ${STYLE}. ${ALONE}.`, shape: '1:1', cut: true });
  for (const [id, what] of Object.entries(PAPERS)) jobs.push({ file: `${id}.jpg`, id, prompt: `a flat seamless pattern of ${what}, filling the whole picture edge to edge, seen straight on. ${STYLE}.`, shape: '1:1', cut: false });
}
if (!only.length || args.includes('--pages'))
  for (const [story, pages] of Object.entries(PAGES)) pages.forEach((what, i) => jobs.push({ file: `page-${story}-${i + 1}.jpg`, id: `page-${story}-${i + 1}`, prompt: `${what}, seen from above at a slant like a stage floor, empty of people, animals and buildings, plenty of open ground in the middle. ${STYLE}. Very pale and soft, low contrast, so that things placed on top stand out.`, shape: '4:3', cut: false }));

const todo = jobs.filter((j) => (!only.length || only.includes(j.id)) && !existsSync(join(OUT, j.file)));
if (args.includes('--list')) {
  for (const j of todo) console.log(`${j.file}\n    ${j.prompt}`);
  console.log(`${todo.length} to make.`);
  process.exit(0);
}
if (!token) {
  console.error('Set REPLICATE_API_TOKEN first. (Nothing was made.)');
  process.exit(1);
}

/** Runs one model and returns the address of what it made. */
async function run(model, input) {
  const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
    body: JSON.stringify({ input }),
  });
  let job = await res.json();
  if (!res.ok) throw new Error(`${model}: ${res.status} ${job.detail ?? JSON.stringify(job)}`);
  // Most finish while we wait; the rest are asked after until they do.
  while (job.status === 'starting' || job.status === 'processing') {
    await new Promise((done) => setTimeout(done, 1500));
    job = await (await fetch(job.urls.get, { headers: { Authorization: `Bearer ${token}` } })).json();
  }
  if (job.status !== 'succeeded') throw new Error(`${model}: ${job.status} ${job.error ?? ''}`);
  return Array.isArray(job.output) ? job.output[0] : job.output;
}

mkdirSync(OUT, { recursive: true });
let made = 0;
for (const j of todo) {
  try {
    let url = await run(PAINTER, { prompt: j.prompt, aspect_ratio: j.shape, output_format: j.cut ? 'png' : 'jpg', num_outputs: 1, seed: 7 });
    if (j.cut) url = await run(CUTTER, { image: url });
    writeFileSync(join(OUT, j.file), Buffer.from(await (await fetch(url)).arrayBuffer()));
    made++;
    console.log(`made ${j.file}`);
  } catch (e) {
    console.error(`FAILED ${j.file}: ${e.message}`);
  }
}
console.log(`${made} of ${todo.length} made. Look at each one before committing.`);
