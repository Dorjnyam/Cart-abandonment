# 10 use case E2E баталгаажуулалтын товч тайлан

- Ажиллуулсан огноо: `2026-05-13T18:39:27.504136+00:00`
- Run ID: `20260513183927`
- Эцсийн үр дүн: `PASS`
- Орчин: local Docker, defense/demo readiness. Бодит хэрэглэгчийн production баталгаа биш.
- Dataset: synthetic/simulated thesis MVP dataset. Бодит customer behavior биш.
- Gemini тохируулаагүй үед recommendation нь deterministic fallback logic байна.
- Converted session дээр S1-S7 болон recommendation хоосон байх нь зөв behavior.

## Use case үр дүн

| # | Use case | Outcome | Dominant | Recommendation | Result |
|---|---|---|---|---|---|
| 1 | Техникийн алдаатай checkout орхилт | `abandoned` | `S2` | Fix technical friction | `PASS` |
| 2 | Цэвэр амжилттай худалдан авалт | `converted` | `хоосон` | хоосон | `PASS` |
| 3 | Үнэ, хүргэлтийн зардалд мэдрэмтгий орхилт | `abandoned` | `S5` | Fix price sensitivity | `PASS` |
| 4 | Сэтгэлзүйн эргэлзээтэй орхилт | `abandoned` | `S1` | Fix psychological hesitation | `PASS` |
| 5 | Итгэлцэл, төлбөрийн эргэлзээтэй орхилт | `abandoned` | `S3` | Fix trust issue | `PASS` |
| 6 | Мобайл хэрэглээний саадтай орхилт | `abandoned` | `S4` | Fix mobile usability issue | `PASS` |
| 7 | Хайлт, шүүлтүүрийн эргэлзээтэй орхилт | `abandoned` | `S6` | Fix indecision/navigation disorder | `PASS` |
| 8 | Гадны эх сурвалжийн нөлөөтэй орхилт | `abandoned` | `S7` | Fix external influence/referral effect | `PASS` |
| 9 | Сагс засварлах давтамж өндөр орхилт | `abandoned` | `S6` | Fix indecision/navigation disorder | `PASS` |
| 10 | Купоны дараа сэргэсэн худалдан авалт | `converted` | `хоосон` | хоосон | `PASS` |

## Тайлбар

- `PASS` гэдэг нь Observer event хүлээн авсан, Session aggregate үүссэн, Feature vector ML рүү очсон, ML prediction Main-д хадгалагдсан, Dashboard API гэрээ зөв буцсан гэсэн утгатай.
- Abandoned session бүр дээр `diagnosis.scores.S1..S7` 0..1 хооронд байна, dominant reason нь тухайн use case-ийн хүлээлттэй таарсан байна.
- Converted session дээр Main service business truth-ийг хамгаалж `diagnosis=null`, `recommendation=null` буцаана.
