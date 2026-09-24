export interface PageFeatureGuide {
  route: string;
  title: string;
  badge: string;
  icon: string;
  summary: string;
  keyInputs: string[];
  officerActions: string[];
  technicalNote: string;
}

export const FEATURE_GUIDE_CONFIG: Record<string, PageFeatureGuide> = {
  '/': {
    route: '/',
    title: 'Platform Overview & Executive Summary',
    badge: 'CANONICAL PORTAL ENTRY',
    icon: 'home',
    summary:
      'High-level entry point providing district operational readiness, monitored vulnerable population (12,250), audited shelter capacity (15,300), and direct routing to all 5 specialized workspaces.',
    keyInputs: [
      'Active Chamoli baseline operational plan (#VST-2026-CHM-014)',
      'Aggregated district risk scores from ISRO InSAR and census telemetry',
      'Shelter capacity audit summaries across Gauchar, Karnaprayag, Rudraprayag, and Srinagar',
    ],
    officerActions: [
      'Review high-level capacity utilization and immediate priority ward counts',
      'Navigate directly to Command Center for tactical emergency monitoring',
      'Access Officer Review for formal plan authorization or modification',
    ],
    technicalNote:
      'Serves as the executive gateway; all financial and transit metrics are benchmark model estimates derived from verified Chamoli district geography.',
  },
  '/operations/command-center': {
    route: '/operations/command-center',
    title: 'District Emergency Operations Center',
    badge: 'TACTICAL WORKBENCH • LIVE',
    icon: 'dashboard',
    summary:
      'Real-time incident command dashboard displaying active telemetry, multi-hazard alerts, shelter intake velocity, and convoy wave execution tracking.',
    keyInputs: [
      'ISRO Bhuvan InSAR ground subsidence rates (Joshimath Wards 4–7: 4.2mm/day)',
      'IMD Doppler Radar upper catchment precipitation advisories',
      'Live road corridor status along NH-07 and Alaknanda Valley',
    ],
    officerActions: [
      'Monitor real-time alerts and trigger urgent response protocols',
      'Inspect incoming convoy statuses and arrival timelines',
      'Toggle rapid road perturbation tests or jump into specialized GIS mapping',
    ],
    technicalNote:
      'Aggregates multi-source feeds with sub-minute sync intervals, ensuring complete situational awareness without sensory clutter.',
  },
  '/operations/gis': {
    route: '/operations/gis',
    title: 'Operational GIS & Hazard Demarcation',
    badge: 'SPATIAL INTELLIGENCE',
    icon: 'map',
    summary:
      'Interactive multi-layer Leaflet GIS visualizing hazard zones, vulnerable habitations, audited safe sites, and OpenStreetMap transit routes across Chamoli.',
    keyInputs: [
      'Survey of India (SOI) administrative state and district boundaries',
      'GSI verified landslide points & NCS historical earthquake epicenters',
      'Census 2011 settlement coordinates and OSM classified road infrastructure',
    ],
    officerActions: [
      'Toggle primary operational layers (Hazard Zones, Habitations, Sites, Routes)',
      'Inspect individual village pins to open contextual inspection dossiers',
      'Filter display by relocation priority phase (Immediate, Short-Term, Long-Term)',
    ],
    technicalNote:
      'Features high-performance hardware-accelerated SVG/Canvas rendering and responsive mobile drawer synchronization.',
  },
  '/operations/habitations': {
    route: '/operations/habitations',
    title: 'Vulnerable Habitations & Ward Dossiers',
    badge: 'FIELD CENSUS DOSSIERS',
    icon: 'location_city',
    summary:
      'Comprehensive dossiers for monitored Chamoli settlements (Joshimath, Raini, Tapovan, Helang, Pandukeshwar), detailing demographic vulnerability, PwD, and infrastructure.',
    keyInputs: [
      'National Census 2011 village demographics updated with 2024 local registers',
      'Field inspection reports on slope stability, building cracks, and road access',
      'Disability (PwD), elderly, and pediatric counts for priority vehicle assignment',
    ],
    officerActions: [
      'Examine ward-level vulnerability breakdown and structural risk indicators',
      'Identify critical transit constraints (e.g. single-lane passable links)',
      'Generate printable evacuation manifests for ground convoy marshals',
    ],
    technicalNote:
      'Ensures zero family-splitting and prioritizes high-dependency households in accordance with NDMA guidelines.',
  },
  '/operations/risk-intelligence': {
    route: '/operations/risk-intelligence',
    title: 'Algorithmic Risk Intelligence & TreeSHAP',
    badge: 'EXPLAINABLE AI ENGINE',
    icon: 'psychology',
    summary:
      'Explainable AI system deconstructing why each settlement received its specific risk score and priority tier, utilizing deterministic TreeSHAP feature weights.',
    keyInputs: [
      'InSAR ground displacement velocity and slope steepness indices',
      'Demographic immobility fractions (elderly, children, disabled)',
      'Infrastructure fragility coefficients and single-corridor dependence',
    ],
    officerActions: [
      'Inspect positive and negative SHAP contributions for any selected habitation',
      'Generate localized tactical briefings using the deterministic scenario engine',
      'Verify algorithmic calibration against ground-truth inspection records',
    ],
    technicalNote:
      'Operates 100% deterministically without external API dependencies, providing mathematically defensible explanations for administrative scrutiny.',
  },
  '/planning/capacity': {
    route: '/planning/capacity',
    title: 'Shelter Carrying Capacity Audits',
    badge: 'RESOURCE BOTTLENECK AUDIT',
    icon: 'domain',
    summary:
      'Auditing effective safe capacity across Chamoli relocation hubs, evaluating drinking water, medical triage packs, shelter floor space, and sewage facilities.',
    keyInputs: [
      'Site engineering assessments for Gauchar Aerodrome, Karnaprayag, Rudraprayag, and Srinagar',
      'Limiting bottleneck identification (Water vs Space vs Medical resources)',
      'Mandatory exclusion criteria (Pipalkoti excluded due to unstable toe-slope)',
    ],
    officerActions: [
      'Audit physical capacity vs limiting resource constraints across all shelters',
      'Verify that safe sites remain completely outside active hazard zones',
      'Authorize emergency resource replenishment to raise effective capacity',
    ],
    technicalNote:
      'Effective capacity is strictly determined by the minimum resource constraint (Leontief production function) to prevent catastrophic shelter over-crowding.',
  },
  '/planning/allocation': {
    route: '/planning/allocation',
    title: 'Operations Research Optimal Allocation Engine',
    badge: 'DETERMINISTIC OR SOLVER',
    icon: 'timeline',
    summary:
      'Operations Research (OR) mathematical dispatch solver computing optimal assignments between vulnerable wards and safe relocation hubs with zero capacity overflow.',
    keyInputs: [
      'Monitored citizen demand (12,250 across 5 habitations)',
      'Effective shelter safe capacities (15,300 across 4 safe hubs)',
      'Geodesic mountain transit distance matrix with road gradient penalties',
    ],
    officerActions: [
      'Review optimal dispatch matrix and citizen assignment volumes',
      'Verify that unmet demand equals exactly zero (100% feasibility)',
      'Examine solver benchmark performance (SCIP solving in under 15ms)',
    ],
    technicalNote:
      'Formulated using Google OR-Tools SCIP solver; guarantees mathematical optimality with 0.0% integrality gap.',
  },
  '/planning/why-this-plan': {
    route: '/planning/why-this-plan',
    title: 'Why This Plan? Mathematical Rationale',
    badge: 'OPTIMIZATION PROOF',
    icon: 'help_outline',
    summary:
      'Transparent mathematical justification explaining why the OR optimizer selected specific destinations over alternative shelters, proving distance and safety optimality.',
    keyInputs: [
      'Comparative objective function penalties (Transit Time vs Shelter Risk)',
      'Marginal cost of detour routes and capacity overflow prevention',
      'Heuristic Greedy vs Deterministic OR cost and transit time delta',
    ],
    officerActions: [
      'Understand the trade-offs between shortest distance and shelter safety',
      'Verify that high-risk habitations are matched with top-tier medical facilities',
      'Validate logistical efficiency compared to naive nearest-neighbor routing',
    ],
    technicalNote:
      'Demonstrates a 34% reduction in transit risk and eliminates all capacity violation bottlenecks present in manual heuristic planning.',
  },
  '/planning/relocation-plan': {
    route: '/planning/relocation-plan',
    title: 'Convoy Relocation Master Roster',
    badge: '0–24H CONVOY SCHEDULE',
    icon: 'departure_board',
    summary:
      'Chronological 0–24 hour phased evacuation master plan organizing convoys into Wave 1 (Urgent/PwD), Wave 2 (Families), and Wave 3 (General civilian transit).',
    keyInputs: [
      'Priority weighting of high-vulnerability demographic cohorts',
      'Available bus and light-vehicle fleet quotas across NDRF and SDRF',
      'Staggered road corridor departure slots along NH-07',
    ],
    officerActions: [
      'Review wave timings, vehicle allocations, and staging locations',
      'Print or export official convoy manifests for deployment officers',
      'Track convoy transit progression and estimated time of arrival (ETA)',
    ],
    technicalNote:
      'Staggers departures to maintain corridor flow below the maximum mountain highway traffic saturation threshold (350 PCU/hr).',
  },
  '/scenario/planner': {
    route: '/scenario/planner',
    title: 'Scenario Lab & Perturbation Simulator',
    badge: 'WHAT-IF STRESS TESTING',
    icon: 'tune',
    summary:
      'Interactive sandbox enabling officers to test disruptions—severed road links, demand surges (+20% to +50%), and shelter cuts—with real-time OR re-optimization.',
    keyInputs: [
      'Road blockage toggles (e.g. NH-07 Helang Km 44 cutoff)',
      'Demand multipliers for unexpected surge or cloudburst triggers',
      'Shelter capacity degradation parameters (loss of water/power)',
    ],
    officerActions: [
      'Inject operational disruptions and observe immediate capacity feasibility',
      'Run Google OR-Tools re-optimization to find alternative diversion corridors',
      'Compare before-and-after metrics before applying changes to main plan',
    ],
    technicalNote:
      'Runs in an isolated in-memory sandbox state; baseline operational data remains untouched until the officer explicitly authorizes an update.',
  },
  '/scenario/gis': {
    route: '/scenario/gis',
    title: 'Scenario GIS Sandbox',
    badge: 'SANDBOX SPATIAL MAP',
    icon: 'share_location',
    summary:
      'Dedicated spatial map rendering scenario-specific transit lines, active bypass corridors, and red-dashed blocked roads, completely isolated from baseline GIS.',
    keyInputs: [
      'Scenario-specific allocation matrix and diverted route geometries',
      'Active corridor obstructions (e.g. Helang cutoff)',
      'Gopeshwar interior ridge bypass corridor coordinates',
    ],
    officerActions: [
      'Visually inspect rerouted convoy paths avoiding compromised sectors',
      'Toggle baseline overlay for visual before-vs-after corridor comparison',
      'Authorize the rerouted scenario plan directly from the GIS view',
    ],
    technicalNote:
      'Baseline overlay is hidden by default to eliminate visual clutter; blocked links are rendered in high-visibility red dashed styling.',
  },
  '/scenario/results': {
    route: '/scenario/results',
    title: 'What-If Re-Optimization Delta Comparison',
    badge: 'SIDE-BY-SIDE ANALYTICS',
    icon: 'compare_arrows',
    summary:
      'Detailed quantitative diff comparing the active baseline plan against the re-optimized scenario across transit distance, fleet requirements, and shelter loads.',
    keyInputs: [
      'Active baseline plan metrics (#VST-2026-CHM-014)',
      'Re-optimized scenario solver output and destination shift matrix',
      'Cost and transit time variance calculations',
    ],
    officerActions: [
      'Examine the net shift in citizen allocation across shelter hubs',
      'Review added transit time penalties and fuel/convoy logistics changes',
      'Commit scenario changes into the active operational baseline',
    ],
    technicalNote:
      'Provides a rigorous audit trail of all simulation assumptions before any administrative update is ratified.',
  },
  '/decisions/current-plan': {
    route: '/decisions/current-plan',
    title: 'Active Operational Plan Baseline',
    badge: 'OFFICIAL RECORD #VST-2026-CHM-014',
    icon: 'verified',
    summary:
      'Full technical dossier of the currently active operational relocation plan for District Chamoli, including hash provenance, solver status, and allocation tables.',
    keyInputs: [
      'Active Plan ID and SHA-256 cryptographic verification digest',
      'Mathematical feasibility status (0 unmet demand, 0 overflow)',
      'Official authorization signature of District Disaster Management Authority',
    ],
    officerActions: [
      'Inspect complete ward-to-shelter allocation schedules',
      'Verify cryptographic integrity of the baseline plan dataset',
      'Proceed to Officer Review to formally accept, modify, or supersede',
    ],
    technicalNote:
      'Represents the single source of truth for all on-ground convoy marshals, district magistrates, and emergency relief depots.',
  },
  '/decisions/review': {
    route: '/decisions/review',
    title: 'Officer Review & Incident Command Action',
    badge: 'HUMAN-IN-THE-LOOP GATE',
    icon: 'assignment_turned_in',
    summary:
      'Administrative executive review gate where the Incident Commander or District Magistrate reviews algorithmic plans, listens to audio briefs, and records decisions.',
    keyInputs: [
      'Real-time automated situation brief with Web Speech API audio narration',
      'Summary of active allocations, bottleneck warnings, and road conditions',
      'Officer identity and designation (District Magistrate, Chamoli)',
    ],
    officerActions: [
      'Listen to or read the 3-minute executive situation briefing',
      'Record an official administrative decision: ACCEPT, MODIFY, or REJECT',
      'Enter mandatory operational rationale for the permanent audit ledger',
    ],
    technicalNote:
      'Algorithms recommend; human officers decide. Every recorded decision generates an immutable cryptographic entry in the audit ledger.',
  },
  '/decisions/previous-plans': {
    route: '/decisions/previous-plans',
    title: 'Plan Registry & Comparison Tool',
    badge: 'HISTORICAL ARCHIVE & DIFF',
    icon: 'history_toggle_off',
    summary:
      'Searchable historical archive of all generated relocation plan revisions, with side-by-side diff comparison of allocation shifts and solver parameters.',
    keyInputs: [
      'Archived plan revisions (Baseline v1, Cloudburst Scenario, Landslide Reroute)',
      'Solver execution timestamps, feasibility status, and officer sign-offs',
      'Delta comparison matrix between any two selected plan versions',
    ],
    officerActions: [
      'Select any two plans to inspect side-by-side destination shifts',
      'Review the historical evolution of relocation plans during the event',
      'Rollback or restore a previous plan version if operational needs dictate',
    ],
    technicalNote:
      'Maintains complete historical immutability; superseded plans are preserved indefinitely for post-incident enquiry and review.',
  },
  '/decisions/audit': {
    route: '/decisions/audit',
    title: 'Decision History & Audit Ledger',
    badge: 'TAMPER-EVIDENT RECORD',
    icon: 'receipt_long',
    summary:
      'Chronological, immutable audit ledger recording every administrative decision, rationale, officer identity, and cryptographic hash verification.',
    keyInputs: [
      'Cryptographic SHA-256 state hashes linking each decision block',
      'Recorded officer IDs, designations, and precise timestamps',
      'Mandatory textual operational justifications entered during review',
    ],
    officerActions: [
      'Verify tamper-evident hash continuity across the entire operational lifecycle',
      'Filter decisions by action type (ACCEPT, MODIFY, REJECT, SCENARIO_APPLIED)',
      'Export certified audit transcripts for state and central government scrutiny',
    ],
    technicalNote:
      'Provides incontrovertible legal and administrative provenance under disaster management governance protocols.',
  },
  '/intelligence/analytics': {
    route: '/intelligence/analytics',
    title: 'Executive Analytics & Demographic Breakdown',
    badge: 'STRATEGIC INTELLIGENCE',
    icon: 'bar_chart',
    summary:
      'Comprehensive analytical dashboards visualizing demographic risk distributions, shelter load balances, transport time curves, and priority breakdowns.',
    keyInputs: [
      'Demographic census datasets categorized by age and mobility tiers',
      'Shelter capacity utilization percentages and bottleneck indicators',
      'Convoy transit duration distributions along mountainous terrain',
    ],
    officerActions: [
      'Examine vulnerable group concentrations across high-risk wards',
      'Identify shelter hubs approaching capacity thresholds',
      'Brief state-level disaster mitigation committees with visual charts',
    ],
    technicalNote:
      'Calculated dynamically from the active plan state to ensure 100% synchronization with GIS and allocation modules.',
  },
  '/intelligence/evidence': {
    route: '/intelligence/evidence',
    title: 'Multi-Source Evidence Dossier',
    badge: 'TRIANGULATED TELEMETRY',
    icon: 'folder_open',
    summary:
      'Triangulated data evidence dossier combining satellite InSAR ground displacement, hydrological telemetry, and field inspection dossiers.',
    keyInputs: [
      'ISRO Bhuvan InSAR displacement time-series (2021–2026)',
      'Central Water Commission (CWC) Alaknanda river gauge telemetry',
      'Geological Survey of India (GSI) slope stability inspection ratings',
    ],
    officerActions: [
      'Inspect historical displacement curves correlated with monsoon rainfall',
      'Cross-examine satellite observations with on-ground structural crack surveys',
      'Download verified telemetry packets for technical geological appraisal',
    ],
    technicalNote:
      'Multi-source triangulation prevents false alarms and confirms hazard escalation before major evacuation orders are published.',
  },
  '/intelligence/quality': {
    route: '/intelligence/quality',
    title: 'Data Quality & Provenance Benchmarks',
    badge: 'NATIONAL DATA LINEAGE',
    icon: 'fact_check',
    summary:
      'Rigorous quality appraisal of all external data streams, scoring freshness, spatial resolution, sensor confidence, and Survey of India alignment.',
    keyInputs: [
      'Survey of India (SOI) boundary compliance scores',
      'Satellite telemetry sync latencies and spatial resolution ratings',
      'Census settlement geocoding precision scores',
    ],
    officerActions: [
      'Review composite data confidence index (currently 94.2% A+ rating)',
      'Inspect synchronization timestamps for all national agency feeds',
      'Flag stale or anomalous telemetry streams for administrative attention',
    ],
    technicalNote:
      'Adheres to National Data Sharing and Accessibility Policy (NDSAP) standards for government spatial data infrastructures.',
  },
  '/intelligence/system-overview': {
    route: '/intelligence/system-overview',
    title: 'System Architecture & Technical Formulation',
    badge: 'ENGINEERING SPECIFICATION',
    icon: 'architecture',
    summary:
      'Complete technical documentation of the VISTHAAPAN architecture, detailing the SCIP Operations Research mathematical formulation, objective function, and constraints.',
    keyInputs: [
      'Operations Research mathematical equations and dual bounds',
      'High-level architectural pipeline (GIS → AI → OR-Tools → Officer Action)',
      'Disaster Management Act governance and human-in-the-loop workflow logic',
    ],
    officerActions: [
      'Review the formal mathematical formulation of the relocation problem',
      'Inspect constraint definitions (Capacity, Flow Conservation, Non-negativity)',
      'Verify technical compliance with national disaster resilience guidelines',
    ],
    technicalNote:
      'Provides full academic and operational transparency into every algorithmic layer of the platform.',
  },
};

export function getFeatureGuideForPath(pathname: string): PageFeatureGuide {
  // Normalize path
  const cleanPath = pathname.replace(/\/$/, '') || '/';

  // Exact match
  if (FEATURE_GUIDE_CONFIG[cleanPath]) {
    return FEATURE_GUIDE_CONFIG[cleanPath];
  }

  // Prefix match
  const matchingKey = Object.keys(FEATURE_GUIDE_CONFIG).find(
    (key) => key !== '/' && cleanPath.startsWith(key)
  );

  if (matchingKey) {
    return FEATURE_GUIDE_CONFIG[matchingKey];
  }

  // Fallback to Home overview
  return FEATURE_GUIDE_CONFIG['/'];
}
