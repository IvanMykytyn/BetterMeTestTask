import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
from decimal import Decimal
from datetime import timedelta
import time

from .models import (
    OrderTaxRecord,
    StateTaxRate,
    CountyTaxRate,
    CityTaxRate,
    SpecialTaxRate,
)



def process_orders_csv(file):

    start_time = time.time()

    CITIES_SHP = "backend/shapefiles/tl_2025_36_place.shp"
    COUNTIES_SHP = "backend/shapefiles/tl_2025_us_county.shp"

    cities_gdf = gpd.read_file(CITIES_SHP).to_crs(epsg=4326)
    counties_gdf = gpd.read_file(COUNTIES_SHP).to_crs(epsg=4326)

    df = pd.read_csv(file)

    df["timestamp"] = pd.to_datetime(df["timestamp"])

    df["geometry"] = df.apply(
        lambda row: Point(row["longitude"], row["latitude"]), axis=1
    )

    orders_gdf = gpd.GeoDataFrame(df, geometry="geometry", crs="EPSG:4326")

    orders_with_county = gpd.sjoin(
        orders_gdf, counties_gdf, how="left", predicate="intersects"
    )

    orders_with_county = orders_with_county.drop(columns=["index_right"])

    orders_with_city = gpd.sjoin(
        orders_with_county, cities_gdf, how="left", predicate="intersects"
    )

    for _, row in orders_with_city.iterrows():

        state = "NY"

        county = row.get("NAME_left")
        city = row.get("NAME_right")

        if pd.isna(county):
            county = None
        if pd.isna(city):
            city = None

        state_rate_obj = StateTaxRate.objects.filter(state_name=state).first()
        county_rate_obj = CountyTaxRate.objects.filter(county_name=county).first()
        city_rate_obj = CityTaxRate.objects.filter(city_name=city).first()
        special_rate_obj = SpecialTaxRate.objects.filter(
            city_or_county_name__in=[city, county]
        ).first()

        OrderTaxRecord.objects.create(
            purchase_date=row["timestamp"],
            latitude=row["latitude"],
            longitude=row["longitude"],
            subtotal=Decimal(str(row["subtotal"])),
            state_name=state,
            county_name=county,
            city_name=city,
            state_rate=state_rate_obj.state_rate if state_rate_obj else 0,
            county_rate=county_rate_obj.county_rate if county_rate_obj else 0,
            city_rate=city_rate_obj.city_rate if city_rate_obj else 0,
            special_rates=special_rate_obj.special_rate if special_rate_obj else 0,
        )

        end_time = time.time()
        elapsed = timedelta(seconds=end_time - start_time)
        print(f"Обрабка файлу зайняла {elapsed}")