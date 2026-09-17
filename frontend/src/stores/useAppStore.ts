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

interface AppState {
  // Authentication & Officer Context
  currentUser: GovernmentOfficer | null;
  isAuthenticated: boolean;
  login: (officer?: GovernmentOfficer) => void;
  logout: () => void;

  // Selected Entities for synchronized cross-page workflow
  selectedHabitationId: string;
  selectedSiteId: string;
  setSelectedHabitationId: (id: string) => void;
  setSelectedSiteId: (id: string) => void;

  // Domain Collections
  habitations: Habitation[];
  sites: RelocationSite[];
  allocations: AllocationItem[];
  allocationSummary: AllocationSummary;
  decisions: OfficerDecision[];

  // API Fetching
  isLoading: boolean;
  fetchApiData: () => Promise<void>;

  // Scenario Simulation Parameters
  activeScenarioName: string;
  roadR12Blocked: boolean;
  siteAlphaCapacityOverride: number; // default 9200
  hazardSeverity: 'Normal Baseline' | 'Elevated Rainfall (+25%)' | 'Extreme Cloudburst (+50%)';
  isReoptimized: boolean;

  // Scenario Actions
  toggleRoadR12: () => void;
  setSiteAlphaCapacity: (cap: number) => void;
  setHazardSeverity: (severity: 'Normal Baseline' | 'Elevated Rainfall (+25%)' | 'Extreme Cloudburst (+50%)') => void;
  reoptimizeScenario: () => Promise<void>;
  resetScenario: () => void;

  // Human-in-the-Loop Actions
  recordOfficerDecision: (action: 'ACCEPTED' | 'MODIFIED' | 'REJECTED', rationale: string) => Promise<void>;

  // Map and GIS Visual Controls
  mapFilters: {
    minRisk: number;
    showRedZones: boolean;
    showTransitCorridors: boolean;
    showRelocationSites: boolean;
    activeHazardLayer: 'composite' | 'flood' | 'landslide' | 'subsidence';
  };
  setMapFilters: (filters: Partial<AppState['mapFilters']>) => void;

  // Real-time Map Simulation Actions
  simulationMode: 'none' | 'add-habitation' | 'add-site';
  setSimulationMode: (mode: 'none' | 'add-habitation' | 'add-site') => void;
  addHabitation: (hab: Habitation) => void;
  addSite: (site: RelocationSite) => void;

  // Global Interactive UI Overlays (Floating AI Chatbot & Walkthrough)
  isChatbotOpen: boolean;
  toggleChatbot: () => void;
  setChatbotOpen: (open: boolean) => void;
  chatbotInitialPrompt: string | null;
  openChatbotWithPrompt: (prompt?: string) => void;

  isWalkthroughOpen: boolean;
  startWalkthrough: () => void;
  closeWalkthrough: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: typeof window !== 'undefined' && sessionStorage.getItem('visthaapan_auth') ? mockCurrentOfficer : null,
  isAuthenticated: typeof window !== 'undefined' && !!sessionStorage.getItem('visthaapan_auth'),
  login: (officer = mockCurrentOfficer) => {
    if (typeof window !== 'undefined') sessionStorage.setItem('visthaapan_auth', 'true');
    set({ currentUser: officer, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('visthaapan_auth');
    set({ currentUser: null, isAuthenticated: false });
  },

  selectedHabitationId: 'HAB-001', // Village A (Malari Upper)
  selectedSiteId: 'SITE-001',       // Safe Site Alpha
  setSelectedHabitationId: (id) => set({ selectedHabitationId: id }),
  setSelectedSiteId: (id) => set({ selectedSiteId: id }),

  habitations: mockHabitations,
  sites: mockSites,
  allocations: mockAllocations,
  allocationSummary: mockAllocationSummary,
  decisions: mockDecisions,

  isLoading: false,
  fetchApiData: async () => {
    set({ isLoading: true });
    try {
      const [habData, siteData] = await Promise.all([
        HabitationsService.getHabitations(),
        SitesService.getSites(),
      ]);

      set({
        habitations: habData,
        selectedHabitationId: habData[0]?.id || 'HAB-001',
        sites: siteData,
        selectedSiteId: siteData[0]?.id || 'SITE-001',
      });
    } catch (e) {
      console.warn('[AppStore] Sync failed, maintaining fallback state:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  activeScenarioName: 'Baseline Operations Order 2026-CHM',
  roadR12Blocked: false,
  siteAlphaCapacityOverride: 9200,
  hazardSeverity: 'Normal Baseline',
  isReoptimized: false,

  toggleRoadR12: () => {
    const current = get().roadR12Blocked;
    set({ roadR12Blocked: !current });
  },

  setSiteAlphaCapacity: (cap) => set({ siteAlphaCapacityOverride: cap }),

  setHazardSeverity: (severity) => set({ hazardSeverity: severity }),

  reoptimizeScenario: async () => {
    const { roadR12Blocked, siteAlphaCapacityOverride, hazardSeverity } = get();
    try {
      const result = await ScenariosService.reoptimizeScenario({
        roadR12Blocked,
        siteAlphaCapacityOverride,
        hazardSeverity,
      });

      set({
        isReoptimized: true,
        activeScenarioName: result.activeScenarioName,
        allocations: result.allocations,
        allocationSummary: result.allocationSummary,
      });
    } catch (e) {
      console.warn('[AppStore] Scenario re-optimization failed:', e);
    }
  },

  resetScenario: () => set({
    roadR12Blocked: false,
    siteAlphaCapacityOverride: 9200,
    hazardSeverity: 'Normal Baseline',
    isReoptimized: false,
    activeScenarioName: 'Baseline Operations Order 2026-CHM',
    allocations: mockAllocations,
    allocationSummary: mockAllocationSummary,
  }),

  recordOfficerDecision: async (action, rationale) => {
    const state = get();
    try {
      const recorded = await DecisionsService.recordDecision({
        officerName: state.currentUser?.name || 'Shri R. K. Sharma, IAS',
        officerRole: state.currentUser?.role || 'Incident Commander / DM Chamoli',
        action,
        planId: state.isReoptimized ? 'PLAN-REOPT-2024-CHM' : 'PLAN-BASE-2024-CHM',
        affectedHabitations: ['Village A (Malari Upper)', 'Village B (Helang Valley)'],
        affectedSites: ['Site Alpha (Highland Ridge)', 'Site Beta (Gauchar)', 'Site Gamma (Ghingran)'],
        rationale,
        statutoryReference: 'Section 30(2)(v) Disaster Management Act 2005',
        previousAllocationSummary: `${state.allocationSummary.totalAllocatedPopulation.toLocaleString()} Allocated | ${state.allocationSummary.unmetDemandTotal.toLocaleString()} Deficit`,
        newAllocationSummary: `Officer Action [${action}] Recorded in Statutory Ledger.`,
      });

      set({ decisions: [recorded, ...state.decisions] });
    } catch (e) {
      console.warn('[AppStore] Failed to record officer decision:', e);
    }
  },

  simulationMode: 'none',
  setSimulationMode: (mode) => set({ simulationMode: mode }),
  addHabitation: (hab) => set((state) => ({ habitations: [...state.habitations, hab] })),
  addSite: (site) => set((state) => ({ sites: [...state.sites, site] })),

  mapFilters: {
    minRisk: 0.5,
    showRedZones: true,
    showTransitCorridors: true,
    showRelocationSites: true,
    activeHazardLayer: 'composite',
  },
  setMapFilters: (filters) => set((state) => ({
    mapFilters: { ...state.mapFilters, ...filters },
  })),

  // Global Interactive UI Overlays
  isChatbotOpen: false,
  toggleChatbot: () => set((state) => ({ isChatbotOpen: !state.isChatbotOpen })),
  setChatbotOpen: (open) => set({ isChatbotOpen: open }),
  chatbotInitialPrompt: null,
  openChatbotWithPrompt: (prompt) => set({
    isChatbotOpen: true,
    chatbotInitialPrompt: prompt || null,
  }),

  isWalkthroughOpen: false,
  startWalkthrough: () => set({ isWalkthroughOpen: true }),
  closeWalkthrough: () => set({ isWalkthroughOpen: false }),
}));
