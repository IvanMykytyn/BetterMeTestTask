from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def orders_root(request):
    return Response({"message": "Orders API is up"})

