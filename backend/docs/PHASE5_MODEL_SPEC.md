# VISTHAAPAN Phase 5: AI Risk, Vulnerability & Relocation Priority Model Specification

**Document Version**: 1.0.0  
**Effective Date**: 2026-09-18  
**Authoritative Context**: Grounded in official NDEM disaster situation reporting, Census 2011 PCA baselines, and National Hospital Directory infrastructure profiles.

---

## 1. Learning Task Overview

The primary machine learning objective of Phase 5 is **Probabilistic Future Hazard Event Risk Prediction**:
Given the multi-domain history and statutory context of an administrative district available at observation timestamp $t$, estimate the calibrated probability that a qualifying active disaster hazard event will occur in that district during a defined operational planning horizon $(t, t + H]$:

$$P\left(Y_{i, t, H} = 1 \mid \mathcal{F}_{i, \le t}\right) \in [0.0, 1.0]$$

where:
- $i \in \{1, \dots, N\}$ indexes canonical Indian districts (`canonical_districts`).
- $t$ is the discrete observation timestamp.
- $\mathcal{F}_{i, \le t}$ denotes the filtration of all verifiable demographic, infrastructural, and hazard signals known on or before $t$.
- $H$ is the operational planning horizon.

---

## 2. Unit of Observation & Temporal Discretization

### 2.1 Justification of District-Time Discretization
Training a static model ($i \to \text{Risk}$) across 430 complete districts would reduce the problem to an ungrounded cross-sectional correlation exercise. Because disaster events are dynamic, cyclical, and recurrent, the model operates on:

$$\text{Unit of Observation} = \text{DISTRICT } (i) \times \text{OBSERVATION STEP } (t)$$

### 2.2 Discrete Step Interval & Cadence
- **Cadence**: Bi-weekly steps ($\Delta t = 14$ days), generating sequential observation timestamps $t_0, t_1, \dots, t_K$.
- **Observation Window Range**: November 1, 2025 to September 1, 2026 (spanning the dense daily DDMA reporting era in NDEM).
- **Target Horizon ($H$)**: Exactly 14 days ($H = 14$ days).
- **Zero-Overlap Property**: Because $\Delta t = H = 14$ days, the future target window for step $k$, $(t_k, t_k + 14\text{d}]$, matches the interval $(t_k, t_{k+1}]$ exactly. There is zero overlap between adjacent target periods, preventing auto-correlated target contamination.

---

## 3. Target Definition & Event Qualification

### 3.1 Ground Truth Data Source
Ground truth observations are extracted from table `district_disaster_events` (ingested from official Ministry of Home Affairs / NDEM situation reports).

### 3.2 Positive Class Definition ($Y = 1$)
An observation $(i, t)$ receives label $Y_{i, t} = 1$ if and only if:
1. At least one incident record is registered for district $i$ with `event_date` $\in (t, t + 14\text{ days}]$.
2. The event is an **active disaster event**:
   - `is_surveillance_record = false`
   - `normalized_hazard_type != 'NO_EVENT'`

### 3.3 Negative Class Definition ($Y = 0$)
An observation $(i, t)$ receives label $Y_{i, t} = 0$ if:
1. No event records are filed for district $i$ in $(t, t + 14\text{ days}]$, OR
2. Only routine quiescence filings (`Name of Disaster == 'No Event'`) are submitted by the DDMA.

### 3.4 Exclusion Rules
- Non-district administrative entries (e.g. `Statewide / Unspecified`, `Unknown District`, `Nazul`, POK entries) quarantined in `district_identity_mappings` with `mapping_status = 'UNMATCHED'` are excluded from the training universe.
- Simulated benchmark planning records (tagged with `(SIMULATED)`) are strictly excluded from all training, validation, and test sets.

---

## 4. Feature Space & Lookback Semantics

All features for an observation $(i, t)$ are computed strictly from information known at or before $t$ ($\le t$).

### 4.1 Hazard Recurrence & Temporal Dynamics (NDEM)
- `events_last_7d`: Active event count in $[t - 7\text{d}, t]$
- `events_last_14d`: Active event count in $[t - 14\text{d}, t]$
- `events_last_30d`: Active event count in $[t - 30\text{d}, t]$
- `events_last_90d`: Active event count in $[t - 90\text{d}, t]$
- `events_last_365d`: Active event count in $[t - 365\text{d}, t]$
- `surveillance_reports_last_30d`: Routine DDMA surveillance situation filings (quiescence / 'No Event' records) in past 30 days $[t - 30\text{d}, t]$ (measures recent monitoring report activity)
- `historical_active_events_cumulative`: Cumulative active events in district from start of dataset up to $t$
- `days_since_last_active_event`: Days elapsed between $t$ and the most recent active event in the district prior to $t$ (capped at 365)
- `hazard_diversity_365d`: Distinct canonical hazard categories observed in $[t - 365\text{d}, t]$
- `dominant_hazard_encoded`: Frequency-encoded primary hazard type observed in $[t - 365\text{d}, t]$
- `has_flood_history_365d`: Boolean indicator of flood event in $[t - 365\text{d}, t]$
- `has_landslide_history_365d`: Boolean indicator of landslide event in $[t - 365\text{d}, t]$
- `has_cyclone_history_365d`: Boolean indicator of cyclone/windstorm event in $[t - 365\text{d}, t]$

### 4.2 Baseline Socio-Demographic Context (Census 2011 PCA)
Explicitly tagged with metadata `reference_year = 2011`:
- `census_population_total`: Total headcount (log-transformed in feature matrix)
- `census_female_share`: Ratio of female population $\in [0.0, 1.0]$
- `census_child_share`: Ratio of children aged 0–6 $\in [0.0, 1.0]$
- `census_sc_share`: Scheduled Caste population share $\in [0.0, 1.0]$
- `census_st_share`: Scheduled Tribe population share $\in [0.0, 1.0]$
- `census_literacy_rate`: Population literacy proportion $\in [0.0, 1.0]$
- `census_worker_rate`: Workforce participation rate $\in [0.0, 1.0]$

### 4.3 Lifeline Healthcare Infrastructure (National Hospital Directory)
- `hospital_count`: Total registered healthcare facilities in district
- `geocoded_hospital_count`: Facilities with verified PostGIS point coordinates
- `emergency_service_hospital_count`: Facilities providing 24/7 emergency care
- `ambulance_available_hospital_count`: Facilities with active ambulance fleet
- `emergency_hospital_share`: Ratio of emergency facilities to total hospitals $\in [0.0, 1.0]$
- `ambulance_hospital_share`: Ratio of ambulance-equipped facilities $\in [0.0, 1.0]$
- *Strict Quarantine Rule*: Bed counts are NOT included in the feature set due to documented 99.8% corruption in the source dataset.

### 4.4 Cyclical & Seasonal Temporal Indicators
Disaster occurrence in the Indian subcontinent follows strong monsoon and climatic cycles:
- `month_sin`: $\sin(2\pi \cdot \text{month} / 12)$
- `month_cos`: $\cos(2\pi \cdot \text{month} / 12)$
- `is_monsoon_season`: Binary indicator for June–September (Southwest monsoon window)

---

## 5. Strict Anti-Leakage Rules & Audit Gates

1. **No Future Filtration Leakage**: No feature may reference data with timestamp $> t$.
2. **Post-Event Impact Quarantine**: Fields such as `deaths_total`, `injured`, `houses_damaged`, and `persons_evacuated` from the target window $(t, t + H]$ must never appear in the feature matrix.
3. **No Target Contamination**: The label column $Y$ is generated in a segregated target pipeline and isolated before feature scaling/encoding.
4. **No Test Set Contamination**: Feature imputation parameters, scalers, and encoders are fit strictly on the training partition and applied without modification to validation and test partitions.

---

## 6. Chronological Partitioning (Train / Validation / Test)

Because disaster records are time-series in nature, **random K-fold cross-validation is strictly forbidden**. Chronological partitioning prevents lookahead bias:

| Split | Temporal Range | Observation Steps | % of Timeline | Samples | Positive Rate | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TRAIN** | `2025-11-01` to `2026-05-02` | 14 bi-weekly steps | 63.6% | 10,990 | 8.43% (927 pos) | Model fitting (Logistic Regression & XGBoost) |
| **VALIDATION** | `2026-05-16` to `2026-07-11` | 5 bi-weekly steps | 22.7% | 3,925 | 26.57% (1,043 pos) | Threshold tuning & Platt probability calibration |
| **TEST** | `2026-07-25` to `2026-08-22` | 3 bi-weekly steps | 13.6% | 2,355 | 31.00% (730 pos) | Unbiased held-out evaluation during peak monsoon |

---

## 7. Model Architectures & Baselines

1. **Baseline Model**: L2-regularized Logistic Regression with standard-scaled continuous features and explicit missing indicators.
2. **Primary Model**: Gradient Boosted Trees (`xgboost.XGBClassifier`):
   - Objective: `binary:logistic`
   - Evaluation metric: `logloss` and `aucpr`
   - Fixed seed: `random_state = 42`
   - Deterministic tree depth and learning rate to control overfitting on moderate sample size.
3. **Probability Calibration**:
   - Evaluated using Sigmoid (Platt scaling) fit strictly on the VALIDATION split only.
   - Brier score evaluated before and after calibration.

---

## 8. Derived Indices: Vulnerability, Urgency, and Relocation Priority Weight (RPW)

To preserve transparent governance, the system decouples risk, vulnerability, and operational urgency:

```text
       DISTRICT INTELLIGENCE DECOUPLING
       
   ┌────────────────────────────────────────┐
   │  1. HAZARD EVENT RISK (ML Model)       │
   │  P(qualifying report in next 14 days)  │
   │  Score: risk_score in [0.0, 1.0]       │
   └───────────────────┬────────────────────┘
                       │
   ┌───────────────────┴────────────────────┐
   │  2. VULNERABILITY INDEX (Demographics)  │
   │  Susceptibility & lack of resilience   │
   │  Score: vulnerability_score in [0, 1]  │
   └───────────────────┬────────────────────┘
                       │
   ┌───────────────────┴────────────────────┐
   │  3. OPERATIONAL URGENCY (Recent Trend) │
   │  Recent 7d/14d acceleration of events  │
   │  Score: urgency_score in [0.0, 1.0]    │
   └───────────────────┬────────────────────┘
                       │
                       ▼
   ┌────────────────────────────────────────┐
   │  RELOCATION PRIORITY WEIGHT (RPW)      │
   │  RPW = w_r * Risk + w_v * Vuln + w_u * Urg │
   │  Planning weight in [0.0, 1.0]         │
   └────────────────────────────────────────┘
```

### 8.1 Transparent Vulnerability Index ($V_i$)
Derived from socio-demographic indicators and emergency healthcare access deficit:
- **Demographic Vulnerability ($V_{\text{demo}}$)**: Composite of child dependency share (weight 0.35), illiterate population share (weight 0.40), and marginalized social group share (SC+ST, weight 0.25). Default uninformative prior is 0.50 if demographic baseline is unmapped.
- **Healthcare Access Deficit ($V_{\text{health}}$)**:
  - When facilities are observed: $0.60 \cdot (1.0 - \text{emergency\_hospital\_share}) + 0.40 \cdot (1.0 - \text{ambulance\_hospital\_share})$.
  - When confirmed zero facilities are recorded: $V_{\text{health}} = 1.0$ (complete facility deficit).
  - When district is unmapped in National Hospital Directory (UNKNOWN, 212 districts): Assigned neutral median baseline deficit prior $V_{\text{health}} = 0.50$ (matching demographic missingness prior) with `has_health = False` to prevent artificial vulnerability inflation.
- **Normalized Score**: $V_i = 0.60 \cdot V_{\text{demo}} + 0.40 \cdot V_{\text{health}} \in [0.0, 1.0]$.

### 8.2 Operational Urgency ($U_i$)
Reflects recent momentum or acceleration in $[t - 14\text{d}, t]$ relative to 90-day baseline:
- Captures active ongoing distress versus quiet districts.
- Bounded in $[0.0, 1.0]$.

### 8.3 Relocation Priority Weight (RPW)
A composite planning triage score:
$$\text{RPW}_{i, t} = 0.50 \cdot R_{i, t} + 0.35 \cdot V_i + 0.15 \cdot U_{i, t}$$
- Tiers:
  - **Immediate**: $\text{RPW} \ge 0.70$
  - **Short-Term**: $0.40 \le \text{RPW} < 0.70$
  - **Medium-Term**: $\text{RPW} < 0.40$
- **Governance Semantics**: RPW is an engineered decision-support planning index under the Disaster Management Act, 2005. It is NOT statutory relocation authority, does NOT trigger autonomous evacuation, and does NOT generate Red Zones.

---

## 9. Explainability & SHAP Architecture

- Model predictions are explained via TreeSHAP (`shap.TreeExplainer`).
- For each prediction, SHAP values quantify exact additive log-odds margin contributions:
  $$\ln\left(\frac{P}{1-P}\right) = \phi_0 + \sum_{j=1}^M \phi_j$$
- Feature contributions are persisted into table `risk_feature_contributions` with direction (`positive` vs `negative`), feature value, and log-odds contribution value.
- Officers receive plain-language association summaries derived from top SHAP contributors using non-causal phrasing (e.g. "feature was associated with a positive contribution to the predicted hazard-report likelihood").

---

## 10. Phase 5.1 Audit Corrections & Semantic Grounding

In Phase 5.1, an independent audit of implementation vs documentation established:
1. **Epoch Reconciliation**: Documented 14/4/4 steps corrected to actual 14/5/3 steps (10,990 / 3,925 / 2,355 samples; total 17,270 observations across 22 bi-weekly epochs).
2. **Report vs Physical Event Semantics**: Clarified that target $Y$ predicts the occurrence of a qualifying NDEM active-event situation report within $(t, t + 14\text{d}]$, not reconstructed physical disasters.
3. **Surveillance Signal Semantics**: Refined description of `surveillance_reports_last_30d` from "reporting compliance" to "routine surveillance monitoring activity" (daily quiescence filings).
4. **Missing Healthcare Neutrality**: Replaced punitive 0.85 deficit for unmapped healthcare districts with neutral 0.50 baseline prior, eliminating artificial vulnerability inflation while preserving `has_health = False`.
5. **Non-Causal Association Language**: Updated SHAP natural-language generators to eliminate causal claims ("caused/causes") in favor of verified statistical association with the model's log-odds output.
6. **Temporal Panel vs Production Snapshot**: Clarified that training operates on the full $N \times K = 17,270$ longitudinal panel, whereas production database persistence stores the latest $N = 785$ operational snapshot.
