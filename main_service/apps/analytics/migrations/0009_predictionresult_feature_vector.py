from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analytics", "0008_session_outcome_prediction_override"),
    ]

    operations = [
        migrations.AddField(
            model_name="predictionresult",
            name="feature_vector",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
