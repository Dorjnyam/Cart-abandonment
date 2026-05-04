from decimal import Decimal

from django.conf import settings


def _dominant_to_text(dominant_key: str) -> str:
    # dominant_key expected: 's1'...'s7'
    key = (dominant_key or '').lower()
    mapping = {
        's1': 'С1: Сагслах/сонирхол таталт сул байгаатай холбоотой',
        's2': 'С2: Техникийн саад (rage_click/JS error/checkout friction)',
        's3': 'С3: Төлбөрийн асуудал (payment bounce)',
        's4': 'С4: Мобайл дээрх checkout асуудал',
        's5': 'С5: Хайлт/фильтр/эрэмбийн төөрөгдөл',
        's6': 'С6: Оргилж төөрөх/богино хугацааны оролт',
        's7': 'С7: Нийгмийн эх үүсвэр + outbound',
    }
    return mapping.get(key, f'{dominant_key.upper()} давамгай')


def generate_recommendation_mn(*, diagnosis, features: dict, scores: dict, tenant) -> str:
    """
    WF-07: Gemini API call + Mongolian recommendation.
    Fallback is used when GEMINI_API_KEY is missing or API call fails.
    """
    dominant_key = scores.get('dominant_key') or ''
    dominant_text = _dominant_to_text(dominant_key)

    fallback = (
        f"Таны сүүлийн сесс дээр давамгай илэрсэн шалтгаан: {dominant_text}.\n"
        "Дараах алхмуудыг туршаад үзээрэй:\n"
        "1) Хуудасны ачаалалт/алдааг (JS error, rage_click) сайжруулах\n"
        "2) Checkout урсгалыг богиночилж, шаардлагагүй алхмыг арилгах\n"
        "3) Фильтр/эрэмбийн сонголтуудыг тодорхой болгож, хэрэглэгчийг төөрүүлэхээ багасгах\n"
        "Хэрвээ боломжтой бол A/B тест хийж, KPI (conversion rate, abandonment rate)-г хэмжээрэй."
    )

    api_key = getattr(settings, 'GEMINI_API_KEY', '') or ''
    if not api_key:
        return fallback

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        prompt = f"""
Чи e-commerce UX шинжээч. Дэлгүүр: {tenant.name} ({tenant.domain})

Дараах оноонууд (0..1):
S1={scores.get('s1')}, S2={scores.get('s2')}, S3={scores.get('s3')}, S4={scores.get('s4')}, S5={scores.get('s5')}, S6={scores.get('s6')}, S7={scores.get('s7')}
Давамгай шалтгаан: {dominant_text}

Feature дэлгэрэнгүй (хялбаршуулсан):
{features}

Даалгавар:
1) Монгол хэл дээр зөвлөмж өг.
2) Дээрх давамгай шалтгаанд чиглэсэн 3 зөвлөмж (bullet) бич.
3) Дараагийн алхамууд (steps) 3 алхмаар жагсаа.
4) Хэмжих KPI-уудыг 1-2 өг.
Формат: Загваргүйгээр цэвэр text.
""".strip()

        resp = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
        )

        text = getattr(resp, 'text', None)
        if not text:
            # Best-effort extraction for differing SDK response shapes.
            text = str(resp)
        return text if text.strip() else fallback
    except Exception:
        return fallback

