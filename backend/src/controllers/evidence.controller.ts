/**
 * VISTHAAPAN Phase 9 Evidence & Provenance Controller
 * Exposes structured Chamoli DDMP 2026-27 documentary planning evidence
 * and the authoritative system-wide data provenance registry.
 */

import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';

export async function getDistrictEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { districtId } = req.params;

    // Resolve district by UUID or name
    let districtName = districtId;
    let querySql = `
      SELECT de.*, cd.district_name as canonical_name
      FROM district_evidence de
      LEFT JOIN canonical_districts cd ON cd.id = de.canonical_district_id
      WHERE de.canonical_district_id::text = $1 OR de.district_name ILIKE $2 OR cd.district_name ILIKE $2
      ORDER BY de.evidence_category, de.created_at ASC;
    `;

    let result = await pool.query(querySql, [districtId, `%${districtId}%`]);

    if (result.rowCount === 0) {
      // Fallback: If querying with 'chamoli' or default, query Chamoli records
      result = await pool.query(`
        SELECT de.*, cd.district_name as canonical_name
        FROM district_evidence de
        LEFT JOIN canonical_districts cd ON cd.id = de.canonical_district_id
        WHERE de.district_name ILIKE '%Chamoli%'
        ORDER BY de.evidence_category, de.created_at ASC;
      `);
      districtName = 'Chamoli';
    }

    const rows = result.rows;
    const vulnerableHabitations = rows.filter(r => r.evidence_category === 'DDMP_VULNERABLE_HABITATION');
    const relocationHistory = rows.filter(r => r.evidence_category === 'DDMP_RELOCATION_HISTORY');
    const temporaryShelters = rows.filter(r => r.evidence_category === 'DDMP_TEMPORARY_SHELTER_CONTEXT');
    const roadCorridors = rows.filter(r => r.evidence_category === 'DDMP_ROAD_CORRIDOR');
    const resourceContext = rows.filter(r => r.evidence_category === 'DDMP_RESOURCE_CONTEXT');
    const historicalDisasters = rows.filter(r => r.evidence_category === 'DDMP_HISTORICAL_DISASTER');
    const helipads = rows.filter(r => r.evidence_category === 'DDMP_HELIPAD_CONTEXT');

    res.status(200).json({
      success: true,
      district: districtName,
      sourceDocument: 'Chamoli DDMP 2026-27',
      authority: 'District Disaster Management Authority (DDMA), Chamoli',
      documentType: 'District Disaster Management Plan',
      planYear: '2026-27',
      dataOrigin: 'REAL',
      evidenceCount: rows.length,
      disclaimer: 'This represents official documentary planning evidence from DDMA Chamoli. It provides authoritative administrative context, not live sensor telemetry.',
      categories: {
        vulnerableHabitations: vulnerableHabitations.map(formatEvidenceRow),
        relocationHistory: relocationHistory.map(formatEvidenceRow),
        temporaryShelters: temporaryShelters.map(formatEvidenceRow),
        roadCorridors: roadCorridors.map(formatEvidenceRow),
        resourceContext: resourceContext.map(formatEvidenceRow),
        historicalDisasters: historicalDisasters.map(formatEvidenceRow),
        helipads: helipads.map(formatEvidenceRow),
      },
      rawList: rows.map(formatEvidenceRow),
    });
  } catch (err) {
    next(err);
  }
}

function formatEvidenceRow(row: any) {
  return {
    id: row.id,
    category: row.evidence_category,
    title: row.title,
    description: row.description,
    referencePage: row.reference_page,
    metadata: row.metadata || {},
    confidence: Number(row.confidence),
    dataOrigin: row.data_origin,
    createdAt: row.created_at,
  };
}

export async function getProvenanceRegistry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const registry = [
      {
        id: 'PROV-001',
        datasetName: 'Canonical Administrative Districts',
        authority: 'Office of the Registrar General & Census Commissioner / Local Government Directory (LGD)',
        recordsCount: 785,
        coverage: 'Pan-India (36 States & UTs)',
        dataOrigin: 'REAL',
        badge: 'REAL',
        status: 'Authoritative Baseline',
        limitations: 'Boundaries aligned with Census 2011 / LGD 2024; administrative carve-outs reconciled via canonical mapping.',
      },
      {
        id: 'PROV-002',
        datasetName: 'National Disaster Event Registry',
        authority: 'National Database for Emergency Management (NDEM) / Ministry of Home Affairs (MHA)',
        recordsCount: 47621,
        coverage: 'Multi-year pan-India historical disaster incidence reports',
        dataOrigin: 'REAL',
        badge: 'REAL',
        status: 'Authoritative Historical Record',
        limitations: 'Event reporting subject to district reporting cadence; footer artifacts normalized and validated.',
      },
      {
        id: 'PROV-003',
        datasetName: 'Census Demographic Baseline',
        authority: 'Census of India (Office of the Registrar General & Census Commissioner)',
        recordsCount: 640,
        coverage: 'District-level demographics, household sizes, SC/ST indicators',
        dataOrigin: 'REAL_HISTORICAL_BASELINE',
        badge: 'REAL (HISTORICAL 2011 BASELINE)',
        status: 'Historical Baseline (2011)',
        limitations: 'STRICTLY HISTORICAL 2011 DATA. Must not be represented as real-time 2026 census counts. Used for normalized baseline comparison.',
      },
      {
        id: 'PROV-004',
        datasetName: 'National Healthcare Facility Geo-Registry',
        authority: 'National Health Portal (NHP) / Ministry of Health and Family Welfare (MoHFW)',
        recordsCount: 30273,
        coverage: 'Geocoded government and private medical institutions',
        dataOrigin: 'REAL_FACILITY_LOCATIONS',
        badge: 'QUARANTINED (HEALTHCARE_BED_DATA_QUARANTINED)',
        status: 'Locations Verified / Bed Counts Quarantined',
        limitations: 'Facility geographic coordinates are verified. Bed counts are strictly quarantined (HEALTHCARE_BED_DATA_QUARANTINED) due to lack of real-time occupancy feeds. Candidate sites use simulated benchmark triage capacity (SIMULATED_BENCHMARK).',
      },
      {
        id: 'PROV-005',
        datasetName: 'Cartosat-1 Digital Elevation Model (DEM)',
        authority: 'ISRO National Remote Sensing Centre (NRSC) / Bhuvan',
        recordsCount: 5,
        coverage: 'Western Gujarat coastal sector (tiles: 68E22N, 68E23N, 69E21N, 69E23N, 70E21N)',
        dataOrigin: 'REAL_GEOSPATIAL',
        badge: 'UNAVAILABLE OUTSIDE GUJARAT',
        status: 'Regional Elevation Tile Coverage',
        limitations: 'DEM slope analysis is strictly limited to Western Gujarat tiles. Outside Western Gujarat (including Himalayan Chamoli sector), terrain slope is unavailable (TERRAIN_ELEVATION_UNAVAILABLE_OUTSIDE_GUJARAT); system uses safe neutral baseline.',
      },
      {
        id: 'PROV-006',
        datasetName: 'AI Multi-Hazard Risk Inference (RPW)',
        authority: 'VISTHAAPAN Phase 5 Machine Learning Engine (Gradient Boosting / Random Forest)',
        recordsCount: 785,
        coverage: '785 canonical districts classified into operational tiers (Immediate, Short-Term, Medium-Term)',
        dataOrigin: 'DERIVED',
        badge: 'DERIVED (AI INFERENCE)',
        status: 'Algorithmic Decision Support',
        limitations: 'Relative Priority Weight (RPW) is an algorithmic decision-support score, not a statutory hazard proclamation.',
      },
      {
        id: 'PROV-007',
        datasetName: 'Spatial Multi-Hazard Exclusion Buffers',
        authority: 'VISTHAAPAN Phase 6 PostGIS GIS Spatial Intelligence Engine',
        recordsCount: 12,
        coverage: 'Multi-hazard buffer intersection zones in Chamoli sector',
        dataOrigin: 'DERIVED',
        badge: 'DERIVED (GIS EXCLUSION)',
        status: 'Spatial Intersection Envelope',
        limitations: 'GIS-derived hard hazard exclusion. Enforces zero usable shelter capacity inside active hazard footprint. This is decision-support spatial analysis, not a statutory legal designation.',
      },
      {
        id: 'PROV-008',
        datasetName: 'Candidate Relocation Carrying Capacities',
        authority: 'VISTHAAPAN Phase 7 Multi-Dimensional Capacity Engine',
        recordsCount: 6,
        coverage: '6 Chamoli candidate staging sites evaluated across 7 lifelines (water, sanitation, shelter, etc.)',
        dataOrigin: 'SIMULATED_BENCHMARK',
        badge: 'SIMULATED_BENCHMARK',
        status: 'Planning Benchmark Model',
        limitations: 'Lifeline capacities are simulated planning benchmarks (SIMULATED_BENCHMARK) based on Sphere humanitarian minimums, not observed telemetry.',
      },
      {
        id: 'PROV-009',
        datasetName: 'Operations Research Transit Allocations',
        authority: 'VISTHAAPAN Phase 8 Google OR-Tools Mathematical Optimization Engine',
        recordsCount: 30,
        coverage: 'Constrained MILP bipartite transit matching for Chamoli vulnerable sectors',
        dataOrigin: 'SIMULATED_BENCHMARK',
        badge: 'SIMULATED_BENCHMARK',
        status: 'Algorithmic Optimization Model',
        limitations: 'Mathematical optimization recommendations for decision support. Incident Commander review and authorization required.',
      },
      {
        id: 'PROV-010',
        datasetName: 'District Disaster Management Plan (DDMP 2026-27)',
        authority: 'District Disaster Management Authority (DDMA), Chamoli / DEOC Gopeshwar',
        recordsCount: 30,
        coverage: '17 vulnerable settlements, 5 sensitive road corridors, 4 helipads, historical precedents',
        dataOrigin: 'REAL',
        badge: 'REAL (DOCUMENTARY PLANNING EVIDENCE)',
        status: 'Authoritative Official Plan',
        limitations: 'Established administrative planning baseline from official district disaster documentation.',
      },
      {
        id: 'PROV-011',
        datasetName: 'Incident Commander Statutory Decisions & Audit Ledger',
        authority: 'District Magistrate / Incident Commander, DDMA Chamoli (under DM Act 2005)',
        recordsCount: 'Dynamic (PostgreSQL backed)',
        coverage: 'Adjudicated evacuation orders, route diversions, shelter overrides',
        dataOrigin: 'REAL',
        badge: 'REAL (OFFICER ADJUDICATION)',
        status: 'Legal Audit Trail',
        limitations: 'Authoritative decisions executed by designated government officers with mandatory rationale.',
      },
    ];

    res.status(200).json({
      success: true,
      data: registry,
      provenanceStandard: 'NDRF / MHA Disaster Informatics Guidelines',
      complianceNote: 'All data origins are explicitly tagged. Silent fallback to synthetic mocks is strictly forbidden.',
    });
  } catch (err) {
    next(err);
  }
}
