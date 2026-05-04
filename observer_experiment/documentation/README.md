---
sidebar_position: 1
title: Observer гэж юу вэ?
slug: /
---

# Observer — Вэб аналитик сервис

**Observer** нь e-commerce сайтуудад зориулагдсан хөнгөн жинтэй, нууцлалыг дээдэлсэн вэб аналитик сервис юм. Хэрэглэгчийн зан төлөв, хуудасны гүйцэтгэл, худалдааны үйл явцыг бодит цаг хугацаанд бүртгэж, PostgreSQL өгөгдлийн санд хадгална.

---

## Үндсэн онцлогууд

| Онцлог | Тайлбар |
|--------|---------|
| **Tier систем** | API түлхүүрийн угтасаар `T3 → T2 → T1` өгөгдлийн гүн тодорхойлно |
| **Хоёр замын ingest** | `POST /track` (үндсэн) + `POST /collect` (adblock тойрох) |
| **Kafka fan-out** | Event бүр `raw_events` topic-т нийтлэгдэнэ |
| **Redis queue** | `session_end` үед оношлогооны дараалалд (`ca:diagnosis:queue`) нэмнэ |
| **Field catalog** | 54 талбарын нэр, tier, sector, Монгол тайлбарыг `/api/field-catalog`-аас авна |
| **Viewer** | `/viewer` хаягаар PostgreSQL-ийн өгөгдлийг шууд харна |

---

## Хурдан эхлэх

```bash
# 1. Python хамаарлуудыг суулгах
pip install -r requirements.txt

# 2. Орчны хувьсагчдыг тохируулах
# .env файлд дараахыг заавал тохируулна:
#   DATABASE_URL=postgresql://user:pass@localhost:5432/observer_experiment
#   REDIS_URL=redis://localhost:6379/0          (заавал биш)
#   KAFKA_BOOTSTRAP_SERVERS=localhost:9092      (заавал биш)

# 3. Сервис асаах
PYTHONIOENCODING=utf-8 uvicorn observer.main:app --host 0.0.0.0 --port 8001 --reload

# 4. Ажиллаж байна уу шалгах
curl http://localhost:8001/health
# Хариу: {"status":"ok","service":"observer","kafka":{...}}
```

---

## Баримт бичгийн бүтэц

| Хэсэг | Агуулга |
|-------|---------|
| [Эхлэх](/docs/getting-started) | Суулгалт, тохиргоо, анхны тест |
| [Архитектур](/docs/architecture) | Системийн бүтэц, өгөгдлийн урсгал |
| [Integration](/docs/integration) | track.js сайтдаа оруулах заавар |
| [API лавлах](/docs/reference/api) | Бүх HTTP endpoint-ийн тайлбар |
| [Event төрлүүд](/docs/reference/events) | `event_type` утгуудын бүрэн жагсаалт |
| [Талбарын тойм](/docs/reference/fields/overview) | Tier систем, CORE/JSONB ялгаа |
| [Tier 3 талбарууд](/docs/reference/fields/tier3) | `tk_basic_*` — суурь талбарууд |
| [Tier 2 нэмэлт](/docs/reference/fields/tier2) | `tk_smart_*` — аналитик талбарууд |
| [Tier 1 нэмэлт](/docs/reference/fields/tier1) | `tk_full_*` — худалдааны нарийн талбарууд |

---

## Хэрэгтэй холбоосууд

| Зорилго | Хаяг |
|---------|------|
| Сервис ажиллаж байна уу? | `GET /health` |
| Бүх event харах | `http://localhost:8001/viewer` |
| Талбарын каталог (live JSON) | `GET /api/field-catalog` |
| API түлхүүр үүсгэх | `POST /api/keys/generate` |
| Судалгааны талбарын зураглал | [Research field map](/project-docs/research_field_map) |

---

:::note Дипломын ажлын тухай
Observer нь бакалаврын дипломын ажлын туршилтын сервис бөгөөд Монгол e-commerce хэрэглэгчийн зан төлөвийн судалгаанд ашиглагдаж байна. Судалгааны зорилтот профайл: 62 талбараас 47-г хадгалах, үлдсэнийг feature pipeline-д шилжүүлэх.
:::
