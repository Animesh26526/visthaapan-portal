"""
VISTHAAPAN Phase 5: AI Engine Configuration
Authoritative configuration for temporal feature engineering, model training,
calibration, explainability, and multi-domain priority derivation.
"""

import os
from dataclasses import dataclass, field
from typing import List, Tuple

# Base Paths
AI_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(AI_DIR)
ARTIFACTS_DIR = os.path.join(AI_DIR, "artifacts")
DOCS_DIR = os.path.join(BACKEND_DIR, "docs")

# Database Connection (Reads standard environment variables or defaults)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "visthaapan")
DB_USER = os.getenv("DB_USER", "visthaapan")
DB_PASSWORD = os.getenv("DB_PASSWORD", "visthaapan_dev")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# Temporal Discretization & Prediction Horizon
OBSERVATION_CADENCE_DAYS = 14       # Step every 14 days
PREDICTION_HORIZON_DAYS = 14        # Future target window (t, t + 14d]
OBSERVATION_START_DATE = "2025-11-01"
OBSERVATION_END_DATE = "2026-09-01"

# Chronological Train / Validation / Test Boundaries
SPLIT_TRAIN_END = "2026-05-15"      # Train: 2025-11-01 to 2026-05-15 (14 bi-weekly steps)
SPLIT_VAL_END = "2026-07-15"        # Val:   2026-05-15 to 2026-07-15 (4 bi-weekly steps)
                                    # Test:  2026-07-15 to 2026-09-01 (4 bi-weekly steps)

# Model Hyperparameters (Deterministic settings)
RANDOM_SEED = 42
XGB_PARAMS = {
    "n_estimators": 100,
    "max_depth": 4,
    "learning_rate": 0.05,
    "subsample": 0.85,
    "colsample_bytree": 0.85,
    "min_child_weight": 3,
    "objective": "binary:logistic",
    "eval_metric": "logloss",
    "random_state": RANDOM_SEED,
    "n_jobs": 4,
}

# Calibration Settings
CALIBRATION_METHOD = "sigmoid"  # Platt scaling

# Relocation Priority Weight (RPW) Formulation
RPW_WEIGHT_RISK = 0.50
RPW_WEIGHT_VULNERABILITY = 0.35
RPW_WEIGHT_URGENCY = 0.15

# RPW Triage Tiers
TIER_IMMEDIATE_THRESHOLD = 0.70
TIER_SHORT_TERM_THRESHOLD = 0.40

# Feature Schema Version
FEATURE_SCHEMA_VERSION = "v5.1.0-temporal-biweekly"
MODEL_VERSION = "v1.0.0-xgb-district-risk"
