from django.test import TestCase
from unittest.mock import MagicMock, patch
from uuid import UUID

from decimal import Decimal

import duckdb
from django.utils import timezone
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
        self.assertEqual(Diagnosis.objects.filter(session_id="prediction-session-1", tenant=self.tenant1).count(), 1)
        self.assertEqual(Recommendation.objects.filter(diagnosis__session_id="prediction-session-1").count(), 1)

    def test_prediction_payload_with_external_tenant_uuid_creates_diagnosis(self):
        from apps.analytics.prediction_pipeline import handle_prediction_payload

        self.tenant1.external_id = UUID("00000000-0000-0000-0000-000000000001")
        self.tenant1.save(update_fields=["external_id"])

        result = handle_prediction_payload({
            "session_id": "external-tenant-session",
            "tenant_id": "00000000-0000-0000-0000-000000000001",
            "visitor_id": "visitor-x",
            "abandonment_probability": 0.83,
            "predicted_label": 1,
            "predicted_class": "abandoned",
            "model_name": "xgboost",
            "model_version": "test-model",
            "threshold": 0.5,
            "features": {
                "rage_click": 6,
                "js_error": 2,
                "page_load_ms": 5200,
                "cart_value": 280000,
            },
            "top_features": [{"feature": "rage_click", "value": 6, "importance": 0.42}],
            "created_at": "2026-05-06T00:00:00+00:00",
        })

        self.assertEqual(result["status"], "ok")
        diagnosis = Diagnosis.objects.get(session_id="external-tenant-session", tenant=self.tenant1)
        self.assertEqual(diagnosis.predicted_class, "abandoned")
        self.assertEqual(diagnosis.model_version, "test-model")
        self.assertEqual(diagnosis.top_features[0]["feature"], "rage_click")
        prediction = PredictionResult.objects.get(session__session_id="external-tenant-session")
        self.assertEqual(prediction.feature_vector["rage_click"], 6)

    def test_prediction_payload_with_purchase_success_skips_abandonment_diagnosis(self):
        from apps.analytics.prediction_pipeline import handle_prediction_payload

        result = handle_prediction_payload({
            "session_id": "converted-session",
            "tenant_id": self.tenant1.id,
            "visitor_id": "visitor-converted",
            "abandonment_probability": 0.91,
            "predicted_label": 1,
            "predicted_class": "abandoned",
            "model_name": "xgboost",
            "model_version": "test-model",
            "threshold": 0.5,
            "session_state": "CONVERTED",
            "has_purchase_success": True,
            "final_event_type": "purchase_success",
            "features": {"event_count": 6, "cart_item_count": 1},
            "created_at": "2026-05-06T00:00:00+00:00",
        })

        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["diagnosis_id"], None)
        self.assertEqual(result["business_outcome"], "converted")
        self.assertTrue(result["prediction_overridden"])
        self.assertEqual(Diagnosis.objects.filter(session_id="converted-session", tenant=self.tenant1).count(), 0)
        self.assertEqual(Recommendation.objects.filter(diagnosis__session_id="converted-session").count(), 0)
        prediction = PredictionResult.objects.get(session__session_id="converted-session")
        self.assertEqual(prediction.predicted_class, "abandoned")
        self.assertEqual(prediction.business_outcome, "converted")
        self.assertTrue(prediction.prediction_overridden)
        self.assertEqual(prediction.feature_vector["event_count"], 6)

    def test_prediction_payload_duplicate_is_idempotent(self):
        from apps.analytics.prediction_pipeline import handle_prediction_payload

        payload = {
            "session_id": "pipeline-dup-session",
            "tenant_id": self.tenant1.id,
            "visitor_id": "visitor-dup",
            "abandonment_probability": 0.82,
            "predicted_label": 1,
            "predicted_class": "abandoned",
            "model_name": "xgboost",
            "model_version": "test-model",
            "threshold": 0.5,
            "session_state": "ABANDONED",
            "has_purchase_success": False,
            "features": {"event_count": 8, "rage_click": 4, "cart_value": 200},
            "created_at": "2026-05-06T00:00:00+00:00",
        }

        handle_prediction_payload(payload)
        handle_prediction_payload(payload)

        self.assertEqual(Session.objects.filter(session_id="pipeline-dup-session").count(), 1)
        self.assertEqual(PredictionResult.objects.filter(session__session_id="pipeline-dup-session").count(), 1)
        self.assertEqual(Diagnosis.objects.filter(session_id="pipeline-dup-session", tenant=self.tenant1).count(), 1)
        self.assertEqual(Recommendation.objects.filter(diagnosis__session_id="pipeline-dup-session").count(), 1)

    def test_dashboard_overview_returns_business_contract(self):
        Session.objects.create(
            session_id="sess-1",
            visitor_id="vis-1",
            tenant=self.tenant1,
            started_at=timezone.now(),
            ended_at=timezone.now(),
            event_count=6,
            page_views=2,
            device_type="mobile",
        )
        PredictionResult.objects.create(
            session=Session.objects.get(session_id="sess-1"),
            tenant=self.tenant1,
            prediction_score=0.84,
            predicted_class="abandoned",
            shap_values={"checkout_error_count": 0.4},
            model_variant="xgboost",
            abandonment_probability=0.84,
            confidence=0.84,
            model_version="xgboost-test",
            predicted_at=timezone.now(),
        )
        client = APIClient()
        auth_client(client, self.user1)

        resp = client.get("/api/dashboard/overview/")

        self.assertEqual(resp.status_code, 200)
        self.assertIn("summary", resp.data)
        self.assertEqual(resp.data["summary"]["total_sessions"], 1)
        self.assertEqual(resp.data["summary"]["abandoned_sessions"], 1)
        self.assertIn("top_reason", resp.data)
        self.assertEqual(len(resp.data["reasons"]), 7)
        self.assertEqual(resp.data["model"]["active_model"], "xgboost")

    def test_dashboard_session_detail_returns_prediction_diagnosis_recommendation(self):
        session = Session.objects.create(
            session_id="sess-1",
            visitor_id="vis-1",
            tenant=self.tenant1,
            started_at=timezone.now(),
            ended_at=timezone.now(),
            event_count=6,
            page_views=2,
            device_type="desktop",
        )
        PredictionResult.objects.create(
            session=session,
            tenant=self.tenant1,
            prediction_score=0.72,
            predicted_class="abandoned",
            shap_values={"cart_value": 0.31},
            model_variant="xgboost",
            abandonment_probability=0.72,
            confidence=0.72,
            model_version="xgboost-test",
            predicted_at=timezone.now(),
        )
        client = APIClient()
        auth_client(client, self.user1)

        resp = client.get("/api/dashboard/sessions/sess-1/")

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["session_id"], "sess-1")
        self.assertEqual(resp.data["prediction"]["predicted_class"], "abandoned")
        self.assertEqual(resp.data["diagnosis"]["dominant_reason"], "S2")
        self.assertEqual(resp.data["recommendation"]["source"], "fallback")
        self.assertIn("top_features", resp.data)

    def test_dashboard_recommendation_status_patch(self):
        client = APIClient()
        auth_client(client, self.user1)

        resp = client.patch(
            f"/api/dashboard/recommendations/{self.r1.id}/status/",
            {"status": "in_progress"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "in_progress")
        self.r1.refresh_from_db()
        self.assertEqual(self.r1.status, Recommendation.Status.IN_PROGRESS)

        resp = client.patch(
            f"/api/dashboard/recommendations/{self.r1.id}/status/",
            {"status": "done"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "done")
        self.r1.refresh_from_db()
        self.assertEqual(self.r1.status, Recommendation.Status.IMPLEMENTED)

    @patch.dict(
        "os.environ",
        {
            "DEMO_OBSERVER_API_KEY": "tk_full_demo_mvp",
            "OBSERVER_PUBLIC_URL": "http://observer.local",
        },
        clear=False,
    )
    def test_dashboard_integration_uses_real_observer_snippet_path(self):
        client = APIClient()
        auth_client(client, self.user1)

        resp = client.get("/api/dashboard/integration/")

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["observer"]["demo_api_key"], "tk_full_demo_mvp")
        self.assertIn(
            "http://observer.local/static/snippet/track.js?key=tk_full_demo_mvp",
            resp.data["observer"]["snippet"],
        )
        self.assertIn(f'data-tenant-id="{self.tenant1.external_id}"', resp.data["observer"]["snippet"])

    @patch("apps.analytics.views.socket.create_connection")
    @patch("apps.analytics.views.requests.get")
    def test_pipeline_monitor_endpoint_is_registered(self, mock_get, mock_create_connection):
        class FakeElapsed:
            def total_seconds(self):
                return 0.012

        class FakeResponse:
            status_code = 200
            content = b"{}"
            elapsed = FakeElapsed()

            def json(self):
                return {"status": "ok", "model_version": "test-model"}

        mock_get.return_value = FakeResponse()
        mock_create_connection.return_value = MagicMock()

        client = APIClient()
        auth_client(client, self.user1)

        resp = client.get("/api/pipeline/monitor/")

        self.assertEqual(resp.status_code, 200)
        self.assertIn("services", resp.data)
        self.assertIn("infra", resp.data)
        self.assertIn("throughput", resp.data)
        self.assertEqual(resp.data["services"][0]["id"], "observer")

    def test_ml_insights_endpoint_is_registered(self):
        session = Session.objects.create(
            session_id="ml-insights-session",
            visitor_id="vis-ml",
            tenant=self.tenant1,
            started_at=timezone.now(),
            ended_at=timezone.now(),
            event_count=4,
            page_views=2,
        )
        PredictionResult.objects.create(
            session=session,
            tenant=self.tenant1,
            prediction_score=0.82,
            predicted_class="abandoned",
            shap_values={"cart_value": -0.12, "rage_click": 0.31},
            model_variant="xgboost",
            abandonment_probability=0.82,
            confidence=0.82,
            model_version="xgboost-test",
            predicted_at=timezone.now(),
            business_outcome="abandoned",
        )
        client = APIClient()
        auth_client(client, self.user1)

        resp = client.get("/api/ml/insights/")

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["model"]["prediction_count"], 1)
        self.assertEqual(resp.data["metrics"]["confusion_matrix"]["true_positive"], 1)
        self.assertEqual(resp.data["feature_contributions"][0]["feature"], "rage_click")

    def test_prediction_detail_endpoint_is_registered(self):
        session = Session.objects.create(
            session_id="prediction-detail-session",
            visitor_id="vis-prediction",
            tenant=self.tenant1,
            started_at=timezone.now(),
            ended_at=timezone.now(),
            event_count=3,
            page_views=1,
        )
        PredictionResult.objects.create(
            session=session,
            tenant=self.tenant1,
            prediction_score=0.36,
            predicted_class="converted",
            shap_values={"cart_value": -0.2},
            model_variant="xgboost",
            abandonment_probability=0.36,
            confidence=0.64,
            model_version="xgboost-test",
            predicted_at=timezone.now(),
            business_outcome="converted",
        )
        client = APIClient()
        auth_client(client, self.user1)

        resp = client.get("/api/predictions/prediction-detail-session/")

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["session_id"], "prediction-detail-session")
