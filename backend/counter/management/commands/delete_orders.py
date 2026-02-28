from django.core.management.base import BaseCommand
from counter.models import OrderTaxRecord
from datetime import datetime

class Command(BaseCommand):
    help = "Deletes all OrderTaxRecord records"

    def handle(self, *args, **options):
        start = datetime.now()
        deleted_count, _ = OrderTaxRecord.objects.all().delete()
        end = datetime.now()
        self.stdout.write(self.style.SUCCESS(
            f"Deleted {deleted_count} records in {end - start}"
        ))