-- ============================================================
-- VISTHAAPAN Migration 008: Real Ingestion & District Hazard Intelligence
-- Authoritative reference: Phase 4 Requirements (Granularity: STATE -> DISTRICT -> HAZARD)
-- ============================================================

-- 1. DISTRICT DISASTER EVENTS (Normalized event-level layer from government reports)
CREATE TABLE IF NOT EXISTS district_disaster_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    source_row_index INTEGER NOT NULL,
    event_date DATE NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    raw_disaster_name VARCHAR(255) NOT NULL,
    normalized_hazard_type VARCHAR(100) NOT NULL,
    normalization_confidence NUMERIC(4,3) NOT NULL CHECK (normalization_confidence >= 0.0 AND normalization_confidence <= 1.0),
    normalization_rule VARCHAR(255) NOT NULL,
    is_surveillance_record BOOLEAN NOT NULL DEFAULT FALSE,
    villages_affected_count INTEGER CHECK (villages_affected_count IS NULL OR villages_affected_count >= 0),
    population_affected BIGINT CHECK (population_affected IS NULL OR population_affected >= 0),
    deaths_male INTEGER CHECK (deaths_male IS NULL OR deaths_male >= 0),
    deaths_female INTEGER CHECK (deaths_female IS NULL OR deaths_female >= 0),
    deaths_total INTEGER CHECK (deaths_total IS NULL OR deaths_total >= 0),
    injured INTEGER CHECK (injured IS NULL OR injured >= 0),
    missing INTEGER CHECK (missing IS NULL OR missing >= 0),
    animal_deaths_big INTEGER CHECK (animal_deaths_big IS NULL OR animal_deaths_big >= 0),
    animal_deaths_small INTEGER CHECK (animal_deaths_small IS NULL OR animal_deaths_small >= 0),
    crop_area_agri_ha NUMERIC(12,2) CHECK (crop_area_agri_ha IS NULL OR crop_area_agri_ha >= 0.0),
    crop_area_horti_ha NUMERIC(12,2) CHECK (crop_area_horti_ha IS NULL OR crop_area_horti_ha >= 0.0),
    house_damaged_fully_pakka INTEGER CHECK (house_damaged_fully_pakka IS NULL OR house_damaged_fully_pakka >= 0),
    house_damaged_fully_kacchha INTEGER CHECK (house_damaged_fully_kacchha IS NULL OR house_damaged_fully_kacchha >= 0),
    house_damaged_partially_pakka INTEGER CHECK (house_damaged_partially_pakka IS NULL OR house_damaged_partially_pakka >= 0),
    house_damaged_partially_kacchha INTEGER CHECK (house_damaged_partially_kacchha IS NULL OR house_damaged_partially_kacchha >= 0),
    persons_evacuated INTEGER CHECK (persons_evacuated IS NULL OR persons_evacuated >= 0),
    relief_camps_in_operation INTEGER CHECK (relief_camps_in_operation IS NULL OR relief_camps_in_operation >= 0),
    people_in_relief_camps INTEGER CHECK (people_in_relief_camps IS NULL OR people_in_relief_camps >= 0),
    infrastructure_affected_count INTEGER CHECK (infrastructure_affected_count IS NULL OR infrastructure_affected_count >= 0),
    geometry geometry(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_district_disaster_event UNIQUE (dataset_version_id, event_date, state_name, district_name, raw_disaster_name, source_row_index)
);

-- 2. DISTRICT HAZARD PROFILES (Derived district-level intelligence & features for Phase 5 AI)
CREATE TABLE IF NOT EXISTS district_hazard_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    state_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    total_reports_count INTEGER NOT NULL DEFAULT 0 CHECK (total_reports_count >= 0),
    surveillance_reports_count INTEGER NOT NULL DEFAULT 0 CHECK (surveillance_reports_count >= 0),
    active_event_count INTEGER NOT NULL DEFAULT 0 CHECK (active_event_count >= 0),
    hazard_diversity_count INTEGER NOT NULL DEFAULT 0 CHECK (hazard_diversity_count >= 0),
    primary_hazard_type VARCHAR(100),
    villages_affected_total INTEGER NOT NULL DEFAULT 0 CHECK (villages_affected_total >= 0),
    population_affected_total BIGINT NOT NULL DEFAULT 0 CHECK (population_affected_total >= 0),
    deaths_total INTEGER NOT NULL DEFAULT 0 CHECK (deaths_total >= 0),
    injured_total INTEGER NOT NULL DEFAULT 0 CHECK (injured_total >= 0),
    missing_total INTEGER NOT NULL DEFAULT 0 CHECK (missing_total >= 0),
    houses_damaged_total INTEGER NOT NULL DEFAULT 0 CHECK (houses_damaged_total >= 0),
    crop_area_affected_ha_total NUMERIC(14,2) NOT NULL DEFAULT 0.0 CHECK (crop_area_affected_ha_total >= 0.0),
    persons_evacuated_total INTEGER NOT NULL DEFAULT 0 CHECK (persons_evacuated_total >= 0),
    relief_camps_total INTEGER NOT NULL DEFAULT 0 CHECK (relief_camps_total >= 0),
    people_in_relief_camps_total INTEGER NOT NULL DEFAULT 0 CHECK (people_in_relief_camps_total >= 0),
    infrastructure_affected_total INTEGER NOT NULL DEFAULT 0 CHECK (infrastructure_affected_total >= 0),
    events_last_30_days INTEGER NOT NULL DEFAULT 0 CHECK (events_last_30_days >= 0),
    events_last_90_days INTEGER NOT NULL DEFAULT 0 CHECK (events_last_90_days >= 0),
    events_last_365_days INTEGER NOT NULL DEFAULT 0 CHECK (events_last_365_days >= 0),
    historical_event_count INTEGER NOT NULL DEFAULT 0 CHECK (historical_event_count >= 0),
    hazard_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    observation_start_date DATE NOT NULL,
    observation_end_date DATE NOT NULL,
    geometry geometry(Geometry, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_district_hazard_profile UNIQUE (dataset_version_id, state_name, district_name)
);

-- 3. INDEXES FOR HIGH-THROUGHPUT ANALYTICS & SPATIAL SEARCH
CREATE INDEX IF NOT EXISTS idx_dde_event_date ON district_disaster_events(event_date);
CREATE INDEX IF NOT EXISTS idx_dde_state_district ON district_disaster_events(state_name, district_name);
CREATE INDEX IF NOT EXISTS idx_dde_normalized_hazard ON district_disaster_events(normalized_hazard_type);
CREATE INDEX IF NOT EXISTS idx_dde_geometry ON district_disaster_events USING GIST(geometry);

CREATE INDEX IF NOT EXISTS idx_dhp_state_district ON district_hazard_profiles(state_name, district_name);
CREATE INDEX IF NOT EXISTS idx_dhp_active_events ON district_hazard_profiles(active_event_count);
CREATE INDEX IF NOT EXISTS idx_dhp_population_affected ON district_hazard_profiles(population_affected_total);
CREATE INDEX IF NOT EXISTS idx_dhp_geometry ON district_hazard_profiles USING GIST(geometry);
