# Архитектурын boundary review

Энэ review нь code өөрчлөхөөс өмнө service boundary-г шалгасан тэмдэглэл юм. MVP аль хэдийн E2E pass болсон тул өндөр эрсдэлтэй folder restructure хийхээс зайлсхийж, canonical constants, contract docs, Mongolian comments, documentation polish дээр төвлөрөх нь зөв.

| Service | Current issue | Target module | Refactor needed? | Risk |
|---|---|---|---:|---|
| Main service | `apps/analytics/views.py` нь dashboard formatting, query, helper mapping, API view-ийг нэг файлд ихээр агуулж байна. | `api/`, `services/`, `repositories/`, `schemas/` гэж задлах боломжтой. | Хязгаарлагдмал: comments + canonical labels + docs. Том restructure хийхгүй. | High |
| Main service | Converted protection нь `prediction_pipeline.py` дотор төвлөрсөн боловч docstring/comment хангалтгүй. | `converted_guard` эсвэл одоогийн `should_create_abandonment_diagnosis`. | Тийм, comment/docstring нэмэх. | Low |
| Main service | `s1_s7.py`, `scoring.py`, `views.py`, `admin.py` дээр S1-S7 label naming давхцсан хэсэг байна. | `s1_s7.REASON_INFO` canonical source. | Тийм, drift үүсэхгүй талаар docs/comment нэмэх; risky admin refactor хийхгүй. | Medium |
| Observer | `observer/main.py` API validation, DB write, Redis/Kafka fan-out-ыг нэг route helper-д хийдэг. | `services/event_ingestion_service.py`, `kafka/producer.py`, `schemas/event_payload.py`. | Хязгаарлагдмал comments/docs. Current tests pass тул route rewrite хийхгүй. | Medium |
| Observer | Unknown extra field preservation нь Pydantic schema/database behavior-д тарсан. | Contract docs + schema comment. | Тийм, Mongolian comment/documentation. | Low |
| Session | Session state transition logic `assembler.py` дотор төвлөрсөн боловч state-machine нэртэй тусдаа module биш. | `session_state_machine.py`. | Том задлалт хийхгүй; converted terminal rule-г comment/docstring-оор тодруулна. | High |
| Session | `CONVERTED` timeout үед `ABANDONED` болохоос хамгаалагдсан. | Terminal state guard. | Behavior өөрчлөхгүй. | Low |
| Feature | `FeatureComputer` canonical builder болж ажиллаж байна; feature groups нэг class-д байна. | `features/*` + `feature_builder.py` + `feature_order.py`. | Хязгаарлагдмал comments/docs; feature order touching хийхгүй. | High |
| Feature | ML feature vector ба business metadata тусдаа дамжиж байна. | Contract/schema layer. | Docs/comment нэмэх. | Low |
| ML | Active pipeline XGBoost-only; `lstm_model.py` файл үлдсэн боловч active path-д ашиглагдахгүй. | `services/model_loader.py`, `prediction_service.py`, future-work docs. | LSTM active path нэмэхгүй; comments/docs. | Low |
| Dashboard | `dashboard-mvp.ts` дотор type, constants, mock, API client зэрэг хамт байна. | `types/`, `constants/`, `mappers/`, guarded mocks. | Хязгаарлагдмал: canonical S1-S7 constants import, Mongolian labels/comments. | Medium |
| Demo ecommerce | `ThesisDemoPanel.tsx` event factory, sequences, UI нэг файлд байна. | `lib/tracker/eventFactory.ts`, `useCaseEvents.ts`. | Хязгаарлагдмал: UC labels/comments, UC3 sequence. Том UI rewrite хийхгүй. | Medium |
| Docs | Existing Docusaurus docs-д stale XGBoost+LSTM ensemble claim байна. | Mongolian thesis MVP docs. | Тийм, docs rewrite/sidebars polish. | Low |

## Low-risk cleanup шийдвэр

1. Business-critical Python behavior дээр том folder move хийхгүй.
2. Main `prediction_pipeline.py`, Session `assembler.py`, Feature `FeatureComputer`, ML `PredictionPipeline` дээр Mongolian comments/docstrings нэмнэ.
3. Dashboard S1-S7 labels-ийг нэг source-оос import хийж drift-ийг бууруулна.
4. Contracts болон Docusaurus docs-оор Kafka/API payload boundaries-г Монгол хэлээр баталгаажуулна.
5. Final verification дээр unit/build/docs/E2E дахин ажиллуулна.
