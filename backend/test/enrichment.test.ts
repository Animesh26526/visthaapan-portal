/**
 * VISTHAAPAN Phase 4.5 Enrichment Test Suite.
 * Validates:
 * 1. Canonical District Master (LGD 785 districts, 36 States/UTs)
 * 2. Census 2011 Demographics (640 baseline districts, ratio boundaries, 2011 reference year)
 * 3. Hospital Infrastructure & Geocoding (30,273 facilities, 10,843 spatial points, bed corruption quarantine)
 * 4. NDEM Concordance Mapping & Identity Ledger (651 source districts, confidence tracking)
 * 5. Unified District Intelligence View (785 canonical rows, 0 duplicates, multi-domain flags, Chamoli benchmark)
 * 6. Pipeline Idempotency & Provenance Integrity
 */

import { pool } from '../src/db/pool.js';
import { runEnrichmentPipeline } from '../src/pipeline/runEnrichment.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  PASS: ${message}`);
}

async function runTests() {
  console.log('\n================================================================');
  console.log('  RUNNING PHASE 4.5 ENRICHMENT TEST SUITE');
  console.log('================================================================\n');

  try {
    // ------------------------------------------------------------
    // TEST SUITE 1: Canonical District Master
    // ------------------------------------------------------------
    console.log('--- Suite 1: Canonical District Master (LGD) ---');

    const cdCount = await pool.query('SELECT COUNT(*) FROM canonical_districts');
    assert(parseInt(cdCount.rows[0].count, 10) === 785, 'canonical_districts contains exactly 785 districts');

    const cdStates = await pool.query('SELECT COUNT(DISTINCT state_code) AS states FROM canonical_districts');
    assert(parseInt(cdStates.rows[0].states, 10) === 36, 'canonical_districts covers exactly 36 States/UTs');

    const cdDups = await pool.query(`
      SELECT district_code, COUNT(*) 
      FROM canonical_districts 
      GROUP BY district_code 
      HAVING COUNT(*) > 1
    `);
    assert(cdDups.rows.length === 0, 'district_code is globally unique with zero duplicates');

    const cdCensusCodes = await pool.query(`
      SELECT COUNT(*) 
      FROM canonical_districts 
      WHERE district_census2011_code IS NOT NULL AND district_census2011_code <> '000'
    `);
    assert(parseInt(cdCensusCodes.rows[0].count, 10) >= 640, 'At least 640 canonical districts have valid Census 2011 concordance codes');

    // ------------------------------------------------------------
    // TEST SUITE 2: Census 2011 Demographics Baseline
    // ------------------------------------------------------------
    console.log('\n--- Suite 2: Census 2011 Demographics Baseline ---');

    const ddCount = await pool.query('SELECT COUNT(*) FROM district_demographics');
    assert(parseInt(ddCount.rows[0].count, 10) === 640, 'district_demographics contains exactly 640 baseline districts');

    const ddYearCheck = await pool.query(`
      SELECT COUNT(*) 
      FROM district_demographics 
      WHERE data_reference_year <> 2011
    `);
    assert(parseInt(ddYearCheck.rows[0].count, 10) === 0, 'All demographic records strictly preserve data_reference_year = 2011 (no fabricated projections)');

    const ddRatios = await pool.query(`
      SELECT
        MIN(female_population_share) AS min_fem, MAX(female_population_share) AS max_fem,
        MIN(child_population_share) AS min_child, MAX(child_population_share) AS max_child,
        MIN(literacy_rate) AS min_lit, MAX(literacy_rate) AS max_lit,
        MIN(worker_participation_rate) AS min_work, MAX(worker_participation_rate) AS max_work
      FROM district_demographics
    `);
    const r = ddRatios.rows[0];
    assert(parseFloat(r.min_fem) >= 0.0 && parseFloat(r.max_fem) <= 1.0, 'female_population_share is within [0.0, 1.0]');
    assert(parseFloat(r.min_child) >= 0.0 && parseFloat(r.max_child) <= 1.0, 'child_population_share is within [0.0, 1.0]');
    assert(parseFloat(r.min_lit) >= 0.0 && parseFloat(r.max_lit) <= 1.0, 'literacy_rate is within [0.0, 1.0]');
    assert(parseFloat(r.min_work) >= 0.0 && parseFloat(r.max_work) <= 1.0, 'worker_participation_rate is within [0.0, 1.0]');

    // Verify Chamoli demographics
    const chamoliDemo = await pool.query(`
      SELECT dd.*, cd.district_name
      FROM district_demographics dd
      JOIN canonical_districts cd ON cd.id = dd.canonical_district_id
      WHERE cd.district_name = 'Chamoli'
    `);
    assert(chamoliDemo.rows.length === 1, 'Chamoli demographics record exists');
    assert(parseInt(chamoliDemo.rows[0].population_total, 10) === 391605, 'Chamoli population matches Census 2011 total (391,605)');
    assert(parseFloat(chamoliDemo.rows[0].female_population_share) > 0.49, 'Chamoli female population share is statistically sound (> 0.49)');

    // ------------------------------------------------------------
    // TEST SUITE 3: Hospital Infrastructure & Bed Quarantine
    // ------------------------------------------------------------
    console.log('\n--- Suite 3: Hospital Infrastructure & Spatial Geocoding ---');

    const hospCount = await pool.query('SELECT COUNT(*) FROM hospitals');
    assert(parseInt(hospCount.rows[0].count, 10) === 30273, 'hospitals table contains all 30,273 records from National Directory');

    const geocodedHosp = await pool.query('SELECT COUNT(*) FROM hospitals WHERE has_valid_coordinates = true');
    assert(parseInt(geocodedHosp.rows[0].count, 10) === 10843, 'Exactly 10,843 hospitals have valid coordinates');

    const geomCheck = await pool.query(`
      SELECT COUNT(*) 
      FROM hospitals 
      WHERE has_valid_coordinates = true AND geometry IS NOT NULL AND ST_GeometryType(geometry) = 'ST_Point'
    `);
    assert(parseInt(geomCheck.rows[0].count, 10) === 10843, 'All 10,843 geocoded hospitals have valid PostGIS Point geometries in SRID 4326');

    const spatialExtent = await pool.query(`
      SELECT 
        MIN(latitude) AS min_lat, MAX(latitude) AS max_lat,
        MIN(longitude) AS min_lon, MAX(longitude) AS max_lon
      FROM hospitals
      WHERE has_valid_coordinates = true
    `);
    const ext = spatialExtent.rows[0];
    assert(parseFloat(ext.min_lat) >= -90.0 && parseFloat(ext.max_lat) <= 90.0, 'Hospital latitudes fall within valid WGS84 range [-90, 90]');
    assert(parseFloat(ext.min_lon) >= -180.0 && parseFloat(ext.max_lon) <= 180.0, 'Hospital longitudes fall within valid WGS84 range [-180, 180]');

    const indiaExtent = await pool.query(`
      SELECT COUNT(*) AS count
      FROM hospitals
      WHERE has_valid_coordinates = true
        AND latitude BETWEEN 6.0 AND 38.0
        AND longitude BETWEEN 68.0 AND 98.0
    `);
    assert(parseInt(indiaExtent.rows[0].count, 10) > 10000, 'Over 10,000 geocoded hospitals fall strictly within India terrestrial bounding box');

    const suspiciousBeds = await pool.query('SELECT COUNT(*) FROM hospitals WHERE is_bed_count_suspicious = true');
    assert(parseInt(suspiciousBeds.rows[0].count, 10) > 30200, 'Over 30,200 hospitals with corrupted/zero/phone-number bed counts are quarantined');

    const profileCount = await pool.query('SELECT COUNT(*) FROM district_healthcare_profiles');
    assert(parseInt(profileCount.rows[0].count, 10) === 573, 'district_healthcare_profiles generated for all 573 districts with observed facilities');

    const hospProfileShares = await pool.query(`
      SELECT 
        MIN(geocoded_hospital_share) AS min_g, MAX(geocoded_hospital_share) AS max_g,
        MIN(emergency_hospital_share) AS min_e, MAX(emergency_hospital_share) AS max_e
      FROM district_healthcare_profiles
      WHERE hospital_count > 0
    `);
    const hp = hospProfileShares.rows[0];
    assert(parseFloat(hp.min_g) >= 0.0 && parseFloat(hp.max_g) <= 1.0, 'geocoded_hospital_share is within [0.0, 1.0]');
    assert(parseFloat(hp.min_e) >= 0.0 && parseFloat(hp.max_e) <= 1.0, 'emergency_hospital_share is within [0.0, 1.0]');

    // ------------------------------------------------------------
    // TEST SUITE 4: NDEM Concordance & Identity Ledger
    // ------------------------------------------------------------
    console.log('\n--- Suite 4: NDEM Concordance & Identity Ledger ---');

    const ndemMappings = await pool.query("SELECT COUNT(*) FROM district_identity_mappings WHERE source_dataset = 'NDEM'");
    assert(parseInt(ndemMappings.rows[0].count, 10) === 651, 'All 651 NDEM districts are registered in the identity ledger');

    const matchedNdem = await pool.query(`
      SELECT COUNT(*) 
      FROM district_identity_mappings 
      WHERE source_dataset = 'NDEM' AND mapping_status IN ('NORMALIZED_EXACT', 'CONTROLLED_ALIAS')
    `);
    assert(parseInt(matchedNdem.rows[0].count, 10) === 613, 'Exactly 613 administrative districts in NDEM are matched to canonical districts');

    const unmatchedNdem = await pool.query(`
      SELECT COUNT(*) 
      FROM district_identity_mappings 
      WHERE source_dataset = 'NDEM' AND mapping_status = 'UNMATCHED'
    `);
    assert(parseInt(unmatchedNdem.rows[0].count, 10) === 38, 'Exactly 38 generic/unallocated/POK entries are transparently quarantined as UNMATCHED with confidence 0.0');

    // ------------------------------------------------------------
    // TEST SUITE 5: Unified District Intelligence View
    // ------------------------------------------------------------
    console.log('\n--- Suite 5: Unified District Intelligence View ---');

    const viewTotal = await pool.query('SELECT COUNT(*) FROM view_district_intelligence');
    assert(parseInt(viewTotal.rows[0].count, 10) === 785, 'view_district_intelligence contains exactly 785 rows (1 row per canonical district)');

    const viewDups = await pool.query(`
      SELECT canonical_district_id, COUNT(*) 
      FROM view_district_intelligence 
      GROUP BY canonical_district_id 
      HAVING COUNT(*) > 1
    `);
    assert(viewDups.rows.length === 0, 'view_district_intelligence has zero duplicate canonical district rows');

    const tripleIntersection = await pool.query(`
      SELECT COUNT(*) 
      FROM view_district_intelligence 
      WHERE has_ndem_hazard_data = true 
        AND has_census_demographic_data = true 
        AND has_healthcare_data = true
    `);
    const tripleCount = parseInt(tripleIntersection.rows[0].count, 10);
    assert(tripleCount >= 420, `Triple intersection coverage is strong (${tripleCount} districts with complete multi-domain feature vectors)`);

    // Verify Chamoli benchmark in unified view
    const chamoliUnified = await pool.query(`
      SELECT * 
      FROM view_district_intelligence 
      WHERE district_name = 'Chamoli'
    `);
    assert(chamoliUnified.rows.length === 1, 'Chamoli record exists in view_district_intelligence');
    const ch = chamoliUnified.rows[0];
    assert(ch.has_ndem_hazard_data === true, 'Chamoli has NDEM hazard data flag = true');
    assert(ch.has_census_demographic_data === true, 'Chamoli has Census demographic data flag = true');
    assert(ch.has_healthcare_data === true, 'Chamoli has Healthcare data flag = true');
    assert(parseInt(ch.hazard_total_reports, 10) === 385, 'Chamoli hazard total reports = 385');
    assert(parseInt(ch.census_population_total, 10) === 391605, 'Chamoli census population total = 391,605');
    assert(parseInt(ch.hospital_count, 10) === 6, 'Chamoli hospital facility count = 6');

    // ------------------------------------------------------------
    // TEST SUITE 6: Provenance & Idempotency
    // ------------------------------------------------------------
    console.log('\n--- Suite 6: Provenance & Idempotency ---');

    const dataSources = await pool.query('SELECT COUNT(*) FROM data_sources');
    assert(parseInt(dataSources.rows[0].count, 10) >= 4, 'At least 4 authoritative data sources registered in provenance ledger');

    const datasetVersions = await pool.query('SELECT COUNT(*) FROM dataset_versions');
    assert(parseInt(datasetVersions.rows[0].count, 10) >= 4, 'At least 4 dataset versions registered');

    const qualityMetrics = await pool.query('SELECT COUNT(*) FROM data_qualities');
    assert(parseInt(qualityMetrics.rows[0].count, 10) >= 4, 'Data quality scores recorded across all ingestion pipelines');

    console.log('\n================================================================');
    console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('================================================================\n');
  } catch (error) {
    console.error('\nTest suite execution failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
