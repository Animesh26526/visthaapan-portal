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
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return mockHabitations;
    } catch (err) {
      console.error('[HabitationsService] Failed to fetch habitations from database:', err);
      throw err;
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
      console.error(`[HabitationsService] Failed to fetch habitation ${id} from database:`, err);
      throw err;
    }
  },
};
