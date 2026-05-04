from __future__ import annotations

import logging

from django.conf import settings

logger = logging.getLogger(__name__)

STATIC_FALLBACK = (
    "Хэрэглэгч сагсаа орхисон байна. "
    "Хөнгөлөлт санал болгох эсвэл сануулга илгээхийг зөвлөж байна."
)


def generate_recommendation(scores: dict, session_context: dict) -> str:
    """
    Generate a Mongolian recommendation via Gemini.
    Falls back to STATIC_FALLBACK if the API key is absent or the call fails.
    """
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if not api_key:
        logger.warning("GEMINI_API_KEY not configured — using static fallback")
        return STATIC_FALLBACK

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        prompt = f"""
Та e-commerce картийн орхилтын аналитик системийн зөвлөхийн үүрэгтэй.
Доорх оноонуудад үндэслэн богино Монгол зөвлөмж өг (2-3 өгүүлбэр).
Оноонууд (0-1):
- S1 Картын орхилтын эрсдэл: {scores.get('s1', 0):.2f}
- S2 Оролцооны гүн: {scores.get('s2', 0):.2f}
- S3 Навигацийн саатал: {scores.get('s3', 0):.2f}
- S4 Худалдан авах хүсэл: {scores.get('s4', 0):.2f}
- S5 Session чанар: {scores.get('s5', 0):.2f}
- S6 Хэрэглэгчийн итгэл: {scores.get('s6', 0):.2f}
- S7 Конверсийн хурд: {scores.get('s7', 0):.2f}
Зөвхөн Монгол хэлээр хариул. Тодорхой, практик зөвлөмж өг.
""".strip()

        resp = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
        text = getattr(resp, "text", None) or str(resp)
        return text.strip() if text.strip() else STATIC_FALLBACK
    except Exception as exc:
        logger.error("Gemini API error: %s", exc)
        return STATIC_FALLBACK
