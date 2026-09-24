// VISTHAAPAN Multilingual Speech Preparation & Normalization Engine
// Provides language-aware number-to-word expansion, abbreviation normalization,
// markdown cleaning, and runtime BCP-47 TTS voice resolution for all 13 Indian languages.

import type { SupportedLanguage } from '../i18n/types';

// Indian Number-to-Words maps
const HINDI_ONES = ['', 'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस'];
const HINDI_TENS = ['', 'दस', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नब्बे'];

const GUJARATI_ONES = ['', 'એક', 'બે', 'ત્રણ', 'ચાર', 'પાંચ', 'છ', 'સાત', 'આઠ', 'નવ', 'દસ', 'અગિયાર', 'બાર', 'તેર', 'ચૌદ', 'પંદર', 'સોળ', 'સત્તર', 'અઢાર', 'ઓગણિસ'];
const GUJARATI_TENS = ['', 'દસ', 'વીસ', 'ત્રીસ', 'ચાલીસ', 'પચાસ', 'સાઠ', 'સિત્તેર', 'એંસી', 'નેવું'];

const TAMIL_ONES = ['', 'ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'ஒன்பது', 'பத்து', 'பதினொன்று', 'பன்னிரண்டு', 'பதின்மூன்று', 'பதினான்கு', 'பதினைந்து', 'பதினாறு', 'பதினேழு', 'பதினெட்டு', 'பத்தொன்பது'];
const TAMIL_TENS = ['', 'பத்து', 'இருபது', 'முப்பது', 'நாற்பது', 'ஐம்பது', 'அறுபது', 'எழுபது', 'எண்பது', 'தொண்ணூறு'];

const BENGALI_ONES = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
const BENGALI_TENS = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

const ENGLISH_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const ENGLISH_TENS = ['', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/**
 * Convert positive integers under 1,00,00,000 into spoken Indian language words
 */
export function numberToWords(num: number, lang: SupportedLanguage): string {
  if (isNaN(num)) return '';
  if (num === 0) {
    if (lang === 'hi') return 'शून्य';
    if (lang === 'gu') return 'શૂન્ય';
    if (lang === 'ta') return 'பூஜ்ஜியம்';
    if (lang === 'bn') return 'শূন্য';
    return 'zero';
  }

  // Handle common disaster metrics directly for natural rhythm
  const commonMap: Record<number, Record<string, string>> = {
    15450: {
      hi: 'पंद्रह हजार चार सौ पचास',
      gu: 'પંદર હજાર ચારસો પચાસ',
      ta: 'பதினைந்தாயிரத்து நானூற்று ஐம்பது',
      bn: 'পনেরো হাজার চারশত পঞ্চাশ',
      en: 'fifteen thousand four hundred fifty',
    },
    19500: {
      hi: 'उन्नीस हजार पांच सौ',
      gu: 'ઓગણીસ હજાર પાંચસો',
      ta: 'பத்தொன்பதாயிரத்து ஐந்நூறு',
      bn: 'উনিশ হাজার পাঁচশত',
      en: 'nineteen thousand five hundred',
    },
    12250: {
      hi: 'बारह हजार दो सौ पचास',
      gu: 'બાર હજાર બસો પચાસ',
      ta: 'பன்னிரண்டாயிரத்து இருநூற்று ஐம்பது',
      bn: 'বারো হাজার দুইশত পঞ্চাশ',
      en: 'twelve thousand two hundred fifty',
    },
    14800: {
      hi: 'चौदह हजार आठ सौ',
      gu: 'ચૌદ હજાર આઠસો',
      ta: 'பதினான்காயிரத்து எண்ணூறு',
      bn: 'চৌদ্দ হাজার আটশত',
      en: 'fourteen thousand eight hundred',
    },
    4500: {
      hi: 'चार हजार पांच सौ',
      gu: 'ચાર હજાર પાંચસો',
      ta: 'நான்காயிரத்து ஐந்நூறு',
      bn: 'চার হাজার পাঁচশত',
      en: 'four thousand five hundred',
    },
    3800: {
      hi: 'तीन हजार आठ सौ',
      gu: 'ત્રણ હજાર આઠસો',
      ta: 'மூவாயிரத்து எண்ணூறு',
      bn: 'তিন হাজার আটশত',
      en: 'three thousand eight hundred',
    },
    3500: {
      hi: 'तीन हजार पांच सौ',
      gu: 'ત્રણ હજાર પાંચસો',
      ta: 'மூவாயிரத்து ஐந்நூறு',
      bn: 'তিন হাজার পাঁচশত',
      en: 'three thousand five hundred',
    },
    3150: {
      hi: 'तीन हजार एक सौ पचास',
      gu: 'ત્રણ હજાર એકસો પચાસ',
      ta: 'மூவாயிரத்து நூற்று ஐம்பது',
      bn: 'তিন হাজার একশত পঞ্চাশ',
      en: 'three thousand one hundred fifty',
    },
    2500: {
      hi: 'दो हजार पांच सौ',
      gu: 'બે હજાર પાંચસો',
      ta: 'இரண்டாயிரத்து ஐந்நூறு',
      bn: 'দুই হাজার পাঁচশত',
      en: 'two thousand five hundred',
    },
    2400: {
      hi: 'दो हजार चार सौ',
      gu: 'બે હજાર ચારસો',
      ta: 'இரண்டாயிரத்து நானூறு',
      bn: 'দুই হাজার চারশত',
      en: 'two thousand four hundred',
    },
    2200: {
      hi: 'दो हजार दो सौ',
      gu: 'બે હજાર બસો',
      ta: 'இரண்டாயிரத்து இருநூறு',
      bn: 'দুই হাজার দুইশত',
      en: 'two thousand two hundred',
    },
    2100: {
      hi: 'दो हजार एक सौ',
      gu: 'બે હજાર એકસો',
      ta: 'இரண்டாயிரத்து நூறு',
      bn: 'দুই হাজার একশত',
      en: 'two thousand one hundred',
    },
    1800: {
      hi: 'एक हजार आठ सौ',
      gu: 'એક હજાર આઠસો',
      ta: 'ஆயிரத்து எண்ணூறு',
      bn: 'এক হাজার আটশত',
      en: 'one thousand eight hundred',
    },
    5000: {
      hi: 'पांच हजार',
      gu: 'પાંચ હજાર',
      ta: 'ஐந்தாயிரம்',
      bn: 'পাঁচ হাজার',
      en: 'five thousand',
    },
  };

  if (commonMap[num]?.[lang]) {
    return commonMap[num][lang];
  }
  if (commonMap[num]?.en && lang === 'en') {
    return commonMap[num].en;
  }

  // Recursive fallback for general integers
  function toWordsEn(n: number): string {
    if (n < 20) return ENGLISH_ONES[n];
    if (n < 100) return ENGLISH_TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ENGLISH_ONES[n % 10] : '');
    if (n < 1000) return ENGLISH_ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + toWordsEn(n % 100) : '');
    if (n < 100000) return toWordsEn(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + toWordsEn(n % 1000) : '');
    if (n < 10000000) return toWordsEn(Math.floor(n / 100000)) + ' lakh' + (n % 100000 ? ' ' + toWordsEn(n % 100000) : '');
    return toWordsEn(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 ? ' ' + toWordsEn(n % 10000000) : '');
  }

  function toWordsHi(n: number): string {
    if (n < 20) return HINDI_ONES[n];
    if (n < 100) return HINDI_TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + HINDI_ONES[n % 10] : '');
    if (n < 1000) return HINDI_ONES[Math.floor(n / 100)] + ' सौ' + (n % 100 ? ' ' + toWordsHi(n % 100) : '');
    if (n < 100000) return toWordsHi(Math.floor(n / 1000)) + ' हजार' + (n % 1000 ? ' ' + toWordsHi(n % 1000) : '');
    return toWordsHi(Math.floor(n / 100000)) + ' लाख' + (n % 100000 ? ' ' + toWordsHi(n % 100000) : '');
  }

  function toWordsGu(n: number): string {
    if (n < 20) return GUJARATI_ONES[n];
    if (n < 100) return GUJARATI_TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + GUJARATI_ONES[n % 10] : '');
    if (n < 1000) return GUJARATI_ONES[Math.floor(n / 100)] + ' સો' + (n % 100 ? ' ' + toWordsGu(n % 100) : '');
    if (n < 100000) return toWordsGu(Math.floor(n / 1000)) + ' હજાર' + (n % 1000 ? ' ' + toWordsGu(n % 1000) : '');
    return toWordsGu(Math.floor(n / 100000)) + ' લાખ' + (n % 100000 ? ' ' + toWordsGu(n % 100000) : '');
  }

  function toWordsTa(n: number): string {
    if (n < 20) return TAMIL_ONES[n];
    if (n < 100) return TAMIL_TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + TAMIL_ONES[n % 10] : '');
    if (n < 1000) return TAMIL_ONES[Math.floor(n / 100)] + ' நூறு' + (n % 100 ? ' ' + toWordsTa(n % 100) : '');
    if (n < 100000) return toWordsTa(Math.floor(n / 1000)) + ' ஆயிரம்' + (n % 1000 ? ' ' + toWordsTa(n % 1000) : '');
    return toWordsTa(Math.floor(n / 100000)) + ' லட்சம்' + (n % 100000 ? ' ' + toWordsTa(n % 100000) : '');
  }

  function toWordsBn(n: number): string {
    if (n < 20) return BENGALI_ONES[n];
    if (n < 100) return BENGALI_TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + BENGALI_ONES[n % 10] : '');
    if (n < 1000) return BENGALI_ONES[Math.floor(n / 100)] + ' শত' + (n % 100 ? ' ' + toWordsBn(n % 100) : '');
    if (n < 100000) return toWordsBn(Math.floor(n / 1000)) + ' হাজার' + (n % 1000 ? ' ' + toWordsBn(n % 1000) : '');
    return toWordsBn(Math.floor(n / 100000)) + ' লাখ' + (n % 100000 ? ' ' + toWordsBn(n % 100000) : '');
  }

  if (lang === 'hi') return toWordsHi(num);
  if (lang === 'gu') return toWordsGu(num);
  if (lang === 'ta') return toWordsTa(num);
  if (lang === 'bn') return toWordsBn(num);
  return toWordsEn(num);
}

/**
 * Normalizes an operational briefing text for clear, natural language TTS playback.
 * Strips document metadata headers, markdown styling, emojis, expands abbreviations,
 * and converts digits to spoken words so speech synthesizers never halt unexpectedly.
 */
export function speechTextNormalizer(rawText: string, lang: SupportedLanguage): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Completely strip administrative header/metadata block
  // If the text contains a horizontal rule '---', discard everything above it
  if (/[-─]{3,}/.test(text)) {
    const parts = text.split(/[-─]{3,}/);
    if (parts.length > 1) {
      text = parts.slice(1).join('\n');
    }
  }

  // Strip lines that match document metadata patterns (Document ID, Language, Authority, DEOC)
  text = text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (trimmed.includes('📋') || trimmed.includes('DOSSIER') || trimmed.includes('BRIEF-CHM')) return false;
      if (
        /^(दस्तावेज़|दस्तावेज़|Document ID|నమోదు సంఖ్య|દસ્તાવેજ|নথি|ದಸ್ತಾವೇಜು|രേഖ|ਦਸਤਾਵੇਜ਼|ଦସ୍ତାବିଜ|دستاویز|Language|भाषा|ভাষ|భాష|ભાષા|ಭಾಷೆ|ഭാഷ|ਭਾਸ਼ਾ|ଭାଷା|Authority|प्राधिकरण|কর্তৃপক্ষ|అధికార|સત્તામંડળ|ಪ್ರಾಧಿಕಾರ|അതോറിറ്റി|ਅਥਾਰਟੀ|କର୍ତ୍ତୃପକ୍ଷ|اتھارٹی)/i.test(
          trimmed.replace(/[*#_]/g, '').trim()
        )
      ) {
        return false;
      }
      return true;
    })
    .join('\n');

  // 2. Remove all Unicode emojis
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');

  // 3. Remove Markdown headers, bold, italics, code fences, blockquotes, bullets
  text = text.replace(/```[\s\S]*?```/g, ''); // code blocks
  text = text.replace(/`([^`]+)`/g, '$1'); // inline code
  text = text.replace(/#{1,6}\s+/g, ''); // headers
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // bold
  text = text.replace(/\*([^*]+)\*/g, '$1'); // italic
  text = text.replace(/_{1,2}([^_]+)_{1,2}/g, '$1'); // underline/italic
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // links
  text = text.replace(/^\s*[-*+]\s+/gm, ''); // unordered lists
  text = text.replace(/^\s*\d+\.\s+/gm, ''); // ordered lists
  text = text.replace(/^\s*>\s+/gm, ''); // blockquotes
  text = text.replace(/[-─]{3,}/g, ''); // horizontal dividers

  // 4. Remove brackets/parentheses, colons, semicolons that cause TTS voices to pause or choke
  text = text.replace(/[()\[\]{}]/g, ', ');
  text = text.replace(/[:;]/g, ', ');

  // 5. Expand common operational abbreviations according to target language
  if (lang === 'hi') {
    text = text.replace(/\bNH[- ]?07\b/gi, 'राष्ट्रीय राजमार्ग सात');
    text = text.replace(/\bNH[- ]?58\b/gi, 'राष्ट्रीय राजमार्ग अट्ठावन');
    text = text.replace(/आर[- ]?12बी|R[- ]?12B/gi, 'वैकल्पिक मार्ग आर बारह बी');
    text = text.replace(/आर[- ]?12|R[- ]?12/gi, 'मार्ग आर बारह');
    text = text.replace(/0[- ]गैप|शून्य[- ]गैप/gi, 'शून्य अंतर');
    text = text.replace(/4[- ]7/g, 'चार से सात');
    text = text.replace(/1[- ]2/g, 'एक से दो');
    text = text.replace(/(\d+)[- ](\d+)/g, '$1 से $2');
    text = text.replace(/OR सॉल्वर|OR Solver|ओआर सॉल्वर/gi, 'ओ आर सॉल्वर');
    text = text.replace(/SDRF|एसडीआरएफ/gi, 'एस डी आर एफ');
    text = text.replace(/NDRF|एनडीआरएफ/gi, 'एन डी आर एफ');
    text = text.replace(/DEOC/gi, 'डी ई ओ सी');
    text = text.replace(/IMD/gi, 'मौसम विभाग');
    text = text.replace(/InSAR/gi, 'उपग्रह रडार');
    text = text.replace(/\bkm\b|किमी/gi, 'किलोमीटर');
    text = text.replace(/\bmin\b|मिनट/gi, 'मिनट');
    text = text.replace(/\bpax\b/gi, 'व्यक्तियों');
    text = text.replace(/मिमी\/सप्ताह|\bmm\/week\b/gi, 'मिलीमीटर प्रति सप्ताह');
  } else if (lang === 'gu') {
    text = text.replace(/\bNH[- ]?07\b/gi, 'રાષ્ટ્રીય ધોરીમાર્ગ સાત');
    text = text.replace(/\bNH[- ]?58\b/gi, 'રાષ્ટ્રીય ધોરીમાર્ગ અઠાવન');
    text = text.replace(/R[- ]?12B|આર[- ]?12બી/gi, 'વૈકલ્પિક માર્ગ આર બાર બી');
    text = text.replace(/R[- ]?12|આર[- ]?12/gi, 'માર્ગ આર બાર');
    text = text.replace(/OR Solver|ઓઆર સોલ્વર/gi, 'ઓ આર સોલ્વર');
    text = text.replace(/SDRF/gi, 'એસ ડી આર એફ');
    text = text.replace(/NDRF/gi, 'એન ડી આર એફ');
    text = text.replace(/\bkm\b/gi, 'કિલોમીટર');
    text = text.replace(/\bmin\b/gi, 'મિનિટ');
    text = text.replace(/\bpax\b/gi, 'વ્યક્તિઓ');
    text = text.replace(/\bmm\/week\b/gi, 'મિલીમીટર પ્રતિ સપ્તાહ');
  } else if (lang === 'ta') {
    text = text.replace(/\bNH[- ]?07\b/gi, 'தேசிய நெடுஞ்சாலை ஏழு');
    text = text.replace(/\bNH[- ]?58\b/gi, 'தேசிய நெடுஞ்சாலை ஐம்பத்தெட்டு');
    text = text.replace(/R[- ]?12B/gi, 'மாற்றுப் பாதை ஆர் பன்னிரண்டு பி');
    text = text.replace(/R[- ]?12/gi, 'பாதை ஆர் பன்னிரண்டு');
    text = text.replace(/OR Solver/gi, 'ஓ ஆர் சால்வர்');
    text = text.replace(/SDRF/gi, 'எஸ் டி ஆர் எஃப்');
    text = text.replace(/NDRF/gi, 'என் டி ஆர் எஃப்');
    text = text.replace(/\bkm\b/gi, 'கிலோமீட்டர்');
    text = text.replace(/\bmin\b/gi, 'நிமிடங்கள்');
    text = text.replace(/\bpax\b/gi, 'நபர்கள்');
    text = text.replace(/\bmm\/week\b/gi, 'மில்லிமீட்டர் வாரத்திற்கு');
  } else if (lang === 'bn') {
    text = text.replace(/\bNH[- ]?07\b/gi, 'জাতীয় সড়ক সাত');
    text = text.replace(/\bNH[- ]?58\b/gi, 'জাতীয় সড়ক আটান্ন');
    text = text.replace(/R[- ]?12B/gi, 'বিকল্প সড়ক আর বারো বি');
    text = text.replace(/R[- ]?12/gi, 'সড়ক আর বারো');
    text = text.replace(/OR Solver/gi, 'ও আর সলভার');
    text = text.replace(/SDRF/gi, 'এস ডি আর এফ');
    text = text.replace(/NDRF/gi, 'এন ডি আর এফ');
    text = text.replace(/\bkm\b/gi, 'কিলোমিটার');
    text = text.replace(/\bmin\b/gi, 'মিনিট');
    text = text.replace(/\bpax\b/gi, 'ব্যক্তি');
  } else {
    text = text.replace(/\bNH[- ]?07\b/gi, 'National Highway seven');
    text = text.replace(/\bNH[- ]?58\b/gi, 'National Highway fifty-eight');
    text = text.replace(/\bR[- ]?12B\b/gi, 'Alternate Route R-12B');
    text = text.replace(/\bR[- ]?12\b/gi, 'Route R-12');
    text = text.replace(/\bkm\b/gi, 'kilometers');
    text = text.replace(/\bmin\b/gi, 'minutes');
    text = text.replace(/\bpax\b/gi, 'persons');
    text = text.replace(/\bmm\/week\b/gi, 'millimeters per week');
  }

  // 6. Convert numbers (with optional commas) to spoken words in appropriate languages
  text = text.replace(/\b\d{1,3}(,\d{3})+(\.\d+)?\b|\b\d+(\.\d+)?\b/g, (match) => {
    const cleanNum = parseFloat(match.replace(/,/g, ''));
    if (!isNaN(cleanNum) && cleanNum <= 10000000) {
      if (Math.floor(cleanNum) === cleanNum) {
        return numberToWords(cleanNum, lang);
      }
      // Decimal handling
      const integerPart = Math.floor(cleanNum);
      const decimalPart = Math.round((cleanNum - integerPart) * 10);
      const intWords = numberToWords(integerPart, lang);
      const decWords = numberToWords(decimalPart, lang);
      if (lang === 'hi') return `${intWords} दशमलव ${decWords}`;
      if (lang === 'gu') return `${intWords} પોઇન્ટ ${decWords}`;
      if (lang === 'ta') return `${intWords} புள்ளி ${decWords}`;
      if (lang === 'bn') return `${intWords} দশমিক ${decWords}`;
      return `${intWords} point ${decWords}`;
    }
    return match;
  });

  // 7. Clean excessive spaces, line breaks, and punctuation
  text = text.replace(/[•|►▪]/g, ',');
  text = text.replace(/,{2,}/g, ',');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Splits normalized text into fluent, bite-sized sentence chunks (40 to 120 characters).
 * This eliminates the Chromium 15-second timeout and internal buffer drops on Windows/Chrome TTS.
 */
export function splitIntoSentenceChunks(text: string, _lang?: SupportedLanguage): string[] {
  if (!text) return [];

  // Delimiters:
  // In Hindi/Indian scripts: danda, question mark, exclamation, newline, and period
  const rawSegments = text
    .split(/([।?!.\n]+)/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (let i = 0; i < rawSegments.length; i++) {
    const seg = rawSegments[i];
    if (/^[।?!.\n]+$/.test(seg)) {
      current += seg;
      if (current.length >= 35) {
        chunks.push(current.trim());
        current = '';
      }
      continue;
    }

    if (current.length + seg.length > 110) {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      current = seg;
    } else {
      current += (current ? ' ' : '') + seg;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  // Secondary pass: if any chunk is still > 140 characters, split on commas
  const finalChunks: string[] = [];
  for (const c of chunks) {
    if (c.length > 140 && c.includes(',')) {
      const parts = c.split(/,\s*/);
      let sub = '';
      for (const p of parts) {
        if (sub.length + p.length > 100) {
          if (sub.trim()) finalChunks.push(sub.trim() + ',');
          sub = p;
        } else {
          sub += (sub ? ', ' : '') + p;
        }
      }
      if (sub.trim()) finalChunks.push(sub.trim());
    } else {
      finalChunks.push(c);
    }
  }

  return finalChunks
    .map((c) => c.replace(/^[।?!.,\s]+/, '').trim())
    .filter((c) => c.length > 0);
}

// BCP-47 Target Language Code Mapping
export const BCP47_VOICE_MAP: Record<SupportedLanguage, string[]> = {
  en: ['en-IN', 'en-GB', 'en-US', 'en'],
  hi: ['hi-IN', 'hi'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  te: ['te-IN', 'te'],
  mr: ['mr-IN', 'mr'],
  ta: ['ta-IN', 'ta-LK', 'ta'],
  gu: ['gu-IN', 'gu'],
  ur: ['ur-IN', 'ur-PK', 'ur'],
  kn: ['kn-IN', 'kn'],
  or: ['or-IN', 'or', 'od-IN'],
  ml: ['ml-IN', 'ml'],
  pa: ['pa-IN', 'pa'],
  as: ['as-IN', 'as'],
};

export interface PreferredVoiceResult {
  voice: SpeechSynthesisVoice | null;
  isNative: boolean;
  warning?: string;
  langCode: string;
}

/**
 * Resolves the best available runtime browser SpeechSynthesisVoice for the target Indian language.
 * Follows exact BCP-47 match -> regional match -> base language match -> name match hierarchy.
 */
export function getPreferredVoice(lang: SupportedLanguage): PreferredVoiceResult {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return {
      voice: null,
      isNative: false,
      warning: 'Speech synthesis is not supported in this browser.',
      langCode: 'en-IN',
    };
  }

  const voices = window.speechSynthesis.getVoices();
  const targetLocales = BCP47_VOICE_MAP[lang] || ['en-IN', 'en'];

  // 1. Search for exact BCP-47 match (e.g., 'hi-IN')
  for (const locale of targetLocales) {
    const match = voices.find(
      (v) => v.lang.toLowerCase() === locale.toLowerCase() || v.lang.replace('_', '-').toLowerCase() === locale.toLowerCase()
    );
    if (match) {
      return {
        voice: match,
        isNative: true,
        langCode: locale,
      };
    }
  }

  // 2. Search for base language match (e.g., startsWith('hi'))
  const baseCode = lang.split('-')[0].toLowerCase();
  const baseMatch = voices.find((v) => v.lang.toLowerCase().startsWith(baseCode));
  if (baseMatch) {
    return {
      voice: baseMatch,
      isNative: true,
      langCode: baseMatch.lang,
    };
  }

  // 3. Search for language name in voice name (e.g. 'hindi' in 'Google हिन्दी' or 'Microsoft Kalpana - Hindi')
  const nameMatch = voices.find((v) => {
    const nameLower = v.name.toLowerCase();
    if (lang === 'hi') return nameLower.includes('hindi') || v.name.includes('हिन्दी');
    if (lang === 'bn') return nameLower.includes('bengali') || nameLower.includes('bangla') || v.name.includes('বাংলা');
    if (lang === 'ta') return nameLower.includes('tamil') || v.name.includes('தமிழ்');
    if (lang === 'te') return nameLower.includes('telugu') || v.name.includes('తెలుగు');
    if (lang === 'gu') return nameLower.includes('gujarati') || v.name.includes('ગુજરાતી');
    if (lang === 'mr') return nameLower.includes('marathi') || v.name.includes('मराठी');
    if (lang === 'kn') return nameLower.includes('kannada') || v.name.includes('ಕನ್ನಡ');
    if (lang === 'ml') return nameLower.includes('malayalam') || v.name.includes('മലയാളം');
    if (lang === 'pa') return nameLower.includes('punjabi') || v.name.includes('ਪੰਜਾਬੀ');
    if (lang === 'ur') return nameLower.includes('urdu') || v.name.includes('اردو');
    if (lang === 'or') return nameLower.includes('odia') || nameLower.includes('oriya') || v.name.includes('ଓଡ଼ିଆ');
    if (lang === 'as') return nameLower.includes('assamese') || v.name.includes('অসমীয়া');
    return false;
  });
  if (nameMatch) {
    return {
      voice: nameMatch,
      isNative: true,
      langCode: nameMatch.lang || targetLocales[0],
    };
  }

  // 4. Native voice not available on this device: fallback to closest Indian English or default voice
  const fallbackIndianVoice = voices.find(
    (v) => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india')
  );

  const fallbackVoice = fallbackIndianVoice || voices[0] || null;

  return {
    voice: fallbackVoice,
    isNative: false,
    warning: lang === 'en' ? undefined : 'Native speech voice unavailable for this language on this device.',
    langCode: fallbackVoice?.lang || 'en-IN',
  };
}
