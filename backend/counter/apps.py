from django.apps import AppConfig

from backend.counter.geo_loader import load_geo_data


class CounterConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'counter'

    # Виконуємо завантаження при старті
    def ready(self):
        load_geo_data()
        # Тепер COUNTIES і CITIES уже завантажені в память, коли сервер стартує