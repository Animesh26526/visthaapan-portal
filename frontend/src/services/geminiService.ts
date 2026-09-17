// VISTHAAPAN Gemini Intelligence Service (Deprecated facade)
// Re-exports from BriefingService to maintain backward compatibility across UI components.
// All browser-direct Gemini calls, API keys, and external endpoints have been removed.

import {
  type VillageContext,
  type ComputedSafeSite,
  type ChatMessage,
  getNearestSafeSites,
  generateDeterministicBriefing,
  generateDeterministicChatReply,
  BriefingService,
} from './briefing.service';

export type { VillageContext, ComputedSafeSite, ChatMessage };
export { getNearestSafeSites, generateDeterministicChatReply };

// Backward compatibility alias for deterministic briefing
export const generatePrecomputedBriefing = generateDeterministicBriefing;

// Backward compatibility facade for command briefing
export async function callLiveGeminiAPI(
  _apiKey: string,
  context: VillageContext,
  customQuery: string,
  topic = 'dossier'
): Promise<string> {
  return BriefingService.generateCommandBrief(context, topic, customQuery);
}

// Backward compatibility facade for conversational assistant
export async function callGeminiChatBot(
  history: ChatMessage[],
  newMessage: string
): Promise<string> {
  return BriefingService.callAssistant(history, newMessage);
}

// Legacy key stubs - no longer persist or expose sensitive credentials in browser
export function getStoredGeminiKey(): string {
  return '';
}

export function saveStoredGeminiKey(_key: string): void {
  // No-op: API keys are strictly managed backend-side
}
