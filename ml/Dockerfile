FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Use the PyTorch CPU-only index as the primary source so torch is resolved
# there (no CUDA deps); every other package falls through to PyPI via
# --extra-index-url.  A two-step install risks pip re-resolving torch from
# PyPI in the second pass and replacing the CPU wheel with the 2.6 GB CUDA one.
RUN pip install --no-cache-dir \
      --index-url https://download.pytorch.org/whl/cpu \
      --extra-index-url https://pypi.org/simple \
      -r requirements.txt

COPY app/ app/
COPY viewer.html viewer.html

# Run as non-root for container security best practice.
RUN useradd --create-home --shell /bin/bash appuser
USER appuser

EXPOSE 8004

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8004/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004", "--workers", "1"]
