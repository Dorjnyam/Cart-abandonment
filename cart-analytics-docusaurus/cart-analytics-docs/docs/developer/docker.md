---
title: Docker ажиллуулах
---

# Docker ашиглан ажиллуулах

Prerequisites:

- Docker Engine ажиллаж байх
- Node.js 20+ docs build-д
- Python local test-д

Commands:

```bash
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose down -v
```

Health endpoints:

- Main: `http://localhost:8000/api/health/`
- Observer: `http://localhost:8001/health`
- Session: `http://localhost:8002/health`
- Feature: `http://localhost:8003/health`
- ML: `http://localhost:8004/health`
