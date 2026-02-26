from decimal import Decimal
from django.db import models

class OrderTaxRecord(models.Model):
    # вихіні дані
    purchase_date = models.DateTimeField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    # розрахункові ставки
    composite_tax_rate = models.DecimalField(max_digits=7, decimal_places=5, default=0)

    state_rate = models.DecimalField(max_digits=6, decimal_places=5, default=0)
    county_rate = models.DecimalField(max_digits=6, decimal_places=5, default=0)
    city_rate = models.DecimalField(max_digits=6, decimal_places=5, default=0)
    special_rates = models.DecimalField(max_digits=6, decimal_places=5, default=0)

    # розрахункові суми
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # юрисдикції
    state_name = models.CharField(max_length=100)
    county_name = models.CharField(max_length=100, blank=True, null=True)
    city_name = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.purchase_date} - {self.total_amount}"
    
    def calculate_totals(self):
        self.composite_tax_rate = (
            self.state_rate +
            self.county_rate +
            self.city_rate +
            self.special_rates
        )

        self.tax_amount = self.subtotal * self.composite_tax_rate
        self.total_amount = self.subtotal + self.tax_amount

    def save(self, *args, **kwargs):
        self.calculate_totals()
        super().save(*args, **kwargs)


# Модель для зберігання ставок податку для різних юрисдикцій
# Дані взяті з офіційного сайту податкової служби штату Нью-Йорк
class StateTaxRate(models.Model):
    state_name = models.CharField(max_length=100)
    state_rate = models.DecimalField(max_digits=6, decimal_places=5)


class CountyTaxRate(models.Model):
    county_name = models.CharField(max_length=100)
    county_rate = models.DecimalField(max_digits=6, decimal_places=5)


class CityTaxRate(models.Model):
    city_name = models.CharField(max_length=100, null=True, blank=True)
    city_rate = models.DecimalField(max_digits=6, decimal_places=5)


class SpecialTaxRate(models.Model):
    special_county_name = models.CharField(max_length=100, null=True, blank=True)
    city_or_county_name = models.CharField(max_length=100, null=True, blank=True)
    special_rate = models.DecimalField(max_digits=6, decimal_places=5)