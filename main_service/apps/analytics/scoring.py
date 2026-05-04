from __future__ import annotations


def _g(events: list[dict], key: str, default=0):
    """Return max value of `key` across all events, or default if absent."""
    vals = [e.get(key) for e in events if e.get(key) is not None]
    return max(vals, default=default) if vals else default


def _sum(events: list[dict], key: str) -> float:
    return sum(float(e.get(key) or 0) for e in events)


def _any(events: list[dict], key: str) -> bool:
    return any(e.get(key) for e in events)


def score_s1(events: list[dict], session_payload: dict) -> float:
    """Cart abandonment risk: cart activity present but no conversion."""
    has_cart = any(e.get("cart_value") or e.get("cart_item_count") for e in events)
    converted = bool(session_payload.get("is_order_success"))
    if not has_cart:
        return 0.3
    if converted:
        return 0.1
    rage = _sum(events, "rage_click")
    return round(min(0.95, 0.6 + rage * 0.05), 3)


def score_s2(events: list[dict], session_payload: dict) -> float:
    """Engagement depth: scroll, active time, page views."""
    scroll = float(_g(events, "max_scroll_pct", 0))
    active_ms = float(_g(events, "active_time_ms", 0))
    page_views = max(float(_g(events, "page_view_count", 1)), 1)
    score = (
        (scroll / 100) * 0.4
        + (min(active_ms, 300_000) / 300_000) * 0.4
        + (min(page_views, 10) / 10) * 0.2
    )
    return round(min(1.0, score), 3)


def score_s3(events: list[dict], session_payload: dict) -> float:
    """Navigation friction: rage clicks, JS errors, back navigation."""
    rage = min(_sum(events, "rage_click"), 20)
    js_err = min(_sum(events, "js_error_count") + len([e for e in events if e.get("event_type") == "js_error"]), 10)
    back_nav = len([e for e in events if e.get("event_type") == "back_navigation"])
    score = (
        (rage / 20) * 0.45
        + (js_err / 10) * 0.35
        + min(back_nav, 5) / 5 * 0.20
    )
    return round(min(1.0, score), 3)


def score_s4(events: list[dict], session_payload: dict) -> float:
    """Purchase intent: checkout steps reached, product views."""
    checkout_step = float(_g(events, "checkout_step", 0))
    checkout_events = len([e for e in events if (e.get("event_type") or "").startswith("checkout")])
    product_views = len([e for e in events if e.get("event_type") in ("product_view", "page_view")])
    score = (
        min(checkout_step, 5) / 5 * 0.50
        + min(checkout_events, 5) / 5 * 0.30
        + min(product_views, 10) / 10 * 0.20
    )
    return round(min(1.0, score), 3)


def score_s5(events: list[dict], session_payload: dict) -> float:
    """Session quality: duration, time-on-page, click count."""
    duration_ms = float(session_payload.get("session_duration_ms") or _g(events, "session_duration_ms", 0))
    time_on_page = float(_g(events, "time_on_page_ms", 0))
    clicks = _sum(events, "click_count") + len([e for e in events if e.get("event_type") == "click"])
    score = (
        min(duration_ms, 600_000) / 600_000 * 0.40
        + min(time_on_page, 300_000) / 300_000 * 0.35
        + min(clicks, 50) / 50 * 0.25
    )
    return round(min(1.0, score), 3)


def score_s6(events: list[dict], session_payload: dict) -> float:
    """User trust signal: logged in, visit count, customer type."""
    is_logged_in = float(bool(session_payload.get("is_logged_in") or _any(events, "is_logged_in")))
    visit_count = float(session_payload.get("visit_count") or _g(events, "visit_count", 0))
    is_returning = float(
        session_payload.get("customer_type") in ("returning", "loyal")
        or visit_count > 1
    )
    score = is_logged_in * 0.50 + min(visit_count, 10) / 10 * 0.30 + is_returning * 0.20
    return round(min(1.0, score), 3)


def score_s7(events: list[dict], session_payload: dict) -> float:
    """Conversion momentum: page-type sequence, order success signal."""
    page_types = [e.get("detected_page_type") or e.get("page_type") for e in events if e.get("detected_page_type") or e.get("page_type")]
    funnel_pages = {"product", "cart", "checkout", "payment", "confirmation"}
    funnel_hit = len(set(pt for pt in page_types if pt in funnel_pages))
    is_order_success = float(bool(
        session_payload.get("is_order_success")
        or any(e.get("event_type") == "order_success" for e in events)
        or "confirmation" in page_types
    ))
    score = min(funnel_hit, 5) / 5 * 0.60 + is_order_success * 0.40
    return round(min(1.0, score), 3)


def compute_all_scores(events: list[dict]) -> dict[str, float]:
    """
    Compute S1-S7 from a flat list of raw event dicts (payload fields merged in).
    Returns dict with keys s1..s7 and dominant_score/dominant_key.
    """
    merged: dict = {}
    for e in events:
        merged.update(e)

    scores = {
        "s1": score_s1(events, merged),
        "s2": score_s2(events, merged),
        "s3": score_s3(events, merged),
        "s4": score_s4(events, merged),
        "s5": score_s5(events, merged),
        "s6": score_s6(events, merged),
        "s7": score_s7(events, merged),
    }
    dominant_key = max(scores, key=lambda k: scores[k])
    return {**scores, "dominant_score": scores[dominant_key], "dominant_key": dominant_key}
