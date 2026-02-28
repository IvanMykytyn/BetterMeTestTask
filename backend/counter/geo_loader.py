import json
from shapely.geometry import shape
from shapely.strtree import STRtree
from django.conf import settings
from pathlib import Path

COUNTIES = []
CITIES = []
COUNTIES_TREE = None
CITIES_TREE = None


def load_geo_data():
    global COUNTIES, CITIES, COUNTIES_TREE, CITIES_TREE

    # Load NY counties GeoJSON (stored in backend/data/ny_counties.geojson)
    counties_file = Path(settings.BASE_DIR) / "data" / "ny_counties.geojson"
    cities_file = Path(settings.BASE_DIR) / "data" / "ny_places.geojson"

    with open(counties_file) as f:
        data = json.load(f)
        print("Counties CRS field:", data.get("crs"))
        for feature in data["features"]:
            polygon = shape(feature["geometry"])
            name = feature["properties"]["NAME"]
            COUNTIES.append({"name": name, "polygon": polygon})
    COUNTIES_TREE = STRtree([c["polygon"] for c in COUNTIES])

    # Load NY places (cities) GeoJSON (stored in backend/data/ny_places.geojson)
    with open(cities_file) as f:
        data = json.load(f)
        print("Cities CRS field:", data.get("crs"))
        for feature in data["features"]:
            polygon = shape(feature["geometry"])
            # choose the property that actually exists in your GeoJSON:
            # name = feature["properties"]["NAMELSAD"]  # full name
            name = feature["properties"]["NAME"]        # short name
            CITIES.append({"name": name, "polygon": polygon})
    CITIES_TREE = STRtree([c["polygon"] for c in CITIES])