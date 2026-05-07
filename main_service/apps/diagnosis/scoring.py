from __future__ import annotations

from apps.analytics.s1_s7 import calculate_s1_s7


def score_s1_s7(features: dict, session_id: str | None = None) -> dict:
    """Compatibility wrapper for the canonical thesis S1-S7 scorer."""

    canonical = calculate_s1_s7(features)
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
        "reason_label": canonical["reason_label"],
        "explanation": canonical["explanation"],
        "vg_entropy": None,
        "vg_motifs": None,
    }
