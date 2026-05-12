from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ReasonInfo:
    label: str
    explanation: str


REASON_INFO: dict[str, ReasonInfo] = {
    "S1": ReasonInfo(
        "Psychological hesitation",
        "The visitor shows hesitation signals such as tab switching, copying, long dwell time, or cart abandonment.",
    ),
    "S2": ReasonInfo(
        "Technical friction",
        "The session contains technical friction such as rage clicks, JavaScript errors, slow page load, or form friction.",
    ),
    "S3": ReasonInfo(
        "Trust issue",
        "The visitor shows trust barriers such as guest checkout, weak payment confidence, or product availability concerns.",
    ),
    "S4": ReasonInfo(
        "Mobile usability issue",
        "The session is mobile-heavy and contains mobile usability friction.",
    ),
    "S5": ReasonInfo(
        "Price sensitivity",
        "The visitor shows price sensitivity through coupon usage, high cart value, or explicit price hesitation.",
    ),
    "S6": ReasonInfo(
        "Indecision/navigation disorder",
        "The visitor loops through products, cart edits, search, filters, or back navigation without committing.",
    ),
    "S7": ReasonInfo(
        "External influence/referral effect",
        "The session is affected by external referrers, social traffic, outbound clicks, or unload behavior.",
    ),
}


def _num(features: dict[str, Any], key: str, default: float = 0.0) -> float:
    value = features.get(key, default)
    if value in (None, ""):
        return default
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _text(features: dict[str, Any], key: str) -> str:
    value = features.get(key, "")
    return "" if value is None else str(value).strip().lower()


def _flag(features: dict[str, Any], key: str) -> float:
    value = features.get(key, False)
    if isinstance(value, str):
        return 1.0 if value.strip().lower() in {"1", "true", "yes", "y"} else 0.0
    return 1.0 if bool(value) else 0.0


def _scale(value: float, high: float) -> float:
    if high <= 0:
        return 0.0
    return max(0.0, min(value / high, 1.0))


def _clamp(value: float) -> float:
    return round(max(0.0, min(value, 1.0)), 4)


def _weighted(parts: list[tuple[float, float]]) -> float:
    return _clamp(sum(weight * _clamp(value) for value, weight in parts))


def calculate_s1_s7(features: dict[str, Any] | None) -> dict[str, Any]:
    """Thesis MVP-ийн canonical S1-S7 cart abandonment шалтгааны оноонуудыг тооцно.

    Бүх оноо 0..1 хооронд normalize хийгдэнэ. Дутуу эсвэл буруу type-тэй feature ирвэл 0 default
    ашиглана. Ингэснээр partial feature payload-оос болж diagnosis pipeline унтрахгүй.
    """

    f = features or {}
    is_mobile = _flag(f, "is_mobile") or (1.0 if _text(f, "device_type") == "mobile" else 0.0)
    referrer = _text(f, "referrer")
    payment_method = _text(f, "payment_method")
    availability = _text(f, "product_availability")

    s1 = _weighted([
        (_scale(_num(f, "tab_hidden_count"), 4), 0.25),
        (_scale(_num(f, "copy_count"), 3), 0.15),
        (_scale(_num(f, "time_on_page_sec"), 180), 0.20),
        (_flag(f, "bounce"), 0.15),
        (_flag(f, "cart_abandonment_signal") or _flag(f, "abandoned"), 0.25),
    ])

    touched = _num(f, "form_fields_touched")
    fields = max(_num(f, "form_fields_count"), 1.0)
    form_friction = _clamp(1.0 - min(touched / fields, 1.0)) if fields > 1 else 0.0
    s2 = _weighted([
        (_scale(_num(f, "rage_click"), 5), 0.30),
        (_scale(_num(f, "js_error"), 3), 0.25),
        (_scale(_num(f, "page_load_ms"), 5000), 0.25),
        (form_friction, 0.10),
        (_scale(_num(f, "back_navigation"), 4), 0.10),
    ])

    payment_trust_gap = 1.0 if payment_method and payment_method not in {"qpay", "socialpay", "card"} else 0.0
    availability_gap = 1.0 if availability in {"out_of_stock", "unknown", "preorder"} else 0.0
    s3 = _weighted([
        (_num(f, "mongolian_trust_barrier"), 0.35),
        (1.0 - _flag(f, "is_logged_in"), 0.20),
        (payment_trust_gap, 0.20),
        (availability_gap, 0.15),
        (_scale(_num(f, "checkout_step_detected") or _num(f, "checkout_step"), 3), 0.10),
    ])

    mobile_friction = _weighted([
        (_scale(_num(f, "page_load_ms"), 4500), 0.30),
        (_scale(_num(f, "rage_click"), 4), 0.25),
        (_scale(_num(f, "scroll_up_count"), 8), 0.20),
        (_scale(_num(f, "tab_hidden_count"), 4), 0.10),
        (_flag(f, "bounce"), 0.15),
    ])
    s4 = _clamp(is_mobile * mobile_friction)

    cart_value = max(_num(f, "cart_value"), _num(f, "order_total"))
    s5 = _weighted([
        (_num(f, "price_hesitation_score"), 0.35),
        (_flag(f, "coupon_entered"), 0.20),
        (1.0 if _text(f, "discount_code") else 0.10 if _flag(f, "is_sale") else 0.0, 0.15),
        (_scale(cart_value, 500000), 0.20),
        (_scale(_num(f, "avg_price_in_session"), 250000), 0.10),
    ])

    s6 = _weighted([
        (_scale(_num(f, "cart_churn_count"), 5), 0.25),
        (_scale(_num(f, "back_navigation"), 6), 0.20),
        (_scale(_num(f, "dist_product_count"), 8), 0.20),
        (1.0 if _text(f, "search_query") or _text(f, "search_query_from_url") else 0.0, 0.15),
        (1.0 if _text(f, "filter_name") else 0.0, 0.10),
        (_scale(_num(f, "scroll_up_count"), 8), 0.10),
    ])

    social_referrer = any(token in referrer for token in ("facebook", "instagram", "tiktok", "youtube", "twitter", "x.com"))
    external_referrer = bool(referrer and "localhost" not in referrer and "demo.local" not in referrer)
    s7 = _weighted([
        (_scale(_num(f, "outbound_click"), 3), 0.30),
        (1.0 if social_referrer else 0.0, 0.25),
        (1.0 if external_referrer else 0.0, 0.20),
        (1.0 if _text(f, "end_reason") in {"unload", "external", "referral"} else 0.0, 0.15),
        (_scale(_num(f, "tab_hidden_count"), 5), 0.10),
    ])

    scores = {
        "S1": s1,
        "S2": s2,
        "S3": s3,
        "S4": s4,
        "S5": s5,
        "S6": s6,
        "S7": s7,
    }
    # Давамгай шалтгаан нь S1-S7 онооны хамгийн их утга.
    # Энэ дүрэм Main API, dashboard docs, thesis тайлбар бүгдэд нэг ижил хэрэглэгдэнэ.
    dominant_reason = max(scores, key=lambda key: scores[key])
    info = REASON_INFO[dominant_reason]
    return {
        **scores,
        "dominant_reason": dominant_reason,
        "dominant_score": scores[dominant_reason],
        "reason_label": info.label,
        "explanation": info.explanation,
    }
