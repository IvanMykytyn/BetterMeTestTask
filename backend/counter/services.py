import pandas as pd
from shapely.geometry import Point
from decimal import Decimal

from .models import (
    OrderTaxRecord,
    StateTaxRate,
    CountyTaxRate,
    CityTaxRate,
    SpecialTaxRate,
)
from .geo_loader import cities_gdf, counties_gdf

def validate_csv(file):
    """
    Быстрая проверка CSV файла:
    - все нужные колонки есть
    - даты в колонке 'timestamp' в формате ISO 8601: YYYY-MM-DDTHH:MM:SS (или с микросекундами)
    - subtotal, latitude, longitude не пустые и имеют корректный тип
    - это безопасно так как не создаём циклы для каждой строки, 
      используем векторные проверки pandas
    Возвращает [] если ошибок нет, или [<сообщение об ошибке>] если есть.
    """
    required_columns = ["timestamp", "latitude", "longitude", "subtotal"]
    # Попытка прочитать CSV
    try:
        df = pd.read_csv(file)
    except Exception as e:
        return [f"Cannot read CSV: {e}"]
    # Проверка обязательных колонок
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        return [f"Missing required columns: {', '.join(missing_cols)}"]
    # Проверка на пустые значения
    if df[required_columns].isna().any().any():
        return ["Документ содержит пустые ячейки"]
    # Проверка формата даты
    try:
        # допускаем микросекунды, но ошибки будут пойманы
        pd.to_datetime(df["timestamp"], errors="raise", utc=True)
    except Exception:
        return ["Документ содержит некорректные даты"]
    # Проверка типов данных для чисел
    for col in ["latitude", "longitude", "subtotal"]:
        if not pd.api.types.is_numeric_dtype(df[col]):
            return [f"Колонка '{col}' должна содержать только числа"]
    # Если ошибок нет
    return []



def create_order_from_data(timestamp, latitude, longitude, subtotal):
    """
   Создает запись в OrderTaxRecord на основе данных о 4х позициях:
    - смотрит на точку на карт
    - смотрит в шейпфайле какой город и округ
    - по условию штат всегда NY
    - смотрит в БД ставки для этих юрисдикций
    """
    point = Point(longitude, latitude)
    # ищем округ
    county_match = counties_gdf[counties_gdf.contains(point)]
    county = county_match.iloc[0]["NAME"] if not county_match.empty else None
    # ищем город
    city_match = cities_gdf[cities_gdf.contains(point)]
    city = city_match.iloc[0]["NAME"] if not city_match.empty else None
    # штат по условию всегда NY
    state = "NY"
    # ищем ставки с БД
    state_rate_obj = StateTaxRate.objects.filter(state_name=state).first()
    county_rate_obj = CountyTaxRate.objects.filter(county_name=county).first()
    city_rate_obj = CityTaxRate.objects.filter(city_name=city).first()
    special_rate_obj = SpecialTaxRate.objects.filter(
        city_or_county_name__in=[city, county]
    ).first()
    # создаем запись в БД OrderTaxRecord
    return OrderTaxRecord.objects.create(
        purchase_date=timestamp,
        latitude=latitude,
        longitude=longitude,
        subtotal=Decimal(str(subtotal)),
        state_name=state,
        county_name=county,
        city_name=city,
        state_rate=state_rate_obj.state_rate if state_rate_obj else 0,
        county_rate=county_rate_obj.county_rate if county_rate_obj else 0,
        city_rate=city_rate_obj.city_rate if city_rate_obj else 0,
        special_rates=special_rate_obj.special_rate if special_rate_obj else 0,
    )


def process_orders_csv(file):
    """
    Читает CSV файл с заказами и создает записи в OrderTaxRecord для каждой строки.
     - ожидается, что CSV файл уже прошел валидацию через validate_csv()
    """
    # Читаем CSV в DataFrame
    df = pd.read_csv(file)
    # конвертируем колонку timestamp в datetime
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    # проходим по строкам и создаем записи в БД OrderTaxRecord
    for row in df.itertuples(index=False):
        create_order_from_data(
            timestamp=row.timestamp,
            latitude=row.latitude,
            longitude=row.longitude,
            subtotal=row.subtotal,
        )

def process_manual_order(data):
    """
    Создает запись в OrderTaxRecord из данных формы.
    Предполагается, что данные валидные и непустые.
    """
    # Конвертируем timestamp в datetime
    timestamp = pd.to_datetime(data["timestamp"])

    # Создаем запись через create_order_from_data
    create_order_from_data(
        timestamp=timestamp,
        latitude=data["latitude"],
        longitude=data["longitude"],
        subtotal=data["subtotal"],
    )