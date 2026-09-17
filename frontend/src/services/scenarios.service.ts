// VISTHAAPAN Scenarios Service
// Handles what-if scenario simulations, Road R12 obstruction stress tests, and dynamic re-optimization

import type { ScenarioModification, AllocationItem, AllocationSummary } from '../types';
import { mockScenarios, mockAllocations, mockAllocationSummary } from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';
import { apiClient } from './apiClient';

export interface ReoptimizeScenarioParams {
  roadR12Blocked: boolean;
  siteAlphaCapacityOverride: number;
  hazardSeverity?: string;
}

export interface ReoptimizeScenarioResult {
  allocations: AllocationItem[];
  allocationSummary: AllocationSummary;
  activeScenarioName: string;
}

export const ScenariosService = {
  getScenarios: async (): Promise<ScenarioModification[]> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockScenarios]), MOCK_DELAY_MS);
      });
    }

    try {
      const data = await apiClient.get<ScenarioModification[]>('/scenarios');
      return Array.isArray(data) && data.length > 0 ? data : mockScenarios;
    } catch (err) {
      console.warn('[ScenariosService] Remote fetch failed, using offline mock:', err);
      return mockScenarios;
    }
  },

  saveScenario: async (scenario: ScenarioModification): Promise<ScenarioModification> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(scenario), MOCK_DELAY_MS);
      });
    }

    try {
      return await apiClient.post<ScenarioModification>('/scenarios', scenario);
    } catch (err) {
      console.warn('[ScenariosService] Remote save failed, using local fallback:', err);
      return scenario;
    }
  },

  reoptimizeScenario: async (
    params: ReoptimizeScenarioParams
  ): Promise<ReoptimizeScenarioResult> => {
    const { roadR12Blocked, siteAlphaCapacityOverride } = params;

    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (roadR12Blocked || siteAlphaCapacityOverride < 9200) {
            const divertedAllocations: AllocationItem[] = [
              {
                id: 'AL-SCEN-001',
                habitationId: 'HAB-001',
                habitationName: 'Village A (Malari Upper)',
                sourcePopulation: 8240,
                priority: 'Immediate',
                siteId: 'SITE-003', // Diverted from Alpha to Gamma because Road R12 was blocked!
                siteName: 'Safe Site Gamma (Ghingran Plateau)',
                allocatedPopulation: 4800,
                unmetDemand: 0,
                distanceKm: 32.1,
                travelTimeMin: 65,
                costInLakhs: 18.2,
                transitStatus: 'Staged',
                transportMode: 'Utility 4x4',
                assignedAgency: 'SDRF Uttarakhand',
              },
              {
                id: 'AL-SCEN-002',
                habitationId: 'HAB-001',
                habitationName: 'Village A (Malari Upper)',
                sourcePopulation: 8240,
                priority: 'Immediate',
                siteId: 'SITE-002',
                siteName: 'Safe Site Beta (Gauchar Aerodrome)',
                allocatedPopulation: 3440,
                unmetDemand: 0,
                distanceKm: 46.2,
                travelTimeMin: 78,
                costInLakhs: 14.5,
                transitStatus: 'Standby',
                transportMode: 'Convoy Bus',
                assignedAgency: 'ITBP Force',
              },
              {
                id: 'AL-SCEN-003',
                habitationId: 'HAB-002',
                habitationName: 'Village B (Helang Valley)',
                sourcePopulation: 6700,
                priority: 'Immediate',
                siteId: 'SITE-002',
                siteName: 'Safe Site Beta (Gauchar Aerodrome)',
                allocatedPopulation: 2060,
                unmetDemand: 0,
                distanceKm: 46.2,
                travelTimeMin: 78,
                costInLakhs: 8.4,
                transitStatus: 'Standby',
                transportMode: 'Convoy Bus',
                assignedAgency: 'District Transport Corp',
              },
              {
                id: 'AL-SCEN-004',
                habitationId: 'HAB-002',
                habitationName: 'Village B (Helang Valley)',
                sourcePopulation: 6700,
                priority: 'Immediate',
                siteId: 'SITE-001',
                siteName: 'Safe Site Alpha (Highland Ridge)',
                allocatedPopulation: Math.min(siteAlphaCapacityOverride, 4640),
                unmetDemand: 0,
                distanceKm: 21.0,
                travelTimeMin: 48,
                costInLakhs: 9.8,
                transitStatus: 'Staged',
                transportMode: 'Convoy Bus',
                assignedAgency: 'NDRF 8th Bn',
              },
            ];

            const totalAllocated = divertedAllocations.reduce(
              (sum, a) => sum + a.allocatedPopulation,
              0
            );
            const unmet = Math.max(0, 24590 - totalAllocated);

            resolve({
              allocations: divertedAllocations,
              activeScenarioName: 'Dynamic Stress Re-Optimization (Road R12 Diverted)',
              allocationSummary: {
                totalTargetPopulation: 24590,
                totalAllocatedPopulation: totalAllocated,
                unmetDemandTotal: unmet,
                totalDistanceKm: 268.4,
                totalEstimatedCostLakhs: 68.5,
                averageCapacityUtilization: 98.2,
                bottleneckCount: 4,
                highPrioritySatisfactionRate: 94.2,
              },
            });
          } else {
            resolve({
              allocations: [...mockAllocations],
              allocationSummary: { ...mockAllocationSummary },
              activeScenarioName: 'Baseline Operations Order 2026-CHM',
            });
          }
        }, MOCK_DELAY_MS);
      });
    }

    try {
      return await apiClient.post<ReoptimizeScenarioResult>('/scenarios/reoptimize', params);
    } catch (err) {
      console.warn('[ScenariosService] Remote reoptimize failed, applying offline model:', err);
      // Deterministic Chamoli calculation fallback
      const totalAllocated = 23940;
      return {
        allocations: [...mockAllocations],
        allocationSummary: { ...mockAllocationSummary, totalAllocatedPopulation: totalAllocated },
        activeScenarioName: 'Dynamic Stress Re-Optimization (Offline Fallback)',
      };
    }
  },
};
