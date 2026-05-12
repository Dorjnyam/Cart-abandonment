---
title: Зөвлөмж үүсгэх логик
---

# Зөвлөмж үүсгэх логик

Main service abandoned diagnosis үүссэний дараа recommendation үүсгэнэ.

- Gemini API key байгаа бол structured JSON зөвлөмж үүсгэхийг оролдоно.
- Gemini unavailable, timeout, invalid JSON бол deterministic fallback хэрэглэнэ.
- Converted UC2 дээр recommendation үүсэхгүй.
- Recommendation status-г dashboard endpoint-р `new`, `in_progress`, `done`, `dismissed` болгож шинэчилнэ.

Fallback нь fake dashboard data биш. Энэ нь бодит S1-S7 score болон prediction probability дээр тулгуурласан deterministic текст юм.
