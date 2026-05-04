from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analytics", "0003_prediction_ablation_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="session",
            name="event_count",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="session",
            name="page_views",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="session",
            name="device_type",
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
    ]
