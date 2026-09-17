import type { RelocationSite } from '../types';
import { mockSites } from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';

export const SitesService = {
  getSites: async (): Promise<RelocationSite[]> => {
    if (USE_MOCK_API) {
      return new Promise(resolve => setTimeout(() => resolve(mockSites), MOCK_DELAY_MS));
    }
    const response = await fetch('/api/sites');
    if (!response.ok) throw new Error('Failed to fetch sites');
    return response.json();
  },
  
  getSiteById: async (id: string): Promise<RelocationSite | undefined> => {
    if (USE_MOCK_API) {
      return new Promise(resolve => setTimeout(() => {
        resolve(mockSites.find(s => s.id === id));
      }, MOCK_DELAY_MS));
    }
    const response = await fetch(`/api/sites/${id}`);
    if (!response.ok) throw new Error('Failed to fetch site');
    return response.json();
  }
};
