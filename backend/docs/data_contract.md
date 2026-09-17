# VISTHAAPAN Phase 4 Data Contract: Raw to Normalized District Hazard Intelligence

**Authoritative Specification for Phase 5 AI Modeling & Allocation Services**  
**Document Version**: 1.0.0  
**Effective Date**: 2026-09-17  
**Planning Unit Granularity**: `STATE → DISTRICT → HAZARD`  
**Spatial Reference System**: EPSG:4326 (WGS84)

---

## 1. Overview & Architectural Principles

This data contract defines the transformation, null semantics, units, provenance, and validation constraints governing all ingested government disaster situation reports. Phase 5 (AI Vulnerability & Risk Modeling) and subsequent phases must strictly consume features adhering to this contract.

### Core Axioms
1. **District-Level Granularity**: The current prototype operates at the **District level**. Real disaster situation reports aggregate village impacts at the district level. No individual village identities or village-event links are fabricated.
2. **Strict Null vs Zero Distinction**:
   - `NULL` signifies **Unreported / Missing** data.
   - `0` signifies an **Explicitly Confirmed Zero** (e.g. DDMA monitored an incident and verified 0 casualties).
   - Under no circumstances may `NULL` be imputed as `0` during preprocessing without explicit statistical justification in Phase 5.
3. **Target Leakage Prevention**: Post-event outcomes (`deaths_total`, `injured`, `houses_damaged`, `persons_evacuated`, `crop_area_affected`) represent impact consequences, not predictive inputs. They are preserved for historical profiling and ground-truth validation only.
4. **Data Lineage**: Every normalized record links back to `dataset_versions(id)`, which links to `datasets(id)` and `data_sources(id)` with a SHA-256 checksum of the raw source file.

---

## 2. Field-Level Data Contract Table

| Source Field | Normalized Field | DB Column Type | Null Semantics | Unit / Range | Transformation Rule | Quality & Validation Rule |
|---|---|---|---|---|---|---|
| `State` | `state_name` | `VARCHAR(100)` | Non-nullable | Proper Case Text | Stripped whitespace, mapped via `STATE_CANONICAL_MAP` | Must match valid Indian State/UT (36 canonical entities) |
| `Date` | `event_date` | `DATE` | Non-nullable | `YYYY-MM-DD` | Regex parsed and calendar validated | Must satisfy `2000-01-01 <= date <= CURRENT_DATE`. Excludes summary footers. |
| `District Affected` | `district_name` | `VARCHAR(100)` | Non-nullable | Proper Case Text | Whitespace normalized; blank/all mapped to `'Statewide / Unspecified'` | Must not be empty. |
| `Name of Disaster` | `raw_disaster_name` | `VARCHAR(255)` | Non-nullable | Text | Exact string preserved from raw file | Raw audit trail. |
| *(Derived)* | `normalized_hazard_type` | `VARCHAR(100)` | Non-nullable | Controlled Category | Mapped via `normalizeHazardTaxonomy()` | Must belong to `CANONICAL_HAZARDS` (16 categories). |
| *(Derived)* | `normalization_confidence` | `NUMERIC(4,3)` | Non-nullable | `[0.0, 1.0]` | Scored based on specificity of keyword match | `0.95` for explicit hazard keywords, `0.30` for placeholders. |
| *(Derived)* | `is_surveillance_record` | `BOOLEAN` | Non-nullable | Boolean | `true` if `Name of Disaster == 'No Event'` | Filters daily DDMA quiescence reports (76% of raw volume). |
| `No. of Villages Affected` | `villages_affected_count` | `INTEGER` | Nullable | Count (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Preserved strictly as an aggregate count. NO village fabrication. |
| `Population Affected` | `population_affected` | `BIGINT` | Nullable | Headcount (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Must be non-negative. Extreme values (>1M) audited. |
| `No. of Deaths:Male` | `deaths_male` | `INTEGER` | Nullable | Headcount (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Must be non-negative. |
| `No. of Deaths:Female` | `deaths_female` | `INTEGER` | Nullable | Headcount (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Must be non-negative. |
| `No. of Deaths:Total` | `deaths_total` | `INTEGER` | Nullable | Headcount (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Post-event outcome. Must be non-negative. |
| `Injured` | `injured` | `INTEGER` | Nullable | Headcount (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Post-event outcome. Must be non-negative. |
| `Missing` | `missing` | `INTEGER` | Nullable | Headcount (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Post-event outcome. Must be non-negative. |
| `Animal Deaths:Big` | `animal_deaths_big` | `INTEGER` | Nullable | Headcount (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Livestock impact outcome. |
| `Animal Deaths:Small` | `animal_deaths_small` | `INTEGER` | Nullable | Headcount (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Small livestock impact outcome. |
| `Crop Area Affected (Ha):Agri` | `crop_area_agri_ha` | `NUMERIC(12,2)` | Nullable | Hectares (`>= 0.0`) | `parseOptionalFloat()`; blank → `NULL` | Agricultural damage outcome. |
| `Crop Area Affected (Ha):Horti` | `crop_area_horti_ha` | `NUMERIC(12,2)` | Nullable | Hectares (`>= 0.0`) | `parseOptionalFloat()`; blank → `NULL` | Horticultural damage outcome. |
| `House Damaged (Fully):Pakka` | `house_damaged_fully_pakka` | `INTEGER` | Nullable | Unit count (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Severe structural destruction outcome. |
| `House Damaged (Fully):Kacchha`| `house_damaged_fully_kacchha`| `INTEGER` | Nullable | Unit count (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Severe vernacular destruction outcome. |
| `House Damaged (Partially):Pakka` | `house_damaged_partially_pakka` | `INTEGER` | Nullable | Unit count (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Moderate structural damage outcome. |
| `House Damaged (Partially):Kacchha` | `house_damaged_partially_kacchha` | `INTEGER` | Nullable | Unit count (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Moderate vernacular damage outcome. |
| `Persons Evacuated` | `persons_evacuated` | `INTEGER` | Nullable | Headcount (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Operational response outcome. |
| `Relief Camps in Operation` | `relief_camps_in_operation` | `INTEGER` | Nullable | Site count (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Operational response indicator. |
| `People in Relief Camps` | `people_in_relief_camps` | `INTEGER` | Nullable | Headcount (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Operational response capacity demand indicator. |
| `Infrastructure Affected` | `infrastructure_affected_count` | `INTEGER` | Nullable | Asset count (`>= 0`) | `parseOptionalInt()`; blank → `NULL` | Lifeline damage indicator. |

---

## 3. District Hazard Intelligence Profiles (Derived Feature Set)

Stored in table `district_hazard_profiles`. Aggregated strictly at the `(state_name, district_name)` level with fixed observation cutoffs to prevent temporal leakage:

1. **`total_reports_count`**: Total monitoring records received for the district.
2. **`surveillance_reports_count`**: Number of routine quiescence filings (`No Event`).
3. **`active_event_count`**: Number of active disaster impact occurrences.
4. **`hazard_diversity_count`**: Distinct canonical hazard types observed in the district.
5. **`primary_hazard_type`**: Most frequent non-surveillance hazard type.
6. **`events_last_30_days`**: Events within `[observation_date - 30 days, observation_date]`.
7. **`events_last_90_days`**: Events within `[observation_date - 90 days, observation_date]`.
8. **`events_last_365_days`**: Events within `[observation_date - 365 days, observation_date]`.
9. **`historical_event_count`**: Cumulative events older than 365 days.
10. **`hazard_breakdown`**: JSONB dictionary of event counts by hazard type:
   ```json
   {
     "Landslide": 3,
     "Heavy Rain": 1,
     "Lightning": 1,
     "Transport Accident": 30,
     "Hydrological Accident / Drowning": 1
   }
   ```
11. **Cumulative Impact Totals**: `villages_affected_total`, `population_affected_total`, `deaths_total`, `injured_total`, `houses_damaged_total`, `crop_area_affected_ha_total`, `persons_evacuated_total`.

---

## 4. Provenance & Reproducibility Guarantees

Every ingestion pipeline execution records:
- **`data_sources`**: Registered as `NDEM / Ministry of Home Affairs` (`source_type = 'GOVERNMENT_DISASTER_PORTAL'`).
- **`datasets`**: Registered as `Historical Disaster Events & Surveillance Reports`.
- **`dataset_versions`**: Registered with canonical version string `vYYYY.MM.DD-<hash>` and SHA-256 file checksum.
- **`data_processing_runs`**: Tracks start time, completion time, input row count, output count, rejected rows, and error count.
- **`data_qualities`**: Evaluates completeness % (100%), duplicate count, and confidence score (0.96).

---

## 5. Demonstration Benchmark Separation

SIMULATED benchmark records (for Chamoli and safe relocation corridors) are explicitly segregated:
- Table entries include `(SIMULATED)` in their names.
- Provenance `source_type` is strictly marked `'SIMULATED'`.
- Benchmark records reside in `habitations`, `relocation_sites`, `site_capacities`, `candidate_routes`, and `scenarios`.
- Benchmark outputs are inputs for Phase 8 OR-Tools; no hardcoded final optimization results are written to production application logic.
