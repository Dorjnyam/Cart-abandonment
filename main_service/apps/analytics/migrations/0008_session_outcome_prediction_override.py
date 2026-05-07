from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analytics", "0007_diagnosis_prediction_contract_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="session",
            name="session_state",
            field=models.CharField(db_index=True, default="UNKNOWN", max_length=32),
        ),
        migrations.AddField(
            model_name="session",
            name="has_purchase_success",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name="session",
            name="has_checkout_start",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="session",
            name="has_cart_activity",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="session",
            name="final_event_type",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="session",
            name="event_sequence",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="predictionresult",
            name="business_outcome",
            field=models.CharField(db_index=True, default="unknown", max_length=32),
        ),
        migrations.AddField(
            model_name="predictionresult",
            name="prediction_overridden",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name="predictionresult",
            name="override_reason",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="predictionresult",
            name="outcome_metadata",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
