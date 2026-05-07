# Dead Code And Duplicate Logic

| Area | Evidence | Status | Risk | Fix |
|------|----------|--------|------|-----|
| S1-S7 scoring | `main_service/apps/analytics/s1_s7.py::calculate_s1_s7`; wrappers in `apps/analytics/scoring.py`, `apps/diagnosis/scoring.py` | Canonical implementation exists in Main | Low, if wrappers remain compatibility-only | Keep `s1_s7.py` as the only formula owner and test wrappers against it |
| LSTM | `ml/app/pipeline.py::lstm_loaded` returns false; `ml/app/lstm_model.py` present | Future work only | Medium documentation risk | Thesis must say LSTM is not active |
| Dashboard diagnosis detail defaults | `cart_analytic/src/app/diagnosis/[id]/page.tsx` `DEFAULT_SCORES` | Static fallback exists | Medium: can show non-persisted scores in a detail view | Replace with empty/error state unless `NEXT_PUBLIC_MOCK_FALLBACK=true` |
| Dashboard pipeline mock | `cart_analytic/src/lib/services/pipeline.ts` catch returns `MOCK_PIPELINE` | Mock can appear after API failure | High for thesis demo honesty | Gate catch fallback behind `NEXT_PUBLIC_MOCK_FALLBACK=true` |
| Dashboard ML insights mock | `cart_analytic/src/lib/services/mlInsights.ts` catch returns `MOCK_INSIGHTS` | Mock can appear after API failure | High: includes production-looking dataset claim | Gate behind mock flag and remove production wording |
| Stale reason labels | `cart_analytic/src/lib/constants.ts`, `cart_analytic/src/app/diagnosis/page.tsx` blurbs | Some labels do not match canonical S1-S7 | Medium | Import one canonical label map |
| Stale ML docs | `observer_experiment/documentation/services/05-ml-prediction-service.md` | Claims XGBoost+LSTM ensemble | High thesis risk | Rewrite as XGBoost-only MVP and LSTM future work |
