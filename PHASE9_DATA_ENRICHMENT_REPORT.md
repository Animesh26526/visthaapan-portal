# VISTHAAPAN Portal — Phase 9 Data Enrichment Report
## Administrative Boundaries (Survey of India), Census 2011 Settlements & OpenStreetMap Infrastructure

**Status**: Verified & Operational  
**Date**: September 2026  
**System**: VISTHAAPAN (Vulnerability Intelligence and Spatial Transit for Hazard Affected Population Allocation Network)  
**SIH Problem Statement**: PS 26191 — Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs  
**Authority Attribution**: Survey of India, Ministry of Science and Technology; Office of the Registrar General & Census Commissioner, India; OpenStreetMap Contributors  

---

### Executive Summary

Phase 9 integrates real-world official geospatial and demographic datasets into the VISTHAAPAN decision-support platform, replacing synthetic placeholders with statutory boundaries and crowdsourced infrastructure vectors:
1. **Official Survey of India (SOI) Boundaries**: State boundary for Uttarakhand, all 13 official districts, and 111 official subdistricts (tehsils).
2. **Census of India 2011 Settlements**: 8,851 settlements (116 statutory/census towns and 8,735 villages across Chamoli and surrounding vulnerable mountain districts) with baseline demographic indicators and infrastructure amenities.
3. **OpenStreetMap (OSM) Northern Zone Infrastructure**: 4,354 classified road vectors, 79 critical facilities (healthcare, emergency, education, civic shelters), and 2,886 named localities.
4. **Spatial Verification & Topology**: 100% valid geometries (`ST_IsValid = TRUE`) and 100% hierarchical containment across administrative divisions.
5. **Strict Provenance & Non-Fabrication**: Prominent UI/API notices distinguishing statutory 2011 baseline data from real-time dynamic population, and crowdsourced road geometry from real-time passability.

---

### 1. Data Ingestion & Geometry Validation Metrics

| Dataset Layer | Source Entity | Raw Count | Ingested Features | Geometry Type | PostGIS `ST_IsValid` | Topology / Hierarchy Check |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **State Boundary** | Survey of India (05_UTTARAKHAND_STATE) | 1 | 1 | `MultiPolygon` | **100.0%** (1/1) | Encompasses all 13 districts |
| **District Boundaries** | Survey of India (05_UTTARAKHAND_DISTRICT) | 13 | 13 | `MultiPolygon` | **100.0%** (13/13) | Standardized LGD codes (056 to 068) |
| **Subdistricts / Tehsils** | Survey of India (05_UTTARAKHAND_SUBDISTRICT) | 111 | 111 | `MultiPolygon` | **100.0%** (111/111) | **100%** (111/111) centroid containment |
| **Census Settlements** | Census of India 2011 DCHB Uttarakhand | 8,851 | 8,851 | `Point` | **100.0%** (8,851/8,851) | MDDS town/village linkage |
| **OSM Classified Roads** | Geofabrik Northern Zone (`gis_osm_roads_free_1`) | 4,354 | 4,354 | `LineString` | **100.0%** (4,354/4,354) | Highway classifications preserved |
| **OSM Critical Facilities** | Geofabrik Northern Zone (`gis_osm_pois_free_1`) | 79 | 79 | `Point` | **100.0%** (79/79) | Hospital, clinic, fire, police, school |
| **OSM Places** | Geofabrik Northern Zone (`gis_osm_places_free_1`) | 2,886 | 2,886 | `Point` | **100.0%** (2,886/2,886) | Mountain settlements & hamlets |

---

### 2. Coordinate Reference System (CRS) Transformation

The official Survey of India shapefiles are published in a custom Lambert Conformal Conic (LCC) projection with the following WKT definition:
```text
PROJCS["LCC_WGS84",
  GEOGCS["GCS_WGS_1984",
    DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],
    PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],
  PROJECTION["Lambert_Conformal_Conic"],
  PARAMETER["False_Easting",2000000.0],
  PARAMETER["False_Northing",2000000.0],
  PARAMETER["Central_Meridian",82.5],
  PARAMETER["Standard_Parallel_1",12.0],
  PARAMETER["Standard_Parallel_2",24.0],
  PARAMETER["Latitude_Of_Origin",12.0],
  UNIT["Meter",1.0]]
```

During ingestion, all coordinates were converted directly to geographic `EPSG:4326` (WGS84 longitude/latitude) using `pyproj.Transformer.from_crs(src_crs, "EPSG:4326", always_xy=True)` with high-precision double-float arithmetic. All converted geometries were validated in PostGIS via `ST_MakeValid(ST_Multi(ST_GeomFromGeoJSON(...)))`.

---

### 3. Habitation to Census 2011 Settlement Mapping

The 5 benchmark habitations in Chamoli District have been linked to their official Census 2011 MDDS (Metadata & Data Standards) settlement codes in the `habitations` table:

| Habitation ID | Habitation Name | Sub-District (Tehsil) | Census 2011 Code | Settlement Name | Settlement Type | 2011 Baseline Pop. | Households |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `HAB-001` | Joshimath Upper | Joshimath | `800236` | Joshimath (NPP) | TOWN | 16,709 | 4,204 |
| `HAB-002` | Helang Village | Joshimath | `041857` | Helang | VILLAGE | 486 | 118 |
| `HAB-003` | Raini Chak Lata | Joshimath | `041865` | Reni Bichla | VILLAGE | 172 | 41 |
| `HAB-004` | Tapovan Settlement | Joshimath | `041870` | Tapoban | VILLAGE | 953 | 247 |
| `HAB-005` | Mana Border Village | Joshimath | `041804` | Mana | VILLAGE | 1,214 | 288 |

---

### 4. REST API Endpoint Specification

All endpoints return standard GeoJSON FeatureCollections (`EPSG:4326`) with explicit metadata and provenance headers:

#### 4.1 `GET /api/v1/gis/boundaries/state`
Returns the state MultiPolygon of Uttarakhand (Survey of India official geometry).
- **Properties**: `stateCode`, `stateName`, `shapeLength`, `shapeArea`, `provenance`.

#### 4.2 `GET /api/v1/gis/boundaries/districts`
Returns all 13 official district MultiPolygons with joined Phase 5 AI macro risk assessment metrics.
- **Properties**: `districtCode`, `districtName`, `stateCode`, `stateName`, `riskScore`, `riskTier`, `calibratedProbability`, `vulnerabilityScore`, `hazardScore`, `provenance`.

#### 4.3 `GET /api/v1/gis/boundaries/subdistricts`
Returns subdistrict MultiPolygons (filterable by `?district_code=057` for Chamoli's 12 tehsils).
- **Properties**: `subdistrictCode`, `subdistrictName`, `districtCode`, `districtName`, `shapeLength`, `shapeArea`, `provenance`.

#### 4.4 `GET /api/v1/gis/census-settlements`
Returns Census 2011 town and village points with baseline demographics (filterable by `?district_code=057&limit=100`).
- **Properties**: `settlementCode`, `settlementName`, `settlementType`, `districtCode`, `districtName`, `subdistrictName`, `cdBlockName`, `population2011Baseline`, `households2011Baseline`, `infrastructureMarkers`, `temporalNotice`, `provenance`.

#### 4.5 `GET /api/v1/gis/osm/roads`
Returns classified road LineStrings (motorway, trunk, primary, secondary, tertiary, residential).
- **Properties**: `osmId`, `name`, `ref`, `fclass`, `oneway`, `maxspeed`, `bridge`, `tunnel`, `classificationNotice`, `provenance`.

#### 4.6 `GET /api/v1/gis/osm/facilities`
Returns critical facility points categorized into healthcare, emergency, education, and shelter.
- **Properties**: `osmId`, `name`, `fclass`, `category`, `sourceNotice`, `provenance`.

---

### 5. Frontend Visual Interface (`RiskGIS.tsx`) Enhancements

1. **Interactive Layer Toggles**:
   - `Districts (SOI)`: Colored chloropleth polygons based on Phase 5 AI calibrated risk tiers.
   - `Tehsils (SOI)`: Dashed boundary polygons for tehsils/subdistricts.
   - `Census 2011 Settlements`: Circular badges distinguishing Towns (Sky blue) from Villages (Teal).
   - `Mapped Roads (OSM)`: Color-coded road vectors according to road hierarchy.
   - `Critical Facilities (OSM)`: Color-coded icons for healthcare, emergency, and education points.

2. **Intelligence Drawer Integration**:
   - Dedicated **Census** tab displaying settlement name, MDDS code, 2011 baseline population, households, sex ratio, and DCHB infrastructure amenities (tap water, primary school, road connection).
   - Dedicated **Facility** tab displaying OSM ID, facility name, fclass, functional category, and coordinates.
   - Contextual notices explaining data age (Census 2011) and crowdsource origin (OSM).

3. **Null-Safe Formatting & Non-Fabrication**:
   - Integrated centralized formatting helpers (`formatNumber`, `formatPercent`, `formatDistance`, `formatArea`, `formatPopulation`, `formatScore`).
   - Missing data renders as `"—"` or `"Unavailable"`; zero is never fabricated for missing values.

---

### 6. Verification and Test Results

- **`phase9_geo_enrichment.test.ts`**: 7/7 tests passing (API contracts, geometry validity, headers, Census linking).
- **Backend Test Suite (`test:all`)**: 11/11 test suites passing across Foundation, DB, Pipeline, Enrichment, AI Risk, Model Validation, GIS, Capacity Assessment, Transit Optimization, Phase 9 Decisions, and Phase 9 Geo Enrichment.
- **Frontend Production Build**: Zero TypeScript errors; Vite build bundle succeeded.
