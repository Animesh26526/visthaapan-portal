"""
VISTHAAPAN Phase 5: SHAP Explainability Engine
Computes TreeSHAP local and global feature attributions for XGBoost predictions.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
import shap


# Plain language feature descriptors for human officers
FEATURE_DESCRIPTIONS = {
    "events_last_7d": "Active hazard incidents in the last 7 days",
    "events_last_14d": "Active hazard incidents in the last 14 days",
    "events_last_30d": "Active hazard incidents in the last 30 days",
    "events_last_90d": "Active hazard incidents in the last 90 days",
    "events_last_365d": "Annual active hazard occurrences",
    "surveillance_reports_last_30d": "Daily quiescence filings from DDMA in past 30 days",
    "cumulative_active_events_to_date": "Historical cumulative disaster event count",
    "days_since_last_active_event": "Days elapsed since most recent active disaster",
    "hazard_diversity_365d": "Diversity of distinct hazard types experienced",
    "has_flood_365d": "History of flood inundation within 1 year",
    "has_landslide_365d": "History of landslides or debris mudflows within 1 year",
    "has_cyclone_365d": "History of cyclones or destructive windstorms within 1 year",
    "has_heavy_rain_365d": "Recurrent heavy rainfall triggers within 1 year",
    "census_population_total_log": "District population headcount scale (log scale)",
    "census_female_share": "Female demographic proportion (Census 2011)",
    "census_child_share": "Child (0-6 years) dependency proportion",
    "census_sc_share": "Scheduled Caste demographic share",
    "census_st_share": "Scheduled Tribe demographic share",
    "census_literacy_rate": "Baseline population literacy proportion",
    "census_worker_rate": "Workforce participation rate",
    "census_is_missing": "Indicator of missing Census 2011 concordance baseline",
    "hospital_count": "Total registered healthcare facilities",
    "geocoded_hospital_count": "Verified geocoded healthcare locations",
    "emergency_service_hospital_count": "Hospitals offering 24/7 emergency services",
    "ambulance_available_hospital_count": "Hospitals equipped with emergency ambulances",
    "emergency_hospital_share": "Share of healthcare facilities providing emergency care",
    "ambulance_hospital_share": "Share of healthcare facilities with ambulance fleets",
    "healthcare_is_missing": "Indicator of unobserved healthcare facilities",
    "month_sin": "Cyclical seasonal phase (sine component)",
    "month_cos": "Cyclical seasonal phase (cosine component)",
    "is_monsoon_season": "Southwest monsoon period indicator (June-September)"
}


class SHAPExplainer:
    """
    Computes exact TreeSHAP feature attributions on the XGBoost risk model.
    """
    def __init__(self, xgb_model):
        self.xgb_model = xgb_model
        # Use TreeExplainer on the underlying Booster or XGBClassifier
        self.explainer = shap.TreeExplainer(self.xgb_model.model)
        self.feature_names = xgb_model.feature_names
        exp_val = self.explainer.expected_value
        if isinstance(exp_val, (list, np.ndarray)):
            self.expected_value = float(exp_val[0])
        else:
            self.expected_value = float(exp_val)

    def explain_dataset(self, X: pd.DataFrame) -> np.ndarray:
        """
        Computes SHAP values matrix for all rows in X.
        Returns array of shape (N, num_features).
        """
        shap_vals = self.explainer.shap_values(X)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1] if len(shap_vals) > 1 else shap_vals[0]
        return np.array(shap_vals)

    def explain_single_observation(
        self,
        x_row: pd.Series,
        shap_row: np.ndarray,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generates auditable positive and negative contributions for a single observation.
        """
        contributions = []
        for feat_name, val, shap_val in zip(self.feature_names, x_row, shap_row):
            shap_val = float(shap_val)
            val = float(val) if pd.notnull(val) else None
            direction = "positive" if shap_val > 0 else "negative"
            desc = FEATURE_DESCRIPTIONS.get(feat_name, feat_name)
            
            contributions.append({
                "feature": feat_name,
                "value": val,
                "contribution": round(shap_val, 4),
                "direction": direction,
                "explanation": f"{desc} (observed: {val}) was associated with a {direction} contribution ({shap_val:+.3f} log-odds) to the predicted hazard-report likelihood"
            })

        # Sort by absolute impact
        contributions.sort(key=lambda c: abs(c["contribution"]), reverse=True)
        return contributions[:top_k]

    def get_global_feature_importance(self, shap_values: np.ndarray) -> Dict[str, float]:
        """Computes mean absolute SHAP value per feature."""
        mean_abs = np.mean(np.abs(shap_values), axis=0)
        res = {name: round(float(m), 5) for name, m in zip(self.feature_names, mean_abs)}
        return dict(sorted(res.items(), key=lambda item: item[1], reverse=True))
