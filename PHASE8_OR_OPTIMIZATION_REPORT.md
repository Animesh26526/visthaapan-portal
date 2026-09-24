# VISTHAAPAN PORTAL — PHASE 8 OPERATIONS RESEARCH ALLOCATION & TRANSIT OPTIMIZATION ENGINE REPORT

**Document ID:** VP-P8-REP-2026-09-18  
**System Classification:** Decision-Support Capability Verification (SIMULATED_BENCHMARK)  
**Module:** Phase 8 Operations Research Allocation & Transit Optimization Engine  
**Release Target:** v1.0.0-PROD  
**Timestamp:** 2026-09-18T21:11:30+05:30  

---

## 1. Executive Summary & Governance Scope

Phase 8 of the VISTHAAPAN Portal implements the Operations Research (OR) mathematical allocation and transit optimization pipeline for post-disaster population relocation.

> [!IMPORTANT]
> **Decision-Support Classification Notice**: VISTHAAPAN provides analytical decision support for emergency planning and logistics. It does NOT exercise executive or statutory authority and does NOT issue legal relocation directives. All allocation flows, transit costs, and hazard exclusions are model-derived recommendations intended for evaluation by authorized disaster management officials.

Key Phase 8 Capabilities:
1. **Mathematical Optimization Formulation**: Formulates population transit and site assignment as a **priority-weighted capacitated transportation/allocation optimization** model with strict demand conservation, multi-dimensional carrying capacity upper bounds, route passability gating, and GIS-derived hard hazard exclusions.
2. **Google OR-Tools Solver Integration**: Employs Google OR-Tools (`ortools.linear_solver.pywraplp`) with the `SCIP` mixed-integer solver (and `GLOP` linear programming fallback). **SCIP reported OPTIMAL for the benchmark instance** within 20–50 ms.
3. **RPW-Weighted Unmet Demand Penalty**: Directly incorporates Phase 5/6 AI-derived Relocation Priority Weights (RPW = 0.7109 for Chamoli immediate operational tier) into the optimization objective, penalizing unmet relocation for vulnerable populations.
   - *Benchmark Note*: Because all five current Chamoli planning units share the same district RPW (0.7109), this benchmark validates the priority-weighted penalty formulation, but does not demonstrate differentiation between varying priority tiers.
4. **GIS-Derived Hard Hazard Exclusion**: Automatically enforces $x_{i,\text{Pipalkoti}} = 0$ due to active riverbed hazard polygon intersection, ensuring zero allocation to hazard-intersecting sites in the decision-support model.
5. **Deterministic Structured Explanation Synthesis**: Generates transparent, human-readable, and category-tagged justification dossiers (`PRIORITY`, `HAZARD_SAFETY`, `CAPACITY_LIMIT`) without non-deterministic LLM hallucination or external API latency.
6. **Full Transactional PostgreSQL Persistence**: Persists all optimization runs, allocation items, constraint verification records, and structured explanations atomically with complete provenance and auditability.

---

## 2. Mathematical Problem Formulation

### 2.1 Sets and Indices
- $I = \{1, 2, \dots, n\}$: Set of disaster-impacted habitations / demand nodes (`SIMULATED_BENCHMARK`).
- $J = \{1, 2, \dots, m\}$: Set of candidate relocation sites (SITE-001 through SITE-006, `SIMULATED_BENCHMARK`).
- $K$: Set of infrastructure lifeline dimensions evaluated in Phase 7 (`SIMULATED_BENCHMARK`).

### 2.2 Parameters
- $D_i \in \mathbb{N}_{\ge 0}$: Modeled relocation population demand at origin node $i \in I$.
- $C_j \in \mathbb{N}_{\ge 0}$: Usable capacity after hazard exclusion at candidate site $j \in J$, where:
  $$C_j = \begin{cases} 0 & \text{if site } j \text{ intersects an active hazard zone } (H_j = 1) \\ \min_{k \in K} C_k(j) & \text{otherwise} \end{cases}$$
- $P_i \in [0.0, 1.0]$: Relocation Priority Weight derived from Phase 5/6 AI risk inference (e.g., Chamoli RPW = 0.7109 across all 5 nodes).
- $d_{ij} \in \mathbb{R}_{\ge 0}$: Heuristic road transit distance between origin $i$ and site $j$ (km, `SIMULATED/HEURISTIC`).
- $r_{ij} \in [0.0, 1.0]$: Heuristic hazard exposure risk index along transit corridor $(i, j)$ (`SIMULATED/HEURISTIC`).
- $t_{ij} \ge 1.0$: Modeled corridor terrain and congestion multiplier (`SIMULATED/HEURISTIC`).
- $A_{ij} \in \{0, 1\}$: Modeled route passability indicator ($1$ if passable, $0$ if blocked by landslides or severed).
- $H_j \in \{0, 1\}$: Hard hazard exclusion indicator ($1$ for Pipalkoti active riverbed hazard zone, $0$ otherwise).
- $\alpha = 1.5$: Risk avoidance penalty weight.
- $M = \sum_{i \in I} D_i$: Sufficiently large upper bound.

### 2.3 Decision Variables
- $x_{ij} \ge 0$: Number of displaced persons transferred from origin $i \in I$ to candidate site $j \in J$ ($x_{ij} \in \mathbb{Z}_{\ge 0}$ under MIP mode, $x_{ij} \in \mathbb{R}_{\ge 0}$ under LP relaxation).
- $u_i \ge 0$: Unmet population demand at origin $i \in I$.

### 2.4 Objective Function
$$\min Z = \sum_{i \in I} \sum_{j \in J} c_{ij} x_{ij} + \sum_{i \in I} W_i u_i$$

Where:
1. **Heuristic Transit Cost ($c_{ij}$)**:
   $$c_{ij} = d_{ij} \cdot (1 + \alpha r_{ij}) \cdot t_{ij}$$
   Balances heuristic distance against corridor hazard exposure and mountain road terrain multipliers. These represent simulated planning heuristics, not surveyed live road conditions or measured road throughput.

2. **Priority-Weighted Unmet Penalty ($W_i$)**:
   $$W_i = \text{base\_penalty} \cdot (1 + 5 \cdot P_i)$$
   With $\text{base\_penalty} = 2,000$. For Chamoli immediate priority ($P_i = 0.7109$):
   $$W_i = 2000 \cdot (1 + 5 \times 0.7109) = 2000 \times 4.5545 = 9,109.0$$
   Because $W_i \gg c_{ij}$ (typical $c_{ij} \in [20, 150]$), the solver will allocate every displaced person to safe capacity before incurring any unmet penalty.

### 2.5 Constraints

1. **Demand Conservation**:
   Every displaced citizen at origin $i$ must either be allocated to a candidate site or marked as unmet:
   $$\sum_{j \in J} x_{ij} + u_i = D_i \quad \forall i \in I$$

2. **Usable Capacity Upper Bounds**:
   Total population assigned to site $j$ cannot exceed its usable capacity after hazard exclusion:
   $$\sum_{i \in I} x_{ij} \le C_j \quad \forall j \in J$$

3. **Route Feasibility & Passability Gating**:
   No population may transit across an impassable or severed road corridor:
   $$x_{ij} \le M \cdot A_{ij} \quad \forall i \in I, \forall j \in J$$

4. **GIS-Derived Hard Hazard Exclusion**:
   Zero population may be allocated to any candidate site designated with a hard hazard exclusion:
   $$x_{ij} = 0 \quad \forall i \in I, \forall j \in J \text{ with } H_j = 1$$

5. **Non-negativity and Integrality**:
   $$x_{ij} \ge 0, \quad u_i \ge 0 \quad \forall i \in I, j \in J$$

---

## 3. Google OR-Tools Architecture & Solver Performance

### 3.1 Implementation Structure
- **Solver Engine (`backend/ai/or/solver.py`)**: Standalone Python CLI solver using Google OR-Tools `pywraplp`.
  - Primary Solver: `SCIP` (Solving Constraint Integer Programs) mixed-integer programming solver.
  - Fallback Solver: `GLOP` (Google's linear programming solver) if continuous relaxation is requested.
  - Stdin/Stdout JSON protocol: Decoupled IPC passing inputs and returning solution vectors with zero disk footprint.
- **Orchestration Service (`backend/src/or/orSolverService.ts`)**:
  - Validates and gathers inputs from Phase 7 site assessments and demand nodes.
  - Spawns Python solver process with timeout protection (30-second watchdog).
  - Validates solver exit code and response schema.
  - Synthesizes deterministic structured explanations for all allocations and exclusions.
  - Persists all entities inside an atomic PostgreSQL transaction.

### 3.2 Computational Performance
On the standard Chamoli benchmark instance (5 demand nodes, 6 candidate sites, 30 potential corridors):
- Variables: 35 (30 transit variables + 5 unmet variables)
- Constraints: 42 (5 demand conservation + 6 capacity + 30 route gating + 1 hazard exclusion)
- Solver Wall Time: **22–45 ms**
- Solution Status: **SCIP reported OPTIMAL for the benchmark instance**
- Optimality Gap: $0.00\%$ for this benchmark instance

---

## 4. Benchmark Optimization Results

### 4.1 Scenario Input Parameters
- Total Displacement Demand: **15,450 souls** across 5 Chamoli planning sectors (`SIMULATED_BENCHMARK`):
  - Joshimath Core Urban: 4,500 souls ($P = 0.7109$, immediate)
  - Raini Upper Habitation: 2,200 souls ($P = 0.7109$, immediate)
  - Tapovan Valley Settlement: 3,150 souls ($P = 0.7109$, immediate)
  - Helang Sector: 2,800 souls ($P = 0.7109$, immediate)
  - Pandukeshwar Rural: 2,800 souls ($P = 0.7109$, immediate)
- Total Usable Capacity After Hazard Exclusion: **37,300 souls** across 5 safe sites (Pipalkoti excluded).

### 4.2 Allocation Matrix

*Note: Distances, corridor risks, and transit costs are simulated heuristic planning parameters:*

| Demand Node | Displaced | Allocated To | Assigned Souls | Distance (Heuristic) | Corridor Risk | Transit Cost ($c_{ij}$) | Unmet |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **Joshimath Core** | 4,500 | Gauchar Airstrip (SITE-001) | 4,500 | 42.5 km | Low (0.15) | 52.06 | 0 |
| **Raini Upper** | 2,200 | Karnaprayag Poly (SITE-002) | 2,200 | 54.0 km | Low (0.18) | 68.58 | 0 |
| **Tapovan Valley** | 3,150 | Rudraprayag Hub (SITE-003) | 3,150 | 68.0 km | Med (0.22) | 90.44 | 0 |
| **Helang Sector** | 2,800 | Srinagar ITI (SITE-004) | 2,800 | 85.0 km | Low (0.12) | 100.30 | 0 |
| **Pandukeshwar** | 2,800 | Srinagar ITI (SITE-004) | 2,800 | 88.0 km | Low (0.14) | 106.48 | 0 |
| **Pipalkoti Alpha**| — | *EXCLUDED (Active Riverbed)* | **0** | — | High (0.95) | $\infty$ | — |
| **TOTAL** | **15,450** | — | **15,450** | — | — | — | **0** |

**Summary Metrics**:
- Overall Demand Satisfaction: **100.0%** (15,450 / 15,450)
- Unmet Population: **0 souls**
- Safe System Capacity Reserve: **21,850 souls** (58.6% reserve margin)
- Pipalkoti Safe Hub Alpha Allocation: **0 souls** (100% compliance with GIS hard hazard exclusion rule)

---

## 5. Deterministic Structured Explanation Synthesis

To provide auditable and explainable decision records, Phase 8 synthesizes deterministic explanations without non-deterministic LLM text generation:

### 5.1 Category-Tagged Factor Framework
Every decision factor is tagged with one of three official categories:

1. **`PRIORITY`**:
   - Factor: `HIGH_PRIORITY_DEMAND`
   - Weight: `0.7109` (RPW)
   - Impact: `PREFERENTIAL_ALLOCATION`
   - Justification: `"Displacement demand from Chamoli District has an AI Priority Score of 0.7109 (Immediate Tier). Solver prioritized immediate allocation over distant staging."`
   - *Audit Note*: In this benchmark instance, all 5 Chamoli demand nodes share this score; differentiation between tiers is structurally formulated but not empirically demonstrated in this single-district run.

2. **`HAZARD_SAFETY`**:
   - Factor: `HARD_HAZARD_EXCLUSION`
   - Weight: `1.0000`
   - Impact: `ZERO_ALLOCATION_ENFORCED`
   - Justification: `"Pipalkoti Safe Hub Alpha intersects an active riverbed/flood hazard polygon. Decision-support model enforces zero usable capacity after hazard exclusion."`

3. **`CAPACITY_LIMIT`**:
   - Factor: `RESOURCE_BOTTLENECK`
   - Weight: `0.9091`
   - Impact: `CAPACITY_RESTRICTED`
   - Justification: `"Destination hub capacity is bounded by simulated benchmark infrastructure parameters (SIMULATED_BENCHMARK)."`

---

## 6. PostgreSQL Database Persistence & Schema

Phase 8 persists results across six relational tables with complete auditability:

```mermaid
erDiagram
    allocation_results ||--o{ allocation_items : "contains"
    allocation_results ||--o{ constraint_results : "evaluates"
    allocation_results ||--o{ allocation_explanations : "justifies"
    allocation_explanations ||--o{ allocation_explanation_factors : "details"
    relocation_sites ||--o{ site_capacities : "assesses"
    relocation_sites ||--o{ allocation_items : "receives"
    habitations ||--o{ allocation_items : "transfers"
```

1. **`allocation_results`**: Records run ID, solver name (`OR-Tools SCIP`), version, solve time (ms), total allocated, total unmet, total cost, objective value, status (`OPTIMAL`), and provenance (`SIMULATED_BENCHMARK`).
2. **`allocation_items`**: Records individual node-site allocation vectors ($x_{ij}$), demand ($D_i$), unmet ($u_i$), priority weight ($P_i$), distance, travel time, and estimated transit cost (`SIMULATED`).
3. **`constraint_results`**: Records mathematical constraint evaluation (type: `capacity`, `demand`, `route`, `hazard`, status: `satisfied`).
4. **`allocation_explanations`**: Records narrative justification dossiers per habitation and scenario.
5. **`allocation_explanation_factors`**: Records categorized factor breakdowns (`PRIORITY`, `HAZARD_SAFETY`, `CAPACITY_LIMIT`).
6. **`site_capacities`**: Transactionally updates `current_occupancy`, `available_capacity`, and `utilization_percent` upon run completion.

---

## 7. REST API Specifications

Canonical endpoints under `/api/v1/optimization/*`:
- **`POST /api/v1/optimization/run`**: Triggers execution of the OR-Tools SCIP solver, validates constraints, synthesizes explanations, and persists results. Supports optional scenario override parameters.
- **`GET /api/v1/optimization/runs/latest`**: Returns the most recent optimization run, including summary metrics, allocations, constraints, and structured explanations.
- **`GET /api/v1/optimization/runs`**: Returns paginated history of all optimization runs.
- **`GET /api/v1/optimization/runs/:runId`**: Returns detailed breakdown for a specific historical optimization run.
- **`GET /api/v1/optimization/allocations`**: Returns all individual allocation items for the latest run.
- **`GET /api/v1/optimization/explanations`**: Returns structured explanation dossiers with categorized factors.
- **`GET /api/v1/optimization/constraints`**: Returns mathematical constraint satisfaction audit records.

Compatibility endpoints under `/api/v1/allocations/*`:
- Adapts Phase 8 solver outputs to legacy frontend consumers (`GET /api/v1/allocations/summary`, `GET /api/v1/allocations/routes`, `GET /api/v1/allocations/explanations`).

---

## 8. Verification & Test Coverage

Phase 8 implementation is validated by an automated test suite in `backend/test/optimization.test.ts` (40/40 tests passing):
- Python OR-Tools solver execution and SCIP integration: **PASS**
- Demand conservation constraint satisfaction: **PASS**
- Usable capacity bound compliance: **PASS**
- Hard hazard exclusion zero-capacity enforcement ($x_{i,\text{Pipalkoti}} = 0$): **PASS**
- Route passability gating: **PASS**
- RPW priority weight penalty scaling: **PASS**
- Deterministic explanation generation and factor tagging: **PASS**
- PostgreSQL transactional persistence & rollback integrity: **PASS**
- REST API endpoint response structures and status codes: **PASS**
- Legacy `/api/v1/allocations/*` compatibility: **PASS**

*Report Maintained by: VISTHAAPAN Verification Team*
