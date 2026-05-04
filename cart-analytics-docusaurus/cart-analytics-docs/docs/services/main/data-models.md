---
id: data-models
title: Main — Өгөгдлийн загвар
sidebar_label: Data Models
---

# Өгөгдлийн загвар

## Үндсэн загварууд

| Model | Үндсэн талбарууд |
|-------|-----------------|
| `Tenant` | name, domain (unique), status, tier (basic/smart/full) |
| `APIKey` | tenant FK, key_hash (SHA-256), tier, is_active |
| `TeamMember` | tenant FK, user FK, role (admin/owner/member/developer) |
| `Session` | session_id (unique), visitor_id, tenant FK, event_count |
| `PredictionResult` | session OneToOne, prediction_score, predicted_class, shap_values JSONB |
| `VisitorOutcome` | session OneToOne, actual_abandoned |
| `Diagnosis` | tenant FK, session_id, score_s1~score_s7, status |
| `Recommendation` | diagnosis OneToOne, text_mn (Монгол), status |
| `ProcessedSession` | observer_session_id (unique) — idempotency guard |

## Хэрэглэгчийн дүрүүд (Roles)

| Дүр | Тайлбар |
|-----|---------|
| `owner` | Бүрэн эрх — recommendation хэрэгжүүлж болно |
| `member` | Recommendation хэрэгжүүлж болно |
| `developer` | Recommendation хэрэгжүүлэх **хориотой** |
| `admin` | Django admin хандалт |
| `viewer` | Read-only (default fallback) |

## DuckDB

`analytics.duckdb` файлд `predictions`, `sessions_summary` хүснэгт хадгалагдана.

## Observer DB (read-only)

Тусдаа PostgreSQL connection — `raw_events` хүснэгтийг зөвхөн **унших** зорилгоор ашиглана.
