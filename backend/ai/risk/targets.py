"""
VISTHAAPAN Phase 5: Target Generation & Horizon Discretization
Defines and generates ground-truth binary targets for future hazard events in (t, t + H].
"""

import numpy as np
import pandas as pd
from typing import Tuple
from .features import DistrictEventIndex


def generate_target_value_fast(
    event_index: DistrictEventIndex,
    obs_date: pd.Timestamp,
    horizon_days: int = 14
) -> Tuple[int, int]:
    """
    Computes binary target indicator and active event count strictly in future window:
    (obs_date, obs_date + horizon_days] via O(log N) searchsorted.
    """
    obs_dt64 = obs_date.to_datetime64()
    t_end = (obs_date + pd.Timedelta(days=horizon_days)).to_datetime64()

    act_dates = event_index.active_dates
    idx_right_start = int(np.searchsorted(act_dates, obs_dt64, side="right"))
    idx_right_end = int(np.searchsorted(act_dates, t_end, side="right"))

    future_count = max(0, idx_right_end - idx_right_start)
    y = 1 if future_count > 0 else 0
    return y, future_count


def generate_target_value(
    canonical_district_id: str,
    obs_date: pd.Timestamp,
    district_events: pd.DataFrame,
    horizon_days: int = 14
) -> Tuple[int, int]:
    """Compatibility wrapper for single-observation inference."""
    idx = DistrictEventIndex(district_events)
    return generate_target_value_fast(idx, obs_date, horizon_days)
