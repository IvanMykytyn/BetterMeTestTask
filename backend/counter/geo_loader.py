import geopandas as gpd

CITIES_SHP = "shapefiles/tl_2025_36_place.shp"
COUNTIES_SHP = "shapefiles/tl_2025_us_county.shp"

cities_gdf = gpd.read_file(CITIES_SHP).to_crs(epsg=4326)
counties_gdf = gpd.read_file(COUNTIES_SHP).to_crs(epsg=4326)