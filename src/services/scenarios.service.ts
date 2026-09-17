import type { Scenario } from '../types';
import { mockScenarios } from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';

export const ScenariosService = {
  getScenarios: async (): Promise<Scenario[]> => {
    if (USE_MOCK_API) {
      return new Promise(resolve => setTimeout(() => resolve(mockScenarios), MOCK_DELAY_MS));
    }
    const response = await fetch('/api/scenarios');
    if (!response.ok) throw new Error('Failed to fetch scenarios');
    return response.json();
  },
  
  saveScenario: async (scenario: Scenario): Promise<Scenario> => {
    if (USE_MOCK_API) {
      return new Promise(resolve => setTimeout(() => resolve(scenario), MOCK_DELAY_MS));
    }
    const response = await fetch('/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario)
    });
    if (!response.ok) throw new Error('Failed to save scenario');
    return response.json();
  }
};
