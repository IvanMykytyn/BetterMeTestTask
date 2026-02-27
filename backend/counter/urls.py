from django.urls import path
from . import views

urlpatterns = [
    path('orders/import', views.import_orders_api, name='orders_import'),
    path('orders', views.create_order_api, name='create_order_api'),
    path('orders/list', views.list_orders_api, name='list_orders_api'),
]