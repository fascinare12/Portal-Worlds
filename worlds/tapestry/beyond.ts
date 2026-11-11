import type { PanelData } from './acts';

/**
 * Act 5: the medieval world beyond England. The scholars of Baghdad and what
 * they kept and added; how it reached Europe; the Crusades; the roads that
 * joined Mali to China; the plague that travelled them; what the plague
 * changed; and printing, which ends the scribe's trade.
 *
 * Sources. The colophon of the Catholicon is translated by A. W. Pollard
 * (An Essay on Colophons, 1905), in the public domain. Usama ibn Munqidh is
 * given in reported speech after P. K. Hitti's translation. Everything else
 * is described or summarised.
 *
 * Captions. Eight of the ten are real lines in their own languages: Arabic
 * (al-Kindi; the title of al-Khwarizmi's book), Latin (Fibonacci; the Gesta
 * Francorum twice; the Catholicon), Catalan (the Catalan Atlas) and Middle
 * English (John Ball's rhyme). Two are the scribe's own Latin, and the game
 * says which.
 *
 * In every question the FIRST answer listed is the right one.
 */
export const BEYOND: PanelData[] = [
  {
    id: 'baghdad',
    caption: 'ينبغي لنا أن لا نستحي من استحسان الحق واقتناء الحق من أين أتى',
    meaning: 'We ought not to be ashamed of admiring the truth and acquiring it, wherever it comes from',
    language: 'Arabic',
    reads: 'yanbaghi lana an la nastahyi min istihsan al-haqq wa-qtina al-haqq min ayna ata',
    script: 'arabic',
    quoted: 'Al-Kindi, On First Philosophy, written in Baghdad about 840',
    title: 'The city of books',
    date: 'Baghdad, about 830',
    tellings: [
      {
        account: [
          'In the century of Charlemagne, one of the largest cities in the world was Baghdad. It was the capital of the Abbasid caliphs, who ruled from North Africa to the borders of India.',
          'The caliphs and their courtiers paid for books to be hunted out and turned into Arabic: Greek medicine and mathematics, Persian histories, Indian astronomy. The caliph al-Ma\'mun kept a great library called the House of Wisdom. The best of the translators, Hunayn ibn Ishaq, was a Christian; others were Jews, Persians and pagans from Harran. What mattered was whether you could read Greek.',
          'It was possible because of paper. The craft had come west from China, and paper was far cheaper than the animal skins Europe wrote on. Baghdad had a whole street of paper-sellers and bookshops.',
          'A good deal of what the ancient Greeks wrote on science survives today only because it was copied here. Some of it survives only in Arabic.',
        ],
        source: 'The Arabic translations themselves, many of which survive, and Hunayn\'s own account of his work. Historians now think the House of Wisdom was more a royal library than a school; the translating was real, and happened all over the city.',
        questions: [
          {
            ask: 'What were the translators of Baghdad doing?',
            answers: ['Turning Greek, Persian and Indian learning into Arabic', 'Turning the Qur\'an into Latin for the Pope', 'Writing new laws for England'],
            hint: 'Look at which languages the books were coming out of, and which one they were going into.',
          },
          {
            ask: 'Who did the translating?',
            answers: ['Scholars of several religions, chosen for the languages they knew', 'Only Muslims born in Baghdad', 'Monks sent from Rome'],
            hint: 'The most famous of them was a Christian.',
          },
          {
            ask: 'Why did paper matter so much?',
            answers: ['It was far cheaper than parchment, so many more books could be made', 'It could not burn', 'It was invented in Baghdad and kept secret'],
            hint: 'It came from China, and a sheep did not have to die for every few pages.',
          },
        ],
      },
    ],
    mattered: 'Much of what Europe later called "the wisdom of the ancients" reached it by this road: from Greek into Arabic in Baghdad, and from Arabic into Latin three hundred years later. Without the first step there would have been much less to rediscover.',
  },
  {
    id: 'algebra',
    caption: 'كتاب المختصر في حساب الجبر والمقابلة',
    meaning: 'The Concise Book of Calculation by Restoring and Balancing',
    language: 'Arabic',
    reads: 'Kitab al-mukhtasar fi hisab al-jabr wa-l-muqabala',
    script: 'arabic',
    quoted: 'The title of al-Khwarizmi\'s book, Baghdad, about 820. "Al-jabr" is where the word algebra comes from.',
    title: 'More than keepers',
    date: 'Baghdad, Cairo and Bukhara, 820 to 1040',
    tellings: [
      {
        account: [
          'The scholars who wrote in Arabic did not only keep old books. They argued with them, tested them, and went further.',
          'Al-Khwarizmi, in Baghdad about 820, wrote the book that gave algebra its name, and another explaining the Indian way of writing numbers: nine digits and a zero, with the place of each digit giving its value. Try multiplying XLVIII by CCXIX and you will see why it mattered.',
          'Ibn al-Haytham, in Cairo about 1020, showed by experiment that we see because light comes into the eye from things, not out of the eye towards them, as most of the Greeks had thought. Ibn Sina, known in Europe as Avicenna, wrote a Canon of Medicine so thorough that European universities were still teaching from it six hundred years later.',
          'They mapped the sky as well. Aldebaran, Altair and Betelgeuse are Arabic names.',
        ],
        source: 'The books themselves. Ibn al-Haytham\'s Book of Optics and Ibn Sina\'s Canon both survive, in Arabic and in their medieval Latin translations.',
        questions: [
          {
            ask: 'Where does the word "algebra" come from?',
            answers: ['From "al-jabr" in the title of al-Khwarizmi\'s book', 'From the Latin for "hard sums"', 'From the name of a Greek island'],
            hint: 'It is in the caption over this panel. Read how it sounds.',
          },
          {
            ask: 'What made the Indian numbers so much better than Roman ones?',
            answers: ['Ten signs, including a zero, with each digit\'s place giving its value', 'They were prettier to look at', 'They could only be read by kings'],
            hint: 'In 219 the 2 means two hundred because of where it stands. Roman numerals cannot do that.',
          },
          {
            ask: 'How did Ibn al-Haytham settle how sight works?',
            answers: ['By experiment, testing what light actually does', 'By asking the caliph to decide', 'By copying what the Greeks had said'],
            hint: 'He did not take the old books\' word for it.',
          },
        ],
      },
    ],
    mattered: 'Algebra, the numbers you write every day, the idea that a claim about nature should be tested: none of these began in Europe. They arrived, in Arabic, with their names still on.',
  },
  {
    id: 'toledo',
    caption: 'NOVEM FIGURE INDORUM HE SUNT 9 8 7 6 5 4 3 2 1',
    meaning: 'The nine figures of the Indians are these: 9 8 7 6 5 4 3 2 1',
    quoted: 'Leonardo of Pisa, called Fibonacci, the Book of Calculation, 1202',
    title: 'The way back',
    date: 'Toledo and Pisa, 1085 to 1202',
    tellings: [
      {
        account: [
          'For centuries most of Spain was ruled by Muslims, and its cities had libraries Europe could only dream of. In 1085 the Christian king of Castile took Toledo, books and all.',
          'Scholars came from all over Europe to get at them. They worked in teams: often a local Christian or Jew who knew Arabic would read a book aloud in the everyday Spanish of the street, and a visiting scholar would put it into Latin. Gerard of Cremona came from Italy to find one book, Ptolemy\'s great work on the stars, and stayed for the rest of his life. He translated more than seventy.',
          'The numbers came by a different road: trade. Leonardo of Pisa, whom we call Fibonacci, grew up in a North African port where his father worked for Pisan merchants, and learned to reckon the way the local traders did. In 1202 he wrote a book to teach it to Italians. Its first chapter begins with the line in the caption. He goes on: with these nine, and the sign 0, "which in Arabic is called zephirum", any number at all can be written.',
        ],
        source: 'The Latin translations, hundreds of which survive; a list of Gerard\'s translations drawn up by his pupils; Fibonacci\'s own preface. The caption is as scholars quote it; I could not open an edition.',
        questions: [
          {
            ask: 'How did Arabic learning get into Latin at Toledo?',
            answers: ['Teams of translators: those who knew Arabic working with those who wrote Latin', 'The books were already in Latin', 'The Pope ordered every Muslim to learn Latin'],
            hint: 'Few visitors knew Arabic. Few locals wrote scholarly Latin. So they worked in pairs.',
          },
          {
            ask: 'How did Fibonacci come to know the Indian numbers?',
            answers: ['He grew up among merchants in North Africa who used them', 'He invented them himself', 'He found them carved on a Roman ruin'],
            hint: 'His father\'s job took the family across the sea.',
          },
          {
            ask: 'Fibonacci calls them the figures "of the Indians". Why do we call them Arabic numerals?',
            answers: ['Europe learned them from Arabic speakers, who had learned them from India', 'They were invented in Arabia', 'Nobody knows where they came from'],
            hint: 'A thing is often named after whoever handed it to you, not whoever made it.',
          },
        ],
      },
    ],
    mattered: 'The first universities of Europe, at Bologna, Paris and Oxford, were growing up in exactly these years. Much of what they taught in medicine, astronomy and mathematics had just arrived from Arabic, and Aristotle came with it.',
  },
  {
    id: 'clermont',
    caption: 'DEUS VULT',
    meaning: 'God wills it',
    quoted: 'The Gesta Francorum, about 1100: the cry of the crusaders',
    title: 'The call',
    date: 'Clermont, France, November 1095',
    tellings: [
      {
        account: [
          'Jerusalem had been under Muslim rule for more than four hundred years, and Christian pilgrims had mostly gone on visiting it. What changed was farther north. Turkish armies had beaten the emperor in Constantinople and taken most of what is now Turkey. The emperor wrote to the Pope asking for soldiers.',
          'Pope Urban II asked for much more. In a field at Clermont he called on the knights of western Europe to stop fighting each other, march east, and take Jerusalem. Whoever went, he said, would have his sins forgiven.',
          'No one wrote the speech down at the time. Five accounts survive, written years afterwards, and they do not agree about what he said. They agree on the answer. Tens of thousands went: great lords with their knights, and also crowds of the poor, who set out first and mostly died on the way.',
          'Some of them began the killing before they left. In the spring of 1096, crusaders passing along the Rhine attacked the Jewish communities of Speyer, Worms and Mainz, though bishops tried to shelter them.',
        ],
        source: 'Five versions of Urban\'s speech, the earliest written about five years later; the Gesta Francorum, by a man who went; Hebrew and Latin chronicles of the Rhineland massacres.',
        questions: [
          {
            ask: 'What set the First Crusade going?',
            answers: ['The emperor in Constantinople asked for help against the Turks, and the Pope called for far more', 'Muslim armies had just invaded France', 'The King of England wanted a new kingdom'],
            hint: 'It began with a letter from the east, from the half of Rome that had carried on.',
          },
          {
            ask: 'What did the Pope promise those who went?',
            answers: ['That their sins would be forgiven', 'A wage in silver every week', 'That they would be home by Christmas'],
            hint: 'It was not something he could put in a purse.',
          },
          {
            ask: 'Five versions of the speech survive and they differ. What should a careful reader conclude?',
            answers: ['We know roughly what he asked for, but not his exact words', 'He must have given five speeches', 'The speech was never given at all'],
            hint: 'Each writer was remembering, years later, and knew by then how it had turned out.',
          },
        ],
      },
    ],
    mattered: 'It was the first of many. For two hundred years armies from western Europe went east, and the idea that a war could be holy, and earn forgiveness, was turned on other targets too: in Spain, on the Baltic, and against Christians the Church called heretics.',
  },
  {
    id: 'jerusalem',
    caption: 'TALIS OCCISIO FUIT UT NOSTRI IN SANGUINE ILLORUM PEDES USQUE AD CAVILLAS MITTERENT',
    meaning: 'There was such a slaughter that our men waded in their blood up to the ankles',
    quoted: 'The Gesta Francorum, about 1100, by a crusader who was there',
    title: 'Jerusalem',
    date: 'Jerusalem, 15 July 1099',
    tellings: [
      {
        voice: 'As the crusaders told it',
        banner: 'FRANCI DICUNT',
        account: [
          'After three years, and with only a fraction of those who had set out, the crusaders reached Jerusalem. They besieged it for five weeks in the summer heat, built wooden towers, and on 15 July got over the wall.',
          'The man who wrote the Gesta Francorum was one of them. He is not ashamed of what came next; he is proud. His words are the caption. Then, he says, they went "rejoicing and weeping for joy" to pray at the tomb of Jesus.',
          'To him this was the end of a pilgrimage and a miracle. That they had got there at all, starving and outnumbered, proved to him that God had willed it.',
        ],
        source: 'The Gesta Francorum, written within a year or two by an unnamed crusader from southern Italy, probably a knight. His Latin was read in the text itself.',
        questions: [
          {
            ask: 'How does the crusader who wrote the Gesta feel about the killing?',
            answers: ['Proud: to him it is part of a victory God gave', 'Ashamed, and he tries to hide it', 'He does not mention it'],
            hint: 'He chose to write it down, and in those words.',
          },
          {
            ask: 'Why does it matter that he was there?',
            answers: ['He is an eyewitness, telling us what his own side did and how they saw it', 'It means every number he gives is exact', 'It means he had no reason to take a side'],
            hint: 'An eyewitness is precious. An eyewitness is also on somebody\'s side.',
          },
        ],
      },
      {
        voice: 'As it was told in Mosul and Baghdad',
        banner: 'MUSLIMI DICUNT',
        account: [
          'The Muslim world the crusaders marched into was divided: Turkish princes in Syria fought each other, and all of them were rivals of the caliphs of Egypt, who held Jerusalem. No one came to the city\'s help in time.',
          'The fullest Muslim account is by Ibn al-Athir of Mosul. He says the Franks killed more than seventy thousand people in the al-Aqsa mosque, among them scholars and holy men who had come to live beside the holy place. Refugees reached Baghdad in the fasting month and told what had happened, he says, in words that brought tears to every eye.',
          'Ibn al-Athir wrote about a hundred and thirty years later, and historians think his figure is far too high; the whole city may have held fewer. Jews of the city were killed or sold for ransom too: letters asking for money to buy them back survive in Cairo.',
        ],
        source: 'Ibn al-Athir, The Complete History, finished about 1231; letters of the Jewish community found in the store-room of a Cairo synagogue. Modern estimates of the dead vary widely.',
        questions: [
          {
            ask: 'Why was Jerusalem not rescued?',
            answers: ['The Muslim rulers of the region were divided and fighting each other', 'Nobody knew the crusaders were coming', 'The city had no walls'],
            hint: 'Syria and Egypt were enemies. The crusaders walked into the gap.',
          },
          {
            ask: 'Why should Ibn al-Athir\'s "seventy thousand" be handled with care?',
            answers: ['He wrote some 130 years later, and the figure is larger than the city is likely to have held', 'He was a crusader', 'He was writing about a different city'],
            hint: 'You asked the same of Orderic\'s hundred thousand.',
          },
        ],
      },
    ],
    weigh: {
      ask: 'One side calls it a miracle and the other a catastrophe. What do the two accounts agree on?',
      answers: ['That a great many of the city\'s people were killed when it fell', 'That hardly anyone was hurt', 'That the city was never taken'],
      hint: 'When enemies agree about a fact, it is probably a fact. What they disagree about is what it meant.',
    },
    mattered: 'The crusaders set up four small states along the coast and held Jerusalem for eighty-eight years. In the Muslim world the fall of the city became a reason to unite, though it took most of a century.',
  },
  {
    id: 'saladin',
    caption: 'SALAHADINUS URBEM RECIPIT',
    meaning: 'Saladin takes back the city',
    title: 'Neighbours',
    date: 'Jerusalem, 1187',
    tellings: [
      {
        account: [
          'The man who united Egypt and Syria was Salah al-Din, called Saladin in Europe: a Kurdish general who made himself sultan. In 1187 he destroyed the crusader army at Hattin and came to Jerusalem.',
          'The city surrendered on terms. Each man could go free for ten gold dinars, each woman for five, each child for two. Thousands of the poor were ransomed in a lump or let go; thousands more could not pay and were sold as slaves. There was no massacre. Christians at the time noticed the difference from 1099, and Saladin became a hero in European stories.',
          'In between the battles, people who share a country for ninety years get to know each other. Usama ibn Munqidh, a Syrian nobleman, wrote his memoirs in old age. He thought the Franks brave and their medicine alarming. But he had friends among them: the Templar knights in Jerusalem, he says, used to clear a little chapel so that he could say his prayers.',
          'Europe took home more than stories: sugar, cotton, lemons, syrup, and the words for them, which are all Arabic.',
        ],
        source: 'Baha al-Din and Imad al-Din, who served Saladin; the Frankish chronicles of the surrender; Usama ibn Munqidh\'s Book of Contemplation, written about 1183.',
        questions: [
          {
            ask: 'How did Saladin take Jerusalem in 1187?',
            answers: ['The city surrendered on terms: its people could buy their freedom', 'By killing everyone inside', 'He never did take it'],
            hint: 'A price was agreed, so much a head.',
          },
          {
            ask: 'What happened to those who could not pay?',
            answers: ['Some were freed anyway, and thousands were sold as slaves', 'They were all made knights', 'They were sent to England'],
            hint: 'It was merciful by the standards of the time. It was not gentle.',
          },
          {
            ask: 'What does Usama\'s book show about Franks and Muslims in those years?',
            answers: ['They were enemies who also traded, talked and sometimes made friends', 'They never once met except in battle', 'They had become one people'],
            hint: 'He laughs at them, fights them, and has friends among them.',
          },
        ],
      },
    ],
    mattered: 'The last crusader city fell in 1291. The wars had failed in what they set out to do. What lasted was the contact: goods, words and ideas crossing a sea that both sides now knew far better.',
  },
  {
    id: 'roads',
    caption: 'AQUEST SENYOR NEGRE ÉS APPELLAT MUSSE MELLY',
    meaning: 'This black lord is called Musse Melly',
    language: 'Catalan',
    quoted: 'The Catalan Atlas, made in Majorca in 1375, beside its picture of Mansa Musa of Mali',
    title: 'The roads between',
    date: 'From Mali to China, 1250 to 1350',
    tellings: [
      {
        account: [
          'In the 1200s the Mongols, horsemen from the grasslands north of China, conquered the largest land empire there has ever been. It was done with terrible slaughter. In 1258 they sacked Baghdad itself, and killed the last caliph.',
          'But one family now ruled from Korea to Hungary, and they wanted trade. For about a century a merchant could travel the whole road with one passport. Silk and spices came west; so, most historians think, did the knowledge of gunpowder and the compass, both Chinese. Marco Polo of Venice went east in 1271 and came home twenty-four years later with stories few believed.',
          'The greatest traveller of the age was Ibn Battuta of Tangier, who set out in 1325 and did not stop for thirty years: East Africa, India, China, and across the Sahara to Mali.',
          'Mali, in West Africa, was where much of the Old World\'s gold came from. In 1324 its king, Mansa Musa, crossed the desert on pilgrimage to Mecca with thousands of followers and so much gold that mapmakers in Europe drew him holding a nugget of it. The caption is from one of those maps.',
        ],
        source: 'The travel books of Marco Polo and Ibn Battuta; al-Umari, who visited Cairo twelve years after Mansa Musa; the Catalan Atlas, now in Paris.',
        questions: [
          {
            ask: 'What did the Mongol conquests do for trade?',
            answers: ['For about a century they made one long road from China to Europe safe to travel', 'They stopped all trade for ever', 'They moved all trade on to ships'],
            hint: 'The conquest was brutal. What came after it was a road with one set of rulers.',
          },
          {
            ask: 'Which of these reached Europe from China along those roads?',
            answers: ['Silk, gunpowder and the compass', 'Sugar, lemons and algebra', 'Potatoes, maize and chocolate'],
            hint: 'One is worn, one explodes, and one points north.',
          },
          {
            ask: 'Why did a mapmaker in Majorca put a West African king on his map?',
            answers: ['Mali\'s gold, and Mansa Musa\'s pilgrimage, had made him famous as far as Europe', 'He had conquered Spain', 'The mapmaker had been to Mali himself'],
            hint: 'Look at what he is holding up.',
          },
        ],
      },
    ],
    mattered: 'By 1340 Africa, Europe and Asia were tied together more closely than ever before. Goods moved along those ties, and people, and ideas. So could anything else.',
  },
  {
    id: 'plague',
    caption: 'HIC VENIT PESTILENTIA',
    meaning: 'Here comes the pestilence',
    title: 'The Great Dying',
    date: 'From Central Asia to Iceland, 1338 to 1351',
    tellings: [
      {
        voice: 'As the doctors of the day told it',
        banner: 'PHYSICI DICUNT',
        account: [
          'In October 1347 ships from the Black Sea put in at Sicily with dying crews. Within four years the sickness had crossed Europe, North Africa and the Middle East. Swellings rose in the armpit and groin; most who caught it were dead in a week.',
          'In 1348 the King of France asked the medical professors of Paris for the cause. They answered that on 20 March 1345 Saturn, Jupiter and Mars had come together in the sign of Aquarius, and that this had rotted the air. The cure was to flee bad air, burn sweet herbs, and pray.',
          'Others watched more closely. Ibn al-Khatib, a doctor in Granada, wrote that the disease plainly passed from the sick to the well: whoever nursed a patient caught it, and whoever kept apart did not. He was right.',
          'And some looked for someone to blame. In many towns Jews were accused of poisoning the wells, and were murdered, though the Pope pointed out that Jews were dying of the plague like everyone else.',
        ],
        source: 'The report of the Paris medical faculty, October 1348; Ibn al-Khatib\'s treatise on the plague; Pope Clement VI\'s letters of 1348.',
        questions: [
          {
            ask: 'What did the professors of Paris say had caused the plague?',
            answers: ['Three planets meeting in the sky had spoiled the air', 'A germ carried by fleas', 'Drinking too much water'],
            hint: 'They looked up, not down.',
          },
          {
            ask: 'What had Ibn al-Khatib noticed?',
            answers: ['It spread from person to person: those who kept apart stayed well', 'It only struck on Tuesdays', 'It could be cured with sugar'],
            hint: 'He worked from what he saw happening to nurses and to prisoners.',
          },
        ],
      },
      {
        voice: 'As the bones tell it',
        banner: 'OSSA DICUNT',
        account: [
          'In 1894 a doctor in Hong Kong, Alexandre Yersin, found the cause of plague under a microscope: a bacterium, later named after him, that lives in the fleas of rats and other rodents. Whether that was also what struck in 1347 was argued over for a century.',
          'It was settled by teeth. In 2011 scientists took the bacterium\'s DNA from the teeth of people buried in a plague pit in London in 1349. It was the same.',
          'In 2022 another team traced it back farther. By a lake in the mountains of Kyrgyzstan are gravestones from 1338 that say the dead "died of pestilence". Bodies from those graves carried the ancestor of the Black Death strain. From there it went along the trade roads to the Black Sea, and on by ship. Not everyone thinks that question is closed.',
          'It killed something between a third and a half of the people of Europe, and about as many in the Middle East. The historian Ibn Khaldun, who lost both parents to it in Tunis, wrote that it was as if the world had been called to be forgotten.',
        ],
        source: 'Bos and others in Nature, 2011, on the London teeth; Spyrou and others in Nature, 2022, on the graves in Kyrgyzstan; Ibn Khaldun, the Muqaddimah, 1377. The death toll is an estimate and the estimates differ.',
        questions: [
          {
            ask: 'How do we now know what the Black Death was?',
            answers: ['DNA of the plague bacterium was found in the teeth of people who died of it', 'A medieval doctor left a drawing of the germ', 'It is still only a guess'],
            hint: 'The evidence had been lying in a London burial ground for 660 years.',
          },
          {
            ask: 'How did it travel so far, so fast?',
            answers: ['Along the same trade roads and shipping lanes that carried silk and gold', 'It was blown on the wind from the stars', 'Armies carried it on purpose to every town'],
            hint: 'Look back one panel.',
          },
        ],
      },
    ],
    weigh: {
      ask: 'The Paris professors were the most learned doctors in Europe, and they were wrong. Why?',
      answers: ['They reasoned from the best books they had; nobody could yet see a germ', 'They were not really trying', 'They had been paid to lie'],
      hint: 'It is easy to laugh from here. They had no microscope, and the stars were the science of the day.',
    },
    mattered: 'Nothing else in recorded history has killed so large a share of the people it reached. A world that had filled up over three hundred years was suddenly half empty.',
  },
  {
    id: 'after',
    caption: 'WHAN ADAM DALF AND EVE SPAN WHO WAS THANNE A GENTILMAN',
    meaning: 'When Adam dug and Eve spun, who was then a gentleman?',
    language: 'Middle English',
    quoted: 'The rhyme John Ball preached on in 1381, as Thomas Walsingham recorded it',
    title: 'Who was then a gentleman?',
    date: 'England, 1349 to 1381',
    tellings: [
      {
        account: [
          'Half the workers were dead, and the fields still needed ploughing. For the first time anyone could remember, a labourer could name his price, and walk to the next village if he did not get it.',
          'The lords did not like it. In 1351 Parliament passed a law that wages must stay as they had been before the plague, and that a worker who left his lord could be imprisoned. It was enforced for thirty years and it did not hold.',
          'In 1381, when a new tax was laid on rich and poor alike, the villagers of Kent and Essex marched on London. A priest named John Ball preached to them on an old rhyme: when Adam dug and Eve spun, at the beginning of the world, who was the lord and who the serf? They burned the rolls that recorded who owed what service, and asked the king to end serfdom.',
          'The rising was put down and Ball was hanged. But the lords could not put the people back. Within a century serfdom had withered away in England, not by law but because no one could be made to stay.',
          'English was coming back up too. In 1362 Parliament ordered that cases in the law courts be argued in English, because people could no longer follow the French.',
        ],
        source: 'The Statute of Labourers, 1351; the chroniclers of the rising, Thomas Walsingham and Jean Froissart, both of whom hated it; the Statute of Pleading, 1362.',
        questions: [
          {
            ask: 'Why could workers ask for more after the plague?',
            answers: ['There were far fewer of them, and the same amount of work to be done', 'The king had ordered wages to rise', 'Gold had been found in every village'],
            hint: 'When something is scarce its price goes up. So does someone.',
          },
          {
            ask: 'What did the Statute of Labourers try to do?',
            answers: ['Hold wages down to what they had been before the plague', 'Give every worker a farm', 'End serfdom'],
            hint: 'Ask who sat in Parliament, and who paid the wages.',
          },
          {
            ask: 'What is John Ball\'s rhyme arguing?',
            answers: ['In the beginning there were no lords and serfs, so no one is born to be either', 'That gentlemen should do more gardening', 'That Adam was the first king'],
            hint: 'Adam dug and Eve spun. Who was there to be their lord?',
          },
          {
            ask: 'The rising of 1381 was crushed. What happened to serfdom anyway?',
            answers: ['It faded away over the next century, because lords could no longer force people to stay', 'It became much stricter', 'It was ended the next day by the king'],
            hint: 'The rebels lost. The plague had already won their argument for them.',
          },
        ],
      },
    ],
    mattered: 'You stitched the beginning of this in the last act: farmers tied to a lord, and French above English. The plague, which nobody planned, undid a good part of what the Conquest had built.',
  },
  {
    id: 'press',
    caption: 'NON CALAMI STILI AUT PENNE SUFFRAGIO SED MIRA PATRONARUM FORMARUMQUE CONCORDIA',
    meaning: 'Without help of reed, stylus or pen, but by the wondrous agreement of punches and types',
    quoted: 'The last page of the Catholicon, printed at Mainz in 1460, probably by Gutenberg',
    title: 'The end of the scribe',
    date: 'Mainz, about 1455',
    tellings: [
      {
        voice: 'As it is told in Mainz',
        banner: 'MOGUNTIA DICIT',
        account: [
          'Until now every book in this cloth has been written out by hand, by people like you. A Bible took a scribe a year or more.',
          'About 1450 Johann Gutenberg, a goldsmith of Mainz in Germany, put several things together. He cast each letter as a small block of metal, in a mould, so that he could make thousands exactly alike. He set them in lines, inked them with an oily ink that clung to metal, and pressed paper on them with a press like the ones used for grapes. Then he took the letters apart and used them again.',
          'By 1455 he had printed about a hundred and eighty Bibles. By 1500, forty-five years later, there were presses in more than two hundred European towns, and they had turned out millions of books.',
          'The printer of the Catholicon, a big Latin dictionary, could not resist boasting on its last page. That boast is the caption.',
        ],
        source: 'The books themselves, forty-nine Gutenberg Bibles among them; the record of a lawsuit of 1455; the colophon of the Catholicon, in Pollard\'s translation.',
        questions: [
          {
            ask: 'What was the heart of Gutenberg\'s method?',
            answers: ['Separate metal letters, cast alike in a mould, that could be set, printed from and used again', 'Carving each whole page into a single block of stone', 'Training scribes to write faster'],
            hint: 'The page is made of small parts, and when it is printed the parts go back in the box.',
          },
          {
            ask: 'What changed when books could be printed?',
            answers: ['Books became far cheaper and far more common, so ideas spread faster and to more people', 'Books became rarer and more precious', 'Nothing much, for two hundred years'],
            hint: 'One scribe, one Bible, one year. One press, a hundred and eighty.',
          },
        ],
      },
      {
        voice: 'As it is told in the East',
        banner: 'ORIENS DICIT',
        account: [
          'Printing was not new. In China whole pages had been cut into wooden blocks and printed since at least the 700s. The oldest printed book with a date on it is a Buddhist scroll of 868.',
          'Movable type was not new either. About 1040, the Chinese writer Shen Kuo tells us, a commoner named Bi Sheng made single characters out of baked clay, set them in an iron frame, printed from them, and used them again. In Korea, printers cast type in metal: a Buddhist book printed that way in 1377, known as the Jikji, still exists. It is seventy-eight years older than Gutenberg\'s Bible.',
          'So why is Gutenberg the famous one? Partly because of who wrote the history books. Partly because of the script. Chinese is written with thousands of different characters, so a printer needed an enormous set of type, and carving a whole page was often quicker. Latin needs about two dozen letters. With those the method was cheap, and it spread like fire.',
          'Nobody has found any sign that Gutenberg knew of the Chinese or Korean work. Nobody can prove he did not.',
        ],
        source: 'Shen Kuo, Dream Pool Essays, about 1088; the Jikji, now in the National Library of France and on UNESCO\'s Memory of the World register; the Diamond Sutra of 868, in the British Library.',
        questions: [
          {
            ask: 'Who first printed with movable type, as far as we know?',
            answers: ['Bi Sheng in China, about 1040, using baked clay', 'Johann Gutenberg in Mainz, about 1450', 'King William, for Domesday Book'],
            hint: 'Four hundred years and a continent away from Mainz.',
          },
          {
            ask: 'Why did movable type take off so much faster in Europe than in China?',
            answers: ['An alphabet needs only a few dozen different letters; Chinese needs thousands of characters', 'Europeans were cleverer', 'China had no paper'],
            hint: 'Count the letters you need to print this sentence. Then think of a script with a sign for every word.',
          },
        ],
      },
    ],
    weigh: {
      ask: 'So who invented printing?',
      answers: ['It depends what you mean: movable type came first in China and Korea; Gutenberg built the system that spread through Europe', 'Gutenberg, and nobody had thought of anything like it before', 'Nobody knows anything about it'],
      hint: 'A good answer says who did what, where and when, and admits what is not known.',
    },
    mattered: 'From here on, the past is written by many more hands, in many more copies, and it is much harder for one king, one church or one side to be the only voice. You have reached the end of the cloth, scribe. The next chapter was printed.',
  },
];
