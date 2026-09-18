/**
 * VISTHAAPAN Phase 7 Capacity Assessment Controller
 * Exposes REST endpoints for candidate site carrying capacities, resource bottlenecks,
 * and relocation demand nodes.
 */

import { Request, Response, NextFunction } from 'express';
import {
  getSiteCapacityAssessments,
  evaluateAllSiteCapacities,
  getRelocationDemandNodes,
  synchronizeRelocationDemands,
  getCapacitySummary,
} from '../capacity/capacityService.js';

export async function getSitesCapacity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assessments = await getSiteCapacityAssessments();
    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSiteCapacityById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { siteId } = req.params;
    const assessments = await getSiteCapacityAssessments();

    // Map benchmark codes SITE-001..SITE-006 if requested
    const benchmarkMap: Record<string, string> = {
      'SITE-001': 'Pipalkoti',
      'SITE-002': 'Gauchar',
      'SITE-003': 'Karnaprayag',
      'SITE-004': 'Rudraprayag',
      'SITE-005': 'Srinagar',
      'SITE-006': 'Rishikesh',
    };

    const targetName = benchmarkMap[siteId.toUpperCase()];

    const site = assessments.find(
      s => s.siteId === siteId || (targetName && s.siteName.toLowerCase().includes(targetName.toLowerCase()))
    );

    if (!site) {
      res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: `Candidate site '${siteId}' not found in capacity registry.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: site,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDemandNodes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tier } = req.query;
    let nodes = await getRelocationDemandNodes();

    if (tier && typeof tier === 'string') {
      nodes = nodes.filter(n => n.operationalTier.toLowerCase() === tier.toLowerCase());
    }

    res.status(200).json({
      success: true,
      count: nodes.length,
      data: nodes,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCapacitySummaryMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await getCapacitySummary();
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}

export async function recalculateCapacities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assessments = await evaluateAllSiteCapacities();
    const demands = await synchronizeRelocationDemands();
    const summary = await getCapacitySummary();

    res.status(200).json({
      success: true,
      message: 'Phase 7 capacities, bottlenecks, and demand nodes recalculated successfully.',
      sitesEvaluated: assessments.length,
      demandsSynchronized: demands.length,
      summary,
    });
  } catch (err) {
    next(err);
  }
}
