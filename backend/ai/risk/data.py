"""
VISTHAAPAN Phase 5: Database Data Loader & Missingness Auditor
Extracts multi-domain data directly from PostgreSQL and audits coverage.
"""

import sys
import psycopg
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from .config import DATABASE_URL


def get_db_connection():
    """Establish connection to PostgreSQL/PostGIS database."""
    return psycopg.connect(DATABASE_URL)


def load_raw_multidomain_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Loads normalized datasets required for temporal AI feature engineering:
    1. Canonical Districts Master (785 statutory units)
    2. Disaster Events mapped to canonical districts (47,154 events)
    3. Census 2011 Demographics baseline
    4. District Healthcare Profiles
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. Canonical Districts
            cur.execute("""
                SELECT 
                    id AS canonical_district_id,
                    district_code,
                    district_name,
                    state_code,
                    state_name,
                    district_census2011_code,
                    state_census2011_code
                FROM canonical_districts
                ORDER BY state_name, district_name
            """)
            districts_cols = [desc[0] for desc in cur.description]
            districts_df = pd.DataFrame(cur.fetchall(), columns=districts_cols)

            # 2. Mapped Disaster Events
            cur.execute("""
                SELECT 
                    dde.id AS event_id,
                    dde.event_date,
                    dde.state_name,
                    dde.district_name,
                    dde.normalized_hazard_type,
                    dde.is_surveillance_record,
                    dim.canonical_district_id,
                    dde.villages_affected_count,
                    dde.population_affected,
                    dde.deaths_total,
                    dde.injured,
                    dde.house_damaged_fully_pakka,
                    dde.house_damaged_partially_pakka,
                    dde.persons_evacuated,
                    dde.infrastructure_affected_count
                FROM district_disaster_events dde
                JOIN district_identity_mappings dim
                  ON dim.source_dataset = 'NDEM'
                 AND dim.source_state = dde.state_name
                 AND dim.source_district = dde.district_name
                WHERE dim.canonical_district_id IS NOT NULL
                ORDER BY dde.event_date ASC
            """)
            events_cols = [desc[0] for desc in cur.description]
            events_df = pd.DataFrame(cur.fetchall(), columns=events_cols)
            events_df["event_date"] = pd.to_datetime(events_df["event_date"])

            # 3. Census 2011 Demographics
            cur.execute("""
                SELECT 
                    canonical_district_id,
                    data_reference_year,
                    population_total,
                    population_female,
                    population_child_0_6,
                    population_sc,
                    population_st,
                    female_population_share,
                    child_population_share,
                    sc_population_share,
                    st_population_share,
                    literacy_rate,
                    worker_participation_rate,
                    households_count
                FROM district_demographics
            """)
            demo_cols = [desc[0] for desc in cur.description]
            demo_df = pd.DataFrame(cur.fetchall(), columns=demo_cols)

            # 4. District Healthcare Profiles
            cur.execute("""
                SELECT 
                    canonical_district_id,
                    hospital_count,
                    geocoded_hospital_count,
                    government_hospital_count,
                    private_hospital_count,
                    emergency_service_hospital_count,
                    ambulance_available_hospital_count,
                    geocoded_hospital_share,
                    emergency_hospital_share,
                    ambulance_hospital_share
                FROM district_healthcare_profiles
            """)
            health_cols = [desc[0] for desc in cur.description]
            health_df = pd.DataFrame(cur.fetchall(), columns=health_cols)

        return districts_df, events_df, demo_df, health_df
    finally:
        conn.close()


def audit_missingness(
    districts_df: pd.DataFrame,
    events_df: pd.DataFrame,
    demo_df: pd.DataFrame,
    health_df: pd.DataFrame
) -> Dict[str, Any]:
    """
    Quantifies missingness across all statutory districts as required by Section 9.
    """
    total_districts = len(districts_df)
    districts_with_events = events_df["canonical_district_id"].nunique()
    active_events = events_df[~events_df["is_surveillance_record"] & (events_df["normalized_hazard_type"] != "NO_EVENT")]
    districts_with_active = active_events["canonical_district_id"].nunique()
    districts_with_demo = demo_df["canonical_district_id"].nunique()
    districts_with_health = health_df["canonical_district_id"].nunique()

    # Triple intersection
    all_set = set(districts_df["canonical_district_id"])
    ev_set = set(events_df["canonical_district_id"])
    dm_set = set(demo_df["canonical_district_id"])
    hl_set = set(health_df["canonical_district_id"])
    triple_set = ev_set.intersection(dm_set).intersection(hl_set)

    return {
        "total_canonical_districts": total_districts,
        "districts_with_ndem_reports": districts_with_events,
        "ndem_coverage_pct": round(districts_with_events / total_districts * 100, 2),
        "districts_with_active_hazards": districts_with_active,
        "districts_with_census_demographics": districts_with_demo,
        "census_coverage_pct": round(districts_with_demo / total_districts * 100, 2),
        "districts_with_healthcare_profile": districts_with_health,
        "healthcare_coverage_pct": round(districts_with_health / total_districts * 100, 2),
        "triple_intersection_districts": len(triple_set),
        "triple_intersection_pct": round(len(triple_set) / total_districts * 100, 2)
    }
