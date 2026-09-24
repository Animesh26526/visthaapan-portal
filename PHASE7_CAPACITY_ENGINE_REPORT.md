# VISTHAAPAN PORTAL — PHASE 7 CAPACITY ASSESSMENT & RESOURCE BOTTLENECK ENGINE REPORT

**Document ID:** VP-P7-REP-2026-09-18  
**System Classification:** Decision-Support Capability Verification (SIMULATED_BENCHMARK)  
**Module:** Phase 7 Capacity Assessment & Resource Bottleneck Engine  
**Release Target:** v1.0.0-PROD  
**Timestamp:** 2026-09-18T21:11:00+05:30  

---

## 1. Executive Summary & Governance Scope

Phase 7 of the VISTHAAPAN Portal establishes the multi-dimensional carrying capacity assessment and resource bottleneck analysis engine for post-disaster population relocation. 

> [!IMPORTANT]
> **Decision-Support Classification Notice**: VISTHAAPAN is an analytical decision-support software system. It does NOT possess executive, legal, or gazetted authority, and does NOT generate statutory legal orders, gazetted exclusion zones, or legally binding mandates. All safe capacities, hazard exclusions, and transit routes are model-derived decision-support outputs designed to assist emergency administrators under operational planning frameworks (such as NDMA guidelines and SPHERE standards).

Key Phase 7 Capabilities:
1. **Mathematical Multi-Dimensional Carrying Capacity**: Computes modeled effective carrying capacity as the minimum across seven modeled infrastructure dimensions: physical space, drinking water supply, shelter structures, sanitation units, emergency healthcare triage, electrical power, and road transit access (all configured as `SIMULATED_BENCHMARK` parameters).
2. **Resource Bottleneck Identification**: Pinpoints the limiting infrastructure dimension in the benchmark model, calculates capacity deficits, and generates plain-language limiting factors for relief administrators.
3. **GIS-Derived Hard Hazard Exclusion**: Evaluates spatial hazard polygon overlays (e.g., Alaknanda riverbed/flood hazard zones) to zero out usable capacity (`usableCapacity = 0`) for sites intersecting active hazard zones (such as Pipalkoti Safe Hub Alpha).
4. **Healthcare Bed Quarantine Compliance**: Strictly excludes macro state-level hospital bed figures (`HEALTHCARE_BED_DATA_QUARANTINED`). Candidate sites utilize configured benchmark disaster emergency triage capacities (`SIMULATED_BENCHMARK`), avoiding any unverified facility bed claims.
5. **Rigorous Terrain Spatial Bounding**: Preserves `TERRAIN_ELEVATION_UNAVAILABLE` and `null` slope for Himalayan sites outside western Gujarat Cartosat-1 coverage, strictly avoiding synthetic slope data fabrication.
6. **Unified Demand Node Model**: Connects Phase 5/6 real district AI risk priority (Chamoli RPW = 0.7109, immediate operational tier) to benchmark planning unit demand nodes totaling 15,450 souls. Note: Because all five current Chamoli demand nodes share RPW = 0.7109, this benchmark validates the priority-weighted mathematical formulation, but does not demonstrate differentiation between varying RPW priority levels.

---

## 2. Mathematical Carrying Capacity Formulation

### 2.1 Formal Definition

Let $J = \{1, 2, \dots, m\}$ be the set of candidate relocation sites (`SIMULATED_BENCHMARK`).  
For each site $j \in J$, let $K = \{\text{physical}, \text{water}, \text{shelter}, \text{sanitation}, \text{healthcare}, \text{electricity}, \text{access}\}$ represent the set of assessed infrastructure lifeline dimensions.

Each dimension $k \in K$ yields a population support capacity $C_k(j) \in \mathbb{N}_{\ge 0}$, derived from SPHERE and NDMA planning benchmarks:

| Dimension $k$ | Planning Metric | Modeled Standard | Formula for $C_k(j)$ (Benchmark) | Provenance Status |
| :--- | :--- | :--- | :--- | :--- |
| **Physical Area** | Modeled acreage allocation | $30\text{ m}^2$ / person | $\lfloor \text{Usable Area (m}^2\text{)} / 30 \rfloor$ | `SIMULATED_BENCHMARK` |
| **Water Supply** | Configured water flow benchmark | $15\text{ L}$ / person / day | $\lfloor \text{Water Yield (L/day)} / 15 \rfloor$ | `SIMULATED_BENCHMARK` |
| **Shelter** | Configured shelter capacity | $3.5\text{ m}^2$ / person | $\lfloor \text{Shelter Area (m}^2\text{)} / 3.5 \rfloor$ | `SIMULATED_BENCHMARK` |
| **Sanitation** | Configured latrines / units | 1 unit / 20 persons | $\text{Sanitation Units} \times 20$ | `SIMULATED_BENCHMARK` |
| **Healthcare** | Configured emergency triage beds | 1 bed / 100 persons | $\text{Triage Beds} \times 100$ | `SIMULATED_BENCHMARK` |
| **Electricity** | Configured power capacity | $0.1\text{ kW}$ / person | $\lfloor \text{Power Available (kW)} / 0.1 \rfloor$ | `SIMULATED_BENCHMARK` |
| **Transit Access** | Heuristic road clearance flow | Staging capacity parameter | Configured corridor parameter | `SIMULATED_BENCHMARK` |

### 2.2 Nominal, Effective, and Usable Capacity

1. **Nominal Capacity ($C_{\text{nominal}}(j)$)**:
   The baseline physical acreage or layout capacity configured for site $j$ under unconstrained benchmark assumptions:
   $$C_{\text{nominal}}(j) = C_{\text{physical}}(j)$$

2. **Effective Carrying Capacity ($C_{\text{effective}}(j)$)**:
   The humanitarian carrying capacity bounded by the strictest resource bottleneck:
   $$C_{\text{effective}}(j) = \min_{k \in K} C_k(j)$$

3. **Bottleneck Dimension ($k^*(j)$)**:
   The specific infrastructure lifeline dimension that establishes the upper bound:
   $$k^*(j) = \arg\min_{k \in K} C_k(j)$$
   $$\text{Deficit}(j) = C_{\text{nominal}}(j) - C_{\text{effective}}(j)$$

4. **Usable Capacity After Hazard Exclusion ($C_{\text{usable}}(j)$)**:
   The decision-support capacity cleared for population allocation after applying GIS-derived hard hazard exclusions:
   $$C_{\text{usable}}(j) = \begin{cases} 0 & \text{if } \text{hard\_hazard\_exclusion}(j) = \text{true} \\ C_{\text{effective}}(j) & \text{if } \text{hard\_hazard\_exclusion}(j) = \text{false} \end{cases}$$

---

## 3. Site Evaluations & Benchmark Resource Bottlenecks

All six candidate relocation sites (SITE-001 through SITE-006) represent **synthetic benchmark test fixtures** (`SIMULATED_BENCHMARK`):

| Site ID | Site Name | Nominal Cap | Effective Cap | Usable Cap | Limiting Dimension | Bottleneck Val | Capacity Status | GIS Hazard Exclusion |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: | :--- | :---: |
| **SITE-001** | Gauchar Airstrip Safe Zone | 5,500 | 5,000 | **5,000** | Water Supply | 5,000 | ADEQUATE | No |
| **SITE-002** | Karnaprayag Poly Relief Ground | 4,000 | 3,500 | **3,500** | Sanitation Units | 3,500 | ADEQUATE | No |
| **SITE-003** | Rudraprayag Stadium Hub | 6,000 | 4,800 | **4,800** | Road Access | 4,800 | ADEQUATE | No |
| **SITE-004** | Srinagar ITI Relocation Campus | 10,000 | 9,000 | **9,000** | Shelter Structures | 9,000 | ADEQUATE | No |
| **SITE-005** | Rishikesh IDPL Complex Mega Site | 16,000 | 15,000 | **15,000** | Water Supply | 15,000 | ADEQUATE | No |
| **SITE-006** | Pipalkoti Safe Hub Alpha | 3,200 | 2,800 | **0** | Active Riverbed Hazard | 2,800 | RESTRICTED_BY_HAZARD | **YES** |
| **TOTAL** | *Cumulative Benchmark Capacity* | **44,700** | **40,100** | **37,300** | — | — | — | — |

### 3.1 Plain-Language Limiting Factors (Decision-Support Explanations)

*Note: The following limiting factors describe benchmark parameter constraints; they do not report measured real-world utility surveys:*
- **SITE-001 (Gauchar)**: `"Potable water pipeline throughput limits population to 5,000 (nominal capacity: 5,500) under benchmark parameters. Modeled expansion would require supplemental water bowsers."`
- **SITE-002 (Karnaprayag)**: `"Sanitation and latrine coverage limits safe capacity to 3,500 (nominal capacity: 4,000) under benchmark parameters. Modeled deployment of mobile bio-toilets would be required to unlock remaining 500 beds."`
- **SITE-003 (Rudraprayag)**: `"Corridor access bottleneck restricts benchmark throughput to 4,800 (nominal capacity: 6,000). Modeled staging and traffic management required."`
- **SITE-004 (Srinagar)**: `"Covered shelter space limits benchmark capacity to 9,000 (nominal capacity: 10,000). Additional winterized shelter structures needed."`
- **SITE-005 (Rishikesh)**: `"Water distribution network benchmark limits capacity to 15,000 (nominal capacity: 16,000). Modeled well infrastructure enhancement recommended."`
- **SITE-006 (Pipalkoti)**: `"GIS-DERIVED HARD HAZARD EXCLUSION: Site intersects active riverbed/flood hazard polygon. Decision-support model enforces zero usable capacity after hazard exclusion. All modeled physical capacity (2,800) quarantined."`

---

## 4. Policy, Quarantine, and Terrain Integrity Rules

### 4.1 Healthcare Bed Quarantine Policy
- Macro state-level hospital bed figures (derived from MoHFW state aggregates) remain quarantined under the tag `HEALTHCARE_BED_DATA_QUARANTINED`.
- Quarantined macro beds are strictly prohibited from inflating candidate site carrying capacities.
- Candidate sites utilize configured emergency disaster triage capacities (`SIMULATED_BENCHMARK`) rather than observed facility bed data.
- Both REST API responses and the frontend UI display explicit amber warning banners disclosing the healthcare bed data quarantine and benchmark nature of triage figures.

### 4.2 Terrain Slope Non-Fabrication Rule
- Satellite DEM (Cartosat-1 elevation and slope) raster tiles are available exclusively within the western Gujarat calibration boundary ($68.5^\circ \text{E}$–$70.5^\circ \text{E}$, $21.0^\circ \text{N}$–$23.5^\circ \text{N}$).
- For all Uttarakhand candidate sites (SITE-001 through SITE-006), terrain slope is strictly recorded as `null` with uncertainty flag `TERRAIN_ELEVATION_UNAVAILABLE`.
- No synthetic slope angles or measured terrain profiles are fabricated. Transit difficulty is represented through modeled heuristic road multipliers rather than measured raster slope grids.

### 4.3 Provenance & Origin Tagging
- All candidate relocation sites and synthetic lifeline parameters are explicitly tagged `SIMULATED_BENCHMARK`.
- All demand nodes are linked to the real Chamoli AI risk score (`RPW = 0.7109`, `operationalTier = 'immediate'`) derived from Phase 5/6 XGBoost and Random Forest models.
- **RPW Differentiation Clarification**: In the current benchmark, all five Chamoli demand nodes inherit the same district-level priority ($P = 0.7109$). Consequently, the benchmark successfully validates the priority-weighted penalty formulation, but does not demonstrate differentiation between different priority tiers.

---

## 5. REST API Specifications

Canonical endpoints exposed under `/api/v1/capacity/*`:

1. **`GET /api/v1/capacity/sites`**
   - Returns all evaluated candidate sites with nominal, effective, and usable capacity after hazard exclusion, bottleneck dimension, bottleneck value, plain-language limiting factor, capacity status, confidence score, and uncertainty flags.
2. **`GET /api/v1/capacity/sites/:siteId`**
   - Returns granular 7-dimension carrying capacity assessment for a specific site.
3. **`GET /api/v1/capacity/demand`**
   - Returns synchronized relocation demand nodes with population, relocation demand, priority weight, operational tier, and coordinates.
4. **`GET /api/v1/capacity/summary`**
   - Returns regional capacity aggregation: total nominal, total effective, total safe usable capacity after hazard exclusion, total demand, surplus capacity, active sites count, and restricted sites count.
5. **`POST /api/v1/capacity/recalculate`**
   - Triggers dynamic re-evaluation of carrying capacity across all candidate sites and updates PostgreSQL records idempotently.

---

## 6. Frontend Integration

The frontend consumes live Phase 7 carrying capacity data:
- **`frontend/src/services/capacity.service.ts`**: API client fetching sites, site details, demand nodes, and regional summary.
- **`frontend/src/pages/RelocationCapacity.tsx`**:
  - Displays top-level `DECISION SUPPORT ONLY — SIMULATED BENCHMARK INFRASTRUCTURE` notice.
  - Displays amber `HEALTHCARE_BED_DATA_QUARANTINED` alert banner disclosing that state-level macro bed figures are quarantined and triage capacities reflect simulated benchmark configurations.
  - Renders site cards displaying nominal vs effective vs usable capacity after hazard exclusion, bottleneck dimension badges, and plain-language limiting factors.
  - Visual hazard restriction notice for Pipalkoti Safe Hub Alpha.

---

## 7. Verification & Test Coverage

Phase 7 implementation is validated by an automated test suite in `backend/test/capacity.test.ts` (30/30 tests passing):
- Mathematical carrying capacity minimum calculation: **PASS**
- Single-dimension bottleneck sensitivity: **PASS**
- Plain-language limiting factor synthesis: **PASS**
- Hard hazard exclusion zero usable capacity enforcement: **PASS**
- Healthcare bed quarantine exclusion: **PASS**
- Cartosat-1 terrain unavailable boundary check: **PASS**
- Provenance tagging (`SIMULATED_BENCHMARK` vs `REAL` AI priority): **PASS**
- REST API endpoint response structure & status codes: **PASS**
- Dynamic recalculation idempotency: **PASS**

*Report Maintained by: VISTHAAPAN Verification Team*
