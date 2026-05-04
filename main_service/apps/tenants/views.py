from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tenants.models import APIKey, Tenant, TeamMember
from apps.tenants.serializers import APIKeyGenerateSerializer, TenantCreateSerializer, TeamInviteSerializer


class AdminTenantCreateView(APIView):
    """
    WF-01: Admin creates Tenant + becomes Tenant owner.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not (request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TenantCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data

        tenant = Tenant.objects.create(
            name=v['name'],
            domain=v['domain'],
            tier=v['tier'],
            status=Tenant.Status.ACTIVE,
        )

        TeamMember.objects.create(
            tenant=tenant,
            user=request.user,
            role=TeamMember.Role.OWNER,
        )

        return Response(
            {
                'id': tenant.id,
                'name': tenant.name,
                'domain': tenant.domain,
                'tier': tenant.tier,
                'status': tenant.status,
                'owner_user_id': request.user.id,
            },
            status=status.HTTP_201_CREATED,
        )


class TenantAPIKeyGenerateView(APIView):
    """
    WF-01: Tenant owner/admin generates one-time raw API key.
    Observer seed contract is returned in `observer_install_snippet`.
    """

    permission_classes = [IsAuthenticated]

    def _resolve_tenant(self, request):
        memberships = TeamMember.objects.select_related('tenant').filter(
            user=request.user,
            role__in=[TeamMember.Role.OWNER, TeamMember.Role.ADMIN],
            tenant__status=Tenant.Status.ACTIVE,
        )

        tenant_id = request.data.get('tenant_id') or request.query_params.get('tenant_id')
        if tenant_id:
            memberships = memberships.filter(tenant_id=tenant_id)

        if memberships.count() == 1:
            return memberships.first().tenant
        if memberships.count() == 0:
            return None
        # Multiple tenants: caller must specify tenant_id.
        raise ValueError('Multiple active tenants matched; specify tenant_id.')

    def post(self, request):
        tenant = self._resolve_tenant(request)
        if tenant is None:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        # WF-11 rotation: deactivate previous active keys for this tenant.
        APIKey.objects.filter(tenant=tenant, is_active=True).update(is_active=False)

        serializer = APIKeyGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data

        tier = v['tier']
        suffix_len = v.get('suffix_len') or 12

        raw_key, key_hash = APIKey.generate_raw_key(tier=tier, suffix_len=suffix_len)

        api_key = APIKey.objects.create(
            tenant=tenant,
            key_hash=key_hash,
            prefix=APIKey._prefix_for_tier(tier),
            tier=tier,
            suffix_len=suffix_len,
            is_active=True,
            last_shown_at=timezone.now(),
        )

        observer_install_snippet = (
            f'<script data-key="{raw_key}" data-tenant-id="{tenant.id}" data-tier="{tier}"></script>'
        )

        return Response(
            {
                'raw_key': raw_key,
                'tenant_id': tenant.id,
                'tier': tier,
                'observer_install_snippet': observer_install_snippet,
                'api_key_id': api_key.id,
            },
            status=status.HTTP_201_CREATED,
        )


class TeamListView(APIView):
    """
    WF-10: List current tenant team members.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = TeamMember.objects.select_related('tenant').filter(
            user=request.user,
            tenant__status=Tenant.Status.ACTIVE,
            role__in=[TeamMember.Role.OWNER, TeamMember.Role.ADMIN, TeamMember.Role.MEMBER, TeamMember.Role.DEVELOPER],
        )
        tenant_id = request.query_params.get('tenant_id')
        if tenant_id:
            memberships = memberships.filter(tenant_id=tenant_id)

        if memberships.count() != 1:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        tenant = memberships.first().tenant
        team = TeamMember.objects.select_related('user').filter(tenant=tenant).order_by('created_at')
        return Response(
            {
                'tenant_id': tenant.id,
                'members': [
                    {
                        'user_id': m.user_id,
                        'email': getattr(m.user, 'email', None),
                        'role': m.role,
                        'created_at': m.created_at,
                    }
                    for m in team
                ],
            },
            status=status.HTTP_200_OK,
        )


class TeamInviteView(APIView):
    """
    WF-10: Owner invites (or assigns) a user to the tenant.
    """

    permission_classes = [IsAuthenticated]

    def _resolve_owner_tenant(self, request):
        memberships = TeamMember.objects.select_related('tenant').filter(
            user=request.user,
            role=TeamMember.Role.OWNER,
            tenant__status=Tenant.Status.ACTIVE,
        )
        tenant_id = request.data.get('tenant_id') or request.query_params.get('tenant_id')
        if tenant_id:
            memberships = memberships.filter(tenant_id=tenant_id)
        if memberships.count() == 1:
            return memberships.first().tenant
        return None

    def post(self, request):
        tenant = self._resolve_owner_tenant(request)
        if not tenant:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TeamInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data

        email = v['email']
        role = v['role']

        User = get_user_model()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            # MVP: create an inactive/unknown-password user.
            username = email.split('@')[0] or email
            user = User.objects.create(username=username, email=email, is_active=True)
            user.set_unusable_password()
            user.save(update_fields=['password'])

        tm, created = TeamMember.objects.get_or_create(tenant=tenant, user=user, defaults={'role': role})
        if not created and tm.role != role:
            tm.role = role
            tm.save(update_fields=['role'])

        return Response(
            {
                'tenant_id': tenant.id,
                'user_id': user.id,
                'email': user.email,
                'role': tm.role,
            },
            status=status.HTTP_201_CREATED,
        )
