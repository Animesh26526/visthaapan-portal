import zipfile
import io
import shapefile
import pyproj
import pandas as pd
import os

print("=== 1. SURVEY OF INDIA BOUNDARIES ===")
soi_zip_path = "data/File_244196_1a28b420a95048ea9fc5e50d1303ff83.zip"
with zipfile.ZipFile(soi_zip_path) as z:
    prj_text = z.read("05/UTTARAKHAND_DISTRICT_BDY.prj").decode("utf-8", errors="ignore")
    print(f"PRJ: {prj_text}")
    crs_lcc = pyproj.CRS.from_wkt(prj_text)
    crs_4326 = pyproj.CRS.from_epsg(4326)
    transformer = pyproj.Transformer.from_crs(crs_lcc, crs_4326, always_xy=True)

    shp_data = io.BytesIO(z.read("05/UTTARAKHAND_DISTRICT_BDY.shp"))
    dbf_data = io.BytesIO(z.read("05/UTTARAKHAND_DISTRICT_BDY.dbf"))
    shx_data = io.BytesIO(z.read("05/UTTARAKHAND_DISTRICT_BDY.shx"))
    r = shapefile.Reader(shp=shp_data, dbf=dbf_data, shx=shx_data)
    print(f"Districts count: {len(r)}")
    for rec, shape in zip(r.records(), r.shapes()):
        min_lng, min_lat = transformer.transform(shape.bbox[0], shape.bbox[1])
        max_lng, max_lat = transformer.transform(shape.bbox[2], shape.bbox[3])
        d_name = rec["DISTRICT"]
        d_lgd = rec["DIST_LGD"]
        print(f"  District: {d_name} (LGD: {d_lgd}) -> BBox: Lng [{min_lng:.4f}, {max_lng:.4f}], Lat [{min_lat:.4f}, {max_lat:.4f}]")

print("\n=== 2. CENSUS 2011 TOWN DIRECTORY ===")
town_path = "data/DH_2011_DCHB_Town_Release_0500.xlsx"
xl_town = pd.ExcelFile(town_path)
print(f"Town sheets: {xl_town.sheet_names}")
df_town = xl_town.parse(xl_town.sheet_names[0], nrows=10)
print(f"Town shape: {df_town.shape}")
print("Town columns (first 20):", df_town.columns.tolist()[:20])
print(df_town.head(3).iloc[:, :8])

print("\n=== 3. CENSUS 2011 VILLAGE DIRECTORY ===")
village_path = "data/DH_2011_DCHB_Village_Release_0500.xlsx"
xl_vil = pd.ExcelFile(village_path)
print(f"Village sheets: {xl_vil.sheet_names}")
df_vil = xl_vil.parse(xl_vil.sheet_names[0], nrows=10)
print(f"Village shape: {df_vil.shape}")
print("Village columns (first 25):", df_vil.columns.tolist()[:25])
print(df_vil.head(3).iloc[:, :10])

print("\n=== 4. OSM NORTHERN ZONE EXTRACT ===")
osm_zip = "data/northern-zone-260916-free.shp.zip"
with zipfile.ZipFile(osm_zip) as z:
    files = [f.filename for f in z.infolist() if f.filename.endswith('.shp')]
    print("OSM Shapefiles inside archive:")
    for f in sorted(files):
        print(f"  {f}")
