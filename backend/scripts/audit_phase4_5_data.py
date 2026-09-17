"""
Comprehensive Data Audit for Phase 4.5 Datasets:
1. District Master: 37231365-78ba-44d5-ac22-3deec40b9197.csv
2. Census 2011: 2011-IndiaStateDistSbDistTwn-0000.xlsx
3. Hospital Directory: hospital_directory.csv
"""

import csv
import json
import os
import openpyxl
from collections import Counter

def audit_district_master(path):
    print("========================================")
    print("AUDITING DATASET A: DISTRICT MASTER")
    print("========================================")
    with open(path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        header = [c.strip() for c in next(reader)]
        print(f"Columns ({len(header)}): {header}")
        
        rows = []
        states = set()
        districts = set()
        dist_code_nulls = 0
        census_code_nulls = 0
        duplicate_dist_codes = Counter()
        
        for row in reader:
            if not any(row): continue
            rows.append(row)
            d = dict(zip(header, row))
            states.add(d.get("state_name_english", "").strip())
            districts.add(d.get("district_name_english", "").strip())
            
            d_code = d.get("district_code", "").strip()
            c_code = d.get("district_census2011_code", "").strip()
            
            if not d_code: dist_code_nulls += 1
            if not c_code or c_code == "0": census_code_nulls += 1
            duplicate_dist_codes[d_code] += 1
            
    print(f"Total rows: {len(rows)}")
    print(f"Unique states: {len(states)}")
    print(f"Unique district names: {len(districts)}")
    print(f"Missing district_code: {dist_code_nulls}")
    print(f"Missing district_census2011_code: {census_code_nulls}")
    dups = [k for k, v in duplicate_dist_codes.items() if v > 1]
    print(f"Duplicate district_code count: {len(dups)}")
    for r in rows[:3]:
        # print only ASCII keys to avoid cp1252 crash
        d = dict(zip(header, r))
        print(f"  District: {d.get('district_name_english')} | State: {d.get('state_name_english')} | DistCode: {d.get('district_code')} | CensusCode: {d.get('district_census2011_code')}")
    return {
        "rows": len(rows),
        "states": len(states),
        "districts": len(districts),
        "census_code_nulls": census_code_nulls
    }

def audit_census_workbook(path):
    print("\n========================================")
    print("AUDITING DATASET B: CENSUS 2011 WORKBOOK")
    print("========================================")
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = wb.active
    print(f"Sheet Name: {sheet.title}")
    
    # Read header row
    rows_iter = sheet.iter_rows(values_only=True)
    header = next(rows_iter)
    print(f"Total columns: {len(header)}")
    print(f"Header fields (first 25): {list(header)[:25]}")
    
    total_rows = 0
    level_counter = Counter()
    tru_counter = Counter()
    district_total_records = []
    
    for row in rows_iter:
        if not any(row): continue
        total_rows += 1
        d = dict(zip(header, row))
        level = str(d.get("Level", "")).strip().upper()
        tru = str(d.get("TRU", "")).strip().upper()
        
        level_counter[level] += 1
        tru_counter[tru] += 1
        
        if level == "DISTRICT" and tru == "TOTAL":
            district_total_records.append(d)
            
    print(f"Total rows in sheet: {total_rows}")
    print(f"Level breakdown: {dict(level_counter)}")
    print(f"TRU breakdown: {dict(tru_counter)}")
    print(f"Distinct DISTRICT + TOTAL records: {len(district_total_records)}")
    
    if district_total_records:
        sample = district_total_records[0]
        print("\nSample District + Total record keys:")
        # Look for population fields
        pop_keys = [k for k in sample.keys() if k and any(w in str(k).upper() for w in ["TOT_P", "TOT_M", "TOT_F", "P_06", "P_SC", "P_ST", "P_LIT", "WORK", "NAME", "DISTRICT", "STATE"])]
        print(f"Key population columns found ({len(pop_keys)}): {pop_keys}")
        print("Sample row values for key columns:")
        for pk in pop_keys[:15]:
            print(f"  {pk}: {sample[pk]}")

    wb.close()
    return {
        "total_rows": total_rows,
        "district_total_records": len(district_total_records)
    }

def audit_hospital_directory(path):
    print("\n========================================")
    print("AUDITING DATASET C: HOSPITAL DIRECTORY")
    print("========================================")
    with open(path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        header = [c.strip() for c in next(reader)]
        print(f"Columns ({len(header)}): {header}")
        
        total_records = 0
        valid_coords = 0
        missing_coords = 0
        invalid_coords = 0
        
        states = set()
        districts = set()
        
        # Bed fields analysis
        bed_col = next((c for c in header if "num_beds" in c.lower() or "total_num_beds" in c.lower() or "beds" in c.lower()), None)
        print(f"Identified Bed Column: {bed_col}")
        
        bed_values = []
        suspicious_bed_count = 0
        valid_positive_beds = 0
        zero_beds = 0
        null_beds = 0
        
        # Emergency and Ambulance fields
        emerg_col = next((c for c in header if "emergency" in c.lower()), None)
        amb_col = next((c for c in header if "ambulance" in c.lower()), None)
        type_col = next((c for c in header if "hospital_type" in c.lower() or "type" in c.lower() or "category" in c.lower()), None)
        print(f"Emergency column: {emerg_col}, Ambulance column: {amb_col}, Type column: {type_col}")
        
        emergency_counts = Counter()
        ambulance_counts = Counter()
        hospital_type_counts = Counter()
        
        for row in reader:
            if not any(row): continue
            total_records += 1
            d = dict(zip(header, row))
            
            st = d.get("State", d.get("State_Name", "")).strip()
            dist = d.get("District", d.get("District_Name", "")).strip()
            states.add(st)
            districts.add(f"{st}::{dist}")
            
            lat_str = d.get("Latitude", d.get("latitude", "")).strip()
            lon_str = d.get("Longitude", d.get("longitude", "")).strip()
            
            if not lat_str or not lon_str:
                missing_coords += 1
            else:
                try:
                    lat = float(lat_str)
                    lon = float(lon_str)
                    if -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0 and (lat != 0.0 or lon != 0.0):
                        valid_coords += 1
                    else:
                        invalid_coords += 1
                except ValueError:
                    invalid_coords += 1
                    
            if bed_col:
                b_raw = d.get(bed_col, "").strip()
                if not b_raw:
                    null_beds += 1
                else:
                    try:
                        b_val = float(b_raw)
                        if b_val == 0:
                            zero_beds += 1
                        elif b_val > 5000: # Suspicious for single hospital
                            suspicious_bed_count += 1
                            if b_val > 100000:
                                bed_values.append(b_val)
                        else:
                            valid_positive_beds += 1
                    except ValueError:
                        null_beds += 1
                        
            if emerg_col:
                emergency_counts[d.get(emerg_col, "").strip()] += 1
            if amb_col:
                ambulance_counts[d.get(amb_col, "").strip()] += 1
            if type_col:
                hospital_type_counts[d.get(type_col, "").strip()] += 1

    print(f"Total hospital records: {total_records}")
    print(f"Unique states: {len(states)}")
    print(f"Unique State-District pairs: {len(districts)}")
    print(f"Coordinates - Valid: {valid_coords} ({valid_coords/total_records*100:.1f}%), Missing: {missing_coords}, Invalid/Zero: {invalid_coords}")
    print(f"Beds Analysis: Valid normal (1-5000): {valid_positive_beds}, Explicit Zero: {zero_beds}, Null/Missing: {null_beds}, Suspicious (>5000): {suspicious_bed_count}")
    if bed_values:
        print(f"Extreme corrupted bed values (>100k) sample: {sorted(bed_values, reverse=True)[:5]}")
    print(f"Emergency service top values: {emergency_counts.most_common(5)}")
    print(f"Ambulance availability top values: {ambulance_counts.most_common(5)}")
    print(f"Hospital types top values: {hospital_type_counts.most_common(8)}")
    
    return {
        "total_records": total_records,
        "valid_coords": valid_coords,
        "suspicious_bed_count": suspicious_bed_count
    }

if __name__ == "__main__":
    audit_district_master("backend/data/37231365-78ba-44d5-ac22-3deec40b9197.csv")
    audit_census_workbook("backend/data/2011-IndiaStateDistSbDistTwn-0000.xlsx")
    audit_hospital_directory("backend/data/hospital_directory.csv")
