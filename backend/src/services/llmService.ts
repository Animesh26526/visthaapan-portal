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
      narrativeMarkdown: `### 📋 आधिकारिक आपदा नियंत्रण ब्रीफिंग (चमोली जनपद)
**दस्तावेज़ संख्या:** BRIEF-CHM-2026-HI  
**भाषा:** ${languageName}  
**प्राधिकरण:** जिला आपातकालीन संचालन केंद्र (DEOC), गोपेश्वर

---

#### 1. वर्तमान स्थिति का संक्षिप्त विवरण
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
    narrativeMarkdown: `### 📋 EXECUTIVE SITUATION BRIEF (CHAMOLI SECTOR)
**Document ID:** BRIEF-CHM-2026-EN  
**Language:** ${languageName}  
**Authority:** District Emergency Operations Centre (DEOC), Gopeshwar

---

#### 1. Executive Situation Overview
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
