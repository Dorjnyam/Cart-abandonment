from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0002_session_predictionresult'),
    ]

    operations = [
        migrations.AddField(
            model_name='predictionresult',
            name='model_variant',
            field=models.CharField(db_index=True, default='baseline', max_length=64),
        ),
        migrations.AddField(
            model_name='predictionresult',
            name='abandonment_probability',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='predictionresult',
            name='confidence',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='predictionresult',
            name='model_version',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='predictionresult',
            name='predicted_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.CreateModel(
            name='VisitorOutcome',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('actual_abandoned', models.BooleanField()),
                ('outcome_observed_at', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'session',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='outcome',
                        to='analytics.session',
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name='visitoroutcome',
            index=models.Index(
                fields=['actual_abandoned'],
                name='analytics_v_actual__ab_idx',
            ),
        ),
    ]
