# VISTHAAPAN Phase 5.1: AI Semantics & Interpretation Audit Report

**Audit Identifier**: `VISTHAAPAN-AUDIT-PHASE5.1-SEMANTICS`  
**Effective Date**: 2026-09-18  
**Scope**: Verification of data semantics, target labels, feature definitions, missing-data handling, taxonomy mappings, and governance language.  
**Authoritative Context**: NDEM situation reporting dataset, Census 2011 Primary Census Abstract, National Hospital Directory, Local Government Directory (LGD) canonical district master.

---

## 1. Report Record vs. Real-World Disaster Event

### 1.1 Source Nature of NDEM Data
The Ministry of Home Affairs / National Database for Emergency Management (NDEM) disaster reports dataset (`backend/data/disaster-report (3).csv`) is an administrative situation-monitoring feed populated by District Disaster Management Authorities (DDMAs) and State Disaster Management Authorities (SDMAs).

Key empirical findings from database table `district_disaster_events` (47,621 normalized records):
- **Surveillance Records**: 36,414 records (76.47%) represent routine quiescence filings where `Name of Disaster == 'No Event'`.
- **Active Hazard Records**: 11,207 records (23.53%) represent active situation reports.
- **Multiple Daily Reports**: Single districts frequently submit multiple distinct situation reports on the same calendar day during severe weather events (e.g., Cachar, Assam filed 6 reports on 2026-08-10; Lakhimpur, Assam filed 6 reports on 2026-05-26; Dibrugarh filed 5 reports on 2026-06-29).

### 1.2 Non-Equivalence Principle: Row $\neq$ Physical Disaster
A single meteorological phenomenon (e.g. Brahmaputra river flooding or Southwest monsoon cloudbursts) spans multiple days, affects multiple tehsils/blocks, and generates daily or sub-daily situation updates.

Because the NDEM dataset lacks global physical disaster tracking identifiers (such as GLIDE numbers or unique storm IDs), **individual database rows cannot be uniquely assembled into discrete physical disaster events without introducing ungrounded heuristics**.

### 1.3 Authoritative Semantic Definition
In VISTHAAPAN Phase 5 and Phase 5.1:
> **"Event" or "Active Event" refers strictly to a qualifying NDEM active-event situation report registered for an administrative district, rather than an independently reconstructed physical disaster.**

All count features (`events_last_7d`, `events_last_14d`, `events_last_30d`, `events_last_90d`, `events_last_365d`, `cumulative_active_events_to_date`) and the target variable $Y$ measure **the occurrence and recurrence of qualifying NDEM situation reports**.

---

## 2. Target Window Semantics & Boundary Verification

### 2.1 Formal Target Definition
For an administrative district $i$ at discrete observation timestamp $t$, the binary target $Y_{i, t, H}$ over planning horizon $H = 14$ days is defined as:

$$Y_{i, t, H} = \begin{cases} 1 & \text{if } \exists \, e \in \mathcal{E}_i \text{ such that } \text{event\_date}(e) \in (t, t + 14\text{d}] \text{ and } e \text{ is active} \\ 0 & \text{otherwise} \end{cases}$$

where an active qualifying record requires:
- `is_surveillance_record = false`
- `normalized_hazard_type != 'NO_EVENT'`

### 2.2 Boundary Test Execution
Automated edge-case evaluation (`backend/scripts/audit_phase5_1_deep.py`) confirms exact boundary enforcement:

| Test Case | Event Timestamp Relative to $t$ | Evaluation Rule | Evaluated Target ($y$) | Evaluated Count | Audit Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Edge 1** | Exactly at $t$ ($\Delta = 0$ days) | Excluded (strictly $> t$) | $y = 0$ | $0$ | **PASS** |
| **Edge 2** | One day after $t$ ($t + 1$ day) | Included ($\in (t, t + 14\text{d}]$) | $y = 1$ | $1$ | **PASS** |
| **Edge 3** | Exactly at $t + 14$ days | Included ($\le t + 14\text{d}$) | $y = 1$ | $1$ | **PASS** |
| **Edge 4** | At $t + 15$ days | Excluded ($> t + 14\text{d}$) | $y = 0$ | $0$ | **PASS** |
| **Edge 5** | Only `NO_EVENT` in $(t, t + 14\text{d}]$ | Surveillance excluded | $y = 0$ | $0$ | **PASS** |
| **Edge 6** | Multiple active records in $(t, t + 14\text{d}]$ | Multi-report aggregation | $y = 1$ | $3$ | **PASS** |

### 2.3 Non-Overlapping Consecutive Target Windows
Because observation cadence $\Delta t = 14$ days matches prediction horizon $H = 14$ days:
$$\text{Window}_k = (t_k, t_k + 14\text{d}] = (t_k, t_{k+1}]$$
$$\text{Window}_{k+1} = (t_{k+1}, t_{k+1} + 14\text{d}] = (t_{k+1}, t_{k+2}]$$
Adjacent target windows intersect only at the single boundary point $t_{k+1}$, which is open on the left in $\text{Window}_{k+1}$. There is zero interval overlap, eliminating target autocorrelation contamination across consecutive steps.

---

## 3. Composite Duplicates Audit

### 3.1 Raw Dataset Duplicates Analysis
The raw file contains 47,626 physical lines:
- Line 47,627 is a portal summary footer (`"Total records: 47624..."`) correctly quarantined by the ingestion cleaner.
- Exactly 1 fully duplicate row was detected and excluded during ingestion.
- Exactly 6 rows (3 pairs) share identical composite keys `[State, Date, District Affected, Name of Disaster]`:

| State | Date | District | Disaster Name | Villages Affected | Total Deaths | Interpretation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Assam | 2026-08-27 | Cachar | Flood | 0 | 1 | Morning situation report update |
| Assam | 2026-08-27 | Cachar | Flood | 0 | 1 | Evening situation report confirmation |
| Chhattisgarh | 2026-08-12 | Bijapur | Heavy Rain | 0 | 3 | Preliminary casualty report |
| Chhattisgarh | 2026-08-12 | Bijapur | Heavy Rain | 0 | 0 | Infrastructure damage update |
| Uttarakhand | 2026-08-18 | Chamoli | Landslide | 0 | 3 | Highway blockage report |
| Uttarakhand | 2026-08-18 | Chamoli | Landslide | 0 | 0 | Debris clearance status report |

### 3.2 Audit Decision
These composite pairs represent **legitimate distinct situation updates** filed by emergency authorities throughout the operational day with differing damage/casualty assessments. Retaining them in `district_disaster_events` preserves the authentic administrative record.

Their effect on feature vectors and targets:
- **Target $Y$**: Binary indicator ($y \in \{0, 1\}$) is saturated at 1 whenever at least one active record exists. Duplicate reports on the same day do not inflate $Y$.
- **Recency Features**: Count features increment by the number of filed reports. This appropriately reflects heightened administrative monitoring intensity during active hazard episodes.

---

## 4. Surveillance Reports (`surveillance_reports_last_30d`) Semantics

### 4.1 Implementation Reality
The feature `surveillance_reports_last_30d` counts rows in `district_disaster_events` within $[t - 30\text{d}, t]$ where `is_surveillance_record = true` or `normalized_hazard_type == 'NO_EVENT'`.

In the database, all 36,414 surveillance records have:
- `normalized_hazard_type = 'NO_EVENT'`
- `is_surveillance_record = true`

### 4.2 Semantic Correction: Routine Monitoring vs. Compliance
Previous documentation termed this feature:
> *"DDMA reporting compliance / active monitoring signal"*

This wording overstates what the data proves. The source CSV contains situation logs, not statutory audit tracking of whether a DDMA fulfilled a mandatory filing schedule.

**Corrected Semantics**:
> `surveillance_reports_last_30d` measures the **frequency of routine daily quiescence filings ("No Event" reports) submitted for the district in the preceding 30 days**. It serves as a proxy for recent administrative situation monitoring activity.

### 4.3 Ablation Evidence (Model C)
In diagnostic ablation Model C (`backend/scripts/run_ablations.py`), removing `surveillance_reports_last_30d` produced:
- Held-out test PR-AUC: $0.7549 \to 0.7593$ (+0.0044)
- Held-out test Calibrated Brier: $0.1381 \to 0.1364$ (slight improvement)
- Held-out test ROC-AUC: $0.8545 \to 0.8554$ (+0.0009)

This confirms empirically that routine surveillance volume is a **reporting-intensity proxy**, not an indispensable physical predictor of disaster occurrence.

---

## 5. Hazard Taxonomy Audit

### 5.1 Ingested Taxonomy Distribution
The normalization pipeline maps raw disaster labels into 16 controlled categories:

| Normalized Hazard Type | Record Type | Row Count | % of Active | Notes / Audit Observation |
| :--- | :--- | :--- | :--- | :--- |
| `NO_EVENT` | Surveillance | 36,414 | — | Quiescence daily monitoring filings |
| `Heavy Rain` | Active | 3,232 | 28.84% | Primary monsoon trigger |
| `Unspecified Hazard` | Active | 2,357 | 21.03% | Raw label was generic or unspecified active alert |
| `Transport Accident` | Active | 1,072 | 9.57% | Road/rail vehicle accidents reported via NDEM |
| `Flood` | Active | 1,030 | 9.19% | Inundation / riverine flooding |
| `Lightning` | Active | 913 | 8.15% | Convective thunderstorm strikes |
| `Other Localized Hazard` | Active | 876 | 7.82% | Localized incidents |
| `Hydrological Accident / Drowning` | Active | 466 | 4.16% | Drowning incidents in water bodies |
| `Fire` | Active | 415 | 3.70% | Urban, industrial, and forest fires |
| `Landslide` | Active | 382 | 3.41% | Slope failure, debris flow |
| `Cyclone / Windstorm` | Active | 325 | 2.90% | Cyclonic storms, squalls, gales |
| `Earthquake` | Active | 70 | 0.62% | Seismic tremors |
| `Drought` | Active | 27 | 0.24% | Aridity / moisture deficit alerts |
| `Flash Flood` | Active | 20 | 0.18% | Rapid-onset torrents |
| `Cloudburst` | Active | 15 | 0.13% | Extreme localized precipitation |
| `Avalanche` | Active | 7 | 0.06% | Snowpack failure |

### 5.2 Inclusion of Non-Meteorological Categories in Target $Y$
Because target $Y$ is defined as any record with `is_surveillance_record = false` and `normalized_hazard_type != 'NO_EVENT'`, categories such as `Transport Accident` (1,072 rows), `Hydrological Accident / Drowning` (466 rows), and `Fire` (415 rows) currently count as active incident reports.

**Audit Finding**:
The current model target represents **the occurrence of any qualifying active emergency incident report filed through NDEM**, encompassing both natural hazards and severe civil emergencies reported to disaster authorities. In future iterations (Phase 6+), a narrower target focusing exclusively on meteorological/geophysical hazards (`Flood`, `Flash Flood`, `Heavy Rain`, `Landslide`, `Cloudburst`, `Cyclone`, `Avalanche`) can be evaluated as an alternative target definition.

---

## 6. Census 2011 Baseline Semantics

### 6.1 Reference Year Constraints
All demographic variables (`census_population_total_log`, `census_female_share`, `census_child_share`, `census_sc_share`, `census_st_share`, `census_literacy_rate`, `census_worker_rate`) are derived from the Census of India 2011 Primary Census Abstract (PCA).

- **Data Reference Year**: Strictly `2011`.
- **Post-2011 Districts**: 145 newly created districts (out of 785 canonical units) do not have 2011 Census entries. They are explicitly marked with `census_is_missing = 1`.
- **Prohibition on Unverified Projections**: The system does NOT apply compound annual growth rates (CAGR) or linear extrapolations to project population headcounts to 2026. All figures represent the verified statutory 2011 baseline.

---

## 7. Hospital Directory Semantics & Bed Count Quarantine

### 7.1 Data Corruption Profile
The National Hospital Directory (`backend/data/hospital_directory.csv`, 30,273 facility records) was subjected to deep audit in Phase 4.5:
- **Valid Point Geometries**: 10,843 facilities (35.82%) have verified coordinates within India's terrestrial boundary.
- **Corrupted Bed Counts**: 30,214 records (99.80%) contain zero values (30,209) or telephone-number strings (11). Only 53 facilities contain plausible positive bed counts.

### 7.2 Strict Semantic Boundaries
- Bed counts are **strictly quarantined** and NEVER summed, averaged, or used as hospital capacity, relocation shelter capacity, or bed availability.
- Hospital indicators are strictly interpreted as **registered facility presence indicators** (`hospital_count`, `geocoded_hospital_count`, `emergency_service_hospital_count`, `ambulance_available_hospital_count`).

---

## 8. Missing Data Semantics: UNKNOWN vs. CONFIRMED ZERO

### 8.1 Methodological Vulnerability Fix
Prior to Phase 5.1, `compute_district_vulnerability_index()` assigned a high deficit ($V_{\text{health}} = 0.85$) when `health_record` was missing or empty:

```python
# PREVIOUS CODE:
if health_record and health_record.get("hospital_count", 0) > 0:
    ...
else:
    v_health = 0.85 # Punitive penalty applied to unmapped districts!
```

This conflated two fundamentally different states:
1. **CONFIRMED ZERO**: A surveyed district with verified absence of facilities.
2. **UNKNOWN / UNMAPPED**: A district with no concordance match in the hospital directory (212 districts).

### 8.2 Corrected Neutral Missing-Data Strategy
In Phase 5.1, the calculation was refactored:
- **Observed Facilities**: $V_{\text{health}} = 0.60 \cdot (1 - \text{emergency\_share}) + 0.40 \cdot (1 - \text{ambulance\_share})$, `has_health = True`.
- **Confirmed Zero Facilities**: $V_{\text{health}} = 1.0$, `has_health = True`, `health_status = "CONFIRMED_ZERO"`.
- **Unmapped District (UNKNOWN)**: $V_{\text{health}} = 0.50$ (neutral national median baseline prior, identical to the 0.50 prior used when Census demographics are unmapped), `has_health = False`, `health_status = "UNKNOWN_UNMAPPED"`.

This prevents artificial vulnerability inflation across the 212 unmapped districts while transparently documenting data availability.

---

## 9. TreeSHAP Additivity & Non-Causal Explanation Semantics

### 9.1 Mathematical Additivity in Log-Odds Space
Verification across test predictions confirms exact numerical additivity of TreeSHAP attributions:
$$\text{Margin}(x) = \phi_0 + \sum_{j=1}^{31} \phi_j(x)$$

- **Expected Value (Base Margin $\phi_0$)**: `-1.3194`
- **Max Difference Across Test Observations**: $|\phi_0 + \sum \phi_j - \text{raw\_margin}| < 10^{-6}$ (exact numerical precision).

TreeSHAP values operate strictly in the **raw margin (log-odds) space**, NOT in probability space. A SHAP value of $+0.40$ indicates an addition of $0.40$ to the log-odds of a positive prediction, not a 40 percentage-point increase in probability.

### 9.2 Non-Causal Association Language Replacement
All causal verbs ("increased/decreased forward hazard risk", "causes", "caused by") in `explainability.py` have been replaced with association phrasing:
> **Before**: `"Active hazard incidents in the last 7 days (2) increased forward hazard risk"`  
> **After**: `"Active hazard incidents in the last 7 days (observed: 2.0) was associated with a positive contribution (+0.412 log-odds) to the predicted hazard-report likelihood"`

---

## 10. Governance & Relocation Priority Weight (RPW) Boundaries

1. **RPW is NOT Statutory Relocation Authority**: RPW is an engineered multi-domain decision-support triage weight:
   $$\text{RPW} = 0.50 \cdot \text{Risk} + 0.35 \cdot \text{Vulnerability} + 0.15 \cdot \text{Urgency}$$
2. **RPW is NOT a Probability**: While bounded in $[0.0, 1.0]$, RPW synthesizes empirical hazard risk with structural demographic vulnerability and situational momentum.
3. **No Autonomous Evacuation / Relocation**: The system does not issue binding evacuation orders. Human disaster management officers remain the statutory decision-makers under the Disaster Management Act, 2005.
4. **No Red Zones in Phase 5 / 5.1**: Spatial unsafe zones, red-zone buffers, and relocation site matching are strictly deferred to Phase 6 (GIS) and Phase 8 (OR-Tools).
