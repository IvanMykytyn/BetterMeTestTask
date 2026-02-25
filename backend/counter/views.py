from django.shortcuts import render
from django.http import HttpResponse
from .services import process_orders_csv


def upload_orders(request):

    if request.method == "POST":
        file = request.FILES.get("orders_file")

        if not file:
            return HttpResponse("No file uploaded", status=400)

        process_orders_csv(file)

        return HttpResponse("Orders imported successfully!")

    return render(request, "counter/upload_orders.html")