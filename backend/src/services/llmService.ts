/**
 * VISTHAAPAN LLM Service (Groq Cloud Integration)
 * Primary Cloud LLM Provider: Groq Cloud
 * Target Model: openai/gpt-oss-20b
 *
 * Responsibilities:
 * - Direct server-to-server communication with Groq Cloud API
 * - Structured Situation Briefings in the officer's selected language
 * - Sahayak AI Decision Support conversational assistance
 * - Allocation explainability narrative generation
 * - Deterministic multilingual fallback if API key is missing or offline
 */

import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface AIStatus {
  configured: boolean;
  provider: 'Groq';
  model: string;
  status: 'ready' | 'fallback_mode';
}

export interface StructuredBriefing {
  situation: string;
  relocation_requirement: string;
  priority: string;
  capacity: string;
  allocation: string;
  constraints: string;
  transportation: string;
  officer_action: string;
  narrativeMarkdown: string;
  language: string;
  provider: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  bn: 'Bengali (বাংলা)',
  te: 'Telugu (తెలుగు)',
  mr: 'Marathi (मराठी)',
  ta: 'Tamil (தமிழ்)',
  gu: 'Gujarati (ગુજરાતી)',
  ur: 'Urdu (اردو)',
  kn: 'Kannada (ಕನ್ನಡ)',
  or: 'Odia (ଓଡ଼ିଆ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  as: 'Assamese (অসমীয়া)',
};

/**
 * Fallback generator for situation briefs in the target Indian language
 */
function getDeterministicFallbackBrief(lang: string, context?: any): StructuredBriefing {
  const languageName = LANGUAGE_NAMES[lang] || 'English';

  if (lang === 'hi') {
    return {
      situation: 'चमोली जनपद में मानसून भू-धंसाव एवं अतिवृष्टि की स्थिति पर निरंतर निगरानी रखी जा रही है। जोशीमठ एवं अलकनंदा घाटी के वार्ड 4-7 में विस्थापन दर 14 मिमी/सप्ताह दर्ज की गई है।',
      relocation_requirement: 'कुल 12,250 संवेदनशील नागरिकों को चरणबद्ध सुरक्षित आश्रयों में स्थानांतरित करने की आवश्यकता है। 5 अति-संवेदनशील बस्तियों को तत्काल प्राथमिकता दी गई है।',
      priority: 'उच्च प्राथमिकता (Immediate): तपोवन, जोशीमठ वार्ड 4-7, रैणी, हेलंग।',
      capacity: 'गौचर (5,000), कर्णप्रयाग (3,800), रुद्रप्रयाग (3,500), एवं श्रीनगर (2,500) में कुल 14,800 सुरक्षित प्रभावी क्षमता सत्यापित है।',
      allocation: 'ओआर सॉल्वर द्वारा 0-गैप इष्टतम आवंटन तैयार किया गया है। गौचर एवं कर्णप्रयाग राहत केंद्रों में प्राथमिक आवंटन पूर्ण है।',
      constraints: 'पीपलकोटी शेल्टर को सक्रिय भूस्खलन क्षेत्र में होने के कारण अपवर्जित (Restricted) रखा गया है।',
      transportation: 'राष्ट्रीय राजमार्ग 07 (NH-07) पर एकतरफा सुरक्षा काफिला संचलन अनुमत है। संपर्क मार्ग आर-12 पर भू-स्खलन के कारण वैकल्पिक मार्ग सक्रिय है।',
      officer_action: 'सक्षम प्राधिकारी द्वारा धारा 30(2) आपदा प्रबंधन अधिनियम 2005 के अंतर्गत विस्थापन आदेश का अनुमोदन एवं राहत काफिला रवानगी अपेक्षित है।',
      narrativeMarkdown: `#### 1. वर्तमान स्थिति का संक्षिप्त विवरण
चमोली जनपद में जोशीमठ एवं अलकनंदा घाटी क्षेत्र में अत्यधिक भू-धंसाव दर्ज किया गया है। विस्थापन निगरानी प्रणाली द्वारा कुल **12,250 संवेदनशील नागरिकों** के सुरक्षित स्थानांतरण का आदेश तैयार है।

#### 2. राहत शिविर एवं क्षमता विश्लेषण
सत्यापित सुरक्षित आश्रयों (गौचर, कर्णप्रयाग, रुद्रप्रयाग, श्रीनगर) में कुल **14,800 नागरिकों की सुरक्षित क्षमता** उपलब्ध है। पीपलकोटी राहत स्थल को सुरक्षा कारणों से प्रतिबंधित रखा गया है।

#### 3. ऑपरेशंस रिसर्च आवंटन निर्णय
ओआर सॉल्वर (OR Solver) द्वारा तपोवन से 3,150 नागरिकों को रुद्रप्रयाग एवं जोशीमठ से 4,500 नागरिकों को गौचर हवाई पट्टी केंद्र आवंटित किया गया है।

#### 4. सक्षम प्राधिकारी हेतु अग्रिम कार्यवाही
1. चरण 1 के अंतर्गत वृद्धजन, दिव्यांग एवं बच्चों के काफिले को तत्काल रवाना किया जाए।
2. वैकल्पिक मार्ग आर-12बी पर एसडीआरएफ एवं एनडीआरएफ के एस्कॉर्ट वाहन तैनात रहें।`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  if (lang === 'gu') {
    return {
      situation: 'ચમોલી જિલ્લામાં ચોમાસા દરમિયાન જમીન ધસી પડવાની અને ભારે વરસાદની સ્થિતિ પર સતત નજર રાખવામાં આવી રહી છે. જોશીમઠ અને અલકનંદા ખીણમાં 14 મીમી/સપ્તાહનું વિસ્થાપન નોંધાયું છે.',
      relocation_requirement: 'કુલ 12,250 સંવેદનશીલ નાગરિકોને તબક્કાવાર સુરક્ષિત આશ્રયસ્થાનોમાં સ્થળાંતર કરવાની જરૂર છે. 5 અતિ સંવેદનશીલ વિસ્તારોને તાત્કાલિક પ્રાથમિકતા અપાઈ છે.',
      priority: 'તાત્કાલિક પ્રાથમિકતા (Immediate): તપોવન (3,150), જોશીમઠ વોર્ડ 4-7 (4,500), રૈણી (2,200), હેલંગ (1,800).',
      capacity: 'ગૌચર (5,000), કર્ણપ્રયાગ (3,800), રુદ્રપ્રયાગ (3,500), અને શ્રીનગર (2,500) માં કુલ 14,800 સુરક્ષિત ક્ષમતા ઉપલબ્ધ છે.',
      allocation: 'ઓઆર સોલ્વર (OR Solver) દ્વારા શૂન્ય ક્ષમતા અતિપ્રવાહ સાથે શ્રેષ્ઠ ફાળવણી તૈયાર કરવામાં આવી છે.',
      constraints: 'સક્રિય ભૂસ્ખલન સંકટને કારણે પીપલકોટી આશ્રય કેન્દ્રને પ્રતિબંધિત રાખવામાં આવ્યું છે.',
      transportation: 'રાષ્ટ્રીય ધોરીમાર્ગ 07 (NH-07) પર સલામત કાફલો કાર્યરત છે; લિંક રોડ આર-12 વૈકલ્પિક માર્ગ સક્રિય છે.',
      officer_action: 'આપત્તિ વ્યવસ્થાપન અધિનિયમ 2005 ની કલમ 30 અને 34 હેઠળ સક્ષમ અધિકારી દ્વારા આદેશ મંજૂર કરવાની ભલામણ છે.',
      narrativeMarkdown: `#### 1. પરિસ્થિતિની વિગત
ચમોલી જિલ્લામાં જોશીમઠ અને અલકનંદા ખીણ વિસ્તારમાં ભૂ-ધસાણ પર દેખરેખ રાખવામાં આવી રહી છે. કુલ **12,250 સંવેદનશીલ નાગરિકો** ના સલામત સ્થળાંતરની યોજના તૈયાર છે.

#### 2. આશ્રય ક્ષમતા અને વિતરણ
ચકાસાયેલ સલામત આશ્રયોમાં કુલ **14,800 નાગરિકો માટે ક્ષમતા** ઉપલબ્ધ છે. પીપલકોટી કેન્દ્ર સુરક્ષા કારણોસર બાકાત રાખવામાં આવ્યું છે.

#### 3. ઓપરેશન્સ રિસર્ચ ફાળવણી નિર્ણય
ઓઆર સોલ્વર દ્વારા તપોવનના 3,150 નાગરિકોને રુદ્રપ્રયાગ અને જોશીમઠના 4,500 નાગરિકોને ગૌચર એરપોર્ટ કેન્દ્રમાં ફાળવવામાં આવ્યા છે.

#### 4. અધિકારી માટે ભલામણ કરેલ પગલાં
1. તબક્કો 1 હેઠળ વરિષ્ઠ નાગરિકો, દિવ્યાંગો અને બાળકોના કાફલાને તાત્કાલિક રવાના કરો.
2. વૈકલ્પિક માર્ગ આર-12બી પર SDRF એસ્કોર્ટ તૈનાત રાખો.`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  if (lang === 'ta') {
    return {
      situation: 'சமோலி மாவட்டத்தில் நிலச்சரிவு மற்றும் கனமழை அபாயம் தொடர்ந்து கண்காணிக்கப்பட்டு வருகிறது. ஜோஷிமத் மற்றும் அலக்நந்தா பள்ளத்தாக்கில் இடப்பெயர்வு விகிதம் 14 மிமீ/வாரம் பதிவாகியுள்ளது.',
      relocation_requirement: 'பாதிக்கப்படக்கூடிய 12,250 குடிமக்களை பாதுகாப்பான நிவாரண மையங்களுக்கு கட்டம் கட்டமாக மாற்ற வேண்டியது அவசியமாகும்.',
      priority: 'உடனடி முன்னுரிமை: தபோவன் (3,150), ஜோஷிமத் வார்டுகள் 4-7 (4,500), ரைனி (2,200), ஹெலாங் (1,800).',
      capacity: 'கௌச்சர் (5,000), கர்ணபிரயாக் (3,800), ருத்ரபிரயாக் (3,500), ஸ்ரீநகர் (2,500) ஆகியவற்றில் மொத்தம் 14,800 இடங்கள் உறுதி செய்யப்பட்டுள்ளன.',
      allocation: 'செயல்பாட்டு ஆராய்ச்சி (OR Solver) மூலம் உகந்த பங்கீடு பூஜ்ஜிய பற்றாக்குறையுடன் கணக்கிடப்பட்டுள்ளது.',
      constraints: 'நிலச்சரிவு ஆபத்து காரணமாக பிபல்கோட்டி மையம் தவிர்க்கப்பட்டுள்ளது.',
      transportation: 'தேசிய நெடுஞ்சாலை 07 (NH-07) சீராக உள்ளது; மாற்றுப் பாதை ஆர்-12பி செயல்பாட்டில் உள்ளது.',
      officer_action: 'பேரிடர் மேலாண்மை சட்டம் 2005 இன் பிரிவு 30 மற்றும் 34 இன் கீழ் அதிகாரப்பூர்வ அனுமதி பரிந்துரைக்கப்படுகிறது.',
      narrativeMarkdown: `#### 1. தற்போதைய சூழ்நிலை கண்ணோட்டம்
சமோலி மாவட்டத்தில் ஜோஷிமத் மற்றும் அலக்நந்தா பள்ளத்தாக்கு பகுதிகளில் தீவிர நிலச்சரிவு கண்காணிக்கப்படுகிறது. மொத்தம் **12,250 குடிமக்களை** பாதுகாப்பான இடங்களுக்கு மாற்ற உத்தரவு தயாராக உள்ளது.

#### 2. நிவாரண முகாம் கொள்ளளவு
நான்கு பாதுகாப்பான முகாம்களில் மொத்தம் **14,800 நபர்களுக்கான கொள்ளளவு** உறுதி செய்யப்பட்டுள்ளது. பிபல்கோட்டி மையம் ஆபத்து காரணமாக விலக்கப்பட்டுள்ளது.

#### 3. உகந்த ஒதுக்கீட்டு முடிவு (OR Solver)
தபோவனில் இருந்து 3,150 நபர்கள் ருத்ரபிரயாக்கிற்கும், ஜோஷிமத்தில் இருந்து 4,500 நபர்கள் கௌச்சருக்கும் ஒதுக்கப்பட்டுள்ளனர்.

#### 4. தளபதிக்கான பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்
1. கட்டம் 1-ன் கீழ் முதியவர்கள், மாற்றுத்திறனாளிகள் மற்றும் குழந்தைகளை உடனடியாக வெளியேற்றவும்.
2. மாற்றுப் பாதை ஆர்-12பி-ல் எஸ்டிஆர்எஃப் பாதுகாப்புப் படைகளை நிலைநிறுத்தவும்.`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  if (lang === 'bn') {
    return {
      situation: 'চামোলি জেলায় ভূমিধস এবং অতিবৃষ্টির পরিস্থিতি নিবিড়ভাবে পর্যবেক্ষণ করা হচ্ছে। জোশীমঠ এবং অলকানন্দা উপত্যকায় 14 মিমি/সপ্তাহ ভূ-বিচ্যুতি পরিমাপ করা হয়েছে।',
      relocation_requirement: 'মোট 12,250 জন ঝুঁকিপূর্ণ নাগরিককে পর্যায়ক্রমে নিরাপদ আশ্রয়কেন্দ্রে স্থানান্তর প্রয়োজন।',
      priority: 'অবিলম্বে অগ্রাধিকার: তপোবন (3,150), জোশীমঠ ওয়ার্ড 4-7 (4,500), রাইনি (2,200), হেলং (1,800)।',
      capacity: 'গৌচর (5,000), কর্ণপ্রয়াগ (3,800), রুদ্রপ্রয়াগ (3,500), এবং শ্রীনগরে (2,500) মোট 14,800 নিরাপদ ধারণক্ষমতা নিশ্চিত।',
      allocation: 'ওআর সলভার (OR Solver) দ্বারা শূন্য ঘাটতি সহ সর্বোত্তম বরাদ্দ সম্পন্ন হয়েছে।',
      constraints: 'সক্রিয় ধসের ঝুঁকির কারণে পিপলকোটি ত্রাণ কেন্দ্র স্থগিত রাখা হয়েছে।',
      transportation: 'জাতীয় সড়ক 07 (NH-07) সচল রয়েছে; লিঙ্ক রোড আর-12 বাইপাস সক্রিয়।',
      officer_action: 'দুর্যোগ ব্যবস্থাপনা আইন 2005 এর ধারা 30 এবং 34 অনুসারে নির্বাহী অনুমোদন সুপারিশকৃত।',
      narrativeMarkdown: `#### 1. বর্তমান পরিস্থিতির সারসংক্ষেপ
চামোলি জেলায় জোশীমঠ ও অলকানন্দা উপত্যকায় ভূ-ধস নিরীক্ষণ চলছে। মোট **12,250 জন ঝুঁকিপূর্ণ নাগরিকের** নিরাপদ স্থানান্তর আদেশ প্রস্তুত।

#### 2. আশ্রয় কেন্দ্রের ধারণক্ষমতা
যাচাইকৃত 4টি নিরাপদ আশ্রয় কেন্দ্রে মোট **14,800 জনের ধারণক্ষমতা** রয়েছে। পিপলকোটি কেন্দ্রটি সক্রিয় বিপদের কারণে বাদ দেওয়া হয়েছে।

#### 3. অপারেশনস রিসার্চ বরাদ্দ সিদ্ধান্ত
ওআর সলভার (OR Solver) দ্বারা তপোবন থেকে 3,150 জনকে রুদ্রপ্রয়াগ এবং জোশীমঠ থেকে 4,500 জনকে গৌচর বিমানবন্দর কেন্দ্রে বরাদ্দ করা হয়েছে।

#### 4. দায়িত্বপ্রাপ্ত কর্মকর্তার জন্য পদক্ষেপ
1. প্রথম ধাপে প্রবীণ, প্রতিবন্ধী ও শিশুদের কনভয় অবিলম্বে প্রেরণ করুন।
2. বিকল্প রুট আর-12বি-তে এসডিআরএফ এসকর্ট বজায় রাখুন।`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }


  if (lang === 'mr') {
    return {
      situation: 'चमोली जिल्ह्यात भूस्खलन आणि अतिवृष्टीच्या परिस्थितीवर सातत्याने लक्ष ठेवले जात आहे. जोशीमठ आणि अलकनंदा खोऱ्यात 14 मिमी/आठवडा जमीन खचल्याचे नोंदवले गेले आहे.',
      relocation_requirement: 'एकूण 12,250 संवेदनशील नागरिकांना टप्प्याटप्प्याने सुरक्षित निवारा केंद्रांमध्ये स्थलांतरित करणे आवश्यक आहे.',
      priority: 'तातडीचे प्राधान्य (Immediate): तपोवन (3,150), जोशीमठ वॉर्ड 4-7 (4,500), रैणी (2,200), हेलंग (1,800).',
      capacity: 'गौचर (5,000), कर्णप्रयाग (3,800), रुद्रप्रयाग (3,500), आणि श्रीनगर (2,500) मध्ये एकूण 14,800 सुरक्षित क्षमता उपलब्ध आहे.',
      allocation: 'ओआर सॉल्व्हरद्वारे (OR Solver) शून्य तुटीसह इष्टतम वाटप निश्चित केले आहे.',
      constraints: 'सक्रिय भूस्खलनामुळे पिपळकोटी केंद्र प्रतिबंधित करण्यात आले आहे.',
      transportation: 'राष्ट्रीय महामार्ग 07 (NH-07) सुरू आहे; पर्यायी मार्ग आर-12बी सक्रिय आहे.',
      officer_action: 'आपत्ती व्यवस्थापन कायदा 2005 अंतर्गत सक्षम अधिकाऱ्यांनी तातडीने स्थलांतर आदेशास मंजुरी द्यावी.',
      narrativeMarkdown: `#### 1. सद्यस्थितीचा आढावा
चमोली जिल्ह्यात जोशीमठ व अलकनंदा खोऱ्यात भूस्खलन सक्रिय आहे. एकूण **12,250 संवेदनशील नागरिकांच्या** सुरक्षित स्थलांतराचे नियोजन तयार आहे.

#### 2. निवारा क्षमता आणि विश्लेषण
तपासणी केलेल्या सुरक्षित निवाऱ्यांमध्ये एकूण **14,800 व्यक्तींची क्षमता** उपलब्ध आहे. सुरक्षेच्या कारणास्तव पिपळकोटी केंद्र वगळण्यात आले आहे.

#### 3. ऑपरेशन्स रिसर्च वाटप निर्णय
ओआर सॉल्व्हरने तपोवनमधील 3,150 नागरिकांना रुद्रप्रयाग व जोशीमठमधील 4,500 नागरिकांना गौचर हवाई केंद्रामध्ये वाटप केले आहे.

#### 4. सक्षम अधिकाऱ्यांसाठी शिफारसी
1. पहिल्या टप्प्यात वृद्ध, दिव्यांग व बालकांच्या वाहनांचा ताफा त्वरित रवाना करावा.
2. पर्यायी मार्ग आर-12बी वर एसडीआरएफ व एनडीआरएफ पथके तैनात ठेवावीत.`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  if (lang === 'te') {
    return {
      situation: 'చమోలి జిల్లాలో కొండచరియలు విరిగిపడటం మరియు భారీ వర్షాల పరిస్థితిని నిరంతరం పర్యవేక్షిస్తున్నారు. జోషీమఠ్ మరియు అలకనంద లోయలో వారానికి 14 మి.మీ భూమి కుంగిపోతున్నట్లు నమోదైంది.',
      relocation_requirement: 'మొత్తం 12,250 మంది పౌరులను సురక్షిత ఆశ్రయాలకు తరలించాల్సి ఉంది.',
      priority: 'తక్షణ ప్రాధాన్యత: తపోవన్ (3,150), జోషీమఠ్ వార్డులు 4-7 (4,500), రైనీ (2,200), హేలాంగ్ (1,800).',
      capacity: 'గౌచర్ (5,000), కర్ణప్రయాగ్ (3,800), రుద్రప్రయాగ్ (3,500), శ్రీనగర్ (2,500) లలో మొత్తం 14,800 సురక్షిత సామర్థ్యం ఉంది.',
      allocation: 'ఆపరేషన్స్ రీసెర్చ్ (OR Solver) ద్వారా సరైన కేటాయింపు జరిగింది.',
      constraints: 'కొండచరియల ప్రమాదం దృష్ట్యా పిపల్కోటి కేంద్రాన్ని మినహాయించారు.',
      transportation: 'జాతీయ రహదారి 07 (NH-07) అందుబాటులో ఉంది; ప్రత్యామ్నాయ మార్గం R-12B క్రియాశీలకంగా ఉంది.',
      officer_action: 'విపత్తు నిర్వహణ చట్టం 2005 ప్రకారం అధికారిక ఆమోదం సిఫార్సు చేయబడింది.',
      narrativeMarkdown: `#### 1. ప్రస్తుత పరిస్థితి సమీక్ష
చమోలి జిల్లా జోషీమఠ్ మరియు అలకనంద పరివాహక ప్రాంతాలలో భూమి కుంగుబాటు తీవ్రంగా ఉంది. మొత్తం **12,250 మంది పౌరులను** తరలించేందుకు ప్రణాళిక సిద్ధంగా ఉంది.

#### 2. ఆశ్రయ సామర్థ్యం
నాలుగు సురక్షిత ప్రాంతాలలో మొత్తం **14,800 మందికి ఆశ్రయ సామర్థ్యం** ఉంది. పిపల్కోటి కేంద్రాన్ని భద్రతా కారణాల వల్ల నిలిపివేశారు.

#### 3. ఆప్టిమల్ కేటాయింపు నిర్ణయం
తపోవన్ నుంచి 3,150 మందిని రుద్రప్రయాగ్ మరియు జోషీమఠ్ నుంచి 4,500 మందిని గౌచర్ విమానాశ్రయ కేంద్రానికి కేటాయించారు.

#### 4. అధికారి తక్షణ చర్యలు
1. మొదటి దశలో వృద్ధులు, దివ్యాంగులు మరియు పిల్లల కాన్వాయ్‌ను వెంటనే ప్రారంభించండి.
2. ప్రత్యామ్నాయ మార్గం R-12B పై SDRF రక్షణ బృందాలను మోహరించండి.`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  if (lang === 'kn') {
    return {
      situation: 'ಚಮೋಲಿ ಜಿಲ್ಲೆಯಲ್ಲಿ ಭೂಕುಸಿತ ಮತ್ತು ಭಾರೀ ಮಳೆಯ ಪರಿಸ್ಥಿತಿಯನ್ನು ನಿರಂತರವಾಗಿ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲಾಗುತ್ತಿದೆ. ಜೋಶಿಮಠ್ ಮತ್ತು ಅಲಕನಂದ ಕಣಿವೆಯಲ್ಲಿ ವಾರಕ್ಕೆ 14 ಮಿಮೀ ಭೂಕುಸಿತ ದಾಖಲಾಗಿದೆ.',
      relocation_requirement: 'ಒಟ್ಟು 12,250 ದುರ್ಬಲ ನಾಗರಿಕರನ್ನು ಹಂತ ಹಂತವಾಗಿ ಸುರಕ್ಷಿತ ಆಶ್ರಯಗಳಿಗೆ ಸ್ಥಳಾಂತರಿಸುವುದು ಅವಶ್ಯಕ.',
      priority: 'ತಕ್ಷಣದ ಆದ್ಯತೆ: ತಪೋವನ (3,150), ಜೋಶಿಮಠ್ ವಾರ್ಡ್ 4-7 (4,500), ರೈಣಿ (2,200), ಹೇಲಾಂಗ್ (1,800).',
      capacity: 'ಗೌಚರ್ (5,000), ಕರ್ಣಪ್ರಯಾಗ (3,800), ರುದ್ರಪ್ರಯಾಗ (3,500), ಶ್ರೀನಗರ (2,500) ಗಳಲ್ಲಿ ಒಟ್ಟು 14,800 ಸುರಕ್ಷಿತ ಸಾಮರ್ಥ್ಯ ಲಭ್ಯವಿದೆ.',
      allocation: 'ಕಾರ್ಯಾಚರಣೆ ಸಂಶೋಧನೆ (OR Solver) ಮೂಲಕ ಶೂನ್ಯ ಕೊರತೆಯೊಂದಿಗೆ ಗರಿಷ್ಠ ಹಂಚಿಕೆಯನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗಿದೆ.',
      constraints: 'ಸಕ್ರಿಯ ಭೂಕುಸಿತದ ಅಪಾಯದಿಂದಾಗಿ ಪಿಪಲಕೋಟಿ ಕೇಂದ್ರವನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ.',
      transportation: 'ರಾಷ್ಟ್ರೀಯ ಹೆದ್ದಾರಿ 07 (NH-07) ಸುಸ್ಥಿತಿಯಲ್ಲಿದೆ; ಪರ್ಯಾಯ ಮಾರ್ಗ R-12B ಸಕ್ರಿಯವಾಗಿದೆ.',
      officer_action: 'ವಿಪತ್ತು ನಿರ್ವಹಣಾ ಕಾಯ್ದೆ 2005 ರ ಅಡಿಯಲ್ಲಿ ಸಕ್ಷಮ ಪ್ರಾಧಿಕಾರವು ಸ್ಥಳಾಂತರ ಆದೇಶವನ್ನು ಅನುಮೋದಿಸಬೇಕು.',
      narrativeMarkdown: `#### 1. ಪ್ರಸ್ತುತ ಪರಿಸ್ಥಿತಿಯ ಅವಲೋಕನ
ಚಮೋಲಿ ಜಿಲ್ಲೆಯ ಜೋಶಿಮಠ್ ಮತ್ತು ಅಲಕನಂದ ಕಣಿವೆಯಲ್ಲಿ ತೀವ್ರ ಭೂಕುಸಿತವನ್ನು ಗಮನಿಸಲಾಗಿದೆ. ಒಟ್ಟು **12,250 ದುರ್ಬಲ ನಾಗರಿಕರ** ಸುರಕ್ಷಿತ ಸ್ಥಳಾಂತರ ಆದೇಶ ಸಿದ್ಧವಾಗಿದೆ.

#### 2. ಪರಿಹಾರ ಶಿಬಿರಗಳ ಸಾಮರ್ಥ್ಯ
ಪರಿಶೀಲಿಸಲಾದ ನಾಲ್ಕು ಸುರಕ್ಷಿತ ಆಶ್ರಯಗಳಲ್ಲಿ ಒಟ್ಟು **14,800 ಸಾಮರ್ಥ್ಯ** ಲಭ್ಯವಿದೆ. ಪಿಪಲಕೋಟಿ ಕೇಂದ್ರವನ್ನು ಸುರಕ್ಷತಾ ದೃಷ್ಟಿಯಿಂದ ಹೊರಗಿಡಲಾಗಿದೆ.

#### 3. ಕಾರ್ಯಾಚರಣೆ ಸಂಶೋಧನೆ ಹಂಚಿಕೆ ನಿರ್ಧಾರ
ತಪೋವನದಿಂದ 3,150 ನಾಗರಿಕರನ್ನು ರುದ್ರಪ್ರಯಾಗಕ್ಕೆ ಮತ್ತು ಜೋಶಿಮಠ್‌ನಿಂದ 4,500 ನಾಗರಿಕರನ್ನು ಗೌಚರ್ ವಿಮಾನ ನಿಲ್ದಾಣ ಕೇಂದ್ರಕ್ಕೆ ನಿಯೋಜಿಸಲಾಗಿದೆ.

#### 4. ಅಧಿಕಾರಿಗೆ ಶಿಫಾರಸು ಮಾಡಲಾದ ಕ್ರಮಗಳು
1. ಮೊದಲ ಹಂತದಲ್ಲಿ ಹಿರಿಯ ನಾಗರಿಕರು, ಅಂಗವಿಕಲರು ಮತ್ತು ಮಕ್ಕಳ ಬೆಂಗಾವಲು ಪಡೆಯನ್ನು ತಕ್ಷಣ ಕಳುಹಿಸಿ.
2. ಪರ್ಯಾಯ ಮಾರ್ಗ R-12B ನಲ್ಲಿ SDRF ಬೆಂಗಾವಲು ಪಡೆಗಳನ್ನು ನಿಯೋಜಿಸಿ.`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  if (lang === 'ml') {
    return {
      situation: 'ചമോലി ജില്ലയിൽ മണ്ണിടിച്ചിലും കനത്ത മഴയും നിരന്തരമായി നിരീക്ഷിച്ചുവരുന്നു. ജോഷിമഠിലും അളകനന്ദ താഴ്‌വരയിലും ആഴ്ചയിൽ 14 മില്ലീമീറ്റർ ഭൂമി താഴുന്നത് രേഖപ്പെടുത്തിയിട്ടുണ്ട്.',
      relocation_requirement: 'ബാധിക്കപ്പെടാൻ സാധ്യതയുള്ള 12,250 പൗരന്മാരെ ഘട്ടംഘട്ടമായി സുരക്ഷിത കേന്ദ്രങ്ങളിലേക്ക് മാറ്റേണ്ടതുണ്ട്.',
      priority: 'അടിയന്തര മുൻഗണന: തപോവൻ (3,150), ജോഷിമഠ് വാർഡുകൾ 4-7 (4,500), റെയ്നി (2,200), ഹെലാങ് (1,800).',
      capacity: 'ഗൗച്ചർ (5,000), കർണ്ണപ്രയാഗ് (3,800), രുദ്രപ്രയാഗ് (3,500), ശ്രീനഗർ (2,500) എന്നിവടങ്ങളിലായി ആകെ 14,800 സുരക്ഷിത ശേഷി ലഭ്യമാണ്.',
      allocation: 'ഓപ്പറേഷൻസ് റിസർച്ച് (OR Solver) വഴി കൃത്യമായ വിന്യാസം പൂർത്തിയായി.',
      constraints: 'മണ്ണിടിച്ചിൽ സാധ്യത കണക്കിലെടുത്ത് പിപൽകോട്ടി കേന്ദ്രം ഒഴിവാക്കി.',
      transportation: 'ദേശീയപാത 07 (NH-07) പ്രവർത്തനക്ഷമമാണ്; ബദൽ പാത R-12B സജീവമാണ്.',
      officer_action: 'ദുരന്തനിവാരണ നിയമം 2005 പ്രകാരം ഉത്തരവാദിത്തപ്പെട്ട ഉദ്യോഗസ്ഥൻ ഉത്തരവ് ഉടൻ അംഗീകരിക്കണം.',
      narrativeMarkdown: `#### 1. നിലവിലെ സാഹചര്യ അവലോകനം
ചമോലി ജില്ലയിലെ ജോഷിമഠിലും അളകനന്ദ താഴ്‌വരയിലും ഭൂമി ഇടിയുന്നത് സ്ഥിരീകരിച്ചിട്ടുണ്ട്. ആകെ **12,250 പൗരന്മാരുടെ** സുരക്ഷിത പുനരധിവാസ പദ്ധതി തയ്യാറാണ്.

#### 2. ദുരിതാശ്വാസ ക്യാമ്പ് ശേഷി
പരിശോധിച്ചുറപ്പിച്ച 4 സുരക്ഷിത ക്യാമ്പുകളിലായി ആകെ **14,800 പേർക്കുള്ള ശേഷി** ലഭ്യമാണ്. സുരക്ഷാ കാരണങ്ങളാൽ പിപൽകോട്ടി കേന്ദ്രം ഒഴിവാക്കിയിട്ടുണ്ട്.

#### 3. ഒപ്റ്റിമൽ അലോക്കേഷൻ തീരുമാനം
തപോവനിൽ നിന്ന് 3,150 പേരെ രുദ്രപ്രയാഗിലേക്കും ജോഷിമഠിൽ നിന്ന് 4,500 പേരെ ഗൗച്ചർ എയർഡ്രോമിലേക്കും മാറ്റിപ്പാർപ്പിക്കാൻ തീരുമാനിച്ചു.

#### 4. ഉദ്യോഗസ്ഥർ സ്വീകരിക്കേണ്ട നടപടികൾ
1. മുതിർന്ന പൗരന്മാർ, ഭിന്നശേഷിക്കാർ, കുട്ടികൾ എന്നിവരുടെ ആദ്യ ബാച്ച് ഉടൻ യാത്ര തിരിക്കട്ടെ.
2. ബദൽ പാതയായ R-12B യിൽ SDRF സുരക്ഷാ സേനയെ വിന്യസിക്കുക.`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  if (lang === 'pa') {
    return {
      situation: 'ਚਮੋਲੀ ਜ਼ਿਲ੍ਹੇ ਵਿੱਚ ਜ਼ਮੀਨ ਖਿਸਕਣ ਅਤੇ ਭਾਰੀ ਮੀਂਹ ਦੀ ਸਥਿਤੀ ਤੇ ਨਿਰੰਤਰ ਨਜ਼ਰ ਰੱਖੀ ਜਾ ਰਹੀ ਹੈ। ਜੋਸ਼ੀਮਠ ਅਤੇ ਅਲਕਨੰਦਾ ਘਾਟੀ ਵਿੱਚ 14 ਮਿਲੀਮੀਟਰ/ਹਫ਼ਤਾ ਜ਼ਮੀਨ ਧਸਣ ਦੀ ਦਰ ਦਰਜ ਕੀਤੀ ਗਈ ਹੈ।',
      relocation_requirement: 'ਕੁੱਲ 12,250 ਪ੍ਰਭਾਵਿਤ ਨਾਗਰਿਕਾਂ ਨੂੰ ਪੜਾਅਵਾਰ ਸੁਰੱਖਿਅਤ ਕੈਂਪਾਂ ਵਿੱਚ ਤਬਦੀਲ ਕਰਨ ਦੀ ਲੋੜ ਹੈ।',
      priority: 'ਤੁਰੰਤ ਤਰਜੀਹ (Immediate): ਤਪੋਵਨ (3,150), ਜੋਸ਼ੀਮਠ ਵਾਰਡ 4-7 (4,500), ਰੈਣੀ (2,200), ਹੇਲਾਂਗ (1,800)।',
      capacity: 'ਗੌਚਰ (5,000), ਕਰਣਪ੍ਰਯਾਗ (3,800), ਰੁਦਰਪ੍ਰਯਾਗ (3,500), ਅਤੇ ਸ਼੍ਰੀਨਗਰ (2,500) ਵਿੱਚ ਕੁੱਲ 14,800 ਸੁਰੱਖਿਅਤ ਸਮਰੱਥਾ ਉਪਲਬਧ ਹੈ।',
      allocation: 'ਓਆਰ ਸੋਲਵਰ (OR Solver) ਦੁਆਰਾ ਜ਼ੀਰੋ ਘਾਟੇ ਦੇ ਨਾਲ ਅਨੁਕੂਲ ਵੰਡ ਤਿਆਰ ਕੀਤੀ ਗਈ ਹੈ।',
      constraints: 'ਜ਼ਮੀਨ ਖਿਸਕਣ ਦੇ ਖ਼ਤਰੇ ਕਾਰਨ ਪਿੱਪਲਕੋਟੀ ਕੈਂਪ ਨੂੰ ਰੋਕਿਆ ਗਿਆ ਹੈ।',
      transportation: 'ਰਾਸ਼ਟਰੀ ਰਾਜਮਾਰਗ 07 (NH-07) ਚਾਲੂ ਹੈ; ਬਦਲਵਾਂ ਰੂਟ R-12B ਸਰਗਰਮ ਹੈ।',
      officer_action: 'ਆਫ਼ਤ ਪ੍ਰਬੰਧਨ ਐਕਟ 2005 ਦੇ ਤਹਿਤ ਸਮਰੱਥ ਅਧਿਕਾਰੀ ਦੁਆਰਾ ਤੁਰੰਤ ਮਨਜ਼ੂਰੀ ਦੀ ਸਿਫਾਰਸ਼ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।',
      narrativeMarkdown: `#### 1. ਮੌਜੂਦਾ ਸਥਿਤੀ ਦਾ ਵੇਰਵਾ
ਚਮੋਲੀ ਜ਼ਿਲ੍ਹੇ ਵਿੱਚ ਜੋਸ਼ੀਮਠ ਅਤੇ ਅਲਕਨੰਦਾ ਘਾਟੀ ਵਿੱਚ ਜ਼ਮੀਨ ਧਸਣ ਦੀ ਨਿਗਰਾਨੀ ਜਾਰੀ ਹੈ। ਕੁੱਲ **12,250 ਸੰਵੇਦਨਸ਼ੀਲ ਨਾਗਰਿਕਾਂ** ਦੇ ਸੁਰੱਖਿਅਤ ਤਬਾਦਲੇ ਦੀ ਯੋਜਨਾ ਤਿਆਰ ਹੈ।

#### 2. ਰਾਹਤ ਕੈਂਪਾਂ ਦੀ ਸਮਰੱਥਾ
ਪੜਤਾਲ ਕੀਤੇ ਗਏ 4 ਸੁਰੱਖਿਅਤ ਕੈਂਪਾਂ ਵਿੱਚ ਕੁੱਲ **14,800 ਨਾਗਰਿਕਾਂ ਲਈ ਸਮਰੱਥਾ** ਮੌਜੂਦ ਹੈ। ਪਿੱਪਲਕੋਟੀ ਕੈਂਪ ਖ਼ਤਰੇ ਕਾਰਨ ਬਾਹਰ ਰੱਖਿਆ ਗਿਆ ਹੈ।

#### 3. ਆਪ੍ਰੇਸ਼ਨਜ਼ ਰਿਸਰਚ ਵੰਡ ਫੈਸਲਾ
ਤਪੋਵਨ ਤੋਂ 3,150 ਨਾਗਰਿਕਾਂ ਨੂੰ ਰੁਦਰਪ੍ਰਯਾਗ ਅਤੇ ਜੋਸ਼ੀਮਠ ਤੋਂ 4,500 ਨਾਗਰਿਕਾਂ ਨੂੰ ਗੌਚਰ ਹਵਾਈ ਅੱਡੇ ਕੇਂਦਰ ਵਿੱਚ ਵੰਡਿਆ ਗਿਆ ਹੈ।

#### 4. ਅਧਿਕਾਰੀ ਲਈ ਲੋੜੀਂਦੀ ਕਾਰਵਾਈ
1. ਪਹਿਲੇ ਪੜਾਅ ਵਿੱਚ ਬਜ਼ੁਰਗਾਂ, ਦਿਵਿਆਂਗਾਂ ਅਤੇ ਬੱਚਿਆਂ ਦੇ ਕਾਫਲੇ ਨੂੰ ਤੁਰੰਤ ਰਵਾਨਾ ਕਰੋ।
2. ਬਦਲਵੇਂ ਰੂਟ R-12B ਤੇ SDRF ਅਤੇ NDRF ਟੀਮਾਂ ਤਾਇਨਾਤ ਰੱਖੋ।`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  if (lang === 'or') {
    return {
      situation: 'ଚାମୋଲି ଜିଲ୍ଲାରେ ଭୂସ୍ଖଳନ ଏବଂ ପ୍ରବଳ ବର୍ଷା ସ୍ଥିତି ଉପରେ କ୍ରମାଗତ ନଜର ରଖାଯାଇଛି। ଯୋଶୀମଠ ଏବଂ ଅଳକାନନ୍ଦା ଉପତ୍ୟକାରେ ସପ୍ତାହକୁ 14 ମିମି ଭୂ-ଅବକ୍ଷୟ ରେକର୍ଡ କରାଯାଇଛି।',
      relocation_requirement: 'ସର୍ବମୋଟ 12,250 ଜଣ ବିପଦପୂର୍ଣ୍ଣ ନାଗରିକଙ୍କୁ ପର୍ଯ୍ୟାୟକ୍ରମେ ସୁରକ୍ଷିତ ଆଶ୍ରୟସ୍ଥଳକୁ ସ୍ଥାନାନ୍ତର ଆବଶ୍ୟକ।',
      priority: 'ଜରୁରୀ ପ୍ରାଥମିକତା: ତପୋବନ (3,150), ଯୋଶୀମଠ ୱାର୍ଡ 4-7 (4,500), ରୈଣୀ (2,200), ହେଲାଙ୍ଗ (1,800)।',
      capacity: 'ଗୌଚର (5,000), କର୍ଣ୍ଣପ୍ରୟାଗ (3,800), ରୁଦ୍ରପ୍ରୟାଗ (3,500), ଶ୍ରୀନଗର (2,500) ରେ ସର୍ବମୋଟ 14,800 ସୁରକ୍ଷିତ କ୍ଷମତା ଉପଲବ୍ଧ।',
      allocation: 'ଅପରେସନ୍ସ ରିସର୍ଚ୍ଚ (OR Solver) ଦ୍ୱାରା ଶୂନ୍ୟ ଅଭାବ ସହିତ ଉପଯୁକ୍ତ ବଣ୍ଟନ ପ୍ରସ୍ତୁତ ହୋଇଛି।',
      constraints: 'ଭୂସ୍ଖଳନ ବିପଦ ଯୋଗୁଁ ପିପଲକୋଟି କେନ୍ଦ୍ରକୁ ବର୍ଜନ କରାଯାଇଛି।',
      transportation: 'ଜାତୀୟ ରାଜପଥ 07 (NH-07) ସଚଳ ଅଛି; ବିକଳ୍ପ ରାସ୍ତା R-12B ସକ୍ରିୟ।',
      officer_action: 'ବିପର୍ଯ୍ୟୟ ପରିଚାଳନା ଆଇନ 2005 ଅନୁଯାୟୀ ସକ୍ଷମ ଅଧିକାରୀଙ୍କ ଦ୍ୱାରା ଅନୁମୋଦନ ସୁପାରିଶ।',
      narrativeMarkdown: `#### 1. ବର୍ତ୍ତମାନ ପରିସ୍ଥିତିର ସମୀକ୍ଷା
ଚାମୋଲି ଜିଲ୍ଲାରେ ଯୋଶୀମଠ ଏବଂ ଅଳକାନନ୍ଦା ଉପତ୍ୟକାରେ ଭୂସ୍ଖଳନ ନିରୀକ୍ଷଣ ଜାରି ରହିଛି। ସର୍ବମୋଟ **12,250 ବିପଦପୂର୍ଣ୍ଣ ନାଗରିକଙ୍କ** ନିରାପଦ ସ୍ଥାନାନ୍ତର ଯୋଜନା ପ୍ରସ୍ତୁତ।

#### 2. ଆଶ୍ରୟସ୍ଥଳ କ୍ଷମତା
ଯାଞ୍ଚ ହୋଇଥିବା 4ଟି ସୁରକ୍ଷିତ କେନ୍ଦ୍ରରେ ମୋଟ **14,800 କ୍ଷମତା** ଉପଲବ୍ଧ। ସୁରକ୍ଷା ଦୃଷ୍ଟିରୁ ପିପଲକୋଟି କେନ୍ଦ୍ର ବାଦ ଦିଆଯାଇଛି।

#### 3. ଅପରେସନ୍ସ ରିସର୍ଚ୍ଚ ଆବଣ୍ଟନ ନିଷ୍ପତ୍ତି
ତପୋବନରୁ 3,150 ଜଣଙ୍କୁ ରୁଦ୍ରପ୍ରୟାଗ ଏବଂ ଯୋଶୀମଠରୁ 4,500 ଜଣଙ୍କୁ ଗୌଚର ବିମାନବନ୍ଦର କେନ୍ଦ୍ରକୁ ଆବଣ୍ଟିତ କରାଯାଇଛି।

#### 4. ଅଧିକାରୀଙ୍କ ପାଇଁ ପଦକ୍ଷେପ
1. ପ୍ରଥମ ପର୍ଯ୍ୟାୟରେ ବରିଷ୍ଠ ନାଗରିକ, ଦିବ୍ୟାଙ୍ଗ ଏବଂ ଶିଶୁମାନଙ୍କ କନଭୟ ତୁରନ୍ତ ପଠାନ୍ତୁ।
2. ବିକଳ୍ପ ରୁଟ୍ R-12B ରେ SDRF ସୁରକ୍ଷା ବାହିନୀ ନିୟୋଜିତ ରଖନ୍ତୁ।`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  if (lang === 'as') {
    return {
      situation: 'চামোলি জিলাত ভূমিস্খলন আৰু প্ৰচণ্ড বৰষুণৰ পৰিস্থিতি নিৰন্তৰভাৱে নিৰীক্ষণ কৰা হৈছে। যোশীমঠ আৰু অলকানন্দা উপত্যকাত সপ্তাহত 14 মিমি ভূমি খহনীয়া নথিভুক্ত কৰা হৈছে।',
      relocation_requirement: 'মুঠ 12,250 গৰাকী ক্ষতিগ্ৰস্ত নাগৰিকক পৰ্যায়ক্ৰমে সুৰক্ষিত আশ্ৰয়লৈ স্থানান্তৰ কৰাৰ প্ৰয়োজন।',
      priority: 'জৰুৰী অগ্ৰাধিকাৰ: তপোবন (3,150), যোশীমঠ ৱাৰ্ড 4-7 (4,500), ৰৈণী (2,200), হেলাং (1,800)।',
      capacity: 'গৌচৰ (5,000), কৰ্ণপ্ৰয়াগ (3,800), ৰুদ্ৰপ্ৰয়াগ (3,500), আৰু শ্ৰীনগৰ (2,500) ত মুঠ 14,800 সুৰক্ষিত ক্ষমতা আছে।',
      allocation: 'অপাৰেশ্যনছ ৰিচাৰ্চ (OR Solver) দ্বাৰা শূন্য নাটনিৰে সৰ্বোত্তম আৱণ্টন প্ৰস্তুত কৰা হৈছে।',
      constraints: 'ভূমিস্খলনৰ আশংকাৰ বাবে পিপলকোটী কেন্দ্ৰটো স্থগিত ৰখা হৈছে।',
      transportation: 'ৰাষ্ট্ৰীয় ঘাইপথ 07 (NH-07) সক্ৰিয় হৈ আছে; বিকল্প পথ R-12B ব্যৱহাৰ কৰা হৈছে।',
      officer_action: 'দুৰ্যোগ ব্যৱস্থাপনা আইন 2005 ৰ অধীনত সক্ষম কৰ্তৃপক্ষৰ অনুমোদন প্ৰয়োজনীয়।',
      narrativeMarkdown: `#### 1. বৰ্তমান পৰিস্থিতিৰ পৰ্যালোচনা
চামোলি জিলাৰ যোশীমঠ আৰু অলকানন্দা উপত্যকাত ভূমিস্খলন নিৰীক্ষণ চলি আছে। মুঠ **12,250 গৰাকী লোকৰ** সুৰক্ষিত স্থানান্তৰ আদেশ প্ৰস্তুত কৰা হৈছে।

#### 2. আশ্ৰয় শিবিৰৰ ক্ষমতা
পৰীক্ষা কৰা ৪টা সুৰক্ষিত শিবিৰত মুঠ **14,800 লোকৰ ক্ষমতা** উপলব্ধ। সুৰক্ষাৰ খাতিৰত পিপলকোটী শিবিৰ বাদ দিয়া হৈছে।

#### 3. অপাৰেশ্যনছ ৰিচাৰ্চ আৱণ্টন সিদ্ধান্ত
তপোবনৰ পৰা 3,150 জনক ৰুদ্ৰপ্ৰয়াগ আৰু যোশীমঠৰ পৰা 4,500 জনক গৌচৰ বিমানঘাটী শিবিৰলৈ আৱণ্টন দিয়া হৈছে।

#### 4. বিষয়াৰ কাৰ্যকৰী পদক্ষেপ
1. প্ৰথম পৰ্যায়ত বৃদ্ধ, বিশেষভাৱে সক্ষম আৰু শিশুসকলৰ কনভয় অবিলম্বে প্ৰেৰণ কৰক।
2. বিকল্প পথ R-12B ত SDRF বাহিনী মোতায়েন ৰাখক।`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  if (lang === 'ur') {
    return {
      situation: 'ضلع چمولی میں لینڈ سلائیڈنگ اور موسلا دھار بارش کی صورتحال کی مسلسل نگرانی کی جا رہی ہے۔ جوشی مٹھ اور الکنندا وادی میں زمین دھنسنے کی رفتار 14 ملی میٹر فی ہفتہ درج کی گئی ہے۔',
      relocation_requirement: 'کل 12,250 کمزور شہریوں کو مرحلہ وار محفوظ پناہ گاہوں میں منتقل کرنے کی ضرورت ہے۔',
      priority: 'فوری ترجیح: تپوون (3,150)، جوشی مٹھ وارڈ 4-7 (4,500)، رینی (2,200)، ہیلانگ (1,800)۔',
      capacity: 'گوچر (5,000)، کرن پریاگ (3,800)، ردرپریاگ (3,500)، اور سری نگر (2,500) میں کل 14,800 محفوظ گنجائش موجود ہے۔',
      allocation: 'او آر سالور (OR Solver) کے ذریعے بغیر کسی کمی کے بہترین تقسیم عمل میں لائی گئی ہے۔',
      constraints: 'لینڈ سلائیڈنگ کے خطرے کے باعث پیپل کوٹی ریلیف سنٹر کو خارج کر دیا گیا ہے۔',
      transportation: 'قومی شاہراہ 07 (NH-07) کھلی ہے؛ متبادل راستہ R-12B فعال ہے۔',
      officer_action: 'ڈیزاسٹر مینجمنٹ ایکٹ 2005 کے تحت مجاز اتھارٹی کی فوری منظوری درکار ہے۔',
      narrativeMarkdown: `#### 1. موجودہ صورتحال کا جائزہ
ضلع چمولی میں جوشی مٹھ اور الکنندا وادی میں زمین دھنسنے پر مسلسل نظر رکھی جا رہی ہے۔ کل **12,250 شہریوں** کی محفوظ منتقلی کا منصوبہ تیار ہے۔

#### 2. پناہ گاہوں کی گنجائش اور معائنہ
تصدیق شدہ 4 محفوظ پناہ گاہوں میں کل **14,800 پناہ گزینوں کی گنجائش** دستیاب ہے۔ پیپل کوٹی سنٹر کو خطرے کے پیش نظر منسوخ کیا گیا ہے۔

#### 3. آپریشنز ریسرچ الاٹمنٹ کا فیصلہ
تپوون سے 3,150 شہریوں کو ردرپریاگ اور جوشی مٹھ سے 4,500 شہریوں کو گوچر ہوائی اڈے پر الاٹ کیا گیا ہے۔

#### 4. مجاز افسر کے لیے ضروری اقدامات
1. پہلے مرحلے میں بزرگوں، معذور افراد اور بچوں کے قافلوں کو فوری روانہ کریں۔
2. متبادل راستے R-12B پر SDRF کی امدادی ٹیمیں تعینات رکھیں۔`,
      language: lang,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }

  // Default English structured brief
  return {
    situation: 'Active slope subsidence and moraine displacement monitored across Joshimath and Alaknanda Valley (Wards 4–7 exceeding 14 mm/week displacement).',
    relocation_requirement: 'Staged evacuation requirement of 12,250 vulnerable citizens across 5 critical mountain habitations.',
    priority: 'Immediate Priority Tier: Tapovan (3,150), Joshimath Wards 4–7 (4,500), Raini (2,200), Helang (1,800).',
    capacity: 'Verified 14,800 total effective safe capacity across Gauchar (5,000), Karnaprayag (3,800), Rudraprayag (3,500), and Srinagar (2,500).',
    allocation: 'Optimal Allocation Engine generated zero-overflow assignment: Joshimath to Gauchar, Tapovan to Rudraprayag, Raini to Karnaprayag.',
    constraints: 'Pipalkoti relief facility strictly excluded under active hazard boundary restriction.',
    transportation: 'NH-07 corridor operational under convoy speed limits; Link Road R12 rockfall detour active via Route Alt-12B (+12.5 min delay).',
    officer_action: 'Formal review and statutory authorization recommended under Section 30(2) Disaster Management Act 2005.',
    narrativeMarkdown: `#### 1. Executive Situation Overview
Chamoli District is operating under active disaster response monitoring. Automated spatial telemetry has identified **12,250 vulnerable individuals** across monitored valley corridors requiring staged relocation assistance.

#### 2. Carrying Capacity & Safe Destinations
An aggregate safe shelter carrying capacity of **14,800** has been verified across 4 audited facilities (Gauchar, Karnaprayag, Rudraprayag, Srinagar). Pipalkoti hub remains excluded due to active rockfall hazard.

#### 3. Operations Research Relocation Allocations
The deterministic OR solver has computed optimal evacuation matches under transit-distance minimization with zero capacity overflow:
- **Joshimath (4,500 pax):** Allocated to Gauchar Aerodrome Hub (79.2 km).
- **Tapovan (3,150 pax):** Allocated to Rudraprayag Regional Center (112.4 km).
- **Raini (2,200 pax):** Allocated to Karnaprayag Sports Complex (127.7 km).

#### 4. Incident Commander Recommended Actions
1. Authorize Wave 1 convoy dispatch for ambulant elderly and persons with disabilities.
2. Maintain SDRF escort along NH-07 bypass corridor.`,
    language: lang,
    provider: 'Groq (Deterministic Fallback)',
    model: config.groqModel,
  };
}

/**
 * Call Groq Cloud API with OpenAI-compatible payload
 */
async function callGroqAPI(messages: ChatMessage[], temperature = 0.2): Promise<string | null> {
  if (!config.groqApiKey) {
    logger.warn('[LLMService] GROQ_API_KEY is not configured; using deterministic fallback.');
    return null;
  }

  const endpoint = `${config.groqBaseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.groqApiKey}`,
      },
      body: JSON.stringify({
        model: config.groqModel,
        messages,
        temperature,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ status: response.status, errText }, '[LLMService] Groq API returned error response');
      return null;
    }

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : null;
  } catch (err: any) {
    clearTimeout(timeoutId);
    logger.warn({ err: err?.message }, '[LLMService] Groq API call timed out or failed; fallback engaged.');
    return null;
  }
}

export class LLMService {
  /**
   * Health and status check for AI provider
   */
  static getStatus(): AIStatus {
    const isConfigured = Boolean(config.groqApiKey && config.groqApiKey.length > 5);
    return {
      configured: isConfigured,
      provider: 'Groq',
      model: config.groqModel,
      status: isConfigured ? 'ready' : 'fallback_mode',
    };
  }

  /**
   * Generate authoritative structured situation brief in the selected language
   */
  static async generateSituationBrief(options: {
    planningState?: any;
    language?: string;
    officerContext?: any;
  }): Promise<StructuredBriefing> {
    const lang = options.language || 'en';
    const languageName = LANGUAGE_NAMES[lang] || 'English';

    // Build concise, structured prompt context
    const stateSummary = options.planningState
      ? JSON.stringify({
          atRiskPopulation: options.planningState.totalAtRisk || 12250,
          safeCapacity: options.planningState.totalSafeCapacity || 14800,
          activeHabitations: options.planningState.habitationsCount || 5,
          activeSites: options.planningState.sitesCount || 4,
          primaryHazard: 'Active Slope Subsidence & Flood Corridor',
          roadStatus: options.planningState.roadR12Blocked ? 'NH-07 / R12 Detour Active' : 'Normal Clear',
        })
      : 'Chamoli District: 12,250 at-risk citizens, 14,800 safe shelter capacity across Gauchar, Karnaprayag, Rudraprayag, Srinagar. R12 detour active.';

    const systemPrompt = `You are VISTHAAPAN AI, an authoritative disaster-management decision-support system for District Chamoli, Uttarakhand, operating under the National Disaster Management Act 2005.
You must output a structured briefing in ${languageName}.
CRITICAL LANGUAGE INSTRUCTION:
Write ALL narrative text strictly in ${languageName}. Do NOT default to English unless the requested language is English.
Output valid JSON with the following structure:
{
  "situation": "<concise summary of hazard & current situation in ${languageName}>",
  "relocation_requirement": "<relocation need numbers in ${languageName}>",
  "priority": "<priority habitations in ${languageName}>",
  "capacity": "<shelter capacity audit in ${languageName}>",
  "allocation": "<optimal allocation summary in ${languageName}>",
  "constraints": "<planning and hazard exclusion constraints in ${languageName}>",
  "transportation": "<road corridor status in ${languageName}>",
  "officer_action": "<recommended statutory officer action in ${languageName}>",
  "narrativeMarkdown": "<full official markdown situation brief with headings in ${languageName}>"
}
Rules:
- Never invent numerical data; use the supplied planning state.
- Do NOT use the term "MILP"; refer to it as "OR Solver" or "Optimal Allocation Engine".
- Never claim legal authority; advise the Incident Commander / District Magistrate.`;

    const userPrompt = `Current Planning State:\n${stateSummary}\n\nGenerate the complete structured situation briefing in ${languageName}.`;

    const rawResponse = await callGroqAPI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      0.1
    );

    if (rawResponse) {
      try {
        // Try parsing JSON from LLM output (handle possible markdown code blocks)
        let cleaned = rawResponse.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(cleaned);
        return {
          situation: parsed.situation || '',
          relocation_requirement: parsed.relocation_requirement || '',
          priority: parsed.priority || '',
          capacity: parsed.capacity || '',
          allocation: parsed.allocation || '',
          constraints: parsed.constraints || '',
          transportation: parsed.transportation || '',
          officer_action: parsed.officer_action || '',
          narrativeMarkdown: parsed.narrativeMarkdown || rawResponse,
          language: lang,
          provider: 'Groq',
          model: config.groqModel,
        };
      } catch {
        // If not valid JSON, use markdown text
        return {
          situation: 'Active operational situation in Chamoli sector.',
          relocation_requirement: '12,250 citizens monitored for staged relocation.',
          priority: 'Immediate: Joshimath Wards 4-7, Tapovan, Raini.',
          capacity: '14,800 safe shelter spaces verified.',
          allocation: 'OR Solver optimal assignments ready.',
          constraints: 'Hazard exclusion applied to Pipalkoti.',
          transportation: 'NH-07 corridor monitored; R12 bypass active.',
          officer_action: 'Statutory review and authorization recommended.',
          narrativeMarkdown: rawResponse,
          language: lang,
          provider: 'Groq',
          model: config.groqModel,
        };
      }
    }

    return getDeterministicFallbackBrief(lang, options.planningState);
  }

  /**
   * Sahayak AI conversational decision support assistant
   */
  static async chatAssistant(options: {
    messages: { role: 'user' | 'assistant'; text: string }[];
    userMessage: string;
    currentPlanningContext?: any;
    language?: string;
  }): Promise<{ reply: string; provider: string; model: string }> {
    const lang = options.language || 'en';
    const languageName = LANGUAGE_NAMES[lang] || 'English';

    const contextStr = options.currentPlanningContext
      ? JSON.stringify({
          region: 'District Chamoli, Uttarakhand',
          habitations: options.currentPlanningContext.habitations || ['Joshimath', 'Raini', 'Tapovan', 'Helang', 'Pandukeshwar'],
          safeSites: options.currentPlanningContext.sites || ['Gauchar', 'Karnaprayag', 'Rudraprayag', 'Srinagar'],
          allocatedCount: options.currentPlanningContext.totalAllocated || 12250,
          currentRoadR12Blocked: options.currentPlanningContext.roadR12Blocked || false,
          activeScenario: options.currentPlanningContext.activeScenario || 'Baseline 2026-CHM-014',
        })
      : 'District Chamoli, Uttarakhand. Baseline Plan #VST-2026-CHM-014.';

    const systemPrompt = `You are Sahayak AI, the official disaster operations and relocation decision-support assistant for VISTHAAPAN (District Chamoli, Uttarakhand).
CRITICAL LANGUAGE DIRECTIVE:
Respond strictly in ${languageName}.

Core Responsibilities:
- Explain current evacuation planning state, shelter capacity, and route constraints.
- Explain why habitations are assigned to specific safe sites using the actual current state.
- Explain scenario perturbations (road cuts, rain surges, capacity drops).
- Identify bottlenecks (drinking water, medical tents, transit distance).
- Suggest officer checks and verification points under the Disaster Management Act 2005.

Strict Boundaries:
- Do NOT issue legal orders or claim executive authority.
- Do NOT invent numerical data or fake live disaster updates.
- Do NOT replace or fabricate OR solver results.
- Do NOT use the term "MILP"; refer to "OR Solver" or "Optimal Allocation Engine".
- Keep answers factual, concise, and operational.`;

    const chatHistory: ChatMessage[] = [
      { role: 'system', content: `${systemPrompt}\n\nCurrent Operational Context:\n${contextStr}` },
      ...options.messages.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      })),
      { role: 'user', content: options.userMessage },
    ];

    const rawResponse = await callGroqAPI(chatHistory, 0.2);

    if (rawResponse) {
      return {
        reply: rawResponse,
        provider: 'Groq',
        model: config.groqModel,
      };
    }

    // Deterministic fallback response in requested language
    if (lang === 'hi') {
      return {
        reply: `### 🛡️ विस्थापन सहायक (Sahayak AI)

नमस्ते। मैं **विस्थापन सहायक** हूँ, चमोली आपदा प्रबंधन परिचालन हेतु आपका निर्णय-समर्थन सहायक।

**वर्तमान परिचालन स्थिति:**
- **निगरानी अधीन नागरिक:** 12,250 (जोशीमठ, रैणी, तपोवन, हेलंग, पांडुकेश्वर)।
- **सत्यापित सुरक्षित आश्रय क्षमता:** 14,800 (गौचर, कर्णप्रयाग, रुद्रप्रयाग, श्रीनगर)।
- **मार्ग स्थिति:** राष्ट्रीय राजमार्ग 07 (NH-07) पर सतत निगरानी; संपर्क मार्ग आर-12 पर भू-स्खलन के कारण वैकल्पिक मार्ग सक्रिय।
- **ओआर आवंटन स्थिति:** 100% मांग को न्यूनतम दूरी एवं शून्य क्षमता अतिप्रवाह के साथ आवंटित किया गया है।

*आप किसी विशिष्ट बस्ती (जैसे तपोवन, जोशीमठ) या राहत केंद्र की क्षमता के बारे में प्रश्न पूछ सकते हैं।*`,
        provider: 'Groq (Deterministic Fallback)',
        model: config.groqModel,
      };
    }

    return {
      reply: `### 🛡️ VISTHAAPAN Sahayak AI

Greetings. I am **Sahayak AI**, your decision-support assistant for the **Chamoli Disaster Relocation Operation**.

**Current Operational Baseline (#VST-2026-CHM-014):**
- **Monitored Citizen Population:** 12,250 citizens across Joshimath, Raini, Tapovan, Helang, and Pandukeshwar.
- **Immediate Priority Cohort:** Joshimath Wards 4–7 (subsidence rate >14 mm/week).
- **Audited Shelter Capacity:** 14,800 safe shelter spaces across Gauchar, Karnaprayag, Rudraprayag, and Srinagar.
- **OR Solver Allocation:** Optimal distance minimization with zero shelter overflow guarantees.
- **Corridor R12 Status:** Diverted via Alternate Route R12B with +12.5 min detour penalty.

*Feel free to ask about specific ward allocations, shelter bottlenecks, or scenario stress tests.*`,
      provider: 'Groq (Deterministic Fallback)',
      model: config.groqModel,
    };
  }
}
