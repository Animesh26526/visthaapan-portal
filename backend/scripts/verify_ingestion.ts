/**
 * Verification Script for Phase 4 Ingestion Pipeline.
 * Checks provenance tables, district events count, and district hazard profiles.
 */

import { pool } from '../src/db/pool.js';

async function verify() {
  console.log('--- Checking Provenance Records ---');
  const sources = await pool.query('SELECT id, dataset_name, source_organization, source_type FROM data_sources;');
  console.log('data_sources:', sources.rows);

  const datasets = await pool.query('SELECT id, name, data_type, format FROM datasets;');
  console.log('datasets:', datasets.rows);

  const versions = await pool.query('SELECT id, version_number, record_count, quality_score, processing_status FROM dataset_versions;');
  console.log('dataset_versions:', versions.rows);

  const runs = await pool.query('SELECT id, process_type, status, records_input, records_output, error_count FROM data_processing_runs;');
  console.log('data_processing_runs:', runs.rows);

  const qualities = await pool.query('SELECT id, completeness_percent, duplicate_records, invalid_records, overall_confidence FROM data_qualities;');
  console.log('data_qualities:', qualities.rows);

  console.log('\n--- Checking District Disaster Events ---');
  const eventCount = await pool.query('SELECT COUNT(*) FROM district_disaster_events;');
  console.log('Total district_disaster_events:', eventCount.rows[0].count);

  console.log('\n--- Checking Chamoli District Hazard Profile ---');
  const chamoli = await pool.query(`
    SELECT
      district_name, state_name, total_reports_count, surveillance_reports_count,
      active_event_count, hazard_diversity_count, primary_hazard_type,
      deaths_total, injured_total, missing_total, houses_damaged_total,
      villages_affected_total, population_affected_total,
      events_last_30_days, events_last_90_days, events_last_365_days,
      historical_event_count, hazard_breakdown
    FROM district_hazard_profiles
    WHERE state_name = 'Uttarakhand' AND district_name = 'Chamoli';
  `);
  console.log('Chamoli Profile:', JSON.stringify(chamoli.rows[0], null, 2));

  console.log('\n--- Top 10 Most Affected Districts in India ---');
  const topDistricts = await pool.query(`
    SELECT state_name, district_name, active_event_count, deaths_total, injured_total, population_affected_total, primary_hazard_type
    FROM district_hazard_profiles
    ORDER BY active_event_count DESC
    LIMIT 10;
  `);
  console.table(topDistricts.rows);

  await pool.end();
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
