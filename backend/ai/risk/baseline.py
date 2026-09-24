"""
VISTHAAPAN Phase 5: Baseline Linear Classification Model
Implements Logistic Regression baseline on identical temporal feature partitions.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, brier_score_loss,
    confusion_matrix
)
from .config import RANDOM_SEED


class BaselineLogisticModel:
    """
    Standard Logistic Regression baseline with median imputation and standard scaling.
    """
    def __init__(self):
        self.imputer = SimpleImputer(strategy="median")
        self.scaler = StandardScaler()
        self.model = LogisticRegression(
            penalty="l2",
            C=1.0,
            class_weight="balanced",
            max_iter=1000,
            random_state=RANDOM_SEED
        )
        self.feature_names: List[str] = []

    def fit(self, X_train: pd.DataFrame, y_train: np.ndarray):
        self.feature_names = list(X_train.columns)
        X_imp = self.imputer.fit_transform(X_train)
        X_scaled = self.scaler.fit_transform(X_imp)
        self.model.fit(X_scaled, y_train)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        X_imp = self.imputer.transform(X)
        X_scaled = self.scaler.transform(X_imp)
        return self.model.predict_proba(X_scaled)[:, 1]

    def predict(self, X: pd.DataFrame, threshold: float = 0.5) -> np.ndarray:
        prob = self.predict_proba(X)
        return (prob >= threshold).astype(int)

    def evaluate(self, X: pd.DataFrame, y: np.ndarray, threshold: float = 0.5) -> Dict[str, Any]:
        prob = self.predict_proba(X)
        pred = (prob >= threshold).astype(int)
        
        # Calculate metrics safely
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
