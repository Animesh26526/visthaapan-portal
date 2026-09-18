/**
 * VISTHAAPAN Phase 7 Capacity & Resource Bottlenecks Service
 * Communicates with /api/v1/capacity endpoints.
 */

import { apiClient } from './apiClient';

export interface SiteCapacityItem {
  siteId: string;
  siteName: string;
  district: string;
  siteType: string;
  insideRedZone: boolean;
  hardHazardExclusion: boolean;
  nominalCapacity: number;
  effectiveCapacity: number;
  usableCapacity: number;
  availableCapacity: number;
  currentOccupancy: number;
  utilizationPercent: number;
  bottleneckDimension: string;
  bottleneckValue: number;
  limitingFactor: string;
  capacityStatus: 'ADEQUATE' | 'BOTTLENECK_CONSTRAINED' | 'CRITICALLY_LIMITED' | 'RESTRICTED_BY_HAZARD';
  resourceBreakdown: {
    physical: number;
    water: number;
    shelter: number;
    sanitation: number;
    healthcare: number;
    electricity: number;
    access: number;
  };
  suitabilityScore: number;
  suitabilityTier: string;
  safetyScore: number;
  dataOrigin: string;
  confidence: number;
  uncertaintyFlags: string[];
}

export interface RelocationDemandItem {
  id?: string;
  demandNodeId: string;
  habitationId?: string;
  canonicalDistrictId?: string;
  nodeName: string;
  districtName: string;
  stateName: string;
  totalPopulation: number;
  relocationDemand: number;
  priorityWeight: number;
  operationalTier: 'immediate' | 'short-term' | 'medium-term';
  demandDerivationMethod: string;
  dataOrigin: string;
  populationSource: string;
  hazardExposureStatus: string;
  uncertaintyFlags: string[];
  latitude?: number;
  longitude?: number;
}

export interface CapacitySummaryData {
  totalDemandPopulation: number;
  totalSafeEffectiveCapacity: number;
  totalNominalCapacity: number;
  totalRestrictedCapacity: number;
  netCapacityBalance: number;
  isDeficit: boolean;
  siteCount: number;
  safeSiteCount: number;
  restrictedSiteCount: number;
  bottleneckDistribution: Record<string, number>;
  operationalTierDemand: {
    immediate: number;
    shortTerm: number;
    mediumTerm: number;
  };
  dataOrigin: string;
  uncertaintyNotes: string[];
}

export const CapacityService = {
  /**
   * Fetches all candidate sites with effective capacity, limiting bottleneck, and safety exclusion status.
   * GET /api/v1/capacity/sites
   */
  getSitesCapacity: async (): Promise<SiteCapacityItem[]> => {
    try {
      const resp = await apiClient.get<any>('/capacity/sites');
      return resp?.data || resp || [];
    } catch (err) {
      console.warn('[CapacityService] Failed to fetch sites capacity:', err);
      return [];
    }
  },

  /**
   * Fetches detailed capacity assessment for a single site.
   * GET /api/v1/capacity/sites/:siteId
   */
  getSiteCapacityById: async (siteId: string): Promise<SiteCapacityItem | null> => {
    try {
      const resp = await apiClient.get<any>(`/capacity/sites/${encodeURIComponent(siteId)}`);
      return resp?.data || resp || null;
    } catch (err) {
      console.warn(`[CapacityService] Failed to fetch site capacity for ${siteId}:`, err);
      return null;
    }
  },

  /**
   * Fetches relocation demand nodes with RPW and operational tiers.
   * GET /api/v1/capacity/demand
   */
  getRelocationDemand: async (tier?: string): Promise<RelocationDemandItem[]> => {
    try {
      const resp = await apiClient.get<any>('/capacity/demand', {
        params: tier ? { tier } : undefined,
      });
      return resp?.data || resp || [];
    } catch (err) {
      console.warn('[CapacityService] Failed to fetch relocation demand:', err);
      return [];
    }
  },

  /**
   * Fetches aggregate capacity summary metrics.
   * GET /api/v1/capacity/summary
   */
  getCapacitySummary: async (): Promise<CapacitySummaryData | null> => {
    try {
      const resp = await apiClient.get<any>('/capacity/summary');
      return resp?.data || resp || null;
    } catch (err) {
      console.warn('[CapacityService] Failed to fetch capacity summary:', err);
      return null;
    }
  },

  /**
   * Triggers recomputation of capacity assessments and demand nodes.
   * POST /api/v1/capacity/recalculate
   */
  recalculateCapacities: async (): Promise<any> => {
    try {
      const resp = await apiClient.post<any>('/capacity/recalculate', {});
      return resp?.data || resp;
    } catch (err) {
      console.warn('[CapacityService] Failed to recalculate capacities:', err);
      throw err;
    }
  },
};
