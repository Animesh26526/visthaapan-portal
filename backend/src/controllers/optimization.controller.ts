/**
 * VISTHAAPAN Phase 8 Optimization Controller
 * Exposes REST endpoints for executing Google OR-Tools allocations,
 * querying results, explanations, and constraint validation audits.
 */

import { Request, Response, NextFunction } from 'express';
import {
  runOptimization,
  getLatestOptimizationRun,
  getAllocationItemsForRun,
  getAllocationExplanationsForRun,
  getConstraintResultsForRun,
  listOptimizationRuns,
} from '../or/orSolverService.js';
import { pool } from '../db/pool.js';

export async function runOptimizationHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      scenarioId,
      allowPartialAllocation,
      maxDistanceKm,
      operationalTierFilter,
      blockedRouteIds,
      capacityOverrides,
    } = req.body;

    const result = await runOptimization({
      scenarioId,
      allowPartialAllocation: allowPartialAllocation ?? true,
      maxDistanceKm,
      operationalTierFilter,
      blockedRouteIds,
      capacityOverrides,
    });

    res.status(200).json({
      success: true,
      message: 'Phase 8 Operations Research optimization solved and persisted successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLatestRunHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let latest = await getLatestOptimizationRun();

    // If no run exists, execute baseline optimization automatically
    if (!latest) {
      latest = await runOptimization();
    }

    const allocations = await getAllocationItemsForRun(latest.runId);
    const explanations = await getAllocationExplanationsForRun(latest.runId);
    const constraints = await getConstraintResultsForRun(latest.runId);

    res.status(200).json({
      success: true,
      data: {
        run: latest,
        allocations,
        explanations,
        constraints,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listRunsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const runs = await listOptimizationRuns();
    res.status(200).json({
      success: true,
      count: runs.length,
      data: runs,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRunByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { runId } = req.params;

    const runRes = await pool.query(
      'SELECT * FROM allocation_results WHERE id = $1;',
      [runId]
    );

    if (runRes.rowCount === 0) {
      res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: `Optimization run '${runId}' not found.`,
      });
      return;
    }

    const row = runRes.rows[0];
    const allocations = await getAllocationItemsForRun(runId);
    const explanations = await getAllocationExplanationsForRun(runId);
    const constraints = await getConstraintResultsForRun(runId);

    res.status(200).json({
      success: true,
      data: {
        run: {
          runId: row.id,
          status: row.status.toUpperCase(),
          generatedAt: row.generated_at.toISOString(),
          totalDemand: Number(row.total_demand),
          totalAllocated: Number(row.total_allocated),
          totalUnmet: Number(row.total_unmet),
          totalTransitDistanceKm: Number(row.total_distance),
          priorityBenefit: Number(row.priority_benefit),
          solverName: row.solver_name,
          solverVersion: row.solver_version,
          solveTimeMs: Number(row.solve_time_ms),
          scenarioId: row.scenario_id,
          operationalTierFilter: row.operational_tier_filter,
          explanationSummary: row.explanation_summary,
          dataOrigin: row.data_origin,
          uncertaintyFlags: row.uncertainty_flags,
        },
        allocations,
        explanations,
        constraints,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllocationsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { runId } = req.params;
    const allocations = await getAllocationItemsForRun(runId);
    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations,
    });
  } catch (err) {
    next(err);
  }
}

export async function getExplanationsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { runId } = req.params;
    const explanations = await getAllocationExplanationsForRun(runId);
    res.status(200).json({
      success: true,
      count: explanations.length,
      data: explanations,
    });
  } catch (err) {
    next(err);
  }
}

export async function getConstraintsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { runId } = req.params;
    const constraints = await getConstraintResultsForRun(runId);
    res.status(200).json({
      success: true,
      count: constraints.length,
      data: constraints,
    });
  } catch (err) {
    next(err);
  }
}
