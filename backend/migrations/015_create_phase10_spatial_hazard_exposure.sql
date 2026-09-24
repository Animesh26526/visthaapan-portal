-- ============================================================
-- VISTHAAPAN Migration 015: Phase 10 Spatial Hazard Intelligence
-- Habitation-Level Exposure Engine, Hazard Evidence Features, & Spatial Lineage
-- ============================================================

-- 1. HAZARD EVIDENCE FEATURES (Authoritative Observed, Inventory, Susceptibility & Benchmark Features)
CREATE TABLE IF NOT EXISTS hazard_evidence_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazard_layer_id UUID REFERENCES hazard_layers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    hazard_type VARCHAR(50) NOT NULL, -- 'landslide', 'flash_flood', 'subsidence', 'earthquake', 'riverine_corridor'
    semantic_type VARCHAR(50) NOT NULL CHECK (
        semantic_type IN (
            'OBSERVED_EVENT',
            'INVENTORY',
            'SUSCEPTIBILITY',
            'HAZARD_MAP',
            'HISTORICAL_EVENT',
            'DERIVED_SPATIAL_BUFFER',
            'SIMULATED_DEMONSTRATION'
        )
    ),
    data_origin VARCHAR(50) NOT NULL CHECK (
        data_origin IN ('REAL', 'DERIVED', 'SIMULATED', 'QUARANTINED', 'UNKNOWN')
    ),
    source VARCHAR(150) NOT NULL,
    authority VARCHAR(150) NOT NULL,
    dataset_name VARCHAR(150),
    dataset_version VARCHAR(50),
    reference_date DATE,
    severity VARCHAR(50) NOT NULL DEFAULT 'UNSPECIFIED' CHECK (
        severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL', 'UNSPECIFIED')
    ),
    confidence NUMERIC(3, 2) DEFAULT 0.85 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    methodology TEXT,
    provenance VARCHAR(255) NOT NULL,
    buffer_meters NUMERIC(10, 2) DEFAULT 0.0 CHECK (buffer_meters >= 0.0),
    geometry GEOMETRY(Geometry, 4326) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hef_geom ON hazard_evidence_features USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_hef_hazard_type ON hazard_evidence_features(hazard_type);
CREATE INDEX IF NOT EXISTS idx_hef_semantic_type ON hazard_evidence_features(semantic_type);
CREATE INDEX IF NOT EXISTS idx_hef_data_origin ON hazard_evidence_features(data_origin);

-- 2. SETTLEMENT HAZARD EXPOSURES (Metric Spatial Joins between Census Settlements & Hazard Evidence)
CREATE TABLE IF NOT EXISTS settlement_hazard_exposures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES census_settlements(id) ON DELETE CASCADE,
    hazard_feature_id UUID NOT NULL REFERENCES hazard_evidence_features(id) ON DELETE CASCADE,
    relationship VARCHAR(30) NOT NULL CHECK (
        relationship IN ('WITHIN', 'INTERSECTS', 'NEAR', 'OUTSIDE', 'UNKNOWN')
    ),
    distance_meters NUMERIC(10, 2), -- Computed via ST_Distance(geography)
    exposure_classification VARCHAR(50) NOT NULL CHECK (
        exposure_classification IN ('HARD_EXCLUSION', 'WARNING', 'INFORMATIONAL', 'UNKNOWN')
    ),
    interpretation TEXT NOT NULL,
    confidence NUMERIC(3, 2) DEFAULT 0.85,
    analysis_version VARCHAR(50) NOT NULL DEFAULT 'v1.0-phase10',
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_settlement_hazard_feature UNIQUE (settlement_id, hazard_feature_id)
);

CREATE INDEX IF NOT EXISTS idx_she_settlement_id ON settlement_hazard_exposures(settlement_id);
CREATE INDEX IF NOT EXISTS idx_she_hazard_feature_id ON settlement_hazard_exposures(hazard_feature_id);
CREATE INDEX IF NOT EXISTS idx_she_relationship ON settlement_hazard_exposures(relationship);
CREATE INDEX IF NOT EXISTS idx_she_exposure_classification ON settlement_hazard_exposures(exposure_classification);

-- 3. SETTLEMENT TERRAIN FEATURES (Terrain status & attributes with DEM bounds verification)
CREATE TABLE IF NOT EXISTS settlement_terrain_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES census_settlements(id) ON DELETE CASCADE UNIQUE,
    elevation_meters NUMERIC(8, 2),
    slope_degrees NUMERIC(5, 2),
    aspect_degrees NUMERIC(5, 2),
    terrain_status VARCHAR(50) NOT NULL DEFAULT 'UNAVAILABLE' CHECK (
        terrain_status IN ('AVAILABLE', 'UNAVAILABLE', 'OUT_OF_BOUNDS')
    ),
    source VARCHAR(100),
    provenance VARCHAR(255) NOT NULL DEFAULT 'Terrain data unavailable: Study area out of Cartosat DEM bounds (Gujarat tiles excluded per policy)',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stf_settlement_id ON settlement_terrain_features(settlement_id);
CREATE INDEX IF NOT EXISTS idx_stf_terrain_status ON settlement_terrain_features(terrain_status);

-- 4. SETTLEMENT HISTORICAL DISASTER EVENTS (Spatially linked historical disaster records)
CREATE TABLE IF NOT EXISTS settlement_historical_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES census_settlements(id) ON DELETE CASCADE,
    disaster_event_id UUID REFERENCES historical_disaster_events(id) ON DELETE SET NULL,
    event_name VARCHAR(255) NOT NULL,
    disaster_type VARCHAR(100) NOT NULL,
    event_date DATE,
    spatial_precision VARCHAR(50) NOT NULL CHECK (
        spatial_precision IN ('POINT_COORDINATE', 'SETTLEMENT_MATCH', 'TEHSIL_MATCH', 'DISTRICT_LEVEL')
    ),
    distance_meters NUMERIC(10, 2),
    deaths_total INTEGER DEFAULT 0,
    houses_damaged_total INTEGER DEFAULT 0,
    source VARCHAR(150) NOT NULL,
    provenance VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shiev_settlement_id ON settlement_historical_events(settlement_id);
CREATE INDEX IF NOT EXISTS idx_shiev_disaster_type ON settlement_historical_events(disaster_type);
CREATE INDEX IF NOT EXISTS idx_shiev_spatial_precision ON settlement_historical_events(spatial_precision);

-- 5. EXTEND RED ZONES TERMINOLOGY
-- Ensure explanation clearly indicates GIS-derived hazard-based restricted area (DM Act 2005 Sec 30(2)(v))
UPDATE red_zones
SET reason = REPLACE(reason, 'statutory red zone', 'GIS-derived hazard-based restricted area')
WHERE reason ILIKE '%statutory red zone%';
