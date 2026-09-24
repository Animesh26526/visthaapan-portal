-- ============================================================
-- VISTHAAPAN Migration 006: Execution, Operational Events & Human Adjudication
-- Authoritative reference: docs/VISTHAAPAN — Final Database Structure.docx (Entities 37-42)
-- ============================================================

-- 37. OPERATIONAL EVENT (Live telemetry & physical state events)
CREATE TABLE IF NOT EXISTS operational_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    source VARCHAR(200),
    description TEXT NOT NULL,
    affected_entity_type VARCHAR(100),
    affected_entity_id UUID,
    previous_value JSONB,
    new_value JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES government_officers(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- 38. RELOCATION PLAN (Authoritative operational master plan derived from allocation)
CREATE TABLE IF NOT EXISTS relocation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES allocation_results(id) ON DELETE RESTRICT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, recommended, accepted, modified, rejected
    created_by UUID REFERENCES government_officers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 39. RELOCATION PLAN ITEM (Phased dispatch actions: Immediate, Short, Medium)
CREATE TABLE IF NOT EXISTS relocation_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES relocation_plans(id) ON DELETE CASCADE,
    habitation_id UUID NOT NULL REFERENCES habitations(id) ON DELETE RESTRICT,
    destination_site_id UUID NOT NULL REFERENCES relocation_sites(id) ON DELETE RESTRICT,
    population INTEGER NOT NULL CHECK (population >= 0),
    capacity INTEGER CHECK (capacity IS NULL OR capacity >= 0),
    priority VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    responsible_authority VARCHAR(200),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 40. OFFICER DECISION (Statutory Human-in-the-Loop review under DM Act 2005)
CREATE TABLE IF NOT EXISTS officer_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID NOT NULL REFERENCES government_officers(id) ON DELETE RESTRICT,
    recommendation_id UUID REFERENCES relocation_plans(id) ON DELETE RESTRICT,
    decision VARCHAR(50) NOT NULL, -- accepted, modified, rejected
    reason TEXT NOT NULL,
    modified_allocation_id UUID REFERENCES allocation_results(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 41. DECISION HISTORY (Immutable statutory audit log & gazette ledger)
CREATE TABLE IF NOT EXISTS decision_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID NOT NULL REFERENCES government_officers(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL,
    affected_habitation_ids UUID[],
    affected_site_ids UUID[],
    previous_plan_id UUID REFERENCES relocation_plans(id) ON DELETE SET NULL,
    new_plan_id UUID REFERENCES relocation_plans(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 42. SYSTEM UPDATE LOG (Automated cascade tracking: sensor alert -> re-solve)
CREATE TABLE IF NOT EXISTS system_update_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_type VARCHAR(100) NOT NULL,
    source VARCHAR(200) NOT NULL,
    affected_entity_type VARCHAR(100),
    affected_entity_id UUID,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processing_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    recalculation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reoptimization_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    message TEXT
);
