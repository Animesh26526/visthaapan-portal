// VISTHAAPAN Phase 9 Evidence & Provenance Service
// Manages Chamoli DDMP 2026-27 documentary planning knowledge and authoritative data lineage

import { apiClient } from './apiClient';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';

export interface DistrictEvidenceCategory {
  id: string;
  category: string;
  title: string;
  description: string;
  referencePage?: string;
  metadata: Record<string, any>;
  confidence: number;
  dataOrigin: string;
  createdAt: string;
}

export interface DistrictEvidenceResponse {
  success: boolean;
  district: string;
  sourceDocument: string;
  authority: string;
  documentType: string;
  planYear: string;
  dataOrigin: string;
  evidenceCount: number;
  disclaimer: string;
  categories: {
    vulnerableHabitations: DistrictEvidenceCategory[];
    relocationHistory: DistrictEvidenceCategory[];
    temporaryShelters: DistrictEvidenceCategory[];
    roadCorridors: DistrictEvidenceCategory[];
    resourceContext: DistrictEvidenceCategory[];
    historicalDisasters: DistrictEvidenceCategory[];
    helipads: DistrictEvidenceCategory[];
  };
  rawList: DistrictEvidenceCategory[];
}

export interface ProvenanceRecord {
  id: string;
  datasetName: string;
  authority: string;
  recordsCount: number | string;
  coverage: string;
  dataOrigin: string;
  badge: string;
  status: string;
  limitations: string;
}

export interface CommandCenterSummary {
  systemStatus: string;
  activeJurisdiction: string;
  incidentCommander: string;
  timestamp: string;
  totalMonitoredDistricts: number;
  totalDisasterEventsRecorded: number;
  totalHealthcareFacilities: number;
  ddmpDocumentaryEvidenceRecords: number;
  monitoredHabitations: number;
  highPriorityHabitations: number;
  candidateSafeSites: number;
  restrictedHazardSites: number;
  totalShelterDemandPopulation: number;
  totalSafeEffectiveCapacity: number;
  totalNominalCapacity: number;
  allocatedPopulation: number;
  unmetDemand: number;
  allocationSatisfactionRate: number;
  totalAdjudicatedDecisions: number;
  pendingOfficerReviews: number;
  provenanceFlags: Record<string, string>;
}

export const EvidenceService = {
  getDistrictEvidence: async (districtId = 'Chamoli'): Promise<DistrictEvidenceResponse> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            district: 'Chamoli',
            sourceDocument: 'Chamoli DDMP 2026-27',
            authority: 'District Disaster Management Authority (DDMA), Chamoli',
            documentType: 'District Disaster Management Plan',
            planYear: '2026-27',
            dataOrigin: 'REAL',
            evidenceCount: 30,
            disclaimer: 'Administrative documentary baseline.',
            categories: {
              vulnerableHabitations: [],
              relocationHistory: [],
              temporaryShelters: [],
              roadCorridors: [],
              resourceContext: [],
              historicalDisasters: [],
              helipads: [],
            },
            rawList: [],
          });
        }, MOCK_DELAY_MS);
      });
    }

    try {
      return await apiClient.get<DistrictEvidenceResponse>(`/evidence/ddmp/${encodeURIComponent(districtId)}`);
    } catch (err) {
      console.error(`[EvidenceService] Failed to load DDMP evidence for district ${districtId}:`, err);
      throw err;
    }
  },

  getProvenanceRegistry: async (): Promise<ProvenanceRecord[]> => {
    if (USE_MOCK_API) {
      return [];
    }

    try {
      const res = await apiClient.get<{ success: boolean; data: ProvenanceRecord[] }>('/evidence/provenance');
      return res.data || [];
    } catch (err) {
      console.error('[EvidenceService] Failed to load provenance registry from backend:', err);
      throw err;
    }
  },

  getCommandCenterSummary: async (): Promise<CommandCenterSummary> => {
    if (USE_MOCK_API) {
      return {
        systemStatus: 'OPERATIONAL',
        activeJurisdiction: 'Chamoli District, Uttarakhand',
        incidentCommander: 'Shri R. K. Sharma, IAS (District Magistrate)',
        timestamp: new Date().toISOString(),
        totalMonitoredDistricts: 785,
        totalDisasterEventsRecorded: 47621,
        totalHealthcareFacilities: 30273,
        ddmpDocumentaryEvidenceRecords: 30,
        monitoredHabitations: 5,
        highPriorityHabitations: 3,
        candidateSafeSites: 5,
        restrictedHazardSites: 1,
        totalShelterDemandPopulation: 24590,
        totalSafeEffectiveCapacity: 38450,
        totalNominalCapacity: 45000,
        allocatedPopulation: 15450,
        unmetDemand: 0,
        allocationSatisfactionRate: 100.0,
        totalAdjudicatedDecisions: 0,
        pendingOfficerReviews: 1,
        provenanceFlags: {},
      };
    }

    try {
      const res = await apiClient.get<{ success: boolean; data: CommandCenterSummary }>('/command-center/summary');
      return res.data;
    } catch (err) {
      console.error('[EvidenceService] Failed to load command center KPIs from database:', err);
      throw err;
    }
  },
};
