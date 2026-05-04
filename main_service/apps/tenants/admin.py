from django.contrib import admin
from django.utils.html import format_html

from apps.tenants.models import APIKey, TeamMember, Tenant

# ── Дэд жагсаалт (Inline) ───────────────────────────────────────────────────

class APIKeyInline(admin.TabularInline):
    model           = APIKey
    extra           = 0
    can_delete      = False
    verbose_name        = "API түлхүүр"
    verbose_name_plural = "API түлхүүрүүд"
    readonly_fields = ("name", "prefix", "tier", "key_hash_short", "is_active",
                       "created_at", "last_shown_at")
    fields          = ("name", "prefix", "tier", "is_active", "key_hash_short", "created_at")

    @admin.display(description="Түлхүүр (товч)")
    def key_hash_short(self, obj):
        if not obj.key_hash:
            return "—"
        h = obj.key_hash
        return format_html(
            '<code style="font-size:11px">{}…{}</code>', h[:8], h[-6:]
        )


class TeamMemberInline(admin.TabularInline):
    model               = TeamMember
    extra               = 0
    verbose_name        = "Гишүүн"
    verbose_name_plural = "Багийн гишүүд"
    readonly_fields     = ("created_at",)
    fields              = ("user", "role", "created_at")
    autocomplete_fields = ("user",)


# ── Байгууллага ──────────────────────────────────────────────────────────────

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display   = ("id", "name", "domain", "tier_badge", "status_badge",
                      "member_count", "timezone", "created_at")
    search_fields  = ("name", "domain")
    list_filter    = ("tier", "status", "created_at")
    ordering       = ("-created_at",)
    readonly_fields = ("created_at",)
    inlines        = [APIKeyInline, TeamMemberInline]
    list_per_page  = 25

    fieldsets = (
        ("Үндсэн мэдээлэл", {
            "fields": ("name", "domain"),
        }),
        ("Тохиргоо", {
            "fields": ("status", "tier", "timezone"),
        }),
        ("Бүртгэлийн огноо", {
            "fields": ("created_at",),
            "classes": ("collapse",),
        }),
    )

    _TIER_COLORS  = {"basic": "#6c757d", "smart": "#0d6efd", "full": "#198754"}
    _TIER_LABELS  = {"basic": "Суурь",   "smart": "Ухаалаг", "full": "Бүрэн"}

    @admin.display(description="Багц")
    def tier_badge(self, obj):
        color = self._TIER_COLORS.get(obj.tier, "#6c757d")
        label = self._TIER_LABELS.get(obj.tier, obj.tier)
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 9px;'
            'border-radius:4px;font-size:11px;font-weight:600">{}</span>',
            color, label,
        )

    @admin.display(description="Төлөв")
    def status_badge(self, obj):
        active = obj.status == Tenant.Status.ACTIVE
        color  = "#198754" if active else "#dc3545"
        label  = "Идэвхтэй" if active else "Идэвхгүй"
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 9px;'
            'border-radius:4px;font-size:11px">{}</span>',
            color, label,
        )

    @admin.display(description="Гишүүд")
    def member_count(self, obj):
        return obj.members.count()

    actions = ["activate_tenants", "deactivate_tenants"]

    @admin.action(description="✓ Идэвхтэй болгох")
    def activate_tenants(self, request, queryset):
        n = queryset.update(status=Tenant.Status.ACTIVE)
        self.message_user(request, f"{n} байгууллагыг идэвхтэй болголоо.")

    @admin.action(description="✗ Идэвхгүй болгох")
    def deactivate_tenants(self, request, queryset):
        n = queryset.update(status=Tenant.Status.INACTIVE)
        self.message_user(request, f"{n} байгууллагыг идэвхгүй болголоо.")


# ── API Түлхүүр ──────────────────────────────────────────────────────────────

@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display   = ("id", "tenant", "name", "prefix", "tier_badge",
                      "is_active_badge", "created_at", "last_shown_at", "key_hash_short")
    search_fields  = ("tenant__name", "tenant__domain", "name", "prefix", "key_hash")
    list_filter    = ("tier", "is_active", "tenant", "created_at")
    ordering       = ("-created_at",)
    readonly_fields = ("key_hash", "prefix", "created_at", "last_shown_at")
    list_per_page  = 30

    fieldsets = (
        ("Үндсэн мэдээлэл", {
            "fields": ("tenant", "name", "tier", "is_active"),
        }),
        ("Техникийн мэдээлэл", {
            "fields": ("prefix", "key_hash", "suffix_len", "last_shown_at", "created_at"),
            "classes": ("collapse",),
        }),
    )

    _TIER_COLORS = {"basic": "#6c757d", "smart": "#0d6efd", "full": "#198754"}
    _TIER_LABELS = {"basic": "Суурь",   "smart": "Ухаалаг", "full": "Бүрэн"}

    @admin.display(description="Багц")
    def tier_badge(self, obj):
        color = self._TIER_COLORS.get(obj.tier, "#6c757d")
        label = self._TIER_LABELS.get(obj.tier, obj.tier)
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:11px">{}</span>', color, label,
        )

    @admin.display(description="Төлөв")
    def is_active_badge(self, obj):
        color = "#198754" if obj.is_active else "#dc3545"
        label = "Идэвхтэй" if obj.is_active else "Хаасан"
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;'
            'border-radius:4px;font-size:11px">{}</span>', color, label,
        )

    @admin.display(description="Түлхүүр (товч)")
    def key_hash_short(self, obj):
        if not obj.key_hash:
            return "—"
        h = obj.key_hash
        return format_html('<code style="font-size:11px">{}…{}</code>', h[:8], h[-6:])

    actions = ["deactivate_keys"]

    @admin.action(description="✗ Идэвхгүй болгох (устгах биш)")
    def deactivate_keys(self, request, queryset):
        n = queryset.update(is_active=False)
        self.message_user(request, f"{n} API түлхүүрийг идэвхгүй болголоо.")


# ── Багийн гишүүн ────────────────────────────────────────────────────────────

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display   = ("id", "tenant", "user_email", "role_badge", "created_at")
    search_fields  = ("tenant__name", "user__email", "user__username")
    list_filter    = ("role", "tenant", "created_at")
    ordering       = ("-created_at",)
    readonly_fields = ("created_at",)
    autocomplete_fields = ("user",)
    list_per_page  = 30

    _ROLE_COLORS = {
        "owner":     "#dc3545",
        "admin":     "#fd7e14",
        "member":    "#0d6efd",
        "developer": "#6f42c1",
    }
    _ROLE_LABELS = {
        "owner":     "Эзэмшигч",
        "admin":     "Администратор",
        "member":    "Гишүүн",
        "developer": "Хөгжүүлэгч",
    }

    @admin.display(description="И-мэйл")
    def user_email(self, obj):
        return obj.user.email

    @admin.display(description="Үүрэг")
    def role_badge(self, obj):
        color = self._ROLE_COLORS.get(obj.role, "#6c757d")
        label = self._ROLE_LABELS.get(obj.role, obj.role)
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 9px;'
            'border-radius:4px;font-size:11px">{}</span>', color, label,
        )
