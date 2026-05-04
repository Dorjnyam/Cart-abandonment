from django.test import TestCase
from unittest.mock import patch

from decimal import Decimal

import duckdb
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.analytics.duckdb_client import ensure_analytics_schema
from apps.analytics.models import Diagnosis, PredictionResult, ProcessedSession, Recommendation, Session
from apps.analytics.tasks import process_prediction
from apps.tenants.models import APIKey, Tenant, TeamMember
from django.contrib.auth import get_user_model

def auth_client(client: APIClient, user):
    token = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')


class AnalyticsSmokeTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user1 = User.objects.create_user(username='u1', email='u1@example.com', password='pass123')
        self.user2 = User.objects.create_user(username='u2', email='u2@example.com', password='pass123')

        self.tenant1 = Tenant.objects.create(name='Shop1', domain='shop1.com', tier=Tenant.Tier.FULL)
        self.tenant2 = Tenant.objects.create(name='Shop2', domain='shop2.com', tier=Tenant.Tier.BASIC)

        TeamMember.objects.create(tenant=self.tenant1, user=self.user1, role=TeamMember.Role.OWNER)
        TeamMember.objects.create(tenant=self.tenant2, user=self.user2, role=TeamMember.Role.OWNER)

        # Seed diagnoses + recommendations
        self.d1 = Diagnosis.objects.create(
            tenant=self.tenant1,
            session_id='sess-1',
            visitor_id='vis-1',
            tier=self.tenant1.tier,
            score_s1=Decimal('0.1'),
            score_s2=Decimal('0.9'),
            score_s3=Decimal('0.2'),
            score_s4=Decimal('0.3'),
            score_s5=Decimal('0.4'),
            score_s6=Decimal('0.5'),
            score_s7=Decimal('0.6'),
            status=Diagnosis.Status.CREATED,
        )
        self.r1 = Recommendation.objects.create(
            diagnosis=self.d1,
            tenant=self.tenant1,
            text_mn='rec-1',
            dominant_score=Decimal('0.9'),
            status=Recommendation.Status.CREATED,
        )

        self.d2 = Diagnosis.objects.create(
            tenant=self.tenant2,
            session_id='sess-2',
            visitor_id='vis-2',
            tier=self.tenant2.tier,
            score_s1=Decimal('0.7'),
            score_s2=Decimal('0.1'),
            score_s3=Decimal('0.2'),
            score_s4=Decimal('0.3'),
            score_s5=Decimal('0.4'),
            score_s6=Decimal('0.5'),
            score_s7=Decimal('0.6'),
            status=Diagnosis.Status.CREATED,
        )
        self.r2 = Recommendation.objects.create(
            diagnosis=self.d2,
            tenant=self.tenant2,
            text_mn='rec-2',
            dominant_score=Decimal('0.7'),
            status=Recommendation.Status.CREATED,
        )

    def test_recommendation_viewed_transition(self):
        client = APIClient()
        auth_client(client, self.user1)

        resp = client.get('/api/analytics/recommendation/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['recommendations'][0]['description'], 'rec-1')

        self.r1.refresh_from_db()
        self.assertEqual(self.r1.status, Recommendation.Status.VIEWED)

    def test_cross_tenant_isolation(self):
        client = APIClient()
        auth_client(client, self.user1)

        resp = client.get('/api/analytics/recommendation/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['recommendations'][0]['description'], 'rec-1')

        # Tenant2 recommendation should remain created (not viewed by user1).
        self.r2.refresh_from_db()
        self.assertEqual(self.r2.status, Recommendation.Status.CREATED)

    def test_processed_session_idempotency_unique(self):
        ProcessedSession.objects.create(
            observer_session_id='dup-session',
            visitor_id='v1',
            tenant=self.tenant1,
            tier=self.tenant1.tier,
        )

        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            ProcessedSession.objects.create(
                observer_session_id='dup-session',
                visitor_id='v2',
                tenant=self.tenant2,
                tier=self.tenant2.tier,
            )

    def test_ensure_schema_idempotent(self):
        con = duckdb.connect(":memory:")
        try:
            ensure_analytics_schema(con)
            ensure_analytics_schema(con)
            rows = con.execute("SELECT COUNT(*) FROM predictions").fetchone()
        finally:
            con.close()

        self.assertEqual(rows[0], 0)

    @patch("apps.analytics.tasks.aggregate_session_to_duckdb")
    def test_duplicate_prediction_not_doubled(self, _aggregate):
        kwargs = {
            "session_id": "prediction-session-1",
            "tenant_id": self.tenant1.id,
            "prediction_score": 0.7,
            "predicted_class": "abandoned",
            "shap_values": {"cart_value": 0.5},
            "model_variant": "baseline",
            "abandonment_probability": 0.7,
            "confidence": 0.9,
            "model_version": "test",
            "visitor_id": "visitor-1",
        }

        process_prediction(**kwargs)
        process_prediction(**kwargs)

        self.assertEqual(Session.objects.filter(session_id="prediction-session-1").count(), 1)
        self.assertEqual(
            PredictionResult.objects.filter(session__session_id="prediction-session-1").count(),
            1,
        )
