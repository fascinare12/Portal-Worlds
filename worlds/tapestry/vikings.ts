import type { PanelData } from './acts';

/**
 * Act 2: the Viking thread. Who the Northmen were, where they went, how some
 * of them became the Normans, and how that leads to William.
 *
 * Sources. Quotations from the Anglo-Saxon Chronicle are from James Ingram's
 * translation (1823), in the public domain. Alcuin, Ibn Fadlan, Dudo of
 * Saint-Quentin and the charter of 918 are described or given in reported
 * speech, not quoted at length.
 *
 * Captions. There is no tapestry of these events. Where a real record
 * survives, the caption is a line of it in its own language: Old English from
 * the Chronicle (793 and 1017), Arabic from Ibn Fadlan, Latin from the
 * charter of 918, and runes from a Swedish rune-stone. The other captions
 * are Latin of the scribe's own, and the game says which is which.
 *
 * In every question the FIRST answer listed is the right one.
 */
export const NORTHMEN: PanelData[] = [
  {
    id: 'northmen',
    caption: 'HIC SUNT NORTHMANNI',
    meaning: 'Here are the Northmen',
    title: 'The people of the north',
    date: 'Scandinavia, about the year 790',
    tellings: [
      {
        account: [
          'In the lands we now call Denmark, Norway and Sweden lived farmers, fishermen, craftsmen and traders. Their neighbours to the south called them simply the Northmen.',
          '"Viking" was not the name of a people. In their own language, to go "viking" was something a man did: he went off across the sea to raid. Most Northmen never did.',
          'What made it possible was the ship. It was long, light and shallow. With a sail it could cross open sea; with oars it could be rowed far up a river; and it could be run straight onto any beach, with no need of a harbour.',
        ],
        source: 'The ships themselves, dug out of burial mounds at Oseberg and Gokstad in Norway; stones carved with runes; and the word "viking" as it is used in their own inscriptions.',
        questions: [
          {
            ask: 'To the Northmen themselves, what did "viking" mean?',
            answers: ['Something you did: going across the sea on a raid', 'The name of their nation', 'Their word for a king'],
            hint: 'A farmer could go viking one summer and be a farmer again by harvest.',
          },
          {
            ask: 'What made their ships so dangerous to everyone else?',
            answers: ['They could cross open sea, yet were shallow enough to row up rivers and land on any beach', 'They were built of iron', 'They carried hundreds of horses'],
            hint: 'Think about where such a ship could go that other ships could not.',
          },
        ],
      },
    ],
    mattered: 'For the next two and a half centuries, anywhere in Europe within reach of the sea or a river was within reach of these ships.',
  },
  {
    id: 'lindisfarne',
    caption: 'EARMLICE HÆÞENRA MANNA HERGUNC ADILEGODE GODES CYRICAN IN LINDISFARNAEE',
    meaning: 'Wretchedly, the harrying of heathen men destroyed God\'s church on Lindisfarne',
    language: 'Old English',
    quoted: 'The Anglo-Saxon Chronicle (manuscripts D and E), under the year 793',
    title: 'The raid on Holy Island',
    date: 'Lindisfarne, Northumbria, 793',
    tellings: [
      {
        voice: 'As the monks told it',
        banner: 'MONACHI DICUNT',
        account: [
          'Lindisfarne was a monastery on a small island off the north-east coast of England, famous for its learning and its treasures. It had no walls and no soldiers.',
          'The Chronicle says that in 793 there came "dreadful fore-warnings over the land of the Northumbrians", among them "fiery dragons flying across the firmament". Then: "the harrowing inroads of heathen men made lamentable havoc in the church of God in Holy-island, by rapine and slaughter."',
          'Alcuin, a Northumbrian scholar living at the court of Charlemagne, wrote home that such terror had never been seen in Britain before. He thought God was punishing the English for their sins.',
        ],
        source: 'The Anglo-Saxon Chronicle for 793; the letters of Alcuin of York. Both written by churchmen.',
        questions: [
          {
            ask: 'Why were monasteries such easy targets?',
            answers: ['They were rich, unguarded, and often right beside the sea', 'They were where the English kings lived', 'They had the largest armies'],
            hint: 'Gold and silver on the altar, and nobody with a sword.',
          },
          {
            ask: 'How did the monks themselves explain the raid?',
            answers: ['As a punishment from God, foretold by signs in the sky', 'As an ordinary trading dispute', 'As revenge for an English attack on Norway'],
            hint: 'Look at what the Chronicle says came first, before the ships.',
          },
        ],
      },
      {
        voice: 'What the Northmen left',
        banner: 'LAPIDES DICUNT',
        runes: {
          text: 'ᛁᚾ ᚢᛚᚠᚱ ᚼᛅᚠᛁᛦ ᚬᚾᚴᛚᛅᛏᛁ ᚦᚱᚢ ᚴᛁᛅᛚᛏᛅᚴᛅᛏ',
          reads: 'in ulfr hafiʀ onklati þru kialtakat',
          means: 'And Ulf has taken three payments in England',
          source: 'A rune-stone at Yttergärde in Sweden (catalogued as U 344), carved in the 1020s or soon after. The carver wrote a letter only once where one word ends and the next begins with it.',
          word: 'ᚴᚾᚢᛏᚱ',
          answer: 'knutr',
          wordMeans: 'Knútr: the Danish king the English called Cnut. The stone goes on to list who made each payment, and ends "þa kalt knutr": "then Cnut paid."',
        },
        account: [
          'The men who raided Lindisfarne wrote nothing about it that has come down to us. Northmen of that time did not write histories. They cut short messages in runes, on stone and wood and bone.',
          'Their own stories, the sagas, were written down in Iceland about four hundred years later.',
          'So for the first raids we have only the words of the people who were attacked. What survives from the other side is not words but things: ships, graves, buried hoards of silver, and stones raised in memory of the dead. One stone in Sweden boasts of a man who three times "took payment in England".',
        ],
        source: 'Archaeology, and runestones. The stone mentioned is at Yttergärde in Sweden and dates from the 1020s.',
        questions: [
          {
            ask: 'Why is there no Viking account of the raid on Lindisfarne?',
            answers: ['They did not write histories then, only short inscriptions; their sagas came centuries later', 'The monks burned it', 'They were ashamed of what they had done'],
            hint: 'It is not that an account was lost. It was never written.',
          },
          {
            ask: 'What kind of evidence do we have from the Northmen\'s side for these years?',
            answers: ['Objects: ships, graves, silver hoards and carved stones', 'Daily newspapers', 'Long letters to their families'],
            hint: 'The banner over this half of the panel says LAPIDES DICUNT: "the stones speak".',
          },
        ],
      },
    ],
    weigh: {
      ask: 'Only one side wrote about the raids. What should a careful reader keep in mind?',
      answers: ['We are hearing the victims\' view: true as far as it goes, but not the whole of who the Northmen were', 'The monks must have invented the raids', 'Written sources are always complete'],
      hint: 'A person who has just been robbed can tell you a great deal about the robbery, and very little about the robber\'s home.',
    },
    mattered: 'The raid of 793 is the date usually given for the beginning of the Viking Age. Its end is usually put at a battle in the north of England in 1066: Stamford Bridge.',
  },
  {
    id: 'east',
    caption: 'لم أر أتم أبدانا منهم كأنهم النخل شقر حمر',
    meaning: 'I have never seen bodies more perfect than theirs: they are like palm trees, fair and ruddy',
    language: 'Arabic',
    script: 'arabic',
    reads: 'lam ara atamma abdānan minhum, ka-annahum al-nakhl, shuqr ḥumr',
    quoted: 'Ahmad ibn Fadlan, the account of his journey, 920s',
    title: 'The road east',
    date: 'The river Volga, 921 and 922',
    tellings: [
      {
        account: [
          'Not all the Northmen went west. From Sweden they crossed the Baltic and followed the great rivers south through what are now Russia and Ukraine, trading furs, honey, wax and slaves. The people there called them the Rus.',
          'What they wanted in return was silver. Coins struck in Baghdad and Samarkand, called dirhams, have been dug up in Scandinavia by the tens of thousands.',
          'In 921 the Caliph in Baghdad sent an embassy north. Its secretary, Ahmad ibn Fadlan, met Rus traders camped beside the Volga and wrote down what he saw. He said he had never seen bodies more perfect: tall as palm trees, fair and ruddy, each man carrying an axe, a sword and a knife. He also thought them the dirtiest people he had ever met. And he watched them bury a chieftain by burning him in his ship.',
        ],
        source: 'Ibn Fadlan\'s account of his journey, written in Arabic in the 920s: the fullest description of these people by anyone who actually met them.',
        questions: [
          {
            ask: 'What did the Rus traders most want from the lands to the south and east?',
            answers: ['Silver', 'Farmland', 'Books'],
            hint: 'It has been found in Scandinavia in buried hoards, stamped with Arabic writing.',
          },
          {
            ask: 'Who was Ibn Fadlan?',
            answers: ['An envoy from the Caliph of Baghdad, who met the Rus and wrote about them', 'A Viking chieftain', 'An English monk'],
            hint: 'He came from the south, on official business, and he kept a record.',
          },
          {
            ask: 'Why do historians value his account so highly?',
            answers: ['He was an eyewitness, and an outsider who was neither their victim nor their descendant', 'He wrote it four hundred years later', 'He admired everything about them'],
            hint: 'Compare him with the monks of Lindisfarne, and with the saga writers.',
          },
        ],
      },
    ],
    mattered: 'The Viking world ran from Baghdad to the North Atlantic. The Rus gave their name to Russia. And Northmen served as the personal guard of the emperor in Constantinople: one of them, as a young man, was Harald Hardrada.',
  },
  {
    id: 'settlers',
    caption: 'HIC TERRAS NOVAS COLUNT',
    meaning: 'Here they settle new lands',
    title: 'Raiders become settlers',
    date: 'About 865 to 1021',
    tellings: [
      {
        account: [
          'After two generations of summer raids, the armies began to stay the winter, and then to stay for good.',
          'In England a great Danish army arrived in 865 and overran kingdom after kingdom. King Alfred of Wessex finally beat it in 878. The peace he made with its leader, Guthrum, left the north and east of England to the Danes, to live under their own law: the Danelaw. English towns whose names end in -by or -thorpe, such as Derby and Grimsby, were named by them. So were the words sky, egg, knife, window, and even they and them.',
          'Others sailed for emptier lands: Iceland from about 870, Greenland from about 985, and around the year 1000 the coast of North America. At L\'Anse aux Meadows in Newfoundland archaeologists have found their houses. In 2021 scientists studying the tree rings of wood cut there with metal tools showed that it was felled in exactly the year 1021.',
        ],
        source: 'The Anglo-Saxon Chronicle; place names and the English language itself; excavations in Newfoundland.',
        questions: [
          {
            ask: 'What was the Danelaw?',
            answers: ['The part of England where Danes settled and lived under their own law', 'A tax paid to the Pope', 'A kind of Viking ship'],
            hint: 'It was a place, and it took up about half of England.',
          },
          {
            ask: 'What evidence of the Danish settlers is still in everyday English?',
            answers: ['Place names ending in -by, and words like sky, egg and they', 'The numbers one to ten', 'The alphabet'],
            hint: 'You have probably used several of their words today.',
          },
          {
            ask: 'How do we know Northmen reached America about 500 years before Columbus?',
            answers: ['Their houses have been found in Newfoundland, and wood cut there has been dated to 1021', 'Columbus wrote that he met them', 'A Viking ship is still sailing there'],
            hint: 'The proof was dug out of the ground, and dated by counting tree rings.',
          },
        ],
      },
    ],
    mattered: 'The same people who came to rob came to stay. And wherever they stayed, within a few generations they had taken on the language and the religion of the people around them.',
  },
  {
    id: 'cnut',
    caption: 'HER ON ÞISUM GEARE FENG CNUT CYNING TO EALLON ANGELCYNNES RYCE',
    meaning: 'In this year King Cnut succeeded to the whole kingdom of the English',
    language: 'Old English',
    quoted: 'The Anglo-Saxon Chronicle, under the year 1017',
    title: 'A Danish king of England',
    date: 'England, 1016 to 1042',
    tellings: [
      {
        account: [
          'In the 980s the raids on England began again. English kings paid enormous sums of silver to make the raiders go away. The payment was called Danegeld, and it worked only until they came back for more.',
          'In 1016 Cnut, son of the King of Denmark, made himself king of all England. The Chronicle says "King Knute took to the whole government of England". He went on to rule Denmark and Norway as well.',
          'To bind himself to the old royal house he married Emma, the widow of the English king he had replaced. The Chronicle calls her "the daughter of Richard": Richard, Duke of Normandy. Emma\'s sons by her first husband fled to her family in Normandy and grew up there.',
          'When Cnut\'s own sons had died, in 1042, one of those exiles came home to be king. He was Edward, later called the Confessor.',
        ],
        source: 'The Anglo-Saxon Chronicle for 1016 and 1017.',
        questions: [
          {
            ask: 'What was Danegeld?',
            answers: ['Silver paid to Viking raiders to make them leave', 'A Danish law about farming', 'The Danish word for a ship'],
            hint: '"Geld" means payment. It bought a little time.',
          },
          {
            ask: 'Who was Emma?',
            answers: ['A Norman duke\'s daughter who was married to two kings of England, and was the mother of Edward', 'Cnut\'s sister', 'A Viking chieftain'],
            hint: 'She links three families: the English kings, the Danish kings, and the dukes of Normandy.',
          },
          {
            ask: 'Why does it matter for 1066 that Edward grew up in Normandy?',
            answers: ['He had Norman kin and Norman friends, which is where Duke William\'s claim to England came from', 'He never learned to speak', 'He became Duke of Normandy'],
            hint: 'Think about whose house he was living in, and who else was in that family.',
          },
        ],
      },
    ],
    mattered: 'When William landed in 1066, England had already been conquered by a Northman once within living memory. A king from across the sea was not a new idea.',
  },
  {
    id: 'rollo',
    caption: 'NORMANNIS SEQUANENSIBUS VIDELICET ROLLONI SUISQUE COMITIBUS PRO TUTELA REGNI',
    meaning: 'To the Northmen of the Seine, namely Rollo and his companions, for the protection of the kingdom',
    quoted: 'A charter of King Charles the Simple, 14 March 918',
    title: 'The bargain on the Seine',
    date: 'Northern France, 911',
    tellings: [
      {
        voice: 'As Dudo told it',
        banner: 'DUDO DICIT',
        account: [
          'For years a Viking chieftain named Rollo had been raiding up the river Seine. In 911 he was beaten outside the city of Chartres, and the King of the Franks, Charles, offered him a bargain.',
          'Rollo could keep the land around Rouen at the mouth of the Seine, as the king\'s man. In return he must be baptised a Christian, and he must keep other Vikings out of the river.',
          'The story goes on. Rollo was told that he must kiss the king\'s foot. He refused, and ordered one of his warriors to do it. The man did not kneel: he seized the royal foot and lifted it to his mouth, and the king went over backwards.',
        ],
        source: 'Dudo of Saint-Quentin, a churchman, writing about a hundred years later. He was paid to write the history of the family by Rollo\'s own grandson and great-grandson.',
        questions: [
          {
            ask: 'What did Rollo have to do in return for the land?',
            answers: ['Be baptised, and defend the Seine against other Vikings', 'Give the king all his ships', 'Go back to Scandinavia'],
            hint: 'The king was hiring one wolf to keep out the others.',
          },
          {
            ask: 'Who paid Dudo to write this history?',
            answers: ['Rollo\'s own descendants, the dukes of Normandy', 'The King of the Franks', 'Nobody: he was there and saw it'],
            hint: 'Ask who would enjoy a story in which their ancestor refuses to bow.',
          },
        ],
      },
      {
        voice: 'As the charter tells it',
        banner: 'CARTA DICIT',
        account: [
          'A charter is a legal document, written to record who has been given what.',
          'One survives from King Charles, dated 918. It grants some land to an abbey, and in passing it excepts the part that the king says he has already given to the Northmen of the Seine, to Rollo and his companions, for the protection of the kingdom.',
          'That is all. There is no meeting-place, no date, no baptism and no foot. But it was written within seven years of the event, by the king\'s own clerks, for a practical purpose, with no reason to flatter anyone.',
        ],
        source: 'A charter of King Charles the Simple for the abbey of Saint-Germain-des-Prés, 918: the earliest document that names Rollo.',
        questions: [
          {
            ask: 'What does the charter tell us for certain?',
            answers: ['That by 918 the king had granted land to Rollo and his men, to defend the kingdom', 'That Rollo tipped the king over', 'That Rollo was seven feet tall'],
            hint: 'It is a dry document. Take from it only what it actually says.',
          },
          {
            ask: 'Why might a historian trust the charter more than Dudo\'s story?',
            answers: ['It was written close to the time, for a practical purpose, not to glorify anyone', 'It is longer and more exciting', 'It was written by Rollo himself'],
            hint: 'Think about when each was written, and why.',
          },
        ],
      },
    ],
    weigh: {
      ask: 'Putting the story and the charter side by side, what can we be fairly sure of?',
      answers: ['The king gave Rollo land on the Seine in return for defending it; the tale of the foot rests on Dudo alone', 'Everything in Dudo, because it is the fuller account', 'Nothing: Rollo may never have existed'],
      hint: 'Where a lively story and a dull document agree, believe it. Where only the lively story speaks, be careful.',
    },
    mattered: 'The land Rollo was given came to be called after its new owners: the land of the Northmen, Normandy.',
  },
  {
    id: 'french',
    caption: 'HIC NORTHMANNI FRANCI FIUNT',
    meaning: 'Here the Northmen become French',
    title: 'Vikings who went French',
    date: 'Normandy, 911 to about 1030',
    tellings: [
      {
        account: [
          'Rollo was baptised and took a Christian name, Robert. His followers married local women and raised their children among French speakers.',
          'The old language went quickly. Dudo says that Rollo\'s own son had to send his boy away from Rouen to be taught the Northmen\'s tongue, because in Rouen it was no longer spoken.',
          'The dukes became patrons of the Church and rebuilt great abbeys such as Jumièges and Mont-Saint-Michel. And they gave up fighting on foot from ships. From the Franks they learned a new way of war: armoured knights on horseback, and castles to hold the land.',
          'What they did not give up was the sea, or the appetite. In the 1000s Normans sailed south and conquered southern Italy and Sicily.',
        ],
        source: 'Dudo of Saint-Quentin for the language; the abbeys themselves; the later history of the Normans in Italy.',
        questions: [
          {
            ask: 'What happened to the Northmen\'s language in Normandy?',
            answers: ['Within a few generations they had given it up and spoke French', 'Everyone in France learned it', 'It became the language of the Church'],
            hint: 'A duke had to send his son away to learn it.',
          },
          {
            ask: 'What way of fighting did the Normans learn from the Franks?',
            answers: ['Fighting on horseback, as armoured knights', 'Fighting from elephants', 'Fighting only at sea'],
            hint: 'It is how they will fight at Hastings.',
          },
          {
            ask: 'What did they keep from their Viking forefathers?',
            answers: ['Their ships, and their readiness to cross the sea and take a country', 'Their old gods', 'Their runes'],
            hint: 'Think of Sicily. Then think of 1066.',
          },
        ],
      },
    ],
    mattered: 'This is why the army of 1066 looks the way it does in the tapestry: it crosses the Channel in Viking ships, and then it fights on horseback, speaking French.',
  },
  {
    id: 'william',
    caption: 'HIC WILLELM DUX NORMANNORUM',
    meaning: 'Here is William, Duke of the Normans',
    title: 'A duke at seven',
    date: 'Normandy, about 1028 to 1047',
    tellings: [
      {
        account: [
          'William was born at Falaise about 1028. His father was Duke Robert of Normandy. His mother, Herleva, was the daughter of a townsman, and his parents were not married. His enemies called him William the Bastard all his life.',
          'In 1035 his father died on the way home from a pilgrimage to Jerusalem, and William became duke at about seven years old. Powerful men wanted his place. Several of the guardians who were meant to protect him were murdered. In 1047, at about nineteen, he beat a rebel army at Val-ès-Dunes and began to rule in his own right.',
          'Count the generations back from him: Robert, Richard, Richard, William Longsword, Rollo. The Viking who made the bargain on the Seine was his great-great-great-grandfather.',
          'And one of those Richards had a daughter: Emma, whose son Edward was now King of England.',
        ],
        source: 'The Norman chroniclers William of Jumièges and William of Poitiers.',
        questions: [
          {
            ask: 'How was William related to Rollo the Viking?',
            answers: ['He was Rollo\'s direct descendant, five generations on', 'He was Rollo\'s brother', 'They were not related'],
            hint: 'The account lists every duke between them.',
          },
          {
            ask: 'Why was William\'s childhood so dangerous?',
            answers: ['He became duke as a small child, and powerful men who wanted his place killed his guardians', 'Normandy was at war with England', 'He was sent to sea at seven'],
            hint: 'A seven-year-old ruler is only as safe as the adults around him.',
          },
          {
            ask: 'How did William come to be kin to the King of England?',
            answers: ['Through Emma of Normandy, his great-aunt, who was King Edward\'s mother', 'He married Edward\'s daughter', 'His mother was English'],
            hint: 'You met her earlier, married to Cnut.',
          },
        ],
      },
    ],
    mattered: 'By 1066 William had held Normandy for thirty years, most of them by force. He was the descendant of a Viking, he spoke French, he fought on horseback, and he had a tie of blood to a king with no heir. The next part of the cloth is that year.',
  },
];
