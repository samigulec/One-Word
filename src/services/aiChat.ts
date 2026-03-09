import { ChatMessage, ContentItem, FeedbackIntensity } from '../types';
import { LanguageCode } from '../utils/translations';

// ---- Yardimci tipler ----

interface QuickReply {
  id: string;
  text: string;
  emoji: string;
}

type ScenarioKey = 'cafe' | 'school' | 'travel' | 'shopping' | 'work' | 'friend';

// Kategori -> senaryo eslestirmesi
const CATEGORY_SCENARIOS: Record<string, ScenarioKey[]> = {
  greetings: ['cafe', 'school', 'work', 'friend'],
  food: ['cafe', 'shopping', 'friend'],
  travel: ['travel', 'shopping', 'friend'],
  emotions: ['friend', 'school', 'work'],
  nature: ['travel', 'friend', 'school'],
  technology: ['work', 'school', 'friend'],
  business: ['work', 'shopping', 'cafe'],
  health: ['friend', 'work', 'school'],
  education: ['school', 'work', 'friend'],
  daily: ['cafe', 'shopping', 'friend'],
  culture: ['travel', 'friend', 'cafe'],
  sports: ['friend', 'school', 'cafe'],
};

// Varsayilan senaryolar (kategori bulunamazsa)
const DEFAULT_SCENARIOS: ScenarioKey[] = ['cafe', 'friend', 'school'];

// ---- Dil bazli icerikler ----

/**
 * Kelimeye ozel ve senaryo bazli akilli quick reply'ler
 * Her dil icin 6 farkli quick reply: ornek, anlam, telaffuz, senaryo, cumle challenge, dialog
 */
const quickReplyTemplates: Record<LanguageCode, {
  example: string;
  meaning: string;
  pronunciation: string;
  scenario: (scenario: string) => string;
  sentenceChallenge: string;
  dialog: string;
}> = {
  en: {
    example: 'Show me an example',
    meaning: 'What does it mean?',
    pronunciation: 'How to pronounce?',
    scenario: (s) => `Use it ${s}`,
    sentenceChallenge: 'Challenge me!',
    dialog: 'Start a dialog',
  },
  tr: {
    example: 'Ornek cumle ver',
    meaning: 'Turkce anlami ne?',
    pronunciation: 'Telaffuzu nasil?',
    scenario: (s) => `${s} nasil kullanirim?`,
    sentenceChallenge: 'Beni sinav!',
    dialog: 'Dialog baslat',
  },
  es: {
    example: 'Dame un ejemplo',
    meaning: 'Que significa?',
    pronunciation: 'Como se pronuncia?',
    scenario: (s) => `Usarlo ${s}`,
    sentenceChallenge: 'Desafiame!',
    dialog: 'Iniciar dialogo',
  },
  de: {
    example: 'Gib mir ein Beispiel',
    meaning: 'Was bedeutet das?',
    pronunciation: 'Wie spricht man das aus?',
    scenario: (s) => `Verwende es ${s}`,
    sentenceChallenge: 'Fordere mich heraus!',
    dialog: 'Dialog starten',
  },
  fr: {
    example: 'Donne-moi un exemple',
    meaning: 'Qu\'est-ce que ca veut dire?',
    pronunciation: 'Comment ca se prononce?',
    scenario: (s) => `L\'utiliser ${s}`,
    sentenceChallenge: 'Mets-moi au defi!',
    dialog: 'Commencer un dialogue',
  },
  pt: {
    example: 'Me de um exemplo',
    meaning: 'O que significa?',
    pronunciation: 'Como se pronuncia?',
    scenario: (s) => `Usar ${s}`,
    sentenceChallenge: 'Me desafie!',
    dialog: 'Iniciar dialogo',
  },
  it: {
    example: 'Dammi un esempio',
    meaning: 'Cosa significa?',
    pronunciation: 'Come si pronuncia?',
    scenario: (s) => `Usarlo ${s}`,
    sentenceChallenge: 'Sfidami!',
    dialog: 'Inizia un dialogo',
  },
  ru: {
    example: 'Daj primer',
    meaning: 'Chto eto znachit?',
    pronunciation: 'Kak proiznositsya?',
    scenario: (s) => `Ispol'zovat' ${s}`,
    sentenceChallenge: 'Brosi mne vyzov!',
    dialog: 'Nachat\' dialog',
  },
  ja: {
    example: 'Reibun wo kudasai',
    meaning: 'Dou iu imi?',
    pronunciation: 'Hatsuon wa?',
    scenario: (s) => `${s} de tsukau`,
    sentenceChallenge: 'Charenji!',
    dialog: 'Daiarogu kaishi',
  },
  ko: {
    example: 'Yemun juseyo',
    meaning: 'Museun tteus-ieyo?',
    pronunciation: 'Barium-i eottaeyo?',
    scenario: (s) => `${s} eseo sayong`,
    sentenceChallenge: 'Dojeon!',
    dialog: 'Daehwa sijak',
  },
  zh: {
    example: 'Gei ge lizi',
    meaning: 'Shenme yisi?',
    pronunciation: 'Zenme fayin?',
    scenario: (s) => `Zai ${s} shiyong`,
    sentenceChallenge: 'Tiaozhan wo!',
    dialog: 'Kaishi duihua',
  },
};

// Senaryo isimleri (her dil icin)
const scenarioNames: Record<LanguageCode, Record<ScenarioKey, string>> = {
  en: { cafe: 'at a cafe', school: 'at school', travel: 'while traveling', shopping: 'while shopping', work: 'at work', friend: 'with friends' },
  tr: { cafe: 'Kafede', school: 'Okulda', travel: 'Seyahatte', shopping: 'Alisveriste', work: 'Iste', friend: 'Arkadaslarla' },
  es: { cafe: 'en un cafe', school: 'en la escuela', travel: 'viajando', shopping: 'comprando', work: 'en el trabajo', friend: 'con amigos' },
  de: { cafe: 'im Cafe', school: 'in der Schule', travel: 'auf Reisen', shopping: 'beim Einkaufen', work: 'bei der Arbeit', friend: 'mit Freunden' },
  fr: { cafe: 'au cafe', school: 'a l\'ecole', travel: 'en voyage', shopping: 'en faisant du shopping', work: 'au travail', friend: 'avec des amis' },
  pt: { cafe: 'no cafe', school: 'na escola', travel: 'viajando', shopping: 'fazendo compras', work: 'no trabalho', friend: 'com amigos' },
  it: { cafe: 'al caffe', school: 'a scuola', travel: 'in viaggio', shopping: 'facendo shopping', work: 'al lavoro', friend: 'con amici' },
  ru: { cafe: 'v kafe', school: 'v shkole', travel: 'v puteshestvii', shopping: 'na pokupkah', work: 'na rabote', friend: 's druz\'yami' },
  ja: { cafe: 'kafe', school: 'gakkou', travel: 'ryokou', shopping: 'kaimono', work: 'shigoto', friend: 'tomodachi' },
  ko: { cafe: 'kape', school: 'hakgyo', travel: 'yeohaeng', shopping: 'syoping', work: 'jikjang', friend: 'chingu' },
  zh: { cafe: 'kafei dian', school: 'xuexiao', travel: 'lvxing', shopping: 'gouwu', work: 'gongzuo', friend: 'pengyou' },
};

// Senaryo emoji'leri
const scenarioEmojis: Record<ScenarioKey, string> = {
  cafe: '\u2615',
  school: '\u{1F393}',
  travel: '\u2708\uFE0F',
  shopping: '\u{1F6CD}\uFE0F',
  work: '\u{1F4BC}',
  friend: '\u{1F46B}',
};

/**
 * Selamlama sablonlari - her dil icin
 */
const greetingTemplates: Record<LanguageCode, (word: ContentItem, meaning: string, targetLang: string) => string> = {
  en: (word, meaning, _targetLang) =>
    `Hey there! \u{1F916} I'm Lingo, your language practice buddy!\n\nToday's word is: "${word.target_word}" ${word.emoji || ''}\nIt means: ${meaning}\n\nHere's how it's used: "${word.example_sentence}"\n\nTry using "${word.target_word}" in a sentence - I'll help you along the way!`,
  tr: (word, meaning, _targetLang) =>
    `Selam! \u{1F916} Ben Lingo, senin dil pratik arkadasin!\n\nBugunku kelimemiz: "${word.target_word}" ${word.emoji || ''}\nAnlami: ${meaning}\n\nOrnek kullanim: "${word.example_sentence}"\n\nHaydi, "${word.target_word}" kelimesini bir cumlede kullanmayi dene - sana yardimci olacagim!`,
  es: (word, meaning, _targetLang) =>
    `Hola! \u{1F916} Soy Lingo, tu companero de practica!\n\nLa palabra de hoy es: "${word.target_word}" ${word.emoji || ''}\nSignifica: ${meaning}\n\nEjemplo: "${word.example_sentence}"\n\nIntenta usar "${word.target_word}" en una oracion - te ayudare!`,
  de: (word, meaning, _targetLang) =>
    `Hallo! \u{1F916} Ich bin Lingo, dein Sprachpartner!\n\nDas heutige Wort ist: "${word.target_word}" ${word.emoji || ''}\nBedeutung: ${meaning}\n\nBeispiel: "${word.example_sentence}"\n\nVersuch "${word.target_word}" in einem Satz zu verwenden - ich helfe dir dabei!`,
  fr: (word, meaning, _targetLang) =>
    `Salut! \u{1F916} Je suis Lingo, ton partenaire de pratique!\n\nLe mot du jour: "${word.target_word}" ${word.emoji || ''}\nSignification: ${meaning}\n\nExemple: "${word.example_sentence}"\n\nEssaie d'utiliser "${word.target_word}" dans une phrase - je t'aiderai!`,
  pt: (word, meaning, _targetLang) =>
    `Oi! \u{1F916} Eu sou o Lingo, seu parceiro de pratica!\n\nA palavra de hoje e: "${word.target_word}" ${word.emoji || ''}\nSignificado: ${meaning}\n\nExemplo: "${word.example_sentence}"\n\nTente usar "${word.target_word}" em uma frase - eu te ajudo!`,
  it: (word, meaning, _targetLang) =>
    `Ciao! \u{1F916} Sono Lingo, il tuo compagno di pratica!\n\nLa parola di oggi e: "${word.target_word}" ${word.emoji || ''}\nSignificato: ${meaning}\n\nEsempio: "${word.example_sentence}"\n\nProva a usare "${word.target_word}" in una frase - ti aiutero!`,
  ru: (word, meaning, _targetLang) =>
    `Privet! \u{1F916} Ya Lingo, tvoj partner dlya praktiki!\n\nSlovo dnya: "${word.target_word}" ${word.emoji || ''}\nZnachenie: ${meaning}\n\nPrimer: "${word.example_sentence}"\n\nPoprobuj ispol'zovat' "${word.target_word}" v predlozhenii - ya pomogul!`,
  ja: (word, meaning, _targetLang) =>
    `Yaa! \u{1F916} Boku wa Lingo, kimi no renshuu paatonaa da yo!\n\nKyou no kotoba wa: "${word.target_word}" ${word.emoji || ''}\nImi: ${meaning}\n\nReibun: "${word.example_sentence}"\n\n"${word.target_word}" wo tsukatte bun wo tsukutte mite! Tetsudau yo!`,
  ko: (word, meaning, _targetLang) =>
    `Annyeong! \u{1F916} Na-neun Lingo, neo-ui yeonseub chingu-ya!\n\nOneul-ui daneo: "${word.target_word}" ${word.emoji || ''}\nUimi: ${meaning}\n\nYemun: "${word.example_sentence}"\n\n"${word.target_word}" reul sayonghae seo munjang-eul mandeul-eo bwa! Dowajulge!`,
  zh: (word, meaning, _targetLang) =>
    `Hai! \u{1F916} Wo shi Lingo, ni de lianxi huoban!\n\nJintian de danci shi: "${word.target_word}" ${word.emoji || ''}\nYisi: ${meaning}\n\nLiju: "${word.example_sentence}"\n\nShishi yong "${word.target_word}" zaoju ba - wo hui bangzhu ni de!`,
};

// ---- Senaryo bazli yanit sablonlari ----

const scenarioResponses: Record<LanguageCode, {
  prompt: (word: ContentItem, scenario: string) => string;
  dialogStart: (word: ContentItem, scenario: string) => string;
  sentenceChallenge: (word: ContentItem) => string;
  sentenceSuccess: (word: ContentItem) => string[];
  sentenceMiss: (word: ContentItem) => string;
}> = {
  en: {
    prompt: (word, scenario) =>
      `Let's pretend we're ${scenario}! How would you use "${word.target_word}" in that situation?\n\nFor example: "${word.example_sentence}"\n\nYour turn - give it a shot!`,
    dialogStart: (word, scenario) =>
      `Let's practice a mini dialog! Imagine we're ${scenario}.\n\nMe: Hi! Do you know what "${word.target_word}" means?\n\nNow you respond! Try to use "${word.target_word}" in your reply.`,
    sentenceChallenge: (word) =>
      `Challenge time! Write a sentence using "${word.target_word}". I'll check if you used it correctly!\n\nHint: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Excellent! You used "${word.target_word}" perfectly! That sentence sounds very natural. Want to try another scenario?`,
      `Great job! Your sentence with "${word.target_word}" is spot on! You're really getting the hang of it. Try another one?`,
      `Perfect! You nailed it! "${word.target_word}" fits perfectly in your sentence. Shall we try a different context?`,
      `Amazing work! You clearly understand how to use "${word.target_word}". Ready for more practice?`,
    ],
    sentenceMiss: (word) =>
      `Good try! But I didn't see "${word.target_word}" in your sentence. Try again and make sure to include "${word.target_word}".\n\nHint: "${word.example_sentence}"`,
  },
  tr: {
    prompt: (word, scenario) =>
      `${scenario} oldugumuzu hayal edelim! "${word.target_word}" kelimesini bu durumda nasil kullanirdin?\n\nOrnegin: "${word.example_sentence}"\n\nHadi, senin siran - bir dene bakalim!`,
    dialogStart: (word, scenario) =>
      `Haydi mini bir diyalog pratiği yapalim! ${scenario} oldugumuzu dusun.\n\nBen: Selam! "${word.target_word}" ne demek biliyor musun?\n\nSimdi sen cevap ver! "${word.target_word}" kelimesini cevabinda kullanmayi dene.`,
    sentenceChallenge: (word) =>
      `Sinav zamani! "${word.target_word}" kelimesini kullanarak bir cumle kur. Dogru kullanip kullanmadigini kontrol edecegim!\n\nIpucu: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Mukemmel! "${word.target_word}" kelimesini harika kullandin! Cumlen cok dogal olmus. Baska bir senaryo denemek ister misin?`,
      `Harika! "${word.target_word}" ile kurdugu cumle tam isabetle! Gercekten gelisiyorsun. Bir tane daha?`,
      `Super! "${word.target_word}" cumlende tam yerine oturmus. Farkli bir baglamda denemek ister misin?`,
      `Bravo! "${word.target_word}" kelimesini nasil kullanacagini acikca anlamissin. Daha fazla pratik?`,
    ],
    sentenceMiss: (word) =>
      `Iyi deneme! Ama cumlende "${word.target_word}" kelimesini goremedim. Tekrar dene ve "${word.target_word}" kelimesini eklemeyi unutma.\n\nIpucu: "${word.example_sentence}"`,
  },
  es: {
    prompt: (word, scenario) =>
      `Imaginemos que estamos ${scenario}! Como usarias "${word.target_word}" en esa situacion?\n\nPor ejemplo: "${word.example_sentence}"\n\nVenga, intentalo!`,
    dialogStart: (word, scenario) =>
      `Practiquemos un mini dialogo! Imagina que estamos ${scenario}.\n\nYo: Hola! Sabes que significa "${word.target_word}"?\n\nAhora responde tu! Intenta usar "${word.target_word}" en tu respuesta.`,
    sentenceChallenge: (word) =>
      `Es hora del desafio! Escribe una oracion usando "${word.target_word}". Voy a verificar si lo usaste correctamente!\n\nPista: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Excelente! Usaste "${word.target_word}" perfectamente! Tu oracion suena muy natural.`,
      `Genial! Tu oracion con "${word.target_word}" esta perfecta!`,
      `Perfecto! "${word.target_word}" encaja perfectamente en tu oracion.`,
    ],
    sentenceMiss: (word) =>
      `Buen intento! Pero no vi "${word.target_word}" en tu oracion. Intentalo de nuevo.\n\nPista: "${word.example_sentence}"`,
  },
  de: {
    prompt: (word, scenario) =>
      `Stell dir vor, wir sind ${scenario}! Wie wuerdest du "${word.target_word}" hier verwenden?\n\nZum Beispiel: "${word.example_sentence}"\n\nLos, probier es aus!`,
    dialogStart: (word, scenario) =>
      `Lass uns einen Mini-Dialog ueben! Stell dir vor, wir sind ${scenario}.\n\nIch: Hallo! Weisst du, was "${word.target_word}" bedeutet?\n\nJetzt antworte du!`,
    sentenceChallenge: (word) =>
      `Herausforderung! Schreibe einen Satz mit "${word.target_word}". Ich pruefe, ob du es richtig verwendet hast!\n\nHinweis: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Ausgezeichnet! Du hast "${word.target_word}" perfekt verwendet!`,
      `Super! Dein Satz mit "${word.target_word}" ist grossartig!`,
      `Perfekt! "${word.target_word}" passt perfekt in deinen Satz.`,
    ],
    sentenceMiss: (word) =>
      `Guter Versuch! Aber ich habe "${word.target_word}" nicht in deinem Satz gesehen. Versuche es nochmal.\n\nHinweis: "${word.example_sentence}"`,
  },
  fr: {
    prompt: (word, scenario) =>
      `Imagine que tu es ${scenario}. Comment utiliserais-tu "${word.target_word}" dans cette situation?\n\nPar exemple: "${word.example_sentence}"\n\nA toi de jouer!`,
    dialogStart: (word, scenario) =>
      `Pratiquons un mini dialogue! Imagine que nous sommes ${scenario}.\n\nMoi: Salut! Tu sais ce que signifie "${word.target_word}"?\n\nMaintenant, reponds!`,
    sentenceChallenge: (word) =>
      `Defi! Ecris une phrase avec "${word.target_word}". Je verifierai si tu l'as bien utilise!\n\nIndice: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Excellent! Tu as utilise "${word.target_word}" parfaitement!`,
      `Genial! Ta phrase avec "${word.target_word}" est parfaite!`,
      `Parfait! "${word.target_word}" s'integre parfaitement dans ta phrase.`,
    ],
    sentenceMiss: (word) =>
      `Bon essai! Mais je n'ai pas vu "${word.target_word}" dans ta phrase. Reessaie.\n\nIndice: "${word.example_sentence}"`,
  },
  pt: {
    prompt: (word, scenario) =>
      `Imagine que voce esta ${scenario}. Como usaria "${word.target_word}" nessa situacao?\n\nPor exemplo: "${word.example_sentence}"\n\nAgora e sua vez!`,
    dialogStart: (word, scenario) =>
      `Vamos praticar um mini dialogo! Imagine que estamos ${scenario}.\n\nEu: Oi! Voce sabe o que significa "${word.target_word}"?\n\nAgora responda!`,
    sentenceChallenge: (word) =>
      `Hora do desafio! Escreva uma frase usando "${word.target_word}".\n\nDica: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Excelente! Voce usou "${word.target_word}" perfeitamente!`,
      `Otimo! Sua frase com "${word.target_word}" esta perfeita!`,
    ],
    sentenceMiss: (word) =>
      `Boa tentativa! Mas nao vi "${word.target_word}" na sua frase. Tente novamente.\n\nDica: "${word.example_sentence}"`,
  },
  it: {
    prompt: (word, scenario) =>
      `Immagina di essere ${scenario}. Come useresti "${word.target_word}" in questa situazione?\n\nPer esempio: "${word.example_sentence}"\n\nOra tocca a te!`,
    dialogStart: (word, scenario) =>
      `Pratichiamo un mini dialogo! Immagina che siamo ${scenario}.\n\nIo: Ciao! Sai cosa significa "${word.target_word}"?\n\nOra rispondi tu!`,
    sentenceChallenge: (word) =>
      `Sfida! Scrivi una frase usando "${word.target_word}".\n\nSuggerimento: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Eccellente! Hai usato "${word.target_word}" perfettamente!`,
      `Fantastico! La tua frase con "${word.target_word}" e perfetta!`,
    ],
    sentenceMiss: (word) =>
      `Bel tentativo! Ma non ho visto "${word.target_word}" nella tua frase. Riprova.\n\nSuggerimento: "${word.example_sentence}"`,
  },
  ru: {
    prompt: (word, scenario) =>
      `Predstav', chto ty ${scenario}. Kak by ty ispol'zoval "${word.target_word}" v etoj situacii?\n\nNaprimer: "${word.example_sentence}"\n\nTeper' tvoya ochered'!`,
    dialogStart: (word, scenario) =>
      `Davaj popraktiruem mini-dialog! Predstav', chto my ${scenario}.\n\nYa: Privet! Ty znaesh', chto znachit "${word.target_word}"?\n\nTeper' otvechaj ty!`,
    sentenceChallenge: (word) =>
      `Vyzov! Napishi predlozhenie s "${word.target_word}".\n\nPodskazka: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Otlichno! Ty ideal'no ispol'zoval "${word.target_word}"!`,
      `Super! Tvoyo predlozhenie s "${word.target_word}" ideol'no!`,
    ],
    sentenceMiss: (word) =>
      `Horoshaya popytka! No ya ne uvidel "${word.target_word}" v tvoyem predlozhenii. Poprobuj snova.\n\nPodskazka: "${word.example_sentence}"`,
  },
  ja: {
    prompt: (word, scenario) =>
      `${scenario} ni iru to souzou shite kudasai. "${word.target_word}" wo dou tsukaimasu ka?\n\nRei: "${word.example_sentence}"\n\nAnata no ban desu!`,
    dialogStart: (word, scenario) =>
      `Mini daiarogu wo renshuu shimashou! ${scenario} ni iru to souzou shite.\n\nWatashi: Konnichiwa! "${word.target_word}" no imi wo shitte imasu ka?\n\nKotaete kudasai!`,
    sentenceChallenge: (word) =>
      `Charenji! "${word.target_word}" wo tsukatte bun wo kaite kudasai.\n\nHinto: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Subarashii! "${word.target_word}" wo kanpeki ni tsukaimashita!`,
      `Sugoi! "${word.target_word}" no bun ga kanpeki desu!`,
    ],
    sentenceMiss: (word) =>
      `Ii chousen desu! Demo "${word.target_word}" ga bun ni arimasen. Mou ichido yatte mimashou.\n\nHinto: "${word.example_sentence}"`,
  },
  ko: {
    prompt: (word, scenario) =>
      `${scenario} e issda go sangsang haeyo. "${word.target_word}" reul eotteohge sayonghalgga yo?\n\nYe: "${word.example_sentence}"\n\nDangshin chaelye!`,
    dialogStart: (word, scenario) =>
      `Mini daehwa reul yeonseup haebwayo! ${scenario} e issda go sangsang haeyo.\n\nJeo: Annyeong! "${word.target_word}" ui uimi reul arayo?\n\nDaedap haeyo!`,
    sentenceChallenge: (word) =>
      `Dojeon! "${word.target_word}" reul sayonghae seo munjang eul sseo boseyo.\n\nHinteu: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Hullyunghaevo! "${word.target_word}" reul wanbyeokage sayong haesseoyo!`,
      `Jal haesseoyo! "${word.target_word}" munjang i wanbyeok haeyo!`,
    ],
    sentenceMiss: (word) =>
      `Joeun sido! Hajiman "${word.target_word}" ga munjang e eopseoyo. Dasi haeyo.\n\nHinteu: "${word.example_sentence}"`,
  },
  zh: {
    prompt: (word, scenario) =>
      `Jiashe ni zai ${scenario}. Ni hui zenme shiyong "${word.target_word}"?\n\nLiru: "${word.example_sentence}"\n\nXianzai lun dao ni le!`,
    dialogStart: (word, scenario) =>
      `Women lai lianxi yi ge xiao duihua! Jiashe women zai ${scenario}.\n\nWo: Ni hao! Ni zhidao "${word.target_word}" shenme yisi ma?\n\nXianzai ni huida!`,
    sentenceChallenge: (word) =>
      `Tiaozhan! Yong "${word.target_word}" xie yi ge juzi.\n\nTishi: ${word.example_sentence.substring(0, Math.min(30, word.example_sentence.length))}...`,
    sentenceSuccess: (word) => [
      `Feichang hao! Ni wanmei de shiyong le "${word.target_word}"!`,
      `Tai bang le! Ni de "${word.target_word}" juzi hen wanmei!`,
    ],
    sentenceMiss: (word) =>
      `Hen hao de changshi! Dan wo meiyou kandao "${word.target_word}". Zai shi yi ci.\n\nTishi: "${word.example_sentence}"`,
  },
};

// ---- Genel yanit sablonlari (genisletilmis) ----

const responseTemplates: Record<LanguageCode, {
  exampleRequest: (word: ContentItem) => string;
  meaningRequest: (word: ContentItem, meaning: string) => string;
  pronunciationRequest: (word: ContentItem) => string;
  correctUsage: string[];
  encouragement: (word: ContentItem) => string[];
  shortMessage: (word: ContentItem) => string;
  conversationContinue: (word: ContentItem) => string[];
}> = {
  en: {
    exampleRequest: (word) => `Sure! Here's an example with "${word.target_word}":\n\n"${word.example_sentence}"\n\nNow try writing your own sentence! Or tap "Challenge me!" for a test.`,
    meaningRequest: (word, meaning) => `"${word.target_word}" means:\n\n${meaning}\n\nYou can use this word in everyday conversation! Want to try making a sentence?`,
    pronunciationRequest: (word) => `"${word.target_word}" is pronounced:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nRepeat it slowly and try using it in a sentence!`,
    correctUsage: [
      'Great job! You used the word correctly! Your sentence is excellent. Want to try a different scenario?',
      'Perfect! You used the word in the right context. Your language skills are improving!',
      'Well done! That sentence sounds very natural. Can you write one more in a different context?',
      'Bravo! You used it perfectly. How about trying it in a dialog scenario?',
      'Impressive! That\'s exactly how a native speaker would say it. Ready for another challenge?',
    ],
    encouragement: (word) => [
      `Keep going! Try adding "${word.target_word}" to your sentence.`,
      `Good effort! Try using this word in a daily situation.`,
      `Great try! Tell me about a situation where you could use "${word.target_word}".`,
      `Nice start! Imagine you're at a cafe - how would you use "${word.target_word}"?`,
      `Good thinking! Can you try making a longer sentence with "${word.target_word}"?`,
    ],
    shortMessage: (word) => `Try writing a longer sentence! Use "${word.target_word}" in a sentence. Or tap a button below for help!`,
    conversationContinue: (word) => [
      `That's interesting! Can you think of another way to use "${word.target_word}"?`,
      `Good point! Now try using "${word.target_word}" in a completely different context.`,
      `I see what you mean! How about using "${word.target_word}" to describe something you did today?`,
    ],
  },
  tr: {
    exampleRequest: (word) => `Tabii! Iste "${word.target_word}" ile bir ornek cumle:\n\n"${word.example_sentence}"\n\nSimdi sen de kendi cumleni yazmaya dene! Ya da "Beni sinav!" butonuna bas.`,
    meaningRequest: (word, meaning) => `"${word.target_word}" kelimesinin Turkce karsiligi:\n\n${meaning}\n\nBu kelimeyi gunluk konusmada sikca kullanabilirsin! Bir cumle kurmaya dener misin?`,
    pronunciationRequest: (word) => `"${word.target_word}" soyle telaffuz edilir:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nYavasca tekrar et ve cumle icinde kullanmayi dene!`,
    correctUsage: [
      'Harika! Kelimeyi dogru kullandin! Cumlen cok guzel olmus. Baska bir senaryo denemek ister misin?',
      'Mukemmel! Kelimeyi tam yerinde kullandin. Dil becerilerin gelisiyor!',
      'Cok iyi! Bu cumle cok dogal olmus. Farkli bir baglamda bir tane daha yazar misin?',
      'Bravo! Kelimeyi harika kullanmissin. Bir dialog denemek ister misin?',
      'Etkileyici! Tam bir ana dili konusan gibi soyledin. Baska bir meydan okumaya hazir misin?',
    ],
    encouragement: (word) => [
      `Iyi gidiyorsun! "${word.target_word}" kelimesini cumlenin icine eklemeyi dene.`,
      `Devam et! Bu kelimeyi gunluk bir durumu anlatirken kullanabilirsin.`,
      `Harika caba! "${word.target_word}" kelimesini kullanarak kendi deneyiminden bir ornek ver.`,
      `Guzel baslangic! Bir kafede oldugumuzu hayal et - "${word.target_word}" kelimesini nasil kullanirdin?`,
      `Iyi dusunce! "${word.target_word}" ile daha uzun bir cumle kurmaya dener misin?`,
    ],
    shortMessage: (word) => `Daha uzun bir cumle kurmayi dene! "${word.target_word}" kelimesini kullanarak bir cumle yaz. Ya da asagidaki butonlari kullan!`,
    conversationContinue: (word) => [
      `Ilginc! "${word.target_word}" kelimesini baska bir sekilde kullanmayi dusunebilir misin?`,
      `Guzel bir nokta! Simdi "${word.target_word}" kelimesini tamamen farkli bir baglamda kullanmayi dene.`,
      `Anliyorum! Bugun yaptigin bir seyi "${word.target_word}" ile anlatir misin?`,
    ],
  },
  es: {
    exampleRequest: (word) => `Claro! Aqui hay un ejemplo con "${word.target_word}":\n\n"${word.example_sentence}"\n\nAhora intenta escribir tu propia oracion!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" significa:\n\n${meaning}\n\nPuedes usar esta palabra en conversaciones diarias!`,
    pronunciationRequest: (word) => `"${word.target_word}" se pronuncia:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nRepitelo despacio e intenta usarlo en una oracion!`,
    correctUsage: [
      'Genial! Usaste la palabra correctamente! Tu oracion es excelente.',
      'Perfecto! Usaste la palabra en el contexto correcto.',
      'Muy bien! Esa oracion suena muy natural.',
      'Bravo! Lo usaste perfectamente.',
    ],
    encouragement: (word) => [
      `Sigue adelante! Intenta agregar "${word.target_word}" a tu oracion.`,
      `Buen esfuerzo! Intenta usar esta palabra en una situacion diaria.`,
      `Gran intento! Cuentame una situacion donde podrias usar "${word.target_word}".`,
    ],
    shortMessage: (word) => `Intenta escribir una oracion mas larga! Usa "${word.target_word}" en una oracion.`,
    conversationContinue: (word) => [
      `Interesante! Puedes pensar en otra forma de usar "${word.target_word}"?`,
      `Buen punto! Ahora intenta usar "${word.target_word}" en un contexto diferente.`,
    ],
  },
  de: {
    exampleRequest: (word) => `Klar! Hier ist ein Beispiel mit "${word.target_word}":\n\n"${word.example_sentence}"\n\nJetzt versuch deinen eigenen Satz zu schreiben!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" bedeutet:\n\n${meaning}\n\nDu kannst dieses Wort in alltaeglichen Gespraechen verwenden!`,
    pronunciationRequest: (word) => `"${word.target_word}" wird so ausgesprochen:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nWiederhole es langsam und versuche es in einem Satz zu benutzen!`,
    correctUsage: [
      'Super! Du hast das Wort richtig verwendet! Dein Satz ist ausgezeichnet.',
      'Perfekt! Du hast das Wort im richtigen Kontext verwendet.',
      'Sehr gut! Der Satz klingt sehr natuerlich.',
      'Bravo! Du hast es perfekt verwendet.',
    ],
    encouragement: (word) => [
      `Weiter so! Versuche "${word.target_word}" in deinen Satz einzubauen.`,
      `Gute Bemuehung! Versuche dieses Wort in einer Alltagssituation zu verwenden.`,
      `Guter Versuch! Erzaehl mir von einer Situation, in der du "${word.target_word}" verwenden koenntest.`,
    ],
    shortMessage: (word) => `Versuche einen laengeren Satz zu schreiben! Benutze "${word.target_word}" in einem Satz.`,
    conversationContinue: (word) => [
      `Interessant! Kannst du dir eine andere Art vorstellen "${word.target_word}" zu verwenden?`,
      `Guter Punkt! Versuche jetzt "${word.target_word}" in einem anderen Kontext zu verwenden.`,
    ],
  },
  fr: {
    exampleRequest: (word) => `Bien sur! Voici un exemple avec "${word.target_word}":\n\n"${word.example_sentence}"\n\nMaintenant essaie d'ecrire ta propre phrase!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" signifie:\n\n${meaning}\n\nTu peux utiliser ce mot dans les conversations quotidiennes!`,
    pronunciationRequest: (word) => `"${word.target_word}" se prononce:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nRepete-le lentement et essaie de l'utiliser dans une phrase!`,
    correctUsage: [
      'Genial! Tu as utilise le mot correctement! Ta phrase est excellente.',
      'Parfait! Tu as utilise le mot dans le bon contexte.',
      'Tres bien! Cette phrase sonne tres naturelle.',
      'Bravo! Tu l\'as utilise parfaitement.',
    ],
    encouragement: (word) => [
      `Continue! Essaie d'ajouter "${word.target_word}" a ta phrase.`,
      `Bon effort! Essaie d'utiliser ce mot dans une situation quotidienne.`,
      `Bel essai! Parle-moi d'une situation ou tu pourrais utiliser "${word.target_word}".`,
    ],
    shortMessage: (word) => `Essaie d'ecrire une phrase plus longue! Utilise "${word.target_word}" dans une phrase.`,
    conversationContinue: (word) => [
      `Interessant! Peux-tu penser a une autre facon d'utiliser "${word.target_word}"?`,
      `Bon point! Maintenant essaie d'utiliser "${word.target_word}" dans un contexte different.`,
    ],
  },
  pt: {
    exampleRequest: (word) => `Claro! Aqui esta outro exemplo com "${word.target_word}":\n\n"${word.example_sentence}"\n\nAgora tente escrever sua propria frase!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" significa:\n\n${meaning}\n\nVoce pode usar esta palavra em conversas do dia a dia!`,
    pronunciationRequest: (word) => `"${word.target_word}" e pronunciado:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nRepita devagar e tente usar em uma frase!`,
    correctUsage: [
      'Otimo! Voce usou a palavra corretamente!',
      'Perfeito! Voce usou a palavra no contexto certo.',
      'Muito bem! Essa frase soa muito natural.',
    ],
    encouragement: (word) => [
      `Continue! Tente adicionar "${word.target_word}" a sua frase.`,
      `Bom esforco! Tente usar esta palavra em uma situacao do dia a dia.`,
    ],
    shortMessage: (word) => `Tente escrever uma frase mais longa! Use "${word.target_word}" em uma frase.`,
    conversationContinue: (word) => [
      `Interessante! Consegue pensar em outra forma de usar "${word.target_word}"?`,
    ],
  },
  it: {
    exampleRequest: (word) => `Certo! Ecco un esempio con "${word.target_word}":\n\n"${word.example_sentence}"\n\nOra prova a scrivere la tua frase!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" significa:\n\n${meaning}\n\nPuoi usare questa parola nelle conversazioni quotidiane!`,
    pronunciationRequest: (word) => `"${word.target_word}" si pronuncia:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nRipetilo lentamente e prova a usarlo in una frase!`,
    correctUsage: [
      'Fantastico! Hai usato la parola correttamente!',
      'Perfetto! Hai usato la parola nel contesto giusto.',
      'Molto bene! Questa frase suona molto naturale.',
    ],
    encouragement: (word) => [
      `Continua! Prova ad aggiungere "${word.target_word}" alla tua frase.`,
      `Buon lavoro! Prova a usare questa parola in una situazione quotidiana.`,
    ],
    shortMessage: (word) => `Prova a scrivere una frase piu lunga! Usa "${word.target_word}" in una frase.`,
    conversationContinue: (word) => [
      `Interessante! Riesci a pensare a un altro modo di usare "${word.target_word}"?`,
    ],
  },
  ru: {
    exampleRequest: (word) => `Konechno! Vot primer s "${word.target_word}":\n\n"${word.example_sentence}"\n\nTeper' poprobuj napisat' svoyo predlozhenie!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" oznachaet:\n\n${meaning}\n\nMozhesh' ispol'zovat' eto slovo v povsednevnyh razgovorah!`,
    pronunciationRequest: (word) => `"${word.target_word}" proiznositsya:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nPovtori medlenno i poprobuj ispol'zovat' v predlozhenii!`,
    correctUsage: [
      'Otlichno! Ty pravil\'no ispol\'zoval slovo!',
      'Ideal\'no! Ty ispol\'zoval slovo v pravil\'nom kontekste.',
    ],
    encouragement: (word) => [
      `Prodolzhaj! Poprobuj dobavit' "${word.target_word}" v svoyo predlozhenie.`,
      `Horoshaya popytka! Poprobuj ispol'zovat' eto slovo v povsednevnoj situacii.`,
    ],
    shortMessage: (word) => `Poprobuj napisat' boleye dlinnoye predlozhenie! Ispol'zuj "${word.target_word}" v predlozhenii.`,
    conversationContinue: (word) => [
      `Interesno! Mozhesh' pridumat' drugoj sposob ispol'zovat' "${word.target_word}"?`,
    ],
  },
  ja: {
    exampleRequest: (word) => `Mochiron! "${word.target_word}" no reibun desu:\n\n"${word.example_sentence}"\n\nIma wa anata jishin no bun wo kaite mimashou!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" no imi:\n\n${meaning}\n\nNichijou kaiwa de kono kotoba wo tsukae masu!`,
    pronunciationRequest: (word) => `"${word.target_word}" no hatsuon:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nYukkuri kurikaeshite, bun no naka de tsukatte mimashou!`,
    correctUsage: [
      'Subarashii! Kotoba wo tadashiku tsukaimashita!',
      'Kanpeki! Tadashii bunmyaku de kotoba wo tsukaimashita.',
    ],
    encouragement: (word) => [
      `Ganbatte! "${word.target_word}" wo bun ni kuwaete mimashou.`,
      `Ii doryoku! Kono kotoba wo nichijou no joukyou de tsukatte mimashou.`,
    ],
    shortMessage: (word) => `Motto nagai bun wo kaite mimashou! "${word.target_word}" wo tsukatte bun wo tsukutte kudasai.`,
    conversationContinue: (word) => [
      `Omoshiroi! "${word.target_word}" wo betsu no houhou de tsukau koto ga deki masu ka?`,
    ],
  },
  ko: {
    exampleRequest: (word) => `Mulloniyo! "${word.target_word}" yemun imnida:\n\n"${word.example_sentence}"\n\nIje jikjeop munjang-eul mandeul-eo boseyo!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" ui uimi:\n\n${meaning}\n\nIlsang daehwa eseo i daneo reul sayonghal su isseoyo!`,
    pronunciationRequest: (word) => `"${word.target_word}" ui barium:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nCheoncheonhi ttalahago munjang eseo sayonghae boseyo!`,
    correctUsage: [
      'Hullyunghaevo! Daneo reul olbaleugage sayong haesseoyo!',
      'Wanbyeok! Olbareun maengnak eseo daneo reul sayong haesseoyo.',
    ],
    encouragement: (word) => [
      `Gyesok haebwayo! "${word.target_word}" reul munjang e chugahae boseyo.`,
      `Joeun noryeok! I daneo reul ilsangjeogin sanghwang eseo sayonghae boseyo.`,
    ],
    shortMessage: (word) => `Deo gin munjang eul sseo boseyo! "${word.target_word}" reul sayonghae munjang eul mandeureo boseyo.`,
    conversationContinue: (word) => [
      `Heungmirowo! "${word.target_word}" reul dareun bangbeop euro sayonghal su isseoyo?`,
    ],
  },
  zh: {
    exampleRequest: (word) => `Dangran! Zhe shi "${word.target_word}" de liju:\n\n"${word.example_sentence}"\n\nXianzai shi zhe xie ni ziji de juzi!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" de yisi:\n\n${meaning}\n\nNi keyi zai richang duihua zhong shiyong zhe ge ci!`,
    pronunciationRequest: (word) => `"${word.target_word}" de fayin:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nManman chongfu, shi zhe yong zai juzi zhong!`,
    correctUsage: [
      'Feichang hao! Ni zhengque de shiyong le zhe ge ci!',
      'Wanmei! Ni zai zhengque de yuying zhong shiyong le zhe ge ci.',
    ],
    encouragement: (word) => [
      `Jia you! Shi zhe ba "${word.target_word}" jia dao ni de juzi li.`,
      `Hen hao de nuli! Shi zhe zai richang changjing zhong shiyong zhe ge ci.`,
    ],
    shortMessage: (word) => `Shi zhe xie yi ge geng chang de juzi! Yong "${word.target_word}" zao yi ge juzi.`,
    conversationContinue: (word) => [
      `Youqu! Ni neng xiang dao lingyi zhong shiyong "${word.target_word}" de fangfa ma?`,
    ],
  },
};

// ---- Yardimci fonksiyonlar ----

/**
 * Benzersiz mesaj ID olustur
 */
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Kelimenin kategorisine gore uygun senaryolari getir
 */
const getScenariosForWord = (word: ContentItem): ScenarioKey[] => {
  const category = (word.category || '').toLowerCase();
  return CATEGORY_SCENARIOS[category] || DEFAULT_SCENARIOS;
};

/**
 * Rastgele bir eleman sec
 */
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Kullanicinin mesajinda hedef kelimeyi kullanip kullanmadigini kontrol et
 */
const checkWordUsage = (message: string, word: ContentItem): boolean => {
  const lowerMessage = message.toLowerCase();
  const wordLower = word.target_word.toLowerCase();

  // Tam kelime kontrolu
  if (lowerMessage.includes(wordLower)) return true;

  // Cok kelimeli ifadeler icin parcali kontrol
  const wordParts = wordLower.split(' ');
  if (wordParts.length > 1) {
    return wordParts.some(w => w.length > 2 && lowerMessage.includes(w));
  }

  return false;
};

/**
 * Konusma gecmisinden bağlam cikar (son mesajlara bak)
 */
const detectConversationContext = (
  history: ChatMessage[]
): 'scenario' | 'challenge' | 'dialog' | 'general' => {
  // Son 3 mesaji kontrol et
  const recentMessages = history.slice(-3);
  for (const msg of recentMessages) {
    if (msg.role === 'assistant') {
      const content = msg.content.toLowerCase();
      if (content.includes('challenge') || content.includes('sinav') || content.includes('desafio') || content.includes('sfida') || content.includes('defi') || content.includes('vyzov') || content.includes('charenji') || content.includes('dojeon') || content.includes('tiaozhan')) {
        return 'challenge';
      }
      if (content.includes('dialog') || content.includes('diyalog') || content.includes('dialogo') || content.includes('daiarogu') || content.includes('daehwa') || content.includes('duihua')) {
        return 'dialog';
      }
      if (content.includes('imagine') || content.includes('hayal') || content.includes('imagina') || content.includes('stell dir vor') || content.includes('souzou') || content.includes('sangsang') || content.includes('jiashe')) {
        return 'scenario';
      }
    }
  }
  return 'general';
};

// ---- Ana fonksiyonlar (export) ----

/**
 * Kelimeye ozel akilli quick reply seceneklerini getir
 * Kategoriye gore senaryo chip'i dinamik olarak degisir
 */
export const getQuickReplyOptions = (language: LanguageCode, word?: ContentItem): QuickReply[] => {
  const templates = quickReplyTemplates[language] || quickReplyTemplates['en'];
  const names = scenarioNames[language] || scenarioNames['en'];

  // Kelimeye uygun senaryo sec
  const scenarios = word ? getScenariosForWord(word) : DEFAULT_SCENARIOS;
  const selectedScenario = scenarios[0]; // En uygun senaryo
  const scenarioName = names[selectedScenario];
  const scenarioEmoji = scenarioEmojis[selectedScenario];

  return [
    { id: 'example', text: templates.example, emoji: '\u{1F4D6}' },
    { id: 'meaning', text: templates.meaning, emoji: '\u{1F4A1}' },
    { id: 'pronunciation', text: templates.pronunciation, emoji: '\u{1F50A}' },
    { id: 'scenario', text: templates.scenario(scenarioName), emoji: scenarioEmoji },
    { id: 'challenge', text: templates.sentenceChallenge, emoji: '\u{1F3AF}' },
    { id: 'dialog', text: templates.dialog, emoji: '\u{1F4AC}' },
  ];
};

/**
 * Simule AI yanitini uret
 * Konusma baglamini, senaryo modunu ve kelime kullanimini dikkate alir
 */
const getSimulatedResponse = (
  userMessage: string,
  word: ContentItem,
  conversationHistory: ChatMessage[],
  nativeLanguage: LanguageCode,
  meaning: string,
  // Aktif senaryo ID'si -- senaryo baglaminda yanit uretmek icin
  scenario?: string
): string => {
  const lowerMessage = userMessage.toLowerCase();
  const templates = responseTemplates[nativeLanguage] || responseTemplates['en'];
  const scenarioTemplates = scenarioResponses[nativeLanguage] || scenarioResponses['en'];
  const names = scenarioNames[nativeLanguage] || scenarioNames['en'];

  // Quick reply anahtar kelime kontrolleri
  const exampleKeywords = ['ornek', 'example', 'ejemplo', 'beispiel', 'exemple', 'exemplo', 'esempio', 'primer', 'reibun', 'yemun', 'lizi', 'show me an example', 'ornek cumle'];
  const meaningKeywords = ['turkce', 'anlam', 'meaning', 'significa', 'bedeutet', 'signifie', 'znachit', 'imi', 'tteus', 'yisi', 'ne demek'];
  const pronunciationKeywords = ['telaffuz', 'pronunciation', 'pronuncia', 'ausspr', 'prononce', 'proiznos', 'hatsuon', 'barium', 'fayin'];

  // Senaryo trigger anahtar kelimeleri
  const scenarioKeywords = ['kafede', 'at a cafe', 'okulda', 'at school', 'seyahatte', 'traveling', 'alisveriste', 'shopping', 'iste', 'at work', 'arkadaslarla', 'with friends', 'nasil kullanirim', 'use it', 'usarlo', 'verwende', 'utiliser', 'usar'];
  // Challenge trigger
  const challengeKeywords = ['sinav', 'challenge', 'desafia', 'fordere', 'defi', 'sfida', 'vyzov', 'charenji', 'dojeon', 'tiaozhan', 'beni sinav', 'challenge me'];
  // Dialog trigger
  const dialogKeywords = ['dialog', 'diyalog', 'dialogo', 'dialogue', 'daiarogu', 'daehwa', 'duihua', 'dialog baslat', 'start a dialog', 'iniciar dialogo'];

  // 1. Ornek istegi
  if (exampleKeywords.some(kw => lowerMessage.includes(kw))) {
    return templates.exampleRequest(word);
  }

  // 2. Anlam istegi
  if (meaningKeywords.some(kw => lowerMessage.includes(kw))) {
    return templates.meaningRequest(word, meaning);
  }

  // 3. Telaffuz istegi
  if (pronunciationKeywords.some(kw => lowerMessage.includes(kw))) {
    return templates.pronunciationRequest(word);
  }

  // 4. Senaryo istegi - kelimeye gore uygun senaryo sec
  if (scenarioKeywords.some(kw => lowerMessage.includes(kw))) {
    const scenarios = getScenariosForWord(word);
    // Kullanicinin bahsettigi senaryoyu bulmaya calis
    let matchedScenario: ScenarioKey | null = null;
    const allScenarioNames = Object.entries(names) as [ScenarioKey, string][];
    for (const [key, name] of allScenarioNames) {
      if (lowerMessage.includes(name.toLowerCase()) || lowerMessage.includes(key)) {
        matchedScenario = key;
        break;
      }
    }
    const scenario = matchedScenario || pickRandom(scenarios);
    return scenarioTemplates.prompt(word, names[scenario]);
  }

  // 5. Challenge istegi
  if (challengeKeywords.some(kw => lowerMessage.includes(kw))) {
    return scenarioTemplates.sentenceChallenge(word);
  }

  // 6. Dialog istegi
  if (dialogKeywords.some(kw => lowerMessage.includes(kw))) {
    const scenarios = getScenariosForWord(word);
    const scenario = pickRandom(scenarios);
    return scenarioTemplates.dialogStart(word, names[scenario]);
  }

  // 7. Konusma baglami kontrolu: challenge/scenario/dialog modunda miyiz?
  const context = detectConversationContext(conversationHistory);
  // Secilen senaryo varsa, her zaman senaryo baglaminda deger lendir
  const isInScenarioMode = !!scenario || context === 'challenge' || context === 'scenario' || context === 'dialog';

  if (isInScenarioMode) {
    // Kelimeyi kullanmis mi kontrol et
    const usedWord = checkWordUsage(userMessage, word);
    if (usedWord) {
      return pickRandom(scenarioTemplates.sentenceSuccess(word));
    } else if (userMessage.length > 10) {
      // Senaryo aktifken kelimeyi kullanmadan uzun mesaj yazilmissa
      // senaryo baglaminda geri bildirim ver
      if (scenario) {
        const validScenario = scenario as ScenarioKey;
        const scenarioName = names[validScenario] || scenario;
        return scenarioTemplates.sentenceMiss(word) +
          `\n\n${scenarioEmojis[validScenario] || ''} ${scenarioName}`;
      }
      return scenarioTemplates.sentenceMiss(word);
    }
  }

  // 8. Genel mesaj: kelime kullanimi kontrolu
  const usedWord = checkWordUsage(userMessage, word);
  if (usedWord) {
    // Senaryo aktifse senaryo baglaminda basari mesaji ver
    if (scenario) {
      return pickRandom(scenarioTemplates.sentenceSuccess(word));
    }
    return pickRandom(templates.correctUsage);
  }

  // 9. Kisa mesaj kontrolu
  if (userMessage.length < 10) {
    return templates.shortMessage(word);
  }

  // 10. Konusma devami veya tesvik
  // Senaryo secildiyse senaryo baglaminda tesvik et
  if (scenario) {
    const validScenario = scenario as ScenarioKey;
    const scenarioName = names[validScenario] || scenario;
    return scenarioTemplates.prompt(word, scenarioName);
  }

  // Konusmada 4+ mesaj varsa konusma devam sablonlarini kullan
  if (conversationHistory.length >= 4 && templates.conversationContinue) {
    const allResponses = [...templates.conversationContinue(word), ...templates.encouragement(word)];
    return pickRandom(allResponses);
  }

  return pickRandom(templates.encouragement(word));
};

/**
 * Simule AI yaniti al (gecikme ile)
 */
// Geri bildirim siddetine gore yanit metnini modifiye et
const applyFeedbackIntensity = (text: string, intensity: FeedbackIntensity): string => {
  if (intensity === 'balanced') return text; // Varsayilan mod, degisiklik yok

  if (intensity === 'soft') {
    // Yumusak mod: tesvik edici prefixler ekle
    const softPrefixes = [
      "You're doing amazing! ",
      "Great effort! ",
      "Keep it up! ",
      "That's wonderful! ",
      "You're on the right track! ",
    ];
    // Hata iceren yanitlarda yumusat
    if (text.includes("didn't") || text.includes('incorrect') || text.includes('wrong') || text.includes('Try again')) {
      const prefix = softPrefixes[Math.floor(Math.random() * softPrefixes.length)];
      return prefix + text.replace(/Try again/g, 'Want to give it another try?').replace(/incorrect/gi, 'not quite right');
    }
    return text;
  }

  if (intensity === 'strict') {
    // Siki mod: daha dogrudan ve detayli
    if (text.includes('Great') || text.includes('Excellent') || text.includes('Amazing') || text.includes('Perfect')) {
      // Ovguyu azalt, spesifik geri bildirime cevir
      return text
        .replace(/Excellent!/g, 'Correct.')
        .replace(/Great job!/g, 'Good.')
        .replace(/Amazing work!/g, 'Right.')
        .replace(/Perfect!/g, 'Correct.')
        .replace(/You nailed it!/g, 'That works.')
        + ' Now try a more complex sentence.';
    }
    // Hata durumunda daha detayli aciklama iste
    if (text.includes("didn't") || text.includes('Try again')) {
      return text + ' Pay close attention to the exact form and context of the word.';
    }
    return text;
  }

  return text;
};

export const getAIResponse = async (
  userMessage: string,
  word: ContentItem,
  conversationHistory: ChatMessage[],
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  wordMeaning: string,
  feedbackIntensity: FeedbackIntensity = 'balanced',
  // Secilen senaryo ID'si -- senaryo baglaminda yanit uretmek icin
  scenario?: string
): Promise<ChatMessage> => {
  // Ag gecikmesi simulasyonu
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));

  let responseText = getSimulatedResponse(
    userMessage,
    word,
    conversationHistory,
    nativeLanguage,
    wordMeaning,
    scenario
  );

  // Geri bildirim siddetini uygula
  responseText = applyFeedbackIntensity(responseText, feedbackIntensity);

  return {
    id: generateMessageId(),
    role: 'assistant',
    content: responseText,
    timestamp: new Date(),
  };
};

/**
 * Kullanici mesaj nesnesi olustur
 */
export const createUserMessage = (content: string): ChatMessage => {
  return {
    id: generateMessageId(),
    role: 'user',
    content,
    timestamp: new Date(),
  };
};

/**
 * Baslangic selamlama mesajini al
 */
export const getInitialGreeting = (
  word: ContentItem,
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  wordMeaning: string,
  // Secilen senaryo ID'si -- PracticeScreen'den gelir
  scenario?: string
): ChatMessage => {
  const greetingFn = greetingTemplates[nativeLanguage] || greetingTemplates['en'];
  let content = greetingFn(word, wordMeaning, targetLanguage);

  // Senaryo secildiyse, senaryo-bazli baslangic mesajini ekle
  if (scenario) {
    const validScenario = scenario as ScenarioKey;
    const names = scenarioNames[nativeLanguage] || scenarioNames['en'];
    const scenarioTemplates = scenarioResponses[nativeLanguage] || scenarioResponses['en'];
    const emoji = scenarioEmojis[validScenario] || '';

    if (names[validScenario]) {
      const scenarioName = names[validScenario];
      // Senaryo bazli karsilama: genel bilgi + senaryo prompt'u
      content = content + `\n\n${emoji} ${scenarioTemplates.prompt(word, scenarioName)}`;
    }
  }

  return {
    id: generateMessageId(),
    role: 'assistant',
    content,
    timestamp: new Date(),
  };
};

// Geriye uyumluluk (eski quick reply formati)
export const quickReplyOptions = quickReplyTemplates['tr']
  ? [
      { id: 'example', text: quickReplyTemplates['tr'].example },
      { id: 'meaning', text: quickReplyTemplates['tr'].meaning },
      { id: 'pronunciation', text: quickReplyTemplates['tr'].pronunciation },
    ]
  : [];
