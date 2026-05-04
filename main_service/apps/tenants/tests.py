from django.test import TestCase

from apps.tenants.models import APIKey, Tenant

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
