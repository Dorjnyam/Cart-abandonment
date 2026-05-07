from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analytics", "0006_diagnosis_vg_service_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="diagnosis",
            name="abandonment_probability",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="diagnosis",
            name="predicted_label",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="diagnosis",
            name="predicted_class",
            field=models.CharField(blank=True, db_index=True, max_length=32, null=True),
        ),
        migrations.AddField(
            model_name="diagnosis",
            name="model_version",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="diagnosis",
            name="dominant_reason",
            field=models.CharField(blank=True, db_index=True, max_length=2, null=True),
        ),
        migrations.AddField(
            model_name="diagnosis",
            name="reason_label",
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
        migrations.AddField(
            model_name="diagnosis",
            name="explanation",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="diagnosis",
            name="top_features",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
