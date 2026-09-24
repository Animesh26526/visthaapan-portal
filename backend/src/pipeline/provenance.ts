/**
 * VISTHAAPAN Data Provenance & Lineage Service.
 * Implements ISO 19157-aligned provenance tracking across data_sources, datasets,
 * dataset_versions, data_processing_runs, and data_qualities.
 */

import { PoolClient } from 'pg';

export interface DataSourceRecord {
  id: string;
  dataset_name: string;
  source_organization: string;
  source_type: string;
}

export interface DatasetRecord {
  id: string;
  source_id: string;
  name: string;
  data_type: string;
}

export interface DatasetVersionRecord {
  id: string;
  dataset_id: string;
  version_number: string;
  record_count: number;
}

/**
 * Registers or retrieves the authoritative Data Source entity.
 */
export async function getOrCreateDataSource(
  client: PoolClient,
  params: {
    datasetName: string;
    sourceOrganization: string;
    sourceType: string;
    sourceUrl?: string;
    coverage?: string;
    confidence?: number;
    description?: string;
  }
): Promise<string> {
  const check = await client.query<{ id: string }>(
    `SELECT id FROM data_sources WHERE dataset_name = $1 AND source_organization = $2 LIMIT 1;`,
    [params.datasetName, params.sourceOrganization]
  );

  if (check.rows.length > 0) {
    return check.rows[0].id;
  }

  const insert = await client.query<{ id: string }>(
    `INSERT INTO data_sources (
      dataset_name, source_organization, source_type, source_url, coverage, confidence, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id;`,
    [
      params.datasetName,
      params.sourceOrganization,
      params.sourceType,
      params.sourceUrl ?? null,
      params.coverage ?? 'National (India)',
      params.confidence ?? 0.95,
      params.description ?? 'Official NDEM disaster situation reporting system',
    ]
  );

  return insert.rows[0].id;
}

/**
 * Registers or retrieves the master Dataset entity.
 */
export async function getOrCreateDataset(
  client: PoolClient,
  params: {
    sourceId: string;
    name: string;
    description?: string;
    dataType: string;
    format?: string;
    coverage?: string;
  }
): Promise<string> {
  const check = await client.query<{ id: string }>(
    `SELECT id FROM datasets WHERE source_id = $1 AND name = $2 LIMIT 1;`,
    [params.sourceId, params.name]
  );

  if (check.rows.length > 0) {
    return check.rows[0].id;
  }

  const insert = await client.query<{ id: string }>(
    `INSERT INTO datasets (
      source_id, name, description, data_type, format, coverage
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id;`,
    [
      params.sourceId,
      params.name,
      params.description ?? 'Government disaster situation statistics',
      params.dataType,
      params.format ?? 'CSV',
      params.coverage ?? 'All States / Districts',
    ]
  );

  return insert.rows[0].id;
}

/**
 * Creates or retrieves a versioned snapshot of the dataset.
 */
export async function getOrCreateDatasetVersion(
  client: PoolClient,
  params: {
    datasetId: string;
    versionNumber: string;
    recordCount: number;
    qualityScore?: number;
    processingNotes?: string;
  }
): Promise<{ id: string; isNew: boolean }> {
  const check = await client.query<{ id: string }>(
    `SELECT id FROM dataset_versions WHERE dataset_id = $1 AND version_number = $2 LIMIT 1;`,
    [params.datasetId, params.versionNumber]
  );

  if (check.rows.length > 0) {
    return { id: check.rows[0].id, isNew: false };
  }

  const insert = await client.query<{ id: string }>(
    `INSERT INTO dataset_versions (
      dataset_id, version_number, record_count, quality_score, processing_status, processing_notes
    ) VALUES ($1, $2, $3, $4, 'completed', $5)
    RETURNING id;`,
    [
      params.datasetId,
      params.versionNumber,
      params.recordCount,
      params.qualityScore ?? 0.98,
      params.processingNotes ?? 'Automated Phase 4 normalized data ingestion',
    ]
  );

  return { id: insert.rows[0].id, isNew: true };
}

/**
 * Records a pipeline processing run.
 */
export async function startProcessingRun(
  client: PoolClient,
  params: {
    datasetVersionId: string;
    processType: string;
    recordsInput: number;
  }
): Promise<string> {
  const insert = await client.query<{ id: string }>(
    `INSERT INTO data_processing_runs (
      dataset_version_id, process_type, records_input, status
    ) VALUES ($1, $2, $3, 'running')
    RETURNING id;`,
    [params.datasetVersionId, params.processType, params.recordsInput]
  );

  return insert.rows[0].id;
}

/**
 * Completes a pipeline processing run.
 */
export async function completeProcessingRun(
  client: PoolClient,
  runId: string,
  params: {
    recordsOutput: number;
    recordsRejected: number;
    errorCount: number;
    processingLog?: string;
  }
): Promise<void> {
  await client.query(
    `UPDATE data_processing_runs
     SET status = 'completed',
         completed_at = NOW(),
         records_output = $1,
         records_rejected = $2,
         error_count = $3,
         processing_log = $4
     WHERE id = $5;`,
    [params.recordsOutput, params.recordsRejected, params.errorCount, params.processingLog ?? 'Success', runId]
  );
}

/**
 * Records ISO 19157 data quality metrics.
 */
export async function recordDataQuality(
  client: PoolClient,
  params: {
    datasetVersionId: string;
    completenessPercent: number;
    spatialCoveragePercent: number;
    invalidRecords: number;
    duplicateRecords: number;
    overallConfidence: number;
    missingFields?: string[];
    derivedVariables?: string[];
  }
): Promise<string> {
  // Check if quality record already exists for this version
  const check = await client.query<{ id: string }>(
    `SELECT id FROM data_qualities WHERE dataset_version_id = $1 LIMIT 1;`,
    [params.datasetVersionId]
  );

  if (check.rows.length > 0) {
    return check.rows[0].id;
  }

  const insert = await client.query<{ id: string }>(
    `INSERT INTO data_qualities (
      dataset_version_id, completeness_percent, spatial_coverage_percent,
      freshness_status, authoritative_sources, derived_variables, missing_fields,
      invalid_records, duplicate_records, overall_confidence
    ) VALUES ($1, $2, $3, 'current', ARRAY['NDEM', 'MHA Disaster Management Division'], $4, $5, $6, $7, $8)
    RETURNING id;`,
    [
      params.datasetVersionId,
      params.completenessPercent,
      params.spatialCoveragePercent,
      params.derivedVariables ?? ['district_hazard_profiles', 'temporal_aggregations'],
      params.missingFields ?? [],
      params.invalidRecords,
      params.duplicateRecords,
      params.overallConfidence,
    ]
  );

  return insert.rows[0].id;
}
