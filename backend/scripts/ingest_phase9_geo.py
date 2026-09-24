"""
VISTHAAPAN Portal - Phase 9 Data Enrichment Ingestion Pipeline
Official Survey of India (SOI) Boundaries, Census 2011 Settlements & OpenStreetMap Infrastructure

Usage:
  python backend/scripts/ingest_phase9_geo.py
"""

import os
import sys
import json
import time
import struct
import unicodedata

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass
import openpyxl
import shapefile
import pyproj
import psycopg2
from psycopg2.extras import execute_batch

# Database connection configuration
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', '5432'))
DB_NAME = os.environ.get('DB_NAME', 'visthaapan')
DB_USER = os.environ.get('DB_USER', 'visthaapan')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'visthaapan_dev')

DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
SOI_DIR = os.path.join(DATA_DIR, 'soi_extracted/05')
OSM_DIR = os.path.join(DATA_DIR, 'osm_extracted')
TOWN_XLSX = os.path.join(DATA_DIR, 'DH_2011_DCHB_Town_Release_0500.xlsx')
VILLAGE_XLSX = os.path.join(DATA_DIR, 'DH_2011_DCHB_Village_Release_0500.xlsx')


def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )


DISTRICT_NAME_MAP = {
    '056': 'UTTARKASHI',
    '057': 'CHAMOLI',
    '058': 'RUDRAPRAYAG',
    '059': 'TEHRI GARHWAL',
    '060': 'DEHRADUN',
    '061': 'PAURI GARHWAL',
    '062': 'PITHORAGARH',
    '063': 'BAGESHWAR',
    '064': 'ALMORA',
    '065': 'CHAMPAWAT',
    '066': 'NAINITAL',
    '067': 'UDHAM SINGH NAGAR',
    '068': 'HARIDWAR'
}


def normalize_name(name):
    if not name:
        return ''
    # Normalize unicode, remove diacritics, lowercase, strip punctuation
    nfkd = unicodedata.normalize('NFKD', str(name))
    ascii_str = ''.join([c for c in nfkd if not unicodedata.combining(c)])
    cleaned = ''.join([c if c.isalnum() or c.isspace() else ' ' for c in ascii_str.lower()])
    return ' '.join(cleaned.split())


# ============================================================
# 1. INGEST SURVEY OF INDIA (SOI) BOUNDARIES
# ============================================================

def ingest_soi_boundaries(conn):
    print('\n============================================================')
    print('1. INGESTING SURVEY OF INDIA ADMINISTRATIVE BOUNDARIES')
    print('============================================================')
    cur = conn.cursor()

    # Load CRS transformer from LCC to EPSG:4326
    prj_path = os.path.join(SOI_DIR, 'UTTARAKHAND_STATE_BDY.prj')
    with open(prj_path, 'r') as f:
        crs_lcc = pyproj.CRS.from_wkt(f.read())
    crs_4326 = pyproj.CRS.from_epsg(4326)
    transformer = pyproj.Transformer.from_crs(crs_lcc, crs_4326, always_xy=True)

    def reproject_coords(coords):
        if isinstance(coords[0], (int, float)):
            x, y = coords[0], coords[1]
            nx, ny = transformer.transform(x, y)
            return [round(nx, 7), round(ny, 7)]
        return [reproject_coords(c) for c in coords]

    # --- A. State Boundary ---
    print('Processing Uttarakhand State Boundary...')
    state_shp = os.path.join(SOI_DIR, 'UTTARAKHAND_STATE_BDY.shp')
    r_state = shapefile.Reader(state_shp)
    sr_state = r_state.shapeRecord(0)
    geo_state = sr_state.shape.__geo_interface__
    geo_state['coordinates'] = reproject_coords(geo_state['coordinates'])
    if geo_state['type'] == 'Polygon':
        multi_state = {'type': 'MultiPolygon', 'coordinates': [geo_state['coordinates']]}
    else:
        multi_state = geo_state

    rec_state = sr_state.record.as_dict()
    state_code = '05'
    state_name = rec_state.get('STATE', 'UTTARAKHAND').strip()
    shape_len = rec_state.get('Shape_Leng', 0)
    shape_area = rec_state.get('Shape_Area', 0)

    cur.execute('''
        INSERT INTO state_boundaries (state_code, state_name, shape_length, shape_area, geometry, provenance)
        VALUES (%s, %s, %s, %s, ST_Multi(ST_MakeValid(ST_GeomFromGeoJSON(%s))), 'Survey of India (Official)')
        ON CONFLICT (state_code) DO UPDATE SET
            state_name = EXCLUDED.state_name,
            shape_length = EXCLUDED.shape_length,
            shape_area = EXCLUDED.shape_area,
            geometry = EXCLUDED.geometry
        RETURNING id;
    ''', (state_code, state_name, shape_len, shape_area, json.dumps(multi_state)))
    state_id = cur.fetchone()[0]
    print(f'[OK] State boundary ingested (ID: {state_id}, Name: {state_name})')

    # --- B. District Boundaries ---
    print('Processing 13 Uttarakhand District Boundaries...')
    dist_shp = os.path.join(SOI_DIR, 'UTTARAKHAND_DISTRICT_BDY.shp')
    r_dist = shapefile.Reader(dist_shp)
    district_map = {} # dist_lgd -> uuid

    for sr in r_dist.shapeRecords():
        rec = sr.record.as_dict()
        geo = sr.shape.__geo_interface__
        geo['coordinates'] = reproject_coords(geo['coordinates'])
        if geo['type'] == 'Polygon':
            multi_geo = {'type': 'MultiPolygon', 'coordinates': [geo['coordinates']]}
        else:
            multi_geo = geo

        dist_code = str(rec.get('DIST_LGD', '')).strip().zfill(3)
        dist_name = DISTRICT_NAME_MAP.get(dist_code, str(rec.get('DISTRICT', '')).strip().upper())

        d_len = rec.get('Shape_Leng', 0)
        d_area = rec.get('Shape_Area', 0)

        cur.execute('''
            INSERT INTO district_boundaries (state_id, state_code, state_name, district_code, district_name, shape_length, shape_area, geometry, provenance)
            VALUES (%s, %s, %s, %s, %s, %s, %s, ST_Multi(ST_MakeValid(ST_GeomFromGeoJSON(%s))), 'Survey of India (Official)')
            ON CONFLICT (district_code) DO UPDATE SET
                district_name = EXCLUDED.district_name,
                shape_length = EXCLUDED.shape_length,
                shape_area = EXCLUDED.shape_area,
                geometry = EXCLUDED.geometry
            RETURNING id;
        ''', (state_id, state_code, state_name, dist_code, dist_name, d_len, d_area, json.dumps(multi_geo)))
        d_id = cur.fetchone()[0]
        district_map[dist_code] = d_id
        district_map[dist_name] = d_id
        print(f'  [OK] District {dist_code}: {dist_name}')

    # --- C. Subdistrict / Tehsil Boundaries ---
    print('Processing 111 Subdistrict / Tehsil Boundaries...')
    subdist_shp = os.path.join(SOI_DIR, 'UTTARAKHAND_SUBDISTRICT_BDY.shp')
    r_subdist = shapefile.Reader(subdist_shp)
    subdist_count = 0

    for sr in r_subdist.shapeRecords():
        rec = sr.record.as_dict()
        geo = sr.shape.__geo_interface__
        geo['coordinates'] = reproject_coords(geo['coordinates'])
        if geo['type'] == 'Polygon':
            multi_geo = {'type': 'MultiPolygon', 'coordinates': [geo['coordinates']]}
        else:
            multi_geo = geo

        dist_code = str(rec.get('DIST_LGD', '')).strip().zfill(3)
        dist_name = DISTRICT_NAME_MAP.get(dist_code, str(rec.get('DISTRICT', '')).strip().upper())

        subdist_code = str(rec.get('SUBDIS_LGD', '')).strip()
        raw_sd_name = str(rec.get('SUB_DIST', '')).strip().upper()
        # Clean encoding characters e.g. < -> A
        raw_sd_name = raw_sd_name.replace('<', 'A').replace('>', 'A').replace('@', 'U')
        if 'JYOTIRMATH' in raw_sd_name or 'JOSHIMATH' in raw_sd_name:
            subdist_name = 'JYOTIRMATH (JOSHIMATH)'
        else:
            subdist_name = raw_sd_name

        d_id = district_map.get(dist_code)
        sd_len = rec.get('Shape_Leng', 0)
        sd_area = rec.get('Shape_Area', 0)

        cur.execute('''
            INSERT INTO subdistrict_boundaries (district_id, state_code, district_code, district_name, subdistrict_code, subdistrict_name, shape_length, shape_area, geometry, provenance)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, ST_Multi(ST_MakeValid(ST_GeomFromGeoJSON(%s))), 'Survey of India (Official)')
            ON CONFLICT (district_code, subdistrict_code) DO UPDATE SET
                subdistrict_name = EXCLUDED.subdistrict_name,
                district_name = EXCLUDED.district_name,
                shape_length = EXCLUDED.shape_length,
                shape_area = EXCLUDED.shape_area,
                geometry = EXCLUDED.geometry;
        ''', (d_id, state_code, dist_code, dist_name, subdist_code, subdist_name, sd_len, sd_area, json.dumps(multi_geo)))
        subdist_count += 1

    conn.commit()
    print(f'[OK] Ingested {subdist_count} subdistricts into subdistrict_boundaries.')

    # Verification: ST_IsValid & topological containment
    cur.execute('''
        SELECT
            (SELECT COUNT(*) FROM state_boundaries WHERE ST_IsValid(geometry)) AS valid_states,
            (SELECT COUNT(*) FROM district_boundaries WHERE ST_IsValid(geometry)) AS valid_districts,
            (SELECT COUNT(*) FROM subdistrict_boundaries WHERE ST_IsValid(geometry)) AS valid_subdistricts;
    ''')
    res = cur.fetchone()
    print(f'[OK] Geometry Validity Report: States Valid: {res[0]}/1, Districts Valid: {res[1]}/13, Subdistricts Valid: {res[2]}/{subdist_count}')

    cur.execute('''
        SELECT COUNT(*)
        FROM subdistrict_boundaries s
        JOIN district_boundaries d ON s.district_code = d.district_code
        WHERE ST_Intersects(d.geometry, ST_Centroid(s.geometry));
    ''')
    containment_count = cur.fetchone()[0]
    print(f'[OK] Topological Containment: {containment_count}/{subdist_count} subdistrict centroids inside parent district boundary.')


# ============================================================
# 2. INGEST CENSUS 2011 SETTLEMENTS & LINK HABITATIONS
# ============================================================

def build_soi_osm_gazetteer(transformer):
    print('\nBuilding coordinate gazetteer from SOI Towns and OSM places...')
    gazetteer = {} # normalized_name -> (lon, lat)

    # 1. SOI Major Towns
    soi_towns_shp = os.path.join(SOI_DIR, 'UTTARAKHAND_MAJOR_TOWNS.shp')
    if os.path.exists(soi_towns_shp):
        r = shapefile.Reader(soi_towns_shp)
        for sr in r.shapeRecords():
            tname = normalize_name(sr.record.as_dict().get('name_of_to', ''))
            pt = sr.shape.points[0]
            nx, ny = transformer.transform(pt[0], pt[1])
            if tname:
                gazetteer[tname] = (round(nx, 6), round(ny, 6))

    # 2. SOI District and Subdistrict HQs (already in 4326 lat/long)
    for hq_file in ['UTTARAKHAND_DISTRICT_HQ.shp', 'UTTARAKHAND_SUBDISTRICT_HQ.shp']:
        p = os.path.join(SOI_DIR, hq_file)
        if os.path.exists(p):
            r = shapefile.Reader(p)
            for sr in r.shapeRecords():
                rec = sr.record.as_dict()
                name = normalize_name(rec.get('SUB_DIST') or rec.get('DISTRICT') or rec.get('TOWN') or '')
                lon = rec.get('LONGITUDE')
                lat = rec.get('LATITUDE')
                if name and lon and lat:
                    gazetteer[name] = (round(float(lon), 6), round(float(lat), 6))

    # 3. OSM Places
    osm_places_shp = os.path.join(OSM_DIR, 'gis_osm_places_free_1.shp')
    if os.path.exists(osm_places_shp):
        r = shapefile.Reader(osm_places_shp)
        for sr in r.iterShapeRecords():
            pt = sr.shape.points[0]
            if 77.5 <= pt[0] <= 81.2 and 28.7 <= pt[1] <= 31.5:
                pname = normalize_name(sr.record.as_dict().get('name', ''))
                if pname and pname not in gazetteer:
                    gazetteer[pname] = (round(pt[0], 6), round(pt[1], 6))

    print(f'[OK] Gazetteer built with {len(gazetteer)} geocoded locations.')
    return gazetteer


def ingest_census_settlements(conn, gazetteer):
    print('\n============================================================')
    print('2. INGESTING CENSUS 2011 SETTLEMENTS (TOWNS & VILLAGES)')
    print('============================================================')
    cur = conn.cursor()

    # --- A. Ingest Census Towns ---
    print('Reading Uttarakhand Town Directory (DH_2011_DCHB_Town_Release_0500.xlsx)...')
    wb_town = openpyxl.load_workbook(TOWN_XLSX, read_only=True)
    sheet_town = wb_town.active
    town_rows = list(sheet_town.iter_rows(values_only=True))
    headers_town = town_rows[0]

    towns_to_insert = []
    for r in town_rows[1:]:
        d = dict(zip(headers_town, r))
        t_code = str(d.get('Town Code', '')).strip()
        t_name = str(d.get('Town Name', '')).strip()
        if not t_code or not t_name:
            continue

        state_code = str(d.get('State Code', '05')).strip()
        dist_code = str(d.get('District Code', '')).strip().zfill(3)
        dist_name = str(d.get('District Name', '')).strip()
        subdist_code = str(d.get('Sub District Code', '')).strip()
        subdist_name = str(d.get('Sub District Name', '')).strip()
        cd_block = str(d.get('Name of CD Block', '')).strip()

        pop = int(d.get('Total Population of Town') or 0)
        hh = int(d.get('Total   Households ') or 0)
        male = int(d.get('Total Male Population of Town') or 0)
        female = int(d.get('Total Female Population of Town') or 0)

        infra = {
            'civic_status': d.get('Civic Status of Town'),
            'reference_year': d.get('Reference Year'),
            'area_sqkm': d.get('Area (sq. km.)'),
            'sc_population': d.get('Total Scheduled Castes Population of Town'),
            'st_population': d.get('Total Scheduled Tribes Population of Town'),
            'nearest_city_1lakh': d.get('Nearest Ciity Name with Population of 1 Lakh and more'),
            'nearest_city_dist_km': d.get('Nearest Ciity with Population of 1 Lakh and more Road Distance (in kms.) '),
        }

        # Resolve coordinates from gazetteer
        norm_tname = normalize_name(t_name)
        coords = gazetteer.get(norm_tname)
        # Specific known Chamoli coordinates
        if 'joshimath' in norm_tname:
            coords = (79.5645, 30.5564)
        elif 'badrinath' in norm_tname:
            coords = (79.4938, 30.7433)
        elif 'gopeshwar' in norm_tname:
            coords = (79.3314, 30.4137)
        elif 'karnaprayag' in norm_tname:
            coords = (79.2189, 30.2608)
        elif 'nandprayag' in norm_tname:
            coords = (79.3167, 30.3333)
        elif 'gochar' in norm_tname or 'gauchar' in norm_tname:
            coords = (79.1558, 30.2858)

        lon, lat = (coords[0], coords[1]) if coords else (None, None)

        towns_to_insert.append((
            'TOWN', t_code, t_name, state_code, dist_code, dist_name,
            subdist_code, subdist_name, cd_block, pop, hh, male, female,
            json.dumps(infra), lon, lat, lon, lat
        ))

    print(f'Prepared {len(towns_to_insert)} Census Towns for insertion.')
    execute_batch(cur, '''
        INSERT INTO census_settlements (
            settlement_type, settlement_code, settlement_name, state_code,
            district_code, district_name, subdistrict_code, subdistrict_name,
            cd_block_name, population_2011_baseline, households_2011_baseline,
            male_population_2011, female_population_2011, infrastructure_markers,
            geometry, longitude, latitude, provenance
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            CASE WHEN %s IS NOT NULL AND %s IS NOT NULL THEN ST_SetSRID(ST_MakePoint(%s, %s), 4326) ELSE NULL END,
            %s, %s, 'Census 2011 Baseline Population'
        ) ON CONFLICT (settlement_code) DO UPDATE SET
            settlement_name = EXCLUDED.settlement_name,
            population_2011_baseline = EXCLUDED.population_2011_baseline,
            households_2011_baseline = EXCLUDED.households_2011_baseline,
            male_population_2011 = EXCLUDED.male_population_2011,
            female_population_2011 = EXCLUDED.female_population_2011,
            infrastructure_markers = EXCLUDED.infrastructure_markers,
            geometry = COALESCE(EXCLUDED.geometry, census_settlements.geometry),
            longitude = COALESCE(EXCLUDED.longitude, census_settlements.longitude),
            latitude = COALESCE(EXCLUDED.latitude, census_settlements.latitude);
    ''', [
        (t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], t[9], t[10], t[11], t[12], t[13], t[14], t[15], t[14], t[15], t[14], t[15])
        for t in towns_to_insert
    ], page_size=200)
    conn.commit()
    print(f'[OK] {len(towns_to_insert)} Census Towns successfully ingested.')

    # --- B. Ingest Census Villages (Focus: Chamoli 057 + Key Disaster Districts) ---
    print('Reading Uttarakhand Village Directory (DH_2011_DCHB_Village_Release_0500.xlsx)...')
    wb_vil = openpyxl.load_workbook(VILLAGE_XLSX, read_only=True)
    sheet_vil = wb_vil.active

    headers_vil = None
    villages_to_insert = []
    target_districts = {'057', '058', '056', '062', '063', '061'} # Chamoli, Rudraprayag, Uttarkashi, Pithoragarh, Bageshwar, Pauri Garhwal

    t0_v = time.time()
    for i, row in enumerate(sheet_vil.iter_rows(values_only=True)):
        if i == 0:
            headers_vil = row
            dcode_idx = headers_vil.index('District Code')
            dname_idx = headers_vil.index('District Name')
            vcode_idx = headers_vil.index('Village Code')
            vname_idx = headers_vil.index('Village Name')
            subdist_code_idx = headers_vil.index('Sub District Code')
            subdist_name_idx = headers_vil.index('Sub District Name')
            cd_block_idx = headers_vil.index('CD Block Name')
            pop_idx = headers_vil.index('Total Population of Village')
            hh_idx = headers_vil.index('Total   Households ')
            male_idx = headers_vil.index('Total Male Population of Village')
            female_idx = headers_vil.index('Total Female Population of Village')

            # Infrastructure indicators
            primary_sch_idx = headers_vil.index('Govt Primary School (Status A(1)/NA(2))')
            middle_sch_idx = headers_vil.index('Govt Middle  School (Status A(1)/NA(2))')
            sec_sch_idx = headers_vil.index('Govt Secondary School (Status A(1)/NA(2))')
            tap_treated_idx = headers_vil.index('Tap Water-Treated (Status A(1)/NA(2))')
            tap_untreated_idx = headers_vil.index('Tap Water Untreated (Status A(1)/NA(2))')
            pucca_road_idx = headers_vil.index('Black Topped (pucca) Road (Status A(1)/NA(2))')
            all_weather_idx = headers_vil.index('All Weather Road (Status A(1)/NA(2))')
            continue

        raw_dcode = str(row[dcode_idx]).strip() if row[dcode_idx] else ''
        if raw_dcode not in target_districts:
            continue

        v_code = str(row[vcode_idx]).strip()
        v_name = str(row[vname_idx]).strip()
        if not v_code or not v_name:
            continue

        d_name = str(row[dname_idx]).strip()
        sd_code = str(row[subdist_code_idx]).strip()
        sd_name = str(row[subdist_name_idx]).strip()
        cd_block = str(row[cd_block_idx]).strip() if row[cd_block_idx] else ''

        pop = int(row[pop_idx] or 0)
        hh = int(row[hh_idx] or 0)
        male = int(row[male_idx] or 0)
        female = int(row[female_idx] or 0)

        infra = {
            'govt_primary_school': 1 if row[primary_sch_idx] == 1 else 0,
            'govt_middle_school': 1 if row[middle_sch_idx] == 1 else 0,
            'govt_secondary_school': 1 if row[sec_sch_idx] == 1 else 0,
            'tap_water_treated': 1 if row[tap_treated_idx] == 1 else 0,
            'tap_water_untreated': 1 if row[tap_untreated_idx] == 1 else 0,
            'pucca_road_connected': 1 if row[pucca_road_idx] == 1 else 0,
            'all_weather_road': 1 if row[all_weather_idx] == 1 else 0,
        }

        # Resolve coordinates from gazetteer
        norm_vname = normalize_name(v_name)
        coords = gazetteer.get(norm_vname)
        # Specific known Chamoli villages
        if norm_vname == 'mana':
            coords = (79.4939, 30.7719)
        elif norm_vname == 'malari':
            coords = (79.8891, 30.6872)
        elif norm_vname == 'raini' or 'raini' in norm_vname:
            coords = (79.7423, 30.4907)
        elif norm_vname == 'tharali':
            coords = (79.5021, 30.0614)
        elif norm_vname == 'gwaldam':
            coords = (79.5612, 30.0156)

        lon, lat = (coords[0], coords[1]) if coords else (None, None)

        villages_to_insert.append((
            'VILLAGE', v_code, v_name, '05', raw_dcode, d_name,
            sd_code, sd_name, cd_block, pop, hh, male, female,
            json.dumps(infra), lon, lat, lon, lat
        ))

    print(f'Extracted {len(villages_to_insert)} Census Villages in {time.time() - t0_v:.1f}s.')
    execute_batch(cur, '''
        INSERT INTO census_settlements (
            settlement_type, settlement_code, settlement_name, state_code,
            district_code, district_name, subdistrict_code, subdistrict_name,
            cd_block_name, population_2011_baseline, households_2011_baseline,
            male_population_2011, female_population_2011, infrastructure_markers,
            geometry, longitude, latitude, provenance
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            CASE WHEN %s IS NOT NULL AND %s IS NOT NULL THEN ST_SetSRID(ST_MakePoint(%s, %s), 4326) ELSE NULL END,
            %s, %s, 'Census 2011 Baseline Population'
        ) ON CONFLICT (settlement_code) DO UPDATE SET
            settlement_name = EXCLUDED.settlement_name,
            population_2011_baseline = EXCLUDED.population_2011_baseline,
            households_2011_baseline = EXCLUDED.households_2011_baseline,
            male_population_2011 = EXCLUDED.male_population_2011,
            female_population_2011 = EXCLUDED.female_population_2011,
            infrastructure_markers = EXCLUDED.infrastructure_markers,
            geometry = COALESCE(EXCLUDED.geometry, census_settlements.geometry),
            longitude = COALESCE(EXCLUDED.longitude, census_settlements.longitude),
            latitude = COALESCE(EXCLUDED.latitude, census_settlements.latitude);
    ''', [
        (v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8], v[9], v[10], v[11], v[12], v[13], v[14], v[15], v[14], v[15], v[14], v[15])
        for v in villages_to_insert
    ], page_size=500)
    conn.commit()
    print(f'[OK] {len(villages_to_insert)} Census Villages successfully ingested.')

    # --- C. Link Existing Habitations to Census Settlements ---
    print('\nLinking existing habitations to Census Settlements...')
    hab_links = [
        ('Joshimath High Risk Sector (SIMULATED)', '800291'), # Joshimath MB
        ('Malari Upper Valley Sector (SIMULATED)', '040810'), # Malari village
        ('Tharali Riverine Sector (SIMULATED)', '041838'),    # Tharali village
        ('Ghat Lowland Zone (SIMULATED)', '800293'),          # Nandprayag / Ghat
        ('Gwaldam Valley Slope (SIMULATED)', '041846'),       # Gwaldam village
    ]

    matched_count = 0
    for hab_name, c_code in hab_links:
        cur.execute('''
            UPDATE habitations h
            SET census_settlement_id = cs.id,
                census_code = cs.settlement_code
            FROM census_settlements cs
            WHERE h.name = %s
              AND cs.settlement_code = %s;
        ''', (hab_name, c_code))
        if cur.rowcount > 0:
            matched_count += 1
            print(f'  [OK] Linked habitation "{hab_name}" -> Census Code {c_code}')

    # In case there are other habitations, attempt fuzzy/distance linking
    cur.execute('''
        UPDATE habitations h
        SET census_settlement_id = cs.id,
            census_code = cs.settlement_code
        FROM census_settlements cs
        WHERE h.census_settlement_id IS NULL
          AND cs.geometry IS NOT NULL
          AND ST_DWithin(h.geometry::geography, cs.geometry::geography, 500);
    ''')
    add_matched = cur.rowcount
    conn.commit()
    print(f'[OK] Total habitations linked to Census 2011 Settlements: {matched_count + add_matched}')


# ============================================================
# 3. INGEST OPENSTREETMAP (OSM) INFRASTRUCTURE
# ============================================================

def ingest_osm_infrastructure(conn):
    print('\n============================================================')
    print('3. INGESTING OPENSTREETMAP (OSM) INFRASTRUCTURE')
    print('============================================================')
    cur = conn.cursor()

    # --- A. OSM Places ---
    print('Ingesting OSM Places (Towns, Villages, Hamlets across Uttarakhand)...')
    osm_places_shp = os.path.join(OSM_DIR, 'gis_osm_places_free_1.shp')
    r_places = shapefile.Reader(osm_places_shp)

    places_batch = []
    for sr in r_places.iterShapeRecords():
        pt = sr.shape.points[0]
        # Bbox for Uttarakhand: [77.5, 28.7, 81.2, 31.5]
        if 77.5 <= pt[0] <= 81.2 and 28.7 <= pt[1] <= 31.5:
            rec = sr.record.as_dict()
            name = str(rec.get('name', '')).strip()
            if not name:
                continue
            osm_id = str(rec.get('osm_id', ''))
            fclass = str(rec.get('fclass', ''))
            pop = int(rec.get('population') or 0)
            lon, lat = round(pt[0], 6), round(pt[1], 6)

            places_batch.append((
                osm_id, name, fclass, pop, lon, lat, lon, lat
            ))

    print(f'Found {len(places_batch)} OSM places in Uttarakhand bounds. Inserting...')
    # Clean previous OSM places for idempotency
    cur.execute("DELETE FROM osm_places WHERE provenance = 'OpenStreetMap Mapped Place';")
    execute_batch(cur, '''
        INSERT INTO osm_places (
            osm_id, name, fclass, population, geometry, longitude, latitude, provenance
        ) VALUES (
            %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, 'OpenStreetMap Mapped Place'
        );
    ''', places_batch, page_size=1000)
    conn.commit()
    print(f'[OK] Ingested {len(places_batch)} OSM Places.')

    # --- B. OSM Facilities (Healthcare, Education, Emergency, Governance) ---
    print('Ingesting OSM Facilities (Hospitals, Schools, Police, Fire, etc.)...')
    osm_pois_shp = os.path.join(OSM_DIR, 'gis_osm_pois_free_1.shp')
    r_pois = shapefile.Reader(osm_pois_shp)

    fac_batch = []
    category_map = {
        'hospital': 'healthcare', 'clinic': 'healthcare', 'doctors': 'healthcare',
        'pharmacy': 'healthcare', 'dentist': 'healthcare', 'veterinary': 'healthcare',
        'school': 'education', 'college': 'education', 'university': 'education', 'kindergarten': 'education',
        'police': 'emergency', 'fire_station': 'emergency',
        'town_hall': 'government', 'courthouse': 'government', 'post_office': 'government', 'community_centre': 'government',
        'shelter': 'shelter', 'camp_site': 'shelter'
    }

    for sr in r_pois.iterShapeRecords():
        pt = sr.shape.points[0]
        if 77.5 <= pt[0] <= 81.2 and 28.7 <= pt[1] <= 31.5:
            rec = sr.record.as_dict()
            fclass = str(rec.get('fclass', ''))
            cat = category_map.get(fclass)
            if not cat:
                continue

            name = str(rec.get('name', '')).strip() or f'{cat.title()} Facility ({fclass})'
            osm_id = str(rec.get('osm_id', ''))
            lon, lat = round(pt[0], 6), round(pt[1], 6)

            fac_batch.append((
                osm_id, name, fclass, cat, lon, lat, lon, lat
            ))

    print(f'Found {len(fac_batch)} OSM critical facilities. Inserting...')
    cur.execute("DELETE FROM osm_facilities WHERE provenance = 'OSM-mapped facility';")
    execute_batch(cur, '''
        INSERT INTO osm_facilities (
            osm_id, name, fclass, category, geometry, longitude, latitude, provenance
        ) VALUES (
            %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, 'OSM-mapped facility'
        );
    ''', fac_batch, page_size=500)
    conn.commit()
    print(f'[OK] Ingested {len(fac_batch)} OSM Facilities.')

    # --- C. OSM Roads (Chamoli Sector & Arterial Transit Corridors) ---
    print('Ingesting OSM Roads for Chamoli & Transit Arterial Corridors...')
    shp_path = os.path.join(OSM_DIR, 'gis_osm_roads_free_1.shp')
    dbf_path = os.path.join(OSM_DIR, 'gis_osm_roads_free_1.dbf')
    file_size = os.path.getsize(shp_path)

    # 1. Fast binary index scan to find record indices inside Uttarakhand sector
    # [77.5, 29.5, 79.54, 31.5]
    t0_r = time.time()
    matched_indices = []
    with open(shp_path, 'rb') as f:
        f.seek(100)
        rec_idx = 0
        while f.tell() < file_size:
            hdr = f.read(8)
            if len(hdr) < 8:
                break
            rec_num, content_len = struct.unpack('>2i', hdr)
            rec_bytes = content_len * 2
            shp_data = f.read(36)
            stype, xmin, ymin, xmax, ymax = struct.unpack('<i4d', shp_data)

            # Uttarakhand Western/Central sector: [77.5, 29.5, 79.54, 31.5]
            if xmax >= 77.5 and xmin <= 79.54 and ymax >= 29.5 and ymin <= 31.5:
                matched_indices.append(rec_idx)

            f.seek(rec_bytes - 36, 1)
            rec_idx += 1

    print(f'Binary scan found {len(matched_indices)} roads in Uttarakhand sector in {time.time() - t0_r:.2f}s.')

    # 2. Extract geometries and attributes for matched indices
    r_roads = shapefile.Reader(shp=shp_path, dbf=dbf_path)
    road_batch = []
    allowed_classes = {
        'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
        'residential', 'unclassified', 'track'
    }

    for idx in matched_indices:
        try:
            shape = r_roads.shape(idx)
            rec = r_roads.record(idx).as_dict()
            fclass = str(rec.get('fclass', ''))
            if fclass not in allowed_classes:
                continue

            # Convert shape to LineString GeoJSON
            pts = shape.points
            if len(pts) < 2:
                continue

            coords = [[round(p[0], 6), round(p[1], 6)] for p in pts]
            line_geojson = {'type': 'LineString', 'coordinates': coords}

            osm_id = str(rec.get('osm_id', ''))
            name = str(rec.get('name', '')).strip() or None
            ref = str(rec.get('ref', '')).strip() or None
            oneway = str(rec.get('oneway', '')).strip() or None
            bridge = str(rec.get('bridge', '')).strip() or None
            tunnel = str(rec.get('tunnel', '')).strip() or None
            try:
                maxspeed = int(rec.get('maxspeed') or 0)
            except (ValueError, TypeError):
                maxspeed = None

            road_batch.append((
                osm_id, name, ref, fclass, oneway, maxspeed, bridge, tunnel,
                json.dumps(line_geojson)
            ))
        except Exception as e:
            continue

    print(f'Prepared {len(road_batch)} classified roads for insertion.')
    cur.execute("DELETE FROM osm_roads WHERE provenance LIKE 'Mapped Road%';")
    execute_batch(cur, '''
        INSERT INTO osm_roads (
            osm_id, name, ref, fclass, oneway, maxspeed, bridge, tunnel,
            geometry, provenance
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s,
            ST_GeomFromGeoJSON(%s),
            'Mapped Road (Not real-time passability verified)'
        );
    ''', road_batch, page_size=1000)
    conn.commit()
    print(f'[OK] Ingested {len(road_batch)} OSM Roads.')


# ============================================================
# 4. FINAL VERIFICATION & DATA METRICS REPORT
# ============================================================

def run_verification(conn):
    print('\n============================================================')
    print('4. FINAL VERIFICATION & METRICS AUDIT')
    print('============================================================')
    cur = conn.cursor()

    queries = [
        ('state_boundaries', 'SELECT COUNT(*), COUNT(CASE WHEN ST_IsValid(geometry) THEN 1 END) FROM state_boundaries;'),
        ('district_boundaries', 'SELECT COUNT(*), COUNT(CASE WHEN ST_IsValid(geometry) THEN 1 END) FROM district_boundaries;'),
        ('subdistrict_boundaries', 'SELECT COUNT(*), COUNT(CASE WHEN ST_IsValid(geometry) THEN 1 END) FROM subdistrict_boundaries;'),
        ('census_settlements (Total)', 'SELECT COUNT(*), COUNT(CASE WHEN geometry IS NOT NULL THEN 1 END) FROM census_settlements;'),
        ('census_settlements (Chamoli)', "SELECT COUNT(*), COUNT(CASE WHEN geometry IS NOT NULL THEN 1 END) FROM census_settlements WHERE district_code = '057';"),
        ('osm_roads', 'SELECT COUNT(*), COUNT(CASE WHEN ST_IsValid(geometry) THEN 1 END) FROM osm_roads;'),
        ('osm_places', 'SELECT COUNT(*), COUNT(CASE WHEN ST_IsValid(geometry) THEN 1 END) FROM osm_places;'),
        ('osm_facilities', 'SELECT COUNT(*), COUNT(CASE WHEN ST_IsValid(geometry) THEN 1 END) FROM osm_facilities;'),
        ('habitations linked to census', 'SELECT COUNT(*), COUNT(census_settlement_id) FROM habitations;'),
    ]

    metrics = {}
    for label, q in queries:
        cur.execute(q)
        row = cur.fetchone()
        metrics[label] = {'total': row[0], 'valid_or_geocoded': row[1]}
        print(f'{label:<32}: Total = {row[0]:<6} | Valid/Geocoded = {row[1]:<6}')

    return metrics


def main():
    start_time = time.time()
    print('============================================================')
    print('VISTHAAPAN PORTAL - PHASE 9 GEO DATA ENRICHMENT INGESTION')
    print('============================================================')

    conn = get_db_connection()
    try:
        ingest_soi_boundaries(conn)
        gazetteer = build_soi_osm_gazetteer(
            pyproj.Transformer.from_crs(
                pyproj.CRS.from_wkt(open(os.path.join(SOI_DIR, 'UTTARAKHAND_STATE_BDY.prj')).read()),
                pyproj.CRS.from_epsg(4326),
                always_xy=True
            )
        )
        ingest_census_settlements(conn, gazetteer)
        ingest_osm_infrastructure(conn)
        metrics = run_verification(conn)
        duration = round(time.time() - start_time, 2)
        print(f'\n============================================================')
        print(f'ALL PHASE 9 GEO ENRICHMENT COMPLETED IN {duration}s')
        print(f'============================================================\n')
    finally:
        conn.close()


if __name__ == '__main__':
    main()
