import os
from django.db import migrations


def create_admin(apps, schema_editor):
    User = apps.get_model("auth", "User")

    if not User.objects.filter(username="clodev").exists():
        User.objects.create_superuser(
            username="clodev",
            email="",
            password=os.environ.get("ADMIN_PASSWORD")
        )


class Migration(migrations.Migration):

    dependencies = [
        ('counter', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_admin),
    ]
