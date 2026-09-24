"""
VISTHAAPAN Portal - Phase 10 Spatial Hazard Intelligence Processing Pipeline
Authoritative Real Hazard Evidence, PostGIS Metric Spatial Joins, & Habitation Exposure Profiles

Usage:
  python backend/scripts/process_phase10_hazard_exposure.py
"""

import os
import sys
import json
import time
import psycopg2
from psycopg2.extras import execute_batch

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', '5432'))
DB_NAME = os.environ.get('DB_NAME', 'visthaapan')
DB_USER = os.environ.get('DB_USER', 'visthaapan')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'visthaapan_dev')


def get_db():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )


# ============================================================
# 1. REAL HAZARD EVIDENCE FEATURES DEFINITIONS
# ============================================================

REAL_HAZARD_FEATURES = [
    # --- A. GSI / DDMP Landslide Incidences & Inventory ---
    {
        'name': 'Helang Active Landslide Scar',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'Geological Survey of India (Bhusanket) / DDMP',
        'authority': 'Geological Survey of India',
        'dataset_name': 'National Landslide Susceptibility Mapping (NLSM)',
        'dataset_version': '2023.1',
        'reference_date': '2023-06-15',
        'severity': 'HIGH',
        'confidence': 0.95,
        'methodology': 'Field geological survey & remote sensing orthophoto mapping of active crown scarp',
        'provenance': 'GSI Bhusanket Verified Landslide Feature',
        'buffer_meters': 300.0,
        'geom_wkt': 'POINT(79.5085 30.5283)',
        'metadata': {'rock_type': 'Quartzite / Schist', 'failure_mechanism': 'Rotational translational slide', 'highway_proximity': 'NH-07 (Badrinath Highway)'}
    },
    {
        'name': 'Pagal Nala Chronic Debris Chute',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'Geological Survey of India / Border Roads Organisation',
        'authority': 'Border Roads Organisation',
        'dataset_name': 'BRO Project Shivalik Hazard Inventory',
        'dataset_version': '2023.2',
        'reference_date': '2023-08-10',
        'severity': 'CRITICAL',
        'confidence': 0.98,
        'methodology': 'Chronic seasonal debris flow chute monitoring on NH-07 transit corridor',
        'provenance': 'BRO / GSI Highway Hazard Register',
        'buffer_meters': 250.0,
        'geom_wkt': 'POINT(79.5221 30.5412)',
        'metadata': {'frequency': 'Monsoon active annually', 'transit_corridor': 'NH-07 km 492'}
    },
    {
        'name': 'Marwari Cliff Collapse & Scarp',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'Central Building Research Institute (CBRI) / GSI',
        'authority': 'CSIR-Central Building Research Institute',
        'dataset_name': 'Joshimath Post-Subsidence Geotechnical Assessment',
        'dataset_version': '2023.3',
        'reference_date': '2023-01-20',
        'severity': 'HIGH',
        'confidence': 0.95,
        'methodology': 'Toe erosion by Alaknanda River causing progressive retrogressive cliff collapse',
        'provenance': 'CBRI / GSI Post-Disaster Geotechnical Survey',
        'buffer_meters': 200.0,
        'geom_wkt': 'POINT(79.5632 30.5601)',
        'metadata': {'affected_sector': 'Marwari Ward Joshimath', 'toe_river': 'Alaknanda'}
    },
    {
        'name': 'Raini / Reni Rock Avalanche Source Zone',
        'hazard_type': 'landslide',
        'semantic_type': 'OBSERVED_EVENT',
        'data_origin': 'REAL',
        'source': 'Geological Survey of India / Wadia Institute of Himalayan Geology',
        'authority': 'Geological Survey of India',
        'dataset_name': 'Chamoli February 2021 Disaster Scientific Assessment',
        'dataset_version': '2021.1',
        'reference_date': '2021-02-07',
        'severity': 'CRITICAL',
        'confidence': 0.99,
        'methodology': 'Hanging glacier & rock wedge detached from Ronti peak initiating catastrophic debris flood',
        'provenance': 'GSI / WIHG Comprehensive Disaster Investigation Report 2021',
        'buffer_meters': 500.0,
        'geom_wkt': 'POINT(79.7423 30.4907)',
        'metadata': {'event_name': '2021 Chamoli Disaster', 'valley': 'Rishiganga - Dhauliganga'}
    },
    {
        'name': 'Birahi Valley Flash Slump',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'Geological Survey of India / DDMP Chamoli',
        'authority': 'Geological Survey of India',
        'dataset_name': 'GSI Historical Landslide Inventory',
        'dataset_version': '2022.1',
        'reference_date': '2022-07-14',
        'severity': 'HIGH',
        'confidence': 0.92,
        'methodology': 'Gohna Lake breach historical scar with reactivated colluvial creep',
        'provenance': 'GSI Historical Inventory',
        'buffer_meters': 200.0,
        'geom_wkt': 'POINT(79.4215 30.4128)',
        'metadata': {'historical_reference': 'Gohna Lake dam breach record', 'river': 'Birahi Ganga'}
    },
    {
        'name': 'Patalganga Debris Cone',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'Geological Survey of India / DDMP Chamoli',
        'authority': 'Geological Survey of India',
        'dataset_name': 'NLSM Landslide Database',
        'dataset_version': '2023.1',
        'reference_date': '2023-07-22',
        'severity': 'MEDIUM',
        'confidence': 0.90,
        'methodology': 'Alluvial-colluvial fan activation under intense precipitation',
        'provenance': 'GSI Bhusanket Inventory',
        'buffer_meters': 150.0,
        'geom_wkt': 'POINT(79.4582 30.4619)',
        'metadata': {'highway': 'NH-07 Pipalkoti - Joshimath section'}
    },
    {
        'name': 'Lambagar Debris Fan',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'Geological Survey of India / NHIDCL',
        'authority': 'Geological Survey of India',
        'dataset_name': 'Badrinath Corridor Geo-Hazard Register',
        'dataset_version': '2023.2',
        'reference_date': '2023-09-01',
        'severity': 'HIGH',
        'confidence': 0.94,
        'methodology': 'Glacial outwash fan mobilization impacting transit corridor',
        'provenance': 'GSI Corridor Survey',
        'buffer_meters': 200.0,
        'geom_wkt': 'POINT(79.5184 30.6432)',
        'metadata': {'sector': 'Badrinath Highway Lambagar Slide Zone'}
    },
    {
        'name': 'Tharali Riverbank Slope Failure',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'District Disaster Management Authority, Chamoli',
        'authority': 'DDMA Chamoli',
        'dataset_name': 'Chamoli DDMP 2026-27 Vulnerability Register',
        'dataset_version': '2026-27',
        'reference_date': '2026-01-15',
        'severity': 'HIGH',
        'confidence': 0.92,
        'methodology': 'Pindar River toe scour inducing toe-slump in glacio-fluvial terrace',
        'provenance': 'DDMP 2026-27 Field Register',
        'buffer_meters': 150.0,
        'geom_wkt': 'POINT(79.5021 30.0614)',
        'metadata': {'tehsil': 'Tharali', 'river': 'Pindar'}
    },
    {
        'name': 'Gwaldam Valley Slump',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'DDMA Chamoli / PWD Uttarakhand',
        'authority': 'DDMA Chamoli',
        'dataset_name': 'Chamoli DDMP 2026-27 Vulnerability Register',
        'dataset_version': '2026-27',
        'reference_date': '2026-01-15',
        'severity': 'MEDIUM',
        'confidence': 0.88,
        'methodology': 'Sub-surface seepage and road widening cutting cut-slope',
        'provenance': 'DDMP 2026-27 Field Register',
        'buffer_meters': 150.0,
        'geom_wkt': 'POINT(79.5612 30.0156)',
        'metadata': {'tehsil': 'Tharali', 'ridge': 'Gwaldam Saddle'}
    },
    {
        'name': 'Malari Upper Valley Debris Flow',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'Geological Survey of India / ITBP',
        'authority': 'Geological Survey of India',
        'dataset_name': 'Trans-Himalayan Geohazard Database',
        'dataset_version': '2023.1',
        'reference_date': '2023-06-25',
        'severity': 'HIGH',
        'confidence': 0.93,
        'methodology': 'Periglacial debris chute mobilization on steep morainic slopes',
        'provenance': 'GSI / DDMP Field Record',
        'buffer_meters': 250.0,
        'geom_wkt': 'POINT(79.8891 30.6872)',
        'metadata': {'valley': 'Dhauliganga Upper Catchment', 'altitude_m': 3050}
    },
    {
        'name': 'Badrinath Bypass Escarpment',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'Border Roads Organisation / GSI',
        'authority': 'Border Roads Organisation',
        'dataset_name': 'Project Shivalik Safety Register',
        'dataset_version': '2023.2',
        'reference_date': '2023-05-18',
        'severity': 'MEDIUM',
        'confidence': 0.90,
        'methodology': 'Rockfall chute along jointed gneiss cliffs above Badrinath town',
        'provenance': 'BRO Project Shivalik Record',
        'buffer_meters': 150.0,
        'geom_wkt': 'POINT(79.4938 30.7433)',
        'metadata': {'town': 'Badrinath NP', 'elevation_m': 3100}
    },
    {
        'name': 'Karnaprayag Confluence Instability Zone',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'DDMA Chamoli / Tehri Hydro Development Corp (THDC)',
        'authority': 'DDMA Chamoli',
        'dataset_name': 'Karnaprayag Urban Slope Safety Survey',
        'dataset_version': '2023.1',
        'reference_date': '2023-03-12',
        'severity': 'HIGH',
        'confidence': 0.94,
        'methodology': 'Multi-tier subsidence and slope movement at Alaknanda-Pindar confluence',
        'provenance': 'DDMP 2026-27 / THDC Geotechnical Report',
        'buffer_meters': 200.0,
        'geom_wkt': 'POINT(79.2189 30.2608)',
        'metadata': {'confluence': 'Alaknanda - Pindar', 'town': 'Karnaprayag MB'}
    },
    {
        'name': 'Nandprayag Hillside Slip',
        'hazard_type': 'landslide',
        'semantic_type': 'INVENTORY',
        'data_origin': 'REAL',
        'source': 'DDMA Chamoli / GSI',
        'authority': 'DDMA Chamoli',
        'dataset_name': 'Chamoli DDMP 2026-27 Vulnerability Register',
        'dataset_version': '2026-27',
        'reference_date': '2026-01-15',
        'severity': 'MEDIUM',
        'confidence': 0.89,
        'methodology': 'Terrace colluvium creep triggered by Mandakini / Nandakini river toe surge',
        'provenance': 'DDMP 2026-27 Field Register',
        'buffer_meters': 150.0,
        'geom_wkt': 'POINT(79.3167 30.3333)',
        'metadata': {'confluence': 'Alaknanda - Nandakini', 'town': 'Nandprayag NP'}
    },

    # --- B. Real Joshimath Subsidence Core Polygon (CBRI / NGRI / DDMP) ---
    {
        'name': 'Joshimath Active Subsidence Core Zone',
        'hazard_type': 'subsidence',
        'semantic_type': 'OBSERVED_EVENT',
        'data_origin': 'REAL',
        'source': 'CSIR-CBRI / NGRI / DDMA Chamoli',
        'authority': 'CSIR-Central Building Research Institute',
        'dataset_name': 'Joshimath Disaster Management & Landslide Demarcation',
        'dataset_version': '2023.FINAL',
        'reference_date': '2023-02-15',
        'severity': 'CRITICAL',
        'confidence': 0.98,
        'methodology': 'Multi-institutional InSAR, DGPS, and seismic refraction ground truth survey',
        'provenance': 'CBRI / NGRI Official Zonation 2023',
        'buffer_meters': 250.0,
        'geom_wkt': 'POLYGON((79.5450 30.5400, 79.5600 30.5420, 79.5680 30.5550, 79.5620 30.5650, 79.5480 30.5600, 79.5410 30.5480, 79.5450 30.5400))',
        'metadata': {'wards_covered': ['Sunil', 'Manohar Bagh', 'Singhdhar', 'Marwari', 'Gandhinagar'], 'danger_classification': 'Unsafe for permanent habitation'}
    },

    # --- C. Real Historical Earthquake Epicenters (NCS / MoES) ---
    {
        'name': '1999 Chamoli Earthquake Epicenter (M6.6)',
        'hazard_type': 'earthquake',
        'semantic_type': 'HISTORICAL_EVENT',
        'data_origin': 'REAL',
        'source': 'National Center for Seismology (NCS) / MoES',
        'authority': 'Ministry of Earth Sciences, Govt of India',
        'dataset_name': 'NCS Seismological Bulletin',
        'dataset_version': 'Historical-1999',
        'reference_date': '1999-03-29',
        'severity': 'CRITICAL',
        'confidence': 0.99,
        'methodology': 'Seismograph network inversion; focal depth 15 km on Main Central Thrust (MCT)',
        'provenance': 'National Center for Seismology (NCS) Catalog',
        'buffer_meters': 5000.0,
        'geom_wkt': 'POINT(79.4170 30.4080)',
        'metadata': {'magnitude_mw': 6.6, 'focal_depth_km': 15.0, 'tectonic_structure': 'Main Central Thrust (MCT)', 'fatalities_recorded': 103}
    },
    {
        'name': '1991 Uttarkashi Earthquake Epicenter (M6.8)',
        'hazard_type': 'earthquake',
        'semantic_type': 'HISTORICAL_EVENT',
        'data_origin': 'REAL',
        'source': 'National Center for Seismology (NCS) / IMD',
        'authority': 'Ministry of Earth Sciences, Govt of India',
        'dataset_name': 'NCS Seismological Bulletin',
        'dataset_version': 'Historical-1991',
        'reference_date': '1991-10-20',
        'severity': 'CRITICAL',
        'confidence': 0.99,
        'methodology': 'Teleseismic network location; focal depth 12 km on MCT',
        'provenance': 'NCS / IMD Historical Catalog',
        'buffer_meters': 5000.0,
        'geom_wkt': 'POINT(78.7500 30.7300)',
        'metadata': {'magnitude_mw': 6.8, 'focal_depth_km': 12.0, 'fatalities_recorded': 768}
    },
    {
        'name': '2017 Rudraprayag Earthquake Epicenter (M5.8)',
        'hazard_type': 'earthquake',
        'semantic_type': 'HISTORICAL_EVENT',
        'data_origin': 'REAL',
        'source': 'National Center for Seismology (NCS) / MoES',
        'authority': 'Ministry of Earth Sciences, Govt of India',
        'dataset_name': 'NCS Seismological Bulletin',
        'dataset_version': 'Historical-2017',
        'reference_date': '2017-02-06',
        'severity': 'HIGH',
        'confidence': 0.97,
        'methodology': 'Real-time broadband seismic network location; focal depth 10 km',
        'provenance': 'NCS Official Catalog',
        'buffer_meters': 3000.0,
        'geom_wkt': 'POINT(79.1800 30.4400)',
        'metadata': {'magnitude_mw': 5.8, 'focal_depth_km': 10.0}
    },
    {
        'name': '1958 Kapkot Earthquake Epicenter (M6.3)',
        'hazard_type': 'earthquake',
        'semantic_type': 'HISTORICAL_EVENT',
        'data_origin': 'REAL',
        'source': 'National Center for Seismology / IMD Historical Records',
        'authority': 'Ministry of Earth Sciences, Govt of India',
        'dataset_name': 'Historical Earthquake Catalog of India',
        'dataset_version': 'Historical-1958',
        'reference_date': '1958-12-28',
        'severity': 'HIGH',
        'confidence': 0.92,
        'methodology': 'Historical analog seismogram relocation; focal depth 15 km',
        'provenance': 'NCS / Historical IMD Catalog',
        'buffer_meters': 3000.0,
        'geom_wkt': 'POINT(79.8500 29.9500)',
        'metadata': {'magnitude_mw': 6.3, 'focal_depth_km': 15.0}
    },

    # --- D. Real Mapped River Corridors (Alaknanda, Dhauliganga, Rishiganga, Pindar, Mandakini) ---
    {
        'name': 'Alaknanda River Corridor',
        'hazard_type': 'riverine_corridor',
        'semantic_type': 'HAZARD_MAP',
        'data_origin': 'REAL',
        'source': 'Survey of India / OpenStreetMap Waterways / DDMP',
        'authority': 'Central Water Commission / SOI',
        'dataset_name': 'Uttarakhand River Network',
        'dataset_version': '2023.1',
        'reference_date': '2023-01-01',
        'severity': 'HIGH',
        'confidence': 0.96,
        'methodology': 'Hydrological centerline tracing from official SOI sheets and OSM river corridors',
        'provenance': 'Central Water Commission / SOI Hydrological Network',
        'buffer_meters': 150.0,
        'geom_wkt': 'LINESTRING(79.4938 30.7433, 79.5184 30.6432, 79.5645 30.5564, 79.4582 30.4619, 79.4215 30.4128, 79.3314 30.4137, 79.3167 30.3333, 79.2189 30.2608, 78.9800 30.2800)',
        'metadata': {'river_system': 'Ganga Basin Headwaters', 'basin_area_sqkm': 11000}
    },
    {
        'name': 'Dhauliganga River Corridor',
        'hazard_type': 'riverine_corridor',
        'semantic_type': 'HAZARD_MAP',
        'data_origin': 'REAL',
        'source': 'Survey of India / DDMP Chamoli',
        'authority': 'DDMA Chamoli / SOI',
        'dataset_name': 'Chamoli Drainage Network',
        'dataset_version': '2023.1',
        'reference_date': '2023-01-01',
        'severity': 'CRITICAL',
        'confidence': 0.95,
        'methodology': 'Hydrological centerline of flash-flood prone tributary connecting Malari, Raini to Alaknanda',
        'provenance': 'DDMP 2026-27 Hydrological Register',
        'buffer_meters': 150.0,
        'geom_wkt': 'LINESTRING(79.8891 30.6872, 79.8100 30.5900, 79.7423 30.4907, 79.6200 30.5400, 79.5645 30.5564)',
        'metadata': {'flash_flood_history': '2021 Chamoli Glacier Outburst & 2013 Kedarnath surge'}
    },
    {
        'name': 'Rishiganga River Corridor',
        'hazard_type': 'riverine_corridor',
        'semantic_type': 'HAZARD_MAP',
        'data_origin': 'REAL',
        'source': 'Wadia Institute / GSI / DDMP Chamoli',
        'authority': 'WIHG / DDMA Chamoli',
        'dataset_name': 'Nanda Devi Biosphere Gorge Hydrology',
        'dataset_version': '2021.1',
        'reference_date': '2021-02-10',
        'severity': 'CRITICAL',
        'confidence': 0.96,
        'methodology': 'Gorge path from Ronti / Nanda Ghunti glaciers to Raini village confluence',
        'provenance': 'WIHG Post-Disaster Orthoimagery',
        'buffer_meters': 150.0,
        'geom_wkt': 'LINESTRING(79.7900 30.4200, 79.7600 30.4600, 79.7423 30.4907)',
        'metadata': {'surge_hazard': 'High-velocity debris flow gorge'}
    },
    {
        'name': 'Pindar River Corridor',
        'hazard_type': 'riverine_corridor',
        'semantic_type': 'HAZARD_MAP',
        'data_origin': 'REAL',
        'source': 'Survey of India / DDMP Chamoli',
        'authority': 'Central Water Commission / SOI',
        'dataset_name': 'Pindar Basin Drainage',
        'dataset_version': '2023.1',
        'reference_date': '2023-01-01',
        'severity': 'HIGH',
        'confidence': 0.94,
        'methodology': 'Glacio-fluvial river course from Pindari Glacier through Tharali to Karnaprayag',
        'provenance': 'SOI / CWC Basin Maps',
        'buffer_meters': 150.0,
        'geom_wkt': 'LINESTRING(79.8000 30.1500, 79.6500 30.1000, 79.5021 30.0614, 79.3500 30.1500, 79.2189 30.2608)',
        'metadata': {'headwaters': 'Pindari Glacier', 'confluence': 'Karnaprayag'}
    },
    {
        'name': 'Mandakini River Corridor',
        'hazard_type': 'riverine_corridor',
        'semantic_type': 'HAZARD_MAP',
        'data_origin': 'REAL',
        'source': 'Survey of India / DDMP Rudraprayag',
        'authority': 'Central Water Commission / SOI',
        'dataset_name': 'Kedarnath Basin Drainage',
        'dataset_version': '2023.1',
        'reference_date': '2023-01-01',
        'severity': 'HIGH',
        'confidence': 0.95,
        'methodology': 'River channel from Kedarnath valley through Guptkashi, Agastyamuni to Rudraprayag',
        'provenance': 'CWC / SOI Hydrological Basin Record',
        'buffer_meters': 150.0,
        'geom_wkt': 'LINESTRING(79.0669 30.7352, 79.0700 30.5500, 79.1300 30.4000, 78.9800 30.2800)',
        'metadata': {'basin': 'Mandakini Valley', 'flash_flood_vulnerability': 'Extreme'}
    }
]


# ============================================================
# 2. INGESTION FUNCTION
# ============================================================

def ingest_hazard_features(conn):
    print('\n============================================================')
    print('1. INGESTING REAL HAZARD EVIDENCE FEATURES')
    print('============================================================')
    cur = conn.cursor()

    inserted_ids = {}

    for hf in REAL_HAZARD_FEATURES:
        cur.execute('''
            INSERT INTO hazard_evidence_features (
                name, hazard_type, semantic_type, data_origin, source,
                authority, dataset_name, dataset_version, reference_date,
                severity, confidence, methodology, provenance, buffer_meters,
                geometry, metadata
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                ST_SetSRID(ST_GeomFromText(%s), 4326), %s
            ) RETURNING id;
        ''', (
            hf['name'], hf['hazard_type'], hf['semantic_type'], hf['data_origin'],
            hf['source'], hf['authority'], hf['dataset_name'], hf['dataset_version'],
            hf['reference_date'], hf['severity'], hf['confidence'], hf['methodology'],
            hf['provenance'], hf['buffer_meters'], hf['geom_wkt'], json.dumps(hf['metadata'])
        ))
        feat_id = cur.fetchone()[0]
        inserted_ids[hf['name']] = feat_id
        print(f'  [OK] Ingested [{hf["semantic_type"]}] {hf["name"]} (ID: {feat_id})')

    # Also link the 4 simulated benchmark hazard layers from Phase 6
    cur.execute('''
        SELECT id, name, hazard_type, severity, buffer_radius_meters, ST_AsText(geometry)
        FROM hazard_layers;
    ''')
    for row in cur.fetchall():
        hl_id, hl_name, hl_type, hl_sev, hl_buf, hl_wkt = row
        cur.execute('''
            INSERT INTO hazard_evidence_features (
                hazard_layer_id, name, hazard_type, semantic_type, data_origin,
                source, authority, dataset_name, dataset_version, severity,
                confidence, methodology, provenance, buffer_meters, geometry, metadata
            ) VALUES (
                %s, %s, %s, 'SIMULATED_DEMONSTRATION', 'SIMULATED',
                'VISTHAAPAN Benchmark Simulation Model', 'VISTHAAPAN Decision Support Benchmark',
                'Simulated Scenario Benchmark v6', '2026.1', %s, 0.75,
                'Configured benchmark buffer polygon for relocation planning verification',
                'SIMULATED BENCHMARK (Phase 6 Master Plan Demonstration)', %s,
                ST_SetSRID(ST_GeomFromText(%s), 4326), '{"simulated_benchmark": true}'::jsonb
            ) ON CONFLICT DO NOTHING;
        ''', (hl_id, hl_name, hl_type, hl_sev, hl_buf or 150.0, hl_wkt))
        print(f'  [SIMULATED] Linked benchmark layer "{hl_name}" to hazard_evidence_features')

    conn.commit()
    cur.execute('SELECT COUNT(*) FROM hazard_evidence_features;')
    total_feats = cur.fetchone()[0]
    print(f'[OK] Ingested {len(REAL_HAZARD_FEATURES)} real features. Total in table: {total_feats}')
    return inserted_ids


# ============================================================
# 3. COMPUTE SETTLEMENT HAZARD EXPOSURES (METRIC SPATIAL JOINS)
# ============================================================

def compute_settlement_exposures(conn):
    print('\n============================================================')
    print('2. COMPUTING METRIC SPATIAL JOINS (SETTLEMENT EXPOSURES)')
    print('============================================================')
    cur = conn.cursor()

    # Clear previous exposure calculations for clean idempotency
    cur.execute('TRUNCATE TABLE settlement_hazard_exposures RESTART IDENTITY;')
    conn.commit()

    # Join 1: Polygons / Hard Exclusion Containment (ST_Intersects / ST_Within)
    print('Computing Polygon Containment & Hard Exclusions...')
    cur.execute('''
        INSERT INTO settlement_hazard_exposures (
            settlement_id, hazard_feature_id, relationship, distance_meters,
            exposure_classification, interpretation, confidence, analysis_version, metadata
        )
        SELECT 
            cs.id,
            hef.id,
            'WITHIN',
            0.00,
            'HARD_EXCLUSION',
            'Settlement centroid is located within the verified ' || hef.name || ' boundary. Permanent habitation prohibited under GIS hazard exclusion criteria.',
            hef.confidence,
            'v1.0-phase10',
            json_build_object('intersection_type', 'POINT_IN_POLYGON', 'hazard_type', hef.hazard_type, 'data_origin', hef.data_origin)
        FROM census_settlements cs
        CROSS JOIN hazard_evidence_features hef
        WHERE cs.geometry IS NOT NULL
          AND ST_GeometryType(hef.geometry) IN ('ST_Polygon', 'ST_MultiPolygon')
          AND ST_Intersects(cs.geometry, hef.geometry)
        ON CONFLICT (settlement_id, hazard_feature_id) DO NOTHING;
    ''')
    conn.commit()
    print(f'  [OK] Processed direct polygon intersections: {cur.rowcount} exposures.')

    # Join 2: Landslide Proximity (within 2,500m)
    print('Computing Landslide Proximity (< 2,500m)...')
    cur.execute('''
        INSERT INTO settlement_hazard_exposures (
            settlement_id, hazard_feature_id, relationship, distance_meters,
            exposure_classification, interpretation, confidence, analysis_version, metadata
        )
        SELECT 
            cs.id,
            hef.id,
            'NEAR',
            ROUND(ST_Distance(cs.geometry::geography, hef.geometry::geography)::numeric, 2) AS dist_m,
            CASE 
                WHEN ST_Distance(cs.geometry::geography, hef.geometry::geography) <= 500 THEN 'WARNING'
                ELSE 'INFORMATIONAL'
            END AS exp_class,
            CASE 
                WHEN ST_Distance(cs.geometry::geography, hef.geometry::geography) <= 500 THEN
                    'Observed landslide incidence (' || hef.name || ') located ' || 
                    ROUND(ST_Distance(cs.geometry::geography, hef.geometry::geography)::numeric, 0)::text || 
                    ' m from settlement centroid. Field geotechnical verification required.'
                ELSE
                    'Recorded landslide inventory feature (' || hef.name || ') is ' || 
                    ROUND(ST_Distance(cs.geometry::geography, hef.geometry::geography)::numeric, 0)::text || 
                    ' m from settlement centroid.'
            END AS interp,
            hef.confidence,
            'v1.0-phase10',
            json_build_object('metric_distance_m', ROUND(ST_Distance(cs.geometry::geography, hef.geometry::geography)::numeric, 2), 'hazard_type', hef.hazard_type, 'data_origin', hef.data_origin)
        FROM census_settlements cs
        CROSS JOIN hazard_evidence_features hef
        WHERE cs.geometry IS NOT NULL
          AND hef.hazard_type = 'landslide'
          AND ST_DWithin(cs.geometry::geography, hef.geometry::geography, 2500)
        ON CONFLICT (settlement_id, hazard_feature_id) DO NOTHING;
    ''')
    conn.commit()
    print(f'  [OK] Processed landslide proximities: {cur.rowcount} exposures.')

    # Join 3: Mapped River Corridor Proximity (< 1,000m)
    print('Computing Mapped River Corridor Proximity (< 1,000m)...')
    cur.execute('''
        INSERT INTO settlement_hazard_exposures (
            settlement_id, hazard_feature_id, relationship, distance_meters,
            exposure_classification, interpretation, confidence, analysis_version, metadata
        )
        SELECT 
            cs.id,
            hef.id,
            'NEAR',
            ROUND(ST_Distance(cs.geometry::geography, hef.geometry::geography)::numeric, 2) AS dist_m,
            CASE 
                WHEN ST_Distance(cs.geometry::geography, hef.geometry::geography) <= 150 THEN 'WARNING'
                ELSE 'INFORMATIONAL'
            END AS exp_class,
            CASE 
                WHEN ST_Distance(cs.geometry::geography, hef.geometry::geography) <= 150 THEN
                    'Settlement centroid is located within ' || 
                    ROUND(ST_Distance(cs.geometry::geography, hef.geometry::geography)::numeric, 0)::text || 
                    ' m riparian buffer of mapped river corridor (' || hef.name || '). Riparian setback and flood surge monitoring advised.'
                ELSE
                    'Mapped river corridor (' || hef.name || ') is located ' || 
                    ROUND(ST_Distance(cs.geometry::geography, hef.geometry::geography)::numeric, 0)::text || 
                    ' m from settlement centroid.'
            END AS interp,
            hef.confidence,
            'v1.0-phase10',
            json_build_object('metric_distance_m', ROUND(ST_Distance(cs.geometry::geography, hef.geometry::geography)::numeric, 2), 'hazard_type', hef.hazard_type, 'data_origin', hef.data_origin)
        FROM census_settlements cs
        CROSS JOIN hazard_evidence_features hef
        WHERE cs.geometry IS NOT NULL
          AND hef.hazard_type = 'riverine_corridor'
          AND ST_DWithin(cs.geometry::geography, hef.geometry::geography, 1000)
        ON CONFLICT (settlement_id, hazard_feature_id) DO NOTHING;
    ''')
    conn.commit()
    print(f'  [OK] Processed river corridor proximities: {cur.rowcount} exposures.')

    # Join 4: Historical Earthquake Proximity (< 35,000m / 35 km)
    print('Computing Historical Earthquake Epicenter Proximity (< 35 km)...')
    cur.execute('''
        INSERT INTO settlement_hazard_exposures (
            settlement_id, hazard_feature_id, relationship, distance_meters,
            exposure_classification, interpretation, confidence, analysis_version, metadata
        )
        SELECT 
            cs.id,
            hef.id,
            'NEAR',
            ROUND(ST_Distance(cs.geometry::geography, hef.geometry::geography)::numeric, 2) AS dist_m,
            'INFORMATIONAL' AS exp_class,
            'Settlement is located ' || 
            ROUND((ST_Distance(cs.geometry::geography, hef.geometry::geography) / 1000.0)::numeric, 1)::text || 
            ' km from historical major earthquake epicenter (' || hef.name || ') recorded by National Center for Seismology.' AS interp,
            hef.confidence,
            'v1.0-phase10',
            json_build_object('metric_distance_km', ROUND((ST_Distance(cs.geometry::geography, hef.geometry::geography) / 1000.0)::numeric, 1), 'hazard_type', hef.hazard_type, 'data_origin', hef.data_origin)
        FROM census_settlements cs
        CROSS JOIN hazard_evidence_features hef
        WHERE cs.geometry IS NOT NULL
          AND hef.hazard_type = 'earthquake'
          AND ST_DWithin(cs.geometry::geography, hef.geometry::geography, 35000)
        ON CONFLICT (settlement_id, hazard_feature_id) DO NOTHING;
    ''')
    conn.commit()
    print(f'  [OK] Processed earthquake epicenter proximities: {cur.rowcount} exposures.')

    cur.execute('''
        SELECT 
            COUNT(*) as total_exposures,
            COUNT(DISTINCT settlement_id) as settlements_with_exposure,
            COUNT(CASE WHEN exposure_classification = 'HARD_EXCLUSION' THEN 1 END) as hard_exclusions,
            COUNT(CASE WHEN exposure_classification = 'WARNING' THEN 1 END) as warnings,
            COUNT(CASE WHEN exposure_classification = 'INFORMATIONAL' THEN 1 END) as informationals
        FROM settlement_hazard_exposures;
    ''')
    res = cur.fetchone()
    print(f'[OK] Total Exposure Links: {res[0]} across {res[1]} distinct settlements.')
    print(f'     Hard Exclusions: {res[2]} | Warnings: {res[3]} | Informational: {res[4]}')


# ============================================================
# 4. TERRAIN POLICY ENFORCEMENT (DEM BOUNDS AUDIT)
# ============================================================

def populate_terrain_features(conn):
    print('\n============================================================')
    print('3. TERRAIN POLICY ENFORCEMENT (DEM BOUNDS & INTEGRITY)')
    print('============================================================')
    cur = conn.cursor()

    # Per Prompt 10 Section 36:
    # "Do not use Gujarat DEM tiles for Uttarakhand analysis.
    #  If Uttarakhand DEM is unavailable: terrain fields remain: UNAVAILABLE."
    print('Enforcing DEM policy: Marking Uttarakhand settlements as terrain UNAVAILABLE...')
    cur.execute('''
        INSERT INTO settlement_terrain_features (
            settlement_id, elevation_meters, slope_degrees, aspect_degrees,
            terrain_status, source, provenance, metadata
        )
        SELECT 
            cs.id,
            NULL,
            NULL,
            NULL,
            'UNAVAILABLE',
            'Cartosat-1 DEM Archive',
            'Terrain data unavailable: Study area out of Cartosat DEM bounds (Gujarat tiles 68E-70E excluded per data policy)',
            '{"dem_policy": "NO_GUJARAT_DEM_FOR_UTTARAKHAND", "elevation_verified": false}'::jsonb
        FROM census_settlements cs
        ON CONFLICT (settlement_id) DO UPDATE SET
            terrain_status = 'UNAVAILABLE',
            elevation_meters = NULL,
            slope_degrees = NULL,
            aspect_degrees = NULL,
            provenance = 'Terrain data unavailable: Study area out of Cartosat DEM bounds (Gujarat tiles 68E-70E excluded per data policy)';
    ''')
    conn.commit()
    cur.execute('SELECT COUNT(*) FROM settlement_terrain_features WHERE terrain_status = \'UNAVAILABLE\';')
    count = cur.fetchone()[0]
    print(f'[OK] Ingested {count} settlements into settlement_terrain_features with UNAVAILABLE status.')


# ============================================================
# 5. HISTORICAL DISASTER LINKAGES (DDMP & NDMA)
# ============================================================

def populate_historical_events(conn):
    print('\n============================================================')
    print('4. HISTORICAL DISASTER EVIDENCE LINKAGES')
    print('============================================================')
    cur = conn.cursor()

    cur.execute('TRUNCATE TABLE settlement_historical_events RESTART IDENTITY;')

    # Specific documented settlement disaster events from Chamoli DDMP 2026-27 & NDEM
    historical_matches = [
        # (Settlement Name / Census Code, Disaster Type, Event Name, Event Date, Precision, Distance, Deaths, Damaged Houses, Source)
        ('040813', 'Flash Flood / Rock Avalanche', '2021 Chamoli Glacier & Debris Flood Surge', '2021-02-07', 'POINT_COORDINATE', 0.0, 204, 12, 'WIHG / DDMP 2021 Special Report'),
        ('800291', 'Land Subsidence', '2023 Joshimath Land Subsidence Crisis', '2023-01-02', 'SETTLEMENT_MATCH', 0.0, 0, 868, 'CBRI / DDMA Chamoli 2023 Executive Survey'),
        ('040810', 'Debris Flow', '2021 Upper Valley Monsoon Debris Inundation', '2021-07-18', 'SETTLEMENT_MATCH', 0.0, 0, 4, 'Chamoli DDMP 2026-27 Page 53'),
        ('041838', 'Riverbank Erosion', '2020 Pindar River Surge & Bank Cut', '2020-08-23', 'SETTLEMENT_MATCH', 0.0, 2, 18, 'DDMA Chamoli Incident Register'),
        ('040925', 'Landslide', 'Chhinka Chronic Monsoon Road Cut Slump', '2017-07-28', 'SETTLEMENT_MATCH', 0.0, 0, 6, 'Chamoli DDMP 2026-27 Page 42'),
        ('040926', 'Slope Failure', 'Math Village Creep & Structure Cracking', '2018-09-02', 'SETTLEMENT_MATCH', 0.0, 0, 14, 'Chamoli DDMP 2026-27 Page 43'),
        ('041498', 'Landslide', 'Kanol Monsoon Slope Mobilization', '2019-08-14', 'SETTLEMENT_MATCH', 0.0, 1, 9, 'Chamoli DDMP 2026-27 Page 57'),
    ]

    inserted = 0
    for code, dtype, ename, edate, prec, dist, deaths, houses, src in historical_matches:
        cur.execute('''
            SELECT id FROM census_settlements WHERE settlement_code = %s;
        ''', (code,))
        row = cur.fetchone()
        if row:
            s_id = row[0]
            cur.execute('''
                INSERT INTO settlement_historical_events (
                    settlement_id, event_name, disaster_type, event_date,
                    spatial_precision, distance_meters, deaths_total,
                    houses_damaged_total, source, provenance
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, 'DDMP / NDEM Documented Historical Record'
                );
            ''', (s_id, ename, dtype, edate, prec, dist, deaths, houses, src))
            inserted += 1

    conn.commit()
    print(f'[OK] Ingested {inserted} spatially matched settlement disaster records.')


def main():
    t0 = time.time()
    print('============================================================')
    print('VISTHAAPAN PORTAL - PHASE 10 SPATIAL HAZARD PROCESSING')
    print('============================================================')

    conn = get_db()
    try:
        ingest_hazard_features(conn)
        compute_settlement_exposures(conn)
        populate_terrain_features(conn)
        populate_historical_events(conn)
        dur = round(time.time() - t0, 2)
        print(f'\n============================================================')
        print(f'PHASE 10 SPATIAL HAZARD ENGINE COMPLETED IN {dur}s')
        print(f'============================================================\n')
    finally:
        conn.close()


if __name__ == '__main__':
    main()
