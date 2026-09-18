// VISTHAAPAN Allocations Service
// Handles MILP allocation retrieval, optimization requests, and explainability data

import type {
  AllocationItem,
  AllocationSummary,
  AllocationExplanation,
  RelocationPlanPhase,
} from '../types';
import {
  mockAllocations,
  mockAllocationSummary,
  mockAllocationExplanation,
  mockRelocationPhases,
} from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';
import { apiClient } from './apiClient';

export interface OptimizationRequestPayload {
  habitationIds?: string[];
  siteIds?: string[];
  roadR12Blocked?: boolean;
  siteCapacityOverrides?: Record<string, number>;
  hazardSeverity?: string;
}

export interface OptimizationResponse {
  allocations: AllocationItem[];
  summary: AllocationSummary;
}

export const AllocationsService = {
  getAllocations: async (): Promise<AllocationItem[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockAllocations]), MOCK_DELAY_MS);
      });
    }

    try {
      const data = await apiClient.get<AllocationItem[]>('/allocations');
      return Array.isArray(data) && data.length > 0 ? data : mockAllocations;
    } catch (err) {
      console.warn('[AllocationsService] Remote fetch failed, using offline mock:', err);
      return mockAllocations;
    }
  },

  getAllocationSummary: async (): Promise<AllocationSummary> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...mockAllocationSummary }), MOCK_DELAY_MS);
      });
    }

    try {
      return await apiClient.get<AllocationSummary>('/allocations/summary');
    } catch (err) {
      console.warn('[AllocationsService] Remote summary fetch failed, using offline mock:', err);
      return mockAllocationSummary;
    }
  },

  getAllocationExplanation: async (): Promise<AllocationExplanation> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...mockAllocationExplanation }), MOCK_DELAY_MS);
      });
    }

    try {
      return await apiClient.get<AllocationExplanation>('/allocations/explanation');
    } catch (err) {
      console.warn('[AllocationsService] Remote explanation fetch failed, using offline mock:', err);
      return mockAllocationExplanation;
    }
  },

  getRelocationPhases: async (): Promise<RelocationPlanPhase[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockRelocationPhases]), MOCK_DELAY_MS);
      });
    }

    try {
      const data = await apiClient.get<RelocationPlanPhase[]>('/allocations/phases');
      return Array.isArray(data) && data.length > 0 ? data : mockRelocationPhases;
    } catch (err) {
      console.warn('[AllocationsService] Remote phases fetch failed, using offline mock:', err);
      return mockRelocationPhases;
    }
  },

  generateOptimalAllocation: async (
    payload: OptimizationRequestPayload
  ): Promise<OptimizationResponse> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            allocations: [...mockAllocations],
            summary: { ...mockAllocationSummary },
          });
        }, MOCK_DELAY_MS * 2);
      });
    }

    try {
      return await apiClient.post<OptimizationResponse>('/allocations/optimize', payload);
    } catch (err) {
      console.warn('[AllocationsService] Remote optimization failed, using fallback:', err);
      return {
        allocations: [...mockAllocations],
        summary: { ...mockAllocationSummary },
      };
    }
  },

  // ============================================================
  // Canonical Phase 8 REST Endpoints (/api/v1/optimization)
  // ============================================================

  /**
   * Fetches latest OR-Tools optimization run with full allocations, explanations, and constraint audit.
   * GET /api/v1/optimization/runs/latest
   */
  getLatestOptimizationRun: async (): Promise<any> => {
    try {
      const resp = await apiClient.get<any>('/optimization/runs/latest');
      return resp?.data || resp;
    } catch (err) {
      console.warn('[AllocationsService] Failed to fetch latest optimization run:', err);
      return null;
    }
  },

  /**
   * Triggers a new optimization run with custom constraints.
   * POST /api/v1/optimization/run
   */
  runOrToolsOptimization: async (options?: any): Promise<any> => {
    try {
      const resp = await apiClient.post<any>('/optimization/run', options || {});
      return resp?.data || resp;
    } catch (err) {
      console.warn('[AllocationsService] Failed to run OR-Tools optimization:', err);
      throw err;
    }
  },

  /**
   * Lists past optimization runs.
   * GET /api/v1/optimization/runs
   */
  listOptimizationRuns: async (): Promise<any[]> => {
    try {
      const resp = await apiClient.get<any>('/optimization/runs');
      return resp?.data || resp || [];
    } catch (err) {
      console.warn('[AllocationsService] Failed to list optimization runs:', err);
      return [];
    }
  },
};

