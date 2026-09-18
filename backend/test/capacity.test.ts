/**
 * VISTHAAPAN Phase 7 Capacity Assessment & Resource Bottleneck Test Suite
 * Validates:
 * 1. Effective capacity calculation as min(physical, water, shelter, sanitation, healthcare, electricity, access)
 * 2. Limiting resource bottleneck identification and plain-language explanation
 * 3. Hard hazard exclusion: PostGIS red zone intersection forces usableCapacity = 0 (RESTRICTED_BY_HAZARD)
 * 4. Bed quarantine integrity: HEALTHCARE_BED_DATA_QUARANTINED flag propagated
 * 5. Terrain limits: TERRAIN_ELEVATION_UNAVAILABLE propagated for non-Gujarat coordinates
 * 6. Relocation demand node synchronization with Phase 5 RPW & operational tiers
 * 7. Express REST endpoints under /api/v1/capacity
 */

import { pool } from '../src/db/pool.js';
import { createApp } from '../src/app.js';
import { Server } from 'http';
import {
  evaluateAllSiteCapacities,
  synchronizeRelocationDemands,
  getSiteCapacityAssessments,
  getRelocationDemandNodes,
  getCapacitySummary,
} from '../src/capacity/capacityService.js';

let server: Server;
let baseUrl: string;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  PASS: ${message}`);
}

async function runCapacityTestSuite(): Promise<void> {
  console.log('\n================================================================');
  console.log('  RUNNING PHASE 7 CAPACITY & RESOURCE BOTTLENECK TEST SUITE');
  console.log('================================================================');

  try {
    // ------------------------------------------------------------
    // SUITE 1: Effective Capacity Calculation & Resource Bottlenecks
    // ------------------------------------------------------------
    console.log('\n--- Suite 1: Effective Capacity & Bottleneck Engine ---');

    const siteAssessments = await evaluateAllSiteCapacities();
    assert(siteAssessments.length === 6, `Exactly 6 candidate sites evaluated (got: ${siteAssessments.length})`);

    const gauchar = siteAssessments.find(s => s.siteName.includes('Gauchar'));
    assert(gauchar !== undefined, 'Gauchar Strategic Airstrip Hub evaluated');
    assert(gauchar?.nominalCapacity === 7500, `Gauchar nominal capacity is 7,500 (got: ${gauchar?.nominalCapacity})`);
    assert(gauchar?.effectiveCapacity === 5000, `Gauchar effective capacity is 5,000 (got: ${gauchar?.effectiveCapacity})`);
    assert(gauchar?.bottleneckDimension === 'sanitation', `Gauchar bottleneck is sanitation (got: ${gauchar?.bottleneckDimension})`);
    assert(gauchar?.capacityStatus === 'BOTTLENECK_CONSTRAINED', `Gauchar status is BOTTLENECK_CONSTRAINED (got: ${gauchar?.capacityStatus})`);

    const karnaprayag = siteAssessments.find(s => s.siteName.includes('Karnaprayag'));
    assert(karnaprayag !== undefined, 'Karnaprayag Civil Relief Facility evaluated');
    assert(karnaprayag?.effectiveCapacity === 3500, `Karnaprayag effective capacity is 3,500 (got: ${karnaprayag?.effectiveCapacity})`);
    assert(karnaprayag?.bottleneckDimension === 'sanitation', `Karnaprayag bottleneck is sanitation (got: ${karnaprayag?.bottleneckDimension})`);

    const rishikesh = siteAssessments.find(s => s.siteName.includes('Rishikesh'));
    assert(rishikesh !== undefined, 'Rishikesh State Reserve Terminal evaluated');
    assert(rishikesh?.nominalCapacity === 20000, `Rishikesh nominal capacity is 20,000 (got: ${rishikesh?.nominalCapacity})`);
    assert(rishikesh?.effectiveCapacity === 15000, `Rishikesh effective capacity is 15,000 (got: ${rishikesh?.effectiveCapacity})`);

    // ------------------------------------------------------------
    // SUITE 2: Hard Hazard Exclusion Integration
    // ------------------------------------------------------------
    console.log('\n--- Suite 2: Hard Hazard Exclusion Integration ---');

    const pipalkoti = siteAssessments.find(s => s.siteName.includes('Pipalkoti'));
    assert(pipalkoti !== undefined, 'Pipalkoti Transit Shelter Hub evaluated');
    assert(pipalkoti?.insideRedZone === true, 'Pipalkoti insideRedZone is true');
    assert(pipalkoti?.hardHazardExclusion === true, 'Pipalkoti hardHazardExclusion is true');
    assert(pipalkoti?.usableCapacity === 0, `Pipalkoti usable capacity is strictly 0 (got: ${pipalkoti?.usableCapacity})`);
    assert(pipalkoti?.capacityStatus === 'RESTRICTED_BY_HAZARD', `Pipalkoti status is RESTRICTED_BY_HAZARD (got: ${pipalkoti?.capacityStatus})`);
    assert(pipalkoti?.limitingFactor.includes('HARD HAZARD EXCLUSION'), 'Pipalkoti limiting factor states HARD HAZARD EXCLUSION');

    const safeSites = siteAssessments.filter(s => !s.hardHazardExclusion);
    assert(safeSites.length === 5, `Exactly 5 sites are safe from hard hazard exclusion (got: ${safeSites.length})`);
    for (const s of safeSites) {
      assert(s.usableCapacity > 0, `Safe site ${s.siteName} has usableCapacity > 0 (got: ${s.usableCapacity})`);
    }

    // ------------------------------------------------------------
    // SUITE 3: Provenance & Uncertainty Flag Propagation
    // ------------------------------------------------------------
    console.log('\n--- Suite 3: Provenance & Uncertainty Flag Propagation ---');

    for (const s of siteAssessments) {
      assert(s.dataOrigin === 'SIMULATED', `Site ${s.siteName} dataOrigin is SIMULATED`);
      assert(s.uncertaintyFlags.includes('SIMULATED_BENCHMARK_FACILITY'), `${s.siteName} has SIMULATED_BENCHMARK_FACILITY flag`);
      assert(s.uncertaintyFlags.includes('HEALTHCARE_BED_DATA_QUARANTINED'), `${s.siteName} has HEALTHCARE_BED_DATA_QUARANTINED flag`);
      assert(s.uncertaintyFlags.includes('TERRAIN_ELEVATION_UNAVAILABLE'), `${s.siteName} has TERRAIN_ELEVATION_UNAVAILABLE flag`);
      assert(s.limitingFactor.length > 10, `${s.siteName} has descriptive limiting factor narrative`);
    }

    // ------------------------------------------------------------
    // SUITE 4: Relocation Demand Node Derivation
    // ------------------------------------------------------------
    console.log('\n--- Suite 4: Relocation Demand Node Derivation ---');

    const demandNodes = await synchronizeRelocationDemands();
    assert(demandNodes.length === 5, `Exactly 5 benchmark demand nodes synchronized (got: ${demandNodes.length})`);

    const joshimath = demandNodes.find(d => d.demandNodeId === 'DEMAND-JOSHIMATH-01');
    assert(joshimath !== undefined, 'DEMAND-JOSHIMATH-01 exists');
    assert(joshimath?.totalPopulation === 4800, `Joshimath population is 4,800 (got: ${joshimath?.totalPopulation})`);
    assert(joshimath?.relocationDemand === 4800, `Joshimath relocation demand is 4,800 (got: ${joshimath?.relocationDemand})`);
    assert(joshimath?.priorityWeight > 0.75, `Joshimath RPW is high (> 0.75, got: ${joshimath?.priorityWeight})`);
    assert(joshimath?.operationalTier === 'immediate', `Joshimath operational tier is immediate (got: ${joshimath?.operationalTier})`);
    assert(joshimath?.dataOrigin === 'SIMULATED', 'Joshimath dataOrigin is SIMULATED');
    assert(joshimath?.populationSource === 'BENCHMARK_CENSUS', 'Joshimath populationSource is BENCHMARK_CENSUS');

    const malari = demandNodes.find(d => d.demandNodeId === 'DEMAND-MALARI-02');
    assert(malari !== undefined, 'DEMAND-MALARI-02 exists');
    assert(malari?.relocationDemand === 2300, `Malari relocation demand is 2,300 (got: ${malari?.relocationDemand})`);

    const totalDemand = demandNodes.reduce((acc, d) => acc + d.relocationDemand, 0);
    assert(totalDemand === 15450, `Total benchmark relocation demand is exactly 15,450 (got: ${totalDemand})`);

    // ------------------------------------------------------------
    // SUITE 5: Aggregate Capacity Summary
    // ------------------------------------------------------------
    console.log('\n--- Suite 5: Aggregate Capacity Summary ---');

    const summary = await getCapacitySummary();
    assert(summary.totalDemandPopulation === 15450, `Summary total demand is 15,450 (got: ${summary.totalDemandPopulation})`);
    assert(summary.totalSafeEffectiveCapacity === 37300, `Summary total safe effective capacity is 37,300 (got: ${summary.totalSafeEffectiveCapacity})`);
    assert(summary.totalRestrictedCapacity === 2800, `Summary total restricted capacity is 2,800 (got: ${summary.totalRestrictedCapacity})`);
    assert(summary.netCapacityBalance === 21850, `Summary net capacity balance is +21,850 (got: ${summary.netCapacityBalance})`);
    assert(summary.isDeficit === false, 'Summary isDeficit is false for baseline benchmark');
    assert(summary.safeSiteCount === 5, 'Summary safeSiteCount is 5');
    assert(summary.restrictedSiteCount === 1, 'Summary restrictedSiteCount is 1');
    assert(summary.uncertaintyNotes.length >= 3, 'Summary includes explicit uncertainty notes');

    // ------------------------------------------------------------
    // SUITE 6: Express REST API Endpoints (/api/v1/capacity)
    // ------------------------------------------------------------
    console.log('\n--- Suite 6: Express REST API Endpoints ---');

    const app = createApp();
    server = app.listen(0);
    const port = (server.address() as any).port;
    baseUrl = `http://localhost:${port}`;

    // Test GET /api/v1/capacity/sites
    const sitesRes = await fetch(`${baseUrl}/api/v1/capacity/sites`);
    assert(sitesRes.status === 200, 'GET /api/v1/capacity/sites returns 200 OK');
    const sitesData = await sitesRes.json();
    assert(sitesData.success === true, 'Response success is true');
    assert(sitesData.count === 6, `Sites API returns 6 candidate sites (got: ${sitesData.count})`);

    // Test GET /api/v1/capacity/sites/:siteId with benchmark ID SITE-001
    const pSiteRes = await fetch(`${baseUrl}/api/v1/capacity/sites/SITE-001`);
    assert(pSiteRes.status === 200, 'GET /api/v1/capacity/sites/SITE-001 returns 200 OK');
    const pSiteData = await pSiteRes.json();
    assert(pSiteData.data.siteName.includes('Pipalkoti'), 'SITE-001 resolves to Pipalkoti');
    assert(pSiteData.data.hardHazardExclusion === true, 'SITE-001 hardHazardExclusion is true');
    assert(pSiteData.data.usableCapacity === 0, 'SITE-001 usableCapacity is 0');

    // Test GET /api/v1/capacity/demand
    const demandRes = await fetch(`${baseUrl}/api/v1/capacity/demand`);
    assert(demandRes.status === 200, 'GET /api/v1/capacity/demand returns 200 OK');
    const demandData = await demandRes.json();
    assert(demandData.count === 5, `Demand API returns 5 nodes (got: ${demandData.count})`);

    // Test GET /api/v1/capacity/summary
    const sumRes = await fetch(`${baseUrl}/api/v1/capacity/summary`);
    assert(sumRes.status === 200, 'GET /api/v1/capacity/summary returns 200 OK');
    const sumData = await sumRes.json();
    assert(sumData.data.totalSafeEffectiveCapacity === 37300, 'Summary API reports 37,300 safe capacity');
    assert(sumData.data.totalDemandPopulation === 15450, 'Summary API reports 15,450 demand population');

    // Test POST /api/v1/capacity/recalculate
    const recalcRes = await fetch(`${baseUrl}/api/v1/capacity/recalculate`, { method: 'POST' });
    assert(recalcRes.status === 200, 'POST /api/v1/capacity/recalculate returns 200 OK');
    const recalcData = await recalcRes.json();
    assert(recalcData.sitesEvaluated === 6, 'Recalculate evaluated 6 sites');

    console.log('\n================================================================');
    console.log('  ALL 30/30 PHASE 7 CAPACITY ENGINE TESTS PASSED!');
    console.log('================================================================\n');
  } finally {
    if (server) {
      server.close();
    }
  }
}

// CLI execution entrypoint
const isMain = process.argv[1] === import.meta.filename;
if (isMain) {
  runCapacityTestSuite()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Fatal Capacity test error:', err);
      pool.end().finally(() => process.exit(1));
    });
}
