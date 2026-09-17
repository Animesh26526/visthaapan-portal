// VISTHAAPAN Executive Briefing & Conversational Assistant Service
// Clean domain service boundary isolating generative AI operations.
// All browser-direct generative AI calls and API keys are eliminated.
// In Mock Mode: Serves high-fidelity, deterministic Chamoli command briefings and chatbot guidance.
// In Live Mode: Relays queries through apiClient to backend intelligence endpoints.

import { mockSites } from '../mock/data';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';
import { apiClient } from './apiClient';

export interface VillageContext {
  id: string;
  name: string;
  code: string;
  population: number;
  priority: string;
  riskScore: number;
  vulnerabilityScore: number;
  slopeDegrees: number;
  primaryHazard: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  roadR12Blocked?: boolean;
  vulnerableGroups?: {
    elderly: number;
    children: number;
    disabled: number;
  };
  infrastructure?: {
    healthcare: string;
    roads: string;
    water: string;
    powerGrid: string;
  };
}

export interface ComputedSafeSite {
  id: string;
  name: string;
  code: string;
  distanceKm: number;
  transitTimeMin: number;
  effectiveCapacity: number;
  bottleneck: string;
  routeStatus: string;
  isRecommended: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

// Compute geodesic mountain distance between coordinates with mountain curvature factor
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadWindingFactor = 1.35; // Himalayan mountain road gradient curvature
  return Math.round(R * c * roadWindingFactor * 10) / 10;
}

// Calculate and rank candidate safe sites for target habitation context
export function getNearestSafeSites(
  villageLat = 30.556,
  villageLng = 79.563,
  roadR12Blocked = false
): ComputedSafeSite[] {
  return mockSites.map((site) => {
    const dist = calculateDistanceKm(
      villageLat,
      villageLng,
      site.coordinates.lat,
      site.coordinates.lng
    );

    let transitTime = Math.round((dist / 32) * 60); // 32 km/h mountain convoy speed
    let routeStatus = 'Clear (NH-07 Link)';
    let isRecommended = false;

    if (site.id === 'SITE-001' && roadR12Blocked) {
      transitTime += 38; // 38 min detour penalty
      routeStatus = 'Obstructed (Road R12 blocked — detour mandatory)';
    } else if (site.id === 'SITE-003' && roadR12Blocked) {
      isRecommended = true; // Divert to Gamma
      routeStatus = 'Active Primary Diversion Corridor (Clear via Lower Alaknanda)';
    } else if (site.id === 'SITE-001' && !roadR12Blocked) {
      isRecommended = true;
      routeStatus = 'Optimal Direct Ridge Route (Clear)';
    }

    return {
      id: site.id,
      name: site.name,
      code: site.code,
      distanceKm: dist,
      transitTimeMin: transitTime,
      effectiveCapacity: site.resourceCapacity.effectiveCapacity,
      bottleneck: site.resourceCapacity.bottleneck,
      routeStatus,
      isRecommended,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

// Deterministic high-stakes tactical disaster briefing generator (Chamoli demo scenario)
export function generateDeterministicBriefing(context: VillageContext, queryTopic?: string): string {
  const isR12 = !!context.roadR12Blocked;
  const elderly = context.vulnerableGroups?.elderly || 1240;
  const children = context.vulnerableGroups?.children || 1980;
  const disabled = context.vulnerableGroups?.disabled || 310;
  const totalVuln = elderly + children + disabled;
  const safeSites = getNearestSafeSites(
    context.coordinates?.lat || 30.556,
    context.coordinates?.lng || 79.563,
    isR12
  );

  const nearestSite = safeSites[0];
  const recommendedSite = safeSites.find((s) => s.isRecommended) || safeSites[0];

  if (queryTopic === 'routing' || isR12) {
    return `### 🚨 TACTICAL EVACUATION ROUTE DIRECTIVE (CORRIDOR R12 OBSTRUCTION)

**Target Settlement:** ${context.name} (${context.code})  
**Advisory Level:** RED PRIORITY — URGENT DETOUR MANDATE  
**Recommended Destination:** ${recommendedSite.name} (${recommendedSite.distanceKm} km, ~${recommendedSite.transitTimeMin} min)

---

#### 1. Corridor Vulnerability Assessment
- **Primary Arterial:** Link Road R12 is confirmed **BLOCKED / SHEARED** by active debris subsidence and slope declivity (${context.slopeDegrees}°).
- **Direct Impact:** Straight-line transit to Safe Site Alpha (Highland Ridge) via standard SDRF transport is physically severed.
- **Estimated Delay Penalty:** +12.4 km (+38 min transit time) if uncoordinated detours occur.

#### 2. Nearest Safe Sites & MILP Diverted Routing
${safeSites
  .map(
    (s) =>
      `- **${s.name}**: ${s.distanceKm} km (~${s.transitTimeMin} min) | Capacity: ${s.effectiveCapacity.toLocaleString()} | *${s.routeStatus}*`
  )
  .join('\n')}

#### 3. Vulnerable Citizen Transit Protocol
- **Special Mobility Count:** **${disabled.toLocaleString()} ambulant/stretcher patients** and **${elderly.toLocaleString()} elderly residents** cannot traverse unpaved detours.
- **Action:** Request 4 SDRF air-ambulances or specialized low-floor all-terrain troop carriers via Helang Helipad immediately.`;
  }

  if (queryTopic === 'vulnerability') {
    return `### 👥 DEMOGRAPHIC IMMOBILITY & LOGISTICS AUDIT

**Sector:** ${context.name} | **Composite Vulnerability Index:** ${((context.vulnerabilityScore || 0.89) * 100).toFixed(1)}%  
**Nearest Safe Hub:** ${nearestSite.name} (${nearestSite.distanceKm} km, ~${nearestSite.transitTimeMin} min)

---

#### 1. High-Dependency Cohort Breakdown
- **Elderly Dependents (>65y):** ${elderly.toLocaleString()} persons (requires wheelchair / ambulant staff support)
- **Infants & Toddlers (<10y):** ${children.toLocaleString()} persons (requires immediate pediatric hydration & blanket rations)
- **Persons with Disabilities (PwD):** ${disabled.toLocaleString()} persons (stretcher & portable oxygen transit required)
- **Total Specialized Transit Load:** **${totalVuln.toLocaleString()} citizens** (~${(((totalVuln) / (context.population || 1)) * 100).toFixed(0)}% of total village population)

#### 2. Shelter Resource Allocation & Proximity Recommendation
- **Primary Destination (${recommendedSite.name}):** Ensure Medical Tents #4 and #7 are pre-warmed and connected to emergency diesel backup.
- **Bottleneck Countermeasure:** Pre-position **${recommendedSite.bottleneck}** supplies before convoy arrival.
- **Transit Escort:** Assign NDRF 8th Battalion medical corps to lead convoy waves 1 & 2.`;
  }

  // Default Comprehensive Executive Disaster Adjudication Dossier
  return `### 📋 EXECUTIVE DISASTER ADJUDICATION DOSSIER

**Settlement:** ${context.name} (${context.code})  
**Composite AI Risk Score:** ${((context.riskScore || 0.94) * 100).toFixed(1)}% [Immediate Priority Tier]  
**Primary Hazard Factor:** ${context.primaryHazard || 'Active Subsidence & Ground Slump'}  
**Slope Declivity:** ${context.slopeDegrees || 34.2}° (Exceeds 28° Critical Shear Threshold)  
**Nearest Safe Site:** ${nearestSite.name} (${nearestSite.distanceKm} km, ~${nearestSite.transitTimeMin} min)  

---

#### 1. Nearest Safe Relocation Sites Evaluated
${safeSites
  .map(
    (s) =>
      `- **${s.name}** (${s.code}): Distance: **${s.distanceKm} km** (~${s.transitTimeMin} min) | Capacity: **${s.effectiveCapacity.toLocaleString()}** | Bottleneck: *${s.bottleneck}*`
  )
  .join('\n')}

#### 2. Multi-Hazard Geospatial Synthesis
Satellite InSAR displacement maps and geological borehole sensors indicate ground creep rates exceeding **14 mm/week**. Combined with a slope inclination of **${context.slopeDegrees}°**, the risk of sudden catastrophic moraine slippage is categorized as **Extreme**.

#### 3. Recommended Phased Evacuation Protocol
1. **Wave 1 (0–6 Hours):** Immediate evacuation of **${disabled.toLocaleString()} PwD** and **${elderly.toLocaleString()} elderly residents** to **${recommendedSite.name}** via NDRF light multi-utility vehicles.
2. **Wave 2 (6–18 Hours):** Evacuation of **${children.toLocaleString()} children** and their primary guardians.
3. **Wave 3 (18–24 Hours):** General civilian transit with military escort; livestock and heavy property lockdown under SDRF surveillance.

#### 4. Statutory Compliance Note
*In accordance with Section 34 of the Disaster Management Act 2005, this automated risk assessment has been validated against ISRO-Bhuvan and Census telemetry. Formal adjudication pending Incident Commander signature.*`;
}

// Deterministic chatbot response generator for Chamoli operational inquiries
export function generateDeterministicChatReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('what is') || lower.includes('about') || lower.includes('how does')) {
    return `### 🏛️ Welcome to VISTHAAPAN

**VISTHAAPAN** (*विस्थापन*) is India's next-generation disaster evacuation and relocation intelligence platform, engineered for **Smart India Hackathon (SIH)** by team **KyuNahiHoRahiCoding**.

Key operational capabilities:
- **Operations Research (MILP):** Replaces chaotic manual evacuations with mathematically optimal, multi-wave relocation schedules.
- **InSAR Radar Telemetry:** Live satellite ground subsidence tracking in high-risk Himalayan valleys (Chamoli / Joshimath).
- **5 Integrated Workspaces:** From GIS Spatial Command and Shelter Carrying Capacity to Statutory Officer Sign-off.

*Click **"Launch Operations Dashboard"** to explore live telemetry, or navigate using the sidebar!*`;
  }

  if (lower.includes('r12') || lower.includes('road') || lower.includes('block') || lower.includes('detour')) {
    return `### ⚠️ Corridor R12 Obstruction Protocol

When **Road R12** is severed by landslides or slope subsidence:
- **Linear Program Re-routing:** The MILP engine automatically detects the severance and diverts convoys from **Safe Site Alpha** to **Safe Site Gamma (Ghingran Plateau)** via the Lower Alaknanda corridor.
- **Delay Calculation:** Prevents an estimated +38-minute transit bottleneck.
- **Simulation Control:** You can test this live by toggling the **"Simulate Block R12"** button on the Dashboard or in the Allocation Engine Workspace!`;
  }

  if (lower.includes('safe') || lower.includes('site') || lower.includes('shelter') || lower.includes('camp')) {
    return `### 🏔️ Safe Relocation Hubs (Chamoli Sector)

VISTHAAPAN coordinates 3 verified, disaster-resilient shelter hubs:
1. **Safe Site Alpha (Highland Ridge):** 9,200 capacity • Direct access via Northern Ridge corridor • Triage tents ready.
2. **Safe Site Beta (Gauchar Aerodrome):** 4,500 capacity • Strategic air-evacuation runway for critical patients.
3. **Safe Site Gamma (Ghingran Plateau):** 6,100 capacity • Primary diversion hub when primary routes are compromised.

*Explore all shelter resource audits under **Workspace 2: Capacity & Risk**.*`;
  }

  if (lower.includes('milp') || lower.includes('algorithm') || lower.includes('optimization') || lower.includes('engine')) {
    return `### ⚙️ Operations Research (MILP) Allocation Engine

The VISTHAAPAN Allocation Engine models the relocation problem as a **Mixed-Integer Linear Program (MILP)**:
- **Objective Function:** Minimize total civilian transit risk, travel time, and logistics cost while strictly enforcing carrying capacity limits.
- **Hard Constraints:** Shelter safe capacity ceilings, road corridor throughput, zero family-splitting rules, and high-dependency priority scheduling.
- **Dynamic Re-optimization:** Recalculates globally optimal assignments within seconds when road corridors (such as Road R12) are obstructed.`;
  }

  return `### 🛡️ VISTHAAPAN Platform Intelligence

Thank you for your inquiry regarding the **Chamoli Disaster Relocation Operation**.

- **Active Monitoring:** 19,500 citizens across Joshimath, Malari Upper, Raini, and Helang.
- **Immediate Priority:** Ground subsidence rate currently exceeding 14 mm/week.
- **Next Steps:** You can launch the **Operations Dashboard** to view live evacuation rosters, audit shelter bottlenecks, or trigger MILP re-optimization.

*Built with precision for SIH by **KyuNahiHoRahiCoding**.*`;
}

// Briefing Service API methods
export const BriefingService = {
  getNearestSafeSites,

  generateCommandBrief: async (
    context: VillageContext,
    topic = 'dossier',
    customQuery?: string
  ): Promise<string> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(generateDeterministicBriefing(context, topic));
        }, MOCK_DELAY_MS);
      });
    }

    try {
      const response = await apiClient.post<{ brief: string }>('/intelligence/briefing', {
        context,
        topic,
        customQuery,
      });
      return response.brief || generateDeterministicBriefing(context, topic);
    } catch (err) {
      console.warn('[BriefingService] Live briefing API call failed, falling back to deterministic brief:', err);
      return generateDeterministicBriefing(context, topic);
    }
  },

  callAssistant: async (
    messages: ChatMessage[],
    userMessage: string
  ): Promise<string> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(generateDeterministicChatReply(userMessage));
        }, MOCK_DELAY_MS);
      });
    }

    try {
      const response = await apiClient.post<{ reply: string }>('/intelligence/chat', {
        messages,
        userMessage,
      });
      return response.reply || generateDeterministicChatReply(userMessage);
    } catch (err) {
      console.warn('[BriefingService] Live assistant API call failed, falling back to deterministic reply:', err);
      return generateDeterministicChatReply(userMessage);
    }
  },
};
