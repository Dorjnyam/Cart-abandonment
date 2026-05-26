---
title: 10 use case баталгаажуулалт
---

# 10 use case баталгаажуулалт

Энэ хуудас нь дипломын хамгаалалтын үед бүх pipeline production-like local Docker орчинд ажиллаж байгааг нотлох 10 deterministic use case-ийг тайлбарлана. Энэ нь бодит хэрэглэгчийн production performance биш. ML dataset нь synthetic/simulated thesis MVP өгөгдөл бөгөөд recommendation нь `GEMINI_API_KEY` тохируулаагүй үед deterministic fallback logic ашиглана.

## Ажиллуулах команд

```bash
docker compose config
docker compose up --build -d
python scripts/audit/e2e_ten_use_cases.py
```

Script дараах бүх дамжлагыг шалгана:

1. Observer `/track` event бүрийг авна.
2. Session service event-үүдийг нэг session болгон aggregate хийнэ.
3. Feature service `feature_ready` payload үүсгэнэ.
4. ML service XGBoost prediction, SHAP/top feature гаргана.
5. Main service prediction хадгалж, abandoned session дээр S1-S7 diagnosis болон recommendation үүсгэнэ.
6. Dashboard API session detail, recommendation status, overview data буцаана.

## Use case жагсаалт

| # | Use case | Хүлээгдэж буй үр дүн | S1-S7 / recommendation |
|---|---|---|---|
| 1 | Техникийн алдаатай checkout орхилт | `abandoned` | Dominant `S2` эсвэл `S4`, recommendation байна |
| 2 | Цэвэр амжилттай худалдан авалт | `converted` | S1-S7 байхгүй, recommendation байхгүй |
| 3 | Үнэ, хүргэлтийн зардалд мэдрэмтгий орхилт | `abandoned` | Dominant `S5`, recommendation байна |
| 4 | Сэтгэлзүйн эргэлзээтэй орхилт | `abandoned` | Dominant `S1`, recommendation байна |
| 5 | Итгэлцэл, төлбөрийн эргэлзээтэй орхилт | `abandoned` | Dominant `S3`, recommendation байна |
| 6 | Мобайл хэрэглээний саадтай орхилт | `abandoned` | Dominant `S4`, recommendation байна |
| 7 | Хайлт, шүүлтүүрийн эргэлзээтэй орхилт | `abandoned` | Dominant `S6`, recommendation байна |
| 8 | Гадны эх сурвалжийн нөлөөтэй орхилт | `abandoned` | Dominant `S7`, recommendation байна |
| 9 | Сагс засварлах давтамж өндөр орхилт | `abandoned` | Dominant `S6` эсвэл `S5`, recommendation байна |
| 10 | Купоны дараа сэргэсэн худалдан авалт | `converted` | S1-S7 байхгүй, recommendation байхгүй |

## Validation дүрэм

Abandoned use case бүр дээр:

- `prediction.business_outcome=abandoned`
- `session_state=ABANDONED`
- `diagnosis.scores.S1..S7` бүгд байна
- S1-S7 score бүр `0..1` хооронд байна
- `dominant_reason` тухайн use case-ийн хүлээлттэй таарна
- `recommendation` үүссэн байна

Converted use case бүр дээр:

- `prediction.business_outcome=converted`
- `session_state=CONVERTED`
- `has_purchase_success=true`
- `diagnosis=null`
- `recommendation=null`
- ML abandoned гэж таамагласан бол Main service business outcome override хийсэн байна

## Evidence файлууд

Ажиллуулсны дараа дараах файлууд үүснэ:

```text
docs/defense_evidence/e2e_ten_use_cases_result.json
docs/defense_evidence/e2e_ten_use_cases_output.txt
docs/defense_evidence/e2e_ten_use_cases_summary_mn.md
docs/defense_evidence/ten_uc01_technical_checkout_abandonment_dashboard_api.json
...
docs/defense_evidence/ten_uc10_coupon_recovered_purchase_dashboard_api.json
```

`e2e_ten_use_cases_summary_mn.md` нь хамгаалалтын үед хурдан унших товч тайлан. `e2e_ten_use_cases_result.json` нь бүх raw response, health check, dashboard detail, recommendation status transition-г хадгалдаг.

## Чухал тайлбар

Converted session дээр S1-S7 болон recommendation хоосон байх нь алдаа биш. Худалдан авалт амжилттай болсон session дээр abandonment diagnosis үүсгэхгүй байх нь Main service-ийн бизнесийн дүрэм юм.

Abandoned session дээр S1-S7 эсвэл recommendation хоосон байвал pipeline дутуу ажилласан гэж үзнэ.
