from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone

import requests


OBSERVER_KEY = "tk_full_demo_mvp"
TENANT_ID = "00000000-0000-0000-0000-000000000001"


def build_events(session_id: str, converted: bool) -> list[dict]:
    visitor_id = f"visitor-{session_id}"
    base = {
        "api_key": OBSERVER_KEY,
        "visitor_id": visitor_id,
        "session_id": session_id,
        "tenant_id": TENANT_ID,
        "url": "http://localhost:3000/thesis-demo",
        "path": "/thesis-demo",
        "referrer": "https://instagram.com/thesis-demo",
        "device_type": "mobile",
        "cart_value": 249000,
        "cart_item_count": 1,
        "page_load_ms": 3100,
        "is_mobile": True,
    }
    sequence = [
        ("page_view", {"page_view_count": 1}),
        ("product_view", {"product_id": "demo-sneaker-001", "product_price": 249000}),
        ("add_to_cart", {"selected_quantity": 1}),
        ("cart_view", {}),
        ("checkout_start", {"checkout_step": 1, "checkout_step_detected": 1}),
    ]
    if converted:
        sequence.append(("purchase_success", {"is_order_success": True, "order_total": 249000, "end_reason": "purchase"}))
    else:
        sequence.extend([
            ("checkout_error", {"js_error": 1, "rage_click": 2, "price_hesitation_score": 0.72}),
            ("abandon_checkout", {"cart_churn_count": 3, "tab_hidden_count": 3, "end_reason": "unload"}),
            ("beforeunload", {"is_order_success": False, "end_reason": "unload"}),
        ])

    events = []
    for index, (event_type, extra) in enumerate(sequence):
        events.append({
            **base,
            **extra,
            "event_id": f"{session_id}-{index}-{event_type}",
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    return events


def send_events(observer_url: str, events: list[dict]) -> tuple[bool, str]:
    for event in events:
        response = requests.post(
            f"{observer_url.rstrip('/')}/track",
            json=event,
            headers={"X-API-Key": OBSERVER_KEY},
            timeout=10,
        )
        if response.status_code >= 400:
            return False, f"{event['event_type']} HTTP {response.status_code}: {response.text[:200]}"
    return True, f"sent {len(events)} events"


def dashboard_token(main_url: str, email: str, password: str) -> str:
    response = requests.post(
        f"{main_url.rstrip('/')}/api/auth/login/",
        json={"email": email, "password": password},
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()
    return data["access"]


def wait_for_diagnosis(main_url: str, token: str, session_id: str, timeout_sec: int) -> tuple[bool, str]:
    headers = {"Authorization": f"Bearer {token}"}
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        response = requests.get(
            f"{main_url.rstrip('/')}/api/diagnosis/?search={session_id}",
            headers=headers,
            timeout=10,
        )
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            if results:
                return True, json.dumps(results[0], default=str)
        time.sleep(3)
    return False, "diagnosis not found before timeout"


def row(step: str, expected: str, actual: str, passed: bool) -> str:
    return f"| {step} | {expected} | {actual} | {'PASS' if passed else 'FAIL'} |"


def main() -> None:
    parser = argparse.ArgumentParser(description="Run thesis MVP end-to-end smoke test.")
    parser.add_argument("--base-url", default="http://localhost:8001")
    parser.add_argument("--main-url", default="http://localhost:8000")
    parser.add_argument("--email", default="demo@example.com")
    parser.add_argument("--password", default="change-me-demo-password")
    parser.add_argument("--timeout", type=int, default=90)
    args = parser.parse_args()

    print("| Step | Expected | Actual | Pass/Fail |")
    print("|------|----------|--------|-----------|")

    token = dashboard_token(args.main_url, args.email, args.password)
    print(row("Dashboard login", "JWT access token", "token received", True))

    for kind, converted in [("abandoned", False), ("converted", True)]:
        session_id = f"e2e-{kind}-{int(time.time())}"
        ok, detail = send_events(args.base_url, build_events(session_id, converted))
        print(row(f"{kind} event send", "Observer accepts events", detail, ok))
        if not ok:
            continue
        found, evidence = wait_for_diagnosis(args.main_url, token, session_id, args.timeout)
        print(row(f"{kind} dashboard diagnosis", "Main/dashboard API returns diagnosis", evidence[:240], found))


if __name__ == "__main__":
    main()
