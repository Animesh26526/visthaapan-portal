/**
 * CLI Runner for Deterministic Chamoli Demonstration Benchmark.
 * Invoked via: npm run seed:benchmark
 */

import { seedDemonstrationBenchmark } from './seedBenchmark.js';
import { pool } from '../db/pool.js';
import { logger } from '../utils/logger.js';

async function main() {
  try {
    const summary = await seedDemonstrationBenchmark();
    console.log('\n============================================================');
    console.log('   VISTHAAPAN Demonstration Benchmark Seeding Summary');
    console.log('============================================================');
    console.log(`Data Source ID:          ${summary.dataSourceId}`);
    console.log(`Dataset Version ID:      ${summary.datasetVersionId}`);
    console.log(`Regions Created:         ${summary.regionsCreated}`);
    console.log(`Planning Units (Source): ${summary.planningUnitsCreated}`);
    console.log(`Relocation Sites (Safe): ${summary.relocationSitesCreated}`);
    console.log(`Feasible Transit Routes: ${summary.routesCreated}`);
    console.log(`Operational Scenarios:   ${summary.scenariosCreated}`);
    console.log(`Execution Duration:      ${(summary.durationMs / 1000).toFixed(2)}s`);
    console.log('============================================================\n');
  } catch (err) {
    logger.error({ err }, 'Benchmark seeding execution failed.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
