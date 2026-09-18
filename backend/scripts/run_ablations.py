"""
VISTHAAPAN Phase 5.1: Ablation Experiment Suite
Runs Models A, B, C, D, E and Baseline Logistic Regression.
Reports ROC-AUC, PR-AUC, Brier score, F1, precision, recall, accuracy on Validation and Test.
"""

import sys
import os
import json
import time
import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, brier_score_loss
)
import xgboost as xgb
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.risk.config import (
    OBSERVATION_CADENCE_DAYS,
    PREDICTION_HORIZON_DAYS,
    OBSERVATION_START_DATE,
    OBSERVATION_END_DATE,
    SPLIT_TRAIN_END,
    SPLIT_VAL_END,
    RANDOM_SEED,
    XGB_PARAMS
)
from ai.risk.data import load_raw_multidomain_data
from ai.risk.features import DistrictEventIndex, generate_feature_vector_fast, FEATURE_NAMES
from ai.risk.targets import generate_target_value_fast
from ai.risk.calibration import ProbabilityCalibrator


def evaluate_predictions(y_true: np.ndarray, probs: np.ndarray, threshold: float = 0.5):
    preds = (probs >= threshold).astype(int)
    acc = float(accuracy_score(y_true, preds))
    prec = float(precision_score(y_true, preds, zero_division=0))
    rec = float(recall_score(y_true, preds, zero_division=0))
    f1 = float(f1_score(y_true, preds, zero_division=0))
    brier = float(brier_score_loss(y_true, probs))
    try:
        roc_auc = float(roc_auc_score(y_true, probs))
    except ValueError:
        roc_auc = 0.5
    try:
        pr_auc = float(average_precision_score(y_true, probs))
    except ValueError:
        pr_auc = 0.0

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier": round(brier, 4),
        "pos_count": int(np.sum(y_true)),
        "total_count": len(y_true)
    }


def train_and_eval_xgb(feature_subset, X_train_full, y_train, X_val_full, y_val, X_test_full, y_test):
    X_tr = X_train_full[feature_subset]
    X_v = X_val_full[feature_subset]
    X_te = X_test_full[feature_subset]

    n_pos = np.sum(y_train)
    n_neg = len(y_train) - n_pos
    scale_pos = float(n_neg / max(1, n_pos)) if n_pos > 0 else 1.0

    params = dict(XGB_PARAMS)
    params["scale_pos_weight"] = min(3.0, scale_pos)
    model = xgb.XGBClassifier(**params)
    model.fit(X_tr, y_train, eval_set=[(X_v, y_val)], verbose=False)

    raw_val_probs = model.predict_proba(X_v)[:, 1]
    raw_test_probs = model.predict_proba(X_te)[:, 1]

    # Platt calibration fit strictly on Val
    calibrator = ProbabilityCalibrator()
    calibrator.fit(raw_val_probs, y_val)

    cal_val_probs = calibrator.calibrate(raw_val_probs)
    cal_test_probs = calibrator.calibrate(raw_test_probs)

    raw_val_metrics = evaluate_predictions(y_val, raw_val_probs)
    cal_val_metrics = evaluate_predictions(y_val, cal_val_probs)
    raw_test_metrics = evaluate_predictions(y_test, raw_test_probs)
    cal_test_metrics = evaluate_predictions(y_test, cal_test_probs)

    return {
        "features_count": len(feature_subset),
        "raw_val": raw_val_metrics,
        "cal_val": cal_val_metrics,
        "raw_test": raw_test_metrics,
        "cal_test": cal_test_metrics,
    }


def run_ablations():
    print("Building full temporal dataset for ablations...")
    districts_df, events_df, demo_df, health_df = load_raw_multidomain_data()
    n_districts = len(districts_df)

    event_indexes = {d_id: DistrictEventIndex(grp) for d_id, grp in events_df.groupby("canonical_district_id")}
    empty_index = DistrictEventIndex(pd.DataFrame(columns=events_df.columns))
    demo_by_d = demo_df.set_index("canonical_district_id").to_dict(orient="index")
    health_by_d = health_df.set_index("canonical_district_id").to_dict(orient="index")

    obs_dates = pd.date_range(
        start=OBSERVATION_START_DATE,
        end=OBSERVATION_END_DATE,
        freq=f"{OBSERVATION_CADENCE_DAYS}D"
    )

    samples = []
    for obs_date in obs_dates:
        for _, d_row in districts_df.iterrows():
            d_id = d_row["canonical_district_id"]
            d_idx = event_indexes.get(d_id, empty_index)
            f_vec = generate_feature_vector_fast(d_id, obs_date, d_idx, demo_by_d.get(d_id), health_by_d.get(d_id))
            y, fut_count = generate_target_value_fast(d_idx, obs_date, PREDICTION_HORIZON_DAYS)
            f_vec["target_y"] = y
            f_vec["future_active_count"] = fut_count
            samples.append(f_vec)

    dataset_df = pd.DataFrame(samples)
    dataset_df["obs_str"] = dataset_df["observation_date"].dt.strftime("%Y-%m-%d")

    train_mask = dataset_df["obs_str"] < SPLIT_TRAIN_END
    val_mask = (dataset_df["obs_str"] >= SPLIT_TRAIN_END) & (dataset_df["obs_str"] < SPLIT_VAL_END)
    test_mask = dataset_df["obs_str"] >= SPLIT_VAL_END

    train_df = dataset_df[train_mask].copy()
    val_df = dataset_df[val_mask].copy()
    test_df = dataset_df[test_mask].copy()

    X_train_full = train_df[FEATURE_NAMES]
    y_train = train_df["target_y"].values
    X_val_full = val_df[FEATURE_NAMES]
    y_val = val_df["target_y"].values
    X_test_full = test_df[FEATURE_NAMES]
    y_test = test_df["target_y"].values

    print(f"Train: {len(train_df)} samples ({np.sum(y_train)} pos)")
    print(f"Val:   {len(val_df)} samples ({np.sum(y_val)} pos)")
    print(f"Test:  {len(test_df)} samples ({np.sum(y_test)} pos)")

    # Define Feature Sets for Ablations
    # Model A: Full Model (31 features)
    features_A = list(FEATURE_NAMES)

    # Model B: Remove days_since_last_active_event
    features_B = [f for f in FEATURE_NAMES if f != "days_since_last_active_event"]

    # Model C: Remove surveillance_reports_last_30d
    features_C = [f for f in FEATURE_NAMES if f != "surveillance_reports_last_30d"]

    # Model D: Remove Direct Recency Features
    recency_feats = {"days_since_last_active_event", "events_last_7d", "events_last_14d", "events_last_30d", "events_last_90d"}
    features_D = [f for f in FEATURE_NAMES if f not in recency_feats]

    # Model E: Non-Reporting / Contextual Baseline
    contextual_prefixes = ("census_", "hospital_", "geocoded_", "emergency_", "ambulance_", "healthcare_", "month_", "is_monsoon")
    features_E = [f for f in FEATURE_NAMES if any(f.startswith(p) for p in contextual_prefixes)]

    ablation_defs = [
        ("Model A (Current Full Model)", features_A),
        ("Model B (Remove days_since_last_active_event)", features_B),
        ("Model C (Remove surveillance_reports_last_30d)", features_C),
        ("Model D (Remove Recency Features)", features_D),
        ("Model E (Contextual/Non-Reporting Only)", features_E),
    ]

    results = {}
    print("\n" + "=" * 70)
    print("  RUNNING ABLATION MODELS")
    print("=" * 70)

    for name, f_list in ablation_defs:
        print(f"\nTraining {name} ({len(f_list)} features)...")
        res = train_and_eval_xgb(f_list, X_train_full, y_train, X_val_full, y_val, X_test_full, y_test)
        results[name] = res
        print(f"  Val  Raw:  ROC-AUC={res['raw_val']['roc_auc']}, PR-AUC={res['raw_val']['pr_auc']}, Brier={res['raw_val']['brier']}, F1={res['raw_val']['f1']}")
        print(f"  Val  Cal:  Brier={res['cal_val']['brier']}")
        print(f"  Test Raw:  ROC-AUC={res['raw_test']['roc_auc']}, PR-AUC={res['raw_test']['pr_auc']}, Brier={res['raw_test']['brier']}, F1={res['raw_test']['f1']}, Prec={res['raw_test']['precision']}, Rec={res['raw_test']['recall']}, Acc={res['raw_test']['accuracy']}")
        print(f"  Test Cal:  Brier={res['cal_test']['brier']}")

    # Baseline Logistic Regression on Full Features
    print("\nTraining Baseline Logistic Regression (Model A features)...")
    imputer = SimpleImputer(strategy="median")
    scaler = StandardScaler()
    X_tr_imp = scaler.fit_transform(imputer.fit_transform(X_train_full))
    X_v_imp = scaler.transform(imputer.transform(X_val_full))
    X_te_imp = scaler.transform(imputer.transform(X_test_full))

    lr = LogisticRegression(penalty="l2", C=1.0, class_weight="balanced", max_iter=1000, random_state=RANDOM_SEED)
    lr.fit(X_tr_imp, y_train)

    lr_val_probs = lr.predict_proba(X_v_imp)[:, 1]
    lr_test_probs = lr.predict_proba(X_te_imp)[:, 1]

    lr_calibrator = ProbabilityCalibrator()
    lr_calibrator.fit(lr_val_probs, y_val)
    lr_cal_val = lr_calibrator.calibrate(lr_val_probs)
    lr_cal_test = lr_calibrator.calibrate(lr_test_probs)

    lr_val_res = evaluate_predictions(y_val, lr_val_probs)
    lr_cal_val_res = evaluate_predictions(y_val, lr_cal_val)
    lr_test_res = evaluate_predictions(y_test, lr_test_probs)
    lr_cal_test_res = evaluate_predictions(y_test, lr_cal_test)

    results["Baseline Logistic Regression"] = {
        "features_count": len(FEATURE_NAMES),
        "raw_val": lr_val_res,
        "cal_val": lr_cal_val_res,
        "raw_test": lr_test_res,
        "cal_test": lr_cal_test_res,
    }
    print(f"  Val  Raw:  ROC-AUC={lr_val_res['roc_auc']}, PR-AUC={lr_val_res['pr_auc']}, Brier={lr_val_res['brier']}, F1={lr_val_res['f1']}")
    print(f"  Test Raw:  ROC-AUC={lr_test_res['roc_auc']}, PR-AUC={lr_test_res['pr_auc']}, Brier={lr_test_res['brier']}, F1={lr_test_res['f1']}, Prec={lr_test_res['precision']}, Rec={lr_test_res['recall']}, Acc={lr_test_res['accuracy']}")
    print(f"  Test Cal:  Brier={lr_cal_test_res['brier']}")

    # Save results to json for report generation
    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "ablation_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nAblation results successfully saved to {out_path}")

    # Output formatted markdown comparison table
    print("\n" + "=" * 70)
    print("  SUMMARY ABLATION TABLE (TEST SET)")
    print("=" * 70)
    header = f"{'Model':<45} | {'Feats':<5} | {'ROC-AUC':<7} | {'PR-AUC':<7} | {'Raw Brier':<9} | {'Cal Brier':<9} | {'F1':<6} | {'Prec':<6} | {'Rec':<6} | {'Acc':<6}"
    print(header)
    print("-" * len(header))
    for m_name, m_res in results.items():
        rt = m_res["raw_test"]
        ct = m_res["cal_test"]
        print(f"{m_name:<45} | {m_res['features_count']:<5} | {rt['roc_auc']:<7.4f} | {rt['pr_auc']:<7.4f} | {rt['brier']:<9.4f} | {ct['brier']:<9.4f} | {rt['f1']:<6.4f} | {rt['precision']:<6.4f} | {rt['recall']:<6.4f} | {rt['accuracy']:<6.4f}")

    print("\n" + "=" * 70)
    print("  SUMMARY ABLATION TABLE (VALIDATION SET)")
    print("=" * 70)
    header_v = f"{'Model':<45} | {'Feats':<5} | {'ROC-AUC':<7} | {'PR-AUC':<7} | {'Raw Brier':<9} | {'Cal Brier':<9} | {'F1':<6} | {'Prec':<6} | {'Rec':<6} | {'Acc':<6}"
    print(header_v)
    print("-" * len(header_v))
    for m_name, m_res in results.items():
        rv = m_res["raw_val"]
        cv = m_res["cal_val"]
        print(f"{m_name:<45} | {m_res['features_count']:<5} | {rv['roc_auc']:<7.4f} | {rv['pr_auc']:<7.4f} | {rv['brier']:<9.4f} | {cv['brier']:<9.4f} | {rv['f1']:<6.4f} | {rv['precision']:<6.4f} | {rv['recall']:<6.4f} | {rv['accuracy']:<6.4f}")


if __name__ == "__main__":
    run_ablations()
