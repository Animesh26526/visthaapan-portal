"""
Census 2011 District-Total Extractor.
Extracts strictly Level == 'DISTRICT' and TRU == 'TOTAL' from 2011-IndiaStateDistSbDistTwn-0000.xlsx.
Generates backend/data/census_2011_district_total.csv with key demographic fields.
"""

import csv
import os
import openpyxl

def extract_census_district_total():
    xlsx_path = os.path.abspath("backend/data/2011-IndiaStateDistSbDistTwn-0000.xlsx")
    csv_out = os.path.abspath("backend/data/census_2011_district_total.csv")
    
    if not os.path.exists(xlsx_path):
        raise FileNotFoundError(f"Source Census workbook not found: {xlsx_path}")
        
    print(f"Loading {xlsx_path}...")
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    sheet = wb.active
    
    rows_iter = sheet.iter_rows(values_only=True)
    header = [str(c).strip() if c is not None else "" for c in next(rows_iter)]
    
    target_columns = [
        "State", "District", "Name", "TRU", "Level", "No_HH",
        "TOT_P", "TOT_M", "TOT_F",
        "P_06", "M_06", "F_06",
        "P_SC", "M_SC", "F_SC",
        "P_ST", "M_ST", "F_ST",
        "P_LIT", "M_LIT", "F_LIT",
        "TOT_WORK_P", "TOT_WORK_M", "TOT_WORK_F",
        "MAINWORK_P", "MAINWORK_M", "MAINWORK_F",
        "MARGWORK_P", "MARGWORK_M", "MARGWORK_F",
        "NON_WORK_P", "NON_WORK_M", "NON_WORK_F"
    ]
    
    # Map column indices
    col_indices = {}
    for tc in target_columns:
        if tc in header:
            col_indices[tc] = header.index(tc)
        else:
            print(f"Warning: column {tc} not found in header")
            
    extracted_rows = []
    level_idx = header.index("Level")
    tru_idx = header.index("TRU")
    
    for row in rows_iter:
        if not any(row): continue
        lvl = str(row[level_idx]).strip().upper() if row[level_idx] else ""
        tru = str(row[tru_idx]).strip().upper() if row[tru_idx] else ""
        
        if lvl == "DISTRICT" and tru == "TOTAL":
            extracted_row = []
            for tc in target_columns:
                idx = col_indices.get(tc)
                val = row[idx] if idx is not None else ""
                extracted_row.append(val if val is not None else "")
            extracted_rows.append(extracted_row)
            
    wb.close()
    print(f"Extracted {len(extracted_rows)} DISTRICT + TOTAL rows.")
    
    with open(csv_out, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(target_columns)
        writer.writerows(extracted_rows)
        
    print(f"Saved clean staging dataset to: {csv_out}")

if __name__ == "__main__":
    extract_census_district_total()
