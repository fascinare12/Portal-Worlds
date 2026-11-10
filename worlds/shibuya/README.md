# Shibuya

The world behind the red pool in the wood: a city street at night, where
Japanese is learned from zero. It is a separate page with its own code.

## How it plays

1. **Listen.** Tap anything in the street to hear its name and see it in
   hiragana, with romaji and the English underneath.
2. **Find.** Once four words have been heard, the street starts asking, in
   Japanese: `ねこ は どこ？` (where is the cat?). She finds it and taps it.
   Tapping the wrong thing is not penalised: it says its own name.
3. **Tags.** The first time a word is found, it is sprayed on a wall as a
   graffiti tag, with a firework. The counter shows tags out of twelve.

Only words she has already heard are asked. Words missed at the first try
come back soonest; words she knows come back later. Romaji under a word is
dropped once she has found it twice running.

Drag to look around; tap the road to walk; arrows or WASD also work. The green
puddle, or the green button, leads back to the wood.

## Words (first set)

ねこ cat, いぬ dog, くるま car, でんしゃ train, えき station, みせ shop,
き tree, つき moon, かさ umbrella, ひと person, はな flower, とけい clock.

Phrases met so far: こんばんは (good evening), 〜 は どこ？ (where is 〜?),
せいかい (correct), はじめる (start).

**These should be checked against a standard reference before being relied
on**: they were written from memory, not verified.

## Sound

Japanese is spoken by the voice built into the device, at a slightly slowed
rate. If the device has no Japanese voice, a notice says so and words are
shown without sound. Voice quality varies by device and has not been tested
on a tablet.

## Files

- `words.ts`: the word list and the spaced-practice record.
- `city.ts`: the street, its things, signs, lights, reflections and tags.
- `speak.ts`: speech and sounds.
- `main.ts`: walking, tapping, and the listen-and-find game.

Progress is kept in the browser on each device. Nothing is sent anywhere.
