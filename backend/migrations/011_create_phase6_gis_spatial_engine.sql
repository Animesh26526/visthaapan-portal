-- ============================================================
-- VISTHAAPAN Migration 011: Phase 6 GIS Spatial Engine Foundation
-- Authoritative reference: Phase 6 Master Specifications (6A, 6B, 6C, 6D)
-- ============================================================

-- 1. EXTEND CANONICAL DISTRICTS FOR SPATIAL ANCHORING
ALTER TABLE canonical_districts
    ADD COLUMN IF NOT EXISTS centroid_geometry geometry(Point, 4326),
    ADD COLUMN IF NOT EXISTS boundary_geometry geometry(MultiPolygon, 4326),
    ADD COLUMN IF NOT EXISTS centroid_provenance VARCHAR(100);

-- Spatial GiST indexes for canonical district geometries
CREATE INDEX IF NOT EXISTS idx_cd_centroid_geom
    ON canonical_districts USING GIST (centroid_geometry);

CREATE INDEX IF NOT EXISTS idx_cd_boundary_geom
    ON canonical_districts USING GIST (boundary_geometry);

-- 2. EXTEND HAZARD LAYERS FOR METRIC BUFFERING & PROVENANCE
ALTER TABLE hazard_layers
    ADD COLUMN IF NOT EXISTS buffer_radius_meters NUMERIC(10,2) DEFAULT 0.0 CHECK (buffer_radius_meters >= 0.0),
    ADD COLUMN IF NOT EXISTS data_origin VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_hl_hazard_type
    ON hazard_layers (hazard_type);

CREATE INDEX IF NOT EXISTS idx_hl_data_origin
    ON hazard_layers (data_origin);

-- 3. EXTEND RED ZONES FOR EXCLUSION TAXONOMY & PROVENANCE
ALTER TABLE red_zones
    ADD COLUMN IF NOT EXISTS exclusion_type VARCHAR(50) NOT NULL DEFAULT 'HARD_HAZARD',
    ADD COLUMN IF NOT EXISTS dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_rz_exclusion_type
    ON red_zones (exclusion_type);

-- 4. EXTEND SITE SUITABILITY ASSESSMENTS FOR MULTI-CRITERIA GIS TIERS
ALTER TABLE site_suitability_assessments
    ADD COLUMN IF NOT EXISTS suitability_tier VARCHAR(50) NOT NULL DEFAULT 'INSUFFICIENT_DATA',
    ADD COLUMN IF NOT EXISTS passed_criteria TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS unmet_criteria TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS unavailable_criteria TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS explainability_summary JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS nearest_hospital_distance_m NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS nearest_hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS nearest_road_distance_m NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS terrain_status VARCHAR(50) DEFAULT 'UNAVAILABLE';

CREATE INDEX IF NOT EXISTS idx_ssa_suitability_tier
    ON site_suitability_assessments (suitability_tier);

-- 5. EXTEND ROADS & CANDIDATE ROUTES FOR PROVENANCE
ALTER TABLE roads
    ADD COLUMN IF NOT EXISTS dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS data_origin VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE candidate_routes
    ADD COLUMN IF NOT EXISTS data_origin VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 6. VERIFICATION ASSERTION
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'canonical_districts' AND column_name = 'centroid_geometry'
    ) THEN
        RAISE EXCEPTION 'CRITICAL: Migration 011 failed to add centroid_geometry to canonical_districts.';
    END IF;
END $$;
