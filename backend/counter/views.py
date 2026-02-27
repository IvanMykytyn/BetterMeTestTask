import json
from decimal import Decimal, InvalidOperation

from django.core.paginator import Paginator
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from datetime import timezone as dt_timezone
from django.views.decorators.csrf import csrf_exempt

from .services import process_orders_csv, validate_csv, process_manual_order
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

    # 1. Проверка CSV
    errors = validate_csv(file)
    if errors:
        # если есть ошибки — возвращаем их и не трогаем БД
        return JsonResponse({"errors": errors}, status=400)

    # 2. Если ошибок нет — обрабатываем файл
    process_orders_csv(file)
    return JsonResponse({"message": "Orders imported successfully!"})


# ------------------------------
# POST /orders (ручной ввод)
# ------------------------------
@csrf_exempt
def create_order_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # process_manual_order внутри сам создаёт объект и сохраняет
    order = process_manual_order(data)

    return JsonResponse({
        "id": order.id,
        "timestamp": order.purchase_date.astimezone(dt_timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
    })


# ------------------------------
# GET /orders (список с фильтрами и пагинацией)
# ------------------------------
def list_orders_api(request):
    orders_qs = OrderTaxRecord.objects.all().order_by("-purchase_date")

    # Фильтры по времени
    for param, field in [("from_timestamp", "gte"), ("to_timestamp", "lte")]:
        ts_str = request.GET.get(param)
        if ts_str:
            dt = parse_datetime(ts_str)
            if dt and timezone.is_naive(dt):
                dt = timezone.make_aware(dt, timezone.get_default_timezone())
            if dt:
                filter_expr = {f"purchase_date__{field}": dt}
                orders_qs = orders_qs.filter(**filter_expr)

     # Фильтры по суммам
    def parse_decimal(name):
        raw = request.GET.get(name)
        if raw is None:
            return None
        try:
            return Decimal(raw)
        except (InvalidOperation, ValueError):
            return None

    for name, expr in [("min_subtotal", "gte"), ("max_subtotal", "lte"),
                       ("min_total", "gte"), ("max_total", "lte")]:
        val = parse_decimal(name)
        if val is not None:
            field = "subtotal" if "subtotal" in name else "total_amount"
            orders_qs = orders_qs.filter(**{f"{field}__{expr}": val})

    # Фильтры по state/county/city
    for field in ["state", "county", "city"]:
        value = request.GET.get(field)
        if value:
            orders_qs = orders_qs.filter(**{f"{field}_name__iexact": value})

    # Універсальний search-фільтр
    search = request.GET.get("search")
    if search:
        orders_qs = orders_qs.filter(
            Q(state_name__icontains=search) |
            Q(county_name__icontains=search) |
            Q(city_name__icontains=search)
        )

    # Пагинация
    page_number = request.GET.get("page", 1)
    page_size = request.GET.get("page_size", 20)
    paginator = Paginator(orders_qs, page_size)
    page_obj = paginator.get_page(page_number)

    results = [
        {
            "id": str(order.id),
            "latitude": float(order.latitude),
            "longitude": float(order.longitude),
            "subtotal": float(order.subtotal),
            "composite_tax_rate": float(order.composite_tax_rate),
            "tax_amount": float(order.tax_amount),
            "total_amount": float(order.total_amount),
            "timestamp": order.purchase_date.astimezone(dt_timezone.utc)
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z"),
            "state_rate": float(order.state_rate),
            "county_rate": float(order.county_rate),
            "city_rate": float(order.city_rate),
            "special_rates": float(order.special_rates),
            "state": order.state_name,
            "county": order.county_name or "",
            "city": order.city_name or "",
        }
        for order in page_obj
    ]

    return JsonResponse({
        "count": paginator.count,
        "num_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "results": results,
    })
