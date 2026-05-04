from features.commitment import commitment_depth


def test_normal() -> None:
    af = {"selected_size": True, "selected_qty": 1, "form_fields_touched": 2, "checkout_step": 1}
    result = commitment_depth(af)
    assert 0.0 <= result <= 1.0


def test_zero_inputs() -> None:
    assert commitment_depth({}) == 0.0


def test_partial_session_case() -> None:
    af = {"selected_size": True, "selected_qty": 0, "form_fields_touched": 1, "checkout_step": 0}
    assert commitment_depth(af) == 0.25
