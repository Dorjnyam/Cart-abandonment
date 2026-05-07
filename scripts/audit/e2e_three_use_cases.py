from __future__ import annotations

import json
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


def wait_for_services(timeout_s: int = 120) -> dict[str, Any]:
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
        "referrer": extras.pop("referrer", "https://instagram.com/audit-campaign"),
        "device_type": extras.pop("device_type", "mobile"),
        "language": "mn",
        "timezone": "Asia/Irkutsk",
        "product_id": "audit-sneaker-001",
        "product_name": "Audit Runner",
        "category": "sneakers",
        "price": extras.pop("price", 249000),
        "quantity": extras.pop("quantity", 1),
        "cart_item_count": extras.pop("cart_item_count", 1),
        "cart_total": extras.pop("cart_total", 249000),
        "page_load_ms": extras.pop("page_load_ms", 2200),
        "time_on_page_sec": extras.pop("time_on_page_sec", 45 + index * 10),
        "max_scroll_pct": 72,
        "click_count": extras.pop("click_count", 4 + index),
        "active_time_ms": 30000 + index * 1000,
        "is_logged_in": extras.pop("is_logged_in", False),
        **extras,
    }
    return payload


def use_cases() -> dict[str, list[dict[str, Any]]]:
    cases: dict[str, list[tuple[str, dict[str, Any]]]] = {
        "audit_uc1_abandoned_technical": [
            ("page_view", {"device_type": "mobile", "page_view_count": 1}),
            ("product_view", {"device_type": "mobile", "page_view_count": 2}),
            ("add_to_cart", {"action_detected": "cart_add"}),
            ("cart_view", {"cart_churn_count": 1}),
            ("checkout_start", {"checkout_step": 2, "checkout_step_detected": 2, "form_fields_count": 8, "form_fields_touched": 2}),
            ("checkout_error", {"checkout_step": 3, "checkout_step_detected": 3, "error_type": "payment_failed", "payment_method": "card", "rage_click": 4, "js_error": 2, "page_load_ms": 7600}),
            ("checkout_error", {"checkout_step": 3, "checkout_step_detected": 3, "error_type": "validation_error", "rage_click": 5, "js_error": 1, "back_navigation": 2, "scroll_up_count": 8}),
            ("abandon_checkout", {"end_reason": "unload", "cart_churn_count": 3, "tab_hidden_count": 3}),
        ],
        "audit_uc2_converted_purchase": [
            ("page_view", {"device_type": "desktop", "referrer": "http://localhost:3000", "page_view_count": 1}),
            ("product_view", {"device_type": "desktop", "referrer": "http://localhost:3000", "page_view_count": 2}),
            ("add_to_cart", {"device_type": "desktop", "referrer": "http://localhost:3000", "action_detected": "cart_add"}),
            ("cart_view", {"device_type": "desktop", "referrer": "http://localhost:3000"}),
            ("checkout_start", {"device_type": "desktop", "referrer": "http://localhost:3000", "checkout_step": 2, "checkout_step_detected": 2, "form_fields_count": 6, "form_fields_touched": 6}),
            ("purchase_success", {"device_type": "desktop", "referrer": "http://localhost:3000", "is_order_success": True, "order_id": "audit-order-uc2", "payment_method": "qpay", "cart_total": 249000, "end_reason": "purchase"}),
        ],
        "audit_uc3_price_sensitive_abandonment": [
            ("page_view", {"device_type": "desktop", "cart_total": 820000}),
            ("product_view", {"device_type": "desktop", "cart_total": 820000, "price": 410000}),
            ("add_to_cart", {"device_type": "desktop", "cart_total": 820000}),
            ("cart_view", {"device_type": "desktop", "cart_total": 820000, "shipping_cost": 70000, "discount": 0, "copy_count": 1, "tab_hidden_ms": 9000}),
            ("checkout_start", {"device_type": "desktop", "cart_total": 890000, "shipping_cost": 70000, "checkout_step": 1, "checkout_step_detected": 1, "coupon_entered": True, "discount_code": "FAILED", "discount": 0, "outbound_click": 1}),
            ("cart_view", {"device_type": "desktop", "cart_total": 890000, "shipping_cost": 70000, "cart_churn_count": 2, "copy_count": 1, "tab_hidden_ms": 9000}),
            ("checkout_start", {"device_type": "desktop", "cart_total": 890000, "shipping_cost": 70000, "checkout_step": 1, "checkout_step_detected": 1, "coupon_entered": True, "discount_code": "FAILED", "discount": 0, "outbound_click": 1}),
            ("abandon_checkout", {"device_type": "desktop", "cart_total": 890000, "shipping_cost": 70000, "cart_churn_count": 3, "end_reason": "unload"}),
        ],
    }
    built: dict[str, list[dict[str, Any]]] = {}
    for session_id, seq in cases.items():
        visitor_id = f"visitor_{session_id}"
        built[session_id] = [event(session_id, visitor_id, et, idx, dict(extra)) for idx, (et, extra) in enumerate(seq)]
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


def poll_detail(token: str, canonical_id: str, expect_diagnosis: bool, timeout_s: int = 120) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {token}"}
    deadline = time.time() + timeout_s
    last: dict[str, Any] | None = None
    while time.time() < deadline:
        status, body = request_json(f"{MAIN}/api/dashboard/sessions/{canonical_id}/", headers=headers)
        last = {"status": status, "body": body}
        if status == 200 and isinstance(body, dict) and body.get("prediction"):
            if not expect_diagnosis:
                return last
            if body.get("diagnosis") and body.get("recommendation"):
                return last
        time.sleep(3)
    return last or {"status": "not_polled", "body": None}


def validate_case(name: str, detail: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    status = detail.get("status")
    body = detail.get("body") if isinstance(detail.get("body"), dict) else {}
    pred = body.get("prediction") or {}
    diagnosis = body.get("diagnosis")
    rec = body.get("recommendation")
    events = body.get("events") or []
    event_types = {str(item.get("type") or item.get("event_type") or "").lower() for item in events if isinstance(item, dict)}

    if status != 200:
        failures.append(f"dashboard detail status is {status}")
        return failures
    if not pred:
        failures.append("prediction missing")

    if name == "audit_uc2_converted_purchase":
        if pred.get("business_outcome") != "converted" or pred.get("predicted_class") != "converted":
            failures.append(f"converted session shown incorrectly: {pred}")
        if not pred.get("prediction_overridden"):
            failures.append("converted ML conflict was not marked as overridden")
        if body.get("diagnosis") is not None:
            failures.append("converted session has abandonment diagnosis")
        if body.get("recommendation") is not None:
            failures.append("converted session has abandonment recommendation")
        if body.get("has_purchase_success") is not True:
            failures.append("has_purchase_success is not true")
        if "purchase_success" not in event_types:
            failures.append("timeline does not include purchase_success")
        return failures

    if pred.get("business_outcome") != "abandoned":
        failures.append(f"abandoned session business_outcome is {pred.get('business_outcome')}")
    if body.get("session_state") != "ABANDONED":
        failures.append(f"abandoned session_state is {body.get('session_state')}")
    if not diagnosis:
        failures.append("diagnosis missing")
    if not rec:
        failures.append("recommendation missing")
    if name == "audit_uc1_abandoned_technical" and diagnosis:
        if diagnosis.get("dominant_reason") not in {"S2", "S4"}:
            failures.append(f"UC1 dominant reason expected S2/S4, got {diagnosis.get('dominant_reason')}")
    if name == "audit_uc3_price_sensitive_abandonment" and diagnosis:
        scores = diagnosis.get("scores") or {}
        if diagnosis.get("dominant_reason") != "S5" and float(scores.get("S5") or 0) < 0.5:
            failures.append(f"UC3 expected S5 dominant/high, got {diagnosis}")
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


def main() -> None:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    results: dict[str, Any] = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "health": wait_for_services(),
        "use_cases": {},
        "recommendation_status_update": None,
    }
    token = login()

    any_failures = False
    for session_id, events in use_cases().items():
        expect_diagnosis = session_id != "audit_uc2_converted_purchase"
        sent = send_case(session_id, events)
        detail = poll_detail(token, sent["canonical_session_id"], expect_diagnosis)
        failures = validate_case(session_id, detail)
        any_failures = any_failures or bool(failures)
        results["use_cases"][session_id] = {
            "send": sent,
            "dashboard_detail": detail,
            "failures": failures,
            "result": "PASS" if not failures else "FAIL",
        }
        file_name = {
            "audit_uc1_abandoned_technical": "uc1_abandoned_dashboard_api.json",
            "audit_uc2_converted_purchase": "uc2_converted_dashboard_api.json",
            "audit_uc3_price_sensitive_abandonment": "uc3_price_sensitive_dashboard_api.json",
        }[session_id]
        (EVIDENCE / file_name).write_text(
            json.dumps(detail, indent=2, ensure_ascii=False, default=str),
            encoding="utf-8",
        )

    for case in ("audit_uc1_abandoned_technical", "audit_uc3_price_sensitive_abandonment"):
        rec = ((results["use_cases"][case]["dashboard_detail"].get("body") or {}).get("recommendation") or {})
        rec_id = rec.get("id")
        if rec_id:
            transitions = update_recommendation_status(token, int(rec_id))
            persisted = all(item["status"] == 200 and item["body"].get("status") == item["requested"] for item in transitions)
            results["recommendation_status_update"] = {
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
    results["dashboard_sessions"] = request_json(f"{MAIN}/api/dashboard/sessions/?page_size=50", headers=headers)
    results["observer_stats"] = request_json(f"{OBSERVER}/stats")
    results["ml_status"] = request_json(f"{ML}/internal/status")
    results["final_result"] = "PASS" if not any_failures else "FAIL"

    result_json = EVIDENCE / "e2e_three_use_cases_result.json"
    result_json.write_text(json.dumps(results, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    legacy_json = EVIDENCE / "e2e_three_use_cases_output.json"
    legacy_json.write_text(json.dumps(results, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    text = json.dumps(results, indent=2, ensure_ascii=False, default=str)
    (EVIDENCE / "e2e_three_use_cases_output.txt").write_text(text, encoding="utf-8")
    print(text)
    if any_failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
