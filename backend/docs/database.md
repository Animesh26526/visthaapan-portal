# VISTHAAPAN Database Architecture & PostgreSQL/PostGIS Specification

This document provides the authoritative physical schema reference for the **VISTHAAPAN Portal** (Vulnerability Intelligence and Spatial Transit for Hazard Affected Population Allocation Network).

## 1. Engine & Stack Specifications

- **Database Engine**: PostgreSQL 16.4 (`postgis/postgis:16-3.4` Docker container)
- **Spatial Extension**: PostGIS 3.4.3 (GEOS 3.9.0, PROJ 7.2.1)
- **Spatial Reference System**: WGS84 (`EPSG:4326`)
- **Node.js Driver**: `pg` v8.13.1 (Connection Pool with transactional client checkout)
- **Migration Architecture**: Transactional, ordered, checksum-verified SQL migrations tracked in `schema_migrations`.

---

## 2. Logical to Physical Entity Mapping

The database translates the 42 logical domain entities specified in `docs/VISTHAAPAN — Final Database Structure.docx` into 43 normalized relational tables:

| # | Logical Entity | Physical Table | Geometry / Spatial Column | Primary Key | Key Foreign Keys & Constraints |
|---|---|---|---|---|---|
| 1 | `GovernmentOfficer` | `government_officers` | None | `id (UUID)` | `official_email` UNIQUE, `username` UNIQUE |
| 2 | `Region` | `regions` | `boundary_geometry (MultiPolygon, 4326)` | `id (UUID)` | `parent_region_id` -> `regions(id)` |
| 3 | `Habitation` | `habitations` | `geometry (Point, 4326)` | `id (UUID)` | `region_id` -> `regions(id)` |
| 4 | `HabitationPopulation` | `habitation_populations` | None | `id (UUID)` | `habitation_id` -> `habitations(id)`, `population >= 0` |
| 5 | `HabitationInfrastructure` | `habitation_infrastructures` | None | `id (UUID)` | `habitation_id` -> `habitations(id)` |
| 6 | `TerrainFeature` | `terrain_features` | None | `id (UUID)` | `habitation_id` -> `habitations(id)` |
| 7 | `HazardLayer` | `hazard_layers` | `geometry (Geometry, 4326)` | `id (UUID)` | `source_id` -> `data_sources(id)`, `probability` in `[0,1]` |
| 8 | `HistoricalDisasterEvent` | `historical_disaster_events` | `geometry (Geometry, 4326)` | `id (UUID)` | `source_id` -> `data_sources(id)` |
| 9 | `HabitationDisaster` | `habitation_disasters` | None | `id (UUID)` | Junction: `habitation_id` + `disaster_event_id` |
| 10 | `RiskAssessment` | `risk_assessments` | None | `id (UUID)` | `habitation_id` -> `habitations(id)`, `risk_score` in `[0,1]` |
| 11 | `RiskFeatureContribution` | `risk_feature_contributions` | None | `id (UUID)` | `risk_assessment_id` -> `risk_assessments(id)` (SHAP) |
| 12 | `RedZone` | `red_zones` | `geometry (MultiPolygon, 4326)` | `id (UUID)` | `risk_threshold` in `[0,1]` |
| 13 | `RedZoneHazard` | `red_zone_hazards` | None | Composite `(red_zone_id, hazard_layer_id)` | Associative junction |
| 14 | `RelocationPriority` | `relocation_priorities` | None | `id (UUID)` | `habitation_id` -> `habitations(id)`, `tier` check |
| 15 | `RelocationSite` | `relocation_sites` | `geometry (Point, 4326)` | `id (UUID)` | `region_id` -> `regions(id)`, `inside_red_zone` |
| 16 | `SiteSuitabilityAssessment` | `site_suitability_assessments` | None | `id (UUID)` | `site_id` -> `relocation_sites(id)`, scores in `[0,1]` |
| 17 | `SiteCapacity` | `site_capacities` | None | `id (UUID)` | `site_id` -> `relocation_sites(id)`, capacity checks >= 0 |
| 18 | `Road` | `roads` | `geometry (MultiLineString, 4326)` | `id (UUID)` | `status` IN (open, blocked, restricted, unknown) |
| 19 | `CandidateRoute` | `candidate_routes` | `route_geometry (LineString, 4326)` | `id (UUID)` | `habitation_id` + `site_id`, `distance_km >= 0` |
| 20 | `RouteRoad` | `route_roads` | None | Composite `(route_id, road_id)` | Route road sequence junction |
| 21 | `DataSource` | `data_sources` | None | `id (UUID)` | `confidence` in `[0,1]` |
| 22 | `Dataset` | `datasets` | None | `id (UUID)` | `source_id` -> `data_sources(id)` |
| 23 | `DatasetVersion` | `dataset_versions` | None | `id (UUID)` | `dataset_id` -> `datasets(id)` |
| 24 | `DataQuality` | `data_qualities` | None | `id (UUID)` | `dataset_version_id` -> `dataset_versions(id)` |
| 25 | `DataProcessingRun` | `data_processing_runs` | None | `id (UUID)` | `dataset_version_id` -> `dataset_versions(id)` |
| 26 | `EvidenceReference` | `evidence_references` | None | `id (UUID)` | Polymorphic `entity_type` + `entity_id` |
| 27 | `ModelVersion` | `model_versions` | None | `id (UUID)` | Algorithm and metrics tracking |
| 28 | `AllocationRequest` | `allocation_requests` | None | `id (UUID)` | `created_by` -> `government_officers(id)` |
| 29 | `AllocationResult` | `allocation_results` | None | `id (UUID)` | `status` IN (optimal, feasible, infeasible, failed) |
| 30 | `AllocationItem` | `allocation_items` | None | `id (UUID)` | `allocation_id`, `habitation_id`, `site_id` |
| 31 | `ConstraintResult` | `constraint_results` | None | `id (UUID)` | `allocation_id` -> `allocation_results(id)` |
| 32A | `AllocationExplanation` | `allocation_explanations` | None | `id (UUID)` | `allocation_id` -> `allocation_results(id)` |
| 32B | `AllocationExplanationFactor`| `allocation_explanation_factors`| None | `id (UUID)` | `explanation_id` -> `allocation_explanations(id)` |
| 33 | `Scenario` | `scenarios` | None | `id (UUID)` | `base_allocation_id`, `created_by` |
| 34 | `ScenarioChange` | `scenario_changes` | None | `id (UUID)` | `scenario_id` -> `scenarios(id)` |
| 35 | `ScenarioResult` | `scenario_results` | None | `id (UUID)` | `scenario_id` + `allocation_result_id` |
| 36 | `ScenarioComparison` | `scenario_comparisons` | None | `id (UUID)` | `scenario_id`, `baseline_allocation_id` |
| 37 | `OperationalEvent` | `operational_events` | None | `id (UUID)` | Physical/real-world telemetry state changes |
| 38 | `RelocationPlan` | `relocation_plans` | None | `id (UUID)` | Authoritative operational plan |
| 39 | `RelocationPlanItem` | `relocation_plan_items` | None | `id (UUID)` | Phased dispatch items (Immediate, Short, Medium) |
| 40 | `OfficerDecision` | `officer_decisions` | None | `id (UUID)` | Statutory review under DM Act 2005 |
| 41 | `DecisionHistory` | `decision_history` | None | `id (UUID)` | Immutable audit ledger & gazette export |
| 42 | `SystemUpdateLog` | `system_update_logs` | None | `id (UUID)` | Automation trigger & re-solve logging |

---

## 3. Spatial Indexes (GiST)

PostGIS spatial queries (`ST_Intersects`, `ST_DWithin`, `ST_Distance`) are accelerated via GiST indexes on:

1. `regions(boundary_geometry)`
2. `habitations(geometry)`
3. `hazard_layers(geometry)`
4. `historical_disaster_events(geometry)`
5. `red_zones(geometry)`
6. `relocation_sites(geometry)`
7. `roads(geometry)`
8. `candidate_routes(route_geometry)`

---

## 4. Local Development & Migration Commands

### Docker Compose
```bash
# Start PostgreSQL 16 + PostGIS 3.4
docker compose up -d

# Check container health
docker ps
```

### Migration Management
```bash
# Run pending migrations
npm run db:migrate

# Check migration status
npm run db:status

# Run full database & spatial integrity test suite
npm run db:test
```
