"""
VISTHAAPAN Phase 5.1: Case Studies, Edge Cases, and Feature Importance Consistency
Audits #22, #23, #24
"""

import sys
import os
import json
import pandas as pd
import numpy as np
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.risk.config import ARTIFACTS_DIR, MODEL_VERSION, FEATURE_SCHEMA_VERSION
from ai.risk.data import get_db_connection, load_raw_multidomain_data
from ai.risk.features import DistrictEventIndex, generate_feature_vector_fast, FEATURE_NAMES
from ai.risk.vulnerability import compute_district_vulnerability_index
from ai.risk.urgency import compute_operational_urgency
from ai.risk.priority import compute_relocation_priority
from ai.risk.explainability import SHAPExplainer
from sklearn.inspection import permutation_importance


def run_cases_and_edge():
    print("=" * 70)
    print("  AUDIT #22, #23, #24: IMPORTANCE, CASE STUDIES, EDGE CASES")
    print("=" * 70)

    artifact_path = os.path.join(ARTIFACTS_DIR, f"{MODEL_VERSION}.joblib")
    bundle = joblib.load(artifact_path)
    xgb_model = bundle["xgb_model"]
    calibrator = bundle["calibrator"]
    explainer = SHAPExplainer(xgb_model)

    districts_df, events_df, demo_df, health_df = load_raw_multidomain_data()
    event_indexes = {d_id: DistrictEventIndex(grp) for d_id, grp in events_df.groupby("canonical_district_id")}
    empty_index = DistrictEventIndex(pd.DataFrame(columns=events_df.columns))
    demo_by_d = demo_df.set_index("canonical_district_id").to_dict(orient="index")
    health_by_d = health_df.set_index("canonical_district_id").to_dict(orient="index")

    # -------------------------------------------------------------
    # AUDIT #22: FEATURE IMPORTANCE CONSISTENCY
    # -------------------------------------------------------------
    print("\n>>> AUDIT #22: Feature Importance Comparison (Gain vs Permutation vs SHAP)")
    # Gain importance
    gain_imp = xgb_model.get_feature_importances()

    # Build test matrix for permutation & SHAP
    test_obs_dates = [pd.Timestamp("2026-07-25"), pd.Timestamp("2026-08-08"), pd.Timestamp("2026-08-22")]
    test_samples = []
    y_test_list = []
    from ai.risk.targets import generate_target_value_fast
    for od in test_obs_dates:
        for _, dr in districts_df.iterrows():
            did = dr["canonical_district_id"]
            idx = event_indexes.get(did, empty_index)
            fv = generate_feature_vector_fast(did, od, idx, demo_by_d.get(did), health_by_d.get(did))
            y, _ = generate_target_value_fast(idx, od, 14)
            test_samples.append(fv)
            y_test_list.append(y)
    test_df = pd.DataFrame(test_samples)[FEATURE_NAMES]
    y_test = np.array(y_test_list)

    # Permutation importance on Test
    perm = permutation_importance(xgb_model.model, test_df, y_test, n_repeats=5, random_state=42, scoring="roc_auc")
    perm_imp = {name: round(float(m), 5) for name, m in zip(FEATURE_NAMES, perm.importances_mean)}
    perm_sorted = dict(sorted(perm_imp.items(), key=lambda x: x[1], reverse=True))

    # SHAP mean absolute importance on Test
    shap_vals = explainer.explain_dataset(test_df)
    shap_imp = explainer.get_global_feature_importance(shap_vals)

    print(f"{'Rank':<4} | {'Gain Feature':<32} {'Gain':<8} | {'Permutation Feature':<32} {'Perm Mean':<10} | {'SHAP Feature':<32} {'SHAP Mean':<10}")
    print("-" * 125)
    all_feats = list(FEATURE_NAMES)
    top_gain = list(gain_imp.items())[:10]
    top_perm = list(perm_sorted.items())[:10]
    top_shap = list(shap_imp.items())[:10]
    for i in range(10):
        g_name, g_v = top_gain[i]
        p_name, p_v = top_perm[i]
        s_name, s_v = top_shap[i]
        print(f"{i+1:<4} | {g_name:<32} {g_v:<8.4f} | {p_name:<32} {p_v:<10.4f} | {s_name:<32} {s_v:<10.4f}")

    # -------------------------------------------------------------
    # AUDIT #23: CASE STUDIES (CHAMOLI & JHABUA)
    # -------------------------------------------------------------
    print("\n>>> AUDIT #23: Case Studies (Chamoli and Jhabua)")
    eval_obs = pd.Timestamp("2026-09-01")

    for dist_target in ["Chamoli", "Jhabua"]:
        matched = districts_df[districts_df["district_name"].str.lower() == dist_target.lower()]
        if matched.empty:
            print(f"  District {dist_target} NOT FOUND!")
            continue
        d_row = matched.iloc[0]
        did = d_row["canonical_district_id"]
        idx = event_indexes.get(did, empty_index)
        d_rec = demo_by_d.get(did)
        h_rec = health_by_d.get(did)

        fv = generate_feature_vector_fast(did, eval_obs, idx, d_rec, h_rec)
        X_case = pd.DataFrame([fv])[FEATURE_NAMES]

        raw_p = float(xgb_model.predict_proba(X_case)[0])
        cal_p = float(calibrator.calibrate(np.array([raw_p]))[0])

        v_res = compute_district_vulnerability_index(d_rec, h_rec)
        u_res = compute_operational_urgency(
            fv["events_last_7d"], fv["events_last_14d"], fv["events_last_90d"],
            fv["days_since_last_active_event"], fv["surveillance_reports_last_30d"]
        )
        shap_single = explainer.explain_dataset(X_case)[0]
        shap_contribs = explainer.explain_single_observation(X_case.iloc[0], shap_single, top_k=5)
        top_factors = [fc["explanation"] for fc in shap_contribs[:2]]

        rpw_res = compute_relocation_priority(cal_p, v_res["vulnerability_score"], u_res["urgency_score"], top_factors)

        print(f"\n--- CASE STUDY: {d_row['district_name']} ({d_row['state_name']}) ---")
        print(f"  Canonical District ID: {did}")
        print(f"  Raw Risk Probability:        {raw_p:.4f}")
        print(f"  Calibrated Risk Probability: {cal_p:.4f}")
        print(f"  Vulnerability Score:         {v_res['vulnerability_score']:.4f} (V_demo={v_res['demographic_component']}, V_health={v_res['healthcare_deficit_component']})")
        print(f"  Urgency Score:               {u_res['urgency_score']:.4f} ({u_res['urgency_label']})")
        print(f"  RPW:                         {rpw_res['priority_weight']:.4f} -> Tier: {rpw_res['tier'].upper()}")
        print(f"  Data Availability:           has_demo={v_res['has_demo_data']}, has_health={v_res['has_health_data']}")
        print(f"  Key Features:")
        print(f"    - events_last_7d: {fv['events_last_7d']}, events_last_14d: {fv['events_last_14d']}, events_last_30d: {fv['events_last_30d']}, events_last_365d: {fv['events_last_365d']}")
        print(f"    - days_since_last_active_event: {fv['days_since_last_active_event']}")
        print(f"    - surveillance_reports_last_30d: {fv['surveillance_reports_last_30d']}")
        print(f"    - population_total: {d_rec.get('population_total') if d_rec else 'MISSING'}")
        print(f"    - hospital_count: {h_rec.get('hospital_count') if h_rec else 'MISSING'}")
        print(f"  Top SHAP Contributors (Log-Odds Margin):")
        for sc in shap_contribs:
            print(f"    * {sc['feature']:<32}: {sc['contribution']:>+7.4f} ({sc['direction']}) -> {sc['explanation']}")

    # -------------------------------------------------------------
    # AUDIT #24: EXTREME EDGE CASES (13 CASES)
    # -------------------------------------------------------------
    print("\n>>> AUDIT #24: Extreme Edge Cases (13 Cases)")
    edge_cases = [
        # 1. District with zero qualifying historical active events
        ("1. Zero historical active events", empty_index, demo_by_d.get(list(demo_by_d.keys())[0]), health_by_d.get(list(health_by_d.keys())[0]), 0, 0, 0, 365, 30),
        # 2. District with no Census 2011 mapping
        ("2. Missing Census demographics", event_indexes.get(list(event_indexes.keys())[0], empty_index), None, health_by_d.get(list(health_by_d.keys())[0]), 0, 0, 0, 365, 30),
        # 3. District with no healthcare mapping
        ("3. Missing healthcare mapping", event_indexes.get(list(event_indexes.keys())[0], empty_index), demo_by_d.get(list(demo_by_d.keys())[0]), None, 0, 0, 0, 365, 30),
        # 4. District with no geocoded hospitals
        ("4. Zero geocoded hospitals", event_indexes.get(list(event_indexes.keys())[0], empty_index), demo_by_d.get(list(demo_by_d.keys())[0]), {"hospital_count": 5, "geocoded_hospital_count": 0, "emergency_service_hospital_count": 1, "ambulance_available_hospital_count": 1, "emergency_hospital_share": 0.2, "ambulance_hospital_share": 0.2}, 0, 0, 0, 365, 30),
        # 5. District with many recent active records
        ("5. High acute active records (10 in 7d)", None, demo_by_d.get(list(demo_by_d.keys())[0]), health_by_d.get(list(health_by_d.keys())[0]), 10, 15, 25, 1, 0),
        # 6. District with many surveillance records
        ("6. Dense routine surveillance (30 in 30d, 0 active)", empty_index, demo_by_d.get(list(demo_by_d.keys())[0]), health_by_d.get(list(health_by_d.keys())[0]), 0, 0, 0, 365, 30),
        # 7. District with only NO_EVENT records
        ("7. Only NO_EVENT filings", empty_index, demo_by_d.get(list(demo_by_d.keys())[0]), health_by_d.get(list(health_by_d.keys())[0]), 0, 0, 0, 365, 30),
        # 8. Both demographic and healthcare missing
        ("8. Both Census & Health Missing", empty_index, None, None, 0, 0, 0, 365, 0),
        # 9. High vulnerability, low hazard
        ("9. High vulnerability, low hazard", empty_index, {"population_total": 500000, "child_population_share": 0.22, "literacy_rate": 0.35, "sc_population_share": 0.40, "st_population_share": 0.40}, {"hospital_count": 1, "emergency_hospital_share": 0.0, "ambulance_hospital_share": 0.0}, 0, 0, 0, 365, 0),
        # 10. High hazard risk, low vulnerability
        ("10. High hazard risk, low vulnerability", None, {"population_total": 2000000, "child_population_share": 0.08, "literacy_rate": 0.95, "sc_population_share": 0.05, "st_population_share": 0.01}, {"hospital_count": 200, "emergency_hospital_share": 0.9, "ambulance_hospital_share": 0.9}, 8, 12, 20, 1, 0),
        # 11. High urgency spike (0 baseline, sudden 5 in 14d)
        ("11. Sudden urgency spike (0 baseline)", None, demo_by_d.get(list(demo_by_d.keys())[0]), health_by_d.get(list(health_by_d.keys())[0]), 3, 5, 0, 2, 10),
        # 12. Quiescent district (no events in 365d)
        ("12. Quiescent district", empty_index, demo_by_d.get(list(demo_by_d.keys())[0]), health_by_d.get(list(health_by_d.keys())[0]), 0, 0, 0, 365, 0),
        # 13. Completely unobserved across all sources
        ("13. Completely unobserved district", empty_index, None, None, 0, 0, 0, 365, 0),
    ]

    edge_results = []
    dummy_did = list(districts_df["canonical_district_id"])[0]

    for label, e_idx, d_rec, h_rec, ev7, ev14, ev90, d_since, surv30 in edge_cases:
        fv = generate_feature_vector_fast(dummy_did, eval_obs, e_idx or empty_index, d_rec, h_rec)
        # Override specific counts if prescribed
        if ev7 is not None: fv["events_last_7d"] = ev7
        if ev14 is not None: fv["events_last_14d"] = ev14
        if ev90 is not None: fv["events_last_90d"] = ev90
        if d_since is not None: fv["days_since_last_active_event"] = d_since
        if surv30 is not None: fv["surveillance_reports_last_30d"] = surv30

        X_e = pd.DataFrame([fv])[FEATURE_NAMES]
        raw_p = float(xgb_model.predict_proba(X_e)[0])
        cal_p = float(calibrator.calibrate(np.array([raw_p]))[0])
        v_res = compute_district_vulnerability_index(d_rec, h_rec)
        u_res = compute_operational_urgency(fv["events_last_7d"], fv["events_last_14d"], fv["events_last_90d"], fv["days_since_last_active_event"], fv["surveillance_reports_last_30d"])
        rpw_res = compute_relocation_priority(cal_p, v_res["vulnerability_score"], u_res["urgency_score"])

        is_finite = not (np.isnan(cal_p) or np.isnan(v_res["vulnerability_score"]) or np.isnan(u_res["urgency_score"]) or np.isnan(rpw_res["priority_weight"]))
        is_bounded = (0.0 <= cal_p <= 1.0) and (0.0 <= v_res["vulnerability_score"] <= 1.0) and (0.0 <= u_res["urgency_score"] <= 1.0) and (0.0 <= rpw_res["priority_weight"] <= 1.0)

        edge_results.append({
            "case": label,
            "cal_risk": cal_p,
            "vuln": v_res["vulnerability_score"],
            "urgency": u_res["urgency_score"],
            "rpw": rpw_res["priority_weight"],
            "tier": rpw_res["tier"],
            "valid": is_finite and is_bounded
        })

    print(f"{'Case':<45} | {'Risk':<7} | {'Vuln':<7} | {'Urg':<7} | {'RPW':<7} | {'Tier':<12} | {'Valid'}")
    print("-" * 105)
    for er in edge_results:
        print(f"{er['case']:<45} | {er['cal_risk']:<7.4f} | {er['vuln']:<7.4f} | {er['urgency']:<7.4f} | {er['rpw']:<7.4f} | {er['tier']:<12} | {'PASS' if er['valid'] else 'FAIL'}")


if __name__ == "__main__":
    run_cases_and_edge()
