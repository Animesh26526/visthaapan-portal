/**
 * VISTHAAPAN Phase 9 Operational Integration, Real-Data Migration,
 * DDMP 2026-27 Knowledge & Officer Decision Workflow Test Suite
 */

import { pool } from '../src/db/pool.js';
import { app } from '../src/app.js';
import http from 'http';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];
let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, name: string, suite: string, details?: string): void {
  results.push({
    suite,
    name,
    passed: condition,
    details: condition ? undefined : details,
  });
  if (condition) {
    console.log(`  PASS: ${name}`);
  } else {
    console.error(`  FAIL: ${name}${details ? ` -> ${details}` : ''}`);
  }
}

async function requestJson(path: string, options: RequestInit = {}): Promise<{ status: number; body: any }> {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });
  const text = await res.text();
  let body: any = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function runPhase9Tests() {
  console.log('\n================================================================');
  console.log('  RUNNING PHASE 9 OPERATIONAL INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // Start temporary test server
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://localhost:${addr.port}`;
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------------------
    // Suite 1: DDMP 2026-27 Structured Documentary Evidence (Database & API)
    // -------------------------------------------------------------------------
    console.log('--- Suite 1: DDMP 2026-27 Documentary Evidence ---');

    const ddmpDbRes = await pool.query(
      "SELECT * FROM district_evidence WHERE district_name ILIKE '%Chamoli%';"
    );
    assert(ddmpDbRes.rowCount === 30, 'Database contains exactly 30 Chamoli DDMP evidence records', 'DDMP Evidence');

    const categoriesRes = await pool.query(`
      SELECT evidence_category, COUNT(*) as count 
      FROM district_evidence 
      WHERE district_name ILIKE '%Chamoli%' 
      GROUP BY evidence_category;
    `);
    const catMap = Object.fromEntries(categoriesRes.rows.map(r => [r.evidence_category, Number(r.count)]));

    assert(catMap['DDMP_VULNERABLE_HABITATION'] === 17, 'All 17 DDMP vulnerable habitations seeded', 'DDMP Evidence');
    assert(catMap['DDMP_ROAD_CORRIDOR'] === 5, 'All 5 sensitive road corridors seeded', 'DDMP Evidence');
    assert(catMap['DDMP_HISTORICAL_DISASTER'] === 2, 'Historical disaster precedents seeded (1999 M6.8 & 2021)', 'DDMP Evidence');
    assert(catMap['DDMP_HELIPAD_CONTEXT'] === 1, 'Helipad staging context seeded', 'DDMP Evidence');
    assert(catMap['DDMP_TEMPORARY_SHELTER_CONTEXT'] === 2, 'Temporary shelter staging context seeded', 'DDMP Evidence');
    assert(catMap['DDMP_RELOCATION_HISTORY'] === 2, 'Relocation & rehabilitation history seeded', 'DDMP Evidence');
    assert(catMap['DDMP_RESOURCE_CONTEXT'] === 1, 'Equipment & resource context seeded', 'DDMP Evidence');

    // Verify exact 1999 earthquake coordinates
    const eqRes = await pool.query(
      "SELECT metadata FROM district_evidence WHERE title ILIKE '%1999 Chamoli Earthquake%';"
    );
    const eqMeta = eqRes.rows[0]?.metadata;
    assert(
      eqMeta?.magnitude === 6.8 && eqMeta?.latitude === 30.492 && eqMeta?.longitude === 79.288,
      '1999 Chamoli Earthquake preserves exact seismic metadata (M6.8, 30.492°N, 79.288°E)',
      'DDMP Evidence'
    );

    // Verify REST API endpoint GET /api/v1/evidence/ddmp/Chamoli
    const ddmpApiRes = await requestJson('/api/v1/evidence/ddmp/Chamoli');
    assert(ddmpApiRes.status === 200, 'GET /api/v1/evidence/ddmp/Chamoli returns 200 OK', 'DDMP Evidence API');
    assert(ddmpApiRes.body.success === true, 'DDMP API response indicates success', 'DDMP Evidence API');
    assert(ddmpApiRes.body.dataOrigin === 'REAL', 'DDMP evidence tagged with dataOrigin = REAL', 'DDMP Evidence API');
    assert(ddmpApiRes.body.categories.vulnerableHabitations.length === 17, 'API categories includes 17 vulnerable habitations', 'DDMP Evidence API');
    assert(ddmpApiRes.body.categories.roadCorridors.length === 5, 'API categories includes 5 road corridors', 'DDMP Evidence API');

    // -------------------------------------------------------------------------
    // Suite 2: System-Wide Provenance Registry & Metadata Badges
    // -------------------------------------------------------------------------
    console.log('\n--- Suite 2: System-Wide Provenance Registry ---');

    const provRes = await requestJson('/api/v1/evidence/provenance');
    assert(provRes.status === 200, 'GET /api/v1/evidence/provenance returns 200 OK', 'Provenance');
    assert(Array.isArray(provRes.body.data), 'Provenance registry returns array of datasets', 'Provenance');
    assert(provRes.body.data.length >= 11, 'Provenance registry has >= 11 tracked system datasets', 'Provenance');

    const provMap = Object.fromEntries(provRes.body.data.map((d: any) => [d.id, d]));

    // Check Healthcare Quarantine
    const hcProv = provMap['PROV-004'];
    assert(
      hcProv?.badge.includes('QUARANTINED') && hcProv?.limitations.includes('HEALTHCARE_BED_DATA_QUARANTINED'),
      'Hospital bed count is explicitly QUARANTINED (HEALTHCARE_BED_DATA_QUARANTINED)',
      'Provenance'
    );

    // Check Census 2011 Historical Baseline
    const censusProv = provMap['PROV-003'];
    assert(
      censusProv?.badge.includes('HISTORICAL 2011 BASELINE') && censusProv?.dataOrigin === 'REAL_HISTORICAL_BASELINE',
      'Census demographics flagged as REAL (HISTORICAL 2011 BASELINE)',
      'Provenance'
    );

    // Check DEM Elevation Unavailable Outside Gujarat
    const demProv = provMap['PROV-005'];
    assert(
      demProv?.badge.includes('UNAVAILABLE OUTSIDE GUJARAT'),
      'Cartosat-1 DEM slope flagged as UNAVAILABLE OUTSIDE GUJARAT for Chamoli',
      'Provenance'
    );

    // Check Phase 7 Capacity Assessment
    const capProv = provMap['PROV-008'];
    assert(
      capProv?.badge === 'SIMULATED_BENCHMARK' && capProv?.dataOrigin === 'SIMULATED_BENCHMARK',
      'Phase 7 Carrying Capacities explicitly tagged SIMULATED_BENCHMARK',
      'Provenance'
    );

    // Check Phase 8 Operations Research
    const orProv = provMap['PROV-009'];
    assert(
      orProv?.badge === 'SIMULATED_BENCHMARK' && orProv?.dataOrigin === 'SIMULATED_BENCHMARK',
      'Phase 8 Transit Allocations explicitly tagged SIMULATED_BENCHMARK',
      'Provenance'
    );

    // Check Phase 9 Officer Decisions
    const decProv = provMap['PROV-011'];
    assert(
      decProv?.badge.includes('REAL (OFFICER ADJUDICATION)'),
      'Officer Adjudications tagged as REAL (OFFICER ADJUDICATION)',
      'Provenance'
    );

    // -------------------------------------------------------------------------
    // Suite 3: Dynamic Command Center KPIs (Database Queries)
    // -------------------------------------------------------------------------
    console.log('\n--- Suite 3: Dynamic Command Center KPIs ---');

    const cmdRes = await requestJson('/api/v1/command-center/summary');
    assert(cmdRes.status === 200, 'GET /api/v1/command-center/summary returns 200 OK', 'Command Center');
    const cmdData = cmdRes.body.data;

    assert(cmdData.totalMonitoredDistricts === 785, 'Live count of canonical districts = 785', 'Command Center');
    assert(cmdData.totalDisasterEventsRecorded === 47621, 'Live count of NDEM disaster events = 47,621', 'Command Center');
    assert(cmdData.totalHealthcareFacilities === 30273, 'Live count of healthcare facilities = 30,273', 'Command Center');
    assert(cmdData.ddmpDocumentaryEvidenceRecords === 30, 'Live count of DDMP documentary evidence = 30', 'Command Center');
    assert(cmdData.candidateSafeSites === 5, 'Live count of safe candidate sites = 5', 'Command Center');
    assert(cmdData.restrictedHazardSites === 1, 'Live count of restricted sites inside hazard envelope = 1', 'Command Center');
    assert(
      cmdData.provenanceFlags.healthcareBedQuarantine === 'HEALTHCARE_BED_DATA_QUARANTINED',
      'Command Center badges healthcare beds as HEALTHCARE_BED_DATA_QUARANTINED',
      'Command Center'
    );

    // -------------------------------------------------------------------------
    // Suite 4: Human-in-the-Loop Officer Decision Adjudication & Audit Trail
    // -------------------------------------------------------------------------
    console.log('\n--- Suite 4: Human-in-the-Loop Officer Decisions ---');

    // 4.1 Missing rationale rejection
    const invalidRes1 = await requestJson('/api/v1/decisions', {
      method: 'POST',
      body: JSON.stringify({
        action: 'ACCEPTED',
        rationale: '', // empty rationale
      }),
    });
    assert(
      invalidRes1.status === 400 && invalidRes1.body.code === 'MANDATORY_RATIONALE_MISSING',
      'POST /decisions rejects missing rationale with 400 MANDATORY_RATIONALE_MISSING',
      'Decisions'
    );

    // 4.2 Invalid action rejection
    const invalidRes2 = await requestJson('/api/v1/decisions', {
      method: 'POST',
      body: JSON.stringify({
        action: 'MAYBE_APPROVE',
        rationale: 'Valid rationale text',
      }),
    });
    assert(
      invalidRes2.status === 400 && invalidRes2.body.code === 'INVALID_DECISION_ACTION',
      'POST /decisions rejects invalid action with 400 INVALID_DECISION_ACTION',
      'Decisions'
    );

    // 4.3 Submit ACCEPTED decision
    const testPlanId = `PLAN-TEST-${Date.now()}`;
    const acceptRes = await requestJson('/api/v1/decisions', {
      method: 'POST',
      body: JSON.stringify({
        planId: testPlanId,
        action: 'ACCEPTED',
        rationale: 'Fully reviewed against ground reports from SDM Joshimath. Authorize immediate convoy dispatch.',
        officerName: 'Shri R. K. Sharma, IAS',
        officerRole: 'District Magistrate & Incident Commander',
        affectedHabitations: ['Joshimath Sector', 'Malari Sector'],
        affectedSites: ['Gauchar Airstrip Hub', 'Karnaprayag Facility'],
      }),
    });
    assert(acceptRes.status === 201, 'POST /decisions ACCEPTED returns 201 Created', 'Decisions');
    assert(acceptRes.body.data.action === 'ACCEPTED', 'Recorded decision action is ACCEPTED', 'Decisions');
    assert(acceptRes.body.data.dataOrigin === 'REAL', 'Recorded decision dataOrigin is REAL', 'Decisions');
    const decisionId = acceptRes.body.data.id;

    // 4.4 Submit MODIFIED decision with custom parameters
    const modifyRes = await requestJson('/api/v1/decisions', {
      method: 'POST',
      body: JSON.stringify({
        planId: testPlanId,
        action: 'MODIFIED',
        rationale: 'Road R12 Pagal Nala bridge compromised. Diverting all Joshimath evacuees via Gauchar airstrip buffer.',
        modifications: {
          divertedRoutes: ['NH-07 -> Gauchar via SH-11'],
          capacityOverrideSiteBeta: 6500,
        },
      }),
    });
    assert(modifyRes.status === 201, 'POST /decisions MODIFIED returns 201 Created', 'Decisions');
    assert(modifyRes.body.data.action === 'MODIFIED', 'Recorded decision action is MODIFIED', 'Decisions');

    // 4.5 Submit REJECTED decision
    const rejectRes = await requestJson('/api/v1/decisions', {
      method: 'POST',
      body: JSON.stringify({
        planId: `PLAN-REJ-${Date.now()}`,
        action: 'REJECTED',
        rationale: 'Severe flash flood alert in Rishi Ganga tributary. Shelter locations need recalculation.',
      }),
    });
    assert(rejectRes.status === 201, 'POST /decisions REJECTED returns 201 Created', 'Decisions');
    assert(rejectRes.body.data.action === 'REJECTED', 'Recorded decision action is REJECTED', 'Decisions');

    // 4.6 List decisions & audit history
    const listDecRes = await requestJson('/api/v1/decisions');
    assert(listDecRes.status === 200, 'GET /api/v1/decisions returns 200 OK', 'Decisions');
    assert(Array.isArray(listDecRes.body), 'GET /api/v1/decisions returns array', 'Decisions');
    assert(listDecRes.body.length >= 3, 'Decisions list contains newly submitted decisions', 'Decisions');

    const getDecRes = await requestJson(`/api/v1/decisions/${decisionId}`);
    assert(getDecRes.status === 200, 'GET /api/v1/decisions/:id returns 200 OK', 'Decisions');
    assert(getDecRes.body.data.id === decisionId, 'Detailed decision matches requested ID', 'Decisions');
    assert(getDecRes.body.data.auditHistory.length >= 1, 'Decision has linked audit ledger entry', 'Decisions');

    // -------------------------------------------------------------------------
    // Suite 5: Scenario Lab & Dynamic Re-Optimization with Delta Comparison
    // -------------------------------------------------------------------------
    console.log('\n--- Suite 5: Scenario Lab & Re-Optimization ---');

    const scenListRes = await requestJson('/api/v1/scenarios');
    assert(scenListRes.status === 200, 'GET /api/v1/scenarios returns 200 OK', 'Scenarios');
    assert(Array.isArray(scenListRes.body), 'GET /api/v1/scenarios returns array', 'Scenarios');
    assert(scenListRes.body.length >= 4, 'Scenarios list includes baseline and stress tests', 'Scenarios');

    // Dynamic Re-Optimization with Road R12 blockage
    const reoptRes = await requestJson('/api/v1/scenarios/reoptimize', {
      method: 'POST',
      body: JSON.stringify({
        roadR12Blocked: true,
        scenarioName: 'Test Road R12 Severance Re-Optimization',
      }),
    });
    assert(reoptRes.status === 200, 'POST /api/v1/scenarios/reoptimize returns 200 OK', 'Scenarios');
    assert(reoptRes.body.success === true, 'Re-optimization solved successfully', 'Scenarios');
    assert(Array.isArray(reoptRes.body.allocations), 'Re-optimization returns allocation items', 'Scenarios');
    assert(reoptRes.body.comparison !== undefined, 'Re-optimization computes comparison delta', 'Scenarios');
    assert(
      typeof reoptRes.body.comparison.transitDistanceDeltaKm === 'number',
      'Comparison delta contains transitDistanceDeltaKm metric',
      'Scenarios'
    );

    // -------------------------------------------------------------------------
    // Suite 6: One-Click Incident Commander Briefing Engine
    // -------------------------------------------------------------------------
    console.log('\n--- Suite 6: Incident Commander Briefings Engine ---');

    const briefRes = await requestJson('/api/v1/briefings/generate', {
      method: 'POST',
      body: JSON.stringify({
        incidentCommander: 'Shri R. K. Sharma, IAS',
        designation: 'District Magistrate & Incident Commander',
      }),
    });
    assert(briefRes.status === 200, 'POST /api/v1/briefings/generate returns 200 OK', 'Briefings');
    assert(briefRes.body.success === true, 'Briefing generated successfully', 'Briefings');
    assert(typeof briefRes.body.data.markdownContent === 'string', 'Briefing includes markdownContent', 'Briefings');
    assert(
      briefRes.body.data.markdownContent.includes('INCIDENT COMMANDER OPERATIONAL SITUATION BRIEF'),
      'Markdown brief contains official header',
      'Briefings'
    );
    assert(
      briefRes.body.data.markdownContent.includes('HEALTHCARE_BED_DATA_QUARANTINED'),
      'Markdown brief contains mandatory bed quarantine note',
      'Briefings'
    );
    assert(
      briefRes.body.data.markdownContent.includes('LEGAL NOTICE'),
      'Markdown brief contains legal decision-support disclaimer',
      'Briefings'
    );

    // -------------------------------------------------------------------------
    // Suite 7: Habitations & Candidate Sites Direct Data Access
    // -------------------------------------------------------------------------
    console.log('\n--- Suite 7: Direct Habitations & Sites Endpoints ---');

    const habsRes = await requestJson('/api/v1/habitations');
    assert(habsRes.status === 200, 'GET /api/v1/habitations returns 200 OK', 'Habitations & Sites');
    assert(Array.isArray(habsRes.body) && habsRes.body.length >= 5, 'GET /habitations returns >= 5 habitations', 'Habitations & Sites');

    const sitesRes = await requestJson('/api/v1/sites');
    assert(sitesRes.status === 200, 'GET /api/v1/sites returns 200 OK', 'Habitations & Sites');
    assert(Array.isArray(sitesRes.body) && sitesRes.body.length >= 6, 'GET /sites returns >= 6 sites', 'Habitations & Sites');
    assert(sitesRes.body[0].resourceCapacity !== undefined, 'Candidate sites include Phase 7 resourceCapacity breakdown', 'Habitations & Sites');

  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n================================================================');
  console.log(`  PHASE 9 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (${results.length} TOTAL)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase9Tests()
  .then(() => pool.end().then(() => process.exit(0)))
  .catch((err) => {
    console.error('Unhandled test suite failure:', err);
    pool.end().finally(() => process.exit(1));
  });

