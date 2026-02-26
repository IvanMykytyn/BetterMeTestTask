from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

import pandas as pd
from django.utils.dateparse import parse_datetime, parse_date

from counter.services import calculate_tax
from .models import Order
from .serializers import (
    OrderSerializer,
    OrderCreateSerializer,
    OrdersImportSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    """
    Default pagination for orders list.

    - page: page number (1-based)
    - page_size: optional, overrides default page size up to max_page_size
    """

    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 500


class OrderListCreateView(generics.ListCreateAPIView):
    """
    Handles:
    - GET /orders/  → list existing orders
    - POST /orders/ → create a new order with computed taxes
    """

    queryset = Order.objects.all()
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """
        Basic filters for GET /orders:
        - state:        exact match on state_name (two-letter code)
        - county:       exact match on county_name
        - city:         exact match on city_name
        - date_from:    ISO date or datetime, filters timestamp >= value
        - date_to:      ISO date or datetime, filters timestamp <= value
        """
        qs = Order.objects.all().order_by("-timestamp", "-id")
        params = self.request.query_params

        state = params.get("state")
        county = params.get("county")
        city = params.get("city")
        date_from = params.get("date_from")
        date_to = params.get("date_to")

        if state:
            qs = qs.filter(state_name__iexact=state)
        if county:
            qs = qs.filter(county_name__iexact=county)
        if city:
            qs = qs.filter(city_name__iexact=city)

        if date_from:
            # Try datetime first, then plain date
            dt = parse_datetime(date_from) or parse_date(date_from)
            if dt is not None:
                qs = qs.filter(timestamp__gte=dt)

        if date_to:
            dt = parse_datetime(date_to) or parse_date(date_to)
            if dt is not None:
                qs = qs.filter(timestamp__lte=dt)

        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrderCreateSerializer
        return OrderSerializer


class OrdersImportView(APIView):
    """
    POST /orders/import/ — upload a CSV of orders, compute taxes, and store them.
    Expected columns (like backend/orders.csv):
      id, longitude, latitude, timestamp, subtotal
    The 'id' column is ignored; each row becomes a new Order.
    """

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = OrdersImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data["file"]

        try:
            df = pd.read_csv(file)
        except Exception as exc:
            return Response(
                {"detail": f"Could not read CSV file: {exc}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        required_cols = {"latitude", "longitude", "subtotal", "timestamp"}
        if not required_cols.issubset(df.columns):
            return Response(
                {
                    "detail": (
                        "CSV must contain columns: latitude, longitude, subtotal, timestamp. "
                        f"Found: {list(df.columns)}"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        df["timestamp"] = pd.to_datetime(df["timestamp"])

        created = 0
        errors = []

        for idx, row in df.iterrows():
            try:
                tax_data = calculate_tax(
                    latitude=float(row["latitude"]),
                    longitude=float(row["longitude"]),
                    timestamp=row["timestamp"].to_pydatetime(),
                    subtotal=row["subtotal"],
                )
                Order.objects.create(**tax_data)
                created += 1
            except Exception as exc:
                errors.append({"row": int(idx), "error": str(exc)})

        return Response(
            {
                "created": created,
                "failed": len(errors),
                "errors": errors,
            },
            status=status.HTTP_201_CREATED,
        )

