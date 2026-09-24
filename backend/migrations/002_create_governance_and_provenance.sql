-- ============================================================
-- VISTHAAPAN Migration 002: Governance, Administration & Data Provenance
-- Authoritative reference: docs/VISTHAAPAN — Final Database Structure.docx (Entities 1, 2, 21-25, 27)
-- ============================================================

-- 1. GOVERNMENT OFFICER
CREATE TABLE IF NOT EXISTS government_officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    official_email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(20),
    department VARCHAR(150),
    designation VARCHAR(150),
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    office VARCHAR(200),
    employee_id VARCHAR(100) UNIQUE,
    account_status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 2. REGION (Administrative boundaries)
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL, -- state, district, block, taluka, cluster
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    parent_region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    boundary_geometry geometry(MultiPolygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. DATA SOURCE (Master provenance entity)
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_name VARCHAR(200) NOT NULL,
    source_organization VARCHAR(200) NOT NULL, -- NDEM, IMD, CWC, Bhuvan, Census, OSM
    source_type VARCHAR(100) NOT NULL,
    source_url TEXT,
    collection_date DATE,
    last_updated TIMESTAMPTZ,
    spatial_resolution VARCHAR(100),
    temporal_resolution VARCHAR(100),
    coverage VARCHAR(200),
    confidence NUMERIC(4,3) CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    description TEXT,
    license VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. DATASET
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    data_type VARCHAR(100) NOT NULL,
    format VARCHAR(50),
    frequency VARCHAR(100),
    coverage VARCHAR(200),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. DATASET VERSION (Reproducibility & snapshot tracking)
CREATE TABLE IF NOT EXISTS dataset_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
    version_number VARCHAR(50) NOT NULL,
    collection_date DATE,
    processed_at TIMESTAMPTZ,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    record_count INTEGER CHECK (record_count IS NULL OR record_count >= 0),
    quality_score NUMERIC(4,3) CHECK (quality_score IS NULL OR (quality_score >= 0.0 AND quality_score <= 1.0)),
    processing_status VARCHAR(50) NOT NULL DEFAULT 'completed',
    processing_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. DATA QUALITY (ISO 19157 alignment)
CREATE TABLE IF NOT EXISTS data_qualities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_version_id UUID NOT NULL REFERENCES dataset_versions(id) ON DELETE CASCADE,
    completeness_percent NUMERIC(5,2) CHECK (completeness_percent IS NULL OR (completeness_percent >= 0.0 AND completeness_percent <= 100.0)),
    spatial_coverage_percent NUMERIC(5,2) CHECK (spatial_coverage_percent IS NULL OR (spatial_coverage_percent >= 0.0 AND spatial_coverage_percent <= 100.0)),
    freshness_status VARCHAR(50),
    authoritative_sources TEXT[],
    derived_variables TEXT[],
    missing_fields TEXT[],
    invalid_records INTEGER DEFAULT 0 CHECK (invalid_records >= 0),
    duplicate_records INTEGER DEFAULT 0 CHECK (duplicate_records >= 0),
    overall_confidence NUMERIC(4,3) CHECK (overall_confidence IS NULL OR (overall_confidence >= 0.0 AND overall_confidence <= 1.0)),
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. DATA PROCESSING RUN (Engineering pipeline execution log)
CREATE TABLE IF NOT EXISTS data_processing_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
    process_type VARCHAR(100) NOT NULL, -- cleaning, filtering, normalization, geospatial-processing, integration, feature-engineering, validation
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'running', -- running, completed, failed
    records_input INTEGER CHECK (records_input IS NULL OR records_input >= 0),
    records_output INTEGER CHECK (records_output IS NULL OR records_output >= 0),
    records_rejected INTEGER CHECK (records_rejected IS NULL OR records_rejected >= 0),
    error_count INTEGER DEFAULT 0 CHECK (error_count >= 0),
    processing_log TEXT
);

-- 27. MODEL VERSION (AI model lineage & performance tracking)
CREATE TABLE IF NOT EXISTS model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(200) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    training_dataset_version VARCHAR(100),
    algorithm VARCHAR(100) NOT NULL,
    metrics JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
