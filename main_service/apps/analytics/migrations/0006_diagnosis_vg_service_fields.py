# Generated migration for adding VG Service fields to Diagnosis model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0005_rename_analytics_p_tenant__3ae95e_idx_analytics_p_tenant__ca658b_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='diagnosis',
            name='vg_entropy',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='diagnosis',
            name='vg_motifs',
            field=models.JSONField(blank=True, help_text='Motif counts: {z1, z2, z3, z4}', null=True),
        ),
    ]
