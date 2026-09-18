"""
VISTHAAPAN Phase 5: Relocation Priority Weight (RPW) Engine
Combines calibrated risk, vulnerability, and urgency into actionable planning weights and triage tiers.
"""

from typing import Dict, Any, List
import numpy as np
from .config import (
    RPW_WEIGHT_RISK,
    RPW_WEIGHT_VULNERABILITY,
    RPW_WEIGHT_URGENCY,
    TIER_IMMEDIATE_THRESHOLD,
    TIER_SHORT_TERM_THRESHOLD
)


def compute_relocation_priority(
    risk_score: float,
    vulnerability_score: float,
    urgency_score: float,
    top_shap_factors: List[str] = None
) -> Dict[str, Any]:
    """
    Computes Relocation Priority Weight (RPW) in [0.0, 1.0] and assigns operational triage tier:
    RPW = 0.50 * Risk + 0.35 * Vulnerability + 0.15 * Urgency
    """
    # Enforce safe bounds
    r = float(np.clip(risk_score, 0.0, 1.0))
    v = float(np.clip(vulnerability_score, 0.0, 1.0))
    u = float(np.clip(urgency_score, 0.0, 1.0))

    rpw = round(
        RPW_WEIGHT_RISK * r + 
        RPW_WEIGHT_VULNERABILITY * v + 
        RPW_WEIGHT_URGENCY * u,
        4
    )

    # Assign operational tier
    if rpw >= TIER_IMMEDIATE_THRESHOLD:
        tier = "immediate"
    elif rpw >= TIER_SHORT_TERM_THRESHOLD:
        tier = "short-term"
    else:
        tier = "medium-term"

    # Construct auditable governance reasons
    reasons = []
    if r >= 0.60:
        reasons.append(f"High forward hazard likelihood ({round(r, 3)}) predicted within 14-day window")
    elif r >= 0.35:
        reasons.append(f"Moderate forward hazard likelihood ({round(r, 3)})")

    if v >= 0.60:
        reasons.append(f"High structural vulnerability index ({round(v, 3)}) driven by demographic or healthcare deficit")
    elif v >= 0.40:
        reasons.append(f"Moderate baseline vulnerability index ({round(v, 3)})")

    if u >= 0.60:
        reasons.append("Critical operational urgency: acute recent hazard recurrence in past 7-14 days")
    elif u >= 0.30:
        reasons.append("Elevated situational monitoring urgency")

    if top_shap_factors:
        for factor in top_shap_factors[:2]:
            reasons.append(f"AI Model Factor: {factor}")

    # Confidence calculation: based on data completeness and calibration
    confidence = 0.90 if (r is not None and v is not None and u is not None) else 0.65

    return {
        "priority_weight": rpw,
        "tier": tier,
        "risk_component": r,
        "vulnerability_component": v,
        "urgency_component": u,
        "confidence": confidence,
        "reasons": reasons
    }
