---
id: configuration
title: Feature — Тохиргоо
sidebar_label: Тохиргоо
---

# Тохиргоо

| Хувьсагч | Үндсэн утга | Тайлбар |
|----------|------------|---------|
| `KAFKA_BOOTSTRAP` | `kafka:9092` | Kafka broker |
| `SESSION_ENRICHED_TOPIC` | `session_enriched` | Оролтын topic |
| `FEATURE_READY_TOPIC` | `feature_ready` | Гаралтын topic |
| `FEATURE_CONSUMER_GROUP` | `feature-svc-group` | Consumer group ID |
| `FEATURE_VERSION` | `1.0.0` | Feature vector хувилбар |
| `FEATURE_VARIANT` | `C` | Ablation variant: A, B, C, D |
| `FEATURE_SET` | `full` | `baseline` (9), `extended` (~29), `full` (76) |
| `PORT` | `8003` | HTTP sidecar port |
| `QUARTILE_BOUNDARIES` | `50.0,150.0,300.0` | Cart value quartile threshold |
| `HEDONIC_CATEGORIES` | `fashion,beauty,...` | Hedonic category-үүд |
| `TRUSTED_PAYMENT_METHODS` | `qpay,socialpay` | Итгэмжлэгдсэн payment method |
| `FRUSTRATION_WEIGHTS` | `0.35,0.30,0.20,0.15` | rage_click, back_nav, js_error, cart_churn жин |
