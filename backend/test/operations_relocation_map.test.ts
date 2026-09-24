/**
 * VISTHAAPAN Operations & Relocation Planning Map Test Suite
 * PS 26191 Verification:
 * 1. Operational map displays hazard zones (polygons).
 * 2. Operational map displays vulnerable habitations.
 * 3. Operational map displays relocation sites with carrying capacity.
 * 4. Operational map displays relocation routes following OSM road network.
 * 5. Immediate, Short-Term, Medium-Term, Long-Term phase filtering works.
 * 6. Capacity values are internally consistent (Effective = Allocated + Remaining).
 * 7. Routes follow mapped road network coordinates, not straight lines.
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

describe('VISTHAAPAN PS 26191: Operational Relocation Planning Map Suite', () => {
  it('1. GET /api/v1/operations/relocation-map returns operational hazard zones as spatial polygons', async () => {
    const res = await fetch(`${baseUrl}/api/v1/operations/relocation-map`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.hazardZones));
    assert.ok(data.hazardZones.length >= 4);

    const joshimathZone = data.hazardZones.find((z: any) => z.id === 'zone-joshimath-subsidence');
    assert.ok(joshimathZone, 'Joshimath Subsidence Zone must exist');
    assert.strictEqual(joshimathZone.severity, 'CRITICAL');
    assert.ok(joshimathZone.areaSqKm > 0);
    assert.ok(joshimathZone.geometry, 'Hazard zone must have spatial geometry');
    assert.ok(['Polygon', 'MultiPolygon'].includes(joshimathZone.geometry.type), 'Hazard zone must be Polygon or MultiPolygon, NOT a mere point');
  });

  it('2. Returns vulnerable habitations with human-readable names and realistic demographics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/operations/relocation-map`);
    const data = await res.json();
    assert.ok(Array.isArray(data.habitations));
    const joshimath = data.habitations.find((h: any) => h.name === 'Joshimath');
    assert.ok(joshimath, 'Joshimath habitation must exist');
    assert.strictEqual(joshimath.population, 4500);
    assert.strictEqual(joshimath.hazardStatus, 'CRITICAL');
    assert.strictEqual(joshimath.relocationPriority, 'Immediate');
    assert.strictEqual(joshimath.recommendedDestinationName, 'Gauchar Relocation Site');
    assert.strictEqual(joshimath.allocatedPopulation, 4500);
  });

  it('3. Returns safe relocation sites with explicit carrying capacity breakdown', async () => {
    const res = await fetch(`${baseUrl}/api/v1/operations/relocation-map`);
    const data = await res.json();
    assert.ok(Array.isArray(data.relocationSites));

    const gauchar = data.relocationSites.find((s: any) => s.id === 'site-gauchar');
    assert.ok(gauchar, 'Gauchar Relocation Site must exist');
    assert.strictEqual(gauchar.name, 'Gauchar Relocation Site');
    assert.strictEqual(gauchar.nominalCapacity, 5500);
    assert.strictEqual(gauchar.effectiveCapacity, 5000);
    assert.strictEqual(gauchar.allocatedPopulation, 4500);
    assert.strictEqual(gauchar.remainingCapacity, 500);
    assert.strictEqual(gauchar.suitability, 'SUITABLE');
    assert.ok(gauchar.safetyScore >= 0.95);
    assert.strictEqual(gauchar.isInsideRedZone, false);

    // Consistency check: effectiveCapacity == allocatedPopulation + remainingCapacity
    assert.strictEqual(gauchar.effectiveCapacity, gauchar.allocatedPopulation + gauchar.remainingCapacity);
  });

  it('4. Transportation routes follow the mapped road network (multi-coordinate polylines, not straight lines)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/operations/relocation-map?phase=IMMEDIATE`);
    const data = await res.json();
    assert.ok(Array.isArray(data.routes));
    assert.strictEqual(data.routes.length, 5);

    const joshimathRoute = data.routes.find((r: any) => r.id === 'route-joshimath-gauchar');
    assert.ok(joshimathRoute, 'Joshimath to Gauchar route must exist');
    assert.strictEqual(joshimathRoute.roadNetwork, 'Mapped Road Network');
    assert.strictEqual(joshimathRoute.status, 'Route Available');
    assert.strictEqual(joshimathRoute.geometry.type, 'LineString');
    assert.ok(joshimathRoute.geometry.coordinates.length > 5, 'Route must have multiple coordinates tracing road, not 2 straight-line points');
    assert.strictEqual(joshimathRoute.distanceKm, 79.2);
  });

  it('5. Immediate phase filter returns exactly 5 habitations with 15,450 required population', async () => {
    const res = await fetch(`${baseUrl}/api/v1/operations/relocation-map?phase=IMMEDIATE`);
    const data = await res.json();
    assert.strictEqual(data.activePhase, 'IMMEDIATE');
    assert.strictEqual(data.habitations.length, 5);
    assert.strictEqual(data.summary.totalRequiredPopulation, 15450);
    assert.strictEqual(data.summary.totalAllocatedPopulation, 15450);
    assert.strictEqual(data.summary.capacityDeficit, 0);
    assert.strictEqual(data.summary.status, 'OPTIMAL_ALLOCATION');
  });

  it('6. Phased relocation filtering (Short Term, Medium Term, Long Term) functions deterministically', async () => {
    const shortRes = await fetch(`${baseUrl}/api/v1/operations/relocation-map?phase=SHORT_TERM`);
    const shortTermData = await shortRes.json();
    assert.strictEqual(shortTermData.habitations.length, 2);
    assert.strictEqual(shortTermData.summary.totalRequiredPopulation, 3000);

    const medRes = await fetch(`${baseUrl}/api/v1/operations/relocation-map?phase=MEDIUM_TERM`);
    const medTermData = await medRes.json();
    assert.strictEqual(medTermData.habitations.length, 2);
    assert.strictEqual(medTermData.summary.totalRequiredPopulation, 4000);

    const longRes = await fetch(`${baseUrl}/api/v1/operations/relocation-map?phase=LONG_TERM`);
    const longTermData = await longRes.json();
    assert.strictEqual(longTermData.habitations.length, 2);
    assert.strictEqual(longTermData.summary.totalRequiredPopulation, 2450);
  });

  it('7. Restricted site (Pipalkoti) enforces 0 effective capacity and RESTRICTED status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/operations/relocation-map`);
    const data = await res.json();
    const pipalkoti = data.relocationSites.find((s: any) => s.id === 'site-pipalkoti-restricted');
    assert.ok(pipalkoti);
    assert.strictEqual(pipalkoti.effectiveCapacity, 0);
    assert.strictEqual(pipalkoti.suitability, 'RESTRICTED');
    assert.strictEqual(pipalkoti.isInsideRedZone, true);
  });
});
