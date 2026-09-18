# VISTHAAPAN Phase 5.1: Diagnostic Feature Ablation Report

**Document Identifier**: `VISTHAAPAN-REPORT-PHASE5.1-ABLATION`  
**Execution Date**: 2026-09-18  
**Diagnostic Purpose**: Evaluate model sensitivity, feature group contributions, and reliance on temporal persistence vs. contextual variables.  
**Non-Negotiable Principle**: This ablation suite is strictly diagnostic. It is NOT intended to cherry-pick a different model or maximize test metrics retrospectively.

---

## 1. Objective & Scope

Phase 5 feature attribution analysis (TreeSHAP) demonstrated high global attribution to temporal features, particularly:
- `days_since_last_active_event` (mean absolute SHAP: 0.9130)
- `month_cos` (mean absolute SHAP: 0.3668)
- `surveillance_reports_last_30d` (mean absolute SHAP: 0.3194)
- `events_last_365d` (mean absolute SHAP: 0.2963)
- `events_last_30d` (mean absolute SHAP: 0.1631)

This ablation study investigates whether the predictive performance of the primary XGBoost model relies disproportionately on single recency features or administrative reporting proxies, and quantifies performance when direct temporal features are ablated.

---

## 2. Dataset & Chronological Evaluation Protocol

All models were evaluated under an **identical evaluation protocol**:
- **Universe**: 785 statutory canonical districts.
- **Discretization**: 14-day bi-weekly observation steps ($H = 14$ days target horizon).
- **Total Longitudinal Samples**: 17,270 observations across 22 discrete epochs.
- **Strict Chronological Splits**:
  - **TRAIN** (14 epochs, `2025-11-01` to `2026-05-02`): 10,990 samples (927 positives, 8.43% prevalence).
  - **VALIDATION** (5 epochs, `2026-05-16` to `2026-07-11`): 3,925 samples (1,043 positives, 26.57% prevalence).
  - **TEST (Held-Out)** (3 epochs, `2026-07-25` to `2026-08-22`): 2,355 samples (730 positives, 31.00% prevalence).
- **Seed & Hyperparameters**: Fixed `random_state = 42`, deterministic tree structure (`max_depth = 4`, `learning_rate = 0.05`, `n_estimators = 100`, `subsample = 0.85`, `colsample_bytree = 0.85`, `min_child_weight = 3`).
- **Calibration Protocol**: Platt sigmoid scaling fitted strictly on the VALIDATION partition and applied out-of-sample to TEST.

---

## 3. Evaluated Model Configurations

| Model Code | Configuration Name | Feature Count | Description / Diagnostic Rationale |
| :--- | :--- | :--- | :--- |
| **Model A** | Current Full Model | 31 | All canonical Phase 5 features across hazard, demographic, healthcare, and seasonal domains. |
| **Model B** | Ablate `days_since_last_active_event` | 30 | Tests whether the top SHAP feature is uniquely irreplaceable or if other recency counts substitute. |
| **Model C** | Ablate `surveillance_reports_last_30d` | 30 | Tests whether routine daily quiescence filings ("No Event" reports) represent a genuine physical signal or an administrative proxy. |
| **Model D** | Ablate All Direct Recency Features | 26 | Removes `days_since_last_active_event`, `events_last_7d`, `events_last_14d`, `events_last_30d`, `events_last_90d`. Retains 365-day history and structural features. |
| **Model E** | Contextual / Non-Reporting Baseline | 18 | Excludes ALL NDEM hazard event counts. Retains only Census 2011 demographics, healthcare facility profiles, and seasonal indicators. |
| **Baseline** | L2 Logistic Regression | 31 | Linear benchmark using standard scaling and median imputation on identical Model A features. |

---

## 4. Empirical Evaluation Results

### 4.1 Held-Out Test Set Performance (Peak Southwest Monsoon: July 25 – August 22, 2026)

| Model Configuration | Feats | ROC-AUC | PR-AUC | Raw Brier | Calibrated Brier | F1 Score | Precision | Recall | Accuracy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Model A (Full Model)** | 31 | **0.8545** | 0.7549 | 0.1537 | **0.1381** | 0.6967 | 0.6262 | 0.7849 | **0.7881** |
| **Model B (No Days-Since)** | 30 | 0.8513 | 0.7487 | 0.1565 | 0.1392 | 0.6979 | 0.6214 | **0.7959** | 0.7864 |
| **Model C (No Surveillance-30d)** | 30 | 0.8554 | **0.7593** | **0.1518** | **0.1364** | **0.6982** | **0.6270** | 0.7877 | 0.7890 |
| **Model D (No Direct Recency)** | 26 | 0.8299 | 0.6981 | 0.1735 | 0.1545 | 0.6698 | 0.5841 | 0.7849 | 0.7601 |
| **Model E (Contextual Only)** | 18 | 0.6663 | 0.5540 | 0.1952 | 0.1912 | 0.4386 | 0.6429 | 0.3329 | 0.7359 |
| **Baseline (Logistic Regression)** | 31 | **0.8643** | **0.8021** | 0.3225 | 0.1409 | 0.5536 | 0.3941 | **0.9301** | 0.5350 |

---

### 4.2 Validation Set Performance (Onset of Monsoon: May 16 – July 11, 2026)

| Model Configuration | Feats | ROC-AUC | PR-AUC | Raw Brier | Calibrated Brier | F1 Score | Precision | Recall | Accuracy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Model A (Full Model)** | 31 | 0.8839 | **0.7624** | 0.1197 | 0.1141 | 0.7005 | 0.6649 | 0.7402 | 0.8318 |
| **Model B (No Days-Since)** | 30 | **0.8840** | 0.7615 | **0.1194** | 0.1135 | 0.7083 | **0.6751** | 0.7450 | 0.8369 |
| **Model C (No Surveillance-30d)** | 30 | 0.8709 | 0.7605 | 0.1199 | **0.1134** | **0.7136** | 0.6746 | **0.7574** | **0.8385** |
| **Model D (No Direct Recency)** | 26 | 0.8702 | 0.7342 | 0.1287 | 0.1222 | 0.6787 | 0.6387 | 0.7239 | 0.8178 |
| **Model E (Contextual Only)** | 18 | 0.7326 | 0.5916 | 0.1599 | 0.1570 | 0.5139 | 0.6718 | 0.4161 | 0.7908 |
| **Baseline (Logistic Regression)** | 31 | 0.8698 | 0.7821 | 0.2986 | 0.1217 | 0.5111 | 0.3517 | 0.9348 | 0.5248 |

---

## 5. Methodological & Scientific Interpretation

### 5.1 Sensitivity to `days_since_last_active_event` (Model B vs. Model A)
- **Observation**: Removing `days_since_last_active_event` causes only a negligible change on Test PR-AUC ($0.7549 \to 0.7487$, $-0.0062$) and Test ROC-AUC ($0.8545 \to 0.8513$, $-0.0032$). F1 score remains stable ($0.6967 \to 0.6979$).
- **Scientific Interpretation**: Although `days_since_last_active_event` has the highest single SHAP attribution in Model A, the model does not suffer a catastrophic drop when it is removed. The tree ensembles readily route predictive signal through collinear hazard frequency variables (`events_last_7d`, `events_last_14d`, `events_last_30d`, `events_last_90d`). The feature carries high predictive association, but the underlying recency signal is distributed.

### 5.2 Role of Routine Surveillance Records (Model C vs. Model A)
- **Observation**: Removing `surveillance_reports_last_30d` does NOT degrade performance. In fact, Test PR-AUC slightly improves ($0.7549 \to 0.7593$) and calibrated Brier score improves ($0.1381 \to 0.1364$).
- **Scientific Interpretation**: Daily quiescence filings ("No Event" records) reflect DDMA administrative reporting activity. Districts that file frequent surveillance reports are also more diligent in reporting active hazards when they occur. This is an administrative reporting-intensity proxy rather than a physical hazard cause.

### 5.3 Diagnostic Drop Without Direct Recency Features (Model D vs. Model A)
- **Observation**: Removing all 5 direct recency features (`days_since_last_active_event`, `events_last_7d`, `events_last_14d`, `events_last_30d`, `events_last_90d`) results in a noticeable drop in Test PR-AUC ($0.7549 \to 0.6981$, $-0.0568$) and increases calibrated Brier error ($0.1381 \to 0.1545$).
- **Scientific Interpretation**: Short-term temporal persistence is a primary predictive driver of 14-day forward situation reports. An active situation in the preceding 14 to 30 days strongly predicts continuing or subsequent situation reports. Nonetheless, even without direct recency features, Model D achieves $0.8299$ ROC-AUC using annual cumulative history and contextual signals.

### 5.4 Collapse of Contextual-Only Model (Model E vs. Model A)
- **Observation**: Model E (Census demographics + Healthcare + Seasonality, zero hazard reporting history) experiences substantial degradation on the held-out test set:
  - ROC-AUC drops from $0.8545 \to 0.6663$ ($-0.1882$)
  - PR-AUC drops from $0.7549 \to 0.5540$ ($-0.2009$)
  - Recall drops from $0.7849 \to 0.3329$ ($-0.4520$)
- **Scientific Interpretation**: Demographic baselines and healthcare facilities describe structural vulnerability and community susceptibility, but they do NOT contain sufficient dynamic information to predict short-term (14-day) hazard situation reports. This empirically validates the multi-domain architecture of VISTHAAPAN:
  - **ML Model**: Driven primarily by dynamic hazard report history and seasonality to estimate forward hazard likelihood.
  - **Vulnerability Index**: Driven by demographics and healthcare deficit to measure community susceptibility independently.
  - Conflating the two into a single supervised model without hazard history would fail.

### 5.5 Tree-Based vs. Linear Architecture (XGBoost vs. Logistic Regression)
- **Observation**: While Logistic Regression achieves high PR-AUC ($0.8021$) due to uniform class-weight balancing, it produces an unacceptable false positive rate:
  - Precision is only **39.41%** (versus **62.62%** for XGBoost).
  - Overall accuracy is only **53.50%** (versus **78.81%** for XGBoost).
  - Raw Brier score is **0.3225** (versus **0.1537** for XGBoost).
- **Scientific Interpretation**: A linear model with balanced class weights predicts nearly all districts during peak monsoon to be positive (recall 93.01%), which creates operational alert fatigue for emergency managers. XGBoost captures nonlinear feature interactions and threshold effects, maintaining high recall (78.49%) while filtering out over 62% of false alerts.

---

## 6. Decision Regarding Primary Model Feature Set

1. **Retain Model A Feature Set**: In accordance with the non-negotiable principles of Phase 5.1, Model A remains the authoritative primary model. We do NOT replace Model A with Model C merely because Model C produced a marginally higher test PR-AUC (+0.0044).
2. **Document Association Semantics**: Documentation and API descriptions must clearly articulate that recency features capture administrative situation persistence, and surveillance reports reflect routine monitoring frequency rather than statutory compliance or physical causes.
