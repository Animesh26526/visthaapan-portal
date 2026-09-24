// VISTHAAPAN Sites Service
// Manages safe relocation hubs, carrying capacities, and shelter audits

import type { RelocationSite } from '../types';
import { mockSites } from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';
import { apiClient } from './apiClient';

export const SitesService = {
  getSites: async (): Promise<RelocationSite[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockSites]), MOCK_DELAY_MS);
      });
    }

    try {
      const data = await apiClient.get<RelocationSite[]>('/sites');
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return mockSites;
    } catch (err) {
      console.error('[SitesService] Remote fetch failed from backend database:', err);
      throw err;
    }
  },

  getSiteById: async (id: string): Promise<RelocationSite | undefined> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockSites.find((s) => s.id === id));
        }, MOCK_DELAY_MS);
      });
    }

    try {
      return await apiClient.get<RelocationSite>(`/sites/${encodeURIComponent(id)}`);
    } catch (err) {
      console.error(`[SitesService] Failed to fetch site ${id} from backend:`, err);
      throw err;
    }
  },
};
