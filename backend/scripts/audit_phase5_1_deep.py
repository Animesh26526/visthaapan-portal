"""
VISTHAAPAN Phase 5.1 Deep Semantic & Methodological Audit
Audits #3, #4, #5, #6, #8, #9, #12, #13, #14, #18, #19
"""

import sys
import os
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.risk.config import DATABASE_URL, ARTIFACTS_DIR, MODEL_VERSION
from ai.risk.data import get_db_connection, load_raw_multidomain_data
from ai.risk.features import DistrictEventIndex, generate_feature_vector_fast, FEATURE_NAMES
from ai.risk.targets import generate_target_value_fast
from ai.risk.vulnerability import compute_district_vulnerability_index
from ai.risk.urgency import compute_operational_urgency
from ai.risk.priority import compute_relocation_priority
import joblib

def run_deep_audit():
    print("=" * 70)
    print("  PHASE 5.1 DEEP AUDIT EXECUTION")
    print("=" * 70)

    conn = get_db_connection()
    cur = conn.cursor()

    # -------------------------------------------------------------
    # AUDIT #3: TARGET WINDOW SEMANTICS & EDGE CASES
    # -------------------------------------------------------------
    print("\n>>> AUDIT #3: Target Window Semantics Edge Cases")
    # Simulate artificial event index
    t0 = pd.Timestamp("2026-06-01")
    # Edge case 1: Event exactly at t (2026-06-01)
    df_edge1 = pd.DataFrame([{
        "event_date": pd.Timestamp("2026-06-01"),
        "is_surveillance_record": False,
        "normalized_hazard_type": "Flood"
    }])
    idx1 = DistrictEventIndex(df_edge1)
    y1, c1 = generate_target_value_fast(idx1, t0, 14)
    print(f"  Edge 1 (event == t): y={y1}, count={c1} (Expected: y=0, count=0 -> strictly > t)")

    # Edge case 2: Event at t + 1 day (2026-06-02)
    df_edge2 = pd.DataFrame([{
        "event_date": pd.Timestamp("2026-06-02"),
        "is_surveillance_record": False,
        "normalized_hazard_type": "Flood"
    }])
    idx2 = DistrictEventIndex(df_edge2)
    y2, c2 = generate_target_value_fast(idx2, t0, 14)
    print(f"  Edge 2 (event == t + 1d): y={y2}, count={c2} (Expected: y=1, count=1)")

    # Edge case 3: Event exactly at t + 14d (2026-06-15)
    df_edge3 = pd.DataFrame([{
        "event_date": pd.Timestamp("2026-06-15"),
        "is_surveillance_record": False,
        "normalized_hazard_type": "Flood"
    }])
    idx3 = DistrictEventIndex(df_edge3)
    y3, c3 = generate_target_value_fast(idx3, t0, 14)
    print(f"  Edge 3 (event == t + 14d): y={y3}, count={c3} (Expected: y=1, count=1 -> <= t + 14d)")

    # Edge case 4: Event at t + 15d (2026-06-16)
    df_edge4 = pd.DataFrame([{
        "event_date": pd.Timestamp("2026-06-16"),
        "is_surveillance_record": False,
        "normalized_hazard_type": "Flood"
    }])
    idx4 = DistrictEventIndex(df_edge4)
    y4, c4 = generate_target_value_fast(idx4, t0, 14)
    print(f"  Edge 4 (event == t + 15d): y={y4}, count={c4} (Expected: y=0, count=0 -> strictly <= t + 14d)")

    # Edge case 5: District with only NO_EVENT
    df_edge5 = pd.DataFrame([{
        "event_date": pd.Timestamp("2026-06-05"),
        "is_surveillance_record": True,
        "normalized_hazard_type": "NO_EVENT"
    }])
    idx5 = DistrictEventIndex(df_edge5)
    y5, c5 = generate_target_value_fast(idx5, t0, 14)
    print(f"  Edge 5 (only NO_EVENT in window): y={y5}, count={c5} (Expected: y=0, count=0)")

    # Edge case 6: District with multiple active events
    df_edge6 = pd.DataFrame([
        {"event_date": pd.Timestamp("2026-06-03"), "is_surveillance_record": False, "normalized_hazard_type": "Flood"},
        {"event_date": pd.Timestamp("2026-06-05"), "is_surveillance_record": False, "normalized_hazard_type": "Landslide"},
        {"event_date": pd.Timestamp("2026-06-10"), "is_surveillance_record": False, "normalized_hazard_type": "Flash Flood"}
    ])
    idx6 = DistrictEventIndex(df_edge6)
    y6, c6 = generate_target_value_fast(idx6, t0, 14)
    print(f"  Edge 6 (3 active events): y={y6}, count={c6} (Expected: y=1, count=3)")

    # -------------------------------------------------------------
    # AUDIT #4 & #5: REPORT RECORD VS REAL-WORLD EVENT & DUPLICATES
    # -------------------------------------------------------------
    print("\n>>> AUDIT #4 & #5: Report Records vs Events & Duplicates")
    cur.execute("SELECT COUNT(*) FROM district_disaster_events")
    total_db_events = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM district_disaster_events WHERE is_surveillance_record = false AND normalized_hazard_type != 'NO_EVENT'")
    active_db_events = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM district_disaster_events WHERE is_surveillance_record = true OR normalized_hazard_type = 'NO_EVENT'")
    surv_db_events = cur.fetchone()[0]
    print(f"  DB district_disaster_events total: {total_db_events}")
    print(f"    - Active hazard records: {active_db_events}")
    print(f"    - Surveillance records: {surv_db_events}")

    # Inspect multiple records per district per day
    cur.execute("""
        SELECT state_name, district_name, event_date, COUNT(*) as cnt
        FROM district_disaster_events
        GROUP BY state_name, district_name, event_date
        HAVING COUNT(*) > 1
        ORDER BY cnt DESC
        LIMIT 5;
    """)
    mult_dates = cur.fetchall()
    print(f"  Top district-dates with multiple records: {mult_dates}")

    # Inspect the 3 composite-key duplicates from raw CSV
    raw_csv_path = "data/disaster-report (3).csv"
    if os.path.exists(raw_csv_path):
        raw_df = pd.read_csv(raw_csv_path, dtype=str)
        print(f"  Raw CSV total rows: {len(raw_df)}")
        # Check duplicates on [State, District, Date of Event, Name of Disaster]
        comp_dup = raw_df[raw_df.duplicated(subset=['State', 'Date', 'District Affected', 'Name of Disaster'], keep=False)]
        print(f"  Raw CSV composite duplicates count: {len(comp_dup)}")
        if len(comp_dup) > 0:
            print("  Sample composite duplicate rows:")
            print(comp_dup[['State', 'Date', 'District Affected', 'Name of Disaster', 'No. of Villages Affected', 'No. of Deaths:Total']].head(6))

    # -------------------------------------------------------------
    # AUDIT #6: SURVEILLANCE_REPORTS_LAST_30D SEMANTICS
    # -------------------------------------------------------------
    print("\n>>> AUDIT #6: Surveillance Reports Last 30d Analysis")
    cur.execute("""
        SELECT 
            normalized_hazard_type, 
            is_surveillance_record, 
            COUNT(*) 
        FROM district_disaster_events 
        WHERE is_surveillance_record = true OR normalized_hazard_type = 'NO_EVENT'
        GROUP BY normalized_hazard_type, is_surveillance_record
    """)
    surv_types = cur.fetchall()
    print("  Surveillance record hazard types and flags in DB:")
    for row in surv_types:
        print(f"    - normalized_hazard_type={row[0]}, is_surveillance={row[1]}, count={row[2]}")

    # -------------------------------------------------------------
    # AUDIT #8 & #9: VULNERABILITY INDEX & MISSING DATA SEMANTICS
    # -------------------------------------------------------------
    print("\n>>> AUDIT #8 & #9: Vulnerability Index & Healthcare Semantics")
    cur.execute("""
        SELECT 
            COUNT(*) as total_districts,
            COUNT(dhp.canonical_district_id) as with_health_profile,
            COUNT(CASE WHEN dhp.hospital_count = 0 THEN 1 END) as zero_hospitals,
            COUNT(CASE WHEN dhp.hospital_count > 0 THEN 1 END) as pos_hospitals
        FROM canonical_districts cd
        LEFT JOIN district_healthcare_profiles dhp ON dhp.canonical_district_id = cd.id;
    """)
    h_counts = cur.fetchone()
    print(f"  Canonical districts: {h_counts[0]}")
    print(f"  With healthcare profile: {h_counts[1]}")
    print(f"  Profiles with hospital_count == 0: {h_counts[2]}")
    print(f"  Profiles with hospital_count > 0: {h_counts[3]}")
    print(f"  Unmapped (UNKNOWN) healthcare districts: {h_counts[0] - h_counts[1]}")

    # Test vulnerability function on missing vs zero
    v_missing_health = compute_district_vulnerability_index({"population_total": 500000, "child_population_share": 0.13, "literacy_rate": 0.70, "sc_population_share": 0.15, "st_population_share": 0.08}, None)
    v_zero_hosp = compute_district_vulnerability_index({"population_total": 500000, "child_population_share": 0.13, "literacy_rate": 0.70, "sc_population_share": 0.15, "st_population_share": 0.08}, {"hospital_count": 0, "emergency_hospital_share": 0, "ambulance_hospital_share": 0})
    v_with_hosp = compute_district_vulnerability_index({"population_total": 500000, "child_population_share": 0.13, "literacy_rate": 0.70, "sc_population_share": 0.15, "st_population_share": 0.08}, {"hospital_count": 50, "emergency_hospital_share": 0.8, "ambulance_hospital_share": 0.8})
    print(f"  Vuln with UNKNOWN health: score={v_missing_health['vulnerability_score']}, V_health={v_missing_health['healthcare_deficit_component']}, has_health={v_missing_health['has_health_data']}")
    print(f"  Vuln with ZERO hospitals: score={v_zero_hosp['vulnerability_score']}, V_health={v_zero_hosp['healthcare_deficit_component']}, has_health={v_zero_hosp['has_health_data']}")
    print(f"  Vuln with 50 hospitals:   score={v_with_hosp['vulnerability_score']}, V_health={v_with_hosp['healthcare_deficit_component']}, has_health={v_with_hosp['has_health_data']}")

    # -------------------------------------------------------------
    # AUDIT #12 & #13: HAZARD TAXONOMY & QUALIFYING ACTIVE EVENTS
    # -------------------------------------------------------------
    print("\n>>> AUDIT #12 & #13: Hazard Taxonomy in DB")
    cur.execute("""
        SELECT normalized_hazard_type, is_surveillance_record, COUNT(*) 
        FROM district_disaster_events
        GROUP BY normalized_hazard_type, is_surveillance_record
        ORDER BY COUNT(*) DESC;
    """)
    tax_rows = cur.fetchall()
    print("  All normalized hazard types and counts:")
    for r in tax_rows:
        print(f"    {r[0]:<35} | is_surv={str(r[1]):<5} | count={r[2]}")

    # -------------------------------------------------------------
    # AUDIT #14: SHAP ADDITIVITY CHECK
    # -------------------------------------------------------------
    print("\n>>> AUDIT #14: TreeSHAP Additivity Verification")
    artifact_path = os.path.join(ARTIFACTS_DIR, f"{MODEL_VERSION}.joblib")
    bundle = joblib.load(artifact_path)
    xgb_model = bundle["xgb_model"]
    import shap
    expl = shap.TreeExplainer(xgb_model.model)
    base_val = float(expl.expected_value) if not isinstance(expl.expected_value, (list, np.ndarray)) else float(expl.expected_value[0])
    print(f"  TreeExplainer expected value (base margin): {base_val:.4f}")

    # Check on 10 synthetic or sample vectors
    districts_df, events_df, demo_df, health_df = load_raw_multidomain_data()
    event_indexes = {d_id: DistrictEventIndex(grp) for d_id, grp in events_df.groupby("canonical_district_id")}
    empty_index = DistrictEventIndex(pd.DataFrame(columns=events_df.columns))
    demo_by_d = demo_df.set_index("canonical_district_id").to_dict(orient="index")
    health_by_d = health_df.set_index("canonical_district_id").to_dict(orient="index")

    test_obs = pd.Timestamp("2026-08-22")
    sample_rows = []
    for _, d_row in districts_df.head(20).iterrows():
        d_id = d_row["canonical_district_id"]
        idx = event_indexes.get(d_id, empty_index)
        f_vec = generate_feature_vector_fast(d_id, test_obs, idx, demo_by_d.get(d_id), health_by_d.get(d_id))
        sample_rows.append(f_vec)
    sample_df = pd.DataFrame(sample_rows)[FEATURE_NAMES]

    shap_vals = expl.shap_values(sample_df)
    # XGBoost margin predictions
    booster = xgb_model.model.get_booster()
    import xgboost as xgb
    dmat = xgb.DMatrix(sample_df)
    raw_margins = booster.predict(dmat, output_margin=True)

    max_diff = 0.0
    for i in range(len(sample_df)):
        shap_sum = base_val + np.sum(shap_vals[i])
        diff = abs(shap_sum - raw_margins[i])
        if diff > max_diff:
            max_diff = diff
    print(f"  Max difference between (base_val + sum(SHAP)) and raw_margin: {max_diff:.6e}")
    print(f"  Additivity check: {'PASSED (exact margin additivity)' if max_diff < 1e-4 else 'FAILED'}")

    conn.close()

if __name__ == "__main__":
    run_deep_audit()
