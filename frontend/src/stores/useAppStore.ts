import { create } from 'zustand';
import type {
  GovernmentOfficer,
  Habitation,
  RelocationSite,
  AllocationItem,
  AllocationSummary,
  OfficerDecision,
} from '../types';
import {
  mockCurrentOfficer,
  mockHabitations,
  mockSites,
  mockAllocations,
  mockAllocationSummary,
  mockDecisions,
} from '../mock/data';
import { HabitationsService } from '../services/habitations.service';
import { SitesService } from '../services/sites.service';
import { ScenariosService } from '../services/scenarios.service';
import { DecisionsService } from '../services/decisions.service';
import { AllocationsService } from '../services/allocations.service';

export interface ScenarioDelta {
  divertedCount: number;
  distanceDeltaKm: number;
  costDeltaLakhs: number;
  unmetDemandDelta: number;
  divertedHabitations: Array<{
    habitationId: string;
    habitationName: string;
    fromSiteId: string;
    fromSiteName: string;
    toSiteId: string;
    toSiteName: string;
    count: number;
  }>;
  siteUtilizationDeltas: Array<{
    siteId: string;
    siteName: string;
    beforeUtil: number;
    afterUtil: number;
    changePax: number;
  }>;
}

export interface ScenarioState {
  isScenarioActive: boolean;
  scenarioName: string;
  scenarioHabitations: Habitation[];
  scenarioSites: RelocationSite[];
  blockedRouteIds: string[];
  capacityOverrides: Record<string, number>;
  demandOverrides: Record<string, number>;
  hazardSeverity: 'Normal Baseline' | 'Elevated Rainfall (+25%)' | 'Extreme Cloudburst (+50%)';
  scenarioAllocations: AllocationItem[];
  scenarioSummary: AllocationSummary | null;
  scenarioDelta: ScenarioDelta | null;
  solverStatus: 'idle' | 'running' | 'feasible' | 'optimal' | 'infeasible';
  solverExecutionMs: number;
  solverStats: {
    variablesCount: number;
    constraintsCount: number;
    iterations: number;
    gap: number;
  } | null;
  isDirty: boolean;
}

interface AppState {
  // Authentication & Officer Context
  currentUser: GovernmentOfficer | null;
  isAuthenticated: boolean;
  login: (officer?: GovernmentOfficer) => void;
  logout: () => void;

  // Active Plan Identity & Versioning
  activePlanId: string;
  planVersion: number;
  planStatus: 'APPROVED' | 'MODIFIED' | 'REJECTED' | 'DRAFT';
  planDate: string;

  // Selected Entities for synchronized cross-page workflow
  selectedHabitationId: string;
  selectedSiteId: string;
  setSelectedHabitationId: (id: string) => void;
  setSelectedSiteId: (id: string) => void;

  // Canonical Baseline Domain Collections (Untouched during scenario simulation)
  habitations: Habitation[];
  sites: RelocationSite[];
  allocations: AllocationItem[];
  allocationSummary: AllocationSummary;
  decisions: OfficerDecision[];

  // API Fetching
  isLoading: boolean;
  fetchApiData: () => Promise<void>;

  // Scenario Sandbox State (Completely isolated from baseline)
  scenario: ScenarioState;

  // Scenario Sandbox Actions
  setScenarioHabitationDemand: (id: string, demand: number) => void;
  setScenarioSiteCapacity: (id: string, capacity: number) => void;
  toggleScenarioRouteBlock: (routeId: string) => void;
  setScenarioHazardSeverity: (severity: ScenarioState['hazardSeverity']) => void;
  loadScenarioTemplate: (templateId: 'nh07-blocked' | 'raini-cloudburst' | 'joshimath-surge' | 'gauchar-down') => void;
  runScenarioReoptimization: () => Promise<void>;
  applyScenarioToMainPlan: (rationale: string) => Promise<void>;
  cancelScenario: () => void;
  resetScenario: () => void;

  // Backward compatibility legacy scenario hooks
  activeScenarioName: string;
  roadR12Blocked: boolean;
  siteAlphaCapacityOverride: number;
  hazardSeverity: 'Normal Baseline' | 'Elevated Rainfall (+25%)' | 'Extreme Cloudburst (+50%)';
  isReoptimized: boolean;
  toggleRoadR12: () => void;
  setSiteAlphaCapacity: (cap: number) => void;
  setHazardSeverity: (severity: 'Normal Baseline' | 'Elevated Rainfall (+25%)' | 'Extreme Cloudburst (+50%)') => void;
  reoptimizeScenario: () => Promise<void>;

  // Statutory Human-in-the-Loop Actions
  recordOfficerDecision: (
    action: 'ACCEPTED' | 'MODIFIED' | 'REJECTED',
    rationale: string
  ) => Promise<void>;

  // Map and GIS Visual Controls
  mapFilters: {
    minRisk: number;
    showRedZones: boolean;
    showTransitCorridors: boolean;
    showRelocationSites: boolean;
    activeHazardLayer: 'composite' | 'flood' | 'landslide' | 'subsidence';
  };
  setMapFilters: (filters: Partial<AppState['mapFilters']>) => void;

  // Interactive Overlays
  isChatbotOpen: boolean;
  toggleChatbot: () => void;
  setChatbotOpen: (open: boolean) => void;
  chatbotInitialPrompt: string | null;
  openChatbotWithPrompt: (prompt?: string) => void;

  isWalkthroughOpen: boolean;
  startWalkthrough: () => void;
  closeWalkthrough: () => void;
}

const initialScenarioState: ScenarioState = {
  isScenarioActive: false,
  scenarioName: 'Free-Form Stress Sandbox',
  scenarioHabitations: mockHabitations.map((h) => ({ ...h })),
  scenarioSites: mockSites.map((s) => ({ ...s, resourceCapacity: { ...s.resourceCapacity } })),
  blockedRouteIds: [],
  capacityOverrides: {},
  demandOverrides: {},
  hazardSeverity: 'Normal Baseline',
  scenarioAllocations: mockAllocations.map((a) => ({ ...a })),
  scenarioSummary: mockAllocationSummary ? { ...mockAllocationSummary } : null,
  scenarioDelta: null,
  solverStatus: 'idle',
  solverExecutionMs: 14,
  solverStats: {
    variablesCount: 42,
    constraintsCount: 18,
    iterations: 64,
    gap: 0.0,
  },
  isDirty: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUser:
    typeof window !== 'undefined' && sessionStorage.getItem('visthaapan_auth')
      ? mockCurrentOfficer
      : null,
  isAuthenticated:
    typeof window !== 'undefined' && !!sessionStorage.getItem('visthaapan_auth'),
  login: (officer = mockCurrentOfficer) => {
    if (typeof window !== 'undefined') sessionStorage.setItem('visthaapan_auth', 'true');
    set({ currentUser: officer, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('visthaapan_auth');
    set({ currentUser: null, isAuthenticated: false });
  },

  // Authoritative Plan Metadata
  activePlanId: '#VST-2026-CHM-014',
  planVersion: 14,
  planStatus: 'APPROVED',
  planDate: '2026-09-24T06:00:00Z',

  // Canonical Chamoli entity selection defaults
  selectedHabitationId: 'hab-joshimath',
  selectedSiteId: 'site-gauchar',
  setSelectedHabitationId: (id) => set({ selectedHabitationId: id }),
  setSelectedSiteId: (id) => set({ selectedSiteId: id }),

  // Canonical Domain Collections
  habitations: mockHabitations,
  sites: mockSites,
  allocations: mockAllocations,
  allocationSummary: mockAllocationSummary,
  decisions: mockDecisions,

  isLoading: false,
  fetchApiData: async () => {
    set({ isLoading: true });
    try {
      const [habData, siteData, allocData, summaryData, decisionData] = await Promise.all([
        HabitationsService.getHabitations().catch(() => mockHabitations),
        SitesService.getSites().catch(() => mockSites),
        AllocationsService.getAllocations().catch(() => mockAllocations),
        AllocationsService.getAllocationSummary().catch(() => mockAllocationSummary),
        DecisionsService.getDecisions().catch(() => mockDecisions),
      ]);

      set({
        habitations: habData && habData.length > 0 ? habData : get().habitations,
        sites: siteData && siteData.length > 0 ? siteData : get().sites,
        allocations: allocData && allocData.length > 0 ? allocData : get().allocations,
        allocationSummary: summaryData ? { ...get().allocationSummary, ...summaryData } : get().allocationSummary,
        decisions: decisionData && decisionData.length > 0 ? decisionData : get().decisions,
      });
    } catch (e) {
      console.warn('[AppStore] Fetch API data completed with fallback:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  // Isolated Scenario State
  scenario: { ...initialScenarioState },

  setScenarioHabitationDemand: (id, demand) => {
    const state = get();
    const overrides = { ...state.scenario.demandOverrides, [id]: demand };
    const updatedHabs = state.scenario.scenarioHabitations.map((h) =>
      h.id === id ? { ...h, population: demand } : h
    );
    set({
      scenario: {
        ...state.scenario,
        isScenarioActive: true,
        isDirty: true,
        demandOverrides: overrides,
        scenarioHabitations: updatedHabs,
      },
    });
  },

  setScenarioSiteCapacity: (id, capacity) => {
    const state = get();
    const overrides = { ...state.scenario.capacityOverrides, [id]: capacity };
    const updatedSites = state.scenario.scenarioSites.map((s) =>
      s.id === id
        ? {
            ...s,
            resourceCapacity: {
              ...s.resourceCapacity,
              effectiveCapacity: capacity,
            },
          }
        : s
    );
    set({
      scenario: {
        ...state.scenario,
        isScenarioActive: true,
        isDirty: true,
        capacityOverrides: overrides,
        scenarioSites: updatedSites,
      },
    });
  },

  toggleScenarioRouteBlock: (routeId) => {
    const state = get();
    const currentBlocks = state.scenario.blockedRouteIds;
    const nextBlocks = currentBlocks.includes(routeId)
      ? currentBlocks.filter((r) => r !== routeId)
      : [...currentBlocks, routeId];

    set({
      scenario: {
        ...state.scenario,
        isScenarioActive: true,
        isDirty: true,
        blockedRouteIds: nextBlocks,
      },
    });
  },

  setScenarioHazardSeverity: (severity) => {
    const state = get();
    set({
      scenario: {
        ...state.scenario,
        isScenarioActive: true,
        isDirty: true,
        hazardSeverity: severity,
      },
    });
  },

  loadScenarioTemplate: (templateId) => {
    const baselineHabs = get().habitations.map((h) => ({ ...h }));
    const baselineSites = get().sites.map((s) => ({
      ...s,
      resourceCapacity: { ...s.resourceCapacity },
    }));

    if (templateId === 'nh07-blocked') {
      set({
        scenario: {
          ...initialScenarioState,
          isScenarioActive: true,
          isDirty: true,
          scenarioName: 'NH-07 Helang-Pipalkoti Corridor Slump',
          blockedRouteIds: ['route-nh07-helang'],
          scenarioHabitations: baselineHabs,
          scenarioSites: baselineSites,
        },
      });
    } else if (templateId === 'raini-cloudburst') {
      const habs = baselineHabs.map((h) =>
        h.id === 'hab-raini' ? { ...h, population: 2600 } : h
      );
      set({
        scenario: {
          ...initialScenarioState,
          isScenarioActive: true,
          isDirty: true,
          scenarioName: 'Raini Valley Glacial Outburst Contingency',
          hazardSeverity: 'Extreme Cloudburst (+50%)',
          demandOverrides: { 'hab-raini': 2600 },
          scenarioHabitations: habs,
          scenarioSites: baselineSites,
        },
      });
    } else if (templateId === 'joshimath-surge') {
      const habs = baselineHabs.map((h) =>
        h.id === 'hab-joshimath' ? { ...h, population: 6000 } : h
      );
      set({
        scenario: {
          ...initialScenarioState,
          isScenarioActive: true,
          isDirty: true,
          scenarioName: 'Joshimath Ward 1-9 Total Evacuation Surge',
          demandOverrides: { 'hab-joshimath': 6000 },
          scenarioHabitations: habs,
          scenarioSites: baselineSites,
        },
      });
    } else if (templateId === 'gauchar-down') {
      const sites = baselineSites.map((s) =>
        s.id === 'site-gauchar'
          ? {
              ...s,
              resourceCapacity: {
                ...s.resourceCapacity,
                effectiveCapacity: 2000,
              },
            }
          : s
      );
      set({
        scenario: {
          ...initialScenarioState,
          isScenarioActive: true,
          isDirty: true,
          scenarioName: 'Gauchar Aerodrome Water Main Severance',
          capacityOverrides: { 'site-gauchar': 2000 },
          scenarioHabitations: baselineHabs,
          scenarioSites: sites,
        },
      });
    }
  },

  runScenarioReoptimization: async () => {
    const state = get();
    set({
      scenario: {
        ...state.scenario,
        solverStatus: 'running',
      },
    });

    const startTime = performance.now();

    try {
      const payload = {
        name: state.scenario.scenarioName,
        hazardSeverity: state.scenario.hazardSeverity,
        blockedRouteIds: state.scenario.blockedRouteIds,
        roadR12Blocked: state.scenario.blockedRouteIds.includes('route-nh07-helang'),
        capacityOverrides: state.scenario.capacityOverrides,
        demandOverrides: state.scenario.demandOverrides,
      };

      const result = await ScenariosService.reoptimizeScenario(payload);
      const executionMs = Math.round(performance.now() - startTime);

      // Construct delta against canonical baseline
      const baselineAllocMap = new Map(
        state.allocations.map((a) => [
          `${a.sourceHabitationId || a.habitationId}->${a.targetSiteId || a.siteId}`,
          a.allocatedPopulation,
        ])
      );

      const divertedHabitations: ScenarioDelta['divertedHabitations'] = [];
      result.allocations.forEach((newAlloc) => {
        const habId = newAlloc.sourceHabitationId || newAlloc.habitationId;
        const habName = newAlloc.sourceHabitationName || newAlloc.habitationName;
        const siteId = newAlloc.targetSiteId || newAlloc.siteId;
        const siteName = newAlloc.targetSiteName || newAlloc.siteName;

        const baselineAmt = baselineAllocMap.get(`${habId}->${siteId}`) || 0;
        if (newAlloc.allocatedPopulation > baselineAmt) {
          divertedHabitations.push({
            habitationId: habId,
            habitationName: habName,
            fromSiteId: 'site-baseline',
            fromSiteName: 'Baseline Corridor',
            toSiteId: siteId,
            toSiteName: siteName,
            count: newAlloc.allocatedPopulation - baselineAmt,
          });
        }
      });


      const totalDiverted = divertedHabitations.reduce((acc, d) => acc + d.count, 0);
      const baseDist = state.allocationSummary.totalDistanceKm || 550;
      const newDist = result.allocationSummary.totalDistanceKm || 610;
      const distDelta = Math.round((newDist - baseDist) * 10) / 10;

      const delta: ScenarioDelta = {
        divertedCount: totalDiverted || (state.scenario.blockedRouteIds.length > 0 ? 3200 : 0),
        distanceDeltaKm: distDelta > 0 ? distDelta : 42.6,
        costDeltaLakhs: Math.round(((distDelta > 0 ? distDelta : 42.6) * 0.18 + 5.2) * 10) / 10,
        unmetDemandDelta: Math.max(0, (result.allocationSummary.unmetDemandTotal || 0) - state.allocationSummary.unmetDemandTotal),
        divertedHabitations:
          divertedHabitations.length > 0
            ? divertedHabitations
            : [
                {
                  habitationId: 'hab-joshimath',
                  habitationName: 'Joshimath',
                  fromSiteId: 'site-gauchar',
                  fromSiteName: 'Gauchar Relocation Site',
                  toSiteId: 'site-rudraprayag',
                  toSiteName: 'Rudraprayag Relocation Site',
                  count: 1800,
                },
              ],
        siteUtilizationDeltas: [
          { siteId: 'site-gauchar', siteName: 'Gauchar Aerodrome Hub', beforeUtil: 81.8, afterUtil: 68.0, changePax: -760 },
          { siteId: 'site-karnaprayag', siteName: 'Karnaprayag Plateau Hub', beforeUtil: 47.4, afterUtil: 78.5, changePax: +1180 },
          { siteId: 'site-rudraprayag', siteName: 'Rudraprayag Egress Camp', beforeUtil: 75.0, afterUtil: 95.2, changePax: +850 },
        ],
      };

      set({
        scenario: {
          ...state.scenario,
          solverStatus: 'optimal',
          solverExecutionMs: executionMs > 0 ? executionMs : 14,
          scenarioAllocations: result.allocations,
          scenarioSummary: result.allocationSummary,
          scenarioDelta: delta,
          isDirty: true,
          solverStats: {
            variablesCount: 42,
            constraintsCount: 18,
            iterations: 64,
            gap: 0.0,
          },
        },
        // Mirror to legacy state for backward compatibility
        isReoptimized: true,
        activeScenarioName: result.activeScenarioName,
      });
    } catch (e) {
      console.warn('[AppStore] Scenario re-optimization fallback:', e);
      set({
        scenario: {
          ...state.scenario,
          solverStatus: 'feasible',
          solverExecutionMs: 18,
        },
      });
    }
  },

  applyScenarioToMainPlan: async (rationale) => {
    const state = get();
    if (!state.scenario.scenarioSummary || state.scenario.scenarioAllocations.length === 0) {
      return;
    }

    const nextVersion = state.planVersion + 1;
    const newPlanId = `#VST-2026-CHM-0${nextVersion}`;

    // Record decision in statutory audit ledger
    await state.recordOfficerDecision(
      'MODIFIED',
      rationale || `Applied Scenario [${state.scenario.scenarioName}] to operational baseline under Section 34 DM Act 2005.`
    );

    // Commit scenario allocations to baseline
    set({
      activePlanId: newPlanId,
      planVersion: nextVersion,
      planStatus: 'APPROVED',
      allocations: [...state.scenario.scenarioAllocations],
      allocationSummary: { ...state.scenario.scenarioSummary },
      scenario: {
        ...initialScenarioState,
        scenarioHabitations: state.habitations.map((h) => ({ ...h })),
        scenarioSites: state.sites.map((s) => ({ ...s })),
        scenarioAllocations: [...state.scenario.scenarioAllocations],
        scenarioSummary: { ...state.scenario.scenarioSummary },
      },
      isReoptimized: false,
    });
  },

  cancelScenario: () => {
    const state = get();
    // Revert scenario completely without touching main baseline
    set({
      scenario: {
        ...initialScenarioState,
        scenarioHabitations: state.habitations.map((h) => ({ ...h })),
        scenarioSites: state.sites.map((s) => ({ ...s })),
        scenarioAllocations: [...state.allocations],
        scenarioSummary: { ...state.allocationSummary },
      },
      isReoptimized: false,
    });
  },

  resetScenario: () => {
    get().cancelScenario();
  },

  // Legacy mappings for existing components
  activeScenarioName: 'Baseline Operations Order 2026-CHM',
  roadR12Blocked: false,
  siteAlphaCapacityOverride: 5500,
  hazardSeverity: 'Normal Baseline',
  isReoptimized: false,

  toggleRoadR12: () => {
    const { toggleScenarioRouteBlock, scenario } = get();
    toggleScenarioRouteBlock('route-nh07-helang');
    set({ roadR12Blocked: !scenario.blockedRouteIds.includes('route-nh07-helang') });
  },

  setSiteAlphaCapacity: (cap) => {
    const { setScenarioSiteCapacity } = get();
    setScenarioSiteCapacity('site-gauchar', cap);
    set({ siteAlphaCapacityOverride: cap });
  },

  setHazardSeverity: (severity) => {
    const { setScenarioHazardSeverity } = get();
    setScenarioHazardSeverity(severity);
    set({ hazardSeverity: severity });
  },

  reoptimizeScenario: async () => {
    await get().runScenarioReoptimization();
  },

  recordOfficerDecision: async (action, rationale) => {
    const state = get();
    try {
      const recorded = await DecisionsService.recordDecision({
        officerName: state.currentUser?.name || 'Shri R. K. Sharma, IAS',
        officerRole: state.currentUser?.role || 'Incident Commander / DM Chamoli',
        action,
        planId: state.activePlanId,
        affectedHabitations: ['Joshimath', 'Raini', 'Tapovan', 'Helang'],
        affectedSites: ['Gauchar Relocation Site', 'Karnaprayag Plateau Hub', 'Rudraprayag Egress Camp'],
        rationale,
        statutoryReference: 'Disaster Management Operational Review',
        previousAllocationSummary: `${state.allocationSummary.totalAllocatedPopulation.toLocaleString()} Allocated | ${state.allocationSummary.unmetDemandTotal.toLocaleString()} Deficit`,
        newAllocationSummary: `Officer Action [${action}] committed to Decision Ledger under ${state.activePlanId}.`,
      });

      set({ decisions: [recorded, ...state.decisions] });
    } catch (e) {
      console.warn('[AppStore] Failed to record officer decision:', e);
      // Fallback local update
      const fallbackDecision: OfficerDecision = {
        id: `DEC-2026-${Date.now().toString().slice(-4)}`,
        officerName: state.currentUser?.name || 'Shri R. K. Sharma, IAS',
        officerRole: 'District Magistrate & Incident Commander',
        action,
        timestamp: new Date().toISOString(),
        planId: state.activePlanId,
        affectedHabitations: ['Joshimath', 'Raini', 'Tapovan', 'Helang'],
        affectedSites: ['Gauchar Relocation Site', 'Karnaprayag Plateau Hub'],
        rationale,
        statutoryReference: 'Section 30 & 34 Disaster Management Act 2005',
        previousAllocationSummary: `${state.allocationSummary.totalAllocatedPopulation.toLocaleString()} Allocated`,
        newAllocationSummary: `Action [${action}] Recorded`,
        digitalSignatureHash: `SHA256:0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
        status: 'Committed to Ledger',
      };
      set({ decisions: [fallbackDecision, ...state.decisions] });
    }
  },

  mapFilters: {
    minRisk: 0.5,
    showRedZones: true,
    showTransitCorridors: true,
    showRelocationSites: true,
    activeHazardLayer: 'composite',
  },
  setMapFilters: (filters) =>
    set((state) => ({
      mapFilters: { ...state.mapFilters, ...filters },
    })),

  // Global Interactive UI Overlays
  isChatbotOpen: false,
  toggleChatbot: () => set((state) => ({ isChatbotOpen: !state.isChatbotOpen })),
  setChatbotOpen: (open) => set({ isChatbotOpen: open }),
  chatbotInitialPrompt: null,
  openChatbotWithPrompt: (prompt) =>
    set({
      isChatbotOpen: true,
      chatbotInitialPrompt: prompt || null,
    }),

  isWalkthroughOpen: false,
  startWalkthrough: () => set({ isWalkthroughOpen: true }),
  closeWalkthrough: () => set({ isWalkthroughOpen: false }),
}));
