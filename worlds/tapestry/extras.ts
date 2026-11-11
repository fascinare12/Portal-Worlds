/**
 * The playful side of the Tapestry. Nothing here is examined: the history
 * that is taught and tested lives in acts.ts and vikings.ts. This file holds
 * what makes the cloth fun to poke at:
 *
 *   ODD     one true, strange fact for each finished panel, with who said so
 *   POKES   what each figure says, and how it moves, when tapped
 *   GAGS    which silly picture a wrong answer stitches
 *   BEASTS  the creatures of the border: three regulars who give the hints,
 *           and a bestiary to collect
 *
 * The lines the figures speak are jokes, and are shown as speech, never as
 * fact. The odd facts are meant to be true; each says where it comes from,
 * and says so when the source is late or doubtful.
 */

export const ODD: Record<string, string> = {
  rome: 'The Romans made concrete that set hard even under water. The dome of the Pantheon in Rome, built of it about the year 126, is still the largest dome of plain concrete in the world.',
  fall: 'The last emperor in the west was a boy whose name joined the founder of Rome and its first emperor: Romulus Augustus. People called him Augustulus, "little Augustus".',
  legacy: 'The months of September, October, November and December are named "seventh", "eighth", "ninth" and "tenth" in Latin. They are now the ninth to twelfth, because the Roman year once began in March.',
  church: 'Bede tells a story of Gregory seeing fair-haired slave boys for sale in Rome and asking who they were. Told they were Angles, he said they had the faces of angels. It is a pun in Latin, and Bede says it is why he sent the mission to England.',
  monks: 'Monks who copied books sometimes wrote complaints in the margins, which survive: "Oh, my hand." "Thank God, it will soon be dark." "Writing is excessive drudgery."',
  time: 'Dionysius, who invented counting years from the birth of Jesus, called himself Dionysius Exiguus: "Dennis the Small". Most scholars think he got the year wrong, and that Jesus was born a few years "before Christ".',
  charlemagne: 'Charlemagne ruled half of Europe and could not write. Einhard says he kept wax tablets under his pillow to practise his letters at night, but had started too late in life and never got far.',
  byzantium: 'A visitor from Italy in 949 described the emperor\'s throne room in Constantinople: gilded lions that roared, metal birds that sang in a metal tree, and a throne that rose into the air while he was bowing. (Liudprand of Cremona.)',
  justinian: 'Silk was a Chinese secret. Procopius says two monks smuggled silkworm eggs to Justinian from the east, hidden inside hollow walking canes.',
  northmen: 'Vikings did not wear horned helmets. Not one has ever been found. The horns were invented in the 1800s, for artists and opera costumes.',
  lindisfarne: 'The Northmen were notably clean. An English chronicler (John of Wallingford, writing much later) grumbled that the Danes combed their hair every day and bathed every Saturday, and that English women liked them for it. In the Scandinavian languages Saturday is still "washing day".',
  east: 'Ibn Fadlan also reports how the Rus washed each morning: all from one bowl of water, passed from man to man, each blowing his nose in it before handing it on. He was not impressed.',
  settlers: 'Greenland is mostly ice. According to the Icelandic sagas, Erik the Red gave it that name on purpose, because people would be keener to move there if it sounded nice.',
  cnut: 'The story of Cnut ordering the tide to stop is first told about a hundred years after he died (by Henry of Huntingdon). In it he is not being foolish. He gets his feet wet deliberately, to show his flatterers that even a king cannot command the sea.',
  rollo: 'In the Norse sagas there is a Viking called Hrolf the Walker, so big that no horse could carry him, who had to go everywhere on foot. Icelandic writers said he was the same man as Rollo.',
  french: 'The dukes of Normandy collected nicknames: William Longsword, Richard the Fearless, Richard the Good, and Robert, who is called either the Magnificent or the Devil, depending on who is writing.',
  william: 'When William died in 1087 he had grown very fat, and his body would not fit its stone coffin. As the monks forced it in, it burst, and the smell drove everyone out of the church. (Orderic Vitalis, a monk who wrote about fifty years later.)',
  edward: 'Edward spent years building Westminster Abbey. It was consecrated on 28 December 1065. He was too ill to attend, and died about a week later.',
  oath: 'A Norman poet called Wace, a century later, added a twist: the relics were hidden under a cloth, and only after Harold had sworn was the cloth pulled away to show him what he had put his hand on.',
  deathbed: 'The tapestry shows Edward\'s funeral before it shows him dying. Nobody knows quite why the two scenes are the wrong way round.',
  crown: 'The Chronicle counts Harold\'s whole reign exactly: he "held it forty weeks and one day".',
  comet: 'An English monk named Eilmer is said to have groaned when he saw the comet: "You\'ve come, have you?" Years earlier the same Eilmer had strapped wings to his arms, jumped off the abbey tower, glided some way, and broken both legs. (William of Malmesbury, about 1125.)',
  claimants: 'England had three kings in 1066: Edward, Harold and William. A fourth, a boy named Edgar, was proclaimed in London after Hastings but never crowned.',
  stamford: 'To reach Stamford Bridge Harold\'s army covered about 185 miles in four days. On foot, mostly.',
  crossing: 'William\'s own ship was called the Mora. It was a present from his wife, Matilda.',
  march: 'The King of Norway\'s battle flag had a name: Land-waster. It did not help him.',
  hastings: 'According to the earliest poem about the battle, it began with a Norman minstrel riding out in front of the army, juggling his sword in the air.',
  harold: 'After the battle Harold\'s body could not be recognised. One story says it was found by Edith Swan-neck, who knew him by marks on his body that only she had seen. (The Waltham Chronicle, about a century later.)',
  tapestry: 'There are more than six hundred people in the Bayeux Tapestry, and about two hundred horses. Only three of the people in the main story are women.',
};

export interface Poke {
  /** Which telling of a panel told twice. */
  t?: number;
  /** Where it stands: across from the left of its scene, and how far its foot is above the ground line (below it, if negative). */
  x: number;
  y?: number;
  /** A person or a horse of this height; or a thing this wide and this tall. */
  h: number;
  w?: number;
  kind?: 'man' | 'horse' | 'thing';
  say: string;
}

export const POKES: Record<string, Poke[]> = {
  rome: [
    { x: 350, h: 250, say: 'All roads lead to me. I checked.' },
    { x: 478, h: 216, say: 'Twenty-five years of this, then they give you a farm.' },
    { x: 170, h: 340, w: 260, kind: 'thing', say: 'I am a temple. In a few centuries I shall be a church.' },
    { x: 875, h: 240, w: 220, kind: 'thing', say: 'Fresh water, downhill, for forty miles. You are welcome.' },
  ],
  fall: [
    { t: 0, x: 140, h: 232, say: 'We did ask nicely first. For years.' },
    { t: 0, x: 220, h: 200, say: 'Eight hundred years without a break-in!' },
    { t: 0, x: 380, h: 300, w: 240, kind: 'thing', say: 'I was built to keep them out. Nobody is perfect.' },
    { t: 1, x: 202, y: 72, h: 232, say: 'New king. Same laws. Do carry on.' },
    { t: 1, x: 340, h: 220, say: 'Same job as before. Different beard on the boss.' },
  ],
  legacy: [
    { x: 290, h: 214, say: 'Who built this road? No idea. Good road, though.' },
    { x: 430, h: 120, kind: 'horse', say: 'Straight for miles. The Romans did not believe in corners.' },
    { x: 910, y: 130, h: 110, w: 120, kind: 'thing', say: 'A, B, C. Still in use, I see.' },
    { x: 720, h: 300, w: 200, kind: 'thing', say: 'Londinium. Lutetia. Eboracum. You know us by other names.' },
  ],
  church: [
    { x: 330, h: 250, say: 'I asked to be a monk. They made me Pope instead.' },
    { x: 470, h: 200, say: 'The emperor is a thousand miles off. The bishop has bread.' },
    { x: 850, y: 60, h: 150, say: 'England. They say it rains. We shall see.' },
  ],
  monks: [
    { x: 420, y: 6, h: 214, say: 'Oh, my hand.' },
    { x: 640, y: 6, h: 214, say: 'Three hundred pages to go. Thank God, it will soon be dark.' },
    { x: 860, y: 130, h: 80, w: 190, kind: 'thing', say: 'Six books. That is a large library.' },
    { x: 150, h: 360, w: 240, kind: 'thing', say: 'Stone walls, a full cellar, and no guards. What could go wrong?' },
  ],
  time: [
    { x: 120, h: 214, say: 'A tenth of the barley. Every year. I counted.' },
    { x: 270, h: 130, say: 'Is it a holy day? Do we get the day off?' },
    { x: 690, h: 226, say: 'I baptise them, marry them and bury them. In that order, ideally.' },
    { x: 880, y: 236, h: 130, w: 130, kind: 'thing', say: 'It is the year 525. I have just decided.' },
  ],
  charlemagne: [
    { t: 0, x: 180, h: 250, say: 'Emperor of the Romans. I am a Frank. Nobody mention it.' },
    { t: 0, x: 270, h: 236, say: 'There. Now remember who gave you that.' },
    { t: 0, x: 394, h: 200, say: 'Life and victory! (They told us what to shout.)' },
    { t: 1, x: 300, h: 236, say: 'What? No. I only came in to pray.' },
    { t: 1, x: 180, h: 236, say: 'Quietly now. He will thank me later.' },
  ],
  byzantium: [
    { x: 820, y: 150, h: 160, say: 'Byzantine? Never heard of them. We are Romans.' },
    { x: 520, y: 150, h: 150, say: 'Three walls and a moat. Do come and try.' },
    { x: 660, y: 150, h: 270, w: 280, kind: 'thing', say: 'The largest city in the Christian world. For about eight hundred years.' },
    { x: 160, y: 44, h: 170, w: 250, kind: 'thing', say: 'Europe on the left, Asia on the right, taxes in the middle.' },
  ],
  justinian: [
    { t: 0, x: 90, h: 250, say: 'All the law there is, in one book. A big book.' },
    { t: 0, x: 200, h: 236, say: 'Run if you like. I am staying.' },
    { t: 0, x: 340, h: 350, w: 290, kind: 'thing', say: 'Five years to build. The dome fell in once. We do not talk about it.' },
    { t: 1, x: 220, h: 250, say: 'Has anyone seen my head?' },
    { t: 1, x: 330, y: 270, h: 80, w: 60, kind: 'thing', say: 'Up here.' },
    { t: 1, x: 70, y: 6, h: 196, say: 'I shall publish this later. Much later.' },
  ],
  northmen: [
    { x: 110, h: 222, say: 'I farm. Mostly. Summers are... different.' },
    { x: 240, h: 205, say: 'Someone has to run the farm while they are off "viking".' },
    { x: 400, h: 190, w: 90, kind: 'thing', say: 'Here lies somebody. He was great. Signed, his mother.' },
    { x: 730, y: 48, h: 200, w: 420, kind: 'thing', say: 'She draws less water than a duck.' },
  ],
  lindisfarne: [
    { t: 0, x: 40, h: 196, say: 'Gold, books, and no walls. In hindsight...' },
    { t: 0, x: 300, h: 214, say: 'Is this a bad time?' },
    { t: 0, x: 150, y: 350, h: 70, w: 90, kind: 'thing', say: 'The Chronicle said fiery dragons. So here we are.' },
    { t: 1, x: 250, h: 340, w: 150, kind: 'thing', say: 'I say what I was carved to say. Forever.' },
    { t: 1, x: 120, h: 214, say: 'One slip and I have to start a new rock.' },
    { t: 1, x: 405, h: 70, w: 90, kind: 'thing', say: 'Buried for safe keeping. He never came back for me.' },
  ],
  east: [
    { x: 480, h: 232, say: 'Furs for silver. No, we do not give change.' },
    { x: 640, h: 226, say: 'One more coin on that side. One more. One more.' },
    { x: 800, y: 6, h: 214, say: 'Magnificent people. I do wish they would wash.' },
    { x: 205, y: 46, h: 170, w: 320, kind: 'thing', say: 'Carried overland between rivers. On logs. Do not ask.' },
  ],
  settlers: [
    { x: 80, h: 232, say: 'You keep that half. I keep this half. No taking it back.' },
    { x: 190, h: 232, say: 'Agreed. Also I am a Christian now, apparently.' },
    { x: 580, h: 110, kind: 'horse', say: 'I preferred raiding. Less ploughing.' },
    { x: 850, y: 44, h: 150, w: 260, kind: 'thing', say: 'Next stop: a very large land nobody has told Columbus about.' },
  ],
  cnut: [
    { x: 422, y: 78, h: 250, say: 'The thing with the tide? I was making a POINT.' },
    { x: 570, h: 236, say: 'Queen of England. Twice. Two different husbands.' },
    { x: 70, h: 208, say: 'Here is your silver. Please do not come back.' },
    { x: 870, y: 38, h: 120, w: 210, kind: 'thing', say: 'Off to Normandy, boys. Write to your mother.' },
  ],
  rollo: [
    { t: 0, x: 104, y: 60, h: 230, w: 150, kind: 'thing', say: 'WHOA—' },
    { t: 0, x: 236, h: 222, say: 'You said kiss the foot. You never said how high.' },
    { t: 0, x: 340, h: 250, say: 'I do not kneel.' },
    { t: 0, x: 440, h: 220, say: 'This is NOT how it is done.' },
    { t: 1, x: 70, y: 4, h: 208, say: 'No feet. No kissing. Just who owns what.' },
    { t: 1, x: 250, y: 150, h: 240, w: 160, kind: 'thing', say: 'Dull. Short. Seven years old. Believe me.' },
    { t: 1, x: 350, y: 18, h: 190, say: 'I used to BE the pirates.' },
  ],
  french: [
    { x: 125, h: 150, w: 130, kind: 'thing', say: 'Splash. New name: Robert.' },
    { x: 250, h: 232, say: 'One Viking, slightly damp, now a Christian.' },
    { x: 500, h: 320, w: 250, kind: 'thing', say: 'From burning churches to building them, in three generations.' },
    { x: 850, h: 150, kind: 'horse', say: 'My grandfather had a longship. I have a horse. And a longship.' },
  ],
  william: [
    { x: 320, h: 150, say: 'I am seven. I am in charge. Everybody wants me dead.' },
    { x: 230, h: 230, say: 'Third guardian this year. I try not to think about it.' },
    { x: 540, h: 226, say: 'Nothing personal, child.' },
    { x: 800, y: 30, h: 320, w: 380, kind: 'thing', say: 'Rollo, William, Richard, Richard, Robert, William. We reuse names.' },
  ],
  edward: [
    { x: 362, y: 78, h: 250, say: 'I built a very fine abbey. I was too ill to go to the opening.' },
    { x: 560, h: 250, say: 'Just standing here. Near the throne. No reason.' },
    { x: 640, h: 240, say: 'I am not saying anything. I am a witness.' },
  ],
  oath: [
    { t: 0, x: 82, y: 66, h: 215, say: 'Both hands, Harold. On the boxes.' },
    { t: 0, x: 290, h: 232, say: 'What exactly is IN these boxes?' },
    { t: 0, x: 462, h: 215, say: 'I saw everything. I shall tell it my way.' },
    { t: 1, x: 180, h: 228, say: 'There are rather a lot of spears in here.' },
    { t: 1, x: 60, h: 232, say: 'Nobody is forcing anybody. Swear.' },
    { t: 1, x: 300, y: 250, h: 110, w: 90, kind: 'thing', say: 'Help. We have been "guests" here for years.' },
  ],
  deathbed: [
    { x: 250, y: 112, h: 110, w: 130, kind: 'thing', say: 'Somebody take the kingdom. I am going to sleep.' },
    { x: 440, y: 60, h: 215, say: 'He pointed at me. You all saw him point at me.' },
    { x: 520, y: 60, h: 200, say: 'I am one of only three women in this entire tapestry.' },
    { x: 800, h: 380, w: 290, kind: 'thing', say: 'Finished last week. He missed the party.' },
  ],
  crown: [
    { x: 472, y: 82, h: 258, say: 'Day one. How hard can it be?' },
    { x: 660, h: 250, say: 'The Pope and I are not on speaking terms.' },
    { x: 840, h: 220, say: 'Long live the king! (This one. For now.)' },
    { x: 300, h: 240, say: 'Here is your crown. And an axe. You will want the axe.' },
  ],
  comet: [
    { x: 700, y: 300, h: 90, w: 260, kind: 'thing', say: 'I come round every 76 years. Nobody is ever pleased to see me.' },
    { x: 212, h: 232, say: 'It is a sign!' },
    { x: 336, h: 232, say: 'A sign of what?' },
    { x: 798, y: 70, h: 222, say: 'Why is everyone pointing at the ceiling?' },
  ],
  claimants: [
    { x: 180, h: 270, say: 'Chosen. Crowned. Sitting on it. Mine.' },
    { x: 500, h: 270, say: 'Promised. Sworn. Mine.' },
    { x: 800, h: 318, say: 'I am seven feet tall. Mine.' },
    { x: 890, h: 240, say: 'He is my brother. It is complicated.' },
  ],
  stamford: [
    { t: 0, x: 290, y: 108, h: 196, say: 'None shall pass! ...What is that under the br—' },
    { t: 0, x: 290, y: -30, h: 60, w: 110, kind: 'thing', say: 'Sneaky. But it worked.' },
    { t: 0, x: 104, h: 208, say: 'We walked from LONDON for this.' },
    { t: 1, x: 110, h: 150, kind: 'horse', say: 'Seven feet of English ground for your king. He IS tall.' },
    { t: 1, x: 300, h: 290, say: 'We left our armour at the ships. It was such a nice day.' },
    { t: 1, x: 380, h: 220, say: 'That rider? That was my brother. The king. I did not like to say.' },
  ],
  crossing: [
    { x: 190, y: 46, h: 190, w: 300, kind: 'thing', say: 'Three horses aboard, and every one of them seasick.' },
    { x: 790, y: 16, h: 120, kind: 'horse', say: 'Solid ground. Never again.' },
    { x: 730, y: 14, h: 190, say: 'Nobody here? Nobody at all? ...Good.' },
    { x: 930, y: 20, h: 140, w: 100, kind: 'thing', say: 'I am a Roman fort. I have been empty for six hundred years.' },
  ],
  march: [
    { x: 780, h: 150, kind: 'horse', say: 'York to Sussex. On THESE roads.' },
    { x: 376, h: 208, say: 'Are we nearly there?' },
    { x: 562, h: 200, say: 'We only just GOT to York.' },
    { x: 75, h: 290, w: 110, kind: 'thing', say: 'York. Lovely city. They stayed about four days.' },
  ],
  hastings: [
    { x: 800, y: 60, h: 250, w: 360, kind: 'thing', say: 'Hold the line. Do NOT chase them. ...Who is chasing them?' },
    { x: 150, h: 150, kind: 'horse', say: 'Run away! Slowly. So that they follow.' },
    { x: 400, h: 156, kind: 'horse', say: 'Not dead! Look! Face!' },
    { x: 300, h: 180, say: 'Aim high, lads.' },
  ],
  harold: [
    { t: 0, x: 330, h: 238, say: 'Arrow or spear? Even I cannot tell any more.' },
    { t: 0, x: 110, h: 190, say: 'Do not look at me. That bit was restitched in the 1800s.' },
    { t: 1, x: 170, h: 160, kind: 'horse', say: 'There were four of us. I am just the one they stitched.' },
    { t: 1, x: 370, y: -6, h: 110, w: 190, kind: 'thing', say: 'Ow.' },
  ],
  tapestry: [
    { x: 298, y: 6, h: 196, w: 420, kind: 'thing', say: 'Seventy metres of this. SEVENTY.' },
    { x: 640, h: 250, say: 'Make me look taller. And put me in more scenes.' },
    { x: 792, y: 70, h: 222, say: 'Christmas Day. What a present.' },
    { x: 940, y: 0, h: 200, w: 110, kind: 'thing', say: 'A castle. The first of hundreds.' },
  ],
};

/**
 * A wrong answer is stitched as a picture of what it claims. Each rule is a
 * word to look for in the wrong answer and the picture that goes with it;
 * anything unmatched gets one of the last three, in turn.
 */
export const GAGS: [RegExp, string][] = [
  [/elephant/i, 'elephant'],
  [/cannon/i, 'cannon'],
  [/no more kings|no king at all|refused to choose|nothing: there was/i, 'cat'],
  [/pope/i, 'pope'],
  [/vote|all the people/i, 'vote'],
  [/sons|brothers|sister/i, 'squabble'],
  [/iron|hundreds of horses/i, 'sink'],
  [/newspaper|letter|wrote/i, 'news'],
  [/hermit|escaped|ashamed/i, 'hermit'],
  [/rain|hot|harvest/i, 'rain'],
  [/venus|planet|exploded|star that/i, 'planet'],
  [/loom|painting|alphabet|numbers|books/i, 'easel'],
  [/money|paid|silver|lands|tax/i, 'purse'],
  [/gone home|fresh|sailed|ships|sea|scandinavia/i, 'duck'],
];
export const SPARE_GAGS = ['fish', 'duck', 'upside'];

/** The creatures of the border. The first three are regulars, who turn up with the hints. */
export const BEASTS: { name: string; about: string }[] = [
  { name: 'The Bird Who Is Always Wrong', about: 'Confident. Cheerful. Has never once been right. If it agrees with you, worry.' },
  { name: 'Leofric, a lion of quality', about: 'Knows a great deal and would like you to know that he knows it.' },
  { name: 'Grim the wyrm', about: 'Interested in history only where treasure is involved. Treasure is usually involved.' },
  { name: 'A hound', about: 'Has run the whole length of the border. Has seen things. Says nothing.' },
  { name: 'A fish', about: 'Nobody knows why there is a fish. There are fish in the real border too.' },
  { name: 'A raven', about: 'Reports everything it sees to someone in the north. Gets most of it right.' },
  { name: 'A wolf', about: 'Not actually hungry. Just likes to be asked.' },
  { name: 'A ribbon-beast', about: 'Tied itself in a knot in about 950 and cannot remember how to get out.' },
];
/** How many panels must be finished before each beast joins the collection. */
export const BEAST_AT = [1, 3, 6, 9, 13, 17, 22, 29];

export const BIRD_SAYS = [
  'That was my answer too! Which is how I know it is wrong.',
  'Oh, well done! ...No? Not well done?',
  'I was SO sure. I am always so sure.',
  'I had that one stitched on my wing already.',
  'Unpick it quick, before the lion sees.',
];
export const LION_SAYS = ['Ahem.', 'If I may.', 'A lion would know this.', 'Allow me.'];
export const WYRM_SAYS = ['Was anyone carrying gold, by the way?', 'Now, about the treasure.', 'Personally I would have burned the lot.', 'Is there silver in this one?'];
