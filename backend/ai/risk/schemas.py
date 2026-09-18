"""
VISTHAAPAN Phase 5: AI Data Schemas & Type Definitions
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional


@dataclass
class DistrictIntelligenceOutput:
    district_id: str
    district_name: str
    state_name: str
    observation_time: str
    risk_score: float
    raw_risk_probability: float
    calibrated_risk_probability: float
    vulnerability_score: float
    urgency_score: float
    relocation_priority_weight: float
    tier: str
    confidence_or_data_quality: float
    model_version: str
    top_positive_factors: List[Dict[str, Any]]
    top_negative_factors: List[Dict[str, Any]]
    reasons: List[str]
