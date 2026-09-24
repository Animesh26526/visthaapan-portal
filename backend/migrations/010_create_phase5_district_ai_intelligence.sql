-- ============================================================
-- VISTHAAPAN Migration 010: Phase 5 District-Level AI Intelligence & Lineage
-- Authoritative reference: Phase 5 Specifications & Docs Database Schema
-- ============================================================

-- 1. EXTEND RISK ASSESSMENTS FOR DISTRICT GRANULARITY
ALTER TABLE risk_assessments 
    ALTER COLUMN habitation_id DROP NOT NULL;

ALTER TABLE risk_assessments 
    ADD COLUMN IF NOT EXISTS canonical_district_id UUID REFERENCES canonical_districts(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS observation_date DATE,
    ADD COLUMN IF NOT EXISTS raw_risk_probability NUMERIC(5,4) CHECK (raw_risk_probability IS NULL OR (raw_risk_probability >= 0.0 AND raw_risk_probability <= 1.0)),
    ADD COLUMN IF NOT EXISTS calibrated_risk_probability NUMERIC(5,4) CHECK (calibrated_risk_probability IS NULL OR (calibrated_risk_probability >= 0.0 AND calibrated_risk_probability <= 1.0)),
    ADD COLUMN IF NOT EXISTS urgency_score NUMERIC(4,3) CHECK (urgency_score IS NULL OR (urgency_score >= 0.0 AND urgency_score <= 1.0)),
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure an assessment references either a habitation or a canonical district
ALTER TABLE risk_assessments 
    DROP CONSTRAINT IF EXISTS chk_risk_assessment_target,
    ADD CONSTRAINT chk_risk_assessment_target CHECK (habitation_id IS NOT NULL OR canonical_district_id IS NOT NULL);

-- Idempotent unique constraint for district observation assessments
CREATE UNIQUE INDEX IF NOT EXISTS uq_ra_district_obs_model 
    ON risk_assessments (canonical_district_id, observation_date, model_version_id) 
    WHERE canonical_district_id IS NOT NULL AND observation_date IS NOT NULL AND model_version_id IS NOT NULL;

-- 2. EXTEND RELOCATION PRIORITIES FOR DISTRICT GRANULARITY
ALTER TABLE relocation_priorities 
    ALTER COLUMN habitation_id DROP NOT NULL;

ALTER TABLE relocation_priorities 
    ADD COLUMN IF NOT EXISTS canonical_district_id UUID REFERENCES canonical_districts(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS urgency_score NUMERIC(4,3) CHECK (urgency_score IS NULL OR (urgency_score >= 0.0 AND urgency_score <= 1.0)),
    ADD COLUMN IF NOT EXISTS observation_date DATE,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure a relocation priority references either a habitation or a canonical district
ALTER TABLE relocation_priorities 
    DROP CONSTRAINT IF EXISTS chk_relocation_priority_target,
    ADD CONSTRAINT chk_relocation_priority_target CHECK (habitation_id IS NOT NULL OR canonical_district_id IS NOT NULL);

-- Idempotent unique constraint for district observation priorities
CREATE UNIQUE INDEX IF NOT EXISTS uq_rp_district_obs_model 
    ON relocation_priorities (canonical_district_id, observation_date, model_version_id) 
    WHERE canonical_district_id IS NOT NULL AND observation_date IS NOT NULL AND model_version_id IS NOT NULL;

-- 3. EXTEND MODEL VERSIONS METADATA
ALTER TABLE model_versions
    ADD COLUMN IF NOT EXISTS code_commit VARCHAR(100),
    ADD COLUMN IF NOT EXISTS target_definition TEXT,
    ADD COLUMN IF NOT EXISTS prediction_horizon VARCHAR(50),
    ADD COLUMN IF NOT EXISTS feature_schema_version VARCHAR(50),
    ADD COLUMN IF NOT EXISTS artifact_path TEXT,
    ADD COLUMN IF NOT EXISTS artifact_checksum VARCHAR(100),
    ADD COLUMN IF NOT EXISTS random_seed INTEGER;

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_ra_canonical_district ON risk_assessments(canonical_district_id);
CREATE INDEX IF NOT EXISTS idx_ra_observation_date ON risk_assessments(observation_date);
CREATE INDEX IF NOT EXISTS idx_rp_canonical_district ON relocation_priorities(canonical_district_id);
CREATE INDEX IF NOT EXISTS idx_rp_observation_date ON relocation_priorities(observation_date);
CREATE INDEX IF NOT EXISTS idx_rp_priority_weight ON relocation_priorities(priority_weight DESC);
CREATE INDEX IF NOT EXISTS idx_rfc_risk_assessment ON risk_feature_contributions(risk_assessment_id);
