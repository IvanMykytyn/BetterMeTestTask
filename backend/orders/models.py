from django.db import models


class Order(models.Model):
    """
    Core order entity used by the API.

    Stores both the original order data (coords, subtotal, timestamp)
    and all computed tax fields and breakdown.
    """

    # original order data
    latitude = models.FloatField()
    longitude = models.FloatField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField()

    # computed tax rates (fractions, e.g. 0.08875)
    composite_tax_rate = models.DecimalField(
        max_digits=7,
        decimal_places=5,
        default=0,
        help_text="Total tax rate applied to the order (state + county + city + special).",
    )
    state_rate = models.DecimalField(
        max_digits=6,
        decimal_places=5,
        default=0,
        help_text="State-level tax rate component.",
    )
    county_rate = models.DecimalField(
        max_digits=6,
        decimal_places=5,
        default=0,
        help_text="County-level tax rate component.",
    )
    city_rate = models.DecimalField(
        max_digits=6,
        decimal_places=5,
        default=0,
        help_text="City-level tax rate component.",
    )
    special_rate = models.DecimalField(
        max_digits=6,
        decimal_places=5,
        default=0,
        help_text="Special district or additional tax rate component.",
    )

    # computed monetary amounts
    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Absolute tax amount charged for this order.",
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Final amount charged (subtotal + tax).",
    )

    # jurisdiction metadata (human-readable)
    state_name = models.CharField(max_length=100)
    county_name = models.CharField(max_length=100, null=True, blank=True)
    city_name = models.CharField(max_length=100, null=True, blank=True)

    # optional structured list of jurisdictions applied, e.g. ["NY STATE", "NEW YORK COUNTY", "NEW YORK CITY"]
    jurisdictions = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-timestamp", "-id"]

    def __str__(self) -> str:
        return f"Order #{self.pk} @ {self.timestamp.isoformat()} - total {self.total_amount}"


class TaxJurisdiction(models.Model):
    """
    Optional normalized representation of a taxing jurisdiction
    (state, county, city, special district).
    """

    TYPE_STATE = "state"
    TYPE_COUNTY = "county"
    TYPE_CITY = "city"
    TYPE_SPECIAL = "special"

    TYPE_CHOICES = [
        (TYPE_STATE, "State"),
        (TYPE_COUNTY, "County"),
        (TYPE_CITY, "City"),
        (TYPE_SPECIAL, "Special"),
    ]

    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)

    # optional external identifiers (e.g. FIPS codes) and state code
    code = models.CharField(max_length=50, blank=True)
    state_code = models.CharField(
        max_length=2,
        blank=True,
        help_text="Two-letter state code, e.g. 'NY'.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("type", "name", "state_code", "code")
        verbose_name = "Tax jurisdiction"
        verbose_name_plural = "Tax jurisdictions"

    def __str__(self) -> str:
        base = f"{self.get_type_display()}: {self.name}"
        return f"{base} ({self.state_code})" if self.state_code else base


class TaxRate(models.Model):
    """
    Optional normalized tax rate model that can store
    time-dependent rates per jurisdiction.
    """

    jurisdiction = models.ForeignKey(
        TaxJurisdiction,
        on_delete=models.CASCADE,
        related_name="rates",
    )

    rate = models.DecimalField(
        max_digits=6,
        decimal_places=5,
        help_text="Rate as fraction, e.g. 0.04000 for 4%.",
    )

    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-effective_from", "-id"]
        verbose_name = "Tax rate"
        verbose_name_plural = "Tax rates"

    def __str__(self) -> str:
        until = self.effective_to.isoformat() if self.effective_to else "open-ended"
        return f"{self.rate} for {self.jurisdiction} from {self.effective_from} to {until}"


