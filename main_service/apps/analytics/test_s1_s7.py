from apps.analytics.s1_s7 import calculate_s1_s7


def test_scores_are_normalized_and_missing_features_do_not_crash():
    result = calculate_s1_s7({})
    for key in ["S1", "S2", "S3", "S4", "S5", "S6", "S7"]:
        assert 0.0 <= result[key] <= 1.0
    assert result["dominant_reason"] in {"S1", "S2", "S3", "S4", "S5", "S6", "S7"}


def test_each_score_can_become_dominant():
    scenarios = {
        "S1": {"tab_hidden_count": 6, "copy_count": 4, "cart_abandonment_signal": True, "time_on_page_sec": 240},
        "S2": {"rage_click": 8, "js_error": 4, "page_load_ms": 8000},
        "S3": {"mongolian_trust_barrier": 1, "is_logged_in": False, "payment_method": "cash", "product_availability": "unknown"},
        "S4": {"is_mobile": True, "page_load_ms": 7000, "rage_click": 6, "scroll_up_count": 10},
        "S5": {"price_hesitation_score": 1, "coupon_entered": True, "cart_value": 700000, "avg_price_in_session": 300000},
        "S6": {"cart_churn_count": 7, "back_navigation": 8, "dist_product_count": 12, "search_query": "nike", "filter_name": "size"},
        "S7": {"outbound_click": 5, "referrer": "https://instagram.com/ad", "end_reason": "external", "tab_hidden_count": 3},
    }
    for expected, features in scenarios.items():
        assert calculate_s1_s7(features)["dominant_reason"] == expected


def test_known_synthetic_session_has_price_sensitivity_dominant():
    result = calculate_s1_s7({
        "price_hesitation_score": 0.95,
        "coupon_entered": True,
        "cart_value": 650000,
        "avg_price_in_session": 320000,
        "rage_click": 0,
        "js_error": 0,
    })
    assert result["dominant_reason"] == "S5"
