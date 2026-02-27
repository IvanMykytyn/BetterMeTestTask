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
# from .geo_loader import cities_gdf, counties_gdf - це намвже не потрібно,
# бо ми вже завантажили дані в пам'ять у вигляді списків і STRtree для швидкого пошуку, а не працюємо з GeoDataFrame напряму.


# -------------------------
# CSV Validation
# -------------------------
def validate_csv(file):
    """
    Быстрая проверка CSV файла:
    - все нужные колонки есть
    - даты в колонке 'timestamp' в формате ISO 8601
    - subtotal, latitude, longitude не пустые и числовые
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
        return ["CSV contains empty values in required columns"]
    # Проверка формата даты
    try:
        # допускаем микросекунды, но ошибки будут пойманы
        pd.to_datetime(df["timestamp"], errors="raise", utc=True)
    except Exception:
        return ["CSV contains invalid timestamps in 'timestamp' column"]
    # Проверка типов данных для чисел
    for col in ["latitude", "longitude", "subtotal"]:
        if not pd.api.types.is_numeric_dtype(df[col]):
            return [f'Column "latitude", "longitude", "subtotal" must contain only numbers']
    # Если ошибок нет
    return []


# -------------------------
# Гео функции для поиска округа и города по точке:
# -------------------------
def find_county(lat, lon):
    point = Point(lon, lat)  # shapely использует (x, y) = (lon, lat)
    # сначала ищем кандидатов через STRtree
    indices = COUNTIES_TREE.query(point)  # Shapely 2.x возвращает индексы
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


# -------------------------
# Создание объекта OrderTaxRecord (без сохранения)
# -------------------------
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


# -------------------------
# Массовая обработка CSV
# -------------------------
def process_orders_csv(file):
    """
    Читает CSV и создает записи в OrderTaxRecord.
    Подходит для больших файлов (11k+ точек).
    Ожидается, что CSV файл уже прошел валидацию через validate_csv()
    Для массовой загрузки делаем bulk_create для оптимизации
    """
    # Читаем CSV в DataFrame
    df = pd.read_csv(file)
    # конвертируем колонку timestamp в datetime (UTC, с таймзоной)
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)

    # Загружаем ставки из БД один раз
    state_rate = StateTaxRate.objects.get(state_name="NY").state_rate
    county_rates = {
        c.county_name: c.county_rate for c in CountyTaxRate.objects.all()}
    city_rates = {c.city_name: c.city_rate for c in CityTaxRate.objects.all()}
    special_rates = {
        s.city_or_county_name: s.special_rate for s in SpecialTaxRate.objects.all()}

    # Создаём объекты для bulk_create
    orders_to_create = [
        create_order_object(
            timestamp=row.timestamp,
            lat=row.latitude,
            lon=row.longitude,
            subtotal=row.subtotal,
            state_rate=state_rate,
            county_rates=county_rates,
            city_rates=city_rates,
            special_rates=special_rates,
        )
        for row in df.itertuples(index=False)
    ]

    # Массовая вставка
    OrderTaxRecord.objects.bulk_create(orders_to_create)


# -------------------------
# Ручной ввод
# -------------------------
def process_manual_order(data):
    """
    Создает запись в OrderTaxRecord из данных формы.
    Предполагается, что данные валидные и не пустые.
    """
    # Конвертируем timestamp в datetime (UTC, с таймзоной)
    timestamp = pd.to_datetime(data["timestamp"], utc=True)
    # Один раз читаем ставки
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
