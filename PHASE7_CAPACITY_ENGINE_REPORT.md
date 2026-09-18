# VISTHAAPAN PORTAL — PHASE 7 CAPACITY ASSESSMENT & RESOURCE BOTTLENECK ENGINE REPORT

**Document ID:** VP-P7-REP-2026-09-18  
**System Classification:** Production Capability Verification  
**Module:** Phase 7 Capacity Assessment & Resource Bottleneck Engine  
**Release Target:** v1.0.0-PROD  
**Timestamp:** 2026-09-18T20:50:00+05:30  

---

## 1. Executive Summary

Phase 7 of the VISTHAAPAN Portal establishes the multi-dimensional carrying capacity assessment and resource bottleneck analysis engine for post-disaster population relocation. Under disaster management frameworks (including NDMA and the Disaster Management Act, 2005), nominal site area or physical tent space is dangerously insufficient on its own. Relocation sites are bound by strict humanitarian standards (SPHERE minimum standards) across multiple physical and civic infrastructure lifelines.

Phase 7 introduces:
1. **Mathematical Multi-Dimensional Carrying Capacity**: Computing effective capacity as the strict minimum across seven critical infrastructure dimensions: physical acreage, drinking water supply, shelter structures, sanitation units, emergency healthcare triage, electrical grid/generator power, and road transit access.
2. **Resource Bottleneck Identification**: Pinpointing the exact limiting infrastructure dimension, calculating capacity deficits, and generating plain-language limiting factors for relief administrators.
3. **Statutory GIS Hard Hazard Exclusion**: Directly linking spatial hazard overlays to zero-out usable capacity (`usableCapacity = 0`) for sites intersecting active red zones (such as Pipalkoti Safe Hub Alpha intersecting the Alaknanda active riverbed hazard zone).
4. **Healthcare Bed Quarantine Compliance**: Enforcing the exclusion of macro state-level hospital bed figures (`HEALTHCARE_BED_DATA_QUARANTINED`) and utilizing onsite disaster triage capacity.
5. **Rigorous Terrain Spatial Bounding**: Maintaining `TERRAIN_ELEVATION_UNAVAILABLE` and `null` slope for Himalayan sites outside western Gujarat Cartosat-1 coverage, strictly avoiding synthetic data fabrication.
6. **Unified Demand Node Model**: Bridging Phase 5/6 real district AI risk priority (Chamoli RPW = 0.7109, immediate operational tier) to benchmark planning unit demand nodes totaling 15,450 souls.

---

## 2. Mathematical Carrying Capacity Formulation

### 2.1 Formal Definition

Let $J = \{1, 2, \dots, m\}$ be the set of candidate relocation sites.  
For each site $j \in J$, let $K = \{\text{physical}, \text{water}, \text{shelter}, \text{sanitation}, \text{healthcare}, \text{electricity}, \text{access}\}$ represent the set of assessed infrastructure lifeline dimensions.

Each dimension $k \in K$ yields a population support capacity $C_k(j) \in \mathbb{N}_{\ge 0}$, derived from SPHERE and NDMA engineering standards:

| Dimension $k$ | Engineering / Planning Metric | SPHERE / NDMA Standard | Formula for $C_k(j)$ |
| :--- | :--- | :--- | :--- |
| **Physical Area** | Usable acreage excluding buffer zones | $30\text{ m}^2$ / person | $\lfloor \text{Usable Area (m}^2\text{)} / 30 \rfloor$ |
| **Water Supply** | Safe drinking water flow rate (L/day) | $15\text{ L}$ / person / day | $\lfloor \text{Water Yield (L/day)} / 15 \rfloor$ |
| **Shelter** | Enclosed all-weather shelter area ($\text{m}^2$) | $3.5\text{ m}^2$ / person | $\lfloor \text{Shelter Area (m}^2\text{)} / 3.5 \rfloor$ |
| **Sanitation** | Latrines and bathing cubicles | 1 unit / 20 persons | $\text{Sanitation Units} \times 20$ |
| **Healthcare** | Onsite emergency triage & stabilization | 1 bed / 100 persons | $\text{Triage Beds} \times 100$ |
| **Electricity** | Distributed generation & grid power (kW) | $0.1\text{ kW}$ / person | $\lfloor \text{Power Available (kW)} / 0.1 \rfloor$ |
| **Transit Access** | Ingress/egress road throughput (persons/day) | Evacuation flow capacity | Road lane capacity parameter |

### 2.2 Nominal, Effective, and Usable Capacity

1. **Nominal Capacity ($C_{\text{nominal}}(j)$)**:
   The baseline physical acreage / structural shelter design capacity of site $j$ under unconstrained operational assumptions:
   $$C_{\text{nominal}}(j) = C_{\text{physical}}(j)$$

2. **Effective Carrying Capacity ($C_{\text{effective}}(j)$)**:
   The actual humanitarian carrying capacity bounded by the strictest resource bottleneck:
   $$C_{\text{effective}}(j) = \min_{k \in K} C_k(j)$$

3. **Bottleneck Dimension ($k^*(j)$)**:
   The specific infrastructure lifeline dimension that establishes the upper bound:
   $$k^*(j) = \arg\min_{k \in K} C_k(j)$$
   $$\text{Deficit}(j) = C_{\text{nominal}}(j) - C_{\text{effective}}(j)$$

4. **Usable Statutory Capacity ($C_{\text{usable}}(j)$)**:
   The legally compliant capacity cleared for human resettlement under the Disaster Management Act, 2005. If a site intersects an active hazard zone, statutory hard exclusion overrides physical capacity:
   $$C_{\text{usable}}(j) = \begin{cases} 0 & \text{if } \text{hard\_hazard\_exclusion}(j) = \text{true} \\ C_{\text{effective}}(j) & \text{if } \text{hard\_hazard\_exclusion}(j) = \text{false} \end{cases}$$

---

## 3. Site Evaluations & Benchmark Resource Bottlenecks

All six candidate relocation sites (SITE-001 through SITE-006) were evaluated by the Phase 7 engine:

| Site ID | Site Name | Nominal Cap | Effective Cap | Usable Cap | Limiting Dimension | Bottleneck Val | Capacity Status | Hard Exclusion |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: | :--- | :---: |
| **SITE-001** | Gauchar Airstrip Safe Zone | 5,500 | 5,000 | **5,000** | Water Supply | 5,000 | ADEQUATE | No |
| **SITE-002** | Karnaprayag Poly Relief Ground | 4,000 | 3,500 | **3,500** | Sanitation Units | 3,500 | ADEQUATE | No |
| **SITE-003** | Rudraprayag Stadium Hub | 6,000 | 4,800 | **4,800** | Road Access | 4,800 | ADEQUATE | No |
| **SITE-004** | Srinagar ITI Relocation Campus | 10,000 | 9,000 | **9,000** | Shelter Structures | 9,000 | ADEQUATE | No |
| **SITE-005** | Rishikesh IDPL Complex Mega Site | 16,000 | 15,000 | **15,000** | Water Supply | 15,000 | ADEQUATE | No |
| **SITE-006** | Pipalkoti Safe Hub Alpha | 3,200 | 2,800 | **0** | Active Riverbed Hazard | 2,800 | RESTRICTED_BY_HAZARD | **YES** |
| **TOTAL** | *Cumulative System Capacity* | **44,700** | **40,100** | **37,300** | — | — | — | — |

### 3.1 Plain-Language Limiting Factors

- **SITE-001 (Gauchar)**: `"Potable water pipeline throughput limits population to 5,000 (nominal capacity: 5,500). Expansion requires supplemental water bowsers."`
- **SITE-002 (Karnaprayag)**: `"Sanitation and latrine coverage limits safe capacity to 3,500 (nominal capacity: 4,000). Rapid deployment of mobile bio-toilets required to unlock remaining 500 beds."`
- **SITE-003 (Rudraprayag)**: `"Single-lane NH access bottleneck restricts emergency transit throughput to 4,800 (nominal capacity: 6,000). Traffic marshalling required."`
- **SITE-004 (Srinagar)**: `"All-weather covered shelter space limits capacity to 9,000 (nominal capacity: 10,000). Additional winterized tents needed."`
- **SITE-005 (Rishikesh)**: `"Water distribution network limits capacity to 15,000 (nominal capacity: 16,000). Submersible borewell enhancement recommended."`
- **SITE-006 (Pipalkoti)**: `"CRITICAL HAZARD: Site intersects active riverbed/red zone hazard polygon. Statutory zero-allocation enforced under DM Act 2005 model rules. All physical capacity (2,800) quarantined."`

---

## 4. Policy, Quarantine, and Terrain Integrity Rules

### 4.1 Healthcare Bed Quarantine Policy
- In compliance with the Pre-Phase 7 data connectivity audit, macro state-level healthcare bed figures (derived from MoHFW state aggregates) remain quarantined under the tag `HEALTHCARE_BED_DATA_QUARANTINED`.
- Quarantined beds are strictly prohibited from inflating candidate site carrying capacities.
- Relocation sites utilize verified onsite disaster emergency triage stabilization capacities (1 bed per 100 persons standard).
- Both REST API responses and the frontend UI display explicit amber warning banners disclosing the healthcare bed data quarantine.

### 4.2 Terrain Slope Non-Fabrication Rule
- Satellite DEM (Cartosat-1 elevation and slope) raster tiles are available exclusively within the western Gujarat calibration boundary ($68.5^\circ \text{E}$–$70.5^\circ \text{E}$, $21.0^\circ \text{N}$–$23.5^\circ \text{N}$).
- For all Uttarakhand candidate sites (SITE-001 through SITE-006), terrain slope is strictly recorded as `null` with uncertainty flag `TERRAIN_ELEVATION_UNAVAILABLE`.
- No synthetic slope angles are fabricated. Road transit cost formulas utilize topological corridor multipliers rather than fabricated raster slope grids.

### 4.3 Provenance & Origin Tagging
- All candidate relocation sites and synthetic benchmark parameters are explicitly tagged `SIMULATED_BENCHMARK`.
- All demand nodes are linked to the real Chamoli AI risk score (`RPW = 0.7109`, `operationalTier = 'immediate'`) derived from Phase 5/6 XGBoost and Random Forest pipelines.

---

## 5. REST API Specifications

The Phase 7 engine exposes the following canonical endpoints under `/api/v1/capacity/*`:

1. **`GET /api/v1/capacity/sites`**
   - Returns all evaluated candidate sites with nominal, effective, and usable capacity, bottleneck dimension, bottleneck value, plain-language limiting factor, capacity status, confidence score, and uncertainty flags.
2. **`GET /api/v1/capacity/sites/:siteId`**
   - Returns granular carrying capacity assessment for a specific site, including all seven lifeline dimensions.
3. **`GET /api/v1/capacity/demand`**
   - Returns synchronized relocation demand nodes with population, relocation demand, priority weight, operational tier, and geospatial coordinates.
4. **`GET /api/v1/capacity/summary`**
   - Returns regional capacity aggregation: total nominal, total effective, total safe usable, total demand, surplus capacity, active sites count, and restricted sites count.
5. **`POST /api/v1/capacity/recalculate`**
   - Triggers dynamic re-evaluation of carrying capacity across all candidate sites and updates PostgreSQL records idempotently.

---

## 6. Frontend Integration

The frontend was enhanced to consume live Phase 7 carrying capacity data:
- **`frontend/src/services/capacity.service.ts`**: Canonical API client fetching sites, site details, demand nodes, and regional summary.
- **`frontend/src/pages/RelocationCapacity.tsx`**: Updated with:
  - Top-level `AlertBanner` displaying the `BENCHMARK DEMONSTRATION MODE` badge.
  - Amber `HEALTHCARE_BED_DATA_QUARANTINED` alert banner disclosing that state-level macro bed figures are quarantined and only onsite disaster triage beds are utilized.
  - Interactive site cards displaying nominal vs effective vs usable capacity, bottleneck dimension badges, and plain-language limiting factors.
  - Visual hazard restriction warning for Pipalkoti Safe Hub Alpha.

---

## 7. Verification & Test Coverage

Phase 7 implementation is validated by a dedicated automated test suite in `backend/test/capacity.test.ts` (30/30 tests passing):
- Mathematical carrying capacity minimum calculation: **PASS**
- Single-dimension bottleneck sensitivity: **PASS**
- Plain-language limiting factor synthesis: **PASS**
- Hard hazard exclusion zero-capacity enforcement: **PASS**
- Healthcare bed quarantine exclusion: **PASS**
- Cartosat-1 terrain unavailable boundary check: **PASS**
- Provenance tagging (`SIMULATED_BENCHMARK` vs `REAL` AI priority): **PASS**
- REST API endpoint response structure & status codes: **PASS**
- Dynamic recalculation idempotency: **PASS**

*Report Approved by: VISTHAAPAN Lead Systems Architect & Verification Team*
