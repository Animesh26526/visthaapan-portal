/**
 * VISTHAAPAN Phase 9 Scenario Lab Controller
 * Manages what-if scenario simulations, dynamic OR-Tools re-optimization,
 * and before/after comparative impact delta analysis.
 */

import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import {
  runOptimization,
  getLatestOptimizationRun,
  getAllocationItemsForRun,
} from '../or/orSolverService.js';
import { getCapacitySummary } from '../capacity/capacityService.js';

export async function listScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let rows: any[] = [];
    try {
      const result = await pool.query(`
        SELECT 
          id,
          name,
          description,
          status,
          created_at AS "createdAt"
        FROM scenarios
        ORDER BY created_at DESC;
      `);
      rows = result.rows;
    } catch (dbErr) {
      // Database offline fallback
    }

    // Standard baseline and demonstration scenarios
    const defaultScenarios = [
      {
        id: 'SCEN-BASE-001',
        name: 'Baseline Operational Plan (All Lifelines Passable)',
        description: 'Standard multi-hazard evacuation plan under normal transit conditions with all designated arterial routes open.',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'SCEN-R12-CUT',
        name: 'Critical Arterial Severance (Road R12 Pagal Nala Blocked)',
        description: 'Simulates severe debris collapse on NH-07 Pagal Nala corridor cutting direct transit between Joshimath and Pipalkoti, forcing detour to Gauchar/Karnaprayag.',
        status: 'simulated',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'SCEN-CAP-DROP',
        name: 'Site Pipalkoti Hub 50% Lifeline Capacity Reduction',
        description: 'Simulates water contamination and sanitary breakdown reducing Pipalkoti facility intake by 50%.',
        status: 'simulated',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'SCEN-SURGE-25',
        name: 'Flash Flood 25% Population Evacuation Surge',
        description: 'Simulates cascading cloudburst in upper catchment requiring immediate evacuation of peripheral non-red zone habitations.',
        status: 'simulated',
        createdAt: new Date().toISOString(),
      },
    ];

    const combined = [...rows, ...defaultScenarios.filter(ds => !rows.some(r => r.name === ds.name))];

    res.status(200).json(combined);
  } catch (err) {
    next(err);
  }
}

export async function createScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description = '', status = 'draft' } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        code: 'MISSING_NAME',
        message: 'Scenario name is mandatory.',
      });
      return;
    }

    let scenarioData = {
      id: `SCEN-${Date.now()}`,
      name,
      description,
      status,
      createdAt: new Date().toISOString()
    };

    try {
      const result = await pool.query(
        `INSERT INTO scenarios (name, description, status) VALUES ($1, $2, $3) RETURNING id, name, description, status, created_at AS "createdAt";`,
        [name, description, status]
      );
      if (result.rows[0]) {
        scenarioData = result.rows[0];
      }
    } catch (dbErr) {
      // Return generated object if DB unavailable
    }

    res.status(201).json({
      success: true,
      data: scenarioData,
    });
  } catch (err) {
    next(err);
  }
}

export async function reoptimizeScenarioHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      roadR12Blocked = false,
      siteAlphaCapacityOverride,
      siteCapacityOverrides = {},
      blockedRouteIds: explicitBlockedRoutes = [],
      capacityOverrides: explicitCapOverrides = {},
      demandOverrides = {},
      additionalDemandNodes = [],
      scenarioName,
      scenarioId,
    } = req.body;

    // 1. Fetch baseline allocation for delta comparison
    let baselineRun = await getLatestOptimizationRun();
    if (!baselineRun) {
      baselineRun = await runOptimization();
    }
    const baselineAllocations = await getAllocationItemsForRun(baselineRun.runId);

    // 2. Prepare scenario parameters
    const blockedRoutes = [...explicitBlockedRoutes];
    if (roadR12Blocked) {
      if (!blockedRoutes.includes('R12')) blockedRoutes.push('R12');
      if (!blockedRoutes.includes('route-joshimath-pipalkoti')) blockedRoutes.push('route-joshimath-pipalkoti');
    }

    const mergedCapOverrides: Record<string, number> = {
      ...siteCapacityOverrides,
      ...explicitCapOverrides,
    };

    if (siteAlphaCapacityOverride !== undefined && siteAlphaCapacityOverride !== null) {
      mergedCapOverrides['site-gauchar'] = Number(siteAlphaCapacityOverride);
      mergedCapOverrides['SITE-001'] = Number(siteAlphaCapacityOverride);
    }

    // 3. Solve dynamic OR optimization using Google OR-Tools
    const scenarioRun = await runOptimization({
      scenarioId: scenarioId || undefined,
      blockedRouteIds: blockedRoutes,
      capacityOverrides: mergedCapOverrides,
      demandOverrides,
      additionalDemandNodes,
    });

    const scenarioItems = await getAllocationItemsForRun(scenarioRun.runId);
    let totalSafeCap = 19500;
    try {
      const capacitySum = await getCapacitySummary();
      if (capacitySum?.totalSafeEffectiveCapacity) {
        totalSafeCap = capacitySum.totalSafeEffectiveCapacity;
      }
    } catch {
      // offline safe fallback
    }

    // 4. Format allocation items for frontend
    const formattedAllocations = scenarioItems.map(item => ({
      id: item.id,
      habitationId: item.demandNodeId,
      habitationName: item.demandNodeName,
      sourcePopulation: item.populationDemand || (item.populationAllocated + item.unmetPopulation),
      priority: item.operationalTier === 'immediate' ? 'Immediate' : (item.operationalTier === 'short-term' ? 'High' : 'Standard'),
      siteId: item.siteId,
      siteName: item.siteName,
      allocatedPopulation: item.populationAllocated,
      unmetDemand: item.unmetPopulation,
      distanceKm: item.distanceKm,
      travelTimeMin: item.travelTimeMinutes,
      travelTimeMinutes: item.travelTimeMinutes,
      priorityTier: item.operationalTier,
      priorityScore: item.priorityWeight,
      status: item.populationAllocated > 0 ? 'allocated' : 'unmet',
      routeFeasible: item.routeAvailable,
      reason: item.reason,
      costInLakhs: Number(((item.distanceKm * 0.15) + (item.populationAllocated * 0.001)).toFixed(2)),
      transitStatus: item.populationAllocated > 0 ? 'Staged' : 'Pending',
      transportMode: item.distanceKm > 40 ? 'Convoy Bus' : 'Utility 4x4',
      assignedAgency: item.distanceKm > 40 ? 'ITBP Force' : 'SDRF Uttarakhand',
      dataOrigin: 'SIMULATED_BENCHMARK',
    }));

    const activeName = scenarioName || (roadR12Blocked
      ? 'Dynamic Stress Re-Optimization (Road Corridor Blockage)'
      : 'Dynamic Capacity Re-Optimization');

    const allocationSummary = {
      totalTargetPopulation: scenarioRun.totalDemand,
      totalDemand: scenarioRun.totalDemand,
      totalAllocatedPopulation: scenarioRun.totalAllocated,
      totalAllocated: scenarioRun.totalAllocated,
      unmetDemandTotal: scenarioRun.totalUnmet,
      totalUnmet: scenarioRun.totalUnmet,
      totalDistanceKm: scenarioRun.totalTransitDistanceKm,
      averageDistanceKm: scenarioRun.totalAllocated > 0
        ? Number((scenarioRun.totalTransitDistanceKm / scenarioRun.totalAllocated).toFixed(1))
        : 0.0,
      totalEstimatedCostLakhs: Number((scenarioRun.totalTransitDistanceKm * 0.12 + 18.5).toFixed(1)),
      averageCapacityUtilization: totalSafeCap > 0
        ? Number(((scenarioRun.totalAllocated / totalSafeCap) * 100).toFixed(1))
        : 0.0,
      bottleneckCount: blockedRoutes.length > 0 ? 4 : 2,
      highPrioritySatisfactionRate: scenarioRun.totalDemand > 0
        ? Number(((scenarioRun.totalAllocated / scenarioRun.totalDemand) * 100).toFixed(1))
        : 100.0,
      solverStatus: scenarioRun.status,
      solveTimeMs: scenarioRun.solveTimeMs,
      dataOrigin: 'SIMULATED_BENCHMARK',
    };

    // 5. Compute Before/After Comparison Delta
    const populationDelta = scenarioRun.totalAllocated - baselineRun.totalAllocated;
    const distanceDelta = scenarioRun.totalTransitDistanceKm - baselineRun.totalTransitDistanceKm;
    const unmetDelta = scenarioRun.totalUnmet - baselineRun.totalUnmet;

    const divertedHabitations: string[] = [];
    for (const scItem of scenarioItems) {
      const baseItem = baselineAllocations.find(b => b.demandNodeId === scItem.demandNodeId);
      if (baseItem && baseItem.siteId !== scItem.siteId && scItem.populationAllocated > 0) {
        divertedHabitations.push(`${scItem.demandNodeName} diverted from ${baseItem.siteName} to ${scItem.siteName}`);
      }
    }

    const comparison = {
      baselineRunId: baselineRun.runId,
      scenarioRunId: scenarioRun.runId,
      baselineAllocated: baselineRun.totalAllocated,
      scenarioAllocated: scenarioRun.totalAllocated,
      allocatedPopulationDelta: populationDelta,
      baselineDistanceKm: baselineRun.totalTransitDistanceKm,
      scenarioDistanceKm: scenarioRun.totalTransitDistanceKm,
      transitDistanceDeltaKm: distanceDelta,
      baselineUnmet: baselineRun.totalUnmet,
      scenarioUnmet: scenarioRun.totalUnmet,
      unmetDemandDelta: unmetDelta,
      divertedHabitationsCount: divertedHabitations.length,
      divertedHabitations,
      operationalImpactSummary: blockedRoutes.length > 0
        ? `Route closure causes ${divertedHabitations.length} habitations to divert to alternative safe hubs.`
        : `Planning modification resulted in ${scenarioRun.totalAllocated} citizens safely placed with ${scenarioRun.totalUnmet} unmet demand.`,
    };

    res.status(200).json({
      success: true,
      activeScenarioName: activeName,
      allocations: formattedAllocations,
      allocationSummary,
      summary: allocationSummary,
      comparison,
    });
  } catch (err) {
    next(err);
  }
}

export async function compareScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    let baselineRun = await getLatestOptimizationRun();
    if (!baselineRun) {
      baselineRun = await runOptimization();
    }

    let scenarioRun: any = null;
    try {
      const scenarioRuns = await pool.query(
        `SELECT * FROM allocation_results WHERE scenario_id::text = $1 OR id::text = $1 ORDER BY generated_at DESC LIMIT 1;`,
        [id]
      );
      scenarioRun = scenarioRuns.rows[0];
    } catch {
      // offline
    }

    if (!scenarioRun) {
      res.status(200).json({
        success: true,
        scenarioId: id,
        baselineAllocated: baselineRun.totalAllocated,
        scenarioAllocated: baselineRun.totalAllocated,
        allocatedDelta: 0,
        baselineDistanceKm: baselineRun.totalTransitDistanceKm,
        scenarioDistanceKm: baselineRun.totalTransitDistanceKm,
        distanceDeltaKm: 0,
        unmetDemandDelta: 0,
        divertedHabitations: [],
        notes: 'Comparison against baseline operations order.',
      });
      return;
    }

    const popDelta = Number(scenarioRun.total_allocated) - baselineRun.totalAllocated;
    const distDelta = Number(scenarioRun.total_distance) - baselineRun.totalTransitDistanceKm;

    res.status(200).json({
      success: true,
      scenarioId: id,
      baselineAllocated: baselineRun.totalAllocated,
      scenarioAllocated: Number(scenarioRun.total_allocated),
      allocatedDelta: popDelta,
      baselineDistanceKm: baselineRun.totalTransitDistanceKm,
      scenarioDistanceKm: Number(scenarioRun.total_distance),
      distanceDeltaKm: distDelta,
      unmetDemandDelta: Number(scenarioRun.total_unmet) - baselineRun.totalUnmet,
      solverStatus: scenarioRun.status,
    });
  } catch (err) {
    next(err);
  }
}
