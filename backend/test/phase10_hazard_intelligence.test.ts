/**
 * VISTHAAPAN Phase 10 Spatial Hazard Intelligence Test Suite
 * Validates verified spatial hazard evidence (GSI, NCS, CBRI, CWC),
 * settlement search API, habitation-level exposure intelligence,
 * PostGIS metric distance joins, District AI isolation, and Terrain UNAVAILABLE policy.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';

let server: http.Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://localhost:${addr.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  await pool.end();
});

describe('Phase 10 Spatial Hazard Intelligence APIs', () => {
  let joshimathSettlementId: string;
  let rainiSettlementId: string;

  it('GET /api/v1/gis/hazard-evidence returns verified spatial hazard features', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/hazard-evidence`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.type, 'FeatureCollection');
    assert.ok(body.data.features.length >= 20, 'Should have at least 20 hazard evidence features');

    const hazardTypes = new Set(body.data.features.map((f: any) => f.properties.hazardType.toUpperCase()));
    assert.ok(hazardTypes.has('LANDSLIDE'), 'Must contain LANDSLIDE features');
    assert.ok(hazardTypes.has('EARTHQUAKE'), 'Must contain EARTHQUAKE features');
    assert.ok(hazardTypes.has('SUBSIDENCE'), 'Must contain SUBSIDENCE features');
    assert.ok(hazardTypes.has('RIVERINE_CORRIDOR') || hazardTypes.has('RIVER_FLOOD_CORRIDOR'), 'Must contain RIVER features');

    const authorities = new Set(body.data.features.map((f: any) => f.properties.authority as string));
    assert.ok([...authorities].some((a) => a.includes('Geological Survey of India')), 'GSI authority must be present');
    assert.ok([...authorities].some((a) => a.includes('Earth Sciences') || a.includes('NCS')), 'NCS / MoES authority must be present');

    // Verify Joshimath Subsidence Zone feature
    const joshimathSubsidence = body.data.features.find(
      (f: any) => f.properties.hazardType.toUpperCase() === 'SUBSIDENCE' && f.properties.name.includes('Joshimath')
    );
    assert.ok(joshimathSubsidence, 'Joshimath subsidence crack zone feature must exist');
    assert.strictEqual(joshimathSubsidence.properties.dataOrigin, 'REAL');
    assert.strictEqual(joshimathSubsidence.geometry.type, 'Polygon');
    assert.ok(joshimathSubsidence.geometry.coordinates.length > 0);

    // Verify 1999 Chamoli earthquake epicenter feature
    const chamoliQuake = body.data.features.find(
      (f: any) => f.properties.hazardType.toUpperCase() === 'EARTHQUAKE' && f.properties.name.includes('1999')
    );
    assert.ok(chamoliQuake, '1999 Chamoli earthquake epicenter feature must exist');
    assert.ok(
      chamoliQuake.properties.authority.includes('Earth Sciences') || chamoliQuake.properties.source.includes('NCS'),
      'Earthquake feature must be attributed to MoES / NCS'
    );
  });

  it('GET /api/v1/gis/hazard-evidence?type=LANDSLIDE filters by hazard type', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/hazard-evidence?type=LANDSLIDE`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.features.length > 0);
    for (const f of body.data.features) {
      assert.strictEqual(f.properties.hazardType.toUpperCase(), 'LANDSLIDE');
    }
  });

  it('GET /api/v1/gis/settlements/search searches settlements by name and code', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/settlements/search?q=Joshimath&district_code=057`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0, 'Should find Joshimath in search results');

    const joshimath = body.data[0];
    assert.strictEqual(joshimath.settlementCode, '800291');
    assert.strictEqual(joshimath.settlementType, 'TOWN');
    assert.strictEqual(joshimath.districtCode, '057');
    assert.strictEqual(joshimath.hasHazardExclusions, true, 'Joshimath must have hazard exclusions');
    assert.ok(joshimath.exposureCount > 0, 'Exposure count must be positive');
    joshimathSettlementId = joshimath.id;

    // Search by Census Code
    const codeRes = await fetch(`${baseUrl}/api/v1/gis/settlements/search?q=800291`);
    assert.strictEqual(codeRes.status, 200);
    const codeBody = await codeRes.json();
    assert.ok(codeBody.data.length >= 1);
    assert.strictEqual(codeBody.data[0].settlementCode, '800291');
  });

  it('GET /api/v1/gis/settlements/search finds Raini village with warnings', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/settlements/search?q=Raini`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.length > 0, 'Should find Raini village in search results');

    const raini = body.data[0];
    assert.ok(raini.settlementName.includes('Raini') || raini.settlementName.includes('Reni'));
    assert.strictEqual(raini.hasHazardWarnings, true, 'Raini must have hazard warnings (rock avalanche buffer)');
    rainiSettlementId = raini.id;
  });

  it('GET /api/v1/gis/settlements/search handles non-existent query gracefully', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/settlements/search?q=NonExistentPlaceXYZ999`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.deepStrictEqual(body.data, []);
  });

  it('GET /api/v1/gis/settlements/:id/intelligence returns full habitation exposure profile', async () => {
    assert.ok(joshimathSettlementId, 'joshimathSettlementId must be set');
    const res = await fetch(`${baseUrl}/api/v1/gis/settlements/${joshimathSettlementId}/intelligence`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const intel = body.data;

    // 1. Settlement & Administration
    assert.strictEqual(intel.settlement.settlementCode, '800291');
    assert.strictEqual(intel.settlement.settlementType, 'TOWN');
    assert.strictEqual(intel.administration.districtCode, '057');
    assert.strictEqual(intel.administration.districtName.toUpperCase(), 'CHAMOLI');

    // 2. Census Demographics
    assert.ok(intel.census.population2011Baseline > 15000, 'Joshimath population baseline should be > 15,000');
    assert.ok(intel.census.temporalNotice.includes('Census of India 2011'));

    // 3. District AI Isolation (Strict decoupling)
    assert.strictEqual(intel.districtAI.modelLevel, 'DISTRICT_LEVEL_ONLY');
    assert.ok(
      intel.districtAI.disclaimer.includes('District-level AI risk model; not a settlement-level prediction'),
      'District AI disclaimer must explicitly state it is not a settlement-level prediction'
    );
    assert.ok(intel.districtAI.riskScore !== null);
    assert.ok(intel.districtAI.priorityTier !== null);

    // 4. PostGIS Metric Hazard Exposures
    assert.ok(intel.hazards.length > 0, 'Joshimath must have recorded hazard exposures');
    const subsidenceExposure = intel.hazards.find(
      (h: any) => h.hazardType.toUpperCase() === 'SUBSIDENCE' && h.exposureClassification === 'HARD_EXCLUSION'
    );
    assert.ok(subsidenceExposure, 'Joshimath must have a SUBSIDENCE HARD_EXCLUSION exposure');
    assert.strictEqual(subsidenceExposure.relationship, 'WITHIN');
    assert.strictEqual(subsidenceExposure.distanceMeters, 0, 'Distance inside zone must be 0 meters');
    assert.ok(subsidenceExposure.interpretation.toLowerCase().includes('subsidence'), 'Interpretation must describe subsidence');

    // Check metric distance format (meters, not degrees)
    for (const h of intel.hazards) {
      assert.strictEqual(typeof h.distanceMeters, 'number');
      assert.ok(h.distanceMeters >= 0, 'Distance must be non-negative in meters');
    }

    // 5. Terrain Status Policy (Strictly UNAVAILABLE for Uttarakhand)
    assert.strictEqual(intel.terrain.terrainStatus, 'UNAVAILABLE', 'Terrain status must be UNAVAILABLE');
    assert.strictEqual(intel.terrain.elevationMeters, null, 'Elevation must be null when unavailable');
    assert.strictEqual(intel.terrain.slopeDegrees, null, 'Slope must be null when unavailable');
    assert.ok(
      intel.terrain.provenance.includes('Gujarat tiles excluded per policy') ||
      intel.terrain.note.includes('Gujarat DEM excluded'),
      'Terrain note/provenance must explain Gujarat tiles were excluded'
    );

    // 6. Historical Disaster Records
    assert.ok(intel.historicalEvidence.length > 0, 'Joshimath should have historical disaster records');
    const subsidenceEvent = intel.historicalEvidence.find((ev: any) => ev.disasterType.toUpperCase().includes('SUBSIDENCE'));
    assert.ok(subsidenceEvent, '2023 Joshimath subsidence crisis should be recorded');
    assert.ok(
      ['POINT_COORDINATE', 'SETTLEMENT_MATCH', 'DISTRICT_LEVEL'].includes(subsidenceEvent.spatialPrecision),
      'Spatial precision must be valid enum'
    );

    // 7. Nearby Infrastructure
    assert.ok(intel.nearbyInfrastructure.nearestRoad !== null, 'Nearby road should be detected');
    assert.strictEqual(typeof intel.nearbyInfrastructure.nearestRoad.distanceMeters, 'number');

    // 8. Data Quality & Analysis Metadata
    assert.strictEqual(intel.dataQuality.overallStatus, 'SUFFICIENT_EVIDENCE');
    assert.strictEqual(intel.dataQuality.analysisVersion, 'v1.0-phase10');
    assert.ok(intel.dataQuality.confidence > 0.8);
  });

  it('GET /api/v1/gis/settlements/:id/intelligence for Raini returns warning without false exclusion', async () => {
    assert.ok(rainiSettlementId, 'rainiSettlementId must be set');
    const res = await fetch(`${baseUrl}/api/v1/gis/settlements/${rainiSettlementId}/intelligence`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const intel = body.data;
    assert.ok(intel.hazards.length > 0);

    const warningExposure = intel.hazards.find((h: any) => h.exposureClassification === 'WARNING');
    assert.ok(warningExposure, 'Raini must have a WARNING hazard exposure (rock avalanche buffer)');
    assert.ok(warningExposure.distanceMeters >= 0, 'Distance must be >= 0 meters');
  });

  it('GET /api/v1/gis/settlements/:id/intelligence returns 404 for invalid settlement ID', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/settlements/00000000-0000-0000-0000-000000000000/intelligence`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'NOT_FOUND');
    assert.ok(body.error.message.includes('not found'));
  });
});
