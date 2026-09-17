/**
 * VISTHAAPAN NDEM District Concordance Mapper.
 * Maps all NDEM districts from district_hazard_profiles to canonical_districts,
 * recording resolution methods and confidence in district_identity_mappings.
 */

import { PoolClient } from 'pg';
import { getClient } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import { CanonicalDistrictIndex, CanonicalDistrictRecord } from './districtAliases.js';

export interface NdemMappingSummary {
  totalNdemDistricts: number;
  matchedCount: number;
  unmatchedCount: number;
  exactMatches: number;
  aliasMatches: number;
  durationMs: number;
}

export async function mapNdemDistricts(): Promise<NdemMappingSummary> {
  const startTime = Date.now();
  logger.info('Starting NDEM to Canonical District concordance mapping...');

  const client: PoolClient = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Load Canonical District Index
    const cdRes = await client.query(`
      SELECT id, state_code AS "stateCode", state_name AS "stateName",
             state_census2011_code AS "stateCensus2011Code",
             district_code AS "districtCode", district_name AS "districtName",
             district_census2011_code AS "districtCensus2011Code"
      FROM canonical_districts
    `);
    const canonicalIndex = new CanonicalDistrictIndex(cdRes.rows as CanonicalDistrictRecord[]);

    // 2. Query distinct NDEM districts from district_hazard_profiles
    const dhpRes = await client.query(`
      SELECT DISTINCT state_name, district_name
      FROM district_hazard_profiles
      ORDER BY state_name, district_name
    `);

    let matchedCount = 0;
    let unmatchedCount = 0;
    let exactMatches = 0;
    let aliasMatches = 0;

    for (const row of dhpRes.rows) {
      const match = canonicalIndex.matchByName(row.state_name, row.district_name);

      if (match.canonicalDistrictId) {
        matchedCount++;
        if (match.mappingStatus === 'NORMALIZED_EXACT' || match.mappingStatus === 'EXACT') {
          exactMatches++;
        } else if (match.mappingStatus === 'CONTROLLED_ALIAS') {
          aliasMatches++;
        }
      } else {
        unmatchedCount++;
      }

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
        [
          'NDEM',
          row.state_name,
          row.district_name,
          match.canonicalDistrictId || null,
          match.mappingStatus,
          match.mappingMethod,
          match.confidence,
          match.notes,
        ]
      );
    }

    await client.query('COMMIT');

    const durationMs = Date.now() - startTime;
    logger.info(
      { totalNdemDistricts: dhpRes.rows.length, matchedCount, unmatchedCount, exactMatches, aliasMatches, durationMs },
      'NDEM districts mapped successfully.'
    );

    return {
      totalNdemDistricts: dhpRes.rows.length,
      matchedCount,
      unmatchedCount,
      exactMatches,
      aliasMatches,
      durationMs,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Failed to map NDEM districts');
    throw error;
  } finally {
    client.release();
  }
}
