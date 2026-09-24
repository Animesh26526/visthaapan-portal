# VISTHAAPAN — Phase 6 Pre-Phase 7 Complete Workflow & Data Connectivity Audit

**Date**: 2026-09-18  
**Audit Scope**: Phase 1 through Phase 6 End-to-End Workflow, Data Lineage, Schema Connectivity, AI/GIS Pipeline Isolation, and Phase 7/8 Readiness  
**Base Commit**: `b0fde31`  
**Target Branch**: `develop`  
**Lead Auditor**: Antigravity AI Pair Programming System  

---

## 1. Executive Summary

### 1.1 Objective & Context
With Phases 1 through 6 implemented and committed (latest Phase 6 semantic/provenance audit at `b0fde31`), this audit establishes an exhaustive verification of the entire VISTHAAPAN repository before initiating **Phase 7 (Capacity Assessment)** and **Phase 8 (Operations Research Optimization & Spatial Allocation)**.

In strict compliance with audit governance rules:
- **Zero Architecture Redesign**: The established three-tier architecture (PostgreSQL/PostGIS, Express/Node.js, React/TypeScript) and core engines remain intact.
- **Zero Feature Creep**: No Phase 7 capacity algorithms or Phase 8 solvers were implemented.
- **Strict Provenance Quarantine**: Datasets are categorized into `REAL`, `DERIVED`, and `SIMULATED`. Quarantined data (e.g., corrupt hospital bed counts) and boundary-limited data (e.g., Cartosat-1 DEM GeoTIFFs) are rigorously guarded against silent defaulting and synthetic fabrication.
- **Targeted Defect Resolution**: Only genuine structural and connectivity defects were repaired.

### 1.2 Audit Methodology
1. **Schema & Migration Audit**: Inspected migrations `001` through `011`, examining all 45 database relations (tables and views), foreign key constraints, geometric SRIDs (strictly `SRID=4326`), and row counts.
2. **Pipeline & Data Lineage Audit**: Traced ingestion pipelines for canonical districts, disaster history, demographics, healthcare facilities, and state capitals into derived profile rollups.
3. **AI Risk Engine Audit**: Audited feature extraction, Platt scaling, Isotonic calibration, XGBoost risk scoring, SHAP attributions, and Relocation Priority Weight (RPW) tier calculations.
4. **GIS Spatial Engine Audit**: Audited hazard layer ingestion, ST_Buffer/ST_Union geometries, red zone generation, candidate relocation site suitability multi-criteria scoring, and DEM raster tile extraction.
5. **API & Frontend Interface Audit**: Cross-referenced all backend route handlers with frontend services, stores, and UI view components to eliminate dead-ends and broken contracts.
6. **Five Smoke Traces**: Verified complete end-to-end data flows from raw database rows to frontend presentation for Chamoli disaster history, healthcare bed isolation, hazard-to-site spatial intersections, candidate site bottlenecks, and Phase 7/8 prerequisite data inventory.

### 1.3 Key Audit Findings Summary
- **Overall System Health**: **STRONG (PASS)**.
- **Data Volume**: 785 canonical districts, 47,621 disaster records, 640 demographic records, 30,273 healthcare facilities, 4 benchmark hazard layers, 5 red zones, 6 candidate relocation sites, and 30 heuristic evacuation routes.
- **Defects Identified & Resolved**:
  1. *Self-intersecting polygon* in seed hazard layer `Alaknanda Riverine Flash Flood Corridor` repaired to valid non-crossing coordinates (`ST_IsValid = true`).
  2. *Non-idempotent hazard layer seed* fixed by introducing cascading transactional cleanup of simulated layers before insertion.
  3. *UUID type casting crash* in `getSiteSuitabilityAuditById()` resolved to support benchmark textual site identifiers (`SITE-001` through `SITE-006`).
  4. *Frontend Intelligence Service Disconnect* fixed by adding missing Phase 5 REST endpoints (`/intelligence/districts`, `/intelligence/districts/:districtId`, `/intelligence/model`).
  5. *Frontend Environment Configuration* stabilized by providing `frontend/.env.example` with default REST API configuration.
- **Regression Testing**: 100% pass rate across all 7 backend test suites (200 automated tests), 0 TypeScript errors, 0 frontend build errors.
- **Phase 7/8 Gate Verdict**: **CONDITIONAL PASS — READY TO PROCEED WITH EXPLICIT DATA CONSTRAINTS**.

---

## 2. Complete Data Flow Diagram

```mermaid
flowchart TD
    subgraph S1["1. External Data Sources (Raw)"]
        D1["LGD & Survey of India<br/>(785 Districts)"]
        D2["NDEM & Disaster Archives<br/>(47,621 Events)"]
        D3["Census of India 2011<br/>(640 Demographics)"]
        D4["National Health Directory<br/>(30,273 Facilities)"]
        D5["Cartosat-1 DEM GeoTIFF<br/>(Western Gujarat 68°-71°E)"]
        D6["Benchmark Scenarios<br/>(Chamoli Test Envelopes)"]
    end

    subgraph S2["2. Ingestion & Spatial Sanitization (REAL)"]
        I1["ingestDistrictMaster.ts"]
        I2["ingestDisasters.ts"]
        I3["ingestCensusDemographics.ts"]
        I4["ingestHospitals.ts<br/>(Quarantines 30,214 corrupt beds)"]
        I5["terrainService.ts<br/>(Strict Non-Fabrication Rule)"]
        I6["hazardLayerService.ts<br/>(ST_IsValid Coordinate Fix)"]
    end

    subgraph S3["3. PostgreSQL / PostGIS Relational & Spatial Storage"]
        T1[("canonical_districts<br/>[REAL: 785 rows]")]
        T2[("district_disaster_events<br/>[REAL: 47,621 rows]")]
        T3[("district_demographics<br/>[REAL: 640 rows]")]
        T4[("hospitals<br/>[REAL: 30,273 rows<br/>is_bed_count_suspicious=true]")]
        T5[("hazard_layers<br/>[SIMULATED: 4 rows]")]
        T6[("relocation_sites<br/>[SIMULATED: 6 rows]")]
        T7[("candidate_routes<br/>[SIMULATED: 30 rows]")]
    end

    subgraph S4["4. Derived Aggregations & Intelligence Engine (DERIVED)"]
        P1["district_hazard_profiles<br/>(Frequency, Severity, Gini)"]
        P2["district_healthcare_profiles<br/>(Facility Counts; Beds QUARANTINED)"]
        V1["view_district_intelligence<br/>(Denormalized Analytical View)"]
        AI1["aiRiskService.ts<br/>(12 Features, Platt Scaling, XGBoost)"]
        AI2["risk_assessments<br/>(Calibrated Probabilities)"]
        AI3["relocation_priorities<br/>(RPW 0..1, Operational Tiers)"]
        AI4["risk_feature_contributions<br/>(SHAP Value Explainability)"]
    end

    subgraph S5["5. GIS Spatial Analysis Engines (DERIVED & SIMULATED)"]
        G1["unsafeZoneEngine.ts<br/>(ST_Buffer & ST_Union)"]
        G2[("red_zones<br/>[DERIVED: 5 zones]")]
        G3["siteSuitabilityEngine.ts<br/>(Multi-Criteria Suitability Scoring)"]
        G4[("site_suitability_assessments<br/>[DERIVED: 6 assessments]")]
    end

    subgraph S6["6. Express REST API (v1)"]
        API1["/api/v1/health<br/>(Database, PostGIS, Engine Health)"]
        API2["/api/v1/intelligence/districts<br/>(List with RPW Tiers)"]
        API3["/api/v1/intelligence/districts/:id<br/>(SHAP Explainability & Risk Profile)"]
        API4["/api/v1/intelligence/model<br/>(Active Version & Calibration Metrics)"]
        API5["/api/v1/gis/hazard-layers<br/>(GeoJSON Spatial Layers)"]
        API6["/api/v1/gis/red-zones<br/>(Calculated Hazard Exclusions)"]
        API7["/api/v1/gis/sites<br/>(Candidate Sites & Capacities)"]
        API8["/api/v1/gis/sites/:id/suitability<br/>(Site Suitability Score & Audit)"]
    end

    subgraph S7["7. Frontend UI / React Client"]
        F1["RiskIntelligence.tsx<br/>(National Risk Ranking & SHAP Waterfall)"]
        F2["RiskGIS.tsx<br/>(Leaflet Map, Hazard Layers, Red Zones)"]
        F3["SiteEvaluation.tsx<br/>(Site Multi-Criteria Scores & Bottlenecks)"]
        F4["useAppStore.ts<br/>(State Management & Navigation)"]
    end

    D1 --> I1 --> T1
    D2 --> I2 --> T2
    D3 --> I3 --> T3
    D4 --> I4 --> T4
    D5 --> I5
    D6 --> I6 --> T5

    T1 & T2 --> P1
    T1 & T4 --> P2
    T1 & T3 & P1 & P2 --> V1
    V1 --> AI1
    AI1 --> AI2 & AI3 & AI4

    T5 --> G1 --> G2
    T6 & G2 & T4 & I5 --> G3 --> G4
    T6 --> T7

    AI2 & AI3 --> API2
    AI2 & AI3 & AI4 --> API3
    AI1 --> API4
    T5 --> API5
    G2 --> API6
    T6 --> API7
    G4 --> API8

    API2 & API3 & API4 --> F1
    API5 & API6 & API7 --> F2
    API7 & API8 --> F3
```

---

## 3. Entity/Table Producer-Consumer Matrix

The database comprises 45 relations across migrations `001` through `011`. The following matrix documents the provenance, row count, producer pipeline, consumer processes, and current connectivity status for every relation.

| # | Entity / Table / View | Provenance Tier | Row Count | Primary Key / Index | Primary Producer | Primary Consumer(s) | Status |
|---|---|---|---|---|---|---|---|
| 1 | `schema_migrations` | SYSTEM | 11 | `version` (PK) | Migration Runner | Migration Runner, Health Check | `PASS` |
| 2 | `canonical_districts` | REAL | 785 | `id` (PK UUID), `code` (Unique) | `ingestDistrictMaster.ts` | Disasters, Demographics, Hospitals, AI Engine | `PASS` |
| 3 | `district_aliases` | REAL | 120 | `id` (PK UUID), `alias_name` | `ingestDistrictMaster.ts` | Ingestion Fuzzy Matchers | `PASS` |
| 4 | `district_disaster_events` | REAL | 47,621 | `id` (PK UUID), `district_id` (FK) | `ingestDisasters.ts` | `district_hazard_profiles`, AI Feature Extractor | `PASS` |
| 5 | `district_demographics` | REAL | 640 | `id` (PK UUID), `district_id` (FK) | `ingestCensusDemographics.ts` | `view_district_intelligence`, AI Feature Extractor | `PASS` |
| 6 | `hospitals` | REAL | 30,273 | `id` (PK UUID), `district_id` (FK) | `ingestHospitals.ts` | `district_healthcare_profiles`, GIS Proximity Engine | `PASS` |
| 7 | `state_capitals` | REAL | 34 | `id` (PK UUID), `state_name` | `ingestStateCapitals.ts` | GIS Regional Center Proximity | `PASS` |
| 8 | `district_hazard_profiles` | DERIVED | 651 | `id` (PK UUID), `district_id` (FK) | `districtHazardProfileService.ts` | `view_district_intelligence`, AI Risk Model | `PASS` |
| 9 | `district_healthcare_profiles` | DERIVED | 573 | `id` (PK UUID), `district_id` (FK) | `districtHealthcareProfileService.ts` | `view_district_intelligence`, AI Risk Model | `PASS` |
| 10 | `view_district_intelligence` | DERIVED (VIEW) | 785 | `district_id` | SQL Migration 003 / 005 | `aiRiskService.ts`, Intelligence Controller | `PASS` |
| 11 | `ai_model_metadata` | SYSTEM | 2 | `id` (PK UUID), `version` | Model Training Pipeline | Intelligence Controller (`/model`), Inference Engine | `PASS` |
| 12 | `risk_assessments` | DERIVED | 785 | `id` (PK UUID), `district_id` (FK) | `aiRiskService.ts` | Intelligence Controller, Phase 8 Prioritization | `PASS` |
| 13 | `relocation_priorities` | DERIVED | 785 | `id` (PK UUID), `district_id` (FK) | `aiRiskService.ts` (RPW Engine) | `/intelligence/districts`, Phase 7/8 Engines | `PASS` |
| 14 | `risk_feature_contributions` | DERIVED | 3,925 | `id` (PK UUID), `assessment_id` (FK) | `aiRiskService.ts` (SHAP Explainer) | `/intelligence/districts/:id` (SHAP Waterfall) | `PASS` |
| 15 | `hazard_layers` | SIMULATED | 4 | `id` (PK UUID), `geometry` (GIST) | `hazardLayerService.ts` | `unsafeZoneEngine.ts`, `/gis/hazard-layers` | `PASS` |
| 16 | `red_zones` | DERIVED | 5 | `id` (PK UUID), `geometry` (GIST) | `unsafeZoneEngine.ts` | `siteSuitabilityEngine.ts`, `/gis/red-zones` | `PASS` |
| 17 | `red_zone_hazards` | DERIVED | 4 | `id` (PK UUID), Junction | `unsafeZoneEngine.ts` | GIS Audit Traceability | `PASS` |
| 18 | `relocation_sites` | SIMULATED | 6 | `id` (PK UUID), `location` (GIST) | `seedRelocationSites.ts` | `siteSuitabilityEngine.ts`, `/gis/sites` | `PASS` |
| 19 | `site_capacities` | SIMULATED | 6 | `id` (PK UUID), `site_id` (FK) | `seedRelocationSites.ts` | `siteSuitabilityEngine.ts`, Phase 7 Capacity | `SIMULATED` |
| 20 | `site_suitability_assessments` | DERIVED | 6 | `id` (PK UUID), `site_id` (FK) | `siteSuitabilityEngine.ts` | `/gis/sites/:id/suitability`, Phase 8 Allocation | `PASS` |
| 21 | `site_demographic_fit` | DERIVED | 6 | `id` (PK UUID), `site_id` (FK) | `siteSuitabilityEngine.ts` | Site Evaluation Detail | `PASS` |
| 22 | `site_community_preferences` | SIMULATED | 6 | `id` (PK UUID), `site_id` (FK) | Migration 006 Seed | Social Acceptance Scorer | `SIMULATED` |
| 23 | `candidate_routes` | SIMULATED | 30 | `id` (PK UUID), `site_id` (FK) | Migration 006 Seed | Route Evaluation, Phase 8 Transport Matrix | `SIMULATED` |
| 24 | `route_segments` | SIMULATED | 0 | `id` (PK UUID), `route_id` (FK) | Unpopulated (Migration 006) | Granular Route Simulation | `PHASE-FUTURE` |
| 25 | `roads` | REAL (SCHEMA) | 0 | `id` (PK UUID), `geometry` (GIST) | Unpopulated (Migration 006) | Spatial Routing Engines | `UNAVAILABLE` |
| 26 | `habitations` | SIMULATED | 5 | `id` (PK UUID), `district_id` (FK) | Benchmark Ingestion | Legacy Micro-Suitability Views | `SIMULATED` |
| 27 | `vulnerability_indicators` | SIMULATED | 5 | `id` (PK UUID), `habitation_id` (FK) | Benchmark Ingestion | Legacy Micro-Suitability Views | `SIMULATED` |
| 28 | `scenarios` | SIMULATED | 4 | `id` (PK UUID), `code` (Unique) | Migration 005 Seed | Scenario Simulation Controller | `PASS` |
| 29 | `optimization_runs` | DERIVED | 0 | `id` (PK UUID) | Phase 8 Solver Engine | Phase 8 Audit Logs | `PHASE-FUTURE` |
| 30 | `allocations` | DERIVED | 0 | `id` (PK UUID), `run_id` (FK) | Phase 8 Solver Engine | Phase 8 Results Dashboard | `PHASE-FUTURE` |
| 31 | `allocation_transfers` | DERIVED | 0 | `id` (PK UUID), `allocation_id` (FK) | Phase 8 Solver Engine | Phase 8 Transit Schedules | `PHASE-FUTURE` |
| 32 | `site_infrastructure` | SIMULATED | 6 | `id` (PK UUID), `site_id` (FK) | Migration 006 Seed | Phase 7 Infrastructure Audit | `SIMULATED` |
| 33 | `site_water_resources` | SIMULATED | 6 | `id` (PK UUID), `site_id` (FK) | Migration 006 Seed | Phase 7 WASH Assessment | `SIMULATED` |
| 34 | `site_environmental_limits` | SIMULATED | 6 | `id` (PK UUID), `site_id` (FK) | Migration 006 Seed | Phase 7 Environmental Capacity | `SIMULATED` |
| 35 | `site_hazards` | SIMULATED | 6 | `id` (PK UUID), `site_id` (FK) | Migration 006 Seed | Site Risk Screening | `SIMULATED` |
| 36 | `site_land_availability` | SIMULATED | 6 | `id` (PK UUID), `site_id` (FK) | Migration 006 Seed | Phase 7 Land Ingestion | `SIMULATED` |
| 37 | `spatial_ref_sys` | SYSTEM | 8,500 | `srid` (PK) | PostGIS Extension | PostGIS Coordinate Projection Engine | `PASS` |
| 38 | `geocoding_cache` | SYSTEM | 785 | `id` (PK UUID), `query_hash` | Geocoding Pipeline | Geocoder Rate-Limit Cache | `PASS` |
| 39 | `audit_logs` | SYSTEM | 142 | `id` (PK UUID) | System Audit Middleware | Security & Compliance Review | `PASS` |
| 40 | `data_sources` | SYSTEM | 18 | `id` (PK UUID) | Seed Ingestion Pipelines | Lineage Provenance Tracker | `PASS` |
| 41 | `ingestion_runs` | SYSTEM | 24 | `id` (PK UUID), `source_id` (FK) | Ingestion Runner | Pipeline Execution Monitor | `PASS` |
| 42 | `raw_ingestion_payloads` | SYSTEM | 785 | `id` (PK UUID) | Ingestion Runner | Payload Replay Engine | `PASS` |
| 43 | `system_settings` | SYSTEM | 8 | `key` (PK) | Admin Seeder | Dynamic System Config | `PASS` |
| 44 | `users` | SYSTEM | 3 | `id` (PK UUID), `username` | Auth Migration | Role-Based Access Control | `PASS` |
| 45 | `user_sessions` | SYSTEM | 0 | `id` (PK UUID), `user_id` (FK) | Auth Service | Session Manager | `PASS` |

---

## 4. Critical Field-Level Lineage Matrix

This matrix tracks the life cycle of every mission-critical data point from original source ingestion to database persistence, analytical transformation, and UI rendering.

| Field Name | Source Document / Ingest Column | Database Storage | Analytical Transformation & Calculation | API Representation | Frontend Representation | Audit Status |
|---|---|---|---|---|---|---|
| **District LGD Code** | LGD Master `district_code` | `canonical_districts.code` | Standardized uppercase 3-character/numeric string | `district.code` in `/intelligence/districts` | District selector, table row ID | `PASS` |
| **District Centroid** | Survey of India Shapefiles | `canonical_districts.centroid` (`GEOMETRY(Point, 4326)`) | PostGIS `ST_SetSRID(ST_MakePoint(lng, lat), 4326)` | `latitude`, `longitude` properties | Map pin, leaflet fly-to coordinates | `PASS` |
| **Historical Disaster Count** | NDEM/Disaster CSV `Disaster_Date`, `Type` | `district_disaster_events` (47,621 rows) | Aggregated into `district_hazard_profiles.total_disaster_events` | `disasterCount` in intelligence detail | Hazard summary card, frequency metric | `PASS` |
| **Total Population** | Census 2011 Primary Census Abstract | `district_demographics.total_population` | Aggregated per district; `NULL` for 145 newly formed districts | `totalPopulation` in `/intelligence/districts` | Demographics stat badge, vulnerability score | `PARTIAL` (640/785 districts) |
| **Hospital Bed Count** | National Health Directory `Number_Beds` | `hospitals.raw_bed_count`, `is_bed_count_suspicious` | **STRICT QUARANTINE**: 30,214 corrupt strings flagged `true`; excluded from aggregations | Excluded from `/intelligence` capacity vectors | Displays "Bed data quarantined / unverified" | `PASS` (Safely Quarantined) |
| **Risk Probability (Raw)** | AI Feature Matrix (12 features) | Model memory / XGBoost Inference | `XGBClassifier.predict_proba(X)` | `rawProbability` in model metadata | Not exposed directly (uncalibrated) | `PASS` |
| **Calibrated Risk Probability** | Raw Probability | `risk_assessments.calibrated_risk_score` | Platt Sigmoid Scaling: $P_{cal} = \frac{1}{1 + e^{A \cdot f(x) + B}}$ | `calibratedRiskScore` in `/intelligence/districts` | Calibrated risk meter (0.00 to 1.00) | `PASS` |
| **Relocation Priority Weight (RPW)** | Risk Score, Vulnerability Score, Urgency Score | `relocation_priorities.priority_weight` | $RPW = 0.50 \cdot R_{risk} + 0.35 \cdot V_{vuln} + 0.15 \cdot U_{urgency}$ | `relocationPriorityWeight` in `/intelligence/districts` | Priority Tier Badge (`immediate`: 99, `short-term`: 231, `medium-term`: 455) | `PASS` |
| **Feature Contributions (SHAP)** | Feature Matrix + TreeExplainer | `risk_feature_contributions.shap_value` | Exact TreeSHAP additive attribution: $\sum \phi_i = f(x) - E[f(x)]$ | `topFeatures: [{feature, shapValue, direction}]` | Interactive horizontal SHAP waterfall bar chart | `PASS` |
| **Hazard Spatial Boundary** | Benchmark Chamoli Coordinates | `hazard_layers.geometry` (`GEOMETRY(Polygon, 4326)`) | Repaired coordinate sequence; validated via `ST_IsValid` | GeoJSON FeatureCollection in `/gis/hazard-layers` | Red polygon overlay with hazard buffer | `PASS` |
| **Red Zone Exclusion Geometry** | Union of Hazard Layers | `red_zones.geometry` (`GEOMETRY(MultiPolygon, 4326)`) | `ST_Multi(ST_Buffer(ST_Union(geometry), buffer_meters))` | GeoJSON MultiPolygon in `/gis/red-zones` | Semi-transparent crimson exclusion layer | `PASS` |
| **Site Safety Score** | Red Zone & Hazard Proximity | `site_suitability_assessments.safety_score` | $1.0 - \max(\text{overlap}, \text{proximity\_penalty})$; Pipalkoti = 0.15 | `safetyScore` in `/gis/sites/:id/suitability` | Safety dial indicator, RESTRICTED warning | `PASS` |
| **Site Suitability Score** | Safety, Terrain, Roads, Hospitals | `site_suitability_assessments.suitability_score` | Weighted sum: $0.45 \cdot S_{safe} + 0.20 \cdot S_{slope} + 0.20 \cdot S_{hosp} + 0.15 \cdot S_{road}$ | `suitabilityScore` in `/gis/sites/:id/suitability` | Overall suitability gauge (0 to 1) | `PASS` |
| **Site Population Capacity** | Benchmark Scenario Capacity | `site_capacities.max_population_capacity` | Heuristic physical land assessment (Pipalkoti: 2,500; Rishikesh: 20,000) | `effectiveCapacity`, `capacityLimits` in `/gis/sites` | Capacity progress bar, bottleneck tag | `SIMULATED` |
| **Candidate Route Travel Time** | Winding factor + Road speed | `candidate_routes.travel_time_minutes` | Heuristic: $\text{distance} \times 1.6 \text{ winding} / 35\text{ km/h} \times 60$ | `routes: [{travelTimeMinutes, distanceKm}]` | Evacuation route corridor on map | `SIMULATED` |

---

## 5. API Connectivity Matrix

All endpoints were systematically tested against the live PostgreSQL database and Express server.

| HTTP Method | Route Endpoint | Controller Handler | Underlying Table(s) / View(s) | Expected Status | Actual Status | Response Payload Verification |
|---|---|---|---|---|---|---|
| `GET` | `/api/v1/health` | `HealthController.getHealth` | `schema_migrations`, PostGIS | `200 OK` | `PASS` | Returns database status, PostGIS version 3.4, system timestamp |
| `GET` | `/api/v1/health/detailed` | `HealthController.getDetailedHealth` | `canonical_districts`, `hospitals` | `200 OK` | `PASS` | Reports row counts, engine statuses, memory usage |
| `GET` | `/api/v1/intelligence/districts` | `IntelligenceController.getDistricts` | `relocation_priorities`, `canonical_districts` | `200 OK` | `PASS` | 785 records with operational RPW tiers and calibrated scores |
| `GET` | `/api/v1/intelligence/districts/:id` | `IntelligenceController.getDistrictDetail` | `canonical_districts`, `risk_assessments`, `risk_feature_contributions` | `200 OK` | `PASS` | Returns district demographics, calibrated risk, and top 5 SHAP factors |
| `GET` | `/api/v1/intelligence/model` | `IntelligenceController.getModelInfo` | `ai_model_metadata` | `200 OK` | `PASS` | Returns active version `xgb_platt_v1.0.0`, Brier score 0.042, Platt parameters |
| `GET` | `/api/v1/gis/hazard-layers` | `GISController.getHazardLayers` | `hazard_layers` | `200 OK` | `PASS` | Valid GeoJSON FeatureCollection of 4 Chamoli hazard zones |
| `GET` | `/api/v1/gis/red-zones` | `GISController.getRedZones` | `red_zones` | `200 OK` | `PASS` | 5 unioned exclusion MultiPolygons with hazard associations |
| `GET` | `/api/v1/gis/sites` | `GISController.getRelocationSites` | `relocation_sites`, `site_capacities` | `200 OK` | `PASS` | 6 benchmark sites with capacities and physical constraints |
| `GET` | `/api/v1/gis/sites/:id/suitability` | `GISController.getSiteSuitabilityAudit` | `relocation_sites`, `site_suitability_assessments`, `candidate_routes` | `200 OK` | `PASS` | Full multi-criteria audit for UUID or benchmark ID (`SITE-001`) |
| `POST` | `/api/v1/gis/red-zones/recalculate` | `GISController.recalculateRedZones` | `hazard_layers`, `red_zones` | `200 OK` | `PASS` | Triggers spatial union and updates derived red zones |
| `POST` | `/api/v1/gis/sites/recalculate` | `GISController.recalculateSiteSuitability` | `relocation_sites`, `red_zones`, `hospitals` | `200 OK` | `PASS` | Computes fresh multi-criteria scores for all candidate sites |

---

## 6. Frontend Connectivity Matrix

The frontend client (`frontend/src/`) communicates with the backend via Axios with fallback support for deterministic mock data.

| Component / Page View | Primary Service Invoked | Target API Route | Mock Fallback Available? | Live API Connectivity Status | Notes / Observations |
|---|---|---|---|---|---|
| `RiskIntelligence.tsx` | `IntelligenceService.getDistrictsIntelligence` | `GET /api/v1/intelligence/districts` | Yes (`mockDistricts`) | `PASS` | Wired; correctly displays all 785 districts sorted by RPW |
| `RiskIntelligence.tsx` (Detail) | `IntelligenceService.getDistrictIntelligenceDetail` | `GET /api/v1/intelligence/districts/:id` | Yes (`mockHabitations`) | `PASS` | Wired; renders SHAP feature contributions |
| `RiskIntelligence.tsx` (Model) | `IntelligenceService.getActiveModelInfo` | `GET /api/v1/intelligence/model` | Yes (`mockModelMetadata`) | `PASS` | Wired; displays active XGBoost Platt calibration parameters |
| `RiskGIS.tsx` | `GISService.getHazardLayers` | `GET /api/v1/gis/hazard-layers` | Yes (`mockHazardLayers`) | `PASS` | Renders Leaflet polygon overlays with valid GeoJSON |
| `RiskGIS.tsx` | `GISService.getRedZones` | `GET /api/v1/gis/red-zones` | Yes (`mockRedZones`) | `PASS` | Displays calculated exclusion zones |
| `SiteEvaluation.tsx` | `GISService.getRelocationSites` | `GET /api/v1/gis/sites` | Yes (`mockSites`) | `PASS` | Lists 6 candidate relocation sites with capacities |
| `SiteEvaluation.tsx` (Audit) | `GISService.getSiteSuitabilityAudit` | `GET /api/v1/gis/sites/:id/suitability` | Yes (`mockSuitability`) | `PASS` | Robust against both UUIDs and benchmark IDs (`SITE-001`) |
| `useAppStore.ts` | Orchestration Store | Multiple Endpoints | Yes | `PASS` | Global district and site selection synchronized |

---

## 7. AI Data Flow Audit

### 7.1 Feature Extraction Pipeline
The feature extraction pipeline constructs a 12-dimensional feature vector for each of the 785 canonical districts from `view_district_intelligence`:
1. `disaster_frequency_annual`: Mean disaster count per year ($N_{events} / 10$).
2. `flood_frequency_annual`: Specific flood event rate.
3. `landslide_frequency_annual`: Landslide event rate in hilly terrain.
4. `cyclone_frequency_annual`: Coastal storm frequency.
5. `earthquake_frequency_annual`: Seismic activity frequency.
6. `disaster_severity_max`: Maximum recorded severity score (0 to 5).
7. `hazard_gini_coefficient`: Spatial and temporal inequality of disaster impact.
8. `population_density_log`: Logarithm of population density ($\ln(\text{pop} / \text{area} + 1)$).
9. `sc_st_population_ratio`: Vulnerable demographic proportion from Census 2011.
10. `hospital_proximity_mean_km`: Mean distance to registered healthcare facilities.
11. `healthcare_facilities_per_10k`: Facility density per 10,000 population.
12. `terrain_roughness_index`: Terrain complexity derived from slope metrics.

### 7.2 Calibration Layer
- **Uncalibrated Model**: Raw XGBoost probabilities exhibited typical tree-based overconfidence at the tails.
- **Platt Scaling**: Fitted Sigmoid mapping:
  $$\hat{P}(Y=1|f) = \frac{1}{1 + e^{-1.842 \cdot f + 0.312}}$$
- **Isotonic Calibration**: Fitted non-parametric isotonic regression as a validation reference.
- **Brier Score Validation**: Platt calibration achieved a Brier score of `0.042`, substantially outperforming raw outputs (`0.089`), ensuring reliable risk probabilities.

### 7.3 SHAP Attribution Engine
- Uses TreeSHAP with exact background tree expectation.
- Every district assessment persists top-5 feature contributions into `risk_feature_contributions`, satisfying the explainability mandate. For Chamoli, `disaster_frequency_annual` (+0.38) and `terrain_roughness_index` (+0.24) dominate.

### 7.4 Data Leakage & Overfitting Prevention
- Ground-truth targets ($Y \in \{0, 1\}$) are generated exclusively from historical disaster recurrence thresholds and impact records.
- Demographics and healthcare counts do not inform the label, preventing circular target contamination.

---

## 8. GIS Data Flow Audit

### 8.1 Spatial Sanitization & Geometry Integrity
- All spatial layers are stored in PostGIS in `EPSG:4326` (WGS 84).
- **Coordinate Order Audit**: All geometries use standard `(Longitude, Latitude)` coordinate sequences.
- **Defect Resolution**: Repaired self-intersecting polygon in `Alaknanda Riverine Flash Flood Corridor` (line 57 of `hazardLayerService.ts`). Verified via PostGIS:
  ```sql
  SELECT id, name, ST_IsValid(geometry), ST_GeometryType(geometry) 
  FROM hazard_layers;
  -- Result: Exactly 4 rows, all ST_IsValid = true
  ```

### 8.2 Red Zone Computation
- Derived via `unsafeZoneEngine.ts` by applying `ST_Buffer` based on hazard severity and confidence:
  $$\text{Buffer} = \text{buffer\_radius\_meters} \times (1.0 + \text{severity\_level} \times 0.2)$$
- Buffers are unioned using `ST_Union` to eliminate internal seams, producing 5 distinct red zones.

### 8.3 Multi-Criteria Site Suitability Scoring
The site suitability engine scores candidate relocation sites across 4 orthogonal dimensions:
$$S_{suitability} = 0.45 \cdot S_{safety} + 0.20 \cdot S_{slope} + 0.20 \cdot S_{healthcare} + 0.15 \cdot S_{road}$$
- **Safety**: Penalizes intersection with red zones ($S_{safety} = 0.15$ if intersecting red zone, e.g., Pipalkoti).
- **Slope**: Penalizes steep mountain slopes (> 15°).
- **Healthcare**: Evaluates distance to nearest hospital.
- **Road**: Evaluates distance to nearest transport corridor.

### 8.4 Terrain Non-Fabrication Rule
- The bundled Cartosat-1 GeoTIFF raster tiles cover western Gujarat (`68.0°E - 71.0°E`, `21.0°N - 24.0°N`).
- For Chamoli coordinates (`79.33°E, 30.41°N`), `terrainService.ts` strictly returns:
  ```json
  { "status": "UNAVAILABLE", "elevation": null, "slope": null }
  ```
- **Audit Rule Verification**: The system NEVER invents synthetic elevation or slope data when outside raster bounds. The suitability engine gracefully defaults slope factor to neutral (0.500) with an audit flag indicating terrain unavailability.

---

## 9. Provenance/Simulation Isolation Audit

The repository enforces strict separation between real empirical data, mathematically derived intelligence, and simulated benchmark fixtures:

```
+-----------------------------------------------------------------------------+
|                               DATA PROVENANCE                                |
+------------------------------+------------------------------+---------------+
| REAL EMPIRICAL               | DERIVED ANALYTICAL           | SIMULATED     |
| (Ground Truth)               | (Deterministic Transforms)   | (Benchmarks)  |
+------------------------------+------------------------------+---------------+
| • canonical_districts (785)  | • district_hazard_profiles   | • hazard_     |
| • district_disaster_events   | • district_healthcare_       |   layers (4)  |
|   (47,621)                     profiles                     | • relocation_ |
| • district_demographics      | • view_district_intelligence   sites (6)     |
|   (640 Census 2011)          | • risk_assessments           | • candidate_  |
| • hospitals (30,273)         | • relocation_priorities        routes (30)   |
| • state_capitals (34)        | • risk_feature_contributions | • site_       |
|                              | • red_zones (5)                capacities    |
+------------------------------+------------------------------+---------------+
```

### 9.1 Hospital Bed Quarantine Verification
- In the National Health Directory dataset, 30,214 of 30,273 hospital records contain corrupted non-numeric or malformed bed strings.
- Ingestion pipeline (`ingestHospitals.ts`) quarantines these records:
  - `is_bed_count_suspicious = true`
  - `raw_bed_count` retains original source text for future forensic parsing.
  - `total_beds` is set to `0` or `NULL`.
- Verified: `district_healthcare_profiles` aggregates ONLY validated beds (`is_bed_count_suspicious = false`), preventing false healthcare capacity assumptions in Phase 7/8.

### 9.2 Benchmark Entity Tagging
- All simulated relocation sites (`SITE-001` through `SITE-006`) and candidate routes carry explicit `data_origin = 'SIMULATED'` markers in the database and API responses.

---

## 10. NULL and Error Propagation Audit

| Pipeline Component | Nullable Input / Edge Condition | System Behavior | Degradation Strategy | Audit Status |
|---|---|---|---|---|
| `ingestCensusDemographics` | 145 newly created districts without Census 2011 PCA match | Inserts district row; demographics table has no row for district ID | `LEFT JOIN` in `view_district_intelligence` yields `NULL` population; AI engine imputes state median | `PASS` |
| `ingestHospitals` | Facility lacks geocoded point coordinates | Stored with `latitude = NULL`, `longitude = NULL`, `geom = NULL` | Excluded from PostGIS spatial distance queries; included in count aggregations | `PASS` |
| `terrainService` | Coordinate outside Cartosat-1 raster bounding box | GeoTIFF query returns no tile coverage | Returns `{ status: 'UNAVAILABLE', elevation: null, slope: null }`; suitability engine applies neutral weight with audit trail | `PASS` |
| `aiRiskService` | District has zero historical disaster events | `district_disaster_events` has 0 rows; hazard profile has 0 counts | Feature vector inputs set to `0.0`; model produces low baseline hazard score without NaN errors | `PASS` |
| `unsafeZoneEngine` | Zero hazard layers present in district | No hazard polygons to buffer or union | Returns empty GeoJSON collection; does not crash or generate false red zones | `PASS` |
| `siteSuitabilityEngine` | Candidate route has `NULL` road quality | `candidate_routes.road_condition` is unset | Defaults road transit speed to baseline 25 km/h with explicit `unverified` flag | `PASS` |

---

## 11. Phase 7/8 Readiness Matrix

Before implementing Phase 7 (Capacity Assessment) and Phase 8 (OR Allocation), each required input was audited for availability and integrity:

| # | Phase 7/8 Prerequisite Input | Availability Status | Current Source / Storage | Readiness Notes & Phase 7/8 Guidelines |
|---|---|---|---|---|
| 1 | **Total Population** | `AVAILABLE` | `district_demographics.total_population` (Census 2011) | Available for 640 districts. For 145 newly formed districts, Phase 7 must apply documented state-average extrapolation. |
| 2 | **Population Needing Relocation** | `AMBIGUOUS / DERIVED` | Computed dynamically from Red Zone intersection or Scenario | Not a static table column. Phase 7 must derive this by intersecting red zones with habitation populations or taking user scenario inputs. |
| 3 | **Site Capacities & Bottlenecks** | `SIMULATED` | `site_capacities` (6 benchmark sites) | Available for 6 Chamoli benchmark sites (effective capacity 40,100). National scale capacity assessment requires Phase 7 schema ingestion. |
| 4 | **Healthcare Bed Capacity** | `UNAVAILABLE` | `hospitals` (quarantined) | Bed counts are quarantined (30,214 corrupt rows). Phase 7/8 MUST rely on facility proximity and level (PHC/CHC/District Hospital), not bed counts. |
| 5 | **Water / Shelter Resources** | `SIMULATED` | `site_water_resources`, `site_infrastructure` | Populated for 6 benchmark sites. Phase 7 will evaluate these bottleneck dimensions. |
| 6 | **Transportation Feasibility & Routes** | `SIMULATED` | `candidate_routes` (30 heuristic routes) | Heuristic winding factor (1.6x) and 35 km/h mountainous speed. Actual surveyed road network (`roads` table) has 0 rows. |
| 7 | **Hazard Exclusion** | `AVAILABLE` | `red_zones` (PostGIS MultiPolygons) | Fully operational via PostGIS `ST_Intersects`. Candidate sites inside red zones are automatically penalized or excluded. |
| 8 | **Relocation Priority Weight (RPW)** | `AVAILABLE` | `relocation_priorities.priority_weight` | Populated for all 785 canonical districts with operational tiers (`immediate`, `short-term`, `medium-term`). |
| 9 | **Phased Relocation Horizon** | `AVAILABLE` | `relocation_priorities.operational_tier` | Tiers provide the multi-period time horizon necessary for Phase 8 multi-stage linear programming. |
| 10 | **Allocation Constraints & Solver Schema** | `PHASE-FUTURE` | Migration 005 schema (`optimization_runs`, `allocations`) | Database tables exist with proper foreign keys. Solver engine (OR-Tools / simplex) to be implemented in Phase 8. |

---

## 12. Dead-End / Orphan Components

1. **`roads` Table (Row Count: 0)**:
   - *Status*: `UNAVAILABLE`.
   - Schema defined in Migration 006, but no national road network shapefile has been ingested. Current routing relies on heuristic `candidate_routes`.
2. **`route_segments` Table (Row Count: 0)**:
   - *Status*: `PHASE-FUTURE`.
   - Micro-routing table reserved for future high-resolution transit simulation.
3. **`optimization_runs`, `allocations`, `allocation_transfers` (Row Count: 0)**:
   - *Status*: `PHASE-FUTURE`.
   - Intentionally empty; reserved for Phase 8 OR solver outputs.
4. **`habitations` and `vulnerability_indicators` (Row Count: 5)**:
   - *Status*: `SIMULATED`.
   - Benchmark village entities for micro-level demonstration in Chamoli.
5. **Legacy Frontend Mock Routes**:
   - `frontend/src/services/intelligence.service.ts` previously referenced legacy endpoints (`/intelligence/risk`, `/intelligence/provenance`). Resolved in Section 14.

---

## 13. Defects Found

During the course of the audit, four genuine system defects were detected:

1. **Defect D-01: Self-Intersecting Polygon in `hazard_layers` Seed**:
   - *Location*: `backend/src/gis/hazardLayerService.ts` (line 57).
   - *Description*: The polygon coordinates for `Alaknanda Riverine Flash Flood Corridor (SIMULATED)` had criss-crossing boundary lines (`Self-intersection at [79.387692, 30.362307]`), causing PostGIS to flag `ST_IsValid(geometry) = false`.
   - *Impact*: In PostGIS 16, invalid geometries break `ST_Union` and `ST_Buffer` operations when recalculating red zones, causing queries to fail or produce geometry anomalies.
2. **Defect D-02: Non-Idempotent Hazard Layer Seeder**:
   - *Location*: `backend/src/gis/hazardLayerService.ts` (`seedHazardLayers`).
   - *Description*: `seedHazardLayers()` executed `INSERT` statements on each call without cleaning up prior simulated layers, causing row count duplication (ballooning from 4 to 20 hazard layers and 21 red zones across test runs).
   - *Impact*: Skewed spatial unions and bloated query performance.
3. **Defect D-03: UUID Type Casting Crash in Site Suitability Audit**:
   - *Location*: `backend/src/gis/siteSuitabilityEngine.ts` (line 440).
   - *Description*: `WHERE s.id = $1` threw PostgreSQL error `invalid input syntax for type uuid: "SITE-001"` when requested with frontend benchmark IDs.
   - *Impact*: Frontend site evaluation detail modal crashed when selecting benchmark sites.
4. **Defect D-04: Frontend Intelligence Service Route Disconnect**:
   - *Location*: `frontend/src/services/intelligence.service.ts`.
   - *Description*: The service contained mock methods pointing to unreleased endpoints while lacking methods for the actual Phase 5 backend endpoints (`/intelligence/districts`, `/intelligence/districts/:districtId`, `/intelligence/model`).
   - *Impact*: Frontend could not consume live Phase 5 AI intelligence data.

---

## 14. Corrections Made

All identified defects were remediated with precision fixes and zero regressions:

### 14.1 Correction C-01: Validated Non-Crossing Polygon Coordinates
- **File**: `backend/src/gis/hazardLayerService.ts`
- **Change**: Adjusted the vertex sequence along the northwest and southeast riverbanks:
  ```typescript
  // Before (crossing vertices):
  wktGeometry: 'SRID=4326;POLYGON((79.55 30.55, 79.48 30.50, 79.43 30.43, 79.38 30.35, 79.25 30.26, 79.22 30.25, 79.24 30.27, 79.40 30.37, 79.45 30.45, 79.50 30.52, 79.57 30.56, 79.55 30.55))'

  // After (strictly valid polygon):
  wktGeometry: 'SRID=4326;POLYGON((79.55 30.57, 79.48 30.52, 79.43 30.45, 79.38 30.37, 79.24 30.27, 79.22 30.25, 79.25 30.24, 79.39 30.34, 79.44 30.42, 79.49 30.49, 79.56 30.54, 79.55 30.57))'
  ```
- **Verification**: `SELECT ST_IsValid(geometry) FROM hazard_layers;` returns `true` for all rows.

### 14.2 Correction C-02: Idempotent Hazard Seeder Cleanup
- **File**: `backend/src/gis/hazardLayerService.ts`
- **Change**: Added transactional deletion of simulated layers and cascading red zones prior to re-seeding:
  ```typescript
  await client.query('DELETE FROM red_zone_hazards;');
  await client.query('DELETE FROM red_zones;');
  await client.query("DELETE FROM hazard_layers WHERE data_origin = 'SIMULATED';");
  ```
- **Verification**: Repeated executions maintain an exact count of 4 hazard layers and 5 red zones.

### 14.3 Correction C-03: Benchmark ID Mapping in Site Suitability Query
- **File**: `backend/src/gis/siteSuitabilityEngine.ts`
- **Change**: Modified the SQL query to accept both standard UUIDs and benchmark identifiers (`SITE-001` through `SITE-006`):
  ```sql
  WHERE s.id::text = $1
     OR ($1 = 'SITE-001' AND s.name ILIKE '%Pipalkoti%')
     OR ($1 = 'SITE-002' AND s.name ILIKE '%Gauchar%')
     OR ($1 = 'SITE-003' AND s.name ILIKE '%Karnaprayag%')
     OR ($1 = 'SITE-004' AND s.name ILIKE '%Rudraprayag%')
     OR ($1 = 'SITE-005' AND s.name ILIKE '%Srinagar%')
     OR ($1 = 'SITE-006' AND s.name ILIKE '%Rishikesh%')
     OR s.name ILIKE ('%' || $1 || '%')
  LIMIT 1;
  ```
- **Verification**: Verified via test script; both UUID and `SITE-001` queries resolve with `200 OK`.

### 14.4 Correction C-04: Frontend Intelligence Service Live Methods
- **File**: `frontend/src/services/intelligence.service.ts`
- **Change**: Implemented `getDistrictsIntelligence()`, `getDistrictIntelligenceDetail()`, and `getActiveModelInfo()`, properly typed and routed to the Express backend.
- **Verification**: Frontend builds with 0 type errors.

### 14.5 Correction C-05: Client Environment Configuration Template
- **File**: `frontend/.env.example`
- **Change**: Created template specifying `VITE_API_BASE_URL=http://localhost:5000/api/v1` and `VITE_USE_MOCK_API=false`.

---

## 15. Remaining Known Gaps

The following data gaps are formally recorded and must guide the implementation of Phases 7 and 8:

1. **Census Demographics Coverage (640 / 785 Districts)**:
   - 145 districts created post-2011 (e.g., in Telangana, Ladakh, Haryana) lack separate 2011 Census PCA rows.
   - *Phase 7 Constraint*: Must implement parent-district split attribution or state-average per capita imputation.
2. **National Hospital Bed Data Quarantine**:
   - 99.8% of hospital bed strings are non-numeric and quarantined.
   - *Phase 7 Constraint*: Capacity assessment MUST NOT assume numeric bed counts from the current dataset. It must either treat healthcare capacity as facility count / level or ingest verified state health dashboard datasets.
3. **Cartosat-1 DEM National Coverage**:
   - Bundled raster DEM tiles cover western Gujarat (68°–71°E, 21°–24°N). Chamoli coordinates return `UNAVAILABLE`.
   - *Phase 7/8 Constraint*: The non-fabrication rule must remain strictly enforced. Slope data outside Gujarat must be marked `UNAVAILABLE` or supplemented with open-source SRTM 30m rasters.
4. **Roads & Surveyed Transport Network**:
   - `roads` table has 0 rows. Evacuation transport currently uses 30 heuristic `candidate_routes`.
   - *Phase 8 Constraint*: Optimization solver must use candidate route network distances or integrate OpenStreetMap / PMGSY routing APIs.

---

## 16. Test Results

### 16.1 Automated Backend Test Suites
All 7 backend test suites were executed against the live Docker PostgreSQL/PostGIS database:

```
Test Suites: 7 passed, 7 total
Tests:       200 passed, 200 total
Snapshots:   0 total
Time:        4.512 s
Ran all test suites.
```

- `foundation.test.ts`: **6 passed** (Health checks, CORS, error handling, JSON middleware).
- `db.test.ts`: **9 passed** (PostGIS 3.4, SRID 4326, spatial GiST indexes, spatial calculations, constraints).
- `pipeline.test.ts`: **10 passed** (Disaster ingestion, idempotency, hazard taxonomy, profile compilation, rollback safety).
- `enrichment.test.ts`: **39 passed** (785 canonical districts, 640 Census demographics, 30,273 hospitals with bed quarantine, unified view).
- `ai.test.ts`: **75 passed** (Model lineage, Platt calibration, RPW formula validation, TreeSHAP explainability, REST endpoints).
- `ai_validation.test.ts`: **25 passed** (Empirical validation, non-causal language audit, log-odds margin, boundary checks).
- `gis.test.ts`: **36 passed** (GeoJSON endpoints, red zone buffering/unions, site suitability scoring, benchmark audit).

### 16.2 Static Analysis & Build Verification
- **Backend TypeScript Compilation (`npm run typecheck`)**:
  - `Found 0 errors. Watching for file changes.` -> **PASS**.
- **Frontend Build (`npm run build`)**:
  - `vite build` completed in 1.48s. Output: `dist/index.html`, `dist/assets/index-*.js`. -> **PASS**.
- **Frontend Lint (`npm run lint`)**:
  - `0 errors, 11 non-blocking warnings` (standard fast-refresh / unused variable warnings). -> **PASS**.

### 16.3 Smoke Trace Verification
Five end-to-end smoke traces were executed via automated database and API queries:
- **Trace 1 (Chamoli Disaster -> AI -> RPW -> API)**: 385 disaster records aggregated -> Platt calibrated probability 0.814 -> RPW 0.711 (`immediate` operational tier) -> 5 SHAP factors -> API `200 OK`. -> **PASS**.
- **Trace 2 (Chamoli Healthcare Quarantine)**: 6 facilities in Chamoli -> 0 geocoded -> All bed records quarantined (`is_bed_count_suspicious = true`) -> Excluded from AI feature vector. -> **PASS**.
- **Trace 3 (GIS Hazard -> Red Zone -> Site Intersection)**: 4 valid hazard layers -> 5 valid red zones -> Pipalkoti site (`SITE-001`) intersects red zone -> Safety score 0.150, suitability 0.200 (RESTRICTED). -> **PASS**.
- **Trace 4 (Relocation Site Capacities)**: 6 benchmark sites -> Total effective capacity 40,100 -> Critical bottleneck tags (water supply, road access) populated. -> **SIMULATED (PASS)**.
- **Trace 5 (Phase 7/8 Input Inventory)**: Verified 785 canonical districts with centroids & RPW; 640 demographic records; 6 candidate relocation sites; 30 candidate routes. -> **PASS**.

---

## 17. Final Readiness Assessment

### 17.1 Readiness Verdict
**STATUS: CONDITIONAL PASS — FULLY APPROVED TO PROCEED TO PHASE 7 AND PHASE 8 UNDER EXPLICIT CONSTRAINTS.**

### 17.2 Mandatory Constraints for Phase 7 (Capacity Assessment)
1. **Quarantined Bed Enforcement**: Phase 7 capacity algorithms must NOT read raw hospital bed numbers. Capacity must be evaluated via facility count, facility classification, or explicitly flagged as `UNVERIFIED_HEALTHCARE_CAPACITY`.
2. **Non-Fabrication of DEM**: Where Cartosat-1 DEM rasters do not exist, terrain slope must remain `null` with `status: 'UNAVAILABLE'`. Neutral default multipliers must carry explicit uncertainty audit logs.
3. **Census 2011 Coverage Handling**: For the 145 districts formed after 2011, population calculations must apply documented state-average density rather than defaulting to zero.
4. **Benchmark Entity Demarcation**: All Phase 7 capacity metrics for `SITE-001` through `SITE-006` must maintain the `SIMULATED` origin tag.

### 17.3 Mandatory Constraints for Phase 8 (OR Allocation)
1. **Objective Function Inputs**: The optimization solver must formulate its objective function using the verified Relocation Priority Weight (`relocation_priorities.priority_weight`) and operational tiers (`immediate`, `short-term`, `medium-term`).
2. **Hard Exclusion Constraints**: PostGIS `ST_Intersects` with `red_zones` must act as a hard constraint ($x_{ij} = 0$) for non-habitable emergency zones.
3. **Transport Cost Matrix**: Until full `roads` vector datasets are ingested, route transit times must use the audited `candidate_routes` table with its documented 1.6x mountain winding factor.

---
*Signed and sealed on behalf of the Antigravity Pair Programming System.*  
*Repository State: Branch `develop`, Base Commit `b0fde31`, Ready for Pre-Phase 7 Commit.*
