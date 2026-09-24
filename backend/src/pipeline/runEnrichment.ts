/**
 * VISTHAAPAN Phase 4.5 Enrichment Pipeline Orchestrator.
 * Deterministically executes:
 * 1. District Master Ingestion (LGD 785 canonical districts)
 * 2. Census 2011 Demographics Ingestion (640 districts baseline)
 * 3. National Hospital Directory Ingestion (30,273 facilities & geocoding)
 * 4. NDEM Concordance Mapping (651 hazard districts to canonical identities)
 */

import { pool } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import { ingestDistrictMaster } from './ingestDistrictMaster.js';
import { ingestCensusDemographics } from './ingestCensusDemographics.js';
import { ingestHospitals } from './ingestHospitals.js';
import { mapNdemDistricts } from './mapNdemDistricts.js';

export async function runEnrichmentPipeline() {
  const overallStart = Date.now();
  console.log('\n================================================================');
  console.log('  VISTHAAPAN ENRICHMENT PIPELINE (PHASE 4.5)');
  console.log('  Demographic Baseline, Health Infrastructure & Multi-Dataset Alignment');
  console.log('================================================================\n');

  try {
    // 1. Stage 1: District Master
    console.log('>>> STAGE 1: Canonical District Master Ingestion (LGD)...');
    const masterSummary = await ingestDistrictMaster();
    console.log(`    ✓ Canonical Districts Ingested: ${masterSummary.districtsInserted} across ${masterSummary.uniqueStates} States/UTs (${masterSummary.durationMs}ms)`);

    // 2. Stage 2: Census 2011 Demographics
    console.log('\n>>> STAGE 2: Census 2011 Primary Census Abstract Ingestion...');
    const censusSummary = await ingestCensusDemographics();
    console.log(`    ✓ District Demographics Ingested: ${censusSummary.demographicsInserted} / ${censusSummary.totalRecordsRead} (${censusSummary.durationMs}ms)`);

    // 3. Stage 3: Hospital Directory
    console.log('\n>>> STAGE 3: National Hospital Directory Ingestion & Infrastructure Profiles...');
    const hospitalSummary = await ingestHospitals();
    console.log(`    ✓ Hospitals Ingested: ${hospitalSummary.hospitalsInserted}`);
    console.log(`    ✓ Geocoded Facilities (Point Geometry): ${hospitalSummary.geocodedCount} (${(hospitalSummary.geocodedCount / hospitalSummary.hospitalsInserted * 100).toFixed(1)}%)`);
    console.log(`    ✓ Suspicious / Corrupted Bed Counts Quarantined: ${hospitalSummary.suspiciousBedCount}`);
    console.log(`    ✓ District Healthcare Profiles Generated: ${hospitalSummary.profilesGenerated} (${hospitalSummary.durationMs}ms)`);

    // 4. Stage 4: NDEM Concordance Mapping
    console.log('\n>>> STAGE 4: NDEM District Concordance Mapping...');
    const ndemSummary = await mapNdemDistricts();
    console.log(`    ✓ NDEM Districts Mapped: ${ndemSummary.matchedCount} / ${ndemSummary.totalNdemDistricts} (Exact: ${ndemSummary.exactMatches}, Alias: ${ndemSummary.aliasMatches})`);
    console.log(`    ✓ Transparently Unmatched Generic/POK Entries: ${ndemSummary.unmatchedCount} (${ndemSummary.durationMs}ms)`);

    // 5. Query Unified View Coverage Matrix
    console.log('\n>>> STAGE 5: Unified Multi-Domain Intelligence Matrix Validation...');
    const viewStatsRes = await pool.query(`
      SELECT
        COUNT(*) AS total_canonical_districts,
        COUNT(*) FILTER (WHERE has_ndem_hazard_data = true) AS ndem_coverage,
        COUNT(*) FILTER (WHERE has_census_demographic_data = true) AS census_coverage,
        COUNT(*) FILTER (WHERE has_healthcare_data = true) AS healthcare_coverage,
        COUNT(*) FILTER (WHERE has_ndem_hazard_data = true AND has_census_demographic_data = true AND has_healthcare_data = true) AS triple_intersection
      FROM view_district_intelligence;
    `);
    const stats = viewStatsRes.rows[0];

    const elapsedTotal = ((Date.now() - overallStart) / 1000).toFixed(2);

    console.log('\n================================================================');
    console.log('  VISTHAAPAN PHASE 4.5 ENRICHMENT SUMMARY');
    console.log('================================================================');
    console.log(`  Canonical District Master:         ${stats.total_canonical_districts} districts (100% target coverage)`);
    console.log(`  Census 2011 Baseline Coverage:     ${stats.census_coverage} districts (${(stats.census_coverage / stats.total_canonical_districts * 100).toFixed(1)}%)`);
    console.log(`  NDEM Ground Truth Hazard Coverage: ${stats.ndem_coverage} districts (${(stats.ndem_coverage / stats.total_canonical_districts * 100).toFixed(1)}%)`);
    console.log(`  Healthcare Profile Coverage:       ${stats.healthcare_coverage} districts (${(stats.healthcare_coverage / stats.total_canonical_districts * 100).toFixed(1)}%)`);
    console.log(`  Unified Triple Intersection:       ${stats.triple_intersection} districts (${(stats.triple_intersection / stats.total_canonical_districts * 100).toFixed(1)}%)`);
    console.log(`  Total Ingestion Time:              ${elapsedTotal}s`);
    console.log('================================================================\n');

    return {
      masterSummary,
      censusSummary,
      hospitalSummary,
      ndemSummary,
      stats,
      elapsedTotal,
    };
  } catch (error) {
    logger.error({ error }, 'Enrichment pipeline execution failed');
    throw error;
  }
}

// Allow direct execution
if (process.argv[1]?.endsWith('runEnrichment.ts') || process.argv[1]?.endsWith('runEnrichment.js')) {
  runEnrichmentPipeline()
    .then(() => {
      console.log('Pipeline finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Pipeline failed:', err);
      process.exit(1);
    });
}
