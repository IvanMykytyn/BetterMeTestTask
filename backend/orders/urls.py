from django.urls import path

from . import views


urlpatterns = [
    path("", views.orders_root, name="orders-root"),
]

