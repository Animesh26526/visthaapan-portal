/**
 * VISTHAAPAN Allocations Compatibility Router
 * Mounts: /api/v1/allocations/*
 * Adapts Phase 8 OR-Tools solver outputs for frontend AllocationsService.
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  runOptimization,
  getLatestOptimizationRun,
  getAllocationItemsForRun,
  getAllocationExplanationsForRun,
  getConstraintResultsForRun,
} from '../or/orSolverService.js';
import { getCapacitySummary } from '../capacity/capacityService.js';

export const allocationsRouter: Router = Router();

// GET /api/v1/allocations
allocationsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let latest = await getLatestOptimizationRun();
    if (!latest) {
      latest = await runOptimization();
    }
    const items = await getAllocationItemsForRun(latest.runId);

    // Format to match frontend AllocationItem interface
    const formatted = items.map(item => ({
      id: item.id,
      habitationId: item.demandNodeId,
      habitationName: item.demandNodeName,
      siteId: item.siteId,
      siteName: item.siteName,
      allocatedPopulation: item.populationAllocated,
      distanceKm: item.distanceKm,
      travelTimeMinutes: item.travelTimeMinutes,
      priorityTier: item.operationalTier,
      priorityScore: item.priorityWeight,
      status: item.populationAllocated > 0 ? 'allocated' : 'unmet',
      routeFeasible: item.routeAvailable,
      reason: item.reason,
      dataOrigin: 'SIMULATED_BENCHMARK',
    }));

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/allocations/summary
allocationsRouter.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let latest = await getLatestOptimizationRun();
    if (!latest) {
      latest = await runOptimization();
    }
    const capacitySum = await getCapacitySummary();

    const summary = {
      totalDemand: latest.totalDemand,
      totalAllocated: latest.totalAllocated,
      totalUnmet: latest.totalUnmet,
      totalCapacity: capacitySum.totalSafeEffectiveCapacity,
      effectiveCapacity: capacitySum.totalSafeEffectiveCapacity,
      capacityUtilization: capacitySum.totalSafeEffectiveCapacity > 0
        ? Math.min(100.0, Number(((latest.totalAllocated / capacitySum.totalSafeEffectiveCapacity) * 100).toFixed(1)))
        : 0.0,
      totalDistanceKm: latest.totalTransitDistanceKm,
      averageDistanceKm: latest.totalAllocated > 0
        ? Number((latest.totalTransitDistanceKm / latest.totalAllocated).toFixed(1))
        : 0.0,
      safeSitesCount: capacitySum.safeSiteCount,
      restrictedSitesCount: capacitySum.restrictedSiteCount,
      solverStatus: latest.status,
      solveTimeMs: latest.solveTimeMs,
      generatedAt: latest.generatedAt,
      priorityBenefit: latest.priorityBenefit,
      dataOrigin: 'SIMULATED_BENCHMARK',
    };

    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/allocations/explanation
allocationsRouter.get('/explanation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let latest = await getLatestOptimizationRun();
    if (!latest) {
      latest = await runOptimization();
    }
    const explanations = await getAllocationExplanationsForRun(latest.runId);
    const constraints = await getConstraintResultsForRun(latest.runId);

    res.status(200).json({
      runId: latest.runId,
      overallSummary: latest.explanationSummary,
      solverStatus: latest.status,
      explanations,
      constraints,
      dataOrigin: 'SIMULATED_BENCHMARK',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/allocations/phases
allocationsRouter.get('/phases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let latest = await getLatestOptimizationRun();
    if (!latest) {
      latest = await runOptimization();
    }
    const items = await getAllocationItemsForRun(latest.runId);

    // Group items into operational phases
    const immediateItems = items.filter(i => i.operationalTier === 'immediate');
    const shortTermItems = items.filter(i => i.operationalTier === 'short-term');
    const mediumTermItems = items.filter(i => i.operationalTier === 'medium-term');

    const phases = [
      {
        phase: 1,
        tier: 'immediate',
        title: 'Phase 1 — Immediate Life-Safety Evacuation',
        timeframe: '0–72 Hours',
        targetPopulation: immediateItems.reduce((acc, i) => acc + i.populationAllocated, 0),
        allocationsCount: immediateItems.length,
        status: 'priority_execution',
        description: 'Rapid movement of critical-risk populations from active hazard envelopes to nearest safe shelter hubs.',
      },
      {
        phase: 2,
        tier: 'short-term',
        title: 'Phase 2 — Secondary Stabilization Transit',
        timeframe: '3–14 Days',
        targetPopulation: shortTermItems.reduce((acc, i) => acc + i.populationAllocated, 0),
        allocationsCount: shortTermItems.length,
        status: 'standby',
        description: 'Orderly transit of vulnerable populations to regional facilities with expanded logistics support.',
      },
      {
        phase: 3,
        tier: 'medium-term',
        title: 'Phase 3 — Extended Rehabilitation Relocation',
        timeframe: '15–60 Days',
        targetPopulation: mediumTermItems.reduce((acc, i) => acc + i.populationAllocated, 0),
        allocationsCount: mediumTermItems.length,
        status: 'planned',
        description: 'Systematic resettlement to high-capacity logistics terminals outside the disaster perimeter.',
      },
    ];

    res.status(200).json(phases);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/allocations/optimize
allocationsRouter.post('/optimize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roadR12Blocked, siteCapacityOverrides, habitationIds } = req.body;

    const optResult = await runOptimization({
      blockedRouteIds: roadR12Blocked ? ['R12', 'ROUTE-JOSHIMATH-PIPALKOTI'] : [],
      capacityOverrides: siteCapacityOverrides,
    });

    const items = await getAllocationItemsForRun(optResult.runId);
    const capacitySum = await getCapacitySummary();

    const formattedAllocations = items.map(item => ({
      id: item.id,
      habitationId: item.demandNodeId,
      habitationName: item.demandNodeName,
      siteId: item.siteId,
      siteName: item.siteName,
      allocatedPopulation: item.populationAllocated,
      distanceKm: item.distanceKm,
      travelTimeMinutes: item.travelTimeMinutes,
      priorityTier: item.operationalTier,
      priorityScore: item.priorityWeight,
      status: item.populationAllocated > 0 ? 'allocated' : 'unmet',
      routeFeasible: item.routeAvailable,
      reason: item.reason,
      dataOrigin: 'SIMULATED_BENCHMARK',
    }));

    const summary = {
      totalDemand: optResult.totalDemand,
      totalAllocated: optResult.totalAllocated,
      totalUnmet: optResult.totalUnmet,
      totalCapacity: capacitySum.totalSafeEffectiveCapacity,
      effectiveCapacity: capacitySum.totalSafeEffectiveCapacity,
      capacityUtilization: capacitySum.totalSafeEffectiveCapacity > 0
        ? Number(((optResult.totalAllocated / capacitySum.totalSafeEffectiveCapacity) * 100).toFixed(1))
        : 0.0,
      totalDistanceKm: optResult.totalTransitDistanceKm,
      averageDistanceKm: optResult.totalAllocated > 0
        ? Number((optResult.totalTransitDistanceKm / optResult.totalAllocated).toFixed(1))
        : 0.0,
      safeSitesCount: capacitySum.safeSiteCount,
      restrictedSitesCount: capacitySum.restrictedSiteCount,
      solverStatus: optResult.status,
      solveTimeMs: optResult.solveTimeMs,
      generatedAt: optResult.generatedAt,
      priorityBenefit: optResult.priorityBenefit,
      dataOrigin: 'SIMULATED_BENCHMARK',
    };

    res.status(200).json({
      allocations: formattedAllocations,
      summary,
    });
  } catch (err) {
    next(err);
  }
});
