# Cleanup өмнөх архитектурын тэмдэглэл

Энэ файл нь refactor хийхээс өмнөх бодит төлөвийг баримтжуулна. 2026-05-08-ны baseline run-аар unit test, frontend build, Docker runtime, UC1/UC2/UC3 E2E урсгалууд амжилттай ажилласан.

## Baseline үр дүн

| Шалгалт | Төлөв | Тайлбар |
|---|---:|---|
| `docker compose config --quiet` | PASS | Compose syntax зөв байна. |
| `main_service` pytest | PASS | 29 test pass, warning нь одоогийн baseline-д байсан. |
| `observer_experiment` pytest | PASS | 52 test pass. |
| `session/session` pytest | PASS | 23 test pass. |
| `feature/feature_svc` pytest | PASS | 14 test pass. |
| `ml` pytest | PASS | 8 test pass. |
| `cart_analytic` lint/build | PASS | Next.js build pass. |
| `sneaker-store` lint/build | PASS with warnings | Lint warning-ууд өмнөх baseline-д байсан, error биш. |
| Docker runtime + E2E | PASS | `final_result = PASS`. UC1/UC2/UC3 баталгаажсан. |

## Runtime тэмдэглэл

Docker compose up үеэр Windows Docker pipe-ийн transient warning гарсан:

```text
http2: server: error reading preface from client //./pipe/docker_engine: file has already been closed
```

Гэхдээ container-ууд босч, health endpoints OK болж, `scripts/audit/e2e_three_use_cases.py` эцэстээ `PASS` буцаасан. Иймээс энэ warning нь cleanup-аас үүссэн regression биш, baseline орчны тэмдэглэл гэж үзнэ.

## Verified defense-critical урсгал

| Use case | Хүлээгдсэн баталгаажсан үр дүн |
|---|---|
| UC1 technical/mobile abandonment | `ABANDONED`, давамгай шалтгаан `S2 Technical friction`, prediction/diagnosis/recommendation persisted. |
| UC2 converted purchase | `CONVERTED`, `has_purchase_success=true`, ML abandoned conflict override хийгдсэн, diagnosis/recommendation үүсээгүй. |
| UC3 price-sensitive abandonment | `ABANDONED`, давамгай шалтгаан `S5 Price sensitivity`, prediction/diagnosis/recommendation persisted. |

## Cleanup scope

Энэ repo аль хэдийн thesis MVP байдлаар ажиллаж байгаа тул cleanup нь дараах зарчмаар хязгаарлагдана.

- Behavior-preserving өөрчлөлт л хийнэ.
- UC2 converted terminal хамгаалалтыг өөрчлөхгүй.
- XGBoost active inference contract-ийг эвдэхгүй.
- Dashboard normal mode-д fake/mock өгөгдлийг бодит мэт харуулахгүй.
- Docusaurus болон Markdown docs-д synthetic data, LSTM future work, production limitation-ыг тодорхой бичнэ.
