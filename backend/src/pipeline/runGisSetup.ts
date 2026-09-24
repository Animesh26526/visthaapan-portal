/**
 * VISTHAAPAN Phase 6 GIS Setup & Ingestion Master Pipeline
 * Orchestrates:
 * 1. State capitals reprojection & ingestion (EPSG:7755 -> EPSG:4326)
 * 2. Canonical district spatial centroid anchoring
 * 3. Spatial hazard layer ingestion & buffering
 * 4. Statutory Unsafe-Zone derivation (metric buffers, multi-hazard union)
 * 5. Relocation site multi-criteria suitability evaluation
 */

import { pool } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import { ingestStateCapitals } from './ingestStateCapitals.js';
import { geocodeCanonicalDistricts } from './geocodeDistricts.js';
import { seedHazardLayers } from '../gis/hazardLayerService.js';
import { deriveRedZonesFromHazards } from '../gis/unsafeZoneEngine.js';
import { evaluateAllSiteSuitability } from '../gis/siteSuitabilityEngine.js';

export async function runGisSetup(): Promise<void> {
  const overallStart = Date.now();
  logger.info('============================================================');
  logger.info('   Starting VISTHAAPAN Phase 6 Master GIS Setup Pipeline');
  logger.info('============================================================');

  try {
    // 1. Ingest State Capitals
    const capRes = await ingestStateCapitals();
    logger.info({ ingested: capRes.capitalsIngested }, 'Step 1/5: State Capitals ingested.');

    // 2. Geocode Canonical Districts
    const distRes = await geocodeCanonicalDistricts();
    logger.info({ total: distRes.totalDistricts }, 'Step 2/5: Canonical districts spatially anchored.');

    // 3. Seed Spatial Hazard Layers
    const hazardCount = await seedHazardLayers();
    logger.info({ count: hazardCount }, 'Step 3/5: Spatial hazard layers seeded.');

    // 4. Derive Model Red Zones
    const rzRes = await deriveRedZonesFromHazards();
    logger.info({ count: rzRes.redZonesDerived }, 'Step 4/5: Model Red Zones derived (planning envelopes).');

    // 5. Evaluate Relocation Site Suitability
    const suitRes = await evaluateAllSiteSuitability();
    logger.info(
      { evaluated: suitRes.totalSitesEvaluated, suitable: suitRes.suitableCount, conditional: suitRes.conditionallySuitableCount, restricted: suitRes.restrictedCount },
      'Step 5/5: Relocation site suitability evaluated.'
    );

    const totalDurationMs = Date.now() - overallStart;
    logger.info({ totalDurationMs }, '✓ VISTHAAPAN Phase 6 Master GIS Setup complete.');
  } catch (err) {
    logger.error({ err }, '✗ Phase 6 Master GIS Setup failed.');
    throw err;
  }
}

// CLI execution entrypoint
const isMain = process.argv[1] === import.meta.filename;
if (isMain) {
  runGisSetup()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Fatal GIS setup error:', err);
      pool.end().finally(() => process.exit(1));
    });
}
