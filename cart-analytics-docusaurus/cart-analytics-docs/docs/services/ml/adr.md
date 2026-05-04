---
id: adr
title: ML — Архитектурын шийдвэрүүд
sidebar_label: ADR
---

# Архитектурын шийдвэрүүд (ADRs)

## XGBoost сонгосон шалтгаан

Tabular session feature-д хурдан inference, SHAP explainability-тай нийцтэй, missing value-ийг зохицдог.

## LSTM optional ensemble

Event sequence data-д зориулсан. 4-аас доош event байвал эсвэл model файл байхгүй бол алгасна (graceful degradation).

## Fail-fast consumer

`SystemExit(1)` ашиглан supervisor/orchestrator-д дахин эхлүүлэх дохио өгдөг — чимээгүй degradation-аас сайн.

## Manual Kafka commit

At-least-once delivery — failed prediction offset ахиулахгүй тул дахин унших боломжтой.

## Ensemble weight тохируулах боломжтой

`ENSEMBLE_WEIGHT_XGBOOST=0.7`, `ENSEMBLE_WEIGHT_LSTM=0.3` — env var-аар тохируулдаг.

## Changelog / Breaking Change

`prediction_done_v2` нэмэгдсэн:
- `visitor_id` нэмэгдсэн
- `predicted_class` enum (`abandoned`/`converted`)
- `confidence` label нэмэгдсэн
- `abandon_probability` → `prediction_score` болж өөрчлөгдсөн

**Legacy `prediction_done` consumers нь `prediction_done_v2` руу шилжих зөвлөмж.**
