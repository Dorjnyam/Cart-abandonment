"""
Human-oriented field catalog for Viewer + docs. Tier membership is derived from
``event.py`` allowlists so this file cannot drift on which keys exist per tier.

Run: ``python -m observer.models.field_catalog``
"""

from __future__ import annotations

from typing import Any

from observer.models.event import (
    ALLOWED_T1,
    ALLOWED_T2,
    ALLOWED_T3,
    CORE_DB_KEYS,
    T1_EXTRA,
    T2_EXTRA,
)

SECTORS: list[dict[str, str]] = [
    {"id": "participant", "label_mn": "Суурь оролцогч"},
    {"id": "page_nav", "label_mn": "Хуудас ба навигаци"},
    {"id": "engagement", "label_mn": "Оролцоо (scroll, цаг, даралт)"},
    {"id": "forms_copy", "label_mn": "Маягт ба copy/paste"},
    {"id": "friction", "label_mn": "Саатал ба алдаа"},
    {"id": "commerce_heuristic", "label_mn": "Дэлгүүр — автомат (URL/DOM)"},
    {"id": "commerce_explicit", "label_mn": "Дэлгүүр — товч (T1)"},
]

# (sector_id, source, label_mn, notes_mn) — one row per payload-allowed key
_FIELD_ROWS: dict[str, tuple[str, str, str, str]] = {
    "visitor_id": (
        "participant",
        "client_measured",
        "Visitor ID",
        "Cookie `_ca_visitor`-аас; мөн DB багана.",
    ),
    "session_id": (
        "participant",
        "client_measured",
        "Session ID",
        "Таб бүрт `sessionStorage`; мөн DB багана.",
    ),
    "visit_count": (
        "participant",
        "client_derived",
        "Оролтын дугаар",
        "Энэ visitor-ийн нийт session/оролтын тооллого.",
    ),
    "is_logged_in": (
        "participant",
        "client_derived",
        "Нэвтэрсэн эсэх",
        "DOM эсвэл `likely_logged_in` → сервер `is_logged_in` болгож нормчилно.",
    ),
    "customer_type": (
        "participant",
        "client_measured",
        "Хэрэглэгчийн төрөл",
        "`window._ca_user.customer_type` эсвэл `ca_user_customer_type` → нормчилно.",
    ),
    "url": (
        "page_nav",
        "client_measured",
        "Бүтэн URL",
        "DB `url` багана; payload-д давхар ирэх боломжтой.",
    ),
    "path": (
        "page_nav",
        "client_measured",
        "Зам (pathname)",
        "`location.pathname`.",
    ),
    "referrer": (
        "page_nav",
        "client_measured",
        "Referrer",
        "DB багана + payload; `document.referrer`.",
    ),
    "page_load_ms": (
        "page_nav",
        "client_measured",
        "Хуудас ачаалах ms",
        "Performance API.",
    ),
    "device_type": (
        "page_nav",
        "client_derived",
        "Төхөөрөмжийн төрөл",
        "UA + viewport heuristic: desktop / mobile / tablet.",
    ),
    "language": (
        "page_nav",
        "client_measured",
        "Хэл",
        "`navigator.language`.",
    ),
    "timezone": (
        "page_nav",
        "client_measured",
        "Цагийн бүс",
        "IANA (`Intl`).",
    ),
    "time_on_page_sec": (
        "engagement",
        "client_derived",
        "Хуудсан дээрх секунд",
        "Session эхлэлээс одоог хүртэлх хугацаа (ойролцоо).",
    ),
    "max_scroll_pct": (
        "engagement",
        "client_derived",
        "Хамгийн гүн scroll %",
        "Агуулгын өндөртэй харьцуулсан.",
    ),
    "scroll_up_count": (
        "engagement",
        "client_derived",
        "Дээш scroll",
        "Scroll listener-ийн тооллого.",
    ),
    "click_count": (
        "engagement",
        "client_derived",
        "Даралтын тоо",
        "Session доторх нийт click.",
    ),
    "active_time_ms": (
        "engagement",
        "client_derived",
        "Идэвхтэй ms",
        "Idle биш гэж тоологдсон нийт хугацаа.",
    ),
    "tab_hidden_count": (
        "engagement",
        "client_derived",
        "Таб нуугдсан удаа",
        "`visibilitychange`.",
    ),
    "tab_hidden_ms": (
        "engagement",
        "client_derived",
        "Таб нуугдсан нийт ms",
        "Нуугдсан үеийн нийлбэр.",
    ),
    "bounce": (
        "engagement",
        "client_derived",
        "Bounce",
        "Ихэвчлэн session_end-д: цөөн click ба scroll.",
    ),
    "session_duration_sec": (
        "engagement",
        "client_derived",
        "Session урт (сек)",
        "Session эхлэл — төгсгөлийн ойролцоо.",
    ),
    "copy_count": (
        "forms_copy",
        "client_derived",
        "Copy тоо",
        "Copy event-үүдийн session тооллого.",
    ),
    "form_fields_count": (
        "forms_copy",
        "client_derived",
        "Form талбарын тоо",
        "Focus хийгдсэн form элементүүд.",
    ),
    "form_fields_touched": (
        "forms_copy",
        "client_derived",
        "Form талбарууд (нэрүүд)",
        "Name/id-уудыг таслалаар нэгтгэсэн.",
    ),
    "action_detected": (
        "friction",
        "click_metadata",
        "Үйлдлийн шошго",
        "T2: жишээ нь `search`, `rage_click`; T1 click-д `data-ca` утга.",
    ),
    "rage_click": (
        "friction",
        "client_derived",
        "Rage click тоо",
        "Session-д rage burst-үүдийн тоо (`rage_click_bursts` → норм `rage_click`).",
    ),
    "outbound_click": (
        "friction",
        "client_derived",
        "Гадаад линк даралт",
        "`outbound_click_count` → норм.",
    ),
    "js_error": (
        "friction",
        "client_derived",
        "JS алдааны тоо",
        "`js_error_count` → норм (session нийлбэр).",
    ),
    "back_navigation": (
        "page_nav",
        "client_derived",
        "Ухрах навигаци",
        "`popstate` (хөтөчийн back/forward).",
    ),
    "page_view_count": (
        "engagement",
        "client_derived",
        "Page view тоо",
        "Тухайн таб дахь `sessionStorage` тооллого.",
    ),
    "detected_page_type": (
        "commerce_heuristic",
        "url_heuristic",
        "Хуудасны төрөл",
        "path/query-оос: cart, product, checkout гэх мэт.",
    ),
    "product_slug": (
        "commerce_heuristic",
        "url_heuristic",
        "Барааны slug",
        "Product URL-ийн сүүлийн сегмент.",
    ),
    "checkout_step_detected": (
        "commerce_heuristic",
        "url_heuristic",
        "Checkout алхам (heuristic)",
        "Checkout path-оос таамагласан.",
    ),
    "search_query_from_url": (
        "commerce_heuristic",
        "url_heuristic",
        "Хайлт (URL-аас)",
        "Query param: q, query, search, keyword.",
    ),
    "is_order_success": (
        "commerce_heuristic",
        "url_heuristic",
        "Захиалгын амжилт URL",
        "Thank-you path substring heuristic.",
    ),
    "search_query": (
        "commerce_heuristic",
        "client_measured",
        "Хайлтын текст (form)",
        "`search` event: form submit-ээс.",
    ),
    "filter_name": (
        "commerce_heuristic",
        "url_heuristic",
        "Шүүлтүүрийн нэр",
        "URL query.",
    ),
    "coupon_entered": (
        "commerce_heuristic",
        "url_heuristic",
        "Купон (URL)",
        "coupon, promo, discount_code param.",
    ),
    "product_id": (
        "commerce_heuristic",
        "client_measured",
        "Барааны ID",
        "Impression selector эсвэл T1 `data-ca-id`.",
    ),
    "product_price": (
        "commerce_heuristic",
        "client_measured",
        "Үнэ",
        "Impression эсвэл T1 `data-ca-price`.",
    ),
    "product_category": (
        "commerce_heuristic",
        "client_measured",
        "Ангилал",
        "Impression эсвэл T1 `data-ca-cat`.",
    ),
    "product_availability": (
        "commerce_heuristic",
        "client_measured",
        "Боломжит эсэх",
        "T1 `data-ca-availability` эсвэл `_ca_user`.",
    ),
    "selected_size": (
        "commerce_heuristic",
        "client_measured",
        "Размер",
        "T1 `data-ca-size` (T2 түлхүүр хэлбэрээр хадгалагдана).",
    ),
    "selected_quantity": (
        "commerce_heuristic",
        "client_measured",
        "Тоо ширхэг",
        "T1 `data-ca-qty`.",
    ),
    "cart_value": (
        "commerce_explicit",
        "t1_explicit",
        "Сагсны дүн",
        "`data-ca-value` эсвэл `_ca_user`.",
    ),
    "cart_item_count": (
        "commerce_explicit",
        "t1_explicit",
        "Сагсны мөрүүдийн тоо",
        "`data-ca-cart-count`.",
    ),
    "checkout_step": (
        "commerce_explicit",
        "t1_explicit",
        "Checkout алхам (тодорхой)",
        "`data-ca-step` — платформын нэр.",
    ),
    "payment_method": (
        "commerce_explicit",
        "t1_explicit",
        "Төлбөрийн арга",
        "`data-ca-payment` / `_ca_user`.",
    ),
    "shipping_method": (
        "commerce_explicit",
        "t1_explicit",
        "Хүргэлтийн арга",
        "`data-ca-shipping` / `_ca_user`.",
    ),
    "order_total": (
        "commerce_explicit",
        "t1_explicit",
        "Захиалгын нийт",
        "`data-ca-order-total` / `_ca_user` / `sendPurchase`.",
    ),
    "discount_code": (
        "commerce_explicit",
        "t1_explicit",
        "Хөнгөлөлтийн код",
        "`data-ca-discount`.",
    ),
    "is_sale": (
        "commerce_explicit",
        "t1_explicit",
        "Хямдралтай эсэх",
        "`data-ca-sale`.",
    ),
    "product_variant": (
        "commerce_explicit",
        "t1_explicit",
        "SKU / variant",
        "`data-ca-variant`.",
    ),
    "product_stock": (
        "commerce_explicit",
        "t1_explicit",
        "Нөөцийн тэмдэглэл",
        "`data-ca-stock`.",
    ),
}


def _tier_min(field: str) -> str:
    if field in T1_EXTRA:
        return "T1"
    if field in T2_EXTRA:
        return "T2"
    return "T3"


def build_field_catalog() -> dict[str, Any]:
    """JSON-serializable catalog for ``GET /api/field-catalog``."""
    fields: list[dict[str, Any]] = []
    for name in sorted(ALLOWED_T1):
        sector_id, source, label_mn, notes_mn = _FIELD_ROWS[name]
        fields.append(
            {
                "name": name,
                "tier_min": _tier_min(name),
                "in_t3": name in ALLOWED_T3,
                "in_t2_payload": name in ALLOWED_T2,
                "in_t1_payload": name in ALLOWED_T1,
                "sector_id": sector_id,
                "source": source,
                "label_mn": label_mn,
                "notes_mn": notes_mn,
            }
        )
    core = [
        {
            "name": c,
            "label_mn": {
                "visitor_id": "Visitor ID (багана)",
                "session_id": "Session ID (багана)",
                "event_type": "Event төрөл (багана)",
                "url": "URL (багана)",
                "referrer": "Referrer (багана)",
                "timestamp": "Цаг (ISO, багана)",
                "ip": "IP (сервер)",
                "user_agent": "User-Agent (сервер)",
            }.get(c, c),
            "notes_mn": "Зарим event-д payload JSON-д `visitor_id`/`url` гэх мэт давхар илэрч болно; үнэн эх үүсвэр нь энд.",
        }
        for c in sorted(CORE_DB_KEYS)
    ]
    return {
        "version": 1,
        "sectors": SECTORS,
        "core_columns": core,
        "fields": fields,
        "tier_sets": {
            "t3_count": len(ALLOWED_T3),
            "t2_extra_count": len(T2_EXTRA),
            "t1_extra_count": len(T1_EXTRA),
            "t1_total_payload_keys": len(ALLOWED_T1),
        },
    }


def _self_check() -> None:
    if set(_FIELD_ROWS.keys()) != ALLOWED_T1:
        missing = ALLOWED_T1 - set(_FIELD_ROWS.keys())
        extra = set(_FIELD_ROWS.keys()) - ALLOWED_T1
        raise AssertionError(f"catalog keys != ALLOWED_T1 missing={missing!r} extra={extra!r}")


_self_check()


if __name__ == "__main__":
    import json

    print(json.dumps(build_field_catalog()["tier_sets"], indent=2))
    print("field_catalog self-check ok")
