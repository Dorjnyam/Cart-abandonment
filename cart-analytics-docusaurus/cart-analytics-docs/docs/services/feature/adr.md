---
id: adr
title: Feature — Архитектурын шийдвэрүүд
sidebar_label: ADR
---

# Архитектурын шийдвэрүүд (ADRs)

## Ablation variants (A/B/C/D) + FEATURE_SET

ML ablation study-д зориулсан — env var-аар тохируулдаг тул code өөрчлөлтгүйгээр feature set-ийг солих боломжтой.

## mongolian_trust_barrier

Монголын e-commerce-д зориулсан онцлог feature — итгэмжлэгдэхгүй payment method + нэвтрэлтгүй + өмнөх cart abandon байвал тэмдэглэдэг.

## Pydantic extra='ignore'

Session Service-ийн нэмэлт internal field-үүдийг чимээгүй орхидог — forward/backward compatibility хадгалагдана.

## DLQ байхгүй

Failed message log бичиж орхидог. **Ирээдүйн сайжруулалт:** Kafka dead-letter queue нэмэх.

## Schema contract

`schemas/feature_ready.json` — field нэмэх/хасахад `EXPECTED_FEATURE_COUNT` шинэчлэх ёстой (`features/__init__.py`).
