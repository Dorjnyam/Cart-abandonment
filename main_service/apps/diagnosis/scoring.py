from decimal import Decimal
import logging
import requests
from typing import Dict, Optional

logger = logging.getLogger(__name__)


def _clamp01(x: float) -> float:
    if x < 0.0:
        return 0.0
    if x > 1.0:
        return 1.0
    return x


def _compute_s6_with_vg_service(
    features: dict,
    session_id: str,
    vg_service_url: str = "http://localhost:8005"
) -> tuple:
    """
    Attempt to compute S6 score using Visibility Graph Service.
    
    Returns: (s6_score, entropy, motifs) or falls back to simple formula if service unavailable.
    """
    mouse_series = features.get('mouse_speed_series', [])
    
    # If insufficient mouse data, use fallback
    if not mouse_series or len(mouse_series) < 5:
        logger.debug(f"Session {session_id}: insufficient mouse data ({len(mouse_series)} events), using fallback S6")
        s6_fallback = _compute_s6_fallback(features)
        return s6_fallback, None, None
    
    try:
        # Call VG Service endpoint
        payload = {
            "session_id": session_id,
            "events": mouse_series,
        }
        response = requests.post(
            f"{vg_service_url}/compute-entropy",
            json=payload,
            timeout=2.0
        )
        
        if response.status_code == 200:
            data = response.json()
            entropy = data.get('entropy', 0.0)
            motifs = data.get('motifs', {})
            
            # S6 = entropy (0-1), higher entropy = more confused behavior pattern
            s6_score = float(entropy)
            logger.info(f"Session {session_id}: VG entropy={entropy:.4f}, motifs={motifs}")
            return s6_score, entropy, motifs
        else:
            logger.warning(f"VG Service returned {response.status_code}, using fallback S6")
            s6_fallback = _compute_s6_fallback(features)
            return s6_fallback, None, None
    
    except requests.exceptions.ConnectionError:
        logger.warning(f"VG Service unavailable (connection error), using fallback S6 for session {session_id}")
        s6_fallback = _compute_s6_fallback(features)
        return s6_fallback, None, None
    
    except requests.exceptions.Timeout:
        logger.warning(f"VG Service timeout, using fallback S6 for session {session_id}")
        s6_fallback = _compute_s6_fallback(features)
        return s6_fallback, None, None
    
    except Exception as e:
        logger.exception(f"Error calling VG Service for session {session_id}: {e}")
        s6_fallback = _compute_s6_fallback(features)
        return s6_fallback, None, None


def _compute_s6_fallback(features: dict) -> float:
    """
    Fallback S6 calculation: engagement duration (short time indicates confusion)
    S6 = 0.55 × (1.0 - time_in_minutes/10) + 0.45 × (1.0 - page_views/40)
    """
    time_on_page_ms = float(features.get('time_on_page_ms_total', 0.0))
    time_on_page_min = time_on_page_ms / 60000.0
    page_views = float(features.get('page_view_count', 0))
    
    s6 = _clamp01(
        0.55 * _clamp01(1.0 - time_on_page_min / 10.0)
        + 0.45 * _clamp01(1.0 - page_views / 40.0)
    )
    return s6


def score_s1_s7(features: dict, session_id: str = None) -> dict:
    """
    WF-06: heuristic skeleton scoring (S1..S7) -> dominant score.
    Values are normalized to [0..1] where higher means stronger suspected cause.
    
    S6 uses Visibility Graph Service if available, otherwise falls back to simple formula.
    """
    max_scroll = float(features.get('max_scroll_pct', 0.0)) / 100.0
    tab_hidden = float(features.get('tab_hidden_count', 0))
    copy_count = float(features.get('copy_count', 0))
    cart_ratio = float(features.get('cart_ratio', 0.0))
    cart_add = float(features.get('cart_add_count', 0))
    cart_remove = float(features.get('cart_remove_count', 0))

    page_views = float(features.get('page_view_count', 0))
    rage_click = float(features.get('rage_click_count', 0))
    js_error = float(features.get('js_error_count', 0))
    checkout_step = float(features.get('checkout_step_max', 0))
    payment_bounce = float(features.get('payment_bounce', 0))
    device_is_mobile = float(features.get('device_is_mobile', 0))

    filter_change = float(features.get('filter_change_count', 0))
    outbound = float(features.get('outbound_count', 0))

    referrer_source = features.get('referrer_source') or ''
    ref = str(referrer_source).lower()
    social_ref = any(k in ref for k in ['facebook', 'instagram', 'tiktok', 'twitter'])

    # S1: cart intent + engagement signals
    s1 = _clamp01(0.55 * cart_ratio + 0.25 * max_scroll + 0.20 * _clamp01(copy_count / 10.0))

    # S2: technical friction (rage clicks, JS errors, checkout progress)
    s2 = _clamp01(
        0.45 * _clamp01(rage_click / 10.0)
        + 0.35 * _clamp01(js_error / 5.0)
        + 0.20 * _clamp01(checkout_step / 5.0)
    )

    # S3: payment bounce / conversion drop-off
    s3 = _clamp01(payment_bounce * 0.8 + _clamp01(page_views / 20.0) * 0.2)

    # S4: mobile + checkout bounce
    s4 = _clamp01(0.65 * device_is_mobile + 0.35 * payment_bounce)

    # S5: exploration signals (filtering/sorting + drop-offs)
    s5 = _clamp01(0.50 * _clamp01(filter_change / 10.0) + 0.30 * _clamp01(outbound / 10.0) + 0.20 * _clamp01((copy_count + tab_hidden) / 20.0))

    # S6: VG Service entropy (with fallback)
    s6, vg_entropy, vg_motifs = _compute_s6_with_vg_service(features, session_id or "unknown")

    # S7: social referrer + outbound
    s7 = _clamp01(0.60 * (1.0 if social_ref else 0.2) + 0.40 * _clamp01(outbound / 10.0))

    scores = {'s1': s1, 's2': s2, 's3': s3, 's4': s4, 's5': s5, 's6': s6, 's7': s7}
    dominant_key = max(scores.keys(), key=lambda k: scores[k])
    dominant_score = scores[dominant_key]

    # Keep both for gemini prompt, plus VG data
    return {
        **scores,
        'dominant_score': dominant_score,
        'dominant_key': dominant_key,  # e.g. 's2'
        'vg_entropy': vg_entropy,
        'vg_motifs': vg_motifs,
    }

