"""
VISTHAAPAN Phase 5: Primary XGBoost Hazard Risk Model
Gradient boosted decision trees for probabilistic future hazard classification.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
import xgboost as xgb
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, brier_score_loss,
    confusion_matrix
)
from .config import XGB_PARAMS, RANDOM_SEED


class XGBoostRiskModel:
    """
    XGBoost Classifier for 14-day forward hazard event risk prediction.
    """
    def __init__(self, params: Dict[str, Any] = None):
        self.params = params or XGB_PARAMS
        self.model = xgb.XGBClassifier(**self.params)
        self.feature_names: List[str] = []

    def fit(self, X_train: pd.DataFrame, y_train: np.ndarray, X_val: pd.DataFrame = None, y_val: np.ndarray = None):
        self.feature_names = list(X_train.columns)
        
        # Calculate scale_pos_weight to balance classes if needed
        n_pos = np.sum(y_train)
        n_neg = len(y_train) - n_pos
        scale_pos = float(n_neg / max(1, n_pos)) if n_pos > 0 else 1.0

        # Create copy of parameters with scale_pos_weight
        fit_params = dict(self.params)
        fit_params["scale_pos_weight"] = min(3.0, scale_pos) # Dampened weight to prevent excessive false positives
        self.model = xgb.XGBClassifier(**fit_params)

        if X_val is not None and y_val is not None:
            self.model.fit(
                X_train,
                y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
        else:
            self.model.fit(X_train, y_train)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict_proba(X)[:, 1]

    def predict(self, X: pd.DataFrame, threshold: float = 0.5) -> np.ndarray:
        prob = self.predict_proba(X)
        return (prob >= threshold).astype(int)

    def evaluate(self, X: pd.DataFrame, y: np.ndarray, threshold: float = 0.5) -> Dict[str, Any]:
        prob = self.predict_proba(X)
        pred = (prob >= threshold).astype(int)

        acc = float(accuracy_score(y, pred))
        prec = float(precision_score(y, pred, zero_division=0))
        rec = float(recall_score(y, pred, zero_division=0))
        f1 = float(f1_score(y, pred, zero_division=0))
        brier = float(brier_score_loss(y, prob))

        try:
            roc_auc = float(roc_auc_score(y, prob))
        except ValueError:
            roc_auc = 0.5

        try:
            pr_auc = float(average_precision_score(y, prob))
        except ValueError:
            pr_auc = 0.0

        cm = confusion_matrix(y, pred).tolist()

        return {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "brier_score": round(brier, 4),
            "confusion_matrix": cm,
            "threshold": threshold,
            "sample_count": len(y),
            "positive_count": int(np.sum(y)),
            "negative_count": int(len(y) - np.sum(y))
        }

    def get_feature_importances(self) -> Dict[str, float]:
        """Returns gain-based feature importances."""
        importances = self.model.feature_importances_
        res = {name: round(float(imp), 5) for name, imp in zip(self.feature_names, importances)}
        # Sort descending
        return dict(sorted(res.items(), key=lambda item: item[1], reverse=True))
