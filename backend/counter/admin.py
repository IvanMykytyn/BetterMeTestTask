from django.contrib import admin

from .models import OrderTaxRecord, StateTaxRate, CountyTaxRate, CityTaxRate, SpecialTaxRate

@admin.register(OrderTaxRecord)
class OrderTaxRecordAdmin(admin.ModelAdmin):
    list_display = (
        "purchase_date",
        "latitude",
        "longitude",
        "subtotal",
        "state_name",
        "county_name",
        "city_name",
        "state_rate",
        "county_rate",
        "city_rate",
        "special_rates",
        "composite_tax_rate",
        "tax_amount",
        "total_amount",
    )
    list_filter = ("state_name", "county_name", "city_name", "purchase_date")
    search_fields = ("state_name", "county_name", "city_name")

@admin.register(StateTaxRate)
class StateTaxRateAdmin(admin.ModelAdmin):
    list_display = ("state_name", "state_rate")
    search_fields = ("state_name",)

@admin.register(CountyTaxRate)
class CountyTaxRateAdmin(admin.ModelAdmin):
    list_display = ("county_name", "county_rate")
    search_fields = ("county_name",)

@admin.register(CityTaxRate)
class CityTaxRateAdmin(admin.ModelAdmin):
    list_display = ("city_name", "city_rate")
    search_fields = ("city_name",)

@admin.register(SpecialTaxRate)
class SpecialTaxRateAdmin(admin.ModelAdmin):
    list_display = ("city_or_county_name", "special_rate")
    search_fields = ("city_or_county_name",)