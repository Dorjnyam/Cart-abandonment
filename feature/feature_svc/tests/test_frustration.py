from features.frustration import frustration_index


def test_normal() -> None:
    af = {"rage_click": 2, "back_navigation": 1, "js_error": 0, "cart_churn_count": 1}
    result = frustration_index(af)
    assert 0.0 <= result <= 1.0


def test_zero_inputs() -> None:
    assert frustration_index({}) == 0.0


def test_capped_at_one() -> None:
    af = {"rage_click": 100, "back_navigation": 100, "js_error": 100}
    assert frustration_index(af) == 1.0
