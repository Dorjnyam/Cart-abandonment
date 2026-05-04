from django.test import TestCase

from decimal import Decimal

from apps.diagnosis.gemini import generate_recommendation_mn
from apps.tenants.models import Tenant
from apps.analytics.models import Diagnosis

class GeminiFallbackTests(TestCase):
    def test_gemini_fallback_when_no_api_key(self):
        tenant = Tenant.objects.create(name='Shop', domain='shop.com', tier=Tenant.Tier.FULL)
        diagnosis = Diagnosis.objects.create(
            tenant=tenant,
            session_id='s',
            visitor_id='v',
            tier=tenant.tier,
            score_s1=Decimal('0.1'),
            score_s2=Decimal('0.9'),
            score_s3=Decimal('0.1'),
            score_s4=Decimal('0.1'),
            score_s5=Decimal('0.1'),
            score_s6=Decimal('0.1'),
            score_s7=Decimal('0.1'),
        )

        # GEMINI_API_KEY default is '', so fallback must trigger.
        text = generate_recommendation_mn(
            diagnosis=diagnosis,
            features={},
            scores={
                's1': 0.1,
                's2': 0.9,
                's3': 0.1,
                's4': 0.1,
                's5': 0.1,
                's6': 0.1,
                's7': 0.1,
                'dominant_score': 0.9,
                'dominant_key': 's2',
            },
            tenant=tenant,
        )

        self.assertTrue(len(text) > 10)
        self.assertIn('С2', text)
