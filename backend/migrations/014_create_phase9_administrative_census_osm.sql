-- ============================================================
-- VISTHAAPAN Migration 014: Phase 9 Data Enrichment
-- Official Survey of India (SOI) Boundaries, Census 2011 Settlements & OpenStreetMap Infrastructure
-- ============================================================

-- 1. SURVEY OF INDIA STATE BOUNDARY
CREATE TABLE IF NOT EXISTS state_boundaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code VARCHAR(20) NOT NULL UNIQUE,
    state_name VARCHAR(100) NOT NULL,
    shape_length NUMERIC(18, 6),
    shape_area NUMERIC(18, 6),
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    provenance VARCHAR(100) NOT NULL DEFAULT 'Survey of India (Official)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sb_geometry ON state_boundaries USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_sb_state_code ON state_boundaries(state_code);

-- 2. SURVEY OF INDIA DISTRICT BOUNDARIES (13 Districts of Uttarakhand)
CREATE TABLE IF NOT EXISTS district_boundaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID REFERENCES state_boundaries(id) ON DELETE SET NULL,
    state_code VARCHAR(20) NOT NULL DEFAULT '05',
    state_name VARCHAR(100) NOT NULL DEFAULT 'UTTARAKHAND',
    district_code VARCHAR(20) NOT NULL UNIQUE, -- Official LGD / SOI Code (e.g. 057 for Chamoli)
    district_name VARCHAR(100) NOT NULL,
    shape_length NUMERIC(18, 6),
    shape_area NUMERIC(18, 6),
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    provenance VARCHAR(100) NOT NULL DEFAULT 'Survey of India (Official)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_db_geometry ON district_boundaries USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_db_district_code ON district_boundaries(district_code);
CREATE INDEX IF NOT EXISTS idx_db_district_name ON district_boundaries(district_name);

-- 3. SURVEY OF INDIA SUBDISTRICT / TEHSIL BOUNDARIES (111 Tehsils)
CREATE TABLE IF NOT EXISTS subdistrict_boundaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES district_boundaries(id) ON DELETE SET NULL,
    state_code VARCHAR(20) NOT NULL DEFAULT '05',
    district_code VARCHAR(20) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    subdistrict_code VARCHAR(20) NOT NULL, -- Official LGD / SOI Tehsil Code (e.g. 284 for Jyotirmath)
    subdistrict_name VARCHAR(100) NOT NULL,
    shape_length NUMERIC(18, 6),
    shape_area NUMERIC(18, 6),
    geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
    provenance VARCHAR(100) NOT NULL DEFAULT 'Survey of India (Official)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_district_subdistrict UNIQUE (district_code, subdistrict_code)
);

CREATE INDEX IF NOT EXISTS idx_sdb_geometry ON subdistrict_boundaries USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_sdb_subdistrict_code ON subdistrict_boundaries(subdistrict_code);
CREATE INDEX IF NOT EXISTS idx_sdb_district_code ON subdistrict_boundaries(district_code);
CREATE INDEX IF NOT EXISTS idx_sdb_subdistrict_name ON subdistrict_boundaries(subdistrict_name);

-- 4. CENSUS 2011 SETTLEMENTS (Official Town & Village Directories)
CREATE TABLE IF NOT EXISTS census_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_type VARCHAR(20) NOT NULL CHECK (settlement_type IN ('TOWN', 'VILLAGE')),
    settlement_code VARCHAR(50) NOT NULL UNIQUE, -- Official Census 2011 code
    settlement_name VARCHAR(200) NOT NULL,
    state_code VARCHAR(20) NOT NULL DEFAULT '05',
    district_code VARCHAR(20) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    subdistrict_code VARCHAR(20),
    subdistrict_name VARCHAR(100),
    cd_block_name VARCHAR(100),
    population_2011_baseline INTEGER,
    households_2011_baseline INTEGER,
    male_population_2011 INTEGER,
    female_population_2011 INTEGER,
    infrastructure_markers JSONB DEFAULT '{}',
    geometry GEOMETRY(Point, 4326),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    provenance VARCHAR(100) NOT NULL DEFAULT 'Census 2011 Baseline Population',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_geometry ON census_settlements USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_cs_settlement_code ON census_settlements(settlement_code);
CREATE INDEX IF NOT EXISTS idx_cs_district_code ON census_settlements(district_code);
CREATE INDEX IF NOT EXISTS idx_cs_subdistrict_code ON census_settlements(subdistrict_code);
CREATE INDEX IF NOT EXISTS idx_cs_settlement_type ON census_settlements(settlement_type);

-- 5. OPENSTREETMAP ROADS
CREATE TABLE IF NOT EXISTS osm_roads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    osm_id VARCHAR(50),
    name VARCHAR(200),
    ref VARCHAR(50),
    fclass VARCHAR(50) NOT NULL,
    oneway VARCHAR(10),
    maxspeed INTEGER,
    bridge VARCHAR(10),
    tunnel VARCHAR(10),
    geometry GEOMETRY(LineString, 4326) NOT NULL,
    provenance VARCHAR(100) NOT NULL DEFAULT 'Mapped Road (Not real-time passability verified)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_osm_roads_geom ON osm_roads USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_osm_roads_fclass ON osm_roads(fclass);
CREATE INDEX IF NOT EXISTS idx_osm_roads_ref ON osm_roads(ref);

-- 6. OPENSTREETMAP PLACES
CREATE TABLE IF NOT EXISTS osm_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    osm_id VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    fclass VARCHAR(50) NOT NULL,
    population INTEGER,
    geometry GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    provenance VARCHAR(100) NOT NULL DEFAULT 'OpenStreetMap Mapped Place',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_osm_places_geom ON osm_places USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_osm_places_fclass ON osm_places(fclass);

-- 7. OPENSTREETMAP FACILITIES (Healthcare, Education, Emergency, Governance)
CREATE TABLE IF NOT EXISTS osm_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    osm_id VARCHAR(50),
    name VARCHAR(200),
    fclass VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'healthcare', 'education', 'emergency', 'government', 'transport'
    geometry GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    provenance VARCHAR(100) NOT NULL DEFAULT 'OSM-mapped facility',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_osm_fac_geom ON osm_facilities USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_osm_fac_category ON osm_facilities(category);
CREATE INDEX IF NOT EXISTS idx_osm_fac_fclass ON osm_facilities(fclass);

-- 8. LINK HABITATIONS TO CENSUS SETTLEMENTS
ALTER TABLE habitations
    ADD COLUMN IF NOT EXISTS census_settlement_id UUID REFERENCES census_settlements(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS census_code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_habitations_census_code ON habitations(census_code);
CREATE INDEX IF NOT EXISTS idx_habitations_census_id ON habitations(census_settlement_id);
