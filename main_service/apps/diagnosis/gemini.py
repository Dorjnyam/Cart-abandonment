from __future__ import annotations

from django.conf import settings


def generate_recommendation_mn(*, diagnosis, features: dict, scores: dict, tenant) -> str:
    """Generate a recommendation. Falls back locally when Gemini is not configured."""

    dominant_key = scores.get("dominant_key") or ""
    fallback = (
        f"Dominant reason: {dominant_key.upper()}. "
        "Simplify the affected checkout step, reduce visible friction, and monitor conversion rate "
        "and abandonment rate after the change."
    )

    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if not api_key:
        return fallback

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        prompt = (
            f"Store: {tenant.name}. Scores: {scores}. Features: {features}. "
            "Write 3 concise ecommerce cart-abandonment recommendations in English."
        )
        resp = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
        text = getattr(resp, "text", None) or str(resp)
        return text.strip() if text.strip() else fallback
    except Exception:
        return fallback
