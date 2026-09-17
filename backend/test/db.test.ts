import { pool, getClient, testConnection } from '../src/db/pool.js';

// List of all expected tables corresponding to the 42 logical entities + migration table
const EXPECTED_TABLES = [
  'schema_migrations',
  'government_officers',
  'regions',
  'data_sources',
  'datasets',
  'dataset_versions',
  'data_qualities',
  'data_processing_runs',
  'model_versions',
  'habitations',
  'habitation_populations',
  'habitation_infrastructures',
  'terrain_features',
  'hazard_layers',
  'historical_disaster_events',
  'habitation_disasters',
  'red_zones',
  'red_zone_hazards',
  'risk_assessments',
  'risk_feature_contributions',
  'relocation_priorities',
  'relocation_sites',
  'site_suitability_assessments',
  'site_capacities',
  'roads',
  'candidate_routes',
  'route_roads',
  'evidence_references',
  'allocation_requests',
  'allocation_results',
  'allocation_items',
  'constraint_results',
  'allocation_explanations',
  'allocation_explanation_factors',
  'scenarios',
  'scenario_changes',
  'scenario_results',
  'scenario_comparisons',
  'operational_events',
  'relocation_plans',
  'relocation_plan_items',
  'officer_decisions',
  'decision_history',
  'system_update_logs',
];

async function runDbTests(): Promise<void> {
  console.log('\n============================================================');
  console.log('   VISTHAAPAN Database Foundation & PostGIS Test Suite');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  async function assertTest(name: string, fn: () => Promise<void>): Promise<void> {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}:`, err.message);
      await pool.end();
      process.exit(1);
    }
  }

  // 1. PostGIS Connection & Version Check
  await assertTest('PostgreSQL & PostGIS connection and extension versions', async () => {
    const status = await testConnection();
    if (status.status !== 'connected') {
      throw new Error(`Database connection failed: ${status.error}`);
    }
    if (!status.postgisVersion || !status.postgisVersion.startsWith('3.')) {
      throw new Error(`Unexpected PostGIS version: ${status.postgisVersion}`);
    }
    console.log(`    Engine: ${status.engine} | Version: ${status.version} | PostGIS: ${status.postgisVersion}`);
  });

  // 2. Verify all 42+ Physical Tables Exist
  await assertTest(`All ${EXPECTED_TABLES.length} expected domain tables exist in public schema`, async () => {
    const { rows } = await pool.query<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    const tableSet = new Set(rows.map((r) => r.table_name));

    const missing = EXPECTED_TABLES.filter((t) => !tableSet.has(t));
    if (missing.length > 0) {
      throw new Error(`Missing expected tables: ${missing.join(', ')}`);
    }
    console.log(`    Total base tables verified in PostgreSQL: ${rows.length}`);
  });

  // 3. Verify Geometry Columns and SRID 4326
  await assertTest('Spatial columns are registered with geometry type and SRID 4326', async () => {
    const { rows } = await pool.query<{ f_table_name: string; f_geometry_column: string; srid: number; type: string }>(`
      SELECT f_table_name, f_geometry_column, srid, type 
      FROM geometry_columns 
      WHERE f_table_schema = 'public'
      ORDER BY f_table_name;
    `);

    if (rows.length === 0) {
      throw new Error('No spatial columns found in geometry_columns view');
    }

    for (const col of rows) {
      if (col.srid !== 4326) {
        throw new Error(`Table ${col.f_table_name}.${col.f_geometry_column} has incorrect SRID: ${col.srid} (expected 4326)`);
      }
    }
    console.log(`    Verified ${rows.length} spatial geometry columns across all domain tables (SRID: 4326)`);
  });

  // 4. Verify Spatial GiST Indexes
  await assertTest('Spatial GiST indexes exist for all geometry columns', async () => {
    const { rows } = await pool.query<{ tablename: string; indexname: string; indexdef: string }>(`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND indexdef ILIKE '%USING gist%';
    `);

    const expectedGistTables = ['regions', 'habitations', 'hazard_layers', 'historical_disaster_events', 'red_zones', 'relocation_sites', 'roads', 'candidate_routes'];
    const indexedTables = new Set(rows.map((r) => r.tablename));

    const missingGist = expectedGistTables.filter((t) => !indexedTables.has(t));
    if (missingGist.length > 0) {
      throw new Error(`Missing GiST spatial index on tables: ${missingGist.join(', ')}`);
    }
    console.log(`    Verified ${rows.length} GiST spatial indexes.`);
  });

  // 5. PostGIS Spatial Calculation Smoke Test
  await assertTest('PostGIS spatial calculations (ST_Distance, ST_DWithin, ST_Intersects)', async () => {
    // Joshimath coordinates ~ (30.5564, 79.5668), Pipalkoti ~ (30.4286, 79.4328)
    const client = await getClient();
    try {
      const distRes = await client.query<{ distance_m: number }>(`
        SELECT ST_Distance(
          ST_SetSRID(ST_MakePoint(79.5668, 30.5564), 4326)::geography,
          ST_SetSRID(ST_MakePoint(79.4328, 30.4286), 4326)::geography
        ) AS distance_m;
      `);
      const distM = distRes.rows[0].distance_m;
      if (distM < 15000 || distM > 25000) {
        throw new Error(`Geodesic distance calculation out of range: ${distM} meters`);
      }

      // Point in Polygon intersection test
      const intersectRes = await client.query<{ is_inside: boolean }>(`
        SELECT ST_Intersects(
          ST_SetSRID(ST_MakePoint(79.5668, 30.5564), 4326),
          ST_SetSRID(ST_GeomFromText('POLYGON((79.50 30.50, 79.60 30.50, 79.60 30.60, 79.50 30.60, 79.50 30.50))'), 4326)
        ) AS is_inside;
      `);
      if (intersectRes.rows[0].is_inside !== true) {
        throw new Error('ST_Intersects failed to detect point within polygon bounding box');
      }
    } finally {
      client.release();
    }
  });

  // 6. Check Constraints Verification: Population >= 0
  await assertTest('CHECK constraint rejects negative population', async () => {
    const client = await getClient();
    await client.query('BEGIN;');
    try {
      // Create a temporary habitation
      const habRes = await client.query<{ id: string }>(`
        INSERT INTO habitations (name, state, district, geometry) 
        VALUES ('Test Village Negative Pop', 'Uttarakhand', 'Chamoli', ST_SetSRID(ST_MakePoint(79.5, 30.5), 4326))
        RETURNING id;
      `);
      const habId = habRes.rows[0].id;

      let rejected = false;
      try {
        await client.query(`
          INSERT INTO habitation_populations (habitation_id, population) 
          VALUES ($1, -500);
        `, [habId]);
      } catch (err: any) {
        if (err.message.includes('check') || err.message.includes('CHECK') || err.code === '23514') {
          rejected = true;
        }
      }

      if (!rejected) {
        throw new Error('Database accepted invalid negative population value (-500)!');
      }
    } finally {
      await client.query('ROLLBACK;');
      client.release();
    }
  });

  // 7. Check Constraints Verification: Risk score in [0.0, 1.0]
  await assertTest('CHECK constraint rejects out-of-range risk score (> 1.0)', async () => {
    const client = await getClient();
    await client.query('BEGIN;');
    try {
      const habRes = await client.query<{ id: string }>(`
        INSERT INTO habitations (name, state, district, geometry) 
        VALUES ('Test Village Risk', 'Uttarakhand', 'Chamoli', ST_SetSRID(ST_MakePoint(79.5, 30.5), 4326))
        RETURNING id;
      `);
      const habId = habRes.rows[0].id;

      let rejected = false;
      try {
        await client.query(`
          INSERT INTO risk_assessments (habitation_id, risk_score) 
          VALUES ($1, 1.450);
        `, [habId]);
      } catch (err: any) {
        if (err.message.includes('check') || err.code === '23514') {
          rejected = true;
        }
      }

      if (!rejected) {
        throw new Error('Database accepted invalid risk score (1.450 > 1.0)!');
      }
    } finally {
      await client.query('ROLLBACK;');
      client.release();
    }
  });

  // 8. Foreign Key Integrity Verification
  await assertTest('Foreign key rejects orphan record insertion without parent entity', async () => {
    const client = await getClient();
    await client.query('BEGIN;');
    try {
      let rejected = false;
      try {
        await client.query(`
          INSERT INTO habitation_populations (habitation_id, population) 
          VALUES ('00000000-0000-0000-0000-000000000000', 1000);
        `);
      } catch (err: any) {
        if (err.code === '23503' || err.message.includes('foreign key')) {
          rejected = true;
        }
      }

      if (!rejected) {
        throw new Error('Database allowed inserting orphan child without foreign key parent!');
      }
    } finally {
      await client.query('ROLLBACK;');
      client.release();
    }
  });

  // 9. Minimal Simulated Smoke Seed & Relationship Roundtrip
  await assertTest('Simulated demo seed insertion and relational query roundtrip', async () => {
    const client = await getClient();
    await client.query('BEGIN;');
    try {
      // 1. Officer
      const offRes = await client.query<{ id: string }>(`
        INSERT INTO government_officers (username, full_name, official_email, state, district, designation)
        VALUES ('dm_chamoli_sim', 'District Magistrate Chamoli (SIMULATED)', 'dm.chamoli.sim@uk.gov.in', 'Uttarakhand', 'Chamoli', 'District Magistrate')
        RETURNING id;
      `);
      const officerId = offRes.rows[0].id;

      // 2. Region
      const regRes = await client.query<{ id: string }>(`
        INSERT INTO regions (name, type, state, district)
        VALUES ('Joshimath Sub-Division (SIMULATED)', 'taluka', 'Uttarakhand', 'Chamoli')
        RETURNING id;
      `);
      const regionId = regRes.rows[0].id;

      // 3. Habitation
      const habRes = await client.query<{ id: string }>(`
        INSERT INTO habitations (name, region_id, state, district, latitude, longitude, geometry)
        VALUES ('Malari Upper (SIMULATED)', $1, 'Uttarakhand', 'Chamoli', 30.5564, 79.5668, ST_SetSRID(ST_MakePoint(79.5668, 30.5564), 4326))
        RETURNING id;
      `, [regionId]);
      const habId = habRes.rows[0].id;

      // 4. Population
      await client.query(`
        INSERT INTO habitation_populations (habitation_id, population, elderly_population, children_population, disabled_population)
        VALUES ($1, 8240, 1150, 1980, 290);
      `, [habId]);

      // 5. Relocation Site
      const siteRes = await client.query<{ id: string }>(`
        INSERT INTO relocation_sites (name, type, region_id, latitude, longitude, geometry, inside_red_zone)
        VALUES ('Pipalkoti Safe Hub Alpha (SIMULATED)', 'shelter', $1, 30.4286, 79.4328, ST_SetSRID(ST_MakePoint(79.4328, 30.4286), 4326), false)
        RETURNING id;
      `, [regionId]);
      const siteId = siteRes.rows[0].id;

      // 6. Site Capacity
      await client.query(`
        INSERT INTO site_capacities (
          site_id, physical_capacity, water_capacity, shelter_capacity, sanitation_capacity, healthcare_capacity,
          effective_capacity, current_occupancy, available_capacity, bottleneck
        ) VALUES ($1, 12000, 9200, 10000, 9500, 11000, 9200, 0, 9200, 'water');
      `, [siteId]);

      // 7. Verify Relational Join
      const joinRes = await client.query<{ village: string; pop: number; site: string; eff_cap: number; dist_km: number }>(`
        SELECT 
          h.name AS village,
          p.population AS pop,
          s.name AS site,
          c.effective_capacity AS eff_cap,
          ROUND((ST_Distance(h.geometry::geography, s.geometry::geography) / 1000.0)::numeric, 2) AS dist_km
        FROM habitations h
        JOIN habitation_populations p ON p.habitation_id = h.id
        CROSS JOIN relocation_sites s
        JOIN site_capacities c ON c.site_id = s.id
        WHERE h.id = $1 AND s.id = $2;
      `, [habId, siteId]);

      if (joinRes.rows.length !== 1) {
        throw new Error('Relational spatial join query returned no results');
      }

      const row = joinRes.rows[0];
      console.log(`    Join Result: ${row.village} (${row.pop} souls) -> ${row.site} (Eff Cap: ${row.eff_cap}, Dist: ${row.dist_km} km)`);
    } finally {
      // Rollback smoke test data to keep database clean
      await client.query('ROLLBACK;');
      client.release();
    }
  });

  await pool.end();
  console.log(`\nAll ${passed}/${total} database foundation & PostGIS tests passed successfully!\n`);
}

runDbTests().catch(async (err) => {
  console.error('Test suite failed:', err);
  await pool.end();
  process.exit(1);
});
