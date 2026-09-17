// VISTHAAPAN Habitations Service
// Manages data access for monitored habitations/settlements in Chamoli sector

import type { Habitation } from '../types';
import { mockHabitations } from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';
import { apiClient } from './apiClient';

export const HabitationsService = {
  getHabitations: async (): Promise<Habitation[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockHabitations]), MOCK_DELAY_MS);
      });
    }

    try {
      const data = await apiClient.get<Habitation[]>('/habitations');
      return Array.isArray(data) && data.length > 0 ? data : mockHabitations;
    } catch (err) {
      console.warn('[HabitationsService] Remote fetch failed, using offline fallback:', err);
      return mockHabitations;
    }
  },

  getHabitationById: async (id: string): Promise<Habitation | undefined> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockHabitations.find((h) => h.id === id));
        }, MOCK_DELAY_MS);
      });
    }

    try {
      return await apiClient.get<Habitation>(`/habitations/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn(`[HabitationsService] Failed to fetch habitation ${id}, using fallback:`, err);
      return mockHabitations.find((h) => h.id === id);
    }
  },
};
