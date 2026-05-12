---
title: Сургалтын өгөгдөл
---

# Сургалтын өгөгдөл

Training pipeline нь `data/sessions.csv` synthetic/simulated dataset дээр ажилладаг.

```bash
python ml/scripts/train.py --dataset data/sessions.csv --output ml/models/xgb_cart_abandonment.joblib
```

Анхаарах зүйл:

- Dataset нь 1200 simulated session.
- Real customer validation хийгдээгүй.
- Outcome columns feature_order-оос хасагдсан.
- Metric-ийг production performance гэж тайлбарлаж болохгүй.
