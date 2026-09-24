-- ============================================================
-- VISTHAAPAN Migration 009: District Population, Demographics & Healthcare Enrichment
-- Authoritative reference: Phase 4.5 Specifications
-- ============================================================

-- 1. CANONICAL DISTRICT MASTER
CREATE TABLE IF NOT EXISTS canonical_districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code VARCHAR(20) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    state_census2011_code VARCHAR(10),
    district_code VARCHAR(20) UNIQUE NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    district_census2011_code VARCHAR(10),
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DISTRICT IDENTITY CROSS-DATASET MAPPINGS (Audit ledger of matches & aliases)
CREATE TABLE IF NOT EXISTS district_identity_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_dataset VARCHAR(100) NOT NULL, -- NDEM, CENSUS_2011, HOSPITAL_DIRECTORY
    source_state VARCHAR(100) NOT NULL,
    source_district VARCHAR(100) NOT NULL,
    canonical_district_id UUID REFERENCES canonical_districts(id) ON DELETE CASCADE,
    mapping_status VARCHAR(50) NOT NULL, -- EXACT, NORMALIZED_EXACT, CONTROLLED_ALIAS, UNMATCHED, AMBIGUOUS
    mapping_method VARCHAR(100) NOT NULL, -- CODE_MATCH, EXACT_NAME, NORMALIZED_NAME, ALIAS_LOOKUP, UNRESOLVED
    confidence NUMERIC(4,3) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dim_source_key UNIQUE (source_dataset, source_state, source_district)
);

-- 3. DISTRICT DEMOGRAPHICS (Census 2011 Baseline)
CREATE TABLE IF NOT EXISTS district_demographics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_district_id UUID NOT NULL REFERENCES canonical_districts(id) ON DELETE CASCADE,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    data_reference_year INTEGER NOT NULL DEFAULT 2011,
    population_total BIGINT NOT NULL CHECK (population_total >= 0),
    population_male BIGINT NOT NULL CHECK (population_male >= 0),
    population_female BIGINT NOT NULL CHECK (population_female >= 0),
    population_child_0_6 BIGINT CHECK (population_child_0_6 IS NULL OR population_child_0_6 >= 0),
    population_sc BIGINT CHECK (population_sc IS NULL OR population_sc >= 0),
    population_st BIGINT CHECK (population_st IS NULL OR population_st >= 0),
    population_literate BIGINT CHECK (population_literate IS NULL OR population_literate >= 0),
    population_worker BIGINT CHECK (population_worker IS NULL OR population_worker >= 0),
    population_main_worker BIGINT CHECK (population_main_worker IS NULL OR population_main_worker >= 0),
    population_marginal_worker BIGINT CHECK (population_marginal_worker IS NULL OR population_marginal_worker >= 0),
    households_count BIGINT CHECK (households_count IS NULL OR households_count >= 0),
    female_population_share NUMERIC(5,4) CHECK (female_population_share IS NULL OR (female_population_share >= 0.0 AND female_population_share <= 1.0)),
    child_population_share NUMERIC(5,4) CHECK (child_population_share IS NULL OR (child_population_share >= 0.0 AND child_population_share <= 1.0)),
    sc_population_share NUMERIC(5,4) CHECK (sc_population_share IS NULL OR (sc_population_share >= 0.0 AND sc_population_share <= 1.0)),
    st_population_share NUMERIC(5,4) CHECK (st_population_share IS NULL OR (st_population_share >= 0.0 AND st_population_share <= 1.0)),
    literacy_rate NUMERIC(5,4) CHECK (literacy_rate IS NULL OR (literacy_rate >= 0.0 AND literacy_rate <= 1.0)),
    worker_participation_rate NUMERIC(5,4) CHECK (worker_participation_rate IS NULL OR (worker_participation_rate >= 0.0 AND worker_participation_rate <= 1.0)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_district_demographics_cd UNIQUE (canonical_district_id, dataset_version_id)
);

-- 4. HOSPITALS (Individual facility directory with spatial points & bed corruption flags)
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_district_id UUID REFERENCES canonical_districts(id) ON DELETE SET NULL,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    source_sr_no INTEGER,
    hospital_name VARCHAR(255) NOT NULL,
    state_raw VARCHAR(100) NOT NULL,
    district_raw VARCHAR(100) NOT NULL,
    hospital_category VARCHAR(100),
    hospital_care_type VARCHAR(100),
    raw_location_coordinates VARCHAR(100),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    geometry geometry(Point, 4326),
    has_valid_coordinates BOOLEAN NOT NULL DEFAULT FALSE,
    has_emergency_services BOOLEAN NOT NULL DEFAULT FALSE,
    has_ambulance BOOLEAN NOT NULL DEFAULT FALSE,
    raw_bed_count VARCHAR(50),
    is_bed_count_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    pincode VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DISTRICT HEALTHCARE PROFILES (Aggregated hospital infrastructure per canonical district)
CREATE TABLE IF NOT EXISTS district_healthcare_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_district_id UUID NOT NULL REFERENCES canonical_districts(id) ON DELETE CASCADE,
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    hospital_count INTEGER NOT NULL DEFAULT 0 CHECK (hospital_count >= 0),
    geocoded_hospital_count INTEGER NOT NULL DEFAULT 0 CHECK (geocoded_hospital_count >= 0),
    government_hospital_count INTEGER NOT NULL DEFAULT 0 CHECK (government_hospital_count >= 0),
    private_hospital_count INTEGER NOT NULL DEFAULT 0 CHECK (private_hospital_count >= 0),
    emergency_service_hospital_count INTEGER NOT NULL DEFAULT 0 CHECK (emergency_service_hospital_count >= 0),
    ambulance_available_hospital_count INTEGER NOT NULL DEFAULT 0 CHECK (ambulance_available_hospital_count >= 0),
    geocoded_hospital_share NUMERIC(5,4) CHECK (geocoded_hospital_share IS NULL OR (geocoded_hospital_share >= 0.0 AND geocoded_hospital_share <= 1.0)),
    emergency_hospital_share NUMERIC(5,4) CHECK (emergency_hospital_share IS NULL OR (emergency_hospital_share >= 0.0 AND emergency_hospital_share <= 1.0)),
    ambulance_hospital_share NUMERIC(5,4) CHECK (ambulance_hospital_share IS NULL OR (ambulance_hospital_share >= 0.0 AND ambulance_hospital_share <= 1.0)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_district_healthcare_cd UNIQUE (canonical_district_id, dataset_version_id)
);

-- 6. UNIFIED DISTRICT INTELLIGENCE VIEW (Multi-domain Feature Matrix for Phase 5 AI)
DROP VIEW IF EXISTS view_district_intelligence;
CREATE OR REPLACE VIEW view_district_intelligence AS
WITH ndem_agg AS (
    SELECT
        dim.canonical_district_id,
        MIN(dhp.id::text)::uuid AS dhp_id,
        MIN(dhp.dataset_version_id::text)::uuid AS dataset_version_id,
        SUM(dhp.total_reports_count)::int AS hazard_total_reports,
        SUM(dhp.surveillance_reports_count)::int AS hazard_surveillance_reports,
        SUM(dhp.active_event_count)::int AS hazard_active_events,
        MAX(dhp.hazard_diversity_count)::int AS hazard_diversity_count,
        (MODE() WITHIN GROUP (ORDER BY dhp.primary_hazard_type))::varchar(100) AS primary_hazard_type,
        SUM(dhp.events_last_30_days)::int AS events_last_30_days,
        SUM(dhp.events_last_90_days)::int AS events_last_90_days,
        SUM(dhp.events_last_365_days)::int AS events_last_365_days,
        SUM(dhp.historical_event_count)::int AS historical_event_count,
        SUM(dhp.villages_affected_total)::bigint AS hazard_villages_affected_total,
        SUM(dhp.population_affected_total)::bigint AS hazard_population_affected_total,
        SUM(dhp.deaths_total)::int AS hazard_deaths_total,
        SUM(dhp.injured_total)::int AS hazard_injured_total,
        SUM(dhp.houses_damaged_total)::int AS hazard_houses_damaged_total,
        jsonb_agg(dhp.hazard_breakdown) AS hazard_breakdown
    FROM district_identity_mappings dim
    JOIN district_hazard_profiles dhp
      ON dhp.state_name = dim.source_state
     AND dhp.district_name = dim.source_district
    WHERE dim.source_dataset = 'NDEM'
      AND dim.canonical_district_id IS NOT NULL
    GROUP BY dim.canonical_district_id
)
SELECT
    cd.id AS canonical_district_id,
    cd.district_code,
    cd.district_name,
    cd.state_code,
    cd.state_name,
    cd.district_census2011_code,
    cd.state_census2011_code,
    -- Hazard Features (NDEM Ground Truth)
    na.hazard_total_reports,
    na.hazard_surveillance_reports,
    na.hazard_active_events,
    na.hazard_diversity_count,
    na.primary_hazard_type,
    na.events_last_30_days,
    na.events_last_90_days,
    na.events_last_365_days,
    na.historical_event_count,
    na.hazard_villages_affected_total,
    na.hazard_population_affected_total,
    na.hazard_deaths_total,
    na.hazard_injured_total,
    na.hazard_houses_damaged_total,
    na.hazard_breakdown,
    -- Population & Demographics (Census 2011 Baseline)
    dd.data_reference_year AS census_reference_year,
    dd.population_total AS census_population_total,
    dd.population_male AS census_population_male,
    dd.population_female AS census_population_female,
    dd.population_child_0_6 AS census_population_child_0_6,
    dd.population_sc AS census_population_sc,
    dd.population_st AS census_population_st,
    dd.female_population_share AS census_female_share,
    dd.child_population_share AS census_child_share,
    dd.sc_population_share AS census_sc_share,
    dd.st_population_share AS census_st_share,
    dd.literacy_rate AS census_literacy_rate,
    dd.worker_participation_rate AS census_worker_rate,
    dd.households_count AS census_households_count,
    -- Healthcare & Lifeline Infrastructure
    dhc.hospital_count,
    dhc.geocoded_hospital_count,
    dhc.government_hospital_count,
    dhc.private_hospital_count,
    dhc.emergency_service_hospital_count,
    dhc.ambulance_available_hospital_count,
    dhc.geocoded_hospital_share,
    dhc.emergency_hospital_share,
    dhc.ambulance_hospital_share,
    -- Provenance & Data Availability Flags
    (na.dhp_id IS NOT NULL) AS has_ndem_hazard_data,
    (dd.id IS NOT NULL) AS has_census_demographic_data,
    (dhc.id IS NOT NULL) AS has_healthcare_data,
    na.dataset_version_id AS hazard_dataset_version_id,
    dd.dataset_version_id AS census_dataset_version_id,
    dhc.dataset_version_id AS healthcare_dataset_version_id
FROM canonical_districts cd
LEFT JOIN ndem_agg na ON na.canonical_district_id = cd.id
LEFT JOIN district_demographics dd ON dd.canonical_district_id = cd.id
LEFT JOIN district_healthcare_profiles dhc ON dhc.canonical_district_id = cd.id;

-- 7. PERFORMANCE & SPATIAL INDEXES
CREATE INDEX IF NOT EXISTS idx_cd_state_district ON canonical_districts(state_name, district_name);
CREATE INDEX IF NOT EXISTS idx_cd_census_code ON canonical_districts(state_census2011_code, district_census2011_code);
CREATE INDEX IF NOT EXISTS idx_dim_source ON district_identity_mappings(source_dataset, source_state, source_district);
CREATE INDEX IF NOT EXISTS idx_dim_canonical ON district_identity_mappings(canonical_district_id);
CREATE INDEX IF NOT EXISTS idx_dd_canonical ON district_demographics(canonical_district_id);
CREATE INDEX IF NOT EXISTS idx_dhc_canonical ON district_healthcare_profiles(canonical_district_id);
CREATE INDEX IF NOT EXISTS idx_hosp_canonical ON hospitals(canonical_district_id);
CREATE INDEX IF NOT EXISTS idx_hosp_geometry ON hospitals USING GIST(geometry);
