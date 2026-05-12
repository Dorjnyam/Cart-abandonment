---
title: Tenant isolation limitation
---

# Tenant isolation limitation

MVP нь demo tenant UUID ашиглан pipeline даяар tenant metadata дамжуулна. Энэ нь thesis demo-д хангалттай боловч production-grade tenant isolation proof биш.

Future work:

- Cross-service authorization audit.
- Per-tenant Kafka/DB access boundary.
- API key rotation, revocation, audit log.
