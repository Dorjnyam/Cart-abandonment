import json
from typing import Any

from django.db import connections


def _parse_payload(payload: Any) -> dict:
    if payload is None:
        return {}
    if isinstance(payload, dict):
        return payload
    if isinstance(payload, str):
        try:
            parsed = json.loads(payload)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return {}
    return {}


def _safe_float(x: Any, default: float = 0.0) -> float:
    try:
        return float(x)
    except Exception:
        return default


def extract_features_for_session(*, session_id: str, tenant_id: int, tier: str) -> dict:
    """
    WF-05: raw_events -> feature vector (tier-д суурилсан filtering-г дараа тэнд өргөжүүлнэ).
    """
    # Defaults (features used by scoring)
    features = {
        'max_scroll_pct': 0.0,
        'tab_hidden_count': 0,
        'copy_count': 0,
        'cart_add_count': 0,
        'cart_remove_count': 0,
        'checkout_step_max': 0,
        'page_view_count': 0,
        'visit_count': 0,
        'rage_click_count': 0,
        'js_error_count': 0,
        'payment_bounce': 0.0,
        'device_is_mobile': 0.0,
        'filter_change_count': 0,
        'outbound_count': 0,
        'time_on_page_ms_total': 0.0,
        'referrer_source': None,
        'tier': tier,
        'mouse_speed_series': [],  # Time-series data for VG Service
    }

    try:
        with connections['observer'].cursor() as cursor:
            cursor.execute(
                """
                SELECT event_type, payload, created_at
                FROM raw_events
                WHERE session_id = %s
                ORDER BY created_at ASC
                """,
                [session_id],
            )
            rows = cursor.fetchall()
    except Exception:
        return features

    for event_type, payload, _created_at in rows:
        p = _parse_payload(payload)

        if event_type == 'page_view':
            features['page_view_count'] += 1
            features['visit_count'] += 1
            features['max_scroll_pct'] = max(features['max_scroll_pct'], _safe_float(p.get('scroll_pct'), 0.0))
            features['time_on_page_ms_total'] += _safe_float(p.get('time_on_page_ms'), 0.0)

            device_type = p.get('device_type')
            if device_type and str(device_type).lower() == 'mobile':
                features['device_is_mobile'] = 1.0

            if not features['referrer_source'] and p.get('referrer_source'):
                features['referrer_source'] = p.get('referrer_source')

        elif event_type == 'tab_hidden':
            features['tab_hidden_count'] += 1
        elif event_type == 'copy':
            features['copy_count'] += 1
        elif event_type == 'cart_add':
            features['cart_add_count'] += 1
        elif event_type == 'cart_remove':
            features['cart_remove_count'] += 1
        elif event_type == 'checkout_start':
            step = p.get('step')
            if step is not None:
                features['checkout_step_max'] = max(features['checkout_step_max'], int(step))
        elif event_type == 'rage_click':
            features['rage_click_count'] += 1
        elif event_type == 'js_error':
            features['js_error_count'] += 1
        elif event_type in ('payment_bounce', 'checkout_bounce'):
            features['payment_bounce'] = 1.0
        elif event_type == 'filter_change':
            features['filter_change_count'] += 1
        elif event_type == 'outbound':
            features['outbound_count'] += 1
        elif event_type == 'referrer':
            if p.get('referrer_source'):
                features['referrer_source'] = p.get('referrer_source')
        elif event_type == 'mousemove':
            # Extract mouse speed or distance data
            mouse_speed = _safe_float(p.get('mouse_speed'), 0.0)
            if mouse_speed > 0:
                features['mouse_speed_series'].append(mouse_speed)

    denom = features['cart_add_count'] + features['cart_remove_count']
    features['cart_ratio'] = (features['cart_add_count'] / denom) if denom > 0 else 0.0
    return features

