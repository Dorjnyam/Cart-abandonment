from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.html import format_html

# ── Монгол хэлний гарчиг ────────────────────────────────────────────────────
admin.site.site_header = "Карт Аналитикс — Удирдлагын самбар"
admin.site.site_title  = "Карт Аналитикс"
admin.site.index_title = "Тавтай морилно уу"

User = get_user_model()

# Django's default auth app pre-registers User — unregister before overriding.
if admin.site.is_registered(User):
    admin.site.unregister(User)


@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display   = ("id", "email", "username", "full_name_display",
                      "is_active_badge", "is_staff", "date_joined", "last_login")
    search_fields  = ("email", "username", "first_name", "last_name")
    list_filter    = ("is_active", "is_staff", "is_superuser", "date_joined")
    ordering       = ("-date_joined",)
    readonly_fields = ("last_login", "date_joined")
    list_per_page  = 30

    fieldsets = (
        ("Нэвтрэх мэдээлэл", {
            "fields": ("username", "email", "password"),
        }),
        ("Хувийн мэдээлэл", {
            "fields": ("first_name", "last_name"),
        }),
        ("Эрх ба хандалт", {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
        }),
        ("Бүртгэлийн огноо", {
            "fields": ("last_login", "date_joined"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Бүтэн нэр")
    def full_name_display(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or format_html('<span style="color:#aaa">—</span>')

    @admin.display(description="Төлөв", boolean=False)
    def is_active_badge(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="background:#198754;color:#fff;padding:2px 10px;'
                'border-radius:4px;font-size:11px">Идэвхтэй</span>'
            )
        return format_html(
            '<span style="background:#dc3545;color:#fff;padding:2px 10px;'
            'border-radius:4px;font-size:11px">Идэвхгүй</span>'
        )

    actions = ["make_active", "make_inactive", "make_staff", "remove_staff"]

    @admin.action(description="✓ Идэвхтэй болгох")
    def make_active(self, request, queryset):
        n = queryset.update(is_active=True)
        self.message_user(request, f"{n} хэрэглэгчийг идэвхтэй болголоо.")

    @admin.action(description="✗ Идэвхгүй болгох")
    def make_inactive(self, request, queryset):
        n = queryset.update(is_active=False)
        self.message_user(request, f"{n} хэрэглэгчийг идэвхгүй болголоо.")

    @admin.action(description="⭐ Ажилтан болгох (staff)")
    def make_staff(self, request, queryset):
        n = queryset.update(is_staff=True)
        self.message_user(request, f"{n} хэрэглэгчийг ажилтан болголоо.")

    @admin.action(description="✗ Ажилтны эрх хасах")
    def remove_staff(self, request, queryset):
        n = queryset.update(is_staff=False)
        self.message_user(request, f"{n} хэрэглэгчийн ажилтны эрхийг хаслаа.")
