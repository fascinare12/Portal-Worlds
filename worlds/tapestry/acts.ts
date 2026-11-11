/**
 * What the Tapestry world teaches: Act 3, the year 1066.
 *
 * Each panel is one scene. A panel has an account to read (what the scribe is
 * told happened), then questions; each right answer stitches part of the
 * panel. Some panels are told twice, by two sides who did not agree, and both
 * tellings must be stitched before the scribe may go on.
 *
 * Sources. The Latin captions are the tapestry's own, as given in F. F. L.
 * Birrell's "Guide to the Bayeux Tapestry" (Victoria and Albert Museum, 1921).
 * Quotations from the Anglo-Saxon Chronicle are from James Ingram's
 * translation (1823). Both are in the public domain. Everything else is a
 * summary in my own words of what is generally taught; where historians
 * disagree, the text says so.
 *
 * In every question the FIRST answer listed is the right one. They are
 * shuffled before being shown.
 */

import { ROME } from './rome';
import { NORTHMEN } from './vikings';

export interface Question {
  ask: string;
  /** The first is correct. */
  answers: [string, string, string];
  /** What the creature in the border says after a wrong answer. */
  hint: string;
}

export interface Telling {
  /** Who is speaking, for a panel told twice: shown on the choice and stitched over that half. */
  voice?: string;
  /** The same in Latin, stitched above that half of the panel. */
  banner?: string;
  /**
   * A real inscription in runes to stitch over this telling in place of a banner: the runes
   * themselves, how they read letter for letter, what they mean, where they are, and one word of
   * them set as a puzzle to decode.
   */
  runes?: { text: string; reads: string; means: string; source: string; word: string; answer: string; wordMeans: string };
  account: string[];
  /** Where the account comes from. */
  source: string;
  questions: Question[];
}

export interface Panel {
  /** Which act it belongs to: its place in ACTS. */
  act: number;
  id: string;
  /** The words stitched along the top, in the language of whoever left the record. */
  caption: string;
  /** What they mean. */
  meaning: string;
  /** The language, when it is not Latin. */
  language?: string;
  /** How to say it, for a caption that is not in our letters. */
  reads?: string;
  /** 'arabic' for a caption that joins its letters and runs right to left. */
  script?: 'arabic';
  /** If the caption is a real quotation: where it is from. Without this it is the scribe's own. */
  quoted?: string;
  title: string;
  date: string;
  /** One telling, or two that disagree. */
  tellings: Telling[];
  /** For a panel told twice: asked once both are stitched. */
  weigh?: Question;
  /** Shown when the panel is finished: why it mattered. */
  mattered: string;
}

/** A panel as it is written down, before it is given its place in an act. */
export type PanelData = Omit<Panel, 'act'>;

/**
 * One act of the cloth. The scribe and the stitching are the same throughout, but each act
 * borrows its borders and its motifs from the people it is about.
 */
export interface Act {
  numeral: string;
  title: string;
  /** Its name in Latin, and what that means. */
  latin: string;
  meaning: string;
  /** Whose art the borders and beasts are taken from. */
  style: 'roman' | 'norse' | 'bayeux';
  /** Told to the player once, at the head of the act: what the pictures here are modelled on. */
  modelled: string;
  /** Said when the whole act is stitched. */
  closing: string;
  panels: PanelData[];
}

const ANNO: PanelData[] = [
  {
    id: 'edward',
    caption: 'EDWARD REX',
    meaning: 'Edward the King',
    title: 'An old king and no heir',
    date: 'England, the winter of 1065',
    tellings: [
      {
        account: [
          'Edward, later called the Confessor, has been king of England since 1042. He is old now, and he has no child to follow him.',
          'In England the crown does not pass automatically to a son or a nearest relative. The great men of the kingdom, a council called the Witan, agree who the next king shall be.',
          'So when a king dies with no clear heir, more than one man may believe the crown is his. In the winter of 1065 at least three do.',
        ],
        source: 'The opening scene of the tapestry shows Edward enthroned, with these two words above him.',
        questions: [
          {
            ask: 'Why was it so dangerous for England that Edward was dying?',
            answers: ['He had no child, so there was no obvious person to be king next', 'He had three sons who were already at war with each other', 'England had decided it would have no more kings'],
            hint: 'Look again at what Edward lacked. It is not that there were too many heirs in his own house.',
          },
          {
            ask: 'In Anglo-Saxon England, who agreed on a new king?',
            answers: ['The Witan, a council of the great men of the kingdom', 'The Pope in Rome, by himself', 'All the people of London, by a vote'],
            hint: 'It was a council, and it was English.',
          },
        ],
      },
    ],
    mattered: 'Everything that follows in 1066 comes from this: a throne about to be empty, and no single rule everyone accepted for filling it.',
  },
  {
    id: 'oath',
    caption: 'UBI HAROLD SACRAMENTUM FECIT WILLELMO DUCI',
    meaning: 'Where Harold made an oath to Duke William',
    title: 'The oath',
    date: 'Bayeux, Normandy, about 1064',
    tellings: [
      {
        voice: 'As the Normans told it',
        banner: 'NORMANNI DICUNT',
        account: [
          'Harold Godwinson, the most powerful earl in England, crossed the sea to Normandy about two years before Edward died.',
          'The Normans said King Edward had sent him, to confirm that Duke William of Normandy would be the next king of England. At Bayeux, they said, Harold laid his hands on holy relics and swore to help William to the throne.',
          'An oath on relics was a promise made before God. To break it was perjury, a grave sin.',
        ],
        source: 'William of Poitiers, a Norman priest who served the duke and wrote in the 1070s. The tapestry shows the same scene.',
        questions: [
          {
            ask: 'According to the Normans, what did Harold swear?',
            answers: ['To help Duke William become king of England', 'To give William half of his own lands in England', 'Never to leave Normandy again'],
            hint: 'The oath was about a crown, and whose it would be.',
          },
          {
            ask: 'Why did the Normans make so much of the relics?',
            answers: ['They made it a sacred promise, so breaking it would make Harold a perjurer in the eyes of the Church', 'Relics were worth a great deal of money, which Harold then owed', 'Touching relics was how a man became a Norman'],
            hint: 'Think about who was believed to be watching when a man swore on the bones of saints.',
          },
        ],
      },
      {
        voice: 'As the English told it',
        banner: 'ANGLI DICUNT',
        account: [
          'The Anglo-Saxon Chronicle was kept by English monks, who wrote down each year what had happened. About Harold going to Normandy, and about any oath, it says nothing at all.',
          'A generation later an English monk named Eadmer gave a different story. Harold, he said, went to Normandy to free two of his kinsmen who were held there as hostages. He swore only because he was in William\'s power and could not safely refuse.',
          'A promise forced out of a man was not thought to bind him.',
        ],
        source: 'The Anglo-Saxon Chronicle (silent); Eadmer of Canterbury, writing around 1100.',
        questions: [
          {
            ask: 'What does the Anglo-Saxon Chronicle say about Harold\'s oath?',
            answers: ['Nothing: it does not mention the journey or the oath', 'That Harold swore gladly and meant it', 'That William swore an oath to Harold'],
            hint: 'Sometimes what a source leaves out is the most interesting thing about it.',
          },
          {
            ask: 'According to Eadmer, why did Harold swear?',
            answers: ['He was in William\'s power and could not safely refuse', 'King Edward had ordered him to', 'He wanted William as his king'],
            hint: 'Eadmer\'s Harold is not a free man when he makes his promise.',
          },
        ],
      },
    ],
    weigh: {
      ask: 'Most historians today think Harold probably did go to Normandy and swear something. So what do the two tellings really disagree about?',
      answers: ['Why he swore, and whether a promise made that way had to be kept', 'Whether Normandy existed', 'Which year it was'],
      hint: 'Both could be describing the same afternoon. What is different is what it meant.',
    },
    mattered: 'William\'s whole case for invading rested on this oath. It let him say he was not a conqueror but a wronged man taking what he had been promised.',
  },
  {
    id: 'deathbed',
    caption: 'HIC EADWARDUS REX IN LECTO ALLOQUITUR FIDELES · ET HIC DEFUNCTUS EST',
    meaning: 'Here King Edward in bed addresses his faithful men. And here he is dead.',
    title: 'The king dies',
    date: 'Westminster, 5 January 1066',
    tellings: [
      {
        account: [
          'King Edward died at Westminster in the first days of January 1066, in the night of the 4th to the 5th.',
          'The English said that on his deathbed he gave the kingdom into Harold\'s keeping. The Chronicle puts it in verse: "But the prudent king had settled the realm on high-born men, on Harold himself, the noble earl."',
          'The Normans did not deny the deathbed. They said it could not undo two earlier things: that Edward had promised the throne to William years before, around 1051, and that Harold himself had sworn to uphold it. Edward and William were kin: Edward\'s mother, Emma, was a Norman and William\'s great-aunt.',
        ],
        source: 'The Anglo-Saxon Chronicle, under the year 1065 (its year ran to the spring). The Norman claim is from William of Poitiers and William of Jumièges.',
        questions: [
          {
            ask: 'According to the English Chronicle, what did Edward do before he died?',
            answers: ['He settled the kingdom on Harold', 'He named William of Normandy as king', 'He refused to choose anyone'],
            hint: 'Read the two lines of verse again. One man is named in them.',
          },
          {
            ask: 'Why did the Normans say Edward\'s dying wish did not count?',
            answers: ['Edward had promised William the throne years earlier, and Harold had sworn to support it', 'A dying man\'s words were never listened to in England', 'Edward was not really the king'],
            hint: 'The Normans pointed to two promises made before that night.',
          },
          {
            ask: 'How were King Edward and Duke William related?',
            answers: ['Edward\'s mother Emma was a Norman, and William\'s great-aunt', 'They were brothers', 'They were not related at all'],
            hint: 'The link runs through a woman who was queen of England and came from Normandy.',
          },
        ],
      },
    ],
    mattered: 'The tapestry shows Edward reaching out to the man at his bedside, but its caption says only that he "addresses his faithful men". It does not say what he told them. A Norman and an Englishman could each look at this panel and see their own story.',
  },
  {
    id: 'crown',
    caption: 'HIC DEDERUNT HAROLDO CORONAM REGIS · HIC RESIDET HAROLD REX ANGLORUM',
    meaning: 'Here they gave Harold the king\'s crown. Here sits Harold, King of the English.',
    title: 'Harold is crowned',
    date: 'Westminster, 6 January 1066',
    tellings: [
      {
        account: [
          'Harold was crowned the very next day, 6 January, the same day Edward was buried in the great new abbey he had built at Westminster. The Witan had agreed to him.',
          'The tapestry shows Harold on the throne, and beside him it names one man: "STIGANT ARCHIEPISCOPUS", Archbishop Stigand of Canterbury.',
          'That detail is not innocent. Several popes had refused to recognise Stigand as a lawful archbishop. English writers say it was a different man, Archbishop Ealdred of York, who actually crowned Harold.',
        ],
        source: 'The tapestry; the Anglo-Saxon Chronicle; John of Worcester (an English monk, early 1100s) for Ealdred.',
        questions: [
          {
            ask: 'How soon after Edward\'s death was Harold crowned?',
            answers: ['The next day', 'A year later', 'Forty days later, after the mourning'],
            hint: 'It happened on the day of the old king\'s funeral.',
          },
          {
            ask: 'The tapestry was made for the Norman side. Why might it put Stigand next to Harold?',
            answers: ['To suggest that Harold\'s crowning was not properly done', 'Because Stigand was William\'s brother', 'To show that the Pope approved of Harold'],
            hint: 'What did Rome think of Stigand? Now think what standing next to him says about Harold.',
          },
        ],
      },
    ],
    mattered: 'Notice that the tapestry still calls him "Harold, King of the English". Later Norman writers would not give him that title at all. That is one clue that English hands, or English sympathies, had a part in making it.',
  },
  {
    id: 'comet',
    caption: 'ISTI MIRANT STELLAM',
    meaning: 'These men marvel at the star',
    title: 'The long-haired star',
    date: 'Seen over England from 24 April 1066',
    tellings: [
      {
        account: [
          'In the last week of April a great light with a tail appeared in the sky and was seen for about a week.',
          'The Chronicle says: "Then was over all England such a token seen as no man ever saw before. Some men said that it was the comet-star, which others denominate the long-hair\'d star."',
          'We know now what it was: the comet later named after Edmond Halley, which comes back about every 76 years. People in 1066 read it as a sign that something great and terrible was coming.',
          'In the tapestry the comet appears right beside Harold on his new throne, although it was seen more than three months after he was crowned.',
        ],
        source: 'The Anglo-Saxon Chronicle for 1066, in James Ingram\'s translation.',
        questions: [
          {
            ask: 'What was the "long-haired star"?',
            answers: ['Halley\'s Comet, which returns about every 76 years', 'The planet Venus', 'A star that exploded and was never seen again'],
            hint: 'It has been back many times since, most recently in 1986.',
          },
          {
            ask: 'What did people in 1066 take it to mean?',
            answers: ['An omen: a warning that great change or disaster was coming', 'Nothing: they knew it was only ice and dust', 'That the harvest would be good'],
            hint: 'The Chronicle calls it a "token". A token is a sign of something.',
          },
          {
            ask: 'The comet came in April, but the tapestry stitches it right next to Harold\'s crowning in January. What does moving it there do?',
            answers: ['It makes the comet look like heaven\'s judgement on Harold becoming king', 'It shows the makers did not know the date', 'It proves the comet was seen twice'],
            hint: 'A picture can make an argument just by putting two things side by side.',
          },
        ],
      },
    ],
    mattered: 'This is the oldest known picture of Halley\'s Comet. It is also a lesson in how a source can bend the truth without telling a single lie: only by choosing what goes next to what.',
  },
  {
    id: 'claimants',
    caption: 'TRES REGNUM PETUNT',
    meaning: 'Three men seek the kingdom (a caption of the scribe\'s own: the tapestry has no such scene)',
    title: 'Three men, one crown',
    date: 'The spring and summer of 1066',
    tellings: [
      {
        account: [
          'Harold Godwinson held the crown. He had no royal blood, but he was the greatest earl in England, the dying king had named him, the Witan had accepted him, and he had been crowned.',
          'William, Duke of Normandy, said the crown had been promised to him by Edward and sworn to him by Harold. He began building a fleet.',
          'Harald Sigurdsson, King of Norway, called Hardrada, "hard ruler", was the most famous warrior of the age. His claim came from an old agreement between an earlier king of Norway and an earlier king of England. With him came Tostig, Harold Godwinson\'s own brother, who had been driven out of his earldom the year before and wanted revenge.',
        ],
        source: 'The Anglo-Saxon Chronicle; the Norman chroniclers; the Norse sagas. The tapestry leaves the Norwegian king out entirely.',
        questions: [
          {
            ask: 'Whose claim rested on a promise and an oath?',
            answers: ['William of Normandy', 'Harald Hardrada of Norway', 'Tostig'],
            hint: 'You stitched his side of that story two panels ago.',
          },
          {
            ask: 'What was the strongest part of Harold Godwinson\'s claim?',
            answers: ['He had been named by the dying king, accepted by the Witan, and crowned', 'He was King Edward\'s eldest son', 'He had conquered England in battle'],
            hint: 'He was not of royal blood. His claim came from what was done in January.',
          },
          {
            ask: 'Who was Tostig?',
            answers: ['Harold Godwinson\'s own brother, now fighting against him', 'The King of Norway\'s son', 'The Archbishop of York'],
            hint: 'This was a family quarrel as well as a war.',
          },
        ],
      },
    ],
    mattered: 'Harold had to guard two coasts at once, against two invasions, without knowing which would come first.',
  },
  {
    id: 'stamford',
    caption: 'HIC HAROLD REX NORTHMANNOS VICIT',
    meaning: 'Here King Harold defeated the Northmen (the scribe\'s caption: this battle is not in the tapestry)',
    title: 'Stamford Bridge',
    date: 'Near York, 25 September 1066',
    tellings: [
      {
        voice: 'As the English told it',
        banner: 'ANGLI DICUNT',
        account: [
          'In September the King of Norway and Tostig sailed up towards York with, the Chronicle says, "three hundred ships or more". On 20 September they beat the northern earls at Fulford.',
          'Harold was in the south. He marched north "by day and night, as soon as he could collect his army", and on 25 September he caught the Norwegians at Stamford Bridge: "Thither came Harold, king of the English, unawares against them beyond the bridge."',
          'They fought "long in the day". The Chronicle tells of one Norwegian who held the bridge alone until an Englishman got beneath it and speared him from below. The King of Norway and Tostig were both killed. The survivors were allowed to sail home, and needed only twenty-four ships to do it.',
        ],
        source: 'The Anglo-Saxon Chronicle for 1066, written by English monks within living memory of the battle.',
        questions: [
          {
            ask: 'How did Harold win at Stamford Bridge?',
            answers: ['He marched north so fast that he caught the Norwegians by surprise', 'He waited behind the walls of York until they starved', 'He paid them to go home'],
            hint: 'The Chronicle\'s word is "unawares".',
          },
          {
            ask: 'About 300 ships came. How many were needed to carry the survivors home?',
            answers: ['Twenty-four', 'Three hundred', 'None: no one survived'],
            hint: 'The number tells you how complete the defeat was.',
          },
        ],
      },
      {
        voice: 'As the Northmen told it',
        banner: 'NORTHMANNI DICUNT',
        account: [
          'The Norse story was written down in Iceland by Snorri Sturluson around 1230, about 160 years after the battle.',
          'In it the day was hot, and the Norwegians had left their mail coats at the ships. Before the fighting a lone English rider came forward and offered Tostig his earldom back if he would change sides. Tostig asked what King Harald of Norway would be given. The rider answered: seven feet of English ground, or as much more as he is taller than other men.',
          'When the rider had gone, the saga says, Tostig told the Norwegian king who it had been: his brother, King Harold of England himself.',
        ],
        source: 'King Harald\'s Saga, in Snorri Sturluson\'s Heimskringla. Historians enjoy it and distrust it: parts of its battle seem to be borrowed from accounts of Hastings.',
        questions: [
          {
            ask: 'In the saga, what does the English rider offer the King of Norway?',
            answers: ['Seven feet of English ground: enough for a grave', 'Half of the kingdom', 'Safe passage home'],
            hint: 'It is a grim joke about how tall he was.',
          },
          {
            ask: 'Why do historians trust the saga less than the Chronicle?',
            answers: ['It was written about 160 years later, far from where it happened', 'It was written by an Englishman', 'It does not mention the battle at all'],
            hint: 'Ask of any source: how close was the writer, in time and place, to what he describes?',
          },
        ],
      },
    ],
    weigh: {
      ask: 'One telling is English and early. The other is Norse and late. On what do they agree?',
      answers: ['Harold of England surprised the Norwegians and destroyed their army, and their king died there', 'That the Norwegians won', 'That no battle took place'],
      hint: 'When two sides who had every reason to disagree tell the same thing, that thing is probably true.',
    },
    mattered: 'It was one of the great victories of English history, and it ended the age of Viking invasions. It also left Harold and his best soldiers 250 miles from the south coast, tired and bloodied, at exactly the wrong moment.',
  },
  {
    id: 'crossing',
    caption: 'HIC WILLELM DUX IN MAGNO NAVIGIO MARE TRANSIVIT ET VENIT AD PEVENESAE',
    meaning: 'Here Duke William crossed the sea in a great ship and came to Pevensey',
    title: 'The crossing',
    date: 'Pevensey, Sussex, 28 September 1066',
    tellings: [
      {
        account: [
          'All summer William built ships and gathered men, then waited weeks for a wind that would carry him north across the Channel.',
          'Harold had kept an army and a fleet watching the south coast all summer too. But by 8 September their food had run out. The Chronicle says "no man could keep them there any longer", and they were sent home.',
          'The wind turned at the end of the month. William landed at Pevensey on 28 September, three days after Stamford Bridge, and no one was there to stop him. The tapestry shows the horses being led out of the ships: William had brought knights who fought on horseback, and the English fought on foot.',
        ],
        source: 'The tapestry (which also has the caption "HIC EXEUNT CABALLI DE NAVIBUS", here the horses come out of the ships); the Anglo-Saxon Chronicle.',
        questions: [
          {
            ask: 'Why was there no English army on the beach when William landed?',
            answers: ['The coast guard had been sent home when its food ran out, and Harold was in the north', 'The English did not know Normandy existed', 'Harold had invited William to come'],
            hint: 'Two things had happened in September. One was on 8 September and one on the 25th.',
          },
          {
            ask: 'What did William bring across the sea that would matter most in the battle to come?',
            answers: ['Horses, for knights who fought on horseback', 'Elephants', 'Cannon'],
            hint: 'The tapestry gives it a caption of its own.',
          },
        ],
      },
    ],
    mattered: 'Had the wind changed a month earlier, William would have met Harold\'s whole army waiting on the shore. Had it changed a month later, Harold would have been rested. The timing was luck, and it decided a kingdom.',
  },
  {
    id: 'march',
    caption: 'HIC NUNTIATUM EST WILLELMO DE HAROLD',
    meaning: 'Here news of Harold is brought to William',
    title: 'The long road south',
    date: 'York to Sussex, October 1066',
    tellings: [
      {
        account: [
          'Harold heard of the landing while he was still in the north. He turned his army round and marched it back, about 200 miles to London and then some 60 more to the Sussex coast.',
          'He did not wait in London long enough for all the men he had summoned to reach him. The Chronicle says William "came against him unawares, ere his army was collected; but the king, nevertheless, very hardly encountered him with the men that would support him."',
          'Stamford Bridge was fought on 25 September. The two armies met near Hastings on 14 October: nineteen days later.',
        ],
        source: 'The Anglo-Saxon Chronicle for 1066. Historians still argue about why Harold hurried.',
        questions: [
          {
            ask: 'How long was it between Stamford Bridge and the battle near Hastings?',
            answers: ['Nineteen days', 'Six months', 'One day'],
            hint: '25 September to 14 October. Count the days.',
          },
          {
            ask: 'What state was Harold\'s army in when it reached Sussex?',
            answers: ['Tired from two long marches and a hard battle, and not yet at full strength', 'Fresh and larger than it had ever been', 'It had refused to fight and gone home'],
            hint: 'The Chronicle says the battle came "ere his army was collected".',
          },
          {
            ask: 'What else could Harold have done?',
            answers: ['Waited near London for more men to arrive before fighting', 'Sailed to Normandy and attacked it', 'Nothing: there was no other choice at all'],
            hint: 'He was in a hurry. What would not being in a hurry have looked like?',
          },
        ],
      },
    ],
    mattered: 'This is the panel to remember when someone says William won because the Normans were simply better. Harold fought two invasions in three weeks, at opposite ends of his kingdom.',
  },
  {
    id: 'hastings',
    caption: 'HIC CECIDERUNT SIMUL ANGLI ET FRANCI IN PRELIO',
    meaning: 'Here English and French fell together in battle',
    title: 'The battle',
    date: 'Near Hastings, Saturday 14 October 1066',
    tellings: [
      {
        account: [
          'Harold drew up his men on foot along the top of a ridge, shoulder to shoulder behind a wall of shields. William had archers, foot soldiers, and knights on horseback, and had to attack uphill.',
          'It lasted nearly the whole day, which was very long for a battle then. For hours the shield wall held. At one point a cry went up that William was dead; the tapestry shows him tipping back his helmet so that his men could see his face.',
          'The Norman writers say that what broke the wall was a trick. Groups of knights pretended to flee. Some of the English ran down the hill after them, and on open ground the horsemen turned and cut them off.',
        ],
        source: 'The tapestry; William of Poitiers for the pretended flight. Some historians think the first retreat was a real panic that the Normans then learned to copy.',
        questions: [
          {
            ask: 'How did the English army fight?',
            answers: ['On foot, in a tight wall of shields along a ridge', 'On horseback, charging downhill', 'From ships anchored off the shore'],
            hint: 'They had the high ground and they stood still on it.',
          },
          {
            ask: 'According to the Normans, what finally broke the English line?',
            answers: ['Knights pretended to run away, and drew some of the English down off the ridge', 'It began to rain', 'The English ran out of shields'],
            hint: 'The wall was only strong while everyone stayed in it.',
          },
          {
            ask: 'Why does the tapestry show William lifting his helmet?',
            answers: ['A rumour had spread that he was dead, and his men needed to see he was alive', 'He was too hot', 'He was surrendering'],
            hint: 'An army that thinks its leader has fallen may stop fighting.',
          },
        ],
      },
    ],
    mattered: 'The battle was close. It was decided late in the day, and by a narrow margin, between a tired army on a hill and a fresh one with cavalry.',
  },
  {
    id: 'harold',
    caption: 'HIC HAROLD REX INTERFECTUS EST',
    meaning: 'Here King Harold was killed',
    title: 'How did Harold die?',
    date: 'Near Hastings, towards dusk, 14 October 1066',
    tellings: [
      {
        voice: 'The arrow',
        banner: 'SAGITTA',
        account: [
          'Under the word HAROLD in the tapestry stands a man gripping a shaft that seems to have struck him in the face. This is the picture everyone remembers: King Harold with an arrow in his eye.',
          'The story is first written down around 1080 by Amatus, a monk of Montecassino in Italy, and again around 1100 by a French poet, Baudri of Bourgueil.',
          'But the stitches in this part of the tapestry were repaired in the 1800s. Drawings made of it about 1730, before the repairs, seem to show the man holding something longer, perhaps a spear.',
        ],
        source: 'The tapestry; Amatus of Montecassino; Baudri of Bourgueil. All written or made well after the battle.',
        questions: [
          {
            ask: 'Where does the story of the arrow in the eye mainly come from?',
            answers: ['The tapestry\'s picture, and writers of about 1080 and later', 'A letter Harold wrote the night before', 'The Anglo-Saxon Chronicle, which describes it in detail'],
            hint: 'The Chronicle says only "There was slain King Harold". The arrow comes from elsewhere.',
          },
          {
            ask: 'Why are historians careful about the arrow in the tapestry?',
            answers: ['That part was restored in the 1800s, and older drawings show it differently', 'Arrows had not been invented', 'The tapestry does not show any arrows at all'],
            hint: 'What we see today is not exactly what was stitched in the 1070s.',
          },
        ],
      },
      {
        voice: 'The sword',
        banner: 'GLADIUS',
        account: [
          'The earliest account of the battle that we have is a Latin poem, the Song of the Battle of Hastings, probably written within a year or two. It has no arrow.',
          'In the poem four knights, one of them Duke William himself, ride at Harold and cut him down with their weapons.',
          'The tapestry may show this too. Just to the right of the man with the shaft, still under the words INTERFECTUS EST, "was killed", a man is falling beneath the sword of a Norman horseman.',
        ],
        source: 'The Carmen de Hastingae Proelio, usually thought to be by Guy, Bishop of Amiens, about 1067. Not all scholars agree on its date.',
        questions: [
          {
            ask: 'What does the earliest written account say happened to Harold?',
            answers: ['He was cut down by four knights', 'He was shot in the eye by an archer', 'He escaped and lived as a hermit'],
            hint: 'The poem written closest to the battle has swords in it, and no arrow.',
          },
          {
            ask: 'Which figure in the tapestry might be Harold?',
            answers: ['Either one: the man with the shaft, the man being cut down, or both, shown one after the other', 'Neither: the tapestry does not show his death', 'The man on the throne'],
            hint: 'The tapestry often shows the same person twice in one scene, to show two moments.',
          },
        ],
      },
    ],
    weigh: {
      ask: 'What can a careful historian honestly say about how Harold died?',
      answers: ['He was killed late in the battle; exactly how is uncertain, and it may have been both', 'It was certainly an arrow in the eye, because that is the famous version', 'Nothing at all can be known about 1066'],
      hint: 'Being unsure about one detail is not the same as knowing nothing.',
    },
    mattered: 'With Harold fell his two brothers, Gyrth and Leofwine, and most of the leaders of England. There was no one left to gather another army.',
  },
  {
    id: 'tapestry',
    caption: 'ET FUGA VERTERUNT ANGLI',
    meaning: 'And the English turned in flight (the last words that survive: the end of the cloth is torn away)',
    title: 'The cloth itself',
    date: 'Made in the 1070s; William was crowned on Christmas Day 1066',
    tellings: [
      {
        account: [
          'You have been stitching a copy of a real object. It is nearly a thousand years old and about 68 metres long. It is not truly a tapestry, which is woven: it is embroidery, coloured wool stitched onto linen.',
          'No one wrote down who ordered it. Most historians think it was Odo, Bishop of Bayeux, who was William\'s half-brother. Odo appears in it again and again, feasting, advising, and rallying the young knights in the battle. It was probably made in England, perhaps at Canterbury, where the finest needleworkers were.',
          'So it tells the winners\' story, but probably with English hands. It gives Harold his title of king. And it leaves things out. The King of Norway and the battle of Stamford Bridge are not in it at all.',
          'Its last scene is missing. The cloth is torn off just after the English flee. It very likely ended with William crowned king in Westminster Abbey on Christmas Day 1066. The Chronicle, written by the losers, ends its account of the year differently: the Normans "wrought castles widely through this country, and harassed the miserable people; and ever since has evil increased very much."',
        ],
        source: 'The tapestry itself; the Anglo-Saxon Chronicle for 1066.',
        questions: [
          {
            ask: 'Strictly speaking, what is the Bayeux Tapestry?',
            answers: ['An embroidery: wool stitched onto linen', 'A tapestry woven on a loom', 'A painting on wood'],
            hint: 'You have been doing it with a needle, not a loom.',
          },
          {
            ask: 'Who most likely had it made?',
            answers: ['Bishop Odo of Bayeux, William\'s half-brother', 'King Harold', 'The King of Norway'],
            hint: 'Look for the man who keeps turning up in it looking important.',
          },
          {
            ask: 'What does the tapestry leave out completely?',
            answers: ['The Norwegian invasion and the battle of Stamford Bridge', 'The battle near Hastings', 'Duke William'],
            hint: 'You had to write the caption for that panel yourself.',
          },
          {
            ask: 'It was paid for by the winners and probably stitched by the losers. What should a careful reader do with a source like that?',
            answers: ['Ask who made it, for whom, and what is missing, and set it beside other accounts', 'Believe all of it, because it is very old', 'Believe none of it, because it takes a side'],
            hint: 'Every source takes a side. That is a reason to read more of them, not fewer.',
          },
        ],
      },
    ],
    mattered: 'On Christmas Day 1066 William was crowned King of England. What that changed, in language, in law and in who owned the land, is the next part of the cloth.',
  },
];

export const ACTS: Act[] = [
  {
    numeral: 'I',
    title: 'Rome\'s Shadow',
    latin: 'Umbra Romae',
    meaning: 'The shadow of Rome',
    style: 'roman',
    modelled:
      'There is no tapestry of these events. Where a real line survives, the caption over a panel quotes it in its own language, Latin or Greek: rest the pointer on a caption, or tap it, to see what it says and where it is from. The pictures are stitched like the rest of the cloth, but borrow from Roman and eastern art: the key-pattern borders of Roman floors, temples and aqueducts, the eagles, dolphins and peacocks of mosaics, and the gold haloes and domes of Constantinople.',
    closing: 'from an empire round a sea to the half of it that carried on. The Northmen come next.',
    panels: ROME,
  },
  {
    numeral: 'II',
    title: 'The Viking Thread',
    latin: 'Filum Northmannorum',
    meaning: 'The thread of the Northmen',
    style: 'norse',
    modelled:
      'There is no tapestry of these events. Where a real record survives, the caption over a panel is a line of it in its own language: Old English, Arabic, Latin, or runes. Rest the pointer on a caption, or tap it, to see what it says and where it is from. The pictures are stitched like the rest of the cloth, but borrow from the Northmen\'s own art: the ships with chequered sails cut on the picture-stones of Gotland, the ribbon-beasts they carved on wood and stone, and the woven hangings found in the ship burial at Oseberg in Norway.',
    closing: 'from the first raid to a boy duke in Normandy. The year 1066 comes next.',
    panels: NORTHMEN,
  },
  {
    numeral: 'III',
    title: 'The Year 1066',
    latin: 'Anno Domini MLXVI',
    meaning: 'The year of our Lord 1066',
    style: 'bayeux',
    modelled:
      'This part follows the Bayeux Tapestry itself, made in the 1070s: its captions, its scenes, and its manner of drawing. Where a panel shows something the tapestry leaves out, the desk says so.',
    closing: 'from an empty throne to a new king.',
    panels: ANNO,
  },
];

const OWN_1066 = ['claimants', 'stamford'];
/** Every panel of the cloth in order, each knowing which act it is in. */
export const PANELS: Panel[] = ACTS.flatMap((act, i) =>
  act.panels.map((p) => ({ ...p, act: i, quoted: p.quoted ?? (act.style === 'bayeux' && !OWN_1066.includes(p.id) ? 'The Bayeux Tapestry, 1070s' : undefined) })),
);
