from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import NAMESPACE_URL, uuid5


ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "docs" / "defense_evidence"
TENANT_ID = "00000000-0000-0000-0000-000000000001"
OBSERVER_KEY = "tk_full_demo_mvp"
OBSERVER = "http://localhost:8001"
SESSION = "http://localhost:8002"
MAIN = "http://localhost:8000"
FEATURE = "http://localhost:8003"
ML = "http://localhost:8004"
RUN_ID = os.getenv("E2E_RUN_ID") or datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


CaseStep = tuple[str, dict[str, Any]]


CASE_SPECS: dict[str, dict[str, Any]] = {
    "uc01_technical_checkout_abandonment": {
        "title_mn": "Техникийн алдаатай checkout орхилт",
        "expected_outcome": "abandoned",
        "expected_dominant": {"S2", "S4"},
        "steps": [
            ("page_view", {"device_type": "mobile", "page_view_count": 1}),
            ("product_view", {"device_type": "mobile", "page_view_count": 2}),
            ("add_to_cart", {"action_detected": "cart_add"}),
            ("cart_view", {"cart_churn_count": 1}),
            ("checkout_start", {"checkout_step": 2, "checkout_step_detected": 2, "form_fields_count": 8, "form_fields_touched": 2}),
            ("checkout_error", {"checkout_step": 3, "checkout_step_detected": 3, "error_type": "payment_failed", "rage_click": 4, "js_error": 2, "page_load_ms": 7600}),
            ("checkout_error", {"checkout_step": 3, "checkout_step_detected": 3, "error_type": "validation_error", "rage_click": 5, "js_error": 1, "back_navigation": 2, "scroll_up_count": 8}),
            ("abandon_checkout", {"end_reason": "technical_exit", "cart_churn_count": 3}),
        ],
    },
    "uc02_clean_converted_purchase": {
        "title_mn": "Цэвэр амжилттай худалдан авалт",
        "expected_outcome": "converted",
        "expected_dominant": set(),
        "require_override": True,
        "steps": [
            ("page_view", {"device_type": "desktop", "is_logged_in": True, "page_view_count": 1}),
            ("product_view", {"device_type": "desktop", "is_logged_in": True, "page_view_count": 2}),
            ("add_to_cart", {"device_type": "desktop", "is_logged_in": True, "action_detected": "cart_add"}),
            ("cart_view", {"device_type": "desktop", "is_logged_in": True}),
            ("checkout_start", {"device_type": "desktop", "is_logged_in": True, "checkout_step": 2, "checkout_step_detected": 2, "form_fields_count": 6, "form_fields_touched": 6}),
            ("purchase_success", {"device_type": "desktop", "is_logged_in": True, "is_order_success": True, "order_id": "audit-order-uc02", "payment_method": "qpay", "end_reason": "purchase"}),
        ],
    },
    "uc03_price_sensitive_abandonment": {
        "title_mn": "Үнэ, хүргэлтийн зардалд мэдрэмтгий орхилт",
        "expected_outcome": "abandoned",
        "expected_dominant": {"S5"},
        "steps": [
            ("page_view", {"device_type": "desktop", "cart_total": 820000, "cart_value": 820000}),
            ("product_view", {"device_type": "desktop", "cart_total": 820000, "cart_value": 820000, "price": 410000, "product_price": 410000}),
            ("add_to_cart", {"device_type": "desktop", "cart_total": 820000, "cart_value": 820000}),
            ("cart_view", {"device_type": "desktop", "cart_total": 820000, "cart_value": 820000, "shipping_cost": 70000, "discount": 0, "copy_count": 1, "tab_hidden_ms": 9000}),
            ("checkout_start", {"device_type": "desktop", "cart_total": 890000, "cart_value": 890000, "shipping_cost": 70000, "checkout_step": 1, "checkout_step_detected": 1, "coupon_entered": True, "discount_code": "FAILED", "discount": 0, "outbound_click": 1}),
            ("cart_view", {"device_type": "desktop", "cart_total": 890000, "cart_value": 890000, "shipping_cost": 70000, "cart_churn_count": 2, "copy_count": 1, "tab_hidden_ms": 9000}),
            ("checkout_start", {"device_type": "desktop", "cart_total": 890000, "cart_value": 890000, "shipping_cost": 70000, "checkout_step": 1, "checkout_step_detected": 1, "coupon_entered": True, "discount_code": "FAILED", "discount": 0, "outbound_click": 1}),
            ("abandon_checkout", {"device_type": "desktop", "cart_total": 890000, "cart_value": 890000, "shipping_cost": 70000, "cart_churn_count": 3, "end_reason": "price_exit"}),
        ],
    },
    "uc04_psychological_hesitation": {
        "title_mn": "Сэтгэлзүйн эргэлзээтэй орхилт",
        "expected_outcome": "abandoned",
        "expected_dominant": {"S1"},
        "steps": [
            ("page_view", {"device_type": "desktop", "bounce": True, "active_time_ms": 90000}),
            ("product_view", {"device_type": "desktop", "copy_count": 1, "active_time_ms": 120000}),
            ("add_to_cart", {"device_type": "desktop", "copy_count": 1, "active_time_ms": 120000}),
            ("cart_view", {"device_type": "desktop", "tab_hidden_count": 2, "copy_count": 1, "active_time_ms": 120000}),
            ("cart_view", {"device_type": "desktop", "tab_hidden_count": 2, "bounce": True, "active_time_ms": 120000}),
            ("abandon_checkout", {"device_type": "desktop", "bounce": True, "end_reason": "idle_hesitation", "active_time_ms": 120000}),
        ],
    },
    "uc05_trust_payment_concern": {
        "title_mn": "Итгэлцэл, төлбөрийн эргэлзээтэй орхилт",
        "expected_outcome": "abandoned",
        "expected_dominant": {"S3"},
        "steps": [
            ("page_view", {"device_type": "desktop", "product_availability": "unknown", "cart_abandoned_count": 2}),
            ("product_view", {"device_type": "desktop", "product_availability": "unknown", "cart_abandoned_count": 2}),
            ("add_to_cart", {"device_type": "desktop", "product_availability": "unknown", "cart_abandoned_count": 2}),
            ("cart_view", {"device_type": "desktop", "product_availability": "unknown", "cart_abandoned_count": 2}),
            ("checkout_start", {"device_type": "desktop", "payment_method": "cash_on_delivery", "product_availability": "unknown", "cart_abandoned_count": 2, "checkout_step": 3, "checkout_step_detected": 3}),
            ("abandon_checkout", {"device_type": "desktop", "payment_method": "cash_on_delivery", "product_availability": "unknown", "cart_abandoned_count": 2, "checkout_step": 3, "checkout_step_detected": 3, "end_reason": "trust_exit"}),
        ],
    },
    "uc06_mobile_usability_friction": {
        "title_mn": "Мобайл хэрэглээний саадтай орхилт",
        "expected_outcome": "abandoned",
        "expected_dominant": {"S4"},
        "steps": [
            ("page_view", {"device_type": "mobile", "page_load_ms": 6500, "bounce": True}),
            ("product_view", {"device_type": "mobile", "page_load_ms": 6500, "scroll_up_count": 3}),
            ("add_to_cart", {"device_type": "mobile", "page_load_ms": 6500, "rage_click": 1}),
            ("checkout_start", {"device_type": "mobile", "page_load_ms": 7000, "rage_click": 1, "scroll_up_count": 3, "form_fields_count": 5, "form_fields_touched": 4}),
            ("checkout_error", {"device_type": "mobile", "page_load_ms": 7000, "rage_click": 2, "scroll_up_count": 2, "error_type": "mobile_layout"}),
            ("abandon_checkout", {"device_type": "mobile", "page_load_ms": 7000, "bounce": True, "end_reason": "mobile_exit"}),
        ],
    },
    "uc07_search_filter_indecision": {
        "title_mn": "Хайлт, шүүлтүүрийн эргэлзээтэй орхилт",
        "expected_outcome": "abandoned",
        "expected_dominant": {"S6"},
        "steps": [
            ("page_view", {"device_type": "desktop", "search_query": "nike"}),
            ("product_view", {"device_type": "desktop", "search_query": "nike", "filter_name": "size_42"}),
            ("product_view", {"device_type": "desktop", "search_query": "nike", "filter_name": "black", "back_navigation": 2}),
            ("add_to_cart", {"device_type": "desktop", "search_query": "nike", "filter_name": "sale"}),
            ("cart_view", {"device_type": "desktop", "cart_churn_count": 2, "back_navigation": 2, "scroll_up_count": 3, "search_query": "nike"}),
            ("product_view", {"device_type": "desktop", "cart_churn_count": 1, "back_navigation": 2, "filter_name": "brand"}),
            ("cart_view", {"device_type": "desktop", "cart_churn_count": 2, "search_query": "nike", "filter_name": "brand"}),
            ("abandon_checkout", {"device_type": "desktop", "end_reason": "indecision_exit"}),
        ],
    },
    "uc08_external_referral_influence": {
        "title_mn": "Гадны эх сурвалжийн нөлөөтэй орхилт",
        "expected_outcome": "abandoned",
        "expected_dominant": {"S7"},
        "steps": [
            ("page_view", {"device_type": "mobile", "referrer": "https://tiktok.com/ad/cart-demo", "outbound_click": 1}),
            ("product_view", {"device_type": "mobile", "referrer": "https://tiktok.com/ad/cart-demo", "outbound_click": 1}),
            ("add_to_cart", {"device_type": "mobile", "referrer": "https://tiktok.com/ad/cart-demo"}),
            ("cart_view", {"device_type": "mobile", "referrer": "https://tiktok.com/ad/cart-demo", "tab_hidden_count": 2, "outbound_click": 1}),
            ("checkout_start", {"device_type": "mobile", "referrer": "https://tiktok.com/ad/cart-demo", "tab_hidden_count": 2}),
            ("abandon_checkout", {"device_type": "mobile", "referrer": "https://tiktok.com/ad/cart-demo", "tab_hidden_count": 1, "end_reason": "external"}),
        ],
    },
    "uc09_cart_edit_churn": {
        "title_mn": "Сагс засварлах давтамж өндөр орхилт",
        "expected_outcome": "abandoned",
        "expected_dominant": {"S6", "S5"},
        "steps": [
            ("page_view", {"device_type": "desktop", "search_query": "running shoes"}),
            ("product_view", {"device_type": "desktop", "filter_name": "size_43"}),
            ("add_to_cart", {"device_type": "desktop", "cart_item_count": 1, "cart_churn_count": 1}),
            ("cart_view", {"device_type": "desktop", "cart_churn_count": 1, "back_navigation": 1}),
            ("remove_from_cart", {"device_type": "desktop", "cart_item_count": 0, "cart_churn_count": 1, "back_navigation": 1}),
            ("product_view", {"device_type": "desktop", "filter_name": "color_black", "back_navigation": 1}),
            ("add_to_cart", {"device_type": "desktop", "cart_item_count": 2, "cart_churn_count": 1}),
            ("cart_view", {"device_type": "desktop", "cart_churn_count": 1, "scroll_up_count": 4, "search_query": "running shoes"}),
            ("checkout_start", {"device_type": "desktop", "checkout_step": 1, "checkout_step_detected": 1}),
            ("abandon_checkout", {"device_type": "desktop", "cart_churn_count": 1, "end_reason": "cart_churn_exit"}),
        ],
    },
    "uc10_coupon_recovered_purchase": {
        "title_mn": "Купоны дараа сэргэсэн худалдан авалт",
        "expected_outcome": "converted",
        "expected_dominant": set(),
        "require_override": True,
        "steps": [
            ("page_view", {"device_type": "desktop", "cart_total": 780000, "cart_value": 780000}),
            ("product_view", {"device_type": "desktop", "cart_total": 780000, "cart_value": 780000, "price": 390000, "product_price": 390000}),
            ("add_to_cart", {"device_type": "desktop", "cart_total": 780000, "cart_value": 780000}),
            ("cart_view", {"device_type": "desktop", "cart_total": 780000, "cart_value": 780000, "shipping_cost": 65000, "copy_count": 1, "tab_hidden_ms": 9000}),
            ("checkout_start", {"device_type": "desktop", "cart_total": 845000, "cart_value": 845000, "shipping_cost": 65000, "coupon_entered": True, "discount_code": "FAILED", "outbound_click": 1, "checkout_step": 1}),
            ("cart_view", {"device_type": "desktop", "cart_total": 845000, "cart_value": 845000, "shipping_cost": 65000, "cart_churn_count": 2, "copy_count": 1}),
            ("checkout_start", {"device_type": "desktop", "cart_total": 790000, "cart_value": 790000, "shipping_cost": 0, "coupon_entered": True, "discount_code": "RECOVERED", "discount": 55000, "checkout_step": 2, "checkout_step_detected": 2}),
            ("purchase_success", {"device_type": "desktop", "is_order_success": True, "order_id": "audit-order-uc10", "payment_method": "qpay", "cart_total": 790000, "cart_value": 790000, "discount": 55000, "end_reason": "purchase"}),
        ],
    },
}


def request_json(
    url: str,
    method: str = "GET",
    body: Any = None,
    headers: dict[str, str] | None = None,
    timeout: int = 10,
) -> tuple[int, Any]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = raw
        return exc.code, payload
    except Exception as exc:
        return 0, {"error": str(exc)}


def canonical_session_id(session_id: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"observer:session_id:{session_id}"))


def wait_for_services(timeout_s: int = 180) -> dict[str, Any]:
    checks = {
        "main": f"{MAIN}/api/health/",
        "observer": f"{OBSERVER}/health",
        "session": f"{SESSION}/health",
        "feature": f"{FEATURE}/health",
        "ml": f"{ML}/health",
    }
    deadline = time.time() + timeout_s
    last: dict[str, Any] = {}
    while time.time() < deadline:
        ok = True
        for name, url in checks.items():
            status, body = request_json(url)
            last[name] = {"status": status, "body": body}
            if status >= 400 or status == 0:
                ok = False
        main_body = last.get("main", {}).get("body") or {}
        deps = main_body.get("dependencies") if isinstance(main_body, dict) else {}
        if deps and deps.get("prediction_done_consumer") != "ok":
            ok = False
        if ok:
            return last
        time.sleep(2)
    raise RuntimeError(f"services not ready: {json.dumps(last, ensure_ascii=False, default=str)}")


def login() -> str:
    status, payload = request_json(
        f"{MAIN}/api/auth/login/",
        "POST",
        {"email": "demo@example.com", "password": "change-me-demo-password"},
    )
    if status >= 400:
        raise RuntimeError(f"login failed: HTTP {status} {payload}")
    token = payload.get("access")
    if not token:
        raise RuntimeError(f"login did not return access token: {payload}")
    return token


def event(session_id: str, visitor_id: str, event_type: str, index: int, extras: dict[str, Any]) -> dict[str, Any]:
    timestamp = datetime.now(timezone.utc) + timedelta(milliseconds=index * 250)
    payload = {
        "api_key": OBSERVER_KEY,
        "event_id": f"{session_id}-{index:02d}-{event_type}",
        "event_type": event_type,
        "session_id": session_id,
        "visitor_id": visitor_id,
        "tenant_id": TENANT_ID,
        "timestamp": timestamp.isoformat(),
        "url": f"http://localhost:3000/audit/{session_id}",
        "path": f"/audit/{session_id}",
        "page_url": f"http://localhost:3000/audit/{session_id}",
        "referrer": extras.pop("referrer", "http://localhost:3000"),
        "device_type": extras.pop("device_type", "desktop"),
        "language": "mn",
        "timezone": "Asia/Irkutsk",
        "product_id": extras.pop("product_id", "audit-sneaker-001"),
        "product_name": extras.pop("product_name", "Audit Runner"),
        "category": extras.pop("category", "sneakers"),
        "product_category": extras.pop("product_category", "sneakers"),
        "product_availability": extras.pop("product_availability", "in_stock"),
        "price": extras.pop("price", 249000),
        "product_price": extras.pop("product_price", 249000),
        "quantity": extras.pop("quantity", 1),
        "cart_item_count": extras.pop("cart_item_count", 1),
        "cart_total": extras.pop("cart_total", 249000),
        "cart_value": extras.pop("cart_value", 249000),
        "page_load_ms": extras.pop("page_load_ms", 1600),
        "time_on_page_sec": extras.pop("time_on_page_sec", 40 + index * 8),
        "max_scroll_pct": extras.pop("max_scroll_pct", 72),
        "click_count": extras.pop("click_count", 3 + index),
        "active_time_ms": extras.pop("active_time_ms", 35000 + index * 1500),
        "payment_method": extras.pop("payment_method", "qpay"),
        "is_logged_in": extras.pop("is_logged_in", False),
        **extras,
    }
    return payload


def built_use_cases() -> dict[str, dict[str, Any]]:
    built: dict[str, dict[str, Any]] = {}
    for case_key, spec in CASE_SPECS.items():
        session_id = f"audit10_{case_key}_{RUN_ID}"
        visitor_id = f"visitor_{session_id}"
        events = [
            event(session_id, visitor_id, event_type, index, dict(extras))
            for index, (event_type, extras) in enumerate(spec["steps"])
        ]
        built[case_key] = {
            **spec,
            "original_session_id": session_id,
            "canonical_session_id": canonical_session_id(session_id),
            "events": events,
        }
    return built


def send_case(session_id: str, events: list[dict[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {
        "original_session_id": session_id,
        "canonical_session_id": canonical_session_id(session_id),
        "events": [],
    }
    for payload in events:
        status, body = request_json(
            f"{OBSERVER}/track",
            "POST",
            payload,
            headers={"X-API-Key": OBSERVER_KEY},
        )
        result["events"].append({"event_type": payload["event_type"], "status": status, "body": body})
        if status >= 400 or status == 0:
            result["send_failed"] = True
            return result
        time.sleep(0.1)
    status, body = request_json(f"{SESSION}/ingest/flush-session", "POST", {"session_id": session_id})
    result["flush_original"] = {"status": status, "body": body}
    status, body = request_json(f"{SESSION}/ingest/flush-session", "POST", {"session_id": result["canonical_session_id"]})
    result["flush_canonical"] = {"status": status, "body": body}
    return result


def poll_detail(
    token: str,
    canonical_id: str,
    expect_diagnosis: bool,
    expected_event_types: list[str],
    expected_state: str,
    timeout_s: int = 180,
) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {token}"}
    deadline = time.time() + timeout_s
    last: dict[str, Any] | None = None
    while time.time() < deadline:
        status, body = request_json(f"{MAIN}/api/dashboard/sessions/{canonical_id}/", headers=headers)
        last = {"status": status, "body": body}
        if status == 200 and isinstance(body, dict) and body.get("prediction"):
            events = body.get("events") or []
            seen_event_types = [
                str(item.get("type") or item.get("event_type") or "").lower()
                for item in events
                if isinstance(item, dict)
            ]
            timeline_ready = (
                len(events) >= len(expected_event_types)
                and all(event_type in seen_event_types for event_type in expected_event_types)
            )
            state_ready = body.get("session_state") == expected_state
            if not timeline_ready or not state_ready:
                time.sleep(3)
                continue
            if not expect_diagnosis:
                return last
            if body.get("diagnosis") and body.get("recommendation"):
                return last
        time.sleep(3)
    return last or {"status": "not_polled", "body": None}


def validate_case(case_key: str, spec: dict[str, Any], detail: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    body = detail.get("body") if isinstance(detail.get("body"), dict) else {}
    pred = body.get("prediction") or {}
    diagnosis = body.get("diagnosis")
    rec = body.get("recommendation")
    events = body.get("events") or []
    expected_outcome = spec["expected_outcome"]
    expected_event_types = [event["event_type"] for event in spec["events"]]
    seen_event_types = [str(item.get("type") or item.get("event_type") or "").lower() for item in events if isinstance(item, dict)]

    if detail.get("status") != 200:
        failures.append(f"dashboard detail status is {detail.get('status')}")
        return failures
    if not pred:
        failures.append("prediction missing")
    if len(events) < len(expected_event_types):
        failures.append(f"timeline has {len(events)} events, expected at least {len(expected_event_types)}")
    for event_type in expected_event_types:
        if event_type not in seen_event_types:
            failures.append(f"timeline does not include {event_type}")

    if pred.get("business_outcome") != expected_outcome or pred.get("predicted_class") != expected_outcome:
        failures.append(f"expected outcome {expected_outcome}, got prediction contract {pred}")

    if expected_outcome == "converted":
        if spec.get("require_override") and not pred.get("prediction_overridden"):
            failures.append("converted ML conflict was not marked as overridden")
        if body.get("session_state") != "CONVERTED":
            failures.append(f"converted session_state is {body.get('session_state')}")
        if body.get("has_purchase_success") is not True:
            failures.append("has_purchase_success is not true")
        if diagnosis is not None:
            failures.append("converted session has abandonment diagnosis")
        if rec is not None:
            failures.append("converted session has abandonment recommendation")
        return failures

    if body.get("session_state") != "ABANDONED":
        failures.append(f"abandoned session_state is {body.get('session_state')}")
    if not diagnosis:
        failures.append("diagnosis missing")
    if not rec:
        failures.append("recommendation missing")
    if rec and rec.get("status") not in {"new", "in_progress", "done", "dismissed"}:
        failures.append(f"unexpected recommendation status {rec.get('status')}")

    if diagnosis:
        scores = diagnosis.get("scores") or {}
        missing_scores = [f"S{i}" for i in range(1, 8) if f"S{i}" not in scores]
        if missing_scores:
            failures.append(f"missing S1-S7 scores: {missing_scores}")
        for key, value in scores.items():
            try:
                numeric = float(value)
            except (TypeError, ValueError):
                failures.append(f"{key} score is not numeric: {value!r}")
                continue
            if numeric < 0 or numeric > 1:
                failures.append(f"{key} score outside 0..1: {numeric}")
        expected_dominant = spec["expected_dominant"]
        dominant = diagnosis.get("dominant_reason")
        if expected_dominant and dominant not in expected_dominant:
            failures.append(f"expected dominant {sorted(expected_dominant)}, got {dominant} for {case_key}")
    return failures


def update_recommendation_status(token: str, rec_id: int) -> list[dict[str, Any]]:
    headers = {"Authorization": f"Bearer {token}"}
    transitions = []
    for status_value in ["in_progress", "done", "dismissed"]:
        status, body = request_json(
            f"{MAIN}/api/dashboard/recommendations/{rec_id}/status/",
            "PATCH",
            {"status": status_value},
            headers=headers,
        )
        transitions.append({"requested": status_value, "status": status, "body": body})
    return transitions


def case_file_name(case_key: str) -> str:
    return f"ten_{case_key}_dashboard_api.json"


def compact_case_result(case_key: str, result: dict[str, Any]) -> dict[str, Any]:
    body = (result.get("dashboard_detail") or {}).get("body") or {}
    pred = body.get("prediction") or {}
    diagnosis = body.get("diagnosis") or {}
    rec = body.get("recommendation") or {}
    return {
        "case": case_key,
        "title_mn": result.get("title_mn"),
        "result": result.get("result"),
        "session_id": body.get("session_id"),
        "event_count": body.get("event_count"),
        "session_state": body.get("session_state"),
        "business_outcome": pred.get("business_outcome"),
        "ml_predicted_class": pred.get("ml_predicted_class"),
        "predicted_class": pred.get("predicted_class"),
        "prediction_overridden": pred.get("prediction_overridden"),
        "abandonment_probability": pred.get("abandonment_probability"),
        "dominant_reason": diagnosis.get("dominant_reason"),
        "scores": diagnosis.get("scores"),
        "recommendation": rec.get("title"),
        "recommendation_status": rec.get("status"),
        "failures": result.get("failures", []),
    }


def write_mongolian_summary(results: dict[str, Any]) -> None:
    lines = [
        "# 10 use case E2E баталгаажуулалтын товч тайлан",
        "",
        f"- Ажиллуулсан огноо: `{results['started_at']}`",
        f"- Run ID: `{results['run_id']}`",
        f"- Эцсийн үр дүн: `{results['final_result']}`",
        "- Орчин: local Docker, defense/demo readiness. Бодит хэрэглэгчийн production баталгаа биш.",
        "- Dataset: synthetic/simulated thesis MVP dataset. Бодит customer behavior биш.",
        "- Gemini тохируулаагүй үед recommendation нь deterministic fallback logic байна.",
        "- Converted session дээр S1-S7 болон recommendation хоосон байх нь зөв behavior.",
        "",
        "## Use case үр дүн",
        "",
        "| # | Use case | Outcome | Dominant | Recommendation | Result |",
        "|---|---|---|---|---|---|",
    ]
    for index, (case_key, result) in enumerate(results["use_cases"].items(), start=1):
        compact = compact_case_result(case_key, result)
        lines.append(
            "| {index} | {title} | `{outcome}` | `{dominant}` | {rec} | `{status}` |".format(
                index=index,
                title=compact["title_mn"],
                outcome=compact["business_outcome"] or "-",
                dominant=compact["dominant_reason"] or "хоосон",
                rec=compact["recommendation"] or "хоосон",
                status=compact["result"],
            )
        )
    lines.extend([
        "",
        "## Тайлбар",
        "",
        "- `PASS` гэдэг нь Observer event хүлээн авсан, Session aggregate үүссэн, Feature vector ML рүү очсон, ML prediction Main-д хадгалагдсан, Dashboard API гэрээ зөв буцсан гэсэн утгатай.",
        "- Abandoned session бүр дээр `diagnosis.scores.S1..S7` 0..1 хооронд байна, dominant reason нь тухайн use case-ийн хүлээлттэй таарсан байна.",
        "- Converted session дээр Main service business truth-ийг хамгаалж `diagnosis=null`, `recommendation=null` буцаана.",
        "",
    ])
    (EVIDENCE / "e2e_ten_use_cases_summary_mn.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    results: dict[str, Any] = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "run_id": RUN_ID,
        "health": wait_for_services(),
        "use_cases": {},
        "recommendation_status_update": None,
    }
    token = login()
    cases = built_use_cases()
    any_failures = False

    for case_key, spec in cases.items():
        expected_outcome = spec["expected_outcome"]
        expect_diagnosis = expected_outcome == "abandoned"
        sent = send_case(spec["original_session_id"], spec["events"])
        expected_event_types = [item["event_type"] for item in spec["events"]]
        expected_state = "ABANDONED" if expected_outcome == "abandoned" else "CONVERTED"
        detail = poll_detail(
            token,
            spec["canonical_session_id"],
            expect_diagnosis,
            expected_event_types,
            expected_state,
        )
        failures = validate_case(case_key, spec, detail)
        any_failures = any_failures or bool(failures)
        results["use_cases"][case_key] = {
            "title_mn": spec["title_mn"],
            "expected_outcome": expected_outcome,
            "expected_dominant": sorted(spec["expected_dominant"]),
            "send": sent,
            "dashboard_detail": detail,
            "failures": failures,
            "result": "PASS" if not failures else "FAIL",
        }
        (EVIDENCE / case_file_name(case_key)).write_text(
            json.dumps(detail, indent=2, ensure_ascii=False, default=str),
            encoding="utf-8",
        )

    for case_key, result in results["use_cases"].items():
        if result["expected_outcome"] != "abandoned" or result["result"] != "PASS":
            continue
        rec = ((result["dashboard_detail"].get("body") or {}).get("recommendation") or {})
        rec_id = rec.get("id")
        if rec_id:
            transitions = update_recommendation_status(token, int(rec_id))
            persisted = all(item["status"] == 200 and item["body"].get("status") == item["requested"] for item in transitions)
            results["recommendation_status_update"] = {
                "case": case_key,
                "recommendation_id": rec_id,
                "transitions": transitions,
                "persisted": persisted,
            }
            any_failures = any_failures or not persisted
            break
    if results["recommendation_status_update"] is None:
        any_failures = True
        results["recommendation_status_update"] = {"persisted": False, "reason": "no abandoned recommendation id found"}

    headers = {"Authorization": f"Bearer {token}"}
    results["dashboard_overview"] = request_json(f"{MAIN}/api/dashboard/overview/", headers=headers)
    results["dashboard_sessions"] = request_json(f"{MAIN}/api/dashboard/sessions/?page_size=100", headers=headers)
    results["dashboard_recommendations"] = request_json(f"{MAIN}/api/dashboard/recommendations/", headers=headers)
    results["observer_stats"] = request_json(f"{OBSERVER}/stats")
    results["ml_status"] = request_json(f"{ML}/internal/status")
    results["compact_results"] = [
        compact_case_result(case_key, result)
        for case_key, result in results["use_cases"].items()
    ]
    results["final_result"] = "PASS" if not any_failures else "FAIL"

    result_json = EVIDENCE / "e2e_ten_use_cases_result.json"
    result_json.write_text(json.dumps(results, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    text = json.dumps(results, indent=2, ensure_ascii=False, default=str)
    (EVIDENCE / "e2e_ten_use_cases_output.txt").write_text(text, encoding="utf-8")
    write_mongolian_summary(results)
    print(text)
    if any_failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
