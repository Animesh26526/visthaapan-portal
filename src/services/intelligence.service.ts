
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';

export interface IntelligenceInsight {
  habitationId: string;
  riskFactors: { factor: string; contribution: number }[];
  modelConfidence: number;
}

const mockInsights: Record<string, IntelligenceInsight> = {
  'H001': {
    habitationId: 'H001',
    riskFactors: [
      { factor: 'Flood Exposure', contribution: 0.6 },
      { factor: 'Historical Impact', contribution: 0.25 },
      { factor: 'Infrastructure Vulnerability', contribution: 0.15 }
    ],
    modelConfidence: 0.91
  }
};

export const IntelligenceService = {
  getInsightsForHabitation: async (id: string): Promise<IntelligenceInsight | null> => {
    if (USE_MOCK_API) {
      return new Promise(resolve => setTimeout(() => resolve(mockInsights[id] || null), MOCK_DELAY_MS));
    }
    const response = await fetch(`/api/intelligence/habitation/${id}`);
    if (!response.ok) throw new Error('Failed to fetch intelligence insights');
    return response.json();
  }
};
