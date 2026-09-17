import type { Habitation } from '../types';
import { mockHabitations } from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';

export const HabitationsService = {
  getHabitations: async (): Promise<Habitation[]> => {
    if (USE_MOCK_API) {
      return new Promise(resolve => setTimeout(() => resolve(mockHabitations), MOCK_DELAY_MS));
    }
    const response = await fetch('/api/habitations');
    if (!response.ok) throw new Error('Failed to fetch habitations');
    return response.json();
  },
  
  getHabitationById: async (id: string): Promise<Habitation | undefined> => {
    if (USE_MOCK_API) {
      return new Promise(resolve => setTimeout(() => {
        resolve(mockHabitations.find(h => h.id === id));
      }, MOCK_DELAY_MS));
    }
    const response = await fetch(`/api/habitations/${id}`);
    if (!response.ok) throw new Error('Failed to fetch habitation');
    return response.json();
  }
};
