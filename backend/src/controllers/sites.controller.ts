/**
 * VISTHAAPAN Sites Controller
 * Provides database-backed candidate relocation sites with Phase 7 capacity assessments.
 */

import { Request, Response, NextFunction } from 'express';
import { getSiteCapacityAssessments } from '../capacity/capacityService.js';
import { pool } from '../db/pool.js';

export async function getSitesList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assessments = await getSiteCapacityAssessments();
    const sitesRes = await pool.query('SELECT * FROM relocation_sites ORDER BY name;');

    const formatted = assessments.map((assessment, idx) => {
      const dbRow = sitesRes.rows.find(r => r.id === assessment.siteId);
      const isPipalkoti = assessment.siteName.toLowerCase().includes('pipalkoti');
      const isGauchar = assessment.siteName.toLowerCase().includes('gauchar');
      const isKarnaprayag = assessment.siteName.toLowerCase().includes('karnaprayag');
      const isRudraprayag = assessment.siteName.toLowerCase().includes('rudraprayag');
      const isSrinagar = assessment.siteName.toLowerCase().includes('srinagar');

      const siteIdCode = `SITE-00${idx + 1}`;
      const effectiveCap = assessment.usableCapacity;

      return {
        id: siteIdCode,
        databaseId: assessment.siteId,
        code: `SITE-${String.fromCharCode(65 + idx)}-REL`,
        name: assessment.siteName,
        type: isGauchar ? 'Aerodrome Grounds' : (isPipalkoti ? 'Highland Ridge Enclave' : 'Plateau Camp'),
        location: `${assessment.siteName}, Sector ${idx + 1}`,
        district: assessment.district || 'Chamoli',
        coordinates: {
          lat: Number(dbRow?.latitude || 30.28 + idx * 0.05),
          lng: Number(dbRow?.longitude || 79.15 + idx * 0.08),
        },
        elevationMeters: 800 + idx * 150,
        safetyScore: assessment.safetyScore || (assessment.hardHazardExclusion ? 0.35 : 0.95),
        isOutsideRedZone: !assessment.hardHazardExclusion,
        resourceCapacity: {
          areaCapacity: assessment.resourceBreakdown.physical,
          waterCapacity: assessment.resourceBreakdown.water,
          shelterCapacity: assessment.resourceBreakdown.shelter,
          sanitationCapacity: assessment.resourceBreakdown.sanitation,
          healthcareCapacity: assessment.resourceBreakdown.healthcare,
          effectiveCapacity: effectiveCap,
          bottleneck: assessment.bottleneckDimension.charAt(0).toUpperCase() + assessment.bottleneckDimension.slice(1),
        },
        effectiveCapacity: effectiveCap,
        totalAllocated: assessment.currentOccupancy,
        availableCapacity: assessment.availableCapacity,
        utilizationRate: assessment.utilizationPercent,
        accessibility: 'All-weather Highway',
        routeDistanceKm: 18.0 + idx * 12.0,
        transitTimeMinutes: 40 + idx * 15,
        logisticsStatus: assessment.hardHazardExclusion 
          ? 'Constrained' 
          : (assessment.utilizationPercent >= 90 ? 'At Capacity' : 'Fully Operational'),
        facilities: {
          hasFieldHospital: true,
          hasWaterPurification: true,
          hasHelipad: isGauchar || isPipalkoti,
          hasElectricitySubstation: true,
        },
        dataOrigin: 'SIMULATED_BENCHMARK',
      };
    });

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
}

export async function getSiteById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const assessments = await getSiteCapacityAssessments();
    const sitesRes = await pool.query('SELECT * FROM relocation_sites ORDER BY name;');

    const siteIdx = id.startsWith('SITE-00') ? parseInt(id.slice(7), 10) - 1 : -1;
    let targetAssessment = assessments.find(a => a.siteId === id);

    if (!targetAssessment && siteIdx >= 0 && siteIdx < assessments.length) {
      targetAssessment = assessments[siteIdx];
    }

    if (!targetAssessment && assessments.length > 0) {
      targetAssessment = assessments[0];
    }

    if (!targetAssessment) {
      res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: `Candidate site '${id}' not found.`,
      });
      return;
    }

    const idx = assessments.indexOf(targetAssessment);
    const dbRow = sitesRes.rows.find(r => r.id === targetAssessment?.siteId);
    const effectiveCap = targetAssessment.usableCapacity;

    const formatted = {
      id: id.startsWith('SITE-') ? id : `SITE-00${idx + 1}`,
      databaseId: targetAssessment.siteId,
      code: `SITE-${String.fromCharCode(65 + Math.max(0, idx))}-REL`,
      name: targetAssessment.siteName,
      type: 'Aerodrome Grounds',
      location: `${targetAssessment.siteName}, Sector 1`,
      district: targetAssessment.district || 'Chamoli',
      coordinates: {
        lat: Number(dbRow?.latitude || 30.28),
        lng: Number(dbRow?.longitude || 79.15),
      },
      elevationMeters: 850,
      safetyScore: targetAssessment.safetyScore || 0.92,
      isOutsideRedZone: !targetAssessment.hardHazardExclusion,
      resourceCapacity: {
        areaCapacity: targetAssessment.resourceBreakdown.physical,
        waterCapacity: targetAssessment.resourceBreakdown.water,
        shelterCapacity: targetAssessment.resourceBreakdown.shelter,
        sanitationCapacity: targetAssessment.resourceBreakdown.sanitation,
        healthcareCapacity: targetAssessment.resourceBreakdown.healthcare,
        effectiveCapacity: effectiveCap,
        bottleneck: targetAssessment.bottleneckDimension,
      },
      effectiveCapacity: effectiveCap,
      totalAllocated: targetAssessment.currentOccupancy,
      availableCapacity: targetAssessment.availableCapacity,
      utilizationRate: targetAssessment.utilizationPercent,
      accessibility: 'All-weather Highway',
      routeDistanceKm: 25.0,
      transitTimeMinutes: 50,
      logisticsStatus: 'Fully Operational',
      facilities: {
        hasFieldHospital: true,
        hasWaterPurification: true,
        hasHelipad: true,
        hasElectricitySubstation: true,
      },
      dataOrigin: 'SIMULATED_BENCHMARK',
    };

    res.status(200).json(formatted);
  } catch (err) {
    next(err);
  }
}
