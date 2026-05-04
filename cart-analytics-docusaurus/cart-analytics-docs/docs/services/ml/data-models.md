---
id: data-models
title: ML — Өгөгдлийн загвар
sidebar_label: Data Models
---

# Өгөгдлийн загвар

## PostgreSQL: predictions.predictions

| Баганы нэр | Төрөл | Тайлбар |
|-----------|-------|---------|
| `prediction_id` | UUID PK | Auto-generated |
| `session_id` | UUID | Session |
| `tenant_id` | UUID | Multi-tenant ID |
| `predicted_at` | TIMESTAMPTZ | Prediction хийгдсэн цаг |
| `window_seconds` | INTEGER | Observation window |
| `abandon_probability` | FLOAT | Score 0.0–1.0 |
| `diagnosis_category` | VARCHAR(30) | `abandoned` эсвэл `converted` |
| `shap_values` | JSONB | Top-N SHAP feature importance |
| `model_version` | VARCHAR(50) | Жишээ: `xgboost-v1` |
| `feature_vector_version` | VARCHAR(50) | Input feature version |

Index: `session_id`, `(tenant_id, predicted_at DESC)`
