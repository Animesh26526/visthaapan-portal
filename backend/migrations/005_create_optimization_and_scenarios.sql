-- ============================================================
-- VISTHAAPAN Migration 005: Operations Research Optimization & Scenarios
-- Authoritative reference: docs/VISTHAAPAN — Final Database Structure.docx (Entities 28-36)
-- ============================================================

-- 28. ALLOCATION REQUEST (Parameters for OR-Tools solver execution)
CREATE TABLE IF NOT EXISTS allocation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planning_horizon VARCHAR(100),
    allow_partial_allocation BOOLEAN NOT NULL DEFAULT TRUE,
    max_distance_km NUMERIC(8,2) CHECK (max_distance_km IS NULL OR max_distance_km >= 0.0),
    max_cost NUMERIC(14,2) CHECK (max_cost IS NULL OR max_cost >= 0.0),
    require_safe_sites BOOLEAN NOT NULL DEFAULT TRUE,
    scenario_id UUID, -- Foreign key wired after scenarios table creation
    created_by UUID REFERENCES government_officers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 29. ALLOCATION RESULT (OR-Tools solver execution output)
CREATE TABLE IF NOT EXISTS allocation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL, -- optimal, feasible, infeasible, failed
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_demand INTEGER NOT NULL CHECK (total_demand >= 0),
    total_allocated INTEGER NOT NULL CHECK (total_allocated >= 0),
    total_unmet INTEGER NOT NULL CHECK (total_unmet >= 0),
    total_distance NUMERIC(12,2) CHECK (total_distance IS NULL OR total_distance >= 0.0),
    total_cost NUMERIC(14,2) CHECK (total_cost IS NULL OR total_cost >= 0.0),
    priority_benefit NUMERIC(10,4),
    solver_name VARCHAR(100) NOT NULL DEFAULT 'OR-Tools',
    solver_version VARCHAR(50),
    solve_time_ms INTEGER CHECK (solve_time_ms IS NULL OR solve_time_ms >= 0),
    scenario_id UUID -- Foreign key wired after scenarios table creation
);

-- 30. ALLOCATION ITEM (Population transfer assignments: x_ij and unmet u_i)
CREATE TABLE IF NOT EXISTS allocation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES allocation_results(id) ON DELETE CASCADE,
    habitation_id UUID NOT NULL REFERENCES habitations(id) ON DELETE RESTRICT,
    site_id UUID NOT NULL REFERENCES relocation_sites(id) ON DELETE RESTRICT,
    population_allocated INTEGER NOT NULL CHECK (population_allocated >= 0),
    population_demand INTEGER NOT NULL CHECK (population_demand >= 0),
    unmet_population INTEGER NOT NULL DEFAULT 0 CHECK (unmet_population >= 0),
    priority_weight NUMERIC(5,4) CHECK (priority_weight IS NULL OR (priority_weight >= 0.0 AND priority_weight <= 1.0)),
    distance_km NUMERIC(8,2) CHECK (distance_km IS NULL OR distance_km >= 0.0),
    travel_time_minutes NUMERIC(8,2) CHECK (travel_time_minutes IS NULL OR travel_time_minutes >= 0.0),
    estimated_cost NUMERIC(12,2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0.0),
    route_available BOOLEAN NOT NULL DEFAULT TRUE,
    reason TEXT
);

-- 31. CONSTRAINT RESULT (OR model constraint validation details)
CREATE TABLE IF NOT EXISTS constraint_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES allocation_results(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- capacity, safety, route, demand, site-availability, distance, cost
    status VARCHAR(50) NOT NULL, -- satisfied, violated, binding, relaxed
    description TEXT,
    value NUMERIC(14,4),
    limit_value NUMERIC(14,4)
);

-- 32. ALLOCATION EXPLANATION (Decision justification dossier)
CREATE TABLE IF NOT EXISTS allocation_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES allocation_results(id) ON DELETE CASCADE,
    habitation_id UUID REFERENCES habitations(id) ON DELETE SET NULL,
    overall_explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 32B. ALLOCATION EXPLANATION FACTOR (Per-factor justification elements)
CREATE TABLE IF NOT EXISTS allocation_explanation_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    explanation_id UUID NOT NULL REFERENCES allocation_explanations(id) ON DELETE CASCADE,
    factor VARCHAR(100) NOT NULL,
    value VARCHAR(200),
    importance NUMERIC(5,4),
    explanation TEXT NOT NULL
);

-- 33. SCENARIO (What-if simulation workspace)
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    base_allocation_id UUID REFERENCES allocation_results(id) ON DELETE SET NULL,
    created_by UUID REFERENCES government_officers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'draft'
);

-- Wire delayed foreign keys to scenarios
ALTER TABLE allocation_requests
    ADD CONSTRAINT fk_alloc_req_scenario
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE SET NULL;

ALTER TABLE allocation_results
    ADD CONSTRAINT fk_alloc_res_scenario
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE SET NULL;

-- 34. SCENARIO CHANGE (Perturbation specifications: road blockage, capacity cut, etc.)
CREATE TABLE IF NOT EXISTS scenario_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL, -- capacity-change, road-closure, site-addition, site-removal, hazard-change, population-change, infrastructure-change
    target_entity_type VARCHAR(100) NOT NULL,
    target_id UUID NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 35. SCENARIO RESULT (Scenario execution linking)
CREATE TABLE IF NOT EXISTS scenario_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    allocation_result_id UUID NOT NULL REFERENCES allocation_results(id) ON DELETE CASCADE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 36. SCENARIO COMPARISON (Baseline vs. Perturbed re-optimization metrics)
CREATE TABLE IF NOT EXISTS scenario_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    baseline_allocation_id UUID NOT NULL REFERENCES allocation_results(id) ON DELETE CASCADE,
    scenario_allocation_id UUID NOT NULL REFERENCES allocation_results(id) ON DELETE CASCADE,
    allocated_population_change INTEGER,
    unmet_demand_change INTEGER,
    cost_change NUMERIC(14,2),
    distance_change NUMERIC(12,2),
    utilization_change NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
