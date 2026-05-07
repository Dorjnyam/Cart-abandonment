# Dashboard Audit

| Page/Component | API source | Real data? | Mock guarded? | S1-S7 correct? | Recommendation correct? | Status | Gap |
|----------------|------------|------------|---------------|----------------|-------------------------|--------|-----|
| Overview/dashboard | `dashboard-mvp.ts` Main API | Yes for core KPI path | Yes for MVP service | Labels from API | N/A | PASS static | Runtime UI not screenshot-verified |
| Sessions list | `dashboard-mvp.ts` | Yes | Yes | N/A | N/A | PASS static | UC1 missing from backend |
| Session detail | `/api/dashboard/sessions/:id/` | Yes if backend has row | Yes in MVP service | Uses API | Uses API | FAIL runtime for UC1 | UC1 404; UC2 wrong abandoned state |
| Diagnosis page | Main diagnosis API | Mostly yes | Mixed | Some stale local labels | N/A | PARTIAL | `REASON_BLURB` and constants drift |
| Diagnosis detail | local defaults/API mix | No guarantee | No | `DEFAULT_SCORES` static | Static feature rows | FAIL audit | Remove unguarded default scores |
| Recommendations | Main recommendations API | Yes core path | Yes in MVP service | N/A | Shows persisted source if mapped | PASS partial | Status PATCH not E2E verified |
| Integration/snippet | Main/API key services | Yes/static snippet | N/A | N/A | N/A | PASS static | Needs live snippet browser proof |
| Pipeline page/service | `pipeline.ts` | API then mock on error | FAIL | N/A | N/A | FAIL | Mock returned on API catch without env guard |
| ML insights | `mlInsights.ts` | API then mock on error | FAIL | N/A | N/A | FAIL | Mock has production-looking claims |

Dashboard cannot be defended as fully real-data complete until the backend E2E failures are fixed and normal-mode mock fallbacks are removed from auxiliary services.
