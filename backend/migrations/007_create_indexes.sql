-- ============================================================
-- VISTHAAPAN Migration 007: Spatial GiST & Relational Performance Indexes
-- Authoritative reference: docs/VISTHAAPAN Technical Implementation Plan.docx (Section 3: GIS)
-- ============================================================

-- 1. SPATIAL GIST INDEXES (Essential for PostGIS ST_Intersects, ST_DWithin, ST_Distance)
CREATE INDEX IF NOT EXISTS idx_regions_boundary_geom
    ON regions USING GIST (boundary_geometry);

CREATE INDEX IF NOT EXISTS idx_habitations_geom
    ON habitations USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_hazard_layers_geom
    ON hazard_layers USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_historical_disaster_geom
    ON historical_disaster_events USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_red_zones_geom
    ON red_zones USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_relocation_sites_geom
    ON relocation_sites USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_roads_geom
    ON roads USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_candidate_routes_geom
    ON candidate_routes USING GIST (route_geometry);

-- 2. RELATIONAL FOREIGN KEY & QUERY INDEXES
-- Habitation & Geography
CREATE INDEX IF NOT EXISTS idx_habitations_region_id
    ON habitations (region_id);

CREATE INDEX IF NOT EXISTS idx_habitations_status
    ON habitations (status);

CREATE INDEX IF NOT EXISTS idx_habitation_populations_habitation_id
    ON habitation_populations (habitation_id);

CREATE INDEX IF NOT EXISTS idx_habitation_infrastructures_habitation_id
    ON habitation_infrastructures (habitation_id);

CREATE INDEX IF NOT EXISTS idx_terrain_features_habitation_id
    ON terrain_features (habitation_id);

-- Hazard & Risk
CREATE INDEX IF NOT EXISTS idx_hazard_layers_type
    ON hazard_layers (hazard_type);

CREATE INDEX IF NOT EXISTS idx_habitation_disasters_habitation_id
    ON habitation_disasters (habitation_id);

CREATE INDEX IF NOT EXISTS idx_habitation_disasters_event_id
    ON habitation_disasters (disaster_event_id);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_habitation_id
    ON risk_assessments (habitation_id);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_assessed_at
    ON risk_assessments (assessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_feature_contrib_assessment_id
    ON risk_feature_contributions (risk_assessment_id);

CREATE INDEX IF NOT EXISTS idx_relocation_priorities_habitation_id
    ON relocation_priorities (habitation_id);

CREATE INDEX IF NOT EXISTS idx_relocation_priorities_tier
    ON relocation_priorities (tier);

-- Relocation Sites & Capacities
CREATE INDEX IF NOT EXISTS idx_relocation_sites_region_id
    ON relocation_sites (region_id);

CREATE INDEX IF NOT EXISTS idx_site_suitability_site_id
    ON site_suitability_assessments (site_id);

CREATE INDEX IF NOT EXISTS idx_site_capacities_site_id
    ON site_capacities (site_id);

-- Transit & Routes
CREATE INDEX IF NOT EXISTS idx_roads_status
    ON roads (status);

CREATE INDEX IF NOT EXISTS idx_candidate_routes_habitation_id
    ON candidate_routes (habitation_id);

CREATE INDEX IF NOT EXISTS idx_candidate_routes_site_id
    ON candidate_routes (site_id);

CREATE INDEX IF NOT EXISTS idx_candidate_routes_feasibility
    ON candidate_routes (feasible, blocked);

-- Provenance & Metadata
CREATE INDEX IF NOT EXISTS idx_datasets_source_id
    ON datasets (source_id);

CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id
    ON dataset_versions (dataset_id);

CREATE INDEX IF NOT EXISTS idx_data_qualities_dataset_version_id
    ON data_qualities (dataset_version_id);

CREATE INDEX IF NOT EXISTS idx_data_proc_runs_dataset_version_id
    ON data_processing_runs (dataset_version_id);

CREATE INDEX IF NOT EXISTS idx_evidence_references_entity
    ON evidence_references (entity_type, entity_id);

-- Optimization & Scenarios
CREATE INDEX IF NOT EXISTS idx_allocation_items_allocation_id
    ON allocation_items (allocation_id);

CREATE INDEX IF NOT EXISTS idx_allocation_items_habitation_site
    ON allocation_items (habitation_id, site_id);

CREATE INDEX IF NOT EXISTS idx_constraint_results_allocation_id
    ON constraint_results (allocation_id);

CREATE INDEX IF NOT EXISTS idx_allocation_explanations_allocation_id
    ON allocation_explanations (allocation_id);

CREATE INDEX IF NOT EXISTS idx_scenarios_status
    ON scenarios (status);

CREATE INDEX IF NOT EXISTS idx_scenario_changes_scenario_id
    ON scenario_changes (scenario_id);

CREATE INDEX IF NOT EXISTS idx_scenario_results_scenario_id
    ON scenario_results (scenario_id);

CREATE INDEX IF NOT EXISTS idx_scenario_comparisons_scenario_id
    ON scenario_comparisons (scenario_id);

-- Execution & Audit
CREATE INDEX IF NOT EXISTS idx_operational_events_occurred_at
    ON operational_events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_relocation_plans_allocation_id
    ON relocation_plans (allocation_id);

CREATE INDEX IF NOT EXISTS idx_relocation_plans_status
    ON relocation_plans (status);

CREATE INDEX IF NOT EXISTS idx_relocation_plan_items_plan_id
    ON relocation_plan_items (plan_id);

CREATE INDEX IF NOT EXISTS idx_officer_decisions_officer_id
    ON officer_decisions (officer_id);

CREATE INDEX IF NOT EXISTS idx_decision_history_officer_id
    ON decision_history (officer_id);

CREATE INDEX IF NOT EXISTS idx_decision_history_timestamp
    ON decision_history (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_update_logs_triggered_at
    ON system_update_logs (triggered_at DESC);
