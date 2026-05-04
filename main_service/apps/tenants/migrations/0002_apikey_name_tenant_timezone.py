from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenants", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="timezone",
            field=models.CharField(default="UTC", max_length=64),
        ),
        migrations.AddField(
            model_name="apikey",
            name="name",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
    ]
