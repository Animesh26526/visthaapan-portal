/**
 * CLI Runner for Disaster Data Ingestion Pipeline.
 * Invoked via: npm run ingest:disasters
 */

import { runDisasterIngestion } from './ingestDisasters.js';
import { pool } from '../db/pool.js';
import { logger } from '../utils/logger.js';

async function main() {
  try {
    const summary = await runDisasterIngestion();
    console.log('\n============================================================');
    console.log('   VISTHAAPAN Phase 4 Ingestion Pipeline Summary');
    console.log('============================================================');
    console.log(`Version:              ${summary.versionNumber}`);
    console.log(`Source File:          ${summary.sourceFile}`);
    console.log(`SHA-256 Checksum:     ${summary.fileHash}`);
    console.log(`Total Physical Lines: ${summary.totalPhysicalLines.toLocaleString()}`);
    console.log(`Valid Records:        ${summary.totalValidRecords.toLocaleString()}`);
    console.log(`Surveillance Records: ${summary.surveillanceRecordsCount.toLocaleString()}`);
    console.log(`Active Disasters:     ${summary.activeDisasterCount.toLocaleString()}`);
    console.log(`Duplicates Removed:   ${summary.duplicateRecordsCount.toLocaleString()}`);
    console.log(`Lines Rejected:       ${summary.rejectedLinesCount.toLocaleString()}`);
    console.log(`States Covered:       ${summary.uniqueStatesCount}`);
    console.log(`Districts Covered:    ${summary.uniqueDistrictsCount}`);
    console.log(`Profiles Generated:   ${summary.districtProfilesGenerated}`);
    console.log(`Duration:             ${(summary.durationMs / 1000).toFixed(2)}s`);
    console.log('============================================================\n');
  } catch (err) {
    logger.error({ err }, 'Ingestion pipeline execution failed.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
