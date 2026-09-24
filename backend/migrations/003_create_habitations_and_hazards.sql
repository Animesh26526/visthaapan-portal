-- ============================================================
-- VISTHAAPAN Migration 003: Habitations, Exposure, Hazards & Red Zones
-- Authoritative reference: docs/VISTHAAPAN — Final Database Structure.docx (Entities 3-9, 12, 13)
-- ============================================================

-- 3. HABITATION (Core census & location entity)
CREATE TABLE IF NOT EXISTS habitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    block VARCHAR(100),
    taluka VARCHAR(100),
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    geometry geometry(Point, 4326) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'monitored',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. POPULATION / VULNERABILITY (Demographic breakdown & versioned estimates)
CREATE TABLE IF NOT EXISTS habitation_populations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habitation_id UUID NOT NULL REFERENCES habitations(id) ON DELETE CASCADE,
    population INTEGER NOT NULL CHECK (population >= 0),
    households INTEGER CHECK (households IS NULL OR households >= 0),
    population_density NUMERIC(10,2) CHECK (population_density IS NULL OR population_density >= 0.0),
    elderly_population INTEGER DEFAULT 0 CHECK (elderly_population >= 0),
    children_population INTEGER DEFAULT 0 CHECK (children_population >= 0),
    disabled_population INTEGER DEFAULT 0 CHECK (disabled_population >= 0),
    other_vulnerable_population INTEGER DEFAULT 0 CHECK (other_vulnerable_population >= 0),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. HABITATION INFRASTRUCTURE (Basic amenities & lifeline exposure)
CREATE TABLE IF NOT EXISTS habitation_infrastructures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habitation_id UUID NOT NULL REFERENCES habitations(id) ON DELETE CASCADE,
    healthcare_access VARCHAR(50),
    water_availability VARCHAR(50),
    road_accessibility VARCHAR(50),
    electricity_availability VARCHAR(50),
    sanitation_access VARCHAR(50),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TERRAIN FEATURES (Topography & geomorphic exposure)
CREATE TABLE IF NOT EXISTS terrain_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habitation_id UUID NOT NULL REFERENCES habitations(id) ON DELETE CASCADE,
    elevation NUMERIC(8,2), -- meters above sea level
    slope NUMERIC(6,2),     -- degrees
    drainage VARCHAR(100),
    river_distance NUMERIC(10,2), -- meters
    coast_distance NUMERIC(10,2), -- meters
    terrain_risk_factors JSONB,
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. HAZARD LAYER (Spatial active hazards: flood, landslide, subsidence, etc.)
CREATE TABLE IF NOT EXISTS hazard_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    hazard_type VARCHAR(100) NOT NULL, -- flood, landslide, cloudburst, coastal, earthquake, lightning, multi-hazard
    severity VARCHAR(50) NOT NULL,
    intensity NUMERIC(6,2),
    probability NUMERIC(4,3) CHECK (probability IS NULL OR (probability >= 0.0 AND probability <= 1.0)),
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    geometry geometry(Geometry, 4326) NOT NULL,
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. HISTORICAL DISASTER EVENT (Past events for frequency & impact training)
CREATE TABLE IF NOT EXISTS historical_disaster_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    severity VARCHAR(50),
    affected_population INTEGER CHECK (affected_population IS NULL OR affected_population >= 0),
    affected_area NUMERIC(12,2),
    description TEXT,
    source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    geometry geometry(Geometry, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. HABITATION-DISASTER LINK (Multi-habitation disaster impact junction)
CREATE TABLE IF NOT EXISTS habitation_disasters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habitation_id UUID NOT NULL REFERENCES habitations(id) ON DELETE CASCADE,
    disaster_event_id UUID NOT NULL REFERENCES historical_disaster_events(id) ON DELETE CASCADE,
    impact_level VARCHAR(50),
    affected_population INTEGER CHECK (affected_population IS NULL OR affected_population >= 0),
    damage_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_habitation_disaster UNIQUE (habitation_id, disaster_event_id)
);

-- 12. RED ZONE (Spatial zones unsuitable for permanent habitation)
CREATE TABLE IF NOT EXISTS red_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    reason TEXT,
    risk_threshold NUMERIC(4,3) CHECK (risk_threshold IS NULL OR (risk_threshold >= 0.0 AND risk_threshold <= 1.0)),
    confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    geometry geometry(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. RED ZONE <-> HAZARD LAYER (Associative junction)
CREATE TABLE IF NOT EXISTS red_zone_hazards (
    red_zone_id UUID NOT NULL REFERENCES red_zones(id) ON DELETE CASCADE,
    hazard_layer_id UUID NOT NULL REFERENCES hazard_layers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (red_zone_id, hazard_layer_id)
);
