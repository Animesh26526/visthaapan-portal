import { create } from 'zustand';
import type {
  GovernmentOfficer,
  Habitation,
  RelocationSite,
  AllocationItem,
  AllocationSummary,
  OfficerDecision
} from '../types';
import {
  mockCurrentOfficer,
  mockHabitations,
  mockSites,
  mockAllocations,
  mockAllocationSummary,
  mockDecisions
} from '../mock/data';

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
  reoptimizeScenario: () => void;
  resetScenario: () => void;

  // Human-in-the-Loop Actions
  recordOfficerDecision: (action: 'ACCEPTED' | 'MODIFIED' | 'REJECTED', rationale: string) => void;

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const [habRes, siteRes] = await Promise.all([
        fetch('https://visthaapan-api.modikrish007.workers.dev/api/habitations', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        }).catch((err) => {
          console.warn('[API] Habitations fetch failed/timed out, using offline datasets:', err);
          return null;
        }),
        fetch('https://visthaapan-api.modikrish007.workers.dev/api/sites', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        }).catch((err) => {
          console.warn('[API] Sites fetch failed/timed out, using offline datasets:', err);
          return null;
        })
      ]);

      if (habRes && habRes.ok) {
        const habData = await habRes.json().catch(() => null);
        if (Array.isArray(habData) && habData.length > 0) {
          set({ 
            habitations: habData,
            selectedHabitationId: habData[0]?.id || 'HAB-001'
          });
        }
      }

      if (siteRes && siteRes.ok) {
        const siteData = await siteRes.json().catch(() => null);
        if (Array.isArray(siteData) && siteData.length > 0) {
          set({
            sites: siteData,
            selectedSiteId: siteData[0]?.id || 'SITE-001'
          });
        }
      }
    } catch (e) {
      console.warn('API sync fallback to validated offline cache:', e);
    } finally {
      clearTimeout(timeoutId);
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

  reoptimizeScenario: () => {
    const { roadR12Blocked, siteAlphaCapacityOverride } = get();
    
    // Recalculate allocation if Road R12 is blocked or Site Alpha capacity is reduced
    if (roadR12Blocked || siteAlphaCapacityOverride < 9200) {
      const newAllocations: AllocationItem[] = [
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
          assignedAgency: 'SDRF Uttarakhand'
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
          assignedAgency: 'ITBP Force'
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
          assignedAgency: 'District Transport Corp'
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
          assignedAgency: 'NDRF 8th Bn'
        }
      ];

      const totalAllocated = newAllocations.reduce((s, a) => s + a.allocatedPopulation, 0);
      const unmet = Math.max(0, 24590 - totalAllocated);

      set({
        isReoptimized: true,
        activeScenarioName: 'Dynamic Stress Re-Optimization (Road R12 Diverted)',
        allocations: newAllocations,
        allocationSummary: {
          totalTargetPopulation: 24590,
          totalAllocatedPopulation: totalAllocated,
          unmetDemandTotal: unmet,
          totalDistanceKm: 268.4,
          totalEstimatedCostLakhs: 68.5,
          averageCapacityUtilization: 98.2,
          bottleneckCount: 4,
          highPrioritySatisfactionRate: 94.2
        }
      });
    } else {
      set({
        isReoptimized: true,
        allocations: mockAllocations,
        allocationSummary: mockAllocationSummary
      });
    }
  },

  resetScenario: () => set({
    roadR12Blocked: false,
    siteAlphaCapacityOverride: 9200,
    hazardSeverity: 'Normal Baseline',
    isReoptimized: false,
    activeScenarioName: 'Baseline Operations Order 2026-CHM',
    allocations: mockAllocations,
    allocationSummary: mockAllocationSummary
  }),

  recordOfficerDecision: (action, rationale) => {
    const state = get();
    const newDecision: OfficerDecision = {
      id: `DEC-2024-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      date: new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString('en-IN'),
      officerName: state.currentUser?.name || 'Shri R. K. Sharma, IAS',
      officerRole: state.currentUser?.role || 'Incident Commander / DM Chamoli',
      action,
      planId: state.isReoptimized ? 'PLAN-REOPT-2024-CHM' : 'PLAN-BASE-2024-CHM',
      affectedHabitations: ['Village A (Malari Upper)', 'Village B (Helang Valley)'],
      affectedSites: ['Site Alpha (Highland Ridge)', 'Site Beta (Gauchar)', 'Site Gamma (Ghingran)'],
      rationale,
      statutoryReference: 'Section 30(2)(v) Disaster Management Act 2005',
      previousAllocationSummary: `${state.allocationSummary.totalAllocatedPopulation.toLocaleString()} Allocated | ${state.allocationSummary.unmetDemandTotal.toLocaleString()} Deficit`,
      newAllocationSummary: `Officer Action [${action}] Recorded in Statutory Ledger.`
    };

    set({ decisions: [newDecision, ...state.decisions] });
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
    activeHazardLayer: 'composite'
  },
  setMapFilters: (filters) => set((state) => ({
    mapFilters: { ...state.mapFilters, ...filters }
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
