from __future__ import annotations

from apps.analytics.s1_s7 import calculate_s1_s7


def _merge_events(events: list[dict]) -> dict:
    merged: dict = {}
    event_counts: dict[str, int] = {}
    for event in events:
        payload = event.get("payload") if isinstance(event.get("payload"), dict) else {}
        merged.update(payload)
        merged.update(event)
        event_type = str(event.get("event_type") or payload.get("event_type") or "")
        if event_type:
            event_counts[event_type] = event_counts.get(event_type, 0) + 1

    merged.setdefault("page_view_count", event_counts.get("page_view", 0))
    merged.setdefault("cart_churn_count", event_counts.get("cart_remove", 0) + event_counts.get("cart_update_qty", 0))
    merged.setdefault("checkout_step_detected", 1 if any(k.startswith("checkout") for k in event_counts) else 0)
    merged.setdefault(
        "cart_abandonment_signal",
        bool(event_counts.get("add_to_cart") or event_counts.get("cart_view"))
        and not bool(event_counts.get("purchase_success") or event_counts.get("order_success")),
    )
    return merged


def compute_all_scores(events: list[dict]) -> dict[str, float]:
    """Compatibility wrapper around the canonical thesis S1-S7 scorer."""

    canonical = calculate_s1_s7(_merge_events(events))
    return {
        "s1": canonical["S1"],
        "s2": canonical["S2"],
        "s3": canonical["S3"],
        "s4": canonical["S4"],
        "s5": canonical["S5"],
        "s6": canonical["S6"],
        "s7": canonical["S7"],
        "dominant_score": canonical["dominant_score"],
        "dominant_key": canonical["dominant_reason"].lower(),
    }
