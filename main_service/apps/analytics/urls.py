from django.urls import path

from apps.analytics.views import (
    # Analytics dashboard
    AbandonmentRateView,
    AblationSummaryView,
    AnalyticsHistoryView,
    AnalyticsOverviewView,
    AnalyticsRecommendationView,
    AnalyticsRecommendationImplementView,
    AnalyticsScoresView,
    DashboardIntegrationView,
    DashboardOverviewView,
    DashboardReasonsView,
    DashboardRecommendationStatusView,
    DashboardRecommendationsView,
    DashboardSessionDetailView,
    DashboardSessionsView,
    DashboardTrendsView,
    # Diagnosis
    DiagnosisDetailView,
    DiagnosisListView,
    # Export / health
    ExportTriggerView,
    FeatureImportanceView,
    HealthView,
    MLInsightsView,
    PredictionDetailView,
    PipelineMonitorView,
    # Predictions / sessions
    PredictionsListView,
    SessionDetailView,
    SessionsListView,
    # Settings
    ApiKeyDeleteView,
    ApiKeyListCreateView,
    SettingsTeamDeleteView,
    SettingsTeamInviteView,
    SettingsTeamListView,
    StoreSettingsView,
    # Tenants (admin)
    TenantDetailView,
    TenantListView,
)

urlpatterns = [
    # Dashboard-ready thesis MVP API
    path("dashboard/overview/", DashboardOverviewView.as_view(), name="dashboard-overview"),
    path("dashboard/trends/", DashboardTrendsView.as_view(), name="dashboard-trends"),
    path("dashboard/reasons/", DashboardReasonsView.as_view(), name="dashboard-reasons"),
    path("dashboard/sessions/", DashboardSessionsView.as_view(), name="dashboard-sessions"),
    path("dashboard/sessions/<str:session_id>/", DashboardSessionDetailView.as_view(), name="dashboard-session-detail"),
    path("dashboard/recommendations/", DashboardRecommendationsView.as_view(), name="dashboard-recommendations"),
    path(
        "dashboard/recommendations/<int:id>/status/",
        DashboardRecommendationStatusView.as_view(),
        name="dashboard-recommendation-status",
    ),
    path("dashboard/integration/", DashboardIntegrationView.as_view(), name="dashboard-integration"),

    # ── Analytics dashboard ──────────────────────────────────────────────────
    path("analytics/overview/", AnalyticsOverviewView.as_view(), name="analytics-overview"),
    path("analytics/scores/", AnalyticsScoresView.as_view(), name="analytics-scores"),
    path("analytics/history/", AnalyticsHistoryView.as_view(), name="analytics-history"),
    path("analytics/abandonment-rate/", AbandonmentRateView.as_view(), name="analytics-abandonment-rate"),
    path("analytics/feature-importance/", FeatureImportanceView.as_view(), name="analytics-feature-importance"),
    path("analytics/recommendation/", AnalyticsRecommendationView.as_view(), name="analytics-recommendation"),
    path(
        "analytics/recommendation/<int:id>/implement/",
        AnalyticsRecommendationImplementView.as_view(),
        name="analytics-recommendation-implement",
    ),

    # ── Sessions ─────────────────────────────────────────────────────────────
    path("sessions/", SessionsListView.as_view(), name="sessions-list"),
    path("sessions/<str:session_id>/", SessionDetailView.as_view(), name="sessions-detail"),

    # ── Predictions ──────────────────────────────────────────────────────────
    path("predictions/", PredictionsListView.as_view(), name="predictions-list"),
    path("predictions/<str:session_id>/", PredictionDetailView.as_view(), name="predictions-detail"),

    # ── Ablation / export / health ───────────────────────────────────────────
    path("ablation/summary/", AblationSummaryView.as_view(), name="ablation-summary"),
    path("export/", ExportTriggerView.as_view(), name="export-trigger"),
    path("health/", HealthView.as_view(), name="health"),
    path("pipeline/monitor/", PipelineMonitorView.as_view(), name="pipeline-monitor"),
    path("ml/insights/", MLInsightsView.as_view(), name="ml-insights"),

    # ── Diagnosis ────────────────────────────────────────────────────────────
    path("diagnosis/", DiagnosisListView.as_view(), name="diagnosis-list"),
    path("diagnosis/<int:pk>/", DiagnosisDetailView.as_view(), name="diagnosis-detail"),

    # ── Tenants (admin) ──────────────────────────────────────────────────────
    path("tenants/", TenantListView.as_view(), name="tenants-list"),
    path("tenants/<int:pk>/", TenantDetailView.as_view(), name="tenants-detail"),

    # ── Settings — API keys ──────────────────────────────────────────────────
    path("settings/api-keys/", ApiKeyListCreateView.as_view(), name="settings-apikeys"),
    path("settings/api-keys/<int:pk>/", ApiKeyDeleteView.as_view(), name="settings-apikeys-delete"),

    # ── Settings — store ─────────────────────────────────────────────────────
    path("settings/store/", StoreSettingsView.as_view(), name="settings-store"),

    # ── Settings — team ──────────────────────────────────────────────────────
    path("settings/team/", SettingsTeamListView.as_view(), name="settings-team-list"),
    path("settings/team/invite/", SettingsTeamInviteView.as_view(), name="settings-team-invite"),
    path("settings/team/<int:pk>/", SettingsTeamDeleteView.as_view(), name="settings-team-delete"),
]
