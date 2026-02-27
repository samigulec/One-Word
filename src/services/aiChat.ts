import { ChatMessage, ContentItem } from '../types';
import { LanguageCode } from '../utils/translations';

/**
 * Language-specific quick reply options
 */
const quickRepliesByLanguage: Record<LanguageCode, { id: string; text: string }[]> = {
  en: [
    { id: 'example', text: 'Give me an example' },
    { id: 'meaning', text: 'What does it mean?' },
    { id: 'pronunciation', text: 'How to pronounce?' },
  ],
  tr: [
    { id: 'example', text: 'Örnek cümle ver' },
    { id: 'meaning', text: 'Türkçesi ne?' },
    { id: 'pronunciation', text: 'Telaffuzu nasıl?' },
  ],
  es: [
    { id: 'example', text: 'Dame un ejemplo' },
    { id: 'meaning', text: '¿Qué significa?' },
    { id: 'pronunciation', text: '¿Cómo se pronuncia?' },
  ],
  de: [
    { id: 'example', text: 'Gib mir ein Beispiel' },
    { id: 'meaning', text: 'Was bedeutet das?' },
    { id: 'pronunciation', text: 'Wie spricht man das aus?' },
  ],
  fr: [
    { id: 'example', text: 'Donne-moi un exemple' },
    { id: 'meaning', text: 'Qu\'est-ce que ça veut dire?' },
    { id: 'pronunciation', text: 'Comment ça se prononce?' },
  ],
  pt: [
    { id: 'example', text: 'Me dê um exemplo' },
    { id: 'meaning', text: 'O que significa?' },
    { id: 'pronunciation', text: 'Como se pronuncia?' },
  ],
  it: [
    { id: 'example', text: 'Dammi un esempio' },
    { id: 'meaning', text: 'Cosa significa?' },
    { id: 'pronunciation', text: 'Come si pronuncia?' },
  ],
  ru: [
    { id: 'example', text: 'Дай пример' },
    { id: 'meaning', text: 'Что это значит?' },
    { id: 'pronunciation', text: 'Как произносится?' },
  ],
  ja: [
    { id: 'example', text: '例文をください' },
    { id: 'meaning', text: 'どういう意味?' },
    { id: 'pronunciation', text: '発音は?' },
  ],
  ko: [
    { id: 'example', text: '예문 주세요' },
    { id: 'meaning', text: '무슨 뜻이에요?' },
    { id: 'pronunciation', text: '발음이 어때요?' },
  ],
  zh: [
    { id: 'example', text: '给个例子' },
    { id: 'meaning', text: '什么意思?' },
    { id: 'pronunciation', text: '怎么发音?' },
  ],
};

/**
 * Language-specific greeting templates
 */
const greetingTemplates: Record<LanguageCode, (word: ContentItem, meaning: string, targetLang: string) => string> = {
  en: (word, meaning, targetLang) => 
    `Hello! I'm your ${targetLang.toUpperCase()} teacher.\n\nToday we'll learn: "${word.target_word}"!\n\nMeaning: ${meaning}\n\nExample: "${word.example_sentence}"\n\nTry making a sentence using this word! Use the buttons below if you need help.`,
  tr: (word, meaning, targetLang) => 
    `Merhaba! Ben senin ${targetLang.toUpperCase()} öğretmeninim.\n\nBugün "${word.target_word}" kelimesini öğreneceğiz!\n\nTürkçesi: ${meaning}\n\nÖrnek: "${word.example_sentence}"\n\nHaydi, bu kelimeyi kullanarak bir cümle yazmayı dene! Yardıma ihtiyacın olursa aşağıdaki butonları kullanabilirsin.`,
  es: (word, meaning, targetLang) => 
    `¡Hola! Soy tu profesor de ${targetLang.toUpperCase()}.\n\nHoy aprenderemos: "${word.target_word}"!\n\nSignificado: ${meaning}\n\nEjemplo: "${word.example_sentence}"\n\n¡Intenta hacer una oración usando esta palabra! Usa los botones de abajo si necesitas ayuda.`,
  de: (word, meaning, targetLang) => 
    `Hallo! Ich bin dein ${targetLang.toUpperCase()}-Lehrer.\n\nHeute lernen wir: "${word.target_word}"!\n\nBedeutung: ${meaning}\n\nBeispiel: "${word.example_sentence}"\n\nVersuche einen Satz mit diesem Wort zu bilden! Nutze die Buttons unten, wenn du Hilfe brauchst.`,
  fr: (word, meaning, targetLang) => 
    `Bonjour! Je suis ton professeur de ${targetLang.toUpperCase()}.\n\nAujourd'hui nous apprenons: "${word.target_word}"!\n\nSignification: ${meaning}\n\nExemple: "${word.example_sentence}"\n\nEssaie de faire une phrase avec ce mot! Utilise les boutons ci-dessous si tu as besoin d'aide.`,
  pt: (word, meaning, targetLang) => 
    `Olá! Sou seu professor de ${targetLang.toUpperCase()}.\n\nHoje vamos aprender: "${word.target_word}"!\n\nSignificado: ${meaning}\n\nExemplo: "${word.example_sentence}"\n\nTente fazer uma frase usando esta palavra! Use os botões abaixo se precisar de ajuda.`,
  it: (word, meaning, targetLang) => 
    `Ciao! Sono il tuo insegnante di ${targetLang.toUpperCase()}.\n\nOggi impariamo: "${word.target_word}"!\n\nSignificato: ${meaning}\n\nEsempio: "${word.example_sentence}"\n\nProva a fare una frase usando questa parola! Usa i pulsanti sotto se hai bisogno di aiuto.`,
  ru: (word, meaning, targetLang) => 
    `Привет! Я твой учитель ${targetLang.toUpperCase()}.\n\nСегодня мы выучим: "${word.target_word}"!\n\nЗначение: ${meaning}\n\nПример: "${word.example_sentence}"\n\nПопробуй составить предложение с этим словом! Используй кнопки ниже, если нужна помощь.`,
  ja: (word, meaning, targetLang) => 
    `こんにちは！ 私はあなたの${targetLang.toUpperCase()}の先生です。\n\n今日学ぶのは: "${word.target_word}"!\n\n意味: ${meaning}\n\n例文: "${word.example_sentence}"\n\nこの言葉を使って文を作ってみましょう！助けが必要なら下のボタンを使ってください。`,
  ko: (word, meaning, targetLang) => 
    `안녕하세요! 저는 당신의 ${targetLang.toUpperCase()} 선생님입니다.\n\n오늘 배울 것: "${word.target_word}"!\n\n의미: ${meaning}\n\n예문: "${word.example_sentence}"\n\n이 단어를 사용해서 문장을 만들어 보세요! 도움이 필요하면 아래 버튼을 사용하세요.`,
  zh: (word, meaning, targetLang) => 
    `你好！ 我是你的${targetLang.toUpperCase()}老师。\n\n今天我们学习: "${word.target_word}"!\n\n含义: ${meaning}\n\n例句: "${word.example_sentence}"\n\n试着用这个词造个句子！需要帮助的话可以用下面的按钮。`,
};

/**
 * Language-specific response templates
 */
const responseTemplates: Record<LanguageCode, {
  exampleRequest: (word: ContentItem) => string;
  meaningRequest: (word: ContentItem, meaning: string) => string;
  pronunciationRequest: (word: ContentItem) => string;
  correctUsage: string[];
  encouragement: (word: ContentItem) => string[];
  shortMessage: (word: ContentItem) => string;
}> = {
  en: {
    exampleRequest: (word) => `Sure! Here's another example with "${word.target_word}":\n\n"${word.example_sentence}"\n\nNow try writing your own sentence!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" means:\n\n${meaning}\n\nYou can use this word in everyday conversation! Want to try making a sentence?`,
    pronunciationRequest: (word) => `"${word.target_word}" is pronounced:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nRepeat it slowly and try using it in a sentence!`,
    correctUsage: [
      'Great job! You used the idiom correctly! Your sentence is excellent. Want to try another one?',
      'Perfect! You used the idiom in the right context. Your English is improving!',
      'Well done! That sentence sounds very natural. Can you write one more?',
      'Bravo! You used it perfectly. Keep going, you\'re doing great!',
    ],
    encouragement: (word) => [
      `Keep going! Try adding "${word.target_word}" to your sentence.`,
      `Good effort! Try using this word in a daily situation.`,
      `Great try! Tell me about a situation where you could use "${word.target_word}".`,
    ],
    shortMessage: (word) => `Try writing a longer sentence! Use "${word.target_word}" in a sentence. I'm here to help!`,
  },
  tr: {
    exampleRequest: (word) => `Tabii! İşte "${word.target_word}" ile başka bir örnek cümle:\n\n"${word.example_sentence}"\n\nŞimdi sen de kendi cümleni yazmayı dene!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" kelimesinin Türkçe karşılığı:\n\n${meaning}\n\nBu kelimeyi günlük konuşmada sıkça kullanabilirsin! Bir cümle kurmayı dener misin?`,
    pronunciationRequest: (word) => `"${word.target_word}" şöyle telaffuz edilir:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nYavaşça tekrar et ve cümle içinde kullanmayı dene!`,
    correctUsage: [
      'Harika! Deyimi doğru kullandın! Cümlen çok güzel olmuş. Başka bir örnek dener misin?',
      'Mükemmel! Deyimi tam yerinde kullandın. İngilizce\'n gelişiyor!',
      'Çok iyi! Bu cümle çok doğal olmuş. Bir tane daha yazar mısın?',
      'Bravo! Deyimi harika kullanmışsın. Devam et, çok iyi gidiyorsun!',
    ],
    encouragement: (word) => [
      `İyi gidiyorsun! "${word.target_word}" kelimesini cümlenin içine eklemeyi dene.`,
      `Devam et! Bu kelimeyi günlük bir durumu anlatırken kullanabilirsin.`,
      `Harika çaba! "${word.target_word}" kelimesini kullanarak kendi deneyiminden bir örnek ver.`,
    ],
    shortMessage: (word) => `Daha uzun bir cümle kurmayı dene! "${word.target_word}" kelimesini kullanarak bir cümle yaz. Yardıma ihtiyacın olursa buradayım!`,
  },
  es: {
    exampleRequest: (word) => `¡Claro! Aquí hay otro ejemplo con "${word.target_word}":\n\n"${word.example_sentence}"\n\n¡Ahora intenta escribir tu propia oración!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" significa:\n\n${meaning}\n\n¡Puedes usar esta palabra en conversaciones diarias! ¿Quieres intentar hacer una oración?`,
    pronunciationRequest: (word) => `"${word.target_word}" se pronuncia:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\n¡Repítelo despacio e intenta usarlo en una oración!`,
    correctUsage: [
      '¡Genial! ¡Usaste la palabra correctamente! Tu oración es excelente. ¿Quieres intentar otra?',
      '¡Perfecto! Usaste la palabra en el contexto correcto. ¡Estás mejorando!',
      '¡Muy bien! Esa oración suena muy natural. ¿Puedes escribir una más?',
      '¡Bravo! Lo usaste perfectamente. ¡Sigue así, lo estás haciendo genial!',
    ],
    encouragement: (word) => [
      `¡Sigue adelante! Intenta agregar "${word.target_word}" a tu oración.`,
      `¡Buen esfuerzo! Intenta usar esta palabra en una situación diaria.`,
      `¡Gran intento! Cuéntame una situación donde podrías usar "${word.target_word}".`,
    ],
    shortMessage: (word) => `¡Intenta escribir una oración más larga! Usa "${word.target_word}" en una oración. ¡Estoy aquí para ayudarte!`,
  },
  de: {
    exampleRequest: (word) => `Klar! Hier ist ein weiteres Beispiel mit "${word.target_word}":\n\n"${word.example_sentence}"\n\nJetzt versuch deinen eigenen Satz zu schreiben!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" bedeutet:\n\n${meaning}\n\nDu kannst dieses Wort in alltäglichen Gesprächen verwenden! Möchtest du einen Satz versuchen?`,
    pronunciationRequest: (word) => `"${word.target_word}" wird so ausgesprochen:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nWiederhole es langsam und versuche es in einem Satz zu benutzen!`,
    correctUsage: [
      'Super! Du hast das Wort richtig verwendet! Dein Satz ist ausgezeichnet. Möchtest du noch einen versuchen?',
      'Perfekt! Du hast das Wort im richtigen Kontext verwendet. Du wirst immer besser!',
      'Sehr gut! Der Satz klingt sehr natürlich. Kannst du noch einen schreiben?',
      'Bravo! Du hast es perfekt verwendet. Mach weiter so!',
    ],
    encouragement: (word) => [
      `Weiter so! Versuche "${word.target_word}" in deinen Satz einzubauen.`,
      `Gute Bemühung! Versuche dieses Wort in einer Alltagssituation zu verwenden.`,
      `Guter Versuch! Erzähl mir von einer Situation, in der du "${word.target_word}" verwenden könntest.`,
    ],
    shortMessage: (word) => `Versuche einen längeren Satz zu schreiben! Benutze "${word.target_word}" in einem Satz. Ich bin hier um zu helfen!`,
  },
  fr: {
    exampleRequest: (word) => `Bien sûr! Voici un autre exemple avec "${word.target_word}":\n\n"${word.example_sentence}"\n\nMaintenant essaie d'écrire ta propre phrase!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" signifie:\n\n${meaning}\n\nTu peux utiliser ce mot dans les conversations quotidiennes! Tu veux essayer de faire une phrase?`,
    pronunciationRequest: (word) => `"${word.target_word}" se prononce:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nRépète-le lentement et essaie de l'utiliser dans une phrase!`,
    correctUsage: [
      'Génial! Tu as utilisé le mot correctement! Ta phrase est excellente. Tu veux en essayer une autre?',
      'Parfait! Tu as utilisé le mot dans le bon contexte. Tu progresses!',
      'Très bien! Cette phrase sonne très naturelle. Tu peux en écrire une autre?',
      'Bravo! Tu l\'as utilisé parfaitement. Continue comme ça!',
    ],
    encouragement: (word) => [
      `Continue! Essaie d'ajouter "${word.target_word}" à ta phrase.`,
      `Bon effort! Essaie d'utiliser ce mot dans une situation quotidienne.`,
      `Bel essai! Parle-moi d'une situation où tu pourrais utiliser "${word.target_word}".`,
    ],
    shortMessage: (word) => `Essaie d'écrire une phrase plus longue! Utilise "${word.target_word}" dans une phrase. Je suis là pour t'aider!`,
  },
  pt: {
    exampleRequest: (word) => `Claro! Aqui está outro exemplo com "${word.target_word}":\n\n"${word.example_sentence}"\n\nAgora tente escrever sua própria frase!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" significa:\n\n${meaning}\n\nVocê pode usar esta palavra em conversas do dia a dia! Quer tentar fazer uma frase?`,
    pronunciationRequest: (word) => `"${word.target_word}" é pronunciado:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nRepita devagar e tente usar em uma frase!`,
    correctUsage: [
      'Ótimo! Você usou a palavra corretamente! Sua frase é excelente. Quer tentar outra?',
      'Perfeito! Você usou a palavra no contexto certo. Você está melhorando!',
      'Muito bem! Essa frase soa muito natural. Pode escrever mais uma?',
      'Bravo! Você usou perfeitamente. Continue assim!',
    ],
    encouragement: (word) => [
      `Continue! Tente adicionar "${word.target_word}" à sua frase.`,
      `Bom esforço! Tente usar esta palavra em uma situação do dia a dia.`,
      `Boa tentativa! Me conte uma situação onde você poderia usar "${word.target_word}".`,
    ],
    shortMessage: (word) => `Tente escrever uma frase mais longa! Use "${word.target_word}" em uma frase. Estou aqui para ajudar!`,
  },
  it: {
    exampleRequest: (word) => `Certo! Ecco un altro esempio con "${word.target_word}":\n\n"${word.example_sentence}"\n\nOra prova a scrivere la tua frase!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" significa:\n\n${meaning}\n\nPuoi usare questa parola nelle conversazioni quotidiane! Vuoi provare a fare una frase?`,
    pronunciationRequest: (word) => `"${word.target_word}" si pronuncia:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nRipetilo lentamente e prova a usarlo in una frase!`,
    correctUsage: [
      'Fantastico! Hai usato la parola correttamente! La tua frase è eccellente. Vuoi provarne un\'altra?',
      'Perfetto! Hai usato la parola nel contesto giusto. Stai migliorando!',
      'Molto bene! Questa frase suona molto naturale. Puoi scriverne un\'altra?',
      'Bravo! L\'hai usato perfettamente. Continua così!',
    ],
    encouragement: (word) => [
      `Continua! Prova ad aggiungere "${word.target_word}" alla tua frase.`,
      `Buon lavoro! Prova a usare questa parola in una situazione quotidiana.`,
      `Bel tentativo! Raccontami una situazione dove potresti usare "${word.target_word}".`,
    ],
    shortMessage: (word) => `Prova a scrivere una frase più lunga! Usa "${word.target_word}" in una frase. Sono qui per aiutarti!`,
  },
  ru: {
    exampleRequest: (word) => `Конечно! Вот ещё один пример с "${word.target_word}":\n\n"${word.example_sentence}"\n\nТеперь попробуй написать своё предложение!`,
    meaningRequest: (word, meaning) => `"${word.target_word}" означает:\n\n${meaning}\n\nМожешь использовать это слово в повседневных разговорах! Хочешь попробовать составить предложение?`,
    pronunciationRequest: (word) => `"${word.target_word}" произносится:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nПовтори медленно и попробуй использовать в предложении!`,
    correctUsage: [
      'Отлично! Ты правильно использовал слово! Твоё предложение превосходно. Хочешь попробовать ещё?',
      'Идеально! Ты использовал слово в правильном контексте. Ты прогрессируешь!',
      'Молодец! Это предложение звучит очень естественно. Можешь написать ещё одно?',
      'Браво! Ты использовал его идеально. Продолжай в том же духе!',
    ],
    encouragement: (word) => [
      `Продолжай! Попробуй добавить "${word.target_word}" в своё предложение.`,
      `Хорошая попытка! Попробуй использовать это слово в повседневной ситуации.`,
      `Отличная попытка! Расскажи о ситуации, где ты мог бы использовать "${word.target_word}".`,
    ],
    shortMessage: (word) => `Попробуй написать более длинное предложение! Используй "${word.target_word}" в предложении. Я здесь, чтобы помочь!`,
  },
  ja: {
    exampleRequest: (word) => `もちろん！"${word.target_word}"のもう一つの例文です：\n\n"${word.example_sentence}"\n\n今度はあなた自身の文を書いてみましょう！`,
    meaningRequest: (word, meaning) => `"${word.target_word}"の意味：\n\n${meaning}\n\n日常会話でこの言葉を使えます！文を作ってみませんか？`,
    pronunciationRequest: (word) => `"${word.target_word}"の発音：\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\nゆっくり繰り返して、文の中で使ってみましょう！`,
    correctUsage: [
      '素晴らしい！ 言葉を正しく使いました！文がとても良いです。もう一つ試してみますか？',
      '完璧！ 正しい文脈で言葉を使いました。上達していますね！',
      'よくできました！ その文はとても自然です。もう一つ書けますか？',
      'ブラボー！ 完璧に使いました。その調子で頑張って！',
    ],
    encouragement: (word) => [
      `頑張って！ "${word.target_word}"を文に加えてみましょう。`,
      `いい努力！ この言葉を日常の状況で使ってみましょう。`,
      `いい試み！ "${word.target_word}"を使える状況を教えてください。`,
    ],
    shortMessage: (word) => `もっと長い文を書いてみましょう！"${word.target_word}"を使って文を作ってください。お手伝いします！`,
  },
  ko: {
    exampleRequest: (word) => `물론이죠! "${word.target_word}"의 다른 예문입니다:\n\n"${word.example_sentence}"\n\n이제 직접 문장을 만들어 보세요!`,
    meaningRequest: (word, meaning) => `"${word.target_word}"의 의미:\n\n${meaning}\n\n일상 대화에서 이 단어를 사용할 수 있어요! 문장을 만들어 볼까요?`,
    pronunciationRequest: (word) => `"${word.target_word}"의 발음:\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\n천천히 따라하고 문장에서 사용해 보세요!`,
    correctUsage: [
      '훌륭해요! 단어를 올바르게 사용했어요! 문장이 아주 좋아요. 하나 더 해볼까요?',
      '완벽해요! 올바른 맥락에서 단어를 사용했어요. 실력이 늘고 있어요!',
      '잘했어요! 그 문장은 아주 자연스러워요. 하나 더 써볼 수 있나요?',
      '브라보! 완벽하게 사용했어요. 계속 화이팅!',
    ],
    encouragement: (word) => [
      `계속 해봐요! "${word.target_word}"를 문장에 추가해 보세요.`,
      `좋은 노력이에요! 이 단어를 일상적인 상황에서 사용해 보세요.`,
      `좋은 시도예요! "${word.target_word}"를 사용할 수 있는 상황을 알려주세요.`,
    ],
    shortMessage: (word) => `더 긴 문장을 써보세요! "${word.target_word}"를 사용해서 문장을 만들어 주세요. 도와드릴게요!`,
  },
  zh: {
    exampleRequest: (word) => `当然！这是"${word.target_word}"的另一个例句：\n\n"${word.example_sentence}"\n\n现在试着写你自己的句子吧！`,
    meaningRequest: (word, meaning) => `"${word.target_word}"的意思：\n\n${meaning}\n\n你可以在日常对话中使用这个词！想试着造个句子吗？`,
    pronunciationRequest: (word) => `"${word.target_word}"的发音：\n\n${word.pronunciation || word.target_word.toLowerCase()}\n\n慢慢重复，试着在句子中使用！`,
    correctUsage: [
      '太棒了！ 你正确使用了这个词！你的句子很棒。想再试一个吗？',
      '完美！ 你在正确的语境中使用了这个词。你在进步！',
      '很好！ 这个句子听起来很自然。能再写一个吗？',
      '太好了！ 你用得很完美。继续加油！',
    ],
    encouragement: (word) => [
      `继续加油！ 试着把"${word.target_word}"加到你的句子里。`,
      `不错的尝试！ 试着在日常情境中使用这个词。`,
      `很好的尝试！ 告诉我一个你可以使用"${word.target_word}"的情境。`,
    ],
    shortMessage: (word) => `试着写一个更长的句子！用"${word.target_word}"造一个句子。我来帮你！`,
  },
};

/**
 * Generate a unique ID for messages
 */
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get simulated response based on language
 */
const getSimulatedResponse = (
  userMessage: string,
  word: ContentItem,
  messageCount: number,
  nativeLanguage: LanguageCode,
  meaning: string
): string => {
  const lowerMessage = userMessage.toLowerCase();
  const wordLower = word.target_word.toLowerCase();
  const templates = responseTemplates[nativeLanguage] || responseTemplates['en'];

  // Check for quick reply requests
  const exampleKeywords = ['örnek', 'example', 'ejemplo', 'beispiel', 'exemple', 'exemplo', 'esempio', 'пример', '例', '예문'];
  const meaningKeywords = ['türkçe', 'anlam', 'meaning', 'significa', 'bedeutet', 'signifie', 'значит', '意味', '뜻', '意思'];
  const pronunciationKeywords = ['telaffuz', 'pronunciation', 'pronuncia', 'ausspr', 'prononce', 'произнос', '発音', '발음', '发音'];

  if (exampleKeywords.some(kw => lowerMessage.includes(kw))) {
    return templates.exampleRequest(word);
  }

  if (meaningKeywords.some(kw => lowerMessage.includes(kw))) {
    return templates.meaningRequest(word, meaning);
  }

  if (pronunciationKeywords.some(kw => lowerMessage.includes(kw))) {
    return templates.pronunciationRequest(word);
  }

  // Check if user used the word in their message
  const wordWords = wordLower.split(' ');
  const usedWord = wordWords.some(w => 
    w.length > 2 && lowerMessage.includes(w)
  );

  if (usedWord || lowerMessage.includes(wordLower)) {
    return templates.correctUsage[Math.floor(Math.random() * templates.correctUsage.length)];
  }

  // If message is very short
  if (userMessage.length < 10) {
    return templates.shortMessage(word);
  }

  // General encouraging responses
  const encouragements = templates.encouragement(word);
  return encouragements[Math.floor(Math.random() * encouragements.length)];
};

/**
 * Get quick reply options for the user's language
 */
export const getQuickReplyOptions = (language: LanguageCode) => {
  return quickRepliesByLanguage[language] || quickRepliesByLanguage['en'];
};

/**
 * Simulate AI response
 */
export const getAIResponse = async (
  userMessage: string,
  word: ContentItem,
  conversationHistory: ChatMessage[],
  nativeLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  wordMeaning: string
): Promise<ChatMessage> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));

  const responseText = getSimulatedResponse(
    userMessage,
    word,
    conversationHistory.length,
    nativeLanguage,
    wordMeaning
  );

  return {
    id: generateMessageId(),
    role: 'assistant',
    content: responseText,
    timestamp: new Date(),
  };
};

/**
 * Create a user message object
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
 * Get initial greeting message from AI
 */
export const getInitialGreeting = (
  word: ContentItem, 
  nativeLanguage: LanguageCode, 
  targetLanguage: LanguageCode,
  wordMeaning: string
): ChatMessage => {
  const greetingFn = greetingTemplates[nativeLanguage] || greetingTemplates['en'];

  return {
    id: generateMessageId(),
    role: 'assistant',
    content: greetingFn(word, wordMeaning, targetLanguage),
    timestamp: new Date(),
  };
};

// Keep for backwards compatibility
export const quickReplyOptions = quickRepliesByLanguage['tr'];
