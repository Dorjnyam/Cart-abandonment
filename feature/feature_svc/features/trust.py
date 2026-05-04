from __future__ import annotations

from config import TRUSTED_PAYMENT_METHODS


def mongolian_trust_barrier(af: dict) -> float:
    payment_method = str(af.get("payment_method", "") or "").lower()
    payment_untrusted = payment_method not in TRUSTED_PAYMENT_METHODS
    return float(
        payment_untrusted
        and not bool(af.get("is_logged_in", True))
        and int(af.get("cart_abandoned_count", 0) or 0) > 0
    )
