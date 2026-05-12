---
title: MVP баталгаажуулалт
---

# MVP баталгаажуулалт

Cleanup эхлэхээс өмнө дараах baseline шалгалтууд pass болсон.

| Area | Command | Төлөв |
|---|---|---|
| Docker config | `docker compose config --quiet` | PASS |
| Main | `python -m pytest -q` | PASS |
| Observer | `python -m pytest -q` | PASS |
| Session | `python -m pytest -q` | PASS |
| Feature | `python -m pytest -q` | PASS |
| ML | `python -m pytest -q` | PASS |
| Dashboard | `npm run lint && npm run build` | PASS |
| Demo ecommerce | `npm run lint && npm run build` | PASS, lint warning-ууд baseline-д байсан |
| E2E | `python scripts/audit/e2e_three_use_cases.py` | PASS |

Evidence файлууд `docs/cleanup_baseline/` болон `docs/defense_evidence/` хавтаснуудад хадгалагдана.
