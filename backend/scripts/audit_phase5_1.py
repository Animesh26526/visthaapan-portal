"""
VISTHAAPAN Phase 5.1 Audit Script: Epochs, Splits, Targets, Duplicates, and Taxonomy
"""

import sys
import os
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.risk.config import (
    OBSERVATION_CADENCE_DAYS,
    PREDICTION_HORIZON_DAYS,
    OBSERVATION_START_DATE,
    OBSERVATION_END_DATE,
    SPLIT_TRAIN_END,
    SPLIT_VAL_END,
)
from ai.risk.data import load_raw_multidomain_data
from ai.risk.features import DistrictEventIndex, generate_feature_vector_fast, FEATURE_NAMES
from ai.risk.targets import generate_target_value_fast

def run_audit_stage1():
    print("Loading raw multidomain data...")
    districts_df, events_df, demo_df, health_df = load_raw_multidomain_data()
    n_districts = len(districts_df)
    print(f"Total canonical districts: {n_districts}")

    # Build event indexes
    event_indexes = {}
    empty_df = pd.DataFrame(columns=events_df.columns)
    empty_index = DistrictEventIndex(empty_df)
    for d_id, group in events_df.groupby("canonical_district_id"):
        event_indexes[d_id] = DistrictEventIndex(group)

    # 1. Epoch generation
    obs_dates = pd.date_range(
        start=OBSERVATION_START_DATE,
        end=OBSERVATION_END_DATE,
        freq=f"{OBSERVATION_CADENCE_DAYS}D"
    )
    print(f"\nTotal epochs: {len(obs_dates)}")

    epoch_records = []
    all_samples = []

    for ep_idx, obs_date in enumerate(obs_dates):
        obs_dt_str = obs_date.strftime("%Y-%m-%d")
        ep_pos = 0
        dist_in_ep = set()
        for _, dist_row in districts_df.iterrows():
            d_id = dist_row["canonical_district_id"]
            dist_in_ep.add(d_id)
            d_idx = event_indexes.get(d_id, empty_index)
            y, fut_count = generate_target_value_fast(d_idx, obs_date, PREDICTION_HORIZON_DAYS)
            if y == 1:
                ep_pos += 1
            all_samples.append({
                "epoch_index": ep_idx,
                "observation_date": obs_dt_str,
                "canonical_district_id": d_id,
                "target_y": y,
                "future_active_count": fut_count
            })
        
        pos_rate = ep_pos / n_districts
        epoch_records.append({
            "epoch_index": ep_idx,
            "observation_date": obs_dt_str,
            "district_count": len(dist_in_ep),
            "sample_count": len(dist_in_ep),
            "positive_count": ep_pos,
            "positive_rate": round(pos_rate, 4)
        })

    epoch_df = pd.DataFrame(epoch_records)
    print("\n--- EPOCH TABLE ---")
    print(epoch_df.to_string(index=False))

    total_samples = len(all_samples)
    total_positives = sum(r["positive_count"] for r in epoch_records)
    print(f"\nTotal samples: {total_samples} (Expected: {n_districts * len(obs_dates)})")
    print(f"Total positives: {total_positives} ({total_positives / total_samples:.4%})")

    # 2. Split analysis
    train_epochs = epoch_df[epoch_df["observation_date"] < SPLIT_TRAIN_END]
    val_epochs = epoch_df[(epoch_df["observation_date"] >= SPLIT_TRAIN_END) & (epoch_df["observation_date"] < SPLIT_VAL_END)]
    test_epochs = epoch_df[epoch_df["observation_date"] >= SPLIT_VAL_END]

    split_summary = [
        {
            "Split": "TRAIN",
            "First observation": train_epochs["observation_date"].min(),
            "Last observation": train_epochs["observation_date"].max(),
            "Number of epochs": len(train_epochs),
            "Number of districts": n_districts,
            "Samples": train_epochs["sample_count"].sum(),
            "Positive samples": train_epochs["positive_count"].sum(),
            "Positive rate": f"{train_epochs['positive_count'].sum() / train_epochs['sample_count'].sum():.2%}"
        },
        {
            "Split": "VALIDATION",
            "First observation": val_epochs["observation_date"].min(),
            "Last observation": val_epochs["observation_date"].max(),
            "Number of epochs": len(val_epochs),
            "Number of districts": n_districts,
            "Samples": val_epochs["sample_count"].sum(),
            "Positive samples": val_epochs["positive_count"].sum(),
            "Positive rate": f"{val_epochs['positive_count'].sum() / val_epochs['sample_count'].sum():.2%}"
        },
        {
            "Split": "TEST",
            "First observation": test_epochs["observation_date"].min(),
            "Last observation": test_epochs["observation_date"].max(),
            "Number of epochs": len(test_epochs),
            "Number of districts": n_districts,
            "Samples": test_epochs["sample_count"].sum(),
            "Positive samples": test_epochs["positive_count"].sum(),
            "Positive rate": f"{test_epochs['positive_count'].sum() / test_epochs['sample_count'].sum():.2%}"
        }
    ]
    print("\n--- SPLIT TABLE ---")
    print(pd.DataFrame(split_summary).to_string(index=False))

if __name__ == "__main__":
    run_audit_stage1()
