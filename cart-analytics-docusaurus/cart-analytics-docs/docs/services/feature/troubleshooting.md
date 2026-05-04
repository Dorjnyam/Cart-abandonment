---
id: troubleshooting
title: Feature — Алдааны шийдэл
sidebar_label: Troubleshooting
---

# Алдааны шийдэл

| Нөхцөл | Шийдэл |
|--------|--------|
| Kafka холбогдохгүй | `KAFKA_BOOTSTRAP` тохиргоо болон broker health шалгах |
| Malformed session_enriched | Pydantic validation алдаа — session алгасна, `failed` counter шалгах |
| 3 retry хэтэрсэн | DLQ байхгүй — мессеж алдагдана, log шалгах |

```bash
# Status шалгах
curl http://localhost:8003/viewer/status
# stats.failed, runtime.last_error, connections.kafka харах
```
