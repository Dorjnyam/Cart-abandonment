from django.core.management.base import BaseCommand, CommandError
import pandas as pd
from django.db import connection


class Command(BaseCommand):
    help = "Export training dataset for thesis ML retraining"

    def add_arguments(self, parser):
        parser.add_argument("--output", default="dataset.parquet")
        parser.add_argument(
            "--variant",
            default=None,
            help="baseline | extended | full (omit for all)",
        )
        parser.add_argument("--min-rows", type=int, default=50)

    def handle(self, *args, **options):
        output   = options["output"]
        variant  = options["variant"]
        min_rows = options["min_rows"]

        sql = """
            SELECT
                p.session_id,
                p.tenant_id,
                p.model_variant,
                p.prediction_score,
                p.abandonment_probability,
                p.confidence,
                p.predicted_class,
                p.shap_values,
                p.predicted_at,
                COALESCE(CAST(vo.actual_abandoned AS integer), -1) AS label
            FROM analytics_predictionresult p
            LEFT JOIN analytics_visitoroutcome vo
                ON p.session_id = vo.session_id
            WHERE 1=1
        """
        params = []
        if variant:
            sql += " AND p.model_variant = %s"
            params.append(variant)
        sql += " ORDER BY p.predicted_at"

        df = pd.read_sql(sql, connection, params=params)

        if len(df) < min_rows:
            raise CommandError(
                f"Only {len(df)} rows found (min={min_rows}). "
                "Run more predictions first."
            )

        df.to_parquet(output, index=False)
        self.stdout.write(
            self.style.SUCCESS(
                f"Exported {len(df)} rows → {output}"
                + (f" (variant={variant})" if variant else " (all variants)")
            )
        )
