/**
 * VISTHAAPAN Census 2011 Demographics Ingestion Service.
 * Ingests District-Total Primary Census Abstract (PCA) data and populates district_demographics.
 */

import fs from 'fs';
import readline from 'readline';
import path from 'path';
import crypto from 'crypto';
import { PoolClient } from 'pg';
import { getClient } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import {
  getOrCreateDataSource,
  getOrCreateDataset,
  getOrCreateDatasetVersion,
  startProcessingRun,
  completeProcessingRun,
  recordDataQuality,
} from './provenance.js';
import { CanonicalDistrictIndex, CanonicalDistrictRecord } from './districtAliases.js';

export interface CensusDemographicsSummary {
  versionNumber: string;
  totalRecordsRead: number;
  demographicsInserted: number;
  unmatchedRecords: number;
  fileHash: string;
  durationMs: number;
}

export async function ingestCensusDemographics(csvPath?: string): Promise<CensusDemographicsSummary> {
  const startTime = Date.now();
  const filePath = csvPath ?? path.resolve(process.cwd(), 'data/census_2011_district_total.csv');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Census District Total CSV not found: ${filePath}`);
  }

  logger.info({ filePath }, 'Starting Census 2011 Demographics ingestion...');

  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const versionNumber = `v2011-CENSUS-PCA-${fileHash.slice(0, 8)}`;

  const client: PoolClient = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Provenance Registration
    const sourceId = await getOrCreateDataSource(client, {
      datasetName: 'Census of India 2011 (Primary Census Abstract)',
      sourceOrganization: 'Office of the Registrar General & Census Commissioner, India (ORGI)',
      sourceType: 'STATUTORY_NATIONAL_CENSUS',
      sourceUrl: 'https://censusindia.gov.in',
      coverage: 'All India Districts (2011 Boundary Baseline: 640 Districts)',
      confidence: 1.0,
      description: 'Authoritative statutory 2011 decennial population and demographic indicators',
    });

    const datasetId = await getOrCreateDataset(client, {
      sourceId,
      name: 'District Primary Census Abstract (PCA) 2011',
      description: 'District-level total population, male, female, 0-6 child, SC, ST, literacy, and workers',
      dataType: 'DEMOGRAPHIC_BASELINE',
      format: 'CSV',
      coverage: 'National District Level',
    });

    const { id: datasetVersionId } = await getOrCreateDatasetVersion(client, {
      datasetId,
      versionNumber,
      recordCount: 640,
      qualityScore: 1.0,
      processingNotes: 'Pre-filtered District-level Total (TRU=Total, Level=DISTRICT) demographic baseline',
    });

    const runId = await startProcessingRun(client, {
      datasetVersionId,
      processType: 'census-2011-demographics-ingestion',
      recordsInput: 640,
    });

    // 2. Load Canonical Districts Index
    const cdRes = await client.query(`
      SELECT id, state_code AS "stateCode", state_name AS "stateName",
             state_census2011_code AS "stateCensus2011Code",
             district_code AS "districtCode", district_name AS "districtName",
             district_census2011_code AS "districtCensus2011Code"
      FROM canonical_districts
    `);
    const canonicalIndex = new CanonicalDistrictIndex(cdRes.rows as CanonicalDistrictRecord[]);

    // 3. Read and Parse Census CSV
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineCount = 0;
    let headerFields: string[] = [];
    let insertedCount = 0;
    let unmatchedCount = 0;

    for await (const rawLine of rl) {
      lineCount++;
      const line = rawLine.replace(/^\ufeff/, '').trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (lineCount === 1) {
        headerFields = cols;
        continue;
      }

      if (cols.length < headerFields.length) continue;

      const row: Record<string, string> = {};
      for (let i = 0; i < headerFields.length; i++) {
        row[headerFields[i]] = cols[i];
      }

      const stateCensusCode = row['State']?.padStart(2, '0');
      const distCensusCode = row['District']?.padStart(3, '0');
      const distName = row['Name'];

      // Match canonical district by Census 2011 code (001-640)
      let canonicalDist = canonicalIndex.matchByCensusCode(distCensusCode);

      let mappingStatus = 'EXACT';
      let mappingMethod = 'CODE_MATCH';
      let confidence = 1.0;
      let notes = `Census 2011 code match (dist: ${distCensusCode}, state: ${stateCensusCode})`;

      if (!canonicalDist) {
        // Fallback to name match
        const matchRes = canonicalIndex.matchByName(row['State'], distName);
        if (matchRes.canonicalDistrictId) {
          const matched = (cdRes.rows as CanonicalDistrictRecord[]).find((c) => c.id === matchRes.canonicalDistrictId);
          if (matched) {
            canonicalDist = matched;
            mappingStatus = matchRes.mappingStatus;
            mappingMethod = matchRes.mappingMethod;
            confidence = matchRes.confidence;
            notes = matchRes.notes;
          }
        }
      }

      if (!canonicalDist) {
        unmatchedCount++;
        logger.warn({ stateCensusCode, distCensusCode, distName }, 'Unmatched Census district');
        // Record unresolved mapping
        await client.query(
          `INSERT INTO district_identity_mappings (
            source_dataset, source_state, source_district, canonical_district_id,
            mapping_status, mapping_method, confidence, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (source_dataset, source_state, source_district) DO UPDATE SET
            canonical_district_id = EXCLUDED.canonical_district_id,
            mapping_status = EXCLUDED.mapping_status,
            mapping_method = EXCLUDED.mapping_method,
            confidence = EXCLUDED.confidence,
            notes = EXCLUDED.notes;`,
          ['CENSUS_2011', stateCensusCode || 'UNKNOWN', distName, null, 'UNMATCHED', 'UNRESOLVED', 0.0, 'Unresolved census district']
        );
        continue;
      }

      // Record identity mapping
      await client.query(
        `INSERT INTO district_identity_mappings (
          source_dataset, source_state, source_district, canonical_district_id,
          mapping_status, mapping_method, confidence, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (source_dataset, source_state, source_district) DO UPDATE SET
          canonical_district_id = EXCLUDED.canonical_district_id,
          mapping_status = EXCLUDED.mapping_status,
          mapping_method = EXCLUDED.mapping_method,
          confidence = EXCLUDED.confidence,
          notes = EXCLUDED.notes;`,
        ['CENSUS_2011', stateCensusCode || 'UNKNOWN', distName, canonicalDist.id, mappingStatus, mappingMethod, confidence, notes]
      );

      // Parse demographic metrics with safe numeric conversion & ratio computations
      const popTotal = parseInt(row['TOT_P'] || '0', 10);
      const popMale = parseInt(row['TOT_M'] || '0', 10);
      const popFemale = parseInt(row['TOT_F'] || '0', 10);
      const popChild06 = row['P_06'] ? parseInt(row['P_06'], 10) : null;
      const popSC = row['P_SC'] ? parseInt(row['P_SC'], 10) : null;
      const popST = row['P_ST'] ? parseInt(row['P_ST'], 10) : null;
      const popLit = row['P_LIT'] ? parseInt(row['P_LIT'], 10) : null;
      const popWorker = row['TOT_WORK_P'] ? parseInt(row['TOT_WORK_P'], 10) : null;
      const popMainWorker = row['MAINWORK_P'] ? parseInt(row['MAINWORK_P'], 10) : null;
      const popMargWorker = row['MARGWORK_P'] ? parseInt(row['MARGWORK_P'], 10) : null;
      const households = row['No_HH'] ? parseInt(row['No_HH'], 10) : null;

      const femaleShare = popTotal > 0 ? Number((popFemale / popTotal).toFixed(4)) : null;
      const childShare = popTotal > 0 && popChild06 !== null ? Number((popChild06 / popTotal).toFixed(4)) : null;
      const scShare = popTotal > 0 && popSC !== null ? Number((popSC / popTotal).toFixed(4)) : null;
      const stShare = popTotal > 0 && popST !== null ? Number((popST / popTotal).toFixed(4)) : null;
      const litRate = popTotal > 0 && popLit !== null ? Number((popLit / popTotal).toFixed(4)) : null;
      const workerRate = popTotal > 0 && popWorker !== null ? Number((popWorker / popTotal).toFixed(4)) : null;

      // Upsert into district_demographics
      await client.query(
        `INSERT INTO district_demographics (
          canonical_district_id, dataset_version_id, data_reference_year,
          population_total, population_male, population_female,
          population_child_0_6, population_sc, population_st, population_literate,
          population_worker, population_main_worker, population_marginal_worker,
          households_count, female_population_share, child_population_share,
          sc_population_share, st_population_share, literacy_rate, worker_participation_rate
        ) VALUES (
          $1, $2, 2011,
          $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18, $19
        ) ON CONFLICT (canonical_district_id, dataset_version_id) DO UPDATE SET
          population_total = EXCLUDED.population_total,
          population_male = EXCLUDED.population_male,
          population_female = EXCLUDED.population_female,
          population_child_0_6 = EXCLUDED.population_child_0_6,
          population_sc = EXCLUDED.population_sc,
          population_st = EXCLUDED.population_st,
          population_literate = EXCLUDED.population_literate,
          population_worker = EXCLUDED.population_worker,
          population_main_worker = EXCLUDED.population_main_worker,
          population_marginal_worker = EXCLUDED.population_marginal_worker,
          households_count = EXCLUDED.households_count,
          female_population_share = EXCLUDED.female_population_share,
          child_population_share = EXCLUDED.child_population_share,
          sc_population_share = EXCLUDED.sc_population_share,
          st_population_share = EXCLUDED.st_population_share,
          literacy_rate = EXCLUDED.literacy_rate,
          worker_participation_rate = EXCLUDED.worker_participation_rate;`,
        [
          canonicalDist.id,
          datasetVersionId,
          popTotal,
          popMale,
          popFemale,
          popChild06,
          popSC,
          popST,
          popLit,
          popWorker,
          popMainWorker,
          popMargWorker,
          households,
          femaleShare,
          childShare,
          scShare,
          stShare,
          litRate,
          workerRate,
        ]
      );

      insertedCount++;
    }

    // 4. Processing Run Completion and Quality
    await completeProcessingRun(client, runId, {
      recordsOutput: insertedCount,
      recordsRejected: unmatchedCount,
      errorCount: 0,
      processingLog: `Loaded ${insertedCount} district demographics (Census 2011 baseline). Unmatched: ${unmatchedCount}.`,
    });

    await recordDataQuality(client, {
      datasetVersionId,
      completenessPercent: (insertedCount / 640) * 100.0,
      spatialCoveragePercent: 100.0,
      invalidRecords: unmatchedCount,
      duplicateRecords: 0,
      overallConfidence: 1.0,
      missingFields: [],
    });

    await client.query('COMMIT');

    const durationMs = Date.now() - startTime;
    logger.info({ insertedCount, unmatchedCount, durationMs }, 'Census 2011 demographics ingested successfully.');

    return {
      versionNumber,
      totalRecordsRead: lineCount - 1,
      demographicsInserted: insertedCount,
      unmatchedRecords: unmatchedCount,
      fileHash,
      durationMs,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Failed to ingest Census 2011 demographics');
    throw error;
  } finally {
    client.release();
  }
}
