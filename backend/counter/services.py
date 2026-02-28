import pandas as pd
from decimal import Decimal
from shapely.geometry import Point

from .geo_loader import COUNTIES, COUNTIES_TREE, CITIES, CITIES_TREE
from .models import (
    OrderTaxRecord,
    StateTaxRate,
    CountyTaxRate,
    CityTaxRate,
    SpecialTaxRate,
)


# CSV Validation
def validate_csv(file):
    """
     Quick check of CSV file:
    - all necessary fields are there
    - dates in the 'timestamp' column in ISO 8601 format
    - subtotal, latitude, longitude are not empty and numeric
    """
    required_columns = ["timestamp", "latitude", "longitude", "subtotal"]
    # Attempt to read CSV
    try:
        df = pd.read_csv(file)
    except Exception as e:
        return [f"Cannot read CSV: {e}"]
    # Checking the mandatory columns
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        return [f"Missing required columns: {', '.join(missing_cols)}"]
    # Check for empty values
    if df[required_columns].isna().any().any():
        return ["CSV contains empty values in required columns"]
    # Checking the date format
    try:
        # Allow microseconds, but errors will be caught
        pd.to_datetime(df["timestamp"], errors="raise", utc=True)
    except Exception:
        return ["CSV contains invalid timestamps in 'timestamp' column"]
    # Checking data types for numbers
    for col in ["latitude", "longitude", "subtotal"]:
        if not pd.api.types.is_numeric_dtype(df[col]):
            return [f'Column "latitude", "longitude", "subtotal" must contain only numbers']
    # If there are no errors, return an empty list
    return []


# Geo functions for searching the county and city by point:
def find_county(lat, lon):
    point = Point(lon, lat)  # Shapely uses (x, y) = (lon, lat)
    # First, we are looking for candidates through STRtree
    indices = COUNTIES_TREE.query(point)  # Shapely 2.x returns indexes
    for idx in indices:
        polygon = COUNTIES[idx]["polygon"]
        if polygon.contains(point):
            return COUNTIES[idx]["name"]
    return None


def find_city(lat, lon):
    point = Point(lon, lat)
    indices = CITIES_TREE.query(point)
    for idx in indices:
        polygon = CITIES[idx]["polygon"]
        if polygon.contains(point):
            return CITIES[idx]["name"]
    return None


# Creating an OrderTaxRecord object (without saving)
def create_order_object(timestamp, lat, lon, subtotal,
                        state_rate, county_rates, city_rates, special_rates):
    county = find_county(lat, lon)
    city = find_city(lat, lon)
    state = "NY"
    return OrderTaxRecord(
        purchase_date=timestamp,
        latitude=lat,
        longitude=lon,
        subtotal=Decimal(str(subtotal)),
        state_name=state,
        county_name=county,
        city_name=city,
        state_rate=state_rate,
        county_rate=county_rates.get(county, 0),
        city_rate=city_rates.get(city, 0),
        special_rates=special_rates.get(city, special_rates.get(county, 0)),
    )


# Bulk processing of CSV
def process_orders_csv(file):
    """
    Reads CSV and creates records in OrderTaxRecord.
    Suitable for large files (11k+ points).
    It is expected that the CSV file has already been validated via validate_csv()
    For mass loading, we do bulk_create for optimization.
    """
    # Reading CSV into a DataFrame
    df = pd.read_csv(file)
    # Convert the timestamp column to datetime (UTC, with timezone)
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    # Loading tax rates from the database once
    state_rate = StateTaxRate.objects.get(state_name="NY").state_rate
    county_rates = {
        c.county_name: c.county_rate for c in CountyTaxRate.objects.all()}
    city_rates = {c.city_name: c.city_rate for c in CityTaxRate.objects.all()}
    special_rates = {
        s.city_or_county_name: s.special_rate for s in SpecialTaxRate.objects.all()}
    # Create objects for bulk_create.
    # Important: call calculate_totals() before inserting, as bulk_create
    # does not call save() and, accordingly, does not recalculate the sums automatically.
    orders_to_create = []
    for row in df.itertuples(index=False):
        obj = create_order_object(
            timestamp=row.timestamp,
            lat=row.latitude,
            lon=row.longitude,
            subtotal=row.subtotal,
            state_rate=state_rate,
            county_rates=county_rates,
            city_rates=city_rates,
            special_rates=special_rates,
        )
        obj.calculate_totals()
        orders_to_create.append(obj)
    # Mass insertion
    OrderTaxRecord.objects.bulk_create(orders_to_create)


# Manual input
def process_manual_order(data):
    """
    Creates a record in OrderTaxRecord from form data.
    It is assumed that the data is valid and not empty.
    """
    # Convert timestamp to datetime (UTC, with timezone)
    timestamp = pd.to_datetime(data["timestamp"], utc=True)
    # We read the rates once
    state_rate = StateTaxRate.objects.get(state_name="NY").state_rate
    county_rates = {
        c.county_name: c.county_rate for c in CountyTaxRate.objects.all()}
    city_rates = {c.city_name: c.city_rate for c in CityTaxRate.objects.all()}
    special_rates = {
        s.city_or_county_name: s.special_rate for s in SpecialTaxRate.objects.all()}
    obj = create_order_object(
        timestamp=timestamp,
        lat=data["latitude"],
        lon=data["longitude"],
        subtotal=data["subtotal"],
        state_rate=state_rate,
        county_rates=county_rates,
        city_rates=city_rates,
        special_rates=special_rates,
    )
    obj.save()
    return obj