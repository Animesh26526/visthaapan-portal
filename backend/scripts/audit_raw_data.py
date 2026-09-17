"""
Data Audit Script for VISTHAAPAN Portal Phase 4.
Audits backend/data/disaster-report (3).csv and writes backend/docs/data_audit.md.
"""

import csv
import json
import os
import re
from collections import Counter, defaultdict

def run_audit(csv_path: str, output_md_path: str, output_json_path: str):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Input file not found: {csv_path}")

    file_size_bytes = os.path.getsize(csv_path)

    with open(csv_path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        try:
            raw_header = next(reader)
        except StopIteration:
            raise ValueError("CSV is empty")

        # Strip any trailing/leading whitespace and BOM
        header = [col.strip().lstrip("\ufeff") for col in raw_header]
        num_cols = len(header)

        total_rows = 0
        malformed_rows = 0
        exact_duplicate_rows = 0
        row_hashes = set()

        # Stats accumulators
        empty_counts = {col: 0 for col in header}
        zero_counts = {col: 0 for col in header}
        non_zero_numeric_counts = {col: 0 for col in header}
        non_numeric_counts = {col: 0 for col in header}
        column_types = {}

        states_counter = Counter()
        districts_counter = Counter()
        disasters_counter = Counter()
        dates_list = []
        state_district_pairs = set()

        # Check composite key: (State, Date, District Affected, Name of Disaster)
        composite_keys = Counter()

        for line_num, row in enumerate(reader, start=2):
            total_rows += 1
            if len(row) != num_cols:
                malformed_rows += 1
                continue

            row_tuple = tuple(row)
            if row_tuple in row_hashes:
                exact_duplicate_rows += 1
            else:
                row_hashes.add(row_tuple)

            state = row[0].strip()
            date_val = row[1].strip()
            district = row[2].strip()
            disaster = row[3].strip()

            states_counter[state] += 1
            districts_counter[district] += 1
            disasters_counter[disaster] += 1
            if date_val:
                dates_list.append(date_val)
            if state and district:
                state_district_pairs.add((state, district))

            comp_key = (state, date_val, district, disaster)
            composite_keys[comp_key] += 1

            for idx, col in enumerate(header):
                val = row[idx].strip()
                if val == "" or val.lower() in ("null", "na", "n/a", "none"):
                    empty_counts[col] += 1
                else:
                    # Check if numeric
                    try:
                        fval = float(val)
                        if fval == 0.0:
                            zero_counts[col] += 1
                        else:
                            non_zero_numeric_counts[col] += 1
                    except ValueError:
                        non_numeric_counts[col] += 1

    # Infer column types
    for col in header:
        if non_numeric_counts[col] == 0 and (zero_counts[col] + non_zero_numeric_counts[col] > 0):
            # purely numeric
            if col.startswith("Crop"):
                column_types[col] = "NUMERIC(12,2)"
            else:
                column_types[col] = "INTEGER"
        elif col in ("Date",):
            column_types[col] = "DATE (YYYY-MM-DD)"
        else:
            column_types[col] = "VARCHAR / TEXT"

    min_date = min(dates_list) if dates_list else "N/A"
    max_date = max(dates_list) if dates_list else "N/A"
    composite_duplicates = sum(count - 1 for count in composite_keys.values() if count > 1)

    # Breakdown of events: "No Event" vs Real Hazard Events
    no_event_count = disasters_counter.get("No Event", 0)
    real_event_count = total_rows - no_event_count

    audit_summary = {
        "filename": os.path.basename(csv_path),
        "file_size_bytes": file_size_bytes,
        "total_rows": total_rows,
        "total_columns": num_cols,
        "columns": header,
        "column_types": column_types,
        "malformed_rows": malformed_rows,
        "exact_duplicate_rows": exact_duplicate_rows,
        "composite_key_duplicate_rows": composite_duplicates,
        "min_date": min_date,
        "max_date": max_date,
        "unique_states": len(states_counter),
        "unique_districts": len(districts_counter),
        "unique_state_district_pairs": len(state_district_pairs),
        "unique_disasters": len(disasters_counter),
        "no_event_rows": no_event_count,
        "active_hazard_rows": real_event_count,
        "top_disasters": disasters_counter.most_common(30),
        "top_states": states_counter.most_common(15),
        "empty_counts": empty_counts,
        "zero_counts": zero_counts,
        "non_zero_numeric_counts": non_zero_numeric_counts,
        "non_numeric_counts": non_numeric_counts,
    }

    # Write JSON report
    with open(output_json_path, "w", encoding="utf-8") as jf:
        json.dump(audit_summary, jf, indent=2)

    # Write Markdown report
    os.makedirs(os.path.dirname(output_md_path), exist_ok=True)
    with open(output_md_path, "w", encoding="utf-8") as mf:
        mf.write("# VISTHAAPAN Phase 4 Data Audit Report\n\n")
        mf.write("## 1. Executive Summary\n\n")
        mf.write(f"- **Source Dataset**: `{os.path.basename(csv_path)}`\n")
        mf.write(f"- **File Size**: {file_size_bytes:,} bytes ({file_size_bytes / (1024*1024):.2f} MB)\n")
        mf.write(f"- **Total Rows**: {total_rows:,}\n")
        mf.write(f"- **Total Columns**: {num_cols}\n")
        mf.write(f"- **Date Range**: `{min_date}` to `{max_date}`\n")
        mf.write(f"- **Unique States**: {len(states_counter)}\n")
        mf.write(f"- **Unique Districts**: {len(districts_counter)}\n")
        mf.write(f"- **Unique State-District Pairs**: {len(state_district_pairs)}\n")
        mf.write(f"- **Distinct Disaster Labels**: {len(disasters_counter)}\n")
        mf.write(f"- **'No Event' Surveillance Rows**: {no_event_count:,} ({no_event_count / total_rows * 100:.2f}%)\n")
        mf.write(f"- **Active Disaster Impact Rows**: {real_event_count:,} ({real_event_count / total_rows * 100:.2f}%)\n")
        mf.write(f"- **Exact Duplicates**: {exact_duplicate_rows:,}\n")
        mf.write(f"- **Composite Key `(State, Date, District, Disaster)` Duplicates**: {composite_duplicates:,}\n\n")

        mf.write("## 2. Column Schema, Physical Types, & Missingness\n\n")
        mf.write("| # | Column Name | Inferred DB Type | Empty / Null Count | Empty % | Explicit 0 Count | Non-Zero Count | Semantic Classification |\n")
        mf.write("|---|---|---|---|---|---|---|---|\n")

        for idx, col in enumerate(header):
            emp = empty_counts[col]
            emp_pct = (emp / total_rows) * 100
            zer = zero_counts[col]
            nz = non_zero_numeric_counts[col]
            inferred = column_types[col]

            # Classification
            if col in ("State", "District Affected"):
                sem = "Administrative Geography (District level)"
            elif col == "Date":
                sem = "Temporal Observation Date"
            elif col == "Name of Disaster":
                sem = "Raw Hazard Taxonomy"
            elif "Death" in col or col in ("Injured", "Missing"):
                sem = "Post-Event Casualty Outcome (Impact)"
            elif "Damaged" in col or "Crop" in col or "Animal" in col or col == "Infrastructure Affected":
                sem = "Post-Event Physical/Asset Damage (Impact)"
            elif col in ("Persons Evacuated", "Relief Camps in Operation", "People in Relief Camps"):
                sem = "Post-Event Operational Response (Impact)"
            elif col in ("No. of Villages Affected", "Population Affected"):
                sem = "Aggregate Exposure Metric"
            else:
                sem = "Indicator"

            mf.write(f"| {idx+1} | `{col}` | `{inferred}` | {emp:,} | {emp_pct:.2f}% | {zer:,} | {nz:,} | {sem} |\n")

        mf.write("\n## 3. Disaster Taxonomy Breakdown (Raw vs Normalized Candidates)\n\n")
        mf.write("| Raw Disaster Label | Frequency | Percentage | Normalized Hazard Candidate |\n")
        mf.write("|---|---|---|---|\n")
        for dis, cnt in disasters_counter.most_common(50):
            pct = (cnt / total_rows) * 100
            # quick mapping rule
            lower_dis = dis.lower()
            if dis == "No Event":
                norm = "*Filtered out (Surveillance / Quiescence record)*"
            elif "flash flood" in lower_dis:
                norm = "Flash Flood"
            elif "flood" in lower_dis:
                norm = "Flood"
            elif "landslide" in lower_dis:
                norm = "Landslide"
            elif "cloudburst" in lower_dis or "cloud burst" in lower_dis:
                norm = "Cloudburst"
            elif "cyclone" in lower_dis:
                norm = "Cyclone"
            elif "heavy rain" in lower_dis:
                norm = "Heavy Rain"
            elif "lightning" in lower_dis:
                norm = "Lightning"
            elif "drought" in lower_dis:
                norm = "Drought"
            elif "avalanche" in lower_dis:
                norm = "Avalanche"
            elif "earthquake" in lower_dis:
                norm = "Earthquake"
            elif "fire" in lower_dis:
                norm = "Fire"
            else:
                norm = "Other / Uncategorized"
            mf.write(f"| `{dis}` | {cnt:,} | {pct:.2f}% | **{norm}** |\n")

        mf.write("\n## 4. State-Wise Coverage & Active Event Distribution\n\n")
        mf.write("| State | Total Records | Surveillance Records | Active Disaster Events |\n")
        mf.write("|---|---|---|---|\n")
        for st, cnt in states_counter.most_common(40):
            # calculate active for this state
            pass # we can expand this in the script

    print(f"Audit completed successfully.")
    print(f"JSON written to: {output_json_path}")
    print(f"Markdown written to: {output_md_path}")

if __name__ == "__main__":
    csv_in = os.path.abspath("backend/data/disaster-report (3).csv")
    md_out = os.path.abspath("backend/docs/data_audit.md")
    json_out = os.path.abspath("backend/docs/data_audit.json")
    run_audit(csv_in, md_out, json_out)
