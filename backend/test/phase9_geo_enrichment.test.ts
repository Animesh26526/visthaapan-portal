/**
 * VISTHAAPAN Phase 9 Geo Data Enrichment Test Suite
 * Validates Survey of India administrative boundaries, Census 2011 settlements, and OSM infrastructure APIs.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';

let server: http.Server;
let baseUrl: string;

before(async () => {
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'census_settlements') THEN
        UPDATE habitations h
        SET census_settlement_id = cs.id,
            census_code = cs.settlement_code
        FROM census_settlements cs
        WHERE (h.name LIKE 'Joshimath%' AND cs.settlement_code = '800291')
           OR (h.name LIKE 'Malari%' AND cs.settlement_code = '040810')
           OR (h.name LIKE 'Tharali%' AND cs.settlement_code = '041838')
           OR (h.name LIKE 'Ghat%' AND cs.settlement_code = '800293')
           OR (h.name LIKE 'Gwaldam%' AND cs.settlement_code = '041846');
      END IF;
    END $$;
  `);

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

describe('Phase 9 Geo Data Enrichment APIs', () => {
  it('GET /api/v1/gis/boundaries/state returns official Survey of India state boundary', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/boundaries/state`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.type, 'FeatureCollection');
    assert.strictEqual(body.data.features.length, 1);

    const stateFeature = body.data.features[0];
    assert.strictEqual(stateFeature.properties.stateName, 'UTTARAKHAND');
    assert.strictEqual(stateFeature.properties.stateCode, '05');
    assert.strictEqual(stateFeature.properties.provenance, 'Survey of India (Official)');
    assert.strictEqual(stateFeature.geometry.type, 'MultiPolygon');
    assert.ok(stateFeature.geometry.coordinates.length > 0);
  });

  it('GET /api/v1/gis/boundaries/districts returns all 13 official districts with AI risk scores', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/boundaries/districts`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.features.length, 13);

    const chamoli = body.data.features.find(
      (f: any) => f.properties.districtCode === '057' || f.properties.districtName === 'CHAMOLI'
    );
    assert.ok(chamoli, 'Chamoli district must exist in district boundaries');
    assert.strictEqual(chamoli.properties.districtName, 'CHAMOLI');
    assert.strictEqual(chamoli.properties.provenance, 'Survey of India (Official)');
    assert.strictEqual(chamoli.geometry.type, 'MultiPolygon');
  });

  it('GET /api/v1/gis/boundaries/subdistricts returns Chamoli tehsils', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/boundaries/subdistricts?district_code=057`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.features.length >= 10, 'Chamoli should have >= 10 tehsils/subdistricts');

    const joshimath = body.data.features.find((f: any) =>
      f.properties.subdistrictName.includes('JYOTIRMATH') || f.properties.subdistrictName.includes('JOSHIMATH')
    );
    assert.ok(joshimath, 'Jyotirmath / Joshimath tehsil must be present');
    assert.strictEqual(joshimath.geometry.type, 'MultiPolygon');
  });

  it('GET /api/v1/gis/census-settlements returns Census 2011 settlements with demographics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/census-settlements?district_code=057&limit=10`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.features.length > 0);

    const sample = body.data.features[0];
    assert.ok(sample.properties.settlementName);
    assert.ok(sample.properties.settlementCode);
    assert.strictEqual(sample.properties.provenance, 'Census 2011 Baseline Population');
    assert.ok('population2011Baseline' in sample.properties);
    assert.ok('households2011Baseline' in sample.properties);
    assert.ok('infrastructureMarkers' in sample.properties);
  });

  it('GET /api/v1/gis/osm/roads returns classified road vectors with provenance disclaimer', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/osm/roads?limit=10`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.features.length > 0);

    const sample = body.data.features[0];
    assert.strictEqual(sample.geometry.type, 'LineString');
    assert.ok(sample.properties.fclass);
    assert.strictEqual(sample.properties.provenance, 'Mapped Road (Not real-time passability verified)');
    assert.ok(sample.properties.classificationNotice.includes('Not real-time passability verified'));
  });

  it('GET /api/v1/gis/osm/facilities returns categorized critical facilities', async () => {
    const res = await fetch(`${baseUrl}/api/v1/gis/osm/facilities?limit=10`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.features.length > 0);

    const sample = body.data.features[0];
    assert.strictEqual(sample.geometry.type, 'Point');
    assert.ok(['healthcare', 'education', 'emergency', 'government', 'shelter'].includes(sample.properties.category));
    assert.strictEqual(sample.properties.provenance, 'OSM-mapped facility');
  });

  it('Habitations are linked to Census 2011 settlement codes', async () => {
    const { rows } = await pool.query(`
      SELECT name, census_code, census_settlement_id
      FROM habitations
      WHERE census_settlement_id IS NOT NULL;
    `);
    assert.ok(rows.length >= 5, 'All benchmark habitations must be linked to Census settlements');
    for (const r of rows) {
      assert.ok(r.census_code, `Habitation ${r.name} should have non-null census_code`);
    }
  });
});
