from rest_framework import serializers

from apps.tenants.models import Tenant


class TenantCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    domain = serializers.CharField(max_length=255)
    tier = serializers.ChoiceField(choices=Tenant.Tier.choices)


class APIKeyGenerateSerializer(serializers.Serializer):
    tier = serializers.ChoiceField(choices=Tenant.Tier.choices)

    # Optional: allow future tuning while keeping a default stable.
    suffix_len = serializers.IntegerField(required=False, min_value=8, max_value=32)


class TeamInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    # Keep MVP consistent with your WF-10: invite roles are member/developer.
    role = serializers.ChoiceField(choices=[('member', 'member'), ('developer', 'developer')])

