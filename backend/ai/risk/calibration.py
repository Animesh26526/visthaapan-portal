"""
VISTHAAPAN Phase 5: Probability Calibration Engine
Fits Platt scaling (sigmoid) on validation data to calibrate raw predicted probabilities.
"""

import numpy as np
from typing import Dict, Any, Tuple
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import brier_score_loss
from sklearn.linear_model import LogisticRegression


class ProbabilityCalibrator:
    """
    Fits logistic Platt scaling on raw predicted probabilities:
    P_calibrated = 1 / (1 + exp(A * P_raw + B))
    Strictly fit on validation set to prevent leakage.
    """
    def __init__(self):
        self.calibrator = LogisticRegression(penalty=None, solver="lbfgs")
        self.is_fitted = False

    def fit(self, raw_probs_val: np.ndarray, y_val: np.ndarray):
        """Fit sigmoid scaling on validation probabilities."""
        X_val = raw_probs_val.reshape(-1, 1)
        self.calibrator.fit(X_val, y_val)
        self.is_fitted = True

    def calibrate(self, raw_probs: np.ndarray) -> np.ndarray:
        """Transforms raw probabilities into calibrated probabilities in [0.0, 1.0]."""
        if not self.is_fitted:
            return np.clip(raw_probs, 0.0, 1.0)
        X = raw_probs.reshape(-1, 1)
        calibrated = self.calibrator.predict_proba(X)[:, 1]
        return np.clip(calibrated, 0.0, 1.0)

    def evaluate_calibration(
        self,
        raw_probs: np.ndarray,
        calibrated_probs: np.ndarray,
        y_true: np.ndarray,
        n_bins: int = 5
    ) -> Dict[str, Any]:
        """
        Computes Brier scores and reliability curves.
        """
        raw_brier = float(brier_score_loss(y_true, raw_probs))
        calib_brier = float(brier_score_loss(y_true, calibrated_probs))

        prob_true, prob_pred = calibration_curve(y_true, calibrated_probs, n_bins=n_bins, strategy="uniform")

        return {
            "raw_brier_score": round(raw_brier, 4),
            "calibrated_brier_score": round(calib_brier, 4),
            "brier_improvement": round(raw_brier - calib_brier, 4),
            "calibration_curve": {
                "empirical_prob_true": [round(float(p), 4) for p in prob_true],
                "mean_predicted_prob": [round(float(p), 4) for p in prob_pred]
            }
        }
