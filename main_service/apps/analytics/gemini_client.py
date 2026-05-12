from __future__ import annotations

import json
import logging
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)

STATIC_FALLBACK = (
    "Энэ сесс дээр сагс орхилтын эрсдэл өндөр байна. S1-S7 үндсэн шалтгааныг хянаж, "
    "хамгийн их саад болж буй хүчин зүйлийг арилгаж, өөрчлөлтийг A/B тестээр баталгаажуулна уу."
)


def generate_recommendation(scores: dict, session_context: dict) -> str:
    """Gemini боломжгүй үед deterministic fallback-тэй богино зөвлөмж үүсгэнэ."""

    dominant = session_context.get("dominant_reason") or scores.get("dominant_key") or "S1"
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if not api_key:
        return f"{STATIC_FALLBACK} Үндсэн шалтгаан: {dominant}."

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        prompt = (
            "You are advising an ecommerce owner. "
            f"Scores: {scores}. Context: {session_context}. "
            "Write 2-3 concise, practical recommendations in Mongolian."
        )
        resp = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
        text = getattr(resp, "text", None) or str(resp)
        return text.strip() if text.strip() else f"{STATIC_FALLBACK} Үндсэн шалтгаан: {dominant}."
    except Exception as exc:
        logger.error("Gemini API error: %s", exc)
        return f"{STATIC_FALLBACK} Үндсэн шалтгаан: {dominant}."


def fallback_structured_recommendation(
    *,
    dominant_reason: str,
    reason_label: str,
    scores: dict[str, float],
    probability: float,
    top_features: list[dict[str, Any]] | None = None,
    events: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    # Gemini API key байхгүй, timeout болох, эсвэл invalid JSON буцаах үед энэ fallback хэрэглэгдэнэ.
    # Fallback нь fake insight биш; зөвхөн S1-S7 score болон probability contract дээр тулгуурласан deterministic текст.
    evidence = [
        f"Гол шалтгаан нь {dominant_reason} ({reason_label}) байна.",
        f"Орхих магадлал {probability:.2f} байна.",
    ]
    for item in (top_features or [])[:2]:
        feature = item.get("feature")
        if feature:
            evidence.append(f"Моделийн чухал дохио: {feature}.")
    if events:
        evidence.append(f"Үйл явдлын дараалал {len(events)} бүртгэгдсэн үйлдэл агуулж байна.")

    return {
        "title": f"{reason_label} засах",
        "summary": (
            f"Энэхүү сессийг {dominant_reason} - {reason_label} хүчин зүйл хамгийн хүчтэй тайлбарлаж байна. "
            "Нотолгоог хянаж, хамгийн их саад болж буй хүчин зүйлийг арилган, өөрчлөлтийн дараах хөрвүүлэлтийн хувийг хэмжинэ үү."
        ),
        "reason_code": dominant_reason,
        "priority": "high" if probability >= 0.75 else "medium" if probability >= 0.5 else "low",
        "effort": "medium",
        "expected_impact": "Сагс орхилтыг бууруулж, төлбөр төлөх шатны хөрвүүлэлтийг сайжруулна.",
        "evidence": evidence,
        "action_steps": [
            "Гол шалтгаантай холбоотой төлбөр төлөх эсвэл сагсны алхмыг шалгах.",
            "UX эсвэл мессежийн нэг тодорхой өөрчлөлт хийх.",
            "Өөрчлөлтийн өмнөх ба дараах сагс орхилтын хувийг харьцуулах.",
        ],
        "warning": "Gemini API тохируулагдаагүй эсвэл буруу хариу ирүүлсэн тул fallback дүрмээр үүсгэгдсэн.",
        "source": "fallback",
    }


def generate_structured_recommendation(
    *,
    dominant_reason: str,
    reason_label: str,
    scores: dict[str, float],
    probability: float,
    top_features: list[dict[str, Any]] | None = None,
    events: list[dict[str, Any]] | None = None,
    cart_summary: dict[str, Any] | None = None,
    device_info: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Dashboard card-д зориулсан recommendation JSON буцаана; Gemini амжилтгүй бол fallback хэрэглэнэ."""

    fallback = fallback_structured_recommendation(
        dominant_reason=dominant_reason,
        reason_label=reason_label,
        scores=scores,
        probability=probability,
        top_features=top_features,
        events=events,
    )
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if not api_key:
        return fallback

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        prompt = f"""
You are an ecommerce conversion analyst.

Generate a practical recommendation for a shop owner based only on the provided session diagnosis.
Do not invent data. If evidence is insufficient, say that evidence is insufficient.
Return business-friendly Mongolian text. Return valid JSON only.

Input:
- dominant_reason: {dominant_reason}
- reason_label: {reason_label}
- S1-S7 scores: {scores}
- abandonment_probability: {probability}
- top_features: {top_features or []}
- event_timeline: {events or []}
- cart_summary: {cart_summary or {}}
- device_info: {device_info or {}}

Return schema:
{{
  "title": "short recommendation title",
  "summary": "one paragraph explanation",
  "reason_code": "S1|S2|S3|S4|S5|S6|S7",
  "priority": "low|medium|high",
  "effort": "low|medium|high",
  "expected_impact": "what KPI may improve",
  "evidence": ["evidence point 1", "evidence point 2"],
  "action_steps": ["step 1", "step 2", "step 3"],
  "warning": "limitation or empty string"
}}
""".strip()
        resp = client.models.generate_content(model="gemini-1.5-flash", contents=prompt)
        text = (getattr(resp, "text", None) or str(resp)).strip()
        parsed = json.loads(text)
        if not isinstance(parsed, dict):
            return fallback
        parsed["source"] = "gemini"
        parsed.setdefault("reason_code", dominant_reason)
        parsed.setdefault("warning", "")
        return parsed
    except Exception as exc:
        logger.error("Gemini structured recommendation error: %s", exc)
        return fallback
