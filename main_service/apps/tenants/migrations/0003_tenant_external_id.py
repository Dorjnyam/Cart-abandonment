import uuid

from django.db import migrations, models


def backfill_external_id(apps, schema_editor):
    Tenant = apps.get_model("tenants", "Tenant")
    for tenant in Tenant.objects.filter(external_id__isnull=True):
        tenant.external_id = uuid.uuid4()
        tenant.save(update_fields=["external_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0002_apikey_name_tenant_timezone"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="external_id",
            field=models.UUIDField(null=True, db_index=True),
        ),
        migrations.RunPython(backfill_external_id, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="tenant",
            name="external_id",
            field=models.UUIDField(default=uuid.uuid4, unique=True, db_index=True),
        ),
    ]
