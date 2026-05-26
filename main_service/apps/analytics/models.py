from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.tenants.models import Tenant


class Session(models.Model):
    """
    Mirrors the Session service schema for joining with predictions and analytics.
    """

    session_id = models.CharField(max_length=128, unique=True, db_index=True)
    visitor_id = models.CharField(max_length=128, db_index=True)

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='sessions')

    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True, db_index=True)

    event_count = models.IntegerField(default=0)
    page_views = models.IntegerField(default=0)
    device_type = models.CharField(max_length=32, null=True, blank=True)
    session_state = models.CharField(max_length=32, default='UNKNOWN', db_index=True)
    has_purchase_success = models.BooleanField(default=False, db_index=True)
    has_checkout_start = models.BooleanField(default=False)
    has_cart_activity = models.BooleanField(default=False)
    final_event_type = models.CharField(max_length=64, blank=True, default='')
    event_sequence = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['tenant', 'ended_at']),
        ]

    def __str__(self) -> str:
        return f'Session(session_id={self.session_id}, tenant={self.tenant_id})'


class PredictionResult(models.Model):
    """
    Per-session prediction output, including SHAP values stored as a JSON object
    mapping feature name to float. Callers must not persist numpy arrays here.
    """

    session = models.OneToOneField(Session, on_delete=models.CASCADE, related_name='prediction')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='prediction_results')

    prediction_score = models.FloatField(db_index=True)
    predicted_class = models.CharField(max_length=64, db_index=True)

    shap_values = models.JSONField()
    feature_vector = models.JSONField(default=dict, blank=True)

    model_variant = models.CharField(max_length=64, default='baseline', db_index=True)
    abandonment_probability = models.FloatField(null=True, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    model_version = models.CharField(max_length=64, null=True, blank=True)
    predicted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    business_outcome = models.CharField(max_length=32, default='unknown', db_index=True)
    prediction_overridden = models.BooleanField(default=False, db_index=True)
    override_reason = models.CharField(max_length=255, blank=True, default='')
    outcome_metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'predicted_class', 'created_at']),
        ]

    def __str__(self) -> str:
        return f'PredictionResult(session_id={self.session.session_id}, class={self.predicted_class})'


class VisitorOutcome(models.Model):
    """Ground truth: did the visitor actually abandon or convert?"""

    session = models.OneToOneField(
        'Session', on_delete=models.CASCADE, related_name='outcome'
    )
    actual_abandoned = models.BooleanField()
    outcome_observed_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['actual_abandoned'])]


class Diagnosis(models.Model):
    class Status(models.TextChoices):
        CREATED = 'created', 'Created'
        FAILED = 'failed', 'Failed'

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='diagnoses')

    # Matches Observer raw_events `session_id`.
    session_id = models.CharField(max_length=128, db_index=True)
    visitor_id = models.CharField(max_length=128, db_index=True)

    tier = models.CharField(max_length=10, choices=Tenant.Tier.choices)

    score_s1 = models.DecimalField(max_digits=6, decimal_places=4)
    score_s2 = models.DecimalField(max_digits=6, decimal_places=4)
    score_s3 = models.DecimalField(max_digits=6, decimal_places=4)
    score_s4 = models.DecimalField(max_digits=6, decimal_places=4)
    score_s5 = models.DecimalField(max_digits=6, decimal_places=4)
    score_s6 = models.DecimalField(max_digits=6, decimal_places=4)
    score_s7 = models.DecimalField(max_digits=6, decimal_places=4)

    abandonment_probability = models.FloatField(null=True, blank=True)
    predicted_label = models.IntegerField(null=True, blank=True)
    predicted_class = models.CharField(max_length=32, null=True, blank=True, db_index=True)
    model_version = models.CharField(max_length=64, null=True, blank=True)
    dominant_reason = models.CharField(max_length=2, null=True, blank=True, db_index=True)
    reason_label = models.CharField(max_length=128, null=True, blank=True)
    explanation = models.TextField(blank=True, default="")
    top_features = models.JSONField(default=list, blank=True)

    # VG Service motif counts (optional, stores result from /compute-entropy)
    vg_entropy = models.FloatField(null=True, blank=True)
    vg_motifs = models.JSONField(null=True, blank=True, help_text="Motif counts: {z1, z2, z3, z4}")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['tenant', 'session_id'], name='unique_diagnosis_tenant_session'),
        ]

    def __str__(self) -> str:
        return f'Diagnosis(tenant={self.tenant_id}, session={self.session_id})'


class Recommendation(models.Model):
    class Status(models.TextChoices):
        CREATED = 'created', 'Created'
        VIEWED = 'viewed', 'Viewed'
        IN_PROGRESS = 'in_progress', 'In Progress'
        IMPLEMENTED = 'implemented', 'Implemented'
        DISMISSED = 'dismissed', 'Dismissed'

    diagnosis = models.OneToOneField(Diagnosis, on_delete=models.CASCADE, related_name='recommendation')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='recommendations')

    text_mn = models.TextField()
    dominant_score = models.DecimalField(max_digits=6, decimal_places=4)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)

    implemented_at = models.DateTimeField(null=True, blank=True)
    implemented_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='implemented_recommendations',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def mark_viewed(self) -> None:
        if self.status == self.Status.CREATED:
            self.status = self.Status.VIEWED
            self.save(update_fields=['status'])

    def mark_implemented(self, user_id: int) -> None:
        self.status = self.Status.IMPLEMENTED
        self.implemented_at = timezone.now()
        self.implemented_by_id = user_id
        self.save(update_fields=['status', 'implemented_at', 'implemented_by'])

    def __str__(self) -> str:
        return f'Recommendation(diagnosis_id={self.diagnosis_id}, status={self.status})'


class ProcessedSession(models.Model):
    """
    Idempotency guard: once a `observer_session_id` is processed, we don't run diagnosis again.
    """

    observer_session_id = models.CharField(max_length=128, unique=True, db_index=True)
    visitor_id = models.CharField(max_length=128, db_index=True)

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='processed_sessions')
    tier = models.CharField(max_length=10, choices=Tenant.Tier.choices)

    processed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f'ProcessedSession(session={self.observer_session_id}, tenant={self.tenant_id})'
