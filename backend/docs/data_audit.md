# Authoritative Phase 4 Data Audit: Government Disaster Reporting Datasets

**Project**: VISTHAAPAN (Vulnerability Intelligence and Spatial Transit for Hazard Affected Population Allocation Network)
**Audit Timestamp**: 2026-09-17
**Authoritative Standard**: Grounded in official NDEM/DM-reporting format

---

## 1. Dataset Profile & Physical Metrics

- **Filename**: `backend/data/disaster-report (3).csv`
- **File Size**: 4,121,518 bytes (~3.93 MB)
- **Encoding**: UTF-8 with Byte Order Mark (`utf-8-sig` / `﻿` prefix detected)
- **Total Physical Rows**: 47,626
- **Blank Trailing Rows**: 1 (e.g. line 47626: `, , , ...`)
- **Portal Summary Footer Rows**: 1 (line 47627: `,🔴 TOTAL UNTIL 2026-09-17,...`)
- **Clean Incident / Surveillance Rows**: 47,624
- **Exact Duplicate Rows**: 1
- **Composite Key `(State, Date, District, Disaster)` Duplicates**: 3
- **Temporal Observation Range**: `2024-04-01` to `2026-09-17` (899 calendar days / ~2.5 years)
- **Geographic Coverage**: 36 States/UTs, 613 Districts, 637 State-District pairs

## 2. Core Architectural Questions Answered

### 2.1 Granularity: Event-Level vs District-Level vs Village-Level
- **Primary Geographic Planning Granularity**: The dataset operates strictly at the **DISTRICT level** (`State` + `District Affected`).
- **Village Representation**: The dataset provides **ONLY aggregate counts** (`No. of Villages Affected`), with a national aggregate of 36,099 cumulative village impact reports. **NO village names or individual village geometries exist.**
- **Habitation Architecture Integrity**: In accordance with the Phase 4 charter, **NO village names or village-disaster relationships are fabricated**. The `villages_affected_count` integer is preserved as an aggregate exposure metric, leaving the Phase 3 `habitations` schema ready for future localized feeds.

### 2.2 Coordinates & GIS Features
- **Spatial Coordinates in CSV**: The raw CSV contains **NO latitude/longitude or polygon columns**.
- **PostGIS Integration Strategy**: Physical locations are tied to the canonical `regions` table via PostGIS boundaries or district centroids in `EPSG:4326` (WGS84).

### 2.3 Surveillance Rows ('No Event') vs Active Disaster Events
- **'No Event' Surveillance Rows**: **36,183 (75.98%)**. These represent routine daily quiescence filings submitted by District Disaster Management Authorities (DDMAs) confirming no major event occurred.
- **Active Impact Records**: **11,441 (24.02%)** reporting tangible casualties, damages, or evacuations.

### 2.4 Null vs Zero Semantics
- **Numeric Representation**: In this raw report, DDMAs submit numeric zeroes (`0`, `0.00`) when reporting no casualties/damages for a monitored incident. However, when fields are omitted entirely or blank, they represent **UNREPORTED / MISSING** data, NOT confirmed zero.
- **Null Handling Rule**: The pipeline explicitly distinguishes `NULL` (missing/unreported) from `0` (explicitly measured zero). Deaths, rainfall, and damage fields must not have `NULL` converted to `0`.

### 2.5 Post-Event Outcome Leakage Prevention
- **Impact Variables**: Fields such as `No. of Deaths:Total`, `Injured`, `Missing`, `House Damaged (Fully/Partially)`, `Persons Evacuated`, and `Crop Area Affected` are **POST-EVENT IMPACT OUTCOMES**.
- **ML Target Leakage Policy**: These impact variables are ingested and preserved as historical severity indicators and audit records. They **MUST NEVER** be used as contemporaneous predictive features without an explicit observation-prediction time horizon.

## 3. Detailed Column Schema & Ingestion Mapping

| # | Raw Column Header | Inferred Type | Null Count | Zero Count | Non-Zero Count | Max Value | Normalized Target Field | Semantic Category |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `State` | `VARCHAR(255)` | 0 | 0 | 0 | 0.0 | `state_name` | Text |
| 2 | `Date` | `DATE` | 0 | 0 | 0 | 0.0 | `event_date` | ISO-8601 |
| 3 | `District Affected` | `VARCHAR(255)` | 93 | 0 | 0 | 0.0 | `district_name` | Text |
| 4 | `Name of Disaster` | `VARCHAR(255)` | 225 | 4 | 0 | 0.0 | `raw_disaster_name` | Text |
| 5 | `No. of Villages Affected` | `INTEGER` | 0 | 44,767 | 2,857 | 2,203.0 | `villages_affected_count` | Count / Headcount |
| 6 | `Population Affected` | `INTEGER` | 0 | 45,663 | 1,961 | 2,445,774.0 | `population_affected` | Count / Headcount |
| 7 | `No. of Deaths:Male` | `INTEGER` | 0 | 45,591 | 2,033 | 50.0 | `deaths_male` | Count / Headcount |
| 8 | `No. of Deaths:Female` | `INTEGER` | 0 | 47,051 | 573 | 20.0 | `deaths_female` | Count / Headcount |
| 9 | `No. of Deaths:Total` | `INTEGER` | 0 | 45,232 | 2,392 | 70.0 | `deaths_total` | Count / Headcount |
| 10 | `Injured` | `INTEGER` | 0 | 46,324 | 1,300 | 125.0 | `injured` | Count / Headcount |
| 11 | `Missing` | `INTEGER` | 0 | 47,453 | 171 | 15.0 | `missing` | Count / Headcount |
| 12 | `Animal Deaths:Big` | `INTEGER` | 0 | 46,834 | 790 | 46,361.0 | `animal_deaths_big` | Count / Headcount |
| 13 | `Animal Deaths:Small` | `INTEGER` | 0 | 47,199 | 425 | 30,528.0 | `animal_deaths_small` | Count / Headcount |
| 14 | `Crop Area Affected (Ha):Agri` | `NUMERIC(12,2)` | 0 | 47,040 | 584 | 11,141,050.0 | `crop_area_agri_ha` | Hectares |
| 15 | `Crop Area Affected (Ha):Horti` | `NUMERIC(12,2)` | 0 | 47,503 | 121 | 85,413.0 | `crop_area_horti_ha` | Hectares |
| 16 | `House Damaged (Fully):Pakka` | `INTEGER` | 0 | 47,192 | 432 | 8,755.0 | `house_damaged_fully_pakka` | Count / Headcount |
| 17 | `House Damaged (Fully):Kacchha` | `INTEGER` | 0 | 46,975 | 649 | 248.0 | `house_damaged_fully_kacchha` | Count / Headcount |
| 18 | `House Damaged (Partially):Pakka` | `INTEGER` | 0 | 46,348 | 1,276 | 2,114.0 | `house_damaged_partially_pakka` | Count / Headcount |
| 19 | `House Damaged (Partially):Kacchha` | `INTEGER` | 0 | 46,354 | 1,270 | 1,770.0 | `house_damaged_partially_kacchha` | Count / Headcount |
| 20 | `Persons Evacuated` | `INTEGER` | 0 | 47,259 | 365 | 196,240.0 | `persons_evacuated` | Count / Headcount |
| 21 | `Relief Camps in Operation` | `INTEGER` | 0 | 47,081 | 543 | 131,494.0 | `relief_camps_in_operation` | Count / Headcount |
| 22 | `People in Relief Camps` | `INTEGER` | 0 | 47,037 | 587 | 825,000.0 | `people_in_relief_camps` | Count / Headcount |
| 23 | `Infrastructure Affected` | `INTEGER` | 0 | 46,714 | 910 | 10,000,000.0 | `infrastructure_affected_count` | Count / Headcount |

## 4. Controlled Hazard Taxonomy Mapping

| Raw Disaster Name | Frequency | Normalized Hazard Type | Confidence | Rule Rationale |
|---|---|---|---|---|
| `No Event` | 36,183 | **NO_EVENT** | 1.00 | Quiescence surveillance record |
| `Heavy Rain` | 3,206 | **Heavy Rain** | 0.95 | Keyword 'heavy rain' / 'rainfall' |
| `Air, Road and Rail Accidents` | 1,032 | **Transport Accident** | 0.85 | Keyword 'accident' |
| `Other :` | 1,002 | **Unspecified Hazard** | 0.30 | Vague placeholder category |
| `Others` | 999 | **Unspecified Hazard** | 0.30 | Vague placeholder category |
| `Floods` | 980 | **Flood** | 0.95 | Keyword 'flood' / 'inundation' |
| `Thunder and Lightening` | 845 | **Lightning** | 0.95 | Keyword 'lightning' / 'thunder' |
| `Landslides and Mudflows` | 356 | **Landslide** | 0.95 | Keyword 'landslide' / 'mudflow' |
| `Other : 0` | 280 | **Unspecified Hazard** | 0.30 | Vague placeholder category |
| `Other : Drowning` | 261 | **Hydrological Accident / Drowning** | 0.85 | Keyword 'drowning' |
| `` | 225 | **Unspecified Hazard** | 0.30 | Vague placeholder category |
| `Electrical Disasters and fires` | 129 | **Fire** | 0.90 | Keyword 'fire' |
| `Village Fire` | 102 | **Fire** | 0.90 | Keyword 'fire' |
| `Hailstorm` | 91 | **Cyclone / Windstorm** | 0.90 | Keyword 'cyclone' / 'storm' |
| `Other : Storm` | 89 | **Cyclone / Windstorm** | 0.90 | Keyword 'cyclone' / 'storm' |
| `Other : Erosion` | 86 | **Other Localized Hazard** | 0.60 | Fallback local category |
| `Cyclones` | 85 | **Cyclone / Windstorm** | 0.90 | Keyword 'cyclone' / 'storm' |
| `Other` | 76 | **Unspecified Hazard** | 0.30 | Vague placeholder category |
| `Earthquakes` | 69 | **Earthquake** | 0.95 | Keyword 'earthquake' |
| `Forest Fires` | 42 | **Fire** | 0.90 | Keyword 'fire' |
| `Drowning` | 41 | **Hydrological Accident / Drowning** | 0.85 | Keyword 'drowning' |
| `Urban Fires` | 34 | **Fire** | 0.90 | Keyword 'fire' |
| `Other : Light Rain` | 29 | **Other Localized Hazard** | 0.60 | Fallback local category |
| `Heat Wave and Cold Wave` | 29 | **Other Localized Hazard** | 0.60 | Fallback local category |
| `Other : DROWNING` | 28 | **Hydrological Accident / Drowning** | 0.85 | Keyword 'drowning' |
| `Other : Accidental Drowning` | 28 | **Hydrological Accident / Drowning** | 0.85 | Keyword 'drowning' |
| `Other : Snake Bite` | 27 | **Other Localized Hazard** | 0.60 | Fallback local category |
| `Droughts` | 27 | **Drought** | 0.95 | Keyword 'drought' |
| `Other : drowning` | 20 | **Hydrological Accident / Drowning** | 0.85 | Keyword 'drowning' |
| `Other : Thunderstorm` | 20 | **Cyclone / Windstorm** | 0.90 | Keyword 'cyclone' / 'storm' |
| `Other : Tree Fall` | 20 | **Other Localized Hazard** | 0.60 | Fallback local category |
| `Other : Fire` | 18 | **Fire** | 0.90 | Keyword 'fire' |
| `Sea Erosion` | 16 | **Other Localized Hazard** | 0.60 | Fallback local category |
| `Other : light rain` | 15 | **Other Localized Hazard** | 0.60 | Fallback local category |
| `Chemical and industrial Disasters` | 15 | **Other Localized Hazard** | 0.60 | Fallback local category |
| `Cloud Burst` | 14 | **Cloudburst** | 0.95 | Keyword 'cloudburst' |
| `Food Poisoning` | 13 | **Other Localized Hazard** | 0.60 | Fallback local category |
| `Other : Fall from Cliff` | 13 | **Other Localized Hazard** | 0.60 | Fallback local category |
| `Other : Non Flood Drowning` | 12 | **Flood** | 0.95 | Keyword 'flood' / 'inundation' |
| `Major Building Collapse` | 12 | **Other Localized Hazard** | 0.60 | Fallback local category |

## 5. Uttarakhand & Demonstration District (Chamoli) Profile

- **Total Uttarakhand Records**: 641
- **Chamoli Records**: 55 (including active events: Landslides and Mudflows, Heavy Rain, Thunder/Lightning, Rockfall, Accidents, and Quiescence)
- **Benchmark Alignment**: Provides the empirical historical baseline for the deterministic Chamoli relocation scenario benchmark.
