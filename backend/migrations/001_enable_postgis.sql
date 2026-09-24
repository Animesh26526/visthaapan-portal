-- ============================================================
-- VISTHAAPAN Migration 001: PostGIS & UUID Foundation
-- Authoritative reference: docs/VISTHAAPAN Technical Implementation Plan.docx
-- ============================================================

-- Enable UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS spatial database engine
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Verification assertion: Fail migration immediately if PostGIS is not available
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
    ) THEN
        RAISE EXCEPTION 'CRITICAL: PostGIS extension could not be enabled in PostgreSQL.';
    END IF;
END $$;
