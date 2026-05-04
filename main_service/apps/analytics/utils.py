from rest_framework.exceptions import PermissionDenied

from apps.tenants.models import TeamMember, Tenant


def get_tenant(request):
    """
    Resolve the active tenant for a JWT-authenticated request.
    If the user belongs to more than one tenant, require ?tenant_id= param.
    """
    user = request.user
    memberships = (
        TeamMember.objects.select_related("tenant")
        .filter(user=user, tenant__status=Tenant.Status.ACTIVE)
    )
    tenant_id = request.query_params.get("tenant_id")
    if tenant_id:
        memberships = memberships.filter(tenant_id=tenant_id)

    count = memberships.count()
    if count == 1:
        return memberships.first().tenant
    if count > 1:
        raise PermissionDenied(
            "User belongs to multiple tenants. Pass ?tenant_id= to disambiguate."
        )
    raise PermissionDenied("No active tenant associated with this account.")
