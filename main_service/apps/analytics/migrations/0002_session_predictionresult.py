from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
        ('analytics', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Session',
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
                ('session_id', models.CharField(max_length=128, unique=True, db_index=True)),
                ('visitor_id', models.CharField(max_length=128, db_index=True)),
                ('started_at', models.DateTimeField()),
                ('ended_at', models.DateTimeField(blank=True, null=True, db_index=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    'tenant',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='sessions',
                        to='tenants.tenant',
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name='PredictionResult',
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
                ('prediction_score', models.FloatField(db_index=True)),
                ('predicted_class', models.CharField(max_length=64, db_index=True)),
                ('shap_values', models.JSONField()),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    'session',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='prediction',
                        to='analytics.session',
                    ),
                ),
                (
                    'tenant',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='prediction_results',
                        to='tenants.tenant',
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name='session',
            index=models.Index(fields=['tenant', 'created_at'], name='analytics_s_tenant__c4c0da_idx'),
        ),
        migrations.AddIndex(
            model_name='session',
            index=models.Index(fields=['tenant', 'ended_at'], name='analytics_s_tenant__b1c803_idx'),
        ),
        migrations.AddIndex(
            model_name='predictionresult',
            index=models.Index(
                fields=['tenant', 'predicted_class', 'created_at'],
                name='analytics_p_tenant__3ae95e_idx',
            ),
        ),
    ]

