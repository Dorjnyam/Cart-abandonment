from rest_framework import serializers

from apps.analytics.models import PredictionResult, Recommendation, Session


class PredictionNestedSerializer(serializers.ModelSerializer):
    prediction = serializers.CharField(source="predicted_class")

    class Meta:
        model = PredictionResult
        fields = [
            "abandonment_probability",
            "prediction",
            "confidence",
            "model_variant",
        ]


class SessionSerializer(serializers.ModelSerializer):
    prediction = PredictionNestedSerializer(read_only=True)

    class Meta:
        model = Session
        fields = [
            "session_id",
            "visitor_id",
            "started_at",
            "ended_at",
            "event_count",
            "page_views",
            "device_type",
            "prediction",
        ]


class SessionDetailSerializer(SessionSerializer):
    shap_values = serializers.SerializerMethodField()

    class Meta(SessionSerializer.Meta):
        fields = SessionSerializer.Meta.fields + ["shap_values"]

    def get_shap_values(self, obj) -> dict:
        pred = getattr(obj, "prediction", None)
        return pred.shap_values if pred else {}




class PredictionResultSerializer(serializers.ModelSerializer):
    session_id = serializers.CharField(source="session.session_id", read_only=True)
    visitor_id = serializers.CharField(source="session.visitor_id", read_only=True)
    prediction = serializers.CharField(source="predicted_class")

    class Meta:
        model = PredictionResult
        fields = [
            "session_id",
            "visitor_id",
            "model_variant",
            "abandonment_probability",
            "prediction",
            "confidence",
            "shap_values",
            "model_version",
            "predicted_at",
        ]


class AblationVariantSerializer(serializers.Serializer):
    model_variant = serializers.CharField()
    count = serializers.IntegerField()
    abandonment_rate = serializers.FloatField(required=False)
    avg_confidence = serializers.FloatField(required=False)
    avg_score = serializers.FloatField(required=False)


class ExportTriggerSerializer(serializers.Serializer):
    export_type = serializers.ChoiceField(choices=("analytics", "sessions"), default="analytics")
    model_variant = serializers.CharField(required=False, allow_blank=False, allow_null=True, max_length=64)


class StoreSettingsSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, max_length=200)
    domain = serializers.CharField(required=False, max_length=255)
    timezone = serializers.CharField(required=False, max_length=64)
