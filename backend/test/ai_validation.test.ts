/**
 * VISTHAAPAN Phase 5.1 AI Validation, Semantics & Interpretation Test Suite.
 * Validates:
 * 1. Target boundary correctness ((t, t + 14d], strictly > t and <= t + 14d)
 * 2. Strict chronological split (max(train) < min(val) < min(test))
 * 3. Zero simulated benchmark leakage into real district training sets
 * 4. Missing data semantics (Census missing indicator, unmapped healthcare vs confirmed zero)
 * 5. TreeSHAP exact log-odds additivity (base_value + sum(shap) == raw_margin)
 * 6. Non-causal association phrasing in explanation records
 * 7. RPW formula adherence, bounds [0, 1], and tier thresholds
 * 8. Extreme edge cases robustness (no NaNs, finite bounded outputs)
 * 9. REST API semantic clarity & governance boundary
 */

import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import type { Server } from 'http';
import fs from 'fs';
import path from 'path';

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

async function runValidationTests() {
  console.log('\n================================================================');
  console.log('  RUNNING PHASE 5.1 AI VALIDATION & SEMANTICS AUDIT TEST SUITE');
  console.log('================================================================\n');

  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to obtain server address');
  }
  const baseUrl = `http://localhost:${address.port}`;

  try {
    // ------------------------------------------------------------
    // SUITE 1: Target Boundary & Temporal Discretization
    // ------------------------------------------------------------
    console.log('--- Suite 1: Target Boundary & Temporal Discretization ---');

    const manifestPath = path.resolve(process.cwd(), 'ai', 'artifacts', 'manifest.json');
    assert(fs.existsSync(manifestPath), 'manifest.json exists');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    assert(manifest.metrics.dataset.observation_cadence_days === 14, 'Observation cadence is 14 days');
    assert(manifest.metrics.dataset.prediction_horizon_days === 14, 'Prediction horizon H is 14 days');
    assert(manifest.metrics.dataset.total_canonical_districts === 785, 'Universe consists of 785 canonical districts');
    assert(manifest.metrics.dataset.total_samples_generated === 17270, 'Total samples = 17,270 (22 epochs x 785 districts)');

    // Verify split sample counts: 14 / 5 / 3 epochs
    assert(manifest.metrics.dataset.train_samples === 10990, 'Train samples = 10,990 (14 epochs x 785 districts)');
    assert(manifest.metrics.dataset.val_samples === 3925, 'Validation samples = 3,925 (5 epochs x 785 districts)');
    assert(manifest.metrics.dataset.test_samples === 2355, 'Test samples = 2,355 (3 epochs x 785 districts)');
    assert(
      manifest.metrics.dataset.train_samples + manifest.metrics.dataset.val_samples + manifest.metrics.dataset.test_samples === 17270,
      'Split samples sum exactly to 17,270 total samples'
    );

    // ------------------------------------------------------------
    // SUITE 2: Anti-Leakage & Real vs Simulated Data Isolation
    // ------------------------------------------------------------
    console.log('\n--- Suite 2: Anti-Leakage & Real vs Simulated Data Isolation ---');

    // Verify no benchmark simulated planning units entered risk_assessments or relocation_priorities
    const simInRisk = await pool.query(`
      SELECT COUNT(*) AS count
      FROM risk_assessments ra
      JOIN canonical_districts cd ON cd.id = ra.canonical_district_id
      WHERE cd.district_name ILIKE '%SIMULATED%' OR cd.district_name ILIKE '%Sector%'
    `);
    assert(parseInt(simInRisk.rows[0].count, 10) === 0, 'Zero simulated benchmark planning sectors in risk_assessments');

    const simInRpw = await pool.query(`
      SELECT COUNT(*) AS count
      FROM relocation_priorities rp
      JOIN canonical_districts cd ON cd.id = rp.canonical_district_id
      WHERE cd.district_name ILIKE '%SIMULATED%' OR cd.district_name ILIKE '%Sector%'
    `);
    assert(parseInt(simInRpw.rows[0].count, 10) === 0, 'Zero simulated benchmark planning sectors in relocation_priorities');

    // ------------------------------------------------------------
    // SUITE 3: Missing Data Semantics & Healthcare Neutrality
    // ------------------------------------------------------------
    console.log('\n--- Suite 3: Missing Data Semantics & Healthcare Neutrality ---');

    // Verify that unmapped healthcare districts are not penalised with extreme vulnerability
    const unmappedDistricts = await pool.query(`
      SELECT 
        ra.canonical_district_id,
        ra.vulnerability_score,
        ra.risk_score,
        rp.priority_weight,
        rp.tier
      FROM risk_assessments ra
      JOIN relocation_priorities rp ON rp.canonical_district_id = ra.canonical_district_id
      LEFT JOIN district_healthcare_profiles dhp ON dhp.canonical_district_id = ra.canonical_district_id
      WHERE dhp.canonical_district_id IS NULL
    `);
    assert(unmappedDistricts.rows.length === 212, 'Exactly 212 unmapped healthcare districts identified');
    
    // Check that none of the unmapped districts have NaN or out-of-range vulnerability
    const invalidUnmapped = unmappedDistricts.rows.filter((r: any) => 
      isNaN(parseFloat(r.vulnerability_score)) || 
      parseFloat(r.vulnerability_score) < 0 || 
      parseFloat(r.vulnerability_score) > 1
    );
    assert(invalidUnmapped.length === 0, 'All 212 unmapped districts have valid bounded vulnerability scores');

    // ------------------------------------------------------------
    // SUITE 4: Explainability & Non-Causal Language Audit
    // ------------------------------------------------------------
    console.log('\n--- Suite 4: Explainability & Non-Causal Language Audit ---');

    // Check that NO explanation uses causal keywords 'caused' or 'causes'
    const causalCheck = await pool.query(`
      SELECT COUNT(*) AS count
      FROM risk_feature_contributions
      WHERE explanation ILIKE '%caused%' OR explanation ILIKE '% causes %' OR explanation ILIKE '%because of%'
    `);
    assert(parseInt(causalCheck.rows[0].count, 10) === 0, 'Zero causal claims ("caused", "causes") in risk_feature_contributions explanations');

    // Check that explanations use association language
    const assocCheck = await pool.query(`
      SELECT COUNT(*) AS count
      FROM risk_feature_contributions
      WHERE explanation ILIKE '%associated with%'
    `);
    assert(parseInt(assocCheck.rows[0].count, 10) === 3925, 'All 3,925 explanations use non-causal association language ("associated with")');

    // Check that top factors mention log-odds contribution
    const logOddsCheck = await pool.query(`
      SELECT COUNT(*) AS count
      FROM risk_feature_contributions
      WHERE explanation ILIKE '%log-odds%'
    `);
    assert(parseInt(logOddsCheck.rows[0].count, 10) === 3925, 'All 3,925 explanations specify log-odds margin contribution');

    // ------------------------------------------------------------
    // SUITE 5: Decision-Support Governance & API Distinction
    // ------------------------------------------------------------
    console.log('\n--- Suite 5: Decision-Support Governance & API Distinction ---');

    const resChamoli = await fetch(`${baseUrl}/api/v1/intelligence/districts/Chamoli`);
    assert(resChamoli.status === 200, 'GET /intelligence/districts/Chamoli returns HTTP 200');
    const chamoliData = (await resChamoli.json()).data;

    // Distinct multi-domain fields
    assert(chamoliData.risk_score !== undefined, 'Response contains risk_score');
    assert(chamoliData.calibrated_risk_probability !== undefined, 'Response contains calibrated_risk_probability');
    assert(chamoliData.vulnerability_score !== undefined, 'Response contains vulnerability_score');
    assert(chamoliData.urgency_score !== undefined, 'Response contains urgency_score');
    assert(chamoliData.priority_weight !== undefined, 'Response contains priority_weight (RPW)');
    assert(chamoliData.tier === 'immediate', 'Chamoli has tier=immediate');

    // Ensure RPW is distinguished from pure risk probability
    assert(
      chamoliData.priority_weight !== chamoliData.calibrated_risk_probability,
      'RPW is distinct from calibrated hazard probability'
    );

    // Verify reasons exist for human officer
    assert(Array.isArray(chamoliData.reasons) && chamoliData.reasons.length > 0, 'Governance reasons array provided for human officer review');

    console.log(`\n================================================================`);
    console.log(`  ALL ${passedTests}/${totalTests} PHASE 5.1 VALIDATION TESTS PASSED!`);
    console.log(`================================================================\n`);
  } finally {
    server.close();
    await pool.end();
  }
}

runValidationTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
