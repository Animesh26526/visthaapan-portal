"""
VISTHAAPAN Phase 5: Operational Urgency Engine
Computes recent situational momentum & event acceleration strictly from past observations.
"""

import numpy as np
from typing import Dict, Any


def compute_operational_urgency(
    events_last_7d: int,
    events_last_14d: int,
    events_last_90d: int,
    days_since_last_active: int,
    surveillance_last_30d: int
) -> Dict[str, Any]:
    """
    Computes operational urgency score U_i in [0.0, 1.0] reflecting recent temporal
    acceleration and crisis proximity:
    
    1. Acute Momentum (U_acute): Active events in past 7 days (normalized [0, 5+])
    2. Trend Acceleration (U_trend): Ratio of 14-day event rate to 90-day baseline rate
    3. Proximity Factor (U_prox): 1.0 - (days_since_last_active / 365.0)
    
    Composite Urgency = 0.50 * U_acute + 0.30 * U_trend + 0.20 * U_prox
    """
    # 1. Acute recent event count (0 to 5+ events in past 7 days)
    u_acute = np.clip(events_last_7d / 5.0, 0.0, 1.0)

    # 2. Acceleration relative to 90d baseline
    # Expected 14d count based on 90d rate: (events_last_90d / 90) * 14
    baseline_14d_expected = (events_last_90d / 90.0) * 14.0
    if baseline_14d_expected > 0:
        ratio = events_last_14d / baseline_14d_expected
        u_trend = np.clip(ratio / 2.0, 0.0, 1.0)
    elif events_last_14d > 0:
        u_trend = 0.80  # Sudden spike from 0 baseline
    else:
        u_trend = 0.0

    # 3. Recency factor (how recent was the latest qualifying event)
    u_prox = max(0.0, min(1.0, 1.0 - (days_since_last_active / 180.0)))

    urgency_score = round(float(np.clip(0.50 * u_acute + 0.30 * u_trend + 0.20 * u_prox, 0.0, 1.0)), 4)

    # Categorical urgency tier
    if urgency_score >= 0.70:
        urgency_label = "CRITICAL_ACCELERATION"
    elif urgency_score >= 0.40:
        urgency_label = "ELEVATED_WATCH"
    elif urgency_score >= 0.15:
        urgency_label = "ROUTINE_MONITORING"
    else:
        urgency_label = "QUIESCENT"

    return {
        "urgency_score": urgency_score,
        "urgency_label": urgency_label,
        "acute_component": round(float(u_acute), 4),
        "trend_component": round(float(u_trend), 4),
        "recency_component": round(float(u_prox), 4)
    }
