import type { Allocation } from '../types';
import { mockAllocations } from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';

export const AllocationsService = {
  getAllocations: async (): Promise<Allocation[]> => {
    if (USE_MOCK_API) {
      return new Promise(resolve => setTimeout(() => resolve(mockAllocations), MOCK_DELAY_MS));
    }
    const response = await fetch('/api/allocations');
    if (!response.ok) throw new Error('Failed to fetch allocations');
    return response.json();
  },
  
  generateOptimalAllocation: async (payload: { habitationIds: string[], siteIds: string[] }): Promise<Allocation[]> => {
    if (USE_MOCK_API) {
      return new Promise(resolve => setTimeout(() => resolve(mockAllocations), MOCK_DELAY_MS * 2));
    }
    const response = await fetch('/api/allocations/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to generate allocation');
    return response.json();
  }
};
