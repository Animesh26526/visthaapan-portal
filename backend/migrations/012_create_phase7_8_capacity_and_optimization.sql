-- ============================================================
-- VISTHAAPAN Migration 012: Phase 7 & Phase 8 Capacity, Bottlenecks & OR Allocation
-- Authoritative reference: Phase 7 & Phase 8 Master Implementation Specifications
-- ============================================================

-- 1. EXTEND SITE CAPACITIES FOR DETAILED BOTTLENECK ANALYSIS & HARD EXCLUSIONS
ALTER TABLE site_capacities
    ADD COLUMN IF NOT EXISTS nominal_capacity INTEGER,
    ADD COLUMN IF NOT EXISTS bottleneck_dimension VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bottleneck_value INTEGER,
    ADD COLUMN IF NOT EXISTS limiting_factor TEXT,
    ADD COLUMN IF NOT EXISTS capacity_status VARCHAR(50) NOT NULL DEFAULT 'ADEQUATE',
    ADD COLUMN IF NOT EXISTS data_origin VARCHAR(50) NOT NULL DEFAULT 'SIMULATED',
    ADD COLUMN IF NOT EXISTS confidence NUMERIC(4,3) DEFAULT 1.0 CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    ADD COLUMN IF NOT EXISTS uncertainty_flags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS hard_hazard_exclusion BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_sc_capacity_status ON site_capacities(capacity_status);
CREATE INDEX IF NOT EXISTS idx_sc_hard_hazard_exclusion ON site_capacities(hard_hazard_exclusion);

-- 2. CREATE RELOCATION DEMANDS TABLE (Planning unit demand nodes with provenance)
CREATE TABLE IF NOT EXISTS relocation_demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demand_node_id VARCHAR(100) UNIQUE NOT NULL,
    habitation_id UUID REFERENCES habitations(id) ON DELETE SET NULL,
    canonical_district_id UUID REFERENCES canonical_districts(id) ON DELETE SET NULL,
    node_name VARCHAR(200) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    total_population INTEGER NOT NULL CHECK (total_population >= 0),
    relocation_demand INTEGER NOT NULL CHECK (relocation_demand >= 0),
    priority_weight NUMERIC(5,4) NOT NULL CHECK (priority_weight >= 0.0 AND priority_weight <= 1.0),
    operational_tier VARCHAR(50) NOT NULL DEFAULT 'immediate', -- immediate, short-term, medium-term
    demand_derivation_method VARCHAR(100) NOT NULL, -- BENCHMARK_HABITATION, HAZARD_EXPOSURE_RATIO, SCENARIO_SURGE, CENSUS_EXTRAPOLATION
    data_origin VARCHAR(50) NOT NULL DEFAULT 'SIMULATED', -- REAL, DERIVED, SIMULATED
    population_source VARCHAR(100) NOT NULL DEFAULT 'BENCHMARK_CENSUS', -- CENSUS_2011, BENCHMARK_CENSUS, STATE_AVERAGE_ESTIMATE, UNAVAILABLE
    hazard_exposure_status VARCHAR(100),
    uncertainty_flags TEXT[] DEFAULT '{}',
    geometry geometry(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rd_demand_node_id ON relocation_demands(demand_node_id);
CREATE INDEX IF NOT EXISTS idx_rd_operational_tier ON relocation_demands(operational_tier);
CREATE INDEX IF NOT EXISTS idx_rd_priority_weight ON relocation_demands(priority_weight DESC);
CREATE INDEX IF NOT EXISTS idx_rd_geometry ON relocation_demands USING GIST(geometry);

-- 3. EXTEND ALLOCATION ITEMS TO SUPPORT BOTH HABITATIONS AND GENERIC DEMAND NODES
ALTER TABLE allocation_items
    ALTER COLUMN habitation_id DROP NOT NULL;

ALTER TABLE allocation_items
    DROP CONSTRAINT IF EXISTS allocation_items_site_id_fkey,
    ADD CONSTRAINT allocation_items_site_id_fkey FOREIGN KEY (site_id) REFERENCES relocation_sites(id) ON DELETE CASCADE;

ALTER TABLE allocation_items
    DROP CONSTRAINT IF EXISTS allocation_items_habitation_id_fkey,
    ADD CONSTRAINT allocation_items_habitation_id_fkey FOREIGN KEY (habitation_id) REFERENCES habitations(id) ON DELETE CASCADE;

ALTER TABLE allocation_items
    ADD COLUMN IF NOT EXISTS canonical_district_id UUID REFERENCES canonical_districts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS demand_node_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS data_origin VARCHAR(50) NOT NULL DEFAULT 'SIMULATED';

CREATE INDEX IF NOT EXISTS idx_ai_allocation_id ON allocation_items(allocation_id);
CREATE INDEX IF NOT EXISTS idx_ai_site_id ON allocation_items(site_id);
CREATE INDEX IF NOT EXISTS idx_ai_demand_node_id ON allocation_items(demand_node_id);

-- 4. EXTEND ALLOCATION RESULTS FOR SOLVER AUDITABILITY & RUN PROVENANCE
ALTER TABLE allocation_results
    ADD COLUMN IF NOT EXISTS data_origin VARCHAR(50) NOT NULL DEFAULT 'SIMULATED',
    ADD COLUMN IF NOT EXISTS uncertainty_flags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS operational_tier_filter VARCHAR(50) DEFAULT 'ALL',
    ADD COLUMN IF NOT EXISTS site_utilization JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS explanation_summary TEXT;

CREATE INDEX IF NOT EXISTS idx_ar_generated_at ON allocation_results(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ar_status ON allocation_results(status);

-- 5. EXTEND ALLOCATION EXPLANATIONS & FACTORS
ALTER TABLE allocation_explanations
    ADD COLUMN IF NOT EXISTS demand_node_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS canonical_district_id UUID REFERENCES canonical_districts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS data_origin VARCHAR(50) NOT NULL DEFAULT 'SIMULATED';

ALTER TABLE allocation_explanation_factors
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'OPERATIONAL';

CREATE INDEX IF NOT EXISTS idx_aef_factor ON allocation_explanation_factors(factor);

-- 6. VERIFICATION ASSERTION
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'relocation_demands'
    ) THEN
        RAISE EXCEPTION 'CRITICAL: Migration 012 failed to create relocation_demands table.';
    END IF;
END $$;
