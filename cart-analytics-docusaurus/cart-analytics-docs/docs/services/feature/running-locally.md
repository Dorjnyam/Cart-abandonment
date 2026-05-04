---
id: running-locally
title: Feature — Локалд ажиллуулах
sidebar_label: Локалд ажиллуулах
---

# Локалд ажиллуулах

```bash
# 1. Dependency суулгах
pip install -r requirements.txt

# 2. .env тохируулах
# KAFKA_BOOTSTRAP=localhost:9092

# 3. Ажиллуулах
python main.py
```

- **Локал URL:** http://localhost:8003
- **Debug viewer:** http://localhost:8003/viewer
- Migration болон seed data шаардлагагүй — stateless worker
