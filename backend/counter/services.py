from decimal import Decimal
from datetime import timedelta
import os
import time
from typing import Dict, Optional, Tuple

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point

from .models import (
    OrderTaxRecord,
    StateTaxRate,
    CountyTaxRate,
    CityTaxRate,
    SpecialTaxRate,
)


# ---------------------------------------------------------------------------
# Internal helpers for loading and caching shapefiles
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHAPEFILES_DIR = os.path.join(BASE_DIR, "shapefiles")

CITIES_SHP_PATH = os.path.join(SHAPEFILES_DIR, "tl_2025_36_place.shp")
COUNTIES_SHP_PATH = os.path.join(SHAPEFILES_DIR, "tl_2025_us_county.shp")

_CITIES_GDF: Optional[gpd.GeoDataFrame] = None
_COUNTIES_GDF: Optional[gpd.GeoDataFrame] = None


# Mapping from TIGER/Line state FIPS codes to two-letter state/territory codes.
# This lets us keep tax tables generic and not tied to a single state.
STATE_FIPS_TO_CODE = {
    "01": "AL",
    "02": "AK",
    "04": "AZ",
    "05": "AR",
    "06": "CA",
    "08": "CO",
    "09": "CT",
    "10": "DE",
    "11": "DC",
    "12": "FL",
    "13": "GA",
    "15": "HI",
    "16": "ID",
    "17": "IL",
    "18": "IN",
    "19": "IA",
    "20": "KS",
    "21": "KY",
    "22": "LA",
    "23": "ME",
    "24": "MD",
    "25": "MA",
    "26": "MI",
    "27": "MN",
    "28": "MS",
    "29": "MO",
    "30": "MT",
    "31": "NE",
    "32": "NV",
    "33": "NH",
    "34": "NJ",
    "35": "NM",
    "36": "NY",
    "37": "NC",
    "38": "ND",
    "39": "OH",
    "40": "OK",
    "41": "OR",
    "42": "PA",
    "44": "RI",
    "45": "SC",
    "46": "SD",
    "47": "TN",
    "48": "TX",
    "49": "UT",
    "50": "VT",
    "51": "VA",
    "53": "WA",
    "54": "WV",
    "55": "WI",
    "56": "WY",
    # Territories often present in nationwide TIGER/Line county files
    "60": "AS",
    "66": "GU",
    "69": "MP",
    "72": "PR",
    "78": "VI",
}


def _load_shapefiles() -> Tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    """
    Lazily load and cache city and county shapefiles in WGS84 (EPSG:4326).

    The city layer is optional: if the corresponding shapefile is not
    available, an empty GeoDataFrame is used so that callers can still
    function (they will simply resolve no city names).
    """
    global _CITIES_GDF, _COUNTIES_GDF

    if _COUNTIES_GDF is None:
        _COUNTIES_GDF = gpd.read_file(COUNTIES_SHP_PATH).to_crs(epsg=4326)

    if _CITIES_GDF is None:
        if os.path.exists(CITIES_SHP_PATH):
            _CITIES_GDF = gpd.read_file(CITIES_SHP_PATH).to_crs(epsg=4326)
        else:
            _CITIES_GDF = gpd.GeoDataFrame(
                columns=["NAME", "geometry"],
                geometry="geometry",
                crs="EPSG:4326",
            )

    return _CITIES_GDF, _COUNTIES_GDF


def resolve_jurisdictions(
    latitude: float,
    longitude: float,
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Given a point (lat, lon), determine the state, county, and (optionally)
    city names using spatial joins against the cached shapefiles.

    Returns:
        (state_code, county_name, city_name)
    """
    cities_gdf, counties_gdf = _load_shapefiles()

    point = Point(float(longitude), float(latitude))

    point_gdf = gpd.GeoDataFrame(
        [{"geometry": point}],
        geometry="geometry",
        crs="EPSG:4326",
    )

    # Join with counties to get county name and state FIPS code
    with_county = gpd.sjoin(
        point_gdf,
        counties_gdf[["STATEFP", "NAME", "geometry"]],
        how="left",
        predicate="within",
    )

    row = with_county.iloc[0]
    state_fips: Optional[str] = row.get("STATEFP")
    county_name: Optional[str] = row.get("NAME")

    state_code: Optional[str] = None
    if isinstance(state_fips, str):
        state_code = STATE_FIPS_TO_CODE.get(state_fips)

    # Optionally join with cities if we have a non-empty city layer
    city_name: Optional[str] = None
    if not cities_gdf.empty:
        with_city = gpd.sjoin(
            with_county.drop(columns=["index_right"], errors="ignore"),
            cities_gdf[["NAME", "geometry"]],
            how="left",
            predicate="within",
        )
        city_candidate = with_city.iloc[0].get("NAME")
        if not pd.isna(city_candidate):
            city_name = city_candidate

    if pd.isna(county_name):
        county_name = None

    return state_code, county_name, city_name


def calculate_tax(
    latitude: float,
    longitude: float,
    timestamp,
    subtotal,
) -> Dict[str, object]:
    """
    Core tax calculation service used by the API.

    - Maps (lat, lon) to city & county using shapefiles.
    - Looks up state / county / city / special tax rates.
    - Computes composite rate, tax amount, and total amount.

    Returns a dict with all computed values and jurisdiction names.
    """
    state_name, county_name, city_name = resolve_jurisdictions(latitude, longitude)

    state_rate_obj = (
        StateTaxRate.objects.filter(state_name=state_name).first()
        if state_name
        else None
    )
    county_rate_obj = (
        CountyTaxRate.objects.filter(county_name=county_name).first()
        if county_name
        else None
    )
    city_rate_obj = (
        CityTaxRate.objects.filter(city_name=city_name).first() if city_name else None
    )
    special_rate_obj = SpecialTaxRate.objects.filter(
        city_or_county_name__in=[name for name in [city_name, county_name] if name]
    ).first()

    state_rate = state_rate_obj.state_rate if state_rate_obj else Decimal("0")
    county_rate = county_rate_obj.county_rate if county_rate_obj else Decimal("0")
    city_rate = city_rate_obj.city_rate if city_rate_obj else Decimal("0")
    special_rate = special_rate_obj.special_rate if special_rate_obj else Decimal("0")

    composite_tax_rate = state_rate + county_rate + city_rate + special_rate

    subtotal_dec = subtotal if isinstance(subtotal, Decimal) else Decimal(str(subtotal))

    tax_amount = subtotal_dec * composite_tax_rate
    total_amount = subtotal_dec + tax_amount

    jurisdictions = [state_name]
    if county_name:
        jurisdictions.append(county_name)
    if city_name:
        jurisdictions.append(city_name)

    return {
        "state_name": state_name,
        "county_name": county_name,
        "city_name": city_name,
        "state_rate": state_rate,
        "county_rate": county_rate,
        "city_rate": city_rate,
        "special_rate": special_rate,
        "composite_tax_rate": composite_tax_rate,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "jurisdictions": jurisdictions,
        "timestamp": timestamp,
        "latitude": latitude,
        "longitude": longitude,
        "subtotal": subtotal_dec,
    }


def process_orders_csv(file):
    """
    Existing batch CSV importer that uses the same tax data,
    kept for compatibility with the earlier implementation.
    """
    start_time = time.time()

    cities_gdf, counties_gdf = _load_shapefiles()

    df = pd.read_csv(file)
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    df["geometry"] = df.apply(
        lambda row: Point(row["longitude"], row["latitude"]), axis=1
    )

    orders_gdf = gpd.GeoDataFrame(df, geometry="geometry", crs="EPSG:4326")

    orders_with_county = gpd.sjoin(
        orders_gdf, counties_gdf, how="left", predicate="within"
    )

    orders_with_county = orders_with_county.drop(columns=["index_right"])

    orders_with_city = gpd.sjoin(
        orders_with_county, cities_gdf, how="left", predicate="within"
    )

    for _, row in orders_with_city.iterrows():
        state_fips = row.get("STATEFP_left")
        county = row.get("NAME_left")
        city = row.get("NAME_right")

        # Map state FIPS to two-letter code where possible. If we don't have a
        # mapping (or the point is outside the US dataset), state_name will be None
        # and the state tax rate lookup will safely fall back to zero.
        state_name = None
        if isinstance(state_fips, str):
            state_name = STATE_FIPS_TO_CODE.get(state_fips)

        if pd.isna(county):
            county = None
        if pd.isna(city):
            city = None

        state_rate_obj = (
            StateTaxRate.objects.filter(state_name=state_name).first()
            if state_name
            else None
        )
        county_rate_obj = (
            CountyTaxRate.objects.filter(county_name=county).first() if county else None
        )
        city_rate_obj = (
            CityTaxRate.objects.filter(city_name=city).first() if city else None
        )
        special_rate_obj = SpecialTaxRate.objects.filter(
            city_or_county_name__in=[name for name in [city, county] if name]
        ).first()

        OrderTaxRecord.objects.create(
            purchase_date=row["timestamp"],
            latitude=row["latitude"],
            longitude=row["longitude"],
            subtotal=Decimal(str(row["subtotal"])),
            state_name=state_name or "",
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