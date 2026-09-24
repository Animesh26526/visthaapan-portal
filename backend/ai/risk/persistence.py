"""
VISTHAAPAN Phase 5: Model Persistence & Database Lineage
Saves model artifacts, computes SHA-256 fingerprints, and records assessments in PostgreSQL.
"""

import os
import json
import hashlib
import joblib
import subprocess
import psycopg
from typing import Dict, Any, List, Optional
from .config import (
    DATABASE_URL,
    ARTIFACTS_DIR,
    MODEL_VERSION,
    FEATURE_SCHEMA_VERSION,
    PREDICTION_HORIZON_DAYS,
    RANDOM_SEED
)


def get_git_commit() -> str:
    """Retrieves current Git commit hash."""
    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
        return commit
    except Exception:
        return "unknown-commit"


def compute_file_sha256(filepath: str) -> str:
    """Calculates SHA-256 checksum of an artifact."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()


def save_model_artifacts(
    xgb_model,
    calibrator,
    baseline_model,
    metrics: Dict[str, Any]
) -> Tuple[str, str]:
    """
    Persists model bundle and returns (artifact_path, checksum).
    """
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    bundle_path = os.path.join(ARTIFACTS_DIR, f"{MODEL_VERSION}.joblib")
    
    bundle = {
        "model_version": MODEL_VERSION,
        "feature_schema_version": FEATURE_SCHEMA_VERSION,
        "xgb_model": xgb_model,
        "calibrator": calibrator,
        "baseline_model": baseline_model,
        "metrics": metrics
    }

    joblib.dump(bundle, bundle_path, compress=3)
    checksum = compute_file_sha256(bundle_path)
    return bundle_path, checksum


def record_model_version_in_db(
    conn,
    artifact_path: str,
    artifact_checksum: str,
    metrics: Dict[str, Any],
    git_commit: str
) -> str:
    """
    Inserts or updates the model version in model_versions table.
    Returns model_version_id (UUID).
    """
    with conn.cursor() as cur:
        # Check if already exists
        cur.execute("SELECT id FROM model_versions WHERE version = %s", (MODEL_VERSION,))
        row = cur.fetchone()
        if row:
            model_id = str(row[0])
            cur.execute("""
                UPDATE model_versions
                SET metrics = %s,
                    code_commit = %s,
                    artifact_path = %s,
                    artifact_checksum = %s,
                    target_definition = %s,
                    prediction_horizon = %s,
                    feature_schema_version = %s,
                    random_seed = %s
                WHERE id = %s
            """, (
                json.dumps(metrics),
                git_commit,
                artifact_path,
                artifact_checksum,
                f"Qualifying active hazard event in next {PREDICTION_HORIZON_DAYS} days",
                f"{PREDICTION_HORIZON_DAYS}d",
                FEATURE_SCHEMA_VERSION,
                RANDOM_SEED,
                model_id
            ))
        else:
            cur.execute("""
                INSERT INTO model_versions (
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
                    artifact_path,
                    artifact_checksum,
                    random_seed,
                    status
                ) VALUES (
                    'VISTHAAPAN District Hazard Risk Predictor',
                    'SUPERVISED_CLASSIFIER',
                    %s,
                    'Probabilistic 14-day future hazard event risk predictor with Platt calibration and SHAP explainability',
                    'XGBoost Classifier (TreeSHAP)',
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    'active'
                ) RETURNING id
            """, (
                MODEL_VERSION,
                json.dumps(metrics),
                git_commit,
                f"Qualifying active hazard event in next {PREDICTION_HORIZON_DAYS} days",
                f"{PREDICTION_HORIZON_DAYS}d",
                FEATURE_SCHEMA_VERSION,
                artifact_path,
                artifact_checksum,
                RANDOM_SEED
            ))
            model_id = str(cur.fetchone()[0])
        conn.commit()
        return model_id


def persist_district_assessments(
    conn,
    model_version_id: str,
    assessments: List[Dict[str, Any]]
) -> Tuple[int, int, int]:
    """
    Persists risk assessments, feature contributions, and relocation priorities.
    Returns (risk_count, rfc_count, rpw_count).
    """
    risk_count = 0
    rfc_count = 0
    rpw_count = 0

    with conn.cursor() as cur:
        for item in assessments:
            dist_id = item["canonical_district_id"]
            obs_date = item["observation_date"]
            r_score = item["risk_score"]
            raw_prob = item["raw_risk_probability"]
            cal_prob = item["calibrated_risk_probability"]
            v_score = item["vulnerability_score"]
            u_score = item["urgency_score"]
            urgency_label = item.get("urgency_label", "ROUTINE_MONITORING")
            rpw = item["priority_weight"]
            tier = item["tier"]
            reasons = item["reasons"]
            confidence = item["confidence"]

            # 1. Insert or Update Risk Assessment
            cur.execute("""
                INSERT INTO risk_assessments (
                    canonical_district_id,
                    observation_date,
                    risk_score,
                    raw_risk_probability,
                    calibrated_risk_probability,
                    vulnerability_score,
                    urgency_score,
                    urgency,
                    model_version_id,
                    confidence,
                    assessed_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (canonical_district_id, observation_date, model_version_id)
                WHERE canonical_district_id IS NOT NULL AND observation_date IS NOT NULL AND model_version_id IS NOT NULL
                DO UPDATE SET
                    risk_score = EXCLUDED.risk_score,
                    raw_risk_probability = EXCLUDED.raw_risk_probability,
                    calibrated_risk_probability = EXCLUDED.calibrated_risk_probability,
                    vulnerability_score = EXCLUDED.vulnerability_score,
                    urgency_score = EXCLUDED.urgency_score,
                    urgency = EXCLUDED.urgency,
                    confidence = EXCLUDED.confidence,
                    assessed_at = NOW()
                RETURNING id
            """, (
                dist_id, obs_date, r_score, raw_prob, cal_prob,
                v_score, u_score, urgency_label, model_version_id, confidence
            ))
            ra_id = str(cur.fetchone()[0])
            risk_count += 1

            # 2. Insert SHAP Feature Contributions (delete old for this assessment if any)
            cur.execute("DELETE FROM risk_feature_contributions WHERE risk_assessment_id = %s", (ra_id,))
            for fc in item.get("shap_contributions", []):
                cur.execute("""
                    INSERT INTO risk_feature_contributions (
                        risk_assessment_id,
                        feature,
                        value,
                        contribution,
                        direction,
                        explanation
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    ra_id,
                    fc["feature"],
                    fc["value"],
                    fc["contribution"],
                    fc["direction"],
                    fc["explanation"]
                ))
                rfc_count += 1

            # 3. Insert or Update Relocation Priority
            cur.execute("""
                INSERT INTO relocation_priorities (
                    canonical_district_id,
                    observation_date,
                    model_version_id,
                    risk_score,
                    vulnerability_score,
                    urgency_score,
                    priority_weight,
                    tier,
                    reasons,
                    confidence,
                    calculated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (canonical_district_id, observation_date, model_version_id)
                WHERE canonical_district_id IS NOT NULL AND observation_date IS NOT NULL AND model_version_id IS NOT NULL
                DO UPDATE SET
                    risk_score = EXCLUDED.risk_score,
                    vulnerability_score = EXCLUDED.vulnerability_score,
                    urgency_score = EXCLUDED.urgency_score,
                    priority_weight = EXCLUDED.priority_weight,
                    tier = EXCLUDED.tier,
                    reasons = EXCLUDED.reasons,
                    confidence = EXCLUDED.confidence,
                    calculated_at = NOW()
            """, (
                dist_id, obs_date, model_version_id,
                r_score, v_score, u_score, rpw, tier, reasons, confidence
            ))
            rpw_count += 1

        conn.commit()

    return risk_count, rfc_count, rpw_count


def save_manifest(manifest_data: Dict[str, Any]):
    """Writes machine-readable manifest.json into artifacts directory."""
    manifest_path = os.path.join(ARTIFACTS_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)
    return manifest_path
