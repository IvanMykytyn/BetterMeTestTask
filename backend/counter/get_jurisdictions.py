from django.contrib.gis.geos import Point
from decimal import Decimal

from counter.models import OrderTaxRecord, TaxRate


def calculate_tax_for_order(purchase_date, latitude, longitude, subtotal):

    point = Point(longitude, latitude, srid=4326)

    # Знаходим округ
    county = County.objects.get(geom__contains=point)

    # Знаходимо місто (якщо є)
    city = City.objects.filter(geom__contains=point).first()

    # Знаходимо податкову ставку
    if city:
        tax_rate = TaxRate.objects.get(
            county_name=county.name,
            city_name=city.name
        )
    else:
        tax_rate = TaxRate.objects.get(
            county_name=county.name,
            city_name__isnull=True
        )

    # Розрахунок 
    composite_rate = (
        tax_rate.state_rate +
        tax_rate.county_rate +
        tax_rate.city_rate +
        tax_rate.special_rate
    )

    tax_amount = Decimal(subtotal) * composite_rate
    total_amount = Decimal(subtotal) + tax_amount

    # Збрігаємо
    record = OrderTaxRecord.objects.create(
        purchase_date=purchase_date,
        latitude=latitude,
        longitude=longitude,
        subtotal=subtotal,

        composite_tax_rate=composite_rate,

        state_rate=tax_rate.state_rate,
        county_rate=tax_rate.county_rate,
        city_rate=tax_rate.city_rate,
        special_rate=tax_rate.special_rate,

        tax_amount=tax_amount,
        total_amount=total_amount,

        state_name="New York",
        county_name=county.name,
        city_name=city.name if city else None
    )

    return record






import csv

def import_orders(file):
    reader = csv.DictReader(file)

    for row in reader:
        calculate_tax_for_order(
            purchase_date=row["date"],
            latitude=float(row["latitude"]),
            longitude=float(row["longitude"]),
            subtotal=row["subtotal"]
        )