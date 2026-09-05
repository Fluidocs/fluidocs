FROM python:3.13-slim-bookworm

COPY --from=docker.io/astral/uv:latest /uv /uvx /usr/local/bin/

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-por \
        libgl1 \
        libglib2.0-0 \
        netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev --no-install-project

COPY . .

RUN uv sync --frozen --no-dev

EXPOSE 8000

CMD ["uv", "run", "backend"]