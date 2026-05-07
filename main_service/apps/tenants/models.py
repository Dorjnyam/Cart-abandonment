import hashlib
import secrets
import uuid

from django.conf import settings
from django.db import models


class Tenant(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'

    class Tier(models.TextChoices):
        BASIC = 'basic', 'Basic'
        SMART = 'smart', 'Smart'
        FULL = 'full', 'Full'

    name = models.CharField(max_length=200)
    external_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    domain = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    tier = models.CharField(max_length=10, choices=Tier.choices, default=Tier.BASIC)
    timezone = models.CharField(max_length=64, default="UTC")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f'{self.name} ({self.domain})'


class APIKey(models.Model):
    class Tier(models.TextChoices):
        BASIC = 'basic', 'Basic'
        SMART = 'smart', 'Smart'
        FULL = 'full', 'Full'

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='apikeys')

    name = models.CharField(max_length=100, blank=True, default="")

    # SHA-256 hex digest.
    key_hash = models.CharField(max_length=64, unique=True, db_index=True)

    # Helps client-side/observer-side parsing: `tk_full_...`
    prefix = models.CharField(max_length=32)
    tier = models.CharField(max_length=10, choices=Tier.choices)

    suffix_len = models.PositiveIntegerField(default=12)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    last_shown_at = models.DateTimeField(null=True, blank=True)

    @staticmethod
    def _prefix_for_tier(tier: str) -> str:
        mapping = {
            Tenant.Tier.BASIC: 'tk_basic_',
            Tenant.Tier.SMART: 'tk_smart_',
            Tenant.Tier.FULL: 'tk_full_',
        }
        return mapping[Tenant.Tier(tier)]

    @classmethod
    def generate_raw_key(cls, tier: str, suffix_len: int = 12) -> tuple[str, str]:
        """
        Returns (raw_key, sha256_hash).
        raw_key should be shown to user exactly once; store only sha256 hash.
        """
        prefix = cls._prefix_for_tier(tier)

        # 12 hex chars -> 6 bytes. Truncate to keep exact length stable.
        byte_len = (suffix_len + 1) // 2
        suffix = secrets.token_hex(byte_len)[:suffix_len]
        raw_key = f'{prefix}{suffix}'
        digest = hashlib.sha256(raw_key.encode('utf-8')).hexdigest()
        return raw_key, digest

    def __str__(self) -> str:
        return f'APIKey(tenant={self.tenant_id}, tier={self.tier}, active={self.is_active})'


class TeamMember(models.Model):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        OWNER = 'owner', 'Owner'
        MEMBER = 'member', 'Member'
        DEVELOPER = 'developer', 'Developer'

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tenant_memberships')
    role = models.CharField(max_length=20, choices=Role.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['tenant', 'user'], name='unique_tenant_user'),
        ]

    def __str__(self) -> str:
        return f'{self.user_id}@{self.tenant_id} ({self.role})'
