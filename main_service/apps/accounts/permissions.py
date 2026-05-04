from rest_framework.permissions import BasePermission

from apps.tenants.models import TeamMember


class HasTenantRole(BasePermission):
    """
    Generic permission: ensures request.user has one of the allowed roles for a given tenant.
    """

    allowed_roles: set[str] | None = None
    tenant_id_field: str = 'tenant_id'

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if not self.allowed_roles:
            return True

        tenant_id = (
            request.data.get(self.tenant_id_field)
            or request.query_params.get(self.tenant_id_field)
            or getattr(getattr(view, 'kwargs', {}), 'get', lambda _k: None)(self.tenant_id_field)
        )
        if not tenant_id:
            return False

        return TeamMember.objects.filter(
            user=request.user,
            tenant_id=tenant_id,
            role__in=list(self.allowed_roles),
        ).exists()

