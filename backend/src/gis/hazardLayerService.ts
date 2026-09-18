/**
 * VISTHAAPAN Phase 6 Hazard Layer Service
 * Ingestion, spatial indexing, querying, and GeoJSON serialization of spatial hazard layers.
 * Preserves multi-hazard taxonomy (flood, flash_flood, landslide, subsidence, earthquake).
 */

import { Pool, PoolClient } from 'pg';
import { pool, getClient } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import { getOrCreateDataSource, getOrCreateDataset, getOrCreateDatasetVersion } from '../pipeline/provenance.js';
import type { GeoJsonFeatureCollection } from '../types/gis.js';

export interface HazardLayerRecord {
  id: string;
  name: string;
  hazardType: string;
  severity: string;
  intensity: number | null;
  probability: number | null;
  confidence: number;
  bufferRadiusMeters: number;
  dataOrigin: string;
  geometryGeoJson: any;
  metadata: Record<string, any>;
  createdAt: string;
}

export const SEED_HAZARD_LAYERS = [
  {
    name: 'Joshimath Active Subsidence Core Zone (SIMULATED)',
    hazardType: 'subsidence',
    severity: 'CRITICAL',
    intensity: 14.5, // mm/month displacement
    probability: 0.98,
    confidence: 0.96,
    bufferRadiusMeters: 250,
    dataOrigin: 'SIMULATED',
    wktGeometry: 'SRID=4326;POLYGON((79.535 30.575, 79.575 30.570, 79.590 30.545, 79.575 30.525, 79.540 30.520, 79.520 30.535, 79.515 30.560, 79.535 30.575))',
    metadata: {
      displacementRateMmPerMonth: 14.5,
      sourceInstrument: 'InSAR Synthetic Aperture Radar Benchmark Model',
      statutoryExclusion: 'Permanent Human Habitation Prohibited',
    },
  },
  {
    name: 'Alaknanda Riverine Flash Flood Corridor (SIMULATED)',
    hazardType: 'flash_flood',
    severity: 'HIGH',
    intensity: 8.2, // Flood inundation index
    probability: 0.85,
    confidence: 0.92,
    bufferRadiusMeters: 150,
    dataOrigin: 'SIMULATED',
    wktGeometry: 'SRID=4326;POLYGON((79.55 30.55, 79.48 30.50, 79.43 30.43, 79.38 30.35, 79.25 30.26, 79.22 30.25, 79.24 30.27, 79.40 30.37, 79.45 30.45, 79.50 30.52, 79.57 30.56, 79.55 30.55))',
    metadata: {
      riverBasin: 'Alaknanda',
      inundationLevelMeters: 4.5,
      drainageBufferRequiredMeters: 150,
    },
  },
  {
    name: 'Malari Upper Valley Debris Flow Zone (SIMULATED)',
    hazardType: 'landslide',
    severity: 'HIGH',
    intensity: 7.8,
    probability: 0.88,
    confidence: 0.90,
    bufferRadiusMeters: 200,
    dataOrigin: 'SIMULATED',
    wktGeometry: 'SRID=4326;POLYGON((79.86 30.67, 79.92 30.68, 79.91 30.71, 79.85 30.70, 79.86 30.67))',
    metadata: {
      geomorphicFeature: 'Steep Talus Cone & Glacial Outwash',
      slopeInstabilityIndex: 0.84,
    },
  },
  {
    name: 'Pipalkoti Highway Escarpment Landslide Bluff (SIMULATED)',
    hazardType: 'landslide',
    severity: 'MEDIUM',
    intensity: 5.5,
    probability: 0.72,
    confidence: 0.85,
    bufferRadiusMeters: 100,
    dataOrigin: 'SIMULATED',
    wktGeometry: 'SRID=4326;POLYGON((79.41 30.42, 79.42 30.41, 79.44 30.43, 79.43 30.44, 79.41 30.42))',
    metadata: {
      corridorImpact: 'NH-07 Transit Vulnerability Point',
      monitoringStatus: 'Active Extensometer Radar',
    },
  },
];

/**
 * Seeds and updates canonical spatial hazard layers in the PostGIS database.
 */
export async function seedHazardLayers(): Promise<number> {
  const client: PoolClient = await getClient();

  try {
    await client.query('BEGIN;');

    // 1. Provenance Ledger Entry
    const sourceId = await getOrCreateDataSource(client, {
      datasetName: 'Chamoli Multi-Hazard Spatial Polygon Benchmark (SIMULATED)',
      sourceOrganization: 'VISTHAAPAN Geological Hazard Assessment Unit (Simulation)',
      sourceType: 'SIMULATED',
      sourceUrl: 'urn:visthaapan:gis:hazards:chamoli-v1',
      coverage: 'Chamoli Planning Area — Joshimath, Alaknanda Corridor, Malari',
      confidence: 0.94,
      description: 'Physical polygonal hazard layers representing active ground subsidence, river flash-flood inundation, and debris flow scarps.',
    });

    const datasetId = await getOrCreateDataset(client, {
      sourceId,
      name: 'Spatial Multi-Hazard Layers Fixture',
      description: 'Polygonal hazard footprints with metric buffer parameters for Unsafe-Zone derivation.',
      dataType: 'SPATIAL_VECTOR_POLYGONS',
      format: 'POSTGIS_GEOMETRY',
      coverage: 'District Chamoli',
    });

    const { id: datasetVersionId } = await getOrCreateDatasetVersion(client, {
      datasetId,
      versionNumber: 'v2026.09-HAZARD-LAYERS-V1',
      recordCount: SEED_HAZARD_LAYERS.length,
      qualityScore: 0.96,
      processingNotes: 'Phase 6 6B hazard layer spatial ingestion.',
    });

    let count = 0;
    for (const h of SEED_HAZARD_LAYERS) {
      await client.query(`
        INSERT INTO hazard_layers (
          name, hazard_type, severity, intensity, probability, confidence,
          buffer_radius_meters, data_origin, geometry, source_id,
          dataset_version_id, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          ST_GeomFromEWKT($9), $10, $11, $12
        )
        ON CONFLICT (id) DO NOTHING;
      `, [
        h.name,
        h.hazardType,
        h.severity,
        h.intensity,
        h.probability,
        h.confidence,
        h.bufferRadiusMeters,
        h.dataOrigin,
        h.wktGeometry,
        sourceId,
        datasetVersionId,
        JSON.stringify(h.metadata),
      ]);
      count++;
    }

    await client.query('COMMIT;');
    logger.info({ count }, 'Successfully seeded spatial hazard layers.');
    return count;
  } catch (err: any) {
    await client.query('ROLLBACK;');
    logger.error({ err }, 'Failed to seed hazard layers.');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Retrieves all hazard layers as an RFC 7946 GeoJSON FeatureCollection.
 */
export async function getHazardLayersGeoJson(
  hazardType?: string
): Promise<GeoJsonFeatureCollection> {
  let filterSql = '';
  const params: any[] = [];

  if (hazardType) {
    filterSql = 'WHERE hazard_type = $1';
    params.push(hazardType);
  }

  const query = `
    SELECT 
      id,
      name,
      hazard_type,
      severity,
      intensity,
      probability,
      confidence,
      buffer_radius_meters,
      data_origin,
      metadata,
      ST_AsGeoJSON(geometry)::json as geojson_geom
    FROM hazard_layers
    ${filterSql}
    ORDER BY name ASC;
  `;

  const { rows } = await pool.query(query, params);

  const features = rows.map((r) => ({
    type: 'Feature' as const,
    id: r.id,
    geometry: r.geojson_geom,
    properties: {
      name: r.name,
      hazardType: r.hazard_type,
      severity: r.severity,
      intensity: r.intensity ? parseFloat(r.intensity) : null,
      probability: r.probability ? parseFloat(r.probability) : null,
      confidence: r.confidence ? parseFloat(r.confidence) : null,
      bufferRadiusMeters: r.buffer_radius_meters ? parseFloat(r.buffer_radius_meters) : 0,
      dataOrigin: r.data_origin,
      metadata: r.metadata || {},
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      count: features.length,
      filterType: hazardType || 'all',
      source: 'PostGIS hazard_layers',
    },
  };
}

// CLI execution entrypoint
const isMain = process.argv[1] === import.meta.filename;
if (isMain) {
  seedHazardLayers()
    .then((c) => {
      console.log('✓ Successfully seeded hazard layers:', c);
      return pool.end();
    })
    .catch((err) => {
      console.error('Fatal hazard layer seeding error:', err);
      pool.end().finally(() => process.exit(1));
    });
}

