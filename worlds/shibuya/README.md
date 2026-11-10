# Shibuya

The world behind the red pool in the wood: a city street at night, where
Japanese is learned from zero. It is a separate page with its own code.

## How it plays

1. **Listen.** Tap anything in the street to hear its name and see it in
   hiragana, with romaji and the English underneath.
2. **Find.** Once four words have been heard, the street starts asking in
   Japanese. Things in the street are looked for: `ねこ は どこ？` (where is
   the cat?). Food at the stall is asked for, as a customer would:
   `りんご を ください` (an apple, please). Tapping the wrong thing is not
   penalised: it says its own name.
3. **Write.** The first time a word is found, its outline appears on a wall.
   Tapping the outline opens it for writing with the spray can: each kana in
   turn, each stroke in the proper order and direction. Paint only goes on
   while she follows the stroke. Finishing the word fills the tag with colour.

The counter shows words found and words written, out of 38.

Only words she has already heard are asked. Words missed at the first try
come back soonest; words she knows come back later. Romaji under a word is
dropped once she has found it twice running.

Drag to look around; tap the road to walk; arrows or WASD also work. The green
puddle, or the green button, leads back to the wood.

## Places and words

- **The street:** ねこ cat, いぬ dog, くるま car, でんしゃ train, えき station,
  みせ shop, き tree, つき moon, かさ umbrella, ひと person, はな flower,
  とけい clock, ほし star.
- **The food stall** (right at the crossing): りんご apple, おにぎり rice ball,
  すし sushi, おちゃ tea, みず water, さかな fish.
- **The café terrace** (left at the crossing): いす chair, ほん book,
  かばん bag, じてんしゃ bicycle, とり bird.

- **Murals** (pictures painted on building fronts, for common words with no
  place in a city street): やま mountain, うみ sea, たいよう sun, くも cloud,
  にじ rainbow, あめ rain, ゆき snow, ひ fire, いえ house, ふね boat, め eye,
  て hand, うさぎ rabbit, へび snake.

Phrases: おはよう / こんにちは / こんばんは (the greeting follows the real time
of day), 〜 は どこ？ (where is 〜?), 〜 を ください (〜, please),
せいかい / すごい / いいね (correct / amazing / nice), またね (see you),
はじめる (start).

**The words and phrases were written from memory and should be checked
against a standard reference.** Stroke order is not from memory: it comes
from the KanjiVG project (see `CREDITS.md`).

## Look

- **Glow:** bright things bleed light into the dark (a bloom pass). It is the
  costliest effect, so the world watches its own frame rate and sheds it,
  then reflections and rain, on a device that cannot keep up. `?plain` in the
  address starts without them.
- **Wet road:** real asphalt with worn paint, manhole covers and cracks. The
  city is mirrored in it, stretched downward, sharpest in the puddles, with
  rain rings spreading across it.
- **Buildings:** photographed concrete with windows set into the wall
  (curtains, blinds, silhouettes), balconies, air conditioners, drainpipes,
  awnings, stepped tops, roof tanks and aerials, and a hazy far skyline.
- **Ground floors:** real metal shutters, rust-stained and painted over, or
  shops you can see into: shelves, a counter, someone serving.
- **Neon:** tube lettering that lights the ground beneath it; a few signs
  flicker and fail.
- **Life:** people walking under umbrellas, cars crossing at the junction,
  steam from the stall and the road gratings, light rain, drifting petals.
  Walkers and cars carry the words ひと and くるま, so tapping them teaches.

Surface photographs are CC0 from Poly Haven (see `CREDITS.md`).

## Sound

Japanese is spoken by the voice built into the device, at a slightly slowed
rate. If the device has no Japanese voice, a notice says so and words are
shown without sound. Voice quality varies by device and has not been tested
on a tablet.

## Files

- `words.ts`: the word list and the spaced-practice record.
- `city.ts`: the street, its things, signs, lights, reflections and tags.
- `speak.ts`: speech and sounds.
- `trace.ts`: writing kana with the spray can.
- `strokes.json`: the strokes of every hiragana, in writing order (KanjiVG, CC BY-SA 3.0).
- `main.ts`: walking, tapping, and the listen-and-find game.

Progress is kept in the browser on each device. Nothing is sent anywhere.
