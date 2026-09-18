-- ============================================================
-- VISTHAAPAN Migration 013: Phase 9 Operational Integration,
-- DDMP 2026-27 Knowledge, Relocation Plans & Officer Adjudication
-- ============================================================

-- 1. SEED DEFAULT AUTHORITATIVE GOVERNMENT OFFICER
INSERT INTO government_officers (
    username, full_name, official_email, mobile_number,
    department, designation, state, district, office, employee_id, account_status
) VALUES (
    'dm_chamoli',
    'Shri R. K. Sharma, IAS',
    'dm-chamoli@uk.gov.in',
    '+91-1372-252101',
    'District Disaster Management Authority (DDMA), Chamoli',
    'District Magistrate & Incident Commander',
    'Uttarakhand',
    'Chamoli',
    'District Emergency Operations Centre (DEOC), Gopeshwar',
    'IAS-UK-2012-0941',
    'active'
) ON CONFLICT (username) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    designation = EXCLUDED.designation,
    office = EXCLUDED.office,
    account_status = 'active';

-- 2. CREATE DISTRICT EVIDENCE TABLE (DDMP 2026-27 & Documentary Evidence)
CREATE TABLE IF NOT EXISTS district_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_district_id UUID REFERENCES canonical_districts(id) ON DELETE CASCADE,
    district_name VARCHAR(100) NOT NULL,
    source_document VARCHAR(200) NOT NULL DEFAULT 'Chamoli DDMP 2026-27',
    source_type VARCHAR(100) NOT NULL DEFAULT 'GOVERNMENT_DOCUMENT',
    authority VARCHAR(200) NOT NULL DEFAULT 'District Disaster Management Authority, Chamoli',
    document_type VARCHAR(100) NOT NULL DEFAULT 'District Disaster Management Plan',
    plan_year VARCHAR(50) NOT NULL DEFAULT '2026-27',
    evidence_category VARCHAR(100) NOT NULL, -- DDMP_VULNERABLE_HABITATION, DDMP_RELOCATION_HISTORY, DDMP_TEMPORARY_SHELTER_CONTEXT, DDMP_ROAD_CORRIDOR, DDMP_RESOURCE_CONTEXT, DDMP_HISTORICAL_DISASTER, DDMP_HELIPAD_CONTEXT
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    reference_page VARCHAR(50),
    data_origin VARCHAR(50) NOT NULL DEFAULT 'REAL', -- REAL documentary planning evidence
    confidence NUMERIC(4,3) DEFAULT 0.950 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_de_canonical_district ON district_evidence(canonical_district_id);
CREATE INDEX IF NOT EXISTS idx_de_category ON district_evidence(evidence_category);
CREATE INDEX IF NOT EXISTS idx_de_source_doc ON district_evidence(source_document);

-- 3. EXTEND OFFICER DECISIONS TABLE FOR COMPLETE AUDIT TRAIL
ALTER TABLE officer_decisions
    ALTER COLUMN officer_id DROP NOT NULL;

ALTER TABLE officer_decisions
    ADD COLUMN IF NOT EXISTS plan_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES canonical_districts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS officer_name VARCHAR(200) DEFAULT 'Shri R. K. Sharma, IAS',
    ADD COLUMN IF NOT EXISTS officer_role VARCHAR(150) DEFAULT 'Incident Commander',
    ADD COLUMN IF NOT EXISTS affected_entities JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS modifications JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS previous_allocation_summary TEXT,
    ADD COLUMN IF NOT EXISTS new_allocation_summary TEXT,
    ADD COLUMN IF NOT EXISTS data_origin VARCHAR(50) NOT NULL DEFAULT 'REAL',
    ADD COLUMN IF NOT EXISTS decision_status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED';

CREATE INDEX IF NOT EXISTS idx_od_decision ON officer_decisions(decision);
CREATE INDEX IF NOT EXISTS idx_od_created_at ON officer_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_od_district_id ON officer_decisions(district_id);

-- 4. EXTEND DECISION HISTORY TABLE
ALTER TABLE decision_history
    ALTER COLUMN officer_id DROP NOT NULL;

ALTER TABLE decision_history
    ADD COLUMN IF NOT EXISTS decision_id UUID REFERENCES officer_decisions(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS plan_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS officer_name VARCHAR(200) DEFAULT 'Shri R. K. Sharma, IAS',
    ADD COLUMN IF NOT EXISTS decision_type VARCHAR(50) DEFAULT 'ACCEPTED',
    ADD COLUMN IF NOT EXISTS modifications JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS data_origin VARCHAR(50) NOT NULL DEFAULT 'REAL';

CREATE INDEX IF NOT EXISTS idx_dh_action ON decision_history(action);
CREATE INDEX IF NOT EXISTS idx_dh_timestamp ON decision_history("timestamp" DESC);

-- 5. EXTEND RELOCATION PLANS TABLE
ALTER TABLE relocation_plans
    ADD COLUMN IF NOT EXISTS plan_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES canonical_districts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS district_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS total_demand INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_allocated INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_unmet INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_rp_plan_code ON relocation_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_rp_status ON relocation_plans(status);

-- 6. POPULATE DDMP 2026-27 STRUCTURED DOCUMENTARY EVIDENCE FOR CHAMOLI
DO $$
DECLARE
    chamoli_id UUID;
BEGIN
    SELECT id INTO chamoli_id FROM canonical_districts WHERE district_name ILIKE '%Chamoli%' LIMIT 1;

    IF chamoli_id IS NOT NULL THEN
        -- Clean existing documentary evidence for idempotency
        DELETE FROM district_evidence WHERE canonical_district_id = chamoli_id AND source_document = 'Chamoli DDMP 2026-27';

        -- A. Vulnerable Habitations (Documentary evidence names from DDMP Chapter 2 & 4)
        INSERT INTO district_evidence (canonical_district_id, district_name, evidence_category, title, description, metadata, reference_page)
        VALUES
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Chhinka', 'Documented vulnerable settlement prone to slope instability and debris accumulation.', '{"hazard_type": "Landslide / Slope Instability", "settlement_name": "Chhinka", "source_note": "Identified in DDMP 2026-27 Vulnerability Matrix"}', 'Page 42'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Math', 'Documented vulnerable habitation exposed to active hill slope movement.', '{"hazard_type": "Landslide / Slope Failure", "settlement_name": "Math"}', 'Page 43'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Ganaai', 'Settlement listed under monsoon flash flood and toe erosion hazard zone.', '{"hazard_type": "Flash Flood / Toe Erosion", "settlement_name": "Ganaai"}', 'Page 45'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Dadhmi', 'High-risk slope habitation with historical debris flows.', '{"hazard_type": "Debris Flow", "settlement_name": "Dadhmi"}', 'Page 46'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Urgam Talla Badginda Tok', 'Identified vulnerable pocket in Urgam Valley with severe landslide vulnerability.', '{"hazard_type": "Active Slope Instability", "settlement_name": "Urgam Talla Badginda Tok"}', 'Page 48'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Chhewargram', 'Documented landslide-prone village on steep Garhwal formation slope.', '{"hazard_type": "Landslide", "settlement_name": "Chhewargram"}', 'Page 49'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Pagnon', 'Vulnerable habitation near active drainage channel with debris surge risk.', '{"hazard_type": "Debris Surge", "settlement_name": "Pagnon"}', 'Page 51'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Raini', 'Historic rockfall and flash flood impact zone (2021 Rishi Ganga disaster corridor).', '{"hazard_type": "Rockfall / Flash Flood", "settlement_name": "Raini", "historical_context": "2021 Rishi Ganga flash flood corridor"}', 'Page 53'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Farakande', 'Documented vulnerable settlement on fractured bedrock formation.', '{"hazard_type": "Landslide / Rockfall", "settlement_name": "Farakande"}', 'Page 55'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Kanol', 'Remote high-altitude habitation with seasonal isolation and slope movement risks.', '{"hazard_type": "Snow Avalanche / Slope Movement", "settlement_name": "Kanol"}', 'Page 57'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Chapali', 'Documented vulnerable habitation with active subsidence fissures.', '{"hazard_type": "Subsidence Fissures", "settlement_name": "Chapali"}', 'Page 58'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Tyula', 'Vulnerable settlement exposed to riverine toe erosion along tributary.', '{"hazard_type": "Toe Erosion", "settlement_name": "Tyula"}', 'Page 60'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Bhyadi', 'Landslide hazard zone with documented ground displacement history.', '{"hazard_type": "Ground Displacement", "settlement_name": "Bhyadi"}', 'Page 61'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Sarpani', 'Steep-slope settlement with periodic monsoon boulder rolling hazards.', '{"hazard_type": "Boulder Rolling", "settlement_name": "Sarpani"}', 'Page 63'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Godigwala', 'Documented vulnerable habitation in riverbed proximity.', '{"hazard_type": "River Inundation", "settlement_name": "Godigwala"}', 'Page 65'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Kuling', 'High-altitude habitation with winter isolation and slope degradation.', '{"hazard_type": "Avalanche / Landslide", "settlement_name": "Kuling"}', 'Page 67'),
        (chamoli_id, 'Chamoli', 'DDMP_VULNERABLE_HABITATION', 'Vulnerable Habitation: Urgam Badginda Tok', 'Upper Urgam valley settlement listed for continuous monitoring during monsoon.', '{"hazard_type": "Landslide Monitoring Zone", "settlement_name": "Urgam Badginda Tok"}', 'Page 69');

        -- B. Relocation & Rehabilitation History Context
        INSERT INTO district_evidence (canonical_district_id, district_name, evidence_category, title, description, metadata, reference_page)
        VALUES
        (chamoli_id, 'Chamoli', 'DDMP_RELOCATION_HISTORY', 'DDMP Rehabilitation & Relocation Framework', 'Chamoli DDMP 2026-27 establishes rehabilitation policy guidelines for chronically endangered settlements, categorizing affected families, relocated families, and remaining on-site households with financial assistance parameters under SDRF/NDRF norms.', '{"policy_framework": "Uttarakhand Disaster Rehabilitation Policy & SDRF Norms", "temporal_nature": "Historical planning baseline, not current live displacement count"}', 'Page 112'),
        (chamoli_id, 'Chamoli', 'DDMP_RELOCATION_HISTORY', 'Relocation Case Study: Chronic Landslide Villages', 'Documentary ledger of historical relocation proposals in Chamoli covering families displaced by major monsoon landslides in Joshimath and Dasholi blocks.', '{"blocks_covered": ["Joshimath", "Dasholi", "Ghat"], "data_origin": "REAL_DOCUMENTARY"}', 'Page 115');

        -- C. Temporary Shelters Context
        INSERT INTO district_evidence (canonical_district_id, district_name, evidence_category, title, description, metadata, reference_page)
        VALUES
        (chamoli_id, 'Chamoli', 'DDMP_TEMPORARY_SHELTER_CONTEXT', 'DDMP Relief Camp & Temporary Shelter Staging Framework', 'District disaster plan designates government inter colleges, polytechnics, community halls, and tourist rest houses as designated staging points for emergency relief camps. Universal carrying capacities are not gazetted in DDMP; candidate sites in VISTHAAPAN utilize modeled benchmark capacities (SIMULATED_BENCHMARK).', '{"designated_facility_types": ["Government Inter Colleges (GIC)", "Government Polytechnics", "Panchayat Ghars", "TRH Facilities"], "capacity_status": "SIMULATED_BENCHMARK"}', 'Page 88'),
        (chamoli_id, 'Chamoli', 'DDMP_TEMPORARY_SHELTER_CONTEXT', 'Lifeline Provisioning at Relief Shelters', 'Mandates safe drinking water supply through Jal Sansthan tankers, mobile bio-toilet deployment by Swachh Bharat mission, and preliminary medical triage by CMO teams at designated evacuation hubs.', '{"lifelines": ["Drinking Water", "Sanitation", "Emergency Healthcare", "All-weather Shelter"]}', 'Page 91');

        -- D. Road Corridor Context
        INSERT INTO district_evidence (canonical_district_id, district_name, evidence_category, title, description, metadata, reference_page)
        VALUES
        (chamoli_id, 'Chamoli', 'DDMP_ROAD_CORRIDOR', 'Sensitive Corridor: Karnaprayag–Chamoli–Joshimath–Badrinath (NH-07)', 'Primary lifeline corridor subject to frequent chronic landslide blockages at Birahi, Pagal Nala, and Helang during monsoon peak. Identified in DDMP as priority clearance corridor with pre-positioned BRO/NHIDCL heavy machinery.', '{"corridor_name": "NH-07 Badrinath Highway", "vulnerability": "Pagal Nala, Birahi, Helang landslide blocks", "status": "DDMP-identified sensitive corridor (Not live GPS telemetry)"}', 'Page 102'),
        (chamoli_id, 'Chamoli', 'DDMP_ROAD_CORRIDOR', 'Sensitive Corridor: Karnaprayag–Tharali–Gwaldam', 'Strategic alternate arterial route connecting Chamoli to Kumaon division. Vulnerable to Pindar river toe erosion and seasonal debris slides.', '{"corridor_name": "Karnaprayag-Tharali-Gwaldam", "status": "DDMP-identified sensitive corridor"}', 'Page 104'),
        (chamoli_id, 'Chamoli', 'DDMP_ROAD_CORRIDOR', 'Sensitive Corridor: Karnaprayag–Gairsain', 'Vital link to the summer capital of Uttarakhand; prone to localized cuts during extreme rainfall spells.', '{"corridor_name": "Karnaprayag-Gairsain", "status": "DDMP-identified sensitive corridor"}', 'Page 105'),
        (chamoli_id, 'Chamoli', 'DDMP_ROAD_CORRIDOR', 'Sensitive Corridor: Chamoli–Gopeshwar–Mandal–Chopta', 'High-altitude mountain road connecting district headquarters to Kedarnath valley buffer; subject to winter snow closure and monsoonal soil slips.', '{"corridor_name": "Chamoli-Gopeshwar-Mandal-Chopta", "status": "DDMP-identified sensitive corridor"}', 'Page 107'),
        (chamoli_id, 'Chamoli', 'DDMP_ROAD_CORRIDOR', 'Sensitive Corridor: Joshimath–Malari–Niti', 'Border area transit corridor in Dhauli Ganga valley; critical for border security and high-altitude transhumant habitations.', '{"corridor_name": "Joshimath-Malari-Niti", "status": "DDMP-identified sensitive corridor"}', 'Page 109');

        -- E. Resource Context
        INSERT INTO district_evidence (canonical_district_id, district_name, evidence_category, title, description, metadata, reference_page)
        VALUES
        (chamoli_id, 'Chamoli', 'DDMP_RESOURCE_CONTEXT', 'Emergency Equipment & Response Inventory Framework', 'DDMP lists heavy earthmoving equipment (JCBs, excavators, dozers) under PWD, BRO, and private contractors for emergency road opening. Exact operational readiness is dynamically maintained at the District Emergency Operations Centre (DEOC).', '{"resource_types": ["Excavators", "JCBs", "Water Bowsers", "Emergency Generators", "Mobile Medical Units"], "authority": "DEOC Gopeshwar"}', 'Page 120');

        -- F. Historical Disaster Evidence
        INSERT INTO district_evidence (canonical_district_id, district_name, evidence_category, title, description, metadata, reference_page)
        VALUES
        (chamoli_id, 'Chamoli', 'DDMP_HISTORICAL_DISASTER', 'Historical Earthquake: 1999 Chamoli Earthquake (M6.8)', 'Major seismic event occurred on 29 March 1999 (00:35 IST) with epicenter near Chamoli (30.492°N, 79.288°E, depth 15 km), causing 100+ fatalities and widespread masonry damage across Garhwal.', '{"event_date": "1999-03-29", "magnitude": 6.8, "depth_km": 15, "latitude": 30.492, "longitude": 79.288, "data_origin": "REAL_HISTORICAL"}', 'Page 15'),
        (chamoli_id, 'Chamoli', 'DDMP_HISTORICAL_DISASTER', 'Historical Flash Flood: 2021 Rishi Ganga Glacial Outburst Disaster', 'Catastrophic debris and flash flood on 7 February 2021 triggered by hanging glacier rock-ice avalanche at Raunthi peak, destroying Tapovan Vishnugad and Rishi Ganga hydel sites with over 200 casualties.', '{"event_date": "2021-02-07", "hazard_type": "Glacial Lake Outburst / Rock Avalanche", "data_origin": "REAL_HISTORICAL"}', 'Page 18');

        -- G. Helipad Context
        INSERT INTO district_evidence (canonical_district_id, district_name, evidence_category, title, description, metadata, reference_page)
        VALUES
        (chamoli_id, 'Chamoli', 'DDMP_HELIPAD_CONTEXT', 'Temporary Emergency Helipad Staging Locations', 'District administration identifies temporary and all-weather helipads for casualty air evacuation and food grain air drops at Gauchar, Joshimath, Badrinath, Pipalkoti, and Gwaldam. Helipad locations are maintained through official control-room records; exact spatial coordinates are restricted to official civil aviation clearances.', '{"staging_points": ["Gauchar Airstrip", "Joshimath Army Helipad", "Badrinath Helipad", "Gwaldam Helipad"], "location_note": "Helipad location available through official control-room records"}', 'Page 76');

    END IF;
END $$;
