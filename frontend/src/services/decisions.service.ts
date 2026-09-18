// VISTHAAPAN Statutory Decisions Service
// Manages Incident Commander review decisions, legal audit ledger, and statutory authorizations

import type { OfficerDecision } from '../types';
import { mockDecisions } from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';
import { apiClient } from './apiClient';

// In-memory fallback only when explicitly in mock mode
let inMemoryDecisions: OfficerDecision[] = [...mockDecisions];

export const DecisionsService = {
  getDecisions: async (): Promise<OfficerDecision[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...inMemoryDecisions]), MOCK_DELAY_MS);
      });
    }

    try {
      const data = await apiClient.get<OfficerDecision[]>('/decisions');
      if (Array.isArray(data)) {
        return data;
      }
      return inMemoryDecisions;
    } catch (err) {
      console.error('[DecisionsService] Failed to fetch decisions from backend database:', err);
      throw err;
    }
  },

  recordDecision: async (
    decision: Omit<OfficerDecision, 'id' | 'timestamp' | 'date' | 'time'> & Partial<OfficerDecision>
  ): Promise<OfficerDecision> => {
    const now = new Date();
    const newDecision: OfficerDecision = {
      id: decision.id || `DEC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: decision.timestamp || now.toISOString(),
      date: decision.date || now.toISOString().split('T')[0],
      time: decision.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      officerName: decision.officerName || 'Shri R. K. Sharma, IAS',
      officerRole: decision.officerRole || 'Incident Commander',
      action: decision.action || 'ACCEPTED',
      planId: decision.planId || 'PLAN-CHM-2026-001',
      affectedHabitations: decision.affectedHabitations || [],
      affectedSites: decision.affectedSites || [],
      rationale: decision.rationale || 'Adjudicated in accordance with Disaster Management Act 2005.',
      statutoryReference: decision.statutoryReference || 'Section 34, DM Act 2005',
      previousAllocationSummary: decision.previousAllocationSummary || '',
      newAllocationSummary: decision.newAllocationSummary || '',
    };

    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          inMemoryDecisions = [newDecision, ...inMemoryDecisions];
          resolve(newDecision);
        }, MOCK_DELAY_MS);
      });
    }

    try {
      const res = await apiClient.post<any>('/decisions', newDecision);
      const saved: OfficerDecision = res?.data || res;
      inMemoryDecisions = [saved, ...inMemoryDecisions];
      return saved;
    } catch (err) {
      console.error('[DecisionsService] Failed to record decision in PostgreSQL audit trail:', err);
      throw err;
    }
  },
};
