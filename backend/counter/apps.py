from django.apps import AppConfig

from .geo_loader import load_geo_data


class CounterConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'counter'

    # Load geojsons COUNTIES and CITIES at startup
    def ready(self):
        load_geo_data()
