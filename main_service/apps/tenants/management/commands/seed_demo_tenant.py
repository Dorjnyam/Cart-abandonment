import hashlib
import os
from uuid import UUID

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.tenants.models import APIKey, TeamMember, Tenant


class Command(BaseCommand):
    help = "Create the deterministic demo tenant/user/API key used by the thesis MVP stack."

    def handle(self, *args, **options):
        external_id = UUID(os.getenv("DEMO_TENANT_EXTERNAL_ID", "00000000-0000-0000-0000-000000000001"))
        tenant, _ = Tenant.objects.update_or_create(
            external_id=external_id,
            defaults={
                "name": os.getenv("DEMO_TENANT_NAME", "Thesis Demo Store"),
                "domain": os.getenv("DEMO_TENANT_DOMAIN", "demo.local"),
                "tier": Tenant.Tier.FULL,
                "status": Tenant.Status.ACTIVE,
            },
        )

        email = os.getenv("DEMO_ADMIN_EMAIL", "demo@example.com")
        password = os.getenv("DEMO_ADMIN_PASSWORD", "change-me-demo-password")
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=email,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        if created or not user.check_password(password):
            user.email = email
            user.is_staff = True
            user.is_superuser = True
            user.set_password(password)
            user.save()

        TeamMember.objects.get_or_create(
            tenant=tenant,
            user=user,
            defaults={"role": TeamMember.Role.OWNER},
        )

        raw_key = os.getenv("DEMO_OBSERVER_API_KEY", "tk_full_demo_mvp")
        digest = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
        APIKey.objects.update_or_create(
            tenant=tenant,
            key_hash=digest,
            defaults={
                "name": "Thesis MVP demo key",
                "prefix": APIKey._prefix_for_tier(Tenant.Tier.FULL),
                "tier": Tenant.Tier.FULL,
                "suffix_len": max(0, len(raw_key) - len(APIKey._prefix_for_tier(Tenant.Tier.FULL))),
                "is_active": True,
            },
        )

        self.stdout.write(self.style.SUCCESS(f"Demo tenant ready: id={tenant.id} external_id={tenant.external_id} user={email}"))
