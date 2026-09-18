"""
VISTHAAPAN Phase 5: District Risk Inference Module
Loads persisted model artifacts and provides real-time decision-support intelligence.
"""

import os
import sys

# Ensure both repo root and backend directory are in sys.path for joblib module resolution
AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(AI_DIR)
REPO_ROOT = os.path.dirname(BACKEND_DIR)
for p in (REPO_ROOT, BACKEND_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from .config import ARTIFACTS_DIR, MODEL_VERSION, FEATURE_SCHEMA_VERSION
from .features import generate_feature_vector, FEATURE_NAMES
from .vulnerability import compute_district_vulnerability_index
from .urgency import compute_operational_urgency
from .priority import compute_relocation_priority
from .explainability import SHAPExplainer
from .data import get_db_connection


class DistrictRiskPredictor:
    """
    Inference service for district-level risk prediction and explainability.
    """
    def __init__(self, artifact_path: Optional[str] = None):
        path = artifact_path or os.path.join(ARTIFACTS_DIR, f"{MODEL_VERSION}.joblib")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model artifact not found at {path}. Please run train.py first.")
        
        self.bundle = joblib.load(path)
        self.xgb_model = self.bundle["xgb_model"]
        self.calibrator = self.bundle["calibrator"]
        self.explainer = SHAPExplainer(self.xgb_model)
        self.model_version = self.bundle["model_version"]

    def predict_district(
        self,
        canonical_district_id: str,
        obs_date_str: str = "2026-09-01"
    ) -> Dict[str, Any]:
        """
        Executes inference and returns full decision-support intelligence object.
        """
        obs_date = pd.to_datetime(obs_date_str)
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                # 1. District info
                cur.execute("""
                    SELECT district_name, state_name, district_code, state_code
                    FROM canonical_districts
                    WHERE id = %s
                """, (canonical_district_id,))
                d_row = cur.fetchone()
                if not d_row:
                    raise ValueError(f"Canonical district {canonical_district_id} not found.")
                district_name, state_name, dist_code, state_code = d_row

                # 2. Events up to obs_date
                cur.execute("""
                    SELECT 
                        dde.event_date,
                        dde.normalized_hazard_type,
                        dde.is_surveillance_record
                    FROM district_disaster_events dde
                    JOIN district_identity_mappings dim
                      ON dim.source_dataset = 'NDEM'
                     AND dim.source_state = dde.state_name
                     AND dim.source_district = dde.district_name
                    WHERE dim.canonical_district_id = %s
                      AND dde.event_date <= %s
                    ORDER BY dde.event_date ASC
                """, (canonical_district_id, obs_date_str))
                ev_cols = ["event_date", "normalized_hazard_type", "is_surveillance_record"]
                events_df = pd.DataFrame(cur.fetchall(), columns=ev_cols)
                if not events_df.empty:
                    events_df["event_date"] = pd.to_datetime(events_df["event_date"])

                # 3. Demographics
                cur.execute("""
                    SELECT 
                        population_total,
                        female_population_share,
                        child_population_share,
                        sc_population_share,
                        st_population_share,
                        literacy_rate,
                        worker_participation_rate
                    FROM district_demographics
                    WHERE canonical_district_id = %s
                """, (canonical_district_id,))
                demo_row = cur.fetchone()
                demo_rec = None
                if demo_row:
                    demo_rec = {
                        "population_total": demo_row[0],
                        "female_population_share": demo_row[1],
                        "child_population_share": demo_row[2],
                        "sc_population_share": demo_row[3],
                        "st_population_share": demo_row[4],
                        "literacy_rate": demo_row[5],
                        "worker_participation_rate": demo_row[6]
                    }

                # 4. Healthcare
                cur.execute("""
                    SELECT 
                        hospital_count,
                        geocoded_hospital_count,
                        emergency_service_hospital_count,
                        ambulance_available_hospital_count,
                        emergency_hospital_share,
                        ambulance_hospital_share
                    FROM district_healthcare_profiles
                    WHERE canonical_district_id = %s
                """, (canonical_district_id,))
                health_row = cur.fetchone()
                health_rec = None
                if health_row:
                    health_rec = {
                        "hospital_count": health_row[0],
                        "geocoded_hospital_count": health_row[1],
                        "emergency_service_hospital_count": health_row[2],
                        "ambulance_available_hospital_count": health_row[3],
                        "emergency_hospital_share": health_row[4],
                        "ambulance_hospital_share": health_row[5]
                    }

            # Generate features
            feat_dict = generate_feature_vector(
                canonical_district_id,
                obs_date,
                events_df,
                demo_rec,
                health_rec
            )
            X = pd.DataFrame([feat_dict])[FEATURE_NAMES]

            # Predict probabilities
            raw_prob = float(self.xgb_model.predict_proba(X)[0])
            cal_prob = float(self.calibrator.calibrate(np.array([raw_prob]))[0])
            risk_score = round(cal_prob, 4)

            # Vulnerability
            vuln_res = compute_district_vulnerability_index(demo_rec, health_rec)
            v_score = vuln_res["vulnerability_score"]

            # Urgency
            urg_res = compute_operational_urgency(
                int(feat_dict["events_last_7d"]),
                int(feat_dict["events_last_14d"]),
                int(feat_dict["events_last_90d"]),
                int(feat_dict["days_since_last_active_event"]),
                int(feat_dict["surveillance_reports_last_30d"])
            )
            u_score = urg_res["urgency_score"]

            # SHAP
            shap_vals = self.explainer.explain_dataset(X)
            shap_contributions = self.explainer.explain_single_observation(
                X.iloc[0],
                shap_vals[0],
                top_k=5
            )
            top_pos = [fc for fc in shap_contributions if fc["direction"] == "positive"]
            top_neg = [fc for fc in shap_contributions if fc["direction"] == "negative"]

            # Priority
            top_factors = [fc["explanation"] for fc in shap_contributions[:2]]
            rpw_res = compute_relocation_priority(risk_score, v_score, u_score, top_factors)

            return {
                "district_id": canonical_district_id,
                "district_name": district_name,
                "state_name": state_name,
                "observation_time": obs_date_str,
                "risk_score": risk_score,
                "raw_risk_probability": round(raw_prob, 4),
                "calibrated_risk_probability": round(cal_prob, 4),
                "vulnerability_score": v_score,
                "urgency_score": u_score,
                "urgency_label": urg_res["urgency_label"],
                "relocation_priority_weight": rpw_res["priority_weight"],
                "tier": rpw_res["tier"],
                "confidence_or_data_quality": rpw_res["confidence"],
                "model_version": self.model_version,
                "top_positive_factors": top_pos,
                "top_negative_factors": top_neg,
                "reasons": rpw_res["reasons"]
            }
        finally:
            conn.close()
