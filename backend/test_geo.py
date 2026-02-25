import os
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

# ------------------------------
# Шляхи
# ------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
shapefile_dir = os.path.join(BASE_DIR, "shapefiles")

cities_path = os.path.join(shapefile_dir, "tl_2025_36_place.shp")
counties_path = os.path.join(shapefile_dir, "tl_2025_us_county.shp")
csv_path = os.path.join(BASE_DIR, "orders.csv")

print("Завантаження шейпфайлів...")

cities_gdf = gpd.read_file(cities_path)
counties_gdf = gpd.read_file(counties_path)

cities_gdf = cities_gdf.to_crs(epsg=4269)
counties_gdf = counties_gdf.to_crs(epsg=4269)

print("Шейпфайли завантажено")

# ------------------------------
# CSV
# ------------------------------
df = pd.read_csv(csv_path)

orders_gdf = gpd.GeoDataFrame(
    df,
    geometry=[Point(xy) for xy in zip(df.longitude, df.latitude)],
    crs="EPSG:4269"
)

# ------------------------------
# JOIN 1 — міста
# ------------------------------
orders_with_city = gpd.sjoin(
    orders_gdf,
    cities_gdf[['NAME', 'geometry']],
    how="left",
    predicate="within"
)

# Переіменовуємо колонку міста
orders_with_city = orders_with_city.rename(columns={"NAME": "city_name"})

# Видаляєм службову колонку
orders_with_city = orders_with_city.drop(columns=["index_right"], errors="ignore")

# ------------------------------
# JOIN 2 — округа
# ------------------------------
orders_with_county = gpd.sjoin(
    orders_with_city,
    counties_gdf[['NAME', 'geometry']],
    how="left",
    predicate="within"
)

orders_with_county = orders_with_county.rename(columns={"NAME": "county_name"})
orders_with_county = orders_with_county.drop(columns=["index_right"], errors="ignore")

# ------------------------------
# Результат
# ------------------------------
print("\nРЕЗУЛЬТАТ:\n")

for _, row in orders_with_county.iterrows():
    print("-----")
    print(f"Координати: {row['latitude']}, {row['longitude']}")
    print(f"Місто: {row.get('city_name')}")
    print(f"Округ: {row.get('county_name')}")