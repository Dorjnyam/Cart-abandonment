from django.test import TestCase
from rest_framework.test import APIClient
from unittest.mock import patch

from django.contrib.auth import get_user_model

from apps.tenants.models import APIKey, Tenant, TeamMember

class APIKeyHashingTests(TestCase):
    def test_raw_key_not_persisted_only_hash(self):
        tenant = Tenant.objects.create(name='Shop', domain='shop.com', tier=Tenant.Tier.FULL)

        raw_key, digest = APIKey.generate_raw_key(tier=Tenant.Tier.FULL)
        self.assertTrue(raw_key.startswith('tk_full_'))
        self.assertEqual(len(digest), 64)

        api_key = APIKey.objects.create(
            tenant=tenant,
            key_hash=digest,
            prefix=APIKey._prefix_for_tier(Tenant.Tier.FULL),
            tier=Tenant.Tier.FULL,
            suffix_len=12,
            is_active=True,
        )

        self.assertEqual(api_key.key_hash, digest)
        self.assertNotEqual(api_key.key_hash, raw_key)

    @patch.dict("os.environ", {"OBSERVER_PUBLIC_URL": "http://observer.local"}, clear=False)
    def test_generate_api_key_returns_observer_track_script(self):
        User = get_user_model()
        user = User.objects.create_user(username="owner", email="owner@example.com", password="pass123")
        tenant = Tenant.objects.create(name="Owned Shop", domain="owned.example", tier=Tenant.Tier.FULL)
        TeamMember.objects.create(tenant=tenant, user=user, role=TeamMember.Role.OWNER)
        client = APIClient()
        client.force_authenticate(user=user)

        resp = client.post("/api/tenant/apikey/generate/", {"tenant_id": tenant.id, "tier": Tenant.Tier.FULL}, format="json")

        self.assertEqual(resp.status_code, 201)
        self.assertTrue(resp.data["raw_key"].startswith("tk_full_"))
        self.assertIn("http://observer.local/static/snippet/track.js?key=tk_full_", resp.data["observer_install_snippet"])
        self.assertIn(f'data-tenant-id="{tenant.external_id}"', resp.data["observer_install_snippet"])
