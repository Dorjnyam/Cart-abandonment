---
title: Troubleshooting
---

# FAQ / Troubleshooting

| Асуудал | Шалгах зүйл |
|---|---|
| Docker engine problem | Docker Desktop/Engine ажиллаж байгаа эсэх. |
| Kafka topic problem | `docker compose logs kafka kafka-init`. |
| lz4 codec problem | Observer gzip compression ашиглаж байгаа эсэх. |
| Main consumer readiness | Main health `prediction_done_consumer=ok`. |
| Dashboard empty state | Main API-д real sessions байгаа эсэх, auth token зөв эсэх. |
| Gemini API unavailable | Fallback recommendation ажиллана; энэ нь expected behavior. |
