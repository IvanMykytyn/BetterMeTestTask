# import geopandas as gpd

# CITIES_SHP = "shapefiles/tl_2025_36_place.shp"
# COUNTIES_SHP = "shapefiles/tl_2025_us_county.shp"

# cities_gdf = gpd.read_file(CITIES_SHP).to_crs(epsg=4326)
# counties_gdf = gpd.read_file(COUNTIES_SHP).to_crs(epsg=4326)
'''
Раніше ми напряму працювали з шейпфайлами, а тепер
ми привели дані з них до формату GeoJSON і завантажуємо
їх в пам'ять при старті сервера. 

Код у цьому файлы відповідає за завантаження цих даних
і підготовку їх для швидкого пошуку при обробці замовлень.
'''

import json
from shapely.geometry import shape
from shapely.strtree import STRtree

COUNTIES = []
CITIES = []
COUNTIES_TREE = None
CITIES_TREE = None

def load_geo_data():
    global COUNTIES, CITIES, COUNTIES_TREE, CITIES_TREE

    # Load NY counties GeoJSON (stored in backend/data/ny_counties.geojson)
    with open("data/ny_counties.geojson") as f:
        data = json.load(f)
        for feature in data["features"]:
            polygon = shape(feature["geometry"])
            name = feature["properties"]["NAME"]
            COUNTIES.append({"name": name, "polygon": polygon})
    COUNTIES_TREE = STRtree([c["polygon"] for c in COUNTIES])


    # Load NY places (cities) GeoJSON (stored in backend/data/ny_places.geojson)
    with open("data/ny_places.geojson") as f:
        data = json.load(f)
        for feature in data["features"]:
            polygon = shape(feature["geometry"])
            name = feature["properties"]["NAME"]
            CITIES.append({"name": name, "polygon": polygon})
    CITIES_TREE = STRtree([c["polygon"] for c in CITIES])