import type { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * GET /api/v1/intelligence/districts
 * Lists district intelligence profiles with operational RPW tiers.
 */
export async function listDistrictIntelligence(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tier = req.query.tier as string | undefined;
    const state = req.query.state as string | undefined;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '50', 10)));
    const offset = Math.max(0, parseInt(req.query.offset as string || '0', 10));

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (tier) {
      conditions.push(`rp.tier = $${idx++}`);
      values.push(tier.toLowerCase());
    }

    if (state) {
      conditions.push(`cd.state_name ILIKE $${idx++}`);
      values.push(`%${state}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM canonical_districts cd
      JOIN relocation_priorities rp ON rp.canonical_district_id = cd.id
      ${whereClause}
    `;
    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const query = `
      SELECT 
        cd.id AS district_id,
        cd.district_name,
        cd.state_name,
        cd.district_code,
        ra.risk_score,
        ra.calibrated_risk_probability,
        ra.vulnerability_score,
        ra.urgency_score,
        ra.urgency AS urgency_label,
        rp.priority_weight,
        rp.tier,
        rp.reasons,
        rp.confidence,
        rp.observation_date,
        mv.version AS model_version
      FROM canonical_districts cd
      JOIN risk_assessments ra ON ra.canonical_district_id = cd.id
      JOIN relocation_priorities rp ON rp.canonical_district_id = cd.id
      LEFT JOIN model_versions mv ON mv.id = ra.model_version_id
      ${whereClause}
      ORDER BY rp.priority_weight DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    values.push(limit, offset);
    const result = await pool.query(query, values);

    sendSuccess(res, {
      districts: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/intelligence/districts/:districtId
 * Detailed intelligence output for a single district including SHAP contributions.
 */
export async function getDistrictIntelligenceDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { districtId } = req.params;

    const query = `
      SELECT 
        cd.id AS district_id,
        cd.district_name,
        cd.state_name,
        cd.district_code,
        cd.state_code,
        ra.id AS risk_assessment_id,
        ra.risk_score,
        ra.raw_risk_probability,
        ra.calibrated_risk_probability,
        ra.vulnerability_score,
        ra.urgency_score,
        ra.urgency AS urgency_label,
        ra.confidence,
        ra.observation_date,
        rp.priority_weight,
        rp.tier,
        rp.reasons,
        mv.version AS model_version,
        mv.algorithm,
        mv.prediction_horizon,
        mv.artifact_checksum
      FROM canonical_districts cd
      JOIN risk_assessments ra ON ra.canonical_district_id = cd.id
      JOIN relocation_priorities rp ON rp.canonical_district_id = cd.id
      LEFT JOIN model_versions mv ON mv.id = ra.model_version_id
      WHERE cd.id::text = $1 OR cd.district_code = $1 OR cd.district_name ILIKE $1 OR cd.district_name ILIKE ('%' || $1 || '%')
      LIMIT 1
    `;

    const result = await pool.query(query, [districtId]);
    if (result.rows.length === 0) {
      throw new NotFoundError(`District intelligence profile for '${districtId}' not found.`);
    }

    const district = result.rows[0];

    // Fetch SHAP feature contributions
    const rfcQuery = `
      SELECT 
        feature,
        value,
        contribution,
        direction,
        explanation
      FROM risk_feature_contributions
      WHERE risk_assessment_id = $1
      ORDER BY ABS(contribution) DESC
    `;
    const rfcResult = await pool.query(rfcQuery, [district.risk_assessment_id]);

    district.shap_contributions = rfcResult.rows;
    district.top_positive_factors = rfcResult.rows.filter((r: any) => r.direction === 'positive');
    district.top_negative_factors = rfcResult.rows.filter((r: any) => r.direction === 'negative');

    sendSuccess(res, district);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/intelligence/model
 * Active AI model version, metrics, and lineage.
 */
export async function getActiveModelInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = `
      SELECT 
        id,
        model_name,
        model_type,
        version,
        description,
        algorithm,
        metrics,
        code_commit,
        target_definition,
        prediction_horizon,
        feature_schema_version,
        artifact_checksum,
        random_seed,
        status,
        created_at
      FROM model_versions
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query);
    if (result.rows.length === 0) {
      throw new NotFoundError('No active AI model version found in registry.');
    }
    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
}
