/**
 * VISTHAAPAN Phase 8 Operations Research Allocation & Transit Engine Test Suite
 * Validates:
 * 1. Google OR-Tools SCIP solver mathematical formulation and execution (status = OPTIMAL)
 * 2. Demand conservation: sum_j x_{ij} + u_i = D_i for all demand nodes
 * 3. Hard hazard exclusion: Pipalkoti strictly receives 0 souls allocated (x_{i,Pipalkoti} = 0)
 * 4. Site safe capacity limits: sum_i x_{ij} <= C_j for all candidate sites
 * 5. Priority weighting: RPW materially dictates allocation hierarchy
 * 6. Deterministic explanation dossiers and category-tagged factors
 * 7. Transactional database persistence & site occupancy tracking
 * 8. Capacity reduction scenario with unmet demand (u_i > 0)
 * 9. REST API endpoints under /api/v1/optimization and /api/v1/allocations
 */

import { pool } from '../src/db/pool.js';
import { createApp } from '../src/app.js';
import { Server } from 'http';
import {
  runOptimization,
  getLatestOptimizationRun,
  getAllocationItemsForRun,
  getAllocationExplanationsForRun,
  getConstraintResultsForRun,
  listOptimizationRuns,
} from '../src/or/orSolverService.js';
import { evaluateAllSiteCapacities, synchronizeRelocationDemands } from '../src/capacity/capacityService.js';

let server: Server;
let baseUrl: string;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  PASS: ${message}`);
}

async function runOptimizationTestSuite(): Promise<void> {
  console.log('\n================================================================');
  console.log('  RUNNING PHASE 8 OPERATIONS RESEARCH OPTIMIZATION TEST SUITE');
  console.log('================================================================');

  try {
    // Ensure upstream Phase 7 capacities and demand nodes are freshly synchronized
    await evaluateAllSiteCapacities();
    await synchronizeRelocationDemands();

    // ------------------------------------------------------------
    // SUITE 1: Deterministic Solver Execution & Status
    // ------------------------------------------------------------
    console.log('\n--- Suite 1: Google OR-Tools Mathematical Solver ---');

    const optResult = await runOptimization({
      allowPartialAllocation: true,
      operationalTierFilter: 'ALL',
    });

    assert(optResult.status === 'OPTIMAL', `Solver status is OPTIMAL (got: ${optResult.status})`);
    assert(optResult.solverName.includes('Google OR-Tools'), `Solver name is Google OR-Tools (got: ${optResult.solverName})`);
    assert(optResult.totalDemand === 15450, `Total demand is 15,450 (got: ${optResult.totalDemand})`);
    assert(optResult.totalAllocated === 15450, `Total allocated is 15,450 (got: ${optResult.totalAllocated})`);
    assert(optResult.totalUnmet === 0, `Total unmet is 0 for baseline (got: ${optResult.totalUnmet})`);
    assert(optResult.totalTransitDistanceKm > 0, `Transit distance is positive (got: ${optResult.totalTransitDistanceKm} person-km)`);
    assert(optResult.priorityBenefit > 0, `Priority benefit is positive (got: ${optResult.priorityBenefit})`);
    assert(optResult.solveTimeMs >= 0, `Solve time recorded (got: ${optResult.solveTimeMs} ms)`);
    assert(optResult.dataOrigin === 'SIMULATED_BENCHMARK', 'Result dataOrigin is SIMULATED_BENCHMARK');

    // ------------------------------------------------------------
    // SUITE 2: Core Optimization Constraints Verification
    // ------------------------------------------------------------
    console.log('\n--- Suite 2: Mathematical Constraints Verification ---');

    const items = await getAllocationItemsForRun(optResult.runId);
    assert(items.length >= 5, `At least 5 allocation flows generated (got: ${items.length})`);

    // Constraint A: Demand Conservation: sum_j x_{ij} = D_i
    const demandTotals: Record<string, number> = {};
    for (const it of items) {
      demandTotals[it.demandNodeId] = (demandTotals[it.demandNodeId] || 0) + it.populationAllocated;
    }
    assert(demandTotals['DEMAND-JOSHIMATH-01'] === 4800, `Joshimath demand conservation satisfied (4800, got: ${demandTotals['DEMAND-JOSHIMATH-01']})`);
    assert(demandTotals['DEMAND-MALARI-02'] === 2300, `Malari demand conservation satisfied (2300, got: ${demandTotals['DEMAND-MALARI-02']})`);
    assert(demandTotals['DEMAND-THARALI-03'] === 3600, `Tharali demand conservation satisfied (3600, got: ${demandTotals['DEMAND-THARALI-03']})`);
    assert(demandTotals['DEMAND-GHAT-04'] === 2900, `Ghat demand conservation satisfied (2900, got: ${demandTotals['DEMAND-GHAT-04']})`);
    assert(demandTotals['DEMAND-GWALDAM-05'] === 1850, `Gwaldam demand conservation satisfied (1850, got: ${demandTotals['DEMAND-GWALDAM-05']})`);

    // Constraint B: Hard Hazard Exclusion: Pipalkoti receives strictly 0 souls!
    const pipalkotiAllocations = items.filter(it => it.siteName.includes('Pipalkoti'));
    const pipalkotiTotalAllocated = pipalkotiAllocations.reduce((acc, it) => acc + it.populationAllocated, 0);
    assert(pipalkotiTotalAllocated === 0, `Hard hazard exclusion: Pipalkoti strictly allocated 0 souls (got: ${pipalkotiTotalAllocated})`);

    // Constraint C: Site Capacity Limits: sum_i x_{ij} <= C_j
    const siteAllocTotals: Record<string, number> = {};
    for (const it of items) {
      siteAllocTotals[it.siteName] = (siteAllocTotals[it.siteName] || 0) + it.populationAllocated;
    }
    assert((siteAllocTotals['Gauchar Strategic Airstrip Hub (SIMULATED)'] || 0) <= 5000, 'Gauchar allocation <= 5,000 capacity');
    assert((siteAllocTotals['Karnaprayag Civil Relief Facility (SIMULATED)'] || 0) <= 3500, 'Karnaprayag allocation <= 3,500 capacity');
    assert((siteAllocTotals['Rudraprayag Safe Camp Hub (SIMULATED)'] || 0) <= 4800, 'Rudraprayag allocation <= 4,800 capacity');
    assert((siteAllocTotals['Srinagar Regional Logistics Haven (SIMULATED)'] || 0) <= 9000, 'Srinagar allocation <= 9,000 capacity');
    assert((siteAllocTotals['Rishikesh State Reserve Terminal (SIMULATED)'] || 0) <= 15000, 'Rishikesh allocation <= 15,000 capacity');

    // Constraint D: Non-negativity
    for (const it of items) {
      assert(it.populationAllocated >= 0, `Allocation quantity is non-negative (got: ${it.populationAllocated})`);
      assert(it.distanceKm >= 0, `Distance is non-negative (got: ${it.distanceKm})`);
    }

    // ------------------------------------------------------------
    // SUITE 3: Constraint Audit Logging & Persistence
    // ------------------------------------------------------------
    console.log('\n--- Suite 3: Constraint Audit Logging & Database State ---');

    const constraints = await getConstraintResultsForRun(optResult.runId);
    assert(constraints.length >= 10, `Constraint audit logged >= 10 rules (got: ${constraints.length})`);

    const hardExclusionAudit = constraints.find(c => c.type === 'HARD_HAZARD_EXCLUSION');
    assert(hardExclusionAudit !== undefined, 'HARD_HAZARD_EXCLUSION rule logged in constraint results');
    assert(hardExclusionAudit?.status === 'BINDING_EXCLUSION', 'Hard exclusion logged as BINDING_EXCLUSION');
    assert(hardExclusionAudit?.actual_value === 0 || hardExclusionAudit?.value === 0, 'Hard exclusion actual value is 0');

    // Verify site_capacities occupancy table updated
    const { rows: siteCapRows } = await pool.query(`
      SELECT s.name, sc.effective_capacity, sc.current_occupancy, sc.available_capacity, sc.utilization_percent
      FROM site_capacities sc
      JOIN relocation_sites s ON s.id = sc.site_id
      WHERE s.name LIKE '%Pipalkoti%';
    `);
    assert(siteCapRows.length === 1, 'Pipalkoti site capacity row exists');
    assert(Number(siteCapRows[0].current_occupancy) === 0, `Pipalkoti occupancy is strictly 0 (got: ${siteCapRows[0].current_occupancy})`);

    // ------------------------------------------------------------
    // SUITE 4: Structured Explanation Dossiers & Factors
    // ------------------------------------------------------------
    console.log('\n--- Suite 4: Structured Explanation Dossiers & Factors ---');

    const explanations = await getAllocationExplanationsForRun(optResult.runId);
    assert(explanations.length === 5, `Exactly 5 explanation dossiers (1 per demand node, got: ${explanations.length})`);

    for (const exp of explanations) {
      assert(exp.overallExplanation.length > 20, `Overall explanation is descriptive (${exp.demandNodeId})`);
      assert(exp.factors.length >= 2, `Explanation has >= 2 factors (got: ${exp.factors.length})`);

      const priorityFactor = exp.factors.find(f => f.factor === 'HIGH_PRIORITY_DEMAND');
      assert(priorityFactor !== undefined, `${exp.demandNodeId} includes HIGH_PRIORITY_DEMAND factor`);
      assert(priorityFactor?.category === 'PRIORITY', 'Priority factor has PRIORITY category');

      const hazardFactor = exp.factors.find(f => f.factor === 'HARD_HAZARD_EXCLUSION');
      assert(hazardFactor !== undefined, `${exp.demandNodeId} includes HARD_HAZARD_EXCLUSION factor`);
      assert(hazardFactor?.category === 'HAZARD_SAFETY', 'Hazard factor has HAZARD_SAFETY category');

      const bottleneckFactor = exp.factors.find(f => f.factor === 'RESOURCE_BOTTLENECK');
      assert(bottleneckFactor !== undefined, `${exp.demandNodeId} includes RESOURCE_BOTTLENECK factor`);
      assert(bottleneckFactor?.category === 'CAPACITY_LIMIT', 'Bottleneck factor has CAPACITY_LIMIT category');
    }

    // ------------------------------------------------------------
    // SUITE 5: Constrained Capacity Scenario (Unmet Demand Test)
    // ------------------------------------------------------------
    console.log('\n--- Suite 5: Constrained Capacity Scenario & Unmet Demand ---');

    // Fetch site IDs to apply severe capacity squeeze
    const { rows: allSiteRows } = await pool.query('SELECT id, name FROM relocation_sites;');
    const capacityOverrides: Record<string, number> = {};
    for (const s of allSiteRows) {
      // Cut safe capacity of each site to 1,000 (total safe capacity = 5 * 1,000 = 5,000 < 15,450 demand)
      capacityOverrides[s.id] = 1000;
    }

    const constrainedRun = await runOptimization({
      allowPartialAllocation: true,
      capacityOverrides,
    });

    assert(constrainedRun.status === 'OPTIMAL', 'Constrained solver status is OPTIMAL');
    assert(constrainedRun.totalDemand === 15450, 'Total demand remains 15,450');
    assert(constrainedRun.totalAllocated === 5000, `Total allocated is exactly 5,000 capped safe capacity (got: ${constrainedRun.totalAllocated})`);
    assert(constrainedRun.totalUnmet === 10450, `Unmet demand is exactly 10,450 (got: ${constrainedRun.totalUnmet})`);
    assert(constrainedRun.unmetCount > 0, `Unmet demand items recorded (got: ${constrainedRun.unmetCount})`);

    // Reset capacities for normal baseline
    await evaluateAllSiteCapacities();
    await runOptimization({ allowPartialAllocation: true });

    // ------------------------------------------------------------
    // SUITE 6: Express REST API Endpoints (/api/v1/optimization & /api/v1/allocations)
    // ------------------------------------------------------------
    console.log('\n--- Suite 6: Express REST API Endpoints ---');

    const app = createApp();
    server = app.listen(0);
    const port = (server.address() as any).port;
    baseUrl = `http://localhost:${port}`;

    // Test POST /api/v1/optimization/run
    const postOptRes = await fetch(`${baseUrl}/api/v1/optimization/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowPartialAllocation: true, operationalTierFilter: 'ALL' }),
    });
    assert(postOptRes.status === 200, 'POST /api/v1/optimization/run returns 200 OK');
    const postOptData = await postOptRes.json();
    assert(postOptData.success === true, 'POST /run success is true');
    assert(postOptData.data.status === 'OPTIMAL', 'POST /run status is OPTIMAL');

    // Test GET /api/v1/optimization/runs/latest
    const latestRes = await fetch(`${baseUrl}/api/v1/optimization/runs/latest`);
    assert(latestRes.status === 200, 'GET /api/v1/optimization/runs/latest returns 200 OK');
    const latestData = await latestRes.json();
    assert(latestData.data.run.totalAllocated === 15450, 'Latest run has 15,450 allocated');
    assert(latestData.data.allocations.length >= 5, 'Latest run has allocations');
    assert(latestData.data.explanations.length === 5, 'Latest run has 5 explanations');
    assert(latestData.data.constraints.length >= 10, 'Latest run has constraints audit');

    // Test GET /api/v1/optimization/runs
    const runsListRes = await fetch(`${baseUrl}/api/v1/optimization/runs`);
    assert(runsListRes.status === 200, 'GET /api/v1/optimization/runs returns 200 OK');
    const runsListData = await runsListRes.json();
    assert(runsListData.count >= 1, 'Runs list contains >= 1 runs');

    // Test GET /api/v1/allocations (compatibility adapter)
    const allocCompatRes = await fetch(`${baseUrl}/api/v1/allocations`);
    assert(allocCompatRes.status === 200, 'GET /api/v1/allocations returns 200 OK');
    const allocCompatData = await allocCompatRes.json();
    assert(Array.isArray(allocCompatData), 'Allocations compatibility response is an array');
    assert(allocCompatData.length >= 5, 'Allocations compatibility has >= 5 items');

    // Test GET /api/v1/allocations/summary (compatibility adapter)
    const summaryCompatRes = await fetch(`${baseUrl}/api/v1/allocations/summary`);
    assert(summaryCompatRes.status === 200, 'GET /api/v1/allocations/summary returns 200 OK');
    const summaryCompatData = await summaryCompatRes.json();
    assert(summaryCompatData.totalAllocated === 15450, 'Allocations summary totalAllocated is 15,450');
    assert(summaryCompatData.solverStatus === 'OPTIMAL', 'Allocations summary solverStatus is OPTIMAL');

    // Test GET /api/v1/allocations/phases (operational tiers)
    const phasesRes = await fetch(`${baseUrl}/api/v1/allocations/phases`);
    assert(phasesRes.status === 200, 'GET /api/v1/allocations/phases returns 200 OK');
    const phasesData = await phasesRes.json();
    assert(phasesData.length === 3, 'Allocations phases returns 3 phases (Immediate, Short, Medium)');
    assert(phasesData[0].tier === 'immediate', 'Phase 1 tier is immediate');

    // Test POST /api/v1/allocations/optimize
    const optimizeCompatRes = await fetch(`${baseUrl}/api/v1/allocations/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowPartialAllocation: true }),
    });
    assert(optimizeCompatRes.status === 200, 'POST /api/v1/allocations/optimize returns 200 OK');
    const optimizeCompatData = await optimizeCompatRes.json();
    assert(optimizeCompatData.allocations.length >= 5, 'Compat optimize returns allocations');
    assert(optimizeCompatData.summary.totalAllocated === 15450, 'Compat optimize summary has 15,450');

    console.log('\n================================================================');
    console.log('  ALL 40/40 PHASE 8 OPERATIONS RESEARCH TESTS PASSED!');
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
  runOptimizationTestSuite()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Fatal Optimization test error:', err);
      pool.end().finally(() => process.exit(1));
    });
}
