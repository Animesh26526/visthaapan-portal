#!/usr/bin/env python3
"""
VISTHAAPAN Phase 8: Operations Research Allocation & Transit Optimization Engine
Powered by Google OR-Tools (SCIP / GLOP Linear Programming Solver)

Formulation:
  Decision Variables:
    x_{i,j} >= 0 : Population allocated from Demand Node i to Candidate Relocation Site j
    u_i     >= 0 : Unmet relocation demand at Node i

  Parameters:
    D_i     : Relocation demand population at Node i
    P_i     : Relocation Priority Weight (RPW) at Node i in [0, 1]
    C_j     : Phase 7 Effective Safe Capacity at Site j
    c_{i,j} : Heuristic transit route distance (km) from Node i to Site j
    E_j     : Boolean hard hazard exclusion flag (True if Site j intersects Red Zone)
    F_{i,j} : Boolean route feasibility flag

  Constraints:
    1. Demand Conservation:
       sum_j x_{i,j} + u_i = D_i   for all i
    2. Site Safe Capacity Limit:
       sum_i x_{i,j} <= C_j        for all j with E_j = False
    3. Hard Hazard Exclusion:
       x_{i,j} = 0                 for all i, for all j with E_j = True
    4. Route Feasibility:
       x_{i,j} = 0                 for all (i,j) with F_{i,j} = False or blocked
    5. Non-negativity & Integer:
       x_{i,j} in Z_{>= 0},  u_i in Z_{>= 0}

  Objective Function:
    Minimize Z = sum_{i,j} (c_{i,j} * x_{i,j}) + sum_i (W_i * u_i)
    where W_i = M_0 * (1.0 + 5.0 * P_i) is the high-priority unmet penalty weight.
"""

import sys
import json
import time
from ortools.linear_solver import pywraplp

def solve_allocation(payload: dict) -> dict:
    start_time = time.time()

    demand_nodes = payload.get("demand_nodes", [])
    candidate_sites = payload.get("candidate_sites", [])
    routes = payload.get("routes", [])
    params = payload.get("parameters", {})

    allow_partial = params.get("allow_partial_allocation", True)
    max_distance_km = params.get("max_distance_km")
    blocked_route_ids = set(params.get("blocked_route_ids", []))
    capacity_overrides = params.get("capacity_overrides", {})

    # Create map of route (from_node_id, to_site_id) -> route info
    route_map = {}
    for r in routes:
        key = (r["from_node_id"], r["to_site_id"])
        route_map[key] = r

    # Create the solver
    solver = pywraplp.Solver.CreateSolver("SCIP")
    if not solver:
        # Fallback to GLOP LP solver if SCIP not compiled
        solver = pywraplp.Solver.CreateSolver("GLOP")
        if not solver:
            return {
                "status": "ERROR",
                "message": "Google OR-Tools solver could not be initialized (SCIP/GLOP unavailable).",
                "solve_time_ms": int((time.time() - start_time) * 1000)
            }

    # Decision variables
    # x[i, j]: population from demand node i to site j
    x = {}
    # u[i]: unmet demand at node i
    u = {}

    for i, node in enumerate(demand_nodes):
        node_id = node["demand_node_id"]
        demand_pop = int(node["demand"])
        u[node_id] = solver.IntVar(0, demand_pop, f"u_{node_id}")

        for j, site in enumerate(candidate_sites):
            site_id = site["id"]
            site_cap = int(capacity_overrides.get(site_id, site.get("effective_capacity", 0)))
            var_name = f"x_{node_id}_{site_id}"

            # If site is hard-excluded by hazard, upper bound is 0
            if site.get("hard_hazard_exclusion", False):
                x[(node_id, site_id)] = solver.IntVar(0, 0, var_name)
            else:
                x[(node_id, site_id)] = solver.IntVar(0, min(demand_pop, site_cap), var_name)

    # 1. Demand Conservation Constraints: sum_j x[i, j] + u[i] = D_i
    for node in demand_nodes:
        node_id = node["demand_node_id"]
        demand_pop = int(node["demand"])
        constraint = solver.Constraint(demand_pop, demand_pop, f"demand_balance_{node_id}")
        constraint.SetCoefficient(u[node_id], 1.0)
        for site in candidate_sites:
            site_id = site["id"]
            constraint.SetCoefficient(x[(node_id, site_id)], 1.0)

    # 2. Site Capacity Constraints: sum_i x[i, j] <= C_j
    site_cap_constraints = {}
    for site in candidate_sites:
        site_id = site["id"]
        if site.get("hard_hazard_exclusion", False):
            effective_cap = 0
        else:
            effective_cap = int(capacity_overrides.get(site_id, site.get("effective_capacity", 0)))

        constraint = solver.Constraint(0, effective_cap, f"cap_limit_{site_id}")
        for node in demand_nodes:
            node_id = node["demand_node_id"]
            constraint.SetCoefficient(x[(node_id, site_id)], 1.0)
        site_cap_constraints[site_id] = (constraint, effective_cap)

    # 3. Route Feasibility Constraints: x[i, j] = 0 if route blocked/infeasible
    for node in demand_nodes:
        node_id = node["demand_node_id"]
        for site in candidate_sites:
            site_id = site["id"]
            r_info = route_map.get((node_id, site_id))

            is_blocked = False
            if r_info:
                if r_info.get("id") in blocked_route_ids:
                    is_blocked = True
                if not r_info.get("feasible", True):
                    is_blocked = True
                if r_info.get("blocked", False):
                    is_blocked = True
                if max_distance_km is not None and r_info.get("distance_km", 0) > max_distance_km:
                    is_blocked = True
            else:
                is_blocked = True  # No route defined

            if is_blocked:
                # Force x to 0
                constraint = solver.Constraint(0, 0, f"route_infeasible_{node_id}_{site_id}")
                constraint.SetCoefficient(x[(node_id, site_id)], 1.0)

    # 4. Partial allocation restriction if allow_partial is False
    if not allow_partial:
        # Require all unmet demand to be zero
        for node in demand_nodes:
            node_id = node["demand_node_id"]
            u[node_id].SetBounds(0, 0)

    # Objective Function
    # Minimize Z = sum (c_{i,j} * x_{i,j}) + sum (W_i * u_i)
    objective = solver.Objective()
    objective.SetMinimization()

    BASE_UNMET_PENALTY = 2000.0  # Dominates transit distance (max distance ~220km)

    for node in demand_nodes:
        node_id = node["demand_node_id"]
        rpw = float(node.get("priority_weight", 0.5))
        # High RPW (e.g. 0.76) gets higher penalty weight: 2000 * (1 + 5 * 0.76) = 9600
        unmet_weight = BASE_UNMET_PENALTY * (1.0 + 5.0 * rpw)
        objective.SetCoefficient(u[node_id], unmet_weight)

        for site in candidate_sites:
            site_id = site["id"]
            r_info = route_map.get((node_id, site_id))
            dist = float(r_info.get("distance_km", 100.0)) if r_info else 100.0
            objective.SetCoefficient(x[(node_id, site_id)], dist)

    # Solve the problem
    solver_result = solver.Solve()

    solve_time_ms = int((time.time() - start_time) * 1000)

    status_map = {
        pywraplp.Solver.OPTIMAL: "OPTIMAL",
        pywraplp.Solver.FEASIBLE: "FEASIBLE",
        pywraplp.Solver.INFEASIBLE: "INFEASIBLE",
        pywraplp.Solver.UNBOUNDED: "UNBOUNDED",
        pywraplp.Solver.ABNORMAL: "ERROR",
        pywraplp.Solver.NOT_SOLVED: "NOT_SOLVED",
    }
    solver_status = status_map.get(solver_result, "ERROR")

    if solver_result not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        return {
            "status": solver_status,
            "message": f"OR-Tools solver completed with status {solver_status}.",
            "objective_value": None,
            "total_demand": sum(int(n["demand"]) for n in demand_nodes),
            "total_allocated": 0,
            "total_unmet": sum(int(n["demand"]) for n in demand_nodes),
            "allocations": [],
            "unmet_demand": [],
            "site_utilization": [],
            "constraints_checked": [],
            "solve_time_ms": solve_time_ms,
        }

    # Extract allocations
    allocations = []
    total_allocated = 0
    total_unmet = 0
    total_distance_weighted = 0.0

    site_allocated_counts = {site["id"]: 0 for site in candidate_sites}

    for node in demand_nodes:
        node_id = node["demand_node_id"]
        for site in candidate_sites:
            site_id = site["id"]
            val = int(round(x[(node_id, site_id)].solution_value()))
            if val > 0:
                r_info = route_map.get((node_id, site_id), {})
                dist = float(r_info.get("distance_km", 0))
                time_mins = float(r_info.get("travel_time_minutes", 0))

                allocations.append({
                    "demand_node_id": node_id,
                    "demand_node_name": node.get("name", node_id),
                    "site_id": site_id,
                    "site_name": site.get("name", site_id),
                    "population_allocated": val,
                    "priority_weight": float(node.get("priority_weight", 0.5)),
                    "operational_tier": node.get("operational_tier", "immediate"),
                    "distance_km": dist,
                    "travel_time_minutes": time_mins,
                    "transport_cost": round(dist * val, 2),
                    "route_feasible": True,
                    "data_origin": "SIMULATED",
                })
                total_allocated += val
                site_allocated_counts[site_id] += val
                total_distance_weighted += dist * val

    # Extract unmet demand
    unmet_list = []
    for node in demand_nodes:
        node_id = node["demand_node_id"]
        u_val = int(round(u[node_id].solution_value()))
        total_unmet += u_val
        if u_val > 0:
            unmet_list.append({
                "demand_node_id": node_id,
                "node_name": node.get("name", node_id),
                "unmet_population": u_val,
                "total_demand": int(node["demand"]),
                "priority_weight": float(node.get("priority_weight", 0.5)),
                "operational_tier": node.get("operational_tier", "immediate"),
                "reason": "INSUFFICIENT_SAFE_CAPACITY" if sum(c[1] for c in site_cap_constraints.values()) < sum(int(n["demand"]) for n in demand_nodes) else "TRANSIT_OR_BOTTLENECK_CONSTRAINT",
            })

    # Site utilization
    site_util_list = []
    for site in candidate_sites:
        site_id = site["id"]
        cap = int(capacity_overrides.get(site_id, site.get("effective_capacity", 0)))
        alloc = site_allocated_counts[site_id]
        is_hazard_excluded = site.get("hard_hazard_exclusion", False)

        util_pct = round((alloc / cap * 100), 2) if cap > 0 else 0.0

        site_util_list.append({
            "site_id": site_id,
            "site_name": site.get("name", site_id),
            "effective_capacity": cap,
            "allocated_population": alloc,
            "remaining_capacity": max(0, cap - alloc) if not is_hazard_excluded else 0,
            "utilization_percent": util_pct,
            "bottleneck_dimension": site.get("bottleneck_dimension", "sanitation"),
            "hard_hazard_exclusion": is_hazard_excluded,
            "status": "RESTRICTED_BY_HAZARD" if is_hazard_excluded else ("AT_CAPACITY" if alloc >= cap and cap > 0 else "AVAILABLE"),
        })

    # Constraint audit results
    constraints_audit = []
    # 1. Capacity constraints audit
    for site in candidate_sites:
        site_id = site["id"]
        cap = int(capacity_overrides.get(site_id, site.get("effective_capacity", 0)))
        alloc = site_allocated_counts[site_id]
        is_hazard = site.get("hard_hazard_exclusion", False)
        status = "SATISFIED"
        if alloc > cap:
            status = "VIOLATED"
        elif alloc == cap and cap > 0:
            status = "BINDING"

        constraints_audit.append({
            "type": "HARD_HAZARD_EXCLUSION" if is_hazard else "SITE_CAPACITY",
            "entity_id": site_id,
            "entity_name": site.get("name", site_id),
            "status": "BINDING_EXCLUSION" if is_hazard else status,
            "limit_value": 0 if is_hazard else cap,
            "actual_value": alloc,
            "description": f"Hard hazard exclusion enforced: 0 allocated (limit: 0)" if is_hazard else f"Site capacity limit satisfied: {alloc}/{cap} souls allocated",
        })

    # 2. Demand conservation audit
    for node in demand_nodes:
        node_id = node["demand_node_id"]
        d_val = int(node["demand"])
        alloc_to_node = sum(a["population_allocated"] for a in allocations if a["demand_node_id"] == node_id)
        u_val = next((u_item["unmet_population"] for u_item in unmet_list if u_item["demand_node_id"] == node_id), 0)

        constraints_audit.append({
            "type": "DEMAND_CONSERVATION",
            "entity_id": node_id,
            "entity_name": node.get("name", node_id),
            "status": "SATISFIED" if (alloc_to_node + u_val == d_val) else "VIOLATED",
            "limit_value": d_val,
            "actual_value": alloc_to_node + u_val,
            "description": f"Demand balance satisfied: {alloc_to_node} allocated + {u_val} unmet = {d_val} total demand",
        })

    return {
        "status": solver_status,
        "solver_name": "Google OR-Tools",
        "solver_version": "9.15 (SCIP Linear MIP)",
        "objective_value": round(solver.Objective().Value(), 2),
        "total_demand": sum(int(n["demand"]) for n in demand_nodes),
        "total_allocated": total_allocated,
        "total_unmet": total_unmet,
        "total_transit_distance_km": round(total_distance_weighted, 2),
        "allocations": allocations,
        "unmet_demand": unmet_list,
        "site_utilization": site_util_list,
        "constraints_checked": constraints_audit,
        "solve_time_ms": solve_time_ms,
        "data_origin": "SIMULATED_BENCHMARK",
        "uncertainty_flags": [
            "SIMULATED_BENCHMARK_DEMAND",
            "SIMULATED_BENCHMARK_FACILITIES",
            "HEURISTIC_TRANSIT_SPEED_AND_WINDING_FACTOR",
            "HEALTHCARE_BED_DATA_QUARANTINED",
            "TERRAIN_ELEVATION_UNAVAILABLE",
        ],
    }

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        result = solve_allocation(input_data)
        print(json.dumps(result, indent=2))
    except Exception as e:
        err_res = {
            "status": "ERROR",
            "message": str(e),
            "solve_time_ms": 0,
        }
        print(json.dumps(err_res, indent=2))
        sys.exit(1)
