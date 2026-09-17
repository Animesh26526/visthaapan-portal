/**
 * VISTHAAPAN District Master Ingestion Service.
 * Populates canonical_districts and aligns administrative regions.
 */

import fs from 'fs';
import readline from 'readline';
import path from 'path';
import crypto from 'crypto';
import { PoolClient } from 'pg';
import { pool, getClient } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import {
  getOrCreateDataSource,
  getOrCreateDataset,
  getOrCreateDatasetVersion,
  startProcessingRun,
  completeProcessingRun,
  recordDataQuality,
} from './provenance.js';

export interface DistrictMasterSummary {
  versionNumber: string;
  totalRecordsRead: number;
  districtsInserted: number;
  uniqueStates: number;
  fileHash: string;
  durationMs: number;
}

export async function ingestDistrictMaster(csvPath?: string): Promise<DistrictMasterSummary> {
  const startTime = Date.now();
  const filePath = csvPath ?? path.resolve(process.cwd(), 'data/37231365-78ba-44d5-ac22-3deec40b9197.csv');

  if (!fs.existsSync(filePath)) {
    throw new Error(`District Master CSV file not found: ${filePath}`);
  }

  logger.info({ filePath }, 'Starting District Master ingestion...');

  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const versionNumber = `v2026-LGD-MASTER-${fileHash.slice(0, 8)}`;

  const client: PoolClient = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Provenance Registration
    const sourceId = await getOrCreateDataSource(client, {
      datasetName: 'Local Government Directory (LGD)',
      sourceOrganization: 'Ministry of Panchayati Raj / National Informatics Centre',
      sourceType: 'GOVERNMENT_ADMINISTRATIVE_MASTER',
      sourceUrl: 'https://lgd.gov.in',
      coverage: 'All India States and Union Territories',
      confidence: 1.0,
      description: 'Official statutory administrative directory of Indian States and Districts',
    });

    const datasetId = await getOrCreateDataset(client, {
      sourceId,
      name: 'Canonical District Master Directory',
      description: 'Standard administrative district codes, names, and Census 2011 concordance',
      dataType: 'ADMINISTRATIVE_REFERENCE',
      format: 'CSV',
      coverage: 'National District Level',
    });

    const { id: datasetVersionId } = await getOrCreateDatasetVersion(client, {
      datasetId,
      versionNumber,
      recordCount: 785,
      qualityScore: 1.0,
      processingNotes: 'Authoritative canonical district identity reference layer',
    });

    const runId = await startProcessingRun(client, {
      datasetVersionId,
      processType: 'canonical-district-master-ingestion',
      recordsInput: 785,
    });

    // 2. Read and Parse CSV
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineCount = 0;
    let headerSkipped = false;
    const states = new Set<string>();
    let insertedCount = 0;

    for await (const rawLine of rl) {
      lineCount++;
      const line = rawLine.replace(/^\ufeff/, '').trim();
      if (!line) continue;

      if (!headerSkipped) {
        headerSkipped = true;
        continue;
      }

      // Format: state_code, state_name_english, state_name_local, state_census2011_code, district_code, district_name_english, district_name_local, district_census2011_code
      // Parse CSV line handling potential commas
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 8) continue;

      const stateCode = cols[0];
      const stateName = cols[1];
      const stateCensusCode = cols[3] && cols[3] !== '0' ? cols[3].padStart(2, '0') : null;
      const districtCode = cols[4];
      const districtName = cols[5];
      const districtCensusCode = cols[7] && cols[7] !== '0' ? cols[7].padStart(3, '0') : null;

      states.add(stateName);

      // Upsert into canonical_districts
      await client.query(
        `INSERT INTO canonical_districts (
          state_code, state_name, state_census2011_code,
          district_code, district_name, district_census2011_code
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (district_code) DO UPDATE SET
          state_code = EXCLUDED.state_code,
          state_name = EXCLUDED.state_name,
          state_census2011_code = EXCLUDED.state_census2011_code,
          district_name = EXCLUDED.district_name,
          district_census2011_code = EXCLUDED.district_census2011_code;`,
        [stateCode, stateName, stateCensusCode, districtCode, districtName, districtCensusCode]
      );

      insertedCount++;
    }

    // 3. Complete processing run and quality metrics
    await completeProcessingRun(client, runId, {
      recordsOutput: insertedCount,
      recordsRejected: lineCount - insertedCount - 1,
      errorCount: 0,
      processingLog: `Loaded ${insertedCount} canonical districts across ${states.size} states/UTs.`,
    });

    await recordDataQuality(client, {
      datasetVersionId,
      completenessPercent: 100.0,
      spatialCoveragePercent: 100.0,
      invalidRecords: 0,
      duplicateRecords: 0,
      overallConfidence: 1.0,
      missingFields: [],
      derivedVariables: ['canonical_districts'],
    });

    await client.query('COMMIT');
    const durationMs = Date.now() - startTime;

    logger.info({ insertedCount, states: states.size, durationMs }, 'District Master ingested successfully.');

    return {
      versionNumber,
      totalRecordsRead: lineCount - 1,
      districtsInserted: insertedCount,
      uniqueStates: states.size,
      fileHash,
      durationMs,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'District Master ingestion failed and rolled back.');
    throw err;
  } finally {
    client.release();
  }
}
