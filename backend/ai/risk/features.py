"""
VISTHAAPAN Phase 5: Temporal Feature Engineering Pipeline
Builds leakage-safe multi-domain feature vectors for (district, observation_date) tuples.
"""

import math
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional


# Canonical Feature Column Order
FEATURE_NAMES: List[str] = [
    # Hazard History & Recurrence (strictly <= t)
    "events_last_7d",
    "events_last_14d",
    "events_last_30d",
    "events_last_90d",
    "events_last_365d",
    "surveillance_reports_last_30d",
    "cumulative_active_events_to_date",
    "days_since_last_active_event",
    "hazard_diversity_365d",
    "has_flood_365d",
    "has_landslide_365d",
    "has_cyclone_365d",
    "has_heavy_rain_365d",
    
    # Demographics (Census 2011 Baseline)
    "census_population_total_log",
    "census_female_share",
    "census_child_share",
    "census_sc_share",
    "census_st_share",
    "census_literacy_rate",
    "census_worker_rate",
    "census_is_missing",
    
    # Healthcare Infrastructure (National Directory)
    "hospital_count",
    "geocoded_hospital_count",
    "emergency_service_hospital_count",
    "ambulance_available_hospital_count",
    "emergency_hospital_share",
    "ambulance_hospital_share",
    "healthcare_is_missing",
    
    # Cyclical & Climatic Temporal Signals
    "month_sin",
    "month_cos",
    "is_monsoon_season"
]


class DistrictEventIndex:
    """Fast indexed event representation for high-speed temporal lookups."""
    def __init__(self, events_df: pd.DataFrame):
        if events_df is None or events_df.empty:
            self.active_dates = np.array([], dtype="datetime64[ns]")
            self.surv_dates = np.array([], dtype="datetime64[ns]")
            self.active_hazards = []
        else:
            is_surv = events_df["is_surveillance_record"] | (events_df["normalized_hazard_type"] == "NO_EVENT")
            active_df = events_df[~is_surv].sort_values("event_date")
            surv_df = events_df[is_surv].sort_values("event_date")

            self.active_dates = active_df["event_date"].values.astype("datetime64[ns]")
            self.surv_dates = surv_df["event_date"].values.astype("datetime64[ns]")
            self.active_hazards = [str(h).lower() for h in active_df["normalized_hazard_type"]]


def generate_feature_vector_fast(
    canonical_district_id: str,
    obs_date: pd.Timestamp,
    event_index: DistrictEventIndex,
    demo_record: Optional[Dict[str, Any]],
    health_record: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Constructs a feature vector for (district, obs_date) strictly using
    data available on or before obs_date (<= obs_date) via O(log N) numpy searchsorted.
    """
    obs_dt64 = obs_date.to_datetime64()
    t_7d = (obs_date - pd.Timedelta(days=7)).to_datetime64()
    t_14d = (obs_date - pd.Timedelta(days=14)).to_datetime64()
    t_30d = (obs_date - pd.Timedelta(days=30)).to_datetime64()
    t_90d = (obs_date - pd.Timedelta(days=90)).to_datetime64()
    t_365d = (obs_date - pd.Timedelta(days=365)).to_datetime64()

    act_dates = event_index.active_dates
    surv_dates = event_index.surv_dates

    # 1. Past Active Event Counts (strictly <= obs_date)
    idx_right_active = int(np.searchsorted(act_dates, obs_dt64, side="right"))
    idx_7d = int(np.searchsorted(act_dates, t_7d, side="left"))
    idx_14d = int(np.searchsorted(act_dates, t_14d, side="left"))
    idx_30d = int(np.searchsorted(act_dates, t_30d, side="left"))
    idx_90d = int(np.searchsorted(act_dates, t_90d, side="left"))
    idx_365d = int(np.searchsorted(act_dates, t_365d, side="left"))

    ev_7d = max(0, idx_right_active - max(0, min(idx_7d, idx_right_active)))
    ev_14d = max(0, idx_right_active - max(0, min(idx_14d, idx_right_active)))
    ev_30d = max(0, idx_right_active - max(0, min(idx_30d, idx_right_active)))
    ev_90d = max(0, idx_right_active - max(0, min(idx_90d, idx_right_active)))
    ev_365d = max(0, idx_right_active - max(0, min(idx_365d, idx_right_active)))
    cum_ev = idx_right_active

    # Surveillance filings in last 30d
    idx_right_surv = int(np.searchsorted(surv_dates, obs_dt64, side="right"))
    idx_30d_surv = int(np.searchsorted(surv_dates, t_30d, side="left"))
    surv_30d = max(0, idx_right_surv - max(0, min(idx_30d_surv, idx_right_surv)))

    # Days since last active event
    if idx_right_active > 0:
        last_dt = pd.Timestamp(act_dates[idx_right_active - 1])
        days_since = max(0, min(365, (obs_date - last_dt).days))
    else:
        days_since = 365

    # Hazard diversity & specific categories in past 365d
    if idx_right_active > idx_365d:
        past_hazards = event_index.active_hazards[max(0, idx_365d):idx_right_active]
        hazard_diversity = len(set(past_hazards))
        has_flood = 1 if any("flood" in h for h in past_hazards) else 0
        has_landslide = 1 if any("landslide" in h or "mudflow" in h for h in past_hazards) else 0
        has_cyclone = 1 if any("cyclone" in h or "windstorm" in h for h in past_hazards) else 0
        has_heavy_rain = 1 if any("heavy rain" in h for h in past_hazards) else 0
    else:
        hazard_diversity = 0
        has_flood = 0
        has_landslide = 0
        has_cyclone = 0
        has_heavy_rain = 0

    # 2. Demographics (Census 2011 Baseline)
    census_missing = 1 if not demo_record else 0
    if demo_record:
        pop_total = float(demo_record.get("population_total") or 0.0)
        pop_log = math.log10(max(1.0, pop_total))
        female_share = float(demo_record.get("female_population_share") or 0.0)
        child_share = float(demo_record.get("child_population_share") or 0.0)
        sc_share = float(demo_record.get("sc_population_share") or 0.0)
        st_share = float(demo_record.get("st_population_share") or 0.0)
        lit_rate = float(demo_record.get("literacy_rate") or 0.0)
        worker_rate = float(demo_record.get("worker_participation_rate") or 0.0)
    else:
        pop_log = np.nan
        female_share = np.nan
        child_share = np.nan
        sc_share = np.nan
        st_share = np.nan
        lit_rate = np.nan
        worker_rate = np.nan

    # 3. Healthcare Infrastructure (National Hospital Directory)
    health_missing = 1 if not health_record else 0
    if health_record:
        hosp_count = float(health_record.get("hospital_count") or 0.0)
        geo_count = float(health_record.get("geocoded_hospital_count") or 0.0)
        emerg_count = float(health_record.get("emergency_service_hospital_count") or 0.0)
        amb_count = float(health_record.get("ambulance_available_hospital_count") or 0.0)
        emerg_share = float(health_record.get("emergency_hospital_share") or 0.0)
        amb_share = float(health_record.get("ambulance_hospital_share") or 0.0)
    else:
        hosp_count = np.nan
        geo_count = np.nan
        emerg_count = np.nan
        amb_count = np.nan
        emerg_share = np.nan
        amb_share = np.nan

    # 4. Seasonal & Climatic Indicators
    month = obs_date.month
    month_sin = math.sin(2.0 * math.pi * month / 12.0)
    month_cos = math.cos(2.0 * math.pi * month / 12.0)
    is_monsoon = 1 if month in [6, 7, 8, 9] else 0

    return {
        "canonical_district_id": canonical_district_id,
        "observation_date": obs_date,
        "events_last_7d": ev_7d,
        "events_last_14d": ev_14d,
        "events_last_30d": ev_30d,
        "events_last_90d": ev_90d,
        "events_last_365d": ev_365d,
        "surveillance_reports_last_30d": surv_30d,
        "cumulative_active_events_to_date": cum_ev,
        "days_since_last_active_event": days_since,
        "hazard_diversity_365d": hazard_diversity,
        "has_flood_365d": has_flood,
        "has_landslide_365d": has_landslide,
        "has_cyclone_365d": has_cyclone,
        "has_heavy_rain_365d": has_heavy_rain,
        "census_population_total_log": pop_log,
        "census_female_share": female_share,
        "census_child_share": child_share,
        "census_sc_share": sc_share,
        "census_st_share": st_share,
        "census_literacy_rate": lit_rate,
        "census_worker_rate": worker_rate,
        "census_is_missing": census_missing,
        "hospital_count": hosp_count,
        "geocoded_hospital_count": geo_count,
        "emergency_service_hospital_count": emerg_count,
        "ambulance_available_hospital_count": amb_count,
        "emergency_hospital_share": emerg_share,
        "ambulance_hospital_share": amb_share,
        "healthcare_is_missing": health_missing,
        "month_sin": month_sin,
        "month_cos": month_cos,
        "is_monsoon_season": is_monsoon
    }


def generate_feature_vector(
    canonical_district_id: str,
    obs_date: pd.Timestamp,
    district_events: pd.DataFrame,
    demo_record: Optional[Dict[str, Any]],
    health_record: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """Compatibility wrapper for single-observation inference."""
    idx = DistrictEventIndex(district_events)
    return generate_feature_vector_fast(canonical_district_id, obs_date, idx, demo_record, health_record)
