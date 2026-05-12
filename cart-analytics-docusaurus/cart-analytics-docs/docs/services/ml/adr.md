---
id: adr
title: ML архитектурын шийдвэрүүд
sidebar_label: ADR
---

# Архитектурын шийдвэрүүд

## XGBoost сонгосон шалтгаан

Tabular session feature дээр хурдан inference хийдэг, feature order contract нь тодорхой, MVP synthetic dataset дээр reproducible metric гарсан тул XGBoost active model болсон.

## LSTM future work

LSTM нь event sequence modeling-ийн дараагийн судалгааны чиглэл. Энэ MVP дээр LSTM active inference биш, ensemble weight ашиглахгүй, deployed/evaluated LSTM artifact байхгүй.

## Manual Kafka commit

ML consumer амжилттай publish хийсний дараа offset commit хийх ёстой. Publish failure үед message replay боломжтой байх нь pipeline reliability-д хэрэгтэй.

## Prediction contract

`prediction_done` payload нь `session_state`, `has_purchase_success`, `final_event_type` metadata-г дамжуулна. Main service эдгээр metadata-г ашиглан UC2 converted protection хийдэг.
