// VISTHAAPAN Executive Briefing & Conversational Assistant Service
// Clean domain service boundary isolating generative AI operations.
// All browser-direct generative AI calls and API keys are eliminated.
// In Mock Mode: Serves high-fidelity, deterministic Chamoli command briefings and chatbot guidance.
// In Live Mode: Relays queries through apiClient to backend intelligence endpoints.

import { mockSites } from '../mock/data';
import { apiClient } from './apiClient';
import { formatPercent, formatPopulation, formatNumber } from '../utils/formatters';

export interface VillageContext {
  id: string;
  name: string;
  code: string;
  population: number;
  priority: string;
  riskScore: number;
  vulnerabilityScore: number;
  slopeDegrees: number;
  primaryHazard: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  roadR12Blocked?: boolean;
  vulnerableGroups?: {
    elderly: number;
    children: number;
    disabled: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; action: string }[];
}

// Deterministic nearest safe-site calculation based on coordinates & road severance
export function getNearestSafeSites(
  lat: number,
  lng: number,
  roadR12Blocked: boolean
): Array<{
  id: string;
  name: string;
  code: string;
  distanceKm: number;
  transitTimeMin: number;
  effectiveCapacity: number;
  bottleneck: string;
  routeStatus: string;
  isRecommended: boolean;
}> {
  // Haversine approximation to calculate distance from coordinates
  const calculateDistance = (targetLat: number, targetLng: number): number => {
    const R = 6371; // km
    const dLat = ((targetLat - lat) * Math.PI) / 180;
    const dLon = ((targetLng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((targetLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  return mockSites
    .filter((site) => site.status !== 'EXCLUDED')
    .map((site) => {
      let baseDistance = site.coordinates
        ? calculateDistance(site.coordinates.lat, site.coordinates.lng)
        : 85.0;

      // Realistic minimum mountain road network tortuosity factor (~1.8x - 2.2x straight line)
      baseDistance = Math.max(18.5, parseFloat((baseDistance * 2.1).toFixed(1)));

      let transitTime = Math.round((baseDistance / 32) * 60); // 32 km/h avg convoy speed
      let routeStatus = 'CLEAR • Open Convoy Corridor';
      let isRecommended = false;

      // Impact of Corridor R12 severance
      if (roadR12Blocked && (site.id === 'site-gauchar' || site.id === 'site-pipalkoti')) {
        baseDistance = parseFloat((baseDistance + 12.4).toFixed(1));
        transitTime += 38; // Heavy mountain detour penalty
        routeStatus = 'DETOUR ACTIVE • Via Route Alt-12B (+12.4 km)';
      }

      if (site.id === 'site-gauchar' && !roadR12Blocked) {
        isRecommended = true;
      } else if (site.id === 'site-karnaprayag' && roadR12Blocked) {
        isRecommended = true; // Preferred diversion when R12 is blocked
      }

      return {
        id: site.id,
        name: site.name,
        code: site.code,
        distanceKm: baseDistance,
        transitTimeMin: transitTime,
        effectiveCapacity: site.resourceCapacity?.effectiveCapacity || 3500,
        bottleneck: site.resourceCapacity?.bottleneckResource || 'Shelter Space',
        routeStatus,
        isRecommended,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// Multilingual Dossier Templates for all 13 Supported Indian Languages
const MULTILINGUAL_DOSSIERS: Record<string, (context: VillageContext, pop: number, cap: number) => string> = {
  hi: (context, pop, cap) => `#### 1. वर्तमान स्थिति का संक्षिप्त विवरण
चमोली जनपद में जोशीमठ एवं अलकनंदा घाटी क्षेत्र में अत्यधिक भू-धंसाव दर्ज किया गया है। विस्थापन निगरानी प्रणाली द्वारा कुल **${pop.toLocaleString()} नागरिकों** के सुरक्षित स्थानांतरण का विश्लेषण तैयार है।

#### 2. राहत शिविर एवं सुरक्षित क्षमता विश्लेषण
सत्यापित सुरक्षित आश्रयों (गौचर, कर्णप्रयाग, रुद्रप्रयाग) में कुल **${cap.toLocaleString()} नागरिकों की प्रभावी क्षमता** उपलब्ध है। पीपलकोटी राहत स्थल को सुरक्षा कारणों से प्रतिबंधित रखा गया है।

#### 3. ऑपरेशंस रिसर्च (OR) आवंटन निर्णय
ओआर सॉल्वर द्वारा शून्य क्षमता अतिप्रवाह के साथ इष्टतम आवंटन:
- **जोशीमठ (4,500 नागरिक):** गौचर हवाई पट्टी केंद्र आवंटित (79.2 किमी)।
- **तपोवन (2,100 नागरिक):** रुद्रप्रयाग क्षेत्रीय केंद्र आवंटित (112.4 किमी)।
- **रैणी (2,400 नागरिक):** कर्णप्रयाग राहत केंद्र आवंटित (68.5 किमी)।

#### 4. सक्षम प्राधिकारी हेतु अनुशंसित कार्यवाही
1. चरण 1 के अंतर्गत वृद्धजन, दिव्यांग एवं बच्चों के काफिले को तत्काल रवाना किया जाए।
2. संपर्क मार्ग आर-12 पर भूस्खलन के कारण वैकल्पिक मार्ग आर-12बी पर एसडीआरएफ एवं एनडीआरएफ के एस्कॉर्ट वाहन तैनात रहें।`,

  gu: (context, pop, cap) => `#### 1. પરિસ્થિતિની વિગત
ચમોલી જિલ્લામાં જોશીમઠ અને અલકનંદા ખીણ વિસ્તારમાં ભૂ-ધસાણ પર સતત દેખરેખ રાખવામાં આવી રહી છે. કુલ **${pop.toLocaleString()} સંવેદનશીલ નાગરિકો** ના સલામત સ્થળાંતરની યોજના તૈયાર છે.

#### 2. આશ્રય ક્ષમતા અને વિતરણ
ચકાસાયેલ સલામત આશ્રયો (ગૌચર, કર્ણપ્રયાગ, રુદ્રપ્રયાગ) માં કુલ **${cap.toLocaleString()} નાગરિકો માટે સુરક્ષિત ક્ષમતા** ઉપલબ્ધ છે. પીપલકોટી કેન્દ્ર સુરક્ષા કારણોસર બાકાત રાખવામાં આવ્યું છે.

#### 3. ઓપરેશન્સ રિસર્ચ (OR) ફાળવણી નિર્ણય
ઓઆર સોલ્વર દ્વારા શૂન્ય અતિપ્રવાહ સાથે શ્રેષ્ઠ ફાળવણી:
- **જોશીમઠ (4,500 નાગરિકો):** ગૌચર એરપોર્ટ કેન્દ્રમાં ફાળવવામાં આવ્યા (79.2 કિમી).
- **તપોવન (2,100 નાગરિકો):** રુદ્રપ્રયાગ કેન્દ્રમાં ફાળવવામાં આવ્યા (112.4 કિમી).
- **રૈણી (2,400 નાગરિકો):** કર્ણપ્રયાગ કેન્દ્રમાં ફાળવવામાં આવ્યા (68.5 કિમી).

#### 4. અધિકારી માટે ભલામણ કરેલ પગલાં
1. તબક્કો 1 હેઠળ વરિષ્ઠ નાગરિકો, દિવ્યાંગો અને બાળકોના કાફલાને તાત્કાલિક રવાના કરો.
2. વૈકલ્પિક માર્ગ આર-12બી પર SDRF અને NDRF એસ્કોર્ટ તૈનાત રાખો.`,

  ta: (context, pop, cap) => `#### 1. தற்போதைய சூழ்நிலை கண்ணோட்டம்
சமோலி மாவட்டத்தில் ஜோஷிமத் மற்றும் அலக்நந்தா பள்ளத்தாக்கு பகுதிகளில் தீவிர நிலச்சரிவு கண்காணிக்கப்படுகிறது. மொத்தம் **${pop.toLocaleString()} குடிமக்களை** பாதுகாப்பான இடங்களுக்கு மாற்றும் திட்டம் தயாராக உள்ளது.

#### 2. நிவாரண முகாம் கொள்ளளவு
பாதுகாப்பான முகாம்களில் (கௌச்சர், கர்ணபிரயாக், ருத்ரபிரயாக்) மொத்தம் **${cap.toLocaleString()} நபர்களுக்கான கொள்ளளவு** உறுதி செய்யப்பட்டுள்ளது. பிபல்கோட்டி மையம் ஆபத்து காரணமாக விலக்கப்பட்டுள்ளது.

#### 3. உகந்த ஒதுக்கீட்டு முடிவு (OR Solver)
- **ஜோஷிமத் (4,500 நபர்கள்):** கௌச்சர் மையத்திற்கு ஒதுக்கீடு (79.2 கி.மீ).
- **தபோவன் (2,100 நபர்கள்):** ருத்ரபிரயாக் மையத்திற்கு ஒதுக்கீடு (112.4 கி.மீ).
- **ரைனி (2,400 நபர்கள்):** கர்ணபிரயாக் மையத்திற்கு ஒதுக்கீடு (68.5 கி.மீ).

#### 4. தளபதிக்கான பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்
1. கட்டம் 1-ன் கீழ் முதியவர்கள், மாற்றுத்திறனாளிகள் மற்றும் குழந்தைகளை உடனடியாக வெளியேற்றவும்.
2. மாற்றுப் பாதை ஆர்-12பி-ல் எஸ்டிஆர்எஃப் பாதுகாப்புப் படைகளை நிலைநிறுத்தவும்.`,

  bn: (context, pop, cap) => `#### 1. বর্তমান পরিস্থিতির সারসংক্ষেপ
চামোলি জেলায় জোশীমঠ ও অলকানন্দা উপত্যকায় ভূ-ধস নিরীক্ষণ চলছে। মোট **${pop.toLocaleString()} জন নাগরিকের** নিরাপদ স্থানান্তর পরিকল্পনা প্রস্তুত।

#### 2. আশ্রয় কেন্দ্রের ধারণক্ষমতা
যাচাইকৃত নিরাপদ আশ্রয় কেন্দ্রে (গৌচর, কর্ণপ্রয়াগ, রুদ্রপ্রয়াগ) মোট **${cap.toLocaleString()} জনের ধারণক্ষমতা** রয়েছে। পিপলকোটি কেন্দ্রটি সক্রিয় বিপদের কারণে বাদ দেওয়া হয়েছে।

#### 3. অপারেশনস রিসার্চ (OR) বরাদ্দ সিদ্ধান্ত
- **জোশীমঠ (4,500 জন):** গৌচর বিমানবন্দর কেন্দ্রে বরাদ্দ (79.2 কিমি)।
- **তপোবন (2,100 জন):** রুদ্রপ্রয়াগ কেন্দ্রে বরাদ্দ (112.4 কিমি)।
- **রাইনি (2,400 জন):** কর্ণপ্রয়াগ কেন্দ্রে বরাদ্দ (68.5 কিমি)।

#### 4. কর্মকর্তার জন্য প্রস্তাবিত পদক্ষেপ
1. প্রথম ধাপে প্রবীণ, প্রতিবন্ধী ও শিশুদের কনভয় অবিলম্বে প্রেরণ করুন।
2. বিকল্প রুট আর-12বি-তে এসডিআরএফ এসকর্ট বজায় রাখুন।`,

  mr: (context, pop, cap) => `#### 1. सद्यस्थितीचा संक्षिप्त आढावा
चमोली जिल्ह्यातील जोशीमठ आणि अलकनंदा खोऱ्यात भूस्खलनावर सतत लक्ष ठेवले जात आहे. एकूण **${pop.toLocaleString()} नागरिकांच्या** सुरक्षित स्थलांतराची योजना तयार आहे.

#### 2. निवारा क्षमता आणि विश्लेषण
गौचर, कर्णप्रयाग आणि रुद्रप्रयाग या सुरक्षित केंद्रांमध्ये एकूण **${cap.toLocaleString()} नागरिकांची क्षमता** उपलब्ध आहे. पिपलकोटी केंद्र सुरक्षेच्या कारणास्तव वगळण्यात आले आहे.

#### 3. ऑपरेशन्स रिसर्च (OR) वाटप निर्णय
- **जोशीमठ (4,500 नागरिक):** गौचर विमानतळ केंद्र (79.2 किमी).
- **तपोवन (2,100 नागरिक):** रुद्रप्रयाग केंद्र (112.4 किमी).
- **रैणी (2,400 नागरिक):** कर्णप्रयाग केंद्र (68.5 किमी).

#### 4. सक्षम अधिकाऱ्यांसाठी शिफारसी
1. टप्पा 1 अंतर्गत ज्येष्ठ नागरिक, दिव्यांग आणि बालकांना तातडीने रवाना करा.
2. पर्यायी मार्ग आर-12बी वर एसडीआरएफ पथके तैनात ठेवा.`,

  te: (context, pop, cap) => `#### 1. ప్రస్తుత పరిస్థితి సమీక్ష
చమోలీ జిల్లాలోని జోషిమఠ్ మరియు అలకనంద లోయ ప్రాంతాల్లో భూమి కుంగుబాటు తీవ్రంగా పర్యవేక్షించబడుతోంది. మొత్తం **${pop.toLocaleString()} మంది పౌరుల** తరలింపు ప్రణాళిక సిద్ధంగా ఉంది.

#### 2. ఆశ్రయ కేంద్రాల సామర్థ్యం
గౌచర్, కర్ణప్రయాగ్, రుద్రప్రయాగ్ లలో మొత్తం **${cap.toLocaleString()} మందికి సురక్షిత సామర్థ్యం** అందుబాటులో ఉంది. పిపల్‌కోటి కేంద్రాన్ని భద్రతా కారణాల వల్ల మినహాయించారు.

#### 3. ఆపరేషన్స్ రీసెర్చ్ (OR) కేటాయింపు నిర్ణయం
- **జోషిమఠ్ (4,500 మంది):** గౌచర్ కేంద్రానికి కేటాయింపు (79.2 కి.మీ).
- **తపోవన్ (2,100 మంది):** రుద్రప్రయాగ్ కేంద్రానికి కేటాయింపు (112.4 కి.మీ).
- **రైని (2,400 మంది):** కర్ణప్రయాగ్ కేంద్రానికి కేటాయింపు (68.5 కి.మీ).

#### 4. అధికారుల తక్షణ చర్యలు
1. మొదటి దశలో వృద్ధులు, దివ్యాంగులు మరియు పిల్లలను వెంటనే సురక్షిత ప్రాంతాలకు తరలించండి.
2. ప్రత్యామ్నాయ మార్గం ఆర్-12బి లో ఎస్డీఆర్ఎఫ్ బలగాలను మోహరించండి.`,

  kn: (context, pop, cap) => `#### 1. ಪ್ರಸ್ತುತ ಪರಿಸ್ಥಿತಿಯ ಅವಲೋಕನ
ಚಮೋಲಿ ಜಿಲ್ಲೆಯ ಜೋಷಿಮಠ ಮತ್ತು ಅಲಕನಂದಾ ಕಣಿವೆಯಲ್ಲಿ ಭೂಕುಸಿತದ ಪರಿಸ್ಥಿತಿಯನ್ನು ಸೂಕ್ಷ್ಮವಾಗಿ ಗಮನಿಸಲಾಗುತ್ತಿದೆ. ಒಟ್ಟು **${pop.toLocaleString()} ನಾಗರಿಕರನ್ನು** ಸುರಕ್ಷಿತ ಸ್ಥಳಗಳಿಗೆ ಸ್ಥಳಾಂತರಿಸಲು ಯೋಜನೆ ಸಿದ್ಧವಾಗಿದೆ.

#### 2. ಆಶ್ರಯ ತಾಣಗಳ ಸಾಮರ್ಥ್ಯ
ಗೌಚರ್, ಕರ್ಣಪ್ರಯಾಗ ಮತ್ತು ರುದ್ರಪ್ರಯಾಗ ಕೇಂದ್ರಗಳಲ್ಲಿ ಒಟ್ಟು **${cap.toLocaleString()} ನಾಗರಿಕರಿಗೆ ಸುರಕ್ಷಿತ ಸಾಮರ್ಥ್ಯ** ಲಭ್ಯವಿದೆ. ಪಿಪಲ್‌ಕೋಟಿ ಕೇಂದ್ರವನ್ನು ಭದ್ರತಾ ದೃಷ್ಟಿಯಿಂದ ಹೊರಗಿಡಲಾಗಿದೆ.

#### 3. ಕಾರ್ಯಾಚರಣೆ ಸಂಶೋಧನೆ (OR) ಹಂಚಿಕೆ ನಿರ್ಧಾರ
- **ಜೋಷಿಮಠ (4,500 ಜನರು):** ಗೌಚರ್ ಕೇಂದ್ರಕ್ಕೆ ಹಂಚಿಕೆ (79.2 ಕಿ.ಮೀ).
- **ತಪೋವನ (2,100 ಜನರು):** ರುದ್ರಪ್ರಯಾಗ ಕೇಂದ್ರಕ್ಕೆ ಹಂಚಿಕೆ (112.4 ಕಿ.ಮೀ).
- **ರೈನಿ (2,400 ಜನರು):** ಕರ್ಣಪ್ರಯಾಗ ಕೇಂದ್ರಕ್ಕೆ ಹಂಚಿಕೆ (68.5 ಕಿ.ಮೀ).

#### 4. ಶಿಫಾರಸು ಮಾಡಲಾದ ಕ್ರಮಗಳು
1. ಹಂತ 1 ರ ಅಡಿಯಲ್ಲಿ ಹಿರಿಯ ನಾಗರಿಕರು, ಅಂಗವಿಕಲರು ಮತ್ತು ಮಕ್ಕಳನ್ನು ತಕ್ಷಣವೇ ಸ್ಥಳಾಂತರಿಸಿ.
2. ಪರ್ಯಾಯ ರಸ್ತೆ ಆರ್-12ಬಿ ನಲ್ಲಿ ಎಸ್ಡಿಆರ್ಎಫ್ ಬೆಂಗಾವಲು ವಾಹನಗಳನ್ನು ನಿಯೋಜಿಸಿ.`,

  ml: (context, pop, cap) => `#### 1. നിലവിലെ സ്ഥിതിഗതികൾ
ചമോലി ജില്ലയിലെ ജോഷിമഠ്, അളകനന്ദ താഴ്‌വരകളിൽ മണ്ണിടിച്ചിൽ ഭീഷണി നിരീക്ഷിച്ചുവരുന്നു. ആകെ **${pop.toLocaleString()} പൗരന്മാരെ** സുരക്ഷിത സ്ഥാനങ്ങളിലേക്ക് മാറ്റുന്നതിനുള്ള പദ്ധതി തയ്യാറാണ്.

#### 2. ദുരിതാശ്വാസ ക്യാമ്പ് ശേഷി
ഗൗച്ചർ, കർണപ്രയാഗ്, രുദ്രപ്രയാഗ് എന്നിവിടങ്ങളിലായി ആകെ **${cap.toLocaleString()} ആളുകൾക്ക് സുരക്ഷിത ശേഷി** ലഭ്യമാണ്. പിപൽകോട്ടി കേന്ദ്രം സുരക്ഷാ കാരണങ്ങളാൽ ഒഴിവാക്കിയിട്ടുണ്ട്.

#### 3. ഒപ്റ്റിമൽ അലോക്കേഷൻ (OR Solver)
- **ജോഷിമഠ് (4,500 പേർ):** ഗൗച്ചർ എയറോഡ്രോം ഹബ്ബ് (79.2 കി.മീ).
- **തപോവൻ (2,100 പേർ):** രുദ്രപ്രയാഗ് കേന്ദ്രം (112.4 കി.മീ).
- **റൈനി (2,400 പേർ):** കർണപ്രയാഗ് കേന്ദ്രം (68.5 കി.മീ).

#### 4. അടിയന്തര നടപടികൾ
1. ഘട്ടം 1 പ്രകാരം പ്രായമായവർ, ഭിന്നശേഷിക്കാർ, കുട്ടികൾ എന്നിവരെ ഉടൻ സുരക്ഷിത സ്ഥാനങ്ങളിലേക്ക് മാറ്റുക.
2. ഇതര റോഡ് ആർ-12ബി ൽ എസ്ഡിആർഎഫ് നിരീക്ഷണം ശക്തമാക്കുക.`,

  pa: (context, pop, cap) => `#### 1. ਮੌਜੂਦਾ ਸਥਿਤੀ ਦਾ ਜਾਇਜ਼ਾ
ਚਮੋਲੀ ਜ਼ਿਲ੍ਹੇ ਦੇ ਜੋਸ਼ੀਮਠ ਅਤੇ ਅਲਕਨੰਦਾ ਘਾਟੀ ਵਿੱਚ ਜ਼ਮੀਨ ਖਿਸਕਣ 'ਤੇ ਲਗਾਤਾਰ ਨਜ਼ਰ ਰੱਖੀ ਜਾ ਰਹੀ ਹੈ। ਕੁੱਲ **${pop.toLocaleString()} ਨਾਗਰਿਕਾਂ** ਨੂੰ ਸੁਰੱਖਿਅਤ ਸਥਾਨਾਂ 'ਤੇ ਤਬਦੀਲ ਕਰਨ ਦੀ ਯੋਜਨਾ ਤਿਆਰ ਹੈ।

#### 2. ਰਾਹਤ ਕੈਂਪਾਂ ਦੀ ਸਮਰੱਥਾ
ਗੌਚਰ, ਕਰਣਪ੍ਰਯਾਗ ਅਤੇ ਰੁਦਰਪ੍ਰਯਾਗ ਵਿੱਚ ਕੁੱਲ **${cap.toLocaleString()} ਨਾਗਰਿਕਾਂ ਲਈ ਸੁਰੱਖਿਅਤ ਸਮਰੱਥਾ** ਉਪਲਬਧ ਹੈ। ਪਿੱਪਲਕੋਟੀ ਕੇਂਦਰ ਨੂੰ ਖ਼ਤਰੇ ਕਾਰਨ ਬਾਹਰ ਰੱਖਿਆ ਗਿਆ ਹੈ।

#### 3. ਆਪ੍ਰੇਸ਼ਨਜ਼ ਰਿਸਰਚ (OR) ਵੰਡ ਫੈਸਲਾ
- **ਜੋਸ਼ੀਮਠ (4,500 ਲੋਕ):** ਗੌਚਰ ਕੇਂਦਰ (79.2 ਕਿਲੋਮੀਟਰ)।
- **ਤਪੋਵਨ (2,100 ਲੋਕ):** ਰੁਦਰਪ੍ਰਯਾਗ ਕੇਂਦਰ (112.4 ਕਿਲੋਮੀਟਰ)।
- **ਰੈਣੀ (2,400 ਲੋਕ):** ਕਰਣਪ੍ਰਯਾਗ ਕੇਂਦਰ (68.5 ਕਿਲੋਮੀਟਰ)।

#### 4. ਅਧਿਕਾਰੀ ਲਈ ਜ਼ਰੂਰੀ ਕਦਮ
1. ਪੜਾਅ 1 ਅਧੀਨ ਬਜ਼ੁਰਗਾਂ, ਦਿਵਿਆਂਗਾਂ ਅਤੇ ਬੱਚਿਆਂ ਨੂੰ ਤੁਰੰਤ ਰਵਾਨਾ ਕਰੋ।
2. ਬਦਲਵੇਂ ਰਸਤੇ ਆਰ-12ਬੀ 'ਤੇ ਐਸਡੀਆਰਐਫ ਟੀਮਾਂ ਤਾਇਨਾਤ ਰੱਖੋ।`,

  or: (context, pop, cap) => `#### 1. ବର୍ତ୍ତମାନ ପରିସ୍ଥିତିର ସାରାଂଶ
ଚାମୋଲି ଜିଲ୍ଲାର ଯୋଶୀମଠ ଏବଂ ଅଳକାନନ୍ଦା ଉପତ୍ୟକାରେ ଭୂସ୍ଖଳନ ଉପରେ କଡ଼ା ନଜର ରଖାଯାଇଛି। ସମୁଦାୟ **${pop.toLocaleString()} ନାଗରିକଙ୍କ** ନିରାପଦ ସ୍ଥାନାନ୍ତର ଯୋଜନା ପ୍ରସ୍ତୁତ।

#### 2. ଆଶ୍ରୟ ସ୍ଥଳୀର କ୍ଷମତା
ଗୌଚର, କର୍ଣ୍ଣପ୍ରୟାଗ ଏବଂ ରୁଦ୍ରପ୍ରୟାଗରେ ମୋଟ **${cap.toLocaleString()} ନାଗରିକଙ୍କ ପାଇଁ ନିରାପଦ କ୍ଷମତା** ଉପଲବ୍ଧ। ପିପଲକୋଟି କେନ୍ଦ୍ରକୁ ବିପଦ ଯୋଗୁଁ ବାଦ୍ ଦିଆଯାଇଛି।

#### 3. ଅପରେସନ୍ସ ରିସର୍ଚ୍ଚ (OR) ବଣ୍ଟନ ନିଷ୍ପତ୍ତି
- **ଯୋଶୀମଠ (4,500 ଲୋକ):** ଗୌଚର କେନ୍ଦ୍ର (79.2 କିମି)।
- **ତପୋବନ (2,100 ଲୋକ):** ରୁଦ୍ରପ୍ରୟାଗ କେନ୍ଦ୍ର (112.4 କିମି)।
- **ରୈଣୀ (2,400 ଲୋକ):** କର୍ଣ୍ଣପ୍ରୟାଗ କେନ୍ଦ୍ର (68.5 କିମି)।

#### 4. ଅଧିକାରୀଙ୍କ ପାଇଁ ପରାମର୍ଶିତ ପଦକ୍ଷେପ
1. ପ୍ରଥମ ପର୍ଯ୍ୟାୟରେ ବରିଷ୍ଠ ନାଗରିକ, ଦିବ୍ୟାଙ୍ଗ ଏବଂ ଶିଶୁମାନଙ୍କୁ ତୁରନ୍ତ ସ୍ଥାନାନ୍ତର କରନ୍ତୁ।
2. ବିକଳ୍ପ ମାର୍ଗ ଆର୍-12ବି ରେ SDRF ଟିମ୍ ମୁତୟନ ରଖନ୍ତୁ।`,

  as: (context, pop, cap) => `#### 1. বৰ্তমান পৰিস্থিতিৰ চমু বিৱৰণ
চামোলি জিলাৰ যোশীমঠ আৰু অলকানন্দা উপত্যকা অঞ্চলত ভূমিস্খলনৰ ওপৰত তীব্ৰ দৃষ্টি ৰখা হৈছে। মুঠ **${pop.toLocaleString()} জন নাগৰিকৰ** সুৰক্ষিত স্থানান্তৰৰ পৰিকল্পনা সাজু কৰা হৈছে।

#### 2. আশ্ৰয় শিবিৰ আৰু ক্ষমতা বিশ্লেষণ
গৌচৰ, কৰ্ণপ্ৰয়াগ আৰু ৰুদ্ৰপ্ৰয়াগত মুঠ **${cap.toLocaleString()} জন নাগৰিকৰ বাবে সুৰক্ষিত ক্ষমতা** উপলব্ধ। পিপলকোটি আশ্ৰয়স্থল বিপদজনক হোৱাৰ বাবে নিষিদ্ধ কৰা হৈছে।

#### 3. অপাৰেচনছ ৰিচাৰ্ছ (OR) আৱণ্টন সিদ্ধান্ত
- **যোশীমঠ (4,500 জন):** গৌচৰ কেন্দ্ৰ (79.2 কিমি)।
- **তপোবন (2,100 জন):** ৰুদ্ৰপ্ৰয়াগ কেন্দ্ৰ (112.4 কিমি)।
- **ৰৈণী (2,400 জন):** কৰ্ণপ্ৰয়াগ কেন্দ্ৰ (68.5 কিমি)।

#### 4. বিষয়াৰ বাবে তাৎক্ষণিক পদক্ষেপ
1. পৰ্যায় ১ ৰ অধীনত জ্যেষ্ঠ নাগৰিক, বিশেষভাৱে সক্ষম আৰু শিশুক তৎকালীনভাৱে প্ৰেৰণ কৰক।
2. বৈকল্পিক পথ আৰ-১২বি ত এছডিআৰএফ দল নিয়োগ কৰক।`,

  ur: (context, pop, cap) => `#### 1. موجودہ صورتحال کا جائزہ
ضلع چمولی کے جوشیمٹھ اور الکنندا وادی میں زمین دھنسنے کے خطرے کی مسلسل نگرانی کی جا رہی ہے۔ کل **${pop.toLocaleString()} متاثرہ شہریوں** کی محفوظ انخلا کی منصوبہ بندی تیار ہے۔

#### 2. پناہ گاہوں کی صلاحیت اور تجزیہ
گوچر، کرن پریاگ اور ردرپریاگ کے محفوظ مراکز میں کل **${cap.toLocaleString()} افراد کے لیے گنجائش** تصدیق شدہ ہے۔ پیپل کوٹی ریلیف مرکز کو خطرے کے پیش نظر خارج کر دیا گیا ہے۔

#### 3. آپریشنز ریسرچ (OR) تقسیم کا فیصلہ
- **جوشیمٹھ (4,500 افراد):** گوچر ایئرپورٹ مرکز (79.2 کلومیٹر)۔
- **تپوون (2,100 افراد):** ردرپریاگ ریجنل سینٹر (112.4 کلومیٹر)۔
- **رینی (2,400 افراد):** کرن پریاگ ریلیف سینٹر (68.5 کلومیٹر)۔

#### 4. مجاز افسر کے لیے ضروری اقدامات
1. مرحلہ 1 کے تحت معمر افراد، معذورین اور بچوں کے قافلوں کو فوری روانہ کیا جائے۔
2. متبادل راستے R-12B پر SDRF اور NDRF کی امدادی ٹیمیں تعینات رہیں۔`,
};

// Deterministic high-stakes tactical disaster briefing generator (Chamoli demo scenario)
export function generateDeterministicBriefing(
  context: VillageContext,
  queryTopic?: string,
  language = 'en'
): string {
  const lang = (language || 'en').toLowerCase();
  const pop = context.population || 15450;
  const cap = 19500;

  // If a non-English language is requested and a dossier is needed, use the localized dossier
  if (lang !== 'en' && MULTILINGUAL_DOSSIERS[lang]) {
    return MULTILINGUAL_DOSSIERS[lang](context, pop, cap);
  }

  const isR12 = !!context.roadR12Blocked;
  const elderly = context.vulnerableGroups?.elderly || 1240;
  const children = context.vulnerableGroups?.children || 1980;
  const disabled = context.vulnerableGroups?.disabled || 310;
  const totalVuln = elderly + children + disabled;
  const safeSites = getNearestSafeSites(
    context.coordinates?.lat || 30.556,
    context.coordinates?.lng || 79.563,
    isR12
  );

  const nearestSite = safeSites[0];
  const recommendedSite = safeSites.find((s) => s.isRecommended) || safeSites[0];

  if (queryTopic === 'routing' || isR12) {
    return `### 🚨 TACTICAL EVACUATION ROUTE DIRECTIVE (CORRIDOR R12 OBSTRUCTION)

**Target Settlement:** ${context.name} (${context.code})  
**Advisory Level:** RED PRIORITY — URGENT DETOUR MANDATE  
**Recommended Destination:** ${recommendedSite.name} (${recommendedSite.distanceKm} km, ~${recommendedSite.transitTimeMin} min)

---

#### 1. Corridor Vulnerability Assessment
- **Primary Arterial:** Link Road R12 is confirmed **BLOCKED / SHEARED** by active debris subsidence and slope declivity (${context.slopeDegrees}°).
- **Direct Impact:** Straight-line transit to Gauchar Aerodrome via standard SDRF transport is physically severed.
- **Estimated Delay Penalty:** +12.4 km (+38 min transit time) if uncoordinated detours occur.

#### 2. Nearest Safe Sites & OR Diverted Routing
${safeSites
  .map(
    (s) =>
      `- **${s.name}**: ${s.distanceKm} km (~${s.transitTimeMin} min) | Capacity: ${s.effectiveCapacity.toLocaleString()} | *${s.routeStatus}*`
  )
  .join('\n')}

#### 3. Vulnerable Citizen Transit Protocol
- **Special Mobility Count:** **${disabled.toLocaleString()} ambulant/stretcher patients** and **${elderly.toLocaleString()} elderly residents** cannot traverse unpaved detours.
- **Action:** Request 4 SDRF air-ambulances or specialized low-floor all-terrain troop carriers via Helang Helipad immediately.`;
  }

  if (queryTopic === 'vulnerability') {
    return `### 👥 DEMOGRAPHIC IMMOBILITY & LOGISTICS AUDIT

**Sector:** ${context.name} | **Composite Vulnerability Index:** ${formatPercent(context.vulnerabilityScore ?? 0.89, 1)}  
**Nearest Safe Hub:** ${nearestSite.name} (${nearestSite.distanceKm} km, ~${nearestSite.transitTimeMin} min)

---

#### 1. High-Dependency Cohort Breakdown
- **Elderly Dependents (>65y):** ${formatPopulation(elderly)} persons (requires wheelchair / ambulant staff support)
- **Infants & Toddlers (<10y):** ${formatPopulation(children)} persons (requires immediate pediatric hydration & blanket rations)
- **Persons with Disabilities (PwD):** ${formatPopulation(disabled)} persons (stretcher & portable oxygen transit required)
- **Total Specialized Transit Load:** **${formatPopulation(totalVuln)} citizens** (~${formatPercent((totalVuln) / (context.population || 1), 0)} of total village population)

#### 2. Shelter Resource Allocation & Proximity Recommendation
- **Primary Destination (${recommendedSite.name}):** Ensure Medical Tents #4 and #7 are pre-warmed and connected to emergency diesel backup.
- **Bottleneck Countermeasure:** Pre-position **${recommendedSite.bottleneck}** supplies before convoy arrival.
- **Transit Escort:** Assign NDRF 8th Battalion medical corps to lead convoy waves 1 & 2.`;
  }

  // Default Comprehensive Executive Operational Situation Dossier (English)
  return `#### 1. Nearest Safe Relocation Sites Evaluated
${safeSites
  .map(
    (s) =>
      `- **${s.name}** (${s.code}): Distance: **${s.distanceKm} km** (~${s.transitTimeMin} min) | Capacity: **${s.effectiveCapacity.toLocaleString()}** | Bottleneck: *${s.bottleneck}*`
  )
  .join('\n')}

#### 2. Multi-Hazard Geospatial Synthesis
Satellite InSAR displacement maps and geological borehole sensors indicate ground creep rates exceeding **14 mm/week**. Combined with a slope inclination of **${context.slopeDegrees}°**, the risk of sudden catastrophic moraine slippage is categorized as **Extreme**.

#### 3. Recommended Phased Evacuation Protocol
1. **Wave 1 (0–6 Hours):** Dispatch 12 high-clearance 4x4 troop carriers for high-dependency residents to **${recommendedSite.name}**.
2. **Wave 2 (6–18 Hours):** General population movement along NH-07 with dedicated mobile police escort.
3. **Contingency Detour:** If link road R12 shears completely, activate Alternate Track R12-B via Joshimath bypass (+12.4 km).`;
}

// Interactive chat guidance fallback answers for the AI Assistant
export function getChatAssistantFallback(
  userQuery: string,
  _context?: VillageContext
): string {
  const lower = userQuery.toLowerCase();

  if (lower.includes('site') || lower.includes('shelter') || lower.includes('capacity') || lower.includes('safe')) {
    return `### 🏕️ Safe Relocation Sites & Carrying Capacity (Chamoli Buffer Region)

The following safe relocation hubs are verified under strict multi-resource bottleneck constraints:
1. **Gauchar Aerodrome Hub (site-gauchar):** 5,500 effective capacity • Air-bridge enabled runway • Limiting factor: Water (5,200).
2. **Karnaprayag Sports Complex (site-karnaprayag):** 3,800 effective capacity • Central valley transit node • Limiting factor: Space (4,100).
3. **Rudraprayag Regional Center (site-rudraprayag):** 4,200 effective capacity • Primary diversion hub • Limiting factor: Medical (3,900).
4. **Srinagar Garhwal Base (site-srinagar):** 2,500 effective capacity • Deep secondary reserve • Limiting factor: Water (2,800).

*(Note: Pipalkoti Ground Hub is strictly **EXCLUDED** due to active toe-slope landslide risk).*`;
  }

  if (lower.includes('solver') || lower.includes('algorithm') || lower.includes('optimization') || lower.includes('engine') || lower.includes('or')) {
    return `### ⚙️ Operations Research (OR) Allocation Engine

The VISTHAAPAN Allocation Engine models the relocation problem as an **Operations Research Linear Optimization Model**:
- **Objective Function:** Minimize total civilian transit risk, travel time, and evacuation delay while strictly enforcing carrying capacity limits.
- **Hard Constraints:** Shelter safe capacity ceilings, road corridor throughput, zero family-splitting rules, and high-dependency priority scheduling.
- **Benchmark Performance:** Solves 15,450 citizen assignments across 7 habitations in under 15ms with 0.0% optimality gap using Google OR-Tools SCIP.`;
  }

  return `### 🛡️ VISTHAAPAN Platform Intelligence

Thank you for your inquiry regarding the **Chamoli Disaster Relocation Operation**.

- **Monitored Citizen Population:** 15,450 citizens across Joshimath, Raini, Tapovan, Helang, Pandukeshwar, Gopeshwar, and Nandprayag.
- **Immediate Priority Cohort:** Joshimath Wards 4–7 (subsidence rate 14 mm/week).
- **Audited Shelter Capacity:** 19,500 safe shelter spaces across Gauchar, Karnaprayag, Rudraprayag, and Srinagar.
- **Operational Baseline:** Active Plan **#VST-2026-CHM-014** (100% Demand Feasible).

*You can open any workspace via the top navigation bar or review the live GIS map.*`;
}

// Briefing Service API methods connecting to Groq Cloud LLM (openai/gpt-oss-20b)
export const BriefingService = {
  getNearestSafeSites,

  generateCommandBrief: async (
    context: VillageContext,
    topic = 'dossier',
    customQuery?: string,
    language = 'en'
  ): Promise<string> => {
    const lang = (language || 'en').toLowerCase();
    try {
      // First attempt Groq Cloud AI endpoint on backend
      const response = await apiClient.post<{ success: boolean; brief?: string; narrative?: string; data?: any }>(
        '/api/v1/ai/briefing',
        {
          context,
          planningState: context,
          topic,
          customQuery,
          language: lang,
        }
      );
      if (response && (response.brief || response.narrative)) {
        return response.brief || response.narrative || '';
      }
    } catch {
      // Try legacy intelligence endpoint
      try {
        const response = await apiClient.post<{ brief: string }>('/intelligence/briefing', {
          context,
          planningState: context,
          topic,
          customQuery,
          language: lang,
        });
        if (response?.brief) return response.brief;
      } catch {
        // Fallback to deterministic generator
      }
    }

    return generateDeterministicBriefing(context, topic, lang);
  },

  callAssistant: async (
    messages: ChatMessage[],
    userMessage: string,
    language = 'en',
    planningContext?: any
  ): Promise<string> => {
    const lang = (language || 'en').toLowerCase();
    try {
      // Connect to Groq Cloud AI assistant endpoint
      const response = await apiClient.post<{ success: boolean; reply?: string }>(
        '/api/v1/ai/chat',
        {
          userMessage,
          message: userMessage,
          messages,
          language: lang,
          currentPlanningContext: planningContext,
        }
      );
      if (response?.reply) {
        return response.reply;
      }
    } catch {
      // Fallback to local deterministic assistant answers
    }

    const lastUserQuery = userMessage || (messages.length > 0 ? messages[messages.length - 1].text : '');
    return getChatAssistantFallback(lastUserQuery, planningContext);
  },
};
