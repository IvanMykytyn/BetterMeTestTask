import json
from decimal import Decimal, InvalidOperation

from django.core.paginator import Paginator
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from datetime import timezone as dt_timezone
from django.views.decorators.csrf import csrf_exempt

from .services import process_orders_csv
from .models import OrderTaxRecord


# ------------------------------
# POST /orders/import
# ------------------------------
@csrf_exempt
def import_orders_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    file = request.FILES.get("orders_file")
    if not file:
        return JsonResponse({"error": "No file uploaded"}, status=400)

    process_orders_csv(file)
    return JsonResponse({"message": "Orders imported successfully!"})


# ------------------------------
# POST /orders
# ------------------------------
@csrf_exempt
def create_order_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    timestamp_str = data.get("timestamp")
    if timestamp_str:
        parsed_ts = parse_datetime(timestamp_str)
        if parsed_ts is None:
            purchase_date = timezone.now()
        else:
            if timezone.is_naive(parsed_ts):
                purchase_date = timezone.make_aware(
                    parsed_ts, timezone.get_default_timezone()
                )
            else:
                purchase_date = parsed_ts
    else:
        purchase_date = timezone.now()

    order = OrderTaxRecord.objects.create(
        purchase_date=purchase_date,
        latitude=data.get("latitude", 0),
        longitude=data.get("longitude", 0),
        subtotal=Decimal(str(data.get("subtotal", 0))),
        state_name=data.get("state", ""),
        county_name=data.get("county"),
        city_name=data.get("city"),
        state_rate=Decimal(str(data.get("state_rate", 0))),
        county_rate=Decimal(str(data.get("county_rate", 0))),
        city_rate=Decimal(str(data.get("city_rate", 0))),
        special_rates=Decimal(str(data.get("special_rates", 0))),
    )

    return JsonResponse({
        "id": order.id,
        "timestamp": order.purchase_date.astimezone(dt_timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
    })


# ------------------------------
# GET /orders
# ------------------------------
def list_orders_api(request):
    orders_qs = OrderTaxRecord.objects.all().order_by("-purchase_date")

    # Фильтры по времени (from_timestamp, to_timestamp)
    from_ts_str = request.GET.get("from_timestamp")
    if from_ts_str:
        dt_from = parse_datetime(from_ts_str)
        if dt_from is not None:
            if timezone.is_naive(dt_from):
                dt_from = timezone.make_aware(dt_from, timezone.get_default_timezone())
            orders_qs = orders_qs.filter(purchase_date__gte=dt_from)

    to_ts_str = request.GET.get("to_timestamp")
    if to_ts_str:
        dt_to = parse_datetime(to_ts_str)
        if dt_to is not None:
            if timezone.is_naive(dt_to):
                dt_to = timezone.make_aware(dt_to, timezone.get_default_timezone())
            orders_qs = orders_qs.filter(purchase_date__lte=dt_to)

    # Фильтры по суммам (subtotal, total_amount)
    def _parse_decimal_param(name: str):
        raw = request.GET.get(name)
        if raw is None:
            return None
        try:
            return Decimal(raw)
        except (InvalidOperation, ValueError):
            return None

    min_subtotal = _parse_decimal_param("min_subtotal")
    if min_subtotal is not None:
        orders_qs = orders_qs.filter(subtotal__gte=min_subtotal)

    max_subtotal = _parse_decimal_param("max_subtotal")
    if max_subtotal is not None:
        orders_qs = orders_qs.filter(subtotal__lte=max_subtotal)

    min_total = _parse_decimal_param("min_total")
    if min_total is not None:
        orders_qs = orders_qs.filter(total_amount__gte=min_total)

    max_total = _parse_decimal_param("max_total")
    if max_total is not None:
        orders_qs = orders_qs.filter(total_amount__lte=max_total)

    # Фильтры по state, county, city
    for field in ["state", "county", "city"]:
        value = request.GET.get(field)
        if value:
            orders_qs = orders_qs.filter(**{f"{field}_name__iexact": value})

    # Пагинация
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)
    paginator = Paginator(orders_qs, page_size)
    page_obj = paginator.get_page(page_number)

    orders_list = []
    for order in page_obj:
        orders_list.append({
            "id": str(order.id),
            "latitude": float(order.latitude),
            "longitude": float(order.longitude),
            "subtotal": float(order.subtotal),
            "composite_tax_rate": float(order.composite_tax_rate),
            "tax_amount": float(order.tax_amount),
            "total_amount": float(order.total_amount),
            "timestamp": order.purchase_date.astimezone(dt_timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z'),
            "state_rate": float(order.state_rate),
            "county_rate": float(order.county_rate),
            "city_rate": float(order.city_rate),
            "special_rates": float(order.special_rates),
            "state": order.state_name,
            "county": order.county_name or "",
            "city": order.city_name or ""
        })

    return JsonResponse({
        "count": paginator.count,
        "num_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "results": orders_list
    })
