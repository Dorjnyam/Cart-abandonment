FROM python:3.11-slim

WORKDIR /app

COPY session/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY session/ .
COPY viewer.html /viewer.html

RUN adduser --disabled-password --no-create-home appuser
USER appuser

EXPOSE 8002

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8002/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--loop", "uvloop"]
