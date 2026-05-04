from django.contrib import admin
from django.utils.html import format_html

from apps.analytics.models import (
    Diagnosis,
    PredictionResult,
    ProcessedSession,
    Recommendation,
    Session,
    VisitorOutcome,
)

# ── Туслах функцууд ──────────────────────────────────────────────────────────

def _risk_badge(max_score: float) -> str:
    if max_score > 0.75:
        color, label = "#dc3545", "Өндөр эрсдэл"
    elif max_score > 0.5:
        color, label = "#fd7e14", "Дунд эрсдэл"
    else:
        color, label = "#198754", "Бага эрсдэл"
    return format_html(
        '<span style="background:{};color:#fff;padding:2px 9px;'
        'border-radius:4px;font-size:11px;font-weight:600">{}</span>',
        color, label,
    )


# ── Дэд жагсаалт ─────────────────────────────────────────────────────────────

class PredictionResultInline(admin.StackedInline):
    model               = PredictionResult
    extra               = 0
    can_delete          = False
    verbose_name        = "Таамаглалын үр дүн"
    verbose_name_plural = "Таамаглалын үр дүн"
    readonly_fields     = ("model_variant", "predicted_class", "prediction_score",
                           "abandonment_probability", "confidence", "model_version",
                           "predicted_at", "created_at", "shap_preview")
    fields              = ("model_variant", "predicted_class", "prediction_score",
                           "abandonment_probability", "confidence",
                           "model_version", "predicted_at", "shap_preview")

    @admin.display(description="SHAP утгууд (товч)")
    def shap_preview(self, obj):
        if not isinstance(obj.shap_values, dict):
            return "—"
        top = sorted(obj.shap_values.items(), key=lambda x: abs(float(x[1])), reverse=True)[:5]
        rows = "".join(
            f"<tr><td style='padding:1px 6px'>{k}</td>"
            f"<td style='padding:1px 6px;text-align:right'>{float(v):.4f}</td></tr>"
            for k, v in top
        )
        return format_html(
            "<table style='font-size:12px;border-collapse:collapse'>"
            "<tr><th style='padding:1px 6px'>Онцлог</th>"
            "<th style='padding:1px 6px'>Утга</th></tr>{}</table>",
            rows,
        )


class VisitorOutcomeInline(admin.StackedInline):
    model               = VisitorOutcome
    extra               = 0
    can_delete          = False
    verbose_name        = "Бодит үр дүн"
    readonly_fields     = ("actual_abandoned", "outcome_observed_at", "created_at")
    fields              = ("actual_abandoned", "outcome_observed_at", "created_at")


# ── Сесс ─────────────────────────────────────────────────────────────────────

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display    = ("id", "session_id_short", "visitor_id_short", "tenant",
                       "device_badge", "event_count", "page_views",
                       "has_prediction", "started_at", "ended_at")
    search_fields   = ("session_id", "visitor_id", "tenant__name")
    list_filter     = ("tenant", "device_type", "started_at")
    ordering        = ("-started_at",)
    readonly_fields = ("session_id", "visitor_id", "tenant", "started_at",
                       "ended_at", "event_count", "page_views", "device_type", "created_at")
    inlines         = [PredictionResultInline, VisitorOutcomeInline]
    list_per_page   = 30

    fieldsets = (
        ("Сессийн мэдээлэл", {
            "fields": ("session_id", "visitor_id", "tenant"),
        }),
        ("Үйл ажиллагаа", {
            "fields": ("event_count", "page_views", "device_type"),
        }),
        ("Хугацаа", {
            "fields": ("started_at", "ended_at", "created_at"),
        }),
    )

    @admin.display(description="Сесс ID")
    def session_id_short(self, obj):
        return format_html(
            '<code style="font-size:11px">{}</code>',
            obj.session_id[:16] + "…" if len(obj.session_id) > 16 else obj.session_id,
        )

    @admin.display(description="Зочин ID")
    def visitor_id_short(self, obj):
        return obj.visitor_id[:12] + "…" if len(obj.visitor_id) > 12 else obj.visitor_id

    @admin.display(description="Төхөөрөмж")
    def device_badge(self, obj):
        icons = {"mobile": "📱", "tablet": "📟", "desktop": "🖥️"}
        icon  = icons.get((obj.device_type or "").lower(), "❓")
        label = obj.device_type or "Тодорхойгүй"
        return format_html("{} {}", icon, label)

    @admin.display(description="Таамаглал?", boolean=True)
    def has_prediction(self, obj):
        return hasattr(obj, "prediction") and obj.prediction is not None

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("tenant").prefetch_related("prediction")


# ── Таамаглалын үр дүн ───────────────────────────────────────────────────────

@admin.register(PredictionResult)
class PredictionResultAdmin(admin.ModelAdmin):
    list_display    = ("id", "session_id_link", "tenant", "model_variant_badge",
                       "predicted_class_badge", "abandonment_probability",
                       "confidence_bar", "predicted_at")
    search_fields   = ("session__session_id", "session__visitor_id", "tenant__name",
                       "model_variant", "predicted_class")
    list_filter     = ("model_variant", "predicted_class", "tenant", "predicted_at")
    ordering        = ("-predicted_at", "-created_at")
    readonly_fields = ("session", "tenant", "prediction_score", "predicted_class",
                       "model_variant", "abandonment_probability", "confidence",
                       "model_version", "predicted_at", "created_at", "shap_table")
    list_per_page   = 30

    fieldsets = (
        ("Сесс", {
            "fields": ("session", "tenant"),
        }),
        ("Таамаглалын үр дүн", {
            "fields": ("model_variant", "predicted_class", "prediction_score",
                       "abandonment_probability", "confidence", "model_version", "predicted_at"),
        }),
        ("SHAP утгууд", {
            "fields": ("shap_table",),
            "classes": ("collapse",),
        }),
        ("Огноо", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Сесс")
    def session_id_link(self, obj):
        sid = obj.session.session_id if obj.session else "—"
        return format_html('<code style="font-size:11px">{}</code>',
                           sid[:16] + "…" if len(sid) > 16 else sid)

    @admin.display(description="Загварын хувилбар")
    def model_variant_badge(self, obj):
        colors = {"baseline": "#6c757d", "extended": "#0d6efd", "full": "#198754"}
        color  = colors.get(obj.model_variant, "#6c757d")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:11px">{}</span>', color, obj.model_variant,
        )

    @admin.display(description="Үр дүн")
    def predicted_class_badge(self, obj):
        is_abandoned = obj.predicted_class in ("abandoned", "abandon")
        color = "#dc3545" if is_abandoned else "#198754"
        label = "Орхисон" if is_abandoned else "Хийсэн"
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 9px;'
            'border-radius:4px;font-size:11px">{}</span>', color, label,
        )

    @admin.display(description="Итгэлцэл")
    def confidence_bar(self, obj):
        if obj.confidence is None:
            return "—"
        pct = int(round(obj.confidence * 100))
        color = "#198754" if pct >= 70 else ("#fd7e14" if pct >= 40 else "#dc3545")
        return format_html(
            '<div style="width:80px;background:#e9ecef;border-radius:3px;height:14px">'
            '<div style="width:{}%;background:{};border-radius:3px;height:14px;'
            'display:flex;align-items:center;justify-content:center">'
            '<span style="font-size:10px;color:#fff;font-weight:600">{}%</span>'
            "</div></div>",
            min(pct, 100), color, pct,
        )

    @admin.display(description="SHAP утгууд")
    def shap_table(self, obj):
        if not isinstance(obj.shap_values, dict) or not obj.shap_values:
            return "—"
        top = sorted(obj.shap_values.items(), key=lambda x: abs(float(x[1])), reverse=True)[:15]
        rows = "".join(
            f"<tr><td style='padding:2px 8px;border-bottom:1px solid #dee2e6'>{k}</td>"
            f"<td style='padding:2px 8px;border-bottom:1px solid #dee2e6;"
            f"text-align:right;color:{'#dc3545' if float(v) > 0 else '#198754'}'>"
            f"{float(v):+.5f}</td></tr>"
            for k, v in top
        )
        return format_html(
            "<table style='font-size:12px;border-collapse:collapse;min-width:240px'>"
            "<thead><tr>"
            "<th style='padding:2px 8px;background:#f8f9fa;text-align:left'>Онцлог</th>"
            "<th style='padding:2px 8px;background:#f8f9fa;text-align:right'>SHAP утга</th>"
            "</tr></thead><tbody>{}</tbody></table>",
            rows,
        )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("session", "tenant")


# ── Оношилгоо ────────────────────────────────────────────────────────────────

@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display    = ("id", "tenant", "session_id_short", "visitor_id_short",
                       "tier_badge", "risk_display", "dominant_label", "status_badge", "created_at")
    search_fields   = ("tenant__name", "session_id", "visitor_id")
    list_filter     = ("tenant", "tier", "status", "created_at")
    ordering        = ("-created_at",)
    readonly_fields = ("tenant", "session_id", "visitor_id", "tier",
                       "score_s1", "score_s2", "score_s3", "score_s4",
                       "score_s5", "score_s6", "score_s7", "status", "created_at",
                       "scores_visual")
    list_per_page   = 30

    fieldsets = (
        ("Сессийн мэдээлэл", {
            "fields": ("tenant", "session_id", "visitor_id", "tier"),
        }),
        ("Оноонууд (S1–S7)", {
            "fields": ("scores_visual",
                       "score_s1", "score_s2", "score_s3", "score_s4",
                       "score_s5", "score_s6", "score_s7"),
        }),
        ("Байдал", {
            "fields": ("status", "created_at"),
        }),
    )

    _SCORE_LABELS = {
        "S1": "Оролцоо",
        "S2": "Төлбөрийн явц",
        "S3": "Буцах санаа",
        "S4": "Үнэний мэдрэмж",
        "S5": "Сагсны баталгаа",
        "S6": "Навигацийн гүн",
        "S7": "Хуудсанд байсан хугацаа",
    }

    @admin.display(description="Сесс ID")
    def session_id_short(self, obj):
        return format_html('<code style="font-size:11px">{}</code>',
                           obj.session_id[:16] + "…" if len(obj.session_id) > 16 else obj.session_id)

    @admin.display(description="Зочин ID")
    def visitor_id_short(self, obj):
        s = obj.visitor_id
        return s[:12] + "…" if len(s) > 12 else s

    @admin.display(description="Шат")
    def tier_badge(self, obj):
        colors = {"basic": "#6c757d", "smart": "#0d6efd", "full": "#198754"}
        labels = {"basic": "Суурь", "smart": "Ухаалаг", "full": "Бүрэн"}
        color  = colors.get(obj.tier, "#6c757d")
        label  = labels.get(obj.tier, obj.tier)
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 7px;'
            'border-radius:4px;font-size:11px">{}</span>', color, label,
        )

    @admin.display(description="Эрсдэл")
    def risk_display(self, obj):
        scores = [float(getattr(obj, f"score_s{i}")) for i in range(1, 8)]
        return _risk_badge(max(scores))

    @admin.display(description="Давамгайлах оноо")
    def dominant_label(self, obj):
        scores = {f"S{i}": float(getattr(obj, f"score_s{i}")) for i in range(1, 8)}
        key    = max(scores, key=lambda k: scores[k])
        val    = scores[key]
        label  = self._SCORE_LABELS.get(key, key)
        return format_html(
            '<strong>{}</strong> <span style="color:#6c757d;font-size:11px">({} — {:.2f})</span>',
            key, label, val,
        )

    @admin.display(description="Байдал")
    def status_badge(self, obj):
        color = "#198754" if obj.status == "created" else "#dc3545"
        label = "Үүссэн" if obj.status == "created" else "Алдаатай"
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:11px">{}</span>', color, label,
        )

    @admin.display(description="Оноонуудын харагдац")
    def scores_visual(self, obj):
        labels = self._SCORE_LABELS
        rows = ""
        for i in range(1, 8):
            key   = f"S{i}"
            val   = float(getattr(obj, f"score_s{i}"))
            pct   = int(round(val * 100))
            color = "#dc3545" if val > 0.75 else ("#fd7e14" if val > 0.5 else "#198754")
            rows += (
                f"<tr>"
                f"<td style='padding:3px 8px;min-width:50px'><strong>{key}</strong></td>"
                f"<td style='padding:3px 8px;color:#555;font-size:12px'>{labels.get(key, key)}</td>"
                f"<td style='padding:3px 8px;width:160px'>"
                f"<div style='background:#e9ecef;border-radius:3px;height:16px'>"
                f"<div style='width:{pct}%;background:{color};border-radius:3px;height:16px;"
                f"display:flex;align-items:center;justify-content:flex-end;padding-right:4px'>"
                f"<span style='font-size:10px;color:#fff;font-weight:600'>{val:.3f}</span>"
                f"</div></div></td></tr>"
            )
        return format_html(
            "<table style='border-collapse:collapse;font-size:13px'>{}</table>", rows
        )


# ── Зөвлөмж ──────────────────────────────────────────────────────────────────

@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display    = ("id", "tenant", "diagnosis_link", "dominant_score",
                       "severity_badge", "status_badge", "implemented_at", "created_at")
    search_fields   = ("tenant__name", "diagnosis__session_id", "text_mn")
    list_filter     = ("tenant", "status", "created_at")
    ordering        = ("-created_at",)
    readonly_fields = ("tenant", "diagnosis", "dominant_score", "status",
                       "implemented_at", "implemented_by", "created_at")
    list_per_page   = 30

    fieldsets = (
        ("Холбоос", {
            "fields": ("tenant", "diagnosis"),
        }),
        ("Агуулга", {
            "fields": ("text_mn", "dominant_score"),
        }),
        ("Хэрэгжилт", {
            "fields": ("status", "implemented_at", "implemented_by", "created_at"),
        }),
    )

    @admin.display(description="Оношилгоо")
    def diagnosis_link(self, obj):
        if obj.diagnosis:
            return format_html('<code style="font-size:11px">{}</code>',
                               obj.diagnosis.session_id[:16])
        return "—"

    @admin.display(description="Ноцтой байдал")
    def severity_badge(self, obj):
        score = float(obj.dominant_score)
        if score >= 0.75:
            color, label = "#dc3545", "Хэт өндөр"
        elif score >= 0.5:
            color, label = "#fd7e14", "Өндөр"
        elif score >= 0.25:
            color, label = "#ffc107", "Дунд"
        else:
            color, label = "#198754", "Бага"
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 9px;'
            'border-radius:4px;font-size:11px">{}</span>', color, label,
        )

    @admin.display(description="Төлөв")
    def status_badge(self, obj):
        mapping = {
            "created":     ("#6c757d", "Шинэ"),
            "viewed":      ("#0d6efd", "Харсан"),
            "implemented": ("#198754", "Хэрэгжсэн"),
        }
        color, label = mapping.get(obj.status, ("#6c757d", obj.status))
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 9px;'
            'border-radius:4px;font-size:11px">{}</span>', color, label,
        )

    actions = ["mark_implemented"]

    @admin.action(description="✓ Хэрэгжсэн гэж тэмдэглэх")
    def mark_implemented(self, request, queryset):
        from django.utils import timezone as tz
        n = 0
        for rec in queryset.exclude(status=Recommendation.Status.IMPLEMENTED):
            rec.mark_implemented(user_id=request.user.id)
            n += 1
        self.message_user(request, f"{n} зөвлөмжийг хэрэгжсэн гэж тэмдэглэлээ.")


# ── Боловсруулсан сесс ───────────────────────────────────────────────────────

@admin.register(ProcessedSession)
class ProcessedSessionAdmin(admin.ModelAdmin):
    list_display    = ("id", "tenant", "observer_session_id_short",
                       "visitor_id_short", "tier_badge", "processed_at")
    search_fields   = ("observer_session_id", "visitor_id", "tenant__name")
    list_filter     = ("tenant", "tier", "processed_at")
    ordering        = ("-processed_at",)
    readonly_fields = ("observer_session_id", "visitor_id", "tenant", "tier", "processed_at")
    list_per_page   = 30

    @admin.display(description="Ажиглагчийн сесс ID")
    def observer_session_id_short(self, obj):
        s = obj.observer_session_id
        return format_html('<code style="font-size:11px">{}</code>',
                           s[:16] + "…" if len(s) > 16 else s)

    @admin.display(description="Зочин ID")
    def visitor_id_short(self, obj):
        s = obj.visitor_id
        return s[:12] + "…" if len(s) > 12 else s

    @admin.display(description="Шат")
    def tier_badge(self, obj):
        colors = {"basic": "#6c757d", "smart": "#0d6efd", "full": "#198754"}
        labels = {"basic": "Суурь", "smart": "Ухаалаг", "full": "Бүрэн"}
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 7px;'
            'border-radius:4px;font-size:11px">{}</span>',
            colors.get(obj.tier, "#6c757d"), labels.get(obj.tier, obj.tier),
        )


# ── Бодит үр дүн ─────────────────────────────────────────────────────────────

@admin.register(VisitorOutcome)
class VisitorOutcomeAdmin(admin.ModelAdmin):
    list_display    = ("id", "session_link", "outcome_badge",
                       "outcome_observed_at", "created_at")
    search_fields   = ("session__session_id", "session__visitor_id")
    list_filter     = ("actual_abandoned", "outcome_observed_at")
    ordering        = ("-outcome_observed_at",)
    readonly_fields = ("session", "actual_abandoned", "outcome_observed_at", "created_at")
    list_per_page   = 30

    @admin.display(description="Сесс")
    def session_link(self, obj):
        if not obj.session:
            return "—"
        sid = obj.session.session_id
        return format_html('<code style="font-size:11px">{}</code>',
                           sid[:16] + "…" if len(sid) > 16 else sid)

    @admin.display(description="Бодит үр дүн")
    def outcome_badge(self, obj):
        if obj.actual_abandoned:
            return format_html(
                '<span style="background:#dc3545;color:#fff;padding:2px 9px;'
                'border-radius:4px;font-size:11px">Орхисон ✗</span>'
            )
        return format_html(
            '<span style="background:#198754;color:#fff;padding:2px 9px;'
            'border-radius:4px;font-size:11px">Худалдаа хийсэн ✓</span>'
        )
