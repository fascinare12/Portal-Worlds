import type { PanelData } from './acts';

/**
 * Act 4: what the Conquest changed. Castles, the wasting of the north, who
 * owned the land, the great survey, the two languages, the new churches, the
 * king's forests, the village, and the reckoning at William's death.
 *
 * Sources. Quotations in English from the Anglo-Saxon Chronicle are from
 * James Ingram's translation (1823); the one quotation from Orderic Vitalis
 * is from Thomas Forester's translation (1853). Both are in the public
 * domain. Richard fitzNigel, William of Malmesbury and Domesday Book are
 * described or given in reported speech.
 *
 * Captions. There is no tapestry of these events. Seven of the nine captions
 * are real lines in their own languages: Old English from the Chronicle
 * (1066, 1085 and 1087) and from King William's writ to London; Latin from
 * Domesday Book and from William of Malmesbury; and Middle English from
 * Robert of Gloucester. The banners over the paired tellings are the scribe's
 * own Latin.
 *
 * In every question the FIRST answer listed is the right one.
 */
export const CONQUEST: PanelData[] = [
  {
    id: 'castles',
    caption: 'WORHTON CASTELAS WIDE GEOND ÞAS ÞEODE AND EARM FOLC SWENCTE',
    meaning: 'They built castles far and wide through this nation, and oppressed the wretched people',
    language: 'Old English',
    quoted: 'The Anglo-Saxon Chronicle (manuscript D), under the year 1066',
    title: 'A castle on every hill',
    date: 'England, 1066 to 1100',
    tellings: [
      {
        account: [
          'William had won one battle and one crown. He had a few thousand followers in a country of perhaps two million people, most of whom had never seen him and did not want him.',
          'His answer was the castle. The quick kind was a steep mound of earth (the motte) with a wooden tower on top, and beside it a fenced yard (the bailey) for men, horses and stores. With enough forced labour, one could be raised in a matter of weeks. England had had almost none before 1066.',
          'A few dozen mounted men in a castle could hold down the country for a day\'s ride around, and could not easily be got out. In towns the castle went wherever the Normans chose: at Lincoln, Domesday Book records 166 houses pulled down to make room. Archaeologists count something like five hundred castle mounds from the first twenty years. The great ones were soon rebuilt in stone, the Tower of London among them.',
        ],
        source: 'The Anglo-Saxon Chronicle for 1066 and 1067; Domesday Book for Lincoln; the mounds themselves, hundreds of which are still there. The count of five hundred is an estimate, and others are higher.',
        questions: [
          {
            ask: 'Why did William need castles at all, having already won?',
            answers: ['A few thousand Normans had to hold down millions of people who had not chosen them', 'The English asked for them, to keep out the Northmen', 'Norman soldiers refused to sleep in English houses'],
            hint: 'Count the Normans. Then count the English.',
          },
          {
            ask: 'What was a motte and bailey?',
            answers: ['A mound of earth with a wooden tower, and a fenced yard beside it', 'A stone cathedral with two towers', 'A kind of ship for carrying horses'],
            hint: 'It was made of earth and timber, and it could be thrown up in weeks.',
          },
          {
            ask: 'The caption is from an English chronicle. What did its writer think of the castles?',
            answers: ['That they were built to oppress the people, and that things had grown worse ever since', 'That they were a fine improvement and long overdue', 'Nothing: the writer does not mention them'],
            hint: 'Read the last three words of the caption again, with their meaning.',
          },
        ],
      },
    ],
    mattered: 'The castle is what turned a victory into a conquest. Every later rising broke against one. And the landscape of England still shows it: nearly every old English town has a castle mound, or a street named after one.',
  },
  {
    id: 'harrying',
    caption: 'WASTA EST',
    meaning: 'It is waste',
    quoted: 'Domesday Book, 1086: the whole entry, or the end of it, for village after village in Yorkshire',
    title: 'The Harrying of the North',
    date: 'Yorkshire, the winter of 1069 to 1070',
    tellings: [
      {
        voice: 'As a monk told it, fifty years on',
        banner: 'ORDERICUS DICIT',
        account: [
          'In 1069 the north of England rose against William, with a Danish fleet to help. The Norman garrison at York was killed. It was not the first rising there.',
          'William marched north in the dead of winter. He did not only hunt the rebels. He set out to make sure the north could never feed an army again. Orderic Vitalis says he ordered "the corn and cattle, with the implements of husbandry and every sort of provisions" to be heaped up and burned, through the whole country beyond the Humber.',
          'In the famine that followed, Orderic says, "more than a hundred thousand souls, of both sexes and all ages, perished of want." Orderic was born in England in 1075, the son of a Norman father and an English mother, and became a monk in Normandy. He admired William and says so often. Of this he writes that he "dare not commend him".',
        ],
        source: 'Orderic Vitalis, the Ecclesiastical History, written in Normandy between about 1114 and 1141. The words quoted are from Forester\'s translation of 1853.',
        questions: [
          {
            ask: 'What, above all, did William destroy in the north?',
            answers: ['The food, the animals and the tools for growing more', 'Only the castles the rebels had built', 'The Danish fleet, at sea'],
            hint: 'An army can be beaten in a day. He wanted something that would last longer than that.',
          },
          {
            ask: 'Why does Orderic\'s judgement carry weight?',
            answers: ['He was half Norman, admired William, and still could not excuse it', 'He was there and saw it with his own eyes', 'He was an English rebel who hated all Normans'],
            hint: 'Look at when he was born, and at who his father was.',
          },
        ],
      },
      {
        voice: 'As the king\'s own book has it',
        banner: 'LIBER REGIS DICIT',
        account: [
          'Sixteen years after that winter the king\'s surveyors rode through Yorkshire, writing down what every place was worth. For more than half of the places they visited, some or all of the land is entered with one word: waste.',
          'That is not a monk\'s opinion. It is the king\'s own clerks, counting the king\'s own income. But "waste" only means land that paid its lord nothing in 1086. It does not say why. Some of it was surely burned in 1069. Some may have been empty for other reasons, or moved to another manor, or simply not known to the clerks.',
          'And nobody counted the dead. A hundred thousand is a round number, written fifty years later; some historians doubt that an army of a few thousand could do so much in one winter. Hardly any doubt that it was terrible. The argument is over how terrible.',
        ],
        source: 'Domesday Book for Yorkshire, 1086, and what historians have made of it. They do not agree.',
        questions: [
          {
            ask: 'What does the word "waste" in Domesday tell us for certain?',
            answers: ['That the land was yielding nothing to its lord in 1086, but not the reason', 'That exactly a hundred thousand people died there', 'That the land had always been empty moor'],
            hint: 'The clerks were counting income. They wrote down what there was, not how it came to be so.',
          },
          {
            ask: 'Why should a figure like "a hundred thousand" be handled with care?',
            answers: ['It is a round number written fifty years later, and nobody at the time was counting', 'Monks were not able to count as high as that', 'It comes from Domesday Book, which is known to exaggerate'],
            hint: 'Ask who counted, and when. Then ask how round the number is.',
          },
        ],
      },
    ],
    weigh: {
      ask: 'A monk gives a number and a judgement; a tax book gives one bare word. Put together, what can be said safely?',
      answers: ['The north was deliberately laid waste and was still poor a generation later; the number of dead is not known', 'Nothing much happened, since the two do not match exactly', 'Exactly a hundred thousand died, since a monk would not lie'],
      hint: 'Two very different sources point the same way. That is worth a good deal, even if they cannot settle the number.',
    },
    mattered: 'The north did not rise again. Of the many rebellions against William, none after this winter came close to unseating him. It is also the act for which even his admirers, in his own century, would not forgive him.',
  },
  {
    id: 'lords',
    caption: 'TERRA REGIS',
    meaning: 'The land of the King',
    quoted: 'Domesday Book, 1086: the first heading under each county',
    title: 'Whose land is it now?',
    date: 'England, 1066 to 1086',
    tellings: [
      {
        account: [
          'Before 1066 the land of England was held by several thousand English lords, great and small. William treated every man who had fought for Harold as a traitor, and a traitor\'s land was forfeit. Each rebellion after that cost more English lords their estates.',
          'Twenty years on, Domesday Book shows the result. The king kept about a fifth of the country himself. The Church had about a quarter. About half was held by fewer than two hundred barons, nearly all of them from Normandy and northern France. Only a handful of Englishmen still held land directly from the king.',
          'And the rule had changed. Now all land was the king\'s. A baron held his share from the king, in return for bringing a fixed number of armed knights when called; lesser men held from the baron in the same way. In 1086, at Salisbury, William had every landholder of any account swear to be loyal to him against all other men, even against their own lord.',
          'The English lords were dead, or in exile, or tenants on land that had been their fathers\'. Some went as far as Constantinople and took service in the emperor\'s guard.',
        ],
        source: 'Domesday Book, 1086; the Anglo-Saxon Chronicle for 1086 on the oath at Salisbury. The shares are historians\' counts from Domesday and are approximate.',
        questions: [
          {
            ask: 'By 1086, who held most of the land of England?',
            answers: ['The king, the Church, and fewer than two hundred barons from across the Channel', 'The same English families as before 1066', 'The villagers, each owning their own farm'],
            hint: 'It went to very few people, and very few of them were English.',
          },
          {
            ask: 'On what terms did a baron hold his land?',
            answers: ['From the king, in return for loyalty and a fixed number of knights', 'Outright and for ever, owing nothing to anyone', 'By winning a vote of his villagers each year'],
            hint: 'Nobody but the king now owned land outright. Everybody else held it from someone, for something.',
          },
          {
            ask: 'What was the point of the oath at Salisbury?',
            answers: ['To bind every landholder to the king first, above his own lord', 'To make the English swear never to speak French', 'To choose the next king'],
            hint: 'A baron with his own knights could become a danger. William had been one himself.',
          },
        ],
      },
    ],
    mattered: 'Almost a whole ruling class was replaced inside twenty years. The people who worked the land mostly stayed where they were; the people they worked it for were new, spoke another language, and owed everything they had to the king.',
  },
  {
    id: 'domesday',
    caption: 'AN OXE NE AN CU NE AN SWIN',
    meaning: 'Not one ox, nor one cow, nor one pig',
    language: 'Old English',
    quoted: 'The Anglo-Saxon Chronicle (manuscript E), under the year 1085',
    title: 'The book of judgement',
    date: 'England, 1086',
    tellings: [
      {
        voice: 'As the English told it',
        banner: 'ANGLI DICUNT',
        account: [
          'At Christmas 1085, at Gloucester, the king had "very deep consultation with his council, about this land; how it was occupied, and by what sort of men." Then he sent his men into every shire.',
          'They asked the same questions everywhere, of juries of local men, English and French, under oath. Who held this land in King Edward\'s day? Who holds it now? How many ploughs, how many villagers, how many slaves, how much woodland and meadow, how many mills and fishponds? What was it worth then, and what is it worth now?',
          'The English chronicler was not pleased. So narrowly did the king have it searched out, he says, "that there was not one single hide, nor a yard of land, nay, moreover (it is shameful to tell, though he thought it no shame to do it), not even an ox, nor a cow, nor a swine was there left, that was not set down in his writ."',
        ],
        source: 'The Anglo-Saxon Chronicle (manuscript E) for 1085, in Ingram\'s translation. The list of questions is from a copy kept by the monks of Ely.',
        questions: [
          {
            ask: 'What did the king\'s men want to know about each place?',
            answers: ['Who held it before 1066, who held it now, what was on it, and what it was worth', 'Which language the villagers preferred', 'How many castles the villagers would like built'],
            hint: 'Then and now. Who, what, and how much.',
          },
          {
            ask: 'What does the English chronicler think of the survey?',
            answers: ['That it was shamefully prying and greedy', 'That it was the wisest thing the king ever did', 'That it never really happened'],
            hint: '"It is shameful to tell, though he thought it no shame to do it."',
          },
        ],
      },
      {
        voice: 'As the king\'s treasurer told it',
        banner: 'THESAURARIUS DICIT',
        account: [
          'About a century later Richard fitzNigel, who ran the treasury for King Henry II, wrote a handbook for his clerks. He kept the great survey beside him and used it every working day.',
          'He says William had it made so that the conquered people should live under written law, each man knowing what was his and not reaching for his neighbour\'s. After twenty years of land changing hands by force, a single record of who held what was worth having, to barons as much as to the king.',
          'He also explains its name. "The natives call this book Domesdei, that is, the day of judgment." Not because it was cruel, he says, but because what it says cannot be argued with, any more than the Last Judgement can.',
          'Historians still do not agree what it was mainly for: taxing, knowing who owed the king soldiers, or settling who owned what. It may have been all three. It names more than thirteen thousand places.',
        ],
        source: 'Richard fitzNigel, the Dialogue of the Exchequer, about 1179. He was writing nearly a hundred years after the survey.',
        questions: [
          {
            ask: 'According to fitzNigel, why did the English call it "Domesday"?',
            answers: ['Because, like the Day of Judgement, its word was final', 'Because it was finished on the last day of the year', 'Because the king was called William the Doomed'],
            hint: '"Doom" in Old English meant a judgement, not a disaster.',
          },
          {
            ask: 'After twenty years of conquest, why would even a Norman baron want such a book?',
            answers: ['It was written proof that his land was lawfully his', 'It told him how to build a castle', 'It was the only book in French'],
            hint: 'Land had been seized, granted, lost and seized again. Think what a baron might worry about.',
          },
        ],
      },
    ],
    weigh: {
      ask: 'The chronicler calls the survey shameful; the treasurer calls it justice. Why might they see the same book so differently?',
      answers: ['One was among the people being counted; the other worked for the king and relied on the book', 'One of them had never heard of it', 'The chronicler could not read'],
      hint: 'Ask where each man was standing: under the survey, or behind it.',
    },
    mattered: 'Because of it we know more about England in 1086 than about any other country in Europe at that date: who lived where and what they had, down to the mills and the beehives. It is still kept, in two volumes, in the National Archives.',
  },
  {
    id: 'tongue',
    caption: 'VOR BOTE A MAN CONNE FRENSS ME TELÞ OF HIM LUTE',
    meaning: 'For unless a man knows French, people think little of him',
    language: 'Middle English',
    quoted: 'The Chronicle of Robert of Gloucester, about 1300',
    title: 'Two tongues',
    date: 'England, 1066 to about 1400',
    tellings: [
      {
        account: [
          'The new lords spoke French. For some three hundred years French was the language of the king\'s court, the castle and the law courts, and Latin was the language of the Church and of written records. Before 1066 English kings had sent out their orders in English. Within a few years they were going out in Latin.',
          'But the English were the many. They were the ploughmen, the cooks, the nurses and very often the wives. English went on being spoken, and when it came back into writing it had changed: plainer in its grammar, and full of French.',
          'You can still hear who was who. The animal in the field kept its English name, because the English looked after it: cow, pig, sheep, deer. The meat on the table took a French one, because the French were eating it: beef, pork, mutton, venison. Castle, court, judge, jury, prison, crown and parliament are all French. So are William, Robert, Richard, Henry and Alice, which soon pushed out Godwin, Leofric and Ælfgifu.',
          'About 1300 Robert of Gloucester could still write: "unless a man knows French, people think little of him; but low men hold to English, and to their own speech still."',
        ],
        source: 'The words themselves, and when each first appears in English writing; Robert of Gloucester\'s rhyming chronicle, written in English about 1300.',
        questions: [
          {
            ask: 'Why is the animal a "cow" but the meat "beef"?',
            answers: ['The English who tended it used their word; the French-speaking lords who ate it used theirs', 'Cows and beef come from different animals', 'The Pope ordered meat to be named in French'],
            hint: 'Ask who was in the field, and who was at the table.',
          },
          {
            ask: 'Which of these sets of words came into English from the conquerors\' French?',
            answers: ['Court, judge, prison', 'Cow, pig, sheep', 'House, bread, plough'],
            hint: 'Think about what the new lords ran, not what the villagers did all day.',
          },
          {
            ask: 'Why did English survive at all?',
            answers: ['Nearly everyone spoke it, and the French speakers were few and lived among them', 'King William passed a law protecting it', 'The Normans could not pronounce French'],
            hint: 'A few thousand newcomers. Two million people already there.',
          },
          {
            ask: 'What does Robert of Gloucester tell us about England more than two hundred years after Hastings?',
            answers: ['French still marked the high and English the low', 'Nobody in England spoke English any more', 'Everyone had gone back to Old Norse'],
            hint: 'He is writing in English, and grumbling about who looks down on whom.',
          },
        ],
      },
    ],
    mattered: 'English today has two words for a great many things, one plain and one grand: ask and demand, help and aid, kingly and royal. The plain one is usually Old English and the grand one French. That is the Conquest, still in your mouth.',
  },
  {
    id: 'stone',
    caption: 'VIDEAS UBIQUE IN VILLIS ECCLESIAS IN VICIS ET URBIBUS MONASTERIA NOVO AEDIFICANDI GENERE CONSURGERE',
    meaning: 'You may see churches rising everywhere in the villages, and monasteries in the towns and cities, in a new manner of building',
    quoted: 'William of Malmesbury, the Deeds of the Kings of the English, about 1125',
    title: 'Stone',
    date: 'England, 1070 to 1130',
    tellings: [
      {
        account: [
          'In 1070, with the Pope\'s envoys beside him, William removed the English Archbishop of Canterbury and put in Lanfranc, an Italian scholar who had been an abbot in Normandy. As English bishops and abbots died or were removed, men from across the Channel took their places. When William died only one English bishop was left: Wulfstan of Worcester.',
          'The newcomers thought the English churches small and old. Within about fifty years nearly every cathedral and great abbey in England was pulled down and built again, far larger, in the manner of Normandy: thick walls, huge round pillars, round-headed arches. Durham, begun in 1093, is the most famous. Some were built of stone shipped from Caen in Normandy.',
          'William of Malmesbury, a monk with one Norman parent and one English, wrote the line in the caption with admiration. Not everyone felt it. Some of the new churches were among the largest buildings in Europe.',
        ],
        source: 'William of Malmesbury, writing about 1125; and the buildings, many of which are still standing.',
        questions: [
          {
            ask: 'What happened to the leaders of the English Church?',
            answers: ['Almost all were replaced by men from across the Channel', 'They were left exactly as they were', 'They were all made barons'],
            hint: 'By 1087 there was one English bishop left.',
          },
          {
            ask: 'How would you know a Norman church if you walked into one?',
            answers: ['Thick walls, massive round pillars and round-headed arches', 'Thin walls of glass and tall pointed arches', 'A timber hall with a thatched roof'],
            hint: 'Pointed arches come a century later. These are heavy, and round.',
          },
          {
            ask: 'What did a vast new stone cathedral say to the people living in its shadow?',
            answers: ['That the newcomers had wealth, skill and the Church on their side, and meant to stay', 'That the Normans would soon be going home', 'That stone was cheaper than wood'],
            hint: 'Nobody spends forty years building something he means to leave.',
          },
        ],
      },
    ],
    mattered: 'Many of them are still standing and still in use nine hundred years later: Durham, Ely, Norwich, Peterborough, Winchester. In England this way of building is simply called Norman.',
  },
  {
    id: 'forest',
    caption: 'SWA SWIÐE HE LUFODE ÞA HEADEOR SWILCE HE WÆRE HEORA FÆDER',
    meaning: 'He loved the tall deer as much as if he were their father',
    language: 'Old English',
    quoted: 'The Anglo-Saxon Chronicle (manuscript E), in its rhyme on King William, 1087',
    title: 'The king\'s deer',
    date: 'The New Forest, about 1079',
    tellings: [
      {
        account: [
          'A "forest" did not then mean a wood. It meant land set outside the ordinary law and kept for the king\'s hunting: trees, yes, but also heath, farms and whole villages. William made the New Forest in Hampshire about 1079, and there were others. Under later kings perhaps a quarter of England was forest in this sense.',
          'Inside it the deer and the boar were the king\'s. People who lived there could not hunt them, nor fence them out of the corn, nor cut wood freely, nor clear new fields. The Chronicle says that whoever killed a hart or a hind was to be blinded.',
          'The English chronicler put his opinion into rhyme, which is unusual: Old English verse did not normally rhyme. "He loved the tall deer as if he were their father," he wrote. The rich complained and the poor grumbled, but the king was so stern that he did not care.',
          'Later writers said William had flattened villages and churches to make the New Forest. Domesday suggests the soil there was poor and few people had lived on it. Historians think the destruction was exaggerated, though the anger was real.',
        ],
        source: 'The Anglo-Saxon Chronicle (manuscript E) for 1087; Domesday Book for Hampshire. The stories of destroyed villages come from writers of the next century.',
        questions: [
          {
            ask: 'What did "forest" mean in William\'s England?',
            answers: ['Land under a special law, kept for the king\'s hunting, whether or not it had trees', 'Any thick wood with wolves in it', 'A garden inside a castle'],
            hint: 'It is a word about law, not about trees. There were villages inside it.',
          },
          {
            ask: 'When the chronicler says the king loved the deer "as if he were their father", what is his tone?',
            answers: ['Mocking: the king cared more for his deer than for his people', 'Admiring: he thinks the king is kind to animals', 'Puzzled: he thinks the king was really a deer'],
            hint: 'Read what he says, in the same breath, about the rich and the poor.',
          },
          {
            ask: 'Why did forest law bite hardest on ordinary people?',
            answers: ['It took away food, firewood and the right to protect their crops', 'It made them hunt for the king every day', 'It made them plant trees on their fields'],
            hint: 'Think what a village takes from the land around it, and what happens when a deer walks into the barley.',
          },
        ],
      },
    ],
    mattered: 'Forest law was hated for centuries. In 1217 a Charter of the Forest was issued alongside Magna Carta, giving some of it back. And when stories of Robin Hood appear, it is no accident that he is an outlaw who shoots the king\'s deer.',
  },
  {
    id: 'plough',
    caption: 'IC WYLLE ÞÆT GET BEON EALLRA ÞÆRA LAGA WEORÐE ÞE GYT WÆRAN ON EADWERDES DÆGE KYNGES',
    meaning: 'I will that you be worthy of all the laws that you were worthy of in King Edward\'s day',
    language: 'Old English',
    quoted: 'King William\'s writ to the city of London, about 1067',
    title: 'Behind the plough',
    date: 'An English village, 1066 to 1100',
    tellings: [
      {
        voice: 'What was lost',
        banner: 'QUID PERIIT',
        account: [
          'Nine in ten English people lived by farming. For them the Conquest arrived as a new lord: a stranger who spoke French, lived behind a ditch, and wanted more.',
          'Domesday shows manors paying more in 1086 than they had in 1066, and in many places farmers who had been free to "go with their land" to any lord they chose are found, twenty years on, tied to a Norman lord\'s manor. How far this went is argued over, but the direction is clear.',
          'The law itself now told the two peoples apart. If a man was found killed and the killer was not handed over, the dead man was presumed to be French, and the whole district paid a heavy fine, called the murdrum. It shows how often Normans were being quietly killed, and who was made to pay for it.',
        ],
        source: 'Domesday Book, comparing 1066 with 1086; the laws issued in William\'s name. How much freedom was lost is something historians dispute.',
        questions: [
          {
            ask: 'What does the murdrum fine tell us about England after 1066?',
            answers: ['Normans were being killed in secret, and whole communities were punished for it', 'The English and the Normans had become firm friends', 'Nobody was ever killed in England again'],
            hint: 'Nobody makes a law against something that is not happening.',
          },
          {
            ask: 'What happened to many farmers who had been free in 1066?',
            answers: ['By 1086 they were tied to a lord\'s manor and owed him more', 'They were all made knights', 'They were given the land of the English lords'],
            hint: 'The land went upward, not downward.',
          },
        ],
      },
      {
        voice: 'What stayed, and what ended',
        banner: 'QUID MANSIT',
        account: [
          'William said he was King Edward\'s lawful heir, not a robber. So he promised to keep King Edward\'s laws. His promise to London survives: a strip of parchment about six inches long, written in English, not French. Its words are the caption over this panel.',
          'He kept more than the laws. The shires and their courts, the sheriffs, the silver penny and the land tax were all English inventions, and they worked better than anything he had in Normandy. He simply put his own men in charge of them. The villages, the fields and the saints\' days stayed as they were.',
          'And one thing ended. Domesday counts about one person in ten as a slave, who could be bought and sold. The Normans did not keep slaves at home. Archbishop Lanfranc and Bishop Wulfstan preached against the slave trade from Bristol to Ireland; William forbade selling people abroad; and in 1102 a council of the Church in London condemned the selling of men "like brute beasts". Within two generations slavery had gone from England. The freed did not become free farmers, though. They joined the villagers tied to a lord.',
        ],
        source: 'William\'s writ to London (now in the London Archives); Domesday Book on slaves; the Council of Westminster, 1102. That the old machinery of government was kept is agreed by nearly all historians.',
        questions: [
          {
            ask: 'Why did William keep the English shires, sheriffs, coins and taxes?',
            answers: ['They worked well, and he claimed to be the lawful heir of the king who had used them', 'He did not know they existed', 'The Pope forbade him to change anything'],
            hint: 'A conqueror who says he is the rightful king has every reason to keep the kingdom running as it was.',
          },
          {
            ask: 'What happened to slavery in England after the Conquest?',
            answers: ['It faded away within two generations, though the freed were still tied to a lord', 'It grew until most people were slaves', 'It stayed exactly as it had been'],
            hint: 'About one in ten in 1086. None to speak of by the 1130s.',
          },
        ],
      },
    ],
    weigh: {
      ask: 'So was the Conquest a disaster for ordinary people, or hardly a change? What does a careful answer look like?',
      answers: ['It depends who you were: worse for many free farmers, better for slaves, and for most the same fields under a harder lord', 'A disaster for every single person, with nothing else to be said', 'No change at all for anybody below a baron'],
      hint: 'Both tellings are true. A good answer has room for both.',
    },
    mattered: 'Historians still argue about how much 1066 changed. Much of the answer depends on where you look. At the top, nearly everything. In the fields, much less. The careful ones say both.',
  },
  {
    id: 'reckoning',
    caption: 'REOWLIC ÞING HE DYDE AND REOWLICOR HIM GELAMP',
    meaning: 'A pitiful thing he did, and a more pitiful thing befell him',
    language: 'Old English',
    quoted: 'The Anglo-Saxon Chronicle (manuscript E), under the year 1087',
    title: 'The reckoning',
    date: 'Rouen and Caen, September 1087',
    tellings: [
      {
        account: [
          'In the summer of 1087 William, nearly sixty, was at war with the King of France. He burned the town of Mantes, churches and all. That is the "pitiful thing" of the caption. Soon after, he fell ill; some say he was hurt when his horse stumbled in the ashes. He died at Rouen on the ninth of September. That is the "more pitiful".',
          'The English chronicler who recorded it then does something rare. He says he knew the man: "we who often looked upon him, and lived sometime in his court." And he sets down both sides.',
          'William was "a very wise man, and very rich", "mild to the good men that loved God, and beyond all measure severe to the men that gainsayed his will." He kept such order that a man "might go over his kingdom unhurt with his bosom full of gold." But also: "Castles he let men build, and miserably swink the poor." He "was fallen into covetousness, and greediness he loved withal."',
          'He ends: "These things have we written concerning him, both good and evil; that men may choose the good after their goodness, and flee from the evil withal."',
        ],
        source: 'The Anglo-Saxon Chronicle (manuscript E) for 1087, in Ingram\'s translation. The writer was English, a churchman, and had lived in William\'s household.',
        questions: [
          {
            ask: 'How does the chronicler know what kind of man William was?',
            answers: ['He had seen him often and had lived for a time at his court', 'He read about him in the Bayeux Tapestry', 'He was William\'s son'],
            hint: 'He tells us himself, in one line, before he begins.',
          },
          {
            ask: 'What is unusual about his account of the king?',
            answers: ['He writes down both the good and the evil, and says that he is doing so', 'He writes nothing but praise', 'He refuses to say anything at all'],
            hint: 'Look at how he ends.',
          },
          {
            ask: 'What good does even this English writer grant to William?',
            answers: ['He kept such order that a traveller carrying gold was safe', 'He lowered everyone\'s taxes', 'He gave the land back to the English'],
            hint: '"His bosom full of gold."',
          },
          {
            ask: 'Twenty-one years after Hastings, what had the Conquest changed most completely?',
            answers: ['Who held the land, who ran the Church, and what language power spoke', 'The crops grown in the fields and the way they were ploughed', 'The shires, the coins and the courts'],
            hint: 'Think back along this act. What was new at the top, and what was kept underneath?',
          },
        ],
      },
    ],
    mattered: 'Before 1066 England looked north, to the world of Cnut and the Northmen. After it England looked south, to France and to Rome. Its kings held land across the Channel for the next four hundred years, and fought the kings of France over it for most of them.',
  },
];
