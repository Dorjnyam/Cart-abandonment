from django.urls import path

from apps.tenants.views import (
    AdminTenantCreateView,
    TeamInviteView,
    TeamListView,
    TenantAPIKeyGenerateView,
)

urlpatterns = [
    path('admin/tenants/', AdminTenantCreateView.as_view(), name='admin-tenants-create'),
    path('tenant/apikey/generate/', TenantAPIKeyGenerateView.as_view(), name='tenant-apikey-generate'),
    path('team/', TeamListView.as_view(), name='team-list'),
    path('team/invite/', TeamInviteView.as_view(), name='team-invite'),
]

