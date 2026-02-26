from django.urls import path

from .views import OrderListCreateView, OrdersImportView


urlpatterns = [
    path("", OrderListCreateView.as_view(), name="orders-list-create"),
    path("import/", OrdersImportView.as_view(), name="orders-import"),
]

