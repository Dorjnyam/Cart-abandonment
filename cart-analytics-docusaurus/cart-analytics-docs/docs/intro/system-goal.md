---
title: Системийн зорилго
slug: /
---

# Сагс орхилтын шалтгаан шинжилгээний систем

Энэхүү систем нь цахим худалдааны хэрэглэгчийн үйлдлийн урсгалын өгөгдлийг цуглуулж, сессийн түвшинд боловсруулан, сагс орхих магадлал болон давамгай шалтгааныг тодорхойлох дипломын ажлын MVP хэрэгжүүлэлт юм.

Систем нь Observer, Session, Feature, ML, Main service болон Analytics Dashboard гэсэн үндсэн бүрэлдэхүүнүүдээс бүрдэнэ. Үйлдлийн өгөгдөл Observer сервисээр дамжин Kafka topic-уудаар шат дараалан боловсруулагдаж, XGBoost загварын таамаглал, S1-S7 оношлогоо, зөвлөмж хэлбэрээр dashboard дээр харагдана.

## Баталгаажсан MVP урсгалууд

| Use case | Үр дүн |
|---|---|
| UC1 Technical/mobile abandonment | ABANDONED, S2 Technical friction |
| UC2 Converted purchase | CONVERTED, abandonment diagnosis үүсэхгүй |
| UC3 Price-sensitive abandonment | ABANDONED, S5 Price sensitivity |

> Анхаарах зүйл: XGBoost F1 = 0.8279 үр дүн нь 1200 сесс бүхий synthetic/simulated өгөгдөл дээр гарсан MVP туршилтын үр дүн юм. Энэ нь бодит хэрэглэгчийн өгөгдөл дээрх гүйцэтгэлийн бүрэн баталгаа биш.
