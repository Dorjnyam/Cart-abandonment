---
title: Defense-ready production-like checklist
---

# Defense-ready production-like checklist

Энэ checklist нь системийг дипломын хамгаалалтад production-like байдлаар үзүүлэхэд зориулагдсан. Энэ нь бодит customer production rollout-ийн баталгаа биш. Бодит production-д real user validation, secret rotation, monitoring, backup, load test, privacy review, tenant isolation audit нэмэлтээр хийгдэх ёстой.

## Readiness зорилго

Систем дараах гол асуултад нотолгоотой хариулах ёстой:

- Event ecommerce storefront-оос Observer руу орж байна уу?
- Session service event-үүдийг зөв нэг session болгон aggregate хийж байна уу?
- Feature service ML-д шаардлагатай feature vector үүсгэж байна уу?
- ML service XGBoost prediction болон SHAP/top feature гаргаж байна уу?
- Main service business outcome-г хамгаалж, abandoned session дээр S1-S7 diagnosis үүсгэж байна уу?
- Dashboard API session detail, recommendation, overview-г бодит persisted өгөгдлөөс харуулж байна уу?

## Заавал ажиллуулах шалгалтууд

```bash
docker compose config
docker compose up --build -d
docker compose ps
python -m pytest -q main_service/apps/analytics/test_s1_s7.py main_service/apps/analytics/tests.py
python -m pytest -q observer_experiment/tests
python -m pytest -q session/session/tests
python -m pytest -q feature/feature_svc/tests
python -m pytest -q ml/tests
cd cart_analytic && npm run lint && npm run build
cd sneaker-store && npm run lint && npm run build
cd cart-analytics-docusaurus/cart-analytics-docs && npm run build
python scripts/audit/e2e_ten_use_cases.py
```

Windows PowerShell дээр directory солих командыг тус тусад нь ажиллуулж болно.

## PASS шалгуур

System defense-ready гэж үзэхийн тулд:

- Docker service бүр healthy эсвэл expected degraded биш байна.
- Main health дээр `prediction_done_consumer=ok` байна.
- 10 use case script-ийн `final_result=PASS` байна.
- Abandoned session бүр S1-S7 score болон recommendation-тэй байна.
- Converted session бүр diagnosis/recommendation-гүй байна.
- Recommendation status lifecycle `new -> in_progress -> done -> dismissed` persisted байна.
- Dashboard build, demo ecommerce build, Docusaurus build амжилттай байна.

## Known limitation

Энэ MVP дараах хязгаарлалттай:

- ML dataset нь `data/sessions.csv` synthetic/simulated өгөгдөл.
- XGBoost metric нь controlled validation metric, бодит customer conversion performance биш.
- Recommendation text нь Gemini API байхгүй үед fallback rule.
- Local Docker proof нь production scalability, uptime, backup, monitoring-г батлахгүй.
- Tenant isolation нь demo tenant UUID-аар pipeline даяар metadata дамжуулж байгаа түвшинд батлагдсан; enterprise-grade isolation proof биш.

## Evidence хадгалах дүрэм

Хамгаалалтын өмнө дараах evidence файлуудыг хадгална:

- `docs/defense_evidence/defense_evidence_summary.txt`
- `docs/defense_evidence/defense_evidence.json`
- `docs/defense_evidence/e2e_ten_use_cases_result.json`
- `docs/defense_evidence/e2e_ten_use_cases_summary_mn.md`
- `docs/defense_evidence/model_eval_run/`

Эдгээрийг thesis report-д ашиглахдаа “synthetic/simulated MVP validation” гэж тодорхой бичнэ. “Real production customer accuracy” гэж тайлбарлаж болохгүй.
