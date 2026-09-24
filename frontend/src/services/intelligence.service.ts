// VISTHAAPAN Risk Intelligence Service
// Provides AI hazard risk scoring, SHAP feature contributions, data provenance, and quality benchmarks

import type {
  RiskIntelligenceAssessment,
  DataSourceProvenance,
  DataQualityBenchmark,
} from '../types';
import {
  mockRiskIntelligence,
  mockDataProvenances,
  mockDataQualityBenchmarks,
} from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';
import { apiClient } from './apiClient';

export interface IntelligenceInsight {
  habitationId: string;
  riskFactors: { factor: string; contribution: number }[];
  modelConfidence: number;
}

export const IntelligenceService = {
  getRiskAssessment: async (
    habitationId: string
  ): Promise<RiskIntelligenceAssessment | undefined> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockRiskIntelligence[habitationId] || mockRiskIntelligence['HAB-001']);
        }, MOCK_DELAY_MS);
      });
    }

    try {
      return await apiClient.get<RiskIntelligenceAssessment>(
        `/intelligence/risk/${encodeURIComponent(habitationId)}`
      );
    } catch (err) {
      console.warn(`[IntelligenceService] Failed to fetch risk assessment for ${habitationId}:`, err);
      return mockRiskIntelligence[habitationId] || mockRiskIntelligence['HAB-001'];
    }
  },

  getAllRiskAssessments: async (): Promise<Record<string, RiskIntelligenceAssessment>> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...mockRiskIntelligence }), MOCK_DELAY_MS);
      });
    }

    try {
      const data = await apiClient.get<Record<string, RiskIntelligenceAssessment>>('/intelligence/risk');
      return data || mockRiskIntelligence;
    } catch (err) {
      console.warn('[IntelligenceService] Failed to fetch all risk assessments:', err);
      return mockRiskIntelligence;
    }
  },

  getDataProvenances: async (): Promise<DataSourceProvenance[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockDataProvenances]), MOCK_DELAY_MS);
      });
    }

    try {
      const data = await apiClient.get<DataSourceProvenance[]>('/intelligence/provenance');
      return Array.isArray(data) && data.length > 0 ? data : mockDataProvenances;
    } catch (err) {
      console.warn('[IntelligenceService] Failed to fetch data provenance:', err);
      return mockDataProvenances;
    }
  },

  getDataQualityBenchmarks: async (): Promise<DataQualityBenchmark[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockDataQualityBenchmarks]), MOCK_DELAY_MS);
      });
    }

    try {
      const data = await apiClient.get<DataQualityBenchmark[]>('/intelligence/quality-benchmarks');
      return Array.isArray(data) && data.length > 0 ? data : mockDataQualityBenchmarks;
    } catch (err) {
      console.warn('[IntelligenceService] Failed to fetch quality benchmarks:', err);
      return mockDataQualityBenchmarks;
    }
  },

  // ============================================================
  // Phase 5 Authoritative District AI Intelligence Endpoints
  // ============================================================

  /**
   * Lists district intelligence profiles with operational RPW tiers.
   * GET /api/v1/intelligence/districts
   */
  getDistrictsIntelligence: async (params?: {
    tier?: string;
    state?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> => {
    try {
      const resp = await apiClient.get<any>('/intelligence/districts', { params });
      return resp?.data || resp;
    } catch (err) {
      console.warn('[IntelligenceService] Failed to fetch district intelligence list:', err);
      return null;
    }
  },

  /**
   * Detailed intelligence profile for a single district including SHAP attributions.
   * GET /api/v1/intelligence/districts/:districtId
   */
  getDistrictIntelligenceDetail: async (districtId: string): Promise<any> => {
    try {
      const resp = await apiClient.get<any>(`/intelligence/districts/${encodeURIComponent(districtId)}`);
      return resp?.data || resp;
    } catch (err) {
      console.warn(`[IntelligenceService] Failed to fetch district detail for ${districtId}:`, err);
      return null;
    }
  },

  /**
   * Active model version, training metrics, and lineage.
   * GET /api/v1/intelligence/model
   */
  getActiveModelInfo: async (): Promise<any> => {
    try {
      const resp = await apiClient.get<any>('/intelligence/model');
      return resp?.data || resp;
    } catch (err) {
      console.warn('[IntelligenceService] Failed to fetch active model info:', err);
      return null;
    }
  },

  // Backward compatibility method
  getInsightsForHabitation: async (id: string): Promise<IntelligenceInsight | null> => {
    const assessment = await IntelligenceService.getRiskAssessment(id);
    if (!assessment) return null;

    return {
      habitationId: assessment.habitationId,
      modelConfidence: assessment.confidenceScore,
      riskFactors: assessment.features.map((f) => ({
        factor: f.feature,
        contribution: f.importanceWeight,
      })),
    };
  },
};

