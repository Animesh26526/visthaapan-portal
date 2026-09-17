-- ============================================================
-- VISTHAAPAN Migration 004: Risk, Priorities, Relocation Hubs & Road Networks
-- Authoritative reference: docs/VISTHAAPAN — Final Database Structure.docx (Entities 10, 11, 14-20, 26)
-- ============================================================

-- 10. RISK ASSESSMENT (AI/ML calibrated vulnerability & hazard output)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habitation_id UUID NOT NULL REFERENCES habitations(id) ON DELETE CASCADE,
    risk_score NUMERIC(4,3) NOT NULL CHECK (risk_score >= 0.0 AND risk_score <= 1.0),
    vulnerability_score NUMERIC(4,3) CHECK (vulnerability_score IS NULL OR (vulnerability_score >= 0.0 AND vulnerability_score <= 1.0)),
    hazard_exposure_score NUMERIC(4,3) CHECK (hazard_exposure_score IS NULL OR (hazard_exposure_score >= 0.0 AND hazard_exposure_score <= 1.0)),
    historical_impact_score NUMERIC(4,3) CHECK (historical_impact_score IS NULL OR (historical_impact_score >= 0.0 AND historical_impact_score <= 1.0)),
    infrastructure_risk_score NUMERIC(4,3) CHECK (infrastructure_risk_score IS NULL OR (infrastructure_risk_score >= 0.0 AND infrastructure_risk_score <= 1.0)),
    terrain_risk_score NUMERIC(4,3) CHECK (terrain_risk_score IS NULL OR (terrain_risk_score >= 0.0 AND terrain_risk_score <= 1.0)),
    urgency VARCHAR(50),
    model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,
    confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. RISK FEATURE CONTRIBUTION (SHAP explainability vectors)
CREATE TABLE IF NOT EXISTS risk_feature_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_assessment_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL,
    value NUMERIC(12,4),
    contribution NUMERIC(8,4) NOT NULL,
    direction VARCHAR(20) NOT NULL, -- positive, negative
    explanation TEXT
);

-- 14. RELOCATION PRIORITY (Policy weight & triage tiers)
CREATE TABLE IF NOT EXISTS relocation_priorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habitation_id UUID NOT NULL REFERENCES habitations(id) ON DELETE CASCADE,
    risk_score NUMERIC(4,3) NOT NULL CHECK (risk_score >= 0.0 AND risk_score <= 1.0),
    vulnerability_score NUMERIC(4,3) CHECK (vulnerability_score IS NULL OR (vulnerability_score >= 0.0 AND vulnerability_score <= 1.0)),
    priority_weight NUMERIC(5,4) NOT NULL CHECK (priority_weight >= 0.0 AND priority_weight <= 1.0),
    tier VARCHAR(50) NOT NULL, -- immediate, short-term, medium-term
    rank INTEGER,
    reasons TEXT[],
    confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. RELOCATION SITE (Candidate safe relocation destinations)
CREATE TABLE IF NOT EXISTS relocation_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- shelter, school, public-building, camp, open-area, other
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    address TEXT,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    geometry geometry(Point, 4326) NOT NULL,
    inside_red_zone BOOLEAN NOT NULL DEFAULT FALSE,
    land_availability NUMERIC(12,2),
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. SITE SUITABILITY ASSESSMENT (Multi-criteria suitability scoring)
CREATE TABLE IF NOT EXISTS site_suitability_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES relocation_sites(id) ON DELETE CASCADE,
    safety_score NUMERIC(4,3) CHECK (safety_score IS NULL OR (safety_score >= 0.0 AND safety_score <= 1.0)),
    accessibility_score NUMERIC(4,3) CHECK (accessibility_score IS NULL OR (accessibility_score >= 0.0 AND accessibility_score <= 1.0)),
    infrastructure_score NUMERIC(4,3) CHECK (infrastructure_score IS NULL OR (infrastructure_score >= 0.0 AND infrastructure_score <= 1.0)),
    healthcare_score NUMERIC(4,3) CHECK (healthcare_score IS NULL OR (healthcare_score >= 0.0 AND healthcare_score <= 1.0)),
    water_score NUMERIC(4,3) CHECK (water_score IS NULL OR (water_score >= 0.0 AND water_score <= 1.0)),
    sanitation_score NUMERIC(4,3) CHECK (sanitation_score IS NULL OR (sanitation_score >= 0.0 AND sanitation_score <= 1.0)),
    electricity_score NUMERIC(4,3) CHECK (electricity_score IS NULL OR (electricity_score >= 0.0 AND electricity_score <= 1.0)),
    shelter_score NUMERIC(4,3) CHECK (shelter_score IS NULL OR (shelter_score >= 0.0 AND shelter_score <= 1.0)),
    suitability_score NUMERIC(4,3) NOT NULL CHECK (suitability_score >= 0.0 AND suitability_score <= 1.0),
    confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    assessment_method VARCHAR(100),
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. SITE CAPACITY (Carrying capacity bottlenecks & occupancy)
CREATE TABLE IF NOT EXISTS site_capacities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES relocation_sites(id) ON DELETE CASCADE,
    physical_capacity INTEGER NOT NULL CHECK (physical_capacity >= 0),
    water_capacity INTEGER NOT NULL CHECK (water_capacity >= 0),
    shelter_capacity INTEGER NOT NULL CHECK (shelter_capacity >= 0),
    sanitation_capacity INTEGER NOT NULL CHECK (sanitation_capacity >= 0),
    healthcare_capacity INTEGER NOT NULL CHECK (healthcare_capacity >= 0),
    electricity_capacity INTEGER CHECK (electricity_capacity IS NULL OR electricity_capacity >= 0),
    access_capacity INTEGER CHECK (access_capacity IS NULL OR access_capacity >= 0),
    official_capacity INTEGER CHECK (official_capacity IS NULL OR official_capacity >= 0),
    estimated_capacity INTEGER CHECK (estimated_capacity IS NULL OR estimated_capacity >= 0),
    effective_capacity INTEGER NOT NULL CHECK (effective_capacity >= 0),
    current_occupancy INTEGER NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
    available_capacity INTEGER NOT NULL CHECK (available_capacity >= 0),
    utilization_percent NUMERIC(5,2) CHECK (utilization_percent IS NULL OR utilization_percent >= 0.0),
    bottleneck VARCHAR(100) NOT NULL, -- physical, water, shelter, sanitation, healthcare
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. ROAD (Physical transit network segments)
CREATE TABLE IF NOT EXISTS roads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    road_code VARCHAR(100),
    road_type VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, blocked, restricted, unknown
    accessibility VARCHAR(50),
    geometry geometry(MultiLineString, 4326) NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL
);

-- 19. CANDIDATE ROUTE (Transit connection: Habitation -> RelocationSite)
CREATE TABLE IF NOT EXISTS candidate_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habitation_id UUID NOT NULL REFERENCES habitations(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES relocation_sites(id) ON DELETE CASCADE,
    feasible BOOLEAN NOT NULL DEFAULT TRUE,
    distance_km NUMERIC(8,2) NOT NULL CHECK (distance_km >= 0.0),
    travel_time_minutes NUMERIC(8,2) CHECK (travel_time_minutes IS NULL OR travel_time_minutes >= 0.0),
    estimated_cost NUMERIC(12,2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0.0),
    road_accessibility VARCHAR(50),
    safety_constraint_satisfied BOOLEAN NOT NULL DEFAULT TRUE,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    route_geometry geometry(LineString, 4326),
    reason_if_infeasible TEXT,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. ROUTE <-> ROAD (Associative road segment sequence junction)
CREATE TABLE IF NOT EXISTS route_roads (
    route_id UUID NOT NULL REFERENCES candidate_routes(id) ON DELETE CASCADE,
    road_id UUID NOT NULL REFERENCES roads(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (route_id, road_id)
);

-- 26. EVIDENCE REFERENCE (Audit proof linking datasets to records)
CREATE TABLE IF NOT EXISTS evidence_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL, -- hazard-layer, historical-event, population, terrain, infrastructure, capacity
    entity_id UUID NOT NULL,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    evidence_type VARCHAR(100) NOT NULL,
    description TEXT,
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
