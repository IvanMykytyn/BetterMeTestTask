from django.urls import path
from .views import upload_orders

urlpatterns = [
    path("upload/", upload_orders, name="upload_orders"),
]