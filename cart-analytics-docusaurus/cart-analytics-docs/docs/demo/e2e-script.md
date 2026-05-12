---
title: E2E script
---

# E2E script

Final verification:

```bash
docker compose down -v
docker compose up --build -d
docker compose ps
python scripts/audit/e2e_three_use_cases.py
```

Script нь health check, login, UC1/UC2/UC3 event send, dashboard API verification, model artifact evidence-ийг шалгана.
