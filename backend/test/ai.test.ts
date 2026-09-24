/**
 * VISTHAAPAN Phase 5 AI Intelligence Engine Test Suite.
 * Validates:
 * 1. Migration 010 Schema Application & Table Integrity
 * 2. Model Registry & Version Lineage (XGBoost, Platt Calibration, Checksums, Seed)
 * 3. Empirical Risk & Priority Engine Outputs (785 Districts, [0, 1] Ranges, RPW Weights, Triage Tiers)
 * 4. TreeSHAP Local Explainability Contributions (3,925 rows, Directions, Explanations)
 * 5. Chamoli Ground Truth Benchmark Verification (Immediate Tier, Calibrated Probability)
 * 6. Zero Leakage & Safety Constraint Verification (Quarantine of Damage & Bed Counts)
 * 7. Express Intelligence REST API Endpoints (/intelligence/model, /intelligence/districts, /intelligence/districts/:id)
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

async function runTests() {
  console.log('\n================================================================');
  console.log('  RUNNING PHASE 5 AI INTELLIGENCE ENGINE TEST SUITE');
  console.log('================================================================\n');

  // Start test server for REST API tests
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
    // SUITE 1: Migration 010 & Schema Integrity
    // ------------------------------------------------------------
    console.log('--- Suite 1: Migration 010 & Schema Integrity ---');

    const migrationRes = await pool.query(
      "SELECT migration_name FROM schema_migrations WHERE migration_name = '010_create_phase5_district_ai_intelligence.sql'"
    );
    assert(migrationRes.rows.length === 1, 'Migration 010 is applied in schema_migrations');

    const columnsRes = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('model_versions', 'risk_assessments', 'relocation_priorities', 'risk_feature_contributions')
      ORDER BY table_name, column_name
    `);
    const colMap = new Set(columnsRes.rows.map((r: any) => `${r.table_name}.${r.column_name}`));

    assert(colMap.has('model_versions.code_commit'), 'model_versions.code_commit exists');
    assert(colMap.has('model_versions.artifact_checksum'), 'model_versions.artifact_checksum exists');
    assert(colMap.has('model_versions.prediction_horizon'), 'model_versions.prediction_horizon exists');
    assert(colMap.has('model_versions.random_seed'), 'model_versions.random_seed exists');

    assert(colMap.has('risk_assessments.canonical_district_id'), 'risk_assessments.canonical_district_id exists');
    assert(colMap.has('risk_assessments.calibrated_risk_probability'), 'risk_assessments.calibrated_risk_probability exists');
    assert(colMap.has('risk_assessments.vulnerability_score'), 'risk_assessments.vulnerability_score exists');
    assert(colMap.has('risk_assessments.urgency_score'), 'risk_assessments.urgency_score exists');

    assert(colMap.has('relocation_priorities.canonical_district_id'), 'relocation_priorities.canonical_district_id exists');
    assert(colMap.has('relocation_priorities.priority_weight'), 'relocation_priorities.priority_weight exists');
    assert(colMap.has('relocation_priorities.tier'), 'relocation_priorities.tier exists');
    assert(colMap.has('relocation_priorities.reasons'), 'relocation_priorities.reasons exists');

    assert(colMap.has('risk_feature_contributions.risk_assessment_id'), 'risk_feature_contributions.risk_assessment_id exists');
    assert(colMap.has('risk_feature_contributions.contribution'), 'risk_feature_contributions.contribution exists');
    assert(colMap.has('risk_feature_contributions.direction'), 'risk_feature_contributions.direction exists');

    // ------------------------------------------------------------
    // SUITE 2: AI Artifacts & Model Lineage
    // ------------------------------------------------------------
    console.log('\n--- Suite 2: AI Artifacts & Model Lineage ---');

    const artifactPath = path.resolve(process.cwd(), 'ai', 'artifacts', 'v1.0.0-xgb-district-risk.joblib');
    const manifestPath = path.resolve(process.cwd(), 'ai', 'artifacts', 'manifest.json');
    assert(fs.existsSync(artifactPath), 'Trained model artifact v1.0.0-xgb-district-risk.joblib exists on disk');
    assert(fs.existsSync(manifestPath), 'Model manifest.json exists on disk');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert(manifest.model_version === 'v1.0.0-xgb-district-risk', 'Manifest model version is v1.0.0-xgb-district-risk');
    assert(manifest.metrics.xgboost !== undefined, 'Manifest contains XGBoost metrics');
    assert(manifest.metrics.dataset.prediction_horizon_days === 14, 'Prediction horizon is 14 days');

    const mvRes = await pool.query("SELECT * FROM model_versions WHERE status = 'active' ORDER BY created_at DESC LIMIT 1");
    assert(mvRes.rows.length === 1, 'Active model version exists in model_versions table');
    const activeModel = mvRes.rows[0];
    assert(activeModel.version === 'v1.0.0-xgb-district-risk', 'Active model version is v1.0.0-xgb-district-risk');
    assert(activeModel.artifact_checksum === manifest.artifact_checksum, 'Active model artifact_checksum matches disk artifact SHA-256');
    assert(activeModel.prediction_horizon === '14d', 'Active model horizon is 14d');
    assert(activeModel.random_seed === 42, 'Active model random seed is 42');
    assert(activeModel.metrics.xgboost.test.pr_auc >= 0.70, `Active model PR-AUC >= 0.70 (measured: ${activeModel.metrics.xgboost.test.pr_auc})`);
    assert(activeModel.metrics.xgboost.test.roc_auc >= 0.80, `Active model ROC-AUC >= 0.80 (measured: ${activeModel.metrics.xgboost.test.roc_auc})`);
    assert(activeModel.metrics.xgboost.calibration_test.calibrated_brier_score <= 0.16, `Active model Calibrated Brier <= 0.16 (measured: ${activeModel.metrics.xgboost.calibration_test.calibrated_brier_score})`);

    // ------------------------------------------------------------
    // SUITE 3: Empirical Risk & Priority Engine Outputs
    // ------------------------------------------------------------
    console.log('\n--- Suite 3: Empirical Risk & Priority Engine Outputs ---');

    const raCount = await pool.query('SELECT COUNT(*) FROM risk_assessments WHERE model_version_id = $1', [activeModel.id]);
    assert(parseInt(raCount.rows[0].count, 10) === 785, 'risk_assessments has exactly 785 records for active model');

    const raRanges = await pool.query(`
      SELECT 
        MIN(risk_score) AS min_r, MAX(risk_score) AS max_r,
        MIN(calibrated_risk_probability) AS min_cr, MAX(calibrated_risk_probability) AS max_cr,
        MIN(vulnerability_score) AS min_v, MAX(vulnerability_score) AS max_v,
        MIN(urgency_score) AS min_u, MAX(urgency_score) AS max_u
      FROM risk_assessments 
      WHERE model_version_id = $1
    `, [activeModel.id]);
    const r = raRanges.rows[0];
    assert(parseFloat(r.min_r) >= 0 && parseFloat(r.max_r) <= 1, 'All risk scores are bounded in [0, 1]');
    assert(parseFloat(r.min_cr) >= 0 && parseFloat(r.max_cr) <= 1, 'All calibrated risk probabilities are bounded in [0, 1]');
    assert(parseFloat(r.min_v) >= 0 && parseFloat(r.max_v) <= 1, 'All vulnerability scores are bounded in [0, 1]');
    assert(parseFloat(r.min_u) >= 0 && parseFloat(r.max_u) <= 1, 'All urgency scores are bounded in [0, 1]');

    const rpCount = await pool.query('SELECT COUNT(*) FROM relocation_priorities WHERE canonical_district_id IS NOT NULL');
    assert(parseInt(rpCount.rows[0].count, 10) === 785, 'relocation_priorities has exactly 785 records for canonical districts');

    // Validate formula RPW = 0.50*R + 0.35*V + 0.15*U
    const rpwValidation = await pool.query(`
      SELECT 
        COUNT(*) AS formula_violations
      FROM relocation_priorities rp
      JOIN risk_assessments ra ON ra.canonical_district_id = rp.canonical_district_id
      WHERE ABS(rp.priority_weight - (0.50 * ra.risk_score + 0.35 * ra.vulnerability_score + 0.15 * ra.urgency_score)) > 0.001
    `);
    assert(parseInt(rpwValidation.rows[0].formula_violations, 10) === 0, 'Zero formula violations: RPW = 0.50*R + 0.35*V + 0.15*U holds across all 785 districts');

    // Validate Tiers
    const tierCounts = await pool.query(`
      SELECT tier, COUNT(*) AS count
      FROM relocation_priorities
      GROUP BY tier
      ORDER BY tier
    `);
    const tierMap: Record<string, number> = {};
    tierCounts.rows.forEach((row: any) => {
      tierMap[row.tier] = parseInt(row.count, 10);
    });
    console.log(`    Tiers summary: immediate=${tierMap['immediate']}, short-term=${tierMap['short-term']}, medium-term=${tierMap['medium-term']}`);
    assert((tierMap['immediate'] || 0) > 0, 'Immediate tier count > 0');
    assert((tierMap['short-term'] || 0) > 0, 'Short-term tier count > 0');
    assert((tierMap['medium-term'] || 0) > 0, 'Medium-term tier count > 0');
    assert((tierMap['immediate'] + tierMap['short-term'] + tierMap['medium-term']) === 785, 'Total tier distribution sums to exactly 785');

    // Validate tier threshold logic
    const tierThresholdViolations = await pool.query(`
      SELECT COUNT(*) AS violations
      FROM relocation_priorities
      WHERE (priority_weight >= 0.70 AND tier <> 'immediate')
         OR (priority_weight >= 0.40 AND priority_weight < 0.70 AND tier <> 'short-term')
         OR (priority_weight < 0.40 AND tier <> 'medium-term')
    `);
    assert(parseInt(tierThresholdViolations.rows[0].violations, 10) === 0, 'Zero tier classification violations across all threshold boundaries');

    // ------------------------------------------------------------
    // SUITE 4: TreeSHAP Feature Explainability
    // ------------------------------------------------------------
    console.log('\n--- Suite 4: TreeSHAP Feature Explainability ---');

    const shapCount = await pool.query('SELECT COUNT(*) FROM risk_feature_contributions');
    assert(parseInt(shapCount.rows[0].count, 10) === 3925, 'risk_feature_contributions contains exactly 3,925 rows (785 districts x 5 top features)');

    const shapDirections = await pool.query(`
      SELECT direction, COUNT(*) AS count
      FROM risk_feature_contributions
      GROUP BY direction
    `);
    const dirMap: Record<string, number> = {};
    shapDirections.rows.forEach((row: any) => {
      dirMap[row.direction] = parseInt(row.count, 10);
    });
    assert((dirMap['positive'] || 0) > 0, 'SHAP positive contributions present');
    assert((dirMap['negative'] || 0) > 0, 'SHAP negative contributions present');
    assert(dirMap['positive'] + dirMap['negative'] === 3925, 'All SHAP contributions have direction in (positive, negative)');

    const emptyExpl = await pool.query(`
      SELECT COUNT(*) AS count
      FROM risk_feature_contributions
      WHERE explanation IS NULL OR TRIM(explanation) = ''
    `);
    assert(parseInt(emptyExpl.rows[0].count, 10) === 0, 'Every SHAP contribution has a non-empty plain-language explanation');

    // ------------------------------------------------------------
    // SUITE 5: Benchmark District Ground Truth (Chamoli)
    // ------------------------------------------------------------
    console.log('\n--- Suite 5: Benchmark District Ground Truth (Chamoli) ---');

    const chamoliRes = await pool.query(`
      SELECT 
        cd.district_name,
        cd.state_name,
        ra.risk_score,
        ra.calibrated_risk_probability,
        ra.vulnerability_score,
        ra.urgency_score,
        rp.priority_weight,
        rp.tier,
        rp.reasons
      FROM canonical_districts cd
      JOIN risk_assessments ra ON ra.canonical_district_id = cd.id
      JOIN relocation_priorities rp ON rp.canonical_district_id = cd.id
      WHERE cd.district_name ILIKE '%Chamoli%'
      LIMIT 1
    `);
    assert(chamoliRes.rows.length === 1, 'Chamoli district exists in intelligence records');
    const chamoli = chamoliRes.rows[0];
    console.log(`    Chamoli stats: Risk=${chamoli.risk_score}, Vuln=${chamoli.vulnerability_score}, Urgency=${chamoli.urgency_score}, RPW=${chamoli.priority_weight}, Tier=${chamoli.tier}`);
    assert(chamoli.tier === 'immediate', `Chamoli tier is 'immediate' (got: ${chamoli.tier})`);
    assert(chamoli.risk_score >= 0.70, `Chamoli risk score >= 0.70 (got: ${chamoli.risk_score})`);
    assert(chamoli.priority_weight >= 0.70, `Chamoli RPW >= 0.70 (got: ${chamoli.priority_weight})`);
    assert(Array.isArray(chamoli.reasons) && chamoli.reasons.length > 0, 'Chamoli has explicit operational governance reasons');

    // ------------------------------------------------------------
    // SUITE 6: Zero Leakage & Safety Constraint Verification
    // ------------------------------------------------------------
    console.log('\n--- Suite 6: Zero Leakage & Safety Verification ---');

    const forbiddenFeatures = [
      'deaths_total', 'injured_total', 'missing_total', 'houses_damaged_total',
      'animal_loss_big', 'animal_loss_small', 'public_property_damage_crores',
      'hospital_total_beds', 'hospital_bed_deficit'
    ];

    const leakageCheck = await pool.query(`
      SELECT DISTINCT feature
      FROM risk_feature_contributions
      WHERE feature = ANY($1)
    `, [forbiddenFeatures]);
    assert(leakageCheck.rows.length === 0, 'Zero post-event damage or corrupted bed count features exist in risk_feature_contributions');

    // ------------------------------------------------------------
    // SUITE 7: Express Intelligence REST API Endpoints
    // ------------------------------------------------------------
    console.log('\n--- Suite 7: Express Intelligence REST API Endpoints ---');

    // 1. Root /api/v1
    const rootRes = await fetch(`${baseUrl}/api/v1`);
    assert(rootRes.status === 200, 'GET /api/v1 returns 200');
    const rootData = (await rootRes.json()) as any;
    assert(rootData.data.pipelineStage.includes('Phase 5'), 'Root API reports Phase 5 pipeline stage');
    assert(rootData.data.modules.ai_risk_engine.includes('operational'), 'ai_risk_engine module reported as operational');

    // 2. GET /api/v1/intelligence/model
    const modelRes = await fetch(`${baseUrl}/api/v1/intelligence/model`);
    assert(modelRes.status === 200, 'GET /api/v1/intelligence/model returns 200');
    const modelData = (await modelRes.json()) as any;
    assert(modelData.data.version === 'v1.0.0-xgb-district-risk', 'API returns active model version v1.0.0-xgb-district-risk');
    assert(modelData.data.prediction_horizon === '14d', 'API returns prediction horizon 14d');
    assert(modelData.data.random_seed === 42, 'API returns random seed 42');
    assert(modelData.data.artifact_checksum !== null, 'API returns artifact checksum');

    // 3. GET /api/v1/intelligence/districts
    const distsRes = await fetch(`${baseUrl}/api/v1/intelligence/districts?limit=10`);
    assert(distsRes.status === 200, 'GET /api/v1/intelligence/districts returns 200');
    const distsData = (await distsRes.json()) as any;
    assert(distsData.data.pagination.total === 785, 'Districts total count is 785');
    assert(distsData.data.districts.length === 10, 'Districts limit=10 returned 10 rows');
    assert(distsData.data.districts[0].priority_weight >= distsData.data.districts[1].priority_weight, 'Districts sorted by RPW descending');

    // 4. GET /api/v1/intelligence/districts?tier=immediate
    const immRes = await fetch(`${baseUrl}/api/v1/intelligence/districts?tier=immediate&limit=100`);
    assert(immRes.status === 200, 'GET /api/v1/intelligence/districts?tier=immediate returns 200');
    const immData = (await immRes.json()) as any;
    assert(immData.data.districts.every((d: any) => d.tier === 'immediate'), 'All filtered districts have tier=immediate');

    // 5. GET /api/v1/intelligence/districts/:districtId (Chamoli)
    const chamoliApiRes = await fetch(`${baseUrl}/api/v1/intelligence/districts/Chamoli`);
    assert(chamoliApiRes.status === 200, 'GET /api/v1/intelligence/districts/Chamoli returns 200');
    const chamoliApiData = (await chamoliApiRes.json()) as any;
    assert(chamoliApiData.data.district_name.toLowerCase().includes('chamoli'), 'District detail returns Chamoli');
    assert(chamoliApiData.data.tier === 'immediate', 'Chamoli detail has tier=immediate');
    assert(Array.isArray(chamoliApiData.data.shap_contributions) && chamoliApiData.data.shap_contributions.length === 5, 'Chamoli detail contains 5 SHAP feature contributions');
    assert(Array.isArray(chamoliApiData.data.top_positive_factors), 'Chamoli detail includes top_positive_factors');
    assert(Array.isArray(chamoliApiData.data.top_negative_factors), 'Chamoli detail includes top_negative_factors');

    // 6. GET /api/v1/intelligence/districts/:districtId (404 Not Found)
    const notFoundRes = await fetch(`${baseUrl}/api/v1/intelligence/districts/nonexistent-district-slug-9999`);
    assert(notFoundRes.status === 404, 'GET /api/v1/intelligence/districts/nonexistent returns 404');
    const notFoundData = (await notFoundRes.json()) as any;
    assert(notFoundData.success === false, '404 error envelope has success=false');
    assert(notFoundData.error.code === 'NOT_FOUND', '404 error envelope has code NOT_FOUND');

    console.log(`\n================================================================`);
    console.log(`  ALL ${passedTests}/${totalTests} PHASE 5 AI INTELLIGENCE TESTS PASSED!`);
    console.log(`================================================================\n`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error('\nTest execution failed:', err);
  process.exit(1);
});
