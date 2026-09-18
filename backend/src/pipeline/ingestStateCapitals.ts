/**
 * VISTHAAPAN State Capitals Geospatial Ingestion Pipeline
 * Ingests authoritative Survey of India State & UT Capitals reprojected from LCC (EPSG:7755) to WGS84 (EPSG:4326).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PoolClient } from 'pg';
import { pool, getClient } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import { getOrCreateDataSource, getOrCreateDataset, getOrCreateDatasetVersion } from './provenance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAPITALS_GEOJSON_PATH = path.resolve(__dirname, '../../data/state_capitals.geojson');

export interface StateCapitalsIngestResult {
  dataSourceId: string;
  datasetVersionId: string;
  capitalsIngested: number;
  durationMs: number;
}

export async function ingestStateCapitals(): Promise<StateCapitalsIngestResult> {
  const startTime = Date.now();
  logger.info({ file: CAPITALS_GEOJSON_PATH }, 'Starting State Capitals ingestion pipeline...');

  if (!fs.existsSync(CAPITALS_GEOJSON_PATH)) {
    throw new Error(`State capitals GeoJSON file not found at: ${CAPITALS_GEOJSON_PATH}`);
  }

  const rawJson = fs.readFileSync(CAPITALS_GEOJSON_PATH, 'utf-8');
  const geojson = JSON.parse(rawJson);
  const features = geojson.features || [];

  const client: PoolClient = await getClient();

  try {
    await client.query('BEGIN;');

    // 1. Ensure state_capitals table and index exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS state_capitals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        capital_name VARCHAR(100) NOT NULL,
        state_code VARCHAR(20) NOT NULL,
        district_name VARCHAR(100) NOT NULL,
        latitude NUMERIC(9,6) NOT NULL,
        longitude NUMERIC(9,6) NOT NULL,
        geometry geometry(Point, 4326) NOT NULL,
        dataset_version_id UUID REFERENCES dataset_versions(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_state_capital UNIQUE (state_code, capital_name)
      );
      CREATE INDEX IF NOT EXISTS idx_sc_geometry ON state_capitals USING GIST (geometry);
      CREATE INDEX IF NOT EXISTS idx_sc_state_code ON state_capitals (state_code);
    `);

    // 2. Register Provenance
    const sourceId = await getOrCreateDataSource(client, {
      datasetName: 'Survey of India — State and Union Territory Capitals',
      sourceOrganization: 'Survey of India / National Remote Sensing Centre (NRSC)',
      sourceType: 'OFFICIAL_GOVERNMENT',
      sourceUrl: 'https://bhuvan-app1.nrsc.gov.in/',
      coverage: 'National — All States and Union Territories of India',
      confidence: 0.99,
      description: 'Authoritative administrative capital coordinates reprojected from Survey of India LCC (EPSG:7755) to WGS84 (EPSG:4326).',
    });

    const datasetId = await getOrCreateDataset(client, {
      sourceId,
      name: 'State and UT Administrative Capitals Geospatial Layer',
      description: 'Official Point locations of 34 state and union territory headquarters of India.',
      dataType: 'SPATIAL_VECTOR_POINTS',
      format: 'GEOJSON_RFC7946',
      coverage: '36 States and Union Territories of India',
    });

    const { id: datasetVersionId } = await getOrCreateDatasetVersion(client, {
      datasetId,
      versionNumber: 'v2026.09-SOI-CAPITALS-WGS84',
      recordCount: features.length,
      qualityScore: 1.0,
      processingNotes: 'Extracted from official ESRI Shapefile with EPSG:7755 to EPSG:4326 coordinate reprojection via PostGIS ST_Transform.',
    });

    // 3. Upsert State Capitals
    let ingestedCount = 0;
    for (const feat of features) {
      const { capital_name, state_code, district_name } = feat.properties;
      const [lon, lat] = feat.geometry.coordinates;

      await client.query(`
        INSERT INTO state_capitals (
          capital_name, state_code, district_name, latitude, longitude,
          geometry, dataset_version_id
        ) VALUES (
          $1, $2, $3, $4::numeric, $5::numeric,
          ST_SetSRID(ST_MakePoint($5::double precision, $4::double precision), 4326), $6
        )
        ON CONFLICT (state_code, capital_name) DO UPDATE SET
          district_name = EXCLUDED.district_name,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          geometry = EXCLUDED.geometry,
          dataset_version_id = EXCLUDED.dataset_version_id;
      `, [capital_name, state_code, district_name, lat, lon, datasetVersionId]);

      ingestedCount++;
    }

    await client.query('COMMIT;');
    const durationMs = Date.now() - startTime;
    logger.info({ ingestedCount, durationMs }, 'State Capitals ingestion complete.');

    return {
      dataSourceId: sourceId,
      datasetVersionId,
      capitalsIngested: ingestedCount,
      durationMs,
    };
  } catch (err: any) {
    await client.query('ROLLBACK;');
    logger.error({ err }, 'State Capitals ingestion failed and rolled back.');
    throw err;
  } finally {
    client.release();
  }
}

// Direct CLI execution support
const isMain = process.argv[1] === __filename;
if (isMain) {
  ingestStateCapitals()
    .then((res) => {
      console.log('✓ Successfully ingested state capitals:', res);
      return pool.end();
    })
    .catch((err) => {
      console.error('Fatal state capitals ingestion error:', err);
      pool.end().finally(() => process.exit(1));
    });
}
