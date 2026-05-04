from __future__ import annotations


def commitment_depth(af: dict) -> float:
    score = 0
    if af.get("selected_size"):
        score += 1
    if (af.get("selected_quantity", 0) or 0) > 0:
        score += 1
    score += min(int(af.get("form_fields_touched", 0) or 0), 3)
    score += int(af.get("checkout_step", 0) or 0)
    return min(score / 8.0, 1.0)
