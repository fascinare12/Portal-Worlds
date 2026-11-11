import type { PanelData } from './acts';

/**
 * Act 1: Rome's shadow. What the Roman empire was, how its western half
 * ended, what it left behind, how the Church took up what it dropped, and
 * the eastern half that carried on.
 *
 * Captions. Where a real line survives it is quoted in its own language:
 * Virgil, Jerome, the Rule of St Benedict, a papal title, and the Royal
 * Frankish Annals in Latin; two in Greek for the eastern empire. Checked
 * against the texts: Virgil (Project Gutenberg), the Rule and the Annals and
 * Einhard (The Latin Library), Jerome in translation (New Advent). Jerome's
 * Latin wording and the Greek of Procopius are given as commonly cited and
 * could not be opened in an edition from here.
 *
 * In every question the FIRST answer listed is the right one.
 */
export const ROME: PanelData[] = [
  {
    id: 'rome',
    caption: 'IMPERIUM SINE FINE DEDI',
    meaning: 'I have given them empire without end',
    quoted: 'Virgil, the Aeneid, book 1 (about 19 BC): the god Jupiter, promising Rome its future',
    title: 'An empire round a sea',
    date: 'Rome, about the year 117',
    tellings: [
      {
        account: [
          'At its greatest, around the year 117, the Roman empire ran from the north of Britain to Egypt and from Spain to Syria. The whole Mediterranean Sea lay inside it. The Romans called it simply "our sea".',
          'Across all of that there was one law, one coinage, and one army to keep the peace. Stone roads, tens of thousands of miles of them, tied the provinces to the capital. In the western half people did business in Latin; in the eastern half, in Greek.',
          'The Roman poet Virgil had the king of the gods promise that this would last for ever: "empire without end".',
        ],
        source: 'Virgil\'s Aeneid; the remains of the roads, towns and frontiers themselves.',
        questions: [
          {
            ask: 'What held so large an empire together?',
            answers: ['One law, one coinage, one army, and roads joining it all up', 'Everyone in it spoke the same language at home', 'It was all one small island'],
            hint: 'Think of what you would need in order to send an order, or a legion, from Rome to Britain.',
          },
          {
            ask: 'Which two languages did the empire do its business in?',
            answers: ['Latin in the west and Greek in the east', 'English in the west and French in the east', 'Latin everywhere, and nothing else'],
            hint: 'One half of the empire will matter again at the end of this act. It did not speak Latin.',
          },
        ],
      },
    ],
    mattered: 'For centuries afterwards, when people in Europe imagined what a proper government looked like, this is what they pictured. Every later king who called himself an emperor was borrowing Rome\'s name.',
  },
  {
    id: 'fall',
    caption: 'CAPITUR URBS QUAE TOTUM CEPIT ORBEM',
    meaning: 'The city that took the whole world is itself taken',
    quoted: 'Jerome, a letter written about 412, on hearing that Rome had been sacked',
    title: 'Did Rome fall?',
    date: 'The western empire, 410 to 476',
    tellings: [
      {
        voice: 'It fell',
        banner: 'ROMA CECIDIT',
        account: [
          'In 410 an army of Goths under their king Alaric broke into the city of Rome and plundered it for three days. No enemy had done that for eight hundred years.',
          'The scholar Jerome heard the news far away in Bethlehem. "My voice sticks in my throat," he wrote, "and, as I dictate, sobs choke my utterance. The City which had taken the whole world was itself taken."',
          'In 476 a general named Odoacer, a barbarian in Roman service, removed the last emperor in the west, a boy called Romulus, and did not bother to replace him. Archaeologists who dig in the centuries that follow find smaller houses, cruder pottery, fewer coins, and towns shrunk to a fraction of their size.',
        ],
        source: 'Jerome, Letter 127; the archaeology of western Europe in the 400s and 500s.',
        questions: [
          {
            ask: 'What happened in the year 410?',
            answers: ['A Gothic army broke into Rome and plundered it', 'Rome conquered the Goths', 'The empire moved to Britain'],
            hint: 'It is the news that made Jerome weep.',
          },
          {
            ask: 'What do archaeologists find in the west after Rome\'s government ended?',
            answers: ['Poorer buildings, cruder pottery and much smaller towns', 'Bigger cities and finer houses than before', 'No change at all'],
            hint: 'Things dug out of the ground cannot exaggerate. What do they show?',
          },
        ],
      },
      {
        voice: 'It changed',
        banner: 'ROMA MUTATA EST',
        account: [
          'Nobody at the time announced that the Roman empire had ended. Odoacer sent the emperor\'s crown and robes to the other emperor, in Constantinople, and said he would rule Italy in his name.',
          'The Gothic kings who followed kept Roman law for their Roman subjects, kept Roman officials to run things, struck coins that looked Roman, and wrote in Latin. The boy emperor was not killed. He was given a pension and sent to live in a villa by the sea.',
          'Many historians therefore prefer to say that the western empire was not destroyed so much as slowly turned into something else: a set of kingdoms that still thought of themselves as heirs of Rome.',
        ],
        source: 'The letters and laws of the Gothic kingdoms; modern historians of "late antiquity".',
        questions: [
          {
            ask: 'What did Odoacer do with the emperor\'s crown and robes?',
            answers: ['He sent them to the emperor in Constantinople', 'He put them on and called himself emperor', 'He threw them in the river'],
            hint: 'He did not claim the title. He passed it along.',
          },
          {
            ask: 'What did the new Gothic kings keep?',
            answers: ['Roman law, Roman officials, Roman-looking coins, and Latin', 'Nothing: they banned everything Roman', 'Only the gladiators'],
            hint: 'They wanted to look like the rulers people were used to.',
          },
        ],
      },
    ],
    weigh: {
      ask: '"It fell" and "it changed": how can both be said by serious historians?',
      answers: ['Each is looking at different evidence: the wreck of daily life on one hand, the survival of law, language and titles on the other', 'One side is simply lying', 'Nobody knows anything about the period'],
      hint: 'Ask what each side is measuring. Pots and houses? Or laws and names?',
    },
    mattered: 'Whether you call it a fall or a change, by the year 500 there was no emperor in the west, no single army, and no one government. Something had to fill the gap.',
  },
  {
    id: 'legacy',
    caption: 'HAEC ROMA RELIQUIT',
    meaning: 'These things Rome left behind',
    title: 'What Rome left behind',
    date: 'Western Europe, after 476',
    tellings: [
      {
        account: [
          'The government went, but a great deal stayed. The roads were still there, and people went on using them for a thousand years. London, Paris, Cologne and York all stand where Roman towns stood.',
          'Latin stayed too. Spoken by ordinary people in different regions, it drifted apart, century by century, into Italian, French, Spanish, Portuguese and Romanian. These are called the Romance languages: the languages of the Romans.',
          'Roman law was remembered, copied and studied. So were the Roman alphabet, which you are reading now, and the Roman calendar. July is named after Julius Caesar, and August after the emperor Augustus.',
        ],
        source: 'The map, the languages and the calendar of modern Europe.',
        questions: [
          {
            ask: 'Where did French, Spanish and Italian come from?',
            answers: ['From Latin, as spoken by ordinary people, drifting apart over centuries', 'From the language of the Goths', 'They were invented by kings'],
            hint: 'They are called "Romance" languages. Look at the first four letters.',
          },
          {
            ask: 'Which of these is a Roman survival that you use every day?',
            answers: ['The alphabet, and the names of the months', 'The numbers 0 to 9', 'Paper'],
            hint: 'Two of the months are named after two Roman rulers.',
          },
        ],
      },
    ],
    mattered: 'English is not a Romance language. But well over half of its words come from Latin, most of them by way of French. How that happened is the story of 1066.',
  },
  {
    id: 'church',
    caption: 'SERVUS SERVORUM DEI',
    meaning: 'Servant of the servants of God',
    quoted: 'The title Pope Gregory I used for himself in his letters, around 600',
    title: 'The Church steps in',
    date: 'Rome, 590 to 604',
    tellings: [
      {
        account: [
          'When Roman government failed in the west, one organisation was left that still had officials in every town, kept written records, and could read and write Latin: the Christian Church. Its bishops lived in the old Roman cities, and its districts followed the borders of the old Roman provinces.',
          'So bishops found themselves doing what governors had done. Gregory, who became Bishop of Rome, the Pope, in 590, organised grain to feed the city, paid soldiers, and bargained with the Lombard invaders at the gates.',
          'He also looked outward. In 597 he sent a monk named Augustine, with about forty companions, to convert the English. They landed in Kent and founded a church at Canterbury.',
        ],
        source: 'The letters of Pope Gregory I; Bede\'s Ecclesiastical History of the English People (731).',
        questions: [
          {
            ask: 'Why was the Church able to take over the work of government?',
            answers: ['It had officials in every town, kept records, and could read and write', 'It had the largest army', 'The emperor ordered it to'],
            hint: 'Running anything needs people in place, and writing.',
          },
          {
            ask: 'Whom did Pope Gregory send to England in 597?',
            answers: ['Augustine, a monk, to convert the English', 'A Roman legion, to reconquer it', 'Nobody: England was already Christian'],
            hint: 'He founded the church at Canterbury.',
          },
        ],
      },
    ],
    mattered: 'From now on, in the west, the Bishop of Rome is a power that kings must reckon with. Remember that when William asks a pope to bless his invasion.',
  },
  {
    id: 'monks',
    caption: 'OTIOSITAS INIMICA EST ANIMAE',
    meaning: 'Idleness is the enemy of the soul',
    quoted: 'The Rule of St Benedict, chapter 48 (about 530)',
    title: 'The keepers of books',
    date: 'Monte Cassino, Italy, about 530',
    tellings: [
      {
        account: [
          'About 530 an Italian named Benedict wrote a short book of rules for men living together as monks. A monk\'s day was to be divided between prayer, reading, and work with the hands.',
          'Part of that work was copying books. There was no printing: every book that existed had been written out by hand, and would rot unless someone wrote it out again. In monastery writing-rooms monks copied the Bible and the prayers they needed, and also the poets, historians and scientists of pagan Rome.',
          'Almost everything we can still read from ancient Rome survives because a monk, somewhere, copied it.',
        ],
        source: 'The Rule of St Benedict; the surviving manuscripts themselves.',
        questions: [
          {
            ask: 'According to Benedict\'s Rule, how should a monk spend his day?',
            answers: ['In prayer, reading, and work with his hands', 'In prayer only, never working', 'Travelling from town to town'],
            hint: 'The caption gives his view of doing nothing.',
          },
          {
            ask: 'Why does so much ancient Roman writing survive at all?',
            answers: ['Monks copied it out by hand, again and again', 'It was carved in stone', 'The Romans printed millions of copies'],
            hint: 'A book lasted only as long as someone was willing to write it out again.',
          },
        ],
      },
    ],
    mattered: 'Monasteries became the libraries, schools and record offices of western Europe. They also became rich, unguarded, and well known for it. That is why the Northmen will go for them first.',
  },
  {
    id: 'time',
    caption: 'HIC ECCLESIA TEMPUS METITUR',
    meaning: 'Here the Church measures time',
    title: 'The Church in every day',
    date: 'Any village in western Europe, 600 to 1000',
    tellings: [
      {
        account: [
          'For an ordinary villager, the Church was not far away in Rome. It was the one stone building in the village, and it shaped the whole of life.',
          'It measured time. The church bell told the hours. Sunday was the day of rest, and the saints\' days were the only days off: "holiday" is "holy day". The priest baptised you, married you and buried you. A tenth of everything you grew, the tithe, went to keep him and his church.',
          'Even the number of the year came from the Church. In 525 a monk named Dionysius proposed counting years from the birth of Jesus: Anno Domini, "in the year of the Lord". An English monk, Bede, used that system in his history two centuries later, and it spread from there.',
        ],
        source: 'Bede; parish records and Church law.',
        questions: [
          {
            ask: 'What was the tithe?',
            answers: ['A tenth of what you produced, given to support the Church', 'A tax paid to the Roman emperor', 'A kind of bell'],
            hint: 'The word is related to "tenth".',
          },
          {
            ask: 'Where does the word "holiday" come from?',
            answers: ['"Holy day": the saints\' days were the days off', 'A Roman word for the seaside', 'The name of a king'],
            hint: 'Say it slowly.',
          },
          {
            ask: 'What does "Anno Domini" mean, and who began counting years that way?',
            answers: ['"In the year of the Lord": a monk named Dionysius, in 525', '"After the Romans": the emperor Augustus', '"The old days": King Alfred'],
            hint: 'The next act but one is called Anno Domini MLXVI.',
          },
        ],
      },
    ],
    mattered: 'When this cloth says a thing happened "in 793" or "in 1066", it is using a way of counting that a monk invented and the Church spread.',
  },
  {
    id: 'charlemagne',
    caption: 'CAROLO AUGUSTO A DEO CORONATO MAGNO ET PACIFICO IMPERATORI ROMANORUM VITA ET VICTORIA',
    meaning: 'To Charles Augustus, crowned by God, great and peace-giving emperor of the Romans, life and victory!',
    quoted: 'The Royal Frankish Annals, under the year 801: what the people of Rome shouted',
    title: 'An emperor again',
    date: 'St Peter\'s, Rome, Christmas Day 800',
    tellings: [
      {
        voice: 'As the king\'s annals told it',
        banner: 'ANNALES DICUNT',
        account: [
          'By 800 the most powerful ruler in the west was Charles, King of the Franks, known as Charlemagne, "Charles the Great". He ruled most of what is now France, Germany and northern Italy.',
          'The official record kept at his court says that on Christmas Day 800, as he rose from prayer in St Peter\'s church in Rome, Pope Leo placed a crown on his head, and the whole Roman people shouted the words in the caption above.',
          'After more than three hundred years there was an "emperor of the Romans" in the west once more.',
        ],
        source: 'The Royal Frankish Annals, written at Charlemagne\'s own court.',
        questions: [
          {
            ask: 'What title was Charlemagne given on Christmas Day 800?',
            answers: ['Emperor of the Romans', 'King of England', 'Pope'],
            hint: 'It is in the caption, in Latin: IMPERATORI ROMANORUM.',
          },
          {
            ask: 'Who put the crown on his head?',
            answers: ['Pope Leo', 'Charlemagne himself', 'The emperor from Constantinople'],
            hint: 'It matters a great deal who does the crowning.',
          },
        ],
      },
      {
        voice: 'As his friend told it',
        banner: 'EINHARDUS DICIT',
        account: [
          'Einhard was a scholar who lived at Charlemagne\'s court and knew him well. He wrote the king\'s life after his death.',
          'Einhard says that Charlemagne disliked the title at first, and declared that he would never have gone into the church that day, great feast though it was, if he had known what the Pope was planning.',
          'Historians are not sure what to make of this. A king does not travel to Rome with his whole court by accident. But if the Pope crowns you, it looks as though the Pope gave you your crown, and could give it to someone else.',
        ],
        source: 'Einhard, The Life of Charles the Great, chapter 28 (written about 830).',
        questions: [
          {
            ask: 'According to Einhard, what did Charlemagne say about the crowning?',
            answers: ['That he would not have entered the church if he had known the Pope\'s plan', 'That he had planned it all himself', 'That he wanted to be Pope instead'],
            hint: 'In this telling, he is surprised, and not pleased.',
          },
          {
            ask: 'Why might a king dislike being crowned by a pope?',
            answers: ['It suggests his power comes from the Pope, who could take it away', 'Crowns were thought unlucky', 'Popes charged a fee'],
            hint: 'If someone hands you something, who did it belong to a moment before?',
          },
        ],
      },
    ],
    weigh: {
      ask: 'The annals make it a proud public moment. Einhard makes it a surprise. What should a careful reader notice?',
      answers: ['Both were written by people close to Charlemagne, and each tells it the way that suited the king at the time', 'Einhard must be right because he wrote later', 'The annals must be right because they are official'],
      hint: 'Neither writer was neutral. Ask what each version does for Charlemagne.',
    },
    mattered: 'For the next thousand years popes and emperors would quarrel over exactly this: who makes a ruler lawful, the man with the army or the man with the blessing? William of Normandy will want both.',
  },
  {
    id: 'byzantium',
    caption: 'ΒΑΣΙΛΕΙΑ ΡΩΜΑΙΩΝ',
    meaning: 'The Empire of the Romans',
    language: 'Greek',
    reads: 'Basileia Rhōmaiōn',
    quoted: 'The name the eastern empire used for itself, for as long as it lasted',
    title: 'The half that did not fall',
    date: 'Constantinople, 330 to 1453',
    tellings: [
      {
        account: [
          'Only the western half of the Roman empire came to an end in the 400s. The eastern half carried straight on.',
          'Its capital was Constantinople, the city the emperor Constantine had founded in 330 on the narrow strait between Europe and Asia. It was protected on the land side by enormous triple walls, and for most of a thousand years it was the largest and richest city in the Christian world.',
          'Its people spoke Greek, but they never called themselves Greeks, and never "Byzantines". That name was invented by a German scholar about a hundred years after their empire was gone. They called themselves Romans, and their state the Empire of the Romans, until the day the city was taken by the Ottoman Turks in 1453.',
        ],
        source: 'The empire\'s own laws, coins and histories.',
        questions: [
          {
            ask: 'What happened to the eastern half of the Roman empire in the 400s?',
            answers: ['It carried on, with its capital at Constantinople', 'It fell at the same time as the west', 'It moved to Rome'],
            hint: 'The title of this panel tells you.',
          },
          {
            ask: 'What did the people we call "Byzantines" call themselves?',
            answers: ['Romans', 'Byzantines', 'Turks'],
            hint: 'Read the caption. It is in Greek, and it says whose empire it is.',
          },
          {
            ask: 'Until when did this Roman empire last?',
            answers: ['1453, nearly a thousand years after the west', '476', '1066'],
            hint: 'It outlived everything else on this cloth.',
          },
        ],
      },
    ],
    mattered: 'So when someone says "Rome fell in 476", they are leaving out half of it. A Roman emperor was still reigning when William conquered England, and for almost four hundred years after.',
  },
  {
    id: 'justinian',
    caption: 'ΚΑΛΟΝ ΕΝΤΑΦΙΟΝ Η ΒΑΣΙΛΕΙΑ',
    meaning: 'Royalty is a fine thing to be buried in',
    language: 'Greek',
    reads: 'kalon entaphion hē basileia',
    quoted: 'The empress Theodora, refusing to flee the city, as reported by Procopius (History of the Wars, book 1)',
    title: 'Justinian, told twice',
    date: 'Constantinople, 527 to 565',
    tellings: [
      {
        voice: 'As Procopius wrote in public',
        banner: 'ΦΑΝΕΡΑ',
        account: [
          'The emperor Justinian reigned from 527 to 565. His court historian, Procopius, wrote long books praising what he did.',
          'Justinian had all of Roman law gathered, sorted and written down in one great collection. Centuries later that collection was rediscovered in the west and became the foundation of law in much of Europe. He built the church of Hagia Sophia, "Holy Wisdom", finished in 537, whose dome was the wonder of the world. And his armies won back Italy and North Africa.',
          'In 532 rioters nearly overthrew him. Procopius says the emperor was ready to run, until the empress Theodora stood up and said that she would stay: royalty, she said, is a fine thing to be buried in.',
        ],
        source: 'Procopius, History of the Wars and The Buildings, written under Justinian and meant to be read.',
        questions: [
          {
            ask: 'What did Justinian do with Roman law?',
            answers: ['Had it collected and written down in one great code', 'Abolished it', 'Translated it into English'],
            hint: 'It was the tidying-up of a thousand years of rules.',
          },
          {
            ask: 'Who, in Procopius\'s account, persuaded the emperor not to flee?',
            answers: ['The empress Theodora', 'The Pope', 'Procopius himself'],
            hint: 'Her words are the caption of this panel.',
          },
        ],
      },
      {
        voice: 'As Procopius wrote in secret',
        banner: 'ΑΝΕΚΔΟΤΑ',
        account: [
          'The same Procopius wrote another book, which he kept hidden while Justinian lived. It is known as the Secret History.',
          'In it the great emperor is a greedy, cruel fool, and the empress is worse. Procopius reports, apparently in earnest, that Justinian was really a demon. Servants, he says, had seen the emperor walking the palace at night with no head on his shoulders, and after a while the head came back.',
          'Both books are by one man, about one emperor. One was written to be read at court. The other was written to be read after everyone in it was dead.',
        ],
        source: 'Procopius, the Secret History (Anekdota, "unpublished things"), not made public in his lifetime.',
        questions: [
          {
            ask: 'What is the Secret History?',
            answers: ['A second book by Procopius, kept hidden, attacking the same emperor he praised in public', 'A book by Justinian about Procopius', 'A list of Roman laws'],
            hint: 'Same author, same emperor, a very different opinion.',
          },
          {
            ask: 'Why would Procopius write two such different accounts?',
            answers: ['One was safe to publish while the emperor lived; the other said what he dared not say openly', 'He forgot what he had written the first time', 'They are about two different emperors'],
            hint: 'Think about who would read the first book, and what could happen to its author.',
          },
        ],
      },
    ],
    weigh: {
      ask: 'One writer, two opposite accounts. What does that teach about any source written under a powerful ruler?',
      answers: ['Praise written where the ruler can read it may not be what the writer really thought', 'Whatever is written down must be true', 'Secret writings are always more accurate'],
      hint: 'The public book flatters. The secret one is full of spite, and a headless demon. Neither is simply "the truth".',
    },
    mattered: 'Justinian\'s code of law, his great church, and the idea of a Roman emperor all lasted. The Roman empire did not vanish in 476. Its western lands became the kingdoms of this cloth; its eastern half lived on for another thousand years.',
  },
];
